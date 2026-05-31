import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  ClipboardCheck,
  ClipboardList,
  Pencil,
  ScanLine,
  Search,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import MovementScanSection from '@/components/movements/MovementScanSection';
import ProductThumb from '@/components/products/ProductThumb';
import Modal from '@/components/ui/Modal';
import { useIntelligentScanState } from '@/hooks/useIntelligentScanState';
import { getDemoStockQty } from '@/lib/logstokaDemoSeed';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { logstokaApi } from '@/lib/logstokaApi';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import type { ProductLookupResult } from '@/lib/productLookup';
import './intelligentScanGlobal.css';

type Step = 'scan' | 'actions' | 'not-found' | 'entry' | 'exit' | 'conference' | 'inventory';

type Props = {
  open: boolean;
  onClose: () => void;
};

const ACTION_BUTTONS = [
  { id: 'entry' as const, label: 'Dar entrada', hint: 'Recebimento no estoque', Icon: ArrowDownToLine },
  { id: 'exit' as const, label: 'Dar saída', hint: 'Expedição ou consumo', Icon: ArrowUpFromLine },
  { id: 'conference' as const, label: 'Conferir', hint: 'Conferência guiada', Icon: ClipboardCheck },
  { id: 'inventory' as const, label: 'Inventário', hint: 'Contagem física', Icon: ClipboardList },
  { id: 'consult' as const, label: 'Consultar', hint: 'Ver ficha do produto', Icon: Search },
  { id: 'edit' as const, label: 'Editar', hint: 'Abrir cadastro', Icon: Pencil },
];

const IntelligentScanGlobalModal: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { companyId } = useLogstokaTenant();
  const demo = isLogstokaDemoCompany(companyId);
  const scan = useIntelligentScanState(companyId, demo, 'entry');
  const [step, setStep] = useState<Step>('scan');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [conferenceExpected] = useState(5);

  useEffect(() => {
    if (!open) return;
    setStep('scan');
    setQuantity(1);
    setNote('');
    scan.clearScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset ao abrir
  }, [open]);

  useEffect(() => {
    if (!open || step !== 'scan') return;
    if (!scan.scanValue.trim()) return;
    if (scan.interpreting || scan.resolving) return;
    setStep(scan.resolvedProduct ? 'actions' : 'not-found');
  }, [
    open,
    step,
    scan.scanValue,
    scan.interpreting,
    scan.resolving,
    scan.resolvedProduct,
  ]);

  const product = scan.resolvedProduct;
  const stockQty = useMemo(() => {
    if (!product || !demo) return null;
    return getDemoStockQty(product.id);
  }, [product, demo]);

  const resetToScan = () => {
    scan.clearScan();
    setStep('scan');
    setQuantity(1);
    setNote('');
  };

  const closeAll = () => {
    resetToScan();
    onClose();
  };

  const registerEntryExit = async (type: 'entry' | 'exit') => {
    const sku = product?.sku ?? scan.scanValue.trim();
    if (!sku) return;
    setSaving(true);
    try {
      if (demo) {
        toast.success(
          `[Demo] ${type === 'entry' ? 'Entrada' : 'Saída'} registrada: ${sku} × ${quantity}`,
        );
        closeAll();
        return;
      }
      if (type === 'entry') {
        await logstokaApi.createEntry({
          sub_type: 'factory',
          items: [{ sku, quantity }],
          notes: note || undefined,
        });
      } else {
        await logstokaApi.createOutput({
          sub_type: 'sale',
          items: [{ sku, quantity }],
          notes: note || undefined,
        });
      }
      toast.success(`${type === 'entry' ? 'Entrada' : 'Saída'} registrada`);
      closeAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar');
    } finally {
      setSaving(false);
    }
  };

  const handleConsult = (p: ProductLookupResult) => {
    closeAll();
    navigate(`/app/products/${p.id}`);
  };

  const handleAction = (actionId: (typeof ACTION_BUTTONS)[number]['id'] | 'consult' | 'edit') => {
    if (actionId === 'consult' && product) {
      handleConsult(product);
      return;
    }
    if (actionId === 'edit' && product) {
      closeAll();
      navigate(`/app/products/${product.id}`);
      return;
    }
    if (actionId === 'entry' || actionId === 'exit' || actionId === 'conference' || actionId === 'inventory') {
      setStep(actionId);
      return;
    }
  };

  const finishConference = (ok: boolean) => {
    const sku = product?.sku ?? scan.scanValue;
    toast.success(
      ok
        ? `[${demo ? 'Demo' : 'OK'}] Conferência OK · ${sku} × ${conferenceExpected}`
        : `[${demo ? 'Demo' : 'OK'}] Divergência registrada · ${sku}`,
    );
    closeAll();
  };

  const finishInventory = () => {
    const sku = product?.sku ?? scan.scanValue;
    toast.success(`[${demo ? 'Demo' : 'OK'}] Inventário · ${sku} contado: ${quantity} un.`);
    closeAll();
  };

  const renderProductCard = () => {
    if (!product) return null;
    return (
      <div className="ls-global-scan__product">
        <ProductThumb src={product.main_image_url} name={product.name} size={52} />
        <div className="min-w-0 flex-1">
          <p className="ls-global-scan__product-name">{product.name}</p>
          <p className="ls-global-scan__product-meta">
            Código <strong>{product.internal_code ?? product.sku}</strong>
            {product.barcode ? ` · EAN ${product.barcode}` : ''}
          </p>
          {stockQty != null ? (
            <p className="ls-global-scan__product-stock">
              Estoque atual: <strong>{stockQty.toLocaleString('pt-BR')} un.</strong>
            </p>
          ) : null}
          {scan.scanInterpretation?.ai?.summary ? (
            <p className="ls-global-scan__ai">
              <Sparkles size={13} aria-hidden />
              {scan.scanInterpretation.ai.summary}
            </p>
          ) : null}
        </div>
      </div>
    );
  };

  const renderActions = () => (
    <div className="ls-global-scan__actions">
      <p className="ls-global-scan__actions-title">O que deseja fazer?</p>
      {renderProductCard()}
      <div className="ls-global-scan__action-grid">
        {ACTION_BUTTONS.map(({ id, label, hint, Icon }) => (
          <button
            key={id}
            type="button"
            className="ls-global-scan__action-btn"
            onClick={() => handleAction(id)}
          >
            <span className="ls-global-scan__action-icon" aria-hidden>
              <Icon size={18} strokeWidth={2.2} />
            </span>
            <span>
              <strong>{label}</strong>
              <em>{hint}</em>
            </span>
          </button>
        ))}
      </div>
      <button type="button" className="ls-global-scan__back" onClick={resetToScan}>
        <ArrowLeft size={14} />
        Nova leitura
      </button>
    </div>
  );

  const renderNotFound = () => (
    <div className="ls-global-scan__not-found">
      <p className="ls-global-scan__not-found-title">Produto não encontrado</p>
      <p className="ls-global-scan__not-found-code">
        Código lido: <code>{scan.scanValue}</code>
      </p>
      {scan.scanInterpretation?.ai?.summary ? (
        <p className="ls-global-scan__ai ls-global-scan__ai--block">
          <Sparkles size={14} aria-hidden />
          {scan.scanInterpretation.ai.summary}
        </p>
      ) : null}
      <div className="ls-global-scan__not-found-actions">
        <Link
          to={`${LOGSTOKA_ROUTES.PRODUCTS}?scan=${encodeURIComponent(scan.scanValue)}`}
          className="ls-btn-primary"
          onClick={closeAll}
        >
          Cadastrar produto
        </Link>
        <button type="button" className="ls-btn-secondary" onClick={resetToScan}>
          Tentar outro código
        </button>
      </div>
    </div>
  );

  const renderQtyForm = (type: 'entry' | 'exit' | 'inventory') => {
    const titles = {
      entry: 'Registrar entrada',
      exit: 'Registrar saída',
      inventory: 'Contagem de inventário',
    };
    return (
      <div className="ls-global-scan__form">
        <p className="ls-global-scan__actions-title">{titles[type]}</p>
        {renderProductCard()}
        <label className="ls-label">
          Quantidade
          <input
            type="number"
            min={1}
            className="ls-input mt-1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          />
        </label>
        {type !== 'inventory' ? (
          <label className="ls-label mt-3 block">
            Observação (opcional)
            <input
              className="ls-input mt-1"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={type === 'entry' ? 'Fornecedor, NF-e…' : 'Pedido, motivo…'}
            />
          </label>
        ) : null}
        <div className="ls-global-scan__form-actions">
          <button type="button" className="ls-btn-secondary" onClick={() => setStep('actions')}>
            Voltar
          </button>
          <button
            type="button"
            className="ls-btn-primary"
            disabled={saving}
            onClick={() => {
              if (type === 'inventory') void finishInventory();
              else void registerEntryExit(type);
            }}
          >
            {saving ? 'Salvando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    );
  };

  const renderConference = () => (
    <div className="ls-global-scan__form">
      <p className="ls-global-scan__actions-title">Conferência guiada</p>
      {renderProductCard()}
      <div className="ls-global-scan__conf-box">
        <p>
          Quantidade esperada: <strong>{conferenceExpected} un.</strong>
        </p>
        <p className="text-xs text-[#737373]">Localização sugerida: Corredor B · Prateleira 03</p>
      </div>
      <div className="ls-global-scan__form-actions">
        <button type="button" className="ls-btn-secondary" onClick={() => setStep('actions')}>
          Voltar
        </button>
        <button type="button" className="ls-btn-secondary" onClick={() => finishConference(false)}>
          Divergência
        </button>
        <button type="button" className="ls-btn-primary" onClick={() => finishConference(true)}>
          Conferido
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={closeAll}
      title="Scanner inteligente"
      subtitle="QR Code · código de barras · EAN · SKU · código interno"
      icon={<ScanLine size={20} strokeWidth={2.2} />}
      size="landscape"
      panelClassName="ls-global-scan-modal"
    >
      {step === 'scan' ? (
        <MovementScanSection
          companyId={companyId}
          demo={demo}
          scanMode={scan.scanMode}
          onScanModeChange={scan.setScanMode}
          scanValue={scan.scanValue}
          onScanValueChange={(value) => {
            scan.setScanValue(value);
            toast.success(`Código lido: ${value}`);
          }}
          onClearScan={scan.clearScan}
          quantity={scan.quantity}
          onQuantityChange={scan.setQuantity}
          resolvedProduct={scan.resolvedProduct}
          resolving={scan.resolving}
          interpreting={scan.interpreting}
          scanInterpretation={scan.scanInterpretation}
          movementLabel="Operação"
          embedded
          scanOnly
          suppressPageHeader
          inputId="ls-global-scan-input"
          onRegister={() => undefined}
          onUseExisting={() => undefined}
        />
      ) : null}
      {step === 'actions' ? renderActions() : null}
      {step === 'not-found' ? renderNotFound() : null}
      {step === 'entry' ? renderQtyForm('entry') : null}
      {step === 'exit' ? renderQtyForm('exit') : null}
      {step === 'inventory' ? renderQtyForm('inventory') : null}
      {step === 'conference' ? renderConference() : null}
    </Modal>
  );
};

export default IntelligentScanGlobalModal;
