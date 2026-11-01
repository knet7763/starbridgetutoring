-- ============================================================
-- StarBridge DB Patch: Seed app_settings for email triggers
-- Run this in the Supabase SQL Editor ONCE.
--
-- Replace the placeholder values below with your real ones:
--   supabase_url    → your project URL (already in .env as VITE_SUPABASE_URL)
--   service_role_key → from Supabase Dashboard → Settings → API → service_role key
--   admin_email     → the email address that receives trial request alerts
-- ============================================================

-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Restrict access: only service role / SECURITY DEFINER functions can read this
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access to app_settings" ON public.app_settings;
CREATE POLICY "No public access to app_settings"
    ON public.app_settings
    FOR ALL
    USING (false);

-- ⚠️  INSERT YOUR REAL VALUES BELOW ⚠️
-- Supabase project URL (no trailing slash)
INSERT INTO public.app_settings (key, value)
VALUES ('supabase_url', 'https://acrzypzzbbkdisietjlf.supabase.co')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Service role key  ← GET THIS FROM: Supabase Dashboard > Settings > API > service_role (secret)
-- INSERT INTO public.app_settings (key, value)
-- VALUES ('service_role_key', 'YOUR_SERVICE_ROLE_KEY_HERE')
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Admin email for trial request notifications
INSERT INTO public.app_settings (key, value)
VALUES ('admin_email', 'admin@starbridgetutors.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- IMPORTANT: The service_role_key line above is commented out
-- for security. You MUST run it separately with your real key.
-- 
-- Alternatively, set it as a Supabase DB setting:
--   ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_KEY';
-- ============================================================

 