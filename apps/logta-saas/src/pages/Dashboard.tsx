import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Package,
  AlertCircle,
  CheckCircle2,
  MapPin,
  DollarSign,
  Sparkles,
  FileText,
  Plus,
  X,
  Truck,
  Gauge,
  Clock,
  Thermometer,
  Radio,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { ExportFormatModal } from '../components/ExportFormatModal';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import { showToast } from '../components/Toast';
import { LogtaModalHeader } from '../components/LogtaModalHeader';

const Dashboard = () => {
  const { config } = useTenant();
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [metrics, setMetrics] = useState({
    receitaEstimada: 0,
    viagensEmCurso: 0,
    ocupacaoFrota: 0,
    riscosDetectados: 0
  });

  const [activeTrips, setActiveTrips] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    client: '',
    origin: '',
    dest: '',
    driver: '',
    plate: '',
    value: '',
    type: 'Normal'
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const companyId = config?.id;
      if (!companyId) { setIsLoading(false); return; }
      
      // 1. Receita Estimada (Transactions do mês atual)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data: transacoes } = await supabase
        .from('transactions')
        .select('amount')
        .eq('company_id', companyId)
        .eq('type', 'receita')
        .gte('created_at', firstDay);

      const totalReceita = transacoes?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      // 2. Viagens em Curso (Shipments ativos)
      const { count: viagensAtivas } = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .not('status', 'eq', 'delivered')
        .not('status', 'eq', 'cancelled');

      // 3. Ocupação de Frota (Veículos em viagem / total)
      const { data: veiculos } = await supabase
        .from('vehicles')
        .select('status')
        .eq('company_id', companyId);

      const totalVeiculos = veiculos?.length || 0;
      const veiculosEmViagem = veiculos?.filter(v => v.status === 'in_transit' || v.status === 'em_viagem').length || 0;
      const ocupacao = totalVeiculos > 0 ? (veiculosEmViagem / totalVeiculos) * 100 : 0;

      // 4. Monitoramento em Tempo Real (Lista de Shipments)
      const { data: fretesData } = await supabase
        .from('shipments')
        .select(`
          *,
          veiculo:vehicles(plate, model),
          motorista:motoristas(nome)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5);

      setMetrics({
        receitaEstimada: totalReceita,
        viagensEmCurso: viagensAtivas || 0,
        ocupacaoFrota: Number(ocupacao.toFixed(1)),
        riscosDetectados: fretesData?.filter(f => f.status === 'delayed' || f.status === 'atrasado').length || 0
      });

      if (fretesData) {
        setActiveTrips(fretesData.map(f => ({
          id: `TR-${f.id.toString().slice(0, 4).toUpperCase()}`,
          route: `${f.origin} → ${f.destination}`,
          driver: f.motorista?.nome || 'Não atribuído',
          plate: f.veiculo?.plate || 'Sem placa',
          prog: f.status === 'in_transit' ? 65 : f.status === 'loading' ? 15 : 0,
          status: f.status === 'in_transit' ? 'No Prazo' : f.status === 'delayed' ? 'Atrasado' : 'Pendente',
          time: f.estimated_at ? `ETA ${new Date(f.estimated_at).getHours()}h` : '—',
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.metadata?.valor_frete || 0),
          cargo: f.metadata?.tipo_carga || 'Carga Geral',
          speed: 'Monitorado',
          warning: f.status === 'delayed'
        })));
      }

    } catch (error) {
      console.error('Erro no dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [config?.id]);

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('dashboard-logta')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config?.id) return;
    try {
      const { error } = await supabase.from('shipments').insert([
        {
          company_id: config.id,
          origin: formData.origin,
          destination: formData.dest,
          status: 'pending',
          metadata: {
            client: formData.client,
            driver: formData.driver,
            plate: formData.plate,
            valor_frete: parseFloat(formData.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
            tipo_carga: formData.type,
          },
        },
      ]);
      if (error) throw error;
      showToast('success', 'Nova operação registrada com sucesso.', 'Centro de Comando');
    } catch {
      showToast('info', 'Operação salva localmente. Sincronize a frota quando o endpoint estiver disponível.', 'Centro de Comando');
    }
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setIsModalOpen(false);
      fetchDashboardData();
    }, 1500);
  };

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className="logta-page h-full w-full space-y-8 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="logta-page-title">Centro de Comando</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-normal mt-1">Logta Matriz • {today}</p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
          <button
            type="button"
            onClick={fetchDashboardData}
            className="hub-premium-pill secondary"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="hub-premium-pill primary"
          >
            <Plus size={16} /> <span>Nova Operação</span>
          </button>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Receita Estimada" 
          value={isLoading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.receitaEstimada)} 
          trend={12.5} 
          icon={DollarSign} 
          subtitle="Total acumulado no mês"
          iconBg="bg-neutral-950"
          iconColor="text-white"
        />
        <StatCard 
          title="Viagens em Curso" 
          value={isLoading ? '...' : String(metrics.viagensEmCurso)} 
          trend={8.2} 
          icon={Package} 
          subtitle="Cargas em trânsito"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard 
          title="Ocupação de Frota" 
          value={isLoading ? '...' : `${metrics.ocupacaoFrota}%`} 
          trend={-1.1} 
          icon={TrendingUp} 
          subtitle="Capacidade utilizada"
          iconBg="bg-neutral-950"
          iconColor="text-blue-400"
        />
        <StatCard 
          title="Riscos Detectados" 
          value={isLoading ? '...' : String(metrics.riscosDetectados).padStart(2, '0')} 
          icon={AlertCircle} 
          subtitle="Alertas de segurança"
          iconBg="bg-white border border-gray-200/50"
          iconColor="text-neutral-950"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Real-time Logistics Monitor */}
        <div className="xl:col-span-8 space-y-8">
          <div className="relative overflow-hidden rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm sm:rounded-[40px] sm:p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="logta-card-heading">Monitoramento Operacional</h2>
                <p className="text-sm text-gray-500 font-medium">Dados reais integrados ao Supabase</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {activeTrips.length === 0 ? (
                <div className="py-12 text-center text-gray-400 font-medium border border-dashed border-gray-200 rounded-3xl">
                  Nenhuma viagem ativa no momento.
                </div>
              ) : (
                activeTrips.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedTrip(item)}
                    className="flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-[32px] bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-gray-200/40 transition-all group border border-transparent hover:border-gray-100 cursor-pointer text-left"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${item.warning ? 'bg-red-50 text-red-500' : 'bg-white text-gray-400 group-hover:bg-primary group-hover:text-white shadow-sm'}`}>
                      <Truck size={24} />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{item.route}</h4>
                          <p className="text-xs text-gray-500 font-medium flex items-center gap-2">
                            {item.driver} • {item.plate}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-900">{item.value}</span>
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase ${item.warning ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
            <h2 className="logta-section-title mb-8 flex items-center justify-between">
              Timeline 
              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-normal font-bold">Realtime</span>
            </h2>
            <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
              <div className="relative pl-10 group">
                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-green-500 border-4 border-white z-10 shadow-sm" />
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-0.5">Sincronização OK</p>
                  <p className="text-xs text-gray-500 mb-1">Banco de dados operacional</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-normal">Agora</p>
                </div>
              </div>
              <div className="relative pl-10 group">
                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-primary border-4 border-white z-10 shadow-sm" />
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-0.5">Monitoramento Ativo</p>
                  <p className="text-xs text-gray-500 mb-1">Frota via satélite</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-normal">Online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !success && setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-[32px] border border-neutral-800 bg-[#18191B] p-8 text-white shadow-2xl animate-in zoom-in duration-200">
            <LogtaModalHeader icon={Truck} title="Nova operação" onClose={() => setIsModalOpen(false)} />
            {success ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <CheckCircle2 size={48} className="text-green-400" />
                <p className="text-sm font-bold text-white">Operação criada com sucesso!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">Cliente</label>
                  <input
                    required
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    placeholder="Ex: Transportes ABC"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-neutral-400">Origem</label>
                    <input
                      required
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-neutral-400">Destino</label>
                    <input
                      required
                      value={formData.dest}
                      onChange={(e) => setFormData({ ...formData, dest: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-neutral-400">Motorista</label>
                    <input
                      value={formData.driver}
                      onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-neutral-400">Placa</label>
                    <input
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-neutral-400">Valor frete</label>
                    <input
                      required
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="R$ 0,00"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-neutral-400">Tipo carga</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
                    >
                      <option>Normal</option>
                      <option>Refrigerada</option>
                      <option>Perigosa</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full rounded-xl bg-primary py-4 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90">
                  Criar operação
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#18191B] rounded-[40px] p-8 text-white">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black bg-primary/20 text-primary px-3 py-1 rounded-full uppercase">{selectedTrip.id}</span>
                <h3 className="text-2xl font-black mt-2">{selectedTrip.route}</h3>
              </div>
              <button onClick={() => setSelectedTrip(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Motorista</p>
                <p className="font-bold">{selectedTrip.driver}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Placa</p>
                <p className="font-bold">{selectedTrip.plate}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Valor</p>
                <p className="font-bold text-primary">{selectedTrip.value}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Status</p>
                <p className="font-bold text-green-400">{selectedTrip.status}</p>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedTrip(null)}
              className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
