import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  Copy,
  Eye,
  MoreVertical,
  Pencil,
  Tag,
  Trash2,
} from 'lucide-react';
import { stopRowNavigate } from '@/components/ui/ClickableTableRow';
import RowActionsMenuPortal from '@/components/ui/RowActionsMenuPortal';

type Props = {
  productId: string;
  sku: string;
  name: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onPrintLabel: () => void;
  onDelete: () => void;
  canWrite: boolean;
};

const ProductRowActions: React.FC<Props> = ({
  productId,
  sku,
  name,
  onEdit,
  onDuplicate,
  onPrintLabel,
  onDelete,
  canWrite,
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
        aria-label={`Ações do produto ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical size={18} strokeWidth={2.25} aria-hidden />
      </button>

      <RowActionsMenuPortal open={open} onClose={() => setOpen(false)} triggerRef={triggerRef}>
        <button
          type="button"
          role="menuitem"
          className="ls-row-actions__item"
          onClick={() => run(() => navigate(`/app/products/${productId}`))}
        >
          <Eye size={15} aria-hidden />
          Visualizar
        </button>

        {canWrite ? (
          <button type="button" role="menuitem" className="ls-row-actions__item" onClick={() => run(onEdit)}>
            <Pencil size={15} aria-hidden />
            Editar
          </button>
        ) : null}

        {canWrite ? (
          <button type="button" role="menuitem" className="ls-row-actions__item" onClick={() => run(onDuplicate)}>
            <Copy size={15} aria-hidden />
            Duplicar
          </button>
        ) : null}

        <button
          type="button"
          role="menuitem"
          className="ls-row-actions__item"
          onClick={() => run(() => navigate(`/app/transfers?sku=${encodeURIComponent(sku)}`))}
        >
          <ArrowLeftRight size={15} aria-hidden />
          Movimentar
        </button>

        <button type="button" role="menuitem" className="ls-row-actions__item" onClick={() => run(onPrintLabel)}>
          <Tag size={15} aria-hidden />
          Imprimir etiqueta
        </button>

        {canWrite ? (
          <button
            type="button"
            role="menuitem"
            className="ls-row-actions__item ls-row-actions__item--danger"
            onClick={() => run(onDelete)}
          >
            <Trash2 size={15} aria-hidden />
            Excluir
          </button>
        ) : null}
      </RowActionsMenuPortal>
    </div>
  );
};

export default ProductRowActions;
