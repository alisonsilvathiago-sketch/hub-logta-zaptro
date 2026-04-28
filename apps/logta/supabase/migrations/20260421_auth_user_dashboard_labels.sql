-- Painel Supabase → Authentication → Users: coluna "Display name" legível (empresa + módulos + nome).
-- Fonte: public.profiles + companies. Mantém o resto de raw_user_meta_data (ex.: email_verified).

CREATE OR REPLACE FUNCTION public.auth_user_meta_payload_for_profile(p public.profiles)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company text;
  v_tags text;
  v_modules jsonb;
  v_auth_email text;
  v_line text;
BEGIN
  SELECT c.name INTO v_company FROM public.companies c WHERE c.id = p.company_id;

  v_modules := COALESCE(p.metadata, '{}'::jsonb) -> 'modules';

  v_tags := trim(
    both ', '
    FROM concat_ws(
      ', ',
      CASE WHEN COALESCE((v_modules ->> 'logta')::boolean, false) THEN 'Logta' END,
      CASE WHEN COALESCE((v_modules ->> 'whatsapp')::boolean, false) THEN 'WhatsApp' END,
      CASE WHEN COALESCE((v_modules ->> 'academy')::boolean, false) THEN 'Academy' END
    )
  );

  IF v_tags IS NULL OR v_tags = '' THEN
    v_tags := 'sem módulo';
  END IF;

  SELECT email INTO v_auth_email FROM auth.users WHERE id = p.id LIMIT 1;

  v_line :=
    '[' || v_tags || '] '
    || COALESCE(NULLIF(trim(v_company), ''), 'Sem empresa')
    || ' · '
    || COALESCE(NULLIF(trim(p.full_name), ''), p.email, v_auth_email, '');

  RETURN jsonb_build_object(
    'full_name',
    v_line,
    'display_name',
    v_line,
    'company_name',
    COALESCE(v_company, ''),
    'product_tags',
    v_tags,
    'role_label',
    COALESCE(p.role, ''),
    'profile_email',
    COALESCE(p.email, v_auth_email, '')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_auth_user_metadata_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || public.auth_user_meta_payload_for_profile(NEW)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auth_user_meta_payload_for_profile(public.profiles) IS
  'JSON para raw_user_meta_data: identifica empresa e módulos (Logta, WhatsApp, Academy) no Auth Dashboard.';

DROP TRIGGER IF EXISTS trg_profiles_sync_auth_metadata ON public.profiles;

CREATE TRIGGER trg_profiles_sync_auth_metadata
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_auth_user_metadata_from_profile();

-- Backfill: todos os perfis já ligados a auth.users
UPDATE auth.users AS u
SET
  raw_user_meta_data =
    COALESCE(u.raw_user_meta_data, '{}'::jsonb) || public.auth_user_meta_payload_for_profile(p)
FROM public.profiles AS p
WHERE u.id = p.id;
