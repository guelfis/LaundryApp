-- =========================================================================
-- 1. CLEANUP REMOVAL: Strip out the background database hashing layers
-- =========================================================================
DROP TRIGGER IF EXISTS encrypt_access_code_before_save ON public.household;
DROP FUNCTION IF EXISTS public.hash_household_access_code();

-- =========================================================================
-- 2. RESET VERIFICATION FUNCTION: Standard plain-text check routine
-- =========================================================================
CREATE OR REPLACE FUNCTION public.verify_household_access_by_id(
  target_id UUID,
  user_input_code TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  household_id UUID,
  household_name TEXT,
  household_address TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_code TEXT;
  matched_name TEXT;
  matched_address TEXT;
BEGIN
  -- Get the plain-text stored code and descriptive metadata targets
  SELECT h.name, h.address, h.access_code 
  INTO matched_name, matched_address, stored_code
  FROM public.household h
  WHERE h.id = target_id;

  -- FIXED ACTION: Runs a direct plain text match verification instead of using crypt()
  IF stored_code = UPPER(TRIM(user_input_code)) THEN
    RETURN QUERY SELECT true, target_id, matched_name, matched_address;
  ELSE
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$;

-- Reinforce active public consumer privileges
GRANT EXECUTE ON FUNCTION public.verify_household_access_by_id TO authenticated;
