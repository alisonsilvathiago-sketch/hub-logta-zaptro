import React, { useState, useEffect } from 'react';
import { 
  Truck, Car, Users, AlertTriangle, 
  Map as MapIcon, List, Search, 
  ChevronRight, Filter, MoreHorizontal,
  Clock, Package, MapPin, TrendingUp,
  Activity, Info, ArrowUpRight, ArrowDownRight,
  RefreshCw, Layers, Bell, Maximize2, Zap
} from 'lucide-react';
import { 
  MapContainer, TileLayer, Marker, 
  Popup, Polyline, ZoomControl
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@core/lib/supabase';
import { useAuth } from '@core/context/AuthContext';
import { useToast } from '@core/context/ToastContext';

// --- STYLES & HELPERS ---
const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'finalizada': return { backgroundColor: '#D1FAE5', color: '#065F46' };
    case 'problema': return { backgroundColor: '#FEE2E2', color: '#991B1B' };
    case 'atraso': return { backgroundColor: '#FEF3C7', color: '#92400E' };
    default: return { backgroundColor: '#E0E7FF', color: '#3730A3' };
  }
};

const styles: Record<string, any> = {
  container: { padding: '40px', backgroundColor: '#F6F7F8', minHeight: '100vh', fontFamily: "'Outfit', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  titleWrapper: { display: 'flex', alignItems: 'center', gap: '16px' },
  iconBox: { width: '48px', height: '48px', backgroundColor: '#6366F1', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)' },
  pageTitle: { fontSize: '28px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-1px' },
  pageSub: { fontSize: '13px', color: '#64748B', fontWeight: '500', margin: 0 },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  searchWrapper: { position: 'relative', width: '320px' },
  searchIcon: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' },
  searchInput: { width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#FFF', fontSize: '14px', fontWeight: '500', outline: 'none', transition: 'all 0.2s' },
  refreshBtn: { width: '42px', height: '42px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#FFF', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  alertBtn: { position: 'relative', width: '42px', height: '42px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#FFF', color: '#F43F5E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  alertBadge: { position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#F43F5E', color: '#FFF', fontSize: '10px', fontWeight: '800', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #F6F7F8' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' },
  kpiCard: { backgroundColor: '#FFF', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  kpiHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  kpiLabel: { fontSize: '13px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  kpiIcon: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  kpiMain: { display: 'flex', alignItems: 'baseline', gap: '12px' },
  kpiValue: { fontSize: '32px', fontWeight: '800', color: '#0F172A', margin: 0 },
  trendBadge: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' },
  mainLayout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' },
  contentCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  controlBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tabs: { display: 'flex', gap: '8px', backgroundColor: '#E2E8F0', padding: '4px', borderRadius: '12px' },
  tabBtn: { padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#64748B', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
  activeTab: { backgroundColor: '#FFF', color: '#0F172A', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  activeToggle: { padding: '10px 16px', border: 'none', backgroundColor: '#0F172A', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSiz: '13px', fontWeight: '700' },
  viewContainer: { height: '600px', backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
  mapWrapper: { height: '100%', width: '100%', position: 'relative' },
  mapLegend: { position: 'absolute', top: '20px', left: '20px', zIndex: 1000, backgroundColor: 'rgba(255,255,255,0.9)', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backdropFilter: 'blur(4px)' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' },
  legendDot: { width: '8px', height: '8px', borderRadius: '50%' },
  popupContainer: { padding: '8px', minWidth: '160px' },
  popupTitle: { margin: '0 0 4px', fontSize: '14px', fontWeight: '800' },
  popupSub: { margin: '0 0 12px', fontSize: '12px', color: '#64748B' },
  statusTag: { padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', display: 'inline-block', marginBottom: '12px' },
  popupAction: { width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #6366F1', backgroundColor: '#FFF', color: '#6366F1', fontWeight: '700', cursor: 'pointer' },
  listWrapper: { height: '100%', overflowY: 'auto', padding: '24px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', borderBottom: '2px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' },
  td: { padding: '16px 12px', fontSize: '14px' },
  companyCell: { display: 'flex', flexDirection: 'column', gap: '4px' },
  sourceTag: { alignSelf: 'flex-start', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#64748B', textTransform: 'uppercase' },
  companyName: { fontWeight: '700', color: '#0F172A' },
  driverInfo: { display: 'flex', flexDirection: 'column' },
  vehiclePlate: { fontSize: '12px', color: '#94A3B8' },
  routePath: { display: 'flex', alignItems: 'center', gap: '8px' },
  pathPoint: { fontWeight: '600', color: '#475569' },
  statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', display: 'inline-block' },
  timeInfo: { display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontWeight: '600' },
  actionBtn: { width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#94A3B8' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '24px' },
  sidebarSection: { backgroundColor: '#FFF', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' },
  sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sidebarTitle: { fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 },
  viewAllBtn: { fontSize: '12px', fontWeight: '700', color: '#6366F1', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' },
  alertList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  alertItem: { padding: '12px', borderLeft: '4px solid #E2E8F0', backgroundColor: '#F9FAFB', borderRadius: '0 12px 12px 0' },
  alertHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  alertTime: { fontSize: '10px', color: '#94A3B8', fontWeight: '600' },
  alertType: { fontSize: '10px', fontWeight: '800', color: '#6366F1', textTransform: 'uppercase' },
  alertTitle: { fontSize: '13px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' },
  alertMsg: { fontSize: '12px', color: '#64748B', margin: 0, lineHeight: '1.4' },
  aiCard: { display: 'flex', gap: '12px', padding: '16px', borderRadius: '16px', backgroundColor: '#F5F3FF', marginBottom: '12px' },
  aiIcon: { flexShrink: 0 },
  aiText: { fontSize: '12px', color: '#4338CA', margin: 0, lineHeight: '1.5' },
  emptyState: { textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '12px' },
  
  // NEW SEARCH DROPDOWN STYLES
  resultsDropdown: { position: 'absolute', top: '100%', left: 0, width: '450px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', marginTop: '12px', zIndex: 2000, border: '1px solid #E2E8F0', overflow: 'hidden' },
  resultsHeader: { padding: '16px 20px', backgroundColor: '#F8FAF9', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  resultsList: { maxHeight: '400px', overflowY: 'auto' },
  resultItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s', borderBottom: '1px solid #F1F5F9', '&:hover': { backgroundColor: '#F8FAF9' } },
  resIcon: { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  resInfo: { flex: 1 },
  resName: { fontSize: '14px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' },
  resPlate: { fontSize: '10px', backgroundColor: '#0F172A', color: 'white', padding: '2px 6px', borderRadius: '4px' },
  resMeta: { fontSize: '11px', color: '#64748B', marginTop: '2px' },
  noResults: { padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: '600' }
};

// --- HELPER COMPONENTS ---
const KPIItem = ({ label, value, trend, trendUp, icon, color }: any) => (
  <div style={styles.kpiCard}>
    <div style={styles.kpiHeader}>
      <span style={styles.kpiLabel}>{label}</span>
      <div style={{...styles.kpiIcon, backgroundColor: `${color}15`, color: color}}>{icon}</div>
    </div>
    <div style={styles.kpiMain}>
      <h2 style={styles.kpiValue}>{value}</h2>
      <div style={{...styles.trendBadge, color: trendUp ? '#10B981' : '#F43F5E'}}>
        {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trend}
      </div>
    </div>
  </div>
);

// Fix Leaflet Default Icon issue with Vite
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2554/2554978.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const problemIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// --- MAIN COMPONENT ---
const LogisticaHub: React.FC = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const [stats, setStats] = useState({
    total_routes: 124,
    active_vehicles: 86,
    drivers_online: 72,
    alerts_critical: 12,
    delivered_today: 450,
    estimated_cost: 15400
  });

  const [trackingData, setTrackingData] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  // Mock global data for the "Google-like" search
  const [allEntities, setAllEntities] = useState<any[]>([
    { id: 'v1', type: 'vehicle', name: 'Volvo FH 540', plate: 'ABC1234', color: 'Prata', owner: 'Transportes Silva', ownerId: '1', lat: -23.55, lng: -46.63, status: 'em_rota', cnpj: '12.345.678/0001-99', email: 'contato@silva.com.br' },
    { id: 'v2', type: 'vehicle', name: 'Scania R450', plate: 'XYZ9876', color: 'Vermelho', owner: 'Logística Norte', ownerId: '2', lat: -23.56, lng: -46.65, status: 'atraso', cnpj: '98.765.432/0001-11', email: 'op@nortelog.com' },
    { id: 'c1', type: 'client', name: 'João Ricardo Pereira', document: '123.456.789-00', email: 'joao.pereira@gmail.com', phone: '(11) 99999-8888', city: 'São Paulo, SP', company: 'Logta Transportes' },
    { id: 'c2', type: 'company', name: 'Zaptro Ecosystem', document: '22.333.444/0001-55', email: 'diretoria@zaptro.com', type: 'Premium', status: 'ativo' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rRes, aRes, tRes] = await Promise.all([
          supabase.from('routes').select(`
            *,
            company:companies(name, origin),
            vehicle:vehicles(plate, model, lat, lng, status),
            driver:motoristas(nome)
          `).order('created_at', { ascending: false }),
          supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(10),
          supabase.from('global_tracking').select('*, company:companies(name)')
        ]);

        if (rRes.data) setRoutes(rRes.data);
        if (aRes.data) setAlerts(aRes.data);
        if (tRes.data) setTrackingData(tRes.data);

        if (rRes.data) {
          setStats(prev => ({
            ...prev,
            total_routes: rRes.data.length || 0,
            active_vehicles: new Set(rRes.data.map(r => r.vehicle_id)).size || 0,
            alerts_critical: aRes.data?.filter((a: any) => a.type === 'critical').length || 0
          }));
        }
      } catch (err) {
        console.error('Error fetching logistics data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // REAL-TIME SUBSCRIPTION FOR MASTER HUB
    const channel = supabase
      .channel('master_logistics_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_tracking' }, payload => {
        setTrackingData(prev => {
          const index = prev.findIndex(item => item.id === (payload.new as any).id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...(payload.new as any) };
            return updated;
          }
          return [payload.new as any, ...prev];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (searchTerm.length > 1) {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = allEntities.filter(e => 
        e.name?.toLowerCase().includes(lowerSearch) ||
        e.plate?.toLowerCase().includes(lowerSearch) ||
        e.document?.toLowerCase().includes(lowerSearch) ||
        e.cnpj?.toLowerCase().includes(lowerSearch) ||
        e.email?.toLowerCase().includes(lowerSearch) ||
        e.color?.toLowerCase().includes(lowerSearch) ||
        e.owner?.toLowerCase().includes(lowerSearch)
      );
      setSearchResults(filtered);
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  }, [searchTerm, allEntities]);

  const mapCenter: [number, number] = [-23.5505, -46.6333];

  const filteredRoutes = routes.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      r.driver?.nome?.toLowerCase().includes(searchLower) ||
      r.vehicle?.plate?.toLowerCase().includes(searchLower) ||
      r.company?.name?.toLowerCase().includes(searchLower);
    
    if (activeTab === 'tudo' || activeTab === 'all') return matchesSearch;
    if (activeTab === 'problemas') return matchesSearch && (r.status === 'problema' || r.status === 'atraso');
    return matchesSearch && r.company?.origin?.toLowerCase() === activeTab;
  });

  const handleEntitySelect = (entity: any) => {
    setSelectedEntity(entity);
    setIsSearchOpen(false);
    if (entity.type === 'vehicle' || entity.type === 'client') {
      setViewMode('map');
      showToast(`Localizando ${entity.name}...`, 'info');
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* HEADER SECTION */}
      <header style={styles.header}>
        <div style={styles.headerInfo}>
          <div style={styles.titleWrapper}>
            <div style={styles.iconBox}><Truck size={24} color="#FFF" /></div>
            <div>
              <h1 style={styles.pageTitle}>Central de Logística</h1>
              <p style={styles.pageSub}>Torre de Controle Operacional • Global Hub</p>
            </div>
          </div>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Pesquisar ID, Placa, CNPJ, Email, Cor..." 
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm.length > 1 && setIsSearchOpen(true)}
            />
            {isSearchOpen && (
              <div style={styles.resultsDropdown} className="animate-slide-up">
                <div style={styles.resultsHeader}>
                  <span>Resultados do Ecossistema Hub</span>
                  <span>{searchResults.length} encontrados</span>
                </div>
                <div style={styles.resultsList}>
                  {searchResults.map(res => (
                    <div 
                      key={res.id} 
                      style={styles.resultItem}
                      onClick={() => handleEntitySelect(res)}
                    >
                      <div style={{...styles.resIcon, backgroundColor: res.type === 'vehicle' ? '#EEF2FF' : '#F0FDF4'}}>
                        {res.type === 'vehicle' ? <Car size={16} color="#6366F1" /> : <Users size={16} color="#10B981" />}
                      </div>
                      <div style={styles.resInfo}>
                        <div style={styles.resName}>{res.name} {res.plate && <span style={styles.resPlate}>{res.plate}</span>}</div>
                        <div style={styles.resMeta}>{res.owner || res.company || res.document} • {res.email}</div>
                      </div>
                      <ChevronRight size={14} color="#CBD5E1" />
                    </div>
                  ))}
                  {searchResults.length === 0 && (
                    <div style={styles.noResults}>Nenhum dado correspondente encontrado.</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button style={styles.refreshBtn} onClick={() => window.location.reload()}>
            <RefreshCw size={18} />
          </button>
          <button style={styles.alertBtn}>
            <Bell size={18} />
            <div style={styles.alertBadge}>{stats.alerts_critical}</div>
          </button>
        </div>
      </header>

      {/* KPI ROW */}
      <div style={styles.kpiRow}>
        <KPIItem 
          label="Rotas Ativas" 
          value={stats.total_routes} 
          trend="+12%" 
          trendUp={true} 
          icon={<List size={20} />} 
          color="#6366F1" 
        />
        <KPIItem 
          label="Veículos" 
          value={stats.active_vehicles} 
          trend="+5" 
          trendUp={true} 
          icon={<Car size={20} />} 
          color="#10B981" 
        />
        <KPIItem 
          label="Alertas" 
          value={stats.alerts_critical} 
          trend="-2" 
          trendUp={false} 
          icon={<AlertTriangle size={20} />} 
          color="#F43F5E" 
        />
        <KPIItem 
          label="Custo Dia" 
          value={`R$ ${(stats.estimated_cost/1000).toFixed(1)}k`} 
          trend="+8%" 
          trendUp={false} 
          icon={<TrendingUp size={20} />} 
          color="#0F172A" 
        />
      </div>

      {/* MAIN CONTENT */}
      <div style={styles.mainLayout}>
        <div style={styles.contentCol}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', backgroundColor: '#E2E8F0', padding: '4px', borderRadius: '12px' }}>
              {['Tudo', 'Logta', 'Zaptro', 'Problemas'].map(tab => (
                <button 
                  key={tab}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === tab.toLowerCase() ? '#FFF' : 'transparent',
                    color: activeTab === tab.toLowerCase() ? '#0F172A' : '#64748B',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: '0.2s',
                    boxShadow: activeTab === tab.toLowerCase() ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                  }}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
              <button 
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  backgroundColor: viewMode === 'map' ? '#0F172A' : 'transparent',
                  color: viewMode === 'map' ? '#FFF' : '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: '700'
                }}
                onClick={() => setViewMode('map')}
              >
                <MapIcon size={18} /> Mapa
              </button>
              <button 
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  backgroundColor: viewMode === 'list' ? '#0F172A' : 'transparent',
                  color: viewMode === 'list' ? '#FFF' : '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: '700'
                }}
                onClick={() => setViewMode('list')}
              >
                <List size={18} /> Lista
              </button>
            </div>
          </div>

          <div style={styles.viewContainer}>
            {viewMode === 'map' ? (
              <div style={styles.mapWrapper}>
                <MapContainer 
                  center={mapCenter as any} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  <ZoomControl position="bottomright" />
                  
                  {trackingData.map(v => (
                    <Marker 
                      key={v.id} 
                      position={[v.lat, v.lng] as any} 
                      icon={v.status === 'problema' ? problemIcon : truckIcon}
                    >
                      <Popup>
                        <div style={styles.popupContainer}>
                          <h4 style={styles.popupTitle}>{v.asset_name}</h4>
                          <p style={styles.popupSub}>{v.company?.name || '---'} • {v.product_source}</p>
                          <div style={{...styles.statusTag, backgroundColor: v.status === 'problema' ? '#FEE2E2' : '#D1FAE5'}}>
                            {v.status?.toUpperCase() || 'OFFLINE'}
                          </div>
                          <div style={{fontSize: '11px', color: '#64748b', marginBottom: '12px'}}>
                            Velocidade: {v.metadata?.speed || 0} km/h
                          </div>
                          <button 
                            style={styles.popupAction}
                            onClick={() => navigate(`/master/clientes?id=${v.id}`)}
                          >
                            Ver Dados do Cliente
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* FOCUS ON SEARCHED ENTITY */}
                  {selectedEntity && (selectedEntity.lat || selectedEntity.lng) && (
                    <Marker 
                      position={[selectedEntity.lat, selectedEntity.lng] as any}
                      icon={truckIcon}
                    >
                      <Popup autoOpen>
                        <div style={styles.popupContainer}>
                          <h4 style={styles.popupTitle}>{selectedEntity.name}</h4>
                          <p style={styles.popupSub}>{selectedEntity.owner} • {selectedEntity.plate}</p>
                          <div style={{...styles.statusTag, backgroundColor: '#D9FF00', color: '#000'}}>
                            FOCO NA BUSCA
                          </div>
                          <button 
                            style={styles.popupAction}
                            onClick={() => navigate(`/master/clientes?id=${selectedEntity.ownerId}`)}
                          >
                            Ir para Dashboard do Cliente
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
                
                <div style={styles.mapLegend}>
                  <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#10B981'}} /> Normal</div>
                  <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#F59E0B'}} /> Atraso</div>
                  <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#F43F5E'}} /> Problema</div>
                </div>
              </div>
            ) : (
              <div style={styles.listWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>EMPRESA</th>
                      <th style={styles.th}>MOTORISTA</th>
                      <th style={styles.th}>ROTA</th>
                      <th style={styles.th}>STATUS</th>
                      <th style={styles.th}>HORÁRIO</th>
                      <th style={styles.th}>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.length > 0 ? filteredRoutes.map((r, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.companyCell}>
                            <div style={styles.sourceTag}>{r.company?.origin || 'HUB'}</div>
                            <span style={styles.companyName}>{r.company?.name || '---'}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.driverInfo}>
                            <strong>{r.driver?.nome || '---'}</strong>
                            <span style={styles.vehiclePlate}>{r.vehicle?.plate || '---'}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.routePath}>
                            <span style={styles.pathPoint}>{r.origin || 'Base'}</span>
                            <ChevronRight size={14} color="#94A3B8" />
                            <span style={styles.pathPoint}>{r.destination || 'Destino'}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{...styles.statusBadge, ...getStatusStyles(r.status)}}>
                            {r.status || 'PENDENTE'}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.timeInfo}>
                            <Clock size={14} />
                            <span>{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <button style={styles.actionBtn}><MoreHorizontal size={18} /></button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                          Nenhuma rota encontrada para os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarSection}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>Alertas Hub</h3>
            </div>
            <div style={styles.alertList}>
              {alerts.map((a, i) => (
                <div key={i} style={{...styles.alertItem, borderLeftColor: a.type === 'critical' ? '#F43F5E' : '#F59E0B'}}>
                  <div style={styles.alertHeader}>
                    <span style={styles.alertTime}>{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h4 style={styles.alertTitle}>{a.title}</h4>
                  <p style={styles.alertMsg}>{a.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.sidebarSection}>
            <h3 style={styles.sidebarTitle}>Telemetria Real-time</h3>
            <div style={{marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {trackingData.slice(0, 5).map(t => (
                <div key={t.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderRadius: '8px', border: '1px solid #f1f5f9'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <Activity size={14} color={t.status === 'em_rota' ? '#10b981' : '#94a3b8'} />
                    <span style={{fontSize: '12px', fontWeight: '700'}}>{t.asset_name}</span>
                  </div>
                  <span style={{fontSize: '11px', color: '#64748b'}}>{t.metadata?.speed || 0} km/h</span>
                </div>
              ))}
              {trackingData.length === 0 && <div style={styles.emptyState}>Sem telemetria ativa.</div>}
            </div>
          </div>

          <div style={styles.sidebarSection}>
            <h3 style={styles.sidebarTitle}>Insights IA</h3>
            <div style={styles.aiCard}>
              <div style={styles.aiIcon}><Zap size={20} color="#6366F1" /></div>
              <p style={styles.aiText}>
                <strong>Sugestão Master:</strong> 3 empresas na região Leste estão com rotas sobrepostas. Possível oportunidade de otimização cross-tenant.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LogisticaHub;
