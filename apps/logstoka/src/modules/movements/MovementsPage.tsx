import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Clock,
  FileUp,
  History,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import EntryDeleteConfirmModal from '@/components/movements/EntryDeleteConfirmModal';
import EntryReceivingPanel, { type EntryReceivingPanelHandle } from '@/components/movements/EntryReceivingPanel';
import MovementExitRegisterModal, { type ExitFormState } from '@/components/movements/MovementExitRegisterModal';
import EntryToolbar from '@/components/movements/EntryToolbar';
import MovementEditModal, { type MovementEditPayload } from '@/components/movements/MovementEditModal';
import MovementRowActions from '@/components/movements/MovementRowActions';
import ProductThumb from '@/components/products/ProductThumb';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaKpiAdjustModal from '@/components/layout/LogstokaKpiAdjustModal';
import StockLabelPreviewModal from '@/components/labels/StockLabelPreviewModal';
import ClickableTableRow from '@/components/ui/ClickableTableRow';
import LogstokaTableCheckbox from '@/components/ui/LogstokaTableCheckbox';
import LogstokaIconNav, { type LogstokaIconNavButtonItem, LogstokaIconNavButton } from '@/components/ui/LogstokaIconNav';
import LogstokaAddIconButton from '@/components/ui/LogstokaAddIconButton';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useRowSelection } from '@/hooks/useRowSelection';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaBranding } from '@/context/LogstokaBrandingContext';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useIntelligentScanState } from '@/hooks/useIntelligentScanState';
import { useWarehouses } from '@/hooks/useCatalog';
import { useLogstokaWarehouseScope } from '@/context/LogstokaWarehouseScopeContext';
import { upsertDemoDriver } from '@/lib/demoDriverStore';
import { registerExitMovement } from '@/lib/entryMovements';
import { getProductStockAtWarehouse } from '@/lib/productStockByCd';
import { removeDemoMovement, updateDemoMovement } from '@/lib/demoMovementStore';
import { logstokaApi } from '@/lib/logstokaApi';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { loadCompanyMovements } from '@/lib/movementLoader';
import { getDemoProductBySku, movementTypeLabel, marketplaceLabel, type DemoMovementRow } from '@/lib/logstokaDemoSeed';
import {
  computeMovementOverdue,
  formatOverdueLabel,
  getMaxOverdueDaysBySku,
  isSameLocalDay,
  type MovementOverdueItem,
} from '@/lib/movementOverdue';
import { printMovementDocument } from '@/lib/printMovementDocument';
import { printMovementListDocument } from '@/lib/printMovementListDocument';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';
import { EMPTY_STOCK_LABEL, stockLabelFromMovement } from '@/lib/stockLabelData';
import type { StockLabelData } from '@/lib/printStockLabel';
import LogstokaTableSearchBar from '@/components/ui/LogstokaTableSearchBar';
import LogstokaTableBulkBar from '@/components/ui/LogstokaTableBulkBar';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import {
  recordMovementDeleted,
  recordMovementEdited,
} from '@/lib/movementHistory';
import { MARKETPLACE_LABELS } from '@/types';
import type { ProductLookupResult } from '@/lib/productLookup';
import './entryPage.css';

const emptyExitForm: ExitFormState = {
  warehouseId: '',
  productId: '',
  sku: '',
  productName: '',
  internalCode: '',
  quantity: 1,
  referenceCode: '',
  releasedByName: '',
  driverId: '',
  driverName: '',
  driverCpf: '',
  companyName: '',
  companyCnpj: '',
  driverPlate: '',
  signatureDataUrl: '',
  signatureSignedAt: '',
  confirmed: false,
};

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
  { id: 'overdue', label: 'Atrasos', Icon: Clock },
  { id: 'transfer', label: 'Transferência', Icon: ArrowLeftRight },
  { id: 'damage', label: 'Avaria', Icon: AlertTriangle },
] as const;

type MovementTab = (typeof tabs)[number]['id'];

const TAB_PAGE_TITLES: Record<MovementTab, string> = {
  entry: 'Entrada inteligente do dia',
  exit: 'Saídas do dia',
  overdue: 'Atrasos inteligentes',
  transfer: 'Transferências',
  damage: 'Avarias',
};

const TAB_LIST_TITLES: Record<MovementTab, string> = {
  entry: 'Produtos recebidos hoje',
  exit: 'Saídas registradas hoje',
  overdue: 'Entradas sem saída — pendências por dia',
  transfer: 'Transferências registradas',
  damage: 'Avarias registradas',
};

function filterMovementsByTab(items: DemoMovementRow[], tab: MovementTab) {
  if (tab === 'overdue') return [];
  if (tab === 'entry') return items.filter((m) => m.movement_type === 'entry');
  if (tab === 'exit') return items.filter((m) => m.movement_type === 'exit');
  if (tab === 'transfer') return items.filter((m) => m.movement_type === 'transfer');
  return items.filter((m) => m.movement_type === 'damage');
}

function matchesOverdueSearch(row: MovementOverdueItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [row.sku, row.productName, row.referenceCode, row.warehouseName]
    .filter(Boolean)
    .some((part) => String(part).toLowerCase().includes(q));
}

const MovementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const { visibleWarehouses, assignedWarehouseId } = useLogstokaWarehouseScope();
  const { warehouses: allWarehouses } = useWarehouses();
  const { branding } = useLogstokaBranding();
  const companyName = branding.companyName ?? 'LogStoka WMS';
  const demo = isLogstokaDemoCompany(companyId);
  const actorName = profile?.full_name?.trim() || 'Operador';
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabs.some((t) => t.id === tabParam) ? (tabParam as MovementTab) : 'entry';
  const [tab, setTab] = useState<MovementTab>(initialTab);
  const [movements, setMovements] = useState<DemoMovementRow[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(true);

  const reloadMovements = useCallback(() => {
    if (!companyId) {
      setMovements([]);
      setMovementsLoading(false);
      return;
    }
    setMovementsLoading(true);
    void loadCompanyMovements(companyId)
      .then(setMovements)
      .catch(() => setMovements([]))
      .finally(() => setMovementsLoading(false));
  }, [companyId]);

  useEffect(() => {
    reloadMovements();
  }, [reloadMovements]);

  useEffect(() => {
    const refresh = () => reloadMovements();
    window.addEventListener('logstoka:demo-movements-updated', refresh);
    window.addEventListener('logstoka:system-pulse', refresh);
    return () => {
      window.removeEventListener('logstoka:demo-movements-updated', refresh);
      window.removeEventListener('logstoka:system-pulse', refresh);
    };
  }, [reloadMovements]);

  const [editingMovement, setEditingMovement] = useState<DemoMovementRow | null>(null);
  const [deletingMovement, setDeletingMovement] = useState<DemoMovementRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const xmlRef = useRef<HTMLInputElement>(null);
  const entryPanelRef = useRef<EntryReceivingPanelHandle>(null);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [exitForm, setExitForm] = useState<ExitFormState>(emptyExitForm);
  const [exitSaving, setExitSaving] = useState(false);
  const exitScan = useIntelligentScanState(companyId, demo, 'exit');
  const [kpiModal, setKpiModal] = useState<{ label: string; value: string | number } | null>(null);
  const [labelModal, setLabelModal] = useState<StockLabelData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState('');
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const activeTab = tabs.find((t) => t.id === tab) ?? tabs[0];
  const isEntryTab = tab === 'entry';
  const isExitTab = tab === 'exit';
  const isOverdueTab = tab === 'overdue';
  const isTransferTab = tab === 'transfer';
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

  const overdueItems = useMemo(() => computeMovementOverdue(movements), [movements]);
  const overdueBySku = useMemo(() => getMaxOverdueDaysBySku(movements), [movements]);

  const filteredMovements = useMemo(() => {
    const byTab = filterMovementsByTab(movements, tab);
    if (tab === 'entry' || tab === 'exit') {
      return byTab.filter((m) => isSameLocalDay(m.created_at));
    }
    return byTab;
  }, [movements, tab]);

  const searchedOverdue = useMemo(() => {
    return overdueItems.filter((item) => {
      if (warehouseFilter && item.warehouseName !== warehouseFilter) return false;
      return matchesOverdueSearch(item, searchQuery);
    });
  }, [overdueItems, searchQuery, warehouseFilter]);

  const warehouseOptions = useMemo(() => {
    const names = new Set<string>();
    if (isOverdueTab) {
      for (const item of overdueItems) {
        if (item.warehouseName) names.add(item.warehouseName);
      }
    } else {
      for (const m of filteredMovements) {
        if (m.warehouse_name) names.add(m.warehouse_name);
      }
    }
    return [...names].sort();
  }, [filteredMovements, isOverdueTab, overdueItems]);

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

  const physicalWarehouses = useMemo(
    () =>
      visibleWarehouses.filter((w) => w.type === 'physical' && w.is_active).length > 0
        ? visibleWarehouses.filter((w) => w.type === 'physical' && w.is_active)
        : allWarehouses.filter((w) => w.type === 'physical' && w.is_active),
    [visibleWarehouses, allWarehouses],
  );

  const defaultWarehouseId = assignedWarehouseId ?? physicalWarehouses[0]?.id ?? '';

  useEffect(() => {
    if (!exitScan.resolvedProduct) return;
    const p = exitScan.resolvedProduct;
    setExitForm((f) => ({
      ...f,
      productId: p.id,
      sku: p.sku,
      productName: p.name,
      internalCode: p.internal_code ?? '',
      quantity: exitScan.quantity,
    }));
  }, [exitScan.resolvedProduct, exitScan.quantity]);

  const openExitModal = useCallback(() => {
    setExitForm({
      ...emptyExitForm,
      warehouseId: defaultWarehouseId,
      releasedByName: actorName,
      quantity: 1,
    });
    exitScan.clearScan();
    setExitModalOpen(true);
  }, [actorName, defaultWarehouseId, exitScan]);

  const applyExitProduct = (product: ProductLookupResult) => {
    setExitForm((f) => ({
      ...f,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      internalCode: product.internal_code ?? '',
      quantity: exitScan.quantity,
    }));
    exitScan.setScanValue(product.internal_code ?? product.sku);
  };

  const createExitMovement = async () => {
    const sku = exitForm.sku || exitScan.resolvedProduct?.sku;
    const product = exitScan.resolvedProduct;
    const productId = exitForm.productId || product?.id;

    if (!companyId) return;
    if (!exitForm.warehouseId) {
      toast.error('Selecione o depósito de saída');
      return;
    }
    if (!sku || !productId || !product) {
      toast.error('Busque o produto pelo código LS ou EAN antes de confirmar');
      return;
    }
    if (exitForm.quantity < 1) {
      toast.error('Informe a quantidade');
      return;
    }
    if (!exitForm.releasedByName.trim()) {
      toast.error('Informe o responsável pela liberação');
      return;
    }
    if (!exitForm.driverName.trim()) {
      toast.error('Informe o motorista ou quem vai entregar');
      return;
    }
    if (!exitForm.signatureDataUrl) {
      toast.error('Assinatura do responsável é obrigatória');
      return;
    }
    if (!exitForm.confirmed) {
      toast.error('Marque a confirmação de conferência dos itens');
      return;
    }

    const warehouse = physicalWarehouses.find((w) => w.id === exitForm.warehouseId);
    const available = demo ? getProductStockAtWarehouse(productId, exitForm.warehouseId, companyId) : null;
    if (demo && available !== null && exitForm.quantity > available) {
      toast.error(`Saldo insuficiente no CD (${available} un. disponíveis)`);
      return;
    }

    setExitSaving(true);
    try {
      let driverId = exitForm.driverId;
      if (demo) {
        const driver = upsertDemoDriver(companyId, {
          full_name: exitForm.driverName.trim(),
          cpf: exitForm.driverCpf.trim(),
          company_name: exitForm.companyName.trim(),
          company_cnpj: exitForm.companyCnpj.trim(),
          warehouse_id: exitForm.warehouseId,
        });
        driverId = driver.id;
      }

      const exitApproval = {
        released_by_name: exitForm.releasedByName.trim(),
        driver_id: driverId || null,
        driver_name: exitForm.driverName.trim(),
        driver_cpf: exitForm.driverCpf.trim() || null,
        company_name: exitForm.companyName.trim() || null,
        company_cnpj: exitForm.companyCnpj.trim() || null,
        driver_plate: exitForm.driverPlate.trim() || null,
        signature_data_url: exitForm.signatureDataUrl,
        approved_at: exitForm.signatureSignedAt || new Date().toISOString(),
      };

      const result = await registerExitMovement({
        companyId,
        demo,
        product,
        quantity: exitForm.quantity,
        referenceCode: exitForm.referenceCode.trim() || 'Saída manual',
        warehouseName: warehouse?.name ?? 'CD Principal',
        existingExits: exitMovements,
        actorName,
        exitApproval,
      });

      toast.success(
        result.merged
          ? `Saída somada · ${product.name} · ${result.movement.total_quantity} un.`
          : `Saída registrada · ${product.name} · ${exitForm.quantity} un.`,
      );
      setExitModalOpen(false);
      setExitForm(emptyExitForm);
      exitScan.clearScan();
      reloadMovements();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar saída');
    } finally {
      setExitSaving(false);
    }
  };
  const movementPagination = useTablePagination(
    searchedMovements,
    10,
    `${tab}-${searchQuery}-${warehouseFilter}-${marketplaceFilter}`,
  );
  const overduePagination = useTablePagination(
    searchedOverdue,
    10,
    `overdue-${searchQuery}-${warehouseFilter}`,
  );
  const paginatedMovements = movementPagination.paginatedItems;
  const paginatedOverdue = overduePagination.paginatedItems;
  const footerProps = isOverdueTab ? overduePagination.footerProps : movementPagination.footerProps;
  const { selectedKeys, toggleSelect, toggleSelectAll, isAllSelected, selectedCount, clearSelection } = useRowSelection(
    isOverdueTab ? [] : searchedMovements,
    (m) => m.id,
  );

  const todayLabel = useMemo(() => new Date().toLocaleDateString('pt-BR'), []);

  const movementTotals = useMemo(() => {
    if (isOverdueTab) {
      const units = searchedOverdue.reduce((sum, item) => sum + item.pendingQuantity, 0);
      const products = new Set(searchedOverdue.map((item) => item.sku)).size;
      return { movements: searchedOverdue.length, products, units };
    }
    const units = searchedMovements.reduce((sum, m) => sum + m.total_quantity, 0);
    const products = new Set(searchedMovements.map((m) => m.sku).filter(Boolean)).size;
    return { movements: searchedMovements.length, products, units };
  }, [isOverdueTab, searchedMovements, searchedOverdue]);

  const tabNavItems: LogstokaIconNavButtonItem[] = useMemo(
    () =>
      tabs.map(({ id, label, Icon }) => ({
        type: 'button',
        key: id,
        label: id === 'overdue' && overdueItems.length > 0 ? `Atrasos (${overdueItems.length})` : label,
        active: tab === id,
        icon: <Icon size={18} strokeWidth={2.2} aria-hidden />,
        onClick: () => selectTab(id),
      })),
    [tab, overdueItems.length],
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
      recordMovementDeleted({
        companyId,
        movement: deletingMovement,
        actorName,
      });
      setMovements((prev) => prev.filter((m) => m.id !== deletingMovement.id));
      toast.success('Movimentação excluída');
      setDeletingMovement(null);
      reloadMovements();
    } finally {
      setDeleteBusy(false);
    }
  };

  const handlePrintList = () => {
    try {
      if (isOverdueTab) {
        const pseudoRows: DemoMovementRow[] = searchedOverdue.map((item, index) => ({
          id: item.entryMovementIds[0] ?? `overdue-${index}`,
          company_id: companyId ?? '',
          movement_type: 'entry',
          sub_type: 'pending_exit',
          status: 'pending',
          warehouse_id: null,
          marketplace: null,
          reference_code: item.referenceCode ?? `Atraso ${item.daysOverdue}d`,
          total_quantity: item.pendingQuantity,
          created_at: `${item.entryDate}T12:00:00.000Z`,
          sku: item.sku,
          product_name: item.productName,
          warehouse_name: item.warehouseName,
        }));
        printMovementListDocument({
          title: TAB_PAGE_TITLES.overdue,
          subtitle: 'Entradas sem saída registrada',
          dateLabel: todayLabel,
          movements: pseudoRows,
          totals: movementTotals,
          operatorName: actorName,
          scopeNote: 'Pendências acumuladas por dia de entrada',
        });
        return;
      }

      const todayRows = searchedMovements.filter((m) => isSameLocalDay(m.created_at));
      const printRows = todayRows.length > 0 ? todayRows : searchedMovements;
      printMovementListDocument({
        title: TAB_PAGE_TITLES[tab],
        subtitle: isEntryTab
          ? 'Recebimentos do dia — bipagem, NF-e e conferência'
          : isExitTab
            ? 'Saídas do dia — expedição e estoque'
            : undefined,
        dateLabel: todayLabel,
        movements: printRows,
        totals: {
          movements: printRows.length,
          products: new Set(printRows.map((m) => m.sku).filter(Boolean)).size,
          units: printRows.reduce((sum, m) => sum + m.total_quantity, 0),
        },
        operatorName: actorName,
        scopeNote: `Lista do dia ${todayLabel}`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível imprimir a lista');
    }
  };

  const handlePrintMovement = (movement: DemoMovementRow) => {
    try {
      printMovementDocument(movement, {
        companyName,
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
      const updated = { ...editingMovement, ...payload };
      recordMovementEdited({
        companyId,
        movement: updated,
        actorName,
      });
      setMovements((prev) =>
        prev.map((m) => (m.id === editingMovement.id ? updated : m)),
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
    if (isExitTab) openExitModal();
    else entryPanelRef.current?.openScanner();
  };

  const openNewMovement = () => {
    if (isExitTab) openExitModal();
    else if (isEntryTab) entryPanelRef.current?.openScanner();
    else if (isTransferTab) navigate(`${LOGSTOKA_ROUTES.TRANSFERS}?new=1`);
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
        recordMovementDeleted({ companyId, movement: row, actorName });
      }
      setMovements((prev) => prev.filter((m) => !selectedKeys.has(m.id)));
      clearSelection();
      toast.success(`${selectedMovements.length} movimentação(ões) excluída(s)`);
      reloadMovements();
    } finally {
      setBulkDeleting(false);
    }
  };

  const useRichTableLayout = isEntryTab || isExitTab || isOverdueTab;

  const toolbarProps = {
    onRefresh: reloadMovements,
    onNewEntry: focusScanner,
    onImportXml: () => xmlRef.current?.click(),
    onImportCsv: () => navigate('/app/imports'),
    onImportExcel: () => navigate('/app/imports'),
    onImportPdf: () => navigate('/app/imports'),
    onPrint: handlePrintList,
    onShare: () => {
      const rows = isOverdueTab
        ? searchedOverdue.map((o) => `${o.sku} · ${o.productName} · ${o.entryQuantity} un.`)
        : searchedMovements.map((m) => `${m.sku} · ${m.product_name} · ${m.total_quantity} un.`);
      const text = `${TAB_PAGE_TITLES[tab]} · ${todayLabel}\n\n${rows.join('\n')}`;
      void navigator.clipboard.writeText(text).then(
        () => toast.success('Lista copiada para a área de transferência'),
        () => toast.error('Não foi possível copiar a lista'),
      );
    },
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
            resultCount={isOverdueTab ? searchedOverdue.length : searchedMovements.length}
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
                {!isOverdueTab ? (
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
                ) : null}
              </>
            }
          />
        </div>
        <div className="shrink-0 flex items-center ml-auto">
          <EntryToolbar {...toolbarProps} />
        </div>
      </div>

      {!isOverdueTab ? (
        <LogstokaTableBulkBar
          selectedCount={selectedCount}
          onEdit={handleBulkEdit}
          onTransfer={handleBulkTransfer}
          onDelete={bulkDeleting ? undefined : () => void handleBulkDelete()}
          onClear={clearSelection}
        />
      ) : null}

      <div className="ls-table-wrap">
        <table className="ls-table">
          <thead>
            <tr>
              {!isOverdueTab ? (
                <th className="w-10">
                  <LogstokaTableCheckbox
                    checked={isAllSelected}
                    indeterminate={selectedCount > 0 && !isAllSelected}
                    onChange={toggleSelectAll}
                    ariaLabel="Selecionar todos"
                  />
                </th>
              ) : null}
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
              {isOverdueTab ? (
                <>
                  <th>Qtd. pendente</th>
                  <th>Entrada em</th>
                  <th>Atraso</th>
                  <th>Depósito</th>
                  <th>Referência</th>
                </>
              ) : richLayout ? (
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
                    <span className="ls-table-col-total ls-table-col-total--units">{movementTotals.units.toLocaleString('pt-BR')} un.</span>
                  </th>
                  <th>Data</th>
                </>
              )}
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {isOverdueTab
              ? paginatedOverdue.map((item) => {
                  const linked = getDemoProductBySku(item.sku);
                  const movementId = item.entryMovementIds[0];
                  return (
                    <ClickableTableRow
                      key={`${item.sku}-${item.entryDate}`}
                      to={movementId ? `/app/movements/${movementId}` : '/app/movements?tab=overdue'}
                      className="ls-table-row--overdue"
                    >
                      <td>
                        <LogstokaIconTooltip label={formatOverdueLabel(item.daysOverdue)}>
                          <div className="ls-entry-table-thumb">
                            <ProductThumb src={linked?.main_image_url} name={item.productName} size={36} />
                            <div>
                              <p className="font-bold text-red-700">{item.sku}</p>
                              <p className="text-xs text-red-600/90">{item.productName}</p>
                            </div>
                          </div>
                        </LogstokaIconTooltip>
                      </td>
                      <td className="font-black text-red-700">{item.pendingQuantity}</td>
                      <td className="text-xs">
                        {new Date(`${item.entryDate}T12:00:00`).toLocaleDateString('pt-BR')}
                      </td>
                      <td>
                        <span className="ls-badge ls-badge--overdue">{formatOverdueLabel(item.daysOverdue)}</span>
                      </td>
                      <td>{item.warehouseName ?? '—'}</td>
                      <td>{item.referenceCode ?? '—'}</td>
                      <td className="ls-table-actions-cell">
                        <button
                          type="button"
                          className="ls-btn-secondary text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectTab('exit');
                            focusScanner();
                          }}
                        >
                          Registrar saída
                        </button>
                      </td>
                    </ClickableTableRow>
                  );
                })
              : paginatedMovements.map((m) => {
              const linked = getDemoProductBySku(m.sku);
              const selected = selectedKeys.has(m.id);
              const overdueDays = m.sku ? overdueBySku.get(m.sku) : undefined;
              const rowClass = [
                selected ? 'ls-table-row--selected' : '',
                overdueDays ? 'ls-table-row--overdue' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <ClickableTableRow
                  key={m.id}
                  to={`/app/movements/${m.id}`}
                  className={rowClass || undefined}
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
                      <LogstokaIconTooltip
                        label={overdueDays ? formatOverdueLabel(overdueDays) : m.product_name ?? m.sku ?? ''}
                      >
                        <div className="ls-entry-table-thumb">
                          <ProductThumb src={linked?.main_image_url} name={m.product_name ?? m.sku ?? ''} size={36} />
                          <div>
                            <p className={`font-bold ${overdueDays ? 'text-red-700' : ''}`}>{m.sku}</p>
                            <p className={`text-xs ${overdueDays ? 'text-red-600/90' : 'text-slate-500'}`}>
                              {m.product_name}
                              {overdueDays ? (
                                <span className="ls-entry-overdue-inline"> · {formatOverdueLabel(overdueDays)}</span>
                              ) : null}
                            </p>
                          </div>
                        </div>
                      </LogstokaIconTooltip>
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
                      onPrintLabel={() => setLabelModal(stockLabelFromMovement(m, linked))}
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
            ? `Recebimento do dia ${todayLabel} — escaneie, some quantidades e registre no estoque. Itens sem saída vão para Atrasos.`
            : isExitTab
              ? `Saídas do dia ${todayLabel} — expedição com motorista, assinatura e registro manual pelo +.`
              : isOverdueTab
                ? 'Entradas sem saída correspondente — acumula por dia até você registrar a expedição.'
                : isTransferTab
                  ? 'Transferência entre CDs — histórico do dia. Use + para nova transferência com aprovação.'
                  : `${activeTab.label} · NF-e e registro em tempo real.`
        }
        actions={
          <>
            {isEntryTab ? (
              <LogstokaAddIconButton
                variant="dark"
                title="Nova entrada manual"
                onClick={() => entryPanelRef.current?.openScanner()}
              />
            ) : null}
            {isExitTab ? (
              <LogstokaAddIconButton variant="dark" title="Nova saída manual" onClick={openExitModal} />
            ) : null}
            {isTransferTab ? (
              <LogstokaAddIconButton
                variant="dark"
                title="Nova transferência entre CDs"
                onClick={() => navigate(`${LOGSTOKA_ROUTES.TRANSFERS}?new=1`)}
              />
            ) : null}
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
            <Link
              to={`${LOGSTOKA_ROUTES.MOVEMENTS_HISTORY}?tipo=${tab}`}
              className="ls-btn-secondary inline-flex items-center gap-2 text-sm shrink-0"
              title="Histórico · colaborador, período e detalhe"
            >
              <History size={16} strokeWidth={2.25} aria-hidden />
              Histórico
            </Link>
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
        <MovementExitRegisterModal
          open={exitModalOpen}
          saving={exitSaving}
          companyId={companyId}
          form={exitForm}
          warehouses={physicalWarehouses}
          defaultOperatorName={actorName}
          onClose={() => {
            setExitModalOpen(false);
            exitScan.clearScan();
          }}
          onChange={(patch) => setExitForm((f) => ({ ...f, ...patch }))}
          onSubmit={() => void createExitMovement()}
          scan={{
            companyId,
            demo,
            scanMode: exitScan.scanMode,
            onScanModeChange: exitScan.setScanMode,
            scanValue: exitScan.scanValue,
            onScanValueChange: exitScan.setScanValue,
            onClearScan: exitScan.clearScan,
            quantity: exitForm.quantity || exitScan.quantity,
            onQuantityChange: (qty) => {
              exitScan.setQuantity(qty);
              setExitForm((f) => ({ ...f, quantity: qty }));
            },
            resolvedProduct: exitScan.resolvedProduct,
            resolving: exitScan.resolving,
            interpreting: exitScan.interpreting,
            scanInterpretation: exitScan.scanInterpretation,
            onRegister: () => void createExitMovement(),
            onUseExisting: applyExitProduct,
            registering: exitSaving,
          }}
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
          {isEntryTab || isExitTab || isTransferTab ? (
            <LogstokaAddIconButton
              variant="dark"
              title={
                isEntryTab
                  ? 'Nova entrada manual'
                  : isExitTab
                    ? 'Nova saída manual'
                    : 'Nova transferência entre CDs'
              }
              onClick={openNewMovement}
            />
          ) : null}
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
          void value;
          void status;
          if (isScanTab) focusScanner();
        }}
      />

      <StockLabelPreviewModal
        open={Boolean(labelModal)}
        onClose={() => setLabelModal(null)}
        data={labelModal ?? EMPTY_STOCK_LABEL}
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
