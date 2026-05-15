-- 1. Function to safely leave an apartment
CREATE OR REPLACE FUNCTION public.leave_apartment(target_apartment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_role TEXT;
    admin_count INT;
BEGIN
    -- Get the role of the person trying to leave
    SELECT role INTO current_role 
    FROM public.apartment_members 
    WHERE apartment_id = target_apartment_id AND user_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'You are not a member of this apartment';
    END IF;

    -- If the user is an admin, check how many admins are left
    IF current_role = 'admin' THEN
        SELECT COUNT(*) INTO admin_count 
        FROM public.apartment_members 
        WHERE apartment_id = target_apartment_id AND role = 'admin';

        -- If they are the sole admin, block the exit until they promote someone else
        IF admin_count = 1 THEN
            RAISE EXCEPTION 'You are the only admin. You must promote another member to admin before leaving.';
        END IF;
    END IF;

    -- Delete the membership row
    DELETE FROM public.apartment_members 
    WHERE apartment_id = target_apartment_id AND user_id = auth.uid();
END;
$$;

-- 2. Function to remove a member (Admin only)
CREATE OR REPLACE FUNCTION public.remove_apartment_member(target_apartment_id UUID, target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the executor is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.apartment_members 
        WHERE apartment_id = target_apartment_id AND user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can remove members';
    END IF;

    -- Prevent admins from accidentally deleting themselves through this endpoint
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'You cannot remove yourself. Use the leave function instead.';
    END IF;

    DELETE FROM public.apartment_members 
    WHERE apartment_id = target_apartment_id AND user_id = target_user_id;
END;
$$;

-- 3. Function to update a member role (Admin only - handles promotion/demotion)
CREATE OR REPLACE FUNCTION public.update_member_role(target_apartment_id UUID, target_user_id UUID, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.apartment_members 
        WHERE apartment_id = target_apartment_id AND user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can change member roles';
    END IF;

    UPDATE public.apartment_members 
    SET role = new_role 
    WHERE apartment_id = target_apartment_id AND user_id = target_user_id;
END;
$$;

-- Apply grants
GRANT EXECUTE ON FUNCTION public.leave_apartment TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_apartment_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_member_role TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_and_leave_apartment(target_apartment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Esegue con permessi elevati per garantire la rimozione atomica
AS $$
DECLARE
    current_role TEXT;
    total_member_count INT;
BEGIN
    -- verify the role
    SELECT role INTO current_role 
    FROM public.apartment_members 
    WHERE apartment_id = target_apartment_id AND user_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: You are not a member of this apartment';
    END IF;

    IF current_role <> 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only an admin can delete the apartment';
    END IF;

    -- Count how many members are left in the apartment
    SELECT COUNT(*) INTO total_member_count 
    FROM public.apartment_members 
    WHERE apartment_id = target_apartment_id;

    -- Blocks the operation if there are other members
    IF total_member_count > 1 THEN
        RAISE EXCEPTION 'Cannot delete: You cannot dissolve the apartment while other members are inside. Remove them first.';
    END IF;

    -- Remove the apartment, and in cascade, the members, the bookings etc
    DELETE FROM public.apartment 
    WHERE id = target_apartment_id;
END;
$$;

-- Abilita l'esecuzione per gli utenti autenticati (Gateway PostgREST)
GRANT EXECUTE ON FUNCTION public.delete_and_leave_apartment TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_and_leave_apartment TO service_role;
