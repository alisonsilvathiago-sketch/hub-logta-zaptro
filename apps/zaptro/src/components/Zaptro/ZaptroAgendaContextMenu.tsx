import React, { useEffect, useRef } from 'react';
import { CalendarClock, Copy, Edit2, Plus, Trash2 } from 'lucide-react';
import type { ZaptroActivityEntry } from '../../constants/zaptroActivityLogStore';

export type AgendaContextMenuState =
  | { kind: 'day'; x: number; y: number; date: Date }
  | { kind: 'event'; x: number; y: number; item: ZaptroActivityEntry }
  | null;

type Props = {
  menu: AgendaContextMenuState;
  onClose: () => void;
  onCreateEvent: (date: Date) => void;
  onCreateMeeting: (date: Date) => void;
  onOpenEvent: (item: ZaptroActivityEntry) => void;
  onEditEvent: (item: ZaptroActivityEntry) => void;
  onDuplicateEvent: (item: ZaptroActivityEntry) => void;
  onDeleteEvent: (item: ZaptroActivityEntry) => void;
};

export const ZaptroAgendaContextMenu: React.FC<Props> = ({
  menu,
  onClose,
  onCreateEvent,
  onCreateMeeting,
  onOpenEvent,
  onEditEvent,
  onDuplicateEvent,
  onDeleteEvent,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const left = Math.min(menu.x, window.innerWidth - 220);
  const top = Math.min(menu.y, window.innerHeight - 280);

  const itemBtn = (onClick: () => void, label: string, icon: React.ReactNode, danger?: boolean) => (
    <button
      type="button"
      className={`zaptro-agenda-ctx__item${danger ? ' is-danger' : ''}`}
      onClick={() => {
        onClick();
        onClose();
      }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div
      ref={ref}
      className="zaptro-agenda-ctx"
      style={{ position: 'fixed', left, top, zIndex: 7000 }}
      role="menu"
    >
      {menu.kind === 'day' ? (
        <>
          {itemBtn(() => onCreateEvent(menu.date), 'Criar evento', <Plus size={16} />)}
          {itemBtn(() => onCreateMeeting(menu.date), 'Marcar reunião', <CalendarClock size={16} />)}
        </>
      ) : (
        <>
          {itemBtn(() => onOpenEvent(menu.item), 'Abrir', <CalendarClock size={16} />)}
          {itemBtn(() => onEditEvent(menu.item), 'Editar', <Edit2 size={16} />)}
          {itemBtn(() => onDuplicateEvent(menu.item), 'Duplicar', <Copy size={16} />)}
          {itemBtn(() => onDeleteEvent(menu.item), 'Excluir', <Trash2 size={16} />, true)}
        </>
      )}
    </div>
  );
};
