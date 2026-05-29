import React from 'react';
import { useParams } from 'react-router-dom';
import { PackageCheck, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { getDemoPickingByKey } from '@/lib/logstokaDemoSeed';
import { MARKETPLACE_LABELS } from '@/types';

const PickingDetailPage: React.FC = () => {
  const { key } = useParams<{ key: string }>();
  const { companyId } = useLogstokaTenant();
  const row = key && isLogstokaDemoCompany(companyId) ? getDemoPickingByKey(key) : null;

  if (!row) {
    return (
      <LogstokaDetailPageLayout backTo="/app/picking" title="Separação" subtitle="Item não encontrado">
        <div className="ls-card text-sm text-slate-500">Item de picking não encontrado.</div>
      </LogstokaDetailPageLayout>
    );
  }

  return (
    <LogstokaDetailPageLayout
      backTo="/app/picking"
      backLabel="Voltar para separação"
      title={row.name}
      subtitle={`SKU ${row.sku} · ${MARKETPLACE_LABELS[row.marketplace as keyof typeof MARKETPLACE_LABELS] ?? row.marketplace}`}
      actions={
        <>
          <button type="button" className="ls-btn-secondary" onClick={() => toast.success('[Demo] Lista de separação impressa')}>
            <Printer size={16} />
            Imprimir picking list
          </button>
          <button type="button" className="ls-btn-primary" onClick={() => toast.success('[Demo] Separação confirmada — baixa no estoque')}>
            <PackageCheck size={16} />
            Confirmar separação / baixa
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ['SKU', row.sku],
          ['Loja', row.store || '—'],
          ['Quantidade a separar', `${row.quantity} un.`],
          ['Canal', MARKETPLACE_LABELS[row.marketplace as keyof typeof MARKETPLACE_LABELS] ?? row.marketplace],
        ].map(([label, value]) => (
          <div key={String(label)} className="ls-card py-4">
            <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
            <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </LogstokaDetailPageLayout>
  );
};

export default PickingDetailPage;
