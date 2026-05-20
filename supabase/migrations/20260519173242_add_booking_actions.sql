-- ====================================================================
-- 1. PREVENTIVE STRUCTURAL CLEANUP (Wipes old definitions entirely)
-- ====================================================================
DROP FUNCTION IF EXISTS public.book_laundry_slot(UUID, DATE, INT, INT);
DROP FUNCTION IF EXISTS public.release_laundry_slot(UUID);
DROP TYPE IF EXISTS public.booking_status;

-- 2. CREATE THE FINAL PRODUCTION ENUM TYPE 
CREATE TYPE public.booking_status AS ENUM ('active', 'released');

-- 3. BIND THE ENUM TYPE TO YOUR BOOKING TABLE 
-- (We recreate the column directly since there is no data to lose)
ALTER TABLE public.booking DROP COLUMN IF EXISTS status;
ALTER TABLE public.booking ADD COLUMN status public.booking_status NOT NULL DEFAULT 'active';


-- ====================================================================
-- 2. THE PRODUCTION BOOKING FUNCTION
-- ====================================================================
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
    computed_start TIMESTAMP WITH TIME ZONE;
    computed_end TIMESTAMP WITH TIME ZONE;
    new_booking_id UUID;
BEGIN
    -- 1. Call your common access validation helper
    PERFORM public.assert_apartment_membership(target_apartment_id, auth.uid());

    -- 2. Construct clean UTC timestamp intervals
    computed_start := (booking_date + (start_hour || ' hours')::interval) AT TIME ZONE 'UTC';
    computed_end := (booking_date + (end_hour || ' hours')::interval) AT TIME ZONE 'UTC';

    -- 3. Mathematical Overlap Verification (Anti-Double-Booking Shield)
    IF EXISTS (
        SELECT 1 FROM public.booking 
        WHERE apartment_id = target_apartment_id 
          AND released_at IS NULL -- Only look at active segments
          AND (
            (start_time <= computed_start AND end_time > computed_start) OR
            (start_time < computed_end AND end_time >= computed_end) OR
            (start_time >= computed_start AND end_time <= computed_end)
          )
    ) THEN
        RAISE EXCEPTION 'Booking Conflict: The requested time range is already occupied or partially used.';
    END IF;

    -- 4. Commit atomic insertion using your clean database ENUM type
    INSERT INTO public.booking (apartment_id, created_by, start_time, end_time, status)
    VALUES (target_apartment_id, auth.uid(), computed_start, computed_end, 'active'::public.booking_status)
    RETURNING id INTO new_booking_id;

    RETURN jsonb_build_object(
        'booking_id', new_booking_id,
        'status', 'success'
    );
END;
$$;


-- ====================================================================
-- 3. THE PRODUCTION UNIFIED RELEASE FUNCTION
-- ====================================================================
CREATE OR REPLACE FUNCTION public.release_laundry_slot(target_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    associated_apartment_id UUID;
    b_start TIMESTAMP WITH TIME ZONE;
    b_end TIMESTAMP WITH TIME ZONE;
    current_moment TIMESTAMP WITH TIME ZONE := now();
BEGIN
    -- 1. Find the target row inside your schema layout
    SELECT apartment_id, start_time, end_time INTO associated_apartment_id, b_start, b_end
    FROM public.booking
    WHERE id = target_booking_id AND released_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active booking record not found or already released';
    END IF;

    -- 2. Validate common household permissions
    PERFORM public.assert_apartment_membership(associated_apartment_id, auth.uid());

    -- 3. Evaluate contextual timeline branch paths
    IF current_moment < b_start THEN
        -- SCENARIO A: Canceled future appointment -> Wipe item physically from storage
        DELETE FROM public.booking WHERE id = target_booking_id;
        RETURN jsonb_build_object('action', 'deleted', 'message', 'Booking cancelled successfully.');
        
    ELSIF current_moment >= b_start AND current_moment < b_end THEN
        -- SCENARIO B: Active ongoing appointment -> Shrink and flag as 'released' 
        UPDATE public.booking 
        SET 
          end_time = current_moment,          
          released_at = current_moment,       
          status = 'released'::public.booking_status -- Explicit clean type cast 
        WHERE id = target_booking_id;
        
        RETURN jsonb_build_object('action', 'shortened', 'message', 'Slot released early! The remaining time block is now free.');
        
    ELSE
        RAISE EXCEPTION 'Cannot release a booking that has already expired.';
    END IF;
END;
$$;


-- ====================================================================
-- 4. GATEWAY ACCESS API GRANTS
-- ====================================================================
GRANT EXECUTE ON FUNCTION public.book_laundry_slot TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_laundry_slot TO service_role;
GRANT EXECUTE ON FUNCTION public.release_laundry_slot TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_laundry_slot TO service_role;
