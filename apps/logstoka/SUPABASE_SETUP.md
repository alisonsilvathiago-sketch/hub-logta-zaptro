# LogStoka — Supabase dedicado

LogStoka **não** usa o projeto `rrjnkmgkhbtapumgmhhr` (Hub/Zaptro) nem `kgktwaziasxgeseucsoy` (Logta).

## 1. Criar projeto

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project**
2. Nome sugerido: `logstoka-prod`
3. Anote o **Project URL** e as chaves em **Settings → API**

## 2. Configurar `.env` (local, não commitar)

**Frontend** `apps/logstoka/.env`:

```env
VITE_SUPABASE_URL=https://SEU-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SUPABASE_ANON_KEY=eyJ...anon...
```

**API** `apps/logstoka/server/.env`:

```env
LOGSTOKA_SUPABASE_URL=https://SEU-REF.supabase.co
LOGSTOKA_SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
LOGSTOKA_DATABASE_URL=postgresql://postgres.[ref]:[SENHA]@...pooler.supabase.com:6543/postgres
```

## 3. Aplicar schema (somente tabelas `ls_*`)

```bash
npm run db:push --prefix apps/logstoka
```

Migrations em `apps/logstoka/supabase/migrations/`:

- `ls_companies`, `ls_profiles` — auth/tenant LogStoka
- `ls_products`, `ls_stock`, … — WMS
- prefixo **`ls_`** em todas as tabelas (isolamento no banco)

## 4. Vercel (frontend)

Variáveis `VITE_SUPABASE_*` do **projeto LogStoka**, não do Hub.

## 5. Produção

- `app.logstoka.com.br` → Vercel (frontend)
- `api.logstoka.com.br` → VPS Node (`apps/logstoka/server`)
