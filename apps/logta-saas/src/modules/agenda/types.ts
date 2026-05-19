export type AgendaEventDomain =
  | 'rh'
  | 'financeiro'
  | 'crm'
  | 'frota'
  | 'fretes'
  | 'logistica'
  | 'operacional'
  | 'documentos'
  | 'alertas'
  | 'reuniao'
  | 'contrato'
  | 'ia'
  | 'manual';

export type AgendaEventPriority = 'critical' | 'high' | 'medium' | 'low';

export type AgendaEvent = {
  id: string;
  title: string;
  description?: string;
  start: string;
  end?: string;
  allDay?: boolean;
  domain: AgendaEventDomain;
  category: string;
  priority: AgendaEventPriority;
  /** Classes Tailwind para o pill no grid (fundo + texto) */
  pillClass: string;
  dotClass: string;
  actionPath?: string;
  actionLabel?: string;
  participantName?: string;
  participantId?: string;
  amount?: number;
  status?: string;
  area?: string;
  sourceModule?: string;
};

export type AgendaCalendarSource = {
  id: AgendaEventDomain | 'all';
  name: string;
  color: string;
  domains: AgendaEventDomain[];
};

export type AgendaFilterId =
  | 'rh'
  | 'financeiro'
  | 'crm'
  | 'frota'
  | 'fretes'
  | 'operacional'
  | 'reuniao'
  | 'contrato'
  | 'alertas'
  | 'ia'
  | 'criticos';

export type AgendaAlert = {
  id: string;
  title: string;
  message: string;
  priority: AgendaEventPriority;
  eventDate: string;
  actionPath?: string;
};

export type AgendaInsight = {
  id: string;
  title: string;
  detail: string;
  tone: 'risk' | 'info' | 'success';
};

export type AgendaDayMemory = {
  dateKey: string;
  events: AgendaEvent[];
  summary: string;
};
