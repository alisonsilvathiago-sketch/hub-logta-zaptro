import React from 'react';
import { Download, Forward, Star, Trash2, X } from 'lucide-react';

type Props = {
  count: number;
  disabled?: boolean;
  onClose: () => void;
  onStar: () => void;
  onDelete: () => void;
  onForward: () => void;
  onCopy: () => void;
};

const WaLinkMessageSelectBar: React.FC<Props> = ({
  count,
  disabled,
  onClose,
  onStar,
  onDelete,
  onForward,
  onCopy,
}) => {
  const label = count === 1 ? '1 selecionada' : `${count} selecionadas`;

  return (
    <div className="wa-conversas-msg-select-bar" role="toolbar" aria-label="Mensagens selecionadas">
      <button type="button" className="wa-conversas-msg-select-close" onClick={onClose} aria-label="Cancelar seleção">
        <X size={22} strokeWidth={2} />
      </button>
      <span className="wa-conversas-msg-select-count">{label}</span>
      <div className="wa-conversas-msg-select-actions">
        <button
          type="button"
          className="wa-conversas-msg-select-action"
          title="Favoritar"
          aria-label="Favoritar"
          disabled={disabled}
          onClick={onStar}
        >
          <Star size={20} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="wa-conversas-msg-select-action wa-conversas-msg-select-action--danger"
          title="Apagar"
          aria-label="Apagar"
          disabled={disabled}
          onClick={onDelete}
        >
          <Trash2 size={20} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="wa-conversas-msg-select-action wa-conversas-msg-select-action--accent"
          title="Encaminhar"
          aria-label="Encaminhar"
          disabled={disabled}
          onClick={onForward}
        >
          <Forward size={20} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="wa-conversas-msg-select-action"
          title="Copiar texto"
          aria-label="Copiar"
          disabled={disabled}
          onClick={onCopy}
        >
          <Download size={20} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
};

export default WaLinkMessageSelectBar;
