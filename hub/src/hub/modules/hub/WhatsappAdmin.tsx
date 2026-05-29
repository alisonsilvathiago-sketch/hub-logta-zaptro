import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MessageSquare, Activity, Clock, UserPlus, FileText, 
  Search as SearchIcon, User, Home, Key, Database, 
  Terminal, Layers, Settings, Cpu,
  Truck, MapPin, CheckCircle, TrendingUp, Building,
  CreditCard, ShoppingCart, Globe, Server, DollarSign, Plus, Shield, Wifi, Download, FileSpreadsheet, Coins, Save,
  UserCheck, Zap, Calendar, CheckCircle2, UploadCloud, RefreshCcw,
  Pencil, Trash2, Lock, Eye, Copy, Mail, ShieldCheck, BarChart3, ChevronRight, Share2, BookOpen, X,
  ArrowLeft, ExternalLink, QrCode, Smartphone, MessageCircle, Hash, Ban, Bot, Users, Wallet, BarChart
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import HubEntityAvatar from '@shared/components/HubEntityAvatar';
import HubSupabaseChart from '@shared/components/HubSupabaseChart';
import { useWhiteLabel } from '@core/context/WhiteLabelContext';
import { HUB_MASTER_PRODUCT_SHELL } from '@hub/styles/hubMasterProductShell';
import { MasterProductProjectHeader } from '@hub/components/MasterProductProjectHeader';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import { supabaseZaptro } from '@core/lib/supabase-zaptro';
import { notifyZaptro } from '../../../apps/zaptro/src/components/Zaptro/ZaptroNotificationSystem';

// Helper for Evolution API
const getGatewayAction = async (action: string, companyId: string, body: any = {}) => {
  try {
    const instanceName = `instance_${companyId.substring(0, 8)}`;
    const { data, error } = await supabaseZaptro.functions.invoke('evolution-gateway', {
      body: { action, instanceName, companyId, ...body }
    });
    if (error) throw error;
    return data || {};
  } catch (e: any) {
    return { success: false, error: e.message || String(e) };
  }
};

type TabId = 'overview' | 'whatsapp' | 'instances' | 'numbers' | 'billing' | 'api' | 'logs' | 'settings';

const ACCENT = '#25D366'; // WhatsApp Green

const WhatsappAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const wl = useWhiteLabel().settings;
  const activeTab = (searchParams.get('tab') as TabId) || 'overview';
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [activeCompanyTab, setActiveCompanyTab] = useState<'chats' | 'team' | 'automations' | 'persona' | 'config' | 'billing' | 'overview'>('overview');
  const [isAddCreditsModalOpen, setIsAddCreditsModalOpen] = useState(false);
  const [selectedCreditClient, setSelectedCreditClient] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  
  // LIVE STATES FOR SELECTED INSTANCE
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connStatus, setConnStatus] = useState<string>('disconnected');
  const [isSyncing, setIsSyncing] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(0);
  const [chatbotSettings, setChatbotSettings] = useState({
    tone: 'Profissional',
    signoff: '',
    hours: '09:00 - 18:00',
    isActive: true
  });
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [editingCollab, setEditingCollab] = useState<any>(null);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [billingAmount, setBillingAmount] = useState('500.00');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto'>('pix');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [activeFlow, setActiveFlow] = useState<any>({
    name: 'Triagem Logística V2',
    steps: [
      { id: '1', title: 'Boas vindas & Opções', type: 'MENU' },
      { id: '2', title: 'Rastreamento (API)', type: 'ACTION' },
      { id: '3', title: 'Transbordo Humano', type: 'SUPPORT' },
    ]
  });
  const [generatedPayment, setGeneratedPayment] = useState<any>(null);

  // --- LIVE FUNCTIONS ---
  const syncStatus = async () => {
    if (!selectedInstance?.id) return;
    const res = await getGatewayAction('status', selectedInstance.id);
    setConnStatus(res.connected ? 'connected' : 'disconnected');
  };

  const handleGenerateQr = async () => {
    if (!selectedInstance?.id) return;
    setIsSyncing(true);
    setQrCode(null);
    try {
      await getGatewayAction('create-instance', selectedInstance.id);
      setQrCountdown(60);
      const poll = setInterval(async () => {
        const res = await getGatewayAction('qr', selectedInstance.id);
        if (res.value) {
          setQrCode(res.value);
          setIsSyncing(false);
          clearInterval(poll);
        } else if (res.connected) {
          setConnStatus('connected');
          setIsSyncing(false);
          clearInterval(poll);
          toastSuccess('WhatsApp Conectado via Hub Master!');
        }
      }, 3000);
      setTimeout(() => clearInterval(poll), 60000);
    } catch (e) {
      toastError('Erro ao gerar QR Code.');
      setIsSyncing(false);
    }
  };

  const handleLogoutInstance = async () => {
    if (!selectedInstance?.id) return;
    const t = toastLoading('Encerrando sessão...');
    await getGatewayAction('logout', selectedInstance.id);
    setConnStatus('disconnected');
    setQrCode(null);
    toastDismiss(t);
    toastSuccess('Instância desconectada.');
  };

  const fetchCompanySettings = async () => {
    if (!selectedInstance?.id) return;
    setIsLoadingSettings(true);
    try {
      const { data } = await supabaseZaptro
        .from('whatsapp_companies')
        .select('settings')
        .eq('id', selectedInstance.id)
        .single();
      
      const persona = data?.settings?.persona || {};
      setChatbotSettings({
        tone: persona.tone || 'Profissional',
        signoff: persona.signoff || '',
        hours: persona.hours || '09:00 - 18:00',
        isActive: persona.isActive ?? true
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const savePersonaSettings = async () => {
    if (!selectedInstance?.id) return;
    const t = toastLoading('Salvando configurações no ZapTro...');
    try {
      const { data: current } = await supabaseZaptro
        .from('whatsapp_companies')
        .select('settings')
        .eq('id', selectedInstance.id)
        .single();

      const nextSettings = {
        ...(current?.settings || {}),
        persona: {
          tone: chatbotSettings.tone,
          signoff: chatbotSettings.signoff,
          hours: chatbotSettings.hours,
          isActive: chatbotSettings.isActive
        }
      };

      const { error } = await supabaseZaptro
        .from('whatsapp_companies')
        .update({ settings: nextSettings })
        .eq('id', selectedInstance.id);

      if (error) throw error;
      toastSuccess('Persona sincronizada com sucesso!');
    } catch (e) {
      toastError('Falha ao sincronizar Persona.');
    } finally {
      toastDismiss(t);
    }
  };

  const fetchCollaborators = async () => {
    if (!selectedInstance?.id) return;
    const { data } = await supabaseZaptro
      .from('profiles')
      .select('*')
      .eq('company_id', selectedInstance.id);
    setCollaborators(data || []);
  };

  const saveCollaborator = async (collabData: any) => {
    const t = toastLoading('Salvando colaborador...');
    try {
      const payload = {
        ...collabData,
        company_id: selectedInstance.id,
        updated_at: new Date().toISOString()
      };

      let error;
      if (editingCollab?.id) {
        const { error: e } = await supabaseZaptro
          .from('profiles')
          .update(payload)
          .eq('id', editingCollab.id);
        error = e;
      } else {
        const { error: e } = await supabaseZaptro
          .from('profiles')
          .insert([payload]);
        error = e;
      }

      if (error) throw error;
      toastSuccess('Colaborador atualizado.');
      fetchCollaborators();
      setIsCollabModalOpen(false);
    } catch (e) {
      toastError('Erro ao salvar colaborador.');
    } finally {
      toastDismiss(t);
    }
  };

  const tabSections = [
    {
      title: 'WhatsApp Cloud',
      items: [
        { id: 'overview', label: 'Visão Geral', icon: Home },
        { id: 'whatsapp', label: 'Suporte Global', icon: MessageCircle },
        { id: 'instances', label: 'Instâncias (Sessões)', icon: Smartphone },
        { id: 'numbers', label: 'Números Vinculados', icon: Hash },
        { id: 'billing', label: 'Consumo & Créditos', icon: CreditCard },
      ],
    },
    {
      title: 'Desenvolvedor',
      items: [
        { id: 'api', label: 'Chaves de API', icon: Key },
        { id: 'logs', label: 'Logs de Mensagens', icon: Terminal },
        { id: 'settings', label: 'Configurações', icon: Settings },
      ],
    },
  ];

  const setActiveTab = (tab: string) => {
    const n = new URLSearchParams(searchParams);
    if (tab === 'overview') n.delete('tab');
    else n.set('tab', tab);
    setSearchParams(n);
  };

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <HubSupabaseChart label="INSTÂNCIAS ATIVAS" value="128" data={[120, 122, 125, 124, 128, 130, 128]} color={ACCENT} />
        <HubSupabaseChart label="MENSAGENS (24H)" value="45.2k" data={[40, 42, 45, 48, 44, 46, 45]} color={ACCENT} />
        <HubSupabaseChart label="TAXA DE ENTREGA" value="99.2%" data={[98, 99, 99.2, 99.1, 99.5, 99.2]} color="#10B981" />
        <HubSupabaseChart label="CRÉDITOS TOTAIS" value="R$ 12.4k" data={[10, 11, 12, 12.4, 12.2, 12.4]} color="#F59E0B" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ background: '#FFF', borderRadius: 24, padding: 24, border: '1px solid #E2E8F0' }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Instâncias Recentes (via ZapTro)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 11, color: '#64748B' }}>SESSÃO</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 11, color: '#64748B' }}>TENANT ZAPTRO</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 11, color: '#64748B' }}>STATUS</th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 11, color: '#64748B' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: '1', name: 'Financeiro Dept', client: 'Transp. Falcão (ZT)', status: 'Conectado', statusColor: '#10B981', phone: '+55 11 91000-2000' },
                { id: '3', name: 'Suporte VIP', client: 'Ind. Matarazzo (ZT)', status: 'Aguardando QR', statusColor: '#F59E0B', phone: '+55 11 91001-2001' },
                { id: 'demo-vendas', name: 'Vendas SP', client: 'Viação Cometa (ZT)', status: 'Conectado', statusColor: '#10B981', phone: '+55 11 91002-2002' },
              ].map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 8px', fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: '16px 8px', fontSize: 13, color: '#64748B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={12} color="#7C3AED" />
                      {s.client}
                    </div>
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: s.statusColor }}>● {s.status.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                    <button 
                      onClick={() => {
                        setSelectedInstance(s);
                        setActiveTab('instances');
                      }}
                      style={{ background: 'none', border: 'none', color: ACCENT, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                    >
                      Gerenciar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #F0FFF4 0%, #FFFFFF 100%)', borderRadius: 24, padding: 24, border: '1px solid #C6F6D5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <MessageCircle size={24} color={ACCENT} />
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#22543D' }}>Vínculo ZapTro App</h3>
          </div>
          <p style={{ fontSize: 13, color: '#2F855A', lineHeight: 1.5 }}>
            Este gateway gerencia as mensagens enviadas através do <strong>ZapTro</strong>. Os créditos de WhatsApp são debitados diretamente da carteira do tenant ZapTro vinculado.
          </p>
          <div style={{ marginTop: 24, padding: 16, background: '#FFF', borderRadius: 16, border: '1px solid #C6F6D5' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Créditos ZapTro Disponíveis</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>R$ 12.420,00</div>
            <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, marginTop: 4 }}>● Carteira Compartilhada</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompanyProfile = () => {
    if (!selectedInstance) return null;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Profile Header */}
        <div style={{ ...HUB_MASTER_PRODUCT_SHELL.card, padding: '20px 24px', background: 'linear-gradient(135deg, #FFF 0%, #F8FAFC 100%)', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button 
                onClick={() => setSelectedInstance(null)}
                style={{ background: '#F1F5F9', border: 'none', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0F172A' }}>{selectedInstance.name}</h2>
                  <button 
                    onClick={() => navigate(`/master/zaptro/${selectedInstance.id}?tab=clients&token=${searchParams.get('token')}`)}
                    style={{ 
                      fontSize: 11, 
                      fontWeight: 800, 
                      color: '#10B981', 
                      background: '#DCFCE7', 
                      padding: '4px 10px', 
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    VINCULADO AO ZAPTRO
                  </button>
                </div>
                <div style={{ fontSize: 14, color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Smartphone size={14} /> {selectedInstance.phone} • {selectedInstance.tier || 'Enterprise'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: '#0F172A', color: 'white', border: 'none', borderRadius: '100px', fontWeight: 900, padding: '10px 24px', boxShadow: '0 4px 12px rgba(15,23,42,0.2)', textTransform: 'uppercase', letterSpacing: '0.02em' }} 
                onClick={() => toastSuccess('Sessão resetada.')}
              >
                <RefreshCcw size={14} /> RESETAR SESSÃO
              </button>
              <button 
                style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: '#25D366', color: 'white', border: 'none', borderRadius: '100px', fontWeight: 900, padding: '10px 24px', boxShadow: '0 4px 12px rgba(37,211,102,0.25)', textTransform: 'uppercase', letterSpacing: '0.02em' }} 
                onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.CHAT)}
              >
                <ExternalLink size={14} /> ABRIR NO ZAPTRO
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 24, borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
             {[
               { id: 'chats', label: 'Conversas Live', icon: MessageSquare },
               { id: 'config', label: 'Conexão WA', icon: QrCode },
               { id: 'persona', label: 'Persona IA', icon: Bot },
               { id: 'team', label: 'Colaboradores', icon: Users },
               { id: 'automations', label: 'Automações', icon: Zap },
               { id: 'billing', label: 'Financeiro', icon: Coins },
             ].map(t => (
               <button 
                key={t.id}
                onClick={() => {
                  setActiveCompanyTab(t.id as any);
                  if (t.id === 'config') syncStatus();
                  if (t.id === 'persona') fetchCompanySettings();
                  if (t.id === 'team') fetchCollaborators();
                }}
                style={{ 
                  background: 'none', border: 'none', padding: '8px 4px', fontSize: 13, fontWeight: activeCompanyTab === t.id ? 800 : 600, 
                  color: activeCompanyTab === t.id ? '#25D366' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  borderBottom: activeCompanyTab === t.id ? '2px solid #25D366' : '2px solid transparent', transition: '0.2s'
                }}
               >
                 <t.icon size={16} /> {t.label}
               </button>
             ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: 400 }}>
          {activeCompanyTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={HUB_METRIC_GRID_STYLE}>
                <HubMetricCard 
                  label="SALDO MASTER" 
                  value="R$ 12.420,00" 
                  icon={Wallet} 
                  accent="#0F172A"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveCompanyTab('billing')}
                  footer={
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button onClick={(e) => { e.stopPropagation(); setActiveCompanyTab('billing'); }} style={{ background: '#25D366', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 9, fontWeight: 800, cursor: 'pointer' }}>+ RECARGA</button>
                      <button onClick={(e) => { e.stopPropagation(); setActiveCompanyTab('billing'); }} style={{ background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 9, fontWeight: 800, cursor: 'pointer' }}>EXTRATO</button>
                    </div>
                  }
                />

                <HubMetricCard 
                  label="MENSAGENS (MÊS)" 
                  value="1.240.582" 
                  icon={MessageSquare} 
                  accent="#25D366" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveCompanyTab('chats')}
                  topRight={<span style={{ color: '#10B981', background: '#DCFCE7', padding: '2px 8px', borderRadius: 6 }}>+12%</span>}
                />
                
                <HubMetricCard 
                  label="BOTS ATIVOS" 
                  value="42" 
                  icon={Bot} 
                  accent="#7C3AED" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveCompanyTab('persona')}
                  topRight={<span style={{ color: '#10B981', fontWeight: 800 }}>98% OK</span>}
                />

                <HubMetricCard 
                  label="MARGEM OPERACIONAL" 
                  value="25.5%" 
                  icon={TrendingUp} 
                  accent="#10B981"
                  footer={<div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginTop: 4 }}>Markup sobre gateway</div>}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
                <div style={HUB_MASTER_PRODUCT_SHELL.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Evolução de Consumo (7 dias)</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#25D366' }} /> Enviadas
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F172A' }} /> Recebidas
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 260, position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 12, paddingBottom: 20 }}>
                    {[65, 45, 85, 30, 95, 70, 80].map((v, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', height: '100%' }}>
                        <div style={{ width: '100%', background: '#F1F5F9', borderRadius: 6, flex: 1, position: 'relative', overflow: 'hidden' }}>
                           <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${v}%`, background: 'linear-gradient(to top, #25D366, #10B981)', borderRadius: 6 }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8' }}>{['S','T','Q','Q','S','S','D'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={HUB_MASTER_PRODUCT_SHELL.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Atividades Recentes</h3>
                    <button style={{ background: 'none', border: 'none', color: '#0061FF', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>VER TUDO</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { type: 'recharge', client: 'Falcão Trans', val: '+ R$ 500,00', time: '10:45' },
                      { type: 'usage', client: 'Ind. Matarazzo', val: '742 msg', time: '09:12' },
                      { type: 'bot', client: 'Alfa Log', val: 'Persona Update', time: 'Ontem' },
                      { type: 'usage', client: 'Viação Cometa', val: '1.2k msg', time: 'Ontem' },
                    ].map((act, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                         <div style={{ width: 8, height: 8, borderRadius: '50%', background: act.type === 'recharge' ? '#10B981' : (act.type === 'bot' ? '#7C3AED' : '#0F172A') }} />
                         <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{act.client}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>{act.val}</div>
                         </div>
                         <div style={{ fontSize: 10, fontWeight: 800, color: '#CBD5E1' }}>{act.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeCompanyTab === 'chats' && (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, height: 600 }}>
              <div style={{ ...HUB_MASTER_PRODUCT_SHELL.card, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: 16, borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                   <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>CONVERSAS ATIVAS (LIVE)</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {[
                    { name: 'João Silva', last: 'Qual o valor do frete?', time: '2m', unread: true },
                    { name: 'Maria Santos', last: 'Obrigado pelo retorno!', time: '10m', unread: false },
                    { name: 'Carlos Tech', last: 'Pode confirmar o código?', time: '45m', unread: false },
                    { name: 'Beatriz RH', last: 'Enviando documento...', time: '1h', unread: false },
                  ].map((c, i) => (
                    <div key={i} style={{ padding: 16, borderBottom: '1px solid #F8FAFC', cursor: 'pointer', background: i === 0 ? '#F0FDF4' : 'transparent', borderLeft: i === 0 ? '4px solid #25D366' : '4px solid transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>{c.name}</span>
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>{c.time}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ ...HUB_MASTER_PRODUCT_SHELL.card, padding: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                     <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#25D366' }} />
                     <span style={{ fontWeight: 800, color: '#0F172A' }}>João Silva</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>+55 11 99999-0000</span>
                </div>
                <div style={{ flex: 1, background: '#F8FAFC', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div style={{ alignSelf: 'flex-start', background: 'white', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', border: '1px solid #E2E8F0', maxWidth: '70%', fontSize: 13 }}>
                      Olá! Gostaria de saber o valor do frete para Curitiba.
                      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>14:32</div>
                   </div>
                   <div style={{ alignSelf: 'flex-end', background: '#0F172A', color: 'white', padding: '12px 16px', borderRadius: '16px 16px 4px 16px', maxWidth: '70%', fontSize: 13 }}>
                      Olá João! O valor para Curitiba está em R$ 145,00. Deseja fechar o pedido?
                      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>14:35</div>
                   </div>
                   <div style={{ alignSelf: 'flex-start', background: 'white', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', border: '1px solid #E2E8F0', maxWidth: '70%', fontSize: 13 }}>
                      Sim, por favor!
                      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>14:36</div>
                   </div>
                </div>
                <div style={{ padding: 20, borderTop: '1px solid #F1F5F9' }}>
                   <div style={{ display: 'flex', gap: 12 }}>
                      <input placeholder="Digite sua resposta master..." style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC' }} />
                      <button style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: '#25D366', color: 'white', border: 'none' }}>ENVIAR</button>
                   </div>
                </div>
              </div>
            </div>
          )}
          {activeCompanyTab === 'config' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={HUB_MASTER_PRODUCT_SHELL.card}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, marginBottom: 16 }}>Estado da Instância (Gateway Master)</h3>
                <div style={{ padding: 20, borderRadius: 16, border: '1px solid #E2E8F0', background: '#F8FAFC', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: 20, background: connStatus === 'connected' ? '#DCFCE7' : '#FEE2E2', color: connStatus === 'connected' ? '#16A34A' : '#EF4444', fontWeight: 800, fontSize: 12, marginBottom: 16 }}>
                    ● {connStatus === 'connected' ? 'CONECTADO' : 'DESCONECTADO'}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748B', fontWeight: 600 }}>ID da Instância: <code>{selectedInstance.id}</code></p>
                  
                  <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button 
                      style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: '#0F172A', color: 'white' }}
                      disabled={isSyncing}
                      onClick={handleGenerateQr}
                    >
                      {isSyncing ? 'GERANDO...' : 'GERAR NOVO QR'}
                    </button>
                    <button style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn }} onClick={handleLogoutInstance}>DESCONECTAR</button>
                  </div>
                </div>
              </div>

              <div style={{ ...HUB_MASTER_PRODUCT_SHELL.card, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                {qrCode ? (
                  <>
                    <div style={{ padding: 16, background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 16 }}>
                      <img src={qrCode} alt="QR Code" style={{ width: 200, height: 200 }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Expira em {qrCountdown}s</div>
                  </>
                ) : (
                  <div style={{ color: '#94A3B8' }}>
                    <QrCode size={64} strokeWidth={1.5} />
                    <p style={{ margin: '16px 0 0', fontSize: 14, fontWeight: 600 }}>Aguardando comando de pareamento...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeCompanyTab === 'persona' && (
            <div style={HUB_MASTER_PRODUCT_SHELL.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Configuração da Persona IA (Zaptro Bot)</h3>
                <button 
                  style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: '#25D366', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(37,211,102,0.2)' }}
                  onClick={savePersonaSettings}
                >
                  <Save size={14} /> SALVAR NO ZAPTRO
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>TOM DE VOZ</label>
                    <select 
                      value={chatbotSettings.tone}
                      onChange={e => setChatbotSettings({...chatbotSettings, tone: e.target.value})}
                      style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC' }}
                    >
                      <option>Profissional e Objetivo</option>
                      <option>Amigável e Próximo</option>
                      <option>Direto (Curto)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>ASSINATURA DAS RESPOSTAS</label>
                    <input 
                      value={chatbotSettings.signoff}
                      onChange={e => setChatbotSettings({...chatbotSettings, signoff: e.target.value})}
                      placeholder="Ex: — Time Falcão"
                      style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #E2E8F0' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>HORÁRIO DE ATENDIMENTO</label>
                    <input 
                      value={chatbotSettings.hours}
                      onChange={e => setChatbotSettings({...chatbotSettings, hours: e.target.value})}
                      style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #E2E8F0' }}
                    />
                  </div>
                  <div style={{ padding: 16, background: '#F0F9FF', borderRadius: 16, border: '1px solid #B9E6FE', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div role="button" onClick={() => setChatbotSettings({...chatbotSettings, isActive: !chatbotSettings.isActive})} style={{ width: 44, height: 24, borderRadius: 12, background: chatbotSettings.isActive ? '#25D366' : '#CBD5E1', position: 'relative', cursor: 'pointer' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 9, background: 'white', position: 'absolute', top: 3, left: chatbotSettings.isActive ? 23 : 3, transition: '0.2s' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0369A1' }}>Chatbot Ativo para este Tenant</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCompanyTab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Colaboradores da Empresa ({collaborators.length})</h3>
                <button 
                  onClick={() => { setEditingCollab({}); setIsCollabModalOpen(true); }}
                  style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: '#0F172A', color: 'white' }}
                >
                  + NOVO COLABORADOR
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {collaborators.length > 0 ? collaborators.map((m, i) => (
                  <div key={i} style={{ ...HUB_MASTER_PRODUCT_SHELL.card, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <HubEntityAvatar name={m.full_name} size={48} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{m.full_name}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{m.role} • {m.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => { setEditingCollab(m); setIsCollabModalOpen(true); }}
                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: '#94A3B8' }}>Nenhum colaborador encontrado.</div>
                )}
              </div>
            </div>
          )}

          {activeCompanyTab === 'automations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ ...HUB_MASTER_PRODUCT_SHELL.card, padding: 32, borderLeft: '6px solid #25D366' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                       <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Fluxo Ativo: {activeFlow.name}</h3>
                       <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>Este fluxo processa 85% das mensagens recebidas automaticamente.</p>
                    </div>
                    <button 
                      onClick={() => setIsFlowModalOpen(true)}
                      style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: '#0F172A', color: 'white' }}
                    >
                      EDITAR NO FLOWBUILDER
                    </button>
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                    {activeFlow.steps.map((s: any, i: number) => (
                      <React.Fragment key={s.id}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#F8FAFC', borderRadius: 16, border: '1px solid #F1F5F9' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0F172A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{i + 1}</div>
                            <div style={{ flex: 1 }}>
                               <div style={{ fontSize: 14, fontWeight: 800 }}>{s.title}</div>
                               <div style={{ fontSize: 11, color: '#94A3B8' }}>Módulo de {s.type}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginRight: 8 }}>
                              <button 
                                onClick={() => setIsFlowModalOpen(true)}
                                style={{ background: '#FFF', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} 
                              >
                                <Pencil size={14} />
                              </button>
                            </div>
                            <Zap size={18} color="#64748B" />
                         </div>
                         {i < activeFlow.steps.length - 1 && <div style={{ height: 20, width: 2, background: '#E2E8F0', marginLeft: 31 }} />}
                      </React.Fragment>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {activeCompanyTab === 'backups' && (
            <div style={{ ...HUB_MASTER_PRODUCT_SHELL.card, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Database size={20} color="#6366F1" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Vault de Mensagens (LogDock)</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Armazenamento seguro e auditoria de mídias.</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { name: 'Daily_Sync_2024-05-15.ldk', size: '1.4GB', status: 'Protegido' },
                  { name: 'Media_Archive_May.ldk', size: '12.8GB', status: 'Protegido' },
                ].map((b, i) => (
                  <div key={i} style={{ padding: '16px 20px', borderRadius: 16, border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>Tamanho: {b.size} • Versão Master 2.0</div>
                    </div>
                    <button style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: '#F1F5F9' }} onClick={() => toastSuccess('Restauração iniciada no LogDock.')}>RESTAURAR</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeCompanyTab === 'billing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ ...HUB_MASTER_PRODUCT_SHELL.card, padding: 32, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'white', border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em' }}>SALDO DISPONÍVEL</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: '#25D366', marginTop: 8 }}>R$ 1.240,00</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8' }}>PRÓXIMA RENOVAÇÃO</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>01 Jun 2026</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
                <div style={{ ...HUB_MASTER_PRODUCT_SHELL.card, padding: 24 }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 900 }}>Histórico de Transações</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { desc: 'Recarga Via Hub (Master)', date: '15 Mai', val: '+ R$ 500,00', color: '#10B981' },
                      { desc: 'Mensalidade WaaS Premium', date: '01 Mai', val: '- R$ 299,00', color: '#EF4444' },
                      { desc: 'Recarga Via ZapTro App', date: '28 Abr', val: '+ R$ 250,00', color: '#10B981' },
                    ].map((bl, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          setSelectedTransaction(bl);
                          setIsTransactionModalOpen(true);
                        }}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          padding: '14px 16px', 
                          borderRadius: 12, 
                          background: '#F8FAFC', 
                          border: '1px solid #F1F5F9',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{bl.desc}</div>
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>{bl.date} • Confirmado</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: bl.color }}>{bl.val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Forma de Pagamento Cadastrada */}
                  <div style={{ padding: '16px 20px', borderRadius: 16, background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>MasterCard Final 9922</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>Expira em 08/29 • Principal</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsCardModalOpen(true)}
                      style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, padding: '6px 12px', fontSize: 11, background: '#F1F5F9', border: 'none' }}
                    >
                      Alterar
                    </button>
                  </div>

                  <div style={{ ...HUB_MASTER_PRODUCT_SHELL.card, padding: 24, border: '1px solid #DCFCE7', background: '#F0FDF4' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 900, color: '#166534' }}>Gerar Nova Cobrança</h3>
                    <p style={{ margin: '0 0 20px 0', fontSize: 13, color: '#166534' }}>Selecione o valor e o método de pagamento.</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                      {['100.00', '250.00', '500.00', '1000.00'].map(amt => (
                        <button 
                          key={amt}
                          onClick={() => setBillingAmount(amt)}
                          style={{ 
                            padding: '12px', 
                            borderRadius: 12, 
                            border: billingAmount === amt ? '2px solid #166534' : '1px solid #BBF7D0',
                            background: billingAmount === amt ? '#DCFCE7' : 'white',
                            fontWeight: 800,
                            fontSize: 13,
                            color: '#166534',
                            cursor: 'pointer'
                          }}
                        >
                          R$ {parseFloat(amt).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </button>
                      ))}
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#166534', marginBottom: 8 }}>VALOR PERSONALIZADO (R$)</label>
                      <input 
                        type="number" 
                        value={billingAmount}
                        onChange={e => setBillingAmount(e.target.value)}
                        style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #BBF7D0', fontWeight: 700 }} 
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
                            border: paymentMethod === m.id ? '2px solid #166534' : '1px solid #BBF7D0',
                            background: paymentMethod === m.id ? '#DCFCE7' : 'white',
                            cursor: 'pointer',
                            color: '#166534'
                          }}
                        >
                          <m.icon size={16} />
                          <span style={{ fontSize: 10, fontWeight: 800 }}>{m.label}</span>
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => toastSuccess(`Cobrança de R$ ${billingAmount} gerada via ${paymentMethod.toUpperCase()}!`)}
                      style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: '#166534', color: 'white', border: 'none', width: '100%', padding: 16 }}
                    >
                      <Coins size={18} /> GERAR {paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'card' ? 'COBRANÇA NO CARTÃO' : 'BOLETO'} DE RECARGA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNumbers = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: '#FFF', borderRadius: 24, padding: 24, border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Números Vinculados (Global)</h3>
          <button style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: ACCENT, color: 'white', border: 'none' }} onClick={() => toastSuccess('Módulo de vínculo aberto.')}>+ Vincular Novo Número</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
              <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: 11, color: '#64748B' }}>NÚMERO</th>
              <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: 11, color: '#64748B' }}>TENANT</th>
              <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: 11, color: '#64748B' }}>TIER / TIPO</th>
              <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: 11, color: '#64748B' }}>STATUS</th>
              <th style={{ textAlign: 'right', padding: '12px 10px', fontSize: 11, color: '#64748B' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {[
              { num: '+55 11 91000-2000', tenant: 'Transp. Falcão', tier: 'Business Tier 2', status: 'Verificado', color: '#10B981' },
              { num: '+55 11 91001-2001', tenant: 'Expresso Fed.', tier: 'Standard', status: 'Pendente', color: '#F59E0B' },
              { num: '+55 21 98888-7777', tenant: 'Ind. Matarazzo', tier: 'Business Tier 1', status: 'Verificado', color: '#10B981' },
            ].map((n, i) => (
              <tr 
                key={i} 
                onClick={() => setSelectedInstance({ ...n, name: n.tenant, phone: n.num })}
                style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '16px 10px', fontWeight: 700 }}>{n.num}</td>
                <td style={{ padding: '16px 10px', fontSize: 13, color: '#475569' }}>{n.tenant}</td>
                <td style={{ padding: '16px 10px', fontSize: 13 }}><span style={{ padding: '4px 8px', background: '#F1F5F9', borderRadius: 6, fontSize: 11 }}>{n.tier}</span></td>
                <td style={{ padding: '16px 10px' }}><span style={{ color: n.color, fontWeight: 800, fontSize: 11 }}>● {n.status}</span></td>
                <td style={{ padding: '16px 10px', textAlign: 'right' }}>
                  <button style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, fontSize: 11, padding: '6px 12px' }}>Gerenciar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div style={{ background: '#FFF', borderRadius: 24, padding: 24, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>SALDO EM CARTEIRA MASTER</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A' }}>R$ 12.420,00</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button 
              type="button" 
              onClick={() => setIsAddCreditsModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 6, border: '1px solid rgb(37, 211, 102)', background: 'rgb(220, 252, 231)', color: 'rgb(21, 128, 61)', fontSize: 12, fontWeight: 700, cursor: 'pointer', flex: 1 }}
            >
              <Coins size={14} /> Créditos globais
            </button>
            <button style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, flex: 1 }} onClick={() => toastSuccess('Gerando relatório...')}>Relatórios</button>
          </div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 24, padding: 24, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>CONSUMO ESTIMADO (MÊS)</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#25D366' }}>R$ 4.120,00</div>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#64748B' }}>Baseado em 1.2M mensagens projetadas.</p>
        </div>
        <div style={{ background: '#0F172A', borderRadius: 24, padding: 24, color: 'white' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 8 }}>DEDUÇÃO DE MARGEM (MARKUP)</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: ACCENT }}>25.5%</div>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#94A3B8' }}>Lucro bruto operacional do gateway.</p>
        </div>
      </div>
      <div style={{ background: '#FFF', borderRadius: 24, padding: 24, border: '1px solid #E2E8F0' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 900 }}>Transações Recentes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { desc: 'Adição de Créditos - Transp. Falcão', val: '+ R$ 500,00', date: 'Hoje, 10:45', type: 'in' },
            { desc: 'Consumo Mensagens - Ind. Matarazzo', val: '- R$ 12,40', date: 'Hoje, 09:12', type: 'out' },
            { desc: 'Taxa de Manutenção Canal - Viação Cometa', val: '- R$ 49,90', date: 'Ontem', type: 'out' },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F8FAFC', borderRadius: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{t.desc}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{t.date}</div>
              </div>
              <div style={{ fontWeight: 800, color: t.type === 'in' ? '#10B981' : '#F43F5E' }}>{t.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderApi = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: '#FFF', borderRadius: 24, padding: 32, border: '1px solid #E2E8F0' }}>
        <h3 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 900 }}>Gestão de Chaves de API (Gateway)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { name: 'ZapTro Main Production', key: 'zt_prod_live_xxxxxxxxxx', usage: '840k calls/mo', status: 'Ativa' },
            { name: 'Logta ERP Integration', key: 'logta_erp_xxxxxxxxxx', usage: '12k calls/mo', status: 'Ativa' },
          ].map((k, i) => (
            <div key={i} style={{ padding: 20, borderRadius: 16, border: '1px solid #F1F5F9', background: '#FAFAFA' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>{k.name}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981' }}>● {k.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <code style={{ flex: 1, padding: '12px', background: '#FFF', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }}>{k.key}</code>
                <button style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn }} onClick={() => toastSuccess('Chave copiada.')}><Copy size={14} /></button>
                <button style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, color: '#EF4444' }} onClick={() => toastSuccess('Chave rotacionada.')}><RefreshCcw size={14} /></button>
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: '#64748B' }}>Uso acumulado: <strong>{k.usage}</strong></div>
            </div>
          ))}
          <button style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, padding: '16px', background: '#F8FAFC', borderStyle: 'dashed', justifyContent: 'center' }} onClick={() => toastSuccess('Nova chave gerada.')}>+ CRIAR NOVA CHAVE DE ACESSO</button>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: '#FFF', borderRadius: 24, padding: 24, border: '1px solid #E2E8F0' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 900 }}>Audit Log de Mensagens (Real-time)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { id: 'msg_123', from: 'Financeiro Dept', to: '+5511999990000', body: 'Seu boleto está vencendo...', status: 'delivered', time: '14:32:01' },
            { id: 'msg_124', from: 'Vendas SP', to: '+5521988887777', body: 'Olá, temos uma oferta...', status: 'sent', time: '14:31:45' },
            { id: 'msg_125', from: 'Suporte VIP', to: '+5511910002000', body: 'Ticket #882 atualizado.', status: 'failed', time: '14:30:12' },
          ].map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
              <span style={{ color: '#94A3B8', fontFamily: 'monospace' }}>[{l.time}]</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700 }}>{l.from}</span> → <span style={{ color: '#64748B' }}>{l.to}</span>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.body}</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: l.status === 'failed' ? '#EF4444' : '#10B981', textTransform: 'uppercase' }}>{l.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: '#FFF', borderRadius: 24, padding: 32, border: '1px solid #E2E8F0' }}>
        <h3 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 900 }}>Configurações Globais do Gateway</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>WEBHOOK GLOBAL (EVENTS)</label>
              <input defaultValue="https://api.zaptro.com.br/webhooks/whatsapp" style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #E2E8F0' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>ESTRATÉGIA DE RETRY</label>
              <select style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <option>Exponencial (Recomendado)</option>
                <option>Linear (3 tentativas)</option>
                <option>Nenhuma</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
             <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>STORAGE DE MÍDIA</label>
              <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>S3 bucket: zaptro-wa-media</span>
                <CheckCircle2 size={16} color="#10B981" />
              </div>
            </div>
            <div style={{ padding: 20, background: '#F0F9FF', borderRadius: 16, border: '1px solid #B9E6FE' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#0369A1', marginBottom: 4 }}>Saúde do Gateway: 100%</div>
              <p style={{ margin: 0, fontSize: 12, color: '#0E7490' }}>Todos os 12 nodes operacionais. Latência média: 45ms.</p>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: ACCENT, color: 'white', border: 'none', padding: '12px 32px' }} onClick={() => toastSuccess('Configurações salvas!')}>SALVAR ALTERAÇÕES</button>
        </div>
      </div>
    </div>
  );

  const renderCollabModal = () => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{editingCollab?.id ? 'Editar Colaborador' : 'Novo Colaborador'}</h3>
          <button onClick={() => setIsCollabModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>NOME COMPLETO</label>
            <input 
              defaultValue={editingCollab?.full_name} 
              onBlur={e => setEditingCollab({...editingCollab, full_name: e.target.value})}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #E2E8F0' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>E-MAIL (LOGIN)</label>
            <input 
              defaultValue={editingCollab?.email} 
              onBlur={e => setEditingCollab({...editingCollab, email: e.target.value})}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #E2E8F0' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>CARGO / FUNÇÃO</label>
            <select 
              defaultValue={editingCollab?.role || 'COLABORADOR'}
              onChange={e => setEditingCollab({...editingCollab, role: e.target.value})}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC' }}
            >
              <option value="ADMIN">Administrador</option>
              <option value="COLABORADOR">Colaborador</option>
              <option value="FINANCEIRO">Financeiro</option>
              <option value="OPERACIONAL">Operacional</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button 
              onClick={() => setIsCollabModalOpen(false)}
              style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#FFF', fontWeight: 700, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button 
              onClick={() => saveCollaborator(editingCollab)}
              style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: '#0F172A', color: 'white', fontWeight: 800, cursor: 'pointer' }}
            >
              {editingCollab?.id ? 'Salvar Alterações' : 'Criar Acesso'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentModal = () => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 440, textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -10 }}>
          <button onClick={() => setGeneratedPayment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        
        <div style={{ width: 64, height: 64, background: '#DCFCE7', color: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Coins size={32} />
        </div>

        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Cobrança Gerada</h3>
        <p style={{ color: '#64748B', fontSize: 14, marginTop: 8 }}>Envie o código PIX abaixo para o cliente realizar o pagamento.</p>

        <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0', marginTop: 24, textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 4 }}>VALOR DA RECARGA</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>R$ {parseFloat(generatedPayment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 8 }}>PIX COPIA E COLA</div>
            <div style={{ padding: 12, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', color: '#475569' }}>
              {generatedPayment.code}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button 
            onClick={() => { navigator.clipboard.writeText(generatedPayment.code); toastSuccess('Código PIX copiado!'); }}
            style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: '#166534', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Copy size={18} /> COPIAR CÓDIGO
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={HUB_MASTER_PRODUCT_SHELL.container}>
      {isCollabModalOpen && renderCollabModal()}
      {generatedPayment && renderPaymentModal()}
      <div style={HUB_MASTER_PRODUCT_SHELL.secondarySidebar}>
        <div style={{ ...HUB_MASTER_PRODUCT_SHELL.sidebarHeader, flexDirection: 'column', alignItems: 'stretch', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color={ACCENT} />
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.025em', color: '#0F172A' }}>Whatsapp Hub</span>
          </div>
        </div>
        <div style={{ height: '1px', backgroundColor: '#F3F4F6' }} />
        <div style={HUB_MASTER_PRODUCT_SHELL.sidebarNav}>
          {tabSections.map((sec) => (
            <div key={sec.title} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'none', letterSpacing: '0.03em', padding: '4px 10px 6px' }}>
                {sec.title}
              </div>
              {sec.items.map((item) => (
                <button
                  key={item.id}
                  style={{
                    ...HUB_MASTER_PRODUCT_SHELL.sidebarBtn,
                    backgroundColor: activeTab === item.id ? '#F0F9FF' : 'transparent',
                    color: activeTab === item.id ? '#0F172A' : '#475569',
                  }}
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon size={14} style={{ color: activeTab === item.id ? ACCENT : '#64748B' }} />
                  <span style={{ fontWeight: activeTab === item.id ? 700 : 400, fontSize: '12px' }}>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={HUB_MASTER_PRODUCT_SHELL.contentArea}>
        <div style={{ 
          ...HUB_MASTER_PRODUCT_SHELL.content, 
          gap: 24 
        }}>
          {activeTab === 'overview' && (
            <>
              <MasterProductProjectHeader
                title="Whatsapp Cloud Gateway"
                subtitle="Gestão de instâncias, mensageria e automação omnichannel"
                domainUrl="whatsapp.zaptro.com.br"
                domainLabel="whatsapp.zaptro.com.br"
                accentColor={ACCENT}
                avatarName="WA"
                actions={
                  <button 
                    onClick={() => window.open('http://localhost:5174', '_blank')}
                    style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: ACCENT, color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 800 }}
                  >
                    <ExternalLink size={18} /> ABRIR ZAPTRO APP
                  </button>
                }
              />
              {renderOverview()}
            </>
          )}

          {activeTab === 'whatsapp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ background: '#FFF', borderRadius: 24, padding: 32, border: '1px solid #E2E8F0' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>Suporte global — WhatsApp (evolução)</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 24, marginBottom: 32 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>TENANT / EMPRESA</label>
                    <select style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 14, fontWeight: 600 }}>
                      <option>1 · Transportadora Falcão</option>
                      <option>2 · Expresso Federal</option>
                      <option>3 · Indústrias Matarazzo</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>CRÉDITOS (SALDO GLOBAL MOCK)</label>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 24, fontWeight: 900 }}>128.400</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>disponíveis</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>ADICIONAR CRÉDITOS</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input placeholder="Ex: 5000" style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14 }} />
                      <button style={{ padding: '12px 28px', borderRadius: 100, background: '#7C3AED', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.04em', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' }} onClick={() => toastSuccess('Créditos aplicados.')}>
                        <RefreshCcw size={16} /> APLICAR CRÉDITOS
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div style={{ padding: 24, borderRadius: 20, border: '1px solid #E2E8F0', background: '#FFF' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 16 }}>NÚMERO / CANAL</label>
                    <input defaultValue="+55 11 99999-0000" style={{ width: '100%', padding: '16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 14, marginBottom: 20 }} />
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button style={{ flex: 1, padding: '12px 24px', borderRadius: 100, border: '1px solid #E2E8F0', background: '#FFF', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '11px' }} onClick={() => toastSuccess('Número salvo.')}>SALVAR NÚMERO</button>
                      <button style={{ flex: 1, padding: '12px 24px', borderRadius: 100, border: '1px solid #FEE2E2', background: '#FFF', color: '#EF4444', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '11px' }} onClick={() => toastSuccess('Número bloqueado.')}>
                        <Ban size={16} /> BLOQUEAR NÚMERO
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: 24, borderRadius: 20, border: '1px solid #E2E8F0', background: '#FFF', textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 16, textAlign: 'left' }}>QR CODE — PAREAMENTO</label>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                      <div style={{ width: '100%', maxWidth: 300, padding: 32, background: '#FFF', borderRadius: 24, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                        <QrCode size={200} color="#0F172A" />
                      </div>
                      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                        <button style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: '#25D366', color: 'white', border: 'none', padding: '14px 40px', borderRadius: 100, fontWeight: 900, textTransform: 'uppercase' }} onClick={() => toastSuccess('QR Gerado.')}>GERAR QR CODE</button>
                        <button style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: '#FFF', color: '#0F172A', border: '1px solid #E2E8F0', padding: '14px 40px', borderRadius: 100, fontWeight: 900, textTransform: 'uppercase' }} onClick={() => toastSuccess('Reiniciando...')}>REINICIAR</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #F1F5F9', fontSize: 12, color: '#94A3B8' }}>
                  Produção: integra Evolution API / Meta — ações auditadas e refletem no app do cliente após confirmação.
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'instances' && (
            selectedInstance ? renderCompanyProfile() : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: '#FFF', borderRadius: 24, padding: 24, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748B', maxWidth: 720 }}>
                      Inbox e desempenho <strong style={{ color: '#25D366' }}>WhatsApp</strong> agregados por tenant — números conectados, volume 24h e saúde.
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button 
                        type="button" 
                        onClick={() => setIsAddCreditsModalOpen(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #25D366', background: '#DCFCE7', color: '#15803D', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        <Coins size={14} /> Créditos globais
                      </button>
                      <button 
                        type="button" 
                        onClick={() => window.open('http://localhost:5174/whatsapp', '_blank')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #7C3AED', background: '#7C3AED', color: '#FFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        <Plus size={14} /> Abrir WhatsApp
                      </button>
                    </div>
                  </div>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FAFC' }}>EMPRESA</th>
                        <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FAFC' }}>NÚMERO / CANAL</th>
                        <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FAFC' }}>MSGS (24H)</th>
                        <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FAFC' }}>TMA RESP.</th>
                        <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FAFC' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: '1', name: 'Transportadora Falcão', phone: '+55 11 91000-2000', msgs: '120', tma: '1m 10s', status: 'Instável', statusColor: '#F59E0B' },
                        { id: 'demo-11', name: 'Expresso Federal', phone: '+55 11 91001-2001', msgs: '134', tma: '2m 11s', status: 'Operacional', statusColor: '#16A34A' },
                        { id: 'demo-12', name: 'Rápido Trans', phone: '+55 11 91002-2002', msgs: '148', tma: '3m 12s', status: 'Operacional', statusColor: '#16A34A' },
                        { id: 'demo-13', name: 'TransNorte Cargo', phone: '+55 11 91003-2003', msgs: '162', tma: '1m 13s', status: 'Operacional', statusColor: '#16A34A' },
                        { id: 'demo-14', name: 'Alfa Transportes', phone: '+55 11 91004-2004', msgs: '176', tma: '2m 14s', status: 'Operacional', statusColor: '#16A34A' },
                      ].map((r) => (
                        <tr 
                          key={r.id} 
                          style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                          onClick={() => setSelectedInstance(r)}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600 }}>{r.name}</td>
                          <td style={{ padding: '16px 20px', fontSize: 13 }}>{r.phone}</td>
                          <td style={{ padding: '16px 20px', fontSize: 13 }}>{r.msgs}</td>
                          <td style={{ padding: '16px 20px', fontSize: 13 }}>{r.tma}</td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: r.statusColor }}>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 16, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Mostrando 1–5 de 16</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button disabled style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#FFF', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', opacity: 0.45 }}>
                        <ChevronRight style={{ transform: 'rotate(180deg)' }} size={16} /> Anterior
                      </button>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#334155', minWidth: 72, textAlign: 'center' }}>Pág. 1 / 4</span>
                      <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#FFF', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Próxima <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {activeTab === 'numbers' && (selectedInstance ? renderCompanyProfile() : renderNumbers())}
          {activeTab === 'billing' && renderBilling()}
          {activeTab === 'api' && renderApi()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      {isAddCreditsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Adicionar Créditos</h3>
              <button onClick={() => setIsAddCreditsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>CLIENTE (ZAPTRO)</label>
                <select value={selectedCreditClient} onChange={(e) => setSelectedCreditClient(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <option value="">Selecione um cliente...</option>
                  <option value="falcao">Transportadora Falcão (ZT)</option>
                  <option value="matarazzo">Ind. Matarazzo (ZT)</option>
                  <option value="cometa">Viação Cometa (ZT)</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>VALOR (R$)</label>
                <input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #E2E8F0' }} />
              </div>
              
              <button 
                onClick={() => {
                  toastSuccess(`R$ ${creditAmount} adicionados com sucesso!`);
                  setIsAddCreditsModalOpen(false);
                  setCreditAmount('');
                  setSelectedCreditClient('');
                }}
                style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: '#25D366', color: 'white', border: 'none', padding: '16px', marginTop: 8 }}
              >
                CONFIRMAR ADIÇÃO DE CRÉDITOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ALTERAR CARTÃO */}
      {isCardModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '24px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Vincular Novo Cartão</h3>
              <button onClick={() => setIsCardModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20} /></button>
            </div>

            <div style={{ padding: 24 }}>
              {/* Card Preview Visual */}
              <div style={{ 
                width: '100%', 
                height: 180, 
                borderRadius: 16, 
                background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)', 
                marginBottom: 24,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: 45, height: 32, borderRadius: 4, background: 'rgba(255,255,255,0.2)' }} />
                  <CreditCard size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 18, letterSpacing: '2px', fontWeight: 600, fontFamily: 'monospace' }}>
                    {cardForm.number ? cardForm.number.replace(/\d{4}(?=.)/g, '$& ') : '•••• •••• •••• ••••'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                    <div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Titular</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{cardForm.name || 'NOME DO CLIENTE'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Expira</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{cardForm.expiry || 'MM/AA'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: cardError && !cardForm.number ? '#EF4444' : '#64748B', marginBottom: 6 }}>NÚMERO DO CARTÃO</label>
                  <input 
                    maxLength={16}
                    value={cardForm.number}
                    onChange={e => {
                      setCardError(null);
                      setCardForm({...cardForm, number: e.target.value.replace(/\D/g, '')});
                    }}
                    placeholder="0000 0000 0000 0000"
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: cardError && cardForm.number.length < 16 ? '1px solid #EF4444' : '1px solid #E2E8F0', fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 6 }}>NOME NO CARTÃO</label>
                  <input 
                    value={cardForm.name}
                    onChange={e => {
                      setCardError(null);
                      setCardForm({...cardForm, name: e.target.value.toUpperCase()});
                    }}
                    placeholder="COMO IMPRESSO NO CARTÃO"
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 6 }}>VALIDADE</label>
                    <input 
                      maxLength={5}
                      value={cardForm.expiry}
                      onChange={e => {
                        setCardError(null);
                        let v = e.target.value.replace(/\D/g, '');
                        if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
                        setCardForm({...cardForm, expiry: v});
                      }}
                      placeholder="MM/AA"
                      style={{ width: '100%', padding: '12px', borderRadius: 12, border: cardError && !cardForm.expiry.includes('/') ? '1px solid #EF4444' : '1px solid #E2E8F0', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 6 }}>CVV</label>
                    <input 
                      maxLength={4}
                      value={cardForm.cvv}
                      onChange={e => {
                        setCardError(null);
                        setCardForm({...cardForm, cvv: e.target.value.replace(/\D/g, '')});
                      }}
                      placeholder="000"
                      style={{ width: '100%', padding: '12px', borderRadius: 12, border: cardError && cardForm.cvv.length < 3 ? '1px solid #EF4444' : '1px solid #E2E8F0', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {cardError && (
                <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Ban size={14} /> {cardError}
                </div>
              )}

              <button 
                onClick={() => {
                  if (cardForm.number.length < 16) return setCardError('Número do cartão inválido.');
                  if (!cardForm.name) return setCardError('Nome do titular é obrigatório.');
                  if (cardForm.expiry.length < 5) return setCardError('Data de validade inválida.');
                  if (cardForm.cvv.length < 3) return setCardError('CVV inválido.');
                  
                  toastSuccess('Cartão vinculado com sucesso ao Hub e ZapTro!');
                  setIsCardModalOpen(false);
                }}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  borderRadius: 14, 
                  background: '#25D366', 
                  color: 'white', 
                  border: 'none', 
                  fontWeight: 800, 
                  fontSize: 14, 
                  cursor: 'pointer', 
                  marginTop: 24,
                  boxShadow: '0 10px 20px rgba(37,211,102,0.2)',
                  transition: '0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                SALVAR CARTÃO MASTER
              </button>
              <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 16 }}>
                <ShieldCheck size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> 
                Processamento seguro criptografado (PCI DSS)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DA TRANSAÇÃO */}
      {isTransactionModalOpen && selectedTransaction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 450, borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '24px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Detalhes do Lançamento</h3>
              <button onClick={() => setIsTransactionModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', background: '#F8FAFC', borderRadius: 16, border: '1px solid #F1F5F9', marginBottom: 20 }}>
                <button
              type="button"
              onClick={() => toastSuccess('Nova conta WhatsApp conectada.')}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '100px',
                border: 'none',
                background: '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#FFFFFF',
                padding: 0,
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
              }}
              title="Adicionar Conta WhatsApp"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
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
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>{selectedTransaction.val}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#64748B', marginTop: 4 }}>{selectedTransaction.desc}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>Status</span>
                  <span style={{ fontSize: 13, color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} /> Confirmado
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>Data</span>
                  <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 700 }}>{selectedTransaction.date} 2026</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>ID Master</span>
                  <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 700, fontFamily: 'monospace' }}>WA-TRX-{Math.floor(Math.random() * 99999)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>Origem</span>
                  <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 700 }}>Gateway ZapTro / Hub</span>
                </div>
              </div>

              <button 
                onClick={() => setIsTransactionModalOpen(false)}
                style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#0F172A', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 24 }}
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FLOWBUILDER (AUTOMAÇÃO) */}
      {isFlowModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 700, borderRadius: 32, overflow: 'hidden', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '32px 32px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={24} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Zaptro FlowBuilder (Master)</h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>Configurando automação para: {selectedInstance?.name || 'Instância Ativa'}</p>
              </div>
              <button onClick={() => setIsFlowModalOpen(false)} style={{ background: '#F8FAFC', border: 'none', cursor: 'pointer', color: '#94A3B8', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
            </div>

            <div style={{ padding: 32, flex: 1, overflowY: 'auto', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {activeFlow.steps.map((step: any, idx: number) => (
                  <div key={step.id} style={{ background: 'white', padding: 24, borderRadius: 20, border: '1px solid #E2E8F0', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: '#0F172A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{idx + 1}</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {step.type === 'MENU' ? <MessageSquare size={20} /> : step.type === 'ACTION' ? <Database size={20} /> : <Users size={20} />}
                        </div>
                        <div>
                          <input 
                            value={step.title}
                            onChange={(e) => {
                              const next = [...activeFlow.steps];
                              next[idx].title = e.target.value;
                              setActiveFlow({...activeFlow, steps: next});
                            }}
                            style={{ border: 'none', background: 'none', fontSize: 16, fontWeight: 800, color: '#0F172A', padding: 0, width: '100%' }}
                          />
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>MODULO: {step.type}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const next = activeFlow.steps.filter((_: any, i: number) => i !== idx);
                          setActiveFlow({...activeFlow, steps: next});
                        }}
                        style={{ color: '#EF4444', background: '#FEF2F2', border: 'none', padding: '8px', borderRadius: 10, cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #F1F5F9' }}>
                       <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>RESPOSTA DO BOT (JSON/TEXTO)</label>
                       <textarea 
                        placeholder="Configure a lógica aqui..."
                        style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'monospace' }}
                        defaultValue={`{\n  "action": "reply",\n  "content": "Olá! Como posso ajudar?"\n}`}
                       />
                    </div>
                  </div>
                ))}

                <button 
                  onClick={() => {
                    setActiveFlow({
                      ...activeFlow,
                      steps: [...activeFlow.steps, { id: Date.now().toString(), title: 'Novo Módulo', type: 'ACTION' }]
                    });
                  }}
                  style={{ padding: 20, borderRadius: 20, border: '2px dashed #CBD5E1', background: 'none', color: '#64748B', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                >
                  <Plus size={20} /> ADICIONAR NOVO MÓDULO AO FLUXO
                </button>
              </div>
            </div>

            <div style={{ padding: 32, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setIsFlowModalOpen(false)} style={{ padding: '12px 24px', borderRadius: 14, border: '1px solid #E2E8F0', background: 'white', fontWeight: 700, cursor: 'pointer' }}>DESCARTAR</button>
              <button 
                onClick={() => {
                  toastSuccess('Automação sincronizada com o motor Zaptro Flow!');
                  setIsFlowModalOpen(false);
                }}
                style={{ padding: '12px 32px', borderRadius: 14, border: 'none', background: '#0F172A', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 20px rgba(15,23,42,0.15)' }}
              >
                PUBLICAR FLUXO NO ZAPTRO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsappAdmin;
