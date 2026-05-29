# Zaptro — desenvolvimento local

## Subir o projeto

```bash
cd apps/zaptro
cp .env.example .env.local   # se ainda não tiver
# complete VITE_SUPABASE_ANON_KEY e VITE_EVOLUTION_API_KEY em .env.local
npm run dev
# ou
./iniciar-local.sh
```

App: **http://localhost:5174**

| Rota | Uso |
|------|-----|
| `/` | Landing vendas |
| `/app` | Dashboard |
| `/app/configuracoes?tab=config` | QR WhatsApp (Configuração) |
| `/app/conversas` | Inbox (fila, IA, KPIs, transferência) |

## Fase 3 — wa-link em localhost

| Funcionalidade | Como testar |
|----------------|-------------|
| CRM no prompt da IA | Abra a conversa no inbox (sync `metadata.crm_context`) |
| Fila IA | Filtro **Fila IA** ou peça transferência humana no WhatsApp |
| KPIs da fila | Barra acima da lista em `/app/conversas` |
| Transferir departamento | Menu ⋮ da conversa → **Transferir departamento** |
| Auto-login dev | `VITE_WA_LINK_DEV_AUTO_LOGIN=true` no `.env.local` |

O webhook Evolution **não** chama `localhost` — mensagens entram via Supabase cloud (`evolution-webhook`). O browser usa só `http://localhost:5174`.

## Variáveis (`.env.local`)

| Variável | Localhost |
|----------|-----------|
| `VITE_APP_URL` | `http://localhost:5174` |
| `VITE_PORT` | `5174` |
| `VITE_SUPABASE_URL` | `https://rrjnkmgkhbtapumgmhhr.supabase.co` |
| `VITE_EVOLUTION_BASE_URL` | `/evolution-api` (proxy Vite) |
| `VITE_EVOLUTION_API_URL` | `https://evolution.zaptro.com.br` |
| `VITE_EVOLUTION_USE_EDGE` | `false` (QR via proxy local — recomendado em dev) |
| `VITE_WA_LINK_DEV_AUTO_LOGIN` | `true` (login automático em `/app/conversas`) |
| `VITE_WA_LINK_DEFAULT_COMPANY_ID` | UUID da empresa dev no Supabase |
| `VITE_WA_LINK_WEBHOOK_URL` | URL cloud do `evolution-webhook` (não localhost) |

### Dev — login automático (opcional)

```env
VITE_DEV_REGISTER_EMAIL=seu@email.com
VITE_DEV_REGISTER_PASSWORD=123456
VITE_WA_LINK_DEV_AUTO_LOGIN=true
```

### Ollama (IA — VPS ou Mac local)

| Variável | Valor |
|----------|--------|
| `VITE_OLLAMA_ENABLED` | `true` |
| `VITE_OLLAMA_MODEL` | `llama3.2` |
| `VITE_OLLAMA_BASE_URL` | `/ollama-api` |
| `OLLAMA_PROXY_TARGET` | `http://108.174.151.98:11434` (VPS) |
| | ou `http://127.0.0.1:11434` (Ollama no Mac) |

Detalhes: `OLLAMA_SETUP.md`. Teste: `curl http://localhost:5174/ollama-api/api/tags`

O ficheiro `.env.development` traz os defaults de localhost; o `.env.local` sobrescreve com as chaves.

## Supabase (painel — faça ao arrumar o projeto)

Projeto: `rrjnkmgkhbtapumgmhhr`

**Authentication → URL Configuration**

- Site URL: `http://localhost:5174`
- Redirect URLs: `http://localhost:5174/**`

**Edge Functions → Secrets** (produção/cloud — não é Supabase local):

Ver `supabase/DEPLOY_EVOLUTION.md` — webhook da Evolution continua a apontar para:

`https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/evolution-webhook`

(O Evolution na VPS não consegue chamar `localhost`; só o browser usa localhost.)

## Testes rápidos

```bash
# App no ar
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5174/

# Proxy Evolution (precisa VITE_EVOLUTION_API_KEY no .env.local)
curl -s http://localhost:5174/evolution-api/instance/status \
  -H "instance: zaptro" \
  -H "apikey: SUA_KEY"

curl -s http://localhost:5174/evolution-api/instance/qr \
  -H "instance: zaptro" \
  -H "apikey: SUA_KEY"
```
