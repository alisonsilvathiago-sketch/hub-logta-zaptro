import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import MovementScanSection from '@/components/movements/MovementScanSection';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useIntelligentScanState } from '@/hooks/useIntelligentScanState';
import { useTablePagination } from '@/hooks/useTablePagination';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useWarehouses } from '@/hooks/useCatalog';
import { logstokaApi } from '@/lib/logstokaApi';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_INVENTORIES, type DemoInventoryRow } from '@/lib/logstokaDemoSeed';
import type { ProductLookupResult } from '@/lib/productLookup';
import { can } from '@/lib/permissions';
import { useAuth } from '@/context/LogstokaAuthProvider';

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const demo = isLogstokaDemoCompany(companyId);
  const { warehouses } = useWarehouses();
  const [inventories, setInventories] = useState<DemoInventoryRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>('inv-1');
  const [warehouseId, setWarehouseId] = useState('wh-4');
  const [registering, setRegistering] = useState(false);
  const canApprove = can('inventory.approve', profile?.role);

  const scan = useIntelligentScanState(companyId, demo, 'entry');

  const load = useCallback(async () => {
    if (!companyId) return;
    if (demo) {
      setInventories(DEMO_INVENTORIES);
      return;
    }
    const { data } = await supabase
      .from('ls_inventories')
      .select('*, ls_warehouses(name), ls_inventory_items(*, ls_products(sku, name))')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20);
    setInventories((data ?? []) as DemoInventoryRow[]);
  }, [companyId, demo]);

  useEffect(() => {
    void load();
  }, [load]);

  const startInventory = async (type: 'rotating' | 'general') => {
    if (!warehouseId) {
      toast.error('Selecione um depósito');
      return;
    }
    if (demo) {
      toast.success(`[Demo] Inventário ${type} iniciado`);
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
    if (demo) {
      toast.success(`[Demo] Contagem: ${sku} × ${scan.quantity}`);
      scan.clearScan();
      return;
    }
    try {
      await logstokaApi.countInventory(activeId, { sku, counted_quantity: scan.quantity });
      toast.success(`Contagem registrada: ${sku}`);
      scan.clearScan();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const approve = async (id: string) => {
    if (demo) {
      toast.success('[Demo] Inventário aprovado e estoque ajustado');
      return;
    }
    try {
      const res = await logstokaApi.approveInventory(id);
      toast.success(`Inventário ajustado — ${(res as { adjusted: number }).adjusted} diferenças`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const active = inventories.find((i) => i.id === activeId) ?? inventories[0];
  const activeItems = active?.ls_inventory_items ?? [];
  const { paginatedItems, footerProps } = useTablePagination(activeItems, 10, activeId);

  const kpis = useMemo(() => {
    const diffs = activeItems.filter((item) => Number(item.difference) !== 0).length;
    const counted = activeItems.filter((item) => item.counted_quantity != null).length;
    return {
      open: inventories.filter((inv) => inv.status !== 'completed').length,
      items: activeItems.length,
      counted,
      diffs,
    };
  }, [activeItems, inventories]);

  const handleRegister = () => {
    const sku = scan.resolvedSku();
    if (!sku) {
      toast.error('Leia ou digite um código primeiro');
      return;
    }
    setRegistering(true);
    void countItem(sku).finally(() => setRegistering(false));
  };

  const handleUseExisting = (product: ProductLookupResult) => {
    void countItem(product.sku);
  };

  return (
    <div className="space-y-6">
      <MovementScanSection
        companyId={companyId}
        demo={demo}
        scanMode={scan.scanMode}
        onScanModeChange={scan.setScanMode}
        scanValue={scan.scanValue}
        onScanValueChange={(value) => {
          scan.setScanValue(value);
          toast.success(`Código lido: ${value}`);
        }}
        onClearScan={scan.clearScan}
        quantity={scan.quantity}
        onQuantityChange={scan.setQuantity}
        resolvedProduct={scan.resolvedProduct}
        resolving={scan.resolving}
        interpreting={scan.interpreting}
        scanInterpretation={scan.scanInterpretation}
        movementLabel="Inventário"
        pageTitleIcon={<ClipboardCheck size={20} strokeWidth={2.25} aria-hidden />}
        headerActions={
          <div className="flex flex-wrap items-center gap-2">
            <select className="ls-input w-auto min-w-[180px]" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              <option value="">Depósito</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <button type="button" className="ls-btn-primary px-3 py-2 text-sm" onClick={() => void startInventory('rotating')}>
              Rotativo
            </button>
            <button type="button" className="ls-btn-secondary px-3 py-2 text-sm" onClick={() => void startInventory('general')}>
              Geral
            </button>
          </div>
        }
        onRegister={handleRegister}
        onUseExisting={handleUseExisting}
        registering={registering}
      />

      <LogstokaKpiStrip
        items={[
          { label: 'Inventários abertos', value: kpis.open },
          { label: 'Itens no ativo', value: kpis.items },
          { label: 'Contados', value: kpis.counted },
          { label: 'Diferenças', value: kpis.diffs },
        ]}
      />

      {active ? (
        <section className="ls-page-table space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <h3 className="text-[15px] font-black uppercase tracking-widest text-[#828282]">
                {active.warehouse_name ?? 'Inventário ativo'}
              </h3>
              <p className="mt-1 text-sm text-[#a3a3a3]">
                {active.inventory_type} · {active.status}
              </p>
            </div>
            {canApprove && active.status === 'review' ? (
              <button type="button" className="ls-btn-primary" onClick={() => void approve(active.id)}>
                Aprovar e ajustar estoque
              </button>
            ) : null}
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
                {activeItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Nenhum item neste inventário.
                    </td>
                  </tr>
                ) : null}
                {paginatedItems.map((item) => (
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
          <LogstokaTableFooter {...footerProps} hidden={activeItems.length === 0} />
        </section>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-[15px] font-black uppercase tracking-widest text-[#828282]">Histórico</h3>
        {inventories.map((inv) => (
          <button
            key={inv.id}
            type="button"
            onClick={() => {
              setActiveId(inv.id);
              navigate(`/app/inventory/${inv.id}`);
            }}
            className={`block w-full rounded-[20px] border px-4 py-3 text-left transition ${
              activeId === inv.id ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-200'
            }`}
          >
            <span className="font-bold text-[#383838]">{inv.warehouse_name}</span>
            <span className="ml-2 text-xs text-[#828282]">
              {inv.inventory_type} · {inv.status}
            </span>
          </button>
        ))}
      </section>
    </div>
  );
};

export default InventoryPage;
