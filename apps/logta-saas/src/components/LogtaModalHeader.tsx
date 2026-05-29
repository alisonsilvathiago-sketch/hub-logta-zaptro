import React from 'react';
import { Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type LogtaModalHeaderProps = {
  icon: any;
  title: React.ReactNode;
  dotClassName?: string;
  onClose?: () => void;
  closeLabel?: string;
};

export const LogtaModalHeader: React.FC<LogtaModalHeaderProps> = ({
  icon: Icon,
  title,
  dotClassName = 'bg-primary',
  onClose,
  closeLabel = 'Fechar',
}) => {
  return (
    <div className="logta-modal-header">
      <div className="logta-modal-header__main">
        <div className="logta-modal-header__icon-cluster">
          <span className={`logta-modal-header__icon-dot ${dotClassName}`} aria-hidden />
          {Icon ? (
            React.isValidElement(Icon) ? (
              Icon
            ) : (
              <Icon size={20} strokeWidth={2} className="logta-modal-header__icon" />
            )
          ) : null}
        </div>
        <h3 className="logta-modal-heading">{title}</h3>
      </div>
      {onClose ? (
        <button
          type="button"
          className="logta-modal-header__action"
          onClick={onClose}
          aria-label={closeLabel}
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
};

export default LogtaModalHeader;
