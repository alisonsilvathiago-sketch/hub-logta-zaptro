import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  FinanceiroModuleHub,
  FinanceiroFeatureRoute,
  FinanceiroExecutiveDashboard,
  FinanceiroAlertasView,
  FinanceiroCalculadoraView,
  FinanceiroCentralOperacional,
  FinanceiroIntelligenceProvider,
  FinanceiroMonitoringBar,
  FinanceiroAlertPopup,
  computeFinanceiroAnalytics,
  useFinanceiroTransactionNavigation,
} from '../modules/financeiro';
import { useFinanceiroIntelligence } from '../modules/financeiro/context/FinanceiroIntelligenceContext';
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
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
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
    { id: 'gestao', label: 'Gestão', shortLabel: 'Gestão', icon: Briefcase, path: '/financeiro/gestao' },
    { id: 'receber', label: 'Receber', shortLabel: 'Receber', icon: TrendingUp, path: '/financeiro/receber' },
    { id: 'pagar', label: 'Pagar', shortLabel: 'Pagar', icon: TrendingDown, path: '/financeiro/pagar' },
    { id: 'fluxo', label: 'Fluxo', shortLabel: 'Fluxo', icon: PieChart, path: '/financeiro/fluxo' },
    { id: 'central', label: 'Central', shortLabel: 'Central', icon: Bell, path: '/financeiro/central' },
    { id: 'assistente', label: 'Assistente IA', shortLabel: 'IA', icon: Calculator, path: '/financeiro/assistente' },
  ];

  return (
    <FinanceiroIntelligenceProvider
      transactions={transactions}
      shipments={shipments}
      motoristas={motoristas}
      loading={loading}
    >
    <div className="logta-page relative w-full min-h-0 flex-1 space-y-8 animate-in fade-in duration-700">
      <LogtaModuleHeader
        title="Financeiro"
        subtitle="Sistema financeiro inteligente — monitoramento em tempo real, alertas proativos e IA operacional."
        tabs={<LogtaWaveTabStrip tabs={tabs} basePath="/financeiro" defaultTabId="dashboard" />}
        tabQuickAddLabel="Novo lançamento"
        onTabQuickAdd={() => setIsNovoLancamentoOpen(true)}
      />

      <FinanceiroIntelligenceShell />

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
          <Route path="assistente" element={<FinanceiroCalculadoraView />} />
          <Route path="central" element={<FinanceiroCentralOperacional />} />
          <Route path="alertas" element={<FinanceiroAlertasView />} />
          <Route
            path="receber"
            element={
              <ContasReceberView
                transactions={transactions}
                loading={loading}
                refresh={fetchFinanceiroData}
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
                  descricao: e.target.descricao.value,
                  tipo: e.target.tipo.value,
                  valor: e.target.valor.value,
                  categoria: e.target.categoria.value,
                };
                handleCreateLancamento(formData);
              }} className="p-8 space-y-5 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Descrição</label>
                  <input name="descricao" required placeholder="Ex: Pagamento Frete Agregado" className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white placeholder-neutral-500" />
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
                  <input name="categoria" placeholder="Ex: Combustível, Manutenção" className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white placeholder-neutral-500" />
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

function FinanceiroIntelligenceShell() {
  const { popupAlert, closePopup, dismissAlert, activeAlerts } = useFinanceiroIntelligence();

  return (
    <>
      <FinanceiroMonitoringBar />
      {popupAlert ? (
        <FinanceiroAlertPopup
          alert={popupAlert}
          onClose={closePopup}
          onDismiss={() => dismissAlert(popupAlert.id)}
          queueCount={activeAlerts.length}
        />
      ) : null}
    </>
  );
}

function FinanceiroOperacionalFeaturePage({ transactionCount, saldo }: { transactionCount: number; saldo: number }) {
  const { slug } = useParams();
  return <FinanceiroFeatureRoute category="operacional" slug={slug ?? ""} transactionCount={transactionCount} saldo={saldo} />;
}

function FinanceiroGestaoFeaturePage({ transactionCount, saldo }: { transactionCount: number; saldo: number }) {
  const { slug } = useParams();
  return <FinanceiroFeatureRoute category="gestao" slug={slug ?? ""} transactionCount={transactionCount} saldo={saldo} />;
}

const ContasReceberView = ({ transactions, loading, refresh, onTransfer, onDetailClick }: any) => {
  const navigate = useNavigate();
  const { getRoute, goToTransaction } = useFinanceiroTransactionNavigation();
  const invoices = transactions.filter((t: any) => t.tipo === 'receita');

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      refresh();
      if ((window as any).showToast) (window as any).showToast('success', 'Fatura removida do banco!', 'Sucesso');
    }
  };

  return (
    <div className="space-y-6">
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
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Descrição</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Vencimento</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal text-right">Valor</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((item: any) => {
                const path = getRoute(item);
                return (
                  <tr
                    key={item.id}
                    className="group cursor-pointer transition-colors hover:bg-gray-50"
                    onClick={() => {
                      if (onDetailClick) onDetailClick(item);
                      else if (path) goToTransaction(item);
                    }}
                    title="Ver detalhes do recebível"
                  >
                    <td className="px-8 py-6">
                      <p className="font-bold text-gray-900">{item.descricao}</p>
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
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20">
                    <LogtaEmptyState
                      type="financeiro"
                      onAction={() => navigate('/financeiro/fluxo')}
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

const ContasPagarView = ({ transactions, loading, onPayClick }: any) => {
  const bills = transactions.filter((t: any) => t.tipo === 'despesa');

  return (
    <div className="space-y-6">
      <div className="logta-panel-card p-8">
        <h3 className="logta-card-heading mb-8">Vencimentos Reais</h3>
        <p className="text-xs text-gray-500 mb-6">Clique em uma despesa para registrar o pagamento.</p>
        <div className="space-y-4">
          {loading ? (
            <Loader2 className="animate-spin text-primary mx-auto block" />
          ) : (
            bills.map((p: any) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPayClick?.(p)}
                className="w-full p-6 bg-gray-50/50 border border-transparent hover:border-primary/30 hover:bg-white rounded-[32px] transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-red-500">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{p.descricao}</p>
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
                  <span className="text-[10px] font-black uppercase text-primary">Pagar</span>
                </div>
              </button>
            ))
          )}
          {!loading && bills.length === 0 && (
            <LogtaEmptyState
              type="financeiro"
              onAction={() => (window as any).showToast?.('info', 'Cadastre uma despesa em Novo lançamento.', 'Contas a pagar')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const FluxoCaixaView = ({ transactions, loading, refresh, onTransactionClick }: any) => {
  const navigate = useNavigate();
  const { getRoute, goToTransaction } = useFinanceiroTransactionNavigation();
  const sorted = [...transactions].sort((a: any, b: any) => {
    const da = new Date(a.data_vencimento || 0).getTime();
    const db = new Date(b.data_vencimento || 0).getTime();
    return da - db;
  });

  let saldo = 0;
  const rows = sorted.map((t: any) => {
    const delta = t.tipo === 'receita' ? Number(t.valor) || 0 : -(Number(t.valor) || 0);
    saldo += delta;
    return { ...t, delta, saldoAcum: saldo };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="logta-card-heading">Fluxo de caixa</h3>
          <p className="text-xs text-gray-500 mt-1">Movimentações ordenadas por data de vencimento (saldo simulado).</p>
        </div>
        <button
          type="button"
          onClick={() => refresh?.()}
          className="hub-premium-pill secondary"
          style={{ padding: '8px 16px' }}
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Activity size={16} />}
          Atualizar
        </button>
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
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">Data</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">Descrição</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">Tipo</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-normal text-gray-400">Valor</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-normal text-gray-400">
                  Saldo após
                </th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-normal text-gray-400">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((item: any) => {
                const path = getRoute(item);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50/80 ${path ? 'cursor-pointer' : ''}`}
                    onClick={() => path && goToTransaction(item)}
                    title={path ? 'Abrir registro relacionado' : undefined}
                  >
                    <td className="px-8 py-4 text-xs font-bold text-gray-600">
                      {item.data_vencimento
                        ? new Date(item.data_vencimento).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-xs font-bold text-gray-900">{item.descricao}</p>
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
                      {item.tipo === 'despesa' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTransactionClick?.(item);
                          }}
                          className="text-[10px] font-black uppercase text-primary hover:underline"
                        >
                          Pagar
                        </button>
                      ) : path ? (
                        <ChevronRight size={16} className="mx-auto text-gray-300" />
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-8">
                    <LogtaEmptyState type="financeiro" onAction={() => navigate('/fretes/operacional')} />
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
          <strong className="text-gray-900">Contas a pagar</strong> ou a coluna ação para marcar despesas como pagas
          quando integrar o status no banco.
        </p>
      </div>
    </div>
  );
};

export default Financeiro;
