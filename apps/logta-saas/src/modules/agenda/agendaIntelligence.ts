import type { AgendaAlert, AgendaEvent, AgendaInsight } from './types';

function sameDay(a: string, b: string) {
  return a.slice(0, 10) === b.slice(0, 10);
}

function isToday(iso: string) {
  return sameDay(iso, new Date().toISOString());
}

function isTomorrow(iso: string) {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return sameDay(iso, t.toISOString());
}

export function buildAgendaAlerts(events: AgendaEvent[]): AgendaAlert[] {
  const alerts: AgendaAlert[] = [];

  for (const e of events) {
    if (e.category === 'aniversario' && isToday(e.start)) {
      alerts.push({
        id: `pop-bday-${e.id}`,
        title: 'Aniversário hoje',
        message: `${e.participantName || e.title} — envie os parabéns da equipe.`,
        priority: 'medium',
        eventDate: e.start,
        actionPath: e.actionPath,
      });
    }
    if (e.domain === 'financeiro' && e.status === 'pendente' && (isToday(e.start) || isTomorrow(e.start))) {
      alerts.push({
        id: `pop-fin-${e.id}`,
        title: isToday(e.start) ? 'Pagamento importante vence hoje' : 'Pagamento vence amanhã',
        message: e.title,
        priority: 'critical',
        eventDate: e.start,
        actionPath: e.actionPath,
      });
    }
    if (e.title.toLowerCase().includes('contrato') && isTomorrow(e.start)) {
      alerts.push({
        id: `pop-contract-${e.id}`,
        title: 'Contrato vence amanhã',
        message: e.title,
        priority: 'high',
        eventDate: e.start,
        actionPath: e.actionPath,
      });
    }
    if (e.category === 'entrega' && e.priority === 'critical') {
      alerts.push({
        id: `pop-entrega-${e.id}`,
        title: 'Entrega crítica agendada',
        message: e.description || e.title,
        priority: 'critical',
        eventDate: e.start,
        actionPath: e.actionPath,
      });
    }
    if (e.category === 'manutencao' && isTomorrow(e.start)) {
      alerts.push({
        id: `pop-manut-${e.id}`,
        title: 'Manutenção obrigatória amanhã',
        message: e.title,
        priority: 'high',
        eventDate: e.start,
        actionPath: e.actionPath,
      });
    }
  }

  const conflicts = detectDayConflicts(events);
  for (const c of conflicts.slice(0, 3)) {
    alerts.push({
      id: c.id,
      title: 'Conflito operacional nesta data',
      message: c.message,
      priority: 'high',
      eventDate: c.date,
    });
  }

  return alerts.slice(0, 8);
}

function detectDayConflicts(events: AgendaEvent[]) {
  const byDay = new Map<string, AgendaEvent[]>();
  for (const e of events) {
    const k = e.start.slice(0, 10);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(e);
  }
  const out: { id: string; date: string; message: string }[] = [];
  for (const [date, list] of byDay) {
    const critical = list.filter((e) => e.priority === 'critical').length;
    if (critical >= 2 || list.length >= 8) {
      out.push({
        id: `conf-${date}`,
        date,
        message: `${list.length} eventos (${critical} críticos) — revisar capacidade operacional.`,
      });
    }
  }
  return out;
}

export function buildAgendaInsights(events: AgendaEvent[]): AgendaInsight[] {
  const todayKey = new Date().toISOString().slice(0, 10);
  const today = events.filter((e) => e.start.slice(0, 10) === todayKey);
  const finRisk = today.filter((e) => e.domain === 'financeiro' && e.status === 'pendente').length;

  return [
    {
      id: 'i-conflict',
      title: 'Previsão de conflitos',
      detail:
        today.length >= 6
          ? 'IA detectou alta densidade de eventos hoje — redistribua agendas.'
          : 'Agenda equilibrada para o dia corrente.',
      tone: today.length >= 6 ? 'risk' : 'success',
    },
    {
      id: 'i-fin',
      title: 'Risco financeiro',
      detail:
        finRisk > 0
          ? `${finRisk} vencimento(s) financeiro(s) hoje — priorize fluxo de caixa.`
          : 'Sem vencimentos críticos no dia.',
      tone: finRisk > 0 ? 'risk' : 'success',
    },
    {
      id: 'i-suggest',
      title: 'Sugestão de agenda',
      detail: 'Reserve bloco 09:00–10:00 para follow-ups CRM e 16:00 para revisão operacional.',
      tone: 'info',
    },
  ];
}

export function formatEventTime(event: AgendaEvent) {
  if (event.allDay) return 'O dia todo';
  const d = new Date(event.start);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
