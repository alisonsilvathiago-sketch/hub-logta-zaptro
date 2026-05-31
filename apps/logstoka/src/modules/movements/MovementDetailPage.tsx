import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Hash,
  Pencil,
  Printer,
  RotateCcw,
  Store,
  Tag,
  Warehouse,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import MovementEditModal, { type MovementEditPayload } from '@/components/movements/MovementEditModal';
import StockLabelPreviewModal from '@/components/labels/StockLabelPreviewModal';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import LogstokaMoneyPrivacyToggle from '@/components/privacy/LogstokaMoneyPrivacyToggle';
import LogstokaMoneyValue from '@/components/privacy/LogstokaMoneyValue';
import LogstokaXRayTrigger from '@/modules/ai/auditor/LogstokaXRayTrigger';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import ProductThumb from '@/components/products/ProductThumb';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaBranding } from '@/context/LogstokaBrandingContext';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { findCompanyMovement } from '@/lib/movementLoader';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { printMovementDocument } from '@/lib/printMovementDocument';
import { stockLabelFromMovement } from '@/lib/stockLabelData';
import {
  getDemoCategoryName,
  getDemoMovementById,
  getDemoMovementStockSnapshot,
  getDemoRelatedMovements,
  getDemoTransferForMovement,
  marketplaceLabel,
  movementStatusLabel,
  movementSubTypeLabel,
  movementTabFromType,
  movementTypeLabel,
  type DemoMovementRow,
} from '@/lib/logstokaDemoSeed';
import './movementDetail.css';

const MOVEMENT_ICONS = {
  entry: ArrowDownToLine,
  exit: ArrowUpFromLine,
  transfer: ArrowLeftRight,
  return: RotateCcw,
  damage: AlertTriangle,
} as const;

const fmtQty = (n: number) => n.toLocaleString('pt-BR');
const fmtBrl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (iso: string) => new Date(iso).toLocaleString('pt-BR');

function qtySign(type: string) {
  if (type === 'exit' || type === 'damage') return '−';
  if (type === 'entry' || type === 'return') return '+';
  return '↔';
}

function statusBadgeClass(status: string) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'in_transit') return 'bg-amber-50 text-amber-700';
  if (status === 'pending') return 'bg-[#f5f5f5] text-[#565656]';
  return 'bg-orange-50 text-orange-700';
}

function buildAuditTrail(movement: DemoMovementRow) {
  const created = new Date(movement.created_at);
  const events = [
    {
      text: `${movementTypeLabel(movement.movement_type)} registrada · ref. ${movement.reference_code ?? '—'}`,
      time: fmtDate(movement.created_at),
    },
    {
      text: `Estoque atualizado · ${fmtQty(movement.total_quantity)} un. no depósito`,
      time: fmtDate(new Date(created.getTime() + 2 * 60 * 1000).toISOString()),
    },
  ];

  if (movement.marketplace) {
    events.push({
      text: `Sync enviado para ${marketplaceLabel(movement.marketplace)}`,
      time: fmtDate(new Date(created.getTime() + 5 * 60 * 1000).toISOString()),
    });
  }

  if (movement.movement_type === 'transfer') {
    events.push({
      text: 'Transferência vinculada ao fluxo entre CDs',
      time: fmtDate(new Date(created.getTime() + 8 * 60 * 1000).toISOString()),
    });
  }

  if (movement.status === 'completed') {
    events.push({
      text: 'Operação concluída e fechada no WMS',
      time: fmtDate(new Date(created.getTime() + 15 * 60 * 1000).toISOString()),
    });
  }

  return events;
}

const MovementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const { branding } = useLogstokaBranding();
  const companyName = branding.companyName ?? 'LogStoka WMS';
  const demo = isLogstokaDemoCompany(companyId);
  const [movement, setMovement] = useState<DemoMovementRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !companyId) {
      setMovement(null);
      setLoading(false);
      return;
    }
    if (demo) {
      setMovement(getDemoMovementById(id));
      setLoading(false);
      return;
    }
    setLoading(true);
    void findCompanyMovement(companyId, id)
      .then(setMovement)
      .finally(() => setLoading(false));
  }, [id, companyId, demo]);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);

  const stockSnapshot = useMemo(() => (movement ? getDemoMovementStockSnapshot(movement) : null), [movement]);
  const linkedTransfer = useMemo(() => (movement ? getDemoTransferForMovement(movement) : null), [movement]);
  const relatedMovements = useMemo(() => (movement ? getDemoRelatedMovements(movement) : []), [movement]);
  const auditTrail = useMemo(() => (movement ? buildAuditTrail(movement) : []), [movement]);
  const labelData = useMemo(
    () => (movement ? stockLabelFromMovement(movement, stockSnapshot?.product ?? undefined) : null),
    [movement, stockSnapshot],
  );

  if (loading) {
    return (
      <LogstokaDetailPageLayout backTo="/app/movements" title="Movimentação" subtitle="Carregando…">
        <div className="ls-card text-sm text-[#949494]">Carregando movimentação…</div>
      </LogstokaDetailPageLayout>
    );
  }

  if (!movement) {
    return (
      <LogstokaDetailPageLayout backTo="/app/movements" title="Movimentação" subtitle="Registro não encontrado">
        <div className="ls-card text-sm text-[#949494]">Movimentação não encontrada.</div>
      </LogstokaDetailPageLayout>
    );
  }

  const Icon = MOVEMENT_ICONS[movement.movement_type as keyof typeof MOVEMENT_ICONS] ?? ArrowLeftRight;
  const backTo = `/app/movements?tab=${movementTabFromType(movement.movement_type)}`;
  const product = stockSnapshot?.product;
  const isTransfer = movement.movement_type === 'transfer';
  const isExit = movement.movement_type === 'exit';
  const isEntry = movement.movement_type === 'entry';

  const notifyAction = (label: string) => toast.success(label);

  const handlePrint = () => {
    try {
      printMovementDocument(movement, {
        companyName,
        operatorName: profile?.full_name ?? profile?.email ?? 'Operador',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível imprimir');
    }
  };

  const handleSave = (payload: MovementEditPayload) => {
    setEditSaving(true);
    window.setTimeout(() => {
      setMovement((prev) => (prev ? { ...prev, ...payload } : prev));
      setEditSaving(false);
      setEditOpen(false);
      toast.success('Movimentação atualizada');
    }, 400);
  };

  const handleDuplicate = () => {
    toast.success('Duplicar movimentação — use a lista em Movimentações');
  };

  const facts: Array<[string, React.ReactNode]> = [
    ['ID interno', movement.id],
    ['Tipo', movementTypeLabel(movement.movement_type)],
    ['Subtipo', movementSubTypeLabel(movement.movement_type, movement.sub_type)],
    ['Status', movementStatusLabel(movement.status)],
    ['Referência', movement.reference_code ?? '—'],
    ['Quantidade', `${fmtQty(movement.total_quantity)} un.`],
    ['Depósito', movement.warehouse_name ?? '—'],
    ['Canal / Marketplace', movement.marketplace ? marketplaceLabel(movement.marketplace) : 'Operação interna'],
    ['Data e hora', fmtDate(movement.created_at)],
    ['Código depósito', movement.warehouse_id ?? '—'],
    ['Empresa', movement.company_id.slice(0, 8) + '…'],
  ];

  if (product) {
    facts.push(
      ['Marca', product.brand ?? '—'],
      ['Categoria', getDemoCategoryName(product.category_id)],
      ['EAN / GTIN', product.barcode ?? '—'],
      ['Código interno', product.internal_code ?? '—'],
    );
  }

  return (
    <LogstokaDetailPageLayout
      backTo={backTo}
      backLabel="Voltar para movimentações"
      hideTitleRow
      topRightActions={
        <>
          <LogstokaMoneyPrivacyToggle size="sm" />
          <LogstokaXRayTrigger />
        </>
      }
    >
      <div className="ls-movement-detail space-y-6">
        <section className="ls-movement-detail-hero">
          <div className="ls-movement-detail-hero__icon" aria-hidden>
            <Icon size={32} strokeWidth={2.25} />
          </div>

          <div className="min-w-0">
            <p className="ls-movement-detail-hero__eyebrow">Movimentação · {movement.id}</p>
            <h1 className="ls-movement-detail-hero__title">
              {movementTypeLabel(movement.movement_type)} · {movement.reference_code ?? 'Sem referência'}
            </h1>
            <div className="ls-movement-detail-hero__meta">
              <span className="ls-badge bg-orange-50 text-orange-700">{movementTypeLabel(movement.movement_type)}</span>
              <span className={`ls-badge ${statusBadgeClass(movement.status)}`}>{movementStatusLabel(movement.status)}</span>
              <span className="ls-badge bg-[#f5f5f5] text-[#565656]">
                {movementSubTypeLabel(movement.movement_type, movement.sub_type)}
              </span>
              {movement.marketplace ? (
                <span className="ls-badge inline-flex items-center gap-1.5 bg-[#f5f5f5] text-[#565656]">
                  <MarketplaceLogo marketplace={movement.marketplace} size={14} />
                  {marketplaceLabel(movement.marketplace)}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm font-semibold text-[#525252]">
              {movement.product_name} · SKU {movement.sku} · {movement.warehouse_name}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#949494]">{fmtDate(movement.created_at)}</p>
          </div>

          <div className="ls-movement-detail-hero__aside">
            <div className="ls-movement-detail-actions mb-4">
              <button type="button" className="ls-btn-secondary" onClick={() => setEditOpen(true)}>
                <Pencil size={16} />
                Editar
              </button>
              <button type="button" className="ls-btn-secondary" onClick={handleDuplicate}>
                <Copy size={16} />
                Duplicar
              </button>
              <button type="button" className="ls-btn-secondary" onClick={() => notifyAction('PDF baixado')}>
                <Download size={16} />
                PDF
              </button>
              <button type="button" className="ls-btn-secondary" onClick={() => setLabelOpen(true)}>
                <Tag size={16} />
                Etiqueta
              </button>
              <button type="button" className="ls-btn-secondary" onClick={handlePrint}>
                <Printer size={16} />
                Imprimir
              </button>
            </div>
            <p className="ls-movement-detail-hero__qty">
              {qtySign(movement.movement_type)}
              {fmtQty(movement.total_quantity)}
            </p>
            <p className="ls-movement-detail-hero__qty-label">unidades movimentadas</p>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="ls-movement-detail-kpi">
            <p className="ls-movement-detail-kpi__label">Quantidade</p>
            <p className="ls-movement-detail-kpi__value">{fmtQty(movement.total_quantity)}</p>
            <p className="ls-movement-detail-kpi__hint">unidades nesta operação</p>
          </div>
          <div className="ls-movement-detail-kpi">
            <p className="ls-movement-detail-kpi__label">Estoque no depósito</p>
            <p className="ls-movement-detail-kpi__value">{fmtQty(stockSnapshot?.atWarehouse ?? 0)}</p>
            <p className="ls-movement-detail-kpi__hint">{movement.warehouse_name ?? '—'}</p>
          </div>
          <div className="ls-movement-detail-kpi">
            <p className="ls-movement-detail-kpi__label">Estoque total SKU</p>
            <p className="ls-movement-detail-kpi__value">{fmtQty(stockSnapshot?.totalStock ?? 0)}</p>
            <p className="ls-movement-detail-kpi__hint">todos os depósitos</p>
          </div>
          <div className="ls-movement-detail-kpi">
            <p className="ls-movement-detail-kpi__label">Valor estimado</p>
            <p className="ls-movement-detail-kpi__value">
              {product ? (
                <LogstokaMoneyValue isMoney>{fmtBrl(product.cost * movement.total_quantity)}</LogstokaMoneyValue>
              ) : (
                '—'
              )}
            </p>
            <p className="ls-movement-detail-kpi__hint">custo × quantidade</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {product ? (
              <section className="ls-movement-detail-panel">
                <h3 className="ls-movement-detail-panel__title">Produto vinculado</h3>
                <div className="ls-movement-detail-product">
                  {product.main_image_url ? (
                    <img src={product.main_image_url} alt="" className="ls-movement-detail-product__image" />
                  ) : (
                    <ProductThumb src={null} name={product.name} size={88} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="ls-movement-detail-product__name">{product.name}</p>
                    <p className="ls-movement-detail-product__sku">
                      SKU {product.sku} · {product.brand} · {getDemoCategoryName(product.category_id)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-[#949494]">
                      <span>
                        Custo <LogstokaMoneyValue isMoney>{fmtBrl(product.cost)}</LogstokaMoneyValue>
                      </span>
                      <span>·</span>
                      <span>
                        Venda <LogstokaMoneyValue isMoney>{fmtBrl(product.sale_price)}</LogstokaMoneyValue>
                      </span>
                      <span>·</span>
                      <span>EAN {product.barcode}</span>
                    </div>
                  </div>
                  <Link to={`/app/products/${product.id}`} className="ls-btn-secondary shrink-0">
                    <ExternalLink size={16} />
                    Ver produto
                  </Link>
                </div>
              </section>
            ) : null}

            <section className="ls-movement-detail-panel">
              <h3 className="ls-movement-detail-panel__title">Itens da movimentação</h3>
              <div className="ls-movement-detail-item-row">
                {product?.main_image_url ? (
                  <img src={product.main_image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <ProductThumb src={null} name={movement.product_name ?? movement.sku ?? 'Item'} size={48} />
                )}
                <div className="min-w-0">
                  <p className="font-bold text-[#383838]">{movement.product_name ?? '—'}</p>
                  <p className="text-xs font-semibold text-[#949494]">SKU {movement.sku ?? '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-[#949494]">Qtd</p>
                  <p className="text-lg font-black text-orange-600">{fmtQty(movement.total_quantity)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-[#949494]">Depósito</p>
                  <p className="text-sm font-bold text-[#383838]">{movement.warehouse_name ?? '—'}</p>
                </div>
              </div>
            </section>

            {isTransfer && linkedTransfer ? (
              <section className="ls-movement-detail-panel">
                <h3 className="ls-movement-detail-panel__title">Rota da transferência</h3>
                <div className="ls-movement-detail-route">
                  <div className="ls-movement-detail-route__node">
                    <p className="ls-movement-detail-route__label">Origem</p>
                    <p className="ls-movement-detail-route__name">{linkedTransfer.origin_name}</p>
                  </div>
                  <div className="ls-movement-detail-route__arrow" aria-hidden>
                    <ArrowLeftRight size={18} />
                  </div>
                  <div className="ls-movement-detail-route__node ls-movement-detail-route__node--dest">
                    <p className="ls-movement-detail-route__label">Destino</p>
                    <p className="ls-movement-detail-route__name">{linkedTransfer.destination_name}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="ls-movement-detail-fact">
                    <p className="ls-movement-detail-fact__label">Status transferência</p>
                    <p className="ls-movement-detail-fact__value">{movementStatusLabel(linkedTransfer.status)}</p>
                  </div>
                  <div className="ls-movement-detail-fact">
                    <p className="ls-movement-detail-fact__label">Observações</p>
                    <p className="ls-movement-detail-fact__value">{linkedTransfer.notes ?? '—'}</p>
                  </div>
                </div>
                <Link to={`/app/transfers`} className="mt-4 inline-flex text-xs font-bold text-orange-700 hover:underline">
                  Ver transferências →
                </Link>
              </section>
            ) : null}

            <section className="ls-movement-detail-panel">
              <h3 className="ls-movement-detail-panel__title">Todos os dados da operação</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {facts.map(([label, value]) => (
                  <div key={String(label)} className="ls-movement-detail-fact">
                    <p className="ls-movement-detail-fact__label">{label}</p>
                    <p className="ls-movement-detail-fact__value">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {relatedMovements.length > 0 ? (
              <section className="ls-movement-detail-panel">
                <h3 className="ls-movement-detail-panel__title">Histórico do mesmo SKU</h3>
                <div className="space-y-3">
                  {relatedMovements.map((row) => (
                    <Link
                      key={row.id}
                      to={`/app/movements/${row.id}`}
                      className="ls-movement-detail-timeline-item transition hover:border-orange-200 hover:bg-orange-50/40"
                    >
                      <div>
                        <p className="ls-movement-detail-timeline-item__type">
                          {movementTypeLabel(row.movement_type)} · {row.reference_code}
                        </p>
                        <p className="ls-movement-detail-timeline-item__meta">
                          {fmtDate(row.created_at)} · {row.warehouse_name}
                        </p>
                      </div>
                      <p className="ls-movement-detail-timeline-item__qty">
                        {qtySign(row.movement_type)}
                        {fmtQty(row.total_quantity)}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="space-y-6">
            <section className="ls-movement-detail-panel">
              <h3 className="ls-movement-detail-panel__title">Resumo operacional</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Warehouse size={16} className="mt-0.5 shrink-0 text-[#949494]" aria-hidden />
                  <div>
                    <p className="text-xs font-bold uppercase text-[#949494]">Depósito</p>
                    <p className="text-sm font-bold text-[#383838]">{movement.warehouse_name ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Store size={16} className="mt-0.5 shrink-0 text-[#949494]" aria-hidden />
                  <div>
                    <p className="text-xs font-bold uppercase text-[#949494]">Canal</p>
                    <p className="text-sm font-bold text-[#383838]">
                      {movement.marketplace ? marketplaceLabel(movement.marketplace) : 'Operação interna WMS'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hash size={16} className="mt-0.5 shrink-0 text-[#949494]" aria-hidden />
                  <div>
                    <p className="text-xs font-bold uppercase text-[#949494]">Referência</p>
                    <p className="text-sm font-bold text-[#383838]">{movement.reference_code ?? '—'}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="ls-movement-detail-panel">
              <h3 className="ls-movement-detail-panel__title">Linha do tempo</h3>
              {auditTrail.map((event) => (
                <div key={`${event.text}-${event.time}`} className="ls-movement-detail-audit-item">
                  <span className="ls-movement-detail-audit-item__dot" aria-hidden />
                  <div>
                    <p className="ls-movement-detail-audit-item__text">{event.text}</p>
                    <p className="ls-movement-detail-audit-item__time">{event.time}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="ls-movement-detail-panel">
              <h3 className="ls-movement-detail-panel__title">Documentos</h3>
              <div className="space-y-2">
                <button type="button" className="ls-btn-secondary w-full" onClick={handlePrint}>
                  <FileText size={16} />
                  Comprovante da movimentação
                </button>
                {(isEntry || movement.sub_type === 'xml') && (
                  <button type="button" className="ls-btn-secondary w-full" onClick={() => notifyAction('NF-e / XML aberto')}>
                    <FileText size={16} />
                    NF-e / XML vinculado
                  </button>
                )}
                {isExit && movement.marketplace ? (
                  <button type="button" className="ls-btn-secondary w-full" onClick={() => notifyAction('Pedido marketplace aberto')}>
                    <Store size={16} />
                    Pedido {marketplaceLabel(movement.marketplace)}
                  </button>
                ) : null}
              </div>
            </section>

            {(isEntry || isExit) && (
              <section className="ls-movement-detail-panel">
                <h3 className="ls-movement-detail-panel__title">Ação operacional</h3>
                {isExit ? (
                  <button type="button" className="ls-btn-primary w-full" onClick={() => notifyAction('Baixa confirmada')}>
                    Confirmar baixa / retirada
                  </button>
                ) : (
                  <button type="button" className="ls-btn-primary w-full" onClick={() => notifyAction('Entrada conferida')}>
                    Confirmar entrada no estoque
                  </button>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      <MovementEditModal
        open={editOpen}
        movement={movement}
        saving={editSaving}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      <StockLabelPreviewModal
        open={labelOpen && labelData != null}
        onClose={() => setLabelOpen(false)}
        data={labelData!}
      />
    </LogstokaDetailPageLayout>
  );
};

export default MovementDetailPage;
