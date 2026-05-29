/**
 * Deep links do Hub Master → app Zaptro (`apps/zaptro`).
 * Paths alinhados com `apps/zaptro/src/constants/zaptroRoutes.ts` (manter sincronizado).
 */

export const ZAPTRO_MASTER_ROUTES = {
  SALES: '/vendas',
  DASHBOARD: '/inicio',
  RESULTADOS: '/resultados',
  CHAT: '/whatsapp',
  CLIENTS: '/clientes',
  COMMERCIAL_CRM: '/comercial',
  ROUTES: '/rotas',
  COMMERCIAL_QUOTES: '/comercial/orcamentos',
  LOGISTICS: '/operacoes',
  DRIVERS: '/motoristas',
  TEAM: '/equipe',
  HISTORY: '/historico',
  SETTINGS_ALIAS: '/configuracao',
  PROFILE: '/conta',
  OPENSTREETMAP: '/mapa',
  FLEET: '/frota',
  BILLING: '/faturamento',
} as const;

export function zaptroMasterClientProfilePath(id: string): string {
  return `/clientes/perfil/${encodeURIComponent(id)}`;
}

export function zaptroMasterLeadProfilePath(id: string): string {
  return `/clientes/leads/perfil/${encodeURIComponent(id)}`;
}

export function zaptroMasterDriverPath(id: string): string {
  return `/motoristas/${encodeURIComponent(id)}`;
}

export function zaptroMasterVehiclePath(id: string): string {
  return `/frota/${encodeURIComponent(id)}`;
}

/** Origem base do Zaptro para abrir telas reais (localhost:5174 em dev). */
export function getZaptroAppOrigin(): string {
  const raw = import.meta.env.VITE_ZAPTRO_APP_ORIGIN as string | undefined;
  const env = raw?.replace(/\/$/, '').trim();
  if (env) return env;
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:5174';
  }
  return 'https://app.zaptro.com.br';
}

/** Host exibido no chip (ex.: `localhost:5174` ou `app.zaptro.com.br`). */
export function getZaptroOriginHost(): string {
  try {
    return new URL(getZaptroAppOrigin()).host;
  } catch {
    return 'app.zaptro.com.br';
  }
}

export function zaptroAppDeepLink(path: string): string {
  const origin = getZaptroAppOrigin();
  const p = path.startsWith('/') ? path : `/${path}`;
  
  // 🔐 Master Direct Login Bypass
  // Se estivermos no Master, repassamos o token para o Zaptro não pedir senha
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');
  
  const url = new URL(`${origin}${p}`);
  if (token) {
    url.searchParams.set('token', token);
    url.searchParams.set('master_bypass', 'true');
  }
  
  return url.toString();
}

export function openZaptroApp(path: string): void {
  window.open(zaptroAppDeepLink(path), '_blank', 'noopener,noreferrer');
}
