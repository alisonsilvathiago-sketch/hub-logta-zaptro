#!/usr/bin/env bash
# Configura Secrets + deploy da Edge Function evolution-api (projeto Zaptro).
#
# Pré-requisitos:
#   1. Rotacionar GLOBAL_API_KEY na VPS Evolution (/opt/evolution-go/.env) — NÃO reutilize chave exposta.
#   2. supabase login
#   3. Criar arquivo (recomendado — evita erro de aspas no terminal):
#        cp apps/zaptro/supabase/secrets.evolution.env.example apps/zaptro/supabase/secrets.evolution.env
#        # edite secrets.evolution.env — use EVOLUTION_API_KEY (não GLOBAL_API_KEY)
#
# Uso:
#   bash apps/zaptro/scripts/supabase-evolution-setup.sh
#   bash apps/zaptro/scripts/supabase-evolution-setup.sh --env-file apps/zaptro/supabase/secrets.evolution.env

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-rrjnkmgkhbtapumgmhhr}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Instale o CLI: https://supabase.com/docs/guides/cli"
  exit 1
fi

ENV_FILE="${1:-}"
if [[ "$ENV_FILE" == "--env-file" ]]; then
  ENV_FILE="${2:-}"
fi
if [[ -z "$ENV_FILE" ]]; then
  ENV_FILE="${ROOT}/supabase/secrets.evolution.env"
fi

echo "→ Secrets no projeto ${PROJECT_REF}…"
if [[ -f "$ENV_FILE" ]]; then
  if grep -q '^GLOBAL_API_KEY=' "$ENV_FILE" 2>/dev/null; then
    echo "Erro: em $ENV_FILE use EVOLUTION_API_KEY= (não GLOBAL_API_KEY=)."
    exit 1
  fi
  supabase secrets set --env-file "$ENV_FILE" --project-ref "$PROJECT_REF"
else
  if [[ -z "${EVOLUTION_API_KEY:-}" ]]; then
    echo "Crie $ROOT/supabase/secrets.evolution.env ou export EVOLUTION_API_KEY."
    exit 1
  fi
  EVOLUTION_API_URL="${EVOLUTION_API_URL:-https://evolution.zaptro.com.br}"
  EVOLUTION_INSTANCE="${EVOLUTION_INSTANCE:-zaptro}"
  supabase secrets set --project-ref "$PROJECT_REF" \
    "EVOLUTION_API_URL=${EVOLUTION_API_URL}" \
    "EVOLUTION_API_KEY=${EVOLUTION_API_KEY}" \
    "EVOLUTION_INSTANCE=${EVOLUTION_INSTANCE}"
fi

echo "→ Lista de secrets (nomes apenas):"
supabase secrets list --project-ref "$PROJECT_REF"

echo "→ Deploy evolution-api…"
supabase functions deploy evolution-api \
  --project-ref "$PROJECT_REF" \
  --workdir "$ROOT"

echo ""
echo "Pronto. Teste com JWT de utilizador logado:"
echo "  curl -s \"https://${PROJECT_REF}.supabase.co/functions/v1/evolution-api/instance/connectionState\" \\"
echo "    -H \"Authorization: Bearer \$USER_JWT\" -H \"apikey: \$ANON_KEY\""
