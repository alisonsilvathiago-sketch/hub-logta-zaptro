#!/bin/bash
# Sobe o Zaptro em http://localhost:5174 (mantenha este terminal aberto).
export PATH="$HOME/.local/node/bin:$HOME/.volta/bin:$HOME/.asdf/shims:/opt/homebrew/bin:/usr/local/bin:$PATH"
if [[ -f "$HOME/.zshrc" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/.zshrc" 2>/dev/null || true
fi
cd "$(dirname "$0")"

if [[ -f .env.example && ! -f .env.local ]]; then
  cp .env.example .env.local
  echo "→ Criado .env.local — complete VITE_SUPABASE_ANON_KEY e VITE_EVOLUTION_API_KEY"
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm não encontrado."
  echo "Na raiz do repo: ./instalar-node.sh && source ~/.zshrc"
  exit 1
fi

BASE="http://localhost:5174"
URL="${BASE}/"
if curl -sf -o /dev/null --max-time 2 "$URL" 2>/dev/null; then
  echo "Zaptro já está rodando → $URL"
  echo "  App:        ${BASE}/app"
  echo "  WhatsApp QR: ${BASE}/app/configuracoes?tab=config"
  echo "  Conversas:  ${BASE}/app/conversas"
  exit 0
fi

if lsof -ti :5174 >/dev/null 2>&1; then
  lsof -ti :5174 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo "→ Vendas:     $URL"
echo "→ WhatsApp QR: ${BASE}/app/configuracoes?tab=config"
echo "→ App:        ${BASE}/app"
echo "→ Conversas:  ${BASE}/app/conversas"
echo ""
echo "Supabase (painel): Authentication → URL Configuration"
echo "  Site URL: http://localhost:5174"
echo "  Redirect: http://localhost:5174/**"
echo ""
echo "Evolution GO (proxy): curl -s ${BASE}/evolution-api/instance/qr -H \"instance: zaptro\" -H \"apikey: \$VITE_EVOLUTION_API_KEY\""
exec npm run dev
