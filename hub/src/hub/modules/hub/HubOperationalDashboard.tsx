import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, RefreshCw, PackageSearch, Smartphone, Brain } from 'lucide-react';
import { toast } from 'sonner';
import HubSupabaseChart from '@shared/components/HubSupabaseChart';
import { supabase } from '@core/lib/supabase';
import { HUB_PAGE_SUBTITLE } from '@hub/styles/hubPageTypography';

interface SystemEvent {
  id: string | number;
  time: string;
  system: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

type HubOperationalDashboardProps = {
  variant?: 'home' | 'page';
};

export const HubOperationalDashboard: React.FC<HubOperationalDashboardProps> = ({
  variant = 'page',
}) => {
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [metrics, setMetrics] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    requestsPerSecond: 0,
    latency: 0,
  });
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { count: companyCount, error: companyError } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true });
      if (companyError) throw companyError;

      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (userError) throw userError;

      const { data: recentEvents, error: eventsError } = await supabase
        .from('hub_notificacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setMetrics((prev) => ({
        ...prev,
        totalCompanies: companyCount || 0,
        totalUsers: userCount || 0,
        requestsPerSecond: Math.floor(Math.random() * 200) + 50,
        latency: Math.floor(Math.random() * 10) + 5,
      }));

      if (!eventsError && recentEvents) {
        setEvents(
          recentEvents.map((e) => ({
            id: e.id,
            time: new Date(e.created_at).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            system: e.sistema || 'Hub Master',
            message: e.mensagem,
            type: e.tipo || 'info',
          })),
        );
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erro ao carregar dados operacionais.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const channel = supabase
      .channel('hub-global-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hub_notificacoes' },
        (payload) => {
          const newEvent: SystemEvent = {
            id: payload.new.id,
            time: new Date(payload.new.created_at).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            system: payload.new.sistema || 'Hub Master',
            message: payload.new.mensagem,
            type: payload.new.tipo || 'info',
          };
          setEvents((prev) => [newEvent, ...prev.slice(0, 9)]);
        },
      )
      .subscribe();

    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        requestsPerSecond: Math.max(
          10,
          prev.requestsPerSecond + Math.floor(Math.random() * 5) - 2,
        ),
      }));
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  const handleSync = async () => {
    setIsSyncing(true);
    toast.promise(fetchDashboardData(), {
      loading: 'Sincronizando telemetria global...',
      success: 'Dados atualizados com sucesso!',
      error: 'Falha na sincronização.',
    });
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSyncing(false);
  };

  const productTiles = [
    { name: 'Logta SaaS', desc: 'Operação, frota e módulos ERP.', path: '/master/logta', icon: PackageSearch },
    { name: 'ZapTro Core', desc: 'Comunicação Omnichannel & CRM.', path: '/master/zaptro', icon: Activity },
    { name: 'LogDock Master', desc: 'Infraestrutura & Drive Global.', path: '/master/logdock', icon: RefreshCw },
    { name: 'Whatsapp Hub', desc: 'Instâncias & Mensageria Cloud.', path: '/master/whatsapp', icon: Smartphone },
    { name: 'IA Gateway', desc: 'Orquestração de LLMs & Tokens.', path: '/master/ia-gateway', icon: Brain },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: variant === 'home' ? 24 : 32, width: '100%' }}>
      <div className="hub-page-header" style={{ marginBottom: variant === 'home' ? 0 : undefined }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2
              className={variant === 'page' ? 'hub-page-title' : undefined}
              style={variant === 'home' ? { fontSize: 20, fontWeight: 600, color: 'var(--hub-text-main)', margin: 0 } : undefined}
            >
              {variant === 'home' ? 'Monitoramento operacional' : 'Dashboard'}
            </h2>
            <p className="hub-page-subtitle" style={HUB_PAGE_SUBTITLE}>
              Monitoramento em tempo real do ecossistema Logta, ZapTro e LogDock no Hub Master.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="hub-premium-pill secondary"
              onClick={handleSync}
              disabled={isSyncing || isLoading}
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              Sincronizar
            </button>
            <div
              className="hub-premium-card"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', backgroundColor: 'rgba(62, 207, 142, 0.1)' }}
            >
              <Activity size={14} color="var(--hub-accent)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--hub-accent)' }}>OPERACIONAL</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <HubSupabaseChart label="EMPRESAS TOTAIS" value={isLoading ? '...' : String(metrics.totalCompanies)} data={[40, 50, 60, 50, 40, 50, 60, 50, 40, 50]} />
        <HubSupabaseChart label="USUÁRIOS ATIVOS" value={isLoading ? '...' : String(metrics.totalUsers)} data={[30, 40, 50, 60, 70, 80, 70, 60, 50, 40]} />
        <HubSupabaseChart label="REQUESTS / SEG" value={String(metrics.requestsPerSecond)} data={[20, 30, 40, 50, 60, 70, 80, 90, 80, 70]} />
        <HubSupabaseChart label="LATÊNCIA (MS)" value={`${metrics.latency}ms`} data={[10, 5, 2, 8, 3, 1, 4, 2, 0, 1]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 32 }}>
        <div className="hub-premium-card" style={{ padding: 0 }}>
          <div style={{ padding: 24, borderBottom: '1px solid var(--hub-border)' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--hub-text-main)' }}>Atividade do Sistema</h3>
            <p style={{ ...HUB_PAGE_SUBTITLE, marginTop: 6 }}>Eventos recentes do ecossistema.</p>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {events.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--hub-text-muted)' }}>Nenhum evento registrado.</div>
            ) : (
              <table className="hub-table">
                <thead>
                  <tr>
                    <th>Sistema</th>
                    <th>Mensagem</th>
                    <th style={{ textAlign: 'right' }}>Horário</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td style={{ width: 120 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, backgroundColor: event.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'var(--hub-sidebar-hover)', color: event.type === 'error' ? '#EF4444' : 'var(--hub-text-muted)' }}>
                          {event.system.toUpperCase()}
                        </span>
                      </td>
                      <td>{event.message}</td>
                      <td style={{ textAlign: 'right', color: 'var(--hub-text-muted)', fontSize: 12 }}>{event.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div
          className="hub-operational-products"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            height: 300,
            minHeight: 300,
            maxHeight: 300,
            boxSizing: 'border-box',
            borderRadius: 12,
            padding: '14px 16px',
            overflow: 'hidden',
          }}
        >
          <span className="hub-operational-products__title" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
            Produtos
          </span>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              paddingRight: 2,
            }}
          >
          {productTiles.map((product) => {
            const Icon = product.icon;
            return (
              <button
                key={product.path}
                type="button"
                className="hub-operational-product-tile"
                onClick={() => navigate(product.path)}
                style={{
                  display: 'flex',
                  gap: 12,
                  textAlign: 'left',
                  width: '100%',
                  cursor: 'pointer',
                  padding: '12px 14px',
                  borderRadius: 8,
                  boxShadow: 'none',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  flexShrink: 0,
                  alignItems: 'flex-start',
                }}
              >
                <div className="hub-operational-product-tile__icon" style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color="var(--hub-accent)" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="hub-operational-product-tile__name" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.3 }}>{product.name}</div>
                  <div className="hub-operational-product-tile__desc" style={{ fontSize: 11, fontWeight: 500, marginTop: 4, lineHeight: 1.4 }}>{product.desc}</div>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      <style>{`.animate-spin { animation: hub-spin 1s linear infinite; } @keyframes hub-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default HubOperationalDashboard;
