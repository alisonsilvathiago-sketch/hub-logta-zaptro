import { resolveLogtaRole, type LogtaPermissionModule } from '../../lib/logtaPermissions';
import type { AgendaEvent, AgendaEventDomain, AgendaFilterId } from './types';

const DOMAIN_TO_MODULE: Partial<Record<AgendaEventDomain, LogtaPermissionModule>> = {
  rh: 'rh',
  financeiro: 'financeiro',
  crm: 'crm',
  frota: 'frota',
  fretes: 'fretes',
  logistica: 'fretes',
  operacional: 'fretes',
  documentos: 'documentos',
  alertas: 'relatorios',
  reuniao: 'crm',
  contrato: 'crm',
  manual: 'crm',
  ia: 'relatorios',
};

const ROLE_DOMAINS: Record<string, AgendaEventDomain[] | '*'> = {
  admin: '*',
  gerente: ['rh', 'financeiro', 'crm', 'frota', 'fretes', 'logistica', 'operacional', 'documentos', 'alertas', 'reuniao', 'contrato', 'ia', 'manual'],
  financeiro: ['financeiro', 'documentos', 'alertas', 'contrato', 'ia'],
  operador: ['crm', 'fretes', 'logistica', 'operacional', 'frota', 'documentos', 'reuniao', 'manual'],
  suporte: ['crm', 'fretes', 'documentos', 'reuniao', 'alertas'],
  cliente: ['crm', 'reuniao'],
  leitura: ['reuniao', 'manual'],
};

export function canViewAgendaDomain(
  domain: AgendaEventDomain,
  profile: { role?: string | null; cargo?: string | null; nivel_acesso?: number | null; permissions?: Record<string, boolean> | null } | null,
): boolean {
  const role = resolveLogtaRole(profile);
  const access = ROLE_DOMAINS[role] ?? ROLE_DOMAINS.operador;
  if (access === '*') return true;

  const mod = DOMAIN_TO_MODULE[domain];
  if (profile?.permissions && mod && mod in profile.permissions) {
    return Boolean(profile.permissions[mod]);
  }

  return access.includes(domain);
}

export function filterAgendaEventsByPermission(
  events: AgendaEvent[],
  profile: Parameters<typeof canViewAgendaDomain>[1],
): AgendaEvent[] {
  return events.filter((e) => canViewAgendaDomain(e.domain, profile));
}

export function matchesAgendaFilter(event: AgendaEvent, filter: AgendaFilterId): boolean {
  if (filter === 'criticos') return event.priority === 'critical' || event.priority === 'high';
  if (filter === 'operacional') {
    return ['fretes', 'logistica', 'operacional', 'frota'].includes(event.domain);
  }
  if (filter === 'ia') return event.domain === 'ia' || event.category.includes('ia');
  return event.domain === filter;
}
