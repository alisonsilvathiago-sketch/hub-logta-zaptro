-- Tabela de Fluxos de Automação (chatbot / automação)
CREATE TABLE IF NOT EXISTS public.whatsapp_automation_flows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Padrao',
    welcome_message TEXT NOT NULL,
    options JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name)
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_automation_flows ENABLE ROW LEVEL SECURITY;

-- Política de Isolamento por Empresa
CREATE POLICY "Company automation flow isolation" ON public.whatsapp_automation_flows
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Trigger para Updated At
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_automation_flows_updated_at
    BEFORE UPDATE ON public.whatsapp_automation_flows
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Tabela de Entregas / Cargas (logística)
CREATE TABLE IF NOT EXISTS public.whatsapp_shipments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL, -- Ex: LD-1025
    client_name TEXT NOT NULL,
    destination TEXT NOT NULL,
    status TEXT DEFAULT 'coleta' CHECK (status IN ('coleta', 'em_rota', 'entregue', 'atraso')),
    driver_name TEXT,
    nf_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_shipments ENABLE ROW LEVEL SECURITY;

-- Política de Isolamento
CREATE POLICY "Company shipment isolation" ON public.whatsapp_shipments
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Trigger Updated At
-- Tabela de Motoristas (portal motorista)
CREATE TABLE IF NOT EXISTS public.whatsapp_drivers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL, -- WhatsApp para identificação no Webhook
    vehicle TEXT,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, phone)
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_drivers ENABLE ROW LEVEL SECURITY;

-- Política de Isolamento
CREATE POLICY "Company driver isolation" ON public.whatsapp_drivers
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Trigger Updated At
CREATE TRIGGER update_whatsapp_drivers_updated_at
    BEFORE UPDATE ON public.whatsapp_drivers
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Ajustando shipments para rastreio público e histórico
ALTER TABLE public.whatsapp_shipments ADD COLUMN IF NOT EXISTS tracking_token UUID DEFAULT gen_random_uuid();
ALTER TABLE public.whatsapp_shipments ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.whatsapp_shipments ADD COLUMN IF NOT EXISTS customer_document TEXT; -- CPF ou CNPJ

-- Histórico de Eventos da Carga
CREATE TABLE IF NOT EXISTS public.whatsapp_shipment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shipment_id UUID NOT NULL REFERENCES public.whatsapp_shipments(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para Histórico
ALTER TABLE public.whatsapp_shipment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company shipment history isolation" ON public.whatsapp_shipment_history
FOR ALL USING (shipment_id IN (SELECT id FROM public.whatsapp_shipments));
