-- LOGSTOKA — funções auxiliares e índices de performance
-- Date: 2026-05-29

CREATE INDEX IF NOT EXISTS idx_ls_movements_ref ON public.ls_stock_movements(company_id, reference_code);
CREATE INDEX IF NOT EXISTS idx_ls_movements_marketplace ON public.ls_stock_movements(company_id, marketplace, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ls_imports_company ON public.ls_reports_imports(company_id, created_at DESC);

-- Evita duplicar baixa do mesmo pedido
CREATE UNIQUE INDEX IF NOT EXISTS idx_ls_movements_order_ref
  ON public.ls_stock_movements(company_id, reference_code, movement_type)
  WHERE reference_code IS NOT NULL AND movement_type = 'exit';

COMMENT ON INDEX idx_ls_movements_order_ref IS
  'Impede baixa duplicada do mesmo pedido/marketplace na mesma empresa';
