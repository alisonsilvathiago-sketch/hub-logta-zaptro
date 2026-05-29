import React, { useEffect, useState } from 'react';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_PICKING, pickingDetailKey } from '@/lib/logstokaDemoSeed';
import ClickableTableRow from '@/components/ui/ClickableTableRow';
import { MARKETPLACE_LABELS } from '@/types';
import { supabase } from '@/lib/supabase';

interface PickRow {
  sku: string;
  name: string;
  marketplace?: string | null;
  store?: string | null;
  quantity: number;
}

const PickingPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const [rows, setRows] = useState<PickRow[]>([]);

  useEffect(() => {
    if (!companyId) return;
    if (isLogstokaDemoCompany(companyId)) {
      setRows(DEMO_PICKING);
      return;
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    void supabase
      .from('ls_stock_movements')
      .select('marketplace, reference_code, ls_stock_movement_items(sku, quantity, ls_products(name))')
      .eq('company_id', companyId)
      .eq('movement_type', 'exit')
      .gte('created_at', start.toISOString())
      .then(({ data }) => {
        const map = new Map<string, PickRow>();
        for (const mov of data ?? []) {
          const movement = mov as unknown as {
            marketplace?: string | null;
            reference_code?: string | null;
            ls_stock_movement_items?: Array<{ sku: string; quantity: number; ls_products?: { name?: string } | null }>;
          };
          for (const item of movement.ls_stock_movement_items ?? []) {
            const key = `${item.sku}-${movement.marketplace}-${movement.reference_code}`;
            const existing = map.get(key);
            if (existing) existing.quantity += Number(item.quantity);
            else {
              map.set(key, {
                sku: item.sku,
                name: item.ls_products?.name ?? item.sku,
                marketplace: movement.marketplace,
                store: movement.reference_code,
                quantity: Number(item.quantity),
              });
            }
          }
        }
        setRows([...map.values()].sort((a, b) => b.quantity - a.quantity));
      });
  }, [companyId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className={LOGSTOKA_PAGE_TITLE_CLASS}>Separação de Pedidos</h2>
        <p className="text-sm text-slate-500">Lista de picking agrupada por SKU e canal — hoje</p>
      </div>

      <div className="ls-table-wrap">
        <table className="ls-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Produto</th>
              <th>Marketplace</th>
              <th>Loja</th>
              <th>Qtd. a separar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <ClickableTableRow key={`${r.sku}-${r.marketplace}-${r.store}`} to={`/app/picking/${pickingDetailKey(r)}`}>
                <td className="font-bold">{r.sku}</td>
                <td>{r.name}</td>
                <td>{r.marketplace ? MARKETPLACE_LABELS[r.marketplace as keyof typeof MARKETPLACE_LABELS] : '—'}</td>
                <td>{r.store || '—'}</td>
                <td className="font-black text-orange-700">{r.quantity}</td>
              </ClickableTableRow>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PickingPage;
