import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Package, RotateCcw, Share2 } from 'lucide-react';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { supabase } from '@/lib/supabase';
import { logstokaApi } from '@/lib/logstokaApi';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import {
  getAllConnectedStores,
  getProductStorePublications,
  isPublishedOnStore,
  PUBLICATION_STATUS_LABELS,
  storesGroupedByMarketplace,
} from '@/lib/productPublication';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import {
  getDemoCategoryName,
  getDemoProductById,
  getDemoProductMovementStats,
  getDemoProductStockStats,
  getDemoProductTimeline,
  marketplaceLabel,
  movementTypeLabel,
} from '@/lib/logstokaDemoSeed';
import type { LsProduct, LsStockMovement, Marketplace, MovementType } from '@/types';
import { MARKETPLACE_LABELS } from '@/types';
import './productDetail.css';

const fmtBrl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtQty = (value: number) => value.toLocaleString('pt-BR');

function movementQtyClass(type: MovementType | string): string {
  if (type === 'exit' || type === 'damage') return 'ls-product-detail-timeline-item__qty--exit';
  if (type === 'entry') return 'ls-product-detail-timeline-item__qty--entry';
  if (type === 'return') return 'ls-product-detail-timeline-item__qty--return';
  return '';
}

function movementSign(type: MovementType | string): string {
  if (type === 'exit' || type === 'damage') return '−';
  if (type === 'entry') return '+';
  return '';
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { companyId } = useLogstokaTenant();
  const [product, setProduct] = useState<LsProduct | null>(null);
  const [timeline, setTimeline] = useState<LsStockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const isDemo = companyId ? isLogstokaDemoCompany(companyId) : false;

  useEffect(() => {
    if (!id || !companyId) return;

    if (isLogstokaDemoCompany(companyId)) {
      const p = getDemoProductById(id);
      setProduct(p);
      setTimeline(p ? getDemoProductTimeline(id) : []);
      setLoading(false);
      return;
    }

    setLoading(true);
    void supabase
      .from('ls_products')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()
      .then(({ data }) => setProduct(data as LsProduct));

    void logstokaApi
      .getProductTimeline(id)
      .then((res) => setTimeline((res.data ?? []) as LsStockMovement[]))
      .catch(() => setTimeline([]))
      .finally(() => setLoading(false));
  }, [id, companyId]);

  const stockStats = useMemo(() => {
    if (!product || !isDemo) return { total: 0, reserved: 0, available: 0, rows: [] };
    return getDemoProductStockStats(product.id);
  }, [product, isDemo]);

  const movementStats = useMemo(() => {
    if (!product || !isDemo) {
      const sumType = (type: MovementType) =>
        timeline.filter((m) => m.movement_type === type).reduce((sum, m) => sum + m.total_quantity, 0);
      return {
        entries: sumType('entry'),
        exits: sumType('exit'),
        returns: sumType('return'),
        transfers: sumType('transfer'),
        damage: sumType('damage'),
      };
    }
    return getDemoProductMovementStats(product.id);
  }, [product, isDemo, timeline]);

  const marginPct = useMemo(() => {
    if (!product || product.sale_price <= 0) return 0;
    return Math.round(((product.sale_price - product.cost) / product.sale_price) * 100);
  }, [product]);

  const lowStock = product ? stockStats.total <= product.min_stock : false;
  const pubStatus = product?.publication_status ?? 'draft';
  const storesByMp = storesGroupedByMarketplace();
  const publishedCount = companyId && product
    ? getProductStorePublications(companyId, product.id).filter((p) => p.status === 'published').length
    : 0;
  const totalStores = getAllConnectedStores().length;

  if (loading || !product) {
    return (
      <LogstokaDetailPageLayout backTo={LOGSTOKA_ROUTES.PRODUCTS} title="Produto" subtitle={loading ? 'Carregando…' : 'Não encontrado'}>
        {!loading && <div className="ls-card text-sm text-slate-500">Produto não encontrado.</div>}
      </LogstokaDetailPageLayout>
    );
  }

  return (
    <LogstokaDetailPageLayout
      backTo={LOGSTOKA_ROUTES.PRODUCTS}
      backLabel="Voltar para produtos"
      hideTitleRow
    >
      <div className="ls-product-detail space-y-6">
        {/* Hero */}
        <section className="ls-product-detail-hero">
          {product.main_image_url ? (
            <img src={product.main_image_url} alt="" className="ls-product-detail-hero__image" />
          ) : (
            <div className="ls-product-detail-hero__image ls-product-detail-hero__image--empty">Sem foto</div>
          )}
          <div>
            <p className="ls-product-detail-hero__eyebrow">Cadastro universal</p>
            <h1 className="ls-product-detail-hero__title">{product.name}</h1>
            <div className="ls-product-detail-hero__meta">
              <span className="ls-badge bg-slate-100 text-slate-700">SKU {product.sku}</span>
              <span className="ls-badge bg-slate-100 text-slate-700">{getDemoCategoryName(product.category_id)}</span>
              <span
                className={`ls-badge ${
                  pubStatus === 'published'
                    ? 'bg-orange-50 text-orange-700'
                    : pubStatus === 'ready'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {PUBLICATION_STATUS_LABELS[pubStatus]}
              </span>
              {lowStock && (
                <span className="ls-badge bg-red-50 text-red-700">Estoque baixo</span>
              )}
            </div>
            {product.description_short && (
              <p className="mt-3 max-w-2xl text-sm font-medium text-[#525252]">{product.description_short}</p>
            )}
          </div>
          <div className="ls-product-detail-hero__aside">
            <Link to={LOGSTOKA_ROUTES.PRODUCT_PUBLICATION} className="ls-btn-primary ls-product-detail-hero__publish">
              <Share2 size={16} />
              Publicar
            </Link>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#a3a3a3]">Publicado em</p>
            <p className="mt-1 text-3xl font-black text-orange-600">
              {publishedCount}
              <span className="text-lg font-bold text-[#a3a3a3]">/{totalStores}</span>
            </p>
            <p className="mt-1 text-xs font-semibold text-[#a3a3a3]">lojas conectadas</p>
          </div>
        </section>

        {/* KPIs de estoque */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className={`ls-product-detail-kpi ${lowStock ? 'ls-product-detail-kpi--danger' : ''}`}>
            <p className="ls-product-detail-kpi__label">Em estoque</p>
            <p className="ls-product-detail-kpi__value ls-product-detail-kpi__value--primary">{fmtQty(stockStats.total)}</p>
            <p className="ls-product-detail-kpi__hint">unidades totais</p>
          </div>
          <div className="ls-product-detail-kpi">
            <p className="ls-product-detail-kpi__label">Disponível</p>
            <p className="ls-product-detail-kpi__value">{fmtQty(stockStats.available)}</p>
            <p className="ls-product-detail-kpi__hint">livre para venda</p>
          </div>
          <div className="ls-product-detail-kpi">
            <p className="ls-product-detail-kpi__label">Reservado</p>
            <p className="ls-product-detail-kpi__value">{fmtQty(stockStats.reserved)}</p>
            <p className="ls-product-detail-kpi__hint">pedidos em aberto</p>
          </div>
          <div className="ls-product-detail-kpi">
            <p className="ls-product-detail-kpi__label">Saídas</p>
            <p className="ls-product-detail-kpi__value ls-product-detail-kpi__value--danger">{fmtQty(movementStats.exits)}</p>
            <p className="ls-product-detail-kpi__hint">vendas e expedições</p>
          </div>
          <div className="ls-product-detail-kpi ls-product-detail-kpi--alert">
            <p className="ls-product-detail-kpi__label">Devoluções</p>
            <p className="ls-product-detail-kpi__value ls-product-detail-kpi__value--primary">{fmtQty(movementStats.returns)}</p>
            <p className="ls-product-detail-kpi__hint">retornos de clientes</p>
          </div>
          <div className={`ls-product-detail-kpi ${lowStock ? 'ls-product-detail-kpi--danger' : ''}`}>
            <p className="ls-product-detail-kpi__label">Estoque mínimo</p>
            <p className="ls-product-detail-kpi__value">{fmtQty(product.min_stock)}</p>
            <p className="ls-product-detail-kpi__hint">
              {lowStock ? `Faltam ${fmtQty(product.min_stock - stockStats.total)} un.` : 'dentro do limite'}
            </p>
          </div>
        </div>

        {/* Preços */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="ls-product-detail-price">
            <p className="ls-product-detail-price__label">Custo</p>
            <p className="ls-product-detail-price__value ls-product-detail-price__value--cost">{fmtBrl(product.cost)}</p>
            <p className="ls-product-detail-price__sub">valor de compra</p>
          </div>
          <div className="ls-product-detail-price">
            <p className="ls-product-detail-price__label">Preço de venda</p>
            <p className="ls-product-detail-price__value ls-product-detail-price__value--sale">{fmtBrl(product.sale_price)}</p>
            <p className="ls-product-detail-price__sub">cadastrado no LogStoka</p>
          </div>
          {product.promo_price != null && product.promo_price > 0 && (
            <div className="ls-product-detail-price">
              <p className="ls-product-detail-price__label">Preço promocional</p>
              <p className="ls-product-detail-price__value ls-product-detail-price__value--sale">{fmtBrl(product.promo_price)}</p>
              <p className="ls-product-detail-price__sub">quando aplicável</p>
            </div>
          )}
          <div className="ls-product-detail-price">
            <p className="ls-product-detail-price__label">Margem</p>
            <p className="ls-product-detail-price__value">{marginPct}%</p>
            <p className="ls-product-detail-price__sub">{fmtBrl(product.sale_price - product.cost)} por unidade</p>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {/* Publicação por loja */}
            <section className="ls-product-detail-panel">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="ls-product-detail-panel__title !mb-0">Onde este produto está publicado</h3>
                {publishedCount === 0 && (
                  <Link to={LOGSTOKA_ROUTES.PRODUCT_PUBLICATION} className="text-xs font-bold text-orange-700 hover:underline">
                    Ir para Central de Publicação →
                  </Link>
                )}
              </div>
              <div className="space-y-5">
                {(Object.entries(storesByMp) as [Marketplace, typeof storesByMp[string]][]).map(([mp, stores]) => (
                  <div key={mp} className="ls-product-detail-pub-mp">
                    <div className="ls-product-detail-pub-mp__head">
                      <MarketplaceLogo marketplace={mp} size={22} />
                      {MARKETPLACE_LABELS[mp]}
                      <span className="font-semibold normal-case tracking-normal text-[#a3a3a3]">
                        · {stores.filter((s) => companyId && product && isPublishedOnStore(companyId, product.id, s.id)).length}/{stores.length} lojas
                      </span>
                    </div>
                    <div className="ls-product-detail-pub-grid">
                      {stores.map((store) => {
                        const live = companyId ? isPublishedOnStore(companyId, product.id, store.id) : false;
                        const pub = companyId
                          ? getProductStorePublications(companyId, product.id).find((p) => p.storeId === store.id)
                          : undefined;
                        return (
                          <div
                            key={store.id}
                            className={`ls-product-detail-pub-card${live ? ' ls-product-detail-pub-card--live' : ''}`}
                          >
                            <div className="ls-product-detail-pub-card__store">
                              <img src={store.logoUrl} alt="" className="ls-product-detail-pub-card__avatar" />
                              <div className="min-w-0">
                                <p className="ls-product-detail-pub-card__name">{store.name}</p>
                                {pub?.listingId && (
                                  <p className="text-[10px] font-semibold text-[#a3a3a3]">Anúncio {pub.listingId}</p>
                                )}
                              </div>
                            </div>
                            <span
                              className={`ls-product-detail-pub-card__status ${
                                live ? 'ls-product-detail-pub-card__status--live' : 'ls-product-detail-pub-card__status--off'
                              }`}
                            >
                              {live ? 'Publicado ✓' : 'Não publicado'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Linha do tempo */}
            <section className="ls-product-detail-panel">
              <h3 className="ls-product-detail-panel__title">Movimentações recentes</h3>
              <div className="space-y-3">
                {timeline.length === 0 && (
                  <p className="text-sm font-medium text-[#a3a3a3]">Sem movimentações registradas.</p>
                )}
                {timeline.map((m) => (
                  <div key={m.id} className="ls-product-detail-timeline-item">
                    <div>
                      <p className="ls-product-detail-timeline-item__type">
                        {movementTypeLabel(m.movement_type)} · {m.sub_type}
                      </p>
                      <p className="ls-product-detail-timeline-item__meta">
                        {marketplaceLabel(m.marketplace)}
                        {m.reference_code ? ` · Ref ${m.reference_code}` : ''}
                        {' · '}
                        {new Date(m.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <p className={`ls-product-detail-timeline-item__qty ${movementQtyClass(m.movement_type)}`}>
                      {movementSign(m.movement_type)}
                      {fmtQty(m.total_quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Coluna lateral */}
          <div className="space-y-6">
            {/* Estoque por armazém */}
            {isDemo && stockStats.rows.length > 0 && (
              <section className="ls-product-detail-panel">
                <h3 className="ls-product-detail-panel__title">Estoque por armazém</h3>
                {stockStats.rows.map((row) => (
                  <div key={row.id} className="ls-product-detail-wh-row">
                    <div>
                      <p className="ls-product-detail-wh-row__name">{row.ls_warehouses?.name ?? 'Armazém'}</p>
                      {row.reserved_quantity > 0 && (
                        <p className="text-[11px] font-semibold text-[#a3a3a3]">
                          {fmtQty(row.reserved_quantity)} reservadas
                        </p>
                      )}
                    </div>
                    <p className="ls-product-detail-wh-row__qty">{fmtQty(row.quantity)}</p>
                  </div>
                ))}
              </section>
            )}

            {/* Resumo movimentação */}
            <section className="ls-product-detail-panel">
              <h3 className="ls-product-detail-panel__title">Resumo de movimentação</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <ArrowDownLeft size={16} /> Entradas
                  </span>
                  <span className="text-lg font-black text-emerald-700">{fmtQty(movementStats.entries)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-red-800">
                    <ArrowUpRight size={16} /> Saídas
                  </span>
                  <span className="text-lg font-black text-red-700">{fmtQty(movementStats.exits)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-orange-800">
                    <RotateCcw size={16} /> Devoluções
                  </span>
                  <span className="text-lg font-black text-orange-700">{fmtQty(movementStats.returns)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Package size={16} /> Transferências
                  </span>
                  <span className="text-lg font-black text-slate-800">{fmtQty(movementStats.transfers)}</span>
                </div>
              </div>
            </section>

            {/* Dados do produto */}
            <section className="ls-product-detail-panel">
              <h3 className="ls-product-detail-panel__title">Dados fiscais e logística</h3>
              <dl>
                <div className="ls-product-detail-spec-row">
                  <dt>EAN / GTIN</dt>
                  <dd>{product.barcode || '—'}</dd>
                </div>
                <div className="ls-product-detail-spec-row">
                  <dt>NCM</dt>
                  <dd>{product.ncm || '—'}</dd>
                </div>
                <div className="ls-product-detail-spec-row">
                  <dt>Peso</dt>
                  <dd>{product.weight_kg ? `${product.weight_kg} kg` : '—'}</dd>
                </div>
                <div className="ls-product-detail-spec-row">
                  <dt>Dimensões</dt>
                  <dd>
                    {product.height_cm && product.width_cm && product.length_cm
                      ? `${product.length_cm} × ${product.width_cm} × ${product.height_cm} cm`
                      : '—'}
                  </dd>
                </div>
                <div className="ls-product-detail-spec-row">
                  <dt>Unidade</dt>
                  <dd>{product.unit}</dd>
                </div>
                <div className="ls-product-detail-spec-row">
                  <dt>Código interno</dt>
                  <dd>{product.internal_code || '—'}</dd>
                </div>
              </dl>
            </section>

            {product.description && (
              <section className="ls-product-detail-panel">
                <h3 className="ls-product-detail-panel__title">Descrição</h3>
                <p className="text-sm font-medium leading-relaxed text-[#525252]">{product.description}</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </LogstokaDetailPageLayout>
  );
};

export default ProductDetailPage;
