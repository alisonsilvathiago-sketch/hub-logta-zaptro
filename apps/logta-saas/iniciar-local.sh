#!/bin/bash
# Sobe o Logta SaaS em http://localhost:5173 (login: /login)
export PATH="$HOME/.local/node/bin:$HOME/.volta/bin:$HOME/.asdf/shims:/opt/homebrew/bin:/usr/local/bin:$PATH"
if [[ -f "$HOME/.zshrc" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/.zshrc" 2>/dev/null || true
fi
cd "$(dirname "$0")"
if ! command -v npm >/dev/null 2>&1; then
  echo "npm não encontrado."
  echo "Na raiz do repo rode: ./instalar-node.sh"
  echo "Depois neste terminal: source ~/.zshrc"
  echo "Ou use: export PATH=\"\$HOME/.local/node/bin:\$PATH\""
  exit 1
fi

LOGIN_URL="http://localhost:5173/login"

# Se o Vite já responde, não mata o processo — evita "zsh: killed" ao rodar 2x
if curl -sf -o /dev/null --max-time 2 "$LOGIN_URL" 2>/dev/null; then
  echo "Servidor já está rodando."
  echo "→ $LOGIN_URL"
  echo "Deixe o outro terminal aberto. Para reiniciar: Ctrl+C nele e rode ./iniciar-local.sh de novo."
  exit 0
fi

if lsof -ti :5173 >/dev/null 2>&1; then
  echo "Limpando porta 5173 (processo travado)..."
  lsof -ti :5173 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo "→ $LOGIN_URL"
echo "Mantenha ESTE terminal aberto. Não feche nem rode kill na porta 5173."
exec npm run dev
