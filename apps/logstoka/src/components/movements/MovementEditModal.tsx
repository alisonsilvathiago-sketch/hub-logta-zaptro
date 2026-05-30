import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  CalendarDays,
  Hash,
  Pencil,
  Store,
  Tag,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ProductThumb from '@/components/products/ProductThumb';
import {
  getDemoProductBySku,
  marketplaceLabel,
  movementTypeLabel,
  type DemoMovementRow,
} from '@/lib/logstokaDemoSeed';
import { MARKETPLACE_LABELS, type Marketplace } from '@/types';

export type MovementEditPayload = Pick<
  DemoMovementRow,
  'reference_code' | 'total_quantity' | 'warehouse_name' | 'marketplace' | 'sku' | 'product_name' | 'sub_type'
>;

type Props = {
  open: boolean;
  movement: DemoMovementRow | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: MovementEditPayload) => void;
};

const SUB_TYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  entry: [
    { value: 'purchase', label: 'Compra' },
    { value: 'factory', label: 'Fábrica' },
    { value: 'xml', label: 'NF-e / XML' },
  ],
  exit: [{ value: 'sale', label: 'Venda' }],
  transfer: [{ value: 'warehouse', label: 'Entre depósitos' }],
  damage: [
    { value: 'handling', label: 'Manuseio' },
    { value: 'transport', label: 'Transporte' },
    { value: 'other', label: 'Outro' },
  ],
};

const MOVEMENT_ICONS = {
  entry: ArrowDownToLine,
  exit: ArrowUpFromLine,
  transfer: ArrowLeftRight,
  damage: AlertTriangle,
} as const;

const MovementEditModal: React.FC<Props> = ({ open, movement, saving = false, onClose, onSave }) => {
  const [referenceCode, setReferenceCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [warehouseName, setWarehouseName] = useState('');
  const [marketplace, setMarketplace] = useState<string>('');
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [subType, setSubType] = useState('');

  useEffect(() => {
    if (!open || !movement) return;
    setReferenceCode(movement.reference_code ?? '');
    setQuantity(movement.total_quantity);
    setWarehouseName(movement.warehouse_name ?? '');
    setMarketplace(movement.marketplace ?? '');
    setSku(movement.sku ?? '');
    setProductName(movement.product_name ?? '');
    setSubType(movement.sub_type);
  }, [open, movement]);

  const linkedProduct = useMemo(() => getDemoProductBySku(movement?.sku), [movement?.sku]);

  if (!movement) return null;

  const subTypes = SUB_TYPE_OPTIONS[movement.movement_type] ?? [{ value: movement.sub_type, label: movement.sub_type }];
  const MovementIcon = MOVEMENT_ICONS[movement.movement_type as keyof typeof MOVEMENT_ICONS] ?? Pencil;
  const subTypeLabel = subTypes.find((s) => s.value === movement.sub_type)?.label ?? movement.sub_type;
  const productImage = linkedProduct?.main_image_url ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      reference_code: referenceCode.trim() || null,
      total_quantity: Math.max(1, quantity),
      warehouse_name: warehouseName.trim() || undefined,
      marketplace: marketplace ? (marketplace as Marketplace) : null,
      sku: sku.trim() || undefined,
      product_name: productName.trim() || undefined,
      sub_type: subType,
    });
  };

  const footer = (
    <div className="flex flex-wrap justify-end gap-2">
      <button type="button" className="ls-btn-secondary" onClick={onClose} disabled={saving}>
        Cancelar
      </button>
      <button type="submit" form="movement-edit-form" className="ls-btn-primary" disabled={saving}>
        {saving ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      size="landscape"
      title="Editar movimentação"
      subtitle="Revise todos os dados cadastrados — produto, quantidade, depósito e referência"
      icon={<MovementIcon size={20} strokeWidth={2.25} />}
      onClose={onClose}
      footer={footer}
    >
      <div className="ls-premium-edit-modal">
        <aside className="ls-premium-edit-modal__aside">
          <p className="ls-premium-edit-modal__aside-label">Produto cadastrado</p>

          <div className="ls-premium-edit-modal__photo">
            {productImage ? (
              <img src={productImage} alt="" className="ls-premium-edit-modal__photo-img" />
            ) : (
              <ProductThumb src={null} name={productName || sku || 'Produto'} size={120} />
            )}
          </div>

          <div className="ls-premium-edit-modal__meta">
            <span className="ls-badge bg-orange-50 text-orange-700">{movementTypeLabel(movement.movement_type)}</span>
            <span className="ls-badge bg-[#f5f5f5] text-[#565656]">{movement.status}</span>
          </div>

          <dl className="ls-premium-edit-modal__facts">
            <div>
              <dt>SKU</dt>
              <dd>{movement.sku ?? '—'}</dd>
            </div>
            <div>
              <dt>Produto</dt>
              <dd>{movement.product_name ?? '—'}</dd>
            </div>
            <div>
              <dt>Subtipo</dt>
              <dd>{subTypeLabel}</dd>
            </div>
            <div>
              <dt>Depósito</dt>
              <dd>{movement.warehouse_name ?? '—'}</dd>
            </div>
            <div>
              <dt>Canal</dt>
              <dd>{marketplaceLabel(movement.marketplace)}</dd>
            </div>
            <div>
              <dt>Referência</dt>
              <dd>{movement.reference_code ?? '—'}</dd>
            </div>
            <div>
              <dt>Quantidade</dt>
              <dd>{movement.total_quantity.toLocaleString('pt-BR')} un.</dd>
            </div>
            <div>
              <dt>Registrado em</dt>
              <dd>{new Date(movement.created_at).toLocaleString('pt-BR')}</dd>
            </div>
          </dl>
        </aside>

        <div className="ls-premium-edit-modal__form-wrap">
          <p className="ls-premium-edit-modal__form-title">
            <Pencil size={15} aria-hidden />
            Ajustar campos
          </p>

          <form id="movement-edit-form" className="ls-premium-edit-modal__form" onSubmit={handleSubmit}>
            <div className="ls-premium-edit-modal__field ls-premium-edit-modal__field--wide">
              <label className="ls-label">
                <Hash size={12} aria-hidden />
                Produto (SKU)
              </label>
              <input className="ls-input w-full" value={sku} onChange={(e) => setSku(e.target.value)} required />
            </div>

            <div className="ls-premium-edit-modal__field ls-premium-edit-modal__field--wide">
              <label className="ls-label">
                <Tag size={12} aria-hidden />
                Nome do produto
              </label>
              <input className="ls-input w-full" value={productName} onChange={(e) => setProductName(e.target.value)} />
            </div>

            <div className="ls-premium-edit-modal__field">
              <label className="ls-label">Quantidade</label>
              <input
                type="number"
                min={1}
                className="ls-input w-full"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                required
              />
            </div>

            <div className="ls-premium-edit-modal__field">
              <label className="ls-label">Subtipo</label>
              <select className="ls-input w-full" value={subType} onChange={(e) => setSubType(e.target.value)}>
                {subTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ls-premium-edit-modal__field">
              <label className="ls-label">
                <Store size={12} aria-hidden />
                Depósito
              </label>
              <input className="ls-input w-full" value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} />
            </div>

            <div className="ls-premium-edit-modal__field">
              <label className="ls-label">Canal / marketplace</label>
              <select className="ls-input w-full" value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>
                <option value="">— Nenhum —</option>
                {Object.entries(MARKETPLACE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ls-premium-edit-modal__field ls-premium-edit-modal__field--wide">
              <label className="ls-label">
                <CalendarDays size={12} aria-hidden />
                Referência
              </label>
              <input
                className="ls-input w-full"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="NF, pedido ou código interno"
              />
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default MovementEditModal;
