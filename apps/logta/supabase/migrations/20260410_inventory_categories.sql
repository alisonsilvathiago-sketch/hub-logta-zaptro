-- Inventory Categories Table
CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;

-- Multi-tenant Policy
CREATE POLICY "Multi-tenant Inventory Categories" ON inventory_categories 
FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Add category_id to inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES inventory_categories(id);
