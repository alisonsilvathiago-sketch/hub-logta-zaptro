import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  TrendingUp,
  Truck,
  Users,
  Settings,
  ChevronRight,
  ExternalLink,
  CreditCard,
  UserCheck,
  Activity,
  QrCode,
  Smartphone,
  Coins,
  Ban,
  RefreshCcw,
  Search,
  Bot,
  Terminal,
  ShieldAlert,
  Building2,
  Phone,
  Mail,
  MapPin,
  Zap,
  PackageSearch,
  FileText,
} from 'lucide-react';
import HubMetricCard from '@shared/components/HubMetricCard';
import HubEntityAvatar from '@shared/components/HubEntityAvatar';
import { HUB_MASTER_PRODUCT_SHELL } from '@hub/styles/hubMasterProductShell';
import {
  ZAPTRO_MASTER_ROUTES,
  openZaptroApp,
  zaptroMasterClientProfilePath,
} from '@hub/lib/zaptroMasterDeepLinks';
import { supabase } from '@core/lib/supabase';

const toastSuccess = (msg: string) => {
  console.log('Toast:', msg);
};

type CompanyRow = { id?: string; name?: string | null; plan?: string | null; logo_url?: string | null };

const ACCENT = '#7C3AED';

const SHELL = {
  ...HUB_MASTER_PRODUCT_SHELL,
  card: {
    background: '#FFFFFF',
    borderRadius: '24px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden' as const,
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '100px',
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#0F172A',
    fontSize: '13px',
    fontWeight: '900',
    cursor: 'pointer',
    transition: '0.2s',
    userSelect: 'none' as const,
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.02em',
  }
};

/** Grade de KPIs do perfil: 4 colunas no desktop */
const PROFILE_KPIS_GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 20,
  marginBottom: 32,
};

const CLIENT_PROFILE_METRICS = ['whatsapp', 'leads', 'motoristas', 'faturamento'] as const;
type ClientProfileMetric = (typeof CLIENT_PROFILE_METRICS)[number];

function isClientProfileMetric(value: string | undefined): value is ClientProfileMetric {
  return Boolean(value && (CLIENT_PROFILE_METRICS as readonly string[]).includes(value));
}

const CLIENT_METRIC_PAGES: Record<
  ClientProfileMetric,
  {
    headline: string;
    intro: string;
    zaptroPath: string;
    openLabel: string;
    mockRows: Array<{ k: string; v: string; s: string }>;
  }
> = {
  whatsapp: {
    headline: 'Sessões WhatsApp (7d)',
    intro: 'Threads, créditos e automações deste tenant — snapshot no Master; operação no Zaptro.',
    zaptroPath: ZAPTRO_MASTER_ROUTES.CHAT,
    openLabel: 'Abrir inbox no Zaptro',
    mockRows: [
      { k: 'Sessões ativas', v: '892', s: 'OK' },
      { k: 'SLA 1ª resposta', v: '< 45 s', s: 'OK' },
      { k: 'Templates / 24h', v: '124', s: 'Live' },
    ],
  },
  leads: {
    headline: 'Leads & CRM',
    intro: 'Pipeline comercial e follow-ups — use o Zaptro para mover deals; aqui é visão consolidada.',
    zaptroPath: ZAPTRO_MASTER_ROUTES.COMMERCIAL_CRM,
    openLabel: 'Abrir CRM no Zaptro',
    mockRows: [
      { k: 'Leads aquecidos', v: '146', s: 'Top' },
      { k: 'Deals abertos', v: '23', s: 'CRM' },
      { k: 'Follow-ups hoje', v: '11', s: 'Pend.' },
    ],
  },
  motoristas: {
    headline: 'Motoristas ativos',
    intro: 'Documentação, turnos e presença em rota — detalhe operacional no app.',
    zaptroPath: ZAPTRO_MASTER_ROUTES.DRIVERS,
    openLabel: 'Abrir motoristas no Zaptro',
    mockRows: [
      { k: 'Ativos', v: '38', s: 'OK' },
      { k: 'Em rota agora', v: '12', s: 'Live' },
      { k: 'Docs vencendo', v: '3', s: 'Alerta' },
    ],
  },
  faturamento: {
    headline: 'Faturamento (mês)',
    intro: 'Boletos, PIX e créditos do tenant — espelho da área de cobrança no produto.',
    zaptroPath: ZAPTRO_MASTER_ROUTES.BILLING,
    openLabel: 'Abrir faturamento no Zaptro',
    mockRows: [
      { k: 'Faturado (mês)', v: 'R$ 58k', s: 'OK' },
      { k: 'Em aberto', v: 'R$ 4,2k', s: 'Pend.' },
      { k: 'Último pagamento', v: '10/05', s: 'PIX' },
    ],
  },
};

const LINK_TILES: Array<{ title: string; subtitle: string; path: string; icon: typeof MessageSquare }> = [
  { title: 'WhatsApp — Inbox', subtitle: 'Threads e automações conversacionais', path: ZAPTRO_MASTER_ROUTES.CHAT, icon: MessageSquare },
  { title: 'CRM Kanban', subtitle: 'Pipeline comercial (/comercial)', path: ZAPTRO_MASTER_ROUTES.COMMERCIAL_CRM, icon: TrendingUp },
  { title: 'Carteira de clientes', subtitle: 'Lista unificada de contatos', path: ZAPTRO_MASTER_ROUTES.CLIENTS, icon: Users },
  { title: 'Operações de campo', subtitle: 'Cargas e status operacional', path: ZAPTRO_MASTER_ROUTES.LOGISTICS, icon: Truck },
  { title: 'Configurações do tenant', subtitle: 'Preferências da transportadora', path: `${ZAPTRO_MASTER_ROUTES.SETTINGS_ALIAS}?tab=config`, icon: Settings },
];

interface ZaptroClientProfileProps {
  isEmbedded?: boolean;
}

const ZaptroClientProfile: React.FC<ZaptroClientProfileProps> = ({ isEmbedded }) => {
  const { id, metric } = useParams<{ id: string; metric?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const focus = searchParams.get('focus');

  const setActiveTab = (tab: string) => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      return prev;
    });
  };
  const [remote, setRemote] = useState<CompanyRow | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const [{ data: company }, { data: empresa }] = await Promise.all([
        supabase.from('companies').select('id,name,plan,logo_url').eq('id', id).maybeSingle(),
        supabase.from('empresas').select('id,nome_fantasia,plano_atual,logo_url').eq('id', id).maybeSingle(),
      ]);
      if (cancelled) return;
      setRemote({
        id,
        name: company?.name || empresa?.nome_fantasia || null,
        plan: company?.plan || empresa?.plano_atual || null,
        logo_url: company?.logo_url || empresa?.logo_url || null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const name =
    remote?.name?.trim() ||
    ({
      '1': 'Transportadora Falcão',
      'demo-11': 'Expresso Federal',
      'demo-12': 'Rápido Trans',
    }[id || ''] as string | undefined) ||
    `Cliente Zaptro (${id})`;
  const plan = remote?.plan || 'Zaptro Pro';
  const products = [
    { id: 'zaptro', name: 'ZapTro', active: true, color: '#7C3AED', icon: Zap },
    { id: 'logta', name: 'Logta', active: (id === '1' || id?.includes('demo')), color: '#0061FF', icon: Truck },
    { id: 'logdock', name: 'LogDock', active: (id === '1'), color: '#16A34A', icon: PackageSearch }
  ].filter(p => p.active);

  const focusPath =
    focus === 'crm'
      ? ZAPTRO_MASTER_ROUTES.COMMERCIAL_CRM
      : focus === 'whatsapp'
        ? ZAPTRO_MASTER_ROUTES.CHAT
        : focus === 'vendas'
          ? ZAPTRO_MASTER_ROUTES.SALES
          : focus === 'rotas'
            ? ZAPTRO_MASTER_ROUTES.ROUTES
            : focus === 'operacoes'
              ? ZAPTRO_MASTER_ROUTES.LOGISTICS
              : focus === 'motoristas'
                ? ZAPTRO_MASTER_ROUTES.DRIVERS
                : focus === 'frota'
                  ? ZAPTRO_MASTER_ROUTES.FLEET
                  : focus === 'mapa'
                    ? ZAPTRO_MASTER_ROUTES.OPENSTREETMAP
                    : focus === 'faturamento'
                      ? ZAPTRO_MASTER_ROUTES.BILLING
                      : zaptroMasterClientProfilePath(id || '');

  const focusTitle =
    focus === 'crm'
      ? 'CRM / pipeline — tudo da empresa neste contexto'
      : focus === 'whatsapp'
        ? 'WhatsApp & créditos / QR / número'
        : focus === 'vendas'
          ? 'Vendas & orçamentos'
          : focus === 'rotas'
            ? 'Rotas CRM + execução'
            : focus === 'operacoes'
              ? 'Operações de campo'
              : focus === 'motoristas'
                ? 'Motoristas deste tenant'
                : focus === 'frota'
                  ? 'Frota & telemetria'
                  : focus === 'mapa'
                    ? 'Mapa ao vivo'
                    : focus === 'faturamento'
                      ? 'Faturamento & créditos'
                      : null;

  const goProfileMetric = (m: ClientProfileMetric) => {
    if (!id) return;
    navigate(`/master/zaptro/${id}/m/${m}`);
  };

  const KpiToMetric = ({ m, children }: { m: ClientProfileMetric; children: React.ReactNode }) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => goProfileMetric(m)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goProfileMetric(m);
        }
      }}
      style={{ cursor: 'pointer', minWidth: 0 }}
      aria-label={`Abrir vista ${m} no perfil Master`}
    >
      {children}
    </div>
  );

  if (metric && !isClientProfileMetric(metric)) {
    const errorBody = (
      <div style={{ ...SHELL.content }}>
        <button
          type="button"
          onClick={() => {
            const tab = searchParams.get('tab');
            navigate(`/master/zaptro${tab ? `?tab=${tab}` : ''}`);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            background: '#FFF',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: '#334155',
          }}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Métrica não encontrada</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#64748B' }}>
          Rota inválida: <code>/m/{metric}</code>. Utilize whatsapp, leads, motoristas ou faturamento.
        </p>
      </div>
    );

    if (isEmbedded) return errorBody;

    return (
      <div style={{ ...SHELL.container, minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ ...SHELL.contentArea, overflowY: 'auto' }}>
          {errorBody}
        </div>
      </div>
    );
  }

  if (metric && id && isClientProfileMetric(metric)) {
    const page = CLIENT_METRIC_PAGES[metric];
    const metricBody = (
      <div style={{ ...SHELL.content, gap: 24 }}>
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: '#64748B' }}>
          <button type="button" onClick={() => navigate('/master/zaptro')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Zaptro</button>
          <ChevronRight size={14} />
          <button type="button" onClick={() => navigate('/master/zaptro')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Empresas</button>
          <ChevronRight size={14} />
          <button type="button" onClick={() => navigate(`/master/zaptro/${id}`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748B' }}>{name}</button>
          <ChevronRight size={14} />
          <span style={{ fontWeight: 700, color: '#0F172A' }}>{page.headline}</span>
        </div>

        {/* Atalho Master Banner (High Fidelity) */}
        <div style={{ padding: 24, borderRadius: 16, border: '1px solid #E9D5FF', background: 'linear-gradient(135deg, #FAF5FF 0%, #FFFFFF 100%)', marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ATALHO MASTER · WHATSAPP
          </div>
          <p style={{ margin: '8px 0 12px', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>WhatsApp & créditos / QR / número</p>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748B', lineHeight: 1.5, maxWidth: 800 }}>
            Abre a área correspondente no app Zaptro para esta empresa; o Master continua sendo visão espelho e auditoria.
          </p>
          <button
            type="button"
            onClick={() => openZaptroApp(page.zaptroPath)}
            style={{ 
              padding: '12px 28px', 
              borderRadius: 100, 
              background: '#25D366', 
              color: '#FFF', 
              fontWeight: 900, 
              fontSize: 14, 
              cursor: 'pointer', 
              border: 'none',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            <ExternalLink size={18} />
            ABRIR NO ZAPTRO
          </button>
        </div>

        {/* Client Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <HubEntityAvatar kind="company" src={remote?.logo_url} name={name} size={48} accent={ACCENT} />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>{name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
              {products.map((p: any) => (
                <div 
                  key={p.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    padding: '4px 10px', 
                    borderRadius: '8px', 
                    background: `${p.color}15`, 
                    color: p.color,
                    fontSize: '11px',
                    fontWeight: 800,
                    border: `1px solid ${p.color}30`
                  }}
                >
                  <p.icon size={12} /> {p.name}
                </div>
              ))}
              <span style={{ fontSize: '13px', color: '#64748B', marginLeft: '4px' }}>· Plano <strong>{plan}</strong></span>
            </div>
          </div>
          <button type="button" onClick={() => openZaptroApp(zaptroMasterClientProfilePath(id || ''))} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            <ExternalLink size={16} /> Perfil operacional completo
          </button>
        </div>

        {/* Dash Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Manutenção */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ ...SHELL.card, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <QrCode size={20} color={ACCENT} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Sessão & Manutenção</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>NÚMERO / CANAL</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input defaultValue="+55 11 91000-2000" style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 14, fontWeight: 700 }} />
                    <button type="button" style={{ ...SHELL.actionBtn, background: '#0F172A', color: '#FFF', border: 'none' }} onClick={() => toastSuccess('Sincronizado.')}>Sincronizar</button>
                  </div>
                </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: '100%', maxWidth: 300, padding: 24, background: '#FFF', borderRadius: 24, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                      <QrCode size={180} color="#0F172A" />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                      <button type="button" style={{ ...SHELL.actionBtn, background: ACCENT, color: '#FFF', border: 'none', padding: '12px 32px' }} onClick={() => toastSuccess('QR Gerado.')}>GERAR QR</button>
                      <button type="button" style={{ ...SHELL.actionBtn, padding: '12px 32px', background: '#FFF', color: '#0F172A', border: '1px solid #E2E8F0' }} onClick={() => toastSuccess('Reiniciando...')}>REINICIAR</button>
                    </div>
                  </div>
              </div>
            </div>

            <div style={{ ...SHELL.card, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Coins size={20} color="#F59E0B" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Consumo de Créditos</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div style={{ padding: 16, borderRadius: 12, border: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B' }}>SALDO EM CARTEIRA</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>R$ 1.240</div>
                </div>
                <div style={{ padding: 16, borderRadius: 12, border: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B' }}>MSGS / MÊS</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>12.4k</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" placeholder="Adicionar R$" style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #E2E8F0' }} />
                <button type="button" style={{ ...SHELL.actionBtn, background: '#0F172A', color: '#FFF', border: 'none' }} onClick={() => toastSuccess('Créditos alocados.')}>Adicionar</button>
              </div>
            </div>
          </div>

          {/* Atividade & Logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ ...SHELL.card, padding: 24, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Activity size={20} color="#10B981" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Audit Log da Instância</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { ev: 'Mensagem Enviada', time: 'Agora', status: 'delivered', color: '#10B981' },
                  { ev: 'Sessão Conectada', time: 'Há 12m', status: 'connected', color: '#3B82F6' },
                  { ev: 'Webhook Error', time: 'Hoje 09:12', status: 'retry-4', color: '#EF4444' },
                  { ev: 'QR Code Scan', time: 'Ontem', status: 'success', color: '#10B981' },
                ].map((l, i) => (
                  <div key={i} style={{ padding: 12, borderRadius: 12, border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{l.ev}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{l.time}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: l.color, background: `${l.color}15`, padding: '4px 8px', borderRadius: 6 }}>{l.status.toUpperCase()}</span>
                  </div>
                ))}
              </div>
              <button type="button" style={{ ...SHELL.actionBtn, width: '100%', marginTop: 20, justifyContent: 'center', background: '#F8FAFC' }}>Ver todos os logs técnicos</button>
            </div>
            
            <div style={{ padding: 24, borderRadius: 20, background: '#0F172A', color: '#FFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Bot size={24} color={ACCENT} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Monitoramento de IA</h3>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>Agente autônomo ativo para este tenant. Roteamento dinâmico via <strong>IA Gateway Master</strong>.</p>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: ACCENT }}>GPT-4O-MINI</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981' }}>ATIVO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    if (isEmbedded) return metricBody;

    return (
      <div style={{ ...SHELL.container, minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ ...SHELL.contentArea, overflowY: 'auto' }}>
          {metricBody}
        </div>
      </div>
    );
  }

  const profileBody = (
    <div style={{ ...SHELL.content }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: '#64748B' }}>
        <button
          type="button"
          onClick={() => {
            navigate({
              pathname: '/master/zaptro',
              search: searchParams.toString()
            });
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          Zaptro
        </button>
        <ChevronRight size={14} />
        <button
          type="button"
          onClick={() => {
            navigate({
              pathname: '/master/zaptro',
              search: searchParams.toString()
            });
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: '#64748B',
          }}
        >
          Empresas
        </button>
        <ChevronRight size={14} />
        <span style={{ fontWeight: 700, color: '#0F172A' }}>{name}</span>
      </div>

      {focus && focusTitle ? (
        <div
          style={{
            margin: '40px 0',
            padding: 16,
            borderRadius: 12,
            border: `2px solid ${ACCENT}`,
            background: 'linear-gradient(135deg, #FAF5FF 0%, #FFFFFF 100%)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Atalho Master · {focus}
          </div>
          <p style={{ margin: '8px 0 12px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{focusTitle}</p>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
            Abre a área correspondente no app Zaptro para esta empresa; o Master continua sendo visão espelho e auditoria.
          </p>
          <button
            type="button"
            onClick={() => openZaptroApp(focusPath)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: '100px',
              border: 'none',
              background: '#25D366',
              color: '#FFF',
              fontWeight: 900,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}
          >
            <ExternalLink size={16} />
            ABRIR NO ZAPTRO
          </button>
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        <HubEntityAvatar kind="company" src={remote?.logo_url} name={name} size={36} accent={ACCENT} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{name}</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748B' }}>
            Painel mestre espelho — ações executam no produto{' '}
            <strong style={{ color: ACCENT }}>Zaptro</strong>
            {' · '}Plano{' '}
            <span style={{ fontWeight: 700, color: '#0F172A' }}>{plan}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => openZaptroApp(zaptroMasterClientProfilePath(id || ''))}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 24px',
            borderRadius: 100,
            border: 'none',
            background: ACCENT,
            color: '#FFF',
            fontWeight: 900,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${ACCENT}35`,
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}
        >
          <ExternalLink size={16} />
          Perfil operacional completo
        </button>
      </div>

      <div style={PROFILE_KPIS_GRID}>
        <KpiToMetric m="whatsapp">
          <HubMetricCard label="Sessões WhatsApp (7d)" value="892" icon={Activity} accent={ACCENT} />
        </KpiToMetric>
        <KpiToMetric m="leads">
          <HubMetricCard label="Leads aquecidos" value="146" icon={TrendingUp} accent={ACCENT} />
        </KpiToMetric>
        <KpiToMetric m="motoristas">
          <HubMetricCard label="Motoristas ativos" value="38" icon={UserCheck} accent={ACCENT} />
        </KpiToMetric>
        <KpiToMetric m="faturamento">
          <HubMetricCard label="Faturamento (mês)" value="R$ 58k" icon={CreditCard} accent={ACCENT} />
        </KpiToMetric>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'flex-start' }}>
        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { id: 'overview', label: 'Visão Geral', icon: Activity },
            { id: 'clients', label: 'Clientes da Empresa', icon: Users },
            { id: 'billing', label: 'Faturamento & Planos', icon: CreditCard },
            { id: 'settings', label: 'Configurações', icon: Settings },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                border: 'none',
                background: activeTab === t.id ? `${ACCENT}10` : 'transparent',
                color: activeTab === t.id ? ACCENT : '#64748B',
                fontSize: 14,
                fontWeight: activeTab === t.id ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: '0.2s'
              }}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {/* DADOS CADASTRAIS DA EMPRESA */}
              <div style={{ ...SHELL.card, padding: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', letterSpacing: '0.06em', marginBottom: 20 }}>
                  DADOS CADASTRAIS DA EMPRESA
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                  {[
                    { label: 'CNPJ / DOCUMENTO', value: '45.201.382/0001-92', icon: Building2 },
                    { label: 'TELEFONE CONTATO', value: '(11) 99102-3821', icon: Phone },
                    { label: 'E-MAIL PRINCIPAL', value: 'diretoria@transportadorafalcao.com.br', icon: Mail },
                    { label: 'ENDEREÇO SEDE', value: 'Rodovia Anhanguera, KM 14 - São Paulo, SP', icon: MapPin },
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                        <item.icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8' }}>{item.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginTop: 2 }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', letterSpacing: '0.06em', marginBottom: 12 }}>
                  ATALHOS — ABRIR NO ZAPTRO
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {LINK_TILES.map((t) => (
                    <button
                      key={t.path + t.title}
                      type="button"
                      onClick={() => openZaptroApp(t.path)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: 16,
                        borderRadius: 12,
                        border: '1px solid #E5E7EB',
                        background: '#FFF',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.15s',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: `${ACCENT}14`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <t.icon size={20} color={ACCENT} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{t.title}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{t.subtitle}</div>
                        <div
                          style={{
                            marginTop: 10,
                            fontSize: 12,
                            fontWeight: 600,
                            color: ACCENT,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          Abrir
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div style={{ ...SHELL.card, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Clientes de {name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>Lista unificada de contatos e empresas atendidas por este tenant.</p>
                </div>
                <button style={{ ...SHELL.actionBtn, background: ACCENT, color: '#FFF', border: 'none' }} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.CLIENTS)}>
                  Ver todos no Zaptro
                </button>
              </div>

              <div style={{ border: '1px solid #F1F5F9', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#64748B' }}>CLIENTE</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#64748B' }}>CONTATO</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#64748B' }}>TAGS</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: '#64748B' }}>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Supermercado Avenida', contact: '(11) 98822-1100', tags: ['Fiel', 'Recorrente'] },
                      { name: 'Lojas Americanas (CD)', contact: '(11) 97722-3344', tags: ['Vip', 'Logística'] },
                      { name: 'Distribuidora SJC', contact: '(12) 99911-2233', tags: ['Novo'] },
                      { name: 'Farmácia Central', contact: '(11) 96655-4422', tags: ['Padrão'] },
                    ].map((c, i) => (
                      <tr key={i} style={{ borderBottom: i === 3 ? 'none' : '1px solid #F1F5F9' }}>
                        <td style={{ padding: '16px', fontSize: 14, fontWeight: 700 }}>{c.name}</td>
                        <td style={{ padding: '16px', fontSize: 13, color: '#64748B' }}>{c.contact}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {c.tags.map(t => (
                              <span key={t} style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', color: '#64748B' }}>{t.toUpperCase()}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button style={{ ...SHELL.actionBtn, padding: '6px 10px' }} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.CLIENTS)}>
                            <ExternalLink size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ ...SHELL.card, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Assinatura & Cobrança</h3>
                  <div style={{ padding: '6px 12px', borderRadius: 8, background: '#F0FDF4', color: '#16A34A', fontSize: 12, fontWeight: 800 }}>ASSINATURA ATIVA</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  <div style={{ padding: 20, borderRadius: 16, border: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>PLANO ATUAL</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{plan}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>Renovação automática em 12/06/2026</div>
                  </div>
                  <div style={{ padding: 20, borderRadius: 16, border: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>PRÓXIMA FATURA</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>R$ 499,00</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>Cartão Visa • Final 4422</div>
                  </div>
                </div>

                <div style={{ border: '1px solid #F1F5F9', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', fontSize: 11, fontWeight: 800, color: '#64748B' }}>HISTÓRICO RECENTE</div>
                  {[
                    { date: '12/05/2026', desc: 'Mensalidade Zaptro Pro', val: 'R$ 499,00', st: 'Pago' },
                    { date: '12/04/2026', desc: 'Mensalidade Zaptro Pro', val: 'R$ 499,00', st: 'Pago' },
                    { date: '12/03/2026', desc: 'Upgrade de Créditos (50k)', val: 'R$ 150,00', st: 'Pago' },
                  ].map((inv, i) => (
                    <div key={i} style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i === 2 ? 'none' : '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <FileText size={16} color="#94A3B8" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{inv.desc}</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>{inv.date}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{inv.val}</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#16A34A' }}>{inv.st.toUpperCase()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: 24, borderRadius: 20, background: '#0F172A', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Acesso Total ao Financeiro</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>Para gerenciar cartões, conciliação e notas fiscais completas, acesse o módulo no ZapTro.</p>
                </div>
                <button onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.BILLING)} style={{ ...SHELL.actionBtn, background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '100px', fontWeight: 900, textTransform: 'uppercase', padding: '10px 24px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)' }}>
                  <Zap size={14} /> LIBERAR CRÉDITOS
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ ...SHELL.card, padding: 24 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Configurações do Sistema</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 8 }}>API KEY (MASTER READ-ONLY)</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input readOnly value="zp_live_482910384729103847" style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontFamily: 'monospace', fontSize: 13 }} />
                      <button style={{ ...SHELL.actionBtn }} onClick={() => toastSuccess('Copiado!')}>Copiar</button>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Integrações Ativas</h4>
                      <button style={{ ...SHELL.actionBtn, padding: '6px 12px', fontSize: 12 }}>Configurar</button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {[
                        { name: 'Webhooks de Eventos', status: 'Conectado', icon: Activity },
                        { name: 'Sincronização ERP', status: 'Ativo', icon: RefreshCcw },
                        { name: 'Gateway de Mensagens', status: 'Operacional', icon: Zap },
                        { name: 'Relatórios Agendados', status: 'Ativo', icon: FileText },
                      ].map((item, i) => (
                        <div key={i} style={{ padding: 16, borderRadius: 12, border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                            <item.icon size={16} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>{item.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: 24, borderRadius: 20, border: '1px dashed #E2E8F0', textAlign: 'center' }}>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748B' }}>Configurações avançadas de domínio, whitelabel e segurança global.</p>
                <button onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.SETTINGS_ALIAS)} style={{ ...SHELL.actionBtn, background: ACCENT, color: 'white', border: 'none' }}>
                  GERENCIAR NO ZAPTRO
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isEmbedded) return profileBody;

  return (
    <div style={{ ...SHELL.container, minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ ...SHELL.contentArea, overflowY: 'auto' }}>
        {profileBody}
      </div>
    </div>
  );
};

export default ZaptroClientProfile;
