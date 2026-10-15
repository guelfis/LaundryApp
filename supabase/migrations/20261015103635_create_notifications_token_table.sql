CREATE TYPE public.device_platform AS ENUM ('web', 'android', 'ios');

CREATE TABLE public.user_fcm_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  fcm_token text NOT NULL,
  device_type public.device_platform NOT NULL DEFAULT 'web'::public.device_platform,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_fcm_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT user_fcm_tokens_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_fcm_tokens_token_unique UNIQUE (fcm_token)
)TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS user_fcm_tokens_profile_id_idx 
ON public.user_fcm_tokens USING btree (profile_id) TABLESPACE pg_default;