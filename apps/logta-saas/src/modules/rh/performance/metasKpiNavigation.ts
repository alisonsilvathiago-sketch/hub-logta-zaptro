import { resolveRhPersonEquipeUrl } from '../lib/rhLegacyUserRoute';

export type OkrStatus = 'Em andamento' | 'Concluída' | 'Em risco';

export type OkrNavigationInput = {
  id: string;
  ownerId: string;
  owner: string;
  status: OkrStatus;
  categoria: string;
};

export type OkrNavigationContext = {
  companyId: string;
  okr: OkrNavigationInput;
};

const ADMIN_BASE = '/rh/administrativo';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
}

function buildQuery(okr: OkrNavigationInput): string {
  const params = new URLSearchParams({
    okr: okr.id,
    status: slugify(okr.status),
    categoria: slugify(okr.categoria),
    owner: okr.ownerId,
  });
  return `?${params.toString()}`;
}

/** Perfil do responsável — aba Metas. */
export function resolveOkrOwnerMetasUrl(ctx: OkrNavigationContext): string {
  const base = resolveRhPersonEquipeUrl(ctx.companyId, { id: ctx.okr.ownerId, nome: ctx.okr.owner }, 'metas');
  const params = new URLSearchParams({ okr: ctx.okr.id, status: slugify(ctx.okr.status) });
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}${params.toString()}`;
}

/**
 * Destino ao clicar num OKR na lista — módulo RH conforme segmento (categoria) e status.
 */
export function resolveOkrTargetUrl(ctx: OkrNavigationContext): string {
  const { okr } = ctx;
  const q = buildQuery(okr);

  if (okr.status === 'Em risco') {
    if (okr.categoria === 'Compliance' || okr.categoria === 'Desenvolvimento') {
      return `${ADMIN_BASE}/certificados${q}`;
    }
    return `${ADMIN_BASE}/ia-performance${q}`;
  }

  if (okr.status === 'Concluída') {
    if (okr.categoria === 'Compliance' || okr.categoria === 'Desenvolvimento') {
      return `${ADMIN_BASE}/certificados${q}`;
    }
    if (okr.categoria === 'Desempenho' || okr.categoria === 'Satisfação') {
      return `${ADMIN_BASE}/performance-individual${q}`;
    }
    return resolveOkrOwnerMetasUrl(ctx);
  }

  switch (okr.categoria) {
    case 'Satisfação':
    case 'Desempenho':
      return `${ADMIN_BASE}/performance-individual${q}`;
    case 'Retenção':
      return `${ADMIN_BASE}/ia-performance${q}`;
    case 'Desenvolvimento':
    case 'Compliance':
      return `${ADMIN_BASE}/treinamentos${q}`;
    default:
      return resolveOkrOwnerMetasUrl(ctx);
  }
}
