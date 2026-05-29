import React, { useCallback, useEffect, useState } from 'react';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useWarehouses } from '@/hooks/useCatalog';
import { logstokaApi } from '@/lib/logstokaApi';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_TRANSFERS, type DemoTransferRow } from '@/lib/logstokaDemoSeed';
import Modal from '@/components/ui/Modal';
import ClickableTableRow, { stopRowNavigate } from '@/components/ui/ClickableTableRow';
import BarcodeScanner from '@/components/ui/BarcodeScanner';

const statusMap: Record<string, string> = {
  pending: 'Pendente',
  in_transit: 'Em trânsito',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

const TransfersPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const { warehouses } = useWarehouses();
  const [transfers, setTransfers] = useState<DemoTransferRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ origin: '', destination: '', sku: '', quantity: 1, notes: '' });

  const load = useCallback(async () => {
    if (!companyId) return;
    if (isLogstokaDemoCompany(companyId)) {
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
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const createTransfer = async () => {
    if (!form.origin || !form.destination || !form.sku) {
      toast.error('Preencha origem, destino e SKU');
      return;
    }
    if (isLogstokaDemoCompany(companyId)) {
      toast.success('[Demo] Transferência criada');
      setModalOpen(false);
      return;
    }
    try {
      await logstokaApi.createTransfer({
        origin_warehouse_id: form.origin,
        destination_warehouse_id: form.destination,
        notes: form.notes,
        items: [{ sku: form.sku, quantity: form.quantity }],
      });
      toast.success('Transferência criada');
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={LOGSTOKA_PAGE_TITLE_CLASS}>Transferências</h2>
          <p className="text-sm text-slate-500">CD origem → em trânsito → CD destino</p>
        </div>
        <button type="button" className="ls-btn-primary" onClick={() => setModalOpen(true)}>
          Nova transferência
        </button>
      </div>

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
            {transfers.map((t) => (
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
                  {t.status === 'pending' && !isLogstokaDemoCompany(companyId) && (
                    <button type="button" className="ls-btn-secondary px-2 py-1 text-xs" onClick={() => void logstokaApi.shipTransfer(t.id).then(load)}>
                      Enviar
                    </button>
                  )}
                  {t.status === 'in_transit' && !isLogstokaDemoCompany(companyId) && (
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

      <Modal open={modalOpen} title="Transferência entre CDs" onClose={() => setModalOpen(false)}>
        <div className="space-y-3">
          <div>
            <label className="ls-label">Origem</label>
            <select className="ls-input" value={form.origin} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}>
              <option value="">—</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="ls-label">Destino</label>
            <select className="ls-input" value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}>
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
          <div>
            <label className="ls-label">Observação</label>
            <input className="ls-input" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <button type="button" className="ls-btn-primary w-full" onClick={() => void createTransfer()}>
            Criar transferência
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default TransfersPage;
