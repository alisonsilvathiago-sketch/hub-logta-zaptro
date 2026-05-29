-- ==============================================================================
-- MASTER SCHEMA - TRANSFORMAÇÃO PARA ECOSSISTEMA REAL
-- ==============================================================================

-- 1. LOGTA CRM & CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome_fantasia TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT UNIQUE,
    email TEXT,
    telefone TEXT,
    endereco TEXT,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento Total: Clientes" ON public.clientes FOR ALL USING (empresa_id = auth.empresa_id());

-- 2. LOGTA FROTA (ABASTECIMENTOS & PNEUS)
CREATE TABLE IF NOT EXISTS public.abastecimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    veiculo_id UUID NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
    motorista_id UUID REFERENCES public.motoristas(id) ON DELETE SET NULL,
    litros DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    km_registro INTEGER NOT NULL,
    posto TEXT,
    data_abastecimento TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.abastecimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento Total: Abastecimentos" ON public.abastecimentos FOR ALL USING (empresa_id = auth.empresa_id());

CREATE TABLE IF NOT EXISTS public.pneus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    veiculo_id UUID NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
    posicao TEXT NOT NULL, -- ex: 'Eixo 1 - Dir'
    marca TEXT,
    sulco_mm DECIMAL(4,2),
    pressao_bar DECIMAL(4,2),
    vida_util_estimada INTEGER DEFAULT 100,
    status TEXT DEFAULT 'em_uso' CHECK (status IN ('em_uso', 'recauchutagem', 'descartado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.pneus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento Total: Pneus" ON public.pneus FOR ALL USING (empresa_id = auth.empresa_id());

-- 3. ZAPTRO (CONEXÕES & MENSAGENS)
CREATE TABLE IF NOT EXISTS public.zaptro_conexoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome_instancia TEXT NOT NULL,
    status TEXT DEFAULT 'desconectado' CHECK (status IN ('conectado', 'desconectado', 'conectando')),
    whatsapp_numero TEXT,
    api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.zaptro_conexoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento Total: Zaptro Conexões" ON public.zaptro_conexoes FOR ALL USING (empresa_id = auth.empresa_id());

CREATE TABLE IF NOT EXISTS public.zaptro_mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    conexao_id UUID REFERENCES public.zaptro_conexoes(id) ON DELETE CASCADE,
    contato_numero TEXT NOT NULL,
    conteudo TEXT,
    direcao TEXT CHECK (direcao IN ('entrada', 'saida')),
    status_envio TEXT DEFAULT 'enviado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.zaptro_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento Total: Zaptro Mensagens" ON public.zaptro_mensagens FOR ALL USING (empresa_id = auth.empresa_id());

-- 4. LOGDOCK (STORAGE METADATA)
CREATE TABLE IF NOT EXISTS public.logdock_arquivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    perfil_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    nome_arquivo TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    tamanho_bytes BIGINT,
    tipo_mime TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.logdock_arquivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento Total: Logdock Arquivos" ON public.logdock_arquivos FOR ALL USING (empresa_id = auth.empresa_id());

-- 5. HUB MASTER (BILLING & IA)
CREATE TABLE IF NOT EXISTS public.hub_assinaturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    plano TEXT NOT NULL DEFAULT 'starter',
    status_pagamento TEXT DEFAULT 'em_dia' CHECK (status_pagamento IN ('em_dia', 'atrasado', 'pendente')),
    proximo_vencimento DATE,
    valor_mensal DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.hub_assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento Total: Hub Assinaturas" ON public.hub_assinaturas FOR ALL USING (empresa_id = auth.empresa_id());

CREATE TABLE IF NOT EXISTS public.hub_consumo_ia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    tokens_utilizados INTEGER DEFAULT 0,
    creditos_restantes INTEGER DEFAULT 1000,
    last_usage TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.hub_consumo_ia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento Total: Hub Consumo IA" ON public.hub_consumo_ia FOR ALL USING (empresa_id = auth.empresa_id());

-- 5. HUB MASTER (NOTIFICAÇÕES & EVENTOS)
CREATE TABLE IF NOT EXISTS public.hub_notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mensagem TEXT NOT NULL,
    sistema TEXT,
    tipo TEXT DEFAULT 'info',
    lida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.hub_notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Master total access to notifications" ON public.hub_notificacoes;
CREATE POLICY "Master total access to notifications" ON public.hub_notificacoes
FOR ALL
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MASTER')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MASTER');

-- 6. TRIGGER DE SINCRONIZAÇÃO AUTH -> PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'USER',
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = now();

  INSERT INTO public.hub_notificacoes (mensagem, sistema, tipo)
  VALUES ('Novo acesso detectado: ' || new.email, 'AUTENTICACAO', 'info');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TRIGGERS DE AUTOMATIZAÇÃO DE EMPRESA_ID
CREATE TRIGGER trg_set_empresa_id_clientes BEFORE INSERT ON public.clientes FOR EACH ROW EXECUTE FUNCTION set_empresa_id();
CREATE TRIGGER trg_set_empresa_id_abastecimentos BEFORE INSERT ON public.abastecimentos FOR EACH ROW EXECUTE FUNCTION set_empresa_id();
CREATE TRIGGER trg_set_empresa_id_pneus BEFORE INSERT ON public.pneus FOR EACH ROW EXECUTE FUNCTION set_empresa_id();
CREATE TRIGGER trg_set_empresa_id_zaptro_conexoes BEFORE INSERT ON public.zaptro_conexoes FOR EACH ROW EXECUTE FUNCTION set_empresa_id();
CREATE TRIGGER trg_set_empresa_id_zaptro_mensagens BEFORE INSERT ON public.zaptro_mensagens FOR EACH ROW EXECUTE FUNCTION set_empresa_id();
CREATE TRIGGER trg_set_empresa_id_logdock_arquivos BEFORE INSERT ON public.logdock_arquivos FOR EACH ROW EXECUTE FUNCTION set_empresa_id();
CREATE TRIGGER trg_set_empresa_id_hub_assinaturas BEFORE INSERT ON public.hub_assinaturas FOR EACH ROW EXECUTE FUNCTION set_empresa_id();
-- 7. SEGURANÇA E AUDITORIA (CAIXA PRETA)
CREATE TABLE IF NOT EXISTS public.master_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    target_type TEXT,
    details TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.master_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Master can see all logs" ON public.master_audit_logs
    FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MASTER');

-- Bloquear qualquer exclusão de logs (Segurança de Auditoria)
CREATE POLICY "No one can delete logs" ON public.master_audit_logs
    FOR DELETE USING (false);
