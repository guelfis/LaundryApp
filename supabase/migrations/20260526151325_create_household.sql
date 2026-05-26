-- edit the household table to add the location 
ALTER TABLE public.household 
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
  ALTER COLUMN address TYPE TEXT;

-- ANTI duplicates shield: avoids the hoise in the same coordinates of existing one
ALTER TABLE public.household 
  ADD CONSTRAINT unique_building_coordinates UNIQUE (latitude, longitude);


-- Landlord table -> superadmin of the building
CREATE TABLE IF NOT EXISTS public.household_admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.household(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT household_admins_pkey PRIMARY KEY (id),
  CONSTRAINT unique_landlord_per_building UNIQUE (household_id, user_id)
);

-- RLS safety
ALTER TABLE public.household_admins ENABLE ROW LEVEL SECURITY;

-- grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_admins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_admins TO service_role;


-- ====================================================================
-- 1. PROCEDURAL INITIALIZATION: CREATE HOUSEHOLD ROUTINE
-- ====================================================================

CREATE OR REPLACE FUNCTION public.create_household_as_landlord(
  household_name TEXT,
  formatted_address TEXT,
  target_lat NUMERIC,
  target_lng NUMERIC,
  target_timezone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Safely elevates privileges to manage system tables
AS $$
DECLARE
    new_household_id UUID;
    generated_access_code TEXT;
BEGIN
    -- 1. Anti-Duplication Shield: Verify no active household exists at these coordinates 
    IF EXISTS (
        SELECT 1 FROM public.household 
        WHERE latitude = target_lat AND longitude = target_lng
    ) THEN
        RAISE EXCEPTION 'Conflict Error: This physical building layout is already registered in our system.';
    END IF;

    -- 2. Alphanumeric Token Compiler: Generates a short random 6-character registration token
    generated_access_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    -- 3. Atomic Insertion: Commit core building record assets into storage 
    INSERT INTO public.household (name, address, access_code, latitude, longitude, timezone)
    VALUES (household_name, formatted_address, generated_access_code, target_lat, target_lng, target_timezone)
    RETURNING id INTO new_household_id;

    -- 4. Identity Management: Bind the active auth session profile as the single Super Admin 
    INSERT INTO public.household_admins (household_id, user_id)
    VALUES (new_household_id, auth.uid());

    -- 5. Return structured response payload back to the client window
    RETURN jsonb_build_object(
        'status', 'success',
        'household_id', new_household_id,
        'access_code', generated_access_code,
        'message', 'Household created successfully and bound to your profile layout namespace.'
    );
END;
$$;


-- ====================================================================
-- 2. ACCESS COMPLIANCE & SECURITY GATEWAYS (RLS POLICIES)
-- ====================================================================

-- Enable system row isolation protection layers if not active
ALTER TABLE public.household_admins ENABLE ROW LEVEL SECURITY;

-- Isolation Policy: Landlords can exclusively view their own building manager tracking grids
CREATE POLICY "Landlords can view their admin assignments" ON public.household_admins
FOR SELECT USING (user_id = auth.uid());

-- RESTful exposure grants allowing secure triggers from the PostgREST API gateway
GRANT EXECUTE ON FUNCTION public.create_household_as_landlord TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_household_as_landlord TO service_role;
