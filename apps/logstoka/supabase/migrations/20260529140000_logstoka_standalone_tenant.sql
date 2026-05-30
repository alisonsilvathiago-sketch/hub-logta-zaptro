-- LogStoka — tenant/auth próprio (projeto Supabase dedicado, sem Hub/Zaptro/Logta)
-- Substitui dependência de public.profiles do monorepo.

CREATE TABLE IF NOT EXISTS public.ls_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#EA580C',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ls_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('operator', 'logistics_manager', 'admin', 'master_admin')),
  company_id UUID REFERENCES public.ls_companies(id) ON DELETE SET NULL,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ls_profiles_company ON public.ls_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_ls_profiles_email ON public.ls_profiles(email);

CREATE OR REPLACE FUNCTION public.ls_get_user_company()
RETURNS UUID AS $$
  SELECT company_id FROM public.ls_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.ls_is_master()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role IN ('master_admin', 'admin') FROM public.ls_profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.ls_handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_company UUID;
BEGIN
  SELECT id INTO default_company FROM public.ls_companies ORDER BY created_at ASC LIMIT 1;

  IF default_company IS NULL THEN
    INSERT INTO public.ls_companies (id, name, slug, status)
    VALUES ('00000000-0000-0000-0000-000000000001', 'LogStoka Matriz', 'logstoka-matriz', 'active')
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO default_company;

    IF default_company IS NULL THEN
      default_company := '00000000-0000-0000-0000-000000000001';
    END IF;
  END IF;

  INSERT INTO public.ls_profiles (id, email, full_name, role, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    'admin',
    default_company
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_logstoka ON auth.users;
CREATE TRIGGER on_auth_user_created_logstoka
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ls_handle_new_user();

ALTER TABLE public.ls_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ls_companies_read_tenant" ON public.ls_companies
  FOR SELECT TO authenticated
  USING (
    id = public.ls_get_user_company() OR public.ls_is_master()
  );

CREATE POLICY "ls_profiles_read_tenant" ON public.ls_profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR company_id = public.ls_get_user_company()
    OR public.ls_is_master()
  );

CREATE POLICY "ls_profiles_update_self" ON public.ls_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

INSERT INTO public.ls_companies (id, name, slug, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'LogStoka Matriz', 'logstoka-matriz', 'active')
ON CONFLICT (id) DO NOTHING;
