import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import TransferRegisterModal, { type TransferFormState } from '@/components/transfers/TransferRegisterModal';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaAddIconButton from '@/components/ui/LogstokaAddIconButton';
import ClickableTableRow, { stopRowNavigate } from '@/components/ui/ClickableTableRow';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useIntelligentScanState } from '@/hooks/useIntelligentScanState';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useWarehouses } from '@/hooks/useCatalog';
import { useLogstokaWarehouseScope } from '@/context/LogstokaWarehouseScopeContext';
import { appendDemoTransfer, loadMergedDemoTransfers } from '@/lib/demoTransferStore';
import { upsertDemoDriver } from '@/lib/demoDriverStore';
import { getDemoProductById } from '@/lib/logstokaDemoSeed';
import { getProductStockAtWarehouse } from '@/lib/productStockByCd';
import { logstokaApi } from '@/lib/logstokaApi';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { type DemoTransferRow } from '@/lib/logstokaDemoSeed';
import type { ProductLookupResult } from '@/lib/productLookup';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useAuth } from '@/context/LogstokaAuthProvider';

const statusMap: Record<string, string> = {
  pending: 'Pendente',
  in_transit: 'Em trânsito',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

const emptyForm: TransferFormState = {
  origin: '',
  destination: '',
  productId: '',
  sku: '',
  productName: '',
  internalCode: '',
  quantity: 1,
  notes: '',
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

const TransfersPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const { profile } = useAuth();
  const { visibleWarehouses, assignedWarehouseId } = useLogstokaWarehouseScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const demo = isLogstokaDemoCompany(companyId);
  const { warehouses: allWarehouses } = useWarehouses();
  const physicalWarehouses = useMemo(
    () =>
      visibleWarehouses.filter(
        (w) => w.type === 'physical' && w.is_active,
      ).length > 0
        ? visibleWarehouses.filter((w) => w.type === 'physical' && w.is_active)
        : allWarehouses.filter((w) => w.type === 'physical' && w.is_active),
    [visibleWarehouses, allWarehouses],
  );
  const [transfers, setTransfers] = useState<DemoTransferRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TransferFormState>(emptyForm);
  const [registering, setRegistering] = useState(false);

  const scan = useIntelligentScanState(companyId, demo, 'transfer');

  const defaultOrigin = assignedWarehouseId ?? physicalWarehouses[0]?.id ?? '';

  const load = useCallback(async () => {
    if (!companyId) return;
    if (demo) {
      setTransfers(loadMergedDemoTransfers(companyId));
      return;
    }
    const { data } = await supabase
      .from('ls_transfers')
      .select('*, origin:ls_warehouses!origin_warehouse_id(name), destination:ls_warehouses!destination_warehouse_id(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50);
    setTransfers(
      (data ?? []).map((t: Record<string, unknown>) => ({
        id: String(t.id),
        status: String(t.status),
        notes: t.notes as string | null,
        created_at: String(t.created_at),
        origin_warehouse_id: String(t.origin_warehouse_id),
        destination_warehouse_id: String(t.destination_warehouse_id),
        origin_name: String((t.origin as { name?: string })?.name ?? '—'),
        destination_name: String((t.destination as { name?: string })?.name ?? '—'),
        items: [],
      })),
    );
  }, [companyId, demo]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onUpdate = () => void load();
    window.addEventListener('logstoka:demo-transfers-updated', onUpdate);
    return () => window.removeEventListener('logstoka:demo-transfers-updated', onUpdate);
  }, [load]);

  useEffect(() => {
    if (!scan.resolvedProduct) return;
    const p = scan.resolvedProduct;
    setForm((f) => ({
      ...f,
      productId: p.id,
      sku: p.sku,
      productName: p.name,
      internalCode: p.internal_code ?? '',
      quantity: scan.quantity,
    }));
  }, [scan.resolvedProduct, scan.quantity]);

  const openModal = useCallback(
    (preset?: Partial<TransferFormState>) => {
      setForm({
        ...emptyForm,
        origin: preset?.origin ?? defaultOrigin,
        destination: preset?.destination ?? '',
        quantity: 1,
        ...preset,
      });
      scan.clearScan();
      setModalOpen(true);
    },
    [defaultOrigin, scan],
  );

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;
    const productId = searchParams.get('productId');
    const origin = searchParams.get('origin') ?? defaultOrigin;
    setForm({
      ...emptyForm,
      origin,
    });
    if (productId && demo) {
      const product = getDemoProductById(productId);
      if (product) {
        scan.setScanValue(product.internal_code ?? product.sku);
      }
    }
    setModalOpen(true);
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- abrir modal uma vez via URL
  }, [searchParams.get('new')]);

  const { paginatedItems, footerProps } = useTablePagination(transfers);

  const counts = useMemo(
    () =>
      transfers.reduce(
        (acc, t) => {
          if (t.status in acc) acc[t.status as keyof typeof acc] += 1;
          return acc;
        },
        { pending: 0, in_transit: 0, completed: 0, cancelled: 0 },
      ),
    [transfers],
  );

  const applyProduct = (product: ProductLookupResult) => {
    setForm((f) => ({
      ...f,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      internalCode: product.internal_code ?? '',
      quantity: scan.quantity,
    }));
    scan.setScanValue(product.internal_code ?? product.sku);
  };

  const createTransfer = async () => {
    const sku = form.sku || scan.resolvedProduct?.sku;
    const productName = form.productName || scan.resolvedProduct?.name;
    const productId = form.productId || scan.resolvedProduct?.id;

    if (!form.origin || !form.destination) {
      toast.error('Selecione origem e destino');
      return;
    }
    if (form.origin === form.destination) {
      toast.error('Origem e destino devem ser CDs diferentes');
      return;
    }
    if (!sku || !productId) {
      toast.error('Busque o produto pelo código LS ou EAN antes de confirmar');
      return;
    }
    if (form.quantity < 1) {
      toast.error('Informe a quantidade');
      return;
    }
    if (!form.releasedByName.trim()) {
      toast.error('Informe o responsável pela liberação');
      return;
    }
    if (!form.driverName.trim()) {
      toast.error('Informe o motorista ou quem vai entregar');
      return;
    }
    if (!form.signatureDataUrl) {
      toast.error('Assinatura do responsável é obrigatória');
      return;
    }
    if (!form.confirmed) {
      toast.error('Marque a confirmação de conferência dos itens');
      return;
    }

    const available = demo ? getProductStockAtWarehouse(productId, form.origin, companyId) : null;
    if (demo && available !== null && form.quantity > available) {
      toast.error(`Saldo insuficiente na origem (${available} un. disponíveis)`);
      return;
    }

    setRegistering(true);
    try {
      if (demo && companyId) {
        const driver = upsertDemoDriver(companyId, {
          full_name: form.driverName.trim(),
          cpf: form.driverCpf.trim(),
          company_name: form.companyName.trim(),
          company_cnpj: form.companyCnpj.trim(),
          warehouse_id: form.origin,
        });

        appendDemoTransfer(companyId, {
          origin_warehouse_id: form.origin,
          destination_warehouse_id: form.destination,
          sku,
          product_name: productName ?? sku,
          quantity: form.quantity,
          notes: form.notes,
          release_approval: {
            released_by_name: form.releasedByName.trim(),
            driver_id: driver.id,
            driver_name: form.driverName.trim(),
            driver_cpf: form.driverCpf.trim() || null,
            company_name: form.companyName.trim() || null,
            company_cnpj: form.companyCnpj.trim() || null,
            driver_plate: form.driverPlate.trim() || null,
            signature_data_url: form.signatureDataUrl,
            approved_at: form.signatureSignedAt || new Date().toISOString(),
          },
        });
        toast.success('Transferência registrada com aprovação');
        setModalOpen(false);
        setForm(emptyForm);
        scan.clearScan();
        await load();
        return;
      }
      await logstokaApi.createTransfer({
        origin_warehouse_id: form.origin,
        destination_warehouse_id: form.destination,
        notes: form.notes,
        items: [{ sku, quantity: form.quantity }],
      });
      toast.success('Transferência criada');
      setModalOpen(false);
      setForm(emptyForm);
      scan.clearScan();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setRegistering(false);
    }
  };

  const scanProps = {
    companyId,
    demo,
    scanMode: scan.scanMode,
    onScanModeChange: scan.setScanMode,
    scanValue: scan.scanValue,
    onScanValueChange: scan.setScanValue,
    onClearScan: scan.clearScan,
    quantity: form.quantity || scan.quantity,
    onQuantityChange: (qty: number) => {
      scan.setQuantity(qty);
      setForm((f) => ({ ...f, quantity: qty }));
    },
    resolvedProduct: scan.resolvedProduct,
    resolving: scan.resolving,
    interpreting: scan.interpreting,
    scanInterpretation: scan.scanInterpretation,
    onRegister: () => void createTransfer(),
    onUseExisting: applyProduct,
    registering,
  };

  return (
    <div className="space-y-6">
      <LogstokaPageHeader
        eyebrow="Operação WMS"
        icon={<ArrowLeftRight size={20} strokeWidth={2.25} />}
        title="Transferências entre CDs"
        subtitle="Mova produtos entre galpões com aprovação, assinatura e identificação do motorista"
        actions={
          <LogstokaAddIconButton
            variant="dark"
            title="Nova transferência entre CDs"
            onClick={() => openModal()}
          />
        }
      />

      <LogstokaKpiStrip
        items={[
          { label: 'Pendentes', value: counts.pending },
          { label: 'Em trânsito', value: counts.in_transit },
          { label: 'Concluídas', value: counts.completed },
          { label: 'Canceladas', value: counts.cancelled },
        ]}
      />

      <section className="ls-page-table">
        <div className="ls-table-wrap">
          <table className="ls-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Origem → Destino</th>
                <th>Itens</th>
                <th>Responsável / Motorista</th>
                <th>Observação</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((t) => (
                <ClickableTableRow key={t.id} to={`/app/transfers/${t.id}`}>
                  <td>
                    <span className="ls-badge bg-slate-100">{statusMap[t.status] ?? t.status}</span>
                  </td>
                  <td>
                    {t.origin_name} → {t.destination_name}
                  </td>
                  <td className="text-sm">
                    {t.items.map((i) => (
                      <div key={i.sku}>
                        {i.name} · {i.quantity} un.
                      </div>
                    ))}
                  </td>
                  <td className="text-xs font-semibold text-[#525252]">
                    {t.release_approval ? (
                      <>
                        <div>{t.release_approval.released_by_name}</div>
                        <div className="text-[#737373]">Motorista: {t.release_approval.driver_name}</div>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{t.notes || '—'}</td>
                  <td>{new Date(t.created_at).toLocaleString('pt-BR')}</td>
                  <td onClick={stopRowNavigate} className="flex gap-1">
                    {t.status === 'pending' && !demo && (
                      <button type="button" className="ls-btn-secondary px-2 py-1 text-xs" onClick={() => void logstokaApi.shipTransfer(t.id).then(load)}>
                        Enviar
                      </button>
                    )}
                    {t.status === 'in_transit' && !demo && (
                      <button type="button" className="ls-btn-primary px-2 py-1 text-xs" onClick={() => void logstokaApi.receiveTransfer(t.id).then(load)}>
                        Receber
                      </button>
                    )}
                  </td>
                </ClickableTableRow>
              ))}
            </tbody>
          </table>
        </div>
        <LogstokaTableFooter {...footerProps} />
      </section>

      <TransferRegisterModal
        open={modalOpen}
        saving={registering}
        companyId={companyId}
        form={form}
        warehouses={physicalWarehouses}
        defaultOperatorName={profile?.full_name ?? ''}
        scan={scanProps}
        onClose={() => setModalOpen(false)}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onSubmit={() => void createTransfer()}
      />
    </div>
  );
};

export default TransfersPage;
