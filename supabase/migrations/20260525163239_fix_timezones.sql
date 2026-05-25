ALTER TABLE public.household 
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Europe/Zurich';

DROP FUNCTION IF EXISTS public.book_laundry_slot(UUID, DATE, INT, INT);

CREATE OR REPLACE FUNCTION public.book_laundry_slot(
  target_apartment_id UUID,
  booking_date DATE,
  start_hour INT,
  end_hour INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    chosen_timezone TEXT; -- household timezone
    computed_start TIMESTAMP WITH TIME ZONE;
    computed_end TIMESTAMP WITH TIME ZONE;
    new_booking_id UUID;
BEGIN
    -- get the building timezone
    SELECT h.timezone INTO chosen_timezone
    FROM public.apartment a
    JOIN public.household h ON a.household_id = h.id
    WHERE a.id = target_apartment_id;

    -- Fallback 
    IF chosen_timezone IS NULL THEN
        chosen_timezone := 'Europe/Zurich';
    END IF;

    -- Convert the time to the UTC. what it does is saving in UTC but it computes it based on the timezone you give
    computed_start := (booking_date + (start_hour || ' hours')::interval) AT TIME ZONE chosen_timezone;
    computed_end := (booking_date + (end_hour || ' hours')::interval) AT TIME ZONE chosen_timezone;

    -- 3. avoid double bookings (Shield)
    IF EXISTS (
        SELECT 1 FROM public.booking 
        WHERE apartment_id = target_apartment_id 
          AND released_at IS NULL
          AND (
            (start_time <= computed_start AND end_time > computed_start) OR
            (start_time < computed_end AND end_time >= computed_end) OR
            (start_time >= computed_start AND end_time <= computed_end)
          )
    ) THEN
        RAISE EXCEPTION 'Booking Conflict: The requested time range is already occupied.';
    END IF;

    -- 4. Adding the record (PostgreSQL memorizzerà in UTC)
    INSERT INTO public.booking (apartment_id, created_by, start_time, end_time, status)
    VALUES (target_apartment_id, auth.uid(), computed_start, computed_end, 'active'::public.booking_status)
    RETURNING id INTO new_booking_id;

    RETURN jsonb_build_object(
        'booking_id', new_booking_id,
        'status', 'success'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_laundry_slot TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_laundry_slot TO service_role;