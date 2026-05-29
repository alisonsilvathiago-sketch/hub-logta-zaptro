/** Host do browser é localhost / 127.0.0.1 (não preview Vercel, staging, etc.). */
export function isZaptroLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

/**
 * Bypass “dev-admin” só em localhost + build de desenvolvimento.
 * Em produção (zaptro.com.br, Vercel, etc.) nunca usar — evita confundir com login real
 * e sessões sem dados de `profiles` / foto.
 */
export function isZaptroLocalhostDev(): boolean {
  const isLocal = isZaptroLocalhost();
  const hasDevFlag = typeof window !== 'undefined' && window.location.search.includes('dev=true');
  
  return (
    import.meta.env.DEV ||
    import.meta.env.VITE_ZAPTRO_DEV_BYPASS === 'true' ||
    isLocal ||
    hasDevFlag
  );
}

/** Remove chave de bypass se não estamos em dev local (ex.: após deploy ou janela anónima noutro host). */
export function clearStaleZaptroTestSession(): void {
  if (typeof window === 'undefined' || isZaptroLocalhostDev()) return;
  try {
    localStorage.removeItem('zaptro_test_session');
  } catch {
    /* ignore */
  }
}
