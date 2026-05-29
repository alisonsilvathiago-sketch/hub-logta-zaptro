import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  MessageCircle,
  Send,
  Users,
  Clock,
  Search,
  BarChart2,
  Sparkles,
  Circle,
  Hash,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import type { RhModuleDef } from '../../types';

type ChatInternoRhViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

type StatusOnline = 'online' | 'offline' | 'ausente';

const mockConversas = [
  {
    id: 'chat-001',
    remetente: 'Carlos Eduardo Mota',
    avatar: 'CE',
    assunto: 'Dúvida sobre o holerite de maio',
    ultimaMensagem: 'Pode verificar se o desconto foi aplicado corretamente?',
    horario: '09:42',
    naoLidas: 2,
    status: 'online' as StatusOnline,
    categoria: 'Folha de Pagamento',
  },
  {
    id: 'chat-002',
    remetente: 'Fernanda Lima',
    avatar: 'FL',
    assunto: 'Solicitação de espelho de ponto',
    ultimaMensagem: 'Preciso do relatório de abril para enviar ao banco.',
    horario: '09:15',
    naoLidas: 0,
    status: 'online' as StatusOnline,
    categoria: 'Ponto Eletrônico',
  },
  {
    id: 'chat-003',
    remetente: 'Rodrigo Andrade',
    avatar: 'RA',
    assunto: 'Quando saem as férias?',
    ultimaMensagem: 'Já solicitei há 3 semanas, precisando de resposta.',
    horario: '08:55',
    naoLidas: 1,
    status: 'ausente' as StatusOnline,
    categoria: 'Férias',
  },
  {
    id: 'chat-004',
    remetente: 'Patrícia Souza',
    avatar: 'PS',
    assunto: 'Entrega de documentos — admissão',
    ultimaMensagem: 'Quais documentos ainda estão pendentes para a admissão?',
    horario: '08:20',
    naoLidas: 0,
    status: 'offline' as StatusOnline,
    categoria: 'Documentação',
  },
  {
    id: 'chat-005',
    remetente: 'Marcos Vinícius Santos',
    avatar: 'MV',
    assunto: 'Reembolso de combustível pendente',
    ultimaMensagem: 'O reembolso de abril ainda não caiu na conta.',
    horario: 'ontem',
    naoLidas: 3,
    status: 'online' as StatusOnline,
    categoria: 'Benefícios',
  },
];

const statusConfig: Record<StatusOnline, { color: string; label: string }> = {
  online: { color: 'text-emerald-400 fill-emerald-400', label: 'Online' },
  ausente: { color: 'text-yellow-400 fill-yellow-400', label: 'Ausente' },
  offline: { color: 'text-neutral-500 fill-neutral-500', label: 'Offline' },
};

export function ChatInternoRhView({ module, hubPath, hubLabel }: ChatInternoRhViewProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busca, setBusca] = useState('');

  const [formDestinatario, setFormDestinatario] = useState('');
  const [formAssunto, setFormAssunto] = useState('');
  const [formMensagem, setFormMensagem] = useState('');

  const kpis = [
    {
      icon: <MessageCircle size={18} />,
      title: 'Conversas Ativas',
      value: '34',
      trend: 'up' as const,
      trendValue: '+4 vs. semana anterior',
    },
    {
      icon: <Send size={18} />,
      title: 'Mensagens Hoje',
      value: '218',
      trend: 'up' as const,
      trendValue: '+32 vs. ontem',
    },
    {
      icon: <Users size={18} />,
      title: 'Colaboradores Online',
      value: '27',
      trend: 'neutral' as const,
      trendValue: 'Agora mesmo',
    },
    {
      icon: <Clock size={18} />,
      title: 'Tempo de Resposta',
      value: '4 min',
      trend: 'down' as const,
      trendValue: '-1 min vs. média',
    },
  ];

  const conversasFiltradas = mockConversas.filter(
    (c) =>
      c.remetente.toLowerCase().includes(busca.toLowerCase()) ||
      c.assunto.toLowerCase().includes(busca.toLowerCase()) ||
      c.categoria.toLowerCase().includes(busca.toLowerCase()),
  );

  const handleSalvar = () => {
    if (!formDestinatario.trim() || !formAssunto.trim()) {
      showToast('error', 'Preencha destinatário e assunto.', 'Atenção');
      return;
    }
    showToast('success', `Mensagem enviada para ${formDestinatario}!`, 'Enviado');
    setFormDestinatario('');
    setFormAssunto('');
    setFormMensagem('');
    setIsModalOpen(false);
  };

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Nova Mensagem"
      aria-label="Nova Mensagem"
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
            Logta IA · Tópicos
          </span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-neutral-300">
          <span className="font-bold text-white">Folha de Pagamento</span> é o assunto mais
          frequente hoje —{' '}
          <span className="text-yellow-400 font-semibold">31% das conversas</span>. Considere
          criar uma FAQ dedicada.
        </p>
        <div className="mb-3 rounded-xl bg-violet-500/10 border border-violet-500/20 p-3">
          <p className="text-xs font-semibold text-violet-300 mb-1">🤖 Automação Sugerida</p>
          <p className="text-xs text-neutral-400">
            As 5 perguntas mais repetidas podem ser respondidas automaticamente com um
            chatbot. Estimativa de{' '}
            <strong className="text-white">40% de redução</strong> no volume de tickets manuais.
          </p>
        </div>
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
          <p className="text-xs font-semibold text-blue-300 mb-1">📅 Horário de Pico</p>
          <p className="text-xs text-neutral-400">
            Maior volume de mensagens entre{' '}
            <strong className="text-white">08h00 e 09h30</strong>. Garanta suporte disponível
            neste período.
          </p>
        </div>
      </div>

      {/* Painel Métricas */}
      <div className="logta-panel-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart2 size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Assuntos Frequentes
          </span>
        </div>
        <div className="space-y-2.5">
          {[
            { assunto: 'Folha de Pagamento', count: 68, pct: 31 },
            { assunto: 'Ponto Eletrônico', count: 45, pct: 21 },
            { assunto: 'Férias', count: 38, pct: 17 },
            { assunto: 'Benefícios', count: 31, pct: 14 },
            { assunto: 'Documentação', count: 36, pct: 17 },
          ].map((item) => (
            <div key={item.assunto}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="flex items-center gap-1 text-neutral-300">
                  <Hash size={10} />
                  {item.assunto}
                </span>
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
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Mais Ativos Hoje
          </p>
          <div className="space-y-2">
            {mockConversas
              .filter((c) => c.status === 'online')
              .map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {c.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{c.remetente}</p>
                    <p className="text-[11px] text-neutral-500">{c.categoria}</p>
                  </div>
                  <Circle size={7} className="shrink-0 fill-emerald-400 text-emerald-400" />
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
        mainContentTitle="Conversas Recentes"
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
              placeholder="Buscar por colaborador, assunto ou categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 py-2.5 pl-9 pr-4 text-sm text-white placeholder-neutral-600 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          {conversasFiltradas.map((conv) => (
            <div
              key={conv.id}
              className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:border-primary/30 hover:bg-neutral-900"
            >
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {conv.avatar}
                </div>
                <Circle
                  size={9}
                  className={`absolute bottom-0 right-0 rounded-full border-2 border-[#18191B] ${statusConfig[conv.status].color}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{conv.remetente}</p>
                  <span className="text-[11px] text-neutral-500">{conv.horario}</span>
                </div>
                <p className="mt-0.5 text-xs font-medium text-neutral-300">{conv.assunto}</p>
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  {conv.ultimaMensagem}
                </p>
              </div>
              {conv.naoLidas > 0 && (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {conv.naoLidas}
                </div>
              )}
            </div>
          ))}
          {conversasFiltradas.length === 0 && (
            <div className="py-8 text-center text-sm text-neutral-500">
              Nenhuma conversa encontrada para "{busca}"
            </div>
          )}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Conversas"
        getTabularData={() => ({
          title: 'Chat Interno RH',
          filenameBase: 'rh-chat-interno',
          columns: ['Colaborador', 'Assunto', 'Categoria', 'Última Mensagem', 'Horário', 'Não Lidas'],
          rows: mockConversas.map((c) => [
            c.remetente,
            c.assunto,
            c.categoria,
            c.ultimaMensagem,
            c.horario,
            String(c.naoLidas),
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
            className="relative max-h-[min(92dvh,640px)] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-neutral-800 bg-[#18191B] p-6 text-left shadow-2xl duration-200 animate-in zoom-in-95 sm:rounded-[40px] sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <LogtaModalHeader
              icon={<MessageCircle size={20} />}
              title="Nova Mensagem"
              onClose={() => setIsModalOpen(false)}
            />
            <div className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                  Destinatário
                </label>
                <select
                  value={formDestinatario}
                  onChange={(e) => setFormDestinatario(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Selecione o colaborador</option>
                  <option value="Carlos Eduardo Mota">Carlos Eduardo Mota</option>
                  <option value="Fernanda Lima">Fernanda Lima</option>
                  <option value="Rodrigo Andrade">Rodrigo Andrade</option>
                  <option value="Patrícia Souza">Patrícia Souza</option>
                  <option value="Marcos Vinícius Santos">Marcos Vinícius Santos</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-400">
                  Assunto
                </label>
                <input
                  type="text"
                  value={formAssunto}
                  onChange={(e) => setFormAssunto(e.target.value)}
                  placeholder="Ex: Esclarecimento sobre holerite de maio"
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
                  placeholder="Digite sua mensagem aqui..."
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
                  Enviar Mensagem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
