-- Security Advisor (Supabase): alinhar RLS, search_path em funções, e reduzir política "always true" em whatsapp_companies.
-- Idempotente. Não altera o 401 da Evolution API (isso é HTTP na Edge Function).

-- ---------------------------------------------------------------------------
-- A) Tabelas multi-tenant: garantir RLS ligado (corrige "policies exist but RLS disabled")
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'public.inventory_items',
    'public.leads',
    'public.routes',
    'public.shipments',
    'public.transactions',
    'public.vehicles',
    'public.maintenance_logs',
    'public.inventory_movements'
  ]
  LOOP
    IF to_regclass(t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- B) Funções públicas: search_path fixo (WARN "function search_path mutable")
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) AS fq
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('log_action', 'set_lead_company_id', 'handle_new_user')
      AND p.prokind = 'f'
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', r.fq);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'search_path skip %: %', r.fq, SQLERRM;
    END;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- C) whatsapp_companies: revogar anon + política por tenant / MASTER (menos "USING true")
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.whatsapp_companies') IS NULL THEN
    RETURN;
  END IF;

  REVOKE ALL ON TABLE public.whatsapp_companies FROM anon;

  DROP POLICY IF EXISTS "whatsapp_companies_authenticated_rw" ON public.whatsapp_companies;

  CREATE POLICY "whatsapp_companies_access"
    ON public.whatsapp_companies
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND (
            upper(coalesce(p.role, '')) = 'MASTER'
            OR upper(coalesce(p.role, '')) LIKE 'MASTER\_%' ESCAPE '\'
          )
      )
      OR id = (
        SELECT p2.company_id
        FROM public.profiles p2
        WHERE p2.id = auth.uid()
          AND p2.company_id IS NOT NULL
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND (
            upper(coalesce(p.role, '')) = 'MASTER'
            OR upper(coalesce(p.role, '')) LIKE 'MASTER\_%' ESCAPE '\'
          )
      )
      OR id = (
        SELECT p2.company_id
        FROM public.profiles p2
        WHERE p2.id = auth.uid()
          AND p2.company_id IS NOT NULL
      )
      OR (
        SELECT p3.company_id
        FROM public.profiles p3
        WHERE p3.id = auth.uid()
      ) IS NULL
    );
END $$;
