import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

const STORAGE_KEY = 'logstoka:products-import-tip-dismissed';

type Props = {
  onLearnMore?: () => void;
};

const ProductsTipNotification: React.FC<Props> = ({ onLearnMore }) => {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== '1';
    } catch {
      return true;
    }
  });

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="ls-products-tip-notification" role="note">
      <span className="ls-products-tip-notification__icon" aria-hidden>
        <Info size={18} strokeWidth={2.25} />
      </span>
      <div className="ls-products-tip-notification__body">
        <p className="ls-products-tip-notification__title">Atualize seus produtos com rapidez!</p>
        <p className="ls-products-tip-notification__message">
          Sabia que você pode cadastrar ou atualizar todos os dados de uma só vez? Utilize a importação por planilha
          para ganhar tempo e evitar erros manuais.
        </p>
        <button type="button" className="ls-products-tip-notification__link" onClick={onLearnMore}>
          Ver como fazer
        </button>
      </div>
      <button type="button" className="ls-products-tip-notification__close" onClick={dismiss} aria-label="Fechar dica">
        <X size={16} strokeWidth={2.25} />
      </button>
    </div>
  );
};

export default ProductsTipNotification;
