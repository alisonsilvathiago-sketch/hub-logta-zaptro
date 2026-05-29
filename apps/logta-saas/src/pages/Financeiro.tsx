import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  FinanceiroModuleHub,
  FinanceiroFeatureRoute,
  FinanceiroExecutiveDashboard,
  FinanceiroAlertasView,
  FinanceiroCentralOperacional,
  FinanceiroIntelligenceProvider,
  FinanceiroAlertsInlinePanel,
  computeFinanceiroAnalytics,
  useFinanceiroTransactionNavigation,
} from '../modules/financeiro';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  Truck, 
  Calendar, 
  Filter, 
  Plus, 
  Download, 
  Mail, 
  AlertCircle,
  FileText,
  ChevronRight,
  MoreVertical,
  Activity,
  Briefcase,
  Wallet,
  Zap,
  CheckCircle2,
  Loader2,
  Calculator,
  Bell,
  Search,
  Repeat,
  Sparkles,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import { downloadExcelCsv, downloadPdfTable } from '../lib/reportExport';
import { useOperationalData } from '../contexts/OperationalDataContext';
import { LogtaEmptyState } from '../components/EmptyState';
import { LogtaWaveTabStrip } from '../components/LogtaWaveTabStrip';
import { LogtaModuleHeader } from '../components/LogtaModuleHeader';
import { LogtaModalHeader } from '../components/LogtaModalHeader';
import { showToast } from '../components/Toast';
import { LogtaTransactionDetailModal } from '../components/LogtaTransactionDetailModal';
import { enrichTransactionMeta } from '../lib/transactionMetaEnrich';

const Financeiro = () => {
  const { config } = useTenant();
  const [isNovoLancamentoOpen, setIsNovoLancamentoOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [transactionModalMode, setTransactionModalMode] = useState<'pagar' | 'receber' | 'view'>('pagar');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lancamentoSuccess, setLancamentoSuccess] = useState(false);
  const [categoryVal, setCategoryVal] = useState('');
  const [detectedCategory, setDetectedCategory] = useState('');

  useEffect(() => {
    if (!isNovoLancamentoOpen) {
      setCategoryVal('');
      setDetectedCategory('');
    }
  }, [isNovoLancamentoOpen]);
  
  const {
    transactions: rawTransactions,
    shipments,
    motoristas,
    loading,
    refresh: refreshOperational,
  } = useOperationalData();

  const transactions = useMemo(
    () =>
      rawTransactions.map((t, i) => {
        const rawType = (t.type ?? '').toLowerCase();
        const tipo =
          rawType === 'income' ? 'receita' : rawType === 'expense' ? 'despesa' : t.type;
        return enrichTransactionMeta(
          {
            ...t,
            tipo,
            valor: t.amount,
            descricao: t.description,
            categoria: t.category,
            data_vencimento: t.paid_at || t.created_at,
          },
          i,
        );
      }),
    [rawTransactions],
  );

  const fetchFinanceiroData = async () => {
    await refreshOperational();
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment?.id) return;
    const isReceber = transactionModalMode === 'receber';
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ paid_at: new Date().toISOString() })
        .eq('id', selectedPayment.id);
      if (!error) {
        fetchFinanceiroData();
        (window as any).showToast?.(
          'success',
          isReceber ? 'Recebimento registrado com sucesso.' : 'Pagamento registrado com sucesso.',
          isReceber ? 'Contas a receber' : 'Contas a pagar',
        );
        setIsPaymentModalOpen(false);
        setSelectedPayment(null);
      } else {
        fetchFinanceiroData();
        (window as any).showToast?.(
          'success',
          isReceber ? 'Recebimento registrado (modo demo).' : 'Pagamento registrado (modo demo).',
          'Financeiro',
        );
        setIsPaymentModalOpen(false);
        setSelectedPayment(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateLancamento = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          type: formData.tipo,
          description: formData.descricao,
          amount: parseFloat(formData.valor.replace('R$', '').replace('.', '').replace(',', '.')),
          paid_at: new Date().toISOString(),
          category: formData.categoria,
          company_id: config.id // Multi-tenant isolation
        }]);

      if (!error) {
        setLancamentoSuccess(true);
        fetchFinanceiroData();
        if ((window as any).showToast) {
          (window as any).showToast('success', 'Novo lançamento registrado com sucesso!', 'Lançamento Efetuado');
        }
        setTimeout(() => {
          setLancamentoSuccess(false);
          setIsNovoLancamentoOpen(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Error creating transaction:', err);
    }
  };
  
  const analytics = useMemo(() => computeFinanceiroAnalytics(transactions), [transactions]);

  const tabs = [
    { id: 'dashboard', label: 'Painel', shortLabel: 'Painel', icon: Activity, path: '/financeiro/dashboard' },
    { id: 'operacional', label: 'Operacional', shortLabel: 'Oper.', icon: Truck, path: '/financeiro/operacional' },
    { id: 'receber', label: 'Receber', shortLabel: 'Receber', icon: TrendingUp, path: '/financeiro/receber' },
    { id: 'pagar', label: 'Pagar', shortLabel: 'Pagar', icon: TrendingDown, path: '/financeiro/pagar' },
    { id: 'fluxo', label: 'Fluxo', shortLabel: 'Fluxo', icon: PieChart, path: '/financeiro/fluxo' },
    { id: 'central', label: 'Central', shortLabel: 'Central', icon: Bell, path: '/financeiro/central' },
    { id: 'gestao', label: 'Gestão', shortLabel: 'Gestão', icon: Briefcase, path: '/financeiro/gestao' },
  ];

  return (
    <FinanceiroIntelligenceProvider
      transactions={transactions}
      shipments={shipments}
      motoristas={motoristas}
      loading={loading}
      autoPopup={false}
    >
    <div className="logta-page relative w-full min-h-0 flex-1 space-y-8 animate-in fade-in duration-700">
      <LogtaModuleHeader
        title="Financeiro"
        subtitle="Sistema financeiro inteligente — monitoramento em tempo real, alertas proativos e IA operacional."
        tabs={<LogtaWaveTabStrip tabs={tabs} basePath="/financeiro" defaultTabId="dashboard" />}
        tabQuickAddLabel="Novo lançamento"
        onTabQuickAdd={() => setIsNovoLancamentoOpen(true)}
      />

      <FinanceiroAlertsInlinePanel />

      <div className="min-h-0 flex-1 animate-in fade-in duration-500">
        <Routes>
          <Route index element={<Navigate to="/financeiro/dashboard" replace />} />
          <Route
            path="dashboard"
            element={<FinanceiroExecutiveDashboard transactions={transactions} loading={loading} />}
          />
          <Route
            path="operacional"
            element={
              <FinanceiroModuleHub
                category="operacional"
                title="Financeiro Operacional"
                subtitle="Custos por viagem, fretes, combustível, motorista e simuladores para transportadoras."
              />
            }
          />
          <Route
            path="operacional/:slug"
            element={
              <FinanceiroOperacionalFeaturePage
                transactionCount={analytics.transacoes}
                saldo={analytics.saldo}
              />
            }
          />
          <Route
            path="gestao"
            element={
              <FinanceiroModuleHub
                category="gestao"
                title="Gestão Financeira"
                subtitle="Fluxo, faturamento, bancário, DRE, KPI, governança e integrações."
              />
            }
          />
          <Route
            path="gestao/:slug"
            element={
              <FinanceiroGestaoFeaturePage transactionCount={analytics.transacoes} saldo={analytics.saldo} />
            }
          />
          <Route path="central" element={<FinanceiroCentralOperacional />} />
          <Route path="alertas" element={<FinanceiroAlertasView />} />
          <Route
            path="receber"
            element={
              <ContasReceberView
                transactions={transactions}
                loading={loading}
                refresh={fetchFinanceiroData}
                onAddClick={() => setIsNovoLancamentoOpen(true)}
                onTransfer={() => setIsTransferOpen(true)}
                onDetailClick={(t: any) => {
                  setTransactionModalMode('receber');
                  setSelectedPayment(t);
                  setIsPaymentModalOpen(true);
                }}
              />
            }
          />
          <Route
            path="pagar"
            element={
              <ContasPagarView
                transactions={transactions}
                loading={loading}
                refresh={fetchFinanceiroData}
                onAddClick={() => setIsNovoLancamentoOpen(true)}
                onPayClick={(p: any) => {
                  setTransactionModalMode('pagar');
                  setSelectedPayment(p);
                  setIsPaymentModalOpen(true);
                }}
              />
            }
          />
          <Route
            path="fluxo"
            element={
              <FluxoCaixaView
                transactions={transactions}
                loading={loading}
                refresh={fetchFinanceiroData}
                onAddClick={() => setIsNovoLancamentoOpen(true)}
                onTransactionClick={(t: any) => {
                  setTransactionModalMode(t.tipo === 'receita' ? 'receber' : 'pagar');
                  setSelectedPayment(t);
                  setIsPaymentModalOpen(true);
                }}
              />
            }
          />
        </Routes>
      </div>

      {/* Modals remain similarly styled but with backend calls */}
      {isNovoLancamentoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsNovoLancamentoOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#18191B] rounded-[32px] shadow-2xl border border-neutral-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden text-white">
            <div className="px-8 pt-8 pb-2">
              <LogtaModalHeader icon={Wallet} title="Novo lançamento" onClose={() => setIsNovoLancamentoOpen(false)} />
            </div>
            {lancamentoSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-green-950/40 text-green-400 rounded-full flex items-center justify-center border border-neutral-850 shadow-inner">
                  <CheckCircle2 size={36} className="animate-bounce" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Lançamento Salvo!</h4>
                  <p className="text-xs text-neutral-400 mt-1">O registro foi persistido no banco de dados com sucesso.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = {
                  descricao: e.target.descricao.value + (e.target.recorrente.checked ? ' [Recorrente]' : ''),
                  tipo: e.target.tipo.value,
                  valor: e.target.valor.value,
                  categoria: categoryVal,
                };
                handleCreateLancamento(formData);
              }} className="p-8 space-y-5 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Descrição</label>
                  <input
                    name="descricao"
                    required
                    placeholder="Ex: Pagamento Frete Agregado"
                    onChange={(e: any) => {
                      const desc = e.target.value.toLowerCase();
                      let cat = '';
                      if (desc.includes('energia') || desc.includes('luz') || desc.includes('enel') || desc.includes('celpe') || desc.includes('copel')) {
                        cat = 'Contas de Consumo (Energia)';
                      } else if (desc.includes('aluguel') || desc.includes('locaç') || desc.includes('sala')) {
                        cat = 'Instalações (Aluguel)';
                      } else if (desc.includes('internet') || desc.includes('wifi') || desc.includes('provedor') || desc.includes('fibra')) {
                        cat = 'Telecom (Internet)';
                      } else if (desc.includes('combustivel') || desc.includes('diesel') || desc.includes('gasolina') || desc.includes('posto')) {
                        cat = 'Combustível';
                      }
                      
                      if (cat) {
                        setDetectedCategory(cat);
                        setCategoryVal(cat);
                      } else {
                        setDetectedCategory('');
                      }
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white placeholder-neutral-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Tipo</label>
                    <select name="tipo" className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white">
                      <option value="despesa">Despesa (Saída)</option>
                      <option value="receita">Receita (Entrada)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Valor</label>
                    <input name="valor" required type="text" placeholder="R$ 0,00" className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white placeholder-neutral-500" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Categoria</label>
                  <input
                    name="categoria"
                    value={categoryVal}
                    onChange={(e) => setCategoryVal(e.target.value)}
                    placeholder="Ex: Combustível, Manutenção"
                    className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white placeholder-neutral-500"
                  />
                </div>

                {detectedCategory && (
                  <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl flex items-center gap-2 animate-in fade-in duration-300">
                    <Sparkles className="text-primary shrink-0 animate-pulse" size={14} />
                    <span className="text-[10px] font-bold text-primary uppercase">
                      IA Inteligente: Categoria sugerida como "{detectedCategory}"!
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    name="recorrente"
                    id="recorrente"
                    className="w-4 h-4 rounded bg-neutral-900 border border-neutral-800 text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="recorrente" className="text-[10px] font-black uppercase tracking-wider text-neutral-400 select-none cursor-pointer">
                    Lançamento Recorrente (Contrato / Mensal)
                  </label>
                </div>

                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 cursor-pointer">
                  Confirmar Lançamento Real
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {isTransferOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsTransferOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-[#18191B] rounded-[32px] shadow-2xl border border-neutral-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden text-white">
            <div className="px-8 pt-8 pb-2">
              <LogtaModalHeader icon={Zap} title="Transferência" onClose={() => setIsTransferOpen(false)} />
            </div>
            <form
              className="p-8 pt-4 space-y-5 text-left"
              onSubmit={(e) => {
                e.preventDefault();
                showToast('success', 'Transferência registrada. Integração bancária em homologação.', 'Financeiro');
                setIsTransferOpen(false);
              }}
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Destino (PIX / conta)</label>
                <input
                  required
                  placeholder="Chave PIX ou dados bancários"
                  className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white placeholder-neutral-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Valor</label>
                  <input
                    required
                    type="text"
                    placeholder="R$ 0,00"
                    className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white placeholder-neutral-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Tipo</label>
                  <select className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white">
                    <option>PIX</option>
                    <option>TED</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                Confirmar transferência
              </button>
            </form>
          </div>
        </div>
      )}

      <LogtaTransactionDetailModal
        open={isPaymentModalOpen && !!selectedPayment}
        transaction={selectedPayment}
        mode={transactionModalMode}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPayment(null);
        }}
        onConfirm={transactionModalMode === 'view' ? undefined : handleConfirmPayment}
      />

    </div>
    </FinanceiroIntelligenceProvider>
  );
};

function FinanceiroOperacionalFeaturePage({ transactionCount, saldo }: { transactionCount: number; saldo: number }) {
  const { slug } = useParams();
  return <FinanceiroFeatureRoute category="operacional" slug={slug ?? ""} transactionCount={transactionCount} saldo={saldo} />;
}

function FinanceiroGestaoFeaturePage({ transactionCount, saldo }: { transactionCount: number; saldo: number }) {
  const { slug } = useParams();
  return <FinanceiroFeatureRoute category="gestao" slug={slug ?? ""} transactionCount={transactionCount} saldo={saldo} />;
}

const ContasReceberView = ({ transactions, loading, refresh, onTransfer, onDetailClick, onAddClick }: any) => {
  const navigate = useNavigate();
  const { getRoute, goToTransaction } = useFinanceiroTransactionNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState<'dia' | 'semana' | 'mes' | 'ano' | 'todos'>('todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const invoices = transactions.filter((t: any) => t.tipo === 'receita');

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      refresh();
      if ((window as any).showToast) (window as any).showToast('success', 'Fatura removida do banco!', 'Sucesso');
    }
  };

  const filteredInvoices = invoices.filter((item: any) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.descricao.toLowerCase().includes(term) ||
      item.categoria.toLowerCase().includes(term);
    if (!matchesSearch) return false;

    if (period === 'todos') return true;

    const dateVal = item.data_vencimento || item.paid_at || item.created_at;
    if (!dateVal) return true;

    const itemDate = new Date(dateVal);
    const today = new Date();
    const itemTime = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const diffDays = Math.abs((itemTime - todayTime) / (1000 * 60 * 60 * 24));

    if (period === 'dia') return diffDays === 0;
    if (period === 'semana') return diffDays <= 7;
    if (period === 'mes') return diffDays <= 30;
    if (period === 'ano') return diffDays <= 365;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map((item: any) => item.id));
    }
  };

  const handleExcelExport = () => {
    const itemsToExport = selectedIds.length > 0
      ? filteredInvoices.filter((item: any) => selectedIds.includes(item.id))
      : filteredInvoices;

    const columns = ['Descrição', 'Categoria', 'Vencimento', 'Valor (R$)'];
    const rows = itemsToExport.map((item: any) => [
      item.descricao,
      item.categoria,
      new Date(item.data_vencimento).toLocaleDateString('pt-BR'),
      item.valor
    ]);
    downloadExcelCsv({
      title: 'Contas a Receber',
      filenameBase: 'contas-a-receber',
      columns,
      rows,
      meta: {
        companyName: 'Logta SaaS',
        filtersSummary: `Busca: "${searchTerm}", Período: ${period}, Itens: ${itemsToExport.length}`
      }
    });
  };

  const handlePdfExport = () => {
    const itemsToExport = selectedIds.length > 0
      ? filteredInvoices.filter((item: any) => selectedIds.includes(item.id))
      : filteredInvoices;

    const columns = ['Descrição', 'Categoria', 'Vencimento', 'Valor (R$)'];
    const rows = itemsToExport.map((item: any) => [
      item.descricao,
      item.categoria,
      new Date(item.data_vencimento).toLocaleDateString('pt-BR'),
      `R$ ${item.valor.toLocaleString('pt-BR')}`
    ]);
    downloadPdfTable({
      title: 'Contas a Receber',
      filenameBase: 'contas-a-receber',
      columns,
      rows,
      meta: {
        companyName: 'Logta SaaS',
        filtersSummary: `Busca: "${searchTerm}", Período: ${period}, Itens: ${itemsToExport.length}`
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Premium Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative min-w-[280px] flex-1 sm:flex-initial">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 pl-11 pr-4 py-2.5 rounded-full text-xs font-bold text-gray-800 placeholder-gray-400 focus:border-primary outline-none transition-all shadow-inner focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-gray-50/50 border border-gray-200 p-1 rounded-full">
            {(['todos', 'dia', 'semana', 'mes', 'ano'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                  period === p
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                }`}
              >
                {p === 'todos' ? 'Todos' : p === 'dia' ? 'Hoje' : p === 'semana' ? '7d' : p === 'mes' ? 'Mês' : 'Ano'}
              </button>
            ))}
          </div>
          
          {selectedIds.length > 0 && (
            <span className="text-[10px] font-black uppercase text-primary animate-pulse bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-full">
              {selectedIds.length} selecionado(s) para baixar
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExcelExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 hover:text-emerald-600 hover:border-emerald-200 border border-gray-200 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <FileText size={14} className="text-emerald-500" />
            Excel
          </button>
          <button
            type="button"
            onClick={handlePdfExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 hover:text-rose-600 hover:border-rose-200 border border-gray-200 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <Download size={14} className="text-rose-500" />
            PDF
          </button>
          
          <button
            type="button"
            onClick={onAddClick}
            className="flex items-center justify-center w-9 h-9 bg-primary text-white hover:opacity-90 rounded-full transition-all shadow-md shadow-primary/20 cursor-pointer"
            title="Novo Recebível"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="logta-panel-card overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-xs font-bold text-gray-400 uppercase">Buscando dados no Supabase...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-5 text-center w-12">
                  <input
                    type="checkbox"
                    checked={filteredInvoices.length > 0 && selectedIds.length === filteredInvoices.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Descrição</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Vencimento</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal text-right">Valor</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((item: any) => {
                const path = getRoute(item);
                const isRecurring = item.descricao.toLowerCase().includes('recorrente') || item.categoria.toLowerCase().includes('recorrente') || item.descricao.toLowerCase().includes('contrato');
                const isOverdue = !item.paid_at && item.data_vencimento && new Date(item.data_vencimento).getTime() < Date.now() - 12 * 60 * 60 * 1000;
                
                return (
                  <tr
                    key={item.id}
                    className="group cursor-pointer transition-colors hover:bg-gray-50"
                    onClick={() => {
                      if (path) {
                        goToTransaction(item);
                      } else if (onDetailClick) {
                        onDetailClick(item);
                      }
                    }}
                    title={path ? "Ir para página associada" : "Ver detalhes do recebível"}
                  >
                    <td className="px-6 py-6 text-center w-12" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-gray-900">{item.descricao}</p>
                        {isRecurring && (
                          <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase text-blue-600 border border-blue-100">
                            <Repeat size={10} />
                            Recorrente
                          </span>
                        )}
                        {isOverdue && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if ((window as any).showToast) {
                                (window as any).showToast(
                                  'info',
                                  'Esta fatura está atrasada e pendente. As faturas em atraso ficam listadas automaticamente na aba de Alertas e Inadimplência.',
                                  'Inadimplência / Atraso'
                                );
                              }
                            }}
                            className="cursor-help flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-black uppercase text-red-600 border border-red-100 hover:scale-105 transition-all"
                            title="Fatura atrasada. Clique para ver onde fica."
                          >
                            ⚠️ Em Atraso
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold uppercase text-gray-400">{item.categoria}</p>
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-gray-600">
                      {new Date(item.data_vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-gray-900">
                      R$ {item.valor.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        {path ? <ChevronRight size={18} className="text-gray-300" /> : null}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(item.id);
                          }}
                          className="cursor-pointer p-2 text-gray-400 transition-all hover:text-red-500"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20">
                    <LogtaEmptyState
                      type="financeiro"
                      onAction={onAddClick}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const ContasPagarView = ({ transactions, loading, refresh, onPayClick, onAddClick }: any) => {
  const { getRoute, goToTransaction } = useFinanceiroTransactionNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState<'dia' | 'semana' | 'mes' | 'ano' | 'todos'>('todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const bills = transactions.filter((t: any) => t.tipo === 'despesa');

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      if (refresh) refresh();
      if ((window as any).showToast) (window as any).showToast('success', 'Despesa removida do banco!', 'Sucesso');
    }
  };

  const filteredBills = bills.filter((item: any) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.descricao.toLowerCase().includes(term) ||
      item.categoria.toLowerCase().includes(term);
    if (!matchesSearch) return false;

    if (period === 'todos') return true;

    const dateVal = item.data_vencimento || item.paid_at || item.created_at;
    if (!dateVal) return true;

    const itemDate = new Date(dateVal);
    const today = new Date();
    const itemTime = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const diffDays = Math.abs((itemTime - todayTime) / (1000 * 60 * 60 * 24));

    if (period === 'dia') return diffDays === 0;
    if (period === 'semana') return diffDays <= 7;
    if (period === 'mes') return diffDays <= 30;
    if (period === 'ano') return diffDays <= 365;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredBills.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBills.map((item: any) => item.id));
    }
  };

  const handleExcelExport = () => {
    const itemsToExport = selectedIds.length > 0
      ? filteredBills.filter((item: any) => selectedIds.includes(item.id))
      : filteredBills;

    const columns = ['Descrição', 'Categoria', 'Vencimento', 'Valor (R$)'];
    const rows = itemsToExport.map((item: any) => [
      item.descricao,
      item.categoria,
      new Date(item.data_vencimento).toLocaleDateString('pt-BR'),
      item.valor
    ]);
    downloadExcelCsv({
      title: 'Contas a Pagar',
      filenameBase: 'contas-a-pagar',
      columns,
      rows,
      meta: {
        companyName: 'Logta SaaS',
        filtersSummary: `Busca: "${searchTerm}", Período: ${period}, Itens: ${itemsToExport.length}`
      }
    });
  };

  const handlePdfExport = () => {
    const itemsToExport = selectedIds.length > 0
      ? filteredBills.filter((item: any) => selectedIds.includes(item.id))
      : filteredBills;

    const columns = ['Descrição', 'Categoria', 'Vencimento', 'Valor (R$)'];
    const rows = itemsToExport.map((item: any) => [
      item.descricao,
      item.categoria,
      new Date(item.data_vencimento).toLocaleDateString('pt-BR'),
      `R$ ${item.valor.toLocaleString('pt-BR')}`
    ]);
    downloadPdfTable({
      title: 'Contas a Pagar',
      filenameBase: 'contas-a-pagar',
      columns,
      rows,
      meta: {
        companyName: 'Logta SaaS',
        filtersSummary: `Busca: "${searchTerm}", Período: ${period}, Itens: ${itemsToExport.length}`
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Premium Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative min-w-[280px] flex-1 sm:flex-initial">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 pl-11 pr-4 py-2.5 rounded-full text-xs font-bold text-gray-800 placeholder-gray-400 focus:border-primary outline-none transition-all shadow-inner focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-gray-50/50 border border-gray-200 p-1 rounded-full">
            {(['todos', 'dia', 'semana', 'mes', 'ano'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                  period === p
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                }`}
              >
                {p === 'todos' ? 'Todos' : p === 'dia' ? 'Hoje' : p === 'semana' ? '7d' : p === 'mes' ? 'Mês' : 'Ano'}
              </button>
            ))}
          </div>
          
          {filteredBills.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50/50 border border-gray-200 px-4 py-2 rounded-full hover:bg-white transition-all text-xs font-bold text-gray-700">
              <input
                type="checkbox"
                checked={filteredBills.length > 0 && selectedIds.length === filteredBills.length}
                onChange={toggleAll}
                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <span className="text-[10px] uppercase font-black tracking-wider">Ticar Todos</span>
            </label>
          )}

          {selectedIds.length > 0 && (
            <span className="text-[10px] font-black uppercase text-primary animate-pulse bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-full">
              {selectedIds.length} selecionado(s) para baixar
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExcelExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 hover:text-emerald-600 hover:border-emerald-200 border border-gray-200 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <FileText size={14} className="text-emerald-500" />
            Excel
          </button>
          <button
            type="button"
            onClick={handlePdfExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 hover:text-rose-600 hover:border-rose-200 border border-gray-200 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <Download size={14} className="text-rose-500" />
            PDF
          </button>
          
          <button
            type="button"
            onClick={onAddClick}
            className="flex items-center justify-center w-9 h-9 bg-primary text-white hover:opacity-90 rounded-full transition-all shadow-md shadow-primary/20 cursor-pointer"
            title="Nova Despesa"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="logta-panel-card p-8">
        <h3 className="logta-card-heading mb-8">Vencimentos Reais</h3>
        <p className="text-xs text-gray-500 mb-6 font-medium">Clique em uma despesa para registrar o pagamento.</p>
        <div className="space-y-4">
          {loading ? (
            <Loader2 className="animate-spin text-primary mx-auto block" />
          ) : (
            filteredBills.map((p: any) => {
              const isRecurring = p.descricao.toLowerCase().includes('recorrente') || p.categoria.toLowerCase().includes('recorrente') || p.descricao.toLowerCase().includes('contrato');
              const isOverdue = !p.paid_at && p.data_vencimento && new Date(p.data_vencimento).getTime() < Date.now() - 12 * 60 * 60 * 1000;
              const path = getRoute(p);
              
              return (
                <div
                  key={p.id}
                  className={`w-full p-6 bg-gray-50/50 border border-gray-100 hover:border-primary/30 hover:bg-white rounded-[32px] transition-all flex items-center justify-between group text-left ${
                    path ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (path) {
                      goToTransaction(p);
                    } else if (onPayClick) {
                      onPayClick(p);
                    }
                  }}
                  title={path ? 'Ir para página associada' : 'Ver detalhes da despesa'}
                >
                  <div className="flex items-center gap-6">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(p.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPayClick?.(p);
                      }}
                      className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-red-500 border border-gray-100 hover:scale-105 transition-all cursor-pointer shadow-inner"
                      title="Registrar pagamento"
                    >
                      <TrendingDown size={20} />
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold text-gray-900">{p.descricao}</p>
                        {isRecurring && (
                          <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase text-blue-600 border border-blue-100">
                            <Repeat size={10} />
                            Recorrente
                          </span>
                        )}
                        {isOverdue && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if ((window as any).showToast) {
                                (window as any).showToast(
                                  'info',
                                  'Esta despesa está vencida e pendente de pagamento. Despesas vencidas aparecem listadas na aba de Alertas e central de Custos.',
                                  'Aviso de Vencimento'
                                );
                              }
                            }}
                            className="cursor-help flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-black uppercase text-red-600 border border-red-100 hover:scale-105 transition-all"
                            title="Despesa atrasada. Clique para ver onde fica."
                          >
                            ⚠️ Em Atraso
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{p.categoria}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <div className="text-right">
                      <p className="text-xs font-black text-gray-900">R$ {p.valor.toLocaleString('pt-BR')}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        {new Date(p.data_vencimento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPayClick?.(p);
                        }}
                        className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer font-bold"
                      >
                        Pagar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-150 transition-all cursor-pointer"
                        title="Deletar despesa"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {!loading && filteredBills.length === 0 && (
            <LogtaEmptyState
              type="financeiro"
              onAction={onAddClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const FluxoCaixaView = ({ transactions, loading, refresh, onTransactionClick, onAddClick }: any) => {
  const navigate = useNavigate();
  const { getRoute, goToTransaction } = useFinanceiroTransactionNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState<'dia' | 'semana' | 'mes' | 'ano' | 'todos'>('todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sorted = [...transactions].sort((a: any, b: any) => {
    const da = new Date(a.data_vencimento || 0).getTime();
    const db = new Date(b.data_vencimento || 0).getTime();
    return da - db;
  });

  let saldo = 0;
  const allRows = sorted.map((t: any) => {
    const delta = t.tipo === 'receita' ? Number(t.valor) || 0 : -(Number(t.valor) || 0);
    saldo += delta;
    return { ...t, delta, saldoAcum: saldo };
  });

  const filteredRows = allRows.filter((item: any) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.descricao.toLowerCase().includes(term) ||
      item.categoria.toLowerCase().includes(term);
    if (!matchesSearch) return false;

    if (period === 'todos') return true;

    const dateVal = item.data_vencimento || item.paid_at || item.created_at;
    if (!dateVal) return true;

    const itemDate = new Date(dateVal);
    const today = new Date();
    const itemTime = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const diffDays = Math.abs((itemTime - todayTime) / (1000 * 60 * 60 * 24));

    if (period === 'dia') return diffDays === 0;
    if (period === 'semana') return diffDays <= 7;
    if (period === 'mes') return diffDays <= 30;
    if (period === 'ano') return diffDays <= 365;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredRows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRows.map((item: any) => item.id));
    }
  };

  const handleExcelExport = () => {
    const itemsToExport = selectedIds.length > 0
      ? filteredRows.filter((item: any) => selectedIds.includes(item.id))
      : filteredRows;

    const columns = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor (R$)', 'Saldo Acumulado (R$)'];
    const rows = itemsToExport.map((item: any) => [
      item.data_vencimento ? new Date(item.data_vencimento).toLocaleDateString('pt-BR') : '—',
      item.descricao,
      item.categoria,
      item.tipo === 'receita' ? 'Entrada' : 'Saída',
      item.valor,
      item.saldoAcum
    ]);
    downloadExcelCsv({
      title: 'Fluxo de Caixa Projetado',
      filenameBase: 'fluxo-de-caixa',
      columns,
      rows,
      meta: {
        companyName: 'Logta SaaS',
        filtersSummary: `Busca: "${searchTerm}", Período: ${period}, Itens: ${itemsToExport.length}`
      }
    });
  };

  const handlePdfExport = () => {
    const itemsToExport = selectedIds.length > 0
      ? filteredRows.filter((item: any) => selectedIds.includes(item.id))
      : filteredRows;

    const columns = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Saldo Acum.'];
    const rows = itemsToExport.map((item: any) => [
      item.data_vencimento ? new Date(item.data_vencimento).toLocaleDateString('pt-BR') : '—',
      item.descricao,
      item.categoria,
      item.tipo === 'receita' ? 'Entrada' : 'Saída',
      `R$ ${item.valor.toLocaleString('pt-BR')}`,
      `R$ ${item.saldoAcum.toLocaleString('pt-BR')}`
    ]);
    downloadPdfTable({
      title: 'Fluxo de Caixa Projetado',
      filenameBase: 'fluxo-de-caixa',
      columns,
      rows,
      meta: {
        companyName: 'Logta SaaS',
        filtersSummary: `Busca: "${searchTerm}", Período: ${period}, Itens: ${itemsToExport.length}`
      }
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      if (refresh) refresh();
      if ((window as any).showToast) (window as any).showToast('success', 'Movimentação excluída!', 'Sucesso');
    }
  };

  const handleToggleUnpaid = async (item: any) => {
    const newPaidAt = item.paid_at ? null : new Date().toISOString();
    const { error } = await supabase
      .from('transactions')
      .update({ paid_at: newPaidAt })
      .eq('id', item.id);
    if (!error) {
      if (refresh) refresh();
      if ((window as any).showToast) {
        (window as any).showToast(
          'success',
          newPaidAt ? 'Lançamento marcado como pago/recebido!' : 'Lançamento marcado como pendente (não pago).',
          'Sucesso'
        );
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Premium Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative min-w-[280px] flex-1 sm:flex-initial">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 pl-11 pr-4 py-2.5 rounded-full text-xs font-bold text-gray-800 placeholder-gray-400 focus:border-primary outline-none transition-all shadow-inner focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-gray-50/50 border border-gray-200 p-1 rounded-full">
            {(['todos', 'dia', 'semana', 'mes', 'ano'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                  period === p
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                }`}
              >
                {p === 'todos' ? 'Todos' : p === 'dia' ? 'Hoje' : p === 'semana' ? '7d' : p === 'mes' ? 'Mês' : 'Ano'}
              </button>
            ))}
          </div>
          
          {selectedIds.length > 0 && (
            <span className="text-[10px] font-black uppercase text-primary animate-pulse bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-full">
              {selectedIds.length} selecionado(s) para baixar
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExcelExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 hover:text-emerald-600 hover:border-emerald-200 border border-gray-200 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <FileText size={14} className="text-emerald-500" />
            Excel
          </button>
          <button
            type="button"
            onClick={handlePdfExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 hover:text-rose-600 hover:border-rose-200 border border-gray-200 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <Download size={14} className="text-rose-500" />
            PDF
          </button>
          
          <button
            type="button"
            onClick={onAddClick}
            className="flex items-center justify-center w-9 h-9 bg-primary text-white hover:opacity-90 rounded-full transition-all shadow-md shadow-primary/20 cursor-pointer"
            title="Novo Lançamento"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="logta-panel-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-xs font-bold uppercase text-gray-400">Carregando transações…</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-5 text-center w-12">
                  <input
                    type="checkbox"
                    checked={filteredRows.length > 0 && selectedIds.length === filteredRows.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">Data</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">Descrição</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">Tipo</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-normal text-gray-400">Valor</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-normal text-gray-400">
                  Saldo após
                </th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-normal text-gray-400">
                  Ação / Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((item: any) => {
                const path = getRoute(item);
                const isRecurring = item.descricao.toLowerCase().includes('recorrente') || item.categoria.toLowerCase().includes('recorrente') || item.descricao.toLowerCase().includes('contrato');
                const isOverdue = !item.paid_at && item.data_vencimento && new Date(item.data_vencimento).getTime() < Date.now() - 12 * 60 * 60 * 1000;
                
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50/80 group ${path ? 'cursor-pointer' : ''}`}
                    onClick={() => path && goToTransaction(item)}
                    title={path ? 'Abrir registro relacionado' : undefined}
                  >
                    <td className="px-6 py-6 text-center w-12" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-8 py-4 text-xs font-bold text-gray-600">
                      {item.data_vencimento
                        ? new Date(item.data_vencimento).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold text-gray-900">{item.descricao}</p>
                        {isRecurring && (
                          <span className="flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase text-blue-600 border border-blue-100">
                            <Repeat size={9} />
                            Recorrente
                          </span>
                        )}
                        {isOverdue && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if ((window as any).showToast) {
                                (window as any).showToast(
                                  'info',
                                  'Este lançamento está atrasado e pendente. As faturas em atraso ficam listadas automaticamente na aba de Alertas e Inadimplência.',
                                  'Aviso de Atraso'
                                );
                              }
                            }}
                            className="cursor-help flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-black uppercase text-red-600 border border-red-100 hover:scale-105 transition-all"
                            title="Lançamento atrasado. Clique para saber mais."
                          >
                            ⚠️ Em Atraso
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold uppercase text-gray-400">{item.categoria}</p>
                    </td>
                    <td className="px-8 py-4">
                      <span
                        className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase ${
                          item.tipo === 'receita' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {item.tipo === 'receita' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right text-xs font-black text-gray-900">
                      {item.tipo === 'receita' ? '+' : '−'} R$ {Number(item.valor).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-8 py-4 text-right text-xs font-bold text-primary">
                      R$ {item.saldoAcum.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-8 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleToggleUnpaid(item);
                          }}
                          className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase border transition-all cursor-pointer ${
                            item.paid_at
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                          title={item.paid_at ? 'Marcar como Pendente (Não Recebido/Pago)' : 'Marcar como Recebido/Pago'}
                        >
                          {item.paid_at ? 'Pago/Recebido' : 'Pendente'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(item.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
                          title="Excluir lançamento"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-8">
                    <LogtaEmptyState type="financeiro" onAction={onAddClick} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-start gap-4 rounded-[32px] border border-gray-100 bg-gray-50/50 p-6">
        <PieChart size={28} className="shrink-0 text-primary" />
        <p className="text-xs font-medium leading-relaxed text-gray-600">
          O saldo após cada linha é uma projeção sequencial (entradas somam, saídas subtraem). Use{' '}
          <strong className="text-gray-900">Contas a pagar/receber</strong> ou a coluna ação para marcar despesas/receitas como pagas/recebidas
          quando integrar o status no banco.
        </p>
      </div>
    </div>
  );
};

export default Financeiro;
