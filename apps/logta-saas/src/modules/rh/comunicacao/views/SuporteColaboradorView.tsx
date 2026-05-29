import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Headphones,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  MessageSquare,
  BarChart2,
  Sparkles,
  TrendingUp,
  Star,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import type { RhModuleDef } from '../../types';

type SuporteColaboradorViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

type StatusTicket = 'Aberto' | 'Em andamento' | 'Resolvido' | 'Aguardando colaborador';
type PrioridadeTicket = 'Urgente' | 'Alta' | 'Média' | 'Baixa';
type CategoriaTicket = 'Folha' | 'Benefícios' | 'Ponto' | 'Férias' | 'Outros';

const mockTickets = [
  {
    id: 'TK-2025-0148',
    colaborador: 'Carlos Eduardo Mota',
    categoria: 'Folha' as CategoriaTicket,
    prioridade: 'Alta' as PrioridadeTicket,
    titulo: 'Desconto indevido no holerite de maio',
    status: 'Em andamento' as StatusTicket,
    dataAbertura: '2025-05-20',
    satisfacao: null,
  },
  {
    id: 'TK-2025-0147',
    colaborador: 'Fernanda Lima',
    categoria: 'Benefícios' as CategoriaTicket,
    prioridade: 'Média' as PrioridadeTicket,
    titulo: 'Inclusão de dependente no plano odontológico',
    status: 'Aberto' as StatusTicket,
    dataAbertura: '2025-05-19',
    satisfacao: null,
  },
  {
    id: 'TK-2025-0146',
    colaborador: 'Rodrigo Andrade',
    categoria: 'Ponto' as CategoriaTicket,
    prioridade: 'Urgente' as PrioridadeTicket,
    titulo: 'Horas extras não registradas — semana 18',
    status: 'Aberto' as StatusTicket,
    dataAbertura: '2025-05-19',
    satisfacao: null,
  },
  {
    id: 'TK-2025-0145',
    colaborador: 'Patrícia Souza',
    categoria: 'Férias' as CategoriaTicket,
    prioridade: 'Baixa' as PrioridadeTicket,
    titulo: 'Saldo de férias incorreto no sistema',
    status: 'Resolvido' as StatusTicket,
    dataAbertura: '2025-05-16',
    satisfacao: 5,
  },
  {
    id: 'TK-2025-0144',
    colaborador: 'Marcos Vinícius Santos',
    categoria: 'Benefícios' as CategoriaTicket,
    prioridade: 'Alta' as PrioridadeTicket,
    titulo: 'Vale-refeição não creditado em maio',
    status: 'Aguardando colaborador' as StatusTicket,
    dataAbertura: '2025-05-15',
    satisfacao: null,
  },
  {
    id: 'TK-2025-0143',
    colaborador: 'Juliana Figueiredo',
    categoria: 'Outros' as CategoriaTicket,
    prioridade: 'Média' as PrioridadeTicket,
    titulo: 'Solicitação de declaração de IR para financiamento',
    status: 'Resolvido' as StatusTicket,
    dataAbertura: '2025-05-13',
    satisfacao: 4,
  },
];

const statusColors: Record<StatusTicket, string> = {
  Aberto: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  'Em andamento': 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  Resolvido: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  'Aguardando colaborador': 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
};

const prioridadeColors: Record<PrioridadeTicket, string> = {
  Urgente: 'text-red-400',
  Alta: 'text-orange-400',
  Média: 'text-yellow-400',
  Baixa: 'text-blue-400',
};

const categoriaColors: Record<CategoriaTicket, string> = {
  Folha: 'bg-emerald-500/10 text-emerald-400',
  Benefícios: 'bg-violet-500/10 text-violet-400',
  Ponto: 'bg-blue-500/10 text-blue-400',
  Férias: 'bg-sky-500/10 text-sky-400',
  Outros: 'bg-neutral-700/50 text-neutral-400',
};

export function SuporteColaboradorView({ module, hubPath, hubLabel }: SuporteColaboradorViewProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busca, setBusca] = useState('');

  const [formColaborador, setFormColaborador] = useState('');
  const [formCategoria, setFormCategoria] = useState('Folha');
  const [formPrioridade, setFormPrioridade] = useState('Média');
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');

  const kpis = [
    {
      icon: <Tag size={18} />,
      title: 'Tickets Abertos',
      value: '18',
      trend: 'neutral' as const,
      trendValue: 'Aguardando resolução',
    },
    {
      icon: <CheckCircle2 size={18} />,
      title: 'Resolvidos Hoje',
      value: '12',
      trend: 'up' as const,
      trendValue: '+5 vs. ontem',
    },
    {
      icon: <Clock size={18} />,
      title: 'SLA Cumprido',
      value: '94%',
      trend: 'up' as const,
      trendValue: '+2pp esta semana',
    },
    {
      icon: <Star size={18} />,
      title: 'NPS Interno',
      value: '8.7',
      trend: 'up' as const,
      trendValue: '+0.3 vs. mês anterior',
    },
  ];

  const ticketsFiltrados = mockTickets.filter(
    (t) =>
      t.colaborador.toLowerCase().includes(busca.toLowerCase()) ||
      t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      t.categoria.toLowerCase().includes(busca.toLowerCase()) ||
      t.id.toLowerCase().includes(busca.toLowerCase()),
  );

  const handleSalvar = () => {
    if (!formColaborador.trim() || !formTitulo.trim()) {
      showToast('error', 'Preencha colaborador e título do ticket.', 'Atenção');
      return;
    }
    showToast('success', `Ticket "${formTitulo}" aberto com sucesso!`, 'Ticket Criado');
    setFormColaborador('');
    setFormCategoria('Folha');
    setFormPrioridade('Média');
    setFormTitulo('');
    setFormDescricao('');
    setIsModalOpen(false);
  };

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Novo Ticket"
      aria-label="Novo Ticket"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={20} strokeWidth={2.5} />
    </button>
  );

  const categoriaCount = mockTickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.categoria] = (acc[t.categoria] || 0) + 1;
    return acc;
  }, {});

  const sidePanel = (
    <>
      {/* Painel IA */}
      <div className="logta-panel-card--dark logta-panel-card--retention p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-violet-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-violet-400">
            Logta IA · Suporte
          </span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-neutral-300">
          Tickets de <span className="font-bold text-white">Benefícios</span> cresceram{' '}
          <span className="text-yellow-400 font-semibold">35% em 2 semanas</span>. Provável
          correlação com o reajuste do plano de saúde anunciado.
        </p>
        <div className="mb-3 rounded-xl bg-violet-500/10 border border-violet-500/20 p-3">
          <p className="text-xs font-semibold text-violet-300 mb-1">📚 Base de Conhecimento</p>
          <p className="text-xs text-neutral-400">
            Criar FAQ sobre <strong className="text-white">Plano de Saúde</strong> pode reduzir
            em <strong className="text-white">28%</strong> os tickets repetitivos desta semana.
          </p>
        </div>
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
          <p className="text-xs font-semibold text-emerald-300 mb-1">📈 Predição de Volume</p>
          <p className="text-xs text-neutral-400">
            Estimativa de <strong className="text-white">22–26 novos tickets</strong> para a
            próxima semana com base no histórico dos últimos 30 dias.
          </p>
        </div>
      </div>

      {/* Painel Métricas */}
      <div className="logta-panel-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart2 size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Tickets por Categoria
          </span>
        </div>
        <div className="space-y-2.5">
          {Object.entries(categoriaCount)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between gap-3">
                <span
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${categoriaColors[cat as CategoriaTicket]}`}
                >
                  {cat}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-1.5 w-full rounded-full bg-neutral-800">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${(count / mockTickets.length) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 shrink-0 text-right text-xs font-bold text-white">
                    {count}
                  </span>
                </div>
              </div>
            ))}
        </div>
        <div className="mt-5 border-t border-neutral-800 pt-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Satisfação por Categoria
          </p>
          <div className="space-y-2">
            {[
              { cat: 'Férias', nps: 9.2 },
              { cat: 'Documentação', nps: 8.7 },
              { cat: 'Folha', nps: 7.8 },
              { cat: 'Benefícios', nps: 7.2 },
            ].map((item) => (
              <div key={item.cat} className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">{item.cat}</span>
                <div className="flex items-center gap-1">
                  <Star size={11} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-white">{item.nps}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 border-t border-neutral-800 pt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Tempo Médio de Resolução
          </p>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-white">1.8</span>
            <span className="mb-0.5 text-sm text-neutral-400">dias úteis</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp size={12} />
            <span>Meta de 2 dias atingida ✓</span>
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
        mainContentTitle="Tickets de Suporte"
        mainContentAction={mainContentAction}
        sidePanel={sidePanel}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="mb-4">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              type="text"
              placeholder="Buscar por ticket, colaborador ou categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 py-2.5 pl-9 pr-4 text-sm text-white placeholder-neutral-600 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          {ticketsFiltrados.map((ticket) => (
            <div
              key={ticket.id}
              className="group flex items-start gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:border-primary/30 hover:bg-neutral-900"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Headphones size={18} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-neutral-500">
                    {ticket.id}
                  </span>
                  <span
                    className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${categoriaColors[ticket.categoria]}`}
                  >
                    {ticket.categoria}
                  </span>
                  <span className={`text-[11px] font-bold ${prioridadeColors[ticket.prioridade]}`}>
                    {ticket.prioridade === 'Urgente' && (
                      <AlertCircle size={10} className="inline mr-0.5" />
                    )}
                    {ticket.prioridade}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-white">{ticket.titulo}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span>{ticket.colaborador}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />{' '}
                    {new Date(ticket.dataAbertura).toLocaleDateString('pt-BR')}
                  </span>
                  {ticket.satisfacao !== null && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Star size={11} className="fill-yellow-400" />
                        {ticket.satisfacao}/5
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span
                className={`shrink-0 self-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusColors[ticket.status]}`}
              >
                {ticket.status}
              </span>
            </div>
          ))}
          {ticketsFiltrados.length === 0 && (
            <div className="py-8 text-center text-sm text-neutral-500">
              Nenhum ticket encontrado para "{busca}"
            </div>
          )}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Tickets de Suporte"
        getTabularData={() => ({
          title: 'Suporte ao Colaborador',
          filenameBase: 'rh-suporte-colaborador',
          columns: ['Ticket', 'Colaborador', 'Categoria', 'Prioridade', 'Título', 'Status', 'Data Abertura'],
          rows: mockTickets.map((t) => [
            t.id,
            t.colaborador,
            t.categoria,
            t.prioridade,
            t.titulo,
            t.status,
            new Date(t.dataAbertura).toLocaleDateString('pt-BR'),
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
            className="relative max-h-[min(92dvh,700px)] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-neutral-800 bg-[#18191B] p-6 text-left shadow-2xl duration-200 animate-in zoom-in-95 sm:rounded-[40px] sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <LogtaModalHeader
              icon={<Headphones size={20} />}
              title="Abrir Novo Ticket"
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
                    Categoria
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="Folha">Folha</option>
                    <option value="Benefícios">Benefícios</option>
                    <option value="Ponto">Ponto</option>
                    <option value="Férias">Férias</option>
                    <option value="Outros">Outros</option>
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
                    <option value="Urgente">Urgente</option>
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                  Título do Ticket
                </label>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Desconto indevido no holerite de maio"
                  className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                  Descrição
                </label>
                <textarea
                  rows={4}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Descreva o problema em detalhes, com datas e valores se aplicável..."
                  className="w-full resize-none rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-primary focus:outline-none"
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
                  Abrir Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
