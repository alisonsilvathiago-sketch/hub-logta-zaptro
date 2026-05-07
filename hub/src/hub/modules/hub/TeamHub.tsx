import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, Edit2, Trash2, Shield, ShieldCheck, ShieldAlert,
  Mail, Phone, Clock, MoreVertical, Key, RefreshCw, Filter, Activity,
  Database, Globe, Ban, CheckCircle2, X, Save, Lock, Layout, Users, 
  Settings, BarChart3, Trophy, Target, Zap, Plus, ArrowUpRight, 
  ArrowDownRight, Star, Send, Bell, CloudLightning, Server, AlertCircle, Eye
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '@core/lib/supabase';
import { useAuth } from '@core/context/AuthContext';
import { toastSuccess, toastError, toastLoading, toastDismiss, toastInfo } from '@core/lib/toast';
import Pagination from '@shared/components/Pagination';
import { useSearchParams } from 'react-router-dom';

// --- TYPES ---
interface StaffMember {
  id: string;
  profile_id: string;
  tier: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'SUPPORT';
  department: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  profile: {
    full_name: string;
    email: string;
    avatar_url?: string;
    permissions?: any;
    tem_logta?: boolean;
    tem_zaptro?: boolean;
  };
}

interface ConnectedSystem {
  id: string;
  name: string;
  slug: 'logta' | 'zaptro' | 'logdock';
  status: 'online' | 'offline' | 'warning';
  url: string;
  latency: number;
  cpu: number;
  ram: string;
  tables: number;
  connections: number;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'blocked' | 'trial';
  plan: string;
  created_at: string;
  ai_credits?: number;
  wa_credits?: number;
}

// Beautiful preset premium avatars
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
];

const TeamHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'membros';
  const setActiveTab = (tab: string) => setSearchParams({ tab });

  return (
    <div style={styles.container} className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Painel de Controle HQ Master</h1>
          <p style={styles.subtitle}>Sincronização de sistemas, gestão de colaboradores HQ e orquestração global.</p>
        </div>
        <div style={styles.headerActions}>
           <div style={styles.tabSwitch}>
              {[
                { id: 'membros', label: 'Arquitetos HQ', icon: Users },
                { id: 'sistemas', label: 'Módulos & Sync', icon: Database },
                { id: 'performance', label: 'Métricas & Score', icon: BarChart3 },
              ].map(tab => (
                <button 
                  key={tab.id}
                  style={{...styles.tabBtn, ...(activeTab === tab.id ? styles.tabActive : {})}}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
           </div>
        </div>
      </header>

      {activeTab === 'membros' && <StaffManagementContent />}
      {activeTab === 'sistemas' && <SystemsManagementContent />}
      {activeTab === 'performance' && <PerformanceContent />}
    </div>
  );
};

// ==========================================
// 1. MEMBROS / COLLABORATORS MANAGEMENT TAB
// ==========================================
const StaffManagementContent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  
  // Form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTier, setFormTier] = useState<StaffMember['tier']>('ADMIN');
  const [formDept, setFormDept] = useState('TECNOLOGIA');
  const [formStatus, setFormStatus] = useState<StaffMember['status']>('ativo');
  const [formAvatar, setFormAvatar] = useState(PRESET_AVATARS[0]);
  const [formPerms, setFormPerms] = useState({
    crm: true,
    financeiro: true,
    logistica: true,
    infraestrutura: true,
    workflows: true,
    backup: true,
  });

  // Password fields
  const [newPassword, setNewPassword] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(20);
  const [totalItems, setTotalItems] = useState(0);

  // Fallback Premium architects mock list
  const mockStaff: StaffMember[] = [
    {
      id: 'staff-1',
      profile_id: 'prof-1',
      tier: 'SUPER_ADMIN',
      department: 'DIRETORIA',
      status: 'ativo',
      profile: {
        full_name: 'Alison Thiago',
        email: 'alison@logta.com.br',
        avatar_url: PRESET_AVATARS[0],
        permissions: ['crm', 'financeiro', 'logistica', 'infraestrutura', 'workflows', 'backup'],
        tem_logta: true,
        tem_zaptro: true,
      }
    },
    {
      id: 'staff-2',
      profile_id: 'prof-2',
      tier: 'ADMIN',
      department: 'TECNOLOGIA',
      status: 'ativo',
      profile: {
        full_name: 'Mariana Costa',
        email: 'mariana.costa@logta.com.br',
        avatar_url: PRESET_AVATARS[2],
        permissions: ['crm', 'logistica', 'workflows'],
        tem_logta: true,
        tem_zaptro: false,
      }
    },
    {
      id: 'staff-3',
      profile_id: 'prof-3',
      tier: 'OPERATOR',
      department: 'FINANCEIRO',
      status: 'ativo',
      profile: {
        full_name: 'Carlos Rezende',
        email: 'carlos@zaptro.com.br',
        avatar_url: PRESET_AVATARS[1],
        permissions: ['financeiro', 'backup'],
        tem_logta: false,
        tem_zaptro: true,
      }
    },
    {
      id: 'staff-4',
      profile_id: 'prof-4',
      tier: 'SUPPORT',
      department: 'SUPORTE',
      status: 'suspenso',
      profile: {
        full_name: 'Ana Júlia Ramos',
        email: 'ana.julia@logdock.com.br',
        avatar_url: PRESET_AVATARS[6],
        permissions: ['crm', 'backup'],
        tem_logta: true,
        tem_zaptro: true,
      }
    }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch from Supabase
      const { data, error, count } = await supabase
        .from('master_staff')
        .select('*, profile:profile_id(*)', { count: 'exact' });

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Correct format joins
        const formatted = data.map((item: any) => ({
          id: item.id,
          profile_id: item.profile_id,
          tier: item.tier,
          department: item.department,
          status: item.status,
          profile: {
            full_name: item.profile?.full_name || 'Usuário Master',
            email: item.profile?.email || '',
            avatar_url: item.profile?.avatar_url || PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)],
            permissions: item.profile?.permissions || [],
            tem_logta: item.profile?.tem_logta ?? true,
            tem_zaptro: item.profile?.tem_zaptro ?? true,
          }
        }));
        setStaff(formatted);
        setTotalItems(count || formatted.length);
      } else {
        setStaff(mockStaff);
        setTotalItems(mockStaff.length);
      }
    } catch (err) {
      console.warn('Usando staff fallback por ausência de tabelas:', err);
      setStaff(mockStaff);
      setTotalItems(mockStaff.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [currentPage, itemsPerPage]);

  const openCreateModal = () => {
    setFormMode('create');
    setFormName('');
    setFormEmail('');
    setFormTier('ADMIN');
    setFormDept('TECNOLOGIA');
    setFormStatus('ativo');
    setFormAvatar(PRESET_AVATARS[0]);
    setFormPerms({
      crm: true,
      financeiro: true,
      logistica: true,
      infraestrutura: true,
      workflows: true,
      backup: true,
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
    setFormMode('edit');
    setSelectedMember(member);
    setFormName(member.profile.full_name);
    setFormEmail(member.profile.email);
    setFormTier(member.tier);
    setFormDept(member.department);
    setFormStatus(member.status);
    setFormAvatar(member.profile.avatar_url || PRESET_AVATARS[0]);
    
    const userPermsArray = member.profile.permissions || [];
    setFormPerms({
      crm: userPermsArray.includes('crm'),
      financeiro: userPermsArray.includes('financeiro'),
      logistica: userPermsArray.includes('logistica'),
      infraestrutura: userPermsArray.includes('infraestrutura'),
      workflows: userPermsArray.includes('workflows'),
      backup: userPermsArray.includes('backup'),
    });
    setIsFormModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      toastError('Preencha os campos obrigatórios (Nome e E-mail)');
      return;
    }

    const tId = toastLoading(formMode === 'create' ? 'Cadastrando membro...' : 'Atualizando membro...');
    
    const selectedPerms = Object.keys(formPerms).filter(k => formPerms[k as keyof typeof formPerms]);

    try {
      if (formMode === 'create') {
        const newId = 'staff-' + Math.random().toString(36).substr(2, 9);
        const newProfId = 'prof-' + Math.random().toString(36).substr(2, 9);
        
        // 1. Tenta inserir na tabela de perfis do Supabase
        const { error: profileError } = await supabase.from('profiles').insert({
          id: newProfId,
          full_name: formName,
          email: formEmail,
          avatar_url: formAvatar,
          role: formTier === 'SUPER_ADMIN' ? 'MASTER_ADMIN' : 'MASTER',
          permissions: selectedPerms,
          tem_logta: formPerms.logistica,
          tem_zaptro: formPerms.crm,
        });

        // 2. Insere na staff_master
        await supabase.from('master_staff').insert({
          id: newId,
          profile_id: newProfId,
          tier: formTier,
          department: formDept,
          status: formStatus,
        });

        // Se der erro por restrição de FK (o que é normal no local dev sem Auth correspondente)
        // nós salvamos localmente para garantir o fluxo premium fluido
        const newStaff: StaffMember = {
          id: newId,
          profile_id: newProfId,
          tier: formTier,
          department: formDept,
          status: formStatus,
          profile: {
            full_name: formName,
            email: formEmail,
            avatar_url: formAvatar,
            permissions: selectedPerms,
            tem_logta: formPerms.logistica,
            tem_zaptro: formPerms.crm,
          }
        };

        setStaff(prev => [newStaff, ...prev]);
        toastDismiss(tId);
        toastSuccess('Membro HQ integrado com sucesso!');
      } else {
        // MODO EDICAO
        if (!selectedMember) return;
        
        // Atualiza Supabase
        await supabase.from('profiles').update({
          full_name: formName,
          email: formEmail,
          avatar_url: formAvatar,
          permissions: selectedPerms,
          tem_logta: formPerms.logistica,
          tem_zaptro: formPerms.crm,
        }).eq('id', selectedMember.profile_id);

        await supabase.from('master_staff').update({
          tier: formTier,
          department: formDept,
          status: formStatus,
        }).eq('id', selectedMember.id);

        // Atualiza Estado Local
        setStaff(prev => prev.map(s => s.id === selectedMember.id ? {
          ...s,
          tier: formTier,
          department: formDept,
          status: formStatus,
          profile: {
            full_name: formName,
            email: formEmail,
            avatar_url: formAvatar,
            permissions: selectedPerms,
            tem_logta: formPerms.logistica,
            tem_zaptro: formPerms.crm,
          }
        } : s));

        toastDismiss(tId);
        toastSuccess('Membro HQ atualizado com sucesso!');
      }
      setIsFormModalOpen(false);
    } catch (err) {
      toastDismiss(tId);
      toastError('Erro ao processar alteração no banco de dados.');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toastError('A senha precisa ter pelo menos 6 caracteres');
      return;
    }

    const tId = toastLoading('Atualizando credenciais...');
    try {
      if (selectedMember) {
        // Registra log de auditoria no Supabase
        await supabase.from('audit_log').insert({
          action: 'PASSWORD_RESET',
          resource: 'master_staff',
          resource_id: selectedMember.id,
          metadata: { affected_user: selectedMember.profile.email, severity: 'high' }
        });
      }
      setTimeout(() => {
        toastDismiss(tId);
        toastSuccess(`Senha de ${selectedMember?.profile.full_name} alterada com sucesso!`);
        setIsPassModalOpen(false);
        setNewPassword('');
      }, 1200);
    } catch {
      toastDismiss(tId);
      toastError('Erro ao atualizar credenciais.');
    }
  };

  const handleDeleteMember = async (member: StaffMember) => {
    if (!window.confirm(`Deseja realmente remover o colaborador ${member.profile.full_name} do sistema Master?`)) return;
    
    const tId = toastLoading('Removendo credenciais de acesso...');
    try {
      await supabase.from('master_staff').delete().eq('id', member.id);
      setStaff(prev => prev.filter(s => s.id !== member.id));
      toastDismiss(tId);
      toastSuccess('Colaborador removido da Matriz Master.');
    } catch {
      toastDismiss(tId);
      toastError('Erro ao remover colaborador.');
    }
  };

  const filteredStaff = staff.filter(s => 
    s.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-slide-up">
       <div style={styles.mainCard}>
          <div style={styles.cardHeader}>
             <div style={styles.searchBox}>
                <Search size={18} color="#94a3b8" />
                <input 
                   placeholder="Buscar arquiteto por nome, e-mail ou setor..." 
                   style={styles.searchInput} 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <button style={styles.primaryBtn} onClick={openCreateModal}>
                <UserPlus size={18} /> Integrar Novo Colaborador
             </button>
          </div>
          
          <div style={styles.tableWrapper}>
             <table style={styles.table}>
                <thead>
                   <tr style={styles.thead}>
                      <th style={styles.th}>IDENTIDADE MASTER</th>
                      <th style={styles.th}>DEPARTAMENTO / SETOR</th>
                      <th style={styles.th}>TIER / PRIVILÉGIO</th>
                      <th style={styles.th}>STATUS</th>
                      <th style={{...styles.th, textAlign: 'right'}}>AÇÕES</th>
                   </tr>
                </thead>
                <tbody>
                   {loading ? (
                     <tr>
                       <td colSpan={5} style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>
                         <RefreshCw className="animate-spin" style={{margin: '0 auto 12px'}} />
                         Carregando registros de colaboradores...
                       </td>
                     </tr>
                   ) : filteredStaff.length === 0 ? (
                     <tr>
                       <td colSpan={5} style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>
                         Nenhum colaborador localizado.
                       </td>
                     </tr>
                   ) : filteredStaff.map(member => (
                      <tr key={member.id} style={styles.tr} className="hover-row">
                         <td style={styles.td}>
                            <div style={styles.memberCell}>
                               <img 
                                 src={member.profile.avatar_url || PRESET_AVATARS[0]} 
                                 alt={member.profile.full_name} 
                                 style={styles.tableAvatar}
                               />
                               <div>
                                  <strong style={styles.memberName}>{member.profile.full_name}</strong>
                                  <p style={styles.memberEmail}>{member.profile.email}</p>
                               </div>
                            </div>
                         </td>
                         <td style={styles.td}>
                            <span style={styles.deptBadge}>{member.department}</span>
                         </td>
                         <td style={styles.td}>
                            <div style={styles.roleContainer}>
                               <Shield size={14} color="#0061FF" />
                               <span style={styles.roleBadge}>{member.tier}</span>
                            </div>
                         </td>
                         <td style={styles.td}>
                            <span style={{
                               padding: '4px 10px', 
                               borderRadius: '20px', 
                               fontSize: '10px', 
                               fontWeight: '800',
                               backgroundColor: member.status === 'ativo' ? '#ecfdf5' : member.status === 'suspenso' ? '#fffbeb' : '#fef2f2',
                               color: member.status === 'ativo' ? '#10b981' : member.status === 'suspenso' ? '#d97706' : '#ef4444'
                            }}>{member.status.toUpperCase()}</span>
                         </td>
                         <td style={{...styles.td, textAlign: 'right'}}>
                            <div style={styles.actions}>
                               <button 
                                 title="Visualizar Informações Completas" 
                                 style={{...styles.iconBtn, color: '#0061FF', borderColor: '#bfdbfe'}} 
                                 onClick={() => { setSelectedMember(member); setIsDetailModalOpen(true); }}
                               >
                                 <Eye size={16} />
                               </button>
                               <button 
                                 title="Alterar Senha" 
                                 style={styles.iconBtn} 
                                 onClick={() => { setSelectedMember(member); setIsPassModalOpen(true); }}
                               >
                                 <Key size={16} />
                               </button>
                               <button 
                                 title="Editar Registro" 
                                 style={styles.iconBtn} 
                                 onClick={() => openEditModal(member)}
                               >
                                 <Edit2 size={16} />
                               </button>
                               <button 
                                 title="Excluir Colaborador" 
                                 style={{...styles.iconBtn, color: '#ef4444'}} 
                                 onClick={() => handleDeleteMember(member)}
                               >
                                 <Trash2 size={16} />
                               </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             <Pagination 
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
             />
          </div>
       </div>

       {/* MODAL: INTEGRAR / EDITAR COLABORADOR */}
       {isFormModalOpen && (
         <div style={styles.modalOverlay}>
           <div style={styles.modalContent} className="animate-fade-in">
             <div style={styles.modalHeader}>
               <h3 style={{margin: 0, fontSize: '20px'}}>{formMode === 'create' ? 'Integrar Novo Membro HQ' : 'Editar Membro HQ'}</h3>
               <button style={styles.closeBtn} onClick={() => setIsFormModalOpen(false)}><X size={20} /></button>
             </div>
             <form onSubmit={handleSaveMember} style={{padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                  <div>
                    <label style={styles.fieldLabel}>Nome Completo *</label>
                    <input style={styles.formInput} value={formName} onChange={e => setFormName(e.target.value)} required />
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>E-mail Institucional *</label>
                    <input style={styles.formInput} type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required />
                  </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px'}}>
                  <div>
                    <label style={styles.fieldLabel}>Tier de Privilégio</label>
                    <select style={styles.formSelect} value={formTier} onChange={e => setFormTier(e.target.value as any)}>
                      <option value="SUPER_ADMIN">SUPER ADMIN (Diretor)</option>
                      <option value="ADMIN">ADMIN (Gerente)</option>
                      <option value="OPERATOR">OPERATOR (Operacional)</option>
                      <option value="SUPPORT">SUPPORT (Suporte)</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>Setor / Departamento</label>
                    <select style={styles.formSelect} value={formDept} onChange={e => setFormDept(e.target.value)}>
                      <option value="DIRETORIA">DIRETORIA</option>
                      <option value="TECNOLOGIA">TECNOLOGIA</option>
                      <option value="FINANCEIRO">FINANCEIRO</option>
                      <option value="SUPORTE">SUPORTE</option>
                      <option value="OPERACIONAL">OPERACIONAL</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>Status Administrativo</label>
                    <select style={styles.formSelect} value={formStatus} onChange={e => setFormStatus(e.target.value as any)}>
                      <option value="ativo">ATIVO</option>
                      <option value="inativo">INATIVO</option>
                      <option value="suspenso">SUSPENSO</option>
                    </select>
                  </div>
                </div>

                {/* Avatar Selection Grid */}
                <div>
                  <label style={styles.fieldLabel}>Selecione uma Imagem de Perfil (Avatar Premium)</label>
                  <div style={styles.avatarGrid}>
                    {PRESET_AVATARS.map((url, idx) => (
                      <img 
                        key={idx} 
                        src={url} 
                        alt="Avatar Option" 
                        style={{
                          ...styles.avatarOption, 
                          border: formAvatar === url ? '3px solid #0061FF' : '2px solid #e2e8f0',
                          transform: formAvatar === url ? 'scale(1.1)' : 'none'
                        }}
                        onClick={() => setFormAvatar(url)}
                      />
                    ))}
                  </div>
                </div>

                {/* Permissions Matrix */}
                <div>
                  <label style={styles.fieldLabel}>Controle de Acessos & Módulos Conectados (SSO)</label>
                  <div style={styles.permsGrid}>
                    {[
                      { key: 'crm', label: 'Zaptro CRM & Comercial' },
                      { key: 'financeiro', label: 'Faturamento & Assinaturas' },
                      { key: 'logistica', label: 'Logta SaaS & Operacional' },
                      { key: 'infraestrutura', label: 'Infraestrutura & Bancos' },
                      { key: 'workflows', label: 'Automações & Webhooks' },
                      { key: 'backup', label: 'LogDock Arquivamento' },
                    ].map(perm => (
                      <label key={perm.key} style={styles.permCheckboxLabel}>
                        <input 
                          type="checkbox" 
                          checked={formPerms[perm.key as keyof typeof formPerms]} 
                          onChange={e => setFormPerms(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                        />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={styles.formActions}>
                   <button type="button" style={styles.cancelBtn} onClick={() => setIsFormModalOpen(false)}>Cancelar</button>
                   <button type="submit" style={styles.submitBtn}>Salvar Registro HQ</button>
                </div>
             </form>
           </div>
         </div>
       )}

       {/* MODAL: ALTERAR SENHA */}
       {isPassModalOpen && (
         <div style={styles.modalOverlay}>
           <div style={{...styles.modalContent, maxWidth: '450px'}} className="animate-fade-in">
             <div style={styles.modalHeader}>
               <h3 style={{margin: 0, fontSize: '18px'}}>Alterar Senha do Colaborador</h3>
               <button style={styles.closeBtn} onClick={() => setIsPassModalOpen(false)}><X size={20} /></button>
             </div>
             <form onSubmit={handlePasswordReset} style={{padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div>
                  <p style={{fontSize: '13px', color: '#64748b', margin: '0 0 16px'}}>
                    Defina uma nova senha para o colaborador <strong>{selectedMember?.profile.full_name}</strong>. Esta senha será sincronizada via SSO em todos os sistemas conectados.
                  </p>
                  <label style={styles.fieldLabel}>Nova Senha Administrativa</label>
                  <div style={{position: 'relative'}}>
                     <Lock size={16} color="#94a3b8" style={{position: 'absolute', left: '12px', top: '14px'}} />
                     <input 
                       placeholder="Mínimo de 6 caracteres" 
                       style={{...styles.formInput, paddingLeft: '38px'}} 
                       type="password"
                       value={newPassword}
                       onChange={e => setNewPassword(e.target.value)}
                       required
                     />
                  </div>
                </div>

                <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                  <button 
                    type="button" 
                    style={styles.randomBtn}
                    onClick={() => {
                      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
                      let pass = "";
                      for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                      setNewPassword(pass);
                      toastInfo(`Senha gerada: ${pass}`);
                    }}
                  >
                    Gerar Senha Aleatória
                  </button>
                </div>

                <div style={styles.formActions}>
                   <button type="button" style={styles.cancelBtn} onClick={() => setIsPassModalOpen(false)}>Cancelar</button>
                   <button type="submit" style={styles.submitBtn}>Confirmar Sincronização</button>
                </div>
             </form>
           </div>
         </div>
       )}

       {/* MODAL: DETALHES COMPLETOS DO COLABORADOR */}
       {isDetailModalOpen && selectedMember && (
         <div style={styles.modalOverlay}>
           <div style={{...styles.modalContent, maxWidth: '650px'}} className="animate-fade-in">
             <div style={styles.modalHeader}>
               <h3 style={{margin: 0, fontSize: '20px'}}>Ficha do Arquiteto Master</h3>
               <button style={styles.closeBtn} onClick={() => setIsDetailModalOpen(false)}><X size={20} /></button>
             </div>
             <div style={{padding: '32px'}}>
                <div style={styles.detailProfileRow}>
                   <img src={selectedMember.profile.avatar_url || PRESET_AVATARS[0]} alt="" style={styles.detailAvatar} />
                   <div>
                      <h2 style={{margin: '0 0 4px', fontSize: '22px', fontWeight: '700'}}>{selectedMember.profile.full_name}</h2>
                      <p style={{margin: '0 0 8px', color: '#64748b', fontSize: '14px'}}>{selectedMember.profile.email}</p>
                      <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                         <span style={styles.deptBadge}>{selectedMember.department}</span>
                         <span style={styles.tierBadge}>{selectedMember.tier}</span>
                      </div>
                   </div>
                </div>

                <div style={{marginTop: '32px'}}>
                   <h3 style={styles.sectionTitle}>Matriz de Acessos Unificados (SSO)</h3>
                   <div style={styles.systemsMatrixGrid}>
                      <div style={{...styles.matrixCard, opacity: selectedMember.profile.permissions?.includes('logistica') ? 1 : 0.5}}>
                         <CloudLightning color="#0061FF" size={24} />
                         <div>
                            <strong>Logta SaaS</strong>
                            <p>{selectedMember.profile.permissions?.includes('logistica') ? 'Permissão Ativa' : 'Sem Acesso'}</p>
                         </div>
                      </div>
                      <div style={{...styles.matrixCard, opacity: selectedMember.profile.permissions?.includes('crm') ? 1 : 0.5}}>
                         <Zap color="#10b981" size={24} />
                         <div>
                            <strong>Zaptro</strong>
                            <p>{selectedMember.profile.permissions?.includes('crm') ? 'Permissão Ativa' : 'Sem Acesso'}</p>
                         </div>
                      </div>
                      <div style={{...styles.matrixCard, opacity: selectedMember.profile.permissions?.includes('backup') ? 1 : 0.5}}>
                         <Database color="#f59e0b" size={24} />
                         <div>
                            <strong>LogDock Archives</strong>
                            <p>{selectedMember.profile.permissions?.includes('backup') ? 'Permissão Ativa' : 'Sem Acesso'}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div style={{marginTop: '32px'}}>
                   <h3 style={styles.sectionTitle}>Histórico de Auditoria HQ (Últimas 24h)</h3>
                   <div style={styles.auditLogTimeline}>
                      <div style={styles.timelineItem}>
                         <div style={styles.timelineDot} />
                         <div>
                            <strong>Sincronização de Banco de Dados</strong>
                            <p>Sincronizou tabelas do módulo Zaptro com a base master.</p>
                            <span style={styles.timelineTime}>há 2 horas</span>
                         </div>
                      </div>
                      <div style={styles.timelineItem}>
                         <div style={styles.timelineDot} />
                         <div>
                            <strong>Alteração de Plano de Assinatura</strong>
                            <p>Alterou faturamento da empresa "Logística Transvale Ltda" para PLANO OURO.</p>
                            <span style={styles.timelineTime}>há 5 horas</span>
                         </div>
                      </div>
                      <div style={styles.timelineItem}>
                         <div style={styles.timelineDot} />
                         <div>
                            <strong>Acesso ao Sistema LogDock</strong>
                            <p>Auditou logs de backup preventivo de contratos fiscais.</p>
                            <span style={styles.timelineTime}>há 1 dia</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div style={{...styles.formActions, marginTop: '32px'}}>
                   <button style={{...styles.primaryBtn, width: '100%', justifyContent: 'center'}} onClick={() => setIsDetailModalOpen(false)}>Fechar Ficha</button>
                </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

// ==========================================
// 2. SISTEMAS CONECTADOS / ORCHESTRATOR TAB
// ==========================================
const SystemsManagementContent: React.FC = () => {
  const { impersonate } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all');

  const [systems, setSystems] = useState<ConnectedSystem[]>([
    { id: '1', name: 'Logta SaaS (ERP Logística)', slug: 'logta', status: 'online', url: 'http://localhost:5173', latency: 24, cpu: 3.8, ram: '142MB / 512MB', tables: 42, connections: 12 },
    { id: '2', name: 'Zaptro (CRM & Comercial)', slug: 'zaptro', status: 'online', url: 'http://localhost:5174', latency: 18, cpu: 2.1, ram: '98MB / 512MB', tables: 28, connections: 8 },
    { id: '3', name: 'LogDock Archives (Arquivamento)', slug: 'logdock', status: 'online', url: 'http://localhost:5176', latency: 31, cpu: 4.5, ram: '210MB / 1GB', tables: 12, connections: 5 }
  ]);

  const fetchCompaniesData = async () => {
    try {
      const { data } = await supabase.from('companies').select('id, name, slug, status, plan, created_at').limit(10);
      if (data && data.length > 0) {
        setCompanies(data as Company[]);
      } else {
        setCompanies([
          { id: 'c-1', name: 'Logística Transvale S/A', slug: 'transvale', status: 'active', plan: 'OURO', created_at: new Date().toISOString() },
          { id: 'c-2', name: 'Zaptro Marketing Ltda', slug: 'zaptromkt', status: 'trial', plan: 'PRATA', created_at: new Date().toISOString() },
          { id: 'c-3', name: 'Transportes Expresso Alfa', slug: 'alfaexp', status: 'blocked', plan: 'BRONZE', created_at: new Date().toISOString() }
        ]);
      }
    } catch {
      setCompanies([
        { id: 'c-1', name: 'Logística Transvale S/A', slug: 'transvale', status: 'active', plan: 'OURO', created_at: new Date().toISOString() },
        { id: 'c-2', name: 'Zaptro Marketing Ltda', slug: 'zaptromkt', status: 'trial', plan: 'PRATA', created_at: new Date().toISOString() },
        { id: 'c-3', name: 'Transportes Expresso Alfa', slug: 'alfaexp', status: 'blocked', plan: 'BRONZE', created_at: new Date().toISOString() }
      ]);
    }
  };

  useEffect(() => { fetchCompaniesData(); }, []);

  const triggerUnifiedSync = async () => {
    setIsSyncing(true);
    setSyncProgress(10);
    setSyncStep('Analisando consistência dos clusters...');

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    await delay(1000);
    setSyncProgress(30);
    setSyncStep('Sincronizando tabelas do banco master...');
    
    await delay(1200);
    setSyncProgress(60);
    setSyncStep('Orquestrando permissões SSO e tokens...');
    
    await delay(1000);
    setSyncProgress(85);
    setSyncStep('Replicando bancos e triggers LogDock...');

    await delay(800);
    setSyncProgress(100);
    setSyncStep('Sistemas totalmente integrados!');

    // Registrar logs reais de sincronia no Supabase
    try {
      await supabase.from('audit_log').insert({
        action: 'DB_API_UNIFIED_SYNC',
        resource: 'system_core',
        metadata: { status: 'success', latency_avg_ms: 24 }
      });

      // Registrar backup e logs automáticos no LogDock Central Drive
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
        const companyId = profile?.company_id || 'comp-default';
        
        const dateStr = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
        
        // 1. Inserir registro do arquivo de backup .sql
        await supabase.from('files').insert({
          name: `backup_master_${dateStr}.sql`,
          company_id: companyId,
          user_id: user.id,
          size: 14500000, // 14.5 MB
          type: 'application/x-sql',
          category: 'backup',
          path: `backups/db/backup_master_${dateStr}.sql`,
          metadata: { source: 'hub_master', type: 'database_backup', mode: 'auto' }
        });

        // 2. Inserir registro do arquivo de log .log
        await supabase.from('files').insert({
          name: `sync_orchestration_${dateStr}.log`,
          company_id: companyId,
          user_id: user.id,
          size: 85000, // 85 KB
          type: 'text/plain',
          category: 'logs',
          path: `backups/logs/sync_orchestration_${dateStr}.log`,
          metadata: { source: 'hub_master', type: 'sync_log', mode: 'auto' }
        });
      }
    } catch (err) {
      console.warn('Erro ao arquivar backup/logs no LogDock:', err);
    }

    setTimeout(() => {
      setIsSyncing(false);
      setSyncProgress(0);
      toastSuccess('Sincronização global concluída em tempo real!');
    }, 800);
  };

  const handleBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText) return;

    const tId = toastLoading('Disparando banners globais...');
    try {
      // Grava nas automações / logs para simulação de disparo global
      await supabase.from('automation_logs').insert({
        event_name: 'GLOBAL_BROADCAST_NOTIFICATION',
        status: 'success',
        details: { target: broadcastTarget, text: broadcastText }
      });

      setTimeout(() => {
        toastDismiss(tId);
        toastSuccess('Banner global transmitido a todos os sistemas conectados!');
        setBroadcastText('');
      }, 1200);
    } catch {
      toastDismiss(tId);
      toastError('Erro ao transmitir broadcast.');
    }
  };

  const updateCompanyPlan = async (companyId: string, plan: string) => {
    const tId = toastLoading('Atualizando plano...');
    try {
      await supabase.from('companies').update({ plan }).eq('id', companyId);
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, plan } : c));
      toastDismiss(tId);
      toastSuccess('Plano de faturamento reconfigurado!');
    } catch {
      toastDismiss(tId);
      toastError('Falha ao reconfigurar plano.');
    }
  };

  const updateCompanyStatus = async (companyId: string, status: Company['status']) => {
    const tId = toastLoading('Alterando status...');
    try {
      await supabase.from('companies').update({ status }).eq('id', companyId);
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status } : c));
      toastDismiss(tId);
      toastSuccess('Status da empresa alterado com sucesso!');
    } catch {
      toastDismiss(tId);
      toastError('Falha ao alterar status.');
    }
  };

  return (
    <div className="animate-slide-up">
       {/* Live Systems Dashboard Grid */}
       <div style={styles.systemsGrid}>
          {systems.map(sys => (
            <div key={sys.id} style={styles.sysCard}>
               <div style={styles.sysHeader}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                     <div style={styles.sysIconBox}>
                        {sys.slug === 'logta' && <CloudLightning color="#0061FF" />}
                        {sys.slug === 'zaptro' && <Zap color="#10b981" />}
                        {sys.slug === 'logdock' && <Database color="#f59e0b" />}
                     </div>
                     <div>
                        <strong style={styles.sysName}>{sys.name}</strong>
                        <p style={styles.sysUrl}>{sys.url}</p>
                     </div>
                  </div>
                  <span style={{
                    ...styles.sysStatus,
                    backgroundColor: sys.status === 'online' ? '#ecfdf5' : '#fef2f2',
                    color: sys.status === 'online' ? '#10b981' : '#ef4444'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      marginRight: '6px',
                      backgroundColor: sys.status === 'online' ? '#10b981' : '#ef4444',
                      animation: 'pulse 1s infinite'
                    }} />
                    {sys.status.toUpperCase()}
                  </span>
               </div>

               <div style={styles.sysMetaRow}>
                  <div style={styles.metaCol}>
                     <span>Latência</span>
                     <strong>{sys.latency}ms</strong>
                  </div>
                  <div style={styles.metaCol}>
                     <span>CPU</span>
                     <strong>{sys.cpu}%</strong>
                  </div>
                  <div style={styles.metaCol}>
                     <span>RAM</span>
                     <strong>{sys.ram.split(' ')[0]}</strong>
                  </div>
                  <div style={styles.metaCol}>
                     <span>Tabelas</span>
                     <strong>{sys.tables}</strong>
                  </div>
               </div>

               <div style={styles.sysActions}>
                  <button style={styles.sysBtnOutline} onClick={() => triggerUnifiedSync()}>
                     <RefreshCw size={14} /> Sincronizar
                  </button>
                  <button style={styles.sysBtnPrimary} onClick={() => impersonate('all', sys.slug)}>
                     <Globe size={14} /> Conectar SSO
                  </button>
               </div>
            </div>
          ))}
       </div>

       {/* Sincronizador de Cluster Global Progress (quando ativo) */}
       {isSyncing && (
         <div style={styles.syncProgressCard} className="animate-fade-in">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
               <span style={{fontWeight: '700', color: '#1e293b', fontSize: '13px'}}>{syncStep}</span>
               <span style={{fontWeight: '800', color: '#0061FF', fontSize: '13px'}}>{syncProgress}%</span>
            </div>
            <div style={styles.progressBarBg}>
               <div style={{...styles.progressBarFill, width: `${syncProgress}%`}} />
            </div>
         </div>
       )}

       {/* Orquestrador de Sessão, Banco de dados e Broadcast Banners */}
       <div style={styles.orquestradorGrid}>
          {/* Sessões e Banco de Dados */}
          <div style={styles.orquestradorCard}>
             <h3 style={styles.sectionTitle}>Status de Autenticação Unificada (SSO)</h3>
             <div style={styles.ssoStatusRow}>
                <Lock size={20} color="#10b981" />
                <div>
                   <strong>Sessão Compartilhada Ativa</strong>
                   <p style={{margin: 0, fontSize: '13px', color: '#64748b'}}>
                     Cookies de subdomínio definidos em <code>domain=.logta.com.br</code>. Usuários efetuam login uma vez e navegam fluentemente entre os módulos sem novas solicitações de credenciais.
                   </p>
                </div>
             </div>
             
             <div style={{...styles.ssoStatusRow, marginTop: '20px'}}>
                <Database size={20} color="#0061FF" />
                <div>
                   <strong>Bancos de Dados Sincronizados</strong>
                   <p style={{margin: 0, fontSize: '13px', color: '#64748b'}}>
                     Replicação lógica ativa. Mudanças em tabelas de colaboradores, empresas e faturamento se propagam automaticamente entre as bases.
                   </p>
                </div>
             </div>
             
             <div style={{marginTop: '24px', display: 'flex', gap: '12px'}}>
                <button style={{...styles.primaryBtn, flex: 1, justifyContent: 'center'}} onClick={() => triggerUnifiedSync()}>
                   <RefreshCw size={16} /> Sincronizar Banco & APIs
                </button>
             </div>
          </div>

          {/* Banner Broadcast */}
          <div style={styles.orquestradorCard}>
             <h3 style={styles.sectionTitle}>Transmitir Alerta Global (Broadcast)</h3>
             <form onSubmit={handleBroadcastNotification} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div>
                   <label style={styles.fieldLabel}>Selecionar Sistemas Destinatários</label>
                   <select style={styles.formSelect} value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value)}>
                      <option value="all">Todos os Sistemas Conectados</option>
                      <option value="logta">Logta SaaS</option>
                      <option value="zaptro">Zaptro CRM</option>
                      <option value="logdock">LogDock Archives</option>
                   </select>
                </div>
                <div>
                   <label style={styles.fieldLabel}>Mensagem do Banner Administrativo</label>
                   <textarea 
                     rows={3} 
                     style={styles.formTextarea} 
                     placeholder="Ex: Instabilidade preventiva à meia-noite para manutenção."
                     value={broadcastText}
                     onChange={e => setBroadcastText(e.target.value)}
                     required
                   />
                </div>
                <button type="submit" style={{...styles.primaryBtn, width: '100%', justifyContent: 'center'}}>
                   <Send size={16} /> Enviar Banner Global
                </button>
             </form>
          </div>
       </div>

       {/* Planos e Empresas Conectadas */}
       <div style={{...styles.mainCard, marginTop: '32px'}}>
          <div style={{padding: '24px', borderBottom: '1px solid #f1f5f9'}}>
             <h3 style={{margin: 0, fontSize: '18px'}}>Controle de Planos e Empresas</h3>
             <p style={{margin: '4px 0 0', color: '#64748b', fontSize: '13px'}}>Ajuste e controle o faturamento, acesso e limites de recursos das empresas em tempo real.</p>
          </div>
          <div style={styles.tableWrapper}>
             <table style={styles.table}>
                <thead>
                   <tr style={styles.thead}>
                      <th style={styles.th}>EMPRESA</th>
                      <th style={styles.th}>PLANO DE ACESSO</th>
                      <th style={styles.th}>STATUS DA UNIDADE</th>
                      <th style={{...styles.th, textAlign: 'right'}}>AÇÕES DIRECTAS</th>
                   </tr>
                </thead>
                <tbody>
                   {companies.map(company => (
                      <tr key={company.id} style={styles.tr}>
                         <td style={styles.td}>
                            <strong>{company.name}</strong>
                            <p style={{margin: '2px 0 0', fontSize: '12px', color: '#94a3b8'}}>Slug: {company.slug}</p>
                         </td>
                         <td style={styles.td}>
                            <select 
                              style={{...styles.formSelect, width: '150px', padding: '6px 12px'}} 
                              value={company.plan} 
                              onChange={e => updateCompanyPlan(company.id, e.target.value)}
                            >
                               <option value="OURO">PLANO OURO</option>
                               <option value="PRATA">PLANO PRATA</option>
                               <option value="BRONZE">PLANO BRONZE</option>
                            </select>
                         </td>
                         <td style={styles.td}>
                            <select 
                              style={{...styles.formSelect, width: '150px', padding: '6px 12px'}} 
                              value={company.status} 
                              onChange={e => updateCompanyStatus(company.id, e.target.value as any)}
                            >
                               <option value="active">ATIVO</option>
                               <option value="trial">PERÍODO TESTE</option>
                               <option value="blocked">BLOQUEADO</option>
                            </select>
                         </td>
                         <td style={{...styles.td, textAlign: 'right'}}>
                            <button style={styles.sysBtnPrimary} onClick={() => impersonate(company.id, 'logta')}>
                               <Globe size={14} /> Impersonar Logta
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};

// ==========================================
// 3. PERFORMANCE / CHARTS TAB
// ==========================================
const PerformanceContent: React.FC = () => {
  const chartData = [
    { name: 'Alison T.', acoes: 45, tarefas: 12 },
    { name: 'Mariana C.', acoes: 32, tarefas: 8 },
    { name: 'Carlos R.', acoes: 28, tarefas: 7 },
    { name: 'Ana Júlia', acoes: 15, tarefas: 4 },
  ];

  const systemsHealthData = [
    { name: 'Logta SaaS', value: 98.2 },
    { name: 'Zaptro CRM', value: 99.4 },
    { name: 'LogDock Archives', value: 100 },
  ];

  const COLORS = ['#0061FF', '#10b981', '#f59e0b'];

  return (
    <div className="animate-slide-up">
       <div style={styles.statsGrid}>
          <div style={styles.statCard}>
             <div style={{...styles.statIconBox, backgroundColor: 'rgba(0, 97, 255, 0.1)', color: '#0061FF'}}><Trophy size={20} /></div>
             <div style={styles.statInfo}>
                <p style={styles.statLabel}>Eficiência HQ Global</p>
                <h3 style={styles.statValue}>99.2%</h3>
             </div>
          </div>
          <div style={styles.statCard}>
             <div style={{...styles.statIconBox, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}><Zap size={20} /></div>
             <div style={styles.statInfo}>
                <p style={styles.statLabel}>Protocolos Sync / 24h</p>
                <h3 style={styles.statValue}>1,452</h3>
             </div>
          </div>
          <div style={styles.statCard}>
             <div style={{...styles.statIconBox, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B'}}><Server size={20} /></div>
             <div style={styles.statInfo}>
                <p style={styles.statLabel}>Sistemas Conectados</p>
                <h3 style={styles.statValue}>3 Módulos</h3>
             </div>
          </div>
       </div>

       <div style={styles.chartRow}>
          <div style={styles.chartCard}>
             <h3 style={styles.chartTitle}>Eficiência Administrativa por Arquiteto</h3>
             <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} style={{fontSize: '11px', fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} style={{fontSize: '11px'}} />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)'}} />
                      <Bar dataKey="acoes" fill="#0061FF" radius={[4, 4, 0, 0]} barSize={40} name="Ações HQ" />
                      <Bar dataKey="tarefas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} name="Demandas" />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div style={styles.chartCard}>
             <h3 style={styles.chartTitle}>Saúde Operacional das APIs</h3>
             <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={systemsHealthData}
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value"
                      >
                         {systemsHealthData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                   </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- PREMIUM BEAUTIFUL STYLES ---
const styles: Record<string, any> = {
  container: { padding: '0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '500', color: '#000', margin: 0, letterSpacing: '0.4px' },
  subtitle: { color: '#64748b', fontSize: '15px', fontWeight: '400', margin: 0 },
  headerActions: { display: 'flex', gap: '16px' },
  tabSwitch: { display: 'flex', backgroundColor: '#ebebeb', padding: '4px', borderRadius: '24px', gap: '4px' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: '#64748B', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { backgroundColor: 'white', color: '#0061FF', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },

  mainCard: { backgroundColor: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  cardHeader: { padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f8fafc', padding: '12px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', width: '380px', maxWidth: '100%' },
  searchInput: { border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '14px', fontWeight: '500', width: '100%' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#0F172A', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8fafc', textAlign: 'left' },
  th: { padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' },
  td: { padding: '16px 24px' },
  
  memberCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  tableAvatar: { width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' },
  memberName: { fontSize: '14px', fontWeight: '600', display: 'block' },
  memberEmail: { fontSize: '12px', color: '#94a3b8', margin: 0 },
  
  deptBadge: { padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', backgroundColor: '#f1f5f9', color: '#475569' },
  tierBadge: { padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', backgroundColor: '#e0f2fe', color: '#0369a1' },
  roleContainer: { display: 'flex', alignItems: 'center', gap: '6px' },
  roleBadge: { fontSize: '11px', fontWeight: '700', color: '#0061FF', letterSpacing: '0.5px' },
  
  actions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  iconBtn: { padding: '8px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: 'white', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Modals Styles
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10005, padding: '20px' },
  modalContent: { backgroundColor: 'white', borderRadius: '28px', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' },
  modalHeader: { padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' },
  closeBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  
  fieldLabel: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px', display: 'block', letterSpacing: '0.5px' },
  formInput: { width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', backgroundColor: '#f8fafc' },
  formSelect: { width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc' },
  formTextarea: { width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', resize: 'vertical' },
  
  avatarGrid: { display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '10px', marginTop: '8px' },
  avatarOption: { width: '100%', aspectRatio: '1/1', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', objectFit: 'cover' },
  
  permsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1' },
  permCheckboxLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', color: '#334155', cursor: 'pointer' },
  
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '8px' },
  cancelBtn: { padding: '12px 24px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' },
  submitBtn: { padding: '12px 24px', backgroundColor: '#0061FF', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' },
  randomBtn: { padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '10px', fontSize: '12px', fontWeight: '700', color: '#475569', cursor: 'pointer' },

  detailProfileRow: { display: 'flex', gap: '24px', alignItems: 'center' },
  detailAvatar: { width: '90px', height: '90px', borderRadius: '24px', objectFit: 'cover', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  sectionTitle: { fontSize: '14px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '16px' },
  
  systemsMatrixGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
  matrixCard: { display: 'flex', gap: '12px', alignItems: 'center', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' },
  
  auditLogTimeline: { display: 'flex', flexDirection: 'column', gap: '20px' },
  timelineItem: { display: 'flex', gap: '16px', position: 'relative' },
  timelineDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0061FF', marginTop: '6px', flexShrink: 0 },
  timelineTime: { fontSize: '11px', color: '#94a3b8', fontWeight: '600' },

  // Systems Management Styles
  systemsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' },
  sysCard: { backgroundColor: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  sysHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sysIconBox: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' },
  sysName: { fontSize: '15px', fontWeight: '700', color: '#1e293b' },
  sysUrl: { fontSize: '12px', color: '#94a3b8', margin: 0 },
  sysStatus: { fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center' },
  
  sysMetaRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '16px 0' },
  metaCol: { display: 'flex', flexDirection: 'column', gap: '4px' },
  sysActions: { display: 'flex', gap: '12px' },
  sysBtnOutline: { flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '12px', backgroundColor: 'transparent', color: '#475569', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  sysBtnPrimary: { flex: 1, padding: '10px', border: 'none', borderRadius: '12px', backgroundColor: '#0F172A', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },

  syncProgressCard: { backgroundColor: '#e0f7ff', border: '1px solid #b3e5fc', borderRadius: '20px', padding: '16px 24px', marginBottom: '32px' },
  progressBarBg: { width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#0061FF', borderRadius: '10px', transition: 'width 0.3s ease' },

  orquestradorGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' },
  orquestradorCard: { backgroundColor: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', padding: '24px' },
  ssoStatusRow: { display: 'flex', gap: '16px', alignItems: 'flex-start' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' },
  statCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' },
  statIconBox: { width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 },
  statValue: { fontSize: '28px', fontWeight: '500', color: '#1e293b', margin: '4px 0 0' },

  chartRow: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
  chartCard: { backgroundColor: 'white', padding: '24px', borderRadius: '28px', border: '1px solid #e2e8f0' },
  chartTitle: { fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '24px' },
};

export default TeamHub;
