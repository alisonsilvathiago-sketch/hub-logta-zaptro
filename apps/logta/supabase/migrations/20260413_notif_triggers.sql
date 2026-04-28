-- Migration: Intelligent Notification Triggers
-- Description: Automating alerts for Finance, CRM, Logistics, and API errors.

-- 1. TRIGGER: FINANCEIRO (Nova Fatura / Pagamento Pendente)
-- (Simulando baseado na estrutura de transactions)
CREATE OR REPLACE FUNCTION notify_pending_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'PENDING' AND NEW.type = 'INCOME') THEN
        INSERT INTO public.notifications (type, priority, title, message, company_id, metadata)
        VALUES ('FINANCIAL', 'MEDIUM', 'Nova Fatura Gerada', 
                'Uma fatura de R$ ' || NEW.amount || ' foi gerada para ' || NEW.description, 
                NEW.company_id, 
                json_build_object('path', '/financeiro', 'id', NEW.id));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_notify_pending_transaction ON transactions;
CREATE TRIGGER tr_notify_pending_transaction
AFTER INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION notify_pending_transaction();

-- 2. TRIGGER: LOGÍSTICA (Nova Rota Iniciada)
CREATE OR REPLACE FUNCTION notify_new_route()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (type, priority, title, message, company_id, metadata)
    VALUES ('LOGISTICS', 'LOW', 'Nova Rota Iniciada', 
            'A rota ' || NEW.id || ' foi iniciada e está aguardando conclusão.', 
            NEW.company_id, 
            json_build_object('path', '/logistica/monitoramento', 'id', NEW.id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_notify_new_route ON routes;
CREATE TRIGGER tr_notify_new_route
AFTER INSERT ON routes
FOR EACH ROW EXECUTE FUNCTION notify_new_route();

-- 3. TRIGGER: ACADEMY (Nova Matrícula)
CREATE OR REPLACE FUNCTION notify_new_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (type, priority, title, message, company_id, metadata)
    VALUES ('SYSTEM', 'MEDIUM', 'Novo Aluno Matriculado', 
            'Um novo aluno acaba de se matricular via Play Logta Academy.', 
            NEW.company_id, 
            json_build_object('path', '/master/empresas', 'id', NEW.profile_id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_notify_new_enrollment ON enrollments;
CREATE TRIGGER tr_notify_new_enrollment
AFTER INSERT ON enrollments
FOR EACH ROW EXECUTE FUNCTION notify_new_enrollment();

-- 4. Função para Geração de Notificações via Edge Functions (API)
-- Permitir que funções chamem via SQL se necessário
CREATE OR REPLACE FUNCTION public.create_system_notification(
    p_company_id UUID, p_title TEXT, p_message TEXT, p_priority TEXT, p_type TEXT, p_path TEXT
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.notifications (company_id, title, message, priority, type, metadata)
    VALUES (p_company_id, p_title, p_message, p_priority, p_type, json_build_object('path', p_path))
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;
