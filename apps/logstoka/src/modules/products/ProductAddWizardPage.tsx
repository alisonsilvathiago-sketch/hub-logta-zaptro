import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ImagePlus, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ProductWizardBanner from '@/components/products/ProductWizardBanner';
import ProductWizardStepper, { type WizardStepDef } from '@/components/products/ProductWizardStepper';
import { useCategories } from '@/hooks/useCatalog';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { uploadProductImage } from '@/lib/storage';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import {
  PRODUCT_ORIGIN_CODES,
  PRODUCT_UNITS,
  UNIVERSAL_PRODUCT_IMAGE,
  emptyUniversalProductForm,
  type UniversalProductFields,
} from '@/lib/universalProductCatalog';
import { supabase } from '@/lib/supabase';
import './productAddWizard.css';

const WIZARD_STEPS: WizardStepDef[] = [
  { id: 'basic', label: 'Dados básicos' },
  { id: 'stock', label: 'Estoque e preços' },
  { id: 'logistics', label: 'Logística', optional: true },
  { id: 'images', label: 'Imagem', optional: true },
  { id: 'tax', label: 'Dados fiscais', optional: true },
];

const ProductAddWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { companyId } = useLogstokaTenant();
  const { categories } = useCategories();
  const demo = isLogstokaDemoCompany(companyId);
  const [step, setStep] = useState(0);
  const [completedThrough, setCompletedThrough] = useState(-1);
  const [form, setForm] = useState<UniversalProductFields>(() => {
    const base = emptyUniversalProductForm();
    const name = searchParams.get('name')?.trim();
    const sku = searchParams.get('sku')?.trim();
    return {
      ...base,
      ...(name ? { name } : {}),
      ...(sku ? { sku, internal_code: sku } : {}),
    };
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState(false);
  const [invalidName, setInvalidName] = useState(false);

  const displayName = form.name.trim() || 'Novo produto';

  const validateBasic = () => {
    if (!form.name.trim()) {
      setInvalidName(true);
      setWarning('Preencha o nome do produto');
      return false;
    }
    setInvalidName(false);
    setWarning(null);
    return true;
  };

  const persistDraft = async (): Promise<boolean> => {
    if (!companyId) {
      toast.error('Empresa não identificada');
      return false;
    }
    if (!form.sku.trim()) {
      const autoSku = `LS${String(Date.now()).slice(-6)}`;
      setForm((f) => ({ ...f, sku: autoSku }));
    }

    const sku = form.sku.trim() || `LS${String(Date.now()).slice(-6)}`;

    setSaving(true);
    try {
      if (demo) {
        setSuccessBanner(true);
        return true;
      }

      let main_image_url: string | null = null;
      if (imageFile) main_image_url = await uploadProductImage(companyId, imageFile);

      const payload = {
        company_id: companyId,
        sku,
        internal_code: form.internal_code || null,
        barcode: form.barcode || null,
        name: form.name.trim(),
        short_name: form.short_name || null,
        manufacturer_code: form.internal_code || null,
        ncm: form.ncm || null,
        origin_code: form.origin_code || '0',
        description_short: form.description_short || null,
        description: form.description || null,
        description_html: form.description_html || null,
        category_id: form.category_id || null,
        brand: form.brand || null,
        unit: form.unit || 'UN',
        cost: Number(form.cost) || 0,
        sale_price: Number(form.sale_price) || 0,
        promo_price: form.promo_price ? Number(form.promo_price) : null,
        min_stock: Number(form.min_stock) || 0,
        max_stock: form.max_stock ? Number(form.max_stock) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        width_cm: form.width_cm ? Number(form.width_cm) : null,
        length_cm: form.length_cm ? Number(form.length_cm) : null,
        main_image_url,
        status: form.status,
        publication_status: form.publication_status,
        updated_at: new Date().toISOString(),
      };

      if (draftId) {
        const { error } = await supabase.from('ls_products').update(payload).eq('id', draftId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('ls_products').insert(payload).select('id').single();
        if (error) throw error;
        setDraftId(String(data.id));
      }

      setSuccessBanner(true);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    if (step === 0 && !validateBasic()) return;

    if (step === 0 && !draftId && !demo) {
      const ok = await persistDraft();
      if (!ok) return;
    } else if (step === 0 && demo) {
      setSuccessBanner(true);
    }

    if (step < WIZARD_STEPS.length - 1) {
      setCompletedThrough((prev) => Math.max(prev, step));
      setStep((s) => s + 1);
      setWarning(null);
      return;
    }

    setSaving(true);
    try {
      if (demo) {
        toast.success('[Demo] Produto cadastrado com sucesso');
        navigate(LOGSTOKA_ROUTES.PRODUCTS);
        return;
      }
      await persistDraft();
      toast.success('Produto cadastrado com sucesso');
      navigate(LOGSTOKA_ROUTES.PRODUCTS);
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (step === 0) {
      navigate(LOGSTOKA_ROUTES.PRODUCTS);
      return;
    }
    setStep((s) => s - 1);
    setWarning(null);
  };

  const tryStep = (index: number) => {
    if (index === 0 || index <= completedThrough + 1) {
      if (index > 0 && !form.name.trim()) {
        setWarning('Preencha o nome do produto na etapa Dados básicos');
        setInvalidName(true);
        setStep(0);
        return;
      }
      setStep(index);
      setWarning(null);
    }
  };

  const field = (patch: Partial<UniversalProductFields>) => setForm((f) => ({ ...f, ...patch }));

  const stepContent = useMemo(() => {
    if (step === 0) {
      return (
        <>
          <div className="ls-product-wizard__section-title">
            <span>Dados básicos</span>
            <span className="ls-product-wizard__required-note">(*) Campos obrigatórios</span>
          </div>
          <div className="ls-product-wizard__grid">
            <label className={`ls-product-wizard__field--wide${invalidName ? ' ls-product-wizard__field--invalid' : ''}`}>
              <span className="ls-label">Nome *</span>
              <input
                className="ls-input"
                value={form.name}
                onChange={(e) => {
                  field({ name: e.target.value });
                  if (e.target.value.trim()) setInvalidName(false);
                }}
              />
            </label>
            <label>
              <span className="ls-label-row ls-label">Código (SKU) <Info size={13} className="text-blue-500" /></span>
              <input className="ls-input" value={form.sku} onChange={(e) => field({ sku: e.target.value })} placeholder="Gerado automaticamente se vazio" />
            </label>
            <label>
              <span className="ls-label">EAN / GTIN</span>
              <input className="ls-input" value={form.barcode} onChange={(e) => field({ barcode: e.target.value })} placeholder="Leitura no scanner" />
            </label>
            <label>
              <span className="ls-label">Código interno</span>
              <input className="ls-input" value={form.internal_code} onChange={(e) => field({ internal_code: e.target.value })} placeholder="Referência da empresa" />
            </label>
            <label>
              <span className="ls-label">Categoria</span>
              <select className="ls-input" value={form.category_id} onChange={(e) => field({ category_id: e.target.value })}>
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="ls-label-row ls-label">Unidade <Info size={13} className="text-blue-500" /></span>
              <select className="ls-input" value={form.unit} onChange={(e) => field({ unit: e.target.value })}>
                {PRODUCT_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </label>
          </div>
        </>
      );
    }

    if (step === 1) {
      return (
        <>
          <div className="ls-product-wizard__section-title">
            <span>Estoque e preços</span>
            <span className="ls-product-wizard__required-note">Controle mínimo e valorização</span>
          </div>
          <div className="ls-product-wizard__grid">
            <label><span className="ls-label">Estoque mínimo</span><input className="ls-input" type="number" min={0} value={form.min_stock} onChange={(e) => field({ min_stock: e.target.value })} /></label>
            <label><span className="ls-label">Estoque máximo</span><input className="ls-input" type="number" min={0} value={form.max_stock} onChange={(e) => field({ max_stock: e.target.value })} /></label>
            <label><span className="ls-label">Custo unitário</span><input className="ls-input" type="number" min={0} step="0.01" value={form.cost} onChange={(e) => field({ cost: e.target.value })} /></label>
            <label><span className="ls-label">Preço de venda</span><input className="ls-input" type="number" min={0} step="0.01" value={form.sale_price} onChange={(e) => field({ sale_price: e.target.value })} /></label>
          </div>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <div className="ls-product-wizard__section-title"><span>Logística</span></div>
          <div className="ls-product-wizard__grid">
            <label><span className="ls-label">Marca</span><input className="ls-input" value={form.brand} onChange={(e) => field({ brand: e.target.value })} /></label>
            <label><span className="ls-label">Peso líquido (kg)</span><input className="ls-input" type="number" min={0} step="0.001" value={form.weight_kg} onChange={(e) => field({ weight_kg: e.target.value })} /></label>
            <label><span className="ls-label">Largura (cm)</span><input className="ls-input" type="number" min={0} step="0.1" value={form.width_cm} onChange={(e) => field({ width_cm: e.target.value })} /></label>
            <label><span className="ls-label">Altura (cm)</span><input className="ls-input" type="number" min={0} step="0.1" value={form.height_cm} onChange={(e) => field({ height_cm: e.target.value })} /></label>
            <label><span className="ls-label">Profundidade (cm)</span><input className="ls-input" type="number" min={0} step="0.1" value={form.length_cm} onChange={(e) => field({ length_cm: e.target.value })} /></label>
            <label className="ls-product-wizard__field--wide"><span className="ls-label">Observação interna</span><textarea className="ls-input min-h-[72px]" value={form.description_short} onChange={(e) => field({ description_short: e.target.value })} placeholder="Ex.: fragil, validade, endereço preferencial no CD" /></label>
          </div>
        </>
      );
    }

    if (step === 3) {
      return (
        <>
          <div className="ls-product-wizard__section-title"><span>Imagem principal do produto</span></div>
          <label className="ls-product-wizard__upload">
            <input
              type="file"
              accept={UNIVERSAL_PRODUCT_IMAGE.acceptedMime.join(',')}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }}
            />
            {imagePreview ? (
              <img src={imagePreview} alt="" className="max-h-40 rounded-xl object-contain" />
            ) : (
              <>
                <ImagePlus size={28} className="text-orange-600" />
                <span className="text-sm font-bold text-[#525252]">Arraste arquivos para cá ou anexe</span>
                <span className="text-xs text-[#9ca3af]">{UNIVERSAL_PRODUCT_IMAGE.hint}</span>
              </>
            )}
          </label>
        </>
      );
    }

    if (step === 4) {
      return (
        <>
          <div className="ls-product-wizard__section-title"><span>Dados fiscais</span></div>
          <div className="ls-product-wizard__grid">
            <label><span className="ls-label">NCM</span><input className="ls-input" value={form.ncm} onChange={(e) => field({ ncm: e.target.value })} placeholder="Ex.: 9619.00.00" /></label>
            <label>
              <span className="ls-label">Origem</span>
              <select className="ls-input" value={form.origin_code} onChange={(e) => field({ origin_code: e.target.value })}>
                {PRODUCT_ORIGIN_CODES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-4 text-sm text-[#737373]">
            Com nome, SKU e EAN você já opera entradas, saídas e inventário. Os demais campos enriquecem relatórios e publicação em marketplaces.
          </p>
        </>
      );
    }

    return null;
  }, [step, form, categories, invalidName, imagePreview]);

  return (
    <div className="ls-product-add-page ls-products-page space-y-4">
      <div className="ls-products-page-inset">
        {warning ? (
          <ProductWizardBanner
            variant="warning"
            title="Não foi possível navegar para o passo desejado"
            message={`Verifique os campos destacados abaixo: ${warning}`}
            onClose={() => setWarning(null)}
          />
        ) : null}
        {successBanner ? (
          <ProductWizardBanner
            variant="success"
            title="Produto salvo"
            message="Para permitir a navegação nos próximos passos, salvamos o seu produto."
            onClose={() => setSuccessBanner(false)}
          />
        ) : null}

        <div className="ls-product-wizard">
          <aside className="ls-product-wizard__aside">
            <ProductWizardStepper
              steps={WIZARD_STEPS}
              currentIndex={step}
              completedThrough={completedThrough}
              onStepClick={tryStep}
            />
            <button type="button" className="ls-product-wizard__skip" onClick={() => navigate(LOGSTOKA_ROUTES.PRODUCTS)}>
              Voltar ao catálogo
            </button>
          </aside>

          <div className="ls-product-wizard__main">
            <div className="ls-product-wizard__head">
              <p className="ls-product-wizard__product-name">{displayName}</p>
              <p className="ls-product-wizard__head-hint">Identificação, estoque e fiscal — o essencial para operar no WMS</p>
            </div>
            <div className="ls-product-wizard__body">{stepContent}</div>
            <div className="ls-product-wizard__footer">
              <button type="button" className="ls-btn-secondary" onClick={goBack}>
                {step === 0 ? 'Cancelar' : 'Voltar'}
              </button>
              <button type="button" className="ls-btn-primary" disabled={saving} onClick={() => void goNext()}>
                {saving ? 'Salvando…' : step === WIZARD_STEPS.length - 1 ? 'Concluir cadastro' : 'Avançar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAddWizardPage;
