-- Migration: WhatsApp Automation Hub
-- Description: Creates template management and automated logistics triggers.

-- 1. Tabela de Templates
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 'ROUTE_START', 'DELIVERY_CONFIRMATION', 'PICKUP_ALERT'
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Inserir Templates Padrão para Sistema (Master/Global)
INSERT INTO public.whatsapp_templates (name, content, variables)
VALUES 
('ROUTE_START', '🚚 *LOGTA: Nova Rota Iniciada*\n\nOlá {{driver_name}}, você tem uma nova rota em andamento!\nPlaca: {{plate}}\n\nAcesse seu portal aqui: {{portal_url}}', '["driver_name", "plate", "portal_url"]'),
('DELIVERY_CONFIRMATION', '✅ *LOGTA: Entrega Concluída*\n\nOlá {{client_name}}, sua mercadoria foi entregue com sucesso!\n\n📄 Veja o comprovante digital aqui: {{pod_link}}\n\nObrigado por utilizar nossos serviços.', '["client_name", "pod_link"]');

-- 3. Função de Disparo Automático (Audit -> Notification)
-- Esta função será chamada por triggers quando os status de remessa/rota mudarem.
CREATE OR REPLACE FUNCTION public.fn_trigger_whatsapp_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type TEXT;
    v_target_id UUID;
    v_company_id UUID;
BEGIN
    -- Detectar Evento
    IF (TG_TABLE_NAME = 'shipments' AND NEW.status = 'ENTREGUE' AND (OLD.status IS NULL OR OLD.status != 'ENTREGUE')) THEN
        v_event_type := 'DELIVERY_CONFIRMATION';
        v_target_id := NEW.id;
        v_company_id := NEW.company_id;
    ELSIF (TG_TABLE_NAME = 'routes' AND NEW.status = 'EM_ANDAMENTO' AND (OLD.status IS NULL OR OLD.status != 'EM_ANDAMENTO')) THEN
        v_event_type := 'ROUTE_START';
        v_target_id := NEW.id;
        v_company_id := NEW.company_id;
    END IF;

    -- Se um evento válido for disparado, enviar para o Dispatcher
    IF (v_event_type IS NOT NULL) THEN
        -- Aqui dispararíamos uma requisição HTTP para a Edge Function
        -- Para garantir performance, usaremos o padrão de "Notificações Pendentes"
        -- Ou simplesmente chamamos via pg_net se disponível.
        -- Por enquanto, vamos inserir na tabela de notificações de alta prioridade 
        -- e deixar o whatsapp-notif-dispatcher (que já monitora ela) agir.
        
        INSERT INTO public.notifications (
            company_id,
            title,
            message,
            priority,
            type,
            metadata
        ) VALUES (
            v_company_id,
            'DISPARO_WHATSAPP_' || v_event_type,
            'Solicitação de disparo automático via WhatsApp',
            'HIGH',
            'SYSTEM',
            jsonb_build_object(
                'event_type', v_event_type,
                'entity_id', v_target_id,
                'is_wa_auto', true
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Anexar Gatilhos às Tabelas Reais
DROP TRIGGER IF EXISTS tr_wa_notif_shipments ON public.shipments;
CREATE TRIGGER tr_wa_notif_shipments
AFTER UPDATE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_whatsapp_notification();

DROP TRIGGER IF EXISTS tr_wa_notif_routes ON public.routes;
CREATE TRIGGER tr_wa_notif_routes
AFTER UPDATE ON public.routes
FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_whatsapp_notification();
