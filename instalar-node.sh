#!/bin/bash
# Instala Node.js + npm em ~/.local/node (macOS x64/arm64).
set -euo pipefail

NODE_VERSION="${NODE_VERSION:-v22.15.0}"
INSTALL_DIR="$HOME/.local/node"
ARCH="$(uname -m)"
case "$ARCH" in
  arm64) NODE_ARCH="darwin-arm64" ;;
  x86_64) NODE_ARCH="darwin-x64" ;;
  *) echo "Arquitetura não suportada: $ARCH"; exit 1 ;;
esac

TMP="/tmp/node-install-$$"
mkdir -p "$TMP"
echo "Baixando Node ${NODE_VERSION} (${NODE_ARCH})..."
curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-${NODE_ARCH}.tar.gz" -o "$TMP/node.tar.gz"
tar -xzf "$TMP/node.tar.gz" -C "$TMP"
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
mv "$TMP/node-${NODE_VERSION}-${NODE_ARCH}"/* "$INSTALL_DIR/"
rm -rf "$TMP"

ZSHRC="$HOME/.zshrc"
LINE='export PATH="$HOME/.local/node/bin:$PATH"'
if [[ ! -f "$ZSHRC" ]] || ! grep -Fq '.local/node/bin' "$ZSHRC" 2>/dev/null; then
  printf '\n# Node.js local (Logta / Zaptro dev)\n%s\n' "$LINE" >>"$ZSHRC"
  echo "→ Adicionado PATH em $ZSHRC"
fi

export PATH="$INSTALL_DIR/bin:$PATH"
echo "✓ Node $(node -v) | npm $(npm -v)"
echo "Rode: source ~/.zshrc"
echo "Depois: ./iniciar-localhost.sh  ou  cd apps/zaptro && npm run dev"
