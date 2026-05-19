import React from 'react';
import { Check, CheckCircle2, Copy, ExternalLink, MessageSquare, Receipt, Send, XCircle } from 'lucide-react';
import { LogtaModalHeader } from '../../../components/LogtaModalHeader';
import { showToast } from '../../../components/Toast';
import { createPublicToken, markAlteracaoRequestRead } from '../orcamentoStorage';
import type { OrcamentoProposal } from '../types';

export type OrcamentoFormState = {
  clientName: string;
  validity: string;
  origin: string;
  destination: string;
  services: string;
  subtotal: string;
  notes: string;
};

function parseMoney(value: string): number {
  const cleaned = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n: number): string {
  if (!n) return '';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function buildEmptyOrcamentoDraft(companyId: string, seq: number): OrcamentoProposal {
  const now = new Date().toISOString();
  return {
    id: `orc-${Date.now()}`,
    companyId,
    publicToken: createPublicToken(),
    number: `ORC-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`,
    clientName: '',
    origin: 'São Paulo, SP',
    destination: '',
    services: 'Frete rodoviário — cotação rápida',
    subtotal: 0,
    taxes: 0,
    total: 0,
    validity: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
    status: 'rascunho',
    createdBy: 'current',
    createdByName: 'Equipe Comercial',
    createdAt: now,
    updatedAt: now,
    history: [{ id: `h-${Date.now()}`, type: 'criado', label: 'Orçamento criado', at: now }],
    aiScore: 50,
  };
}

export function proposalToForm(p: OrcamentoProposal): OrcamentoFormState {
  return {
    clientName: p.clientName,
    validity: p.validity,
    origin: p.origin,
    destination: p.destination,
    services: p.services,
    subtotal: formatMoney(p.subtotal),
    notes: p.notes ?? '',
  };
}

type OrcamentoEditorModalProps = {
  open: boolean;
  draft: OrcamentoProposal | null;
  onClose: () => void;
  onSave: (proposal: OrcamentoProposal, sendToClient: boolean) => void;
  onDraftUpdate?: (proposal: OrcamentoProposal) => void;
  onApproveByTeam?: (proposal: OrcamentoProposal) => void;
  onRejectByTeam?: (proposal: OrcamentoProposal) => void;
  onMarkPayment?: (proposal: OrcamentoProposal) => void;
};

export function OrcamentoEditorModal({
  open,
  draft,
  onClose,
  onSave,
  onDraftUpdate,
  onApproveByTeam,
  onRejectByTeam,
  onMarkPayment,
}: OrcamentoEditorModalProps) {
  const [form, setForm] = React.useState<OrcamentoFormState>(() =>
    draft ? proposalToForm(draft) : {
      clientName: '',
      validity: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
      origin: 'São Paulo, SP',
      destination: '',
      services: 'Frete rodoviário — cotação rápida',
      subtotal: '',
      notes: '',
    },
  );

  React.useEffect(() => {
    if (draft && open) setForm(proposalToForm(draft));
  }, [draft, open]);

  if (!open || !draft) return null;

  const subtotal = parseMoney(form.subtotal);
  const taxes = Math.round(subtotal * 0.12 * 100) / 100;
  const total = subtotal + taxes;

  const publicUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/orcamento/publico/${draft.publicToken}` : '';

  const handleSubmit = (sendToClient: boolean) => {
    if (!form.clientName.trim()) {
      showToast('info', 'Informe o nome do cliente.', 'Orçamento');
      return;
    }
    if (subtotal <= 0) {
      showToast('info', 'Informe o valor do orçamento.', 'Orçamento');
      return;
    }

    const now = new Date().toISOString();
    const next: OrcamentoProposal = {
      ...draft,
      clientName: form.clientName.trim(),
      validity: form.validity,
      origin: form.origin.trim(),
      destination: form.destination.trim() || 'A definir',
      services: form.services.trim(),
      notes: form.notes.trim() || undefined,
      subtotal,
      taxes,
      total,
      updatedAt: now,
      aiScore: total > 50000 ? 72 : total > 15000 ? 58 : 45,
    };

    onSave(next, sendToClient);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[40px] border border-neutral-800 bg-[#18191B] shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        <div className="shrink-0 border-b border-neutral-800 px-8 pt-8 pb-4">
          <LogtaModalHeader
            icon={Receipt}
            title={
              <span>
                {draft.number}
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-normal text-neutral-500">
                  Dados do orçamento
                </span>
              </span>
            }
            onClose={onClose}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6 scrollbar-hide">
          {draft.alteracaoRequestMessage ? (
            <div className="mb-6 rounded-2xl border border-orange-500/40 bg-orange-500/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-300">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-normal text-orange-300">
                      Cliente pediu alteração
                    </p>
                    {draft.alteracaoRequestedAt ? (
                      <p className="mt-0.5 text-[10px] font-semibold text-neutral-400">
                        {new Date(draft.alteracaoRequestedAt).toLocaleString('pt-BR')}
                      </p>
                    ) : null}
                  </div>
                </div>
                {!draft.alteracaoRequestRead ? (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = markAlteracaoRequestRead(draft.companyId, draft.id, false);
                      if (updated) {
                        onDraftUpdate?.(updated);
                        showToast('success', 'Solicitação marcada como em atendimento.', 'Orçamento');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/50 bg-orange-500/20 px-3 py-2 text-[10px] font-bold text-orange-100 transition-colors hover:bg-orange-500/30"
                  >
                    <Check size={12} /> Marcar como em atendimento
                  </button>
                ) : null}
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-neutral-100">
                {draft.alteracaoRequestMessage}
              </p>
              <p className="mt-3 text-[10px] font-semibold text-neutral-500">
                Ajuste os campos abaixo e salve ou reenvie ao cliente quando estiver pronto.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <form
              className="space-y-4 text-left lg:col-span-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(false);
              }}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1 sm:col-span-2">
                  <span className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Cliente</span>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    placeholder="Nome ou razão social"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white outline-none transition-all focus:border-primary/50"
                    required
                  />
                </label>
                <label className="space-y-1">
                  <span className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Validade</span>
                  <input
                    type="date"
                    value={form.validity}
                    onChange={(e) => setForm({ ...form, validity: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-primary/50"
                    required
                  />
                </label>
                <label className="space-y-1">
                  <span className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">
                    Valor (R$)
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.subtotal}
                    onChange={(e) => setForm({ ...form, subtotal: e.target.value })}
                    placeholder="0,00"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-black text-white outline-none focus:border-primary/50"
                    required
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Origem</span>
                  <input
                    type="text"
                    value={form.origin}
                    onChange={(e) => setForm({ ...form, origin: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-primary/50"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Destino</span>
                  <input
                    type="text"
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    placeholder="Cidade / UF"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-primary/50"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Serviços</span>
                  <textarea
                    rows={3}
                    value={form.services}
                    onChange={(e) => setForm({ ...form, services: e.target.value })}
                    className="w-full resize-none rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-primary/50"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Observações</span>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Opcional — prazos, condições, anexos"
                    className="w-full resize-none rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-primary/50"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4">
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-neutral-400">
                  <span>Impostos (12%)</span>
                  <span className="font-bold text-white">R$ {taxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-neutral-800 pt-3">
                  <span className="text-sm font-black text-white">Total</span>
                  <span className="text-xl font-black text-primary">
                    R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </form>

            <div className="space-y-4 lg:col-span-2">
              <h4 className="border-b border-neutral-800 pb-3 !text-sm font-black !text-white">Histórico</h4>
              <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1 scrollbar-hide">
                {[...draft.history].reverse().map((h) => (
                  <div key={h.id} className="border-l-2 border-primary/40 pl-3">
                    <p className="text-[10px] font-bold uppercase text-neutral-500">
                      {new Date(h.at).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs font-semibold text-neutral-200">{h.label}</p>
                    {h.meta ? <p className="text-[10px] text-neutral-500">{h.meta}</p> : null}
                  </div>
                ))}
              </div>
              {draft.status !== 'rascunho' ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(publicUrl);
                      showToast('success', 'Link copiado.', 'Orçamento');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 px-3 py-2 text-[10px] font-bold text-neutral-300 hover:border-primary/40 hover:text-white"
                  >
                    <Copy size={12} /> Copiar link
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 px-3 py-2 text-[10px] font-bold text-neutral-300 hover:border-primary/40 hover:text-white"
                  >
                    <ExternalLink size={12} /> Abrir público
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-neutral-800 bg-[#141516] px-8 py-5">
          {draft.status !== 'aprovado' && draft.status !== 'rejeitado' && onApproveByTeam ? (
            <button
              type="button"
              onClick={() => onApproveByTeam(draft)}
              className="inline-flex items-center gap-2 rounded-xl border border-green-600/50 bg-green-600/20 px-4 py-3 text-xs font-bold text-green-200 hover:bg-green-600/30"
            >
              <CheckCircle2 size={14} /> Aprovar (cliente confirmou)
            </button>
          ) : null}
          {draft.status !== 'aprovado' && draft.status !== 'rejeitado' && onRejectByTeam ? (
            <button
              type="button"
              onClick={() => onRejectByTeam(draft)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-600/50 bg-red-600/15 px-4 py-3 text-xs font-bold text-red-200 hover:bg-red-600/25"
            >
              <XCircle size={14} /> Rejeitar
            </button>
          ) : null}
          {draft.status === 'aprovado' &&
          (draft.paymentStatus ?? 'aguardando_pagamento') === 'aguardando_pagamento' &&
          onMarkPayment ? (
            <button
              type="button"
              onClick={() => onMarkPayment(draft)}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/20 px-4 py-3 text-xs font-bold text-white hover:bg-primary/30"
            >
              <Check size={14} /> Pagamento recebido
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-700 px-5 py-3 text-xs font-bold text-neutral-300 transition-colors hover:bg-neutral-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-3 text-xs font-bold text-white transition-colors hover:border-primary/40"
          >
            Salvar rascunho
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white shadow-lg shadow-primary/25 transition-opacity hover:opacity-90"
          >
            <Send size={14} /> Salvar e enviar
          </button>
        </div>
      </div>
    </div>
  );
}
