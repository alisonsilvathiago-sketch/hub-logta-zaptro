import React from 'react';
import { RotateCcw } from 'lucide-react';
import MovementScanSection from '@/components/movements/MovementScanSection';
import Modal from '@/components/ui/Modal';
import type { IntelligentScanResult } from '@/lib/intelligentScanClient';
import type { ProductLookupResult, ProductScanMode } from '@/lib/productLookup';
import type { LsStore, LsWarehouse } from '@/types';

export type ReturnFormState = {
  order_reference: string;
  reason: string;
  sku: string;
  quantity: number;
  store_id: string;
  warehouse_id: string;
};

type ScanProps = {
  companyId: string | null;
  demo: boolean;
  scanMode: ProductScanMode;
  onScanModeChange: (mode: ProductScanMode) => void;
  scanValue: string;
  onScanValueChange: (value: string) => void;
  onClearScan?: () => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  resolvedProduct: ProductLookupResult | null;
  resolving?: boolean;
  interpreting?: boolean;
  scanInterpretation?: IntelligentScanResult | null;
  onRegister: () => void;
  onUseExisting: (product: ProductLookupResult) => void;
  registering?: boolean;
};

type Props = {
  open: boolean;
  saving?: boolean;
  form: ReturnFormState;
  stores: LsStore[];
  warehouses: LsWarehouse[];
  scan: ScanProps;
  onClose: () => void;
  onChange: (patch: Partial<ReturnFormState>) => void;
  onSubmit: () => void;
};

const ReturnRegisterModal: React.FC<Props> = ({
  open,
  saving = false,
  form,
  stores,
  warehouses,
  scan,
  onClose,
  onChange,
  onSubmit,
}) => {
  const footer = (
    <>
      <button type="button" className="ls-btn-secondary" onClick={onClose} disabled={saving}>
        Cancelar
      </button>
      <button type="button" className="ls-btn-primary" disabled={saving} onClick={onSubmit}>
        {saving ? 'Salvando…' : 'Registrar devolução'}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      size="landscape"
      title="Registrar devolução"
      subtitle="Escaneie o produto e complete os dados da operação"
      icon={<RotateCcw size={20} strokeWidth={2.25} />}
      onClose={onClose}
      footer={footer}
    >
      <div className="ls-operation-modal">
        <div className="ls-operation-modal__scan">
          <MovementScanSection
            embedded
            companyId={scan.companyId}
            demo={scan.demo}
            scanMode={scan.scanMode}
            onScanModeChange={scan.onScanModeChange}
            scanValue={scan.scanValue}
            onScanValueChange={scan.onScanValueChange}
            onClearScan={scan.onClearScan}
            quantity={scan.quantity}
            onQuantityChange={scan.onQuantityChange}
            resolvedProduct={scan.resolvedProduct}
            resolving={scan.resolving}
            interpreting={scan.interpreting}
            scanInterpretation={scan.scanInterpretation}
            movementLabel="Devolução"
            onRegister={scan.onRegister}
            onUseExisting={scan.onUseExisting}
            registering={scan.registering}
          />
        </div>

        <div className="ls-operation-modal__form">
          <p className="ls-operation-modal__form-title">Dados da devolução</p>
          <div className="ls-operation-modal__fields">
            <div>
              <label className="ls-label">Referência pedido</label>
              <input
                className="ls-input"
                value={form.order_reference}
                onChange={(e) => onChange({ order_reference: e.target.value })}
              />
            </div>
            <div>
              <label className="ls-label">Motivo</label>
              <input className="ls-input" value={form.reason} onChange={(e) => onChange({ reason: e.target.value })} />
            </div>
            <div>
              <label className="ls-label">SKU</label>
              <input className="ls-input" value={form.sku} onChange={(e) => onChange({ sku: e.target.value })} />
            </div>
            <div>
              <label className="ls-label">Loja</label>
              <select className="ls-input" value={form.store_id} onChange={(e) => onChange({ store_id: e.target.value })}>
                <option value="">—</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ls-label">Depósito</label>
              <select
                className="ls-input"
                value={form.warehouse_id}
                onChange={(e) => onChange({ warehouse_id: e.target.value })}
              >
                <option value="">—</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReturnRegisterModal;
