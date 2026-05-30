import React from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { getDemoInventoryById } from '@/lib/logstokaDemoSeed';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useTablePagination } from '@/hooks/useTablePagination';

const InventoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { companyId } = useLogstokaTenant();
  const inv = id && isLogstokaDemoCompany(companyId) ? getDemoInventoryById(id) : null;
  const items = inv?.ls_inventory_items ?? [];
  const { paginatedItems, footerProps } = useTablePagination(items);

  if (!inv) {
    return (
      <LogstokaDetailPageLayout backTo="/app/inventory" title="Inventário" subtitle="Registro não encontrado">
        <div className="ls-card text-sm text-slate-500">Inventário não encontrado.</div>
      </LogstokaDetailPageLayout>
    );
  }

  return (
    <LogstokaDetailPageLayout
      backTo="/app/inventory"
      backLabel="Voltar para inventários"
      title={`Inventário · ${inv.warehouse_name}`}
      subtitle={`${inv.inventory_type} · ${inv.status}`}
      actions={
        inv.status === 'review' ? (
          <button type="button" className="ls-btn-primary" onClick={() => toast.success('[Demo] Inventário aprovado')}>
            <CheckCircle2 size={16} />
            Aprovar e ajustar estoque
          </button>
        ) : null
      }
    >
      <div className="ls-table-wrap">
        <table className="ls-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Produto</th>
              <th>Sistema</th>
              <th>Contado</th>
              <th>Diferença</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => (
              <tr key={item.id}>
                <td className="font-bold">{item.ls_products?.sku}</td>
                <td>{item.ls_products?.name}</td>
                <td>{item.system_quantity}</td>
                <td>{item.counted_quantity ?? '—'}</td>
                <td className={Number(item.difference) !== 0 ? 'font-bold text-amber-600' : ''}>
                  {item.difference ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <LogstokaTableFooter {...footerProps} />
    </LogstokaDetailPageLayout>
  );
};

export default InventoryDetailPage;
