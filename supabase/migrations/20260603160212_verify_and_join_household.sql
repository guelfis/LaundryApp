-- 1. Enable the standard PostgreSQL cryptographic extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Allow temporary null adjustments
ALTER TABLE public.household ALTER COLUMN access_code DROP NOT NULL;

-- 3. Change data type structural properties to TEXT
ALTER TABLE public.household ALTER COLUMN access_code SET DATA TYPE TEXT;

-- 4. Fill every empty row with a safe temporary placeholder string instead of NULL [google:1]
UPDATE public.household SET access_code = '0000' WHERE access_code IS NULL;

-- 5. Now apply the strict security constraint rule [google:1]
ALTER TABLE public.household ALTER COLUMN access_code SET NOT NULL;

CREATE OR REPLACE FUNCTION public.hash_household_access_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only hash if the code is new or being changed
  IF TG_OP = 'INSERT' OR NEW.access_code IS DISTINCT FROM OLD.access_code THEN
    -- crypt() handles generating a random salt and securely hashing the text
    NEW.access_code := crypt(NEW.access_code, gen_salt('bf', 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind the hashing function as a BEFORE trigger
CREATE OR REPLACE TRIGGER encrypt_access_code_before_save
BEFORE INSERT OR UPDATE ON public.household
FOR EACH ROW
EXECUTE FUNCTION public.hash_household_access_code();

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
  stored_hash TEXT;
  matched_name TEXT;
  matched_address TEXT;
BEGIN
  -- Get the stored security hash and display variables
  SELECT h.name, h.address, h.access_code 
  INTO matched_name, matched_address, stored_hash
  FROM public.household h
  WHERE h.id = target_id;

  -- FIX: Use crypt() to safely compare the user's input string against the database hash
  IF stored_hash = crypt(user_input_code, stored_hash) THEN
    RETURN QUERY SELECT true, target_id, matched_name, matched_address;
  ELSE
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$;


GRANT EXECUTE ON FUNCTION public.verify_household_access_by_id TO authenticated;

DROP FUNCTION IF EXISTS public.search_household_by_coords(NUMERIC, NUMERIC);

CREATE OR REPLACE FUNCTION public.search_household_by_coords(
  search_lat NUMERIC,
  search_lng NUMERIC
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  timezone TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if a household already exists within a ~30 meter box
  RETURN QUERY
  SELECT h.id, h.name, h.address, h.timezone
  FROM public.household h
  WHERE 
    h.latitude BETWEEN (search_lat - 0.0003) AND (search_lat + 0.0003)
    AND h.longitude BETWEEN (search_lng - 0.0003) AND (search_lng + 0.0003)
  --  Sort the results so the single closest point is always index #1
  ORDER BY (
    ((h.latitude - search_lat) ^ 2) + ((h.longitude - search_lng) ^ 2)
  ) ASC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_household_by_coords TO authenticated;
