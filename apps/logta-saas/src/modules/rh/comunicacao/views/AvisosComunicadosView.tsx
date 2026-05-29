import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Bell,
  AlertTriangle,
  CheckSquare,
  Clock,
  Eye,
  Send,
  FileText,
  TrendingUp,
  BarChart2,
  Sparkles,
  Users,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import type { RhModuleDef } from '../../types';

type AvisosComunicadosViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

type PrioridadeType = 'Alta' | 'Média' | 'Baixa';

const mockAvisos = [
  {
    id: 'av-001',
    titulo: 'Mudança de Turno — Equipe Noturna (Junho)',
    destinatario: 'Motoristas',
    prioridade: 'Alta' as PrioridadeType,
    data: '2025-05-20',
    lido: false,
    confirmado: false,
  },
  {
    id: 'av-002',
    titulo: 'Advertência de Segurança: Uso Obrigatório de EPI',
    destinatario: 'Operações',
    prioridade: 'Alta' as PrioridadeType,
    data: '2025-05-18',
    lido: false,
    confirmado: false,
  },
  {
    id: 'av-003',
    titulo: 'Informativo: Reajuste do Plano de Saúde 2025',
    destinatario: 'Todos',
    prioridade: 'Média' as PrioridadeType,
    data: '2025-05-15',
    lido: true,
    confirmado: true,
  },
  {
    id: 'av-004',
    titulo: 'Lembrete: Entrega de Documentos para Férias',
    destinatario: 'Administrativo',
    prioridade: 'Média' as PrioridadeType,
    data: '2025-05-12',
    lido: true,
    confirmado: false,
  },
  {
    id: 'av-005',
    titulo: 'Comunicado: Novo Refeitório em Operação',
    destinatario: 'Todos',
    prioridade: 'Baixa' as PrioridadeType,
    data: '2025-05-08',
    lido: true,
    confirmado: true,
  },
];

const prioridadeColors: Record<PrioridadeType, string> = {
  Alta: 'bg-red-500/15 text-red-400 border border-red-500/30',
  Média: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  Baixa: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
};

const prioridadeIcons: Record<PrioridadeType, React.ReactNode> = {
  Alta: <AlertTriangle size={12} className="text-red-400" />,
  Média: <Bell size={12} className="text-yellow-400" />,
  Baixa: <FileText size={12} className="text-blue-400" />,
};

export function AvisosComunicadosView({ module, hubPath, hubLabel }: AvisosComunicadosViewProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formTitulo, setFormTitulo] = useState('');
  const [formMensagem, setFormMensagem] = useState('');
  const [formDestinatario, setFormDestinatario] = useState('Todos');
  const [formPrioridade, setFormPrioridade] = useState('Média');
  const [formConfirmacao, setFormConfirmacao] = useState(false);

  const kpis = [
    {
      icon: <Bell size={18} />,
      title: 'Avisos Ativos',
      value: '15',
      trend: 'neutral' as const,
      trendValue: 'Neste período',
    },
    {
      icon: <AlertTriangle size={18} />,
      title: 'Urgentes',
      value: '2',
      trend: 'down' as const,
      trendValue: '-1 vs. semana anterior',
    },
    {
      icon: <CheckSquare size={18} />,
      title: 'Lidos por Todos',
      value: '8',
      trend: 'up' as const,
      trendValue: '+3 esta semana',
    },
    {
      icon: <Clock size={18} />,
      title: 'Aguardando Leitura',
      value: '7',
      trend: 'down' as const,
      trendValue: 'Pendentes de confirmação',
    },
  ];

  const handleSalvar = () => {
    if (!formTitulo.trim()) {
      showToast('error', 'Informe o título do aviso.', 'Atenção');
      return;
    }
    showToast('success', `Aviso "${formTitulo}" publicado com sucesso!`, 'Sucesso');
    setFormTitulo('');
    setFormMensagem('');
    setFormDestinatario('Todos');
    setFormPrioridade('Média');
    setFormConfirmacao(false);
    setIsModalOpen(false);
  };

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Novo Aviso"
      aria-label="Novo Aviso"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={20} strokeWidth={2.5} />
    </button>
  );

  const sidePanel = (
    <>
      {/* Painel IA */}
      <div className="logta-panel-card--dark logta-panel-card--retention p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-violet-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-violet-400">
            Logta IA · Efetividade
          </span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-neutral-300">
          Avisos enviados com <span className="font-bold text-white">confirmação de leitura</span>{' '}
          têm <span className="text-emerald-400 font-semibold">2.1× mais efetividade</span> do
          que os sem confirmação.
        </p>
        <div className="mb-3 rounded-xl bg-violet-500/10 border border-violet-500/20 p-3">
          <p className="text-xs font-semibold text-violet-300 mb-1">💡 Formato Ideal</p>
          <p className="text-xs text-neutral-400">
            Avisos com até <strong className="text-white">3 parágrafos</strong> e um título
            direto têm abertura{' '}
            <strong className="text-white">28% maior</strong> entre os motoristas.
          </p>
        </div>
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-xs font-semibold text-red-300 mb-1">⚠️ Atenção</p>
          <p className="text-xs text-neutral-400">
            <strong className="text-white">2 avisos urgentes</strong> ainda aguardam confirmação
            de leitura por 12+ colaboradores. Considere um lembrete.
          </p>
        </div>
      </div>

      {/* Painel Métricas */}
      <div className="logta-panel-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart2 size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Avisos por Prioridade
          </span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Alta', count: 2, pct: 13, color: 'bg-red-500' },
            { label: 'Média', count: 8, pct: 53, color: 'bg-yellow-500' },
            { label: 'Baixa', count: 5, pct: 33, color: 'bg-blue-500' },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-neutral-300">{item.label}</span>
                <span className="font-bold text-white">
                  {item.count} ({item.pct}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800">
                <div
                  className={`h-1.5 rounded-full ${item.color}`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-neutral-800 pt-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Confirmações Pendentes
          </p>
          <div className="space-y-2">
            {mockAvisos
              .filter((a) => !a.confirmado)
              .map((aviso) => (
                <div
                  key={aviso.id}
                  className="flex items-start gap-2 rounded-xl bg-neutral-800/50 p-2.5"
                >
                  <div className="mt-0.5">{prioridadeIcons[aviso.prioridade]}</div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">{aviso.titulo}</p>
                    <p className="text-[11px] text-neutral-500">{aviso.destinatario}</p>
                  </div>
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
        mainContentTitle="Lista de Avisos"
        mainContentAction={mainContentAction}
        sidePanel={sidePanel}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-2">
          {mockAvisos.map((aviso) => (
            <div
              key={aviso.id}
              className="group flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:border-primary/30 hover:bg-neutral-900"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  aviso.prioridade === 'Alta'
                    ? 'bg-red-500/10'
                    : aviso.prioridade === 'Média'
                    ? 'bg-yellow-500/10'
                    : 'bg-blue-500/10'
                }`}
              >
                {aviso.prioridade === 'Alta' ? (
                  <AlertTriangle size={18} className="text-red-400" />
                ) : aviso.prioridade === 'Média' ? (
                  <Bell size={18} className="text-yellow-400" />
                ) : (
                  <FileText size={18} className="text-blue-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{aviso.titulo}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {aviso.destinatario}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {new Date(aviso.data).toLocaleDateString('pt-BR')}
                  </span>
                  <span>·</span>
                  <span
                    className={`flex items-center gap-1 ${
                      aviso.confirmado ? 'text-emerald-400' : 'text-neutral-500'
                    }`}
                  >
                    <CheckSquare size={11} />
                    {aviso.confirmado ? 'Confirmado' : 'Aguardando confirmação'}
                  </span>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${prioridadeColors[aviso.prioridade]}`}
              >
                {aviso.prioridade}
              </span>
            </div>
          ))}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Avisos"
        getTabularData={() => ({
          title: 'Avisos e Comunicados',
          filenameBase: 'rh-avisos-comunicados',
          columns: ['Título', 'Destinatário', 'Prioridade', 'Data', 'Confirmado'],
          rows: mockAvisos.map((a) => [
            a.titulo,
            a.destinatario,
            a.prioridade,
            new Date(a.data).toLocaleDateString('pt-BR'),
            a.confirmado ? 'Sim' : 'Não',
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
              icon={<Bell size={20} />}
              title="Novo Aviso"
              onClose={() => setIsModalOpen(false)}
            />
            <div className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                  Título do Aviso
                </label>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Advertência de Segurança — Uso de EPI"
                  className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                  Mensagem
                </label>
                <textarea
                  rows={4}
                  value={formMensagem}
                  onChange={(e) => setFormMensagem(e.target.value)}
                  placeholder="Descreva o aviso detalhadamente..."
                  className="w-full resize-none rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                    Destinatário
                  </label>
                  <select
                    value={formDestinatario}
                    onChange={(e) => setFormDestinatario(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Motoristas">Motoristas</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Operações">Operações</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                    Prioridade
                  </label>
                  <select
                    value={formPrioridade}
                    onChange={(e) => setFormPrioridade(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 transition-colors hover:border-neutral-600">
                  <div
                    onClick={() => setFormConfirmacao(!formConfirmacao)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      formConfirmacao
                        ? 'border-primary bg-primary'
                        : 'border-neutral-600 bg-transparent'
                    }`}
                  >
                    {formConfirmacao && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Exigir confirmação de leitura</p>
                    <p className="text-xs text-neutral-500">
                      Colaboradores deverão confirmar que leram este aviso
                    </p>
                  </div>
                </label>
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
                  Publicar Aviso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
