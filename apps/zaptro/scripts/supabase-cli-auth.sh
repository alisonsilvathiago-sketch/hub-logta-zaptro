#!/usr/bin/env bash
# Carrega token para scripts — ou usa sessão do `npx supabase login` (sem ficheiro).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOKEN_FILE="${ROOT}/supabase/.access-token"

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  export SUPABASE_ACCESS_TOKEN
  return 0 2>/dev/null || exit 0
fi

if [[ -f "$TOKEN_FILE" ]]; then
  export SUPABASE_ACCESS_TOKEN="$(tr -d '[:space:]' < "$TOKEN_FILE")"
  return 0 2>/dev/null || exit 0
fi

# Sessão global do CLI (após `npx supabase login`) — não exige .access-token
for global in \
  "${HOME}/.config/supabase/access-token" \
  "${HOME}/Library/Application Support/supabase/access-token"; do
  if [[ -f "$global" ]]; then
    export SUPABASE_ACCESS_TOKEN="$(tr -d '[:space:]' < "$global")"
    return 0 2>/dev/null || exit 0
  fi
done

# Sem token em env — deploy/list ainda pode funcionar com login do CLI
return 1 2>/dev/null || exit 1
