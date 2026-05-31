import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  PackageCheck,
  Printer,
  RotateCcw,
  Store,
  Truck,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';
import StockLabelPreviewModal from '@/components/labels/StockLabelPreviewModal';
import { EMPTY_STOCK_LABEL, stockLabelFromReturn } from '@/lib/stockLabelData';
import ProductThumb from '@/components/products/ProductThumb';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_PRODUCTS, getDemoReturnById } from '@/lib/logstokaDemoSeed';
import './returnDetail.css';

const statusSteps = ['received', 'triage', 'approved', 'completed'] as const;
const statusLabels: Record<string, string> = {
  received: 'Recebido',
  triage: 'Triagem',
  approved: 'Aprovado',
  rejected: 'Reprovado',
  completed: 'Concluído',
};

function statusBadgeClass(status: string) {
  if (status === 'approved' || status === 'completed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'rejected') return 'bg-rose-50 text-rose-700';
  if (status === 'triage') return 'bg-amber-50 text-amber-700';
  return 'bg-[#f5f5f5] text-[#565656]';
}

function buildReturnTimeline(item: NonNullable<ReturnType<typeof getDemoReturnById>>) {
  const created = new Date(item.created_at);
  const events = [
    { text: `Devolução recebida · pedido ${item.order_reference ?? '—'}`, time: created },
    { text: `Motivo registrado: ${item.reason ?? '—'}`, time: new Date(created.getTime() + 15 * 60 * 1000) },
  ];

  if (['triage', 'approved', 'rejected', 'completed'].includes(item.status)) {
    events.push({ text: 'Triagem iniciada no WMS', time: new Date(created.getTime() + 45 * 60 * 1000) });
  }
  if (item.status === 'approved' || item.status === 'completed') {
    events.push({ text: 'Devolução aprovada — estoque atualizado', time: new Date(created.getTime() + 2 * 60 * 60 * 1000) });
  }
  if (item.status === 'rejected') {
    events.push({ text: 'Devolução reprovada na triagem', time: new Date(created.getTime() + 2 * 60 * 60 * 1000) });
  }
  if (item.status === 'completed') {
    events.push({ text: 'Processo concluído e arquivado', time: new Date(created.getTime() + 4 * 60 * 60 * 1000) });
  }

  return events.map((event) => ({
    text: event.text,
    time: event.time.toLocaleString('pt-BR'),
  }));
}

const ReturnDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { companyId } = useLogstokaTenant();
  const [labelOpen, setLabelOpen] = useState(false);
  const item = id && isLogstokaDemoCompany(companyId) ? getDemoReturnById(id) : null;

  const product = useMemo(
    () => (item ? DEMO_PRODUCTS.find((p) => p.sku === item.sku) ?? null : null),
    [item],
  );

  const timeline = useMemo(() => (item ? buildReturnTimeline(item) : []), [item]);
  const labelData = useMemo(
    () => (item ? stockLabelFromReturn(item, product) : EMPTY_STOCK_LABEL),
    [item, product],
  );

  if (!item) {
    return (
      <LogstokaDetailPageLayout backTo="/app/returns" title="Devolução" subtitle="Registro não encontrado">
        <div className="ls-card text-sm text-slate-500">Devolução não encontrada.</div>
      </LogstokaDetailPageLayout>
    );
  }

  const stepIndex = statusSteps.indexOf(item.status as (typeof statusSteps)[number]);
  const isRejected = item.status === 'rejected';
  const demo = (msg: string) => toast.success(`[Demo] ${msg}`);

  return (
    <LogstokaDetailPageLayout backTo="/app/returns" backLabel="Voltar para devoluções" hideTitleRow>
      <div className="ls-return-detail space-y-6">
        <section className="ls-return-detail-hero">
          <div className="ls-return-detail-hero__icon" aria-hidden>
            <RotateCcw size={32} strokeWidth={2.25} />
          </div>

          <div className="min-w-0">
            <p className="ls-return-detail-hero__eyebrow">Devolução · {item.id}</p>
            <h1 className="ls-return-detail-hero__title">Pedido {item.order_reference ?? '—'}</h1>
            <div className="ls-return-detail-hero__meta">
              <span className={`ls-badge ${statusBadgeClass(item.status)}`}>{statusLabels[item.status] ?? item.status}</span>
              <span className="ls-badge inline-flex items-center gap-1.5 bg-[#f5f5f5] text-[#565656]">
                <Store size={14} />
                {item.store_name}
              </span>
              <span className="ls-badge bg-orange-50 text-orange-700">SKU {item.sku}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#525252]">
              {item.product_name} · {item.reason ?? 'Sem motivo informado'}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#949494]">{new Date(item.created_at).toLocaleString('pt-BR')}</p>
          </div>

          <div className="ls-return-detail-hero__aside">
            <div className="ls-return-detail-actions mb-4">
              <LogstokaIconTooltip label="Baixar romaneio PDF">
                <button
                  type="button"
                  className="ls-return-detail-actions__icon"
                  aria-label="Baixar romaneio PDF"
                  onClick={() => demo('Romaneio PDF baixado')}
                >
                  <Download size={18} strokeWidth={2.25} />
                </button>
              </LogstokaIconTooltip>
              <LogstokaIconTooltip label="Etiqueta de estoque WMS">
                <button
                  type="button"
                  className="ls-return-detail-actions__icon"
                  aria-label="Etiqueta de estoque WMS"
                  onClick={() => setLabelOpen(true)}
                >
                  <Printer size={18} strokeWidth={2.25} />
                </button>
              </LogstokaIconTooltip>
              <LogstokaIconTooltip label="Dar baixa no estoque">
                <button
                  type="button"
                  className="ls-return-detail-actions__icon ls-return-detail-actions__icon--primary"
                  aria-label="Dar baixa no estoque"
                  onClick={() => demo('Baixa registrada — item retornado ao estoque')}
                >
                  <PackageCheck size={18} strokeWidth={2.25} />
                </button>
              </LogstokaIconTooltip>
            </div>
            <p className="ls-return-detail-hero__qty">{item.quantity}</p>
            <p className="ls-return-detail-hero__qty-label">unidades devolvidas</p>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="ls-return-detail-kpi">
            <p className="ls-return-detail-kpi__label">Quantidade</p>
            <p className="ls-return-detail-kpi__value">{item.quantity}</p>
            <p className="ls-return-detail-kpi__hint">unidades nesta devolução</p>
          </div>
          <div className="ls-return-detail-kpi">
            <p className="ls-return-detail-kpi__label">Loja</p>
            <p className="ls-return-detail-kpi__value text-xl">{item.store_name}</p>
            <p className="ls-return-detail-kpi__hint">origem do pedido</p>
          </div>
          <div className="ls-return-detail-kpi">
            <p className="ls-return-detail-kpi__label">Status</p>
            <p className="ls-return-detail-kpi__value text-xl">{statusLabels[item.status] ?? item.status}</p>
            <p className="ls-return-detail-kpi__hint">fluxo WMS</p>
          </div>
          <div className="ls-return-detail-kpi">
            <p className="ls-return-detail-kpi__label">Valor estimado</p>
            <p className="ls-return-detail-kpi__value text-xl">
              {product ? (product.cost * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
            </p>
            <p className="ls-return-detail-kpi__hint">custo × quantidade</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="ls-return-detail-panel lg:col-span-2 space-y-5">
            <div>
              <p className="ls-return-detail-panel__title">Fluxo da devolução</p>
              <div className="ls-return-detail-steps">
                {statusSteps.map((step, index) => {
                  const done = !isRejected && index <= stepIndex;
                  const rejectedHere = isRejected && step === 'triage';
                  return (
                    <span
                      key={step}
                      className={`ls-return-detail-step ${
                        rejectedHere
                          ? 'ls-return-detail-step--rejected'
                          : done
                            ? 'ls-return-detail-step--done'
                            : 'ls-return-detail-step--pending'
                      }`}
                    >
                      {rejectedHere ? <XCircle size={14} /> : done ? <CheckCircle2 size={14} /> : null}
                      {statusLabels[step]}
                    </span>
                  );
                })}
                {isRejected ? (
                  <span className="ls-return-detail-step ls-return-detail-step--rejected">
                    <XCircle size={14} />
                    Reprovado
                  </span>
                ) : null}
              </div>
            </div>

            <div>
              <p className="ls-return-detail-panel__title">Produto devolvido</p>
              <div className="ls-return-detail-product">
                <ProductThumb src={product?.main_image_url} name={item.product_name} size={72} />
                <div className="ls-return-detail-product__body">
                  <p className="ls-return-detail-product__name">{item.product_name}</p>
                  <p className="ls-return-detail-product__meta">
                    SKU {item.sku}
                    {product?.barcode ? ` · EAN ${product.barcode}` : ''}
                    {product?.brand ? ` · ${product.brand}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="ls-return-detail-panel__title">Dados do registro</p>
              <div className="ls-return-detail-facts">
                {[
                  ['Pedido', item.order_reference ?? '—'],
                  ['SKU', item.sku],
                  ['Produto', item.product_name],
                  ['Quantidade', `${item.quantity} un.`],
                  ['Loja', item.store_name],
                  ['Motivo', item.reason ?? '—'],
                  ['Status', statusLabels[item.status] ?? item.status],
                  ['Registrado em', new Date(item.created_at).toLocaleString('pt-BR')],
                  ['ID interno', item.id],
                ].map(([label, value]) => (
                  <div key={String(label)} className="ls-return-detail-fact">
                    <p className="ls-return-detail-fact__label">{label}</p>
                    <p className="ls-return-detail-fact__value">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="ls-return-detail-panel">
              <p className="ls-return-detail-panel__title">Ações WMS</p>
              <div className="ls-return-detail-side-actions">
                <button type="button" className="ls-btn-secondary w-full" onClick={() => demo('Triagem iniciada')}>
                  Iniciar triagem
                </button>
                <button type="button" className="ls-btn-primary w-full" onClick={() => demo('Devolução aprovada')}>
                  <CheckCircle2 size={16} />
                  Aprovar devolução
                </button>
                <button type="button" className="ls-btn-secondary w-full" onClick={() => demo('Devolução reprovada')}>
                  <XCircle size={16} />
                  Reprovar
                </button>
                <button type="button" className="ls-btn-secondary w-full" onClick={() => demo('Retirada física registrada')}>
                  <Truck size={16} />
                  Registrar retirada
                </button>
              </div>
            </div>

            <div className="ls-return-detail-panel">
              <p className="ls-return-detail-panel__title">Histórico</p>
              <div className="ls-return-detail-timeline">
                {timeline.map((event) => (
                  <div key={`${event.text}-${event.time}`} className="ls-return-detail-timeline__item">
                    <span className="ls-return-detail-timeline__dot" aria-hidden />
                    <div>
                      <p className="ls-return-detail-timeline__text">{event.text}</p>
                      <p className="ls-return-detail-timeline__time">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StockLabelPreviewModal open={labelOpen} onClose={() => setLabelOpen(false)} data={labelData} />
    </LogstokaDetailPageLayout>
  );
};

export default ReturnDetailPage;
