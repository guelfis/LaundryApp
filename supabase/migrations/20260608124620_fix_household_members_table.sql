-- 1. Create a custom enum type for Household roles if it doesn't exist yet
create type public.household_role as enum ('admin', 'member');

-- 2. Drop the old table that was restricted strictly to admins
drop table if exists public.household_admins cascade;

-- 3. Create the unified, extensible household membership table
create table public.household_members (
  id uuid not null default gen_random_uuid (),
  household_id uuid not null,
  user_id uuid not null,
  role public.household_role not null default 'member'::public.household_role,
  joined_at timestamp with time zone null default now(),
  
  -- Primary key mapping
  constraint household_members_pkey primary key (id),
  
  -- Prevent the same user from being duplicated into the same household multiple times
  constraint unique_user_household unique (user_id, household_id),
  
  -- Cascade deletions if a parent household container entity gets purged
  constraint household_members_household_id_fkey foreign key (household_id) 
    references public.household (id) on delete cascade,
    
  -- Cascade deletions if the authentication user record is wiped
  constraint household_members_user_id_auth_fkey foreign key (user_id) 
    references auth.users (id) on delete cascade,
    
  -- Strong structural link mapping to your custom central public profile schema
  constraint household_members_user_id_profiles_fkey foreign key (user_id) 
    references public.profiles (id) on delete cascade
) tablespace pg_default;

-- 4. Create optimized indexes to ensure ultra-fast queries when filtering by user or house IDs
create index if not exists idx_household_members_user on public.household_members(user_id);
create index if not exists idx_household_members_household on public.household_members(household_id);

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
        SELECT 1 FROM public.household_members 
        WHERE household_id = target_household_id 
          AND user_id = current_caller_id 
          AND role = 'admin'::public.household_role
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only an active admin can hand over building management permissions.';
    END IF;

    -- 2. Validate that the target user is already a member of this household group
    IF NOT EXISTS (
        SELECT 1 FROM public.household_members 
        WHERE household_id = target_household_id 
          AND user_id = new_admin_user_id
    ) THEN
        RAISE EXCEPTION 'The target user must be an active member of this household before receiving admin rights.';
    END IF;

    -- 3. Upgrade the target user to the 'admin' role status
    UPDATE public.household_members
    SET role = 'admin'::public.household_role
    WHERE household_id = target_household_id 
      AND user_id = new_admin_user_id;

    -- 4. Gracefully downgrade the previous admin (the caller) to a standard 'member' role instead of deleting them
    UPDATE public.household_members
    SET role = 'member'::public.household_role
    WHERE household_id = target_household_id 
      AND user_id = current_caller_id;

    RETURN jsonb_build_object(
      'status', 'success', 
      'message', 'Admin rights transferred successfully.'
    );
END;
$$;

-- Ensure the authenticated users role still maintains execution rights to trigger this transaction
GRANT EXECUTE ON FUNCTION public.handover_household_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.handover_household_admin TO service_role;


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
BEGIN
    -- 1. Anti-Duplication Shield: Verify no active household exists at these coordinates 
    IF EXISTS (
        SELECT 1 FROM public.household 
        WHERE latitude = target_lat AND longitude = target_lng
    ) THEN
        RAISE EXCEPTION 'Conflict Error: This physical building layout is already registered in our system.';
    END IF;

    -- 2. Alphanumeric Token Compiler: Generates a short random 6-character registration token
    generated_access_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    -- 3. Atomic Insertion: Commit core building record assets into storage 
    INSERT INTO public.household (name, address, access_code, latitude, longitude, timezone)
    VALUES (household_name, formatted_address, generated_access_code, target_lat, target_lng, target_timezone)
    RETURNING id INTO new_household_id;

    -- 4. FIXED: Bind the active auth user to household_members explicitly as an 'admin'
    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (
      new_household_id, 
      auth.uid(), 
      'admin'::public.household_role
    );

    -- 5. Return structured response payload back to the client window
    RETURN jsonb_build_object(
        'status', 'success',
        'household_id', new_household_id,
        'access_code', generated_access_code,
        'message', 'Household created successfully and bound to your profile layout namespace.'
    );
END;
$$;

-- Ensure the authenticated users role maintains execution rights
GRANT EXECUTE ON FUNCTION public.create_household_as_landlord TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_household_as_landlord TO service_role;

-- Isolation Policy: Landlords can exclusively view their own building manager tracking grids
CREATE POLICY "Landlords can view their admin assignments" ON public.household_members
FOR SELECT USING (user_id = auth.uid() AND role = 'admin'::public.household_role);
