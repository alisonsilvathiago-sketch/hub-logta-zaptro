import React, { useEffect, useState, useCallback } from 'react';
import { 
  Truck, Package, Users, DollarSign, TrendingUp, 
  AlertCircle, ChevronRight, Calendar, ArrowUpRight, Clock, CheckCircle,
  Activity, Download, FileText, BarChart2, Target, Navigation2,
  Calculator, UserPlus, Briefcase, Box, MessageCircle, BarChart as ChartIcon,
  Smartphone, Database, Shield, Layout, Settings as SettingsIcon, Filter as FilterIcon,
  ChevronLeft, PieChart as PieIcon, GraduationCap, RefreshCw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { supabase } from '../lib/supabase';
import { useRealtime } from '../hooks/useRealtime';
import { seedDatabase } from '../lib/seed';
import ExportButton from '../components/ExportButton';
import { toastSuccess, toastError } from '../lib/toast';
import Modal from '../components/Modal';
import { getSegmentConfig } from '../utils/segmentLabels';
import FinanceCalculator from '../components/FinanceCalculator';
import { FuelDashboardCard } from '@shared/components/FuelIntelligence';

import { 
  RHDashboard, 
  LogisticsDashboard, 
  FinanceDashboard, 
  CRMDashboard, 
  InventoryDashboard 
} from '../components/RoleDashboards';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const { company } = useTenant();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    todayDeliveries: 0,
    activeRoutes: 0,
    activeDrivers: 0,
    monthlyRevenue: 0,
    totalClients: 0,
    totalFleet: 0,
    inventoryCount: 0,
    pendingInvoices: 0,
    teamTotal: 0,
    activeLeads: 0,
    paidAmount: 0,
    receivedAmount: 0,
    expectedRevenue: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [fuelPrices, setFuelPrices] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const fetchActivities = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  }, [profile?.company_id]);

  const fetchMetrics = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const [
        routesRes, 
        shipmentsRes, 
        driversRes, 
        financeRes,
        clientsRes,
        fleetRes,
        inventoryRes,
        employeesRes,
        leadsRes,
        weeklyShipments
      ] = await Promise.all([
        supabase.from('routes').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id).eq('status', 'EM_ANDAMENTO'),
        supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id).gte('created_at', today),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id).eq('role', 'MOTORISTA'),
        supabase.from('transactions').select('amount, type, status, created_at').eq('company_id', profile.company_id),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id),
        supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id),
        supabase.from('employees').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id).eq('source', 'CRM'),
        supabase.from('shipments').select('created_at, amount').eq('company_id', profile.company_id).gte('created_at', sevenDaysAgo.toISOString())
      ]);

      const paid = financeRes.data?.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
      const received = financeRes.data?.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
      const expected = financeRes.data?.filter(t => t.type === 'INCOME' && t.status === 'PENDING').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      setMetrics({
        todayDeliveries: shipmentsRes.count || 0,
        activeRoutes: routesRes.count || 0,
        activeDrivers: driversRes.count || 0,
        monthlyRevenue: received,
        totalClients: clientsRes.count || 0,
        totalFleet: fleetRes.count || 0,
        inventoryCount: inventoryRes.count || 0,
        teamTotal: employeesRes.count || 0,
        activeLeads: leadsRes.count || 0,
        paidAmount: paid,
        receivedAmount: received,
        expectedRevenue: expected + received,
        pendingInvoices: financeRes.data?.filter(t => t.status === 'PENDING').length || 0
      });

      // Graph logic
      const daysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { 
          name: daysShort[d.getDay()], 
          date: d.toISOString().split('T')[0],
          entregas: 0, 
          receita: 0 
        };
      });

      weeklyShipments.data?.forEach(s => {
        const sDate = s.created_at.split('T')[0];
        const dayObj = last7Days.find(d => d.date === sDate);
        if (dayObj) {
          dayObj.entregas += 1;
          dayObj.receita += Number(s.amount || 0);
        }
      });
      setChartData(last7Days);

      const { data: events } = await supabase.from('calendar_events').select('start_date').eq('company_id', profile.company_id);
      setCalendarEvents(events || []);

      const { data: fuelData } = await supabase.from('fuel_prices').select('*').limit(4);
      setFuelPrices(fuelData || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.company_id]);

  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/dashboard' && profile?.role) {
      const routes: any = { RH: '/rh/dashboard', LOGISTICA: '/logistica/dashboard', FINANCEIRO: '/financeiro/dashboard', CRM: '/crm/dashboard', ESTOQUE: '/estoque/dashboard', ADMIN: '/admin/dashboard', MASTER_ADMIN: '/admin/dashboard' };
      if (routes[profile.role]) navigate(routes[profile.role], { replace: true });
    }
    fetchMetrics();
    fetchActivities();
  }, [fetchMetrics, fetchActivities, profile?.role, navigate]);

  useRealtime('shipments', profile?.company_id, fetchMetrics);
  useRealtime('routes', profile?.company_id, fetchMetrics);
  useRealtime('transactions', profile?.company_id, fetchMetrics);
  useRealtime('audit_logs', profile?.company_id, fetchActivities);

  const segment = getSegmentConfig(company?.segment);

  const kpis = [
    { label: segment.primaryLabel, value: metrics.todayDeliveries, sub: `${metrics.activeRoutes} em rota`, Icon: segment.mainIcon, color: '#D9FF00' },
    { label: segment.terminology.drivers, value: metrics.activeDrivers, sub: `${metrics.teamTotal} equipe total`, Icon: Users, color: '#10b981' },
    { label: 'Clientes', value: metrics.totalClients, sub: `${metrics.activeLeads} leads ativos`, Icon: UserPlus, color: '#0061FF' },
    { label: 'Agenda', value: 'CALENDARIO', sub: 'Eventos críticos', Icon: Calendar, color: '#ef4444' },
  ];

  const renderAdminView = () => (
    <div style={styles.adminView}>
      <div style={styles.kpiGrid}>
        {kpis.map((kpi, idx) => (
          <div key={idx} style={styles.kpiCard}>
            {kpi.value === 'CALENDARIO' ? (
              <div style={styles.miniCalContainer}><MiniCalendar events={calendarEvents} /></div>
            ) : (
              <>
                <div style={{ ...styles.kpiIcon, backgroundColor: `${kpi.color}15`, color: kpi.color }}><kpi.Icon size={24} /></div>
                <div style={styles.kpiContent}>
                  <p style={styles.kpiLabel}>{kpi.label}</p>
                  <h3 style={styles.kpiValue}>{loading ? '...' : kpi.value}</h3>
                  <p style={styles.kpiSub}>{kpi.sub}</p>
                </div>
              </>
            )}
          </div>
        ))}
        <FuelDashboardCard prices={fuelPrices} onClick={() => navigate('/logistica/dashboard')} />
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <div style={styles.cardHeader}><h3 style={styles.cardTitle}>Performance (7 dias)</h3></div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs><linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D9FF00" stopOpacity={0.3}/><stop offset="95%" stopColor="#D9FF00" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#949494', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#949494', fontSize: 11}} />
                <Tooltip contentStyle={styles.tooltip} />
                <Area type="monotone" dataKey="entregas" stroke="#D9FF00" strokeWidth={3} fill="url(#grad1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.cardHeader}><h3 style={styles.cardTitle}>Receita (7 dias)</h3></div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#949494', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#949494', fontSize: 11}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={styles.tooltip} />
                <Bar dataKey="receita" fill="#0061FF" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={styles.bottomSection}>
        <div style={styles.activityCard}>
          <div style={styles.cardHeader}><h3 style={styles.cardTitle}>Feed de Atividades</h3><div style={styles.liveBadge}><div style={styles.liveDot} /> Live</div></div>
          <div style={styles.activityList}>
            {activities.length === 0 ? <p style={styles.emptyText}>Sem atividades recentes.</p> : activities.map(a => (
              <div key={a.id} style={styles.activityItem}>
                <div style={styles.activityMain}><p style={styles.activityAction}>{a.action}</p><span style={styles.activityTime}>{new Date(a.created_at).toLocaleTimeString()}</span></div>
                <p style={styles.activityDetails}>{a.details}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.financeSummary}>
          <div style={styles.finBox}>
            <p style={styles.finLabel}>RECEBIDO (MÊS)</p>
            <h4 style={styles.finValue}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.receivedAmount)}</h4>
          </div>
          <div style={styles.finBox}>
            <p style={styles.finLabel}>PREVISTO</p>
            <h4 style={{ ...styles.finValue, color: '#0061FF' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.expectedRevenue)}</h4>
          </div>
          <div style={styles.healthCard}>
            <div style={styles.healthCircle}><h2>100%</h2><p>Uptime</p></div>
          </div>
        </div>
      </div>
    </div>
  );

  const MiniCalendar = ({ events }: { events: any[] }) => {
    const today = new Date();
    const days = [];
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    for (let i = 0; i < firstDay; i++) days.push(null);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) days.push(new Date(today.getFullYear(), today.getMonth(), i));

    return (
      <div style={styles.calendar}>
        <div style={styles.calHeader}>{today.toLocaleString('pt-BR', { month: 'short' }).toUpperCase()} {today.getFullYear()}</div>
        <div style={styles.calGrid}>
          {['D','S','T','Q','Q','S','S'].map(d => <div key={d} style={styles.calWeekDay}>{d}</div>)}
          {days.slice(0, 14).map((d, i) => {
            const isToday = d?.toDateString() === today.toDateString();
            const hasEvent = d && events.some(e => new Date(e.start_date).toDateString() === d.toDateString());
            return (
              <div key={i} style={{ ...styles.calDay, ...(isToday ? styles.calToday : {}), ...(hasEvent ? styles.calEvent : {}) }}>
                {d ? d.getDate() : ''}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!profile) return null;

  return (
    <div className="animate-fade-in" style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Olá, {profile?.full_name?.split(' ')[0]}</h1>
          <p style={styles.subtitle}>Gerenciamento inteligente do ecossistema {company?.name}.</p>
        </div>
        <div style={styles.headerActions}>
          <button className="hub-premium-pill secondary" onClick={fetchMetrics} style={{ padding: '8px 16px' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync
          </button>
          <button className="hub-premium-pill secondary" onClick={() => setIsCalculatorOpen(true)} style={{ padding: '8px 16px' }}>
            <Calculator size={16} /> Calculadora
          </button>
          <button className="hub-premium-pill primary" onClick={() => navigate('/relatorios')}>
            Dashboard Full
          </button>
        </div>
      </header>

      <Modal isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} title="Calculadora Financeira" width="1000px"><FinanceCalculator /></Modal>

      {profile.role === 'RH' && <RHDashboard />}
      {profile.role === 'LOGISTICA' && <LogisticsDashboard />}
      {profile.role === 'FINANCEIRO' && <FinanceDashboard />}
      {profile.role === 'CRM' && <CRMDashboard />}
      {profile.role === 'ESTOQUE' && <InventoryDashboard />}
      {(profile.role === 'ADMIN' || profile.role === 'MASTER_ADMIN') && renderAdminView()}
    </div>
  );
};

const styles = {
  container: { padding: '24px 0', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '900', color: '#111827', letterSpacing: '-1px' },
  subtitle: { color: '#6B7280', fontSize: '15px', marginTop: '4px' },
  headerActions: { display: 'flex', gap: '12px' },
  btnPrimary: { backgroundColor: '#0061FF', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
  btnSecondary: { backgroundColor: '#fff', color: '#374151', border: '1px solid #E5E7EB', padding: '10px 18px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  adminView: { display: 'flex', flexDirection: 'column' as const, gap: '24px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' },
  kpiCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  kpiIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kpiContent: { flex: 1 },
  kpiLabel: { fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  kpiValue: { fontSize: '22px', fontWeight: '900', color: '#111827', margin: '2px 0' },
  kpiSub: { fontSize: '11px', color: '#6B7280' },
  miniCalContainer: { width: '100%' },
  calendar: { width: '100%' },
  calHeader: { fontSize: '10px', fontWeight: '900', color: '#0061FF', marginBottom: '8px', textAlign: 'center' as const },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' },
  calWeekDay: { fontSize: '9px', fontWeight: '800', color: '#D1D5DB', textAlign: 'center' as const },
  calDay: { fontSize: '10px', fontWeight: '700', color: '#4B5563', textAlign: 'center' as const, height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  calToday: { backgroundColor: '#0061FF', color: '#fff', borderRadius: '4px' },
  calEvent: { borderBottom: '2px solid #ef4444' },
  chartsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  chartCard: { backgroundColor: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #F3F4F6' },
  cardHeader: { marginBottom: '20px' },
  cardTitle: { fontSize: '16px', fontWeight: '800', color: '#111827' },
  tooltip: { borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  bottomSection: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
  activityCard: { backgroundColor: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #F3F4F6' },
  liveBadge: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#10B981', backgroundColor: '#ECFDF5', padding: '4px 10px', borderRadius: '20px' },
  liveDot: { width: '6px', height: '6px', backgroundColor: '#10B981', borderRadius: '50%', animation: 'pulse 2s infinite' },
  activityList: { display: 'flex', flexDirection: 'column' as const, gap: '16px', marginTop: '16px' },
  activityItem: { padding: '12px', borderRadius: '12px', backgroundColor: '#F9FAFB' },
  activityMain: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  activityAction: { fontSize: '14px', fontWeight: '700', color: '#111827' },
  activityTime: { fontSize: '11px', color: '#9CA3AF' },
  activityDetails: { fontSize: '12px', color: '#6B7280' },
  emptyText: { textAlign: 'center' as const, color: '#9CA3AF', padding: '20px' },
  financeSummary: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  finBox: { backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #F3F4F6' },
  finLabel: { fontSize: '10px', fontWeight: '800', color: '#9CA3AF', marginBottom: '8px' },
  finValue: { fontSize: '20px', fontWeight: '900', color: '#111827' },
  healthCard: { backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #F3F4F6', display: 'flex', justifyContent: 'center' },
  healthCircle: { width: '120px', height: '120px', borderRadius: '50%', border: '8px solid #F3F4F6', borderTopColor: '#10B981', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' },
};

export default Dashboard;
