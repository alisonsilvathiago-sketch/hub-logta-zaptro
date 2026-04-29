import React, { useState, useEffect } from 'react';
import { 
  Plus, RefreshCw, MessageSquare, CreditCard, Globe, 
  Mail, ShieldCheck, Layers, Settings, ArrowUpRight,
  Activity, Server, AlertCircle, CheckCircle2, Terminal,
  Cpu, HardDrive, Wifi
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import LogtaModal from '@shared/components/Modal';

const InfrastructureManagement: React.FC = () => {
  const [apis, setApis] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'APIS' | 'HEALTH'>('HEALTH');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
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
      const { data: apisData } = await supabase.from('apis_master').select('*').order('name');
      const { data: connData } = await supabase.from('apis_company').select('*, companies(name)');
      const { data: logsData } = await supabase.from('security_logs').select('*').order('created_at', { ascending: false }).limit(20);
      
      setApis(apisData || []);
      setConnections(connData || []);
      setSecurityLogs(logsData || []);
    } catch (err) {
      console.error('API Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateApi = async (e: React.FormEvent) => {
    e.preventDefault();
    const tid = toastLoading('Publicando gateway...');
    try {
      const { error } = await supabase.from('apis_master').insert([newApi]);
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

  const services = [
    { name: 'Core API (Edge)', status: 'operational', latency: '124ms', load: '12%', icon: <Activity size={18} /> },
    { name: 'Supabase DB', status: 'operational', latency: '45ms', load: '8%', icon: <Server size={18} /> },
    { name: 'Asaas Gateway', status: 'operational', latency: '210ms', load: '5%', icon: <CreditCard size={18} /> },
    { name: 'Evolution API', status: 'operational', latency: '340ms', load: '22%', icon: <MessageSquare size={18} /> },
    { name: 'Mail Service', status: 'operational', latency: '88ms', load: '2%', icon: <Mail size={18} /> },
    { name: 'Zaptro CDN', status: 'operational', latency: '12ms', load: '1%', icon: <Globe size={18} /> },
  ];

  return (
    <div style={styles.container} className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Infrastructure & Monitoring</h1>
          <p style={styles.subtitle}>Gestão de recursos globais e monitoramento de saúde do ecossistema.</p>
        </div>
        <div style={styles.headerActions}>
           <div style={styles.tabSwitch}>
              <button 
                style={{...styles.tabBtn, ...(viewMode === 'HEALTH' ? styles.tabActive : {})}}
                onClick={() => setViewMode('HEALTH')}
              >
                <Activity size={14} /> Health Check
              </button>
              <button 
                style={{...styles.tabBtn, ...(viewMode === 'APIS' ? styles.tabActive : {})}}
                onClick={() => setViewMode('APIS')}
              >
                <Layers size={14} /> Catálogo de APIs
              </button>
           </div>
           <button style={styles.refreshBtn} onClick={fetchData} disabled={loading}>
             <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </header>

      <div style={styles.metricsGrid}>
         <div style={styles.metricCard}>
            <div style={{...styles.metricIconBox, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1'}}><Cpu size={20} /></div>
            <div style={styles.metricInfo}>
               <p style={styles.metricLabel}>Processamento Médio</p>
               <h3 style={styles.metricValue}>14.2%</h3>
            </div>
         </div>
         <div style={styles.metricCard}>
            <div style={{...styles.metricIconBox, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}><Wifi size={20} /></div>
            <div style={styles.metricInfo}>
               <p style={styles.metricLabel}>Uptime Global</p>
               <h3 style={styles.metricValue}>99.99%</h3>
            </div>
         </div>
         <div style={styles.metricCard}>
            <div style={{...styles.metricIconBox, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B'}}><HardDrive size={20} /></div>
            <div style={styles.metricInfo}>
               <p style={styles.metricLabel}>Armazenamento</p>
               <h3 style={styles.metricValue}>24.5 GB</h3>
            </div>
         </div>
         <div style={styles.metricCard}>
            <div style={{...styles.metricIconBox, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}}><AlertCircle size={20} /></div>
            <div style={styles.metricInfo}>
               <p style={styles.metricLabel}>Alertas Críticos</p>
               <h3 style={styles.metricValue}>{securityLogs.filter(l => !l.success).length}</h3>
            </div>
         </div>
      </div>

      {viewMode === 'HEALTH' ? (
        <div style={styles.healthSection}>
          <div style={styles.healthGrid}>
            {services.map(svc => (
              <div key={svc.name} style={styles.serviceCard}>
                <div style={styles.svcHeader}>
                  <div style={styles.svcIcon}>{svc.icon}</div>
                  <div style={styles.svcStatus}>
                    <div style={styles.statusDot} />
                    <span>OPERATIONAL</span>
                  </div>
                </div>
                <h4 style={styles.svcName}>{svc.name}</h4>
                <div style={styles.svcMetrics}>
                   <div style={styles.svcMetric}>
                      <span style={styles.svcMetricLabel}>Latência</span>
                      <span style={styles.svcMetricValue}>{svc.latency}</span>
                   </div>
                   <div style={styles.svcMetric}>
                      <span style={styles.svcMetricLabel}>Carga</span>
                      <span style={styles.svcMetricValue}>{svc.load}</span>
                   </div>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.logsSection}>
             <div style={styles.sectionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Terminal size={20} color="#1e293b" />
                  <h3 style={styles.sectionTitle}>Infrastructure Event Logs</h3>
                </div>
                <span style={styles.logCount}>{securityLogs.length} eventos recentes</span>
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
                        <td style={styles.td}>
                          <span style={styles.logAction}>{log.action.replace(/_/g, ' ')}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.logIp}>{log.ip_address}</span>
                        </td>
                        <td style={styles.td}>
                          <code style={styles.logDetails}>{JSON.stringify(log.details)}</code>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.logTime}>{new Date(log.created_at).toLocaleString()}</span>
                        </td>
                        <td style={styles.td}>
                          {log.success ? (
                            <div style={{...styles.statusTag, color: '#10b981'}}><CheckCircle2 size={14} /> SUCCESS</div>
                          ) : (
                            <div style={{...styles.statusTag, color: '#ef4444'}}><AlertCircle size={14} /> FAILED</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      ) : (
        <div style={styles.apisSection}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Global API Catalog</h3>
            <button style={styles.primaryBtn} onClick={() => setIsAddModalOpen(true)}>
              <Plus size={18} /> Publicar Nova API
            </button>
          </div>

          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>PROVEDOR / GATEWAY</th>
                  <th style={styles.th}>CONEXÕES ATIVAS</th>
                  <th style={styles.th}>ENDEREÇO BASE</th>
                  <th style={{...styles.th, textAlign: 'right'}}>OPÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {apis.map(api => (
                  <tr key={api.id} style={styles.tr}>
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
                        {connections.filter(c => c.api_id === api.id).slice(0, 3).map((c, i) => (
                          <div key={i} style={styles.miniAvatar} title={c.companies?.name}>
                            {c.companies?.name?.[0]}
                          </div>
                        ))}
                        <span style={styles.moreConn}>+{connections.filter(c => c.api_id === api.id).length} tenants</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.urlCell}>
                        <code style={{fontSize: '12px'}}>{api.base_url || 'https://api.internal/v1'}</code>
                      </div>
                    </td>
                    <td style={{...styles.td, textAlign: 'right'}}>
                      <div style={styles.rowActions}>
                        <button style={styles.rowBtn}><Settings size={16} /></button>
                        <button style={styles.rowBtn}><ArrowUpRight size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <LogtaModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Novo Recurso Integrador Global" 
        width="600px"
      >
         <form style={styles.form} onSubmit={handleCreateApi}>
            <div style={styles.fGrid}>
               <div style={styles.fGroup}>
                  <label style={styles.label}>Nome do Provedor</label>
                  <input style={styles.input} required value={newApi.name} onChange={e => setNewApi({...newApi, name: e.target.value})} />
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
               <input style={styles.input} value={newApi.base_url} onChange={e => setNewApi({...newApi, base_url: e.target.value})} />
            </div>
            <div style={styles.fGroup}>
               <label style={styles.label}>Descrição</label>
               <textarea style={styles.textarea} value={newApi.description} onChange={e => setNewApi({...newApi, description: e.target.value})} />
            </div>
            <button style={styles.submitBtn} type="submit">Publicar Gateway 🚀</button>
         </form>
      </LogtaModal>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '500', color: '#000000', margin: 0, letterSpacing: '0.4px' },
  subtitle: { fontSize: '16px', color: '#64748b', margin: 0, fontWeight: '400', letterSpacing: '0.2px' },
  headerActions: { display: 'flex', gap: '16px', alignItems: 'center' },
  tabSwitch: { display: 'flex', backgroundColor: '#ebebeb', padding: '4px', borderRadius: '24px', gap: '4px' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: '#64748B', fontSize: '13px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.4px' },
  tabActive: { backgroundColor: 'white', color: '#6366F1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontWeight: '500' },
  refreshBtn: { width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', color: '#64748b' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '24px', fontWeight: '600', cursor: 'pointer' },
  
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' },
  metricCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center' },
  metricIconBox: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  metricInfo: { flex: 1 },
  metricLabel: { fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  metricValue: { fontSize: '24px', fontWeight: '500', color: '#1e293b', margin: 0, letterSpacing: '0.4px' },

  healthSection: { display: 'flex', flexDirection: 'column', gap: '32px' },
  healthGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  serviceCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' },
  svcHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  svcIcon: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' },
  svcStatus: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '600', color: '#10b981', letterSpacing: '0.5px', textTransform: 'uppercase' },
  statusDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' },
  svcName: { fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0, letterSpacing: '0.3px' },
  svcMetrics: { display: 'flex', gap: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' },
  svcMetric: { display: 'flex', flexDirection: 'column', gap: '4px' },
  svcMetricLabel: { fontSize: '10px', color: '#94a3b8', fontWeight: '500', letterSpacing: '0.3px', textTransform: 'uppercase' },
  svcMetricValue: { fontSize: '13px', fontWeight: '600', color: '#1e293b', letterSpacing: '0.2px' },

  logsSection: { backgroundColor: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  sectionHeader: { padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0, letterSpacing: '0.3px' },
  logCount: { fontSize: '12px', color: '#94a3b8', fontWeight: '500', letterSpacing: '0.2px' },
  logTableContainer: { overflowX: 'auto' },
  
  tableSection: { backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableHeader: { padding: '24px', borderBottom: '1px solid #e8e8e8' },
  tableTitle: { fontSize: '16px', fontWeight: '600', margin: 0, letterSpacing: '0.3px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f9fafb', textAlign: 'left' },
  th: { padding: '16px 24px', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px 24px' },
  apiInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  apiIconBox: { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  apiName: { fontSize: '14px', fontWeight: '600', letterSpacing: '0.2px' },
  apiDesc: { fontSize: '12px', color: '#94a3b8', fontWeight: '400' },
  connStack: { display: 'flex', alignItems: 'center' },
  miniAvatar: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: '#6366F1', marginLeft: '-8px' },
  moreConn: { fontSize: '11px', fontWeight: '500', color: '#94a3b8', marginLeft: '8px', letterSpacing: '0.2px' },
  urlCell: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', width: 'fit-content' },
  statusTag: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' },
  rowActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  rowBtn: { padding: '8px', border: 'none', backgroundColor: '#f8fafc', borderRadius: '8px', cursor: 'pointer', color: '#64748b' },
  
  logAction: { fontSize: '13px', fontWeight: '600', color: '#1e293b', textTransform: 'capitalize', letterSpacing: '0.2px' },
  logIp: { fontSize: '12px', color: '#64748b', fontFamily: 'monospace' },
  logDetails: { fontSize: '11px', color: '#94a3b8', backgroundColor: '#f8fafc', padding: '4px 8px', borderRadius: '4px', maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' },
  logTime: { fontSize: '12px', color: '#94a3b8', fontWeight: '500' },

  form: { padding: '10px', display: 'flex', flexDirection: 'column', gap: '20px' },
  fGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  fGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' },
  input: { padding: '12px', borderRadius: '24px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: '500', outline: 'none', letterSpacing: '0.2px' },
  textarea: { padding: '12px', borderRadius: '24px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: '500', minHeight: '100px', outline: 'none', resize: 'none', letterSpacing: '0.2px' },
  submitBtn: { padding: '16px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '22px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.4px', textTransform: 'uppercase' }
};

export default InfrastructureManagement;
