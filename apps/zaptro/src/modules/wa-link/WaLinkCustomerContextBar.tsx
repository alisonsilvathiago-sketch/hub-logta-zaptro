import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Route, Shuffle, Truck, UserCheck } from 'lucide-react';
import { ZAPTRO_APP_ROUTES } from '../../app/zaptroAppRoutes';
import type { WaLinkConversation } from './waLinkInboxDb';
import type { WaLinkAssigneeProfile } from './useWaLinkCustomerContext';
import type { WaLinkCustomerContextSnapshot } from './waLinkCustomerContext';

type Props = {
  conversation: WaLinkConversation;
  snapshot: WaLinkCustomerContextSnapshot | null;
  assignee: WaLinkAssigneeProfile | null;
  currentUserId: string | null;
  isAdmin: boolean;
  claiming: boolean;
  onClaim: () => void;
  onRelease?: () => void;
  onTransfer?: () => void;
  transferring?: boolean;
};

const WaLinkCustomerContextBar: React.FC<Props> = ({
  conversation,
  snapshot,
  assignee,
  currentUserId,
  isAdmin,
  claiming,
  onClaim,
  onRelease,
  onTransfer,
  transferring = false,
}) => {
  const assignedTo = conversation.assigned_to?.trim() || null;
  const isMine = Boolean(currentUserId && assignedTo === currentUserId);
  const isLocked = Boolean(assignedTo && !isMine && !isAdmin);
  const awaiting =
    !assignedTo ||
    conversation.attendance_status === 'awaiting' ||
    conversation.attendance_status == null;

  const assigneeName = assignee?.full_name?.trim() || 'Colaborador';

  return (
    <div className="wa-conversas-customer-context" role="region" aria-label="Contexto do cliente">
      <div className="wa-conversas-customer-context__main">
        <div className="wa-conversas-customer-context__identity">
          <strong>{conversation.sender_name?.trim() || conversation.sender_number}</strong>
          {snapshot?.companyName ? (
            <span className="wa-conversas-customer-context__company">{snapshot.companyName}</span>
          ) : null}
          {conversation.department?.trim() ? (
            <span className="wa-conversas-customer-context__dept">{conversation.department.trim()}</span>
          ) : null}
        </div>

        <div className="wa-conversas-customer-context__chips">
          {snapshot?.quotes.length ? (
            <span className="wa-conversas-customer-context__chip" title="Orçamentos / produtos">
              <Package size={14} />
              {snapshot.quotes.length} orçamento{snapshot.quotes.length > 1 ? 's' : ''}
            </span>
          ) : null}
          {snapshot?.routes.length ? (
            <span className="wa-conversas-customer-context__chip wa-conversas-customer-context__chip--route" title="Rotas">
              <Route size={14} />
              {snapshot.routes[0]?.statusLabel || 'Rota activa'}
            </span>
          ) : null}
          {!snapshot?.quotes.length && !snapshot?.routes.length ? (
            <span className="wa-conversas-customer-context__chip wa-conversas-customer-context__chip--muted">
              <Truck size={14} />
              {snapshot?.productsLabel || 'Sem histórico operacional'}
            </span>
          ) : null}
        </div>
      </div>

      <div className="wa-conversas-customer-context__actions">
        {assignedTo && !awaiting ? (
          <span className="wa-conversas-customer-context__status">
            <UserCheck size={14} />
            {isMine ? 'Você' : assigneeName}
          </span>
        ) : (
          <span className="wa-conversas-customer-context__status wa-conversas-customer-context__status--queue">
            Aguardando colaborador
          </span>
        )}

        {!assignedTo || awaiting ? (
          <button type="button" className="wa-conversas-customer-context__claim" disabled={claiming} onClick={onClaim}>
            {claiming ? 'A aceitar…' : 'Aceitar atendimento'}
          </button>
        ) : isMine ? (
          onRelease ? (
            <button type="button" className="wa-conversas-customer-context__ghost" onClick={onRelease}>
              Libertar
            </button>
          ) : null
        ) : isAdmin ? (
          <button type="button" className="wa-conversas-customer-context__claim" disabled={claiming} onClick={onClaim}>
            Assumir (admin)
          </button>
        ) : isLocked ? (
          <span className="wa-conversas-customer-context__locked">Somente leitura</span>
        ) : null}

        {onTransfer ? (
          <button
            type="button"
            className="wa-conversas-customer-context__ghost"
            disabled={transferring}
            onClick={onTransfer}
            title="Transferir para outro departamento"
          >
            <Shuffle size={14} />
            Transferir
          </button>
        ) : null}
      </div>

      {(snapshot?.quotes?.length || snapshot?.routes?.length) ? (
        <div className="wa-conversas-customer-context__details">
          {(snapshot?.quotes ?? []).slice(0, 2).map((q) => (
            <Link
              key={q.id}
              to={`${ZAPTRO_APP_ROUTES.QUOTES}?quoteId=${encodeURIComponent(q.id)}`}
              className="wa-conversas-customer-context__detail-link"
            >
              <Package size={13} />
              {q.label} · {q.status}
              {q.origin && q.destination ? ` · ${q.origin} → ${q.destination}` : ''}
            </Link>
          ))}
          {(snapshot?.routes ?? []).slice(0, 2).map((r) => (
            <Link key={r.id} to={r.trackPath} className="wa-conversas-customer-context__detail-link">
              <Route size={13} />
              {r.label} · {r.statusLabel}
              {r.origin && r.dest ? ` · ${r.origin} → ${r.dest}` : ''}
            </Link>
          ))}
          <Link to={ZAPTRO_APP_ROUTES.clientProfile(conversation.id)} className="wa-conversas-customer-context__detail-link">
            Ver perfil completo
          </Link>
        </div>
      ) : null}
    </div>
  );
};

export default WaLinkCustomerContextBar;
