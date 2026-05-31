import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  FileUp,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import EntryDeleteConfirmModal from '@/components/movements/EntryDeleteConfirmModal';
import EntryReceivingPanel, { type EntryReceivingPanelHandle } from '@/components/movements/EntryReceivingPanel';
import EntryToolbar from '@/components/movements/EntryToolbar';
import MovementEditModal, { type MovementEditPayload } from '@/components/movements/MovementEditModal';
import MovementRowActions from '@/components/movements/MovementRowActions';
import ProductThumb from '@/components/products/ProductThumb';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaKpiAdjustModal from '@/components/layout/LogstokaKpiAdjustModal';
import ClickableTableRow from '@/components/ui/ClickableTableRow';
import LogstokaTableCheckbox from '@/components/ui/LogstokaTableCheckbox';
import LogstokaIconNav, { type LogstokaIconNavButtonItem, LogstokaIconNavButton } from '@/components/ui/LogstokaIconNav';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useRowSelection } from '@/hooks/useRowSelection';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { removeDemoMovement, updateDemoMovement } from '@/lib/demoMovementStore';
import { logstokaApi } from '@/lib/logstokaApi';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { loadMergedDemoMovements } from '@/lib/registerGuidedConferenceExits';
import { getDemoProductBySku, movementTypeLabel, marketplaceLabel, type DemoMovementRow } from '@/lib/logstokaDemoSeed';
import { printMovementDocument } from '@/lib/printMovementDocument';
import LogstokaTableSearchBar from '@/components/ui/LogstokaTableSearchBar';
import LogstokaTableBulkBar from '@/components/ui/LogstokaTableBulkBar';
import { MARKETPLACE_LABELS } from '@/types';
import './entryPage.css';

function matchesMovementSearch(row: DemoMovementRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [row.sku, row.product_name, row.reference_code, row.warehouse_name, row.status]
    .filter(Boolean)
    .some((part) => String(part).toLowerCase().includes(q));
}

const tabs = [
  { id: 'entry', label: 'Entrada', Icon: ArrowDownToLine },
  { id: 'exit', label: 'Saída', Icon: ArrowUpFromLine },
  { id: 'transfer', label: 'Transferência', Icon: ArrowLeftRight },
  { id: 'damage', label: 'Avaria', Icon: AlertTriangle },
] as const;

type MovementTab = (typeof tabs)[number]['id'];

const TAB_PAGE_TITLES: Record<MovementTab, string> = {
  entry: 'Entrada inteligente',
  exit: 'Saídas',
  transfer: 'Transferências',
  damage: 'Avarias',
};

const TAB_LIST_TITLES: Record<MovementTab, string> = {
  entry: 'Produtos recebidos',
  exit: 'Saídas registradas',
  transfer: 'Transferências registradas',
  damage: 'Avarias registradas',
};

function filterMovementsByTab(items: DemoMovementRow[], tab: MovementTab) {
  if (tab === 'entry') return items.filter((m) => m.movement_type === 'entry');
  if (tab === 'exit') return items.filter((m) => m.movement_type === 'exit');
  if (tab === 'transfer') return items.filter((m) => m.movement_type === 'transfer');
  return items.filter((m) => m.movement_type === 'damage');
}

const MovementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const demo = isLogstokaDemoCompany(companyId);
  const actorName = profile?.full_name?.trim() || 'Operador';
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabs.some((t) => t.id === tabParam) ? (tabParam as MovementTab) : 'entry';
  const [tab, setTab] = useState<MovementTab>(initialTab);
  const [movements, setMovements] = useState<DemoMovementRow[]>(() => loadMergedDemoMovements(companyId));

  const reloadMovements = () => setMovements(loadMergedDemoMovements(companyId));

  useEffect(() => {
    reloadMovements();
  }, [companyId]);

  useEffect(() => {
    const refresh = () => reloadMovements();
    window.addEventListener('logstoka:demo-movements-updated', refresh);
    window.addEventListener('logstoka:system-pulse', refresh);
    return () => {
      window.removeEventListener('logstoka:demo-movements-updated', refresh);
      window.removeEventListener('logstoka:system-pulse', refresh);
    };
  }, [companyId]);

  const [editingMovement, setEditingMovement] = useState<DemoMovementRow | null>(null);
  const [deletingMovement, setDeletingMovement] = useState<DemoMovementRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const xmlRef = useRef<HTMLInputElement>(null);
  const entryPanelRef = useRef<EntryReceivingPanelHandle>(null);
  const exitPanelRef = useRef<EntryReceivingPanelHandle>(null);
  const [kpiModal, setKpiModal] = useState<{ label: string; value: string | number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState('');
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const activeTab = tabs.find((t) => t.id === tab) ?? tabs[0];
  const isEntryTab = tab === 'entry';
  const isExitTab = tab === 'exit';
  const isScanTab = isEntryTab || isExitTab;
  const ActiveTabIcon = activeTab.Icon;

  useEffect(() => {
    if (tabParam && tabs.some((t) => t.id === tabParam) && tabParam !== tab) {
      setTab(tabParam as MovementTab);
    }
  }, [tabParam, tab]);

  const selectTab = (id: MovementTab) => {
    setTab(id);
    setSearchParams({ tab: id }, { replace: true });
  };

  useEffect(() => {
    setSearchQuery('');
    setWarehouseFilter('');
    setMarketplaceFilter('');
  }, [tab]);

  const filteredMovements = useMemo(() => filterMovementsByTab(movements, tab), [movements, tab]);

  const warehouseOptions = useMemo(() => {
    const names = new Set(filteredMovements.map((m) => m.warehouse_name).filter(Boolean) as string[]);
    return [...names].sort();
  }, [filteredMovements]);

  const marketplaceOptions = useMemo(() => {
    const keys = new Set(filteredMovements.map((m) => m.marketplace).filter(Boolean) as string[]);
    return [...keys].sort();
  }, [filteredMovements]);

  const searchedMovements = useMemo(() => {
    return filteredMovements.filter((m) => {
      if (warehouseFilter && m.warehouse_name !== warehouseFilter) return false;
      if (marketplaceFilter && m.marketplace !== marketplaceFilter) return false;
      return matchesMovementSearch(m, searchQuery);
    });
  }, [filteredMovements, searchQuery, warehouseFilter, marketplaceFilter]);

  const entryMovements = useMemo(() => filterMovementsByTab(movements, 'entry'), [movements]);
  const exitMovements = useMemo(() => filterMovementsByTab(movements, 'exit'), [movements]);
  const { paginatedItems, footerProps } = useTablePagination(searchedMovements, 10, `${tab}-${searchQuery}-${warehouseFilter}-${marketplaceFilter}`);
  const { selectedKeys, toggleSelect, toggleSelectAll, isAllSelected, selectedCount, clearSelection } = useRowSelection(
    searchedMovements,
    (m) => m.id,
  );

  const todayLabel = useMemo(() => new Date().toLocaleDateString('pt-BR'), []);

  const movementTotals = useMemo(() => {
    const units = searchedMovements.reduce((sum, m) => sum + m.total_quantity, 0);
    const products = new Set(searchedMovements.map((m) => m.sku).filter(Boolean)).size;
    return { movements: searchedMovements.length, products, units };
  }, [searchedMovements]);

  const tabNavItems: LogstokaIconNavButtonItem[] = useMemo(
    () =>
      tabs.map(({ id, label, Icon }) => ({
        type: 'button',
        key: id,
        label,
        active: tab === id,
        icon: <Icon size={18} strokeWidth={2.2} aria-hidden />,
        onClick: () => selectTab(id),
      })),
    [tab],
  );

  const handleXml = async (file: File) => {
    if (demo) {
      toast.success(`[Demo] NF-e ${file.name} importada — 12 produtos`);
      reloadMovements();
      return;
    }
    try {
      const xml = await file.text();
      const result = await logstokaApi.importXml(xml);
      toast.success(`Entrada NF-e — ${result.items} produtos (mov. ${result.movementId.slice(0, 8)}…)`);
      reloadMovements();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao importar XML');
    }
  };

  const handleDuplicateMovement = (movement: DemoMovementRow) => {
    const copy: DemoMovementRow = {
      ...movement,
      id: `mov-${Date.now()}`,
      created_at: new Date().toISOString(),
      reference_code: movement.reference_code ? `${movement.reference_code}-Cópia` : 'Cópia',
    };
    setMovements((prev) => [copy, ...prev]);
    toast.success('Movimentação duplicada');
  };

  const confirmDeleteMovement = async () => {
    if (!deletingMovement || !companyId) return;
    setDeleteBusy(true);
    try {
      if (demo) removeDemoMovement(companyId, deletingMovement.id);
      setMovements((prev) => prev.filter((m) => m.id !== deletingMovement.id));
      toast.success('Movimentação excluída');
      setDeletingMovement(null);
      reloadMovements();
    } finally {
      setDeleteBusy(false);
    }
  };

  const handlePrintMovement = (movement: DemoMovementRow) => {
    try {
      printMovementDocument(movement, {
        companyName: 'LogStoka Demo · Pluma Baby',
        operatorName: actorName,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível imprimir');
    }
  };

  const handleSaveMovement = async (payload: MovementEditPayload) => {
    if (!editingMovement || !companyId) return;

    setEditSaving(true);
    try {
      if (demo) updateDemoMovement(companyId, editingMovement.id, payload);
      setMovements((prev) =>
        prev.map((m) => (m.id === editingMovement.id ? { ...m, ...payload } : m)),
      );
      toast.success('Movimentação atualizada');
      setEditingMovement(null);
      reloadMovements();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setEditSaving(false);
    }
  };

  const focusScanner = () => {
    if (isExitTab) exitPanelRef.current?.openScanner();
    else entryPanelRef.current?.openScanner();
  };

  const selectedMovements = useMemo(
    () => searchedMovements.filter((m) => selectedKeys.has(m.id)),
    [searchedMovements, selectedKeys],
  );

  const handleBulkEdit = () => {
    const first = selectedMovements[0];
    if (!first) return;
    setEditingMovement(first);
  };

  const handleBulkTransfer = () => {
    const first = selectedMovements[0];
    if (!first?.sku) {
      toast.error('Selecione ao menos um item com SKU');
      return;
    }
    navigate(`/app/transfers?sku=${encodeURIComponent(first.sku)}`);
  };

  const handleBulkDelete = async () => {
    if (!companyId || selectedMovements.length === 0) return;
    const ok = window.confirm(`Excluir ${selectedMovements.length} movimentação(ões) selecionada(s)?`);
    if (!ok) return;
    setBulkDeleting(true);
    try {
      for (const row of selectedMovements) {
        if (demo) removeDemoMovement(companyId, row.id);
      }
      setMovements((prev) => prev.filter((m) => !selectedKeys.has(m.id)));
      clearSelection();
      toast.success(`${selectedMovements.length} movimentação(ões) excluída(s)`);
      reloadMovements();
    } finally {
      setBulkDeleting(false);
    }
  };

  const useRichTableLayout = isEntryTab || isExitTab;

  const toolbarProps = {
    onRefresh: reloadMovements,
    onNewEntry: focusScanner,
    onImportXml: () => xmlRef.current?.click(),
    onImportCsv: () => toast('Importação CSV — use /app/imports ou arraste planilha'),
    onImportExcel: () => toast('Importação Excel — use /app/imports'),
    onImportPdf: () => toast('Importação PDF — em breve na central de importações'),
    onPrint: () => toast(`Imprimir lista de ${activeTab.label.toLowerCase()} do dia`),
    onShare: () => toast('Lista copiada para compartilhar'),
    scanLabel: isExitTab ? 'Scanner — nova saída' : 'Scanner inteligente — nova entrada',
  };

  const kpiItems = useMemo(
    () => [
      {
        label: 'SKUs',
        value: movementTotals.products,
        onClick: () => setKpiModal({ label: 'SKUs', value: movementTotals.products }),
      },
      {
        label: 'Unidades',
        value: movementTotals.units.toLocaleString('pt-BR'),
        onClick: () => focusScanner(),
      },
      {
        label: 'Movimentos',
        value: movementTotals.movements,
        onClick: () => setKpiModal({ label: 'Movimentos', value: movementTotals.movements }),
      },
      { label: 'Data', value: todayLabel },
    ],
    [movementTotals, todayLabel],
  );

  const renderMovementTable = (richLayout: boolean) => (
    <>
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
        <div className="flex-1 w-full">
          <LogstokaTableSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar SKU, produto, referência, depósito…"
            resultCount={searchedMovements.length}
            filters={
              <>
                <select
                  className="ls-input"
                  value={warehouseFilter}
                  aria-label="Filtrar depósito"
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                >
                  <option value="">Todos depósitos</option>
                  {warehouseOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  className="ls-input"
                  value={marketplaceFilter}
                  aria-label="Filtrar canal"
                  onChange={(e) => setMarketplaceFilter(e.target.value)}
                >
                  <option value="">Todos canais</option>
                  {marketplaceOptions.map((key) => (
                    <option key={key} value={key}>
                      {MARKETPLACE_LABELS[key as keyof typeof MARKETPLACE_LABELS] ?? key}
                    </option>
                  ))}
                </select>
              </>
            }
          />
        </div>
        <div className="shrink-0 flex items-center ml-auto">
          <EntryToolbar {...toolbarProps} />
        </div>
      </div>

      <LogstokaTableBulkBar
        selectedCount={selectedCount}
        onEdit={handleBulkEdit}
        onTransfer={handleBulkTransfer}
        onDelete={bulkDeleting ? undefined : () => void handleBulkDelete()}
        onClear={clearSelection}
      />

      <div className="ls-table-wrap">
        <table className="ls-table">
          <thead>
            <tr>
              <th className="w-10">
                <LogstokaTableCheckbox
                  checked={isAllSelected}
                  indeterminate={selectedCount > 0 && !isAllSelected}
                  onChange={toggleSelectAll}
                  ariaLabel="Selecionar todos"
                />
              </th>
              {!richLayout ? <th>Tipo</th> : null}
              <th>
                {richLayout ? (
                  'Produto'
                ) : (
                  <>
                    <span className="ls-table-col-head">SKU / Produto</span>
                    <span className="ls-table-col-total">
                      {movementTotals.products} produtos · {movementTotals.movements} mov.
                    </span>
                  </>
                )}
              </th>
              {richLayout ? (
                <>
                  <th>Qtd.</th>
                  <th>Depósito</th>
                  <th>Canal</th>
                  <th>Referência</th>
                  <th>Data</th>
                  <th>Status</th>
                </>
              ) : (
                <>
                  <th>Depósito</th>
                  <th>Canal</th>
                  <th>Referência</th>
                  <th>
                    <span className="ls-table-col-head">Qtd</span>
                    <span className="ls-table-col-total">{movementTotals.units.toLocaleString('pt-BR')} un.</span>
                  </th>
                  <th>Data</th>
                </>
              )}
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((m) => {
              const linked = getDemoProductBySku(m.sku);
              const selected = selectedKeys.has(m.id);
              return (
                <ClickableTableRow
                  key={m.id}
                  to={`/app/movements/${m.id}`}
                  className={selected ? 'ls-table-row--selected' : undefined}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <LogstokaTableCheckbox
                      checked={selected}
                      onChange={() => toggleSelect(m.id)}
                      ariaLabel={`Selecionar ${m.sku ?? m.id}`}
                    />
                  </td>
                  {!richLayout ? (
                    <td>
                      <span className="ls-badge bg-orange-50 text-orange-700">{movementTypeLabel(m.movement_type)}</span>
                    </td>
                  ) : null}
                  <td>
                    {richLayout ? (
                      <div className="ls-entry-table-thumb">
                        <ProductThumb src={linked?.main_image_url} name={m.product_name ?? m.sku ?? ''} size={36} />
                        <div>
                          <p className="font-bold">{m.sku}</p>
                          <p className="text-xs text-slate-500">{m.product_name}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-bold">{m.sku}</p>
                        <p className="text-xs text-slate-500">{m.product_name}</p>
                      </>
                    )}
                  </td>
                  {richLayout ? (
                    <>
                      <td className="font-black text-orange-700">{m.total_quantity}</td>
                      <td>{m.warehouse_name}</td>
                      <td>{marketplaceLabel(m.marketplace)}</td>
                      <td>{m.reference_code}</td>
                      <td className="text-xs">{new Date(m.created_at).toLocaleString('pt-BR')}</td>
                      <td>
                        <span className="ls-badge bg-emerald-50 text-emerald-700">{m.status}</span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{m.warehouse_name}</td>
                      <td>{marketplaceLabel(m.marketplace)}</td>
                      <td>{m.reference_code}</td>
                      <td className="font-black text-orange-700">{m.total_quantity}</td>
                      <td className="text-xs">{new Date(m.created_at).toLocaleString('pt-BR')}</td>
                    </>
                  )}
                  <td className="ls-table-actions-cell">
                    <MovementRowActions
                      movementId={m.id}
                      onView={() => navigate(`/app/movements/${m.id}`)}
                      onEdit={() => setEditingMovement(m)}
                      onDuplicate={() => handleDuplicateMovement(m)}
                      onPrint={() => handlePrintMovement(m)}
                      onPrintLabel={() => toast.success(`Etiqueta ${m.sku}`)}
                      onDelete={() => setDeletingMovement(m)}
                    />
                  </td>
                </ClickableTableRow>
              );
            })}
          </tbody>
        </table>
      </div>
      <LogstokaTableFooter {...footerProps} itemLabel={activeTab.label.toLowerCase()} />
    </>
  );

  return (
    <div className={`space-y-6${isScanTab ? ' ls-entry-page' : ''}`}>
      <LogstokaPageHeader
        icon={<ActiveTabIcon size={20} strokeWidth={2.25} />}
        title={TAB_PAGE_TITLES[tab]}
        subtitle={
          isEntryTab
            ? 'Recebimento inteligente — escaneie, some quantidades duplicadas e registre no estoque em tempo real.'
            : isExitTab
              ? 'Central de saídas da empresa — receba expedições automáticas ou registre saída manual pelo scanner.'
              : `${activeTab.label} · NF-e e registro em tempo real.`
        }
        actions={
          <>
            <input
              ref={xmlRef}
              type="file"
              accept=".xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleXml(file);
                e.target.value = '';
              }}
            />
            <LogstokaIconNav aria-label="Tipo de movimentação" items={tabNavItems} variant="inline" />
            {!isEntryTab ? (
              <LogstokaIconNavButton title="Importar XML da NF-e" onClick={() => xmlRef.current?.click()}>
                <FileUp size={18} strokeWidth={2.2} aria-hidden />
              </LogstokaIconNavButton>
            ) : null}
          </>
        }
      />

      <LogstokaKpiStrip items={kpiItems} />

      {isEntryTab ? (
        <EntryReceivingPanel
          ref={entryPanelRef}
          hidden
          companyId={companyId}
          demo={demo}
          actorName={actorName}
          entryMovements={entryMovements}
          onRefresh={reloadMovements}
        />
      ) : null}

      {isExitTab ? (
        <EntryReceivingPanel
          ref={exitPanelRef}
          hidden
          variant="exit"
          companyId={companyId}
          demo={demo}
          actorName={actorName}
          entryMovements={exitMovements}
          onRefresh={reloadMovements}
        />
      ) : null}

      <section className="ls-entry-card">
        <div className="ls-entry-card__head pb-2">
          <div>
            <h2 className="ls-entry-card__title">{TAB_LIST_TITLES[tab]}</h2>
            <p className="ls-entry-card__desc">
              {movementTotals.products} SKU(s) · {movementTotals.units.toLocaleString('pt-BR')} un.
              {selectedCount > 0 ? ` · ${selectedCount} selecionado(s)` : ''} · {actorName}
            </p>
          </div>
        </div>
        {renderMovementTable(useRichTableLayout)}
      </section>

      <LogstokaKpiAdjustModal
        open={Boolean(kpiModal)}
        title="Conferir indicador"
        label={kpiModal?.label ?? ''}
        currentValue={kpiModal?.value ?? 0}
        subtitle="Ajuste o valor conferido ou marque como divergente"
        onClose={() => setKpiModal(null)}
        onSave={(value, status) => {
          toast.success(
            status === 'correct'
              ? `${kpiModal?.label} confirmado · ${value}`
              : `${kpiModal?.label} marcado como divergente · ${value}`,
          );
          setKpiModal(null);
          if (isScanTab) focusScanner();
        }}
      />

      <MovementEditModal
        open={Boolean(editingMovement)}
        movement={editingMovement}
        saving={editSaving}
        onClose={() => setEditingMovement(null)}
        onSave={(payload) => void handleSaveMovement(payload)}
      />

      <EntryDeleteConfirmModal
        open={Boolean(deletingMovement)}
        movement={deletingMovement}
        deleting={deleteBusy}
        onClose={() => setDeletingMovement(null)}
        onConfirm={() => void confirmDeleteMovement()}
      />
    </div>
  );
};

export default MovementsPage;
