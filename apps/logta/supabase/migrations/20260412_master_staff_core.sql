-- 1. Tabela de Equipe Master (Colaboradores Internos Logta)
CREATE TABLE IF NOT EXISTS public.master_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'SUPPORT')),
    department TEXT, -- 'FINANCEIRO', 'SUPORTE', 'DEV', 'GERAL'
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(profile_id)
);

-- 2. Matriz de Permissões Granulares (Geral do Master)
CREATE TABLE IF NOT EXISTS public.master_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.master_staff(id) ON DELETE CASCADE,
    module TEXT NOT NULL, -- 'EQUIPE', 'FINANCEIRO', 'CRM', 'API', 'PLANOS', 'EMPRESAS'
    action TEXT NOT NULL, -- 'VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE'
    allowed BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(staff_id, module, action)
);

-- 3. Logs de Auditoria Global Master (Audit Trail)
CREATE TABLE IF NOT EXISTS public.master_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    target_type TEXT NOT NULL, -- 'COMPANY', 'STAFF', 'API', 'SUBSCRIPTION'
    target_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Habilitar RLS
ALTER TABLE public.master_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas MASTER_ADMIN pode gerenciar equipe
CREATE POLICY "Master Staff isolation" ON public.master_staff
FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );

CREATE POLICY "Master Permissions isolation" ON public.master_permissions
FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );

CREATE POLICY "Master Audit Logs isolation" ON public.master_audit_logs
FOR SELECT USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );

CREATE POLICY "Master Audit Logs insert" ON public.master_audit_logs
FOR INSERT WITH CHECK ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );
