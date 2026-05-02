-- LOGDOCK SECURITY FOUNDATION MIGRATION
-- Project: rrjnkmgkhbtapumgmhhr
-- Date: 2026-05-01

-- 1. CORE TABLES FOR OPERATIONAL MEMORY
CREATE TABLE IF NOT EXISTS public.logdock_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL, -- 'IA', 'SISTEMA', 'USUARIO'
    entity_type TEXT, -- 'VEHICLE', 'DRIVER', 'DELIVERY'
    details TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. AUDIT LOGGING SYSTEM (ISO 27001 / SOC 2)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    company_id UUID,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER audit_files_trigger AFTER INSERT OR UPDATE OR DELETE ON public.files FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
CREATE TRIGGER audit_folders_trigger AFTER INSERT OR UPDATE OR DELETE ON public.folders FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
CREATE TRIGGER audit_events_trigger AFTER INSERT OR UPDATE OR DELETE ON public.logdock_events FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 3. ROW LEVEL SECURITY (RLS) - MULTI-TENANT ISOLATION
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logdock_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Shared function for tenant check
CREATE OR REPLACE FUNCTION public.get_user_company()
RETURNS UUID AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Policies for Files
CREATE POLICY "LogDock: Files Tenant Isolation" ON public.files
    FOR ALL USING (company_id = get_user_company());

-- Policies for Folders
CREATE POLICY "LogDock: Folders Tenant Isolation" ON public.folders
    FOR ALL USING (company_id = get_user_company());

-- Policies for Events
CREATE POLICY "LogDock: Events Tenant Isolation" ON public.logdock_events
    FOR ALL USING (company_id = get_user_company());

-- 4. STORAGE BUCKET SECURITY
-- Bucket: 'logdock'
-- Policy: Only allow access to folders matching company_id
CREATE POLICY "LogDock: Storage Isolation"
ON storage.objects FOR ALL TO authenticated
USING (
    bucket_id = 'logdock' AND
    (storage.foldername(name))[1] = get_user_company()::text
);

-- 5. MFA ENFORCEMENT FUNCTION
CREATE OR REPLACE FUNCTION public.is_mfa_active()
RETURNS BOOLEAN AS $$
    SELECT count(*) > 0 FROM auth.mfa_amr_claims WHERE method = 'totp';
$$ LANGUAGE plpgsql SECURITY DEFINER;
