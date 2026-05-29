import React from 'react';
import { useParams } from 'react-router-dom';
import { Download, PackageCheck, Printer, Truck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { getDemoReturnById } from '@/lib/logstokaDemoSeed';

const statusSteps = ['received', 'triage', 'approved', 'completed'] as const;
const statusLabels: Record<string, string> = {
  received: 'Recebido',
  triage: 'Triagem',
  approved: 'Aprovado',
  rejected: 'Reprovado',
  completed: 'Concluído',
};

const ReturnDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { companyId } = useLogstokaTenant();
  const item = id && isLogstokaDemoCompany(companyId) ? getDemoReturnById(id) : null;

  if (!item) {
    return (
      <LogstokaDetailPageLayout backTo="/app/returns" title="Devolução" subtitle="Registro não encontrado">
        <div className="ls-card text-sm text-slate-500">Devolução não encontrada.</div>
      </LogstokaDetailPageLayout>
    );
  }

  const stepIndex = statusSteps.indexOf(item.status as (typeof statusSteps)[number]);

  const demo = (msg: string) => toast.success(`[Demo] ${msg}`);

  return (
    <LogstokaDetailPageLayout
      backTo="/app/returns"
      backLabel="Voltar para devoluções"
      title={`Pedido ${item.order_reference}`}
      subtitle={`${item.product_name} · ${item.store_name}`}
      actions={
        <>
          <button type="button" className="ls-btn-secondary" onClick={() => demo('Romaneio PDF baixado')}>
            <Download size={16} />
            Download romaneio
          </button>
          <button type="button" className="ls-btn-secondary" onClick={() => demo('Etiqueta enviada para impressão')}>
            <Printer size={16} />
            Imprimir etiqueta
          </button>
          <button type="button" className="ls-btn-primary" onClick={() => demo('Baixa registrada — item retornado ao estoque')}>
            <PackageCheck size={16} />
            Dar baixa no estoque
          </button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="ls-card lg:col-span-2 space-y-5">
          <div>
            <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-slate-400">Status do pedido</h3>
            <div className="flex flex-wrap gap-2">
              {statusSteps.map((s, i) => (
                <div
                  key={s}
                  className={`rounded-xl px-4 py-2 text-xs font-bold ${
                    i <= stepIndex ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {statusLabels[s]}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['SKU', item.sku],
              ['Produto', item.product_name],
              ['Quantidade', `${item.quantity} un.`],
              ['Loja', item.store_name],
              ['Motivo', item.reason],
              ['Status atual', statusLabels[item.status] ?? item.status],
              ['Data', new Date(item.created_at).toLocaleString('pt-BR')],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="ls-card space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Ações WMS</h3>
          <p className="text-sm text-slate-600">
            Conferir embalagem, registrar triagem, aprovar retorno ao estoque ou reprovar por avaria/uso.
          </p>
          <button type="button" className="ls-btn-secondary w-full" onClick={() => demo('Triagem iniciada')}>
            Iniciar triagem
          </button>
          <button type="button" className="ls-btn-primary w-full" onClick={() => demo('Saída física registrada para expedição reversa')}>
            <Truck size={16} />
            Registrar retirada física
          </button>
        </div>
      </div>
    </LogstokaDetailPageLayout>
  );
};

export default ReturnDetailPage;
