-- Tabela de Clientes (CRM)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  cnpj_cpf TEXT,
  segment TEXT,
  partnership_time TEXT,
  transport_type TEXT,
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Política: Isolamento por empresa
CREATE POLICY "Company clients isolation" ON public.clients
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
