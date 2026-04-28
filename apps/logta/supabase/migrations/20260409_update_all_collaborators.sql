-- Missing CRM Tables
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  company_name TEXT NOT NULL,
  responsible_name TEXT,
  email TEXT,
  phone TEXT,
  cnpj TEXT,
  address TEXT,
  service_type TEXT,
  estimated_value NUMERIC,
  status TEXT DEFAULT 'FIRST_CONTACT' CHECK (status IN ('FIRST_CONTACT', 'NEGOTIATION', 'PROPOSAL', 'CLOSED', 'LOST')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_to UUID REFERENCES profiles(id)
);

-- Update Clients Table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cnpj_cpf TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS partnership_time TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS transport_type TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';

-- Inventory Tables
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  sku TEXT,
  name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC DEFAULT 0,
  unit TEXT,
  location TEXT,
  min_stock NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'IN_STOCK',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  item_id UUID REFERENCES inventory_items(id) NOT NULL,
  type TEXT CHECK (type IN ('IN', 'OUT')),
  quantity NUMERIC NOT NULL,
  user_id UUID REFERENCES profiles(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fleet Tables
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  plate TEXT UNIQUE NOT NULL,
  model TEXT NOT NULL,
  brand TEXT,
  year INTEGER,
  type TEXT, -- Truck, Carreta, etc.
  status TEXT DEFAULT 'OPERACIONAL' CHECK (status IN ('OPERACIONAL', 'MANUTENCAO', 'AGUARDANDO')),
  last_maintenance TIMESTAMPTZ,
  next_maintenance TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  description TEXT NOT NULL,
  cost NUMERIC,
  date TIMESTAMPTZ DEFAULT NOW(),
  technician TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finance Tables
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  description TEXT NOT NULL,
  client_provider TEXT,
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('INCOME', 'EXPENSE')),
  category TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PAID', 'PENDING', 'OVERDUE')),
  due_date DATE,
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id)
);

-- RLS for everything
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Multi-tenant Policies
CREATE POLICY "Multi-tenant Leads" ON leads FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Multi-tenant Inventory" ON inventory_items FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Multi-tenant Inventory Movements" ON inventory_movements FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Multi-tenant Vehicles" ON vehicles FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Multi-tenant Maintenance" ON maintenance_logs FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Multi-tenant Transactions" ON transactions FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

