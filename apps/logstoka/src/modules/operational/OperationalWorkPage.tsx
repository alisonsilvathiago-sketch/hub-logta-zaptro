import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Upload, ScanLine, Workflow } from 'lucide-react';
import LogstokaClickableHint from '@/components/ui/LogstokaClickableHint';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';
import LogstokaDataModeBadge from '@/components/layout/LogstokaDataModeBadge';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useTablePagination } from '@/hooks/useTablePagination';
import {
  buildDemoOperationalOrders,
  filterOperationalOrders,
  operationalStageLabel,
  REPORT_SOURCE_LABELS,
  summarizeOperationalQueue,
  type OperationalOrder,
  type OrderListFilter,
} from '@/lib/operationalFlow';
import {
  getTodayFlowPlan,
  loadOperationalProfile,
  operationalModeLabel,
  type OperationalProfileConfig,
} from '@/lib/operationalProfile';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import OperationalFlowTimeline from './OperationalFlowTimeline';
import OperationalTodayBanner from './OperationalTodayBanner';
import OperationalWorkSheetModal from './OperationalWorkSheetModal';
import { countPendingDivergences } from '@/lib/conferenceDivergences';
import './operationalWork.css';
import './operationalFlowTimeline.css';
import './operationalTodayBanner.css';
import './operationalWorkSheet.css';

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const ACTION_CARDS: Array<{
  filter: OrderListFilter;
  label: string;
  countKey: keyof ReturnType<typeof summarizeOperationalQueue>;
  className: string;
}> = [
  { filter: 'now', label: 'Separar / conferir hoje', countKey: 'todayFocus', className: 'ls-op-hero-action--separation' },
  { filter: 'backlog', label: 'Acumulados', countKey: 'backlog', className: '' },
  { filter: 'late', label: 'Atrasados', countKey: 'late', className: 'ls-op-hero-action--late' },
  { filter: 'all', label: 'Não enviados', countKey: 'notSent', className: '' },
];

const OperationalWorkPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const [profile] = useState<OperationalProfileConfig>(() => loadOperationalProfile(companyId));
  const [listFilter, setListFilter] = useState<OrderListFilter>('now');
  const [sheetFilter, setSheetFilter] = useState<OrderListFilter | null>(null);

  const todayPlan = useMemo(() => getTodayFlowPlan(profile), [profile]);
  const orders = useMemo(() => buildDemoOperationalOrders(new Date(), profile), [profile]);
  const summary = useMemo(() => summarizeOperationalQueue(orders, todayPlan), [orders, todayPlan]);
  const pendingDivergences = countPendingDivergences(companyId);

  const filteredOrders = useMemo(
    () => filterOperationalOrders(orders, todayPlan, listFilter),
    [orders, todayPlan, listFilter],
  );
  const { paginatedItems, footerProps } = useTablePagination(filteredOrders, 10, 'operational-orders');

  const openSheet = (filter: OrderListFilter) => {
    setListFilter(filter);
    setSheetFilter(filter);
  };

  return (
    <div className="ls-operational-work space-y-5">
      <OperationalTodayBanner plan={todayPlan} />

      <LogstokaPageHeader
        title="O que fazer agora"
        icon={<ScanLine size={18} />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <LogstokaDataModeBadge />
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
              {operationalModeLabel(profile.mode)}
            </span>
            <LogstokaIconTooltip label="Controle de fluxo">
              <Link to={LOGSTOKA_ROUTES.OPERATIONAL_FLOW} className="lsdash-icon-btn">
                <Workflow size={18} strokeWidth={2} aria-hidden />
              </Link>
            </LogstokaIconTooltip>
            <LogstokaIconTooltip label="Importar NF-e / planilha">
              <Link to="/app/imports" className="lsdash-icon-btn">
                <Upload size={18} strokeWidth={2} aria-hidden />
              </Link>
            </LogstokaIconTooltip>
          </div>
        }
      />

      {pendingDivergences > 0 ? (
        <Link
          to={LOGSTOKA_ROUTES.CONFERENCE_PENDING}
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
        >
          <AlertTriangle size={16} />
          {pendingDivergences} pendência(s) de conferência — corrigir
          <ArrowRight size={14} className="ml-auto" />
        </Link>
      ) : null}

      <div className="ls-op-hero-actions">
        {ACTION_CARDS.map((card) => (
          <button
            key={card.filter}
            type="button"
            className={`ls-op-hero-action ${card.className}${listFilter === card.filter ? ' ls-op-hero-action--active' : ''}${sheetFilter === card.filter ? ' ls-op-hero-action--sheet-open' : ''}`}
            onClick={() => openSheet(card.filter)}
          >
            <LogstokaClickableHint />
            <span className="ls-op-hero-action__count">{summary[card.countKey]}</span>
            <span className="ls-op-hero-action__label">{card.label}</span>
          </button>
        ))}
      </div>

      <OperationalFlowTimeline profile={profile} />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link to={LOGSTOKA_ROUTES.OPERATIONAL_FLOW} className="ls-op-toggle-flow">
          Abrir controle de fluxo
        </Link>
        {profile.mode === 'full' ? (
          <Link to={LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL} className="text-xs font-bold text-gray-500 hover:text-orange-600">
            Conectar canais →
          </Link>
        ) : null}
      </div>

      <section className="ls-op-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-gray-900">Lista de trabalho</h3>
            <p className="text-xs text-gray-500">
              {listFilter === 'late'
                ? 'Pedidos fora do prazo — prioridade máxima.'
                : listFilter === 'backlog'
                  ? 'Vendas acumuladas de dias anteriores.'
                  : listFilter === 'all'
                    ? 'Pedidos ainda na operação, sem envio.'
                    : 'Pedidos do seu foco de hoje.'}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="ls-btn-primary text-sm" onClick={() => openSheet(listFilter)}>
              Abrir lista completa
            </button>
            <Link to="/app/picking" className="ls-btn-secondary text-sm">Ir separar</Link>
          </div>
        </div>

        {summary.late > 0 && listFilter !== 'late' ? (
          <button
            type="button"
            className="mb-3 flex w-full items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-left text-sm font-bold text-red-700"
            onClick={() => openSheet('late')}
          >
            <AlertTriangle size={16} />
            {summary.late} pedidos atrasados — clique para abrir a lista
            <ArrowRight size={14} className="ml-auto" />
          </button>
        ) : null}

        <div className="ls-table-wrap">
          <table className="ls-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Canal</th>
                <th>Vendeu</th>
                <th>Expedir</th>
                <th>Etapa</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                    Nada nesta fila — bom trabalho.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((order: OperationalOrder) => (
                  <tr key={order.id} className={order.isLate ? 'ls-op-row--late' : undefined}>
                    <td>
                      <div className="font-bold text-gray-900">{order.orderRef}</div>
                      <div className="text-xs text-gray-500">{order.productName}</div>
                    </td>
                    <td className="text-sm">{order.marketplaceLabel}</td>
                    <td>
                      <div className="text-sm font-semibold">{order.saleDayLabel}</div>
                      <div className="text-xs text-gray-500">{fmtDate(order.soldAt)}</div>
                      {order.isBacklog ? (
                        <span className="text-[10px] font-bold uppercase text-amber-600">Acumulado</span>
                      ) : null}
                    </td>
                    <td>
                      <span className={order.isLate ? 'font-bold text-red-600' : 'font-semibold text-gray-800'}>
                        {order.dueDayLabel}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-bold text-gray-600">
                        {operationalStageLabel(order.stage)}
                      </span>
                      <div className="text-[10px] text-gray-400">{REPORT_SOURCE_LABELS[order.source]}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <LogstokaTableFooter {...footerProps} hidden={filteredOrders.length === 0} itemLabel="pedidos" />
      </section>

      <OperationalWorkSheetModal
        open={sheetFilter !== null}
        filter={sheetFilter}
        orders={orders}
        todayPlan={todayPlan}
        onClose={() => setSheetFilter(null)}
      />
    </div>
  );
};

export default OperationalWorkPage;
