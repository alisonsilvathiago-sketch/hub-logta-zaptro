import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import ProductThumb from '@/components/products/ProductThumb';
import PublishOverlay, { type PublishOverlayPhase } from '@/components/products/PublishOverlay';
import Modal from '@/components/ui/Modal';
import { useProducts } from '@/hooks/useLogstokaData';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { runPublishFlow, type PublishFlowError } from '@/lib/publishProductFlow';
import {
  DEMO_STORE_GROUPS,
  countPublishedStores,
  getStoreById,
  getStoreGroup,
  PUBLICATION_STATUS_LABELS,
  storesGroupedByMarketplace,
  validateProductForPublication,
} from '@/lib/productPublication';
import { MARKETPLACE_LABELS, type LsProduct, type ProductPublicationStatus } from '@/types';

const ProductPublicationPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const { products, loading } = useProducts(1, '', 100);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | ProductPublicationStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [storeSelection, setStoreSelection] = useState<Set<string>>(new Set());
  const [overlayPhase, setOverlayPhase] = useState<PublishOverlayPhase | null>(null);
  const [publishError, setPublishError] = useState<PublishFlowError | null>(null);

  const closeOverlay = useCallback(() => {
    setOverlayPhase(null);
    setPublishError(null);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return products;
    return products.filter((p) => (p.publication_status ?? 'draft') === filter);
  }, [products, filter]);

  const selectedProducts = useMemo(
    () =>
      [...selected]
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is LsProduct => Boolean(p)),
    [selected, products],
  );

  const toggleProduct = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleStore = (storeId: string) => {
    setStoreSelection((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  };

  const applyGroup = (groupId: string) => {
    const group = getStoreGroup(groupId);
    if (!group) return;
    setStoreSelection((prev) => {
      const next = new Set(prev);
      group.storeIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const openPublishModal = () => {
    if (selected.size === 0) {
      toast.error('Selecione ao menos um produto');
      return;
    }
    const invalid = [...selected]
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is LsProduct => Boolean(p))
      .filter((p) => !validateProductForPublication(p).ok);
    if (invalid.length > 0) {
      toast.error(`${invalid.length} produto(s) incompleto(s) — corrija antes de publicar`);
      return;
    }
    setStoreSelection(new Set());
    setModalOpen(true);
  };

  const confirmPublish = async () => {
    if (!companyId || storeSelection.size === 0) {
      toast.error('Selecione ao menos uma loja');
      return;
    }

    const productIds = [...selected];
    const storeIds = [...storeSelection];

    setModalOpen(false);
    setOverlayPhase('loading');
    setPublishError(null);

    const result = await runPublishFlow(companyId, productIds, storeIds, products);

    if (result.ok) {
      setOverlayPhase('success');
      setSelected(new Set());
      setStoreSelection(new Set());
    } else {
      setPublishError(result.error);
      setOverlayPhase('error');
    }
  };

  const storeGroups = storesGroupedByMarketplace();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={LOGSTOKA_PAGE_TITLE_CLASS}>Central de Publicação</h2>
          <p className="text-sm text-[#a3a3a3]">
            Cadastre em rascunho · valide · escolha a loja exata · publique só onde quiser
          </p>
        </div>
        <button type="button" className="ls-btn-primary" onClick={openPublishModal}>
          Publicar selecionados
        </button>
      </div>

      <div className="ls-hub-panel flex flex-wrap gap-2 text-sm">
        <span className="font-bold text-[#525252]">1.</span>
        <Link to="/app/configuracoes/integracoes" className="font-semibold text-orange-700 hover:underline">
          Conectar integrações
        </Link>
        <span className="text-[#a3a3a3]">→</span>
        <Link to="/app/products/grupos" className="font-semibold text-orange-700 hover:underline">
          Grupos de lojas
        </Link>
        <span className="text-[#a3a3a3]">→</span>
        <span className="font-semibold text-[#525252]">Cadastro (rascunho)</span>
        <span className="text-[#a3a3a3]">→</span>
        <span className="font-semibold text-orange-700">Publicação aqui</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'draft', 'ready', 'published'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
              filter === f ? 'bg-orange-600 text-white' : 'bg-gray-50 ring-1 ring-slate-200 text-[#525252]'
            }`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todos' : PUBLICATION_STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="ls-table-wrap">
        <table className="ls-table">
          <thead>
            <tr>
              <th />
              <th>SKU</th>
              <th>Produto</th>
              <th>Status</th>
              <th>Validação</th>
              <th>Lojas publicadas</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">Carregando…</td>
              </tr>
            )}
            {!loading &&
              filtered.map((p) => {
                const validation = validateProductForPublication(p);
                const pubCount = companyId ? countPublishedStores(companyId, p.id) : 0;
                const status = p.publication_status ?? 'draft';
                return (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        disabled={!validation.ok}
                        title={validation.ok ? 'Selecionar' : validation.errors.join(', ')}
                      />
                    </td>
                    <td>
                      <span className="ls-product-cell">
                        <ProductThumb src={p.main_image_url} name={p.name} size={28} />
                        <span className="ls-product-cell__sku">{p.sku}</span>
                      </span>
                    </td>
                    <td>{p.name}</td>
                    <td>
                      <span className="ls-badge bg-slate-100 text-slate-700">
                        {PUBLICATION_STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td>
                      {validation.ok ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                          <CheckCircle2 size={14} /> Pronto
                        </span>
                      ) : (
                        <ul className="text-xs font-medium text-rose-600">
                          {validation.errors.slice(0, 2).map((e) => (
                            <li key={e}>❌ {e}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="text-sm font-bold text-[#525252]">{pubCount || '—'}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        size="landscape"
        title="Publicar em lojas"
        subtitle="Escolha as páginas/contas exatas — não envia para todo o marketplace"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <span className="mr-auto hidden text-xs font-semibold text-[#a3a3a3] sm:inline">
              {storeSelection.size > 0
                ? `${selected.size} produto(s) → ${storeSelection.size} loja(s) selecionada(s)`
                : 'Nenhuma loja selecionada'}
            </span>
            <button type="button" className="ls-btn-secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="button" className="ls-btn-primary" onClick={() => void confirmPublish()}>
              Confirmar publicação
            </button>
          </>
        }
      >
        <div className="ls-publish-modal">
          <aside className="ls-publish-modal__aside">
            <p className="ls-publish-modal__aside-label">Produtos a publicar</p>
            <div className="ls-publish-modal__products">
              {selectedProducts.map((p) => (
                <div key={p.id} className="ls-publish-modal__product-ref">
                  <ProductThumb src={p.main_image_url} name={p.name} size={40} />
                  <div className="ls-publish-modal__product-ref-body">
                    <p className="ls-publish-modal__product-sku">{p.sku}</p>
                    <p className="ls-publish-modal__product-name" title={p.name}>
                      {p.name}
                    </p>
                    <p className="ls-publish-modal__product-meta">
                      {p.barcode ? `EAN ${p.barcode}` : 'Sem EAN'}
                      {p.internal_code ? ` · ${p.internal_code}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="ls-publish-modal__aside-count">
              {selectedProducts.length} produto(s) · {storeSelection.size} loja(s) marcada(s)
            </p>

            <p className="ls-publish-modal__aside-label mt-5">Grupos rápidos</p>
            <div className="ls-publish-modal__groups">
              {DEMO_STORE_GROUPS.map((g) => (
                <button key={g.id} type="button" className="ls-publish-modal__group-btn" onClick={() => applyGroup(g.id)}>
                  <Layers size={14} className="shrink-0 text-orange-600" />
                  {g.name}
                </button>
              ))}
            </div>
          </aside>

          <div className="ls-publish-modal__main">
            <p className="ls-publish-modal__aside-label mb-3">Lojas por marketplace</p>
            <div className="ls-publish-modal__grid">
              {Object.entries(storeGroups).map(([mp, stores]) => (
                <div key={mp} className="ls-publish-modal__mp-block">
                  <p className="ls-publish-modal__mp-head">
                    <MarketplaceLogo marketplace={stores[0].marketplace} size={18} />
                    {MARKETPLACE_LABELS[stores[0].marketplace]}
                  </p>
                  <div className="ls-publish-modal__store-list">
                    {stores.map((store) => {
                      const checked = storeSelection.has(store.id);
                      return (
                        <label
                          key={store.id}
                          className={`ls-publish-modal__store${checked ? ' ls-publish-modal__store--selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            className="shrink-0"
                            checked={checked}
                            onChange={() => toggleStore(store.id)}
                          />
                          <img src={store.logoUrl} alt="" className="ls-publish-modal__store-avatar" />
                          <span className="ls-publish-modal__store-name">{store.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {storeSelection.size > 0 && (
              <p className="ls-publish-modal__selection-bar">
                {[...storeSelection].map((id) => getStoreById(id)?.name).filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
      </Modal>

      {overlayPhase && (
        <PublishOverlay
          phase={overlayPhase}
          error={publishError}
          onComplete={closeOverlay}
        />
      )}
    </div>
  );
};

export default ProductPublicationPage;
