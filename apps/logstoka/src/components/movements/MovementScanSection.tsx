import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Barcode,
  CheckCircle2,
  Hash,
  Link2,
  Minus,
  Plus,
  QrCode,
  ScanLine,
  Sparkles,
  X,
} from 'lucide-react';
import QrCameraScanner from '@/components/scanner/QrCameraScanner';
import ProductThumb from '@/components/products/ProductThumb';
import type { IntelligentScanResult } from '@/lib/intelligentScanClient';
import { peekNextInternalSku } from '@/lib/internalProductCode';
import { findProductByAnyIdentifier, type ProductLookupResult, type ProductScanMode } from '@/lib/productLookup';

type Props = {
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
  movementLabel: string;
  pageTitleIcon?: React.ReactNode;
  headerActions?: React.ReactNode;
  suppressPageHeader?: boolean;
  onRegister: () => void;
  onUseExisting: (product: ProductLookupResult) => void;
  registering?: boolean;
  suggestedInternalCode?: string | null;
  embedded?: boolean;
  /** Apenas leitura — sem coluna de quantidade/registro (modal global) */
  scanOnly?: boolean;
  inputId?: string;
};

const ACTION_LABELS: Record<string, string> = {
  lookup_catalog: 'Buscar no catálogo',
  quick_create: 'Cadastro rápido',
  register_movement: 'Registrar movimentação',
  fetch_url_data: 'Extrair dados do link',
  needs_user_input: 'Informar dados faltantes',
};

const MovementScanSection: React.FC<Props> = ({
  companyId,
  demo,
  scanMode,
  onScanModeChange,
  scanValue,
  onScanValueChange,
  onClearScan,
  quantity,
  onQuantityChange,
  resolvedProduct,
  resolving = false,
  interpreting = false,
  scanInterpretation = null,
  movementLabel,
  pageTitleIcon,
  headerActions,
  suppressPageHeader = false,
  onRegister,
  onUseExisting,
  registering = false,
  suggestedInternalCode = null,
  embedded = false,
  scanOnly = false,
  inputId = 'ls-movement-scan-input',
}) => {
  const [inputValue, setInputValue] = useState(scanValue);
  const [inputMatch, setInputMatch] = useState<ProductLookupResult | null>(null);
  const [checkingInput, setCheckingInput] = useState(false);
  const [localSuggestedCode, setLocalSuggestedCode] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestedCode = suggestedInternalCode ?? localSuggestedCode;

  useEffect(() => {
    setInputValue(scanValue);
  }, [scanValue]);

  useEffect(() => {
    const trimmed = inputValue.trim();
    if (trimmed.length < 2) {
      setInputMatch(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setCheckingInput(true);
      void findProductByAnyIdentifier(companyId, trimmed, demo)
        .then((product) => {
          if (!cancelled) setInputMatch(product);
        })
        .catch(() => {
          if (!cancelled) setInputMatch(null);
        })
        .finally(() => {
          if (!cancelled) setCheckingInput(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [companyId, demo, inputValue]);

  useEffect(() => {
    let cancelled = false;
    setLoadingSuggestion(true);
    void peekNextInternalSku(companyId, demo)
      .then((code) => {
        if (!cancelled) setLocalSuggestedCode(code);
      })
      .catch(() => {
        if (!cancelled) setLocalSuggestedCode(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingSuggestion(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, demo, scanValue, resolvedProduct?.id, inputMatch?.id]);

  const activeProduct = resolvedProduct ?? (scanValue.trim() ? inputMatch : null);
  const showCodeSuggestion = !activeProduct && !inputMatch && !checkingInput && Boolean(suggestedCode);

  const submitScan = (value?: string) => {
    const trimmed = (value ?? inputValue).trim();
    if (!trimmed) return;
    onScanValueChange(trimmed);
    setInputValue('');
    setCameraOn(false);
  };

  const clearScan = () => {
    setInputValue('');
    setInputMatch(null);
    onClearScan?.();
  };

  const parsed = scanInterpretation?.parsed;
  const ai = scanInterpretation?.ai;

  return (
    <section className={`ls-movement-scan${embedded ? ' ls-movement-scan--embedded' : ''}`}>
      {!suppressPageHeader && (pageTitleIcon || headerActions) ? (
        <div className="ls-movement-scan__page-header">
          <h2 className="ls-movement-scan__page-title">
            {pageTitleIcon ? <span className="ls-movement-scan__page-title-icon">{pageTitleIcon}</span> : null}
            {movementLabel}
          </h2>
          {headerActions ? <div className="ls-movement-scan__page-actions">{headerActions}</div> : null}
        </div>
      ) : null}

      <div className="ls-movement-scan__header">
        <div className="ls-movement-scan__header-main">
          <div className="min-w-0">
            <div className="ls-movement-scan__title">
              <span className="ls-movement-scan__icon-wrap">
                <ScanLine size={18} className="text-orange-600" aria-hidden />
              </span>
              Scanner inteligente
            </div>
          </div>

          <div className="ls-movement-scan__modes" role="tablist" aria-label="Modo de leitura">
            <button
              type="button"
              role="tab"
              aria-selected={scanMode === 'universal'}
              className={`ls-movement-scan__mode${scanMode === 'universal' ? ' ls-movement-scan__mode--active' : ''}`}
              onClick={() => onScanModeChange('universal')}
            >
              <QrCode size={15} aria-hidden />
              QR / Universal
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scanMode === 'code'}
              className={`ls-movement-scan__mode${scanMode === 'code' ? ' ls-movement-scan__mode--active' : ''}`}
              onClick={() => onScanModeChange('code')}
            >
              <Hash size={15} aria-hidden />
              Código
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scanMode === 'barcode'}
              className={`ls-movement-scan__mode${scanMode === 'barcode' ? ' ls-movement-scan__mode--active' : ''}`}
              onClick={() => onScanModeChange('barcode')}
            >
              <Barcode size={15} aria-hidden />
              Barras
            </button>
          </div>
        </div>
      </div>

      <div className="ls-movement-scan__body">
        <div className="ls-movement-scan__scan-col">
          <label className="ls-label" htmlFor={inputId}>
            {scanMode === 'barcode' ? 'Leitor / EAN / GTIN' : scanMode === 'code' ? 'Código ou nome' : 'QR Code, link, EAN ou código'}
          </label>

          <div className="ls-movement-scan__input-row">
            <div className="ls-movement-scan__input-wrap">
              <input
                id={inputId}
                ref={inputRef}
                className="ls-input ls-movement-scan__input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitScan()}
                placeholder={
                  scanMode === 'barcode'
                    ? 'Leia código de barras ou digite EAN'
                    : scanMode === 'code'
                      ? 'SKU, código da empresa ou nome'
                      : 'QR JSON, URL, EAN, SKU ou nome — qualquer etiqueta'
                }
                autoComplete="off"
              />
              {showCodeSuggestion && !embedded ? (
                <span className="ls-movement-scan__code-suggest" title="Próximo código interno único ao cadastrar">
                  <Sparkles size={12} aria-hidden />
                  {loadingSuggestion ? '…' : suggestedCode}
                </span>
              ) : null}
            </div>
            <button type="button" className="ls-movement-scan__ok-btn ls-btn-primary" onClick={() => submitScan()}>
              OK
            </button>
            <button
              type="button"
              className={`ls-movement-scan__cam-btn ls-btn-secondary${cameraOn ? ' ls-movement-scan__cam-btn--active' : ''}`}
              onClick={() => setCameraOn((v) => !v)}
              aria-pressed={cameraOn}
              title="Câmera — QR Code e barras"
            >
              <QrCode size={16} />
            </button>
          </div>

          {showCodeSuggestion && embedded ? (
            <span
              className="ls-movement-scan__code-suggest ls-movement-scan__code-suggest--below"
              title="Próximo código interno único ao cadastrar"
            >
              <Sparkles size={12} aria-hidden />
              {loadingSuggestion ? '…' : suggestedCode}
            </span>
          ) : null}

          <p className="ls-movement-scan__enter-hint">
            Enter ou OK · leitor USB · câmera do celular para QR Code
          </p>

          {showCodeSuggestion ? (
            <p className="ls-movement-scan__code-hint">
              Produto novo receberá <strong>{suggestedCode}</strong> — código interno único, sem repetição.
            </p>
          ) : null}

          <QrCameraScanner
            active={cameraOn}
            onScan={(value) => submitScan(value)}
            onError={() => setCameraOn(false)}
          />

          {scanValue ? (
            <div className="ls-movement-scan__read-chip">
              <span className="ls-movement-scan__read-chip-label">Lido</span>
              <code className="ls-movement-scan__read-chip-value">{scanValue}</code>
              <button type="button" className="ls-movement-scan__read-chip-clear" onClick={clearScan} aria-label="Limpar leitura">
                <X size={14} />
              </button>
            </div>
          ) : null}

          {interpreting ? (
            <p className="ls-movement-scan__checking">Llama 3.2 interpretando conteúdo…</p>
          ) : null}

          {checkingInput ? (
            <p className="ls-movement-scan__checking">Verificando se já está cadastrado…</p>
          ) : null}

          {parsed && scanValue ? (
            <div className="ls-intelligent-scan">
              <div className="ls-intelligent-scan__head">
                <Sparkles size={15} className="text-orange-600" aria-hidden />
                <span>Interpretação</span>
                <span className="ls-intelligent-scan__format">{parsed.formatLabel}</span>
              </div>
              <p className="ls-intelligent-scan__preview">{parsed.preview}</p>
              {ai?.summary ? <p className="ls-intelligent-scan__summary">{ai.summary}</p> : null}
              {parsed.extracted.url ? (
                <p className="ls-intelligent-scan__url">
                  <Link2 size={13} aria-hidden />
                  {parsed.extracted.url}
                </p>
              ) : null}
              <div className="ls-intelligent-scan__fields">
                {parsed.extracted.name ? <span>Nome: {parsed.extracted.name}</span> : null}
                {(parsed.extracted.barcode || parsed.extracted.ean) ? (
                  <span>EAN: {parsed.extracted.barcode ?? parsed.extracted.ean}</span>
                ) : null}
                {parsed.extracted.brand ? <span>Marca: {parsed.extracted.brand}</span> : null}
                {parsed.extracted.category ? <span>Categoria: {parsed.extracted.category}</span> : null}
                {ai?.name && !parsed.extracted.name ? <span>Sugerido: {ai.name}</span> : null}
              </div>
              <div className="ls-intelligent-scan__actions">
                {parsed.suggestedActions.map((action) => (
                  <span key={action} className="ls-intelligent-scan__action-chip">
                    {ACTION_LABELS[action] ?? action}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {inputMatch && !scanValue ? (
            <div className="ls-movement-scan__duplicate" role="alert">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-emerald-900">Produto já cadastrado</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">{inputMatch.name}</p>
                <p className="text-xs text-slate-600">
                  SKU {inputMatch.sku}
                  {inputMatch.internal_code ? ` · ${inputMatch.internal_code}` : ''}
                  {inputMatch.barcode ? ` · EAN ${inputMatch.barcode}` : ''}
                </p>
              </div>
              <button type="button" className="ls-btn-primary shrink-0 text-xs" onClick={() => onUseExisting(inputMatch)}>
                Usar este
              </button>
            </div>
          ) : null}
        </div>

        {!scanOnly ? (
        <div className="ls-movement-scan__action-col">
          <div className="ls-movement-scan__qty">
            <label className="ls-label">Quantidade</label>
            <div className="ls-movement-scan__qty-row">
              <button
                type="button"
                className="ls-movement-scan__qty-btn"
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                aria-label="Diminuir quantidade"
              >
                <Minus size={16} />
              </button>
              <input
                className="ls-input ls-movement-scan__qty-input"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => onQuantityChange(Number(e.target.value) || 1)}
              />
              <button
                type="button"
                className="ls-movement-scan__qty-btn"
                onClick={() => onQuantityChange(quantity + 1)}
                aria-label="Aumentar quantidade"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div
            className={`ls-movement-scan__status${
              activeProduct
                ? ' ls-movement-scan__status--found'
                : scanValue
                  ? ' ls-movement-scan__status--missing'
                  : ''
            }`}
          >
            <p className="ls-movement-scan__status-title">Produto identificado</p>
            {resolving || interpreting ? (
              <p className="mt-2 text-sm text-slate-500">Buscando no catálogo…</p>
            ) : activeProduct ? (
              <div className="mt-2 flex items-start gap-3">
                <ProductThumb src={activeProduct.main_image_url} name={activeProduct.name} size={44} />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
                    <CheckCircle2 size={14} aria-hidden />
                    Encontrado
                  </p>
                  <p className="font-bold text-slate-900">{activeProduct.name}</p>
                  <p className="text-xs text-slate-500">
                    {activeProduct.sku}
                    {activeProduct.barcode ? ` · EAN ${activeProduct.barcode}` : ''}
                  </p>
                </div>
              </div>
            ) : scanValue ? (
              <div className="mt-2 space-y-2">
                <p className="flex items-start gap-2 text-sm text-orange-800">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
                  {scanInterpretation?.readyToRegister && ai?.suggested_action === 'quick_create'
                    ? `Dados suficientes — confirme para cadastrar e dar ${movementLabel.toLowerCase()}.`
                    : `Não cadastrado — informe o que faltar ou confirme sugestão da IA.`}
                </p>
                {suggestedCode ? (
                  <p className="ls-movement-scan__reserved-code">
                    Novo código: <strong>{suggestedCode}</strong>
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Aguardando leitura ou digitação.</p>
            )}
          </div>
        </div>
        ) : null}
      </div>

      {!embedded && !scanOnly ? (
      <div className="ls-movement-scan__footer">
        {activeProduct ? (
          <button
            type="button"
            className="ls-movement-scan__submit ls-btn-primary"
            disabled={registering}
            onClick={() => onUseExisting(activeProduct)}
          >
            {registering ? 'Registrando…' : `Registrar ${movementLabel} · ${quantity} un.`}
          </button>
        ) : (
          <button
            type="button"
            className="ls-movement-scan__submit ls-btn-primary"
            disabled={!scanValue || registering}
            onClick={onRegister}
          >
            {registering
              ? 'Registrando…'
              : scanValue
                ? scanInterpretation?.readyToRegister
                  ? `Cadastrar e registrar ${movementLabel} · ${quantity} un.`
                  : `Completar cadastro · ${movementLabel}`
                : `Registrar ${movementLabel}`}
          </button>
        )}
      </div>
      ) : null}
    </section>
  );
};

export default MovementScanSection;
