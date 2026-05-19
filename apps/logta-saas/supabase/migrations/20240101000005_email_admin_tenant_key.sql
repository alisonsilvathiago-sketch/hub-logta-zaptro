-- ==============================================================================
-- LOGTA SAAS — Migração: email_admin + tenant_key + políticas de INSERT
-- Executa de forma segura (IF NOT EXISTS para não quebrar banco já configurado)
-- ==============================================================================

-- 1. Adicionar colunas email_admin e tenant_key na tabela empresas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'empresas' AND column_name = 'email_admin'
    ) THEN
        ALTER TABLE public.empresas ADD COLUMN email_admin TEXT UNIQUE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'empresas' AND column_name = 'tenant_key'
    ) THEN
        ALTER TABLE public.empresas ADD COLUMN tenant_key TEXT UNIQUE;
    END IF;
END $$;

-- 2. Criar índices para buscas rápidas por email/tenant
CREATE INDEX IF NOT EXISTS idx_empresas_email_admin ON public.empresas (email_admin);
CREATE INDEX IF NOT EXISTS idx_empresas_tenant_key ON public.empresas (tenant_key);

-- 3. Política de INSERT — qualquer usuário autenticado pode criar a própria empresa
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'empresas' AND policyname = 'Usuários podem criar sua empresa'
    ) THEN
        EXECUTE $$
            CREATE POLICY "Usuários podem criar sua empresa"
                ON public.empresas FOR INSERT
                WITH CHECK (auth.uid() IS NOT NULL);
        $$;
    END IF;
END $$;

-- 4. Política de SELECT ampliada — também permite ver por email_admin/tenant_key
-- (Além da política existente por empresa_id via perfil)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'empresas' AND policyname = 'Usuários veem empresa pelo email_admin'
    ) THEN
        EXECUTE $$
            CREATE POLICY "Usuários veem empresa pelo email_admin"
                ON public.empresas FOR SELECT
                USING (
                    email_admin = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
                    OR tenant_key = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
                    OR id = auth.empresa_id()
                );
        $$;
    END IF;
END $$;

-- 5. Política de UPDATE ampliada — permite update quando é dono via email_admin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'empresas' AND policyname = 'Donos podem editar a empresa pelo email_admin'
    ) THEN
        EXECUTE $$
            CREATE POLICY "Donos podem editar a empresa pelo email_admin"
                ON public.empresas FOR UPDATE
                USING (
                    email_admin = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
                    OR id = auth.empresa_id()
                );
        $$;
    END IF;
END $$;
