-- 1. Define the allowed values for the custom ENUM type if it doesn't exist
CREATE TYPE public.apartment_role AS ENUM ('admin', 'member');

-- 2. Temporarily drop the 3 RLS policies blocking the column modification
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.apartment_invitations;
DROP POLICY IF EXISTS "Admins can view apartment invitations" ON public.apartment_invitations;
DROP POLICY IF EXISTS "Admins can view inbound join requests" ON public.join_requests;

-- 3. Drop the old hidden text constraint that was causing the seed layout errors
ALTER TABLE public.apartment_members 
DROP CONSTRAINT IF EXISTS apartment_members_role_check;

-- 4. CRITICAL FIX: Clear out the old text default constraint to prevent casting failures
ALTER TABLE public.apartment_members 
ALTER COLUMN role DROP DEFAULT;

-- 5. Safely change the type of the "role" column to the new ENUM
ALTER TABLE public.apartment_members 
  ALTER COLUMN role TYPE public.apartment_role 
  USING role::public.apartment_role;

-- 6. Apply a fresh, correct ENUM-based default value configuration
ALTER TABLE public.apartment_members 
  ALTER COLUMN role SET DEFAULT 'member'::public.apartment_role;

-- 7. Recreate your 3 original policies exactly as they were mapping them to the new type
CREATE POLICY "Admins can manage invitations" ON public.apartment_invitations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.apartment_members 
    WHERE apartment_id = apartment_invitations.apartment_id 
    AND user_id = auth.uid() 
    AND role = 'admin'::public.apartment_role
  )
);

CREATE POLICY "Admins can view apartment invitations" ON public.apartment_invitations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.apartment_members 
    WHERE apartment_id = apartment_invitations.apartment_id 
    AND user_id = auth.uid() 
    AND role = 'admin'::public.apartment_role
  )
);

CREATE POLICY "Admins can view inbound join requests" ON public.join_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.apartment_members 
    WHERE apartment_id = join_requests.apartment_id 
    AND user_id = auth.uid() 
    AND role = 'admin'::public.apartment_role
  )
);
