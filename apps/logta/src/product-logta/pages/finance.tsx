import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Plus, Search, Download, Edit2, MoreVertical,
  Layers, Clock, BarChart3, Activity,
  Target, Calculator as CalcIcon, FileText,
  CreditCard, RefreshCw, AlertTriangle, Zap, Check, CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/Modal';
import MetricCard from '../../components/MetricCard';
import { useAuth } from '../../context/AuthContext';
import ModuleLayout from '../../layouts/ModuleLayout';
import LogtaModal from '../../components/Modal';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '../../lib/toast';
import EmptyState from '../../components/EmptyState';
import FinanceCalculator from '../../components/FinanceCalculator';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  due_date: string;
  category?: string;
  created_at?: string;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const Finance: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '', amount: '', type: 'INCOME' as 'INCOME' | 'EXPENSE',
    status: 'PENDING' as 'PENDING' | 'PAID' | 'OVERDUE',
    due_date: '', category: ''
  });

  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/fluxo')) return 'fluxo';
    if (path.includes('/areceber')) return 'areceber';
    if (path.includes('/apagar')) return 'apagar';
    if (path.includes('/faturamento')) return 'faturamento';
    if (path.includes('/relatorios')) return 'relatorios';
    if (path.includes('/inteligencia')) return 'inteligencia';
    return 'dashboard';
  }, [location.pathname]);

  const navItems = [
    { id: 'inteligencia', label: 'Centro de Inteligência', icon: Target },
    { id: 'fluxo', label: 'Fluxo de Caixa', icon: RefreshCw },
    { id: 'dashboard', label: 'Resumo Financeiro', icon: BarChart3 },
    { id: 'areceber', label: 'Contas a Receber', icon: ArrowUpRight },
    { id: 'apagar', label: 'Contas a Pagar', icon: ArrowDownRight },
    { id: 'faturamento', label: 'Faturamento', icon: DollarSign },
    { id: 'relatorios', label: 'Relatórios & DRE', icon: Activity },
  ];

  const onTabChange = (id: string) => {
    navigate(`/financeiro/${id}`);
  };

  const fetchTransactions = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });
      setTransactions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [profile?.company_id]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [transactions, searchTerm, filterStatus]);

  const kpis = useMemo(() => {
    const income = transactions.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((a, t) => a + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((a, t) => a + t.amount, 0);
    const pending = transactions.filter(t => t.status === 'PENDING').reduce((a, t) => a + t.amount, 0);
    const overdue = transactions.filter(t => t.status === 'OVERDUE').length;
    return { income, expense, pending, overdue, balance: income - expense };
  }, [transactions]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    const tid = toastLoading('Salvando lançamento...');
    try {
      const { error } = await supabase.from('transactions').insert([{
        company_id: profile.company_id,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount) || 0,
        type: newTransaction.type,
        status: newTransaction.status,
        due_date: newTransaction.due_date || null,
        category: newTransaction.category,
      }]);
      if (error) throw error;
      toastDismiss(tid);
      toastSuccess('Lançamento criado com sucesso!');
      setIsAddModalOpen(false);
      setNewTransaction({ description: '', amount: '', type: 'INCOME', status: 'PENDING', due_date: '', category: '' });
      fetchTransactions();
    } catch (err: any) {
      toastDismiss(tid);
      toastError(`Erro: ${err.message}`);
    }
  };

  const chartData = [
    { name: 'Jan', receita: 12000, despesa: 8000 },
    { name: 'Fev', receita: 15000, despesa: 9500 },
    { name: 'Mar', receita: 13500, despesa: 7800 },
    { name: 'Abr', receita: 18000, despesa: 11000 },
    { name: 'Mai', receita: 16500, despesa: 10200 },
    { name: 'Jun', receita: 21000, despesa: 12500 },
  ];

  const renderKPIs = () => (
    <div style={styles.kpiGrid}>
      <MetricCard 
        title="Saldo Disponível" 
        value={formatCurrency(kpis.balance)} 
        subtitle="Total em conta" 
        trend="+8.2%" 
        icon={CreditCard} 
        iconBg="#f5f3ff" 
        iconColor="#8b5cf6"
        sparkData={[380, 400, 390, 410, 430, 420, 450]}
      />
      <MetricCard 
        title="Receitas (Pagas)" 
        value={formatCurrency(kpis.income)} 
        subtitle="Entradas confirmadas" 
        trend="+12.5%" 
        icon={ArrowUpRight} 
        iconBg="#ecfdf5" 
        iconColor="#10b981"
        sparkData={[120, 140, 130, 150, 160, 155, 170]}
      />
      <MetricCard 
        title="Despesas (Pagas)" 
        value={formatCurrency(kpis.expense)} 
        subtitle="Saídas liquidadas" 
        trend="-3.1%" 
        trendNeg
        icon={ArrowDownRight} 
        iconBg="#fef2f2" 
        iconColor="#ef4444"
        sparkData={[80, 90, 85, 95, 90, 88, 92]}
      />
      <MetricCard 
        title="A Receber (Pendente)" 
        value={formatCurrency(kpis.pending)} 
        subtitle={`${kpis.overdue} vencidos`} 
        trend="Atenção" 
        icon={Clock} 
        iconBg="#fff7ed" 
        iconColor="#f59e0b"
        sparkData={[40, 45, 50, 48, 52, 55, 60]}
      />
    </div>
  );

  const renderFilterBar = () => (
    <div style={styles.filterBar}>
      <div style={styles.searchWrapper}>
        <Search size={16} style={styles.searchIcon} />
        <input
          type="text"
          placeholder="Filtrar por descrição..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div style={styles.filterActions}>
        <select style={styles.selectFilter} value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
          <option value="ALL">Todos os Status</option>
          <option value="PAID">Pago</option>
          <option value="PENDING">Pendente</option>
          <option value="OVERDUE">Atrasado</option>
        </select>
        <button style={styles.btnSecondary} title="Baixar PDF" onClick={() => toastSuccess('Exportando PDF...')}>
          <Download size={16} />
        </button>
        <button style={styles.btnSecondary} title="Baixar Excel" onClick={() => toastSuccess('Exportando Excel...')}>
          <FileText size={16} />
        </button>
        <button style={styles.btnPrimary} onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> Novo Lançamento
        </button>
      </div>
    </div>
  );

  const renderTable = (typeFilter?: 'INCOME' | 'EXPENSE') => {
    const data = filteredTransactions.filter(t => !typeFilter || t.type === typeFilter);
    return (
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Descrição</th>
              <th style={styles.th}>Categoria</th>
              <th style={styles.th}>Vencimento</th>
              <th style={styles.th}>Valor</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? data.map(t => (
              <tr key={t.id} style={styles.tr}>
                <td style={styles.td}>{t.description}</td>
                <td style={styles.td}>
                  <span style={styles.categoryBadge}>{t.category || '—'}</span>
                </td>
                <td style={styles.td}>
                  {t.due_date ? new Date(t.due_date).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td style={styles.td}>
                  <strong style={{ color: t.type === 'INCOME' ? '#10b981' : '#ef4444' }}>
                    {t.type === 'INCOME' ? '+' : (t.amount > 0 ? '-' : '')}{formatCurrency(t.amount)}
                  </strong>
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.statusTag,
                    backgroundColor: t.status === 'PAID' ? '#dcfce7' : t.status === 'OVERDUE' ? '#fee2e2' : '#fef9c3',
                    color: t.status === 'PAID' ? '#166534' : t.status === 'OVERDUE' ? '#991b1b' : '#854d0e'
                  }}>
                    {t.status === 'PAID' ? 'Pago' : t.status === 'OVERDUE' ? 'Atrasado' : 'Pendente'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button style={styles.iconBtn}><Edit2 size={14} /></button>
                  <button style={styles.iconBtn}><MoreVertical size={14} /></button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>
                  <Layers size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.2 }} />
                  <p style={{ fontWeight: '600', margin: 0 }}>Nenhum lançamento encontrado.</p>
                  <p style={{ fontSize: '13px', marginTop: '8px' }}>Clique em "Novo Lançamento" para começar.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDashboard = () => (
    <div style={styles.tabContent}>
      {renderKPIs()}
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h4 style={styles.chartTitle}>Fluxo de Caixa (6 meses)</h4>
            <button style={styles.refreshBtn} onClick={fetchTransactions}><RefreshCw size={14} /></button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} fill="url(#colorReceita)" name="Receita" />
              <Area type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={3} fill="url(#colorDespesa)" name="Despesa" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>Alertas Financeiros</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            {[
              { label: 'Contas vencendo hoje', value: '3', color: '#f59e0b', bg: '#fffbeb' },
              { label: 'Em atraso', value: String(kpis.overdue), color: '#ef4444', bg: '#fef2f2' },
              { label: 'Pagamentos (questa semana)', value: '7', color: '#10b981', bg: '#ecfdf5' },
              { label: 'Receitas previstas (30 dias)', value: formatCurrency(kpis.pending), color: '#7c3aed', bg: '#f5f3ff' },
            ].map((alert, i) => (
              <div key={i} style={{ ...styles.alertItem, backgroundColor: alert.bg }}>
                <div style={{ ...styles.alertDot, backgroundColor: alert.color }} />
                <span style={styles.alertLabel}>{alert.label}</span>
                <span style={{ ...styles.alertValue, color: alert.color }}>{alert.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {renderFilterBar()}
      {renderTable()}
    </div>
  );

  const renderAreceber = () => (
    <div style={styles.tabContent} className="animate-fade-in">
       {/* 🔝 1. KPIs DE RECEBIMENTO */}
       <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
             <p style={styles.kpiLabel}>Total a Receber</p>
             <h2 style={styles.kpiValue}>{formatCurrency(185400)}</h2>
             <span style={{fontSize: '11px', color: '#64748b', fontWeight: 800}}>Soma de todos os pendentes</span>
          </div>
          <div style={styles.kpiCard}>
             <p style={styles.kpiLabel}>Recebido (Mês)</p>
             <h2 style={{...styles.kpiValue, color: '#10b981'}}>{formatCurrency(98200)}</h2>
             <span style={{fontSize: '11px', color: '#10b981', fontWeight: 800}}>Meta: 82% atingida</span>
          </div>
          <div style={{...styles.kpiCard, border: '1px solid #fee2e2'}}>
             <p style={styles.kpiLabel}>Em Atraso 🔴</p>
             <h2 style={{...styles.kpiValue, color: '#ef4444'}}>{formatCurrency(15700)}</h2>
             <span style={{fontSize: '11px', color: '#ef4444', fontWeight: 800}}>Ação de cobrança necessária</span>
          </div>
          <div style={styles.kpiCard}>
             <p style={styles.kpiLabel}>Inadimplência</p>
             <h2 style={{...styles.kpiValue, color: '#f59e0b'}}>4.2%</h2>
             <span style={{fontSize: '11px', color: '#10b981', fontWeight: 800}}>-1.5% vs mês anterior</span>
          </div>
       </div>

       {/* 📋 2. LISTA E FILTROS */}
       <div style={styles.tableCard}>
          <div style={{padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
             <div style={{display: 'flex', gap: '16px'}}>
                <div style={styles.searchWrapper}>
                   <Search size={16} color="#94a3b8" />
                   <input type="text" placeholder="Buscar cliente ou nota..." style={styles.searchInput} />
                </div>
                <select style={styles.selectFilter}>
                   <option>Todos os Status</option>
                   <option>Pendente</option>
                   <option>Atrasado</option>
                </select>
             </div>
             <button style={styles.btnPrimary} onClick={() => setIsAddModalOpen(true)}>
                <Plus size={16} /> Nova Cobrança
             </button>
          </div>

          <table style={styles.table}>
             <thead>
                <tr>
                   <th style={styles.th}>Cliente / Favorecido</th>
                   <th style={styles.th}>Descrição</th>
                   <th style={styles.th}>Vencimento</th>
                   <th style={styles.th}>Valor</th>
                   <th style={styles.th}>Status</th>
                   <th style={styles.th}>Método</th>
                   <th style={styles.th}>Ações</th>
                </tr>
             </thead>
             <tbody>
                {[
                   { client: 'Transportes Translog Ltda', desc: 'Frete Operação Norte', date: '28/04/2026', val: 8500, status: 'PENDING', method: 'Boleto' },
                   { client: 'Logística Expressa S.A', desc: 'Serviços de Carga Fracionada', date: '21/04/2026', val: 12400, status: 'OVERDUE', method: 'PIX' },
                   { client: 'Mercado do Porto', desc: 'Entrega Urbana - Rota 04', date: '30/04/2026', val: 3200, status: 'PENDING', method: 'Cartão' },
                   { client: 'Construtora Silva', desc: 'Distribuição de Materiais', date: '25/04/2026', val: 15700, status: 'PAID', method: 'Boleto' },
                   { client: 'Agro Industrial Norte', desc: 'Frete Grãos - Safra 2026', date: '20/04/2026', val: 42000, status: 'OVERDUE', method: 'Transferência' },
                ].map((row, i) => (
                   <tr key={i} style={styles.tr}>
                      <td style={{...styles.td, fontWeight: 700}}>{row.client}</td>
                      <td style={styles.td}>{row.desc}</td>
                      <td style={styles.td}>{row.date}</td>
                      <td style={{...styles.td, fontWeight: 900, color: row.status === 'PAID' ? '#10b981' : '#0f172a'}}>
                         {formatCurrency(row.val)}
                      </td>
                      <td style={styles.td}>
                         <div style={{
                            ...styles.statusTag,
                            backgroundColor: row.status === 'PAID' ? '#ecfdf5' : row.status === 'OVERDUE' ? '#fef2f2' : '#fffbeb',
                            color: row.status === 'PAID' ? '#10b981' : row.status === 'OVERDUE' ? '#ef4444' : '#f59e0b',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                         }}>
                            {row.status === 'PAID' && <CheckCircle2 size={10} />}
                            {row.status === 'OVERDUE' && <AlertTriangle size={10} />}
                            {row.status === 'PENDING' && <Clock size={10} />}
                            {row.status === 'PAID' ? 'Pago' : row.status === 'OVERDUE' ? 'Atrasado' : 'Pendente'}
                         </div>
                      </td>
                      <td style={styles.td}>
                         <span style={styles.categoryBadge}>{row.method}</span>
                      </td>
                      <td style={styles.td}>
                         <div style={{display: 'flex', gap: '8px'}}>
                            {row.status !== 'PAID' && (
                               <button style={{...styles.iconBtn, backgroundColor: '#f0fdf4', color: '#16a34a'}} title="Dar Baixa (Pago)">
                                  <Check size={14} />
                               </button>
                            )}
                            <button style={styles.iconBtn}><Edit2 size={14} /></button>
                            <button style={styles.iconBtn}><Zap size={14} title="Cobrança Rápida" /></button>
                         </div>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>

       {/* 📊 7. ANÁLISE E SEGMENTAÇÃO */}
       <div style={styles.dashboardMainGrid}>
          <div style={styles.chartCard}>
             <h3 style={styles.chartTitle}>Ranking de Pagadores (Este Trimestre)</h3>
             <div style={{height: '240px'}}>
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={[
                      { name: 'Silva', val: 55000 },
                      { name: 'Translog', val: 45000 },
                      { name: 'Expressa', val: 38000 },
                      { name: 'Porto', val: 12000 },
                   ]} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                      <Tooltip />
                      <Bar dataKey="val" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
          
          <div style={styles.chartCard}>
             <h3 style={styles.chartTitle}>⚠️ Alertas de Cobrança</h3>
             <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div style={{padding: '16px', backgroundColor: '#fef2f2', borderRadius: '16px', borderLeft: '4px solid #ef4444'}}>
                   <p style={{margin: 0, fontSize: '13px', fontWeight: 900, color: '#ef4444'}}>Atraso Crítico: Agro Industrial</p>
                   <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#7f1d1d'}}>R$ 42.000 pendentes há 15 dias. Bloqueio de novas rotas sugerido.</p>
                </div>
                <div style={{padding: '16px', backgroundColor: '#fffbeb', borderRadius: '16px', borderLeft: '4px solid #f59e0b'}}>
                   <p style={{margin: 0, fontSize: '13px', fontWeight: 900, color: '#f59e0b'}}>Vencimento Próximo: Transportes Translog</p>
                   <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#92400e'}}>R$ 8.500 vencem amanhã. Enviar lembrete via WhatsApp?</p>
                </div>
                <button style={{width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: 'white', fontWeight: 800, fontSize: '12px', cursor: 'pointer'}}>VER TUDO</button>
             </div>
          </div>
       </div>
    </div>
  );

  const renderApagar = () => (
    <div style={styles.tabContent} className="animate-fade-in">
       {/* 🔝 1. KPIs DE DESPESAS */}
       <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
             <p style={styles.kpiLabel}>Total a Pagar</p>
             <h2 style={{...styles.kpiValue, color: '#ef4444'}}>{formatCurrency(94200)}</h2>
             <span style={{fontSize: '11px', color: '#64748b', fontWeight: 800}}>Soma das obrigações futuras</span>
          </div>
          <div style={styles.kpiCard}>
             <p style={styles.kpiLabel}>Pagas (Mês)</p>
             <h2 style={{...styles.kpiValue, color: '#10b981'}}>{formatCurrency(62800)}</h2>
             <span style={{fontSize: '11px', color: '#10b981', fontWeight: 800}}>Fluxo de saída controlado</span>
          </div>
          <div style={{...styles.kpiCard, border: '1px solid #fee2e2'}}>
             <p style={styles.kpiLabel}>Em Atraso 🔴</p>
             <h2 style={{...styles.kpiValue, color: '#ef4444'}}>{formatCurrency(4100)}</h2>
             <span style={{fontSize: '11px', color: '#ef4444', fontWeight: 800}}>2 fornecedores pendentes</span>
          </div>
          <div style={styles.kpiCard}>
             <p style={styles.kpiLabel}>Projeção de Saídas</p>
             <h2 style={{...styles.kpiValue, color: '#3b82f6'}}>{formatCurrency(115000)}</h2>
             <span style={{fontSize: '11px', color: '#3b82f6', fontWeight: 800}}>Próximos 30 dias</span>
          </div>
       </div>

       {/* 📋 2. LISTA E FILTROS */}
       <div style={styles.tableCard}>
          <div style={{padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
             <div style={{display: 'flex', gap: '16px'}}>
                <div style={styles.searchWrapper}>
                   <Search size={16} color="#94a3b8" />
                   <input type="text" placeholder="Buscar fornecedor..." style={styles.searchInput} />
                </div>
                <select style={styles.selectFilter}>
                   <option>Categorias: Todas</option>
                   <option>Combustível</option>
                   <option>Manutenção</option>
                   <option>Salários</option>
                </select>
             </div>
             <button style={styles.btnPrimary} onClick={() => setIsAddModalOpen(true)}>
                <Plus size={16} /> Nova Despesa
             </button>
          </div>

          <table style={styles.table}>
             <thead>
                <tr>
                   <th style={styles.th}>Fornecedor / Favorecido</th>
                   <th style={styles.th}>Descrição</th>
                   <th style={styles.th}>Categoria</th>
                   <th style={styles.th}>Vencimento</th>
                   <th style={styles.th}>Valor</th>
                   <th style={styles.th}>Status</th>
                   <th style={styles.th}>Ações</th>
                </tr>
             </thead>
             <tbody>
                {[
                   { prov: 'Posto Petrobras Matriz', desc: 'Abastecimento Frota Ativa', cat: 'Combustível', date: '25/04/2026', val: 18400, status: 'PENDING' },
                   { prov: 'Oficina Mecânica Central', desc: 'Retífica Cavalo 502', cat: 'Manutenção', date: '21/04/2026', val: 4100, status: 'OVERDUE' },
                   { prov: 'Telefônica Brasil S.A', desc: 'Plano de Internet Central', cat: 'Utilidades', date: '28/04/2026', val: 450, status: 'PAID' },
                   { prov: 'Seguradora Porto', desc: 'Parcela Seguro Frota (04/12)', cat: 'Seguros', date: '30/04/2026', val: 12800, status: 'PENDING' },
                   { prov: 'Folha de Pagamento', desc: 'Salários Motoristas - Ref. Abril', cat: 'RH', date: '05/05/2026', val: 56000, status: 'PENDING' },
                ].map((row, i) => (
                   <tr key={i} style={styles.tr}>
                      <td style={{...styles.td, fontWeight: 700}}>{row.prov}</td>
                      <td style={styles.td}>{row.desc}</td>
                      <td style={styles.td}><span style={styles.categoryBadge}>{row.cat}</span></td>
                      <td style={styles.td}>{row.date}</td>
                      <td style={{...styles.td, fontWeight: 900, color: row.status === 'OVERDUE' ? '#ef4444' : '#0f172a'}}>
                         {formatCurrency(row.val)}
                      </td>
                      <td style={styles.td}>
                         <div style={{
                            ...styles.statusTag,
                            backgroundColor: row.status === 'PAID' ? '#ecfdf5' : row.status === 'OVERDUE' ? '#fef2f2' : '#fffbeb',
                            color: row.status === 'PAID' ? '#10b981' : row.status === 'OVERDUE' ? '#ef4444' : '#f59e0b',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                         }}>
                            {row.status === 'PAID' ? 'Pago' : row.status === 'OVERDUE' ? 'Atrasado' : 'Pendente'}
                         </div>
                      </td>
                      <td style={styles.td}>
                         <div style={{display: 'flex', gap: '8px'}}>
                            {row.status !== 'PAID' && (
                               <button style={{...styles.iconBtn, backgroundColor: '#f0fdf4', color: '#16a34a'}} title="Pagar (Dar Baixa)">
                                  <Check size={14} />
                               </button>
                            )}
                            <button style={styles.iconBtn}><Edit2 size={14} /></button>
                            <button style={styles.iconBtn}><Layers size={14} title="Parcelar" /></button>
                         </div>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>

       {/* 📊 7. ANÁLISE DE CUSTOS E ALERTAS */}
       <div style={styles.dashboardMainGrid}>
          <div style={styles.chartCard}>
             <h3 style={styles.chartTitle}>Distribuição de Despesas (Mês Atual)</h3>
             <div style={{height: '240px'}}>
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                         data={[
                            { name: 'Combustível', value: 35 },
                            { name: 'Pessoas', value: 45 },
                            { name: 'Manutenção', value: 12 },
                            { name: 'Outros', value: 8 },
                         ]}
                         innerRadius={60}
                         outerRadius={85}
                         paddingAngle={5}
                         dataKey="value"
                      >
                         {['#ef4444', '#3b82f6', '#f59e0b', '#10b981'].map((c, i) => <Cell key={i} fill={c} />)}
                      </Pie>
                      <Tooltip />
                   </PieChart>
                </ResponsiveContainer>
             </div>
             <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '16px'}}>
                {['Combustível', 'Pessoas', 'Manutenção', 'Outros'].map((lbl, i) => (
                   <span key={i} style={{fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b'}}>
                      <div style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: ['#ef4444', '#3b82f6', '#f59e0b', '#10b981'][i]}} /> {lbl}
                   </span>
                ))}
             </div>
          </div>

          <div style={styles.chartCard}>
             <h3 style={styles.chartTitle}><AlertTriangle size={18} color="#ef4444" /> Atenção Operacional</h3>
             <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div style={{padding: '16px', backgroundColor: '#fef2f2', borderRadius: '16px', border: '1px solid #fee2e2'}}>
                   <p style={{margin: 0, fontSize: '13px', fontWeight: 900, color: '#ef4444'}}>Gasto de Diesel em Alerta</p>
                   <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#991b1b'}}>Sua média de gasto diário com combustível subiu 18% nesta semana. Verifique possíveis desvios ou rotas ineficientes.</p>
                </div>
                <div style={{padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '16px', border: '1px solid #d1fae5'}}>
                   <p style={{margin: 0, fontSize: '13px', fontWeight: 900, color: '#059669'}}>Potencial de Economia</p>
                   <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#065f46'}}>Se pagar a fatura do Seguro até dia 25, você garante 5% de desconto (Economia de R$ 640,00).</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderFluxo = () => (
    <div style={styles.tabContent} className="animate-fade-in">
       {/* 🔝 1. RESUMO RÁPIDO DO FLUXO */}
       <div style={styles.kpiGrid}>
          <div style={{...styles.kpiCard, borderBottom: '4px solid #10b981'}}>
             <p style={styles.kpiLabel}>Entradas (Mês)</p>
             <h2 style={styles.kpiValue}>{formatCurrency(125400)}</h2>
             <span style={{fontSize: '11px', color: '#10b981'}}>+ R$ 12k vs anterior</span>
          </div>
          <div style={{...styles.kpiCard, borderBottom: '4px solid #ef4444'}}>
             <p style={styles.kpiLabel}>Saídas (Mês)</p>
             <h2 style={{...styles.kpiValue, color: '#ef4444'}}>{formatCurrency(84200)}</h2>
             <span style={{fontSize: '11px', color: '#ef4444'}}>- R$ 5k vs anterior</span>
          </div>
          <div style={{...styles.kpiCard, borderBottom: '4px solid var(--primary)'}}>
             <p style={styles.kpiLabel}>SALDO ATUAL</p>
             <h2 style={{...styles.kpiValue, color: 'var(--primary)'}}>{formatCurrency(41200)}</h2>
             <span style={{fontSize: '11px', color: 'var(--primary)'}}>Caixa Disponível</span>
          </div>
          <div style={{...styles.kpiCard, borderBottom: '4px solid #3b82f6'}}>
             <p style={styles.kpiLabel}>SALDO PREVISTO (30d)</p>
             <h2 style={{...styles.kpiValue, color: '#3b82f6'}}>{formatCurrency(185600)}</h2>
             <span style={{fontSize: '11px', color: '#3b82f6'}}>Projeção de Entradas</span>
          </div>
       </div>

       {/* 📈 2. GRÁFICO DE FLUXO DETALHADO */}
       <div style={styles.chartCardFull}>
          <div style={styles.cardHeader}>
             <div>
                <h3 style={{margin: 0, fontWeight: 900}}>Comportamento de Caixa Diário</h3>
                <p style={{margin: 0, fontSize: '12px', color: '#94a3b8'}}>Histórico de movimentação e saldo progressivo</p>
             </div>
             <div style={{display: 'flex', gap: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800}}><div style={{width: 10, height: 10, borderRadius: 2, backgroundColor: '#10b981'}} /> Entradas</div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800}}><div style={{width: 10, height: 10, borderRadius: 2, backgroundColor: '#ef4444'}} /> Saídas</div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800}}><div style={{width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--primary)'}} /> Saldo Progressivo</div>
             </div>
          </div>
          <div style={{height: '380px', marginTop: '24px'}}>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                   { d: '01/04', in: 5000, out: 2000, balance: 3000 },
                   { d: '05/04', in: 12000, out: 4000, balance: 11000 },
                   { d: '10/04', in: 8000, out: 9500, balance: 9500 },
                   { d: '15/04', in: 15000, out: 3000, balance: 21500 },
                   { d: '20/04', in: 10000, out: 12000, balance: 19500 },
                   { d: '25/04', in: 22000, out: 5000, balance: 36500 },
                ]}>
                   <defs>
                      <linearGradient id="fluxIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                      <linearGradient id="fluxOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                      <linearGradient id="fluxBal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/><stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 750}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 750}} />
                   <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)'}} />
                   <Area type="monotone" dataKey="in" stroke="#10b981" strokeWidth={3} fill="url(#fluxIn)" />
                   <Area type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={3} fill="url(#fluxOut)" />
                   <Area type="monotone" dataKey="balance" stroke="var(--primary)" strokeWidth={4} fill="url(#fluxBal)" dot={{ r: 4 }} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </div>

       <div style={styles.dashboardMainGrid}>
          <div style={{flex: 2}}>
             {/* 📅 3. LINHA DO TEMPO (DIÁRIO) */}
             <div style={styles.tableCard}>
                <div style={{padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                   <h3 style={{margin: 0, fontSize: '15px', fontWeight: 900}}>Extrato Diário de Movimentações</h3>
                   <div style={{display: 'flex', gap: '8px'}}>
                      <button style={styles.filterBtnSmall}>Hoje</button>
                      <button style={styles.filterBtnSmall}>Semana</button>
                      <button style={{...styles.filterBtnSmall, backgroundColor: 'var(--primary)', color: 'white'}}>Mês</button>
                   </div>
                </div>
                <table style={styles.table}>
                   <thead>
                      <tr>
                         <th style={styles.th}>Data</th>
                         <th style={styles.th}>Descrição</th>
                         <th style={styles.th}>Tipo</th>
                         <th style={styles.th}>Valor</th>
                         <th style={styles.th}>Saldo Após</th>
                      </tr>
                   </thead>
                   <tbody>
                      {[
                         { date: '25/04/2026', desc: 'Recebimento Frete ABC', type: 'IN', val: 12500, bal: 36500 },
                         { date: '24/04/2026', desc: 'Pagamento Diesel Posto Shell', type: 'OUT', val: 4200, bal: 24000 },
                         { date: '23/04/2026', desc: 'Manutenção Preventiva Cavalo 402', type: 'OUT', val: 1800, bal: 28200 },
                         { date: '22/04/2026', desc: 'Recebimento Nota 4512 - Translog', type: 'IN', val: 9200, bal: 30000 },
                         { date: '21/04/2026', desc: 'Aluguel Galpão - Abril', type: 'OUT', val: 5500, bal: 20800 },
                      ].map((row, i) => (
                         <tr key={i} style={styles.tr}>
                            <td style={styles.td}>{row.date}</td>
                            <td style={{...styles.td, fontWeight: 700}}>{row.desc}</td>
                            <td style={styles.td}>
                               <span style={{
                                  ...styles.statusTag,
                                  backgroundColor: row.type === 'IN' ? '#ecfdf5' : '#fef2f2',
                                  color: row.type === 'IN' ? '#10b981' : '#ef4444'
                               }}>
                                  {row.type === 'IN' ? 'Entrada' : 'Saída'}
                               </span>
                            </td>
                            <td style={{...styles.td, fontWeight: 900, color: row.type === 'IN' ? '#10b981' : '#ef4444'}}>
                               {row.type === 'IN' ? '+' : '-'}{formatCurrency(row.val)}
                            </td>
                            <td style={{...styles.td, fontWeight: 900, backgroundColor: '#f8fafc'}}>{formatCurrency(row.bal)}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '20px'}}>
             {/* 🔮 6. FLUXO FUTURO & ALERTAS */}
             <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}><Zap size={18} color="#f59e0b" /> Projeção de Fluxo (Próximos 10 dias)</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px'}}>
                   <div style={styles.projectionRow}>
                      <span style={styles.projectionLabel}>Previsão de Entradas</span>
                      <span style={{fontWeight: 900, color: '#10b981'}}>+ R$ 42.500</span>
                   </div>
                   <div style={styles.projectionRow}>
                      <span style={styles.projectionLabel}>Previsão de Saídas</span>
                      <span style={{fontWeight: 900, color: '#ef4444'}}>- R$ 18.200</span>
                   </div>
                   <div style={{...styles.projectionRow, borderTop: '1px dashed #e2e8f0', paddingTop: '10px', marginTop: '4px'}}>
                      <span style={{...styles.projectionLabel, fontWeight: 900}}>Saldo Estimado</span>
                      <span style={{fontWeight: 950, color: 'var(--primary)', fontSize: '16px'}}>R$ 65.500</span>
                   </div>
                </div>
             </div>

             {/* ⚠️ ALERTAS CRÍTICOS */}
             <div style={{...styles.chartCard, backgroundColor: '#fffbeb', border: '1px solid #f59e0b'}}>
                <h3 style={{...styles.chartTitle, color: '#92400e'}}><AlertTriangle size={18} /> Risco de Caixa</h3>
                <p style={{fontSize: '12px', color: '#92400e', lineHeight: 1.5, margin: 0}}>
                   "Atenção: Você possui <strong>R$ 24.500</strong> de despesas fixas vencendo entre os dias 05 e 10. Garanta o recebimento das notas pendentes para evitar saldo negativo."
                </p>
                <button style={{marginTop: '16px', width: '100%', padding: '10px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '11px', cursor: 'pointer'}}>VER RESUMO DE CONTAS</button>
             </div>

             {/* 🤖 SAÚDE FINANCEIRA */}
             <div style={{...styles.chartCard, textAlign: 'center', padding: '32px 20px'}}>
                <div style={{width: 60, height: 60, borderRadius: '50%', border: '6px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'}}>
                   <span style={{fontWeight: 900, color: '#10b981', fontSize: '18px'}}>94%</span>
                </div>
                <h4 style={{margin: 0, fontWeight: 950, color: '#0f172a'}}>Saúde Financeira: Ótima</h4>
                <p style={{margin: '8px 0 0 0', fontSize: '12px', color: '#64748b'}}>Seu fluxo de caixa está operando com margem de segurança de 22 dias.</p>
             </div>
          </div>
       </div>
    </div>
  );

  const renderFaturamento = () => (
    <div style={styles.tabContent} className="animate-fade-in">
       {/* 🔝 1. KPIs DE FATURAMENTO */}
       <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
             <p style={styles.kpiLabel}>Total Faturado (Mês)</p>
             <h2 style={{...styles.kpiValue, color: 'var(--primary)'}}>{formatCurrency(245800)}</h2>
             <span style={{fontSize: '11px', color: '#10b981', fontWeight: 800}}>+15.4% vs Março</span>
          </div>
          <div style={styles.kpiCard}>
             <p style={styles.kpiLabel}>Faturas Geradas</p>
             <h2 style={styles.kpiValue}>142</h2>
             <span style={{fontSize: '11px', color: '#64748b'}}>Média: 4.7 faturas/dia</span>
          </div>
          <div style={styles.kpiCard}>
             <p style={styles.kpiLabel}>Aguardando Faturamento</p>
             <h2 style={{...styles.kpiValue, color: '#f59e0b'}}>{formatCurrency(32100)}</h2>
             <span style={{fontSize: '11px', color: '#f59e0b', fontWeight: 800}}>8 rotas concluídas</span>
          </div>
          <div style={styles.kpiCard}>
             <p style={styles.kpiLabel}>Ticket Médio</p>
             <h2 style={{...styles.kpiValue, color: '#3b82f6'}}>{formatCurrency(1730)}</h2>
             <span style={{fontSize: '11px', color: '#3b82f6', fontWeight: 800}}>Faturamento por serviço</span>
          </div>
       </div>

       {/* 📋 2. LISTA DE FATURAS */}
       <div style={styles.tableCard}>
          <div style={{padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
             <div style={{display: 'flex', gap: '16px'}}>
                <div style={styles.searchWrapper}>
                   <Search size={16} color="#94a3b8" />
                   <input type="text" placeholder="Buscar por Nº Fatura ou Cliente..." style={styles.searchInput} />
                </div>
                <button style={styles.btnSecondary}><Download size={16} /> Exportar DRE</button>
             </div>
             <button style={styles.btnPrimary} onClick={() => setIsAddModalOpen(true)}>
                <Plus size={16} /> Gerar Faturamento
             </button>
          </div>

          <table style={styles.table}>
             <thead>
                <tr>
                   <th style={styles.th}>Nº Fatura</th>
                   <th style={styles.th}>Cliente / Tomador</th>
                   <th style={styles.th}>Emissão</th>
                   <th style={styles.th}>Vencimento</th>
                   <th style={styles.th}>Valor Total</th>
                   <th style={styles.th}>Status</th>
                   <th style={styles.th}>Ações</th>
                </tr>
             </thead>
             <tbody>
                {[
                   { id: 'FT-2026-001', client: 'Lojas Americanas S.A', date: '22/04/2026', due: '22/05/2026', val: 42500, status: 'PAID' },
                   { id: 'FT-2026-002', client: 'Distribuidora Nova', date: '21/04/2026', due: '21/05/2026', val: 12800, status: 'PENDING' },
                   { id: 'FT-2026-003', client: 'Transportes Translog', date: '20/04/2026', due: '20/05/2026', val: 8900, status: 'OVERDUE' },
                   { id: 'FT-2026-004', client: 'Agro Industrial Norte', date: '19/04/2026', due: '19/05/2026', val: 56000, status: 'PENDING' },
                   { id: 'FT-2026-005', client: 'Mercado do Porto', date: '18/04/2026', due: '18/05/2026', val: 3200, status: 'PAID' },
                ].map((row, i) => (
                   <tr key={i} style={styles.tr}>
                      <td style={{...styles.td, fontWeight: 900, color: 'var(--primary)'}}>{row.id}</td>
                      <td style={{...styles.td, fontWeight: 700}}>{row.client}</td>
                      <td style={styles.td}>{row.date}</td>
                      <td style={styles.td}>{row.due}</td>
                      <td style={{...styles.td, fontWeight: 900}}>{formatCurrency(row.val)}</td>
                      <td style={styles.td}>
                         <div style={{
                            ...styles.statusTag,
                            backgroundColor: row.status === 'PAID' ? '#ecfdf5' : row.status === 'OVERDUE' ? '#fef2f2' : '#fffbeb',
                            color: row.status === 'PAID' ? '#10b981' : row.status === 'OVERDUE' ? '#ef4444' : '#f59e0b',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                         }}>
                            {row.status === 'PAID' ? 'Faturado' : row.status === 'OVERDUE' ? 'Vencido' : 'Pendente'}
                         </div>
                      </td>
                      <td style={styles.td}>
                         <div style={{display: 'flex', gap: '8px'}}>
                            <button style={styles.iconBtn} title="Ver XML/Nota"><FileText size={14} /></button>
                            <button style={styles.iconBtn} title="Enviar por E-mail"><Download size={14} /></button>
                            <button style={styles.iconBtn} title="Mais Opções"><MoreVertical size={14} /></button>
                         </div>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>

       {/* 📊 8. ANÁLISE DE FATURAMENTO POR CLIENTE */}
       <div style={styles.dashboardMainGrid}>
          <div style={{...styles.chartCard, flex: 2}}>
             <h3 style={styles.chartTitle}>Faturamento por Cliente (Top 5 - Mês Atual)</h3>
             <div style={{height: '300px'}}>
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={[
                      { name: 'Americanas', val: 125000 },
                      { name: 'Agro Norte', val: 84000 },
                      { name: 'Distribuidora', val: 42000 },
                      { name: 'Translog', val: 28000 },
                      { name: 'Porto', val: 12000 },
                   ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                      <Tooltip />
                      <Bar dataKey="val" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div style={{...styles.chartCard, flex: 1}}>
             <h3 style={styles.chartTitle}><AlertTriangle size={18} color="#ef4444" /> Alertas de Faturamento</h3>
             <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div style={{padding: '16px', backgroundColor: '#fef2f2', borderRadius: '16px', borderLeft: '4px solid #ef4444'}}>
                   <p style={{margin: 0, fontSize: '13px', fontWeight: 900, color: '#ef4444'}}>Faturas Vencidas: 12</p>
                   <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#7f1d1d'}}>Total de R$ 15.400 aguardando ação de cobrança imediata.</p>
                </div>
                <div style={{padding: '16px', backgroundColor: '#fffbeb', borderRadius: '16px', borderLeft: '4px solid #f59e0b'}}>
                   <p style={{margin: 0, fontSize: '13px', fontWeight: 900, color: '#f59e0b'}}>Rotas sem Faturamento</p>
                   <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#92400e'}}>Existem 8 rotas concluídas no CRM que ainda não foram convertidas em faturas.</p>
                </div>
                <div style={{padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '16px', borderLeft: '4px solid #0ea5e9'}}>
                   <p style={{margin: 0, fontSize: '13px', fontWeight: 900, color: '#0ea5e9'}}>Crescimento Mensal</p>
                   <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#0369a1'}}>Seu faturamento este mês já superou em 12% o total de Março.</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderInteligencia = () => (
    <div style={styles.tabContent} className="animate-fade-in">
       {/* 🔝 1. KPIs ESTRATÉGICOS (MENSAL) */}
       <div style={{...styles.kpiGrid, gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px'}}>
          <div style={styles.kpiCard}>
             <div style={styles.kpiInfo}>
                <p style={styles.kpiLabel}>Receita Total</p>
                <h2 style={{...styles.kpiValue, fontSize: '22px'}}>{formatCurrency(125400)}</h2>
                <span style={{fontSize: '11px', color: '#10b981', fontWeight: '800'}}>+12% vs mês anterior</span>
             </div>
             <div style={{...styles.kpiIconWrapper, backgroundColor: '#ecfdf5'}}><TrendingUp size={20} color="#10b981" /></div>
          </div>
          <div style={styles.kpiCard}>
             <div style={styles.kpiInfo}>
                <p style={styles.kpiLabel}>Despesas Totais</p>
                <h2 style={{...styles.kpiValue, fontSize: '22px', color: '#ef4444'}}>{formatCurrency(84200)}</h2>
                <span style={{fontSize: '11px', color: '#64748b', fontWeight: '800'}}>Fixa: 45k | Var: 39k</span>
             </div>
             <div style={{...styles.kpiIconWrapper, backgroundColor: '#fef2f2'}}><TrendingDown size={20} color="#ef4444" /></div>
          </div>
          <div style={styles.kpiCard}>
             <div style={styles.kpiInfo}>
                <p style={styles.kpiLabel}>LUCRO LÍQUIDO</p>
                <h2 style={{...styles.kpiValue, fontSize: '22px', color: 'var(--primary)'}}>{formatCurrency(41200)}</h2>
                <span style={{fontSize: '11px', color: 'var(--primary)', fontWeight: '800'}}>Margem: 32.8%</span>
             </div>
             <div style={{...styles.kpiIconWrapper, backgroundColor: 'var(--primary-light)'}}><DollarSign size={20} color="var(--primary)" /></div>
          </div>
          <div style={styles.kpiCard}>
             <div style={styles.kpiInfo}>
                <p style={styles.kpiLabel}>Contas a Receber</p>
                <h2 style={{...styles.kpiValue, fontSize: '22px', color: '#3b82f6'}}>{formatCurrency(kpis.pending)}</h2>
                <span style={{fontSize: '11px', color: '#3b82f6', fontWeight: '800'}}>14 faturas abertas</span>
             </div>
             <div style={{...styles.kpiIconWrapper, backgroundColor: '#eff6ff'}}><ArrowUpRight size={20} color="#3b82f6" /></div>
          </div>
          <div style={styles.kpiCard}>
             <div style={styles.kpiInfo}>
                <p style={styles.kpiLabel}>Contas a Pagar</p>
                <h2 style={{...styles.kpiValue, fontSize: '22px', color: '#f59e0b'}}>{formatCurrency(15400)}</h2>
                <span style={{fontSize: '11px', color: '#ef4444', fontWeight: '800'}}>3 boletos vencidos!</span>
             </div>
             <div style={{...styles.kpiIconWrapper, backgroundColor: '#fffbeb'}}><ArrowDownRight size={20} color="#f59e0b" /></div>
          </div>
       </div>

       <div style={styles.dashboardMainGrid}>
          {/* COLUNA ESQUERDA: GRÁFICOS E FLUXO */}
          <div style={{...styles.chartCol, flex: 2}}>
             {/* 📊 2. FLUXO DE CAIXA CONSOLIDADO */}
             <div style={styles.chartCard}>
                <div style={styles.cardHeader}>
                   <div>
                      <h3 style={{fontSize: '18px', fontWeight: '950'}}>Fluxo de Caixa Estratégico</h3>
                      <p style={{margin: 0, fontSize: '12px', color: '#94a3b8'}}>Entradas vs Saídas vs Acumulado</p>
                   </div>
                   <div style={{display: 'flex', gap: '12px'}}>
                      <span style={{fontSize: '11px', fontWeight: '850', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px'}}><div style={{width: 8, height: 8, borderRadius: 2, backgroundColor: '#10b981'}} /> Entradas</span>
                      <span style={{fontSize: '11px', fontWeight: '850', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px'}}><div style={{width: 8, height: 8, borderRadius: 2, backgroundColor: '#ef4444'}} /> Saídas</span>
                      <span style={{fontSize: '11px', fontWeight: '850', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px'}}><div style={{width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--primary)'}} /> Saldo</span>
                   </div>
                </div>
                <div style={{height: '350px', marginTop: '24px'}}>
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                         { name: '01/04', in: 12000, out: 8000, balance: 4000 },
                         { name: '05/04', in: 18000, out: 9500, balance: 12500 },
                         { name: '10/04', in: 15000, out: 12800, balance: 14700 },
                         { name: '15/04', in: 22000, out: 11000, balance: 25700 },
                         { name: '20/04', in: 19000, out: 14200, balance: 30500 },
                         { name: 'Hoje', in: 16500, out: 10200, balance: 36800 },
                      ]}>
                         <defs>
                            <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                            <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                            <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/><stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                         <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                         <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)'}} />
                         <Area type="monotone" dataKey="in" stroke="#10b981" strokeWidth={3} fill="url(#colorIn)" />
                         <Area type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={3} fill="url(#colorOut)" />
                         <Area type="monotone" dataKey="balance" stroke="var(--primary)" strokeWidth={4} fill="url(#colorBal)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* 📈 7. ANÁLISE DE LUCRO POR ROTA / DIA */}
             <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
                <div style={styles.chartCard}>
                   <h3 style={styles.chartTitle}><Target size={18} color="var(--primary)" /> Margem de Lucro por Rota</h3>
                   <div style={{height: '200px'}}>
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={[
                            { name: 'Rota Norte', m: 42 },
                            { name: 'Rota Sul', m: 28 },
                            { name: 'Expressa', m: 55 },
                            { name: 'Internac.', m: 38 },
                         ]}>
                            <XAxis dataKey="name" hide />
                            <YAxis hide />
                            <Tooltip />
                            <Bar dataKey="m" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div style={styles.chartCard}>
                   <h3 style={styles.chartTitle}><Activity size={18} color="#10b981" /> Previsão de Receita (IA)</h3>
                   <div style={{display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                         <span style={{fontSize: '13px', color: '#64748b'}}>Próximos 7 dias</span>
                         <span style={{fontWeight: '900', color: '#10b981'}}>{formatCurrency(54000)}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                         <span style={{fontSize: '13px', color: '#64748b'}}>Próximos 30 dias</span>
                         <span style={{fontWeight: '900', color: '#10b981'}}>{formatCurrency(198000)}</span>
                      </div>
                      <p style={{margin: 0, fontSize: '11px', color: '#94a3b8', fontStyle: 'italic'}}>Baseado no histórico de faturamento e contratos ativos.</p>
                   </div>
                </div>
             </div>
          </div>

          {/* COLUNA DIREITA: ALERTAS E CONTAS DO DIA */}
          <div style={{...styles.chartCol, flex: 1}}>
             {/* 📅 3. CONTAS DO DIA */}
             <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}><Clock size={18} color="#3b82f6" /> Compromissos de Hoje</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                   <div style={{padding: '16px', backgroundColor: '#eff6ff', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                         <p style={{margin: 0, fontSize: '11px', fontWeight: '800', color: '#3b82f6'}}>A RECEBER</p>
                         <p style={{margin: 0, fontWeight: '950'}}>{formatCurrency(12500)}</p>
                      </div>
                      <span style={{fontSize: '10px', color: '#64748b'}}>04 Clientes</span>
                   </div>
                   <div style={{padding: '16px', backgroundColor: '#fef2f2', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                         <p style={{margin: 0, fontSize: '11px', fontWeight: '800', color: '#ef4444'}}>A PAGAR</p>
                         <p style={{margin: 0, fontWeight: '950'}}>{formatCurrency(8400)}</p>
                      </div>
                      <span style={{fontSize: '10px', color: '#64748b'}}>02 Contas</span>
                   </div>
                </div>
             </div>

             {/* ⚠️ 10. ALERTAS FINANCEIROS */}
             <div style={{...styles.chartCard, border: '2px solid #ef4444'}}>
                <h3 style={{...styles.chartTitle, color: '#ef4444'}}><AlertTriangle size={18} /> Alertas Críticos</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                   <div style={{padding: '14px', backgroundColor: '#fef2f2', borderRadius: '14px'}}>
                      <p style={{margin: 0, fontSize: '12px', fontWeight: '900', color: '#ef4444'}}>Inadimplência Alta</p>
                      <p style={{margin: '4px 0 0 0', fontSize: '11px', color: '#991b1b'}}>Cliente "Transportes Log" está com a fatura de R$ 15k atrasada há 5 dias.</p>
                   </div>
                   <div style={{padding: '14px', backgroundColor: '#fffbeb', borderRadius: '14px'}}>
                      <p style={{margin: 0, fontSize: '12px', fontWeight: '900', color: '#f59e0b'}}>Custo de Combustível</p>
                      <p style={{margin: '4px 0 0 0', fontSize: '11px', color: '#92400e'}}>Gasto com Diesel superou a meta mensal em 15% nas últimas 2 semanas.</p>
                   </div>
                </div>
             </div>

             {/* 🤖 11. INSIGHTS IA */}
             <div style={{...styles.chartCard, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: 'none'}}>
                <div style={{padding: '24px'}}>
                   <h3 style={{color: 'white', fontSize: '16px', fontWeight: '950', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}><Zap size={18} color="#f59e0b" /> Insight Inteligente</h3>
                   <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.6', margin: 0}}>
                      "Seu ponto de equilíbrio foi atingido hoje (22/04). Todo faturamento a partir de agora é <strong>Lucro Líquido</strong>."
                   </p>
                   <button style={{width: '100%', marginTop: '20px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '12px', fontWeight: '800', cursor: 'pointer'}}>VER RELATÓRIO COMPLETO</button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderRelatorios = () => (
    <div style={styles.tabContent} className="animate-fade-in">
       {/* 🔝 1. KPIs RESUMO (Visão Executiva) */}
       <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
             <p style={styles.kpiLabel}>Receita Total (Mês)</p>
             <h2 style={{...styles.kpiValue, color: '#10b981'}}>{formatCurrency(245800)}</h2>
             <span style={{fontSize: '11px', color: '#64748b', fontWeight: 800}}>Faturamento Bruto</span>
          </div>
          <div style={styles.kpiCard}>
             <p style={styles.kpiLabel}>Despesas Totais</p>
             <h2 style={{...styles.kpiValue, color: '#ef4444'}}>{formatCurrency(168200)}</h2>
             <span style={{fontSize: '11px', color: '#64748b', fontWeight: 800}}>Custos Op. e Fixos</span>
          </div>
          <div style={styles.kpiCard}>
             <p style={styles.kpiLabel}>LUCRO LÍQUIDO</p>
             <h2 style={{...styles.kpiValue, color: 'var(--primary)'}}>{formatCurrency(77600)}</h2>
             <span style={{fontSize: '11px', color: '#10b981', fontWeight: 800}}>Margem de 31.5%</span>
          </div>
          <div style={styles.kpiCard}>
             <p style={styles.kpiLabel}>Inadimplência</p>
             <h2 style={{...styles.kpiValue, color: '#f59e0b'}}>4.2%</h2>
             <span style={{fontSize: '11px', color: '#f59e0b', fontWeight: 800}}>R$ 15.700 em atraso</span>
          </div>
       </div>

       {/* 📈 2. GRÁFICO DE EVOLUÇÃO (DRE) */}
       <div style={styles.chartCardFull}>
          <div style={styles.cardHeader}>
             <div>
                <h3 style={{margin: 0, fontWeight: 900}}>Demonstrativo de Evolução Financeira</h3>
                <p style={{margin: 0, fontSize: '12px', color: '#94a3b8'}}>Comparação entre Receita vs Despesa vs Lucro nos últimos 6 meses</p>
             </div>
             <div style={{display: 'flex', gap: '16px'}}>
                <button style={styles.btnSecondary} onClick={() => toastSuccess('Exportando PDF...')}>
                   <Download size={14} /> PDF
                </button>
             </div>
          </div>
          <div style={{height: '380px', marginTop: '24px'}}>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                   { name: 'Jan', r: 180000, d: 130000, l: 50000 },
                   { name: 'Fev', r: 210000, d: 145000, l: 65000 },
                   { name: 'Mar', r: 205000, d: 160000, l: 45000 },
                   { name: 'Abr', r: 245800, d: 168200, l: 77600 },
                ]}>
                   <defs>
                      <linearGradient id="regR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                      <linearGradient id="regD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                   <Tooltip />
                   <Area type="monotone" dataKey="r" stroke="#10b981" strokeWidth={3} fill="url(#regR)" name="Receita" />
                   <Area type="monotone" dataKey="d" stroke="#ef4444" strokeWidth={3} fill="url(#regD)" name="Despesa" />
                   <Area type="monotone" dataKey="l" stroke="var(--primary)" strokeWidth={4} fill="none" name="Lucro Líquido" dot={{ r: 4 }} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </div>

       {/* 📊 3. DETALHAMENTO POR CATEGORIA */}
       <div style={styles.dashboardMainGrid}>
          <div style={styles.chartCard}>
             <h3 style={styles.chartTitle}>Onde você ganha (Receitas por Cliente)</h3>
             <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {[
                   { name: 'Lojas Americanas', val: 125000, p: 51 },
                   { name: 'Agro Industrial', val: 84000, p: 34 },
                   { name: 'Distribuidora Nova', val: 42000, p: 17 },
                ].map((item, i) => (
                   <div key={i}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                         <span style={{fontSize: '12px', fontWeight: 800}}>{item.name}</span>
                         <span style={{fontSize: '12px', fontWeight: 900}}>{formatCurrency(item.val)} ({item.p}%)</span>
                      </div>
                      <div style={{height: '6px', backgroundColor: '#f1f5f9', borderRadius: '10px', overflow: 'hidden'}}>
                         <div style={{width: `${item.p}%`, height: '100%', backgroundColor: '#10b981'}} />
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div style={styles.chartCard}>
             <h3 style={styles.chartTitle}>Onde você gasta (Despesas por Categoria)</h3>
             <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {[
                   { name: 'Combustível', val: 62000, p: 37 },
                   { name: 'Folha de Pagamento', val: 56000, p: 33 },
                   { name: 'Manutenção', val: 24000, p: 14 },
                   { name: 'Seguros e Taxas', val: 18000, p: 11 },
                ].map((item, i) => (
                   <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc'}}>
                      <span style={{fontSize: '12px', fontWeight: 800}}>{item.name}</span>
                      <span style={{fontSize: '12px', fontWeight: 900, color: '#ef4444'}}>{formatCurrency(item.val)}</span>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* ⚠️ 6. INSIGHTS INTELIGENTES */}
       <div style={{...styles.chartCard, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: 'none'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
             <h3 style={{color: 'white', margin: 0}}><Zap size={18} color="#f59e0b" /> Insights do Cérebro Logta</h3>
             <button style={{padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '10px', fontSize: '11px', fontWeight: 800}}>Baixar Relatório Executivo</button>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px'}}>
             <div style={{padding: '16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'}}>
                <p style={{color: '#f59e0b', fontSize: '11px', fontWeight: 900, margin: 0}}>POTENCIAL DE LUCRO</p>
                <p style={{color: 'white', fontSize: '13px', marginTop: '4px', lineHeight: 1.4}}>Otimizar a rota Sul pode aumentar sua margem global em até <strong>4.2%</strong>.</p>
             </div>
             <div style={{padding: '16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'}}>
                <p style={{color: '#3b82f6', fontSize: '11px', fontWeight: 900, margin: 0}}>RISCO DE CAIXA</p>
                <p style={{color: 'white', fontSize: '13px', marginTop: '4px', lineHeight: 1.4}}>Concentração de boletos no dia 10 requer reserva extra de <strong>R$ 15k</strong>.</p>
             </div>
             <div style={{padding: '16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'}}>
                <p style={{color: '#10b981', fontSize: '11px', fontWeight: 900, margin: 0}}>MELHOR CLIENTE</p>
                <p style={{color: 'white', fontSize: '13px', marginTop: '4px', lineHeight: 1.4}}>Americanas S.A é seu cliente mais rentável, com margem líquida de <strong>48%</strong>.</p>
             </div>
          </div>
       </div>
    </div>
  );

  const headerActions = (
    <button type="button" style={styles.calcBtn} onClick={() => setIsCalcOpen(true)} title="Abrir calculadora financeira">
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CalcIcon size={18} strokeWidth={2.25} color="#7c3aed" aria-hidden />
      </span>
      <span>Calculadora</span>
    </button>
  );

  return (
    <>
      <ModuleLayout
        title={
          activeTab === 'inteligencia' ? 'Cérebro Financeiro: Inteligência' :
          activeTab === 'fluxo' ? 'Fluxo de Caixa Operacional' :
          activeTab === 'dashboard' ? 'Resumo Financeiro & KPIs' :
          activeTab === 'areceber' ? 'Gestão de Recebíveis (A Receber)' :
          activeTab === 'apagar' ? 'Contas a Pagar Operacionais' :
          activeTab === 'faturamento' ? 'Faturamento & Performance' :
          activeTab === 'relatorios' ? 'Relatórios & DRE Inteligente' : 'Financeiro'
        }
        badge="GESTÃO FINANCEIRA"
        items={navItems}
        activeTab={activeTab}
        onTabChange={onTabChange}
        actions={headerActions}
      >
        <div style={styles.content}>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'fluxo' && renderFluxo()}

          {activeTab === 'areceber' && renderAreceber()}

          {activeTab === 'apagar' && renderApagar()}

          {activeTab === 'faturamento' && renderFaturamento()}

          {activeTab === 'relatorios' && renderRelatorios()}

          {activeTab === 'inteligencia' && renderInteligencia()}
        </div>
      </ModuleLayout>

      {/* Calculator Modal */}
      <LogtaModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} title="Calculadora Financeira Avançada" width="900px">
        <FinanceCalculator />
      </LogtaModal>

      {/* Add Transaction Modal */}
      <LogtaModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Novo Lançamento" width="600px">
        <form onSubmit={handleAddTransaction} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Descrição *</label>
            <input
              style={styles.formInput}
              required
              placeholder="Ex: Recebimento Frete ABC Ltda"
              value={newTransaction.description}
              onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Valor (R$) *</label>
              <input
                style={styles.formInput}
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={newTransaction.amount}
                onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Tipo *</label>
              <select style={styles.formInput} value={newTransaction.type} onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value as any })}>
                <option value="INCOME">Receita (Entrada)</option>
                <option value="EXPENSE">Despesa (Saída)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Vencimento</label>
              <input style={styles.formInput} type="date" value={newTransaction.due_date} onChange={e => setNewTransaction({ ...newTransaction, due_date: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Status</label>
              <select style={styles.formInput} value={newTransaction.status} onChange={e => setNewTransaction({ ...newTransaction, status: e.target.value as any })}>
                <option value="PENDING">Pendente</option>
                <option value="PAID">Pago</option>
                <option value="OVERDUE">Atrasado</option>
              </select>
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Categoria</label>
            <input
              style={styles.formInput}
              placeholder="Ex: Fretes, Combustível, Manutenção..."
              value={newTransaction.category}
              onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })}
            />
          </div>
          <button type="submit" style={styles.btnPrimary}>
            <Plus size={16} /> Salvar Lançamento
          </button>
        </form>
      </LogtaModal>
    </>
  );
};

const styles: Record<string, any> = {
  content: { display: 'flex', flexDirection: 'column', gap: '24px' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },

  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  kpiCard: {
    backgroundColor: 'white', padding: '24px', borderRadius: '24px',
    border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
  },
  kpiTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  kpiIcon: { width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  kpiTrend: { fontSize: '12px', fontWeight: '800' },
  kpiValue: { fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.5px' },
  kpiLabel: { fontSize: '12px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: 0 },

  filterBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'white', padding: '16px 20px', borderRadius: '18px',
    border: '1px solid #f1f5f9', gap: '16px', flexWrap: 'wrap'
  },
  searchWrapper: {
    display: 'flex', alignItems: 'center', gap: '10px',
    flex: 1, minWidth: '220px', backgroundColor: '#f8fafc',
    borderRadius: '12px', padding: '10px 16px', border: '1px solid #f1f5f9'
  },
  searchIcon: { color: '#94a3b8', flexShrink: 0 },
  searchInput: { border: 'none', outline: 'none', fontSize: '14px', backgroundColor: 'transparent', flex: 1, color: 'var(--text-main)' },
  filterActions: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  selectFilter: {
    padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0',
    fontSize: '13px', fontWeight: '700', color: '#475569', backgroundColor: 'white', cursor: 'pointer'
  },
  btnSecondary: {
    padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0',
    backgroundColor: 'white', cursor: 'pointer', color: '#64748b',
    display: 'flex', alignItems: 'center', gap: '6px'
  },
  btnPrimary: {
    padding: '10px 18px', borderRadius: '14px', backgroundColor: 'var(--primary)',
    color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
  },
  calcBtn: {
    padding: '10px 18px', borderRadius: '12px', backgroundColor: '#f5f3ff',
    color: 'var(--primary)', border: '1px solid rgba(124,58,237,0.2)', fontWeight: '800',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px'
  },

  chartsGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' },
  chartCard: { backgroundColor: 'white', padding: '28px', borderRadius: '24px', border: '1px solid #f1f5f9' },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  chartTitle: { fontSize: '16px', fontWeight: '900', color: 'var(--text-main)', margin: '0 0 20px 0' },
  refreshBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' },

  alertItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 16px', borderRadius: '14px'
  },
  alertDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  alertLabel: { flex: 1, fontSize: '13px', fontWeight: '700', color: '#475569' },
  alertValue: { fontSize: '14px', fontWeight: '900' },

  tableCard: { backgroundColor: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fcfdfe' },
  td: { padding: '16px 24px', fontSize: '14px', borderBottom: '1px solid #f1f5f9', color: '#475569' },
  tr: { transition: 'background-color 0.2s' },
  statusTag: { padding: '5px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' },
  categoryBadge: { padding: '4px 8px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '11px', color: '#64748b', fontWeight: '700', border: '1px solid #f1f5f9' },
  iconBtn: { padding: '6px', color: '#94a3b8', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px' },

  intelBanner: { position: 'relative', borderRadius: '24px', overflow: 'hidden', height: '220px' },
  intelBannerImg: { width: '100%', height: '100%', objectFit: 'cover' },
  intelBannerOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to right, rgba(15,23,42,0.92), rgba(15,23,42,0.4))',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px'
  },
  intelBadge: {
    display: 'inline-block', padding: '4px 12px', backgroundColor: 'rgba(124,58,237,0.3)',
    color: '#c4b5fd', borderRadius: '20px', fontSize: '10px', fontWeight: '900', letterSpacing: '1px',
    border: '1px solid rgba(196,181,253,0.3)'
  },

  intelInsights: { backgroundColor: 'white', padding: '28px', borderRadius: '24px', border: '1px solid #f1f5f9' },
  insightItem: {
    display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px 20px',
    borderRadius: '14px', borderLeft: '4px solid transparent', marginBottom: '12px'
  },
  insightText: { margin: 0, fontSize: '14px', color: '#475569', fontWeight: '600', lineHeight: '1.5' },

  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' },
  formInput: { padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--border)', fontSize: '14px', outline: 'none', color: 'var(--text-main)' },

  chartCardFull: { backgroundColor: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #f1f5f9' },
  dashboardMainGrid: { display: 'flex', gap: '24px', width: '100%' },
  filterBtnSmall: { padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 800, backgroundColor: 'white', cursor: 'pointer', color: '#64748b' },
  projectionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  projectionLabel: { fontSize: '13px', color: '#64748b', fontWeight: 700 },
};

export default Finance;
