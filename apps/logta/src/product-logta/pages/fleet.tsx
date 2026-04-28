import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Truck, Search, Filter, Plus, Shield, 
  Settings, Calendar, MapPin, Download,
  CheckCircle2, AlertCircle, TrendingUp, Activity,
  User, History as HistoryIcon, MoreVertical,
  Wrench, FileText, Fuel, Save, Layout, Eye,
  Navigation, Zap, ArrowUpRight, ArrowDownRight, Clock,
  ShieldCheck, BarChart3, AlertTriangle, Disc, Gauge, BarChart, ExternalLink,
  ChevronRight, Info, Map as MapIcon, RefreshCw, Car, TrendingDown, DollarSign,
  Droplets, ListFilter, SlidersHorizontal, ArrowDown, ArrowUp, CalendarClock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart as RechartsBarChart, Bar, Cell, LineChart, Line, Legend, PieChart, Pie
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import LogtaModal from '../../components/Modal';
import MetricCard from '../../components/MetricCard';
import ModuleLayout from '../../layouts/ModuleLayout';
import FleetMap from '../../components/FleetMap';

// --- Types ---
interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: string;
  status: 'OPERACIONAL' | 'OFICINA' | 'PARADO' | 'REVISAO';
  location: string;
  km: number;
  last_maintenance: string;
  driver?: string;
  fuel_efficiency: number; // km/L
  last_fueling: string;
  total_cost_mth: number;
  total_liters_mth: number;
}

interface Maintenance {
  id: string;
  vehicle_id: string;
  plate: string;
  model: string;
  type: 'PREVENTIVA' | 'CORRETIVA';
  description: string;
  date: string;
  km_at: number;
  status: 'CONCLUIDO' | 'PENDENTE' | 'ATRASADO' | 'EM_ANDAMENTO';
  cost: number;
  shop?: string;
}

interface Fueling {
  id: string;
  vehicle_id: string;
  plate: string;
  date: string;
  liters: number;
  value: number;
  km: number;
  consumption: number; 
  station?: string;
}

const Fleet: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();

  const activeTab = tab || 'veiculos';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelings, setFuelings] = useState<Fueling[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFuelingModalOpen, setIsFuelingModalOpen] = useState(false);
  const [isMntModalOpen, setIsMntModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedVehicleId, setFocusedVehicleId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      const mockVehicles: Vehicle[] = [
        { id: '1', plate: 'BRA-2E19', model: 'Scania R540 6x4', type: 'Pesado', status: 'OPERACIONAL', location: 'Rod. dos Bandeirantes', km: 124500, last_maintenance: '2026-03-15', driver: 'Claudio Ferreira', fuel_efficiency: 2.4, last_fueling: '22/04', total_cost_mth: 15400, total_liters_mth: 2600 },
        { id: '2', plate: 'LOG-4F20', model: 'Volvo FH 540', type: 'Pesado', status: 'OFICINA', location: 'Oficina Central', km: 89300, last_maintenance: '2026-04-20', driver: '-', fuel_efficiency: 2.1, last_fueling: '19/04', total_cost_mth: 12100, total_liters_mth: 2100 },
        { id: '3', plate: 'ABC-1234', model: 'Mercedes-Benz Actros', type: 'Pesado', status: 'OPERACIONAL', location: 'Porto de Santos', km: 210400, last_maintenance: '2026-02-10', driver: 'Marcos Souza', fuel_efficiency: 2.2, last_fueling: '21/04', total_cost_mth: 18900, total_liters_mth: 3200 },
        { id: '4', plate: 'KDT-9912', model: 'VW Constellation 24.280', type: 'Médio', status: 'REVISAO', location: 'Garagem Sul', km: 45600, last_maintenance: '2026-04-22', driver: 'José Lima', fuel_efficiency: 3.8, last_fueling: '20/04', total_cost_mth: 8500, total_liters_mth: 1400 },
        { id: '5', plate: 'ZAP-0081', model: 'Iveco Stralis', type: 'Pesado', status: 'PARADO', location: 'Base Principal', km: 320000, last_maintenance: '2025-12-20', driver: '-', fuel_efficiency: 1.9, last_fueling: '10/04', total_cost_mth: 24000, total_liters_mth: 4100 },
      ];
      setVehicles(mockVehicles);

      const mockFuelings: Fueling[] = [
        { id: 'f1', vehicle_id: '1', plate: 'BRA-2E19', date: '22/04 14:20', liters: 450, value: 2655, km: 124500, consumption: 2.4, station: 'Posto Graal Sul' },
        { id: 'f3', vehicle_id: '4', plate: 'KDT-9912', date: '21/04 16:30', liters: 120, value: 708, km: 45600, consumption: 3.8, station: 'Posto Petrobras BR' },
      ];
      setFuelings(mockFuelings);

      const mockMaintenances: Maintenance[] = [
        { id: 'm1', vehicle_id: '2', plate: 'LOG-4F20', model: 'Volvo FH 540', type: 'CORRETIVA', description: 'Reparo no Sistema de Arla 32', date: '24/04/2026', km_at: 89300, status: 'EM_ANDAMENTO', cost: 4200, shop: 'Oficina Central Volvo' },
        { id: 'm2', vehicle_id: '1', plate: 'BRA-2E19', model: 'Scania R540', type: 'PREVENTIVA', description: 'Revisão de 120k KM', date: '15/03/2026', km_at: 120000, status: 'CONCLUIDO', cost: 8500, shop: 'Scania Service' },
        { id: 'm3', vehicle_id: '5', plate: 'ZAP-0081', model: 'Iveco Stralis', type: 'CORRETIVA', description: 'Manutenção Motor (Geral)', date: '20/12/2025', km_at: 315000, status: 'CONCLUIDO', cost: 42000, shop: 'Garage-Z' },
        { id: 'm4', vehicle_id: '3', plate: 'ABC-1234', model: 'MB Actros', type: 'PREVENTIVA', description: 'Troca de Pneus (Eixo Dianteiro)', date: '22/04/2026', km_at: 210400, status: 'ATRASADO', cost: 3800, shop: '-' },
      ];
      setMaintenances(mockMaintenances);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.company_id]);

  const handleTabChange = (tabId: string) => {
    navigate(`/frota/${tabId}`);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const kpis = useMemo(() => {
    const total = vehicles.length;
    const maintenance = vehicles.filter(v => v.status === 'OFICINA' || v.status === 'REVISAO').length;
    const avgConsumption = vehicles.length > 0 ? vehicles.reduce((acc, v) => acc + v.fuel_efficiency, 0) / total : 0;
    const totalCost = vehicles.reduce((acc, v) => acc + v.total_cost_mth, 0);
    const sortedByEconomy = [...vehicles].sort((a, b) => b.fuel_efficiency - a.fuel_efficiency);
    const mostEconomical = sortedByEconomy[0];
    const highestConsumption = sortedByEconomy[sortedByEconomy.length - 1];
    
    // MNT KPIs
    const mntPending = maintenances.filter(m => m.status === 'PENDENTE' || m.status === 'EM_ANDAMENTO').length;
    const mntOverdue = maintenances.filter(m => m.status === 'ATRASADO').length;
    const mntTotalCost = maintenances.reduce((acc, m) => acc + m.cost, 0);

    return { total, maintenance, avgConsumption, totalCost, mostEconomical, highestConsumption, mntPending, mntOverdue, mntTotalCost };
  }, [vehicles, maintenances]);

  const renderVeiculos = () => (
    <div style={styles.tabContent} className="animate-fade-in">
        {/* KPIs (Visão Geral) */}
        <div style={styles.kpiGrid}>
          <MetricCard 
            title="Total Veículos" 
            value={kpis.total} 
            subtitle="Ativos na frota" 
            icon={Truck} 
            iconBg="#f1f5f9" 
            iconColor="#64748b"
            sparkData={[12, 13, 14, kpis.total]}
          />
          <MetricCard 
            title="Em Manutenção" 
            value={kpis.maintenance} 
            subtitle="Indisponíveis" 
            trend="Atenção" 
            trendNeg 
            icon={Wrench} 
            iconBg="#fef2f2" 
            iconColor="#ef4444"
            sparkData={[1, 2, 1, kpis.maintenance]}
          />
          <MetricCard 
            title="Consumo Médio" 
            value={kpis.avgConsumption.toFixed(2)} 
            subtitle="Km/L (Global)" 
            trend="+0.2" 
            icon={Fuel} 
            iconBg="#eff6ff" 
            iconColor="#3b82f6"
            sparkData={[2.1, 2.2, 2.3, kpis.avgConsumption]}
          />
          <MetricCard 
            title="Custo Mensal" 
            value={formatCurrency(kpis.totalCost)} 
            subtitle="Acumulado Op." 
            icon={TrendingDown} 
            iconBg="#f8fafc" 
            iconColor="#94a3b8"
            sparkData={[14000, 15000, 14500, kpis.totalCost]}
          />
        </div>

       <div style={styles.heroWrapper}>
          <img src="/Users/alisonthiago/.gemini/antigravity/brain/55578a2e-8181-49fb-8b75-bd5f3bd61fc0/premium_logistics_fleet_1776906421477.png" alt="Frota Logta" style={styles.heroImg} />
          <div style={styles.heroOverlay}>
             <h2 style={styles.heroTitle}>Gestão de Ativos Logta</h2>
             <p style={styles.heroText}>Monitoramento 360º de manutenção, consumo e rotas em tempo real.</p>
             <button style={styles.heroBtn} onClick={() => setIsCreateModalOpen(true)}><Plus size={18} /> Adicionar Transmissor/Veículo</button>
          </div>
       </div>

       {/* TABLE VEICULOS */}
       <div style={styles.tableCard}>
          <div style={styles.cardHeader}><h3 style={{margin:0, fontWeight: 950}}>Painel de Veículos</h3></div>
          <table style={styles.table}>
             <thead>
                <tr><th style={styles.th}>Veículo</th><th style={styles.th}>Tipo</th><th style={styles.th}>Status</th><th style={styles.th}>Motorista</th><th style={styles.th}>KM Atual</th><th style={styles.th}>Ações</th></tr>
             </thead>
             <tbody>
                {vehicles.map(v => (
                   <tr key={v.id} style={styles.tr}>
                      <td style={styles.td}><strong>{v.plate}</strong><br/><span style={{fontSize:'11px', color:'#94a3b8'}}>{v.model}</span></td>
                      <td style={styles.td}><span style={styles.categoryBadge}>{v.type}</span></td>
                      <td style={styles.td}>
                         <div style={{...styles.statusTag, backgroundColor: v.status === 'OPERACIONAL' ? '#ecfdf5' : '#fef2f2', color: v.status === 'OPERACIONAL' ? '#10b981' : '#ef4444'}}>{v.status}</div>
                      </td>
                      <td style={styles.td}>{v.driver}</td>
                      <td style={styles.td}>{v.km.toLocaleString()} km</td>
                      <td style={styles.td}><button style={styles.iconBtnTable} onClick={() => { setSelectedVehicle(v); setIsDetailModalOpen(true); }}><Eye size={16}/></button></td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderConsumo = () => (
    <div style={styles.tabContent} className="animate-fade-in">
       {/* KPIs CONSUMO */}
        <div style={styles.kpiGrid}>
          <MetricCard 
            title="Km/L Médio" 
            value={kpis.avgConsumption.toFixed(2)} 
            subtitle="Eficiência da Frota" 
            icon={Fuel} 
            iconBg="#eff6ff" 
            iconColor="#3b82f6"
            sparkData={[2.1, 2.2, 2.3, kpis.avgConsumption]}
          />
          <MetricCard 
            title="Custo Combustível" 
            value={formatCurrency(kpis.totalCost)} 
            subtitle="Mês Corrente" 
            icon={DollarSign} 
            iconBg="#f1f5f9" 
            iconColor="#1e293b"
            sparkData={[14000, 15000, 14500, kpis.totalCost]}
          />
          <MetricCard 
            title="Melhor Km/L" 
            value={kpis.mostEconomical?.plate} 
            subtitle={`${kpis.mostEconomical?.fuel_efficiency} Km/L`} 
            trend="Elite" 
            icon={ArrowDown} 
            iconBg="#ecfdf5" 
            iconColor="#10b981"
            sparkData={[3.5, 3.6, 3.8, 3.8]}
          />
        </div>

       <div style={styles.tableCard}>
          <div style={styles.cardHeader}><h3 style={{margin:0, fontWeight: 950}}>Últimos Abastecimentos</h3><button style={styles.miniBtn} onClick={() => setIsFuelingModalOpen(true)}><Plus size={16}/> Registrar</button></div>
          <table style={styles.table}>
             <thead><tr><th style={styles.th}>Veículo</th><th style={styles.th}>Data</th><th style={styles.th}>Litros</th><th style={styles.th}>Valor</th><th style={styles.th}>Km/L</th><th style={styles.th}>Posto</th></tr></thead>
             <tbody>
                {fuelings.map(f => (
                   <tr key={f.id} style={styles.tr}>
                      <td style={styles.td}><strong>{f.plate}</strong></td>
                      <td style={styles.td}>{f.date}</td>
                      <td style={styles.td}>{f.liters} L</td>
                      <td style={styles.td}><strong>{formatCurrency(f.value)}</strong></td>
                      <td style={styles.td}>{f.consumption}</td>
                      <td style={styles.td}>{f.station}</td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderManutencao = () => (
    <div style={styles.tabContent} className="animate-fade-in">
       {/* KPIs MANUTENÇÃO */}
        <div style={styles.kpiGrid}>
          <MetricCard 
            title="OS em Aberto" 
            value={kpis.mntPending} 
            subtitle="Pendentes/Em curso" 
            trend="Normal" 
            icon={Wrench} 
            iconBg="#fffbeb" 
            iconColor="#f59e0b"
            sparkData={[2, 3, 2, kpis.mntPending]}
          />
          <MetricCard 
            title="Atrasadas" 
            value={kpis.mntOverdue} 
            subtitle="Ação Crítica" 
            trend="Alerta" 
            trendNeg 
            icon={AlertCircle} 
            iconBg="#fef2f2" 
            iconColor="#ef4444"
            sparkData={[0, 1, 0, kpis.mntOverdue]}
          />
          <MetricCard 
            title="Custo Total MNT" 
            value={formatCurrency(kpis.mntTotalCost)} 
            subtitle="Acumulado (Mês)" 
            icon={DollarSign} 
            iconBg="#f1f5f9" 
            iconColor="#64748b"
            sparkData={[4000, 8000, 12000, kpis.mntTotalCost]}
          />
          <MetricCard 
            title="Próx. 30 Dias" 
            value="08" 
            subtitle="Preventivas" 
            trend="Agendadas" 
            icon={CalendarClock} 
            iconBg="#eff6ff" 
            iconColor="#3b82f6"
            sparkData={[4, 6, 5, 8]}
          />
        </div>

       {/* TABLE MANUTENÇÃO */}
       <div style={styles.tableCard}>
          <div style={styles.cardHeader}>
             <div><h3 style={{margin:0, fontWeight: 950}}>Controle de Oficina & Preventivas</h3><p style={{margin:0, fontSize:'11px', color:'#94a3b8'}}>Monitoramento centralizado de ordens de serviço</p></div>
             <button style={styles.miniBtn} onClick={() => setIsMntModalOpen(true)}><Plus size={16}/> Agendar Manutenção</button>
          </div>
          <table style={styles.table}>
             <thead>
                <tr>
                   <th style={styles.th}>Veículo / Placa</th>
                   <th style={styles.th}>Tipo</th>
                   <th style={styles.th}>Descrição do Serviço</th>
                   <th style={styles.th}>Data Agend.</th>
                   <th style={styles.th}>Status</th>
                   <th style={styles.th}>Custo (R$)</th>
                   <th style={styles.th}>Oficina</th>
                </tr>
             </thead>
             <tbody>
                {maintenances.map(m => (
                   <tr key={m.id} style={styles.tr}>
                      <td style={styles.td}><strong>{m.plate}</strong><br/><span style={{fontSize:'10px', color:'#94a3b8'}}>{m.model}</span></td>
                      <td style={styles.td}><span style={{...styles.categoryBadge, backgroundColor: m.type === 'PREVENTIVA' ? '#eff6ff' : '#fef2f2', color: m.type === 'PREVENTIVA' ? '#3b82f6' : '#ef4444'}}>{m.type}</span></td>
                      <td style={styles.td}>{m.description}</td>
                      <td style={styles.td}>{m.date}</td>
                      <td style={styles.td}>
                         <div style={{
                            ...styles.statusTag, 
                            backgroundColor: m.status === 'CONCLUIDO' ? '#ecfdf5' : m.status === 'ATRASADO' ? '#fef2f2' : '#fffbeb',
                            color: m.status === 'CONCLUIDO' ? '#10b981' : m.status === 'ATRASADO' ? '#ef4444' : '#f59e0b'
                         }}>
                            {m.status.replace('_', ' ')}
                         </div>
                      </td>
                      <td style={styles.td}><strong>{formatCurrency(m.cost)}</strong></td>
                      <td style={styles.td}><span style={{fontSize:'12px', color:'#64748b'}}>{m.shop}</span></td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
       
       {/* ALERTAS PREVENTIVOS IA */}
       <div style={{...styles.chartCard, background: '#0f172a', border: 'none'}}>
          <h3 style={{...styles.chartTitle, color: 'white'}}><Zap size={18} color="#f59e0b" /> Sugestões Inteligentes (IA)</h3>
          <div style={{marginTop:'24px', display:'flex', gap:'20px'}}>
             <div style={styles.aiMntCard}>
                <p style={{margin:0, color:'#f59e0b', fontSize:'11px', fontWeight:900}}>ALERTA DE CUSTO</p>
                <p style={{color:'white', opacity:0.8, fontSize:'13px', marginTop:'8px'}}>Veículo <strong>ZAP-0081</strong> possui custo de manutenção 45% maior que a média da categoria. Recomendamos revisão estrutural ou substituição do ativo.</p>
             </div>
             <div style={styles.aiMntCard}>
                <p style={{margin:0, color:'#10b981', fontSize:'11px', fontWeight:900}}>PREVENTIVA PRÓXIMA</p>
                <p style={{color:'white', opacity:0.8, fontSize:'13px', marginTop:'8px'}}>A revisão de 150k km do veículo <strong>ABC-1234</strong> deve ocorrer em aprox. 12 dias com base na quilometragem rodada diária.</p>
             </div>
          </div>
       </div>
    </div>
  );

  const renderMapa = () => (
    <div style={styles.mapContainer} className="animate-fade-in">
       <div style={styles.mapSidebar}>
          <div style={styles.sidebarHeader}>
             <h3 style={styles.sidebarTitle}><Activity size={18} color="var(--primary)" /> Torre de Controle</h3>
          </div>
          <div style={styles.vehicleList}>
             {vehicles.map(v => (
                <div key={v.id} style={{...styles.vehicleCard, border: focusedVehicleId === v.id ? '2px solid var(--primary)' : '1px solid #f1f5f9'}} onClick={() => setFocusedVehicleId(v.id)}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}><strong style={{fontSize:'13px'}}>{v.plate}</strong><div style={{width:8, height:8, borderRadius:'50%', backgroundColor: v.status === 'OPERACIONAL' ? '#10b981' : '#f59e0b'}} /></div>
                   <p style={{margin:0, fontSize:'11px', color:'#64748b'}}>{v.model}</p>
                </div>
             ))}
          </div>
       </div>
       <div style={styles.mapMainArea}>
          <FleetMap vehicles={vehicles.map(v => ({ ...v, name: v.model, lat: v.plate === 'BRA-2E19' ? -23.5505 : v.plate === 'LOG-4F20' ? -23.5600 : -23.5400, lng: v.plate === 'BRA-2E19' ? -46.6333 : v.plate === 'LOG-4F20' ? -46.6500 : -46.6200, speed: v.status === 'OPERACIONAL' ? '65 km/h' : '0 km/h', last_update: 'Just now' }))} focusedVehicleId={focusedVehicleId} />
       </div>
    </div>
  );

  const navItems = [
    { id: 'veiculos', label: 'Gestão da Frota', icon: Truck },
    { id: 'consumo', label: 'Abastecimento / Consumo', icon: Fuel },
    { id: 'mapa', label: 'Rastreamento (Mapa)', icon: MapPin },
    { id: 'manutencao', label: 'Oficina / MNT', icon: Wrench },
  ];

  const fleetPageTitleByTab: Record<string, string> = {
    veiculos: 'Status Geral da Frota',
    consumo: 'Eficiência Energética',
    mapa: 'Torre de Controle',
    manutencao: 'Controle de Manutenção',
  };

  return (
    <ModuleLayout
      title={fleetPageTitleByTab[activeTab] ?? 'Gestão da Frota'}
      badge="GESTÃO DE ATIVOS MÓVEIS"
      items={navItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      <div style={styles.container}>
        {activeTab === 'veiculos' && renderVeiculos()}
        {activeTab === 'manutencao' && renderManutencao()}
        {activeTab === 'mapa' && renderMapa()}
        {activeTab === 'consumo' && renderConsumo()}
      </div>

      {/* MODALS */}
      <LogtaModal isOpen={isFuelingModalOpen} onClose={() => setIsFuelingModalOpen(false)} title="⛽ Novo Abastecimento" width="500px">
         <div style={{padding:20}}>Formulário de Abastecimento...</div>
      </LogtaModal>
      
      <LogtaModal isOpen={isMntModalOpen} onClose={() => setIsMntModalOpen(false)} title="🔧 Agendar Manutenção" width="500px">
         <div style={{padding:20}}>Formulário de Manutenção...</div>
      </LogtaModal>

      <LogtaModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={selectedVehicle ? `Ficha Técnica: ${selectedVehicle.plate}` : ''} width="800px">
         {selectedVehicle && <div style={{padding:24}}>Detalhes do veículo em tempo real...</div>}
      </LogtaModal>
    </ModuleLayout>
  );
};

const styles: Record<string, any> = {
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  kpiCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  kpiInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  kpiLabel: { fontSize: '10px', fontWeight: '900', color: '#94a3b8', margin: 0, textTransform: 'uppercase' },
  kpiValue: { fontSize: '26px', fontWeight: '950', color: '#0f172a', margin: 0 },
  kpiSub: { fontSize: '11px', color: '#94a3b8', fontWeight: 700 },
  kpiSubDanger: { fontSize: '11px', color: '#ef4444', fontWeight: 800 },
  kpiSubPrimary: { fontSize: '11px', color: '#3b82f6', fontWeight: 800 },
  kpiSubSuccess: { fontSize: '11px', color: '#10b981', fontWeight: 800 },
  kpiIconWrapper: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  heroWrapper: { position: 'relative', width: '100%', height: '350px', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  heroOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '16px' },
  heroTitle: { color: 'white', fontSize: '36px', fontWeight: 950, margin: 0 },
  heroText: { color: 'rgba(255,255,255,0.7)', fontSize: '16px', maxWidth:'600px', margin:0 },
  heroBtn: { padding:'14px 28px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'16px', fontWeight:900, cursor:'pointer', width:'fit-content', display:'flex', alignItems:'center', gap:10 },

  tableCard: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  cardHeader: { padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px 24px', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '20px 24px', fontSize: '14px', borderBottom: '1px solid #f1f5f9', color: '#1e293b' },
  tr: { transition: 'background-color 0.2s', '&:hover': { backgroundColor: '#f8fafc' } },
  categoryBadge: { padding: '5px 10px', borderRadius:'8px', fontSize:'10px', fontWeight:900, textTransform:'uppercase' },
  statusTag: { padding: '5px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', width: 'fit-content' },
  iconBtnTable: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#64748b', display:'flex', alignItems:'center', justifyContent:'center' },
  miniBtn: { padding: '10px 18px', backgroundColor: 'white', color:'#1e293b', border:'1px solid #e2e8f0', borderRadius:'14px', fontWeight:800, fontSize:'12px', display:'flex', alignItems:'center', gap:8, cursor:'pointer' },

  chartCard: { backgroundColor: 'white', padding: '32px', borderRadius: '32px', border: '1px solid #e2e8f0' },
  chartTitle: { fontSize: '18px', fontWeight: '950', color: '#0f172a', margin:0, display:'flex', alignItems:'center', gap:10 },
  aiMntCard: { flex: 1, padding:'24px', borderRadius:'20px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' },

  mapContainer: { display: 'flex', gap: '20px', height: 'calc(100vh - 280px)' },
  mapSidebar: { width: '300px', backgroundColor: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' },
  mapMainArea: { flex: 1, borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9' },
  sidebarHeader: { padding: '20px', borderBottom: '1px solid #f1f5f9' },
  sidebarTitle: { margin: 0, fontSize: '15px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '10px' },
  vehicleList: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  vehicleCard: { padding: '16px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { backgroundColor: '#f8fafc' } },
};

export default Fleet;
