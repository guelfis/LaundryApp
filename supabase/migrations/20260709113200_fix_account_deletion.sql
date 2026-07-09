CREATE OR REPLACE FUNCTION public.automated_self_deletion_process()
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_membership_record RECORD;
  
  -- Household tracking counters
  v_other_house_members INT;
  v_other_house_admins INT;
  
  -- Apartment tracking counters
  v_other_apt_members INT;
  v_other_apt_admins INT;
BEGIN
  -- 1. Identify the current logged-in session user executing the action
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED_SESSION';
  END IF;

  -- 2. FIRST PASS: STRICT VALIDATION RULES GATEWAY
  FOR v_membership_record IN 
    SELECT household_id, apartment_id, household_role, apartment_role 
    FROM public.memberships 
    WHERE user_id = v_user_id
  LOOP
    
    -- Gather Household (Building) footprint statistics
    SELECT COUNT(*) INTO v_other_house_members 
    FROM public.memberships 
    WHERE household_id = v_membership_record.household_id AND user_id != v_user_id;

    SELECT COUNT(*) INTO v_other_house_admins 
    FROM public.memberships 
    WHERE household_id = v_membership_record.household_id 
      AND user_id != v_user_id 
      AND household_role = 'admin'::household_role;

    -- Gather Apartment footprint statistics (if user is assigned to an apartment)
    IF v_membership_record.apartment_id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_other_apt_members 
      FROM public.memberships 
      WHERE apartment_id = v_membership_record.apartment_id AND user_id != v_user_id;

      SELECT COUNT(*) INTO v_other_apt_admins 
      FROM public.memberships 
      WHERE apartment_id = v_membership_record.apartment_id 
        AND user_id != v_user_id 
        AND apartment_role = 'admin'::apartment_role;
    ELSE
      v_other_apt_members := 0;
      v_other_apt_admins := 0;
    END IF;

    -- FIXED: Enforced explicit, separate IF gates to prevent conditional bleeding
    
    -- RULE 1: Sole Building Admin Verification
    IF v_membership_record.household_role = 'admin'::household_role THEN
      IF v_other_house_members > 0 AND v_other_house_admins = 0 THEN
        RAISE EXCEPTION 'SOLE_BUILDING_ADMIN_ERROR';
      END IF;
    END IF;

    -- RULE 2: Sole Apartment Admin Verification
    IF v_membership_record.apartment_role = 'admin'::apartment_role THEN
      IF v_other_apt_members > 0 AND v_other_apt_admins = 0 THEN
        RAISE EXCEPTION 'SOLE_APARTMENT_ADMIN_ERROR';
      END IF;
    END IF;

  END LOOP;


  -- 3. SECOND PASS: CLEAN DISPOSAL LAYER (Runs only if ALL validations passed above)
  FOR v_membership_record IN 
    SELECT household_id, apartment_id 
    FROM public.memberships 
    WHERE user_id = v_user_id
  LOOP
    
    SELECT COUNT(*) INTO v_other_house_members FROM public.memberships WHERE household_id = v_membership_record.household_id AND user_id != v_user_id;
    
    IF v_membership_record.apartment_id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_other_apt_members FROM public.memberships WHERE apartment_id = v_membership_record.apartment_id AND user_id != v_user_id;
    ELSE
      v_other_apt_members := 1; 
    END IF;

    -- CASE B: User is the absolute last member of an apartment -> Delete Apartment
    IF v_membership_record.apartment_id IS NOT NULL AND v_other_apt_members = 0 THEN
      DELETE FROM public.apartment WHERE id = v_membership_record.apartment_id;
    END IF;

    -- CASE C: User is the absolute last member of the Building -> Delete Building (Household)
    IF v_other_house_members = 0 THEN
      DELETE FROM public.household WHERE id = v_membership_record.household_id;
    END IF;

  END LOOP;

  -- 4. TOTAL CLEANUP UPON REMAINING SHARED SPACES
  DELETE FROM public.booking WHERE created_by = v_user_id;
  DELETE FROM public.apartment_invitations WHERE created_by = v_user_id;
  DELETE FROM public.join_requests WHERE user_id = v_user_id;
  DELETE FROM public.memberships WHERE user_id = v_user_id;
  DELETE FROM public.support_tickets WHERE profile_id = v_user_id;

  -- 5. Wipe public profiles mirror tracking entry
  DELETE FROM public.profiles WHERE id = v_user_id;

  -- 6. Permanently drop core authentication account registration credentials row
  DELETE FROM auth.users WHERE id = v_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
