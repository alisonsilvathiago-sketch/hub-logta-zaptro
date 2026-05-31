import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BadgeCheck,
  ClipboardCheck,
  ClipboardList,
  Download,
  ListChecks,
  Printer,
  RefreshCw,
  RotateCw,
  Share2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaKpiAdjustModal from '@/components/layout/LogstokaKpiAdjustModal';
import LogstokaIconNav, { LogstokaIconNavButton } from '@/components/ui/LogstokaIconNav';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import LogstokaTableCheckbox from '@/components/ui/LogstokaTableCheckbox';
import LogstokaTableFilterBar from '@/components/ui/LogstokaTableFilterBar';
import LogstokaShareModal from '@/components/sharing/LogstokaShareModal';
import LogstokaTableIconToolbar, { type LogstokaToolbarAction } from '@/components/ui/LogstokaTableIconToolbar';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useRowSelection } from '@/hooks/useRowSelection';
import { supabase } from '@/lib/supabase';
import { showLogstokaBanner } from '@/lib/logstokaBanner';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useWarehouses } from '@/hooks/useCatalog';
import { logstokaApi } from '@/lib/logstokaApi';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_INVENTORIES, type DemoInventoryRow } from '@/lib/logstokaDemoSeed';
import { can } from '@/lib/permissions';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { countPendingDivergences } from '@/lib/conferenceDivergences';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import InventoryGuidedModal from './InventoryGuidedModal';

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const demo = isLogstokaDemoCompany(companyId);
  const { warehouses } = useWarehouses();
  const [inventories, setInventories] = useState<DemoInventoryRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>('inv-1');
  const [warehouseId, setWarehouseId] = useState(searchParams.get('warehouse') ?? 'wh-4');
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [kpiModal, setKpiModal] = useState<{ label: string; value: string | number } | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const canApprove = can('inventory.approve', profile?.role);

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

  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener('logstoka:system-pulse', refresh);
    return () => window.removeEventListener('logstoka:system-pulse', refresh);
  }, [load]);

  useEffect(() => {
    const wh = searchParams.get('warehouse');
    if (wh) setWarehouseId(wh);
  }, [searchParams]);

  useEffect(() => {
    if (!warehouseId) return;
    const wh = warehouses.find((w) => w.id === warehouseId);
    if (!wh) return;
    const match = inventories.find((inv) => inv.warehouse_name === wh.name);
    if (match) setActiveId(match.id);
  }, [warehouseId, warehouses, inventories]);

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

  const approve = async (id: string) => {
    if (demo) {
      showLogstokaBanner({
        type: 'success',
        title: 'Inventário aprovado',
        description: 'Controle de contagem de inventário aprovado e estoque ajustado com sucesso em modo demonstração.',
        actionPath: `/app/inventory/${id}`,
      });
      return;
    }
    try {
      const res = await logstokaApi.approveInventory(id);
      const adjusted = (res as { adjusted: number }).adjusted;
      showLogstokaBanner({
        type: 'success',
        title: 'Inventário aprovado',
        description: `Controle de contagem de inventário aprovado com sucesso. Total de ${adjusted} diferença(s) aplicada(s) ao estoque geral WMS.`,
        actionPath: `/app/inventory/${id}`,
      });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const active = inventories.find((i) => i.id === activeId) ?? inventories[0];
  const activeItems = active?.ls_inventory_items ?? [];
  const { paginatedItems, footerProps } = useTablePagination(activeItems, 10, activeId);
  const { selectedKeys, toggleSelect, toggleSelectAll, isAllSelected, selectedCount } = useRowSelection(
    paginatedItems,
    (item) => item.id,
  );

  const todayLabel = useMemo(() => new Date().toLocaleDateString('pt-BR'), []);

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

  const updateDemoItemCount = (itemId: string, counted: number) => {
    if (!active) return;
    setInventories((prev) =>
      prev.map((inv) => {
        if (inv.id !== active.id) return inv;
        return {
          ...inv,
          ls_inventory_items: inv.ls_inventory_items.map((item) => {
            if (item.id !== itemId) return item;
            const difference = counted - Number(item.system_quantity);
            return { ...item, counted_quantity: counted, difference };
          }),
        };
      }),
    );
  };

  const guidedCountItem = async (item: DemoInventoryRow['ls_inventory_items'][number], quantity: number) => {
    const sku = item.ls_products?.sku;
    if (!sku) return;
    if (demo) {
      updateDemoItemCount(item.id, quantity);
      toast.success(`Contagem registrada: ${sku} · ${quantity} un.`);
      return;
    }
    if (!activeId) return;
    await logstokaApi.countInventory(activeId, { sku, counted_quantity: quantity });
    toast.success(`Contagem registrada: ${sku}`);
    await load();
  };

  const pendingDivergences = countPendingDivergences(companyId);

  const tableToolbarActions: LogstokaToolbarAction[] = [
    {
      key: 'refresh',
      label: 'Atualizar inventário',
      icon: <RefreshCw size={18} strokeWidth={2} />,
      onClick: () => void load(),
    },
    {
      key: 'guided',
      label: 'Contagem guiada contínua',
      icon: <ListChecks size={18} strokeWidth={2} />,
      onClick: () => setGuidedOpen(true),
      accent: true,
      disabled: activeItems.length === 0,
    },
    {
      key: 'approve',
      label: 'Aprovar e ajustar estoque',
      icon: <BadgeCheck size={18} strokeWidth={2} />,
      onClick: () => active && void approve(active.id),
      hidden: !(canApprove && active?.status === 'review'),
      separatorBefore: true,
    },
    {
      key: 'pending',
      label: `Pendências (${pendingDivergences})`,
      icon: <ClipboardCheck size={18} strokeWidth={2} />,
      onClick: () => navigate(LOGSTOKA_ROUTES.CONFERENCE_PENDING),
      hidden: pendingDivergences <= 0,
    },
    {
      key: 'print',
      label: 'Imprimir lista',
      icon: <Printer size={18} strokeWidth={2} />,
      onClick: () => toast('Imprimir inventário ativo'),
      separatorBefore: true,
    },
    {
      key: 'export',
      label: 'Exportar CSV',
      icon: <Download size={18} strokeWidth={2} />,
      onClick: () => toast('Exportação CSV do inventário'),
    },
    {
      key: 'share',
      label: 'Compartilhar',
      icon: <Share2 size={18} strokeWidth={2} />,
      onClick: () => setShareModalOpen(true),
    },
  ];

  const warehouseSelect = (
    <select
      className="ls-input w-auto min-w-[180px]"
      value={warehouseId}
      onChange={(e) => setWarehouseId(e.target.value)}
      aria-label="Depósito"
    >
      <option value="">Depósito</option>
      {warehouses.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      <LogstokaPageHeader
        icon={<ClipboardList size={20} strokeWidth={2.25} />}
        leading={warehouseSelect}
        title="Inventário"
        subtitle="Contagem física contínua — conferência por SKU, rua e depósito. Atualização automática ao registrar."
        actions={
          <LogstokaIconNav
            aria-label="Tipo de inventário"
            variant="inline"
            items={[
              {
                type: 'button',
                key: 'rotating',
                label: 'Inventário rotativo',
                icon: <RotateCw size={18} strokeWidth={2.2} aria-hidden />,
                onClick: () => void startInventory('rotating'),
              },
              {
                type: 'button',
                key: 'general',
                label: 'Inventário geral',
                icon: <ClipboardList size={18} strokeWidth={2.2} aria-hidden />,
                onClick: () => void startInventory('general'),
              },
            ]}
          />
        }
      />

      <LogstokaKpiStrip
        items={[
          {
            label: 'Inventários abertos',
            value: kpis.open,
            onClick: () => setKpiModal({ label: 'Inventários abertos', value: kpis.open }),
          },
          {
            label: 'Itens no ativo',
            value: kpis.items,
            onClick: () => setGuidedOpen(true),
          },
          {
            label: 'Contados',
            value: kpis.counted,
            onClick: () => setKpiModal({ label: 'Contados', value: kpis.counted }),
          },
          {
            label: 'Diferenças',
            value: kpis.diffs,
            onClick: () => setKpiModal({ label: 'Diferenças', value: kpis.diffs }),
          },
          { label: 'Hoje', value: todayLabel },
        ]}
      />

      {active ? (
        <section className="ls-entry-card ls-page-table">
          <div className="ls-entry-card__head pb-2">
            <div>
              <h2 className="ls-entry-card__title">{active.warehouse_name ?? 'Inventário ativo'}</h2>
              <p className="ls-entry-card__desc">
                {active.inventory_type} · {active.status}
                {selectedCount > 0 ? ` · ${selectedCount} selecionado(s)` : ''}
              </p>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
            <div className="flex-1 w-full max-w-2xl">
              <LogstokaTableFilterBar
                placeholder="Pesquisar itens do inventário por código ou SKU..."
                onSearch={(query) => {
                  toast.success(`Itens do inventário filtrados por: "${query}"`);
                }}
              />
            </div>
            <div className="shrink-0 flex items-center ml-auto">
              <LogstokaTableIconToolbar actions={tableToolbarActions} ariaLabel="Ações do inventário" />
            </div>
          </div>

          <div className="ls-table-wrap">
            <table className="ls-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <LogstokaTableCheckbox
                      checked={isAllSelected}
                      indeterminate={selectedCount > 0 && !isAllSelected}
                      onChange={toggleSelectAll}
                      ariaLabel="Selecionar todos os itens"
                    />
                  </th>
                  <th>SKU</th>
                  <th>Produto</th>
                  <th>Depósito</th>
                  <th>Sistema</th>
                  <th>Contado</th>
                  <th>Diferença</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {activeItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      Nenhum item neste inventário.
                    </td>
                  </tr>
                ) : null}
                {paginatedItems.map((item) => {
                  const selected = selectedKeys.has(item.id);
                  return (
                    <tr key={item.id} className={selected ? 'ls-table-row--selected' : undefined}>
                      <td>
                        <LogstokaTableCheckbox
                          checked={selected}
                          onChange={() => toggleSelect(item.id)}
                          ariaLabel={`Selecionar ${item.ls_products?.sku ?? item.id}`}
                        />
                      </td>
                      <td>{item.ls_products?.sku}</td>
                      <td>{item.ls_products?.name}</td>
                      <td>{active.warehouse_name ?? '—'}</td>
                      <td>{item.system_quantity}</td>
                      <td>{item.counted_quantity ?? '—'}</td>
                      <td className={Number(item.difference) !== 0 ? 'font-bold text-amber-600' : ''}>
                        {item.difference ?? '—'}
                      </td>
                      <td>
                        <LogstokaIconNavButton
                          title="Conferir item"
                          accent
                          onClick={() => setKpiModal({ label: item.ls_products?.sku ?? 'Item', value: item.counted_quantity ?? item.system_quantity })}
                        >
                          <ListChecks size={16} strokeWidth={2.2} />
                        </LogstokaIconNavButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <LogstokaTableFooter {...footerProps} hidden={activeItems.length === 0} />
        </section>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-[15px] font-black uppercase tracking-widest text-[#828282]">Histórico do dia</h3>
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
              {new Date(inv.created_at).toLocaleDateString('pt-BR')} · {inv.inventory_type} · {inv.status}
            </span>
          </button>
        ))}
      </section>

      <InventoryGuidedModal
        open={guidedOpen}
        inventory={active ?? null}
        onClose={() => setGuidedOpen(false)}
        onConfirmCount={guidedCountItem}
      />

      <LogstokaKpiAdjustModal
        open={Boolean(kpiModal)}
        title="Conferir inventário"
        label={kpiModal?.label ?? ''}
        currentValue={kpiModal?.value ?? 0}
        subtitle="Informe a quantidade contada e marque se confere com o sistema"
        onClose={() => setKpiModal(null)}
        onSave={(value, status) => {
          const item = activeItems.find((i) => i.ls_products?.sku === kpiModal?.label);
          if (item && demo) updateDemoItemCount(item.id, value);
          toast.success(
            status === 'correct'
              ? `${kpiModal?.label} conferido · ${value} un.`
              : `${kpiModal?.label} divergente · ${value} un.`,
          );
          setKpiModal(null);
        }}
      />

      <LogstokaShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        resourceType="inventory"
        resourceId={active?.id || 'inv-1'}
        resourceName={active?.warehouse_name || 'Lista de Inventário'}
        snapshotData={activeItems.map((item) => ({
          id: item.id,
          sku: item.ls_products?.sku,
          name: item.ls_products?.name,
          system_quantity: item.system_quantity,
          counted_quantity: item.counted_quantity,
          difference: item.difference
        }))}
      />
    </div>
  );
};

export default InventoryPage;
