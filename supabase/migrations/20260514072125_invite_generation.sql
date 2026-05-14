-- ====================================================================
-- 1. APARTMENT INVITATIONS (Link-based Joining)
-- ====================================================================

-- Table to store temporary token invitations
CREATE TABLE IF NOT EXISTS public.apartment_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(), -- This UUID is the URL token
  apartment_id uuid NOT NULL REFERENCES public.apartment(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  max_uses int DEFAULT 5,
  current_uses int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT apartment_invitations_pkey PRIMARY KEY (id)
);

-- Secure RPC function to generate a new invite link token
CREATE OR REPLACE FUNCTION generate_apartment_invite_link(target_apartment_id UUID, days_valid INT DEFAULT 7, max_slots INT DEFAULT 5)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions to securely write data
AS $$
DECLARE
    new_token_id UUID;
BEGIN
    -- Security verification: Only an admin can generate links
    IF NOT EXISTS (
        SELECT 1 FROM public.apartment_members 
        WHERE apartment_id = target_apartment_id 
        AND user_id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only an admin can generate invite links';
    END IF;

    -- Insert invitation parameters
    INSERT INTO public.apartment_invitations (apartment_id, created_by, expires_at, max_uses)
    VALUES (
        target_apartment_id, 
        auth.uid(), 
        (now() + (days_valid || ' days')::interval), 
        max_slots
    )
    RETURNING id INTO new_token_id;

    RETURN new_token_id;
END;
$$;


-- ====================================================================
-- 2. JOIN REQUESTS (In-App Requesting System)
-- ====================================================================

-- Table to manage pending requests from users tapping "Locked" apartments
CREATE TABLE IF NOT EXISTS public.join_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES public.apartment(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT join_requests_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_apartment_request UNIQUE (user_id, apartment_id)
);

-- Function for a user to trigger a join request from the list
CREATE OR REPLACE FUNCTION create_join_request(target_apartment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Prevent creating a request if the user is already a member
    IF EXISTS (
        SELECT 1 FROM public.apartment_members 
        WHERE apartment_id = target_apartment_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You are already a member of this apartment';
    END IF;

    -- Insert or reset an older rejected request back to pending
    INSERT INTO public.join_requests (apartment_id, user_id, status)
    VALUES (target_apartment_id, auth.uid(), 'pending')
    ON CONFLICT (user_id, apartment_id) 
    DO UPDATE SET status = 'pending', created_at = now();
END;
$$;

-- Function for an Admin to approve or decline a pending member request
CREATE OR REPLACE FUNCTION handle_join_request(request_id UUID, action_status TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_apt_id UUID;
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
        SELECT 1 FROM public.apartment_members 
        WHERE apartment_id = target_apt_id 
        AND user_id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only an admin can handle join requests';
    END IF;

    -- Resolve the request entry
    UPDATE public.join_requests 
    SET status = action_status 
    WHERE id = request_id;

    -- If approved, grant official apartment membership
    IF action_status = 'approved' THEN
        INSERT INTO public.apartment_members (apartment_id, user_id, role)
        VALUES (target_apt_id, target_user_id, 'member')
        ON CONFLICT (user_id, apartment_id) DO NOTHING;
    END IF;
END;
$$;


-- ====================================================================
-- 3. SECURITY: ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.apartment_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Admins see the links they or other co-admins created
CREATE POLICY "Admins can view apartment invitations" ON public.apartment_invitations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.apartment_members 
    WHERE apartment_id = apartment_invitations.apartment_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Users can monitor the status of their own outgoing requests
CREATE POLICY "Users can view their own join requests" ON public.join_requests
FOR SELECT USING (auth.uid() = user_id);

-- Admins can query incoming requests to approve them
CREATE POLICY "Admins can view inbound join requests" ON public.join_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.apartment_members 
    WHERE apartment_id = join_requests.apartment_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Grant permissions for apartment_members
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apartment_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apartment_members TO service_role;

-- Grant permissions for apartment_invitations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apartment_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apartment_invitations TO service_role;

-- Grant permissions for join_requests
GRANT SELECT, INSERT, UPDATE, DELETE ON public.join_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.join_requests TO service_role;
