import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Inbox,
  AlertCircle,
  BarChart2,
  Sparkles,
  Users,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import type { RhModuleDef } from '../../types';

type SolicitacoesInternasViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

type StatusSolicitacao = 'Aberta' | 'Em análise' | 'Aprovada' | 'Rejeitada';
type TipoSolicitacao = 'Férias' | 'Benefício' | 'Equipamento' | 'Documentação' | 'Outros';

const mockSolicitacoes = [
  {
    id: 'sol-001',
    colaborador: 'Carlos Eduardo Mota',
    tipo: 'Férias' as TipoSolicitacao,
    descricao: 'Solicitação de férias de 15 dias em julho de 2025',
    urgencia: 'Média',
    dataAbertura: '2025-05-18',
    dataDesejada: '2025-07-01',
    status: 'Em análise' as StatusSolicitacao,
  },
  {
    id: 'sol-002',
    colaborador: 'Fernanda Lima',
    tipo: 'Benefício' as TipoSolicitacao,
    descricao: 'Inclusão de dependente no plano de saúde — filha recém-nascida',
    urgencia: 'Alta',
    dataAbertura: '2025-05-17',
    dataDesejada: '2025-05-25',
    status: 'Aprovada' as StatusSolicitacao,
  },
  {
    id: 'sol-003',
    colaborador: 'Rodrigo Andrade',
    tipo: 'Equipamento' as TipoSolicitacao,
    descricao: 'Substituição de tablet de bordo danificado durante rota',
    urgencia: 'Alta',
    dataAbertura: '2025-05-15',
    dataDesejada: '2025-05-22',
    status: 'Aberta' as StatusSolicitacao,
  },
  {
    id: 'sol-004',
    colaborador: 'Patrícia Souza',
    tipo: 'Documentação' as TipoSolicitacao,
    descricao: 'Solicitação de declaração de vínculo empregatício para financiamento',
    urgencia: 'Baixa',
    dataAbertura: '2025-05-12',
    dataDesejada: '2025-05-20',
    status: 'Aprovada' as StatusSolicitacao,
  },
  {
    id: 'sol-005',
    colaborador: 'Marcos Vinícius Santos',
    tipo: 'Benefício' as TipoSolicitacao,
    descricao: 'Solicitação de vale-transporte adicional por mudança de endereço',
    urgencia: 'Média',
    dataAbertura: '2025-05-10',
    dataDesejada: '2025-06-01',
    status: 'Rejeitada' as StatusSolicitacao,
  },
  {
    id: 'sol-006',
    colaborador: 'Juliana Figueiredo',
    tipo: 'Outros' as TipoSolicitacao,
    descricao: 'Pedido de horário flexível para acompanhamento médico semanal',
    urgencia: 'Média',
    dataAbertura: '2025-05-08',
    dataDesejada: '2025-06-01',
    status: 'Em análise' as StatusSolicitacao,
  },
];

const statusColors: Record<StatusSolicitacao, string> = {
  Aberta: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  'Em análise': 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  Aprovada: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Rejeitada: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

const statusIcons: Record<StatusSolicitacao, React.ReactNode> = {
  Aberta: <Inbox size={16} className="text-blue-400" />,
  'Em análise': <Clock size={16} className="text-yellow-400" />,
  Aprovada: <CheckCircle2 size={16} className="text-emerald-400" />,
  Rejeitada: <XCircle size={16} className="text-red-400" />,
};

const tipoColors: Record<TipoSolicitacao, string> = {
  Férias: 'text-sky-400',
  Benefício: 'text-violet-400',
  Equipamento: 'text-orange-400',
  Documentação: 'text-teal-400',
  Outros: 'text-neutral-400',
};

export function SolicitacoesInternasView({ module, hubPath, hubLabel }: SolicitacoesInternasViewProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formColaborador, setFormColaborador] = useState('');
  const [formTipo, setFormTipo] = useState('Férias');
  const [formDescricao, setFormDescricao] = useState('');
  const [formUrgencia, setFormUrgencia] = useState('Média');
  const [formDataDesejada, setFormDataDesejada] = useState('');

  const kpis = [
    {
      icon: <Inbox size={18} />,
      title: 'Solicitações Abertas',
      value: '23',
      trend: 'neutral' as const,
      trendValue: 'Aguardando análise',
    },
    {
      icon: <CheckCircle2 size={18} />,
      title: 'Aprovadas',
      value: '45',
      trend: 'up' as const,
      trendValue: '+8 este mês',
    },
    {
      icon: <Clock size={18} />,
      title: 'Em Análise',
      value: '12',
      trend: 'neutral' as const,
      trendValue: 'Em processamento',
    },
    {
      icon: <ClipboardList size={18} />,
      title: 'Tempo Médio',
      value: '2.3 dias',
      trend: 'down' as const,
      trendValue: '-0.5 dia vs. mês anterior',
    },
  ];

  const handleSalvar = () => {
    if (!formColaborador.trim()) {
      showToast('error', 'Selecione o colaborador.', 'Atenção');
      return;
    }
    showToast('success', `Solicitação de ${formTipo} registrada com sucesso!`, 'Sucesso');
    setFormColaborador('');
    setFormTipo('Férias');
    setFormDescricao('');
    setFormUrgencia('Média');
    setFormDataDesejada('');
    setIsModalOpen(false);
  };

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Nova Solicitação"
      aria-label="Nova Solicitação"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={20} strokeWidth={2.5} />
    </button>
  );

  const tipoCount = mockSolicitacoes.reduce<Record<string, number>>((acc, s) => {
    acc[s.tipo] = (acc[s.tipo] || 0) + 1;
    return acc;
  }, {});

  const sidePanel = (
    <>
      {/* Painel IA */}
      <div className="logta-panel-card--dark logta-panel-card--retention p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-violet-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-violet-400">
            Logta IA · Análise
          </span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-neutral-300">
          Solicitações de <span className="font-bold text-white">Benefícios</span> cresceram{' '}
          <span className="text-yellow-400 font-semibold">42% em 30 dias</span>. Recomendamos
          revisar a política de benefícios na próxima reunião de RH.
        </p>
        <div className="mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
          <p className="text-xs font-semibold text-emerald-300 mb-1">✅ Predição de Aprovação</p>
          <p className="text-xs text-neutral-400">
            <strong className="text-white">78%</strong> das solicitações abertas têm alta
            probabilidade de aprovação com base no histórico.
          </p>
        </div>
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-xs font-semibold text-red-300 mb-1">⏰ Alerta de SLA</p>
          <p className="text-xs text-neutral-400">
            <strong className="text-white">3 solicitações</strong> estão prestes a ultrapassar
            o SLA de 5 dias úteis. Ação necessária.
          </p>
        </div>
      </div>

      {/* Painel Métricas */}
      <div className="logta-panel-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart2 size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Por Tipo de Solicitação
          </span>
        </div>
        <div className="space-y-2.5">
          {Object.entries(tipoCount)
            .sort(([, a], [, b]) => b - a)
            .map(([tipo, count]) => (
              <div key={tipo} className="flex items-center justify-between">
                <span className={`text-sm font-medium ${tipoColors[tipo as TipoSolicitacao]}`}>
                  {tipo}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 rounded-full bg-neutral-800">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${(count / mockSolicitacoes.length) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 text-right text-xs font-bold text-white">{count}</span>
                </div>
              </div>
            ))}
        </div>
        <div className="mt-5 border-t border-neutral-800 pt-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Por Status
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { label: 'Abertas', value: 23, color: 'text-blue-400' },
                { label: 'Em Análise', value: 12, color: 'text-yellow-400' },
                { label: 'Aprovadas', value: 45, color: 'text-emerald-400' },
                { label: 'Rejeitadas', value: 6, color: 'text-red-400' },
              ] as const
            ).map((item) => (
              <div key={item.label} className="rounded-xl bg-neutral-800/50 p-2.5 text-center">
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[11px] text-neutral-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-8 text-left">
      <Link
        to={hubPath}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para {hubLabel}
      </Link>

      <LogtaStandardPageLayout
        title={module.title}
        kpis={kpis}
        mainContentTitle="Solicitações dos Colaboradores"
        mainContentAction={mainContentAction}
        sidePanel={sidePanel}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-2">
          {mockSolicitacoes.map((sol) => (
            <div
              key={sol.id}
              className="group flex items-start gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:border-primary/30 hover:bg-neutral-900"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-800">
                {statusIcons[sol.status]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{sol.colaborador}</p>
                  <span
                    className={`text-[11px] font-bold ${tipoColors[sol.tipo]}`}
                  >
                    · {sol.tipo}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-neutral-400">{sol.descricao}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> Aberta em{' '}
                    {new Date(sol.dataAbertura).toLocaleDateString('pt-BR')}
                  </span>
                  <span>·</span>
                  <span>Desejada: {new Date(sol.dataDesejada).toLocaleDateString('pt-BR')}</span>
                  <span>·</span>
                  <span
                    className={
                      sol.urgencia === 'Alta'
                        ? 'text-red-400'
                        : sol.urgencia === 'Média'
                        ? 'text-yellow-400'
                        : 'text-blue-400'
                    }
                  >
                    {sol.urgencia === 'Alta' && <AlertCircle size={11} className="inline mr-0.5" />}
                    Urgência {sol.urgencia}
                  </span>
                </div>
              </div>
              <span
                className={`shrink-0 self-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusColors[sol.status]}`}
              >
                {sol.status}
              </span>
            </div>
          ))}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Solicitações"
        getTabularData={() => ({
          title: 'Solicitações Internas',
          filenameBase: 'rh-solicitacoes-internas',
          columns: ['Colaborador', 'Tipo', 'Urgência', 'Data Abertura', 'Data Desejada', 'Status'],
          rows: mockSolicitacoes.map((s) => [
            s.colaborador,
            s.tipo,
            s.urgencia,
            new Date(s.dataAbertura).toLocaleDateString('pt-BR'),
            new Date(s.dataDesejada).toLocaleDateString('pt-BR'),
            s.status,
          ]),
        })}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-200 items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Fechar"
            onClick={() => setIsModalOpen(false)}
          />
          <div
            className="relative max-h-[min(92dvh,680px)] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-neutral-800 bg-[#18191B] p-6 text-left shadow-2xl duration-200 animate-in zoom-in-95 sm:rounded-[40px] sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <LogtaModalHeader
              icon={<ClipboardList size={20} />}
              title="Nova Solicitação"
              onClose={() => setIsModalOpen(false)}
            />
            <div className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                  Colaborador
                </label>
                <select
                  value={formColaborador}
                  onChange={(e) => setFormColaborador(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Selecione o colaborador</option>
                  <option value="Carlos Eduardo Mota">Carlos Eduardo Mota</option>
                  <option value="Fernanda Lima">Fernanda Lima</option>
                  <option value="Rodrigo Andrade">Rodrigo Andrade</option>
                  <option value="Patrícia Souza">Patrícia Souza</option>
                  <option value="Marcos Vinícius Santos">Marcos Vinícius Santos</option>
                  <option value="Juliana Figueiredo">Juliana Figueiredo</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                    Tipo
                  </label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="Férias">Férias</option>
                    <option value="Benefício">Benefício</option>
                    <option value="Equipamento">Equipamento</option>
                    <option value="Documentação">Documentação</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                    Urgência
                  </label>
                  <select
                    value={formUrgencia}
                    onChange={(e) => setFormUrgencia(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Descreva a solicitação em detalhes..."
                  className="w-full resize-none rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                  Data Desejada
                </label>
                <input
                  type="date"
                  value={formDataDesejada}
                  onChange={(e) => setFormDataDesejada(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-2xl border border-neutral-700 py-3.5 text-sm font-bold text-neutral-300 transition-colors hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvar}
                  className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Registrar Solicitação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
