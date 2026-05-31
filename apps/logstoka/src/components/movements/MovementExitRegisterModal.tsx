import React, { useEffect, useMemo } from 'react';
import { ArrowUpFromLine, MapPin, Minus, Package, Plus, ShieldCheck } from 'lucide-react';
import MovementScanSection from '@/components/movements/MovementScanSection';
import MovementExitAuthorizationTerm from '@/components/movements/MovementExitAuthorizationTerm';
import ProductThumb from '@/components/products/ProductThumb';
import Modal from '@/components/ui/Modal';
import SignaturePad from '@/components/ui/SignaturePad';
import DriverLookupField from '@/components/drivers/DriverLookupField';
import { getProductStockAtWarehouse } from '@/lib/productStockByCd';
import { formatInternalSku } from '@/lib/formatInternalSku';
import type { IntelligentScanResult } from '@/lib/intelligentScanClient';
import type { ProductLookupResult, ProductScanMode } from '@/lib/productLookup';
import type { LsWarehouse } from '@/types';
import '@/components/transfers/transferRegisterModal.css';

export type ExitFormState = {
  warehouseId: string;
  productId: string;
  sku: string;
  productName: string;
  internalCode: string;
  quantity: number;
  referenceCode: string;
  releasedByName: string;
  driverId: string;
  driverName: string;
  driverCpf: string;
  companyName: string;
  companyCnpj: string;
  driverPlate: string;
  signatureDataUrl: string;
  signatureSignedAt: string;
  confirmed: boolean;
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
  companyId: string | null;
  form: ExitFormState;
  warehouses: LsWarehouse[];
  defaultOperatorName?: string;
  scan: ScanProps;
  onClose: () => void;
  onChange: (patch: Partial<ExitFormState>) => void;
  onSubmit: () => void;
};

const MovementExitRegisterModal: React.FC<Props> = ({
  open,
  saving = false,
  companyId,
  form,
  warehouses,
  defaultOperatorName = '',
  scan,
  onClose,
  onChange,
  onSubmit,
}) => {
  const warehouse = warehouses.find((w) => w.id === form.warehouseId);
  const product = scan.resolvedProduct;

  useEffect(() => {
    if (!open || !warehouse?.manager_name || form.releasedByName.trim()) return;
    onChange({ releasedByName: warehouse.manager_name });
  }, [open, warehouse?.manager_name, warehouse?.id, form.releasedByName, onChange]);

  useEffect(() => {
    if (!open || form.releasedByName.trim() || !defaultOperatorName.trim()) return;
    onChange({ releasedByName: defaultOperatorName });
  }, [open, defaultOperatorName, form.releasedByName, onChange]);

  const stockAtWarehouse = useMemo(() => {
    if (!product || !form.warehouseId || !scan.companyId) return 0;
    return getProductStockAtWarehouse(product.id, form.warehouseId, scan.companyId);
  }, [product, form.warehouseId, scan.companyId]);

  const displayCode =
    product?.internal_code ||
    (product ? formatInternalSku(Number.parseInt(product.id.replace(/\D/g, ''), 10) || 1) : '') ||
    form.internalCode;

  const setQuantity = (qty: number) => {
    const next = Math.max(1, qty);
    scan.onQuantityChange(next);
    onChange({ quantity: next });
  };

  const handleSignatureChange = (dataUrl: string) => {
    onChange({
      signatureDataUrl: dataUrl,
      signatureSignedAt: dataUrl ? new Date().toISOString() : '',
    });
  };

  const footer = (
    <>
      <button type="button" className="ls-btn-secondary" onClick={onClose} disabled={saving}>
        Cancelar
      </button>
      <button type="button" className="ls-btn-primary" disabled={saving} onClick={onSubmit}>
        {saving ? 'Registrando…' : 'Aprovar e registrar saída'}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      size="wide"
      paddingVariant="balanced"
      panelClassName="ls-transfer-modal-panel"
      title="Saída manual do dia"
      subtitle="Busque o produto pelo código LS ou EAN — motorista e assinatura obrigatórios"
      icon={<ArrowUpFromLine size={20} strokeWidth={2.25} />}
      onClose={onClose}
      footer={footer}
    >
      <div className="ls-transfer-modal">
        <div className="ls-transfer-modal__route ls-transfer-modal__route--single">
          <div className="ls-transfer-modal__route-field">
            <label className="ls-label">Depósito de saída</label>
            <select
              className="ls-input"
              value={form.warehouseId}
              onChange={(e) => onChange({ warehouseId: e.target.value })}
            >
              <option value="">Selecione o CD</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.city ? ` · ${w.city}` : ''}
                </option>
              ))}
            </select>
          </div>
          {warehouse ? (
            <p className="ls-transfer-modal__route-hint">
              <MapPin size={13} aria-hidden />
              Expedição em {warehouse.name}
            </p>
          ) : null}
        </div>

        <div className="ls-transfer-modal__main">
          <div className="ls-transfer-modal__scan-wrap">
            <MovementScanSection
              embedded
              compact
              scanOnly
              preferInternalCode
              companyId={scan.companyId}
              demo={scan.demo}
              scanMode={scan.scanMode}
              onScanModeChange={scan.onScanModeChange}
              scanValue={scan.scanValue}
              onScanValueChange={scan.onScanValueChange}
              onClearScan={scan.onClearScan}
              quantity={scan.quantity}
              onQuantityChange={setQuantity}
              resolvedProduct={scan.resolvedProduct}
              resolving={scan.resolving}
              interpreting={scan.interpreting}
              scanInterpretation={scan.scanInterpretation}
              movementLabel="Saída"
              onRegister={scan.onRegister}
              onUseExisting={scan.onUseExisting}
              registering={scan.registering}
              inputId="ls-exit-scan-input"
            />
          </div>

          <aside className="ls-transfer-modal__aside">
            <p className="ls-transfer-modal__aside-title">
              <Package size={14} aria-hidden />
              Produto
            </p>
            {product ? (
              <div className="ls-transfer-modal__product">
                <ProductThumb src={product.main_image_url} name={product.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="ls-transfer-modal__product-name">{product.name}</p>
                  <p className="ls-transfer-modal__product-code">
                    LS <strong>{displayCode}</strong>
                    {product.sku && product.sku !== displayCode ? (
                      <span className="ls-transfer-modal__product-sku"> · {product.sku}</span>
                    ) : null}
                  </p>
                  {form.warehouseId ? (
                    <p className="ls-transfer-modal__product-stock">
                      Saldo no CD: <strong>{stockAtWarehouse.toLocaleString('pt-BR')}</strong>
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="ls-transfer-modal__aside-empty">Escaneie ou digite o código LS</p>
            )}

            <div className="ls-transfer-modal__qty">
              <label className="ls-label">Quantidade</label>
              <div className="ls-transfer-modal__qty-row">
                <button type="button" className="ls-transfer-modal__qty-btn" onClick={() => setQuantity(form.quantity - 1)} aria-label="Diminuir">
                  <Minus size={15} />
                </button>
                <input
                  className="ls-input ls-transfer-modal__qty-input"
                  type="number"
                  min={1}
                  value={form.quantity || scan.quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                />
                <button type="button" className="ls-transfer-modal__qty-btn" onClick={() => setQuantity(form.quantity + 1)} aria-label="Aumentar">
                  <Plus size={15} />
                </button>
              </div>
            </div>

            <div>
              <label className="ls-label">Referência (opcional)</label>
              <input
                className="ls-input"
                placeholder="Ex.: Pedido ML, NF-e…"
                value={form.referenceCode}
                onChange={(e) => onChange({ referenceCode: e.target.value })}
              />
            </div>
          </aside>
        </div>

        <section className="ls-transfer-modal__approval">
          <p className="ls-transfer-modal__approval-title">
            <ShieldCheck size={15} aria-hidden />
            Confirmação de segurança
          </p>

          <MovementExitAuthorizationTerm
            warehouse={warehouse}
            product={product}
            productCode={displayCode}
            quantity={form.quantity || scan.quantity}
            releasedByName={form.releasedByName}
            driverName={form.driverName}
            driverCpf={form.driverCpf}
            companyName={form.companyName}
            companyCnpj={form.companyCnpj}
            driverPlate={form.driverPlate}
            signatureDataUrl={form.signatureDataUrl}
            signedAt={form.signatureSignedAt || null}
          />

          <div className="ls-transfer-modal__approval-grid">
            <div className="ls-transfer-modal__approval-field">
              <label className="ls-label">Responsável</label>
              <input
                className="ls-input"
                placeholder="Quem libera a saída"
                value={form.releasedByName}
                onChange={(e) => onChange({ releasedByName: e.target.value })}
              />
            </div>
            <div className="ls-transfer-modal__approval-field ls-transfer-modal__approval-field--span2">
              <label className="ls-label">Motorista</label>
              <DriverLookupField
                companyId={companyId}
                value={{
                  driverId: form.driverId,
                  driverName: form.driverName,
                  driverCpf: form.driverCpf,
                  companyName: form.companyName,
                  companyCnpj: form.companyCnpj,
                }}
                onChange={(patch) => onChange(patch)}
                placeholder="Nome, CPF, CNPJ ou empresa"
              />
            </div>
            <div className="ls-transfer-modal__approval-field">
              <label className="ls-label">CPF</label>
              <input
                className="ls-input"
                placeholder="000.000.000-00"
                value={form.driverCpf}
                onChange={(e) => onChange({ driverCpf: e.target.value })}
              />
            </div>
            <div className="ls-transfer-modal__approval-field">
              <label className="ls-label">Empresa</label>
              <input
                className="ls-input"
                placeholder="Transportadora"
                value={form.companyName}
                onChange={(e) => onChange({ companyName: e.target.value })}
              />
            </div>
            <div className="ls-transfer-modal__approval-field">
              <label className="ls-label">CNPJ</label>
              <input
                className="ls-input"
                placeholder="00.000.000/0000-00"
                value={form.companyCnpj}
                onChange={(e) => onChange({ companyCnpj: e.target.value })}
              />
            </div>
            <div className="ls-transfer-modal__approval-field">
              <label className="ls-label">Placa (opcional)</label>
              <input
                className="ls-input"
                placeholder="Ex.: ABC1D23"
                value={form.driverPlate}
                onChange={(e) => onChange({ driverPlate: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="ls-transfer-modal__approval-sign">
            <SignaturePad
              compact
              fullWidth
              label="Assinatura do responsável"
              value={form.signatureDataUrl}
              onChange={handleSignatureChange}
            />
          </div>

          <label className="ls-transfer-modal__confirm">
            <input
              type="checkbox"
              checked={form.confirmed}
              onChange={(e) => onChange({ confirmed: e.target.checked })}
            />
            <span>
              Li o termo acima, conferi itens e quantidades e autorizo a saída de{' '}
              <strong>{warehouse?.name ?? 'expedição'}</strong> com entrega por{' '}
              <strong>{form.driverName.trim() || 'motorista identificado'}</strong>.
            </span>
          </label>
        </section>
      </div>
    </Modal>
  );
};

export default MovementExitRegisterModal;
