import React, { useCallback, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ReturnRegisterModal, { type ReturnFormState } from '@/components/returns/ReturnRegisterModal';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaAddIconButton from '@/components/ui/LogstokaAddIconButton';
import ClickableTableRow, { stopRowNavigate } from '@/components/ui/ClickableTableRow';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useIntelligentScanState } from '@/hooks/useIntelligentScanState';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useWarehouses, useStores } from '@/hooks/useCatalog';
import { logstokaApi } from '@/lib/logstokaApi';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_RETURNS, type DemoReturnRow } from '@/lib/logstokaDemoSeed';
import type { ProductLookupResult } from '@/lib/productLookup';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';

const statusLabels: Record<string, string> = {
  received: 'Recebido',
  triage: 'Triagem',
  approved: 'Aprovado',
  rejected: 'Reprovado',
  completed: 'Concluído',
};

const emptyForm: ReturnFormState = {
  order_reference: '',
  reason: '',
  sku: '',
  quantity: 1,
  store_id: '',
  warehouse_id: '',
};

const ReturnsPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const demo = isLogstokaDemoCompany(companyId);
  const { warehouses } = useWarehouses();
  const { stores } = useStores();
  const [returns, setReturns] = useState<DemoReturnRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ReturnFormState>(emptyForm);
  const [registering, setRegistering] = useState(false);

  const scan = useIntelligentScanState(companyId, demo, 'return');

  const load = useCallback(async () => {
    if (!companyId) return;
    if (demo) {
      setReturns(DEMO_RETURNS);
      return;
    }
    const { data } = await supabase
      .from('ls_returns')
      .select('*, ls_return_items(*)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50);
    setReturns(
      (data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        status: String(r.status),
        order_reference: r.order_reference as string | null,
        reason: r.reason as string | null,
        created_at: String(r.created_at),
        sku: '—',
        product_name: '—',
        quantity: 0,
        store_name: '—',
      })),
    );
  }, [companyId, demo]);

  useEffect(() => {
    void load();
  }, [load]);

  const { paginatedItems, footerProps } = useTablePagination(returns);

  const openModal = () => {
    setModalOpen(true);
  };

  const handleUseExisting = (product: ProductLookupResult) => {
    setForm((f) => ({ ...f, sku: product.sku, quantity: scan.quantity }));
    setModalOpen(true);
  };

  const createReturn = async () => {
    if (!form.sku) {
      toast.error('Informe o SKU');
      return;
    }
    setRegistering(true);
    try {
      if (demo) {
        toast.success('[Demo] Devolução registrada');
        setModalOpen(false);
        setForm(emptyForm);
        scan.clearScan();
        return;
      }
      await logstokaApi.createReturn({
        order_reference: form.order_reference,
        reason: form.reason,
        store_id: form.store_id || undefined,
        warehouse_id: form.warehouse_id || undefined,
        items: [{ sku: form.sku, quantity: form.quantity }],
      });
      toast.success('Devolução registrada');
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

  const action = async (id: string, type: 'triage' | 'approve' | 'reject') => {
    if (demo) {
      toast.success('[Demo] Status atualizado');
      return;
    }
    const wh = warehouses[0]?.id;
    try {
      if (type === 'triage') await logstokaApi.triageReturn(id);
      if (type === 'approve') await logstokaApi.approveReturn(id, wh);
      if (type === 'reject') await logstokaApi.rejectReturn(id, 'Reprovado na triagem', wh);
      toast.success('Status atualizado');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const counts = returns.reduce(
    (acc, r) => {
      if (['received', 'triage', 'approved', 'rejected'].includes(r.status)) {
        const key = r.status as keyof typeof acc;
        acc[key] = (acc[key] ?? 0) + 1;
      }
      return acc;
    },
    { received: 0, triage: 0, approved: 0, rejected: 0 } as Record<'received' | 'triage' | 'approved' | 'rejected', number>,
  );

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
    onRegister: () => void createReturn(),
    onUseExisting: handleUseExisting,
    registering,
  };

  return (
    <div className="space-y-6">
      <LogstokaPageHeader
        eyebrow="Operação WMS"
        icon={<RotateCcw size={20} strokeWidth={2.25} />}
        title="Devoluções"
        subtitle="Triagem e registro de devoluções. Use o scanner global ou cadastre manualmente."
        actions={<LogstokaAddIconButton title="Nova devolução" onClick={openModal} />}
      />

      <LogstokaKpiStrip
        items={[
          { label: 'Recebido', value: counts.received },
          { label: 'Triagem', value: counts.triage },
          { label: 'Aprovado', value: counts.approved },
          { label: 'Reprovado', value: counts.rejected },
        ]}
      />

      <section className="ls-page-table">
      <div className="ls-table-wrap">
        <table className="ls-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>SKU / Produto</th>
              <th>Loja</th>
              <th>Qtd</th>
              <th>Status</th>
              <th>Motivo</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((r) => (
              <ClickableTableRow key={r.id} to={`/app/returns/${r.id}`}>
                <td>{r.order_reference || '—'}</td>
                <td>
                  <p className="font-bold">{r.sku}</p>
                  <p className="text-xs text-slate-500">{r.product_name}</p>
                </td>
                <td>{r.store_name}</td>
                <td className="font-bold text-orange-700">{r.quantity}</td>
                <td>
                  <span className="ls-badge bg-slate-100">{statusLabels[r.status] ?? r.status}</span>
                </td>
                <td>{r.reason || '—'}</td>
                <td>{new Date(r.created_at).toLocaleString('pt-BR')}</td>
                <td onClick={stopRowNavigate}>
                  <div className="flex flex-wrap gap-1">
                    {r.status === 'received' && (
                      <button type="button" className="ls-btn-secondary px-2 py-1 text-xs" onClick={() => void action(r.id, 'triage')}>
                        Triagem
                      </button>
                    )}
                    {r.status === 'triage' && (
                      <>
                        <button type="button" className="ls-btn-primary px-2 py-1 text-xs" onClick={() => void action(r.id, 'approve')}>
                          Aprovar
                        </button>
                        <button type="button" className="ls-btn-secondary px-2 py-1 text-xs" onClick={() => void action(r.id, 'reject')}>
                          Reprovar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </ClickableTableRow>
            ))}
          </tbody>
        </table>
      </div>

      <LogstokaTableFooter {...footerProps} />
      </section>

      <ReturnRegisterModal
        open={modalOpen}
        saving={registering}
        form={form}
        stores={stores}
        warehouses={warehouses}
        scan={{
          ...scanProps,
          onRegister: () => void createReturn(),
          onUseExisting: (product) => {
            setForm((f) => ({ ...f, sku: product.sku, quantity: scan.quantity }));
          },
        }}
        onClose={() => setModalOpen(false)}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onSubmit={() => void createReturn()}
      />
    </div>
  );
};

export default ReturnsPage;
