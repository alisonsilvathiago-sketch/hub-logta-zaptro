import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createAuditLog } from '../../utils/audit';
import {
  Users,
  Target,
  History as HistoryIcon,
  Plus,
  Search,
  Filter,
  MoreVertical,
  AlertTriangle,
  Star,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Download,
  FileText,
  TrendingUp,
  Layout,
  Kanban,
  List,
  CheckCircle2,
  Clock,
  X,
  Save,
  ArrowRight,
  DollarSign,
  User,
  Building,
  Truck,
  Wallet,
  Calendar,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  Navigation,
  Edit3,
  Trash2,
  PieChart as PieIcon,
  BarChart as BarIcon,
  LineChart as LineIcon,
  Activity as ActivityIcon,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Briefcase as BriefcaseIcon,
  Eye,
  UserPlus,
  BarChart3,
  ChevronDown,
  Zap,
  UserCheck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import ExportButton from '../../components/ExportButton';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '../../lib/toast';
import LogtaModal from '../../components/Modal';
import MetricCard from '../../components/MetricCard';
import ModuleLayout from '../../layouts/ModuleLayout';
import EmptyState from '../../components/EmptyState';
import LogtaCalendar from '../../components/Calendar';

// --- Types ---
interface Lead {
  id: string;
  company_name: string;
  responsible_name: string;
  email: string;
  phone: string;
  status: 'FIRST_CONTACT' | 'NEGOTIATION' | 'PROPOSAL' | 'CLOSED' | 'LOST';
  estimated_value?: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cnpj_cpf: string;
  segment: string;
}

const CRM: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = useMemo(() => {
    const segments = location.pathname.split('/');
    const last = segments[segments.length - 1];
    if (last === 'crm') return 'inteligencia';
    return last || 'inteligencia';
  }, [location.pathname]);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Form State
  const [newLead, setNewLead] = useState({
    company_name: '',
    responsible_name: '',
    email: '',
    phone: '',
    estimated_value: '',
    status: 'FIRST_CONTACT' as Lead['status']
  });

  const onTabChange = (id: string) => {
    if (id === 'inteligencia') navigate('/crm');
    else navigate(`/crm/${id}`);
  };

  const fetchData = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      const { data: leadData } = await supabase.from('leads').select('*').eq('company_id', profile.company_id);
      setLeads(leadData || []);
      const { data: clientData } = await supabase.from('clients').select('*').eq('company_id', profile.company_id);
      setClients(clientData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.company_id]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    setLoadingAction(true);
    const toastId = toastLoading('Salvando lead...');

    try {
      const { error } = await supabase
        .from('leads')
        .insert([{
          company_id: profile.company_id,
          ...newLead,
          estimated_value: parseFloat(newLead.estimated_value) || 0
        }]);

      if (error) throw error;

      // Log de Auditoria
      await createAuditLog({
        company_id: profile.company_id,
        user_id: profile.id,
        module: 'CRM',
        action: 'CREATE',
        details: `Novo Lead prospectado: ${newLead.company_name} (R$ ${newLead.estimated_value})`
      });

      toastDismiss(toastId);
      toastSuccess('Lead cadastrado com sucesso!');
      setIsDetailModalOpen(false);
      setNewLead({
        company_name: '', responsible_name: '', email: '', phone: '',
        estimated_value: '', status: 'FIRST_CONTACT'
      });
      fetchData();
    } catch (err: any) {
      toastDismiss(toastId);
      toastError(`Erro: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, status: Lead['status']) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', leadId);
      
      if (error) throw error;

      // Log de Auditoria
      await createAuditLog({
        company_id: profile.company_id!,
        user_id: profile.id,
        module: 'CRM',
        action: 'UPDATE',
        details: `Status do Lead alterado para: ${status}`
      });

      toastSuccess('Status atualizado!');
      setIsDetailModalOpen(false);
      fetchData();
    } catch (err: any) {
      toastError('Erro ao atualizar status');
    }
  };

  const handleConvertToClient = async (lead: Lead) => {
    const toastId = toastLoading('Convertendo para cliente...');
    try {
      // 1. Create client
      const { error: clientError } = await supabase
        .from('clients')
        .insert([{
          company_id: profile?.company_id,
          name: lead.company_name,
          email: lead.email,
          phone: lead.phone,
          segment: 'Transportes' // Default
        }]);
      
      if (clientError) throw clientError;

      // 2. Update lead status to CLOSED
      await supabase.from('leads').update({ status: 'CLOSED' }).eq('id', lead.id);

      toastDismiss(toastId);
      toastSuccess('Parabéns! Novo cliente adicionado à carteira.');
      setIsDetailModalOpen(false);
      fetchData();
    } catch (err: any) {
      toastDismiss(toastId);
      toastError('Erro na conversão');
    }
  };

  const navItems = useMemo(
    () => [
      { id: 'inteligencia', label: 'Centro de Inteligência CRM', icon: BarChart3 },
      { id: 'kanban', label: 'Pipeline de Vendas', icon: Kanban },
      { id: 'clientes', label: 'Carteira Clientes', icon: Users },
      { id: 'leads', label: 'Leads Ativos', icon: UserPlus },
      { id: 'agenda', label: 'Agenda & Visitas', icon: Calendar },
    ],
    [],
  );

  const columns = [
    { id: 'FIRST_CONTACT', title: 'Novos Leads', color: '#6366f1', icon: Target },
    { id: 'QUALIFICATION', title: 'Qualificação', color: '#8b5cf6', icon: FileText },
    { id: 'PROPOSAL', title: 'Aguardando Proposta', color: '#f59e0b', icon: MessageSquare },
    { id: 'NEGOTIATION', title: 'Negociação', color: '#ec4899', icon: DollarSign },
    { id: 'CLOSED', title: 'Ganhos (Mês)', color: '#10b981', icon: CheckCircle2 },
  ];

  const renderDashboard = () => {
    const funnelStages = [
      { id: 'leads', label: 'Leads', count: leads.length, conv: '100%', color: '#6366f1' },
      { id: 'qualificados', label: 'Qualificados', count: leads.filter(l => l.status !== 'FIRST_CONTACT').length, conv: '64%', color: '#8b5cf6' },
      { id: 'proposta', label: 'Proposta', count: leads.filter(l => l.status === 'PROPOSAL').length, conv: '32%', color: '#f59e0b' },
      { id: 'fechados', label: 'Fechados', count: leads.filter(l => l.status === 'CLOSED').length, conv: '18%', color: '#10b981' },
    ];

    const pipelineData = [
      { name: 'Contatos', value: 45000 },
      { name: 'Qualificados', value: 32000 },
      { name: 'Proposta', value: 18500 },
      { name: 'Negociação', value: 12400 },
    ];

    const sourceData = [
      { name: 'WhatsApp', value: 45, color: '#25d366' },
      { name: 'Site', value: 25, color: 'var(--primary)' },
      { name: 'Indicação', value: 20, color: '#f59e0b' },
      { name: 'Tráfego Pago', value: 10, color: '#ef4444' },
    ];

    const sellerRanking = [
      { name: 'Ricardo Santos', sales: 12, value: 45000, conv: 24 },
      { name: 'Amanda Lima', sales: 10, value: 38200, conv: 21 },
      { name: 'Carlos Ferreira', sales: 8, value: 29500, conv: 18 },
    ];

    return (
      <div style={styles.tabContent} className="animate-fade-in">
        <div style={styles.kpiGrid}>
          <MetricCard 
            title="Pipeline Total" 
            value="R$ 142.5k" 
            subtitle="Volume em negociação" 
            trend="+12%" 
            icon={DollarSign} 
            iconBg="#eef2ff" 
            iconColor="#6366f1"
            sparkData={[40, 60, 50, 80, 70, 90, 100]}
          />
          <MetricCard 
            title="Vendas (Mês)" 
            value="32" 
            subtitle="Contratos assinados" 
            trend="+5%" 
            icon={CheckCircle2} 
            iconBg="#f0fdf4" 
            iconColor="#10b981"
            sparkData={[20, 40, 30, 50, 40, 60, 70]}
          />
          <MetricCard 
            title="Conversão" 
            value="18.4%" 
            subtitle="Lead para Fechamento" 
            trend="Estável" 
            icon={TrendingUp} 
            iconBg="#fff7ed" 
            iconColor="#f59e0b"
            sparkData={[15, 18, 16, 20, 19, 18, 18]}
          />
          <MetricCard 
            title="Leads Novos" 
            value="124" 
            subtitle="Captados esta semana" 
            trend="+24%" 
            icon={Target} 
            iconBg="#faf5ff" 
            iconColor="#8b5cf6"
            sparkData={[80, 100, 90, 120, 110, 130, 140]}
          />
          <MetricCard 
            title="T. Fechamento" 
            value="12d" 
            subtitle="Média por lead" 
            trend="-2d" 
            icon={Clock} 
            iconBg="#f1f5f9" 
            iconColor="#64748b"
            sparkData={[15, 14, 15, 13, 14, 12, 12]}
          />
        </div>

        {/* Funnel Section */}
        <div style={styles.cardHeader}>
           <h3 style={styles.cardTitle}>Funil de Vendas Estratégico</h3>
           <p style={{margin:0, fontSize: '12px', color: '#94a3b8'}}>Conversão total de leads qualificados em contratos assinados</p>
        </div>
        <div style={styles.funnelGrid}>
          <MetricCard 
            title="Leads Captados" 
            value="124" 
            subtitle="Conversão: 100%" 
            icon={Target} 
            iconBg="#faf5ff" 
            iconColor="#8b5cf6"
            sparkData={[100, 110, 105, 120, 124]}
          />
          <MetricCard 
            title="Qualificados" 
            value="82" 
            subtitle="Conversão: 66%" 
            trend="+5%"
            icon={FileText} 
            iconBg="#eef2ff" 
            iconColor="#6366f1"
            sparkData={[60, 70, 65, 75, 82]}
          />
          <MetricCard 
            title="Em Proposta" 
            value="32" 
            subtitle="Conversão: 39%" 
            icon={MessageSquare} 
            iconBg="#f0f9ff" 
            iconColor="#0ea5e9"
            sparkData={[25, 28, 30, 31, 32]}
          />
          <MetricCard 
            title="Negociação" 
            value="18" 
            subtitle="Conversão: 56%" 
            trend="Urgente"
            icon={Briefcase} 
            iconBg="#fdf2f8" 
            iconColor="#d946ef"
            sparkData={[15, 12, 14, 16, 18]}
          />
          <MetricCard 
            title="Fechados" 
            value="12" 
            subtitle="Conversão: 66%" 
            trend="+2"
            icon={CheckCircle2} 
            iconBg="#f0fdf4" 
            iconColor="#10b981"
            sparkData={[8, 10, 9, 11, 12]}
          />
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px'}}>
          <div style={styles.chartCard}>
            <div style={styles.cardHeader}><h3>Volume Financeiro no Pipeline</h3></div>
            <div style={{padding: '24px', height: '350px'}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pipelineData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}}
                    formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sellers & Sources Row */}
        <div style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px'}}>
          <div className="logta-card" style={styles.tableCard}>
            <div style={styles.cardHeader}><h3>Performance dos Vendedores</h3></div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Vendedor</th>
                  <th style={styles.th}>Vendas</th>
                  <th style={styles.th}>Valor Total</th>
                  <th style={styles.th}>Conversão</th>
                </tr>
              </thead>
              <tbody>
                {sellerRanking.map(s => (
                  <tr key={s.name} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <div style={{width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900'}}>
                          {s.name[0]}
                        </div>
                        <span style={{fontWeight: '700'}}>{s.name}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{s.sales}</td>
                    <td style={styles.td}><strong>R$ {s.value.toLocaleString('pt-BR')}</strong></td>
                    <td style={styles.td}>
                       <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                         <div style={{height: '6px', width: '60px', backgroundColor: '#f1f5f9', borderRadius: '3px'}}>
                           <div style={{height: '100%', width: `${s.conv * 3}%`, backgroundColor: 'var(--primary)', borderRadius: '3px'}} />
                         </div>
                         <span style={{fontSize: '11px', fontWeight: '800'}}>{s.conv}%</span>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.chartCard}>
            <div style={styles.cardHeader}><h3>Origem dos Leads</h3></div>
            <div style={{padding: '24px', height: '240px', display: 'flex', alignItems: 'center'}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: '700'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Hot Leads & Insights */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px'}}>
          <div className="logta-card" style={styles.tableCard}>
            <div style={styles.cardHeader}>
              <h3 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Zap size={18} color="#f59e0b" fill="#f59e0b" /> Leads Quentes (Ação Imediata)
              </h3>
            </div>
            <div style={{padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {leads.filter(l => l.status === 'PROPOSAL').slice(0, 3).map(l => (
                <div key={l.id} style={{padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9', backgroundColor: '#fcfcfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <h4 style={{margin: 0, fontSize: '14px', fontWeight: '900'}}>{l.company_name}</h4>
                    <p style={{margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8'}}>Em proposta há 3 dias • R$ {l.estimated_value?.toLocaleString('pt-BR')}</p>
                  </div>
                  <button style={{...styles.iconBtn, backgroundColor: 'var(--primary-light)', color: 'var(--primary)'}} onClick={() => setSelectedLead(l)}>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{...styles.chartCard, backgroundColor: 'var(--primary)', color: 'white', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
              <Layout size={24} color="white" />
              <h3 style={{fontSize: '20px', fontWeight: '900', margin: 0}}>Painel de Insights</h3>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <p style={{fontSize: '14px', opacity: 0.9, lineHeight: '1.5', padding: '12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}>
                <strong>⚠️ Alerta de Pipeline:</strong> 15% dos leads estão parados na fase de "Qualificação" há mais de 10 dias.
              </p>
              <p style={{fontSize: '14px', opacity: 0.9, lineHeight: '1.5', padding: '12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}>
                <strong>🚀 Oportunidade:</strong> leads vindos pelo "Indicação" possuem taxa de fechamento 2x maior que os demais.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderKanban = () => (
    <div className="animate-fade-in" style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
      {/* Top Controls */}
      <div style={{...styles.actionRow, justifyContent: 'space-between', backgroundColor: 'white', padding: '16px 24px', borderRadius: '24px', border: '1px solid #f1f5f9'}}>
        <div style={{display: 'flex', gap: '12px'}}>
           <div style={{...styles.searchBox, height: '40px', width: '200px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 12px', borderRadius: '12px'}}>
              <Filter size={14} color="#94a3b8" />
              <select style={{...styles.searchInput, background: 'none', border: 'none', cursor: 'pointer', outline: 'none', fontSize: '13px', fontWeight: '700'}}>
                 <option>Todos os Vendedores</option>
                 <option>Ricardo Santos</option>
                 <option>Amanda Lima</option>
              </select>
           </div>
           <div style={{...styles.searchBox, height: '40px', width: '160px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 12px', borderRadius: '12px'}}>
              <Calendar size={14} color="#94a3b8" />
              <select style={{...styles.searchInput, background: 'none', border: 'none', cursor: 'pointer', outline: 'none', fontSize: '13px', fontWeight: '700'}}>
                 <option>Este Mês</option>
                 <option>Trimestre</option>
              </select>
           </div>
        </div>
        <button style={{...styles.btnFull, flex: 'none', width: 'auto', padding: '0 24px', height: '40px', fontSize: '13px'}} onClick={() => { setSelectedLead(null); setIsDetailModalOpen(true); }}>
           <Plus size={16} /> Novo Negócio
        </button>
      </div>

      {/* Kanban Board */}
      <div style={{...styles.kanbanBoard, paddingBottom: '32px', minHeight: 'calc(100vh - 350px)'}}>
        {columns.map(col => {
          const columnLeads = leads.filter(l => l.status === col.id || (col.id === 'QUALIFICATION' && !['FIRST_CONTACT', 'PROPOSAL', 'NEGOTIATION', 'CLOSED', 'LOST'].includes(l.status)));
          const columnTotal = columnLeads.reduce((acc, curr) => acc + (curr.estimated_value || 0), 0);
          
          return (
            <div key={col.id} style={{...styles.kanbanColumn, minWidth: '340px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '28px'}}>
              <div style={styles.columnHeader}>
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                  <div style={styles.columnHeaderTitle}>
                    <div style={{...styles.columnDot, backgroundColor: col.color}} />
                    <span style={{fontSize: '14px', fontWeight: '950'}}>{col.title}</span>
                  </div>
                  <div style={{display: 'center', alignItems: 'center', gap: '8px', marginTop: '4px'}}>
                     <span style={{...styles.columnCount, margin: 0}}>{columnLeads.length}</span>
                     <span style={{fontSize: '11px', fontWeight: '800', color: '#94a3b8'}}>R$ {columnTotal.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <button style={{...styles.iconBtn, opacity: 0.5}}><Plus size={14} /></button>
              </div>

              <div style={{...styles.columnBody, padding: '4px', marginTop: '12px'}}>
                {columnLeads.length === 0 ? (
                  <div style={{...styles.emptyColumn, minHeight: '120px'}}>
                    <p style={{fontSize: '11px', fontWeight: '800', opacity: 0.6}}>Nenhuma oportunidade aqui</p>
                  </div>
                ) : (
                  columnLeads.map((lead, idx) => (
                    <div 
                      key={lead.id} 
                      style={{
                        ...styles.leadCard, 
                        border: '1px solid #f1f5f9', 
                        padding: '20px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        position: 'relative',
                        overflow: 'hidden'
                      }} 
                      onClick={() => { setSelectedLead(lead); setIsDetailModalOpen(true); }}
                    >
                      {/* Priority Indicator */}
                      {idx === 0 && (
                        <div style={{position: 'absolute', top: 0, right: 0, backgroundColor: '#fef2f2', color: '#ef4444', fontSize: '9px', fontWeight: '900', padding: '4px 10px', borderBottomLeftRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                           <Zap size={8} fill="#ef4444" /> HOT
                        </div>
                      )}

                      <h4 style={{...styles.leadName, fontSize: '15px'}}>{lead.company_name}</h4>
                      <p style={{...styles.leadResponsible, fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '16px'}}>
                        Resp: {lead.responsible_name}
                      </p>
                      
                      <div style={{...styles.leadFooter, padding: '12px 0 0 0'}}>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                           <span style={{fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase'}}>Valor Estimado</span>
                           <span style={{...styles.leadValue, fontSize: '16px', fontWeight: '950'}}>R$ {lead.estimated_value?.toLocaleString('pt-BR')}</span>
                        </div>
                        <div style={{width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: '900'}}>
                           {lead.responsible_name?.[0] || 'U'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderClients = () => {
    const clientKPIs = [
      { label: 'Base Total', value: clients.length, icon: Users, color: 'var(--primary)' },
      { label: 'Clientes Ativos', value: Math.ceil(clients.length * 0.82), icon: UserCheck, color: 'var(--success)' },
      { label: 'Inativos (30d+)', value: Math.floor(clients.length * 0.12), icon: Clock, color: 'var(--danger)' },
      { label: 'Ticket Médio', value: 'R$ 4.2k', icon: TrendingUp, color: '#f59e0b' },
      { label: 'Retenção (SLA)', value: '98.2%', icon: ShieldCheck, color: '#6366f1' },
    ];

    return (
      <div className="animate-fade-in" style={styles.tabContent}>
        {/* KPI Summary */}
        <div style={{...styles.kpiGrid, gridTemplateColumns: 'repeat(5, 1fr)'}}>
          {clientKPIs.map(k => (
            <div key={k.label} style={{...styles.kpiCard, padding: '24px', borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'}}>
              <div style={styles.kpiInfo}>
                <span style={{...styles.kpiLabel, fontSize: '10px'}}>{k.label}</span>
                <h2 style={{...styles.kpiValueText, fontSize: '20px'}}>{k.value}</h2>
              </div>
              <div style={{...styles.iconBox, width: '40px', height: '40px', backgroundColor: '#f8fafc'}}>
                <k.icon size={18} color={k.color} />
              </div>
            </div>
          ))}
        </div>

        {/* Action & Search Bar */}
        <div style={{...styles.actionRow, justifyContent: 'space-between', backgroundColor: 'white', padding: '16px 24px', borderRadius: '24px', border: '1px solid #f1f5f9'}}>
          <div style={{display: 'flex', gap: '12px', flex: 1}}>
             <div style={{...styles.searchBox, height: '44px', flex: 1, maxWidth: '400px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '14px'}}>
                <Search size={16} color="#94a3b8" />
                <input style={{...styles.searchInput, background: 'none', border: 'none', outline: 'none', marginLeft: '12px', fontWeight: '600'}} placeholder="Buscar por cliente, CNPJ ou região..." />
             </div>
             <div style={{...styles.searchBox, height: '44px', width: '180px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 12px', borderRadius: '14px'}}>
                <Filter size={16} color="#94a3b8" />
                <select style={{...styles.searchInput, background: 'none', border: 'none', cursor: 'pointer', outline: 'none', fontSize: '13px', fontWeight: '700'}}>
                   <option>Segmento: Todos</option>
                   <option>Alimentício</option>
                   <option>Industrial</option>
                </select>
             </div>
          </div>
          <div style={{display: 'flex', gap: '12px', flexShrink: 0}}>
             <button style={{...styles.actionBtn, height: '44px'}}>
                <Download size={16} /> Exportar Base
             </button>
             <button style={{...styles.btnFull, flex: 'none', height: '44px', padding: '0 24px', width: 'auto'}} onClick={() => { setSelectedLead(null); setIsDetailModalOpen(true); }}>
                <Plus size={16} /> Novo Cliente
             </button>
          </div>
        </div>

        {/* Client Table */}
        <div className="logta-card" style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Empresa / Cliente</th>
                <th style={styles.th}>Responsável</th>
                <th style={styles.th}>Contato</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>LTV Total</th>
                <th style={styles.th}>Último Contato</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={c.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                      <div style={{width:'40px', height:'40px', borderRadius:'12px', backgroundColor: i % 2 === 0 ? 'var(--primary-light)' : '#f1f5f9', color: i % 2 === 0 ? 'var(--primary)' : '#64748b', display:'flex', alignItems:'center', justifyContent:'center', fontWeight: '900'}}>
                        {c.name[0]}
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column'}}>
                        <strong style={{fontSize: '15px'}}>{c.name}</strong>
                        <span style={{fontSize: '11px', color: '#94a3b8'}}>{c.cnpj_cpf}</span>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                       <div style={{width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800'}}>
                          RS
                       </div>
                       <span style={{fontWeight: '700'}}>Ricardo S.</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                      <span style={{fontWeight: '600'}}>{c.phone}</span>
                      <span style={{fontSize: '11px', color: '#94a3b8'}}>{c.email}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.categoryBadge, 
                      backgroundColor: i % 4 === 0 ? '#f0fdf4' : '#f1f5f9',
                      color: i % 4 === 0 ? '#10b981' : '#64748b',
                      fontSize: '10px'
                    }}>
                      {i % 4 === 0 ? 'VIP' : 'ATIVO'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{fontWeight: '900', color: 'var(--primary)'}}>R$ {(12500 + i*4500).toLocaleString('pt-BR')}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: i > 2 ? '#94a3b8' : 'var(--text-main)'}}>
                       <HistoryIcon size={12} /> {i + 1} dias atrás
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button style={styles.iconBtn} title="WhatsApp"><MessageSquare size={16} /></button>
                      <button style={styles.iconBtn} title="Detalhes"><Eye size={16} /></button>
                      <button style={styles.iconBtn} title="Financeiro"><DollarSign size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const leadStatusPt: Record<Lead['status'], string> = {
    FIRST_CONTACT: 'Primeiro contacto',
    NEGOTIATION: 'Negociação',
    PROPOSAL: 'Proposta',
    CLOSED: 'Fechado',
    LOST: 'Perdido',
  };

  const renderLeads = () => {
    const leadKPIs = [
      { label: 'Total Captação', value: leads.length, icon: UserPlus, color: 'var(--primary)', trend: '+12%' },
      { label: 'Leads Quentes', value: Math.ceil(leads.length * 0.4), icon: Zap, color: '#ef4444', trend: '🔥' },
      { label: 'Aguardando Resposta', value: Math.ceil(leads.length * 0.2), icon: Clock, color: '#f59e0b', trend: '3h avg' },
      { label: 'Convertidos', value: '18.4%', icon: TrendingUp, color: '#10b981', trend: '+2%' },
    ];

    const leadSources = [
      { id: 'whatsapp', label: 'WhatsApp Business', count: '45%', color: '#25d366' },
      { id: 'site', label: 'Formulário Site', count: '28%', color: 'var(--primary)' },
      { id: 'ads', label: 'Google Ads', count: '17%', color: '#4285f4' },
      { id: 'ind', label: 'Indicação', count: '10%', color: '#f59e0b' },
    ];

    return (
      <div className="animate-fade-in" style={styles.tabContent}>
        {/* KPI Section */}
        <div style={styles.kpiGrid}>
          <MetricCard 
            title="Total Captação" 
            value={leads.length} 
            subtitle="Leads na base" 
            trend="+12%" 
            icon={UserPlus} 
            iconBg="#f5f3ff" 
            iconColor="#8b5cf6"
            sparkData={[120, 140, 130, 150, leads.length]}
          />
          <MetricCard 
            title="Leads Quentes" 
            value={Math.ceil(leads.length * 0.4)} 
            subtitle="Alta propensão" 
            trend="🔥" 
            icon={Zap} 
            iconBg="#fff1f2" 
            iconColor="#ef4444"
            sparkData={[40, 45, 50, 48, Math.ceil(leads.length * 0.4)]}
          />
          <MetricCard 
            title="Aguardando Resposta" 
            value={Math.ceil(leads.length * 0.2)} 
            subtitle="Ação requerida" 
            trend="3h avg" 
            trendNeg 
            icon={Clock} 
            iconBg="#fffbeb" 
            iconColor="#f59e0b"
            sparkData={[10, 15, 12, 14, Math.ceil(leads.length * 0.2)]}
          />
          <MetricCard 
            title="Convertidos" 
            value="18.4%" 
            subtitle="Lead p/ Fechamento" 
            trend="+2%" 
            icon={TrendingUp} 
            iconBg="#f0fdf4" 
            iconColor="#10b981"
            sparkData={[15, 16, 17, 18, 18.4]}
          />
        </div>

        {/* Search and Filters */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px'}}>
           <div className="logta-card" style={styles.tableCard}>
              <div style={{padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                 <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                   <h3 style={styles.cardTitle}>Gestão de Leads</h3>
                   <div style={{...styles.searchBox, width: '240px', height: '40px'}}>
                      <Search size={16} color="#94a3b8" />
                      <input style={styles.searchInput} placeholder="Buscar nome, empresa ou telefone..." />
                   </div>
                 </div>
                 <div style={{display: 'flex', gap: '8px'}}>
                    <button style={styles.actionBtn}><Filter size={16} /> Filtros Avançados</button>
                    <button style={{...styles.actionBtn, backgroundColor: 'var(--primary)', color: 'white', border: 'none'}} onClick={() => { setSelectedLead(null); setIsDetailModalOpen(true); }}><Plus size={16} /> Novo Lead</button>
                 </div>
              </div>
              
              <div style={{overflowX: 'auto'}}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Lead / Empresa</th>
                      <th style={styles.th}>Origem / Canal</th>
                      <th style={styles.th}>Responsável</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Temperatura</th>
                      <th style={{...styles.th, textAlign: 'right'}}>Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{padding: '60px', textAlign: 'center'}}>
                           <EmptyState title="Nenhum lead encontrado" description="Inicie a captação agora ou verifique os filtros." icon={UserPlus} />
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead, i) => (
                        <tr key={lead.id} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                               <span style={{fontWeight: '900', color: 'var(--text-main)', fontSize: '15px'}}>{lead.company_name}</span>
                               <span style={{fontSize: '12px', color: '#64748b'}}>{lead.phone}</span>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                               <div style={{width: '6px', height: '6px', borderRadius: '50%', backgroundColor: i % 2 === 0 ? '#25d366' : 'var(--primary)'}} />
                               <span style={{fontSize: '13px', fontWeight: '700'}}>{i % 2 === 0 ? 'WhatsApp' : 'Site Institucional'}</span>
                            </div>
                          </td>
                          <td style={styles.td}>
                             <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <div style={{width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900'}}>RS</div>
                                <span style={{fontSize: '13px', fontWeight: '600'}}>{lead.responsible_name}</span>
                             </div>
                          </td>
                          <td style={styles.td}>
                             <span style={{...styles.leadStatusBadge, backgroundColor: '#eef2ff', color: '#6366f1'}}>
                               {leadStatusPt[lead.status]}
                             </span>
                          </td>
                          <td style={styles.td}>
                             <span style={{
                               padding: '4px 10px', 
                               borderRadius: '20px', 
                               fontSize: '10px', 
                               fontWeight: '900',
                               backgroundColor: i === 0 ? '#fee2e2' : i === 1 ? '#fff7ed' : '#f0f9ff',
                               color: i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#0ea5e9'
                             }}>
                               {i === 0 ? '🔥 QUENTE' : i === 1 ? '🟡 MORNO' : '❄️ FRIO'}
                             </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                               <button style={{...styles.iconBtn, color: '#25d366'}} title="Abrir WhatsApp" onClick={() => toastSuccess('Abrindo WhatsApp do lead...')}><MessageSquare size={16} /></button>
                               <button style={{...styles.iconBtn, color: 'var(--primary)'}} title="Mover para Kanban" onClick={() => toastLoading('Movendo para o Pipeline...')}><ArrowRight size={16} /></button>
                               <button style={styles.iconBtn} title="Ver Detalhes" onClick={() => { setSelectedLead(lead); setIsDetailModalOpen(true); }}><Eye size={16} /></button>
                               <button style={{...styles.iconBtn, color: '#ef4444'}} title="Perder Lead"><X size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
           </div>

           {/* Sidebar: Origins & Alerts */}
           <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
              <div className="logta-card" style={{...styles.tableCard, padding: '24px'}}>
                 <h4 style={{...styles.kpiLabel, marginBottom: '20px'}}>Origem dos Leads</h4>
                 <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                    {leadSources.map(s => (
                      <div key={s.id}>
                         <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                            <span style={{fontSize: '13px', fontWeight: '700'}}>{s.label}</span>
                            <span style={{fontSize: '13px', fontWeight: '900'}}>{s.count}</span>
                         </div>
                         <div style={styles.progressBase}><div style={{...styles.progressBar, width: s.count, backgroundColor: s.color}}></div></div>
                      </div>
                    ))}
                 </div>
              </div>

              <div style={{...styles.tableCard, backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '24px'}}>
                 <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px'}}>
                    <AlertTriangle size={20} color="#f59e0b" />
                    <h4 style={{fontSize: '14px', fontWeight: '900', color: '#9a3412', margin: 0}}>Atenção Comercial</h4>
                 </div>
                 <p style={{fontSize: '12px', color: '#9a3412', margin: 0, lineHeight: '1.5', fontWeight: '600'}}>
                    Você possui <strong>3 leads quentes</strong> sem contato há mais de 24 horas. Priorize o atendimento para não perder a conversão.
                 </p>
                 <button style={{margin: '16px 0 0', backgroundColor: '#fddfbb', color: '#9a3412', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer'}}>Visualizar Leads Parados</button>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const headerActions = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button style={styles.actionBtn} onClick={() => toastSuccess('Exportando CRM...')}>
        <Download size={16} />
        <span>Exportar</span>
      </button>
      <button style={{...styles.actionBtn, backgroundColor: 'var(--primary)', color: 'white', border: 'none'}} onClick={() => { setSelectedLead(null); setIsDetailModalOpen(true); }}>
        <Plus size={16} />
        <span>Novo Lead</span>
      </button>
    </div>
  );

  return (
    <ModuleLayout
      title={
        activeTab === 'inteligencia' ? 'Centro de Inteligência CRM' :
        activeTab === 'kanban' ? 'Pipeline de Vendas' :
        activeTab === 'clientes' ? 'Carteira de Clientes' :
        activeTab === 'leads' ? 'Gestão de Leads Ativos' :
        activeTab === 'agenda' ? 'Agenda & Visitas Estratégicas' : 'Operação Comercial'
      }
      badge="CRM & VENDAS"
      items={navItems}
      activeTab={activeTab}
      onTabChange={onTabChange}
      showAllTabLabels
      actions={headerActions}
    >
      <div style={styles.viewContainer}>
        {activeTab === 'inteligencia' && renderDashboard()}
        {activeTab === 'kanban' && renderKanban()}
        {activeTab === 'clientes' && renderClients()}
        {activeTab === 'leads' && renderLeads()}
        {activeTab === 'agenda' && <LogtaCalendar />}
      </div>

      <LogtaModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detalhe do Lead Estratégico" width="700px">
         {selectedLead ? (
          <div style={{padding: '32px'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px'}}>
                <div>
                   <h2 style={{fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', margin: 0}}>{selectedLead.company_name}</h2>
                   <p style={{color: '#64748b', fontSize: '15px', marginTop: '4px'}}>Status Atual: <span style={{color: 'var(--primary)', fontWeight: '800'}}>{selectedLead.status}</span></p>
                </div>
                <div style={{textAlign: 'right'}}>
                   <p style={{fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', margin: 0}}>Valor Estimado</p>
                   <h3 style={{fontSize: '24px', fontWeight: '950', color: '#10b981', margin: 0}}>R$ {selectedLead.estimated_value?.toLocaleString('pt-BR')}</h3>
                </div>
             </div>
             
             <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px'}}>
                <div style={styles.detailBox}>
                   <User size={18} color="var(--primary)" />
                   <div>
                      <span style={styles.detailLabel}>Responsável</span>
                      <p style={styles.detailValue}>{selectedLead.responsible_name}</p>
                   </div>
                </div>
                <div style={styles.detailBox}>
                   <Mail size={18} color="var(--primary)" />
                   <div>
                      <span style={styles.detailLabel}>E-mail</span>
                      <p style={styles.detailValue}>{selectedLead.email}</p>
                   </div>
                </div>
             </div>

             <div style={{display: 'flex', gap: '12px', marginTop: '40px'}}>
                <button style={styles.btnFull} onClick={() => handleUpdateStatus(selectedLead.id, 'PROPOSAL')}>
                   <FileText size={18} /> Mudar para Proposta
                </button>
                <button style={{...styles.btnFull, backgroundColor: '#10b981'}} onClick={() => handleConvertToClient(selectedLead)}>
                   <CheckCircle2 size={18} /> Marcar como Ganho
                </button>
             </div>
          </div>
       ) : (
          <form onSubmit={handleCreateLead} style={{padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
             <div style={{textAlign: 'center', marginBottom: '10px'}}>
                <Target size={48} color="var(--primary)" style={{opacity: 0.2, marginBottom: '12px'}} />
                <h3 style={{fontSize: '20px', fontWeight: '900', margin: 0}}>Cadastrar Novo Lead</h3>
                <p style={{color: '#64748b', fontSize: '14px'}}>Inicie uma nova oportunidade de negócio</p>
             </div>

             <div style={styles.inputGroup}>
                <label style={styles.detailLabel}>Nome da Empresa / Lead</label>
                <input
                   style={{ ...styles.searchInput, paddingLeft: '16px' }}
                   placeholder="Ex: Transportadora Matriz"
                   required
                   value={newLead.company_name}
                   onChange={e => setNewLead({...newLead, company_name: e.target.value})}
                />
             </div>

             <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                <div style={styles.inputGroup}>
                   <label style={styles.detailLabel}>Pessoa Responsável</label>
                   <input
                      style={{ ...styles.searchInput, paddingLeft: '16px' }}
                      placeholder="Nome do contato"
                      value={newLead.responsible_name}
                      onChange={e => setNewLead({...newLead, responsible_name: e.target.value})}
                   />
                </div>
                <div style={styles.inputGroup}>
                   <label style={styles.detailLabel}>Valor Estimado (R$)</label>
                   <input
                      style={{ ...styles.searchInput, paddingLeft: '16px' }}
                      placeholder="0,00"
                      value={newLead.estimated_value}
                      onChange={e => setNewLead({...newLead, estimated_value: e.target.value})}
                   />
                </div>
             </div>

             <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                <div style={styles.inputGroup}>
                   <label style={styles.detailLabel}>E-mail</label>
                   <input
                      type="email"
                      style={{ ...styles.searchInput, paddingLeft: '16px' }}
                      placeholder="contato@empresa.com"
                      value={newLead.email}
                      onChange={e => setNewLead({...newLead, email: e.target.value})}
                   />
                </div>
                <div style={styles.inputGroup}>
                   <label style={styles.detailLabel}>Telefone</label>
                   <input
                      style={{ ...styles.searchInput, paddingLeft: '16px' }}
                      placeholder="(00) 00000-0000"
                      value={newLead.phone}
                      onChange={e => setNewLead({...newLead, phone: e.target.value})}
                   />
                </div>
             </div>

             <button type="submit" style={{...styles.btnFull, height: '56px', marginTop: '10px'}} disabled={loadingAction}>
                {loadingAction ? 'Salvando...' : 'Criar Lead Estratégico'}
             </button>
          </form>
         )}
      </LogtaModal>
    </ModuleLayout>
  );
};

const styles: Record<string, any> = {
  viewContainer: { flex: 1, display: 'flex', flexDirection: 'column' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' },
  funnelGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px', marginBottom: '32px' },
  kpiCard: { backgroundColor: 'white', padding: '32px', borderRadius: '32px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  kpiInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  kpiLabel: { fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  kpiValueText: { fontSize: '32px', fontWeight: '950', color: '#0f172a', margin: '4px 0' },
  iconBox: { width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  chartCard: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid #f1f5f9', overflow: 'hidden' },
  cardHeader: { padding: '24px 32px', borderBottom: '1px solid #f8fafc' },
  cardTitle: { fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', margin: 0 },
  
  kanbanBoard: { display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '24px', minHeight: 'calc(100vh - 400px)' },
  kanbanColumn: { minWidth: '320px', backgroundColor: '#f8fafc', borderRadius: '32px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid #f1f5f9' },
  columnHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  columnHeaderTitle: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: '900', color: '#1e293b' },
  columnDot: { width: '8px', height: '8px', borderRadius: '50%' },
  columnCount: { fontSize: '11px', fontWeight: '900', color: '#64748b', backgroundColor: 'white', padding: '2px 8px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  columnBody: { display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 },
  emptyColumn: { flex: 1, border: '2px dashed #e2e8f0', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '700' },
  
  leadCard: { backgroundColor: 'white', padding: '20px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' } },
  leadName: { margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900', color: 'var(--text-main)' },
  leadResponsible: { fontSize: '12px', color: '#64748b', margin: 0 },
  leadFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f8fafc' },
  leadValue: { fontSize: '14px', fontWeight: '900', color: 'var(--primary)' },
  
  tableCard: { },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px 32px', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fcfdfe' },
  td: { padding: '20px 32px', fontSize: '14px', borderBottom: '1px solid #f1f5f9', color: '#475569' },
  tr: { transition: 'background-color 0.2s', '&:hover': { backgroundColor: '#fcfdfe' } },
  
  detailBox: { display: 'flex', gap: '16px', alignItems: 'center', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' },
  detailLabel: { fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' },
  detailValue: { fontSize: '15px', fontWeight: '800', color: '#1e293b', margin: 0 },
  btnFull: { flex: 1, padding: '16px', borderRadius: '14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)' },
  actionBtn: { padding: '10px 18px', backgroundColor: 'var(--primary-glow)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', color: 'var(--primary)', cursor: 'pointer' },
  categoryBadge: { padding: '5px 12px', backgroundColor: '#f0f9ff', color: '#0369a1', borderRadius: '12px', fontSize: '11px', fontWeight: '900' },
  iconBtn: { padding: '8px', color: '#94a3b8', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '10px', transition: 'all 0.2s', '&:hover': { backgroundColor: '#f1f5f9', color: 'var(--primary)' } },
  leadStatusBadge: {
    display: 'inline-block',
    padding: '5px 12px',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 900,
  },
  searchInput: {
    width: '100%',
    height: '48px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
  },
  inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  actionRow: { display: 'flex', alignItems: 'center', gap: '16px' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '0 16px', borderRadius: '12px', border: '1px solid #e2e8f0', height: '48px' },
  progressBase: { height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' },
};

export default CRM;
