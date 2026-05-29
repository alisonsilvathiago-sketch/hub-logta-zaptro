import React from 'react';
import { useParams } from 'react-router-dom';
import { Package, Truck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { getDemoTransferById } from '@/lib/logstokaDemoSeed';

const statusMap: Record<string, string> = {
  pending: 'Pendente',
  in_transit: 'Em trânsito',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

const TransferDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { companyId } = useLogstokaTenant();
  const transfer = id && isLogstokaDemoCompany(companyId) ? getDemoTransferById(id) : null;

  if (!transfer) {
    return (
      <LogstokaDetailPageLayout backTo="/app/transfers" title="Transferência" subtitle="Registro não encontrado">
        <div className="ls-card text-sm text-slate-500">Transferência não encontrada.</div>
      </LogstokaDetailPageLayout>
    );
  }

  return (
    <LogstokaDetailPageLayout
      backTo="/app/transfers"
      backLabel="Voltar para transferências"
      title={`${transfer.origin_name} → ${transfer.destination_name}`}
      subtitle={transfer.notes || 'Transferência entre depósitos'}
      actions={
        <>
          {transfer.status === 'pending' ? (
            <button type="button" className="ls-btn-primary" onClick={() => toast.success('[Demo] Transferência enviada')}>
              <Truck size={16} />
              Enviar / em trânsito
            </button>
          ) : null}
          {transfer.status === 'in_transit' ? (
            <button type="button" className="ls-btn-primary" onClick={() => toast.success('[Demo] Recebimento confirmado')}>
              <Package size={16} />
              Confirmar recebimento
            </button>
          ) : null}
        </>
      }
    >
      <div className="ls-card space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Status', statusMap[transfer.status] ?? transfer.status],
            ['Origem', transfer.origin_name],
            ['Destino', transfer.destination_name],
            ['Data', new Date(transfer.created_at).toLocaleString('pt-BR')],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        <h3 className="text-sm font-black text-slate-900">Itens</h3>
        {transfer.items.map((i) => (
          <div key={i.sku} className="flex justify-between rounded-xl border border-slate-100 px-4 py-3 text-sm">
            <span>
              <strong>{i.sku}</strong> — {i.name}
            </span>
            <span className="font-bold text-orange-700">{i.quantity} un.</span>
          </div>
        ))}
      </div>
    </LogstokaDetailPageLayout>
  );
};

export default TransferDetailPage;
