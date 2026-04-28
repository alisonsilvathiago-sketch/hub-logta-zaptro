-- =============================================================================
-- Logta SaaS — utilizadores de teste por área (RBAC)
-- =============================================================================
-- Senha sugerida (criar igual no Supabase Auth): Nigo5656
-- E-mails (criar em Authentication → Users, ou convite por e-mail):
--   logistica@exemplo.com, crm@exemplo.com, motorista@exemplo.com,
--   frota@exemplo.com, estoque@exemplo.com, financas@exemplo.com,
--   rh@exemplo.com, treinamentos@exemplo.com
-- Opcional: admin@exemplo.com com role ADMIN
--
-- 1) Crie a empresa demo (ajuste UUID se já existir).
-- 2) Cada utilizador em auth.users deve ter linha em public.profiles com o mesmo id.
-- 3) Execute os UPDATE abaixo (ligam auth.users.email → role + company_id).
-- =============================================================================

INSERT INTO public.companies (id, name, cnpj, primary_color, secondary_color)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Transportadora Demo Logta',
  '12.345.678/0001-90',
  '#0f172a',
  '#38bdf8'
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles AS p
SET company_id = 'a0000000-0000-4000-8000-000000000001',
    role = 'LOGISTICA',
    full_name = COALESCE(NULLIF(trim(p.full_name), ''), 'Logística Demo')
FROM auth.users u
WHERE u.id = p.id AND lower(u.email) = 'logistica@exemplo.com';

UPDATE public.profiles AS p
SET company_id = 'a0000000-0000-4000-8000-000000000001',
    role = 'CRM',
    full_name = COALESCE(NULLIF(trim(p.full_name), ''), 'CRM Demo')
FROM auth.users u
WHERE u.id = p.id AND lower(u.email) = 'crm@exemplo.com';

UPDATE public.profiles AS p
SET company_id = 'a0000000-0000-4000-8000-000000000001',
    role = 'MOTORISTA',
    full_name = COALESCE(NULLIF(trim(p.full_name), ''), 'Motorista Demo')
FROM auth.users u
WHERE u.id = p.id AND lower(u.email) = 'motorista@exemplo.com';

UPDATE public.profiles AS p
SET company_id = 'a0000000-0000-4000-8000-000000000001',
    role = 'FROTA',
    full_name = COALESCE(NULLIF(trim(p.full_name), ''), 'Frota Demo')
FROM auth.users u
WHERE u.id = p.id AND lower(u.email) = 'frota@exemplo.com';

UPDATE public.profiles AS p
SET company_id = 'a0000000-0000-4000-8000-000000000001',
    role = 'ESTOQUE',
    full_name = COALESCE(NULLIF(trim(p.full_name), ''), 'Estoque Demo')
FROM auth.users u
WHERE u.id = p.id AND lower(u.email) = 'estoque@exemplo.com';

UPDATE public.profiles AS p
SET company_id = 'a0000000-0000-4000-8000-000000000001',
    role = 'FINANCEIRO',
    full_name = COALESCE(NULLIF(trim(p.full_name), ''), 'Finanças Demo')
FROM auth.users u
WHERE u.id = p.id AND lower(u.email) = 'financas@exemplo.com';

UPDATE public.profiles AS p
SET company_id = 'a0000000-0000-4000-8000-000000000001',
    role = 'RH',
    full_name = COALESCE(NULLIF(trim(p.full_name), ''), 'RH Demo')
FROM auth.users u
WHERE u.id = p.id AND lower(u.email) = 'rh@exemplo.com';

UPDATE public.profiles AS p
SET company_id = 'a0000000-0000-4000-8000-000000000001',
    role = 'TREINAMENTOS',
    full_name = COALESCE(NULLIF(trim(p.full_name), ''), 'Treinamentos Demo')
FROM auth.users u
WHERE u.id = p.id AND lower(u.email) = 'treinamentos@exemplo.com';

UPDATE public.profiles AS p
SET company_id = 'a0000000-0000-4000-8000-000000000001',
    role = 'ADMIN',
    full_name = COALESCE(NULLIF(trim(p.full_name), ''), 'Administrador Demo')
FROM auth.users u
WHERE u.id = p.id AND lower(u.email) = 'admin@exemplo.com';
