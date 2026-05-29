import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftRight, Box, Package, TrendingUp } from 'lucide-react';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import {
  getMarketplaceAggregateStats,
  getStoreStatsBySlug,
  getStoresByMarketplace,
  marketplaceStorePath,
  type MarketplaceStoreStats,
} from '@/lib/marketplaceStores';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { MARKETPLACE_LABELS, type Marketplace } from '@/types';

const fmt = (n: number) => n.toLocaleString('pt-BR');
const fmtBrl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type Props = { embedded?: boolean };

const MarketplaceStorePage: React.FC<Props> = ({ embedded: _embedded }) => {
  const { marketplace, storeSlug } = useParams<{ marketplace: Marketplace; storeSlug?: string }>();
  const mp = marketplace as Marketplace | undefined;

  if (!mp || !(mp in MARKETPLACE_LABELS)) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm text-slate-500">
        Marketplace não encontrado.
      </div>
    );
  }

  const store = storeSlug ? getStoreStatsBySlug(mp, storeSlug) : null;
  const aggregate = getMarketplaceAggregateStats(mp);
  const stats = store ?? {
    name: MARKETPLACE_LABELS[mp],
    logoUrl: '',
    stockUnits: aggregate.stockUnits,
    stockValue: aggregate.stockValue,
    exitsToday: aggregate.exitsToday,
    exitsMonth: aggregate.exitsMonth,
    exitsYear: aggregate.exitsYear,
    entriesToday: aggregate.entriesToday,
    entriesMonth: aggregate.entriesMonth,
    ordersToday: aggregate.ordersToday,
    ordersMonth: aggregate.ordersMonth,
    syncPercent: aggregate.syncPercent,
    status: 'connected' as const,
    recentEvents: [] as MarketplaceStoreStats['recentEvents'],
  };

  const stores = getStoresByMarketplace(mp);
  const isStoreView = Boolean(store);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-start gap-4">
          {isStoreView && store?.logoUrl ? (
            <img src={store.logoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200" />
          ) : (
            <MarketplaceLogo marketplace={mp} size={56} />
          )}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <MarketplaceLogo marketplace={mp} size={22} />
              <span className="text-xs font-bold uppercase text-slate-400">{MARKETPLACE_LABELS[mp]}</span>
            </div>
            <h2 className="text-xl font-black text-gray-900">{stats.name}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {isStoreView
                ? 'Painel operacional da loja — estoque, saídas e pedidos sincronizados automaticamente.'
                : 'Visão consolidada do marketplace — todas as lojas integradas.'}
            </p>
            <span className={`ls-badge mt-2 ${stats.status === 'connected' ? 'bg-orange-50 text-orange-700' : stats.status === 'syncing' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
              {stats.status === 'connected' ? 'Integração ativa' : stats.status === 'syncing' ? 'Sincronizando' : 'Atenção'}
            </span>
          </div>
        </div>
        <Link to={LOGSTOKA_ROUTES.SETTINGS_INTEGRATIONS} className="ls-btn-secondary">
          ← Integrações
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Armazenado (un)', value: fmt(stats.stockUnits), icon: Box },
          { label: 'Valor em estoque', value: fmtBrl(stats.stockValue), icon: Package },
          { label: 'Saídas hoje', value: fmt(stats.exitsToday), icon: ArrowLeftRight },
          { label: 'Pedidos hoje', value: fmt(stats.ordersToday), icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <Icon size={16} />
              <span className="text-[10px] font-bold uppercase">{label}</span>
            </div>
            <p className="text-xl font-black text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 lg:col-span-1">
          <h3 className="font-black text-gray-900">Saídas</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Hoje</dt><dd className="font-bold">{fmt(stats.exitsToday)} un</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Este mês</dt><dd className="font-bold">{fmt(stats.exitsMonth)} un</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Este ano</dt><dd className="font-bold">{fmt(stats.exitsYear)} un</dd></div>
          </dl>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 lg:col-span-1">
          <h3 className="font-black text-gray-900">Pedidos</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Hoje</dt><dd className="font-bold">{fmt(stats.ordersToday)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Este mês</dt><dd className="font-bold">{fmt(stats.ordersMonth)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Sync estoque</dt><dd className="font-bold text-orange-600">{stats.syncPercent}%</dd></div>
          </dl>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 lg:col-span-1">
          <h3 className="font-black text-gray-900">Entradas</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Hoje</dt><dd className="font-bold">{fmt(store?.entriesToday ?? 0)} un</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Este mês</dt><dd className="font-bold">{fmt(store?.entriesMonth ?? 0)} un</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Lojas ativas</dt><dd className="font-bold">{stores.length}</dd></div>
          </dl>
        </div>
      </div>

      {!isStoreView && stores.length > 0 && (
        <div>
          <h3 className="mb-3 font-black text-gray-900">Lojas integradas</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {stores.map((s) => (
              <Link
                key={s.id}
                to={marketplaceStorePath(s.marketplace, s.slug)}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-orange-200 hover:bg-orange-50/30"
              >
                <img src={s.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200" />
                <div className="min-w-0 flex-1">
                  <p className="font-black text-gray-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{fmt(s.stockUnits)} un · {fmt(s.exitsToday)} saídas hoje</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(store?.recentEvents?.length ?? 0) > 0 && (
        <div>
          <h3 className="mb-3 font-black text-gray-900">Atividade recente</h3>
          <div className="space-y-2">
            {store!.recentEvents.map((ev, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-gray-900">{ev.title}</p>
                  <span className="text-xs text-slate-400">{ev.at}</span>
                </div>
                <p className="text-slate-600">{ev.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceStorePage;
