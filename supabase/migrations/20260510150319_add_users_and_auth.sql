-- Tabella Profili (collegata a Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  apartment_id uuid REFERENCES apartment(id) ON DELETE SET NULL,
  full_name text,
  updated_at timestamptz DEFAULT now()
);

-- Opzionale: aggiungi created_by alla tabella booking
ALTER TABLE booking ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id);

-- 2. ABILITA RLS (Sicurezza attiva di default)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking ENABLE ROW LEVEL SECURITY;
ALTER TABLE household ENABLE ROW LEVEL SECURITY;

-- 2. FUNZIONE HELPER (Ottimizza le Policy RLS)
-- Recupera l'ID del condominio dell'utente in modo super veloce
CREATE OR REPLACE FUNCTION public.get_my_household_id()
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER -- <--- IMPORTANTE: permette alla funzione di leggere oltre l'RLS
SET search_path = public
AS $$
  SELECT a.household_id 
  FROM public.profiles p
  JOIN public.apartment a ON p.apartment_id = a.id
  WHERE p.id = auth.uid();
$$;


-- 3. FUNZIONE DI ASSEGNAZIONE SICURA (Da usare al primo accesso)
-- Verifica il codice casa prima di associare l'utente all'appartamento
CREATE OR REPLACE FUNCTION public.assign_user_to_apartment(h_code text, target_apt_id uuid)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    found_household_id uuid;
BEGIN
    -- Verifica se il codice casa è corretto
    SELECT id INTO found_household_id FROM household WHERE access_code = h_code;

    IF found_household_id IS NULL THEN
        RAISE EXCEPTION 'Codice casa non valido.';
    END IF;

    -- Verifica che l'appartamento appartenga a quella casa
    IF NOT EXISTS (
        SELECT 1 FROM apartment 
        WHERE id = target_apt_id AND household_id = found_household_id
    ) THEN
        RAISE EXCEPTION 'L’appartamento non appartiene a questa casa.';
    END IF;

    -- Aggiorna il profilo
    UPDATE public.profiles
    SET apartment_id = target_apt_id
    WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. AGGIORNAMENTO POLICY RLS (Uso della funzione helper)

-- Policy per APARTMENT (Vedi solo quelli del tuo condominio)
DROP POLICY IF EXISTS "Users can view apartments in the same household" ON apartment;
CREATE POLICY "Users can view apartments in the same household"
ON apartment FOR SELECT
USING ( household_id = get_my_household_id() );

-- Policy per BOOKING (Vedi i booking del condominio, gestisci i tuoi)\
DROP POLICY IF EXISTS "Users can view bookings in the same household" ON booking;
CREATE POLICY "Users can view bookings in the same household"
ON booking FOR SELECT
USING (
  apartment_id IN (
    SELECT id FROM apartment WHERE household_id = get_my_household_id()
  )
);

DROP POLICY IF EXISTS "Users can manage their own apartment bookings" ON booking;
CREATE POLICY "Users can manage their own apartment bookings"
ON booking FOR ALL
USING (
  apartment_id = (SELECT apartment_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  apartment_id = (SELECT apartment_id FROM profiles WHERE id = auth.uid())
);

-- 5. POLICY PER PROFILES (Altrimenti l'utente non può leggere il suo appartamento)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- 3. FUNZIONE RPC "GATEKEEPER" (Discovery sicuro degli appartamenti)
-- Questa funzione permette di vedere gli appartamenti di una casa SOLO conoscendo il codice casa.
-- Non richiede RLS attive sulla tabella apartment per la fase di setup.
CREATE OR REPLACE FUNCTION get_apartments_by_house_code(h_code text)
RETURNS TABLE (apt_id uuid, apt_name text) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.display_name 
  FROM apartment a
  JOIN household h ON a.household_id = h.id
  WHERE h.access_code = h_code;
END;
$$;

-- 6. TRIGGER AUTOMATICO (Crea il profilo al momento del Signup)


DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP POLICY IF EXISTS "Users can view their own household" ON household;
CREATE POLICY "Users can view their own household"
ON household FOR SELECT
USING ( id = get_my_household_id() );