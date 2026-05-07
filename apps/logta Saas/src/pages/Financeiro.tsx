import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
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
  Phone
} from 'lucide-react';

const Financeiro = () => {
  const location = useLocation();
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isNovoLancamentoOpen, setIsNovoLancamentoOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lancamentoSuccess, setLancamentoSuccess] = useState(false);
  
  const tabs = [
    { id: 'dashboard', label: 'Financeiro', icon: Activity, path: '/financeiro/dashboard' },
    { id: 'receber', label: 'Contas a Receber', icon: TrendingUp, path: '/financeiro/receber' },
    { id: 'pagar', label: 'Contas a Pagar', icon: TrendingDown, path: '/financeiro/pagar' },
    { id: 'fluxo', label: 'Fluxo de Caixa', icon: PieChart, path: '/financeiro/fluxo' },
  ];

  return (
    <div className="px-16 py-10 w-full space-y-8 animate-in fade-in duration-700 relative h-full overflow-hidden">
      {/* Header Section */}
      <div className="flex justify-between items-end h-[87px]">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight h-[46px] mt-[74px]">Financeiro</h1>
          <p className="text-xs text-gray-400 font-medium mt-1">Controle total de entradas, saídas e saúde financeira da operação.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCalcOpen(true)}
            className="px-6 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-black/10 flex items-center gap-2 cursor-pointer"
          >
            <Zap size={16} fill="currentColor" /> Calculadora Inteligente
          </button>
          <button 
            onClick={() => {
              if ((window as any).showToast) {
                (window as any).showToast('success', 'Relatório financeiro gerado e exportado com sucesso!', 'Relatório Exportado');
              } else {
                alert('Relatório financeiro exportado com sucesso!');
              }
            }}
            className="px-6 py-3.5 bg-white text-gray-700 rounded-xl text-sm font-bold border border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Download size={16} /> Exportar Relatório
          </button>
          <button 
            onClick={() => setIsNovoLancamentoOpen(true)}
            className="px-6 py-3.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* Calculator Drawer */}
      {isCalcOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsCalcOpen(false)} />
          <div className="relative w-full max-w-5xl bg-[#18191B] max-h-[90vh] rounded-[32px] shadow-2xl border border-neutral-800 animate-in zoom-in duration-300 flex flex-col overflow-hidden text-white">
            <div className="p-8 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/40">
              <div>
                <h2 className="text-2xl font-black text-white">Calculadora Log</h2>
              </div>
              <button 
                onClick={() => setIsCalcOpen(false)}
                className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Left Column: Simulation */}
                <div className="space-y-8">
                  <section className="space-y-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-normal border-l-4 border-primary pl-3">Simulação de Cenário</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase">Aumento de Fretes (%)</label>
                        <input type="number" defaultValue="10" className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary/50 font-bold text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase">Redução de Custos (%)</label>
                        <input type="number" defaultValue="5" className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary/50 font-bold text-white" />
                      </div>
                    </div>
                    
                    <div className="bg-primary/5 border border-primary/10 p-6 rounded-[32px] relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-primary uppercase tracking-normal mb-1">Impacto Estimado no Lucro</p>
                        <h4 className="text-3xl font-black text-primary">+ R$ 18.420,00</h4>
                        <p className="text-[10px] text-neutral-400 mt-2">Sua margem passaria de 20% para 24.2%.</p>
                      </div>
                      <TrendingUp size={100} className="absolute -right-4 -bottom-4 text-primary opacity-5" />
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-normal border-l-4 border-neutral-400 pl-3">Histórico de Simulações</h3>
                    <div className="space-y-3">
                      {[
                        { date: 'Hoje, 10:45', scenario: '+15% Fretes / -2% Custos', result: '+ R$ 22.4k' },
                        { date: 'Ontem, 16:20', scenario: 'Redução 10% Combustível', result: '+ R$ 4.1k' },
                      ].map((h, i) => (
                        <div key={i} className="p-4 bg-neutral-900 border border-neutral-850 rounded-2xl flex items-center justify-between hover:border-primary/30 transition-all cursor-pointer">
                          <div>
                            <p className="text-xs font-bold text-white">{h.scenario}</p>
                            <p className="text-[10px] text-neutral-400 font-medium uppercase">{h.date}</p>
                          </div>
                          <span className="text-xs font-black text-primary">{h.result}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Column: Metrics */}
                <div className="space-y-8">
                  <section className="space-y-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-normal border-l-4 border-blue-500 pl-3">Métricas Operacionais</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Custo Médio por KM', val: 'R$ 4,82', icon: Truck, color: 'text-blue-400' },
                        { label: 'Lucro Médio por Frete', val: 'R$ 1.250', icon: DollarSign, color: 'text-primary' },
                        { label: 'Impacto Inadimplência', val: 'R$ 12.800', icon: AlertCircle, color: 'text-red-400' },
                      ].map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-neutral-900 rounded-2xl border border-neutral-850">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neutral-850 shadow-sm flex items-center justify-center text-white">
                              <m.icon size={16} />
                            </div>
                            <span className="text-xs font-bold text-neutral-300">{m.label}</span>
                          </div>
                          <span className="text-sm font-black text-white">{m.val}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

              </div>
            </div>

            <div className="p-8 bg-neutral-900/40 border-t border-neutral-800 grid grid-cols-2 gap-4">
              <button className="py-4 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-xl font-bold hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer border border-neutral-800">
                <FileText size={18} /> Ver Detalhado
              </button>
              <button className="py-4 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer">
                <CheckCircle2 size={18} /> Aplicar no Relatório
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs (Native Links) */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-[24px] w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path) || (location.pathname === '/financeiro' && tab.id === 'dashboard');
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all
                ${isActive 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
            >
              <Icon size={18} className={isActive ? 'text-primary' : 'text-gray-400'} />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Sub-views via Routes */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Routes>
          <Route index element={<Navigate to="/financeiro/dashboard" replace />} />
          <Route path="dashboard" element={<FinanceiroDashboardView />} />
          <Route path="receber" element={<ContasReceberView />} />
          <Route path="pagar" element={<ContasPagarView onPayClick={(p: any) => { setSelectedPayment(p); setIsPaymentModalOpen(true); }} />} />
          <Route path="fluxo" element={<FluxoCaixaView onTransactionClick={(t: any) => { setSelectedPayment(t); setIsPaymentModalOpen(true); }} />} />
        </Routes>
      </div>

      {/* Novo Lançamento Modal */}
      {isNovoLancamentoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsNovoLancamentoOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#18191B] rounded-[32px] shadow-2xl border border-neutral-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden text-white">
            <div className="px-8 py-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/40">
              <h3 className="text-xl font-bold text-white">Novo Lançamento</h3>
              <button onClick={() => setIsNovoLancamentoOpen(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            {lancamentoSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-green-950/40 text-green-400 rounded-full flex items-center justify-center border border-neutral-850 shadow-inner">
                  <CheckCircle2 size={36} className="animate-bounce" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Lançamento Salvo!</h4>
                  <p className="text-xs text-neutral-400 mt-1">O registro financeiro foi lançado e atualizado no fluxo de caixa.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                setLancamentoSuccess(true);
                if ((window as any).showToast) {
                  (window as any).showToast('success', 'Novo lançamento registrado no fluxo com sucesso!', 'Lançamento Efetuado');
                }
                setTimeout(() => {
                  setLancamentoSuccess(false);
                  setIsNovoLancamentoOpen(false);
                }, 2000);
              }} className="p-8 space-y-5 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Descrição / Categoria</label>
                  <input required placeholder="Ex: Pagamento Frete Agregado" className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white placeholder-neutral-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Tipo</label>
                    <select className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white">
                      <option className="bg-neutral-900" value="out">Despesa (Saída)</option>
                      <option className="bg-neutral-900" value="in">Receita (Entrada)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Valor</label>
                    <input required type="text" placeholder="R$ 0,00" className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white placeholder-neutral-500" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Destinatário / Favorecido</label>
                  <input placeholder="Ex: Posto Rodovia SA" className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white placeholder-neutral-500" />
                </div>
                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 cursor-pointer">
                  Confirmar Lançamento
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {isPaymentModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsPaymentModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#18191B] rounded-[32px] shadow-2xl border border-neutral-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden text-white">
            <div className="px-8 py-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/40">
              <h3 className="text-xl font-bold text-white">Confirmar Pagamento</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            {paymentSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-green-950/40 text-green-400 rounded-full flex items-center justify-center border border-neutral-850 shadow-inner">
                  <CheckCircle2 size={36} className="animate-bounce" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Pagamento Realizado!</h4>
                  <p className="text-xs text-neutral-400 mt-1">O valor de {selectedPayment.value} foi transferido com sucesso para {selectedPayment.recipient}.</p>
                </div>
              </div>
            ) : (
              <div className="p-8 space-y-6">
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-[24px] space-y-4 text-left">
                  <div className="flex justify-between border-b border-neutral-800 pb-3">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Favorecido</span>
                    <span className="text-xs font-black text-white">{selectedPayment.recipient}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-800 pb-3">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Categoria</span>
                    <span className="text-xs font-black text-white">{selectedPayment.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Valor Total</span>
                    <span className="text-sm font-black text-white">{selectedPayment.value}</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-4 bg-neutral-900 text-neutral-300 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all cursor-pointer border border-neutral-800">
                    Cancelar
                  </button>
                  <button onClick={() => {
                    setPaymentSuccess(true);
                    setTimeout(() => {
                      setPaymentSuccess(false);
                      setIsPaymentModalOpen(false);
                    }, 2000);
                  }} className="flex-1 py-4 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 cursor-pointer">
                    Confirmar e Pagar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-View Components ---

const FinanceiroDashboardView = () => (
  <div className="space-y-8">
    {/* KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[
        { label: 'Receita Total', value: 'R$ 482.5k', change: '+12.5%', isUp: true, color: 'text-gray-900' },
        { label: 'Despesas Totais', value: 'R$ 312.4k', change: '-2.4%', isUp: false, color: 'text-red-500' },
        { label: 'Lucro Líquido', value: 'R$ 170.1k', change: '+18.1%', isUp: true, color: 'text-primary' },
        { label: 'Inadimplência', value: '2.4%', change: '+0.2%', isUp: false, color: 'text-yellow-600' },
      ].map((stat, i) => (
        <div key={i} className="bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">{stat.label}</p>
          <h4 className={`text-2xl font-black ${stat.color}`}>{stat.value}</h4>
          <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold ${stat.isUp ? 'text-green-500' : 'text-red-500'}`}>
            {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {stat.change} vs mês ant.
          </div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold text-gray-900">Performance Financeira por Frete</h3>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase text-gray-400 tracking-normal">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-primary rounded-full" /> Receita</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-400 rounded-full" /> Custo</div>
          </div>
        </div>
        <div className="space-y-6">
          {[
            { label: 'Logística Express SP', revenue: 85, cost: 45, profit: 'R$ 1.250' },
            { label: 'Transportes Transville', revenue: 65, cost: 55, profit: 'R$ 480' },
            { label: 'Varejo Global LTDA', revenue: 95, cost: 35, profit: 'R$ 2.400' },
            { label: 'AgroBrasil Log', revenue: 45, cost: 60, profit: '- R$ 120', warning: true },
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-gray-900">{item.label}</span>
                <span className={`text-[10px] font-black ${item.warning ? 'text-red-500' : 'text-primary'}`}>{item.profit}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-primary" style={{ width: `${item.revenue}%` }} />
                <div className="h-full bg-red-400" style={{ width: `${item.cost}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-[40px] p-8 text-white flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold mb-6">Faturamento Pendente</h3>
          <div className="space-y-4">
            <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-[10px] font-black text-primary uppercase tracking-normal mb-1">A Faturar (CT-e Emitidos)</p>
              <h4 className="text-2xl font-black">R$ 124.500</h4>
              <p className="text-[10px] text-gray-500 mt-2">Equivalente a 82 documentos.</p>
            </div>
            <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-normal mb-1">Inadimplência Crítica</p>
              <h4 className="text-2xl font-black text-yellow-500">R$ 12.800</h4>
              <p className="text-[10px] text-gray-500 mt-2">5 clientes com +30 dias de atraso.</p>
            </div>
          </div>
        </div>
        <button className="w-full mt-8 py-4 bg-primary text-white rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2">
          <Zap size={18} fill="currentColor" /> Ver Análise de Risco
        </button>
      </div>
    </div>
  </div>
);

const ContasReceberView = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [actionsInvoice, setActionsInvoice] = useState<any>(null);
  const [invoices, setInvoices] = useState([
    { id: 'FT-8901', client: 'Logística Express SP', date: '01/05', due: '15/05', value: 'R$ 4.500,00', status: 'Pendente', email: 'financeiro@expresssp.com.br', phone: '11988887766' },
    { id: 'FT-8902', client: 'Indústria Metal SA', date: '28/04', due: '05/05', value: 'R$ 8.200,00', status: 'Atrasado', critical: true, email: 'contas@indmetal.com.br', phone: '11977776655' },
    { id: 'FT-8903', client: 'AgroBrasil Log', date: '02/05', due: '12/05', value: 'R$ 12.000,00', status: 'Recebido', email: 'faturamento@agrobrasil.com.br', phone: '65966665544' },
  ]);

  const handleDelete = (id: string) => {
    setInvoices(prev => prev.filter(item => item.id !== id));
    setSelectedInvoice(null);
    setActionsInvoice(null);
    if ((window as any).showToast) {
      (window as any).showToast('success', 'Fatura excluída com sucesso!', 'Fatura Removida');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Filtrar por cliente, fatura ou vencimento..." 
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 outline-none focus:border-primary/50 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {['Pendentes', 'Atrasados', 'Recebidos'].map(f => (
            <button key={f} className="px-6 py-4 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-500 hover:text-gray-900 hover:border-primary/30 transition-all shadow-sm cursor-pointer">
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[40px] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Cliente / Fatura</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Emissão</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Vencimento</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal text-right">Valor</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal text-center">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((item, i) => (
              <tr 
                key={i} 
                onClick={() => setSelectedInvoice(item)}
                className="hover:bg-gray-50 transition-colors group cursor-pointer"
              >
                <td className="px-8 py-6">
                  <p className="font-bold text-gray-900 group-hover:text-primary transition-all">{item.client}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{item.id}</p>
                </td>
                <td className="px-8 py-6 text-xs font-bold text-gray-600">{item.date}</td>
                <td className={`px-8 py-6 text-xs font-bold ${item.critical ? 'text-red-500' : 'text-gray-900'}`}>{item.due}</td>
                <td className="px-8 py-6 text-right font-black text-gray-900">{item.value}</td>
                <td className="px-8 py-6">
                  <div className="flex justify-center">
                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-normal ${
                      item.status === 'Recebido' ? 'bg-green-100 text-green-700' : 
                      item.status === 'Atrasado' ? 'bg-red-100 text-red-700 animate-pulse' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setSelectedInvoice(item)} className="p-2 text-gray-400 hover:text-primary transition-all cursor-pointer"><Mail size={18} /></button>
                    <button onClick={() => setSelectedInvoice(item)} className="p-2 text-gray-400 hover:text-primary transition-all cursor-pointer"><FileText size={18} /></button>
                    <button onClick={() => setActionsInvoice(item)} className="p-2 text-gray-400 hover:text-primary transition-all cursor-pointer"><MoreVertical size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETALHES DA FATURA MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedInvoice(null)} />
          <div className="relative w-full max-w-md bg-[#18191B] rounded-[32px] shadow-2xl border border-neutral-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden text-white p-8">
            <button 
              onClick={() => setSelectedInvoice(null)} 
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center font-bold text-neutral-400 hover:text-white cursor-pointer transition-all border border-neutral-800"
            >
              ✕
            </button>

            <div className="space-y-6">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white leading-tight">{selectedInvoice.client}</h3>
                  <p className="text-xs text-neutral-400 font-bold uppercase">{selectedInvoice.id}</p>
                </div>
              </div>

              <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-5 space-y-3.5 text-sm text-left">
                <div className="flex justify-between items-center border-b border-neutral-850 pb-2.5">
                  <span className="text-[10px] font-black text-neutral-400 uppercase">Status</span>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-normal ${
                    selectedInvoice.status === 'Recebido' ? 'bg-green-950/40 text-green-400 border border-green-900/30' : 
                    selectedInvoice.status === 'Atrasado' ? 'bg-red-950/40 text-red-400 border border-red-900/30' : 
                    'bg-blue-950/40 text-blue-400 border border-blue-900/30'
                  }`}>
                    {selectedInvoice.status}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-850 pb-2.5">
                  <span className="text-[10px] font-black text-neutral-400 uppercase">Data de Emissão</span>
                  <span className="text-xs font-bold text-neutral-200">{selectedInvoice.date}</span>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-850 pb-2.5">
                  <span className="text-[10px] font-black text-neutral-400 uppercase">Vencimento</span>
                  <span className={`text-xs font-bold ${selectedInvoice.critical ? 'text-red-400' : 'text-neutral-200'}`}>{selectedInvoice.due}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-neutral-400 uppercase">Valor Total</span>
                  <span className="text-sm font-black text-white">{selectedInvoice.value}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      if ((window as any).showToast) {
                        (window as any).showToast('success', `E-mail de cobrança enviado para ${selectedInvoice.email}!`, 'Cobrança por E-mail');
                      }
                      setSelectedInvoice(null);
                    }}
                    className="flex-1 py-3 bg-neutral-900 border border-neutral-800 text-xs font-black uppercase tracking-normal hover:bg-neutral-850 transition-all rounded-xl text-neutral-200 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Mail size={14} /> Chamar no E-mail
                  </button>
                  <button 
                    onClick={() => {
                      const cleanPhone = selectedInvoice.phone.replace(/\D/g, '');
                      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
                      setSelectedInvoice(null);
                    }}
                    className="flex-1 py-3 bg-neutral-900 border border-neutral-800 text-xs font-black uppercase tracking-normal hover:bg-neutral-850 transition-all rounded-xl text-neutral-200 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Phone size={14} /> Chamar no WhatsApp
                  </button>
                </div>

                <button 
                  onClick={() => handleDelete(selectedInvoice.id)}
                  className="w-full py-3.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-normal transition-all cursor-pointer flex items-center justify-center gap-2 border border-red-900/30 hover:border-transparent"
                >
                  Excluir Fatura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP DE AÇÕES RÁPIDAS (DAR BAIXA / EXCLUIR) */}
      {actionsInvoice && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setActionsInvoice(null)} />
          <div className="relative w-full max-w-sm bg-[#18191B] rounded-[32px] shadow-2xl border border-neutral-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden text-white p-8">
            <button 
              onClick={() => setActionsInvoice(null)} 
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center font-bold text-neutral-400 hover:text-white cursor-pointer transition-all border border-neutral-800"
            >
              ✕
            </button>

            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto border border-neutral-800">
                <MoreVertical size={28} />
              </div>

              <div>
                <h3 className="text-lg font-black tracking-tight text-white">Ações da Fatura</h3>
                <p className="text-xs text-neutral-400 mt-1 uppercase font-bold">{actionsInvoice.client} • {actionsInvoice.id}</p>
              </div>

              <div className="space-y-3 pt-2">
                <button 
                  onClick={() => {
                    setInvoices(prev => prev.map(item => item.id === actionsInvoice.id ? { ...item, status: 'Recebido' } : item));
                    setActionsInvoice(null);
                    if ((window as any).showToast) {
                      (window as any).showToast('success', `Fatura ${actionsInvoice.id} baixada com sucesso!`, 'Baixa Concluída');
                    }
                  }}
                  className="w-full py-4 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-normal hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <CheckCircle2 size={16} /> Dar Baixa (Confirmar Recebimento)
                </button>

                <button 
                  onClick={() => {
                    handleDelete(actionsInvoice.id);
                    setActionsInvoice(null);
                  }}
                  className="w-full py-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-normal transition-all cursor-pointer flex items-center justify-center gap-2 border border-red-900/30 hover:border-transparent"
                >
                  Excluir Fatura Permanentemente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ContasPagarView = ({ onPayClick }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { label: 'Pagamento Motoristas', value: 'R$ 84.200', icon: Truck, color: 'text-blue-500' },
        { label: 'Manutenção & Peças', value: 'R$ 12.450', icon: Activity, color: 'text-red-500' },
        { label: 'Combustível (Mês)', value: 'R$ 142.800', icon: Zap, color: 'text-yellow-600' },
      ].map((item, i) => (
        <div key={i} className="bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center ${item.color}`}>
            <item.icon size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">{item.label}</p>
            <h4 className="text-xl font-black text-gray-900">{item.value}</h4>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Próximos Vencimentos</h3>
        <button className="text-xs font-bold text-primary hover:underline">Ver Calendário Completo</button>
      </div>
      <div className="space-y-4">
        {[
          { category: 'Pagamento de Frete', recipient: 'Roberto Silva (Agregado)', date: 'Amanhã', value: 'R$ 2.450', status: 'Aguardando' },
          { category: 'Combustível', recipient: 'Posto Rodovias SA', date: '08/05', value: 'R$ 12.000', status: 'Agendado' },
          { category: 'Manutenção', recipient: 'Oficina Truck Master', date: '10/05', value: 'R$ 3.800', status: 'Pendente' },
        ].map((p, i) => (
          <div 
            key={i} 
            onClick={() => onPayClick?.(p)}
            className="p-6 bg-gray-50/50 border border-transparent hover:border-gray-100 hover:bg-white rounded-[32px] transition-all flex items-center justify-between group cursor-pointer select-none text-left"
          >
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary transition-all">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{p.recipient}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{p.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-12">
              <div className="text-right">
                <p className="text-xs font-black text-gray-900">{p.value}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{p.date}</p>
              </div>
              <button 
                onClick={() => onPayClick?.(p)}
                className="px-4 py-2 bg-white text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-normal border border-gray-100 shadow-sm hover:bg-gray-900 hover:text-white transition-all cursor-pointer"
              >
                Pagar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const FluxoCaixaView = ({ onTransactionClick }: any) => (
  <div className="space-y-8">
    <div className="bg-gray-900 rounded-[40px] p-10 text-white relative overflow-hidden">
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">Saldo Atual em Caixa</p>
          <h4 className="text-4xl font-black text-primary">R$ 1.242.800</h4>
          <p className="text-xs font-medium text-gray-500 mt-2">Atualizado em tempo real.</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">Previsão 7 Dias</p>
          <h4 className="text-4xl font-black text-white">+ R$ 42.500</h4>
          <p className="text-xs font-medium text-green-500 mt-2 flex items-center gap-1"><ArrowUpRight size={14} /> Fluxo Positivo</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">Previsão 30 Dias</p>
          <h4 className="text-4xl font-black text-white">+ R$ 158.000</h4>
          <p className="text-xs font-medium text-green-500 mt-2 flex items-center gap-1"><ArrowUpRight size={14} /> Meta batida</p>
        </div>
      </div>
      <Wallet size={200} className="absolute -right-20 -bottom-20 opacity-5 text-white" />
    </div>

    <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-8">Movimentações Recentes</h3>
      <div className="space-y-4">
        {[
          { type: 'in', category: 'Frete Recebido', desc: 'FT-8903 - AgroBrasil Log', value: 'R$ 12.000', time: '10:45' },
          { type: 'out', category: 'Despesa de Viagem', desc: 'Combustível - Placa BRA-2L22', value: 'R$ 840', time: '09:30' },
          { type: 'out', category: 'Manutenção', desc: 'Reparo Pneus - Caminhão 02', value: 'R$ 1.200', time: 'Ontem' },
          { type: 'in', category: 'Frete Recebido', desc: 'FT-8905 - Indústria Metal SA', value: 'R$ 3.800', time: 'Ontem' },
        ].map((m, i) => (
          <div 
            key={i} 
            onClick={() => onTransactionClick?.({ category: m.category, recipient: m.desc, value: m.value, date: m.time, status: m.type === 'in' ? 'Recebido' : 'Pendente' })}
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 cursor-pointer select-none text-left"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {m.type === 'in' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{m.category}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{m.desc}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-black ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{m.type === 'in' ? '+' : '-'} {m.value}</p>
              <p className="text-[10px] text-gray-400 font-bold">{m.time}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-8 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all">Ver Histórico Completo</button>
    </div>
  </div>
);

export default Financeiro;
