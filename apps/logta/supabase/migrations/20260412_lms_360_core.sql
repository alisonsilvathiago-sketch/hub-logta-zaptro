-- Migration: LMS 360 Ecosystem Evolution
-- Description: Evolution of the training system to support Master courses, Company courses, progress tracking, and certificates.

-- 1. Evolução da Tabela de Cursos (Para suportar Master e Monetização)
ALTER TABLE public.courses ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado', 'arquivado'));
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Evolução da Tabela de Aulas (Lessons)
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS material_url TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS storage_video_path TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS duration TEXT; -- Ex: '15:30'

-- 3. Tabela de Matrículas (Enrollments)
-- Vincula um usuário (aluno) a um curso específico (Master ou Empresa)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ, -- nulo se for vitalício
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado', 'expirado')),
    UNIQUE(profile_id, course_id)
);

-- 4. Tabela de Progresso (Lesson Progress)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(profile_id, lesson_id)
);

-- 5. Tabela de Certificados
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    certificate_code TEXT UNIQUE NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- 6. Habilitar RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Segurança (RLS)

-- Enrollments: O usuário só vê as suas próprias matrículas
CREATE POLICY "Enrollments isolation" ON public.enrollments
FOR ALL USING (profile_id = auth.uid());

-- Lesson Progress: O usuário só gerencia o seu próprio progresso
CREATE POLICY "Lesson Progress isolation" ON public.lesson_progress
FOR ALL USING (profile_id = auth.uid());

-- Certificates: O usuário só vê os seus próprios certificados
CREATE POLICY "Certificates isolation" ON public.certificates
FOR SELECT USING (profile_id = auth.uid());

-- Master Admin pode ver tudo (Gestão Global)
CREATE POLICY "Master Admin enrollment access" ON public.enrollments
FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );

CREATE POLICY "Master Admin progress access" ON public.lesson_progress
FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );

-- 8. Alterar políticas de Courses existentes para permitir leitura pública se for Master e Status Publicado
DROP POLICY IF EXISTS "Multi-tenant Courses" ON public.courses;
CREATE POLICY "LMS Courses read access" ON public.courses
FOR SELECT USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) 
    OR (company_id IS NULL AND status = 'publicado')
    OR ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' )
);

CREATE POLICY "LMS Courses manage access" ON public.courses
FOR ALL USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    OR ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' )
);
