import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Download,
  History,
  ListChecks,
  Printer,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import LogstokaShareModal from '@/components/sharing/LogstokaShareModal';
import LogstokaIconNav, { LogstokaIconNavButton } from '@/components/ui/LogstokaIconNav';
import LogstokaTableCheckbox from '@/components/ui/LogstokaTableCheckbox';
import LogstokaTableFilterBar from '@/components/ui/LogstokaTableFilterBar';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import LogstokaTableIconToolbar, { type LogstokaToolbarAction } from '@/components/ui/LogstokaTableIconToolbar';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import {
  recordInventoryApproved,
  recordInventoryItemConference,
} from '@/lib/activityRecording';
import {
  getDemoInventoryById,
  mapSupabaseInventoryRow,
  updateDemoInventoryItemCount,
} from '@/lib/demoInventoryStore';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import type { DemoInventoryRow } from '@/lib/logstokaDemoSeed';
import { showLogstokaBanner } from '@/lib/logstokaBanner';
import { logstokaApi } from '@/lib/logstokaApi';
import { can } from '@/lib/permissions';
import { countPendingDivergences } from '@/lib/conferenceDivergences';
import { pulseLogstokaSystem } from '@/lib/logstokaSystemPulse';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { supabase } from '@/lib/supabase';
import { useRowSelection } from '@/hooks/useRowSelection';
import { useTablePagination } from '@/hooks/useTablePagination';
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

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const InventoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const demo = isLogstokaDemoCompany(companyId);
  const canApprove = can('inventory.approve', profile?.role);
  const actor = useMemo(() => getActivityActor(profile), [profile]);

  const [inventory, setInventory] = useState<DemoInventoryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [conference, setConference] = useState<InventoryConferenceItem | null>(null);
  const [approving, setApproving] = useState(false);
  const [auditTick, setAuditTick] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id || !companyId) {
      setInventory(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (demo) {
        setInventory(getDemoInventoryById(companyId, id));
        return;
      }
      const { data, error } = await supabase
        .from('ls_inventories')
        .select('*, ls_warehouses(name), ls_inventory_items(*, ls_products(sku, name))')
        .eq('company_id', companyId)
        .eq('id', id)
        .maybeSingle();
      if (error || !data) {
        setInventory(null);
        return;
      }
      setInventory(mapSupabaseInventoryRow(data as Record<string, unknown>));
    } finally {
      setLoading(false);
    }
  }, [companyId, demo, id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      void load();
      setAuditTick((value) => value + 1);
    };
    window.addEventListener('logstoka:system-pulse', refresh);
    window.addEventListener('logstoka:demo-inventories-updated', refresh);
    window.addEventListener('logstoka:activity-recorded', refresh);
    return () => {
      window.removeEventListener('logstoka:system-pulse', refresh);
      window.removeEventListener('logstoka:demo-inventories-updated', refresh);
      window.removeEventListener('logstoka:activity-recorded', refresh);
    };
  }, [load]);

  const items = inventory?.ls_inventory_items ?? [];
  const { paginatedItems, footerProps } = useTablePagination(items, 10, inventory?.id);
  const { selectedKeys, toggleSelect, toggleSelectAll, isAllSelected, selectedCount } = useRowSelection(
    items,
    (item) => item.id,
  );

  const scopedItems = useMemo(
    () => resolveInventoryShareScope(items, selectedKeys),
    [items, selectedKeys],
  );

  const pendingDivergences = countPendingDivergences(companyId);

  const inventoryAudit = useMemo(() => {
    void auditTick;
    return formatInventoryAuditRows(filterInventoryAuditEvents(companyId, inventory?.id));
  }, [auditTick, companyId, inventory?.id]);

  const skuAudit = useMemo(() => {
    if (!conference?.sku) return [];
    void auditTick;
    return formatInventoryAuditRows(filterInventoryAuditEvents(companyId, inventory?.id, conference.sku));
  }, [auditTick, companyId, conference?.sku, inventory?.id]);

  const openConference = (item: DemoInventoryRow['ls_inventory_items'][number]) => {
    if (!inventory) return;
    setConference(buildInventoryConferenceItem(inventory, item));
  };

  const applyCount = useCallback(
    async (item: DemoInventoryRow['ls_inventory_items'][number], quantity: number) => {
      if (!inventory || !companyId) return;
      const sku = item.ls_products?.sku;
      if (!sku) return;

      if (demo) {
        updateDemoInventoryItemCount(
          companyId,
          inventory.id,
          item.id,
          quantity,
          Number(item.system_quantity),
          actor,
        );
        pulseLogstokaSystem();
        await load();
        return;
      }

      await logstokaApi.countInventory(inventory.id, { sku, counted_quantity: quantity });
      await load();
    },
    [actor, companyId, demo, inventory, load],
  );

  const handleConferenceSave = async (
    value: number,
    status: 'correct' | 'wrong',
    justification?: string,
  ) => {
    if (!inventory || !conference) return;
    const item = items.find((row) => row.id === conference.itemId);
    if (!item) return;

    const matched = value === Number(item.system_quantity) && status === 'correct';
    await applyCount(item, value);

    recordInventoryItemConference(
      { companyId, actorName: actor.name, actorId: actor.id },
      {
        inventoryId: inventory.id,
        warehouseName: inventory.warehouse_name,
        sku: conference.sku,
        productName: conference.productName,
        systemQty: conference.systemQuantity,
        countedQty: value,
        matched,
        justification,
      },
    );

    if (!matched) {
      toast('Divergência registrada na Central de Atividades — justificativa obrigatória para revisão.', {
        icon: '⚠️',
      });
    } else {
      toast.success('Contagem confirmada · bateu certinho com o sistema');
    }

    setConference(null);
    setAuditTick((tick) => tick + 1);
  };

  const approve = async () => {
    if (!inventory) return;
    if (demo) {
      recordInventoryApproved(
        { companyId, actorName: actor.name, actorId: actor.id },
        { inventoryId: inventory.id, warehouseName: inventory.warehouse_name },
      );
      showLogstokaBanner({
        type: 'success',
        title: 'Inventário aprovado',
        description: 'Controle de contagem aprovado e estoque ajustado com sucesso em modo demonstração.',
        actionPath: `/app/inventory/${inventory.id}`,
      });
      setAuditTick((tick) => tick + 1);
      return;
    }
    setApproving(true);
    try {
      const res = await logstokaApi.approveInventory(inventory.id);
      const adjusted = (res as { adjusted: number }).adjusted;
      recordInventoryApproved(
        { companyId, actorName: actor.name, actorId: actor.id },
        { inventoryId: inventory.id, warehouseName: inventory.warehouse_name, adjusted },
      );
      showLogstokaBanner({
        type: 'success',
        title: 'Inventário aprovado',
        description: `Total de ${adjusted} diferença(s) aplicada(s) ao estoque WMS.`,
        actionPath: `/app/inventory/${inventory.id}`,
      });
      await load();
      setAuditTick((tick) => tick + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aprovar');
    } finally {
      setApproving(false);
    }
  };

  const pendingCount = useMemo(
    () => items.filter((item) => item.counted_quantity == null).length,
    [items],
  );

  const tableToolbarActions: LogstokaToolbarAction[] = useMemo(
    () => [
      {
        key: 'refresh',
        label: 'Atualizar inventário',
        icon: <RefreshCw size={18} strokeWidth={2} />,
        onClick: () => void load(),
      },
      {
        key: 'guided',
        label: 'Contagem guiada',
        icon: <ListChecks size={18} strokeWidth={2} />,
        onClick: () => setGuidedOpen(true),
        accent: true,
        disabled: items.length === 0,
      },
      {
        key: 'approve',
        label: 'Aprovar e ajustar estoque',
        icon: <BadgeCheck size={18} strokeWidth={2} />,
        onClick: () => void approve(),
        hidden: !(canApprove && inventory?.status === 'review'),
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
          if (!inventory) return;
          printInventoryList({
            title: `Inventário · ${inventory.warehouse_name}`,
            warehouseName: inventory.warehouse_name,
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
          if (!inventory) return;
          exportInventoryCsv(
            scopedItems,
            `inventario-${inventory.warehouse_name.replace(/\s+/g, '-').toLowerCase()}.csv`,
          );
          toast.success(`CSV exportado · ${scopedItems.length} linha(s)`);
        },
        disabled: scopedItems.length === 0,
      },
      {
        key: 'share',
        label: selectedCount > 0 ? `Compartilhar ${selectedCount} selecionado(s)` : 'Compartilhar inventário',
        icon: <Share2 size={18} strokeWidth={2} />,
        onClick: () => setShareModalOpen(true),
        disabled: scopedItems.length === 0,
      },
    ],
    [
      actor.name,
      approve,
      canApprove,
      inventory,
      items.length,
      load,
      navigate,
      pendingDivergences,
      scopedItems,
      selectedCount,
    ],
  );

  if (loading) {
    return (
      <LogstokaDetailPageLayout backTo="/app/inventory" title="Inventário" subtitle="Carregando…">
        <div className="ls-card text-sm text-slate-500">Carregando inventário…</div>
      </LogstokaDetailPageLayout>
    );
  }

  if (!inventory) {
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
      title={`Inventário · ${inventory.warehouse_name}`}
      subtitle={`${inventory.inventory_type} · ${inventory.status}${pendingCount > 0 ? ` · ${pendingCount} pendente(s)` : ''}`}
      actions={
        <>
          <LogstokaIconNav
            aria-label="Conferência de inventário"
            variant="inline"
            items={[
              {
                type: 'button',
                key: 'guided',
                label: 'Contagem guiada',
                icon: <ListChecks size={18} strokeWidth={2.2} aria-hidden />,
                onClick: () => setGuidedOpen(true),
              },
            ]}
          />
          {canApprove && inventory.status === 'review' ? (
            <button type="button" className="ls-btn-primary" disabled={approving} onClick={() => void approve()}>
              <CheckCircle2 size={16} />
              {approving ? 'Aprovando…' : 'Aprovar e ajustar estoque'}
            </button>
          ) : null}
        </>
      }
    >
      <section className="ls-entry-card ls-page-table">
        <div className="ls-entry-card__head pb-2">
          <div>
            <h2 className="ls-entry-card__title">{inventory.warehouse_name}</h2>
            <p className="ls-entry-card__desc">
              {inventory.inventory_type} · {inventory.status}
              {selectedCount > 0 ? ` · ${selectedCount} selecionado(s) para compartilhar/imprimir` : ''}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
          <div className="flex-1 w-full max-w-2xl">
            <LogstokaTableFilterBar
              placeholder="Pesquisar SKU ou produto neste inventário..."
              onSearch={(query) => toast.success(`Filtro: "${query}"`)}
            />
          </div>
          <div className="shrink-0 flex items-center ml-auto">
            <LogstokaTableIconToolbar actions={tableToolbarActions} ariaLabel="Ações do inventário" />
          </div>
        </div>

        <div className="px-6 pb-3">
          <p className="text-[13px] leading-snug text-[#525252]">
            Selecione linhas para compartilhar só o Mercado Livre (ou depósito ativo), imprimir ou exportar um recorte.
            Clique no SKU para conferir.
          </p>
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
                <th>Sistema</th>
                <th>Contado</th>
                <th>Diferença</th>
                <th>Colaborador</th>
                <th aria-label="Conferir" />
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
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
                    <td className="font-bold text-orange-700 underline-offset-2 hover:underline">{item.ls_products?.sku}</td>
                    <td>{item.ls_products?.name}</td>
                    <td>{item.system_quantity}</td>
                    <td>{item.counted_quantity ?? '—'}</td>
                    <td className={Number(item.difference) !== 0 ? 'font-bold text-amber-600' : ''}>
                      {item.difference ?? '—'}
                    </td>
                    <td className="text-xs text-[#737373]">
                      {item.last_actor_name ? (
                        <>
                          {item.last_actor_name}
                          {item.last_counted_at ? (
                            <span className="block text-[10px] text-[#a3a3a3]">{formatWhen(item.last_counted_at)}</span>
                          ) : null}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <LogstokaIconNavButton title="Conferir item" accent onClick={() => openConference(item)}>
                        <ListChecks size={16} strokeWidth={2.2} />
                      </LogstokaIconNavButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <LogstokaTableFooter {...footerProps} hidden={items.length === 0} />
      </section>

      <section className="ls-card ls-inventory-audit-panel">
        <div className="ls-inventory-audit-panel__head">
          <h3 className="ls-inventory-audit-panel__title">
            <History size={14} className="inline mr-1 -mt-0.5" aria-hidden />
            Trilha de auditoria · inventário
          </h3>
          <Link to={LOGSTOKA_ROUTES.ACTIVITY_CENTER} className="text-xs font-bold text-orange-700 hover:underline">
            Abrir Central de Atividades
          </Link>
        </div>
        {inventoryAudit.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma conferência registrada ainda para este inventário.</p>
        ) : (
          <div className="ls-inventory-audit-panel__list">
            {inventoryAudit.map((row) => (
              <div
                key={row.id}
                className={`ls-inventory-audit-panel__item${row.result === 'warning' ? ' ls-inventory-audit-panel__item--warning' : ''}`}
              >
                <span className="ls-inventory-audit-panel__desc">{row.description}</span>
                <span className="ls-inventory-audit-panel__meta">
                  {row.actorName} · {formatWhen(row.time)} · {row.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <InventoryGuidedModal
        open={guidedOpen}
        inventory={inventory}
        onClose={() => setGuidedOpen(false)}
        onConfirmCount={applyCount}
      />

      <InventoryItemConferenceModal
        open={Boolean(conference)}
        item={conference}
        actorName={actor.name}
        recentAudit={skuAudit}
        onClose={() => setConference(null)}
        onSave={(value, status, justification) => void handleConferenceSave(value, status, justification)}
      />

      <LogstokaShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        resourceType="inventory"
        resourceId={inventory.id}
        resourceName={
          selectedCount > 0
            ? `${inventory.warehouse_name} · ${selectedCount} SKU(s)`
            : inventory.warehouse_name
        }
        snapshotData={buildInventorySnapshot(scopedItems)}
      />
    </LogstokaDetailPageLayout>
  );
};

export default InventoryDetailPage;
