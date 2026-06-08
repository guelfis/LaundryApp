ALTER TABLE public.apartment_invitations
ADD COLUMN household_id UUID REFERENCES public.household(id) ON DELETE CASCADE;

DROP FUNCTION IF EXISTS public.generate_apartment_invite_link(UUID);
DROP FUNCTION IF EXISTS public.generate_apartment_invite_link(UUID, INT, INT);
DROP FUNCTION IF EXISTS public.generate_apartment_invite_link(UUID, UUID, INT, INT);


-- 2. Secure RPC function to generate a new invite link token
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
    -- 3. Enhanced Security check. Allows EITHER a Household Admin OR an Apartment Admin to create link invitations
    IF NOT EXISTS (
        SELECT 1 FROM public.household_members
        WHERE household_id = target_household_id 
          AND user_id = auth.uid() 
          AND role = 'admin'::public.household_role
    ) AND NOT EXISTS (
        SELECT 1 FROM public.apartment_members 
        WHERE apartment_id = target_apartment_id 
          AND user_id = auth.uid() 
          AND role = 'admin'::public.apartment_role
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only a household or apartment admin can generate invite links.';
    END IF;

    -- 4. Insert invitation parameters into table layout
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

-- 5. Grant compilation permission so your Ionic application can execute this RPC call
GRANT EXECUTE ON FUNCTION public.generate_apartment_invite_link TO authenticated;
