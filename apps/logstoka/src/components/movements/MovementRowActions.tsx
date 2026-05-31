import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  Copy,
  Eye,
  MoreVertical,
  Pencil,
  Printer,
  Tag,
  Trash2,
} from 'lucide-react';
import { stopRowNavigate } from '@/components/ui/ClickableTableRow';
import RowActionsMenuPortal from '@/components/ui/RowActionsMenuPortal';

type Props = {
  movementId: string;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onPrint: () => void;
  onPrintLabel: () => void;
  onDelete: () => void;
};

const MovementRowActions: React.FC<Props> = ({
  movementId,
  onView,
  onEdit,
  onDuplicate,
  onPrint,
  onPrintLabel,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="ls-row-actions" onClick={stopRowNavigate} onKeyDown={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        className="ls-row-actions__trigger"
        aria-label="Ações da movimentação"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical size={18} strokeWidth={2.25} aria-hidden />
      </button>

      <RowActionsMenuPortal open={open} onClose={() => setOpen(false)} triggerRef={triggerRef}>
        <button type="button" role="menuitem" className="ls-row-actions__item" onClick={() => run(onView)}>
          <Eye size={15} aria-hidden />
          Visualizar
        </button>
        <button type="button" role="menuitem" className="ls-row-actions__item" onClick={() => run(onEdit)}>
          <Pencil size={15} aria-hidden />
          Editar
        </button>
        <button type="button" role="menuitem" className="ls-row-actions__item" onClick={() => run(onDuplicate)}>
          <Copy size={15} aria-hidden />
          Duplicar
        </button>
        <button
          type="button"
          role="menuitem"
          className="ls-row-actions__item"
          onClick={() => run(() => navigate(`/app/movements/${movementId}`))}
        >
          <ArrowLeftRight size={15} aria-hidden />
          Movimentações
        </button>
        <button
          type="button"
          role="menuitem"
          className="ls-row-actions__item"
          onClick={() => run(() => navigate('/app/transfers'))}
        >
          <ArrowLeftRight size={15} aria-hidden />
          Transferir
        </button>
        <button type="button" role="menuitem" className="ls-row-actions__item" onClick={() => run(onPrintLabel)}>
          <Tag size={15} aria-hidden />
          Imprimir etiqueta
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
      </RowActionsMenuPortal>
    </div>
  );
};

export default MovementRowActions;
