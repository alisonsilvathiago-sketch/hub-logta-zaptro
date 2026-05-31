import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './lsModal.css';

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  /** @deprecated use size="wide" */
  wide?: boolean;
  size?: 'default' | 'wide' | 'landscape';
  paddingVariant?: 'default' | 'balanced';
  panelClassName?: string;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  open,
  title,
  subtitle,
  icon,
  onClose,
  children,
  wide,
  size,
  paddingVariant = 'default',
  panelClassName,
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
  const paddingClass = paddingVariant === 'balanced' ? ' ls-modal__panel--balanced' : '';

  return createPortal(
    <div className="ls-modal" role="dialog" aria-modal="true" aria-labelledby="ls-modal-title">
      <button type="button" className="ls-modal__backdrop" aria-label="Fechar" onClick={onClose} />
      <div className={`ls-modal__panel ${sizeClass}${paddingClass}${panelClassName ? ` ${panelClassName}` : ''}`}>
        <div className={`ls-modal__header${resolvedSize === 'landscape' ? ' ls-modal__header--landscape' : ''}${paddingVariant === 'balanced' ? ' ls-modal__header--balanced' : ''}`}>
          <div className="ls-modal__header-brand">
            {icon ? (
              <span className="ls-modal__header-icon" aria-hidden>
                {icon}
              </span>
            ) : null}
            <div className="min-w-0">
              <h3 id="ls-modal-title" className="ls-modal__title">
                {title}
              </h3>
              {subtitle ? <p className="ls-modal__subtitle">{subtitle}</p> : null}
            </div>
          </div>
          <button type="button" onClick={onClose} className="ls-modal__close" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div
          className={`ls-modal__body${footer ? ' ls-modal__body--with-footer' : ''}${resolvedSize === 'landscape' ? ' ls-modal__body--landscape' : ''}${paddingVariant === 'balanced' ? ' ls-modal__body--balanced' : ''}`}
        >
          {children}
        </div>

        {footer ? (
          <div className={`ls-modal__footer${paddingVariant === 'balanced' ? ' ls-modal__footer--balanced' : ''}`}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
