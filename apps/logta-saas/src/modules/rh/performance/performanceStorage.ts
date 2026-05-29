/**
 * Storage de Performance & Desenvolvimento — persiste avaliações, metas,
 * certificados e análises de IA entre recarregamentos de página.
 * Usa localStorage com chave por companyId, seguindo o padrão do codebase.
 */

// ─── AVALIAÇÕES DE PERFORMANCE ───────────────────────────────────────────────

export type PerformanceAvaliacao = {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  cargo: string;
  avaliador: string;
  nota: number;
  feedback: string;
  perfil: 'Excepcional' | 'Alto Potencial' | 'Sólido' | 'Atenção' | 'Risco';
  data: string;
  createdAt: string;
};

const AVALIACOES_PREFIX = 'logta-rh-avaliacoes';
const METAS_PREFIX = 'logta-rh-metas';
const CERTIFICADOS_PREFIX = 'logta-rh-certificados';

function key(prefix: string, companyId: string) {
  return `${prefix}:${companyId}`;
}

const AVALIACOES_SEED: Omit<PerformanceAvaliacao, 'createdAt'>[] = [
  { id: 'aval-1', colaboradorId: 'colab-45678912345', colaboradorNome: 'Carlos Henrique', cargo: 'Motorista', avaliador: 'João Silva', nota: 4.8, feedback: 'Excelente desempenho, superou todas as metas do trimestre.', perfil: 'Alto Potencial', data: '10/05/2026' },
  { id: 'aval-2', colaboradorId: 'colab-98765432100', colaboradorNome: 'Ana Paula Mendes', cargo: 'Analista RH', avaliador: 'João Silva', nota: 4.5, feedback: 'Ótima liderança, comunicação clara e resultados consistentes.', perfil: 'Sólido', data: '12/04/2026' },
  { id: 'aval-3', colaboradorId: 'colab-12345678901', colaboradorNome: 'Roberto Silva', cargo: 'Ajudante', avaliador: 'Ana Paula Mendes', nota: 3.2, feedback: 'Precisa melhorar pontualidade e comunicação com equipe.', perfil: 'Atenção', data: '05/03/2026' },
  { id: 'aval-4', colaboradorId: 'colab-32165498700', colaboradorNome: 'Juliana Rocha', cargo: 'Logística', avaliador: 'João Silva', nota: 5.0, feedback: 'Performance excepcional. Candidata natural para promoção.', perfil: 'Excepcional', data: '15/05/2026' },
];

export function loadAvaliacoes(companyId: string): PerformanceAvaliacao[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key(AVALIACOES_PREFIX, companyId));
    if (!raw) {
      const seed = AVALIACOES_SEED.map(a => ({ ...a, createdAt: new Date().toISOString() }));
      localStorage.setItem(key(AVALIACOES_PREFIX, companyId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as PerformanceAvaliacao[];
  } catch {
    return [];
  }
}

export function saveAvaliacoes(companyId: string, rows: PerformanceAvaliacao[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key(AVALIACOES_PREFIX, companyId), JSON.stringify(rows));
}

export function appendAvaliacao(companyId: string, row: PerformanceAvaliacao) {
  const list = loadAvaliacoes(companyId);
  if (list.some(r => r.id === row.id)) return;
  list.unshift(row);
  saveAvaliacoes(companyId, list);
}

// ─── METAS / OKRs ────────────────────────────────────────────────────────────

export type MetaKpi = {
  id: string;
  titulo: string;
  owner: string;
  ownerId: string;
  progresso: number;
  prazo: string;
  status: 'Em andamento' | 'Concluída' | 'Em risco' | 'Cancelada';
  categoria: string;
  descricao?: string;
  metaQuantitativa?: string;
  createdAt: string;
};

const METAS_SEED: Omit<MetaKpi, 'createdAt'>[] = [
  { id: 'meta-1', titulo: 'Reduzir tempo médio de entrega em 20%', owner: 'Carlos Henrique', ownerId: 'colab-45678912345', progresso: 78, prazo: '30/06/2026', status: 'Em andamento', categoria: 'Desempenho', descricao: 'Otimizar rotas e reduzir paradas desnecessárias.' },
  { id: 'meta-2', titulo: 'NPS interno atingir 8.5', owner: 'Ana Paula Mendes', ownerId: 'colab-98765432100', progresso: 92, prazo: '31/05/2026', status: 'Em andamento', categoria: 'Satisfação', descricao: 'Programa de escuta ativa mensal com equipe.' },
  { id: 'meta-3', titulo: 'Aumentar retenção em 15% (anual)', owner: 'Mariana Costa', ownerId: 'usr-4', progresso: 55, prazo: '31/12/2026', status: 'Em risco', categoria: 'Retenção' },
  { id: 'meta-4', titulo: 'Certificar 100% da equipe em NR-35', owner: 'Roberto Silva', ownerId: 'colab-12345678901', progresso: 30, prazo: '15/06/2026', status: 'Em risco', categoria: 'Compliance', descricao: 'Programa de treinamentos obrigatórios de segurança.' },
  { id: 'meta-5', titulo: 'Implantar planos de desenvolvimento individuais', owner: 'Ana Paula Mendes', ownerId: 'colab-98765432100', progresso: 100, prazo: '01/05/2026', status: 'Concluída', categoria: 'Desenvolvimento' },
];

export function loadMetas(companyId: string): MetaKpi[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key(METAS_PREFIX, companyId));
    if (!raw) {
      const seed = METAS_SEED.map(m => ({ ...m, createdAt: new Date().toISOString() }));
      localStorage.setItem(key(METAS_PREFIX, companyId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as MetaKpi[];
  } catch {
    return [];
  }
}

export function saveMetas(companyId: string, rows: MetaKpi[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key(METAS_PREFIX, companyId), JSON.stringify(rows));
}

export function appendMeta(companyId: string, row: MetaKpi) {
  const list = loadMetas(companyId);
  if (list.some(r => r.id === row.id)) return;
  list.unshift(row);
  saveMetas(companyId, list);
}

export function updateMeta(companyId: string, updated: MetaKpi) {
  const list = loadMetas(companyId).map(m => m.id === updated.id ? updated : m);
  saveMetas(companyId, list);
}

// ─── CERTIFICADOS ─────────────────────────────────────────────────────────────

export type Certificado = {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  tipo: string;
  emissor: string;
  dataEmissao: string;
  dataValidade: string;
  status: 'Válido' | 'Vencendo' | 'Vencido';
  arquivo?: string;
  createdAt: string;
};

const CERTIFICADOS_SEED: Omit<Certificado, 'createdAt'>[] = [
  { id: 'cert-1', colaboradorId: 'colab-45678912345', colaboradorNome: 'Carlos Henrique', tipo: 'CNH-E', emissor: 'DETRAN-SP', dataEmissao: '15/03/2023', dataValidade: '15/03/2028', status: 'Válido' },
  { id: 'cert-2', colaboradorId: 'colab-45678912345', colaboradorNome: 'Carlos Henrique', tipo: 'MOPP', emissor: 'ANTT', dataEmissao: '10/01/2024', dataValidade: '10/01/2026', status: 'Vencendo' },
  { id: 'cert-3', colaboradorId: 'colab-12345678901', colaboradorNome: 'Roberto Silva', tipo: 'NR-35 (Trabalho em Altura)', emissor: 'SENAT', dataEmissao: '05/05/2024', dataValidade: '05/05/2026', status: 'Vencido' },
  { id: 'cert-4', colaboradorId: 'colab-98765432100', colaboradorNome: 'Ana Paula Mendes', tipo: 'ISO 9001 (Auditor Interno)', emissor: 'Bureau Veritas', dataEmissao: '20/11/2023', dataValidade: '20/11/2026', status: 'Válido' },
  { id: 'cert-5', colaboradorId: 'usr-4', colaboradorNome: 'Mariana Costa', tipo: 'Primeiros Socorros', emissor: 'Cruz Vermelha', dataEmissao: '01/04/2025', dataValidade: '01/04/2027', status: 'Válido' },
];

export function loadCertificados(companyId: string): Certificado[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key(CERTIFICADOS_PREFIX, companyId));
    if (!raw) {
      const seed = CERTIFICADOS_SEED.map(c => ({ ...c, createdAt: new Date().toISOString() }));
      localStorage.setItem(key(CERTIFICADOS_PREFIX, companyId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Certificado[];
  } catch {
    return [];
  }
}

export function saveCertificados(companyId: string, rows: Certificado[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key(CERTIFICADOS_PREFIX, companyId), JSON.stringify(rows));
}

export function appendCertificado(companyId: string, row: Certificado) {
  const list = loadCertificados(companyId);
  if (list.some(r => r.id === row.id)) return;
  list.unshift(row);
  saveCertificados(companyId, list);
}
