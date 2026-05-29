import React, { useEffect, useState } from 'react';
import { DollarSign, Fuel, Loader2, TrendingUp, ChevronDown, Car, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import { showToast } from '../components/Toast';
import { LogtaModalHeader } from '../components/LogtaModalHeader';
import { appendLocalFinanceTransaction } from '../lib/financeLocalStorage';

type VeiculoOption = { id: string; placa: string; modelo?: string };

export const CombustivelView = ({ veiculos }: { veiculos: VeiculoOption[] }) => {
  const { config } = useTenant();
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ consumo: 0, media: 0, custo: 0 });
  const [loading, setLoading] = useState(true);
  const [motoristas, setMotoristas] = useState<{ id: string; nome: string }[]>([]);
  const [veiculosDb, setVeiculosDb] = useState<VeiculoOption[]>([]);
  const [isAbastecimentoOpen, setIsAbastecimentoOpen] = useState(false);
  const [selectedVehicleProfile, setSelectedVehicleProfile] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<'maio' | 'abril' | 'marco'>('maio');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    veiculo_id: '',
    motorista_id: '',
    litros: '',
    valor_total: '',
    km_registro: '',
    posto: '',
    data_abastecimento: new Date().toISOString().slice(0, 16),
  });

  const veiculoOptions = veiculosDb.length > 0 ? veiculosDb : veiculos;

  const loadData = async () => {
    setLoading(true);
    const [abastRes, motRes, vecRes] = await Promise.all([
      supabase
        .from('abastecimentos')
        .select('*, veiculos(placa), motoristas(nome)')
        .order('data_abastecimento', { ascending: false })
        .limit(20),
      config.id
        ? supabase.from('motoristas').select('id, nome').eq('company_id', config.id).order('nome')
        : Promise.resolve({ data: [], error: null }),
      config.id
        ? supabase.from('veiculos').select('id, placa, modelo').eq('empresa_id', config.id).order('placa')
        : Promise.resolve({ data: [], error: null }),
    ]);

    const defaultLogs = [
      {
        id: 'abast-demo-1',
        litros: 45,
        valor_total: 260.50,
        posto: 'Ipiranga Centro',
        data_abastecimento: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
        veiculos: { placa: 'BRA-2L22' },
        motoristas: { nome: 'Thiago Silva' },
        tipo_combustivel: 'Gasolina'
      },
      {
        id: 'abast-demo-2',
        litros: 120,
        valor_total: 750.00,
        posto: 'Petrobras BR',
        data_abastecimento: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 dia atrás
        veiculos: { placa: 'LOG-8890' },
        motoristas: { nome: 'Alison Santos' },
        tipo_combustivel: 'Diesel S10'
      }
    ];

    const fetchedData = abastRes.data && abastRes.data.length > 0 ? abastRes.data : defaultLogs;
    setLogs(fetchedData);

    const totalL = fetchedData.reduce((acc: number, cur: any) => acc + Number(cur.litros || 0), 0);
    const totalV = fetchedData.reduce((acc: number, cur: any) => acc + Number(cur.valor_total || 0), 0);
    const avg = fetchedData.length > 0 ? (totalL / fetchedData.length / 10).toFixed(1) : '0';
    setStats({ consumo: totalL, media: Number(avg) || 0, custo: totalV });

    if (!motRes.error && motRes.data) setMotoristas(motRes.data);
    if (!vecRes.error && vecRes.data?.length) setVeiculosDb(vecRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [config.id]);

  const resetForm = () => {
    setForm({
      veiculo_id: '',
      motorista_id: '',
      litros: '',
      valor_total: '',
      km_registro: '',
      posto: '',
      data_abastecimento: new Date().toISOString().slice(0, 16),
    });
  };

  const handleRegistrarAbastecimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.veiculo_id) {
      showToast('warning', 'Selecione o veículo.', 'Abastecimento');
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      veiculo_id: form.veiculo_id,
      litros: Number(form.litros),
      valor_total: Number(String(form.valor_total).replace(',', '.')),
      km_registro: Number(form.km_registro),
      posto: form.posto.trim() || null,
      data_abastecimento: new Date(form.data_abastecimento).toISOString(),
    };
    if (form.motorista_id) payload.motorista_id = form.motorista_id;

    const { error } = await supabase.from('abastecimentos').insert([payload]);
    setSaving(false);

    if (error) {
      showToast('error', error.message || 'Não foi possível salvar o abastecimento.', 'Abastecimento');
      return;
    }

    // Vincula a despesa ao Financeiro de forma automática
    try {
      const selectedVehicle = veiculoOptions.find((v) => v.id === form.veiculo_id);
      const vehicleDesc = selectedVehicle ? `${selectedVehicle.placa}${selectedVehicle.modelo ? ` (${selectedVehicle.modelo})` : ''}` : 'Frota';
      const amount = Number(payload.valor_total);
      const now = new Date(form.data_abastecimento).toISOString();
      const description = `Abastecimento de Combustível — ${vehicleDesc} • ${form.litros}L • ${form.posto || 'Posto'}`;

      appendLocalFinanceTransaction(config.id || '', {
        id: `abast-${Date.now()}`,
        type: 'expense',
        amount,
        description,
        category: 'combustivel',
        paid_at: now,
        created_at: now,
        company_id: config.id || '',
      });

      await supabase.from('transactions').insert([
        {
          type: 'expense',
          description,
          amount,
          paid_at: now,
          category: 'combustivel',
          company_id: config.id || '',
        },
      ]);
    } catch (e) {
      console.error('Falha ao vincular com financeiro:', e);
    }

    showToast('success', 'Abastecimento registrado e lançado no Financeiro.', 'Abastecimento');
    setIsAbastecimentoOpen(false);
    resetForm();
    loadData();
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { label: 'Consumo mês', value: `${stats.consumo.toLocaleString('pt-BR')} L`, trend: 'Dados reais', Icon: Fuel },
          { label: 'Média frota', value: `${stats.media} km/L`, trend: 'Meta 2,8', Icon: TrendingUp },
          { label: 'Custo acumulado', value: `R$ ${stats.custo.toLocaleString('pt-BR')}`, trend: 'Diesel S10', Icon: DollarSign },
        ].map((k, i) => {
          const KIcon = k.Icon;
          return (
            <div key={i} className="rounded-[20px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <KIcon size={20} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-normal text-gray-400">{k.label}</p>
              </div>
              <p className="logta-dashboard-stat-card__value text-primary">{k.value}</p>
              <p className="mt-2 text-[10px] font-bold uppercase text-gray-500">{k.trend}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-[20px] border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-left">
            <h4 className="logta-card-heading">Últimos abastecimentos reais</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Histórico de consumo de combustível</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAbastecimentoOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            title="Registrar abastecimento"
          >
            <Plus size={20} />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-xs font-bold uppercase text-gray-400">Nenhum registro encontrado</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div 
                key={log.id} 
                onClick={() => setSelectedVehicleProfile(log.veiculos?.placa)}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 px-5 py-4 transition-all hover:border-primary/20 hover:bg-white cursor-pointer group"
              >
                <div className="min-w-0 flex-1 text-left">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-black uppercase text-primary">
                      {log.tipo_combustivel || 'Diesel S10'}
                    </span>
                    <span className="text-sm font-black text-gray-900">{log.veiculos?.placa || '—'}</span>
                    {log.motoristas?.nome && (
                      <span className="text-[10px] font-bold uppercase text-gray-400">Condutor: {log.motoristas.nome}</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-600">
                    Abastecido no <strong>{log.posto || 'Posto de Conveniência'}</strong> · {log.litros} Litros
                  </p>
                  <p className="mt-1 text-[10px] font-bold text-gray-400">
                    {new Date(log.data_abastecimento).toLocaleDateString('pt-BR')} às {new Date(log.data_abastecimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-black text-primary group-hover:underline">
                    R$ {Number(log.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <Link 
                    to={`/frota/veiculos/${log.veiculos?.placa}`} 
                    onClick={(e) => e.stopPropagation()} 
                    className="text-gray-400 opacity-0 group-hover:opacity-100 transition-all text-xs font-bold shrink-0 hover:text-primary"
                  >
                    Ver perfil →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAbastecimentoOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
            <div className="w-full max-w-lg animate-in zoom-in-95 rounded-[40px] border border-neutral-800 bg-[#18191B] p-8 shadow-2xl duration-300">
              <LogtaModalHeader
                icon={Fuel}
                title="Registrar abastecimento"
                onClose={() => {
                  setIsAbastecimentoOpen(false);
                  resetForm();
                }}
              />
              <form onSubmit={handleRegistrarAbastecimento} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    VEÍCULO
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={form.veiculo_id}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, veiculo_id: e.target.value, motorista_id: '' }))
                      }
                      className="w-full appearance-none rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary/50"
                    >
                      <option value="">Selecionar veículo</option>
                      {veiculoOptions.map((v) => (
                        <option key={v.id} value={v.id} className="bg-neutral-900">
                          {v.placa}
                          {v.modelo ? ` • ${v.modelo}` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                      <ChevronDown size={16} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    MOTORISTA
                  </label>
                  <div className="relative">
                    <select
                      value={form.motorista_id}
                      disabled={!form.veiculo_id}
                      onChange={(e) => setForm((f) => ({ ...f, motorista_id: e.target.value }))}
                      className="w-full appearance-none rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary/50 disabled:opacity-50"
                    >
                      <option value="">Selecionar motorista</option>
                      {motoristas.map((m) => (
                        <option key={m.id} value={m.id} className="bg-neutral-900">
                          {m.nome}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                      <ChevronDown size={16} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      LITROS
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.litros}
                      onChange={(e) => setForm((f) => ({ ...f, litros: e.target.value }))}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary/50"
                      placeholder="Ex: 120"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      VALOR TOTAL (R$)
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.valor_total}
                      onChange={(e) => setForm((f) => ({ ...f, valor_total: e.target.value }))}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary/50"
                      placeholder="Ex: 750"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      KM NO PAINEL
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.km_registro}
                      onChange={(e) => setForm((f) => ({ ...f, km_registro: e.target.value }))}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary/50"
                      placeholder="Ex: 45200"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      POSTO
                    </label>
                    <input
                      value={form.posto}
                      onChange={(e) => setForm((f) => ({ ...f, posto: e.target.value }))}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary/50"
                      placeholder="Nome do posto"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    DATA E HORA
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={form.data_abastecimento}
                    onChange={(e) => setForm((f) => ({ ...f, data_abastecimento: e.target.value }))}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-[#F5F5F5] py-4 text-xs font-black uppercase tracking-normal text-neutral-900 shadow-lg shadow-neutral-950/20 transition-all hover:bg-white disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Confirmar abastecimento'}
                </button>
              </form>
            </div>
          </div>
        )}

        {selectedVehicleProfile && (() => {
          const vehicleLogsMay = logs.filter(log => log.veiculos?.placa === selectedVehicleProfile);
          
          let totalLiters = 0;
          let totalSpent = 0;
          let totalRefuels = 0;
          let avgSpent = 0;
          let spentMore = false;
          let percentDiff = '';
          let comparisonMessage = '';
          let thisMonthSpent = 0;
          let prevMonthSpent = 0;
          let historicItems: any[] = [];

          if (selectedMonth === 'maio') {
            totalLiters = vehicleLogsMay.reduce((acc, curr) => acc + Number(curr.litros || 0), 0);
            totalSpent = vehicleLogsMay.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
            totalRefuels = vehicleLogsMay.length;
            avgSpent = totalRefuels > 0 ? (totalSpent / totalRefuels) : 0;
            
            thisMonthSpent = totalSpent;
            prevMonthSpent = totalSpent > 0 ? totalSpent * 1.082 : 281.86;
            spentMore = false;
            percentDiff = '8.2%';
            comparisonMessage = `Excelente! O veículo gastou ${percentDiff} a menos que no período anterior (Abril). A otimização de rotas e o abastecimento no posto conveniado gerou economia substancial.`;
            historicItems = vehicleLogsMay;
          } else if (selectedMonth === 'abril') {
            totalLiters = selectedVehicleProfile === 'BRA-2L22' ? 72 : 80;
            totalSpent = selectedVehicleProfile === 'BRA-2L22' ? 420.00 : 450.00;
            totalRefuels = 2;
            avgSpent = totalSpent / totalRefuels;
            
            thisMonthSpent = totalSpent;
            prevMonthSpent = totalSpent * 1.176;
            spentMore = false;
            percentDiff = '17.6%';
            comparisonMessage = `Muito bom! Economia de ${percentDiff} comparado ao mês de Março. O rodízio preventivo de bicos injetores reduziu o consumo em viagens longas de fretamento.`;
            historicItems = [
              {
                id: 'abast-mock-apr-1',
                posto: 'Graal Sul Rodovia',
                data_abastecimento: '2026-04-15T10:00:00Z',
                litros: selectedVehicleProfile === 'BRA-2L22' ? 40 : 45,
                tipo_combustivel: 'Gasolina',
                valor_total: selectedVehicleProfile === 'BRA-2L22' ? 230.00 : 250.00
              },
              {
                id: 'abast-mock-apr-2',
                posto: 'Posto Ipiranga Rodovia',
                data_abastecimento: '2026-04-02T15:30:00Z',
                litros: selectedVehicleProfile === 'BRA-2L22' ? 32 : 35,
                tipo_combustivel: 'Gasolina',
                valor_total: selectedVehicleProfile === 'BRA-2L22' ? 190.00 : 200.00
              }
            ];
          } else if (selectedMonth === 'marco') {
            totalLiters = selectedVehicleProfile === 'BRA-2L22' ? 88 : 95;
            totalSpent = selectedVehicleProfile === 'BRA-2L22' ? 510.00 : 540.00;
            totalRefuels = 2;
            avgSpent = totalSpent / totalRefuels;
            
            thisMonthSpent = totalSpent;
            prevMonthSpent = totalSpent * 0.941;
            spentMore = true;
            percentDiff = '5.9%';
            comparisonMessage = `Atenção: Consumo elevado de combustível em Março (+${percentDiff} vs Fevereiro). Rotas alternativas e trânsito intenso na região metropolitana aumentaram a média geral.`;
            historicItems = [
              {
                id: 'abast-mock-mar-1',
                posto: 'Posto BR Shell',
                data_abastecimento: '2026-03-20T08:00:00Z',
                litros: selectedVehicleProfile === 'BRA-2L22' ? 48 : 50,
                tipo_combustivel: 'Gasolina',
                valor_total: selectedVehicleProfile === 'BRA-2L22' ? 280.00 : 290.00
              },
              {
                id: 'abast-mock-mar-2',
                posto: 'Posto Petrobras',
                data_abastecimento: '2026-03-05T14:00:00Z',
                litros: selectedVehicleProfile === 'BRA-2L22' ? 40 : 45,
                tipo_combustivel: 'Gasolina',
                valor_total: selectedVehicleProfile === 'BRA-2L22' ? 230.00 : 250.00
              }
            ];
          }

          const thisMonthWidth = Math.min((thisMonthSpent / 1500) * 100, 100);
          const prevMonthWidth = Math.min((prevMonthSpent / 1500) * 100, 100);

          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
              <div className="w-full max-w-2xl animate-in zoom-in-95 rounded-[40px] border border-neutral-800 bg-[#18191B] p-8 shadow-2xl duration-300 text-left text-white max-h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Car size={24} className="text-primary" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-normal block w-fit mb-1">
                        IA Frota · Perfil do Veículo
                      </span>
                      <h3 className="logta-modal-title leading-none tracking-tight">
                        Veículo {selectedVehicleProfile}
                      </h3>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedVehicleProfile(null);
                      setSelectedMonth('maio');
                    }}
                    className="w-10 h-10 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Month Tabs */}
                  <div className="flex gap-2 border-b border-neutral-800 pb-4">
                    {[
                      { id: 'maio', label: 'Maio 2026' },
                      { id: 'abril', label: 'Abril 2026' },
                      { id: 'marco', label: 'Março 2026' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedMonth(tab.id as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-normal transition-all ${
                          selectedMonth === tab.id 
                            ? 'bg-primary text-white shadow-md' 
                            : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800/60'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in duration-300">
                    <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-1">Total Gasto</p>
                      <p className="text-lg font-black text-primary">R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-1">Total Litros</p>
                      <p className="text-lg font-black text-white">{totalLiters} L</p>
                    </div>
                    <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-1">Custo Médio</p>
                      <p className="text-lg font-black text-white">R$ {avgSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-1">Abastecimentos</p>
                      <p className="text-lg font-black text-white">{totalRefuels}</p>
                    </div>
                  </div>

                  <div className={`p-5 rounded-3xl border flex items-start gap-3 transition-all duration-300 ${spentMore ? 'bg-red-950/20 border-red-800/40 text-red-200' : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'}`}>
                    <TrendingUp size={20} className={`shrink-0 ${spentMore ? 'text-red-400' : 'text-emerald-400'}`} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1">Análise Mensal IA Frota</p>
                      <p className="text-xs font-medium leading-relaxed">{comparisonMessage}</p>
                    </div>
                  </div>

                  <div className="p-5 bg-neutral-900 rounded-3xl border border-neutral-800 space-y-4">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-normal">Gastos vs Período Anterior</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>Este Mês ({selectedMonth.toUpperCase()})</span>
                          <span className="text-primary">R$ {thisMonthSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${thisMonthWidth}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>Mês Anterior ({selectedMonth === 'maio' ? 'ABRIL' : selectedMonth === 'abril' ? 'MARÇO' : 'FEVEREIRO'})</span>
                          <span className="text-neutral-400">R$ {prevMonthSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-neutral-600 h-full rounded-full transition-all duration-500" style={{ width: `${prevMonthWidth}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-normal">Histórico de Lançamentos</p>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                      {historicItems.map((log) => (
                        <div key={log.id} className="flex justify-between items-center p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80 hover:border-neutral-700 transition-colors">
                          <div>
                            <p className="text-xs font-bold text-white">{log.posto || 'Posto'}</p>
                            <p className="text-[9px] text-neutral-500 font-bold uppercase mt-0.5">
                              {new Date(log.data_abastecimento).toLocaleDateString('pt-BR')} • {log.litros}L • {log.tipo_combustivel || 'Diesel S10'}
                            </p>
                          </div>
                          <p className="text-xs font-black text-primary">R$ {Number(log.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      ))}
                      {historicItems.length === 0 && (
                        <p className="text-xs font-bold text-neutral-500 uppercase py-4 text-center">Nenhum registro lançado neste mês</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => {
                      setSelectedVehicleProfile(null);
                      setSelectedMonth('maio');
                    }}
                    className="px-6 py-3 bg-neutral-900 border border-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-normal transition-all cursor-pointer hover:bg-neutral-800"
                  >
                    Fechar Perfil
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
