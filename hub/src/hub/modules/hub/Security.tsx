import React, { useState, useEffect } from 'react';
import { 
  History, Search, Filter, Download, 
  User, Building2, Zap, AlertCircle, 
  CheckCircle2, Info, Clock, ExternalLink, Shield,
  Activity, ArrowRight, Lock, Unlock, MapPin, Globe, Eye,
  RefreshCw, Terminal, ShieldAlert, ShieldCheck, Plus
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { useAuth } from '@core/context/AuthContext';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import LogtaModal from '@shared/components/Modal';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  actor_email: string;
  metadata: any;
  ip_address: string;
  created_at: string;
  profiles?: { full_name: string };
}

const SecurityCenter: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState<'OVERVIEW' | 'AUDIT' | 'WHITELIST'>('OVERVIEW');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [securityStats, setSecurityStats] = useState({ attempts: 0, blocks: 0, alerts: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Audit Logs
      const { data: logsData } = await supabase
        .from('audit_log')
        .select('*, profiles:actor_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Fetch Whitelist
      const { data: whiteData } = await supabase.from('ip_whitelist').select('*').order('created_at', { ascending: false });
      
      // Fetch Security Stats from security_logs
      const { data: secLogs } = await supabase.from('security_logs').select('success, created_at');
      const stats = {
        attempts: secLogs?.length || 0,
        blocks: secLogs?.filter(l => !l.success).length || 0,
        alerts: secLogs?.filter(l => !l.success && new Date(l.created_at) > new Date(Date.now() - 86400000)).length || 0
      };

      setLogs(logsData || []);
      setWhitelist(whiteData || []);
      setSecurityStats(stats);
    } catch (err: any) {
      console.error('Security Fetch Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.actor_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.resource?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container} className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <div style={styles.bread}>SEGURANÇA & CONFORMIDADE {profile?.role === 'MASTER_ADMIN' ? '&gt; MASTER HUB' : ''}</div>
          <h1 style={styles.title}>Security Command Center</h1>
          <p style={styles.subtitle}>Gestão de acessos, auditoria de trilhas e proteção proativa do ecossistema.</p>
        </div>
        <div style={styles.headerActions}>
           <div style={styles.tabSwitch}>
              <button 
                style={{...styles.tabBtn, ...(viewTab === 'OVERVIEW' ? styles.tabActive : {})}}
                onClick={() => setViewTab('OVERVIEW')}
              >
                <Activity size={14} /> Visão Geral
              </button>
              <button 
                style={{...styles.tabBtn, ...(viewTab === 'AUDIT' ? styles.tabActive : {})}}
                onClick={() => setViewTab('AUDIT')}
              >
                <History size={14} /> Auditoria
              </button>
              <button 
                style={{...styles.tabBtn, ...(viewTab === 'WHITELIST' ? styles.tabActive : {})}}
                onClick={() => setViewTab('WHITELIST')}
              >
                <ShieldCheck size={14} /> Whitelist
              </button>
           </div>
           <button style={styles.refreshBtn} onClick={fetchData} disabled={loading}>
             <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </header>

      {/* SECURITY METRICS */}
      <div style={styles.metricsGrid}>
         <div style={styles.metricCard}>
            <div style={{...styles.metricIconBox, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1'}}><Shield size={20} /></div>
            <div style={styles.metricInfo}>
               <p style={styles.metricLabel}>Total de Eventos / 24h</p>
               <h3 style={styles.metricValue}>{securityStats.attempts}</h3>
            </div>
         </div>
         <div style={styles.metricCard}>
            <div style={{...styles.metricIconBox, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}}><Lock size={20} /></div>
            <div style={styles.metricInfo}>
               <p style={styles.metricLabel}>Bloqueios Ativos</p>
               <h3 style={styles.metricValue}>{securityStats.blocks}</h3>
            </div>
         </div>
         <div style={styles.metricCard}>
            <div style={{...styles.metricIconBox, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B'}}><ShieldAlert size={20} /></div>
            <div style={styles.metricInfo}>
               <p style={styles.metricLabel}>Tentativas Suspeitas</p>
               <h3 style={styles.metricValue}>{securityStats.alerts}</h3>
            </div>
         </div>
         <div style={styles.metricCard}>
            <div style={{...styles.metricIconBox, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}><Unlock size={20} /></div>
            <div style={styles.metricInfo}>
               <p style={styles.metricLabel}>Status do Firewall</p>
               <h3 style={{...styles.metricValue, color: '#10b981'}}>ATIVO</h3>
            </div>
         </div>
      </div>

      {viewTab === 'OVERVIEW' && (
        <div style={styles.overviewGrid}>
           <div style={styles.mainContent}>
              <div style={styles.sectionHeader}>
                 <h3 style={styles.sectionTitle}>Análise de Risco Geográfico</h3>
                 <span style={styles.liveTag}><div style={styles.liveDot} /> Live Intel</span>
              </div>
              <div style={styles.threatMap}>
                 <div style={styles.mapPlaceholder}>
                    <Globe size={48} color="#e2e8f0" />
                    <p>Mapeamento global de ameaças em tempo real</p>
                    <div style={styles.mapPin}><MapPin size={16} /> IP Detectado: 187.12.XX.XX (BR)</div>
                 </div>
              </div>
           </div>
           <div style={styles.sidebar}>
              <div style={styles.sectionHeader}>
                 <h3 style={styles.sectionTitle}>Últimas Ações</h3>
              </div>
              <div style={styles.miniLogList}>
                 {logs.length > 0 ? logs.slice(0, 5).map(log => (
                    <div key={log.id} style={styles.miniLogItem}>
                       <div style={styles.miniLogIcon}><Shield size={14} /></div>
                       <div style={styles.miniLogData}>
                          <div style={styles.miniLogAction}>{log.action?.replace(/_/g, ' ')}</div>
                          <div style={styles.miniLogTime}>{new Date(log.created_at).toLocaleTimeString()}</div>
                       </div>
                    </div>
                 )) : (
                    <div style={styles.emptyStateMini}>Nenhum log recente.</div>
                 )}
              </div>
              <button style={styles.fullAuditBtn} onClick={() => setViewTab('AUDIT')}>Ver Auditoria Completa <ArrowRight size={14} /></button>
           </div>
        </div>
      )}

      {viewTab === 'AUDIT' && (
        <div style={styles.auditSection}>
           <div style={styles.filterRow}>
              <div style={styles.searchBox}>
                 <Search size={18} color="#94a3b8" />
                 <input 
                    type="text" 
                    placeholder="Filtrar por recurso, ação ou e-mail..." 
                    style={styles.searchInput} 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              <button style={styles.filterBtn}><Filter size={18} /> Filtro Avançado</button>
           </div>

           <div style={styles.tableCard}>
              <table style={styles.table}>
                 <thead>
                    <tr style={styles.thead}>
                       <th style={styles.th}>RECURSO / ORIGEM</th>
                       <th style={styles.th}>OPERADOR</th>
                       <th style={styles.th}>AÇÃO</th>
                       <th style={styles.th}>IP ADDRESS</th>
                       <th style={styles.th}>DATA / HORA</th>
                       <th style={{...styles.th, textAlign: 'right'}}>OPÇÕES</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filteredLogs.length > 0 ? filteredLogs.map(log => (
                       <tr key={log.id} style={styles.tr}>
                          <td style={styles.td}>
                             <div style={styles.resourceTag}>{log.resource}</div>
                          </td>
                          <td style={styles.td}>
                             <div style={styles.userCell}>
                                <div style={styles.userAvatar}>{log.profiles?.full_name?.[0] || log.actor_email?.[0] || 'S'}</div>
                                <div>
                                   <div style={styles.userName}>{log.profiles?.full_name || 'Sistema'}</div>
                                   <div style={styles.userEmail}>{log.actor_email}</div>
                                </div>
                             </div>
                          </td>
                          <td style={styles.td}>
                             <span style={styles.actionText}>{log.action?.replace(/_/g, ' ')}</span>
                          </td>
                          <td style={styles.td}>
                             <code style={styles.ipCode}>{log.ip_address}</code>
                          </td>
                          <td style={styles.td}>
                             <span style={styles.dateText}>{new Date(log.created_at).toLocaleString()}</span>
                          </td>
                          <td style={{...styles.td, textAlign: 'right'}}>
                             <button style={styles.iconBtn} onClick={() => setSelectedLog(log)}><Eye size={16} /></button>
                          </td>
                       </tr>
                    )) : (
                       <tr>
                          <td colSpan={6} style={{padding: '48px', textAlign: 'center', color: '#94a3b8'}}>Nenhum log de auditoria encontrado.</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {viewTab === 'WHITELIST' && (
        <div style={styles.whitelistSection}>
           <div style={styles.sectionHeader}>
              <div>
                 <h3 style={styles.sectionTitle}>IP Whitelist (Trusted Hosts)</h3>
                 <p style={styles.sectionSubtitle}>Endereços IP com bypass de rate limiting e acesso facilitado.</p>
              </div>
              <button style={styles.primaryBtn}><Plus size={16} /> Autorizar Novo IP</button>
           </div>
           
           <div style={styles.whitelistGrid}>
              {whitelist.length > 0 ? whitelist.map(ip => (
                 <div key={ip.id} style={styles.ipCard}>
                    <div style={styles.ipCardHeader}>
                       <Globe size={18} color="#6366F1" />
                       <div style={styles.ipStatus}><div style={styles.statusDot} /> {ip.status?.toUpperCase()}</div>
                    </div>
                    <div style={styles.ipValue}>{ip.ip_address}</div>
                    <div style={styles.ipDesc}>{ip.description || 'Acesso Administrativo'}</div>
                    <div style={styles.ipMeta}>Autorizado em: {new Date(ip.created_at).toLocaleDateString()}</div>
                    <div style={styles.ipActions}>
                       <button style={styles.ipDelBtn}>Revogar Acesso</button>
                    </div>
                 </div>
              )) : (
                 <div style={{gridColumn: 'span 4', padding: '48px', textAlign: 'center', backgroundColor: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', color: '#94a3b8'}}>
                    <ShieldCheck size={48} style={{marginBottom: '16px', opacity: 0.2}} />
                    <p>Nenhum IP autorizado na lista branca.</p>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* LOG DETAILS MODAL */}
      <LogtaModal 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
        title="Detalhes do Evento de Auditoria" 
        width="700px"
      >
         {selectedLog && (
            <div style={styles.modalBody}>
               <div style={styles.modalInfoGrid}>
                  <div style={styles.modalInfoItem}>
                     <label style={styles.modalLabel}>Recurso Acessado</label>
                     <div style={styles.modalValue}>{selectedLog.resource}</div>
                  </div>
                  <div style={styles.modalInfoItem}>
                     <label style={styles.modalLabel}>IP de Origem</label>
                     <div style={styles.modalValue}>{selectedLog.ip_address}</div>
                  </div>
               </div>
               <div style={styles.modalInfoItem}>
                  <label style={styles.modalLabel}>Payload de Metadados (JSON)</label>
                  <pre style={styles.codeBlock}>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
               </div>
               <div style={styles.modalFooter}>
                  <button style={styles.secondaryBtn} onClick={() => setSelectedLog(null)}>Fechar</button>
               </div>
            </div>
         )}
      </LogtaModal>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  bread: { fontSize: '10px', fontWeight: '800', color: '#6366F1', marginBottom: '4px', opacity: 0.7, letterSpacing: '1px' },
  title: { fontSize: '28px', fontWeight: '800', color: '#000000', margin: 0, letterSpacing: '-1px' },
  subtitle: { fontSize: '14px', color: '#64748b', marginTop: '4px' },
  headerActions: { display: 'flex', gap: '16px', alignItems: 'center' },
  tabSwitch: { display: 'flex', backgroundColor: '#ebebeb', padding: '4px', borderRadius: '24px', gap: '4px' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', border: 'none', padding: '10px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', color: '#64748b', cursor: 'pointer', backgroundColor: 'transparent', transition: 'all 0.2s' },
  tabActive: { backgroundColor: 'white', color: '#6366F1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  refreshBtn: { width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', color: '#64748b' },

  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' },
  metricCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center' },
  metricIconBox: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  metricInfo: { flex: 1 },
  metricLabel: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
  metricValue: { fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0 },

  overviewGrid: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' },
  mainContent: { backgroundColor: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', padding: '24px' },
  sidebar: { backgroundColor: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 },
  sectionSubtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  liveTag: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', color: '#10b981', backgroundColor: '#ecfdf5', padding: '6px 12px', borderRadius: '24px' },
  liveDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' },
  
  threatMap: { height: '300px', backgroundColor: '#f8fafc', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mapPlaceholder: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#94a3b8', fontWeight: '600' },
  mapPin: { backgroundColor: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', color: '#1e293b', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px' },

  miniLogList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  miniLogItem: { display: 'flex', gap: '12px', alignItems: 'center' },
  miniLogIcon: { width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  miniLogData: { flex: 1 },
  miniLogAction: { fontSize: '13px', fontWeight: '700', color: '#1e293b', textTransform: 'capitalize' },
  miniLogTime: { fontSize: '11px', color: '#94a3b8', fontWeight: '500' },
  emptyStateMini: { fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '20px 0' },
  fullAuditBtn: { marginTop: 'auto', padding: '12px', borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '13px', fontWeight: '700', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },

  auditSection: { display: 'flex', flexDirection: 'column', gap: '24px' },
  filterRow: { display: 'flex', gap: '16px' },
  searchBox: { flex: 1, display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '12px 20px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '600' },
  filterBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  
  tableCard: { backgroundColor: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f9fafb', textAlign: 'left' },
  th: { padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' },
  td: { padding: '16px 24px' },
  resourceTag: { padding: '4px 10px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '6px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' },
  userCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  userAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6366F1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' },
  userName: { fontSize: '14px', fontWeight: '700', color: '#1e293b' },
  userEmail: { fontSize: '12px', color: '#94a3b8', fontWeight: '500' },
  actionText: { fontSize: '13px', fontWeight: '600', color: '#1e293b', textTransform: 'capitalize' },
  ipCode: { fontSize: '12px', color: '#64748b', fontFamily: 'monospace', backgroundColor: '#f8fafc', padding: '4px 8px', borderRadius: '6px' },
  dateText: { fontSize: '13px', color: '#94a3b8', fontWeight: '500' },
  iconBtn: { padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#f8fafc', color: '#94a3b8', cursor: 'pointer' },

  whitelistSection: { display: 'flex', flexDirection: 'column', gap: '32px' },
  whitelistGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  ipCard: { backgroundColor: 'white', padding: '24px', borderRadius: '28px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' },
  ipCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  ipStatus: { fontSize: '10px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' },
  statusDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' },
  ipValue: { fontSize: '20px', fontWeight: '800', color: '#1e293b', fontFamily: 'monospace' },
  ipDesc: { fontSize: '13px', color: '#64748b', fontWeight: '600' },
  ipMeta: { fontSize: '11px', color: '#94a3b8', marginTop: '8px' },
  ipActions: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' },
  ipDelBtn: { border: 'none', backgroundColor: 'transparent', color: '#ef4444', fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: 0 },

  primaryBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '24px', fontWeight: '700', cursor: 'pointer' },
  secondaryBtn: { padding: '10px 20px', borderRadius: '24px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '14px', fontWeight: '700', color: '#1e293b', cursor: 'pointer' },
  
  modalBody: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' },
  modalInfoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  modalInfoItem: { display: 'flex', flexDirection: 'column', gap: '8px' },
  modalLabel: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  modalValue: { fontSize: '15px', fontWeight: '700', color: '#1e293b' },
  codeBlock: { backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', fontSize: '12px', color: '#475569', overflowX: 'auto', borderLeft: '4px solid #6366F1' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }
};

export default SecurityCenter;
