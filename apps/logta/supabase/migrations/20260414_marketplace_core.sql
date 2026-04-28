-- Migration: Marketplace Hub Core System
-- Description: Foundation for modular extensions and feature-flagging.

-- 1. Catálogo de Extensões (Master)
CREATE TABLE IF NOT EXISTS public.marketplace_apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- 'CRM', 'RH', 'LOGISTICS', 'FINANCE', 'INTEGRATION', 'ACADEMY'
    description TEXT,
    icon_name TEXT, -- Nome do ícone Lucide
    price DECIMAL(10,2) DEFAULT 0.00,
    price_type VARCHAR(20) DEFAULT 'FREE', -- 'FREE', 'ONCE', 'MONTHLY'
    type VARCHAR(20) DEFAULT 'INTERNAL', -- 'INTERNAL', 'API', 'PLUGIN'
    
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Apps Instalados por Empresa
CREATE TABLE IF NOT EXISTS public.company_apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    app_id UUID REFERENCES public.marketplace_apps(id) ON DELETE CASCADE,
    
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Para assinaturas mensais
    
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}', -- Configurações específicas (API keys, etc.)
    
    UNIQUE(company_id, app_id)
);

-- 3. Inserir Apps de Destaque Iniciais
INSERT INTO public.marketplace_apps (name, slug, category, description, icon_name, price, price_type, is_featured)
VALUES 
('Rastreamento GPS', 'gps-tracking', 'LOGISTICS', 'Localização em tempo real de frotas e entregas via satélite.', 'MapPin', 149.90, 'MONTHLY', TRUE),
('WhatsApp Automático', 'whatsapp-saas', 'INTEGRATION', 'Envio automático de status de carga e notificações via WhatsApp.', 'MessageSquare', 99.00, 'MONTHLY', TRUE),
('Gestão de Entregas', 'delivery-management', 'LOGISTICS', 'Controle completo de romaneios, rotas e checklists operacionais.', 'Box', 0.00, 'FREE', TRUE),
('Financeiro Logístico', 'finance-pro', 'FINANCE', 'Controle de fretes, lucro por rota e custos operacionais avançados.', 'DollarSign', 89.00, 'MONTHLY', TRUE),
('Gestão de Motoristas', 'driver-management', 'RH', 'Performance da equipe, jornada de trabalho e banco de talentos.', 'Users', 0.00, 'FREE', TRUE),
('Relatórios Inteligentes', 'analytics-insights', 'CRM', 'Visão 360 do seu negócio com dados de produtividade e margem.', 'BarChart3', 49.00, 'MONTHLY', TRUE),
('Academia de Treinamento', 'academy-lms', 'ACADEMY', 'Crie e disponibilize treinamentos exclusivos para seus motoristas.', 'GraduationCap', 199.00, 'MONTHLY', TRUE),
('Integração ERP', 'erp-gateway', 'INTEGRATION', 'Conecte seu sistema externo via API para sincronização total.', 'Link', 299.00, 'ONCE', TRUE);

-- 4. RLS Policies
ALTER TABLE public.marketplace_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_apps ENABLE ROW LEVEL SECURITY;

-- Master vê e edita tudo
CREATE POLICY "Master access apps" ON public.marketplace_apps
FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );

-- Empresas veem apenas apps ativos no catálogo
CREATE POLICY "Public company see active apps" ON public.marketplace_apps
FOR SELECT USING (is_active = TRUE);

-- Empresas gerenciam suas próprias instalações
CREATE POLICY "Company manage own apps" ON public.company_apps
FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Master vê logs de todas as instalações
CREATE POLICY "Master see all company apps" ON public.company_apps
FOR SELECT USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );
