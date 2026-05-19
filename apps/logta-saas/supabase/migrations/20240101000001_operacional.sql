-- ==============================================================================
-- LOGTA SAAS - EXTENSÃO OPERACIONAL (FROTA E FINANCEIRO)
-- ==============================================================================

-- 1. TABELA: veiculos
CREATE TABLE public.veiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    
    placa TEXT NOT NULL,
    modelo TEXT NOT NULL,
    tipo TEXT NOT NULL, -- ex: 'Truck', 'Carreta', 'VUC'
    ano INTEGER,
    status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'em_viagem', 'manutencao')),
    km_atual INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento Total: Veiculos" ON public.veiculos FOR ALL USING (empresa_id = auth.empresa_id());
CREATE TRIGGER trg_set_empresa_id_veiculos BEFORE INSERT ON public.veiculos FOR EACH ROW EXECUTE FUNCTION set_empresa_id();

-- 2. TABELA: transacoes (Financeiro)
CREATE TABLE public.transacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    
    tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
    categoria TEXT, -- ex: 'Combustível', 'Frete', 'Manutenção'
    metodo_pagamento TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento Total: Transacoes" ON public.transacoes FOR ALL USING (empresa_id = auth.empresa_id());
CREATE TRIGGER trg_set_empresa_id_transacoes BEFORE INSERT ON public.transacoes FOR EACH ROW EXECUTE FUNCTION set_empresa_id();
