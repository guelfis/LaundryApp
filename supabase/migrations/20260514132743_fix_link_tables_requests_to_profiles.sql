-- 1. FIX THE RELATION BETWEEN JOIN_REQUESTS AND PROFILES
-- Drop the old constraint pointing to auth.users if it exists
ALTER TABLE public.join_requests 
  DROP CONSTRAINT IF EXISTS join_requests_user_id_fkey;

-- Add the new proper constraint linking to public.profiles
ALTER TABLE public.join_requests 
  ADD CONSTRAINT join_requests_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- 2. FIX THE RELATION BETWEEN APARTMENT_INVITATIONS AND PROFILES
-- Drop the old constraint pointing to auth.users if it exists
ALTER TABLE public.apartment_invitations 
  DROP CONSTRAINT IF EXISTS apartment_invitations_created_by_fkey;

-- Add the new proper constraint linking to public.profiles
ALTER TABLE public.apartment_invitations 
  ADD CONSTRAINT apartment_invitations_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- 3. APPLY EXPLICIT SECURITY GRANTS (Required by the new Supabase update)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apartment_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apartment_members TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.apartment_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apartment_invitations TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.join_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.join_requests TO service_role;
