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

  // Simulated Intelligent Alerts
  useEffect(() => {
    const alerts = [
      { id: 1, type: 'MEETING', title: 'Reunião: Expansão Logta', time: 'Em 2 min', user: 'Alisson Thiago' },
      { id: 2, type: 'SALE', title: 'Nova Assinatura OURO', value: 'R$ 997,00', user: 'TransLog S.A.' },
      { id: 3, type: 'SUPPORT', title: 'Cliente solicitou ajuda', user: 'Eduarda Mendes', status: 'URGENTE' }
    ];

    let current = 0;
    const interval = setInterval(() => {
      setActiveAlert(alerts[current % alerts.length]);
      current++;
      
      // Auto-hide after 8s
      setTimeout(() => setActiveAlert(null), 8000);
    }, 20000); // New alert every 20s

    return () => clearInterval(interval);
  }, []);

  const fetchRealData = async () => {
    try {
      const start = Date.now();
      const { data: companies } = await supabase.from('companies').select('id, plan');
      const latency = Date.now() - start;
      
      setDbHealth(prev => ({
        ...prev,
        load: Math.min(latency / 10, 80), // Simulate load based on latency
        status: latency < 300 ? 'Healthy' : 'High Latency'
      }));

      const mrr = (companies || []).reduce((acc, c) => acc + (c.plan === 'OURO' ? 997 : c.plan === 'PRATA' ? 497 : 197), 0);
      setMetrics(prev => ({ ...prev, mrr }));
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
              <div style={styles.infoBadge}>
                 <Calendar size={14} />
                 <span>Abr 12 — Abr 19</span>
                 <ChevronRight size={14} opacity={0.5} />
              </div>
              <div style={styles.infoBadge}>
                 <Clock size={14} />
                 <span>24h</span>
                 <ChevronRight size={14} opacity={0.5} />
              </div>
              <button style={styles.weeklyBtn} onClick={() => navigate('/master/destinos')}>
                 Weekly <ArrowUpRight size={14} />
              </button>
           </div>
        </div>
      </header>

      <div style={styles.mainGrid}>
        {/* COLUMN 1: RESULT CARDS */}
        <div style={styles.col1}>
           {/* MRR CARD (PRIMARY BLUE) */}
           <div style={{...styles.metricCard, cursor: 'pointer'}} onClick={() => navigate('/master/destinos')}>
              <div style={styles.cardHeader}>
                 <div style={styles.dotLabel}><div style={{...styles.dot, background: '#6366F1'}} /> MRR Performance</div>
                 <MoreHorizontal size={16} color="#64748b" />
              </div>
              <div style={styles.cardMain}>
                 <h3 style={styles.cardValue}>{metrics.mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                 <div style={{...styles.growthTag, color: '#6366F1', background: 'rgba(99, 102, 241, 0.1)'}}>
                    <TrendingUp size={12} /> {metrics.mrrGrowth}%
                 </div>
              </div>
              <p style={styles.cardDesc}>MONTHLY RECURRING REVENUE</p>
              <div style={styles.cardFooter}>
                 <div style={styles.miniStat}>
                    <span style={styles.msValue}>{metrics.burned}</span>
                    <span style={styles.msLabel}>LEADS HOJE</span>
                 </div>
                 <div style={styles.miniStat}>
                    <span style={styles.msValue}>{metrics.activeWorkouts}</span>
                    <span style={styles.msLabel}>VENDAS (3d)</span>
                 </div>
                 <div style={{...styles.growthTiny, background: '#6366F1', color: '#fff'}}>+ {metrics.burnedGrowth}%</div>
              </div>
           </div>

           {/* INTELLIGENT CARD: SWAPS BASED ON RESULTS */}
           {dashboardMode === 'PERFORMANCE' ? (
              <div style={{...styles.promoCard, background: '#6366F1'}} className="animate-fade-in">
                 <div style={styles.promoContent}>
                    <h4 style={{...styles.promoTitle, color: '#fff'}}>Global Performance</h4>
                    <p style={{...styles.promoDesc, color: 'rgba(255,255,255,0.8)'}}>Resultados acima da média. O sistema está em modo de expansão.</p>
                    <div style={styles.promoActions}>
                       <button style={{...styles.promoBtn, background: '#fff', color: '#6366F1'}}>Ver Relatórios ⚡</button>
                    </div>
                 </div>
                 <div style={styles.promoVisual}>
                    <TrendingUp size={80} color="rgba(255,255,255,0.1)" />
                 </div>
              </div>
           ) : (
              <div style={{...styles.promoCard, background: '#0f172a'}} className="animate-fade-in">
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
           <div style={styles.trackerCard}>
              <div style={styles.trackerHeader}>
                 <div style={styles.dotLabel}><div style={{...styles.dot, background: '#6366F1'}} /> System Analytics</div>
                 <div style={styles.trackerControls}>
                    <X size={14} />
                    <div style={styles.zoomControls}>
                       <button style={styles.zoomBtn}>-</button>
                       <button style={styles.zoomBtn}>+</button>
                    </div>
                 </div>
              </div>
              <div style={styles.trackerSummary}>
                 <div style={styles.trackerStat}>
                    <span style={styles.tLabel}>Média de Resposta</span>
                    <h3 style={styles.tValue}>09.45 <small>ms</small></h3>
                    <div style={{...styles.tBadge, background: '#6366F1', color: '#fff'}}>⚡ 30min</div>
                 </div>
                 <div style={styles.trackerStat}>
                    <span style={styles.tLabel}>Health Score</span>
                    <h3 style={styles.tValue}>98.57%</h3>
                    <div style={{...styles.tBadgeGreen, color: '#10b981'}}>✨ 0.7%</div>
                 </div>
              </div>
              <div style={styles.trackerChart}>
                 <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={trackerData}>
                       <Tooltip cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                       <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={18}>
                          {trackerData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index % 3 === 0 ? '#6366F1' : '#f1f5f9'} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
              <div style={styles.trackerTabs}>
                 {['DB Logs', 'API Health', 'Latency', 'Insights', 'AI Agent'].map(t => (
                    <button key={t} style={{...styles.tTab, ...(t === 'DB Logs' ? {...styles.tTabActive, background: '#6366F1', borderColor: '#6366F1', color: '#fff'} : {})}}>{t}</button>
                 ))}
              </div>
           </div>

           {/* DB HEALTH CARD (DARK THEME) */}
           <div style={{...styles.dbCard, background: '#0f172a', border: 'none'}}>
              <div style={styles.dbInfo}>
                 <div style={{...styles.dbStatusChip, background: 'rgba(99, 102, 241, 0.2)', color: '#6366F1'}}>✨ 12% Load</div>
                 <div style={styles.dbVisual}>
                    <Database size={40} color="#6366F1" />
                    <div style={{...styles.dbLoader, borderTopColor: '#6366F1'}} />
                 </div>
                 <div style={styles.dbLabels}>
                    <h3 style={{color: '#fff'}}>Postgres Cluster</h3>
                    <p style={{color: '#94a3b8'}}>Status: {dbHealth.status}</p>
                 </div>
              </div>
              <div style={styles.dbChart}>
                 <ResponsiveContainer width="100%" height={80}>
                    <AreaChart data={trackerData}>
                       <Area type="monotone" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                 </ResponsiveContainer>
                 <div style={styles.chartDays}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} style={{color: '#94a3b8'}}>{d}</span>)}
                 </div>
              </div>
           </div>
        </div>

        {/* COLUMN 3: PROGRESS & WORKOUT (PRIMARY BLUE) */}
        <div style={styles.col3}>
           <div style={styles.progressCard}>
              <div style={styles.cardHeader}>
                 <div style={styles.dotLabel}><div style={{...styles.dot, background: '#6366F1'}} /> Master Progress</div>
                 <MoreHorizontal size={16} />
              </div>
              <div style={styles.progressVisual}>
                 <div style={styles.avatarGrid}>
                    {['A', 'B', 'C'].map(v => <div key={v} style={{...styles.miniAvatar, color: '#6366F1', background: 'rgba(99, 102, 241, 0.1)'}}>M</div>)}
                 </div>
                 <div style={styles.progressText}>
                    <h4>Total Control</h4>
                    <span>139 <small>Operações</small></span>
                 </div>
              </div>
              <div style={styles.checkboxList}>
                 <div style={styles.checkItem}>
                    <div style={styles.checkSquare} />
                    <span>Audit Finance</span>
                    <span style={styles.checkVal}>7/12</span>
                 </div>
                 <div style={{...styles.checkItem, ...styles.checkActive, borderColor: '#6366F1'}}>
                    <div style={{...styles.checkSquare, background: '#6366F1', borderColor: '#6366F1'}}><X size={10} color="#fff" /></div>
                    <span>Global Security</span>
                    <span style={styles.checkVal}>ACTIVE</span>
                 </div>
                 <div style={styles.checkItem}>
                    <div style={styles.checkSquare} />
                    <span>Cross-Sync</span>
                    <span style={styles.checkVal}>AUTO</span>
                 </div>
              </div>
           </div>

           <div style={styles.workoutCard}>
              <div style={styles.cardHeader}>
                 <div style={styles.dotLabel}><div style={{...styles.dot, background: '#6366F1'}} /> Ops Activity</div>
              </div>
              <div style={styles.opsMain}>
                 <div style={{...styles.opsIcon, background: '#6366F1', color: '#fff'}}><Smartphone size={24} /></div>
                 <div style={styles.opsInfo}>
                    <span style={styles.opsLabel}>System Engine</span>
                    <h3 style={styles.opsValue}>139 <small>ms/avg</small></h3>
                 </div>
              </div>
              <div style={styles.opsGrid}>
                 <div style={styles.opsBox}>
                    <span style={styles.boxLabel}>Memory</span>
                    <span style={{...styles.boxValue, color: '#6366F1'}}>97.5%</span>
                 </div>
                 <div style={styles.opsBox}>
                    <span style={styles.boxLabel}>CPU</span>
                    <span style={styles.boxValue}>89 <small>ms</small></span>
                 </div>
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
           <button style={styles.alertAction}>Abrir ⚡</button>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, any> = {
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
  cardValue: { fontSize: '26px', fontWeight: '600', color: 'var(--text-title)', margin: 0, letterSpacing: '-0.8px' },
  growthTag: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0' },
  cardDesc: { fontSize: '10px', color: 'var(--text-subtitle)', fontWeight: '700', letterSpacing: '1px', margin: '0 0 16px 0', textTransform: 'uppercase' },
  cardFooter: { display: 'flex', gap: '24px', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '20px' },
  miniStat: { display: 'flex', flexDirection: 'column' },
  msValue: { fontSize: '16px', fontWeight: '600', color: 'var(--text-title)', letterSpacing: '-0.2px' },
  msLabel: { fontSize: '9px', color: '#94a3b8', fontWeight: '500' },
  growthTiny: { fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '8px', marginLeft: 'auto' },

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
  }
};

export default IntelligentDashboard;
