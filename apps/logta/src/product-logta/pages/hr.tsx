import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Users, Heart, Activity, ShieldAlert, Flame, Plus,
  Settings, Search, Filter, Download, 
  Mail, Phone, MapPin, Calendar, Clock, ChevronRight,
  TrendingUp, TrendingDown, AlertCircle, FileText,
  UserPlus, MoreVertical, Edit2, Trash2, CheckCircle2,
  X, Briefcase, GraduationCap, ShieldCheck, MessageSquare,
  FileCheck, AlertTriangle, Truck, Radar, Target, Trophy, Zap, Star,
  Fingerprint, Camera, History, LogIn, LogOut, Folder, Upload,
  ThumbsUp, ThumbsDown, Flag, Eye
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar
} from 'recharts';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '../../lib/toast';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { supabase } from '../../lib/supabase';
import LogtaModal from '../../components/Modal';
import MetricCard from '../../components/MetricCard';
import VacationsManager from '../../components/HR/VacationsManager';
import ModuleLayout from '../../layouts/ModuleLayout';

// --- Types ---
interface Employee {
  id: string;
  full_name: string;
  position: string;
  type: 'Funcionário' | 'Motorista' | 'Agregado';
  email: string;
  phone: string;
  status: 'Ativo' | 'Inativo' | 'Afastado';
  health_score?: number;
  hiring_date: string;
  cnh_number?: string;
  cnh_expiry?: string;
  address?: string;
  photo_url?: string;
  perf?: number;
}

const HR: React.FC = () => {
  const { company } = useTenant();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { tab } = useParams<{ tab: string }>();

  const activeTab = tab || 'dashboard';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  
  const initialEmployeeState = {
    full_name: '',
    phone: '',
    position: '',
    type: 'Funcionário' as any,
    email: '',
    hiring_date: new Date().toISOString().split('T')[0]
  };

  const [newEmployee, setNewEmployee] = useState(initialEmployeeState);

  const fetchData = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      // High-fidelity mock data for HR
      const mockEmployees: Employee[] = [
        { id: '1', full_name: 'Cláudio Ferreira', position: 'Motorista Carreteiro', type: 'Motorista', email: 'claudio@logta.com', phone: '(11) 98765-4321', status: 'Ativo', health_score: 95, hiring_date: '2023-01-10', perf: 4.9 },
        { id: '2', full_name: 'Ana Rosa Lins', position: 'Analista de Logística', type: 'Funcionário', email: 'ana.rosa@logta.com', phone: '(11) 91234-5678', status: 'Ativo', health_score: 88, hiring_date: '2023-05-15', perf: 4.7 },
        { id: '3', full_name: 'Marcos Souza', position: 'Motorista de Distribuição', type: 'Motorista', email: 'marcos@logta.com', phone: '(11) 99887-7665', status: 'Ativo', health_score: 92, hiring_date: '2024-02-20', perf: 4.5 },
        { id: '4', full_name: 'Julia Silva', position: 'Gerente Operacional', type: 'Funcionário', email: 'julia@logta.com', phone: '(11) 95544-3322', status: 'Ativo', health_score: 98, hiring_date: '2022-11-01', perf: 5.0 },
        { id: '5', full_name: 'Ricardo Dias', position: 'Auxiliar de Depósito', type: 'Funcionário', email: 'ricardo@logta.com', phone: '(11) 94433-2211', status: 'Afastado', health_score: 65, hiring_date: '2023-08-12', perf: 3.8 },
      ];
      setEmployees(mockEmployees);
    } catch (err: any) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const timer = setTimeout(() => setShowCheckin(true), 15000);
    return () => clearTimeout(timer);
  }, [profile?.company_id]);

  const handleTabChange = (tabId: string) => {
    navigate(`/rh/${tabId}`);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    toastSuccess('Protótipo: Colaborador adicionado!');
    setIsAddModalOpen(false);
  };

  const renderDashboard = () => (
    <div style={styles.tabContent} className="animate-fade-in">
        <div style={styles.kpiGrid}>
          <MetricCard 
            title="Total Colaboradores" 
            value={employees.length} 
            subtitle="Equipe ativa" 
            trend="+4 este mês" 
            icon={Users} 
            iconBg="#f5f3ff" 
            iconColor="#8b5cf6"
            sparkData={[42, 45, 44, 48, 47, 49, 50]}
          />
          <MetricCard 
            title="Presentes Hoje" 
            value={Math.floor(employees.length * 0.85)} 
            subtitle="85% da força total" 
            trend="Normal" 
            icon={CheckCircle2} 
            iconBg="#ecfdf5" 
            iconColor="#10b981"
            sparkData={[38, 40, 42, 41, 39, 42, 42]}
          />
          <MetricCard 
            title="Faltas / Atrasos" 
            value="04" 
            subtitle="Atenção necessária" 
            trend="Alerta" 
            trendNeg 
            icon={AlertCircle} 
            iconBg="#fef2f2" 
            iconColor="#ef4444"
            sparkData={[2, 1, 3, 2, 4, 3, 4]}
          />
          <MetricCard 
            title="Férias Ativas" 
            value="03" 
            subtitle="Escala programada" 
            trend="Estável" 
            icon={Calendar} 
            iconBg="#eff6ff" 
            iconColor="#3b82f6"
            sparkData={[2, 3, 2, 4, 3, 2, 3]}
          />
        </div>

       <div style={styles.dashboardMainGrid}>
          <div style={styles.chartCol}>
             <div style={styles.chartCard}>
                <div style={styles.cardHeader}>
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <h3 style={{fontSize: '16px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '8px'}}><Clock size={18} color="var(--primary)" /> Presença do Dia</h3>
                   </div>
                </div>
                <div style={{padding: '0 24px 24px'}}>
                   {[
                      { name: 'João Silva', time: '07:54', status: 'DENTRO', role: 'Motorista' },
                      { name: 'Maria Santos', time: '08:12', status: 'DENTRO', role: 'Operacional' },
                      { name: 'Ricardo Dias', time: '--:--', status: 'ATRASADO', role: 'Motorista' },
                   ].map((p, i) => (
                      <div key={i} style={{display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #f1f5f9'}}>
                         <div style={styles.avatarMini}>{p.name[0]}</div>
                         <div style={{flex: 1}}><p style={styles.uName}>{p.name}</p><p style={styles.uSub}>{p.role}</p></div>
                         <div style={{textAlign: 'right'}}><p style={{margin:0, fontWeight:900}}>{p.time}</p><span style={{fontSize:'10px', color: p.status==='ATRASADO'?'#ef4444':'#10b981'}}>{p.status}</span></div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
          <div style={styles.chartCol}>
             <div style={{...styles.chartCard, border: '1px solid #fee2e2'}}>
                <div style={{...styles.cardHeader, backgroundColor: '#fef2f2'}}><h3 style={{color:'#991b1b'}}><ShieldAlert size={18} /> Alertas de Gestão</h3></div>
                <div style={{padding: '24px', display:'flex', flexDirection:'column', gap:'16px'}}>
                   <div style={styles.incidentAlert}><AlertTriangle size={18} /> CNH de Marcos Souza vence em 12 dias.</div>
                   <div style={{...styles.incidentAlert, color:'#92400e', backgroundColor:'#fffbeb'}}><FileText size={18} /> 4 exames periódicos pendentes.</div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderEmployees = () => (
    <div style={styles.tabContent} className="animate-fade-in">
       <div style={styles.filterBar}>
          <div style={styles.searchBox}><Search size={18} color="#94a3b8" /><input placeholder="Buscar colaborador..." style={styles.searchInput} /></div>
          <button style={styles.btnPrimary} onClick={() => setIsAddModalOpen(true)}><Plus size={16} /> Admitir</button>
       </div>
       <div style={styles.tableCard}>
          <table style={styles.table}>
             <thead><tr><th style={styles.th}>Nome / Cargo</th><th style={styles.th}>Tipo</th><th style={styles.th}>Status</th><th style={styles.th}>Performance</th><th style={styles.th}>Ações</th></tr></thead>
             <tbody>
                {employees.map(emp => (
                   <tr key={emp.id}>
                      <td style={styles.td}>
                         <div style={styles.userCell}>
                            <div style={styles.avatar}>{emp.full_name[0]}</div>
                            <div><p style={styles.uName}>{emp.full_name}</p><p style={styles.uSub}>{emp.position}</p></div>
                         </div>
                      </td>
                      <td style={styles.td}>{emp.type}</td>
                      <td style={styles.td}><span style={{color: emp.status==='Ativo'?'#10b981':'#ef4444', fontWeight:800}}>{emp.status}</span></td>
                      <td style={styles.td}><strong>{emp.perf}/5.0</strong></td>
                      <td style={styles.td}><button style={styles.iconBtn} onClick={() => { setSelectedEmployee(emp); setIsDetailModalOpen(true); }}><Eye size={16} /></button></td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderHealth = () => (
    <div style={styles.tabContent} className="animate-fade-in">
       <div style={{...styles.chartCard, border: '2px solid #ef4444'}}>
          <div style={{...styles.cardHeader, backgroundColor: '#fef2f2'}}><h3 style={{color: '#991b1b'}}><ShieldAlert size={20} /> Módulo Saúde & Segurança (NRs)</h3></div>
          <div style={{padding: '24px'}}>
             <div style={styles.kpiGrid}>
                <MetricCard 
                  title="ASO Vencendo" 
                  value="12" 
                  subtitle="Próximos 30 dias" 
                  trend="Crítico" 
                  trendNeg 
                  icon={Activity} 
                  iconBg="#fffbeb" 
                  iconColor="#f59e0b"
                  sparkData={[8, 10, 12, 11, 14, 12, 12]}
                />
                <MetricCard 
                  title="Treinamentos NR" 
                  value="94%" 
                  subtitle="Conformidade total" 
                  trend="Excelente" 
                  icon={GraduationCap} 
                  iconBg="#ecfdf5" 
                  iconColor="#10b981"
                  sparkData={[85, 88, 90, 92, 93, 94, 94]}
                />
             </div>
             <div style={{marginTop:'32px'}}>
                <h4 style={{fontWeight:950}}>Radar de Compliance</h4>
                <div style={{height:'350px'}}>
                   <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                         { subject: 'Treinamentos', A: 85 }, { subject: 'Exames', A: 98 }, { subject: 'EPIs', A: 90 }, { subject: 'Documentação', A: 70 }, { subject: 'Incidentes', A: 95 }
                      ]}>
                         <PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="subject" /><PolarRadiusAxis angle={30} domain={[0, 100]} />
                         <RechartsRadar name="Conformidade" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} />
                      </RadarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const navItems = [
    { id: 'dashboard', label: 'Resumo', icon: TrendingUp },
    { id: 'colaboradores', label: 'Equipe', icon: Users },
    { id: 'saude', label: 'Saúde & Segurança', icon: ShieldCheck },
    { id: 'ponto', label: 'Ponto', icon: Clock },
    { id: 'ferias', label: 'Férias', icon: Calendar },
    { id: 'documentos', label: 'Documentos', icon: FileCheck },
    { id: 'notas', label: 'Conduta', icon: MessageSquare },
  ];

  /** Título do miolo conforme a aba (rótulo da navegação, com exceção do dashboard). */
  const modulePageTitle =
    activeTab === 'dashboard'
      ? 'Gente & Cultura'
      : navItems.find((item) => item.id === activeTab)?.label ?? 'Gestão de Capital Humano';

  return (
    <ModuleLayout
      title={modulePageTitle}
      badge="RECURSOS HUMANOS"
      items={navItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      <div style={styles.container}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'colaboradores' && renderEmployees()}
        {activeTab === 'saude' && renderHealth()}
        {activeTab === 'ferias' && <VacationsManager />}
        {/* Placeholder for other tabs during overhaul */}
        {!['dashboard', 'colaboradores', 'saude', 'ferias'].includes(activeTab) && (
           <div style={{padding:'40px', textAlign:'center'}}><h2>Módulo em Integração</h2><p>Esta aba está sendo migrada para a nova arquitetura Logta.</p></div>
        )}
      </div>

      <LogtaModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Novo Colaborador" width="600px">
         <div style={{padding:'24px'}}>Formulários de admissão aqui...</div>
      </LogtaModal>

      <LogtaModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Perfil do Colaborador" width="800px">
         {selectedEmployee && (
            <div style={{padding:'24px'}}>
               <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
                  <div style={styles.avatar}>{selectedEmployee.full_name[0]}</div>
                  <div><h2 style={{margin:0}}>{selectedEmployee.full_name}</h2><p style={{margin:0}}>{selectedEmployee.position}</p></div>
               </div>
            </div>
         )}
      </LogtaModal>
    </ModuleLayout>
  );
};

const styles: Record<string, any> = {
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' },
  kpiCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  kpiInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  kpiLabel: { fontSize: '12px', fontWeight: '700', color: '#94a3b8', margin: 0 },
  kpiValue: { fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 },
  kpiIconWrapper: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dashboardMainGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' },
  chartCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  chartCard: { backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  cardHeader: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9' },
  avatarMini: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' },
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '12px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', width: '400px' },
  searchInput: { border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '14px' },
  btnPrimary: { padding: '12px 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)', fontSize: '14px' },
  btnSecondary: { padding: '10px 20px', backgroundColor: 'var(--primary-glow)', border: '1px solid rgba(124, 58, 237, 0.2)', color: 'var(--primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
  btnBlack: { padding: '12px 24px', backgroundColor: '#000000', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', fontSize: '14px' },
  tableCard: { backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px 24px', fontSize: '14px', borderBottom: '1px solid #f1f5f9', color: '#475569' },
  userCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' },
  uName: { fontWeight: '800', color: '#1e293b', margin: 0 },
  uSub: { fontSize: '12px', color: '#94a3b8', margin: 0 },
  iconBtn: { padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#94a3b8' },
  incidentAlert: { display: 'flex', gap: '12px', padding: '14px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', color: '#991b1b', fontSize: '13px', fontWeight: '800' }
};

export default HR;
