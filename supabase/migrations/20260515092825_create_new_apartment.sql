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
BEGIN
    -- 1. Insert the new apartment into the database
    INSERT INTO public.apartment (display_name, household_id)
    VALUES (apartment_name, target_household_id)
    RETURNING id INTO new_apartment_id;

    -- 2. Automatically bind the creator as the first ADMIN
    INSERT INTO public.apartment_members (apartment_id, user_id, role)
    VALUES (new_apartment_id, auth.uid(), 'admin');

    -- 3. Return a clean payload back to the React client
    RETURN jsonb_build_object(
        'apartment_id', new_apartment_id,
        'display_name', apartment_name,
        'status', 'success'
    );
END;
$$;

-- Secure the new function access rules (May 30 Data API update requirement)
GRANT EXECUTE ON FUNCTION public.create_new_apartment TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_new_apartment TO service_role;
