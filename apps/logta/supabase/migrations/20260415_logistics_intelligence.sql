-- Migration: Logistics Intelligence & Telemetry Hub
-- Description: Analytics, KPI views and real-time tracking foundation.

-- 1. Tabela de Posições de Veículos (Real-time)
CREATE TABLE IF NOT EXISTS public.vehicle_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    speed NUMERIC DEFAULT 0,
    heading NUMERIC DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(vehicle_id) -- Apenas um registro por veículo para tempo real
);

-- 2. Histórico de Telemetria (Breadcrumbs)
CREATE TABLE IF NOT EXISTS public.telemetry_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Views para Dashboards de BI (Agregados)

-- View: Lucro por Empresa (Dashboard Master ou Admin)
CREATE OR REPLACE VIEW public.view_revenue_ops AS
SELECT 
    company_id,
    SUM(CASE WHEN type = 'INCOME' AND status = 'PAID' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'EXPENSE' AND status = 'PAID' THEN amount ELSE 0 END) as total_expense,
    COUNT(id) as trans_count
FROM public.transactions
GROUP BY company_id;

-- View: Eficiência Logística
CREATE OR REPLACE VIEW public.view_logistic_efficiency AS
SELECT 
    company_id,
    COUNT(id) FILTER (WHERE status = 'ENTREGUE') as deliveries_success,
    COUNT(id) FILTER (WHERE status = 'CANCELADO') as deliveries_failed,
    AVG(CASE WHEN delivered_at IS NOT NULL THEN (delivered_at - created_at) ELSE NULL END) as avg_delivery_time
FROM public.shipments
GROUP BY company_id;

-- 4. RLS Policies
ALTER TABLE public.vehicle_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own company vehicle locations" ON public.vehicle_locations
FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users see own company telemetry" ON public.telemetry_history
FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Master vê tudo
CREATE POLICY "Master see all telemetry" ON public.telemetry_history
FOR SELECT USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );
