-- 1. Drop ALL older conflicting policy names to clean up the table space
DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON public.booking;
DROP POLICY IF EXISTS "Authenticated users can insert bookings" ON public.booking;
DROP POLICY IF EXISTS "Authenticated users can read bookings" ON public.booking;
DROP POLICY IF EXISTS "Authenticated users can update bookings" ON public.booking;
DROP POLICY IF EXISTS "Users can manage their apartment bookings" ON public.booking;
DROP POLICY IF EXISTS "Users can view bookings in the same household" ON public.booking;

-- 2. READ RULE: Allow users to view any booking inside their shared building (household)
CREATE POLICY "Users can view bookings in the same household"
ON public.booking 
FOR SELECT
TO authenticated
USING (
  apartment_id IN (
    SELECT a.id 
    FROM public.apartment a
    WHERE a.household_id = (
      SELECT am_sub.household_id 
      FROM public.apartment_members m_sub
      JOIN public.apartment am_sub ON m_sub.apartment_id = am_sub.id
      WHERE m_sub.user_id = auth.uid()
      LIMIT 1
    )
  )
);

-- 3. INSERT RULE: Allow users to create bookings ONLY for their assigned apartment row
CREATE POLICY "Users can insert bookings for their own apartment"
ON public.booking
FOR INSERT
TO authenticated
WITH CHECK (
  apartment_id IN (
    SELECT m.apartment_id 
    FROM public.apartment_members m 
    WHERE m.user_id = auth.uid()
  )
);

-- 4. DELETE/UPDATE RULE: Allow users to modify or release ONLY their own apartment's slots
CREATE POLICY "Users can manage their own apartment bookings"
ON public.booking
FOR ALL -- Covers UPDATE and DELETE actions securely
TO authenticated
USING (
  apartment_id IN (
    SELECT m.apartment_id 
    FROM public.apartment_members m 
    WHERE m.user_id = auth.uid()
  )
);


