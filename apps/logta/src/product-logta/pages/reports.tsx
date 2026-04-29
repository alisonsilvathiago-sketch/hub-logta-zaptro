import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, LineChart, Line, Legend, PieChart, Pie
} from 'recharts';
import {
  Calendar, TrendingUp, Users, Truck, AlertCircle, LayoutDashboard,
  DollarSign, Zap, ArrowUpRight, ArrowDownRight, Package, ShoppingCart,
  BarChart3, Target, Clock, Filter, Download, ExternalLink,
  ChevronRight, MoreVertical, SlidersHorizontal, Activity, Award,
  MapPin, Navigation2, Info, AlertTriangle, Fuel, Wallet, Landmark,
  Receipt, TrendingDown, MousePointer2, UserPlus, FileCheck, Magnet,
  UserCheck, UserX, UserMinus, Heart, Brain, GraduationCap, Medal,
  CheckCircle2, CheckCircle
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import Modal from '../../components/Modal';
import MetricCard from '../../components/MetricCard';
import ModuleLayout from '../../layouts/ModuleLayout';
import { toastSuccess } from '../../lib/toast';

const Reports: React.FC = () => {
  const { company } = useTenant();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();

  const activeTab = tab || 'dashboard';

  const handleTabChange = (tabId: string) => {
    navigate(`/relatorios/${tabId === 'dashboard' ? '' : tabId}`);
  };

  // --- MOCK DATA ---
  const dashboardData = [
    { date: '01/04', receita: 45000, custo: 32000, lucro: 13000 },
    { date: '05/04', receita: 52000, custo: 34000, lucro: 18000 },
    { date: '10/04', receita: 48000, custo: 31000, lucro: 17000 },
    { date: '15/04', receita: 61000, custo: 38000, lucro: 23000 },
    { date: '20/04', receita: 59000, custo: 36000, lucro: 23000 },
    { date: '25/04', receita: 72000, custo: 42000, lucro: 30000 },
  ];

  const logisticaData = [
    { name: 'Seg', onTime: 45, delayed: 2 },
    { name: 'Ter', onTime: 38, delayed: 5 },
    { name: 'Qua', onTime: 52, delayed: 3 },
    { name: 'Qui', onTime: 48, delayed: 8 },
    { name: 'Sex', onTime: 60, delayed: 1 },
  ];

  const financialEvolution = [
    { name: 'Jan', rec: 120000, desp: 85000, luc: 35000 },
    { name: 'Fev', rec: 135000, desp: 90000, luc: 45000 },
    { name: 'Mar', rec: 154000, desp: 98000, luc: 56000 },
    { name: 'Abr', rec: 182000, desp: 110000, luc: 72000 },
  ];

  const funnelData = [
    { step: 'Leads', value: 450, color: '#3b82f6' },
    { step: 'Qualificados', value: 310, color: '#6366f1' },
    { step: 'Proposta', value: 180, color: '#8b5cf6' },
    { step: 'Negociação', value: 85, color: '#a855f7' },
    { step: 'Fechados', value: 52, color: '#10b981' },
  ];

  const originData = [
    { name: 'WhatsApp', value: 45, color: '#10b981' },
    { name: 'Site/SEO', value: 25, color: '#3b82f6' },
    { name: 'Indicação', value: 20, color: '#f59e0b' },
    { name: 'Tráfego Pago', value: 10, color: '#ef4444' },
  ];

  const peopleEvolution = [
    { month: 'Jan', perf: 78, attend: 96 },
    { month: 'Fev', perf: 82, attend: 94 },
    { month: 'Mar', perf: 81, attend: 98 },
    { month: 'Abr', perf: 88, attend: 97 },
  ];

  // --- RENDER VIEWS ---

  const renderDashboard = () => (
    <div style={styles.tabContent} className="animate-fade-in">
        <div style={styles.kpiGrid}>
          <MetricCard 
            title="Receita Total (Mês)" 
            value="R$ 384.5k" 
            subtitle="Faturamento bruto" 
            trend="+12%" 
            icon={DollarSign} 
            iconBg="#f5f3ff" 
            iconColor="#8b5cf6"
            sparkData={[320, 340, 350, 384, 360, 370, 384]}
          />
          <MetricCard 
            title="Custos Totais" 
            value="R$ 212.4k" 
            subtitle="Operacional" 
            trend="Estável" 
            icon={TrendingUp} 
            iconBg="#fef2f2" 
            iconColor="#ef4444"
            sparkData={[200, 210, 205, 212, 215, 212, 212]}
          />
          <MetricCard 
            title="Lucro Líquido" 
            value="R$ 172.1k" 
            subtitle="Margem 44%" 
            trend="+8%" 
            icon={BarChart3} 
            iconBg="#ecfdf5" 
            iconColor="#10b981"
            sparkData={[140, 150, 160, 172, 165, 170, 172]}
          />
          <MetricCard 
            title="Taxa Sucesso" 
            value="98.2%" 
            subtitle="SLA Global" 
            trend="Meta Batida" 
            icon={Target} 
            iconBg="#eff6ff" 
            iconColor="#3b82f6"
            sparkData={[95, 96, 97, 98, 98, 98, 98]}
          />
        </div>

       <div style={styles.chartCardFull}>
          <div style={styles.cardHeader}>
             <div><h3 style={styles.chartTitle}>Evolução Geral do Negócio</h3><p style={{margin:0, fontSize:'12px', color:'#94a3b8'}}>Receita vs Lucro (30 dias)</p></div>
             <div style={styles.actions}><button style={styles.miniBtn}><Download size={14} /> Exportar</button></div>
          </div>
          <div style={{height: 350, marginTop: 32}}>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="date" axisLine={false} tickLine={false} />
                   <YAxis hide />
                   <Tooltip />
                   <Area type="monotone" dataKey="receita" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.1} fill="#3b82f6" name="Receita" />
                   <Area type="monotone" dataKey="lucro" stroke="#10b981" strokeWidth={3} fillOpacity={0.1} fill="#10b981" name="Lucro" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </div>

       <div style={{...styles.chartCardFull, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border:'none'}}>
          <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:24}}><Zap size={20} color="#f59e0b" fill="#f59e0b" /><h3 style={{...styles.chartTitle, color: 'white'}}>Logta Smart Insights</h3></div>
          <div style={{display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap:'24px'}}>
             <div style={styles.insightBox}><p style={styles.insightLabel}>FINANCEIRO</p><p style={styles.insightText}>Lucro cresceu 4% por redução de custos em manutenção.</p></div>
             <div style={styles.insightBox}><p style={styles.insightLabel}>COMERCIAL</p><p style={styles.insightText}>Taxa de conversão caiu 2% essa semana. Revisar follow-ups.</p></div>
             <div style={styles.insightBox}><p style={styles.insightLabel}>LOGITA</p><p style={styles.insightText}>Rota Sul com custo 15% maior. Redesenhar roteiro economiza R$ 12k/mês.</p></div>
          </div>
       </div>
    </div>
  );

  const renderLogistica = () => (
    <div style={styles.tabContent} className="animate-fade-in">
        <div style={styles.kpiGrid}>
          <MetricCard title="Total Entregas" value="2.450" subtitle="Deste mês" icon={Truck} iconBg="#eff6ff" iconColor="#3b82f6" sparkData={[2100, 2200, 2300, 2450]} />
          <MetricCard title="No Prazo (%)" value="94.2%" subtitle="SLA" icon={CheckCircle2} iconBg="#ecfdf5" iconColor="#10b981" sparkData={[92, 93, 94, 94]} />
          <MetricCard title="Atrasos" value="124" subtitle="Crítico" icon={Clock} iconBg="#fef2f2" iconColor="#ef4444" trendNeg trend="Atenção" sparkData={[150, 140, 130, 124]} />
          <MetricCard title="Total Rotas" value="312" subtitle="Ativas" icon={Navigation2} iconBg="#f5f3ff" iconColor="#8b5cf6" sparkData={[280, 290, 300, 312]} />
        </div>

       <div style={styles.chartCardFull}>
          <div style={styles.cardHeader}><div><h3 style={styles.chartTitle}>Eficiência Logita de Entregas</h3><p style={{margin:0, fontSize:'12px', color:'#94a3b8'}}>No Prazo vs Atrasos (Diário)</p></div></div>
          <div style={{height: 350, marginTop: 32}}>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={logisticaData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} />
                   <YAxis hide />
                   <Tooltip />
                   <Legend verticalAlign="top" align="right" height={36}/>
                   <Bar dataKey="onTime" fill="#3b82f6" radius={[4, 4, 0, 0]} name="No Prazo" />
                   <Bar dataKey="delayed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Atrasos" />
                </BarChart>
             </ResponsiveContainer>
          </div>
       </div>

       <div style={styles.dashboardGrid}>
          <div style={{...styles.sectionCard, gridColumn: 'span 2'}}>
             <div style={styles.cardHeader}><h3 style={styles.chartTitle}><MapPin size={18} color="var(--primary)" /> Performance de Rotas</h3></div>
             <div style={{marginTop: 20}}>
                <table style={styles.miniTable}>
                   <thead><tr><th style={styles.miniTh}>Rota</th><th style={styles.miniTh}>Entregas</th><th style={styles.miniTh}>SLA</th></tr></thead>
                   <tbody>
                      <tr style={styles.miniTr}><td style={styles.miniTd}>SP-CENTRO</td><td style={styles.miniTd}>142</td><td style={styles.miniTd}><span style={styles.statusTagSuccess}>98%</span></td></tr>
                      <tr style={styles.miniTr}><td style={styles.miniTd}>RJ-SUL</td><td style={styles.miniTd}>98</td><td style={styles.miniTd}><span style={styles.statusTagWarning}>82%</span></td></tr>
                   </tbody>
                </table>
             </div>
          </div>
          <div style={{...styles.sectionCard, gridColumn: 'span 2'}}>
             <div style={styles.cardHeader}><h3 style={styles.chartTitle}><AlertTriangle size={18} color="#ef4444" /> Ocorrências Ativas</h3></div>
             <div style={styles.summaryList}>
                <div style={styles.summaryItem}><span>Cliente Ausente</span><strong style={{color:'#ef4444'}}>58</strong></div>
                <div style={styles.summaryItem}><span>Endereço não encontrado</span><strong>42</strong></div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderFinanceiro = () => (
    <div style={styles.tabContent} className="animate-fade-in">
        <div style={styles.kpiGrid}>
          <MetricCard title="Receita Bruta" value="R$ 384k" subtitle="Faturamento" icon={DollarSign} iconBg="#eff6ff" iconColor="#3b82f6" sparkData={[350, 360, 370, 384]} />
          <MetricCard title="Custos Fixos/Var" value="R$ 212k" subtitle="Saídas" icon={TrendingDown} iconBg="#fef2f2" iconColor="#ef4444" trendNeg trend="Monitorado" sparkData={[220, 215, 212, 212]} />
          <MetricCard title="Lucro Líquido" value="R$ 172k" subtitle="Meta" icon={Wallet} iconBg="#ecfdf5" iconColor="#10b981" sparkData={[150, 160, 170, 172]} />
          <MetricCard title="Inadimplência" value="1.2%" subtitle="A receber" icon={Landmark} iconBg="#fffbeb" iconColor="#f59e0b" sparkData={[1.5, 1.4, 1.3, 1.2]} />
        </div>
       <div style={styles.chartCardFull}>
          <div style={styles.cardHeader}><div><h3 style={styles.chartTitle}>Saúde Financeira: Fluxo de Caixa</h3><p style={{margin:0, fontSize:'12px', color:'#94a3b8'}}>Entradas vs Saídas no ano</p></div></div>
          <div style={{height: 350, marginTop: 32}}>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialEvolution}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} />
                   <Tooltip />
                   <Area type="monotone" dataKey="rec" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.1} fill="#3b82f6" name="Receita" />
                   <Area type="monotone" dataKey="luc" stroke="#10b981" strokeWidth={3} fillOpacity={0.1} fill="#10b981" name="Lucro" />
                   <Line type="monotone" dataKey="desp" stroke="#ef4444" strokeWidth={2} name="Despesas" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </div>
    </div>
  );

  const renderCRM = () => (
    <div style={styles.tabContent} className="animate-fade-in">
        <div style={styles.kpiGrid}>
          <MetricCard title="Leads Gerados" value="450" subtitle="Deste mês" icon={Magnet} iconBg="#eff6ff" iconColor="#3b82f6" sparkData={[400, 420, 440, 450]} />
          <MetricCard title="Vendas Fechadas" value="52" subtitle="Conversão 11%" icon={FileCheck} iconBg="#ecfdf5" iconColor="#10b981" sparkData={[45, 48, 50, 52]} />
          <MetricCard title="Ciclo Médio" value="4.2d" subtitle="Velocidade" icon={Activity} iconBg="#f5f3ff" iconColor="#8b5cf6" sparkData={[4.8, 4.6, 4.4, 4.2]} />
        </div>
       <div style={styles.dashboardGrid}>
          <div style={{...styles.sectionCard, gridColumn: 'span 3'}}>
             <div style={styles.cardHeader}><h3 style={styles.chartTitle}><MousePointer2 size={18} color="var(--primary)" /> Funil de Conversão Comercial</h3></div>
             <div style={{height: 350, marginTop: 32}}>
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart layout="vertical" data={funnelData}><XAxis type="number" hide /><YAxis dataKey="step" type="category" tick={{fontSize:12, fontWeight:700}} /><Tooltip /><Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40}>{funnelData.map((e, i) => <Cell key={`cell-${i}`} fill={e.color} />)}</Bar></BarChart>
                </ResponsiveContainer>
             </div>
          </div>
       </div>
    </div>
  );

  const renderPessoas = () => (
    <div style={styles.tabContent} className="animate-fade-in">
        <div style={styles.kpiGrid}>
          <MetricCard title="Total Equipe" value="154" subtitle="Colaboradores" icon={Users} iconBg="#eff6ff" iconColor="#3b82f6" sparkData={[145, 148, 152, 154]} />
          <MetricCard title="Presença" value="97.4%" subtitle="Assiduidade" icon={UserCheck} iconBg="#ecfdf5" iconColor="#10b981" sparkData={[96, 97, 96, 97]} />
          <MetricCard title="Performance" value="8.8/10" subtitle="Score Geral" icon={Award} iconBg="#f5f3ff" iconColor="#8b5cf6" sparkData={[8.2, 8.5, 8.6, 8.8]} />
          <MetricCard title="Turnover" value="1.5%" subtitle="Retenção" icon={Activity} iconBg="#fef2f2" iconColor="#ef4444" trendNeg trend="Saudável" sparkData={[2.0, 1.8, 1.6, 1.5]} />
        </div>
       <div style={styles.dashboardGrid}>
          <div style={{...styles.sectionCard, gridColumn: 'span 3'}}>
             <div style={styles.cardHeader}><h3 style={styles.chartTitle}><TrendingUp size={18} color="var(--primary)" /> Evolução do Time</h3></div>
             <div style={{height: 350, marginTop: 32}}>
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={peopleEvolution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="perf" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.1} fill="#3b82f6" name="Performance" />
                      <Line type="monotone" dataKey="attend" stroke="#10b981" strokeWidth={2} name="Presença (%)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div style={{...styles.sectionCard, gridColumn: 'span 1'}}>
             <div style={styles.cardHeader}><h3 style={styles.chartTitle}><Medal size={18} color="#f59e0b" /> Destaques</h3></div>
             <div style={styles.summaryList}>
                <div style={styles.summaryItem}><div><strong>Pedro Alcantara</strong><p style={{margin:0, fontSize:'11px', color:'#94a3b8'}}>Score 9.8</p></div><span style={styles.statusTagSuccess}>Elite</span></div>
                <div style={styles.summaryItem}><div><strong>Marina Silva</strong><p style={{margin:0, fontSize:'11px', color:'#94a3b8'}}>Score 9.5</p></div><span style={styles.statusTagSuccess}>Top</span></div>
             </div>
          </div>
       </div>
    </div>
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Estratégico', icon: LayoutDashboard },
    { id: 'logistica', label: 'Estatísticas de Logita', icon: Truck },
    { id: 'financeiro', label: 'Métricas Financeiras', icon: DollarSign },
    { id: 'crm', label: 'Performance Comercial / CRM', icon: ShoppingCart },
    { id: 'pessoas', label: 'RH & Gestão de Pessoas', icon: Users },
  ];

  const modulePageTitle =
    navItems.find((item) => item.id === activeTab)?.label ?? 'Torre de Controle Estratégica';

  return (
    <ModuleLayout
      title={modulePageTitle}
      badge="LOGITA BUSINESS INTELLIGENCE"
      items={navItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'logistica' && renderLogistica()}
      {activeTab === 'financeiro' && renderFinanceiro()}
      {activeTab === 'crm' && renderCRM()}
      {activeTab === 'pessoas' && renderPessoas()}
      {!['dashboard', 'logistica', 'financeiro', 'crm', 'pessoas'].includes(activeTab) && (
        <div style={{padding: 40, textAlign: 'center', color: '#94a3b8'}}>Visualização em Desenvolvimento...</div>
      )}
    </ModuleLayout>
  );
};

const styles: Record<string, any> = {
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  kpiCard: { backgroundColor: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  kpiInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  kpiLabel: { fontSize: '10px', fontWeight: '900', color: '#94a3b8', margin: 0, textTransform: 'uppercase' },
  kpiValue: { fontSize: '24px', fontWeight: '950', color: '#0f172a', margin: 0 },
  kpiSubSuccess: { fontSize: '11px', color: '#10b981', fontWeight: 800 },
  kpiSubDanger: { fontSize: '11px', color: '#ef4444', fontWeight: 800 },
  kpiSubWarning: { fontSize: '11px', color: '#f59e0b', fontWeight: 800 },
  kpiSubPrimary: { fontSize: '11px', color: '#3b82f6', fontWeight: 800 },
  kpiIconWrapper: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chartCardFull: { backgroundColor: 'white', padding: '32px', borderRadius: '32px', border: '1px solid #e2e8f0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  chartTitle: { fontSize: '18px', fontWeight: '950', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 },
  actions: { display: 'flex', gap: '12px' },
  miniBtn: { padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 800, fontSize: '12px', cursor: 'pointer' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  sectionCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  summaryList: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  summaryItem: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', alignItems: 'center' },
  insightBox: { padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' },
  insightLabel: { fontSize: '10px', fontWeight: '900', color: '#f59e0b', margin: 0, letterSpacing: '1px' },
  insightText: { fontSize: '13px', color: 'white', opacity: 0.8, marginTop: '8px', lineHeight: 1.5 },
  miniTable: { width: '100%', borderCollapse: 'collapse' },
  miniTh: { textAlign: 'left', fontSize: '10px', fontWeight: 900, color: '#94a3b8', padding: '12px 0', borderBottom: '1px solid #f1f5f9', textTransform: 'uppercase' },
  miniTr: { borderBottom: '1px solid #f1f5f9' },
  miniTd: { padding: '12px 0', fontSize: '13px', color: '#1e293b' },
  statusTagSuccess: { padding: '4px 8px', borderRadius: '6px', backgroundColor: '#ecfdf5', color: '#10b981', fontWeight: 800, fontSize: '11px' },
  statusTagWarning: { padding: '4px 8px', borderRadius: '6px', backgroundColor: '#fffbeb', color: '#f59e0b', fontWeight: 800, fontSize: '11px' }
};

export default Reports;
