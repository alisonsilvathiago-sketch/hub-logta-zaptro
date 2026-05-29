import { isZaptroLocalhost } from './appOrigin';

/** Pré-visualização com dados de exemplo e bypass de bloqueios em dev/local. */
export function isZaptroPreviewDataEnabled(): boolean {
  const forcedOff = String(import.meta.env.VITE_ZAPTRO_PREVIEW_DATA ?? '').trim() === 'false';
  if (forcedOff) return false;
  if (String(import.meta.env.VITE_ZAPTRO_PREVIEW_DATA ?? '').trim() === 'true') return true;
  if (import.meta.env.DEV) return true;
  if (isZaptroLocalhost()) return true;
  return false;
}

export function isZaptroHubGuardBypassed(): boolean {
  return isZaptroPreviewDataEnabled();
}
