DROP FUNCTION IF EXISTS public.join_apartment_via_token(UUID);

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

    -- 4. STEP 1: Add user to household_members if they are not a member yet
    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (
        invite_record.household_id, 
        current_caller_id, 
        'member'::public.household_role
    )
    ON CONFLICT (user_id, household_id) DO NOTHING; -- Skip if they are already in the household

    -- 5. STEP 2: Add user to apartment_members
    INSERT INTO public.apartment_members (apartment_id, user_id, role)
    VALUES (
        invite_record.apartment_id, 
        current_caller_id, 
        'member'::public.apartment_role
    )
    ON CONFLICT (user_id, apartment_id) DO NOTHING;

    -- 6. Step 3: Increment the total usage counter metrics on the token
    UPDATE public.apartment_invitations 
    SET current_uses = current_uses + 1 
    WHERE id = token_id;

    -- 7. FIXED: Return BOTH the apartment_id and household_id back to the frontend window
    RETURN jsonb_build_object(
        'status', 'success',
        'household_id', invite_record.household_id,
        'apartment_id', invite_record.apartment_id
    );
END;
$$;

-- Grant execution permission so your authenticated Ionic app can run this RPC call
GRANT EXECUTE ON FUNCTION public.join_apartment_via_token(UUID) TO authenticated;
