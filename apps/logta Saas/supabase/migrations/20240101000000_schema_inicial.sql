-- ==============================================================================
-- LOGTA SAAS - ARQUITETURA MULTI-TENANT (WHITE LABEL)
-- ==============================================================================
-- Este script define a espinha dorsal do banco de dados para um sistema White Label.
-- Todas as tabelas são protegidas por Row Level Security (RLS).
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABELA: empresas (Tenants)
-- ==============================================================================
-- Cada registro aqui representa uma Transportadora ou cliente do SaaS.
CREATE TABLE public.empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_fantasia TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT UNIQUE,
    
    -- Configurações de White Label
    dominio_personalizado TEXT UNIQUE, -- ex: app.transportadora.com.br
    tema_cor_primaria TEXT DEFAULT '#D7FF00',
    tema_dark_mode BOOLEAN DEFAULT false,
    logo_url TEXT,
    remover_marca_logta BOOLEAN DEFAULT false,
    
    -- Configurações Financeiras e Fiscais
    chave_pix TEXT,
    email_contato TEXT,
    
    -- Controle de Sistema
    plano_atual TEXT DEFAULT 'starter',
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'bloqueado', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- TABELA: perfis (Usuários vinculados a um Tenant)
-- ==============================================================================
-- Estende o auth.users do Supabase com o vínculo à empresa correta.
CREATE TABLE public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    
    nome_completo TEXT NOT NULL,
    cargo TEXT DEFAULT 'operacional' CHECK (cargo IN ('admin', 'operacional', 'motorista', 'financeiro')),
    avatar_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS nas tabelas principais
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- ROW LEVEL SECURITY (A MÁGICA DO MULTI-TENANT)
-- ==============================================================================

-- Função útil: Pegar o empresa_id do usuário logado atual
CREATE OR REPLACE FUNCTION auth.empresa_id() RETURNS UUID AS $$
  SELECT empresa_id FROM public.perfis WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;


-- POLÍTICAS PARA "EMPRESAS"
-- Regra: Um usuário só pode ver/editar os dados da sua própria empresa.
CREATE POLICY "Usuários veem sua própria empresa" 
    ON public.empresas FOR SELECT 
    USING (id = auth.empresa_id());

CREATE POLICY "Apenas admins editam a empresa" 
    ON public.empresas FOR UPDATE 
    USING (
        id = auth.empresa_id() 
        AND 
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND cargo = 'admin')
    );


-- POLÍTICAS PARA "PERFIS"
-- Regra: Um usuário só pode ver outros usuários da mesma empresa.
CREATE POLICY "Usuários veem colegas da mesma empresa" 
    ON public.perfis FOR SELECT 
    USING (empresa_id = auth.empresa_id());

CREATE POLICY "Usuários podem editar o próprio perfil" 
    ON public.perfis FOR UPDATE 
    USING (id = auth.uid());


-- ==============================================================================
-- EXEMPLO DE TABELA OPERACIONAL (Ex: Fretes)
-- ==============================================================================
CREATE TABLE public.fretes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE, -- CHAVE DE ISOLAMENTO
    
    origem TEXT NOT NULL,
    destino TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pendente',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.fretes ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA TABELAS OPERACIONAIS (Padrão para todas as tabelas do sistema)
CREATE POLICY "Isolamento Total: Ver" ON public.fretes FOR SELECT USING (empresa_id = auth.empresa_id());
CREATE POLICY "Isolamento Total: Inserir" ON public.fretes FOR INSERT WITH CHECK (empresa_id = auth.empresa_id());
CREATE POLICY "Isolamento Total: Atualizar" ON public.fretes FOR UPDATE USING (empresa_id = auth.empresa_id());
CREATE POLICY "Isolamento Total: Deletar" ON public.fretes FOR DELETE USING (empresa_id = auth.empresa_id());


-- ==============================================================================
-- TRIGGERS DE AUTOMATIZAÇÃO
-- ==============================================================================

-- Gatilho para injetar o empresa_id automaticamente em novos registros (opcional, mas recomendado)
CREATE OR REPLACE FUNCTION set_empresa_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := auth.empresa_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicando o gatilho na tabela de fretes (deve ser replicado para outras tabelas)
CREATE TRIGGER trg_set_empresa_id_fretes
BEFORE INSERT ON public.fretes
FOR EACH ROW
EXECUTE FUNCTION set_empresa_id();
