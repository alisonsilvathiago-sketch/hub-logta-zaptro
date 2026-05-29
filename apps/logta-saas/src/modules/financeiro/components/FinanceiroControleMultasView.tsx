import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Car,
  Clock,
  Filter,
  Plus,
  Scale,
  Search,
  ShieldAlert,
  User,
} from 'lucide-react';
import { showToast } from '../../../components/Toast';
import type { FinanceiroModuleDef } from '../types';

type StatusMulta = 'Pendente' | 'Paga' | 'Em recurso' | 'Desconto folha';

type MultaRegistro = {
  id: string;
  auto: string;
  placa: string;
  veiculo: string;
  motoristaNome: string;
  motoristaId: string;
  freteId?: string;
  freteNr?: string;
  infracao: string;
  local: string;
  valor: number;
  pontos: number;
  gravidade: 'Leve' | 'Média' | 'Grave' | 'Gravíssima';
  dataInfracao: string;
  vencimento: string;
  status: StatusMulta;
};

const MULTAS: MultaRegistro[] = [
  {
    id: 'MUL-2026-041',
    auto: 'A123456789',
    placa: 'TRK-204',
    veiculo: 'Volvo FH 540',
    motoristaNome: 'Pedro Almeida',
    motoristaId: 'mot-pedro',
    freteId: 'shp-002',
    freteNr: 'LF-240892',
    infracao: 'Excesso de velocidade — 20% acima do limite',
    local: 'BR-116, Km 482 — SP',
    valor: 195.23,
    pontos: 5,
    gravidade: 'Grave',
    dataInfracao: '12 Mai 2026',
    vencimento: '02 Jun 2026',
    status: 'Pendente',
  },
  {
    id: 'MUL-2026-038',
    auto: 'B987654321',
    placa: 'BRA-2L22',
    veiculo: 'Scania R450',
    motoristaNome: 'Carlos Henrique',
    motoristaId: 'mot-carlos',
    freteId: 'shp-001',
    freteNr: 'LF-240891',
    infracao: 'Avanço de sinal vermelho',
    local: 'Marginal Tietê — São Paulo, SP',
    valor: 293.47,
    pontos: 7,
    gravidade: 'Gravíssima',
    dataInfracao: '08 Mai 2026',
    vencimento: '28 Mai 2026',
    status: 'Em recurso',
  },
  {
    id: 'MUL-2026-035',
    auto: 'C456123789',
    placa: 'VAN-3341',
    veiculo: 'Sprinter 415',
    motoristaNome: 'Ricardo Souza',
    motoristaId: 'mot-ricardo',
    infracao: 'Estacionamento irregular em via pública',
    local: 'Centro — Curitiba, PR',
    valor: 130.16,
    pontos: 3,
    gravidade: 'Média',
    dataInfracao: '05 Mai 2026',
    vencimento: '25 Mai 2026',
    status: 'Paga',
  },
  {
    id: 'MUL-2026-029',
    auto: 'D789456123',
    placa: 'SPZ-9012',
    veiculo: 'Iveco Tector',
    motoristaNome: 'André Ferreira',
    motoristaId: 'mot-andre',
    infracao: 'Documentação do veículo vencida',
    local: 'Posto fiscal — Guarulhos, SP',
    valor: 293.47,
    pontos: 7,
    gravidade: 'Gravíssima',
    dataInfracao: '28 Abr 2026',
    vencimento: '18 Mai 2026',
    status: 'Desconto folha',
  },
  {
    id: 'MUL-2026-022',
    auto: 'E321654987',
    placa: 'LOG-8890',
    veiculo: 'Mercedes Actros',
    motoristaNome: 'Pedro Almeida',
    motoristaId: 'mot-pedro',
    infracao: 'Uso de celular ao volante',
    local: 'Rod. Anhanguera — Campinas, SP',
    valor: 195.23,
    pontos: 5,
    gravidade: 'Grave',
    dataInfracao: '20 Abr 2026',
    vencimento: '10 Mai 2026',
    status: 'Pendente',
  },
];

const STATUS_STYLES: Record<StatusMulta, string> = {
  Pendente: 'bg-red-50 text-red-700 border-red-200',
  Paga: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Em recurso': 'bg-blue-50 text-blue-700 border-blue-200',
  'Desconto folha': 'bg-violet-50 text-violet-700 border-violet-200',
};

const GRAVIDADE_STYLES: Record<MultaRegistro['gravidade'], string> = {
  Leve: 'bg-gray-100 text-gray-600',
  Média: 'bg-amber-100 text-amber-800',
  Grave: 'bg-orange-100 text-orange-800',
  Gravíssima: 'bg-red-100 text-red-800',
};

type Props = {
  module: FinanceiroModuleDef;
  hubPath: string;
  hubLabel: string;
};

export function FinanceiroControleMultasView({ module, hubPath, hubLabel }: Props) {
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<'todos' | StatusMulta>('todos');
  const [selected, setSelected] = useState<MultaRegistro | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MULTAS.filter((m) => {
      if (filtro !== 'todos' && m.status !== filtro) return false;
      if (!q) return true;
      return (
        m.auto.toLowerCase().includes(q) ||
        m.placa.toLowerCase().includes(q) ||
        m.motoristaNome.toLowerCase().includes(q) ||
        m.infracao.toLowerCase().includes(q)
      );
    });
  }, [search, filtro]);

  const totais = useMemo(() => {
    const valorMes = MULTAS.reduce((s, m) => s + m.valor, 0);
    const pendentes = MULTAS.filter((m) => m.status === 'Pendente');
    const valorPendente = pendentes.reduce((s, m) => s + m.valor, 0);
    const pontos = MULTAS.reduce((s, m) => s + m.pontos, 0);
    const motoristas = new Set(MULTAS.map((m) => m.motoristaId)).size;
    return { valorMes, valorPendente, pendentes: pendentes.length, pontos, motoristas };
  }, []);

  return (
    <div className="logta-page-content space-y-6 text-left animate-in fade-in duration-500">
      <Link
        to={hubPath}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para {hubLabel}
      </Link>

      <div className="overflow-hidden rounded-[28px] border border-red-200/70 bg-gradient-to-br from-red-50/90 via-white to-slate-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/20">
              <AlertTriangle size={26} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="logta-panel-eyebrow mb-1 text-red-700/80">Financeiro · Frota · RH</p>
              <h2 className="logta-page-title text-2xl sm:text-3xl">{module.title}</h2>
              <p className="mt-2 max-w-xl text-sm font-medium text-red-950/65">
                Multas de trânsito por <strong className="text-red-900">placa e condutor</strong> — impacto financeiro, pontos na CNH e desconto em folha.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-red-600 px-5 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-red-600/20 hover:bg-red-700"
          >
            <Plus size={18} /> Registrar multa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-red-600">Valor no mês</p>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg text-red-700">
            R$ {totais.valorMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 shadow-sm">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-amber-800">A pagar</p>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg text-amber-900">
            R$ {totais.valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="logta-stat-card__hint text-red-600/80">{totais.pendentes} multa(s) pendente(s)</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Pontos (frota)</p>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg text-gray-900">
            {totais.pontos}
          </p>
          <p className="logta-stat-card__hint text-gray-500">Soma no recorte atual</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Motoristas envolvidos</p>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg text-gray-900">
            {totais.motoristas}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-dashed border-red-200/80 bg-red-50/30 px-4 py-3 text-[11px] font-bold text-red-900/75">
        <span className="inline-flex items-center gap-1.5">
          <ShieldAlert size={12} className="text-red-600" /> Pendente: aguarda pagamento ou recurso
        </span>
        <span className="text-red-200">|</span>
        <span className="inline-flex items-center gap-1.5">
          <Scale size={12} className="text-red-600" /> Desconto folha: lançado no RH do condutor
        </span>
      </div>

      {selected ? (
        <div className="animate-in fade-in zoom-in-95 rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary"
          >
            <ArrowLeft size={16} /> Voltar para lista de multas
          </button>

          <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:justify-between">
            <div>
              <p className="logta-panel-eyebrow mb-1">Auto {selected.auto}</p>
              <h3 className="text-lg font-black text-gray-900">{selected.infracao}</h3>
              <p className="mt-1 text-sm font-semibold text-gray-500">{selected.local}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <Link to={`/frota/veiculos/${selected.placa}`} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-blue-700 hover:bg-blue-100">
                  <Car size={12} /> {selected.veiculo} ({selected.placa})
                </Link>
                <Link to={`/rh/motoristas/${selected.motoristaId}`} className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-purple-700 hover:bg-purple-100">
                  <User size={12} /> {selected.motoristaNome}
                </Link>
                {selected.freteId ? (
                  <Link to={`/fretes/operacional/${selected.freteId}`} className="rounded-lg bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200">
                    Frete {selected.freteNr}
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${STATUS_STYLES[selected.status]}`}>
                {selected.status}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${GRAVIDADE_STYLES[selected.gravidade]}`}>
                {selected.gravidade} · {selected.pontos} pts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
              <p className="text-[10px] font-black uppercase text-gray-400">Valor</p>
              <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg mt-1 text-red-600">
                R$ {selected.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
              <p className="text-[10px] font-black uppercase text-gray-400">Data infração</p>
              <p className="mt-1 text-sm font-black text-gray-900">{selected.dataInfracao}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <p className="text-[10px] font-black uppercase text-amber-800">Vencimento</p>
              <p className="mt-1 text-sm font-black text-amber-900">{selected.vencimento}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
              <p className="text-[10px] font-black uppercase text-gray-400">Impacto financeiro</p>
              <p className="mt-1 text-sm font-black text-gray-900">
                {selected.status === 'Desconto folha' ? 'Folha RH' : selected.status === 'Paga' ? 'Quitada' : 'Operacional'}
              </p>
            </div>
          </div>

          {selected.status === 'Pendente' ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => showToast('success', 'Pagamento registrado.', 'Multa')}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase text-white hover:bg-primary/90"
              >
                Registrar pagamento
              </button>
              <button
                type="button"
                onClick={() => showToast('info', 'Recurso iniciado — prazo 30 dias.', 'Multa')}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-xs font-bold uppercase text-gray-600 hover:bg-gray-50"
              >
                Abrir recurso
              </button>
              <button
                type="button"
                onClick={() => showToast('info', 'Desconto enviado ao RH.', 'Multa')}
                className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-2.5 text-xs font-bold uppercase text-violet-700 hover:bg-violet-100"
              >
                Descontar em folha
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar auto, placa, motorista ou infração..."
                className="w-full rounded-2xl border border-gray-200 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-red-400/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['todos', 'Pendente', 'Em recurso', 'Paga', 'Desconto folha'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFiltro(s)}
                  className={`logta-filter-chip rounded-full px-3 py-1.5 ${
                    filtro === s ? 'bg-red-600 text-white' : 'border border-gray-200 bg-gray-50 text-gray-600 hover:border-red-200'
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
            <table className="w-full min-w-[1050px] text-left text-sm text-gray-600">
              <thead className="border-b border-red-100/80 bg-red-50/35 text-[10px] font-black uppercase tracking-wider text-red-900/65">
                <tr>
                  <th className="p-4 pl-6">Auto / Placa</th>
                  <th className="p-4">Motorista</th>
                  <th className="p-4">Infração</th>
                  <th className="p-4 text-right">Valor</th>
                  <th className="p-4 text-center">Pontos</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4 pr-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className="cursor-pointer transition-colors hover:bg-red-50/20"
                  >
                    <td className="p-4 pl-6">
                      <p className="font-mono text-xs font-black text-gray-900">{m.auto}</p>
                      <p className="font-bold text-gray-800">{m.placa}</p>
                      <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${GRAVIDADE_STYLES[m.gravidade]}`}>
                        {m.gravidade}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-900">{m.motoristaNome}</td>
                    <td className="max-w-[240px] p-4">
                      <p className="line-clamp-2 text-xs font-semibold text-gray-700">{m.infracao}</p>
                      <p className="mt-0.5 text-[10px] text-gray-400">{m.local}</p>
                    </td>
                    <td className="p-4 text-right font-black text-red-700">
                      R$ {m.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg bg-gray-100 text-xs font-black text-gray-800">
                        {m.pontos}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{m.vencimento}</p>
                      <p className="text-[10px] text-gray-400">{m.dataInfracao}</p>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${STATUS_STYLES[m.status]}`}>
                        {m.status === 'Pendente' ? <Clock size={10} /> : null}
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-sm font-bold text-gray-400">Nenhuma multa com esse filtro.</p>
            ) : null}
          </div>
        </div>
      )}

      {addOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border border-neutral-800 bg-[#18191B] p-8 text-white shadow-2xl">
            <h3 className="logta-modal-title mb-6">Registrar multa</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase text-neutral-400">Nº do auto</label>
                <input type="text" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold" placeholder="A123456789" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase text-neutral-400">Placa</label>
                  <input type="text" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold" placeholder="BRA-2L22" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase text-neutral-400">Valor (R$)</label>
                  <input type="number" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold" />
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
                  showToast('success', 'Multa registrada.', 'Multa');
                  setAddOpen(false);
                }}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold uppercase text-white hover:bg-red-700"
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
