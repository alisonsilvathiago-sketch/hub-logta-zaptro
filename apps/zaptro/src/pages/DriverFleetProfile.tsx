import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Truck, Calendar, Clock, Fuel, Wrench, 
  ArrowLeft, Download, Filter, MapPin, Activity,
  ChevronRight, AlertCircle, TrendingUp, History,
  Navigation, Info, DollarSign, Search, CheckCircle2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ExportButton from '../components/ExportButton';

const DriverFleetProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'veiculos' | 'rotas' | 'combustivel' | 'oficina'>('veiculos');
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<any>(null);

  useEffect(() => {
    const fetchDriver = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('motoristas')
          .select('*, perfis(*)')
          .eq('id', id)
          .single();
        
        if (data) {
          setDriver({
            id: data.id,
            name: data.perfis?.nome_completo || 'Motorista',
            status: data.status?.toUpperCase() || 'ATIVO',
            vehicle: 'Carregando...',
            photo: data.perfis?.avatar_url
          });

          // Fetch current vehicle
          const { data: v } = await supabase.from('veiculos').select('placa, modelo').eq('id', data.veiculo_id).single();
          if (v) {
            setDriver((prev: any) => ({ ...prev, vehicle: `${v.modelo} (${v.placa})` }));
          } else {
            setDriver((prev: any) => ({ ...prev, vehicle: 'Sem veículo vinculado' }));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDriver();
  }, [id]);

  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('fretes')
        .select('*')
        .eq('motorista_id', id)
        .order('created_at', { ascending: false });
      if (data) setHistory(data);
    };
    fetchHistory();
  }, [id]);

  const styles = {
    container: { padding: '32px', backgroundColor: '#f4f4f4', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', cursor: 'pointer', color: '#949494', fontWeight: '700' },
    profileSection: { backgroundColor: 'white', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', marginBottom: '32px', display: 'flex', gap: '40px', alignItems: 'center' },
    avatar: { width: '120px', height: '120px', borderRadius: '32px', backgroundColor: '#ebebeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' },
    name: { fontSize: '28px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' },
    badge: { padding: '4px 12px', borderRadius: '30px', fontSize: '11px', fontWeight: '600', backgroundColor: 'var(--success-light)', color: 'var(--success)', width: 'fit-content' },
    infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', flex: 1 },
    infoItem: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
    label: { fontSize: '12px', color: '#949494', fontWeight: '700', textTransform: 'uppercase' as const },
    value: { fontSize: '16px', color: '#1E293B', fontWeight: '700' },
    
    tabNav: { display: 'flex', gap: '12px', marginBottom: '32px', borderBottom: '1px solid #E2E8F0', paddingBottom: '0' },
    tab: { padding: '16px 24px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#949494', position: 'relative' as const },
    activeTab: { color: 'var(--primary)' },
    tabIndicator: { position: 'absolute' as const, bottom: '-1px', left: 0, right: 0, height: '3px', backgroundColor: 'var(--primary)', borderRadius: '3px' },
    
    actionRow: { height: '52px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' },
    searchBox: { flex: 1, height: '100%', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px' },
    searchInput: { border: 'none', background: 'none', outline: 'none', width: '100%', fontWeight: '600' },
    dateFilter: { height: '100%', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px' },
    
    grid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' },
    card: { backgroundColor: 'white', borderRadius: '32px', padding: '24px', border: '1px solid #E2E8F0' },
    cardTitle: { fontSize: '18px', fontWeight: '600', color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
    historyItem: { display: 'flex', gap: '16px', padding: '20px', borderRadius: '20px', backgroundColor: '#f4f4f4', border: '1px solid transparent', marginBottom: '12px', position: 'relative' as const },
    timeline: { flexShrink: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' },
    line: { width: '2px', flex: 1, backgroundColor: '#E2E8F0' },
    dot: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--primary)', border: '3px solid white', boxShadow: '0 0 0 1px #E2E8F0' },
    
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
    miniCard: { padding: '20px', borderRadius: '24px', backgroundColor: '#f4f4f4', border: '1px solid #E2E8F0' },
    miniLabel: { fontSize: '11px', color: '#949494', fontWeight: '600', textTransform: 'uppercase' as const, marginBottom: '4px' },
    miniValue: { fontSize: '20px', fontWeight: '700', color: '#0F172A' }
  };

  const renderVehicles = () => (
    <div style={styles.grid}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}><History size={20} color="var(--primary)" /> Histórico de Rotas & Veículos 360°</h3>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {history.length > 0 ? history.map((item, i) => (
            <div key={i} style={styles.historyItem}>
               <div style={styles.timeline}>
                  <div style={{...styles.dot, backgroundColor: item.status === 'em_transito' ? '#10b981' : 'var(--primary)'}} />
                  <div style={styles.line} />
               </div>
               <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>Frete #{item.id.slice(0,6)} • {item.origem} {'->'} {item.destino}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#949494' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#949494' }}>
                    <span><Clock size={12} /> Status: {item.status?.toUpperCase()}</span>
                    <span><Truck size={12} /> {item.carga_tipo}</span>
                  </div>
               </div>
            </div>
          )) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#949494', fontSize: '13px' }}>Nenhum frete registrado no histórico.</div>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={styles.card}>
           <h3 style={styles.cardTitle}><Activity size={20} color="#ef4444" /> Inteligência Comportamental (Ocorrências)</h3>
           <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <div style={{padding: '40px', textAlign: 'center', color: '#949494', fontSize: '12px', border: '1px dashed #e2e8f0', borderRadius: '16px'}}>
                 <Info size={24} style={{opacity: 0.3, marginBottom: '8px'}} />
                 <p>Nenhuma ocorrência comportamental registrada para este motorista.</p>
              </div>
           </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}><TrendingUp size={20} color="var(--primary)" /> Performance Fleet 3.0</h3>
          <div style={styles.statsGrid}>
             <div style={styles.miniCard}>
                <p style={styles.miniLabel}>Eficiência Média</p>
                <h4 style={styles.miniValue}>94%</h4>
             </div>
             <div style={styles.miniCard}>
                <p style={styles.miniLabel}>Sinistros / Multas</p>
                <h4 style={{...styles.miniValue, color: 'var(--success)'}}>0</h4>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}><ArrowLeft size={18} /> Voltar para Frota</button>
        <ExportButton />
      </div>

      <div style={styles.profileSection}>
        <div style={styles.avatar}><User size={48} /></div>
        <div style={{ flex: 1 }}>
           <h1 style={styles.name}>{driver?.name}</h1>
           <div style={styles.badge}>{driver?.status}</div>
        </div>
        <div style={styles.infoGrid}>
           <div style={styles.infoItem}><span style={styles.label}>Veículo Atual</span><span style={styles.value}>{driver?.vehicle}</span></div>
           <div style={styles.infoItem}><span style={styles.label}>Última Rota</span><span style={styles.value}>11/04 - 08:30</span></div>
           <div style={styles.infoItem}><span style={styles.label}>Localização</span><span style={styles.value}>Em Rota</span></div>
        </div>
      </div>

      <div style={styles.tabNav}>
        {[
          { id: 'veiculos', label: 'Veículos & Uso' },
          { id: 'rotas', label: 'Histórico de Rotas' },
          { id: 'combustivel', label: 'Abastecimento' },
          { id: 'oficina', label: 'Manutenção Link' }
        ].map(tab => (
          <button 
            key={tab.id} 
            style={{...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {})}} 
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
            {activeTab === tab.id && <div style={styles.tabIndicator} />}
          </button>
        ))}
      </div>

      <div style={styles.actionRow}>
         <div style={styles.searchBox}>
            <Search size={18} color="#949494" />
            <input placeholder="Buscar no histórico..." style={styles.searchInput} />
         </div>
         <div style={styles.dateFilter}>
            <Calendar size={18} color="#949494" />
            <input type="date" style={{ border: 'none', outline: 'none', fontWeight: '700' }} />
            <span style={{ color: '#949494' }}>até</span>
            <input type="date" style={{ border: 'none', outline: 'none', fontWeight: '700' }} />
         </div>
         <button style={{ height: '100%', padding: '0 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '600', cursor: 'pointer' }}>
            Filtrar Dashboard
         </button>
      </div>

      {activeTab === 'veiculos' && renderVehicles()}
      {activeTab !== 'veiculos' && (
        <div style={styles.card}>
           <div style={{ padding: '80px', textAlign: 'center' }}>
              <Activity size={48} color="#E2E8F0" style={{ marginBottom: '16px' }} />
              <p style={{ color: '#949494', fontWeight: '600' }}>Dados de {activeTab} sendo sincronizados com o banco de dados...</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default DriverFleetProfile;
