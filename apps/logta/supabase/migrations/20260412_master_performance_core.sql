-- 1. Tabela de Tarefas Internas (Master HQ)
CREATE TABLE IF NOT EXISTS public.master_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID NOT NULL REFERENCES public.master_staff(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    priority TEXT DEFAULT 'Media' CHECK (priority IN ('Baixa', 'Media', 'Alta', 'Critica')),
    status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Andamento', 'Concluido', 'Cancelado')),
    complexity INTEGER DEFAULT 1, -- 1 a 5
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Facilitador de Consultas de Performance (Performance View)
-- Esta view agrega a atividade dos logs e o status das tarefas
CREATE OR REPLACE VIEW public.staff_performance_summary AS
SELECT 
    ms.id as staff_id,
    p.full_name,
    p.email,
    ms.tier,
    (SELECT count(*) FROM public.master_audit_logs WHERE actor_id = ms.profile_id AND created_at > now() - interval '24 hours') as actions_24h,
    (SELECT count(*) FROM public.master_tasks WHERE assigned_to = ms.id AND status = 'Concluido') as tasks_done,
    (SELECT count(*) FROM public.master_tasks WHERE assigned_to = ms.id AND status != 'Concluido') as tasks_pending
FROM 
    public.master_staff ms
JOIN 
    public.profiles p ON p.id = ms.profile_id;

-- Habilitar RLS
ALTER TABLE public.master_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas MASTER_ADMIN pode gerenciar ou ver tarefas de performance
CREATE POLICY "Master Tasks isolation" ON public.master_tasks
FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );

-- Configurar Trigger para update_at
CREATE OR REPLACE FUNCTION update_master_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    IF NEW.status = 'Concluido' AND OLD.status != 'Concluido' THEN
        NEW.completed_at = now();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_master_tasks_updated_at
BEFORE UPDATE ON public.master_tasks
FOR EACH ROW
EXECUTE PROCEDURE update_master_tasks_updated_at();
