-- Migration: Nexio Unified Audit System
-- Description: Unified audit logging for all tenant and master actions with JSONB diff support.

-- 1. Unificar e Expandir Tabela de Logs
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS module TEXT,
ADD COLUMN IF NOT EXISTS entity TEXT,
ADD COLUMN IF NOT EXISTS entity_id UUID,
ADD COLUMN IF NOT EXISTS before_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS after_data JSONB DEFAULT '{}';

-- 2. Garantir que a tabela master_audit_logs possa coexistir ou ser migrada
-- Por simplicidade, manteremos a audit_logs como fonte principal de BI/Auditoria.

-- 3. Função Universal de Auditoria (Magic Trigger)
CREATE OR REPLACE FUNCTION public.fn_audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_company_id UUID;
    v_old_data JSONB := '{}';
    v_new_data JSONB := '{}';
BEGIN
    -- Capturar ID do usuário da sessão do Supabase
    v_user_id := auth.uid();
    
    -- Tentar capturar company_id do usuário logado (armazenado no JWT ou via profile)
    -- Em triggers, é mais seguro buscar do profile se não estiver no row
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        IF (NEW.company_id IS NOT NULL) THEN
            v_company_id := NEW.company_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.company_id IS NOT NULL) THEN
            v_company_id := OLD.company_id;
        END IF;
    END IF;

    -- Se não achamos company_id no objeto, pegamos do profile do autor
    IF (v_company_id IS NULL AND v_user_id IS NOT NULL) THEN
        SELECT company_id INTO v_company_id FROM public.profiles WHERE id = v_user_id;
    END IF;

    -- Preparar dados Antes/Depois
    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
    END IF;

    -- Inserir o Log
    INSERT INTO public.audit_logs (
        company_id,
        user_id,
        module,
        entity,
        entity_id,
        action,
        before_data,
        after_data,
        type,
        severity
    ) VALUES (
        v_company_id,
        v_user_id,
        TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, -- Módulo automático
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        v_old_data,
        v_new_data,
        'SYSTEM_AUTO',
        CASE WHEN TG_OP = 'DELETE' THEN 'HIGH' ELSE 'INFO' END
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Aplicar Triggers em Tabelas Críticas
-- Nota: Usamos DROP se já existir para evitar erro em migrações repetidas

DROP TRIGGER IF EXISTS tr_audit_shipments ON public.shipments;
CREATE TRIGGER tr_audit_shipments
AFTER INSERT OR UPDATE OR DELETE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

DROP TRIGGER IF EXISTS tr_audit_clients ON public.clients;
CREATE TRIGGER tr_audit_clients
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

DROP TRIGGER IF EXISTS tr_audit_users ON public.profiles;
CREATE TRIGGER tr_audit_users
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

DROP TRIGGER IF EXISTS tr_audit_routes ON public.routes;
CREATE TRIGGER tr_audit_routes
AFTER INSERT OR UPDATE OR DELETE ON public.routes
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

-- 6. RLS: Master vê tudo, Empresa vê o seu
-- Removendo políticas antigas para garantir consistência
DROP POLICY IF EXISTS "Company-Scoped Audit Logs isolation" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can insert their own company logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Master admin see all logs" ON public.audit_logs;

CREATE POLICY "Master admin see all logs" ON public.audit_logs
FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MASTER_ADMIN'
);

CREATE POLICY "Company admins see own logs" ON public.audit_logs
FOR SELECT USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "System can insert logs" ON public.audit_logs
FOR INSERT WITH CHECK (true); -- Permitido via trigger (Security Definer) e inserts manuais
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);
