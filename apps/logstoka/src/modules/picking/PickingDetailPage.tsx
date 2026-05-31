import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PackageCheck, Printer, ScanLine } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import OperationalProductItemsPanel from '@/components/operational/OperationalProductItemsPanel';
import OperationalWarehouseCard from '@/components/operational/OperationalWarehouseCard';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaBranding } from '@/context/LogstokaBrandingContext';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useLogstokaWarehouseScope } from '@/context/LogstokaWarehouseScopeContext';
import { recordPickingSeparatedToQueue } from '@/lib/conferenceHistory';
import { getDemoProductBySku } from '@/lib/logstokaDemoSeed';
import { getDemoWarehouseById } from '@/lib/demoWarehouseStore';
import { printPickingDayList } from '@/lib/printPickingDayList';
import { resolvePickingRowByKey } from '@/lib/resolvePickingRow';
import {
  markPickingSeparated,
  mergePickingLines,
  type PickingLine,
  type PickRow,
} from '@/lib/pickingSession';
import { MARKETPLACE_LABELS } from '@/types';
import '@/components/operational/operationalDetailShared.css';

const statusLabel: Record<PickingLine['status'], string> = {
  pending: 'Pendente separação',
  separated: 'Separado · na fila',
  conferenced: 'Conferido',
};

const statusExplain: Record<PickingLine['status'], string> = {
  pending: 'Item aguardando separação física no CD. Confirme após retirar do estoque.',
  separated: 'Separado e incluído na fila de conferência do dia.',
  conferenced: 'Conferência concluída — item pronto para expedição.',
};

const PickingDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { key } = useParams<{ key: string }>();
  const { companyId } = useLogstokaTenant();
  const { profile } = useAuth();
  const { branding } = useLogstokaBranding();
  const { assignedWarehouseId } = useLogstokaWarehouseScope();
  const actorName = profile?.full_name?.trim() || 'Operador';
  const [row, setRow] = useState<PickRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!key || !companyId) {
      setRow(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void resolvePickingRowByKey(companyId, key)
      .then(setRow)
      .finally(() => setLoading(false));
  }, [key, companyId]);

  const line: PickingLine | null = row ? mergePickingLines(companyId, [row])[0] ?? null : null;

  const warehouse = useMemo(() => {
    if (!companyId) return null;
    const whId = assignedWarehouseId ?? 'wh-2';
    return getDemoWarehouseById(companyId, whId);
  }, [companyId, assignedWarehouseId]);

  const product = useMemo(() => (row ? getDemoProductBySku(row.sku) : null), [row]);

  const confirmSeparation = () => {
    if (!companyId || !line) return;
    if (line.status === 'conferenced') {
      toast.error('Item já conferido');
      return;
    }
    markPickingSeparated(companyId, line);
    recordPickingSeparatedToQueue({
      companyId,
      actorName,
      actorId: profile?.id,
      sku: line.sku,
      productName: line.name,
      quantity: line.quantity,
      marketplace: line.marketplace,
      store: line.store,
    });
    toast.success('Separado — incluído na conferência diária');
    navigate('/app/picking');
  };

  const handlePrint = () => {
    if (!line) return;
    printPickingDayList([line], branding.companyName ?? 'LogStoka WMS');
    toast.success('Lista de separação enviada para impressão');
  };

  if (loading) {
    return (
      <LogstokaDetailPageLayout backTo="/app/picking" title="Separação" subtitle="Carregando…">
        <div className="ls-card text-sm text-slate-500">Carregando item…</div>
      </LogstokaDetailPageLayout>
    );
  }

  if (!row || !line) {
    return (
      <LogstokaDetailPageLayout backTo="/app/picking" title="Separação" subtitle="Item não encontrado">
        <div className="ls-card text-sm text-slate-500">Item de picking não encontrado na fila de hoje.</div>
      </LogstokaDetailPageLayout>
    );
  }

  const marketplaceLabel =
    MARKETPLACE_LABELS[row.marketplace as keyof typeof MARKETPLACE_LABELS] ?? row.marketplace ?? '—';

  return (
    <LogstokaDetailPageLayout backTo="/app/picking" backLabel="Voltar para separação" hideTitleRow>
      <div className="space-y-6">
        <section className="ls-op-detail-hero">
          <div className="ls-op-detail-hero__icon" aria-hidden>
            <ScanLine size={32} strokeWidth={2.25} />
          </div>

          <div className="min-w-0">
            <p className="ls-op-detail-hero__eyebrow">Separação do dia</p>
            <h1 className="ls-op-detail-hero__title">{row.name}</h1>
            <div className="ls-op-detail-hero__meta">
              <span className="ls-badge bg-orange-50 text-orange-700">{statusLabel[line.status]}</span>
              {row.marketplace ? (
                <span className="ls-badge inline-flex items-center gap-1.5 bg-[#f5f5f5] text-[#565656]">
                  <MarketplaceLogo marketplace={row.marketplace} size={14} />
                  {marketplaceLabel}
                </span>
              ) : null}
              <span className="ls-badge bg-[#f5f5f5] text-[#565656]">SKU {row.sku}</span>
            </div>
            <p className="ls-op-detail-hero__explain">{statusExplain[line.status]}</p>
            <p className="mt-2 text-xs font-semibold text-[#737373]">
              Loja {row.store || '—'} · {warehouse?.name ?? 'CD operacional'}
            </p>
          </div>

          <div className="ls-op-detail-hero__aside">
            <div className="mb-4 flex flex-wrap justify-end gap-2">
              <button type="button" className="ls-btn-secondary" onClick={handlePrint}>
                <Printer size={16} />
                Imprimir
              </button>
              <button type="button" className="ls-btn-primary" onClick={confirmSeparation}>
                <PackageCheck size={16} />
                Confirmar separação
              </button>
            </div>
            <p className="ls-op-detail-hero__qty">{row.quantity.toLocaleString('pt-BR')}</p>
            <p className="ls-op-detail-hero__qty-label">unidades a separar</p>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="ls-op-detail-kpi">
            <p className="ls-op-detail-kpi__label">Quantidade</p>
            <p className="ls-op-detail-kpi__value">{row.quantity.toLocaleString('pt-BR')}</p>
            <p className="ls-op-detail-kpi__hint">unidades nesta linha</p>
          </div>
          <div className="ls-op-detail-kpi">
            <p className="ls-op-detail-kpi__label">Canal</p>
            <p className="ls-op-detail-kpi__value text-xl">{marketplaceLabel}</p>
            <p className="ls-op-detail-kpi__hint">{row.store || 'Loja'}</p>
          </div>
          <div className="ls-op-detail-kpi">
            <p className="ls-op-detail-kpi__label">Status</p>
            <p className="ls-op-detail-kpi__value text-xl">{statusLabel[line.status]}</p>
            <p className="ls-op-detail-kpi__hint">fluxo do dia</p>
          </div>
          <div className="ls-op-detail-kpi">
            <p className="ls-op-detail-kpi__label">EAN</p>
            <p className="ls-op-detail-kpi__value text-lg">{product?.barcode ?? '—'}</p>
            <p className="ls-op-detail-kpi__hint">{product?.brand ?? 'Produto'}</p>
          </div>
        </div>

        {warehouse ? (
          <section className="ls-op-detail-panel">
            <h3 className="ls-op-detail-panel__title">CD de separação</h3>
            <OperationalWarehouseCard warehouse={warehouse} role="Depósito" variant="origin" />
          </section>
        ) : null}

        <OperationalProductItemsPanel
          items={[{ sku: row.sku, name: row.name, quantity: row.quantity }]}
          title="Produto a separar"
        />
      </div>
    </LogstokaDetailPageLayout>
  );
};

export default PickingDetailPage;
