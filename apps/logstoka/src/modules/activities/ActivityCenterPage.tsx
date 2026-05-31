import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  GitBranch,
  List,
  Plug,
  ScanLine,
  Search,
  ShoppingCart,
  Sparkles,
  User,
  ArrowLeftRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { logstokaApi } from '@/lib/logstokaApi';
import {
  ACTIVITY_DOMAIN_OPTIONS,
  activityDomainLabel,
  filterActivityEvents,
  formatActivityClock,
  formatActivityDayLabel,
  groupActivitiesByDay,
  loadCentralActivities,
  type ActivityCenterFilters,
  type ActivityDomain,
  type OperationalActivityEvent,
} from '@/lib/operationalActivityLog';
import ActivityMonthCalendar, { buildCalendarMonthCells } from './ActivityMonthCalendar';
import ActivityEventPreviewModal from './ActivityEventPreviewModal';
import './activityCenter.css';

const DEFAULT_FILTERS: ActivityCenterFilters = {
  period: 'all',
  domains: 'all',
};

function resultClass(result: OperationalActivityEvent['result']): string {
  if (result === 'success') return 'ls-act-center__result ls-act-center__result--ok';
  if (result === 'warning') return 'ls-act-center__result ls-act-center__result--warn';
  if (result === 'error') return 'ls-act-center__result ls-act-center__result--err';
  return 'ls-act-center__result';
}

function monthTitle(year: number, month: number): string {
  const label = new Date(year, month, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const ACTIVITY_DOMAIN_ICONS: Record<ActivityDomain, React.ReactNode> = {
  operation: <ScanLine size={11} strokeWidth={2.25} aria-hidden />,
  conference: <ClipboardCheck size={11} strokeWidth={2.25} aria-hidden />,
  inventory: <Boxes size={11} strokeWidth={2.25} aria-hidden />,
  transfer: <ArrowLeftRight size={11} strokeWidth={2.25} aria-hidden />,
  sales: <ShoppingCart size={11} strokeWidth={2.25} aria-hidden />,
  integrations: <Plug size={11} strokeWidth={2.25} aria-hidden />,
  flow: <GitBranch size={11} strokeWidth={2.25} aria-hidden />,
  ai: <Bot size={11} strokeWidth={2.25} aria-hidden />,
  user: <User size={11} strokeWidth={2.25} aria-hidden />,
  alerts: <Bell size={11} strokeWidth={2.25} aria-hidden />,
  production: <Boxes size={11} strokeWidth={2.25} aria-hidden />,
};

const ActivityCenterPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const { profile } = useAuth();
  const [events, setEvents] = useState<OperationalActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ActivityCenterFilters>(DEFAULT_FILTERS);
  const [cursorMonth, setCursorMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [previewEvent, setPreviewEvent] = useState<OperationalActivityEvent | null>(null);

  const reload = useCallback(async () => {
    if (!companyId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await loadCentralActivities(companyId);
      setEvents(rows);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onRecorded = () => void reload();
    window.addEventListener('logstoka:activity-recorded', onRecorded);
    return () => window.removeEventListener('logstoka:activity-recorded', onRecorded);
  }, [reload]);

  const filtered = useMemo(
    () => filterActivityEvents(events, filters),
    [events, filters],
  );

  const dayGroups = useMemo(() => groupActivitiesByDay(filtered), [filtered]);

  const monthEventsByDay = useMemo(() => {
    const map = new Map<string, OperationalActivityEvent[]>();
    for (const [key, list] of dayGroups) {
      map.set(key, [...list].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()));
    }
    return map;
  }, [dayGroups]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return monthEventsByDay.get(selectedDay) ?? [];
  }, [monthEventsByDay, selectedDay]);

  const monthStats = useMemo(() => {
    const cells = buildCalendarMonthCells(cursorMonth.year, cursorMonth.month, monthEventsByDay);
    const inMonth = cells.filter((c) => c.inMonth);
    const withActivity = inMonth.filter((c) => c.events.length > 0).length;
    const totalInMonth = inMonth.reduce((sum, c) => sum + c.events.length, 0);
    return { withActivity, totalInMonth };
  }, [cursorMonth, monthEventsByDay]);

  const goToday = () => {
    const now = new Date();
    setCursorMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDay(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    );
  };

  const shiftMonth = (delta: number) => {
    setCursorMonth((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const toggleDomain = (domain: ActivityDomain) => {
    setFilters((prev) => {
      if (prev.domains === 'all') return { ...prev, domains: [domain] };
      if (prev.domains.includes(domain)) {
        const next = prev.domains.filter((d) => d !== domain);
        return { ...prev, domains: next.length ? next : 'all' };
      }
      return { ...prev, domains: [...prev.domains, domain] };
    });
  };

  const isDomainVisible = (domain: ActivityDomain): boolean =>
    filters.domains === 'all' || filters.domains.includes(domain);

  const runAiAnalysis = async () => {
    if (filtered.length === 0) {
      toast.error('Nenhuma atividade para analisar');
      return;
    }
    setAiLoading(true);
    setAiInsight(null);
    try {
      const sample = filtered
        .slice(0, 20)
        .map((e) => `${formatActivityClock(e.time)} · ${e.actorName}: ${e.description}`)
        .join('\n');
      const res = await logstokaApi.aiChat({
        screen: 'activity_center',
        message: [
          'Analise esta linha do tempo operacional em 3 frases curtas em português.',
          'Destaque volume, pendências e padrões. Tom de gestor de estoque.',
          `Total: ${filtered.length} eventos.`,
          sample,
        ].join('\n'),
        user_name: profile?.full_name ?? undefined,
      });
      setAiInsight(res.reply ?? 'Análise indisponível no momento.');
    } catch {
      setAiInsight('Assistente IA indisponível — verifique a conexão com o servidor.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="ls-act-shell">
      <aside className="ls-act-shell__sidebar" aria-label="Filtros do calendário">
        <div className="ls-act-shell__sidebar-head">
          <h1>Central de Atividades</h1>
        </div>

        <div className="ls-act-shell__mini-nav">
          <button type="button" className="ls-act-shell__today" onClick={goToday}>
            Hoje
          </button>
          <div className="ls-act-shell__mini-month">
            <button type="button" aria-label="Mês anterior" onClick={() => shiftMonth(-1)}>
              <ChevronLeft size={16} />
            </button>
            <span>{monthTitle(cursorMonth.year, cursorMonth.month)}</span>
            <button type="button" aria-label="Próximo mês" onClick={() => shiftMonth(1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="ls-act-shell__search">
          <Search size={15} />
          <input
            type="search"
            className="ls-input"
            placeholder="Buscar produto, pedido…"
            value={filters.searchQuery ?? ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
          />
        </div>

        <div className="ls-act-shell__stats">
          <div>
            <strong>{filtered.length}</strong>
            <span>total registrado</span>
          </div>
          <div>
            <strong>{monthStats.totalInMonth}</strong>
            <span>neste mês</span>
          </div>
        </div>

        <section className="ls-act-shell__calendars">
          <h2>Tipos de ação</h2>
          <ul>
            {ACTIVITY_DOMAIN_OPTIONS.map((opt) => (
              <li key={opt.id}>
                <label className="ls-act-shell__check">
                  <input
                    type="checkbox"
                    className="ls-act-shell__checkbox"
                    checked={isDomainVisible(opt.id)}
                    onChange={() => toggleDomain(opt.id)}
                  />
                  <span className={`ls-act-shell__type-icon ls-act-shell__type-icon--${opt.id}`}>
                    {ACTIVITY_DOMAIN_ICONS[opt.id]}
                  </span>
                  {opt.label}
                </label>
              </li>
            ))}
          </ul>
          {filters.domains !== 'all' ? (
            <button
              type="button"
              className="ls-act-shell__clear"
              onClick={() => setFilters((prev) => ({ ...prev, domains: 'all' }))}
            >
              Mostrar todos
            </button>
          ) : null}
        </section>

        <section className="ls-act-shell__ai">
          <div className="ls-act-shell__ai-head">
            <Sparkles size={16} />
            <span>IA operacional</span>
          </div>
          <button type="button" className="ls-btn-secondary w-full text-xs" disabled={aiLoading} onClick={() => void runAiAnalysis()}>
            {aiLoading ? 'Analisando…' : 'Analisar período'}
          </button>
          {aiInsight ? <p className="ls-act-shell__ai-text">{aiInsight}</p> : null}
        </section>
      </aside>

      <div className="ls-act-shell__main">
        <header className="ls-act-shell__toolbar">
          <div className="ls-act-shell__toolbar-left">
            <button type="button" className="ls-act-shell__today ls-act-shell__today--compact" onClick={goToday}>
              Hoje
            </button>
            <div className="ls-act-shell__month-nav">
              <button type="button" aria-label="Mês anterior" onClick={() => shiftMonth(-1)}>
                <ChevronLeft size={18} />
              </button>
              <button type="button" aria-label="Próximo mês" onClick={() => shiftMonth(1)}>
                <ChevronRight size={18} />
              </button>
            </div>
            <h2 className="ls-act-shell__month-title">{monthTitle(cursorMonth.year, cursorMonth.month)}</h2>
          </div>
          <div className="ls-act-shell__toolbar-right">
            <input
              type="search"
              className="ls-input ls-act-shell__actor"
              placeholder="Filtrar por usuário"
              value={filters.actorQuery ?? ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, actorQuery: e.target.value }))}
            />
            <button
              type="button"
              className={`ls-act-shell__list-toggle${showList ? ' ls-act-shell__list-toggle--active' : ''}`}
              onClick={() => setShowList((v) => !v)}
            >
              <List size={16} />
              Lista
            </button>
          </div>
        </header>

        {loading ? <div className="ls-act-center__empty">Carregando atividades…</div> : null}

        {!loading ? (
          <ActivityMonthCalendar
            year={cursorMonth.year}
            month={cursorMonth.month}
            eventsByDay={monthEventsByDay}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onSelectEvent={setPreviewEvent}
          />
        ) : null}

        <ActivityEventPreviewModal event={previewEvent} onClose={() => setPreviewEvent(null)} />

        {!loading && selectedDay && selectedDayEvents.length > 0 ? (
          <section className="ls-act-shell__day-panel" aria-label={`Atividades de ${formatActivityDayLabel(selectedDayEvents[0]!.time)}`}>
            <header>
              <h3>{formatActivityDayLabel(selectedDayEvents[0]!.time)}</h3>
              <span>{selectedDayEvents.length} ações</span>
              <button type="button" className="ls-act-shell__day-close" onClick={() => setSelectedDay(null)}>
                Fechar
              </button>
            </header>
            <ul className="ls-act-center__timeline ls-act-center__timeline--compact">
              {selectedDayEvents.map((event) => (
                <li key={event.id} className="ls-act-center__item">
                  <div className="ls-act-center__item-time">
                    <time dateTime={event.time}>{formatActivityClock(event.time)}</time>
                  </div>
                  <div className="ls-act-center__item-body">
                    <div className="ls-act-center__item-head">
                      <strong>{event.actorName}</strong>
                      <span>{activityDomainLabel(event.domain)}</span>
                      <span className={resultClass(event.result)}>{event.status}</span>
                    </div>
                    <p className="ls-act-center__item-title">{event.title}</p>
                    <button
                      type="button"
                      className="ls-act-center__item-desc ls-act-center__item-desc--btn"
                      onClick={() => setPreviewEvent(event)}
                    >
                      {event.description}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!loading && showList ? (
          <section className="ls-act-shell__list-panel">
            <header>
              <h3>Todas as ações ({filtered.length})</h3>
            </header>
            {filtered.length === 0 ? (
              <div className="ls-act-center__empty">Nenhuma atividade neste filtro.</div>
            ) : (
              <ul className="ls-act-center__timeline">
                {filtered.map((event) => (
                  <li key={event.id} className="ls-act-center__item">
                    <div className="ls-act-center__item-time">
                      <time dateTime={event.time}>{formatActivityClock(event.time)}</time>
                      <span>{formatActivityDayLabel(event.time)}</span>
                    </div>
                    <div className="ls-act-center__item-body">
                      <div className="ls-act-center__item-head">
                        <strong>{event.actorName}</strong>
                        <span>{activityDomainLabel(event.domain)}</span>
                        <span className={resultClass(event.result)}>{event.status}</span>
                      </div>
                      <p className="ls-act-center__item-title">{event.title}</p>
                      <button
                        type="button"
                        className="ls-act-center__item-desc ls-act-center__item-desc--btn"
                        onClick={() => setPreviewEvent(event)}
                      >
                        {event.description}
                      </button>
                      <span className="ls-act-center__item-ref">{event.reference}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default ActivityCenterPage;
