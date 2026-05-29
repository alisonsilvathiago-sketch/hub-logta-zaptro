import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  Link2,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Send,
  Tag,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import { ZAPTRO_APP_ROUTES, zaptroAppInboxThreadPath } from './zaptroAppRoutes';
import { crmLeadWaThreadKey } from '../lib/zaptroCrmWhatsappInboxSync';
import {
  isCrmLeadWaConversationId,
  markCrmLeadPaymentReceived,
  dedupeCrmLeadTimeline,
  readCrmKanbanLead,
  readCrmLeadTimeline,
  type ZaptroCrmKanbanLead,
  type ZaptroCrmTimelineEvent,
} from '../lib/zaptroCrmLeadStorage';
import {
  type FreightQuote,
  QUOTE_STATUS_LABEL,
  quoteMonetaryValue,
  quotePublicPath,
  readQuotesMap,
} from '../constants/zaptroQuotes';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { ZaptroPaginatedList } from '../components/Zaptro/ZaptroPaginatedList';
import ZaptroAppModuleShell from './ZaptroAppModuleShell';
import './zaptroAppCrmLeadProfile.css';
import './zaptroAppClientProfile.css';

const STAGE_LABELS: Record<string, string> = {
  novos: 'Novo lead',
  atendimento: 'Em atendimento',
  negociacao: 'Negociação',
  fechado: 'Fechado',
  perdido: 'Perdido',
};

type Tab = 'timeline' | 'quotes';

function formatBrl(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timelineIcon(kind: string) {
  if (kind === 'whatsapp' || kind === 'call') return MessageSquare;
  if (kind === 'quote' || kind === 'proposal') return FileSpreadsheet;
  if (kind === 'payment') return CheckCircle2;
  if (kind === 'stage' || kind === 'route') return MapPin;
  return Clock;
}

function quoteStatusClass(status: FreightQuote['status']): string {
  if (status === 'aprovado') return 'zaptro-lead-profile__status--ok';
  if (status === 'recusado') return 'zaptro-lead-profile__status--bad';
  if (status === 'enviado' || status === 'visualizado') return 'zaptro-lead-profile__status--sent';
  return 'zaptro-lead-profile__status--pending';
}

const ZaptroCrmLeadProfileContent: React.FC = () => {
  const { leadId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const companyId = profile?.company_id || 'local-demo';
  const [lead, setLead] = useState<ZaptroCrmKanbanLead | null>(() => readCrmKanbanLead(companyId, leadId));
  const [timeline, setTimeline] = useState<ZaptroCrmTimelineEvent[]>(() => readCrmLeadTimeline(companyId, leadId));
  const [quotes, setQuotes] = useState<FreightQuote[]>([]);
  const [tab, setTab] = useState<Tab>('timeline');
  const [paymentSaving, setPaymentSaving] = useState(false);

  const reload = useCallback(() => {
    setLead(readCrmKanbanLead(companyId, leadId));
    setTimeline(
      dedupeCrmLeadTimeline(
        [...readCrmLeadTimeline(companyId, leadId)].sort(
          (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
        ),
      ),
    );
    const map = readQuotesMap(companyId);
    const rows = [...(map[leadId] || [])].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    setQuotes(rows);
  }, [companyId, leadId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const onUpd = () => reload();
    window.addEventListener('zaptro-quotes-updated', onUpd);
    window.addEventListener('zaptro-crm-kanban-updated', onUpd);
    return () => {
      window.removeEventListener('zaptro-quotes-updated', onUpd);
      window.removeEventListener('zaptro-crm-kanban-updated', onUpd);
    };
  }, [reload]);

  const isClient = Boolean(lead?.paymentReceivedAt || lead?.convertedClientId);
  const clientProfileId = lead?.convertedClientId || (lead && isCrmLeadWaConversationId(lead.id) ? lead.id : null);

  const inboxHref = useMemo(() => {
    if (!lead) return ZAPTRO_APP_ROUTES.INBOX;
    const key = crmLeadWaThreadKey(lead);
    if (!key) return ZAPTRO_APP_ROUTES.INBOX;
    return zaptroAppInboxThreadPath(ZAPTRO_APP_ROUTES.CRM, key, { clientName: lead.clientName });
  }, [lead]);

  const quotesHref = `${ZAPTRO_APP_ROUTES.QUOTES}?${new URLSearchParams({ leadId }).toString()}`;
  const crmProposalHref = `${ZAPTRO_APP_ROUTES.CRM}?${new URLSearchParams({ action: 'new_proposal', leadId }).toString()}`;

  const primaryQuote = useMemo(() => {
    const open = quotes.find((q) => q.status === 'pendente' || q.status === 'enviado' || q.status === 'visualizado');
    return open || quotes[0] || null;
  }, [quotes]);

  const openQuoteCalculatorPopup = useCallback(
    (quoteId?: string | null) => {
      const qid = quoteId ?? primaryQuote?.id;
      const params = new URLSearchParams({ leadId, calc: '1', embed: '1' });
      if (qid) params.set('quoteId', qid);
      navigate(`${ZAPTRO_APP_ROUTES.QUOTES}?${params.toString()}`, {
        state: { returnTo: location.pathname },
      });
    },
    [leadId, location.pathname, navigate, primaryQuote?.id],
  );

  const copyQuoteLink = (q: FreightQuote) => {
    const url = `${window.location.origin}${quotePublicPath(q.token)}`;
    void navigator.clipboard?.writeText(url).catch(() => {});
    notifyZaptro('success', 'Link', 'Link público copiado.');
  };

  const handlePaymentReceived = async () => {
    if (!lead || paymentSaving) return;
    setPaymentSaving(true);
    try {
      const next = markCrmLeadPaymentReceived(companyId, lead.id, profile?.full_name || '—');
      if (!next) {
        notifyZaptro('error', 'Lead', 'Não foi possível atualizar o lead.');
        return;
      }

      if (isCrmLeadWaConversationId(lead.id) && profile?.company_id) {
        await supabaseZaptro
          .from('whatsapp_conversations')
          .update({ crm_type: 'client' })
          .eq('id', lead.id)
          .eq('company_id', profile.company_id);
      }

      reload();
      notifyZaptro('success', 'Pagamento', 'Pagamento registado. Este contacto passa a ser cliente.');

      if (next.convertedClientId) {
        navigate(ZAPTRO_APP_ROUTES.clientProfile(next.convertedClientId));
      }
    } catch {
      notifyZaptro('error', 'Pagamento', 'Falha ao registar pagamento.');
    } finally {
      setPaymentSaving(false);
    }
  };

  if (!lead) {
    return (
      <div className="zaptro-lead-profile">
        <button type="button" className="zaptro-lead-profile__back" onClick={() => navigate(ZAPTRO_APP_ROUTES.CRM)}>
          <ChevronLeft size={18} /> Voltar para o CRM
        </button>
        <p style={{ color: '#949494', fontWeight: 700 }}>
          Lead não encontrado no funil. Pode ter sido removido ou o identificador é inválido.
        </p>
      </div>
    );
  }

  const stageLabel = STAGE_LABELS[lead.stage] || lead.stage;
  const avatarSrc =
    lead.clientLogoUrl?.trim() ||
    `https://picsum.photos/seed/${encodeURIComponent(`zaptro-lead-${lead.id}`)}/128/128`;
  const approvedQuote = quotes.find((q) => q.status === 'aprovado' || q.id === lead.approvedQuoteId);

  return (
    <div className="zaptro-lead-profile">
      <button type="button" className="zaptro-lead-profile__back" onClick={() => navigate(ZAPTRO_APP_ROUTES.CRM)}>
        <ArrowLeft size={18} /> Voltar para o CRM
      </button>

      {isClient ? (
        <div className="zaptro-lead-profile__banner zaptro-lead-profile__banner--client">
          Cliente — pagamento confirmado em {lead.paymentReceivedAt ? formatDateTime(lead.paymentReceivedAt) : '—'}.
          {clientProfileId ? (
            <>
              {' '}
              <Link to={ZAPTRO_APP_ROUTES.clientProfile(clientProfileId)} style={{ color: '#14532d', fontWeight: 800 }}>
                Abrir perfil de cliente
              </Link>
            </>
          ) : (
            <> Consulta a área Clientes para o cadastro completo pós-venda.</>
          )}
        </div>
      ) : (
        <div className="zaptro-lead-profile__banner zaptro-lead-profile__banner--lead">
          Lead comercial — ainda não é cliente. Só vira cliente após pagamento confirmado; até lá podes enviar novas
          propostas e mensagens.
        </div>
      )}

      <section className="zaptro-lead-profile__hero">
        <div className="zaptro-lead-profile__avatar">
          <img src={avatarSrc} alt="" />
        </div>
        <div className="zaptro-lead-profile__hero-main">
          <span className="zaptro-lead-profile__badge">LEAD · {stageLabel.toUpperCase()}</span>
          <h1 className="zaptro-lead-profile__name">{lead.clientName}</h1>
          <div className="zaptro-lead-profile__meta">
            <span>
              <Phone size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {lead.phone || '—'}
            </span>
            <span>No funil desde {formatDate(lead.createdAt)}</span>
            <span>Responsável: {lead.assigneeName || '—'}</span>
            <span>
              Código: <code>{lead.id}</code>
            </span>
          </div>
        </div>
        <div className="zaptro-lead-profile__actions zaptro-client-profile__hero-actions">
          <Link to={inboxHref} className="zaptro-lead-profile__btn zaptro-lead-profile__btn--primary">
            <Zap size={16} /> Conversar
          </Link>
          <Link to={quotesHref} className="zaptro-lead-profile__btn zaptro-lead-profile__btn--secondary">
            <FileSpreadsheet size={16} /> Orçamentos
          </Link>
          <button
            type="button"
            className="zaptro-client-profile__icon-btn"
            title={primaryQuote ? 'Editar proposta (calculadora)' : 'Nova proposta (calculadora)'}
            aria-label={primaryQuote ? 'Editar proposta' : 'Nova proposta'}
            onClick={() => openQuoteCalculatorPopup(primaryQuote?.id)}
          >
            <FileSpreadsheet size={18} strokeWidth={2} />
          </button>
          {!isClient && (
            <Link to={crmProposalHref} className="zaptro-lead-profile__btn zaptro-lead-profile__btn--lime">
              <Send size={16} /> Nova proposta
            </Link>
          )}
        </div>
      </section>

      <div className="zaptro-lead-profile__grid">
        <aside>
          <div className="zaptro-lead-profile__card">
            <h3>Dados do lead</h3>
            <div className="zaptro-lead-profile__info-row">
              <User size={16} color="#949494" />
              <span>{lead.clientName}</span>
            </div>
            <div className="zaptro-lead-profile__info-row">
              <Phone size={16} color="#949494" />
              <span>{lead.phone || '—'}</span>
            </div>
            <div className="zaptro-lead-profile__info-row">
              <MapPin size={16} color="#949494" />
              <span>
                <strong>Origem:</strong> {lead.origin || '—'}
                <br />
                <strong>Destino:</strong> {lead.destination || '—'}
              </span>
            </div>
            <div className="zaptro-lead-profile__info-row">
              <Package size={16} color="#949494" />
              <span>{lead.cargoType || '—'}</span>
            </div>
            {lead.tag ? (
              <div className="zaptro-lead-profile__info-row">
                <Tag size={16} color="#949494" />
                <span>{lead.tag}</span>
              </div>
            ) : null}
          </div>

          <div className="zaptro-lead-profile__card">
            <h3>Valores</h3>
            <p className="zaptro-lead-profile__kpi">{formatBrl(lead.estimatedValue || 0)}</p>
            <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 600, color: '#949494' }}>Valor estimado no funil</p>
            {approvedQuote ? (
              <p style={{ margin: '12px 0 0', fontSize: 12, fontWeight: 700, color: '#15803d' }}>
                Orçamento aprovado: {formatBrl(quoteMonetaryValue(approvedQuote))}
              </p>
            ) : quotes.some((q) => q.status === 'recusado') ? (
              <p style={{ margin: '12px 0 0', fontSize: 12, fontWeight: 700, color: '#b91c1c' }}>
                Última proposta recusada — pode gerar nova proposta.
              </p>
            ) : null}
          </div>

          {!isClient && (
            <div className="zaptro-lead-profile__payment-box">
              <h3>Pagamento recebido?</h3>
              <p>
                Ao confirmar, o lead deixa de ser oportunidade em aberto e passa para cliente (perfil em Clientes, quando
                houver conversa WhatsApp ligada).
              </p>
              <button
                type="button"
                className="zaptro-lead-profile__btn zaptro-lead-profile__btn--lime"
                disabled={paymentSaving}
                onClick={() => void handlePaymentReceived()}
              >
                <CheckCircle2 size={16} />
                {paymentSaving ? 'A registar…' : 'Pagamento feito — virar cliente'}
              </button>
            </div>
          )}
        </aside>

        <main>
          <div className="zaptro-lead-profile__tabs">
            <button
              type="button"
              className={`zaptro-lead-profile__tab${tab === 'timeline' ? ' is-active' : ''}`}
              onClick={() => setTab('timeline')}
            >
              Conversas e histórico
            </button>
            <button
              type="button"
              className={`zaptro-lead-profile__tab${tab === 'quotes' ? ' is-active' : ''}`}
              onClick={() => setTab('quotes')}
            >
              Propostas / orçamentos ({quotes.length})
            </button>
          </div>

          {tab === 'timeline' && (
            <ZaptroPaginatedList
              items={timeline}
              resetKey="timeline"
              listClassName="zaptro-client-profile__list"
              empty={<div className="zaptro-lead-profile__empty">Sem eventos registados para este lead.</div>}
              keyExtractor={(ev) => ev.id}
              renderItem={(ev) => {
                const Icon = timelineIcon(ev.kind);
                return (
                  <article className="zaptro-lead-profile__row">
                    <div className="zaptro-lead-profile__row-icon">
                      <Icon size={18} color="#0f172a" />
                    </div>
                    <div className="zaptro-lead-profile__row-main">
                      <p className="zaptro-lead-profile__row-title">{ev.title}</p>
                      {ev.body ? <p className="zaptro-lead-profile__row-body">{ev.body}</p> : null}
                      {ev.actor ? <p className="zaptro-lead-profile__row-meta">Por {ev.actor}</p> : null}
                    </div>
                    <div className="zaptro-lead-profile__row-end">
                      <span className="zaptro-lead-profile__row-meta">{formatDateTime(ev.at)}</span>
                    </div>
                  </article>
                );
              }}
            />
          )}

          {tab === 'quotes' && (
            <ZaptroPaginatedList
              items={quotes}
              resetKey="quotes"
              listClassName="zaptro-client-profile__list"
              empty={
                <div className="zaptro-lead-profile__empty">
                  Sem orçamentos. Abre Orçamentos ou gera uma nova proposta.
                </div>
              }
              keyExtractor={(q) => q.id}
              renderItem={(q) => {
                const val = quoteMonetaryValue(q);
                const publicUrl = `${window.location.origin}${quotePublicPath(q.token)}`;
                return (
                  <article className="zaptro-lead-profile__row">
                    <div className="zaptro-lead-profile__row-icon">
                      <FileSpreadsheet size={18} color="#0f172a" />
                    </div>
                    <div className="zaptro-lead-profile__row-main">
                      <p className="zaptro-lead-profile__row-title">
                        {formatBrl(val)} · {q.origin || '—'} → {q.destination || '—'}
                      </p>
                      <p className="zaptro-lead-profile__row-body">
                        Prazo: {q.deliveryDeadline || '—'}
                        {q.notes?.trim() ? `\n${q.notes}` : ''}
                      </p>
                      <span className={`zaptro-lead-profile__status ${quoteStatusClass(q.status)}`}>
                        {QUOTE_STATUS_LABEL[q.status]}
                      </span>
                      <div className="zaptro-lead-profile__quote-actions">
                        <button type="button" className="zaptro-lead-profile__quote-action" onClick={() => copyQuoteLink(q)}>
                          <Link2 size={14} /> Copiar link
                        </button>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="zaptro-lead-profile__quote-action"
                        >
                          <ExternalLink size={14} /> Abrir público
                        </a>
                        <button
                          type="button"
                          className="zaptro-lead-profile__quote-action"
                          onClick={() => openQuoteCalculatorPopup(q.id)}
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                    <div className="zaptro-lead-profile__row-end">
                      <span className="zaptro-lead-profile__row-meta">{formatDateTime(q.updatedAt)}</span>
                    </div>
                  </article>
                );
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

const ZaptroAppCrmLeadProfilePage: React.FC = () => (
  <ZaptroAppModuleShell>
    <ZaptroCrmLeadProfileContent />
  </ZaptroAppModuleShell>
);

export default ZaptroAppCrmLeadProfilePage;
