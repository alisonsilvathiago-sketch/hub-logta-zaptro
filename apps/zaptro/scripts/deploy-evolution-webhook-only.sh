#!/usr/bin/env bash
# Deploy evolution-webhook com JWT desligado (Evolution não envia Authorization).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="${SUPABASE_PROJECT_REF:-rrjnkmgkhbtapumgmhhr}"

# shellcheck source=/dev/null
source "${ROOT}/scripts/supabase-cli-auth.sh" 2>/dev/null || true
if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "→ Sem .access-token — a usar sessão do 'npx supabase login' (normal após login)."
fi

cd "$(dirname "$ROOT")/.." 2>/dev/null || cd "$ROOT/../.."

echo "→ Secrets (WA_LINK_DEFAULT_COMPANY_ID + Evolution)…"
bash "${ROOT}/scripts/set-evolution-secrets.sh" || echo "⚠️  set-evolution-secrets falhou — confira secrets.evolution.env"

echo ""
echo "→ Deploy evolution-webhook (--no-verify-jwt)…"
npx --yes supabase@2.101.0 functions deploy evolution-webhook \
  --project-ref "$PROJECT_REF" \
  --workdir apps/zaptro \
  --no-verify-jwt

echo ""
echo "→ Teste POST (esperado HTTP 200 e processed:1, não 'sem empresa'):"
curl -s -o /tmp/evo-wh.json -w "HTTP %{http_code}\n" -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/evolution-webhook" \
  -H "Content-Type: application/json" \
  -d '{"event":"Message","instance":"zaptro","data":{"Info":{"Chat":"5511999887766@s.whatsapp.net","IsFromMe":false,"ID":"deploy-check"},"Message":{"conversation":"deploy ok"}}}'
cat /tmp/evo-wh.json
echo ""

echo "→ Registar webhook na Evolution…"
bash "${ROOT}/scripts/fix-wa-inbox-webhook.sh"

echo ""
echo "✓ Remova VITE_WA_LINK_WEBHOOK_URL=...loca.lt do apps/zaptro/.env.local se existir."
echo "✓ Reinicie: npm run dev --prefix apps/zaptro"
