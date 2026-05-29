/** URL pública do app LOGTA (SaaS). Hub publica políticas via /hub-bridge. */
export function getLogtaAppOrigin(): string {
  const raw =
    (import.meta.env.VITE_LOGTA_APP_URL as string | undefined) ||
    (import.meta.env.VITE_LOGTA_SAAS_URL as string | undefined) ||
    'http://localhost:5173';
  return raw.replace(/\/$/, '');
}
