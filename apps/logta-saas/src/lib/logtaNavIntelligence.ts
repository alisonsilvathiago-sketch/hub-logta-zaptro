/**
 * Navegação adaptativa — frequência de acesso + eventos para re-render da sidebar.
 */
export const LOGTA_NAV_USAGE_KEY = 'logta-nav-usage-v1';
export const LOGTA_NAV_USAGE_EVENT = 'logta-nav-usage-updated';

type NavUsageV1 = {
  version: 1;
  /** Path canônico (prefixo) → contagem de visitas ao módulo. */
  counts: Record<string, number>;
};

const SHELL_PREFIXES = [
  '/inicio',
  '/dashboard',
  '/crm',
  '/fretes',
  '/roteirizacao',
  '/mapa-ao-vivo',
  '/frota',
  '/pgr',
  '/documentos',
  '/financeiro',
  '/rh',
  '/relatorios',
  '/automacoes',
  '/agenda',
  '/admin-settings',
  '/perfil',
  '/permissoes',
  '/ajuda',
] as const;

function canonicalNavPath(pathname: string): string | null {
  const path = pathname.split('?')[0] || '/';
  for (const p of SHELL_PREFIXES) {
    if (path === p || path.startsWith(`${p}/`)) return p;
  }
  return null;
}

export function recordNavVisit(pathname: string): void {
  const key = canonicalNavPath(pathname);
  if (!key) return;
  try {
    const raw = localStorage.getItem(LOGTA_NAV_USAGE_KEY);
    let data: NavUsageV1 = raw
      ? (JSON.parse(raw) as NavUsageV1)
      : { version: 1, counts: {} };
    if (data.version !== 1 || !data.counts || typeof data.counts !== 'object') {
      data = { version: 1, counts: {} };
    }
    data.counts[key] = (data.counts[key] ?? 0) + 1;
    localStorage.setItem(LOGTA_NAV_USAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(LOGTA_NAV_USAGE_EVENT));
  } catch {
    /* quota / private */
  }
}

export function getNavUsageCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LOGTA_NAV_USAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as Partial<NavUsageV1>;
    if (data.version !== 1 || !data.counts || typeof data.counts !== 'object') return {};
    return { ...data.counts };
  } catch {
    return {};
  }
}

/**
 * Ordena itens: Início fixo no topo; depois prioridade composta (plano mesclado − peso do uso).
 */
export function sortSidebarItemsByIntelligence<T extends { path: string }>(
  items: T[],
  mergedMenuPriority: string[],
  usage: Record<string, number>,
): T[] {
  const order = new Map(mergedMenuPriority.map((p, i) => [p, i]));
  return [...items]
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const pa = a.item.path;
      const pb = b.item.path;
      if (pa === '/inicio') return -1;
      if (pb === '/inicio') return 1;
      const baseA = order.has(pa) ? order.get(pa)! : 800 + a.i;
      const baseB = order.has(pb) ? order.get(pb)! : 800 + b.i;
      const va = Math.min(55, (usage[pa] ?? 0) * 3);
      const vb = Math.min(55, (usage[pb] ?? 0) * 3);
      return baseA * 100 - va - (baseB * 100 - vb);
    })
    .map(({ item }) => item);
}

const MENU_LABELS: Record<string, string> = {
  '/dashboard': 'Controle',
  '/crm': 'CRM',
  '/fretes': 'Operação / Fretes',
  '/roteirizacao': 'Roteirização',
  '/mapa-ao-vivo': 'Mapa ao vivo',
  '/frota': 'Gestão de Frota',
  '/pgr': 'PGR & Seguros',
  '/documentos': 'Docs Fiscais',
  '/financeiro': 'Financeiro',
  '/rh': 'RH',
  '/relatorios': 'Relatórios',
  '/automacoes': 'Automações',
};

/** Uma vez por sessão: sugere que o menu já está se adaptando ao hábito (copy leve, sem pin manual ainda). */
export function maybeSuggestAdaptiveNavToast(
  menuPaths: string[],
  mergedPriority: string[],
  usage: Record<string, number>,
): void {
  try {
    if (sessionStorage.getItem('logta-nav-adaptive-hint') === '1') return;
    let topPath: string | null = null;
    let top = 0;
    for (const p of menuPaths) {
      if (p === '/inicio') continue;
      const c = usage[p] ?? 0;
      if (c > top) {
        top = c;
        topPath = p;
      }
    }
    if (!topPath || top < 6) return;
    const pos = mergedPriority.indexOf(topPath);
    if (pos >= 0 && pos <= 3) return;
    sessionStorage.setItem('logta-nav-adaptive-hint', '1');
    const name = MENU_LABELS[topPath] ?? topPath;
    window.dispatchEvent(
      new CustomEvent('show-toast', {
        detail: {
          type: 'info',
          title: 'Menu inteligente',
          message: `Detectamos uso frequente em “${name}”. A ordem do menu combina seus módulos, seu desafio principal e esse hábito — continue navegando que os atalhos evoluem.`,
        },
      }),
    );
  } catch {
    /* ignore */
  }
}

export function isHotNavItem(path: string, usage: Record<string, number>, threshold = 5): boolean {
  if (path === '/inicio') return false;
  return (usage[path] ?? 0) >= threshold;
}
