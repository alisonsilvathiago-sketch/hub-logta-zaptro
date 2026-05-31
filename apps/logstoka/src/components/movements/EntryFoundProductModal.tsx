import React, { useEffect, useState } from 'react';
import { Eye, Package, Pencil, Plus } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ProductThumb from '@/components/products/ProductThumb';
import type { DemoMovementRow } from '@/lib/logstokaDemoSeed';
import type { ProductLookupResult } from '@/lib/productLookup';

type Props = {
  open: boolean;
  product: ProductLookupResult | null;
  stockQty: number | null;
  duplicateEntry?: DemoMovementRow | null;
  initialQuantity?: number;
  saving?: boolean;
  onClose: () => void;
  onSave: (quantity: number) => void;
  onEditProduct: () => void;
  onViewProduct: () => void;
};

const EntryFoundProductModal: React.FC<Props> = ({
  open,
  product,
  stockQty,
  duplicateEntry,
  initialQuantity = 1,
  saving = false,
  onClose,
  onSave,
  onEditProduct,
  onViewProduct,
}) => {
  const [quantity, setQuantity] = useState(initialQuantity);

  useEffect(() => {
    if (open) setQuantity(initialQuantity);
  }, [open, initialQuantity, product?.id]);

  if (!product) return null;

  const currentStock = stockQty ?? 0;
  const listQty = duplicateEntry?.total_quantity ?? 0;
  const resultStock = currentStock + quantity;
  const resultList = duplicateEntry ? listQty + quantity : quantity;

  const footer = (
    <>
      <button type="button" className="ls-btn-secondary inline-flex items-center gap-1.5" onClick={onViewProduct}>
        <Eye size={16} />
        Visualizar
      </button>
      <button type="button" className="ls-btn-secondary inline-flex items-center gap-1.5" onClick={onEditProduct}>
        <Pencil size={16} />
        Editar produto
      </button>
      <button type="button" className="ls-btn-secondary" onClick={onClose} disabled={saving}>
        Cancelar
      </button>
      <button
        type="button"
        className="ls-btn-primary inline-flex items-center gap-1.5"
        disabled={saving || quantity < 1}
        onClick={() => onSave(quantity)}
      >
        <Plus size={16} />
        {saving ? 'Salvando…' : duplicateEntry ? 'Somar quantidade' : 'Registrar entrada'}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      size="landscape"
      title="Produto encontrado"
      subtitle="Produto já cadastrado — atualize a quantidade em vez de duplicar"
      icon={<Package size={20} strokeWidth={2.25} />}
      onClose={onClose}
      footer={footer}
    >
      <div className="ls-entry-found-modal">
        {duplicateEntry ? (
          <div className="ls-entry-found-modal__alert">
            Este SKU já está na lista de entradas de hoje ({listQty} un.). A quantidade informada será{' '}
            <strong>somada</strong>.
          </div>
        ) : null}

        <div className="ls-entry-found-modal__grid">
          <aside className="ls-entry-found-modal__aside">
            <ProductThumb src={product.main_image_url} name={product.name} size={120} />
            <dl className="ls-entry-found-modal__facts">
              <div>
                <dt>Código</dt>
                <dd>{product.internal_code ?? product.sku}</dd>
              </div>
              <div>
                <dt>SKU</dt>
                <dd>{product.sku}</dd>
              </div>
              {product.barcode ? (
                <div>
                  <dt>EAN</dt>
                  <dd>{product.barcode}</dd>
                </div>
              ) : null}
              <div>
                <dt>Estoque atual</dt>
                <dd>{stockQty != null ? `${stockQty.toLocaleString('pt-BR')} un.` : '—'}</dd>
              </div>
              <div>
                <dt>Depósito</dt>
                <dd>CD Principal</dd>
              </div>
            </dl>
          </aside>

          <div className="ls-entry-found-modal__form">
            <h3 className="ls-entry-found-modal__name">{product.name}</h3>
            {product.brand ? <p className="ls-entry-found-modal__brand">Marca: {product.brand}</p> : null}

            <label className="mt-4 block">
              <span className="ls-label">Quantidade recebida</span>
              <input
                type="number"
                min={1}
                className="ls-input mt-1 w-full max-w-[200px]"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                autoFocus
              />
            </label>

            <div className="ls-entry-found-modal__result">
              <p>
                Estoque após entrada:{' '}
                <strong>{stockQty != null ? `${resultStock.toLocaleString('pt-BR')} un.` : `+${quantity} un.`}</strong>
              </p>
              {duplicateEntry ? (
                <p>
                  Total na lista hoje: <strong>{resultList.toLocaleString('pt-BR')} un.</strong>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EntryFoundProductModal;
