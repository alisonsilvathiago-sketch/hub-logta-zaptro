export type OperationalTenantMode = 'stock' | 'full';

export type FlowDayRule = {
  /** 0=dom … 6=sáb — dia em que a equipe trabalha */
  weekday: number;
  /** Dias de venda processados neste dia (0=dom … 6=sáb) */
  processSaleDays: number[];
  /** Horário limite para saída do dia */
  dailyCutoff: string;
  /** Horário limite para pendências de dias anteriores */
  backlogCutoff: string;
  /** Janela de entrega / coleta (opcional) */
  deliveryWindow?: string;
  /** Produtos ou famílias prioritárias neste dia (texto livre) */
  productFocus?: string;
  /** Lojas/empresas específicas — vazio = todas */
  storeIds?: string[];
  /** SKUs prioritários neste dia — vazio = todos (usa productFocus como filtro textual) */
  productSkus?: string[];
  note?: string;
};

export type OperationalProfileConfig = {
  mode: OperationalTenantMode;
  fridayCutoff: string;
  weekendBatchOnMonday: boolean;
  useCustomFlow: boolean;
  /** manual = editor local · api = ERP/canais · hybrid = ambos */
  flowSyncMode?: 'manual' | 'api' | 'hybrid';
  flowRules: FlowDayRule[];
};

const STORAGE_PREFIX = 'logstoka-operational-profile';

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAY_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const DEFAULT_FLOW_RULES: FlowDayRule[] = [
  { weekday: 0, processSaleDays: [0], dailyCutoff: '12:00', backlogCutoff: '12:00', note: 'Acumula para terça' },
  { weekday: 1, processSaleDays: [5, 6], dailyCutoff: '16:00', backlogCutoff: '12:00', note: 'Lote sexta + sábado' },
  { weekday: 2, processSaleDays: [0, 1], dailyCutoff: '15:00', backlogCutoff: '12:00', note: 'Domingo + segunda' },
  { weekday: 3, processSaleDays: [2, 3], dailyCutoff: '16:00', backlogCutoff: '12:00', note: 'Terça + quarta' },
  { weekday: 4, processSaleDays: [3, 4], dailyCutoff: '16:00', backlogCutoff: '12:00', note: 'Pendências e atrasos' },
  { weekday: 5, processSaleDays: [4, 5], dailyCutoff: '17:48', backlogCutoff: '12:00', note: 'Encerramento sexta' },
  { weekday: 6, processSaleDays: [6], dailyCutoff: '12:00', backlogCutoff: '12:00', note: 'Acumula para segunda' },
];

export const DEFAULT_OPERATIONAL_PROFILE: OperationalProfileConfig = {
  mode: 'stock',
  fridayCutoff: '17:48',
  weekendBatchOnMonday: true,
  useCustomFlow: false,
  flowRules: DEFAULT_FLOW_RULES,
};

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}:${companyId}`;
}

function normalizeFlowRules(rules?: FlowDayRule[]): FlowDayRule[] {
  if (!rules?.length) return DEFAULT_FLOW_RULES;
  const byDay = new Map<number, FlowDayRule>();
  for (const rule of DEFAULT_FLOW_RULES) byDay.set(rule.weekday, { ...rule });
  for (const rule of rules) {
    const base = byDay.get(rule.weekday) ?? DEFAULT_FLOW_RULES[rule.weekday]!;
    byDay.set(rule.weekday, { ...base, ...rule });
  }
  return [...byDay.values()].sort((a, b) => a.weekday - b.weekday);
}

export function loadOperationalProfile(companyId: string | null): OperationalProfileConfig {
  if (!companyId || typeof window === 'undefined') return DEFAULT_OPERATIONAL_PROFILE;
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    if (!raw) return DEFAULT_OPERATIONAL_PROFILE;
    const parsed = JSON.parse(raw) as Partial<OperationalProfileConfig>;
    return {
      ...DEFAULT_OPERATIONAL_PROFILE,
      ...parsed,
      flowRules: normalizeFlowRules(parsed.flowRules),
    };
  } catch {
    return DEFAULT_OPERATIONAL_PROFILE;
  }
}

export function saveOperationalProfile(companyId: string, profile: OperationalProfileConfig): void {
  try {
    window.localStorage.setItem(
      storageKey(companyId),
      JSON.stringify({ ...profile, flowRules: normalizeFlowRules(profile.flowRules) }),
    );
  } catch {
    /* ignore */
  }
}

export function operationalModeLabel(mode: OperationalTenantMode): string {
  return mode === 'stock' ? 'Somente estoque' : 'Estoque + canais';
}

export function saleDayLabel(weekday: number): string {
  return WEEKDAY_FULL[weekday] ?? '—';
}

export function getFlowRuleForDay(
  profile: OperationalProfileConfig,
  weekday: number,
): FlowDayRule {
  return (
    profile.flowRules.find((r) => r.weekday === weekday) ??
    DEFAULT_FLOW_RULES[weekday] ??
    DEFAULT_FLOW_RULES[1]!
  );
}

/** Dia da semana em que a venda deve ser processada/expedida */
export function dueProcessWeekdayFromProfile(
  saleWeekday: number,
  profile: OperationalProfileConfig,
): number {
  for (const rule of profile.flowRules) {
    if (rule.processSaleDays.includes(saleWeekday)) return rule.weekday;
  }
  if (saleWeekday === 5 || saleWeekday === 6) return 1;
  if (saleWeekday === 0) return 2;
  return Math.min(saleWeekday + 1, 6);
}

function parseTimeToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function isOrderLateByProfile(
  saleWeekday: number,
  dueWeekday: number,
  profile: OperationalProfileConfig,
  now = new Date(),
  isOpen = true,
): boolean {
  if (!isOpen) return false;

  const today = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (today > dueWeekday) return true;
  if (today < dueWeekday) return false;

  const rule = getFlowRuleForDay(profile, today);
  const isBacklog = saleWeekday !== today && rule.processSaleDays.includes(saleWeekday);
  const cutoff = isBacklog ? rule.backlogCutoff : rule.dailyCutoff;
  return nowMinutes > parseTimeToMinutes(cutoff);
}

export type DayFlowPlan = {
  weekday: number;
  weekdayLabel: string;
  weekdayShort: string;
  isToday: boolean;
  processSaleDays: string[];
  processSaleDayNumbers: number[];
  dailyCutoff: string;
  backlogCutoff: string;
  note: string;
  productFocus?: string;
  storeIds?: string[];
  productSkus?: string[];
};

export function buildWeeklyFlowPlan(
  profile: OperationalProfileConfig,
  date = new Date(),
): DayFlowPlan[] {
  const today = date.getDay();

  return profile.flowRules.map((rule) => ({
    weekday: rule.weekday,
    weekdayLabel: WEEKDAY_FULL[rule.weekday] ?? '—',
    weekdayShort: WEEKDAY_SHORT[rule.weekday] ?? '—',
    isToday: rule.weekday === today,
    processSaleDays: rule.processSaleDays.map(saleDayLabel),
    processSaleDayNumbers: [...rule.processSaleDays],
    dailyCutoff: rule.dailyCutoff,
    backlogCutoff: rule.backlogCutoff,
    note: rule.note ?? '',
    productFocus: rule.productFocus,
    storeIds: rule.storeIds?.length ? [...rule.storeIds] : undefined,
    productSkus: rule.productSkus?.length ? [...rule.productSkus] : undefined,
  }));
}

export function getTodayFlowPlan(
  profile: OperationalProfileConfig,
  date = new Date(),
): DayFlowPlan {
  const today = date.getDay();
  const plans = buildWeeklyFlowPlan(profile, date);
  return plans.find((p) => p.weekday === today) ?? plans[1]!;
}
