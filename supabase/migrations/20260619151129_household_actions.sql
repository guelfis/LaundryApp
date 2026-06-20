-- 1. CLEANUP: Drop the old redundant tables
-- (Using CASCADE ensures any dependent views or triggers are also safely removed)
DROP TABLE IF EXISTS apartment_members CASCADE;
DROP TABLE IF EXISTS household_members CASCADE;


-- 3. CREATE TABLE: The new unified memberships table
CREATE TABLE public.memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL,
  apartment_id UUID NULL,    -- Nullable
  user_id UUID NOT NULL,
  
  household_role public.household_role NOT NULL DEFAULT 'member'::public.household_role,
  apartment_role public.apartment_role NULL DEFAULT NULL, -- Nullable
  
  joined_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),

  CONSTRAINT memberships_pkey PRIMARY KEY (id),
  CONSTRAINT memberships_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.household (id) ON DELETE CASCADE,
  CONSTRAINT memberships_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES public.apartment (id) ON DELETE CASCADE,
  CONSTRAINT memberships_user_id_auth_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT memberships_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE,

  -- Rule: Apartment role must exist if and only if apartment_id is provided
  CONSTRAINT chk_apartment_data_consistency CHECK (
    (apartment_id IS NULL AND apartment_role IS NULL) OR 
    (apartment_id IS NOT NULL AND apartment_role IS NOT NULL)
  )
) TABLESPACE pg_default;

-- 3. THE MAGIC INDEX: Enforces ONE apartment per household per user
CREATE UNIQUE INDEX unique_active_apartment_per_user_household
  ON public.memberships (user_id, household_id)
  WHERE apartment_id IS NOT NULL;

-- Standard indexes for performance
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_household ON public.memberships (household_id);

-- 6. SECURITY: Enable Row Level Security (RLS) as required by Supabase
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memberships TO service_role;

-- fix all the policies functions depending on the deleted tables:

DROP FUNCTION IF EXISTS public.join_apartment_via_token(token_id UUID);

CREATE OR REPLACE FUNCTION public.join_apartment_via_token(token_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Elevates execution authority to write records securely
AS $$
DECLARE
    invite_record RECORD;
    current_caller_id UUID := auth.uid();
BEGIN
    -- 1. Security Check: Validate active session context authentication tokens
    IF current_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: You must be logged in to claim an invitation.';
    END IF;

    -- 2. Fetch the invitation details and lock the row to prevent race conditions
    SELECT * INTO invite_record 
    FROM public.apartment_invitations 
    WHERE id = token_id AND expires_at > now()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation link is invalid or has expired';
    END IF;

    -- 3. Verify slot availability limits
    IF invite_record.current_uses >= invite_record.max_uses THEN
        RAISE EXCEPTION 'This invitation link has reached its maximum uses';
    END IF;

    -- 4. COMBINED STEP: Upsert the user directly into their membership slot
    -- If they don't exist in the household, create a new record with the apartment details.
    -- If they are already a household-only member (apartment_id IS NULL), attach them to this apartment.
    INSERT INTO public.memberships (household_id, apartment_id, user_id, household_role, apartment_role)
    VALUES (
        invite_record.household_id, 
        invite_record.apartment_id, 
        current_caller_id, 
        'member'::public.household_role,
        'member'::public.apartment_role
    )
    -- Our partial index rule 'unique_active_apartment_per_user_household' handles conflicts 
    -- if they try to occupy multiple apartments in the same household.
    ON CONFLICT (user_id, household_id) WHERE apartment_id IS NOT NULL 
    DO UPDATE SET 
        apartment_id = EXCLUDED.apartment_id,
        apartment_role = EXCLUDED.apartment_role;

    -- 5. Step 3: Increment the total usage counter metrics on the token
    UPDATE public.apartment_invitations 
    SET current_uses = current_uses + 1 
    WHERE id = token_id;

    -- 6. Return BOTH the apartment_id and household_id back to the frontend window
    RETURN jsonb_build_object(
        'status', 'success',
        'household_id', invite_record.household_id,
        'apartment_id', invite_record.apartment_id
    );
END;
$$;

-- Grant execution permission so your authenticated Ionic app can run this RPC call
GRANT EXECUTE ON FUNCTION public.join_apartment_via_token(UUID) TO authenticated;

DROP FUNCTION IF EXISTS public.generate_apartment_invite_link(
  target_apartment_id UUID, 
  target_household_id UUID, 
  days_valid INT, 
  max_slots INT
);

-- 1. Secure RPC function to generate a new invite link token
CREATE OR REPLACE FUNCTION public.generate_apartment_invite_link(
  target_apartment_id UUID, 
  target_household_id UUID, 
  days_valid INT DEFAULT 7, 
  max_slots INT DEFAULT 5
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions to securely write data
AS $$
DECLARE
    new_token_id UUID;
BEGIN
    -- 2. Strict Security check: Only an active admin of THIS specific apartment can create an invitation
    IF NOT EXISTS (
        SELECT 1 FROM public.memberships
        WHERE user_id = auth.uid()
          AND household_id = target_household_id
          AND apartment_id = target_apartment_id 
          AND apartment_role = 'admin'::public.apartment_role
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only an admin of this specific apartment can generate invite links.';
    END IF;

    -- 3. Insert invitation parameters into table layout
    INSERT INTO public.apartment_invitations (apartment_id, household_id, created_by, expires_at, max_uses)
    VALUES (
        target_apartment_id, 
        target_household_id,
        auth.uid(), 
        (now() + (days_valid || ' days')::INTERVAL), 
        max_slots
    )
    RETURNING id INTO new_token_id;

    RETURN new_token_id;
END;
$$;

-- 4. Grant permission so your Ionic application can execute this RPC call
GRANT EXECUTE ON FUNCTION public.generate_apartment_invite_link TO authenticated;

DROP FUNCTION IF EXISTS public.create_household_as_landlord(
  household_name TEXT,
  formatted_address TEXT,
  target_lat NUMERIC,
  target_lng NUMERIC,
  target_timezone TEXT
);

CREATE OR REPLACE FUNCTION public.create_household_as_landlord(
  household_name TEXT,
  formatted_address TEXT,
  target_lat NUMERIC,
  target_lng NUMERIC,
  target_timezone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Safely elevates privileges to manage system tables
AS $$
DECLARE
    new_household_id UUID;
    generated_access_code TEXT;
    current_caller_id UUID := auth.uid();
BEGIN
    -- 1. Security Check: Ensure caller is authenticated
    IF current_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: You must be logged in to create a household.';
    END IF;

    -- 2. Anti-Duplication Shield: Verify no active household exists at these coordinates 
    IF EXISTS (
        SELECT 1 FROM public.household 
        WHERE latitude = target_lat AND longitude = target_lng
    ) THEN
        RAISE EXCEPTION 'Conflict Error: This physical building layout is already registered in our system.';
    END IF;

    -- 3. Alphanumeric Token Compiler: Generates a short random 6-character registration token
    generated_access_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    -- 4. Atomic Insertion: Commit core building record assets into storage 
    INSERT INTO public.household (name, address, access_code, latitude, longitude, timezone)
    VALUES (household_name, formatted_address, generated_access_code, target_lat, target_lng, target_timezone)
    RETURNING id INTO new_household_id;

    -- 5. UPDATED: Bind the active auth user to the new memberships layout explicitly as a household 'admin'
    -- Since they don't have an apartment yet, apartment fields remain NULL.
    INSERT INTO public.memberships (household_id, user_id, household_role, apartment_id, apartment_role)
    VALUES (
      new_household_id, 
      current_caller_id, 
      'admin'::public.household_role,
      NULL,
      NULL
    );

    -- 6. Return structured response payload back to the client window
    RETURN jsonb_build_object(
        'status', 'success',
        'household_id', new_household_id,
        'access_code', generated_access_code,
        'message', 'Household created successfully and bound to your profile layout namespace.'
    );
END;
$$;

-- Grant execution permission so your authenticated Ionic app can run this RPC call
GRANT EXECUTE ON FUNCTION public.create_household_as_landlord TO authenticated;


DROP FUNCTION IF EXISTS public.handover_household_admin(
  target_household_id UUID,
  new_admin_user_id UUID
);

CREATE OR REPLACE FUNCTION public.handover_household_admin(
  target_household_id UUID,
  new_admin_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated security privilege to modify member roles safely
AS $$
DECLARE
    current_caller_id UUID := auth.uid();
BEGIN
    -- 1. Safety check -> Validate that the current caller is an active ADMIN of this specific household
    IF NOT EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE household_id = target_household_id 
          AND user_id = current_caller_id 
          AND household_role = 'admin'::public.household_role
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only an active admin can hand over building management permissions.';
    END IF;

    -- 2. Validate that the target user is already a member of this household group
    IF NOT EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE household_id = target_household_id 
          AND user_id = new_admin_user_id
    ) THEN
        RAISE EXCEPTION 'The target user must be an active member of this household before receiving admin rights.';
    END IF;

    -- 3. Upgrade the target user to the 'admin' role status at the household level
    UPDATE public.memberships
    SET household_role = 'admin'::public.household_role
    WHERE household_id = target_household_id 
      AND user_id = new_admin_user_id;

    -- 4. Gracefully downgrade the previous admin (the caller) to a standard 'member' role instead of deleting them
    UPDATE public.memberships
    SET household_role = 'member'::public.household_role
    WHERE household_id = target_household_id 
      AND user_id = current_caller_id;

    RETURN jsonb_build_object(
      'status', 'success', 
      'message', 'Admin rights transferred successfully.'
    );
END;
$$;

-- Ensure the authenticated users role still maintains execution rights to trigger this transaction
GRANT EXECUTE ON FUNCTION public.handover_household_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handover_household_admin(UUID, UUID) TO service_role;

CREATE POLICY "Landlords can view their admin assignments" 
ON public.memberships
FOR SELECT 
USING (
  user_id = auth.uid() 
  AND household_role = 'admin'::public.household_role
);

-- 1. DROP POLICIES: Clean up the old policy variants
DROP POLICY IF EXISTS "Users can insert bookings for their own apartment" ON "public"."booking";
DROP POLICY IF EXISTS "Users can manage their own apartment bookings" ON "public"."booking";
DROP POLICY IF EXISTS "Users can view bookings in the same household" ON "public"."booking";


-- 2. CREATE POLICY: Insert bookings only for apartments they actually occupy
CREATE POLICY "Users can insert bookings for their own apartment"
ON "public"."booking"
AS PERMISSIVE
FOR INSERT
TO authenticated, service_role
WITH CHECK (
  apartment_id IN (
    SELECT m.apartment_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid() 
      AND m.apartment_id IS NOT NULL
  )
);


-- 3. CREATE POLICY: Update/Delete bookings only for their own apartment 
CREATE POLICY "Users can manage their own apartment bookings"
ON "public"."booking"
AS PERMISSIVE
FOR ALL
TO authenticated, service_role
USING (
  apartment_id IN (
    SELECT m.apartment_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid() 
      AND m.apartment_id IS NOT NULL
  )
);


-- 4. CREATE POLICY: View all bookings within their overarching household building
-- REFACTORED: Removed the heavy table JOIN since household_id is now natively inside memberships!
CREATE POLICY "Users can view bookings in the same household"
ON "public"."booking"
AS PERMISSIVE
FOR SELECT
TO authenticated, service_role
USING (
  apartment_id IN (
    SELECT a.id
    FROM public.apartment a
    WHERE a.household_id = (
      SELECT m_sub.household_id
      FROM public.memberships m_sub
      WHERE m_sub.user_id = auth.uid()
      LIMIT 1
    )
  )
);

DROP FUNCTION IF EXISTS public.assert_apartment_membership(
  target_apartment_id UUID,
  authenticated_user_id UUID
);
CREATE OR REPLACE FUNCTION public.assert_apartment_membership(
  target_apartment_id UUID,
  authenticated_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions to bypass RLS validation loops safely
AS $$
BEGIN
    -- 1. Ensure the user session isn't empty
    IF authenticated_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: You must be logged in to perform this action.';
    END IF;

    -- 2. Verify mapping rows using the new unified memberships table
    IF NOT EXISTS (
        SELECT 1 
        FROM public.memberships
        WHERE apartment_id = target_apartment_id 
          AND user_id = authenticated_user_id
          AND apartment_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Forbidden: You do not belong to this apartment configuration.';
    END IF;
END;
$$;

-- Keep permission structures synchronized across schema updates
GRANT EXECUTE ON FUNCTION public.assert_apartment_membership(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assert_apartment_membership(UUID, UUID) TO service_role;


DROP FUNCTION IF EXISTS public.leave_apartment(target_apartment_id UUID);
DROP FUNCTION IF EXISTS public.remove_apartment_member(target_apartment_id UUID, target_user_id UUID);
DROP FUNCTION IF EXISTS public.update_member_role(
  target_apartment_id UUID, 
  target_user_id UUID, 
  new_role public.apartment_role 
);
DROP FUNCTION IF EXISTS public.delete_and_leave_apartment(target_apartment_id UUID);

-- 1. Function to safely leave an apartment (Keeps household membership intact)
CREATE OR REPLACE FUNCTION public.leave_apartment(target_apartment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_role public.apartment_role;
    admin_count INT;
BEGIN
    -- Get the role of the person trying to leave
    SELECT apartment_role INTO current_role 
    FROM public.memberships 
    WHERE apartment_id = target_apartment_id AND user_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'You are not a member of this apartment';
    END IF;

    -- If the user is an admin, check how many admins are left
    IF current_role = 'admin'::public.apartment_role THEN
        SELECT COUNT(*) INTO admin_count 
        FROM public.memberships 
        WHERE apartment_id = target_apartment_id AND apartment_role = 'admin'::public.apartment_role;

        -- If they are the sole admin, block the exit until they promote someone else
        IF admin_count = 1 THEN
            RAISE EXCEPTION 'You are the only admin. You must promote another member to admin before leaving.';
        END IF;
    END IF;

    -- REMOVAL LOGIC: Reset apartment columns to NULL so they stay in the household
    UPDATE public.memberships 
    SET apartment_id = NULL,
        apartment_role = NULL
    WHERE apartment_id = target_apartment_id AND user_id = auth.uid();
END;
$$;


-- 2. Function to remove a member (Admin only - clears their room assignment)
CREATE OR REPLACE FUNCTION public.remove_apartment_member(target_apartment_id UUID, target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the executor is an apartment admin
    IF NOT EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE apartment_id = target_apartment_id AND user_id = auth.uid() AND apartment_role = 'admin'::public.apartment_role
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can remove members';
    END IF;

    -- Prevent admins from accidentally clearing themselves through this endpoint
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'You cannot remove yourself. Use the leave function instead.';
    END IF;

    -- Evict them from the room but preserve their building/household membership
    UPDATE public.memberships 
    SET apartment_id = NULL,
        apartment_role = NULL
    WHERE apartment_id = target_apartment_id AND user_id = target_user_id;
END;
$$;


-- 3. Function to update a member role (Admin only - handles promotion/demotion)
CREATE OR REPLACE FUNCTION public.update_member_role(
  target_apartment_id UUID, 
  target_user_id UUID, 
  new_role public.apartment_role -- Cast directly to your enum type for safety
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if executor is an apartment admin
    IF NOT EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE apartment_id = target_apartment_id AND user_id = auth.uid() AND apartment_role = 'admin'::public.apartment_role
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can change member roles';
    END IF;

    -- Update their apartment specific role safely
    UPDATE public.memberships 
    SET apartment_role = new_role 
    WHERE apartment_id = target_apartment_id AND user_id = target_user_id;
END;
$$;


-- 4. Function to dissolve the apartment if it's empty
CREATE OR REPLACE FUNCTION public.delete_and_leave_apartment(target_apartment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_role public.apartment_role;
    total_member_count INT;
BEGIN
    -- Verify the role
    SELECT apartment_role INTO current_role 
    FROM public.memberships 
    WHERE apartment_id = target_apartment_id AND user_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: You are not a member of this apartment';
    END IF;

    IF current_role <> 'admin'::public.apartment_role THEN
        RAISE EXCEPTION 'Unauthorized: Only an admin can delete the apartment';
    END IF;

    -- Count how many members are assigned to this room layout
    SELECT COUNT(*) INTO total_member_count 
    FROM public.memberships 
    WHERE apartment_id = target_apartment_id;

    -- Blocks the operation if there are other roommates
    IF total_member_count > 1 THEN
        RAISE EXCEPTION 'Cannot delete: You cannot dissolve the apartment while other members are inside. Remove them first.';
    END IF;

    -- Clean up our memberships table reference first to bypass cascading lock limitations
    UPDATE public.memberships 
    SET apartment_id = NULL,
        apartment_role = NULL
    WHERE apartment_id = target_apartment_id;

    -- Remove the apartment core table row (which will cascade to bookings, details, etc.)
    DELETE FROM public.apartment 
    WHERE id = target_apartment_id;
END;
$$;


-- 5. GRANTS: Restore PostgREST authorization gateway access parameters
GRANT EXECUTE ON FUNCTION public.leave_apartment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_apartment_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_member_role(UUID, UUID, public.apartment_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_and_leave_apartment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_and_leave_apartment(UUID) TO service_role;


DROP FUNCTION IF EXISTS public.create_new_apartment(
  apartment_name TEXT,
  target_household_id UUID
);
-- we put in the same function both the population of the apartment and the binding of the creator as admin to ensure atomicity and clean error handling
CREATE OR REPLACE FUNCTION public.create_new_apartment(
  apartment_name TEXT,
  target_household_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions to write to members cleanly
AS $$
DECLARE
    new_apartment_id UUID;
    current_caller_id UUID := auth.uid();
BEGIN
    -- 1. Security Check: Validate active session context
    IF current_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: You must be logged in to create an apartment.';
    END IF;

    -- 2. Pre-requisite Check: Ensure the user actually belongs to this household first
    IF NOT EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE household_id = target_household_id AND user_id = current_caller_id
    ) THEN
        RAISE EXCEPTION 'Forbidden: You must be a member of this household to create apartments inside it.';
    END IF;

    -- 3. Insert the new apartment into the database
    INSERT INTO public.apartment (display_name, household_id)
    VALUES (apartment_name, target_household_id)
    RETURNING id INTO new_apartment_id;

    -- 4. REFACTORED: Assign the creator to this apartment within their existing household membership row
    UPDATE public.memberships
    SET apartment_id = new_apartment_id,
        apartment_role = 'admin'::public.apartment_role
    WHERE household_id = target_household_id 
      AND user_id = current_caller_id;

    -- 5. Return a clean payload back to the client
    RETURN jsonb_build_object(
        'apartment_id', new_apartment_id,
        'display_name', apartment_name,
        'status', 'success'
    );
END;
$$;

-- Secure the new function access rules (May 30 Data API update requirement)
GRANT EXECUTE ON FUNCTION public.create_new_apartment(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_new_apartment(TEXT, UUID) TO service_role;

DROP FUNCTION IF EXISTS public.handle_join_request(request_id UUID, action_status TEXT);
-- 1. Function for an Admin to approve or decline a pending member request
CREATE OR REPLACE FUNCTION public.handle_join_request(request_id UUID, action_status TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_apt_id UUID;
    target_house_id UUID;
    target_user_id UUID;
BEGIN
    IF action_status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status action. Must be approved or rejected';
    END IF;

    -- Look up the request parameters
    SELECT apartment_id, user_id INTO target_apt_id, target_user_id 
    FROM public.join_requests 
    WHERE id = request_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending request not found';
    END IF;

    -- Authorization check: Ensure executor is an admin of the target apartment
    IF NOT EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE apartment_id = target_apt_id 
        AND user_id = auth.uid() 
        AND apartment_role = 'admin'::public.apartment_role
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only an admin can handle join requests';
    END IF;

    -- Resolve the request entry
    UPDATE public.join_requests 
    SET status = action_status 
    WHERE id = request_id;

    -- If approved, grant official apartment and household membership
    IF action_status = 'approved' THEN
        -- Pull the parent household_id directly from the apartment table configuration
        SELECT household_id INTO target_house_id 
        FROM public.apartment 
        WHERE id = target_apt_id;

        -- Upsert the membership row securely
        INSERT INTO public.memberships (household_id, apartment_id, user_id, household_role, apartment_role)
        VALUES (
            target_house_id, 
            target_apt_id, 
            target_user_id, 
            'member'::public.household_role,
            'member'::public.apartment_role
        )
        -- Overwrite the apartment context if they were previously an unassigned household member
        ON CONFLICT (user_id, household_id) WHERE apartment_id IS NOT NULL 
        DO UPDATE SET 
            apartment_id = EXCLUDED.apartment_id,
            apartment_role = EXCLUDED.apartment_role;
    END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.create_join_request(target_apartment_id UUID);
-- 2. Function to request entry into an apartment layout
CREATE OR REPLACE FUNCTION public.create_join_request(target_apartment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Prevent creating a request if the user is already an active member of this room configuration
    IF EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE apartment_id = target_apartment_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You are already a member of this apartment';
    END IF;

    -- Insert or reset an older rejected request back to pending
    -- (Note: Ensure your join_requests table has a UNIQUE index on (user_id, apartment_id) for this conflict clause to target)
    INSERT INTO public.join_requests (apartment_id, user_id, status)
    VALUES (target_apartment_id, auth.uid(), 'pending')
    ON CONFLICT (user_id, apartment_id) 
    DO UPDATE SET status = 'pending', created_at = now();
END;
$$;


-- 3. GRANTS: Secure execution scopes across backend routes
GRANT EXECUTE ON FUNCTION public.handle_join_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_join_request(UUID) TO authenticated;


DROP POLICY IF EXISTS "Admins can view inbound join requests" ON public.join_requests;

-- 2. Create the updated version matching the new table schema
CREATE POLICY "Admins can view inbound join requests" 
ON public.join_requests
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE apartment_id = join_requests.apartment_id 
      AND user_id = auth.uid() 
      AND apartment_role = 'admin'::public.apartment_role
  )
);

CREATE OR REPLACE FUNCTION public.delete_household(
    target_household_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Elevates execution to allow safe cascade deletes
AS $$
DECLARE
    current_caller_id UUID := auth.uid();
BEGIN
    -- 1. Security Check: Validate active session context
    IF current_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: You must be logged in to delete a household.';
    END IF;

    -- 2. Authorization Check: Verify the caller is an active ADMIN of this specific household
    IF NOT EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE household_id = target_household_id 
          AND user_id = current_caller_id 
          AND household_role = 'admin'::public.household_role
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only a household admin can permanently delete a building.';
    END IF;

    -- 3. Destructive Action: Remove the core household table row
    -- Thanks to ON DELETE CASCADE, this automatically wipes out:
    --   - All public.memberships rows for this household
    --   - All public.apartment configurations linked to this household
    --   - All public.booking rows linked to those apartments
    DELETE FROM public.household 
    WHERE id = target_household_id;

    -- 4. Return structured response payload back to the client window
    RETURN jsonb_build_object(
        'status', 'success',
        'household_id', target_household_id,
        'message', 'Household and all associated apartments, memberships, and bookings have been permanently dissolved.'
    );
END;
$$;

-- Grant execution permission so your authenticated Ionic app can run this RPC call
GRANT EXECUTE ON FUNCTION public.delete_household(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.leave_household(
    target_household_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions to safely manage membership rows
AS $$
DECLARE
    current_caller_id UUID := auth.uid();
    caller_role public.household_role;
    admin_count INT;
BEGIN
    -- 1. Security Check: Validate active session context
    IF current_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: You must be logged in to leave a household.';
    END IF;

    -- 2. Verify the user actually belongs to this household first
    SELECT household_role INTO caller_role
    FROM public.memberships
    WHERE household_id = target_household_id AND user_id = current_caller_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conflict Error: You are not an active member of this household building layout.';
    END IF;

    -- 3. Safety Check: If the user is an admin, check how many admins are left in total
    IF caller_role = 'admin'::public.household_role THEN
        SELECT COUNT(*) INTO admin_count
        FROM public.memberships
        WHERE household_id = target_household_id 
          AND household_role = 'admin'::public.household_role;

        -- Block the exit if they are the absolute last admin standing
        IF admin_count = 1 THEN
            RAISE EXCEPTION 'Forbidden: You are the sole admin of this household. You must hand over admin rights or delete the household before leaving.';
        END IF;
    END IF;

    -- 4. Atomic Execution: Completely wipe out their row asset footprint
    -- This instantly cleans up both their household access and any specific apartment assignment
    DELETE FROM public.memberships
    WHERE household_id = target_household_id AND user_id = current_caller_id;

    -- 5. Return structured response payload back to the client interface window
    RETURN jsonb_build_object(
        'status', 'success',
        'household_id', target_household_id,
        'message', 'You have successfully left the household building configuration layout namespace.'
    );
END;
$$;

-- Grant compilation permission so your authenticated Ionic app can run this RPC call
GRANT EXECUTE ON FUNCTION public.leave_household(UUID) TO authenticated;
