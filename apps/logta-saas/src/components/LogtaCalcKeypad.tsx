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
  return raw;
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
    if (key === ',') {
      if (display.includes(',')) return;
      onDisplayChange(display === '0' || display === '' ? '0,' : `${display},`);
      return;
    }
    if (display === '0') onDisplayChange(key);
    else onDisplayChange(display + key);
  };

  const clearAll = () => onDisplayChange('0');

  const backspace = () => {
    if (display.length <= 1) onDisplayChange('0');
    else onDisplayChange(display.slice(0, -1));
  };

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', ','] as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950">
      {/* Visor */}
      <div className="border-b border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 px-4 py-5 text-right">
        <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">Digite ou some</p>
        <p className="mt-1 font-mono text-3xl font-black tabular-nums tracking-tight text-white">
          {formatDisplayLabel(display)}
        </p>
      </div>

      {/* Campos ativos */}
      {fields.length > 1 ? (
        <div className="flex flex-wrap gap-1.5 border-b border-neutral-800 p-3">
          {fields.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onActiveFieldChange(f.id)}
              className={`rounded-xl px-3 py-2 text-[10px] font-bold uppercase transition-all ${
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
        <button
          type="button"
          onClick={clearAll}
          className="col-span-1 rounded-xl bg-neutral-800 py-3.5 text-xs font-black uppercase text-amber-400 hover:bg-neutral-700"
        >
          C
        </button>
        <button
          type="button"
          onClick={backspace}
          className="col-span-1 flex items-center justify-center rounded-xl bg-neutral-800 py-3.5 text-neutral-300 hover:bg-neutral-700"
          aria-label="Apagar"
        >
          <Delete size={18} />
        </button>
        <button
          type="button"
          onClick={onSum}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-primary/20 py-3.5 text-xs font-black uppercase text-primary hover:bg-primary/30"
        >
          <Plus size={16} strokeWidth={3} /> Somar
        </button>

        {keys.slice(0, 9).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => append(k)}
            className="rounded-xl bg-neutral-900 py-4 text-lg font-black text-white shadow-sm hover:bg-neutral-800 active:scale-95"
          >
            {k}
          </button>
        ))}

        <button
          type="button"
          onClick={() => append('0')}
          className="col-span-2 rounded-xl bg-neutral-900 py-4 text-lg font-black text-white shadow-sm hover:bg-neutral-800 active:scale-95"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => append(',')}
          className="rounded-xl bg-neutral-900 py-4 text-lg font-black text-white shadow-sm hover:bg-neutral-800 active:scale-95"
        >
          ,
        </button>

        <button
          type="button"
          onClick={onApply}
          className="col-span-4 rounded-xl bg-primary py-3.5 text-sm font-black uppercase text-white shadow-lg shadow-primary/30 hover:opacity-90 active:scale-[0.99]"
        >
          Inserir valor
        </button>
      </div>
    </div>
  );
}
