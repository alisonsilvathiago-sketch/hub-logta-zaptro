import React, { useMemo, useRef, useState } from 'react';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import { Link } from 'react-router-dom';
import { ArrowUpRight, DollarSign, Package, Share2, Edit3, Eye, ImagePlus, Plus, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useProducts } from '@/hooks/useLogstokaData';
import { useCategories } from '@/hooks/useCatalog';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { supabase } from '@/lib/supabase';
import { uploadProductImage } from '@/lib/storage';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { can } from '@/lib/permissions';
import { useAuth } from '@/context/LogstokaAuthProvider';
import Modal from '@/components/ui/Modal';
import ClickableTableRow, { stopRowNavigate } from '@/components/ui/ClickableTableRow';
import ProductThumb from '@/components/products/ProductThumb';
import ProductsKpiStrip from '@/components/products/ProductsKpiStrip';
import { getDemoProductsCatalogKpis, getDemoStockQty } from '@/lib/logstokaDemoSeed';
import {
  emptyUniversalProductForm,
  PRODUCT_ORIGIN_CODES,
  PRODUCT_UNITS,
  UNIVERSAL_PRODUCT_IMAGE,
  type UniversalProductFields,
} from '@/lib/universalProductCatalog';
import {
  PUBLICATION_STATUS_LABELS,
  countPublishedProducts,
  countPublishedStores,
  validateProductForPublication,
} from '@/lib/productPublication';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import type { LsProduct, ProductPublicationStatus } from '@/types';

function productToForm(p: LsProduct): UniversalProductFields {
  return {
    sku: p.sku,
    internal_code: p.internal_code ?? '',
    barcode: p.barcode ?? '',
    name: p.name,
    short_name: p.short_name ?? '',
    brand: p.brand ?? '',
    category_id: p.category_id ?? '',
    ncm: p.ncm ?? '',
    origin_code: p.origin_code ?? '0',
    unit: p.unit,
    description_short: p.description_short ?? '',
    description: p.description ?? '',
    description_html: p.description_html ?? '',
    cost: String(p.cost),
    sale_price: String(p.sale_price),
    promo_price: p.promo_price != null ? String(p.promo_price) : '',
    min_stock: String(p.min_stock),
    max_stock: p.max_stock != null ? String(p.max_stock) : '',
    weight_kg: p.weight_kg != null ? String(p.weight_kg) : '',
    height_cm: p.height_cm != null ? String(p.height_cm) : '',
    width_cm: p.width_cm != null ? String(p.width_cm) : '',
    length_cm: p.length_cm != null ? String(p.length_cm) : '',
    status: p.status,
    publication_status: p.publication_status ?? 'draft',
  };
}

const ProductsPage: React.FC = () => {
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { products, total, loading, limit, reload } = useProducts(page, search);
  const { categories } = useCategories();
  const canWrite = can('products.write', profile?.role);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LsProduct | null>(null);
  const [form, setForm] = useState<UniversalProductFields>(emptyUniversalProductForm());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDemo = isLogstokaDemoCompany(companyId);

  const fmtQty = (n: number) => n.toLocaleString('pt-BR');
  const fmtBrl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  const productKpis = useMemo(() => {
    if (isDemo && companyId) {
      const demo = getDemoProductsCatalogKpis(companyId);
      const published = countPublishedProducts(companyId);
      return [
        {
          label: 'Produtos cadastrados',
          value: fmtQty(demo.totalProducts),
          hint: `${fmtQty(demo.totalStockUnits)} un. em estoque`,
          accent: true,
          icon: Package,
        },
        {
          label: 'Saídas',
          value: fmtQty(demo.totalExits),
          hint: 'unidades vendidas',
          icon: ArrowUpRight,
        },
        {
          label: 'Publicados',
          value: fmtQty(published),
          hint: published === 1 ? 'produto em loja' : 'produtos em lojas',
          icon: Share2,
        },
        {
          label: 'Faturamento',
          value: fmtBrl(demo.revenueFromExits),
          hint: 'receita estimada das saídas',
          icon: DollarSign,
        },
      ];
    }
    const published = companyId ? countPublishedProducts(companyId) : 0;
    return [
      {
        label: 'Produtos cadastrados',
        value: loading ? '…' : fmtQty(total),
        hint: 'no catálogo',
        accent: true,
        icon: Package,
      },
      {
        label: 'Saídas',
        value: '—',
        hint: 'via movimentações',
        icon: ArrowUpRight,
      },
      {
        label: 'Publicados',
        value: fmtQty(published),
        hint: 'em lojas conectadas',
        icon: Share2,
      },
      {
        label: 'Faturamento',
        value: '—',
        hint: 'receita das saídas',
        icon: DollarSign,
      },
    ];
  }, [isDemo, companyId, total, loading]);

  const categoryName = (id?: string | null) => categories.find((c) => c.id === id)?.name ?? '—';

  const openCreate = () => {
    setEditing(null);
    setForm(emptyUniversalProductForm());
    setImageFile(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEdit = (p: LsProduct) => {
    setEditing(p);
    setForm(productToForm(p));
    setImageFile(null);
    setImagePreview(p.main_image_url ?? null);
    setModalOpen(true);
  };

  const handleImagePick = (file: File | undefined) => {
    if (!file) return;
    if (file.size > UNIVERSAL_PRODUCT_IMAGE.maxFileSizeMb * 1024 * 1024) {
      toast.error(`Imagem até ${UNIVERSAL_PRODUCT_IMAGE.maxFileSizeMb} MB`);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const save = async () => {
    if (!companyId || !form.sku || !form.name) {
      toast.error('SKU e nome são obrigatórios');
      return;
    }
    if (!imagePreview && !editing?.main_image_url) {
      toast.error('Foto principal é obrigatória (padrão multicanal)');
      return;
    }
    setSaving(true);
    try {
      if (isDemo) {
        toast.success(
          `[Demo] Produto ${editing ? 'atualizado' : 'criado'} em rascunho — use Publicação para enviar às lojas`,
        );
        setModalOpen(false);
        return;
      }

      let main_image_url = editing?.main_image_url ?? null;
      if (imageFile) main_image_url = await uploadProductImage(companyId, imageFile);

      const payload = {
        company_id: companyId,
        sku: form.sku.trim(),
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

      if (editing) {
        const { error } = await supabase.from('ls_products').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Produto atualizado');
      } else {
        const { error } = await supabase.from('ls_products').insert(payload);
        if (error) throw error;
        toast.success('Produto criado');
      }
      setModalOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const modalFooter = (
    <>
      <button type="button" className="ls-btn-secondary" onClick={() => setModalOpen(false)}>
        Cancelar
      </button>
      <button type="button" className="ls-btn-primary" disabled={saving} onClick={() => void save()}>
        {saving ? 'Salvando…' : 'Salvar produto'}
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={LOGSTOKA_PAGE_TITLE_CLASS}>Produtos</h2>
          <p className="text-sm text-[#a3a3a3]">
            Cadastro em rascunho por padrão — publique depois em{' '}
            <Link to={LOGSTOKA_ROUTES.PRODUCT_PUBLICATION} className="font-semibold text-orange-700 hover:underline">
              Publicação
            </Link>
          </p>
        </div>
        {canWrite && (
          <button type="button" className="ls-btn-primary" onClick={openCreate}>
            <Plus size={16} />
            Novo produto
          </button>
        )}
      </div>

      <ProductsKpiStrip items={productKpis} />

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="ls-input pl-9"
          placeholder="Buscar SKU, nome ou código de barras"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="ls-table-wrap">
        <table className="ls-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th className="ls-hide-mobile">EAN</th>
              <th>Produto</th>
              <th className="ls-hide-mobile">Categoria</th>
              <th>Estoque</th>
              <th>Preço</th>
              <th className="ls-hide-mobile">Publicação</th>
              <th>Lojas</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500">Carregando…</td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500">Nenhum produto cadastrado.</td>
              </tr>
            )}
            {products.map((p) => (
              <ClickableTableRow key={p.id} to={`/app/products/${p.id}`}>
                <td>
                  <span className="ls-product-cell">
                    <ProductThumb src={p.main_image_url} name={p.name} size={28} />
                    <span className="ls-product-cell__sku">{p.sku}</span>
                  </span>
                </td>
                <td className="ls-hide-mobile text-[#a3a3a3]">{p.barcode ?? '—'}</td>
                <td>{p.name}</td>
                <td className="ls-hide-mobile">{categoryName(p.category_id)}</td>
                <td>{isDemo ? getDemoStockQty(p.id) : '—'}</td>
                <td>{Number(p.sale_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="ls-hide-mobile">
                  <span className="ls-badge bg-slate-100 text-slate-700">
                    {PUBLICATION_STATUS_LABELS[p.publication_status ?? 'draft']}
                  </span>
                </td>
                <td className="text-sm font-bold text-[#525252]">
                  {companyId ? countPublishedStores(companyId, p.id) : 0}
                </td>
                <td>
                  <span className={`ls-badge ${p.status === 'active' ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                    {p.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td onClick={stopRowNavigate}>
                  <div className="flex gap-2">
                    <Link to={`/app/products/${p.id}`} className="ls-btn-secondary px-2 py-1">
                      <Eye size={14} />
                    </Link>
                    {canWrite && (
                      <button type="button" className="ls-btn-secondary px-2 py-1" onClick={() => openEdit(p)}>
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </ClickableTableRow>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{total} produtos</span>
        <div className="flex gap-2">
          <button type="button" className="ls-btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <button type="button" className="ls-btn-secondary" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </button>
        </div>
      </div>

      <Modal
        open={modalOpen}
        size="landscape"
        title={editing ? 'Editar produto' : 'Novo produto'}
        subtitle="Salva em rascunho — nada é enviado aos marketplaces até você publicar"
        onClose={() => setModalOpen(false)}
        footer={modalFooter}
      >
        <div className="ls-product-modal">
          <aside className="ls-product-modal__aside">
            <p className="ls-product-modal__aside-label">Mídia & status</p>

            {imagePreview ? (
              <>
                <img src={imagePreview} alt="" className="ls-product-modal__preview" />
                <label className="ls-product-modal__upload mt-3 min-h-[3rem]">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={UNIVERSAL_PRODUCT_IMAGE.acceptedMime.join(',')}
                    onChange={(e) => handleImagePick(e.target.files?.[0])}
                  />
                  <span className="ls-product-modal__upload-title">Trocar imagem</span>
                </label>
              </>
            ) : (
              <label className="ls-product-modal__upload ls-product-modal__upload--required">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={UNIVERSAL_PRODUCT_IMAGE.acceptedMime.join(',')}
                  onChange={(e) => handleImagePick(e.target.files?.[0])}
                />
                <span className="ls-product-modal__upload-icon">
                  <ImagePlus size={22} />
                </span>
                <span className="ls-product-modal__upload-title">Foto principal *</span>
                <span className="ls-product-modal__upload-hint">{UNIVERSAL_PRODUCT_IMAGE.hint}</span>
              </label>
            )}

            <div className="ls-product-modal__aside-meta space-y-3">
              <div>
                <label className="ls-label">Status catálogo</label>
                <select
                  className="ls-input"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              <div>
                <label className="ls-label">Publicação</label>
                <select
                  className="ls-input"
                  value={form.publication_status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, publication_status: e.target.value as ProductPublicationStatus }))
                  }
                >
                  {(Object.keys(PUBLICATION_STATUS_LABELS) as ProductPublicationStatus[]).map((key) => (
                    <option key={key} value={key}>
                      {PUBLICATION_STATUS_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="mt-3 rounded-xl bg-orange-50/80 px-3 py-2 text-xs font-semibold text-orange-900">
              Não publica automaticamente. Use{' '}
              <Link to={LOGSTOKA_ROUTES.PRODUCT_PUBLICATION} className="underline">
                Central de Publicação
              </Link>{' '}
              quando estiver pronto.
            </p>

            {form.sku ? <span className="ls-product-modal__sku-chip">SKU · {form.sku}</span> : null}
          </aside>

          <div className="ls-product-modal__main">
            <section className="ls-product-modal__section">
              <h4 className="ls-product-modal__section-title">Identificação</h4>
              <div className="ls-product-modal__grid ls-product-modal__grid--2">
                <div>
                  <label className="ls-label">SKU mestre *</label>
                  <input className="ls-input" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
                </div>
                <div>
                  <label className="ls-label">Código interno</label>
                  <input className="ls-input" value={form.internal_code} onChange={(e) => setForm((f) => ({ ...f, internal_code: e.target.value }))} />
                </div>
                <div>
                  <label className="ls-label">Código de barras (EAN/GTIN)</label>
                  <input className="ls-input" value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} />
                </div>
                <div>
                  <label className="ls-label">NCM</label>
                  <input className="ls-input" value={form.ncm} onChange={(e) => setForm((f) => ({ ...f, ncm: e.target.value }))} placeholder="Ex.: 96190000" />
                </div>
                <div className="ls-product-modal__span-2">
                  <label className="ls-label">Nome completo *</label>
                  <input className="ls-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="ls-product-modal__span-2">
                  <label className="ls-label">Nome curto (marketplace)</label>
                  <input className="ls-input" value={form.short_name} onChange={(e) => setForm((f) => ({ ...f, short_name: e.target.value }))} />
                </div>
              </div>
            </section>

            <section className="ls-product-modal__section">
              <h4 className="ls-product-modal__section-title">Comercial</h4>
              <div className="ls-product-modal__grid ls-product-modal__grid--3">
                <div>
                  <label className="ls-label">Marca</label>
                  <input className="ls-input" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
                </div>
                <div>
                  <label className="ls-label">Unidade</label>
                  <select className="ls-input" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
                    {PRODUCT_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="ls-label">Origem</label>
                  <select className="ls-input" value={form.origin_code} onChange={(e) => setForm((f) => ({ ...f, origin_code: e.target.value }))}>
                    {PRODUCT_ORIGIN_CODES.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="ls-product-modal__span-2">
                  <label className="ls-label">Categoria</label>
                  <select className="ls-input" value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
                    <option value="">—</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="ls-product-modal__section">
              <h4 className="ls-product-modal__section-title">Preços & estoque</h4>
              <div className="ls-product-modal__grid ls-product-modal__grid--2">
                <div>
                  <label className="ls-label">Custo</label>
                  <input className="ls-input" type="number" min={0} step="0.01" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} />
                </div>
                <div>
                  <label className="ls-label">Preço venda</label>
                  <input className="ls-input" type="number" min={0} step="0.01" value={form.sale_price} onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))} />
                </div>
                <div>
                  <label className="ls-label">Preço promocional</label>
                  <input className="ls-input" type="number" min={0} step="0.01" value={form.promo_price} onChange={(e) => setForm((f) => ({ ...f, promo_price: e.target.value }))} />
                </div>
                <div>
                  <label className="ls-label">Estoque mínimo</label>
                  <input className="ls-input" type="number" min={0} value={form.min_stock} onChange={(e) => setForm((f) => ({ ...f, min_stock: e.target.value }))} />
                </div>
              </div>
            </section>

            <section className="ls-product-modal__section">
              <h4 className="ls-product-modal__section-title">Logística (frete)</h4>
              <div className="ls-product-modal__grid ls-product-modal__grid--2">
                <div>
                  <label className="ls-label">Peso (kg)</label>
                  <input className="ls-input" type="number" min={0} step="0.001" value={form.weight_kg} onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))} />
                </div>
                <div>
                  <label className="ls-label">Altura (cm)</label>
                  <input className="ls-input" type="number" min={0} step="0.1" value={form.height_cm} onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))} />
                </div>
                <div>
                  <label className="ls-label">Largura (cm)</label>
                  <input className="ls-input" type="number" min={0} step="0.1" value={form.width_cm} onChange={(e) => setForm((f) => ({ ...f, width_cm: e.target.value }))} />
                </div>
                <div>
                  <label className="ls-label">Comprimento (cm)</label>
                  <input className="ls-input" type="number" min={0} step="0.1" value={form.length_cm} onChange={(e) => setForm((f) => ({ ...f, length_cm: e.target.value }))} />
                </div>
              </div>
            </section>

            <section className="ls-product-modal__section">
              <h4 className="ls-product-modal__section-title">Descrição</h4>
              <div className="space-y-3">
                <div>
                  <label className="ls-label">Descrição curta</label>
                  <input className="ls-input" value={form.description_short} onChange={(e) => setForm((f) => ({ ...f, description_short: e.target.value }))} />
                </div>
                <div>
                  <label className="ls-label">Descrição completa</label>
                  <textarea
                    className="ls-input min-h-[72px]"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="ls-label">Descrição HTML (canais avançados)</label>
                  <textarea
                    className="ls-input min-h-[56px] font-mono text-xs"
                    value={form.description_html}
                    onChange={(e) => setForm((f) => ({ ...f, description_html: e.target.value }))}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductsPage;
