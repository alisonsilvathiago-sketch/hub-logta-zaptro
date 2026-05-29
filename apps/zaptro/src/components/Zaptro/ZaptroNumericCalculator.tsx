import React, { useCallback, useMemo, useState } from 'react';
import { Delete } from 'lucide-react';
import './ZaptroNumericCalculator.css';

type Op = '+' | '-';

type Props = {
  /** Ao aplicar, envia o valor actual do visor (após = ou número digitado). */
  onApply?: (value: number) => void;
  applyLabel?: string;
  title?: string;
  hint?: string;
};

function parseDisplay(raw: string): number {
  const n = parseFloat(raw.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function formatDisplay(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 100) / 100;
  return String(rounded).replace('.', ',');
}

export const ZaptroNumericCalculator: React.FC<Props> = ({
  onApply,
  applyLabel = 'Aplicar aos extras (R$)',
  title = 'Calculadora',
  hint = 'Some valores com + e −. Toque = e depois aplique ao orçamento.',
}) => {
  const [display, setDisplay] = useState('0');
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<Op | null>(null);
  const [freshEntry, setFreshEntry] = useState(true);

  const displayValue = useMemo(() => parseDisplay(display), [display]);

  const reset = useCallback(() => {
    setDisplay('0');
    setAccumulator(null);
    setPendingOp(null);
    setFreshEntry(true);
  }, []);

  const appendDigit = useCallback(
    (digit: string) => {
      setDisplay((prev) => {
        if (freshEntry) return digit === '0' ? '0' : digit;
        if (prev === '0' && digit !== '0') return digit;
        return prev + digit;
      });
      setFreshEntry(false);
    },
    [freshEntry],
  );

  const appendDecimal = useCallback(() => {
    setDisplay((prev) => {
      const base = freshEntry ? '0' : prev;
      if (base.includes(',') || base.includes('.')) return base;
      return `${base},`;
    });
    setFreshEntry(false);
  }, [freshEntry]);

  const backspace = useCallback(() => {
    setDisplay((prev) => {
      if (freshEntry || prev.length <= 1) return '0';
      const next = prev.slice(0, -1);
      return next || '0';
    });
    setFreshEntry(false);
  }, [freshEntry]);

  const compute = useCallback((a: number, b: number, op: Op): number => {
    const result = op === '+' ? a + b : a - b;
    return Math.round(result * 100) / 100;
  }, []);

  const chooseOp = useCallback(
    (op: Op) => {
      const current = parseDisplay(display);
      if (accumulator !== null && pendingOp && !freshEntry) {
        const result = compute(accumulator, current, pendingOp);
        setAccumulator(result);
        setDisplay(formatDisplay(result));
      } else {
        setAccumulator(current);
      }
      setPendingOp(op);
      setFreshEntry(true);
    },
    [accumulator, compute, display, freshEntry, pendingOp],
  );

  const equals = useCallback(() => {
    if (accumulator === null || !pendingOp) return;
    const current = parseDisplay(display);
    const result = compute(accumulator, current, pendingOp);
    setDisplay(formatDisplay(result));
    setAccumulator(null);
    setPendingOp(null);
    setFreshEntry(true);
  }, [accumulator, compute, display, pendingOp]);

  const keys: { label: string; action: () => void; variant?: 'op' | 'eq' | 'wide' | 'danger' }[] = [
    { label: 'C', action: reset, variant: 'danger' },
    { label: '⌫', action: backspace, variant: 'danger' },
    { label: '+', action: () => chooseOp('+'), variant: 'op' },
    { label: '−', action: () => chooseOp('-'), variant: 'op' },
    { label: '7', action: () => appendDigit('7') },
    { label: '8', action: () => appendDigit('8') },
    { label: '9', action: () => appendDigit('9') },
    { label: '=', action: equals, variant: 'eq' },
    { label: '4', action: () => appendDigit('4') },
    { label: '5', action: () => appendDigit('5') },
    { label: '6', action: () => appendDigit('6') },
    { label: '1', action: () => appendDigit('1') },
    { label: '2', action: () => appendDigit('2') },
    { label: '3', action: () => appendDigit('3') },
    { label: '0', action: () => appendDigit('0'), variant: 'wide' },
    { label: ',', action: appendDecimal },
  ];

  return (
    <div className="zaptro-num-calc">
      <div className="zaptro-num-calc-head">
        <strong>{title}</strong>
        {hint ? <p>{hint}</p> : null}
      </div>

      <div className="zaptro-num-calc-display" aria-live="polite">
        {pendingOp && accumulator !== null ? (
          <span className="zaptro-num-calc-display-meta">
            {formatDisplay(accumulator)} {pendingOp === '+' ? '+' : '−'}
          </span>
        ) : null}
        <span className="zaptro-num-calc-display-value">{display}</span>
      </div>

      <div className="zaptro-num-calc-grid">
        {keys.map((k) => (
          <button
            key={k.label}
            type="button"
            className={`zaptro-num-calc-key${k.variant ? ` zaptro-num-calc-key--${k.variant}` : ''}`}
            onClick={k.action}
            aria-label={k.label === '⌫' ? 'Apagar' : k.label}
          >
            {k.label === '⌫' ? <Delete size={18} strokeWidth={2} /> : k.label}
          </button>
        ))}
      </div>

      {onApply ? (
        <button
          type="button"
          className="zaptro-num-calc-apply"
          onClick={() => onApply(displayValue)}
        >
          {applyLabel}
        </button>
      ) : null}
    </div>
  );
};

export default ZaptroNumericCalculator;
