import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Search,
  User,
  Users,
  Utensils,
  Wallet,
} from 'lucide-react';
import { showToast } from '../../../components/Toast';
import type { FinanceiroModuleDef } from '../types';

type DiariaStatusRh = 'Aprovado' | 'Pendente' | 'Em conferência' | 'Pago';

type DiariaViagem = {
  id: string;
  freteId: string;
  freteNr: string;
  rota: string;
  motoristaNome: string;
  motoristaId: string;
  veiculoPlaca: string;
  veiculo: string;
  clienteNome: string;
  diasFora: number;
  ajudantes: number;
  valorMotoristaDia: number;
  valorAjudanteDia: number;
  totalDiarias: number;
  statusRh: DiariaStatusRh;
  periodo: string;
  diasDetalhe: { dia: string; motorista: number; ajudante: number }[];
};

const VIAGENS_DIARIAS: DiariaViagem[] = [
  {
    id: 'DIA-240891',
    freteId: 'shp-001',
    freteNr: 'LF-240891',
    rota: 'São Paulo, SP → Rio de Janeiro, RJ',
    motoristaNome: 'Carlos Henrique',
    motoristaId: 'mot-carlos',
    veiculoPlaca: 'BRA-2L22',
    veiculo: 'Scania R450',
    clienteNome: 'Alfa Logistics',
    diasFora: 3,
    ajudantes: 2,
    valorMotoristaDia: 90,
    valorAjudanteDia: 45,
    totalDiarias: 540,
    statusRh: 'Pendente',
    periodo: '16–18 Mai 2026',
    diasDetalhe: [
      { dia: '16 Mai', motorista: 90, ajudante: 90 },
      { dia: '17 Mai', motorista: 90, ajudante: 90 },
      { dia: '18 Mai', motorista: 90, ajudante: 90 },
    ],
  },
  {
    id: 'DIA-240892',
    freteId: 'shp-002',
    freteNr: 'LF-240892',
    rota: 'São Paulo, SP → Belo Horizonte, MG',
    motoristaNome: 'Pedro Almeida',
    motoristaId: 'mot-pedro',
    veiculoPlaca: 'TRK-204',
    veiculo: 'Volvo FH 540',
    clienteNome: 'Prime Cargo',
    diasFora: 2,
    ajudantes: 1,
    valorMotoristaDia: 90,
    valorAjudanteDia: 45,
    totalDiarias: 225,
    statusRh: 'Aprovado',
    periodo: '18–19 Mai 2026',
    diasDetalhe: [
      { dia: '18 Mai', motorista: 90, ajudante: 45 },
      { dia: '19 Mai', motorista: 90, ajudante: 45 },
    ],
  },
  {
    id: 'DIA-240893',
    freteId: 'shp-003',
    freteNr: 'LF-240893',
    rota: 'Curitiba, PR → Campinas, SP',
    motoristaNome: 'Ricardo Souza',
    motoristaId: 'mot-ricardo',
    veiculoPlaca: 'VAN-3341',
    veiculo: 'Sprinter 415',
    clienteNome: 'TransBrasil',
    diasFora: 2,
    ajudantes: 2,
    valorMotoristaDia: 90,
    valorAjudanteDia: 45,
    totalDiarias: 360,
    statusRh: 'Em conferência',
    periodo: '19–20 Mai 2026',
    diasDetalhe: [
      { dia: '19 Mai', motorista: 90, ajudante: 90 },
      { dia: '20 Mai', motorista: 90, ajudante: 90 },
    ],
  },
  {
    id: 'DIA-240885',
    freteId: 'shp-011',
    freteNr: 'LF-240885',
    rota: 'Belém, PA → Manaus, AM',
    motoristaNome: 'Ricardo Souza',
    motoristaId: 'mot-ricardo',
    veiculoPlaca: 'VAN-3341',
    veiculo: 'Sprinter 415',
    clienteNome: 'Alfa Logistics',
    diasFora: 5,
    ajudantes: 3,
    valorMotoristaDia: 90,
    valorAjudanteDia: 45,
    totalDiarias: 1125,
    statusRh: 'Pendente',
    periodo: '14–18 Mai 2026',
    diasDetalhe: [
      { dia: '14 Mai', motorista: 90, ajudante: 135 },
      { dia: '15 Mai', motorista: 90, ajudante: 135 },
      { dia: '16 Mai', motorista: 90, ajudante: 135 },
      { dia: '17 Mai', motorista: 90, ajudante: 135 },
      { dia: '18 Mai', motorista: 90, ajudante: 135 },
    ],
  },
  {
    id: 'DIA-240886',
    freteId: 'shp-012',
    freteNr: 'LF-240886',
    rota: 'Recife, PE → Salvador, BA',
    motoristaNome: 'André Ferreira',
    motoristaId: 'mot-andre',
    veiculoPlaca: 'SPZ-9012',
    veiculo: 'Iveco Tector',
    clienteNome: 'Prime Cargo',
    diasFora: 2,
    ajudantes: 2,
    valorMotoristaDia: 90,
    valorAjudanteDia: 45,
    totalDiarias: 360,
    statusRh: 'Pago',
    periodo: '17–18 Mai 2026',
    diasDetalhe: [
      { dia: '17 Mai', motorista: 90, ajudante: 90 },
      { dia: '18 Mai', motorista: 90, ajudante: 90 },
    ],
  },
];

const STATUS_STYLES: Record<DiariaStatusRh, string> = {
  Aprovado: 'bg-blue-50 text-blue-700 border-blue-200',
  Pendente: 'bg-primary/10 text-primary border-primary/20',
  'Em conferência': 'bg-blue-50 text-blue-600 border-blue-200',
  Pago: 'bg-gray-100 text-gray-700 border-gray-200',
};

type Props = {
  module: FinanceiroModuleDef;
  hubPath: string;
  hubLabel: string;
};

export function FinanceiroControleDiariasView({ module, hubPath, hubLabel }: Props) {
  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | DiariaStatusRh>('todos');
  const [selected, setSelected] = useState<DiariaViagem | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return VIAGENS_DIARIAS.filter((v) => {
      if (filtroStatus !== 'todos' && v.statusRh !== filtroStatus) return false;
      if (!q) return true;
      return (
        v.freteNr.toLowerCase().includes(q) ||
        v.motoristaNome.toLowerCase().includes(q) ||
        v.rota.toLowerCase().includes(q) ||
        v.clienteNome.toLowerCase().includes(q)
      );
    });
  }, [search, filtroStatus]);

  const totais = useMemo(() => {
    const totalMes = VIAGENS_DIARIAS.reduce((s, v) => s + v.totalDiarias, 0);
    const diasViagem = VIAGENS_DIARIAS.reduce((s, v) => s + v.diasFora, 0);
    const pendentes = VIAGENS_DIARIAS.filter((v) => v.statusRh === 'Pendente').length;
    const ajudantes = VIAGENS_DIARIAS.reduce((s, v) => s + v.ajudantes, 0);
    return { totalMes, diasViagem, pendentes, ajudantes };
  }, []);

  return (
    <div className="logta-page-content space-y-6 text-left animate-in fade-in duration-500">
      <Link
        to={hubPath}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para {hubLabel}
      </Link>

      {/* Cabeçalho — identidade própria (diárias / RH) */}
      <div className="overflow-hidden rounded-[28px] border border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-blue-50/40 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/25">
              <Utensils size={26} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="logta-panel-eyebrow mb-1 text-primary/90">Financeiro · Viagem · RH</p>
              <h2 className="logta-page-title text-2xl sm:text-3xl">{module.title}</h2>
              <p className="mt-2 max-w-xl text-sm font-medium text-blue-950/70">
                Controle de <strong className="text-blue-900">dias fora de base</strong>, diárias de motorista e ajudante por frete — com conferência e envio ao RH.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary/90"
          >
            <Plus size={18} /> Lançar diárias
          </button>
        </div>
      </div>

      {/* KPIs focados em dias */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Wallet size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Total no mês</span>
          </div>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg logta-dashboard-stat-card__value--primary">
            R$ {totais.totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="logta-stat-card__hint text-gray-500">Motorista + ajudante</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-gray-500">
            <CalendarDays size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Dias em viagem</span>
          </div>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg text-gray-900">
            {totais.diasViagem}
          </p>
          <p className="logta-stat-card__hint text-gray-500">Soma de dias fora (mês)</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-gray-500">
            <Users size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Ajudantes</span>
          </div>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg text-gray-900">
            {totais.ajudantes}
          </p>
          <p className="logta-stat-card__hint text-gray-500">Vínculos ativos nas viagens</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-red-600">
            <AlertCircle size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Pendências RH</span>
          </div>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg text-red-600">
            {totais.pendentes}
          </p>
          <p className="logta-stat-card__hint text-red-600/80">Aguardando aprovação</p>
        </div>
      </div>

      {/* Legenda de valores — deixa regras visíveis */}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-dashed border-blue-200/90 bg-blue-50/40 px-4 py-3 text-[11px] font-bold text-blue-900/80">
        <span className="inline-flex items-center gap-1.5">
          <User size={12} className="text-primary" /> Motorista: <strong>R$ 90,00/dia</strong>
        </span>
        <span className="text-blue-300">|</span>
        <span className="inline-flex items-center gap-1.5">
          <Users size={12} className="text-primary" /> Ajudante: <strong>R$ 45,00/dia</strong> (cada)
        </span>
        <span className="text-blue-300">|</span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} className="text-primary" /> Contagem: saída da base até retorno
        </span>
      </div>

      {selected ? (
        <div className="animate-in fade-in zoom-in-95 rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary"
          >
            <ArrowLeft size={16} /> Voltar para lista de diárias
          </button>

          <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="logta-panel-eyebrow mb-1">Frete {selected.freteNr}</p>
              <h3 className="text-xl font-black text-gray-900">{selected.rota}</h3>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <Link
                  to={`/fretes/operacional/${selected.freteId}`}
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200"
                >
                  Ver frete
                </Link>
                <Link
                  to={`/rh/motoristas/${selected.motoristaId}`}
                  className="rounded-lg bg-purple-50 px-3 py-1.5 text-purple-700 hover:bg-purple-100"
                >
                  {selected.motoristaNome}
                </Link>
                <Link
                  to={`/frota/veiculos/${selected.veiculoPlaca}`}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-blue-700 hover:bg-blue-100"
                >
                  {selected.veiculo} ({selected.veiculoPlaca})
                </Link>
              </div>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase ${STATUS_STYLES[selected.statusRh]}`}>
              {selected.statusRh}
            </span>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
              <p className="text-[10px] font-black uppercase text-gray-400">Dias fora</p>
              <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg mt-1 text-gray-900">{selected.diasFora}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
              <p className="text-[10px] font-black uppercase text-gray-400">Ajudantes</p>
              <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg mt-1 text-gray-900">{selected.ajudantes}</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-[10px] font-black uppercase text-blue-700/80">Motorista / dia</p>
              <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg logta-dashboard-stat-card__value--primary mt-1">
                R$ {selected.valorMotoristaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-100/50 p-4">
              <p className="text-[10px] font-black uppercase text-blue-800">Total diárias</p>
              <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg logta-dashboard-stat-card__value--primary mt-1">
                R$ {selected.totalDiarias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <h4 className="logta-panel-eyebrow mb-4 py-0">Detalhamento dia a dia</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selected.diasDetalhe.map((d) => (
              <div
                key={d.dia}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{d.dia}</p>
                    <p className="text-[10px] font-bold uppercase text-gray-400">1 dia fora</p>
                  </div>
                </div>
                <div className="text-right text-xs font-bold">
                  <p className="text-gray-600">
                    Mot. R$ {d.motorista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {d.ajudante > 0 ? (
                    <p className="text-blue-700">
                      Ajud. R$ {d.ajudante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  ) : (
                    <p className="text-gray-400">Sem ajudante</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selected.statusRh === 'Pendente' ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => showToast('success', 'Diárias enviadas para conferência no RH.', 'RH')}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase text-white shadow-sm hover:bg-primary/90"
              >
                Enviar ao RH
              </button>
              <button
                type="button"
                onClick={() => showToast('info', 'Edição de dias disponível em breve.', 'Diárias')}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold uppercase text-gray-600 hover:bg-gray-50"
              >
                Ajustar dias
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar frete, motorista ou rota..."
                className="w-full rounded-2xl border border-gray-200 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-400/60"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['todos', 'Pendente', 'Em conferência', 'Aprovado', 'Pago'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFiltroStatus(s)}
                  className={`logta-filter-chip rounded-full px-3 py-1.5 transition-colors ${
                    filtroStatus === s
                      ? 'bg-primary text-white'
                      : 'border border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-200'
                  }`}
                >
                  {s === 'todos' ? 'Todos' : s}
                </button>
              ))}
            </div>
            <button type="button" className="hub-premium-pill secondary shrink-0">
              <Filter size={16} /> Período
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm text-gray-600">
              <thead className="border-b border-blue-100/80 bg-blue-50/40 text-[10px] font-black uppercase tracking-wider text-blue-900/70">
                <tr>
                  <th className="p-4 pl-6">Frete / Período</th>
                  <th className="p-4">Motorista</th>
                  <th className="p-4 text-center">Dias fora</th>
                  <th className="p-4 text-center">Ajud.</th>
                  <th className="p-4">R$ Mot./dia</th>
                  <th className="p-4">R$ Ajud./dia</th>
                  <th className="p-4 font-black text-primary">Total diárias</th>
                  <th className="p-4 pr-6 text-right">Status RH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelected(v)}
                    className="cursor-pointer transition-colors hover:bg-blue-50/30"
                  >
                    <td className="p-4 pl-6">
                      <p className="font-black text-gray-900">{v.freteNr}</p>
                      <p className="text-xs font-medium text-gray-500">{v.rota}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-blue-700/80">{v.periodo}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{v.motoristaNome}</p>
                      <p className="text-[10px] font-semibold text-gray-400">{v.clienteNome}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg bg-gray-100 text-sm font-black text-gray-900">
                        {v.diasFora}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-gray-700">{v.ajudantes}</td>
                    <td className="p-4 font-semibold text-gray-700">
                      R$ {v.valorMotoristaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 font-semibold text-gray-700">
                      {v.ajudantes > 0
                        ? `R$ ${v.valorAjudanteDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td className="p-4 font-black text-primary">
                      R$ {v.totalDiarias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${STATUS_STYLES[v.statusRh]}`}
                      >
                        {v.statusRh === 'Aprovado' || v.statusRh === 'Pago' ? (
                          <CheckCircle2 size={10} />
                        ) : (
                          <Clock size={10} />
                        )}
                        {v.statusRh}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-sm font-bold text-gray-400">Nenhum lançamento com esse filtro.</p>
            ) : null}
          </div>
        </div>
      )}

      {addOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border border-neutral-800 bg-[#18191B] p-8 text-white shadow-2xl">
            <h3 className="logta-modal-title mb-1">Lançar diárias</h3>
            <p className="mb-6 text-[10px] font-bold uppercase text-neutral-400">Vinculado ao frete e RH</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase text-neutral-400">Frete / viagem</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold outline-none focus:border-primary"
                  placeholder="Ex: LF-240891"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase text-neutral-400">Dias fora</label>
                  <input type="number" min={1} className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold" placeholder="3" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase text-neutral-400">Ajudantes</label>
                  <input type="number" min={0} className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold" placeholder="0" />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setAddOpen(false)} className="text-xs font-bold uppercase text-neutral-400 hover:text-white">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('success', 'Diárias registradas.', 'Diárias');
                  setAddOpen(false);
                }}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase text-white hover:bg-primary/90"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
