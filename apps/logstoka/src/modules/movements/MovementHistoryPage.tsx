import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, History, Search, Users } from 'lucide-react';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import ClickableTableRow from '@/components/ui/ClickableTableRow';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import {
  ensureMovementHistoryDemoSeed,
  filterMovementHistory,
  formatMovementHistoryDetail,
  listMovementHistoryActors,
  listWorkersOnDay,
  loadMovementHistory,
  movementHistoryActionLabel,
  movementHistoryDetailUrl,
  movementHistoryTypeLabel,
  MOVEMENT_HISTORY_TAB_LABELS,
  type MovementHistoryAction,
  type MovementHistoryFilters,
  type MovementHistoryRecord,
  type MovementHistoryType,
} from '@/lib/movementHistory';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import '@/modules/picking/conferenceHistory.css';

const VALID_TABS = ['entry', 'exit', 'overdue', 'transfer', 'damage', 'all'] as const;
type HistoryTab = (typeof VALID_TABS)[number];

const PERIOD_OPTIONS: { value: MovementHistoryFilters['period']; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last7', label: 'Últimos 7 dias' },
  { value: 'last30', label: 'Últimos 30 dias' },
  { value: 'last60', label: 'Últimos 2 meses' },
  { value: 'last90', label: 'Últimos 3 meses' },
  { value: 'last120', label: 'Últimos 4 meses' },
  { value: 'month', label: 'Este mês' },
  { value: 'year', label: 'Este ano' },
  { value: 'all', label: 'Tudo' },
  { value: 'custom', label: 'Intervalo personalizado' },
];

const ACTION_OPTIONS: { value: MovementHistoryAction | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas ações' },
  { value: 'registered', label: 'Registros' },
  { value: 'merged', label: 'Somas no dia' },
  { value: 'edited', label: 'Edições' },
  { value: 'deleted', label: 'Exclusões' },
  { value: 'imported', label: 'Importações (Excel/API)' },
  { value: 'overdue_flagged', label: 'Atrasos' },
];

const TAB_BACK: Record<Exclude<HistoryTab, 'all'>, { label: string; url: string }> = {
  entry: { label: 'Entrada inteligente do dia', url: `${LOGSTOKA_ROUTES.MOVEMENTS}?tab=entry` },
  exit: { label: 'Saídas do dia', url: `${LOGSTOKA_ROUTES.MOVEMENTS}?tab=exit` },
  overdue: { label: 'Atrasos', url: `${LOGSTOKA_ROUTES.MOVEMENTS}?tab=overdue` },
  transfer: { label: 'Transferências', url: `${LOGSTOKA_ROUTES.MOVEMENTS}?tab=transfer` },
  damage: { label: 'Avarias', url: `${LOGSTOKA_ROUTES.MOVEMENTS}?tab=damage` },
};

function formatClock(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseTab(param: string | null): HistoryTab {
  if (param && VALID_TABS.includes(param as HistoryTab)) return param as HistoryTab;
  return 'entry';
}

const MovementHistoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tab = parseTab(searchParams.get('tipo'));
  const { companyId } = useLogstokaTenant();
  const [records, setRecords] = useState<MovementHistoryRecord[]>([]);
  const [filters, setFilters] = useState<MovementHistoryFilters>({
    period: 'last30',
    movementType: tab === 'all' ? 'all' : tab,
    actionKind: 'all',
  });

  const reload = () => {
    if (!companyId) return;
    ensureMovementHistoryDemoSeed(companyId);
    setRecords(loadMovementHistory(companyId));
  };

  useEffect(() => {
    reload();
  }, [companyId]);

  useEffect(() => {
    setFilters((f) => ({
      ...f,
      movementType: tab === 'all' ? 'all' : tab,
    }));
  }, [tab]);

  useEffect(() => {
    const onUpdate = () => reload();
    window.addEventListener('logstoka:movement-history-updated', onUpdate);
    return () => window.removeEventListener('logstoka:movement-history-updated', onUpdate);
  }, [companyId]);

  const filtered = useMemo(() => filterMovementHistory(records, filters), [records, filters]);
  const actors = useMemo(() => listMovementHistoryActors(records), [records]);

  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const workersForSelectedDay = useMemo(() => {
    if (filters.period === 'yesterday') return listWorkersOnDay(records, yesterdayKey);
    if (filters.period === 'today') return listWorkersOnDay(records, new Date().toISOString().slice(0, 10));
    if (filters.period === 'custom' && filters.customFrom) {
      return listWorkersOnDay(records, filters.customFrom.slice(0, 10));
    }
    return [];
  }, [filters.period, filters.customFrom, records, yesterdayKey]);

  const kpis = useMemo(() => {
    const uniqueActors = new Set(filtered.map((r) => r.actorName)).size;
    const overdue = filtered.filter((r) => r.actionKind === 'overdue_flagged').length;
    const imports = filtered.filter((r) => r.actionKind === 'imported').length;
    const units = filtered.reduce((sum, r) => sum + (r.quantity ?? 0), 0);
    return { total: filtered.length, uniqueActors, overdue, imports, units };
  }, [filtered]);

  const pagination = useTablePagination(filtered, 25, `mov-hist-${tab}-${JSON.stringify(filters)}`);

  const pageTitle =
    tab === 'all'
      ? 'Histórico de movimentações'
      : `Histórico · ${MOVEMENT_HISTORY_TAB_LABELS[tab as MovementHistoryType]}`;

  const backLink = tab === 'all' ? LOGSTOKA_ROUTES.MOVEMENTS : TAB_BACK[tab as Exclude<HistoryTab, 'all'>];

  return (
    <div className="ls-conf-history space-y-5">
      <LogstokaPageHeader
        eyebrow="Estoque · auditoria"
        icon={<History size={20} strokeWidth={2.25} />}
        title={pageTitle}
        subtitle="Quem registrou, editou ou importou — filtre por período, colaborador e SKU. Clique na linha para abrir a movimentação completa."
        actions={
          <Link
            to={typeof backLink === 'string' ? backLink : backLink.url}
            className="ls-btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={16} />
            {typeof backLink === 'string' ? 'Voltar às movimentações' : `Voltar · ${backLink.label}`}
          </Link>
        }
      />

      <LogstokaKpiStrip
        items={[
          { label: 'Registros', value: kpis.total },
          { label: 'Colaboradores', value: kpis.uniqueActors },
          { label: 'Unidades (soma)', value: kpis.units.toLocaleString('pt-BR') },
          {
            label: tab === 'overdue' || filters.movementType === 'overdue' ? 'Atrasos' : 'Importações',
            value: tab === 'overdue' || filters.movementType === 'overdue' ? kpis.overdue : kpis.imports,
          },
        ]}
      />

      {workersForSelectedDay.length > 0 ? (
        <div className="ls-conf-history__workers">
          <Users size={16} aria-hidden />
          <span>
            <strong>
              {filters.period === 'today' ? 'Hoje' : filters.period === 'yesterday' ? 'Ontem' : 'No dia'}
            </strong>{' '}
            operaram: {workersForSelectedDay.join(', ')}
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
              onChange={(e) =>
                setFilters((f) => ({ ...f, period: e.target.value as MovementHistoryFilters['period'] }))
              }
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
              value={filters.movementType ?? 'all'}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  movementType: e.target.value as MovementHistoryType | 'all',
                }))
              }
            >
              {(['all', 'entry', 'exit', 'overdue', 'transfer', 'damage'] as const).map((t) => (
                <option key={t} value={t}>
                  {MOVEMENT_HISTORY_TAB_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="ls-conf-history__label">
            Ação
            <select
              className="ls-input mt-1"
              value={filters.actionKind ?? 'all'}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  actionKind: e.target.value as MovementHistoryAction | 'all',
                }))
              }
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="ls-conf-history__label ls-conf-history__label--search">
            <Search size={14} className="mb-1 inline" aria-hidden />
            Buscar SKU / produto / referência
            <input
              type="search"
              className="ls-input mt-1"
              placeholder="Ex.: Chupeta, BBR-CHU…"
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
      </section>

      <section className="ls-card overflow-hidden">
        <div className="ls-table-wrap">
          <table className="ls-table">
            <thead>
              <tr>
                <th>Data / hora</th>
                <th>Colaborador</th>
                <th>Tipo</th>
                <th>Ação</th>
                <th>Produto</th>
                <th>SKU</th>
                <th>Qtd</th>
                <th>Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-500">
                    Nenhum registro neste filtro.
                  </td>
                </tr>
              ) : (
                pagination.paginatedItems.map((row) => {
                  const detailUrl = movementHistoryDetailUrl(row);
                  const detail = formatMovementHistoryDetail(row);
                  const cells = (
                    <>
                      <td className="whitespace-nowrap text-sm font-semibold">{formatClock(row.at)}</td>
                      <td>
                        <span className="font-bold text-[#383838]">{row.actorName}</span>
                        {row.registeredByActorName && row.actionKind === 'overdue_flagged' ? (
                          <p className="text-xs font-semibold text-red-700 mt-0.5">
                            Entrada por {row.registeredByActorName}
                          </p>
                        ) : null}
                      </td>
                      <td>
                        <span className="ls-badge bg-orange-50 text-orange-700">
                          {movementHistoryTypeLabel(row.movementType)}
                        </span>
                      </td>
                      <td className="text-sm font-semibold">{movementHistoryActionLabel(row.actionKind)}</td>
                      <td className="text-sm font-bold max-w-[180px] truncate">{row.productName ?? '—'}</td>
                      <td className="text-sm font-mono text-slate-600">{row.sku ?? '—'}</td>
                      <td className="font-black text-orange-600">
                        {row.quantity != null ? row.quantity.toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="text-xs font-semibold text-slate-600 max-w-[220px]">{detail}</td>
                    </>
                  );

                  if (detailUrl) {
                    return (
                      <ClickableTableRow key={row.id} to={detailUrl}>
                        {cells}
                      </ClickableTableRow>
                    );
                  }

                  return <tr key={row.id}>{cells}</tr>;
                })
              )}
            </tbody>
          </table>
        </div>
        <LogstokaTableFooter
          total={filtered.length}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
          itemLabel="registros"
        />
      </section>

      <p className="text-xs font-semibold text-slate-500 px-1">
        Modo Excel: importações aparecem como «Importação» quando o operador anexa planilha (sem API). Modo API: integrações
        conectadas registram automaticamente — mesma trilha de auditoria.
      </p>
    </div>
  );
};

export default MovementHistoryPage;
