-- ==========================================
-- 1. FOREIGN KEY INTEGRITY CORRECTION
-- ==========================================
-- Drop the old constraint that blocks household deletions
ALTER TABLE public.apartment 
DROP CONSTRAINT IF EXISTS apartment_household_id_fkey;

-- Re-create the constraint with ON DELETE CASCADE enabled
ALTER TABLE public.apartment 
ADD CONSTRAINT apartment_household_id_fkey 
FOREIGN KEY (household_id) 
REFERENCES public.household(id) 
ON DELETE CASCADE;

-- ==========================================
-- 2. ENUM AND COLUMN EXTENSIONS
-- ==========================================
-- Safely add 'admin' status to your existing booking_status type
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'admin';

-- Add the optional text notes column to the booking table
ALTER TABLE public.booking 
ADD COLUMN IF NOT EXISTS notes text NULL;

-- ==========================================
-- 3. AUTOMATED TRIGER CONFIGURATION
-- ==========================================
-- Create or replace the function that provisions the system _ADMIN_ apartment
CREATE OR REPLACE FUNCTION public.handle_new_household_admin_apartment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.apartment (household_id, display_name)
  VALUES (NEW.id, '_ADMIN_');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger cleanly to avoid duplicate trigger errors
DROP TRIGGER IF EXISTS on_household_created ON public.household;

CREATE TRIGGER on_household_created
  AFTER INSERT ON public.household
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_household_admin_apartment();

-- ==========================================
-- 4. RETROACTIVE INJECTION FOR EXISTING DATA
-- ==========================================
-- Inject the missing _ADMIN_ apartment into any households created in the past
INSERT INTO public.apartment (household_id, display_name)
SELECT id, '_ADMIN_' 
FROM public.household h
WHERE NOT EXISTS (
  SELECT 1 FROM public.apartment a 
  WHERE a.household_id = h.id AND a.display_name = '_ADMIN_'
);
