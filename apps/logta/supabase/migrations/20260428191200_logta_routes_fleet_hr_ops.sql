-- Logta routes, fleet, HR and operations domain

CREATE TABLE IF NOT EXISTS public.route_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  route_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.route_status NOT NULL DEFAULT 'DRAFT',
  optimized_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
  optimization_notes TEXT,
  estimated_distance_km NUMERIC(10,2),
  estimated_duration_min INTEGER,
  estimated_fuel_liters NUMERIC(10,2),
  estimated_cost NUMERIC(14,2),
  actual_distance_km NUMERIC(10,2),
  actual_duration_min INTEGER,
  actual_fuel_liters NUMERIC(10,2),
  actual_cost NUMERIC(14,2),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  route_plan_id UUID NOT NULL REFERENCES public.route_plans(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id),
  client_id UUID REFERENCES public.clients(id),
  sequence_no INTEGER NOT NULL,
  stop_type TEXT NOT NULL DEFAULT 'DELIVERY',
  address TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  eta TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  departed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING',
  proof_of_delivery_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (route_plan_id, sequence_no)
);

CREATE TABLE IF NOT EXISTS public.route_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  route_plan_id UUID NOT NULL REFERENCES public.route_plans(id) ON DELETE CASCADE,
  driver_profile_id UUID REFERENCES public.profiles(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assignment_notes TEXT
);

CREATE TABLE IF NOT EXISTS public.vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  scheduled_for DATE,
  completed_at DATE,
  cost NUMERIC(14,2),
  odometer_km NUMERIC(12,1),
  service_provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicle_fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  fueled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  liters NUMERIC(10,3) NOT NULL CHECK (liters > 0),
  total_cost NUMERIC(14,2) NOT NULL CHECK (total_cost >= 0),
  odometer_km NUMERIC(12,1),
  station_name TEXT,
  created_by UUID REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  cnh_number TEXT,
  cnh_category TEXT,
  cnh_expiration DATE,
  medical_exam_expiration DATE,
  is_aggregated BOOLEAN NOT NULL DEFAULT FALSE,
  health_notes TEXT,
  performance_score NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.driver_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_profile_id UUID NOT NULL REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  break_minutes INTEGER NOT NULL DEFAULT 0 CHECK (break_minutes >= 0),
  source TEXT NOT NULL DEFAULT 'MANUAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_label TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  happened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.gps_track_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  route_plan_id UUID REFERENCES public.route_plans(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id),
  driver_profile_id UUID REFERENCES public.profiles(id),
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  speed_kmh NUMERIC(7,2),
  heading_degrees NUMERIC(6,2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_plans_company_route_date ON public.route_plans(company_id, route_date);
CREATE INDEX IF NOT EXISTS idx_route_stops_route_plan_id ON public.route_stops(route_plan_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle_id ON public.vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_driver_profile_id ON public.driver_shifts(driver_profile_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id ON public.shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_gps_track_points_route_recorded_at ON public.gps_track_points(route_plan_id, recorded_at);

ALTER TABLE public.route_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_track_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_route_plans_company_isolation ON public.route_plans;
CREATE POLICY p_route_plans_company_isolation ON public.route_plans FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_route_stops_company_isolation ON public.route_stops;
CREATE POLICY p_route_stops_company_isolation ON public.route_stops FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_route_assignments_company_isolation ON public.route_assignments;
CREATE POLICY p_route_assignments_company_isolation ON public.route_assignments FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_vehicles_company_isolation ON public.vehicles;
CREATE POLICY p_vehicles_company_isolation ON public.vehicles FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_vehicle_maintenance_company_isolation ON public.vehicle_maintenance;
CREATE POLICY p_vehicle_maintenance_company_isolation ON public.vehicle_maintenance FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_vehicle_fuel_logs_company_isolation ON public.vehicle_fuel_logs;
CREATE POLICY p_vehicle_fuel_logs_company_isolation ON public.vehicle_fuel_logs FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_driver_profiles_company_isolation ON public.driver_profiles;
CREATE POLICY p_driver_profiles_company_isolation ON public.driver_profiles FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_driver_shifts_company_isolation ON public.driver_shifts;
CREATE POLICY p_driver_shifts_company_isolation ON public.driver_shifts FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_compliance_alerts_company_isolation ON public.compliance_alerts;
CREATE POLICY p_compliance_alerts_company_isolation ON public.compliance_alerts FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_shipment_events_company_isolation ON public.shipment_events;
CREATE POLICY p_shipment_events_company_isolation ON public.shipment_events FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_gps_track_points_company_isolation ON public.gps_track_points;
CREATE POLICY p_gps_track_points_company_isolation ON public.gps_track_points FOR ALL USING (company_id = public.current_company_id());

DROP TRIGGER IF EXISTS trg_route_plans_updated_at ON public.route_plans;
CREATE TRIGGER trg_route_plans_updated_at
BEFORE UPDATE ON public.route_plans
FOR EACH ROW EXECUTE FUNCTION public.logta_set_updated_at();

DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER trg_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.logta_set_updated_at();

DROP TRIGGER IF EXISTS trg_driver_profiles_updated_at ON public.driver_profiles;
CREATE TRIGGER trg_driver_profiles_updated_at
BEFORE UPDATE ON public.driver_profiles
FOR EACH ROW EXECUTE FUNCTION public.logta_set_updated_at();
