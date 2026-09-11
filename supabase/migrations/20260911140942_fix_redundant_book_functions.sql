DROP FUNCTION IF EXISTS public.book_laundry_slot(UUID, DATE, INT, INT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.book_laundry_slot(UUID, DATE, INT, INT, TEXT);

CREATE OR REPLACE FUNCTION public.book_laundry_slot(
  target_apartment_id UUID,
  booking_date DATE,
  start_hour INT,
  end_hour INT,
  notes TEXT DEFAULT NULL, 
  requested_status TEXT DEFAULT 'active' -- to distinguish between user and admin bookings
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    chosen_timezone TEXT;
    computed_start TIMESTAMP WITH TIME ZONE;
    computed_end TIMESTAMP WITH TIME ZONE;
    new_booking_id UUID;
    validated_status public.booking_status; -- 2. Variable to hold casted enum type
BEGIN
    -- Validate that the input text matches your allowed application enums
    IF requested_status NOT IN ('active', 'admin') THEN
        RAISE EXCEPTION 'Invalid Status: Must be either active or admin.';
    END IF;

    -- Cast text input explicitly to your existing custom enum type schema
    validated_status := requested_status::public.booking_status;

    -- Get the building timezone
    SELECT h.timezone INTO chosen_timezone
    FROM public.apartment a
    JOIN public.household h ON a.household_id = h.id
    WHERE a.id = target_apartment_id;

    -- Fallback 
    IF chosen_timezone IS NULL THEN
        chosen_timezone := 'Europe/Zurich';
    END IF;

    -- Convert the time to UTC based on the local household timezone
    computed_start := (booking_date + (start_hour || ' hours')::interval) AT TIME ZONE chosen_timezone;
    computed_end := (booking_date + (end_hour || ' hours')::interval) AT TIME ZONE chosen_timezone;

    -- 3. Avoid double bookings (Shield)
    -- Crucial: Check if the slot is occupied, regardless of whether it was blocked by a user or an admin!
    IF EXISTS (
        SELECT 1 FROM public.booking 
        WHERE released_at IS NULL
          AND (
            (start_time <= computed_start AND end_time > computed_start) OR
            (start_time < computed_end AND end_time >= computed_end) OR
            (start_time >= computed_start AND end_time <= computed_end)
          )
    ) THEN
        RAISE EXCEPTION 'Booking Conflict: The requested time range is already occupied.';
    END IF;

    -- 4. Adding the record with our dynamic status
    INSERT INTO public.booking (apartment_id, created_by, start_time, end_time, status, notes)
    VALUES (target_apartment_id, auth.uid(), computed_start, computed_end, validated_status, notes)
    RETURNING id INTO new_booking_id;

    RETURN jsonb_build_object(
        'booking_id', new_booking_id,
        'status', 'success'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_laundry_slot(UUID, DATE, INTEGER, INTEGER, TEXT, TEXT) TO authenticated;
