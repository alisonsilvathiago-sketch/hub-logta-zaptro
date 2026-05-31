import React from 'react';
import { Info, X } from 'lucide-react';

type Props = {
  title: string;
  message: string;
  onClose: () => void;
};

const ProductsProcessingBanner: React.FC<Props> = ({ title, message, onClose }) => (
  <div className="ls-products-processing-banner" role="status" aria-live="polite">
    <span className="ls-products-processing-banner__icon" aria-hidden>
      <Info size={18} strokeWidth={2.25} />
    </span>
    <div className="ls-products-processing-banner__body">
      <p className="ls-products-processing-banner__title">{title}</p>
      <p className="ls-products-processing-banner__message">{message}</p>
    </div>
    <button type="button" className="ls-products-processing-banner__close" onClick={onClose} aria-label="Fechar aviso">
      <X size={16} strokeWidth={2.25} />
    </button>
  </div>
);

export default ProductsProcessingBanner;
