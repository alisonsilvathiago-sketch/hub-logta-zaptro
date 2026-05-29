import React from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileText, PackageCheck, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import {
  getDemoMovementById,
  marketplaceLabel,
  movementTypeLabel,
} from '@/lib/logstokaDemoSeed';

const MovementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { companyId } = useLogstokaTenant();
  const movement = id && isLogstokaDemoCompany(companyId) ? getDemoMovementById(id) : null;

  if (!movement) {
    return (
      <LogstokaDetailPageLayout backTo="/app/movements" title="Movimentação" subtitle="Registro não encontrado">
        <div className="ls-card text-sm text-slate-500">Movimentação não encontrada ou indisponível fora do modo demo.</div>
      </LogstokaDetailPageLayout>
    );
  }

  const isExit = movement.movement_type === 'exit';
  const isEntry = movement.movement_type === 'entry';

  const action = (label: string) => {
    toast.success(`[Demo] ${label}`);
  };

  return (
    <LogstokaDetailPageLayout
      backTo="/app/movements"
      backLabel="Voltar para movimentações"
      title={`${movementTypeLabel(movement.movement_type)} · ${movement.reference_code}`}
      subtitle={`${movement.product_name} (${movement.sku}) · ${movement.warehouse_name}`}
      actions={
        <>
          <button type="button" className="ls-btn-secondary" onClick={() => action('PDF baixado')}>
            <Download size={16} />
            Download comprovante
          </button>
          <button type="button" className="ls-btn-secondary" onClick={() => action('Enviado para impressão')}>
            <Printer size={16} />
            Imprimir
          </button>
          {isExit ? (
            <button type="button" className="ls-btn-primary" onClick={() => action('Baixa confirmada no estoque')}>
              <PackageCheck size={16} />
              Confirmar baixa / retirada
            </button>
          ) : null}
          {isEntry ? (
            <button type="button" className="ls-btn-primary" onClick={() => action('Entrada conferida e endereçada')}>
              <PackageCheck size={16} />
              Confirmar entrada no estoque
            </button>
          ) : null}
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="ls-card lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Detalhes da operação</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Tipo', movementTypeLabel(movement.movement_type)],
              ['Subtipo', movement.sub_type],
              ['SKU', movement.sku],
              ['Produto', movement.product_name],
              ['Depósito', movement.warehouse_name],
              ['Canal', marketplaceLabel(movement.marketplace)],
              ['Referência', movement.reference_code],
              ['Quantidade', `${movement.total_quantity} un.`],
              ['Status', movement.status],
              ['Data', new Date(movement.created_at).toLocaleString('pt-BR')],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="ls-card space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Fluxo operacional</h3>
          {[
            isEntry ? 'NF recebida / XML importado' : 'Pedido ou evento registrado',
            'Conferência física do item',
            isExit ? 'Separação e expedição' : 'Endereçamento no depósito',
            'Baixa automática no estoque multicanal',
          ].map((step, i) => (
            <div key={step} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-black text-orange-700">
                {i + 1}
              </span>
              <p className="text-sm font-medium text-slate-700">{step}</p>
            </div>
          ))}
          <button type="button" className="ls-btn-secondary w-full" onClick={() => action('Documento fiscal aberto')}>
            <FileText size={16} />
            Ver documento vinculado
          </button>
        </div>
      </div>
    </LogstokaDetailPageLayout>
  );
};

export default MovementDetailPage;
