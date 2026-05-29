import React, { useRef } from 'react';
import { MoreVertical, Search } from 'lucide-react';
import type { WaLinkConversation } from './waLinkInboxDb';
import { waLinkAvatarInitial, waLinkThreadHeadLines } from './waLinkConfig';
import type { WaLinkAssigneeProfile } from './useWaLinkCustomerContext';
import WaLinkThreadMoreMenu, { type WaLinkThreadMenuAction } from './WaLinkThreadMoreMenu';

type Props = {
  conversation: WaLinkConversation;
  assignee: WaLinkAssigneeProfile | null;
  isStarred: boolean;
  isBlocked: boolean;
  threadMenuOpen: boolean;
  onOpenContact: () => void;
  onOpenSearch: () => void;
  onThreadMenuAction: (action: WaLinkThreadMenuAction) => void;
  onThreadMenuOpenChange: (open: boolean) => void;
};

const WaLinkThreadHead: React.FC<Props> = ({
  conversation,
  assignee,
  isStarred,
  isBlocked,
  threadMenuOpen,
  onOpenContact,
  onOpenSearch,
  onThreadMenuAction,
  onThreadMenuOpenChange,
}) => {
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const head = waLinkThreadHeadLines(conversation.sender_name, conversation.sender_number);
  const avatarInitial = waLinkAvatarInitial(head.title, conversation.sender_number);
  const inService =
    Boolean(conversation.assigned_to?.trim()) && conversation.attendance_status === 'in_service';
  const assigneeName = assignee?.full_name?.trim() || 'Colaborador';

  return (
    <header className="wa-conversas-thread-head">
      <button type="button" className="wa-conversas-thread-head-main" onClick={onOpenContact}>
        <div className="wa-conversas-thread-avatar-wrap">
          <div className="wa-conversas-thread-avatar">
            {conversation.customer_avatar ? (
              <img src={conversation.customer_avatar} alt="" />
            ) : (
              avatarInitial
            )}
          </div>
          {inService && assignee ? (
            <span
              className="wa-conversas-thread-assignee-badge"
              title={`Atendido por ${assigneeName}`}
            >
              {assignee.avatar_url ? (
                <img src={assignee.avatar_url} alt="" />
              ) : (
                assigneeInitial(assigneeName)
              )}
            </span>
          ) : null}
        </div>
        <div className="wa-conversas-thread-meta">
          <strong className="wa-conversas-thread-name">{head.title}</strong>
          <span className="wa-conversas-thread-sub">
            {inService ? `Atendido por ${assigneeName} · ` : ''}
            {head.subtitle}
            {isBlocked ? <span className="wa-conversas-thread-blocked"> • BLOQUEADO</span> : null}
          </span>
        </div>
      </button>
      <div className="wa-conversas-thread-head-actions">
        <button
          type="button"
          className="wa-conversas-thread-icon-btn"
          title="Pesquisar mensagens"
          aria-label="Pesquisar mensagens"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSearch();
          }}
        >
          <Search size={20} strokeWidth={1.75} />
        </button>
        <div className="wa-conversas-thread-more-wrap">
          <button
            ref={menuBtnRef}
            type="button"
            className="wa-conversas-thread-icon-btn"
            title="Mais opções"
            aria-label="Mais opções"
            aria-expanded={threadMenuOpen}
            aria-haspopup="menu"
            onClick={(e) => {
              e.stopPropagation();
              onThreadMenuOpenChange(!threadMenuOpen);
            }}
          >
            <MoreVertical size={20} strokeWidth={1.75} />
          </button>
          <WaLinkThreadMoreMenu
            open={threadMenuOpen}
            isStarred={isStarred}
            isBlocked={isBlocked}
            onClose={() => onThreadMenuOpenChange(false)}
            onAction={onThreadMenuAction}
            anchorRef={menuBtnRef}
          />
        </div>
      </div>
    </header>
  );
};

function assigneeInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.trim()[0]?.toUpperCase() || '?';
}

export default WaLinkThreadHead;
