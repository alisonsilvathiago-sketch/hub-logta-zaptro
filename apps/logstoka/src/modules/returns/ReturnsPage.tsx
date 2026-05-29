import React, { useCallback, useEffect, useState } from 'react';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useWarehouses, useStores } from '@/hooks/useCatalog';
import { logstokaApi } from '@/lib/logstokaApi';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_RETURNS, type DemoReturnRow } from '@/lib/logstokaDemoSeed';
import Modal from '@/components/ui/Modal';
import ClickableTableRow, { stopRowNavigate } from '@/components/ui/ClickableTableRow';
import BarcodeScanner from '@/components/ui/BarcodeScanner';

const statusLabels: Record<string, string> = {
  received: 'Recebido',
  triage: 'Triagem',
  approved: 'Aprovado',
  rejected: 'Reprovado',
  completed: 'Concluído',
};

const ReturnsPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const { warehouses } = useWarehouses();
  const { stores } = useStores();
  const [returns, setReturns] = useState<DemoReturnRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ order_reference: '', reason: '', sku: '', quantity: 1, store_id: '', warehouse_id: '' });

  const load = useCallback(async () => {
    if (!companyId) return;
    if (isLogstokaDemoCompany(companyId)) {
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
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const createReturn = async () => {
    if (!form.sku) {
      toast.error('Informe o SKU');
      return;
    }
    if (isLogstokaDemoCompany(companyId)) {
      toast.success('[Demo] Devolução registrada');
      setModalOpen(false);
      return;
    }
    try {
      await logstokaApi.createReturn({
        order_reference: form.order_reference,
        reason: form.reason,
        store_id: form.store_id || undefined,
        warehouse_id: form.warehouse_id || undefined,
        items: [{ sku: form.sku, quantity: form.quantity }],
      });
      toast.success('Devolução registrada');
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const action = async (id: string, type: 'triage' | 'approve' | 'reject') => {
    if (isLogstokaDemoCompany(companyId)) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={LOGSTOKA_PAGE_TITLE_CLASS}>Devoluções</h2>
          <p className="text-sm text-slate-500">Recebido → Triagem → Aprovado/Reprovado</p>
        </div>
        <button type="button" className="ls-btn-primary" onClick={() => setModalOpen(true)}>
          Nova devolução
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {Object.entries(counts).map(([k, v]) => (
          <div key={k} className="ls-card text-center">
            <p className="text-xs font-bold uppercase text-slate-500">{statusLabels[k]}</p>
            <p className="mt-2 text-3xl font-black">{v}</p>
          </div>
        ))}
      </div>

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
            {returns.map((r) => (
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

      <Modal open={modalOpen} title="Registrar devolução" onClose={() => setModalOpen(false)}>
        <div className="space-y-3">
          <div>
            <label className="ls-label">Referência pedido</label>
            <input className="ls-input" value={form.order_reference} onChange={(e) => setForm((f) => ({ ...f, order_reference: e.target.value }))} />
          </div>
          <div>
            <label className="ls-label">Motivo</label>
            <input className="ls-input" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          </div>
          <div>
            <label className="ls-label">Loja</label>
            <select className="ls-input" value={form.store_id} onChange={(e) => setForm((f) => ({ ...f, store_id: e.target.value }))}>
              <option value="">—</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="ls-label">Depósito</label>
            <select className="ls-input" value={form.warehouse_id} onChange={(e) => setForm((f) => ({ ...f, warehouse_id: e.target.value }))}>
              <option value="">—</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <BarcodeScanner onScan={(sku) => setForm((f) => ({ ...f, sku }))} />
          <div>
            <label className="ls-label">Quantidade</label>
            <input className="ls-input" type="number" min={1} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))} />
          </div>
          <button type="button" className="ls-btn-primary w-full" onClick={() => void createReturn()}>
            Registrar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ReturnsPage;
