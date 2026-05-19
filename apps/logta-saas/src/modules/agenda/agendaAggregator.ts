import type { MotoristaRow, TransactionRow } from '../../contexts/OperationalDataContext';
import type { ShipmentNormalized } from '../fretes/types';
import { loadPontoRecords } from '../rh/ponto/pontoStorage';
import { loadManualAgendaEvents } from './agendaStorage';
import type { AgendaEvent } from './types';

type AggregateInput = {
  companyId: string;
  profiles: { id: string; full_name?: string; email?: string; role?: string }[];
  motoristas: MotoristaRow[];
  transactions: TransactionRow[];
  shipments: ShipmentNormalized[];
  vehicles: { id: string; plate?: string }[];
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function atTime(dateKey: string, hours: number, minutes = 0) {
  return `${dateKey}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

function hashDay(id: string, year: number) {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const month = n % 12;
  const day = (n % 27) + 1;
  return isoDate(new Date(year, month, day));
}

function rhEvents(input: AggregateInput, year: number): AgendaEvent[] {
  const out: AgendaEvent[] = [];
  for (const p of input.profiles) {
    const name = p.full_name || 'Colaborador';
    const bday = hashDay(p.id, year);
    out.push({
      id: `rh-bday-${p.id}`,
      title: `Aniversário — ${name}`,
      description: 'Evento automático RH · celebração da equipe.',
      start: bday,
      allDay: true,
      domain: 'rh',
      category: 'aniversario',
      priority: 'medium',
      pillClass: 'bg-blue-500 text-white',
      dotClass: 'bg-blue-400',
      actionPath: `/rh/equipe/${p.id}`,
      actionLabel: 'Abrir perfil',
      participantName: name,
      participantId: p.id,
      area: 'RH',
    });
    const adm = hashDay(`${p.id}-adm`, year);
    out.push({
      id: `rh-adm-${p.id}`,
      title: `Admissão — ${name}`,
      start: adm,
      allDay: true,
      domain: 'rh',
      category: 'admissao',
      priority: 'low',
      pillClass: 'bg-[#2d2d2d] border border-blue-500/30 text-white',
      dotClass: 'bg-blue-400',
      actionPath: `/rh/equipe/${p.id}`,
      participantName: name,
      area: 'RH',
    });
  }

  for (const m of input.motoristas) {
    if (m.cnh_vencimento) {
      const dk = m.cnh_vencimento.slice(0, 10);
      out.push({
        id: `rh-cnh-${m.id}`,
        title: `CNH vencendo — ${m.nome || 'Motorista'}`,
        description: 'Renovação documental obrigatória.',
        start: dk,
        allDay: true,
        domain: 'rh',
        category: 'documento',
        priority: 'high',
        pillClass: 'bg-amber-600 text-white',
        dotClass: 'bg-amber-500',
        actionPath: '/rh/documentos-compliance',
        actionLabel: 'Ver compliance',
        participantName: m.nome,
        participantId: m.id,
        area: 'RH',
      });
    }
    const treino = hashDay(`treino-${m.id}`, year);
    out.push({
      id: `rh-treino-${m.id}`,
      title: `Treinamento NR — ${m.nome || 'Motorista'}`,
      start: atTime(treino, 9),
      end: atTime(treino, 11),
      domain: 'rh',
      category: 'treinamento',
      priority: 'medium',
      pillClass: 'bg-[#1d3528] border border-green-500/30 text-white',
      dotClass: 'bg-green-500',
      actionPath: '/rh/jornada-ponto',
      participantName: m.nome,
      area: 'RH',
    });
  }

  const pontoRecords = loadPontoRecords(input.companyId);
  for (const r of pontoRecords.slice(0, 40)) {
    const dk = r.timestamp.slice(0, 10);
    out.push({
      id: `rh-ponto-${r.id}`,
      title: `Ponto ${r.type.replace('_', ' ')} — ${r.collaboratorName}`,
      start: r.timestamp,
      domain: 'rh',
      category: 'ponto',
      priority: r.validated ? 'low' : 'high',
      pillClass: r.validated ? 'bg-[#2d2d2d] border border-blue-500/30 text-white' : 'bg-red-600 text-white',
      dotClass: 'bg-blue-400',
      actionPath: '/rh/jornada-ponto/controle-ponto',
      participantName: r.collaboratorName,
      area: 'RH',
    });
  }

  return out;
}

function financeEvents(input: AggregateInput): AgendaEvent[] {
  return input.transactions.map((t) => {
    const dk = (t.paid_at || t.created_at || '').slice(0, 10);
    if (!dk) return null;
    const isReceita = t.type === 'receita' || t.type === 'income';
    return {
      id: `fin-${t.id}`,
      title: `${isReceita ? 'Recebimento' : 'Pagamento'} — ${t.description || t.category || 'Lançamento'}`,
      description: `Categoria: ${t.category || '—'}`,
      start: dk,
      allDay: true,
      domain: 'financeiro' as const,
      category: isReceita ? 'recebimento' : 'pagamento',
      priority: !t.paid_at && !isReceita ? 'high' : 'medium',
      pillClass: isReceita ? 'bg-green-700 text-white' : 'bg-yellow-600 text-gray-900',
      dotClass: isReceita ? 'bg-green-500' : 'bg-yellow-500',
      actionPath: isReceita ? '/financeiro/receber' : '/financeiro/pagar',
      actionLabel: 'Detalhe financeiro',
      amount: Number(t.amount || 0),
      status: t.paid_at ? 'pago' : 'pendente',
      area: 'Financeiro',
    };
  }).filter(Boolean) as AgendaEvent[];
}

function logisticsEvents(input: AggregateInput): AgendaEvent[] {
  const out: AgendaEvent[] = [];
  for (const s of input.shipments) {
    const created = s.created_at?.slice(0, 10);
    if (created) {
      out.push({
        id: `log-coleta-${s.id}`,
        title: `Coleta / Frete ${s.numero_frete || s.id.slice(0, 6)}`,
        description: `${s.origin || '—'} → ${s.destination || '—'}`,
        start: created,
        domain: 'fretes',
        category: 'operacao',
        priority: s.status === 'delayed' ? 'critical' : 'medium',
        pillClass: 'bg-purple-600 text-white',
        dotClass: 'bg-purple-500',
        actionPath: '/fretes',
        actionLabel: 'Abrir frete',
        area: 'Logística',
      });
    }
    if (s.estimated_at) {
      const dk = s.estimated_at.slice(0, 10);
      out.push({
        id: `log-entrega-${s.id}`,
        title: `Entrega — ${s.cliente_nome || 'Cliente'}`,
        start: dk,
        allDay: true,
        domain: 'logistica',
        category: 'entrega',
        priority: s.status === 'delayed' ? 'critical' : 'high',
        pillClass: 'bg-[#1d3528] border border-green-500/30 text-white',
        dotClass: 'bg-green-500',
        actionPath: '/roteirizacao',
        actionLabel: 'Rota',
        area: 'Logística',
      });
    }
  }
  return out;
}

function frotaEvents(input: AggregateInput, year: number): AgendaEvent[] {
  const out: AgendaEvent[] = [];
  for (const v of input.vehicles) {
    const ipva = isoDate(new Date(year, 0, 15 + (v.id.charCodeAt(0) % 10)));
    out.push({
      id: `frota-ipva-${v.id}`,
      title: `IPVA — ${v.plate || v.id}`,
      start: ipva,
      allDay: true,
      domain: 'frota',
      category: 'documento',
      priority: 'high',
      pillClass: 'bg-orange-600 text-white',
      dotClass: 'bg-orange-500',
      actionPath: '/frota',
      area: 'Frota',
    });
    const revisao = isoDate(new Date(year, (v.id.charCodeAt(1) % 12), 10));
    out.push({
      id: `frota-rev-${v.id}`,
      title: `Revisão preventiva — ${v.plate || v.id}`,
      start: revisao,
      allDay: true,
      domain: 'frota',
      category: 'manutencao',
      priority: 'medium',
      pillClass: 'bg-[#2d2d2d] border border-orange-500/30 text-white',
      dotClass: 'bg-orange-500',
      actionPath: '/frota/manutencao',
      area: 'Frota',
    });
  }
  return out;
}

function crmEvents(year: number): AgendaEvent[] {
  const today = new Date();
  const dk = isoDate(today);
  return [
    {
      id: 'crm-reuniao-1',
      title: 'Reunião Diretoria',
      start: atTime(dk, 10),
      domain: 'crm',
      category: 'reuniao',
      priority: 'high',
      pillClass: 'bg-blue-500 text-white',
      dotClass: 'bg-blue-400',
      actionPath: '/crm',
      area: 'CRM',
    },
    {
      id: 'crm-follow-1',
      title: 'Follow-up proposta VIP',
      start: atTime(dk, 14, 30),
      domain: 'crm',
      category: 'follow-up',
      priority: 'medium',
      pillClass: 'bg-[#2d2d2d] border border-blue-500/30 text-white',
      dotClass: 'bg-blue-400',
      actionPath: '/crm',
      area: 'CRM',
    },
    {
      id: `crm-contrato-${year}`,
      title: 'Fechamento de Contrato',
      start: isoDate(new Date(year, today.getMonth(), today.getDate() + 7)),
      allDay: true,
      domain: 'contrato',
      category: 'contrato',
      priority: 'high',
      pillClass: 'bg-[#1d3528] border border-green-500/30 text-white',
      dotClass: 'bg-green-500',
      actionPath: '/crm',
      area: 'CRM',
    },
  ];
}

function alertEvents(): AgendaEvent[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return [
    {
      id: 'alert-contrato',
      title: 'Contrato vence amanhã',
      start: isoDate(tomorrow),
      allDay: true,
      domain: 'alertas',
      category: 'alerta',
      priority: 'critical',
      pillClass: 'bg-red-600 text-white',
      dotClass: 'bg-red-500',
      actionPath: '/documentos',
      area: 'Alertas',
    },
  ];
}

export function aggregateAgendaEvents(input: AggregateInput): AgendaEvent[] {
  const year = new Date().getFullYear();
  const manual = loadManualAgendaEvents(input.companyId);
  return [
    ...rhEvents(input, year),
    ...financeEvents(input),
    ...logisticsEvents(input),
    ...frotaEvents(input, year),
    ...crmEvents(year),
    ...alertEvents(),
    ...manual,
  ];
}

export function eventsForDate(events: AgendaEvent[], date: Date): AgendaEvent[] {
  const key = isoDate(date);
  return events.filter((e) => e.start.slice(0, 10) === key);
}

export function buildMonthGrid(anchor: Date): { date: Date; inMonth: boolean }[] {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const first = new Date(y, m, 1);
  const start = new Date(first);
  start.setDate(start.getDate() - start.getDay());
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ date: d, inMonth: d.getMonth() === m });
  }
  return cells;
}

export const AGENDA_CALENDAR_SOURCES = [
  { id: 'rh', name: 'RH & Pessoas', color: 'bg-blue-400', domains: ['rh'] as const },
  { id: 'financeiro', name: 'Lembretes Financeiros', color: 'bg-yellow-500', domains: ['financeiro'] as const },
  { id: 'crm', name: 'CRM & Vendas', color: 'bg-green-500', domains: ['crm', 'contrato', 'reuniao'] as const },
  { id: 'fretes', name: 'Operacional / Fretes', color: 'bg-purple-500', domains: ['fretes', 'logistica', 'operacional'] as const },
  { id: 'frota', name: 'Frota & Manutenção', color: 'bg-orange-500', domains: ['frota'] as const },
  { id: 'alertas', name: 'Alertas Inteligentes', color: 'bg-red-500', domains: ['alertas', 'ia'] as const },
];
