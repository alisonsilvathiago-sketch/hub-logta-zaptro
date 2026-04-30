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
  HardDrive
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabaseZaptro as supabase } from '@core/lib/supabase-zaptro';
import LogtaModal from '@shared/components/Modal';
import Button from '@shared/components/Button';

const InfrastructureManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'saude');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState<any>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [securityStats, setSecurityStats] = useState<any>({});
  const [integrations, setIntegrations] = useState<any[]>([]);
  const navigate = useNavigate();

  // Sincronizar tab com URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
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
    { name: 'Navegador Logístico', description: 'Otimização de rotas e custos.', icon: <Zap size={24} />, color: '#6366F1' },
    { name: 'Guardião de Entregas', description: 'Segurança e prevenção de falhas.', icon: <ShieldCheck size={24} />, color: '#10B981' },
    { name: 'Talent Scout AI', description: 'Gestão inteligente de talentos.', icon: <Search size={24} />, color: '#F59E0B' },
    { name: 'Auditor Operacional', description: 'Auditoria fiscal e operacional.', icon: <Terminal size={24} />, color: '#EF4444' },
  ];

  useEffect(() => {
    fetchData();
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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'ATIVO':
      case 'OPERANTE': return '#10B981';
      case 'PENDING':
      case 'MAINTENANCE': return '#F59E0B';
      default: return '#EF4444';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'zaptro': return <MessageSquare size={20} />;
      case 'logta': return <Zap size={20} />;
      case 'ai': return <Cpu size={20} />;
      case 'backup': return <HardDrive size={20} />;
      default: return <Layers size={20} />;
    }
  };

  const activeServices = integrations.length > 0 ? integrations.map(i => ({
    name: i.provider.toUpperCase(),
    status: i.status || 'OFFLINE',
    latency: `${Math.floor(Math.random() * 100) + 20}ms`,
    load: `${Math.floor(Math.random() * 20) + 5}%`,
    icon: getProviderIcon(i.provider),
    details: { category: 'Serviço Master', description: `Gerenciamento centralizado para ${i.provider}.` }
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
            <div style={{ ...styles.statusDot, backgroundColor: '#10B981' }} />
            SISTEMA OPERANTE
          </div>
          <Button 
            variant="secondary" 
            icon={<RefreshCw size={18} />} 
            onClick={() => fetchData()} 
          />
        </div>
      </header>

      {/* HORIZONTAL TABS */}
      <nav style={styles.tabNav}>
        {[
          { id: 'saude', label: 'Saúde', icon: <Activity size={18} /> },
          { id: 'apis', label: 'APIs', icon: <Layers size={18} /> },
          { id: 'seguranca', label: 'Segurança', icon: <ShieldCheck size={18} /> },
          { id: 'logs', label: 'Logs', icon: <Terminal size={18} /> },
          { id: 'comandos', label: 'Comandos', icon: <Zap size={18} /> },
          { id: 'backup', label: 'Backup', icon: <HardDrive size={18} /> },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              ...styles.tabBtn,
              borderBottom: activeTab === tab.id ? '3px solid var(--accent)' : '3px solid transparent',
              color: activeTab === tab.id ? 'var(--accent)' : '#64748B',
              opacity: activeTab === tab.id ? 1 : 0.7
            }}
          >
            {tab.icon} {tab.label.toUpperCase()}
          </button>
        ))}
      </nav>

      <div style={styles.statsGrid}>
        {[
          { label: 'Processamento Global', value: '14.2 %', icon: <Cpu size={24} />, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' },
          { label: 'Disponibilidade (Uptime)', value: '99.9 %', icon: <Wifi size={24} />, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
          { label: 'Banco de Dados', value: '24.5 GB', icon: <Database size={24} />, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
          { label: 'Eventos Críticos', value: '0', icon: <ShieldAlert size={24} />, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
        ].map((stat, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{...styles.statIconBox, backgroundColor: stat.bg, color: stat.color}}>
              {stat.icon}
            </div>
            <div>
              <p style={styles.statLabel}>{stat.label}</p>
              <h3 style={styles.statValue}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'saude' && (
        <div style={styles.healthSection}>
          <div style={styles.sectionHeaderInner}>
            <h3 style={styles.sectionTitle}>Módulos & Micro-serviços Ativos</h3>
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
                  <div style={styles.svcStatus}>
                    <div style={{ ...styles.statusDot, backgroundColor: getStatusColor(svc.status) }} />
                    <span>{svc.status.toUpperCase()}</span>
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
                        { path: '/v1/comunicacao/zaptro', method: 'GET', version: 'v2.1.0', status: 'STABLE' },
                        { path: '/v1/financeiro/audit', method: 'POST', version: 'v1.1.5', status: 'MAINTENANCE' },
                        { path: '/v1/auth/session', method: 'GET', version: 'v3.0.1', status: 'CRITICAL' },
                      ].map((api, i) => (
                        <tr key={i} style={styles.tr}>
                           <td style={styles.td}><code style={{...styles.logIp, fontSize: '13px'}}>{api.path}</code></td>
                           <td style={styles.td}><span style={{...styles.logAction, color: api.method === 'POST' ? '#6366F1' : '#10B981'}}>{api.method}</span></td>
                           <td style={styles.td}><span style={styles.moduleBadge}>{api.version}</span></td>
                           <td style={styles.td}>
                              <div style={{...styles.statusTag, color: api.status === 'CRITICAL' ? '#EF4444' : api.status === 'MAINTENANCE' ? '#F59E0B' : '#10B981'}}>
                                 <div style={{...styles.statusDot, backgroundColor: api.status === 'CRITICAL' ? '#EF4444' : api.status === 'MAINTENANCE' ? '#F59E0B' : '#10B981'}} />
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
                 { label: 'Status Firewall', value: 'NORMAL', icon: <Activity size={20} />, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
               ].map((m, i) => (
                 <div key={i} style={styles.metricCard}>
                   <div style={{...styles.metricIconBox, backgroundColor: m.bg, color: m.color}}>{m.icon}</div>
                   <div style={styles.metricInfo}>
                     <p style={styles.metricLabel}>{m.label}</p>
                     <h3 style={{...styles.metricValue, color: m.label === 'Status Firewall' ? '#10B981' : '#0F172A'}}>{m.value}</h3>
                   </div>
                 </div>
               ))}
            </div>

            <div style={styles.overviewGrid}>
               <div style={styles.mainContent}>
                  <div style={styles.cardHeader}>
                     <h3 style={styles.sectionTitle}>Trilha de Auditoria Master</h3>
                     <div style={styles.searchBoxMini}>
                        <Search size={14} color="#94A3B8" />
                        <input 
                           type="text" 
                           placeholder="Buscar log..." 
                           style={styles.searchInpMini} 
                           value={searchTerm}
                           onChange={e => setSearchTerm(e.target.value)}
                        />
                     </div>
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
                           {auditLogs.filter(l => l.action?.toLowerCase().includes(searchTerm.toLowerCase()) || l.actor_email?.toLowerCase().includes(searchTerm.toLowerCase())).map(log => (
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
               <div style={styles.sidebar}>
                  <div style={styles.sidebarSection}>
                    <h3 style={styles.sidebarTitle}>Mapa de Riscos</h3>
                    <div style={styles.threatMapMini}>
                       <Globe size={48} color="rgba(255,255,255,0.15)" />
                       <div style={styles.liveTag}><div style={styles.liveDot} /> LIVE INTEL</div>
                    </div>
                  </div>
                  
                  <div style={styles.sidebarSection}>
                    <h3 style={styles.sidebarTitle}>IPs Autorizados</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                       {whitelist.map(ip => (
                          <div key={ip.id} style={styles.ipItem}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <code style={{ fontWeight: '800', fontFamily: 'monospace', fontSize: '13px', color: 'var(--accent)' }}>{ip.ip_address}</code>
                                <div style={{...styles.statusDot, color: '#10B981'}} />
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
               </div>
            </div>
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
                          <div style={{...styles.statusTag, color: '#10B981'}}><CheckCircle2 size={14} /> SUCESSO</div>
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
                <Button 
                  variant="secondary" 
                  label="EXECUTAR" 
                  onClick={() => handleReAudit(svc.name)}
                />
              </div>
            ))}
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
              <button style={styles.masterCommandBtn} onClick={() => console.log('Sync Cloud')}>
                <Globe size={20} />
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
                        <div style={{...styles.statusTag, color: '#10B981'}}><CheckCircle2 size={14} /> {snap.status}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
    padding: '40px', 
    maxWidth: '1600px', 
    margin: '0 auto',
    width: '100%',
    backgroundColor: 'transparent' 
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' },
  headerTitleGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  title: { fontSize: '32px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-1px' },
  subtitle: { fontSize: '15px', color: '#64748B', fontWeight: '500', marginTop: '4px' },
  headerActions: { display: 'flex', gap: '16px', alignItems: 'center' },
  statusBadgeGlobal: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F0FDFA', color: '#0D9488', padding: '10px 20px', borderRadius: '14px', fontSize: '11px', fontWeight: '800', border: '1px solid #CCFBF1' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' },

  tabNav: { display: 'flex', gap: '40px', marginBottom: '48px', borderBottom: '1px solid var(--border)', paddingBottom: '0' },
  tabBtn: { border: 'none', background: 'none', padding: '16px 4px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '-1px', outline: 'none' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', marginBottom: '48px' },
  statCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px', minHeight: '120px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  statIconBox: { width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  statValue: { fontSize: '26px', fontWeight: '800', color: '#0F172A', margin: 0 },

  healthSection: { display: 'flex', flexDirection: 'column', gap: '32px' },
  sectionHeaderInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  sectionTitle: { fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0 },
  aiStatusBadge: { padding: '8px 16px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)', borderRadius: '20px', fontSize: '11px', fontWeight: '800' },
  
  healthGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' },
  serviceCard: { backgroundColor: '#FFF', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', cursor: 'pointer' },
  svcHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  svcIcon: { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' },
  svcStatus: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#10B981' },
  svcName: { fontSize: '15px', fontWeight: '800', color: '#1E293B', marginBottom: '16px', margin: 0 },
  svcMetrics: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' },
  svcMetric: { display: 'flex', flexDirection: 'column', gap: '4px' },
  metricLabel: { fontSize: '10px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
  metricValue: { fontSize: '14px', fontWeight: '800' },

  securitySection: { display: 'flex', flexDirection: 'column', gap: '32px' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '8px' },
  metricCard: { backgroundColor: '#FFF', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
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
  sidebarSection: { backgroundColor: '#FFF', padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  sidebarTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '24px' },
  threatMapMini: { height: '200px', backgroundColor: '#0F172A', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  liveTag: { position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '800', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px' },
  liveDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' },
  ipItem: { padding: '16px', backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },

  fullCard: { backgroundColor: '#FFF', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  statusTag: { display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '11px' },
  moduleBadge: { padding: '4px 8px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
  
  autonomousGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' },
  autonomousCard: { backgroundColor: '#FFF', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  autonomousIcon: { width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  autonomousInfo: { flex: 1 },
  autonomousName: { fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 },
  autonomousDesc: { fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' },
  statusBadgeActive: { padding: '8px 16px', backgroundColor: '#F0FDF4', color: '#166534', borderRadius: '20px', fontSize: '11px', fontWeight: '800', border: '1px solid #DCFCE7' },
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
  codeBlockDark: { padding: '20px', backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: '20px', fontFamily: 'monospace', fontSize: '13px', display: 'block', overflowX: 'auto', marginBottom: '24px' }
};

export default InfrastructureManagement;
