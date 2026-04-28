-- Faturação / trial na app (TenantContext, ProtectedRoute).
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'trial';
