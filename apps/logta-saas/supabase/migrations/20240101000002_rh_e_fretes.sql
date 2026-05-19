-- ==============================================================================
-- LOGTA SAAS - EXTENSÃO RH E LOGÍSTICA
-- ==============================================================================

-- 1. TABELA: motoristas
-- Estende o perfil com dados específicos de condução.
CREATE TABLE public.motoristas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    
    cnh_numero TEXT,
    cnh_categoria TEXT, -- ex: 'A', 'B', 'E'
    cnh_vencimento DATE,
    rating DECIMAL(3,2) DEFAULT 5.00,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'ferias', 'afastado', 'desligado')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.motoristas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento Total: Motoristas" ON public.motoristas FOR ALL USING (empresa_id = auth.empresa_id());
CREATE TRIGGER trg_set_empresa_id_motoristas BEFORE INSERT ON public.motoristas FOR EACH ROW EXECUTE FUNCTION set_empresa_id();

-- 2. MELHORIA NA TABELA: fretes (Se já existir, vamos garantir os campos)
-- Caso já exista no schema_inicial, vamos adicionar os campos necessários.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='motorista_id') THEN
        ALTER TABLE public.fretes ADD COLUMN motorista_id UUID REFERENCES public.motoristas(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='veiculo_id') THEN
        ALTER TABLE public.fretes ADD COLUMN veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='distancia_km') THEN
        ALTER TABLE public.fretes ADD COLUMN distancia_km DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='data_saida') THEN
        ALTER TABLE public.fretes ADD COLUMN data_saida TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='data_chegada_prevista') THEN
        ALTER TABLE public.fretes ADD COLUMN data_chegada_prevista TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
