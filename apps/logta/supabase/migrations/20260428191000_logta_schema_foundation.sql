-- Logta advanced schema foundation (helpers + enums + base compatibility)

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.logta_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.route_status AS ENUM ('DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.vehicle_status AS ENUM ('ACTIVE', 'IDLE', 'MAINTENANCE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.contract_status AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'TERMINATED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.integration_status AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.document_owner_type AS ENUM ('CLIENT', 'VEHICLE', 'DRIVER', 'CONTRACT', 'SHIPMENT', 'COMPANY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_deal_stage AS ENUM ('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.inventory_movement_type AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS manufacturer TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS capacity_kg NUMERIC(10,2);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS fuel_type TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS current_odometer_km NUMERIC(12,1);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS next_service_due_at_km NUMERIC(12,1);

ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS current_stock NUMERIC(12,3);
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(14,4);
UPDATE public.inventory_items
SET current_stock = COALESCE(current_stock, quantity, 0)
WHERE current_stock IS NULL;
ALTER TABLE public.inventory_items ALTER COLUMN current_stock SET DEFAULT 0;
ALTER TABLE public.inventory_items ALTER COLUMN current_stock SET NOT NULL;

ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS movement_type public.inventory_movement_type;
UPDATE public.inventory_movements
SET movement_type = CASE
  WHEN type = 'IN' THEN 'IN'::public.inventory_movement_type
  WHEN type = 'OUT' THEN 'OUT'::public.inventory_movement_type
  ELSE 'ADJUSTMENT'::public.inventory_movement_type
END
WHERE movement_type IS NULL;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS moved_at TIMESTAMPTZ DEFAULT NOW();
UPDATE public.inventory_movements SET moved_at = COALESCE(moved_at, created_at);
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS moved_by UUID REFERENCES public.profiles(id);
UPDATE public.inventory_movements SET moved_by = user_id WHERE moved_by IS NULL;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS reference_type TEXT;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE public.inventory_movements ALTER COLUMN movement_type SET NOT NULL;
ALTER TABLE public.inventory_movements ALTER COLUMN quantity TYPE NUMERIC(12,3);

CREATE TABLE IF NOT EXISTS public.inventory_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, code)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_vehicles_company_plate ON public.vehicles(company_id, plate);
CREATE UNIQUE INDEX IF NOT EXISTS ux_vehicles_company_code ON public.vehicles(company_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_items_company_sku ON public.inventory_items(company_id, sku);
