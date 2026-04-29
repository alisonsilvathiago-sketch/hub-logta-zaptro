import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, Edit2, Trash2, 
  Shield, ShieldCheck, ShieldAlert,
  Mail, Phone, Clock, MoreVertical,
  Key, RefreshCw, Filter, Activity,
  Database, Globe, Ban, CheckCircle2,
  X, Save, Lock, Layout, Users, Settings,
  BarChart3
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import LogtaModal from '@shared/components/Modal';

interface StaffMember {
  id: string;
  profile_id: string;
  tier: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'SUPPORT';
  department: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  profile: {
    full_name: string;
    email: string;
  };
  permissions?: any[];
}

const MasterStaff: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    recentLogs: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('master_staff')
        .select(`
          *,
          profile:profile_id (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
      
      setStats({
        total: data?.length || 0,
        active: data?.filter(s => s.status === 'ativo').length || 0,
        recentLogs: 124 
      });
    } catch (err) {
      toastError('Erro de Segurança: Não foi possível carregar o time master HQ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [newMember, setNewMember] = useState({ identifier: '', tier: 'SUPPORT', department: 'GERAL' });
  const [permissions, setPermissions] = useState<any>({});

  const handleCreateMember = async () => {
    if (!newMember.identifier) return toastError('Informe o UUID ou E-mail para integração.');
    
    const tid = toastLoading('Iniciando protocolo de integração master...');
    try {
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .or(`email.eq.${newMember.identifier},id.eq.${newMember.identifier}`)
        .single();

      if (pError || !profile) throw new Error('Perfil não localizado na base autenticada.');

      const { error: sError } = await supabase
        .from('master_staff')
        .insert({
          profile_id: profile.id,
          tier: newMember.tier,
          department: newMember.department,
          status: 'ativo'
        });

      if (sError) throw sError;

      if (profile.role !== 'MASTER_ADMIN') {
        await supabase.from('profiles').update({ role: 'MASTER_ADMIN' }).eq('id', profile.id);
      }

      toastSuccess(`${profile.full_name} agora é um Arquiteto Master!`);
      setIsModalOpen(false);
      setNewMember({ identifier: '', tier: 'SUPPORT', department: 'GERAL' });
      fetchData();
    } catch (err: any) {
      toastError(err.message || 'Falha na Integração: O protocolo de acesso foi rejeitado.');
    } finally {
      toastDismiss(tid);
    }
  };

  const loadPermissions = async (staffId: string) => {
    const { data, error } = await supabase
      .from('master_permissions')
      .select('*')
      .eq('staff_id', staffId);
    
    if (!error && data) {
      const permMap: any = {};
      data.forEach(p => {
        if (!permMap[p.module]) permMap[p.module] = {};
        permMap[p.module][p.action] = p.allowed;
      });
      setPermissions(permMap);
    } else {
      setPermissions({});
    }
  };

  const handlePermissionToggle = (module: string, action: string) => {
    setPermissions((prev: any) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action]
      }
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedMember) return;
    const tid = toastLoading('Sincronizando matriz de segurança...');
    try {
      const permsToSave: any[] = [];
      Object.keys(permissions).forEach(module => {
        Object.keys(permissions[module]).forEach(action => {
          permsToSave.push({
            staff_id: selectedMember.id,
            module,
            action,
            allowed: permissions[module][action]
          });
        });
      });

      const { error } = await supabase
        .from('master_permissions')
        .upsert(permsToSave, { onConflict: 'staff_id,module,action' });

      if (error) throw error;
      toastSuccess('Matriz de permissões atualizada com sucesso!');
      setIsPermModalOpen(false);
    } catch (err) {
      toastError('Erro de Sincronização: Não foi possível salvar a matriz.');
    } finally {
       toastDismiss(tid);
    }
  };

  const handleEditPermissions = async (member: StaffMember) => {
    setSelectedMember(member);
    await loadPermissions(member.id);
    setIsPermModalOpen(true);
  };

  const handleToggleStatus = async (member: StaffMember) => {
    const tid = toastLoading(`Alterando estado operacional de ${member.profile.full_name}...`);
    const newStatus = member.status === 'ativo' ? 'inativo' : 'ativo';
    try {
      const { error } = await supabase
        .from('master_staff')
        .update({ status: newStatus })
        .eq('id', member.id);
      
      if (error) throw error;
      toastSuccess(`Membro ${newStatus === 'ativo' ? 'ativado' : 'desativado'} no HQ.`);
      fetchData();
    } catch (err) {
      toastError('Erro de Protocolo: Falha ao alterar status.');
    } finally {
      toastDismiss(tid);
    }
  };

  const handleDelete = async (member: StaffMember) => {
    const tid = toastLoading(`Revogando acesso permanente de ${member.profile.full_name}...`);
    try {
      const { error } = await supabase.from('master_staff').delete().eq('id', member.id);
      if (error) throw error;
      toastSuccess('Acesso master revogado e removido da base HQ.');
      fetchData();
    } catch (err) {
      toastError('Erro de Revogação: Falha ao remover membro.');
    } finally {
      toastDismiss(tid);
    }
  };

  const filteredStaff = staff.filter(s => 
    s.profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.profile?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container} className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Orquestração de Time (HQ)</h1>
          <p style={styles.subtitle}>Gerencie os arquitetos e operadores da infraestrutura global.</p>
        </div>
        <div style={styles.headerActions}>
           <button style={styles.refreshBtn} onClick={fetchData} title="Recarregar HQ">
              <RefreshCw size={18} />
           </button>
           <button style={styles.addBtn} onClick={() => setIsModalOpen(true)}>
              <UserPlus size={18} /> Novo Membro Master
           </button>
        </div>
      </header>

      <div style={styles.statsGrid}>
         <div style={styles.statCard}>
            <div style={styles.statHeader}>
               <div style={{...styles.statIcon, backgroundColor: '#eff6ff', color: 'var(--primary)'}}><ShieldCheck size={20} /></div>
               <span style={styles.statLabel}>Efetivo HQ</span>
            </div>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statFooter}>Colaboradores com acesso master</div>
         </div>
         <div style={styles.statCard}>
            <div style={styles.statHeader}>
               <div style={{...styles.statIcon, backgroundColor: '#ecfdf5', color: '#10b981'}}><Activity size={20} /></div>
               <span style={styles.statLabel}>Operação Ativa</span>
            </div>
            <div style={styles.statValue}>{stats.active}</div>
            <div style={styles.statFooter}>Sessões ativas no momento</div>
         </div>
         <div style={styles.statCard}>
            <div style={styles.statHeader}>
               <div style={{...styles.statIcon, backgroundColor: '#fef2f2', color: '#ef4444'}}><Lock size={20} /></div>
               <span style={styles.statLabel}>Audit Trail</span>
            </div>
            <div style={styles.statValue}>{stats.recentLogs}</div>
            <div style={styles.statFooter}>Ações monitoradas (24h)</div>
         </div>
      </div>

      <div style={styles.mainCard}>
         <div style={styles.cardHeader}>
            <div style={styles.searchBox}>
               <Search size={18} color="#94a3b8" />
               <input 
                  type="text" 
                  placeholder="Localizar no time master por nome ou e-mail..." 
                  style={styles.searchInput} 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
            <button style={styles.filterBtn}><Filter size={18} /> Filtrar Por Tier</button>
         </div>

         <div style={styles.staffWrapper}>
            <table style={styles.table}>
               <thead>
                  <tr style={styles.thead}>
                     <th style={styles.th}>IDENTIDADE MASTER</th>
                     <th style={styles.th}>TIER / PRIVILÉGIO</th>
                     <th style={styles.th}>DEPARTAMENTO</th>
                     <th style={styles.th}>STATUS</th>
                     <th style={{...styles.th, textAlign: 'right'}}>AÇÕES E SEGURANÇA</th>
                  </tr>
               </thead>
               <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={styles.loadingTd}>Sincronizando protocolos HQ...</td></tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr><td colSpan={5} style={styles.loadingTd}>Nenhum arquiteto encontrado na base.</td></tr>
                  ) : filteredStaff.map(member => (
                     <tr key={member.id} style={styles.tr}>
                        <td style={styles.td}>
                           <div style={styles.memberCell}>
                              <div style={styles.avatar}>{member.profile?.full_name[0]}</div>
                              <div>
                                 <strong style={styles.memberName}>{member.profile?.full_name}</strong>
                                 <p style={styles.memberEmail}>{member.profile?.email}</p>
                              </div>
                           </div>
                        </td>
                        <td style={styles.td}>
                           <div style={styles.roleContainer}>
                              <Shield size={14} color="var(--primary)" />
                              <span style={styles.roleBadge}>{member.tier}</span>
                           </div>
                        </td>
                        <td style={styles.td}>
                           <span style={styles.departmentText}>{member.department || 'Operações'}</span>
                        </td>
                        <td style={styles.td}>
                           <div style={{...styles.statusBox, cursor: 'pointer'}} onClick={() => handleToggleStatus(member)}>
                              <div style={{
                                 ...styles.statusDot, 
                                 backgroundColor: member.status === 'ativo' ? '#10b981' : '#ef4444',
                              }} />
                              <span style={{
                                 color: member.status === 'ativo' ? '#10b981' : '#ef4444',
                                 fontWeight: '600',
                                 textTransform: 'uppercase',
                                 letterSpacing: '0.4px'
                              }}>{member.status}</span>
                           </div>
                        </td>
                        <td style={{...styles.td, textAlign: 'right'}}>
                           <div style={styles.actions}>
                              <button style={styles.iconBtn} title="Matriz de Permissões" onClick={() => handleEditPermissions(member)}>
                                <Key size={16} />
                              </button>
                              <button style={{...styles.iconBtn, color: '#ef4444'}} title="Revogar Acesso" onClick={() => handleDelete(member)}>
                                <Trash2 size={16} />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* MODAL: NOVO MEMBRO */}
      <LogtaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        width="500px" 
        title="Integrar Arquiteto HQ"
        subtitle="Conceda privilégios master para um usuário autenticado."
        icon={<UserPlus />}
        primaryAction={{
          label: 'ATIVAR ACESSO MASTER',
          onClick: handleCreateMember
        }}
      >
         <div style={styles.form}>
            <div style={styles.inputGroup}>
               <label style={styles.labelForm}>UUID ou E-mail do Perfil</label>
               <input 
                  style={styles.input} 
                  placeholder="ID do usuário ou e-mail comercial" 
                  value={newMember.identifier}
                  onChange={e => setNewMember({...newMember, identifier: e.target.value})}
               />
               <p style={styles.hintText}>O usuário deve possuir uma conta ativa no sistema.</p>
            </div>
            <div style={styles.formRow}>
              <div style={styles.inputGroup}>
                 <label style={styles.labelForm}>Tier de Acesso</label>
                 <select 
                    style={styles.input}
                    value={newMember.tier}
                    onChange={e => setNewMember({...newMember, tier: e.target.value as any})}
                 >
                    <option value="SUPER_ADMIN">Super Admin (Total)</option>
                    <option value="ADMIN">Admin (Gestão)</option>
                    <option value="OPERATOR">Operador (Audit)</option>
                    <option value="SUPPORT">Suporte (Limited)</option>
                 </select>
              </div>
              <div style={styles.inputGroup} style={{marginTop: '16px'}}>
                 <label style={styles.labelForm}>Departamento</label>
                 <select 
                    style={styles.input}
                    value={newMember.department}
                    onChange={e => setNewMember({...newMember, department: e.target.value})}
                 >
                    <option value="GERAL">Geral</option>
                    <option value="FINANCEIRO">Financeiro</option>
                    <option value="SUPORTE">Suporte Técnico</option>
                    <option value="DEV">Infraestrutura / Dev</option>
                 </select>
              </div>
            </div>
         </div>
      </LogtaModal>

      {/* MODAL: MATRIZ DE PERMISSÕES */}
      <LogtaModal 
        isOpen={isPermModalOpen} 
        onClose={() => setIsPermModalOpen(false)} 
        width="650px" 
        title={`Matriz: ${selectedMember?.profile.full_name}`}
        subtitle="Controle granular por módulo master."
        icon={<Lock />}
        primaryAction={{
          label: 'SALVAR MATRIZ DE SEGURANÇA',
          onClick: handleSavePermissions
        }}
      >
         <div style={styles.permContainer}>
            <div style={styles.matrixList}>
               {['EQUIPE', 'FINANCEIRO', 'CRM', 'INFRA', 'PLANOS', 'EMPRESAS'].map(module => (
                 <div key={module} style={styles.moduleRow}>
                    <div style={styles.moduleName}>
                       <strong style={{fontSize: '13px', color: 'var(--primary)', letterSpacing: '0.4px'}}>{module} MASTER</strong>
                       <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>Privilégios de {module.toLowerCase()}</span>
                    </div>
                    <div style={styles.actionGrid}>
                       {['VIEW', 'EDIT', 'DELETE'].map(action => (
                         <div key={action} style={styles.actionCheck}>
                            <input 
                              type="checkbox" 
                              style={{cursor: 'pointer'}}
                              id={`${module}-${action}`} 
                              checked={permissions[module]?.[action] || false}
                              onChange={() => handlePermissionToggle(module, action)}
                            />
                            <label htmlFor={`${module}-${action}`} style={{cursor: 'pointer'}}>{action}</label>
                         </div>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </LogtaModal>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '0', backgroundColor: 'transparent' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '500', color: 'var(--primary)', letterSpacing: '0.4px', margin: 0 },
  subtitle: { color: 'var(--text-muted)', fontSize: '15px', fontWeight: '400', letterSpacing: '0.2px' },
  headerActions: { display: 'flex', gap: '12px' },
  refreshBtn: { width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-muted)' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', letterSpacing: '0.3px' },
  
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' },
  statCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  statHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  statIcon: { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' },
  statValue: { fontSize: '28px', fontWeight: '500', color: 'var(--text-main)', marginBottom: '4px', letterSpacing: '0.2px' },
  statFooter: { fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400', letterSpacing: '0.2px' },

  mainCard: { backgroundColor: 'white', borderRadius: '28px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' },
  cardHeader: { padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f8fafc', padding: '12px 20px', borderRadius: '14px', border: '1px solid var(--border)', width: '400px' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '14px', fontWeight: '500', width: '100%', color: 'var(--text-main)', letterSpacing: '0.2px' },
  filterBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.2px', color: 'var(--text-muted)' },

  table: { width: '100%', borderCollapse: 'collapse' as const },
  thead: { backgroundColor: '#f8fafc', textAlign: 'left' as const },
  th: { padding: '16px 32px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.8px', borderBottom: '1px solid var(--border)' },
  tr: { borderBottom: '1px solid var(--border)', transition: 'background 0.2s' },
  td: { padding: '16px 32px' },
  loadingTd: { padding: '64px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' },

  memberCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  memberName: { fontSize: '15px', fontWeight: '500', color: 'var(--text-main)', letterSpacing: '0.2px' },
  memberEmail: { fontSize: '12px', color: 'var(--text-muted)', margin: 0, fontWeight: '400', letterSpacing: '0.2px' },
  avatar: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '18px' },
  roleContainer: { display: 'flex', alignItems: 'center', gap: '8px' },
  roleBadge: { fontSize: '11px', fontWeight: '600', color: 'var(--primary)', letterSpacing: '0.8px', textTransform: 'uppercase' },
  departmentText: { fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.3px' },
  statusBox: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  iconBtn: { padding: '10px', border: '1px solid var(--border)', backgroundColor: 'white', borderRadius: '10px', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' },

  form: { padding: '10px', display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  formRow: { width: '100%' },
  inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  labelForm: { fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.8px' },
  input: { padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border)', backgroundColor: '#f8fafc', fontWeight: '500', outline: 'none', fontSize: '14px', letterSpacing: '0.2px', width: '100%' },
  hintText: { fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400', letterSpacing: '0.2px' },

  permContainer: { padding: '10px' },
  matrixList: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  moduleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)' },
  moduleName: { display: 'flex', flexDirection: 'column' as const, gap: '2px' },
  actionGrid: { display: 'flex', gap: '20px' },
  actionCheck: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.4px' }
};

export default MasterStaff;
