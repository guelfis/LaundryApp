ALTER TABLE public.apartment_members
ADD CONSTRAINT fk_apartment_members_profiles
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id)
ON DELETE CASCADE;