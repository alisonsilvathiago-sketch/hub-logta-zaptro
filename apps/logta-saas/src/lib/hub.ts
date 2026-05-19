/** Origem do app Hub (painel master). Configure `VITE_LOGTA_HUB_URL` ou `VITE_HUB_URL`. */
export function getHubOrigin(): string {
  const raw =
    (import.meta.env.VITE_LOGTA_HUB_URL as string | undefined) ||
    (import.meta.env.VITE_HUB_URL as string | undefined) ||
    'http://localhost:5175';
  return raw.replace(/\/$/, '');
}

/** Rota raiz do painel master no Hub (`/master`). */
export function getHubMasterUrl(): string {
  return `${getHubOrigin()}/master`;
}

/** Drive LogDock (arquivos) na mesma origem do Hub; use a sessão já compartilhada com o Logta quando o domínio/cookie alinhar. */
export function getHubLogDockDriveUrl(): string {
  return `${getHubOrigin()}/logdock/app`;
}

export function getHubInicioUrl(): string {
  return `${getHubOrigin()}/inicio`;
}
