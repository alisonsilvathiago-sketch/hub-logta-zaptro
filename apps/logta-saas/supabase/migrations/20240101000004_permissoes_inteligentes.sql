-- ==============================================================================
-- LOGTA SAAS - ESTRUTURA DE PERMISSÕES E CONFIGURAÇÃO INTELIGENTE
-- ==============================================================================

DO $$ 
BEGIN
    -- 1. Ampliar a tabela de perfis para suportar a estrutura dinâmica
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfis' AND column_name='setor') THEN
        ALTER TABLE public.perfis ADD COLUMN setor TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfis' AND column_name='nivel_acesso') THEN
        ALTER TABLE public.perfis ADD COLUMN nivel_acesso INTEGER DEFAULT 1; -- 1: Operacional, 2: Supervisor, 3: Gerente, 4: Admin
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfis' AND column_name='permissoes_json') THEN
        ALTER TABLE public.perfis ADD COLUMN permissoes_json JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- 2. Ampliar a tabela de empresas para suportar a configuração inteligente
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='empresas' AND column_name='modulos_ativos') THEN
        ALTER TABLE public.empresas ADD COLUMN modulos_ativos TEXT[] DEFAULT ARRAY['financeiro', 'crm', 'operacoes'];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='empresas' AND column_name='prioridades_menu') THEN
        ALTER TABLE public.empresas ADD COLUMN prioridades_menu TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='empresas' AND column_name='desafio_principal') THEN
        ALTER TABLE public.empresas ADD COLUMN desafio_principal TEXT;
    END IF;

END $$;
