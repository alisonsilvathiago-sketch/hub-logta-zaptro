-- Migration: Billing Extensions for Premium Checkout
-- Description: Adding customer and payment tracking for Asaas integration.

-- 1. Campos de Perfil (Para Identificação no Gateway)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document TEXT; -- CPF/CNPJ

-- 2. Vincular Matrícula ao Pagamento
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- 3. Melhorar RLS para usuários poderem ver seu próprio status de pagamento
DROP POLICY IF EXISTS "Enrollments isolation" ON public.enrollments;
CREATE POLICY "Enrollments isolation" ON public.enrollments
FOR ALL USING (profile_id = auth.uid());

-- Index para performance de busca da Asaas
CREATE INDEX IF NOT EXISTS idx_profiles_asaas_customer ON public.profiles(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_asaas_payment ON public.enrollments(asaas_payment_id);
