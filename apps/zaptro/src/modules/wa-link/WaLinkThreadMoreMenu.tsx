import React, { useEffect, useRef } from 'react';
import {
  Archive,
  Ban,
  Calendar,
  CircleX,
  Heart,
  Info,
  Link2,
  MinusCircle,
  Search,
  Shuffle,
  SquareCheck,
  Timer,
  Trash2,
  UserPlus,
  UserRound,
  Target,
  MailOpen,
} from 'lucide-react';

export type WaLinkThreadMenuAction =
  | 'contact'
  | 'search'
  | 'select-messages'
  | 'disappearing'
  | 'favorite'
  | 'add-list'
  | 'block'
  | 'close'
  | 'call-link'
  | 'schedule-call'
  | 'transfer'
  | 'save-contact'
  | 'save-lead'
  | 'mark-unread'
  | 'archive'
  | 'clear'
  | 'delete';

type Props = {
  open: boolean;
  isStarred: boolean;
  isBlocked: boolean;
  onClose: () => void;
  onAction: (action: WaLinkThreadMenuAction) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
};

const WaLinkThreadMoreMenu: React.FC<Props> = ({ open, isStarred, isBlocked, onClose, onAction, anchorRef }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const item = (
    action: WaLinkThreadMenuAction,
    label: string,
    icon: React.ReactNode,
    opts?: { danger?: boolean; disabled?: boolean },
  ) => (
    <button
      key={action}
      type="button"
      role="menuitem"
      className={`wa-thread-more-item${opts?.danger ? ' wa-thread-more-item--danger' : ''}`}
      disabled={opts?.disabled}
      onClick={() => {
        if (opts?.disabled) return;
        onAction(action);
        onClose();
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div ref={menuRef} className="wa-thread-more-menu" role="menu">
      {item('contact', 'Dados do contato', <Info size={18} strokeWidth={1.75} />)}
      {item('search', 'Pesquisar', <Search size={18} strokeWidth={1.75} />)}
      {item('select-messages', 'Selecionar mensagens', <SquareCheck size={18} strokeWidth={1.75} />)}
      {item('disappearing', 'Mensagens temporárias', <Timer size={18} strokeWidth={1.75} />, {
        disabled: true,
      })}
      {item(
        'favorite',
        isStarred ? 'Remover dos favoritos' : 'Adicionar aos favoritos',
        <Heart size={18} strokeWidth={1.75} fill={isStarred ? 'currentColor' : 'none'} />,
      )}
      {item('add-list', 'Adicionar à lista', <UserPlus size={18} strokeWidth={1.75} />)}
      {item('save-contact', 'Salvar como contato', <UserRound size={18} strokeWidth={1.75} />)}
      {item('save-lead', 'Cadastrar como lead', <Target size={18} strokeWidth={1.75} />)}
      {item('transfer', 'Transferir departamento', <Shuffle size={18} strokeWidth={1.75} />)}
      {item('block', isBlocked ? 'Desbloquear contato' : 'Bloquear contato', <Ban size={18} strokeWidth={1.75} />)}
      {item('mark-unread', 'Marcar como não lida', <MailOpen size={18} strokeWidth={1.75} />)}
      {item('archive', 'Arquivar conversa', <Archive size={18} strokeWidth={1.75} />)}
      {item('close', 'Fechar conversa', <CircleX size={18} strokeWidth={1.75} />)}
      <div className="wa-thread-more-divider" role="separator" />
      {item('call-link', 'Enviar link de ligação', <Link2 size={18} strokeWidth={1.75} />, { disabled: true })}
      {item('schedule-call', 'Programar ligação', <Calendar size={18} strokeWidth={1.75} />, {
        disabled: true,
      })}
      <div className="wa-thread-more-divider" role="separator" />
      {item('clear', 'Limpar conversa', <MinusCircle size={18} strokeWidth={1.75} />)}
      {item('delete', 'Apagar conversa', <Trash2 size={18} strokeWidth={1.75} />, { danger: true })}
    </div>
  );
};

export default WaLinkThreadMoreMenu;
