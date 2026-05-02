import React, { useState } from 'react';
import { 
  Shield, Settings, Eye, RefreshCw, Lock, AlertTriangle, Users, HardDrive, 
  Filter, Search, Building, Activity, PieChart, CheckCircle2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const MasterHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('resumo');
  
  // Base State for Users & Collaborators across systems
  const [globalUsers, setGlobalUsers] = useState([
    { id: 'u-1', name: 'Alison Thiago', email: 'alison@teste.com', role: 'Super Admin', systemAccess: ['LogDock', 'Logta', 'Zaptro'], tenantLinked: 'Rapidão Cometa Ltda' },
    { id: 'u-2', name: 'Juliana Mendes', email: 'juliana@logistica.com', role: 'Colaborador', systemAccess: ['LogDock', 'Logta'], tenantLinked: 'Rapidão Cometa Ltda' },
    { id: 'u-3', name: 'Marcos Silva', email: 'marcos@zaptro.com', role: 'Operador', systemAccess: ['Zaptro'], tenantLinked: 'Logística Total S/A' }
  ]);

  const [tenants, setTenants] = useState([
    { id: 't-1', name: 'Rapidão Cometa Ltda', plan: 'Elite', usage: 78, limit: 250, accessTime: '24h/7', blocked: false, modules: ['frota', 'arquivos', 'torre'] },
    { id: 't-2', name: 'Logística Total S/A', plan: 'Pro', usage: 12, limit: 100, accessTime: '24h/7', blocked: false, modules: ['frota', 'arquivos'] },
    { id: 't-3', name: 'Expresso Brasil', plan: 'Geral', usage: 22, limit: 50, accessTime: 'Seg-Sex 8-18h', blocked: true, modules: ['arquivos'] }
  ]);

  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Colaborador', system: 'LogDock', tenant: 'Rapidão Cometa Ltda' });

  const toggleBlock = (id: string) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, blocked: !t.blocked } : t));
    toast.success('Status do tenant atualizado no HUB Master.');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    const added = {
      id: `u-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      systemAccess: [newUser.system],
      tenantLinked: newUser.tenant
    };
    setGlobalUsers(prev => [...prev, added]);
    setNewUser({ name: '', email: '', role: 'Colaborador', system: 'LogDock', tenant: 'Rapidão Cometa Ltda' });
    toast.success('Novo colaborador vinculado via SSO!');
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
              Cérebro global do ecossistema. Controle total sobre empresas (Tenants), usuários, armazenamento e SSO (Single Sign-On).
            </p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.refreshBtn} onClick={() => { window.location.reload(); }}>
            <RefreshCw size={18} /> Sincronizar Ecossistema
          </button>
        </div>
      </header>

      {/* ABAS INTERNAS DO MASTER */}
      <div style={styles.tabsMenu}>
        <button style={{ ...styles.tabBtn, borderBottom: activeTab === 'resumo' ? '3px solid #0061FF' : 'none', color: activeTab === 'resumo' ? '#0061FF' : '#64748B' }} onClick={() => setActiveTab('resumo')}>
          Visão Geral
        </button>
        <button style={{ ...styles.tabBtn, borderBottom: activeTab === 'empresas' ? '3px solid #0061FF' : 'none', color: activeTab === 'empresas' ? '#0061FF' : '#64748B' }} onClick={() => setActiveTab('empresas')}>
          Empresas (Tenants)
        </button>
        <button style={{ ...styles.tabBtn, borderBottom: activeTab === 'usuarios' ? '3px solid #0061FF' : 'none', color: activeTab === 'usuarios' ? '#0061FF' : '#64748B' }} onClick={() => setActiveTab('usuarios')}>
          Colaboradores & SSO
        </button>
        <button style={{ ...styles.tabBtn, borderBottom: activeTab === 'configuracoes' ? '3px solid #0061FF' : 'none', color: activeTab === 'configuracoes' ? '#0061FF' : '#64748B' }} onClick={() => setActiveTab('configuracoes')}>
          Políticas Globais
        </button>
      </div>

      {/* 1. ABA RESUMO (MÉTRICAS & GRÁFICOS DO MASTER) */}
      {activeTab === 'resumo' && (
        <div style={styles.resumoSection}>
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <Building size={22} color="#0061FF" />
                <span style={styles.metricLabel}>Total de Empresas</span>
              </div>
              <h3 style={styles.metricValue}>{tenants.length}</h3>
              <p style={styles.metricTrend}>🚀 Crescimento de 20% este mês</p>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <Users size={22} color="#10B981" />
                <span style={styles.metricLabel}>Colaboradores SSO Ativos</span>
              </div>
              <h3 style={styles.metricValue}>{globalUsers.length}</h3>
              <p style={styles.metricTrend}>🔒 Sincronizados LogDock / Zaptro / Logta</p>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <HardDrive size={22} color="#8B5CF6" />
                <span style={styles.metricLabel}>Storage Alocado</span>
              </div>
              <h3 style={styles.metricValue}>
                {tenants.reduce((acc, curr) => acc + curr.usage, 0)} GB <span style={{ fontSize: '14px', color: '#64748B' }}>/ {tenants.reduce((acc, curr) => acc + curr.limit, 0)} GB</span>
              </h3>
              <p style={styles.metricTrend}>💾 Centralizado no LogDock</p>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <Activity size={22} color="#EF4444" />
                <span style={styles.metricLabel}>Atividade em Tempo Real</span>
              </div>
              <h3 style={styles.metricValue}>128</h3>
              <p style={styles.metricTrend}>🔄 Requisições SSO & Logs hoje</p>
            </div>
          </div>

          <div style={styles.visualGrid}>
            {/* AUDITORIA DE STORAGE & GRÁFICO */}
            <div style={styles.visualCard}>
              <h4 style={styles.visualTitle}><PieChart size={18} /> Distribuição por Sistema</h4>
              <p style={styles.visualDesc}>Proporção de uso das plataformas conectadas ao HUB.</p>
              <div style={styles.visualDataBox}>
                <div style={styles.graphItem}>
                  <div style={styles.graphHeader}>
                    <span>LogDock (Storage Master)</span>
                    <span>65%</span>
                  </div>
                  <div style={styles.graphBarBg}>
                    <div style={{ ...styles.graphBar, width: '65%', backgroundColor: '#0061FF' }} />
                  </div>
                </div>
                <div style={styles.graphItem}>
                  <div style={styles.graphHeader}>
                    <span>Logta ERP</span>
                    <span>20%</span>
                  </div>
                  <div style={styles.graphBarBg}>
                    <div style={{ ...styles.graphBar, width: '20%', backgroundColor: '#10B981' }} />
                  </div>
                </div>
                <div style={styles.graphItem}>
                  <div style={styles.graphHeader}>
                    <span>Zaptro Sales</span>
                    <span>15%</span>
                  </div>
                  <div style={styles.graphBarBg}>
                    <div style={{ ...styles.graphBar, width: '15%', backgroundColor: '#EF4444' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* AUDITORIA DE RECENT ACTIVITIES */}
            <div style={styles.visualCard}>
              <h4 style={styles.visualTitle}><Activity size={18} /> Logs Recentes (Auditoria HUB)</h4>
              <p style={styles.visualDesc}>Últimas ações realizadas por tenants e usuários master.</p>
              <div style={styles.activityLogs}>
                <div style={styles.logItem}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <span>Novo Colaborador adicionado via SSO por Rapidão Cometa Ltda</span>
                </div>
                <div style={styles.logItem}>
                  <HardDrive size={16} color="#8B5CF6" />
                  <span>Quota de Storage alocada para Plano Elite atingiu 31% no LogDock</span>
                </div>
                <div style={styles.logItem}>
                  <Shield size={16} color="#0061FF" />
                  <span>Políticas Globais de Expiração sincronizadas com Zaptro/Logta</span>
                </div>
                <div style={styles.logItem}>
                  <Lock size={16} color="#EF4444" />
                  <span>Tentativa de acesso bloqueada: Tenant Expresso Brasil bloqueado por inadimplência</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ABA EMPRESAS (TENANTS) */}
      {activeTab === 'empresas' && (
        <div style={styles.tenantsSection}>
          <div style={styles.filterBar}>
            <div style={styles.searchBox}>
              <Search size={18} color="#94A3B8" />
              <input type="text" placeholder="Filtrar por nome de empresa..." style={styles.searchInput} />
            </div>
            <button style={styles.filterBtn}><Filter size={16} /> Filtrar por Status</button>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.th}>EMPRESA</th>
                  <th style={styles.th}>PLANO</th>
                  <th style={styles.th}>STORAGE LOGDOCK</th>
                  <th style={styles.th}>TEMPO ACESSO</th>
                  <th style={styles.th}>MÓDULOS ATIVOS</th>
                  <th style={styles.th}>STATUS</th>
                  <th style={styles.th}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <div style={styles.tenantMeta}>
                        <span style={styles.tenantName}>{t.name}</span>
                        <span style={styles.tenantId}>ID: {t.id}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.planBadge, backgroundColor: t.plan === 'Elite' ? '#EEF2FF' : t.plan === 'Pro' ? '#F0FDF4' : '#F8FAFC', color: t.plan === 'Elite' ? '#4338CA' : t.plan === 'Pro' ? '#16A34A' : '#64748B' }}>
                        {t.plan}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.usageWrapper}>
                        <div style={styles.usageMeta}>
                          <span>{t.usage} GB / {t.limit} GB</span>
                          <span>{Math.round((t.usage / t.limit) * 100)}%</span>
                        </div>
                        <div style={styles.progressBarBg}>
                          <div style={{ ...styles.progressBar, width: `${Math.min(100, (t.usage / t.limit) * 100)}%`, backgroundColor: (t.usage / t.limit) >= 0.9 ? '#EF4444' : '#0061FF' }} />
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{t.accessTime}</td>
                    <td style={styles.td}>
                      <div style={styles.modulesBadges}>
                        {t.modules.map(m => (
                          <span key={m} style={styles.modBadge}>{m.toUpperCase()}</span>
                        ))}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusIndicator, backgroundColor: t.blocked ? '#EF4444' : '#10B981' }}>
                        {t.blocked ? 'Bloqueado' : 'Ativo'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button style={{ ...styles.actionBtn, backgroundColor: t.blocked ? '#E1FCEF' : '#FEE2E2', color: t.blocked ? '#03543F' : '#991B1B' }} onClick={() => toggleBlock(t.id)}>
                        {t.blocked ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ABA COLABORADORES & SSO */}
      {activeTab === 'usuarios' && (
        <div style={styles.usersSection}>
          <div style={styles.usersLayoutGrid}>
            {/* NOVO VÍNCULO COLABORADOR */}
            <div style={styles.usersFormCard}>
              <h3 style={styles.formCardTitle}><Users size={20} color="#0061FF" /> Vincular Novo Usuário / Colaborador</h3>
              <p style={styles.formCardDesc}>Adicione colaboradores e vincule-os instantaneamente ao SSO HUB global.</p>
              
              <form onSubmit={handleAddUser} style={styles.userForm}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nome Completo</label>
                  <input type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} style={styles.formInput} placeholder="Ex: Lucas Mendes" required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>E-mail</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={styles.formInput} placeholder="Ex: lucas@logta.com" required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Empresa (Tenant)</label>
                  <select value={newUser.tenant} onChange={e => setNewUser({ ...newUser, tenant: e.target.value })} style={styles.formSelect}>
                    {tenants.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Acesso ao Sistema</label>
                  <select value={newUser.system} onChange={e => setNewUser({ ...newUser, system: e.target.value })} style={styles.formSelect}>
                    <option value="LogDock">LogDock</option>
                    <option value="Logta">Logta ERP</option>
                    <option value="Zaptro">Zaptro</option>
                    <option value="Todos">Todos (SSO Full)</option>
                  </select>
                </div>
                <button type="submit" style={styles.submitBtn}>Adicionar via SSO</button>
              </form>
            </div>

            {/* TABELA DE USUÁRIOS VINCULADOS */}
            <div style={styles.usersTableCard}>
              <h3 style={styles.formCardTitle}><Shield size={20} color="#10B981" /> Todos os Colaboradores Registrados</h3>
              <p style={styles.formCardDesc}>Validando SSO e permissões de acesso da empresa vinculada.</p>
              
              <div style={styles.userTableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.th}>COLABORADOR</th>
                      <th style={styles.th}>PERMISSÃO</th>
                      <th style={styles.th}>EMPRESA VINCULADA</th>
                      <th style={styles.th}>ACESSO SSO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalUsers.map(u => (
                      <tr key={u.id} style={styles.tableRow}>
                        <td style={styles.td}>
                          <div style={styles.tenantMeta}>
                            <span style={styles.tenantName}>{u.name}</span>
                            <span style={styles.tenantId}>{u.email}</span>
                          </div>
                        </td>
                        <td style={styles.td}><span style={styles.modBadge}>{u.role}</span></td>
                        <td style={styles.td}><span style={{ fontWeight: '700', color: '#1E1E1E' }}>{u.tenantLinked}</span></td>
                        <td style={styles.td}>
                          <div style={styles.modulesBadges}>
                            {u.systemAccess.map(sys => <span key={sys} style={styles.sysBadge}>{sys}</span>)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ABA POLÍTICAS GLOBAIS */}
      {activeTab === 'configuracoes' && (
        <div style={styles.policiesSection}>
          <h2 style={styles.sectionTitle}>Políticas e Limites Padrão (Cérebro do Ecossistema)</h2>
          <p style={styles.sectionDesc}>Configurações de storage centralizado no LogDock e limites de permissões globais.</p>

          <div style={styles.policiesGrid}>
            <div style={styles.policyCard}>
              <h4 style={styles.policyTitle}><HardDrive size={20} color="#0061FF" /> Limite Base LogDock</h4>
              <p style={styles.policyDesc}>Armazenamento padrão alocado no LogDock por novas empresas criadas.</p>
              <input type="number" defaultValue={50} style={styles.policyInput} />
            </div>
            <div style={styles.policyCard}>
              <h4 style={styles.policyTitle}><Users size={20} color="#10B981" /> Colaboradores Iniciais</h4>
              <p style={styles.policyDesc}>Número inicial máximo de colaboradores vinculados ao SSO por plano Geral.</p>
              <input type="number" defaultValue={5} style={styles.policyInput} />
            </div>
            <div style={styles.policyCard}>
              <h4 style={styles.policyTitle}><Lock size={20} color="#EF4444" /> Bloqueio de Acesso Expirado</h4>
              <p style={styles.policyDesc}>Duração padrão em dias de plano inadimplente antes de bloquear o tenant total.</p>
              <input type="number" defaultValue={5} style={styles.policyInput} />
            </div>
          </div>
          <button style={styles.saveBtn} onClick={() => toast.success('Políticas globais salvas com sucesso!')}>
            Salvar Políticas Globais
          </button>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px', height: '100%', overflowY: 'auto', backgroundColor: '#FAFAFB', fontFamily: '"Outfit", "Inter", sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleBox: { display: 'flex', alignItems: 'center', gap: '16px' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748B', marginTop: '6px' },
  headerActions: { display: 'flex', gap: '16px' },
  refreshBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#FFF', color: '#1E1E1E', fontSize: '14px', fontWeight: '800', cursor: 'pointer', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' },
  tabsMenu: { display: 'flex', gap: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '2px' },
  tabBtn: { background: 'none', border: 'none', padding: '12px 16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', outline: 'none' },
  resumoSection: { display: 'flex', flexDirection: 'column', gap: '32px' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' },
  metricCard: { backgroundColor: '#FFF', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' },
  metricHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
  metricLabel: { fontSize: '12px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },
  metricValue: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E', margin: '4px 0 0 0' },
  metricTrend: { fontSize: '12px', color: '#64748B', margin: 0, fontWeight: '700' },
  visualGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  visualCard: { backgroundColor: '#FFF', padding: '32px', borderRadius: '24px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' },
  visualTitle: { fontSize: '16px', fontWeight: '900', color: '#1E1E1E', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  visualDesc: { fontSize: '13px', color: '#64748B', margin: 0 },
  visualDataBox: { display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '12px' },
  graphItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
  graphHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', color: '#1E1E1E' },
  graphBarBg: { width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' },
  graphBar: { height: '100%', borderRadius: '4px' },
  activityLogs: { display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' },
  logItem: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#475569', fontWeight: '700' },
  tenantsSection: { display: 'flex', flexDirection: 'column', gap: '24px' },
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#FFF', padding: '12px 20px', borderRadius: '14px', width: '380px', border: '1px solid #EAEAEA' },
  searchInput: { border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '13px', fontWeight: '600', color: '#1E1E1E' },
  filterBtn: { padding: '12px 20px', border: '1px solid #E2E8F0', backgroundColor: '#FFF', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' },
  tableWrapper: { backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  tableHeaderRow: { backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' },
  th: { padding: '18px 24px', fontSize: '12px', fontWeight: '800', color: '#64748B', letterSpacing: '0.5px' },
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
  modulesBadges: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  modBadge: { fontSize: '11px', backgroundColor: '#F1F5F9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontWeight: '800' },
  sysBadge: { fontSize: '11px', backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '4px 8px', borderRadius: '6px', fontWeight: '800' },
  statusIndicator: { padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', color: '#FFF' },
  actionBtn: { padding: '10px 18px', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', outline: 'none' },
  usersSection: { display: 'flex', flexDirection: 'column', gap: '32px' },
  usersLayoutGrid: { display: 'grid', gridTemplateColumns: '420px 1fr', gap: '24px' },
  usersFormCard: { backgroundColor: '#FFF', padding: '32px', borderRadius: '24px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' },
  formCardTitle: { fontSize: '16px', fontWeight: '900', color: '#1E1E1E', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  formCardDesc: { fontSize: '13px', color: '#64748B', margin: 0 },
  userForm: { display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: { fontSize: '12px', fontWeight: '800', color: '#475569' },
  formInput: { padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 'bold' },
  formSelect: { padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#FFF' },
  submitBtn: { padding: '14px 24px', backgroundColor: '#0061FF', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', marginTop: '12px', boxShadow: '0 4px 12px rgba(0,97,255,0.2)' },
  usersTableCard: { backgroundColor: '#FFF', padding: '32px', borderRadius: '24px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', overflow: 'hidden' },
  userTableWrapper: { marginTop: '8px', border: '1px solid #F1F5F9', borderRadius: '16px', overflow: 'hidden' },
  policiesSection: { display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#FFF', padding: '40px', borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' },
  sectionTitle: { fontSize: '18px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  sectionDesc: { fontSize: '13px', color: '#64748B', margin: 0 },
  policiesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  policyCard: { padding: '24px', borderRadius: '20px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#FBFBFB' },
  policyTitle: { fontSize: '14px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  policyDesc: { fontSize: '12px', color: '#64748B', margin: 0 },
  policyInput: { padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', width: '100%', fontSize: '14px', fontWeight: 'bold' },
  saveBtn: { padding: '14px 32px', backgroundColor: '#0061FF', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', width: 'fit-content', boxShadow: '0 4px 12px rgba(0,97,255,0.2)' }
};

export default MasterHubPage;
