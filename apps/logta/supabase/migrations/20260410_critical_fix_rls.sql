-- 1. LIMPEZA TOTAL DE POLICIES RECURSIVAS EM PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 2. CRIAÇÃO DE POLICIES SEGURAS (SEM RECURSÃO)
-- Usamos auth.uid() diretamente para evitar o loop infinito
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. AJUSTE NA TABELA LEADS (CORREÇÃO DO ERRO 'CNPJ' NA IMAGEM)
-- Verifica se a coluna cnpj existe, se não, adiciona ou renomeia
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM medical_columns WHERE table_name = 'leads' AND column_name = 'cnpj') THEN
        -- Se existir cpf_cnpj, renomeamos para cnpj para bater com o código que está dando erro
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'cpf_cnpj') THEN
            ALTER TABLE leads RENAME COLUMN cpf_cnpj TO cnpj;
        ELSE
            ALTER TABLE leads ADD COLUMN cnpj TEXT;
        END IF;
    END IF;
END $$;

-- 4. GARANTIR RLS ATIVO MAS ACESSÍVEL
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 5. POLICY SIMPLIFICADA PARA LEADS (EVITAR NOVOS ERROS)
DROP POLICY IF EXISTS "Users can manage own company leads" ON leads;
CREATE POLICY "Users can manage own company leads"
ON leads FOR ALL
USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
));
