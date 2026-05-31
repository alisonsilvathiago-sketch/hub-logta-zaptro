import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { logstokaApi } from '@/lib/logstokaApi';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_TRANSFERS, type DemoTransferRow } from '@/lib/logstokaDemoSeed';
import type { ProductLookupResult } from '@/lib/productLookup';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';

const statusMap: Record<string, string> = {
  pending: 'Pendente',
  in_transit: 'Em trânsito',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

const emptyForm: TransferFormState = {
  origin: '',
  destination: '',
  sku: '',
  quantity: 1,
  notes: '',
};

const TransfersPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const demo = isLogstokaDemoCompany(companyId);
  const { warehouses } = useWarehouses();
  const [transfers, setTransfers] = useState<DemoTransferRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TransferFormState>(emptyForm);
  const [registering, setRegistering] = useState(false);

  const scan = useIntelligentScanState(companyId, demo, 'transfer');

  const load = useCallback(async () => {
    if (!companyId) return;
    if (demo) {
      setTransfers(DEMO_TRANSFERS);
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

  const openModal = () => {
    setModalOpen(true);
  };

  const handleUseExisting = (product: ProductLookupResult) => {
    setForm((f) => ({ ...f, sku: product.sku, quantity: scan.quantity }));
    setModalOpen(true);
  };

  const createTransfer = async () => {
    if (!form.origin || !form.destination || !form.sku) {
      toast.error('Preencha origem, destino e SKU');
      return;
    }
    setRegistering(true);
    try {
      if (demo) {
        toast.success('[Demo] Transferência criada');
        setModalOpen(false);
        setForm(emptyForm);
        scan.clearScan();
        return;
      }
      await logstokaApi.createTransfer({
        origin_warehouse_id: form.origin,
        destination_warehouse_id: form.destination,
        notes: form.notes,
        items: [{ sku: form.sku, quantity: form.quantity }],
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
    onScanValueChange: (value: string) => {
      scan.setScanValue(value);
      toast.success(`Código lido: ${value}`);
    },
    onClearScan: scan.clearScan,
    quantity: scan.quantity,
    onQuantityChange: scan.setQuantity,
    resolvedProduct: scan.resolvedProduct,
    resolving: scan.resolving,
    interpreting: scan.interpreting,
    scanInterpretation: scan.scanInterpretation,
    onRegister: () => void createTransfer(),
    onUseExisting: handleUseExisting,
    registering,
  };

  return (
    <div className="space-y-6">
      <LogstokaPageHeader
        eyebrow="Operação WMS"
        icon={<ArrowLeftRight size={20} strokeWidth={2.25} />}
        title="Transferências"
        subtitle="Movimentação entre depósitos. Use o scanner global ou cadastre manualmente."
        actions={<LogstokaAddIconButton title="Nova transferência" onClick={openModal} />}
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
                        {i.sku} · {i.quantity} un.
                      </div>
                    ))}
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
        form={form}
        warehouses={warehouses}
        scan={{
          ...scanProps,
          onRegister: () => void createTransfer(),
          onUseExisting: (product) => {
            setForm((f) => ({ ...f, sku: product.sku, quantity: scan.quantity }));
          },
        }}
        onClose={() => setModalOpen(false)}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onSubmit={() => void createTransfer()}
      />
    </div>
  );
};

export default TransfersPage;
