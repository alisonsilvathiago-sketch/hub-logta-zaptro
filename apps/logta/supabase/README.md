# Supabase (Logta SaaS)

Migrações SQL versionadas para o projeto Supabase usado pelo front (`VITE_SUPABASE_URL` / `src/lib/supabase.ts`).

## Como aplicar

1. Com a CLI: `supabase db push` (com o projeto ligado ao mesmo ref que o `.env.local`).
2. Ou copiar o conteúdo de `migrations/*.sql` para o **SQL Editor** do dashboard Supabase, na ordem dos timestamps dos ficheiros.

## Edge functions (neste repo)

Funções mantidas aqui: `logta-api`, `asaas-checkout`, `asaas-webhook`, `backup-engine`, `restore-engine`, `resend-email`, `send-security-otp`.
