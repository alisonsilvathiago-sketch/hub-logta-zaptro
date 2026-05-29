-- Libera login WhatsApp para um utilizador já registado (Supabase SQL Editor)
-- Substitua o e-mail:

UPDATE public.profiles
SET
  tem_zaptro = true,
  status_zaptro = 'ativo',
  role = COALESCE(role, 'ADMIN')
WHERE email = 'alisonnegoh@gmail.com';

SELECT id, email, role, company_id, tem_zaptro, status_zaptro
FROM public.profiles
WHERE email = 'alisonnegoh@gmail.com';
