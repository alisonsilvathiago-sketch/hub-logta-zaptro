-- Migration: Lesson Comments System
-- Description: Allowing students and teachers to interact via comments in lessons.

CREATE TABLE IF NOT EXISTS public.lesson_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

-- Ver todos os comentários da lição
CREATE POLICY "Anyone enrolled can read comments" ON public.lesson_comments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM enrollments 
        WHERE profile_id = auth.uid() AND course_id = lesson_comments.course_id
    )
    OR ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' )
);

-- Inserir comentário próprio
CREATE POLICY "Users can comment on enrolled courses" ON public.lesson_comments
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM enrollments 
        WHERE profile_id = auth.uid() AND course_id = lesson_comments.course_id
    )
    OR ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' )
);

-- Delete próprio
CREATE POLICY "Users can delete own comments" ON public.lesson_comments
FOR DELETE USING (profile_id = auth.uid());

-- Index
CREATE INDEX idx_comments_lesson ON public.lesson_comments(lesson_id);
