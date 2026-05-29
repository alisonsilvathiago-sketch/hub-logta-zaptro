# Deploy evolution-api — checklist

Projeto Supabase: `rrjnkmgkhbtapumgmhhr`

## Desenvolvimento local (localhost:5174)

- App: `npm run dev` ou `./iniciar-local.sh` → http://localhost:5174
- Guia completo: `apps/zaptro/LOCALHOST.md`
- No painel Supabase → **Authentication → URL Configuration**:
  - Site URL: `http://localhost:5174`
  - Redirect URLs: `http://localhost:5174/**`
- Webhook Evolution **permanece na URL cloud** (Edge), não em localhost.

## 1. Secrets obrigatórios

| Secret | Valor (Zaptro) |
|--------|----------------|
| `EVOLUTION_API_URL` | `https://evolution.zaptro.com.br` |
| `EVOLUTION_API_KEY` | mesma `VITE_EVOLUTION_API_KEY` do `.env.local` (GLOBAL_API_KEY do manager) |
| `EVOLUTION_INSTANCE` | `zaptro` |
| `EVOLUTION_API_MODE` | `go` |
| `SUPABASE_SERVICE_ROLE_KEY` | **obrigatório** — Supabase → Settings → API → `service_role` (webhook grava mensagens) |

Opcional: `EVOLUTION_INSTANCE_API_KEY`, `EVOLUTION_WEBHOOK_SECRET`

Ficheiro local (gitignored): `apps/zaptro/supabase/secrets.evolution.env`

### Aplicar no Supabase

```bash
npx supabase login

# 1) Edite secrets.evolution.env e acrescente SUPABASE_SERVICE_ROLE_KEY=
# 2) Depois:
bash apps/zaptro/scripts/set-evolution-secrets.sh
```

Ou manual:

```bash
supabase secrets set --env-file apps/zaptro/supabase/secrets.evolution.env --project-ref rrjnkmgkhbtapumgmhhr
supabase secrets list --project-ref rrjnkmgkhbtapumgmhhr
```

## 2. Deploy da função (obrigatório para mensagens no inbox)

**Só o webhook (comando que o Supabase pediu):**

```bash
cd /Volumes/PODCAST/PROJETOS/hub-logta-zaptro
npx supabase login
bash apps/zaptro/scripts/deploy-evolution-webhook-only.sh
```

Ou manualmente:

```bash
npx supabase functions deploy evolution-webhook \
  --project-ref rrjnkmgkhbtapumgmhhr \
  --workdir apps/zaptro \
  --no-verify-jwt
```

`apps/zaptro/supabase/config.toml` já tem `[functions.evolution-webhook] verify_jwt = false` — o flag `--no-verify-jwt` no deploy é obrigatório para o dashboard não voltar a ON.

## 2b. Deploy completo (evolution-api + evolution-webhook)

A função antiga em produção (`evolution-api-proxy`) **não tem** `POST /webhook` — por isso as mensagens não chegam ao Supabase.

```bash
bash apps/zaptro/scripts/deploy-evolution-edge.sh
```

Isto publica `supabase/functions/evolution-api/index.ts` com `POST /webhook` e `--no-verify-jwt`.

**Alternativa em dev (sem deploy):** webhook no servidor Node + ngrok — ver `scripts/fix-wa-inbox-webhook.sh`.

## 3. Testar endpoints

### Diagnóstico (sem login)

```bash
curl -s 'https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/evolution-api/health' | jq .
```

Esperado: `"ok": true`, `secrets.EVOLUTION_API_URL: true`, `evolutionReachable: true`

### Webhook (Evolution → Supabase) — use **evolution-webhook**

URL na Evolution GO:

`https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/evolution-webhook`

```bash
curl -s -w '\nHTTP %{http_code}\n' -X POST \
  'https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/evolution-webhook' \
  -H 'Content-Type: application/json' \
  -d '{"event":"Message","instance":"zaptro","data":{"Info":{"Chat":"557499879409@s.whatsapp.net","IsFromMe":false,"ID":"t1"},"Message":{"conversation":"teste"}}}'
```

Esperado: **HTTP 200** e `"processed":1` (não 401). A função no dashboard deve ter **Verify JWT = OFF**.

A versão criada pelo assistente Supabase só grava `webhook_events` — o código em `supabase/functions/evolution-webhook/index.ts` grava o **inbox** (`whatsapp_conversations` / `whatsapp_messages`).

### Estado + QR (com JWT anon do front)

```bash
ANON='sua_anon_key'
curl -s "https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/evolution-api/instance/connectionState/zaptro" \
  -H "Authorization: Bearer $ANON" -H "apikey: $ANON"
```

## 4. Se voltar 500

O JSON agora inclui:

- `missingSecrets` — o que falta no Supabase
- `secrets` — booleans (sem expor valores)
- `evolutionReachable` — se a VPS responde

Logs:

```bash
npx supabase functions logs evolution-api --project-ref rrjnkmgkhbtapumgmhhr
```
