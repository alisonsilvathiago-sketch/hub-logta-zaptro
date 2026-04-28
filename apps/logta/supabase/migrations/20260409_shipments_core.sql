-- Create Shipments Table (Operational Logistics)
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id),
    status TEXT DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_ROTA', 'ENTREGUE', 'CANCELADO')),
    description TEXT,
    weight NUMERIC,
    lat NUMERIC,
    lng NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Multi-tenant Policy
CREATE POLICY "Company-Scoped Shipments isolation" ON public.shipments
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_shipments_company_id ON public.shipments(company_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
