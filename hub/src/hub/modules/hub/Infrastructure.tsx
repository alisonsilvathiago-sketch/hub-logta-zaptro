import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Terminal, 
  Database, 
  Cpu, 
  Wifi, 
  Zap, 
  Layers, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ShieldAlert, 
  Lock, 
  Globe, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  HardDrive,
  Key,
  ArrowDownRight,
  Shield,
  Users,
  Smartphone,
  MessageSquare
} from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabaseZaptro as supabase } from '@core/lib/supabase-zaptro';
import LogtaModal from '@shared/components/Modal';
import Button from '@shared/components/Button';
import HubMetricCard from '@shared/components/HubMetricCard';
import HubSupabaseChart from '@shared/components/HubSupabaseChart';
import { forceGlobalSync } from '@core/lib/masterIntelligence';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import { checkAllSystemsConnectivity, type ConnectivityStatus } from '@core/lib/hubConnectivityService';
import { subscribeToEvents, type HubEvent } from '@core/lib/eventBridge';
import { HUB_PAGE_SUBTITLE } from '@hub/styles/hubPageTypography';

type InfraStatVariant = 'soft' | 'solid';

type InfraTopStat = {
  label: string;
  value: string;
  Icon: typeof Cpu;
  variant: InfraStatVariant;
  accent: string;
  softBg?: string;
};

const INFRA_TOP_STATS: InfraTopStat[] = [
  {
    label: 'Processamento Global',
    value: '14.2 %',
    Icon: Cpu,
    variant: 'soft',
    accent: '#0061FF',
    softBg: 'rgba(0, 97, 255, 0.08)',
  },
  {
    label: 'Disponibilidade (Uptime)',
    value: '99.9 %',
    Icon: Wifi,
    variant: 'solid',
    accent: '#0061FF',
  },
  {
    label: 'Banco de Dados',
    value: '24.5 GB',
    Icon: Database,
    variant: 'soft',
    accent: '#F59E0B',
    softBg: 'rgba(245, 158, 11, 0.12)',
  },
  {
    label: 'Eventos Críticos',
    value: '0',
    Icon: ShieldAlert,
    variant: 'solid',
    accent: '#EF4444',
  },
  {
    label: 'Eventos / 24h',
    value: '1284',
    Icon: ShieldCheck,
    variant: 'soft',
    accent: '#0061FF',
    softBg: 'rgba(0, 97, 255, 0.08)',
  },
  {
    label: 'Bloqueios Ativos',
    value: '42',
    Icon: Lock,
    variant: 'solid',
    accent: '#EF4444',
  },
  {
    label: 'Alertas Suspeitos',
    value: '15',
    Icon: ShieldAlert,
    variant: 'soft',
    accent: '#F59E0B',
    softBg: 'rgba(245, 158, 11, 0.12)',
  },
  {
    label: 'Compliance Global',
    value: '99.98%',
    Icon: Activity,
    variant: 'solid',
    accent: '#0061FF',
  },
];

const InfrastructureManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/gateway') || path.includes('/infrastructure/apis')) return 'apis';
    if (path.includes('/security') || path.includes('/seguranca')) return 'seguranca';
    if (path.includes('/logs')) return 'logs';
    if (path.includes('/vps-ollama') || path.includes('/comandos')) return 'comandos';
    if (path.includes('/storage') || path.includes('/backup')) return 'backup';
    return 'saude';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [searchTerm, setSearchTerm] = useState('');
  const [secSubTab, setSecSubTab] = useState('tokens');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState<any>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [securityStats, setSecurityStats] = useState<any>({});
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [connectivity, setConnectivity] = useState<ConnectivityStatus[]>([]);
  const [liveEvents, setLiveEvents] = useState<HubEvent[]>([]);

  const handleSyncCloud = async () => {
    const tid = toastLoading('Iniciando sincronização global...');
    setSyncing(true);
    try {
      await forceGlobalSync();
      const status = await checkAllSystemsConnectivity();
      setConnectivity(status);
      toastSuccess('Sincronização global concluída com sucesso.');
    } catch (err) {
      toastError('Falha ao sincronizar: ' + (err as any).message);
    } finally {
      toastDismiss(tid);
      setSyncing(false);
    }
  };

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    let path = `/master/infrastructure/${tabId}`;
    navigate(path);
  };

  const services = [
    { name: 'Navegador Logístico', latency: '42ms', load: '12%', icon: <Zap size={20} />, details: { category: 'Transporte', description: 'Otimização de rotas em tempo real.' } },
    { name: 'Guardião de Entregas', latency: '65ms', load: '8%', icon: <ShieldCheck size={20} />, details: { category: 'Segurança', description: 'Monitoramento preventivo de no-show.' } },
    { name: 'Talent Scout AI', latency: '120ms', load: '15%', icon: <Search size={20} />, details: { category: 'RH / Frota', description: 'Alocação dinâmica de motoristas.' } },
    { name: 'Auditor Operacional', latency: '88ms', load: '5%', icon: <Terminal size={20} />, details: { category: 'Financeiro', description: 'Validação automática de faturas.' } },
    { name: 'Core API Gateway', latency: '15ms', load: '24%', icon: <Layers size={20} />, details: { category: 'Infraestrutura', description: 'Roteamento central de requisições.' } },
    { name: 'Event Bridge', latency: '8ms', load: '18%', icon: <Activity size={20} />, details: { category: 'Infraestrutura', description: 'Barramento de eventos distribuído.' } },
    { name: 'Auth Server', latency: '35ms', load: '10%', icon: <Lock size={20} />, details: { category: 'Segurança', description: 'Gerenciamento de tokens e sessões.' } },
  ];

  const autonomousServices = [
    { name: 'Navegador Logístico', description: 'Otimização de rotas e custos.', icon: <Zap size={24} />, color: '#0061FF' },
    { name: 'Guardião de Entregas', description: 'Segurança e prevenção de falhas.', icon: <ShieldCheck size={24} />, color: '#0061FF' },
    { name: 'Talent Scout AI', description: 'Gestão inteligente de talentos.', icon: <Search size={24} />, color: '#F59E0B' },
    { name: 'Auditor Operacional', description: 'Auditoria fiscal e operacional.', icon: <Terminal size={24} />, color: '#EF4444' },
  ];

  useEffect(() => {
    fetchData();
    
    const unsubscribe = subscribeToEvents((event) => {
      setLiveEvents(prev => [event, ...prev].slice(0, 50));
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      const { data: logs } = await supabase.from('audit_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(20);
      if (logs) setAuditLogs(logs);

      const { data: secLogs } = await supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(20);
      if (secLogs) setSecurityLogs(secLogs);

      const { data: wl } = await supabase.from('ip_whitelist').select('*').limit(10);
      if (wl) setWhitelist(wl);

      const { data: ints } = await supabase.from('integrations').select('*');
      if (ints) setIntegrations(ints);

      const status = await checkAllSystemsConnectivity();
      setConnectivity(status);

      setSecurityStats({
        attempts: 1284,
        blocks: 42,
        alerts: 15
      });
    } catch (err) {
      console.error('Error fetching infra data:', err);
    }
  };

  const handleReAudit = (name: string) => {
    console.log(`Auditoria forçada para: ${name}`);
    setSelectedApi(null);
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#0061FF';
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'ATIVO':
      case 'OPERANTE':
      case 'ONLINE':
      case 'OK':
      case 'STABLE':
      case 'UP':
        return '#0061FF';
      case 'PENDING':
      case 'MAINTENANCE':
      case 'DEGRADED':
      case 'DEGRADADO':
        return '#F59E0B';
      case 'OFFLINE':
      case 'DOWN':
      case 'CRITICAL':
      case 'UNHEALTHY':
        return '#EF4444';
      default:
        return '#EF4444';
    }
  };

  /** Evita ponto vermelho com halo verde: `statusDot` fixa box-shadow em #0061FF */
  const statusDotWithGlow = (color: string) => ({
    ...styles.statusDot,
    backgroundColor: color,
    boxShadow: `0 0 8px ${color}`,
  });

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'zaptro': return <MessageSquare size={20} />;
      case 'logta': return <Zap size={20} />;
      case 'ai': return <Cpu size={20} />;
      case 'backup': return <HardDrive size={20} />;
      default: return <Layers size={20} />;
    }
  };

  const activeServices = connectivity.length > 0 ? connectivity.map(c => ({
    name: c.system,
    status: c.status.toUpperCase(),
    latency: `${c.latency}ms`,
    load: c.status === 'online' ? `${Math.floor(Math.random() * 5) + 2}%` : '0%',
    icon: getProviderIcon(c.system.split(' ')[0]),
    details: { category: 'Infraestrutura Master', description: c.error || `Serviço ${c.system} operando normalmente.` }
  })) : services;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerTitleGroup}>
          <h1 style={styles.title}>Infraestrutura & Gestão Master</h1>
          <p style={styles.subtitle}>Monitoramento de saúde, segurança perimetral e resiliência de dados global.</p>
        </div>
        <div style={styles.headerActions}>
          <div style={styles.statusBadgeGlobal}>
            <div style={statusDotWithGlow('#0061FF')} />
            SISTEMA OPERANTE
          </div>
          <Button 
            variant="outline" 
            icon={<Layers size={18} />} 
            label="Limpar Cache"
            onClick={() => console.log('Limpando cache global...')} 
          />
          <Button 
            variant="danger" 
            icon={<ShieldAlert size={18} />} 
            label="MODO PÂNICO"
            onClick={() => console.log('ATIVANDO MODO PÂNICO!')} 
          />
          <Button 
            variant="secondary" 
            icon={<RefreshCw size={18} />} 
            onClick={() => fetchData()} 
          />
        </div>
      </header>

      <div style={{ paddingTop: 4 }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <HubSupabaseChart label="PROCESSAMENTO GLOBAL" value="14.2%" data={[40, 50, 60, 50, 40, 50, 60, 50, 40, 50]} />
            <HubSupabaseChart label="DISPONIBILIDADE" value="99.9%" data={[98, 99, 100, 100, 99, 100, 100, 99, 100, 100]} />
            <HubSupabaseChart label="BANCO DE DADOS" value="24.5 GB" data={[30, 40, 50, 60, 70, 80, 70, 60, 50, 40]} />
            <HubSupabaseChart label="EVENTOS CRÍTICOS" value="0" data={[0, 0, 0, 1, 0, 0, 0, 0, 0, 0]} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <HubSupabaseChart label="EVENTOS / 24H" value="1284" data={[20, 30, 40, 50, 60, 70, 80, 90, 80, 70]} />
            <HubSupabaseChart label="BLOQUEIOS ATIVOS" value="42" data={[10, 15, 20, 25, 30, 35, 40, 42, 40, 38]} />
            <HubSupabaseChart label="ALERTAS SUSPEITOS" value="15" data={[5, 10, 8, 12, 10, 8, 6, 10, 12, 15]} />
            <HubSupabaseChart label="COMPLIANCE GLOBAL" value="99.98%" data={[99, 99, 100, 100, 99, 99, 100, 100, 99, 99]} />
          </div>

      {activeTab === 'saude' && (
        <div style={styles.healthSection}>
          <div style={styles.sectionHeaderInner}>
            <h3 style={styles.sectionTitle}>Módulos &amp; Micro-serviços Ativos</h3>
            <span style={styles.aiStatusBadge}>{activeServices.length} MÓDULOS EM TEMPO REAL</span>
          </div>

          <div style={styles.healthGrid}>
            {activeServices.map(svc => (
              <div 
                key={svc.name} 
                style={styles.serviceCard} 
                className="hover-scale"
                onClick={() => setSelectedApi(svc.details)}
              >
                <div style={styles.svcHeader}>
                  <div style={styles.svcIcon}>{svc.icon}</div>
                  <div style={{ ...styles.svcStatus, color: getStatusColor(svc.status) }}>
                    <div style={statusDotWithGlow(getStatusColor(svc.status))} />
                     <span>{(svc.status || 'OPERANTE').toUpperCase()}</span>
                  </div>
                </div>
                <h4 style={styles.svcName}>{svc.name}</h4>
                <div style={styles.svcMetrics}>
                   <div style={styles.svcMetric}>
                      <span style={styles.metricLabel}>Latência</span>
                      <span style={{...styles.metricValue, color: 'var(--accent)'}}>{svc.latency}</span>
                   </div>
                   <div style={styles.svcMetric}>
                      <span style={styles.metricLabel}>Carga</span>
                      <span style={{...styles.metricValue, color: '#0F172A'}}>{svc.load}</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'apis' && (
        <div style={styles.healthSection}>
          <div style={styles.sectionHeaderInner}>
            <h3 style={styles.sectionTitle}>Documentação & Gateway de APIs</h3>
            <span style={styles.aiStatusBadge}>ENDPOINT CENTRALIZADO</span>
          </div>
          
          <div style={styles.fullCard}>
             <div style={styles.logTableContainer}>
                <table style={styles.table}>
                   <thead>
                      <tr style={styles.thead}>
                         <th style={styles.th}>API ENDPOINT</th>
                         <th style={styles.th}>MÉTODO</th>
                         <th style={styles.th}>VERSÃO</th>
                         <th style={styles.th}>STATUS</th>
                         <th style={{...styles.th, textAlign: 'right'}}>AÇÃO</th>
                      </tr>
                   </thead>
                   <tbody>
                      {[
                        { path: '/v1/logistica/navigator', method: 'POST', version: 'v1.4.2', status: 'STABLE' },
                        { path: '/v1/storage/logdock', method: 'PUT', version: 'v2.0.0', status: 'STABLE' },
                        { path: '/v1/comunicacao/zaptro', method: 'GET', version: 'v2.1.0', status: 'STABLE' },
                        { path: '/v1/financeiro/audit', method: 'POST', version: 'v1.1.5', status: 'MAINTENANCE' },
                        { path: '/v1/auth/session', method: 'GET', version: 'v3.0.1', status: 'CRITICAL' },
                      ].map((api, i) => (
                        <tr key={i} style={styles.tr}>
                           <td style={styles.td}><code style={{...styles.logIp, fontSize: '13px'}}>{api.path}</code></td>
                           <td style={styles.td}><span style={{...styles.logAction, color: api.method === 'POST' ? '#0061FF' : '#64748B'}}>{api.method}</span></td>
                           <td style={styles.td}><span style={styles.moduleBadge}>{api.version}</span></td>
                           <td style={styles.td}>
                              <div style={{...styles.statusTag, color: api.status === 'CRITICAL' ? '#EF4444' : api.status === 'MAINTENANCE' ? '#F59E0B' : '#0061FF'}}>
                                 <div style={statusDotWithGlow(api.status === 'CRITICAL' ? '#EF4444' : api.status === 'MAINTENANCE' ? '#F59E0B' : '#0061FF')} />
                                 {api.status}
                              </div>
                           </td>
                           <td style={{...styles.td, textAlign: 'right'}}>
                              <button style={styles.rowBtn} title="Testar Endpoint"><RefreshCw size={14} /></button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'seguranca' && (
        <div style={styles.securitySection}>
          <div style={styles.metricsGrid}>
            {[
              { label: 'Eventos / 24h', value: securityStats.attempts || 1284, icon: <ShieldCheck size={20} />, color: 'var(--accent)', bg: 'rgba(99, 102, 241, 0.1)' },
              { label: 'Bloqueios Ativos', value: securityStats.blocks || 42, icon: <Lock size={20} />, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
              { label: 'Alertas Suspeitos', value: securityStats.alerts || 15, icon: <ShieldAlert size={20} />, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
              { label: 'Compliance Global', value: '99.98%', icon: <Activity size={20} />, color: '#0061FF', bg: 'rgba(0, 97, 255, 0.1)' },
            ].map((m, i) => (
              <div key={i} style={styles.metricCard}>
                <div style={{...styles.metricIconBox, backgroundColor: m.bg, color: m.color}}>{m.icon}</div>
                <div style={styles.metricInfo}>
                  <p style={styles.metricLabel}>{m.label}</p>
                  <h3 style={{...styles.metricValue, color: m.label === 'Compliance Global' ? '#0061FF' : '#0F172A'}}>{m.value}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* SUB-NAVEGAÇÃO DE SEGURANÇA */}
          <div style={styles.secSubTabNav}>
            {[
              { id: 'tokens', label: 'Motores de Token', icon: <Key size={16} /> },
              { id: 'middleware', label: 'Middlewares & Rotas', icon: <Layers size={16} /> },
              { id: 'firewall', label: 'Firewall & WAF', icon: <Shield size={16} /> },
              { id: '2fa', label: 'Governança & 2FA', icon: <Lock size={16} /> },
              { id: 'rbac', label: 'RBAC & Roles', icon: <Users size={16} /> },
              { id: 'auditoria', label: 'Trilha de Auditoria', icon: <Terminal size={16} /> },
            ].map((tab) => {
              return (
                <button
                  key={tab.id}
                  onClick={() => setSecSubTab(tab.id)}
                  style={{
                    ...styles.secSubTabBtn,
                    backgroundColor: secSubTab === tab.id ? 'var(--accent)' : 'white',
                    color: secSubTab === tab.id ? 'white' : '#64748B',
                    borderColor: secSubTab === tab.id ? 'var(--accent)' : '#E2E8F0',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              );
            })}
          </div>

          {/* SEC SUB-TABS CONTENT */}
          {secSubTab === 'tokens' && (
            <div style={styles.twoColumnGrid}>
              <div style={styles.mainCardSecurity}>
                <div style={styles.cardHeaderPlain}>
                  <h4 style={styles.secCardTitle}>Gerenciador de Motores de Token</h4>
                  <p style={styles.secCardSub}>Controle ativo de TTL, rotação e escopos criptográficos de autenticação.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
                  {[
                    { name: '1. Access Token (JWT)', desc: 'Utilizado para login, frontend e usuários autenticados no ecossistema.', ttl: '15 Minutos', algorithm: 'HS256', status: 'ATIVO', usage: 'Alto Tráfego (Client-side)' },
                    { name: '2. Refresh Token', desc: 'Renovação silenciosa de sessão ativa. Criptografado no DB e vinculado ao dispositivo.', ttl: '30 Dias', algorithm: 'AES-256-GCM', status: 'ATIVO', usage: 'Persistência de Sessão' },
                    { name: '3. Internal Gateway Token', desc: 'Comunicação direta entre monorepos (HUB ⇄ LOGTA ⇄ ZAPTRO ⇄ Ollama). Nunca exposto ao front.', ttl: 'Rotativo (Custom)', algorithm: 'SHA-256 HMAC', status: 'ATIVO', usage: 'Backend-only' },
                    { name: '4. Master Admin Token', desc: 'Acesso total e exclusivo de infraestrutura para VPS, Ollama e configurações críticas de IA.', ttl: 'Sessão Curta', algorithm: 'RSA-4096-PSS', status: 'ALTA GOVERNANÇA', usage: 'Admin-only' },
                  ].map((tok, idx) => (
                    <div key={idx} style={styles.tokenItemCard}>
                      <div style={styles.tokenCardHeader}>
                        <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800' }}>{tok.name}</strong>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          backgroundColor: tok.status === 'ALTA GOVERNANÇA' ? '#FEE2E2' : '#EFF6FF',
                          color: tok.status === 'ALTA GOVERNANÇA' ? '#EF4444' : '#0061FF',
                          padding: '4px 10px',
                          borderRadius: '12px'
                        }}>{tok.status}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748B', margin: '6px 0 12px 0', lineHeight: '1.5' }}>{tok.desc}</p>
                      <div style={styles.tokenSpecs}>
                        <div><span style={styles.specLabel}>Expiração:</span> <strong style={styles.specVal}>{tok.ttl}</strong></div>
                        <div><span style={styles.specLabel}>Cripto:</span> <strong style={styles.specVal}>{tok.algorithm}</strong></div>
                        <div><span style={styles.specLabel}>Escopo:</span> <strong style={{...styles.specVal, color: 'var(--accent)'}}>{tok.usage}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={styles.sidebarCardSecurity}>
                  <h3 style={styles.sidebarTitle}>Hosts & IPs Autorizados (WAF)</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>Controle granular de acesso por IP para chamadas administrativas sensíveis do ecossistema.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {whitelist.map(ip => (
                      <div key={ip.id} style={styles.ipItem}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <code style={{ fontWeight: '800', fontFamily: 'monospace', fontSize: '13px', color: 'var(--accent)' }}>{ip.ip_address}</code>
                          <div style={statusDotWithGlow('#0061FF')} />
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px', fontWeight: '600' }}>{ip.description}</div>
                      </div>
                    ))}
                    <Button 
                      variant="secondary" 
                      icon={<Plus size={14} />} 
                      label="AUTORIZAR HOST" 
                      fullWidth
                    />
                  </div>
                </div>

                <div style={styles.sidebarCardSecurity}>
                  <h3 style={styles.sidebarTitle}>Assinatura HMAC de Requests</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', lineHeight: '1.5' }}>
                    Proteção ativa contra replay attacks e chamadas forjadas externas através de assinatura criptográfica SHA256 HMAC obrigatória.
                  </p>
                  <div style={styles.hmacBadgeWrapper}>
                    <span style={styles.hmacBadge}>x-hub-signature</span>
                    <span style={styles.hmacBadge}>x-hub-origin</span>
                    <span style={styles.hmacBadge}>x-hub-device</span>
                    <span style={styles.hmacBadge}>x-hub-internal-token</span>
                  </div>
                  <div style={styles.secureBanner}>
                    <ShieldCheck size={18} color="#0061FF" />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#1E3A8A' }}>VALIDADOR HMAC: ATIVO</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {secSubTab === 'firewall' && (
            <div style={styles.twoColumnGrid}>
              <div style={styles.mainCardSecurity}>
                <div style={styles.cardHeaderPlain}>
                  <h4 style={styles.secCardTitle}>Firewall Perimetral & WAF</h4>
                  <p style={styles.secCardSub}>Proteção ativa contra ataques de força bruta, SQLi e requisições maliciosas.</p>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { name: 'Proteção contra DDoS', status: 'ATIVO', mode: 'Mitigação Automática', level: 'ALTO' },
                    { name: 'Bloqueio de User-Agents Suspeitos', status: 'ATIVO', mode: 'Pattern Matching', level: 'MÉDIO' },
                    { name: 'Filtro de Geo-IP (Restrição Global)', status: 'INATIVO', mode: 'Países Bloqueados: 0', level: 'CRÍTICO' },
                    { name: 'Rate Limiting Dinâmico', status: 'ATIVO', mode: 'Baseado em Sessão', level: 'ALTO' },
                  ].map((fw, idx) => (
                    <div key={idx} style={styles.tokenItemCard}>
                      <div style={styles.tokenCardHeader}>
                        <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800' }}>{fw.name}</strong>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          backgroundColor: fw.status === 'ATIVO' ? '#EFF6FF' : '#F1F5F9',
                          color: fw.status === 'ATIVO' ? '#0061FF' : '#64748B',
                          padding: '4px 10px',
                          borderRadius: '12px'
                        }}>{fw.status}</span>
                      </div>
                      <div style={{...styles.tokenSpecs, border: 'none', padding: 0, marginTop: '8px'}}>
                        <div><span style={styles.specLabel}>Modo:</span> <strong style={styles.specVal}>{fw.mode}</strong></div>
                        <div><span style={styles.specLabel}>Nível de Risco:</span> <strong style={{...styles.specVal, color: fw.level === 'CRÍTICO' ? '#EF4444' : '#F59E0B'}}>{fw.level}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={styles.sidebarCardSecurity}>
                  <h3 style={styles.sidebarTitle}>Lista Negra de IPs</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>IPs bloqueados permanentemente por atividades suspeitas ou excesso de falhas.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { ip: '185.220.101.42', reason: 'Brute Force Attack', time: 'Há 2h' },
                      { ip: '45.143.203.11', reason: 'Suspicious Bot Crawler', time: 'Há 5h' },
                    ].map((ip, i) => (
                      <div key={i} style={{...styles.ipItem, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2'}}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <code style={{ fontWeight: '800', fontFamily: 'monospace', fontSize: '13px', color: '#EF4444' }}>{ip.ip}</code>
                          <ShieldAlert size={14} color="#EF4444" />
                        </div>
                        <div style={{ fontSize: '11px', color: '#B91C1C', marginTop: '6px', fontWeight: '600' }}>{ip.reason} • {ip.time}</div>
                      </div>
                    ))}
                    <Button variant="danger" icon={<Lock size={14} />} label="BLOQUEAR NOVO IP" fullWidth />
                  </div>
                </div>
              </div>
            </div>
          )}

          {secSubTab === '2fa' && (
            <div style={styles.twoColumnGrid}>
              <div style={styles.mainCardSecurity}>
                <div style={styles.cardHeaderPlain}>
                  <h4 style={styles.secCardTitle}>Autenticação de Dois Fatores (2FA)</h4>
                  <p style={styles.secCardSub}>Configurações globais de obrigatoriedade e métodos de verificação.</p>
                </div>
                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={styles.secureBanner}>
                    <ShieldCheck size={24} color="#0061FF" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E3A8A' }}>POLÍTICA GLOBAL DE 2FA: RECOMENDADA</div>
                      <div style={{ fontSize: '12px', color: '#1E3A8A', opacity: 0.8 }}>78% dos administradores possuem 2FA ativo.</div>
                    </div>
                  </div>
                  
                  <div style={styles.detailGrid}>
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Método Padrão</div>
                      <div style={styles.detailVal}><Smartphone size={18} /> Authenticator App (TOTP)</div>
                    </div>
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Backup</div>
                      <div style={styles.detailVal}><Terminal size={18} /> Recovery Codes (8 dígitos)</div>
                    </div>
                  </div>

                  <div style={styles.tokenItemCard}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800' }}>Obrigatoriedade por Role</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {['MASTER_ADMIN', 'ADMIN', 'FINANCEIRO'].map(role => (
                        <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #E2E8F0' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{role}</span>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#0061FF' }}>OBRIGATÓRIO</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={styles.sidebarCardSecurity}>
                  <h3 style={styles.sidebarTitle}>Segurança da Sessão</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={styles.specLabel}>Tempo de Inatividade</label>
                      <div style={{...styles.detailVal, fontSize: '14px', marginTop: '4px'}}>30 Minutos</div>
                    </div>
                    <div>
                      <label style={styles.specLabel}>Sessões Simultâneas</label>
                      <div style={{...styles.detailVal, fontSize: '14px', marginTop: '4px'}}>Até 3 dispositivos</div>
                    </div>
                    <Button variant="outline" label="Revogar Todas as Sessões" fullWidth />
                  </div>
                </div>
              </div>
            </div>
          )}

          {secSubTab === 'middleware' && (
            <div style={styles.twoColumnGrid}>
              <div style={styles.mainCardSecurity}>
                <div style={styles.cardHeaderPlain}>
                  <h4 style={styles.secCardTitle}>Políticas de Rotas Protegidas</h4>
                  <p style={styles.secCardSub}>Mapeamento do Middleware Global em tempo real em todas as rotas de API do monorepo.</p>
                </div>
                <div style={{ padding: '24px' }}>
                  <div style={styles.logTableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.thead}>
                          <th style={styles.th}>ROTA DO SISTEMA</th>
                          <th style={styles.th}>VALIDAÇÃO JWT</th>
                          <th style={styles.th}>RATE LIMIT</th>
                          <th style={styles.th}>ROLE REQUERIDA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { path: '/master/*', jwt: 'OBRIGATÓRIO', rateLimit: '120 req/min', role: 'MASTER_ADMIN' },
                          { path: '/api/*', jwt: 'OBRIGATÓRIO', rateLimit: '300 req/min', role: 'ANY_AUTHENTICATED' },
                          { path: '/gateway/*', jwt: 'OBRIGATÓRIO', rateLimit: '150 req/min', role: 'SYSTEM / AGENT' },
                          { path: '/infra/*', jwt: 'OBRIGATÓRIO', rateLimit: '60 req/min', role: 'MASTER_ADMIN' },
                          { path: '/automation/*', jwt: 'OBRIGATÓRIO', rateLimit: '100 req/min', role: 'SYSTEM' },
                          { path: '/integrations/*', jwt: 'OBRIGATÓRIO', rateLimit: '200 req/min', role: 'ADMIN' },
                          { path: '/storage/*', jwt: 'OBRIGATÓRIO', rateLimit: '400 req/min', role: 'ANY_AUTHENTICATED' },
                          { path: '/brain/*', jwt: 'OBRIGATÓRIO', rateLimit: '50 req/min', role: 'IA_AGENT' },
                          { path: '/huba/*', jwt: 'OBRIGATÓRIO', rateLimit: '50 req/min', role: 'IA_AGENT' },
                          { path: '/billing/*', jwt: 'OBRIGATÓRIO', rateLimit: '100 req/min', role: 'FINANCEIRO' },
                        ].map((route, i) => (
                          <tr key={i} style={styles.tr}>
                            <td style={styles.td}><code style={{...styles.logIp, fontSize: '13px'}}>{route.path}</code></td>
                            <td style={styles.td}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '800',
                                color: '#1E3A8A',
                                backgroundColor: '#DBEAFE',
                                padding: '4px 8px',
                                borderRadius: '6px'
                              }}>{route.jwt}</span>
                            </td>
                            <td style={styles.td}><span style={styles.moduleBadge}>{route.rateLimit}</span></td>
                            <td style={styles.td}><strong style={{ fontSize: '12px', color: '#0F172A', fontWeight: '800' }}>{route.role}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={styles.sidebarCardSecurity}>
                  <h3 style={styles.sidebarTitle}>VPS Invisibilizer Proxy (Ollama)</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px', lineHeight: '1.5' }}>
                    A VPS do Ollama é totalmente invisível ao frontend. O tráfego passa obrigatoriamente por nosso gateway seguro para mascarar o IP de borda.
                  </p>
                  <div style={styles.proxyMapBox}>
                    <div style={styles.proxyNode}>Frontend <span style={{ fontSize: '11px', color: '#94A3B8' }}>/api/ai</span></div>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}><ArrowDownRight size={16} color="var(--accent)" /></div>
                    <div style={{...styles.proxyNode, backgroundColor: '#0F172A', color: 'white', borderColor: '#1E293B'}}>Gateway Central 🔐</div>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}><ArrowDownRight size={16} color="var(--accent)" /></div>
                    <div style={styles.proxyNode}>VPS Ollama <span style={{ fontSize: '11px', color: '#0061FF', fontWeight: '800' }}>(IP OCULTO)</span></div>
                  </div>
                </div>

                <div style={styles.sidebarCardSecurity}>
                  <h3 style={styles.sidebarTitle}>CORS & White-labeled Domains</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>Somente as origens oficiais autenticadas possuem permissão de requisição no gateway.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['*.logta.com (SaaS Logta)', 'localhost:5173 (Dev Logta)', 'localhost:5175 (Hub Master)'].map((dom, i) => (
                      <div key={i} style={styles.corsItem}>
                        <code style={{ fontSize: '12px', color: '#0F172A', fontWeight: '700' }}>{dom}</code>
                        <CheckCircle2 size={14} color="#0061FF" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {secSubTab === 'rbac' && (
            <div style={styles.fullCard}>
              <div style={styles.cardHeaderPlain}>
                <h4 style={styles.secCardTitle}>RBAC - Matriz de Governança e Roles</h4>
                <p style={styles.secCardSub}>Mapeamento de permissões granulares por papel funcional no ecossistema HUB MASTER.</p>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={styles.logTableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>ROLE OBRIGATÓRIA</th>
                        <th style={styles.th}>DESCRIÇÃO E LIMITE</th>
                        <th style={styles.th}>ACESSO VPS/INFRA</th>
                        <th style={styles.th}>CONFIGURAÇÕES IA</th>
                        <th style={styles.th}>ÁREA CLIENTE</th>
                        <th style={styles.th}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { role: 'MASTER_ADMIN', desc: 'Acesso total e irrestrito a todos os monorepos.', infra: 'SIM', ia: 'SIM', client: 'SIM', status: 'ATIVO' },
                        { role: 'ADMIN', desc: 'Acesso total operacional, exceto comandos destrutivos VPS.', infra: 'NÃO', ia: 'SIM', client: 'SIM', status: 'ATIVO' },
                        { role: 'SUPERVISOR', desc: 'Relatórios, monitoramento de latência e auditorias.', infra: 'LEITURA', ia: 'LEITURA', client: 'SIM', status: 'ATIVO' },
                        { role: 'FINANCEIRO', desc: 'Acesso à governança de assinaturas, MRR e Billing.', infra: 'NÃO', ia: 'NÃO', client: 'NÃO', status: 'ATIVO' },
                        { role: 'OPERACIONAL', desc: 'Operações logísticas diárias e gestão de coletas.', infra: 'NÃO', ia: 'NÃO', client: 'NÃO', status: 'ATIVO' },
                        { role: 'ATENDIMENTO', desc: 'Gerenciamento de tickets de suporte nível 1.', infra: 'NÃO', ia: 'NÃO', client: 'NÃO', status: 'ATIVO' },
                        { role: 'CLIENTE', desc: 'Restrito apenas à sua própria conta de tenant.', infra: 'NÃO', ia: 'NÃO', client: 'EXCLUSIVO', status: 'ATIVO' },
                        { role: 'IA_AGENT', desc: 'Processamento autônomo com chaves somente leitura controlada.', infra: 'SIM (API)', ia: 'SIM (API)', client: 'NÃO', status: 'ATIVO' },
                        { role: 'SYSTEM', desc: 'Comunicações internas síncronas entre microsserviços.', infra: 'SIM (API)', ia: 'SIM (API)', client: 'SIM', status: 'ATIVO' },
                      ].map((item, idx) => (
                        <tr key={idx} style={styles.tr}>
                          <td style={styles.td}><strong style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '800' }}>{item.role}</strong></td>
                          <td style={styles.td}><span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>{item.desc}</span></td>
                          <td style={styles.td}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              color: item.infra === 'SIM' ? '#1E3A8A' : item.infra === 'LEITURA' ? '#9A3412' : '#991B1B',
                              backgroundColor: item.infra === 'SIM' ? '#DBEAFE' : item.infra === 'LEITURA' ? '#FFEDD5' : '#FEE2E2',
                              padding: '4px 8px',
                              borderRadius: '6px'
                            }}>{item.infra}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              color: item.ia === 'SIM' ? '#1E3A8A' : item.ia === 'LEITURA' ? '#9A3412' : '#991B1B',
                              backgroundColor: item.ia === 'SIM' ? '#DBEAFE' : item.ia === 'LEITURA' ? '#FFEDD5' : '#FEE2E2',
                              padding: '4px 8px',
                              borderRadius: '6px'
                            }}>{item.ia}</span>
                          </td>
                          <td style={styles.td}><span style={styles.moduleBadge}>{item.client}</span></td>
                          <td style={styles.td}>
                            <div style={{...styles.statusTag, color: '#0061FF'}}>
                              <div style={statusDotWithGlow('#0061FF')} />
                              {item.status}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {secSubTab === 'auditoria' && (
            <div style={styles.twoColumnGrid}>
              <div style={styles.mainCardSecurity}>
                <div style={styles.cardHeaderPlain}>
                  <h4 style={styles.secCardTitle}>Trilha de Auditoria Master</h4>
                  <p style={styles.secCardSub}>Registros detalhados de login, criação, exclusão, acessos IA e falhas globais do ecossistema.</p>
                </div>
                <div style={styles.logTableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>OPERADOR</th>
                        <th style={styles.th}>AÇÃO</th>
                        <th style={styles.th}>RECURSO</th>
                        <th style={styles.th}>DATA</th>
                        <th style={{...styles.th, textAlign: 'right'}}>DETALHES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.slice(0, 10).map(log => (
                        <tr key={log.id} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A' }}>{log.profiles?.full_name || 'Sistema'}</div>
                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{log.actor_email}</div>
                          </td>
                          <td style={styles.td}><span style={styles.logAction}>{log.action?.replace(/_/g, ' ')}</span></td>
                          <td style={styles.td}><span style={styles.moduleBadge}>{log.resource}</span></td>
                          <td style={styles.td}><span style={styles.logTime}>{new Date(log.created_at).toLocaleString()}</span></td>
                          <td style={{...styles.td, textAlign: 'right'}}>
                            <button style={styles.rowBtn} onClick={() => setSelectedLog(log)}><Eye size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={styles.sidebarCardSecurity}>
                  <h3 style={styles.sidebarTitle}>Diretórios de Logs de Sistema</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>Diretórios segregados para inspeção técnica e depuração ágil:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { label: '/logs/security', desc: 'Falhas de autenticação, bloqueios de IP', size: '24 KB', count: 12 },
                      { label: '/logs/gateway', desc: 'Tráfego de borda e assinatura HMAC', size: '1.2 MB', count: 342 },
                      { label: '/logs/auth', desc: 'Auditorias de sessão e token JWT', size: '142 KB', count: 88 },
                      { label: '/logs/ia', desc: 'Transações de IA, tokens do Ollama', size: '450 KB', count: 120 },
                      { label: '/logs/system', desc: 'Eventos de microsserviço e BullMQ', size: '2.4 MB', count: 954 },
                    ].map((dir, i) => (
                      <div key={i} style={styles.logFolderItem} onClick={() => console.log(`Diretório ${dir.label} selecionado`)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: '800' }}>{dir.label}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700' }}>{dir.size}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{dir.desc}</span>
                          <span style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8' }}>{dir.count} eventos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div style={styles.healthSection}>
          <div style={styles.fullCard}>
            <div style={styles.cardHeader}>
              <h3 style={styles.sectionTitle}>Eventos de Infraestrutura</h3>
              <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>{securityLogs.length} EVENTOS RECENTES</span>
            </div>

            <div style={styles.logTableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>EVENTO</th>
                    <th style={styles.th}>ORIGEM / IP</th>
                    <th style={styles.th}>DETALHES</th>
                    <th style={styles.th}>DATA / HORA</th>
                    <th style={styles.th}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLogs.map(log => (
                    <tr key={log.id} style={styles.tr}>
                      <td style={styles.td}><span style={styles.logAction}>{log.action.replace(/_/g, ' ')}</span></td>
                      <td style={styles.td}><span style={styles.logIp}>{log.ip_address}</span></td>
                      <td style={styles.td}><code style={styles.logDetails}>{JSON.stringify(log.details)}</code></td>
                      <td style={styles.td}><span style={styles.logTime}>{new Date(log.created_at).toLocaleString()}</span></td>
                      <td style={styles.td}>
                        {log.success ? (
                          <div style={{...styles.statusTag, color: '#0061FF'}}><CheckCircle2 size={14} /> SUCESSO</div>
                        ) : (
                          <div style={{...styles.statusTag, color: '#EF4444'}}><AlertCircle size={14} /> FALHA</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comandos' && (
        <div style={styles.healthSection}>
          <div style={styles.sectionHeaderInner}>
            <h3 style={styles.sectionTitle}>Serviços de Inteligência Autônoma</h3>
            <div style={styles.statusBadgeActive}>IA MASTER ATIVA</div>
          </div>

          <div style={styles.autonomousGrid}>
            {autonomousServices.map(svc => (
              <div key={svc.name} style={styles.autonomousCard}>
                <div style={{...styles.autonomousIcon, color: svc.color}}>{svc.icon}</div>
                <div style={styles.autonomousInfo}>
                  <h4 style={styles.autonomousName}>{svc.name}</h4>
                  <p style={styles.autonomousDesc}>{svc.description}</p>
                </div>
                <span style={styles.autonomousAction}>
                  <Button
                    variant="secondary"
                    label="EXECUTAR"
                    onClick={() => handleReAudit(svc.name)}
                  />
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '48px' }}>
            <h3 style={styles.sectionTitle}>Barramento de Eventos (Event Bridge)</h3>
            <p style={styles.subtitle}>Fluxo de eventos em tempo real entre Hub Master e tenants Logta.</p>
            
            <div style={{ 
              marginTop: '20px', 
              backgroundColor: '#0F172A', 
              borderRadius: '24px', 
              padding: '24px',
              maxHeight: '300px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              border: '1px solid #1E293B'
            }}>
              {liveEvents.length === 0 ? (
                <div style={{ color: '#64748B', textAlign: 'center', padding: '40px', fontSize: '13px' }}>
                  Aguardando eventos no barramento...
                </div>
              ) : (
                liveEvents.map((evt, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    padding: '12px 16px', 
                    backgroundColor: '#1E293B', 
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    <div style={{ 
                      padding: '4px 8px', 
                      backgroundColor: '#334155', 
                      borderRadius: '6px', 
                      color: '#94A3B8',
                      fontWeight: '800',
                      fontSize: '10px'
                    }}>
                      {evt.origin}
                    </div>
                    <div style={{ flex: 1, color: '#E2E8F0', fontWeight: '600' }}>
                      {evt.type}
                    </div>
                    <div style={{ color: '#64748B', fontFamily: 'monospace' }}>
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ marginTop: '48px' }}>
            <h3 style={styles.sectionTitle}>Comandos de Manutenção Global</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '24px' }}>
              <button style={styles.masterCommandBtn} onClick={() => console.log('Clear Cache')}>
                <RefreshCw size={20} />
                <div>
                  <div style={styles.masterCommandLabel}>Limpar Cache Global</div>
                  <div style={styles.masterCommandSub}>Limpa Redis e Buffers de Borda</div>
                </div>
              </button>
              <button 
                style={{
                  ...styles.masterCommandBtn,
                  opacity: syncing ? 0.6 : 1,
                  cursor: syncing ? 'not-allowed' : 'pointer'
                }} 
                onClick={handleSyncCloud}
                disabled={syncing}
              >
                <Globe size={20} className={syncing ? 'animate-spin' : ''} />
                <div>
                  <div style={styles.masterCommandLabel}>Sincronizar Cloud</div>
                  <div style={styles.masterCommandSub}>Forçar propagação de Configs</div>
                </div>
              </button>
              <button style={{...styles.masterCommandBtn, color: '#EF4444', borderColor: '#FEE2E2'}} onClick={() => console.log('Panic Mode')}>
                <ShieldAlert size={20} />
                <div>
                  <div style={styles.masterCommandLabel}>Modo de Pânico</div>
                  <div style={styles.masterCommandSub}>Bloquear todos os acessos externos</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div style={styles.healthSection}>
          <div style={styles.sectionHeaderInner}>
            <h3 style={styles.sectionTitle}>Estratégia de Backup & Redundância</h3>
            <Button 
              variant="primary" 
              icon={<Plus size={18} />} 
              label="NOVO SNAPSHOT MANUAL" 
              onClick={() => {}} 
            />
          </div>
          
          <div style={styles.fullCard}>
            <div style={styles.logTableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>SNAPSHOT ID</th>
                    <th style={styles.th}>TAMANHO</th>
                    <th style={styles.th}>DATA / HORA</th>
                    <th style={styles.th}>DESTINO</th>
                    <th style={styles.th}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'snap-2024-04-30-01', size: '12.4 GB', date: 'Hoje, 00:00', dest: 'AWS S3 (Virginia)', status: 'CONCLUÍDO' },
                    { id: 'snap-2024-04-29-01', size: '12.3 GB', date: 'Ontem, 00:00', dest: 'AWS S3 (Virginia)', status: 'CONCLUÍDO' },
                    { id: 'snap-2024-04-28-01', size: '12.1 GB', date: '28 Abr, 00:00', dest: 'AWS S3 (Virginia)', status: 'CONCLUÍDO' },
                  ].map(snap => (
                    <tr key={snap.id} style={styles.tr}>
                      <td style={styles.td}><code style={styles.codeBlockSnapshot}>{snap.id}</code></td>
                      <td style={styles.td}><span style={{ fontWeight: '700', color: '#0F172A' }}>{snap.size}</span></td>
                      <td style={styles.td}><span style={styles.logTime}>{snap.date}</span></td>
                      <td style={styles.td}><span style={styles.moduleBadge}>{snap.dest}</span></td>
                      <td style={styles.td}>
                        <div style={{...styles.statusTag, color: '#0061FF'}}><CheckCircle2 size={14} /> {snap.status}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>{/* end paddingTop */}

      {/* MODALS */}
      <LogtaModal 
        isOpen={!!selectedApi} 
        onClose={() => setSelectedApi(null)} 
        title="Detalhes do Serviço" 
        size="md"
      >
         {selectedApi && (
            <div style={styles.modalBody}>
               <div style={styles.apiDetailHeader}>
                  <div style={styles.apiIconBoxLarge}><Layers size={32} /></div>
                  <div>
                     <h3 style={styles.apiDetailTitle}>{selectedApi.name || 'Micro-serviço Core'}</h3>
                     <div style={styles.apiDetailCategory}>{selectedApi.category}</div>
                  </div>
               </div>
               
               <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                     <div style={styles.detailLabel}>Status</div>
                     <div style={styles.detailVal}><div style={styles.statusDot} /> Ativo</div>
                  </div>
                  <div style={styles.detailItem}>
                     <div style={styles.detailLabel}>Latência Média</div>
                     <div style={styles.detailVal}>{selectedApi.latency || '24ms'}</div>
                  </div>
               </div>

               <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>Descrição do Recurso</div>
                  <p style={styles.detailPara}>{selectedApi.description}</p>
               </div>

               <div style={styles.modalActions}>
                  <Button variant="secondary" label="Fechar" onClick={() => setSelectedApi(null)} />
                  <Button 
                    variant="primary" 
                    icon={<RefreshCw size={14} />} 
                    label="Forçar Auditoria" 
                    onClick={() => handleReAudit(selectedApi.name)} 
                  />
               </div>
            </div>
         )}
      </LogtaModal>

      <LogtaModal 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
        title="Detalhes da Auditoria" 
        size="md"
      >
         {selectedLog && (
            <div style={styles.modalBody}>
               <div style={styles.fGrid}>
                  <div style={styles.fGroup}>
                     <label style={styles.label}>Recurso Acessado</label>
                     <div style={{ fontWeight: '800', color: 'var(--accent)' }}>{selectedLog.resource}</div>
                  </div>
                  <div style={styles.fGroup}>
                     <label style={styles.label}>IP de Origem</label>
                     <div style={{ fontWeight: '800', fontFamily: 'monospace', color: '#0F172A' }}>{selectedLog.ip_address || '---'}</div>
                  </div>
               </div>
               <div style={styles.fGroup}>
                  <label style={styles.label}>Metadados do Evento</label>
                  <pre style={styles.codeBlockDark}>{JSON.stringify(selectedLog.metadata || selectedLog.details, null, 2)}</pre>
               </div>
               <Button variant="primary" fullWidth label="FECHAR DETALHES" onClick={() => setSelectedLog(null)} />
            </div>
         )}
      </LogtaModal>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { 
    padding: '0', 
    maxWidth: '1600px', 
    margin: '0 auto',
    width: '100%',
    backgroundColor: 'transparent' 
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' },
  headerTitleGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  title: { fontSize: '29px', fontWeight: '800', color: '#000000', margin: 0, letterSpacing: 0 },
  subtitle: { ...HUB_PAGE_SUBTITLE },
  headerActions: { display: 'flex', gap: '16px', alignItems: 'center' },
  statusBadgeGlobal: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F0FDFA', color: '#0D9488', padding: '10px 20px', borderRadius: '14px', fontSize: '11px', fontWeight: '800', border: '1px solid #CCFBF1' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0061FF', boxShadow: '0 0 8px #0061FF' },

  tabNav: { display: 'flex', gap: '40px', marginBottom: '48px', borderBottom: '1px solid var(--border)', paddingBottom: '0' },
  tabBtn: { border: 'none', background: 'none', padding: '16px 4px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '-1px', outline: 'none' },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
    marginBottom: '48px',
  },
  healthSection: { display: 'flex', flexDirection: 'column', gap: '32px' },
  sectionHeaderInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  sectionTitle: { fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0 },
  aiStatusBadge: { padding: '8px 16px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)', borderRadius: '20px', fontSize: '11px', fontWeight: '800' },
  
  healthGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' },
  serviceCard: { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.04)', cursor: 'pointer', transition: 'all 0.2s ease' },
  svcHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  svcIcon: { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' },
  svcStatus: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#0061FF' },
  svcName: { fontSize: '15px', fontWeight: '800', color: '#1E293B', marginBottom: '16px', margin: 0 },
  svcMetrics: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' },
  svcMetric: { display: 'flex', flexDirection: 'column', gap: '4px' },
  metricLabel: { fontSize: '10px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
  metricValue: { fontSize: '14px', fontWeight: '800' },

  securitySection: { display: 'flex', flexDirection: 'column', gap: '32px' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '8px' },
  metricCard: { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.04)', transition: 'all 0.2s ease' },
  metricIconBox: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  metricInfo: { flex: 1 },
  metricLabel: { fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' },
  metricValue: { fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0 },

  overviewGrid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' },
  mainContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', backgroundColor: '#FFF', borderRadius: '24px 24px 0 0', border: '1px solid var(--border)', borderBottom: 'none' },
  searchBoxMini: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F8FAFC', padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', width: '280px' },
  searchInpMini: { border: 'none', background: 'none', fontSize: '13px', fontWeight: '600', color: '#1E293B', outline: 'none', width: '100%' },
  
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#F8FAFC' },
  th: { textAlign: 'left', padding: '16px 32px', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border)' },
  tr: { transition: 'background-color 0.2s' },
  td: { padding: '20px 32px', fontSize: '14px', borderBottom: '1px solid #F1F5F9', color: '#334155' },
  logTableContainer: { backgroundColor: '#FFF', borderRadius: '0 0 24px 24px', border: '1px solid var(--border)', overflow: 'hidden' },
  logAction: { fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', fontSize: '12px' },
  logIp: { fontFamily: 'monospace', color: 'var(--accent)', fontWeight: '700' },
  logDetails: { fontSize: '11px', color: '#64748B', backgroundColor: '#F8FAFC', padding: '4px 8px', borderRadius: '6px' },
  logTime: { fontSize: '13px', color: '#94A3B8', fontWeight: '600' },
  rowBtn: { width: '40px', height: '40px', borderRadius: '10px', border: 'none', backgroundColor: '#F1F5F9', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },

  sidebar: { display: 'flex', flexDirection: 'column', gap: '32px' },
  sidebarSection: { backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.04)', transition: 'all 0.2s ease' },
  sidebarTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '24px' },
  threatMapMini: { height: '200px', backgroundColor: '#0F172A', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  liveTag: { position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '800', color: '#0061FF', backgroundColor: 'rgba(0, 97, 255, 0.1)', padding: '6px 12px', borderRadius: '20px' },
  liveDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0061FF', boxShadow: '0 0 8px #0061FF' },
  ipItem: { padding: '16px', backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },

  fullCard: { backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.04)' },
  statusTag: { display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '11px' },
  moduleBadge: { padding: '4px 8px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
  
  autonomousGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  autonomousCard: {
    backgroundColor: '#FFFFFF',
    padding: '24px',
    borderRadius: '24px',
    border: '1px solid #F1F5F9',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.2s ease',
    minWidth: 0,
  },
  autonomousIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    flexShrink: 0,
  },
  autonomousInfo: { flex: 1, minWidth: 0, overflow: 'hidden' },
  autonomousName: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.25,
  },
  autonomousDesc: {
    fontSize: '13px',
    color: '#64748B',
    margin: '4px 0 0 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  autonomousAction: { flexShrink: 0 },
  statusBadgeActive: { padding: '8px 16px', backgroundColor: '#EFF6FF', color: '#1E3A8A', borderRadius: '20px', fontSize: '11px', fontWeight: '800', border: '1px solid #DBEAFE' },
  masterCommandBtn: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: '#FFF', border: '1px solid var(--border)', borderRadius: '20px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' },
  masterCommandLabel: { fontSize: '14px', fontWeight: '800', color: '#0F172A' },
  masterCommandSub: { fontSize: '12px', color: '#64748B', marginTop: '2px' },

  codeBlockSnapshot: { padding: '6px 12px', backgroundColor: '#F5F3FF', color: 'var(--accent)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', border: '1px solid #DDD6FE' },
  
  modalBody: { padding: '32px' },
  apiDetailHeader: { display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' },
  apiIconBoxLarge: { width: '64px', height: '64px', borderRadius: '20px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' },
  apiDetailTitle: { fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0 },
  apiDetailCategory: { fontSize: '14px', color: '#64748B', fontWeight: '600' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' },
  detailItem: { padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' },
  detailLabel: { fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' },
  detailVal: { fontSize: '16px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' },
  detailBlock: { marginBottom: '24px' },
  detailPara: { fontSize: '14px', color: '#64748B', lineHeight: '1.6', fontWeight: '500' },
  modalActions: { display: 'flex', gap: '16px', marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #F1F5F9' },
  
  fGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' },
  fGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' },
  codeBlockDark: { padding: '20px', backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: '20px', fontFamily: 'monospace', fontSize: '13px', display: 'block', overflowX: 'auto', marginBottom: '24px' },

  secSubTabNav: { display: 'flex', gap: '12px', margin: '16px 0 32px 0' },
  secSubTabBtn: { padding: '10px 18px', border: '1px solid #E2E8F0', borderRadius: '14px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px', outline: 'none' },
  twoColumnGrid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' },
  mainCardSecurity: { backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.04)' },
  cardHeaderPlain: { padding: '24px 32px', borderBottom: '1px solid var(--border)' },
  secCardTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  secCardSub: { fontSize: '13px', color: '#64748B', fontWeight: '500', marginTop: '4px' },
  tokenItemCard: { padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' },
  tokenCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tokenSpecs: { display: 'flex', gap: '20px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', marginTop: '12px' },
  specLabel: { fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  specVal: { fontSize: '12px', color: '#0F172A', fontWeight: '800' },
  sidebarCardSecurity: { backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.04)', transition: 'all 0.2s ease' },
  ipItemLocal: { padding: '16px', backgroundColor: '#EFF6FF', borderRadius: '16px', border: '1px solid #DBEAFE' },
  hmacBadgeWrapper: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' },
  hmacBadge: { padding: '6px 12px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px', fontWeight: '700' },
  secureBanner: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', padding: '12px', borderRadius: '14px', marginTop: '16px' },
  proxyMapBox: { display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0' },
  proxyNode: { padding: '12px 16px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  corsItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px' },
  logFolderItem: { padding: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }
};

export default InfrastructureManagement;
