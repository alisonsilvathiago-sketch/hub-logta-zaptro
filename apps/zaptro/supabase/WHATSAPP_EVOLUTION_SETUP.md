# WhatsApp Evolution — Supabase + Zaptro

Projeto: `rrjnkmgkhbtapumgmhhr`  
Edge: `https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/evolution-api`

## 1. Rotacionar API key na VPS (urgente)

Se a `GLOBAL_API_KEY` foi exposta, gere uma nova no servidor Evolution:

```bash
ssh usuario@108.174.151.98
cd /opt/evolution-go
# edite .env → GLOBAL_API_KEY=nova-chave-longa
docker compose restart   # ou o comando que você usa
```

## 2. Secrets no Supabase

A Edge Function lê **`EVOLUTION_API_KEY`** (não `GLOBAL_API_KEY`).

### Opção A — arquivo `.env` (recomendado, sem erro de aspas)

```bash
cd apps/zaptro/supabase
cp secrets.evolution.env.example secrets.evolution.env
# Edite secrets.evolution.env — uma variável por linha, SEM aspas na chave
```

Conteúdo de `secrets.evolution.env`:

```env
EVOLUTION_API_URL=https://evolution.zaptro.com.br
EVOLUTION_API_KEY=sua_chave_nova_aqui
EVOLUTION_INSTANCE=zaptro
EVOLUTION_API_MODE=go
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_aqui
```

Aplicar e validar:

```bash
supabase secrets set --env-file secrets.evolution.env --project-ref rrjnkmgkhbtapumgmhhr
supabase secrets list --project-ref rrjnkmgkhbtapumgmhhr
```

Ou use o script do repo:

```bash
bash apps/zaptro/scripts/supabase-evolution-setup.sh
```

### Opção B — linha de comando (cuidado com aspas)

```bash
supabase secrets set --project-ref rrjnkmgkhbtapumgmhhr \
  EVOLUTION_API_URL='https://evolution.zaptro.com.br' \
  EVOLUTION_API_KEY='SUA_CHAVE_NOVA_AQUI' \
  EVOLUTION_INSTANCE='zaptro' \
  EVOLUTION_API_MODE='go'

supabase secrets list --project-ref rrjnkmgkhbtapumgmhhr
```

| Secret | Valor |
|--------|--------|
| `EVOLUTION_API_URL` | `https://evolution.zaptro.com.br` (sem barra no fim) |
| `EVOLUTION_API_KEY` | mesma `GLOBAL_API_KEY` / `VITE_EVOLUTION_API_KEY` |
| `EVOLUTION_INSTANCE` | `zaptro` |
| `EVOLUTION_API_MODE` | `go` |
| `SUPABASE_SERVICE_ROLE_KEY` | service role (webhook grava mensagens) |

**Erros comuns:** tudo numa linha só; usar `GLOBAL_API_KEY` em vez de `EVOLUTION_API_KEY`; aspas não fechadas; chave com `?` (cópia corrompida — copie de novo do `.env` da VPS).

## 3. Deploy da Edge Function

Código: `apps/zaptro/supabase/functions/evolution-api/index.ts`

```bash
npx supabase login
npx supabase functions deploy evolution-api \
  --project-ref rrjnkmgkhbtapumgmhhr \
  --workdir apps/zaptro
```

Rotas:

- `GET /instance/connectionState/{instance?}`
- `GET /instance/connect/{instance?}`
- `POST /instance/create`
- `POST /message/sendText/{instance?}`
- `DELETE /instance/logout/{instance?}`
- `POST /instance/activateInbox/{instance?}` — regista webhook + `whatsapp_instances`
- `POST /webhook` — Evolution GO envia mensagens recebidas (grava `whatsapp_conversations` / `whatsapp_messages`)

Secrets adicionais recomendados:

| Secret | Valor |
|--------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | service role (webhook grava mensagens) |
| `EVOLUTION_WEBHOOK_SECRET` | opcional — valida header `x-zaptro-webhook-secret` |
| `EVOLUTION_WEBHOOK_URL` | opcional — URL pública se diferente do Supabase |

## 4. Migração `whatsapp_connections`

SQL em `supabase/migrations/`. Aplique no SQL Editor ou:

```bash
npx supabase db push --project-ref rrjnkmgkhbtapumgmhhr --workdir apps/zaptro
```

A Edge faz `upsert` em `whatsapp_connections` a cada connect/state/logout.

## 5. Frontend Zaptro

Serviço: `src/services/evolution.service.ts`

```ts
import {
  connectWhatsapp,
  getConnectionState,
  sendMessage,
  disconnect,
} from '@/services/evolution.service';
```

`.env.local`:

```env
VITE_SUPABASE_URL=https://rrjnkmgkhbtapumgmhhr.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_EVOLUTION_USE_EDGE=true
```

**Não** coloque `VITE_EVOLUTION_API_KEY` em produção — a chave fica só nos Secrets.

Login: use conta **Supabase real** (`/login`). O utilizador `zaptro@teste.com` (dev) não envia JWT válido para a Edge.

Tela de ligação: **Configurações → WhatsApp** (`WhatsAppConfig.tsx`).

## 6. Testes curl

Obtenha `USER_JWT` no browser (DevTools → Application → `logta-auth-token` ou sessão Supabase) e `ANON_KEY` do painel.

```bash
BASE="https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/evolution-api"
JWT="eyJ..."   # access_token do utilizador
ANON="eyJ..."  # anon key

curl -s "$BASE/instance/connectionState" \
  -H "Authorization: Bearer $JWT" -H "apikey: $ANON"

curl -s "$BASE/instance/connect/zaptro-SEU_USER_ID" \
  -H "Authorization: Bearer $JWT" -H "apikey: $ANON"

curl -s -X POST "$BASE/message/sendText/zaptro-SEU_USER_ID" \
  -H "Authorization: Bearer $JWT" -H "apikey: $ANON" \
  -H "Content-Type: application/json" \
  -d '{"number":"5511999999999","text":"Olá"}'

curl -s -X DELETE "$BASE/instance/logout/zaptro-SEU_USER_ID" \
  -H "Authorization: Bearer $JWT" -H "apikey: $ANON"
```

Substitua `zaptro-SEU_USER_ID` pelo nome gerado em `buildZaptroInstanceName(userId, companyId)`.

## 7. Validar tabela

No SQL Editor:

```sql
select * from public.whatsapp_connections order by updated_at desc limit 10;
```

Após connect/state, deve aparecer linha com `user_id`, `instance_name`, `status`, `connected`.
