import React from 'react';
import { LogtaAuthGate } from './components/LogtaAuthGate';
import AppChrome from './AppChrome';

/** Layout do painel — import direto evita tela infinita em "Carregando painel…" no dev local. */
export function AuthenticatedShell() {
  return (
    <LogtaAuthGate>
      <AppChrome />
    </LogtaAuthGate>
  );
}
