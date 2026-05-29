/** Área autenticada / operacional — tudo sob `/app/*` */
export const ZAPTRO_APP_ROUTES = {
  ROOT: '/app',
  LOGIN: '/login',
  HOME: '/app',
  RESULTS: '/app/resultados',
  AGENDA: '/app/agenda',
  CLIENTS: '/app/clientes',
  /** Perfil do cliente (cadastro + histórico). */
  clientProfile: (id: string) => `/app/clientes/perfil/${encodeURIComponent(id)}`,
  /** Ligação WhatsApp (QR) — painel em Configuração, tab config. */
  CONNECT: '/app/configuracoes?tab=config',
  INBOX: '/app/conversas',
  BROADCASTS: '/app/listas-transmissao',
  CONTACTS: '/app/contatos',
  CRM: '/app/crm',
  /** Perfil do lead no funil CRM (não confundir com cliente pós-venda). */
  leadProfile: (id: string) => `/app/crm/leads/${encodeURIComponent(id)}`,
  /** Legado — redireciona para {@link leadProfile}. */
  leadProfileLegacy: (id: string) => `/app/crm/leads/perfil/${encodeURIComponent(id)}`,
  QUOTES: '/app/orcamentos',
  ROUTES: '/app/rotas',
  DRIVERS: '/app/motoristas',
  /** Página dedicada de veículos / frota. */
  FLEET: '/app/motoristas/frota',
  /** Ajudantes de campo (vinculados a motoristas). */
  HELPERS: '/app/motoristas/ajudantes',
  /** Legado: redireciona para {@link ZAPTRO_APP_ROUTES.FLEET}. */
  DRIVERS_VEHICLES: '/app/motoristas/frota',
  LOGISTICS: '/app/logistica',
  FILES: '/app/arquivos',
  SETTINGS: '/app/configuracoes',
  COMPANY: '/app/minha-empresa',
  TEAM: (tab?: 'members' | 'ranking' | 'permissions') =>
    tab ? `/app/membros?tab=${encodeURIComponent(tab)}` : '/app/membros',
  /** Perfil operacional do colaborador (histórico, permissões, conta). */
  teamMemberProfile: (id: string) => `/app/membros/perfil/${encodeURIComponent(id)}`,
  PROFILE: '/app/perfil',
  /** Perfil operacional do motorista. */
  driverProfile: (id: string) => `/app/motoristas/perfil/${encodeURIComponent(id)}`,
  /** Perfil do veículo / ativo da frota. */
  vehicleProfile: (id: string) => `/app/motoristas/frota/perfil/${encodeURIComponent(id)}`,
  helperProfile: (id: string) => `/app/motoristas/ajudantes/perfil/${encodeURIComponent(id)}`,
} as const;

export function isZaptroAppPath(pathname: string): boolean {
  return pathname === '/app' || pathname.startsWith('/app/');
}

/** Respiro horizontal interno do shell `/app` (modelo página Clientes). */
export const ZAPTRO_APP_CONTENT_GUTTER_LEFT_PX = 30;
export const ZAPTRO_APP_CONTENT_GUTTER_RIGHT_PX = 30;
export const ZAPTRO_APP_CONTENT_GUTTER_TOP_PX = 35;
export const ZAPTRO_APP_CONTENT_GUTTER_BOTTOM_PX = 20;
export const ZAPTRO_APP_CONTENT_GUTTER_MARGIN_LEFT_PX = 10;
/** @deprecated use GUTTER_LEFT_PX */
export const ZAPTRO_APP_CONTENT_GUTTER_X_PX = ZAPTRO_APP_CONTENT_GUTTER_LEFT_PX;

/** Rotas ecrã completo (respiro lateral 20px; vertical herdado do shell). */
export const ZAPTRO_APP_EDGE_TO_EDGE_PATHS = [
  ZAPTRO_APP_ROUTES.CRM,
  ZAPTRO_APP_ROUTES.AGENDA,
  ZAPTRO_APP_ROUTES.ROUTES,
] as const;

/** Início `/app` — padding próprio no shell (0 vertical, 20px lateral). */
export function isZaptroAppInicioPath(pathname: string): boolean {
  return normalizeZaptroAppPathname(pathname) === ZAPTRO_APP_ROUTES.HOME;
}

/** Configurações — padding lateral 20px no shell, sem respiro vertical extra. */
export function isZaptroAppSettingsPath(pathname: string): boolean {
  return normalizeZaptroAppPathname(pathname).startsWith(ZAPTRO_APP_ROUTES.SETTINGS);
}

/** Inbox WhatsApp — gutter sem padding (ecrã completo). */
export function isZaptroAppInboxPath(pathname: string): boolean {
  return normalizeZaptroAppPathname(pathname) === ZAPTRO_APP_ROUTES.INBOX;
}

export function normalizeZaptroAppPathname(pathname: string): string {
  if (!pathname || pathname === '/') return ZAPTRO_APP_ROUTES.HOME;
  return pathname.replace(/\/+$/, '') || ZAPTRO_APP_ROUTES.HOME;
}

export function isZaptroAppEdgeToEdgePath(pathname: string): boolean {
  const p = normalizeZaptroAppPathname(pathname);
  return (ZAPTRO_APP_EDGE_TO_EDGE_PATHS as readonly string[]).includes(p);
}

/** Páginas em ecrã completo dentro da secção (sem padding interno extra). */
export function isZaptroAppPageSectionCompactPath(pathname: string): boolean {
  const p = normalizeZaptroAppPathname(pathname);
  return (
    isZaptroAppEdgeToEdgePath(pathname) ||
    p === ZAPTRO_APP_ROUTES.INBOX ||
    p === ZAPTRO_APP_ROUTES.BROADCASTS ||
    isZaptroAppInicioPath(pathname) ||
    isZaptroAppSettingsPath(pathname)
  );
}

/** Mantém links internos no shell `/app` quando já estamos na área autenticada. */
export function zaptroAppOrLegacy(pathname: string, appPath: string, legacyPath: string): string {
  return isZaptroAppPath(pathname) ? appPath : legacyPath;
}

const WA_CONV_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Inbox com thread pré-selecionada: UUID de `whatsapp_conversations` ou telefone (só dígitos).
 * Em `/app/*` usa `?c=` (WaLink); fora do app mantém path legado `/whatsapp/:key`.
 */
export function zaptroAppInboxThreadPath(
  pathname: string,
  threadKey: string,
  options?: { clientName?: string | null },
): string {
  const t = threadKey.trim();
  const base = zaptroAppOrLegacy(pathname, ZAPTRO_APP_ROUTES.INBOX, '/whatsapp');
  if (!t) return base;
  const seg = WA_CONV_UUID_RE.test(t) ? t : t.replace(/\D/g, '');
  if (!seg) return base;
  if (isZaptroAppPath(pathname)) {
    const q = new URLSearchParams({ c: seg });
    if (options?.clientName?.trim()) q.set('n', options.clientName.trim());
    return `${ZAPTRO_APP_ROUTES.INBOX}?${q.toString()}`;
  }
  return `${base}/${encodeURIComponent(seg)}`;
}

export function zaptroDriversTabPath(
  pathname: string,
  tab: 'motoristas' | 'veiculos',
): string {
  if (tab === 'veiculos') {
    return isZaptroAppPath(pathname) ? ZAPTRO_APP_ROUTES.FLEET : '/frota';
  }
  return zaptroAppOrLegacy(pathname, ZAPTRO_APP_ROUTES.DRIVERS, '/motoristas');
}

export function isZaptroDriversVehiclesTab(pathname: string, search: string): boolean {
  if (pathname.includes('/motoristas/frota') || pathname.includes('/frota')) return true;
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return params.get('tab') === 'veiculos';
}
