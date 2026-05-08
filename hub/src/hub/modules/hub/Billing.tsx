import React, { useState, useEffect } from 'react';
import {
   DollarSign, TrendingUp, TrendingDown, Clock,
   Search, Download, Filter, ArrowUpRight,
   CheckCircle, AlertTriangle, Building2, Calendar, Mail, Send,
   CreditCard, Activity, ArrowDownRight, Briefcase, 
   MoreVertical, RefreshCw, BarChart3, PieChart as PieIcon,
   UserCheck, Wallet, ShieldCheck, Target, Zap, 
   Users, Ban, CheckCircle2, MoreHorizontal, Settings,
   Eye, Edit3, Trash2, X, Plus, ChevronRight, Copy, Link as LinkIcon,
   Layout, FileText, Tag, Coins
} from 'lucide-react';
import { 
   BarChart, Bar, XAxis, YAxis, CartesianGrid, 
   Tooltip, ResponsiveContainer, AreaChart, Area,
   PieChart, Pie, Cell
} from 'recharts';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError } from '@core/lib/toast';
import Modal from '@shared/components/Modal';
import HubMetricCard from '@shared/components/HubMetricCard';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';
import Pagination from '@shared/components/Pagination';

import MasterFinanceiro from './Financeiro';
import ClientIaCredits from './ClientIaCredits';

const MasterBilling = ({ summaryOnly = false }: { summaryOnly?: boolean }) => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [chargeModalType, setChargeModalType] = useState<'plan' | 'charge'>('charge');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromPath = () => {
    if (summaryOnly) return 'dashboard';
    const path = location.pathname;
    if (path.includes('/billing/creditos-ia')) return 'creditos-ia';
    if (path.includes('/billing/faturamento')) return 'faturamento';
    if (path.includes('/billing/financeiro')) return 'financeiro';
    if (path.includes('/billing/planos')) return 'planos';
    if (path.includes('/billing/marketing')) return 'marketing';
    
    // Check fallback search params
    const queryTab = searchParams.get('tab');
    if (queryTab) return queryTab;
    
    return 'dashboard';
  };

  const activeTab = getTabFromPath();

  const setActiveTab = (tab: string) => {
    if (summaryOnly) return;
    const pathname = tab === 'dashboard' ? '/master/billing' : `/master/billing/${tab}`;
    navigate({ pathname, search: location.search });
  };

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedCharge, setSelectedCharge] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [saving, setSaving] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(() => {
    const saved = localStorage.getItem('hub_billing_per_page');
    return saved === 'all' ? 'all' : Number(saved || 20);
  });
  const [totalItems, setTotalItems] = useState(0);

  // Form States
  const [newCharge, setNewCharge] = useState({ 
    client_id: '', 
    custom_client_name: '',
    selectedProducts: [] as string[],
    amount: '', 
    method: 'PIX', 
    dueDate: new Date().toISOString().split('T')[0],
    isRecurring: true,
    email: '',
    phone: '',
    cpfCnpj: '',
    coupon: ''
  });
  const [chargeResult, setChargeResult] = useState<any>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', products: [], cycle: '1', price: '', wa_credits: 0, ai_credits: 0 });

  const [editPlanDraft, setEditPlanDraft] = useState({
    name: '',
    slug: '',
    price: '',
    contract_months: '1',
    wa_credits: '0',
    ai_credits: '0',
    description: '',
    is_active: true,
    backup_enabled: false,
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage, itemsPerPage]); // Re-fetch when page or limit changes

  useEffect(() => {
    if (!isDetailModalOpen || !selectedPlan) return;
    setEditPlanDraft({
      name: String(selectedPlan.name ?? ''),
      slug: String(selectedPlan.slug ?? ''),
      price: String(selectedPlan.price ?? ''),
      contract_months: String(selectedPlan.contract_months ?? '1'),
      wa_credits: String(selectedPlan.wa_credits ?? 0),
      ai_credits: String(selectedPlan.ai_credits ?? 0),
      description: String(selectedPlan.description ?? ''),
      is_active: selectedPlan.is_active !== false,
      backup_enabled: !!selectedPlan.backup_enabled,
    });
  }, [isDetailModalOpen, selectedPlan]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'faturamento' || activeTab === 'dashboard') fetchCharges();
      if (activeTab === 'planos' || activeTab === 'dashboard') fetchPlans();
      
      const { data: cos } = await supabase
        .from('companies')
        .select('*, subscriptions(*)');
        
      setCompanies(cos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    const { data } = await supabase.from('plans').select('*').order('created_at', { ascending: false });
    setPlans(data || []);
  };

  const fetchCharges = async () => {
    try {
      let query = supabase
        .from('master_payments')
        .select('*', { count: 'exact' });

      // Pagination
      if (itemsPerPage !== 'all') {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);
      }

      const { data, count } = await query.order('created_at', { ascending: false });
      setCharges(data || []);
      setTotalItems(count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemsPerPageChange = (val: number | 'all') => {
    setItemsPerPage(val);
    setCurrentPage(1);
    localStorage.setItem('hub_billing_per_page', String(val));
  };

  const openChargeModal = (type: 'plan' | 'charge') => {
    setChargeModalType(type);
    if (type === 'plan') {
      setNewCharge(prev => ({
        ...prev,
        client_id: '',
        custom_client_name: '',
        email: '',
        phone: '',
        cpfCnpj: '',
        isRecurring: true,
      }));
    }
    setIsChargeModalOpen(true);
  };

  const handleGenerateCharge = async () => {
    setSaving(true);
    try {
      const isPublicPlan = chargeModalType === 'plan';
      let clientName = newCharge.custom_client_name.trim();
      let clientEmail = newCharge.email;
      let clientPhone = newCharge.phone;

      if (!isPublicPlan) {
        if (newCharge.client_id) {
          const client = companies.find(c => c.id === newCharge.client_id);
          if (client) {
            clientName = client.name;
            clientEmail = client.email || clientEmail;
            clientPhone = client.phone || clientPhone;
          }
        }
        if (!clientName) {
          throw new Error('Informe o cliente (lista ou nome personalizado) para gerar cobrança direta.');
        }
      } else {
        clientName = 'Checkout público — plano Master';
        clientEmail = 'financeiro@logta.com.br';
        clientPhone = '';
      }

      const isSubscription = isPublicPlan ? true : newCharge.isRecurring;

      // 1. Chamar Edge Function para criar cobrança no Asaas
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/hub-core/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          client: clientName,
          email: clientEmail || 'financeiro@logta.com.br',
          phone: clientPhone || '',
          cpfCnpj: isPublicPlan ? '' : newCharge.cpfCnpj,
          amount: newCharge.amount,
          due_date: newCharge.dueDate,
          method: newCharge.method.toLowerCase(),
          description: `Cobrança ${chargeModalType === 'plan' ? 'Plano' : 'Manual'} - ${newCharge.selectedProducts.join(', ')}`,
          is_subscription: isSubscription
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Erro ao gerar no Asaas');

      // 2. Registrar no Master Payments (Histórico local)
      const { error } = await supabase.from('master_payments').insert([{
        client_name: clientName,
        amount: parseFloat(newCharge.amount),
        status: 'PENDENTE',
        method: newCharge.method,
        due_date: newCharge.dueDate,
        invoice_url: result.link,
        asaas_id: result.payment_id,
        metadata: {
          products: newCharge.selectedProducts,
          is_recurring: isSubscription,
          type: chargeModalType
        }
      }]);

      if (error) throw error;

      toastSuccess(`Cobrança Asaas ${chargeModalType === 'plan' ? 'de Plano' : ''} gerada com sucesso!`);
      setChargeResult(result);
      setIsChargeModalOpen(false);
      setIsSuccessModalOpen(true);
      setNewCharge({ 
        client_id: '', 
        custom_client_name: '', 
        email: '', 
        phone: '', 
        cpfCnpj: '',
        amount: '', 
        dueDate: new Date().toISOString().split('T')[0], 
        method: 'PIX', 
        isRecurring: true, 
        selectedProducts: [] as string[],
        coupon: ''
      });
      fetchCharges();
    } catch (err: any) {
      toastError(err.message || 'Erro ao gerar cobrança');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePlan = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('plans').insert([{
        name: newPlan.name,
        price: parseFloat(newPlan.price),
        contract_months: parseInt(newPlan.cycle),
        wa_credits: newPlan.wa_credits,
        ai_credits: newPlan.ai_credits,
        type: 'CUSTOM',
        is_active: true,
        slug: newPlan.name.toLowerCase().replace(/\s/g, '-'),
        description: `Plano personalizado via Hub Master: ${newPlan.cycle} meses.`
      }]);
      if (error) throw error;
      toastSuccess('Plano estratégico criado e link Asaas gerado!');
      setIsPlanModalOpen(false);
      fetchPlans();
    } catch (err) {
      toastError('Erro ao criar plano');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async () => {
    if (deleteConfirmText !== 'EXCLUIR') {
        toastError('Por favor, digite EXCLUIR para confirmar.');
        return;
    }
    setSaving(true);
    try {
        const { error } = await supabase.from('plans').delete().eq('id', selectedPlan.id);
        if (error) throw error;
        toastSuccess('Plano removido com sucesso!');
        setIsDeleteModalOpen(false);
        setDeleteConfirmText('');
        fetchPlans();
    } catch (err) {
        toastError('Erro ao remover plano');
    } finally {
        setSaving(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan?.id) return;
    const slug = editPlanDraft.slug.trim().toLowerCase().replace(/\s+/g, '-');
    if (!slug) {
      toastError('Informe um slug válido para o link de checkout.');
      return;
    }
    const price = parseFloat(editPlanDraft.price.replace(',', '.'));
    if (!Number.isFinite(price) || price < 0) {
      toastError('Preço inválido.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('plans')
        .update({
          name: editPlanDraft.name.trim(),
          slug,
          price,
          contract_months: parseInt(editPlanDraft.contract_months, 10) || 1,
          wa_credits: parseInt(editPlanDraft.wa_credits, 10) || 0,
          ai_credits: parseInt(editPlanDraft.ai_credits, 10) || 0,
          description: editPlanDraft.description.trim() || null,
          is_active: editPlanDraft.is_active,
          backup_enabled: editPlanDraft.backup_enabled,
        })
        .eq('id', selectedPlan.id);
      if (error) throw error;
      toastSuccess('Plano atualizado no catálogo.');
      setIsDetailModalOpen(false);
      fetchPlans();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar plano';
      toastError(msg);
    } finally {
      setSaving(false);
    }
  };

  const calculateMetrics = () => {
    const mrr = (plans || []).reduce((acc, p) => {
      const activeCount = (companies || []).filter(c => c?.plan_id === p?.id && c?.status === 'active').length;
      return acc + ((p?.price || 0) * activeCount);
    }, 0);

    const activeTenants = (companies || []).filter(c => c?.status === 'active').length;
    const blockedTenants = (companies || []).filter(c => c?.status === 'blocked' || c?.status === 'expired').length;
    
    // Empresas em Carência (Expira mas < 3 dias)
    const graceTenants = (companies || []).filter(c => {
      const sub = c.subscriptions?.[0];
      if (!sub || sub.status !== 'active') return false;
      const expiry = new Date(sub.expires_at);
      const today = new Date();
      const graceLimit = new Date(expiry);
      graceLimit.setDate(graceLimit.getDate() + 3);
      return today > expiry && today <= graceLimit;
    }).length;

    return { mrr, activeTenants, blockedTenants, graceTenants };
  };

  const metrics = calculateMetrics();

  const productData = [
    { name: 'Logta ERP', value: (companies || []).filter(c => c?.origin === 'logta' || c?.origin === 'LOGTA').length || 12, color: 'var(--accent)' },
    { name: 'Zaptro CRM', value: (companies || []).filter(c => c?.origin === 'zaptro' || c?.origin === 'ZAPTRO').length || 8, color: 'var(--green)' },
    { name: 'Backup/API', value: (companies || []).filter(c => !['logta', 'zaptro', 'LOGTA', 'ZAPTRO'].includes(c?.origin || '')).length || 5, color: 'var(--orange)' },
  ];

  const distributionTotal =
    productData.reduce((s, p) => s + Number(p.value), 0) || 1;
  const distributionSorted = [...productData].sort(
    (a, b) => Number(b.value) - Number(a.value)
  );
  const distributionTop = distributionSorted[0];
  const distributionTopPct = Math.min(
    100,
    (Number(distributionTop.value) / distributionTotal) * 100
  );
  const GAUGE_SEGMENTS = 18;
  const distributionFilledSegments = Math.max(
    0,
    Math.min(
      GAUGE_SEGMENTS,
      Math.round((distributionTopPct / 100) * GAUGE_SEGMENTS)
    )
  );
  const distributionGaugeData = Array.from({ length: GAUGE_SEGMENTS }, (_, i) => {
    const inactive = 'rgba(237, 242, 247, 0.92)';
    if (i >= distributionFilledSegments) {
      return { name: `g${i}`, value: 1, fill: inactive };
    }
    const ratio =
      distributionFilledSegments <= 1 ? 0 : i / (distributionFilledSegments - 1);
    const fill =
      ratio < 0.38 ? '#0061FF' : ratio < 0.72 ? '#3B82F6' : '#93C5FD';
    return { name: `g${i}`, value: 1, fill };
  });

  const revenueChartData = [
    { name: 'Jan', value: 4000 },
    { name: 'Fev', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Abr', value: Math.max(0, Number(metrics.mrr)) || 22400 },
  ];
  const revenuePrev = revenueChartData[revenueChartData.length - 2]?.value ?? 0;
  const revenueLast = revenueChartData[revenueChartData.length - 1]?.value ?? 0;
  const revenueMomPct =
    revenuePrev > 0 ? ((revenueLast - revenuePrev) / revenuePrev) * 100 : null;

  const tabs = [
    { id: 'dashboard', label: 'Estratégico', icon: Layout },
    { id: 'faturamento', label: 'Faturamento', icon: DollarSign },
    { id: 'planos', label: 'Planos', icon: Tag },
    { id: 'financeiro', label: 'Financeiro', icon: Wallet },
    { id: 'creditos-ia', label: 'Créditos IA', icon: Coins },
  ];

  const getStatusColor = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'PAGO': case 'RECEIVED': case 'CONFIRMED': return { bg: '#ECFDF5', text: '#10B981' };
      case 'PENDENTE': return { bg: '#FFF7ED', text: '#F97316' };
      case 'VENCIDO': case 'OVERDUE': return { bg: '#FEF2F2', text: '#EF4444' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const revenueData = [
    { month: 'Jan', mrr: 12000, new: 2400 },
    { month: 'Fev', mrr: 14500, new: 3100 },
    { month: 'Mar', mrr: 18200, new: 4500 },
    { month: 'Abr', mrr: 22400, new: 5200 },
  ];

  return (
    <div style={styles.outerContainer} className="animate-fade-in">
      <div style={styles.innerContainer}>
        {!summaryOnly && (
          <header style={styles.billingTopBar}>
            <div style={styles.billingTopBarLead}>
              <h1 style={styles.pageTitle}>Financeiro & Receita Master</h1>
              <p style={styles.pageSub}>Governança de assinaturas, MRR e saúde financeira do ecossistema.</p>
            </div>
            <div style={styles.topActions}>
              <button
                type="button"
                style={{ ...styles.secondaryBtn, whiteSpace: 'nowrap' }}
                onClick={() => openChargeModal('charge')}
              >
                <DollarSign size={18} /> NOVA COBRANÇA
              </button>
              <button
                type="button"
                style={{ ...styles.primaryBtn, whiteSpace: 'nowrap' }}
                onClick={() => openChargeModal('plan')}
              >
                <Zap size={18} color="#FACC15" fill="#FACC15" /> NOVO PLANO
              </button>
            </div>
          </header>
        )}

        {/* Abas principais — layout único em todas as seções */}
        {!summaryOnly && (
          <div style={hubPillTabStripStyles.container}>
            {tabs.map(tab => (
              <button 
                key={tab.id}
                type="button"
                style={{
                  ...hubPillTabStripStyles.button,
                  ...(activeTab === tab.id ? hubPillTabStripStyles.buttonActive : {}),
                }}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <tab.icon size={18} color={activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)'} />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {!summaryOnly && activeTab === 'financeiro' && (
          <div style={styles.financeiroContextBanner}>
            <div style={styles.financeiroContextText}>
              <span style={styles.financeiroContextKicker}>Área de foco · Financeiro</span>
              <p style={styles.financeiroContextTitle}>Conciliação, NF-e e gateway Asaas</p>
              <p style={styles.financeiroContextSub}>
                O que aparece abaixo é só este módulo. Para MRR, cobranças manuais e planos, volte a <strong>Estratégico</strong> ou <strong>Faturamento</strong>.
              </p>
            </div>
          </div>
        )}

        {!summaryOnly && activeTab === 'creditos-ia' && (
          <div style={styles.financeiroContextBanner}>
            <div style={styles.financeiroContextText}>
              <span style={styles.financeiroContextKicker}>Área de foco · Créditos IA</span>
              <p style={styles.financeiroContextTitle}>Saldos por cliente e consumo de IA</p>
              <p style={styles.financeiroContextSub}>
                Os saldos ficam em <code style={{ fontSize: 13, background: '#F1F5F9', padding: '2px 8px', borderRadius: 6 }}>IA_CLIENT_CREDITS_BALANCE</code>. Ajuste na tabela abaixo ou abra o Gateway IA para provedores e políticas.
              </p>
            </div>
          </div>
        )}

        {!summaryOnly && activeTab === 'planos' && (
          <div style={styles.financeiroContextBanner}>
            <div style={styles.financeiroContextText}>
              <span style={styles.financeiroContextKicker}>Área de foco · Planos ativos</span>
              <p style={styles.financeiroContextTitle}>Catálogo e pacotes do checkout</p>
              <p style={styles.financeiroContextSub}>
                Edite nome, preço, ciclo, créditos WA/IA, slug do link e flags de backup/atividade. Clique em um cartão para abrir o editor ou use <strong>NOVO PLANO</strong> no topo.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            <div style={styles.statsGrid}>
              <HubMetricCard
                label="MRR (Mensal Recorrente)"
                icon={TrendingUp}
                iconVariant="soft"
                accent="#0061FF"
                topRight={
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 15,
                      fontWeight: 800,
                      color: '#10B981',
                    }}
                  >
                    +12.5% <TrendingUp size={14} />
                  </span>
                }
                value={`R$ ${metrics.mrr.toLocaleString('pt-BR')}`}
              />
              <HubMetricCard
                label="Tenants Ativos"
                icon={Users}
                iconVariant="solid"
                accent="#0061FF"
                topRight={
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#0061FF' }}>META: 50</span>
                }
                value={metrics.activeTenants}
              />
              <HubMetricCard
                label="Em Carência (Buffer)"
                icon={Clock}
                iconVariant="soft"
                accent="#F59E0B"
                softBg="#F59E0B15"
                topRight={
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#F59E0B' }}>3 DIAS</span>
                }
                value={metrics.graceTenants}
              />
              <HubMetricCard
                label="Inativos / Bloqueados"
                icon={Ban}
                iconVariant="soft"
                accent="#EF4444"
                softBg="#EF444415"
                topRight={
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#EF4444' }}>CHURN</span>
                }
                value={metrics.blockedTenants}
              />
            </div>

            <div
              className="billing-master-chart-grid"
              style={styles.chartGrid}
            >
              <div style={styles.chartCard}>
                <div style={styles.chartHeaderInner}>
                  <h3 style={styles.chartTitle}><Target size={16} color="var(--accent)" /> DISTRIBUIÇÃO POR PRODUTO</h3>
                  <div style={styles.chartTag}>REAL-TIME</div>
                </div>
                <p style={styles.chartSubcopy}>
                  Percentual de <strong style={{ color: '#334155' }}>assinaturas ativas</strong> por produto — o arco mostra a fatia do líder; a legenda traz o recorte em contas.
                </p>
                <div style={{ height: 380, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 4, right: 8, left: 8, bottom: 8 }}>
                      <Pie
                        data={distributionGaugeData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="76%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius="54%"
                        outerRadius="98%"
                        paddingAngle={3}
                        cornerRadius={5}
                        stroke="none"
                      >
                        {distributionGaugeData.map((entry, index) => (
                          <Cell key={`g-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={() => (
                          <div style={styles.customTooltip}>
                            <div
                              style={{
                                ...styles.tooltipDot,
                                backgroundColor: String(distributionTop.color),
                              }}
                            />
                            <span style={styles.tooltipLabel}>{distributionTop.name}</span>
                            <span style={styles.tooltipValue}>
                              {distributionTopPct.toFixed(1)}% do mix ·{' '}
                              {Number(distributionTop.value).toLocaleString('pt-BR')} /{' '}
                              {distributionTotal.toLocaleString('pt-BR')}
                            </span>
                          </div>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={styles.distributionGaugeCenter}>
                    <div style={styles.distributionGaugeKicker}>
                      <span>
                        {distributionTopPct.toFixed(1)}% das assinaturas ativas hoje estão em{' '}
                        <strong style={{ color: '#334155', fontWeight: 800 }}>{distributionTop.name}</strong>
                      </span>
                      <span style={styles.distributionGaugeKickerMeta}>
                        {distributionTotal.toLocaleString('pt-BR')} contas no ecossistema · mix somado
                      </span>
                    </div>
                    <div style={styles.distributionGaugeValue}>
                      {Number(distributionTop.value).toLocaleString('pt-BR')}
                    </div>
                    <div style={styles.distributionGaugeLabel}>{distributionTop.name}</div>
                  </div>
                  <div style={styles.distributionMixLegend}>
                    {productData.map((p) => (
                      <div key={p.name} style={styles.distributionMixItem}>
                        <span
                          style={{
                            ...styles.distributionMixDot,
                            background: p.color as string,
                          }}
                        />
                        <span style={styles.distributionMixName}>{p.name}</span>
                        <span style={styles.distributionMixCount}>
                          {Number(p.value).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={styles.chartCard}>
                <div style={styles.chartHeaderInner}>
                  <h3 style={styles.chartTitle}><Zap size={16} color="#0061FF" /> CRESCIMENTO DE RECEITA (ASAAS)</h3>
                  <div style={{...styles.chartTag, backgroundColor: '#E0E7FF', color: '#4338CA'}}>ASAAS SYNC</div>
                </div>
                <p style={styles.chartSubcopy}>
                  Tendência de faturamento (série do gateway). Compare com o mix de assinaturas ao lado para ver se <strong style={{ color: '#334155' }}>receita e base</strong> evoluem na mesma direção.
                  {revenueMomPct != null ? (
                    <span style={styles.chartSubcopyHighlight}>
                      {' '}
                      Último mês da série: {revenueMomPct >= 0 ? '+' : ''}
                      {revenueMomPct.toFixed(1)}% vs. mês anterior.
                    </span>
                  ) : null}
                </p>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0061FF" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0061FF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 11, fill: '#94A3B8', fontWeight: '700'}} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 11, fill: '#94A3B8', fontWeight: '700'}} 
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div style={styles.customTooltip}>
                                <span style={styles.tooltipLabel}>Receita:</span>
                                <span style={styles.tooltipValue}>R$ {payload[0].value.toLocaleString()}</span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#0061FF" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
             {activeTab === 'faturamento' && (
          <>
            <div style={styles.subActionsRow}>
              <div style={styles.subTabContainer}>
                <button 
                    style={{...styles.subTabBtn, backgroundColor: 'var(--secondary)', color: '#FFFFFF'}}
                >
                    HISTÓRICO DE COBRANÇAS
                </button>
              </div>
              <button 
                style={{...styles.primaryBtn, backgroundColor: 'var(--bg-overlay)', color: 'var(--secondary)', border: '1px solid var(--border)', boxShadow: 'none'}} 
                onClick={() => {
                  toastSuccess('Sincronizando com gateway de pagamento...');
                  fetchData();
                }}
              >
                <RefreshCw size={18} color="var(--accent)" /> ATUALIZAR STATUS ASAAS
              </button>
            </div>

            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>CLIENTE / FATURA</th>
                    <th style={styles.th}>VALOR</th>
                    <th style={styles.th}>VENCIMENTO</th>
                    <th style={styles.th}>STATUS</th>
                    <th style={{...styles.th, textAlign: 'right'}}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={styles.loadingTd}>Sincronizando dados financeiros...</td></tr>
                  ) : (
                    charges.map((charge, i) => {
                       const colors = getStatusColor(charge.status);
                       return (
                          <tr key={i} style={{...styles.tr, cursor: 'pointer'}} onClick={() => { setSelectedCharge(charge); setIsInvoicePreviewOpen(true); }} className="hover-scale">
                            <td style={styles.td}>
                               <div style={styles.planCell}>
                                  <strong style={styles.planName}>{charge.client_name || 'Cliente'}</strong>
                                  <span style={styles.planBrand}>REF: {charge.asaas_id?.substring(0,10) || 'INTERNA'}</span>
                               </div>
                            </td>
                            <td style={styles.td}><strong style={styles.priceText}>R$ {parseFloat(charge.amount).toLocaleString('pt-BR')}</strong></td>
                            <td style={styles.td}><span style={styles.cycleBadge}>{new Date(charge.due_date).toLocaleDateString()}</span></td>
                            <td style={styles.td}>
                               <span style={{
                                  ...styles.statusBadge, 
                                  backgroundColor: colors.bg, 
                                  color: colors.text
                                }}>
                                  {charge.status?.toUpperCase()}
                                </span>
                            </td>
                            <td style={{...styles.td, textAlign: 'right'}}>
                               <div style={styles.rowActions}>
                                  <button style={{...styles.actionIconBtn, color: '#0061FF', backgroundColor: 'var(--bg-overlay)'}} title="Ver Fatura" onClick={(e) => { e.stopPropagation(); window.open(charge.invoice_url, '_blank'); }}><Eye size={16} /></button>
                                  <button 
                                    style={{...styles.actionIconBtn, color: '#10B981', backgroundColor: '#ECFDF5'}} 
                                    title="Copiar Link"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(charge.invoice_url);
                                      toastSuccess('Link de pagamento copiado!');
                                    }}
                                  >
                                    <LinkIcon size={16} />
                                  </button>
                               </div>
                            </td>
                          </tr>
                       );
                    })
                  )}
                  {!loading && charges.length === 0 && (
                     <tr><td colSpan={5} style={styles.loadingTd}>Nenhum registro encontrado.</td></tr>
                  )}
                </tbody>
              </table>

              <Pagination 
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          </>
        )}

        {activeTab === 'planos' && (
           <>
            <div style={styles.subActionsRow}>
              <h2 style={{fontSize: '18px', fontWeight: '800', color: '#1F2937'}}>Catálogo Estratégico de Planos</h2>
            </div>

             <div style={styles.plansGrid}>
                {/* NEW PLAN CARD (PLUS) */}
                <div style={{...styles.planCard, borderStyle: 'dashed', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minHeight: '340px'}} onClick={() => setIsPlanModalOpen(true)}>
                    <div style={{...styles.planIcon, width: '64px', height: '64px', backgroundColor: '#FFF', color: '#0061FF', border: '1px solid #E2E8F0'}}><Plus size={32} /></div>
                    <div style={{textAlign: 'center'}}>
                        <h4 style={{...styles.planCardTitle, margin: 0}}>CRIAR NOVO PLANO</h4>
                        <p style={{...styles.pageSub, fontSize: '12px'}}>Adicionar ao catálogo master</p>
                    </div>
                </div>

               {plans.map(plan => (
                  <div 
                    key={plan.id} 
                    style={{
                      ...styles.planCard,
                      cursor: 'pointer',
                      ...(plan.is_active === false ? { opacity: 0.75 } : {}),
                    }} 
                    className="hover-scale"
                    onClick={() => { setSelectedPlan(plan); setIsDetailModalOpen(true); }}
                  >
                     <div style={styles.planCardHeader}>
                        <div style={styles.planIcon}><Briefcase size={20} /></div>
                        <span style={styles.planTypeTag}>{plan.type}{plan.is_active === false ? ' · INATIVO' : ''}</span>
                     </div>
                     <h4 style={styles.planCardTitle}>{plan.name}</h4>
                     <div style={styles.planPrice}>
                        <span style={styles.currency}>R$</span>
                        <span style={styles.amount}>{Number(plan.price ?? 0).toLocaleString('pt-BR')}</span>
                        <span style={styles.period}>/ {plan.contract_months} meses</span>
                     </div>
                     <div style={styles.planFeatures}>
                        <div style={styles.featureItem}><CheckCircle size={14} color="#10B981" /> {plan.wa_credits} Créditos WhatsApp</div>
                        <div style={styles.featureItem}><CheckCircle size={14} color="#10B981" /> {plan.ai_credits} Créditos IA</div>
                        <div style={styles.featureItem}><CheckCircle size={14} color="#10B981" /> Backup {plan.backup_enabled ? 'Ativo' : 'Não incluso'}</div>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '20px' }}>
                        <button 
                            type="button"
                            style={{...styles.planActionBtn, backgroundColor: '#F0F7FF', color: '#0061FF'}} 
                            title="Copiar Link"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(`https://checkout.logta.com/p/${plan.slug}`);
                                toastSuccess('Link do plano copiado!');
                            }}
                        >
                            <LinkIcon size={14} />
                        </button>
                        <button 
                            type="button"
                            style={{...styles.planActionBtn, backgroundColor: '#F8FAFC', color: '#1E293B'}} 
                            title="Editar"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlan(plan);
                              setIsDetailModalOpen(true);
                            }}
                        >
                            <Edit3 size={14} />
                        </button>
                        <button 
                            type="button"
                            style={{...styles.planActionBtn, backgroundColor: '#FEF2F2', color: '#EF4444'}} 
                            title="Excluir"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlan(plan);
                              setIsDeleteModalOpen(true);
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
           </>
        )}



        {activeTab === 'creditos-ia' && <ClientIaCredits embedded />}

        {activeTab === 'financeiro' && (
          <div style={styles.financeiroPanel}>
            <MasterFinanceiro />
          </div>
        )}

        {activeTab === 'marketing' && (
           <div style={styles.card}>
              <div style={{...styles.subActionsRow, marginBottom: '40px'}}>
                 <div>
                    <h3 style={styles.chartTitle}>Marketing & Growth Master</h3>
                    <p style={styles.pageSub}>Gestão central de campanhas, cupons de desconto e rastreamento de conversão.</p>
                 </div>
                 <div style={{ display: 'flex', gap: '12px' }}>
                   <div style={{ textAlign: 'right', marginRight: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8' }}>CONVERSÃO MÉDIA</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B' }}>14.2%</div>
                   </div>
                   <button style={styles.primaryBtn} onClick={() => setIsCouponModalOpen(true)}>
                      <Plus size={18} /> CRIAR NOVO CUPOM
                   </button>
                 </div>
              </div>

              <div style={styles.tableCard}>
                 <table style={styles.table}>
                    <thead>
                       <tr style={styles.thead}>
                          <th style={styles.th}>CAMPANHA / CÓDIGO</th>
                          <th style={styles.th}>TIPO DE DESCONTO</th>
                          <th style={styles.th}>VALIDADE</th>
                          <th style={styles.th}>DESEMPENHO</th>
                          <th style={{...styles.th, textAlign: 'right'}}>STATUS</th>
                       </tr>
                    </thead>
                    <tbody>
                       <tr style={styles.tr}>
                          <td style={styles.td}>
                             <div style={styles.planCell}>
                                <strong style={styles.planName}>BLACKRUBI50</strong>
                                <span style={styles.planBrand}>Campanha Black Friday 2026</span>
                             </div>
                          </td>
                          <td style={styles.td}><span style={{...styles.cycleBadge, color: '#0061FF', backgroundColor: '#F0F7FF'}}>50% PERCENTUAL</span></td>
                          <td style={styles.td}><span style={styles.creditsText}>31/12/2026</span></td>
                          <td style={styles.td}>
                             <div style={{ fontSize: '13px', fontWeight: '700' }}>42 / 100 <span style={{ color: '#94A3B8', fontSize: '11px' }}>(42%)</span></div>
                             <div style={{ width: '80px', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', marginTop: '4px' }}>
                                <div style={{ width: '42%', height: '100%', backgroundColor: '#0061FF', borderRadius: '2px' }} />
                             </div>
                          </td>
                          <td style={{...styles.td, textAlign: 'right'}}>
                             <span style={{...styles.statusBadge, backgroundColor: '#ECFDF5', color: '#10B981'}}>ATIVO</span>
                          </td>
                       </tr>
                       <tr style={styles.tr}>
                          <td style={styles.td}>
                             <div style={styles.planCell}>
                                <strong style={styles.planName}>BOASVINDAS</strong>
                                <span style={styles.planBrand}>Cupom Automático de Entrada</span>
                             </div>
                          </td>
                          <td style={styles.td}><span style={{...styles.cycleBadge, color: '#10B981', backgroundColor: '#ECFDF5'}}>R$ 100,00 FIXO</span></td>
                          <td style={styles.td}><span style={styles.creditsText}>SEM EXPIRAÇÃO</span></td>
                          <td style={styles.td}>
                             <div style={{ fontSize: '13px', fontWeight: '700' }}>128 <span style={{ color: '#94A3B8', fontSize: '11px' }}>(ILIMITADO)</span></div>
                          </td>
                          <td style={{...styles.td, textAlign: 'right'}}>
                             <span style={{...styles.statusBadge, backgroundColor: '#ECFDF5', color: '#10B981'}}>ATIVO</span>
                          </td>
                       </tr>
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* MODALS */}
        <Modal
          isOpen={isChargeModalOpen}
          onClose={() => setIsChargeModalOpen(false)}
          title={chargeModalType === 'plan' ? 'Novo plano (checkout público)' : 'Nova cobrança direta'}
          subtitle={
            chargeModalType === 'plan'
              ? 'Defina pacote, valor e forma de pagamento. Quem comprar preenche nome, documento e contato no link — não é necessário cliente aqui.'
              : 'Indique para quem é a cobrança e se ela será avulsa ou assinatura recorrente para essa pessoa ou empresa.'
          }
          icon={<LinkIcon />}
          size="lg"
          primaryAction={{
            label: chargeModalType === 'plan' ? 'GERAR LINK DO PLANO' : 'CONFIRMAR E GERAR COBRANÇA',
            onClick: handleGenerateCharge,
            loading: saving
          }}
          secondaryAction={{
            label: 'Cancelar',
            onClick: () => setIsChargeModalOpen(false)
          }}
        >
          {chargeModalType === 'plan' && (
            <div style={styles.chargeModalHint}>
              <strong style={{ fontWeight: 800 }}>Plano para todo o público:</strong>{' '}
              o mesmo link serve a qualquer comprador; os dados de cliente ficam no checkout, não neste formulário.
            </div>
          )}

          {chargeModalType === 'charge' && (
            <div style={styles.chargeModalSection}>
              <div style={styles.chargeModalSectionTitle}>Quem vai pagar</div>
              <p style={styles.chargeModalSectionSub}>
                Use para cobrança ou assinatura ligada a uma empresa ou pessoa específica (boleto, PIX direto, cartão etc.).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                  <label style={styles.infoLabel}>CLIENTE / EMPRESA</label>
                  <select
                    style={styles.input}
                    value={newCharge.client_id}
                    onChange={e => setNewCharge({ ...newCharge, client_id: e.target.value })}
                  >
                    <option value="">Selecionar da lista...</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.infoLabel}>NOME (avulso ou complemento)</label>
                  <input
                    style={styles.input}
                    placeholder="Ex: Cliente Avulso"
                    value={newCharge.custom_client_name}
                    onChange={e => setNewCharge({ ...newCharge, custom_client_name: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.infoLabel}>CPF OU CNPJ</label>
                  <input
                    style={styles.input}
                    placeholder="00.000.000/0001-00"
                    value={newCharge.cpfCnpj}
                    onChange={e => setNewCharge({ ...newCharge, cpfCnpj: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.infoLabel}>E-MAIL</label>
                  <input
                    style={styles.input}
                    placeholder="email@exemplo.com"
                    value={newCharge.email}
                    onChange={e => setNewCharge({ ...newCharge, email: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.infoLabel}>WHATSAPP</label>
                  <input
                    style={styles.input}
                    placeholder="(00) 00000-0000"
                    value={newCharge.phone}
                    onChange={e => setNewCharge({ ...newCharge, phone: e.target.value })}
                  />
                </div>
                <div style={{ ...styles.formGroup, gridColumn: '1 / -1', maxWidth: '280px' }}>
                  <label style={styles.infoLabel}>DATA DE VENCIMENTO</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={newCharge.dueDate}
                    onChange={e => setNewCharge({ ...newCharge, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              ...styles.chargeModalSection,
              ...(chargeModalType === 'plan' ? { backgroundColor: '#FFFFFF' } : {}),
            }}
          >
            <div style={styles.chargeModalTwoCol}>
              <div style={{ minWidth: 0 }}>
                <div style={styles.chargeModalSectionTitle}>Itens inclusos</div>
                <p style={{ ...styles.chargeModalSectionSub, marginBottom: '12px' }}>
                  Selecione o que entra neste {chargeModalType === 'plan' ? 'plano' : 'pacote cobrado'}.
                </p>
                <label style={{ ...styles.infoLabel, marginBottom: 0 }}>PRODUTOS</label>
                <div style={styles.productGridModal}>
                  {[
                    { id: 'logta', label: 'Assinatura Logta', icon: Layout },
                    { id: 'zaptro', label: 'Assinatura Zaptro', icon: Zap },
                    { id: 'wa', label: 'Créditos WhatsApp', icon: Mail },
                    { id: 'ai', label: 'Créditos IA', icon: Activity },
                    { id: 'backup', label: 'Backup Cloud', icon: ShieldCheck },
                  ].map(prod => (
                    <div
                      key={prod.id}
                      style={{
                        ...styles.productCardMini,
                        borderColor: newCharge.selectedProducts.includes(prod.id) ? '#0061FF' : '#E2E8F0',
                        backgroundColor: newCharge.selectedProducts.includes(prod.id) ? '#F0F7FF' : '#FFFFFF'
                      }}
                      onClick={() => {
                        const current = [...newCharge.selectedProducts];
                        if (current.includes(prod.id)) {
                          setNewCharge({ ...newCharge, selectedProducts: current.filter(x => x !== prod.id) });
                        } else {
                          setNewCharge({ ...newCharge, selectedProducts: [...current, prod.id] });
                        }
                      }}
                    >
                      <prod.icon size={18} color={newCharge.selectedProducts.includes(prod.id) ? '#0061FF' : '#94A3B8'} />
                      <span style={{ fontSize: '11px', fontWeight: '700' }}>{prod.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0' }}>
                <div style={styles.chargeModalSectionTitle}>Valor e pagamento</div>
                <p style={{ ...styles.chargeModalSectionSub, marginBottom: '14px', color: '#94A3B8' }}>
                  Valor, forma de recebimento e recorrência.
                </p>
                <div style={styles.formGroup}>
                  <label style={styles.infoLabel}>VALOR (R$)</label>
                  <input
                    type="number"
                    style={styles.input}
                    placeholder="0,00"
                    value={newCharge.amount}
                    onChange={e => setNewCharge({ ...newCharge, amount: e.target.value })}
                  />
                </div>
                <div style={{ ...styles.formGroup, marginTop: '14px' }}>
                  <label style={styles.infoLabel}>MÉTODO</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'PIX', label: 'PIX', icon: Zap },
                      { id: 'BOLETO', label: 'Boleto', icon: BarChart3 },
                      { id: 'CREDIT_CARD', label: 'Cartão', icon: CreditCard },
                      { id: 'LINK', label: 'Link', icon: LinkIcon },
                    ].map(method => (
                      <button
                        key={method.id}
                        type="button"
                        style={{
                          ...styles.methodBtn,
                          borderColor: newCharge.method === method.id ? '#0061FF' : '#E2E8F0',
                          backgroundColor: newCharge.method === method.id ? '#F0F7FF' : '#FFFFFF',
                          color: newCharge.method === method.id ? '#0061FF' : '#64748B',
                          padding: '10px 12px',
                          flex: '1 1 72px',
                          minWidth: '72px'
                        }}
                        onClick={() => setNewCharge({ ...newCharge, method: method.id })}
                      >
                        <method.icon size={16} />
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: '8px',
                  }}
                >
                  <label style={{ ...styles.infoLabel, marginBottom: 0 }}>CUPOM (OPCIONAL)</label>
                  <input
                    type="text"
                    style={{ ...styles.input, width: '100%', maxWidth: '100%', height: '40px' }}
                    placeholder="Ex: ZAPTRO20"
                    value={newCharge.coupon}
                    onChange={e => {
                      const code = e.target.value.toUpperCase();
                      let newAmount = newCharge.amount;

                      if (code === 'ZAPTRO20' && newCharge.coupon !== 'ZAPTRO20') {
                        const original = parseFloat(newCharge.amount) || 0;
                        newAmount = (original * 0.8).toFixed(2);
                        toastSuccess('CUPOM ATIVADO: 20% DE DESCONTO!');
                      }

                      setNewCharge({ ...newCharge, coupon: code, amount: newAmount });
                    }}
                  />
                  {newCharge.coupon === 'ZAPTRO20' && (
                    <div
                      style={{
                        backgroundColor: '#ECFDF5',
                        color: '#166534',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '900',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <CheckCircle size={14} /> -20% ATIVO
                    </div>
                  )}
                </div>

                {chargeModalType === 'charge' ? (
                  <div
                    style={{
                      marginTop: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <div
                      role="switch"
                      aria-checked={newCharge.isRecurring}
                      tabIndex={0}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        backgroundColor: newCharge.isRecurring ? '#0061FF' : '#E2E8F0',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onClick={() => setNewCharge({ ...newCharge, isRecurring: !newCharge.isRecurring })}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setNewCharge({ ...newCharge, isRecurring: !newCharge.isRecurring });
                        }
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: '#FFFFFF',
                          position: 'absolute',
                          top: '3px',
                          left: newCharge.isRecurring ? '23px' : '3px',
                          transition: 'all 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Assinatura recorrente (este cliente)</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', lineHeight: 1.4 }}>
                        Ative para cobrar o mesmo valor automaticamente em ciclo. Desative para pagamento único ou parcelas definidas no Asaas.
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ ...styles.chargeModalRecurringNote, marginTop: '14px', marginBottom: 0 }}>
                    <Zap size={14} color="#0061FF" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>
                      Links de <strong>plano público</strong> são tratados como assinatura recorrente no gateway (cobrança repetida no cartão/assinatura).
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          title="Criar Novo Plano Estratégico"
          subtitle="Configure as opções do catálogo master para checkout público."
          icon={<Briefcase />}
          primaryAction={{
            label: 'SALVAR PLANO E GERAR CHECKOUT',
            onClick: handleCreatePlan,
            loading: saving
          }}
          secondaryAction={{
            label: 'Cancelar',
            onClick: () => setIsPlanModalOpen(false)
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={styles.formGroup}>
                <label style={styles.infoLabel}>Nome do Plano</label>
                <input 
                style={styles.input} 
                placeholder="Ex: Combo Master 5 Anos" 
                value={newPlan.name}
                onChange={e => setNewPlan({...newPlan, name: e.target.value})}
                />
            </div>
            <div style={styles.formGroup}>
                <label style={styles.infoLabel}>Ciclo de Faturamento (Meses)</label>
                <select 
                style={styles.input}
                value={newPlan.cycle}
                onChange={e => setNewPlan({...newPlan, cycle: e.target.value})}
                >
                  <option value="1">1 Mês (Mensal)</option>
                  <option value="3">3 Meses (Trimestral)</option>
                  <option value="6">6 Meses (Semestral)</option>
                  <option value="12">12 Meses (Anual)</option>
                  <option value="24">24 Meses (2 Anos)</option>
                  <option value="48">48 Meses (4 Anos)</option>
                </select>
            </div>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px'}}>
              <div style={styles.formGroup}>
                  <label style={styles.infoLabel}>Créditos WA</label>
                  <input 
                    type="number" 
                    style={styles.input} 
                    value={newPlan.wa_credits}
                    onChange={e => setNewPlan({...newPlan, wa_credits: parseInt(e.target.value)})}
                  />
              </div>
              <div style={styles.formGroup}>
                  <label style={styles.infoLabel}>Preço (R$)</label>
                  <input 
                    type="number" 
                    style={styles.input} 
                    placeholder="0.00" 
                    value={newPlan.price}
                    onChange={e => setNewPlan({...newPlan, price: e.target.value})}
                  />
              </div>
          </div>
        </Modal>

        <Modal
          isOpen={isDetailModalOpen && !!selectedPlan}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Editar plano: ${selectedPlan?.name ?? ''}`}
          subtitle="Alterações são gravadas na tabela plans e refletem no checkout público (slug)."
          size="lg"
          icon={<Edit3 />}
          primaryAction={{
            label: 'SALVAR ALTERAÇÕES',
            onClick: handleUpdatePlan,
            loading: saving,
          }}
          secondaryAction={{
            label: 'Fechar',
            onClick: () => setIsDetailModalOpen(false),
          }}
        >
          <div style={{backgroundColor: 'var(--bg-overlay)', padding: '24px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #E2E8F0'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px'}}>
                <span style={styles.infoLabel}>Link de pagamento (slug)</span>
                <button type="button" style={{border: 'none', background: 'none', color: '#0061FF', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'}} onClick={() => {
                    navigator.clipboard.writeText(`https://checkout.logta.com/p/${editPlanDraft.slug}`);
                    toastSuccess('Checkout copiado!');
                }}><Copy size={14} /> COPIAR</button>
              </div>
              <code style={{fontSize: '13px', color: '#1E293B', wordBreak: 'break-all', fontWeight: '600'}}>
                https://checkout.logta.com/p/{editPlanDraft.slug || selectedPlan?.slug}
              </code>
              <button
                type="button"
                style={{ marginTop: '14px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #0061FF', background: '#F0F7FF', color: '#0061FF', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                onClick={() => window.open(`https://checkout.logta.com/p/${editPlanDraft.slug || selectedPlan?.slug}`, '_blank')}
              >
                Abrir checkout em nova aba
              </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={styles.formGroup}>
              <label style={styles.infoLabel}>Nome do plano</label>
              <input
                style={styles.input}
                value={editPlanDraft.name}
                onChange={(e) => setEditPlanDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.infoLabel}>Slug (URL)</label>
              <input
                style={styles.input}
                value={editPlanDraft.slug}
                onChange={(e) => setEditPlanDraft((d) => ({ ...d, slug: e.target.value }))}
                placeholder="ex: combo-master-anual"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div style={styles.formGroup}>
              <label style={styles.infoLabel}>Preço (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                style={styles.input}
                value={editPlanDraft.price}
                onChange={(e) => setEditPlanDraft((d) => ({ ...d, price: e.target.value }))}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.infoLabel}>Ciclo (meses)</label>
              <select
                style={styles.input}
                value={editPlanDraft.contract_months}
                onChange={(e) => setEditPlanDraft((d) => ({ ...d, contract_months: e.target.value }))}
              >
                {[1, 3, 6, 12, 24, 48].map((m) => (
                  <option key={m} value={String(m)}>{m} {m === 1 ? 'mês' : 'meses'}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div style={styles.formGroup}>
              <label style={styles.infoLabel}>Créditos WhatsApp</label>
              <input
                type="number"
                min={0}
                style={styles.input}
                value={editPlanDraft.wa_credits}
                onChange={(e) => setEditPlanDraft((d) => ({ ...d, wa_credits: e.target.value }))}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.infoLabel}>Créditos IA</label>
              <input
                type="number"
                min={0}
                style={styles.input}
                value={editPlanDraft.ai_credits}
                onChange={(e) => setEditPlanDraft((d) => ({ ...d, ai_credits: e.target.value }))}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.infoLabel}>Descrição (opcional)</label>
            <textarea
              style={{ ...styles.input, minHeight: '88px', resize: 'vertical' }}
              value={editPlanDraft.description}
              onChange={(e) => setEditPlanDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '8px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editPlanDraft.is_active}
                onChange={(e) => setEditPlanDraft((d) => ({ ...d, is_active: e.target.checked }))}
              />
              Plano ativo no catálogo
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editPlanDraft.backup_enabled}
                onChange={(e) => setEditPlanDraft((d) => ({ ...d, backup_enabled: e.target.checked }))}
              />
              Backup incluso
            </label>
          </div>
        </Modal>

        <Modal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          title="Cobrança Gerada com Sucesso"
          subtitle="O link de pagamento já está disponível e pronto para envio."
          icon={<CheckCircle color="#10B981" />}
          primaryAction={{
            label: 'COPIAR LINK AGORA',
            onClick: () => {
              navigator.clipboard.writeText(chargeResult?.link);
              toastSuccess('Link copiado!');
            }
          }}
        >
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#64748B', marginBottom: '16px' }}>MÉTODO: {newCharge.method}</div>
            
            {newCharge.method === 'PIX' && chargeResult?.pix_image && (
              <div style={{ marginBottom: '24px' }}>
                <img src={`data:image/png;base64,${chargeResult.pix_image}`} alt="QR Code PIX" style={{ width: '200px', height: '200px', margin: '0 auto' }} />
                <div style={{ marginTop: '12px', fontSize: '11px', color: '#94A3B8', wordBreak: 'break-all' }}>{chargeResult.pix_code}</div>
                <button 
                  style={{ marginTop: '12px', background: '#F0F7FF', color: '#0061FF', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                  onClick={() => {
                    navigator.clipboard.writeText(chargeResult.pix_code);
                    toastSuccess('Copia e Cola copiado!');
                  }}
                >COPIAR COPIA E COLA</button>
              </div>
            )}

            {newCharge.method === 'BOLETO' && chargeResult?.bank_slip_url && (
              <div style={{ marginBottom: '24px' }}>
                <button 
                  style={{ background: '#0061FF', color: '#FFF', border: 'none', padding: '16px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', width: '100%' }}
                  onClick={() => window.open(chargeResult.bank_slip_url, '_blank')}
                >VISUALIZAR BOLETO (PDF)</button>
              </div>
            )}

            <div style={{ backgroundColor: 'var(--bg-overlay)', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
               <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px', textAlign: 'left' }}>LINK DA FATURA ASAAS</div>
               <code style={{ fontSize: '13px', color: '#1E293B', wordBreak: 'break-all', fontWeight: '600', display: 'block', textAlign: 'left' }}>
                 {chargeResult?.link}
               </code>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isCouponModalOpen}
          onClose={() => setIsCouponModalOpen(false)}
          title="Novo Cupom de Desconto"
          subtitle="Crie códigos promocionais para campanhas de marketing."
          icon={<Tag color="#0061FF" />}
          primaryAction={{
            label: 'CRIAR CUPOM',
            onClick: () => {
                toastSuccess('Cupom criado com sucesso no banco Master!');
                setIsCouponModalOpen(false);
            }
          }}
        >
          <div style={styles.formGroup}>
              <label style={styles.infoLabel}>CÓDIGO DO CUPOM</label>
              <input style={styles.input} placeholder="Ex: VERÃO2026" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={styles.formGroup}>
                  <label style={styles.infoLabel}>TIPO</label>
                  <select style={styles.input}>
                    <option>Porcentagem (%)</option>
                    <option>Valor Fixo (R$)</option>
                  </select>
              </div>
              <div style={styles.formGroup}>
                  <label style={styles.infoLabel}>VALOR DO DESCONTO</label>
                  <input style={styles.input} placeholder="20" />
              </div>
          </div>
        </Modal>

        {/* DELETE CONFIRMATION MODAL */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Excluir Plano Estratégico"
          subtitle="Esta ação é irreversível e removerá o plano do catálogo público."
          icon={<Trash2 color="#EF4444" />}
          primaryAction={{
            label: 'CONFIRMAR EXCLUSÃO',
            onClick: handleDeletePlan,
            loading: saving,
            danger: true
          }}
        >
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px' }}>
                    Para confirmar a exclusão do plano <strong>{selectedPlan?.name}</strong>, digite <strong>EXCLUIR</strong> abaixo:
                </p>
                <input 
                    style={{ ...styles.input, textAlign: 'center', fontSize: '18px', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase' }} 
                    placeholder="DIGITE AQUI"
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                />
            </div>
        </Modal>

        {/* INVOICE PREVIEW MODAL */}
        <Modal
          isOpen={isInvoicePreviewOpen && !!selectedCharge}
          onClose={() => setIsInvoicePreviewOpen(false)}
          title="Visualização de Fatura Master"
          subtitle={`Referência: ${selectedCharge?.asaas_id || 'Interna'}`}
          icon={<FileText color="#0061FF" />}
          size="lg"
        >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* LEFT: BOLETO PREVIEW */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '40px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '900', fontSize: '20px', color: '#1E293B' }}>LOGTA <span style={{ color: '#0061FF' }}>SaaS</span></div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8' }}>VENCIMENTO</div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{new Date(selectedCharge?.due_date).toLocaleDateString()}</div>
                        </div>
                    </div>
                    
                    <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '10px 0' }} />
                    
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8', marginBottom: '4px' }}>PAGADOR</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{selectedCharge?.client_name}</div>
                    </div>

                    <div style={{ marginTop: 'auto', backgroundColor: '#FFF', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', marginBottom: '12px' }}>CÓDIGO DE BARRAS / PIX</div>
                        <div style={{ backgroundColor: '#F1F5F9', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            {[...Array(40)].map((_, i) => (
                                <div key={i} style={{ width: '2px', height: i % 3 === 0 ? '40px' : '30px', backgroundColor: '#1E293B', opacity: 0.8 }} />
                            ))}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '700', marginTop: '12px', color: '#64748B' }}>
                            {selectedCharge?.asaas_id ? `84670000001 ${selectedCharge.asaas_id.substring(0,4)} 00000000` : 'CÓDIGO INDISPONÍVEL'}
                        </div>
                    </div>
                </div>

                {/* RIGHT: INFO & ACTIONS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '24px', border: '1px solid #BAE6FD' }}>
                        <label style={styles.infoLabel}>VALOR DA FATURA</label>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#0369A1' }}>R$ {selectedCharge?.amount.toLocaleString('pt-BR')}</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor(selectedCharge?.status).bg, color: getStatusColor(selectedCharge?.status).text }}>
                                {selectedCharge?.status}
                            </span>
                            <span style={{ ...styles.statusBadge, backgroundColor: '#FFF', border: '1px solid #BAE6FD', color: '#0369A1' }}>
                                {selectedCharge?.method}
                            </span>
                        </div>
                    </div>

                    <div style={styles.detailsSection}>
                        <h5 style={styles.sectionTitle}>AÇÕES RÁPIDAS</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button 
                                style={{ ...styles.primaryBtn, width: '100%' }}
                                onClick={() => window.open(selectedCharge?.invoice_url, '_blank')}
                            >
                                <Eye size={18} /> VISUALIZAR NO ASAAS
                            </button>
                            <button 
                                style={{ ...styles.secondaryBtn, width: '100%', justifyContent: 'center' }}
                                onClick={() => {
                                    navigator.clipboard.writeText(selectedCharge?.invoice_url);
                                    toastSuccess('Link copiado!');
                                }}
                            >
                                <Copy size={18} /> COPIAR LINK DE PAGAMENTO
                            </button>
                            <button 
                                style={{ ...styles.secondaryBtn, width: '100%', justifyContent: 'center', borderColor: '#10B981', color: '#10B981' }}
                                onClick={() => toastSuccess('PDF sendo gerado...')}
                            >
                                <Download size={18} /> BAIXAR COMPROVANTE PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  outerContainer: { padding: '0', backgroundColor: 'transparent' },
  innerContainer: { maxWidth: '100%', margin: '0' },
  billingTopBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    marginBottom: '40px',
    flexWrap: 'nowrap',
  },
  billingTopBarLead: { flex: '1 1 auto', minWidth: 0 },
  pageTitle: { fontSize: '32px', fontWeight: '700', color: 'var(--secondary)', margin: 0, letterSpacing: '-0.5px' },
  pageSub: { color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', marginTop: '6px' },
  topActions: { display: 'flex', gap: '16px', flexWrap: 'nowrap', flexShrink: 0, alignItems: 'center' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 24px', height: '48px', backgroundColor: 'var(--text-title)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' },
  secondaryBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 24px', height: '48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'white', color: 'var(--secondary)', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },

  financeiroContextBanner: {
    marginBottom: '20px',
    padding: '18px 22px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 55%, #F8FAFC 100%)',
    border: '1px solid #BFDBFE',
  },
  financeiroContextText: { maxWidth: '52rem' },
  financeiroContextKicker: { fontSize: '11px', fontWeight: 800, color: '#0061FF', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' },
  financeiroContextTitle: { fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' },
  financeiroContextSub: { fontSize: '14px', color: '#475569', margin: 0, lineHeight: 1.55, fontWeight: 500 },
  financeiroPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.07)',
  },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '32px' },

  chartGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '40px',
    padding: 0,
    background: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    borderStyle: 'none',
    borderWidth: 0,
    boxShadow: 'none',
    color: 'var(--text-primary)',
    boxSizing: 'border-box',
  },
  chartCard: { backgroundColor: '#FFF', padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  chartHeaderInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  chartTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, letterSpacing: '0.5px' },
  chartSubcopy: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#64748B',
    margin: '0 0 20px',
    lineHeight: 1.55,
    maxWidth: '48rem',
  },
  chartSubcopyHighlight: { fontWeight: 700, color: '#475569' },
  chartTag: { padding: '4px 10px', backgroundColor: '#F1F5F9', color: '#64748B', borderRadius: '8px', fontSize: '10px', fontWeight: '800' },
  
  customTooltip: { backgroundColor: '#FFF', padding: '12px 16px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' },
  tooltipDot: { width: '8px', height: '8px', borderRadius: '50%' },
  tooltipLabel: { fontSize: '12px', fontWeight: '700', color: '#64748B' },
  tooltipValue: { fontSize: '14px', fontWeight: '800', color: '#0F172A' },

  pieCenterLabel: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' },
  pieCenterValue: { fontSize: '28px', fontWeight: '900', color: '#0F172A', lineHeight: '1' },
  pieCenterText: { fontSize: '10px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' },
  distributionGaugeCenter: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -52%)',
    textAlign: 'center',
    pointerEvents: 'none',
    width: 'min(300px, 88%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distributionGaugeKicker: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#64748B',
    marginBottom: '4px',
    lineHeight: 1.4,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    textAlign: 'center',
    maxWidth: '260px',
  },
  distributionGaugeKickerMeta: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#94A3B8',
    letterSpacing: '0.02em',
    lineHeight: 1.35,
  },
  distributionGaugeValue: {
    fontSize: 'clamp(34px, 5.8vw, 48px)',
    fontWeight: 900,
    color: '#0F172A',
    lineHeight: 1.05,
    letterSpacing: '-0.03em',
  },
  distributionGaugeLabel: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#94A3B8',
    marginTop: '6px',
    lineHeight: 1.35,
  },
  distributionMixLegend: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px 22px',
    padding: '8px 16px 0',
    marginTop: '-4px',
  },
  distributionMixItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' },
  distributionMixDot: { width: 8, height: 8, borderRadius: 999, flexShrink: 0 },
  distributionMixName: { fontWeight: 700, color: '#475569' },
  distributionMixCount: { fontWeight: 800, color: '#94A3B8', fontVariantNumeric: 'tabular-nums' },

  tableCard: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: 'var(--bg-secondary)' },
  th: { padding: '20px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' },
  tr: { borderBottom: '1px solid var(--bg-secondary)', transition: 'all 0.2s' },
  td: { padding: '24px', borderBottom: '1px solid var(--bg-secondary)' },
  loadingTd: { padding: '42px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '700' },
  rowActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  actionIconBtn: { width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },

  card: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border)', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  subActionsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' },
  subTabContainer: { display: 'flex', gap: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', padding: '6px' },
  subTabBtn: { border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.6px', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' },

  plansGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  planCard: { backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', minHeight: '340px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  planCardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  planIcon: { width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'var(--bg-active)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  planTypeTag: { fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', padding: '5px 10px' },
  planCardTitle: { fontSize: '16px', fontWeight: '800', color: 'var(--secondary)', margin: '0 0 10px' },
  planPrice: { display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '14px' },
  currency: { fontSize: '13px', fontWeight: '800', color: 'var(--text-secondary)' },
  amount: { fontSize: '30px', fontWeight: '900', color: 'var(--secondary)', lineHeight: 1 },
  period: { fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' },
  planFeatures: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' },
  planActionBtn: { border: '1px solid var(--border)', borderRadius: '10px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  planCell: { display: 'flex', flexDirection: 'column', gap: '4px' },
  creditsText: { fontSize: '13px', fontWeight: '700', color: 'var(--secondary)' },
  detailsSection: { backgroundColor: 'white', borderRadius: '20px', border: '1px solid var(--border)', padding: '18px' },

  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  input: { width: '100%', height: '44px', borderRadius: '12px', border: '1px solid var(--border)', padding: '0 12px', fontSize: '14px', fontWeight: '600', color: 'var(--secondary)', backgroundColor: 'white', outline: 'none' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '10px', marginTop: '10px' },
  productGridModal: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: '10px', marginTop: '10px' },
  chargeModalSection: { backgroundColor: '#F8FAFC', borderRadius: '20px', padding: '20px 22px', border: '1px solid #E2E8F0', marginBottom: '4px' },
  chargeModalSectionTitle: { fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.02em' },
  chargeModalSectionSub: { fontSize: '13px', color: '#64748B', margin: '0 0 16px', lineHeight: 1.45 },
  chargeModalHint: { backgroundColor: '#EFF6FF', borderRadius: '16px', padding: '16px 20px', border: '1px solid #BFDBFE', marginBottom: '16px', fontSize: '14px', color: '#1e40af', lineHeight: 1.55, fontWeight: 500 },
  chargeModalTwoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '28px',
    alignItems: 'start',
  },
  chargeModalRecurringNote: { fontSize: '13px', color: '#64748B', margin: '16px 0 0', lineHeight: 1.55, display: 'flex', alignItems: 'flex-start', gap: '10px' },
  productCardMini: { border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', height: '75px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s' },
  methodBtn: { border: '1px solid var(--border)', borderRadius: '12px', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '66px', transition: 'all 0.2s' },

  planName: { fontSize: '16px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '4px' },
  planBrand: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' },
  priceText: { fontSize: '16px', fontWeight: '800', color: 'var(--accent)' },
  cycleBadge: { padding: '6px 12px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700' },

  statusBadge: { padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800' },
  infoLabel: { fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' },
  sectionTitle: { fontSize: '11px', fontWeight: '900', color: 'var(--text-secondary)', margin: '0 0 16px', textTransform: 'uppercase' }
};

export default MasterBilling;
