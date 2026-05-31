import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

type Variant = 'success' | 'warning';

type Props = {
  variant: Variant;
  title: string;
  message: string;
  onClose?: () => void;
};

const ProductWizardBanner: React.FC<Props> = ({ variant, title, message, onClose }) => (
  <div
    className={`ls-product-wizard-banner ls-product-wizard-banner--${variant}`}
    role={variant === 'warning' ? 'alert' : 'status'}
    aria-live="polite"
  >
    <span className="ls-product-wizard-banner__icon" aria-hidden>
      {variant === 'success' ? <CheckCircle2 size={20} strokeWidth={2.25} /> : <AlertTriangle size={20} strokeWidth={2.25} />}
    </span>
    <div className="ls-product-wizard-banner__body">
      <p className="ls-product-wizard-banner__title">{title}</p>
      <p className="ls-product-wizard-banner__message">{message}</p>
    </div>
    {onClose ? (
      <button type="button" className="ls-product-wizard-banner__close" onClick={onClose} aria-label="Fechar">
        <X size={16} strokeWidth={2.25} />
      </button>
    ) : null}
  </div>
);

export default ProductWizardBanner;
