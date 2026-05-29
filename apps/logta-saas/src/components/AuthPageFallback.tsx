import React from 'react';

type Props = { message?: string };

/** Tela leve enquanto /login e rotas públicas carregam (evita página em branco). */
export function AuthPageFallback({ message = 'Carregando…' }: Props) {
  return (
    <div
      className="logta-auth-page flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-white px-6 font-sans"
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[#2563EB]" />
      <p className="text-sm font-semibold text-gray-600">{message}</p>
      <p className="max-w-xs text-center text-xs text-gray-400">
        Se demorar, confira se o terminal está com <code className="font-mono">npm run dev</code> rodando.
      </p>
    </div>
  );
}
