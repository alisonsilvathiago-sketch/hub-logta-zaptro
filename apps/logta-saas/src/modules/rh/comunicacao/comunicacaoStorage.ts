/**
 * Storage de Comunicação Interna — persiste comunicados, avisos, solicitações,
 * threads de chat e tickets de suporte entre recarregamentos.
 * Usa localStorage com chave por companyId.
 */

// ─── COMUNICADOS ──────────────────────────────────────────────────────────────

export type Comunicado = {
  id: string;
  titulo: string;
  mensagem: string;
  publico: 'Todos' | 'Motoristas' | 'Administrativo' | 'Operacional';
  publicadoEm: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  status: 'Ativo' | 'Rascunho' | 'Encerrado';
  visualizacoes: number;
  autor: string;
  createdAt: string;
};

export type Aviso = {
  id: string;
  titulo: string;
  mensagem: string;
  destinatario: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  data: string;
  lido: boolean;
  exigeConfirmacao: boolean;
  autor: string;
  createdAt: string;
};

export type SolicitacaoInterna = {
  id: string;
  colaborador: string;
  colaboradorId: string;
  tipo: 'Férias' | 'Benefício' | 'Equipamento' | 'Documentação' | 'Outros';
  descricao: string;
  urgencia: 'Alta' | 'Média' | 'Baixa';
  dataDesejada: string;
  status: 'Aberta' | 'Em análise' | 'Aprovada' | 'Rejeitada';
  createdAt: string;
};

export type ChatThread = {
  id: string;
  remetente: string;
  remetenteId: string;
  assunto: string;
  ultimaMensagem: string;
  horario: string;
  naoLidas: number;
  online: boolean;
  createdAt: string;
};

export type TicketSuporte = {
  id: string;
  numero: string;
  colaborador: string;
  colaboradorId: string;
  categoria: 'Folha' | 'Benefícios' | 'Ponto' | 'Documentação' | 'Outros';
  titulo: string;
  descricao: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  status: 'Aberto' | 'Em atendimento' | 'Resolvido' | 'Cancelado';
  dataAbertura: string;
  createdAt: string;
};

const COMUNICADOS_KEY = 'logta-rh-comunicados';
const AVISOS_KEY = 'logta-rh-avisos';
const SOLICITACOES_KEY = 'logta-rh-solicitacoes';
const THREADS_KEY = 'logta-rh-chat-threads';
const TICKETS_KEY = 'logta-rh-tickets';

function k(prefix: string, companyId: string) {
  return `${prefix}:${companyId}`;
}

// ─── COMUNICADOS ──────────────────────────────────────────────────────────────

const COMUNICADOS_SEED: Omit<Comunicado, 'createdAt'>[] = [
  { id: 'com-1', titulo: 'Férias Coletivas — Julho 2026', mensagem: 'Informamos que o período de férias coletivas será de 14 a 28 de julho. Todos devem organizar suas demandas com antecedência.', publico: 'Todos', publicadoEm: '10/05/2026', prioridade: 'Alta', status: 'Ativo', visualizacoes: 87, autor: 'RH Logta' },
  { id: 'com-2', titulo: 'Nova Política de Uso de Equipamentos EPI', mensagem: 'A partir de 01/06, todos os colaboradores devem registrar saída e devolução de EPIs no sistema.', publico: 'Operacional', publicadoEm: '08/05/2026', prioridade: 'Alta', status: 'Ativo', visualizacoes: 54, autor: 'Segurança do Trabalho' },
  { id: 'com-3', titulo: 'Integração de Novos Colaboradores — Turma Maio', mensagem: 'Bem-vindos à equipe! O processo de integração ocorrerá nos dias 20 e 21/05 no auditório da matriz.', publico: 'Todos', publicadoEm: '05/05/2026', prioridade: 'Média', status: 'Ativo', visualizacoes: 112, autor: 'RH Logta' },
  { id: 'com-4', titulo: 'Pesquisa de Clima Organizacional 2026', mensagem: 'Acesse o formulário e contribua com suas respostas até 30/05. Sua opinião é fundamental para melhorarmos nosso ambiente de trabalho.', publico: 'Todos', publicadoEm: '01/05/2026', prioridade: 'Média', status: 'Ativo', visualizacoes: 96, autor: 'RH Logta' },
  { id: 'com-5', titulo: 'Atualização Benefício Vale-Alimentação', mensagem: 'A partir de junho, o valor do VA será reajustado em 12%. Consulte seu demonstrativo de benefícios.', publico: 'Todos', publicadoEm: '28/04/2026', prioridade: 'Baixa', status: 'Encerrado', visualizacoes: 143, autor: 'DP Logta' },
];

export function loadComunicados(companyId: string): Comunicado[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(k(COMUNICADOS_KEY, companyId));
    if (!raw) {
      const seed = COMUNICADOS_SEED.map(c => ({ ...c, createdAt: new Date().toISOString() }));
      localStorage.setItem(k(COMUNICADOS_KEY, companyId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Comunicado[];
  } catch { return []; }
}

export function saveComunicados(companyId: string, rows: Comunicado[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k(COMUNICADOS_KEY, companyId), JSON.stringify(rows));
}

export function appendComunicado(companyId: string, row: Comunicado) {
  const list = loadComunicados(companyId);
  if (list.some(r => r.id === row.id)) return;
  list.unshift(row);
  saveComunicados(companyId, list);
}

// ─── AVISOS ───────────────────────────────────────────────────────────────────

const AVISOS_SEED: Omit<Aviso, 'createdAt'>[] = [
  { id: 'av-1', titulo: 'Mudança de Turno — Equipe B', mensagem: 'O turno da Equipe B passará a ser das 06h às 14h a partir de 22/05/2026.', destinatario: 'Equipe B — Operação', prioridade: 'Alta', data: '20/05/2026', lido: false, exigeConfirmacao: true, autor: 'Operações' },
  { id: 'av-2', titulo: 'Advertência de Segurança — Uso de Celular', mensagem: 'Reiteramos que o uso de celular durante a condução é terminantemente proibido e sujeito a penalidade.', destinatario: 'Todos os Motoristas', prioridade: 'Alta', data: '18/05/2026', lido: true, exigeConfirmacao: true, autor: 'Segurança' },
  { id: 'av-3', titulo: 'Novo Benefício: Gympass Disponível', mensagem: 'A partir de junho, todos os colaboradores têm acesso à plataforma Gympass com plano Basic incluso.', destinatario: 'Todos', prioridade: 'Baixa', data: '15/05/2026', lido: true, exigeConfirmacao: false, autor: 'RH' },
  { id: 'av-4', titulo: 'Reunião Mensal de Resultados', mensagem: 'A reunião de resultados de maio ocorrerá em 30/05 às 15h no auditório. Presença obrigatória para líderes.', destinatario: 'Líderes e Gestores', prioridade: 'Média', data: '12/05/2026', lido: false, exigeConfirmacao: false, autor: 'Diretoria' },
  { id: 'av-5', titulo: 'Atualização do Ponto Eletrônico', mensagem: 'O app de ponto foi atualizado. Por favor, reinstale o aplicativo até 25/05 para evitar inconsistências.', destinatario: 'Todos', prioridade: 'Média', data: '10/05/2026', lido: true, exigeConfirmacao: true, autor: 'TI' },
];

export function loadAvisos(companyId: string): Aviso[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(k(AVISOS_KEY, companyId));
    if (!raw) {
      const seed = AVISOS_SEED.map(a => ({ ...a, createdAt: new Date().toISOString() }));
      localStorage.setItem(k(AVISOS_KEY, companyId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Aviso[];
  } catch { return []; }
}

export function saveAvisos(companyId: string, rows: Aviso[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k(AVISOS_KEY, companyId), JSON.stringify(rows));
}

export function appendAviso(companyId: string, row: Aviso) {
  const list = loadAvisos(companyId);
  if (list.some(r => r.id === row.id)) return;
  list.unshift(row);
  saveAvisos(companyId, list);
}

// ─── SOLICITAÇÕES ─────────────────────────────────────────────────────────────

const SOLICITACOES_SEED: Omit<SolicitacaoInterna, 'createdAt'>[] = [
  { id: 'sol-1', colaborador: 'Carlos Henrique', colaboradorId: 'usr-1', tipo: 'Férias', descricao: 'Solicito 15 dias de férias em julho conforme acordo com gestor.', urgencia: 'Média', dataDesejada: '14/07/2026', status: 'Em análise' },
  { id: 'sol-2', colaborador: 'Ana Paula', colaboradorId: 'usr-2', tipo: 'Benefício', descricao: 'Solicito inclusão de dependente no plano de saúde — filha nascida em 10/04.', urgencia: 'Alta', dataDesejada: '01/06/2026', status: 'Aprovada' },
  { id: 'sol-3', colaborador: 'Roberto Silva', colaboradorId: 'usr-3', tipo: 'Equipamento', descricao: 'Necessito de novo par de luvas de segurança — as antigas estão danificadas.', urgencia: 'Alta', dataDesejada: '23/05/2026', status: 'Aprovada' },
  { id: 'sol-4', colaborador: 'Mariana Costa', colaboradorId: 'usr-4', tipo: 'Documentação', descricao: 'Preciso da carta de referência para financiamento imobiliário.', urgencia: 'Média', dataDesejada: '30/05/2026', status: 'Aberta' },
  { id: 'sol-5', colaborador: 'Fernando Souza', colaboradorId: 'usr-5', tipo: 'Férias', descricao: 'Antecipação de 10 dias de férias para viagem internacional confirmada.', urgencia: 'Baixa', dataDesejada: '20/06/2026', status: 'Rejeitada' },
  { id: 'sol-6', colaborador: 'Juliana Pereira', colaboradorId: 'usr-6', tipo: 'Outros', descricao: 'Solicito adequação da carga horária para cuidar de familiar em tratamento médico.', urgencia: 'Alta', dataDesejada: '25/05/2026', status: 'Em análise' },
];

export function loadSolicitacoes(companyId: string): SolicitacaoInterna[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(k(SOLICITACOES_KEY, companyId));
    if (!raw) {
      const seed = SOLICITACOES_SEED.map(s => ({ ...s, createdAt: new Date().toISOString() }));
      localStorage.setItem(k(SOLICITACOES_KEY, companyId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as SolicitacaoInterna[];
  } catch { return []; }
}

export function saveSolicitacoes(companyId: string, rows: SolicitacaoInterna[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k(SOLICITACOES_KEY, companyId), JSON.stringify(rows));
}

export function appendSolicitacao(companyId: string, row: SolicitacaoInterna) {
  const list = loadSolicitacoes(companyId);
  if (list.some(r => r.id === row.id)) return;
  list.unshift(row);
  saveSolicitacoes(companyId, list);
}

// ─── CHAT THREADS ─────────────────────────────────────────────────────────────

const THREADS_SEED: Omit<ChatThread, 'createdAt'>[] = [
  { id: 'th-1', remetente: 'Carlos Henrique', remetenteId: 'usr-1', assunto: 'Dúvida sobre horas extras de abril', ultimaMensagem: 'Oi! As horas extras do mês passado não apareceram no contra-cheque...', horario: '09:14', naoLidas: 2, online: true },
  { id: 'th-2', remetente: 'Mariana Costa', remetenteId: 'usr-4', assunto: 'Solicitação de atestado médico', ultimaMensagem: 'Bom dia! Vou precisar enviar o atestado — como devo proceder?', horario: '08:42', naoLidas: 1, online: false },
  { id: 'th-3', remetente: 'Roberto Silva', remetenteId: 'usr-3', assunto: 'Férias — confirmação do período', ultimaMensagem: 'Já falei com meu gestor. Posso formalizar agora?', horario: 'Ontem', naoLidas: 0, online: false },
  { id: 'th-4', remetente: 'Ana Paula', remetenteId: 'usr-2', assunto: 'Documentação para atualização cadastral', ultimaMensagem: 'Mudei de endereço e preciso atualizar os dados no sistema.', horario: '22/05', naoLidas: 0, online: true },
  { id: 'th-5', remetente: 'Fernando Souza', remetenteId: 'usr-5', assunto: 'Dúvida sobre benefício farmácia', ultimaMensagem: 'Queria saber se o plano cobre medicamentos de uso contínuo.', horario: '21/05', naoLidas: 0, online: false },
];

export function loadThreads(companyId: string): ChatThread[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(k(THREADS_KEY, companyId));
    if (!raw) {
      const seed = THREADS_SEED.map(t => ({ ...t, createdAt: new Date().toISOString() }));
      localStorage.setItem(k(THREADS_KEY, companyId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as ChatThread[];
  } catch { return []; }
}

export function saveThreads(companyId: string, rows: ChatThread[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k(THREADS_KEY, companyId), JSON.stringify(rows));
}

export function appendThread(companyId: string, row: ChatThread) {
  const list = loadThreads(companyId);
  if (list.some(r => r.id === row.id)) return;
  list.unshift(row);
  saveThreads(companyId, list);
}

// ─── TICKETS ──────────────────────────────────────────────────────────────────

const TICKETS_SEED: Omit<TicketSuporte, 'createdAt'>[] = [
  { id: 'tkt-1', numero: '#0041', colaborador: 'Carlos Henrique', colaboradorId: 'usr-1', categoria: 'Ponto', titulo: 'Marcação de ponto não registrou dia 19/05', descricao: 'O sistema não registrou minha entrada no dia 19. O app deu erro na hora.', prioridade: 'Alta', status: 'Em atendimento', dataAbertura: '20/05/2026' },
  { id: 'tkt-2', numero: '#0040', colaborador: 'Ana Paula', colaboradorId: 'usr-2', categoria: 'Benefícios', titulo: 'Reembolso médico pendente há 30 dias', descricao: 'Enviei a nota fiscal em 20/04 e até hoje não recebi o reembolso.', prioridade: 'Alta', status: 'Em atendimento', dataAbertura: '19/05/2026' },
  { id: 'tkt-3', numero: '#0039', colaborador: 'Roberto Silva', colaboradorId: 'usr-3', categoria: 'Folha', titulo: 'Desconto indevido em folha de abril', descricao: 'Apareceu um desconto de R$ 250 sem descrição na folha do mês passado.', prioridade: 'Alta', status: 'Aberto', dataAbertura: '18/05/2026' },
  { id: 'tkt-4', numero: '#0038', colaborador: 'Mariana Costa', colaboradorId: 'usr-4', categoria: 'Documentação', titulo: 'Solicito declaração de renda para financiamento', descricao: 'Preciso com urgência para processo de compra de imóvel.', prioridade: 'Média', status: 'Resolvido', dataAbertura: '15/05/2026' },
  { id: 'tkt-5', numero: '#0037', colaborador: 'Fernando Souza', colaboradorId: 'usr-5', categoria: 'Benefícios', titulo: 'Dúvida sobre cobertura de dependentes no plano', descricao: 'Quero incluir minha esposa no plano mas não sei quais documentos preciso.', prioridade: 'Baixa', status: 'Resolvido', dataAbertura: '12/05/2026' },
  { id: 'tkt-6', numero: '#0036', colaborador: 'Juliana Pereira', colaboradorId: 'usr-6', categoria: 'Outros', titulo: 'Acesso ao portal do colaborador bloqueado', descricao: 'Não consigo fazer login desde a atualização do sistema.', prioridade: 'Média', status: 'Resolvido', dataAbertura: '10/05/2026' },
];

let ticketCounter = 42;

export function nextTicketNumber(): string {
  return `#${String(ticketCounter++).padStart(4, '0')}`;
}

export function loadTickets(companyId: string): TicketSuporte[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(k(TICKETS_KEY, companyId));
    if (!raw) {
      const seed = TICKETS_SEED.map(t => ({ ...t, createdAt: new Date().toISOString() }));
      localStorage.setItem(k(TICKETS_KEY, companyId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as TicketSuporte[];
  } catch { return []; }
}

export function saveTickets(companyId: string, rows: TicketSuporte[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k(TICKETS_KEY, companyId), JSON.stringify(rows));
}

export function appendTicket(companyId: string, row: TicketSuporte) {
  const list = loadTickets(companyId);
  if (list.some(r => r.id === row.id)) return;
  list.unshift(row);
  saveTickets(companyId, list);
}
