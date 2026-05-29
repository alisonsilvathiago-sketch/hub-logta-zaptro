import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Filter, Plus, Search, Sparkles, MapPin, Truck, User, Building2, Package } from 'lucide-react';
import { ExportFormatModal } from '../../../components/ExportFormatModal';
import { LogtaEmptyState } from '../../../components/EmptyState';
import { showToast } from '../../../components/Toast';
import type { FinanceiroModuleDef } from '../types';
import { getTollTagProviderForPlate } from '../../../lib/vehicleTollTag';

type FinanceiroFeatureWorkspaceProps = {
  module: FinanceiroModuleDef;
  hubPath: string;
  hubLabel: string;
  transactionCount?: number;
  saldo?: number;
};

export function FinanceiroFeatureWorkspace({
  module,
  hubPath,
  hubLabel,
  transactionCount = 0,
  saldo = 0,
}: FinanceiroFeatureWorkspaceProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [expandedMov, setExpandedMov] = useState<number | null>(null);
  const [expandedLaunch, setExpandedLaunch] = useState<number | null>(null);
  const Icon = module.icon;

  const mockTrips = [
    { id: '#TRP-8821', rota: 'São Paulo, SP → Rio de Janeiro, RJ', rotaId: 'shp-001', combustivel: 4100, pedagio: 800, pracas: 4, tagPagamento: getTollTagProviderForPlate('BRA-2L22'), motorista: 3300, total: 8200, status: 'Concluído', veiculo: 'Scania R450 (BRA-2L22)', veiculoPlaca: 'BRA-2L22', motoristaNome: 'Carlos Henrique', motoristaId: 'mot-carlos', clienteNome: 'Alfa Logistics', clienteId: 'cli-alfa', carga: 'Bobinas de Aço (28 ton)', data: '18 Mai 2026' },
    { id: '#TRP-8822', rota: 'São Paulo, SP → Belo Horizonte, MG', rotaId: 'shp-002', combustivel: 2800, pedagio: 550, pracas: 3, tagPagamento: getTollTagProviderForPlate('TRK-204'), motorista: 2250, total: 5600, status: 'Em trânsito', veiculo: 'Volvo FH 540 (TRK-204)', veiculoPlaca: 'TRK-204', motoristaNome: 'Pedro Almeida', motoristaId: 'mot-pedro', clienteNome: 'Prime Cargo', clienteId: 'cli-prime', carga: 'Bebidas Paletizadas (20 ton)', data: '19 Mai 2026' },
    { id: '#TRP-8823', rota: 'Curitiba, PR → Campinas, SP', rotaId: 'shp-003', combustivel: 2600, pedagio: 450, pracas: 2, tagPagamento: getTollTagProviderForPlate('VAN-3341'), motorista: 2150, total: 5200, status: 'Pendente', veiculo: 'Sprinter 415 (VAN-3341)', veiculoPlaca: 'VAN-3341', motoristaNome: 'Ricardo Souza', motoristaId: 'mot-ricardo', clienteNome: 'TransBrasil', clienteId: 'cli-trans', carga: 'Minério de Ferro (35 ton)', data: '20 Mai 2026' },
  ];

  const mockProfits = [
    { id: '#TRP-8821', rota: 'São Paulo, SP → Rio de Janeiro, RJ', rotaId: 'shp-001', receita: 18450, custo: 8200, impostos: 2767, lucro: 7483, margem: 40.5, status: 'Lucro Alto', data: '18 Mai 2026', veiculo: 'Scania R450 (BRA-2L22)', veiculoPlaca: 'BRA-2L22', motoristaNome: 'Carlos Henrique', motoristaId: 'mot-carlos', clienteNome: 'Alfa Logistics', clienteId: 'cli-alfa', carga: 'Bobinas de Aço (28 ton)' },
    { id: '#TRP-8822', rota: 'São Paulo, SP → Belo Horizonte, MG', rotaId: 'shp-002', receita: 12200, custo: 5600, impostos: 1830, lucro: 4770, margem: 39.1, status: 'Lucro Médio', data: '19 Mai 2026', veiculo: 'Volvo FH 540 (TRK-204)', veiculoPlaca: 'TRK-204', motoristaNome: 'Pedro Almeida', motoristaId: 'mot-pedro', clienteNome: 'Prime Cargo', clienteId: 'cli-prime', carga: 'Bebidas Paletizadas (20 ton)' },
    { id: '#TRP-8823', rota: 'Curitiba, PR → Campinas, SP', rotaId: 'shp-003', receita: 9800, custo: 5200, impostos: 1470, lucro: 3130, margem: 31.9, status: 'Lucro Médio', data: '20 Mai 2026', veiculo: 'Sprinter 415 (VAN-3341)', veiculoPlaca: 'VAN-3341', motoristaNome: 'Ricardo Souza', motoristaId: 'mot-ricardo', clienteNome: 'TransBrasil', clienteId: 'cli-trans', carga: 'Minério de Ferro (35 ton)' },
  ];

  const integrationLabels: Record<string, string> = {
    frota: 'Frota',
    rh: 'RH',
    logistica: 'Logística',
    fiscal: 'Fiscal',
    bancario: 'Bancário',
    crm: 'CRM',
  };

  const kpis = useMemo(() => {
    if (module.slug === 'custos-por-viagem') {
      return [
        { label: 'Viagens Ativas (Mês)', value: '124', tone: 'primary' as const },
        { label: 'Custo Total (Mês)', value: 'R$ 45.200,00', tone: 'primary' as const },
        { label: 'Custo Médio / Viagem', value: 'R$ 364,51', tone: 'primary' as const },
        { label: 'Alertas de Excedente', value: '2', tone: 'danger' as const },
      ];
    }

    if (module.slug === 'lucro-viagem') {
      return [
        { label: 'Receita Bruta (Mês)', value: 'R$ 124.500,00', tone: 'primary' as const },
        { label: 'Lucro Líquido Real', value: 'R$ 38.450,00', tone: 'success' as const },
        { label: 'Margem Média', value: '30.8%', tone: 'primary' as const },
        { label: 'Viagens em Prejuízo', value: '0', tone: 'success' as const },
      ];
    }

    if (module.slug === 'custos-combustivel') {
      return [
        { label: 'Consumo Total', value: '4.500 L', tone: 'primary' as const },
        { label: 'Gasto no Mês', value: 'R$ 26.550,00', tone: 'primary' as const },
        { label: 'Média de Preço / L', value: 'R$ 5,90', tone: 'primary' as const },
        { label: 'Consumo Anormal', value: '1', tone: 'danger' as const },
      ];
    }

    if (module.slug === 'controle-pedagios') {
      const totalPedagio = mockTrips.reduce((s, t) => s + t.pedagio, 0);
      const mediaViagem = mockTrips.length ? totalPedagio / mockTrips.length : 0;
      const pendentes = mockTrips.filter((t) => t.status === 'Pendente').length;
      const gastoMes = totalPedagio * 42;
      return [
        { label: 'Gasto em Pedágios (Mês)', value: `R$ ${gastoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, tone: 'primary' as const },
        { label: 'Viagens com Tag', value: String(mockTrips.length + 115), tone: 'primary' as const },
        { label: 'Média por Viagem', value: `R$ ${mediaViagem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, tone: 'primary' as const },
        { label: 'Lançamentos Pendentes', value: String(pendentes), tone: pendentes > 0 ? ('danger' as const) : ('success' as const) },
      ];
    }

    return (
      module.kpis ?? [
        { label: 'Transações', value: String(transactionCount), tone: 'primary' as const },
        { label: 'Saldo projetado', value: `R$ ${saldo.toLocaleString('pt-BR')}`, tone: 'primary' as const },
        { label: 'Pendências', value: '0', tone: 'danger' as const },
        { label: 'Aprovados (mês)', value: '—', tone: 'success' as const },
      ]
    );
  }, [module.slug, module.kpis, transactionCount, saldo, mockTrips, mockProfits]);

  const isPedagios = module.slug === 'controle-pedagios';
  const listRows = module.slug === 'lucro-viagem' ? mockProfits : mockTrips;

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-500">
      <Link
        to={hubPath}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para {hubLabel}
      </Link>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon size={26} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="logta-page-title text-2xl sm:text-3xl">{module.title}</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium text-gray-500">{module.description}</p>
            {module.integrations?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {module.integrations.map((key) => (
                  <span
                    key={key}
                    className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-normal text-gray-600"
                  >
                    {integrationLabels[key]}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-all hover:bg-primary/90"
            title="Novo registro"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="logta-stat-card">
            <p className="logta-stat-card__label logta-stat-card__label--spaced uppercase tracking-wider">{kpi.label}</p>
            <p className={`logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg ${
              kpi.tone === 'danger' ? 'text-red-500' :
              kpi.tone === 'success' ? 'text-green-500' :
              'logta-dashboard-stat-card__value--primary'
            }`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="logta-performance-section">
        <div className="logta-panel-card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar em ${module.title}...`}
                className="w-full rounded-2xl border border-gray-200 py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary/50"
              />
            </div>
            <button type="button" className="hub-premium-pill secondary shrink-0">
              <Filter size={16} /> Filtros avançados
            </button>
          </div>
          <div className="p-0">
            {selectedTrip ? (
              <div className="animate-in fade-in zoom-in-95 px-[39px] py-[36px] duration-300">
                <button onClick={() => setSelectedTrip(null)} className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-primary">
                  <ArrowLeft size={16} /> Voltar para lista de {module.title.toLowerCase()}
                </button>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="mb-2 text-2xl font-black text-gray-900">Registro {selectedTrip.id} - {module.title}</h3>
                    <p className="my-[5px] py-[5px] text-[15px] font-black leading-tight text-gray-900">{selectedTrip.rota}</p>
                    <div className="my-[5px] flex flex-wrap items-center gap-2 py-[6px] text-xs font-bold">
                      <Link to={`/fretes/operacional/${selectedTrip.rotaId}`} className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900" title={`Frete ID: ${selectedTrip.rotaId}`}>
                        <MapPin size={12} /> Ver frete
                      </Link>
                      <span className="text-gray-300">•</span>
                      <Link to={`/frota/veiculos/${selectedTrip.veiculoPlaca}`} className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700" title={`Veículo Placa: ${selectedTrip.veiculoPlaca}`}>
                        <Truck size={12} /> {selectedTrip.veiculo}
                      </Link>
                      <span className="text-gray-300">•</span>
                      <Link to={`/rh/motoristas/${selectedTrip.motoristaId}`} className="flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-purple-600 transition-colors hover:bg-purple-100 hover:text-purple-700" title={`Motorista ID: ${selectedTrip.motoristaId}`}>
                        <User size={12} /> {selectedTrip.motoristaNome}
                      </Link>
                    </div>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase bg-primary/10 text-primary`}>
                    Análise IA Ativa
                  </span>
                </div>
                
                <div className="mt-[15px] mb-[50px] grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {isPedagios ? (
                    <>
                      <div className="logta-stat-card">
                        <p className="logta-stat-card__label logta-stat-card__label--spaced uppercase tracking-wider text-gray-400">Total Pedágio</p>
                        <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg logta-dashboard-stat-card__value--primary mt-1">
                          R$ {selectedTrip.pedagio?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ?? '0,00'}
                        </p>
                      </div>
                      <div className="logta-stat-card">
                        <p className="logta-stat-card__label logta-stat-card__label--spaced uppercase tracking-wider text-gray-400">Tag / Pagamento</p>
                        <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg mt-1 text-gray-900">
                          {selectedTrip.tagPagamento ?? '—'}
                        </p>
                      </div>
                      <div className="logta-stat-card">
                        <p className="logta-stat-card__label logta-stat-card__label--spaced uppercase tracking-wider text-gray-400">Praças na Rota</p>
                        <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg mt-1 text-gray-900">
                          {selectedTrip.pracas ?? '—'}
                        </p>
                      </div>
                      <div className="logta-stat-card border-primary/20 bg-primary/5">
                        <p className="logta-stat-card__label logta-stat-card__label--spaced uppercase tracking-wider text-primary">Média / Praça</p>
                        <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg logta-dashboard-stat-card__value--primary mt-1">
                          R${' '}
                          {selectedTrip.pracas
                            ? (selectedTrip.pedagio / selectedTrip.pracas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                            : '0,00'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="logta-stat-card">
                        <p className="logta-stat-card__label logta-stat-card__label--spaced uppercase tracking-wider text-gray-400">Receita / Base</p>
                        <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg logta-dashboard-stat-card__value--primary mt-1">
                          R$ {selectedTrip.receita ? selectedTrip.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : selectedTrip.combustivel?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                        </p>
                      </div>
                      <div className="logta-stat-card">
                        <p className="logta-stat-card__label logta-stat-card__label--spaced uppercase tracking-wider text-gray-400">Custo Direto</p>
                        <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg mt-1 text-red-500">
                          - R$ {selectedTrip.custo ? selectedTrip.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : selectedTrip.pedagio?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                        </p>
                      </div>
                      <div className="logta-stat-card">
                        <p className="logta-stat-card__label logta-stat-card__label--spaced uppercase tracking-wider text-gray-400">Despesas Adicionais</p>
                        <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg mt-1 text-orange-500">
                          - R$ {selectedTrip.impostos ? selectedTrip.impostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : selectedTrip.motorista?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                        </p>
                      </div>
                      <div className="logta-stat-card border-primary/20 bg-primary/5">
                        <p className="logta-stat-card__label logta-stat-card__label--spaced uppercase tracking-wider text-primary">Resultado Final</p>
                        <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg logta-dashboard-stat-card__value--primary mt-1">
                          R$ {selectedTrip.lucro ? selectedTrip.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : selectedTrip.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <h4 className="logta-panel-eyebrow py-[10px]">Detalhamento Inteligente ({module.title})</h4>
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-black uppercase tracking-wider text-gray-400">
                      <tr>
                        <th className="p-4 pl-6">Data</th>
                        <th className="p-4">Descrição</th>
                        <th className="p-4">Categoria</th>
                        <th className="p-4 pr-6 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => setExpandedLaunch(expandedLaunch === 1 ? null : 1)}>
                        <td className="p-4 pl-6 font-medium">{selectedTrip.data}</td>
                        <td className="p-4">Integração Principal - {module.title}</td>
                        <td className="p-4"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">Operacional</span></td>
                        <td className="p-4 pr-6 text-right font-bold text-gray-900">R$ {selectedTrip.lucro ? selectedTrip.lucro.toLocaleString('pt-BR', {minimumFractionDigits: 2}) : selectedTrip.total?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</td>
                      </tr>
                      {expandedLaunch === 1 && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={4} className="p-4 pl-6 pr-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
                              <div>
                                <p className="font-bold text-gray-900 mb-1 text-sm">Registro Integrado Logta</p>
                                <p className="text-gray-500 text-xs">Informação sincronizada automaticamente para <strong>{module.title}</strong>.</p>
                              </div>
                              <button className="shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-200 transition-colors">Ver Mais</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : transactionCount > 0 || module.category === 'operacional' || module.category === 'gestao' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="p-4 pl-6">ID / Viagem</th>
                      <th className="p-4">{isPedagios ? 'Valor Pedágio' : 'Métrica Principal'}</th>
                      <th className="p-4">{isPedagios ? 'Tag / Pagamento' : 'Métrica Secundária'}</th>
                      <th className="p-4">{isPedagios ? 'Praças na Rota' : 'Variável Operacional'}</th>
                      <th className="p-4">{isPedagios ? 'Veículo' : 'Resultado Consolidado'}</th>
                      <th className="p-4 pr-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(listRows as any[]).map((trip: any) => (
                      <tr key={trip.id} onClick={() => setSelectedTrip(trip)} className="group cursor-pointer transition-colors hover:bg-gray-50">
                        <td className="p-4 pl-6">
                          <div className="font-bold text-gray-900 transition-colors group-hover:text-primary">{trip.id}</div>
                          <div className="text-xs text-gray-500">{trip.rota}</div>
                        </td>
                        {isPedagios ? (
                          <>
                            <td className="p-4 font-black text-primary">
                              R$ {trip.pedagio?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ?? '0,00'}
                            </td>
                            <td className="p-4 font-medium text-gray-700">{trip.tagPagamento ?? '—'}</td>
                            <td className="p-4 font-medium text-gray-700">{trip.pracas ?? '—'} praças</td>
                            <td className="p-4 text-xs font-bold text-gray-600">{trip.veiculo}</td>
                          </>
                        ) : (
                          <>
                            <td className="p-4 font-medium text-gray-700">
                              R$ {trip.receita ? trip.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : trip.combustivel?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                            </td>
                            <td className="p-4 font-medium text-gray-700">
                              R$ {trip.custo ? trip.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : trip.pedagio?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                            </td>
                            <td className="p-4 font-medium text-gray-700">
                              R$ {trip.lucro ? trip.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : trip.motorista?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                            </td>
                            <td className="p-4 font-black text-primary">
                              R$ {trip.lucro ? trip.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : trip.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                            </td>
                          </>
                        )}
                        <td className="p-4 pr-6 text-right">
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-700 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                            {trip.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6">
                <LogtaEmptyState
                  type="financeiro"
                  onAction={() => showToast('info', 'Cadastre lançamentos para popular este módulo.', module.title)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title={`Exportar — ${module.title}`}
        getTabularData={() => ({
          title: module.title,
          filenameBase: `financeiro-${module.slug}`,
          columns: ['Campo', 'Valor'],
          rows: [
            ['Módulo', module.title],
            ['Categoria', module.category],
            ['Transações', String(transactionCount)],
            ['Saldo', `R$ ${saldo.toLocaleString('pt-BR')}`],
            ['Busca', search || '—'],
          ],
        })}
      />

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-[32px] border border-neutral-800 bg-[#18191B] p-8 shadow-2xl text-left animate-in zoom-in-95 text-white">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-neutral-800">
              <div>
                <h3 className="logta-modal-title leading-none tracking-tight">Novo Registro em {module.title}</h3>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-normal mt-1.5">Sincronização Automática Ativa</p>
              </div>
            </div>
            {module.slug === 'custos-combustivel' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-[10px] font-black text-neutral-400 uppercase tracking-wider">Veículo (Placa)</label>
                    <input type="text" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary transition-all" placeholder="Ex: BRA-2L22" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black text-neutral-400 uppercase tracking-wider">Condutor (Motorista)</label>
                    <input type="text" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary transition-all" placeholder="Ex: Thiago Silva" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black text-neutral-400 uppercase tracking-wider">Posto de Combustível</label>
                  <input type="text" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary transition-all" placeholder="Ex: Ipiranga Centro" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black text-neutral-400 uppercase tracking-wider">Tipo de Combustível / Insumo</label>
                  <select className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary transition-all">
                    <option>Diesel S10</option>
                    <option>Diesel S500</option>
                    <option>Gasolina</option>
                    <option>Etanol</option>
                    <option>GNV (Metro Cúbico)</option>
                    <option>Arla 32</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black text-neutral-400 uppercase tracking-wider">Custo Total Calculado (R$)</label>
                  <input type="number" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-lg font-black text-primary outline-none focus:border-primary transition-all" placeholder="0,00" />
                </div>
              </div>
            ) : module.slug === 'controle-pedagios' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-[10px] font-black text-neutral-400 uppercase tracking-wider">Veículo (Placa)</label>
                    <input type="text" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary transition-all" placeholder="Ex: BRA-2L22" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black text-neutral-400 uppercase tracking-wider">Tipo de Pagamento</label>
                    <select className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary transition-all">
                      <option>Tag Sem Parar</option>
                      <option>Tag ConectCar</option>
                      <option>Tag Veloe</option>
                      <option>Dinheiro (Vale-Pedágio)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black text-neutral-400 uppercase tracking-wider">Número da Tag (se houver)</label>
                  <input type="text" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary transition-all" placeholder="Ex: 009283719" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-[10px] font-black text-neutral-400 uppercase tracking-wider">Data de Ativação / Uso</label>
                    <input type="date" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary transition-all" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black text-neutral-400 uppercase tracking-wider">Valor (R$)</label>
                    <input type="number" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-lg font-black text-primary outline-none focus:border-primary transition-all" placeholder="R$ 0,00" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[10px] font-black text-neutral-400 uppercase tracking-wider">Descrição / Viagem ID</label>
                  <input type="text" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary transition-all" placeholder="Ex: Rota SP -> RJ" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black text-neutral-400 uppercase tracking-wider">Custo Calculado (R$)</label>
                  <input type="number" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-lg font-black text-primary outline-none focus:border-primary transition-all" placeholder="0,00" />
                </div>
              </div>
            )}
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-xl px-5 py-2.5 text-xs font-bold uppercase text-neutral-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={() => { showToast('success', 'Registro gerado e vinculado automaticamente!', 'Sucesso'); setIsAddModalOpen(false); }} className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
                Salvar Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
