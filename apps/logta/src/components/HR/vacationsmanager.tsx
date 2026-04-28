import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Clock, Download, Plus, 
  Search, Filter, MoreVertical, CheckCircle2, 
  XCircle, AlertCircle, History, TrendingUp, 
  FileText, ArrowRight, Check, X, User,
  Stethoscope, Baby, ShieldAlert, AlertTriangle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '../../lib/toast';
import LogtaModal from '../Modal';
import ExportButton from '../ExportButton';

interface Vacation {
  id: string;
  employee_id: string;
  employee_name: string;
  position: string;
  start_date: string;
  end_date: string;
  days: number;
  status: 'AGENDADA' | 'APROVADA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA' | 'PENDENTE' | 'REJEITADA';
  observation?: string;
  created_at: string;
}

const VacationsManager: React.FC = () => {
  const { profile } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'lista' | 'calendario' | 'afastamentos' | 'historico'>('dashboard');
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [afastamentos, setAfastamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAfastamentoModalOpen, setIsAfastamentoModalOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'MASTER_ADMIN' || profile?.role === 'RH';

  const [newRequest, setNewRequest] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    days: 0,
    observation: ''
  });

  const [newAfastamento, setNewAfastamento] = useState({
    employee_id: '',
    type: 'DOENÇA',
    start_date: '',
    end_date: '',
    observation: ''
  });

  const fetchVacations = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      const mockVacations: Vacation[] = [
        { id: '1', employee_id: '101', employee_name: 'Ana Costa', position: 'Gerente Comercial', start_date: '2026-05-10', end_date: '2026-05-30', days: 20, status: 'AGENDADA', created_at: '2026-01-10' },
        { id: '2', employee_id: '102', employee_name: 'Thiago Silva', position: 'Motorista Jr', start_date: '2026-04-01', end_date: '2026-04-15', days: 15, status: 'EM_ANDAMENTO', created_at: '2026-01-15' },
        { id: '3', employee_id: '103', employee_name: 'Carla Nunes', position: 'Analista de RH', start_date: '2026-06-15', end_date: '2026-07-15', days: 30, status: 'PENDENTE', created_at: '2026-02-10' },
        { id: '4', employee_id: '104', employee_name: 'Marcos Braz', position: 'Supervisor Frota', start_date: '2026-03-01', end_date: '2026-03-10', days: 9, status: 'FINALIZADA', created_at: '2026-01-05' }
      ];

      const mockAfastamentos = [
        { id: 'a1', employee_name: 'Ricardo Dias', type: 'DOENÇA', start_date: '2026-04-15', end_date: '2026-04-25', status: 'ATIVO', doc: 'atestado_022.pdf' },
        { id: 'a2', employee_name: 'Julia Mendes', type: 'MATERNIDADE', start_date: '2026-02-01', end_date: '2026-06-01', status: 'ATIVO', doc: 'licenca_mat.pdf' },
      ];
      
      setVacations(isAdmin ? mockVacations : mockVacations.filter(v => v.employee_name === profile.full_name));
      setAfastamentos(mockAfastamentos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!profile?.company_id) return;
    try {
      const { data, error } = await supabase.from('employees').select('id, full_name, position').eq('company_id', profile.company_id);
      if (!error) setEmployees(data || []);
    } catch {
      /* lista opcional */
    }
  };

  useEffect(() => {
    fetchVacations();
    fetchEmployees();
  }, [profile]);

  const handleCreateRequest = async () => {
    if (!newRequest.employee_id || !newRequest.start_date || !newRequest.end_date) {
      toastError('Preencha os campos obrigatórios.');
      return;
    }
    toastSuccess('Férias solicitadas com sucesso! Aguarde aprovação.');
    setIsModalOpen(false);
    fetchVacations();
  };

  const handleCreateAfastamento = async () => {
    if (!newAfastamento.employee_id || !newAfastamento.start_date) {
      toastError('Dados incompletos.');
      return;
    }
    toastSuccess('Afastamento registrado no prontuário.');
    setIsAfastamentoModalOpen(false);
    fetchVacations();
  };

  const handleApprove = async (id: string) => {
    toastSuccess('Férias aprovadas!');
    fetchVacations();
  };

  const handleReject = async (id: string) => {
    toastError('Férias rejeitadas.');
    fetchVacations();
  };

  const stats = {
    total_on: vacations.filter(v => v.status === 'EM_ANDAMENTO').length,
    scheduled: vacations.filter(v => v.status === 'AGENDADA').length,
    afastados: afastamentos.filter(a => a.status === 'ATIVO').length,
    expired: 2
  };

  const chartData = [
    { name: 'Jan', v: 4 }, { name: 'Fev', v: 3 }, { name: 'Mar', v: 8 },
    { name: 'Abr', v: 12 }, { name: 'Mai', v: 15 }, { name: 'Jun', v: 10 }
  ];

  const statusPie = [
    { name: 'Aprovadas', value: 12, color: '#10b981' },
    { name: 'Pendentes', value: 5, color: '#f59e0b' },
    { name: 'Canceladas', value: 2, color: '#ef4444' }
  ];

  const styles = {
    section: { display: 'flex', flexDirection: 'column' as const, gap: '32px' },
    kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' },
    kpiCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', gap: '24px', alignItems: 'center' },
    kpiIcon: { width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    
    chartGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' },
    card: { backgroundColor: 'white', padding: '24px', borderRadius: '32px', border: '1px solid #E2E8F0' },
    cardTitle: { fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' },
    
    actionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    searchBox: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', width: '350px' },
    
    table: { width: '100%', borderCollapse: 'separate' as const, borderSpacing: '0 8px' },
    th: { textAlign: 'left' as const, padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' as const },
    tr: { backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '16px' },
    td: { padding: '16px', fontSize: '14px', fontWeight: '600' },
    
    statusBadge: (status: string) => {
      const colors: any = {
        'EM_ANDAMENTO': { bg: '#ecfdf5', text: '#10b981' },
        'ATIVO': { bg: '#fef2f2', text: '#ef4444' },
        'AGENDADA': { bg: '#eff6ff', text: '#3b82f6' },
        'PENDENTE': { bg: '#fff7ed', text: '#f97316' },
        'FINALIZADA': { bg: '#f8fafc', text: '#64748b' },
        'CANCELADA': { bg: '#fef2f2', text: '#ef4444' }
      };
      const c = colors[status] || { bg: '#f1f5f9', text: '#94a3b8' };
      return { backgroundColor: c.bg, color: c.text, padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '800' };
    },

    primaryBtn: { padding: '12px 24px', borderRadius: '14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '20px' },
    day: { aspectRatio: '1/1', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '8px', position: 'relative' as const },
    dayLabel: { fontSize: '12px', fontWeight: '800', color: '#94a3b8' }
  };

  const renderDashboard = () => (
    <div style={styles.section}>
       <div style={styles.kpiRow}>
          <div style={styles.kpiCard}>
             <div style={{...styles.kpiIcon, backgroundColor: '#ecfdf5', color: '#10b981'}}><Users size={24} /></div>
             <div><p style={{fontSize: '11px', fontWeight: '800', color: '#94a3b8', margin: 0}}>De Férias Agora</p><p style={{fontSize: '28px', fontWeight: '950', margin: 0}}>{stats.total_on}</p></div>
          </div>
          <div style={styles.kpiCard}>
             <div style={{...styles.kpiIcon, backgroundColor: '#eff6ff', color: '#3b82f6'}}><Calendar size={24} /></div>
             <div><p style={{fontSize: '11px', fontWeight: '800', color: '#94a3b8', margin: 0}}>Previsão (30 Dias)</p><p style={{fontSize: '28px', fontWeight: '950', margin: 0}}>{stats.scheduled}</p></div>
          </div>
          <div style={styles.kpiCard}>
             <div style={{...styles.kpiIcon, backgroundColor: '#fef2f2', color: '#ef4444'}}><Stethoscope size={24} /></div>
             <div><p style={{fontSize: '11px', fontWeight: '800', color: '#94a3b8', margin: 0}}>Afastados Hoje</p><p style={{fontSize: '28px', fontWeight: '950', margin: 0}}>{stats.afastados}</p></div>
          </div>
          <div style={styles.kpiCard}>
             <div style={{...styles.kpiIcon, backgroundColor: '#fffbeb', color: '#f59e0b'}}><AlertCircle size={24} /></div>
             <div><p style={{fontSize: '11px', fontWeight: '800', color: '#94a3b8', margin: 0}}>Pendentes RH</p><p style={{fontSize: '28px', fontWeight: '950', margin: 0}}>05</p></div>
          </div>
       </div>

       <div style={styles.chartGrid}>
          <div style={{...styles.chartCol, gap: '24px'}}>
             <div style={styles.card}>
                <h3 style={styles.cardTitle}><TrendingUp size={20} color="var(--primary)" /> Sazonalidade de Ausências</h3>
                <div style={{height: '300px'}}>
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                         <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                         <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                         <Bar dataKey="v" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={24} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div style={styles.card}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                   <h3 style={{...styles.cardTitle, marginBottom: 0}}><History size={20} color="#10b981" /> Controle de Saldo Estratégico</h3>
                   <button style={{border: 'none', background: 'none', color: 'var(--primary)', fontWeight: '800', fontSize: '12px', cursor: 'pointer'}}>Ver todos</button>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                   {[
                     { name: 'Ricardo Dias', days: 12, total: 30, color: '#3b82f6' },
                     { name: 'Ana Costa', days: 25, total: 30, color: '#10b981' },
                     { name: 'Thiago Silva', days: 0, total: 30, color: '#94a3b8' },
                   ].map((s, i) => (
                     <div key={i}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', fontWeight: '800'}}>
                           <span>{s.name}</span>
                           <span style={{color: '#64748b'}}>{s.days} / {s.total} dias</span>
                        </div>
                        <div style={{width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden'}}>
                           <div style={{width: `${(s.days/s.total)*100}%`, height: '100%', backgroundColor: s.color, borderRadius: '4px'}} />
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <div style={{...styles.chartCol, gap: '24px'}}>
             {/* ⚠️ ALERTAS INTELIGENTES */}
             <div style={{...styles.card, border: '2px solid #ef4444'}}>
                <h3 style={{...styles.cardTitle, color: '#ef4444'}}><AlertTriangle size={20} /> Alertas Operacionais</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                   <div style={{padding: '16px', backgroundColor: '#fef2f2', borderRadius: '16px', border: '1px solid #fee2e2'}}>
                      <p style={{margin: 0, fontSize: '13px', fontWeight: '900', color: '#991b1b'}}>Conflito de Escala</p>
                      <p style={{margin: '4px 0 0 0', fontSize: '11px', color: '#ef4444'}}>Setor Logístico com 3 motoristas solicitando férias para a mesma quinzena.</p>
                   </div>
                   <div style={{padding: '16px', backgroundColor: '#fffbeb', borderRadius: '16px', border: '1px solid #fef3c7'}}>
                      <p style={{margin: 0, fontSize: '13px', fontWeight: '900', color: '#92400e'}}>Férias Vencidas</p>
                      <p style={{margin: '4px 0 0 0', fontSize: '11px', color: '#b45309'}}>Carlos Silva possui 30 dias de saldo vencidos há mais de 12 meses.</p>
                   </div>
                   <div style={{padding: '16px', backgroundColor: '#eff6ff', borderRadius: '16px', border: '1px solid #dbeafe'}}>
                      <p style={{margin: 0, fontSize: '13px', fontWeight: '900', color: '#1e40af'}}>Retorno Próximo</p>
                      <p style={{margin: '4px 0 0 0', fontSize: '11px', color: '#3b82f6'}}>Thiago Silva retorna das férias em 48 horas. Preparar check-in.</p>
                   </div>
                </div>
             </div>

             <div style={styles.card}>
                <h3 style={styles.cardTitle}><CheckCircle2 size={20} color="#10b981" /> Solicitações Pendentes</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                   {vacations.filter(v => v.status === 'PENDENTE').map(v => (
                     <div key={v.id} style={{padding: '16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                           <div>
                              <p style={{margin: 0, fontWeight: '850', fontSize: '13px'}}>{v.employee_name}</p>
                              <p style={{margin: 0, fontSize: '11px', color: '#94a3b8'}}>{v.days} dias solicitados</p>
                           </div>
                           <button style={{padding: '6px 12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer'}}>ANALISAR</button>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', fontWeight: '700'}}>
                           <Calendar size={12} /> {new Date(v.start_date).toLocaleDateString()} a {new Date(v.end_date).toLocaleDateString()}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderList = () => (
    <div style={styles.section}>
       <div style={styles.actionRow}>
          <div style={styles.searchBox}>
             <Search size={18} color="#94a3b8" />
             <input placeholder="Buscar colaborador..." style={{border: 'none', background: 'none', outline: 'none', width: '100%'}} />
          </div>
          <div style={{display: 'flex', gap: '12px'}}>
             <ExportButton filename="Relatorio-Ferias" />
             <button style={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
                <Plus size={18} /> Solicitar Férias
             </button>
          </div>
       </div>

       <div style={{overflowX: 'auto'}}>
          <table style={styles.table}>
             <thead>
                <tr>
                   <th style={styles.th}>Colaborador</th>
                   <th style={styles.th}>Período</th>
                   <th style={styles.th}>Saldo Restante</th>
                   <th style={styles.th}>Status</th>
                   <th style={{...styles.th, textAlign: 'right'}}>Ações</th>
                </tr>
             </thead>
             <tbody>
                {vacations.map(v => (
                   <tr key={v.id} style={styles.tr}>
                      <td style={styles.td}>
                         <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                            <div style={{width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><User size={16} color="var(--primary)" /></div>
                            <div><p style={{margin: 0, fontWeight: '800'}}>{v.employee_name}</p><p style={{margin: 0, fontSize: '11px', color: '#94a3b8'}}>{v.position}</p></div>
                         </div>
                      </td>
                      <td style={styles.td}>
                         <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <span>{new Date(v.start_date).toLocaleDateString()}</span>
                            <ArrowRight size={14} color="#cbd5e1" />
                            <span>{new Date(v.end_date).toLocaleDateString()}</span>
                         </div>
                      </td>
                      <td style={styles.td}>{30 - v.days} Dias</td>
                      <td style={styles.td}>
                         <span style={styles.statusBadge(v.status)}>{v.status}</span>
                      </td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                         <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                            {v.status === 'PENDENTE' && (
                               <>
                                 <button onClick={() => handleApprove(v.id)} style={{padding: '8px', borderRadius: '10px', border: '1px solid #10b981', color: '#10b981', backgroundColor: 'transparent', cursor: 'pointer'}}><Check size={16} /></button>
                                 <button onClick={() => handleReject(v.id)} style={{padding: '8px', borderRadius: '10px', border: '1px solid #ef4444', color: '#ef4444', backgroundColor: 'transparent', cursor: 'pointer'}}><X size={16} /></button>
                               </>
                            )}
                            <button onClick={() => { setSelectedVacation(v); setIsDetailOpen(true); }} style={{padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b', backgroundColor: 'transparent', cursor: 'pointer'}}><FileText size={16} /></button>
                         </div>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderAfastamentos = () => (
    <div style={styles.section}>
       <div style={styles.actionRow}>
          <div style={styles.searchBox}>
             <Search size={18} color="#94a3b8" />
             <input placeholder="Filtrar afastamentos..." style={{border: 'none', background: 'none', outline: 'none', width: '100%'}} />
          </div>
          <button style={{...styles.primaryBtn, backgroundColor: '#ef4444'}} onClick={() => setIsAfastamentoModalOpen(true)}>
             <ShieldAlert size={18} /> Registrar Afastamento
          </button>
       </div>

       <div style={styles.tableCard}>
          <table style={styles.table}>
             <thead>
                <tr>
                   <th style={styles.th}>Colaborador</th>
                   <th style={styles.th}>Motivo / CID</th>
                   <th style={styles.th}>Período</th>
                   <th style={styles.th}>Status</th>
                   <th style={styles.th}>Atestado</th>
                </tr>
             </thead>
             <tbody>
                {afastamentos.map(a => (
                   <tr key={a.id} style={styles.tr}>
                      <td style={styles.td}>{a.employee_name}</td>
                      <td style={styles.td}>
                         <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            {a.type === 'DOENÇA' ? <Stethoscope size={16} color="#ef4444"/> : <Baby size={16} color="#8b5cf6"/>}
                            {a.type}
                         </div>
                      </td>
                      <td style={styles.td}>{new Date(a.start_date).toLocaleDateString()} - {new Date(a.end_date).toLocaleDateString()}</td>
                      <td style={styles.td}><span style={styles.statusBadge(a.status)}>{a.status}</span></td>
                      <td style={styles.td}><button style={{border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px'}}><FileText size={14} /> Ver Doc</button></td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderCalendar = () => (
    <div style={styles.card}>
       <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
          <h3 style={{margin: 0, fontWeight: '950'}}>Mapa Estratégico de Ausências</h3>
          <div style={{display: 'flex', gap: '16px'}}>
             <span style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#3b82f6'}}><div style={{width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#3b82f6'}} /> Férias</span>
             <span style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#ef4444'}}><div style={{width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#ef4444'}} /> Afastamentos</span>
          </div>
       </div>
       <div style={styles.calendarGrid}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => <div key={d} style={{textAlign: 'center', fontSize: '11px', fontWeight: '900', color: '#94a3b8', padding: '10px'}}>{d}</div>)}
          {Array.from({length: 30}).map((_, i) => (
             <div key={i} style={styles.day}>
                <span style={styles.dayLabel}>{i + 1}</span>
                {i === 10 && <div style={{marginTop: '4px', padding: '4px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '9px', fontWeight: '900', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden'}}>Ana Costa</div>}
                {i === 15 && <div style={{marginTop: '4px', padding: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '9px', fontWeight: '900', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden'}}>Ricardo D.</div>}
             </div>
          ))}
       </div>
    </div>
  );

  return (
    <div style={{paddingTop: '20px'}}>
        <div style={{display: 'flex', gap: '8px', marginBottom: '32px', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '20px', width: 'fit-content', border: '1px solid #e2e8f0'}}>
           {[
             { id: 'dashboard', label: 'Monitor Inteligente', icon: TrendingUp },
             { id: 'lista', label: 'Gestão de Férias', icon: Calendar },
             { id: 'afastamentos', label: 'Afastamentos & Atestados', icon: Stethoscope },
             { id: 'calendario', label: 'Calendário Equipe', icon: History }
           ].map(tab => (
             <button 
                key={tab.id} 
                onClick={() => setActiveView(tab.id as any)}
                style={{
                   padding: '10px 20px', border: 'none', borderRadius: '16px', background: activeView === tab.id ? 'white' : 'none', cursor: 'pointer',
                   color: activeView === tab.id ? 'var(--primary)' : '#64748b',
                   fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
                   boxShadow: activeView === tab.id ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                   transition: 'all 0.3s'
                }}
             >
                <tab.icon size={16} /> {tab.label}
             </button>
           ))}
        </div>

       {activeView === 'dashboard' && renderDashboard()}
       {activeView === 'lista' && renderList()}
       {activeView === 'afastamentos' && renderAfastamentos()}
       {activeView === 'calendario' && renderCalendar()}
       {activeView === 'historico' && renderList()}

       <LogtaModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title="Nova Solicitação de Férias" 
          width="600px"
       >
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px'}}>
             <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{fontSize: '13px', fontWeight: '800', color: '#64748b'}}>Selecionar Colaborador</label>
                <select 
                   style={{padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', width: '100%'}}
                   value={newRequest.employee_id}
                   onChange={e => setNewRequest({...newRequest, employee_id: e.target.value})}
                >
                   <option value="">Selecione...</option>
                   {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
             </div>

             <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                   <label style={{fontSize: '13px', fontWeight: '800', color: '#64748b'}}>Início</label>
                   <input type="date" style={{padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none'}} value={newRequest.start_date} onChange={e => setNewRequest({...newRequest, start_date: e.target.value})} />
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                   <label style={{fontSize: '13px', fontWeight: '800', color: '#64748b'}}>Término</label>
                   <input type="date" style={{padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none'}} value={newRequest.end_date} onChange={e => setNewRequest({...newRequest, end_date: e.target.value})} />
                </div>
             </div>

             <button style={{...styles.primaryBtn, width: '100%', padding: '16px', fontSize: '15px', justifyContent: 'center'}} onClick={handleCreateRequest}>
                ENVIAR SOLICITAÇÃO PARA APROVAÇÃO
             </button>
          </div>
       </LogtaModal>

       <LogtaModal 
          isOpen={isAfastamentoModalOpen} 
          onClose={() => setIsAfastamentoModalOpen(false)} 
          title="Registrar Novo Afastamento" 
          width="600px"
       >
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px'}}>
             <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{fontSize: '13px', fontWeight: '800', color: '#64748b'}}>Colaborador</label>
                <select style={{padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', width: '100%'}} onChange={e => setNewAfastamento({...newAfastamento, employee_id: e.target.value})}>
                   <option value="">Selecione...</option>
                   {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
             </div>
             <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{fontSize: '13px', fontWeight: '800', color: '#64748b'}}>Tipo de Afastamento</label>
                <select style={{padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', width: '100%'}} onChange={e => setNewAfastamento({...newAfastamento, type: e.target.value})}>
                   <option value="DOENÇA">Doença (Atestado)</option>
                   <option value="MATERNIDADE">Licença Maternidade</option>
                   <option value="ACIDENTE">Acidente de Trabalho</option>
                   <option value="OUTROS">Outros</option>
                </select>
             </div>
             <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <input type="date" style={{padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0'}} />
                <input type="date" style={{padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0'}} />
             </div>
             <button style={{...styles.primaryBtn, width: '100%', padding: '16px', fontSize: '15px', justifyContent: 'center', backgroundColor: '#ef4444'}} onClick={handleCreateAfastamento}>
                CONFIRMAR REGISTRO DE AFASTAMENTO
             </button>
          </div>
       </LogtaModal>

       <LogtaModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalhes das Férias" width="500px">
          {selectedVacation && (
             <div style={{padding: '10px'}}>
                <div style={{backgroundColor: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9', marginBottom: '24px'}}>
                   <p style={{fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px'}}>STATUS ATUAL</p>
                   <span style={styles.statusBadge(selectedVacation.status)}>{selectedVacation.status}</span>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                   <div style={{display: 'flex', justifyContent: 'space-between'}}><span style={{fontWeight: '700', color: '#64748b'}}>Colaborador</span><span style={{fontWeight: '800'}}>{selectedVacation.employee_name}</span></div>
                   <div style={{display: 'flex', justifyContent: 'space-between'}}><span style={{fontWeight: '700', color: '#64748b'}}>Dias Totais</span><span style={{fontWeight: '800'}}>{selectedVacation.days} Dias</span></div>
                </div>
                <div style={{marginTop: '32px', display: 'flex', gap: '12px'}}>
                   <button style={{flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'transparent', fontWeight: '800', cursor: 'pointer'}} onClick={() => setIsDetailOpen(false)}>Fechar</button>
                   <button style={{flex: 1, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontWeight: '800', cursor: 'pointer'}} onClick={() => toastSuccess('Processando cancelamento...')}>Cancelar</button>
                </div>
             </div>
          )}
       </LogtaModal>
    </div>
  );
};

export default VacationsManager;
