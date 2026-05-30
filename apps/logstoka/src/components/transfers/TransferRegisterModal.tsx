import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import MovementScanSection from '@/components/movements/MovementScanSection';
import Modal from '@/components/ui/Modal';
import type { IntelligentScanResult } from '@/lib/intelligentScanClient';
import type { ProductLookupResult, ProductScanMode } from '@/lib/productLookup';
import type { LsWarehouse } from '@/types';

export type TransferFormState = {
  origin: string;
  destination: string;
  sku: string;
  quantity: number;
  notes: string;
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
  form: TransferFormState;
  warehouses: LsWarehouse[];
  scan: ScanProps;
  onClose: () => void;
  onChange: (patch: Partial<TransferFormState>) => void;
  onSubmit: () => void;
};

const TransferRegisterModal: React.FC<Props> = ({
  open,
  saving = false,
  form,
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
        {saving ? 'Salvando…' : 'Criar transferência'}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      size="landscape"
      title="Transferência entre CDs"
      subtitle="Escaneie os itens e defina origem e destino"
      icon={<ArrowLeftRight size={20} strokeWidth={2.25} />}
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
            movementLabel="Transferência"
            onRegister={scan.onRegister}
            onUseExisting={scan.onUseExisting}
            registering={scan.registering}
          />
        </div>

        <div className="ls-operation-modal__form">
          <p className="ls-operation-modal__form-title">Rota e observações</p>
          <div className="ls-operation-modal__fields">
            <div>
              <label className="ls-label">Origem</label>
              <select className="ls-input" value={form.origin} onChange={(e) => onChange({ origin: e.target.value })}>
                <option value="">—</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ls-label">Destino</label>
              <select className="ls-input" value={form.destination} onChange={(e) => onChange({ destination: e.target.value })}>
                <option value="">—</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ls-label">SKU</label>
              <input className="ls-input" value={form.sku} onChange={(e) => onChange({ sku: e.target.value })} />
            </div>
            <div>
              <label className="ls-label">Observação</label>
              <input className="ls-input" value={form.notes} onChange={(e) => onChange({ notes: e.target.value })} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TransferRegisterModal;
