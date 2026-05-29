import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PackageSearch, Activity, Clock, UserPlus, FileText, 
  Search as SearchIcon, User, Home, Key, Database, 
  Terminal, Layers, Settings, Cpu,
  Truck, MapPin, CheckCircle, TrendingUp, Building,
  CreditCard, ShoppingCart, Globe, Server, DollarSign, Plus, Shield, Wifi, Download, FileSpreadsheet,
  UserCheck, Zap, Calendar, CheckCircle2, UploadCloud, RefreshCcw,
  Pencil, Trash2, Lock, Eye, Copy, Mail, ShieldCheck, BarChart3, ChevronRight, Share2, BookOpen, X,
  ArrowLeft, ExternalLink
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import HubEntityAvatar from '@shared/components/HubEntityAvatar';
import { resolveCompanyLogo, resolveDriverPhoto } from '@hub/lib/logtaEntityMedia';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';
import HubSupabaseChart from '@shared/components/HubSupabaseChart';
import LogtaModal from '@shared/components/Modal';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import { onlyDigits, maskCnpj, validateCnpj } from '@shared/lib/brDocuments';
import { useWhiteLabel } from '@core/context/WhiteLabelContext';
import { 
  HUB_PAGE_TITLE, 
  HUB_PAGE_SUBTITLE, 
  HUB_SECTION_TITLE, 
  HUB_DESCRIPTION_TEXT 
} from '@hub/styles/hubPageTypography';

import { HUB_MASTER_PRODUCT_SHELL } from '@hub/styles/hubMasterProductShell';

import { MasterProductProjectHeader } from '@hub/components/MasterProductProjectHeader';

import { supabase } from '@core/lib/supabase';
import LogtaClientProfile from './LogtaClientProfile';
import { LogtaRouteDetail } from './LogtaRouteDetail';
import { LogtaDriverDetail } from './LogtaDriverDetail';
import { LogtaInvoiceDetail } from './LogtaInvoiceDetail';
import { LogtaDeliveryDetail } from './LogtaDeliveryDetail';
import { LogtaVehicleDetail } from './LogtaVehicleDetail';
import LogtaUserDetail from './LogtaUserDetail';

type TabId = 
  | 'overview'
  | 'routes' | 'deliveries' | 'drivers' | 'fleet' | 'tracking'
  | 'clients' | 'billing' | 'orders' 
  | 'infrastructure'
  | 'finance' 
  | 'settings';

type TabItem = { id: TabId; label: string; icon: React.ElementType };
type TabSection = { title: string; items: TabItem[] };

const EMPTY_LOGTA_CLIENT_FORM = {
  name: '',
  razaoSocial: '',
  cnpj: '',
  email: '',
  phone: '',
  contactName: '',
  subdomain: '',
  cidade: '',
  uf: '',
  plan: 'Start',
};

function slugifyCompanyName(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'empresa'
  );
}

function mapDbCompanyToLogtaClient(c: Record<string, unknown>) {
  const settings = (c.settings as Record<string, unknown> | undefined) ?? {};
  return {
    id: String(c.id),
    name: String(c.name || 'Empresa sem nome'),
    plan: String(c.plan || 'Logta Pro'),
    routes:
      typeof settings.routes_count === 'number'
        ? settings.routes_count
        : Math.floor(Math.random() * 2000) + 500,
    vehicles:
      typeof settings.vehicles_count === 'number'
        ? settings.vehicles_count
        : Math.floor(Math.random() * 150) + 20,
    logoUrl: resolveCompanyLogo(
      { id: String(c.id), logo_url: c.logo_url as string | undefined, name: String(c.name) },
      { includeMock: false },
    ),
    email: (c.email as string) || (settings.email as string),
    phone: (c.phone as string) || (settings.phone as string),
  };
}

function formatRouteVolume(routes: number): string {
  if (routes >= 1000) {
    const k = routes / 1000;
    const formatted = k >= 10 ? Math.round(k).toString() : k.toFixed(1).replace(/\.0$/, '');
    return `${formatted}k rotas`;
  }
  return `${routes.toLocaleString('pt-BR')} rotas`;
}

function planTierShort(plan?: string): string {
  const p = (plan || '').toLowerCase();
  if (p.includes('enterprise')) return 'Enterprise';
  if (p.includes('start')) return 'Start';
  if (p.includes('pro')) return 'Pro';
  const trimmed = (plan || '').replace(/^logta\s*/i, '').trim();
  return trimmed || 'Pro';
}

const TOP_COMPANY_METRIC_ICONS = [Building, Truck, PackageSearch, Building, Truck] as const;

const MAP_BUBBLE_LAYOUT = [
  { top: '25%', left: '12%', delay: '0s', plan: 'Start', color: '#F4F7FE', text: '#0061FF', border: '#D0E0FF' },
  { top: '15%', left: '62%', delay: '1.5s', plan: 'Ent', color: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  { top: '55%', left: '38%', delay: '0.7s', plan: 'Pro', color: '#FFFBEB', text: '#B45309', border: '#FEF3C7' },
  { top: '62%', left: '72%', delay: '2.2s', plan: 'Pro', color: '#FEF2F2', text: '#B91C1C', border: '#FEE2E2' },
] as const;

/** Mapa funcional das abas — usado na Visão Geral (atalhos + documentação resumida). */
const ADMIN_MODULE_DIGEST: Array<{ group: string; id: TabId; title: string; summary: string }> = [
  { group: 'PROJETO', id: 'overview', title: 'Visão Geral', summary: 'KPIs do ecossistema, tenants em destaque e fila de eventos da API — ponto de controle executivo.' },
  { group: 'PROJETO', id: 'clients', title: 'Empresas', summary: 'Cadastro e saúde dos tenants: planos, limites de frota, abertura do perfil operacional do cliente.' },
  { group: 'PROJETO', id: 'billing', title: 'Planos & Assinaturas', summary: 'Cobranças, links de checkout, comprovantes e políticas de bloqueio — espelho financeiro do SaaS Logta.' },
  { group: 'OPERAÇÃO', id: 'routes', title: 'Rotas', summary: 'Monitoramento de viagens, status e drill-down para detalhe da rota (mapa, progresso, log de eventos).' },
  { group: 'OPERAÇÃO', id: 'deliveries', title: 'Entregas', summary: 'SLA de última milha, destinatário e rastreio operacional até o canhoto digital.' },
  { group: 'OPERAÇÃO', id: 'drivers', title: 'Motoristas', summary: 'Condutores vinculados aos tenants, bloqueio e vínculo com rotas ativas.' },
  { group: 'OPERAÇÃO', id: 'fleet', title: 'Frota', summary: 'Placas, telemetria agregada e inventário por transportadora.' },
  { group: 'OPERAÇÃO', id: 'tracking', title: 'Rastreamento ao vivo', summary: 'Mapa em tela cheia com painel de logs posicionado abaixo para acompanhamento contínuo.' },
  { group: 'INFRAESTRUTURA', id: 'infrastructure', title: 'Infraestrutura', summary: 'API Gateway, banco, storage, filas e backups — painéis técnicos e modais de detalhe.' },
  { group: 'FINANCEIRO', id: 'finance', title: 'Faturamento & Créditos', summary: 'Receita, inadimplência e movimentação de créditos no ecossistema.' },
  { group: 'GERENCIAMENTO', id: 'settings', title: 'Configurações', summary: 'White label, autenticação, segurança, permissões e auditoria do Master.' },
];

const LogtaAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tabSections: TabSection[] = [
    {
      title: 'Projeto',
      items: [
        { id: 'overview', label: 'Visão Geral', icon: Home },
        { id: 'clients', label: 'Empresas', icon: Building },
        { id: 'billing', label: 'Planos & Assinaturas', icon: CreditCard },
      ]
    },
    {
      title: 'Operação',
      items: [
        { id: 'routes', label: 'Rotas', icon: PackageSearch },
        { id: 'deliveries', label: 'Entregas', icon: CheckCircle },
        { id: 'drivers', label: 'Motoristas', icon: UserCheck },
        { id: 'fleet', label: 'Frota', icon: Truck },
        { id: 'tracking', label: 'Rastreamento Ao Vivo', icon: MapPin },
      ]
    },
    {
      title: 'Infraestrutura',
      items: [
        { id: 'infrastructure', label: 'Infraestrutura', icon: Server },
      ]
    },
    {
      title: 'Financeiro',
      items: [
        { id: 'finance', label: 'Faturamento & Créditos', icon: DollarSign },
      ]
    },
    {
      title: 'Gerenciamento',
      items: [
        { id: 'settings', label: 'Configurações', icon: Settings },
      ]
    },
  ];

  const allValidTabs = tabSections.flatMap(s => s.items.map(i => i.id));
  const rawTab = searchParams.get('tab') as any;
  const activeTab: TabId = allValidTabs.includes(rawTab) ? rawTab : 'overview';
  const activeClientId = searchParams.get('clientId');
  const activeRouteId = searchParams.get('routeId');
  const activeDriverId = searchParams.get('driverId');
  const activeInvoiceId = searchParams.get('invoiceId');
  const activeDeliveryId = searchParams.get('deliveryId');
  const activeVehicleId = searchParams.get('vehicleId');
  const activeUserId = searchParams.get('userId');
  const activeProfileTab = searchParams.get('profileTab') as 'operacoes' | 'financeiro' | 'frota' | 'cadastro' | 'seguranca' | null;
  const trackingRouteFilter = searchParams.get('trackRoute');
  const trackingClientFilter = searchParams.get('trackClient');
  const fleetRowHighlight = searchParams.get('fleetRow');

  const clearEntityParams = () => {
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.delete('clientId');
      n.delete('profileTab');
      n.delete('routeId');
      n.delete('routeClient');
      n.delete('driverId');
      n.delete('invoiceId');
      n.delete('deliveryId');
      n.delete('vehicleId');
      n.delete('userId');
      n.delete('trackRoute');
      n.delete('trackClient');
      n.delete('fleetRow');
      return n;
    }, { replace: true });
  };

  const setActiveTab = (tab: TabId) => {
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.delete('clientId');
      n.delete('profileTab');
      n.delete('routeId');
      n.delete('routeClient');
      n.delete('driverId');
      n.delete('invoiceId');
      n.delete('deliveryId');
      n.delete('vehicleId');
      n.delete('trackRoute');
      n.delete('trackClient');
      n.delete('fleetRow');
      if (tab === 'overview') n.delete('tab');
      else n.set('tab', tab);
      return n;
    }, { replace: true });
  };

  const selectClient = (id: string, profileTab?: string) => {
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.delete('routeId');
      n.delete('routeClient');
      n.delete('driverId');
      n.delete('invoiceId');
      n.delete('deliveryId');
      n.delete('vehicleId');
      n.delete('trackRoute');
      n.delete('trackClient');
      n.delete('fleetRow');
      n.set('clientId', id);
      if (profileTab) n.set('profileTab', profileTab);
      else n.delete('profileTab');
      return n;
    }, { replace: true });
  };

  const selectEntity = (paramName: 'routeId' | 'driverId' | 'invoiceId' | 'deliveryId' | 'vehicleId', id: string) => {
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.delete('clientId');
      n.delete('profileTab');
      n.delete('routeId');
      n.delete('routeClient');
      n.delete('driverId');
      n.delete('invoiceId');
      n.delete('deliveryId');
      n.delete('vehicleId');
      n.delete('userId');
      n.delete('trackRoute');
      n.delete('trackClient');
      n.delete('fleetRow');
      n.set(paramName, id);
      return n;
    }, { replace: true });
  };

  /** Abre detalhe de rota sempre com a empresa da linha (evita misturar tenants na URL). */
  const selectRoute = (id: string, clientName: string) => {
    const cleanId = id.replace('#', '');
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.delete('clientId');
      n.delete('profileTab');
      n.delete('driverId');
      n.delete('invoiceId');
      n.delete('deliveryId');
      n.delete('vehicleId');
      n.delete('userId');
      n.delete('trackRoute');
      n.delete('trackClient');
      n.delete('fleetRow');
      n.set('routeId', cleanId);
      n.set('routeClient', encodeURIComponent(clientName));
      return n;
    }, { replace: true });
  };

  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({ ...EMPTY_LOGTA_CLIENT_FORM });
  const [savingClient, setSavingClient] = useState(false);
  const [isLogdockModalOpen, setIsLogdockModalOpen] = useState(false);
  const [logdockConfig, setLogdockConfig] = useState({
    cpu: 8,
    ram: 16,
    disk: 500,
    replicaCount: 2
  });
  const { settings, updateSettings } = useWhiteLabel();
  const whiteLabel = settings.logta;
  const setWhiteLabel = (fn: (prev: any) => any) => {
    const next = fn(whiteLabel);
    updateSettings('logta', next);
  };
  
  const [clients, setClients] = useState<any[]>([]);
  const topCompaniesByVolume = useMemo(
    () => [...clients].sort((a, b) => (b.routes || 0) - (a.routes || 0)).slice(0, 5),
    [clients],
  );
  const [clientSearch, setClientSearch] = useState('');
  const [routeSearch, setRouteSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [deliverySearch, setDeliverySearch] = useState('');
  const [financeSearch, setFinanceSearch] = useState('');
  const [infraTab, setInfraTab] = useState<'api' | 'database' | 'storage' | 'queues' | 'backups'>('api');
  const [settingsTab, setSettingsTab] = useState<'general' | 'auth' | 'security' | 'permissions' | 'audit'>('general');
  const [overviewApiRange, setOverviewApiRange] = useState<'24h' | '7d'>('24h');

  const [isApiGatewayModalOpen, setIsApiGatewayModalOpen] = useState(false);

  type BillingSubRow = {
    id: string;
    client: string;
    val: string;
    date: string;
    status: string;
    color: string;
    checkoutUrl: string;
    receiptPublicPath: string;
    blocked: boolean;
  };
  const [billingSubRows, setBillingSubRows] = useState<BillingSubRow[]>([
    { id: '1', client: 'Transportadora Falcão', val: 'R$ 4.500,00', date: '15/05/2026', status: 'Pago', color: '#0061FF', checkoutUrl: 'https://sandbox.asaas.com/c/logta_falcao_demo', receiptPublicPath: '/master/logta?receipt=inv-falcao-4500', blocked: false },
    { id: 'demo-11', client: 'Expresso Federal', val: 'R$ 8.200,00', date: '18/05/2026', status: 'Pendente', color: '#F59E0B', checkoutUrl: 'https://sandbox.asaas.com/c/logta_expresso_demo', receiptPublicPath: '/master/logta?receipt=inv-expresso-8200', blocked: false },
    { id: 'demo-12', client: 'Rápido Trans', val: 'R$ 2.100,00', date: '10/05/2026', status: 'Pago', color: '#0061FF', checkoutUrl: 'https://sandbox.asaas.com/c/logta_rapido_demo', receiptPublicPath: '/master/logta?receipt=inv-rapido-2100', blocked: false },
  ]);

  type DriverAdminRow = { key: string; driverId: string; name: string; client: string; cnh: string; time: string; statusColor: string; blocked: boolean };
  const [driverAdminRows, setDriverAdminRows] = useState<DriverAdminRow[]>([
    { key: 'd0', driverId: '1', name: 'Ricardo Silva', client: 'Transportadora Falcão', cnh: 'Válida (Cat E)', time: 'Hoje, 10h', statusColor: '#0061FF', blocked: false },
    { key: 'd1', driverId: 'demo-11', name: 'Ana Oliveira', client: 'Expresso Federal', cnh: 'Válida (Cat D)', time: 'Ontem, 14h', statusColor: '#0061FF', blocked: false },
    { key: 'd2', driverId: 'demo-12', name: 'Carlos Souza', client: 'Rápido Trans', cnh: 'Exame Vencendo', time: 'Há 2 dias', statusColor: '#F59E0B', blocked: false },
    { key: 'd3', driverId: 'demo-13', name: 'Pedro Mendes', client: 'TransNorte Cargo', cnh: 'Válida (Cat E)', time: 'Agora mesmo', statusColor: '#0061FF', blocked: true },
  ]);

  type FleetListRow = { key: string; plate: string; model: string; client: string; active: string; vehicleId: string };
  const [fleetListRows] = useState<FleetListRow[]>([
    { key: 'f0', plate: 'ABC-1234', model: 'Scania R450 Highline', client: 'Transportadora Falcão', active: '98% ativo', vehicleId: '1' },
    { key: 'f1', plate: 'DEF-5678', model: 'Volvo FH 540', client: 'Expresso Federal', active: '94% ativo', vehicleId: 'demo-11' },
    { key: 'f2', plate: 'GHI-9012', model: 'Mercedes Axor', client: 'Rápido Trans', active: '89% ativo', vehicleId: 'demo-12' },
    { key: 'f3', plate: 'JKL-3456', model: 'VW Constellation', client: 'TransNorte Cargo', active: '92% ativo', vehicleId: 'demo-13' },
  ]);
  const [activities, setActivities] = useState<any[]>([
    { id: 'act-1', event: 'Login Administrativo', client: 'Transportadora Falcão', detail: 'Acesso via IP 201.82.3.45', time: 'Agora mesmo', type: 'client', refId: '1' },
    { id: 'act-2', event: 'Nova Rota Vinculada', client: 'Expresso Federal', detail: 'Motorista: Ana Oliveira', time: 'Há 12 min', type: 'driver', refId: 'demo-11' },
    { id: 'act-3', event: 'Recarga Concluída', client: 'Alfa Transportes', detail: 'Compra de 500 créditos de IA', time: 'Hoje, 14:15', type: 'invoice', refId: 'demo-20' }
  ]);

  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [selectedClusterClient, setSelectedClusterClient] = useState<any>(null);
  const [isClusterClientModalOpen, setIsClusterClientModalOpen] = useState(false);
  const [newPlanCharge, setNewPlanCharge] = useState({ 
    selectedProducts: [] as string[],
    amount: '', 
    method: 'PIX', 
    dueDate: new Date().toISOString().split('T')[0],
    isRecurring: true,
    email: 'financeiro@logta.com.br',
    coupon: ''
  });

  const handleGenerateLogtaPlan = async () => {
    setSavingPlan(true);
    try {
      const clientName = 'Checkout público — plano Logta';
      const clientEmail = newPlanCharge.email || 'financeiro@logta.com.br';
      
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/hub-core/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          client: clientName,
          email: clientEmail,
          phone: '',
          cpfCnpj: '',
          amount: newPlanCharge.amount,
          due_date: newPlanCharge.dueDate,
          method: newPlanCharge.method.toLowerCase(),
          description: `Cobrança Plano Logta - ${newPlanCharge.selectedProducts.join(', ')}`,
          is_subscription: true
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Erro ao gerar no Asaas');

      const { error } = await supabase.from('master_payments').insert([{
        client_name: clientName,
        amount: parseFloat(newPlanCharge.amount),
        status: 'PENDENTE',
        method: newPlanCharge.method,
        due_date: newPlanCharge.dueDate,
        invoice_url: result.link,
        asaas_id: result.payment_id,
        metadata: {
          products: newPlanCharge.selectedProducts,
          is_recurring: true,
          type: 'plan'
        }
      }]);

      if (error) throw error;

      toastSuccess('Plano Logta gerado com sucesso! Copiando link...');
      navigator.clipboard.writeText(result.link);
      
      setIsAddPlanModalOpen(false);
      setNewPlanCharge({
        selectedProducts: [],
        amount: '',
        method: 'PIX',
        dueDate: new Date().toISOString().split('T')[0],
        isRecurring: true,
        email: 'financeiro@logta.com.br',
        coupon: ''
      });
      
      toastSuccess('Link de pagamento copiado!');
    } catch (err: any) {
      toastError(err.message || 'Erro ao gerar cobrança');
    } finally {
      setSavingPlan(false);
    }
  };

  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [financeForm, setFinanceForm] = useState({
    clientId: '1',
    operationType: 'subscription', // subscription, credits, trial
    planId: 'Start',
    amount: '',
    paymentMethod: 'boleto', // boleto, credit_card, pix, manual
    isAutoRenew: true
  });
  const [financeHistory, setFinanceHistory] = useState([
    { id: 'f-1', client: 'Transportadora Falcão', op: 'Assinatura Pro', method: 'Boleto', value: 'R$ 4.500,00', status: 'Pago', date: 'Hoje, 09:30' },
    { id: 'f-2', client: 'Expresso Federal', op: 'Créditos IA (500)', method: 'PIX', value: 'R$ 800,00', status: 'Pago', date: 'Ontem, 14:15' },
    { id: 'f-3', client: 'Rápido Trans', op: 'Assinatura Start', method: 'Cartão', value: 'R$ 800,00', status: 'Pendente', date: 'Há 2 dias' },
    { id: 'f-4', client: 'Alfa Transportes', op: 'Dias de Teste (15)', method: 'Isenção Manual', value: 'R$ 0,00', status: 'Liberado', date: 'Há 5 dias' }
  ]);

  const handleFinanceSave = () => {
    toastSuccess(`Operação de ${financeForm.operationType === 'subscription' ? 'Assinatura' : financeForm.operationType === 'credits' ? 'Créditos IA' : 'Isenção'} processada com sucesso!`);
    
    const methodStr = financeForm.paymentMethod === 'boleto' ? 'Boleto Gerado' : 
                      financeForm.paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 
                      financeForm.paymentMethod === 'pix' ? 'PIX Copia e Cola' : 'Liberação Direta';
    
    setFinanceHistory([{ 
      id: `f-${Math.random()}`, 
      client: clients.find(c => c.id === financeForm.clientId)?.name || 'Cliente', 
      op: financeForm.operationType === 'subscription' ? `Assinatura ${financeForm.planId}` : financeForm.operationType === 'credits' ? `Créditos IA` : `Trial/Isenção`, 
      method: methodStr, 
      value: financeForm.amount ? `R$ ${financeForm.amount},00` : 'R$ 0,00', 
      status: financeForm.paymentMethod === 'manual' ? 'Liberado' : 'Pendente', 
      date: 'Agora mesmo' 
    }, ...financeHistory]);
    
    setIsFinanceModalOpen(false);
  };

  const defaultLogtaMocks = useMemo(
    () => [
      { id: '1', name: 'Transportadora Falcão', plan: 'Logta Pro', routes: 4500, vehicles: 450, logoUrl: resolveCompanyLogo({ id: '1' }) },
      { id: 'demo-11', name: 'Expresso Federal', plan: 'Logta Enterprise', routes: 3150, vehicles: 320, logoUrl: resolveCompanyLogo({ id: 'demo-11' }) },
      { id: 'demo-12', name: 'Rápido Trans', plan: 'Logta Pro', routes: 2100, vehicles: 210, logoUrl: resolveCompanyLogo({ id: 'demo-12' }) },
      { id: 'demo-13', name: 'TransNorte Cargo', plan: 'Logta Start', routes: 1800, vehicles: 120, logoUrl: resolveCompanyLogo({ id: 'demo-13' }) },
      { id: 'demo-20', name: 'Alfa Transportes', plan: 'Logta Pro', routes: 1200, vehicles: 90, logoUrl: resolveCompanyLogo({ id: 'demo-20' }) },
    ],
    [],
  );

  const fetchLogtaClients = useCallback(async () => {
    const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('[LogtaAdmin] fetch companies:', error.message);
      setClients(defaultLogtaMocks);
      return;
    }

    if (data && data.length > 0) {
      const filtered = data
        .filter(
          (c: { origin?: string; plan?: string }) =>
            c.origin === 'logta' || c.plan?.toUpperCase().includes('LOGTA') || (!c.origin && !c.plan),
        )
        .map((c) => mapDbCompanyToLogtaClient(c as Record<string, unknown>));

      setClients(filtered.length === 0 ? defaultLogtaMocks : filtered);
    } else {
      setClients(defaultLogtaMocks);
    }
  }, [defaultLogtaMocks]);

  useEffect(() => {
    fetchLogtaClients();
  }, [fetchLogtaClients]);

  const handleExport = (type: 'excel' | 'pdf') => {
    toastSuccess(`Gerando relatório em ${type.toUpperCase()}... O download foi iniciado com sucesso!`);
  };

  const handleAddClient = async () => {
    const name = newClient.name.trim();
    const email = newClient.email.trim();
    if (!name || !email) {
      toastError('Informe o nome da empresa e o e-mail de acesso.');
      return;
    }

    const docDigits = onlyDigits(newClient.cnpj);
    if (docDigits.length > 0 && (docDigits.length !== 14 || !validateCnpj(docDigits))) {
      toastError('CNPJ inválido. Use 14 dígitos ou deixe o campo em branco.');
      return;
    }

    setSavingClient(true);
    const toastId = toastLoading('Cadastrando empresa no Logta…');

    try {
      const companyId = crypto.randomUUID();
      const slugBase = slugifyCompanyName(name);
      const subdomain = (newClient.subdomain.trim() || slugBase)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 48);
      const planLabel = `Logta ${newClient.plan}`;
      const cnpjFormatted = docDigits.length === 14 ? maskCnpj(docDigits) : null;
      const phoneDigits = onlyDigits(newClient.phone);

      const { error: compError } = await supabase.from('companies').insert({
        id: companyId,
        name,
        slug: `${slugBase}-${Math.random().toString(36).slice(2, 6)}`,
        subdomain,
        plan: planLabel,
        status: 'active',
        origin: 'logta',
        email,
        phone: phoneDigits || null,
        hub_api_key: `hub_${Math.random().toString(36).slice(2, 15)}`,
        settings: {
          razao_social: newClient.razaoSocial.trim() || name,
          cnpj: cnpjFormatted,
          party_kind: 'PJ',
          email,
          phone: newClient.phone.trim(),
          contact_name: newClient.contactName.trim(),
          cidade: newClient.cidade.trim(),
          uf: newClient.uf.trim().toUpperCase().slice(0, 2),
          logta_plan: newClient.plan,
          routes_count: 0,
          vehicles_count: 0,
          modules: ['logistics', 'finance', 'crm', 'fretes', 'frota'],
          provisioned_at: new Date().toISOString(),
        },
      });

      if (compError) throw compError;

      const { error: empError } = await supabase.from('empresas').insert({
        id: companyId,
        nome_fantasia: name,
        razao_social: newClient.razaoSocial.trim() || name,
        cnpj: cnpjFormatted,
        email_contato: email,
        plano_atual: newClient.plan.toLowerCase(),
        status: 'ativo',
      });

      if (empError) {
        console.warn('[LogtaAdmin] espelho empresas:', empError.message);
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        company_id: companyId,
        email,
        full_name: newClient.contactName.trim() || `Admin ${name}`,
        role: 'ADMIN',
        status: 'active',
      });

      if (profileError) {
        console.warn('[LogtaAdmin] perfil admin:', profileError.message);
      }

      const mapped = mapDbCompanyToLogtaClient({
        id: companyId,
        name,
        plan: planLabel,
        logo_url: null,
        email,
        phone: phoneDigits,
        settings: { routes_count: 0, vehicles_count: 0, email },
      });

      setClients((prev) => {
        const withoutDup = prev.filter((c) => c.id !== companyId);
        return [mapped, ...withoutDup];
      });

      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          event: 'Nova Empresa Logta',
          client: name,
          detail: `Plano ${newClient.plan} · ${email}`,
          time: 'Agora mesmo',
          type: 'client',
          refId: companyId,
        },
        ...prev,
      ]);

      toastDismiss(toastId);
      toastSuccess(`Empresa "${name}" cadastrada. Ela já aparece em Empresas.`);
      setIsAddClientOpen(false);
      setNewClient({ ...EMPTY_LOGTA_CLIENT_FORM });
      await fetchLogtaClients();
    } catch (err: unknown) {
      toastDismiss(toastId);
      const message = err instanceof Error ? err.message : 'Não foi possível criar a empresa.';
      toastError(message);
    } finally {
      setSavingClient(false);
    }
  };

  return (
    <div style={s.container}>
      <style>{`
        /* Alinhamento à esquerda em todas as tabelas deste módulo */
        .logta-admin-table th,
        .logta-admin-table td {
          text-align: left !important;
        }
        .logta-admin-table th:first-child:has(> input[type="checkbox"]),
        .logta-admin-table td:first-child:has(> input[type="checkbox"]) {
          text-align: center !important;
        }
        .logta-admin-table .logta-admin-cell-flex-end {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          justify-content: flex-start !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .logta-admin-table .logta-admin-actions-inner {
          display: flex !important;
          justify-content: flex-start !important;
          align-items: center !important;
          gap: 0 !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .logta-admin-table .logta-admin-inline-flex-end {
          display: flex !important;
          align-items: center !important;
          gap: 0 !important;
          justify-content: flex-start !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .logta-admin-table .logta-admin-cell-flex-end > span {
          font-weight: 600 !important;
        }
        .hub-table-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-bottom: 1px solid #F1F5F9;
          transition: all 0.2s ease;
          border-radius: 16px;
          cursor: pointer;
        }
        .hub-table-row:hover {
          background-color: #F8FAFC;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          border-color: transparent;
        }
        .hub-grid-header {
          display: grid;
          padding: 0 20px 12px;
          font-size: 11px;
          font-weight: 800;
          color: #94A3B8;
          text-transform: uppercase;
          border-bottom: 2px solid #F1F5F9;
        }
        .hub-grid-row {
          display: grid;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #F1F5F9;
          transition: all 0.2s ease;
          border-radius: 16px;
          cursor: pointer;
          background-color: #FFFFFF;
        }
        .hub-grid-row:hover {
          background-color: #F8FAFC;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          border-color: transparent;
        }
      `}</style>
      {/* Secondary Sidebar */}
      <div style={s.secondarySidebar}>
        <div style={{ ...s.sidebarHeader, flexDirection: 'column', alignItems: 'stretch', gap: '14px' }}>
          {searchParams.get('context') === 'logdock' && (
            <button 
              onClick={() => navigate('/master/logdock?tab=customers')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8,
                border: '1px solid #D0E0FF', backgroundColor: '#F0F9FF', color: '#0061FF',
                fontSize: 11, fontWeight: 800, cursor: 'pointer', marginBottom: 8, width: '100%'
              }}
            >
              <ArrowLeft size={12} /> VOLTAR AO LOGDOCK
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackageSearch size={18} color="#0061FF" />
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, color: '#0F172A' }}>Logta Admin</span>
            </div>
            <button 
              type="button"
              onClick={() => setIsAddClientOpen(true)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '100px',
                border: 'none',
                background: '#0061FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#FFFFFF',
                padding: 0,
                boxShadow: '0 4px 12px rgba(0, 97, 255, 0.3)'
              }}
              title="Adicionar Cliente"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
        <div style={{ height: '1px', backgroundColor: '#F3F4F6' }} />
        <div style={s.sidebarNav}>
          {tabSections.map((sec) => (
            <div key={sec.title} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'none', letterSpacing: '0.03em', padding: '4px 10px 6px' }}>
                {sec.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {sec.items.map((item) => (
                  <button
                    key={item.id}
                    style={{
                      ...s.sidebarBtn,
                      backgroundColor: activeTab === item.id ? '#F3F4F6' : 'transparent',
                      color: activeTab === item.id ? '#1F2937' : '#475569',
                    }}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon size={14} style={{ opacity: activeTab === item.id ? 1 : 0.7, flexShrink: 0, color: activeTab === item.id ? '#0061FF' : '#64748B' }} />
                    <span style={{ fontWeight: activeTab === item.id ? 500 : 400, fontSize: '12px' }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div style={s.contentArea}>


        <div style={(activeClientId || activeRouteId || activeDriverId || activeInvoiceId || activeDeliveryId || activeVehicleId || activeUserId) ? { ...s.content, padding: 0, gap: 0, marginLeft: 0, marginRight: 0 } : s.content}>
          {activeClientId ? (
            <LogtaClientProfile 
              clientId={activeClientId} 
              initialTab={activeProfileTab || undefined}
              onBack={clearEntityParams}
              companySnapshot={clients.find(c => c.id === activeClientId) ?? null}
            />
          ) : activeRouteId ? (
            <LogtaRouteDetail routeId={activeRouteId} onBack={clearEntityParams} />
          ) : activeDriverId ? (
            <LogtaDriverDetail driverId={activeDriverId} onBack={clearEntityParams} />
          ) : activeInvoiceId ? (
            <LogtaInvoiceDetail invoiceId={activeInvoiceId} onBack={clearEntityParams} />
          ) : activeDeliveryId ? (
            <LogtaDeliveryDetail deliveryId={activeDeliveryId} onBack={clearEntityParams} />
          ) : activeVehicleId ? (
            <LogtaVehicleDetail vehicleId={activeVehicleId} onBack={clearEntityParams} />
          ) : activeUserId ? (
            <LogtaUserDetail userId={activeUserId} onBack={clearEntityParams} />
          ) : (
            <>
              {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

              <MasterProductProjectHeader
                title={whiteLabel.name}
                domainUrl="logta.com.br"
                domainLabel="logta.com.br"
                logoUrl={whiteLabel.logo}
                avatarName={whiteLabel.name}
                toastOnCopy="Copiado: logta.com.br"
                actions={
                  <button 
                    onClick={() => window.open('http://localhost:5173', '_blank')}
                    className="hub-premium-pill primary"
                  >
                    <ExternalLink size={16} /> ACESSAR LOGTA SAAS
                  </button>
                }
              />

              {/* 4 Metric Cards (FULL WIDTH!) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px',
                  marginBottom: '24px',
                  alignItems: 'start',
                  boxSizing: 'border-box',
                }}
              >
                <HubSupabaseChart label="EMPRESAS ATIVAS" value="49" data={[40, 42, 45, 45, 46, 48, 49, 49, 49, 49]} />
                <HubSupabaseChart label="ROTAS (HOJE)" value="1.240" data={[10, 30, 40, 70, 80, 90, 100, 110, 120, 124]} />
                <HubSupabaseChart label="ENTREGAS (SLA)" value="97.8%" data={[95, 96, 95, 97, 98, 97, 98, 97, 98, 97.8]} />
                <HubSupabaseChart label="FATURAMENTO (MÊS)" value="R$ 142k" data={[30, 25, 80, 50, 48, 48, 45, 15, 40, 5]} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Top 5 empresas (volume)</div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                    gap: '20px',
                  }}
                >
                  {topCompaniesByVolume.map((company, i) => {
                    const Icon = TOP_COMPANY_METRIC_ICONS[i % TOP_COMPANY_METRIC_ICONS.length];
                    const tier = planTierShort(company.plan);
                    return (
                      <div
                        key={company.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectClient(company.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            selectClient(company.id);
                          }
                        }}
                        style={{ cursor: 'pointer', minWidth: 0 }}
                      >
                        <HubMetricCard
                          label={company.name}
                          value={formatRouteVolume(company.routes || 0)}
                          icon={Icon}
                          iconVariant={i % 2 === 0 ? 'soft' : 'solid'}
                          accent="#0061FF"
                          topRight={
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                fontSize: 13,
                                fontWeight: 800,
                                color: '#0061FF',
                              }}
                            >
                              {tier}
                            </span>
                          }
                          style={{ width: '100%' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Two-column Dashboard Body — coluna direita limitada + divisor quando gap de coluna = 0 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.35fr) minmax(300px, min(482px, 100%))',
                  columnGap: 0,
                  rowGap: 0,
                  alignItems: 'stretch',
                  width: '100%',
                  marginBottom: '24px',
                }}
              >
                
                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, paddingRight: '27px' }}>
                  {/* 3x2 Metadata Grid */}
                  {/* Canvas grid with floating engine node */}
                  <div style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '24px',
                    backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)',
                    backgroundSize: '18px 18px',
                    backgroundColor: '#FDFDFD',
                    minHeight: '360px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                    padding: '0 20px 18px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <style>{`
                      @keyframes bubbleFloat {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-8px); }
                        100% { transform: translateY(0px); }
                      }
                    `}</style>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', marginBottom: '10px', zIndex: 5, gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.35, flex: '1 1 200px', minWidth: 0 }}>
                        Empresas ativas no ecossistema Logta
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#0061FF', display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0061FF' }} /> Dados em tempo real
                      </span>
                    </div>

                    <div style={{ flex: 1, position: 'relative', width: '100%', marginTop: '4px', minHeight: '220px' }}>
                      {topCompaniesByVolume.slice(0, 4).map((cl, bubbleIdx) => {
                        const layout = MAP_BUBBLE_LAYOUT[bubbleIdx] || MAP_BUBBLE_LAYOUT[0];
                        const vol = formatRouteVolume(cl.routes || 0).replace(' rotas', '');
                        return (
                        <div
                          key={cl.id}
                          onClick={() => {
                            setSelectedClusterClient({
                              ...cl,
                              name: cl.name,
                              plan: cl.plan,
                              vol: `${vol} operacionais`,
                            });
                            setIsClusterClientModalOpen(true);
                          }}
                          style={{
                            position: 'absolute',
                            top: layout.top,
                            left: layout.left,
                            animation: `bubbleFloat 4s ease-in-out ${layout.delay} infinite`,
                            cursor: 'pointer',
                            zIndex: 10
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'scale(1.08)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <div style={{ position: 'relative' }}>
                              <HubEntityAvatar
                                kind="company"
                                src={resolveCompanyLogo(cl)}
                                name={cl.name}
                                size={48}
                                accent="#0061FF"
                                style={{
                                  borderRadius: '50%',
                                  boxShadow: '0 8px 18px -5px rgba(0, 0, 0, 0.06)',
                                  border: `1.5px solid ${layout.border}`,
                                }}
                              />
                              <span
                                aria-hidden
                                style={{
                                  position: 'absolute',
                                  bottom: '-3px',
                                  right: '-3px',
                                  background: '#0061FF',
                                  border: '2px solid #FFF',
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  boxShadow: '0 0 6px rgba(0, 97, 255, 0.5)',
                                }}
                              />
                            </div>
                            <div
                              style={{
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(4px)',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>{cl.name.split(' ')[0]}</div>
                              <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textAlign: 'center', marginTop: '1px' }}>{vol}</div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN — resumo API + feed + logs (layout em faixa, mais legível) */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    minWidth: 0,
                    width: '100%',
                    maxWidth: '482px',
                    justifySelf: 'stretch',
                    alignSelf: 'stretch',
                    padding: '24px 0 38px 28px',
                    marginTop: 0,
                    marginBottom: 0,
                    borderLeft: '1px solid #E2E8F0',
                    minHeight: 'min(731px, 85vh)',
                    maxHeight: 'none',
                    overflowY: 'auto',
                    boxSizing: 'border-box',
                    color: '#0F172A',
                  }}
                >
                  {/* Total API — cartão em coluna: número em destaque + período */}
                  <div
                    style={{
                      background: 'linear-gradient(180deg, #FAFBFF 0%, #FFFFFF 100%)',
                      border: '1px solid #E2E8F0',
                      borderRadius: '18px',
                      padding: '18px 20px 20px',
                      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Volume de API
                        </div>
                        <div
                          style={{
                            marginTop: '6px',
                            fontSize: '28px',
                            fontWeight: 900,
                            letterSpacing: '-0.03em',
                            color: '#0F172A',
                            fontVariantNumeric: 'tabular-nums',
                            lineHeight: 1.1,
                          }}
                        >
                          {overviewApiRange === '24h' ? '34.201' : '241.893'}
                        </div>
                        <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}>chamadas no período</div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '4px',
                          padding: '4px',
                          borderRadius: '12px',
                          background: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          flexShrink: 0,
                        }}
                      >
                        {(['24h', '7d'] as const).map(range => (
                          <button
                            key={range}
                            type="button"
                            onClick={() => setOverviewApiRange(range)}
                            style={{
                              border: 'none',
                              borderRadius: '9px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              background: overviewApiRange === range ? '#FFFFFF' : 'transparent',
                              color: overviewApiRange === range ? '#0F172A' : '#64748B',
                              boxShadow: overviewApiRange === range ? '0 1px 3px rgba(15,23,42,0.12)' : 'none',
                              transition: 'background 0.15s, color 0.15s',
                            }}
                          >
                            {range === '24h' ? '24 h' : '7 dias'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>
                      <span style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '14px' }}>
                        <span style={{ width: '3px', height: '6px', backgroundColor: '#94A3B8', borderRadius: '2px' }} />
                        <span style={{ width: '3px', height: '12px', backgroundColor: '#6366F1', borderRadius: '2px' }} />
                        <span style={{ width: '3px', height: '9px', backgroundColor: '#94A3B8', borderRadius: '2px' }} />
                        <span style={{ width: '3px', height: '14px', backgroundColor: '#94A3B8', borderRadius: '2px' }} />
                      </span>
                      Comparado ao período anterior (mock)
                    </div>
                  </div>

                  {/* Feed ao vivo — linhas tipo cartão */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '18px',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
                      flex: '1 1 auto',
                      minHeight: '200px',
                    }}
                  >
                    <div
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #F1F5F9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'linear-gradient(90deg, #F8FAFC 0%, #FFFFFF 100%)',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Eventos em tempo real</span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#0046C7',
                          background: '#EFF6FF',
                          padding: '5px 10px',
                          borderRadius: '999px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        AO VIVO
                      </span>
                    </div>
                    <div
                      style={{
                        padding: '14px 16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        flex: 1,
                        minHeight: '180px',
                        maxHeight: '320px',
                        overflowY: 'auto',
                      }}
                    >
                      {[
                        { event: 'Viagem iniciada', time: 'Agora', color: '#0061FF' },
                        { event: 'Entrou na BR-116', time: '2 min', color: '#3B82F6' },
                        { event: 'Parada no posto', time: '12 min', color: '#EF4444' },
                        { event: 'Chegada confirmada', time: '15 min', color: '#0061FF' },
                      ].map((evt, i) => {
                        const company = topCompaniesByVolume[i];
                        if (!company) return null;
                        return (
                          <div
                            key={company.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              borderRadius: '14px',
                              border: '1px solid #F1F5F9',
                              background: '#FAFBFC',
                              overflow: 'hidden',
                              padding: '10px 12px',
                              borderLeft: `4px solid ${evt.color}`,
                            }}
                          >
                            <HubEntityAvatar
                              kind="company"
                              src={resolveCompanyLogo(company)}
                              name={company.name}
                              size={36}
                              accent="#0061FF"
                            />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#4338CA', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  {company.name}
                                </span>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                                  {evt.time}
                                  {evt.time !== 'Agora' ? ' atrás' : ''}
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', lineHeight: 1.35 }}>{evt.event}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Logs de infra — terminal compacto */}
                  <div
                    style={{
                      background: 'linear-gradient(165deg, #0F172A 0%, #1E293B 100%)',
                      borderRadius: '18px',
                      border: '1px solid #334155',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
                      flex: '0 0 auto',
                    }}
                  >
                    <div
                      style={{
                        padding: '14px 18px',
                        borderBottom: '1px solid #334155',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#F8FAFC',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>Monitoramento de infra</span>
                      <Terminal size={17} color="#34D399" />
                    </div>
                    <div
                      style={{
                        padding: '14px 16px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: '11px',
                        lineHeight: 1.5,
                        color: '#94A3B8',
                        maxHeight: '220px',
                        overflowY: 'auto',
                      }}
                    >
                      <div style={{ color: '#34D399' }}>[OK] Database health check: healthy (4.2ms)</div>
                      <div>[INFO] Storage bucket sync completed</div>
                      <div>[INFO] Rolling update: pod-logta-core-1 restarted</div>
                      <div style={{ color: '#FBBF24' }}>[WARN] High load on Redis cache (82%)</div>
                      <div>[INFO] Backup snapshot snap-20240514 created</div>
                      <div style={{ color: '#34D399' }}>[OK] API Gateway listening on port 443</div>
                    </div>
                  </div>
                </div>

              </div>

              <div
                style={{
                  ...s.card,
                  marginTop: '46px',
                  marginBottom: '46px',
                  padding: '37px 0 38px 27px',
                  borderRadius: '16px',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '38px', paddingRight: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338CA', flexShrink: 0 }}>
                    <BookOpen size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ ...HUB_SECTION_TITLE, fontSize: '17px', margin: 0, letterSpacing: '-0.02em' }}>Projeto — o que cada parte do Hub faz</h3>
                    <p style={{ ...HUB_DESCRIPTION_TEXT, margin: '8px 0 0', maxWidth: '900px', lineHeight: 1.55 }}>
                      O menu lateral organiza o Master em <strong>Projeto</strong> (dados mestres e monetização), <strong>Operação</strong> (logística em tempo real),
                      <strong>Infraestrutura</strong> (stack técnica), <strong>Financeiro</strong> e <strong>Gerenciamento</strong>. Abaixo, atalhos diretos: cada card altera a aba ativa e mantém o fluxo dentro do mesmo painel.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(228px, 1fr))', gap: '10px' }}>
                  {ADMIN_MODULE_DIGEST.map(m => (
                    <button
                      key={`${m.group}-${m.id}`}
                      type="button"
                      onClick={() => setActiveTab(m.id)}
                      style={{
                        textAlign: 'left',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        border: '1px solid #E2E8F0',
                        background: '#FAFBFC',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#0061FF';
                        e.currentTarget.style.background = '#F0F7FF';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.background = '#FAFBFC';
                      }}
                    >
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', letterSpacing: '0.06em' }}>{m.group}</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        {m.title}
                        <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#475569', lineHeight: 1.45 }}>{m.summary}</span>
                    </button>
                  ))}
                </div>
                </div>
              </div>
            </div>
          )}

          {/* TABS: OPERAÇÃO - ROTAS */}
          {activeTab === 'routes' && (
            <div style={s.tabContent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <HubSupabaseChart label="ROTAS ATIVAS" value="1.240" data={[40, 50, 60, 50, 40, 50, 60, 50, 40, 50]} />
                <HubSupabaseChart label="EMPRESAS ATIVAS" value="42 / 49" data={[30, 40, 50, 60, 70, 80, 70, 60, 50, 40]} />
                <HubSupabaseChart label="PONTUALIDADE" value="97.8%" data={[20, 30, 40, 50, 60, 70, 80, 90, 80, 70]} />
                <HubSupabaseChart label="ALERTAS" value="12" data={[10, 20, 30, 40, 50, 40, 30, 20, 10, 5]} />
              </div>

              <div style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={s.searchBox}>
                      <SearchIcon size={14} color="#94A3B8" />
                      <input type="text" placeholder="Search routes..." value={routeSearch} onChange={e => setRouteSearch(e.target.value)} style={s.searchInput} />
                    </div>
                    <select style={{ ...s.searchBox, appearance: 'none', paddingRight: '32px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748B\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                      <option>All statuses</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="hub-premium-pill secondary" onClick={() => toastSuccess('Exportando rotas para Excel...')}>
                      <FileSpreadsheet size={14} color="#0046C7" /> Excel
                    </button>
                    <button className="hub-premium-pill secondary" onClick={() => toastSuccess('Exportando rotas para PDF...')}>
                      <FileText size={14} color="#DC2626" /> PDF
                    </button>
                    <button className="hub-premium-pill secondary" onClick={() => toastSuccess('Sincronizando...')}>
                      <RefreshCcw size={14} /> Refresh
                    </button>
                    <button className="hub-premium-pill primary">
                      <Plus size={14} /> New route
                    </button>
                  </div>
                </div>

                <table style={s.table} className="logta-admin-table">
                  <thead>
                    <tr>
                      <th style={{ ...s.th, width: '40px', textAlign: 'center' }}><input type="checkbox" style={{ accentColor: '#0061FF' }} /></th>
                      <th style={s.th}>EMPRESA</th>
                      <th style={s.th}>CÓD. ROTA</th>
                      <th style={s.th}>ORIGEM/DESTINO</th>
                      <th style={s.th}>CARGA</th>
                      <th style={s.th}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: '#RT-9021', client: 'Transportadora Falcão', from: 'São Paulo, SP', to: 'Rio de Janeiro, RJ', cargo: 'Eletrônicos', p: 75, status: 'Em Trânsito', color: '#3B82F6' },
                      { id: '#RT-8912', client: 'Expresso Federal', from: 'Curitiba, PR', to: 'Porto Alegre, RS', cargo: 'Automotivo', p: 100, status: 'Concluída', color: '#0061FF' },
                      { id: '#RT-9055', client: 'Rápido Trans', from: 'Belo Horizonte, MG', to: 'Brasília, DF', cargo: 'Alimentos', p: 30, status: 'Em Trânsito', color: '#3B82F6' },
                      { id: '#RT-9101', client: 'TransNorte Cargo', from: 'Campinas, SP', to: 'Salvador, BA', cargo: 'Fármacos', p: 0, status: 'Agendada', color: '#F59E0B' },
                    ].filter(r => 
                      r.client.toLowerCase().includes(routeSearch.toLowerCase()) || 
                      r.id.toLowerCase().includes(routeSearch.toLowerCase()) ||
                      r.from.toLowerCase().includes(routeSearch.toLowerCase()) ||
                      r.to.toLowerCase().includes(routeSearch.toLowerCase())
                    ).map((r, idx) => (
                      <tr 
                        key={idx} 
                        style={{ ...s.tr, cursor: 'pointer' }}
                        onClick={() => selectRoute(r.id.replace('#', ''), r.client)}
                      >
                        <td style={s.tdCheckbox} onClick={e => e.stopPropagation()}><input type="checkbox" style={{ accentColor: '#0061FF' }} /></td>
                        <td style={s.td}><span style={{ fontWeight: '700', color: '#0061FF' }}>{r.client}</span></td>
                        <td style={s.td}><span style={{ fontWeight: '600', color: '#64748B', fontFamily: 'monospace' }}>{r.id}</span></td>
                        <td style={s.td}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
                            <span style={{ fontWeight: '700', color: '#0F172A' }}>{r.from}</span>
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>➔ {r.to}</span>
                          </div>
                        </td>
                        <td style={s.td}><span style={s.badge}>{r.cargo}</span></td>
                        <td style={s.td}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: r.color }}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABS: OPERAÇÃO - ENTREGAS */}
          {activeTab === 'deliveries' && (
            <div style={s.tabContent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <HubSupabaseChart label="TOTAL HOJE" value="16.730" data={[40, 50, 60, 50, 40, 50, 60, 50, 40, 50]} />
                <HubSupabaseChart label="EM ROTA" value="4.250" data={[30, 40, 50, 60, 70, 80, 70, 60, 50, 40]} />
                <HubSupabaseChart label="CONCLUÍDAS" value="12.480" data={[20, 30, 40, 50, 60, 70, 80, 90, 80, 70]} />
                <HubSupabaseChart label="DEVOLUÇÕES" value="14" data={[10, 5, 2, 8, 3, 1, 4, 2, 0, 1]} />
              </div>

              <div style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={s.searchBox}>
                      <SearchIcon size={14} color="#94A3B8" />
                      <input type="text" placeholder="Search companies..." value={deliverySearch} onChange={e => setDeliverySearch(e.target.value)} style={s.searchInput} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={s.actionBtn} onClick={() => toastSuccess('Exportando entregas para Excel...')}>
                      <FileSpreadsheet size={14} color="#0046C7" /> Excel
                    </button>
                    <button style={s.actionBtn} onClick={() => toastSuccess('Exportando relatórios de entrega para PDF...')}>
                      <FileText size={14} color="#DC2626" /> PDF
                    </button>
                    <button style={s.actionBtn} onClick={() => toastSuccess('Sincronizando...')}>
                      <RefreshCcw size={14} /> Refresh
                    </button>
                    <button style={{ ...s.actionBtn, background: '#0061FF', color: '#FFF', borderColor: '#0061FF' }}>
                      <Plus size={14} /> New delivery
                    </button>
                  </div>
                </div>

                <table style={s.table} className="logta-admin-table">
                  <thead>
                    <tr>
                      <th style={{ ...s.th, width: '40px', textAlign: 'center' }}><input type="checkbox" style={{ accentColor: '#0061FF' }} /></th>
                      <th style={s.th}>EMPRESA / CLIENTE</th>
                      <th style={s.th}>CONCLUÍDAS / TOTAL</th>
                      <th style={s.th}>SLA ATUAL</th>
                      <th style={s.th}>STATUS</th>
                      <th style={s.th}>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { client: 'Transportadora Falcão', delivered: 4200, total: 4500, sla: '93.3%', color: '#0061FF' },
                      { client: 'Expresso Federal', delivered: 3100, total: 3150, sla: '98.4%', color: '#0061FF' },
                      { client: 'Rápido Trans', delivered: 1800, total: 2100, sla: '85.7%', color: '#F59E0B' },
                    ].filter(item => 
                      item.client.toLowerCase().includes(deliverySearch.toLowerCase())
                    ).map((item, i) => (
                      <tr 
                        key={i} 
                        style={{ ...s.tr, cursor: 'pointer' }}
                        onClick={() => selectEntity('deliveryId', i === 0 ? '1' : `demo-${i + 10}`)}
                      >
                        <td style={s.tdCheckbox} onClick={e => e.stopPropagation()}><input type="checkbox" style={{ accentColor: '#0061FF' }} /></td>
                        <td style={s.td}>
                          <div className="logta-admin-cell-flex-end">
                            <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '10px', fontWeight: 800 }}>{item.client[0]}</div>
                            <span style={s.clientName}>{item.client}</span>
                          </div>
                        </td>
                        <td style={s.td}><span style={s.stat}>{item.delivered} / {item.total}</span></td>
                        <td style={s.td}><span style={{ fontWeight: '700', color: item.color }}>{item.sla}</span></td>
                        <td style={s.td}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: item.color }}>
                            {item.sla === '98.4%' ? 'Excelente' : item.sla === '93.3%' ? 'Normal' : 'Atenção'}
                          </span>
                        </td>
                        <td style={s.td} onClick={e => e.stopPropagation()}>
                          <div className="logta-admin-actions-inner">
                            <button style={s.actionBtn} title="Ver Painel"><TrendingUp size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
          )}

          {/* TABS: OPERAÇÃO - MOTORISTAS */}
          {activeTab === 'drivers' && (
            <div style={s.tabContent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <HubSupabaseChart label="MOTORISTAS CADASTRADOS" value={String(driverAdminRows.length)} data={[40, 50, 60, 50, 40, 50, 60, 50, 40, 50]} />
                <HubSupabaseChart label="ATIVOS HOJE" value={String(driverAdminRows.filter(d => !d.blocked).length)} data={[30, 40, 50, 60, 70, 80, 70, 60, 50, 40]} />
                <HubSupabaseChart label="BLOQUEADOS" value={String(driverAdminRows.filter(d => d.blocked).length)} data={[10, 20, 30, 40, 50, 40, 30, 20, 10, 5]} />
                <HubSupabaseChart label="ROTAS (24H)" value="1.240" data={[20, 30, 40, 50, 60, 70, 80, 90, 80, 70]} />
              </div>
              <div style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={s.searchBox}>
                      <SearchIcon size={14} color="#94A3B8" />
                      <input type="text" placeholder="Search drivers..." value={driverSearch} onChange={e => setDriverSearch(e.target.value)} style={s.searchInput} />
                    </div>
                    <select style={{ ...s.searchBox, appearance: 'none', paddingRight: '32px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748B\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                      <option>All companies</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" style={s.actionBtn} onClick={() => toastSuccess('Exportando motoristas para Excel...')}>
                      <FileSpreadsheet size={14} color="#0046C7" /> Excel
                    </button>
                    <button type="button" style={s.actionBtn} onClick={() => toastSuccess('Exportando perfil de motoristas para PDF...')}>
                      <FileText size={14} color="#DC2626" /> PDF
                    </button>
                    <button type="button" style={s.actionBtn} onClick={() => toastSuccess('Sincronizando...')}>
                      <RefreshCcw size={14} /> Refresh
                    </button>
                    <button type="button" style={{ ...s.actionBtn, background: '#0061FF', color: '#FFF', borderColor: '#0061FF' }}>
                      <Plus size={14} /> Add driver
                    </button>
                  </div>
                </div>

                <table style={s.table} className="logta-admin-table">
                  <thead>
                    <tr>
                      <th style={{ ...s.th, width: '40px', textAlign: 'center' }}><input type="checkbox" style={{ accentColor: '#0061FF' }} /></th>
                      <th style={s.th}>MOTORISTA</th>
                      <th style={s.th}>EMPRESA EMPREGADORA</th>
                      <th style={s.th}>STATUS CNH</th>
                      <th style={s.th}>ÚLTIMA VIAGEM</th>
                      <th style={s.th}>BLOQUEIO</th>
                      <th style={s.th}>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverAdminRows.filter(d =>
                      d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
                      d.client.toLowerCase().includes(driverSearch.toLowerCase())
                    ).map((d) => (
                      <tr
                        key={d.key}
                        style={{ ...s.tr, cursor: 'pointer', opacity: d.blocked ? 0.6 : 1 }}
                        onClick={() => selectEntity('driverId', d.driverId)}
                      >
                        <td style={s.tdCheckbox} onClick={e => e.stopPropagation()}><input type="checkbox" style={{ accentColor: '#0061FF' }} /></td>
                        <td style={s.td}>
                          <div className="logta-admin-cell-flex-end">
                            <HubEntityAvatar
                              kind="driver"
                              src={resolveDriverPhoto(d.driverId)}
                              name={d.name}
                              size={28}
                              accent="#0061FF"
                            />
                            <span style={s.clientName}>{d.name}</span>
                          </div>
                        </td>
                        <td style={s.td}><span style={{ fontWeight: '600', color: '#0061FF' }}>{d.client}</span></td>
                        <td style={s.td}>
                          <div className="logta-admin-inline-flex-end">
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.statusColor }}/>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', marginLeft: '6px' }}>{d.cnh}</span>
                          </div>
                        </td>
                        <td style={s.td}><span style={s.stat}>{d.time}</span></td>
                        <td style={s.td}><span style={{ fontSize: '11px', fontWeight: 800, color: d.blocked ? '#B91C1C' : '#0061FF' }}>{d.blocked ? 'Bloqueado' : 'Liberado'}</span></td>
                        <td style={s.td} onClick={e => e.stopPropagation()}>
                          <div className="logta-admin-actions-inner">
                            <button type="button" style={s.actionBtn} title="Editar" onClick={() => { const n = window.prompt('Nome do motorista', d.name); if (n) setDriverAdminRows(rows => rows.map(r => r.key === d.key ? { ...r, name: n } : r)); toastSuccess('Dados atualizados (UI).'); }}><Pencil size={14} /></button>
                            <button type="button" style={s.actionBtn} title="Bloquear / desbloquear" onClick={() => setDriverAdminRows(rows => rows.map(r => r.key === d.key ? { ...r, blocked: !r.blocked } : r))}><Lock size={14} /></button>
                            <button type="button" style={s.actionBtn} title="Excluir" onClick={() => { if (!window.confirm(`Excluir ${d.name} da lista?`)) return; setDriverAdminRows(rows => rows.filter(r => r.key !== d.key)); toastSuccess('Removido da lista.'); }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABS: OPERAÇÃO - RASTREAMENTO (MAPA AO VIVO) */}
          {activeTab === 'tracking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {(trackingRouteFilter || trackingClientFilter) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                    padding: '12px 16px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '14px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E40AF', lineHeight: 1.45 }}>
                    Mapa focado na rota{' '}
                    <span style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{trackingRouteFilter || '—'}</span>
                    {trackingClientFilter ? (
                      <>
                        {' '}
                        ·{' '}
                        {(() => {
                          try {
                            return decodeURIComponent(trackingClientFilter);
                          } catch {
                            return trackingClientFilter;
                          }
                        })()}
                      </>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSearchParams(prev => {
                        const n = new URLSearchParams(prev);
                        n.delete('trackRoute');
                        n.delete('trackClient');
                        return n;
                      }, { replace: true })
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: '1px solid #93C5FD',
                      background: '#FFFFFF',
                      color: '#1D4ED8',
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                    Limpar filtro
                  </button>
                </div>
              )}
              <style>{`
                @keyframes dashEffect { to { stroke-dashoffset: -20; } }
                @keyframes pulseDot {
                  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 97, 255, 0.7); }
                  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(0, 97, 255, 0); }
                  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 97, 255, 0); }
                }
                @keyframes floatTruck { 0% { offset-distance: 0%; } 100% { offset-distance: 100%; } }
              `}</style>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0061FF', animation: 'pulseDot 2s infinite' }} />
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', margin: 0 }}>Rastreamento de Frota (Visão Global SaaS)</h2>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Monitoramento agregado em tempo real de todos os veículos integrados na plataforma Logta.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, background: '#EFF6FF', color: '#0061FF', padding: '6px 14px', borderRadius: '20px' }}>
                    4.250 Caminhões Online (49 empresas)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* MAP CANVAS — largura total */}
                <div style={{ background: '#0F172A', borderRadius: '24px', border: '1px solid #1E293B', position: 'relative', display: 'flex', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', minHeight: '520px', width: '100%' }}>
                  <div style={{ flex: 1, position: 'relative', height: '100%', width: '100%' }}>
                    {/* HIGH FIDELITY LEAFLET CONTAINER SIMULATION */}
                    <div className="leaflet-container leaflet-touch leaflet-fade-anim leaflet-grab leaflet-touch-drag leaflet-touch-zoom" style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#F4F3F0' }}>
                      <div className="leaflet-pane leaflet-map-pane" style={{ transform: 'translate3d(0px, 0px, 0px)', position: 'absolute', width: '100%', height: '100%' }}>
                        <div className="leaflet-pane leaflet-tile-pane" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 256px)', gridTemplateRows: 'repeat(3, 256px)', position: 'absolute', top: '-50px', left: '-50px' }}>
                          <img alt="" src="https://mt1.google.com/vt/lyrs=m&x=3034&y=4647&z=13" style={{ width: '256px', height: '256px', opacity: 0.8 }} />
                          <img alt="" src="https://mt1.google.com/vt/lyrs=m&x=3035&y=4647&z=13" style={{ width: '256px', height: '256px', opacity: 0.8 }} />
                          <img alt="" src="https://mt1.google.com/vt/lyrs=m&x=3036&y=4647&z=13" style={{ width: '256px', height: '256px', opacity: 0.8 }} />
                          <img alt="" src="https://mt1.google.com/vt/lyrs=m&x=3034&y=4648&z=13" style={{ width: '256px', height: '256px', opacity: 0.8 }} />
                          <img alt="" src="https://mt1.google.com/vt/lyrs=m&x=3035&y=4648&z=13" style={{ width: '256px', height: '256px', opacity: 0.8 }} />
                          <img alt="" src="https://mt1.google.com/vt/lyrs=m&x=3036&y=4648&z=13" style={{ width: '256px', height: '256px', opacity: 0.8 }} />
                          <img alt="" src="https://mt1.google.com/vt/lyrs=m&x=3034&y=4649&z=13" style={{ width: '256px', height: '256px', opacity: 0.8 }} />
                          <img alt="" src="https://mt1.google.com/vt/lyrs=m&x=3035&y=4649&z=13" style={{ width: '256px', height: '256px', opacity: 0.8 }} />
                          <img alt="" src="https://mt1.google.com/vt/lyrs=m&x=3036&y=4649&z=13" style={{ width: '256px', height: '256px', opacity: 0.8 }} />
                        </div>

                        {/* LEAFLET MARKER PANE WITH MOVING VEHICLES */}
                        <div className="leaflet-pane leaflet-marker-pane" style={{ position: 'absolute', width: '100%', height: '100%' }}>
                          {/* Vehicle Marker 1 */}
                          <div className="leaflet-marker-icon map-global-vehicle-icon" style={{ position: 'absolute', top: '30%', left: '25%', width: '32px', height: '52px', transform: 'translate(-16px, -26px) rotate(45deg)', zIndex: 100, transition: 'all 1s linear' }}>
                            <div style={{ width: '32px', height: '52px', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.2))' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 130" width="100%" height="100%" fill="none">
                                <rect x="14" y="6" width="52" height="118" rx="14" fill="#0F172A" stroke="#1E293B" strokeWidth="2.5"></rect>
                                <rect x="18" y="32" width="44" height="84" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5"></rect>
                                <path d="M22 18C22 14 26 12 40 12C54 12 58 14 58 18H22Z" fill="#334155"></path>
                                <rect x="20" y="4" width="8" height="3" rx="1" fill="#FEF08A"></rect>
                                <rect x="52" y="4" width="8" height="3" rx="1" fill="#FEF08A"></rect>
                                <rect x="18" y="122" width="8" height="3" rx="1" fill="#EF4444"></rect>
                                <rect x="54" y="122" width="8" height="3" rx="1" fill="#EF4444"></rect>
                              </svg>
                            </div>
                          </div>

                          {/* Vehicle Marker 2 */}
                          <div className="leaflet-marker-icon map-global-vehicle-icon" style={{ position: 'absolute', top: '65%', left: '55%', width: '32px', height: '52px', transform: 'translate(-16px, -26px) rotate(-15deg)', zIndex: 99, transition: 'all 1s linear' }}>
                            <div style={{ width: '32px', height: '52px', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.2))' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 130" width="100%" height="100%" fill="none">
                                <rect x="14" y="6" width="52" height="118" rx="14" fill="#0F172A" stroke="#1E293B" strokeWidth="2.5"></rect>
                                <rect x="18" y="32" width="44" height="84" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5"></rect>
                                <path d="M22 18C22 14 26 12 40 12C54 12 58 14 58 18H22Z" fill="#334155"></path>
                                <rect x="20" y="4" width="8" height="3" rx="1" fill="#FEF08A"></rect>
                                <rect x="52" y="4" width="8" height="3" rx="1" fill="#FEF08A"></rect>
                                <rect x="18" y="122" width="8" height="3" rx="1" fill="#EF4444"></rect>
                                <rect x="54" y="122" width="8" height="3" rx="1" fill="#EF4444"></rect>
                              </svg>
                            </div>
                          </div>

                          {/* Vehicle Marker 3 (Smaller Car) */}
                          <div className="leaflet-marker-icon map-global-vehicle-icon" style={{ position: 'absolute', top: '45%', left: '80%', width: '26px', height: '42px', transform: 'translate(-13px, -21px) rotate(90deg)', zIndex: 98 }}>
                            <div style={{ width: '26px', height: '42px', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.15))' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 110" width="100%" height="100%" fill="none">
                                <rect x="12" y="6" width="46" height="98" rx="15" fill="#0F172A" stroke="#1E293B" strokeWidth="2.5"></rect>
                                <rect x="18" y="18" width="34" height="20" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5"></rect>
                                <rect x="18" y="72" width="34" height="16" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5"></rect>
                                <rect x="8" y="24" width="4" height="10" rx="2" fill="#0F172A"></rect>
                                <rect x="58" y="24" width="4" height="10" rx="2" fill="#0F172A"></rect>
                              </svg>
                            </div>
                          </div>

                          {/* Warning / Alert Marker */}
                          <div className="leaflet-marker-icon map-global-vehicle-icon" style={{ position: 'absolute', top: '25%', left: '60%', width: '36px', height: '36px', transform: 'translate(-18px, -18px)', zIndex: 101 }}>
                            <div style={{ width: '36px', height: '36px', filter: 'drop-shadow(0 4px 8px rgba(239,68,68,0.25))' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100%" height="100%" fill="none">
                                <path d="M24 4L4 40H44L24 4Z" fill="#FBBF24" stroke="#D97706" strokeWidth="3" strokeLinejoin="round"></path>
                                <rect x="22" y="16" width="4" height="12" rx="2" fill="#0F172A"></rect>
                                <circle cx="24" cy="33" r="2.5" fill="#0F172A"></circle>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* LEAFLET CONTROLS */}
                      <div className="leaflet-control-container">
                        <div className="leaflet-top leaflet-left" style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 200 }}>
                          <div className="leaflet-control-zoom leaflet-bar" style={{ display: 'flex', flexDirection: 'column', border: '2px solid rgba(0,0,0,0.2)', borderRadius: '4px', background: '#FFF' }}>
                            <a className="leaflet-control-zoom-in" href="#" style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#000', fontWeight: 900, background: '#FFF', borderBottom: '1px solid #CCC' }}>+</a>
                            <a className="leaflet-control-zoom-out" href="#" style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#000', fontWeight: 900, background: '#FFF' }}>−</a>
                          </div>
                        </div>
                        <div className="leaflet-bottom leaflet-right" style={{ position: 'absolute', bottom: '0', right: '0', background: 'rgba(255,255,255,0.7)', padding: '2px 6px', fontSize: '10px', color: '#333', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 200 }}>
                          <span>Leaflet</span>
                          <span>|</span>
                          <span>© Google Maps</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(15, 23, 42, 0.85)', padding: '12px', border: '1px solid #334155', borderRadius: '12px', color: '#FFF', backdropFilter: 'blur(8px)' }}>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: '#0061FF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telemetria Ativa</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <Truck size={14} color="#0061FF" /> Falcão Trans · #RT-9021
                      </div>
                      <div style={{ fontSize: '10px', color: '#CBD5E1', marginTop: '4px' }}>Velocidade: 78 km/h · SP➔RJ</div>
                    </div>

                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(15, 23, 42, 0.85)', padding: '12px', border: '1px solid #334155', borderRadius: '12px', color: '#FFF', backdropFilter: 'blur(8px)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={14} color="#3B82F6" /> Expresso Federal · #RT-8912
                      </div>
                      <div style={{ fontSize: '10px', color: '#CBD5E1', marginTop: '2px' }}>Velocidade: 92 km/h · PR➔RS</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TABS: OPERAÇÃO - FROTA */}
          {activeTab === 'fleet' && (
            <div style={s.tabContent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <HubSupabaseChart label="FROTA TOTAL" value="9.840" data={[40, 50, 60, 50, 40, 50, 60, 50, 40, 50]} />
                <HubSupabaseChart label="ATIVOS AGORA" value="8.550" data={[30, 40, 50, 60, 70, 80, 70, 60, 50, 40]} />
                <HubSupabaseChart label="EM MANUTENÇÃO" value="142" data={[20, 30, 40, 50, 60, 70, 80, 90, 80, 70]} />
                <HubSupabaseChart label="TELEMETRIA (REQ)" value="2.4M" data={[10, 20, 30, 40, 50, 40, 30, 20, 10, 5]} />
              </div>

              <div style={{ ...s.card, marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={s.searchBox}>
                      <SearchIcon size={14} color="#94A3B8" />
                      <input type="text" placeholder="Search companies..." value={driverSearch} onChange={e => setDriverSearch(e.target.value)} style={s.searchInput} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={s.actionBtn} onClick={() => toastSuccess('Exportando frota para Excel...')}>
                      <FileSpreadsheet size={14} color="#0046C7" /> Excel
                    </button>
                    <button style={s.actionBtn} onClick={() => toastSuccess('Exportando inventário de frota para PDF...')}>
                      <FileText size={14} color="#DC2626" /> PDF
                    </button>
                    <button style={s.actionBtn} onClick={() => toastSuccess('Sincronizando...')}>
                      <RefreshCcw size={14} /> Refresh
                    </button>
                    <button style={{ ...s.actionBtn, background: '#0061FF', color: '#FFF', borderColor: '#0061FF' }}>
                      <Plus size={14} /> New vehicle
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {[
                    { client: 'Transportadora Falcão', count: '450 veíc.', plan: 'Logta Pro', active: '98% ativo', color: '#0061FF' },
                    { client: 'Expresso Federal', count: '320 veíc.', plan: 'Logta Enterprise', active: '94% ativo', color: '#3B82F6' },
                    { client: 'Rápido Trans', count: '210 veíc.', plan: 'Logta Pro', active: '89% ativo', color: '#8B5CF6' },
                    { client: 'TransNorte Cargo', count: '180 veíc.', plan: 'Logta Start', active: '92% ativo', color: '#F59E0B' },
                  ].map((v, i) => (
                    <div 
                      key={i} 
                      style={{ ...s.card, padding: '24px', cursor: 'pointer', background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                      onClick={() => selectEntity('vehicleId', i === 0 ? '1' : `demo-${i + 10}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#FFFFFF', color: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                          <Truck size={20} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 800, background: v.color + '15', color: v.color, padding: '4px 8px', borderRadius: '6px' }}>{v.active}</span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{v.client}</h4>
                      <p style={{ margin: '2px 0 16px 0', fontSize: '12px', color: '#64748B', fontWeight: '500' }}>{v.plan}</p>
                      
                      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>{v.count}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={s.actionBtn} title="Editar"><Settings size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...s.card, display: 'flex', flexDirection: 'column', gap: 0 }}>
                <h3 style={{ ...s.cardTitleInline, marginBottom: '16px' }}>Lista de veículos (frota)</h3>
                <div style={{ maxHeight: '447px', overflowY: 'auto', width: '100%' }}>
                <table style={s.table} className="logta-admin-table">
                  <thead>
                    <tr>
                      <th style={s.th}>Placa</th>
                      <th style={s.th}>Modelo</th>
                      <th style={s.th}>Empresa</th>
                      <th style={s.th}>Telemetria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fleetListRows.map(row => {
                      const hi = fleetRowHighlight && row.vehicleId === fleetRowHighlight;
                      return (
                      <tr
                        key={row.key}
                        style={{
                          ...s.tr,
                          cursor: 'pointer',
                          backgroundColor: hi ? '#EFF6FF' : undefined,
                          outline: hi ? '2px solid #2563EB' : undefined,
                          outlineOffset: hi ? '-2px' : undefined,
                        }}
                        onClick={() => selectEntity('vehicleId', row.vehicleId)}
                      >
                        <td style={s.td}><span style={{ fontWeight: 900, fontFamily: 'monospace' }}>{row.plate}</span></td>
                        <td style={s.td}>{row.model}</td>
                        <td style={s.td}>{row.client}</td>
                        <td style={s.td}>{row.active}</td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* TABS: FINANCEIRO */}
          {activeTab === 'finance' && (
            <div style={s.tabContent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <HubSupabaseChart label="RECEITA TOTAL" value="R$ 1.4M" data={[40, 50, 60, 50, 40, 50, 60, 50, 40, 50]} />
                <HubSupabaseChart label="MENSAL (EST)" value="R$ 342k" data={[30, 40, 50, 60, 70, 80, 70, 60, 50, 40]} />
                <HubSupabaseChart label="COBRANÇAS EM ABERTO" value="12" data={[20, 30, 40, 50, 60, 70, 80, 90, 80, 70]} />
                <HubSupabaseChart label="CHURN RATE" value="0.8%" data={[10, 5, 2, 8, 3, 1, 4, 2, 0, 1]} />
              </div>

              <div style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={s.searchBox}>
                      <SearchIcon size={14} color="#94A3B8" />
                      <input type="text" placeholder="Search invoices..." value={financeSearch} onChange={e => setFinanceSearch(e.target.value)} style={s.searchInput} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={s.actionBtn} onClick={() => toastSuccess('Sincronizando...')}>
                      <RefreshCcw size={14} /> Refresh
                    </button>
                    <button style={{ ...s.actionBtn, background: '#0061FF', color: '#FFF', borderColor: '#0061FF' }} onClick={() => setIsFinanceModalOpen(true)}>
                      <Plus size={14} /> New invoice
                    </button>
                  </div>
                </div>

                <table style={s.table} className="logta-admin-table">
                  <thead>
                    <tr>
                      <th style={{ ...s.th, width: '40px', textAlign: 'center' }}><input type="checkbox" style={{ accentColor: '#0061FF' }} /></th>
                      <th style={s.th}>CLIENTE / EMPRESA</th>
                      <th style={s.th}>OPERAÇÃO</th>
                      <th style={s.th}>FORMATO</th>
                      <th style={s.th}>VALOR</th>
                      <th style={s.th}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeHistory.filter(f => 
                      f.client.toLowerCase().includes(financeSearch.toLowerCase()) || 
                      f.op.toLowerCase().includes(financeSearch.toLowerCase())
                    ).map((f, i) => (
                      <tr 
                        key={i} 
                        style={{ ...s.tr, cursor: 'pointer' }}
                        onClick={() => selectEntity('invoiceId', f.id)}
                      >
                        <td style={s.tdCheckbox} onClick={e => e.stopPropagation()}><input type="checkbox" style={{ accentColor: '#0061FF' }} /></td>
                        <td style={s.td}>
                          <div className="logta-admin-cell-flex-end">
                            <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '10px', fontWeight: 800 }}>{f.client[0]}</div>
                            <span style={s.clientName}>{f.client}</span>
                          </div>
                        </td>
                        <td style={s.td}><span style={{ fontWeight: '600', color: '#3B82F6' }}>{f.op}</span></td>
                        <td style={s.td}><span style={s.stat}>{f.method}</span></td>
                        <td style={s.td}><span style={{ fontWeight: '900', color: '#0F172A' }}>{f.value}</span></td>
                        <td style={s.td}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '6px', 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            backgroundColor: f.status === 'Pago' ? '#BFDBFE' : f.status === 'Liberado' ? '#DBEAFE' : '#FEF3C7',
                            color: f.status === 'Pago' ? '#065F46' : f.status === 'Liberado' ? '#1E40AF' : '#92400E'
                          }}>{f.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABS: SEGURANÇA - PERMISSÕES */}
          {activeTab === 'settings' && settingsTab === 'permissions' && (
            <div style={s.tabContent}>
              <div style={s.card}>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={s.cardTitleInline}>Controle de Acesso Global (RBAC)</h3>
                  <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>Defina as permissões e níveis de acesso para cada perfil de usuário no ecossistema.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {[
                    { role: 'Master Admin', access: 'Total (Leitura/Escrita)', users: 2, color: '#EF4444' },
                    { role: 'Suporte Técnico', access: 'Limitado (Leitura + Edição)', users: 5, color: '#3B82F6' },
                    { role: 'Gerente Empresa', access: 'Contextual (Apenas sua empresa)', users: 49, color: '#0061FF' }
                  ].map((r, i) => (
                    <div key={i} style={{ ...s.card, padding: '24px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontWeight: '900', color: r.color, fontSize: '16px', letterSpacing: '-0.02em' }}>{r.role}</div>
                      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontWeight: '600' }}>{r.access}</div>
                      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8' }}>{r.users} USUÁRIOS</span>
                        <button style={s.actionBtn}>Configurar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* INFRAESTRUTURA CONSOLIDADA */}
          {activeTab === 'infrastructure' && (
            <div style={s.tabContent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <HubSupabaseChart label="API UPTIME" value="99.99%" data={[100, 100, 99.9, 100, 100, 100, 99.8, 100, 100, 100]} />
                <HubSupabaseChart label="CPU LOAD (AVG)" value="24%" data={[20, 25, 22, 28, 30, 25, 22, 24, 26, 24]} />
                <HubSupabaseChart label="RAM USAGE" value="12.4 GB" data={[10, 11, 12, 12, 13, 12, 12, 12.4, 12.2, 12.4]} />
                <HubSupabaseChart label="STORAGE OPS" value="1.2k/s" data={[10, 20, 30, 40, 50, 40, 30, 20, 10, 5]} />
              </div>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                <aside style={{
                  width: '260px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  position: 'sticky',
                  top: 16,
                  padding: '12px',
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Infraestrutura</div>
                  {[
                    { id: 'api', label: 'APIs & Gateway', icon: Globe },
                    { id: 'database', label: 'Banco de Dados', icon: Database },
                    { id: 'storage', label: 'Storage / Arquivos', icon: Layers },
                    { id: 'queues', label: 'Filas & Workers', icon: Activity },
                    { id: 'backups', label: 'Backups', icon: Shield },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setInfraTab(t.id as any)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        border: infraTab === t.id ? '1px solid #BFDBFE' : '1px solid transparent',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        textAlign: 'left',
                        backgroundColor: infraTab === t.id ? '#EFF6FF' : 'transparent',
                        color: infraTab === t.id ? '#1D4ED8' : '#475569',
                        transition: '0.15s',
                      }}
                    >
                      <t.icon size={16} style={{ flexShrink: 0 }} /> {t.label}
                    </button>
                  ))}
                </aside>
                <div style={{ flex: 1, minWidth: 0 }}>
              {infraTab === 'api' && (
                <div style={s.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={s.cardTitleInline}>APIs & Gateway de Metadados</h3>
                    <button type="button" style={{ ...s.actionBtn, background: '#0F172A', color: '#FFF', borderColor: '#0F172A' }} onClick={() => setIsApiGatewayModalOpen(true)}>Ver detalhes completos</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '24px' }}>
                    <div style={s.integrationBox}>
                      <div style={{ fontWeight: 800 }}>Gateway Principal</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>https://api.logta.io/v1</div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <button type="button" style={s.actionBtn} onClick={() => toastSuccess('Healthcheck OK (mock)')}>Testar Conexão</button>
                        <button type="button" style={s.actionBtn} onClick={() => { navigator.clipboard.writeText('https://api.logta.io/v1'); toastSuccess('Base URL copiada'); }}><Copy size={14} /> Copiar URL</button>
                      </div>
                    </div>
                    <div style={s.integrationBox}>
                      <div style={{ fontWeight: 800 }}>SDK Webhook</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>Ativo em 4 clusters</div>
                      <button type="button" style={{ ...s.actionBtn, marginTop: '12px' }} onClick={() => toastSuccess('Abrindo agregador de logs…')}>Ver Logs</button>
                    </div>
                  </div>
                </div>
              )}

              {infraTab === 'database' && (
                <div style={s.card}>
                  <h3 style={s.cardTitleInline}>Instâncias de Banco de Dados</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                    <div style={s.nodeRow}>
                      <div>
                        <div style={{ fontWeight: 800 }}>PostgreSQL Master</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>Status: Online · Load: 12%</div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#0061FF' }}>ESTÁVEL</span>
                    </div>
                    <div style={s.nodeRow}>
                      <div>
                        <div style={{ fontWeight: 800 }}>Redis Cache</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>Status: Online · Memory: 4.2GB</div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#0061FF' }}>ESTÁVEL</span>
                    </div>
                  </div>
                </div>
              )}

              {infraTab === 'storage' && (
                <div style={s.card}>
                  <h3 style={s.cardTitleInline}>Políticas de Storage & CDN</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '24px' }}>
                    {['Imagens', 'Documentos', 'Logs'].map(p => (
                      <div key={p} style={{ ...s.card, padding: '20px', backgroundColor: '#F8FAFC' }}>
                        <div style={{ fontWeight: 800 }}>{p}</div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Retenção: 1 ano</div>
                        <button style={{ ...s.actionBtn, width: '100%', marginTop: '12px', justifyContent: 'center' }}>Configurar</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {infraTab === 'queues' && (
                <div style={s.card}>
                  <h3 style={s.cardTitleInline}>Filas de Processamento (BullMQ)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
                    {['mail_queue', 'fatura_queue', 'upload_worker'].map(q => (
                      <div key={q} style={s.nodeRow}>
                        <div style={{ fontWeight: 800, fontFamily: 'monospace' }}>{q}</div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0061FF' }}>0 WAITING</span>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#3B82F6' }}>12 ACTIVE</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {infraTab === 'backups' && (
                <div style={s.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                      <h3 style={s.cardTitleInline}>Backup & Recuperação de Desastres</h3>
                      <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px', margin: 0 }}> snapshots diários e restauração de dados do cluster Logta.</p>
                    </div>
                    <button style={{ ...s.addBtn, background: '#0F172A', color: '#FFF', borderColor: '#0F172A' }}>Criar Snapshot Agora</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { id: 'snap-20240514', size: '142.8 GB', time: 'Hoje, 03:00 AM', status: 'Consistente' },
                      { id: 'snap-20240513', size: '141.5 GB', time: 'Ontem, 03:00 AM', status: 'Consistente' },
                      { id: 'snap-20240512', size: '140.2 GB', time: 'Há 2 dias, 03:00 AM', status: 'Consistente' }
                    ].map((b, i) => (
                      <div key={i} style={s.nodeRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <Database size={20} color="#64748B" />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '14px', fontFamily: 'monospace' }}>{b.id}</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{b.size} · {b.time}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{ ...s.actionBtn, borderColor: '#FEF2F2', background: '#FFFFFF', color: '#EF4444' }}>Restaurar Snapshot</button>
                          <button style={{ ...s.actionBtn, borderColor: '#E2E8F0', background: '#FFFFFF', color: '#64748B' }}>Download</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                </div>
              </div>
            </div>
          )}

          {/* FALLBACK PLACEHOLDER FOR OTHER EXTENDED TABS */}
          {!['overview', 'routes', 'deliveries', 'drivers', 'tracking', 'fleet', 'finance', 'clients', 'billing', 'orders', 'auth', 'permissions', 'infrastructure', 'logs', 'settings'].includes(activeTab) && (
            <div style={s.tabContent}>
              <div style={{ ...s.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', marginBottom: '20px' }}>
                  <Layers size={28} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Visualização Expandida da Logta</h3>
                <p style={{ fontSize: '14px', color: '#64748B', marginTop: '8px', maxWidth: '440px' }}>
                  Esta aba concentra dados técnicos específicos e históricos operacionais integrados do ecossistema monorepo Logta.
                </p>
                <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#3B82F6', background: '#EFF6FF', padding: '6px 16px', borderRadius: '20px' }}>Módulo Disponível</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0061FF', background: '#EFF6FF', padding: '6px 16px', borderRadius: '20px' }}>Status: Operacional</span>
                </div>
              </div>
            </div>
          )}

          {/* CLIENTES */}
          {activeTab === 'clients' && (
            <div style={s.tabContent}>
              {(() => {
                const totalVehicles = clients.reduce((acc, cur) => acc + (cur.vehicles || 0), 0);
                const totalRoutes = clients.reduce((acc, cur) => acc + (cur.routes || 0), 0);
                const estBilling = clients.reduce((acc, cur) => {
                  const val = cur.plan?.includes('Enterprise') ? 8200 : cur.plan?.includes('Pro') ? 4500 : 800;
                  return acc + val;
                }, 0);

                const filtered = clients.filter(c => 
                  c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
                  c.plan.toLowerCase().includes(clientSearch.toLowerCase())
                );

                return (
                  <>
                    {/* SUMMARY METRICS (Supabase Style) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                      <HubSupabaseChart label="TOTAL CLIENTES" value={clients.length.toString()} data={[40, 50, 60, 50, 40, 50, 60, 50, 40, 50]} />
                      <HubSupabaseChart label="FROTA INTEGRADA" value={totalVehicles.toLocaleString()} data={[30, 40, 50, 60, 70, 80, 70, 60, 50, 40]} />
                      <HubSupabaseChart label="MOVIMENTAÇÃO" value={totalRoutes.toLocaleString()} data={[20, 30, 40, 50, 60, 70, 80, 90, 80, 70]} />
                      <HubSupabaseChart label="BILLING (EST)" value={`R$ ${estBilling.toLocaleString('pt-BR')}`} data={[10, 20, 30, 40, 50, 40, 30, 20, 10, 5]} />
                    </div>

                    {/* MAIN LIST CARD */}
                    <div style={s.card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={s.searchBox}>
                            <SearchIcon size={14} color="#94A3B8" />
                            <input type="text" placeholder="Search by name..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} style={s.searchInput} />
                          </div>
                          <select style={{ ...s.searchBox, appearance: 'none', paddingRight: '32px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748B\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                            <option>All plans</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={s.actionBtn} onClick={() => toastSuccess('Exportando dados para Excel...')}>
                            <FileSpreadsheet size={14} color="#0046C7" /> Excel
                          </button>
                          <button style={s.actionBtn} onClick={() => toastSuccess('Exportando relatório PDF...')}>
                            <FileText size={14} color="#DC2626" /> PDF
                          </button>
                          <button style={s.actionBtn} onClick={() => toastSuccess('Sincronizando...')}>
                            <RefreshCcw size={14} /> Refresh
                          </button>
                          <button style={{ ...s.actionBtn, background: '#0061FF', color: '#FFF', borderColor: '#0061FF' }} onClick={() => setIsAddClientOpen(true)}>
                            <Plus size={14} /> Add company
                          </button>
                        </div>
                      </div>

                      <table style={s.table} className="logta-admin-table">
                        <thead>
                          <tr>
                            <th style={{ ...s.th, width: '40px', textAlign: 'center' }}><input type="checkbox" style={{ accentColor: '#0061FF' }} /></th>
                            <th style={s.th}>EMPRESA</th>
                            <th style={s.th}>PLANO</th>
                            <th style={s.th}>PRODUTOS</th>
                            <th style={s.th}>VOLUME ROTAS</th>
                            <th style={s.th}>FROTA</th>
                            <th style={s.th}>AÇÕES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((c) => (
                            <tr 
                              key={c.id} 
                              style={{ ...s.tr, cursor: 'pointer' }}
                              onClick={() => selectClient(c.id)}
                            >
                              <td style={s.tdCheckbox} onClick={e => e.stopPropagation()}><input type="checkbox" style={{ accentColor: '#0061FF' }} /></td>
                              <td style={s.td}>
                                <div className="logta-admin-cell-flex-end">
                                  <HubEntityAvatar
                                    kind="company"
                                    src={resolveCompanyLogo(c)}
                                    name={c.name}
                                    size={28}
                                    accent="#0061FF"
                                    style={{ borderRadius: '8px' }}
                                  />
                                  <span style={s.clientName}>{c.name}</span>
                                </div>
                              </td>
                              <td style={s.td}><span style={s.badge}>{c.plan}</span></td>
                              <td style={s.td}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <div style={{ padding: '4px', borderRadius: '4px', background: '#7C3AED15', color: '#7C3AED' }} title="ZapTro Active"><Zap size={12} /></div>
                                  {(c.id === '1' || c.id?.includes('demo')) && (
                                    <div style={{ padding: '4px', borderRadius: '4px', background: '#0061FF15', color: '#0061FF' }} title="Logta Active"><Truck size={12} /></div>
                                  )}
                                  {c.id === '1' && (
                                    <div style={{ padding: '4px', borderRadius: '4px', background: '#16A34A15', color: '#16A34A' }} title="LogDock Active"><PackageSearch size={12} /></div>
                                  )}
                                </div>
                              </td>
                              <td style={s.td}><span style={s.stat}>{c.routes.toLocaleString()}</span></td>
                              <td style={s.td}><span style={s.stat}>{c.vehicles}</span></td>
                              <td style={s.td} onClick={e => e.stopPropagation()}>
                                <div className="logta-admin-actions-inner">
                                  <button style={s.actionBtn} title="Configurar" onClick={() => selectClient(c.id, 'seguranca')}><Settings size={14} /></button>
                                  <button style={s.actionBtn} title="Editar" onClick={() => selectClient(c.id, 'cadastro')}><Pencil size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
              </div>
            )}

          {/* TABS: CLIENTES - PLANOS & ASSINATURAS */}
          {activeTab === 'billing' && (
            <div style={s.tabContent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <HubSupabaseChart label="PLANOS ATIVOS" value="49" data={[40, 50, 60, 50, 40, 50, 60, 50, 40, 50]} />
                <HubSupabaseChart label="ASSINATURAS PRO" value="28" data={[30, 40, 50, 60, 70, 80, 70, 60, 50, 40]} />
                <HubSupabaseChart label="MRR (ESTIMADO)" value="R$ 142k" data={[20, 30, 40, 50, 60, 70, 80, 90, 80, 70]} />
                <HubSupabaseChart label="FREE TRIALS" value="5" data={[10, 5, 2, 8, 3, 1, 4, 2, 0, 1]} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Distribuição de planos (cards)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { plan: 'Logta Enterprise', count: 14, color: '#8B5CF6' },
                    { plan: 'Logta Pro', count: 28, color: '#0061FF' },
                    { plan: 'Logta Start', count: 7, color: '#3B82F6' },
                  ].map((item, i) => (
                    <div key={i} style={{ ...s.card, padding: '18px 20px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>{item.plan}</div>
                      <div style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', marginTop: '8px' }}>{item.count}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: item.color, marginTop: '6px' }}>empresas ativas</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={s.searchBox}>
                      <SearchIcon size={14} color="#94A3B8" />
                      <input type="text" placeholder="Buscar cliente ou status..." value={financeSearch} onChange={e => setFinanceSearch(e.target.value)} style={s.searchInput} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" style={s.actionBtn} onClick={() => toastSuccess('Exportando histórico para Excel...')}>
                      <FileSpreadsheet size={14} color="#0046C7" /> Excel
                    </button>
                    <button type="button" style={s.actionBtn} onClick={() => toastSuccess('Exportando histórico para PDF...')}>
                      <FileText size={14} color="#DC2626" /> PDF
                    </button>
                    <button type="button" style={{ ...s.actionBtn, background: '#0061FF', color: '#FFF', borderColor: '#0061FF' }} onClick={() => setIsAddPlanModalOpen(true)}>
                      <Plus size={14} /> Novo Plano
                    </button>
                  </div>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#64748B' }}>
                  Checkout: copie o link e envie ao cliente. Após confirmação de pagamento no gateway, o comprovante pode ser baixado e um e-mail automático será disparado quando a integração transacional estiver ativa no projeto.
                </p>

                <table style={s.table} className="logta-admin-table">
                  <thead><tr>
                    <th style={s.th}>Cliente</th>
                    <th style={s.th}>Valor</th>
                    <th style={s.th}>Vencimento</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Checkout</th>
                    <th style={s.th}>Comprovante</th>
                    <th style={s.th}>Ações</th>
                  </tr></thead>
                  <tbody>
                    {billingSubRows.filter(f =>
                      f.client.toLowerCase().includes(financeSearch.toLowerCase()) ||
                      f.status.toLowerCase().includes(financeSearch.toLowerCase())
                    ).map((f) => (
                      <tr
                        key={f.id}
                        style={{ ...s.tr, cursor: 'pointer', opacity: f.blocked ? 0.55 : 1 }}
                        onClick={() => !f.blocked && selectEntity('invoiceId', f.id)}
                      >
                        <td style={s.td}><span style={{ fontWeight: 600, color: '#1E293B' }}>{f.client}{f.blocked ? ' · bloqueado' : ''}</span></td>
                        <td style={s.td}><span style={{ fontWeight: 700, color: '#0F172A' }}>{f.val}</span></td>
                        <td style={s.td}><span style={s.stat}>{f.date}</span></td>
                        <td style={s.td}><span style={{ fontSize: '11px', fontWeight: 800, color: f.color }}>{f.status}</span></td>
                        <td style={s.td} onClick={e => e.stopPropagation()}>
                          <button type="button" style={s.actionBtn} onClick={() => { navigator.clipboard.writeText(f.checkoutUrl); toastSuccess('Link de checkout copiado'); }}><Copy size={14} /> Link</button>
                        </td>
                        <td style={s.td} onClick={e => e.stopPropagation()}>
                          <button type="button" style={s.actionBtn} onClick={() => { const url = `${window.location.origin}${f.receiptPublicPath}`; navigator.clipboard.writeText(url); toastSuccess('URL pública do comprovante copiada'); }}><Share2 size={14} /> Público</button>
                          {f.status === 'Pago' && (
                            <button type="button" style={{ ...s.actionBtn, marginLeft: 6 }} onClick={() => toastSuccess('Baixando comprovante PDF (mock)...')}><Download size={14} /> PDF</button>
                          )}
                        </td>
                        <td style={s.td} onClick={e => e.stopPropagation()}>
                          <button type="button" style={s.actionBtn} onClick={() => { setBillingSubRows(rows => rows.map(r => r.id === f.id ? { ...r, blocked: !r.blocked } : r)); toastSuccess(f.blocked ? 'Plano desbloqueado na UI.' : 'Plano bloqueado na UI.'); }}><Lock size={14} /></button>
                          <button type="button" style={{ ...s.actionBtn, color: '#B91C1C' }} onClick={() => { if (!window.confirm(`Excluir cobrança de ${f.client}?`)) return; setBillingSubRows(rows => rows.filter(r => r.id !== f.id)); toastSuccess('Removido da lista.'); }}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABS: CLIENTES - HISTÓRICO DE PEDIDOS */}
          {activeTab === 'orders' && (
            <div style={s.tabContent}>
              <div style={s.card}>
                <h3 style={s.cardTitleInline}>Histórico Global de Pedidos & Recargas</h3>
                <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px', marginBottom: '24px' }}>Auditoria de transações, upgrades de planos e compra de créditos de IA/SMS.</p>
                <table style={s.table} className="logta-admin-table">
                  <thead><tr>
                    <th style={s.th}>Ref ID</th>
                    <th style={s.th}>Empresa</th>
                    <th style={s.th}>Tipo de Pedido</th>
                    <th style={s.th}>Valor</th>
                    <th style={s.th}>Data</th>
                  </tr></thead>
                  <tbody>
                    {[
                      { ref: '#ORD-8891', client: 'Alfa Transportes', type: 'Recarga de Créditos', val: 'R$ 500,00', date: 'Hoje, 14:15' },
                      { ref: '#ORD-8890', client: 'Falcão Trans', type: 'Upgrade de Limite', val: 'R$ 1.200,00', date: 'Hoje, 09:02' },
                      { ref: '#ORD-8889', client: 'Expresso Federal', type: 'Assinatura Mensal', val: 'R$ 8.200,00', date: 'Ontem, 17:44' },
                      { ref: '#ORD-8888', client: 'Rápido Sul', type: 'Créditos API', val: 'R$ 250,00', date: 'Há 2 dias' },
                    ].map((o, i) => (
                      <tr 
                        key={i} 
                        style={{ ...s.tr, cursor: 'pointer' }}
                        onClick={() => selectEntity('invoiceId', i === 2 ? 'demo-11' : `demo-${i + 20}`)}
                      >
                        <td style={s.td}><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#64748B' }}>{o.ref}</span></td>
                        <td style={s.td}><span style={{ fontWeight: 600, color: '#1E293B' }}>{o.client}</span></td>
                        <td style={s.td}><span style={s.badge}>{o.type}</span></td>
                        <td style={s.td}><span style={{ fontWeight: 800, color: '#0F172A' }}>{o.val}</span></td>
                        <td style={s.td}><span style={s.stat}>{o.date}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AUTENTICAÇÃO */}
          {activeTab === 'auth' && (
            <div style={s.tabContent}>
              <div style={s.card}>
                <h3 style={s.cardTitleInline}>Segurança & Autenticação Logta</h3>
                <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>Configurações globais de login, tokens de API e provedores OAuth do módulo Logta.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                  <div style={s.nodeRow}>
                    <div>
                      <div style={{ fontWeight: 800 }}>Multi-Fator (MFA) Requerido</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>Obrigar usuários administrativos do ERP a usar 2FA.</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, padding: '6px 12px', background: '#F1F5F9', borderRadius: '8px', color: '#475569' }}>DESATIVADO</span>
                  </div>
                  <div style={s.nodeRow}>
                    <div>
                      <div style={{ fontWeight: 800 }}>API Access Keys</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>Tokens emitidos para sistemas ERP legados se conectarem.</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0061FF' }}>14 CHAVES ATIVAS</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ARMAZENAR */}
          {/* BANCO DE DADOS LOGDOCK */}
          {activeTab === 'database' && (
            <div style={s.tabContent}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Main DB Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={s.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ ...s.cardTitleInline, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Database size={20} color="#0061FF" /> Banco de Dados Logta ERP
                        </h3>
                        <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>Instância PostgreSQL 15.4 dedicada executando no Cluster Logdock.</p>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#0061FF', background: '#EFF6FF', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ● ONLINE
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px', padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Pool de Conexões</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>42 / 150</div>
                        <div style={{ fontSize: '11px', color: '#0061FF', fontWeight: 800, marginTop: '2px' }}>28% de capacidade</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Tamanho em Disco</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>142.5 GB</div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>Limite Logdock: {logdockConfig.disk} GB</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Latência Média</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>4.2 ms</div>
                        <div style={{ fontSize: '11px', color: '#0061FF', fontWeight: 800, marginTop: '2px' }}>Excelente Performance</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0F172A', marginBottom: '16px' }}>Navegador de Tabelas Ativas (Core Schema)</h4>
                      <table style={s.table} className="logta-admin-table">
                        <thead><tr>
                          <th style={s.th}>Schema.Table</th>
                          <th style={s.th}>Linhas</th>
                          <th style={s.th}>Tamanho</th>
                          <th style={s.th}>Acesso/seg</th>
                        </tr></thead>
                        <tbody>
                          {[
                            { name: 'public.companies', rows: '49', size: '12.4 MB', rate: '42 ops/s' },
                            { name: 'public.routes', rows: '85.210', size: '122.8 MB', rate: '180 ops/s' },
                            { name: 'public.drivers', rows: '1.240', size: '8.1 MB', rate: '34 ops/s' },
                            { name: 'public.invoices', rows: '3.450', size: '16.5 MB', rate: '12 ops/s' },
                          ].map((t, i) => (
                            <tr key={i} style={s.tr}>
                              <td style={s.td}><span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#0F172A', fontWeight: 800 }}>{t.name}</span></td>
                              <td style={s.td}><span style={s.stat}>{t.rows}</span></td>
                              <td style={s.td}><span style={s.stat}>{t.size}</span></td>
                              <td style={s.td}><span style={{ color: '#0061FF', fontWeight: 800, fontSize: '12px' }}>{t.rate}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Sidebar Infra Logdock */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ ...s.card, background: '#0F172A', border: '1px solid #1E293B', color: '#FFFFFF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <div style={{ width: '10px', height: '10px', background: '#0061FF', borderRadius: '50%', boxShadow: '0 0 12px #0061FF' }} />
                      <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#94A3B8', textTransform: 'uppercase' }}>Módulo Logdock Ativo</span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>Infraestrutura Logdock</h3>
                    <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px' }}>Alocação e provisionamento de hardware na nuvem integrada.</p>
                    
                    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                          <span>CPU CORES</span>
                          <span style={{ color: '#FFFFFF' }}>{logdockConfig.cpu} vCPUs</span>
                        </div>
                        <div style={{ height: '6px', background: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min((logdockConfig.cpu / 64) * 100, 100)}%`, height: '100%', background: '#0061FF' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                          <span>MEMÓRIA RAM</span>
                          <span style={{ color: '#FFFFFF' }}>{logdockConfig.ram} GB</span>
                        </div>
                        <div style={{ height: '6px', background: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min((logdockConfig.ram / 256) * 100, 100)}%`, height: '100%', background: '#3B82F6' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                          <span>ARMAZENAMENTO</span>
                          <span style={{ color: '#FFFFFF' }}>{logdockConfig.disk} GB SSD</span>
                        </div>
                        <div style={{ height: '6px', background: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min((logdockConfig.disk / 2000) * 100, 100)}%`, height: '100%', background: '#F59E0B' }} />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setIsLogdockModalOpen(true)}
                    style={{ 
                      width: '100%', 
                      marginTop: '24px', 
                      padding: '12px 24px', 
                      borderRadius: '100px', 
                      background: 'linear-gradient(135deg, #0061FF, #0046C7)', 
                      border: 'none', 
                      color: '#FFFFFF', 
                      fontSize: '13px', 
                      fontWeight: 900, 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      boxShadow: '0 4px 12px rgba(0, 97, 255, 0.25)'
                    }}
                  >
                    <Settings size={16} /> Ajustar Limites do Logdock
                  </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ARMAZENAR */}
          {activeTab === 'storage' && (
            <div style={s.tabContent}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div style={s.card}>
                  <h3 style={s.cardTitleInline}>Armazenamento de Arquivos Logísticos</h3>
                  <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>Gestão de armazenamento para arquivos PDF de DACTE, XML e fotos de canhotos de entrega.</p>
                </div>
                <div style={{ ...s.card, background: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Quota Logdock SSD</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>142.5 GB <span style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8' }}>/ {logdockConfig.disk} GB</span></div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button 
                      onClick={() => setIsLogdockModalOpen(true)} 
                      style={{ 
                        ...HUB_MASTER_PRODUCT_SHELL.actionBtn, 
                        background: '#FFFFFF', 
                        color: '#475569', 
                        border: '1px solid #E2E8F0', 
                        fontSize: '11px', 
                        padding: '8px 20px' 
                      }}
                    >
                      EXPANDIR ARMAZENAMENTO
                    </button>
                  </div>
                </div>
              </div>
              
              <div style={s.card}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'Retenção Fiscal (Legal)', desc: 'XMLs de CT-e e NF-e armazenados por 5 anos (exigência legal).', color: '#0061FF' },
                    { label: 'Histórico de Rotas', desc: 'Telemetria e tracking salvos por 2 anos para auditoria.', color: '#0061FF' },
                    { label: 'Logs de Eventos ERP', desc: 'Alterações de status e financeiro por 1 ano.', color: '#F59E0B' },
                  ].map((p, i) => (
                    <div key={i} style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1E293B' }}>{p.label}</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>{p.desc}</p>
                      </div>
                      <button style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: '#0061FF', color: 'white', padding: '8px 24px', fontSize: '11px' }}>GERENCIAR</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EM TEMPO REAL */}
          {activeTab === 'realtime' && (
            <div style={s.tabContent}>
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <h3 style={s.cardTitleInline}>Streaming de Eventos em Tempo Real</h3>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#0061FF', background: '#EFF6FF', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Wifi size={12} /> ESCUTANDO
                  </span>
                </div>
                <p style={{ color: '#64748B', fontSize: '13px', marginTop: '-16px' }}>Feed ao vivo de requisições de API, emissões de CT-e e atualizações de tracking.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px', maxHeight: '320px', overflowY: 'auto' }}>
                  <div style={s.nodeRow}>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                      <span style={{ color: '#64748B' }}>[14:32:01]</span>
                      <span style={{ color: '#0061FF', fontWeight: 800 }}>POST</span>
                      <span style={{ fontFamily: 'monospace' }}>/v1/cte/emit</span>
                      <span style={{ color: '#0061FF' }}>(Transp. Rapidão)</span>
                    </div>
                    <span style={{ color: '#0061FF', fontWeight: 800 }}>200 OK</span>
                  </div>
                  <div style={s.nodeRow}>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                      <span style={{ color: '#64748B' }}>[14:31:58]</span>
                      <span style={{ color: '#0061FF', fontWeight: 800 }}>GET</span>
                      <span style={{ fontFamily: 'monospace' }}>/v1/tracking/route/4482</span>
                      <span style={{ color: '#0061FF' }}>(Rastreamento Público)</span>
                    </div>
                    <span style={{ color: '#0061FF', fontWeight: 800 }}>200 OK</span>
                  </div>
                  <div style={s.nodeRow}>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                      <span style={{ color: '#64748B' }}>[14:31:45]</span>
                      <span style={{ color: '#F59E0B', fontWeight: 800 }}>PATCH</span>
                      <span style={{ fontFamily: 'monospace' }}>/v1/vehicles/update-status</span>
                      <span style={{ color: '#0061FF' }}>(Expresso Federal)</span>
                    </div>
                    <span style={{ color: '#0061FF', fontWeight: 800 }}>200 OK</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TABS: TEMPO REAL - MONITORAMENTO */}
          {activeTab === 'monitoring' && (
            <div style={s.tabContent}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                <div style={s.card}>
                  <h3 style={s.cardTitleInline}>Saúde dos Serviços do Cluster</h3>
                  <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px', marginBottom: '24px' }}>Latência de API, conexões com banco e processamento de filas em tempo real.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { svc: 'API Gateway (Nginx / Go)', status: '99.99% Uptime', lat: '24ms', color: '#0061FF' },
                      { svc: 'Logta Realtime Service (Node.js Websockets)', status: '100% Uptime', lat: '12ms', color: '#0061FF' },
                      { svc: 'PostgreSQL Main Cluster (Supabase)', status: '99.97% Uptime', lat: '4ms', color: '#0061FF' },
                      { svc: 'Worker Filas (Redis / BullMQ)', status: 'Ativo', lat: '0ms backlog', color: '#0061FF' },
                    ].map((svc, i) => (
                      <div key={i} style={s.nodeRow}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>{svc.svc}</div>
                          <div style={{ fontSize: '12px', color: '#0061FF', fontWeight: 700, marginTop: '2px' }}>● {svc.status}</div>
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', background: '#F1F5F9', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, color: '#475569' }}>{svc.lat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={s.card}>
                  <h3 style={s.cardTitleInline}>Recursos Globais</h3>
                  <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[
                      { item: 'Uso de CPU (Cluster)', val: '42%' },
                      { item: 'Uso de RAM (Cluster)', val: '68%' },
                      { item: 'IOPS Banco de Dados', val: '1.2k / 5.0k' },
                    ].map((r, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                          <span>{r.item}</span>
                          <span>{r.val}</span>
                        </div>
                        <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: r.val.includes('/') ? '25%' : r.val, height: '100%', background: '#0061FF' }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REGISTROS */}
          {activeTab === 'logs' && (
            <div style={s.tabContent}>
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <h3 style={s.cardTitleInline}>Histórico de Auditoria Global Logta</h3>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0061FF', backgroundColor: '#EFF6FF', padding: '6px 14px', borderRadius: '20px' }}>AO VIVO</span>
                </div>
                {activities.length === 0 ? (
                  <div style={{ padding: '20px 0', color: '#94A3B8', fontSize: '13px' }}>Nenhuma atividade recente gravada na trilha de auditoria persistente.</div>
                ) : (
                  activities.map(a => (
                    <div 
                      key={a.id} 
                      style={{ ...s.actRow, cursor: 'pointer' }}
                      onClick={() => {
                        if (a.type === 'client') selectClient(a.refId);
                        else if (a.type === 'driver') selectEntity('driverId', a.refId);
                        else if (a.type === 'invoice') selectEntity('invoiceId', a.refId);
                      }}
                    >
                      <HubEntityAvatar
                        kind={a.type === 'driver' ? 'driver' : 'company'}
                        src={
                          a.type === 'driver'
                            ? resolveDriverPhoto(a.refId)
                            : resolveCompanyLogo({ id: a.refId, name: a.client })
                        }
                        name={a.client}
                        size={36}
                        accent="#0061FF"
                        style={a.type === 'client' ? { borderRadius: '10px' } : undefined}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={s.actTitle}>{a.event}</p>
                        <p style={s.actSub}>{a.client} · {a.detail}</p>
                      </div>
                      <span style={s.actTime}><Clock size={13} /> {a.time}</span>
                    </div>
                  ))
                )}
              </div>
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <h3 style={s.cardTitleInline}>Alertas Administrativos Recentes</h3>
                </div>
                {[
                  { action: 'Rota alterada manualmente', detail: 'Transportadora Falcão · Rota SP→RJ', time: '12:00', color: '#F59E0B', icon: '✎' },
                  { action: 'Acesso negado', detail: 'IP não autorizado: 203.45.12.99', time: '10:20', color: '#EF4444', icon: '✕' },
                ].map((ev, i) => (
                  <div 
                    key={i} 
                    style={{ ...s.auditRow, cursor: i === 0 ? 'pointer' : 'default' }}
                    onClick={() => { if (i === 0) selectRoute('RT-9021', 'Transportadora Falcão'); }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: ev.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{ev.icon}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{ev.action}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>{ev.detail}</p>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#CBD5E1' }}>{ev.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INTEGRAÇÕES (MAPEADO PARA TAB API) */}
          {activeTab === 'api' && (
            <div style={{ display: 'flex', gap: '40px', marginTop: '8px' }}>
              
              {/* Left Mini-sidebar */}
              <div style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Explore</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button style={{ padding: '8px 12px', background: '#F8FAFC', color: '#0F172A', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>All</button>
                    <button style={{ padding: '8px 12px', background: 'transparent', color: '#64748B', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>Wrappers</button>
                    <button style={{ padding: '8px 12px', background: 'transparent', color: '#64748B', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>Postgres Modules</button>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Installed</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: '#475569' }}>
                      <Terminal size={14} style={{ opacity: 0.7 }} /> Data API
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: '#475569' }}>
                      <Shield size={14} style={{ opacity: 0.7 }} /> Vault <span style={{ fontSize: '9px', color: '#F59E0B', border: '1px solid #FED7AA', background: '#FFFBEB', padding: '1px 4px', borderRadius: '4px', fontWeight: '800' }}>BETA</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>Extend your Logta ERP</h2>
                  <p style={{ color: '#64748B', fontSize: '14px', marginTop: '6px' }}>Extensions and wrappers that add functionality to your logistics operations and connect to external services.</p>
                </div>

                <div style={{ position: 'relative', maxWidth: '320px' }}>
                  <SearchIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input type="text" placeholder="Search integrations..." style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: '600', outline: 'none' }} />
                </div>

                {/* Featured Grid (3 columns) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                  
                  {/* Featured 1 */}
                  <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
                    <div style={{ height: '120px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', position: 'relative' }}>
                      <div style={{ transform: 'rotate(-5deg)', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '140px' }}>
                        <span style={{ padding: '4px 8px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', color: '#EF4444', fontSize: '9px', fontWeight: '700' }}>Every 5 minutes</span>
                        <span style={{ padding: '4px 8px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '9px' }}>Every night</span>
                        <span style={{ padding: '4px 8px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '9px' }}>Daily</span>
                      </div>
                    </div>
                    <div style={{ padding: '24px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>Cron Jobs</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>Schedule recurring fleet synchronizations and tracking reports.</p>
                      </div>
                      <span style={{ display: 'inline-flex', marginTop: '16px', fontSize: '9px', letterSpacing: '0.05em', fontWeight: '800', padding: '3px 8px', border: '1px solid #E2E8F0', background: '#F8FAFC', borderRadius: '6px', color: '#64748B' }}>OFFICIAL</span>
                    </div>
                  </div>

                  {/* Featured 2 */}
                  <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
                    <div style={{ height: '120px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', fontFamily: 'monospace', fontSize: '9px', color: '#94A3B8' }}>
                      <div style={{ width: '100%', opacity: 0.7 }}>
                        <div>&lt;xml version="1.0"&gt;</div>
                        <div style={{ color: '#0061FF' }}> &lt;infCte id="3522..."&gt;</div>
                        <div>   &lt;emit&gt;...&lt;/emit&gt;</div>
                        <div> &lt;/infCte&gt;</div>
                      </div>
                    </div>
                    <div style={{ padding: '24px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>SEFAZ Engine</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>Lightweight automated NFe/CTe XML issuing and validating queue.</p>
                      </div>
                      <span style={{ display: 'inline-flex', marginTop: '16px', fontSize: '9px', letterSpacing: '0.05em', fontWeight: '800', padding: '3px 8px', border: '1px solid #E2E8F0', background: '#F8FAFC', borderRadius: '6px', color: '#64748B' }}>OFFICIAL</span>
                    </div>
                  </div>

                  {/* Featured 3 */}
                  <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
                    <div style={{ height: '120px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', fontFamily: 'monospace', fontSize: '9px', color: '#94A3B8' }}>
                      <div style={{ width: '100%', opacity: 0.7, color: '#D97706' }}>
                        <div>-- extract coordinate items</div>
                        <div>SELECT id, <span style={{ color: '#2563EB' }}>st_astext(geom)</span></div>
                        <div>FROM global_routing_cache;</div>
                      </div>
                    </div>
                    <div style={{ padding: '24px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>Google Maps Sync</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>Continuously sync geographic routing, tolls and live traffic.</p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
                        <span style={{ fontSize: '9px', letterSpacing: '0.05em', fontWeight: '800', padding: '3px 8px', border: '1px solid #FED7AA', background: '#FFFBEB', borderRadius: '6px', color: '#D97706' }}>ALPHA</span>
                        <span style={{ fontSize: '9px', letterSpacing: '0.05em', fontWeight: '800', padding: '3px 8px', border: '1px solid #E2E8F0', background: '#F8FAFC', borderRadius: '6px', color: '#64748B' }}>OFFICIAL</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Standard Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                  
                  {/* Standard 1 */}
                  <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#FFFFFF', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
                        <Terminal size={16} color="#0F172A" />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0061FF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} /> Installed
                      </span>
                    </div>
                    <div>
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Data API</h5>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>Auto-generate public and tenant routing APIs directly from logistics schemas.</p>
                    </div>
                    <div style={{ display: 'flex', marginTop: 'auto' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 6px', border: '1px solid #E2E8F0', borderRadius: '4px', color: '#64748B', background: '#F8FAFC' }}>OFFICIAL</span>
                    </div>
                  </div>

                  {/* Standard 2 */}
                  <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#FFFFFF', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
                        <Shield size={16} color="#0F172A" />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0061FF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} /> Installed
                      </span>
                    </div>
                    <div>
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Vault</h5>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>Application level encryption for securing CT-e keys and carrier certificates.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 6px', border: '1px solid #FED7AA', borderRadius: '4px', color: '#D97706', background: '#FFFBEB' }}>BETA</span>
                      <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 6px', border: '1px solid #E2E8F0', borderRadius: '4px', color: '#64748B', background: '#F8FAFC' }}>OFFICIAL</span>
                    </div>
                  </div>

                  {/* Standard 3 */}
                  <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#FFFFFF', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
                        <PackageSearch size={16} color="#0061FF" />
                      </div>
                    </div>
                    <div>
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Mercado Livre Wrapper</h5>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>Connect client ML sales shipments directly into fleet dispatching.</p>
                    </div>
                    <div style={{ display: 'flex', marginTop: 'auto' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 6px', border: '1px solid #E2E8F0', borderRadius: '4px', color: '#64748B', background: '#F8FAFC' }}>OFFICIAL</span>
                    </div>
                  </div>

                  {/* Standard 4 */}
                  <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#FFFFFF', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
                        <FileText size={16} color="#7C3AED" />
                      </div>
                    </div>
                    <div>
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Bling ERP Wrapper</h5>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>No-code sync to import sales and financial invoices automatically.</p>
                    </div>
                    <div style={{ display: 'flex', marginTop: 'auto' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 6px', border: '1px solid #E2E8F0', borderRadius: '4px', color: '#64748B', background: '#F8FAFC' }}>OFFICIAL</span>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}




          {/* CONFIGURAÇÕES CONSOLIDADAS (WHITE LABEL + SEGURANÇA) */}
          {activeTab === 'settings' && (
            <div style={s.tabContent}>
              <div style={hubPillTabStripStyles.container}>
                {[
                  { id: 'general', label: 'Geral / White Label', icon: Settings },
                  { id: 'auth', label: 'Autenticação', icon: Key },
                  { id: 'security', label: 'Segurança & RLS', icon: Shield },
                  { id: 'permissions', label: 'Permissões', icon: Lock },
                  { id: 'audit', label: 'Auditoria & Logs', icon: FileText }
                ].map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setSettingsTab(t.id as any)}
                    style={{ 
                      ...hubPillTabStripStyles.button,
                      ...(settingsTab === t.id ? hubPillTabStripStyles.buttonActive : {})
                    }}
                  >
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>

              {settingsTab === 'general' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                  <div style={s.card}>
                    <h3 style={s.cardTitleInline}>Identidade Visual (White-label)</h3>
                    <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>Personalize a aparência do sistema para os seus clientes.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>NOME DA PLATAFORMA</label>
                        <input type="text" value={whiteLabel.name} onChange={e => setWhiteLabel(p => ({...p, name: e.target.value}))} style={s.readonlyInput} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>SLOGAN / SUBTÍTULO</label>
                        <input type="text" value={whiteLabel.slogan} onChange={e => setWhiteLabel(p => ({...p, slogan: e.target.value}))} style={s.readonlyInput} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>COR PRIMÁRIA</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="color" value={whiteLabel.primaryColor} onChange={e => setWhiteLabel(p => ({...p, primaryColor: e.target.value}))} style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                            <input type="text" value={whiteLabel.primaryColor} onChange={e => setWhiteLabel(p => ({...p, primaryColor: e.target.value}))} style={{ ...s.readonlyInput, flex: 1 }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>COR SECUNDÁRIA</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="color" value={whiteLabel.secondaryColor} onChange={e => setWhiteLabel(p => ({...p, secondaryColor: e.target.value}))} style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                            <input type="text" value={whiteLabel.secondaryColor} onChange={e => setWhiteLabel(p => ({...p, secondaryColor: e.target.value}))} style={{ ...s.readonlyInput, flex: 1 }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>LOGOTIPO (PNG/SVG)</label>
                        <div style={{ border: '2px dashed #E2E8F0', padding: '24px', borderRadius: '16px', textAlign: 'center', backgroundColor: '#F8FAFC', cursor: 'pointer' }}>
                          <UploadCloud size={24} color="#94A3B8" />
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '8px', fontWeight: '600' }}>Click to upload or drag and drop</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => toastSuccess('Configurações de White Label aplicadas em todo o ecossistema Logta!')}
                        style={{ ...s.actionBtn, background: '#0061FF', borderColor: '#0061FF', color: '#FFFFFF', marginTop: '12px', padding: '12px', justifyContent: 'center' }}
                      >
                        Save changes
                      </button>
                    </div>
                  </div>

                  <div style={s.card}>
                    <h3 style={s.cardTitleInline}>Domínios & Customização</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
                      <div style={s.nodeRow}>
                        <div>
                          <div style={{ fontWeight: '800', color: '#0F172A' }}>Domínio Master</div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>app.logta.io</div>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#0061FF', background: '#0061FF15', padding: '4px 8px', borderRadius: '4px' }}>ACTIVE</span>
                      </div>
                      <div style={s.nodeRow}>
                        <div>
                          <div style={{ fontWeight: '800', color: '#0F172A' }}>Email Transacional</div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>notifications@logta.io</div>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#0061FF', background: '#0061FF15', padding: '4px 8px', borderRadius: '4px' }}>VERIFIED</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'security' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={s.card}>
                    <h3 style={s.cardTitleInline}>Segurança de Dados & RLS</h3>
                    <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>Proteção a nível de banco de dados e isolamento de tenants.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                      <div style={s.nodeRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Database size={20} color="#0061FF" />
                          <div>
                            <div style={{ fontWeight: '800', color: '#0F172A' }}>Row Level Security (RLS)</div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>Isolamento total de dados entre clientes ativo.</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#0061FF', background: '#DBEAFE', padding: '4px 10px', borderRadius: '6px' }}>PROTEGIDO</span>
                      </div>
                      <div style={s.nodeRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Globe size={20} color="#0061FF" />
                          <div>
                            <div style={{ fontWeight: '800', color: '#0F172A' }}>Restrição de Domínio Oficial</div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>Apenas acessos via domínios autorizados são permitidos.</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#0061FF', background: '#EFF6FF', padding: '4px 10px', borderRadius: '6px' }}>ATIVO</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'auth' && (
                <div style={s.card}>
                  <h3 style={s.cardTitleInline}>Políticas de Autenticação</h3>
                  <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>Gerencie como os usuários acessam o ecossistema Logta.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                    <div style={s.nodeRow}>
                      <div style={{ fontWeight: '800', color: '#0F172A' }}>Autenticação de Dois Fatores (2FA)</div>
                      <button style={s.actionBtn}>Required</button>
                    </div>
                    <div style={s.nodeRow}>
                      <div style={{ fontWeight: '800', color: '#0F172A' }}>Tempo de Sessão (Horas)</div>
                      <input type="number" defaultValue={24} style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: '700', color: '#0F172A' }} />
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'permissions' && (
                <div style={s.card}>
                  <h3 style={s.cardTitleInline}>Controle de Acesso Global (RBAC)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px' }}>
                    {[
                      { role: 'Master Admin', access: 'Total (Leitura/Escrita)', users: 2, color: '#EF4444' },
                      { role: 'Suporte Técnico', access: 'Limitado (Leitura + Edição)', users: 5, color: '#3B82F6' },
                      { role: 'Gerente Empresa', access: 'Contextual (Apenas sua empresa)', users: 49, color: '#0061FF' }
                    ].map((r, i) => (
                      <div key={i} style={{ ...s.card, padding: '24px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: '900', color: r.color, fontSize: '16px', letterSpacing: '-0.02em' }}>{r.role}</div>
                        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontWeight: '600' }}>{r.access}</div>
                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8' }}>{r.users} USUÁRIOS</span>
                          <button style={s.actionBtn}>Configurar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {settingsTab === 'audit' && (
                <div style={s.card}>
                  <h3 style={s.cardTitleInline}>Auditoria & Logs de Segurança</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                    {[
                      { ev: 'Troca de Senha', usr: 'marcos@falcao.com', ip: '201.23.4.1', time: 'Há 5 min' },
                      { ev: 'Acesso Negado', usr: 'desconhecido', ip: '45.1.2.3', time: 'Há 12 min' },
                      { ev: 'Alteração de Plano', usr: 'alison@logta.io', ip: '192.168.1.1', time: 'Hoje, 09:12' }
                    ].map((l, i) => (
                      <div key={i} style={s.nodeRow}>
                        <div>
                          <div style={{ fontWeight: 800 }}>{l.ev}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{l.usr} · {l.ip}</div>
                        </div>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{l.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
        </div>
      </div>

      <LogtaModal
        isOpen={isAddClientOpen}
        onClose={() => !savingClient && setIsAddClientOpen(false)}
        title="Adicionar Cliente Logta"
        subtitle="Crie a conta e libere o acesso ao Logta"
        icon={<UserPlus color="#0061FF" />}
        primaryAction={{
          label: savingClient ? 'Salvando…' : 'Criar & Liberar Acesso',
          onClick: handleAddClient,
          disabled: savingClient,
        }}
        secondaryAction={{
          label: 'Cancelar',
          onClick: () => setIsAddClientOpen(false),
          disabled: savingClient,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          {(
            [
              ['Nome da Empresa', 'name', 'text', 'Ex: Transportadora XYZ', true],
              ['Razão Social', 'razaoSocial', 'text', 'Razão social completa', false],
              ['CNPJ', 'cnpj', 'text', '00.000.000/0000-00', false],
              ['E-mail de Acesso', 'email', 'email', 'contato@empresa.com', true],
              ['Telefone / WhatsApp', 'phone', 'tel', '(11) 99999-9999', false],
              ['Responsável (Admin)', 'contactName', 'text', 'Nome do gestor', false],
              ['Subdomínio', 'subdomain', 'text', 'transportadora-xyz', false],
              ['Cidade', 'cidade', 'text', 'São Paulo', false],
              ['UF', 'uf', 'text', 'SP', false],
            ] as const
          ).map(([label, field, type, ph, required]) => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px' }}>
                {label}{required ? ' *' : ''}
              </label>
              <input
                type={type}
                placeholder={ph}
                value={newClient[field]}
                maxLength={field === 'uf' ? 2 : undefined}
                onChange={(e) => {
                  const raw = e.target.value;
                  const value =
                    field === 'cnpj'
                      ? maskCnpj(raw)
                      : field === 'uf'
                        ? raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)
                        : raw;
                  setNewClient((p) => ({ ...p, [field]: value }));
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #E2E8F0', fontSize: '15px', fontWeight: '600', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px' }}>Plano Logta *</label>
            <select value={newClient.plan} onChange={e => setNewClient(p => ({ ...p, plan: e.target.value }))}
              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #E2E8F0', fontSize: '15px', fontWeight: '600', outline: 'none', boxSizing: 'border-box' }}>
              {['Start', 'Pro', 'Enterprise'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748B', fontWeight: '600', lineHeight: 1.45 }}>
            A empresa será gravada no Hub e espelhada no tenant Logta. O e-mail informado será usado para o acesso.
          </p>
        </div>
      </LogtaModal>

      <LogtaModal 
        isOpen={isLogdockModalOpen} 
        onClose={() => setIsLogdockModalOpen(false)} 
        title="Editar Recursos do Cluster Logdock" 
        subtitle="Configure as cotas de hardware alocadas para esta instância" 
        icon={<Settings color="#0061FF" />}
        primaryAction={{ label: 'Salvar & Provisionar', onClick: () => { setIsLogdockModalOpen(false); toastSuccess('Ajustando limites do Logdock... As alterações foram replicadas no cluster!'); } }}
        secondaryAction={{ label: 'Cancelar', onClick: () => setIsLogdockModalOpen(false) }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px 0' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>CPU Cores</label>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{logdockConfig.cpu} vCPUs</span>
            </div>
            <input 
              type="range" min="2" max="64" step="2" 
              value={logdockConfig.cpu} 
              onChange={e => setLogdockConfig(p => ({ ...p, cpu: parseInt(e.target.value) }))}
              style={{ width: '100%', accentColor: '#0061FF' }} 
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Memória RAM</label>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{logdockConfig.ram} GB</span>
            </div>
            <input 
              type="range" min="4" max="256" step="4" 
              value={logdockConfig.ram} 
              onChange={e => setLogdockConfig(p => ({ ...p, ram: parseInt(e.target.value) }))}
              style={{ width: '100%', accentColor: '#3B82F6' }} 
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Armazenamento SSD</label>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{logdockConfig.disk} GB</span>
            </div>
            <input 
              type="range" min="50" max="2000" step="50" 
              value={logdockConfig.disk} 
              onChange={e => setLogdockConfig(p => ({ ...p, disk: parseInt(e.target.value) }))}
              style={{ width: '100%', accentColor: '#F59E0B' }} 
            />
          </div>

          <div style={{ background: '#EFF6FF', border: '1px solid #DBEAFE', padding: '16px', borderRadius: '16px', fontSize: '12px', color: '#1E40AF', fontWeight: '600' }}>
            ℹ O cluster Logdock realizará um rolling update de 0-downtime para aplicar estas novas configurações na infraestrutura subjacente.
          </div>
        </div>
      </LogtaModal>

      <LogtaModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        title="Cobrança e Gestão Financeira"
        subtitle="Gere faturas, libere planos de teste ou recarregue créditos de IA para clientes."
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={s.fieldGroup}>
            <span style={s.fieldLabel}>Selecionar Cliente</span>
            <div style={s.fieldInputWrapper}>
              <UserCheck size={18} color="#94A3B8" />
              <select style={s.fieldInput} value={financeForm.clientId} onChange={e => setFinanceForm(p => ({ ...p, clientId: e.target.value }))}>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={s.formGrid}>
            <div style={s.fieldGroup}>
              <span style={s.fieldLabel}>Tipo de Operação</span>
              <div style={s.fieldInputWrapper}>
                <Layers size={18} color="#94A3B8" />
                <select style={s.fieldInput} value={financeForm.operationType} onChange={e => setFinanceForm(p => ({ ...p, operationType: e.target.value }))}>
                  <option value="subscription">Assinatura de Plano</option>
                  <option value="credits">Créditos de Inteligência Artificial</option>
                  <option value="trial">Dias Gratuitos (Trial / Isenção)</option>
                </select>
              </div>
            </div>

            {financeForm.operationType === 'subscription' && (
              <div style={s.fieldGroup}>
                <span style={s.fieldLabel}>Plano SaaS Logta</span>
                <div style={s.fieldInputWrapper}>
                  <Zap size={18} color="#94A3B8" />
                  <select style={s.fieldInput} value={financeForm.planId} onChange={e => setFinanceForm(p => ({ ...p, planId: e.target.value }))}>
                    <option value="Start">Logta Start (R$ 800)</option>
                    <option value="Pro">Logta Pro (R$ 4.500)</option>
                    <option value="Enterprise">Logta Enterprise (R$ 8.200)</option>
                  </select>
                </div>
              </div>
            )}

            {financeForm.operationType === 'credits' && (
              <div style={s.fieldGroup}>
                <span style={s.fieldLabel}>Pacote de Créditos</span>
                <div style={s.fieldInputWrapper}>
                  <Zap size={18} color="#94A3B8" />
                  <select style={s.fieldInput} value={financeForm.planId} onChange={e => setFinanceForm(p => ({ ...p, planId: e.target.value }))}>
                    <option value="100">100 Créditos IA (R$ 200)</option>
                    <option value="500">500 Créditos IA (R$ 800)</option>
                    <option value="2000">2.000 Créditos IA (R$ 2.500)</option>
                  </select>
                </div>
              </div>
            )}

            {financeForm.operationType === 'trial' && (
              <div style={s.fieldGroup}>
                <span style={s.fieldLabel}>Dias de Liberação</span>
                <div style={s.fieldInputWrapper}>
                  <Calendar size={18} color="#94A3B8" />
                  <input style={s.fieldInput} type="number" placeholder="Ex: 15" value={financeForm.amount} onChange={e => setFinanceForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          <div style={s.formGrid}>
            <div style={s.fieldGroup}>
              <span style={s.fieldLabel}>Formato de Pagamento / Ação</span>
              <div style={s.fieldInputWrapper}>
                <DollarSign size={18} color="#94A3B8" />
                <select style={s.fieldInput} value={financeForm.paymentMethod} onChange={e => setFinanceForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                  <option value="boleto">Gerar Boleto Bancário (Automático)</option>
                  <option value="credit_card">Link de Cartão de Crédito</option>
                  <option value="pix">Gerar Chave PIX</option>
                  <option value="manual">Liberação Manual Interna (Isento de Pagamento)</option>
                </select>
              </div>
            </div>

            {financeForm.paymentMethod !== 'manual' && financeForm.operationType === 'subscription' && (
              <div style={{ ...s.fieldGroup, justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginTop: '24px' }}>
                  <input type="checkbox" checked={financeForm.isAutoRenew} onChange={e => setFinanceForm(p => ({ ...p, isAutoRenew: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: '#0061FF' }} />
                  Recorrência Automática Ativa
                </label>
              </div>
            )}
          </div>

          <div style={{ background: financeForm.paymentMethod === 'manual' ? '#EFF6FF' : '#EFF6FF', border: financeForm.paymentMethod === 'manual' ? '1px solid #DBEAFE' : '1px solid #DBEAFE', padding: '16px', borderRadius: '16px', fontSize: '12px', color: financeForm.paymentMethod === 'manual' ? '#1E40AF' : '#1E40AF', fontWeight: '600' }}>
            {financeForm.paymentMethod === 'manual' ? 'ℹ Ao confirmar, a operação será liberada na conta do cliente imediatamente, isentando-o de pagamento financeiro externo.' : 'ℹ Um gateway de pagamento gerará automaticamente o formato selecionado e o cliente será notificado em seu Dashboard.'}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button onClick={() => setIsFinanceModalOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={handleFinanceSave} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 32px', borderRadius: '999px', border: 'none', backgroundColor: '#0061FF', color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 97, 255, 0.25)' }}>
              <CheckCircle2 size={18} /> Confirmar Ação
            </button>
          </div>
        </div>
      </LogtaModal>
      
      <LogtaModal 
        isOpen={isAddPlanModalOpen} 
        onClose={() => setIsAddPlanModalOpen(false)} 
        title="Novo plano (checkout público)" 
        subtitle="Defina pacote, valor e forma de pagamento para checkout automático." 
        icon={<Zap color="#0061FF" />}
        size="lg"
        primaryAction={{ label: 'GERAR LINK DO PLANO', onClick: handleGenerateLogtaPlan, loading: savingPlan }}
        secondaryAction={{ label: 'Cancelar', onClick: () => setIsAddPlanModalOpen(false) }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', padding: '12px 0' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>Itens inclusos</div>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 16px 0' }}>Selecione o que entra neste plano comercial.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'logta', label: 'Assinatura Logta', icon: Building, desc: 'Licenciamento SaaS Principal' },
                { id: 'ai', label: 'Créditos IA', icon: Activity, desc: 'Rotas otimizadas via LLM' },
                { id: 'backup', label: 'Backup Cloud', icon: ShieldCheck, desc: 'Cópia fria de notas fiscais' },
              ].map(prod => {
                const Icon = prod.icon;
                const isSel = newPlanCharge.selectedProducts.includes(prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      const cur = [...newPlanCharge.selectedProducts];
                      if (cur.includes(prod.id)) {
                        setNewPlanCharge({ ...newPlanCharge, selectedProducts: cur.filter(x => x !== prod.id) });
                      } else {
                        setNewPlanCharge({ ...newPlanCharge, selectedProducts: [...cur, prod.id] });
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      border: `2px solid ${isSel ? '#0061FF' : '#F1F5F9'}`,
                      backgroundColor: isSel ? '#F4F8FF' : '#FFFFFF',
                      boxShadow: isSel ? '0 8px 20px -4px rgba(0, 97, 255, 0.1)' : '0 1px 2px rgba(0,0,0,0.01)',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={e => { if(!isSel) e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    onMouseLeave={e => { if(!isSel) e.currentTarget.style.borderColor = '#F1F5F9'; }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: isSel ? 'rgba(0, 97, 255, 0.1)' : '#F8FAFC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}>
                      <Icon size={18} color={isSel ? '#0061FF' : '#94A3B8'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: isSel ? '#0061FF' : '#1E293B' }}>{prod.label}</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', marginTop: '1px' }}>{prod.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>Valor e Pagamento</div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 16px 0' }}>Preço e recorrência para cobrança.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>VALOR MENSAL (R$)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={newPlanCharge.amount} 
                  onChange={e => setNewPlanCharge({ ...newPlanCharge, amount: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '16px', fontWeight: '700', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>MÉTODO DE PAGAMENTO</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'PIX', label: 'PIX', icon: Zap },
                  { id: 'BOLETO', label: 'Boleto', icon: BarChart3 },
                  { id: 'CREDIT_CARD', label: 'Cartão', icon: CreditCard },
                  { id: 'LINK', label: 'Link Direct', icon: Copy },
                ].map(method => {
                  const isSel = newPlanCharge.method === method.id;
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setNewPlanCharge({ ...newPlanCharge, method: method.id })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '12px 8px',
                        borderRadius: '10px',
                        border: `1px solid ${isSel ? '#0061FF' : '#E2E8F0'}`,
                        backgroundColor: isSel ? '#F0F7FF' : '#FFFFFF',
                        color: isSel ? '#0061FF' : '#475569',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <Icon size={14} />
                      {method.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>CUPOM (OPCIONAL)</label>
                <input 
                  type="text" 
                  placeholder="Ex: LOGTA10" 
                  value={newPlanCharge.coupon} 
                  onChange={e => {
                    const code = e.target.value.toUpperCase();
                    let newAmt = newPlanCharge.amount;
                    if (code === 'LOGTA10' && newPlanCharge.coupon !== 'LOGTA10') {
                      const val = parseFloat(newPlanCharge.amount) || 0;
                      newAmt = (val * 0.9).toFixed(2);
                      toastSuccess('Cupom ativado! 10% de desconto.');
                    }
                    setNewPlanCharge({ ...newPlanCharge, coupon: code, amount: newAmt });
                  }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '2px solid #E2E8F0', fontSize: '13px', fontWeight: '700', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '12px', border: '1px solid #E2E8F0', fontSize: '11px', color: '#64748B', display: 'flex', gap: '8px' }}>
              <Zap size={16} color="#0061FF" style={{ flexShrink: 0 }} />
              <span>Ao gerar este plano público, um link de assinatura recorrente será gerado no Asaas e sincronizado com a base de cobranças master automaticamente.</span>
            </div>
          </div>
        </div>
      </LogtaModal>

      <LogtaModal
        isOpen={isApiGatewayModalOpen}
        onClose={() => setIsApiGatewayModalOpen(false)}
        title="APIs & Gateway — visão técnica"
        subtitle="Metadados, limites e clusters ativos (demonstração integrada ao Hub)."
        size="lg"
      >
        <div style={{ padding: '8px 8px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Base pública</div>
              <code style={{ fontSize: '13px', display: 'block', marginTop: '6px', color: '#0F172A' }}>https://api.logta.io/v1</code>
            </div>
            <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Regiões</div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '6px', color: '#1E293B' }}>gru-1 · gru-2 · virginia-edge</div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 8px' }}>Rate limit padrão: <b>1.200 req/min</b> por tenant · burst <b>2.000</b>. Webhooks HMAC-SHA256 com replay window de 5 minutos.</p>
            <p style={{ margin: 0 }}>SDKs: REST JSON, streaming de eventos (SSE) e fila de dead-letter em Redis para reprocessamento automático.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" style={s.actionBtn} onClick={() => setIsApiGatewayModalOpen(false)}>Fechar</button>
            <button type="button" style={{ ...s.actionBtn, background: '#0061FF', color: '#fff', borderColor: '#0061FF' }} onClick={() => toastSuccess('Política de gateway aplicada (mock).')}>Aplicar política</button>
          </div>
        </div>
      </LogtaModal>

      <LogtaModal isOpen={isClusterClientModalOpen} onClose={() => setIsClusterClientModalOpen(false)} size="md" title="Detalhes do Tenant no Cluster">
        {selectedClusterClient && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: '#475569' }}>
                {selectedClusterClient.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{selectedClusterClient.name}</h3>
                <span style={{ display: 'inline-flex', marginTop: '6px', fontSize: '11px', fontWeight: 800, padding: '2px 8px', backgroundColor: '#EFF6FF', color: '#0061FF', borderRadius: '6px' }}>TOTALMENTE ATIVO</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plano Selecionado</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', marginTop: '4px' }}>{selectedClusterClient.plan}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consumo Mensal</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0061FF', marginTop: '4px' }}>{selectedClusterClient.vol}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button style={s.actionBtn} onClick={() => setIsClusterClientModalOpen(false)}>Fechar</button>
              <button 
                style={{ ...s.actionBtn, background: '#0061FF', color: '#FFFFFF', borderColor: '#0061FF' }} 
                onClick={() => {
                  setIsClusterClientModalOpen(false);
                  selectClient(selectedClusterClient.id, 'operacoes');
                }}
              >
                Ir para Perfil do Cliente <ChevronRight size={16} style={{ marginLeft: '4px' }} />
              </button>
            </div>
          </div>
        )}
      </LogtaModal>

    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  ...HUB_MASTER_PRODUCT_SHELL,
  header: { padding: '40px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  title: { ...HUB_PAGE_TITLE },
  subtitle: { ...HUB_PAGE_SUBTITLE },
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '100px', border: 'none', backgroundColor: '#0061FF', color: '#FFFFFF', fontSize: '14px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', boxShadow: '0 4px 12px rgba(0, 97, 255, 0.25)' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '32px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  cardTitleInline: { ...HUB_SECTION_TITLE, fontSize: '18px' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0', height: '36px' },
  searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: '13px', fontWeight: '400', width: '220px', color: '#0F172A' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '16px 20px', verticalAlign: 'middle', fontSize: '13px', textAlign: 'left' },
  tdCheckbox: { padding: '16px 20px', verticalAlign: 'middle', fontSize: '13px', textAlign: 'center' },
  clientName: { fontSize: '14px', fontWeight: '600', color: '#0F172A' },
  badge: { padding: '4px 8px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '4px', fontSize: '11px', fontWeight: '700' },
  stat: { fontSize: '13px', fontWeight: 500, color: '#64748B' },
  actionBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '100px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '11px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.02em', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s' },
  
  chartCard: { backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '220px' },
  chartLabel: { fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' },
  chartValue: { fontSize: '28px', fontWeight: '700', color: '#0F172A', margin: 0 },
  
  actRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  actTitle: { margin: 0, fontSize: '14px', fontWeight: '700', color: '#1E293B' },
  actSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '500' },
  actTime: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600', color: '#CBD5E1', whiteSpace: 'nowrap' },
  
  nodeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' },
  integrationBox: { padding: '20px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  readonlyInput: { width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#64748B', fontSize: '13px', outline: 'none', fontWeight: 500 },
};

export default LogtaAdmin;
