CREATE OR REPLACE FUNCTION public.assert_apartment_membership(
  target_apartment_id UUID,
  authenticated_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
BEGIN
    -- 1. Ensure the user session isn't empty
    IF authenticated_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: You must be logged in to perform this action.';
    END IF;

    -- 2. Verify mapping rows using your exact table name: apartment_members
    IF NOT EXISTS (
        SELECT 1 
        FROM public.apartment_members
        WHERE apartment_id = target_apartment_id 
          AND user_id = authenticated_user_id
    ) THEN
        RAISE EXCEPTION 'Forbidden: You do not belong to this apartment configuration.';
    END IF;
END;
$$;
