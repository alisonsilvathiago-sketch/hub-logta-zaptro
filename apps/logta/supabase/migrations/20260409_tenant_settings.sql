-- Tabela para personalização visual de cada cliente (White Label)
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3F0B78',
  secondary_color TEXT DEFAULT '#1E293B',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

-- Política: Empresas podem ver suas próprias configurações
CREATE POLICY "View own tenant settings" ON public.tenant_settings
FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Política: Admins podem atualizar suas próprias configurações
CREATE POLICY "Update own tenant settings" ON public.tenant_settings
FOR UPDATE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Criar trigger para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenant_settings_updated_at
BEFORE UPDATE ON tenant_settings
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
