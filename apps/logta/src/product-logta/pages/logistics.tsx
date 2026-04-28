import React, { useState, useEffect, useId, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Navigation, Package, Map as MapIcon, Calendar, Clock, 
  ChevronRight, Filter, Plus, Search, MoreHorizontal, Maximize2,
  MapPin, Truck, AlertCircle, CheckCircle2, History as HistoryIcon, 
  BarChart2, BarChart3, AlertTriangle, User, Download, FileText, Share2, 
  Navigation2, ChevronDown, Layers, Users, Save, MessageCircle, 
  Shield, Play, Pause, Square, Power, Lock, X, ArrowRight, Target,
  CheckCircle, Zap, ShieldAlert, Eye, Check, MessageSquare, Activity, MoreVertical,
  Trash2, Camera, PenLine, RefreshCw, Timer, ExternalLink, Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  CartesianGrid,
  ReferenceLine,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import ModuleLayout from '../../layouts/ModuleLayout';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { supabase } from '../../lib/supabase';
import LogtaModal from '../../components/Modal';
import MetricCard from '../../components/MetricCard';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '../../lib/toast';
import ExportButton from '../../components/ExportButton';
import EmptyState from '../../components/EmptyState';
import FleetMap from '../../components/FleetMap';

// --- Types ---
interface Route {
  id: string;
  name: string;
  driver_name: string;
  driver_id?: string;
  vehicle_plate: string;
  status: 'EM_ROTA' | 'AGUARDANDO' | 'CONCLUIDA' | 'ATRASADA';
  departure_time: string;
  deliveries_count: number;
  weight: string;
  volume: string;
  /** Resumo do último movimento na rota (torre / demo). */
  last_event?: string;
}

/** Rotas de exemplo quando a API não devolve linhas — lista TMS continua útil. */
const ROUTES_FALLBACK: Route[] = [
  {
    id: 'r1',
    name: 'Rota Sul — Av. Paulista',
    driver_name: 'Claudio Ferreira',
    vehicle_plate: 'BRA-2E19',
    status: 'EM_ROTA',
    departure_time: '06:10',
    deliveries_count: 6,
    weight: '9,1 t',
    volume: '44 m³',
    last_event: 'Parada 3/6 concluída · há 14 min',
  },
  {
    id: 'r2',
    name: 'Rota Leste — Anhanguera',
    driver_name: 'Ana Prado',
    vehicle_plate: 'ABC-1234',
    status: 'ATRASADA',
    departure_time: '05:45',
    deliveries_count: 5,
    weight: '6,8 t',
    volume: '31 m³',
    last_event: 'SLA em risco · torre contactou cliente',
  },
  {
    id: 'r3',
    name: 'Rota Centro — Brás / Sé',
    driver_name: 'Marcos Souza',
    vehicle_plate: 'LOG-4F20',
    status: 'AGUARDANDO',
    departure_time: '07:30',
    deliveries_count: 4,
    weight: '4,2 t',
    volume: '22 m³',
    last_event: 'Aguardando doca · previsão 08:05',
  },
  {
    id: 'r4',
    name: 'Rota Oeste — Osasco / Barueri',
    driver_name: 'Claudio Ferreira',
    vehicle_plate: 'BRA-2E19',
    status: 'CONCLUIDA',
    departure_time: 'Ontem 18:20',
    deliveries_count: 8,
    weight: '11 t',
    volume: '52 m³',
    last_event: 'Encerrada com POD · 22:10',
  },
  {
    id: 'r5',
    name: 'Rota Noturna — Guarulhos',
    driver_name: 'Marcos Souza',
    vehicle_plate: 'LOG-4F20',
    status: 'EM_ROTA',
    departure_time: '20:15',
    deliveries_count: 3,
    weight: '3,5 t',
    volume: '18 m³',
    last_event: 'Em trânsito · próxima parada km 42',
  },
  {
    id: 'r6',
    name: 'Rota Express — Campinas (SP)',
    driver_name: 'Ana Prado',
    vehicle_plate: 'ABC-1234',
    status: 'AGUARDANDO',
    departure_time: '08:00',
    deliveries_count: 2,
    weight: '2,1 t',
    volume: '12 m³',
    last_event: 'Check-list OK · saída iminente',
  },
];

type DeliveryStatus = 'PENDENTE' | 'EM_ROTA' | 'ENTREGUE' | 'PROBLEMA' | 'ATRASADA';

interface Delivery {
  id: string;
  client: string;
  address: string;
  product: string;
  status: DeliveryStatus;
  route_id?: string;
  driver_name?: string;
  vehicle_plate?: string;
  scheduled_at?: string;
  order_number?: string;
}

/** Dados de exemplo quando ainda não há shipments na base */
const ENTREGAS_FALLBACK: Delivery[] = [
  { id: 'e1', order_number: 'ENT-240891', client: 'Distribuidora Sul Ltda', address: 'Av. Paulista, 1000 — São Paulo/SP', product: 'Pallets secos', status: 'EM_ROTA', route_id: 'r1', driver_name: 'Claudio Ferreira', vehicle_plate: 'BRA-2E19', scheduled_at: '2026-04-23T09:30:00' },
  { id: 'e2', order_number: 'ENT-240892', client: 'Atacado Central', address: 'Rua das Indústrias, 450 — Guarulhos/SP', product: 'Refrigerados', status: 'PENDENTE', route_id: 'r1', driver_name: 'Marcos Souza', vehicle_plate: 'LOG-4F20', scheduled_at: '2026-04-23T14:00:00' },
  { id: 'e3', order_number: 'ENT-240893', client: 'Varejo Express', address: 'Rod. Anhanguera, km 42', product: 'Mix carga', status: 'ENTREGUE', route_id: 'r2', driver_name: 'Claudio Ferreira', vehicle_plate: 'BRA-2E19', scheduled_at: '2026-04-22T16:45:00' },
  { id: 'e4', order_number: 'ENT-240894', client: 'Hospital Santa Cruz', address: 'Rua Augusta, 88 — SP', product: 'Medicamentos', status: 'ATRASADA', route_id: 'r2', driver_name: 'Ana Prado', vehicle_plate: 'ABC-1234', scheduled_at: '2026-04-23T08:00:00' },
  { id: 'e5', order_number: 'ENT-240895', client: 'Metalúrgica Oeste', address: 'Av. Brasil, 7800', product: 'Peças', status: 'PROBLEMA', route_id: 'r3', driver_name: 'Marcos Souza', vehicle_plate: 'LOG-4F20', scheduled_at: '2026-04-23T11:20:00' },
  { id: 'e6', order_number: 'ENT-240896', client: 'Loja Centro', address: 'Praça da Sé, 120', product: 'E-commerce', status: 'ENTREGUE', route_id: 'r3', driver_name: 'Ana Prado', vehicle_plate: 'ABC-1234', scheduled_at: '2026-04-22T10:00:00' },
];

const deliveryStatusLabel: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ROTA: 'Em rota',
  ENTREGUE: 'Entregue',
  PROBLEMA: 'Problema',
  ATRASADA: 'Atrasada',
};

type OccurrenceStatus = 'ABERTA' | 'EM_ANDAMENTO' | 'RESOLVIDA' | 'CRITICA';

interface Occurrence {
  id: string;
  /** Nº exibido (ex.: OCR-98241) */
  number?: string;
  type: string;
  description: string;
  route_id: string;
  timestamp: string;
  responsible: string;
  content_full?: string;
  recommendations?: string[];
  delivery_ref?: string;
  driver_name?: string;
  status?: OccurrenceStatus;
}

/** Equipas por área — iniciais nos KPIs + tooltip com nome/função */
const TEAM_TORRE = {
  avatars: ['CF', 'MS', 'AP'],
  avatarTitles: ['Claudio Ferreira — torre / SLA', 'Marcos Souza — planeamento rotas', 'Ana Prado — qualidade'],
};
const TEAM_HUB = {
  avatars: ['JV', 'RC', 'LM'],
  avatarTitles: ['Julia Vieira — hub saída', 'Ricardo Costa — última milha', 'Laura Mendes — janelas'],
};
const TEAM_RISCO = {
  avatars: ['TV', 'NS', 'CF'],
  avatarTitles: ['Tiago Vidal — riscos', 'Nina Soares — alertas', 'Claudio Ferreira — campo'],
};
const TEAM_CUSTO = {
  avatars: ['PR', 'MS', 'AP'],
  avatarTitles: ['Patricia Rocha — financeiro ops', 'Marcos Souza — frota', 'Ana Prado — auditoria'],
};

const OCC_FALLBACK: Occurrence[] = [
  {
    id: 'oc-demo-1',
    number: 'OCR-98241',
    type: 'ATRASO',
    description: 'Atraso superior a 45 min na 1.ª parada — cliente contactado.',
    route_id: 'RT-SUL-12',
    timestamp: '2026-04-23 07:40',
    responsible: 'Torre SP',
    delivery_ref: 'ENT-240891',
    driver_name: 'Claudio Ferreira',
    status: 'EM_ANDAMENTO',
  },
  {
    id: 'oc-demo-2',
    number: 'OCR-98242',
    type: 'CLIENTE_AUSENTE',
    description: 'Destinatário ausente na doca — aguardando reagendamento.',
    route_id: 'RT-LEST-03',
    timestamp: '2026-04-22 16:12',
    responsible: 'Suporte campo',
    delivery_ref: 'ENT-240892',
    driver_name: 'Marcos Souza',
    status: 'ABERTA',
  },
  {
    id: 'oc-demo-3',
    number: 'OCR-98238',
    type: 'AVARIA',
    description: 'Volume com embalagem danificada — foto anexada.',
    route_id: 'RT-SUL-12',
    timestamp: '2026-04-21 11:05',
    responsible: 'Qualidade',
    delivery_ref: 'ENT-240880',
    driver_name: 'Ana Prado',
    status: 'RESOLVIDA',
  },
  {
    id: 'oc-demo-4',
    number: 'OCR-98245',
    type: 'ERRO_ENDERECO',
    description: 'CEP não confere com a rua indicada no manifesto.',
    route_id: 'RT-CENTRO-01',
    timestamp: '2026-04-23 09:55',
    responsible: 'Torre SP',
    delivery_ref: 'ENT-240901',
    driver_name: 'Marcos Souza',
    status: 'CRITICA',
  },
];

const Logistics: React.FC = () => {
  const { profile } = useAuth();
  const { company } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const { tab } = useParams<{ tab: string }>();

  // --- States ---
  const activeTab = tab || 'dashboard';


  const [routes, setRoutes] = useState<Route[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isOccurrenceModalOpen, setIsOccurrenceModalOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [mapSearch, setMapSearch] = useState('');
  const [tmsRouteSearch, setTmsRouteSearch] = useState('');
  const [isNewDeliveryModalOpen, setIsNewDeliveryModalOpen] = useState(false);
  const [isDeliveryDetailOpen, setIsDeliveryDetailOpen] = useState(false);
  const [newDeliveryForm, setNewDeliveryForm] = useState({
    client: '',
    address: '',
    date: '',
    route_id: '',
    driver_name: '',
  });
  const [entFilterStatus, setEntFilterStatus] = useState<string>('all');
  const [entFilterDriver, setEntFilterDriver] = useState<string>('all');
  const [entFilterRoute, setEntFilterRoute] = useState<string>('all');
  const [entFilterPeriod, setEntFilterPeriod] = useState<string>('semana');
  const [entSearch, setEntSearch] = useState('');
  const [occFilterStatus, setOccFilterStatus] = useState<string>('all');
  const [occFilterType, setOccFilterType] = useState<string>('all');
  const [occFilterDriver, setOccFilterDriver] = useState<string>('all');
  const [occFilterRoute, setOccFilterRoute] = useState<string>('all');
  const [occFilterPeriod, setOccFilterPeriod] = useState<string>('all');
  const [occSearch, setOccSearch] = useState('');
  const [isNewOccurrenceModalOpen, setIsNewOccurrenceModalOpen] = useState(false);
  const [newOccForm, setNewOccForm] = useState({
    delivery_ref: '',
    type: 'ATRASO',
    description: '',
    date: '',
    driver_name: '',
    route_id: '',
  });
  /** Utilizador fechou o painel de detalhe de ocorrências — não voltar a auto-selecionar até mudar filtro/aba. */
  const occUserClosedDetailRef = useRef(false);
  const [dashRoutesTab, setDashRoutesTab] = useState<'ativas' | 'atraso'>('ativas');
  const [dashPeriod, setDashPeriod] = useState<'Dia' | 'Semana' | 'Mês' | 'Ano'>('Semana');
  const logiAreaGradId = useId().replace(/:/g, '');
  const [newRoute, setNewRoute] = useState({
    name: '',
    driver_id: '',
    vehicle_plate: '',
    departure_time: '',
    departure_date: '',
    destination_company: '',
    receiver_name: '',
    expected_arrival_time: '',
    priority: 'Normal',
    load_type: 'Carga Seca',
    window_start: '08:00',
    window_end: '18:00',
    origin: 'Centro de Distribuição Principal'
  });

  // --- Mock Data ---
  const perfData = [
    { name: 'Seg', entregas: 45, atrasos: 2 },
    { name: 'Ter', entregas: 52, atrasos: 0 },
    { name: 'Qua', entregas: 38, atrasos: 5 },
    { name: 'Qui', entregas: 48, atrasos: 1 },
    { name: 'Sex', entregas: 61, atrasos: 3 },
  ];

  // --- Fetching ---
  const fetchData = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      console.log('Buscando dados operacionais para:', profile.company_id);
      
      // 1. Buscar Rotas
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select(`
          *,
          driver:profiles(full_name)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      let routesSnapshot: Route[] = [];
      if (routeError) {
        console.error('Erro ao buscar rotas:', routeError);
      } else {
        routesSnapshot = (routeData || []).map((r: any) => ({
          id: r.id,
          name: r.name || `Rota ${r.id.substring(0, 4)}`,
          driver_name: (r.driver as any)?.full_name || 'Não atribuído',
          driver_id: r.driver_id,
          vehicle_plate: r.vehicle_plate || '---',
          status: r.status,
          departure_time: r.departure_time || 'N/A',
          deliveries_count: (() => {
            const n = Number(r.deliveries_count);
            return Number.isFinite(n) && n >= 0 ? n : 0;
          })(),
          weight: r.weight || '0kg',
          volume: r.volume || '0m³',
          last_event: typeof r.last_event === 'string' ? r.last_event : undefined,
        })) as Route[];
        setRoutes(routesSnapshot as any);
      }

      // 2. Buscar Entregas (Shipments)
      const { data: shipData, error: shipError } = await supabase
        .from('shipments')
        .select('*')
        .eq('company_id', profile.company_id)
        .limit(50);

      if (shipError) {
        console.error('Erro ao buscar entregas:', shipError);
      } else {
        const formattedShips: Delivery[] = (shipData || []).map((s: any) => {
          const rv = routesSnapshot.find((r) => r.id === s.route_id);
          return {
            id: s.id,
            client: s.description || s.client_name || 'Cliente Final',
            address: s.address || s.destination || 'Conforme manifesto',
            product: s.product || 'Material operacional',
            status: (s.status || 'PENDENTE') as DeliveryStatus,
            route_id: s.route_id,
            driver_name: rv?.driver_name || 'Não atribuído',
            vehicle_plate: rv?.vehicle_plate || '—',
            scheduled_at: s.scheduled_at || s.updated_at || s.created_at || new Date().toISOString(),
            order_number: s.order_number || `ENT-${String(s.id).replace(/-/g, '').slice(0, 6).toUpperCase()}`,
          };
        });
        setDeliveries(formattedShips as any);
      }

      // Adicionar log de sucesso
      console.log('Dados operacionais sincronizados para a empresa:', profile.company_id);
    } catch (err: any) {
      console.error('ERRO CRÍTICO NA LOGÍSTICA (fetchData):', {
        message: err.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code
      });
      toastError('Erro de sincronização. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.company_id]);

  const handleTabChange = (tab: string) => {
    navigate(`/logistica/${tab}`);
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) {
       toastError('Sessão expirada. Ação bloqueada.');
       return;
    }
    
    setLoading(true);
    const loadingToast = toastLoading('Criando rota...');
    
    try {
      const departureTime = `${newRoute.departure_date}T${newRoute.departure_time}:00`;
      
      const { data, error } = await supabase
        .from('routes')
        .insert([{
          id: crypto.randomUUID(),
          company_id: profile.company_id,
          name: newRoute.name,
          driver_id: newRoute.driver_id || profile.id,
          vehicle_plate: newRoute.vehicle_plate,
          departure_time: departureTime,
          status: 'AGUARDANDO',
          metadata: {
            destination_company: newRoute.destination_company,
            receiver_name: newRoute.receiver_name,
            expected_arrival_time: newRoute.expected_arrival_time
          }
        }])
        .select()
        .single();

      if (error) throw error;
      
      toastDismiss(loadingToast);
      toastSuccess('Rota criada com sucesso!');
      setIsCreateModalOpen(false);
      setNewRoute({ 
        name: '', driver_id: '', vehicle_plate: '', departure_time: '', departure_date: '',
        destination_company: '', receiver_name: '', expected_arrival_time: ''
      });
      fetchData();
    } catch (err: any) {
      toastDismiss(loadingToast);
      console.error('Erro ao criar rota:', err);
      toastError(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!window.confirm('Excluir esta rota permanentemente?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toastSuccess('Rota removida.');
      setIsRouteModalOpen(false);
      fetchData();
    } catch (err: any) {
      toastError(`Erro ao excluir: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateRouteStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('routes')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toastSuccess(`Status atualizado para ${status}`);
      fetchData();
    } catch (err: any) {
      toastError('Erro ao atualizar status.');
    }
  };

  const exportData = (format: 'excel' | 'pdf') => {
    toastLoading(`Gerando relatório em ${format.toUpperCase()}...`);
    setTimeout(() => {
      toastDismiss();
      toastSuccess(`Relatório de Rotas exportado com sucesso!`);
    }, 1500);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'EM_ROTA': return { backgroundColor: '#f0fdf4', color: '#166534' };
      case 'AGUARDANDO': return { backgroundColor: '#f1f5f9', color: '#475569' };
      case 'CONCLUIDA': return { backgroundColor: '#eef2ff', color: '#3730a3' };
      case 'ATRASADA': return { backgroundColor: '#fef2f2', color: '#991b1b' };
      default: return { backgroundColor: '#f1f5f9', color: '#475569' };
    }
  };

  const getDeliveryStatusStyle = (status: string) => {
    switch (status) {
      case 'ENTREGUE': return { backgroundColor: '#f0fdf4', color: '#166534' };
      case 'EM_ROTA': return { backgroundColor: '#eff6ff', color: '#1d4ed8' };
      case 'PENDENTE': return { backgroundColor: '#fefce8', color: '#854d0e' };
      case 'ATRASADA': return { backgroundColor: '#fef2f2', color: '#991b1b' };
      case 'PROBLEMA': return { backgroundColor: '#fef2f2', color: '#991b1b' };
      default: return { backgroundColor: '#f1f5f9', color: '#475569' };
    }
  };

  const formatEntregaDateTime = (iso?: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const handleCreateDeliveryLocal = (e: React.FormEvent) => {
    e.preventDefault();
    const route = routes.find((r) => r.id === newDeliveryForm.route_id);
    const row: Delivery = {
      id: crypto.randomUUID(),
      order_number: `ENT-${Date.now().toString().slice(-6)}`,
      client: newDeliveryForm.client.trim() || 'Cliente',
      address: newDeliveryForm.address.trim() || '—',
      product: 'Nova entrega',
      status: 'PENDENTE',
      route_id: newDeliveryForm.route_id || undefined,
      driver_name: newDeliveryForm.driver_name.trim() || route?.driver_name || 'Não atribuído',
      vehicle_plate: route?.vehicle_plate || '—',
      scheduled_at: newDeliveryForm.date ? `${newDeliveryForm.date}T09:00:00` : new Date().toISOString(),
    };
    setDeliveries((prev) => [row, ...prev]);
    toastSuccess('Entrega registada no painel.');
    setIsNewDeliveryModalOpen(false);
    setNewDeliveryForm({ client: '', address: '', date: '', route_id: '', driver_name: '' });
  };

  const occurrenceTypeLabel: Record<string, string> = {
    ATRASO: 'Atraso',
    CLIENTE_AUSENTE: 'Cliente ausente',
    AVARIA: 'Avaria',
    ERRO_ENDERECO: 'Erro de endereço',
    QUEBRA_VEICULAR: 'Quebra veicular',
  };

  const occurrenceStatusLabel: Record<OccurrenceStatus, string> = {
    ABERTA: 'Aberta',
    EM_ANDAMENTO: 'Em andamento',
    RESOLVIDA: 'Resolvida',
    CRITICA: 'Crítica',
  };

  const getOccurrenceTypeStyle = (type: string) => {
    switch (type) {
      case 'ATRASO':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'CLIENTE_AUSENTE':
        return { backgroundColor: '#e0e7ff', color: '#3730a3' };
      case 'AVARIA':
        return { backgroundColor: '#fee2e2', color: '#991b1b' };
      case 'ERRO_ENDERECO':
        return { backgroundColor: '#fce7f3', color: '#9d174d' };
      default:
        return { backgroundColor: '#f1f5f9', color: '#475569' };
    }
  };

  const getOccurrenceStatusStyle = (status?: OccurrenceStatus) => {
    switch (status) {
      case 'ABERTA':
        return { backgroundColor: '#fefce8', color: '#854d0e' };
      case 'EM_ANDAMENTO':
        return { backgroundColor: '#eff6ff', color: '#1d4ed8' };
      case 'RESOLVIDA':
        return { backgroundColor: '#f0fdf4', color: '#166534' };
      case 'CRITICA':
        return { backgroundColor: '#fef2f2', color: '#991b1b' };
      default:
        return { backgroundColor: '#f1f5f9', color: '#475569' };
    }
  };

  const parseOccTimestamp = (ts: string) => {
    const normalized = ts.includes('T') ? ts : ts.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T');
    const d = new Date(normalized);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const patchOccurrenceStatus = (id: string, status: OccurrenceStatus) => {
    setOccurrences((prev) => {
      const base = prev.length > 0 ? prev : [...OCC_FALLBACK];
      return base.map((o) => (o.id === id ? { ...o, status } : o));
    });
    setSelectedOccurrence((sel) => (sel && sel.id === id ? { ...sel, status } : sel));
    toastSuccess('Estado atualizado.');
  };

  const handleCreateOccurrenceLocal = (e: React.FormEvent) => {
    e.preventDefault();
    const dRows = deliveries.length > 0 ? deliveries : ENTREGAS_FALLBACK;
    const delivery = dRows.find((d) => d.order_number === newOccForm.delivery_ref || d.id === newOccForm.delivery_ref);
    const routeId = newOccForm.route_id || delivery?.route_id || '';
    const routeLabel = routes.find((r) => r.id === routeId)?.name || routeId || '—';
    const num = `OCR-${Math.floor(90000 + Math.random() * 9999)}`;
    const ts =
      newOccForm.date ||
      new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    const row: Occurrence = {
      id: crypto.randomUUID(),
      number: num,
      type: newOccForm.type,
      description: newOccForm.description.trim() || 'Sem descrição',
      route_id: routeLabel,
      timestamp: ts.replace('T', ' '),
      responsible: profile?.full_name || 'Operador',
      delivery_ref: newOccForm.delivery_ref || delivery?.order_number,
      driver_name: newOccForm.driver_name.trim() || delivery?.driver_name || '—',
      status: 'ABERTA',
    };
    setOccurrences((prev) => [row, ...prev]);
    setSelectedOccurrence(row);
    toastSuccess('Ocorrência registada.');
    setIsNewOccurrenceModalOpen(false);
    setNewOccForm({ delivery_ref: '', type: 'ATRASO', description: '', date: '', driver_name: '', route_id: '' });
  };

  const occSourceRows = useMemo(
    () => (occurrences.length > 0 ? occurrences : OCC_FALLBACK),
    [occurrences],
  );

  const occFilteredRows = useMemo(() => {
    return occSourceRows.filter((occ) => {
      const st = occ.status || 'ABERTA';
      if (occFilterStatus !== 'all' && st !== occFilterStatus) return false;
      if (occFilterType !== 'all' && occ.type !== occFilterType) return false;
      if (occFilterDriver !== 'all' && (occ.driver_name || '—') !== occFilterDriver) return false;
      if (occFilterRoute !== 'all' && occ.route_id !== occFilterRoute) return false;
      const t = parseOccTimestamp(occ.timestamp);
      if (t && occFilterPeriod !== 'all') {
        const now = Date.now();
        if (occFilterPeriod === 'hoje') {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date();
          end.setHours(23, 59, 59, 999);
          if (t.getTime() < start.getTime() || t.getTime() > end.getTime()) return false;
        } else if (occFilterPeriod === 'semana') {
          if (t.getTime() < now - 7 * 24 * 60 * 60 * 1000) return false;
        } else if (occFilterPeriod === 'mes') {
          if (t.getTime() < now - 30 * 24 * 60 * 60 * 1000) return false;
        }
      }
      const q = occSearch.trim().toLowerCase();
      if (q) {
        const blob = `${occ.number || ''} ${occ.description} ${occ.delivery_ref || ''} ${occ.route_id} ${occ.driver_name || ''}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [
    occSourceRows,
    occFilterStatus,
    occFilterType,
    occFilterDriver,
    occFilterRoute,
    occFilterPeriod,
    occSearch,
  ]);

  /** Garante detalhe ativo: primeira ocorrência visível ao entrar no separador ou quando o filtro muda (salvo se o utilizador fechou o painel). */
  useEffect(() => {
    if (activeTab !== 'ocorrencias') return;
    if (occFilteredRows.length === 0) {
      setSelectedOccurrence(null);
      occUserClosedDetailRef.current = false;
      return;
    }
    if (selectedOccurrence === null && occUserClosedDetailRef.current) {
      occUserClosedDetailRef.current = false;
      return;
    }
    setSelectedOccurrence((prev) => {
      if (prev && occFilteredRows.some((o) => o.id === prev.id)) return prev;
      return occFilteredRows[0];
    });
  }, [activeTab, occFilteredRows, selectedOccurrence]);

  // --- Render Sections ---

  const renderDashboard = () => {
    const totalEntregasSemana = perfData.reduce((s, d) => s + d.entregas, 0);
    const activeRoutes = routes.filter((r) => r.status === 'EM_ROTA').length;
    const delayedRoutes = routes.filter((r) => r.status === 'ATRASADA').length || 3;
    const alertsCount = occurrences.length + 2;
    const metaEntrega = 48;
    const atRiskRoutes = [...routes].sort((a, b) => {
      if (a.status === 'ATRASADA' && b.status !== 'ATRASADA') return -1;
      if (b.status === 'ATRASADA' && a.status !== 'ATRASADA') return 1;
      return 0;
    });
    const tableRoutes =
      dashRoutesTab === 'ativas'
        ? routes.filter((r) => r.status === 'EM_ROTA' || r.status === 'AGUARDANDO').slice(0, 6)
        : atRiskRoutes.slice(0, 6);

    const stackData = perfData.map((d) => {
      const risco = Math.min(d.entregas, d.atrasos * 6);
      const cumpridas = Math.max(4, d.entregas - risco);
      return { name: d.name, cumpridas, risco };
    });

    const pieMix =
      deliveries.length > 0
        ? [
            { name: 'Entregues', value: deliveries.filter((x) => x.status === 'ENTREGUE').length, color: '#7c3aed' },
            { name: 'Em rota', value: deliveries.filter((x) => x.status === 'EM_ROTA').length, color: '#111827' },
            {
              name: 'Outros',
              value: Math.max(
                0,
                deliveries.length -
                  deliveries.filter((x) => x.status === 'ENTREGUE').length -
                  deliveries.filter((x) => x.status === 'EM_ROTA').length,
              ),
              color: '#c4b5fd',
            },
          ].filter((x) => x.value > 0)
        : [
            { name: 'Concluídas', value: 47, color: '#7c3aed' },
            { name: 'Em curso', value: 28, color: '#111827' },
            { name: 'Outros', value: 18, color: '#c4b5fd' },
          ];
    const pieSafe = pieMix.length ? pieMix : [{ name: 'Sem dados', value: 1, color: '#e2e8f0' }];

    const dashKpis = [
      {
        title: 'Eficiência Médica',
        subtitle: 'SLA Global',
        value: '94.2%',
        Icon: Target,
        iconBg: 'rgba(16, 24, 39, 1)',
        iconColor: '#ffffff',
        trend: '+2.4%',
        trendNeg: false,
        spark: [70, 75, 80, 85, 82, 90, 94],
        sparkWidth: 88,
        ...TEAM_TORRE,
      },
      {
        title: 'Entregas registadas',
        subtitle: 'Volume no pipeline logístico',
        value: String(deliveries.length),
        trend: '+3% esta semana',
        trendNeg: false,
        spark: [18, 20, 19, 24, 22],
        Icon: Package,
        iconBg: 'rgba(196, 181, 253, 1)',
        iconColor: '#7c3aed',
        sparkWidth: 104,
        ...TEAM_HUB,
      },
      {
        title: 'Atrasos & alertas',
        subtitle: 'Pontos que precisam atenção',
        value: String(delayedRoutes + alertsCount),
        trend: '-2% vs meta',
        trendNeg: true,
        spark: [22, 18, 20, 16, 14],
        Icon: AlertTriangle,
        iconBg: '#f4f4f4',
        iconColor: 'rgba(16, 24, 39, 1)',
        sparkWidth: 96,
        ...TEAM_RISCO,
      },
    ];

    const periodOpts = ['Dia', 'Semana', 'Mês', 'Ano'] as const;

    return (
      <div className="animate-fade-in" style={styles.dashPageStack}>
        <div style={styles.dashRefKpiGrid}>
            {dashKpis.map((k) => (
              <MetricCard 
                key={k.title}
                title={k.title}
                subtitle={k.subtitle}
                value={k.value}
                trend={k.trend}
                trendNeg={k.trendNeg}
                icon={k.Icon}
                iconBg={k.iconBg}
                iconColor={k.iconColor}
                sparkData={k.spark}
                sparkWidth={k.sparkWidth}
                avatars={k.avatars}
                avatarTitles={k.avatarTitles}
              />
            ))}
          </div>

          <div style={styles.dashRefMiddleGrid}>
            <div style={styles.dashRefCard}>
              <div style={styles.dashRefCardHeader}>
                <div style={{ minWidth: 0 }}>
                  <h3 style={styles.dashRefCardH}>Volume operacional</h3>
                  <p style={styles.dashRefCardMeta}>
                    <strong style={{ color: '#0f172a', fontSize: 22, letterSpacing: '-0.02em' }}>{totalEntregasSemana}</strong>
                    <span style={styles.dashRefMetaSep}>entregas</span>
                    <span style={styles.dashRefChip}>+12% vs meta</span>
                  </p>
                  <p style={styles.dashRefCardHint}>
                    Soma na semana (Seg–Sex). {company?.name ? `· ${company.name}` : ''}
                  </p>
                </div>
                <div style={styles.dashRefPeriodWrap} role="group" aria-label="Período">
                  {periodOpts.map((p) => (
                    <button
                      key={p}
                      type="button"
                      style={{
                        ...styles.dashRefPeriodBtn,
                        ...(dashPeriod === p ? styles.dashRefPeriodBtnActive : {}),
                      }}
                      onClick={() => setDashPeriod(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ width: '100%', height: 188, marginTop: 4 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={perfData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id={logiAreaGradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.55} />
                        <stop offset="45%" stopColor="#a78bfa" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#ede9fe" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9e4f7" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} width={40} />
                    <Tooltip
                      formatter={(v: number) => [`${v} entregas`, '']}
                      contentStyle={{
                        borderRadius: 14,
                        border: 'none',
                        boxShadow: '0 12px 40px rgba(15,23,42,0.12)',
                        fontWeight: 700,
                      }}
                    />
                    <ReferenceLine x="Qua" stroke="#5b21b6" strokeDasharray="4 4" strokeOpacity={0.65} />
                    <Area
                      type="monotone"
                      dataKey="entregas"
                      stroke="#4c1d95"
                      strokeWidth={2.75}
                      fillOpacity={1}
                      fill={`url(#${logiAreaGradId})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.dashRefCard}>
              <div style={styles.dashRefCardHeader}>
                <h3 style={styles.dashRefCardH}>Relatório de entregas</h3>
                <span style={styles.dashRefSelectLike}>Mês ▾</span>
              </div>
              <div style={{ width: '100%', height: 249, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieSafe}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={96}
                      paddingAngle={3}
                    >
                      {pieSafe.map((e, i) => (
                        <Cell key={`${e.name}-${i}`} fill={e.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, n: string) => [`${v}`, n]}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.1)' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, fontWeight: 800, color: '#334155', paddingTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <button type="button" style={styles.dashRefCtaFull} onClick={() => handleTabChange('mapa')}>
                Ver mapa & GPS
              </button>
            </div>
          </div>

          <div style={styles.dashRefBottomGrid}>
            <div style={{ ...styles.dashRefCard, padding: 0, overflow: 'hidden' }}>
              <div style={{ ...styles.dashRefCardHeader, padding: '20px 22px 0' }}>
                <h3 style={styles.dashRefCardH}>Rotas recentes</h3>
                <button type="button" style={styles.dashIconGhost} aria-label="Mais opções">
                  <MoreHorizontal size={18} color="#64748b" />
                </button>
              </div>
              <div style={styles.dashTableTabs}>
                <button
                  type="button"
                  style={{ ...styles.dashTab, ...(dashRoutesTab === 'ativas' ? styles.dashTabActive : {}) }}
                  onClick={() => setDashRoutesTab('ativas')}
                >
                  <TrendingUp size={16} strokeWidth={2.25} />
                  Em destaque
                </button>
                <button
                  type="button"
                  style={{ ...styles.dashTab, ...(dashRoutesTab === 'atraso' ? styles.dashTabActive : {}) }}
                  onClick={() => setDashRoutesTab('atraso')}
                >
                  <TrendingDown size={16} strokeWidth={2.25} />
                  Com risco
                </button>
              </div>
              <table style={styles.dashMiniTable}>
                <thead>
                  <tr>
                    <th style={styles.dashTh}>N.º</th>
                    <th style={styles.dashTh}>Rota / motorista</th>
                    <th style={styles.dashTh}>Estado</th>
                    <th style={{ ...styles.dashTh, textAlign: 'right' }}>Entregas</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ ...styles.dashTd, color: '#94a3b8', fontWeight: 600 }}>
                        Sem rotas para mostrar. Crie uma rota ou sincronize dados.
                      </td>
                    </tr>
                  ) : (
                    tableRoutes.map((r, idx) => (
                      <tr key={r.id}>
                        <td style={{ ...styles.dashTd, fontWeight: 800, color: '#94a3b8', width: 48 }}>{idx + 1}</td>
                        <td style={styles.dashTd}>
                          <strong style={{ color: '#0f172a' }}>{r.name}</strong>
                          <br />
                          <span style={{ fontSize: 12, color: '#64748b' }}>{r.driver_name}</span>
                        </td>
                        <td style={styles.dashTd}>
                          <span
                            style={{
                              ...styles.dashStatusChip,
                              ...(r.status === 'EM_ROTA'
                                ? { backgroundColor: '#fef9c3', color: '#854d0e' }
                                : r.status === 'ATRASADA'
                                  ? { backgroundColor: '#fee2e2', color: '#991b1b' }
                                  : { backgroundColor: '#e0f2fe', color: '#075985' }),
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={{ ...styles.dashTd, textAlign: 'right', fontWeight: 800 }}>-</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={styles.dashRefCard}>
              <div style={styles.dashRefCardHeader}>
                <h3 style={styles.dashRefCardH}>Resumo semanal</h3>
                <span style={styles.dashRefSelectLike}>
                  <Calendar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} aria-hidden />
                  Últimos 5 dias
                </span>
              </div>
              <p style={styles.dashRefStackHint}>Volume cumprido vs. em risco (por dia)</p>
              <div style={{ width: '100%', height: 260, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stackData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9e4f7" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} width={36} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.1)' }}
                      formatter={(v: number, key: string) => [v, key === 'cumpridas' ? 'Cumprido' : 'Em risco']}
                    />
                    <Bar dataKey="cumpridas" stackId="s" fill="#7c3aed" radius={[0, 0, 0, 0]} maxBarSize={44} />
                    <Bar dataKey="risco" stackId="s" fill="#0f172a" radius={[10, 10, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={styles.dashRefLegendInline}>
                <span>
                  <span style={{ ...styles.dashRefDot, backgroundColor: '#7c3aed' }} /> Cumprido
                </span>
                <span>
                  <span style={{ ...styles.dashRefDot, backgroundColor: '#0f172a' }} /> Em risco
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#5b21b6', fontWeight: 800 }}>Meta {metaEntrega}/dia</span>
              </div>
            </div>
          </div>
      </div>
    );
  };

  const renderRoutes = () => {
    const routeRows = routes.length > 0 ? routes : ROUTES_FALLBACK;
    const filteredRoutes = routeRows.filter((r) => {
      const q = tmsRouteSearch.trim().toLowerCase();
      if (!q) return true;
      const blob = `${r.name} ${r.driver_name} ${r.vehicle_plate} ${r.status} ${r.departure_time || ''} ${r.last_event || ''}`.toLowerCase();
      return blob.includes(q);
    });
    const emRota = routeRows.filter((r) => r.status === 'EM_ROTA').length;
    const atrasadas = routeRows.filter((r) => r.status === 'ATRASADA').length;
    const tmsRouteKpis = [
      {
        title: 'Rotas em andamento',
        subtitle: 'Acompanhamento via GPS ativo',
        value: emRota,
        trend: 'GPS ativo',
        trendNeg: false,
        spark: [1, 2, 2, Math.max(1, emRota), emRota || 1],
        Icon: Navigation2,
        iconBg: 'rgba(16, 24, 39, 1)',
        iconColor: '#ffffff',
        sparkWidth: 72,
        ...TEAM_TORRE,
      },
      {
        title: 'Paradas planejadas',
        subtitle: 'Carga total: ~12.4 toneladas',
        value: deliveries.length,
        trend: 'Carga alinhada ao plano',
        trendNeg: false,
        spark: [12, 14, 13, 15, Math.max(0, deliveries.length)],
        Icon: Package,
        iconBg: 'rgba(196, 181, 253, 1)',
        iconColor: '#7c3aed',
        sparkWidth: 78,
        ...TEAM_HUB,
      },
      {
        title: 'Alertas de atraso',
        subtitle: 'Necessita ação imediata',
        value: atrasadas,
        trend: atrasadas > 0 ? 'Crítico' : 'Dentro do SLA',
        trendNeg: atrasadas > 0,
        spark: [22, 18, 20, 16, Math.max(2, 20 - atrasadas * 3)],
        Icon: AlertTriangle,
        iconBg: '#f4f4f4',
        iconColor: 'rgba(16, 24, 39, 1)',
        sparkWidth: 72,
        ...TEAM_RISCO,
      },
      {
        title: 'Eficácia de custo',
        subtitle: 'R$ 4.22/km médio',
        value: '94%',
        trend: '+1,2% vs mês',
        trendNeg: false,
        spark: [88, 90, 91, 93, 94],
        Icon: Shield,
        iconBg: 'rgba(196, 181, 253, 1)',
        iconColor: '#7c3aed',
        sparkWidth: 80,
        ...TEAM_CUSTO,
      },
    ];

    return (
    <div className="animate-fade-in" style={styles.content}>
      <div style={styles.dashRefKpiGrid4}>
        {tmsRouteKpis.map((k) => (
          <MetricCard
            key={k.title}
            title={k.title}
            subtitle={k.subtitle}
            value={k.value}
            trend={k.trend}
            trendNeg={k.trendNeg}
            icon={k.Icon}
            iconBg={k.iconBg}
            iconColor={k.iconColor}
            sparkData={k.spark}
            sparkWidth={k.sparkWidth}
            avatars={k.avatars}
            avatarTitles={k.avatarTitles}
          />
        ))}
      </div>

      <div style={styles.tmsActionRow}>
        <div style={styles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <input
            placeholder="Filtrar por motorista, placa, rota ou estado…"
            style={styles.searchInput}
            value={tmsRouteSearch}
            onChange={(e) => setTmsRouteSearch(e.target.value)}
            aria-label="Filtrar lista de rotas"
          />
        </div>
        <div style={styles.tmsButtonGroup}>
          <button style={styles.btnSecondary} onClick={() => toastSuccess('Otimizando rotas...')}>
            <Activity size={16} /> Otimização Automática (IA)
          </button>
          <button style={styles.primaryBtnSmall} onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} /> Nova Rota Manual
          </button>
        </div>
      </div>

      <div style={styles.tmsSplitView}>
        <div style={styles.tmsListSide}>
          <div style={styles.tmsListHeader}>
             <h4 style={{margin: 0, fontSize: '13px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase'}}>Todas as rotas</h4>
             <span style={{fontSize: '11px', color: '#94a3b8'}}>
               {filteredRoutes.length === routeRows.length
                 ? `${routeRows.length} rotas`
                 : `${filteredRoutes.length} de ${routeRows.length} rotas`}
             </span>
          </div>
          <div style={styles.tmsScrollArea}>
            {filteredRoutes.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#94a3b8', padding: '8px 4px' }}>
                Nenhuma rota corresponde ao filtro.
              </p>
            ) : (
            filteredRoutes.map(route => {
              const routeDeliveries = deliveries.filter(d => d.route_id === route.id);
              const stopsListed = routeDeliveries.length;
              const stopsTotal = Math.max(stopsListed, route.deliveries_count || 0, 1);
              const doneStops = routeDeliveries.filter((d) => d.status === 'ENTREGUE').length;
              const progressPct =
                stopsListed > 0
                  ? Math.min(100, Math.round((doneStops / stopsListed) * 100))
                  : route.status === 'CONCLUIDA'
                    ? 100
                    : route.status === 'EM_ROTA'
                      ? 52
                      : route.status === 'ATRASADA'
                        ? 38
                        : 12;
              return (
                <div 
                  key={route.id} 
                  style={{...styles.tmsRouteItem, borderLeft: `4px solid ${route.status === 'ATRASADA' ? '#ef4444' : route.status === 'EM_ROTA' ? '#10b981' : '#e2e8f0'}`}}
                  onClick={() => { setSelectedRoute(route); setIsRouteModalOpen(true); }}
                >
                  <div style={styles.tmsItemTop}>
                    <strong style={styles.tmsItemName}>{route.name}</strong>
                    <span style={{...styles.statusTag, ...getStatusStyle(route.status), fontSize: '10px', padding: '2px 8px'}}>{route.status}</span>
                  </div>
                  <div style={styles.tmsItemMeta}>
                    <div style={styles.tmsMetaUnit}><User size={12} /> {route.driver_name}</div>
                    <div style={styles.tmsMetaUnit}><Truck size={12} /> {route.vehicle_plate}</div>
                  </div>
                  <div style={{ ...styles.tmsItemMeta, marginTop: 6, flexWrap: 'wrap' as const }}>
                    <div style={styles.tmsMetaUnit}><Clock size={12} /> Saída {route.departure_time || '—'}</div>
                    <div style={styles.tmsMetaUnit}><Package size={12} /> {route.weight} · {route.volume}</div>
                  </div>
                  {route.last_event ? (
                    <p style={{ margin: '8px 0 0', fontSize: 11, fontWeight: 700, color: '#475569', lineHeight: 1.4 }}>
                      {route.last_event}
                    </p>
                  ) : null}
                  <div style={{ ...styles.tmsItemProgress, marginTop: 10 }}>
                    <div style={styles.tmsProgressBar}><div style={{...styles.tmsProgressFill, width: `${progressPct}%` }} /></div>
                    <span style={styles.tmsProgressText}>
                      {stopsListed > 0 ? `${doneStops}/${stopsListed} entregues` : `${stopsTotal} paradas planeadas`}
                    </span>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
        
        <div style={styles.tmsMapSide}>
          <div style={styles.tmsMapContainer}>
             <FleetMap />
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderDeliveries = () => {
    const rows: Delivery[] = deliveries.length > 0 ? deliveries : ENTREGAS_FALLBACK;
    const uniqueDrivers = Array.from(new Set(rows.map((d) => d.driver_name || '—'))).filter(Boolean);

    const filtered = rows.filter((d) => {
      if (entFilterStatus !== 'all' && d.status !== entFilterStatus) return false;
      if (entFilterDriver !== 'all' && (d.driver_name || '—') !== entFilterDriver) return false;
      if (entFilterRoute !== 'all' && d.route_id !== entFilterRoute) return false;
      if (d.scheduled_at) {
        const t = new Date(d.scheduled_at).getTime();
        const now = Date.now();
        if (entFilterPeriod === 'hoje') {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date();
          end.setHours(23, 59, 59, 999);
          if (t < start.getTime() || t > end.getTime()) return false;
        } else if (entFilterPeriod === 'semana') {
          if (t < now - 7 * 24 * 60 * 60 * 1000) return false;
        } else if (entFilterPeriod === 'mes') {
          if (t < now - 30 * 24 * 60 * 60 * 1000) return false;
        }
      }
      const q = entSearch.trim().toLowerCase();
      if (q) {
        const blob = `${d.order_number || ''} ${d.client} ${d.address} ${d.product}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    const total = rows.length;
    const concl = rows.filter((d) => d.status === 'ENTREGUE').length;
    const andam = rows.filter((d) => d.status === 'EM_ROTA').length;
    const atras = rows.filter((d) => d.status === 'ATRASADA').length;
    const tempoMedio = '42 min';

    const entKpis = [
      {
        title: 'Total de entregas',
        subtitle: 'Cenário consolidado',
        value: total,
        trend: 'Hoje + semana',
        trendNeg: false,
        spark: [12, 14, 13, 16, total],
        Icon: Package,
        iconBg: 'rgba(16, 24, 39, 1)',
        iconColor: '#ffffff',
        sparkWidth: 72,
        ...TEAM_TORRE,
      },
      {
        title: 'Concluídas',
        subtitle: 'Entregues com sucesso',
        value: concl,
        trend: `${Math.round((concl / Math.max(total, 1)) * 100)}% do total`,
        trendNeg: false,
        spark: [8, 9, 10, 11, concl],
        Icon: CheckCircle2,
        iconBg: 'rgba(196, 181, 253, 1)',
        iconColor: '#7c3aed',
        sparkWidth: 78,
        ...TEAM_HUB,
      },
      {
        title: 'Em andamento',
        subtitle: 'Em rota ou carregamento',
        value: andam,
        trend: 'Ao vivo',
        trendNeg: false,
        spark: [2, 3, 4, 3, andam],
        Icon: Truck,
        iconBg: 'rgba(196, 181, 253, 1)',
        iconColor: '#1d4ed8',
        sparkWidth: 76,
        ...TEAM_HUB,
      },
      {
        title: 'Atrasadas',
        subtitle: 'Fora da janela combinada',
        value: atras,
        trend: atras > 0 ? 'Ação imediata' : 'Dentro do SLA',
        trendNeg: atras > 0,
        spark: [22, 18, 16, 14, Math.max(2, 18 - atras * 3)],
        Icon: AlertTriangle,
        iconBg: '#f4f4f4',
        iconColor: 'rgba(16, 24, 39, 1)',
        sparkWidth: 74,
        ...TEAM_RISCO,
      },
      {
        title: 'Tempo médio',
        subtitle: 'Por parada (estim.)',
        value: tempoMedio,
        trend: '−6% vs mês',
        trendNeg: false,
        spark: [48, 46, 45, 44, 42],
        Icon: Timer,
        iconBg: 'rgba(196, 181, 253, 1)',
        iconColor: '#7c3aed',
        sparkWidth: 80,
        ...TEAM_CUSTO,
      },
    ];

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={styles.entIntroCard}>
          <p style={styles.entIntroKicker}>Logística → Entregas</p>
          <h2 style={styles.entIntroTitle}>O coração da operação</h2>
          <p style={styles.entIntroBody}>
            Aqui você controla <strong>tudo que está sendo entregue, atrasado ou concluído</strong>. Lista clara, status,
            filtros, detalhes e mapa — menos erro, mais eficiência e controle total do dia.
          </p>
          <div style={styles.entIntroBullets}>
            <span><CheckCircle size={14} /> Controle total</span>
            <span><CheckCircle size={14} /> Redução de erro</span>
            <span><CheckCircle size={14} /> Operação ao vivo</span>
          </div>
        </div>

        <div style={styles.dashRefKpiGrid5}>
          {entKpis.map((k) => (
            <MetricCard
              key={k.title}
              title={k.title}
              subtitle={k.subtitle}
              value={k.value}
              trend={k.trend}
              trendNeg={k.trendNeg}
              icon={k.Icon}
              iconBg={k.iconBg}
              iconColor={k.iconColor}
              sparkData={k.spark}
              sparkWidth={k.sparkWidth}
              avatars={k.avatars}
              avatarTitles={k.avatarTitles}
            />
          ))}
        </div>

        <div style={styles.entIntelRow}>
          <Sparkles size={16} color="#7c3aed" />
          <span>
            <strong>Inteligência:</strong> {atras > 0 ? `${atras} entrega(s) com risco de SLA` : 'Nenhum atraso crítico no período filtrado.'}{' '}
            · <strong>Notificações:</strong> cliente pode receber aviso automático ao mudar status.
          </span>
        </div>

        <div style={styles.entFilterCard}>
          <div style={styles.entFilterRow}>
            <div style={styles.entFilterField}>
              <label style={styles.entFilterLabel}>Status</label>
              <select
                style={styles.entSelect}
                value={entFilterStatus}
                onChange={(e) => setEntFilterStatus(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="PENDENTE">Pendente</option>
                <option value="EM_ROTA">Em rota</option>
                <option value="ENTREGUE">Entregue</option>
                <option value="ATRASADA">Atrasada</option>
                <option value="PROBLEMA">Problema</option>
              </select>
            </div>
            <div style={styles.entFilterField}>
              <label style={styles.entFilterLabel}>Motorista</label>
              <select style={styles.entSelect} value={entFilterDriver} onChange={(e) => setEntFilterDriver(e.target.value)}>
                <option value="all">Todos</option>
                {uniqueDrivers.map((dr) => (
                  <option key={dr} value={dr}>
                    {dr}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ ...styles.entFilterField, minWidth: 140, maxWidth: 200 }}>
              <label style={styles.entFilterLabel}>Rota</label>
              <select style={styles.entSelect} value={entFilterRoute} onChange={(e) => setEntFilterRoute(e.target.value)}>
                <option value="all">Todas</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.entFilterField}>
              <label style={styles.entFilterLabel}>Período</label>
              <select style={styles.entSelect} value={entFilterPeriod} onChange={(e) => setEntFilterPeriod(e.target.value)}>
                <option value="hoje">Hoje</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mês</option>
              </select>
            </div>
            <div style={styles.entFilterSearchGrow}>
              <div style={{ ...styles.searchBox, height: 42, width: '100%', minWidth: 0 }}>
                <Search size={16} color="#94a3b8" />
                <input
                  style={styles.searchInput}
                  placeholder="Buscar nº, cliente ou endereço…"
                  value={entSearch}
                  onChange={(e) => setEntSearch(e.target.value)}
                  aria-label="Buscar entregas"
                />
              </div>
            </div>
            <div style={styles.entFilterBtnGroup}>
              <button type="button" style={{ ...styles.actionBtn, height: 42, flexShrink: 0 }} onClick={() => toastSuccess('Lista atualizada.')}>
                <RefreshCw size={16} /> Atualizar
              </button>
              <button type="button" style={{ ...styles.actionBtn, height: 42, flexShrink: 0 }} onClick={() => exportData('excel')}>
                <Download size={16} /> Exportar
              </button>
              <button
                type="button"
                style={{ ...styles.primaryBtnSmall, height: 42, flexShrink: 0, whiteSpace: 'nowrap' as const }}
                onClick={() => setIsNewDeliveryModalOpen(true)}
              >
                <Plus size={18} /> Nova entrega
              </button>
            </div>
          </div>
        </div>

        <div style={styles.entLinksRow}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8' }}>Integração rápida</span>
          <button type="button" style={styles.entLinkChip} onClick={() => handleTabChange('rotas')}>
            Motoristas & rotas <ExternalLink size={12} />
          </button>
          <button type="button" style={styles.entLinkChip} onClick={() => handleTabChange('mapa')}>
            Ver mapa <MapIcon size={12} />
          </button>
          <button type="button" style={styles.entLinkChip} onClick={() => handleTabChange('ocorrencias')}>
            Ocorrências <AlertTriangle size={12} />
          </button>
          <button type="button" style={styles.entLinkChip} onClick={() => toastSuccess('Abrir CRM (demo)')}>
            CRM / Financeiro <ChevronRight size={12} />
          </button>
        </div>

        <div style={styles.tableCard}>
          <div style={styles.entTableHeader}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 950, color: '#0f172a' }}>Lista de entregas</h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                {filtered.length} registo(s) · clique numa linha para detalhes, mapa e comprovante
              </p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>N.º</th>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Endereço</th>
                  <th style={styles.th}>Motorista</th>
                  <th style={styles.th}>Veículo</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Data / hora</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ ...styles.td, color: '#94a3b8', fontWeight: 600 }}>
                      Nenhuma entrega com estes filtros.
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => (
                    <tr
                      key={d.id}
                      style={{ ...styles.tr, cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedDelivery(d);
                        setIsDeliveryDetailOpen(true);
                      }}
                    >
                      <td style={styles.td}>
                        <span style={{ fontWeight: 900, color: '#7c3aed' }}>{d.order_number || d.id.slice(0, 8)}</span>
                      </td>
                      <td style={styles.td}>
                        <p style={{ fontWeight: 800, margin: 0, color: '#0f172a' }}>{d.client}</p>
                        <p style={{ ...styles.uSub, marginTop: 4 }}>{d.product}</p>
                      </td>
                      <td style={{ ...styles.td, maxWidth: 220 }}>
                        <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.35 }}>{d.address}</span>
                      </td>
                      <td style={styles.td}>{d.driver_name || '—'}</td>
                      <td style={styles.td}>{d.vehicle_plate || '—'}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.tag, ...getDeliveryStatusStyle(d.status) }}>
                          {deliveryStatusLabel[d.status] || d.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                          <Clock size={14} />
                          {formatEntregaDateTime(d.scheduled_at)}
                        </div>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            style={styles.btnTableIcon}
                            title="WhatsApp"
                            onClick={() => toastSuccess('Abrindo conversa (demo)')}
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            type="button"
                            style={styles.btnTableIcon}
                            title="Mapa"
                            onClick={() => {
                              setSelectedDelivery(d);
                              handleTabChange('mapa');
                            }}
                          >
                            <MapPin size={14} />
                          </button>
                          <button
                            type="button"
                            style={styles.btnTableIcon}
                            title="Ocorrência"
                            onClick={() => setIsOccurrenceModalOpen(true)}
                          >
                            <AlertTriangle size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderOccurrences = () => {
    const dRows = deliveries.length > 0 ? deliveries : ENTREGAS_FALLBACK;
    const occRows = occSourceRows;
    const filteredOcc = occFilteredRows;
    const uniqueOccDrivers = Array.from(new Set(occRows.map((o) => o.driver_name || '—'))).filter(Boolean);
    const uniqueOccRoutes = Array.from(new Set(occRows.map((o) => o.route_id))).filter(Boolean);

    const occTotal = occRows.length;
    const occCrit = occRows.filter((o) => o.status === 'CRITICA').length;
    const occOpen = occRows.filter((o) => o.status === 'ABERTA' || o.status === 'EM_ANDAMENTO').length;
    const occAvgResolve = '2h 10m';
    const probDeliveryPct = Math.round(
      (dRows.filter((d) => d.status === 'PROBLEMA' || d.status === 'ATRASADA').length / Math.max(dRows.length, 1)) * 100,
    );

    const routeCounts = occRows.reduce<Record<string, number>>((acc, o) => {
      acc[o.route_id] = (acc[o.route_id] || 0) + 1;
      return acc;
    }, {});
    const hotRoutes = Object.entries(routeCounts)
      .filter(([, n]) => n > 1)
      .map(([rid]) => rid);

    const typeRank = Object.entries(
      occRows.reduce<Record<string, number>>((acc, o) => {
        acc[o.type] = (acc[o.type] || 0) + 1;
        return acc;
      }, {}),
    ).sort((a, b) => b[1] - a[1]);

    const driverRank = Object.entries(
      occRows.reduce<Record<string, number>>((acc, o) => {
        const dn = o.driver_name || '—';
        acc[dn] = (acc[dn] || 0) + 1;
        return acc;
      }, {}),
    ).sort((a, b) => b[1] - a[1]);

    const occKpis = [
      {
        title: 'Total de ocorrências',
        subtitle: 'Registos no período',
        value: occTotal,
        trend: `${occOpen} abertas / em análise`,
        trendNeg: occOpen > 2,
        spark: [4, 5, 4, 6, occTotal],
        Icon: AlertTriangle,
        iconBg: 'rgba(16, 24, 39, 1)',
        iconColor: '#ffffff',
        sparkWidth: 72,
        ...TEAM_TORRE,
      },
      {
        title: 'Ocorrências críticas',
        subtitle: 'Prioridade máxima',
        value: occCrit,
        trend: occCrit ? 'Escalar gestor' : 'Sem críticos',
        trendNeg: occCrit > 0,
        spark: [2, 1, 2, 1, occCrit + 1],
        Icon: ShieldAlert,
        iconBg: '#fee2e2',
        iconColor: '#b91c1c',
        sparkWidth: 70,
        ...TEAM_RISCO,
      },
      {
        title: 'Tempo médio de resolução',
        subtitle: 'Fechadas (estim.)',
        value: occAvgResolve,
        trend: '−12% vs mês',
        trendNeg: false,
        spark: [150, 140, 135, 128, 130],
        Icon: Clock,
        iconBg: 'rgba(196, 181, 253, 1)',
        iconColor: '#5b21b6',
        sparkWidth: 78,
        ...TEAM_HUB,
      },
      {
        title: 'Entregas com problema',
        subtitle: '% do volume (atraso / problema)',
        value: `${probDeliveryPct}%`,
        trend: probDeliveryPct > 15 ? 'Acima do alvo' : 'Dentro do alvo',
        trendNeg: probDeliveryPct > 15,
        spark: [18, 16, 15, 14, probDeliveryPct],
        Icon: BarChart2,
        iconBg: '#f4f4f4',
        iconColor: 'rgba(16, 24, 39, 1)',
        sparkWidth: 76,
        ...TEAM_RISCO,
      },
      {
        title: 'Redução de ocorrências',
        subtitle: 'Comparativo mês',
        value: '−8%',
        trend: 'Tendência de melhoria',
        trendNeg: false,
        spark: [14, 12, 11, 10, 8],
        Icon: TrendingDown,
        iconBg: 'rgba(196, 181, 253, 1)',
        iconColor: '#15803d',
        sparkWidth: 80,
        ...TEAM_CUSTO,
      },
    ];

    const sel = selectedOccurrence;

    return (
      <div className="animate-fade-in" style={styles.content}>
        <div style={styles.entIntroCard}>
          <p style={styles.entIntroKicker}>Logística → Ocorrências</p>
          <h2 style={styles.entIntroTitle}>Problema vira controlo e melhoria contínua</h2>
          <p style={styles.entIntroBody}>
            Registo, <strong>estado</strong>, <strong>histórico</strong>, evidências e análise — deixa de apagar incêndio e passa a{' '}
            <strong>prevenir erro</strong>. KPIs no topo, lista filtrável, detalhe e fluxo de resolução ao lado.
          </p>
          <div style={styles.entIntroBullets}>
            <span>
              <CheckCircle size={14} /> Registo e anexos
            </span>
            <span>
              <CheckCircle size={14} /> Alertas e rotas quentes
            </span>
            <span>
              <CheckCircle size={14} /> Ranking de causas
            </span>
          </div>
        </div>

        <div style={styles.dashRefKpiGrid5}>
          {occKpis.map((k) => (
            <MetricCard
              key={k.title}
              title={k.title}
              subtitle={k.subtitle}
              value={k.value}
              trend={k.trend}
              trendNeg={k.trendNeg}
              icon={k.Icon}
              iconBg={k.iconBg}
              iconColor={k.iconColor}
              sparkData={k.spark}
              sparkWidth={k.sparkWidth}
              avatars={k.avatars}
              avatarTitles={k.avatarTitles}
            />
          ))}
        </div>

        <div style={styles.entIntelRow}>
          <Sparkles size={16} color="#7c3aed" />
          <span>
            <strong>Alertas:</strong>{' '}
            {occCrit > 0 ? `${occCrit} ocorrência(s) crítica(s) — notificar gestor.` : 'Nenhuma crítica pendente.'}{' '}
            {hotRoutes.length > 0 ? (
              <>
                · <strong>Rotas com recorrência:</strong> {hotRoutes.join(', ')}
              </>
            ) : (
              <>· Rotas sem pico de repetição no conjunto atual.</>
            )}
          </span>
        </div>

        <div style={styles.occHeader}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 950, color: '#0f172a' }}>Lista e detalhe</h3>
          <button type="button" style={styles.primaryBtnSmall} onClick={() => setIsNewOccurrenceModalOpen(true)}>
            <Plus size={16} /> Nova ocorrência
          </button>
        </div>

        <div style={styles.entFilterCard}>
          <div style={styles.entFilterRow}>
            <div style={styles.entFilterField}>
              <label style={styles.entFilterLabel}>Status</label>
              <select
                style={styles.entSelect}
                value={occFilterStatus}
                onChange={(e) => setOccFilterStatus(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="ABERTA">Aberta</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="RESOLVIDA">Resolvida</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>
            <div style={styles.entFilterField}>
              <label style={styles.entFilterLabel}>Tipo</label>
              <select style={styles.entSelect} value={occFilterType} onChange={(e) => setOccFilterType(e.target.value)}>
                <option value="all">Todos</option>
                <option value="ATRASO">Atraso</option>
                <option value="CLIENTE_AUSENTE">Cliente ausente</option>
                <option value="AVARIA">Avaria</option>
                <option value="ERRO_ENDERECO">Erro de endereço</option>
              </select>
            </div>
            <div style={styles.entFilterField}>
              <label style={styles.entFilterLabel}>Motorista</label>
              <select style={styles.entSelect} value={occFilterDriver} onChange={(e) => setOccFilterDriver(e.target.value)}>
                <option value="all">Todos</option>
                {uniqueOccDrivers.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.entFilterField}>
              <label style={styles.entFilterLabel}>Rota</label>
              <select style={styles.entSelect} value={occFilterRoute} onChange={(e) => setOccFilterRoute(e.target.value)}>
                <option value="all">Todas</option>
                {uniqueOccRoutes.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.entFilterField}>
              <label style={styles.entFilterLabel}>Período</label>
              <select style={styles.entSelect} value={occFilterPeriod} onChange={(e) => setOccFilterPeriod(e.target.value)}>
                <option value="all">Todo o período</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Última semana</option>
                <option value="mes">Último mês</option>
              </select>
            </div>
            <div style={styles.entFilterSearchGrow}>
              <div style={{ ...styles.searchBox, width: '100%', height: 42 }}>
                <Search size={18} color="#94a3b8" />
                <input
                  placeholder="Nº, entrega, descrição…"
                  style={styles.searchInput}
                  value={occSearch}
                  onChange={(e) => setOccSearch(e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              style={{...styles.btnSecondary, height: 42, flexShrink: 0}}
              onClick={() => {
                setOccFilterStatus('all');
                setOccFilterType('all');
                setOccFilterDriver('all');
                setOccFilterRoute('all');
                setOccFilterPeriod('all');
                setOccSearch('');
              }}
            >
              Limpar filtros
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ ...styles.tableCard, padding: 18 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 950, color: '#7c3aed' }}>Tipos mais frequentes</h4>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#475569', fontSize: 13, fontWeight: 600, lineHeight: 1.7 }}>
              {typeRank.slice(0, 4).map(([tp, n]) => (
                <li key={tp}>
                  {occurrenceTypeLabel[tp] || tp}: <strong>{n}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ ...styles.tableCard, padding: 18 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 950, color: '#7c3aed' }}>Motoristas com mais ocorrências</h4>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#475569', fontSize: 13, fontWeight: 600, lineHeight: 1.7 }}>
              {driverRank.slice(0, 4).map(([name, n]) => (
                <li key={name}>
                  {name}: <strong>{n}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={styles.occGrid}>
          <div style={styles.occListSide}>
            {filteredOcc.length === 0 ? (
              <EmptyState title="Sem resultados" description="Ajuste os filtros ou registe uma nova ocorrência." />
            ) : (
              filteredOcc.map((occ) => {
                const active = sel?.id === occ.id;
                const st = occ.status || 'ABERTA';
                return (
                  <div
                    key={occ.id}
                    style={{
                      ...styles.occCard,
                      border: active ? '2px solid #7c3aed' : '1px solid #f1f5f9',
                      boxShadow: active ? '0 8px 28px rgba(91, 33, 182, 0.12)' : undefined,
                    }}
                    onClick={() => setSelectedOccurrence(occ)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 950, color: '#7c3aed' }}>{occ.number || occ.id.slice(0, 8)}</span>
                      <span style={{ ...styles.tagSmall, ...getOccurrenceStatusStyle(st) }}>{occurrenceStatusLabel[st]}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                      <span style={{ ...styles.tagSmall, ...getOccurrenceTypeStyle(occ.type) }}>
                        {occurrenceTypeLabel[occ.type] || occ.type}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{occ.timestamp}</span>
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{occ.description}</h4>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 600 }}>
                      Entrega: <strong style={{ color: '#334155' }}>{occ.delivery_ref || '—'}</strong> · Motorista:{' '}
                      <strong style={{ color: '#334155' }}>{occ.driver_name || '—'}</strong>
                    </p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '6px 0 0', fontWeight: 600 }}>Rota: {occ.route_id}</p>
                  </div>
                );
              })
            )}
          </div>
          <div style={styles.occDetailSide}>
            {!sel ? (
              <div style={styles.occDetailEmpty}>
                <ShieldAlert size={48} color="#e2e8f0" />
                <h3 style={{ color: '#94a3b8', marginTop: 16, fontWeight: 800 }}>Nenhuma ocorrência neste filtro</h3>
                <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, maxWidth: 420, lineHeight: 1.5 }}>
                  Ajuste os filtros ou registe uma nova ocorrência. Quando houver resultados, o detalhe enche este painel
                  automaticamente.
                </p>
              </div>
            ) : (
              <div style={styles.occDetailBody}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: '#7c3aed' }}>{sel.number || sel.id.slice(0, 8)}</p>
                    <h3 style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 950, color: '#0f172a' }}>Detalhe da ocorrência</h3>
                  </div>
                  <span style={{ ...styles.tag, ...getOccurrenceStatusStyle(sel.status || 'ABERTA') }}>
                    {occurrenceStatusLabel[sel.status || 'ABERTA']}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.55, fontWeight: 600 }}>{sel.content_full || sel.description}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, fontWeight: 700, color: '#64748b' }}>
                  <span>
                    Entrega: <strong style={{ color: '#0f172a' }}>{sel.delivery_ref || '—'}</strong>
                  </span>
                  <span>
                    Motorista: <strong style={{ color: '#0f172a' }}>{sel.driver_name || '—'}</strong>
                  </span>
                  <span>
                    Rota: <strong style={{ color: '#0f172a' }}>{sel.route_id}</strong>
                  </span>
                  <span>
                    Responsável: <strong style={{ color: '#0f172a' }}>{sel.responsible}</strong>
                  </span>
                  <span style={{ gridColumn: '1 / -1' }}>
                    Data / hora: <strong style={{ color: '#0f172a' }}>{sel.timestamp}</strong>
                  </span>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase' }}>Fluxo de resolução</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {(
                      [
                        { key: 'ABERTA', label: 'Aberta' },
                        { key: 'EM_ANDAMENTO', label: 'Em análise' },
                        { key: 'RESOLVIDA', label: 'Resolvida' },
                      ] as const
                    ).map((step, i) => {
                      const cur = sel.status || 'ABERTA';
                      const progress =
                        cur === 'RESOLVIDA' ? 3 : cur === 'EM_ANDAMENTO' || cur === 'CRITICA' ? 2 : 1;
                      const stepNum = i + 1;
                      const done = cur === 'RESOLVIDA' || stepNum < progress;
                      const active = cur !== 'RESOLVIDA' && stepNum === progress;
                      return (
                        <React.Fragment key={step.key}>
                          {i > 0 ? <ChevronRight size={16} color="#cbd5e1" /> : null}
                          <span
                            style={{
                              padding: '6px 12px',
                              borderRadius: 10,
                              fontSize: 11,
                              fontWeight: 900,
                              opacity: done || active ? 1 : 0.35,
                              ...(done
                                ? getOccurrenceStatusStyle(step.key)
                                : { backgroundColor: '#f8fafc', color: '#94a3b8' }),
                              outline: active ? '2px solid #7c3aed' : undefined,
                            }}
                          >
                            {step.label}
                          </span>
                        </React.Fragment>
                      );
                    })}
                    {sel.status === 'CRITICA' && (
                      <>
                        <ChevronRight size={16} color="#fecaca" />
                        <span style={{ ...styles.tagSmall, ...getOccurrenceStatusStyle('CRITICA') }}>Crítica</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase' }}>Histórico de ações</h4>
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#64748b', fontSize: 13, fontWeight: 600, lineHeight: 1.65 }}>
                    <li>Registada · {sel.timestamp}</li>
                    <li>Atribuída a {sel.responsible}</li>
                    <li>Última atualização · painel TMS (demo)</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase' }}>Evidências</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button type="button" style={styles.entProofBtn} onClick={() => toastSuccess('Fotos / anexos (demo)')}>
                      <Camera size={16} /> Fotos
                    </button>
                    <button type="button" style={styles.entProofBtn} onClick={() => toastSuccess('Assinatura (demo)')}>
                      <PenLine size={16} /> Assinatura
                    </button>
                    <button type="button" style={styles.entProofBtn} onClick={() => toastSuccess('Observação guardada (demo)')}>
                      <FileText size={16} /> Observação
                    </button>
                  </div>
                </div>

                {sel.status !== 'RESOLVIDA' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                    {sel.status === 'ABERTA' && (
                      <button type="button" style={styles.btnAction} onClick={() => patchOccurrenceStatus(sel.id, 'EM_ANDAMENTO')}>
                        Marcar em análise
                      </button>
                    )}
                    {(sel.status === 'ABERTA' || sel.status === 'EM_ANDAMENTO' || sel.status === 'CRITICA') && (
                      <button
                        type="button"
                        style={styles.btnAction}
                        onClick={() => patchOccurrenceStatus(sel.id, 'RESOLVIDA')}
                      >
                        <Check size={16} /> Resolver
                      </button>
                    )}
                    {sel.status !== 'CRITICA' && (
                      <button
                        type="button"
                        style={styles.btnBlack}
                        onClick={() => patchOccurrenceStatus(sel.id, 'CRITICA')}
                      >
                        <AlertTriangle size={16} /> Marcar crítica
                      </button>
                    )}
                    <button
                      type="button"
                      style={styles.btnSecondary}
                      onClick={() => {
                        occUserClosedDetailRef.current = true;
                        setSelectedOccurrence(null);
                      }}
                    >
                      Fechar painel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const navItems = [
    { id: 'dashboard', label: 'Monitoramento 360º', icon: Activity },
    { id: 'rotas', label: 'Mesa de Rotas (TMS)', icon: Navigation },
    { id: 'entregas', label: 'Entregas', icon: Package },
    { id: 'mapa', label: 'Visão Geográfica', icon: MapIcon },
    { id: 'ocorrencias', label: 'Ocorrências', icon: AlertTriangle },
  ];

  /** Título do cartão do miolo: muda com a aba ativa. */
  const modulePageTitle =
    activeTab === 'dashboard'
      ? 'Logística & Transportes'
      : navItems.find((item) => item.id === activeTab)?.label ?? 'Centro de Comando Logístico';

  return (
    <ModuleLayout
      title={modulePageTitle}
      badge="LOGTA TMS OPERATIONAL"
      items={navItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      tabHref={(id) => `/logistica/${id}`}
    >
      <div style={styles.container}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'rotas' && renderRoutes()}
        {activeTab === 'entregas' && renderDeliveries()}
        {activeTab === 'mapa' && (
          <div
            style={{
              minHeight: 'calc(100vh - 280px)',
              height: 'calc(100vh - 280px)',
              borderRadius: 24,
              overflow: 'hidden',
              border: '1px solid var(--border)',
              backgroundColor: '#fff',
            }}
          >
            <FleetMap variant="commandCenter" />
          </div>
        )}
        {activeTab === 'ocorrencias' && renderOccurrences()}
      </div>

      <LogtaModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Planejar Nova Rota Estratégica" width="750px">
        <form onSubmit={handleCreateRoute} style={styles.formSplit}>
           <div style={styles.formCol}>
              <h4 style={styles.formSecTitle}>Dados da Rota</h4>
              <div style={styles.inputStack}>
                 <label>Identificação da Rota</label>
                 <input placeholder="Ex: Rota Sul - Noturno" value={newRoute.name} onChange={e => setNewRoute({...newRoute, name: e.target.value})} required />
              </div>
              <div style={styles.inputStack}>
                 <label>Placa do Veículo</label>
                 <input placeholder="BRA-2E19" value={newRoute.vehicle_plate} onChange={e => setNewRoute({...newRoute, vehicle_plate: e.target.value})} required />
              </div>
              <div style={styles.inputStack}>
                 <label>Data de Partida</label>
                 <input type="date" value={newRoute.departure_date} onChange={e => setNewRoute({...newRoute, departure_date: e.target.value})} required />
              </div>
              <div style={styles.inputStack}>
                 <label>Hora de Partida</label>
                 <input type="time" value={newRoute.departure_time} onChange={e => setNewRoute({...newRoute, departure_time: e.target.value})} required />
              </div>
           </div>
           <div style={styles.formCol}>
              <h4 style={styles.formSecTitle}>Destinação & SLA</h4>
              <div style={styles.inputStack}>
                 <label>Empresa Destinatária</label>
                 <input placeholder="Centro de Distribuição" value={newRoute.destination_company} onChange={e => setNewRoute({...newRoute, destination_company: e.target.value})} />
              </div>
              <div style={styles.inputStack}>
                 <label>Recebedor Previsto</label>
                 <input placeholder="Gestor do Plantão" value={newRoute.receiver_name} onChange={e => setNewRoute({...newRoute, receiver_name: e.target.value})} />
              </div>
              <div style={styles.inputStack}>
                 <label>Previsão de Chegada (SLA)</label>
                 <input type="time" value={newRoute.expected_arrival_time} onChange={e => setNewRoute({...newRoute, expected_arrival_time: e.target.value})} />
              </div>
              <button type="submit" style={styles.btnPrimaryFull} disabled={loading}>
                 {loading ? 'Processando...' : 'Confirmar & Lançar Rota'}
              </button>
           </div>
        </form>
      </LogtaModal>

      <LogtaModal isOpen={isRouteModalOpen} onClose={() => setIsRouteModalOpen(false)} title="Ficha Técnica da Rota" width="850px">
         {selectedRoute && (
           <div style={styles.modalRouteDetail}>
              <div style={styles.routeHeader}>
                 <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                    <div style={{width: '80px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                       <Navigation size={40} color="var(--primary)" />
                    </div>
                    <div>
                       <h2 style={{margin: 0, fontWeight: 950}}>{selectedRoute.name}</h2>
                       <p style={{margin: 0, color: '#64748b'}}>ID: {selectedRoute.id}</p>
                    </div>
                 </div>
                 <span style={{...styles.statusTag, ...getStatusStyle(selectedRoute.status), height: 'fit-content'}}>{selectedRoute.status}</span>
              </div>
              
              <div style={styles.routeKpiRow}>
                 <div style={styles.routeKpi}><span>MOTORISTA</span><strong>{selectedRoute.driver_name}</strong></div>
                 <div style={styles.routeKpi}><span>VEÍCULO</span><strong>{selectedRoute.vehicle_plate}</strong></div>
                 <div style={styles.routeKpi}><span>SAÍDA</span><strong>{selectedRoute.departure_time}</strong></div>
                 <div style={styles.routeKpi}><span>CARGA</span><strong>{selectedRoute.weight}</strong></div>
              </div>

              <div style={{marginTop: '40px'}}>
                 <h4 style={{fontWeight: 900, marginBottom: '20px'}}>Timeline Geográfica</h4>
                 <div style={{height: '250px', backgroundColor: '#f8fafc', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <p style={{color: '#94a3b8'}}>Mapa da Rota indisponível no protótipo</p>
                 </div>
              </div>

              <div style={{display: 'flex', gap: '12px', marginTop: '40px'}}>
                 <button style={{...styles.btnAction, flex: 1}} onClick={() => updateRouteStatus(selectedRoute.id, 'EM_ROTA')}><Play size={16} /> Iniciar Fluxo</button>
                 <button style={{...styles.btnAction, flex: 1, backgroundColor: '#f59e0b'}} onClick={() => updateRouteStatus(selectedRoute.id, 'ATRASADA')}><Clock size={16} /> Marcar Atraso</button>
                 <button style={{...styles.btnAction, flex: 1, backgroundColor: '#10b981'}} onClick={() => updateRouteStatus(selectedRoute.id, 'CONCLUIDA')}><Check size={16} /> Finalizar</button>
                 <button style={{...styles.btnAction, backgroundColor: '#ef4444'}} onClick={() => handleDeleteRoute(selectedRoute.id)}><Trash2 size={16} /></button>
              </div>
           </div>
         )}
      </LogtaModal>

      <LogtaModal isOpen={isOccurrenceModalOpen} onClose={() => setIsOccurrenceModalOpen(false)} title="Registrar Ocorrência Crítica" width="600px">
         <div style={{padding: '32px'}}>
            <div style={{...styles.inputStack, marginBottom: '24px'}}>
               <label>Tipo de Incidente</label>
               <select style={{height: '50px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0 16px'}}>
                  <option>QUEBRA_VEICULAR</option>
                  <option>ACIDENTE_SEM_VITIMAS</option>
                  <option>ROUBO_FURTO</option>
                  <option>ATRASO_CLIENTE</option>
               </select>
            </div>
            <div style={styles.inputStack}>
               <label>Relato Detalhado</label>
               <textarea style={{height: '120px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px'}} placeholder="Descreva o que aconteceu..." />
            </div>
            <button style={{...styles.btnPrimaryFull, marginTop: '24px'}} onClick={() => { toastSuccess('Ocorrência registrada e disparada para o operacional.'); setIsOccurrenceModalOpen(false); }}>Salvar & Notificar Time</button>
         </div>
      </LogtaModal>

      <LogtaModal
        isOpen={isNewOccurrenceModalOpen}
        onClose={() => setIsNewOccurrenceModalOpen(false)}
        title="+ Nova ocorrência"
        width="560px"
      >
        <form onSubmit={handleCreateOccurrenceLocal} style={{ padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            Registo rápido: entrega, tipo, descrição e responsável. Anexos podem ser adicionados no detalhe.
          </p>
          <div style={styles.inputStack}>
            <label>Entrega</label>
            <select
              required
              style={{ height: 44, border: '1px solid #e2e8f0', borderRadius: 12, padding: '0 14px', fontWeight: 600 }}
              value={newOccForm.delivery_ref}
              onChange={(e) => setNewOccForm({ ...newOccForm, delivery_ref: e.target.value })}
            >
              <option value="">— Selecionar —</option>
              {(deliveries.length > 0 ? deliveries : ENTREGAS_FALLBACK).map((d) => (
                <option key={d.id} value={d.order_number || d.id}>
                  {d.order_number || d.id} · {d.client}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.inputStack}>
            <label>Tipo</label>
            <select
              style={{ height: 44, border: '1px solid #e2e8f0', borderRadius: 12, padding: '0 14px', fontWeight: 600 }}
              value={newOccForm.type}
              onChange={(e) => setNewOccForm({ ...newOccForm, type: e.target.value })}
            >
              <option value="ATRASO">Atraso</option>
              <option value="CLIENTE_AUSENTE">Cliente ausente</option>
              <option value="AVARIA">Avaria</option>
              <option value="ERRO_ENDERECO">Erro de endereço</option>
            </select>
          </div>
          <div style={styles.inputStack}>
            <label>Descrição</label>
            <textarea
              required
              placeholder="O que aconteceu?"
              value={newOccForm.description}
              onChange={(e) => setNewOccForm({ ...newOccForm, description: e.target.value })}
              style={{ minHeight: 100, border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, fontWeight: 600 }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={styles.inputStack}>
              <label>Data / hora</label>
              <input
                type="datetime-local"
                value={newOccForm.date}
                onChange={(e) => setNewOccForm({ ...newOccForm, date: e.target.value })}
                style={{ height: 44, border: '1px solid #e2e8f0', borderRadius: 12, padding: '0 12px', fontWeight: 600 }}
              />
            </div>
            <div style={styles.inputStack}>
              <label>Motorista</label>
              <input
                placeholder="Opcional (herda da entrega)"
                value={newOccForm.driver_name}
                onChange={(e) => setNewOccForm({ ...newOccForm, driver_name: e.target.value })}
                style={{ height: 44, border: '1px solid #e2e8f0', borderRadius: 12, padding: '0 14px', fontWeight: 600 }}
              />
            </div>
          </div>
          <div style={styles.inputStack}>
            <label>Rota (opcional)</label>
            <select
              style={{ height: 44, border: '1px solid #e2e8f0', borderRadius: 12, padding: '0 14px', fontWeight: 600 }}
              value={newOccForm.route_id}
              onChange={(e) => setNewOccForm({ ...newOccForm, route_id: e.target.value })}
            >
              <option value="">— Herdar da entrega —</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.entProofRow}>
            <button
              type="button"
              style={styles.entProofBtn}
              onClick={() => toastSuccess('Anexo foto (demo) — disponível após guardar.')}
            >
              <Camera size={16} /> Foto
            </button>
            <button type="button" style={styles.entProofBtn} onClick={() => toastSuccess('Documento (demo)')}>
              <FileText size={16} /> Documento
            </button>
          </div>
          <button type="submit" style={styles.btnPrimaryFull}>
            Guardar ocorrência
          </button>
        </form>
      </LogtaModal>

      <LogtaModal isOpen={isNewDeliveryModalOpen} onClose={() => setIsNewDeliveryModalOpen(false)} title="+ Nova entrega" width="560px">
        <form onSubmit={handleCreateDeliveryLocal} style={{ padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            Cadastro rápido no painel. Campos essenciais para lançar no fluxo operacional.
          </p>
          <div style={styles.inputStack}>
            <label>Cliente</label>
            <input
              required
              placeholder="Nome ou empresa"
              value={newDeliveryForm.client}
              onChange={(e) => setNewDeliveryForm({ ...newDeliveryForm, client: e.target.value })}
              style={{ height: 44, border: '1px solid #e2e8f0', borderRadius: 12, padding: '0 14px', fontWeight: 600 }}
            />
          </div>
          <div style={styles.inputStack}>
            <label>Endereço</label>
            <input
              required
              placeholder="Rua, número, cidade"
              value={newDeliveryForm.address}
              onChange={(e) => setNewDeliveryForm({ ...newDeliveryForm, address: e.target.value })}
              style={{ height: 44, border: '1px solid #e2e8f0', borderRadius: 12, padding: '0 14px', fontWeight: 600 }}
            />
          </div>
          <div style={styles.inputStack}>
            <label>Data prevista</label>
            <input
              type="date"
              value={newDeliveryForm.date}
              onChange={(e) => setNewDeliveryForm({ ...newDeliveryForm, date: e.target.value })}
              style={{ height: 44, border: '1px solid #e2e8f0', borderRadius: 12, padding: '0 14px', fontWeight: 600 }}
            />
          </div>
          <div style={styles.inputStack}>
            <label>Rota (opcional)</label>
            <select
              value={newDeliveryForm.route_id}
              onChange={(e) => setNewDeliveryForm({ ...newDeliveryForm, route_id: e.target.value })}
              style={{ height: 44, border: '1px solid #e2e8f0', borderRadius: 12, padding: '0 14px', fontWeight: 600 }}
            >
              <option value="">— Selecionar —</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.inputStack}>
            <label>Motorista</label>
            <input
              placeholder="Nome (ou herda da rota)"
              value={newDeliveryForm.driver_name}
              onChange={(e) => setNewDeliveryForm({ ...newDeliveryForm, driver_name: e.target.value })}
              style={{ height: 44, border: '1px solid #e2e8f0', borderRadius: 12, padding: '0 14px', fontWeight: 600 }}
            />
          </div>
          <button type="submit" style={styles.btnPrimaryFull}>
            Guardar entrega
          </button>
        </form>
      </LogtaModal>

      <LogtaModal
        isOpen={isDeliveryDetailOpen}
        onClose={() => {
          setIsDeliveryDetailOpen(false);
          setSelectedDelivery(null);
        }}
        title={selectedDelivery ? `Entrega ${selectedDelivery.order_number || selectedDelivery.id.slice(0, 8)}` : 'Detalhe'}
        width="720px"
      >
        {selectedDelivery && (
          <div style={{ padding: '8px 32px 32px' }}>
            <div style={styles.entDetailGrid}>
              <div style={styles.entDetailBlock}>
                <h4 style={styles.entDetailH}>Dados completos</h4>
                <p style={styles.entDetailP}>
                  <strong>Cliente:</strong> {selectedDelivery.client}
                </p>
                <p style={styles.entDetailP}>
                  <strong>Endereço:</strong> {selectedDelivery.address}
                </p>
                <p style={styles.entDetailP}>
                  <strong>Produto:</strong> {selectedDelivery.product}
                </p>
                <p style={styles.entDetailP}>
                  <strong>Status:</strong>{' '}
                  <span style={{ ...styles.tag, ...getDeliveryStatusStyle(selectedDelivery.status) }}>
                    {deliveryStatusLabel[selectedDelivery.status] || selectedDelivery.status}
                  </span>
                </p>
                <p style={styles.entDetailP}>
                  <strong>Motorista:</strong> {selectedDelivery.driver_name || '—'}
                </p>
                <p style={styles.entDetailP}>
                  <strong>Veículo:</strong> {selectedDelivery.vehicle_plate || '—'}
                </p>
                <p style={styles.entDetailP}>
                  <strong>Rota:</strong>{' '}
                  {routes.find((r) => r.id === selectedDelivery.route_id)?.name || selectedDelivery.route_id || '—'}
                </p>
              </div>
              <div style={styles.entDetailBlock}>
                <h4 style={styles.entDetailH}>Histórico (timeline)</h4>
                <ul style={styles.entTimeline}>
                  <li>Criada · {formatEntregaDateTime(selectedDelivery.scheduled_at)}</li>
                  <li>Confirmada no TMS</li>
                  <li>Última atualização · tempo real (demo)</li>
                </ul>
                <h4 style={{ ...styles.entDetailH, marginTop: 20 }}>Comprovante de entrega</h4>
                <div style={styles.entProofRow}>
                  <button type="button" style={styles.entProofBtn} onClick={() => toastSuccess('Upload de foto (demo)')}>
                    <Camera size={16} /> Foto
                  </button>
                  <button type="button" style={styles.entProofBtn} onClick={() => toastSuccess('Captura de assinatura (demo)')}>
                    <PenLine size={16} /> Assinatura
                  </button>
                </div>
                <p style={{ ...styles.entDetailP, marginTop: 12 }}>
                  <strong>Observação:</strong> Conferir volumes na doca. Campo livre no app motorista.
                </p>
                <h4 style={{ ...styles.entDetailH, marginTop: 20 }}>Ocorrências</h4>
                <p style={styles.entDetailP}>Cliente ausente, atraso ou problema — registe na central.</p>
                <button type="button" style={{ ...styles.primaryBtnSmall, marginTop: 8 }} onClick={() => setIsOccurrenceModalOpen(true)}>
                  <AlertTriangle size={16} /> Registrar ocorrência
                </button>
              </div>
            </div>
            <div style={styles.entModalFooter} role="group" aria-label="Acções da entrega">
              <button type="button" style={styles.entModalFooterBtnGhost} onClick={() => handleTabChange('mapa')}>
                <MapPin size={17} strokeWidth={2.25} />
                Ver no mapa
              </button>
              <button type="button" style={styles.entModalFooterBtnGhost} onClick={() => toastSuccess('Status atualizado (demo)')}>
                <RefreshCw size={17} strokeWidth={2.25} />
                Atualizar status
              </button>
              <button type="button" style={styles.entModalFooterBtnPrimary} onClick={() => toastSuccess('Cliente notificado (demo)')}>
                <MessageCircle size={17} strokeWidth={2.25} />
                Notificar cliente
              </button>
            </div>
          </div>
        )}
      </LogtaModal>
    </ModuleLayout>
  );
};

const styles: Record<string, any> = {
  container: { flex: 1, padding: '0 0 40px 0' },
  content: { display: 'flex', flexDirection: 'column', gap: '24px' },
  
  // TMS KPI
  tmsKpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' },
  tmsKpiCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  tmsKpiLabel: { fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' },
  tmsKpiMain: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' },
  tmsKpiValue: { fontSize: '28px', fontWeight: 950, color: '#0f172a', margin: 0 },
  tmsKpiIcon: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tmsKpiSub: { fontSize: '11px', color: '#64748b', marginTop: '12px', fontWeight: 600 },

  tmsActionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '12px 20px', borderRadius: '16px', border: '1px solid var(--border)', flex: 1 },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', flex: 1, fontWeight: 600, fontSize: '14px' },
  tmsButtonGroup: { display: 'flex', gap: '12px' },
  btnSecondary: { backgroundColor: 'var(--primary-glow)', border: '1px solid rgba(124, 58, 237, 0.2)', color: 'var(--primary)', padding: '12px 20px', borderRadius: '14px', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  primaryBtnSmall: { backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '14px', fontWeight: 900, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },

  tmsSplitView: {
    display: 'grid',
    gridTemplateColumns: 'minmax(400px, min(520px, 38vw)) minmax(0, 1fr)',
    gap: '24px',
    height: 'calc(100vh - 350px)',
    minHeight: 420,
    width: '100%',
    minWidth: 0,
  },
  tmsListSide: {
    backgroundColor: 'white',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
    width: '100%',
  },
  tmsListHeader: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  tmsScrollArea: {
    flex: 1,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    minHeight: 0,
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  tmsRouteItem: { padding: '16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s', ':hover': { backgroundColor: '#f1f5f9' } },
  tmsItemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  tmsItemName: { fontSize: '14px', fontWeight: 900, color: '#0f172a' },
  tmsItemMeta: { display: 'flex', gap: '16px', marginBottom: '12px' },
  tmsMetaUnit: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: 700 },
  tmsItemProgress: { display: 'flex', alignItems: 'center', gap: '12px' },
  tmsProgressBar: { flex: 1, height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' },
  tmsProgressFill: { height: '100%', backgroundColor: 'var(--primary)' },
  tmsProgressText: { fontSize: '10px', fontWeight: 900, color: '#94a3b8' },

  tmsMapSide: { borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)', minWidth: 0, minHeight: 0 },
  tmsMapContainer: { width: '100%', height: '100%', backgroundColor: '#f1f5f9' },

  // Table generic
  tableCard: { backgroundColor: 'white', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px 24px', fontSize: '14px', borderBottom: '1px solid #f1f5f9', color: '#1e293b' },
  tr: { transition: 'background-color 0.2s', ':hover': { backgroundColor: '#fcfdfe' } },
  uSub: { fontSize: '12px', color: '#94a3b8', margin: 0 },
  tag: { padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 900 },
  btnTableIcon: { padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#f8fafc', color: '#94a3b8', cursor: 'pointer' },
  actionBtn: { padding: '8px 16px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' },
  actionBtnPrimary: { padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' },

  // Dash specifics
  dashPageStack: { display: 'flex', flexDirection: 'column', gap: '24px' },
  dashRefKpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  /** Quatro KPIs numa linha (ex.: aba Rotas) */
  dashRefKpiGrid4: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '20px' },
  dashRefKpiGrid5: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '16px' },

  entIntroCard: {
    backgroundColor: '#faf5ff',
    border: '1px solid #ede9fe',
    borderRadius: 24,
    padding: '22px 26px',
    boxShadow: '0 8px 28px rgba(91, 33, 182, 0.06)',
  },
  entIntroKicker: { margin: 0, fontSize: 12, fontWeight: 900, color: '#7c3aed', letterSpacing: '0.04em', textTransform: 'uppercase' },
  entIntroTitle: { margin: '8px 0 0', fontSize: 22, fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em' },
  entIntroBody: { margin: '10px 0 0', fontSize: 14, color: '#475569', lineHeight: 1.55, fontWeight: 600 },
  entIntroBullets: { display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: 14, fontSize: 13, fontWeight: 800, color: '#334155' },

  entIntelRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 18px',
    backgroundColor: '#fff',
    border: '1px solid #e9e4f7',
    borderRadius: 16,
    fontSize: 13,
    color: '#475569',
    fontWeight: 600,
    lineHeight: 1.45,
  },

  entFilterCard: {
    backgroundColor: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 24,
    padding: '14px 16px',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box' as const,
  },
  /** Uma linha: filtros + busca + acções (scroll horizontal em ecrãs estreitos). */
  entFilterRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'flex-end',
    flexWrap: 'nowrap' as const,
    gap: 10,
    width: '100%',
    minWidth: 0,
    overflowX: 'auto' as const,
    paddingBottom: 2,
    WebkitOverflowScrolling: 'touch' as const,
  },
  entFilterField: {
    flex: '0 0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    minWidth: 112,
    maxWidth: 148,
  },
  entFilterSearchGrow: {
    flex: '1 1 180px',
    minWidth: 160,
    maxWidth: 280,
    display: 'flex',
    alignItems: 'flex-end',
  },
  entFilterBtnGroup: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  entFilterGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 },
  entFilterLabel: { fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 0, letterSpacing: '0.04em' },
  entSelect: { height: 42, border: '1px solid #e2e8f0', borderRadius: 12, padding: '0 10px', fontWeight: 700, fontSize: 12, color: '#0f172a', width: '100%', boxSizing: 'border-box' as const, minWidth: 0 },
  entFilterActions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 },

  entLinksRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  entLinkChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 12,
    border: '1px solid #e9e4f7',
    backgroundColor: '#fff',
    fontSize: 12,
    fontWeight: 800,
    color: '#5b21b6',
    cursor: 'pointer',
  },

  entTableHeader: { padding: '22px 24px', borderBottom: '1px solid #f1f5f9' },

  entDetailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  entDetailBlock: { minWidth: 0 },
  entDetailH: { margin: '0 0 12px', fontSize: 13, fontWeight: 950, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.02em' },
  entDetailP: { margin: '0 0 8px', fontSize: 14, color: '#334155', lineHeight: 1.45 },
  entTimeline: { margin: 0, paddingLeft: 18, color: '#64748b', fontSize: 13, fontWeight: 600, lineHeight: 1.7 },
  entProofRow: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  entProofBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    fontWeight: 800,
    fontSize: 13,
    color: '#0f172a',
    cursor: 'pointer',
  },

  /** Barra de acções do modal de entrega — grelha alinhada, secundário + primário. */
  entModalFooter: {
    marginTop: 28,
    paddingTop: 20,
    borderTop: '1px solid #f1f5f9',
    width: '100%',
    boxSizing: 'border-box' as const,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
  },
  entModalFooterBtnGhost: {
    height: 46,
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#334155',
    fontWeight: 800,
    fontSize: 13,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  },
  entModalFooterBtnPrimary: {
    height: 46,
    borderRadius: 14,
    border: 'none',
    backgroundColor: '#5b21b6',
    color: '#ffffff',
    fontWeight: 900,
    fontSize: 13,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(91, 33, 182, 0.28)',
  },
  dashRefMiddleGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' },
  dashRefBottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  dashRefCard: { backgroundColor: 'white', borderRadius: '24px', border: '1px solid var(--border)', padding: '24px' },
  dashRefCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  dashRefCardH: { fontSize: '16px', fontWeight: 950, color: '#0f172a', margin: 0 },
  dashRefCardMeta: { display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 0 0' },
  dashRefMetaSep: { fontSize: '13px', color: '#64748b', fontWeight: 600 },
  dashRefChip: { backgroundColor: '#ecfdf5', color: '#10b981', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 900 },
  dashRefCardHint: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' },
  dashRefPeriodWrap: { backgroundColor: 'rgba(245, 245, 245, 1)', padding: '4px', borderRadius: '10px', display: 'flex', gap: '2px' },
  dashRefPeriodBtn: { backgroundColor: 'transparent', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, color: '#64748b', cursor: 'pointer' },
  dashRefPeriodBtnActive: { backgroundColor: 'white', color: '#0f172a', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  dashRefCtaFull: { width: '100%', marginTop: '20px', padding: '14px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '14px', fontSize: '13px', fontWeight: 900, color: '#7c3aed', cursor: 'pointer' },
  dashRefSelectLike: { fontSize: '12px', fontWeight: 800, color: '#64748b', cursor: 'pointer' },
  dashTableTabs: { display: 'flex', gap: '16px', padding: '12px 22px', borderBottom: '1px solid #f8fafc' },
  dashTab: { backgroundColor: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, color: '#94a3b8', cursor: 'pointer', paddingBottom: '12px' },
  dashTabActive: { color: '#7c3aed', borderBottom: '2px solid #7c3aed' },
  dashMiniTable: { width: '100%', borderCollapse: 'collapse' },
  dashTh: { textAlign: 'left', padding: '12px 22px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' },
  dashTd: { padding: '14px 22px', borderBottom: '1px solid #f8fafc', fontSize: '14px' },
  dashStatusChip: { padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 900, letterSpacing: '0.02em' },
  dashRefStackHint: { fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0' },
  dashRefLegendInline: { display: 'flex', gap: '16px', marginTop: '16px', alignItems: 'center' },
  dashRefDot: { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', marginRight: '6px' },
  dashIconGhost: { border: 'none', background: 'transparent', padding: '4px', cursor: 'pointer' },

  // Occ
  occHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  occGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(300px, min(400px, 34vw)) minmax(0, 1fr)',
    gap: 24,
    width: '100%',
    minWidth: 0,
    alignItems: 'stretch',
    minHeight: 520,
  },
  occListSide: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    minWidth: 0,
    maxHeight: 'min(640px, 72vh)',
    minHeight: 360,
    paddingRight: 4,
  },
  occCard: { padding: '20px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', cursor: 'pointer' },
  tagSmall: { padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 950 },
  occDetailSide: {
    minWidth: 0,
    minHeight: 360,
    display: 'flex',
    flexDirection: 'column' as const,
    alignSelf: 'stretch',
  },
  occDetailEmpty: {
    flex: 1,
    width: '100%',
    minHeight: 320,
    boxSizing: 'border-box' as const,
    backgroundColor: '#fff',
    borderRadius: 24,
    border: '1px solid var(--border)',
    overflow: 'hidden',
    padding: 32,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center' as const,
  },
  occDetailBody: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    minHeight: 320,
    boxSizing: 'border-box' as const,
    backgroundColor: '#fff',
    borderRadius: 24,
    border: '1px solid var(--border)',
    overflow: 'auto' as const,
    padding: 28,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },

  // Modal
  formSplit: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', padding: '32px' },
  formCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formSecTitle: { margin: '0 0 8px 0', fontSize: '13px', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 950 },
  inputStack: { display: 'flex', flexDirection: 'column', gap: '6px' },
  btnPrimaryFull: { height: '54px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 950, fontSize: '15px', cursor: 'pointer', marginTop: '12px' },
  modalRouteDetail: { padding: '32px' },
  routeHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '32px' },
  statusTag: { padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 900 },
  routeKpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9' },
  routeKpi: { display: 'flex', flexDirection: 'column', gap: '4px', span: { fontSize: '10px', color: '#94a3b8', fontWeight: 800 }, strong: { fontSize: '14px', fontWeight: 900, color: '#1e293b' } },
  btnAction: { height: '48px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '0 24px', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)' },
  btnBlack: { height: '48px', backgroundColor: '#000000', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '0 24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' },
  progressBase: { height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: '3px' }
};

export default Logistics;
