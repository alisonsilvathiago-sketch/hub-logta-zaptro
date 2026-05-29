import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { MARKETPLACE_LABELS } from '@/types';

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
          for (const item of (mov as { ls_stock_movement_items?: Array<{ sku: string; quantity: number; ls_products?: { name: string } }> }).ls_stock_movement_items ?? []) {
            const key = `${item.sku}-${mov.marketplace}-${mov.reference_code}`;
            const existing = map.get(key);
            if (existing) existing.quantity += Number(item.quantity);
            else {
              map.set(key, {
                sku: item.sku,
                name: item.ls_products?.name ?? item.sku,
                marketplace: mov.marketplace,
                store: mov.reference_code,
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
        <h2 className="text-2xl font-black">Separação de Pedidos</h2>
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
            {rows.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Sem saídas hoje — importe relatório ou conecte webhook.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={`${r.sku}-${r.marketplace}-${r.store}`}>
                <td className="font-bold">{r.sku}</td>
                <td>{r.name}</td>
                <td>{r.marketplace ? MARKETPLACE_LABELS[r.marketplace as keyof typeof MARKETPLACE_LABELS] : '—'}</td>
                <td>{r.store || '—'}</td>
                <td className="font-black text-emerald-700">{r.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PickingPage;
