-- 1. Ensure the tracking columns exist (if you haven't added them already)
ALTER TABLE public.support_tickets DROP COLUMN IF EXISTS user_email;

ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS household_id UUID;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS apartment_id UUID;
ALTER TABLE public.support_tickets ADD COLUMN profile_id UUID;

ALTER TABLE public.support_tickets 
  ADD CONSTRAINT support_tickets_profile_id_fkey 
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


-- 2. Bind the household column securely to public.household(id)
ALTER TABLE public.support_tickets 
  DROP CONSTRAINT IF EXISTS support_tickets_household_id_fkey,
  ADD CONSTRAINT support_tickets_household_id_fkey 
  FOREIGN KEY (household_id) REFERENCES public.household(id) ON DELETE SET NULL;

-- 3. Bind the apartment column securely to public.apartment(id)
ALTER TABLE public.support_tickets 
  DROP CONSTRAINT IF EXISTS support_tickets_apartment_id_fkey,
  ADD CONSTRAINT support_tickets_apartment_id_fkey 
  FOREIGN KEY (apartment_id) REFERENCES public.apartment(id) ON DELETE SET NULL;

-- 4. Set up performance lookup indexes for rapid querying
CREATE INDEX IF NOT EXISTS idx_support_tickets_household ON public.support_tickets(household_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_apartment ON public.support_tickets(apartment_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_profile ON public.support_tickets(profile_id);

-- Notice we use ON DELETE SET NULL. 
--This means if a user completely deletes their apartment or household later, the bug report text will not be deleted from database.