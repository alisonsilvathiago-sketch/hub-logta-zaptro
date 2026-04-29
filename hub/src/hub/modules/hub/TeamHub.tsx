import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, Edit2, Trash2, Shield, ShieldCheck, ShieldAlert,
  Mail, Phone, Clock, MoreVertical, Key, RefreshCw, Filter, Activity,
  Database, Globe, Ban, CheckCircle2, X, Save, Lock, Layout, Users, 
  Settings, BarChart3, Trophy, Target, Zap, Plus, ArrowUpRight, 
  ArrowDownRight, Star
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '@core/lib/supabase';
import { useAuth } from '@core/context/AuthContext';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import LogtaModal from '@shared/components/Modal';
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
  };
}

interface PerformanceStat {
  staff_id: string;
  full_name: string;
  tier: string;
  actions_24h: number;
  tasks_done: number;
  tasks_pending: number;
}

interface MasterTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  complexity: number;
  assigned_to: string;
  due_date: string;
}

const TeamHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'membros';
  const setActiveTab = (tab: string) => setSearchParams({ tab });

  return (
    <div style={styles.container} className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Centro de Comando: Equipe Master</h1>
          <p style={styles.subtitle}>Gestão de talentos, performance HQ e orquestração de demandas.</p>
        </div>
        <div style={styles.headerActions}>
           <div style={styles.tabSwitch}>
              {[
                { id: 'membros', label: 'Arquitetos HQ', icon: Users },
                { id: 'performance', label: 'Métricas & Score', icon: BarChart3 },
                { id: 'tarefas', label: 'Demandas HQ', icon: Layout },
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
      {activeTab === 'performance' && <PerformanceContent />}
      {activeTab === 'tarefas' && <TasksContent />}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const StaffManagementContent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(20);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('master_staff').select('*, profile:profile_id(full_name, email)', { count: 'exact' });
      if (itemsPerPage !== 'all') {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);
      }
      const { data, error, count } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setStaff(data || []);
      setTotalItems(count || 0);
    } catch (err) {
      toastError('Erro ao carregar time HQ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [currentPage, itemsPerPage]);

  return (
    <div className="animate-slide-up">
       <div style={styles.mainCard}>
          <div style={styles.cardHeader}>
             <div style={styles.searchBox}>
                <Search size={18} color="#94a3b8" />
                <input 
                   placeholder="Localizar arquiteto..." 
                   style={styles.searchInput} 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <button style={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
                <UserPlus size={18} /> Integrar Novo Membro
             </button>
          </div>
          <div style={styles.tableWrapper}>
             <table style={styles.table}>
                <thead>
                   <tr style={styles.thead}>
                      <th style={styles.th}>IDENTIDADE MASTER</th>
                      <th style={styles.th}>TIER / PRIVILÉGIO</th>
                      <th style={styles.th}>STATUS</th>
                      <th style={{...styles.th, textAlign: 'right'}}>AÇÕES</th>
                   </tr>
                </thead>
                <tbody>
                   {staff.filter(s => s.profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map(member => (
                      <tr key={member.id} style={styles.tr}>
                         <td style={styles.td}>
                            <div style={styles.memberCell}>
                               <div style={styles.avatar}>{(member.profile?.full_name || 'U')[0]}</div>
                               <div>
                                  <strong style={styles.memberName}>{member.profile?.full_name}</strong>
                                  <p style={styles.memberEmail}>{member.profile?.email}</p>
                               </div>
                            </div>
                         </td>
                         <td style={styles.td}>
                            <div style={styles.roleContainer}>
                               <Shield size={14} color="#6366F1" />
                               <span style={styles.roleBadge}>{member.tier}</span>
                            </div>
                         </td>
                         <td style={styles.td}>
                            <span style={{
                               padding: '4px 10px', 
                               borderRadius: '20px', 
                               fontSize: '10px', 
                               fontWeight: '800',
                               backgroundColor: member.status === 'ativo' ? '#ecfdf5' : '#fef2f2',
                               color: member.status === 'ativo' ? '#10b981' : '#ef4444'
                            }}>{member.status.toUpperCase()}</span>
                         </td>
                         <td style={{...styles.td, textAlign: 'right'}}>
                            <div style={styles.actions}>
                               <button style={styles.iconBtn}><Key size={16} /></button>
                               <button style={{...styles.iconBtn, color: '#ef4444'}}><Trash2 size={16} /></button>
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
    </div>
  );
};

const PerformanceContent: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStat[]>([]);
  const fetchData = async () => {
    const { data } = await supabase.from('staff_performance_summary').select('*');
    setStats(data || []);
  };
  useEffect(() => { fetchData(); }, []);

  const performanceData = stats.map(s => ({
    name: (s.full_name || 'Staff').split(' ')[0],
    acoes: s.actions_24h,
    tarefas: s.tasks_done
  }));

  return (
    <div className="animate-slide-up">
       <div style={styles.statsGrid}>
          <div style={styles.statCard}>
             <div style={{...styles.statIconBox, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1'}}><Trophy size={20} /></div>
             <div style={styles.statInfo}>
                <p style={styles.statLabel}>Eficiência Global</p>
                <h3 style={styles.statValue}>98.2%</h3>
             </div>
          </div>
          <div style={styles.statCard}>
             <div style={{...styles.statIconBox, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}><Zap size={20} /></div>
             <div style={styles.statInfo}>
                <p style={styles.statLabel}>Ações HQ / 24h</p>
                <h3 style={styles.statValue}>{stats.reduce((acc, c) => acc + c.actions_24h, 0)}</h3>
             </div>
          </div>
          <div style={styles.statCard}>
             <div style={{...styles.statIconBox, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B'}}><Star size={20} /></div>
             <div style={styles.statInfo}>
                <p style={styles.statLabel}>Demandas Concluídas</p>
                <h3 style={styles.statValue}>{stats.reduce((acc, c) => acc + c.tasks_done, 0)}</h3>
             </div>
          </div>
       </div>

       <div style={styles.chartRow}>
          <div style={styles.chartCard}>
             <h3 style={styles.chartTitle}>Atividade por Arquiteto (Protocolos HQ)</h3>
             <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} style={{fontSize: '11px', fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} style={{fontSize: '11px'}} />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)'}} />
                      <Bar dataKey="acoes" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div style={styles.chartCard}>
             <h3 style={styles.chartTitle}>Distribuição de Tiers HQ</h3>
             <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={[
                          { name: 'SUPER ADMIN', value: stats.filter(s => s.tier === 'SUPER_ADMIN').length || 1 },
                          { name: 'ADMIN', value: stats.filter(s => s.tier === 'ADMIN').length || 1 },
                          { name: 'OPERATOR', value: stats.filter(s => s.tier === 'OPERATOR').length || 1 },
                        ]}
                        innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                      >
                         {['#6366F1', '#10b981', '#f59e0b'].map((color, i) => <Cell key={i} fill={color} />)}
                      </Pie>
                      <Tooltip />
                   </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
       </div>
    </div>
  );
};

const TasksContent: React.FC = () => {
  const [tasks, setTasks] = useState<MasterTask[]>([]);
  useEffect(() => {
    const fetchTasks = async () => {
      const { data } = await supabase.from('master_tasks').select('*').order('created_at', { ascending: false });
      setTasks(data || []);
    };
    fetchTasks();
  }, []);

  return (
    <div className="animate-slide-up">
       <div style={styles.taskGrid}>
          {['Pendente', 'Em Andamento', 'Concluido'].map(status => (
            <div key={status} style={styles.taskColumn}>
               <div style={styles.colHeader}>
                  <span style={styles.colLabel}>{status.toUpperCase()}</span>
                  <span style={styles.countBadge}>{tasks.filter(t => t.status === status).length}</span>
               </div>
               <div style={styles.taskList}>
                  {tasks.filter(t => t.status === status).map(task => (
                    <div key={task.id} style={styles.taskCard}>
                       <div style={{...styles.priorityDot, backgroundColor: task.priority === 'Alta' ? '#ef4444' : '#6366F1'}} />
                       <h4 style={styles.taskTitle}>{task.title}</h4>
                       <p style={styles.taskDesc}>{task.description}</p>
                       <div style={styles.taskFooter}>
                          <div style={styles.taskMeta}><Clock size={12} /> {new Date(task.due_date).toLocaleDateString()}</div>
                          <div style={styles.miniAvatar}>T</div>
                       </div>
                    </div>
                  ))}
                  <button style={styles.addTaskBtn}><Plus size={14} /> Nova Demanda HQ</button>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '500', color: '#000', margin: 0, letterSpacing: '0.4px' },
  subtitle: { color: '#64748b', fontSize: '15px', fontWeight: '400', margin: 0 },
  headerActions: { display: 'flex', gap: '16px' },
  tabSwitch: { display: 'flex', backgroundColor: '#ebebeb', padding: '4px', borderRadius: '24px', gap: '4px' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: '#64748B', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { backgroundColor: 'white', color: '#6366F1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },

  mainCard: { backgroundColor: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  cardHeader: { padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f8fafc', padding: '12px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', width: '350px' },
  searchInput: { border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '14px', fontWeight: '500', width: '100%' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#0F172A', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '600', cursor: 'pointer' },
  
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8fafc', textAlign: 'left' },
  th: { padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px 24px' },
  memberCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' },
  memberName: { fontSize: '14px', fontWeight: '600', display: 'block' },
  memberEmail: { fontSize: '12px', color: '#94a3b8', margin: 0 },
  roleContainer: { display: 'flex', alignItems: 'center', gap: '6px' },
  roleBadge: { fontSize: '11px', fontWeight: '700', color: '#6366F1', letterSpacing: '0.5px' },
  actions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  iconBtn: { padding: '8px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: 'white', color: '#64748b', cursor: 'pointer' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' },
  statCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' },
  statIconBox: { width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 },
  statValue: { fontSize: '28px', fontWeight: '500', color: '#1e293b', margin: '4px 0 0' },

  chartRow: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
  chartCard: { backgroundColor: 'white', padding: '24px', borderRadius: '28px', border: '1px solid #e2e8f0' },
  chartTitle: { fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '24px' },

  taskGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  taskColumn: { display: 'flex', flexDirection: 'column', gap: '16px' },
  colHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' },
  colLabel: { fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px' },
  countBadge: { backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  taskCard: { backgroundColor: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0', position: 'relative' },
  priorityDot: { width: '8px', height: '8px', borderRadius: '50%', position: 'absolute', top: '20px', right: '20px' },
  taskTitle: { fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' },
  taskDesc: { fontSize: '12px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.5' },
  taskFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' },
  taskMeta: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', fontWeight: '600' },
  miniAvatar: { width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' },
  addTaskBtn: { padding: '12px', borderRadius: '16px', border: '1px dashed #cbd5e1', backgroundColor: 'transparent', color: '#64748b', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }
};

export default TeamHub;
