import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Link2, Plug } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import {
  connectMercadoLivreDemo,
  getIntegrationConnection,
  getIntegrationDashboardStats,
  loadIntegrationConnectionsMap,
  markSyncNowRemote,
  persistIntegrationConnection,
  disconnectIntegrationRemote,
  type IntegrationConnection,
} from '@/lib/integrationConnections';
import {
  INTEGRATION_TABS,
  providersByCategory,
  type IntegrationCategory,
  type IntegrationProvider,
  type IntegrationProviderId,
} from '@/lib/integrationsCatalog';
import {
  listMarketplaceIntegrationUrls,
  LOGSTOKA_DOMAINS,
  oauthCallbackUrl,
} from '@/lib/logstokaApiDomains';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { DEMO_INTEGRATION_LOGS, DEMO_WEBHOOKS } from '@/lib/logstokaDemoSeed';
import IntegrationConfigureModal from '@/modules/integrations/IntegrationConfigureModal';
import IntegrationProviderCard from '@/modules/integrations/IntegrationProviderCard';
import './integrationsCentral.css';

const API_BASE =
  import.meta.env.VITE_LOGSTOKA_API_URL?.replace(/\/$/, '') || '/logstoka-api';

const IntegrationsCentralPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<IntegrationCategory | 'api'>('marketplaces');
  const [connections, setConnections] = useState<Record<string, IntegrationConnection>>({});
  const [configureProvider, setConfigureProvider] = useState<IntegrationProvider | null>(null);
  const [connectingId, setConnectingId] = useState<IntegrationProviderId | null>(null);
  const [loading, setLoading] = useState(true);
  const [, bump] = useState(0);

  const reload = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const map = await loadIntegrationConnectionsMap(companyId);
      setConnections(map);
    } finally {
      setLoading(false);
      bump((n) => n + 1);
    }
  }, [companyId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!companyId) return;
    const oauth = searchParams.get('oauth');
    const status = searchParams.get('status');
    if (oauth === 'mercadolivre' && status === 'success') {
      const nickname = searchParams.get('nickname');
      toast.success(`Mercado Livre conectado${nickname ? ` · ${nickname}` : ''}`);
      setSearchParams({}, { replace: true });
      void reload();
    } else if (status === 'error') {
      toast.error(searchParams.get('message') || 'Falha na conexão OAuth');
      setSearchParams({}, { replace: true });
    }
  }, [companyId, searchParams, setSearchParams, reload]);

  const stats = useMemo(
    () => (Object.keys(connections).length ? getIntegrationDashboardStats(connections) : null),
    [connections],
  );

  const handleConnect = async (provider: IntegrationProvider) => {
    if (!companyId) return;

    if (provider.id === 'mercadolivre') {
      setConnectingId('mercadolivre');
      try {
        const statusRes = await fetch(`${API_BASE}/integrations/mercadolivre/status`);
        const status = (await statusRes.json()) as { configured?: boolean };
        if (status.configured) {
          window.location.href = `${API_BASE}/integrations/mercadolivre/connect?company_id=${encodeURIComponent(companyId)}`;
          return;
        }
        if (isLogstokaDemoCompany(companyId)) {
          connectMercadoLivreDemo(companyId);
          toast.success('Mercado Livre conectado (demo — configure MERCADOLIVRE_APP_ID no servidor para OAuth real)');
          reload();
          return;
        }
        toast.error('Configure MERCADOLIVRE_APP_ID e MERCADOLIVRE_APP_SECRET no servidor API');
      } catch {
        if (isLogstokaDemoCompany(companyId)) {
          connectMercadoLivreDemo(companyId);
          toast.success('Mercado Livre conectado (modo demo)');
          reload();
        } else {
          toast.error('API de integrações indisponível');
        }
      } finally {
        setConnectingId(null);
      }
      return;
    }

    if (provider.oauthSupported) {
      toast('OAuth em breve — use Mercado Livre como referência', { icon: '🔗' });
    } else {
      toast('Integração em desenvolvimento', { icon: '📦' });
    }
  };

  const handleSync = async (providerId: IntegrationProviderId) => {
    if (!companyId) return;
    try {
      await markSyncNowRemote(companyId, providerId);
      toast.success('Sincronização iniciada');
      await reload();
    } catch {
      toast.error('Falha ao sincronizar');
    }
  };

  const handleDisconnect = async (providerId: IntegrationProviderId) => {
    if (!companyId) return;
    try {
      await disconnectIntegrationRemote(companyId, providerId);
      toast.success('Integração desconectada');
      await reload();
    } catch {
      toast.error('Falha ao desconectar');
    }
  };

  const renderProviderGrid = (category: IntegrationCategory) => (
    <div className="ls-int-grid">
      {providersByCategory(category).map((provider) => (
        <IntegrationProviderCard
          key={provider.id}
          provider={provider}
          connection={connections[provider.id] ?? getIntegrationConnection(companyId!, provider.id)}
          connecting={connectingId === provider.id}
          onConnect={() => void handleConnect(provider)}
          onConfigure={() => setConfigureProvider(provider)}
          onSync={() => handleSync(provider.id)}
          onDisconnect={() => handleDisconnect(provider.id)}
        />
      ))}
    </div>
  );

  return (
    <div className="ls-int-central space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={LOGSTOKA_PAGE_TITLE_CLASS}>Central de Integrações</h2>
          <p className="text-sm text-[#a3a3a3]">
            Conecte marketplaces, ERPs, pagamentos e automações · sync bidirecional com {LOGSTOKA_DOMAINS.api}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-xs font-bold text-orange-800">
          <Plug size={16} />
          Hub de interações LogStoka
        </div>
      </div>

      {loading && (
        <p className="text-sm text-[#a3a3a3]">Carregando integrações…</p>
      )}

      {stats && (
        <LogstokaKpiStrip
          items={[
            { label: 'Integrações ativas', value: stats.activeCount },
            { label: 'Marketplaces', value: stats.marketplacesConnected },
            { label: 'Pedidos hoje', value: stats.ordersSyncedToday },
            { label: 'Erros', value: stats.integrationErrors },
            {
              label: 'Última sync',
              value: stats.lastSyncAt
                ? new Date(stats.lastSyncAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '—',
            },
          ]}
        />
      )}

      <nav className="ls-int-tabs" aria-label="Categorias de integração">
        {INTEGRATION_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`ls-int-tabs__item${tab === id ? ' ls-int-tabs__item--active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'marketplaces' && (
        <div className="space-y-4">
          <div className="ls-hub-panel border-orange-100 bg-orange-50/40">
            <p className="flex items-center gap-2 text-sm font-black text-[#404040]">
              <MarketplaceLogo marketplace="mercadolivre" size={22} />
              Mercado Livre · LogStoka Gestão de Estoque
            </p>
            <p className="mt-1 text-xs text-[#525252]">
              Redirect URI no painel ML:{' '}
              <code className="font-semibold text-orange-800">{oauthCallbackUrl('mercadolivre')}</code>
            </p>
            <p className="mt-1 text-[10px] font-bold text-[#a3a3a3]">
              ✅ Authorization Code · ✅ Refresh Token · ❌ Client Credentials
            </p>
          </div>
          {renderProviderGrid('marketplaces')}
        </div>
      )}

      {tab === 'erp' && renderProviderGrid('erp')}
      {tab === 'payments' && renderProviderGrid('payments')}
      {tab === 'communication' && renderProviderGrid('communication')}

      {tab === 'api' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="ls-int-api-block">
              <p className="text-xs font-black uppercase tracking-wide text-[#a3a3a3]">API Key</p>
              <code className="mt-2 block text-orange-800">ls_live_••••7f3a</code>
              <p className="mt-2 text-xs text-[#a3a3a3]">Gerencie em Configurações → API e Webhooks</p>
            </div>
            <div className="ls-int-api-block">
              <p className="text-xs font-black uppercase tracking-wide text-[#a3a3a3]">Client ID (ML)</p>
              <code className="mt-2 block text-[#525252]">Configurado no servidor · não exposto no frontend</code>
            </div>
          </div>

          <div className="ls-int-api-block">
            <p className="mb-3 text-sm font-black text-[#404040]">Webhooks recebidos (entrada)</p>
            <div className="space-y-2">
              {listMarketplaceIntegrationUrls().map(({ slug, webhook }) => (
                <p key={slug} className="font-mono text-xs text-orange-700">
                  POST {webhook}
                </p>
              ))}
            </div>
          </div>

          <div className="ls-int-api-block">
            <p className="mb-3 text-sm font-black text-[#404040]">Webhooks enviados (saída)</p>
            {DEMO_WEBHOOKS.map((w) => (
              <div key={w.id} className="mb-2 text-xs">
                <span className="font-bold text-[#404040]">{w.name}</span>
                <p className="font-mono text-[#a3a3a3]">{w.url}</p>
              </div>
            ))}
          </div>

          <div className="ls-table-wrap">
            <table className="ls-table">
              <thead>
                <tr>
                  <th>Direção</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_INTEGRATION_LOGS.slice(0, 8).map((l) => (
                  <tr key={l.id}>
                    <td>{l.direction}</td>
                    <td>{l.endpoint}</td>
                    <td>{l.status}</td>
                    <td>{new Date(l.created_at).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Link to={LOGSTOKA_ROUTES.SETTINGS_API} className="text-sm font-bold text-orange-700 hover:underline">
            Abrir painel completo de API e Webhooks →
          </Link>
        </div>
      )}

      <IntegrationConfigureModal
        open={Boolean(configureProvider)}
        provider={configureProvider}
        connection={
          configureProvider && companyId
            ? connections[configureProvider.id] ?? getIntegrationConnection(companyId, configureProvider.id)
            : null
        }
        onClose={() => setConfigureProvider(null)}
        onSave={(conn) => {
          if (!companyId) return;
          void persistIntegrationConnection(companyId, conn)
            .then(() => {
              toast.success('Configuração salva');
              setConfigureProvider(null);
              return reload();
            })
            .catch(() => toast.error('Falha ao salvar configuração'));
        }}
      />
    </div>
  );
};

export default IntegrationsCentralPage;
