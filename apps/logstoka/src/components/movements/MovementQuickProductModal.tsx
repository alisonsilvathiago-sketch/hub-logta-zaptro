import { LOGSTOKA_AI_BRAND } from '@/modules/ai/constants';
import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ImagePlus,
  Loader2,
  RefreshCw,
  PackagePlus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import ProductThumb from '@/components/products/ProductThumb';
import { upgradeProductImageUrl } from '@/lib/productImageUrl';
import {
  fetchProductImageForQuickCreate,
  suggestProductForQuickCreate,
  type ProductAiSuggestion,
} from '@/lib/productSuggestClient';
import type { ScanQuickPrefill } from '@/lib/intelligentScanClient';
import type { ProductLookupResult } from '@/lib/productLookup';
import { peekNextInternalSku } from '@/lib/internalProductCode';
import { uploadProductImage } from '@/lib/storage';
import { UNIVERSAL_PRODUCT_IMAGE } from '@/lib/universalProductCatalog';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';

export type QuickProductPayload = {
  name: string;
  internal_code: string;
  barcode: string;
  brand?: string;
  main_image_url?: string | null;
};

type ImageSource = 'none' | 'ai' | 'upload';

type Props = {
  open: boolean;
  scanValue: string;
  scanMode: 'code' | 'barcode';
  scanPrefill?: ScanQuickPrefill;
  quantity: number;
  movementLabel: string;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (payload: QuickProductPayload) => void;
  onUseExisting: (product: ProductLookupResult) => void;
};

const MovementQuickProductModal: React.FC<Props> = ({
  open,
  scanValue,
  scanMode,
  scanPrefill,
  quantity,
  movementLabel,
  saving = false,
  onClose,
  onConfirm,
  onUseExisting,
}) => {
  const { companyId } = useLogstokaTenant();
  const demo = isLogstokaDemoCompany(companyId);
  const [name, setName] = useState('');
  const [internalCode, setInternalCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [brand, setBrand] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSource, setImageSource] = useState<ImageSource>('none');
  const [imageVariant, setImageVariant] = useState(0);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localMatches, setLocalMatches] = useState<ProductLookupResult[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<ProductAiSuggestion | null>(null);
  const [aiApplied, setAiApplied] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestedInternalCode, setSuggestedInternalCode] = useState<string | null>(null);
  const lastAutoAppliedQuery = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const setPreviewFromUrl = (url: string | null, source: ImageSource, file: File | null = null) => {
    revokeObjectUrl();
    setPreviewImage(url);
    setImageFile(file);
    setImageSource(source);
  };

  useEffect(() => {
    if (!open) return;
    const trimmed = scanValue.trim();
    const pre = scanPrefill;
    lastAutoAppliedQuery.current = '';
    setAiApplied(false);
    setImageVariant(0);
    revokeObjectUrl();
    setImageFile(null);
    setImageSource('none');

    const prefillName = pre?.name?.trim() ?? '';
    const prefillBrand = pre?.brand?.trim() ?? '';
    const prefillBarcode = pre?.barcode?.trim() ?? (scanMode === 'barcode' ? trimmed : '');
    const prefillInternal = pre?.internal_code?.trim() ?? '';

    if (prefillName) {
      setName(prefillName);
      setBrand(prefillBrand);
      setBarcode(prefillBarcode);
      setInternalCode(prefillInternal || (/^\d+$|^[A-Za-z0-9-]{2,20}$/.test(trimmed) ? trimmed : ''));
      if (pre?.main_image_url) {
        setPreviewFromUrl(upgradeProductImageUrl(pre.main_image_url), 'ai');
        setAiApplied(true);
      } else {
        setPreviewImage(null);
      }
    } else if (scanMode === 'barcode') {
      setBarcode(prefillBarcode || trimmed);
      setInternalCode(prefillInternal);
      setName('');
      setBrand('');
      setPreviewImage(null);
    } else {
      setBarcode(prefillBarcode);
      setInternalCode(prefillInternal || (/^\d+$|^[A-Za-z0-9-]{2,20}$/.test(trimmed) ? trimmed : ''));
      setName(/^[A-Za-zÀ-ú]/.test(trimmed) && trimmed.length > 3 ? trimmed : '');
      setBrand('');
      setPreviewImage(null);
    }

    setLocalMatches([]);
    setAiSuggestion(null);
    void peekNextInternalSku(companyId, demo).then(setSuggestedInternalCode).catch(() => setSuggestedInternalCode(null));
  }, [open, scanMode, scanValue, scanPrefill, companyId, demo]);

  useEffect(() => {
    return () => {
      revokeObjectUrl();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const query = name.trim();
    if (query.length < 2) {
      setLocalMatches([]);
      setAiSuggestion(null);
      if (imageSource === 'none') {
        setPreviewFromUrl(null, 'none');
        setAiApplied(false);
      }
      lastAutoAppliedQuery.current = '';
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
      void suggestProductForQuickCreate(companyId, query, demo, 0)
        .then((result) => {
          if (cancelled) return;
          setLocalMatches(result.local_matches);
          setAiSuggestion(result.ai_suggestion);

          if (result.ai_suggestion && lastAutoAppliedQuery.current !== query) {
            lastAutoAppliedQuery.current = query;
            setName(result.ai_suggestion.name);
            if (result.ai_suggestion.brand) setBrand(result.ai_suggestion.brand);
            if (result.ai_suggestion.image_url && imageSource === 'none') {
              setPreviewFromUrl(upgradeProductImageUrl(result.ai_suggestion.image_url), 'ai');
            }
            setAiApplied(true);
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [companyId, demo, name, open, imageSource]);

  const imageQuery = () => name.trim() || scanValue.trim();

  const handleGenerateImage = async (regenerate = false) => {
    const query = imageQuery();
    if (query.length < 2) {
      toast.error('Digite o nome do produto antes de gerar a foto');
      return;
    }

    const nextVariant = regenerate ? imageVariant + 1 : imageVariant;
    if (regenerate) setImageVariant(nextVariant);

    setGeneratingImage(true);
    try {
      const imageUrl = await fetchProductImageForQuickCreate(companyId, query, demo, nextVariant);
      if (!imageUrl) {
        toast.error('Nenhuma foto encontrada — tente subir manualmente');
        return;
      }
      setPreviewFromUrl(upgradeProductImageUrl(imageUrl), 'ai');
      toast.success(regenerate ? 'Nova foto gerada pela IA' : 'Foto encontrada pela IA');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao buscar foto');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewFromUrl(null, 'none');
    toast.success('Foto removida');
  };

  const handleFilePick = (file: File | undefined) => {
    if (!file) return;

    if (!UNIVERSAL_PRODUCT_IMAGE.acceptedMime.includes(file.type as (typeof UNIVERSAL_PRODUCT_IMAGE.acceptedMime)[number])) {
      toast.error(`Use ${UNIVERSAL_PRODUCT_IMAGE.acceptedLabel}`);
      return;
    }

    if (file.size > UNIVERSAL_PRODUCT_IMAGE.maxFileSizeMb * 1024 * 1024) {
      toast.error(`Imagem até ${UNIVERSAL_PRODUCT_IMAGE.maxFileSizeMb} MB`);
      return;
    }

    revokeObjectUrl();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewImage(url);
    setImageFile(file);
    setImageSource('upload');
    toast.success('Foto carregada — pronta para salvar');
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setName(aiSuggestion.name);
    if (aiSuggestion.brand) setBrand(aiSuggestion.brand);
    if (aiSuggestion.image_url) {
      setPreviewFromUrl(upgradeProductImageUrl(aiSuggestion.image_url), 'ai');
    }
    setAiApplied(true);
  };

  const handleConfirm = async () => {
    let mainImageUrl = previewImage;

    if (imageFile && !demo && companyId) {
      setUploadingImage(true);
      try {
        mainImageUrl = await uploadProductImage(companyId, imageFile);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao enviar foto');
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    onConfirm({
      name: name.trim(),
      internal_code: internalCode.trim(),
      barcode: barcode.trim(),
      brand: brand.trim() || undefined,
      main_image_url: mainImageUrl,
    });
  };

  const busy = saving || uploadingImage;
  const canGenerateImage = imageQuery().length >= 2 && !generatingImage;

  const footer = (
    <>
      <button type="button" className="ls-btn-secondary" onClick={onClose} disabled={busy}>
        Cancelar
      </button>
      <button type="button" className="ls-btn-primary" disabled={busy || !name.trim()} onClick={() => void handleConfirm()}>
        {busy ? 'Salvando…' : `Cadastrar e registrar ${movementLabel.toLowerCase()}`}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      size="landscape"
      title="Produto não encontrado"
      subtitle={`${LOGSTOKA_AI_BRAND} · código interno automático (LS000001) · busca com IA`}
      icon={<PackagePlus size={20} strokeWidth={2.25} />}
      onClose={onClose}
      footer={footer}
    >
      <div className="ls-quick-product-modal">
        <aside className="ls-quick-product-modal__aside">
          <div className="ls-quick-product-modal__aside-head">
            <Search size={16} className="text-orange-600" aria-hidden />
            <span>Pesquisa e prévia</span>
            {searching || generatingImage ? (
              <Loader2 size={14} className="animate-spin text-slate-400" aria-hidden />
            ) : null}
          </div>

          <div className={`ls-quick-product-modal__preview${previewImage ? ' ls-quick-product-modal__preview--filled' : ''}`}>
            {generatingImage ? (
              <div className="ls-quick-product-modal__preview-loading">
                <Loader2 size={28} className="animate-spin text-orange-500" aria-hidden />
                <p>{LOGSTOKA_AI_BRAND} buscando foto…</p>
                <span>Fundo branco · embalagem do produto</span>
              </div>
            ) : previewImage ? (
              <>
                <img
                  src={previewImage}
                  alt=""
                  className="ls-quick-product-modal__preview-img"
                  loading="eager"
                  decoding="async"
                />
                <span
                  className={`ls-quick-product-modal__preview-badge${imageSource === 'upload' ? ' ls-quick-product-modal__preview-badge--upload' : ''}`}
                >
                  {imageSource === 'upload' ? 'Arquivo' : 'IA'}
                </span>
                <div className="ls-quick-product-modal__preview-overlay">
                  <button type="button" className="ls-quick-product-modal__preview-action" onClick={handleRemoveImage}>
                    <Trash2 size={14} aria-hidden />
                    Remover
                  </button>
                  {imageSource === 'ai' ? (
                    <button
                      type="button"
                      className="ls-quick-product-modal__preview-action"
                      disabled={!canGenerateImage}
                      onClick={() => void handleGenerateImage(true)}
                    >
                      <RefreshCw size={14} aria-hidden />
                      Gerar outra
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="ls-quick-product-modal__preview-action ls-quick-product-modal__preview-action--primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} aria-hidden />
                    Subir foto
                  </button>
                </div>
              </>
            ) : (
              <div className="ls-quick-product-modal__preview-empty">
                <span className="ls-quick-product-modal__preview-empty-icon" aria-hidden>
                  <ImagePlus size={34} strokeWidth={1.75} />
                </span>
                <p>Adicionar foto do produto</p>
                <span>{UNIVERSAL_PRODUCT_IMAGE.hint}</span>
                <div className="ls-quick-product-modal__preview-actions">
                  <button
                    type="button"
                    className="ls-quick-product-modal__preview-btn ls-quick-product-modal__preview-btn--ai"
                    disabled={!canGenerateImage}
                    onClick={() => void handleGenerateImage(false)}
                  >
                    <Sparkles size={15} aria-hidden />
                    Gerar com IA
                  </button>
                  <button
                    type="button"
                    className="ls-quick-product-modal__preview-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={15} aria-hidden />
                    Subir foto
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={UNIVERSAL_PRODUCT_IMAGE.acceptedMime.join(',')}
              className="hidden"
              onChange={(e) => {
                handleFilePick(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>

          {aiSuggestion ? (
            <div className="ls-quick-product-modal__ai">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-orange-700">
                <Sparkles size={14} aria-hidden />
                Sugestão {LOGSTOKA_AI_BRAND}
              </div>
              <p className="mt-2 text-sm font-bold text-slate-900">{aiSuggestion.name}</p>
              {aiSuggestion.brand ? <p className="text-xs text-slate-500">Marca: {aiSuggestion.brand}</p> : null}
              {aiSuggestion.category_hint ? (
                <p className="text-xs text-slate-500">Categoria: {aiSuggestion.category_hint}</p>
              ) : null}
              <button
                type="button"
                className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 text-xs${aiApplied ? ' ls-btn-primary' : ' ls-btn-secondary'}`}
                onClick={applyAiSuggestion}
                disabled={aiApplied}
              >
                {aiApplied ? (
                  <>
                    <Check size={14} className="inline" aria-hidden /> Sugestão aplicada
                  </>
                ) : (
                  'Usar sugestão da IA'
                )}
              </button>
            </div>
          ) : searching ? (
            <p className="text-xs text-slate-500">{LOGSTOKA_AI_BRAND} pesquisando produto e imagem…</p>
          ) : null}

          <div className="ls-quick-product-modal__matches">
            <p className="ls-quick-product-modal__matches-title">No seu catálogo</p>
            {localMatches.length === 0 ? (
              <p className="text-xs text-slate-500">
                {name.trim().length >= 2 ? 'Nenhum produto similar cadastrado.' : 'Digite o nome para pesquisar.'}
              </p>
            ) : (
              <ul className="ls-quick-product-modal__match-list">
                {localMatches.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      className="ls-quick-product-modal__match-item"
                      onClick={() => onUseExisting(product)}
                    >
                      <ProductThumb src={product.main_image_url} name={product.name} size={36} />
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-sm font-bold text-slate-900">{product.name}</span>
                        <span className="block truncate text-xs text-slate-500">SKU {product.sku}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <div className="ls-quick-product-modal__form">
          <p className="ls-quick-product-modal__alert">
            Nenhum produto corresponde a <strong>{scanValue || '—'}</strong>. Informe o nome para buscar e cadastrar
            com {movementLabel.toLowerCase()} de <strong>{quantity}</strong> un.
            {suggestedInternalCode ? (
              <>
                {' '}
                Código interno único: <strong>{suggestedInternalCode}</strong>
              </>
            ) : null}
          </p>

          <div>
            <label className="ls-label">Nome do produto *</label>
            <input
              className="ls-input"
              value={name}
              onChange={(e) => {
                lastAutoAppliedQuery.current = '';
                setAiApplied(false);
                setName(e.target.value);
              }}
              placeholder="Ex.: Fralda Baby Free 100 C/10"
              autoFocus
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="ls-label">Código da empresa (opcional)</label>
              <input
                className="ls-input"
                value={internalCode}
                onChange={(e) => setInternalCode(e.target.value)}
                placeholder="Ex.: 12345 ou BF100"
              />
            </div>
            <div>
              <label className="ls-label">Código de barras (opcional)</label>
              <input
                className="ls-input"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="EAN / GTIN"
              />
            </div>
          </div>

          <div>
            <label className="ls-label">Marca (opcional)</label>
            <input
              className="ls-input"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={`Preenchida pelo ${LOGSTOKA_AI_BRAND} quando disponível`}
            />
          </div>

          <p className="text-xs text-slate-500">
            Código interno LogStoka gerado ao salvar. SKU, EAN e código da empresa são opcionais. Foto: gere com IA,
            suba do Google/computador ou troque a qualquer momento.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default MovementQuickProductModal;
