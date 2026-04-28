-- System-wide configs (only for Master)
CREATE TABLE IF NOT EXISTS public.system_configs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

-- Apenas Master Admin pode ver ou editar
CREATE POLICY "Master Admin only system configs" ON public.system_configs 
FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );

-- Inserir a chave (Cuidado: Em produção use variáveis de ambiente)
-- INSERT INTO public.system_configs (key, value, description) 
-- VALUES ('ASAAS_API_KEY', 'SUA_CHAVE_AQUI', 'Chave de produção do Asaas para pagamentos do SaaS');
