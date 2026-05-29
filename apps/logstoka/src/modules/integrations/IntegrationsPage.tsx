import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { MARKETPLACE_LABELS } from '@/types';
import Modal from '@/components/ui/Modal';

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
}

interface IntegrationLog {
  id: string;
  direction: string;
  endpoint?: string | null;
  status: string;
  created_at: string;
}

const IntegrationsPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', events: 'stock.changed,order.paid' });

  const load = useCallback(async () => {
    if (!companyId) return;
    const [wh, lg] = await Promise.all([
      supabase.from('ls_webhook_endpoints').select('*').eq('company_id', companyId),
      supabase.from('ls_integration_logs').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(30),
    ]);
    setWebhooks((wh.data ?? []) as WebhookEndpoint[]);
    setLogs((lg.data ?? []) as IntegrationLog[]);
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveWebhook = async () => {
    if (!companyId || !form.name || !form.url) return;
    const { error } = await supabase.from('ls_webhook_endpoints').insert({
      company_id: companyId,
      name: form.name,
      url: form.url,
      events: form.events.split(',').map((e) => e.trim()),
      is_active: true,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Webhook cadastrado');
      setModalOpen(false);
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">Central de Integrações</h2>
        <p className="text-sm text-slate-500">Marketplaces, webhooks e logs de integração</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(MARKETPLACE_LABELS).map(([key, label]) => (
          <div key={key} className="ls-card">
            <p className="font-black">{label}</p>
            <p className="mt-1 text-xs text-slate-500">Auth · Sync · Orders · Inventory · Webhooks</p>
            <span className="ls-badge mt-3 bg-amber-50 text-amber-700">Manual + Webhook</span>
          </div>
        ))}
      </div>

      <div className="ls-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black">Webhooks de saída</h3>
          <button type="button" className="ls-btn-primary" onClick={() => setModalOpen(true)}>Novo webhook</button>
        </div>
        <div className="space-y-2">
          {webhooks.map((w) => (
            <div key={w.id} className="rounded-xl border border-slate-100 px-4 py-3">
              <p className="font-bold">{w.name}</p>
              <p className="text-xs text-slate-500">{w.url}</p>
              <p className="text-xs text-emerald-600">{w.events.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="ls-card">
        <h3 className="mb-4 font-black">Logs de integração</h3>
        <div className="ls-table-wrap border-0">
          <table className="ls-table">
            <thead><tr><th>Direção</th><th>Endpoint</th><th>Status</th><th>Data</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.direction}</td>
                  <td>{l.endpoint || '—'}</td>
                  <td>{l.status}</td>
                  <td>{new Date(l.created_at).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ls-card">
        <h3 className="mb-2 font-black">Webhooks de entrada</h3>
        <code className="block rounded-xl bg-slate-950 p-4 text-xs text-emerald-300">
          POST /webhooks/orders · /webhooks/marketplaces · Header: x-company-id
        </code>
      </div>

      <Modal open={modalOpen} title="Novo webhook" onClose={() => setModalOpen(false)}>
        <div className="space-y-3">
          <input className="ls-input" placeholder="Nome" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="ls-input" placeholder="URL" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
          <input className="ls-input" placeholder="Eventos (vírgula)" value={form.events} onChange={(e) => setForm((f) => ({ ...f, events: e.target.value }))} />
          <button type="button" className="ls-btn-primary w-full" onClick={() => void saveWebhook()}>Salvar</button>
        </div>
      </Modal>
    </div>
  );
};

export default IntegrationsPage;
