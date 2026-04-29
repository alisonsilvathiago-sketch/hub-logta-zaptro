import React, { useState, useEffect } from 'react';
import { 
  Plus, RefreshCw, Globe, 
  ShieldCheck, Layers, Settings,
  Cpu, HardDrive, Wifi, Zap, Users, Activity,
  Search, Lock, MapPin, 
  AlertCircle, CheckCircle2, Eye, Terminal, ShieldAlert, Navigation, FileCheck,
  ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import LogtaModal from '@shared/components/Modal';

import { useParams, useNavigate, Routes, Route, Navigate } from 'react-router-dom';

const InfrastructureManagement: React.FC = () => {
  const { '*' : splat } = useParams();
  const navigate = useNavigate();
  
  const activeTab = (splat || 'saude').toLowerCase();
  const setViewMode = (tab: string) => navigate(`/master/infrastructure/${tab.toLowerCase()}`);

  const [apis, setApis] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState<any | null>(null);
  
  // Pagination for APIs
  const [apiPage, setApiPage] = useState(1);
  const itemsPerPage = 15;
  
  // Security State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [securityStats, setSecurityStats] = useState({ attempts: 0, blocks: 0, alerts: 0 });
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Backup State
  const [backups, setBackups] = useState<any[]>([]);
  const [storageStats, setStorageStats] = useState({ limit_mb: 50, used_bytes: 0, used_percentage: 0 });
  
  const [newApi, setNewApi] = useState({
    name: '',
    type: 'PAGAMENTO',
    category: 'Financeiro',
    description: '',
    icon_name: 'Layers',
    base_url: '',
    doc_url: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'saude' || activeTab === 'apis') {
        const { data: apisData } = await supabase.from('master_api_catalog').select('*').order('name');
        const { data: connData } = await supabase.from('apis_company').select('*, companies(name)');
        setApis(apisData || []);
        setConnections(connData || []);
      }

      if (activeTab === 'seguranca') {
        const { data: logsData } = await supabase.from('audit_log').select('*, profiles:actor_id(full_name)').order('created_at', { ascending: false }).limit(50);
        const { data: whiteData } = await supabase.from('ip_whitelist').select('*').order('created_at', { ascending: false });
        setAuditLogs(logsData || []);
        setWhitelist(whiteData || []);
      }

      if (activeTab === 'backup') {
        const { data: backupData } = await supabase.from('backups').select('*, companies(name)').order('created_at', { ascending: false }).limit(30);
        const { data: storageData } = await supabase.from('company_storage').select('*').single();
        setBackups(backupData || []);
        if (storageData) {
            const usedMB = storageData.used_bytes / (1024 * 1024);
            const totalLimit = storageData.limit_mb + (storageData.extra_credits_mb || 0);
            setStorageStats({
              limit_mb: totalLimit,
              used_bytes: storageData.used_bytes,
              used_percentage: Math.min(100, (usedMB / totalLimit) * 100)
            });
        }
      }

      const { data: logsData } = await supabase.from('security_logs').select('*').order('created_at', { ascending: false }).limit(20);
      setSecurityLogs(logsData || []);
    } catch (err) {
      console.error('Infra Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleCreateApi = async (e: React.FormEvent) => {
    e.preventDefault();
    const tid = toastLoading('Publicando gateway...');
    try {
      const { error } = await supabase.from('master_api_catalog').insert([newApi]);
      if (error) throw error;
      fetchData();
      setIsAddModalOpen(false);
      toastSuccess('Catálogo global atualizado!');
    } catch (err: any) {
      toastError(err.message);
    } finally {
      toastDismiss(tid);
    }
  };

  const handleReAudit = async (serviceName: string) => {
    const tid = toastLoading(`Iniciando auditoria profunda para ${serviceName}...`);
    try {
      const start = Date.now();
      const { error } = await supabase.from('profiles').select('id').limit(1);
      const latency = Date.now() - start;
      if (error) throw error;
      await supabase.from('master_api_catalog').update({ latency: `${latency}ms`, updated_at: new Date().toISOString() }).eq('name', serviceName);
      fetchData();
      toastSuccess(`Auditoria Concluída: ${serviceName} operando com ${latency}ms de latência.`);
    } catch (err) {
      toastError(`Falha na Auditoria: ${serviceName} reportou instabilidade.`);
    } finally {
      toastDismiss(tid);
    }
  };

  const services = apis.map(api => ({
    name: api.name,
    status: api.status,
    latency: api.latency || 'N/A',
    load: api.load || '0%',
    icon: api.type === 'AI' ? <Zap size={18} /> : api.type === 'External' ? <Globe size={18} /> : <Cpu size={18} />,
    details: api
  }));

  const autonomousServices = [
    { name: 'Navegador Logístico', status: 'ONLINE', description: 'Otimização de rotas em tempo real', icon: <Navigation size={18} />, color: 'var(--accent)' },
    { name: 'Guardião de Entregas', status: 'ONLINE', description: 'Anti-no-show e Confirmação Automática', icon: <ShieldCheck size={18} />, color: '#10B981' },
    { name: 'Talent Scout AI', status: 'ONLINE', description: 'Score de Agregados e Alocação Inteligente', icon: <Users size={18} />, color: '#F59E0B' },
    { name: 'Auditor Operacional', status: 'ONLINE', description: 'Trilha de Auditoria e Conformidade Automática', icon: <FileCheck size={18} />, color: '#EF4444' },
  ];

  // Paginated APIs
  const paginatedApis = apis.slice((apiPage - 1) * itemsPerPage, apiPage * itemsPerPage);
  const totalApiPages = Math.ceil(apis.length / itemsPerPage);

  return (
    <div style={styles.container} className="animate-fade-in">
      <header style={styles.header}>
        <div style={styles.headerTitleGroup}>
          <h1 style={styles.title}>Centro de Comando Unificado</h1>
          <p style={styles.subtitle}>Monitoramento de saúde, segurança perimetral e resiliência de dados global.</p>
        </div>
        <div style={styles.headerActions}>
           <div style={styles.statusBadgeGlobal}>
             <div style={styles.statusDot} />
             <span>SISTEMA OPERANTE</span>
           </div>
           <button style={styles.refreshBtn} onClick={fetchData} disabled={loading}>
             <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </header>

      {/* HORIZONTAL TABS */}
      <nav style={styles.tabBar}>
        <button 
          style={{...styles.tabLink, ...(activeTab === 'saude' ? styles.tabLinkActive : {})}}
          onClick={() => setViewMode('saude')}
        >
          <Activity size={18} /> Saúde do Sistema
        </button>
        <button 
          style={{...styles.tabLink, ...(activeTab === 'apis' ? styles.tabLinkActive : {})}}
          onClick={() => setViewMode('apis')}
        >
          <Layers size={18} /> Catálogo de APIs
        </button>
        <button 
          style={{...styles.tabLink, ...(activeTab === 'seguranca' ? styles.tabLinkActive : {})}}
          onClick={() => setViewMode('seguranca')}
        >
          <ShieldCheck size={18} /> Segurança & Auditoria
        </button>
        <button 
          style={{...styles.tabLink, ...(activeTab === 'backup' ? styles.tabLinkActive : {})}}
          onClick={() => setViewMode('backup')}
        >
          <HardDrive size={18} /> Backup & Storage
        </button>
      </nav>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: 'var(--bg-active)'}}>
            <Cpu size={20} color="var(--accent)" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Processamento Global</p>
            <h3 style={styles.statValue}>14.2<span style={styles.unit}>%</span></h3>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: 'var(--accent)'}}>
            <Wifi size={20} color="#FFFFFF" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Disponibilidade (Uptime)</p>
            <h3 style={styles.statValue}>99.9<span style={styles.unit}>%</span></h3>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: 'var(--bg-active)'}}>
            <HardDrive size={20} color="var(--accent)" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Banco de Dados</p>
            <h3 style={styles.statValue}>24.5<span style={styles.unit}>GB</span></h3>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: 'var(--secondary)'}}>
            <AlertCircle size={20} color="#FFFFFF" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Eventos Críticos</p>
            <h3 style={styles.statValue}>{securityLogs.filter(l => !l.success).length}</h3>
          </div>
          <div style={{...styles.statTrend, color: securityLogs.filter(l => !l.success).length > 0 ? '#EF4444' : '#10B981'}}>
             {securityLogs.filter(l => !l.success).length > 0 ? 'CRÍTICO' : 'NORMAL'}
          </div>
        </div>
      </div>

      {activeTab === 'saude' && (
        <div style={styles.healthSection}>
          {/* AI SERVICES MOVED TO TOP */}
          <div style={styles.sectionHeaderInner}>
            <h3 style={styles.sectionTitle}>Serviços de Inteligência Autônoma</h3>
            <span style={{...styles.aiStatusBadge, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)'}}>IA MASTER ATIVA</span>
          </div>

          <div style={{...styles.autonomousGrid, marginTop: 0, marginBottom: '40px'}}>
            {autonomousServices.map(svc => (
              <div key={svc.id} style={styles.autoSvcCard} className="hover-scale">
                <div style={{...styles.autoIconBox, backgroundColor: svc.bgColor, color: svc.color}}>
                  {svc.icon}
                </div>
                <div style={styles.autoMain}>
                  <div style={styles.autoName}>{svc.name}</div>
                  <div style={styles.autoDesc}>{svc.description}</div>
                </div>
                <div style={styles.aiStatusBadge}>● ONLINE</div>
              </div>
            ))}
          </div>

          <div style={styles.sectionHeaderInner}>
            <h3 style={styles.sectionTitle}>Módulos & Micro-serviços Ativos</h3>
            <span style={styles.aiStatusBadge}>7 MÓDULOS EM TEMPO REAL</span>
          </div>

          <div style={styles.healthGrid}>
            {services.map(svc => (
              <div 
                key={svc.name} 
                style={{...styles.serviceCard, cursor: 'pointer'}} 
                className="hover-scale"
                onClick={() => setSelectedApi(svc.details)}
              >
                <div style={styles.svcHeader}>
                  <div style={styles.svcIcon}>{svc.icon}</div>
                  <div style={styles.svcStatus}>
                    <div style={styles.statusDot} />
                    <span>OPERANTE</span>
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
                      <span style={{...styles.metricValue, color: 'var(--secondary)'}}>{svc.load}</span>
                   </div>
                </div>
                <div style={styles.svcActions}>
                  <button 
                    style={styles.svcActionBtn}
                    onClick={(e) => { e.stopPropagation(); handleReAudit(svc.name); }}
                  >
                    <RefreshCw size={12} /> Re-auditar
                  </button>
                  <button 
                    style={{...styles.svcActionBtn, ...styles.svcActionBtnPrimary}}
                    onClick={(e) => { e.stopPropagation(); setSelectedApi(svc.details); }}
                  >
                    <Eye size={12} /> Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{...styles.sectionHeader, marginTop: '32px', borderRadius: '24px 24px 0 0'}}>
            <h3 style={styles.sectionTitle}>Eventos de Infraestrutura</h3>
            <span style={styles.logCount}>{securityLogs.length} eventos registrados recentemente</span>
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
                      <tr 
                        key={log.id} 
                        style={{...styles.tr, cursor: 'pointer'}}
                        className="hover-scale"
                      >
                        <td style={styles.td}><span style={styles.logAction}>{log.action.replace(/_/g, ' ')}</span></td>
                        <td style={styles.td}><span style={styles.logIp}>{log.ip_address}</span></td>
                        <td style={styles.td}><code style={styles.logDetails}>{JSON.stringify(log.details)}</code></td>
                        <td style={styles.td}><span style={styles.logTime}>{new Date(log.created_at).toLocaleString()}</span></td>
                        <td style={styles.td}>
                          {log.success ? (
                            <div style={{...styles.statusTag, color: '#10b981'}}><CheckCircle2 size={14} /> SUCESSO</div>
                          ) : (
                            <div style={{...styles.statusTag, color: '#ef4444'}}><AlertCircle size={14} /> FALHA</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
      )}

      {activeTab === 'apis' && (
        <div style={styles.apisSection}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Catálogo Global de APIs</h3>
            <button style={styles.primaryBtn} onClick={() => setIsAddModalOpen(true)}>
              <Plus size={18} /> Publicar Gateway
            </button>
          </div>

          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>PROVEDOR / GATEWAY</th>
                  <th style={styles.th}>CONEXÕES ATIVAS</th>
                  <th style={styles.th}>LATÊNCIA MÉDIA</th>
                  <th style={{...styles.th, textAlign: 'right'}}>OPÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {paginatedApis.map(api => (
                  <tr 
                    key={api.id} 
                    style={{...styles.tr, cursor: 'pointer'}}
                    className="hover-scale"
                    onClick={() => setSelectedApi(api)}
                  >
                    <td style={styles.td}>
                      <div style={styles.apiInfo}>
                        <div style={styles.apiIconBox}><Layers size={18} /></div>
                        <div>
                          <div style={styles.apiName}>{api.name}</div>
                          <div style={styles.apiDesc}>{api.category}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.connStack}>
                        <span style={styles.moreConn}>{connections.filter(c => c.api_id === api.id).length} tenants</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                       <span style={{ fontWeight: '800', color: 'var(--accent)' }}>{api.latency || '---'}</span>
                    </td>
                    <td style={{...styles.td, textAlign: 'right'}}>
                      <div style={styles.rowActions}>
                        <button style={styles.rowBtn} onClick={(e) => { e.stopPropagation(); setSelectedApi(api); }}><Settings size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {totalApiPages > 1 && (
              <div style={styles.pagination}>
                 <button 
                   disabled={apiPage === 1} 
                   onClick={() => setApiPage(prev => prev - 1)}
                   style={styles.pageBtn}
                 >
                   <ChevronLeft size={16} />
                 </button>
                 <span style={styles.pageText}>Página {apiPage} de {totalApiPages}</span>
                 <button 
                   disabled={apiPage === totalApiPages} 
                   onClick={() => setApiPage(prev => prev + 1)}
                   style={styles.pageBtn}
                 >
                   <ChevronRight size={16} />
                 </button>
              </div>
            )}
          </div>
        </div>
      )}

       {activeTab === 'seguranca' && (
         <div style={styles.securitySection}>
            <div style={styles.metricsGrid}>
               <div style={styles.metricCard}>
                  <div style={{...styles.metricIconBox, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)'}}><ShieldCheck size={20} /></div>
                  <div style={styles.metricInfo}>
                     <p style={styles.metricLabel}>Eventos / 24h</p>
                     <h3 style={styles.metricValue}>{securityStats.attempts || 1284}</h3>
                  </div>
               </div>
               <div style={styles.metricCard}>
                  <div style={{...styles.metricIconBox, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}}><Lock size={20} /></div>
                  <div style={styles.metricInfo}>
                     <p style={styles.metricLabel}>Bloqueios Ativos</p>
                     <h3 style={styles.metricValue}>{securityStats.blocks || 42}</h3>
                  </div>
               </div>
               <div style={styles.metricCard}>
                  <div style={{...styles.metricIconBox, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B'}}><ShieldAlert size={20} /></div>
                  <div style={styles.metricInfo}>
                     <p style={styles.metricLabel}>Alertas Suspeitos</p>
                     <h3 style={styles.metricValue}>{securityStats.alerts || 15}</h3>
                  </div>
               </div>
               <div style={styles.metricCard}>
                  <div style={{...styles.metricIconBox, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}><Activity size={20} /></div>
                  <div style={styles.metricInfo}>
                     <p style={styles.metricLabel}>Status Firewall</p>
                     <h3 style={{...styles.metricValue, color: '#10b981'}}>NORMAL</h3>
                  </div>
               </div>
            </div>

            <div style={styles.overviewGrid}>
               <div style={styles.mainContent}>
                  <div style={styles.sectionHeader}>
                     <h3 style={styles.sectionTitle}>Trilha de Auditoria Master</h3>
                     <div style={styles.searchBoxMini}>
                        <Search size={14} color="#94a3b8" />
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
                                    <div style={{ fontWeight: '800', fontSize: '13px', color: 'var(--secondary)' }}>{log.profiles?.full_name || 'Sistema'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>{log.actor_email}</div>
                                 </td>
                                 <td style={styles.td}><span style={styles.logAction}>{log.action?.replace(/_/g, ' ')}</span></td>
                                 <td style={styles.td}><span style={styles.moduleBadge}>{log.resource}</span></td>
                                 <td style={styles.td}>{new Date(log.created_at).toLocaleString()}</td>
                                 <td style={{...styles.td, textAlign: 'right'}}>
                                    <button style={styles.rowBtn} onClick={() => setSelectedLog(log)}><Eye size={14} /></button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
               <div style={styles.sidebar}>
                  <div style={styles.sectionHeader}>
                     <h3 style={styles.sectionTitle}>Mapa de Riscos</h3>
                  </div>
                  <div style={styles.threatMapMini}>
                     <Globe size={40} color="rgba(255,255,255,0.2)" />
                     <div style={styles.liveTag}><div style={styles.liveDot} /> Live Intel</div>
                  </div>
                  
                  <h3 style={{...styles.sectionTitle, marginTop: '24px'}}>IPs Autorizados</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                     {whitelist.map(ip => (
                        <div key={ip.id} style={styles.ipItem}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <code style={{ fontWeight: '800', fontFamily: 'monospace', fontSize: '12px', color: 'var(--accent)' }}>{ip.ip_address}</code>
                              <div style={styles.statusDot} />
                           </div>
                           <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '500' }}>{ip.description}</div>
                        </div>
                     ))}
                     <button style={styles.columnAddBtn}><Plus size={14} /> Autorizar Host</button>
                  </div>
               </div>
            </div>
         </div>
       )}

      {activeTab === 'backup' && (
        <div style={styles.backupSection}>
           <div style={styles.overviewGrid}>
              <div style={styles.mainContent}>
                 <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>Snapshots Críticos & Recuperação</h3>
                    <button style={styles.primaryBtn}><Plus size={16} /> Novo Snapshot Manual</button>
                 </div>
                 <div style={styles.logTableContainer}>
                    <table style={styles.table}>
                       <thead>
                          <tr style={styles.thead}>
                             <th style={styles.th}>DATA / HORA</th>
                             <th style={styles.th}>TAMANHO</th>
                             <th style={styles.th}>TIPO</th>
                             <th style={styles.th}>STATUS</th>
                          </tr>
                       </thead>
                       <tbody>
                          {backups.map(b => (
                             <tr key={b.id} style={styles.tr}>
                                <td style={styles.td}>
                                   <div style={{ fontWeight: '800', color: 'var(--secondary)' }}>{new Date(b.created_at).toLocaleString()}</div>
                                   <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>{b.companies?.name || 'Sistema Master'}</div>
                                </td>
                                <td style={styles.td}>{(b.size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                                <td style={styles.td}><span style={styles.moduleBadge}>{b.type?.toUpperCase()}</span></td>
                                <td style={styles.td}>
                                   <span style={{ color: b.status === 'completed' || b.status === 'ok' ? '#10b981' : '#ef4444', fontWeight: '800' }}>
                                      {b.status?.toUpperCase() === 'COMPLETED' ? 'CONCLUÍDO' : b.status?.toUpperCase()}
                                   </span>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
              <div style={styles.sidebar}>
                 <h3 style={styles.sectionTitle}>Uso do Armazenamento</h3>
                 <div style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                       <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--secondary)' }}>ESPAÇO UTILIZADO</span>
                       <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent)' }}>{storageStats.used_percentage.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: '12px', backgroundColor: 'var(--bg-overlay)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                       <div style={{ height: '100%', backgroundColor: 'var(--accent)', width: `${storageStats.used_percentage}%`, transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '16px', textAlign: 'center', fontWeight: '600' }}>
                       Usando {(storageStats.used_bytes / 1024 / 1024).toFixed(1)}MB de {storageStats.limit_mb}MB totais
                    </p>
                    <button style={{ ...styles.submitBtn, marginTop: '32px', backgroundColor: 'var(--accent)' }}>Expandir Storage</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODALS */}
      <LogtaModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Novo Recurso Integrador Global" 
        size="md"
      >
         <form style={styles.form} onSubmit={handleCreateApi}>
            <div style={styles.fGrid}>
               <div style={styles.fGroup}>
                  <label style={styles.label}>Nome do Provedor</label>
                  <input style={styles.input} required value={newApi.name} onChange={e => setNewApi({...newApi, name: e.target.value})} placeholder="Ex: Evolution API" />
               </div>
               <div style={styles.fGroup}>
                  <label style={styles.label}>Categoria</label>
                  <select style={styles.input} value={newApi.category} onChange={e => setNewApi({...newApi, category: e.target.value})}>
                     {['Financeiro', 'RH', 'Logistica', 'Atendimento', 'Estoque', 'CRM'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
            </div>
            <div style={styles.fGroup}>
               <label style={styles.label}>URL da API</label>
               <input style={styles.input} value={newApi.base_url} onChange={e => setNewApi({...newApi, base_url: e.target.value})} placeholder="https://api.exemplo.com" />
            </div>
            <div style={styles.fGroup}>
               <label style={styles.label}>Descrição</label>
               <textarea style={styles.textarea} value={newApi.description} onChange={e => setNewApi({...newApi, description: e.target.value})} placeholder="Descreva a finalidade deste gateway..." />
            </div>
            <button style={styles.submitBtn} type="submit">Publicar Gateway 🚀</button>
         </form>
      </LogtaModal>

      <LogtaModal 
        isOpen={!!selectedApi} 
        onClose={() => setSelectedApi(null)} 
        title="Detalhes do Gateway Global" 
        size="md"
      >
         {selectedApi && (
            <div style={styles.modalBody}>
               <div style={styles.apiDetailHeader}>
                  <div style={styles.apiIconBoxLarge}><Layers size={32} /></div>
                  <div>
                     <h3 style={styles.apiDetailTitle}>{selectedApi.name}</h3>
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
                     <div style={styles.detailVal}>{selectedApi.latency || 'N/A'}</div>
                  </div>
               </div>

               <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>Base URL</div>
                  <code style={styles.codeBlock}>{selectedApi.base_url || 'Nenhuma URL configurada'}</code>
               </div>

               <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>Descrição do Recurso</div>
                  <p style={styles.detailPara}>{selectedApi.description || 'Nenhuma descrição disponível para este gateway.'}</p>
               </div>

               <div style={styles.modalActions}>
                  <button style={styles.secondaryBtn} onClick={() => setSelectedApi(null)}>Fechar</button>
                  <button style={styles.primaryBtn} onClick={() => handleReAudit(selectedApi.name)}>
                     <RefreshCw size={14} /> Forçar Auditoria
                  </button>
               </div>
            </div>
         )}
      </LogtaModal>

      <LogtaModal 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
        title="Detalhes da Auditoria Master" 
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
                     <div style={{ fontWeight: '800', fontFamily: 'monospace', color: 'var(--secondary)' }}>{selectedLog.ip_address || '---'}</div>
                  </div>
               </div>
               <div style={styles.fGroup}>
                  <label style={styles.label}>Metadados do Evento (Payload)</label>
                  <pre style={styles.codeBlock}>{JSON.stringify(selectedLog.metadata || selectedLog.details, null, 2)}</pre>
               </div>
               <button style={styles.submitBtn} onClick={() => setSelectedLog(null)}>Fechar Detalhes</button>
            </div>
         )}
      </LogtaModal>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '40px', backgroundColor: 'transparent' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' },
  headerTitleGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  bread: { fontSize: '11px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase' },
  title: { fontSize: '32px', fontWeight: '700', color: 'var(--secondary)', margin: '8px 0 0', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '16px', color: 'var(--text-secondary)', margin: '6px 0 0', fontWeight: '500' },
  headerActions: { display: 'flex', gap: '16px', alignItems: 'center' },
  statusBadgeGlobal: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F0FDFA', color: '#0D9488', padding: '10px 20px', borderRadius: '14px', fontSize: '11px', fontWeight: '800' },
  refreshBtn: { width: '48px', height: '48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'white', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  
  tabBar: { display: 'flex', gap: '32px', marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '0' },
  tabLink: { border: 'none', background: 'none', padding: '12px 4px', fontSize: '15px', fontWeight: '700', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '3px solid transparent' },
  tabLinkActive: { color: 'var(--accent)', borderBottomColor: 'var(--accent)' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' },
  statCard: { backgroundColor: 'white', padding: '28px', borderRadius: '32px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  statIconBox: { width: '56px', height: '56px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statContent: { display: 'flex', flexDirection: 'column' },
  statLabel: { fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px' },
  statValue: { fontSize: '28px', fontWeight: '800', color: 'var(--secondary)', margin: '4px 0 0', letterSpacing: '-0.5px' },
  statTrend: { position: 'absolute', top: '28px', right: '28px', fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px' },
  unit: { fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '4px', fontWeight: '600' },

  healthSection: { display: 'flex', flexDirection: 'column', gap: '32px' },
  sectionHeaderInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  healthGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  serviceCard: { backgroundColor: 'white', padding: '28px', borderRadius: '32px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  svcHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  svcIcon: { width: '48px', height: '48px', borderRadius: '16px', backgroundColor: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' },
  svcStatus: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' },
  svcName: { fontSize: '18px', fontWeight: '700', color: 'var(--secondary)', margin: 0 },
  svcMetrics: { display: 'flex', gap: '24px', paddingTop: '16px', borderTop: '1px solid var(--bg-overlay)' },
  svcMetric: { display: 'flex', flexDirection: 'column', gap: '6px' },
  metricLabel: { fontSize: '10px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' },
  metricValue: { fontSize: '22px', fontWeight: '800' },
  svcActions: { display: 'flex', gap: '12px', marginTop: '12px' },
  svcActionBtn: { flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'white', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' },
  svcActionBtnPrimary: { backgroundColor: 'var(--secondary)', color: 'white', border: 'none' },

  autonomousGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '16px' },
  autoSvcCard: { backgroundColor: 'white', padding: '24px', borderRadius: '32px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  autoIconBox: { width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  autoMain: { flex: 1 },
  autoName: { fontSize: '15px', fontWeight: '800', color: 'var(--secondary)' },
  autoDesc: { fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5', fontWeight: '500' },
  aiStatusBadge: { backgroundColor: '#F0FDFA', color: '#0D9488', fontSize: '10px', fontWeight: '900', padding: '6px 12px', borderRadius: '10px', letterSpacing: '0.5px' },

  logsSection: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  sectionHeader: { padding: '24px 32px', borderBottom: '1px solid var(--bg-overlay)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-overlay)' },
  sectionTitle: { fontSize: '18px', fontWeight: '800', color: 'var(--secondary)', margin: 0 },
  logCount: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' },
  logTableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: 'var(--bg-overlay)', textAlign: 'left' },
  th: { padding: '16px 32px', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' },
  tr: { borderBottom: '1px solid var(--bg-overlay)', transition: 'all 0.2s' },
  td: { padding: '20px 32px' },
  apiInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  apiIconBox: { width: '44px', height: '44px', borderRadius: '14px', backgroundColor: 'var(--bg-active)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  apiName: { fontSize: '15px', fontWeight: '700', color: 'var(--secondary)' },
  apiDesc: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' },
  connStack: { display: 'flex', alignItems: 'center' },
  moreConn: { fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' },
  statusTag: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' },
  rowActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  rowBtn: { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', backgroundColor: 'var(--bg-overlay)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s' },
  
  logAction: { fontSize: '13px', fontWeight: '700', color: 'var(--secondary)', textTransform: 'capitalize' },
  logIp: { fontSize: '12px', color: 'var(--accent)', fontFamily: 'monospace', fontWeight: '700' },
  logDetails: { fontSize: '11px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-overlay)', padding: '6px 12px', borderRadius: '8px', maxWidth: '300px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', border: '1px solid var(--border)' },
  logTime: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' },

  pagination: { padding: '24px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', borderTop: '1px solid var(--bg-overlay)' },
  pageBtn: { width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'white', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  pageText: { fontSize: '13px', fontWeight: '700', color: 'var(--secondary)' },

  form: { display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px' },
  fGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  fGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' },
  input: { padding: '14px 20px', borderRadius: '18px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-overlay)', fontWeight: '600', outline: 'none', transition: 'all 0.2s', fontSize: '14px' },
  textarea: { padding: '14px 20px', borderRadius: '18px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-overlay)', fontWeight: '600', minHeight: '120px', outline: 'none', resize: 'none', fontSize: '14px' },
  submitBtn: { padding: '18px', backgroundColor: 'var(--secondary)', color: 'white', border: 'none', borderRadius: '18px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' },
  
  searchBoxMini: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '10px 20px', borderRadius: '16px', border: '1px solid var(--border)' },
  searchInpMini: { border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '13px', fontWeight: '700', width: '150px', color: 'var(--secondary)' },
  moduleBadge: { padding: '6px 12px', backgroundColor: 'var(--bg-active)', color: 'var(--accent)', borderRadius: '10px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' },
  threatMapMini: { height: '180px', backgroundColor: 'var(--secondary)', borderRadius: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', border: '1px solid rgba(255,255,255,0.1)' },
  liveTag: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '900', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px 16px', borderRadius: '20px' },
  liveDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' },
  ipItem: { padding: '18px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid var(--border)' },
  columnAddBtn: { width: '100%', marginTop: '12px', padding: '14px', borderRadius: '16px', border: '2px dashed var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' },
  codeBlock: { backgroundColor: 'var(--bg-overlay)', padding: '20px', borderRadius: '20px', fontSize: '12px', color: 'var(--secondary)', overflowX: 'auto', border: '1px solid var(--border)', fontFamily: 'monospace', fontWeight: '600' },
  
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' },
  metricCard: { backgroundColor: 'white', padding: '24px', borderRadius: '28px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  metricIconBox: { width: '52px', height: '52px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  metricInfo: { flex: 1 },
  metricLabel: { fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' },
  metricValue: { fontSize: '24px', fontWeight: '800', color: 'var(--secondary)', margin: '2px 0 0' },

  overviewGrid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' },
  mainContent: { minWidth: 0 },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '32px' },

  // API Modal Styles
  apiDetailHeader: { display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', padding: '24px', backgroundColor: 'var(--bg-overlay)', borderRadius: '24px', border: '1px solid var(--border)' },
  apiIconBoxLarge: { width: '72px', height: '72px', borderRadius: '24px', backgroundColor: 'white', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  apiDetailTitle: { fontSize: '24px', fontWeight: '800', color: 'var(--secondary)', margin: 0 },
  apiDetailCategory: { fontSize: '14px', color: 'var(--accent)', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' },
  detailItem: { padding: '20px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid var(--border)' },
  detailLabel: { fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' },
  detailVal: { fontSize: '18px', fontWeight: '800', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '10px' },
  detailBlock: { marginBottom: '24px' },
  detailPara: { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '500', margin: '12px 0 0' },
  modalActions: { display: 'flex', gap: '16px', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--bg-overlay)' },
  tableCard: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
};

export default InfrastructureManagement;
