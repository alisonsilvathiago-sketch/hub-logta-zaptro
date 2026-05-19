/** Origem do app Logta SaaS (este frontend). */
export function getLogtaAppOrigin(): string {
  const raw = (import.meta.env.VITE_LOGTA_APP_URL as string | undefined) || 'http://localhost:5173';
  return raw.replace(/\/$/, '');
}

/** URL base com barra final opcional para rotas internas. */
export function getLogtaAppUrl(path = ''): string {
  const base = getLogtaAppOrigin();
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Origem do Zaptro (integração CRM/WhatsApp em dev local). */
export function getZaptroAppOrigin(): string {
  const raw = (import.meta.env.VITE_ZAPTRO_APP_URL as string | undefined) || 'http://localhost:5174';
  return raw.replace(/\/$/, '');
}
