CREATE OR REPLACE FUNCTION public.handover_household_admin(
  target_household_id UUID,
  new_admin_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Safety check -> only admin can handover
    IF NOT EXISTS (
        SELECT 1 FROM public.household_admins 
        WHERE household_id = target_household_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only an active admin can hand over building management permissions.';
    END IF;

    -- add the new admin
    INSERT INTO public.household_admins (household_id, user_id)
    VALUES (target_household_id, new_admin_user_id)
    ON CONFLICT DO NOTHING; 

    -- Removes itself from the household management
    DELETE FROM public.household_admins 
    WHERE household_id = target_household_id AND user_id = auth.uid();

    RETURN jsonb_build_object('status', 'success', 'message', 'Admin rights transferred successfully.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.handover_household_admin TO authenticated;
