import React from 'react';
import { X } from 'lucide-react';
import './lsModal.css';

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** @deprecated use size="wide" */
  wide?: boolean;
  size?: 'default' | 'wide' | 'landscape';
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide,
  size,
  footer,
}) => {
  if (!open) return null;

  const resolvedSize = size ?? (wide ? 'wide' : 'default');
  const sizeClass =
    resolvedSize === 'landscape'
      ? 'ls-modal__panel--landscape'
      : resolvedSize === 'wide'
        ? 'ls-modal__panel--wide'
        : 'ls-modal__panel--default';

  return (
    <div className="ls-modal" role="dialog" aria-modal="true" aria-labelledby="ls-modal-title">
      <button type="button" className="ls-modal__backdrop" aria-label="Fechar" onClick={onClose} />
      <div className={`ls-modal__panel ${sizeClass}`}>
        <div className={`ls-modal__header${resolvedSize === 'landscape' ? ' ls-modal__header--landscape' : ''}`}>
          <div>
            <h3 id="ls-modal-title" className="ls-modal__title">
              {title}
            </h3>
            {subtitle ? <p className="ls-modal__subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="ls-modal__close" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div
          className={`ls-modal__body${footer ? ' ls-modal__body--with-footer' : ''}${resolvedSize === 'landscape' ? ' ls-modal__body--landscape' : ''}`}
        >
          {children}
        </div>

        {footer ? <div className="ls-modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
};

export default Modal;
