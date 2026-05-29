import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type ProductsKpiItem = {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  icon: LucideIcon;
};

type Props = {
  items: ProductsKpiItem[];
};

const ProductsKpiStrip: React.FC<Props> = ({ items }) => (
  <div className="ls-products-kpi">
    {items.map(({ label, value, hint, accent, icon: Icon }) => (
      <div key={label} className="ls-products-kpi__card">
        <div className="ls-products-kpi__card-top">
          <p className="ls-products-kpi__label">{label}</p>
          <span className="ls-products-kpi__icon" aria-hidden>
            <Icon size={18} strokeWidth={2.25} />
          </span>
        </div>
        <p className={`ls-products-kpi__value${accent ? ' ls-products-kpi__value--accent' : ''}`}>{value}</p>
        {hint ? <p className="ls-products-kpi__hint">{hint}</p> : null}
      </div>
    ))}
  </div>
);

export default ProductsKpiStrip;
