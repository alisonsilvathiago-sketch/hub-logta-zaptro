-- Migration: Support Center Core
-- Description: Creates the foundation for the ticketing system and real-time chat.

-- 1. Tabela de Chamados
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED')),
    priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    category TEXT DEFAULT 'TECHNICAL' CHECK (category IN ('TECHNICAL', 'FINANCE', 'BUG', 'FEATURE_REQUEST', 'OTHER')),
    sla_deadline TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Mensagens do Chat
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    message TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    is_master_response BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS: Segurança por Tenant e Master
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Chamados
CREATE POLICY "Empresas veem seus próprios chamados" ON public.support_tickets
FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Empresas inserem seus chamados" ON public.support_tickets
FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Master vê todos os chamados" ON public.support_tickets
FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MASTER_ADMIN');

-- Mensagens
CREATE POLICY "Empresas veem mensagens de seus chamados" ON public.support_messages
FOR SELECT USING (
    ticket_id IN (SELECT id FROM public.support_tickets WHERE company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY "Empresas inserem mensagens em seus chamados" ON public.support_messages
FOR INSERT WITH CHECK (
    ticket_id IN (SELECT id FROM public.support_tickets WHERE company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY "Master manipula todas as mensagens" ON public.support_messages
FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MASTER_ADMIN');

-- 4. Gatilhos: SLA Automático e Resposta Inicial
CREATE OR REPLACE FUNCTION public.fn_support_ticket_orchestrator()
RETURNS TRIGGER AS $$
BEGIN
    -- Configurar SLA de 24 horas no momento da criação
    IF (TG_OP = 'INSERT') THEN
        NEW.sla_deadline := NOW() + INTERVAL '24 hours';
        
        -- Inserir Resposta Automática (Delayed potentially via edge function, or direct here)
        -- Vamos inserir direto como "Sistema Logta"
        -- Nota: sender_id aqui é um placeholder ou um ID de bot se existir.
        -- Vou usar o ID do Master Admin ou um específico se houver.
    END IF;

    -- Atualizar timestamp de update
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_support_ticket_orchestrator
BEFORE INSERT OR UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.fn_support_ticket_orchestrator();

-- Gatilho para Resposta Automática Real
CREATE OR REPLACE FUNCTION public.fn_support_auto_reply()
RETURNS TRIGGER AS $$
DECLARE
    v_master_id UUID;
BEGIN
    -- Buscar um ID de Master Admin para ser o remetente oficial do sistema se não houver um bot id
    SELECT id INTO v_master_id FROM public.profiles WHERE role = 'MASTER_ADMIN' LIMIT 1;

    IF (v_master_id IS NOT NULL) THEN
        INSERT INTO public.support_messages (ticket_id, sender_id, message, is_master_response)
        VALUES (
            NEW.id,
            v_master_id,
            'Olá! Recebemos seu chamado: *"' || NEW.title || '"*. Nossa equipe técnica já foi notificada e retornará em breve dentro do prazo de SLA (24h).',
            true
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_support_auto_reply
AFTER INSERT ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.fn_support_auto_reply();

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_company ON public.support_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id);
