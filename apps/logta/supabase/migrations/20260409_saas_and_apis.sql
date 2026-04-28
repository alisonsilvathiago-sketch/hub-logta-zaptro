-- 1. Alterar Tabela de Empresas para suporte a Bloqueio
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status_empresa TEXT DEFAULT 'ativo' CHECK (status_empresa IN ('ativo', 'bloqueado'));
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'FREE';

-- 2. Tabela de Catálogo Global de APIs (Mãe)
CREATE TABLE IF NOT EXISTS public.apis_master (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'PAGAMENTO', 'COMUNICACAO', 'LOGISTICA'
    description TEXT,
    base_url TEXT,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Configurações de API por Empresa (Filhos)
CREATE TABLE IF NOT EXISTS public.apis_company (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    api_id UUID NOT NULL REFERENCES public.apis_master(id),
    api_key TEXT, -- Idealmente deve ser mascarado/criptografado no uso real
    secret_key TEXT,
    config JSONB DEFAULT '{}',
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, api_id)
);

-- 4. Tabela de Assinaturas (Faturamento Mãe -> Empresa)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asaas_customer_id TEXT,
    asaas_subscription_id TEXT,
    plan_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'PENDENTE' CHECK (status IN ('ATIVO', 'PENDENTE', 'VENCIDO', 'CANCELADO')),
    next_due_date DATE,
    last_payment_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.apis_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apis_company ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas
-- apis_master: Todos podem ler o catálogo
CREATE POLICY "Public APIs read only" ON public.apis_master FOR SELECT USING (true);

-- apis_company: Apenas usuários da própria empresa acessam suas chaves
CREATE POLICY "Company API keys isolation" ON public.apis_company
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- subscriptions: Usuário vê apenas a assinatura da sua empresa
CREATE POLICY "Company subscription isolation" ON public.subscriptions
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
