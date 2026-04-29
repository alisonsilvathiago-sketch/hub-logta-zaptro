-- Logta documents, CRM, inventory, integrations, AI and communication domain

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  owner_type public.document_owner_type NOT NULL,
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  expires_at DATE,
  signed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crm_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS public.crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES public.crm_pipelines(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id),
  title TEXT NOT NULL,
  stage public.crm_deal_stage NOT NULL DEFAULT 'LEAD',
  amount NUMERIC(14,2),
  expected_close_date DATE,
  owner_profile_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  done_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  status public.integration_status NOT NULL DEFAULT 'DISCONNECTED',
  config JSONB NOT NULL DEFAULT '{}'::JSONB,
  secret_ref TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, provider_name)
);

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  event_types TEXT[] NOT NULL DEFAULT '{}',
  secret_ref TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  http_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  confidence NUMERIC(5,2),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  input_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  output_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  requested_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.communication_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  subject TEXT,
  external_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.communication_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.communication_threads(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
  provider TEXT,
  recipient TEXT,
  body TEXT,
  sent_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  agenda TEXT,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  meeting_url TEXT,
  provider TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_owner ON public.documents(company_id, owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON public.crm_deals(company_id, stage);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON public.inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint_id ON public.webhook_deliveries(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON public.ai_jobs(company_id, status);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_documents_company_isolation ON public.documents;
CREATE POLICY p_documents_company_isolation ON public.documents FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_crm_pipelines_company_isolation ON public.crm_pipelines;
CREATE POLICY p_crm_pipelines_company_isolation ON public.crm_pipelines FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_crm_deals_company_isolation ON public.crm_deals;
CREATE POLICY p_crm_deals_company_isolation ON public.crm_deals FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_crm_activities_company_isolation ON public.crm_activities;
CREATE POLICY p_crm_activities_company_isolation ON public.crm_activities FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_inventory_locations_company_isolation ON public.inventory_locations;
CREATE POLICY p_inventory_locations_company_isolation ON public.inventory_locations FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_inventory_items_company_isolation ON public.inventory_items;
CREATE POLICY p_inventory_items_company_isolation ON public.inventory_items FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_inventory_movements_company_isolation ON public.inventory_movements;
CREATE POLICY p_inventory_movements_company_isolation ON public.inventory_movements FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_integration_connections_company_isolation ON public.integration_connections;
CREATE POLICY p_integration_connections_company_isolation ON public.integration_connections FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_webhook_endpoints_company_isolation ON public.webhook_endpoints;
CREATE POLICY p_webhook_endpoints_company_isolation ON public.webhook_endpoints FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_webhook_deliveries_company_isolation ON public.webhook_deliveries;
CREATE POLICY p_webhook_deliveries_company_isolation ON public.webhook_deliveries FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_ai_insights_company_isolation ON public.ai_insights;
CREATE POLICY p_ai_insights_company_isolation ON public.ai_insights FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_ai_jobs_company_isolation ON public.ai_jobs;
CREATE POLICY p_ai_jobs_company_isolation ON public.ai_jobs FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_communication_threads_company_isolation ON public.communication_threads;
CREATE POLICY p_communication_threads_company_isolation ON public.communication_threads FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_communication_messages_company_isolation ON public.communication_messages;
CREATE POLICY p_communication_messages_company_isolation ON public.communication_messages FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_meetings_company_isolation ON public.meetings;
CREATE POLICY p_meetings_company_isolation ON public.meetings FOR ALL USING (company_id = public.current_company_id());

DROP TRIGGER IF EXISTS trg_inventory_items_updated_at ON public.inventory_items;
CREATE TRIGGER trg_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION public.logta_set_updated_at();

DROP TRIGGER IF EXISTS trg_crm_deals_updated_at ON public.crm_deals;
CREATE TRIGGER trg_crm_deals_updated_at
BEFORE UPDATE ON public.crm_deals
FOR EACH ROW EXECUTE FUNCTION public.logta_set_updated_at();

DROP TRIGGER IF EXISTS trg_integration_connections_updated_at ON public.integration_connections;
CREATE TRIGGER trg_integration_connections_updated_at
BEFORE UPDATE ON public.integration_connections
FOR EACH ROW EXECUTE FUNCTION public.logta_set_updated_at();

DROP TRIGGER IF EXISTS trg_webhook_endpoints_updated_at ON public.webhook_endpoints;
CREATE TRIGGER trg_webhook_endpoints_updated_at
BEFORE UPDATE ON public.webhook_endpoints
FOR EACH ROW EXECUTE FUNCTION public.logta_set_updated_at();
