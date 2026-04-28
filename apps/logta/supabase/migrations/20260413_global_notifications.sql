-- Migration: Global Notification Center System
-- Description: Centralized persistent notification storage for Master and Tenant alerts.

-- 1. Tabela Principal de Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM', -- 'SYSTEM', 'MANUAL', 'FINANCIAL', 'CRM', 'LOGISTICS', 'API'
    priority VARCHAR(20) NOT NULL DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Destinatários (NULL = Global/Broadcast)
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}', -- Links, IDs relacionados (ex: { "path": "/financeiro", "id": "123" })
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sender_id UUID REFERENCES auth.users(id) -- Opcional: quem enviou (Master)
);

-- 2. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 3. RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Master Admin vê tudo
CREATE POLICY "Master admin see all notifications" ON public.notifications
FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );

-- Empresa vê apenas notificações voltadas para ela (ou globais)
CREATE POLICY "Company see its notifications" ON public.notifications
FOR SELECT USING (
    (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) AND user_id IS NULL)
    OR (user_id = auth.uid())
);

-- Usuários podem marcar como lidas suas próprias notificações
CREATE POLICY "Users update read status" ON public.notifications
FOR UPDATE USING (user_id = auth.uid() OR (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) AND user_id IS NULL))
WITH CHECK (is_read IS TRUE);

-- 4. Funções de Gatilho para Automação (Exemplos Iniciais)

-- Trigger para Novos Leads (CRM)
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (type, priority, title, message, company_id, metadata)
    VALUES ('CRM', 'MEDIUM', 'Novo Lead Recebido', 'Um novo lead acaba de entrar via Landing Page.', NEW.company_id, json_build_object('path', '/crm/leads', 'id', NEW.id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para Falhas em APIs (Logs de Erro Críticos)
-- (Pode ser estendido conforme a tabela de logs de API)

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_company ON public.notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
