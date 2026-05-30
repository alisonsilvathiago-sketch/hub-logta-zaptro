import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeftRight,
  Bell,
  Box,
  Package,
  RefreshCw,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import ClickableTableRow from '@/components/ui/ClickableTableRow';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useTablePagination } from '@/hooks/useTablePagination';
import {
  downloadBaixaDocument,
  getMarketplaceHubData,
  resolveMarketplaceHubSlug,
  type MarketplaceSaleOrder,
} from '@/lib/marketplaceHub';
import { marketplaceStorePath } from '@/lib/marketplaceStores';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';
import MarketplaceHubNotifications from './MarketplaceHubNotifications';
import MarketplaceSalesSection from './MarketplaceSalesSection';
import { HubHeroIconButton, HubHeroIconLink } from './HubHeroIconAction';
import './marketplaceHub.css';

const fmt = (n: number) => n.toLocaleString('pt-BR');
const fmtBrl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const MarketplaceHubPage: React.FC = () => {
  const { pathname } = useLocation();
  const marketplaceSlug = pathname.replace(/^\/app\/?/, '').split('/')[0] ?? '';
  const marketplace = marketplaceSlug ? resolveMarketplaceHubSlug(marketplaceSlug) : null;
  const [orders, setOrders] = useState<MarketplaceSaleOrder[]>([]);
  const [syncing, setSyncing] = useState(false);

  const hub = useMemo(
    () => (marketplace ? getMarketplaceHubData(marketplace) : null),
    [marketplace],
  );

  React.useEffect(() => {
    if (hub) setOrders(hub.saleOrders);
  }, [hub]);

  const listings = hub?.listings ?? [];
  const { paginatedItems: paginatedListings, footerProps: listingsFooterProps } = useTablePagination(listings);

  if (!marketplace || !hub) {
    return (
      <div className="ls-hub-panel text-sm text-[#a3a3a3]">
        Integração não encontrada. Verifique a URL (ex.: <code>/app/mercadolivre</code>).
      </div>
    );
  }

  const { aggregate, syncIssues } = hub;
  const pendingBaixa = orders.filter((o) => o.status === 'pending_baixa').length;
  const hasSalesHighlight = pendingBaixa > 0 || aggregate.ordersToday > 0;

  const runSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast.success(`[${hub.label}] Sync automático concluído — ${listings.length} anúncios atualizados`);
    }, 1200);
  };

  const handleBaixa = (order: MarketplaceSaleOrder) => {
    const product = DEMO_PRODUCTS.find((p) => p.sku === order.sku);
    downloadBaixaDocument(marketplace, order, product);
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: 'baixa_done' as const } : o)),
    );
    toast.success(`Documento de baixa gerado · pedido ${order.orderRef}`);
  };

  const kpis = [
    { label: 'Armazenado', value: `${fmt(aggregate.stockUnits)} un`, icon: Box, highlight: false },
    { label: 'Valor em estoque', value: fmtBrl(aggregate.stockValue), icon: Package, highlight: false },
    { label: 'Saídas hoje', value: fmt(aggregate.exitsToday), icon: ArrowLeftRight, highlight: false },
    {
      label: 'Pedidos hoje',
      value: fmt(aggregate.ordersToday),
      icon: TrendingUp,
      highlight: hasSalesHighlight,
      notify: pendingBaixa > 0,
    },
  ];

  return (
    <div className="ls-hub-page space-y-8">
      <section className="ls-hub-hero">
        <div className="flex items-start gap-5">
          <MarketplaceLogo marketplace={marketplace} size={64} />
          <div>
            <p className="ls-hub-hero__eyebrow">Interação · WMS automático</p>
            <h1 className="ls-hub-hero__title">{hub.label}</h1>
            <p className="ls-hub-hero__desc">
              Painel operacional premium da integração. Produtos, vendas e baixas sincronizados em tempo real —
              sem configuração manual.
            </p>
            <div className="ls-hub-hero__status">
              <span className="ls-hub-hero__status-dot" aria-hidden />
              Integração ativa · Sync {aggregate.syncPercent}%
            </div>
          </div>
        </div>
        <div className="ls-icon-nav ls-icon-nav--inline">
          <div className="ls-icon-nav__group">
            <MarketplaceHubNotifications
              saleOrders={orders}
              syncIssues={syncIssues}
              listings={listings}
            />
            <HubHeroIconButton
              title={syncing ? 'Sincronizando…' : 'Sync agora'}
              disabled={syncing}
              onClick={runSync}
            >
              <RefreshCw size={18} strokeWidth={2.2} className={syncing ? 'animate-spin' : ''} />
            </HubHeroIconButton>
            <HubHeroIconLink to={LOGSTOKA_ROUTES.SETTINGS_INTEGRATIONS} title="Configurar integração">
              <Settings size={18} strokeWidth={2.2} />
            </HubHeroIconLink>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, highlight, notify }) => (
          <div key={label} className={`ls-hub-kpi${highlight ? ' ls-hub-kpi--highlight' : ''}`}>
            {notify ? (
              <span className="ls-hub-kpi__notify" title="Vendas aguardando ação">
                <Bell size={15} strokeWidth={2.2} />
              </span>
            ) : null}
            <div className="ls-hub-kpi__label">
              <Icon size={15} strokeWidth={2.2} />
              {label}
            </div>
            <p className="ls-hub-kpi__value">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="ls-hub-panel">
          <h3 className="ls-hub-panel__title">Saídas</h3>
          <dl className="mt-2">
            <div className="ls-hub-panel__row">
              <dt>Hoje</dt>
              <dd>{fmt(aggregate.exitsToday)}</dd>
            </div>
            <div className="ls-hub-panel__row">
              <dt>Mês</dt>
              <dd>{fmt(aggregate.exitsMonth)}</dd>
            </div>
            <div className="ls-hub-panel__row">
              <dt>Ano</dt>
              <dd>{fmt(aggregate.exitsYear)}</dd>
            </div>
          </dl>
        </div>

        <div className="ls-hub-panel">
          <h3 className="ls-hub-panel__title">Lojas vinculadas</h3>
          <ul className="mt-2 space-y-1">
            {hub.stores.map((s) => (
              <li key={s.id}>
                <Link to={marketplaceStorePath(s.marketplace, s.slug)} className="ls-hub-store-link">
                  <img src={s.logoUrl} alt="" className="h-8 w-8 rounded-xl object-cover" />
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="ls-hub-panel">
          <h3 className="ls-hub-panel__title">Pedidos</h3>
          <dl className="mt-2">
            <div className="ls-hub-panel__row">
              <dt>Hoje</dt>
              <dd>{fmt(aggregate.ordersToday)}</dd>
            </div>
            <div className="ls-hub-panel__row">
              <dt>Mês</dt>
              <dd>{fmt(aggregate.ordersMonth)}</dd>
            </div>
            <div className="ls-hub-panel__row">
              <dt>Anúncios ativos</dt>
              <dd>{listings.length}</dd>
            </div>
          </dl>
        </div>
      </div>

      <MarketplaceSalesSection
        id="hub-vendas"
        orders={orders.map((order) => ({
          ...order,
          marketplace,
          marketplaceLabel: hub.label,
          hubPath: hub.hubPath,
        }))}
        onBaixa={handleBaixa}
        description={`Pedidos pagos no ${hub.label}. Vendas pendentes aparecem em destaque com notificação.`}
        showMarketplaceBadge={false}
      />

      <div id="hub-produtos">
        <h3 className="ls-hub-section-title">Produtos no {hub.label}</h3>
        <p className="ls-hub-section-desc">Cadastrados automaticamente — estoque WMS vs anúncio.</p>
        <div className="ls-table-wrap">
          <table className="ls-table">
            <thead>
              <tr>
                <th>SKU WMS</th>
                <th>Produto</th>
                <th>ID {hub.label}</th>
                <th>Preço</th>
                <th>Est. anúncio</th>
                <th>Est. WMS</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedListings.map((l) => (
                <ClickableTableRow key={l.productId} to={`/app/products/${l.productId}`}>
                  <td className="font-bold">{l.sku}</td>
                  <td>{l.name}</td>
                  <td>{l.externalId}</td>
                  <td>{fmtBrl(l.price)}</td>
                  <td>{l.stockListed}</td>
                  <td>{l.stockWms}</td>
                  <td>
                    <span
                      className={`ls-badge ${
                        l.syncStatus === 'ok'
                          ? 'bg-orange-50 text-orange-700'
                          : l.syncStatus === 'warning'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {l.syncStatus === 'ok' ? 'OK' : l.syncStatus === 'warning' ? 'Atenção' : 'Erro'}
                    </span>
                  </td>
                </ClickableTableRow>
              ))}
            </tbody>
          </table>
        </div>
        <LogstokaTableFooter {...listingsFooterProps} itemLabel="anúncios" />
      </div>
    </div>
  );
};

export default MarketplaceHubPage;
