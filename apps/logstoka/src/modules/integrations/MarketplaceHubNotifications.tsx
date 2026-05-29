import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, XCircle } from 'lucide-react';
import type { MarketplaceListing, MarketplaceSaleOrder, MarketplaceSyncIssue } from '@/lib/marketplaceHub';
import { HubHeroIconButton } from './HubHeroIconAction';
import './marketplaceHub.css';

export type HubNotificationItem = {
  id: string;
  kind: 'sale' | 'warning' | 'error';
  title: string;
  detail: string;
  meta?: string;
  target: string;
};

type Props = {
  saleOrders: MarketplaceSaleOrder[];
  syncIssues: MarketplaceSyncIssue[];
  listings: MarketplaceListing[];
};

export function buildHubNotifications({
  saleOrders,
  syncIssues,
  listings,
}: Props): HubNotificationItem[] {
  const items: HubNotificationItem[] = [];

  saleOrders
    .filter((o) => o.status === 'pending_baixa')
    .forEach((order) => {
      items.push({
        id: `sale-${order.id}`,
        kind: 'sale',
        title: `Venda · ${order.orderRef}`,
        detail: `${order.productName} · ${order.quantity} un`,
        meta: order.soldAt,
        target: '#hub-vendas',
      });
    });

  syncIssues
    .filter((i) => i.severity === 'error')
    .forEach((issue) => {
      const listing = issue.sku ? listings.find((l) => l.sku === issue.sku) : undefined;
      items.push({
        id: issue.id,
        kind: 'error',
        title: issue.title,
        detail: issue.detail,
        meta: issue.sku ? `SKU ${issue.sku}` : undefined,
        target: listing ? `/app/products/${listing.productId}` : '#hub-produtos',
      });
    });

  syncIssues
    .filter((i) => i.severity === 'warning')
    .forEach((issue) => {
      const listing = issue.sku ? listings.find((l) => l.sku === issue.sku) : undefined;
      items.push({
        id: issue.id,
        kind: 'warning',
        title: issue.title,
        detail: issue.detail,
        meta: issue.suggestedFix,
        target: listing ? `/app/products/${listing.productId}` : '#hub-produtos',
      });
    });

  return items;
}

const iconForKind = (kind: HubNotificationItem['kind']) => {
  switch (kind) {
    case 'sale':
      return <Bell size={16} strokeWidth={2.2} />;
    case 'warning':
      return <AlertTriangle size={16} strokeWidth={2.2} />;
    default:
      return <XCircle size={16} strokeWidth={2.2} />;
  }
};

const MarketplaceHubNotifications: React.FC<Props> = ({ saleOrders, syncIssues, listings }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(
    () => buildHubNotifications({ saleOrders, syncIssues, listings }),
    [saleOrders, syncIssues, listings],
  );

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open || !wrapRef.current) return;
      if (e.target instanceof Node && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const goTo = (target: string) => {
    setOpen(false);
    if (target.startsWith('#')) {
      const el = document.querySelector(target);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    navigate(target);
  };

  return (
    <div className="ls-hub-notify-wrap" ref={wrapRef}>
      <HubHeroIconButton
        title="Notificações da integração"
        variant="accent"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} strokeWidth={2.2} />
        {items.length > 0 ? (
          <span className="ls-hub-notify-badge" aria-label={`${items.length} notificações`}>
            {items.length}
          </span>
        ) : null}
      </HubHeroIconButton>

      {open ? (
        <div className="ls-hub-notify-popover" role="menu" aria-label="Notificações">
          <div className="ls-hub-notify-popover__head">
            <span className="ls-hub-notify-popover__title">Notificações</span>
            {items.length > 0 ? <span className="ls-hub-notify-popover__count">{items.length}</span> : null}
          </div>

          {items.length === 0 ? (
            <p className="ls-hub-notify-popover__empty">Nenhuma pendência no momento.</p>
          ) : (
            <ul className="ls-hub-notify-popover__list">
              {items.map((item) => (
                <li key={item.id}>
                  <button type="button" className="ls-hub-notify-popover__item" onClick={() => goTo(item.target)}>
                    <span className={`ls-hub-notify-popover__icon ls-hub-notify-popover__icon--${item.kind}`}>
                      {iconForKind(item.kind)}
                    </span>
                    <span className="ls-hub-notify-popover__body">
                      <span className="ls-hub-notify-popover__item-title">{item.title}</span>
                      <span className="ls-hub-notify-popover__item-detail">{item.detail}</span>
                      {item.meta ? <span className="ls-hub-notify-popover__item-meta">{item.meta}</span> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default MarketplaceHubNotifications;
