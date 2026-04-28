-- Tabela de Leads (CRM) Versão Corrigida para bater com o Código
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  responsible_name TEXT,
  segment TEXT,
  contact_name TEXT, -- Alias para responsible_name se necessário
  email TEXT,
  phone TEXT,
  service_type TEXT,
  estimated_value NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'FIRST_CONTACT',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política: Empresas vêem apenas seus próprios leads
DROP POLICY IF EXISTS "Company leads isolation" ON public.leads;
CREATE POLICY "Company leads isolation" ON public.leads
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
