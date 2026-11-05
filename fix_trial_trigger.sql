-- ============================================================================
-- FIX TRIAL REQUEST TRIGGER ERROR: record "new" has no field "name"
-- 
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/acrzypzzbbkdisietjlf/sql/new
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_trial_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_email   TEXT;
    v_supabase_url  TEXT;
    v_service_key   TEXT;
BEGIN
    SELECT value INTO v_admin_email FROM public.app_settings WHERE key = 'admin_email';
    IF v_admin_email IS NULL THEN
        v_admin_email := 'knet7763@gmail.com';
    END IF;

    SELECT value INTO v_supabase_url FROM public.app_settings WHERE key = 'supabase_url';
    IF v_supabase_url IS NULL THEN
        v_supabase_url := 'https://acrzypzzbbkdisietjlf.supabase.co';
    END IF;

    SELECT value INTO v_service_key FROM public.app_settings WHERE key = 'service_role_key';
    IF v_service_key IS NULL THEN
        v_service_key := current_setting('app.settings.service_role_key', true);
    END IF;

    IF v_admin_email IS NOT NULL AND v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
        PERFORM net.http_post(
            url := v_supabase_url || '/functions/v1/send-email',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_key
            ),
            body := jsonb_build_object(
                'templateId', 'trial_request_admin',
                'to', v_admin_email,
                'data', jsonb_build_object(
                    'parentName', COALESCE(NEW.parent_name, 'Unknown'),
                    'studentName', COALESCE(NEW.student_name, 'Not provided'),
                    'email', COALESCE(NEW.email, 'Not provided'),
                    'phone', COALESCE(NEW.phone, 'Not provided'),
                    'subject', COALESCE(NEW.subject, 'Not specified'),
                    'message', COALESCE(NEW.grade_level, '')
                )
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_trial_request ON public.trial_requests;
CREATE TRIGGER on_trial_request
    AFTER INSERT ON public.trial_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_trial_request();

