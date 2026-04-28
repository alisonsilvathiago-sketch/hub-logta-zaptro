-- Migration: WhatsApp Module Implementation (Master + White Label)
-- Description: Structure for multi-tenant WhatsApp management, distribution and monetization.

-- 1. WhatsApp Instances (Connections)
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  instance_id TEXT UNIQUE NOT NULL,
  token TEXT,
  phone TEXT,
  status TEXT DEFAULT 'disconnected', -- 'connected', 'disconnected'
  provider TEXT DEFAULT 'z-api', -- 'z-api', 'evolution'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. WhatsApp Sectors
CREATE TABLE IF NOT EXISTS public.whatsapp_sectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. WhatsApp Conversations
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  sector_id UUID REFERENCES public.whatsapp_sectors(id) ON DELETE SET NULL,
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'waiting', -- 'open', 'closed', 'waiting'
  last_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. WhatsApp Messages
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'cliente', 'atendente', 'sistema'
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null if 'cliente' or 'sistema'
  message TEXT,
  media_url TEXT,
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read'
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, -- For easier RLS
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. WhatsApp Users (Internal Team Roles)
CREATE TABLE IF NOT EXISTS public.whatsapp_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  sector_id UUID REFERENCES public.whatsapp_sectors(id) ON DELETE SET NULL,
  is_online BOOLEAN DEFAULT false,
  last_active TIMESTAMPTZ DEFAULT now()
);

-- 6. WhatsApp Queue Control (Round Robin)
CREATE TABLE IF NOT EXISTS public.whatsapp_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  sector_id UUID REFERENCES public.whatsapp_sectors(id) ON DELETE CASCADE,
  last_assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, sector_id)
);

-- 7. WhatsApp Plans (Master Only Table)
CREATE TABLE IF NOT EXISTS public.whatsapp_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  messages_limit INTEGER NOT NULL,
  users_limit INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. WhatsApp Subscriptions (Company usage)
CREATE TABLE IF NOT EXISTS public.whatsapp_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.whatsapp_plans(id) ON DELETE SET NULL,
  messages_used INTEGER DEFAULT 0,
  messages_limit INTEGER,
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'canceled'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. WhatsApp Credits (Pay-per-use)
CREATE TABLE IF NOT EXISTS public.whatsapp_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  credits_balance INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- --- SECURITY (RLS) ---

ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_credits ENABLE ROW LEVEL SECURITY;

-- Generic Policy for Company Access
-- Only Master Admin or users within the company can see/mod data
DO $$ 
DECLARE
  tab_name TEXT;
  tables TEXT[] := ARRAY[
    'whatsapp_instances', 'whatsapp_sectors', 'whatsapp_conversations', 
    'whatsapp_messages', 'whatsapp_users', 'whatsapp_queue', 
    'whatsapp_subscriptions', 'whatsapp_credits'
  ];
BEGIN
  FOREACH tab_name IN ARRAY tables
  LOOP
    EXECUTE format('CREATE POLICY "Master Admin all access on %I" ON public.%I FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ''MASTER_ADMIN''))', tab_name, tab_name);
    EXECUTE format('CREATE POLICY "Company Users access on %I" ON public.%I FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.company_id = public.%I.company_id))', tab_name, tab_name, tab_name);
  END LOOP;
END $$;

-- Plans is Master Admin Only for Insert/Update/Delete
ALTER TABLE whatsapp_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can see plans" ON whatsapp_plans FOR SELECT USING (true);
CREATE POLICY "Master Admin can manage plans" ON whatsapp_plans FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'MASTER_ADMIN'));

-- --- REALTIME ---
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_instances;
