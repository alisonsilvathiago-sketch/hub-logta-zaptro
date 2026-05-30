import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  FileUp,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import MovementEditModal, { type MovementEditPayload } from '@/components/movements/MovementEditModal';
import MovementQuickProductModal from '@/components/movements/MovementQuickProductModal';
import MovementRowActions from '@/components/movements/MovementRowActions';
import MovementScanSection from '@/components/movements/MovementScanSection';
import ClickableTableRow from '@/components/ui/ClickableTableRow';
import LogstokaIconNav, { type LogstokaIconNavButtonItem, LogstokaIconNavButton } from '@/components/ui/LogstokaIconNav';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useTablePagination } from '@/hooks/useTablePagination';
import { logstokaApi } from '@/lib/logstokaApi';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_MOVEMENTS, movementTypeLabel, marketplaceLabel, type DemoMovementRow } from '@/lib/logstokaDemoSeed';
import { type ProductLookupResult, type ProductScanMode } from '@/lib/productLookup';
import { processIntelligentScan, scanResultToQuickPrefill, type IntelligentScanResult } from '@/lib/intelligentScanClient';
import { bumpDemoInternalSkuCounter } from '@/lib/internalProductCode';
import { createQuickProduct } from '@/lib/quickProductCreate';
import { printMovementDocument } from '@/lib/printMovementDocument';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';

const tabs = [
  { id: 'entry', label: 'Entrada', Icon: ArrowDownToLine },
  { id: 'exit', label: 'Saída', Icon: ArrowUpFromLine },
  { id: 'transfer', label: 'Transferência', Icon: ArrowLeftRight },
  { id: 'damage', label: 'Avaria', Icon: AlertTriangle },
] as const;

type MovementTab = (typeof tabs)[number]['id'];

function filterMovementsByTab(items: DemoMovementRow[], tab: MovementTab) {
  if (tab === 'entry') return items.filter((m) => m.movement_type === 'entry');
  if (tab === 'exit') return items.filter((m) => m.movement_type === 'exit');
  if (tab === 'transfer') return items.filter((m) => m.movement_type === 'transfer');
  return items.filter((m) => m.movement_type === 'damage');
}

const MovementsPage: React.FC = () => {
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const demo = isLogstokaDemoCompany(companyId);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabs.some((t) => t.id === tabParam) ? (tabParam as MovementTab) : 'entry';
  const [tab, setTab] = useState<MovementTab>(initialTab);
  const [movements, setMovements] = useState<DemoMovementRow[]>(() => [...DEMO_MOVEMENTS]);
  const [scanMode, setScanMode] = useState<ProductScanMode>('universal');
  const [scanValue, setScanValue] = useState('');
  const [scanInterpretation, setScanInterpretation] = useState<IntelligentScanResult | null>(null);
  const [interpreting, setInterpreting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [resolvedProduct, setResolvedProduct] = useState<ProductLookupResult | null>(null);
  const [resolving, setResolving] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateSaving, setQuickCreateSaving] = useState(false);
  const [editingMovement, setEditingMovement] = useState<DemoMovementRow | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const xmlRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((t) => t.id === tab) ?? tabs[0];
  const movementLabel = activeTab.label;
  const ActiveTabIcon = activeTab.Icon;

  useEffect(() => {
    if (tabParam && tabs.some((t) => t.id === tabParam) && tabParam !== tab) {
      setTab(tabParam as MovementTab);
    }
  }, [tabParam, tab]);

  useEffect(() => {
    if (!scanValue.trim()) {
      setResolvedProduct(null);
      setScanInterpretation(null);
      return;
    }

    let cancelled = false;
    setInterpreting(true);
    setResolving(true);
    void processIntelligentScan(companyId, scanValue, demo, tab)
      .then((result) => {
        if (cancelled) return;
        setScanInterpretation(result);
        setResolvedProduct(result.catalogMatch);
      })
      .catch((err) => {
        if (!cancelled) {
          setScanInterpretation(null);
          setResolvedProduct(null);
          toast.error(err instanceof Error ? err.message : 'Erro ao interpretar leitura');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setInterpreting(false);
          setResolving(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, demo, scanValue, tab]);

  const selectTab = (id: MovementTab) => {
    setTab(id);
    setSearchParams({ tab: id }, { replace: true });
  };

  const filteredMovements = useMemo(() => filterMovementsByTab(movements, tab), [movements, tab]);
  const { paginatedItems, footerProps } = useTablePagination(filteredMovements, 10, tab);

  const movementTotals = useMemo(() => {
    const units = filteredMovements.reduce((sum, m) => sum + m.total_quantity, 0);
    const products = new Set(filteredMovements.map((m) => m.sku).filter(Boolean)).size;
    return {
      movements: filteredMovements.length,
      products,
      units,
    };
  }, [filteredMovements]);

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

  const registerMovement = async (sku: string) => {
    if (tab === 'transfer') {
      toast.error('Informe depósitos origem/destino na transferência completa');
      return;
    }

    const item = { sku, quantity };
    if (demo) {
      toast.success(`[Demo] ${movementLabel} registrada: ${sku} × ${quantity}`);
      setScanValue('');
      setResolvedProduct(null);
      return;
    }

    if (tab === 'entry') {
      await logstokaApi.createEntry({ sub_type: 'factory', items: [item] });
    } else if (tab === 'exit') {
      await logstokaApi.createOutput({ sub_type: 'sale', items: [item] });
    } else {
      await logstokaApi.createDamage({ reason: 'other', sku, quantity });
    }
  };

  const handleRegister = async () => {
    if (!scanValue.trim()) {
      toast.error('Leia ou digite um código primeiro');
      return;
    }

    if (resolvedProduct) {
      setRegistering(true);
      try {
        await registerMovement(resolvedProduct.sku);
        toast.success('Movimentação registrada e estoque atualizado');
        setScanValue('');
        setResolvedProduct(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao registrar');
      } finally {
        setRegistering(false);
      }
      return;
    }

    setQuickCreateOpen(true);
  };

  const handleUseExistingProduct = async (product: ProductLookupResult) => {
    setQuickCreateOpen(false);
    setRegistering(true);
    try {
      await registerMovement(product.sku);
      toast.success(`Movimentação registrada para ${product.name}`);
      setScanValue('');
      setResolvedProduct(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar');
    } finally {
      setRegistering(false);
    }
  };

  const handleQuickCreate = async (payload: {
    name: string;
    internal_code: string;
    barcode: string;
    brand?: string;
    main_image_url?: string | null;
  }) => {
    if (demo) {
      bumpDemoInternalSkuCounter();
      toast.success(`[Demo] Produto "${payload.name}" cadastrado e ${movementLabel.toLowerCase()} registrada`);
      setQuickCreateOpen(false);
      setScanValue('');
      setResolvedProduct(null);
      return;
    }

    if (!companyId) {
      toast.error('Empresa não identificada');
      return;
    }

    setQuickCreateSaving(true);
    try {
      const product = await createQuickProduct(companyId, payload);
      await registerMovement(product.sku);
      toast.success(`Produto ${product.sku} cadastrado e movimentação registrada`);
      setQuickCreateOpen(false);
      setScanValue('');
      setResolvedProduct(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar produto');
    } finally {
      setQuickCreateSaving(false);
    }
  };

  const handleXml = async (file: File) => {
    if (demo) {
      toast.success(`[Demo] NF-e ${file.name} importada — 12 produtos`);
      return;
    }
    try {
      const xml = await file.text();
      const result = await logstokaApi.importXml(xml);
      toast.success(`Entrada NF-e — ${result.items} produtos (mov. ${result.movementId.slice(0, 8)}…)`);
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

  const handleDeleteMovement = (id: string) => {
    setMovements((prev) => prev.filter((m) => m.id !== id));
    toast.success('Movimentação excluída');
  };

  const handlePrintMovement = (movement: DemoMovementRow) => {
    try {
      printMovementDocument(movement, {
        companyName: 'LogStoka Demo · Pluma Baby',
        operatorName: profile?.full_name ?? profile?.email ?? 'Operador',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível imprimir');
    }
  };

  const handleSaveMovement = async (payload: MovementEditPayload) => {
    if (!editingMovement) return;

    setEditSaving(true);
    try {
      if (demo) {
        setMovements((prev) =>
          prev.map((m) => (m.id === editingMovement.id ? { ...m, ...payload } : m)),
        );
        toast.success('Movimentação atualizada');
        setEditingMovement(null);
        return;
      }

      toast.success('Movimentação atualizada localmente');
      setMovements((prev) =>
        prev.map((m) => (m.id === editingMovement.id ? { ...m, ...payload } : m)),
      );
      setEditingMovement(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <MovementScanSection
        companyId={companyId}
        demo={demo}
        scanMode={scanMode}
        onScanModeChange={setScanMode}
        scanValue={scanValue}
        pageTitleIcon={<ActiveTabIcon size={20} strokeWidth={2.25} aria-hidden />}
        headerActions={
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
            <LogstokaIconNavButton title="Importar XML da NF-e" onClick={() => xmlRef.current?.click()}>
              <FileUp size={18} strokeWidth={2.2} aria-hidden />
            </LogstokaIconNavButton>
          </>
        }
        onScanValueChange={(value) => {
          setScanValue(value);
          toast.success(`Código lido: ${value}`);
        }}
        onClearScan={() => {
          setScanValue('');
          setResolvedProduct(null);
          setScanInterpretation(null);
        }}
        quantity={quantity}
        onQuantityChange={setQuantity}
        resolvedProduct={resolvedProduct}
        resolving={resolving}
        interpreting={interpreting}
        scanInterpretation={scanInterpretation}
        movementLabel={movementLabel}
        onRegister={() => void handleRegister()}
        onUseExisting={(product) => void handleUseExistingProduct(product)}
        registering={registering}
      />

      <div className="ls-table-wrap">
        <table className="ls-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>
                <span className="ls-table-col-head">SKU / Produto</span>
                <span className="ls-table-col-total">
                  {movementTotals.products} produtos · {movementTotals.movements} mov.
                </span>
              </th>
              <th>Depósito</th>
              <th>Canal</th>
              <th>Referência</th>
              <th>
                <span className="ls-table-col-head">Qtd</span>
                <span className="ls-table-col-total">{movementTotals.units.toLocaleString('pt-BR')} un.</span>
              </th>
              <th>Data</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((m) => (
              <ClickableTableRow key={m.id} to={`/app/movements/${m.id}`}>
                <td>
                  <span className="ls-badge bg-orange-50 text-orange-700">{movementTypeLabel(m.movement_type)}</span>
                </td>
                <td>
                  <p className="font-bold">{m.sku}</p>
                  <p className="text-xs text-slate-500">{m.product_name}</p>
                </td>
                <td>{m.warehouse_name}</td>
                <td>{marketplaceLabel(m.marketplace)}</td>
                <td>{m.reference_code}</td>
                <td className="font-black text-orange-700">{m.total_quantity}</td>
                <td className="text-xs">{new Date(m.created_at).toLocaleString('pt-BR')}</td>
                <td className="ls-table-actions-cell">
                  <MovementRowActions
                    onEdit={() => setEditingMovement(m)}
                    onDuplicate={() => handleDuplicateMovement(m)}
                    onPrint={() => handlePrintMovement(m)}
                    onDelete={() => handleDeleteMovement(m.id)}
                  />
                </td>
              </ClickableTableRow>
            ))}
          </tbody>
        </table>
      </div>

      <LogstokaTableFooter {...footerProps} />

      <MovementQuickProductModal
        open={quickCreateOpen}
        scanValue={scanValue}
        scanMode={scanMode === 'barcode' ? 'barcode' : 'code'}
        scanPrefill={scanResultToQuickPrefill(scanInterpretation)}
        quantity={quantity}
        movementLabel={movementLabel}
        saving={quickCreateSaving}
        onClose={() => setQuickCreateOpen(false)}
        onConfirm={(payload) => void handleQuickCreate(payload)}
        onUseExisting={(product) => void handleUseExistingProduct(product)}
      />

      <MovementEditModal
        open={Boolean(editingMovement)}
        movement={editingMovement}
        saving={editSaving}
        onClose={() => setEditingMovement(null)}
        onSave={(payload) => void handleSaveMovement(payload)}
      />
    </div>
  );
};

export default MovementsPage;
