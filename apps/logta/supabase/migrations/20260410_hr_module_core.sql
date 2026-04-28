-- ADIÇÃO DE CAMPOS DE RH E MOTORISTA NA TABELA PROFILES (OU EMPLOYEES)
-- Vamos usar uma tabela de 'employees' vinculada a 'profiles' para maior organização

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  
  -- Dados Cadastrais
  full_name TEXT NOT NULL,
  cpf_cnpj TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  position TEXT, -- Cargo
  type TEXT DEFAULT 'Funcionário', -- Funcionário, Motorista, Agregado
  status TEXT DEFAULT 'Ativo', -- Ativo, Inativo, Afastado
  
  -- Dados de Motorista (Se aplicável)
  cnh_number TEXT,
  cnh_category TEXT,
  cnh_expiry DATE,
  vehicle_plate TEXT,
  vehicle_model TEXT,
  
  -- Datas
  hiring_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Saúde e Check-in Diário
CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  company_id UUID REFERENCES companies(id),
  
  well_being INTEGER DEFAULT 5, -- 1 a 5
  fatigue_level INTEGER DEFAULT 1, -- 1 a 5
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Documentos (Storage Link)
CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  company_id UUID REFERENCES companies(id),
  
  doc_type TEXT, -- CNH, Holerite, Contrato, Atestado
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativando RLS para segurança multi-empresa
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- Policies Simples
CREATE POLICY "Users can manage own company employees" ON employees FOR ALL USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage own company health" ON health_checks FOR ALL USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage own company docs" ON employee_documents FOR ALL USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
