-- 1. Expansão do Catálogo Master de APIs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='apis_master' AND column_name='category') THEN
        ALTER TABLE public.apis_master ADD COLUMN category TEXT DEFAULT 'Outros' CHECK (category IN ('Admin', 'RH', 'Financeiro', 'CRM', 'Logistica', 'Atendimento', 'Estoque', 'Outros'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='apis_master' AND column_name='icon_name') THEN
        ALTER TABLE public.apis_master ADD COLUMN icon_name TEXT DEFAULT 'Layers';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='apis_master' AND column_name='doc_url') THEN
        ALTER TABLE public.apis_master ADD COLUMN doc_url TEXT;
    END IF;
END $$;

-- 2. Inserir APIs Padrão (Exemplos Reais)
INSERT INTO public.apis_master (name, type, category, description, icon_name, base_url, doc_url)
VALUES 
('WhatsApp (Z-API)', 'COMUNICACAO', 'Atendimento', 'Integração oficial via instância Z-API para automação de mensagens.', 'MessageSquare', 'https://api.z-api.io', 'https://docs.z-api.io'),
('Asaas Gateway', 'PAGAMENTO', 'Financeiro', 'Motor de pagamentos para PIX, Boletos e Cartão de Crédito.', 'CreditCard', 'https://api.asaas.com/v3', 'https://docs.asaas.com'),
('Stripe Global', 'PAGAMENTO', 'Financeiro', 'Gateway internacional para assinaturas e checkout seguro.', 'ShieldCheck', 'https://api.stripe.com/v1', 'https://stripe.com/docs'),
('Google Maps API', 'LOGISTICA', 'Logistica', 'Cálculo de rotas, geocodificação e visualização de frota.', 'Map', 'https://maps.googleapis.com', 'https://developers.google.com/maps'),
('SendGrid SMTP', 'COMUNICACAO', 'CRM', 'Disparo de e-mails transacionais e automação de marketing.', 'Mail', 'https://api.sendgrid.com/v3', 'https://docs.sendgrid.com')
ON CONFLICT (name) DO NOTHING;

-- 3. Atualizar Tabela de Conexões das Empresas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='apis_company' AND column_name='api_url') THEN
        ALTER TABLE public.apis_company ADD COLUMN api_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='apis_company' AND column_name='usage_count') THEN
        ALTER TABLE public.apis_company ADD COLUMN usage_count INT DEFAULT 0;
    END IF;
END $$;

-- 4. Chaves de Configuração Master (Geral / Personalização)
INSERT INTO public.system_configs (key, value, description)
VALUES 
('PLATFORM_NAME', 'Logta SaaS', 'Nome principal exibido na plataforma'),
('PRIMARY_COLOR', '#7c3aed', 'Cor principal do sistema (White Label)'),
('ALLOW_REGISTRATION', 'true', 'Permitir novos cadastros de empresas via landing'),
('SUPPORT_EMAIL', 'suporte@logta.app', 'E-mail de suporte global exibido aos tenants')
ON CONFLICT (key) DO NOTHING;
