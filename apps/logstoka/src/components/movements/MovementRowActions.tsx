import React, { useEffect, useRef, useState } from 'react';
import { Copy, MoreVertical, Pencil, Printer, Trash2 } from 'lucide-react';
import { stopRowNavigate } from '@/components/ui/ClickableTableRow';

type Props = {
  onEdit: () => void;
  onDuplicate: () => void;
  onPrint: () => void;
  onDelete: () => void;
};

const MovementRowActions: React.FC<Props> = ({ onEdit, onDuplicate, onPrint, onDelete }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div
      ref={wrapRef}
      className="ls-row-actions"
      onClick={stopRowNavigate}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="ls-row-actions__trigger"
        aria-label="Ações da movimentação"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical size={18} strokeWidth={2.25} aria-hidden />
      </button>

      {open ? (
        <div className="ls-row-actions__menu" role="menu">
          <button type="button" role="menuitem" className="ls-row-actions__item" onClick={() => run(onEdit)}>
            <Pencil size={15} aria-hidden />
            Editar
          </button>
          <button type="button" role="menuitem" className="ls-row-actions__item" onClick={() => run(onDuplicate)}>
            <Copy size={15} aria-hidden />
            Duplicar
          </button>
          <button type="button" role="menuitem" className="ls-row-actions__item" onClick={() => run(onPrint)}>
            <Printer size={15} aria-hidden />
            Imprimir
          </button>
          <button
            type="button"
            role="menuitem"
            className="ls-row-actions__item ls-row-actions__item--danger"
            onClick={() => run(onDelete)}
          >
            <Trash2 size={15} aria-hidden />
            Excluir
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default MovementRowActions;
