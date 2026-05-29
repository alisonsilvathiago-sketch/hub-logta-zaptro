#!/bin/bash
# Sobe Logta, Zaptro e Hub em localhost (mantenha este terminal aberto).
set -euo pipefail

export PATH="$HOME/.local/node/bin:$HOME/.volta/bin:$HOME/.asdf/shims:/opt/homebrew/bin:/usr/local/bin:$PATH"
if [[ -f "$HOME/.zshrc" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/.zshrc" 2>/dev/null || true
fi
ROOT="$(cd "$(dirname "$0")" && pwd)"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm não encontrado. Instale Node.js ou rode no terminal: source ~/.zshrc"
  exit 1
fi

ensure_env() {
  local app_dir="$1"
  local example="$app_dir/.env.example"
  local env_file="$app_dir/.env"
  if [[ -f "$example" && ! -f "$env_file" ]]; then
    cp "$example" "$env_file"
    echo "→ Criado $env_file a partir de .env.example"
  fi
}

ensure_zaptro_local() {
  local example="$ROOT/apps/zaptro/.env.example"
  local local_env="$ROOT/apps/zaptro/.env.local"
  if [[ -f "$example" && ! -f "$local_env" ]]; then
    cp "$example" "$local_env"
    echo "→ Criado apps/zaptro/.env.local (localhost:5174)"
  fi
}

ensure_hub_local() {
  local example="$ROOT/hub/.env.example"
  local local_env="$ROOT/hub/.env.local"
  if [[ -f "$example" && ! -f "$local_env" ]]; then
    cp "$example" "$local_env"
    echo "→ Criado hub/.env.local (URLs localhost)"
  fi
}

port_busy() {
  lsof -ti ":$1" >/dev/null 2>&1
}

wait_url() {
  local url="$1"
  local i
  for i in $(seq 1 40); do
    if curl -sf -o /dev/null --max-time 2 "$url" 2>/dev/null; then
      return 0
    fi
    sleep 0.5
  done
  return 1
}

start_if_down() {
  local name="$1"
  local dir="$2"
  local port="$3"
  local url="$4"
  local log="$ROOT/.local-dev-logs/${name}.log"

  mkdir -p "$ROOT/.local-dev-logs"

  if curl -sf -o /dev/null --max-time 2 "$url" 2>/dev/null; then
    echo "✓ $name → $url"
    return
  fi

  if port_busy "$port"; then
    echo "⚠ Porta $port ocupada; limpando..."
    lsof -ti ":$port" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi

  echo "▶ Iniciando $name (porta $port)..."
  (cd "$dir" && npm run dev >"$log" 2>&1) &
  if wait_url "$url"; then
    echo "✓ $name → $url"
  else
    echo "✗ $name não respondeu em $url (veja $log)"
  fi
}

ensure_env "$ROOT/apps/logta-saas"
ensure_env "$ROOT/apps/logstoka"
ensure_env "$ROOT/apps/logstoka/server"
ensure_zaptro_local
ensure_hub_local

echo ""
echo "=== Localhost — hub-logta-zaptro ==="
echo ""

start_if_down "logta-saas" "$ROOT/apps/logta-saas" 5173 "http://localhost:5173/login"
start_if_down "zaptro" "$ROOT/apps/zaptro" 5174 "http://localhost:5174/"
start_if_down "hub" "$ROOT/hub" 5175 "http://localhost:5175/"
start_if_down "logstoka" "$ROOT/apps/logstoka" 5177 "http://localhost:5177/vendas"

echo ""
echo "Abra no navegador:"
echo "  Logta (login): http://localhost:5173/login"
echo "  Zaptro:        http://localhost:5174/"
echo "  Zaptro QR:     http://localhost:5174/app/configuracoes?tab=config"
echo "  Hub Master:    http://localhost:5175/"
echo "  LogStoka:      http://localhost:5177/vendas"
echo ""
echo "Logs: $ROOT/.local-dev-logs/"
echo "Para parar: pkill -f 'vite --host localhost' || feche os processos nas portas 5173–5177"
echo ""
