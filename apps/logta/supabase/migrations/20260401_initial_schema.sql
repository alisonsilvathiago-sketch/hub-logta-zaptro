-- 1. Tabela de Empresas (Centrais de White-label)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0f172a',
  secondary_color TEXT DEFAULT '#0ea5e9',
  subdomain TEXT UNIQUE,
  custom_domain TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Perfis de Usuários
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Troquei para gen_random_uuid se for para simulação ou UUID do auth
  company_id UUID REFERENCES companies(id),
  full_name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('ADMIN', 'GERENTE', 'LOGISTICA', 'MOTORISTA', 'RH', 'FINANCEIRO', 'COMERCIAL', 'MASTER_ADMIN')),
  permissions JSONB DEFAULT '[]', -- Lista de permissões específicas como: gerenciar_treinamentos, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Clientes (CRM)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Rotas
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  driver_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'FINALIZADA')),
  map_data JSONB, -- Coordenadas e ordem das paradas
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Ativar RLS (Row Level Security) - SEGURANÇA MULTI-TENANT
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (Exemplos)
CREATE POLICY "Users can only see clients of their company" 
ON clients FOR ALL 
USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can only see routes of their company" 
ON routes FOR ALL 
USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- 9. Tabela de Notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  user_id UUID REFERENCES profiles(id), -- NULL se for para todos da empresa
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Multi-tenant Notifications" ON notifications FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
-- 6. Tabela de Treinamentos (Cursos)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  segment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Módulos de Treinamento
CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de Aulas (Lessons)
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas de Segurança para Treinamentos
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Multi-tenant Courses" ON courses FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Multi-tenant Modules" ON course_modules FOR ALL USING (course_id IN (SELECT id FROM courses WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Multi-tenant Lessons" ON lessons FOR ALL USING (course_id IN (SELECT id FROM courses WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())));
