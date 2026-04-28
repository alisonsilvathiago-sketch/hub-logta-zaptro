/** Origem do site em dev (.env.development → http://localhost:5173); em prod usa o browser. */
export function getSiteOrigin(): string {
  const fromEnv = (import.meta.env.VITE_SITE_ORIGIN as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}
