import React from 'react';
import { createPortal } from 'react-dom';
import { Minimize2 } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  stepLabel: string;
  onClose: () => void;
  children: React.ReactNode;
};

const OperatorModeOverlay: React.FC<Props> = ({ open, title, stepLabel, onClose, children }) => {
  if (!open) return null;

  return createPortal(
    <div className="ls-op-operator-screen" role="dialog" aria-modal="true" aria-label={title}>
      <header className="ls-op-operator-screen__head">
        <div>
          <p className="ls-op-operator-screen__kicker">Modo operador</p>
          <h2 className="ls-op-operator-screen__title">{title}</h2>
          <p className="ls-op-operator-screen__step">{stepLabel}</p>
        </div>
        <button type="button" className="ls-op-operator-screen__exit" onClick={onClose}>
          <Minimize2 size={18} />
          Sair do modo operador
        </button>
      </header>
      <div className="ls-op-operator-screen__body">{children}</div>
    </div>,
    document.body,
  );
};

export default OperatorModeOverlay;
