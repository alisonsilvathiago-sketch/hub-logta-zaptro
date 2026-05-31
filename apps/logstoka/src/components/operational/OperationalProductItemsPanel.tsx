import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import ProductThumb from '@/components/products/ProductThumb';
import { getDemoProductBySku } from '@/lib/logstokaDemoSeed';
import './operationalDetailShared.css';

export type OperationalProductItem = {
  sku: string;
  name: string;
  quantity: number;
};

type Props = {
  items: OperationalProductItem[];
  title?: string;
  showProductLink?: boolean;
};

const fmtQty = (n: number) => n.toLocaleString('pt-BR');

const OperationalProductItemsPanel: React.FC<Props> = ({
  items,
  title = 'Itens da operação',
  showProductLink = true,
}) => {
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section className="ls-op-detail-panel">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h3 className="ls-op-detail-panel__title m-0">{title}</h3>
        <p className="text-sm font-black text-orange-600">
          Total: <span className="text-2xl">{fmtQty(totalQty)}</span> un.
        </p>
      </div>

      {items.map((item) => {
        const product = getDemoProductBySku(item.sku);
        return (
          <div key={item.sku} className="ls-op-detail-item-row">
            {product?.main_image_url ? (
              <img src={product.main_image_url} alt="" className="ls-op-detail-item-row__image" />
            ) : (
              <ProductThumb src={product?.main_image_url} name={item.name} size={56} />
            )}
            <div className="min-w-0">
              <p className="ls-op-detail-item-row__name">{item.name}</p>
              <p className="ls-op-detail-item-row__sku">
                SKU {item.sku}
                {product?.brand ? ` · ${product.brand}` : ''}
                {product?.barcode ? ` · EAN ${product.barcode}` : ''}
              </p>
              {showProductLink && product?.id ? (
                <Link
                  to={`/app/products/${product.id}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:underline"
                >
                  <ExternalLink size={12} />
                  Ver produto
                </Link>
              ) : null}
            </div>
            <div className="ls-op-detail-item-row__qty-wrap">
              <p className="ls-op-detail-item-row__qty-label">Quantidade</p>
              <p className="ls-op-detail-item-row__qty">{fmtQty(item.quantity)}</p>
              <p className="text-[10px] font-bold uppercase text-[#949494]">unidades</p>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default OperationalProductItemsPanel;
