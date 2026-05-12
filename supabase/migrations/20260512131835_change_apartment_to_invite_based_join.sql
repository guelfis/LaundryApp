-- 1. DROP DEPENDENT POLICIES
-- Dobbiamo eliminare la policy che blocca la modifica
DROP POLICY IF EXISTS "Users can manage their own apartment bookings" ON public.booking;

-- 2. CLEANUP PROFILES
-- Ora che la policy è andata, possiamo rimuovere la colonna
ALTER TABLE public.profiles DROP COLUMN IF EXISTS apartment_id;


-- 2. RE-CREATE APARTMENT TABLE (Senza password)
-- Se hai già dati, usa ALTER TABLE, altrimenti questo è il look finale
ALTER TABLE public.apartment DROP COLUMN IF EXISTS password_hash;

-- 3. APARTMENT MEMBERS (La "sorgente della verità" per chi appartiene a cosa)
CREATE TABLE IF NOT EXISTS public.apartment_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES public.apartment(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT apartment_members_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_apartment UNIQUE (user_id, apartment_id)
);

-- 3. RE-CREATE BOOKING POLICY (Updated Logic)
-- Ora definiamo chi può gestire i booking: 
-- "Un utente può gestire un booking se appartiene all'appartamento collegato a quel booking"
CREATE POLICY "Users can manage their apartment bookings" ON public.booking
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.apartment_members
    WHERE apartment_members.apartment_id = booking.apartment_id
    AND apartment_members.user_id = auth.uid()
  )
);

-- 4. APARTMENT INVITATIONS (I token per i link di invito)
CREATE TABLE IF NOT EXISTS public.apartment_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES public.apartment(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  max_uses int DEFAULT 5,
  current_uses int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT apartment_invitations_pkey PRIMARY KEY (id)
);

-- 5. FUNCTION: JOIN VIA TOKEN
-- Gestisce in modo atomico il controllo del token e l'aggiunta del membro
CREATE OR REPLACE FUNCTION join_apartment_via_token(token_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_apt_id UUID;
    invite_record RECORD;
BEGIN
    -- Trova l'invito e blocca la riga per evitare race conditions
    SELECT * INTO invite_record 
    FROM public.apartment_invitations 
    WHERE id = token_id AND expires_at > now()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation link is invalid or has expired';
    END IF;

    IF invite_record.current_uses >= invite_record.max_uses THEN
        RAISE EXCEPTION 'This invitation link has reached its maximum uses';
    END IF;

    -- Aggiunge l'utente all'appartamento
    INSERT INTO public.apartment_members (apartment_id, user_id, role)
    VALUES (invite_record.apartment_id, auth.uid(), 'member')
    ON CONFLICT (user_id, apartment_id) DO NOTHING;

    -- Incrementa il contatore usi
    UPDATE public.apartment_invitations 
    SET current_uses = current_uses + 1 
    WHERE id = token_id;

    RETURN jsonb_build_object(
        'apartment_id', invite_record.apartment_id,
        'status', 'success'
    );
END;
$$;

-- 6. SECURITY: RLS POLICIES
ALTER TABLE public.apartment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apartment_invitations ENABLE ROW LEVEL SECURITY;

-- Chiunque sia loggato può vedere i propri inserimenti in apartment_members
CREATE POLICY "Users can view their own memberships" ON public.apartment_members
FOR SELECT USING (auth.uid() = user_id);

-- Solo gli admin dell'appartamento possono creare inviti
CREATE POLICY "Admins can manage invitations" ON public.apartment_invitations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.apartment_members 
    WHERE apartment_id = apartment_invitations.apartment_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);
