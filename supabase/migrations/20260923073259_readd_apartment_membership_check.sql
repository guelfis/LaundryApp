DROP FUNCTION IF EXISTS public.assert_apartment_membership(UUID, UUID);
CREATE OR REPLACE FUNCTION public.assert_apartment_membership(
  target_apartment_id UUID,
  authenticated_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_display_name TEXT;
    target_household_id UUID;
BEGIN
    -- 1. Ensure the user session isn't empty
    IF authenticated_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: You must be logged in to perform this action.';
    END IF;

    -- Fetch the household context and display name of the target apartment
    SELECT display_name, household_id INTO target_display_name, target_household_id
    FROM public.apartment
    WHERE id = target_apartment_id;

    -- 2. CONDITIONAL ROLE ACCESS: Limit admin privileges strictly to administrative actions
    IF target_display_name = '_ADMIN_' THEN
        -- Allow the action ONLY if the user is a household manager/admin
        IF EXISTS (
            SELECT 1 
            FROM public.memberships
            WHERE household_id = target_household_id
              AND user_id = authenticated_user_id
              AND household_role::text = 'admin'
        ) THEN
            -- Success: The user is authorized to manage '_ADMIN_' entries.
            -- This keeps them from touching other apartments' standard rows!
            RETURN; 
        END IF;
    END IF;

    -- 3. STANDARD USER ACCESS: Regular users can only touch their own apartment's slots
    IF NOT EXISTS (
        SELECT 1 
        FROM public.memberships
        WHERE apartment_id = target_apartment_id 
          AND user_id = authenticated_user_id
    ) THEN
        RAISE EXCEPTION 'Forbidden: You do not belong to this apartment configuration.';
    END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.assert_apartment_membership(UUID, UUID) TO authenticated;