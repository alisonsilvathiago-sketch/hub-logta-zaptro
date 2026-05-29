import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, PackageSearch, TrendingUp, Shield, Truck,
  Clock, AlertTriangle, CheckCircle2, Lock, Edit3, Save, X,
  MapPin, FileText, DollarSign, Activity, Zap, Users, Building2,
  Phone, Mail, UserCheck, Key, Map as MapIcon, ChevronRight, Smartphone, Plus, MessageSquare, Trash2,
  RefreshCcw, FileSpreadsheet, Search, Download, QrCode, Coins, Terminal, ShieldAlert, Copy,
  Sparkles, Palette, Globe, Bot, CreditCard
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import HubSupabaseChart from '@shared/components/HubSupabaseChart';
import LogtaModal from '@shared/components/Modal';
import MapGlobal, { Marker, Popup, truckIcon, carIcon, problemIcon } from '@shared/components/MapGlobal';
import { toastSuccess, toastError } from '@core/lib/toast';
import { supabase } from '@core/lib/supabase';
import { publishLogtaEntitlementsToClient } from '@core/lib/logtaEntitlementsPush';
import {
  activePlanEntitlements,
  defaultTrialEntitlements,
  expiredEntitlements,
  type LogtaHubEntitlementsV1,
} from '@shared/lib/logtaEntitlementsContract';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';
import HubEntityAvatar from '@shared/components/HubEntityAvatar';
import {
  driversForClient,
  resolveCollabPhoto,
  resolveCompanyLogo,
  resolveDriverPhoto,
} from '@hub/lib/logtaEntityMedia';

export type LogtaCompanySnapshot = {
  id?: string;
  name?: string;
  plan?: string;
  logoUrl?: string | null;
  logo_url?: string | null;
};

interface LogtaClientProfileProps {
  clientId?: string;
  initialTab?: 'operacoes' | 'financeiro' | 'frota' | 'cadastro' | 'seguranca';
  onBack?: () => void;
  /** Dados já carregados no LogtaAdmin (inclui logo do Supabase). */
  companySnapshot?: LogtaCompanySnapshot | null;
}

const COLLAB_PAGE_PERMISSION_OPTIONS = [
  'Rotas', 'Entregas', 'Frota', 'Faturamento', 'Clientes',
  'Operações', 'Rastreamento', 'Alertas', 'Financeiro', 'CT-e / MDF-e', 'Relatórios',
];

type ClientAutomationFlow = {
  id: string;
  name: string;
  type: string;
  trigger: string;
  status: string;
  updates: string;
  aiModel: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  iconCol: string;
};

type RemoteCompanyRow = {
  name?: string | null;
  plan?: string | null;
  logo_url?: string | null;
  email?: string | null;
  document?: string | null;
  phone?: string | null;
  status?: string | null;
};

const LogtaClientProfile: React.FC<LogtaClientProfileProps> = ({ clientId, initialTab, onBack, companySnapshot }) => {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const id = clientId || routeId;

  // Smart mock fallback builder to enable absolute richness for ANY client in the monorepo
  const getClientData = (uid: string) => {
    const nameMap: Record<string, string> = {
      '1': 'Transportadora Falcão',
      'demo-11': 'Expresso Federal',
      'demo-12': 'Rápido Trans',
      'demo-13': 'TransNorte Cargo',
      'demo-20': 'Alfa Transportes',
      'demo-21': 'Falcão Trans',
      'demo-23': 'Rápido Sul'
    };
    const clientName = nameMap[uid] || `Expresso Logística ${uid.toUpperCase()}`;
    const clientPlan = uid === 'demo-13' ? 'Start' : (uid.includes('11') || uid === '1' ? 'Enterprise' : 'Pro');
    return {
      id: uid,
      name: clientName,
      email: `diretoria@${clientName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}.com.br`,
      plan: clientPlan,
      vehicleLimit: clientPlan === 'Enterprise' ? 500 : (clientPlan === 'Pro' ? 150 : 30),
      cnpj: `45.201.${Math.floor(100 + Math.random() * 899)}/0001-92`,
      phone: '(11) 99102-3821',
      address: 'Rodovia Anhanguera, KM 14 - São Paulo, SP',
      responsible: 'Diretoria Executiva',
      status: 'active',
      vehicles: clientPlan === 'Enterprise' ? 450 : 120,
      routes: clientPlan === 'Enterprise' ? 4500 : 890,
      logoUrl: null,
      collaborators: [
        { id: 1, name: 'Rodrigo Oliveira', role: 'Gestor de Logística', lastLogin: 'Hoje, 08:15', email: 'rodrigo.oliveira@falcao-trans.com.br', phone: '(11) 98821-1101', accessPages: ['Rotas', 'Entregas', 'Frota', 'Faturamento', 'Clientes'], blocked: false },
        { id: 2, name: 'Renata Garcia', role: 'Controladora Operacional', lastLogin: 'Agora mesmo', email: 'renata.garcia@falcao-trans.com.br', phone: '(11) 98821-2202', accessPages: ['Operações', 'Rastreamento', 'Alertas'], blocked: false },
        { id: 3, name: 'Lucas Ferreira', role: 'Faturista Master', lastLogin: 'Ontem, 18:00', email: 'lucas.ferreira@falcao-trans.com.br', phone: '(11) 98821-3303', accessPages: ['Financeiro', 'CT-e / MDF-e', 'Relatórios'], blocked: false },
      ],
      drivers: driversForClient(uid),
    };
  };

  const [remoteCompany, setRemoteCompany] = useState<RemoteCompanyRow | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function loadCompanyBrand() {
      const snapLogo = companySnapshot?.logoUrl ?? companySnapshot?.logo_url ?? null;
      const snapName = companySnapshot?.name;
      const snapPlan = companySnapshot?.plan;

      // Regex simples para UUID v4
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (!isUuid) {
        setRemoteCompany(null);
        return;
      }

      const [{ data: company }, { data: empresa }] = await Promise.all([
        supabase
          .from('companies')
          .select('id,name,plan,logo_url,email,document,phone,status')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('empresas')
          .select('id,nome_fantasia,plano_atual,logo_url,email_contato,cnpj,status')
          .eq('id', id)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      const logoFromDb = company?.logo_url || empresa?.logo_url || snapLogo;
      const nameFromDb = company?.name || empresa?.nome_fantasia || snapName;
      const planFromDb = company?.plan || empresa?.plano_atual || snapPlan;

      if (logoFromDb || nameFromDb || planFromDb || company || empresa) {
        setRemoteCompany({
          logo_url: logoFromDb,
          name: nameFromDb ?? null,
          plan: planFromDb ?? null,
          email: company?.email || empresa?.email_contato || null,
          document: company?.document || empresa?.cnpj || null,
          phone: company?.phone || null,
          status: company?.status || empresa?.status || null,
        });
      } else if (snapLogo || snapName) {
        setRemoteCompany({
          logo_url: snapLogo,
          name: snapName ?? null,
          plan: snapPlan ?? null,
        });
      } else {
        setRemoteCompany(null);
      }
    }

    loadCompanyBrand();
    return () => { cancelled = true; };
  }, [id, companySnapshot?.logoUrl, companySnapshot?.logo_url, companySnapshot?.name, companySnapshot?.plan]);

  const client = useMemo(() => {
    const base = getClientData(id || '1');
    const snapLogo = companySnapshot?.logoUrl ?? companySnapshot?.logo_url;
    const mergedLogo =
      remoteCompany?.logo_url ??
      snapLogo ??
      base.logoUrl;
    const mergedName = remoteCompany?.name || companySnapshot?.name || base.name;
    const rawPlan = remoteCompany?.plan || companySnapshot?.plan || base.plan;
    const mergedPlan = rawPlan?.replace(/^Logta\s+/i, '') || base.plan;

    return {
      ...base,
      name: mergedName,
      plan: mergedPlan,
      logoUrl: mergedLogo,
      email: remoteCompany?.email || base.email,
      cnpj: remoteCompany?.document || base.cnpj,
      phone: remoteCompany?.phone || base.phone,
      status:
        remoteCompany?.status === 'bloqueado' || remoteCompany?.status === 'blocked'
          ? 'blocked'
          : remoteCompany?.status === 'cancelado' || remoteCompany?.status === 'warning'
            ? 'warning'
            : base.status,
      products: [
        { id: 'zaptro', name: 'ZapTro', active: true, color: '#7C3AED', icon: Zap },
        { id: 'logta', name: 'Logta', active: (id === '1' || id?.includes('demo')), color: '#0061FF', icon: Truck },
        { id: 'logdock', name: 'LogDock', active: (id === '1'), color: '#16A34A', icon: PackageSearch }
      ].filter(p => p.active)
    };
  }, [id, remoteCompany, companySnapshot]);

  /** Só logo real (Logta/Supabase); sem mock — sem logo → inicial do nome. */
  const companyLogo = resolveCompanyLogo(
    { id: client.id, logoUrl: client.logoUrl, name: client.name },
    { includeMock: false },
  );

  const [activeTab, setActiveTab] = useState<'operacoes' | 'financeiro' | 'frota' | 'cadastro' | 'seguranca' | 'whatsapp_cloud' | 'consumo' | 'developer' | 'zaptro_master'>(initialTab || 'operacoes');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    setCollaboratorsState(getClientData(id || '1').collaborators);
    setCollabInlineDetail(false);
    setSelectedCollab(null);
    setCollabEditInline(false);
  }, [id]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isInlineChatOpen, setIsInlineChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'hub' | 'client', text: string, time: string }>>([
    { sender: 'client', text: 'Olá! Precisamos de suporte com a emissão de uma MDF-e em contingência.', time: '10:24' },
    { sender: 'hub', text: 'Olá! Sou o time Master do Hub. Qual seria a chave de acesso ou CNPJ do emitente?', time: '10:25' },
  ]);

  const [corpSearch, setCorpSearch] = useState('');
  const [isCorpModalOpen, setIsCorpModalOpen] = useState(false);
  const [selectedCorp, setSelectedCorp] = useState<any>(null);

  const [clientFlows, setClientFlows] = useState<ClientAutomationFlow[]>([
    { id: 'f1', name: 'Sincronizador Financeiro Asaas', type: 'Boleto / PIX Sync', trigger: 'Emissão de CTE', status: 'Ativo', updates: 'Há 3 min', aiModel: 'Logta Rules Engine', Icon: DollarSign, color: '#E0F2FE', iconCol: '#0284C7' },
    { id: 'f2', name: 'WhatsApp Rastreio Pro', type: 'Notificações Instantâneas', trigger: 'Troca de Status da Rota', status: 'Ativo', updates: 'Há 12 min', aiModel: 'WhatsApp Cloud API', Icon: Phone, color: '#DBEAFE', iconCol: '#0061FF' },
    { id: 'f3', name: 'Webhook Logístico Principal', type: 'Push de Eventos ERP', trigger: 'Finalização de Viagem', status: 'Ativo', updates: 'Há 1 min', aiModel: '—', Icon: RefreshCcw, color: '#EDE9FE', iconCol: '#7C3AED' },
  ]);
  const [isNovaAutomacaoOpen, setIsNovaAutomacaoOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [chargeAmount, setChargeAmount] = useState('500.00');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto'>('pix');
  const [zaptroSubTab, setZaptroSubTab] = useState('financeiro_wa');
  const [novaFlowForm, setNovaFlowForm] = useState({
    name: '',
    type: '',
    trigger: '',
    aiModel: 'GPT-4o (Logta Assist)',
    status: 'Ativo' as 'Ativo' | 'Em Testes',
  });

  const [selectedCollab, setSelectedCollab] = useState<any>(null);
  const [collabInlineDetail, setCollabInlineDetail] = useState(false);
  const [collabEditInline, setCollabEditInline] = useState(false);
  const [permDraft, setPermDraft] = useState<string[]>([]);
  const [collabEditSaving, setCollabEditSaving] = useState(false);
  const [collabEditForm, setCollabEditForm] = useState({
    originalEmail: '',
    name: '',
    email: '',
    phone: '',
    role: '',
    blocked: false,
  });
  const [collaboratorsState, setCollaboratorsState] = useState(() => getClientData(id || '1').collaborators);

  const activeCollab = useMemo(
    () =>
      selectedCollab
        ? collaboratorsState.find((x: any) => x.id === selectedCollab.id) || selectedCollab
        : null,
    [selectedCollab, collaboratorsState],
  );

  const closeCollabDetail = useCallback(() => {
    setCollabInlineDetail(false);
    setSelectedCollab(null);
    setCollabEditInline(false);
  }, []);

  const openCollabDetail = useCallback((c: any, withEdit = false) => {
    setSelectedCollab(c);
    setPermDraft([...(c.accessPages || [])]);
    setCollabInlineDetail(true);
    if (withEdit) {
      setCollabEditForm({
        originalEmail: c.email,
        name: c.name,
        email: c.email,
        phone: c.phone || '',
        role: c.role,
        blocked: !!c.blocked,
      });
      setCollabEditInline(true);
    } else {
      setCollabEditInline(false);
    }
  }, []);

  const openCollabEditInline = useCallback(() => {
    if (!activeCollab) return;
    setCollabEditForm({
      originalEmail: activeCollab.email,
      name: activeCollab.name,
      email: activeCollab.email,
      phone: activeCollab.phone || '',
      role: activeCollab.role,
      blocked: !!activeCollab.blocked,
    });
    setCollabEditInline(true);
  }, [activeCollab]);

  useEffect(() => {
    if (!collabInlineDetail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (collabEditInline) {
        setCollabEditInline(false);
        return;
      }
      closeCollabDetail();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [collabInlineDetail, collabEditInline, closeCollabDetail]);

  const persistCollabSupabase = async (
    lookupEmail: string,
    patch: { full_name?: string; email?: string; status?: string },
  ): Promise<{ ok: boolean; message?: string }> => {
    const key = lookupEmail.trim();
    if (!key) return { ok: false, message: 'E-mail inválido.' };
    const { data: row, error: qErr } = await supabase.from('profiles').select('id').eq('email', key).maybeSingle();
    if (qErr) return { ok: false, message: qErr.message };
    if (!row?.id) return { ok: false, message: 'not_found' };
    const { error } = await supabase.from('profiles').update(patch).eq('id', row.id);
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  };

  const openDriverInHub = (driverId: string) => {
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.delete('clientId');
      n.delete('profileTab');
      n.delete('routeId');
      n.delete('invoiceId');
      n.delete('deliveryId');
      n.delete('vehicleId');
      n.delete('userId');
      n.set('tab', 'drivers');
      n.set('driverId', driverId);
      return n;
    }, { replace: true });
  };

  const openRouteInHub = (routeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.delete('clientId');
      n.delete('profileTab');
      n.delete('driverId');
      n.delete('invoiceId');
      n.delete('deliveryId');
      n.delete('vehicleId');
      n.delete('userId');
      n.set('tab', 'routes');
      n.set('routeId', routeId);
      n.set('routeClient', client.name);
      return n;
    }, { replace: true });
  };

  const openAllDriversInHub = () => {
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.delete('clientId');
      n.delete('profileTab');
      n.delete('routeId');
      n.delete('driverId');
      n.delete('invoiceId');
      n.delete('deliveryId');
      n.delete('vehicleId');
      n.delete('userId');
      n.set('tab', 'drivers');
      return n;
    }, { replace: true });
  };

  const handleSaveNovaAutomacao = () => {
    if (!novaFlowForm.name.trim()) {
      toastSuccess('Informe o nome da automação.');
      return;
    }
    const newFlow: ClientAutomationFlow = {
      id: `flow-${Date.now()}`,
      name: novaFlowForm.name.trim(),
      type: novaFlowForm.type.trim() || 'Integração customizada',
      trigger: novaFlowForm.trigger.trim() || 'Webhook / agendamento',
      status: novaFlowForm.status,
      updates: 'Agora',
      aiModel: novaFlowForm.aiModel.trim() || '—',
      Icon: Zap,
      color: '#EDE9FE',
      iconCol: '#7C3AED',
    };
    setClientFlows(prev => [newFlow, ...prev].slice(0, 3));
    setIsNovaAutomacaoOpen(false);
    setNovaFlowForm({ name: '', type: '', trigger: '', aiModel: 'GPT-4o (Logta Assist)', status: 'Ativo' });
    toastSuccess('Automação registrada para o tenant.');
  };

  const isEditing = false; // Controlled via edit modal
  const [editForm, setEditForm] = useState({ 
    name: client.name, 
    email: client.email, 
    plan: client.plan, 
    limit: String(client.vehicleLimit),
    cnpj: client.cnpj,
    phone: client.phone,
    address: client.address,
    responsible: client.responsible,
    status: client.status,
    password: '••••••••',
    logoUrl: client.logoUrl || ''
  });

  useEffect(() => {
    setEditForm({
      name: client.name,
      email: client.email,
      plan: client.plan,
      limit: String(client.vehicleLimit),
      cnpj: client.cnpj,
      phone: client.phone,
      address: client.address,
      responsible: client.responsible,
      status: client.status,
      password: '••••••••',
      logoUrl: client.logoUrl || '',
    });
  }, [client.id, client.name, client.email, client.plan, client.vehicleLimit, client.cnpj, client.phone, client.address, client.responsible, client.status, client.logoUrl]);

  const pct = (client.vehicles / Number(editForm.limit)) * 100;

  const handleSave = async () => {
    const logo = editForm.logoUrl.trim() || null;
    if (id) {
      const [{ error: companyErr }, { error: empresaErr }] = await Promise.all([
        supabase.from('companies').update({ logo_url: logo, name: editForm.name.trim() }).eq('id', id),
        supabase.from('empresas').update({ logo_url: logo, nome_fantasia: editForm.name.trim() }).eq('id', id),
      ]);
      if (companyErr && empresaErr) {
        toastError('Não foi possível salvar o logo no servidor.');
        return;
      }
      setRemoteCompany(prev => ({ ...prev, logo_url: logo, name: editForm.name.trim() }));
    }
    toastSuccess(`Dados de "${editForm.name}" atualizados com sucesso!`);
    setIsEditModalOpen(false);
  };

  const handleSaveCollabEdit = async () => {
    if (!selectedCollab) return;
    setCollabEditSaving(true);
    try {
      const patch = {
        full_name: collabEditForm.name.trim(),
        email: collabEditForm.email.trim(),
        status: collabEditForm.blocked ? 'blocked' : 'active',
      };
      const res = await persistCollabSupabase(collabEditForm.originalEmail, patch);
      if (!res.ok) {
        if (res.message === 'not_found') {
          toastSuccess('Sem perfil no Supabase para este e-mail — lista local atualizada (demo).');
        } else {
          toastError(res.message || 'Falha ao sincronizar com o Supabase.');
        }
      } else {
        toastSuccess('Colaborador atualizado no Supabase.');
      }
      setCollaboratorsState(prev =>
        prev.map((x: any) =>
          x.id === selectedCollab.id
            ? {
                ...x,
                name: collabEditForm.name,
                email: collabEditForm.email,
                phone: collabEditForm.phone,
                role: collabEditForm.role,
                blocked: collabEditForm.blocked,
              }
            : x,
        ),
      );
      setSelectedCollab((prev: any) =>
        prev && prev.id === selectedCollab.id
          ? {
              ...prev,
              name: collabEditForm.name,
              email: collabEditForm.email,
              phone: collabEditForm.phone,
              role: collabEditForm.role,
              blocked: collabEditForm.blocked,
            }
          : prev,
      );
      setCollabEditForm(f => ({ ...f, originalEmail: collabEditForm.email.trim() }));
      setCollabEditInline(false);
    } finally {
      setCollabEditSaving(false);
    }
  };

  const handleCollabPasswordResetEmail = async (emailOverride?: string) => {
    const email = (emailOverride ?? collabEditForm.email).trim();
    if (!email) {
      toastError('Informe o e-mail.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) toastError(error.message);
    else toastSuccess('E-mail de redefinição de senha enviado (Supabase Auth).');
  };

  const toggleCollabPermInDraft = (page: string) => {
    setPermDraft(prev => (prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]));
  };

  const handleSaveCollabPermissions = () => {
    if (!activeCollab) return;
    setCollaboratorsState(prev =>
      prev.map((x: any) => (x.id === activeCollab.id ? { ...x, accessPages: [...permDraft] } : x)),
    );
    setSelectedCollab((prev: any) =>
      prev && prev.id === activeCollab.id ? { ...prev, accessPages: [...permDraft] } : prev,
    );
    toastSuccess('Permissões de páginas atualizadas.');
  };

  const tenantKey = (editForm.email || client.email || 'tenant@logta.com.br').trim().toLowerCase();

  const pushEntitlements = (e: LogtaHubEntitlementsV1) => {
    publishLogtaEntitlementsToClient(e);
    toastSuccess('Abrindo LOGTA para aplicar política do Hub…');
  };

  const trialEnds = () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString();
  };

  const statusColors = {
    active: { bg: '#EFF6FF', text: '#0061FF', label: '✓ Ativo' },
    blocked: { bg: '#FEF2F2', text: '#EF4444', label: '✕ Bloqueado' },
    warning: { bg: '#FFFBEB', text: '#F59E0B', label: '⚠ Pendente' },
  };

  const currStatus = (statusColors as any)[editForm.status] || statusColors.active;

  return (
    <div
      className={`logta-client-profile${clientId ? ' logta-client-profile--embedded' : ''}`}
    >
      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => onBack ? onBack() : navigate('/master/logta')}>
            <ArrowLeft size={20} />
          </button>
          
          <div style={{ position: 'relative', marginLeft: '8px' }}>
            <HubEntityAvatar
              kind="company"
              src={companyLogo}
              name={editForm.name || client.name}
              size={64}
              accent="#0061FF"
              imageFit="cover"
              letterFallback="brand"
              style={{
                borderRadius: '20px',
                border: companyLogo ? '1px solid #E2E8F0' : '2px solid #FFFFFF',
                boxShadow: companyLogo
                  ? '0 8px 24px rgba(0,0,0,0.12)'
                  : '0 8px 24px rgba(0, 97, 255, 0.35)',
                overflow: 'hidden',
              }}
            />
            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: currStatus.text, border: '4px solid #FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
          </div>

          <div style={{ marginLeft: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h1 style={s.clientName}>{editForm.name}</h1>
              <span style={{ ...s.statusBadge, backgroundColor: currStatus.bg, color: currStatus.text }}>{currStatus.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
              {client.products?.map((p: any) => (
                <div 
                  key={p.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    padding: '4px 10px', 
                    borderRadius: '8px', 
                    background: `${p.color}15`, 
                    color: p.color,
                    fontSize: '11px',
                    fontWeight: 800,
                    border: `1px solid ${p.color}30`
                  }}
                >
                  <p.icon size={12} /> {p.name}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={s.headerActions}>
          <button 
            style={{ ...s.chatBtn, width: '44px', height: '44px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} 
            title="Abrir Chat de Suporte com a Empresa"
            onClick={() => setIsInlineChatOpen(true)}
          >
            <MessageSquare size={18} />
          </button>
          <button 
            style={{ ...s.editBtn, width: '44px', height: '44px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} 
            title="Editar Cadastro da Empresa"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit3 size={18} />
          </button>
          <button 
            style={{ 
              backgroundColor: '#EFF6FF', 
              color: '#0061FF', 
              border: '1px solid rgba(0, 97, 255, 0.2)', 
              width: '44px', 
              height: '44px', 
              borderRadius: '50%', 
              padding: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexShrink: 0, 
              cursor: 'pointer', 
              boxShadow: '0 2px 8px rgba(0, 97, 255, 0.08)',
              transition: 'all 0.2s'
            }} 
            title="Controle de Políticas & Entitlements"
            onClick={() => setIsPolicyModalOpen(true)}
          >
            <Shield size={18} />
          </button>
          <button 
            style={{ ...s.deleteBtn, width: '44px', height: '44px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} 
            title="Excluir Cliente"
            onClick={() => {
              if(window.confirm('Excluir cliente permanentemente?')) {
                toastSuccess('Cliente excluído do Logta.');
                navigate('/master/logta');
              }
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* TABS */}
      <div style={s.content}>
        {/* SIDEBAR LATERAL */}
        <aside className="logta-client-profile-aside" aria-label="Seções do perfil">
          {[
            {
              title: 'Gestão & Operação',
              items: [
                { id: 'operacoes', label: 'Operações', Icon: Activity },
                { id: 'automacoes', label: 'Automações & Fluxos', Icon: RefreshCcw },
                { id: 'frota', label: 'Frota & Motoristas', Icon: Truck },
              ]
            },
            {
              title: 'Equipe & Relacionamento',
              items: [
                { id: 'colaboradores', label: `Colaboradores (${client.collaborators.length})`, Icon: Users },
                { id: 'clientes_finais', label: 'Clientes da Empresa', Icon: PackageSearch },
              ]
            },
            {
              title: 'Administrativo',
              items: [
                { id: 'cadastro', label: 'Dados Cadastrais', Icon: Building2 },
                { id: 'financeiro', label: 'Financeiro/Fiscal', Icon: DollarSign },
              ]
            },
            {
              title: 'Segurança',
              items: [
                { id: 'seguranca', label: 'Acesso & Segurança', Icon: Shield },
              ]
            },
            {
              title: 'WhatsApp & IA Gateway',
              items: [
                { id: 'whatsapp_cloud', label: 'Números Vinculados', Icon: QrCode },
                { id: 'consumo', label: 'Consumo & Créditos', Icon: Coins },
                { id: 'developer', label: 'Developer & Logs', Icon: Terminal },
              ]
            },
            {
              title: 'ZapTro Pro (Master)',
              items: [
                { id: 'zaptro_master', label: 'Configurações ZapTro', Icon: Sparkles },
              ]
            }
          ].map(grp => (
            <div key={grp.title} className="logta-client-sidebar-group" style={s.sidebarGroup}>
              <div style={s.sidebarGroupTitle}>{grp.title}</div>
              <div
                className="logta-client-pill-strip"
                style={{
                  ...hubPillTabStripStyles.container,
                  width: '100%',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  marginBottom: 0,
                  backgroundColor: '#FFFFFF',
                }}
              >
                {grp.items.map(({ id, label, Icon }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id as any)}
                      style={{
                        ...hubPillTabStripStyles.button,
                        ...(active ? hubPillTabStripStyles.buttonActive : {}),
                        width: '100%',
                        justifyContent: 'flex-start',
                        fontWeight: 500,
                        fontSize: '13px',
                      }}
                    >
                      <Icon size={16} color={active ? '#0061FF' : '#64748B'} style={{ transition: 'color 0.2s', flexShrink: 0 }} />
                      <span style={{ fontWeight: 500, textAlign: 'left' }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* ZAPTRO MASTER CONTROL */}
        {activeTab === 'zaptro_master' && (
          <div style={s.tabContent}>
            {/* Header Secundário ZapTro */}
            {/* Header Secundário ZapTro (Flat) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={onBack} style={{ background: 'rgb(241, 245, 249)', border: 'none', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgb(100, 116, 139)' }}>
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ margin: '0px', fontSize: '22px', fontWeight: '900', color: 'rgb(15, 23, 42)' }}>{client.name}</h2>
                    <button 
                      onClick={() => navigate(`/master/zaptro/${client.id}?tab=clients&token=${searchParams.get('token')}`)}
                      style={{ 
                        fontSize: '11px', 
                        fontWeight: '900', 
                        color: 'rgb(16, 185, 129)', 
                        background: 'rgb(220, 252, 231)', 
                        padding: '4px 14px', 
                        borderRadius: '100px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      VINCULADO AO ZAPTRO
                    </button>
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgb(100, 116, 139)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Smartphone size={14} /> {client.phone} • Business Tier 2
                    <button 
                      onClick={() => toastSuccess('Sessão resetada!')} 
                      style={{ 
                        ...HUB_MASTER_PRODUCT_SHELL.actionBtn, 
                        background: '#0F172A', 
                        color: 'white', 
                        padding: '10px 24px', 
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' 
                      }}
                    >
                      <RefreshCcw size={14} /> RESETAR SESSÃO
                    </button>
                    <button 
                      onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.DASHBOARD)} 
                      style={{ 
                        ...HUB_MASTER_PRODUCT_SHELL.actionBtn, 
                        background: '#25D366', 
                        color: 'white', 
                        padding: '10px 24px', 
                        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)' 
                      }}
                    >
                      <ExternalLink size={14} /> ABRIR NO ZAPTRO
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-tabs ZapTro (Flat) */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: 32, borderBottom: '1px solid rgb(241, 245, 249)' }}>
              {[
                { id: 'conversas', label: 'Conversas Live', icon: MessageSquare },
                { id: 'conexao', label: 'Conexão WA', icon: QrCode },
                { id: 'persona', label: 'Persona IA', icon: Bot },
                { id: 'colaboradores_wa', label: 'Colaboradores', icon: Users },
                { id: 'automacoes_wa', label: 'Automações', icon: Zap },
                { id: 'financeiro_wa', label: 'Financeiro', icon: Coins },
              ].map(tab => {
                const active = zaptroSubTab === tab.id;
                return (
                  <button 
                    key={tab.id}
                    onClick={() => setZaptroSubTab(tab.id)}
                    style={{ 
                      background: 'none', 
                      border: 'none',
                      borderBottom: active ? '2px solid rgb(37, 211, 102)' : '2px solid transparent', 
                      padding: '12px 4px', 
                      fontSize: '13px', 
                      fontWeight: active ? '800' : '600', 
                      color: active ? 'rgb(37, 211, 102)' : 'rgb(100, 116, 139)', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      transition: '0.2s' 
                    }}
                  >
                    <tab.icon size={16} /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Conteúdo da Sub-tab: Financeiro */}
            {zaptroSubTab === 'financeiro_wa' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Carteira Mini */}
                  <div style={{ ...s.card, padding: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>SALDO ZAPTRO DISPONÍVEL</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>R$ 4.820,00</div>
                  </div>

                  {/* Forma de Pagamento Cadastrada */}
                  <div style={{ padding: '16px 20px', borderRadius: 16, background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Visa Final 4422</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>Expira em 10/28 • Padrão</div>
                      </div>
                    </div>
                    <button style={{ ...s.actionBtn, padding: '6px 12px', fontSize: 11 }}>Alterar</button>
                  </div>

                  {/* Gerar Nova Cobrança */}
                  <div style={{ 
                    background: 'rgb(240, 253, 244)', 
                    borderRadius: '24px', 
                    padding: '24px', 
                    border: '1px solid rgb(220, 252, 231)', 
                    boxShadow: 'rgba(0, 0, 0, 0.05) 0px 4px 6px -1px, rgba(0, 0, 0, 0.03) 0px 2px 4px -1px' 
                  }}>
                    <h3 style={{ margin: '0px 0px 8px', fontSize: '20px', fontWeight: '900', color: 'rgb(22, 101, 52)' }}>Gerar Nova Cobrança</h3>
                    <p style={{ margin: '0px 0px 20px', fontSize: '13px', color: 'rgb(22, 101, 52)' }}>Selecione o valor e o método para gerar a recarga.</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                      {['100.00', '250.00', '500.00', '1000.00'].map(val => (
                        <button 
                          key={val}
                          onClick={() => setChargeAmount(val)}
                          style={{ 
                            padding: '12px', 
                            borderRadius: '12px', 
                            border: chargeAmount === val ? '2px solid rgb(22, 101, 52)' : '1px solid rgb(187, 247, 208)', 
                            background: chargeAmount === val ? 'rgb(220, 252, 231)' : 'white', 
                            fontWeight: '800', 
                            fontSize: '13px', 
                            color: 'rgb(22, 101, 52)', 
                            cursor: 'pointer' 
                          }}
                        >
                          R$ {parseFloat(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </button>
                      ))}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: 'rgb(22, 101, 52)', marginBottom: '8px' }}>VALOR PERSONALIZADO (R$)</label>
                      <input 
                        type="number" 
                        value={chargeAmount} 
                        onChange={e => setChargeAmount(e.target.value)}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgb(187, 247, 208)', fontWeight: '700' }} 
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                      {[
                        { id: 'pix', label: 'PIX', icon: QrCode },
                        { id: 'card', label: 'Cartão', icon: CreditCard },
                        { id: 'boleto', label: 'Boleto', icon: FileText },
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id as any)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            padding: '12px 8px',
                            borderRadius: 12,
                            border: paymentMethod === m.id ? '2px solid rgb(22, 101, 52)' : '1px solid rgb(187, 247, 208)',
                            background: paymentMethod === m.id ? 'rgb(220, 252, 231)' : 'white',
                            cursor: 'pointer',
                            color: 'rgb(22, 101, 52)'
                          }}
                        >
                          <m.icon size={16} />
                          <span style={{ fontSize: 10, fontWeight: 800 }}>{m.label}</span>
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => toastSuccess(`Cobrança de R$ ${chargeAmount} gerada via ${paymentMethod.toUpperCase()}!`)}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        padding: '16px', 
                        borderRadius: '12px', 
                        border: 'none', 
                        background: 'rgb(22, 101, 52)', 
                        color: 'white', 
                        fontSize: '13px', 
                        fontWeight: '700', 
                        cursor: 'pointer', 
                        transition: '0.2s', 
                        boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px', 
                        fontFamily: 'Inter, system-ui, sans-serif', 
                        width: '100%' 
                      }}
                    >
                      <Coins size={18} /> GERAR {paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'card' ? 'COBRANÇA NO CARTÃO' : 'BOLETO'} DE RECARGA
                    </button>
                  </div>
                </div>

                <div style={{ ...s.card, padding: 24 }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800 }}>Histórico Recente (Zaptro)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { desc: 'Consumo Mensagens (Bot)', val: '- R$ 12,40', date: 'Hoje, 09:12' },
                      { desc: 'Recarga via Hub Master', val: '+ R$ 500,00', date: 'Ontem, 14:30' },
                      { desc: 'Taxa Manutenção Canal', val: '- R$ 49,90', date: '01 Mai' },
                    ].map((t, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          setSelectedTransaction(t);
                          setIsTransactionModalOpen(true);
                        }}
                        style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9', cursor: 'pointer' }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{t.desc}</div>
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>{t.date}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: t.val.includes('+') ? '#10B981' : '#0F172A' }}>{t.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo da Sub-tab: Persona IA */}
            {zaptroSubTab === 'persona' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                <div style={s.card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <Bot size={20} color="#7C3AED" />
                    <h3 style={s.cardTitle}>Configuração de IA & Chatbot</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={s.fieldGroup}>
                      <label style={s.fieldLabel}>TOM DE VOZ DO ASSISTENTE</label>
                      <select style={{ ...s.fieldInput, width: '100%', padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                        <option>Profissional e Objetivo</option>
                        <option>Amigável e Próximo</option>
                        <option>Direto (Frases Curtas)</option>
                      </select>
                    </div>
                    <div style={s.fieldGroup}>
                      <label style={s.fieldLabel}>ASSINATURA DAS RESPOSTAS</label>
                      <input defaultValue={`— Time ${client.name}`} style={{ ...s.fieldInput, width: '100%', padding: '12px' }} />
                    </div>
                  </div>
                </div>

                <div style={s.card}>
                  <h3 style={s.cardTitle}>Branding do Bot</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={s.fieldGroup}>
                        <label style={s.fieldLabel}>COR DO BOT</label>
                        <div style={{ ...s.fieldInputWrapper, padding: '4px 12px' }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#7C3AED' }} />
                          <input defaultValue="#7C3AED" style={{ ...s.fieldInput, padding: '8px' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mensagem para abas não implementadas */}
            {!['financeiro_wa', 'persona'].includes(zaptroSubTab) && (
              <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                <Activity size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
                <h3 style={{ margin: 0, color: '#64748B' }}>Conteúdo em desenvolvimento</h3>
                <p style={{ color: '#94A3B8' }}>Esta funcionalidade do módulo ZapTro Master estará disponível em breve.</p>
              </div>
            )}
          </div>
        )}
        {/* OPERAÇÕES */}
        {activeTab === 'operacoes' && (
          <div style={s.tabContent}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <HubSupabaseChart label="ROTAS ATIVAS" value={client.routes.toLocaleString()} data={[40, 50, 60, 50, 40, 50, 60, 50, 40, 50]} />
              <HubSupabaseChart label="VEÍCULOS EM TRÂNSITO" value={String(client.vehicles)} data={[30, 40, 50, 60, 70, 80, 70, 60, 50, 40]} />
              <HubSupabaseChart label="ENTREGAS CONCLUÍDAS" value="94%" data={[20, 30, 40, 50, 60, 70, 80, 90, 80, 70]} />
              <HubSupabaseChart label="CT-ES EMITIDOS" value="1.2k" data={[10, 20, 30, 40, 50, 40, 30, 20, 10, 5]} />
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Performance Operacional</h3>
              {[
                { label: 'Emissão de Documentos', val: '99.8%', desc: 'Estável' },
                { label: 'Rastreamento GPS', val: '100%', desc: 'Estável' },
                { label: 'Ocupação de Frota', val: '72%', desc: 'Moderado' },
              ].map(i => (
                <div key={i.label} style={s.auditRow}>
                  <div style={{ flex: 1 }}><p className="logta-profile-snap-title" style={s.snapTitle}>{i.label}</p><p style={s.snapSub}>{i.desc}</p></div>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#0061FF' }}>{i.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DADOS CADASTRAIS */}
        {activeTab === 'cadastro' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Informações da Empresa</h3>
              <div style={s.formGrid}>
                {[
                  ['CNPJ / CPF', 'cnpj', FileText],
                  ['Responsável', 'responsible', UserCheck],
                  ['Telefone', 'phone', Phone],
                  ['E-mail', 'email', Mail],
                ].map(([label, key, Icon]: any) => (
                  <div key={key} style={s.fieldGroup}>
                    <label style={s.fieldLabel}>{label}</label>
                    <div style={s.fieldInputWrapper}>
                      <Icon size={16} color="#94A3B8" />
                      {isEditing ? (
                        <input value={(editForm as any)[key]} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} style={s.fieldInput} />
                      ) : (
                        <span style={s.fieldValue}>{(editForm as any)[key]}</span>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ ...s.fieldGroup, gridColumn: 'span 2' }}>
                  <label style={s.fieldLabel}>Endereço Completo</label>
                  <div style={s.fieldInputWrapper}>
                    <MapPin size={16} color="#94A3B8" />
                    {isEditing ? (
                      <input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} style={s.fieldInput} />
                    ) : (
                      <span style={s.fieldValue}>{editForm.address}</span>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div style={{ ...s.fieldGroup, gridColumn: 'span 2' }}>
                    <label style={s.fieldLabel}>Status da Conta</label>
                    <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} style={s.fieldSelect}>
                      <option value="active">Ativo</option>
                      <option value="blocked">Bloqueado</option>
                      <option value="warning">Pendente</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Colaboradores / Usuários</h3>
                <button style={s.addSmallBtn}><Plus size={14} /> Novo Colaborador</button>
              </div>
              <table style={s.table}>
                <thead><tr><th style={s.th}>Nome</th><th style={s.th}>Cargo/Nível</th><th style={s.th}>Último Acesso</th><th style={s.th}>Ações</th></tr></thead>
                <tbody>
                  {client.collaborators.map((c: any) => (
                    <tr key={c.id} style={s.tr}>
                      <td style={s.td}><span style={s.colabName}>{c.name}</span></td>
                      <td style={s.td}><span style={s.colabRole}>{c.role}</span></td>
                      <td style={s.td}><span style={s.colabTime}>{c.lastLogin}</span></td>
                      <td style={s.td}>
                        <button style={s.iconBtn} title="Resetar Senha"><Key size={14} /></button>
                        <button style={s.iconBtn} title="Editar"><Edit3 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FROTA & MOTORISTAS */}
        {activeTab === 'frota' && (
          <div style={s.tabContent}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <HubSupabaseChart label="FROTA ATUAL" value={`${client.vehicles}/${editForm.limit}`} data={[40, 50, 60, 50, 40, 50, 60, 50, 40, 50]} />
              <HubSupabaseChart label="MOTORISTAS" value={String(client.drivers.length)} data={[30, 40, 50, 60, 70, 80, 70, 60, 50, 40]} />
              <HubSupabaseChart label="EM MANUTENÇÃO" value="2" data={[5, 2, 8, 4, 2, 1, 3, 2, 1, 0]} />
              <HubSupabaseChart label="CAPACIDADE" value={`${pct.toFixed(1)}%`} data={[10, 20, 30, 40, 50, 40, 30, 20, 10, 5]} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(482px, 1fr)', gap: 0, alignItems: 'stretch', minHeight: '500px' }}>
              <div style={{ ...s.card, display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, paddingRight: '27px' }}>
                <h3 style={s.cardTitle}>Monitoramento em Tempo Real</h3>
                <div style={{ flex: 1, minHeight: '500px', marginTop: '12px', borderRadius: '24px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                  <MapGlobal 
                    center={[-23.55052, -46.633308]} 
                    zoom={13} 
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%', minHeight: '500px' }}
                  >
                    {truckIcon && client.drivers.filter((d: any) => d.mapPosition).map((d: any) => (
                      <Marker key={d.driverId} position={d.mapPosition} icon={truckIcon}>
                        <Popup>
                          <div style={{ padding: '4px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '13px' }}>{d.vehicle || 'Veículo em rota'}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>Motorista: {d.name}</p>
                            {d.routeId && (
                              <button
                                type="button"
                                onClick={() => openRouteInHub(d.routeId)}
                                style={{ marginTop: '6px', padding: '4px 8px', borderRadius: '8px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#0061FF', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                              >
                                {d.routeId}
                              </button>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    {carIcon && (
                      <Marker position={[-23.53800, -46.615000]} icon={carIcon}>
                        <Popup>
                          <p style={{ margin: 0, fontWeight: 600 }}>Origem: CD São Paulo</p>
                        </Popup>
                      </Marker>
                    )}
                    {problemIcon && (
                      <Marker position={[-23.55500, -46.638000]} icon={problemIcon}>
                        <Popup>
                          <p style={{ margin: 0, fontWeight: 600, color: '#EF4444' }}>Alerta de Tráfego</p>
                        </Popup>
                      </Marker>
                    )}
                  </MapGlobal>
                </div>
              </div>

              <div style={s.card}>
                <h3 style={s.cardTitle}>Motoristas Escalados</h3>
                {client.drivers.map((d: any) => (
                  <div
                    key={d.driverId}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDriverInHub(d.driverId)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDriverInHub(d.driverId); } }}
                    style={{ ...s.driverRow, cursor: 'pointer' }}
                  >
                    <HubEntityAvatar
                      kind="driver"
                      src={resolveDriverPhoto(d.driverId)}
                      name={d.name}
                      size={44}
                      style={{ borderRadius: '14px' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={s.driverName}>{d.name}</p>
                      <p style={s.driverSub}>{d.license}</p>
                      {d.routeId && (
                        <button
                          type="button"
                          onClick={e => openRouteInHub(d.routeId, e)}
                          style={{ margin: '6px 0 0', padding: 0, border: 'none', background: 'none', color: '#0061FF', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <MapIcon size={12} />
                          {d.routeId}
                          {d.routeLabel ? ` · ${d.routeLabel}` : ''}
                        </button>
                      )}
                    </div>
                    <span style={{ ...s.driverStatus, color: d.status === 'Em Rota' ? '#0061FF' : '#64748B' }}>{d.status}</span>
                  </div>
                ))}
                <button type="button" style={s.viewAllBtn} onClick={openAllDriversInHub}>Ver Todos os Motoristas <ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        )}

        {/* COLABORADORES */}
        {activeTab === ('colaboradores' as any) && (
          <div style={s.tabContent}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <HubSupabaseChart label="TOTAL MEMBROS" value={String(collaboratorsState.length)} data={[1, 2, 2, 3, 3, 3, 3, 3, 3, 3]} />
              <HubSupabaseChart label="ONLINE AGORA" value="1" data={[0, 1, 1, 1, 0, 1, 1, 0, 1, 1]} />
              <HubSupabaseChart label="LICENÇAS ATIVAS" value="3/10" data={[30, 30, 30, 30, 30, 30]} />
              <HubSupabaseChart label="TAXA ENGAJAMENTO" value="92%" data={[80, 85, 90, 92, 94]} />
            </div>

            {!collabInlineDetail && (
              <div style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h3 style={s.cardTitle}>Gestão de Colaboradores</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>Gerencie os funcionários que acessam esta empresa parceira.</p>
                  </div>
                  <button
                    type="button"
                    style={s.addSmallBtn}
                    onClick={() => toastSuccess('Interface de convite aberta')}
                  >
                    <Plus size={14} /> Adicionar Colaborador
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {collaboratorsState.map((c: any) => (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openCollabDetail(c)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openCollabDetail(c);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '18px 24px',
                        backgroundColor: '#FDFDFD',
                        borderRadius: '16px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <HubEntityAvatar
                          kind="user"
                          src={resolveCollabPhoto(c.id)}
                          name={c.name}
                          size={44}
                          accent="#475569"
                          style={{ borderRadius: '14px' }}
                        />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{c.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px' }}>{c.role}</span>
                            <span style={{ width: '4px', height: '4px', background: '#CBD5E1', borderRadius: '50%' }} />
                            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>Acesso: {c.lastLogin}</span>
                            {c.blocked && (
                              <span style={{ fontSize: '10px', fontWeight: 600, color: '#B91C1C', marginLeft: '6px' }}>Bloqueado</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                        <button
                          type="button"
                          title="Enviar link nova senha"
                          onClick={() => handleCollabPasswordResetEmail(c.email)}
                          style={s.iconBtn}
                        >
                          <Key size={14} />
                        </button>
                        <button type="button" title="Abrir e editar dados" onClick={() => openCollabDetail(c, true)} style={s.iconBtn}>
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          title="Excluir"
                          onClick={() => {
                            if (!window.confirm(`Remover ${c.name} da empresa?`)) return;
                            setCollaboratorsState(prev => prev.filter((x: any) => x.id !== c.id));
                            toastSuccess('Colaborador removido da lista (demo).');
                          }}
                          style={{ ...s.iconBtn, color: '#EF4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {collabInlineDetail && activeCollab && (
              <div style={s.card}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={closeCollabDetail}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#64748B',
                        }}
                      >
                        <ArrowLeft size={16} /> Voltar à lista
                      </button>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>Esc fecha este painel (ou o formulário de edição, se estiver aberto).</span>
                      <h3 style={{ ...s.cardTitle, margin: 0 }}>{activeCollab.name}</h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
                        {activeCollab.role} · {client.name}
                      </p>
                    </div>
                    <div className="hub-profile-action-bar">
                      <button
                        type="button"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: '#0061FF',
                          color: '#FFFFFF',
                          boxShadow: '0 2px 10px rgba(0, 97, 255, 0.28)',
                        }}
                        onClick={openCollabEditInline}
                      >
                        <Edit3 size={16} /> Editar dados
                      </button>
                      <button
                        type="button"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          backgroundColor: activeCollab.blocked ? '#0061FF' : '#FFFFFF',
                          color: activeCollab.blocked ? '#FFFFFF' : '#475569',
                          border: activeCollab.blocked ? 'none' : '1px solid #E2E8F0',
                          boxShadow: activeCollab.blocked ? '0 2px 10px rgba(0, 97, 255, 0.28)' : 'none',
                        }}
                        onClick={async () => {
                          const next = !activeCollab.blocked;
                          const res = await persistCollabSupabase(activeCollab.email, { status: next ? 'blocked' : 'active' });
                          if (!res.ok && res.message !== 'not_found') {
                            toastError(res.message || 'Falha ao atualizar status no Supabase.');
                          } else if (res.ok) {
                            toastSuccess(next ? 'Acesso bloqueado no Supabase.' : 'Acesso liberado no Supabase.');
                          } else {
                            toastSuccess(next ? 'Colaborador bloqueado (lista local).' : 'Colaborador desbloqueado (lista local).');
                          }
                          setCollaboratorsState(prev => prev.map((x: any) => (x.id === activeCollab.id ? { ...x, blocked: next } : x)));
                          setSelectedCollab((prev: any) => (prev && prev.id === activeCollab.id ? { ...prev, blocked: next } : prev));
                        }}
                      >
                        <Lock size={16} /> {activeCollab.blocked ? 'Desbloquear' : 'Bloquear acesso'}
                      </button>
                      <button
                        type="button"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: '1px solid #FECACA',
                          backgroundColor: '#FFFFFF',
                          color: '#B91C1C',
                        }}
                        onClick={() => {
                          if (!window.confirm(`Remover ${activeCollab.name} da empresa?`)) return;
                          setCollaboratorsState(prev => prev.filter((x: any) => x.id !== activeCollab.id));
                          closeCollabDetail();
                          toastSuccess('Colaborador removido da lista (demo).');
                        }}
                      >
                        <Trash2 size={16} /> Excluir
                      </button>
                      <button
                        type="button"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: '1px solid #0061FF',
                          backgroundColor: '#FFFFFF',
                          color: '#0061FF',
                        }}
                        onClick={() => handleCollabPasswordResetEmail(activeCollab.email)}
                      >
                        <Key size={16} /> Enviar link nova senha
                      </button>
                    </div>
                  </div>

                  {!collabEditInline && (
                    <div style={{ padding: '14px 16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>E-mail</span>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{activeCollab.email}</div>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginTop: '12px' }}>Telefone</span>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#475569', marginTop: '4px' }}>{activeCollab.phone || '—'}</div>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginTop: '12px' }}>Último acesso</span>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#475569', marginTop: '4px' }}>{activeCollab.lastLogin}</div>
                    </div>
                  )}

                  {collabEditInline && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={s.formGrid}>
                        <div style={s.fieldGroup}>
                          <span style={s.fieldLabel}>Nome completo</span>
                          <div style={s.fieldInputWrapper}>
                            <UserCheck size={18} color="#94A3B8" />
                            <input style={s.fieldInput} value={collabEditForm.name} onChange={e => setCollabEditForm(f => ({ ...f, name: e.target.value }))} />
                          </div>
                        </div>
                        <div style={s.fieldGroup}>
                          <span style={s.fieldLabel}>E-mail (login)</span>
                          <div style={s.fieldInputWrapper}>
                            <Mail size={18} color="#94A3B8" />
                            <input style={s.fieldInput} type="email" value={collabEditForm.email} onChange={e => setCollabEditForm(f => ({ ...f, email: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                      <div style={s.formGrid}>
                        <div style={s.fieldGroup}>
                          <span style={s.fieldLabel}>Telefone / WhatsApp</span>
                          <div style={s.fieldInputWrapper}>
                            <Phone size={18} color="#94A3B8" />
                            <input style={s.fieldInput} value={collabEditForm.phone} onChange={e => setCollabEditForm(f => ({ ...f, phone: e.target.value }))} />
                          </div>
                        </div>
                        <div style={s.fieldGroup}>
                          <span style={s.fieldLabel}>Função (exibição)</span>
                          <div style={s.fieldInputWrapper}>
                            <Building2 size={18} color="#94A3B8" />
                            <input style={s.fieldInput} value={collabEditForm.role} onChange={e => setCollabEditForm(f => ({ ...f, role: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                        <input type="checkbox" checked={collabEditForm.blocked} onChange={e => setCollabEditForm(f => ({ ...f, blocked: e.target.checked }))} />
                        Bloquear acesso (status no Supabase)
                      </label>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>
                        Nova senha: use o botão abaixo para enviar o link oficial do Supabase Auth.
                      </p>
                      <div className="hub-profile-action-bar">
                        <button type="button" style={s.cancelBtn} onClick={() => setCollabEditInline(false)} disabled={collabEditSaving}>
                          Cancelar
                        </button>
                        <button
                          type="button"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: 'none',
                            backgroundColor: '#0061FF',
                            color: '#FFFFFF',
                            opacity: collabEditSaving ? 0.7 : 1,
                          }}
                          disabled={collabEditSaving}
                          onClick={handleSaveCollabEdit}
                        >
                          <Save size={16} /> {collabEditSaving ? 'Salvando…' : 'Salvar alterações'}
                        </button>
                        <button
                          type="button"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: '1px solid #0061FF',
                            backgroundColor: '#FFFFFF',
                            color: '#0061FF',
                          }}
                          onClick={() => handleCollabPasswordResetEmail()}
                        >
                          <Key size={16} /> Enviar link nova senha
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Permissões — páginas com acesso</span>
                      <button
                        type="button"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: '#0061FF',
                          color: '#FFFFFF',
                          boxShadow: '0 2px 10px rgba(0, 97, 255, 0.28)',
                        }}
                        onClick={handleSaveCollabPermissions}
                      >
                        <CheckCircle2 size={16} /> Salvar permissões
                      </button>
                    </div>
                    <div className="hub-profile-action-bar">
                      {Array.from(new Set([...COLLAB_PAGE_PERMISSION_OPTIONS, ...permDraft])).map(page => (
                        <label
                          key={page}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#334155',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: `1px solid ${permDraft.includes(page) ? '#0061FF' : '#E2E8F0'}`,
                            background: permDraft.includes(page) ? 'rgba(0, 97, 255, 0.08)' : '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={permDraft.includes(page)}
                            onChange={() => toggleCollabPermInDraft(page)}
                            style={{ accentColor: '#0061FF' }}
                          />
                          {page}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CLIENTES DA EMPRESA */}
        {activeTab === ('clientes_finais' as any) && (
          <div style={s.tabContent}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <HubSupabaseChart label="CLIENTES TOTAIS" value="12" data={[8, 9, 10, 11, 12]} />
              <HubSupabaseChart label="VOLUME MENSAL" value="R$ 280k" data={[180, 200, 250, 280]} />
              <HubSupabaseChart label="CONTRATOS ATIVOS" value="9" data={[7, 8, 9, 9, 9]} />
              <HubSupabaseChart label="SATISFAÇÃO" value="98%" data={[95, 96, 98, 98]} />
            </div>

            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={s.cardTitle}>Carteira de Clientes Corporativos</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>Lista detalhada e monitoramento de contas atendidas pela transportadora.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '12px' }} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar cliente..." 
                      value={corpSearch}
                      onChange={e => setCorpSearch(e.target.value)}
                      style={{
                        padding: '10px 16px 10px 36px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        fontSize: '12px',
                        fontWeight: '700',
                        outline: 'none',
                        width: '200px',
                        backgroundColor: '#F8FAFC'
                      }}
                    />
                  </div>
                  <button 
                    title="Exportar para PDF"
                    onClick={() => toastSuccess('Lista de clientes exportada para PDF')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#64748B', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    <FileText size={14} /> PDF
                  </button>
                  <button 
                    title="Exportar para Excel"
                    onClick={() => toastSuccess('Lista de clientes exportada para Excel')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#64748B', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    <FileSpreadsheet size={14} /> EXCEL
                  </button>
                  <button 
                    style={{ ...s.addSmallBtn, height: '38px', padding: '0 16px' }} 
                    onClick={() => toastSuccess('Solicitar novo vínculo operacional')}
                  >
                    <Plus size={14} /> Vincular
                  </button>
                </div>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Empresa / Local</th>
                      <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Volume Mensal</th>
                      <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Faturamento Médio</th>
                      <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Status Contrato</th>
                      <th style={{ width: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Mercado Livre', location: 'CD Louveira, SP', vol: '1.2k entregas/mês', revenue: 'R$ 120.500', initials: 'ML', color: '#FCD34D', txt: '#78350F', cnpj: '12.345.678/0001-00', email: 'transporte@mercadolivre.com', lastDispatch: 'Há 5 min', phone: '(11) 3003-5000', mobile: '(11) 9 8123-4500', contactName: 'Bruno Mendes — Operações', city: 'Louveira, SP' },
                      { name: 'Magazine Luiza', location: 'CD Guarulhos, SP', vol: '850 entregas/mês', revenue: 'R$ 84.200', initials: 'ML', color: '#60A5FA', txt: '#1E3A8A', cnpj: '22.987.654/0002-99', email: 'operacoes@magalu.com.br', lastDispatch: 'Há 2 horas', phone: '(11) 3509-8800', mobile: '(11) 9 7440-2211', contactName: 'Carla Nunes — Logística B2B', city: 'Guarulhos, SP' },
                      { name: 'Amazon Brasil', location: 'CD Cajamar, SP', vol: '450 entregas/mês', revenue: 'R$ 45.000', initials: 'AM', color: '#F97316', txt: '#7C2D12', cnpj: '33.111.222/0001-03', email: 'ops-br@amazon.com', lastDispatch: 'Há 1 dia', phone: '(11) 4002-8922', mobile: '(11) 9 8200-7788', contactName: 'Diego Ramos — Last Mile', city: 'Cajamar, SP' },
                      { name: 'Lojas Americanas', location: 'CD Barueri, SP', vol: '310 entregas/mês', revenue: 'R$ 31.000', initials: 'LA', color: '#EF4444', txt: '#7F1D1D', cnpj: '44.555.666/0001-44', email: 'b2w@americanas.io', lastDispatch: 'Há 1 dia', phone: '(21) 3003-4141', mobile: '(21) 9 9811-0202', contactName: 'Fernanda Costa — CD Sul', city: 'Barueri, SP' },
                    ]
                    .filter(item => item.name.toLowerCase().includes(corpSearch.toLowerCase()) || item.location.toLowerCase().includes(corpSearch.toLowerCase()))
                    .map((c: any, idx: number) => (
                      <tr 
                        key={idx} 
                        onClick={() => { setSelectedCorp(c); setIsCorpModalOpen(true); }}
                        style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                      >
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: c.color, color: c.txt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px' }}>
                              {c.initials}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{c.name}</div>
                              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{c.location}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: '#475569' }}>{c.vol}</td>
                        <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: '#0061FF' }}>{c.revenue}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#0061FF', textTransform: 'uppercase' }}>Ativo</span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', color: '#94A3B8' }}>
                            <ChevronRight size={14} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* AUTOMAÇÕES E INTEGRAÇÕES */}
        {activeTab === ('automacoes' as any) && (
          <div style={s.tabContent}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, marginBottom: '24px' }}>
              <HubSupabaseChart label="FLUXOS ATIVOS" value={String(clientFlows.filter(f => f.status === 'Ativo').length)} data={[3, 3, 3, 3, 3]} />
              <HubSupabaseChart label="TRIGGERS HOJE" value="1.820" data={[800, 1200, 1500, 1820]} />
              <HubSupabaseChart label="FALHAS/ERROS" value="0" data={[0, 0, 0, 0, 0]} />
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '16px 0 15px 27px',
                border: '1px solid rgba(0, 0, 0, 0.04)',
                boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                minHeight: '500px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingRight: '27px' }}>
                <div>
                  <h3 style={{ ...s.cardTitle, margin: 0, fontWeight: 500, paddingBottom: 0 }}>Fluxos de Integração Logta</h3>
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Automações e APIs que a {client.name} está utilizando no ecossistema.</p>
                </div>
                <button 
                  type="button"
                  style={{ ...s.addSmallBtn, backgroundColor: '#F5F3FF', color: '#7C3AED' }} 
                  onClick={() => setIsNovaAutomacaoOpen(true)}
                >
                  <Plus size={14} /> Nova Automação
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0, minHeight: '500px', alignItems: 'stretch', flex: 1, paddingRight: '27px' }}>
                {clientFlows.slice(0, 3).map((flow, idx) => {
                  const Icon = flow.Icon;
                  return (
                    <div 
                      key={flow.id}
                      style={{
                        padding: '16px 12px 15px 20px',
                        borderRadius: '0',
                        borderTop: '1px solid #E2E8F0',
                        borderBottom: '1px solid #E2E8F0',
                        borderLeft: idx === 0 ? '1px solid #E2E8F0' : 'none',
                        borderRight: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0,
                        position: 'relative',
                        boxShadow: 'none',
                        minHeight: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: flow.color, color: flow.iconCol, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#1E293B' }}>{flow.name}</h4>
                            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{flow.type}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: '9px', fontWeight: 500, padding: '4px 8px', borderRadius: '6px', backgroundColor: flow.status === 'Ativo' ? '#EFF6FF' : '#FFFBEB', color: flow.status === 'Ativo' ? '#0061FF' : '#D97706' }}>
                          {flow.status}
                        </span>
                      </div>
                      <div style={{ padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9', marginBottom: '12px' }}>
                        <span style={{ display: 'block', fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 500 }}>IA / Motor</span>
                        <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500, marginTop: '2px', display: 'block' }}>{flow.aiModel}</span>
                        <span style={{ display: 'block', fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 500, marginTop: '10px' }}>Gatilho Executável</span>
                        <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: flow.status === 'Ativo' ? '#0061FF' : '#F59E0B' }} />
                          {flow.trigger}
                        </span>
                      <button 
                        type="button" 
                        onClick={() => toastSuccess(`Abrindo FlowBuilder para: ${flow.name}`)}
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: 8, 
                          padding: '10px 20px', 
                          borderRadius: '12px', 
                          border: '1px solid rgb(226, 232, 240)', 
                          background: 'rgb(15, 23, 42)', 
                          color: 'white', 
                          fontSize: '13px', 
                          fontWeight: 700, 
                          cursor: 'pointer', 
                          transition: '0.2s', 
                          boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px', 
                          fontFamily: 'Inter, system-ui, sans-serif',
                          width: '100%',
                          marginTop: '4px',
                          marginBottom: '8px'
                        }}
                      >
                        EDITAR NO FLOWBUILDER
                      </button>
                    </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94A3B8', fontWeight: 500, borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginTop: 'auto' }}>
                        <span>Última rodada: {flow.updates}</span>
                        <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#0061FF', fontWeight: 500, fontSize: '11px' }}>Logs de Fluxo</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Outras abas permanecem com o conteúdo básico ou expandido conforme necessário */}
        {activeTab === 'seguranca' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Segurança da Conta</h3>
              <div style={s.securityGrid}>
                <div style={s.securityItem}>
                  <div style={s.securityIcon}><Smartphone size={20} color="#0061FF" /></div>
                  <div style={{ flex: 1 }}>
                    <p className="logta-profile-snap-title" style={s.snapTitle}>Autenticação de Dois Fatores (2FA)</p>
                    <p style={s.snapSub}>Adicione uma camada extra de segurança à conta master.</p>
                  </div>
                  <button style={s.addSmallBtn} onClick={() => toastSuccess('2FA Ativado com sucesso!')}>Ativar 2FA</button>
                </div>

                <div style={s.securityItem}>
                  <div style={s.securityIcon}><Lock size={20} color="#EF4444" /></div>
                  <div style={{ flex: 1 }}>
                    <p className="logta-profile-snap-title" style={s.snapTitle}>Bloqueio de Sessões Simultâneas</p>
                    <p style={s.snapSub}>Impedir que múltiplos usuários usem a mesma conta.</p>
                  </div>
                  <button style={{ ...s.addSmallBtn, backgroundColor: '#FEF2F2', color: '#EF4444' }} onClick={() => toastSuccess('Bloqueio ativado!')}>Ativar Bloqueio</button>
                </div>

                <div style={s.securityItem}>
                  <div style={s.securityIcon}><Key size={20} color="#F59E0B" /></div>
                  <div style={{ flex: 1 }}>
                    <p className="logta-profile-snap-title" style={s.snapTitle}>Rotação de Chaves de API</p>
                    <p style={s.snapSub}>Última rotação há 45 dias. Recomendado realizar agora.</p>
                  </div>
                  <button style={{ ...s.addSmallBtn, backgroundColor: '#FFFBEB', color: '#F59E0B' }} onClick={() => toastSuccess('Chaves rotacionadas!')}>Rotacionar Agora</button>
                </div>
              </div>
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Logs de Auditoria Recentes</h3>
              {[
                { action: 'Login bem sucedido', user: 'alison@zaptro.com.br', date: 'Hoje, 14:20', ip: '189.12.3.45' },
                { action: 'Alteração de Permissão', user: 'ricardo@falcao.com.br', date: 'Ontem, 09:15', ip: '201.44.12.1' },
                { action: 'Tentativa de Login Falha', user: 'desconhecido', date: 'Há 2 dias', ip: '45.1.22.9' },
              ].map((log, i) => (
                <div key={i} style={s.auditRow}>
                  <div style={{ flex: 1 }}>
                    <p className="logta-profile-snap-title" style={s.snapTitle}>{log.action} · <span style={{ fontWeight: 500, color: '#64748B' }}>{log.user}</span></p>
                    <p style={s.snapSub}>{log.date} · IP: {log.ip}</p>
                  </div>
                  <CheckCircle2 size={16} color={log.action.includes('Falha') ? '#EF4444' : '#0061FF'} />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div style={s.tabContent}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <HubSupabaseChart label="FATURAMENTO (MÊS)" value="R$ 142.500" data={[40, 50, 60, 50, 40, 50, 60, 50, 40, 50]} />
              <HubSupabaseChart label="IMPOSTOS A PAGAR" value="R$ 12.430" data={[30, 40, 50, 60, 70, 80, 70, 60, 50, 40]} />
              <HubSupabaseChart label="CRÉDITO DISPONÍVEL" value="R$ 50.000" data={[20, 30, 40, 50, 60, 70, 80, 90, 80, 70]} />
              <HubSupabaseChart label="INADIMPLÊNCIA" value="2.4%" data={[10, 20, 30, 40, 50, 40, 30, 20, 10, 5]} />
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Documentos Fiscais Pendentes</h3>
              <div style={s.securityGrid}>
                {[
                  { doc: 'CT-e #1420', val: 'R$ 1.200,00', date: 'Hoje', status: 'Pendente' },
                  { doc: 'NFS-e #882', val: 'R$ 450,00', date: 'Ontem', status: 'Processando' },
                ].map((d, i) => (
                  <div key={i} style={s.securityItem}>
                    <div style={s.securityIcon}><FileText size={20} color="#64748B" /></div>
                    <div style={{ flex: 1 }}>
                      <p className="logta-profile-snap-title" style={s.snapTitle}>{d.doc} · {d.val}</p>
                      <p style={s.snapSub}>{d.date}</p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, backgroundColor: '#FFFBEB', color: '#F59E0B', padding: '4px 10px', borderRadius: '6px' }}>{d.status}</span>
                  </div>
                ))}
              </div>
              <button style={s.viewAllBtn}>Ver Todos os Documentos <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {/* WHATSAPP CLOUD */}
        {activeTab === 'whatsapp_cloud' && (
          <div style={s.tabContent}>
            <div style={{ padding: 24, borderRadius: 20, border: '1px solid #E9D5FF', background: 'linear-gradient(135deg, #FAF5FF 0%, #FFFFFF 100%)', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6D28D9', textTransform: 'uppercase' }}>Configuração Master</div>
              <h3 style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 800 }}>Maintenance Center: {client.name}</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Gerencie instâncias e pareamento QR diretamente deste console Master.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              <div style={{ ...s.card, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <QrCode size={20} color="#0061FF" />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Sessão & Pareamento</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>NÚMERO DA INSTÂNCIA</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input defaultValue={client.phone} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 14, fontWeight: 700 }} />
                      <button style={{ ...s.addSmallBtn, height: '44px', background: '#0F172A', color: '#FFF' }} onClick={() => toastSuccess('Sincronizado.')}>Sincronizar</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: '100%', maxWidth: 300, padding: 24, background: '#FFF', borderRadius: 24, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                      <QrCode size={180} color="#0F172A" />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                      <button style={{ ...s.addSmallBtn, borderRadius: 100, fontWeight: 900, textTransform: 'uppercase', background: '#0061FF', color: '#FFF', border: 'none', padding: '12px 32px' }} onClick={() => toastSuccess('QR Gerado.')}>GERAR QR</button>
                      <button style={{ ...s.addSmallBtn, borderRadius: 100, fontWeight: 900, textTransform: 'uppercase', padding: '12px 32px', background: '#FFF', color: '#0F172A', border: '1px solid #E2E8F0' }} onClick={() => toastSuccess('Reiniciando...')}>REINICIAR</button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ ...s.card, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <Activity size={20} color="#10B981" />
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Atividade Recente</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { ev: 'Mensagem Enviada', time: 'Agora', st: 'Delivered', color: '#10B981' },
                      { ev: 'Sessão Conectada', time: 'Há 12m', st: 'Active', color: '#3B82F6' },
                      { ev: 'Erro de Webhook', time: 'Hoje 09:12', st: 'Retry', color: '#EF4444' },
                    ].map((l, i) => (
                      <div key={i} style={{ padding: 12, borderRadius: 12, border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{l.ev}</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>{l.time}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: l.color, background: `${l.color}15`, padding: '4px 8px', borderRadius: 6 }}>{l.st.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: 20, borderRadius: 16, background: '#0F172A', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Shield size={16} color="#0061FF" />
                    <span style={{ fontSize: 13, fontWeight: 800 }}>Segurança Master</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>
                    Ações de manutenção neste canal são auditadas. O cliente não pode alterar estas configurações sem aprovação Master.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONSUMO & CRÉDITOS */}
        {activeTab === 'consumo' && (
          <div style={s.tabContent}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
              <div style={{ ...s.card, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <Coins size={20} color="#F59E0B" />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Carteira de WhatsApp</h3>
                </div>
                <div style={{ padding: 24, borderRadius: 20, background: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>SALDO DISPONÍVEL</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>R$ 4.820,00</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#10B981' }}>Saldo em conformidade</span>
                  </div>
                </div>

                {/* Forma de Pagamento Cadastrada */}
                <div style={{ padding: '16px 20px', borderRadius: 16, background: '#FFFFFF', border: '1px solid #E2E8F0', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Visa Final 4422</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>Expira em 10/28 • Padrão</div>
                    </div>
                  </div>
                  <button style={{ ...s.actionBtn, padding: '6px 12px', fontSize: 11 }}>Alterar</button>
                </div>

                {/* Gerar Nova Cobrança */}
                <div style={{ 
                  background: 'rgb(240, 253, 244)', 
                  borderRadius: '24px', 
                  padding: '24px', 
                  border: '1px solid rgb(220, 252, 231)', 
                  boxShadow: 'rgba(0, 0, 0, 0.05) 0px 4px 6px -1px, rgba(0, 0, 0, 0.03) 0px 2px 4px -1px' 
                }}>
                  <h3 style={{ margin: '0px 0px 8px', fontSize: '20px', fontWeight: '900', color: 'rgb(22, 101, 52)' }}>Gerar Nova Cobrança</h3>
                  <p style={{ margin: '0px 0px 20px', fontSize: '13px', color: 'rgb(22, 101, 52)' }}>Selecione o valor e o método para gerar a recarga.</p>
                  
                  {/* Seleção de Valor */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                    {['100.00', '250.00', '500.00', '1000.00'].map(val => (
                      <button 
                        key={val}
                        onClick={() => setChargeAmount(val)}
                        style={{ 
                          padding: '12px', 
                          borderRadius: '12px', 
                          border: chargeAmount === val ? '2px solid rgb(22, 101, 52)' : '1px solid rgb(187, 247, 208)', 
                          background: chargeAmount === val ? 'rgb(220, 252, 231)' : 'white', 
                          fontWeight: '800', 
                          fontSize: '13px', 
                          color: 'rgb(22, 101, 52)', 
                          cursor: 'pointer' 
                        }}
                      >
                        R$ {parseFloat(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </button>
                    ))}
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: 'rgb(22, 101, 52)', margin_bottom: '8px' }}>VALOR PERSONALIZADO (R$)</label>
                    <input 
                      type="number" 
                      value={chargeAmount} 
                      onChange={e => setChargeAmount(e.target.value)}
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgb(187, 247, 208)', font_weight: '700' }} 
                    />
                  </div>

                  {/* Seleção de Método */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    {[
                      { id: 'pix', label: 'PIX', icon: QrCode },
                      { id: 'card', label: 'Cartão', icon: CreditCard },
                      { id: 'boleto', label: 'Boleto', icon: FileText },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          padding: '12px 8px',
                          borderRadius: 12,
                          border: paymentMethod === m.id ? '2px solid rgb(22, 101, 52)' : '1px solid rgb(187, 247, 208)',
                          background: paymentMethod === m.id ? 'rgb(220, 252, 231)' : 'white',
                          cursor: 'pointer',
                          color: 'rgb(22, 101, 52)'
                        }}
                      >
                        <m.icon size={16} />
                        <span style={{ fontSize: 10, fontWeight: 800 }}>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => toastSuccess(`Cobrança de R$ ${chargeAmount} gerada via ${paymentMethod.toUpperCase()}!`)}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px', 
                      padding: '16px', 
                      borderRadius: '12px', 
                      border: 'none', 
                      background: 'rgb(22, 101, 52)', 
                      color: 'white', 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      cursor: 'pointer', 
                      transition: '0.2s', 
                      boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px', 
                      fontFamily: 'Inter, system-ui, sans-serif', 
                      width: '100%' 
                    }}
                  >
                    <Coins size={18} /> GERAR {paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'card' ? 'COBRANÇA NO CARTÃO' : 'BOLETO'} DE RECARGA
                  </button>
                </div>
              </div>

              <div style={{ ...s.card, padding: 24 }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800 }}>Histórico de Lançamentos</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { desc: 'Consumo Mensagens (Bot)', val: '- R$ 12,40', date: 'Hoje, 09:12' },
                    { desc: 'Recarga via Hub Master', val: '+ R$ 500,00', date: 'Ontem, 14:30' },
                    { desc: 'Taxa Manutenção Canal', val: '- R$ 49,90', date: '01 Mai' },
                    { desc: 'Consumo Mensagens (Atend.)', val: '- R$ 115,20', date: '30 Abr' },
                  ].map((t, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        setSelectedTransaction(t);
                        setIsTransactionModalOpen(true);
                      }}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '14px 16px', 
                        background: '#F8FAFC', 
                        borderRadius: 12, 
                        border: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{t.desc}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{t.date}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: t.val.includes('+') ? '#10B981' : '#0F172A' }}>{t.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEVELOPER & LOGS */}
        {activeTab === 'developer' && (
          <div style={s.tabContent}>
            <div style={{ ...s.card, padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Terminal size={20} color="#0061FF" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Message Stream (Live)</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'monospace', fontSize: 12 }}>
                {[
                  { time: '14:32:01', type: 'OUT', to: '5511999...', status: 'SENT', body: 'Seu CT-e #8822 foi emitido.' },
                  { time: '14:30:45', type: 'IN', from: '5511988...', body: 'Obrigado, recebido!' },
                  { time: '14:28:12', type: 'OUT', to: '5521977...', status: 'DELIVERED', body: 'Motorista em trânsito.' },
                ].map((l, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: '#0F172A', color: '#94A3B8', borderRadius: 8, display: 'flex', gap: 12 }}>
                    <span style={{ color: '#0061FF' }}>[{l.time}]</span>
                    <span style={{ color: l.type === 'IN' ? '#10B981' : '#F59E0B', fontWeight: 800 }}>{l.type}</span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.body}</span>
                    <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>{l.status || 'OK'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...s.card, padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800 }}>API Keys & Webhooks</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>TENANT API KEY (SECRET)</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <code style={{ flex: 1, padding: '12px', background: '#F1F5F9', borderRadius: 10, fontSize: 13 }}>sk_live_51Mxxxxxxxxxxxxxxxxxx</code>
                    <button style={s.iconBtn} onClick={() => toastSuccess('Chave copiada!')}><Copy size={14} /></button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>WEBHOOK DESTINATION</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input defaultValue="https://api.falcao.com.br/hooks/whatsapp" style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13 }} />
                    <button style={s.iconBtn}><Save size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <LogtaModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Cadastro da Empresa"
        subtitle="Atualize os dados, senha, logo e o plano da empresa."
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={s.formGrid}>
            <div style={s.fieldGroup}>
              <span style={s.fieldLabel}>Nome da Empresa</span>
              <div style={s.fieldInputWrapper}>
                <Building2 size={18} color="#94A3B8" />
                <input style={s.fieldInput} value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div style={s.fieldGroup}>
              <span style={s.fieldLabel}>E-mail de Acesso (Tenant)</span>
              <div style={s.fieldInputWrapper}>
                <Mail size={18} color="#94A3B8" />
                <input style={s.fieldInput} value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
          </div>

          <div style={s.formGrid}>
            <div style={s.fieldGroup}>
              <span style={s.fieldLabel}>Nova Senha de Acesso</span>
              <div style={s.fieldInputWrapper}>
                <Key size={18} color="#94A3B8" />
                <input style={s.fieldInput} type="password" value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} />
              </div>
            </div>
            <div style={s.fieldGroup}>
              <span style={s.fieldLabel}>URL da Logo (Foto)</span>
              <div style={s.fieldInputWrapper}>
                <UserCheck size={18} color="#94A3B8" />
                <input style={s.fieldInput} value={editForm.logoUrl} onChange={e => setEditForm(p => ({ ...p, logoUrl: e.target.value }))} placeholder="https://..." />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                A mesma logo configurada no Logta SaaS (empresa) aparece aqui automaticamente.
              </p>
            </div>
          </div>

          <div style={s.formGrid}>
            <div style={s.fieldGroup}>
              <span style={s.fieldLabel}>Plano Contratado</span>
              <select style={s.fieldSelect} value={editForm.plan} onChange={e => setEditForm(p => ({ ...p, plan: e.target.value }))}>
                <option value="Start">Logta Start</option>
                <option value="Pro">Logta Pro</option>
                <option value="Enterprise">Logta Enterprise</option>
              </select>
            </div>
            <div style={s.fieldGroup}>
              <span style={s.fieldLabel}>Limite de Veículos</span>
              <div style={s.fieldInputWrapper}>
                <Truck size={18} color="#94A3B8" />
                <input style={s.fieldInput} type="number" value={editForm.limit} onChange={e => setEditForm(p => ({ ...p, limit: e.target.value }))} />
              </div>
            </div>
          </div>

          <div style={s.formGrid}>
            <div style={s.fieldGroup}>
              <span style={s.fieldLabel}>CNPJ</span>
              <div style={s.fieldInputWrapper}>
                <FileText size={18} color="#94A3B8" />
                <input style={s.fieldInput} value={editForm.cnpj} onChange={e => setEditForm(p => ({ ...p, cnpj: e.target.value }))} />
              </div>
            </div>
            <div style={s.fieldGroup}>
              <span style={s.fieldLabel}>Telefone</span>
              <div style={s.fieldInputWrapper}>
                <Phone size={18} color="#94A3B8" />
                <input style={s.fieldInput} value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button style={s.cancelBtn} onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
            <button style={{ ...s.editBtn, backgroundColor: '#0061FF', padding: '12px 32px' }} onClick={handleSave}>
              <CheckCircle2 size={18} /> Salvar Alterações
            </button>
          </div>
        </div>
      </LogtaModal>

      <LogtaModal
        isOpen={isNovaAutomacaoOpen}
        onClose={() => setIsNovaAutomacaoOpen(false)}
        title="Nova automação"
        subtitle={`Configure um fluxo para ${client.name}: gatilho, integração e modelo de IA.`}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={s.formGrid}>
            <div style={s.fieldGroup}>
              <span style={s.fieldLabel}>Nome da automação</span>
              <div style={s.fieldInputWrapper}>
                <Zap size={18} color="#94A3B8" />
                <input style={s.fieldInput} value={novaFlowForm.name} onChange={e => setNovaFlowForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex.: Alerta SLA para cliente X" />
              </div>
            </div>
            <div style={s.fieldGroup}>
              <span style={s.fieldLabel}>Tipo / canal</span>
              <div style={s.fieldInputWrapper}>
                <Phone size={18} color="#94A3B8" />
                <input style={s.fieldInput} value={novaFlowForm.type} onChange={e => setNovaFlowForm(p => ({ ...p, type: e.target.value }))} placeholder="Webhook, WhatsApp, ERP..." />
              </div>
            </div>
          </div>
          <div style={s.formGrid}>
            <div style={s.fieldGroup}>
              <span style={s.fieldLabel}>Gatilho</span>
              <div style={s.fieldInputWrapper}>
                <RefreshCcw size={18} color="#94A3B8" />
                <input style={s.fieldInput} value={novaFlowForm.trigger} onChange={e => setNovaFlowForm(p => ({ ...p, trigger: e.target.value }))} placeholder="Ex.: mudança de status da rota" />
              </div>
            </div>
            <div style={s.fieldGroup}>
              <span style={s.fieldLabel}>Modelo de IA</span>
              <select style={s.fieldSelect} value={novaFlowForm.aiModel} onChange={e => setNovaFlowForm(p => ({ ...p, aiModel: e.target.value }))}>
                <option>GPT-4o (Logta Assist)</option>
                <option>GPT-4o-mini</option>
                <option>Claude 3.5 Sonnet</option>
                <option>Apenas regras (sem LLM)</option>
              </select>
            </div>
          </div>
          <div style={s.fieldGroup}>
            <span style={s.fieldLabel}>Status inicial</span>
            <select style={s.fieldSelect} value={novaFlowForm.status} onChange={e => setNovaFlowForm(p => ({ ...p, status: e.target.value as 'Ativo' | 'Em Testes' }))}>
              <option value="Ativo">Ativo</option>
              <option value="Em Testes">Em testes</option>
            </select>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>
            O fluxo aparece imediatamente na grade ao salvar. Integração com backend e permissões por tenant serão aplicadas na camada de API.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" style={s.cancelBtn} onClick={() => setIsNovaAutomacaoOpen(false)}>Cancelar</button>
            <button type="button" style={{ ...s.editBtn, backgroundColor: '#7C3AED' }} onClick={handleSaveNovaAutomacao}>
              <CheckCircle2 size={18} /> Salvar automação
            </button>
          </div>
        </div>
      </LogtaModal>

      <LogtaModal isOpen={isPolicyModalOpen} onClose={() => setIsPolicyModalOpen(false)} size="md" title="Controle de Políticas Hub → LOGTA">
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', margin: 0 }}>
            Publique políticas operacionais e níveis de acesso diretamente na aplicação do cliente LOGTA via canais criptografados seguros.
          </p>
          <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', gap: '8px', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identificador de Tenant</span>
            <code style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700 }}>{tenantKey}</code>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              style={{ 
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', 
                color: 'white', 
                border: 'none', 
                padding: '14px 20px', 
                borderRadius: '12px', 
                fontWeight: 600, 
                fontSize: '14px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '10px', 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' 
              }}
              onClick={() => {
                pushEntitlements(defaultTrialEntitlements(tenantKey, trialEnds()));
                setIsPolicyModalOpen(false);
              }}
            >
              <Clock size={18} /> Publicar Trial Premium (5 dias)
            </button>
            
            <button
              type="button"
              style={{ 
                background: 'linear-gradient(135deg, #0061FF 0%, #0046C7 100%)', 
                color: 'white', 
                border: 'none', 
                padding: '14px 20px', 
                borderRadius: '12px', 
                fontWeight: 600, 
                fontSize: '14px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '10px', 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0, 97, 255, 0.22)' 
              }}
              onClick={() => {
                pushEntitlements(activePlanEntitlements(defaultTrialEntitlements(tenantKey, trialEnds()), 'growth'));
                setIsPolicyModalOpen(false);
              }}
            >
              <Zap size={18} /> Ativar Plano Vitalício (Liberar Tudo)
            </button>
            
            <button
              type="button"
              style={{ 
                backgroundColor: '#FFF1F2', 
                color: '#E11D48', 
                border: '1px solid #FECDD3', 
                padding: '14px 20px', 
                borderRadius: '12px', 
                fontWeight: 600, 
                fontSize: '14px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '10px', 
                cursor: 'pointer', 
                transition: 'all 0.2s' 
              }}
              onClick={() => {
                pushEntitlements(expiredEntitlements(defaultTrialEntitlements(tenantKey, new Date(0).toISOString())));
                setIsPolicyModalOpen(false);
              }}
            >
              <AlertTriangle size={18} /> Simular Expiração / Bloqueio Crítico
            </button>
          </div>
        </div>
      </LogtaModal>

      <LogtaModal
        isOpen={isCorpModalOpen}
        onClose={() => setIsCorpModalOpen(false)}
        title={selectedCorp ? `Detalhes do Cliente: ${selectedCorp.name}` : 'Detalhes do Cliente'}
        subtitle="Informações consolidadas do relacionamento corporativo logístico."
        size="lg"
        padding="16px 27px 15px"
        icon={selectedCorp ? <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: selectedCorp.color, color: selectedCorp.txt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '11px' }}>{selectedCorp.initials}</div> : undefined}
      >
        {selectedCorp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Identificação Fiscal</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#94A3B8', fontWeight: 500 }}>Razão Social</span>
                      <span style={{ color: '#1E293B', fontWeight: 600 }}>{selectedCorp.name} Logística Ltda.</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#94A3B8', fontWeight: 500 }}>CNPJ</span>
                      <span style={{ color: '#1E293B', fontWeight: '700' }}>{selectedCorp.cnpj}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#94A3B8', fontWeight: 500 }}>Contato Principal</span>
                      <span style={{ color: '#1E293B', fontWeight: '700' }}>{selectedCorp.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#94A3B8', fontWeight: 500 }}>Telefone comercial</span>
                      <span style={{ color: '#1E293B', fontWeight: '700' }}>{selectedCorp.phone || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#94A3B8', fontWeight: 500 }}>WhatsApp / plantão</span>
                      <span style={{ color: '#1E293B', fontWeight: '700' }}>{selectedCorp.mobile || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#94A3B8', fontWeight: 500 }}>Responsável na conta</span>
                      <span style={{ color: '#1E293B', fontWeight: '700' }}>{selectedCorp.contactName || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#94A3B8', fontWeight: 500 }}>Cidade / polo</span>
                      <span style={{ color: '#1E293B', fontWeight: '700' }}>{selectedCorp.city || '—'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Histórico Operacional</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0061FF' }} />
                      <div style={{ flex: 1, fontSize: '12px', color: '#475569', fontWeight: 500 }}>Último CTE emitido pelo painel</div>
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{selectedCorp.lastDispatch}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                      <div style={{ flex: 1, fontSize: '12px', color: '#475569', fontWeight: 500 }}>Contrato renovado automaticamente</div>
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Há 12 dias</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '20px', borderRadius: '20px', backgroundColor: '#F4F8FF', border: '1px solid rgba(0,97,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#0061FF', textTransform: 'uppercase' }}>Resumo Contratual</h4>
                  <div>
                    <span style={{ fontSize: '24px', fontWeight: '900', color: '#0061FF' }}>{selectedCorp.revenue}</span>
                    <span style={{ fontSize: '12px', color: '#0061FF', fontWeight: 500 }}> /mês (ticket médio)</span>
                  </div>
                  <div style={{ borderTop: '1px dashed rgba(0,97,255,0.2)', paddingTop: '12px', fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                    Vigência do contrato até **Janeiro/2027**. Reajuste baseado no IPCA.
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const invByCorp: Record<string, string> = {
                      'Mercado Livre': 'demo-11',
                      'Magazine Luiza': 'demo-12',
                      'Amazon Brasil': 'demo-20',
                      'Lojas Americanas': '1',
                    };
                    const inv = invByCorp[selectedCorp.name] || '1';
                    setSearchParams(prev => {
                      const n = new URLSearchParams(prev);
                      n.delete('clientId');
                      n.delete('profileTab');
                      n.set('invoiceId', inv);
                      return n;
                    }, { replace: true });
                    setIsCorpModalOpen(false);
                  }}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '14px', border: 'none', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,0.1)' }}
                >
                  Visualizar Faturas & Pagamentos
                </button>
              </div>
            </div>
          </div>
        )}
      </LogtaModal>

      {/* INLINE SUPPORT CHAT FLOATING DRAWER */}
      {isInlineChatOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '444px',
          height: '720px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '24px',
          boxShadow: '0 20px 40px -5px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          overflow: 'hidden',
          zIndex: 9999,
          animation: 'scaleUpChat 0.25s ease-out'
        }}>
          <style>{`
            @keyframes scaleUpChat {
              0% { opacity: 0; transform: scale(0.9) translateY(20px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
          
          {/* Chat Header */}
          <div style={{
            padding: '16px 12px 15px 27px',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0061FF', border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 900, fontSize: '12px' }}>
                {client.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Suporte {client.name.split(' ')[0]}</div>
                <div style={{ fontSize: '10px', color: '#0061FF', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#0061FF', borderRadius: '50%' }} /> Online no painel
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsInlineChatOpen(false)} 
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Chat Body */}
          <div style={{ flex: 1, padding: '16px 0 15px 27px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0, backgroundColor: '#F8FAFC' }}>
            {chatHistory.map((msg, idx) => {
              const isHub = msg.sender === 'hub';
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isHub ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '16px',
                    borderTopRightRadius: isHub ? '4px' : '16px',
                    borderTopLeftRadius: isHub ? '16px' : '4px',
                    backgroundColor: isHub ? '#0061FF' : '#FFFFFF',
                    color: isHub ? '#FFFFFF' : '#1E293B',
                    fontSize: '13px',
                    fontWeight: 500,
                    maxWidth: '80%',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    border: isHub ? 'none' : '1px solid #E2E8F0'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '9px', color: '#94A3B8', marginTop: '4px', fontWeight: 700 }}>{msg.time}</span>
                </div>
              );
            })}
          </div>

          {/* Chat Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!chatMessage.trim()) return;
              const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              setChatHistory(prev => [...prev, { sender: 'hub', text: chatMessage, time: now }]);
              setChatMessage('');
              
              // Simulated Auto-reply
              setTimeout(() => {
                setChatHistory(prev => [...prev, { sender: 'client', text: 'Entendido, perfeito! Muito obrigado pela agilidade.', time: now }]);
              }, 1500);
            }}
            style={{
              padding: '16px 12px 15px 27px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              gap: '8px',
              backgroundColor: '#FFFFFF'
            }}
          >
            <input 
              type="text"
              placeholder="Digite uma mensagem..."
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              style={{
                flex: 1,
                border: '1px solid #E2E8F0',
                borderRadius: '999px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#1E293B',
                outline: 'none',
                backgroundColor: '#F8FAFC'
              }}
            />
            <button 
              type="submit"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                background: '#0061FF',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0, 97, 255, 0.2)'
              }}
            >
              <Save size={14} />
            </button>
          </form>
        </div>
      )}

      {/* MODAL DE DETALHES DA TRANSAÇÃO */}
      <LogtaModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title="Detalhes do Lançamento"
        width="450px"
      >
        {selectedTransaction && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', background: '#F8FAFC', borderRadius: 16, border: '1px solid #F1F5F9' }}>
              <div style={{ 
                width: 56, 
                height: 56, 
                borderRadius: '50%', 
                background: selectedTransaction.val.includes('+') ? '#DCFCE7' : '#F1F5F9', 
                color: selectedTransaction.val.includes('+') ? '#10B981' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}>
                {selectedTransaction.val.includes('+') ? <TrendingUp size={24} /> : <Activity size={24} />}
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#1E293B' }}>{selectedTransaction.val}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#64748B', marginTop: 4 }}>{selectedTransaction.desc}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>Status do Lançamento</span>
                <span style={{ fontSize: 13, color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} /> Confirmado
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>Data e Hora</span>
                <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 700 }}>{selectedTransaction.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>ID da Transação</span>
                <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 700, fontFamily: 'monospace' }}>TRX-{Math.floor(Math.random() * 999999)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>Método de Origem</span>
                <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 700 }}>Recarga via API (Hub Master)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Observações Internas</span>
                <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #F1F5F9', fontSize: 12, color: '#475569', fontStyle: 'italic' }}>
                  Acréscimo de saldo aprovado pelo administrador master para compensação de bônus de ativação Logta WhatsApp.
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsTransactionModalOpen(false)}
              style={{ 
                width: '100%', 
                padding: '14px', 
                borderRadius: 12, 
                background: '#0F172A', 
                color: 'white', 
                border: 'none', 
                fontWeight: 700, 
                fontSize: 14, 
                cursor: 'pointer',
                marginTop: 10
              }}
            >
              Fechar Detalhes
            </button>
          </div>
        )}
      </LogtaModal>

    </div>
  );
};



const s: Record<string, React.CSSProperties> = {
  header: { padding: '20px 72px 20px', marginTop: 50, marginBottom: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.02)' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: { width: '44px', height: '44px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'transform 0.15s ease' },
  avatar: { width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '900', color: 'white' },
  clientName: { margin: 0, fontSize: '26px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.8px' },
  statusBadge: { padding: '6px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em', border: '1px solid rgba(0, 97, 255, 0.2)' },
  clientSub: { margin: 0, fontSize: '13px', color: '#64748B', fontWeight: 500 },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  chatBtn: { backgroundColor: '#FFFFFF', color: '#475569', border: '1px solid rgba(0,0,0,0.08)', padding: '10px 24px', borderRadius: '999px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  editBtn: { backgroundColor: 'var(--blue)', color: 'white', border: 'none', padding: '14px 26px', borderRadius: '999px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'none', marginTop: 0, marginBottom: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  deleteBtn: { backgroundColor: '#FFF5F5', color: '#E53E3E', border: '1px solid rgba(229, 62, 62, 0.15)', padding: '10px 24px', borderRadius: '999px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(229, 62, 62, 0.05)', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  editInput: { padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '24px', fontWeight: 600, color: '#0F172A', outline: 'none', width: '300px', backgroundColor: '#FFFFFF', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  cancelBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '1px solid rgba(0,0,0,0.1)', backgroundColor: 'white', color: '#64748B', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  saveBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: 'none', background: 'linear-gradient(135deg, #0061FF 0%, #0046C7 100%)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 16px -4px rgba(0, 97, 255, 0.35)', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  content: {
    padding: '0 0 15px 27px',
    marginLeft: 40,
    marginRight: 40,
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    gap: 0,
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    fontWeight: 800,
  },
  sidebarGroup: { display: 'flex', flexDirection: 'column', gap: 24, rowGap: 24, border: '1px solid #E2E8F0', borderRadius: '16px', padding: '12px 0', marginBottom: '16px' },
  sidebarGroupTitle: { fontSize: '10px', fontWeight: 500, color: 'rgba(161, 161, 161, 1)', textTransform: 'uppercase', letterSpacing: '0', paddingLeft: '16px', paddingTop: '4px', paddingBottom: '4px', marginBottom: '6px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: 24, rowGap: 24, paddingRight: '27px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '32px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '19px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  fieldLabel: { fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' },
  fieldInputWrapper: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.05)', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' },
  fieldValue: { fontSize: '14px', fontWeight: '700', color: '#1E293B' },
  fieldInput: { border: 'none', background: 'none', outline: 'none', fontSize: '14px', fontWeight: '700', color: '#1E293B', width: '100%', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  fieldSelect: { padding: '14px 18px', borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.05)', fontSize: '14px', fontWeight: '700', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  addSmallBtn: { padding: '8px 16px', borderRadius: '999px', border: 'none', backgroundColor: '#EFF6FF', color: '#0061FF', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(0, 97, 255, 0.12)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,0,0,0.05)', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background-color 0.15s' },
  td: { padding: '16px 20px', verticalAlign: 'middle' },
  colabName: { fontSize: '14px', fontWeight: 600, color: '#1E293B' },
  colabRole: { fontSize: '12px', fontWeight: '700', color: '#475569', backgroundColor: '#F1F5F9', padding: '6px 12px', borderRadius: '8px' },
  colabTime: { fontSize: '12px', color: '#94A3B8', fontWeight: 500 },
  iconBtn: { width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF', color: '#64748B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', transition: 'all 0.2s' },
  grid2: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' },
  mapPlaceholder: { height: '320px', backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.02)' },
  mapOverlay: { position: 'absolute', inset: 0 },
  mapDot: { width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#0061FF', position: 'absolute', boxShadow: '0 0 0 4px rgba(0, 97, 255, 0.18), 0 0 20px rgba(0, 97, 255, 0.45)' },
  driverRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' },
  driverAvatar: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#475569', flexShrink: 0 },
  driverName: { margin: 0, fontSize: '14px', fontWeight: 600, color: '#1E293B' },
  driverSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: 500 },
  driverStatus: { fontSize: '11px', fontWeight: 600 },
  viewAllBtn: { width: '100%', padding: '16px', marginTop: '20px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' },
  auditRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' },
  snapTitle: { margin: 0, fontSize: '14px', fontWeight: 600, color: '#1E293B' },
  snapSub: { margin: '4px 0 0 0', fontSize: '12px', color: '#94A3B8', fontWeight: 500 },
  auditTime: { fontSize: '12px', fontWeight: '700', color: '#CBD5E1' },
  securityGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  securityItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)', backgroundColor: '#FFFFFF' },
  securityIcon: { width: '44px', height: '44px', borderRadius: '14px', backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' },
};

export default LogtaClientProfile;
