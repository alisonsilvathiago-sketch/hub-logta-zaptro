import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ClipboardCheck, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useTablePagination } from '@/hooks/useTablePagination';
import {
  DIVERGENCE_REASON_LABELS,
  deleteConferenceDivergence,
  loadConferenceDivergences,
  type ConferenceDivergence,
  type DivergenceReason,
} from '@/lib/conferenceDivergences';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import ConferencePendingResolveModal from './ConferencePendingResolveModal';
import './operationalWork.css';

function reasonBadgeClass(reason: DivergenceReason): string {
  if (reason === 'not_found') return 'ls-conf-reason--not-found';
  if (reason === 'wrong_qty') return 'ls-conf-reason--qty';
  if (reason === 'damaged') return 'ls-conf-reason--damaged';
  if (reason === 'swapped') return 'ls-conf-reason--swapped';
  return 'ls-conf-reason--other';
}

const ConferencePendingPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const [tick, setTick] = useState(0);
  const [activeItem, setActiveItem] = useState<ConferenceDivergence | null>(null);

  const items = useMemo(() => {
    void tick;
    return loadConferenceDivergences(companyId).filter((d) => !d.resolvedAt);
  }, [companyId, tick]);

  const stats = useMemo(() => {
    const notFound = items.filter((i) => i.reason === 'not_found').length;
    const operation = items.filter((i) => (i.context ?? 'operation') === 'operation').length;
    const inventory = items.filter((i) => i.context === 'inventory').length;
    return { total: items.length, notFound, operation, inventory };
  }, [items]);

  const { paginatedItems, footerProps } = useTablePagination(items, 15, 'conference-pending');

  const refresh = () => setTick((n) => n + 1);

  const quickDelete = (id: string) => {
    if (!companyId) return;
    deleteConferenceDivergence(companyId, id);
    toast.success('Pendência excluída');
    refresh();
  };

  const kpis = [
    { label: 'Abertas', value: stats.total, hint: 'aguardando correção', accent: true },
    { label: 'Produto não encontrado', value: stats.notFound, hint: 'cadastrar ou corrigir SKU' },
    { label: 'Operação', value: stats.operation, hint: 'pedidos / expedição' },
    { label: 'Inventário', value: stats.inventory, hint: 'contagens físicas' },
  ];

  return (
    <div className="ls-operational-work ls-conf-pending-page space-y-5">
      <LogstokaPageHeader
        icon={<ClipboardCheck size={20} strokeWidth={2.25} />}
        title="Pendências de conferência"
        subtitle="Corrija SKU, cadastre produtos ou ajuste o motivo — depois marque como resolvida"
        actions={
          <Link to={LOGSTOKA_ROUTES.OPERATIONAL_WORK} className="ls-btn-secondary inline-flex items-center gap-2 text-sm">
            <ArrowLeft size={16} />
            Voltar à operação
          </Link>
        }
      />

      <LogstokaKpiStrip items={kpis} />

      <section className="ls-op-card">
        {items.length === 0 ? (
          <div className="ls-conf-pending-empty">
            <ClipboardCheck size={32} className="text-emerald-500" aria-hidden />
            <p className="mt-3 font-bold text-[#383838]">Nenhuma pendência aberta</p>
            <p className="mt-1 text-sm text-[#737373]">Divergências da conferência e do inventário aparecem aqui.</p>
            <Link to={LOGSTOKA_ROUTES.OPERATIONAL_WORK} className="ls-btn-primary mt-4 inline-flex text-sm">
              Ir para operação do dia
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
              <p>
                Clique em <strong>Resolver</strong> para editar pedido, SKU, motivo e observação. Use{' '}
                <strong>Cadastrar produto</strong> quando o item não existir no catálogo.
              </p>
            </div>

            <div className="ls-table-wrap">
              <table className="ls-table">
                <thead>
                  <tr>
                    <th>Contexto</th>
                    <th>Pedido / SKU</th>
                    <th>Produto</th>
                    <th>Canal</th>
                    <th>Motivo</th>
                    <th>Data</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className={item.reason === 'not_found' ? 'ls-conf-pending-row--alert' : undefined}>
                      <td>
                        <span className="ls-conf-context-badge">
                          {(item.context ?? 'operation') === 'inventory' ? 'Inventário' : 'Operação'}
                        </span>
                      </td>
                      <td>
                        <p className="font-bold text-[#383838]">{item.orderRef}</p>
                        {item.sku ? <p className="text-xs text-[#9ca3af]">SKU {item.sku}</p> : null}
                      </td>
                      <td>{item.productName}</td>
                      <td>{item.marketplaceLabel}</td>
                      <td>
                        <span className={`ls-conf-reason ${reasonBadgeClass(item.reason)}`}>
                          {DIVERGENCE_REASON_LABELS[item.reason]}
                        </span>
                      </td>
                      <td className="text-xs text-[#737373]">{new Date(item.createdAt).toLocaleString('pt-BR')}</td>
                      <td className="ls-table-actions-cell">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="ls-btn-primary px-2 py-1 text-xs"
                            onClick={() => setActiveItem(item)}
                          >
                            <Pencil size={13} className="mr-1 inline" />
                            Resolver
                          </button>
                          <button
                            type="button"
                            className="ls-btn-secondary px-2 py-1 text-xs text-red-700"
                            aria-label="Excluir pendência"
                            onClick={() => quickDelete(item.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <LogstokaTableFooter {...footerProps} itemLabel="pendências" />
          </>
        )}
      </section>

      <ConferencePendingResolveModal
        open={activeItem !== null}
        item={activeItem}
        companyId={companyId}
        onClose={() => setActiveItem(null)}
        onChanged={refresh}
      />
    </div>
  );
};

export default ConferencePendingPage;
