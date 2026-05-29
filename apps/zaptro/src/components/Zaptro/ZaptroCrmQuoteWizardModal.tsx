import React, { useMemo } from 'react';
import {
  Copy,
  ExternalLink,
  FileText,
  Link2,
  Pencil,
  Send,
  Sparkles,
} from 'lucide-react';
import LogtaModal from '../Modal';
import {
  type FreightQuote,
  type QuoteStatus,
  QUOTE_STATUS_LABEL,
  quoteMonetaryValue,
  quotePublicPath,
} from '../../constants/zaptroQuotes';

export type QuoteWizardForm = {
  origin: string;
  destination: string;
  cargoType: string;
  weightQty: string;
  freightValue: string;
  deliveryDeadline: string;
  notes: string;
};

type WizardLead = {
  id: string;
  clientName: string;
  origin: string;
  destination: string;
  cargoType: string;
  estimatedValue: number;
};

type TimelineEvent = {
  at: string;
  kind: string;
  title: string;
  body?: string;
  actor?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  lead: WizardLead;
  leads: WizardLead[];
  showLeadSelector: boolean;
  leadId: string;
  onLeadChange: (leadId: string) => void;
  step: 1 | 2 | 3;
  form: QuoteWizardForm;
  onFormChange: (patch: Partial<QuoteWizardForm>) => void;
  quotes: FreightQuote[];
  timelineEvents?: TimelineEvent[];
  lastCreatedQuote: FreightQuote | null;
  canAct: boolean;
  formatBrl: (n: number) => string;
  onConfirmStep2: () => void;
  onCommitQuote: () => void;
  onBackStep1: () => void;
  onCopyLink: (q: FreightQuote) => void;
  onMarkSent: (q: FreightQuote) => void;
  onEditQuote: (q: FreightQuote) => void;
  onSimulateSend: () => void;
  onStartNewQuote?: () => void;
};

function quoteIdFromEventBody(body?: string): string | null {
  const m = body?.match(/Ref\.?:?\s*(qt-[\w-]+)/i);
  return m?.[1] ?? null;
}

function formatEventTime(at: string): string {
  return new Date(at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function quoteStatusModifier(status: QuoteStatus): 'pending' | 'sent' | 'ok' | 'bad' {
  if (status === 'aprovado') return 'ok';
  if (status === 'recusado') return 'bad';
  if (status === 'enviado' || status === 'visualizado') return 'sent';
  return 'pending';
}

export const ZaptroCrmQuoteWizardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  lead,
  leads,
  showLeadSelector,
  leadId,
  onLeadChange,
  step,
  form,
  onFormChange,
  quotes,
  timelineEvents = [],
  lastCreatedQuote,
  canAct,
  formatBrl,
  onConfirmStep2,
  onCommitQuote,
  onBackStep1,
  onCopyLink,
  onMarkSent,
  onEditQuote,
  onSimulateSend,
  onStartNewQuote,
}) => {
  const sortedQuotes = useMemo(
    () => [...quotes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [quotes],
  );

  const quoteIds = useMemo(() => new Set(sortedQuotes.map((q) => q.id)), [sortedQuotes]);

  const legacyTimelineCards = useMemo(() => {
    return timelineEvents
      .filter((ev) => ev.kind === 'proposal' || ev.kind === 'negotiation')
      .filter((ev) => {
        const ref = quoteIdFromEventBody(ev.body);
        return !ref || !quoteIds.has(ref);
      })
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [timelineEvents, quoteIds]);

  return (
    <LogtaModal isOpen={isOpen} onClose={onClose} title="Orçamento de frete" width="1080px" variant="landscape">
      <form
        className="zaptro-modal-landscape-body"
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 1) onConfirmStep2();
        }}
      >
        <div className="zaptro-modal-landscape__left">
          <div className="zaptro-modal-landscape-hero">
            <div className="zaptro-modal-landscape-hero__icon">
              <FileText size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="zaptro-modal-landscape-hero__title">Orçamento de frete</h2>
              <p className="zaptro-modal-landscape-hero__subtitle">
                Cliente: <strong>{lead.clientName}</strong> · Passo {step} de 3
              </p>
            </div>
          </div>

          <div className="zaptro-crm-quote-wizard-steps" aria-hidden>
            {[1, 2, 3].map((s) => (
              <div key={s} className={`zaptro-crm-quote-wizard-steps__bar${step >= s ? ' is-active' : ''}`} />
            ))}
          </div>

          {showLeadSelector && (
            <label className="zaptro-modal-landscape-field" style={{ marginBottom: 16 }}>
              <span className="zaptro-modal-landscape-field__label">Lead</span>
              <select
                className="zaptro-modal-landscape-field__input"
                value={leadId}
                onChange={(e) => onLeadChange(e.target.value)}
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.clientName}
                  </option>
                ))}
              </select>
            </label>
          )}

          {step === 1 && (
            <>
              <div className="zaptro-modal-landscape-fields">
                {(
                  [
                    ['origin', 'Origem'],
                    ['destination', 'Destino'],
                    ['cargoType', 'Tipo de carga'],
                    ['weightQty', 'Peso / quantidade'],
                    ['freightValue', 'Valor do frete (R$)'],
                    ['deliveryDeadline', 'Prazo de entrega'],
                  ] as const
                ).map(([key, lab]) => (
                  <label key={key} className="zaptro-modal-landscape-field">
                    <span className="zaptro-modal-landscape-field__label">{lab}</span>
                    <input
                      className="zaptro-modal-landscape-field__input"
                      value={form[key]}
                      onChange={(e) => onFormChange({ [key]: e.target.value })}
                    />
                  </label>
                ))}
                <label className="zaptro-modal-landscape-field zaptro-modal-landscape-field--full">
                  <span className="zaptro-modal-landscape-field__label">Observações</span>
                  <textarea
                    className="zaptro-modal-landscape-field__input zaptro-modal-landscape-field__textarea"
                    value={form.notes}
                    onChange={(e) => onFormChange({ notes: e.target.value })}
                    rows={3}
                  />
                </label>
              </div>
              <div className="zaptro-modal-landscape-actions">
                <button type="button" className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--ghost" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--primary">
                  Continuar →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="zaptro-crm-quote-wizard-review">
                <p className="zaptro-crm-quote-wizard-review__lead">Confirma os dados antes de gerar o orçamento</p>
                <ul>
                  <li>
                    <strong>Rota:</strong> {form.origin} → {form.destination}
                  </li>
                  <li>
                    <strong>Carga:</strong> {form.cargoType || '—'} · {form.weightQty || '—'}
                  </li>
                  <li>
                    <strong>Frete:</strong> {formatBrl(Number(String(form.freightValue).replace(/\D/g, '')) || 0)}
                  </li>
                  <li>
                    <strong>Prazo:</strong> {form.deliveryDeadline || '—'}
                  </li>
                </ul>
                {form.notes.trim() ? (
                  <p className="zaptro-crm-quote-wizard-review__notes">
                    <strong>Notas:</strong> {form.notes}
                  </p>
                ) : null}
              </div>
              <div className="zaptro-modal-landscape-actions">
                <button type="button" className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--ghost" onClick={onBackStep1}>
                  ← Voltar
                </button>
                <button type="button" className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--primary" onClick={onCommitQuote}>
                  Gerar orçamento
                </button>
              </div>
            </>
          )}

          {step === 3 && lastCreatedQuote && (
            <>
              <div className="zaptro-crm-quote-wizard-done">
                <p>
                  Estado: <strong>{QUOTE_STATUS_LABEL[lastCreatedQuote.status]}</strong> — partilha o link com o cliente.
                </p>
                <p className="zaptro-crm-quote-wizard-done__hint">
                  Envio automático pelo WhatsApp fica para quando o gateway estiver ligado. Até lá: copiar link ou simular envio.
                </p>
                <code className="zaptro-crm-quote-wizard-done__url">
                  {`${typeof window !== 'undefined' ? window.location.origin : ''}${quotePublicPath(lastCreatedQuote.token)}`}
                </code>
              </div>
              <div className="zaptro-modal-landscape-actions">
                <button
                  type="button"
                  className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--ghost"
                  onClick={() => onCopyLink(lastCreatedQuote)}
                >
                  <Link2 size={16} /> Copiar link
                </button>
                <button type="button" className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--primary" onClick={onSimulateSend}>
                  <Send size={16} /> Simular envio
                </button>
                <button type="button" className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--ghost" onClick={onClose}>
                  Concluir
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="zaptro-modal-landscape__right zaptro-crm-proposal-history">
          <h3 className="zaptro-modal-landscape-right-title">Orçamentos deste lead</h3>
          <p className="zaptro-crm-proposal-history__hint">Copiar link, enviar ao cliente, editar na calculadora ou abrir página pública.</p>

          <div className="zaptro-crm-proposal-history__list">
            {sortedQuotes.length === 0 && legacyTimelineCards.length === 0 ? (
              <div className="zaptro-crm-proposal-history__empty">
                <Sparkles size={28} strokeWidth={1.5} />
                <span>Ainda sem orçamentos. Gera o primeiro no passo 1–2.</span>
              </div>
            ) : null}

            {sortedQuotes.map((q) => {
                const val = quoteMonetaryValue(q);
                const mod = quoteStatusModifier(q.status);
                const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${quotePublicPath(q.token)}`;
                const canSend = canAct && q.status === 'pendente';
                const time = new Date(q.updatedAt).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <article key={q.id} className="zaptro-crm-proposal-quote">
                    <div className="zaptro-crm-proposal-quote__head">
                      <span className={`zaptro-crm-proposal-quote__status zaptro-crm-proposal-quote__status--${mod}`}>
                        {QUOTE_STATUS_LABEL[q.status]}
                      </span>
                      <span className="zaptro-crm-proposal-history__time">{time}</span>
                    </div>
                    <p className="zaptro-crm-proposal-quote__title">
                      {formatBrl(val)} · {q.origin || '—'} → {q.destination || '—'}
                    </p>
                    <p className="zaptro-crm-proposal-quote__meta">Ref. {q.id}</p>
                    <div className="zaptro-crm-proposal-quote__actions">
                      <button
                        type="button"
                        className="zaptro-crm-proposal-quote__action zaptro-crm-proposal-quote__action--icon"
                        title="Copiar link público"
                        aria-label="Copiar link público"
                        onClick={() => onCopyLink(q)}
                      >
                        <Link2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="zaptro-crm-proposal-quote__action zaptro-crm-proposal-quote__action--icon"
                        title="Copiar mensagem com link"
                        aria-label="Copiar mensagem com link"
                        onClick={() => {
                          const msg = `Orçamento: ${formatBrl(val)}\n${publicUrl}`;
                          void navigator.clipboard?.writeText(msg).catch(() => {});
                        }}
                      >
                        <Copy size={15} />
                      </button>
                      {canSend ? (
                        <button
                          type="button"
                          className="zaptro-crm-proposal-quote__action zaptro-crm-proposal-quote__action--icon"
                          title="Marcar como enviado"
                          aria-label="Marcar como enviado"
                          onClick={() => onMarkSent(q)}
                        >
                          <Send size={15} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="zaptro-crm-proposal-quote__action zaptro-crm-proposal-quote__action--icon"
                        title="Editar na calculadora"
                        aria-label="Editar na calculadora"
                        onClick={() => onEditQuote(q)}
                      >
                        <Pencil size={15} />
                      </button>
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="zaptro-crm-proposal-quote__action zaptro-crm-proposal-quote__action--icon zaptro-crm-proposal-quote__action--ghost"
                        title="Abrir página pública"
                        aria-label="Abrir página pública"
                      >
                        <ExternalLink size={15} />
                      </a>
                    </div>
                  </article>
                );
              })}

            {legacyTimelineCards.map((ev) => {
              const ref = quoteIdFromEventBody(ev.body);
              const linked = ref ? sortedQuotes.find((q) => q.id === ref) : undefined;
              const isOpp = ev.kind === 'negotiation';

              return (
                <article key={`${ev.at}-${ev.title}`} className="zaptro-crm-proposal-history__card">
                  <div className="zaptro-crm-proposal-history__card-head">
                    <span className={`zaptro-crm-proposal-history__badge${isOpp ? ' zaptro-crm-proposal-history__badge--opp' : ''}`}>
                      {isOpp ? 'Oportunidade' : 'Proposta'}
                    </span>
                    <span className="zaptro-crm-proposal-history__time">{formatEventTime(ev.at)}</span>
                  </div>
                  <p className="zaptro-crm-proposal-history__title">{ev.title}</p>
                  {ev.actor ? <p className="zaptro-crm-proposal-history__actor">Responsável: {ev.actor}</p> : null}
                  <div className="zaptro-crm-proposal-history__actions">
                    {linked ? (
                      <>
                        <button
                          type="button"
                          className="zaptro-crm-proposal-quote__action zaptro-crm-proposal-quote__action--icon"
                          title="Copiar link"
                          aria-label="Copiar link"
                          onClick={() => onCopyLink(linked)}
                        >
                          <Link2 size={15} />
                        </button>
                        {canAct && linked.status === 'pendente' ? (
                          <button
                            type="button"
                            className="zaptro-crm-proposal-quote__action zaptro-crm-proposal-quote__action--icon"
                            title="Marcar enviado"
                            aria-label="Marcar enviado"
                            onClick={() => onMarkSent(linked)}
                          >
                            <Send size={15} />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="zaptro-crm-proposal-quote__action zaptro-crm-proposal-quote__action--icon"
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => onEditQuote(linked)}
                        >
                          <Pencil size={15} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="zaptro-crm-proposal-quote__action"
                        onClick={() => onStartNewQuote?.()}
                      >
                        <Pencil size={14} /> Gerar orçamento com link
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </aside>
      </form>
    </LogtaModal>
  );
};
