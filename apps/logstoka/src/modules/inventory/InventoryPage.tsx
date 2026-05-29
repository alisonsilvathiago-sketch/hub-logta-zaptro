import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useWarehouses } from '@/hooks/useCatalog';
import { logstokaApi } from '@/lib/logstokaApi';
import BarcodeScanner from '@/components/ui/BarcodeScanner';
import { can } from '@/lib/permissions';
import { useAuth } from '@shared/context/AuthContext';

interface InventoryRow {
  id: string;
  inventory_type: string;
  status: string;
  created_at: string;
  ls_warehouses?: { name: string };
  ls_inventory_items?: Array<{
    id: string;
    product_id: string;
    system_quantity: number;
    counted_quantity?: number | null;
    difference?: number;
    ls_products?: { sku: string; name: string };
  }>;
}

const InventoryPage: React.FC = () => {
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const { warehouses } = useWarehouses();
  const [inventories, setInventories] = useState<InventoryRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [scanQty, setScanQty] = useState(1);
  const canApprove = can('inventory.approve', profile?.role);

  const load = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase
      .from('ls_inventories')
      .select('*, ls_warehouses(name), ls_inventory_items(*, ls_products(sku, name))')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20);
    setInventories((data ?? []) as InventoryRow[]);
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const startInventory = async (type: 'rotating' | 'general') => {
    if (!warehouseId) {
      toast.error('Selecione um depósito');
      return;
    }
    try {
      const res = await logstokaApi.createInventory({ warehouse_id: warehouseId, inventory_type: type });
      toast.success('Inventário iniciado');
      setActiveId((res as { data: { id: string } }).data.id);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const countItem = async (sku: string) => {
    if (!activeId) {
      toast.error('Inicie ou selecione um inventário');
      return;
    }
    try {
      await logstokaApi.countInventory(activeId, { sku, counted_quantity: scanQty });
      toast.success(`Contagem registrada: ${sku}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const approve = async (id: string) => {
    try {
      const res = await logstokaApi.approveInventory(id);
      toast.success(`Inventário ajustado — ${(res as { adjusted: number }).adjusted} diferenças`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const active = inventories.find((i) => i.id === activeId) ?? inventories[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">Inventário</h2>
        <p className="text-sm text-slate-500">Contagem → diferenças → aprovação → ajuste automático</p>
      </div>

      <div className="ls-card grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="ls-label">Depósito</label>
          <select className="ls-input" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
            <option value="">Selecione</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" className="ls-btn-primary" onClick={() => void startInventory('rotating')}>Inventário rotativo</button>
          <button type="button" className="ls-btn-secondary" onClick={() => void startInventory('general')}>Inventário geral</button>
        </div>
      </div>

      {active && (
        <>
          <BarcodeScanner onScan={(sku) => void countItem(sku)} placeholder="SKU para contagem" />
          <div className="flex gap-2">
            <input className="ls-input w-24" type="number" min={0} value={scanQty} onChange={(e) => setScanQty(Number(e.target.value))} />
            {canApprove && active.status === 'review' && (
              <button type="button" className="ls-btn-primary" onClick={() => void approve(active.id)}>
                Aprovar e ajustar estoque
              </button>
            )}
          </div>

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
                {(active.ls_inventory_items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.ls_products?.sku}</td>
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
        </>
      )}

      <div className="space-y-2">
        <h3 className="font-black">Histórico</h3>
        {inventories.map((inv) => (
          <button
            key={inv.id}
            type="button"
            onClick={() => setActiveId(inv.id)}
            className={`block w-full rounded-xl border px-4 py-3 text-left ${activeId === inv.id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}
          >
            <span className="font-bold">{inv.ls_warehouses?.name}</span>
            <span className="ml-2 text-xs text-slate-500">{inv.inventory_type} · {inv.status}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default InventoryPage;
