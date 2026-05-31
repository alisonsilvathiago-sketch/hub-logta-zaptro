import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  Copy,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { stopRowNavigate } from '@/components/ui/ClickableTableRow';

type Props = {
  productId: string;
  sku: string;
  name: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canWrite: boolean;
};

const ProductRowActions: React.FC<Props> = ({
  productId,
  sku,
  name,
  onEdit,
  onDuplicate,
  onDelete,
  canWrite,
}) => {
  const navigate = useNavigate();
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
    <div ref={wrapRef} className="ls-row-actions" onClick={stopRowNavigate} onKeyDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="ls-row-actions__trigger"
        aria-label={`Ações do produto ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical size={18} strokeWidth={2.25} aria-hidden />
      </button>

      {open ? (
        <div className="ls-row-actions__menu" role="menu">
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
        </div>
      ) : null}
    </div>
  );
};

export default ProductRowActions;
