import React from 'react';
import { ArrowLeftRight, Pencil, Trash2, X } from 'lucide-react';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';

type Props = {
  selectedCount: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onTransfer?: () => void;
  onClear: () => void;
};

const LogstokaTableBulkBar: React.FC<Props> = ({
  selectedCount,
  onEdit,
  onDelete,
  onTransfer,
  onClear,
}) => {
  if (selectedCount <= 0) return null;

  return (
    <div className="ls-table-bulk-bar" role="status">
      <span className="ls-table-bulk-bar__count">
        <strong>{selectedCount}</strong> selecionado(s)
      </span>
      <div className="ls-table-bulk-bar__actions">
        {onEdit ? (
          <LogstokaIconTooltip label="Editar selecionado">
            <button type="button" className="ls-products-icon-action" aria-label="Editar selecionado" onClick={onEdit}>
              <Pencil size={17} strokeWidth={2} />
            </button>
          </LogstokaIconTooltip>
        ) : null}
        {onTransfer ? (
          <LogstokaIconTooltip label="Transferir selecionado(s)">
            <button type="button" className="ls-products-icon-action" aria-label="Transferir" onClick={onTransfer}>
              <ArrowLeftRight size={17} strokeWidth={2} />
            </button>
          </LogstokaIconTooltip>
        ) : null}
        {onDelete ? (
          <LogstokaIconTooltip label="Excluir selecionado(s)">
            <button
              type="button"
              className="ls-products-icon-action ls-products-icon-action--danger"
              aria-label="Excluir selecionados"
              onClick={onDelete}
            >
              <Trash2 size={17} strokeWidth={2} />
            </button>
          </LogstokaIconTooltip>
        ) : null}
        <button type="button" className="ls-table-bulk-bar__clear" onClick={onClear}>
          <X size={14} aria-hidden />
          Limpar
        </button>
      </div>
    </div>
  );
};

export default LogstokaTableBulkBar;
