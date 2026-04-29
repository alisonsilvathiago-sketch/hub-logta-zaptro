import React, { useState, useEffect } from 'react';
import { 
  Fuel, Search, MapPin, RefreshCw, Box, Brain, TrendingUp, Zap, 
  ArrowLeft, Droplets, Info, ShieldCheck, List, Layout, Share2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/lib/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const AnalyticalFuelDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [fuelPrices, setFuelPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');
  const [lastSync, setLastSync] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('fuel_prices').select('*, fuel_history(*)');
      if (data) setFuelPrices(data);
      setLastSync(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    document.title = "Central de Inteligência de Combustível | LOGTA";
  }, []);

  const roiData = [
    { name: 'Jan', value: 45000 },
    { name: 'Fev', value: 52000 },
    { name: 'Mar', value: 48000 },
    { name: 'Abr', value: 61000 },
  ];

  const fuelStats = [
    { label: 'Média Nacional', value: 'R$ 5,89', trend: '+1.2%', icon: <TrendingUp size={20} /> },
    { label: 'Economia Sugerida', value: 'R$ 12k/mês', trend: 'IA ATIVA', icon: <Brain size={20} /> },
    { label: 'Postos Monitorados', value: '14.200', trend: 'ANP SYNC', icon: <ShieldCheck size={20} /> },
    { label: 'Preço Alvo', value: 'R$ 5,45', trend: 'OTIMIZADO', icon: <Zap size={20} /> },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => window.history.back()}>
            <ArrowLeft size={18} />
          </button>
          <div style={styles.logoBox}>
            <Fuel size={24} color="#6366F1" />
            <div>
              <h1 style={styles.title}>Central de Inteligência</h1>
              <p style={styles.subtitle}>Monitoramento Nacional de Combustíveis em Tempo Real</p>
            </div>
          </div>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.syncBtn} onClick={fetchData}>
             <RefreshCw size={18} className={loading ? 'spin' : ''} />
             <span>Sincronizar ANP</span>
          </button>
          <button style={styles.publicBtn} onClick={() => window.open('/combustivel', '_blank')}>
            <Share2 size={18} />
            <span>Ver Bomba Pública</span>
          </button>
        </div>
      </header>

      <main style={styles.content}>
        <div style={{ ...styles.card, marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['Gasolina', 'Etanol', 'Diesel', 'GNV'].map(f => (
              <button key={f} style={styles.mainFuelBtn}>{f.toUpperCase()}</button>
            ))}
          </div>
          <div style={{ ...styles.searchBox, width: '400px' }}>
            <MapPin size={18} color="#6366F1" />
            <input 
              type="text" 
              placeholder="Vincular sua cidade ou estado para filtrar preços..." 
              style={styles.searchInput}
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </div>
        </div>
        <div style={styles.statsGrid}>
          {fuelStats.map((stat, i) => (
            <div key={i} style={styles.statCard}>
              <div style={{ ...styles.iconBox, backgroundColor: i % 2 === 0 ? '#F5F3FF' : '#6366F1', color: i % 2 === 0 ? '#6366F1' : '#FFF' }}>
                {stat.icon}
              </div>
              <div>
                <p style={styles.statLabel}>{stat.label}</p>
                <h3 style={styles.statValue}>{stat.value}</h3>
                <span style={styles.statTrend}>{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.mainGrid}>
          <div style={styles.chartCol}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Evolução dos Custos (R$/L)</h3>
                <div style={styles.tag}>IA PREDICTIVE</div>
              </div>
              <div style={{ height: '300px', marginTop: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={roiData}>
                    <defs>
                      <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} />
                    <YAxis hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} fill="url(#colorFuel)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.fuelShowcase}>
              {['Gasolina', 'Etanol', 'Diesel'].map((type, i) => (
                <div key={type} style={styles.fuelCard}>
                  <div style={{ ...styles.fuelIcon, backgroundColor: i === 0 ? '#F5F3FF' : (i === 1 ? '#F0FDF4' : '#FEF2F2'), color: i === 0 ? '#6366F1' : (i === 1 ? '#22C55E' : '#EF4444') }}>
                    <Droplets size={24} />
                  </div>
                  <div>
                    <h4 style={styles.fuelName}>{type} Comum</h4>
                    <div style={styles.fuelPrice}>R$ {i === 0 ? '5,89' : (i === 1 ? '3,84' : '6,12')}</div>
                    <div style={styles.fuelUpdate}>Atualizado há 12min</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.sidebar}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Radar de Preços Brasil</h3>
              <p style={styles.cardSub}>Variação regional baseada em sua localização.</p>
              
              <div style={styles.regionList}>
                {[
                  { name: cityFilter || 'São Paulo, SP', price: 'R$ 5,65', impact: 'BAIXO' },
                  { name: 'Rio de Janeiro, RJ', price: 'R$ 6,12', impact: 'ALTO' },
                  { name: 'Curitiba, PR', price: 'R$ 5,78', impact: 'MÉDIO' },
                  { name: 'Cuiabá, MT', price: 'R$ 5,99', impact: 'MÉDIO' },
                ].map((reg, i) => (
                  <div key={i} style={styles.regionItem}>
                    <div style={styles.regionInfo}>
                      <div style={styles.regionName}>{reg.name}</div>
                      <div style={styles.regionPrice}>{reg.price}</div>
                    </div>
                    <div style={{ ...styles.impactTag, backgroundColor: reg.impact === 'BAIXO' ? '#DCFCE7' : (reg.impact === 'ALTO' ? '#FEE2E2' : '#FEF3C7'), color: reg.impact === 'BAIXO' ? '#166534' : (reg.impact === 'ALTO' ? '#991B1B' : '#92400E') }}>
                      {reg.impact}
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.aiInsight}>
                <Brain size={20} color="#6366F1" />
                <p style={styles.aiText}>
                  Detectamos uma tendência de queda de 2% no diesel para a próxima semana. Recomendamos aguardar 48h para grandes abastecimentos.
                </p>
              </div>
            </div>

            <div style={styles.costCalculator}>
               <h3 style={styles.cardTitle}>Simulador de Malha</h3>
               <div style={styles.inputGroup}>
                 <label style={styles.label}>Km Mensal da Frota</label>
                 <input type="text" style={styles.input} defaultValue="120.000" />
               </div>
               <div style={styles.inputGroup}>
                 <label style={styles.label}>Consumo Médio (Km/L)</label>
                 <input type="text" style={styles.input} defaultValue="3.8" />
               </div>
               <div style={styles.calcFooter}>
                 <div style={styles.calcLabel}>Gasto Mensal Estimado</div>
                 <div style={styles.calcValue}>R$ 185.940,00</div>
               </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const styles = {
  page: { backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: '"Inter", sans-serif' },
  header: { 
    backgroundColor: '#FFF', 
    padding: '20px 40px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottom: '1px solid #E2E8F0',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '24px' },
  backBtn: { border: '1px solid #E2E8F0', background: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: '#64748B' },
  logoBox: { display: 'flex', alignItems: 'center', gap: '16px' },
  title: { fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: 0, letterSpacing: '-0.5px' },
  subtitle: { fontSize: '12px', color: '#64748B', margin: 0, fontWeight: '500' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '16px' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F1F5F9', padding: '10px 16px', borderRadius: '12px', width: '320px' },
  searchInput: { border: 'none', background: 'none', fontSize: '13px', color: '#1E293B', width: '100%', fontWeight: '600', outline: 'none' },
  syncBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', color: '#1E293B' },
  publicBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#6366F1', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', color: '#FFF' },
  content: { padding: '40px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' },
  statCard: { backgroundColor: '#FFF', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px' },
  iconBox: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '4px' },
  statValue: { fontSize: '22px', fontWeight: '900', color: '#0F172A', margin: 0 },
  statTrend: { fontSize: '11px', fontWeight: '800', color: '#10B981', display: 'block', marginTop: '4px' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' },
  chartCol: { display: 'flex', flexDirection: 'column' as const, gap: '24px' },
  card: { backgroundColor: '#FFF', padding: '32px', borderRadius: '28px', border: '1px solid #E2E8F0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: '16px', fontWeight: '900', color: '#0F172A', margin: 0 },
  cardSub: { fontSize: '13px', color: '#64748B', marginTop: '4px' },
  tag: { fontSize: '10px', fontWeight: '800', color: '#6366F1', backgroundColor: '#F5F3FF', padding: '4px 10px', borderRadius: '20px' },
  fuelShowcase: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  fuelCard: { backgroundColor: '#FFF', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px' },
  fuelIcon: { width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fuelName: { fontSize: '14px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' },
  fuelPrice: { fontSize: '24px', fontWeight: '900', color: '#0F172A' },
  fuelUpdate: { fontSize: '11px', color: '#94A3B8', marginTop: '4px' },
  sidebar: { display: 'flex', flexDirection: 'column' as const, gap: '24px' },
  regionList: { marginTop: '24px', display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  regionItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F1F5F9' },
  regionInfo: { display: 'flex', flexDirection: 'column' as const },
  regionName: { fontSize: '14px', fontWeight: '700', color: '#1E293B' },
  regionPrice: { fontSize: '12px', fontWeight: '500', color: '#64748B' },
  impactTag: { fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px' },
  aiInsight: { marginTop: '24px', backgroundColor: '#F5F3FF', padding: '20px', borderRadius: '16px', display: 'flex', gap: '12px' },
  aiText: { fontSize: '12px', color: '#4338CA', margin: 0, lineHeight: '1.5', fontWeight: '500' },
  costCalculator: { backgroundColor: '#0F172A', padding: '32px', borderRadius: '28px', color: '#FFF' },
  inputGroup: { marginBottom: '20px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#94A3B8', display: 'block', marginBottom: '8px' },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', padding: '12px', borderRadius: '12px', color: '#FFF', fontSize: '14px', fontWeight: '700', outline: 'none' },
  calcFooter: { marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  calcLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' as const, marginBottom: '8px' },
  calcValue: { fontSize: '28px', fontWeight: '900', color: '#FFF' }
};

export default AnalyticalFuelDashboard;
