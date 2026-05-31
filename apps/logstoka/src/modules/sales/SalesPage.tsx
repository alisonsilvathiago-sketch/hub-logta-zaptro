import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ShoppingCart } from 'lucide-react';
import BrazilSalesMap from '@/components/sales/BrazilSalesMap';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import LogstokaMoneyPrivacyToggle from '@/components/privacy/LogstokaMoneyPrivacyToggle';
import LogstokaMoneyValue from '@/components/privacy/LogstokaMoneyValue';
import { looksLikeMoney } from '@/lib/moneyPrivacy';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useSalesDashboard } from '@/hooks/useSalesDashboard';
import type { SalesOrderStatus } from '@/lib/salesDashboard';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import './salesPage.css';

const fmt = (n: number) => n.toLocaleString('pt-BR');
const fmtBrl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type SituationKey = 'in_progress' | 'fulfilled' | 'verified';
type SalesTableView = 'orders' | 'product' | 'state' | 'channel';

const SITUATION_OPTIONS: Array<{ key: SituationKey; label: string; statuses: SalesOrderStatus[] }> = [
  { key: 'in_progress', label: 'Em andamento', statuses: ['open'] },
  { key: 'fulfilled', label: 'Atendido', statuses: ['fulfilled'] },
  { key: 'verified', label: 'Verificado', statuses: ['fulfilled'] },
];

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromInputDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDateLabel = (date: Date) => date.toLocaleDateString('pt-BR');

const getDefaultDateRange = () => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from, to };
};

const diffDaysInclusive = (from: Date, to: Date) =>
  Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1);

const SALES_TABLE_VIEWS: Array<{ value: SalesTableView; label: string; description: string }> = [
  { value: 'orders', label: 'Pedidos recentes', description: 'Onde vendeu · plataforma · estado · cidade.' },
  { value: 'product', label: 'Por produto', description: 'SKUs vendidos no período com custo, valor e markup.' },
  { value: 'state', label: 'Por estado', description: 'Distribuição geográfica das vendas por UF.' },
  { value: 'channel', label: 'Por canal', description: 'Marketplace e loja integrada — origem via API.' },
];

const SalesPage: React.FC = () => {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef = useRef<HTMLInputElement>(null);

  const [periodDays, setPeriodDays] = useState(() => diffDaysInclusive(defaultRange.from, defaultRange.to));
  const [draftSituations, setDraftSituations] = useState<Set<SituationKey>>(
    () => new Set(SITUATION_OPTIONS.map((option) => option.key)),
  );
  const [appliedSituations, setAppliedSituations] = useState<Set<SituationKey>>(
    () => new Set(SITUATION_OPTIONS.map((option) => option.key)),
  );
  const [draftDateFrom, setDraftDateFrom] = useState(toInputDate(defaultRange.from));
  const [draftDateTo, setDraftDateTo] = useState(toInputDate(defaultRange.to));
  const [appliedDateFrom, setAppliedDateFrom] = useState(draftDateFrom);
  const [appliedDateTo, setAppliedDateTo] = useState(draftDateTo);
  const [productSearch, setProductSearch] = useState('');
  const [tableView, setTableView] = useState<SalesTableView>('orders');
  const { data, loading, error } = useSalesDashboard(periodDays);

  const toggleSituation = (key: SituationKey) => {
    setDraftSituations((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openDatePicker = (target: 'from' | 'to') => {
    const input = target === 'from' ? dateFromRef.current : dateToRef.current;
    input?.showPicker?.();
    input?.focus();
  };

  const handleVisualizar = () => {
    const from = fromInputDate(draftDateFrom);
    const to = fromInputDate(draftDateTo);
    const safeTo = to < from ? from : to;

    setAppliedSituations(new Set(draftSituations));
    setAppliedDateFrom(draftDateFrom);
    setAppliedDateTo(toInputDate(safeTo));
    setPeriodDays(diffDaysInclusive(from, safeTo));
  };

  const allowedStatuses = useMemo(() => {
    if (appliedSituations.size === 0) return null;
    const statuses = new Set<SalesOrderStatus>();
    for (const option of SITUATION_OPTIONS) {
      if (appliedSituations.has(option.key)) {
        option.statuses.forEach((status) => statuses.add(status));
      }
    }
    return statuses;
  }, [appliedSituations]);

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    return data.orders.filter((order) => !allowedStatuses || allowedStatuses.has(order.status));
  }, [allowedStatuses, data]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    const term = productSearch.trim().toLowerCase();
    if (!term) return data.byProduct;
    return data.byProduct.filter(
      (row) => row.sku.toLowerCase().includes(term) || row.name.toLowerCase().includes(term),
    );
  }, [data, productSearch]);

  const paginationKey = `${tableView}-${periodDays}-${[...appliedSituations].join('-')}-${productSearch}`;

  const { paginatedItems: paginatedProducts, footerProps: productFooter } = useTablePagination(
    filteredProducts,
    10,
    `product-${paginationKey}`,
  );

  const { paginatedItems: paginatedStates, footerProps: stateFooter } = useTablePagination(
    data?.byState ?? [],
    10,
    `state-${paginationKey}`,
  );

  const { paginatedItems: paginatedChannels, footerProps: channelFooter } = useTablePagination(
    data?.byChannel ?? [],
    10,
    `channel-${paginationKey}`,
  );

  const { paginatedItems: paginatedOrders, footerProps: ordersFooter } = useTablePagination(
    filteredOrders,
    10,
    `orders-${paginationKey}`,
  );

  const tableFooter =
    tableView === 'orders'
      ? ordersFooter
      : tableView === 'product'
        ? productFooter
        : tableView === 'state'
          ? stateFooter
          : channelFooter;

  const tableFooterLabel =
    tableView === 'orders'
      ? 'pedidos'
      : tableView === 'product'
        ? 'produtos'
        : tableView === 'state'
          ? 'estados'
          : 'canais';

  const activeTableMeta = SALES_TABLE_VIEWS.find((view) => view.value === tableView) ?? SALES_TABLE_VIEWS[0];

  const statusTone: Record<SalesOrderStatus, string> = {
    fulfilled: 'ls-sales-status--ok',
    open: 'ls-sales-status--open',
    cancelled: 'ls-sales-status--cancel',
  };

  return (
    <div className="ls-sales-page space-y-6">
      <LogstokaPageHeader
        icon={<ShoppingCart size={20} strokeWidth={2.25} />}
        title="Pedidos de venda"
        subtitle="Vendas sincronizadas dos marketplaces — canal, estado e local via integração/API."
        showMoneyPrivacy
      />

      <div className="ls-sales-page__toolbar">
        <div className="ls-sales-page__toolbar-field ls-sales-page__toolbar-field--wide">
          <span className="ls-sales-page__toolbar-label">Situação de Venda</span>
          <div className="ls-sales-page__chips">
            {SITUATION_OPTIONS.map((option) => {
              const active = draftSituations.has(option.key);
              return (
                <button
                  key={option.key}
                  type="button"
                  className={`ls-sales-page__chip${active ? ' ls-sales-page__chip--active' : ''}`}
                  onClick={() => toggleSituation(option.key)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ls-sales-page__toolbar-field">
          <span className="ls-sales-page__toolbar-label">Data</span>
          <div className="ls-sales-page__date-range">
            <div className="ls-sales-page__date-display">
              <button type="button" className="ls-sales-page__date-part" onClick={() => openDatePicker('from')}>
                {formatDateLabel(fromInputDate(draftDateFrom))}
              </button>
              <span className="ls-sales-page__date-sep">à</span>
              <button type="button" className="ls-sales-page__date-part" onClick={() => openDatePicker('to')}>
                {formatDateLabel(fromInputDate(draftDateTo))}
              </button>
              <input
                ref={dateFromRef}
                type="date"
                className="ls-sales-page__date-input"
                value={draftDateFrom}
                onChange={(event) => setDraftDateFrom(event.target.value)}
                aria-label="Data inicial"
              />
              <input
                ref={dateToRef}
                type="date"
                className="ls-sales-page__date-input"
                value={draftDateTo}
                onChange={(event) => setDraftDateTo(event.target.value)}
                aria-label="Data final"
              />
            </div>
            <button
              type="button"
              className="ls-sales-page__date-btn"
              aria-label="Abrir calendário"
              onClick={() => openDatePicker('from')}
            >
              <CalendarDays size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        <button type="button" className="ls-sales-page__view-btn" disabled={loading} onClick={handleVisualizar}>
          {loading ? 'Carregando…' : 'Visualizar'}
        </button>
      </div>

      <p className="ls-sales-page__range-note">
        Período aplicado: {formatDateLabel(fromInputDate(appliedDateFrom))} à {formatDateLabel(fromInputDate(appliedDateTo))}
      </p>

      {error ? <div className="ls-sales-page__alert">{error}</div> : null}

      <div className="ls-sales-kpi-grid">
        {[
          { label: 'Pedidos', value: fmt(data?.summary.orders ?? 0) },
          { label: 'Quantidade', value: fmt(data?.summary.quantity ?? 0) },
          { label: 'Valor', value: fmtBrl(data?.summary.value ?? 0), accent: true },
          { label: 'Frete', value: fmtBrl(data?.summary.freight ?? 0) },
          { label: 'Ticket médio', value: fmtBrl(data?.summary.avgTicket ?? 0) },
        ].map(({ label, value, accent }) => {
          const monetary = looksLikeMoney(value);
          const valueClass = `ls-sales-kpi__value${accent ? ' ls-sales-kpi__value--accent' : ''}${monetary ? ' ls-sales-kpi__value--money' : ''}`;
          return (
            <div key={label} className="ls-sales-kpi">
              <p className="ls-sales-kpi__label">{label}</p>
              {monetary ? (
                <div className="ls-products-kpi__value-row">
                  <LogstokaMoneyPrivacyToggle size="sm" />
                  <LogstokaMoneyValue className={valueClass} isMoney>
                    {value}
                  </LogstokaMoneyValue>
                </div>
              ) : (
                <p className={valueClass}>{value}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="ls-sales-grid-2 ls-sales-grid-2--situation-map">
        <section className="ls-sales-panel">
          <div className="ls-sales-panel__head">
            <h3>Situação</h3>
          </div>
          <div className="ls-sales-status-list">
            {(data?.statusBreakdown ?? []).map((row) => (
              <div key={row.status} className="ls-sales-status-row">
                <div className="ls-sales-status-row__top">
                  <span>{row.label}</span>
                  <strong>
                    {fmt(row.count)} · {fmtBrl(row.value)}
                  </strong>
                </div>
                <div className="ls-sales-status-row__bar">
                  <span
                    className={`ls-sales-status-row__fill ${statusTone[row.status]}`}
                    style={{ width: `${Math.max(row.percent, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ls-sales-panel ls-sales-panel--map">
          <BrazilSalesMap
            states={data?.byState ?? []}
            summary={
              data?.summary ?? {
                orders: 0,
                quantity: 0,
                value: 0,
                freight: 0,
                avgTicket: 0,
              }
            }
            formatMoney={fmtBrl}
            formatNumber={fmt}
          />
        </section>
      </div>

      <section className="ls-sales-panel">
        <div className="ls-sales-panel__head ls-sales-panel__head--split">
          <div className="ls-sales-panel__head-main">
            <h3>Detalhamento de vendas</h3>
            <p>{activeTableMeta.description}</p>
          </div>

          <div className="ls-sales-table-toolbar">
            <div className="ls-sales-view-switch" role="tablist" aria-label="Visão da tabela de vendas">
              {SALES_TABLE_VIEWS.map((view) => (
                <button
                  key={view.value}
                  type="button"
                  role="tab"
                  aria-selected={tableView === view.value}
                  className={`ls-sales-view-switch__btn${tableView === view.value ? ' ls-sales-view-switch__btn--active' : ''}`}
                  onClick={() => setTableView(view.value)}
                >
                  {view.label}
                </button>
              ))}
            </div>

            {tableView === 'product' ? (
              <input
                className="ls-input ls-sales-page__search"
                placeholder="Procurar SKU ou produto"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
              />
            ) : null}
          </div>
        </div>

        <div className="ls-table-wrap">
          {tableView === 'orders' ? (
            <table className="ls-table ls-sales-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Produto</th>
                  <th>Canal</th>
                  <th>Local</th>
                  <th>Qtd</th>
                  <th>Valor</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((row) => (
                  <tr key={row.id}>
                    <td className="font-bold ls-sales-table__order-ref">{row.orderRef}</td>
                    <td>
                      {row.productName}
                      <span className="ls-sales-table__muted">{row.sku}</span>
                    </td>
                    <td>
                      <span className="ls-sales-table__channel">
                        {row.marketplace !== 'manual' ? (
                          <MarketplaceLogo marketplace={row.marketplace} size={18} className="ls-sales-table__channel-logo" />
                        ) : null}
                        {row.marketplace === 'manual' ? (
                          row.storeName
                        ) : (
                          <Link
                            to={LOGSTOKA_ROUTES.marketplaceHub(row.marketplace)}
                            className="text-orange-700 hover:underline"
                          >
                            {row.storeName}
                          </Link>
                        )}
                      </span>
                    </td>
                    <td>
                      {row.state} · {row.city}
                    </td>
                    <td>{fmt(row.quantity)}</td>
                    <td className="ls-sales-table__money">{fmtBrl(row.value)}</td>
                    <td>
                      <span
                        className={`ls-badge ${row.status === 'fulfilled' ? 'bg-orange-50 text-orange-700' : row.status === 'open' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}
                      >
                        {row.status === 'fulfilled'
                          ? 'Atendido'
                          : row.status === 'open'
                            ? 'Em aberto'
                            : 'Cancelado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {tableView === 'product' ? (
            <table className="ls-table ls-sales-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Quantidade</th>
                  <th>Custo</th>
                  <th>Valor</th>
                  <th>Markup</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((row) => (
                  <tr key={row.sku}>
                    <td className="font-bold">{row.sku}</td>
                    <td>{row.name}</td>
                    <td>{fmt(row.quantity)}</td>
                    <td>{fmtBrl(row.cost)}</td>
                    <td className="ls-sales-table__money">{fmtBrl(row.value)}</td>
                    <td>{fmt(row.markup)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {tableView === 'state' ? (
            <table className="ls-table ls-sales-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Frete médio</th>
                  <th>Peças</th>
                  <th>Pedidos</th>
                  <th>Ticket médio</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStates.map((row) => (
                  <tr key={row.state}>
                    <td>
                      <strong>{row.state}</strong>
                      <span className="ls-sales-table__muted">{row.stateName}</span>
                    </td>
                    <td>{fmtBrl(row.avgFreight)}</td>
                    <td>{fmt(row.pieces)}</td>
                    <td>{fmt(row.orders)}</td>
                    <td>{fmtBrl(row.avgTicket)}</td>
                    <td className="ls-sales-table__money">{fmtBrl(row.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {tableView === 'channel' ? (
            <table className="ls-table ls-sales-table">
              <thead>
                <tr>
                  <th>Loja / Canal</th>
                  <th>Pedidos</th>
                  <th>Ticket médio</th>
                  <th>Quantidade</th>
                  <th>Valor</th>
                  <th>Frete</th>
                  <th>Markup</th>
                  <th>% Contrib.</th>
                </tr>
              </thead>
              <tbody>
                {paginatedChannels.map((row) => (
                  <tr key={row.storeName}>
                    <td>
                      <span className="ls-sales-table__channel">
                        {row.marketplace !== 'manual' ? (
                          <MarketplaceLogo marketplace={row.marketplace} size={18} className="ls-sales-table__channel-logo" />
                        ) : null}
                        <span>
                          <strong>{row.storeName}</strong>
                          <span className="ls-sales-table__muted">{row.channel}</span>
                        </span>
                      </span>
                    </td>
                    <td>{fmt(row.orders)}</td>
                    <td>{fmtBrl(row.avgTicket)}</td>
                    <td>{fmt(row.quantity)}</td>
                    <td className="ls-sales-table__money">{fmtBrl(row.value)}</td>
                    <td>{fmtBrl(row.freight)}</td>
                    <td>{fmt(row.markup)}%</td>
                    <td>{fmt(row.contributionPct)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>

        <LogstokaTableFooter
          {...tableFooter}
          itemLabel={tableFooterLabel}
          hidden={
            tableView === 'orders'
              ? filteredOrders.length === 0
              : tableView === 'product'
                ? filteredProducts.length === 0
                : tableView === 'state'
                  ? (data?.byState?.length ?? 0) === 0
                  : (data?.byChannel?.length ?? 0) === 0
          }
        />
      </section>

      <p className="ls-sales-page__sync">
        Última sincronização: {data?.lastSyncAt ? new Date(data.lastSyncAt).toLocaleString('pt-BR') : '—'}
      </p>
    </div>
  );
};

export default SalesPage;
