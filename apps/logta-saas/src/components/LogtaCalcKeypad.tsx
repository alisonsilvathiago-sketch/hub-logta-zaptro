import React from 'react';
import { Delete, Plus } from 'lucide-react';

type FieldOption = {
  id: string;
  label: string;
};

type Props = {
  display: string;
  fields: FieldOption[];
  activeFieldId: string;
  onActiveFieldChange: (id: string) => void;
  onDisplayChange: (value: string) => void;
  onApply: () => void;
  onSum: () => void;
};

function formatDisplayLabel(raw: string) {
  if (!raw || raw === '0') return '0';
  return raw.replace(/\*/g, 'x');
}

export function LogtaCalcKeypad({
  display,
  fields,
  activeFieldId,
  onActiveFieldChange,
  onDisplayChange,
  onApply,
  onSum,
}: Props) {
  const append = (key: string) => {
    if (display === '0' || display === 'Erro') {
      if (['+', '-', '*', '/', '%'].includes(key)) {
        onDisplayChange(`0 ${key} `);
      } else {
        onDisplayChange(key);
      }
    } else {
      if (['+', '-', '*', '/', '%'].includes(key)) {
        onDisplayChange(`${display} ${key} `);
      } else {
        onDisplayChange(display + key);
      }
    }
  };

  const clearAll = () => onDisplayChange('0');

  const backspace = () => {
    if (display.length <= 1 || display === 'Erro') {
      onDisplayChange('0');
    } else {
      if (display.endsWith(' ')) {
        onDisplayChange(display.slice(0, -3));
      } else {
        onDisplayChange(display.slice(0, -1));
      }
    }
  };

  const handleEvaluate = () => {
    try {
      let sanitized = display
        .replace(/\./g, '')
        .replace(/,/g, '.')
        .replace(/x/g, '*')
        .replace(/X/g, '*')
        .replace(/%/g, '/100');

      const sanitizedClean = sanitized.replace(/[^0-9+\-*/().\s]/g, '');
      const result = new Function(`return (${sanitizedClean})`)();
      
      if (result === undefined || !Number.isFinite(result)) {
        onDisplayChange('Erro');
        return;
      }
      
      const rounded = Math.round(result * 100) / 100;
      const [intPart, dec] = String(rounded).split('.');
      const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      const formatted = dec ? `${withDots},${dec}` : withDots;
      onDisplayChange(formatted);
    } catch {
      onDisplayChange('Erro');
    }
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-neutral-800 bg-neutral-950">
      {/* Visor */}
      <div className="border-b border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 px-5 py-6 text-right">
        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Digite ou some expressões</p>
        <p className="mt-1.5 font-mono text-3xl font-black tabular-nums tracking-tight text-white select-all">
          {formatDisplayLabel(display)}
        </p>
      </div>

      {/* Campos ativos */}
      {fields.length > 1 ? (
        <div className="flex flex-wrap gap-1.5 border-b border-neutral-800 p-3 bg-neutral-900/20">
          {fields.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onActiveFieldChange(f.id)}
              className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase transition-all cursor-pointer ${
                activeFieldId === f.id
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}

      {/* Teclado */}
      <div className="grid grid-cols-4 gap-1.5 p-3">
        {/* Row 1 */}
        <button
          type="button"
          onClick={clearAll}
          className="rounded-xl bg-neutral-800 py-3.5 text-xs font-black uppercase text-amber-400 hover:bg-neutral-700 cursor-pointer"
        >
          C
        </button>
        <button
          type="button"
          onClick={backspace}
          className="flex items-center justify-center rounded-xl bg-neutral-800 py-3.5 text-neutral-300 hover:bg-neutral-700 cursor-pointer"
          aria-label="Apagar"
        >
          <Delete size={18} />
        </button>
        <button
          type="button"
          onClick={() => append('%')}
          className="rounded-xl bg-neutral-800 py-3.5 text-sm font-black text-primary hover:bg-neutral-700 cursor-pointer"
        >
          %
        </button>
        <button
          type="button"
          onClick={() => append('/')}
          className="rounded-xl bg-neutral-800 py-3.5 text-sm font-black text-primary hover:bg-neutral-700 cursor-pointer"
        >
          /
        </button>

        {/* Row 2 */}
        <button
          type="button"
          onClick={() => append('7')}
          className="rounded-xl bg-neutral-900 py-3.5 text-lg font-black text-white hover:bg-neutral-800 cursor-pointer active:scale-95 transition-all"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => append('8')}
          className="rounded-xl bg-neutral-900 py-3.5 text-lg font-black text-white hover:bg-neutral-800 cursor-pointer active:scale-95 transition-all"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => append('9')}
          className="rounded-xl bg-neutral-900 py-3.5 text-lg font-black text-white hover:bg-neutral-800 cursor-pointer active:scale-95 transition-all"
        >
          9
        </button>
        <button
          type="button"
          onClick={() => append('*')}
          className="rounded-xl bg-neutral-800 py-3.5 text-sm font-black text-primary hover:bg-neutral-700 cursor-pointer"
        >
          x
        </button>

        {/* Row 3 */}
        <button
          type="button"
          onClick={() => append('4')}
          className="rounded-xl bg-neutral-900 py-3.5 text-lg font-black text-white hover:bg-neutral-800 cursor-pointer active:scale-95 transition-all"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => append('5')}
          className="rounded-xl bg-neutral-900 py-3.5 text-lg font-black text-white hover:bg-neutral-800 cursor-pointer active:scale-95 transition-all"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => append('6')}
          className="rounded-xl bg-neutral-900 py-3.5 text-lg font-black text-white hover:bg-neutral-800 cursor-pointer active:scale-95 transition-all"
        >
          6
        </button>
        <button
          type="button"
          onClick={() => append('-')}
          className="rounded-xl bg-neutral-800 py-3.5 text-sm font-black text-primary hover:bg-neutral-700 cursor-pointer"
        >
          -
        </button>

        {/* Row 4 */}
        <button
          type="button"
          onClick={() => append('1')}
          className="rounded-xl bg-neutral-900 py-3.5 text-lg font-black text-white hover:bg-neutral-800 cursor-pointer active:scale-95 transition-all"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => append('2')}
          className="rounded-xl bg-neutral-900 py-3.5 text-lg font-black text-white hover:bg-neutral-800 cursor-pointer active:scale-95 transition-all"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => append('3')}
          className="rounded-xl bg-neutral-900 py-3.5 text-lg font-black text-white hover:bg-neutral-800 cursor-pointer active:scale-95 transition-all"
        >
          3
        </button>
        <button
          type="button"
          onClick={() => append('+')}
          className="rounded-xl bg-neutral-800 py-3.5 text-sm font-black text-primary hover:bg-neutral-700 cursor-pointer"
        >
          +
        </button>

        {/* Row 5 */}
        <button
          type="button"
          onClick={() => append('0')}
          className="col-span-2 rounded-xl bg-neutral-900 py-3.5 text-lg font-black text-white hover:bg-neutral-800 cursor-pointer active:scale-95 transition-all"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => append(',')}
          className="rounded-xl bg-neutral-900 py-3.5 text-lg font-black text-white hover:bg-neutral-800 cursor-pointer"
        >
          ,
        </button>
        <button
          type="button"
          onClick={handleEvaluate}
          className="rounded-xl bg-primary py-3.5 text-lg font-black text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md shadow-primary/20 flex items-center justify-center"
          aria-label="Calcular"
        >
          =
        </button>
      </div>

      {/* Ações de Campo */}
      <div className="flex gap-2 p-3 pt-0 border-t border-neutral-800/40 bg-neutral-900/10">
        <button
          type="button"
          onClick={onSum}
          className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-primary/20 py-3 text-xs font-black uppercase text-primary hover:bg-primary/30 cursor-pointer transition-all active:scale-[0.98]"
        >
          <Plus size={14} strokeWidth={3} /> Somar ao Campo
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex-1 rounded-xl bg-primary py-3 text-xs font-black uppercase text-white shadow-lg shadow-primary/30 hover:opacity-95 cursor-pointer transition-all active:scale-[0.98]"
        >
          Definir no Campo
        </button>
      </div>
    </div>
  );
}
