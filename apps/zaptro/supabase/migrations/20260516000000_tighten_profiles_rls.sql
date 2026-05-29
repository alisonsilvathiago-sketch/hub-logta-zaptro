-- Produção: remove políticas permissivas de dev e isola por company_id
-- Aplicar apenas após backup. Requer profiles.company_id preenchido.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_authenticated_dev ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_tenant_isolation ON public.profiles;

CREATE POLICY profiles_select_tenant ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());
