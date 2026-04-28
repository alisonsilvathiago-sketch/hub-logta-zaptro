-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    details TEXT,
    type TEXT DEFAULT 'SYSTEM', -- 'LOGISTICS', 'FINANCE', 'SECURITY', 'USER', 'SYSTEM'
    severity TEXT DEFAULT 'INFO', -- 'INFO', 'MEDIUM', 'HIGH', 'CRITICAL'
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users see only logs from their own company
CREATE POLICY "Company-Scoped Audit Logs isolation" ON public.audit_logs
FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Policy: Any system action (or user action via Supabase trigger) can insert
-- In a real scenario, we might want only SERVICE_ROLE to insert, 
-- but for this demo, we allow authenticated users to insert their own logs.
CREATE POLICY "Users can insert their own company logs" ON public.audit_logs
FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Helper function to log actions (can be called from triggers)
CREATE OR REPLACE FUNCTION public.log_action(
    p_company_id UUID,
    p_user_id UUID,
    p_action TEXT,
    p_details TEXT,
    p_type TEXT DEFAULT 'SYSTEM',
    p_severity TEXT DEFAULT 'INFO'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.audit_logs (company_id, user_id, action, details, type, severity)
    VALUES (p_company_id, p_user_id, p_action, p_details, p_type, p_severity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
