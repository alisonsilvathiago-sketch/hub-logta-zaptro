import React, { useEffect, useRef } from 'react';
import {
  CheckCheck,
  List,
  Lock,
  LogOut,
  SquareCheck,
  Star,
} from 'lucide-react';

export type WaLinkMoreMenuAction =
  | 'broadcasts'
  | 'starred'
  | 'select'
  | 'mark-all-read'
  | 'app-lock'
  | 'disconnect';

type Props = {
  open: boolean;
  onClose: () => void;
  onAction: (action: WaLinkMoreMenuAction) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
};

const WaLinkInboxMoreMenu: React.FC<Props> = ({ open, onClose, onAction, anchorRef }) => {
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

  const item = (action: WaLinkMoreMenuAction, label: string, icon: React.ReactNode) => (
    <button
      key={action}
      type="button"
      role="menuitem"
      className="wa-conversas-more-menu-item"
      onClick={() => {
        onAction(action);
        onClose();
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div ref={menuRef} className="wa-conversas-more-menu" role="menu">
      <div className="wa-conversas-more-menu-section">
        {item('broadcasts', 'Listas de Transmissão', <List size={18} strokeWidth={1.75} />)}
      </div>
      <div className="wa-conversas-more-menu-divider" role="separator" />
      {item('starred', 'Mensagens favoritas', <Star size={18} strokeWidth={1.75} />)}
      {item('select', 'Selecionar conversas', <SquareCheck size={18} strokeWidth={1.75} />)}
      {item(
        'mark-all-read',
        'Marcar todas como lidas',
        <CheckCheck size={18} strokeWidth={1.75} />,
      )}
      <div className="wa-conversas-more-menu-divider" role="separator" />
      {item('app-lock', 'Bloqueio do app', <Lock size={18} strokeWidth={1.75} />)}
      {item('disconnect', 'Desconectar', <LogOut size={18} strokeWidth={1.75} />)}
    </div>
  );
};

export default WaLinkInboxMoreMenu;
