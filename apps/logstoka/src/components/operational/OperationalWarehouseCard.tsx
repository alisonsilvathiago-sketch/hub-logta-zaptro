import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, UserRound } from 'lucide-react';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { warehouseLocationLabel } from '@/lib/warehouseUtils';
import { MARKETPLACE_LABELS, type LsWarehouse } from '@/types';
import './operationalDetailShared.css';

type Props = {
  warehouse: LsWarehouse | null;
  fallbackName?: string;
  role: 'Origem' | 'Destino' | 'Depósito';
  variant?: 'origin' | 'destination';
};

const OperationalWarehouseCard: React.FC<Props> = ({
  warehouse,
  fallbackName,
  role,
  variant = role === 'Destino' ? 'destination' : 'origin',
}) => {
  const name = warehouse?.name ?? fallbackName ?? '—';
  const isFull = warehouse?.type === 'full_marketplace';
  const hasAddress = Boolean(warehouse?.address_line || warehouse?.city);

  return (
    <article className={`ls-op-detail-wh-card${variant === 'destination' ? ' ls-op-detail-wh-card--dest' : ''}`}>
      <div className="ls-op-detail-wh-card__head">
        <div className="min-w-0">
          <p className="ls-op-detail-wh-card__role">{role}</p>
          <h3 className="ls-op-detail-wh-card__name">{name}</h3>
          {warehouse?.code ? (
            <p className="mt-1 text-xs font-semibold text-[#737373]">{warehouse.code}</p>
          ) : null}
        </div>
        {isFull && warehouse?.marketplace ? (
          <div className="ls-op-detail-wh-card__logo">
            <MarketplaceLogo marketplace={warehouse.marketplace} size={40} showLabel />
          </div>
        ) : null}
      </div>

      <div className="ls-op-detail-wh-card__address">
        <p className="ls-op-detail-wh-card__address-label">
          <MapPin size={13} aria-hidden />
          {isFull ? 'Canal fulfillment' : 'Endereço do CD'}
        </p>
        {hasAddress ? (
          <>
            <p className="ls-op-detail-wh-card__address-line">
              {warehouse?.address_line ?? warehouseLocationLabel(warehouse!)}
            </p>
            {warehouse?.address_line ? (
              <p className="ls-op-detail-wh-card__address-sub">{warehouseLocationLabel(warehouse)}</p>
            ) : null}
          </>
        ) : isFull && warehouse?.marketplace ? (
          <p className="ls-op-detail-wh-card__address-line">
            {MARKETPLACE_LABELS[warehouse.marketplace]} · estoque no fulfillment
          </p>
        ) : (
          <p className="ls-op-detail-wh-card__address-sub">Endereço não cadastrado</p>
        )}
      </div>

      {warehouse?.manager_name ? (
        <div className="ls-op-detail-wh-card__manager">
          <p className="ls-op-detail-wh-card__address-label">
            <UserRound size={13} aria-hidden />
            Responsável
          </p>
          <p className="ls-op-detail-wh-card__manager-name">{warehouse.manager_name}</p>
          <p className="ls-op-detail-wh-card__manager-role">
            {warehouse.manager_role ?? 'Responsável pelo CD'}
          </p>
          {warehouse.manager_phone ? (
            <p className="ls-op-detail-wh-card__contact-row">
              <Phone size={14} aria-hidden />
              <a href={`tel:${warehouse.manager_phone.replace(/\D/g, '')}`}>{warehouse.manager_phone}</a>
            </p>
          ) : null}
          {warehouse.manager_email ? (
            <p className="ls-op-detail-wh-card__contact-row">
              <Mail size={14} aria-hidden />
              <a href={`mailto:${warehouse.manager_email}`}>{warehouse.manager_email}</a>
            </p>
          ) : null}
        </div>
      ) : isFull ? (
        <p className="text-xs font-semibold text-[#737373]">
          Operação via canal {warehouse?.marketplace ? MARKETPLACE_LABELS[warehouse.marketplace] : 'marketplace'}.
          Dúvidas: contate o responsável no CD de origem.
        </p>
      ) : (
        <p className="text-xs font-semibold text-[#737373]">Responsável não cadastrado neste CD.</p>
      )}

      {warehouse?.id ? (
        <Link to={LOGSTOKA_ROUTES.warehouseDetail(warehouse.id)} className="ls-op-detail-wh-card__link">
          Ver perfil do CD →
        </Link>
      ) : null}
    </article>
  );
};

export default OperationalWarehouseCard;
