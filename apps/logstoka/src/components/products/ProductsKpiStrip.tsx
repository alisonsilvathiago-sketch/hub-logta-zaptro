import React from 'react';
import type { LucideIcon } from 'lucide-react';
import LogstokaMoneyValue from '@/components/privacy/LogstokaMoneyValue';
import LogstokaMoneyPrivacyToggle from '@/components/privacy/LogstokaMoneyPrivacyToggle';
import { looksLikeMoney } from '@/lib/moneyPrivacy';
import '@/components/privacy/moneyPrivacy.css';

export type ProductsKpiItem = {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  icon: LucideIcon;
  /** Valor monetário — exibe ícone de olho e permite ocultar */
  isMoney?: boolean;
};

type Props = {
  items: ProductsKpiItem[];
  className?: string;
};

const ProductsKpiStrip: React.FC<Props> = ({ items, className }) => (
  <div className={`ls-products-kpi${className ? ` ${className}` : ''}`}>
    {items.map(({ label, value, hint, accent, icon: Icon, isMoney }) => {
      const monetary = isMoney ?? looksLikeMoney(value);
      const valueClass = `ls-products-kpi__value${accent ? ' ls-products-kpi__value--accent' : ''}`;

      return (
        <div key={label} className="ls-products-kpi__card">
          <div className="ls-products-kpi__card-top">
            <p className="ls-products-kpi__label">{label}</p>
            <span className="ls-products-kpi__icon" aria-hidden>
              <Icon size={18} strokeWidth={2.25} />
            </span>
          </div>
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
          {hint ? <p className="ls-products-kpi__hint">{hint}</p> : null}
        </div>
      );
    })}
  </div>
);

export default ProductsKpiStrip;
