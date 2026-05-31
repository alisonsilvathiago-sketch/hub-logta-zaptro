import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Hand, Package, RotateCcw, Share2, Store, Sparkles, AlertTriangle, CheckCircle, RefreshCw, Zap, Scan } from 'lucide-react';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { supabase } from '@/lib/supabase';
import { logstokaApi } from '@/lib/logstokaApi';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { useMarketplaceModule } from '@/hooks/useMarketplaceModule';
import LogstokaShareModal from '@/components/sharing/LogstokaShareModal';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';
import {
  getAllConnectedStores,
  getProductStorePublications,
  isPublishedOnStore,
  PUBLICATION_STATUS_LABELS,
  storesGroupedByMarketplace,
} from '@/lib/productPublication';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import {
  getDemoCategoryName,
  getDemoProductById,
  getDemoProductMovementStats,
  getDemoProductStockStats,
  getDemoProductTimeline,
  marketplaceLabel,
  movementTypeLabel,
} from '@/lib/logstokaDemoSeed';
import type { LsProduct, LsStockMovement, Marketplace, MovementType } from '@/types';
import { MARKETPLACE_LABELS } from '@/types';
import './productDetail.css';

const fmtBrl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtQty = (value: number) => value.toLocaleString('pt-BR');

function movementQtyClass(type: MovementType | string): string {
  if (type === 'exit' || type === 'damage') return 'ls-product-detail-timeline-item__qty--exit';
  if (type === 'entry') return 'ls-product-detail-timeline-item__qty--entry';
  if (type === 'return') return 'ls-product-detail-timeline-item__qty--return';
  return '';
}

function movementSign(type: MovementType | string): string {
  if (type === 'exit' || type === 'damage') return '−';
  if (type === 'entry') return '+';
  return '';
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { companyId } = useLogstokaTenant();
  const { isActive: marketplaceActive } = useMarketplaceModule();
  const navigate = useNavigate();
  const [product, setProduct] = useState<LsProduct | null>(null);
  const [timeline, setTimeline] = useState<LsStockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const isDemo = companyId ? isLogstokaDemoCompany(companyId) : false;

  // ESTADOS CONFERÊNCIA IA E COMPARTILHAMENTO SEGURO
  const [checkingStock, setCheckingStock] = useState(false);
  const [checkingStep, setCheckingStep] = useState(0);
  const [scanPercent, setScanPercent] = useState(0);
  const [checkResult, setCheckResult] = useState<'success' | 'warning' | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const triggerIaScanner = (targetResult: 'success' | 'warning') => {
    setCheckingStock(true);
    setScanPercent(0);
    setCheckingStep(0);
    setCheckResult(null);
    
    // Dynamic 0% to 100% counter over 3.2 seconds
    const duration = 3200;
    const intervalTime = 40;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = window.setInterval(() => {
      currentStep++;
      const percent = Math.min(100, Math.round((currentStep / steps) * 100));
      setScanPercent(percent);

      if (percent >= 75) setCheckingStep(3);
      else if (percent >= 50) setCheckingStep(2);
      else if (percent >= 25) setCheckingStep(1);

      if (percent === 100) {
        window.clearInterval(timer);
        window.setTimeout(() => {
          setCheckingStock(false);
          setCheckResult(targetResult);
        }, 300);
      }
    }, intervalTime);
  };

  useEffect(() => {
    if (!id || !companyId) return;

    if (isLogstokaDemoCompany(companyId)) {
      const p = getDemoProductById(id);
      setProduct(p);
      setTimeline(p ? getDemoProductTimeline(id) : []);
      setLoading(false);
      return;
    }

    setLoading(true);
    void supabase
      .from('ls_products')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()
      .then((res) => setProduct(res.data as LsProduct));

    void logstokaApi
      .getProductTimeline(id)
      .then((res) => setTimeline((res.data ?? []) as LsStockMovement[]))
      .catch(() => setTimeline([]))
      .finally(() => setLoading(false));
  }, [id, companyId]);

  const stockStats = useMemo(() => {
    if (!product || !isDemo) return { total: 0, reserved: 0, available: 0, rows: [] };
    return getDemoProductStockStats(product.id);
  }, [product, isDemo]);

  const movementStats = useMemo(() => {
    if (!product || !isDemo) {
      const sumType = (type: MovementType) =>
        timeline.filter((m) => m.movement_type === type).reduce((sum, m) => sum + m.total_quantity, 0);
      return {
        entries: sumType('entry'),
        exits: sumType('exit'),
        returns: sumType('return'),
        transfers: sumType('transfer'),
        damage: sumType('damage'),
      };
    }
    return getDemoProductMovementStats(product.id);
  }, [product, isDemo, timeline]);

  const marginPct = useMemo(() => {
    if (!product || product.sale_price <= 0) return 0;
    return Math.round(((product.sale_price - product.cost) / product.sale_price) * 100);
  }, [product]);

  const lowStock = product ? stockStats.total <= product.min_stock : false;
  const runSingleIaScanner = () => {
    const isWarning = product?.min_stock && stockStats.total < product.min_stock;
    triggerIaScanner(isWarning ? 'warning' : 'success');
  };
  const pubStatus = product?.publication_status ?? 'draft';
  const storesByMp = storesGroupedByMarketplace();
  const publishedCount = companyId && product
    ? getProductStorePublications(companyId, product.id).filter((p) => p.status === 'published').length
    : 0;
  const totalStores = getAllConnectedStores().length;
  const createdLabel = product?.created_at
    ? new Date(product.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const updatedLabel = product?.updated_at
    ? new Date(product.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  if (loading || !product) {
    return (
      <LogstokaDetailPageLayout backTo={LOGSTOKA_ROUTES.PRODUCTS} title="Produto" subtitle={loading ? 'Carregando…' : 'Não encontrado'}>
        {!loading && <div className="ls-card text-sm text-slate-500">Produto não encontrado.</div>}
      </LogstokaDetailPageLayout>
    );
  }

  return (
    <LogstokaDetailPageLayout
      backTo={LOGSTOKA_ROUTES.PRODUCTS}
      backLabel="Voltar para produtos"
      hideTitleRow
      topRightActions={
        <div className="flex gap-2 shrink-0">
          <LogstokaIconTooltip label="🔍 Raio-X do Produto (Scanner IA)">
            <button
              type="button"
              disabled={checkingStock}
              onClick={runSingleIaScanner}
              className={`lsdash-icon-btn active xray-btn ${checkingStock ? 'opacity-50' : ''}`}
            >
              <Scan size={18} className={checkingStock ? 'animate-pulse' : ''} />
            </button>
          </LogstokaIconTooltip>

          <LogstokaIconTooltip label="Compartilhamento Seguro (Drive-Style)">
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="lsdash-icon-btn"
            >
              <Share2 size={18} />
            </button>
          </LogstokaIconTooltip>

          {marketplaceActive ? (
            <LogstokaIconTooltip label="Publicar nos marketplaces">
              <Link
                to={LOGSTOKA_ROUTES.PRODUCT_PUBLICATION}
                className="lsdash-icon-btn active"
              >
                <Store size={18} />
              </Link>
            </LogstokaIconTooltip>
          ) : (
            <LogstokaIconTooltip label="Ativar Marketplace">
              <Link
                to={LOGSTOKA_ROUTES.MARKETPLACE_HUB}
                className="lsdash-icon-btn"
              >
                <Store size={18} />
              </Link>
            </LogstokaIconTooltip>
          )}
        </div>
      }
    >
      <div className="ls-product-detail space-y-6">
        {/* Hero */}
        <section className="bg-white border border-slate-200/60 p-6 md:p-8 rounded-[28px] shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
            {/* Left: Product Image & Center: Info */}
            <div className="flex flex-col sm:flex-row gap-5 items-start flex-1 w-full">
              {product.main_image_url ? (
                <img src={product.main_image_url} alt="" className="w-24 h-24 object-cover border border-slate-200 rounded-[20px] shadow-sm bg-white p-1 shrink-0" />
              ) : (
                <div className="w-24 h-24 bg-slate-50 border border-slate-200/50 rounded-[20px] flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">Sem foto</div>
              )}
              
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-black uppercase tracking-wider text-orange-600">
                  {marketplaceActive ? 'Cadastro manual + marketplace' : 'Cadastro manual · estoque WMS'}
                </p>
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{product.name}</h1>
                
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 bg-slate-100 rounded-lg text-slate-600 border border-slate-200/10">SKU {product.sku}</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 bg-slate-100 rounded-lg text-slate-600 border border-slate-200/10">{getDemoCategoryName(product.category_id)}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-orange-100/30 ${
                    pubStatus === 'published' ? 'bg-orange-50 text-orange-700' : pubStatus === 'ready' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>{PUBLICATION_STATUS_LABELS[pubStatus]}</span>
                  {lowStock && <span className="text-[10px] font-bold px-2.5 py-0.5 bg-red-50 border border-red-100 text-red-700 rounded-lg">Estoque baixo</span>}
                </div>

                {product.description_short && (
                  <p className="text-xs font-semibold text-slate-500 max-w-xl leading-relaxed pt-1">{product.description_short}</p>
                )}
              </div>
            </div>

            {/* Right: Actions aligned neatly */}
            <div className="flex flex-col gap-3 items-end self-stretch sm:self-auto min-w-[220px] w-full sm:w-auto">
              {marketplaceActive ? (
                <div className="bg-slate-50 border border-slate-200/30 p-3.5 rounded-2xl w-full text-right flex flex-col items-end gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Publicado em</span>
                  <p className="text-2xl font-black text-orange-600 leading-none">
                    {publishedCount}
                    <span className="text-sm font-bold text-slate-400">/{totalStores}</span>
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">lojas conectadas</p>
                  <LogstokaIconTooltip label="Publicar nos marketplaces">
                    <Link to={LOGSTOKA_ROUTES.PRODUCT_PUBLICATION} className="lsdash-icon-btn active mt-2">
                      <Share2 size={18} />
                    </Link>
                  </LogstokaIconTooltip>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/30 p-3.5 rounded-2xl w-full text-right flex flex-col items-end gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Modo estoque</span>
                  <p className="text-xs font-black text-slate-700 mt-0.5">Cadastro manual ativo</p>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">Publique quando conectar lojas</p>
                  <LogstokaIconTooltip label="Ativar Marketplace">
                    <Link to={LOGSTOKA_ROUTES.MARKETPLACE_HUB} className="lsdash-icon-btn mt-2">
                      <Store size={18} />
                    </Link>
                  </LogstokaIconTooltip>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200/30 p-3.5 rounded-2xl w-full text-right flex flex-col items-end gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Segurança WMS</span>
                <p className="text-xs font-black text-slate-700 mt-0.5">Compartilhamento Drive</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">Gere links criptografados</p>
                <LogstokaIconTooltip label="Compartilhamento Seguro (Drive-Style)">
                  <button
                    type="button"
                    onClick={() => setShareModalOpen(true)}
                    className="lsdash-icon-btn active mt-2"
                    style={{ color: '#ea580c', borderColor: 'rgba(234, 88, 12, 0.25)', background: 'rgba(234, 88, 12, 0.12)' }}
                  >
                    <Share2 size={18} />
                  </button>
                </LogstokaIconTooltip>
              </div>
            </div>
          </div>

          {/* Bottom Full-Width WMS Control Bar */}
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-200/50 p-5 rounded-[22px] flex flex-col lg:flex-row items-center justify-between gap-5 relative overflow-hidden shadow-sm">
            {/* Efeito de Scanner Laser "Pra lá e pra cá" */}
            {checkingStock && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                <div className="h-full w-0.5 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 shadow-[0_0_15px_#ea580c]" style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  animationName: 'scan-laser',
                  animationDuration: '1.5s',
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'ease-in-out'
                }} />
              </div>
            )}

            <div className="flex items-center gap-4 relative z-10 w-full lg:w-auto">
              <div className="h-10 w-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-600/10">
                <Sparkles size={18} />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-wider text-orange-600">Estoque Geral Mestre</p>
                <p className="text-2xl font-black text-slate-800 flex items-baseline gap-1.5 leading-none mt-1">
                  {fmtQty(stockStats.total)} <span className="text-xs font-bold text-slate-500">unidades totais</span>
                </p>
              </div>
            </div>

            {/* Middle part: Scanning status */}
            <div className="flex-1 max-w-xl w-full relative z-10">
              {checkingStock && (
                <div className="flex items-center gap-2 text-xs font-bold text-orange-600 animate-pulse bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/50">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>
                    {checkingStep === 0 && 'Conectando ao terminal de segurança WMS...'}
                    {checkingStep === 1 && 'Sincronizando Mercado Livre API (Callbacks e OAuth)...'}
                    {checkingStep === 2 && 'Sincronizando Shopee e Amazon MWS APIs...'}
                    {checkingStep === 3 && 'Cruzando dados locais (.xlsx) e IA conciliação...'}
                  </span>
                </div>
              )}

              {!checkingStock && checkResult === 'success' && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100/40 rounded-xl flex items-start gap-2 text-xs text-emerald-800 animate-fade-in">
                  <CheckCircle size={14} className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-extrabold block text-left">Sincronização OK</span>
                    <span className="text-[10px] font-semibold text-emerald-600/90 leading-tight block text-left">
                      WMS e 9 lojas parceiras estão 100% conciliados com o estoque master ({stockStats.total} un).
                    </span>
                  </div>
                </div>
              )}

              {!checkingStock && checkResult === 'warning' && (
                <div className="p-2.5 bg-red-50 border border-red-100/40 rounded-xl flex items-start gap-2 text-xs text-red-800 animate-fade-in">
                  <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-extrabold block text-left">Divergência de estoque detectada!</span>
                    <span className="text-[10px] font-semibold text-red-500/90 leading-tight block text-left">
                      Cadastro master acusa {fmtQty(stockStats.total)} un., mas API do Mercado Livre registra 820. Planilha registra 850.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right part: AI status indicator */}
            <div className="flex items-center gap-2 relative z-10 shrink-0 ml-auto text-[10px] font-black uppercase tracking-wider text-slate-400">
              <Sparkles size={12} className="text-orange-500 shrink-0" />
              IA Conciliação Ativa
            </div>
          </div>
        </section>

        <section className="ls-product-detail-panel ls-product-detail-origin">
          <h3 className="ls-product-detail-panel__title">Origem e vínculos</h3>
          <div className="ls-product-detail-origin-grid">
            <div className="ls-product-detail-origin-card">
              <span className="ls-product-detail-origin-card__icon" aria-hidden>
                <Hand size={18} />
              </span>
              <div>
                <p className="ls-product-detail-origin-card__label">Cadastro manual</p>
                <p className="ls-product-detail-origin-card__value">Criado em {createdLabel}</p>
                <p className="ls-product-detail-origin-card__hint">Última edição {updatedLabel} · SKU mestre no WMS</p>
              </div>
            </div>
            <div className={`ls-product-detail-origin-card${marketplaceActive ? '' : ' ls-product-detail-origin-card--muted'}`}>
              <span className="ls-product-detail-origin-card__icon" aria-hidden>
                <Store size={18} />
              </span>
              <div>
                <p className="ls-product-detail-origin-card__label">Marketplaces</p>
                {marketplaceActive ? (
                  <>
                    <p className="ls-product-detail-origin-card__value">
                      {publishedCount > 0
                        ? `${publishedCount} loja(s) com anúncio ativo`
                        : 'Pronto para publicar nas lojas conectadas'}
                    </p>
                    <p className="ls-product-detail-origin-card__hint">
                      {publishedCount > 0
                        ? 'Estoque sincronizado com canais publicados'
                        : 'Use Publicar para enviar este SKU aos marketplaces'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="ls-product-detail-origin-card__value">Módulo marketplace desativado</p>
                    <p className="ls-product-detail-origin-card__hint">
                      Ative em{' '}
                      <Link to={LOGSTOKA_ROUTES.MARKETPLACE_HUB} className="font-bold text-orange-700 hover:underline">
                        Marketplace
                      </Link>{' '}
                      para vincular lojas
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* KPIs de estoque */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className={`ls-product-detail-kpi ${lowStock ? 'ls-product-detail-kpi--danger' : ''}`}>
            <p className="ls-product-detail-kpi__label">Em estoque</p>
            <p className="ls-product-detail-kpi__value ls-product-detail-kpi__value--primary">{fmtQty(stockStats.total)}</p>
            <p className="ls-product-detail-kpi__hint">unidades totais</p>
          </div>
          <div className="ls-product-detail-kpi">
            <p className="ls-product-detail-kpi__label">Disponível</p>
            <p className="ls-product-detail-kpi__value">{fmtQty(stockStats.available)}</p>
            <p className="ls-product-detail-kpi__hint">livre para venda</p>
          </div>
          <div className="ls-product-detail-kpi">
            <p className="ls-product-detail-kpi__label">Reservado</p>
            <p className="ls-product-detail-kpi__value">{fmtQty(stockStats.reserved)}</p>
            <p className="ls-product-detail-kpi__hint">pedidos em aberto</p>
          </div>
          <div className="ls-product-detail-kpi">
            <p className="ls-product-detail-kpi__label">Saídas</p>
            <p className="ls-product-detail-kpi__value ls-product-detail-kpi__value--danger">{fmtQty(movementStats.exits)}</p>
            <p className="ls-product-detail-kpi__hint">vendas e expedições</p>
          </div>
          <div className="ls-product-detail-kpi ls-product-detail-kpi--alert">
            <p className="ls-product-detail-kpi__label">Devoluções</p>
            <p className="ls-product-detail-kpi__value ls-product-detail-kpi__value--primary">{fmtQty(movementStats.returns)}</p>
            <p className="ls-product-detail-kpi__hint">retornos de clientes</p>
          </div>
          <div className={`ls-product-detail-kpi ${lowStock ? 'ls-product-detail-kpi--danger' : ''}`}>
            <p className="ls-product-detail-kpi__label">Estoque mínimo</p>
            <p className="ls-product-detail-kpi__value">{fmtQty(product.min_stock)}</p>
            <p className="ls-product-detail-kpi__hint">
              {lowStock ? `Faltam ${fmtQty(product.min_stock - stockStats.total)} un.` : 'dentro do limite'}
            </p>
          </div>
        </div>

        {/* Preços */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="ls-product-detail-price">
            <p className="ls-product-detail-price__label">Custo</p>
            <p className="ls-product-detail-price__value ls-product-detail-price__value--cost">{fmtBrl(product.cost)}</p>
            <p className="ls-product-detail-price__sub">valor de compra</p>
          </div>
          <div className="ls-product-detail-price">
            <p className="ls-product-detail-price__label">Preço de venda</p>
            <p className="ls-product-detail-price__value ls-product-detail-price__value--sale">{fmtBrl(product.sale_price)}</p>
            <p className="ls-product-detail-price__sub">cadastrado no LogStoka</p>
          </div>
          {product.promo_price != null && product.promo_price > 0 && (
            <div className="ls-product-detail-price">
              <p className="ls-product-detail-price__label">Preço promocional</p>
              <p className="ls-product-detail-price__value ls-product-detail-price__value--sale">{fmtBrl(product.promo_price)}</p>
              <p className="ls-product-detail-price__sub">quando aplicável</p>
            </div>
          )}
          <div className="ls-product-detail-price">
            <p className="ls-product-detail-price__label">Margem</p>
            <p className="ls-product-detail-price__value">{marginPct}%</p>
            <p className="ls-product-detail-price__sub">{fmtBrl(product.sale_price - product.cost)} por unidade</p>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {/* Publicação por loja */}
            {marketplaceActive ? (
            <section className="ls-product-detail-panel">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="ls-product-detail-panel__title !mb-0">Onde este produto está publicado</h3>
                {publishedCount === 0 ? (
                  <Link to={LOGSTOKA_ROUTES.PRODUCT_PUBLICATION} className="text-xs font-bold text-orange-700 hover:underline">
                    Ir para Central de Publicação →
                  </Link>
                ) : null}
              </div>
              <div className="space-y-5">
                {(Object.entries(storesByMp) as [Marketplace, typeof storesByMp[string]][]).map(([mp, stores]) => (
                  <div key={mp} className="ls-product-detail-pub-mp">
                    <div className="ls-product-detail-pub-mp__head">
                      <MarketplaceLogo marketplace={mp} size={22} />
                      {MARKETPLACE_LABELS[mp]}
                      <span className="font-semibold normal-case tracking-normal text-[#a3a3a3]">
                        · {stores.filter((s) => companyId && product && isPublishedOnStore(companyId, product.id, s.id)).length}/{stores.length} lojas
                      </span>
                    </div>
                    <div className="ls-product-detail-pub-grid">
                      {stores.map((store) => {
                        const live = companyId ? isPublishedOnStore(companyId, product.id, store.id) : false;
                        const pub = companyId
                          ? getProductStorePublications(companyId, product.id).find((p) => p.storeId === store.id)
                          : undefined;
                        return (
                          <div
                            key={store.id}
                            className={`ls-product-detail-pub-card${live ? ' ls-product-detail-pub-card--live' : ''}`}
                          >
                            <div className="ls-product-detail-pub-card__store">
                              <img src={store.logoUrl} alt="" className="ls-product-detail-pub-card__avatar" />
                              <div className="min-w-0">
                                <p className="ls-product-detail-pub-card__name">{store.name}</p>
                                {pub?.listingId && (
                                  <p className="text-[10px] font-semibold text-[#a3a3a3]">Anúncio {pub.listingId}</p>
                                )}
                              </div>
                            </div>
                            <span
                              className={`ls-product-detail-pub-card__status ${
                                live ? 'ls-product-detail-pub-card__status--live' : 'ls-product-detail-pub-card__status--off'
                              }`}
                            >
                              {live ? 'Publicado ✓' : 'Não publicado'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            ) : (
              <section className="ls-product-detail-panel">
                <h3 className="ls-product-detail-panel__title">Catálogo WMS</h3>
                <p className="text-sm font-medium leading-relaxed text-[#525252]">
                  Este produto está cadastrado manualmente no estoque. Movimentações, inventário e expedição usam o SKU{' '}
                  <strong>{product.sku}</strong>. Para publicar em Shopee, Mercado Livre e outros canais, ative o módulo
                  Marketplace e use a Central de Publicação.
                </p>
                <Link to={LOGSTOKA_ROUTES.MARKETPLACE_HUB} className="mt-4 inline-flex text-xs font-bold text-orange-700 hover:underline">
                  Configurar marketplaces →
                </Link>
              </section>
            )}

            {/* Linha do tempo */}
            <section className="ls-product-detail-panel">
              <h3 className="ls-product-detail-panel__title">Movimentações recentes</h3>
              <div className="space-y-3">
                {timeline.length === 0 && (
                  <p className="text-sm font-medium text-[#a3a3a3]">Sem movimentações registradas.</p>
                )}
                {timeline.map((m) => (
                  <div key={m.id} className="ls-product-detail-timeline-item">
                    <div>
                      <p className="ls-product-detail-timeline-item__type">
                        {movementTypeLabel(m.movement_type)} · {m.sub_type}
                      </p>
                      <p className="ls-product-detail-timeline-item__meta">
                        {marketplaceLabel(m.marketplace)}
                        {m.reference_code ? ` · Ref ${m.reference_code}` : ''}
                        {' · '}
                        {new Date(m.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <p className={`ls-product-detail-timeline-item__qty ${movementQtyClass(m.movement_type)}`}>
                      {movementSign(m.movement_type)}
                      {fmtQty(m.total_quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Coluna lateral */}
          <div className="space-y-6">
            {/* Estoque por armazém */}
            {isDemo && stockStats.rows.length > 0 && (
              <section className="ls-product-detail-panel">
                <h3 className="ls-product-detail-panel__title">Estoque por armazém</h3>
                {stockStats.rows.map((row) => (
                  <div key={row.id} className="ls-product-detail-wh-row">
                    <div>
                      <p className="ls-product-detail-wh-row__name">{row.ls_warehouses?.name ?? 'Armazém'}</p>
                      {row.reserved_quantity > 0 && (
                        <p className="text-[11px] font-semibold text-[#a3a3a3]">
                          {fmtQty(row.reserved_quantity)} reservadas
                        </p>
                      )}
                    </div>
                    <p className="ls-product-detail-wh-row__qty">{fmtQty(row.quantity)}</p>
                  </div>
                ))}
              </section>
            )}

            {/* Resumo movimentação */}
            <section className="ls-product-detail-panel">
              <h3 className="ls-product-detail-panel__title">Resumo de movimentação</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <ArrowDownLeft size={16} /> Entradas
                  </span>
                  <span className="text-lg font-black text-emerald-700">{fmtQty(movementStats.entries)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-red-800">
                    <ArrowUpRight size={16} /> Saídas
                  </span>
                  <span className="text-lg font-black text-red-700">{fmtQty(movementStats.exits)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-orange-800">
                    <RotateCcw size={16} /> Devoluções
                  </span>
                  <span className="text-lg font-black text-orange-700">{fmtQty(movementStats.returns)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Package size={16} /> Transferências
                  </span>
                  <span className="text-lg font-black text-slate-800">{fmtQty(movementStats.transfers)}</span>
                </div>
              </div>
            </section>

            {/* Dados do produto */}
            <section className="ls-product-detail-panel">
              <h3 className="ls-product-detail-panel__title">Dados fiscais e logística</h3>
              <dl>
                <div className="ls-product-detail-spec-row">
                  <dt>EAN / GTIN</dt>
                  <dd>{product.barcode || '—'}</dd>
                </div>
                <div className="ls-product-detail-spec-row">
                  <dt>NCM</dt>
                  <dd>{product.ncm || '—'}</dd>
                </div>
                <div className="ls-product-detail-spec-row">
                  <dt>Peso</dt>
                  <dd>{product.weight_kg ? `${product.weight_kg} kg` : '—'}</dd>
                </div>
                <div className="ls-product-detail-spec-row">
                  <dt>Dimensões</dt>
                  <dd>
                    {product.height_cm && product.width_cm && product.length_cm
                      ? `${product.length_cm} × ${product.width_cm} × ${product.height_cm} cm`
                      : '—'}
                  </dd>
                </div>
                <div className="ls-product-detail-spec-row">
                  <dt>Unidade</dt>
                  <dd>{product.unit}</dd>
                </div>
                <div className="ls-product-detail-spec-row">
                  <dt>Código interno</dt>
                  <dd>{product.internal_code || '—'}</dd>
                </div>
              </dl>
            </section>

            {product.description && (
              <section className="ls-product-detail-panel">
                <h3 className="ls-product-detail-panel__title">Descrição</h3>
                <p className="text-sm font-medium leading-relaxed text-[#525252]">{product.description}</p>
              </section>
            )}
          </div>
        </div>
      </div>

      <LogstokaShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        resourceType="product"
        resourceId={product.id}
        resourceName={product.name}
        snapshotData={{
          id: product.id,
          sku: product.sku,
          name: product.name,
          cost: product.cost,
          sale_price: product.sale_price,
          promo_price: product.promo_price,
          min_stock: product.min_stock,
          unit: product.unit,
          publication_status: product.publication_status,
          main_image_url: product.main_image_url,
          stockTotal: stockStats.total,
          stockAvailable: stockStats.available,
          stockReserved: stockStats.reserved,
          divergencesFound: checkResult === 'warning'
        }}
      />

      {/* Pop-up Gigante / Overlay do Scanner de IA (Frosted White Glass Centered) */}
      {(checkingStock || checkResult) && (
        <div 
          className="ls-xray-scanner-overlay"
          onClick={() => {
            if (checkResult) {
              setCheckResult(null);
            }
          }}
        >
          {checkingStock ? (
            <div className="ls-xray-scanner-card" onClick={(e) => e.stopPropagation()}>
              {/* Laser passando da esquerda para a direita devagar */}
              <div className="ls-xray-scanner-laser" />

              {/* HUD concêntrico rotativo */}
              <div className="ls-ia-scanner-overlay__hud !relative !h-auto !mb-6 !mt-2">
                <div className="ls-ia-scanner-overlay__hud-outer" />
                <div className="ls-ia-scanner-overlay__hud-inner" style={{ border: '2.5px dashed rgba(234, 88, 12, 0.25)' }} />
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 border border-orange-200/50 shadow-inner">
                  <RefreshCw size={36} className="text-orange-600 animate-spin" />
                </div>
              </div>

              <h3 className="text-[17px] font-black text-slate-800 tracking-wide uppercase mb-1.5">IA Conciliando WMS</h3>
              <p className="text-[12px] font-bold text-slate-400 max-w-[280px] mx-auto leading-relaxed mb-6">
                Varrendo todos os canais de venda conectados e comparando as planilhas em tempo real...
              </p>

              {/* Log e Progresso Dinâmico em Porcentagem */}
              <div className="text-xs font-black text-orange-600 bg-orange-50 border border-orange-200/40 px-4 py-3 rounded-2xl shadow-inner mb-4 max-w-[290px] mx-auto">
                Aguarde, estamos escaneando a página... [{scanPercent}%]
              </div>

              <div className="font-mono text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-normal">
                {checkingStep === 0 && 'Conectando ao terminal de segurança...'}
                {checkingStep === 1 && 'Sincronizando Mercado Livre API...'}
                {checkingStep === 2 && 'Sincronizando Shopee e Amazon APIs...'}
                {checkingStep === 3 && 'Cruzando dados locais e IA conciliação...'}
              </div>
            </div>
          ) : (
            <div 
              className="ls-xray-scanner-card" 
              onClick={(e) => e.stopPropagation()}
            >
              {checkResult === 'success' ? (
                <>
                  <div className="ls-ia-scanner-overlay__card-icon ls-ia-scanner-overlay__card-icon--success">
                    <CheckCircle size={32} strokeWidth={2.5} />
                  </div>
                  <h3 className="ls-ia-scanner-overlay__card-title">O sistema está correto ✓</h3>
                  <p className="ls-ia-scanner-overlay__card-text">
                    A Inteligência Artificial verificou todos os terminais, Mercado Livre API e logs locais. O estoque mestre de {fmtQty(stockStats.total)} unidades está 100% conciliado, correto e seguro.
                  </p>
                  <button 
                    type="button" 
                    className="ls-ia-scanner-overlay__card-btn ls-ia-scanner-overlay__card-btn--success"
                    onClick={() => setCheckResult(null)}
                  >
                    Confirmar conciliação e fechar
                  </button>
                </>
              ) : (
                <>
                  <div className="ls-ia-scanner-overlay__card-icon ls-ia-scanner-overlay__card-icon--warning">
                    <AlertTriangle size={32} strokeWidth={2.5} />
                  </div>
                  <h3 className="ls-ia-scanner-overlay__card-title">Divergência Detectada! ⚠️</h3>
                  <p className="ls-ia-scanner-overlay__card-text">
                    Aviso de conflito de estoque detectado! Cadastro WMS indica {fmtQty(stockStats.total)} un., mas Mercado Livre API registra 820 un. Divergência de -20 unidades identificada.
                  </p>
                  <button 
                    type="button" 
                    className="ls-ia-scanner-overlay__card-btn ls-ia-scanner-overlay__card-btn--warning"
                    onClick={() => {
                      setCheckResult(null);
                      navigate(LOGSTOKA_ROUTES.PRODUCT_PUBLICATION);
                    }}
                  >
                    Verificar e corrigir divergência
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </LogstokaDetailPageLayout>
  );
};

export default ProductDetailPage;
