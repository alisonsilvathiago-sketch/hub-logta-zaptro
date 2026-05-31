import React from 'react';
import {
  ClipboardCheck,
  Download,
  Printer,
  RefreshCw,
  Share2,
  Trash2,
} from 'lucide-react';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';

type IconActionProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  accent?: boolean;
  children: React.ReactNode;
};

const IconAction: React.FC<IconActionProps> = ({ label, onClick, disabled, danger, accent, children }) => (
  <LogstokaIconTooltip label={label}>
    <button
      type="button"
      className={`ls-products-icon-action${danger ? ' ls-products-icon-action--danger' : ''}${accent ? ' ls-products-icon-action--accent' : ''}`}
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  </LogstokaIconTooltip>
);

type Props = {
  selectedCount: number;
  queueCount: number;
  loading?: boolean;
  onRefresh: () => void;
  onConference: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onShare: () => void;
  onRemoveSelected: () => void;
};

const PickingDayToolbar: React.FC<Props> = ({
  selectedCount,
  queueCount,
  loading,
  onRefresh,
  onConference,
  onPrint,
  onDownload,
  onShare,
  onRemoveSelected,
}) => (
  <div className="ls-products-icon-toolbar ls-pick-toolbar" aria-label="Ações da conferência do dia">
    <IconAction label="Atualizar fila do dia" onClick={onRefresh} disabled={loading}>
      <RefreshCw size={18} strokeWidth={2} className={loading ? 'animate-spin' : undefined} />
    </IconAction>

    <span className="ls-products-icon-toolbar__sep" aria-hidden />

    <IconAction label="Remover selecionados da fila" disabled={selectedCount === 0} danger onClick={onRemoveSelected}>
      <Trash2 size={18} strokeWidth={2} />
    </IconAction>
    <IconAction label="Compartilhar selecionados" disabled={selectedCount === 0} onClick={onShare}>
      <Share2 size={18} strokeWidth={2} />
    </IconAction>
    <IconAction label="Imprimir fila" disabled={queueCount === 0} onClick={onPrint}>
      <Printer size={18} strokeWidth={2} />
    </IconAction>
    <IconAction label="Baixar CSV" disabled={queueCount === 0} onClick={onDownload}>
      <Download size={18} strokeWidth={2} />
    </IconAction>

    <span className="ls-products-icon-toolbar__sep" aria-hidden />

    <IconAction
      label={selectedCount > 0 ? `Conferir ${selectedCount} selecionado(s)` : 'Conferir fila do dia'}
      disabled={queueCount === 0}
      accent
      onClick={onConference}
    >
      <ClipboardCheck size={18} strokeWidth={2} />
    </IconAction>
  </div>
);

export default PickingDayToolbar;
