import React from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  MessageSquare,
  Plus,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useTenant } from '../../../contexts/TenantContext';
import { useLogtaProfile } from '../../../contexts/LogtaProfileContext';
import { resolveDemoCompanyId, shouldUseLogtaSandbox } from '../../../lib/seed';
import { showToast } from '../../../components/Toast';
import {
  buildEmptyOrcamentoDraft,
  OrcamentoEditorModal,
} from '../components/OrcamentoEditorModal';
import {
  approveOrcamentoByTeam,
  getOrcamentoKpis,
  hasUnreadAlteracaoRequest,
  isOrcamentoAguardandoPagamento,
  loadOrcamentos,
  markOrcamentoPaymentReceived,
  rejectOrcamentoByTeam,
  seedOrcamentosSandbox,
  upsertOrcamento,
} from '../orcamentoStorage';
import type { OrcamentoProposal, OrcamentoStatus } from '../types';

const STATUS_STYLE: Record<OrcamentoStatus, string> = {
  rascunho: 'bg-gray-100 text-gray-600',
  enviado: 'bg-blue-100 text-blue-700',
  visualizado: 'bg-purple-100 text-purple-700',
  negociacao: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-green-100 text-green-700',
  rejeitado: 'bg-red-100 text-red-700',
  expirado: 'bg-gray-100 text-gray-500',
  alteracao_solicitada: 'bg-orange-100 text-orange-700',
};

const STATUS_LABEL: Record<OrcamentoStatus, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  visualizado: 'Visualizado',
  negociacao: 'Em negociação',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  expirado: 'Expirado',
  alteracao_solicitada: 'Alteração solicitada',
};

function renderStatusBadge(o: OrcamentoProposal) {
  const base = STATUS_STYLE[o.status];
  const label = STATUS_LABEL[o.status];
  if (o.status === 'aprovado' && isOrcamentoAguardandoPagamento(o)) {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${base}`}>{label}</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-800">
          Aguardando pagamento
        </span>
      </span>
    );
  }
  if (o.status === 'aprovado' && o.paymentStatus === 'pago') {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${base}`}>{label}</span>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-black uppercase text-green-800">Pago</span>
      </span>
    );
  }
  return <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${base}`}>{label}</span>;
}

export function OrcamentoDashboardView() {
  const { config } = useTenant();
  const { profile } = useLogtaProfile();
  const companyId = resolveDemoCompanyId(config?.id);
  const teamName = profile?.full_name ?? 'Equipe Comercial';
  const [list, setList] = React.useState<OrcamentoProposal[]>([]);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editorDraft, setEditorDraft] = React.useState<OrcamentoProposal | null>(null);

  const refresh = React.useCallback(() => {
    if (shouldUseLogtaSandbox()) seedOrcamentosSandbox(companyId);
    setList(loadOrcamentos(companyId));
  }, [companyId]);

  React.useEffect(() => {
    refresh();
    const onSync = () => refresh();
    window.addEventListener('logta-orcamento-sync', onSync);
    return () => window.removeEventListener('logta-orcamento-sync', onSync);
  }, [refresh]);

  const kpis = getOrcamentoKpis(list);
  const unreadAlteracoes = list.filter(hasUnreadAlteracaoRequest).length;

  const copyPublicLink = (token: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = `${window.location.origin}/orcamento/publico/${token}`;
    void navigator.clipboard.writeText(url);
    showToast('success', 'Link público copiado para a área de transferência.', 'Orçamento Online');
  };

  const openNewModal = () => {
    const seq = list.length + 167;
    setEditorDraft(buildEmptyOrcamentoDraft(companyId, seq));
    setEditorOpen(true);
  };

  const openEditModal = (proposal: OrcamentoProposal) => {
    setEditorDraft({ ...proposal });
    setEditorOpen(true);
  };

  const closeModal = () => {
    setEditorOpen(false);
    setEditorDraft(null);
  };

  const handleSave = (proposal: OrcamentoProposal, sendToClient: boolean) => {
    const now = new Date().toISOString();
    const isNew = !list.some((o) => o.id === proposal.id);
    const history = [...proposal.history];

    if (!isNew) {
      history.push({ id: `ev-up-${Date.now()}`, type: 'criado', label: 'Orçamento atualizado', at: now });
    }
    if (sendToClient) {
      history.push({ id: `ev-send-${Date.now()}`, type: 'enviado', label: 'Orçamento enviado ao cliente', at: now });
    }

    const hadAlteracao = Boolean(proposal.alteracaoRequestMessage?.trim());
    if (hadAlteracao && !isNew) {
      history.push({
        id: `ev-alt-${Date.now()}`,
        type: 'alteracao',
        label: sendToClient
          ? 'Orçamento revisado e reenviado após solicitação do cliente'
          : 'Equipe atualizou orçamento após solicitação do cliente',
        at: now,
        meta: proposal.alteracaoRequestMessage?.slice(0, 120),
      });
    }

    const saved: OrcamentoProposal = {
      ...proposal,
      status: sendToClient
        ? 'enviado'
        : proposal.status === 'alteracao_solicitada'
          ? 'negociacao'
          : proposal.status === 'enviado'
            ? proposal.status
            : 'rascunho',
      alteracaoRequestRead: true,
      alteracaoRequestMessage: sendToClient ? undefined : proposal.alteracaoRequestMessage,
      alteracaoRequestedAt: sendToClient ? undefined : proposal.alteracaoRequestedAt,
      updatedAt: now,
      history,
    };

    upsertOrcamento(companyId, saved);
    refresh();
    closeModal();
    showToast(
      'success',
      sendToClient ? 'Orçamento salvo e link liberado para o cliente.' : 'Orçamento salvo na lista.',
      sendToClient ? 'Enviado' : 'Salvo',
    );
  };

  const applyTeamAction = async (proposal: OrcamentoProposal, action: 'approve' | 'reject' | 'pay') => {
    let next: OrcamentoProposal | null = null;
    if (action === 'approve') next = approveOrcamentoByTeam(companyId, proposal.id, teamName);
    if (action === 'reject') next = rejectOrcamentoByTeam(companyId, proposal.id, teamName);
    if (action === 'pay') next = await markOrcamentoPaymentReceived(companyId, proposal.id, teamName);
    if (next) {
      refresh();
      setEditorDraft(next);
      showToast(
        'success',
        action === 'approve'
          ? 'Orçamento aprovado pela equipe. Financeiro aguarda o pagamento do cliente.'
          : action === 'reject'
            ? 'Orçamento marcado como rejeitado.'
            : 'Pagamento confirmado. Receita lançada em Contas a receber e Fluxo de caixa.',
        'Orçamento',
      );
      if (action !== 'pay') closeModal();
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Enviados', value: kpis.enviados, icon: FileText },
          { label: 'Aprovados', value: kpis.aprovados, icon: CheckCircle2 },
          { label: 'Em negociação', value: kpis.negociacao, icon: Clock },
          { label: 'Taxa conversão', value: `${kpis.conversao}%`, icon: ArrowUpRight },
        ].map((s, i) => (
          <div key={i} className="logta-stat-card">
            <p className="logta-stat-card__label logta-stat-card__label--spaced">{s.label}</p>
            <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary logta-dashboard-stat-card__value--lg">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm md:col-span-2">
          <p className="text-[10px] font-black uppercase tracking-normal text-gray-400">Faturamento previsto (aprovados)</p>
          <p className="my-[15px] text-[21px] font-extrabold leading-tight tracking-normal text-gray-900">
            R$ {kpis.previsto.toLocaleString('pt-BR')}
          </p>
          <p className="text-[10px] font-semibold text-gray-400">Ticket médio R$ {kpis.ticket.toLocaleString('pt-BR')}</p>
        </div>
        <div className="flex flex-col justify-between rounded-[32px] border border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={18} />
            <span className="text-xs font-black uppercase tracking-normal">IA Comercial</span>
          </div>
          <p className="mt-3 text-xs font-medium leading-relaxed text-gray-600">
            {kpis.negociacao > 0
              ? `${kpis.negociacao} orçamento(s) aguardando resposta — sugerimos follow-up em 24h.`
              : 'Pipeline saudável. Monitore orçamentos com score abaixo de 60%.'}
          </p>
        </div>
      </div>

      {unreadAlteracoes > 0 ? (
        <div className="flex items-start gap-3 rounded-[24px] border border-orange-200 bg-orange-50 px-5 py-4">
          <span className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
            <MessageSquare size={16} />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-black text-orange-600">
              {unreadAlteracoes}
            </span>
          </span>
          <div>
            <p className="text-sm font-black text-orange-900">
              {unreadAlteracoes === 1
                ? '1 cliente pediu alteração no orçamento'
                : `${unreadAlteracoes} clientes pediram alteração nos orçamentos`}
            </p>
            <p className="mt-1 text-xs font-medium text-orange-800/80">
              Abra o orçamento para ver a mensagem e fazer os ajustes no mesmo popup.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-xl font-black tracking-normal text-gray-900">Orçamentos Online</h3>
        <button
          type="button"
          onClick={openNewModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
        >
          <Plus size={16} /> Novo orçamento
        </button>
      </div>

      <div className="overflow-hidden rounded-[40px] border border-gray-200 bg-white shadow-sm">
        <div className="logta-table-wrap">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-black uppercase tracking-normal text-gray-400">
                <th className="px-8 py-5">Número</th>
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5">Responsável</th>
                <th className="px-8 py-5">Valor</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => openEditModal(o)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-8 py-6 font-bold text-primary">
                    <span className="inline-flex items-center gap-2">
                      {o.number}
                      {hasUnreadAlteracaoRequest(o) ? (
                        <span
                          className="relative flex h-5 w-5 items-center justify-center"
                          title="Cliente solicitou alteração — clique para abrir"
                        >
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-50" />
                          <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                            <MessageSquare size={11} strokeWidth={2.5} />
                          </span>
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-gray-900">{o.clientName || '—'}</td>
                  <td className="px-8 py-6 text-xs font-semibold text-gray-600">{o.createdByName}</td>
                  <td className="px-8 py-6 text-sm font-black text-gray-900">
                    R$ {o.total.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-8 py-6">{renderStatusBadge(o)}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {o.status !== 'aprovado' && o.status !== 'rejeitado' ? (
                        <button
                          type="button"
                          title="Aprovar manualmente (cliente confirmou fora do link)"
                          onClick={(e) => {
                            e.stopPropagation();
                            void applyTeamAction(o, 'approve');
                          }}
                          className="rounded-xl border border-green-200 bg-green-50 p-2 text-green-700 transition-colors hover:bg-green-100"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      ) : null}
                      {o.status === 'aprovado' && isOrcamentoAguardandoPagamento(o) ? (
                        <button
                          type="button"
                          title="Confirmar pagamento recebido"
                          onClick={(e) => {
                            e.stopPropagation();
                            void applyTeamAction(o, 'pay');
                          }}
                          className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-800 transition-colors hover:bg-amber-100"
                        >
                          <Clock size={16} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        title="Copiar link público"
                        onClick={(e) => copyPublicLink(o.publicToken, e)}
                        className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-colors hover:border-primary/30 hover:text-primary"
                      >
                        <Copy size={16} />
                      </button>
                      <a
                        href={`/orcamento/publico/${o.publicToken}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir página pública"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-colors hover:border-primary/30 hover:text-primary"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-xs font-bold uppercase text-gray-400">
                    Nenhum orçamento cadastrado — clique em Novo orçamento
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {kpis.rejeitados > 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/80 px-5 py-4 text-xs font-semibold text-red-800">
          <XCircle size={18} />
          {kpis.rejeitados} orçamento(s) rejeitado(s) — revise proposta e reenvie com ajustes.
        </div>
      ) : null}

      <OrcamentoEditorModal
        open={editorOpen}
        draft={editorDraft}
        onClose={closeModal}
        onSave={handleSave}
        onDraftUpdate={(updated) => {
          setEditorDraft(updated);
          setList((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        }}
        onApproveByTeam={(p) => void applyTeamAction(p, 'approve')}
        onRejectByTeam={(p) => void applyTeamAction(p, 'reject')}
        onMarkPayment={(p) => void applyTeamAction(p, 'pay')}
      />
    </div>
  );
}
