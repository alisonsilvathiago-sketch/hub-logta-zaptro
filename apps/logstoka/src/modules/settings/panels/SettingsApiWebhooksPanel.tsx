import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_INTEGRATION_LOGS, DEMO_WEBHOOKS } from '@/lib/logstokaDemoSeed';
import {
  listMarketplaceIntegrationUrls,
  LOGSTOKA_DOMAINS,
  MERCADOLIVRE_OAUTH_MODES,
  oauthCallbackUrl,
} from '@/lib/logstokaApiDomains';
import { SETTINGS_BASE } from '@/modules/settings/settingsNav';
import { Webhook } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ClickableTableRow from '@/components/ui/ClickableTableRow';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useTablePagination } from '@/hooks/useTablePagination';

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

type Tab = 'keys' | 'tokens' | 'webhooks-in' | 'webhooks-out' | 'events' | 'logs';

const DEMO_API_KEYS = [
  { id: '1', name: 'Produção WMS', prefix: 'ls_live_••••7f3a', created: '2025-11-02' },
  { id: '2', name: 'Homologação', prefix: 'ls_test_••••9b2c', created: '2026-01-15' },
];

const DEMO_TOKENS = [
  { id: '1', name: 'ERP Logta Sync', scope: 'inventory.read, orders.write', expires: '2026-12-31' },
  { id: '2', name: 'Mobile Scanner', scope: 'movements.write', expires: '2026-08-20' },
];

const SettingsApiWebhooksPanel: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const [tab, setTab] = useState<Tab>('keys');
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', events: 'stock.changed,order.paid' });
  const keysPagination = useTablePagination(DEMO_API_KEYS, 10, 'keys');
  const tokensPagination = useTablePagination(DEMO_TOKENS, 10, 'tokens');
  const logsPagination = useTablePagination(logs, 10, 'logs');

  const load = useCallback(async () => {
    if (!companyId) return;
    if (isLogstokaDemoCompany(companyId)) {
      setWebhooks(DEMO_WEBHOOKS);
      setLogs(DEMO_INTEGRATION_LOGS);
      return;
    }
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
    if (isLogstokaDemoCompany(companyId)) {
      toast.success('[Demo] Webhook cadastrado');
      setModalOpen(false);
      return;
    }
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

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'keys', label: 'Chaves API' },
    { id: 'tokens', label: 'Tokens' },
    { id: 'webhooks-in', label: 'Webhooks de Entrada' },
    { id: 'webhooks-out', label: 'Webhooks de Saída' },
    { id: 'events', label: 'Histórico de Eventos' },
    { id: 'logs', label: 'Logs de Integração' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-black text-gray-900">API e Webhooks</h2>
        <p className="mt-1 text-sm text-gray-500">Chaves, tokens, webhooks e logs de integração.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-2 text-xs font-bold sm:text-sm ${tab === t.id ? 'bg-orange-600 text-white' : 'bg-gray-50 ring-1 ring-slate-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'keys' && (
        <div className="space-y-4">
          <button type="button" className="ls-btn-primary" onClick={() => toast.success('[Demo] Nova chave API gerada')}>
            Gerar chave API
          </button>
          <div className="ls-table-wrap">
            <table className="ls-table">
              <thead><tr><th>Nome</th><th>Prefixo</th><th>Criada em</th></tr></thead>
              <tbody>
                {keysPagination.paginatedItems.map((k) => (
                  <tr key={k.id}><td>{k.name}</td><td><code className="text-xs">{k.prefix}</code></td><td>{k.created}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <LogstokaTableFooter {...keysPagination.footerProps} itemLabel="chaves" />
        </div>
      )}

      {tab === 'tokens' && (
        <div className="space-y-4">
          <button type="button" className="ls-btn-primary" onClick={() => toast.success('[Demo] Token criado')}>
            Novo token
          </button>
          <div className="ls-table-wrap">
            <table className="ls-table">
              <thead><tr><th>Nome</th><th>Escopos</th><th>Expira em</th></tr></thead>
              <tbody>
                {tokensPagination.paginatedItems.map((t) => (
                  <tr key={t.id}><td>{t.name}</td><td className="text-xs">{t.scope}</td><td>{t.expires}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <LogstokaTableFooter {...tokensPagination.footerProps} itemLabel="tokens" />
        </div>
      )}

      {tab === 'webhooks-in' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Endpoints públicos em <strong>{LOGSTOKA_DOMAINS.api}</strong> — configure no painel de cada marketplace.
          </p>
          <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 text-sm">
            <p className="font-bold text-[#404040]">Mercado Livre — OAuth</p>
            <p className="mt-1 text-xs text-[#525252]">
              Redirect URI:{' '}
              <code className="text-orange-800">{oauthCallbackUrl('mercadolivre')}</code>
            </p>
            <p className="mt-2 text-xs text-[#a3a3a3]">
              {MERCADOLIVRE_OAUTH_MODES.authorizationCode ? '✅' : '❌'} Authorization Code ·{' '}
              {MERCADOLIVRE_OAUTH_MODES.refreshToken ? '✅' : '❌'} Refresh Token ·{' '}
              {MERCADOLIVRE_OAUTH_MODES.clientCredentials ? '✅' : '❌'} Client Credentials
            </p>
          </div>
          <div className="space-y-2">
            {listMarketplaceIntegrationUrls().map(({ slug, oauthCallback, webhook }) => (
              <div key={slug} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs">
                <p className="font-black uppercase tracking-wide text-[#525252]">{slug}</p>
                <p className="mt-1 font-mono text-[#a3a3a3]">OAuth {oauthCallback}</p>
                <p className="mt-0.5 font-mono text-orange-700">POST {webhook}</p>
              </div>
            ))}
          </div>
          <code className="block rounded-xl bg-slate-950 p-4 text-xs text-orange-300">
            Legado: POST /webhooks/orders · /webhooks/marketplaces · Header: x-company-id
          </code>
        </div>
      )}

      {tab === 'webhooks-out' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button type="button" className="ls-btn-primary" onClick={() => setModalOpen(true)}>Novo webhook</button>
          </div>
          <div className="space-y-2">
            {webhooks.map((w) => (
              <div key={w.id} className="rounded-xl border border-slate-100 px-4 py-3">
                <p className="font-bold">{w.name}</p>
                <p className="text-xs text-slate-500">{w.url}</p>
                <p className="text-xs text-orange-600">{w.events.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'events' && (
        <div className="space-y-2">
          {logs.slice(0, 8).map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
              <span className="font-bold">{l.direction}</span>
              <span className="text-slate-500">{l.endpoint || '—'}</span>
              <span className={`ls-badge ${l.status === 'ok' ? 'bg-orange-50 text-orange-700' : 'bg-amber-50 text-amber-700'}`}>{l.status}</span>
              <span className="text-xs text-slate-400">{new Date(l.created_at).toLocaleString('pt-BR')}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <>
          <div className="ls-table-wrap">
            <table className="ls-table">
              <thead><tr><th>Direção</th><th>Endpoint</th><th>Status</th><th>Data</th></tr></thead>
              <tbody>
                {logsPagination.paginatedItems.map((l) => (
                  <ClickableTableRow key={l.id} to={`${SETTINGS_BASE}/api-webhooks/logs/${l.id}`}>
                    <td>{l.direction}</td>
                    <td>{l.endpoint || '—'}</td>
                    <td>{l.status}</td>
                    <td>{new Date(l.created_at).toLocaleString('pt-BR')}</td>
                  </ClickableTableRow>
                ))}
              </tbody>
            </table>
          </div>
          <LogstokaTableFooter {...logsPagination.footerProps} hidden={logs.length === 0} itemLabel="logs" />
        </>
      )}

      <Modal
        open={modalOpen}
        title="Novo webhook de saída"
        icon={<Webhook size={20} strokeWidth={2.25} />}
        onClose={() => setModalOpen(false)}
      >
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

export default SettingsApiWebhooksPanel;
