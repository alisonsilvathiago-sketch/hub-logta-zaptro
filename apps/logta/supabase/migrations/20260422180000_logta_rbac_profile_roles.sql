-- Logta SaaS: perfis operacionais adicionais (CRM, Frota, Estoque, Treinamentos)
-- e alargamento do CHECK em public.profiles.role (mantém dados existentes).

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (
    role IN (
      'ADMIN',
      'GERENTE',
      'LOGISTICA',
      'MOTORISTA',
      'RH',
      'FINANCEIRO',
      'COMERCIAL',
      'CRM',
      'FROTA',
      'ESTOQUE',
      'TREINAMENTOS',
      'ATENDIMENTO',
      'MASTER_ADMIN',
      'MASTER_SUPER_ADMIN',
      'MASTER_OPERATOR',
      'MASTER_SUPPORT'
    )
  );

COMMENT ON CONSTRAINT profiles_role_check ON public.profiles IS
  'Papéis Logta SaaS: acesso à app é determinado por profiles.role (+ company_id), nunca pelo e-mail.';
