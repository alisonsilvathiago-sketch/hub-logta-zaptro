import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardCheck, History, Search, Users } from 'lucide-react';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import {
  conferenceHistoryKindLabel,
  ensureConferenceHistoryDemoSeed,
  filterConferenceHistory,
  formatConferenceHistoryDetail,
  groupConferenceHistoryBySession,
  listConferenceActors,
  listWorkersOnDay,
  loadConferenceHistory,
  type ConferenceHistoryFilters,
  type ConferenceHistoryKind,
  type ConferenceHistoryRecord,
} from '@/lib/conferenceHistory';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import './conferenceHistory.css';

const PERIOD_OPTIONS: { value: ConferenceHistoryFilters['period']; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last7', label: 'Últimos 7 dias' },
  { value: 'last30', label: 'Últimos 30 dias' },
  { value: 'month', label: 'Este mês' },
  { value: 'year', label: 'Este ano' },
  { value: 'all', label: 'Tudo' },
  { value: 'custom', label: 'Intervalo personalizado' },
];

const KIND_OPTIONS: { value: ConferenceHistoryKind | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas ações' },
  { value: 'item_confirmed', label: 'Conferidos' },
  { value: 'item_divergence', label: 'Divergências' },
  { value: 'exit_registered', label: 'Baixas estoque' },
  { value: 'separated_added', label: 'Separados na fila' },
  { value: 'session_started', label: 'Início sessão' },
  { value: 'session_completed', label: 'Fim sessão' },
];

function formatClock(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ConferenceHistoryPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const [records, setRecords] = useState<ConferenceHistoryRecord[]>([]);
  const [filters, setFilters] = useState<ConferenceHistoryFilters>({ period: 'last30', kind: 'all' });
  const [view, setView] = useState<'timeline' | 'sessions'>('timeline');

  const reload = () => {
    if (!companyId) return;
    ensureConferenceHistoryDemoSeed(companyId);
    setRecords(loadConferenceHistory(companyId));
  };

  useEffect(() => {
    reload();
  }, [companyId]);

  useEffect(() => {
    const onUpdate = () => reload();
    window.addEventListener('logstoka:conference-history-updated', onUpdate);
    return () => window.removeEventListener('logstoka:conference-history-updated', onUpdate);
  }, [companyId]);

  const filtered = useMemo(
    () => filterConferenceHistory(records, filters),
    [records, filters],
  );

  const actors = useMemo(() => listConferenceActors(records), [records]);

  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const workersForSelectedDay = useMemo(() => {
    if (filters.period === 'yesterday') return listWorkersOnDay(records, yesterdayKey);
    if (filters.period === 'today') {
      const todayKey = new Date().toISOString().slice(0, 10);
      return listWorkersOnDay(records, todayKey);
    }
    if (filters.period === 'custom' && filters.customFrom) {
      return listWorkersOnDay(records, filters.customFrom.slice(0, 10));
    }
    return [];
  }, [filters.period, filters.customFrom, records, yesterdayKey]);

  const sessions = useMemo(() => groupConferenceHistoryBySession(filtered), [filtered]);

  const kpis = useMemo(() => {
    const divergences = filtered.filter((r) => r.kind === 'item_divergence').length;
    const confirmed = filtered.filter((r) => r.kind === 'item_confirmed').length;
    const uniqueActors = new Set(filtered.map((r) => r.actorName)).size;
    const qtyMismatch = filtered.filter(
      (r) =>
        r.kind === 'item_divergence' &&
        r.quantityExpected != null &&
        r.quantityRegistered != null &&
        r.quantityExpected !== r.quantityRegistered,
    ).length;
    return { divergences, confirmed, uniqueActors, qtyMismatch, total: filtered.length };
  }, [filtered]);

  const timelinePagination = useTablePagination(filtered, 20, `hist-${JSON.stringify(filters)}`);
  const sessionPagination = useTablePagination(sessions, 10, `sess-${JSON.stringify(filters)}`);

  return (
    <div className="ls-conf-history space-y-5">
      <LogstokaPageHeader
        eyebrow="Expedição · Raio-X"
        icon={<History size={20} strokeWidth={2.25} />}
        title="Histórico de conferência"
        subtitle="Quem conferiu, quando, quantidades registradas e divergências — filtre por dia, mês, ano e colaborador para auditar pallet vs sistema."
        actions={
          <Link to={LOGSTOKA_ROUTES.PICKING} className="ls-btn-secondary text-sm">
            Voltar à conferência do dia
          </Link>
        }
      />

      <LogstokaKpiStrip
        items={[
          { label: 'Registros', value: kpis.total },
          { label: 'Itens conferidos', value: kpis.confirmed },
          { label: 'Divergências', value: kpis.divergences, hint: kpis.qtyMismatch ? `${kpis.qtyMismatch} com qty diferente` : undefined },
          { label: 'Colaboradores', value: kpis.uniqueActors },
        ]}
      />

      {workersForSelectedDay.length > 0 ? (
        <div className="ls-conf-history__workers">
          <Users size={16} aria-hidden />
          <span>
            <strong>
              {filters.period === 'today'
                ? 'Hoje'
                : filters.period === 'yesterday'
                  ? 'Ontem'
                  : 'No dia'}
            </strong>{' '}
            trabalharam na conferência: {workersForSelectedDay.join(', ')}
          </span>
        </div>
      ) : null}

      <section className="ls-conf-history__filters ls-card p-4">
        <div className="ls-conf-history__filter-row">
          <label className="ls-conf-history__label">
            Período
            <select
              className="ls-input mt-1"
              value={filters.period}
              onChange={(e) => setFilters((f) => ({ ...f, period: e.target.value as ConferenceHistoryFilters['period'] }))}
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="ls-conf-history__label">
            Colaborador
            <select
              className="ls-input mt-1"
              value={filters.actorName ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, actorName: e.target.value || undefined }))}
            >
              <option value="">Todos</option>
              {actors.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="ls-conf-history__label">
            Tipo
            <select
              className="ls-input mt-1"
              value={filters.kind ?? 'all'}
              onChange={(e) =>
                setFilters((f) => ({ ...f, kind: e.target.value as ConferenceHistoryKind | 'all' }))
              }
            >
              {KIND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="ls-conf-history__label ls-conf-history__label--search">
            <Search size={14} className="mb-1 inline" aria-hidden />
            Buscar SKU / produto
            <input
              type="search"
              className="ls-input mt-1"
              placeholder="Ex.: Organizador, STK-ORG…"
              value={filters.search ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </label>
        </div>
        {filters.period === 'custom' ? (
          <div className="ls-conf-history__filter-row">
            <label className="ls-conf-history__label">
              De
              <input
                type="date"
                className="ls-input mt-1"
                value={filters.customFrom ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, customFrom: e.target.value || undefined }))}
              />
            </label>
            <label className="ls-conf-history__label">
              Até
              <input
                type="date"
                className="ls-input mt-1"
                value={filters.customTo ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, customTo: e.target.value || undefined }))}
              />
            </label>
          </div>
        ) : null}
        <div className="ls-conf-history__view-tabs">
          <button
            type="button"
            className={view === 'timeline' ? 'is-active' : ''}
            onClick={() => setView('timeline')}
          >
            Linha do tempo
          </button>
          <button
            type="button"
            className={view === 'sessions' ? 'is-active' : ''}
            onClick={() => setView('sessions')}
          >
            Por sessão
          </button>
        </div>
      </section>

      {view === 'timeline' ? (
        <section className="ls-card overflow-hidden">
          <div className="ls-table-wrap">
            <table className="ls-table">
              <thead>
                <tr>
                  <th>Data / hora</th>
                  <th>Colaborador</th>
                  <th>Ação</th>
                  <th>Produto</th>
                  <th>SKU</th>
                  <th>Qtd sistema</th>
                  <th>Qtd registrada</th>
                  <th>Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {timelinePagination.paginatedItems.map((row) => {
                  const mismatch =
                    row.quantityExpected != null &&
                    row.quantityRegistered != null &&
                    row.quantityExpected !== row.quantityRegistered;
                  return (
                    <tr key={row.id} className={row.kind === 'item_divergence' || mismatch ? 'ls-table-row--overdue' : undefined}>
                      <td className="text-xs whitespace-nowrap">{formatClock(row.at)}</td>
                      <td className="font-bold">{row.actorName}</td>
                      <td>
                        <span
                          className={`ls-badge ${
                            row.kind === 'item_divergence' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                          }`}
                        >
                          {conferenceHistoryKindLabel(row.kind)}
                        </span>
                      </td>
                      <td>{row.productName ?? '—'}</td>
                      <td className="font-mono text-xs">{row.sku ?? '—'}</td>
                      <td className="font-bold">{row.quantityExpected ?? '—'}</td>
                      <td className={mismatch ? 'font-black text-red-700' : 'font-bold'}>
                        {row.quantityRegistered ?? '—'}
                      </td>
                      <td className="text-xs text-[#525252] max-w-[200px]">
                        {row.kind === 'item_divergence' ? (
                          <span className="inline-flex items-center gap-1 text-red-700">
                            <AlertTriangle size={12} />
                            {formatConferenceHistoryDetail(row)}
                          </span>
                        ) : (
                          formatConferenceHistoryDetail(row)
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#737373]">Nenhum registro neste filtro.</p>
          ) : null}
          <LogstokaTableFooter {...timelinePagination.footerProps} itemLabel="registro" />
        </section>
      ) : (
        <div className="space-y-4">
          {sessionPagination.paginatedItems.map((session) => (
            <article key={session.sessionId} className="ls-conf-history__session ls-card">
              <header className="ls-conf-history__session-head">
                <div>
                  <p className="ls-conf-history__session-title">
                    <ClipboardCheck size={16} aria-hidden />
                    {session.actorName}
                  </p>
                  <p className="text-xs text-[#737373]">
                    {formatClock(session.startedAt)}
                    {session.completedAt ? ` → ${formatClock(session.completedAt)}` : ''}
                    · {session.source === 'picking_daily' ? 'Conferência do dia' : 'Operação'}
                  </p>
                </div>
                <div className="ls-conf-history__session-stats">
                  <span>{session.confirmedCount} conferido(s)</span>
                  {session.divergenceCount > 0 ? (
                    <span className="text-red-700">{session.divergenceCount} divergência(s)</span>
                  ) : null}
                  <span>{session.unitsRegistered.toLocaleString('pt-BR')} un.</span>
                </div>
              </header>
              <ul className="ls-conf-history__session-list">
                {session.records
                  .filter((r) => r.kind !== 'session_started' && r.kind !== 'session_completed')
                  .map((row) => (
                    <li key={row.id}>
                      <span className="text-xs text-[#a3a3a3]">{formatClock(row.at)}</span>
                      <strong>{conferenceHistoryKindLabel(row.kind)}</strong>
                      {row.productName ? ` · ${row.productName}` : ''}
                      {row.sku ? ` (${row.sku})` : ''}
                      {row.quantityExpected != null ? ` · sistema ${row.quantityExpected} un.` : ''}
                      {row.quantityRegistered != null && row.quantityRegistered !== row.quantityExpected
                        ? ` · registrado ${row.quantityRegistered} un.`
                        : ''}
                    </li>
                  ))}
              </ul>
            </article>
          ))}
          {sessions.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#737373]">Nenhuma sessão neste filtro.</p>
          ) : null}
          <LogstokaTableFooter {...sessionPagination.footerProps} itemLabel="sessão" />
        </div>
      )}
    </div>
  );
};

export default ConferenceHistoryPage;
