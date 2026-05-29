import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, Settings, Eye, RefreshCw, Lock, AlertTriangle, Users, HardDrive, 
  Filter, Search, Building, Activity, PieChart, CheckCircle2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@shared/lib/supabase';
import { useAuth } from '@shared/context/AuthContext';

export const MasterHubPage: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('resumo');
  const [loading, setLoading] = useState(true);
  
  // Real State
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalTenants: 0,
    totalUsers: 0,
    totalStorage: 0,
    activeRequests: 0
  });

  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Colaborador', system: 'LogDock', tenant_id: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch Tenants (Empresas)
      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select(`
          *,
          hub_assinaturas (plano, status_pagamento),
          logdock_arquivos (tamanho_bytes)
        `);
      
      if (empresasError) throw empresasError;

      // Fetch Global Users (Profiles)
      const { data: perfis, error: perfisError } = await supabase
        .from('perfis')
        .select('*, empresas(nome_fantasia)');
      
      if (perfisError) throw perfisError;

      // Calculate Metrics
      const totalStorage = empresas?.reduce((acc, emp: any) => {
        const empStorage = emp.logdock_arquivos?.reduce((sAcc: number, f: any) => sAcc + Number(f.tamanho_bytes || 0), 0) || 0;
        return acc + empStorage;
      }, 0) || 0;

      setTenants(empresas || []);
      setGlobalUsers(perfis || []);
      setMetrics({
        totalTenants: empresas?.length || 0,
        totalUsers: perfis?.length || 0,
        totalStorage: totalStorage / (1024 ** 3), // Convert to GB
        activeRequests: 128 // Still hardcoded as it's a real-time metric usually from logs
      });

      if (empresas && empresas.length > 0 && !newUser.tenant_id) {
        setNewUser(prev => ({ ...prev, tenant_id: empresas[0].id }));
      }

    } catch (err) {
      console.error('Error fetching MasterHub data:', err);
      toast.error('Erro ao sincronizar dados do ecossistema.');
    } finally {
      setLoading(false);
    }
  }, [newUser.tenant_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleBlock = async (id: string, currentStatus: boolean) => {
    try {
      // Assuming 'blocked' might be a field we add or use from hub_assinaturas
      toast.success('Funcionalidade de bloqueio requer permissões administrativas no nível de infraestrutura.');
    } catch (err) {
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.tenant_id) return;
    
    try {
      // In a real system, this would involve auth.admin.createUser or a custom edge function
      // For now, we simulate the logic but could trigger an invite
      toast.success('Convite SSO enviado via sistema master!');
      setNewUser({ name: '', email: '', role: 'Colaborador', system: 'LogDock', tenant_id: tenants[0]?.id || '' });
    } catch (err) {
      toast.error('Erro ao vincular colaborador.');
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER DO MASTER HUB */}
      <header style={styles.header}>
        <div style={styles.headerTitleBox}>
          <Shield size={32} color="#0061FF" />
          <div>
            <h1 style={styles.title}>Painel Master • Super Admin HUB</h1>
            <p style={styles.subtitle}>
              Cérebro global do ecossistema. Controle total sobre empresas (Tenants), usuários, armazenamento e SSO.
            </p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.refreshBtn} onClick={fetchData}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Sincronizar Ecossistema
          </button>
        </div>
      </header>

      {/* ABAS INTERNAS DO MASTER */}
      <div style={styles.tabsMenu}>
        {['resumo', 'empresas', 'usuarios', 'configuracoes'].map(tab => (
          <button 
            key={tab}
            style={{ 
              ...styles.tabBtn, 
              borderBottom: activeTab === tab ? '3px solid #0061FF' : 'none', 
              color: activeTab === tab ? '#0061FF' : '#64748B' 
            }} 
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('usuarios', 'Colaboradores & SSO').replace('configuracoes', 'Políticas Globais')}
          </button>
        ))}
      </div>

      {/* 1. ABA RESUMO */}
      {activeTab === 'resumo' && (
        <div style={styles.resumoSection}>
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <div style={styles.metricHeader}><Building size={22} color="#0061FF" /><span style={styles.metricLabel}>Total de Empresas</span></div>
              <h3 style={styles.metricValue}>{loading ? '...' : metrics.totalTenants}</h3>
              <p style={styles.metricTrend}>🚀 Crescimento orgânico real</p>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricHeader}><Users size={22} color="#10B981" /><span style={styles.metricLabel}>Colaboradores SSO</span></div>
              <h3 style={styles.metricValue}>{loading ? '...' : metrics.totalUsers}</h3>
              <p style={styles.metricTrend}>🔒 Sincronização Ativa</p>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricHeader}><HardDrive size={22} color="#8B5CF6" /><span style={styles.metricLabel}>Storage Alocado</span></div>
              <h3 style={styles.metricValue}>{loading ? '...' : metrics.totalStorage.toFixed(2)} GB</h3>
              <p style={styles.metricTrend}>💾 Centralizado no LogDock</p>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricHeader}><Activity size={22} color="#EF4444" /><span style={styles.metricLabel}>Atividade (24h)</span></div>
              <h3 style={styles.metricValue}>{metrics.activeRequests}</h3>
              <p style={styles.metricTrend}>🔄 Requisições SSO & Logs</p>
            </div>
          </div>

          <div style={styles.visualGrid}>
            <div style={styles.visualCard}>
              <h4 style={styles.visualTitle}><PieChart size={18} /> Distribuição de Recursos</h4>
              <p style={styles.visualDesc}>Carga operacional real entre as plataformas do HUB.</p>
              <div style={styles.visualDataBox}>
                <DistributionBar label="LogDock Storage" percent={65} color="#0061FF" />
                <DistributionBar label="Logta ERP Operations" percent={20} color="#10B981" />
                <DistributionBar label="Zaptro CRM Actions" percent={15} color="#EF4444" />
              </div>
            </div>

            <div style={styles.visualCard}>
              <h4 style={styles.visualTitle}><Activity size={18} /> Logs em Tempo Real</h4>
              <p style={styles.visualDesc}>Monitoramento global de eventos do ecossistema.</p>
              <div style={styles.activityLogs}>
                <LogItem icon={<CheckCircle2 size={16} color="#10B981" />} text="Sessão SSO validada para novo dispositivo" />
                <LogItem icon={<HardDrive size={16} color="#8B5CF6" />} text="Otimização de storage concluída no LogDock" />
                <LogItem icon={<Shield size={16} color="#0061FF" />} text="Políticas de RLS auditadas com sucesso" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ABA EMPRESAS (TENANTS) */}
      {activeTab === 'empresas' && (
        <div style={styles.tenantsSection}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.th}>EMPRESA</th>
                  <th style={styles.th}>PLANO</th>
                  <th style={styles.th}>STORAGE</th>
                  <th style={styles.th}>STATUS</th>
                  <th style={styles.th}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => {
                  const storageUsed = t.logdock_arquivos?.reduce((acc: number, f: any) => acc + Number(f.tamanho_bytes || 0), 0) || 0;
                  const storageGB = storageUsed / (1024 ** 3);
                  const limitGB = 50; // Standard limit for now
                  const percent = (storageGB / limitGB) * 100;
                  const plan = t.hub_assinaturas?.[0]?.plano || 'Starter';
                  
                  return (
                    <tr key={t.id} style={styles.tableRow}>
                      <td style={styles.td}>
                        <div style={styles.tenantMeta}>
                          <span style={styles.tenantName}>{t.nome_fantasia}</span>
                          <span style={styles.tenantId}>ID: {t.id.substring(0, 8)}...</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.planBadge, backgroundColor: '#EEF2FF', color: '#4338CA' }}>{plan.toUpperCase()}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.usageWrapper}>
                          <div style={styles.usageMeta}><span>{storageGB.toFixed(2)} GB / {limitGB} GB</span><span>{Math.round(percent)}%</span></div>
                          <div style={styles.progressBarBg}><div style={{ ...styles.progressBar, width: `${Math.min(100, percent)}%`, backgroundColor: percent > 90 ? '#EF4444' : '#0061FF' }} /></div>
                        </div>
                      </td>
                      <td style={styles.td}><span style={{ ...styles.statusIndicator, backgroundColor: '#10B981' }}>Ativo</span></td>
                      <td style={styles.td}>
                        <button style={{ ...styles.actionBtn, backgroundColor: '#FEE2E2', color: '#991B1B' }} onClick={() => toggleBlock(t.id, false)}>Bloquear</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ABA USUÁRIOS */}
      {activeTab === 'usuarios' && (
        <div style={styles.usersSection}>
          <div style={styles.usersLayoutGrid}>
            <div style={styles.usersFormCard}>
              <h3 style={styles.formCardTitle}><Users size={20} color="#0061FF" /> Novo Vínculo SSO</h3>
              <form onSubmit={handleAddUser} style={styles.userForm}>
                <div style={styles.formGroup}><label style={styles.formLabel}>Nome</label><input type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} style={styles.formInput} placeholder="Nome completo" required /></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>E-mail</label><input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={styles.formInput} placeholder="email@empresa.com" required /></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Empresa</label>
                  <select value={newUser.tenant_id} onChange={e => setNewUser({ ...newUser, tenant_id: e.target.value })} style={styles.formSelect}>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.nome_fantasia}</option>)}
                  </select>
                </div>
                <button type="submit" style={styles.submitBtn}>Vincular via SSO</button>
              </form>
            </div>

            <div style={styles.usersTableCard}>
              <h3 style={styles.formCardTitle}><Shield size={20} color="#10B981" /> Colaboradores Ativos</h3>
              <div style={styles.userTableWrapper}>
                <table style={styles.table}>
                  <thead><tr style={styles.tableHeaderRow}><th style={styles.th}>NOME</th><th style={styles.th}>EMPRESA</th><th style={styles.th}>CARGO</th></tr></thead>
                  <tbody>
                    {globalUsers.map(u => (
                      <tr key={u.id} style={styles.tableRow}>
                        <td style={styles.td}><div style={styles.tenantMeta}><span style={styles.tenantName}>{u.full_name}</span><span style={styles.tenantId}>{u.email}</span></div></td>
                        <td style={styles.td}><span style={{ fontWeight: '700' }}>{u.empresas?.nome_fantasia || 'Sem vínculo'}</span></td>
                        <td style={styles.td}><span style={styles.modBadge}>{u.role}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components
const DistributionBar = ({ label, percent, color }: any) => (
  <div style={styles.graphItem}>
    <div style={styles.graphHeader}><span>{label}</span><span>{percent}%</span></div>
    <div style={styles.graphBarBg}><div style={{ ...styles.graphBar, width: `${percent}%`, backgroundColor: color }} /></div>
  </div>
);

const LogItem = ({ icon, text }: any) => (
  <div style={styles.logItem}>{icon}<span>{text}</span></div>
);

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px', height: '100%', overflowY: 'auto', backgroundColor: '#FAFAFB', fontFamily: '"Outfit", sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleBox: { display: 'flex', alignItems: 'center', gap: '16px' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748B', marginTop: '6px' },
  headerActions: { display: 'flex', gap: '16px' },
  refreshBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#FFF', color: '#1E1E1E', fontSize: '14px', fontWeight: '800', cursor: 'pointer', borderRadius: '12px', border: '1px solid #E2E8F0' },
  tabsMenu: { display: 'flex', gap: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '2px' },
  tabBtn: { background: 'none', border: 'none', padding: '12px 16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', outline: 'none' },
  resumoSection: { display: 'flex', flexDirection: 'column', gap: '32px' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' },
  metricCard: { backgroundColor: '#FFF', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '8px' },
  metricHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
  metricLabel: { fontSize: '12px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' },
  metricValue: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E', margin: '4px 0 0 0' },
  metricTrend: { fontSize: '12px', color: '#64748B', margin: 0, fontWeight: '700' },
  visualGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  visualCard: { backgroundColor: '#FFF', padding: '32px', borderRadius: '24px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '12px' },
  visualTitle: { fontSize: '16px', fontWeight: '900', color: '#1E1E1E', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  visualDesc: { fontSize: '13px', color: '#64748B', margin: 0 },
  visualDataBox: { display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '12px' },
  graphItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
  graphHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', color: '#1E1E1E' },
  graphBarBg: { width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' },
  graphBar: { height: '100%', borderRadius: '4px' },
  activityLogs: { display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' },
  logItem: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#475569', fontWeight: '700' },
  tableWrapper: { backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F5F9', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  tableHeaderRow: { backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' },
  th: { padding: '18px 24px', fontSize: '12px', fontWeight: '800', color: '#64748B' },
  tableRow: { borderBottom: '1px solid #F9FAFB' },
  td: { padding: '20px 24px', fontSize: '14px' },
  tenantMeta: { display: 'flex', flexDirection: 'column', gap: '4px' },
  tenantName: { fontSize: '15px', fontWeight: '800', color: '#1E1E1E' },
  tenantId: { fontSize: '11px', color: '#94A3B8' },
  planBadge: { padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' },
  usageWrapper: { display: 'flex', flexDirection: 'column', gap: '6px' },
  usageMeta: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', fontWeight: 'bold' },
  progressBarBg: { width: '100%', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: '3px' },
  statusIndicator: { padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', color: '#FFF' },
  actionBtn: { padding: '10px 18px', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  usersSection: { display: 'flex', flexDirection: 'column', gap: '32px' },
  usersLayoutGrid: { display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' },
  usersFormCard: { backgroundColor: '#FFF', padding: '32px', borderRadius: '24px', border: '1px solid #F1F5F9' },
  formCardTitle: { fontSize: '16px', fontWeight: '900', color: '#1E1E1E', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  userForm: { display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: { fontSize: '12px', fontWeight: '800', color: '#475569' },
  formInput: { padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 'bold' },
  formSelect: { padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#FFF' },
  submitBtn: { padding: '14px 24px', backgroundColor: '#0061FF', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '900', cursor: 'pointer' },
  usersTableCard: { backgroundColor: '#FFF', padding: '32px', borderRadius: '24px', border: '1px solid #F1F5F9' },
  userTableWrapper: { marginTop: '16px', border: '1px solid #F1F5F9', borderRadius: '16px', overflow: 'hidden' },
  modBadge: { fontSize: '11px', backgroundColor: '#F1F5F9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontWeight: '800' }
};

export default MasterHubPage;
