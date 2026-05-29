import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Calculator, X } from 'lucide-react';
import { ZaptroNumericCalculator } from './ZaptroNumericCalculator';
import { notifyZaptro } from './ZaptroNotificationSystem';
import './zaptroCalculatorPopover.css';

type Props = {
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Abre o painel à esquerda do botão (padrão) ou à direita. */
  placement?: 'left' | 'right';
  applyLabel?: string;
  onApply?: (value: number) => void;
};

const ZaptroCalculatorToolbarButton: React.FC<Props> = ({
  title = 'Calculadora',
  className = 'zaptro-btn-toolbar',
  style,
  placement = 'left',
  applyLabel = 'Copiar valor',
  onApply,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleApply = useCallback(
    (value: number) => {
      if (onApply) {
        onApply(value);
      } else {
        const rounded = Math.max(0, Math.round(value * 100) / 100);
        void navigator.clipboard?.writeText(String(rounded)).catch(() => {});
        notifyZaptro('success', 'Calculadora', `Valor ${rounded.toLocaleString('pt-BR')} copiado.`);
      }
      setOpen(false);
    },
    [onApply],
  );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className={`zaptro-calculator-toolbar${open ? ' is-open' : ''}`}
      data-placement={placement}
    >
      <button
        type="button"
        className={className}
        title={title}
        aria-label={title}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 40,
          minWidth: 40,
          maxWidth: 40,
          padding: 0,
          borderRadius: 12,
          border: '1px solid #e4e4e7',
          backgroundColor: '#fff',
          color: '#000',
          ...style,
        }}
      >
        <Calculator size={18} strokeWidth={2.2} aria-hidden />
      </button>

      {open ? (
        <div
          className="zaptro-calculator-popover"
          role="dialog"
          aria-label="Calculadora numérica"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="zaptro-calculator-popover__head">
            <span className="zaptro-calculator-popover__title">{title}</span>
            <button
              type="button"
              className="zaptro-calculator-popover__close"
              aria-label="Fechar calculadora"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <ZaptroNumericCalculator
            title=""
            hint="Use +, − e =. O resultado pode ser copiado."
            applyLabel={applyLabel}
            onApply={handleApply}
          />
        </div>
      ) : null}
    </div>
  );
};

export default ZaptroCalculatorToolbarButton;
