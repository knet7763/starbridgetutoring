-- ============================================================================
-- STARBRIDGE TUTORING: DYNAMIC ADMIN & ROLE MANAGEMENT
-- 
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/acrzypzzbbkdisietjlf/sql/new
-- ============================================================================

-- 1. Helper function to assign or change ANY user's role from SQL
-- Example usage:
--   SELECT public.set_user_role('someone@example.com', 'admin');
--   SELECT public.set_user_role('teacher@example.com', 'teacher');
--   SELECT public.set_user_role('student@example.com', 'student');
CREATE OR REPLACE FUNCTION public.set_user_role(
    p_email TEXT,
    p_role TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_old_role TEXT;
BEGIN
    -- Look up user by email
    SELECT id, raw_app_meta_data->>'role'
    INTO v_user_id, v_old_role
    FROM auth.users
    WHERE LOWER(email) = LOWER(TRIM(p_email));

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User "%" not found in auth.users. Create the account in Supabase Auth first.', p_email;
    END IF;

    -- Update role in app_metadata
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p_role)
    WHERE id = v_user_id;

    -- If assigning an admin, automatically update app_settings so trial/booking alerts go to this admin
    IF p_role = 'admin' THEN
        INSERT INTO public.app_settings (key, value)
        VALUES ('admin_email', LOWER(TRIM(p_email)))
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'email', p_email,
        'previous_role', COALESCE(v_old_role, 'none'),
        'new_role', p_role,
        'message', 'User role updated successfully'
    );
END;
$$;

-- 2. Allow public to read the active admin_email so frontend dynamically uses the active admin
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of admin_email" ON public.app_settings;
CREATE POLICY "Allow public read of admin_email" 
    ON public.app_settings 
    FOR SELECT 
    USING (key = 'admin_email');

-- 3. Auto-sync trigger: changing admin_email in app_settings automatically grants role='admin'
CREATE OR REPLACE FUNCTION public.sync_admin_email_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.key = 'admin_email' AND NEW.value IS NOT NULL THEN
        UPDATE auth.users
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
        WHERE LOWER(email) = LOWER(TRIM(NEW.value));
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_app_settings_admin_email ON public.app_settings;
CREATE TRIGGER on_app_settings_admin_email
    AFTER INSERT OR UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_admin_email_role();

-- 4. Auto-sync trigger: adding/updating a tutor email automatically grants role='teacher' (unless already admin)
CREATE OR REPLACE FUNCTION public.sync_tutor_email_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.email IS NOT NULL THEN
        UPDATE auth.users
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "teacher"}'::jsonb
        WHERE LOWER(email) = LOWER(TRIM(NEW.email))
          AND COALESCE(raw_app_meta_data->>'role', '') <> 'admin';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_tutor_email_sync ON public.tutors;
CREATE TRIGGER on_tutor_email_sync
    AFTER INSERT OR UPDATE OF email ON public.tutors
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_tutor_email_role();

-- 5. View to inspect all admins and teachers in one click:
-- SELECT * FROM public.staff_users;
CREATE OR REPLACE VIEW public.staff_users AS
SELECT 
    id,
    email,
    raw_app_meta_data->>'role' AS role,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE raw_app_meta_data->>'role' IN ('admin', 'teacher');


