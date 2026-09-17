-- 1. Add the configuration columns directly to your household table
ALTER TABLE public.household 
ADD COLUMN start_hour INT NOT NULL DEFAULT 7 CHECK (start_hour >= 0 AND start_hour <= 23),
ADD COLUMN end_hour INT NOT NULL DEFAULT 22 CHECK (end_hour > start_hour AND end_hour <= 24),
ADD COLUMN slots JSONB NOT NULL DEFAULT '[
  {"id": "morning", "start": 7, "end": 12},
  {"id": "afternoon", "start": 12, "end": 17},
  {"id": "evening", "start": 17, "end": 22}
]'::jsonb;

-- 2. Performance optimization: Create a GIN index on the slots jsonb column 
-- This allows incredibly fast internal JSON searching/filtering pathways if needed later
CREATE INDEX idx_household_slots ON public.household USING gin (slots);

DROP FUNCTION IF EXISTS public.create_household_as_landlord(
  household_name TEXT,
  formatted_address TEXT,
  target_lat NUMERIC,
  target_lng NUMERIC,
  target_timezone TEXT
);

CREATE OR REPLACE FUNCTION public.create_household_as_landlord(
  household_name TEXT,
  formatted_address TEXT,
  target_lat NUMERIC,
  target_lng NUMERIC,
  target_timezone TEXT,
  custom_start_hour INT,
  custom_end_hour INT,
  custom_slots JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Safely elevates privileges to manage system tables
AS $$
DECLARE
    new_household_id UUID;
    generated_access_code TEXT;
    current_caller_id UUID := auth.uid();
BEGIN
    -- 1. Security Check: Ensure caller is authenticated
    IF current_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: You must be logged in to create a household.';
    END IF;

    -- 2. Anti-Duplication Shield: Verify no active household exists at these coordinates 
    IF EXISTS (
        SELECT 1 FROM public.household 
        WHERE latitude = target_lat AND longitude = target_lng
    ) THEN
        RAISE EXCEPTION 'Conflict Error: This physical building layout is already registered in our system.';
    END IF;

    -- validate start and end time
    IF custom_start_hour < 0 OR custom_start_hour > 23 THEN
        RAISE EXCEPTION 'Validation Error: Start hour must be between 0 and 23.';
    END IF;
    IF custom_end_hour <= custom_start_hour OR custom_end_hour > 24 THEN
        RAISE EXCEPTION 'Validation Error: End hour must be greater than start hour and maximum 24.';
    END IF;

    -- 3. Alphanumeric Token Compiler: Generates a short random 6-character registration token
    generated_access_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    -- 4. Atomic Insertion: Commit core building record assets into storage 
    INSERT INTO public.household (name, address, access_code, latitude, longitude, timezone, custom_start_hour, custom_end_hour, custom_slots)
    VALUES (household_name, formatted_address, generated_access_code, target_lat, target_lng, target_timezone, custom_start_hour, custom_end_hour, custom_slots)
    RETURNING id INTO new_household_id;

    -- 5. UPDATED: Bind the active auth user to the new memberships layout explicitly as a household 'admin'
    -- Since they don't have an apartment yet, apartment fields remain NULL.
    INSERT INTO public.memberships (household_id, user_id, household_role, apartment_id, apartment_role)
    VALUES (
      new_household_id, 
      current_caller_id, 
      'admin'::public.household_role,
      NULL,
      NULL
    );

    -- 6. Return structured response payload back to the client window
    RETURN jsonb_build_object(
        'status', 'success',
        'household_id', new_household_id,
        'access_code', generated_access_code,
        'message', 'Household created successfully and bound to your profile layout namespace.'
    );
END;
$$;

-- Grant execution permission so your authenticated Ionic app can run this RPC call
GRANT EXECUTE ON FUNCTION public.create_household_as_landlord TO authenticated;

