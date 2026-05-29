#!/usr/bin/env bash
# Diagnóstico + registo do webhook Evolution para o inbox wa-link
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="${SUPABASE_PROJECT_REF:-rrjnkmgkhbtapumgmhhr}"
INSTANCE="${EVOLUTION_INSTANCE:-zaptro}"
ENV_LOCAL="${ROOT}/.env.local"

read_env() {
  local key="$1"
  if [[ -f "$ENV_LOCAL" ]]; then
    grep -E "^${key}=" "$ENV_LOCAL" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'"
  fi
}

EVO_URL="$(read_env VITE_EVOLUTION_API_URL)"
EVO_TOKEN="$(read_env VITE_EVOLUTION_INSTANCE_API_KEY)"
WEBHOOK_URL="$(read_env VITE_WA_LINK_WEBHOOK_URL)"
if [[ -z "$WEBHOOK_URL" ]]; then
  WEBHOOK_URL="$(read_env VITE_EVOLUTION_WEBHOOK_URL)"
fi
if [[ -z "$WEBHOOK_URL" ]]; then
  WEBHOOK_URL="https://${PROJECT_REF}.supabase.co/functions/v1/evolution-webhook"
fi

echo "→ Webhook alvo: $WEBHOOK_URL"
if [[ "$WEBHOOK_URL" == *evolution.zaptro.com.br* ]] && [[ "$WEBHOOK_URL" != *supabase.co* ]]; then
  echo "❌ URL errada: use o webhook Supabase, NÃO o manager https://evolution.zaptro.com.br/"
  echo "   Correto: https://${PROJECT_REF}.supabase.co/functions/v1/evolution-webhook"
  exit 1
fi
echo "→ Instância: $INSTANCE"

echo ""
echo "→ Teste POST no webhook (sem JWT)…"
code=$(curl -s -o /tmp/wa-wh.json -w '%{http_code}' -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{"event":"Message","instance":"'"$INSTANCE"'","data":{"Info":{"Chat":"5511999887766@s.whatsapp.net","IsFromMe":false,"ID":"diag-1"},"Message":{"conversation":"diag webhook"}}}')
echo "HTTP $code"
cat /tmp/wa-wh.json
echo ""

if [[ "$code" == "401" ]] && [[ "$WEBHOOK_URL" == *supabase.co/functions* ]]; then
  echo ""
  echo "⚠️  A Edge evolution-api no Supabase exige JWT OU a rota /webhook não existe (versão antiga)."
  echo "   Solução A — deploy:"
  echo "     npx supabase login"
  echo "     bash apps/zaptro/scripts/deploy-evolution-edge.sh"
  echo ""
  echo "   Solução B — webhook no servidor local (ngrok):"
  echo "     1) npm run dev --prefix apps/zaptro/server"
  echo "     2) ngrok http 8787"
  echo "     3) No .env.local:"
  echo "        VITE_WA_LINK_WEBHOOK_URL=https://SEU-ID.ngrok-free.app/v1/webhooks/evolution-wa"
  echo "     4) Rode este script de novo"
  exit 1
fi

if [[ "$code" != "200" && "$code" != "201" ]]; then
  echo "⚠️  Webhook não respondeu 2xx. Corrija antes de registar na Evolution."
  exit 1
fi

if [[ -z "$EVO_URL" || -z "$EVO_TOKEN" ]]; then
  echo "⚠️  Falta VITE_EVOLUTION_API_URL ou VITE_EVOLUTION_INSTANCE_API_KEY no .env.local"
  exit 1
fi

echo ""
echo "→ Registar webhook na Evolution GO…"
curl -s -X POST "${EVO_URL%/}/instance/connect" \
  -H 'Content-Type: application/json' \
  -H "apikey: $EVO_TOKEN" \
  -H "instance: $INSTANCE" \
  -d "{\"number\":\"\",\"webhookUrl\":\"$WEBHOOK_URL\",\"subscribe\":[\"ALL\"]}"
echo ""
echo "✓ Feito. Envie uma mensagem de outro telefone e actualize /app/conversas"
