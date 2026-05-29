import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  Radio,
  Eye,
  Users,
  Send,
  Bell,
  Megaphone,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart2,
  Sparkles,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import type { RhModuleDef } from '../../types';

type ComunicacaoInternaViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

type StatusType = 'Ativo' | 'Rascunho' | 'Encerrado';

const mockComunicados = [
  {
    id: 'com-001',
    titulo: 'Férias Coletivas — Período de Julho 2025',
    publicoAlvo: 'Todos',
    dataPublicacao: '2025-05-15',
    visualizacoes: 312,
    status: 'Ativo' as StatusType,
    canal: 'App + E-mail',
    prioridade: 'Alta',
  },
  {
    id: 'com-002',
    titulo: 'Nova Política de Uso de Equipamentos da Frota',
    publicoAlvo: 'Motoristas',
    dataPublicacao: '2025-05-10',
    visualizacoes: 147,
    status: 'Ativo' as StatusType,
    canal: 'App',
    prioridade: 'Média',
  },
  {
    id: 'com-003',
    titulo: 'Convite: Confraternização de Meio de Ano',
    publicoAlvo: 'Todos',
    dataPublicacao: '2025-05-08',
    visualizacoes: 289,
    status: 'Ativo' as StatusType,
    canal: 'App + E-mail',
    prioridade: 'Baixa',
  },
  {
    id: 'com-004',
    titulo: 'Atualização do Vale-Alimentação — Junho 2025',
    publicoAlvo: 'Administrativo',
    dataPublicacao: '2025-04-28',
    visualizacoes: 98,
    status: 'Encerrado' as StatusType,
    canal: 'E-mail',
    prioridade: 'Média',
  },
  {
    id: 'com-005',
    titulo: 'Campanha de Segurança no Trabalho — Semana SIPAT',
    publicoAlvo: 'Todos',
    dataPublicacao: '2025-06-01',
    visualizacoes: 0,
    status: 'Rascunho' as StatusType,
    canal: 'App + E-mail + Mural',
    prioridade: 'Alta',
  },
];

const statusColors: Record<StatusType, string> = {
  Ativo: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Rascunho: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  Encerrado: 'bg-neutral-600/30 text-neutral-400 border border-neutral-600/40',
};

export function ComunicacaoInternaView({ module, hubPath, hubLabel }: ComunicacaoInternaViewProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formTitulo, setFormTitulo] = useState('');
  const [formMensagem, setFormMensagem] = useState('');
  const [formPublico, setFormPublico] = useState('Todos');
  const [formData, setFormData] = useState('');
  const [formPrioridade, setFormPrioridade] = useState('Média');

  const kpis = [
    {
      icon: <Send size={18} />,
      title: 'Comunicados Enviados',
      value: '48',
      trend: 'up' as const,
      trendValue: '+6 este mês',
    },
    {
      icon: <Eye size={18} />,
      title: 'Visualizações Totais',
      value: '1.2K',
      trend: 'up' as const,
      trendValue: '+14% vs. mês anterior',
    },
    {
      icon: <Radio size={18} />,
      title: 'Taxa de Leitura',
      value: '87%',
      trend: 'up' as const,
      trendValue: '+3pp vs. mês anterior',
    },
    {
      icon: <Megaphone size={18} />,
      title: 'Campanhas Ativas',
      value: '3',
      trend: 'neutral' as const,
      trendValue: 'Em andamento',
    },
  ];

  const handleSalvar = () => {
    if (!formTitulo.trim()) {
      showToast('error', 'Informe o título do comunicado.', 'Atenção');
      return;
    }
    showToast('success', `Comunicado "${formTitulo}" criado com sucesso!`, 'Sucesso');
    setFormTitulo('');
    setFormMensagem('');
    setFormPublico('Todos');
    setFormData('');
    setFormPrioridade('Média');
    setIsModalOpen(false);
  };

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Novo Comunicado"
      aria-label="Novo Comunicado"
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
            Logta IA · Engajamento
          </span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-neutral-300">
          A taxa de leitura de <span className="font-bold text-white">87%</span> está{' '}
          <span className="text-emerald-400 font-semibold">acima da média do setor (72%)</span>.
          Comunicados enviados às <span className="font-bold text-white">08h–09h</span> têm
          abertura 34% maior.
        </p>
        <div className="mb-3 rounded-xl bg-violet-500/10 border border-violet-500/20 p-3">
          <p className="text-xs font-semibold text-violet-300 mb-1">💡 Sugestão de Horário</p>
          <p className="text-xs text-neutral-400">
            Envie próximo comunicado na <strong className="text-white">terça-feira às 08h30</strong>{' '}
            para maximizar a leitura entre os motoristas.
          </p>
        </div>
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
          <p className="text-xs font-semibold text-blue-300 mb-1">📈 Predição de Leitura</p>
          <p className="text-xs text-neutral-400">
            O comunicado sobre <strong className="text-white">SIPAT</strong> tem potencial de
            atingir <strong className="text-white">91% de leitura</strong> com envio multicanal.
          </p>
        </div>
      </div>

      {/* Painel Métricas */}
      <div className="logta-panel-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart2 size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Métricas por Canal
          </span>
        </div>
        <div className="space-y-3">
          {[
            { canal: 'App Mobile', leituras: 68, pct: 87 },
            { canal: 'E-mail', leituras: 45, pct: 74 },
            { canal: 'Mural Digital', leituras: 22, pct: 55 },
          ].map((item) => (
            <div key={item.canal}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-neutral-300">{item.canal}</span>
                <span className="font-bold text-white">{item.pct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800">
                <div
                  className="h-1.5 rounded-full bg-primary"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-neutral-800 pt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Mais Lido do Mês
          </p>
          <div className="rounded-xl bg-neutral-800/50 p-3">
            <p className="text-sm font-semibold text-white">Férias Coletivas — Julho 2025</p>
            <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
              <Eye size={12} />
              <span>312 visualizações</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Por Departamento
          </p>
          <div className="space-y-1">
            {[
              { dept: 'Operações', count: 18 },
              { dept: 'Administrativo', count: 11 },
              { dept: 'Comercial', count: 9 },
            ].map((d) => (
              <div key={d.dept} className="flex justify-between text-xs">
                <span className="text-neutral-400">{d.dept}</span>
                <span className="font-bold text-white">{d.count} comunicados</span>
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
        mainContentTitle="Comunicados e Campanhas"
        mainContentAction={mainContentAction}
        sidePanel={sidePanel}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-2">
          {mockComunicados.map((com) => (
            <div
              key={com.id}
              className="group flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:border-primary/30 hover:bg-neutral-900"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <MessageSquare size={18} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{com.titulo}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {com.publicoAlvo}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />{' '}
                    {new Date(com.dataPublicacao).toLocaleDateString('pt-BR')}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Eye size={11} /> {com.visualizacoes.toLocaleString('pt-BR')} views
                  </span>
                  <span>·</span>
                  <span>{com.canal}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusColors[com.status]}`}
                >
                  {com.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Comunicados"
        getTabularData={() => ({
          title: 'Comunicados Internos',
          filenameBase: 'rh-comunicacao-interna',
          columns: ['Título', 'Público', 'Data', 'Visualizações', 'Canal', 'Status'],
          rows: mockComunicados.map((c) => [
            c.titulo,
            c.publicoAlvo,
            new Date(c.dataPublicacao).toLocaleDateString('pt-BR'),
            String(c.visualizacoes),
            c.canal,
            c.status,
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
              icon={<Megaphone size={20} />}
              title="Novo Comunicado"
              onClose={() => setIsModalOpen(false)}
            />
            <div className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                  Título do Comunicado
                </label>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Atualização de Benefícios — Junho 2025"
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
                  placeholder="Descreva o comunicado em detalhes..."
                  className="w-full resize-none rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                  Público-Alvo
                </label>
                <select
                  value={formPublico}
                  onChange={(e) => setFormPublico(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="Todos">Todos</option>
                  <option value="Motoristas">Motoristas</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Operações">Operações</option>
                  <option value="Comercial">Comercial</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                    Data de Publicação
                  </label>
                  <input
                    type="date"
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                  />
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
                  Publicar Comunicado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
