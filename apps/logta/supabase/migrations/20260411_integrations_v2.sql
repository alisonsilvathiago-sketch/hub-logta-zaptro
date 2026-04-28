-- Tabela de APIs disponíveis globalmente (Gerenciada pelo Master)
CREATE TABLE IF NOT EXISTS public.apis_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'auth', 'payment', 'communication', 'meetings', 'fiscal'
  description TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'ativo', -- 'ativo', 'inativo', 'em_desenvolvimento'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de configurações de API por empresa
CREATE TABLE IF NOT EXISTS public.apis_company (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  api_id UUID REFERENCES public.apis_master(id) ON DELETE CASCADE,
  api_key TEXT,
  status TEXT DEFAULT 'pendente', -- 'pendente', 'ativo', 'solicitado', 'bloqueado'
  master_authorized BOOLEAN DEFAULT false, -- Definido pelo Master Logta
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, api_id)
);

-- Seed básico de APIs Famosas
INSERT INTO apis_master (name, type, description, logo_url) VALUES
('Google Workspace', 'auth', 'Integração com Agenda, Drive e Login unificado.', 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg'),
('WhatsApp Business', 'communication', 'Comunicação direta com motoristas e clientes via API oficial.', 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg'),
('Zoom Meetings', 'meetings', 'Agendamento automático de reuniões e treinamentos online.', 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Video-Conference-Zoom-Logo.svg'),
('Stripe Payments', 'payment', 'Processamento de faturamentos e conciliação bancária automática.', 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg'),
('Focus NFe', 'fiscal', 'Emissão automática de Notas Fiscais de serviço e transporte.', 'https://focusnfe.com.br/apple-touch-icon.png')
ON CONFLICT DO NOTHING;

-- APIs Adicionais para Transporte
INSERT INTO apis_master (name, type, description, logo_url) VALUES
('Google Maps API', 'logistics', 'Roteirização inteligente e estimativa de tempo real (ETA).', 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg'),
('Track.it GPS', 'logistics', 'Sincronização com rastreadores físicos de caminhões e frotas.', 'https://uxwing.com/wp-content/themes/uxwing/download/transportation-automotive/gps-navigation-icon.svg')
ON CONFLICT DO NOTHING;
