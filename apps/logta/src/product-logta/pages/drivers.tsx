import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Users, User, Phone, Mail, MapPin, Search, Plus, Filter, Download, 
  Truck, Package, Activity, Clock, Heart, ShieldAlert, Star, 
  History as HistoryIcon, Calendar, ArrowLeft, ArrowRight, TrendingUp, AlertCircle,
  MoreVertical, FileText, CheckCircle2, MessageCircle, DollarSign, Wrench, ShieldCheck,
  AlertTriangle, Navigation, Crown, Award, ChevronRight, Info, Shield, Layout,
  SlidersHorizontal, Target, Zap, BarChart3, Medal, Flame, Eye, Trash2, Upload, Ban
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell, PieChart, Pie, CartesianGrid, Legend
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import LogtaModal from '../../components/Modal';
import MetricCard from '../../components/MetricCard';
import { toastSuccess, toastError } from '../../lib/toast';
import ModuleLayout from '../../layouts/ModuleLayout';

interface Driver {
  id: string;
  full_name: string;
  type: 'Motorista' | 'Agregado';
  phone: string;
  email: string;
  status: 'DISPONIVEL' | 'EM_ROTA' | 'INDISPONIVEL' | 'PENDENTE';
  position: string;
  hiring_date: string;
  cnh_number?: string;
  cnh_category?: string;
  cnh_expiry?: string;
  health_score?: number;
  performance_score?: number;
  current_vehicle?: string;
  last_activity?: string;
  deliveries?: number;
  on_time_rate?: number;
  avg_delivery_time?: string;
  occurrences?: number;
}

interface DocItem {
  id: string;
  driver_id: string;
  driver_name: string;
  type: 'CNH' | 'Exame Toxicológico' | 'PGR' | 'Treinamento NR' | 'Seguro';
  number: string;
  expiry: string;
  status: 'VALIDO' | 'EXPIRANDO' | 'VENCIDO';
}

const Drivers: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { tab, id } = useParams<{ tab: string, id: string }>();

  const activeTab = tab || 'lista';

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const fetchData = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      const mockDrivers: Driver[] = [
        { id: '1', full_name: 'Claudio Ferreira', type: 'Motorista', phone: '(11) 98877-6655', email: 'claudio@logta.com', status: 'EM_ROTA', position: 'Motorista Pesado', hiring_date: '2023-01-15', cnh_number: '123456789', cnh_category: 'E', cnh_expiry: '2026-12-20', health_score: 95, performance_score: 98, current_vehicle: 'BRA-2E19', last_activity: 'Porto de Santos', deliveries: 154, on_time_rate: 99.2, avg_delivery_time: '0h 42m', occurrences: 0 },
        { id: '2', full_name: 'Marcos Souza', type: 'Motorista', phone: '(11) 97766-5544', email: 'marcos@logta.com', status: 'DISPONIVEL', position: 'Motorista Distribuição', hiring_date: '2023-05-20', cnh_number: '987654321', cnh_category: 'D', cnh_expiry: '2027-05-15', health_score: 88, performance_score: 92, current_vehicle: '-', last_activity: 'Base Central', deliveries: 128, on_time_rate: 94.5, avg_delivery_time: '0h 55m', occurrences: 1 },
        { id: '3', full_name: 'José Lima', type: 'Agregado', phone: '(11) 96655-4433', email: 'jose@frete.com', status: 'EM_ROTA', position: 'Agregado Urbano', hiring_date: '2024-02-10', cnh_number: '456789123', cnh_category: 'C', cnh_expiry: '2025-01-10', health_score: 92, performance_score: 85, current_vehicle: 'KDT-9912', last_activity: 'Curitiba - PR', deliveries: 95, on_time_rate: 88.0, avg_delivery_time: '1h 10m', occurrences: 2 },
        { id: '4', full_name: 'Ricardo Alves', type: 'Motorista', phone: '(11) 95544-3322', email: 'ricardo@logta.com', status: 'INDISPONIVEL', position: 'Motorista Pesado', hiring_date: '2022-11-05', cnh_number: '321654987', cnh_category: 'E', cnh_expiry: '2026-04-05', health_score: 75, performance_score: 80, current_vehicle: '-', last_activity: 'Licença Médica', deliveries: 210, on_time_rate: 91.2, avg_delivery_time: '0h 48m', occurrences: 4 },
        { id: '5', full_name: 'Ana Paula Santos', type: 'Motorista', phone: '(11) 94433-2211', email: 'ana@logta.com', status: 'PENDENTE', position: 'Motorista Logística', hiring_date: '2024-04-01', cnh_number: '789123456', cnh_category: 'D', cnh_expiry: '2026-04-22', health_score: 100, performance_score: 0, current_vehicle: '-', last_activity: 'Integração', deliveries: 0, on_time_rate: 0, avg_delivery_time: '-', occurrences: 0 },
      ];
      setDrivers(mockDrivers);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [profile?.company_id]);

  const handleTabChange = (tabId: string) => navigate(`/motoristas/${tabId}`);

  const mockDocs: DocItem[] = [
    { id: 'd1', driver_id: '1', driver_name: 'Claudio Ferreira', type: 'CNH', number: '123456789', expiry: '2026-12-20', status: 'VALIDO' },
    { id: 'd2', driver_id: '1', driver_name: 'Claudio Ferreira', type: 'Exame Toxicológico', number: 'TX-9921', expiry: '2026-08-15', status: 'VALIDO' },
    { id: 'd3', driver_id: '3', driver_name: 'José Lima', type: 'CNH', number: '456789123', expiry: '2026-01-10', status: 'EXPIRANDO' },
    { id: 'd4', driver_id: '4', driver_name: 'Ricardo Alves', type: 'PGR', number: 'NR-221', expiry: '2024-03-20', status: 'VENCIDO' },
    { id: 'd5', driver_id: '2', driver_name: 'Marcos Souza', type: 'CNH', number: '987654321', expiry: '2027-05-15', status: 'VALIDO' },
  ];

  const stats = useMemo(() => {
    return {
      total: drivers.length,
      active: drivers.filter(d => d.status === 'DISPONIVEL').length,
      inRoute: drivers.filter(d => d.status === 'EM_ROTA').length,
      pending: drivers.filter(d => d.status === 'PENDENTE').length,
      totalDeliveries: drivers.reduce((acc, d) => acc + (d.deliveries || 0), 0),
      avgTime: '0h 52m',
      onTimeAvg: 92.4,
      totalOccurrences: drivers.reduce((acc, d) => acc + (d.occurrences || 0), 0),
      avgEquipe: '88.5',
      // Document stats
      docRegular: 12,
      docExpiring: 2,
      docExpired: 1,
      blockedDrivers: 2
    };
  }, [drivers]);

  const renderLista = () => (
    <div style={styles.tabContent} className="animate-fade-in">
        <div style={styles.kpiGrid}>
          <MetricCard 
            title="Total Motoristas" 
            value={stats.total} 
            subtitle="Membros na base" 
            trend="Ativo" 
            icon={Users} 
            iconBg="#f1f5f9" 
            iconColor="#64748b"
            sparkData={[stats.total - 2, stats.total - 1, stats.total]}
          />
          <MetricCard 
            title="Disponíveis" 
            value={stats.active} 
            subtitle="Prontos para escala" 
            trend="Normal" 
            icon={CheckCircle2} 
            iconBg="#ecfdf5" 
            iconColor="#10b981"
            sparkData={[stats.active - 1, stats.active + 1, stats.active]}
          />
          <MetricCard 
            title="Em Rota Agora" 
            value={stats.inRoute} 
            subtitle="Monitorando" 
            trend="Tempo Real" 
            icon={Navigation} 
            iconBg="#eff6ff" 
            iconColor="#3b82f6"
            sparkData={[stats.inRoute - 2, stats.inRoute + 3, stats.inRoute]}
          />
          <MetricCard 
            title="Docs Pendentes" 
            value={stats.pending} 
            subtitle="Ação necessária" 
            trend="Atenção" 
            trendNeg 
            icon={ShieldAlert} 
            iconBg="#fffbeb" 
            iconColor="#f59e0b"
            sparkData={[stats.pending + 1, stats.pending - 1, stats.pending]}
          />
        </div>

       <div style={styles.heroWrapper}>
          <div style={styles.heroContent}>
             <h1 style={styles.heroTitle}>Gestão de Pessoas Operacionais</h1>
             <p style={styles.heroText}>Monitoramento de performance, conformidade de CNH e inteligência de escala para sua logística.</p>
             <div style={styles.heroActions}>
                <button style={styles.primaryBtn} onClick={() => setIsAddModalOpen(true)}><Plus size={18} /> Novo Motorista</button>
                <button style={styles.secondaryBtn}><Download size={18} /> Exportar Base</button>
             </div>
          </div>
          <div style={styles.heroVisual}>
             <div style={styles.awardCard}>
                <Award size={24} color="#f59e0b" />
                <div><p style={{margin:0, fontSize:'11px', fontWeight:900, color:'#f59e0b'}}>MOTORISTA DO MÊS</p><p style={{margin:0, fontWeight:700, color:'white'}}>Claudio Ferreira</p></div>
             </div>
          </div>
       </div>

       <div style={styles.filterRow}>
          <div style={styles.searchBox}>
             <Search size={18} color="#94a3b8" />
             <input placeholder="Buscar por nome, CPF ou placa..." style={styles.searchInput} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button style={styles.miniBtn}><SlidersHorizontal size={16} /> Filtros</button>
       </div>

       <div style={styles.tableCard}>
          <table style={styles.table}>
             <thead>
                <tr>
                   <th style={styles.th}>Motorista / Identidade</th>
                   <th style={styles.th}>Vínculo</th>
                   <th style={styles.th}>Status Doc</th>
                   <th style={styles.th}>Situação Operacional</th>
                   <th style={styles.th}>Score IA</th>
                   <th style={styles.th}>Ações</th>
                </tr>
             </thead>
             <tbody>
                {drivers.filter(d => d.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map(driver => (
                   <tr key={driver.id} style={styles.tr}>
                      <td style={styles.td}>
                         <div style={styles.userCell}>
                            <div style={styles.avatarMini}>{driver.full_name[0]}</div>
                            <div><p style={styles.uName}>{driver.full_name}</p><p style={styles.uSub}>CPF: ***.***.***-**</p></div>
                         </div>
                      </td>
                      <td style={styles.td}><span style={{...styles.badge, backgroundColor: driver.type === 'Agregado' ? '#f5f3ff' : '#eff6ff', color: driver.type === 'Agregado' ? '#8b5cf6' : '#3b82f6'}}>{driver.type}</span></td>
                      <td style={styles.td}>
                         <div style={{display:'flex', alignItems:'center', gap: 6}}>
                            {driver.status === 'PENDENTE' ? <AlertCircle size={14} color="#f59e0b" /> : <ShieldCheck size={14} color="#10b981" />}
                            <span style={{fontSize:'12px', fontWeight:700, color: driver.status === 'PENDENTE' ? '#f59e0b' : '#10b981'}}>
                               {driver.status === 'PENDENTE' ? 'Pendências' : 'Regular'}
                            </span>
                         </div>
                      </td>
                      <td style={styles.td}>
                         <div style={{...styles.statusTag, backgroundColor: driver.status === 'DISPONIVEL' ? '#ecfdf5' : driver.status === 'EM_ROTA' ? '#eff6ff' : '#fef2f2', color: driver.status === 'DISPONIVEL' ? '#10b981' : driver.status === 'EM_ROTA' ? '#3b82f6' : '#ef4444'}}>
                            {driver.status.replace('_', ' ')}
                         </div>
                      </td>
                      <td style={styles.td}>
                         <div style={styles.performanceRow}>
                            <div style={{...styles.performanceBar, width: `${driver.performance_score}%`, backgroundColor: (driver.performance_score || 0) > 90 ? '#10b981' : (driver.performance_score || 0) > 70 ? '#3b82f6' : '#ef4444'}} />
                            <span style={{fontSize:'12px', fontWeight:900}}>{driver.performance_score}%</span>
                         </div>
                      </td>
                      <td style={styles.td}><button style={styles.iconBtn} onClick={() => navigate(`/motoristas/perfil/${driver.id}`)}><ChevronRight size={18} /></button></td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderPerformance = () => (
    <div style={styles.tabContent} className="animate-fade-in">
        <div style={styles.kpiGrid}>
          <MetricCard 
            title="Total Entregas" 
            value={stats.totalDeliveries} 
            subtitle="No período" 
            icon={Package} 
            iconBg="#eff6ff" 
            iconColor="#3b82f6"
            sparkData={[stats.totalDeliveries - 100, stats.totalDeliveries - 50, stats.totalDeliveries]}
          />
          <MetricCard 
            title="No Prazo (%)" 
            value={`${stats.onTimeAvg}%`} 
            subtitle="Eficiência SLA" 
            trend="Meta Batida" 
            icon={Target} 
            iconBg="#ecfdf5" 
            iconColor="#10b981"
            sparkData={[90, 91, 92.4, 92.4]}
          />
          <MetricCard 
            title="Ocorrências" 
            value={stats.totalOccurrences} 
            subtitle="Reportadas" 
            trend="Atenção" 
            trendNeg 
            icon={AlertTriangle} 
            iconBg="#fef2f2" 
            iconColor="#ef4444"
            sparkData={[stats.totalOccurrences + 2, stats.totalOccurrences - 1, stats.totalOccurrences]}
          />
          <MetricCard 
            title="Score Equipe" 
            value={stats.avgEquipe} 
            subtitle="Média Geral" 
            trend="Excelente" 
            icon={Award} 
            iconBg="#eff6ff" 
            iconColor="#3b82f6"
            sparkData={[85, 87, 88.5, 88.5]}
          />
        </div>

       <div style={styles.perfMainGrid}>
          <div style={{display:'flex', flexDirection:'column', gap: 24}}>
             <div style={styles.tableCard}>
                <div style={styles.cardHeader}>
                   <h3 style={styles.chartTitle}><Medal size={20} color="#f59e0b" /> Ranking de Performance</h3>
                   <div style={styles.actions}><button style={styles.miniBtn}><Calendar size={14} /> Abril 2026</button></div>
                </div>
                <table style={styles.table}>
                   <thead>
                      <tr>
                         <th style={styles.th}>Posição</th>
                         <th style={styles.th}>Motorista</th>
                         <th style={styles.th}>Entregas</th>
                         <th style={styles.th}>Pontualidade</th>
                         <th style={styles.th}>Nota</th>
                      </tr>
                   </thead>
                   <tbody>
                      {drivers.filter(d => (d.performance_score || 0) > 0).sort((a,b) => (b.performance_score || 0) - (a.performance_score || 0)).map((d, i) => (
                         <tr key={d.id} style={styles.tr}>
                            <td style={styles.td}><div style={{...styles.rankBadge, backgroundColor: i === 0 ? '#fefce8' : i === 1 ? '#f8fafc' : '#fff7ed', color: i === 0 ? '#f59e0b' : '#64748b'}}>#{i+1}</div></td>
                            <td style={styles.td}><strong>{d.full_name}</strong></td>
                            <td style={styles.td}>{d.deliveries}</td>
                            <td style={styles.td}><span style={{color: (d.on_time_rate || 0) > 95 ? '#10b981' : '#f59e0b', fontWeight: 700}}>{d.on_time_rate}%</span></td>
                            <td style={styles.td}><div style={{display:'flex', alignItems:'center', gap:8}}><div style={{...styles.performanceBarMini, width: `${d.performance_score}%`, backgroundColor: '#3b82f6'}} /><span style={{fontWeight: 800}}>{d.performance_score}</span></div></td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap: 24}}>
             <div style={styles.highlightCard}>
                <h3 style={styles.chartTitle}><Flame size={20} color="#ef4444" /> Destaques do Mês</h3>
                <div style={styles.highlightList}>
                   <div style={styles.highlightItem}><Medal size={28} color="#f59e0b" /><div><p style={styles.hLabel}>TOP PONTUALIDADE</p><p style={styles.hValue}>Claudio Ferreira (99.2%)</p></div></div>
                   <div style={styles.highlightItem}><Zap size={28} color="#8b5cf6" /><div><p style={styles.hLabel}>MAIS EFICIENTE</p><p style={styles.hValue}>Marcos Souza (0h 48m)</p></div></div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderDocumentos = () => (
    <div style={styles.tabContent} className="animate-fade-in">
       {/* 🔝 1. KPIs (Visão de Risco) */}
        <div style={styles.kpiGrid}>
          <MetricCard 
            title="Docs Conformidade" 
            value="92%" 
            subtitle="Base Regular" 
            icon={ShieldCheck} 
            iconBg="#ecfdf5" 
            iconColor="#10b981"
            sparkData={[88, 90, 92, 92]}
          />
          <MetricCard 
            title="Vencendo (30d)" 
            value={stats.docExpiring} 
            subtitle="Ação Requerida" 
            trend="Alerta" 
            trendNeg 
            icon={AlertTriangle} 
            iconBg="#fffbeb" 
            iconColor="#f59e0b"
            sparkData={[stats.docExpiring + 1, stats.docExpiring]}
          />
          <MetricCard 
            title="Documentos Vencidos" 
            value={stats.docExpired} 
            subtitle="Crítico" 
            trend="Bloqueio" 
            trendNeg 
            icon={ShieldAlert} 
            iconBg="#fef2f2" 
            iconColor="#ef4444"
            sparkData={[stats.docExpired + 1, stats.docExpired]}
          />
          <MetricCard 
            title="Bloqueio Operacional" 
            value={stats.blockedDrivers} 
            subtitle="Impedidos" 
            icon={Ban} 
            iconBg="#f1f5f9" 
            iconColor="#0f172a"
            sparkData={[stats.blockedDrivers - 1, stats.blockedDrivers]}
          />
        </div>

       {/* HERO & ACTIONS */}
       <div style={styles.filterRow}>
          <div style={styles.searchBox}>
             <Search size={18} color="#94a3b8" />
             <input placeholder="Filtrar por motorista ou documento..." style={styles.searchInput} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div style={styles.actions}>
             <button style={styles.primaryBtn} onClick={() => setIsDocModalOpen(true)}><Upload size={18} /> Novo Documento</button>
             <button style={styles.miniBtn}><Filter size={16} /> Status</button>
          </div>
       </div>

       {/* LISTA DE DOCUMENTOS */}
       <div style={styles.tableCard}>
          <div style={styles.cardHeader}>
             <h3 style={styles.chartTitle}><FileText size={20} color="var(--primary)" /> Repositório de Documentação Legal</h3>
          </div>
          <table style={styles.table}>
             <thead>
                <tr>
                   <th style={styles.th}>Motorista</th>
                   <th style={styles.th}>Tipo de Documento</th>
                   <th style={styles.th}>Número/Ref</th>
                   <th style={styles.th}>Data de Validade</th>
                   <th style={styles.th}>Status</th>
                   <th style={styles.th}>Ações</th>
                </tr>
             </thead>
             <tbody>
                {mockDocs.map(doc => (
                   <tr key={doc.id} style={styles.tr}>
                      <td style={styles.td}><strong>{doc.driver_name}</strong></td>
                      <td style={styles.td}><span style={styles.badgeGray}>{doc.type}</span></td>
                      <td style={styles.td}>{doc.number}</td>
                      <td style={styles.td}>{new Date(doc.expiry).toLocaleDateString('pt-BR')}</td>
                      <td style={styles.td}>
                         <div style={{...styles.statusTag, backgroundColor: doc.status === 'VALIDO' ? '#ecfdf5' : doc.status === 'EXPIRANDO' ? '#fffbeb' : '#fef2f2', color: doc.status === 'VALIDO' ? '#10b981' : doc.status === 'EXPIRANDO' ? '#f59e0b' : '#ef4444'}}>
                            {doc.status}
                         </div>
                      </td>
                      <td style={styles.td}>
                         <div style={{display:'flex', gap: 8}}>
                            <button style={styles.iconBtn}><Eye size={16} /></button>
                            <button style={styles.iconBtn}><Download size={16} /></button>
                         </div>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>

       {/* ALERTAS INTELIGENTES */}
       <div style={{...styles.chartCard, border:'1.5px dashed #f1f5f9', backgroundColor:'#f8fafc'}}>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:16}}>
             <Info size={18} color="var(--primary)" />
             <h3 style={styles.chartTitle}>Insights de Conformidade</h3>
          </div>
          <ul style={{margin:0, paddingLefty: 20, color:'#475569', fontSize:'13px', display:'flex', flexDirection:'column', gap:8}}>
             <li><strong>Bloqueio Automático:</strong> Os motoristas <strong>Ricardo Alves</strong> e <strong>José Lima</strong> foram impedidos de receber novas rotas devido a documentos vencidos ou expirando em menos de 48h.</li>
             <li><strong>Alerta de Expiração:</strong> 02 exames toxicológicos vencem na próxima semana. Notificações automáticas foram enviadas via Logta App.</li>
          </ul>
       </div>
    </div>
  );

  const navItems = [
    { id: 'lista', label: 'Equipe de Motoristas', icon: Users },
    { id: 'performance', label: 'Dashboard de Performance', icon: Award },
    { id: 'documentos', label: 'Gestão de Documentos', icon: ShieldCheck },
  ];

  const modulePageTitle =
    navItems.find((item) => item.id === activeTab)?.label ?? 'Gestão de Pessoas Operacionais';

  return (
    <ModuleLayout
      title={modulePageTitle}
      badge="LOGTA HUMAN RESOURCES"
      items={navItems}
      activeTab={tab || 'lista'}
      onTabChange={handleTabChange}
    >
      <div style={styles.container}>
        {activeTab === 'lista' && renderLista()}
        {activeTab === 'performance' && renderPerformance()}
        {activeTab === 'documentos' && renderDocumentos()}
        {activeTab === 'profile' && <div>Carregando Perfil Detalhado...</div>}
      </div>

      {/* MODAL ADICIONAR DOCUMENTO */}
      <LogtaModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} title="📂 Upload de Documento Legal" width="500px">
          <form style={styles.form} onSubmit={e => { e.preventDefault(); toastSuccess('Documento salvo!'); setIsDocModalOpen(false); }}>
             <div style={styles.inputGroup}><label style={styles.labelForm}>Motorista Responsável</label><select style={styles.formInput}>{drivers.map(d=><option key={d.id}>{d.full_name}</option>)}</select></div>
             <div style={styles.inputGroup}><label style={styles.labelForm}>Tipo de Documento</label><select style={styles.formInput}><option>CNH</option><option>Exame Toxicológico</option><option>PGR</option><option>Treinamento NR</option><option>Seguro</option></select></div>
             <div style={styles.formGrid2}>
                <div style={styles.inputGroup}><label style={styles.labelForm}>Número/Ref</label><input style={styles.formInput} placeholder="Ex: 123456" /></div>
                <div style={styles.inputGroup}><label style={styles.labelForm}>Data de Validade</label><input type="date" style={styles.formInput} /></div>
             </div>
             <div style={{...styles.uploadBox, cursor: 'pointer'}} onClick={()=>toastSuccess('Selecione um arquivo...')}>
                <Upload size={24} color="#94a3b8" />
                <p style={{margin:0, fontSize:'12px', color:'#94a3b8', fontWeight:700}}>Arraste ou clique para upload (PDF/PNG)</p>
             </div>
             <button type="submit" style={styles.saveBtnFull}>Salvar e Validar Documento</button>
          </form>
      </LogtaModal>

      <LogtaModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="➕ Novo Cadastro de Motorista" width="600px">
          <form style={styles.form} onSubmit={e => { e.preventDefault(); toastSuccess('Motorista cadastrado!'); setIsAddModalOpen(false); }}>
             <div style={styles.formRow}><div style={styles.inputGroup}><label style={styles.labelForm}>Nome Completo</label><input style={styles.formInput} placeholder="Nome do motorista" required /></div></div>
             <div style={styles.formGrid2}><div style={styles.inputGroup}><label style={styles.labelForm}>CPF</label><input style={styles.formInput} placeholder="000.000.000-00" /></div><div style={styles.inputGroup}><label style={styles.labelForm}>Telefone</label><input style={styles.formInput} placeholder="(00) 00000-0000" /></div></div>
             <button type="submit" style={styles.saveBtnFull}>Finalizar Cadastro</button>
          </form>
      </LogtaModal>
    </ModuleLayout>
  );
};

const styles: Record<string, any> = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  kpiCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  kpiInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  kpiLabel: { fontSize: '10px', fontWeight: '900', color: '#94a3b8', margin: 0, textTransform: 'uppercase' },
  kpiValue: { fontSize: '26px', fontWeight: '950', color: '#0f172a', margin: 0 },
  kpiSub: { fontSize: '11px', color: '#94a3b8', fontWeight: 700 },
  kpiSubSuccess: { fontSize: '11px', color: '#10b981', fontWeight: 800 },
  kpiSubPrimary: { fontSize: '11px', color: '#3b82f6', fontWeight: 800 },
  kpiSubWarning: { fontSize: '11px', color: '#f59e0b', fontWeight: 800 },
  kpiSubDanger: { fontSize: '11px', color: '#ef4444', fontWeight: 800 },
  kpiIconWrapper: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  heroWrapper: { position: 'relative', width: '100%', minHeight: '320px', borderRadius: '32px', backgroundColor: '#0f172a', overflow: 'hidden', padding: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  heroContent: { flex: 1, color: 'white' },
  heroTitle: { fontSize: '36px', fontWeight: 950, margin: 0, letterSpacing: '-1.5px' },
  heroText: { fontSize: '16px', opacity: 0.7, maxWidth: '500px', margin: '16px 0 24px 0' },
  heroActions: { display: 'flex', gap: '16px' },
  primaryBtn: { height:'48px', padding: '0 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  secondaryBtn: { height:'48px', padding: '0 24px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  
  heroVisual: { flex: 1, display: 'flex', justifyContent: 'flex-end' },
  awardCard: { padding: '20px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', display: 'flex', gap: '16px', alignItems: 'center', backdropFilter: 'blur(10px)' },

  filterRow: { display: 'flex', gap: '16px' },
  searchBox: { flex: 1, height: '52px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', fontWeight: '600', width: '100%' },
  miniBtn: { height: '52px', padding: '0 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', fontWeight: 800, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 },

  perfMainGrid: { display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' },
  tableCard: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  cardHeader: { padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px 24px', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '20px 24px', fontSize: '14px', borderBottom: '1px solid #f1f5f9' },
  tr: { transition: 'background-color 0.2s', '&:hover': { backgroundColor: '#f8fafc' } },

  rankBadge: { width:'32px', height:'32px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:950 },
  performanceBarMini: { height: '6px', borderRadius: '3px', flex: 1, minWidth: '60px', backgroundColor: '#f1f5f9' },

  chartCard: { backgroundColor: 'white', padding: '32px', borderRadius: '32px', border: '1px solid #e2e8f0' },
  chartTitle: { fontSize: '18px', fontWeight: '950', margin: 0, display: 'flex', alignItems: 'center', gap: 10 },
  
  highlightCard: { backgroundColor: 'white', padding: '32px', borderRadius: '32px', border: '1px solid #e2e8f0' },
  highlightList: { display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' },
  highlightItem: { padding: '20px', borderRadius: '20px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px' },
  hLabel: { fontSize: '10px', fontWeight: '900', color: '#94a3b8', margin: 0 },
  hValue: { fontSize: '14px', fontWeight: '800', color: '#1e293b', margin: 0 },

  badgeGray: { padding:'4px 8px', backgroundColor:'#f1f5f9', color:'#64748b', fontSize:'11px', fontWeight:800, borderRadius:'6px' },
  uploadBox: { height:'140px', border:'2px dashed #e2e8f0', borderRadius:'16px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, backgroundColor:'#f8fafc' },

  userCell: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatarMini: { width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px' },
  uName: { margin: 0, fontWeight: 900, fontSize: '15px' },
  uSub: { margin: 0, fontSize: '12px', color: '#94a3b8' },
  badge: { padding: '5px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' },
  statusTag: { padding: '5px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 900, width: 'fit-content' },
  performanceRow: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1 },
  performanceBar: { height: '6px', borderRadius: '3px', flex: 1, backgroundColor: '#f1f5f9' },
  iconBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },

  form: { padding: '12px', display:'flex', flexDirection:'column', gap:'20px' },
  formRow: { display:'flex', flexDirection:'column', gap:'8px' },
  formGrid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' },
  inputGroup: { display:'flex', flexDirection:'column', gap:'8px' },
  labelForm: { fontSize:'11px', fontWeight:900, color:'#64748b', textTransform:'uppercase' },
  formInput: { height:'48px', padding:'0 16px', borderRadius:'12px', border:'1px solid #e2e8f0', outline:'none', fontSize:'14px', fontWeight:600 },
  saveBtnFull: { height:'52px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'16px', fontWeight:900, fontSize:'15px', cursor:'pointer' }
};

export default Drivers;
