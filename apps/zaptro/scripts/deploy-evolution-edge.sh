#!/usr/bin/env bash
# Deploy + validação da Edge Function evolution-api
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="${SUPABASE_PROJECT_REF:-rrjnkmgkhbtapumgmhhr}"
# shellcheck source=/dev/null
source "${ROOT}/scripts/supabase-cli-auth.sh" 2>/dev/null || true
if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "→ Sem .access-token — a usar sessão do 'npx supabase login'."
fi

cd "$(dirname "$ROOT")/.." 2>/dev/null || cd "$ROOT/../.."
REPO="$(pwd)"
cd "$REPO"

echo "→ Deploy evolution-api (proxy QR/status + webhook)…"
npx --yes supabase@2.101.0 functions deploy evolution-api \
  --project-ref "$PROJECT_REF" \
  --workdir apps/zaptro \
  --no-verify-jwt

echo ""
echo "→ Deploy evolution-webhook (só inbox, público sem JWT)…"
npx --yes supabase@2.101.0 functions deploy evolution-webhook \
  --project-ref "$PROJECT_REF" \
  --workdir apps/zaptro \
  --no-verify-jwt

echo ""
echo "→ Functions list:"
npx --yes supabase@2.101.0 functions list --project-ref "$PROJECT_REF"

ENV_LOCAL="${ROOT}/.env.local"
ANON=""
if [[ -f "$ENV_LOCAL" ]]; then
  ANON="$(grep -E '^VITE_SUPABASE_(ANON_KEY|PUBLISHABLE_KEY)=' "$ENV_LOCAL" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
fi

echo ""
echo "→ Webhook evolution-webhook (sem JWT; esperado HTTP 200 + processed>=0):"
curl -s -o /tmp/evo-webhook-test.json -w "HTTP %{http_code}\n" -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/evolution-webhook" \
  -H "Content-Type: application/json" \
  -d '{"event":"Message","instance":"zaptro","data":{"Info":{"Chat":"557499879409@s.whatsapp.net","IsFromMe":false,"ID":"smoke-1"},"Message":{"conversation":"smoke deploy"}}}'
head -c 500 /tmp/evo-webhook-test.json
echo ""

if [[ -n "$ANON" ]]; then
  echo ""
  echo "→ Smoke test autenticado (esperado: HTTP 404 com lista de rotas):"
  curl -s -o /tmp/evo-edge-test.json -w "HTTP %{http_code}\n" -X POST \
    "https://${PROJECT_REF}.supabase.co/functions/v1/evolution-api" \
    -H "Authorization: Bearer ${ANON}" \
    -H "apikey: ${ANON}" \
    -H "Content-Type: application/json" \
    -d '{"ping":"ok"}'
  head -c 400 /tmp/evo-edge-test.json
  echo ""
else
  echo "(Sem VITE_SUPABASE_ANON_KEY em .env.local — pule o curl autenticado)"
fi

echo ""
echo "→ Logs (Ctrl+C para sair):"
npx --yes supabase@2.101.0 functions logs evolution-api --project-ref "$PROJECT_REF"
