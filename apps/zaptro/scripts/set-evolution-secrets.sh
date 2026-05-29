#!/usr/bin/env bash
# Aplica secrets Evolution no Supabase a partir de .env.local ou secrets.evolution.env
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="${SUPABASE_PROJECT_REF:-rrjnkmgkhbtapumgmhhr}"
ENV_LOCAL="${ROOT}/.env.local"
SECRETS_FILE="${ROOT}/supabase/secrets.evolution.env"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]] && [[ -f "${ROOT}/supabase/.access-token" ]]; then
  export SUPABASE_ACCESS_TOKEN="$(tr -d '[:space:]' < "${ROOT}/supabase/.access-token")"
fi

write_secrets_from_env_local() {
  local url key inst mode
  url="$(grep -E '^VITE_EVOLUTION_API_URL=' "$ENV_LOCAL" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  key="$(grep -E '^VITE_EVOLUTION_API_KEY=' "$ENV_LOCAL" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  inst="$(grep -E '^VITE_EVOLUTION_INSTANCE=' "$ENV_LOCAL" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  mode="$(grep -E '^VITE_EVOLUTION_API_MODE=' "$ENV_LOCAL" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  [[ -z "$url" || -z "$key" ]] && return 1
  local svc="" cid=""
  if grep -qE '^SUPABASE_SERVICE_ROLE_KEY=' "$SECRETS_FILE" 2>/dev/null; then
    svc="$(grep -E '^SUPABASE_SERVICE_ROLE_KEY=' "$SECRETS_FILE" | cut -d= -f2-)"
  fi
  cid="$(grep -E '^VITE_WA_LINK_DEFAULT_COMPANY_ID=' "$ENV_LOCAL" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  cat > "$SECRETS_FILE" <<EOF
EVOLUTION_API_URL=${url}
EVOLUTION_API_KEY=${key}
EVOLUTION_INSTANCE=${inst:-zaptro}
EVOLUTION_API_MODE=${mode:-go}
EOF
  if [[ -n "$cid" ]]; then
    echo "WA_LINK_DEFAULT_COMPANY_ID=${cid}" >> "$SECRETS_FILE"
  fi
  if [[ -n "$svc" ]]; then
    echo "SUPABASE_SERVICE_ROLE_KEY=${svc}" >> "$SECRETS_FILE"
  fi
  if ! grep -qE '^SUPABASE_SERVICE_ROLE_KEY=' "$SECRETS_FILE" 2>/dev/null; then
    echo "# Acrescente: SUPABASE_SERVICE_ROLE_KEY=... (painel Supabase → API)" >> "$SECRETS_FILE"
    echo "⚠️  Falta SUPABASE_SERVICE_ROLE_KEY em secrets.evolution.env — webhook não grava mensagens sem isto."
  fi
  echo "→ Gerado ${SECRETS_FILE} a partir de .env.local"
  return 0
}

if [[ ! -f "$SECRETS_FILE" ]]; then
  if [[ -f "$ENV_LOCAL" ]] && write_secrets_from_env_local; then
    :
  else
    echo "Crie ${SECRETS_FILE} (veja secrets.evolution.env.example)"
    exit 1
  fi
fi

echo "→ Aplicar secrets no projeto ${PROJECT_REF}…"
npx --yes supabase@2.101.0 secrets set --env-file "$SECRETS_FILE" --project-ref "$PROJECT_REF"

echo ""
echo "→ Secrets (nomes apenas):"
npx --yes supabase@2.101.0 secrets list --project-ref "$PROJECT_REF"

echo ""
echo "Próximo passo: bash apps/zaptro/scripts/deploy-evolution-edge.sh"
