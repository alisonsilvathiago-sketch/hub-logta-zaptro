/**
 * Ativação modular pós-onboarding — persiste escolhas do cadastro e deriva
 * flags de funcionalidade, rotas liberadas e widgets (cliente; backend pode espelhar depois).
 */
import {
  loadOnboardingProfile,
  type OnboardingModuleId,
} from './onboardingStorage';

export const LOGTA_MODULE_ACTIVATION_STORAGE_KEY = 'logta-module-activation-v1';
export const LOGTA_MODULE_ACTIVATION_EVENT = 'logta-module-activation-updated';

/** Desafio principal escolhido no cadastro — guia prioridades de menu, IA e destaques. */
export const MAIN_CHALLENGE_IDS = [
  'organizacao',
  'financeiro',
  'entregas',
  'automacao',
  'clientes',
  'operacao',
] as const;

export type MainChallengeId = (typeof MAIN_CHALLENGE_IDS)[number];

export function isMainChallengeId(v: string | null | undefined): v is MainChallengeId {
  return !!v && (MAIN_CHALLENGE_IDS as readonly string[]).includes(v);
}

/** Módulos na ordem do onboarding (fallback “acesso total” para contas antigas). */
export const ALL_ONBOARDING_MODULE_IDS: OnboardingModuleId[] = [
  'financeiro',
  'crm',
  'operacoes',
  'frota',
  'rastreamento',
  'oficina',
  'hubchat',
  'ia',
  'logdock',
  'relatorios',
];

/** Funcionalidades ativadas por módulo (checklist do produto → flags estáveis p/ UI e futuras APIs). */
const MODULE_FEATURES: Record<OnboardingModuleId, string[]> = {
  financeiro: [
    'financeiro_contas',
    'financeiro_fluxo_caixa',
    'financeiro_faturamento',
    'financeiro_recebimentos',
    'financeiro_despesas',
    'financeiro_dashboards',
    'financeiro_relatorios',
    'financeiro_automacoes',
  ],
  crm: [
    'crm_clientes',
    'crm_pipeline',
    'crm_leads',
    'crm_funil_vendas',
    'crm_historico_comercial',
    'crm_atendimento',
    'crm_automacoes',
  ],
  operacoes: [
    'operacoes_fretes',
    'operacoes_entregas',
    'operacoes_painel',
    'operacoes_controle_logistico',
    'operacoes_ordens',
    'operacoes_timeline',
  ],
  frota: [
    'frota_veiculos',
    'frota_manutencao',
    'frota_combustivel',
    'frota_checklist',
    'frota_documentos',
    'frota_gestao',
  ],
  rastreamento: [
    'rastreamento_gps',
    'rastreamento_mapa_tempo_real',
    'rastreamento_alertas',
    'rastreamento_historico_rotas',
    'rastreamento_monitoramento_veiculos',
  ],
  oficina: [
    'oficina_ordens_servico',
    'oficina_pecas',
    'oficina_manutencao',
    'oficina_mecanicos',
    'oficina_agenda',
  ],
  hubchat: [
    'hubchat_interno',
    'hubchat_equipe',
    'hubchat_atendimento',
    'hubchat_mensagens',
    'hubchat_central',
  ],
  ia: [
    'ia_ollama_placeholder',
    'ia_assistente',
    'ia_chatbot',
    'ia_automacoes',
    'ia_fluxos_inteligentes',
    'ia_respostas_automaticas',
  ],
  logdock: [
    'logdock_armazenamento',
    'logdock_upload',
    'logdock_ocr',
    'logdock_pdf',
    'logdock_gestao_documental',
  ],
  relatorios: [
    'relatorios_bi_dashboards',
    'relatorios_exportacoes',
    'relatorios_analytics',
    'relatorios_indicadores',
    'relatorios_personalizados',
  ],
};

/** Integrações / automações preparadas no cliente (extensível). */
const MODULE_INTEGRATIONS: Record<OnboardingModuleId, string[]> = {
  financeiro: ['finance_webhooks', 'boleto_export'],
  crm: ['crm_sync', 'email_pipeline'],
  operacoes: ['tms_bridge', 'tracking_feed'],
  frota: ['fuel_cards', 'maintenance_api'],
  rastreamento: ['gps_provider', 'geofence_alerts'],
  oficina: ['parts_catalog', 'service_reminders'],
  hubchat: ['team_notifications'],
  ia: ['assistant_playbooks', 'workflow_triggers'],
  logdock: ['document_scan', 'drive_sync'],
  relatorios: ['bi_exports', 'scheduled_reports'],
};

const MODULE_AUTOMATIONS: Record<OnboardingModuleId, string[]> = {
  financeiro: ['cobranca_lembrete', 'conciliacao_sugerida'],
  crm: ['lead_followup', 'pipeline_stage_alert'],
  operacoes: ['status_entrega', 'atraso_rota'],
  frota: ['revisao_preventiva', 'documento_vencendo'],
  rastreamento: ['alerta_velocidade', 'entrada_cerca'],
  oficina: ['os_atrasada', 'peca_estoque_baixo'],
  hubchat: ['mencao_equipe'],
  ia: ['resumo_diario', 'sugestao_resposta'],
  logdock: ['ocr_fila', 'vencimento_doc'],
  relatorios: ['relatorio_semanal_email'],
};

const MODULE_DASHBOARD_WIDGETS: Record<OnboardingModuleId, string[]> = {
  financeiro: ['widget_finance_kpi', 'widget_fluxo_caixa'],
  crm: ['widget_pipeline', 'widget_leads'],
  operacoes: ['widget_fretes_ativos', 'widget_entregas'],
  frota: ['widget_frota_status', 'widget_manutencao'],
  rastreamento: ['widget_mapa_resumo', 'widget_alertas'],
  oficina: ['widget_os_abertas', 'widget_agenda_oficina'],
  hubchat: ['widget_mensagens_pendentes'],
  ia: ['widget_assistente_atalhos'],
  logdock: ['widget_documentos_recentes'],
  relatorios: ['widget_indicadores_gerais'],
};

/**
 * Rota → precisa de ao menos um destes módulos.
 * `anyOf: []` = núcleo sempre liberado.
 */
export const ROUTE_MODULE_RULES: { prefix: string; anyOf: OnboardingModuleId[] }[] = [
  { prefix: '/crm', anyOf: ['crm'] },
  { prefix: '/fretes', anyOf: ['operacoes'] },
  { prefix: '/roteirizacao', anyOf: ['operacoes', 'rastreamento'] },
  { prefix: '/mapa-ao-vivo', anyOf: ['rastreamento'] },
  { prefix: '/frota', anyOf: ['frota', 'oficina'] },
  { prefix: '/pgr', anyOf: ['frota', 'operacoes'] },
  { prefix: '/documentos', anyOf: ['logdock'] },
  { prefix: '/financeiro', anyOf: ['financeiro'] },
  { prefix: '/rh', anyOf: ['crm', 'hubchat'] },
  { prefix: '/relatorios', anyOf: ['relatorios'] },
  { prefix: '/automacoes', anyOf: ['ia'] },
  { prefix: '/agenda', anyOf: ['oficina', 'hubchat', 'operacoes'] },
];

const ALWAYS_ALLOWED_PREFIXES = [
  '/inicio',
  '/dashboard',
  '/perfil',
  '/admin-settings',
  '/permissoes',
  '/ajuda',
];

const DEFAULT_MENU_TAIL = [
  '/dashboard',
  '/crm',
  '/fretes',
  '/roteirizacao',
  '/frota',
  '/pgr',
  '/documentos',
  '/financeiro',
  '/rh',
] as const;

function featureKeyModule(key: string): OnboardingModuleId | null {
  for (const mod of ALL_ONBOARDING_MODULE_IDS) {
    if (MODULE_FEATURES[mod].includes(key)) return mod;
  }
  return null;
}

/**
 * Plano por desafio: ordem de menu, boosts (só aplicam se o módulo dono estiver ativo),
 * widgets/automações/integrações extras e perguntas iniciais da IA.
 */
const CHALLENGE_BLUEPRINT: Record<
  MainChallengeId,
  {
    menuPathPriority: string[];
    featureBoostCandidates: string[];
    widgetBoosts: string[];
    automationBoosts: string[];
    integrationBoosts: string[];
    iaStarterQueries: IaStarterQueryV1[];
    tutorialEmphasis: string[];
  }
> = {
  organizacao: {
    menuPathPriority: ['/inicio', '/dashboard', '/fretes', '/roteirizacao', '/frota', '/pgr', '/documentos', '/crm', '/financeiro', '/rh'],
    featureBoostCandidates: [
      'operacoes_painel',
      'operacoes_ordens',
      'frota_checklist',
      'logdock_gestao_documental',
      'operacoes_timeline',
    ],
    widgetBoosts: ['widget_challenge_organizacao_central', 'widget_tarefas_pendentes'],
    automationBoosts: ['checklist_diario_operacao', 'padrao_documento_sugerido'],
    integrationBoosts: ['operational_calendar_feed'],
    iaStarterQueries: [
      { label: 'Padronizar processos', icon: 'layout', query: 'Como padronizar o fluxo operacional da minha transportadora?' },
      { label: 'Checklist do dia', icon: 'package', query: 'Quais tarefas operacionais estão pendentes para hoje?' },
      { label: 'Fluxo ideal', icon: 'truck', query: 'Qual seria o fluxo logístico ideal para minha operação atual?' },
    ],
    tutorialEmphasis: ['central_organizacional', 'checklist_inteligente', 'fluxo_operacional'],
  },
  financeiro: {
    menuPathPriority: ['/inicio', '/financeiro', '/dashboard', '/documentos', '/crm', '/fretes', '/roteirizacao', '/frota', '/pgr', '/rh'],
    featureBoostCandidates: [
      'financeiro_fluxo_caixa',
      'financeiro_recebimentos',
      'financeiro_faturamento',
      'financeiro_automacoes',
      'financeiro_dashboards',
      'financeiro_relatorios',
    ],
    widgetBoosts: ['widget_challenge_finance_kpi', 'widget_inadimplencia_alerta'],
    automationBoosts: ['cobranca_lembrete', 'alerta_fluxo_negativo'],
    integrationBoosts: ['finance_webhooks', 'boleto_export'],
    iaStarterQueries: [
      { label: 'Fluxo de caixa', icon: 'dollar', query: 'Como está meu fluxo de caixa nesta semana?' },
      { label: 'Contas a receber', icon: 'dollar', query: 'Quais recebimentos estão atrasados ou a vencer?' },
      { label: 'Faturamento', icon: 'layout', query: 'Resumo de faturamento e inadimplência do mês.' },
    ],
    tutorialEmphasis: ['fluxo_caixa', 'cobranca', 'indicadores_financeiros'],
  },
  entregas: {
    menuPathPriority: ['/inicio', '/fretes', '/roteirizacao', '/frota', '/pgr', '/dashboard', '/crm', '/documentos', '/financeiro', '/rh'],
    featureBoostCandidates: [
      'operacoes_entregas',
      'operacoes_timeline',
      'rastreamento_mapa_tempo_real',
      'rastreamento_monitoramento_veiculos',
      'operacoes_controle_logistico',
    ],
    widgetBoosts: ['widget_entregas_dia', 'widget_mapa_resumo_entregas'],
    automationBoosts: ['status_entrega', 'atraso_rota', 'alerta_entrega'],
    integrationBoosts: ['tracking_feed', 'geofence_alerts'],
    iaStarterQueries: [
      { label: 'Entregas do dia', icon: 'package', query: 'Quais entregas estão em rota ou atrasadas hoje?' },
      { label: 'Monitoramento', icon: 'map', query: 'Como está o monitoramento das minhas entregas em tempo real?' },
      { label: 'Produtividade', icon: 'truck', query: 'Como melhorar a produtividade da última milha?' },
    ],
    tutorialEmphasis: ['timeline_entregas', 'rastreamento', 'controle_entregas'],
  },
  automacao: {
    menuPathPriority: ['/inicio', '/dashboard', '/fretes', '/financeiro', '/crm', '/frota', '/roteirizacao', '/pgr', '/documentos', '/rh'],
    featureBoostCandidates: [
      'ia_assistente',
      'ia_automacoes',
      'ia_fluxos_inteligentes',
      'ia_chatbot',
      'ia_respostas_automaticas',
      'operacoes_ordens',
      'financeiro_automacoes',
    ],
    widgetBoosts: ['widget_automacoes_sugeridas', 'widget_ia_atalhos'],
    automationBoosts: ['resumo_diario', 'workflow_triggers', 'sugestao_resposta'],
    integrationBoosts: ['assistant_playbooks', 'workflow_triggers'],
    iaStarterQueries: [
      { label: 'Automatizar tarefas', icon: 'cpu', query: 'Quais tarefas manuais posso automatizar primeiro na Logta?' },
      { label: 'Fluxos inteligentes', icon: 'layout', query: 'Sugira fluxos inteligentes para minha operação.' },
      { label: 'Menos trabalho manual', icon: 'users', query: 'Como reduzir trabalho manual entre financeiro e operação?' },
    ],
    tutorialEmphasis: ['assistente_ia', 'chatbot', 'fluxos_inteligentes'],
  },
  clientes: {
    menuPathPriority: ['/inicio', '/crm', '/rh', '/dashboard', '/fretes', '/financeiro', '/roteirizacao', '/frota', '/pgr', '/documentos'],
    featureBoostCandidates: [
      'crm_pipeline',
      'crm_leads',
      'crm_funil_vendas',
      'crm_atendimento',
      'crm_historico_comercial',
      'hubchat_atendimento',
    ],
    widgetBoosts: ['widget_pipeline_prioridade', 'widget_leads_quentes'],
    automationBoosts: ['lead_followup', 'pipeline_stage_alert'],
    integrationBoosts: ['crm_sync', 'whatsapp_placeholder'],
    iaStarterQueries: [
      { label: 'Pipeline', icon: 'users', query: 'Como está meu funil de vendas e pipeline hoje?' },
      { label: 'Atendimento', icon: 'layout', query: 'Resumo de atendimento e follow-up com clientes.' },
      { label: 'Relacionamento', icon: 'dollar', query: 'Como priorizar clientes com maior potencial de receita?' },
    ],
    tutorialEmphasis: ['crm', 'funil_vendas', 'comunicacao_cliente'],
  },
  operacao: {
    menuPathPriority: ['/inicio', '/fretes', '/frota', '/roteirizacao', '/pgr', '/dashboard', '/crm', '/documentos', '/financeiro', '/rh'],
    featureBoostCandidates: [
      'operacoes_painel',
      'operacoes_fretes',
      'operacoes_timeline',
      'frota_veiculos',
      'frota_gestao',
      'operacoes_controle_logistico',
    ],
    widgetBoosts: ['widget_painel_operacional', 'widget_cargas_motoristas'],
    automationBoosts: ['status_entrega', 'documento_vencendo'],
    integrationBoosts: ['tms_bridge'],
    iaStarterQueries: [
      { label: 'Cargas ativas', icon: 'package', query: 'Quantas cargas estão ativas e quais precisam de atenção?' },
      { label: 'Motoristas', icon: 'truck', query: 'Status dos motoristas e frota disponível agora.' },
      { label: 'Eficiência', icon: 'layout', query: 'Como aumentar a eficiência operacional da minha logística?' },
    ],
    tutorialEmphasis: ['painel_operacional', 'cargas', 'frota'],
  },
};

/** Ordem neutra + IA genérica quando não há desafio salvo. */
const DEFAULT_CHALLENGE_BLUEPRINT = {
  menuPathPriority: ['/inicio', ...DEFAULT_MENU_TAIL],
  featureBoostCandidates: [] as string[],
  widgetBoosts: [] as string[],
  automationBoosts: [] as string[],
  integrationBoosts: [] as string[],
  iaStarterQueries: [
    { label: 'Resumo da frota', icon: 'truck' as const, query: 'Qual o status da minha frota hoje?' },
    { label: 'Contas da semana', icon: 'dollar' as const, query: 'Quais as contas a pagar desta semana?' },
    { label: 'Equipe em rota', icon: 'users' as const, query: 'Quantos motoristas estão em viagem agora?' },
  ],
  tutorialEmphasis: ['visao_geral_logta'],
};

function buildChallengePlan(
  moduleIds: OnboardingModuleId[],
  challenge: MainChallengeId | null,
): ChallengePlanV1 {
  const set = new Set(moduleIds);
  const bp = challenge != null ? CHALLENGE_BLUEPRINT[challenge] : DEFAULT_CHALLENGE_BLUEPRINT;
  const boostedFeatures = bp.featureBoostCandidates.filter((k) => {
    const m = featureKeyModule(k);
    return !m || set.has(m);
  });
  return {
    menuPathPriority: [...bp.menuPathPriority],
    boostedFeatures,
    widgetBoosts: [...bp.widgetBoosts],
    automationBoosts: [...bp.automationBoosts],
    integrationBoosts: [...bp.integrationBoosts],
    iaStarterQueries: [...bp.iaStarterQueries],
    tutorialEmphasis: [...bp.tutorialEmphasis],
  };
}

export type IaStarterQueryV1 = {
  label: string;
  query: string;
  /** Chave para mapear ícone na UI (ex.: Início). */
  icon: 'layout' | 'dollar' | 'users' | 'truck' | 'cpu' | 'package' | 'map' | 'file';
};

export type ChallengePlanV1 = {
  /** Ordem desejada no menu lateral (paths). */
  menuPathPriority: string[];
  /** Flags de produto já filtradas pelos módulos ativos. */
  boostedFeatures: string[];
  widgetBoosts: string[];
  automationBoosts: string[];
  integrationBoosts: string[];
  iaStarterQueries: IaStarterQueryV1[];
  /** Tópicos para copy / tutorial futuro. */
  tutorialEmphasis: string[];
};

export type LogtaModuleActivationV1 = {
  version: 1;
  activatedAt: string;
  moduleIds: OnboardingModuleId[];
  /** Desafio principal do onboarding (ou perfil legado). */
  mainChallenge: MainChallengeId | null;
  challengePlan: ChallengePlanV1;
  features: Record<string, boolean>;
  dashboardWidgets: string[];
  integrationsReady: string[];
  automationsReady: string[];
  navigationPrepared: boolean;
  tutorialSuggested: boolean;
};

function sortedRouteRules(): { prefix: string; anyOf: OnboardingModuleId[] }[] {
  return [...ROUTE_MODULE_RULES].sort((a, b) => b.prefix.length - a.prefix.length);
}

export function buildFeatureMap(moduleIds: OnboardingModuleId[]): Record<string, boolean> {
  const features: Record<string, boolean> = {};
  const set = new Set(moduleIds);
  for (const id of ALL_ONBOARDING_MODULE_IDS) {
    if (!set.has(id)) continue;
    for (const k of MODULE_FEATURES[id]) {
      features[k] = true;
    }
  }
  return features;
}

export function buildActivationSnapshot(
  moduleIds: OnboardingModuleId[],
  mainChallenge?: string | null,
): LogtaModuleActivationV1 {
  const challenge: MainChallengeId | null = isMainChallengeId(mainChallenge) ? mainChallenge : null;
  const plan = buildChallengePlan(moduleIds, challenge);
  const set = new Set(moduleIds);
  const dashboardWidgets: string[] = [...plan.widgetBoosts];
  const integrationsReady: string[] = [...plan.integrationBoosts];
  const automationsReady: string[] = [...plan.automationBoosts];

  for (const id of ALL_ONBOARDING_MODULE_IDS) {
    if (!set.has(id)) continue;
    dashboardWidgets.push(...MODULE_DASHBOARD_WIDGETS[id]);
    integrationsReady.push(...MODULE_INTEGRATIONS[id]);
    automationsReady.push(...MODULE_AUTOMATIONS[id]);
  }

  const features = buildFeatureMap(moduleIds);
  for (const k of plan.boostedFeatures) {
    features[k] = true;
  }
  if (challenge) {
    features[`challenge_focus_${challenge}`] = true;
  }

  return {
    version: 1,
    activatedAt: new Date().toISOString(),
    moduleIds: [...moduleIds],
    mainChallenge: challenge,
    challengePlan: plan,
    features,
    dashboardWidgets: [...new Set(dashboardWidgets)],
    integrationsReady: [...new Set(integrationsReady)],
    automationsReady: [...new Set(automationsReady)],
    navigationPrepared: true,
    tutorialSuggested: true,
  };
}

export function saveLogtaModuleActivation(snapshot: LogtaModuleActivationV1): void {
  try {
    localStorage.setItem(LOGTA_MODULE_ACTIVATION_STORAGE_KEY, JSON.stringify(snapshot));
    window.dispatchEvent(new CustomEvent(LOGTA_MODULE_ACTIVATION_EVENT, { detail: snapshot }));
  } catch {
    /* quota */
  }
}

export function loadLogtaModuleActivation(): LogtaModuleActivationV1 | null {
  try {
    const raw = localStorage.getItem(LOGTA_MODULE_ACTIVATION_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<LogtaModuleActivationV1>;
    if (p?.version !== 1 || !Array.isArray(p.moduleIds)) return null;
    return p as LogtaModuleActivationV1;
  } catch {
    return null;
  }
}

/** Contas antigas: sem snapshot nem módulos no perfil → tudo liberado. */
export function getEffectiveModuleIds(): OnboardingModuleId[] {
  const snap = loadLogtaModuleActivation();
  if (snap?.moduleIds?.length) return snap.moduleIds;
  const profile = loadOnboardingProfile();
  if (profile?.modules?.length) return profile.modules;
  return [...ALL_ONBOARDING_MODULE_IDS];
}

/** Desafio efetivo: snapshot (cadastro) ou perfil de onboarding. */
export function getEffectiveMainChallenge(): MainChallengeId | null {
  const snap = loadLogtaModuleActivation();
  if (snap && isMainChallengeId(snap.mainChallenge)) return snap.mainChallenge;
  const profile = loadOnboardingProfile();
  if (profile && isMainChallengeId(profile.mainChallenge)) return profile.mainChallenge;
  return null;
}

function activationNeedsRebuild(
  stored: LogtaModuleActivationV1 | null,
  moduleIds: OnboardingModuleId[],
  mainChallenge: MainChallengeId | null,
): boolean {
  if (!stored?.challengePlan?.menuPathPriority?.length) return true;
  if (!sameModuleIdSet(stored.moduleIds, moduleIds)) return true;
  return (stored.mainChallenge ?? null) !== (mainChallenge ?? null);
}

export function getEffectiveActivation(): LogtaModuleActivationV1 {
  const ids = getEffectiveModuleIds();
  const ch = getEffectiveMainChallenge();
  const existing = loadLogtaModuleActivation();
  if (existing && !activationNeedsRebuild(existing, ids, ch)) {
    return existing;
  }
  return buildActivationSnapshot(ids, ch);
}

/** Ordena itens do menu conforme plano do desafio (mantém estabilidade para paths fora da lista). */
export function sortSidebarItemsByChallengePlan<T extends { path: string }>(
  items: T[],
  menuPathPriority: string[],
): T[] {
  const order = new Map(menuPathPriority.map((p, i) => [p, i]));
  return [...items]
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const ia = order.has(a.item.path) ? order.get(a.item.path)! : 500 + a.i;
      const ib = order.has(b.item.path) ? order.get(b.item.path)! : 500 + b.i;
      return ia - ib;
    })
    .map(({ item }) => item);
}

/**
 * Prioridade extra só a partir dos módulos ativos (ex.: Ops+Frota+Rastreamento → fretes, mapa, frota).
 * Combina com o plano do desafio em `mergeMenuPriorities`.
 */
export function getModuleMenuBoostPaths(moduleIds: OnboardingModuleId[]): string[] {
  const s = new Set(moduleIds);
  const out: string[] = [];
  const add = (...paths: string[]) => {
    for (const p of paths) {
      if (!out.includes(p)) out.push(p);
    }
  };

  if (s.has('operacoes') && s.has('frota') && s.has('rastreamento')) {
    add('/fretes', '/roteirizacao', '/frota', '/mapa-ao-vivo');
  }
  if (s.has('financeiro') && s.has('crm')) {
    add('/financeiro', '/crm', '/relatorios');
  }
  if (s.has('operacoes') && s.has('rastreamento')) {
    add('/fretes', '/mapa-ao-vivo', '/roteirizacao');
  }
  if (s.has('operacoes') && s.has('frota')) {
    add('/fretes', '/frota', '/roteirizacao');
  }
  if (s.has('rastreamento')) {
    add('/mapa-ao-vivo', '/roteirizacao');
  }
  if (s.has('operacoes')) {
    add('/fretes', '/roteirizacao');
  }
  if (s.has('frota') || s.has('oficina')) {
    add('/frota');
  }
  if (s.has('financeiro')) {
    add('/financeiro');
  }
  if (s.has('crm')) {
    add('/crm');
  }
  if (s.has('relatorios')) {
    add('/relatorios');
  }
  if (s.has('ia')) {
    add('/automacoes');
  }
  return out;
}

/** Módulo primeiro, depois desafio — sem duplicar paths. */
export function mergeMenuPriorities(moduleBoostPaths: string[], challengePaths: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of moduleBoostPaths) {
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  for (const p of challengePaths) {
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

export function sameModuleIdSet(a: OnboardingModuleId[], b: OnboardingModuleId[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  return b.every((id) => sa.has(id));
}

export function isPathAllowedForUser(
  pathname: string, 
  moduleIds: OnboardingModuleId[], 
  userProfile?: { cargo?: string | null; setor?: string | null; nivel_acesso?: number | null; permissoes?: any }
): boolean {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (ALWAYS_ALLOWED_PREFIXES.some((p) => normalized === p || normalized.startsWith(`${p}/`))) {
    return true;
  }

  // Admin global bypass
  const cargo = userProfile?.cargo?.toLowerCase() ?? '';
  if (
    userProfile?.nivel_acesso === 4 ||
    cargo === 'admin' ||
    cargo.includes('admin') ||
    cargo.includes('diretor')
  ) {
    return true;
  }

  // Sem setor/nível definido (conta demo / perfil incompleto) — não bloquear rotas no cliente
  if (!userProfile?.setor && userProfile?.nivel_acesso == null) {
    return true;
  }

  // Check module rules first
  const set = new Set(moduleIds);
  let ruleFound = false;
  for (const { prefix, anyOf } of sortedRouteRules()) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      ruleFound = true;
      if (anyOf.length > 0 && !anyOf.some((m) => set.has(m))) {
        return false;
      }
    }
  }

  // Granular permission check
  if (userProfile?.permissoes) {
    const p = userProfile.permissoes;
    
    if (normalized.startsWith('/financeiro') && p.financeiro?.verFinanceiro === false) return false;
    if (normalized.startsWith('/crm') && p.crm?.verClientes === false) return false;
    if (normalized.startsWith('/fretes') && p.fretes?.verFretes === false) return false;
    if (normalized.startsWith('/frota') && p.frota?.verVeiculos === false) return false;
    if (normalized.startsWith('/rh') && p.rh?.verFuncionarios === false) return false;
    if (normalized.startsWith('/configuracoes') && p.configuracoes?.configuracoesGerais === false) return false;
  }

  // Sector logic: hide things that definitely don't belong
  if (userProfile?.setor) {
    const sector = userProfile.setor.toLowerCase();
    if (sector === 'financeiro' && (normalized.startsWith('/oficina') || normalized.startsWith('/rastreamento'))) {
      return false;
    }
    if (sector === 'operacional' && normalized.startsWith('/financeiro')) {
      return false;
    }
  }

  // Sector based restrictions for non-admins
  if (userProfile && (userProfile.nivel_acesso || 0) < 3) {
    const sector = userProfile.setor?.toLowerCase();
    if (normalized.startsWith('/financeiro') && sector !== 'financeiro') return false;
    if (normalized.startsWith('/crm') && sector !== 'comercial' && sector !== 'vendas') return false;
    if (normalized.startsWith('/fretes') && sector !== 'logistica' && sector !== 'operacional') return false;
    if (normalized.startsWith('/frota') && sector !== 'logistica' && sector !== 'manutencao') return false;
    if (normalized.startsWith('/rh') && sector !== 'rh' && sector !== 'administrativo') return false;
  }

  return true;
}

export function isPathAllowedForModules(pathname: string, moduleIds: OnboardingModuleId[]): boolean {
  return isPathAllowedForUser(pathname, moduleIds);
}

export function applyModuleActivationFromOnboarding(
  moduleIds: OnboardingModuleId[],
  mainChallenge?: string | null,
): LogtaModuleActivationV1 {
  const snapshot = buildActivationSnapshot(moduleIds, mainChallenge);
  saveLogtaModuleActivation(snapshot);
  return snapshot;
}
