-- Migration: Knowledge Base System
-- Description: Store help categories and articles for the Logta ecosystem.

-- 1. Categorias da Base de Conhecimento
CREATE TABLE IF NOT EXISTS public.knowledge_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'HelpCircle', -- Nome do ícone Lucide
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Artigos/Manuais
CREATE TABLE IF NOT EXISTS public.knowledge_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.knowledge_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL, -- Conteúdo em formato texto/HTML/Markdown
    excerpt TEXT, -- Resumo para a busca
    views INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS: Acesso Público para Leitura
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de categorias" ON public.knowledge_categories
FOR SELECT USING (true);

CREATE POLICY "Leitura pública de artigos publicados" ON public.knowledge_articles
FOR SELECT USING (is_published = true);

CREATE POLICY "Master admin gerencia tudo na base" ON public.knowledge_categories
FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MASTER_ADMIN');

CREATE POLICY "Master admin gerencia artigos" ON public.knowledge_articles
FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MASTER_ADMIN');

-- 4. Suporte a Busca Inteligente (Supabase Full Text Search)
ALTER TABLE public.knowledge_articles 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
  to_tsvector('portuguese', title || ' ' || coalesce(excerpt, '') || ' ' || content)
) STORED;

CREATE INDEX IF NOT EXISTS idx_knowledge_articles_search ON public.knowledge_articles USING GIN (search_vector);

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_knowledge_categories
BEFORE UPDATE ON public.knowledge_categories
FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();

CREATE TRIGGER tr_update_knowledge_articles
BEFORE UPDATE ON public.knowledge_articles
FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();
