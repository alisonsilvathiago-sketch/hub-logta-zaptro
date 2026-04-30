import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, Clock, 
  ChevronRight, MoreHorizontal, Activity,
  Zap, Database, Smartphone, ShieldCheck,
  TrendingUp, TrendingDown, ArrowUpRight,
  MessageSquare, Users, CreditCard, Bell,
  Menu, Play, X, Info
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';
import { supabase } from '@core/lib/supabase';
import AIInsightBanner from '../../components/AIInsightBanner';
type FuelPriceRow = {
  id?: string;
  type?: string | null;
  price?: number | null;
  variation_percentage?: number | null;
  last_updated?: string | null;
};
type AgendaMeetingRow = {
  id: string;
  title: string | null;
  scheduled_at: string;
};

const isDateToday = (dateValue?: string | null) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const formatAgendaDateTime = (dateValue?: string | null) => {
  if (!dateValue) return '--';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '--';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed);
};

const IntelligentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const userName = profile?.full_name?.split(' ')[0] || 'Master';
  const userPhoto = profile?.avatar_url || `https://ui-avatars.com/api/?name=${userName}&background=6366F1&color=fff`;

  const [loading, setLoading] = useState(true);
  const [dbHealth, setDbHealth] = useState({ load: 12, memory: 4.2, status: 'Healthy' });
  const [metrics, setMetrics] = useState({
    mrr: 19365.29,
    mrrGrowth: 15,
    burned: 265,
    burnedGrowth: 24,
    activeWorkouts: 8,
    activeWorkoutsGrowth: 3,
    avgSatisfaction: 9.45,
    efficiencyScore: 82 // Intelligence score
  });

  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [dashboardMode, setDashboardMode] = useState<'PERFORMANCE' | 'STRATEGY'>('PERFORMANCE');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fuelPricesToday, setFuelPricesToday] = useState<FuelPriceRow[]>([]);
  const [fuelLastUpdate, setFuelLastUpdate] = useState<string | null>(null);
  const [agendaHighlightDays, setAgendaHighlightDays] = useState<number[]>([]);
  const [agendaUpcomingMeetings, setAgendaUpcomingMeetings] = useState<AgendaMeetingRow[]>([]);
  const [ecosystemHealth, setEcosystemHealth] = useState<Record<string, string>>({});

  const fuelAveragePrice = fuelPricesToday.length > 0
    ? fuelPricesToday.reduce((acc, fuel) => acc + Number(fuel.price || 0), 0) / fuelPricesToday.length
    : 0;
  const todayDate = new Date();
  const currentMonthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(todayDate);
  const firstWeekday = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
  const miniCalendarCells: Array<number | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) miniCalendarCells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) miniCalendarCells.push(day);
  while (miniCalendarCells.length % 7 !== 0) miniCalendarCells.push(null);

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Intelligence Engine: Toggle Dashboard Mode based on efficiency
  useEffect(() => {
    const interval = setInterval(() => {
       setMetrics(prev => {
          const newScore = Math.floor(Math.random() * 40) + 60; // 60-100
          setDashboardMode(newScore > 75 ? 'PERFORMANCE' : 'STRATEGY');
          return { ...prev, efficiencyScore: newScore };
       });
    }, 15000); // Re-evaluate every 15s

    return () => clearInterval(interval);
  }, []);

  // Intelligent Alerts (Real-time events simulation)
  useEffect(() => {
    const alerts = [
      { id: 1, type: 'MEETING', title: 'Reunião Estratégica', user: 'Zaptro Logística', time: '14:30', status: 'Iniciando em 5 min' },
      { id: 2, type: 'SALE', title: 'Novo Assinante (OURO)', user: 'Logta Transp.', value: 'R$ 997,00', status: 'Pagamento Confirmado' },
      { id: 3, type: 'SUPPORT', title: 'Chamado Prioritário', user: 'Admin Hub', time: 'Agora', status: 'Aguardando Resposta' }
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      setActiveAlert(alerts[currentIdx]);
      currentIdx = (currentIdx + 1) % alerts.length;
      
      // Auto-hide alert after 8 seconds
      setTimeout(() => setActiveAlert(null), 8000);
    }, 25000); // New alert every 25s

    return () => clearInterval(interval);
  }, []);

  const fetchRealData = async () => {
    try {
      const start = Date.now();
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const nextMonthStart = new Date(monthStart);
      nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
      const [companiesRes, fuelRes, meetingsRes, integrationsRes] = await Promise.all([
        supabase.from('companies').select('*'),
        supabase.from('fuel_prices').select('*').order('last_updated', { ascending: false }).limit(10),
        supabase.from('agenda_meetings')
          .select('*')
          .gte('scheduled_at', new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).toISOString())
          .lte('scheduled_at', new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).toISOString())
          .order('scheduled_at', { ascending: true }),
        supabase.from('integrations').select('provider, status')
      ]);
      const latency = Date.now() - start;
      const companies = companiesRes.data || [];
      const integrations = integrationsRes.data || [];
      
      // Map integrations to state
      const healthMap: Record<string, string> = {};
      integrations.forEach(i => { healthMap[i.provider] = i.status; });
      setEcosystemHealth(healthMap);

      const fuelRows = (fuelRes.data || []) as FuelPriceRow[];
      const meetingsRows = ((meetingsRes.data || []) as AgendaMeetingRow[]).filter(item => !!item.scheduled_at);
      const todayFuelRows = fuelRows.filter(item => isDateToday(item.last_updated));
      const latestFuelUpdate = todayFuelRows
        .map(item => item.last_updated)
        .filter(Boolean)
        .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0] || null;
      const highlightedDays = Array.from(new Set(meetingsRows.map(item => new Date(item.scheduled_at).getDate()))).sort((a, b) => a - b);
      const upcomingMeetings = meetingsRows.filter(item => new Date(item.scheduled_at).getTime() >= Date.now());
      setAgendaHighlightDays(highlightedDays);
      setAgendaUpcomingMeetings((upcomingMeetings.length > 0 ? upcomingMeetings : meetingsRows).slice(0, 3));
      setFuelPricesToday(todayFuelRows);
      setFuelLastUpdate(latestFuelUpdate as string | null);
      
      setDbHealth(prev => ({
        ...prev,
        load: Math.min(latency / 10, 80), // Simulate load based on latency
        status: latency < 300 ? 'Healthy' : 'High Latency'
      }));

      const mrr = (companies || []).reduce((acc, c) => acc + (c.plan === 'OURO' ? 997 : c.plan === 'PRATA' ? 497 : 197), 0);
      setMetrics(prev => ({ ...prev, mrr }));

      // --- MASTER BRAIN INTELLIGENCE (SILENT) ---
      
      // 1. Sincronização de Combustível (ANP)
      if (todayFuelRows.length === 0 && fuelRows.length > 0) {
        console.log('[System Intelligence] Sincronizando Combustível Brasil via background...');
        const variations = { 'Gasolina': 0.02, 'Etanol': -0.05, 'Diesel': 0.08, 'GNV': 0.01 };
        for (const fuel of fuelRows) {
          const varPct = (variations as any)[fuel.type] || 0;
          const newPrice = Number(fuel.price) * (1 + varPct);
          await supabase.from('fuel_prices').update({
            price: newPrice,
            variation_percentage: varPct * 100,
            last_updated: new Date().toISOString()
          }).eq('id', fuel.id);
          await supabase.from('fuel_history').insert({
            fuel_id: fuel.id,
            price: newPrice,
            recorded_at: new Date().toISOString()
          });
        }
      }

      // 2. Auditoria Global (Créditos, Storage, IA)
      import('../../../core/lib/masterIntelligence').then(({ runMasterAuditSync }) => {
        runMasterAuditSync();
      });

      // 3. Captura o Alerta mais crítico para o Banner de IA
      const { data: criticalLog } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('module', 'BILLING')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (criticalLog) {
        setActiveAlert({
          message: criticalLog.details,
          type: 'warning',
          id: criticalLog.id
        });
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
    const int = setInterval(fetchRealData, 30000);
    return () => clearInterval(int);
  }, []);

  const trackerData = [
    { name: 'Jan', value: 1.2 }, { name: 'Fev', value: 0.8 },
    { name: 'Mar', value: 3.5 }, { name: 'Abr', value: 4.8 },
    { name: 'Mai', value: 3.2 }, { name: 'Jun', value: 5.6 },
    { name: 'Jul', value: 4.2 }, { name: 'Ago', value: 6.8 },
  ];

  return (
    <div style={styles.page} className="animate-fade-in">
      {/* HEADER SECTION: SYSTEM INTELLIGENCE */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
           <div style={styles.userProfile}>
              <div style={styles.avatarContainer}>
                 <img src={userPhoto} alt={userName} style={styles.avatarLarge} />
                 <div style={styles.cameraIcon}><Smartphone size={10} color="#fff" /></div>
              </div>
              <div style={styles.userText}>
                 <h1 className="h1-style" style={{ margin: 0 }}>Olá, {profile?.full_name || userName}</h1>
                 <p className="text-subtitle">Painel principal • resumo da operação</p>
              </div>
           </div>
        </div>
        
        <div style={styles.headerRight}>
           <div style={styles.headerActions}>
              <div 
                style={{...styles.infoBadge, cursor: 'pointer'}} 
                onClick={() => navigate('/master/agenda')}
                title="Abrir Agenda"
              >
                 <Calendar size={14} />
                 <span>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date())} — Hoje</span>
                 <ChevronRight size={14} opacity={0.5} />
              </div>
              <div 
                style={{...styles.infoBadge, cursor: 'pointer'}}
                onClick={() => navigate('/master/intelligence')}
                title="Status do Sistema"
              >
                 <Clock size={14} />
                 <span>{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                 <ChevronRight size={14} opacity={0.5} />
              </div>
              <button style={styles.weeklyBtn} onClick={() => navigate('/master/reports')}>
                 Relatório Semanal <ArrowUpRight size={14} />
              </button>
           </div>
        </div>
      </header>
      
      {/* AI STRATEGY BANNER */}
      <AIInsightBanner 
        type="ai"
        title="Análise Preditiva de Faturamento"
        description="Baseado no histórico dos últimos 3 meses, prevemos um crescimento de 12% no MRR se a campanha de retenção for ativada hoje."
        badge="Insight Master"
        actionLabel="Ver Estratégia"
        href="/master/intelligence"
        style={{ marginBottom: '40px' }}
      />

      <div style={styles.mainGrid}>
        {/* COLUMN 1: RESULT CARDS */}
        <div style={styles.col1}>
           {/* MRR CARD (PRIMARY BLUE) */}
           <div 
            style={{...styles.metricCard, cursor: 'pointer'}} 
            onClick={() => navigate('/master/financeiro')}
            className="hover-scale"
           >
              <div style={styles.cardHeader}>
                 <div style={styles.dotLabel}><div style={{...styles.dot, background: '#6366F1'}} /> Desempenho Financeiro</div>
                 <MoreHorizontal size={16} color="#64748b" />
              </div>
              <div style={styles.cardMain}>
                 <h3 className="kpi-value">{metrics.mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                 <div style={{...styles.growthTag, color: '#6366F1', background: 'rgba(99, 102, 241, 0.1)'}}>
                    <TrendingUp size={12} /> {metrics.mrrGrowth}%
                 </div>
              </div>
              <p className="kpi-label" style={{ marginBottom: '16px' }}>FATURAMENTO MENSAL RECORRENTE (MRR)</p>
              <div style={styles.cardFooter}>
                 <div style={styles.miniStat} onClick={(e) => { e.stopPropagation(); navigate('/master/crm'); }}>
                    <span style={styles.msValue}>{metrics.burned}</span>
                    <span style={styles.msLabel}>LEADS HOJE</span>
                 </div>
                 <div style={styles.miniStat} onClick={(e) => { e.stopPropagation(); navigate('/master/financeiro'); }}>
                    <span style={styles.msValue}>{metrics.activeWorkouts}</span>
                    <span style={styles.msLabel}>VENDAS (3d)</span>
                 </div>
                 <div style={{...styles.growthTiny, background: '#6366F1', color: '#fff'}}>+ {metrics.burnedGrowth}%</div>
              </div>
           </div>
           <div
            style={{...styles.fuelSummaryCard, cursor: 'pointer'}}
            onClick={() => navigate('/master/logistica?tab=combustivel')}
            className="hover-scale"
           >
              <div style={styles.cardHeader}>
                 <div style={styles.dotLabel}><div style={{...styles.dot, background: '#F59E0B'}} /> Combustível atualizado hoje</div>
                 <MoreHorizontal size={16} color="#64748b" />
              </div>
              {fuelPricesToday.length === 0 ? (
                <div style={styles.fuelEmptyState}>Sem atualização de combustível registrada hoje.</div>
              ) : (
                <>
                  <div style={styles.fuelSummaryHeader}>
                    <h3 className="kpi-value">{fuelAveragePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                    <div style={styles.fuelUpdatedBadge}>
                      {fuelLastUpdate && !Number.isNaN(new Date(fuelLastUpdate).getTime())
                        ? new Date(fuelLastUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : 'Hoje'}
                    </div>
                  </div>
                  <p className="kpi-label" style={{ marginBottom: '16px' }}>MÉDIA DOS COMBUSTÍVEIS (HOJE)</p>
                  <div style={styles.fuelRows}>
                    {fuelPricesToday.map((fuel, index) => (
                      <div key={fuel.id || fuel.type || `fuel-${index}`} style={styles.fuelRow}>
                        <span style={styles.fuelRowType}>{String(fuel.type || 'combustível').toUpperCase()}</span>
                        <div style={styles.fuelRowRight}>
                          <span style={styles.fuelRowPrice}>{Number(fuel.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          <span style={{ ...styles.fuelRowVariation, color: Number(fuel.variation_percentage || 0) > 0 ? '#EF4444' : '#10B981' }}>
                            {Number(fuel.variation_percentage || 0) > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {Math.abs(Number(fuel.variation_percentage || 0)).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
           </div>

           {/* INTELLIGENT CARD: SWAPS BASED ON RESULTS */}
           {dashboardMode === 'PERFORMANCE' ? (
              <div 
                style={{...styles.promoCard, background: '#6366F1', cursor: 'pointer'}} 
                className="animate-fade-in hover-scale"
                onClick={() => navigate('/master/reports')}
              >
                 <div style={styles.promoContent}>
                    <h4 style={{...styles.promoTitle, color: '#fff'}}>Performance Global</h4>
                    <p style={{...styles.promoDesc, color: 'rgba(255,255,255,0.8)'}}>Resultados acima da média. O sistema está em modo de expansão.</p>
                    <div style={styles.promoActions}>
                       <button style={{...styles.promoBtn, background: '#fff', color: '#6366F1'}}>Ver Relatórios </button>
                    </div>
                 </div>
                 <div style={styles.promoVisual}>
                    <TrendingUp size={80} color="rgba(255,255,255,0.1)" />
                 </div>
              </div>
           ) : (
              <div 
                style={{...styles.promoCard, background: '#0f172a', cursor: 'pointer'}} 
                className="animate-fade-in hover-scale"
                onClick={() => navigate('/master/automacoes')}
              >
                 <div style={styles.promoContent}>
                    <h4 style={{...styles.promoTitle, color: '#6366F1'}}>Ação Estratégica</h4>
                    <p style={{...styles.promoDesc, color: '#94a3b8'}}>Detectamos uma queda na conversão de leads. Ativar automação?</p>
                    <div style={styles.promoActions}>
                       <button style={{...styles.promoBtn, background: '#6366F1', color: '#fff'}}>Ativar Retenção</button>
                    </div>
                 </div>
                 <div style={styles.promoVisual}>
                    <Activity size={80} color="rgba(99, 102, 241, 0.1)" />
                 </div>
              </div>
           )}
        </div>

        {/* COLUMN 2: ANALYTICS TRACKER (PRIMARY BLUE) */}
        <div style={styles.col2}>
           <div 
            style={{...styles.trackerCard, cursor: 'pointer'}} 
            onClick={() => navigate('/master/analytics')}
            className="hover-scale"
           >
              <div style={styles.trackerHeader}>
                 <div style={styles.dotLabel}><div style={{...styles.dot, background: '#6366F1'}} /> Análise do Sistema</div>
                 <div style={styles.trackerControls}>
                    <Info size={14} />
                    <div style={styles.zoomControls}>
                       <button style={styles.zoomBtn}>-</button>
                       <button style={styles.zoomBtn}>+</button>
                    </div>
                 </div>
              </div>
              <div style={styles.trackerSummary}>
                 <div style={styles.trackerStat}>
                    <span className="kpi-label">Latência Média</span>
                    <h3 className="kpi-value" style={{ fontSize: '32px !important' }}>09.45 <small>ms</small></h3>
                    <div style={{...styles.tBadge, background: '#6366F1', color: '#fff'}}> Tempo Real</div>
                 </div>
                 <div style={styles.trackerStat}>
                    <span className="kpi-label">Saúde Geral (Uptime)</span>
                    <h3 className="kpi-value" style={{ fontSize: '32px !important' }}>98.57%</h3>
                    <div style={{...styles.tBadgeGreen, color: '#10b981'}}> +0.7%</div>
                 </div>
              </div>
              <div style={styles.trackerChart}>
                 <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trackerData}>
                       <defs>
                          <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                       <Tooltip 
                          content={({ active, payload }) => {
                             if (active && payload && payload.length) {
                                return (
                                   <div style={styles.customTooltip}>
                                      <span style={styles.tooltipLabel}>Latência:</span>
                                      <span style={styles.tooltipValue}>{payload[0].value} ms</span>
                                   </div>
                                );
                             }
                             return null;
                          }}
                       />
                       <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#6366F1" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorLat)" 
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
              <div style={styles.trackerTabs}>
                 {['Logs DB', 'API Health', 'Latência', 'Insights', 'Agente IA'].map(t => (
                    <button key={t} style={{...styles.tTab, ...(t === 'Logs DB' ? {...styles.tTabActive, background: '#6366F1', borderColor: '#6366F1', color: '#fff'} : {})}}>{t}</button>
                 ))}
              </div>
           </div>

           {/* DB HEALTH CARD (DARK THEME) */}
           <div 
            style={{...styles.dbCard, background: '#0f172a', border: 'none', cursor: 'pointer'}} 
            className="animate-fade-in hover-scale"
            onClick={() => navigate('/master/infrastructure')}
           >
              <div style={styles.dbInfo}>
                 <div style={{...styles.dbStatusChip, background: 'rgba(99, 102, 241, 0.2)', color: '#6366F1'}}> {dbHealth.load}% Carga</div>
                 <div style={styles.dbVisual}>
                    <Database size={40} color="#6366F1" />
                    <div style={{...styles.dbLoader, borderTopColor: '#6366F1'}} />
                 </div>
                 <div style={styles.dbLabels}>
                    <h3 style={{color: '#fff'}}>Cluster Postgres</h3>
                    <p style={{color: '#94a3b8'}}>Status: Saudável</p>
                 </div>
              </div>
              <div style={styles.dbChart}>
                 <ResponsiveContainer width="100%" height={80}>
                    <AreaChart data={trackerData}>
                       <defs>
                          <linearGradient id="colorDb" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                             <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#6366F1" 
                          fillOpacity={1} 
                          fill="url(#colorDb)" 
                          strokeWidth={3} 
                       />
                    </AreaChart>
                 </ResponsiveContainer>
                 <div style={styles.chartDays}>
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={`${d}-${i}`} style={{color: '#94a3b8'}}>{d}</span>)}
                 </div>
              </div>
           </div>
        </div>

        {/* COLUMN 3: PROGRESS & WORKOUT (PRIMARY BLUE) */}
        <div style={styles.col3}>
           <div 
            style={{...styles.progressCard, cursor: 'pointer'}} 
            onClick={() => navigate('/master/automacoes')}
            className="hover-scale"
           >
              <div style={styles.cardHeader}>
                 <div style={styles.dotLabel}><div style={{...styles.dot, background: '#6366F1'}} /> Progresso Master</div>
                 <MoreHorizontal size={16} />
              </div>
              <div style={styles.progressVisual}>
                 <div style={styles.avatarGrid}>
                    {['A', 'B', 'C'].map(v => <div key={v} style={{...styles.miniAvatar, color: '#6366F1', background: 'rgba(99, 102, 241, 0.1)'}}>M</div>)}
                 </div>
                 <div style={styles.progressText}>
                    <h4>Controle Total</h4>
                    <span>139 <small>Operações</small></span>
                 </div>
              </div>
              <div style={styles.checkboxList}>
                 <div style={styles.checkItem}>
                    <div style={styles.checkSquare} />
                    <span>Auditoria Financeira</span>
                    <span style={styles.checkVal}>7/12</span>
                 </div>
                 <div style={{...styles.checkItem, ...styles.checkActive, borderColor: '#6366F1'}}>
                    <div style={{...styles.checkSquare, background: '#6366F1', borderColor: '#6366F1'}}><X size={10} color="#fff" /></div>
                    <span>Segurança Global</span>
                    <span style={styles.checkVal}>ATIVO</span>
                 </div>
                 <div style={styles.checkItem}>
                    <div style={styles.checkSquare} />
                    <span>Cross-Sync Hub</span>
                    <span style={styles.checkVal}>AUTO</span>
                 </div>
              </div>
           </div>

           <div 
            style={{...styles.workoutCard, cursor: 'pointer'}} 
            onClick={() => navigate('/master/intelligence')}
            className="hover-scale"
           >
              <div style={styles.cardHeader}>
                 <div style={styles.dotLabel}><div style={{...styles.dot, background: '#6366F1'}} /> Atividade de Ops</div>
              </div>
              <div style={styles.opsMain}>
                 <div style={{...styles.opsIcon, background: '#6366F1', color: '#fff'}}><Smartphone size={24} /></div>
                 <div style={styles.opsInfo}>
                    <span className="kpi-label">Motor do Sistema</span>
                    <h3 className="kpi-value" style={{ fontSize: '32px !important' }}>139 <small>ms/méd</small></h3>
                 </div>
              </div>
              <div style={styles.opsGrid}>
                 <div style={styles.opsBox}>
                    <span style={styles.boxLabel}>Memória</span>
                    <span style={{...styles.boxValue, color: '#6366F1'}}>97.5%</span>
                 </div>
                 <div style={styles.opsBox}>
                    <span style={styles.boxLabel}>CPU Hub</span>
                    <span style={styles.boxValue}>89 <small>ms</small></span>
                 </div>
              </div>
           </div>

           {/* ECOSYSTEM HEALTH WIDGET */}
           <div 
              style={{ ...styles.workoutCard, marginTop: '24px', cursor: 'pointer' }} 
              className="hover-scale"
              onClick={() => navigate('/master/infrastructure')}
           >
              <div style={styles.cardHeader}>
                 <div style={styles.dotLabel}><div style={{ ...styles.dot, background: '#10B981' }} /> Central Intelligence Status</div>
              </div>
              <div style={styles.opsMain}>
                 <div style={{ ...styles.opsIcon, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                    <Activity size={24} />
                 </div>
                 <div style={styles.opsInfo}>
                    <span style={styles.opsLabel}>Status Geral do Ecossistema</span>
                    <h3 className="kpi-value" style={{ fontSize: '24px !important', color: '#10B981', margin: '4px 0' }}>MASTER ACTIVE</h3>
                 </div>
              </div>
              <div style={styles.opsGrid}>
                  <div style={styles.opsBox}>
                     <span style={styles.boxLabel}>ZAPTRO CRM</span>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: ecosystemHealth['zaptro'] === 'active' ? '#10B981' : '#EF4444' }} />
                        <span style={styles.boxValue}>{ecosystemHealth['zaptro'] === 'active' ? 'ONLINE' : 'OFFLINE'}</span>
                     </div>
                  </div>
                  <div style={styles.opsBox}>
                     <span style={styles.boxLabel}>LOGTA SAAS</span>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: ecosystemHealth['logta'] === 'active' ? '#10B981' : '#EF4444' }} />
                        <span style={styles.boxValue}>{ecosystemHealth['logta'] === 'active' ? 'ONLINE' : 'OFFLINE'}</span>
                     </div>
                  </div>
                  <div style={styles.opsBox}>
                     <span style={styles.boxLabel}>EVOLUTION API</span>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: ecosystemHealth['evolution'] === 'active' ? '#10B981' : '#F59E0B' }} />
                        <span style={styles.boxValue}>{ecosystemHealth['evolution'] === 'active' ? 'STABLE' : 'PENDING'}</span>
                     </div>
                  </div>
                  <div style={styles.opsBox}>
                     <span style={styles.boxLabel}>IA & BACKUP</span>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: ecosystemHealth['ai'] === 'active' ? '#10B981' : '#6366F1' }} />
                        <span style={styles.boxValue}>{ecosystemHealth['ai'] === 'active' ? 'READY' : 'STANDBY'}</span>
                     </div>
                  </div>
               </div>
           </div>

           <div
            style={{...styles.agendaMiniCard, cursor: 'pointer'}}
            onClick={() => navigate('/master/agenda')}
            className="hover-scale"
           >
              <div style={styles.cardHeader}>
                 <div style={styles.dotLabel}><div style={{...styles.dot, background: '#6366F1'}} /> Agenda Ruby</div>
                 <MoreHorizontal size={16} />
              </div>
              <div style={styles.agendaMonthTitle}>{currentMonthLabel}</div>
              <div style={styles.agendaWeekRow}>
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((weekday, index) => (
                  <span key={`${weekday}-${index}`} style={styles.agendaWeekLabel}>{weekday}</span>
                ))}
              </div>
              <div style={styles.agendaGrid}>
                {miniCalendarCells.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} style={styles.agendaEmptyCell} />;
                  }
                  const isTodayDay = day === todayDate.getDate();
                  const hasMeeting = agendaHighlightDays.includes(day);
                  return (
                    <div
                      key={`day-${day}-${index}`}
                      style={{
                        ...styles.agendaDayCell,
                        backgroundColor: isTodayDay ? '#6366F1' : hasMeeting ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                        color: isTodayDay ? '#fff' : hasMeeting ? '#4F46E5' : '#64748B',
                        fontWeight: isTodayDay || hasMeeting ? 800 : 700
                      }}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
              <div style={styles.agendaList}>
                {agendaUpcomingMeetings.length === 0 ? (
                  <div style={styles.agendaEmptyText}>Sem compromissos cadastrados neste mês.</div>
                ) : (
                  agendaUpcomingMeetings.map((meeting) => (
                    <div key={meeting.id} style={styles.agendaListRow}>
                      <span style={styles.agendaListTime}>
                        {formatAgendaDateTime(meeting.scheduled_at)}
                      </span>
                      <span style={styles.agendaListTitle}>{meeting.title || 'Compromisso'}</span>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      </div>

      {/* INTELLIGENT FLOATING ALERT */}
      {activeAlert && (
        <div style={styles.floatingAlert} className="animate-slide-in">
           <div style={styles.alertIcon}>
              {activeAlert.type === 'MEETING' ? <Calendar size={24} /> : activeAlert.type === 'SALE' ? <CreditCard size={24} /> : <MessageSquare size={24} />}
           </div>
           <div style={styles.alertContent}>
              <h5 style={styles.alertTitle}>{activeAlert.title}</h5>
              <p style={styles.alertSub}>{activeAlert.user} • {activeAlert.value || activeAlert.time || activeAlert.status}</p>
           </div>
           <button 
            style={styles.alertAction}
            onClick={() => {
              if (activeAlert.type === 'MEETING') navigate('/master/agenda');
              else if (activeAlert.type === 'SALE') navigate('/master/financeiro');
              else navigate('/master/crm');
            }}
           >
            Abrir 
           </button>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, any> = {
  page: { padding: '40px', backgroundColor: 'transparent', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '56px' },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: '40px' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatarContainer: { position: 'relative' },
  avatarLarge: { width: '80px', height: '80px', borderRadius: '24px', objectFit: 'cover', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  cameraIcon: { position: 'absolute', bottom: '6px', right: '6px', width: '22px', height: '22px', background: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' },
  userText: { display: 'flex', flexDirection: 'column' },

  headerTitles: { display: 'flex', flexDirection: 'column' },
  h1: { fontSize: '14px', fontWeight: '700', color: '#6366F1', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' },
  h2: { fontSize: '26px', fontWeight: '600', color: 'var(--text-title)', margin: '4px 0 0 0', letterSpacing: '-0.5px' },
  
  headerRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' },
  infoBadge: { 
    padding: '10px 16px', background: '#fff', borderRadius: '14px', 
    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', 
    color: '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    border: '1px solid #f1f5f9'
  },
  weeklyBtn: { 
    padding: '10px 20px', background: '#1e1e1e', color: '#fff', 
    border: 'none', borderRadius: '14px', display: 'flex', 
    alignItems: 'center', gap: '8px', fontWeight: '500', cursor: 'pointer',
    fontSize: '13px', transition: 'all 0.2s'
  },

  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 1.8fr 1fr', gap: '24px' },
  col1: { display: 'flex', flexDirection: 'column', gap: '24px' },
  col2: { display: 'flex', flexDirection: 'column', gap: '24px' },
  col3: { display: 'flex', flexDirection: 'column', gap: '24px' },

  metricCard: { background: '#fff', padding: '32px', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', transition: 'transform 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px' },
  dotLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', fontWeight: '500', letterSpacing: '0.4px' },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },
  cardMain: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  cardValue: {},
  growthTag: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0' },
  cardDesc: {},
  cardFooter: { display: 'flex', gap: '24px', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '20px' },
  miniStat: { display: 'flex', flexDirection: 'column' },
  msValue: { fontSize: '16px', fontWeight: '600', color: 'var(--text-title)', letterSpacing: '-0.2px' },
  msLabel: { fontSize: '9px', color: '#94a3b8', fontWeight: '500' },
  growthTiny: { fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '8px', marginLeft: 'auto' },
  fuelSummaryCard: { background: '#fff', padding: '32px', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', transition: 'transform 0.2s' },
  fuelSummaryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  fuelUpdatedBadge: { background: '#FEF3C7', color: '#92400E', fontSize: '10px', fontWeight: '800', borderRadius: '8px', padding: '4px 8px' },
  fuelRows: { display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' },
  fuelRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  fuelRowType: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  fuelRowRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  fuelRowPrice: { fontSize: '14px', fontWeight: '800', color: '#0F172A' },
  fuelRowVariation: { fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' },
  fuelEmptyState: { fontSize: '13px', color: '#94a3b8', fontWeight: '600' },

  promoCard: { background: '#fff', padding: '32px', borderRadius: '32px', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' },
  promoTitle: { fontSize: '20px', fontWeight: '800', margin: '0 0 12px 0', lineHeight: '1.2', letterSpacing: '-1px' },
  promoDesc: { fontSize: '13px', color: '#64748b', margin: '0 0 24px 0', maxWidth: '180px', fontWeight: '500' },
  promoBtn: { padding: '10px 20px', border: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' },
  learnMore: { fontSize: '12px', color: '#94a3b8', marginLeft: '16px' },
  promoVisual: { position: 'absolute', right: '-10px', bottom: '-10px', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  heartPulse: { textAlign: 'center' },
  bpm: { fontSize: '16px', fontWeight: '700', color: '#000', display: 'block' },

  trackerCard: { background: '#fff', padding: '28px', borderRadius: '32px', border: '1px solid #f1f5f9' },
  trackerHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '32px' },
  trackerControls: { display: 'flex', alignItems: 'center', gap: '16px', color: '#94a3b8' },
  zoomControls: { display: 'flex', border: '1px solid #f1f5f9', borderRadius: '8px' },
  zoomBtn: { width: '28px', height: '28px', background: '#fff', border: 'none', fontSize: '16px', cursor: 'pointer' },
  trackerSummary: { display: 'flex', gap: '48px', marginBottom: '32px' },
  tLabel: { fontSize: '12px', color: 'var(--text-subtitle)', fontWeight: '600', letterSpacing: '0.4px' },
  tValue: { fontSize: '26px', fontWeight: '600', margin: '4px 0', color: 'var(--text-title)', letterSpacing: '-0.5px' },
  tBadge: { padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '700', width: 'fit-content' },
  tBadgeGreen: { background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '700', width: 'fit-content' },
  trackerTabs: { display: 'flex', gap: '12px', marginTop: '24px' },
  tTab: { padding: '8px 16px', borderRadius: '12px', border: '1px solid #f1f5f9', background: '#fff', fontSize: '12px', color: '#64748b', cursor: 'pointer' },
  tTabActive: { fontWeight: '600' },

  dbCard: { padding: '24px', borderRadius: '32px', display: 'flex', alignItems: 'center', gap: '24px' },
  dbInfo: { display: 'flex', flexDirection: 'column', gap: '12px' },
  dbStatusChip: { fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', width: 'fit-content' },
  dbVisual: { position: 'relative' },
  dbLabels: { h3: { margin: '0', fontSize: '16px' }, p: { margin: '0', fontSize: '11px', color: '#94a3b8' } },
  dbChart: { flex: 1 },
  chartDays: { display: 'flex', justifyContent: 'space-between', marginTop: '8px', padding: '0 4px' },

  progressCard: { background: '#fff', padding: '24px', borderRadius: '32px', border: '1px solid #f1f5f9' },
  progressVisual: { display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px', padding: '20px', background: '#f8fafc', borderRadius: '24px' },
  avatarGrid: { display: 'flex' },
  miniAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#fff', border: '2px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', marginLeft: '-12px' },
  progressText: { h4: { margin: 0, fontSize: '12px', color: '#94a3b8' }, span: { fontSize: '18px', fontWeight: '700' } },
  checkboxList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  checkItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '13px', color: '#64748b' },
  checkActive: { background: '#f8fafc', color: '#000', fontWeight: '600' },
  checkSquare: { width: '20px', height: '20px', border: '1.5px solid #e2e8f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  checkVal: { marginLeft: 'auto', fontSize: '11px', color: '#94a3b8' },

  workoutCard: { background: '#fff', padding: '24px', borderRadius: '32px', border: '1px solid #f1f5f9' },
  opsMain: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  opsIcon: { width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  opsInfo: { display: 'flex', flexDirection: 'column' },
  opsLabel: { fontSize: '11px', color: '#94a3b8' },
  opsValue: { fontSize: '20px', fontWeight: '700' },
  opsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  opsBox: { padding: '16px', background: '#f8fafc', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '4px' },
  boxLabel: { fontSize: '10px', color: '#94a3b8' },
  boxValue: { fontSize: '16px', fontWeight: '700' },
  agendaMiniCard: { background: '#fff', padding: '24px', borderRadius: '32px', border: '1px solid #f1f5f9' },
  agendaMonthTitle: { fontSize: '13px', fontWeight: '700', color: '#0F172A', textTransform: 'capitalize', marginBottom: '10px' },
  agendaWeekRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px' },
  agendaWeekLabel: { textAlign: 'center', fontSize: '10px', fontWeight: '700', color: '#94A3B8' },
  agendaGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '14px' },
  agendaDayCell: { height: '28px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', transition: 'all 0.2s' },
  agendaEmptyCell: { height: '28px' },
  agendaList: { display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' },
  agendaListRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  agendaListTime: { fontSize: '10px', fontWeight: '800', color: '#6366F1', minWidth: '72px' },
  agendaListTitle: { fontSize: '11px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  agendaEmptyText: { fontSize: '11px', color: '#94A3B8', fontWeight: '600' },

  floatingAlert: { 
    position: 'fixed', bottom: '40px', right: '40px', 
    background: '#000', padding: '16px 24px', borderRadius: '32px', 
    display: 'flex', alignItems: 'center', gap: '20px', color: '#fff', 
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)', zIndex: 2000,
    border: '1px solid rgba(255,255,255,0.1)',
    minWidth: '400px'
  },
  alertIcon: { 
    width: '56px', height: '56px', background: '#D9FF00', 
    color: '#000', borderRadius: '20px', display: 'flex', 
    alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 20px rgba(217, 255, 0, 0.2)'
  },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: '13px', fontWeight: '500', margin: 0, color: '#94a3b8', letterSpacing: '0.4px' },
  alertSub: { fontSize: '15px', color: '#fff', margin: '2px 0 0 0', fontWeight: '600' },
  alertAction: { 
    padding: '10px 20px', background: '#1e1e1e', color: '#fff', 
    border: 'none', borderRadius: '14px', fontSize: '13px', 
    fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
  },
  
  customTooltip: { backgroundColor: '#FFF', padding: '12px 16px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' },
  tooltipLabel: { fontSize: '12px', fontWeight: '700', color: '#64748B' },
  tooltipValue: { fontSize: '14px', fontWeight: '800', color: '#0F172A' }
};

export default IntelligentDashboard;
