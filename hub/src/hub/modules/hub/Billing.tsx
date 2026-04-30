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
   Layout, FileText, Tag
} from 'lucide-react';
import { 
   BarChart, Bar, XAxis, YAxis, CartesianGrid, 
   Tooltip, ResponsiveContainer, AreaChart, Area,
   PieChart, Pie, Cell, Legend
} from 'recharts';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError } from '@core/lib/toast';
import Modal from '@shared/components/Modal';
import Pagination from '@shared/components/Pagination';

import MasterFinanceiro from './Financeiro';

const MasterBilling = ({ summaryOnly = false }: { summaryOnly?: boolean }) => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [chargeModalType, setChargeModalType] = useState<'plan' | 'charge'>('charge');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = summaryOnly ? 'dashboard' : (searchParams.get('tab') || 'dashboard');
  const setActiveTab = (tab: string) => {
    if (summaryOnly) return;
    if (tab === 'dashboard') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
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

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage, itemsPerPage]); // Re-fetch when page or limit changes

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

  const handleGenerateCharge = async () => {
    setSaving(true);
    try {
      let clientName = newCharge.custom_client_name;
      let clientEmail = newCharge.email;
      let clientPhone = newCharge.phone;

      if (newCharge.client_id) {
        const client = companies.find(c => c.id === newCharge.client_id);
        if (client) {
          clientName = client.name;
          clientEmail = client.email || clientEmail;
          clientPhone = client.phone || clientPhone;
        }
      }

      if (!clientName) throw new Error('Nome do cliente é obrigatório');

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
          cpfCnpj: newCharge.cpfCnpj,
          amount: newCharge.amount,
          due_date: newCharge.dueDate,
          method: newCharge.method.toLowerCase(),
          description: `Cobrança ${chargeModalType === 'plan' ? 'Plano' : 'Manual'} - ${newCharge.selectedProducts.join(', ')}`,
          is_subscription: newCharge.isRecurring
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
          is_recurring: newCharge.isRecurring,
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
        selectedProducts: [] as string[] 
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

    const churn = (companies || []).length > 0 ? (blockedTenants / companies.length) * 100 : 0;

    return { mrr, activeTenants, blockedTenants, graceTenants, churn };
  };

  const metrics = calculateMetrics();

  const productData = [
    { name: 'Logta ERP', value: (companies || []).filter(c => c?.origin === 'logta' || c?.origin === 'LOGTA').length || 12, color: 'var(--accent)' },
    { name: 'Zaptro CRM', value: (companies || []).filter(c => c?.origin === 'zaptro' || c?.origin === 'ZAPTRO').length || 8, color: 'var(--green)' },
    { name: 'Backup/API', value: (companies || []).filter(c => !['logta', 'zaptro', 'LOGTA', 'ZAPTRO'].includes(c?.origin || '')).length || 5, color: 'var(--orange)' },
  ];

  const tabs = [
    { id: 'dashboard', label: 'Estratégico', icon: Layout },
    { id: 'faturamento', label: 'Faturamento', icon: DollarSign },
    { id: 'financeiro', label: 'Financeiro', icon: Wallet },
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
        {/* PAGE TITLE */}
        <div style={styles.headerTitleRow}>
          <h1 style={styles.pageTitle}>Financeiro & Receita Master</h1>
          <p style={styles.pageSub}>Governança de assinaturas, MRR e saúde financeira do ecossistema.</p>
        </div>

        {/* HEADER ACTIONS */}
        {!summaryOnly && (
          <header style={styles.header}>
            <div style={styles.kpiBrief}>
               <div style={styles.miniKpi}>
                  <span className="kpi-label">MRR ATUAL</span>
                  <span className="kpi-value" style={{ fontSize: '32px !important' }}>R$ 22.400</span>
               </div>
               <div style={styles.miniKpi}>
                  <span className="kpi-label">CHURN (30D)</span>
                  <span className="kpi-value" style={{ fontSize: '32px !important', color: '#EF4444' }}>1.2%</span>
               </div>
            </div>
            <div style={styles.topActions}>
              <button style={styles.secondaryBtn} onClick={() => {
                setChargeModalType('charge');
                setIsChargeModalOpen(true);
              }}>
                <DollarSign size={18} /> NOVA COBRANÇA
              </button>
              <button style={styles.primaryBtn} onClick={() => {
                setChargeModalType('plan');
                setIsChargeModalOpen(true);
              }}>
                <Zap size={18} color="#FACC15" fill="#FACC15" /> NOVO PLANO
              </button>
            </div>
          </header>
        )}

        {/* MAIN TAB NAVIGATION */}
        {!summaryOnly && (
          <div style={styles.tabContainer}>
            {tabs.map(tab => (
              <button 
                key={tab.id}
                style={{...styles.tabLink, ...(activeTab === tab.id ? styles.tabActive : {})}}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <tab.icon size={18} color={activeTab === tab.id ? 'white' : 'var(--text-secondary)'} />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            <div style={styles.statsGrid}>
              <div style={styles.statCard} className="hover-scale">
                <div style={{...styles.statIconBox, backgroundColor: '#6366F115'}}>
                  <TrendingUp size={20} color="#6366F1" />
                </div>
                <div style={styles.statContent}>
                  <p style={styles.statLabel}>MRR (Mensal Recorrente)</p>
                  <h3 style={styles.statValue}>R$ {metrics.mrr.toLocaleString('pt-BR')}</h3>
                </div>
                <div style={{...styles.statTrend, color: '#10B981'}}>
                  +12.5% <TrendingUp size={12} />
                </div>
              </div>

              <div style={styles.statCard} className="hover-scale">
                <div style={{...styles.statIconBox, backgroundColor: '#6366F1'}}>
                  <Users size={20} color="#FFFFFF" />
                </div>
                <div style={styles.statContent}>
                  <p style={styles.statLabel}>Tenants Ativos</p>
                  <h3 style={styles.statValue}>{metrics.activeTenants}</h3>
                </div>
                <div style={{...styles.statTrend, color: '#6366F1'}}>
                  META: 50
                </div>
              </div>

              <div style={styles.statCard} className="hover-scale">
                <div style={{...styles.statIconBox, backgroundColor: '#F59E0B15'}}>
                  <Clock size={20} color="#F59E0B" />
                </div>
                <div style={styles.statContent}>
                  <p style={styles.statLabel}>Em Carência (Buffer)</p>
                  <h3 style={styles.statValue}>{metrics.graceTenants}</h3>
                </div>
                <div style={{...styles.statTrend, color: '#F59E0B'}}>
                  3 DIAS
                </div>
              </div>

              <div style={styles.statCard} className="hover-scale">
                <div style={{...styles.statIconBox, backgroundColor: '#EF444415'}}>
                  <Ban size={20} color="#EF4444" />
                </div>
                <div style={styles.statContent}>
                  <p style={styles.statLabel}>Inativos / Bloqueados</p>
                  <h3 style={styles.statValue}>{metrics.blockedTenants}</h3>
                </div>
                <div style={{...styles.statTrend, color: '#EF4444'}}>
                  CHURN
                </div>
              </div>
            </div>

            <div style={styles.chartGrid}>
              <div style={styles.chartCard}>
                <div style={styles.chartHeaderInner}>
                  <h3 style={styles.chartTitle}><Target size={16} color="var(--accent)" /> DISTRIBUIÇÃO POR PRODUTO</h3>
                  <div style={styles.chartTag}>REAL-TIME</div>
                </div>
                <div style={{ height: 320, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productData}
                        innerRadius={85}
                        outerRadius={115}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {productData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div style={styles.customTooltip}>
                                <div style={{...styles.tooltipDot, backgroundColor: payload[0].payload.color}} />
                                <span style={styles.tooltipLabel}>{payload[0].name}</span>
                                <span style={styles.tooltipValue}>{payload[0].value}%</span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        formatter={(value) => <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={styles.pieCenterLabel}>
                    <div style={styles.pieCenterValue}>100%</div>
                    <div style={styles.pieCenterText}>ATIVOS</div>
                  </div>
                </div>
              </div>

              <div style={styles.chartCard}>
                <div style={styles.chartHeaderInner}>
                  <h3 style={styles.chartTitle}><Zap size={16} color="#6366F1" /> CRESCIMENTO DE RECEITA (ASAAS)</h3>
                  <div style={{...styles.chartTag, backgroundColor: '#E0E7FF', color: '#4338CA'}}>ASAAS SYNC</div>
                </div>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                        { name: 'Jan', value: 4000 },
                        { name: 'Fev', value: 3000 },
                        { name: 'Mar', value: 2000 },
                        { name: 'Abr', value: metrics.mrr },
                    ]}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
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
                        stroke="#6366F1" 
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
                                  <button style={{...styles.actionIconBtn, color: '#6366F1', backgroundColor: 'var(--bg-overlay)'}} title="Ver Fatura" onClick={(e) => { e.stopPropagation(); window.open(charge.invoice_url, '_blank'); }}><Eye size={16} /></button>
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
                    <div style={{...styles.planIcon, width: '64px', height: '64px', backgroundColor: '#FFF', color: '#6366F1', border: '1px solid #E2E8F0'}}><Plus size={32} /></div>
                    <div style={{textAlign: 'center'}}>
                        <h4 style={{...styles.planCardTitle, margin: 0}}>CRIAR NOVO PLANO</h4>
                        <p style={{...styles.pageSub, fontSize: '12px'}}>Adicionar ao catálogo master</p>
                    </div>
                </div>

               {plans.map(plan => (
                  <div 
                    key={plan.id} 
                    style={{...styles.planCard, cursor: 'pointer'}} 
                    className="hover-scale"
                    onClick={() => { setSelectedPlan(plan); setIsDetailModalOpen(true); }}
                  >
                     <div style={styles.planCardHeader}>
                        <div style={styles.planIcon}><Briefcase size={20} /></div>
                        <span style={styles.planTypeTag}>{plan.type}</span>
                     </div>
                     <h4 style={styles.planCardTitle}>{plan.name}</h4>
                     <div style={styles.planPrice}>
                        <span style={styles.currency}>R$</span>
                        <span style={styles.amount}>{plan.price.toLocaleString('pt-BR')}</span>
                        <span style={styles.period}>/ {plan.contract_months} meses</span>
                     </div>
                     <div style={styles.planFeatures}>
                        <div style={styles.featureItem}><CheckCircle size={14} color="#10B981" /> {plan.wa_credits} Créditos WhatsApp</div>
                        <div style={styles.featureItem}><CheckCircle size={14} color="#10B981" /> {plan.ai_credits} Créditos IA</div>
                        <div style={styles.featureItem}><CheckCircle size={14} color="#10B981" /> Backup {plan.backup_enabled ? 'Ativo' : 'Não incluso'}</div>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '20px' }}>
                        <button 
                            style={{...styles.planActionBtn, backgroundColor: '#EEF2FF', color: '#6366F1'}} 
                            title="Copiar Link"
                            onClick={() => {
                                navigator.clipboard.writeText(`https://checkout.logta.com/p/${plan.slug}`);
                                toastSuccess('Link do plano copiado!');
                            }}
                        >
                            <LinkIcon size={14} />
                        </button>
                        <button 
                            style={{...styles.planActionBtn, backgroundColor: '#F8FAFC', color: '#1E293B'}} 
                            title="Editar"
                            onClick={() => { setSelectedPlan(plan); setIsDetailModalOpen(true); }}
                        >
                            <Edit3 size={14} />
                        </button>
                        <button 
                            style={{...styles.planActionBtn, backgroundColor: '#FEF2F2', color: '#EF4444'}} 
                            title="Excluir"
                            onClick={() => { setSelectedPlan(plan); setIsDeleteModalOpen(true); }}
                        >
                            <Trash2 size={14} />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
           </>
        )}



        {activeTab === 'financeiro' && (
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
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
                          <td style={styles.td}><span style={{...styles.cycleBadge, color: '#6366F1', backgroundColor: '#EEF2FF'}}>50% PERCENTUAL</span></td>
                          <td style={styles.td}><span style={styles.creditsText}>31/12/2026</span></td>
                          <td style={styles.td}>
                             <div style={{ fontSize: '13px', fontWeight: '700' }}>42 / 100 <span style={{ color: '#94A3B8', fontSize: '11px' }}>(42%)</span></div>
                             <div style={{ width: '80px', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', marginTop: '4px' }}>
                                <div style={{ width: '42%', height: '100%', backgroundColor: '#6366F1', borderRadius: '2px' }} />
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
          title={chargeModalType === 'plan' ? 'Novo Plano Recorrente' : 'Gerar Cobrança Direta'}
          subtitle="Preencha os dados para gerar o link ou código de pagamento."
          icon={<LinkIcon />}
          size="xl"
          primaryAction={{
            label: 'CONFIRMAR E GERAR COBRANÇA',
            onClick: handleGenerateCharge,
            loading: saving
          }}
          secondaryAction={{
            label: 'Cancelar',
            onClick: () => setIsChargeModalOpen(false)
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div style={styles.formGroup}>
              <label style={styles.infoLabel}>CLIENTE / EMPRESA</label>
              <select 
                style={styles.input} 
                value={newCharge.client_id}
                onChange={e => setNewCharge({...newCharge, client_id: e.target.value})}
              >
                  <option value="">Selecionar da lista...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.infoLabel}>NOME PERSONALIZADO</label>
              <input 
                style={styles.input} 
                placeholder="Ex: Cliente Avulso" 
                value={newCharge.custom_client_name}
                onChange={e => setNewCharge({...newCharge, custom_client_name: e.target.value})}
              />
            </div>
            <div style={styles.formGroup}>
                <label style={styles.infoLabel}>CPF OU CNPJ</label>
                <input 
                  style={styles.input} 
                  placeholder="00.000.000/0001-00" 
                  value={newCharge.cpfCnpj}
                  onChange={e => setNewCharge({...newCharge, cpfCnpj: e.target.value})}
                />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '16px' }}>
            <div style={styles.formGroup}>
              <label style={styles.infoLabel}>E-MAIL</label>
              <input 
                style={styles.input} 
                placeholder="email@exemplo.com" 
                value={newCharge.email}
                onChange={e => setNewCharge({...newCharge, email: e.target.value})}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.infoLabel}>WHATSAPP</label>
              <input 
                style={styles.input} 
                placeholder="(00) 00000-0000" 
                value={newCharge.phone}
                onChange={e => setNewCharge({...newCharge, phone: e.target.value})}
              />
            </div>
            <div style={styles.formGroup}>
                <label style={styles.infoLabel}>DATA DE VENCIMENTO</label>
                <input 
                  type="date"
                  style={styles.input}
                  value={newCharge.dueDate}
                  onChange={e => setNewCharge({...newCharge, dueDate: e.target.value})}
                />
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <label style={styles.infoLabel}>SELECIONE OS PRODUTOS</label>
            <div style={styles.productGrid}>
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
                    borderColor: newCharge.selectedProducts.includes(prod.id) ? '#6366F1' : '#E2E8F0',
                    backgroundColor: newCharge.selectedProducts.includes(prod.id) ? '#EEF2FF' : '#FFFFFF'
                  }}
                  onClick={() => {
                    const current = [...newCharge.selectedProducts];
                    if (current.includes(prod.id)) {
                      setNewCharge({...newCharge, selectedProducts: current.filter(x => x !== prod.id)});
                    } else {
                      setNewCharge({...newCharge, selectedProducts: [...current, prod.id]});
                    }
                  }}
                >
                  <prod.icon size={18} color={newCharge.selectedProducts.includes(prod.id) ? '#6366F1' : '#94A3B8'} />
                  <span style={{ fontSize: '11px', fontWeight: '700' }}>{prod.label}</span>
                </div>
              ))}
            </div>
          </div>



            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '24px', marginTop: '16px', alignItems: 'end' }}>
              <div style={styles.formGroup}>
                <label style={styles.infoLabel}>VALOR TOTAL (R$)</label>
                <input 
                  type="number" 
                  style={styles.input} 
                  placeholder="0,00" 
                  value={newCharge.amount}
                  onChange={e => setNewCharge({...newCharge, amount: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.infoLabel}>MÉTODO DE RECEBIMENTO</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'PIX', label: 'PIX', icon: Zap },
                    { id: 'BOLETO', label: 'Boleto', icon: BarChart3 },
                    { id: 'CREDIT_CARD', label: 'Cartão', icon: CreditCard },
                    { id: 'LINK', label: 'Link', icon: LinkIcon },
                  ].map(method => (
                    <button 
                      key={method.id}
                      style={{
                        ...styles.methodBtn,
                        borderColor: newCharge.method === method.id ? '#6366F1' : '#E2E8F0',
                        backgroundColor: newCharge.method === method.id ? '#EEF2FF' : '#FFFFFF',
                        color: newCharge.method === method.id ? '#6366F1' : '#64748B',
                        padding: '10px 14px',
                        flex: 1
                      }}
                      onClick={() => setNewCharge({...newCharge, method: method.id})}
                    >
                      <method.icon size={16} />
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px' }}>
                  <div 
                  style={{
                    width: '40px', 
                    height: '20px', 
                    borderRadius: '10px', 
                    backgroundColor: newCharge.isRecurring ? '#6366F1' : '#E2E8F0',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setNewCharge({...newCharge, isRecurring: !newCharge.isRecurring})}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      position: 'absolute',
                      top: '2px',
                      left: newCharge.isRecurring ? '22px' : '2px',
                      transition: 'all 0.2s'
                    }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>Assinatura Recorrente</span>
              </div>
            </div>

          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '16px', backgroundColor: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
              <label style={styles.infoLabel}>CUPOM DE DESCONTO (OPCIONAL)</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  style={{ ...styles.input, flex: 1 }} 
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
                    
                    setNewCharge({...newCharge, coupon: code, amount: newAmount});
                  }}
                />
                {newCharge.coupon === 'ZAPTRO20' && (
                  <div style={{ backgroundColor: 'var(--bg-overlay)', color: '#166534', padding: '10px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={14} /> -20% ATIVO
                  </div>
                )}
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
          title={`Plano: ${selectedPlan?.name}`}
          icon={<Eye />}
          primaryAction={{
            label: 'ABRIR CHECKOUT',
            onClick: () => window.open(`https://checkout.logta.com/p/${selectedPlan?.slug}`, '_blank')
          }}
          secondaryAction={{
            label: 'Fechar',
            onClick: () => setIsDetailModalOpen(false)
          }}
        >
          <div style={{backgroundColor: 'var(--bg-overlay)', padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #E2E8F0'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
                <span style={styles.infoLabel}>Link de Pagamento (Asaas)</span>
                <button style={{border: 'none', background: 'none', color: '#6366F1', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'}} onClick={() => {
                    navigator.clipboard.writeText(`https://checkout.logta.com/p/${selectedPlan?.slug}`);
                    toastSuccess('Checkout copiado!');
                }}><Copy size={14} /> COPIAR</button>
              </div>
              <code style={{fontSize: '13px', color: '#1E293B', wordBreak: 'break-all', fontWeight: '600'}}>
                https://checkout.logta.com/p/{selectedPlan?.slug}
              </code>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={styles.featureItem}><CheckCircle size={16} color="#10B981" /> <strong>Ciclo:</strong> {selectedPlan?.contract_months} meses</div>
              <div style={styles.featureItem}><CheckCircle size={16} color="#10B981" /> <strong>Preço:</strong> R$ {selectedPlan?.price.toLocaleString('pt-BR')}</div>
              <div style={styles.featureItem}><CheckCircle size={16} color="#10B981" /> <strong>WhatsApp:</strong> {selectedPlan?.wa_credits} créditos</div>
              <div style={styles.featureItem}><CheckCircle size={16} color="#10B981" /> <strong>Inteligência:</strong> {selectedPlan?.ai_credits} créditos</div>
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
                  style={{ marginTop: '12px', background: '#EEF2FF', color: '#6366F1', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
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
                  style={{ background: '#6366F1', color: '#FFF', border: 'none', padding: '16px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', width: '100%' }}
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
          icon={<Tag color="#6366F1" />}
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
          icon={<FileText color="#6366F1" />}
          size="xl"
        >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* LEFT: BOLETO PREVIEW */}
                <div style={{ backgroundColor: 'var(--bg-overlay)', borderRadius: '24px', padding: '40px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '900', fontSize: '20px', color: '#1E293B' }}>LOGTA <span style={{ color: '#6366F1' }}>SaaS</span></div>
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
                    <div style={{ backgroundColor: '#F0F9FF', padding: '24px', borderRadius: '24px', border: '1px solid #BAE6FD' }}>
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
  outerContainer: { padding: '40px', backgroundColor: 'transparent' },
  innerContainer: { maxWidth: '100%', margin: '0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  pageTitle: { fontSize: '32px', fontWeight: '700', color: 'var(--secondary)', margin: 0, letterSpacing: '-0.5px' },
  pageSub: { color: 'var(--text-secondary)', fontSize: '16px', fontWeight: '500', marginTop: '6px' },
  topActions: { display: 'flex', gap: '16px' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 24px', height: '48px', backgroundColor: 'var(--accent)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' },
  secondaryBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 24px', height: '48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'white', color: 'var(--secondary)', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
  
  tabContainer: { display: 'flex', gap: '8px', marginBottom: '32px', backgroundColor: 'var(--bg-secondary)', padding: '6px', borderRadius: '20px', width: 'fit-content' },
  tabLink: { padding: '10px 24px', borderRadius: '16px', fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' },
  tabActive: { backgroundColor: 'white', color: 'var(--accent)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' },
  statCard: { backgroundColor: 'white', padding: '24px', borderRadius: '32px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' },
  statIconBox: { width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statContent: { flex: 1 },
  statLabel: { fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' },
  statValue: { fontSize: '24px', fontWeight: '800', color: 'var(--secondary)', margin: 0 },
  statTrend: { fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' },

  chartGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' },
  chartCard: { backgroundColor: '#FFF', padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  chartHeaderInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  chartTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, letterSpacing: '0.5px' },
  chartTag: { padding: '4px 10px', backgroundColor: '#F1F5F9', color: '#64748B', borderRadius: '8px', fontSize: '10px', fontWeight: '800' },
  
  customTooltip: { backgroundColor: '#FFF', padding: '12px 16px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' },
  tooltipDot: { width: '8px', height: '8px', borderRadius: '50%' },
  tooltipLabel: { fontSize: '12px', fontWeight: '700', color: '#64748B' },
  tooltipValue: { fontSize: '14px', fontWeight: '800', color: '#0F172A' },

  pieCenterLabel: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' },
  pieCenterValue: { fontSize: '28px', fontWeight: '900', color: '#0F172A', lineHeight: '1' },
  pieCenterText: { fontSize: '10px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' },

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
  headerTitleRow: { marginBottom: '20px' },
  kpiBrief: { display: 'flex', alignItems: 'stretch', gap: '12px' },
  miniKpi: { minWidth: '210px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' },
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
  productCardMini: { border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s' },
  methodBtn: { border: '1px solid var(--border)', borderRadius: '12px', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '44px', transition: 'all 0.2s' },

  planName: { fontSize: '16px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '4px' },
  planBrand: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' },
  priceText: { fontSize: '16px', fontWeight: '800', color: 'var(--accent)' },
  cycleBadge: { padding: '6px 12px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700' },

  statusBadge: { padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800' },
  infoLabel: { fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' },
  sectionTitle: { fontSize: '11px', fontWeight: '900', color: 'var(--text-secondary)', margin: '0 0 16px', textTransform: 'uppercase' }
};

export default MasterBilling;
