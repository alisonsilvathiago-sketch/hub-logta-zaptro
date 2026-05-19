export type FrotaManutencaoTipo =
  | 'troca_oleo'
  | 'troca_pneu'
  | 'filtro'
  | 'motor'
  | 'revisao'
  | 'freios'
  | 'suspensao'
  | 'eletrica'
  | 'outro';

export type FrotaManutencaoRecord = {
  id: string;
  companyId: string;
  vehicleId?: string;
  placa: string;
  modelo: string;
  tipo: FrotaManutencaoTipo;
  valor: number;
  responsavel: string;
  /** Problema ou motivo que levou o veículo à manutenção. */
  motivo?: string;
  observacao?: string;
  realizadoEm: string;
  createdAt: string;
  financeTransactionId?: string;
};

export const FROTA_MANUTENCAO_TIPOS: { id: FrotaManutencaoTipo; label: string }[] = [
  { id: 'troca_oleo', label: 'Troca de óleo' },
  { id: 'troca_pneu', label: 'Troca de pneu' },
  { id: 'filtro', label: 'Troca de filtro' },
  { id: 'motor', label: 'Motor' },
  { id: 'revisao', label: 'Revisão geral' },
  { id: 'freios', label: 'Freios' },
  { id: 'suspensao', label: 'Suspensão' },
  { id: 'eletrica', label: 'Elétrica' },
  { id: 'outro', label: 'Outro' },
];

const PREFIX = 'logta-frota-manutencao';

function storageKey(companyId: string) {
  return `${PREFIX}:${companyId}`;
}

export function normalizePlaca(p?: string) {
  return (p || '').toUpperCase().replace(/\s/g, '');
}

export function loadFrotaManutencoes(companyId: string): FrotaManutencaoRecord[] {
  if (typeof window === 'undefined' || !companyId) return [];
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    const list = JSON.parse(raw ?? '[]') as FrotaManutencaoRecord[];
    return list.sort((a, b) => new Date(b.realizadoEm).getTime() - new Date(a.realizadoEm).getTime());
  } catch {
    return [];
  }
}

export function saveFrotaManutencoes(companyId: string, rows: FrotaManutencaoRecord[]) {
  if (typeof window === 'undefined' || !companyId) return;
  localStorage.setItem(storageKey(companyId), JSON.stringify(rows));
}

export function appendFrotaManutencao(companyId: string, row: FrotaManutencaoRecord) {
  const list = loadFrotaManutencoes(companyId);
  if (list.some((r) => r.id === row.id)) return;
  list.unshift(row);
  saveFrotaManutencoes(companyId, list);
}

export function tipoManutencaoLabel(tipo: FrotaManutencaoTipo) {
  return FROTA_MANUTENCAO_TIPOS.find((t) => t.id === tipo)?.label ?? tipo;
}

export function financeCategoryForTipo(tipo: FrotaManutencaoTipo) {
  return tipo === 'troca_pneu' ? 'pneus' : 'manutencao';
}

export function manutencoesByPlaca(companyId: string, placa: string) {
  const key = normalizePlaca(placa);
  return loadFrotaManutencoes(companyId).filter((r) => normalizePlaca(r.placa) === key);
}
