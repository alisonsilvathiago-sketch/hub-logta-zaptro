import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Percent,
  Search,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { showToast } from '../../../components/Toast';
import type { FinanceiroModuleDef } from '../types';

const META_MARGEM = 35;

type StatusMargem = 'Lucro Alto' | 'Lucro Médio' | 'Abaixo da meta';

type MargemViagem = {
  id: string;
  freteId: string;
  freteNr: string;
  rota: string;
  clienteNome: string;
  motoristaNome: string;
  motoristaId: string;
  veiculoPlaca: string;
  veiculo: string;
  data: string;
  receita: number;
  custoOperacional: number;
  impostos: number;
  lucroLiquido: number;
  margem: number;
  status: StatusMargem;
  custos: { label: string; valor: number; cor: string }[];
};

const VIAGENS_MARGEM: MargemViagem[] = [
  {
    id: '#TRP-8821',
    freteId: 'shp-001',
    freteNr: 'LF-240891',
    rota: 'São Paulo, SP → Rio de Janeiro, RJ',
    clienteNome: 'Alfa Logistics',
    motoristaNome: 'Carlos Henrique',
    motoristaId: 'mot-carlos',
    veiculoPlaca: 'BRA-2L22',
    veiculo: 'Scania R450',
    data: '18 Mai 2026',
    receita: 18450,
    custoOperacional: 8200,
    impostos: 2767,
    lucroLiquido: 7483,
    margem: 40.5,
    status: 'Lucro Alto',
    custos: [
      { label: 'Combustível', valor: 4100, cor: 'bg-blue-300' },
      { label: 'Pedágio', valor: 800, cor: 'bg-blue-400' },
      { label: 'Motorista / diárias', valor: 3300, cor: 'bg-blue-500' },
    ],
  },
  {
    id: '#TRP-8822',
    freteId: 'shp-002',
    freteNr: 'LF-240892',
    rota: 'São Paulo, SP → Belo Horizonte, MG',
    clienteNome: 'Prime Cargo',
    motoristaNome: 'Pedro Almeida',
    motoristaId: 'mot-pedro',
    veiculoPlaca: 'TRK-204',
    veiculo: 'Volvo FH 540',
    data: '19 Mai 2026',
    receita: 12200,
    custoOperacional: 5600,
    impostos: 1830,
    lucroLiquido: 4770,
    margem: 39.1,
    status: 'Lucro Médio',
    custos: [
      { label: 'Combustível', valor: 2800, cor: 'bg-blue-300' },
      { label: 'Pedágio', valor: 550, cor: 'bg-blue-400' },
      { label: 'Motorista / diárias', valor: 2250, cor: 'bg-blue-500' },
    ],
  },
  {
    id: '#TRP-8823',
    freteId: 'shp-003',
    freteNr: 'LF-240893',
    rota: 'Curitiba, PR → Campinas, SP',
    clienteNome: 'TransBrasil',
    motoristaNome: 'Ricardo Souza',
    motoristaId: 'mot-ricardo',
    veiculoPlaca: 'VAN-3341',
    veiculo: 'Sprinter 415',
    data: '20 Mai 2026',
    receita: 9800,
    custoOperacional: 5200,
    impostos: 1470,
    lucroLiquido: 3130,
    margem: 31.9,
    status: 'Abaixo da meta',
    custos: [
      { label: 'Combustível', valor: 2600, cor: 'bg-blue-300' },
      { label: 'Pedágio', valor: 450, cor: 'bg-blue-400' },
      { label: 'Motorista / diárias', valor: 2150, cor: 'bg-blue-500' },
    ],
  },
  {
    id: '#TRP-8810',
    freteId: 'shp-011',
    freteNr: 'LF-240885',
    rota: 'Belém, PA → Manaus, AM',
    clienteNome: 'Alfa Logistics',
    motoristaNome: 'Ricardo Souza',
    motoristaId: 'mot-ricardo',
    veiculoPlaca: 'VAN-3341',
    veiculo: 'Sprinter 415',
    data: '17 Mai 2026',
    receita: 35600,
    custoOperacional: 22100,
    impostos: 5340,
    lucroLiquido: 8160,
    margem: 22.9,
    status: 'Abaixo da meta',
    custos: [
      { label: 'Combustível', valor: 14200, cor: 'bg-blue-300' },
      { label: 'Pedágio', valor: 3200, cor: 'bg-blue-400' },
      { label: 'Motorista / diárias', valor: 4700, cor: 'bg-blue-500' },
    ],
  },
  {
    id: '#TRP-8812',
    freteId: 'shp-013',
    freteNr: 'LF-240887',
    rota: 'São Paulo, SP → Goiânia, GO',
    clienteNome: 'TransBrasil',
    motoristaNome: 'Carlos Henrique',
    motoristaId: 'mot-carlos',
    veiculoPlaca: 'BRA-2L22',
    veiculo: 'Scania R450',
    data: '16 Mai 2026',
    receita: 16800,
    custoOperacional: 9100,
    impostos: 2520,
    lucroLiquido: 5180,
    margem: 30.8,
    status: 'Abaixo da meta',
    custos: [
      { label: 'Combustível', valor: 4800, cor: 'bg-blue-300' },
      { label: 'Pedágio', valor: 1100, cor: 'bg-blue-400' },
      { label: 'Motorista / diárias', valor: 3200, cor: 'bg-blue-500' },
    ],
  },
];

const STATUS_STYLES: Record<StatusMargem, string> = {
  'Lucro Alto': 'bg-blue-50 text-blue-800 border-blue-200',
  'Lucro Médio': 'bg-primary/10 text-primary border-primary/20',
  'Abaixo da meta': 'bg-red-50 text-red-700 border-red-200',
};

type Props = {
  module: FinanceiroModuleDef;
  hubPath: string;
  hubLabel: string;
};

function MargemBar({ receita, custo, impostos, lucro }: { receita: number; custo: number; impostos: number; lucro: number }) {
  const pct = (v: number) => Math.max(4, (v / receita) * 100);
  return (
    <div className="space-y-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
        <div className="bg-blue-300 transition-all" style={{ width: `${pct(custo * 0.5)}%` }} title="Custos diretos" />
        <div className="bg-blue-500 transition-all" style={{ width: `${pct(custo * 0.35)}%` }} />
        <div className="bg-blue-400 transition-all" style={{ width: `${pct(impostos)}%` }} title="Impostos" />
        <div className="bg-primary transition-all" style={{ width: `${pct(lucro)}%` }} title="Lucro líquido" />
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase text-gray-500">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-300" /> Custos op.</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> Impostos</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Lucro líq.</span>
      </div>
    </div>
  );
}

export function FinanceiroMargemOperacionalView({ module, hubPath, hubLabel }: Props) {
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'acima' | 'abaixo' | StatusMargem>('todos');
  const [selected, setSelected] = useState<MargemViagem | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return VIAGENS_MARGEM.filter((v) => {
      if (filtro === 'acima' && v.margem < META_MARGEM) return false;
      if (filtro === 'abaixo' && v.margem >= META_MARGEM) return false;
      if (filtro !== 'todos' && filtro !== 'acima' && filtro !== 'abaixo' && v.status !== filtro) return false;
      if (!q) return true;
      return (
        v.freteNr.toLowerCase().includes(q) ||
        v.clienteNome.toLowerCase().includes(q) ||
        v.rota.toLowerCase().includes(q) ||
        v.motoristaNome.toLowerCase().includes(q)
      );
    });
  }, [search, filtro]);

  const totais = useMemo(() => {
    const receita = VIAGENS_MARGEM.reduce((s, v) => s + v.receita, 0);
    const lucro = VIAGENS_MARGEM.reduce((s, v) => s + v.lucroLiquido, 0);
    const margemMedia = VIAGENS_MARGEM.reduce((s, v) => s + v.margem, 0) / VIAGENS_MARGEM.length;
    const abaixoMeta = VIAGENS_MARGEM.filter((v) => v.margem < META_MARGEM).length;
    return { receita, lucro, margemMedia, abaixoMeta };
  }, []);

  return (
    <div className="logta-page-content space-y-6 text-left animate-in fade-in duration-500">
      <Link
        to={hubPath}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para {hubLabel}
      </Link>

      <div className="overflow-hidden rounded-[28px] border border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/25">
              <Percent size={26} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="logta-panel-eyebrow mb-1 text-primary/90">Financeiro · Operação · IA</p>
              <h2 className="logta-page-title text-2xl sm:text-3xl">{module.title}</h2>
              <p className="mt-2 max-w-xl text-sm font-medium text-blue-950/70">
                Margem <strong className="text-blue-900">bruta e líquida</strong> por viagem — receita, custos operacionais e resultado real da logística.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-white/80 px-4 py-3 shadow-sm">
            <Target size={18} className="text-primary" />
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400">Meta operacional</p>
              <p className="text-lg font-black text-primary">{META_MARGEM}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Percent size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Margem média (mês)</span>
          </div>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg logta-dashboard-stat-card__value--primary">
            {totais.margemMedia.toFixed(1)}%
          </p>
          <p className="logta-stat-card__hint flex items-center gap-1 text-primary">
            {totais.margemMedia >= META_MARGEM ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {totais.margemMedia >= META_MARGEM ? 'Acima da meta' : 'Abaixo da meta'}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Receita operacional</p>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg text-gray-900">
            R$ {totais.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="logta-stat-card__hint text-gray-500">Fretes no recorte</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 shadow-sm">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-blue-700/80">Lucro consolidado</p>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg logta-dashboard-stat-card__value--primary">
            R$ {totais.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="logta-stat-card__hint text-primary/70">Após impostos estimados</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5 shadow-sm">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-red-600">Abaixo da meta ({META_MARGEM}%)</p>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg text-red-600">
            {totais.abaixoMeta}
          </p>
          <p className="logta-stat-card__hint text-red-600/80">Viagens para revisão</p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/50 px-4 py-3">
        <Sparkles size={18} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-xs font-semibold leading-relaxed text-blue-900/90">
          <strong className="font-black">Insight IA:</strong> 3 viagens estão com margem abaixo de {META_MARGEM}% — custo de combustível na rota Belém→Manaus concentra 40% da receita. Sugestão: renegociar frete ou otimizar retorno.
        </p>
      </div>

      {selected ? (
        <div className="animate-in fade-in zoom-in-95 rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary"
          >
            <ArrowLeft size={16} /> Voltar para margem por viagem
          </button>

          <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="logta-panel-eyebrow mb-1">Frete {selected.freteNr}</p>
              <h3 className="text-xl font-black text-gray-900">{selected.rota}</h3>
              <p className="mt-1 text-sm font-bold text-gray-500">{selected.clienteNome} · {selected.data}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <Link to={`/fretes/operacional/${selected.freteId}`} className="rounded-lg bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200">
                  Ver frete
                </Link>
                <Link to={`/crm/clientes`} className="rounded-lg bg-blue-50 px-3 py-1.5 text-blue-700 hover:bg-blue-100">
                  {selected.clienteNome}
                </Link>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase ${STATUS_STYLES[selected.status]}`}>
                {selected.status}
              </span>
              <p className="mt-2 text-3xl font-black text-primary">{selected.margem.toFixed(1)}%</p>
              <p className="text-[10px] font-bold uppercase text-gray-400">Margem líquida</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-[10px] font-black uppercase text-gray-400">Composição da receita</p>
            <MargemBar
              receita={selected.receita}
              custo={selected.custoOperacional}
              impostos={selected.impostos}
              lucro={selected.lucroLiquido}
            />
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
              <p className="text-[10px] font-black uppercase text-gray-400">Receita</p>
              <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg mt-1 text-gray-900">
                R$ {selected.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-[10px] font-black uppercase text-blue-700/80">Custo operacional</p>
              <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg mt-1 text-gray-900">
                R$ {selected.custoOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-[10px] font-black uppercase text-blue-800/80">Impostos</p>
              <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg mt-1 text-gray-900">
                R$ {selected.impostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <p className="text-[10px] font-black uppercase text-blue-800">Lucro líquido</p>
              <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg logta-dashboard-stat-card__value--primary mt-1">
                R$ {selected.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <h4 className="logta-panel-eyebrow mb-4 py-0">Custos operacionais da viagem</h4>
          <div className="space-y-2">
            {selected.custos.map((c) => (
              <div key={c.label} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${c.cor}`} />
                  <span className="text-sm font-bold text-gray-800">{c.label}</span>
                </div>
                <span className="font-black text-gray-900">
                  R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>

          {selected.margem < META_MARGEM ? (
            <button
              type="button"
              onClick={() => showToast('info', 'Simulação de cenário com IA em breve.', 'Margem')}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase text-white hover:bg-primary/90"
            >
              <Sparkles size={14} /> Simular melhoria de margem
            </button>
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
                placeholder="Buscar frete, cliente ou rota..."
                className="w-full rounded-2xl border border-gray-200 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['todos', 'Todos'],
                  ['acima', `≥ ${META_MARGEM}%`],
                  ['abaixo', `< ${META_MARGEM}%`],
                  ['Lucro Alto', 'Lucro alto'],
                  ['Abaixo da meta', 'Alerta'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFiltro(key)}
                  className={`logta-filter-chip rounded-full px-3 py-1.5 transition-colors ${
                    filtro === key
                      ? 'bg-primary text-white'
                      : 'border border-gray-200 bg-gray-50 text-gray-600 hover:border-primary/30'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="hub-premium-pill secondary shrink-0">
              <Filter size={16} /> Período
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm text-gray-600">
              <thead className="border-b border-blue-100/80 bg-blue-50/40 text-[10px] font-black uppercase tracking-wider text-blue-900/70">
                <tr>
                  <th className="p-4 pl-6">Frete / Rota</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4 text-right">Receita</th>
                  <th className="p-4 text-right">Custo op.</th>
                  <th className="p-4 text-right">Impostos</th>
                  <th className="p-4 text-right font-black text-primary">Lucro líq.</th>
                  <th className="p-4 text-center">Margem</th>
                  <th className="p-4 pr-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((v) => {
                  const acimaMeta = v.margem >= META_MARGEM;
                  return (
                    <tr
                      key={v.id}
                      onClick={() => setSelected(v)}
                      className="cursor-pointer transition-colors hover:bg-blue-50/25"
                    >
                      <td className="p-4 pl-6">
                        <p className="font-black text-gray-900">{v.freteNr}</p>
                        <p className="max-w-[220px] truncate text-xs text-gray-500">{v.rota}</p>
                      </td>
                      <td className="p-4 font-bold text-gray-800">{v.clienteNome}</td>
                      <td className="p-4 text-right font-semibold text-gray-900">
                        R$ {v.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right font-semibold text-blue-700">
                        R$ {v.custoOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right font-semibold text-blue-800">
                        R$ {v.impostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right font-black text-primary">
                        R$ {v.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex min-w-[3.5rem] items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-sm font-black ${
                            acimaMeta ? 'bg-primary/10 text-primary' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {acimaMeta ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {v.margem.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${STATUS_STYLES[v.status]}`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-sm font-bold text-gray-400">Nenhuma viagem com esse filtro.</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
