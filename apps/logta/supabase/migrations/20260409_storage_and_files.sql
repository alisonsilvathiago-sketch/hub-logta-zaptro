-- 1. Tabela de Referência de Arquivos
CREATE TABLE IF NOT EXISTS public.files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id), -- Corrigido: Apontando para companies
    user_id UUID NOT NULL REFERENCES auth.users(id),
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL, -- 'rh', 'veiculos', 'documentos', etc.
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso por empresa
CREATE POLICY "Empresas acessam apenas seus arquivos"
ON public.files
FOR ALL
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 2. Configuração do Storage (Instruções para o Bucket: 'logta-files')
-- Nota: O bucket deve ser criado manualmente no painel do Supabase como 'PRIVATE'

-- Polícias do Storage para multi-tenancy
-- O caminho esperado é: empresa_{company_id}/{categoria}/{arquivo}

-- Permitir Select (Visualização)
CREATE POLICY "Visualizar arquivos da própria empresa"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'logta-files' AND 
  (storage.foldername(name))[1] = 'empresa_' || (SELECT company_id::text FROM public.profiles WHERE id = auth.uid())
);

-- Permitir Insert (Upload)
CREATE POLICY "Fazer upload na própria empresa"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logta-files' AND 
  (storage.foldername(name))[1] = 'empresa_' || (SELECT company_id::text FROM public.profiles WHERE id = auth.uid())
);

-- Permitir Delete
CREATE POLICY "Remover arquivos da própria empresa"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logta-files' AND 
  (storage.foldername(name))[1] = 'empresa_' || (SELECT company_id::text FROM public.profiles WHERE id = auth.uid())
);
