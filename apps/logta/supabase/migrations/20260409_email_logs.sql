-- Tabela de Logs de Email (Auditoria e Controle SaaS)
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Política: Empresas vêem apenas seus próprios logs de email
CREATE POLICY "Company email logs isolation" ON public.emails
FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
