/**
 * Storage de Governança & Integrações — persiste logs de atividade, permissões,
 * itens de auditoria, alertas operacionais e relatórios entre recarregamentos.
 * Usa localStorage com chave por companyId.
 */

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type LogAtividade = {
  id: string;
  evento: string;
  usuario: string;
  usuarioId: string;
  entidade: 'Colaborador' | 'Ponto' | 'Salário' | 'Documento' | 'Permissão' | 'Frota' | 'Frete' | 'Financeiro' | 'Sistema';
  antes?: string;
  depois?: string;
  dataHora: string;
  origem: 'Web' | 'App' | 'API' | 'Sistema';
  modulo: string;
  createdAt: string;
};

export type PerfilPermissao = {
  id: string;
  nome: string;
  nivel: 'Admin' | 'Gestor' | 'Analista' | 'Visualizador';
  modulos: string[];
  descricao: string;
  usuariosCount: number;
  criadoEm: string;
  createdAt: string;
};

export type ItemAuditoria = {
  id: string;
  categoria: 'Documentos' | 'Ponto' | 'Salário' | 'Segurança' | 'Compliance' | 'Processos';
  requisito: string;
  status: 'Conforme' | 'Não Conforme' | 'Em análise' | 'Pendente';
  responsavel: string;
  evidencia: string;
  dataVerificacao: string;
  prazoCorrecao?: string;
  descricao?: string;
  createdAt: string;
};

export type AlertaOperacional = {
  id: string;
  tipo: 'Absenteísmo' | 'Documento Vencendo' | 'Fadiga' | 'Meta em Risco' | 'Turnover' | 'Segurança' | 'Compliance' | 'Outro';
  colaborador: string;
  setor: string;
  severidade: 'Crítico' | 'Alto' | 'Médio' | 'Baixo';
  predicao: string;
  prazo: string;
  status: 'Ativo' | 'Em tratamento' | 'Resolvido' | 'Descartado';
  dataGeracao: string;
  descricao: string;
  createdAt: string;
};

export type RelatorioRh = {
  id: string;
  titulo: string;
  tipo: 'PDF' | 'Excel' | 'CSV';
  periodo: string;
  geradoEm: string;
  tamanho: string;
  modulo: string;
  createdAt: string;
};

// ─── KEYS ────────────────────────────────────────────────────────────────────

const LOGS_KEY = 'logta-rh-logs-atividade';
const PERMISSOES_KEY = 'logta-rh-permissoes';
const AUDITORIA_KEY = 'logta-rh-auditoria';
const ALERTAS_KEY = 'logta-rh-alertas-op';
const RELATORIOS_KEY = 'logta-rh-relatorios';

function k(prefix: string, companyId: string) {
  return `${prefix}:${companyId}`;
}

// ─── LOGS DE ATIVIDADE ────────────────────────────────────────────────────────

const LOGS_SEED: Omit<LogAtividade, 'createdAt'>[] = [
  { id: 'log-1', evento: 'Alteração de salário', usuario: 'João Silva', usuarioId: 'admin-1', entidade: 'Salário', antes: 'R$ 4.200,00', depois: 'R$ 4.800,00', dataHora: '22/05/2026 09:14:32', origem: 'Web', modulo: 'RH / Controle Salarial' },
  { id: 'log-2', evento: 'Novo colaborador cadastrado', usuario: 'Ana Paula', usuarioId: 'usr-2', entidade: 'Colaborador', depois: 'Lucas Martins (CPF 234.567.890-01)', dataHora: '22/05/2026 08:55:11', origem: 'Web', modulo: 'RH / Equipe' },
  { id: 'log-3', evento: 'Ponto corrigido manualmente', usuario: 'João Silva', usuarioId: 'admin-1', entidade: 'Ponto', antes: '08:32', depois: '08:00', dataHora: '21/05/2026 17:22:04', origem: 'Web', modulo: 'RH / Ponto' },
  { id: 'log-4', evento: 'Documento enviado ao LogDock', usuario: 'Mariana Costa', usuarioId: 'usr-4', entidade: 'Documento', depois: 'ASO Periódico — Carlos Henrique', dataHora: '21/05/2026 14:01:55', origem: 'App', modulo: 'RH / Documentos' },
  { id: 'log-5', evento: 'Permissão alterada', usuario: 'João Silva', usuarioId: 'admin-1', entidade: 'Permissão', antes: 'Analista', depois: 'Gestor', dataHora: '20/05/2026 16:45:22', origem: 'Web', modulo: 'RH / Permissões' },
  { id: 'log-6', evento: 'Relatório gerado', usuario: 'Ana Paula', usuarioId: 'usr-2', entidade: 'Sistema', depois: 'Relatório Folha Maio/2026 — PDF', dataHora: '20/05/2026 11:30:07', origem: 'Web', modulo: 'RH / Relatórios' },
  { id: 'log-7', evento: 'Login no sistema', usuario: 'Carlos Henrique', usuarioId: 'usr-1', entidade: 'Sistema', dataHora: '20/05/2026 07:58:14', origem: 'App', modulo: 'Sistema' },
  { id: 'log-8', evento: 'Solicitação de férias aprovada', usuario: 'João Silva', usuarioId: 'admin-1', entidade: 'Colaborador', antes: 'Pendente', depois: 'Aprovada — Período: 14/07 a 28/07', dataHora: '19/05/2026 15:12:48', origem: 'Web', modulo: 'RH / Solicitações' },
];

export function loadLogs(companyId: string): LogAtividade[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(k(LOGS_KEY, companyId));
    if (!raw) {
      const seed = LOGS_SEED.map(l => ({ ...l, createdAt: new Date().toISOString() }));
      localStorage.setItem(k(LOGS_KEY, companyId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as LogAtividade[];
  } catch { return []; }
}

export function saveLogs(companyId: string, rows: LogAtividade[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k(LOGS_KEY, companyId), JSON.stringify(rows.slice(0, 500)));
}

export function appendLog(companyId: string, row: LogAtividade) {
  const list = loadLogs(companyId);
  list.unshift(row);
  saveLogs(companyId, list);
}

// ─── PERMISSÕES ───────────────────────────────────────────────────────────────

const PERMISSOES_SEED: Omit<PerfilPermissao, 'createdAt'>[] = [
  { id: 'perm-1', nome: 'Administrador', nivel: 'Admin', modulos: ['RH', 'Financeiro', 'Frota', 'CRM', 'Relatórios', 'Configurações', 'IA'], descricao: 'Acesso irrestrito a todos os módulos e configurações do sistema.', usuariosCount: 2, criadoEm: '01/01/2026' },
  { id: 'perm-2', nome: 'RH Gestor', nivel: 'Gestor', modulos: ['RH', 'Relatórios', 'Agenda', 'Comunicação'], descricao: 'Acesso completo ao módulo de RH, relatórios e agenda corporativa.', usuariosCount: 3, criadoEm: '15/01/2026' },
  { id: 'perm-3', nome: 'RH Analista', nivel: 'Analista', modulos: ['RH (leitura)', 'Comunicação', 'Agenda'], descricao: 'Acesso de leitura ao RH, comunicação interna e agenda.', usuariosCount: 5, criadoEm: '15/01/2026' },
  { id: 'perm-4', nome: 'Operacional', nivel: 'Analista', modulos: ['Fretes', 'Frota', 'Agenda', 'Ponto'], descricao: 'Acesso aos módulos operacionais: frota, fretes e controle de jornada.', usuariosCount: 18, criadoEm: '15/01/2026' },
  { id: 'perm-5', nome: 'Motorista Líder', nivel: 'Visualizador', modulos: ['Ponto', 'Agenda'], descricao: 'Acesso ao ponto eletrônico e agenda da equipe operacional.', usuariosCount: 17, criadoEm: '20/01/2026' },
];

export function loadPermissoes(companyId: string): PerfilPermissao[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(k(PERMISSOES_KEY, companyId));
    if (!raw) {
      const seed = PERMISSOES_SEED.map(p => ({ ...p, createdAt: new Date().toISOString() }));
      localStorage.setItem(k(PERMISSOES_KEY, companyId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as PerfilPermissao[];
  } catch { return []; }
}

export function savePermissoes(companyId: string, rows: PerfilPermissao[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k(PERMISSOES_KEY, companyId), JSON.stringify(rows));
}

export function appendPermissao(companyId: string, row: PerfilPermissao) {
  const list = loadPermissoes(companyId);
  if (list.some(r => r.id === row.id)) return;
  list.unshift(row);
  savePermissoes(companyId, list);
}

// ─── AUDITORIA ────────────────────────────────────────────────────────────────

const AUDITORIA_SEED: Omit<ItemAuditoria, 'createdAt'>[] = [
  { id: 'aud-1', categoria: 'Documentos', requisito: '100% dos ASOs periódicos válidos', status: 'Conforme', responsavel: 'Ana Paula', evidencia: 'Relatório de validade LogDock #2026-04', dataVerificacao: '15/05/2026' },
  { id: 'aud-2', categoria: 'Ponto', requisito: 'Registro obrigatório de intervalos (NR-16)', status: 'Não Conforme', responsavel: 'João Silva', evidencia: 'Relatório de ponto maio/26 — 12 registros sem intervalo', dataVerificacao: '20/05/2026', prazoCorrecao: '30/05/2026', descricao: 'Implementar alerta automático no app de ponto.' },
  { id: 'aud-3', categoria: 'Salário', requisito: 'Pagamento até o 5º dia útil', status: 'Conforme', responsavel: 'DP Logta', evidencia: 'Extrato bancário de folha — competência abril/26', dataVerificacao: '10/05/2026' },
  { id: 'aud-4', categoria: 'Segurança', requisito: 'Certificados NR-35 válidos para trabalho em altura', status: 'Não Conforme', responsavel: 'Segurança do Trabalho', evidencia: '3 colaboradores com NR-35 vencida: Roberto Silva, Pedro Assis, Fábio Nunes', dataVerificacao: '18/05/2026', prazoCorrecao: '15/06/2026' },
  { id: 'aud-5', categoria: 'Compliance', requisito: 'LGPD — Termos de uso assinados digitalmente', status: 'Em análise', responsavel: 'João Silva', evidencia: 'Pendente validação jurídica do novo template', dataVerificacao: '22/05/2026' },
  { id: 'aud-6', categoria: 'Processos', requisito: 'Avaliações de desempenho trimestrais realizadas', status: 'Conforme', responsavel: 'RH Gestor', evidencia: '47 de 50 avaliações concluídas — 94% de completude', dataVerificacao: '01/05/2026' },
];

export function loadAuditoria(companyId: string): ItemAuditoria[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(k(AUDITORIA_KEY, companyId));
    if (!raw) {
      const seed = AUDITORIA_SEED.map(a => ({ ...a, createdAt: new Date().toISOString() }));
      localStorage.setItem(k(AUDITORIA_KEY, companyId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as ItemAuditoria[];
  } catch { return []; }
}

export function saveAuditoria(companyId: string, rows: ItemAuditoria[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k(AUDITORIA_KEY, companyId), JSON.stringify(rows));
}

export function appendAuditoria(companyId: string, row: ItemAuditoria) {
  const list = loadAuditoria(companyId);
  if (list.some(r => r.id === row.id)) return;
  list.unshift(row);
  saveAuditoria(companyId, list);
}

// ─── ALERTAS OPERACIONAIS ─────────────────────────────────────────────────────

const ALERTAS_SEED: Omit<AlertaOperacional, 'createdAt'>[] = [
  { id: 'alert-1', tipo: 'Fadiga', colaborador: 'Carlos Henrique', setor: 'Frota', severidade: 'Crítico', predicao: 'Risco de acidente por excesso de jornada (68h semanais)', prazo: '23/05/2026', status: 'Em tratamento', dataGeracao: '21/05/2026', descricao: 'IA detectou padrão de jornada excessiva nas últimas 3 semanas.' },
  { id: 'alert-2', tipo: 'Documento Vencendo', colaborador: 'Roberto Silva', setor: 'Operação', severidade: 'Crítico', predicao: 'MOPP vence em 3 dias — bloqueio de cargas perigosas', prazo: '25/05/2026', status: 'Ativo', dataGeracao: '22/05/2026', descricao: 'Certificado MOPP com vencimento iminente.' },
  { id: 'alert-3', tipo: 'Absenteísmo', colaborador: 'Pedro Assis', setor: 'Logística', severidade: 'Alto', predicao: 'Padrão de faltas às 2ªs feiras — risco de desligamento voluntário', prazo: '30/05/2026', status: 'Ativo', dataGeracao: '19/05/2026', descricao: '5 faltas nas últimas 8 segundas-feiras.' },
  { id: 'alert-4', tipo: 'Meta em Risco', colaborador: 'Equipe B', setor: 'Operação', severidade: 'Alto', predicao: 'Meta de entregas no prazo abaixo de 80% — projeção de 74% no mês', prazo: '31/05/2026', status: 'Em tratamento', dataGeracao: '18/05/2026', descricao: 'Queda de performance operacional identificada.' },
  { id: 'alert-5', tipo: 'Turnover', colaborador: 'Mariana Costa', setor: 'Logística', severidade: 'Médio', predicao: 'Score de risco de saída: 72% — consultar histórico de avaliações', prazo: '15/06/2026', status: 'Ativo', dataGeracao: '15/05/2026', descricao: 'Sinais de insatisfação detectados em feedbacks recentes.' },
  { id: 'alert-6', tipo: 'Segurança', colaborador: 'Geral — Filial Norte', setor: 'Segurança', severidade: 'Médio', predicao: 'EPIs não registrados no sistema nos últimos 7 dias', prazo: '28/05/2026', status: 'Resolvido', dataGeracao: '14/05/2026', descricao: 'Inconsistência de registro de saída de EPIs.' },
];

export function loadAlertas(companyId: string): AlertaOperacional[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(k(ALERTAS_KEY, companyId));
    if (!raw) {
      const seed = ALERTAS_SEED.map(a => ({ ...a, createdAt: new Date().toISOString() }));
      localStorage.setItem(k(ALERTAS_KEY, companyId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as AlertaOperacional[];
  } catch { return []; }
}

export function saveAlertas(companyId: string, rows: AlertaOperacional[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k(ALERTAS_KEY, companyId), JSON.stringify(rows));
}

export function appendAlerta(companyId: string, row: AlertaOperacional) {
  const list = loadAlertas(companyId);
  if (list.some(r => r.id === row.id)) return;
  list.unshift(row);
  saveAlertas(companyId, list);
}

// ─── RELATÓRIOS ───────────────────────────────────────────────────────────────

const RELATORIOS_SEED: Omit<RelatorioRh, 'createdAt'>[] = [
  { id: 'rel-1', titulo: 'Folha de Pagamento — Maio/2026', tipo: 'PDF', periodo: 'Mai/2026', geradoEm: '22/05/2026 08:00', tamanho: '2.4 MB', modulo: 'RH / Financeiro' },
  { id: 'rel-2', titulo: 'Controle de Ponto — Maio/2026', tipo: 'Excel', periodo: 'Mai/2026', geradoEm: '21/05/2026 17:30', tamanho: '1.1 MB', modulo: 'RH / Ponto' },
  { id: 'rel-3', titulo: 'Relatório de Turnover — 2026', tipo: 'PDF', periodo: 'Jan–Mai/2026', geradoEm: '20/05/2026 14:15', tamanho: '890 KB', modulo: 'RH / Análise' },
  { id: 'rel-4', titulo: 'Performance Equipe — T1 2026', tipo: 'PDF', periodo: 'T1/2026', geradoEm: '15/05/2026 09:45', tamanho: '1.8 MB', modulo: 'RH / Performance' },
  { id: 'rel-5', titulo: 'Certificados Vencendo — Junho', tipo: 'Excel', periodo: 'Jun/2026', geradoEm: '14/05/2026 11:00', tamanho: '340 KB', modulo: 'RH / Documentos' },
  { id: 'rel-6', titulo: 'Banco de Horas — Maio/2026', tipo: 'CSV', periodo: 'Mai/2026', geradoEm: '10/05/2026 16:20', tamanho: '128 KB', modulo: 'RH / Jornada' },
];

export function loadRelatorios(companyId: string): RelatorioRh[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(k(RELATORIOS_KEY, companyId));
    if (!raw) {
      const seed = RELATORIOS_SEED.map(r => ({ ...r, createdAt: new Date().toISOString() }));
      localStorage.setItem(k(RELATORIOS_KEY, companyId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as RelatorioRh[];
  } catch { return []; }
}

export function saveRelatorios(companyId: string, rows: RelatorioRh[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k(RELATORIOS_KEY, companyId), JSON.stringify(rows));
}

export function appendRelatorio(companyId: string, row: RelatorioRh) {
  const list = loadRelatorios(companyId);
  if (list.some(r => r.id === row.id)) return;
  list.unshift(row);
  saveRelatorios(companyId, list);
}
