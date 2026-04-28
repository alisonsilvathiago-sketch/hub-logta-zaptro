-- Migration: WhatsApp Transport Intelligence & API
-- Description: Adds configuration for automated responses, API keys, and transport-specific tracking logic.

-- 1. WhatsApp Configuration (Company level)
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    is_enabled BOOLEAN DEFAULT true,
    auto_menu_enabled BOOLEAN DEFAULT true,
    round_robin_enabled BOOLEAN DEFAULT true,
    welcome_message TEXT DEFAULT 'Olá! Bem-vindo à nossa central de transportes. Como podemos ajudar hoje?',
    offline_message TEXT DEFAULT 'No momento não estamos operando. Deixe seu recado e responderemos em breve.',
    menu_header TEXT DEFAULT 'Por favor, escolha uma das opções abaixo:',
    tracking_enabled BOOLEAN DEFAULT true,
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. WhatsApp API Keys
CREATE TABLE IF NOT EXISTS public.whatsapp_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL, -- Secret key stored hashed
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. WhatsApp Quick Replies (Transport Templates)
CREATE TABLE IF NOT EXISTS public.whatsapp_quick_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    trigger_keyword TEXT, -- e.g., 'rastreio', 'status'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'geral', -- 'logistica', 'financeiro', 'atendimento'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Update Conversations to track context
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_customer_message_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_api_session BOOLEAN DEFAULT false;

-- 5. RLS Policies
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
  tab_name TEXT;
  tables TEXT[] := ARRAY['whatsapp_config', 'whatsapp_api_keys', 'whatsapp_quick_replies'];
BEGIN
  FOREACH tab_name IN ARRAY tables
  LOOP
    EXECUTE format('CREATE POLICY "Master Admin all access on %I" ON public.%I FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ''MASTER_ADMIN''))', tab_name, tab_name);
    EXECUTE format('CREATE POLICY "Company Users access on %I" ON public.%I FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.company_id = public.%I.company_id))', tab_name, tab_name, tab_name);
  END LOOP;
END $$;

-- 6. Insert Default Quick Replies for Logistics (Global/Templates)
-- Note: These will be copied to company on module activation or managed globally
