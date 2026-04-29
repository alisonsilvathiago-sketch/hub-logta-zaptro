import React, { useState, useEffect } from 'react';
import {
  RefreshCw, Layers, Bell, Maximize2, Zap, Play, ShieldCheck, DollarSign, Brain, Lock, Box, Navigation, CheckCircle2, Droplets, TrendingDown, Fuel, ShieldAlert, Anchor, Repeat, FileCheck, Share2, LocateFixed, Users, MapPin, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, Map as MapIcon, Search, List, Car, MoreHorizontal, Package, Star, TrendingUp, ArrowLeft
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Marker,
  Popup, ZoomControl
} from 'react-leaflet';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import HubMap, { truckIcon, carIcon, problemIcon } from '../../components/HubMap';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@core/lib/supabase';
import { useAuth } from '@core/context/AuthContext';
import { toastSuccess, toastError, toastInfo, toastLoading, toastDismiss } from '@core/lib/toast';
import Pagination from '@shared/components/Pagination';
import { FuelPump } from '@shared/components/FuelIntelligence';

// --- STYLES & HELPERS ---
const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'finalizada': return { backgroundColor: '#D1FAE5', color: '#065F46' };
    case 'problema': return { backgroundColor: '#FEE2E2', color: '#991B1B' };
    case 'atraso': return { backgroundColor: '#FEF3C7', color: '#92400E' };
    default: return { backgroundColor: '#E0E7FF', color: '#3730A3' };
  }
};

const BackButton: React.FC = () => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate('/master/logistica')}
      style={{
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: '8px',
        marginRight: '8px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748B',
        transition: 'all 0.2s'
      }}
      className="hover-bg-slate"
    >
      <ArrowLeft size={24} />
    </button>
  );
};

const LogisticsMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('ALL');

  const [stats, setStats] = useState({
    total_routes: 0,
    active_vehicles: 0,
    alerts_critical: 0,
    estimated_cost: 15400
  });

  const [trackingData, setTrackingData] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [optimizations, setOptimizations] = useState<any[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(20);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      let rQuery = supabase.from('routes').select(`
        *,
        company:companies(name, origin),
        vehicle:vehicles(plate, model, lat, lng, status),
        driver:motoristas(nome)
      `, { count: 'exact' });

      if (itemsPerPage !== 'all') {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        rQuery = rQuery.range(from, to);
      }

      const [rRes, aRes, tRes, oRes] = await Promise.all([
        rQuery.order('created_at', { ascending: false }),
        supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('global_tracking').select('*, company:companies(name)'),
        supabase.from('logistics_route_optimizations').select('*').order('created_at', { ascending: false }).limit(3)
      ]);

      if (rRes.data) {
        setRoutes(rRes.data);
        setTotalCount(rRes.count || 0);
      }
      if (aRes.data) setAlerts(aRes.data);
      if (tRes.data) setTrackingData(tRes.data);
      if (oRes.data) setOptimizations(oRes.data);

      if (rRes.data) {
        setStats(prev => ({
          ...prev,
          total_routes: rRes.count || 0,
          active_vehicles: new Set(rRes.data.map(r => r.vehicle_id)).size || 0,
          alerts_critical: aRes.data?.filter((a: any) => a.type === 'critical').length || 0
        }));
      }
    } catch (err) {
      toastError('Erro ao sincronizar torre de controle.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage]);

  const handleRunOptimizer = async () => {
    const tid = toastLoading('Navigator AI calculando novas rotas...');
    try {
      await supabase.from('logistics_route_optimizations').insert([{
        title: 'Otimização Cross-Tenant Detectada',
        suggestion: '3 empresas na região Leste estão com rotas sobrepostas. Consolidar cargas economizaria R$ 1.240 hoje.',
        impact: '8% economia diesel',
        status: 'PENDING'
      }]);
      fetchData();
      toastSuccess('Novas sugestões de otimização disponíveis!');
    } catch (err) {
      toastError('Erro ao rodar otimizador.');
    } finally {
      toastDismiss(tid);
    }
  };

  const mapCenter: [number, number] = [-23.5505, -46.6333];

  const filteredRoutes = routes.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      r.driver?.nome?.toLowerCase().includes(searchLower) ||
      r.vehicle?.plate?.toLowerCase().includes(searchLower) ||
      r.company?.name?.toLowerCase().includes(searchLower);

    const activeTabUpper = activeFilterTab.toUpperCase();
    if (activeTabUpper === 'ALL' || activeTabUpper === 'TUDO') return matchesSearch;
    if (activeTabUpper === 'PROBLEMAS') return matchesSearch && (r.status === 'problema' || r.status === 'atraso');
    
    return matchesSearch && r.company?.origin?.toUpperCase() === activeTabUpper;
  });

  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div style={styles.iconBox}><Activity size={24} color="#FFF" /></div>
          <div>
            <h1 style={styles.pageTitle}>Torre de Controle Logístico</h1>
            <p style={styles.pageSub}>Monitoramento autônomo em tempo real de frotas e entregas.</p>
          </div>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Pesquisar por Motorista, Placa ou Empresa..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button style={styles.refreshBtn} onClick={fetchData}>
            <RefreshCw size={18} />
          </button>
          <button style={styles.alertBtn}>
            <Bell size={18} />
            <div style={styles.alertBadge}>{stats.alerts_critical}</div>
          </button>
        </div>
      </header>

      <div style={styles.statsGrid}>
        <KPIItem label="Rotas Ativas" value={stats.total_routes} trend="+12%" trendUp={true} icon={<List size={20} />} />
        <KPIItem label="Veículos Online" value={stats.active_vehicles} trend="+5" trendUp={true} icon={<Car size={20} />} />
        <KPIItem label="Alertas Críticos" value={stats.alerts_critical} trend="-2" trendUp={false} icon={<AlertTriangle size={20} />} />
        <KPIItem label="Custo Operacional" value={`R$ ${(stats.estimated_cost / 1000).toFixed(1)}k`} trend="+8%" trendUp={false} icon={<TrendingUp size={20} />} />
      </div>

      <div style={styles.mainLayout}>
        <div style={styles.contentCol}>
          <div style={styles.controlBar}>
            <div style={styles.filterTabsSmall}>
              {['Tudo', 'Logta', 'Zaptro', 'Problemas'].map(tab => (
                <button
                  key={tab}
                  style={{
                    ...styles.filterTabSmall,
                    ...(activeFilterTab === tab.toLowerCase() ? styles.filterTabSmallActive : {})
                  }}
                  onClick={() => setActiveFilterTab(tab.toLowerCase())}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={styles.viewToggle}>
              <button style={{...styles.toggleBtn, backgroundColor: viewMode === 'map' ? '#0F172A' : 'transparent', color: viewMode === 'map' ? '#FFF' : '#94A3B8'}} onClick={() => setViewMode('map')}>
                <MapIcon size={18} /> Mapa
              </button>
              <button style={{...styles.toggleBtn, backgroundColor: viewMode === 'list' ? '#0F172A' : 'transparent', color: viewMode === 'list' ? '#FFF' : '#94A3B8'}} onClick={() => setViewMode('list')}>
                <List size={18} /> Lista
              </button>
            </div>
          </div>

          <div style={styles.viewContainer}>
            {viewMode === 'map' ? (
              <div style={styles.mapWrapper}>
                <HubMap center={mapCenter as any} zoom={13} zoomControl={false}>
                  <ZoomControl position="bottomright" />
                  {trackingData.map(v => (
                    <Marker key={v.id} position={[v.lat, v.lng] as any} icon={v.status === 'problema' ? problemIcon : (v.type === 'van' ? carIcon : truckIcon)}>
                      <Popup>
                        <div style={styles.popupContainer}>
                          <h4 style={styles.popupTitle}>{v.asset_name || 'Equipamento'}</h4>
                          <p style={styles.popupSub}>{(v.company?.name || 'Geral')} • {v.product_source || 'HUB'}</p>
                          <div style={{ ...styles.statusTag, backgroundColor: v.status === 'problema' ? '#FEE2E2' : '#D1FAE5' }}>
                            {v.status?.toUpperCase() || 'OFFLINE'}
                          </div>
                          <button style={styles.popupAction} onClick={() => navigate(`/master/clientes?id=${v.id}`)}>Detalhes do Asset</button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </HubMap>
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
                    {filteredRoutes.map((r, i) => (
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
                            <Navigation size={14} color="#94A3B8" />
                            <span style={styles.pathPoint}>{r.destination || 'Destino'}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ ...styles.statusBadge, ...getStatusStyles(r.status) }}>{r.status?.toUpperCase() || 'PENDENTE'}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.timeInfo}>
                            <RefreshCw size={14} />
                            <span>{r.created_at ? new Date(r.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                          </div>
                        </td>
                        <td style={styles.td}><button style={styles.actionBtn}><MoreHorizontal size={18} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination currentPage={currentPage} totalItems={totalCount} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={(val) => {setItemsPerPage(val); setCurrentPage(1);}} />
              </div>
            )}
          </div>
        </div>

        <aside style={styles.sidebar}>
          <div style={styles.sidebarSection}>
            <h3 style={styles.sidebarTitle}>Alertas Críticos</h3>
            <div style={styles.alertList}>
              {alerts.map((a, i) => (
                <div key={i} style={{ ...styles.alertItem, borderLeftColor: a.type === 'critical' ? '#F43F5E' : '#F59E0B' }}>
                  <span style={styles.alertTime}>{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <h4 style={styles.alertTitle}>{a.title}</h4>
                  <p style={styles.alertMsg}>{a.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.sidebarSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={styles.sidebarTitle}>Insights IA</h3>
              <button style={styles.runAiBtn} onClick={handleRunOptimizer}><Zap size={12} /> RODAR AI</button>
            </div>
            {optimizations.map((opt, i) => (
              <div key={i} style={styles.aiCard}>
                <Zap size={20} color="#6366F1" style={{ flexShrink: 0 }} />
                <div>
                  <p style={styles.aiText}><strong>{opt.title}:</strong> {opt.suggestion}</p>
                  <div style={styles.aiImpact}>Impacto: {opt.impact}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

const LogisticsDestinations: React.FC = () => {
  const destinos = [
    { id: 1, name: 'Sede Central - SP', status: 'Ativo', shipments: 45, efficiency: '98%' },
    { id: 2, name: 'Filial Sul - RS', status: 'Ativo', shipments: 22, efficiency: '95%' },
    { id: 3, name: 'Centro de Distribuição - RJ', status: 'Em Manutenção', shipments: 0, efficiency: '0%' },
    { id: 4, name: 'Hub Nordeste - PE', status: 'Ativo', shipments: 18, efficiency: '92%' },
  ];

  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div>
            <h1 style={styles.pageTitle}>Centros & Destinos de Operação</h1>
            <p style={styles.pageSub}>Gerenciamento estratégico de pontos de entrega e CDs Logta.</p>
          </div>
        </div>
        <button style={styles.addBtn}>Novo Destino +</button>
      </header>

      <div style={styles.destinosGrid}>
        {destinos.map(destino => (
          <div key={destino.id} style={styles.destinoCard}>
            <div style={styles.destinoIcon}><MapPin size={24} color="#6366F1" /></div>
            <div style={{ flex: 1 }}>
              <h3 style={styles.destinoTitle}>{destino.name}</h3>
              <div style={styles.destinoStats}>
                <div style={styles.destinoStat}><Box size={14} /> <span>{destino.shipments} Envios</span></div>
                <div style={styles.destinoStat}><Navigation size={14} /> <span>{destino.efficiency} Eficiência</span></div>
              </div>
            </div>
            <div style={{...styles.statusBadge, backgroundColor: destino.status === 'Ativo' ? '#D1FAE5' : '#FEE2E2', color: destino.status === 'Ativo' ? '#10b981' : '#f43f5e'}}>{destino.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LogisticsIntelligence: React.FC<{ deliveryActions: any[], refresh: () => void }> = ({ deliveryActions, refresh }) => {
  const roiData = [
    { name: 'Jan', savings: 4500, efficiency: 72 },
    { name: 'Fev', savings: 5200, efficiency: 78 },
    { name: 'Mar', savings: 6100, efficiency: 85 },
    { name: 'Abr', savings: 7800, efficiency: 94 },
  ];

  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div>
            <h1 style={styles.pageTitle}>Cérebro de Inteligência Logística</h1>
            <p style={styles.pageSub}>Análise de ROI autônomo e performance da malha logística.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
           <div style={styles.statusBadgeActive}><Activity size={14} color="#10B981" /> CÉREBRO ATIVO</div>
           <button onClick={refresh} style={styles.refreshBtn}><RefreshCw size={18} /></button>
        </div>
      </header>

      <div style={styles.kpiRow}>
        <KPIItem label="Economia ROI" value="R$ 23.640" trend="+18.4%" trendUp={true} icon={<DollarSign size={24} />} color="#10B981" />
        <KPIItem label="Risco (Guardian)" value="92%" trend="+5.2%" trendUp={true} icon={<ShieldCheck size={24} />} color="#6366F1" />
        <KPIItem label="Compliance Frota" value="98.4%" trend="+0.8%" trendUp={true} icon={<Users size={24} />} color="#F59E0B" />
        <KPIItem label="Produtividade IA" value="14.2x" trend="+2.1x" trendUp={true} icon={<Zap size={24} />} color="#D9FF00" />
      </div>

      <div style={styles.splitGrid}>
        {/* Left Col: Efficiency Chart */}
        <div style={styles.chartCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={styles.cardTitle}>Evolução de Eficiência Logística</h3>
            <div style={styles.aiStatusBadge}>SAVINGS: +R$ 7.8k</div>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={roiData}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94A3B8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94A3B8'}} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="savings" stroke="#6366F1" strokeWidth={4} fill="url(#colorSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ ...styles.insightCard, marginTop: '24px', backgroundColor: '#F8FAFC' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Brain size={24} color="#6366F1" />
              <div>
                <h4 style={{ ...styles.insightTitle, margin: 0 }}>Insight do Navigator AI</h4>
                <p style={{ ...styles.insightText, margin: '4px 0 0' }}>As rotas otimizadas este mês reduziram a emissão de CO2 em 12% e economizaram 1.400 litros de combustível.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Autonomous Logs */}
        <div style={styles.chartCard}>
          <div style={styles.cardHeaderWithBadge}>
             <Brain size={18} color="#6366F1" />
             <h3 style={styles.cardTitle}>Log de Estratégias Autônomas</h3>
             <div style={styles.aiStatusBadge}>MONITORAMENTO IA ATIVO</div>
          </div>
          <div style={{ ...styles.strategyList, maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
             {deliveryActions.length > 0 ? deliveryActions.map(action => (
               <div key={action.id} style={styles.strategyRow}>
                  <div style={{...styles.strategyIcon, backgroundColor: action.status === 'confirmado' ? '#ECFDF5' : action.status === 'reagendado' ? '#FFFBEB' : '#F8FAF9'}}>
                     {action.status === 'confirmado' && <CheckCircle2 size={14} color="#10B981" />}
                     {action.status === 'reagendado' && <Repeat size={14} color="#F59E0B" />}
                     {action.status === 'pendente' && <Box size={14} color="#6366F1" />}
                  </div>
                  <div style={styles.strategyMain}>
                     <div style={styles.strategyAction}>Fulfillment: {action.status === 'confirmado' ? 'CONFIRMADO' : action.status === 'reagendado' ? 'REAGENDADO' : 'PENDENTE'}</div>
                     <div style={styles.strategyReason}>Pedido {action.order_id} • Token {action.token}</div>
                  </div>
                  <div style={styles.strategyMeta}>
                     <div style={{...styles.strategyImpact, color: action.status === 'confirmado' ? '#10B981' : '#6366F1'}}>
                        {action.status === 'confirmado' ? 'Verificado' : 'Autônomo'}
                     </div>
                     <div style={styles.strategyTime}>{new Date(action.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
               </div>
             )) : <div style={{textAlign: 'center', padding: '20px', color: '#94A3B8'}}>Sem ações de inteligência recentes.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const LogisticsAggregates: React.FC<{ aggregates: any[], refresh: () => void }> = ({ aggregates, refresh }) => {
  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div>
            <h1 style={styles.pageTitle}>Frota de Agregados & Parceiros</h1>
            <p style={styles.pageSub}>Gestão de terceiros, performance de agregados e score de confiabilidade.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
           <button onClick={refresh} style={styles.refreshBtn}><RefreshCw size={18} /></button>
           <button style={styles.addBtn}>Novo Agregado +</button>
        </div>
      </header>

      <div style={styles.statsGrid}>
        <KPIItem label="Agregados Ativos" value={aggregates.filter(a => a.status === 'ativo').length.toString()} icon={<Users size={20} />} color="#6366F1" />
        <KPIItem label="Score Médio" value={(aggregates.reduce((acc, a) => acc + Number(a.score), 0) / (aggregates.length || 1)).toFixed(2)} icon={<Star size={20} />} color="#F59E0B" />
        <KPIItem label="Total Pagamentos" value={`R$ ${aggregates.reduce((acc, a) => acc + Number(a.total_earnings), 0).toLocaleString()}`} icon={<DollarSign size={20} />} color="#10B981" />
      </div>

      <div style={styles.viewContainer}>
        <div style={styles.listWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>AGREGADO</th>
                <th style={styles.th}>VEÍCULO / PLACA</th>
                <th style={styles.th}>PERFORMANCE</th>
                <th style={styles.th}>GANHOS</th>
                <th style={styles.th}>STATUS</th>
                <th style={styles.th}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {aggregates.map((agg) => (
                <tr key={agg.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.driverInfo}>
                      <strong>{agg.name}</strong>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>ID: {agg.id.split('-')[0]}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.driverInfo}>
                      <span>{agg.vehicle_type}</span>
                      <strong style={{ fontSize: '12px' }}>{agg.plate}</strong>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.scoreRow}>
                      <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      <strong>{agg.score}</strong>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>({agg.total_deliveries} entregas)</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <strong style={{ color: '#10B981' }}>R$ {Number(agg.total_earnings).toLocaleString()}</strong>
                  </td>
                  <td style={styles.td}>
                    <div style={{ ...styles.statusBadge, backgroundColor: agg.status === 'ativo' ? '#D1FAE5' : '#FEE2E2', color: agg.status === 'ativo' ? '#065F46' : '#991B1B' }}>
                      {agg.status.toUpperCase()}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <button style={styles.actionBtn}><Share2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const LogisticsSequence: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState('Rota #882');
  
  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div>
            <h1 style={styles.pageTitle}>Sequenciamento & Plano de Carregamento</h1>
            <p style={styles.pageSub}>Otimização de ordem de entrega e lógica LIFO (Last-In, First-Out) para o baú.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
           <select style={styles.calcInput} value={activeRoute} onChange={e => setActiveRoute(e.target.value)}>
              <option>Rota #882</option>
              <option>Rota #885</option>
              <option>Rota #890</option>
           </select>
        </div>
      </header>

      <div style={styles.mainLayout}>
        <div style={styles.contentCol}>
          <div style={styles.chartCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
               <h3 style={styles.sidebarTitle}>Plano de Carregamento (Ordem Reversa)</h3>
               <div style={styles.aiStatusBadge}>LÓGICA LIFO ATIVA</div>
            </div>
            
            <div style={styles.loadingPlanContainer}>
               {[
                 { id: 1, client: 'Cliente A', zone: 'Frente / Porta', delivery: '1ª Entrega', load: '3º Carregar', icon: <Anchor size={18} /> },
                 { id: 2, client: 'Cliente B', zone: 'Meio do Baú', delivery: '2ª Entrega', load: '2º Carregar', icon: <Repeat size={18} /> },
                 { id: 3, client: 'Cliente C', zone: 'Fundo do Baú', delivery: '3ª Entrega', load: '1º Carregar', icon: <Package size={18} /> },
               ].map(item => (
                 <div key={item.id} style={styles.loadingStep}>
                    <div style={styles.loadingIcon}>{item.icon}</div>
                    <div style={styles.loadingMain}>
                       <div style={styles.loadingClient}>{item.client}</div>
                       <div style={styles.loadingZone}>{item.zone}</div>
                    </div>
                    <div style={styles.loadingMeta}>
                       <div style={styles.loadingDelivery}>{item.delivery}</div>
                       <div style={styles.loadingAction}>{item.load}</div>
                    </div>
                 </div>
               ))}
            </div>
            
            <button style={{ ...styles.addBtn, width: '100%', marginTop: '24px', backgroundColor: '#0F172A' }}>
               Gerar QR Codes de Carregamento
            </button>
          </div>
        </div>

        <aside style={styles.sidebar}>
           <div style={styles.sidebarSection}>
              <h3 style={styles.sidebarTitle}>Início de Rota GPS</h3>
              <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>Enviar link de navegação inteligente para o motorista.</p>
              <button style={{ ...styles.addBtn, width: '100%', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                 <Share2 size={16} /> Enviar p/ Zaptro
              </button>
              <button style={{ ...styles.secondaryBtn, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                 <LocateFixed size={16} /> Abrir no Google Maps
              </button>
           </div>
        </aside>
      </div>
    </div>
  );
};

const LogisticsExceptions: React.FC<{ exceptions: any[], refresh: () => void }> = ({ exceptions, refresh }) => {
  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div>
            <h1 style={styles.pageTitle}>Controle de Exceções Autônomo</h1>
            <p style={styles.pageSub}>Detecção e resolução automática de falhas operacionais, no-shows e quebras de rota.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
           <button onClick={refresh} style={styles.refreshBtn}><RefreshCw size={18} /></button>
           <div style={styles.statusBadgeActive}><ShieldCheck size={14} /> MONITORAMENTO ATIVO</div>
        </div>
      </header>

      <div style={styles.kpiRow}>
         <KPIItem label="Exceções Ativas" value={exceptions.length.toString()} trend={exceptions.length > 5 ? '+Alto' : 'Baixo'} trendUp={exceptions.length > 5} icon={<ShieldAlert size={20} />} color="#EF4444" />
         <KPIItem label="Taxa de Confirmação" value="94.2%" trend="+2.1%" trendUp={true} icon={<FileCheck size={20} />} color="#10B981" />
         <KPIItem label="Resolvido c/ IA" value="88%" trend="+5%" trendUp={true} icon={<Zap size={20} />} color="#6366F1" />
         <KPIItem label="Economia Perda" value="R$ 4.250" trend="+R$ 800" trendUp={true} icon={<DollarSign size={20} />} color="#10B981" />
      </div>

      <div style={styles.mainLayout}>
        <div style={styles.contentCol}>
           <div style={styles.chartCard}>
              <h3 style={styles.sidebarTitle}>Fila de Exceções em Tempo Real</h3>
              <div style={styles.strategyList}>
                 {exceptions.length > 0 ? exceptions.map(item => (
                   <div key={item.id} style={styles.strategyRow}>
                      <div style={{ ...styles.strategyIcon, backgroundColor: item.priority === 'Alta' ? '#FEF2F2' : '#F8FAFC' }}>
                         <ShieldAlert size={14} color={item.priority === 'Alta' ? '#EF4444' : '#64748B'} />
                      </div>
                      <div style={styles.strategyMain}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={styles.strategyAction}>{item.type === 'DELAY' ? 'ATRASO' : item.type === 'LOCATION' ? 'LOCALIZAÇÃO' : item.type}</div>
                            <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', backgroundColor: item.priority === 'Alta' ? '#EF4444' : '#64748B', color: 'white' }}>{item.priority.toUpperCase()}</span>
                         </div>
                         <div style={styles.strategyReason}>Pedido {item.order_id} • Status: {item.status === 'pendente' ? 'Pendente' : 'Resolvido'}</div>
                      </div>
                      <div style={styles.strategyMeta}>
                         <div style={{ ...styles.strategyImpact, color: '#6366F1' }}>{item.status === 'pendente' ? 'Aguardando IA' : 'Resolvido'}</div>
                         <div style={styles.strategyTime}>{new Date(item.created_at).toLocaleTimeString('pt-BR')}</div>
                      </div>
                   </div>
                 )) : <div style={{textAlign: 'center', padding: '40px', color: '#94A3B8'}}>Nenhuma exceção ativa detectada.</div>}
              </div>
           </div>
        </div>

        <aside style={styles.sidebar}>
           <div style={styles.insightCard}>
              <h4 style={styles.insightTitle}>Guardian Intelligence</h4>
              <p style={styles.insightText}>O sistema está monitorando padrões de no-show e atrasos. Se um motorista sair do geofence, um bloqueio preventivo será aplicado.</p>
              <button style={{ ...styles.addBtn, width: '100%', marginTop: '12px' }}>Ver Regras de Compliance</button>
           </div>
        </aside>
      </div>
    </div>
  );
};

const LogisticsFuel: React.FC<{ fuelPrices: any[], refresh: () => void }> = ({ fuelPrices, refresh }) => {
  const [selectedFuel, setSelectedFuel] = useState('Gasolina');
  const [locationSearch, setLocationSearch] = useState('');

  const normalizeType = (value?: string | null) => {
    const type = (value || '').toLowerCase();
    if (type.includes('gasolina')) return 'gasolina';
    if (type.includes('etanol') || type.includes('alcool') || type.includes('álcool')) return 'etanol';
    if (type.includes('diesel')) return 'diesel';
    if (type.includes('gnv') || type.includes('gas') || type.includes('gás')) return 'gnv';
    return type;
  };

  const fuelMeta: Record<string, { label: string; color: string }> = {
    gasolina: { label: 'Gasolina', color: '#6366F1' },
    diesel: { label: 'Diesel', color: '#EF4444' },
    etanol: { label: 'Etanol', color: '#10B981' },
    gnv: { label: 'GNV', color: '#0EA5E9' },
  };

  const canonicalOrder = ['gasolina', 'diesel', 'etanol', 'gnv'];
  const availableFuels = fuelPrices.map(p => ({
    ...p,
    normalizedType: normalizeType(p.type)
  }));

  const averageBrazil = availableFuels.length > 0
    ? availableFuels.reduce((acc, item) => acc + Number(item.price || 0), 0) / availableFuels.length
    : 0;

  const fuelStats = [
    { label: 'Média Nacional', value: 'R$ 5,89', trend: '+1.2%', trendUp: false, icon: <TrendingUp size={20} />, live: true },
    { label: 'Economia IA', value: 'R$ 12k/mês', trend: 'ATIVO', trendUp: true, icon: <Brain size={20} />, live: true },
    { label: 'Postos ANP', value: '14.200', trend: 'SYNC', trendUp: true, icon: <ShieldCheck size={20} /> },
    { label: 'Meta ROI', value: 'R$ 5,45', trend: 'OTIMIZADO', trendUp: true, icon: <Zap size={20} />, live: true },
  ];

  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div>
            <h1 style={styles.pageTitle}>Inteligência de Combustível</h1>
            <p style={styles.pageSub}>Monitoramento analítico da malha energética e impactos no ROI.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.refreshBtn} onClick={refresh}><RefreshCw size={18} /></button>
        </div>
      </header>

      <div style={{ ...styles.chartCard, marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {['Gasolina', 'Etanol', 'Diesel', 'GNV'].map(f => {
            const isActive = selectedFuel === f;
            return (
              <button 
                key={f} 
                onClick={() => setSelectedFuel(f)}
                style={{ 
                  ...styles.refreshBtn, 
                  width: 'auto', 
                  padding: '0 24px', 
                  backgroundColor: isActive ? 'var(--bg-active)' : 'var(--bg-secondary)', 
                  border: '1px solid',
                  borderColor: isActive ? '#6366F1' : 'var(--border)', 
                  fontWeight: '800', 
                  color: isActive ? '#6366F1' : '#64748B',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isActive ? 'translateY(-1px)' : 'none',
                  boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none'
                }}
              >
                {f.toUpperCase()}
              </button>
            );
          })}
        </div>
        <div style={{ ...styles.searchWrapper, width: '320px' }}>
          <MapPin size={18} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Vincular cidade/estado para filtrar..." 
            style={styles.searchInput}
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ ...styles.statsGrid, marginBottom: '24px' }}>
        {fuelStats.map((stat: any, i) => (
          <KPIItem key={i} label={stat.label} value={stat.value} trend={stat.trend} trendUp={stat.trendUp} icon={stat.icon} variant={i % 2 === 1 ? 'solid' : 'light'} live={stat.live} />
        ))}
      </div>

      {/* Radar de Preços - Moved to Top as requested */}
      <div style={{ ...styles.chartCard, marginBottom: '32px', border: '1px solid var(--border-light)', backgroundColor: '#FFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={styles.cardTitle}>Radar de Preços Brasil</h3>
            <p style={{ ...styles.pageSub, fontSize: '12px', marginTop: '4px' }}>Variação regional baseada em sua localização.</p>
          </div>
          <div style={styles.statusBadgeActive}>IA ACTIVE SCAN</div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { name: 'São Paulo, SP', price: 'R$ 5,65', impact: 'BAIXO' },
            { name: 'Rio de Janeiro, RJ', price: 'R$ 6,12', impact: 'ALTO' },
            { name: 'Curitiba, PR', price: 'R$ 5,78', impact: 'MÉDIO' },
            { name: 'Cuiabá, MT', price: 'R$ 5,99', impact: 'MÉDIO' },
            { name: 'Belo Horizonte, MG', price: 'R$ 5,82', impact: 'MÉDIO' },
            { name: 'Porto Alegre, RS', price: 'R$ 6,05', impact: 'ALTO' },
          ].filter(reg => 
            reg.name.toLowerCase().includes(locationSearch.toLowerCase())
          ).map((reg, i) => (
            <div key={i} style={{ 
              display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', 
              backgroundColor: 'var(--bg-overlay)', borderRadius: '18px', border: '1px solid var(--border)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }} className="hover-scale">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>{reg.name}</div>
                <div style={{ 
                  fontSize: '9px', fontWeight: '900', padding: '4px 8px', borderRadius: '20px',
                  backgroundColor: reg.impact === 'BAIXO' ? '#DCFCE7' : (reg.impact === 'ALTO' ? '#FEE2E2' : '#FEF3C7'), 
                  color: reg.impact === 'BAIXO' ? '#166534' : (reg.impact === 'ALTO' ? '#991B1B' : '#92400E') 
                }}>
                  {reg.impact}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>{reg.price}</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }}></div> ATIVO
                </div>
              </div>
            </div>
          ))}
          {locationSearch && [
            { name: 'São Paulo', price: '5,65' } // dummy for length check
          ].filter(reg => reg.name.toLowerCase().includes(locationSearch.toLowerCase())).length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: '600', backgroundColor: 'var(--bg-overlay)', borderRadius: '20px' }}>
              Nenhuma região encontrada para "{locationSearch}"
            </div>
          )}
        </div>
      </div>

      <div style={styles.splitGrid}>
        <div style={styles.sidebarCol}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
            {['Comum', 'Aditivada', 'Premium'].map((variant, i) => {
              const basePrice = availableFuels.find(f => f.normalizedType === selectedFuel.toLowerCase())?.price || 0;
              const price = Number(basePrice) + (i === 1 ? 0.20 : (i === 2 ? 0.45 : 0));
              return (
                <div key={variant} style={{ ...styles.statCard, padding: '20px' }}>
                  <div style={{ ...styles.statIconBox, backgroundColor: 'var(--bg-active)', color: '#6366F1', width: '40px', height: '40px' }}>
                    <Droplets size={20} />
                  </div>
                  <div>
                    <div style={styles.statLabel}>{selectedFuel} {variant}</div>
                    <div style={{ ...styles.statValue, fontSize: '18px' }}>R$ {price.toFixed(2).replace('.', ',')}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.chartCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={styles.cardTitle}>Evolução dos Custos (R$/L)</h3>
              <div style={styles.statusBadgeActive}>IA PREDICTIVE</div>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'Jan', value: 5.45 },
                  { name: 'Fev', value: 5.62 },
                  { name: 'Mar', value: 5.58 },
                  { name: 'Abr', value: 5.89 },
                ]}>
                  <defs>
                    <linearGradient id="fuelTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} fill="url(#fuelTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={styles.sidebarCol}>
          <div style={styles.chartCard}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Brain size={20} color="#6366F1" />
                <h3 style={styles.cardTitle}>Insight Estratégico IA</h3>
             </div>
             <div style={{ backgroundColor: 'var(--bg-active)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '13px', color: '#4338CA', margin: 0, lineHeight: '1.6', fontWeight: '600' }}>
                  Tendência de queda detectada no diesel para a próxima semana na região Sudeste. 
                  Recomendamos reduzir abastecimentos imediatos em 20% para aproveitar o decréscimo projetado de 4.2%.
                </p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <div style={{ padding: '6px 12px', backgroundColor: '#FFF', borderRadius: '10px', fontSize: '10px', fontWeight: '800', color: '#6366F1' }}>ECONOMIA ESTIMADA: R$ 2.4k</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPIItem = ({ label, value, trend, trendUp, icon, variant = 'light', live }: { 
  label: string, value: any, trend?: string, trendUp?: boolean, icon: any, variant?: 'light' | 'solid', live?: boolean
}) => (
  <div style={styles.statCard}>
    <div style={{ 
      ...styles.statIconBox, 
      backgroundColor: variant === 'solid' ? '#6366F1' : 'var(--bg-active)', 
      color: variant === 'solid' ? '#FFFFFF' : '#6366F1' 
    }}>
      {React.cloneElement(icon as React.ReactElement, { size: 20 })}
    </div>
    <div style={styles.statContent}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <p style={styles.statLabel}>{label}</p>
        {live && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981' }}></div>}
      </div>
      <h3 style={styles.statValue}>{value}</h3>
      {trend && (
        <div style={{ ...styles.statTrend, color: trendUp ? '#10B981' : '#F43F5E', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {trend}
        </div>
      )}
    </div>
  </div>
);

const LogisticsDashboard: React.FC<{ 
  stats: any, 
  fuelPrices: any[], 
  deliveryActions: any[], 
  refresh: () => void 
}> = ({ stats, fuelPrices, deliveryActions, refresh }) => {
  const navigate = useNavigate();
  const roiData = [
    { name: 'Sem 1', savings: 4500 },
    { name: 'Sem 2', savings: 5200 },
    { name: 'Sem 3', savings: 6100 },
    { name: 'Sem 4', savings: 7800 },
  ];

  const modules = [
    { id: 'controle', label: 'Torre de Controle', icon: Activity, sub: 'Monitoramento real-time' },
    { id: 'destinos', label: 'Central de Destinos', icon: MapPin, sub: 'Gestão de CDs e bases' },
    { id: 'frotas', label: 'Frotas & Agregados', icon: Users, sub: 'Gestão de motoristas' },
    { id: 'rotas', label: 'Sequenciamento', icon: Layers, sub: 'Otimização de baú' },
    { id: 'autonomo', label: 'Controle Autônomo', icon: ShieldAlert, sub: 'Gestão de exceções' },
    { id: 'estrategia', label: 'Inteligência Estratégica', icon: Zap, sub: 'Análise de ROI e IA' },
    { id: 'combustivel', label: 'Central de Combustível', icon: Fuel, sub: 'Preços e custos' },
  ];

  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <div style={{ ...styles.iconBox, backgroundColor: '#0F172A' }}><Box size={24} color="#FFF" /></div>
          <div>
            <h1 style={styles.pageTitle}>Logístico</h1>
            <p style={styles.pageSub}>Visão geral do ecossistema e performance da malha.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button 
            style={{ ...styles.refreshBtn, width: 'auto', padding: '0 20px', backgroundColor: '#6366F1', color: '#FFF', border: 'none', fontWeight: '800', fontSize: '13px' }}
            onClick={() => navigate('/master/logistica/combustivel')}
          >
            <Fuel size={18} style={{ marginRight: '8px' }} /> Central de Combustível
          </button>
          <button style={styles.refreshBtn} onClick={refresh}><RefreshCw size={18} /></button>
        </div>
      </header>

      <div style={styles.statsGrid}>
        <KPIItem label="Veículos Ativos" value={stats.active_vehicles} trend="+12%" trendUp={true} icon={<Car size={20} />} />
        <KPIItem label="Entregas Hoje" value={stats.total_routes} trend="+85" trendUp={true} icon={<Package size={20} />} variant="solid" />
        <KPIItem label="Alertas Ativos" value={stats.alerts_critical} trend="-2" trendUp={false} icon={<AlertTriangle size={20} />} />
        <KPIItem label="Combustível (Média)" value="R$ 5.89" trend="+1.2%" trendUp={false} icon={<Droplets size={20} />} variant="solid" />
      </div>

      <div style={styles.splitGrid}>
        {/* ... existing chart code ... */}
        <div style={styles.chartCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={styles.cardTitle}>Performance da Malha (Savings)</h3>
            <div style={styles.statusBadgeActive}>IA OTIMIZANDO</div>
          </div>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={roiData}>
                <defs>
                  <linearGradient id="dashSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94A3B8'}} />
                <Tooltip />
                <Area type="monotone" dataKey="savings" stroke="#6366F1" strokeWidth={3} fill="url(#dashSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <div style={{ ...styles.insightCard, flex: 1, backgroundColor: '#F8FAFC' }}>
               <h4 style={{ ...styles.insightTitle, fontSize: '12px' }}>Última Otimização</h4>
               <p style={{ ...styles.insightText, fontSize: '11px' }}>Consolidação de carga em SP gerou economia de R$ 420,00.</p>
            </div>
            <div style={{ ...styles.insightCard, flex: 1, backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }}>
               <h4 style={{ ...styles.insightTitle, fontSize: '12px', color: '#16A34A' }}>Guardian Status</h4>
               <p style={{ ...styles.insightText, fontSize: '11px', color: '#16A34A' }}>98% de entregas confirmadas autonomamente hoje.</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={styles.chartCard}>
            <h3 style={{ ...styles.cardTitle, marginBottom: '16px' }}>Módulos de Gestão</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {modules.map((mod, idx) => {
                const isSolid = idx % 2 === 1;
                return (
                  <button 
                    key={mod.id} 
                    style={styles.dashShortcut}
                    onClick={() => navigate(`/master/logistica/${mod.id}`)}
                  >
                    <div style={{ 
                      ...styles.dashShortcutIcon, 
                      backgroundColor: isSolid ? '#6366F1' : '#F5F3FF', 
                      color: isSolid ? '#FFFFFF' : '#6366F1' 
                    }}>
                      <mod.icon size={18} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={styles.dashShortcutLabel}>{mod.label}</div>
                      <div style={styles.dashShortcutSub}>{mod.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.chartCard}>
            <h3 style={{ ...styles.cardTitle, marginBottom: '16px' }}>Atividade do Cérebro</h3>
            <div style={styles.strategyList}>
               {deliveryActions.slice(0, 3).map(action => (
                 <div key={action.id} style={{ ...styles.strategyRow, padding: '12px' }}>
                    <div style={{...styles.strategyIcon, width: '28px', height: '28px', backgroundColor: '#F1F5F9'}}>
                       <Zap size={12} color="#6366F1" />
                    </div>
                    <div style={styles.strategyMain}>
                       <div style={{ fontSize: '12px', fontWeight: '700' }}>{action.status === 'confirmado' ? 'Entrega Validada' : 'Ação Autônoma'}</div>
                       <div style={{ fontSize: '10px', color: '#94A3B8' }}>Pedido {action.order_id}</div>
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#10B981' }}>+ROI</div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LogisticaHub: React.FC = () => {
  const { subPage } = useParams();
  const navigate = useNavigate();

  const [fuelPrices, setFuelPrices] = useState<any[]>([]);
  const [aggregates, setAggregates] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [deliveryActions, setDeliveryActions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_routes: 0, active_vehicles: 0, alerts_critical: 0 });

  const fetchOperationalData = async () => {
    try {
      const [fRes, aRes, eRes, dRes, routesRes, alertsRes] = await Promise.all([
        supabase.from('fuel_prices').select('*').order('type'),
        supabase.from('aggregates').select('*').order('score', { ascending: false }),
        supabase.from('delivery_exceptions').select('*').order('created_at', { ascending: false }),
        supabase.from('delivery_actions').select('*').order('created_at', { ascending: false }),
        supabase.from('routes').select('vehicle_id', { count: 'exact' }),
        supabase.from('alerts').select('id', { count: 'exact' }).eq('type', 'critical')
      ]);

      if (fRes.data) setFuelPrices(fRes.data);
      if (aRes.data) setAggregates(aRes.data);
      if (eRes.data) setExceptions(eRes.data);
      if (dRes.data) setDeliveryActions(dRes.data);
      
      setStats({
        total_routes: routesRes.count || 0,
        active_vehicles: routesRes.data ? new Set(routesRes.data.map((r: any) => r.vehicle_id)).size : 0,
        alerts_critical: alertsRes.count || 0
      });
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchOperationalData();
  }, []);

  const renderContent = () => {
    switch (subPage) {
      case 'controle': return <LogisticsMonitoring />;
      case 'destinos': return <LogisticsDestinations />;
      case 'frotas': return <LogisticsAggregates aggregates={aggregates} refresh={fetchOperationalData} />;
      case 'rotas': return <LogisticsSequence />;
      case 'autonomo': return <LogisticsExceptions exceptions={exceptions} refresh={fetchOperationalData} />;
      case 'estrategia': return <LogisticsIntelligence deliveryActions={deliveryActions} refresh={fetchOperationalData} />;
      case 'combustivel': return <LogisticsFuel fuelPrices={fuelPrices} refresh={fetchOperationalData} />;
      default: return <LogisticsDashboard stats={stats} fuelPrices={fuelPrices} deliveryActions={deliveryActions} refresh={fetchOperationalData} />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'finalizada': return { backgroundColor: '#ECFDF5', color: '#10B981', border: '1px solid #D1FAE5' };
      case 'problema': return { backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FEE2E2' };
      case 'atraso': return { backgroundColor: '#FFFBEB', color: '#F59E0B', border: '1px solid #FEF3C7' };
      default: return { backgroundColor: '#EEF2FF', color: 'var(--accent)', border: '1px solid #E0E7FF' };
    }
  };

  const BackButton: React.FC = () => {
    const navigate = useNavigate();
    return (
      <button 
        onClick={() => navigate('/master/logistica')}
        style={{
          border: '1px solid var(--border)',
          background: 'white',
          cursor: 'pointer',
          width: '40px',
          height: '40px',
          marginRight: '12px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          transition: 'all 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
        className="hover-scale"
      >
        <ArrowLeft size={20} />
      </button>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FBFBFE' }} className="animate-fade-in">
      {renderContent()}
    </div>
  );
};

const styles: Record<string, any> = {
  tabHeader: { 
    padding: '48px 40px 32px', 
    backgroundColor: 'transparent', 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px'
  },
  tabContainer: { 
    display: 'flex', 
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  tabBtn: { 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    gap: '16px', 
    padding: '24px', 
    border: '1px solid var(--border)', 
    borderRadius: '32px', 
    backgroundColor: '#FFF', 
    cursor: 'pointer', 
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '180px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
  },
  tabActive: { 
    borderColor: 'var(--accent)',
    backgroundColor: '#FFF', 
    boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04)',
    transform: 'translateY(-6px)'
  },
  tabIconBox: {
    width: '56px',
    height: '56px',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s'
  },
  tabLabel: { 
    fontSize: '13px', 
    fontWeight: '800', 
    color: 'var(--secondary)', 
    textAlign: 'center',
    lineHeight: '1.2',
    letterSpacing: '0.3px'
  },
  tabSubtitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    padding: '10px 24px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '20px',
    border: '1px solid var(--border)'
  },
  tabContent: { padding: '20px 40px 80px' },
  
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  titleWrapper: { display: 'flex', alignItems: 'center', gap: '20px' },
  iconBox: { width: '56px', height: '56px', backgroundColor: 'var(--accent)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: 'var(--secondary)', margin: 0, letterSpacing: '-1px' },
  pageSub: { fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '4px' },
  headerActions: { display: 'flex', gap: '16px', alignItems: 'center' },
  
  searchWrapper: { position: 'relative', width: '360px' },
  searchIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' },
  searchInput: { width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: '#FFF', fontSize: '15px', fontWeight: '600', color: 'var(--secondary)', outline: 'none', transition: 'all 0.2s' },
  
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' },
  statCard: { backgroundColor: 'white', padding: '28px', borderRadius: '32px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  statIconBox: { width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' },
  statValue: { fontSize: '24px', fontWeight: '900', color: 'var(--secondary)', margin: 0 },
  
  mainLayout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' },
  viewContainer: { height: '640px', backgroundColor: '#FFF', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' },
  
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px 24px', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' },
  td: { padding: '24px', fontSize: '14px', borderBottom: '1px solid var(--bg-secondary)' },
  
  sidebarSection: { backgroundColor: '#FFF', padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  sidebarTitle: { fontSize: '18px', fontWeight: '800', color: 'var(--secondary)', marginBottom: '24px' },
  
  alertItem: { padding: '16px', borderLeft: '4px solid var(--border)', backgroundColor: 'var(--bg-secondary)', borderRadius: '0 16px 16px 0', marginBottom: '12px' },
  
  dashShortcut: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '20px', 
    padding: '24px', 
    backgroundColor: '#FFF', 
    borderRadius: '32px', 
    border: '1px solid var(--border)', 
    cursor: 'pointer', 
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
    textAlign: 'left'
  },
  dashShortcutIcon: { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fuelIconBox: { width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fuelMain: { flex: 1 },
  fuelType: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', letterSpacing: '0.8px' },
  fuelPrice: { fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: '4px 0' },
  fuelVariation: { fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' },
  fuelImpact: { textAlign: 'right' },
  impactLabel: { fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  impactValue: { fontSize: '12px', fontWeight: '800', color: '#10B981', marginTop: '4px' },
  regionSelector: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#475569', fontSize: '13px', fontWeight: '700' },
  fuelOperationalGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' },
  fuelChartCard: { backgroundColor: 'white', padding: '32px', borderRadius: '28px', border: '1px solid var(--border)' },
  costCalculatorCard: { backgroundColor: 'var(--bg-secondary)', padding: '32px', borderRadius: '28px', border: '1px solid var(--border)' },
  calcRow: { marginBottom: '16px' },
  calcLabel: { fontSize: '12px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' },
  calcInput: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: '600', outline: 'none' },
  calcResult: { marginTop: '24px', padding: '20px', backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0' },
  resultValue: { fontSize: '22px', fontWeight: '800', color: '#6366F1', marginTop: '8px' },
  emptyFuel: { gridColumn: 'span 3', padding: '48px', textAlign: 'center', color: '#94A3B8', fontWeight: '600' },
  fuelShowcase: { display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px', marginBottom: '24px' },
  fuelPumpCard: { backgroundColor: '#0F172A', borderRadius: '28px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.22)' },
  fuelPumpDisplay: { backgroundColor: '#111827', borderRadius: '18px', padding: '18px', border: '1px solid rgba(148, 163, 184, 0.25)' },
  fuelPumpDisplayLabel: { color: '#94A3B8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' },
  fuelPumpDisplayValue: { color: '#F8FAFC', fontSize: '34px', fontWeight: '800', marginTop: '4px' },
  fuelPumpDisplaySub: { color: '#CBD5E1', fontSize: '12px', marginTop: '6px', fontWeight: '500' },
  fuelPumpBody: { backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' },
  fuelPumpLine: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '10px 12px' },
  fuelPumpType: { fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px' },
  fuelPumpPrice: { fontSize: '16px', color: '#0F172A' },
  fuelSummaryList: { backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  fuelSummaryRow: { display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--border)', borderRadius: '14px', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)' },
  fuelSummaryDot: { width: '10px', height: '10px', borderRadius: '50%' },
  fuelSummaryInfo: { display: 'flex', flexDirection: 'column', flex: 1 },
  fuelSummaryLabel: { fontSize: '12px', fontWeight: '700', color: '#334155' },
  fuelSummaryPrice: { fontSize: '14px', fontWeight: '800', color: '#0F172A' },
  fuelSummaryVariation: { fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' },
  
  // New Component Styles
  scoreRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  loadingPlanContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
  loadingStep: { display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' },
  loadingIcon: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', color: '#6366F1' },
  loadingMain: { flex: 1 },
  loadingClient: { fontSize: '15px', fontWeight: '800', color: '#0F172A' },
  loadingZone: { fontSize: '12px', color: '#64748B', fontWeight: '600' },
  loadingMeta: { textAlign: 'right' },
  loadingDelivery: { fontSize: '13px', fontWeight: '800', color: '#10B981' },
  loadingAction: { fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }
};

export default LogisticaHub;
