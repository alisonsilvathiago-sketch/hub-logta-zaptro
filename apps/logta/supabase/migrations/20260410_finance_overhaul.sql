-- Finance Categories
CREATE TABLE IF NOT EXISTS finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('INCOME', 'EXPENSE', 'BOTH')) DEFAULT 'BOTH',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing / Faturamento
CREATE TABLE IF NOT EXISTS billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  client_id UUID REFERENCES clients(id),
  description TEXT,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'PENDING', -- PENDING, BILLED, RECEIVED
  billing_date TIMESTAMPTZ DEFAULT NOW(),
  due_date DATE,
  payment_method TEXT,
  invoice_url TEXT,
  order_number TEXT,
  service_category TEXT, -- Frete, Logistica, Armazenagem, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update Transactions with new requirements
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES finance_categories(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS collaborator_id UUID REFERENCES profiles(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS billing_id UUID REFERENCES billing(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- Enable RLS
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

-- Multi-tenant Policies
CREATE POLICY "Multi-tenant Finance Categories" ON finance_categories FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Multi-tenant Suppliers" ON suppliers FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Multi-tenant Billing" ON billing FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
