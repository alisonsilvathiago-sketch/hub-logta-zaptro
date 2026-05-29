-- LOGSTOKA WMS — Schema inicial
-- Projeto Supabase dedicado ao LogStoka (isolado de HUB, Zaptro, Logta, LogDoc)
-- Date: 2026-05-29

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers multi-tenant
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ls_get_user_company()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.ls_is_master()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role IN ('MASTER', 'MASTER_ADMIN') FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Roles & permissions (LogStoka interno)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ls_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ls_role_permissions (
  role_id UUID NOT NULL REFERENCES public.ls_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.ls_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.ls_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.ls_roles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ls_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  sku TEXT NOT NULL,
  internal_code TEXT,
  barcode TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.ls_categories(id),
  brand TEXT,
  unit TEXT NOT NULL DEFAULT 'UN',
  cost NUMERIC(14, 4) NOT NULL DEFAULT 0,
  sale_price NUMERIC(14, 4) NOT NULL DEFAULT 0,
  min_stock NUMERIC(14, 4) NOT NULL DEFAULT 0,
  max_stock NUMERIC(14, 4),
  main_image_url TEXT,
  extra_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_ls_products_company ON public.ls_products(company_id);
CREATE INDEX IF NOT EXISTS idx_ls_products_barcode ON public.ls_products(company_id, barcode);
CREATE INDEX IF NOT EXISTS idx_ls_products_name ON public.ls_products(company_id, name);

-- ---------------------------------------------------------------------------
-- Depósitos & estoque
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'physical' CHECK (type IN ('physical', 'full_marketplace', 'transit')),
  marketplace TEXT CHECK (marketplace IN ('shopee', 'mercadolivre', 'amazon', 'tiktok', 'magalu')),
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS public.ls_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES public.ls_warehouses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.ls_products(id) ON DELETE CASCADE,
  quantity NUMERIC(14, 4) NOT NULL DEFAULT 0,
  reserved_quantity NUMERIC(14, 4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (warehouse_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_ls_stock_company ON public.ls_stock(company_id);
CREATE INDEX IF NOT EXISTS idx_ls_stock_product ON public.ls_stock(product_id);

-- ---------------------------------------------------------------------------
-- Lojas / marketplaces
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  marketplace TEXT NOT NULL CHECK (marketplace IN ('shopee', 'mercadolivre', 'amazon', 'tiktok', 'magalu')),
  name TEXT NOT NULL,
  external_id TEXT,
  warehouse_id UUID REFERENCES public.ls_warehouses(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, marketplace, name)
);

-- ---------------------------------------------------------------------------
-- Fornecedores
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Movimentações (entrada, saída, ajuste)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entry', 'exit', 'transfer', 'return', 'damage', 'inventory_adjustment')),
  sub_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'pending', 'in_transit', 'completed', 'cancelled')),
  warehouse_id UUID REFERENCES public.ls_warehouses(id),
  target_warehouse_id UUID REFERENCES public.ls_warehouses(id),
  supplier_id UUID REFERENCES public.ls_suppliers(id),
  store_id UUID REFERENCES public.ls_stores(id),
  marketplace TEXT,
  reference_code TEXT,
  invoice_number TEXT,
  invoice_xml TEXT,
  notes TEXT,
  total_items INT NOT NULL DEFAULT 0,
  total_quantity NUMERIC(14, 4) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ls_stock_movement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id UUID NOT NULL REFERENCES public.ls_stock_movements(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.ls_products(id),
  sku TEXT NOT NULL,
  quantity NUMERIC(14, 4) NOT NULL,
  unit_cost NUMERIC(14, 4),
  lot_code TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ls_movements_company_date ON public.ls_stock_movements(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ls_movements_type ON public.ls_stock_movements(company_id, movement_type);

-- ---------------------------------------------------------------------------
-- Transferências
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  movement_id UUID REFERENCES public.ls_stock_movements(id),
  origin_warehouse_id UUID NOT NULL REFERENCES public.ls_warehouses(id),
  destination_warehouse_id UUID NOT NULL REFERENCES public.ls_warehouses(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  notes TEXT,
  shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Devoluções
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  movement_id UUID REFERENCES public.ls_stock_movements(id),
  store_id UUID REFERENCES public.ls_stores(id),
  warehouse_id UUID REFERENCES public.ls_warehouses(id),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'triage', 'approved', 'rejected', 'completed')),
  reason TEXT,
  customer_name TEXT,
  order_reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  triaged_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ls_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES public.ls_returns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.ls_products(id),
  quantity NUMERIC(14, 4) NOT NULL,
  condition TEXT CHECK (condition IN ('good', 'damaged', 'missing')),
  notes TEXT
);

-- ---------------------------------------------------------------------------
-- Avarias
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_damages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  movement_id UUID REFERENCES public.ls_stock_movements(id),
  warehouse_id UUID REFERENCES public.ls_warehouses(id),
  product_id UUID NOT NULL REFERENCES public.ls_products(id),
  quantity NUMERIC(14, 4) NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('broken', 'wet', 'expired', 'lost', 'return_damaged', 'other')),
  photo_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Inventário
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES public.ls_warehouses(id),
  inventory_type TEXT NOT NULL CHECK (inventory_type IN ('rotating', 'general')),
  status TEXT NOT NULL DEFAULT 'counting' CHECK (status IN ('counting', 'review', 'approved', 'adjusted', 'cancelled')),
  notes TEXT,
  started_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ls_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.ls_inventories(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.ls_products(id),
  system_quantity NUMERIC(14, 4) NOT NULL DEFAULT 0,
  counted_quantity NUMERIC(14, 4),
  difference NUMERIC(14, 4) GENERATED ALWAYS AS (COALESCE(counted_quantity, 0) - system_quantity) STORED,
  notes TEXT,
  counted_by UUID REFERENCES auth.users(id),
  counted_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- Picking / conferência
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_picking_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  store_id UUID REFERENCES public.ls_stores(id),
  marketplace TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'picking', 'picked', 'shipped', 'cancelled')),
  reference_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_items INT NOT NULL DEFAULT 0,
  total_quantity NUMERIC(14, 4) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ls_picking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  picking_order_id UUID NOT NULL REFERENCES public.ls_picking_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.ls_products(id),
  sku TEXT NOT NULL,
  quantity_sold NUMERIC(14, 4) NOT NULL DEFAULT 0,
  quantity_picked NUMERIC(14, 4) NOT NULL DEFAULT 0,
  quantity_shipped NUMERIC(14, 4) NOT NULL DEFAULT 0,
  warehouse_id UUID REFERENCES public.ls_warehouses(id)
);

CREATE TABLE IF NOT EXISTS public.ls_conference_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  marketplace TEXT,
  store_id UUID REFERENCES public.ls_stores(id),
  quantity_sold NUMERIC(14, 4) NOT NULL DEFAULT 0,
  quantity_picked NUMERIC(14, 4) NOT NULL DEFAULT 0,
  quantity_shipped NUMERIC(14, 4) NOT NULL DEFAULT 0,
  quantity_returned NUMERIC(14, 4) NOT NULL DEFAULT 0,
  quantity_damaged NUMERIC(14, 4) NOT NULL DEFAULT 0,
  divergence NUMERIC(14, 4) GENERATED ALWAYS AS (
    quantity_sold - quantity_shipped - quantity_returned - quantity_damaged
  ) STORED,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, snapshot_date, marketplace, store_id)
);

-- ---------------------------------------------------------------------------
-- Importações & OCR
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_reports_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('xlsx', 'csv', 'pdf', 'xml', 'image')),
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'partial')),
  rows_total INT NOT NULL DEFAULT 0,
  rows_processed INT NOT NULL DEFAULT 0,
  rows_failed INT NOT NULL DEFAULT 0,
  ocr_payload JSONB,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Integrações, webhooks, API keys
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('shopee', 'mercadolivre', 'amazon', 'tiktok', 'magalu', 'bling', 'tiny', 'omie', 'sap', 'custom')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'error')),
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, provider)
);

CREATE TABLE IF NOT EXISTS public.ls_webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ls_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  event_type TEXT NOT NULL,
  source TEXT,
  destination TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'retrying')),
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ls_integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  integration_id UUID REFERENCES public.ls_integrations(id),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  endpoint TEXT,
  request_payload JSONB,
  response_payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ls_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  rate_limit_per_minute INT NOT NULL DEFAULT 120,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Alertas & notificações
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ls_alerts_company_unread ON public.ls_alerts(company_id, is_read, created_at DESC);

-- ---------------------------------------------------------------------------
-- Auditoria imutável
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ls_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ls_audit_company_date ON public.ls_audit_logs(company_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.ls_process_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ls_audit_logs (company_id, user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    COALESCE(NEW.company_id, OLD.company_id, public.ls_get_user_company()),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Estoque: apply movement (função central)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ls_apply_stock_delta(
  p_company_id UUID,
  p_warehouse_id UUID,
  p_product_id UUID,
  p_delta NUMERIC
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.ls_stock (company_id, warehouse_id, product_id, quantity, updated_at)
  VALUES (p_company_id, p_warehouse_id, p_product_id, GREATEST(p_delta, 0), now())
  ON CONFLICT (warehouse_id, product_id)
  DO UPDATE SET
    quantity = GREATEST(public.ls_stock.quantity + p_delta, 0),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.ls_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_stock_movement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_damages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_picking_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_picking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_conference_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_reports_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_audit_logs ENABLE ROW LEVEL SECURITY;

-- Roles/permissions: read-only for authenticated
CREATE POLICY "ls_roles_read" ON public.ls_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "ls_permissions_read" ON public.ls_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "ls_role_permissions_read" ON public.ls_role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "ls_user_roles_tenant" ON public.ls_user_roles
  FOR ALL TO authenticated
  USING (company_id = public.ls_get_user_company() OR public.ls_is_master())
  WITH CHECK (company_id = public.ls_get_user_company() OR public.ls_is_master());

-- Generic tenant policy macro via DO block
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ls_categories', 'ls_products', 'ls_warehouses', 'ls_stock', 'ls_stores',
    'ls_suppliers', 'ls_stock_movements', 'ls_transfers', 'ls_returns',
    'ls_damages', 'ls_inventories', 'ls_picking_orders', 'ls_conference_snapshots',
    'ls_reports_imports', 'ls_integrations', 'ls_webhook_endpoints', 'ls_webhook_events',
    'ls_integration_logs', 'ls_api_keys', 'ls_alerts'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (company_id = public.ls_get_user_company() OR public.ls_is_master()) WITH CHECK (company_id = public.ls_get_user_company() OR public.ls_is_master())',
      t || '_tenant', t
    );
  END LOOP;
END $$;

CREATE POLICY "ls_movement_items_tenant" ON public.ls_stock_movement_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ls_stock_movements m
      WHERE m.id = movement_id
        AND (m.company_id = public.ls_get_user_company() OR public.ls_is_master())
    )
  );

CREATE POLICY "ls_return_items_tenant" ON public.ls_return_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ls_returns r
      WHERE r.id = return_id
        AND (r.company_id = public.ls_get_user_company() OR public.ls_is_master())
    )
  );

CREATE POLICY "ls_inventory_items_tenant" ON public.ls_inventory_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ls_inventories i
      WHERE i.id = inventory_id
        AND (i.company_id = public.ls_get_user_company() OR public.ls_is_master())
    )
  );

CREATE POLICY "ls_picking_items_tenant" ON public.ls_picking_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ls_picking_orders p
      WHERE p.id = picking_order_id
        AND (p.company_id = public.ls_get_user_company() OR public.ls_is_master())
    )
  );

CREATE POLICY "ls_audit_read" ON public.ls_audit_logs
  FOR SELECT TO authenticated
  USING (company_id = public.ls_get_user_company() OR public.ls_is_master());

-- Audit triggers (principais entidades)
CREATE TRIGGER ls_audit_products AFTER INSERT OR UPDATE OR DELETE ON public.ls_products
  FOR EACH ROW EXECUTE FUNCTION public.ls_process_audit_log();
CREATE TRIGGER ls_audit_warehouses AFTER INSERT OR UPDATE OR DELETE ON public.ls_warehouses
  FOR EACH ROW EXECUTE FUNCTION public.ls_process_audit_log();
CREATE TRIGGER ls_audit_movements AFTER INSERT OR UPDATE OR DELETE ON public.ls_stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.ls_process_audit_log();
CREATE TRIGGER ls_audit_stock AFTER INSERT OR UPDATE OR DELETE ON public.ls_stock
  FOR EACH ROW EXECUTE FUNCTION public.ls_process_audit_log();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('logstoka', 'logstoka', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "ls_storage_tenant" ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'logstoka'
  AND (storage.foldername(name))[1] = public.ls_get_user_company()::text
)
WITH CHECK (
  bucket_id = 'logstoka'
  AND (storage.foldername(name))[1] = public.ls_get_user_company()::text
);

-- ---------------------------------------------------------------------------
-- Seed roles & permissions
-- ---------------------------------------------------------------------------

INSERT INTO public.ls_roles (code, name, description) VALUES
  ('master_admin', 'Administrador Master', 'Acesso total ao LogStoka'),
  ('logistics_manager', 'Gestor Logístico', 'Aprova movimentações e inventários'),
  ('operator', 'Operador', 'Entrada, saída, conferência e inventário')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.ls_permissions (code, name, module) VALUES
  ('products.read', 'Visualizar produtos', 'products'),
  ('products.write', 'Gerenciar produtos', 'products'),
  ('warehouses.read', 'Visualizar depósitos', 'warehouses'),
  ('warehouses.write', 'Gerenciar depósitos', 'warehouses'),
  ('movements.read', 'Visualizar movimentações', 'movements'),
  ('movements.write', 'Registrar movimentações', 'movements'),
  ('movements.approve', 'Aprovar movimentações', 'movements'),
  ('inventory.read', 'Visualizar inventários', 'inventory'),
  ('inventory.write', 'Executar inventários', 'inventory'),
  ('inventory.approve', 'Aprovar inventários', 'inventory'),
  ('reports.read', 'Visualizar relatórios', 'reports'),
  ('integrations.read', 'Visualizar integrações', 'integrations'),
  ('integrations.write', 'Configurar integrações', 'integrations'),
  ('settings.read', 'Visualizar configurações', 'settings'),
  ('settings.write', 'Alterar configurações', 'settings')
ON CONFLICT (code) DO NOTHING;

-- master_admin: all permissions
INSERT INTO public.ls_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.ls_roles r
CROSS JOIN public.ls_permissions p
WHERE r.code = 'master_admin'
ON CONFLICT DO NOTHING;

-- logistics_manager
INSERT INTO public.ls_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.ls_roles r
JOIN public.ls_permissions p ON p.code IN (
  'products.read', 'warehouses.read', 'warehouses.write',
  'movements.read', 'movements.approve', 'inventory.read', 'inventory.approve',
  'reports.read', 'integrations.read'
)
WHERE r.code = 'logistics_manager'
ON CONFLICT DO NOTHING;

-- operator
INSERT INTO public.ls_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.ls_roles r
JOIN public.ls_permissions p ON p.code IN (
  'products.read', 'warehouses.read', 'movements.read', 'movements.write',
  'inventory.read', 'inventory.write'
)
WHERE r.code = 'operator'
ON CONFLICT DO NOTHING;
