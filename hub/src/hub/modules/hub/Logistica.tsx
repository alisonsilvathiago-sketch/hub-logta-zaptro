import React, { useState, useEffect } from 'react';
import {
  RefreshCw, Layers, Bell, Maximize2, Zap, Play, ShieldCheck, DollarSign, Brain, Lock, Box, Navigation, CheckCircle2, Droplets, TrendingDown, Fuel, ShieldAlert, Anchor, Repeat, FileCheck, Share2, LocateFixed, Users, MapPin, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, Map as MapIcon, Search, List, Car, MoreHorizontal, Package, Star, TrendingUp, ArrowLeft, QrCode, Plus, Terminal, Cpu
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Popup, ZoomControl
} from 'react-leaflet';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import HubMap, { truckIcon, Marker, Polyline, problemIcon, createCarIcon, createTruckIcon } from '../../components/HubMap';
import AIInsightBanner from '../../components/AIInsightBanner';
import { systemRequest } from '../../lib/systemFeedback';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@core/lib/supabase';
import { useAuth } from '@core/context/AuthContext';
import { toastSuccess, toastError, toastInfo, toastLoading, toastDismiss } from '@core/lib/toast';
import Pagination from '@shared/components/Pagination';
import { FuelPump } from '@shared/components/FuelIntelligence';
import Button from '@shared/components/Button';
import { useLocation } from 'react-router-dom';
import Kbd from '@shared/components/Kbd';
import { getPlatform } from '@core/lib/platform';

// --- SHARED COMPONENTS ---
const InsightBanner: React.FC<{ message: string; subValue?: string; icon?: React.ReactNode }> = ({ message, subValue, icon }) => (
  <div style={styles.insightBanner}>
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      {icon || <Brain size={24} color="#7C3AED" />}
      <div style={{ flex: 1 }}>
        <p style={styles.insightBannerText}>{message}</p>
        {subValue && (
          <div style={styles.insightBannerBadge}>{subValue}</div>
        )}
      </div>
    </div>
  </div>
);

const KPIItem: React.FC<{ label: string; value: any; trend?: string; trendUp?: boolean; icon: React.ReactNode; color?: string }> = ({ label, value, trend, trendUp, icon, color }) => (
  <div style={styles.statCard}>
    <div style={{...styles.statIconBox, backgroundColor: color ? `${color}15` : 'rgba(99, 102, 241, 0.1)', color: color || 'var(--accent)'}}>
      {icon}
    </div>
    <div style={styles.statContent}>
      <p style={styles.statLabel}>{label}</p>
      <h3 style={styles.statValue}>{value}</h3>
      {trend && (
        <span style={{...styles.statTrend, color: trendUp ? '#10B981' : '#EF4444'}}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
    </div>
  </div>
);

const BackButton: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Button 
      variant="secondary" 
      icon={<ArrowLeft size={20} />} 
      onClick={() => navigate('/master/logistica')} 
      style={{ width: '48px', height: '48px', borderRadius: '14px', padding: 0 }}
    />
  );
};

const normalizeHeading = (value: unknown): number | null => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return ((n % 360) + 360) % 360;
};

const getTrackingHeading = (asset: any): number => {
  const candidates = [
    asset?.heading,
    asset?.bearing,
    asset?.direction,
    asset?.course,
    asset?.metadata?.heading,
    asset?.metadata?.bearing,
    asset?.metadata?.direction,
    asset?.metadata?.course,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeHeading(candidate);
    if (normalized !== null) return normalized;
  }

  return 0;
};

const isCarLikeAsset = (asset: any): boolean => {
  const rawType = String(asset?.type || asset?.vehicle_type || asset?.metadata?.vehicle_type || '').toLowerCase();
  return ['van', 'car', 'carro', 'fiorino', 'utilitario', 'utilitário', 'pickup'].some((token) =>
    rawType.includes(token)
  );
};

// --- MODULES ---

const LogisticsMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const platform = getPlatform();
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

  const filteredRoutes = routes.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      r.driver?.nome?.toLowerCase().includes(searchLower) ||
      r.vehicle?.plate?.toLowerCase().includes(searchLower) ||
      r.company?.name?.toLowerCase().includes(searchLower);

    const activeTabUpper = (activeFilterTab || 'ALL').toUpperCase();
    if (activeTabUpper === 'ALL' || activeTabUpper === 'TUDO') return matchesSearch;
    if (activeTabUpper === 'PROBLEMAS') return matchesSearch && (r.status === 'problema' || r.status === 'atraso');
    
    return matchesSearch && (r.company?.origin || '').toUpperCase() === activeTabUpper;
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
              placeholder="Buscar por Motorista, Placa ou Empresa..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="secondary" 
            icon={<RefreshCw size={18} />} 
            onClick={fetchData} 
            style={{ width: '48px', height: '48px', padding: 0 }}
          />
          <Button 
            variant="danger" 
            icon={<Bell size={18} />} 
            label={stats.alerts_critical.toString()} 
            style={{ minWidth: '48px', height: '48px' }}
          />
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
              <Button 
                variant={viewMode === 'map' ? 'primary' : 'ghost'} 
                size="sm" 
                icon={<MapIcon size={18} />} 
                label={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Mapa</span>
                    <Kbd style={{ fontSize: '9px', opacity: 0.6, background: viewMode === 'map' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', color: viewMode === 'map' ? '#FFF' : '#64748B', border: 'none' }}>1</Kbd>
                  </div>
                } 
                onClick={() => setViewMode('map')} 
                style={{ 
                  backgroundColor: viewMode === 'map' ? '#0F172A' : 'transparent', 
                  color: viewMode === 'map' ? '#FFF' : '#94A3B8',
                  borderRadius: '10px'
                }} 
              />
              <Button 
                variant={viewMode === 'list' ? 'primary' : 'ghost'} 
                size="sm" 
                icon={<List size={18} />} 
                label={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Lista</span>
                    <Kbd style={{ fontSize: '9px', opacity: 0.6, background: viewMode === 'list' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', color: viewMode === 'list' ? '#FFF' : '#64748B', border: 'none' }}>2</Kbd>
                  </div>
                } 
                onClick={() => setViewMode('list')} 
                style={{ 
                  backgroundColor: viewMode === 'list' ? '#0F172A' : 'transparent', 
                  color: viewMode === 'list' ? '#FFF' : '#94A3B8',
                  borderRadius: '10px'
                }} 
              />
            </div>
          </div>

          <div style={styles.viewContainer}>
            {viewMode === 'map' ? (
              <div style={styles.mapWrapper}>
                <HubMap center={[-23.5505, -46.6333] as any} zoom={13} zoomControl={false}>
                  <ZoomControl position="bottomright" />
                  {trackingData.map(v => {
                    const heading = getTrackingHeading(v);
                    const icon = v.status === 'problema'
                      ? problemIcon
                      : (isCarLikeAsset(v) ? createCarIcon(heading) : createTruckIcon(heading));

                    const isValidPos = typeof v.lat === 'number' && typeof v.lng === 'number';
                    if (!isValidPos) return null;

                    return (
                      <Marker key={v.id} position={[v.lat, v.lng] as any} icon={icon}>
                        <Popup>
                          <div style={styles.popupContainer}>
                            <h4 style={styles.popupTitle}>{v.asset_name || 'Equipamento'}</h4>
                            <p style={styles.popupSub}>{(v.company?.name || 'Geral')} • {v.product_source || 'HUB'}</p>
                            <div style={{ ...styles.statusTag, backgroundColor: v.status === 'problema' ? '#FEE2E2' : '#D1FAE5' }}>
                              {(v.status || '').toUpperCase() || 'OFFLINE'}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              label="Ver Detalhes" 
                              onClick={() => navigate(`/master/clientes?id=${v.id}`)} 
                              style={{ marginTop: '12px', width: '100%', fontSize: '11px' }}
                            />
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
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
                      <th style={{...styles.th, textAlign: 'right'}}>AÇÕES</th>
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
                          <div style={{ ...styles.statusBadge, backgroundColor: r.status === 'problema' ? '#FEF2F2' : '#F0FDF4', color: r.status === 'problema' ? '#EF4444' : '#10B981' }}>{(r.status || '').toUpperCase() || 'PENDENTE'}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.timeInfo}>
                            <RefreshCw size={14} />
                            <span>{r.created_at ? new Date(r.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                          </div>
                        </td>
                        <td style={{...styles.td, textAlign: 'right'}}>
                          <Button variant="ghost" icon={<MoreHorizontal size={18} />} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination currentPage={currentPage} totalItems={totalCount} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={(val) => {setItemsPerPage(val); setCurrentPage(1);}} />
              </div>
            )}
          </div>
        </div>

        <aside style={styles.sidebarCol}>
          <div style={styles.sidebarSection}>
            <h3 style={styles.sidebarTitle}>Alertas Críticos</h3>
            <div style={styles.alertList}>
              {alerts.map((a, i) => (
                <div key={i} style={{ ...styles.alertItem, borderLeft: `4px solid ${a.type === 'critical' ? '#EF4444' : '#F59E0B'}` }}>
                  <span style={styles.alertTime}>{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <h4 style={styles.alertTitle}>{a.title}</h4>
                  <p style={styles.alertMsg}>{a.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.sidebarSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={styles.sidebarTitle}>Insights IA</h3>
              <Button 
                variant="primary" 
                size="sm" 
                icon={<Zap size={14} />} 
                label="RODAR AI" 
                onClick={handleRunOptimizer}
              />
            </div>
            {optimizations.map((opt, i) => (
              <div key={i} style={styles.aiCard}>
                <div style={{...styles.autoIconBox, backgroundColor: '#F1F5F9', color: 'var(--accent)', width: '40px', height: '40px'}}>
                   <Zap size={18} />
                </div>
                <div>
                  <p style={styles.aiText}><strong>{opt.title}:</strong> {opt.suggestion}</p>
                  <div style={styles.aiImpactBadge}>Impacto: {opt.impact}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
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
          <div style={{...styles.iconBox, backgroundColor: '#0F172A'}}><List size={24} color="#FFF" /></div>
          <div>
            <h1 style={styles.pageTitle}>Sequenciamento & Plano de Carregamento</h1>
            <p style={styles.pageSub}>Otimização de ordem de entrega e lógica LIFO (Last-In, First-Out).</p>
          </div>
        </div>
        <div style={styles.headerActions}>
           <div style={styles.selectWrapper}>
             <select style={styles.calcInput} value={activeRoute} onChange={e => setActiveRoute(e.target.value)}>
                <option>Rota #882</option>
                <option>Rota #885</option>
                <option>Rota #890</option>
             </select>
           </div>
           <Button variant="primary" icon={<RefreshCw size={18} />} label="RECALCULAR" />
        </div>
      </header>

      <div style={styles.mainLayout}>
        <div style={styles.contentCol}>
          <div style={styles.chartCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
               <h3 style={styles.cardTitle}>Plano de Carregamento (Ordem Reversa)</h3>
               <div style={styles.statusBadgeActive}>LÓGICA LIFO ATIVA</div>
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
            
            <div style={{ marginTop: '32px' }}>
              <Button 
                 variant="primary" 
                 fullWidth 
                 icon={<QrCode size={18} />}
                 label="GERAR QR CODES DE CARREGAMENTO" 
              />
            </div>
          </div>
        </div>

        <aside style={styles.sidebarCol}>
           <div style={styles.sidebarSection}>
              <h3 style={styles.sidebarTitle}>Navegação GPS</h3>
              <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px', lineHeight: '1.5' }}>Enviar link de navegação inteligente para o motorista no Zaptro.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button 
                    variant="primary" 
                    fullWidth 
                    icon={<Share2 size={16} />} 
                    label="ENVIAR P/ ZAPTRO" 
                />
                <Button 
                    variant="secondary" 
                    fullWidth 
                    icon={<LocateFixed size={16} />} 
                    label="ABRIR GOOGLE MAPS" 
                />
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
};

const LogisticsFuel: React.FC<{ fuelPrices: any[], refresh: () => void }> = ({ fuelPrices, refresh }) => {
  const [selectedFuel, setSelectedFuel] = useState('Gasolina');

  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div 
            style={{...styles.iconBox, backgroundColor: '#EF4444', cursor: 'pointer'}} 
            onClick={() => window.open('/combustivel', '_blank')}
            title="Ver Página Pública de Combustível"
          >
            <Fuel size={24} color="#FFF" />
          </div>
          <div>
            <h1 style={styles.pageTitle}>Inteligência de Combustível</h1>
            <p style={styles.pageSub}>Monitoramento analítico da malha energética e impactos no ROI.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" icon={<RefreshCw size={18} />} onClick={refresh} style={{ width: '48px', height: '48px', padding: 0 }} />
          <Button variant="primary" icon={<Plus size={18} />} label="NOVO REGISTRO" />
        </div>
      </header>

      <InsightBanner 
        message="Tendência de queda detectada no diesel para a próxima semana na região Sudeste. Recomendamos reduzir abastecimentos imediatos em 20% para aproveitar o decréscimo projetado de 4.2%."
        subValue="ECONOMIA ESTIMADA: R$ 2.4k"
        icon={<Brain size={24} color="#7C3AED" />}
      />

      <div style={styles.filterBar}>
        {['Gasolina', 'Etanol', 'Diesel', 'GNV'].map(f => (
          <Button 
            key={f} 
            variant={selectedFuel === f ? 'primary' : 'secondary'}
            label={f.toUpperCase()}
            onClick={() => setSelectedFuel(f)}
          />
        ))}
      </div>

      <div style={styles.statsGrid}>
        <KPIItem label="Média Nacional" value="R$ 5,89" trend="+1.2%" trendUp={false} icon={<TrendingUp size={20} />} color="#EF4444" />
        <KPIItem label="Economia IA" value="R$ 12k/mês" trend="ATIVO" trendUp={true} icon={<Brain size={20} />} color="#7C3AED" />
        <KPIItem label="Postos ANP" value="14.200" trend="SYNC" trendUp={true} icon={<ShieldCheck size={20} />} color="#10B981" />
        <KPIItem label="Meta ROI" value="R$ 5,45" trend="OTIMIZADO" trendUp={true} icon={<Zap size={20} />} color="#F59E0B" />
      </div>

      <div style={styles.viewContainer}>
        <div style={styles.chartHeader}>
           <h3 style={styles.cardTitle}>Variação de Preços (30 dias)</h3>
           <div style={styles.aiStatusBadge}>MONITORAMENTO ANP EM TEMPO REAL</div>
        </div>
        <div style={{ height: '400px', padding: '32px' }}>
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                 { day: '01/04', price: 5.82 },
                 { day: '08/04', price: 5.85 },
                 { day: '15/04', price: 5.92 },
                 { day: '22/04', price: 5.89 },
                 { day: '30/04', price: 5.87 },
              ]}>
                 <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                       <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                 <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94A3B8'}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94A3B8'}} domain={['dataMin - 0.1', 'dataMax + 0.1']} />
                 <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                 <Area type="monotone" dataKey="price" stroke="#EF4444" strokeWidth={3} fill="url(#colorPrice)" />
              </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const LogisticsDestinations: React.FC = () => {
  const destinos = [
    { id: 1, name: 'Sede Central - SP', status: 'Ativo', shipments: 45, efficiency: '98%' },
    { id: 2, name: 'Filial Sul - RS', status: 'Ativo', shipments: 22, efficiency: '95%' },
    { id: 3, name: 'CD - RJ', status: 'Em Manutenção', shipments: 0, efficiency: '0%' },
    { id: 4, name: 'Hub Nordeste - PE', status: 'Ativo', shipments: 18, efficiency: '92%' },
  ];

  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div style={{...styles.iconBox, backgroundColor: '#6366F1'}}><MapPin size={24} color="#FFF" /></div>
          <div>
            <h1 style={styles.pageTitle}>Centros & Destinos de Operação</h1>
            <p style={styles.pageSub}>Gerenciamento estratégico de pontos de entrega e CDs.</p>
          </div>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} label="NOVO DESTINO" />
      </header>

      <div style={styles.healthGrid}>
        {destinos.map(destino => (
          <div key={destino.id} style={styles.serviceCard}>
            <div style={styles.svcHeader}>
              <div style={styles.svcIcon}><MapPin size={20} /></div>
              <div style={{...styles.svcStatus, color: destino.status === 'Ativo' ? '#10B981' : '#EF4444'}}>
                <div style={{...styles.statusDot, backgroundColor: destino.status === 'Ativo' ? '#10B981' : '#EF4444'}} />
                {destino.status.toUpperCase()}
              </div>
            </div>
            <h4 style={styles.svcName}>{destino.name}</h4>
            <div style={styles.svcMetrics}>
               <div style={styles.svcMetric}>
                  <span style={styles.metricLabel}>Envios</span>
                  <span style={styles.metricValue}>{destino.shipments}</span>
               </div>
               <div style={styles.svcMetric}>
                  <span style={styles.metricLabel}>Eficiência</span>
                  <span style={{...styles.metricValue, color: '#10B981'}}>{destino.efficiency}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LogisticsIntelligence: React.FC<{ deliveryActions: any[], refresh: () => void }> = ({ deliveryActions, refresh }) => {
  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div style={{...styles.iconBox, backgroundColor: '#7C3AED'}}><Brain size={24} color="#FFF" /></div>
          <div>
            <h1 style={styles.pageTitle}>Cérebro de Inteligência Logística</h1>
            <p style={styles.pageSub}>Análise de ROI autônomo e performance da malha logística.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
           <div style={styles.statusBadgeActive}><Activity size={14} color="#10B981" /> CÉREBRO ATIVO</div>
           <Button variant="secondary" icon={<RefreshCw size={18} />} onClick={refresh} style={{ width: '48px', height: '48px', padding: 0 }} />
        </div>
      </header>

      <div style={styles.statsGrid}>
        <KPIItem label="Economia ROI" value="R$ 23.640" trend="+18.4%" trendUp={true} icon={<DollarSign size={24} />} color="#10B981" />
        <KPIItem label="Risco (Guardian)" value="92%" trend="+5.2%" trendUp={true} icon={<ShieldCheck size={24} />} color="#6366F1" />
        <KPIItem label="Compliance Frota" value="98.4%" trend="+0.8%" trendUp={true} icon={<Users size={24} />} color="#F59E0B" />
        <KPIItem label="Produtividade IA" value="14.2x" trend="+2.1x" trendUp={true} icon={<Zap size={24} />} color="#D9FF00" />
      </div>

      <div style={styles.mainLayout}>
        <div style={styles.contentCol}>
           <div style={styles.chartCard}>
              <h3 style={styles.cardTitle}>Evolução de Eficiência Logística</h3>
              <div style={{ height: '300px', marginTop: '24px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Jan', savings: 4500 },
                    { name: 'Fev', savings: 5200 },
                    { name: 'Mar', savings: 6100 },
                    { name: 'Abr', savings: 7800 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94A3B8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94A3B8'}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="savings" stroke="#7C3AED" strokeWidth={3} fill="rgba(124, 58, 237, 0.05)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
        <aside style={styles.sidebarCol}>
           <div style={styles.sidebarSection}>
              <h3 style={styles.sidebarTitle}>Log de Estratégias</h3>
              <div style={styles.strategyList}>
                 {deliveryActions.map((action, i) => (
                   <div key={i} style={styles.strategyRow}>
                      <div style={{...styles.strategyIcon, backgroundColor: '#F8FAFC', color: 'var(--accent)', width: '32px', height: '32px'}}>
                         <Zap size={14} />
                      </div>
                      <div style={{ flex: 1 }}>
                         <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Fulfillment: {action.status.toUpperCase()}</div>
                         <div style={{ fontSize: '11px', color: '#64748B' }}>Pedido {action.order_id}</div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </aside>
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
          <div style={{...styles.iconBox, backgroundColor: '#F59E0B'}}><Users size={24} color="#FFF" /></div>
          <div>
            <h1 style={styles.pageTitle}>Frota de Agregados & Parceiros</h1>
            <p style={styles.pageSub}>Gestão de terceiros, performance e score de confiabilidade.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
           <Button variant="secondary" icon={<RefreshCw size={18} />} onClick={refresh} style={{ width: '48px', height: '48px', padding: 0 }} />
           <Button variant="primary" icon={<Plus size={18} />} label="NOVO AGREGADO" />
        </div>
      </header>

      <div style={styles.statsGrid}>
        <KPIItem label="Agregados Ativos" value={aggregates.filter(a => a.status === 'ativo').length.toString()} icon={<Users size={20} />} color="#6366F1" />
        <KPIItem label="Score Médio" value="4.82" icon={<Star size={20} />} color="#F59E0B" />
        <KPIItem label="Total Pagamentos" value="R$ 142k" icon={<DollarSign size={20} />} color="#10B981" />
      </div>

      <div style={styles.logTableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>AGREGADO</th>
              <th style={styles.th}>VEÍCULO / PLACA</th>
              <th style={styles.th}>PERFORMANCE</th>
              <th style={styles.th}>GANHOS</th>
              <th style={styles.th}>STATUS</th>
              <th style={{...styles.th, textAlign: 'right'}}>AÇÕES</th>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <strong>{agg.score}</strong>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>({agg.total_deliveries} ent.)</span>
                  </div>
                </td>
                <td style={styles.td}>
                  <strong style={{ color: '#10B981' }}>R$ {Number(agg.total_earnings).toLocaleString()}</strong>
                </td>
                <td style={styles.td}>
                  <div style={{ ...styles.statusBadge, backgroundColor: agg.status === 'ativo' ? '#F0FDF4' : '#FEF2F2', color: agg.status === 'ativo' ? '#10B981' : '#EF4444' }}>
                    {agg.status.toUpperCase()}
                  </div>
                </td>
                <td style={{...styles.td, textAlign: 'right'}}>
                  <Button variant="ghost" icon={<MoreHorizontal size={18} />} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          <div style={{...styles.iconBox, backgroundColor: '#EF4444'}}><ShieldAlert size={24} color="#FFF" /></div>
          <div>
            <h1 style={styles.pageTitle}>Controle de Exceções Autônomo</h1>
            <p style={styles.pageSub}>Detecção e resolução automática de falhas operacionais.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
           <Button variant="secondary" icon={<RefreshCw size={18} />} onClick={refresh} style={{ width: '48px', height: '48px', padding: 0 }} />
           <div style={styles.statusBadgeActive}><ShieldCheck size={14} /> MONITORAMENTO ATIVO</div>
        </div>
      </header>

      <div style={styles.statsGrid}>
         <KPIItem label="Exceções Ativas" value={exceptions.length.toString()} trend="Crítico" trendUp={false} icon={<ShieldAlert size={20} />} color="#EF4444" />
         <KPIItem label="Taxa Confirmação" value="94.2%" trend="+2.1%" trendUp={true} icon={<FileCheck size={20} />} color="#10B981" />
         <KPIItem label="Resolvido c/ IA" value="88%" trend="+5%" trendUp={true} icon={<Zap size={20} />} color="#6366F1" />
         <KPIItem label="Economia Perda" value="R$ 4.250" icon={<DollarSign size={20} />} color="#10B981" />
      </div>

      <div style={styles.logTableContainer}>
         <table style={styles.table}>
            <thead>
               <tr>
                  <th style={styles.th}>EVENTO</th>
                  <th style={styles.th}>PRIORIDADE</th>
                  <th style={styles.th}>PEDIDO / STATUS</th>
                  <th style={styles.th}>DATA / HORA</th>
                  <th style={{...styles.th, textAlign: 'right'}}>AÇÕES</th>
               </tr>
            </thead>
            <tbody>
               {exceptions.map(item => (
                 <tr key={item.id} style={styles.tr}>
                    <td style={styles.td}>
                       <div style={{ fontWeight: '800', color: '#0F172A' }}>{item.type}</div>
                       <div style={{ fontSize: '12px', color: '#64748B' }}>{item.description || 'Falha detectada'}</div>
                    </td>
                    <td style={styles.td}>
                       <span style={{ fontSize: '10px', fontWeight: '900', padding: '4px 8px', borderRadius: '6px', backgroundColor: item.priority === 'Alta' ? '#EF4444' : '#F1F5F9', color: item.priority === 'Alta' ? '#FFF' : '#64748B' }}>
                          {item.priority.toUpperCase()}
                       </span>
                    </td>
                    <td style={styles.td}>
                       <div style={{ fontWeight: '700' }}>#{item.order_id}</div>
                       <div style={{ fontSize: '11px', color: 'var(--accent)' }}>Aguardando IA</div>
                    </td>
                    <td style={styles.td}>{new Date(item.created_at).toLocaleString()}</td>
                    <td style={{...styles.td, textAlign: 'right'}}>
                       <Button variant="ghost" icon={<Maximize2 size={16} />} />
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

// --- NAVIGATION TABS ---


const LogisticsDashboard: React.FC<{ stats: any; fuelPrices: any[]; deliveryActions: any[]; refresh: () => void }> = ({ stats, fuelPrices, deliveryActions, refresh }) => {
  const navigate = useNavigate();
  
  const navItems = [
    { id: 'navigator', label: 'Navigator AI', desc: 'Otimizar todas as rotas', icon: <Activity size={24} />, color: '#6366F1' },
    { id: 'guardian', label: 'Guardian', desc: 'Alertas de no-show', icon: <ShieldCheck size={24} />, color: '#EF4444' },
    { id: 'scout', label: 'Talent Scout AI', desc: 'Sincronizar telemetria', icon: <Users size={24} />, color: '#F59E0B' },
    { id: 'fuel', label: 'Combustível', desc: 'Gestão de preços', icon: <Fuel size={24} />, color: '#10B981' },
    { id: 'auditor', label: 'Auditor', desc: 'Validar faturas', icon: <Terminal size={24} />, color: '#8B5CF6' },
    { id: 'sequenciamento', label: 'Sequenciamento', desc: 'Fila de carregamento', icon: <List size={24} />, color: '#EC4899' },
  ];

  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <div style={styles.iconBox}><Layers size={24} color="#FFF" /></div>
          <div>
            <h1 style={styles.pageTitle}>Logistics Master Hub</h1>
            <p style={styles.pageSub}>Comando central de operações autônomas e malha logística.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
           <div style={styles.statusBadgeActive}>
              <div style={styles.statusDot} />
              MOTOR AI ATIVO
           </div>
           <Button variant="secondary" icon={<RefreshCw size={18} />} onClick={refresh} style={{ width: '48px', height: '48px', padding: 0 }} />
        </div>
      </header>

      {/* AI INSIGHT BANNER */}
      <AIInsightBanner 
        type="ai"
        title="Otimização detectada em São Paulo"
        description="A consolidação de 12 rotas pode reduzir o consumo de combustível em 14% nas próximas 24 horas."
        badge="ROI: R$ 2.4k / dia"
        actionLabel="Executar Re-Sequenciamento"
        href="/master/logistica/sequenciamento"
      />

      {/* TOP KPI CARDS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: '#6366F115', color: '#6366F1'}}><List size={24} /></div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Total Rotas</p>
            <h3 style={styles.statValue}>{stats.total_routes}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: '#10B98115', color: '#10B981'}}><Car size={24} /></div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Ativos Online</p>
            <h3 style={styles.statValue}>{stats.active_vehicles}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: '#EF444415', color: '#EF4444'}}><ShieldAlert size={24} /></div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Alertas Críticos</p>
            <h3 style={styles.statValue}>{stats.alerts_critical}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: '#F59E0B15', color: '#F59E0B'}}><TrendingUp size={24} /></div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Economia (ROI)</p>
            <h3 style={styles.statValue}>R$ 142k</h3>
          </div>
        </div>
      </div>

      {/* MAIN INTERACTIVE SECTION */}
      <div style={styles.mainLayout}>
        {/* LEFT: MASTER MAP */}
        <div style={styles.mapCard}>
          <div style={styles.mapHeader}>
            <h3 style={styles.cardTitle}>Visualização em Tempo Real</h3>
            <div style={styles.liveTag}><div style={styles.liveDot} /> LIVE FEED</div>
          </div>
          <div style={{ position: 'relative', height: '500px', borderRadius: '24px', overflow: 'hidden' }}>
            {/* FLOATING MAP OVERLAY */}
            <div style={styles.mapFloatingBadge}>
              <div style={styles.badgePulseDot} />
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', letterSpacing: '0.5px' }}>ROTAS DE HOJE</span>
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>{stats.total_routes}</span>
            </div>
            <HubMap variant="light" center={[-23.5505, -46.6333]} zoom={12}>
              {/* SAMPLE ROUTE LINE */}
              <Polyline 
                positions={[[-23.5505, -46.6333], [-23.5595, -46.6433], [-23.5705, -46.6633]]} 
                color="#6366F1" 
                weight={3} 
                opacity={0.6} 
                dashArray="8, 8"
              />
              <Marker position={[-23.5505, -46.6333]} icon={truckIcon} />
              <Marker position={[-23.5595, -46.6433]} icon={truckIcon} />
              <Marker position={[-23.5405, -46.6233]} icon={truckIcon} />
              <Marker position={[-23.5605, -46.6533]} icon={truckIcon} />
            </HubMap>
          </div>
        </div>

        {/* RIGHT: NAVIGATION CARDS */}
        <div style={styles.navColumn}>
          <h3 style={{...styles.cardTitle, marginBottom: '24px'}}>Módulos AI</h3>
          <div style={styles.navGrid}>
            {navItems.map(item => (
              <button 
                key={item.id} 
                style={styles.navCard} 
                onClick={() => navigate(`/master/logistica/${item.id}`)}
              >
                <div style={{...styles.navIconBox, backgroundColor: `${item.color}15`, color: item.color}}>
                  {item.icon}
                </div>
                <div>
                  <div style={styles.navLabel}>{item.label}</div>
                  <div style={styles.navDesc}>{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM: SYSTEM HEALTH */}
      <section style={{ marginTop: '48px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Cpu size={20} color="var(--accent)" /> SAÚDE DO MOTOR LOGÍSTICO
        </h3>
        <div style={styles.healthGrid}>
          {[
            { label: 'Carga do Cluster', value: '14.2%', color: '#10B981', status: 'Optimal' },
            { label: 'Latência AI', value: '42ms', color: '#6366F1', status: 'Fast' },
            { label: 'Memória Buffer', value: '1.2 GB', color: '#F59E0B', status: 'Healthy' },
            { label: 'Sync Status', value: '100%', color: '#10B981', status: 'Synced' }
          ].map((h, i) => (
            <div key={i} style={styles.serviceCard}>
              <div style={styles.svcHeader}>
                <span style={styles.metricLabel}>{h.label}</span>
                <div style={{...styles.svcStatus, color: h.color}}>
                  <div style={{...styles.statusDot, backgroundColor: h.color}} />
                  {h.status.toUpperCase()}
                </div>
              </div>
              <div style={{...styles.metricValue, color: '#0F172A', fontSize: '24px', marginTop: '8px'}}>{h.value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const LogisticaHub: React.FC = () => {
  const { subPage } = useParams();
  const [fuelPrices, setFuelPrices] = useState<any[]>([]);
  const [aggregates, setAggregates] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [deliveryActions, setDeliveryActions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_routes: 0, active_vehicles: 0, alerts_critical: 0 });

  const fetchData = async () => {
    await systemRequest(
      (async () => {
        const [fRes, aRes, eRes, dRes, rRes, alRes] = await Promise.all([
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
          total_routes: rRes.count || 0,
          active_vehicles: rRes.data ? new Set(rRes.data.map((r: any) => r.vehicle_id)).size : 0,
          alerts_critical: alRes.count || 0
        });
      })(),
      { 
        loadingMessage: 'Sincronizando malha logística...', 
        successMessage: 'Malha logística atualizada',
        id: 'sync-logistica-master'
      }
    );
  };

  useEffect(() => { fetchData(); }, []);

  const renderContent = () => {
    switch (subPage) {
      case 'navigator':
      case 'controle': return <LogisticsMonitoring />;
      case 'scout':
      case 'frotas': 
      case 'equipe': return <LogisticsAggregates aggregates={aggregates} refresh={fetchData} />;
      case 'rotas':
      case 'sequenciamento': return <LogisticsSequence />;
      case 'guardian':
      case 'autonomo': 
      case 'entregas': return <LogisticsExceptions exceptions={exceptions} refresh={fetchData} />;
      case 'auditor':
      case 'estrategia': 
      case 'auditoria': return <LogisticsIntelligence deliveryActions={deliveryActions} refresh={fetchData} />;
      case 'fuel':
      case 'combustivel': return <LogisticsFuel fuelPrices={fuelPrices} refresh={fetchData} />;
      default: return <LogisticsDashboard stats={stats} fuelPrices={fuelPrices} deliveryActions={deliveryActions} refresh={fetchData} />;
    }
  };

  const isIntelligencePage = [
    'navigator', 'controle', 'guardian', 'autonomo', 'entregas', 
    'scout', 'frotas', 'equipe', 'auditor', 'estrategia', 'auditoria',
    'fuel', 'combustivel', 'rotas', 'sequenciamento'
  ].includes(subPage || '');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FBFBFE' }}>
      {renderContent()}
    </div>
  );
};

const styles: Record<string, any> = {
  tabContent: { padding: '40px', maxWidth: '1600px', margin: '0 auto', width: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' },
  titleWrapper: { display: 'flex', alignItems: 'center', gap: '24px' },
  iconBox: { width: '64px', height: '64px', backgroundColor: 'var(--accent)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(99, 102, 241, 0.2)' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-1px' },
  pageSub: { fontSize: '15px', color: '#64748B', fontWeight: '500', marginTop: '4px' },
  headerActions: { display: 'flex', gap: '16px', alignItems: 'center' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', marginBottom: '48px' },
  statCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px', minHeight: '120px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  statIconBox: { width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statContent: { flex: 1 },
  statLabel: { fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  statValue: { fontSize: '24px', fontWeight: '900', color: '#0F172A', margin: 0 },
  statTrend: { fontSize: '12px', fontWeight: '700', marginTop: '4px' },

  mapFloatingBadge: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 1000,
    backgroundColor: 'white',
    padding: '12px 20px',
    borderRadius: '100px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    border: '1px solid #F1F5F9'
  },
  badgePulseDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#A7FF0A',
    boxShadow: '0 0 10px #A7FF0A'
  },

  insightBanner: { backgroundColor: '#F5F3FF', borderRadius: '32px', padding: '32px', marginBottom: '40px', border: '1px solid #DDD6FE', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.05)' },
  insightBannerText: { fontSize: '15px', color: '#5B21B6', fontWeight: '700', margin: 0, lineHeight: '1.6' },
  insightBannerBadge: { marginTop: '16px', backgroundColor: '#FFF', padding: '10px 18px', borderRadius: '14px', width: 'fit-content', fontSize: '11px', fontWeight: '900', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },

  filterBar: { display: 'flex', gap: '12px', marginBottom: '40px' },

  mainLayout: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' },
  contentCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  sidebarCol: { display: 'flex', flexDirection: 'column', gap: '32px' },
  sidebarSection: { backgroundColor: '#FFF', padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  sidebarTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '24px' },

  chartCard: { backgroundColor: '#FFF', padding: '40px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  cardTitle: { fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0 },
  
  loadingPlanContainer: { display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' },
  loadingStep: { display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', backgroundColor: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' },
  loadingIcon: { width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  loadingMain: { flex: 1 },
  loadingClient: { fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' },
  loadingZone: { fontSize: '13px', color: '#64748B', fontWeight: '600' },
  loadingMeta: { textAlign: 'right' },
  loadingDelivery: { fontSize: '12px', fontWeight: '800', color: 'var(--accent)', marginBottom: '4px' },
  loadingAction: { fontSize: '11px', fontWeight: '900', color: '#0F172A', textTransform: 'uppercase' },

  logTableContainer: { backgroundColor: '#FFF', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px 24px', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border)', backgroundColor: '#F8FAFC' },
  td: { padding: '20px 24px', fontSize: '14px', borderBottom: '1px solid #F1F5F9', color: '#334155' },
  tr: { transition: 'background-color 0.2s' },

  searchWrapper: { position: 'relative' },
  searchIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' },
  searchInput: { width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: '#FFF', fontSize: '14px', fontWeight: '600', outline: 'none' },

  selectWrapper: { position: 'relative', width: '200px' },
  calcInput: { width: '100%', padding: '14px 20px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: '#FFF', fontSize: '14px', fontWeight: '700', color: '#0F172A', outline: 'none', cursor: 'pointer', appearance: 'none' },

  statusBadgeActive: { padding: '8px 16px', backgroundColor: '#F0FDF4', color: '#166534', borderRadius: '20px', fontSize: '11px', fontWeight: '800', border: '1px solid #DCFCE7', display: 'flex', alignItems: 'center', gap: '8px' },
  aiStatusBadge: { padding: '8px 16px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)', borderRadius: '20px', fontSize: '11px', fontWeight: '800' },
  aiImpactBadge: { marginTop: '8px', fontSize: '11px', fontWeight: '800', color: '#10B981', backgroundColor: '#ECFDF5', padding: '4px 10px', borderRadius: '6px', width: 'fit-content' },
  
  dashShortcut: { display: 'flex', alignItems: 'center', gap: '24px', padding: '32px', backgroundColor: '#FFF', borderRadius: '32px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', textAlign: 'left' },
  dashShortcutIcon: { width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dashShortcutLabel: { fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' },
  dashShortcutSub: { fontSize: '14px', color: '#64748B', fontWeight: '500' },
  shortcutsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' },

  autoIconBox: { width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  aiCard: { display: 'flex', gap: '16px', padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0', marginBottom: '16px' },
  aiText: { fontSize: '13px', color: '#334155', lineHeight: '1.5', margin: 0 },
  
  viewContainer: { backgroundColor: '#FFF', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  chartHeader: { padding: '32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  
  mainLayout: { display: 'grid', gridTemplateColumns: '1fr 600px', gap: '32px', marginBottom: '48px' },
  mapCard: { backgroundColor: '#FFF', padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '24px' },
  mapHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  liveTag: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '800', color: '#EF4444', backgroundColor: '#FEF2F2', padding: '6px 12px', borderRadius: '20px' },
  liveDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' },
  
  navColumn: { display: 'flex', flexDirection: 'column' },
  navGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  navCard: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px', padding: '24px', backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', outline: 'none' },
  navIconBox: { width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '2px' },
  navDesc: { fontSize: '12px', color: '#64748B', fontWeight: '500' },

  healthGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' },
  serviceCard: { backgroundColor: '#FFF', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  svcHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  svcStatus: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
  metricLabel: { fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  metricValue: { fontSize: '24px', fontWeight: '800' }
};

export default LogisticaHub;
