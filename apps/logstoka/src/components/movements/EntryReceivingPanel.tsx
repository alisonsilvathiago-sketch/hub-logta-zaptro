import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, CheckCircle2, RotateCcw, ScanLine } from 'lucide-react';
import { toast } from 'react-hot-toast';
import MovementScanSection from '@/components/movements/MovementScanSection';
import MovementQuickProductModal, { type QuickProductPayload } from '@/components/movements/MovementQuickProductModal';
import EntryFoundProductModal from '@/components/movements/EntryFoundProductModal';
import Modal from '@/components/ui/Modal';
import { useIntelligentScanState } from '@/hooks/useIntelligentScanState';
import { findTodayEntryBySku } from '@/lib/demoMovementStore';
import { getProductStockQty, registerEntryMovement, registerExitMovement } from '@/lib/entryMovements';
import type { DemoMovementRow } from '@/lib/logstokaDemoSeed';
import type { ProductLookupResult } from '@/lib/productLookup';

export type EntryReceivingPanelHandle = {
  openScanner: () => void;
};

type Props = {
  companyId: string | null;
  demo: boolean;
  actorName: string;
  entryMovements: DemoMovementRow[];
  onRefresh: () => void;
  variant?: 'entry' | 'exit';
  hidden?: boolean;
};

const EntryReceivingPanel = forwardRef<EntryReceivingPanelHandle, Props>(function EntryReceivingPanel(
  { companyId, demo, actorName, entryMovements, onRefresh, variant = 'entry', hidden = false },
  ref,
) {
  const isExit = variant === 'exit';
  const movementLabel = isExit ? 'Saída' : 'Entrada';
  const navigate = useNavigate();
  const scan = useIntelligentScanState(companyId, demo, isExit ? 'exit' : 'entry');
  const [scanOpen, setScanOpen] = useState(false);
  const [foundProduct, setFoundProduct] = useState<ProductLookupResult | null>(null);
  const [foundOpen, setFoundOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastAutoOpenedSku = useRef<string | null>(null);

  const duplicateEntry = foundProduct ? findTodayEntryBySku(entryMovements, foundProduct.sku) : null;

  const openScanner = useCallback(() => {
    setScanOpen(true);
  }, []);

  useImperativeHandle(ref, () => ({ openScanner }), [openScanner]);

  const openFoundFlow = useCallback((product: ProductLookupResult) => {
    setScanOpen(false);
    setFoundProduct(product);
    setFoundOpen(true);
  }, []);

  useEffect(() => {
    if (!scanOpen) return;
    const product = scan.resolvedProduct;
    const sku = product?.sku;
    if (!product || !scan.scanValue.trim() || scan.resolving || scan.interpreting) return;
    if (!sku || lastAutoOpenedSku.current === sku) return;
    lastAutoOpenedSku.current = sku;
    openFoundFlow(product);
  }, [scanOpen, scan.resolvedProduct, scan.scanValue, scan.resolving, scan.interpreting, openFoundFlow]);

  useEffect(() => {
    if (!scanOpen) return;
    const timer = window.setTimeout(() => {
      document.getElementById('ls-entry-scan-input')?.focus();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [scanOpen]);

  const resetScan = () => {
    scan.clearScan();
    lastAutoOpenedSku.current = null;
    setFoundProduct(null);
    setFoundOpen(false);
  };

  const closeScanner = () => {
    setScanOpen(false);
    lastAutoOpenedSku.current = null;
    scan.clearScan();
  };

  const saveEntry = async (product: ProductLookupResult, quantity: number) => {
    if (!companyId) return;
    setSaving(true);
    try {
      if (isExit) {
        const result = await registerExitMovement({
          companyId,
          demo,
          product,
          quantity,
          existingExits: entryMovements,
          actorName,
          warehouseName: 'CD Principal',
        });
        toast.success(
          result.merged
            ? `Saída somada · ${product.name} · ${result.movement.total_quantity} un.`
            : `Saída registrada · ${product.name} · ${quantity} un.`,
        );
      } else {
        const result = await registerEntryMovement({
          companyId,
          demo,
          product,
          quantity,
          existingEntries: entryMovements,
          actorName,
          warehouseName: 'CD Principal',
        });
        toast.success(
          result.merged
            ? `Quantidade somada · ${product.name} · ${result.movement.total_quantity} un. na lista`
            : `Entrada registrada · ${product.name} · ${quantity} un.`,
        );
      }
      resetScan();
      setScanOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Erro ao registrar ${movementLabel.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUseExisting = (product: ProductLookupResult) => {
    lastAutoOpenedSku.current = product.sku;
    openFoundFlow(product);
  };

  const handleQuickConfirm = async (payload: QuickProductPayload) => {
    if (!companyId) return;
    setSaving(true);
    try {
      toast.success(`[${demo ? 'Demo' : 'OK'}] Produto cadastrado · ${movementLabel.toLowerCase()} de ${scan.quantity} un.`);
      setQuickOpen(false);
      setScanOpen(false);
      resetScan();
      onRefresh();
      void payload;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar');
    } finally {
      setSaving(false);
    }
  };

  const handleScanPrimary = () => {
    if (scan.resolvedProduct) {
      openFoundFlow(scan.resolvedProduct);
      return;
    }
    if (scan.scanValue.trim()) {
      setScanOpen(false);
      setQuickOpen(true);
      return;
    }
    toast.error('Leia ou digite um código antes de continuar');
  };

  const scanFooterHint = scan.resolvedProduct
    ? `${scan.resolvedProduct.name} · ${scan.quantity} un.`
    : scan.scanValue.trim()
      ? scan.scanValue.trim()
      : 'Aguardando leitura';

  const scanFooterStatus = scan.resolvedProduct ? 'found' : scan.scanValue.trim() ? 'code' : 'idle';

  return (
    <>
      <Modal
        open={scanOpen}
        size="wide"
        paddingVariant="balanced"
        panelClassName="ls-entry-scan-modal"
        title={isExit ? 'Scanner de saída' : 'Scanner inteligente'}
        subtitle={
          isExit
            ? 'Leia o código — confirme a saída em tempo real'
            : 'Leia ou digite o código — Enter confirma · produto encontrado abre o popup de entrada'
        }
        icon={
          isExit ? (
            <ArrowUpFromLine size={22} strokeWidth={2.25} />
          ) : (
            <ArrowDownToLine size={22} strokeWidth={2.25} />
          )
        }
        onClose={closeScanner}
        footer={
          <div className="ls-entry-scan-modal__footer">
            <div className="ls-entry-scan-modal__footer-status">
              <span
                className={`ls-entry-scan-modal__footer-badge ls-entry-scan-modal__footer-badge--${scanFooterStatus}`}
                aria-hidden
              >
                {scanFooterStatus === 'found' ? <CheckCircle2 size={14} /> : <ScanLine size={14} />}
              </span>
              <div className="ls-entry-scan-modal__footer-copy">
                <span className="ls-entry-scan-modal__footer-label">
                  {scanFooterStatus === 'found'
                    ? 'Produto encontrado'
                    : scanFooterStatus === 'code'
                      ? 'Código lido'
                      : 'Pronto para escanear'}
                </span>
                <p className="ls-entry-scan-modal__footer-hint">{scanFooterHint}</p>
              </div>
            </div>
            <div className="ls-entry-scan-modal__footer-actions">
              <button
                type="button"
                className="ls-btn-secondary inline-flex items-center gap-1.5 text-sm"
                disabled={!scan.scanValue.trim() && !scan.resolvedProduct}
                onClick={() => {
                  lastAutoOpenedSku.current = null;
                  scan.clearScan();
                }}
              >
                <RotateCcw size={15} aria-hidden />
                Limpar
              </button>
              <button type="button" className="ls-btn-secondary text-sm" onClick={closeScanner}>
                Fechar
              </button>
              <button
                type="button"
                className="ls-btn-primary inline-flex items-center gap-1.5 text-sm"
                disabled={saving || (!scan.resolvedProduct && !scan.scanValue.trim())}
                onClick={handleScanPrimary}
              >
                {scan.resolvedProduct ? (isExit ? 'Registrar saída' : 'Continuar entrada') : 'Cadastrar / continuar'}
                <ArrowRight size={15} aria-hidden />
              </button>
            </div>
          </div>
        }
      >
        <MovementScanSection
          companyId={companyId}
          demo={demo}
          scanMode={scan.scanMode}
          onScanModeChange={scan.setScanMode}
          scanValue={scan.scanValue}
          onScanValueChange={scan.setScanValue}
          onClearScan={() => {
            lastAutoOpenedSku.current = null;
            scan.clearScan();
          }}
          quantity={scan.quantity}
          onQuantityChange={scan.setQuantity}
          resolvedProduct={scan.resolvedProduct}
          resolving={scan.resolving}
          interpreting={scan.interpreting}
          scanInterpretation={scan.scanInterpretation}
          movementLabel={movementLabel}
          suppressPageHeader
          embedded
          onRegister={() => {
            if (scan.resolvedProduct) {
              openFoundFlow(scan.resolvedProduct);
            } else {
              setScanOpen(false);
              setQuickOpen(true);
            }
          }}
          onUseExisting={handleUseExisting}
          registering={saving}
          inputId="ls-entry-scan-input"
        />
      </Modal>

      <EntryFoundProductModal
        open={foundOpen}
        product={foundProduct}
        stockQty={foundProduct ? getProductStockQty(foundProduct, demo) : null}
        duplicateEntry={duplicateEntry}
        initialQuantity={scan.quantity}
        saving={saving}
        onClose={() => {
          setFoundOpen(false);
          lastAutoOpenedSku.current = null;
        }}
        onSave={(qty) => {
          if (!foundProduct) return;
          void saveEntry(foundProduct, qty);
        }}
        onEditProduct={() => {
          if (!foundProduct) return;
          setFoundOpen(false);
          navigate(`/app/products/${foundProduct.id}`);
        }}
        onViewProduct={() => {
          if (!foundProduct) return;
          setFoundOpen(false);
          navigate(`/app/products/${foundProduct.id}`);
        }}
      />

      <MovementQuickProductModal
        open={quickOpen}
        scanValue={scan.scanValue}
        scanMode={scan.scanMode === 'barcode' ? 'barcode' : 'code'}
        scanPrefill={scan.scanInterpretation?.parsed?.extracted}
        quantity={scan.quantity}
        movementLabel={movementLabel}
        saving={saving}
        onClose={() => setQuickOpen(false)}
        onConfirm={(payload) => void handleQuickConfirm(payload)}
        onUseExisting={(product) => {
          setQuickOpen(false);
          handleUseExisting(product);
        }}
      />
    </>
  );
});

export default EntryReceivingPanel;
