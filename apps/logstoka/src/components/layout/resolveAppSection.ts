import { resolveMarketplaceHubSlug } from '@/lib/marketplaceHub';

export type AppSectionId = 'home' | 'operacao' | 'estoque' | 'canais' | 'config';

const OPERACAO_PREFIXES = [
  '/app/operacao',
  '/app/atividades',
  '/app/picking',
  '/app/conference',
  '/app/imports',
];

const ESTOQUE_PREFIXES = [
  '/app/movements',
  '/app/transfers',
  '/app/returns',
  '/app/inventory',
  '/app/products',
  '/app/warehouses',
];

export function resolveAppSectionId(pathname: string): AppSectionId {
  if (pathname === '/app' || pathname === '/app/') return 'home';

  if (pathname.startsWith('/app/configuracoes')) return 'config';
  if (OPERACAO_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return 'operacao';
  if (ESTOQUE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return 'estoque';

  if (
    pathname.startsWith('/app/vendas') ||
    pathname.startsWith('/app/dashboard') ||
    pathname.startsWith('/app/reports') ||
    pathname.startsWith('/app/integrations') ||
    pathname.startsWith('/app/marketplace')
  ) {
    return 'canais';
  }

  const hubSlug = pathname.replace(/^\/app\/?/, '').split('/')[0] ?? '';
  if (hubSlug && resolveMarketplaceHubSlug(hubSlug)) return 'canais';

  return 'operacao';
}

export function resolveMegaMenuSectionId(pathname: string): string | null {
  const section = resolveAppSectionId(pathname);
  if (section === 'home') return 'operacao';
  return section;
}

export function isSectionNavActive(pathname: string, to: string, end = false): boolean {
  const targetPath = to.split('?')[0] ?? to;
  const pathOnly = pathname.split('?')[0] ?? pathname;

  if (to.includes('?')) {
    return pathname === to;
  }

  if (end) {
    return pathOnly === targetPath || pathOnly === `${targetPath}/`;
  }

  return pathOnly === targetPath || pathOnly.startsWith(`${targetPath}/`);
}
