#!/usr/bin/env bash
# Configura inbox wa-link: tenta deploy Edge; senão webhook local + localtunnel.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="${SUPABASE_PROJECT_REF:-rrjnkmgkhbtapumgmhhr}"
ENV_LOCAL="${ROOT}/.env.local"
SERVER_ENV="${ROOT}/server/.env.local"
LT_LOG="/tmp/zaptro-lt.log"
WH_LOG="/tmp/zaptro-wa-webhook.log"
PID_FILE="/tmp/zaptro-wa-inbox.pids"

if [[ -f "$SERVER_ENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  source <(grep -E '^(SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|WA_LINK_DEFAULT_COMPANY_ID|EVOLUTION_INSTANCE)=' "$SERVER_ENV" | sed 's/\r$//')
  set +a
fi

try_edge_deploy() {
  # shellcheck source=/dev/null
  source "${ROOT}/scripts/supabase-cli-auth.sh" 2>/dev/null || true
  echo "→ Deploy evolution-api (melhor opção — webhook na cloud)…"
  bash "${ROOT}/scripts/set-evolution-secrets.sh" || true
  bash "${ROOT}/scripts/deploy-evolution-edge.sh"
}

set_env_webhook_url() {
  local url="$1"
  if [[ ! -f "$ENV_LOCAL" ]]; then
    echo "VITE_WA_LINK_WEBHOOK_URL=$url" >> "$ENV_LOCAL"
    return
  fi
  if grep -q '^VITE_WA_LINK_WEBHOOK_URL=' "$ENV_LOCAL"; then
    sed -i.bak "s|^VITE_WA_LINK_WEBHOOK_URL=.*|VITE_WA_LINK_WEBHOOK_URL=$url|" "$ENV_LOCAL"
    rm -f "${ENV_LOCAL}.bak"
  else
    echo "VITE_WA_LINK_WEBHOOK_URL=$url" >> "$ENV_LOCAL"
  fi
}

register_evolution_webhook() {
  local webhook_url="$1"
  local evo_url inst token
  evo_url="$(grep -E '^VITE_EVOLUTION_API_URL=' "$ENV_LOCAL" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  token="$(grep -E '^VITE_EVOLUTION_INSTANCE_API_KEY=' "$ENV_LOCAL" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  inst="$(grep -E '^VITE_EVOLUTION_INSTANCE=' "$ENV_LOCAL" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  inst="${inst:-zaptro}"
  echo "→ Evolution: POST /instance/connect webhook=$webhook_url"
  curl -s -X POST "${evo_url%/}/instance/connect" \
    -H 'Content-Type: application/json' \
    -H "apikey: $token" \
    -H "instance: $inst" \
    -d "{\"number\":\"\",\"webhookUrl\":\"$webhook_url\",\"subscribe\":[\"ALL\"]}"
  echo ""
}

setup_local_tunnel() {
  echo "→ Sem token Supabase — modo dev: servidor webhook + localtunnel"
  pkill -f 'run-wa-webhook-server' 2>/dev/null || true
  pkill -f 'localtunnel --port 8787' 2>/dev/null || true
  sleep 1

  cd "${ROOT}/server"
  # Usa API mail completa (já tem rota evolution-wa); wa:webhook mínimo falha sem express no path certo
  if ! curl -sf "http://127.0.0.1:8787/v1/webhooks/evolution-wa/health" >/dev/null 2>&1; then
    nohup npx tsx --env-file=.env.local src/index.ts > "$WH_LOG" 2>&1 &
    echo $! >> "$PID_FILE"
    sleep 6
  fi
  if ! curl -sf "http://127.0.0.1:8787/v1/webhooks/evolution-wa/health" >/dev/null; then
    echo "⚠️  Servidor webhook não arrancou. Ver: $WH_LOG"
    cat "$WH_LOG" | tail -20
    exit 1
  fi

  cd "$ROOT"
  nohup npx --yes localtunnel --port 8787 > "$LT_LOG" 2>&1 &
  echo $! >> "$PID_FILE"

  local public_url=""
  for _ in $(seq 1 30); do
    public_url="$(grep -oE 'https://[a-z0-9-]+\.loca\.lt' "$LT_LOG" 2>/dev/null | head -1 || true)"
    [[ -n "$public_url" ]] && break
    sleep 1
  done
  if [[ -z "$public_url" ]]; then
    echo "⚠️  localtunnel sem URL. Ver: $LT_LOG"
    exit 1
  fi

  local webhook_url="${public_url}/v1/webhooks/evolution-wa"
  echo "→ URL pública: $webhook_url"
  set_env_webhook_url "$webhook_url"
  register_evolution_webhook "$webhook_url"

  echo ""
  echo "✓ Inbox activo (modo dev)."
  echo "  Mantenha este Mac ligado com:"
  echo "    - servidor webhook (porta 8787)"
  echo "    - localtunnel"
  echo "  Reinicie: npm run dev --prefix apps/zaptro"
  echo "  PIDs em $PID_FILE | logs: $WH_LOG $LT_LOG"
}

if try_edge_deploy 2>/dev/null; then
  WEBHOOK="https://${PROJECT_REF}.supabase.co/functions/v1/evolution-webhook"
  set_env_webhook_url "$WEBHOOK"
  register_evolution_webhook "$WEBHOOK"
  echo "✓ Deploy Edge concluído. Webhook (inbox): $WEBHOOK"
  echo "  Confirme: curl -s -w '%{http_code}' -X POST $WEBHOOK -H 'Content-Type: application/json' -d '{\"event\":\"Message\",\"instance\":\"zaptro\"}'"
  exit 0
fi

setup_local_tunnel
