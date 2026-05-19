import React, { useEffect, useState } from 'react';
import { DollarSign, Fuel, Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import { showToast } from '../components/Toast';
import { LogtaModalHeader } from '../components/LogtaModalHeader';

type VeiculoOption = { id: string; placa: string; modelo?: string };

export const CombustivelView = ({ veiculos }: { veiculos: VeiculoOption[] }) => {
  const { config } = useTenant();
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ consumo: 0, media: 0, custo: 0 });
  const [loading, setLoading] = useState(true);
  const [motoristas, setMotoristas] = useState<{ id: string; nome: string }[]>([]);
  const [veiculosDb, setVeiculosDb] = useState<VeiculoOption[]>([]);
  const [isAbastecimentoOpen, setIsAbastecimentoOpen] = useState(false);
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

    if (!abastRes.error && abastRes.data) {
      setLogs(abastRes.data);
      const totalL = abastRes.data.reduce((acc: number, cur: any) => acc + Number(cur.litros || 0), 0);
      const totalV = abastRes.data.reduce((acc: number, cur: any) => acc + Number(cur.valor_total || 0), 0);
      const avg = abastRes.data.length > 0 ? (totalL / abastRes.data.length / 10).toFixed(1) : '0';
      setStats({ consumo: totalL, media: Number(avg) || 0, custo: totalV });
    }

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

    showToast('success', 'Abastecimento registrado com sucesso.', 'Abastecimento');
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
        <h4 className="logta-card-heading mb-4">Últimos abastecimentos reais</h4>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-xs font-bold uppercase text-gray-400">Nenhum registro encontrado</p>
        ) : (
          <ul className="space-y-3 text-sm text-gray-600">
            {logs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-gray-50 py-2 last:border-0">
                <Fuel size={14} className="shrink-0 text-primary" />
                <span className="font-bold text-primary">{log.veiculos?.placa || '—'}</span>
                {log.motoristas?.nome ? <span className="font-medium text-gray-700">• {log.motoristas.nome}</span> : null}
                <span>
                  • {log.litros}L • {log.posto || 'Posto'} •{' '}
                  {new Date(log.data_abastecimento).toLocaleDateString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => setIsAbastecimentoOpen(true)}
          className="hub-premium-pill primary"
          style={{ marginTop: 24 }}
        >
          Registrar abastecimento
        </button>
      </div>

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
                <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">
                  Veículo
                </label>
                <select
                  required
                  value={form.veiculo_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, veiculo_id: e.target.value, motorista_id: '' }))
                  }
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary/50"
                >
                  <option value="">Selecionar veículo</option>
                  {veiculoOptions.map((v) => (
                    <option key={v.id} value={v.id} className="bg-neutral-900">
                      {v.placa}
                      {v.modelo ? ` • ${v.modelo}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">
                  Motorista
                </label>
                <select
                  value={form.motorista_id}
                  disabled={!form.veiculo_id}
                  onChange={(e) => setForm((f) => ({ ...f, motorista_id: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary/50 disabled:opacity-50"
                >
                  <option value="">Selecionar motorista</option>
                  {motoristas.map((m) => (
                    <option key={m.id} value={m.id} className="bg-neutral-900">
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">
                    Litros
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
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">
                    Valor total (R$)
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
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">
                    KM no painel
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
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">
                    Posto
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
                <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">
                  Data e hora
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
                className="hub-premium-pill primary w-full justify-center"
                style={{ marginTop: 8 }}
              >
                {saving ? 'Salvando...' : 'Confirmar abastecimento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
