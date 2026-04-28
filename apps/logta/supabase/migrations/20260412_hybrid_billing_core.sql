-- Migration: Hybrid Business Model (SaaS + Add-ons + Credits + InfoProducts)
-- Description: Unified infrastructure for recurring billing, usage-based credits, and standalone purchases.

-- 1. Expansão da Tabela de Empresas para Gestão de Teste (Grace Period)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '5 days');
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'trial' CHECK (billing_status IN ('trial', 'active', 'overdue', 'blocked', 'legacy'));

-- 2. Catálogo Unificado de Produtos Master
CREATE TABLE IF NOT EXISTS public.master_products_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('SaaS_PLAN', 'WHATSAPP_ACTIVATION', 'WHATSAPP_CREDITS', 'COURSE')),
    price DECIMAL(10,2) NOT NULL,
    billing_cycle TEXT DEFAULT 'MONTHLY' CHECK (billing_cycle IN ('MONTHLY', 'YEARLY', 'ONETIME')),
    credits_amount INTEGER DEFAULT 0, -- Usado se type for WHATSAPP_CREDITS
    features JSONB DEFAULT '{}', -- Conteúdo do plano, limites, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Carteira Digital de Créditos (WhatsApp/Consumíveis)
CREATE TABLE IF NOT EXISTS public.company_wallet (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    credits_balance INTEGER DEFAULT 0,
    last_recharge_at TIMESTAMPTZ,
    auto_recharge_enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Registro de Entregáveis / Acessos Adquiridos (Standalone)
CREATE TABLE IF NOT EXISTS public.company_entitlements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.master_products_catalog(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled')),
    purchased_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    UNIQUE(company_id, product_id)
);

-- 5. Mapeamento de Cursos Inclusos por Plano
CREATE TABLE IF NOT EXISTS public.plan_course_bundles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES public.master_products_catalog(id) ON DELETE CASCADE,
    course_id UUID NOT NULL, -- Referência ao courses.id (UUID fixo do catálogo global)
    UNIQUE(plan_id, course_id)
);

-- 6. Trigger para Inicializar Carteira na Criação da Empresa
CREATE OR REPLACE FUNCTION public.initialize_company_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.company_wallet (company_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_initialize_wallet
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.initialize_company_wallet();

-- 7. RLS - Segurança Multi-Tenant
ALTER TABLE public.master_products_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_course_bundles ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Public read online for catalog" ON public.master_products_catalog FOR SELECT USING (true);
CREATE POLICY "Master Admin full access on catalog" ON public.master_products_catalog FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'MASTER_ADMIN'));

CREATE POLICY "Companies can see their own wallet" ON public.company_wallet
FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Companies can see their entitlements" ON public.company_entitlements
FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Inserção de Dados Iniciais de Exemplo (Pode ser removido/ajustado)
INSERT INTO public.master_products_catalog (name, description, type, price, billing_cycle, features) VALUES
('Plano Bronze', 'Essencial para pequenas transportadoras', 'SaaS_PLAN', 297.00, 'MONTHLY', '{"users_limit": 5, "fleet_limit": 10}'),
('Plano Ouro 🚀', 'Escala total com inteligência de frota', 'SaaS_PLAN', 897.00, 'MONTHLY', '{"users_limit": 999, "fleet_limit": 999}'),
('Ativação WhatsApp Multi-Agente', 'Libera o módulo de atendimento centralizado', 'WHATSAPP_ACTIVATION', 149.00, 'MONTHLY', '{}'),
('Pack 500 Mensagens', 'Créditos para disparos de WhatsApp', 'WHATSAPP_CREDITS', 49.00, 'ONETIME', '{"credits": 500}'),
('Pack 2000 Mensagens', 'Melhor custo-benefício', 'WHATSAPP_CREDITS', 149.00, 'ONETIME', '{"credits": 2000}');
