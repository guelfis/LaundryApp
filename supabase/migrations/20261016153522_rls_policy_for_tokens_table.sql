-- 1. Enable Row Level Security (RLS) on the tokens table
ALTER TABLE public.user_fcm_tokens ENABLE ROW LEVEL SECURITY;

-- 2. Policy for INSERT, SELECT, and UPDATE (All wrapped inside the frontend Upsert routine)
-- Allows an authenticated user to register or modify a token only if the profile_id matches their own auth UID
CREATE POLICY "Allow users to insert or update their own tokens" 
ON public.user_fcm_tokens
FOR ALL 
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- 3. Policy for DELETE operations
-- Allows an authenticated user to safely wipe out a device token (e.g., during a signOut action)
CREATE POLICY "Allow users to delete their own tokens" 
ON public.user_fcm_tokens
FOR DELETE
TO authenticated
USING (auth.uid() = profile_id);
