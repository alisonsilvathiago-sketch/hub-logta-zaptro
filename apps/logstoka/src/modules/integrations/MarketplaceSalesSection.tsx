import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import type { MarketplaceSaleOrderWithSource } from '@/lib/marketplaceHub';
import './marketplaceHub.css';

type Props = {
  orders: MarketplaceSaleOrderWithSource[];
  onBaixa: (order: MarketplaceSaleOrderWithSource) => void;
  title?: string;
  description?: string;
  id?: string;
  className?: string;
  showMarketplaceBadge?: boolean;
  layout?: 'grid' | 'carousel' | 'responsive';
  carouselVisibleCount?: number;
};

function SaleCard({
  order,
  onBaixa,
  showMarketplaceBadge,
  compact = false,
  carousel = false,
}: {
  order: MarketplaceSaleOrderWithSource;
  onBaixa: (order: MarketplaceSaleOrderWithSource) => void;
  showMarketplaceBadge: boolean;
  compact?: boolean;
  carousel?: boolean;
}) {
  return (
    <div
      className={`ls-hub-sale-card${order.status === 'pending_baixa' ? ' ls-hub-sale-card--pending' : ''}${
        carousel ? ' ls-hub-sale-card--carousel' : ''
      }${compact ? ' ls-hub-sale-card--compact' : ''}`}
    >
      <div className="ls-hub-sale-card__body">
        {showMarketplaceBadge ? (
          <Link
            to={order.hubPath}
            className="mb-2 inline-flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50/80 px-2.5 py-1 text-[10px] font-bold text-gray-600 transition-colors hover:border-orange-100 hover:text-orange-700"
          >
            <MarketplaceLogo marketplace={order.marketplace} size={16} />
            {order.marketplaceLabel}
          </Link>
        ) : null}
        <p className="ls-hub-sale-card__ref">
          {order.status === 'pending_baixa' ? (
            <span className="ls-hub-sale-card__notify" aria-hidden>
              <Bell size={16} strokeWidth={2.2} />
            </span>
          ) : null}
          {order.orderRef}
        </p>
        <p className="ls-hub-sale-card__detail">
          {order.productName} · {order.quantity} un · {order.sku}
        </p>
        <p className="ls-hub-sale-card__meta">{order.soldAt}</p>
      </div>
      <div className="ls-hub-sale-card__actions">
        {order.status === 'baixa_done' ? (
          <span className="ls-badge bg-orange-50 text-orange-700">
            <CheckCircle2 size={14} className="mr-1 inline" />
            Baixa registrada
          </span>
        ) : (
          <>
            <span className="ls-badge bg-orange-50 text-orange-700">Aguardando baixa</span>
            <button type="button" className="ls-btn-primary w-full" onClick={() => onBaixa(order)}>
              <Download size={16} />
              Baixar documento
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function useIsMobile(breakpoint = 767): boolean {
  const query = `(max-width: ${breakpoint}px)`;
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);

  return isMobile;
}

function useCarouselVisibleCount(defaultCount: number): number {
  const [count, setCount] = useState(defaultCount);

  useEffect(() => {
    const update = () => {
      if (window.matchMedia('(min-width: 1280px)').matches) {
        setCount(defaultCount);
      } else if (window.matchMedia('(min-width: 768px)').matches) {
        setCount(Math.min(2, defaultCount));
      } else {
        setCount(1);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [defaultCount]);

  return count;
}

const MarketplaceSalesSection: React.FC<Props> = ({
  orders,
  onBaixa,
  title = 'Vendas · Baixa de estoque',
  description = 'Pedidos pagos nos marketplaces conectados. Vendas pendentes aparecem em destaque.',
  id,
  className = '',
  showMarketplaceBadge = true,
  layout = 'responsive',
  carouselVisibleCount = 4,
}) => {
  const isMobile = useIsMobile();
  const effectiveLayout =
    layout === 'responsive' ? (isMobile ? 'mobile-carousel' : 'grid') : layout;
  const responsiveVisibleCount = useCarouselVisibleCount(carouselVisibleCount);
  const visibleCount = effectiveLayout === 'carousel' ? responsiveVisibleCount : carouselVisibleCount;
  const pendingCount = orders.filter((o) => o.status === 'pending_baixa').length;
  const firstPending = orders.findIndex((o) => o.status === 'pending_baixa');
  const [index, setIndex] = useState(firstPending >= 0 ? firstPending : 0);

  useEffect(() => {
    const next = orders.findIndex((o) => o.status === 'pending_baixa');
    setIndex(next >= 0 ? next : 0);
  }, [orders.length]);

  useEffect(() => {
    const max = Math.max(0, orders.length - visibleCount);
    setIndex((i) => Math.min(i, max));
  }, [orders.length, visibleCount]);

  const maxIndex = Math.max(0, orders.length - visibleCount);
  const prev = () => setIndex((i) => (i <= 0 ? maxIndex : i - 1));
  const next = () => setIndex((i) => (i >= maxIndex ? 0 : i + 1));
  const visibleOrders = orders.slice(index, index + visibleCount);
  const hasMany = orders.length > visibleCount;
  const rangeStart = orders.length ? index + 1 : 0;
  const rangeEnd = Math.min(index + visibleCount, orders.length);

  return (
    <div id={id} className={`ls-marketplace-sales-wrap ls-hub-vendas ${className}`.trim()}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="ls-hub-section-title">{title}</h3>
          <p className="ls-hub-section-desc !mb-0 !pb-0">{description}</p>
        </div>
        {pendingCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-700">
            <Bell size={14} strokeWidth={2.2} />
            {pendingCount} aguardando baixa
          </span>
        ) : null}
      </div>

      {effectiveLayout === 'carousel' && visibleOrders.length > 0 ? (
        <div className="ls-dashboard-sales-carousel">
          {hasMany ? (
            <button type="button" className="ls-dashboard-sales-carousel__nav" onClick={prev} aria-label="Vendas anteriores">
              <ChevronLeft size={18} strokeWidth={2.2} />
            </button>
          ) : null}

          <div className="ls-dashboard-sales-carousel__viewport">
            <div
              className="ls-dashboard-sales-carousel__track"
              style={{ '--ls-sales-visible': visibleCount } as React.CSSProperties}
            >
              {visibleOrders.map((item) => (
                <SaleCard
                  key={item.id}
                  order={item}
                  onBaixa={onBaixa}
                  showMarketplaceBadge={showMarketplaceBadge}
                  compact
                />
              ))}
            </div>
            {hasMany ? (
              <span className="ls-dashboard-sales-carousel__count">
                {rangeStart}–{rangeEnd} de {orders.length}
              </span>
            ) : null}
          </div>

          {hasMany ? (
            <button type="button" className="ls-dashboard-sales-carousel__nav" onClick={next} aria-label="Próximas vendas">
              <ChevronRight size={18} strokeWidth={2.2} />
            </button>
          ) : null}
        </div>
      ) : effectiveLayout === 'mobile-carousel' ? (
        <div className="ls-hub-sales-mobile-carousel" aria-roledescription="carrossel">
          <div className="ls-hub-sales-mobile-carousel__track">
            {orders.map((item) => (
              <SaleCard
                key={item.id}
                order={item}
                onBaixa={onBaixa}
                showMarketplaceBadge={showMarketplaceBadge}
                carousel
              />
            ))}
          </div>
          {orders.length > 1 ? (
            <p className="ls-hub-sales-mobile-carousel__hint">
              Deslize para ver {orders.length} vendas
            </p>
          ) : null}
        </div>
      ) : (
        <div className="ls-hub-sales-grid">
          {orders.map((item) => (
            <SaleCard key={item.id} order={item} onBaixa={onBaixa} showMarketplaceBadge={showMarketplaceBadge} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketplaceSalesSection;
