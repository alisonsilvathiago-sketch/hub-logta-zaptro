# Ollama — VPS Zaptro (VPS-15317843)

Configuração confirmada na VPS:

| Item | Valor |
|------|--------|
| Servidor | VPS-15317843 |
| SO | AlmaLinux 9.7 |
| Binário | `/usr/local/bin/ollama` |
| Serviço | `ollama.service` |
| Host | `OLLAMA_HOST=0.0.0.0:11434` |
| Modelo | `llama3.2:latest` |
| IP público | `108.174.151.98` |
| API (VPS local) | `http://localhost:11434` |
| API (externa) | `http://108.174.151.98:11434` |
| Teste | `http://108.174.151.98:11434/api/tags` |

## Zaptro local (Mac → VPS)

Em `apps/zaptro/.env.local`:

```env
VITE_OLLAMA_ENABLED=true
VITE_OLLAMA_MODEL=llama3.2
VITE_OLLAMA_BASE_URL=/ollama-api
OLLAMA_PROXY_TARGET=http://108.174.151.98:11434
```

Reinicie o dev server:

```bash
npm run dev --prefix apps/zaptro
```

Teste no browser (proxy Vite):

```bash
curl -s http://localhost:5174/ollama-api/api/tags
```

App: **http://localhost:5174/app** — copiloto e chatbot usam o **ZAPTRO AI MASTER** (Prompt Mestre Llama 3.2).

Configurar/editar: **Configurações → Chatbot** (`/app/configuracoes?tab=chatbot`).

## Comandos na VPS (SSH)

```bash
# IP público
curl ifconfig.me

# Serviço
systemctl status ollama
systemctl cat ollama

# Modelos
ollama list

# API local na VPS
curl http://localhost:11434/api/tags
```

## Firewall (porta 11434)

Se o Mac não alcançar a VPS, abra a porta no firewall:

```bash
sudo firewall-cmd --permanent --add-port=11434/tcp
sudo firewall-cmd --reload
```

## Hub / produção

O Hub já proxy `/api/ai` → `http://108.174.151.98:11434` (`hub/vercel.json`).

Config central: `hub/src/core/lib/ai/config/ollama.config.ts`.

## Backend (Evolution webhook + Supabase) — Fase 2 activa

O webhook `evolution-webhook` chama **Ollama (Llama 3.2)** com o **Prompt Mestre** (`companies.settings.zaptro_prompt_mestre`) e envia a resposta via **Evolution GO**.

Fluxo: mensagem inbound → Supabase → Ollama → Evolution → cliente WhatsApp.

### Secrets no Supabase (Edge Functions)

No painel **Project Settings → Edge Functions → Secrets** (projecto `rrjnkmgkhbtapumgmhhr`):

```env
OLLAMA_BASE_URL=http://108.174.151.98:11434
OLLAMA_MODEL=llama3.2
EVOLUTION_API_URL=https://evolution.zaptro.com.br
EVOLUTION_INSTANCE_API_KEY=<token da instância>
EVOLUTION_API_MODE=go
EVOLUTION_INSTANCE=zaptro
ZAPTRO_WA_AUTO_REPLY=true
```

A VPS Ollama deve aceitar ligações **da rede Supabase Edge** (firewall / IP allowlist).

### Deploy do webhook actualizado

```bash
cd apps/zaptro
npx supabase functions deploy evolution-webhook --project-ref rrjnkmgkhbtapumgmhhr --no-verify-jwt
```

### UI

**Configurações → Chatbot** — activar «Resposta automática no WhatsApp».

A IA **não responde** se um colaborador já assumiu a conversa (`assigned_to` / `in_service`).

## Fase 3 — CRM no contexto, escalação e fila

### Contexto CRM real no Ollama

Quando abres uma conversa no inbox, o frontend sincroniza orçamentos/rotas (localStorage CRM) para `whatsapp_conversations.metadata.crm_context`. O edge `runWaAutoReply` inclui esse bloco no system prompt.

Para a IA usar dados frescos: abra a conversa uma vez (ou aceite atendimento) para forçar sync.

### Escalação para humanos

- Se o Ollama falhar ou o envio Evolution falhar → conversa volta para `awaiting` com `metadata.ai_escalated_at`.
- Se o modelo incluir `[[TRANSFERIR_HUMANO]]` na resposta → cliente recebe a mensagem (sem o marcador) e a conversa entra na fila humana.
- O inbox mostra toast/desktop «IA pediu atendimento humano» via Realtime.
- Filtro **Fila IA** na lista de conversas.

### Transferência por departamento

Menu da conversa → **Transferir departamento** (ou botão na barra de contexto). Usa `whatsapp_departments` da empresa.

### KPIs da fila

Barra acima da lista: na fila, em atendimento, minhas, IA pediu humano, espera média.

Redeploy após alterações edge:

```bash
npx supabase functions deploy evolution-webhook --project-ref rrjnkmgkhbtapumgmhhr --no-verify-jwt
```

## Segurança

- Não exponha a porta 11434 à internet sem firewall restrito (IPs fixos ou VPN).
- Em produção, prefira proxy interno (Hub `/api/ai`) em vez de URL directa no browser.
