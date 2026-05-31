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
import { useLogstokaWarehouseScope } from '@/context/LogstokaWarehouseScopeContext';
import { useWarehouses } from '@/hooks/useCatalog';
import { logstokaApi } from '@/lib/logstokaApi';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { type DemoInventoryRow } from '@/lib/logstokaDemoSeed';
import {
  loadMergedDemoInventories,
  mapSupabaseInventoryRow,
  updateDemoInventoryItemCount,
} from '@/lib/demoInventoryStore';
import { recordInventoryItemConference } from '@/lib/activityRecording';
import { can } from '@/lib/permissions';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { countPendingDivergences } from '@/lib/conferenceDivergences';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import InventoryGuidedModal from './InventoryGuidedModal';
import InventoryItemConferenceModal, { type InventoryConferenceItem } from './InventoryItemConferenceModal';
import {
  buildInventoryConferenceItem,
  filterInventoryAuditEvents,
  formatInventoryAuditRows,
  getActivityActor,
} from './inventoryConferenceUtils';
import {
  buildInventorySnapshot,
  exportInventoryCsv,
  printInventoryList,
  resolveInventoryShareScope,
} from './inventoryTableUtils';
import './inventoryItemConference.css';

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const { visibleWarehouses, assignedWarehouseId, isGlobalView } = useLogstokaWarehouseScope();
  const demo = isLogstokaDemoCompany(companyId);
  const actor = useMemo(() => getActivityActor(profile), [profile]);
  const { warehouses, reload: reloadWarehouses } = useWarehouses();
  const scopedWarehouses = isGlobalView ? warehouses : visibleWarehouses;
  const [inventories, setInventories] = useState<DemoInventoryRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>('inv-1');
  const [warehouseId, setWarehouseId] = useState(() => searchParams.get('warehouse') ?? '');
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [kpiModal, setKpiModal] = useState<{ label: string; value: string | number } | null>(null);
  const [conferenceItem, setConferenceItem] = useState<InventoryConferenceItem | null>(null);
  const [auditTick, setAuditTick] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const canApprove = can('inventory.approve', profile?.role);

  const load = useCallback(async () => {
    if (!companyId) return;
    if (demo) {
      setInventories(loadMergedDemoInventories(companyId));
      return;
    }
    const { data } = await supabase
      .from('ls_inventories')
      .select('*, ls_warehouses(name), ls_inventory_items(*, ls_products(sku, name))')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20);
    setInventories((data ?? []).map((row) => mapSupabaseInventoryRow(row as Record<string, unknown>)));
  }, [companyId, demo]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      void load();
      void reloadWarehouses();
    };
    window.addEventListener('logstoka:system-pulse', refresh);
    window.addEventListener('logstoka:demo-inventories-updated', refresh);
    window.addEventListener('logstoka:activity-recorded', refresh);
    return () => {
      window.removeEventListener('logstoka:system-pulse', refresh);
      window.removeEventListener('logstoka:demo-inventories-updated', refresh);
      window.removeEventListener('logstoka:activity-recorded', refresh);
    };
  }, [load, reloadWarehouses]);

  useEffect(() => {
    const fromUrl = searchParams.get('warehouse');
    if (fromUrl && scopedWarehouses.some((w) => w.id === fromUrl)) {
      setWarehouseId(fromUrl);
      return;
    }
    if (assignedWarehouseId && scopedWarehouses.some((w) => w.id === assignedWarehouseId)) {
      setWarehouseId(assignedWarehouseId);
      return;
    }
    setWarehouseId((prev) => {
      if (prev && scopedWarehouses.some((w) => w.id === prev)) return prev;
      return scopedWarehouses[0]?.id ?? '';
    });
  }, [scopedWarehouses, searchParams, companyId, assignedWarehouseId]);

  useEffect(() => {
    if (!warehouseId) return;
    const wh = scopedWarehouses.find((w) => w.id === warehouseId);
    if (!wh) return;
    const match = inventories.find((inv) => inv.warehouse_name === wh.name);
    if (match) setActiveId(match.id);
  }, [warehouseId, scopedWarehouses, inventories]);

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
    activeItems,
    (item) => item.id,
  );

  const scopedItems = useMemo(
    () => resolveInventoryShareScope(activeItems, selectedKeys),
    [activeItems, selectedKeys],
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
    if (!active || !companyId) return;
    const item = active.ls_inventory_items.find((row) => row.id === itemId);
    if (!item) return;
    updateDemoInventoryItemCount(companyId, active.id, itemId, counted, Number(item.system_quantity), actor);
    void load();
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

  const skuAudit = useMemo(() => {
    if (!conferenceItem?.sku) return [];
    void auditTick;
    return formatInventoryAuditRows(
      filterInventoryAuditEvents(companyId, conferenceItem.inventoryId, conferenceItem.sku),
    );
  }, [auditTick, companyId, conferenceItem]);

  const openConference = (item: DemoInventoryRow['ls_inventory_items'][number]) => {
    if (!active) return;
    setConferenceItem(buildInventoryConferenceItem(active, item));
  };

  const handleConferenceSave = async (
    value: number,
    status: 'correct' | 'wrong',
    justification?: string,
  ) => {
    if (!conferenceItem || !active) return;
    const item = activeItems.find((row) => row.id === conferenceItem.itemId);
    if (!item) return;

    await guidedCountItem(item, value);

    const matched = value === Number(item.system_quantity) && status === 'correct';
    recordInventoryItemConference(
      { companyId, actorName: actor.name, actorId: actor.id },
      {
        inventoryId: active.id,
        warehouseName: active.warehouse_name,
        sku: conferenceItem.sku,
        productName: conferenceItem.productName,
        systemQty: conferenceItem.systemQuantity,
        countedQty: value,
        matched,
        justification,
      },
    );

    if (!matched) {
      toast('Divergência registrada na Central de Atividades.', { icon: '⚠️' });
    } else {
      toast.success('Contagem confirmada · bateu certinho');
    }

    setConferenceItem(null);
    setAuditTick((tick) => tick + 1);
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
        label: selectedCount > 0 ? `Imprimir ${selectedCount} selecionado(s)` : 'Imprimir lista',
        icon: <Printer size={18} strokeWidth={2} />,
        onClick: () => {
          if (!active) return;
          printInventoryList({
            title: `Inventário · ${active.warehouse_name}`,
            warehouseName: active.warehouse_name,
            items: scopedItems,
            operatorName: actor.name,
            scopeNote: selectedCount > 0 ? `${selectedCount} SKU(s) selecionado(s)` : 'Lista completa',
          });
        },
        separatorBefore: true,
        disabled: scopedItems.length === 0,
      },
      {
        key: 'export',
        label: 'Exportar CSV',
        icon: <Download size={18} strokeWidth={2} />,
        onClick: () => {
          if (!active) return;
          exportInventoryCsv(
            scopedItems,
            `inventario-${active.warehouse_name.replace(/\s+/g, '-').toLowerCase()}.csv`,
          );
          toast.success(`CSV exportado · ${scopedItems.length} linha(s)`);
        },
        disabled: scopedItems.length === 0,
      },
      {
        key: 'share',
        label: selectedCount > 0 ? `Compartilhar ${selectedCount} selecionado(s)` : 'Compartilhar',
        icon: <Share2 size={18} strokeWidth={2} />,
        onClick: () => setShareModalOpen(true),
        disabled: scopedItems.length === 0,
      },
  ];

  const warehouseSelect = (
    <select
      className="ls-input w-auto min-w-[180px]"
      value={warehouseId}
      onChange={(e) => setWarehouseId(e.target.value)}
      aria-label="Depósito"
      disabled={scopedWarehouses.length === 0 || (!isGlobalView && scopedWarehouses.length === 1)}
    >
      {scopedWarehouses.length === 0 ? (
        <option value="">Nenhum CD autorizado</option>
      ) : (
        scopedWarehouses.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))
      )}
    </select>
  );

  return (
    <div className="space-y-6">
      <LogstokaPageHeader
        icon={<ClipboardList size={20} strokeWidth={2.25} />}
        trailing={warehouseSelect}
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

      <div className="space-y-4">
        {inventories.length > 0 ? (
          <section className="space-y-2">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#828282]">Histórico do dia</h3>
            <div className="flex flex-wrap gap-2">
              {inventories.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => {
                    setActiveId(inv.id);
                    navigate(`/app/inventory/${inv.id}`);
                  }}
                  className={`rounded-full border px-4 py-2 text-left text-sm transition ${
                    activeId === inv.id
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-slate-200 bg-white hover:border-orange-200'
                  }`}
                >
                  <span className="font-bold text-[#383838]">{inv.warehouse_name}</span>
                  <span className="ml-2 text-xs text-[#828282]">
                    {new Date(inv.created_at).toLocaleDateString('pt-BR')} · {inv.inventory_type} · {inv.status}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

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
      </div>

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
                  <th>Colaborador</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {activeItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-500">
                      Nenhum item neste inventário.
                    </td>
                  </tr>
                ) : null}
                {paginatedItems.map((item) => {
                  const selected = selectedKeys.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`cursor-pointer hover:bg-orange-50/40${selected ? ' ls-table-row--selected' : ''}`}
                      onClick={() => openConference(item)}
                    >
                      <td onClick={(event) => event.stopPropagation()}>
                        <LogstokaTableCheckbox
                          checked={selected}
                          onChange={() => toggleSelect(item.id)}
                          ariaLabel={`Selecionar ${item.ls_products?.sku ?? item.id}`}
                        />
                      </td>
                      <td className="font-bold text-orange-700">{item.ls_products?.sku}</td>
                      <td>{item.ls_products?.name}</td>
                      <td>{active.warehouse_name ?? '—'}</td>
                      <td>{item.system_quantity}</td>
                      <td>{item.counted_quantity ?? '—'}</td>
                      <td className={Number(item.difference) !== 0 ? 'font-bold text-amber-600' : ''}>
                        {item.difference ?? '—'}
                      </td>
                      <td className="text-xs text-[#737373]">{item.last_actor_name ?? '—'}</td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <LogstokaIconNavButton
                          title="Conferir item"
                          accent
                          onClick={() => openConference(item)}
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

      <InventoryGuidedModal
        open={guidedOpen}
        inventory={active ?? null}
        onClose={() => setGuidedOpen(false)}
        onConfirmCount={guidedCountItem}
      />

      <InventoryItemConferenceModal
        open={Boolean(conferenceItem)}
        item={conferenceItem}
        actorName={actor.name}
        recentAudit={skuAudit}
        onClose={() => setConferenceItem(null)}
        onSave={(value, status, justification) => void handleConferenceSave(value, status, justification)}
      />

      <LogstokaKpiAdjustModal
        open={Boolean(kpiModal)}
        title="Conferir inventário"
        label={kpiModal?.label ?? ''}
        currentValue={kpiModal?.value ?? 0}
        subtitle="Informe a quantidade contada e marque se confere com o sistema"
        onClose={() => setKpiModal(null)}
        onSave={() => setKpiModal(null)}
      />

      <LogstokaShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        resourceType="inventory"
        resourceId={active?.id || 'inv-1'}
        resourceName={
          selectedCount > 0 && active
            ? `${active.warehouse_name} · ${selectedCount} SKU(s)`
            : active?.warehouse_name || 'Lista de Inventário'
        }
        snapshotData={buildInventorySnapshot(scopedItems)}
      />
    </div>
  );
};

export default InventoryPage;
