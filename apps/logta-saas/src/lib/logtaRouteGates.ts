/** Rotas bloqueadas quando paywall / trial expirado (acesso básico mantém início, dashboard, perfil, ajuda). */
export const LOGTA_PREMIUM_ROUTE_PREFIXES = [
  '/crm',
  '/fretes',
  '/roteirizacao',
  '/financeiro',
  '/documentos',
  '/automacoes',
  '/relatorios',
  '/mapa-ao-vivo',
  '/pgr',
  '/frota',
  '/agenda',
];

export function isLogtaPremiumRoute(pathname: string): boolean {
  return LOGTA_PREMIUM_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
