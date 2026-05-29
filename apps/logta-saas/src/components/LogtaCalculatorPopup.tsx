import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calculator, Fuel, Gauge, Route, Share2, TrendingUp, X } from 'lucide-react';
import { showToast } from './Toast';
import { LogtaCalcKeypad } from './LogtaCalcKeypad';
import {
  appendCalculatorSnapshot,
  calculatorPublicUrl,
  loadCalculatorHistory,
  type CalcTabId,
  type CalculatorSnapshot,
} from '../lib/logtaCalculatorStorage';

type Props = {
  open: boolean;
  onClose: () => void;
  createdBy?: string;
};

const TABS: { id: CalcTabId; label: string; icon: typeof Calculator }[] = [
  { id: 'frete', label: 'Frete', icon: Route },
  { id: 'lucro', label: 'Lucro', icon: TrendingUp },
  { id: 'combustivel', label: 'Combustível', icon: Fuel },
  { id: 'operacional', label: 'Operacional', icon: Gauge },
];

function parseExpression(v: string): number {
  try {
    let sanitized = String(v)
      .replace(/\./g, '')
      .replace(/,/g, '.')
      .replace(/x/g, '*')
      .replace(/X/g, '*')
      .replace(/%/g, '/100');

    const sanitizedClean = sanitized.replace(/[^0-9+\-*/().\s]/g, '');
    const result = new Function(`return (${sanitizedClean})`)();
    return Number.isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

function parseNum(v: string) {
  return parseExpression(v);
}

function formatNum(n: number) {
  if (!Number.isFinite(n) || n === 0) return '0';
  const rounded = Math.round(n * 100) / 100;
  const [intPart, dec] = String(rounded).split('.');
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec ? `${withDots},${dec}` : withDots;
}

type FieldId = 'receita' | 'custos' | 'total';

export function LogtaCalculatorPopup({ open, onClose, createdBy }: Props) {
  const [tab, setTab] = useState<CalcTabId>('frete');
  const [history, setHistory] = useState<CalculatorSnapshot[]>(() => loadCalculatorHistory());
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [display, setDisplay] = useState('0');
  const [activeField, setActiveField] = useState<FieldId>('receita');

  const [freteValor, setFreteValor] = useState('12.500');
  const [freteCustos, setFreteCustos] = useState('3.300');
  const [lucroReceita, setLucroReceita] = useState('45.000');
  const [lucroCustos, setLucroCustos] = useState('38.200');
  const [combTotal, setCombTotal] = useState('8.420');
  const [opTotal, setOpTotal] = useState('393.600');

  const fields = useMemo(() => {
    if (tab === 'frete') {
      return [
        { id: 'receita' as const, label: 'Receita frete' },
        { id: 'custos' as const, label: 'Custos' },
      ];
    }
    if (tab === 'lucro') {
      return [
        { id: 'receita' as const, label: 'Receita' },
        { id: 'custos' as const, label: 'Custos' },
      ];
    }
    if (tab === 'combustivel') {
      return [{ id: 'total' as const, label: 'Combustível' }];
    }
    return [{ id: 'total' as const, label: 'Operacional' }];
  }, [tab]);

  useEffect(() => {
    setActiveField(fields[0]?.id ?? 'total');
    setDisplay('0');
  }, [tab, fields]);

  const getSetter = useCallback(
    (fieldId: FieldId): [string, (v: string) => void] => {
      if (tab === 'frete') {
        return fieldId === 'receita' ? [freteValor, setFreteValor] : [freteCustos, setFreteCustos];
      }
      if (tab === 'lucro') {
        return fieldId === 'receita' ? [lucroReceita, setLucroReceita] : [lucroCustos, setLucroCustos];
      }
      if (tab === 'combustivel') return [combTotal, setCombTotal];
      return [opTotal, setOpTotal];
    },
    [tab, freteValor, freteCustos, lucroReceita, lucroCustos, combTotal, opTotal],
  );

  const applyDisplay = useCallback(() => {
    const amount = parseNum(display);
    const [, set] = getSetter(activeField);
    set(formatNum(amount));
    setDisplay('0');
    showToast('success', 'Valor inserido no campo.', 'Calculadora');
  }, [activeField, display, getSetter]);

  const sumToField = useCallback(() => {
    const amount = parseNum(display);
    if (amount === 0) return;
    const [current, set] = getSetter(activeField);
    const next = parseNum(current) + amount;
    set(formatNum(next));
    setDisplay('0');
    showToast('success', `Somado: R$ ${amount.toLocaleString('pt-BR')}`, 'Calculadora');
  }, [activeField, display, getSetter]);

  const computed = useMemo(() => {
    if (tab === 'frete') {
      const receita = parseNum(freteValor);
      const custos = parseNum(freteCustos);
      const margem = receita - custos;
      return {
        lines: [
          { label: 'Receita frete', value: receita },
          { label: 'Custos', value: custos },
          { label: 'Margem', value: margem },
        ],
        total: margem,
        title: 'Simulação de frete',
      };
    }
    if (tab === 'lucro') {
      const r = parseNum(lucroReceita);
      const c = parseNum(lucroCustos);
      const lucro = r - c;
      return {
        lines: [
          { label: 'Receita', value: r },
          { label: 'Custos', value: c },
          { label: 'Lucro', value: lucro },
        ],
        total: lucro,
        title: 'Lucro operacional',
      };
    }
    if (tab === 'combustivel') {
      const t = parseNum(combTotal);
      return { lines: [{ label: 'Combustível', value: t }], total: t, title: 'Combustível' };
    }
    const t = parseNum(opTotal);
    return { lines: [{ label: 'Custo operacional', value: t }], total: t, title: 'Operacional' };
  }, [tab, freteValor, freteCustos, lucroReceita, lucroCustos, combTotal, opTotal]);

  const fieldValues = useMemo(() => {
    const map: Record<string, string> = {};
    fields.forEach((f) => {
      const [val] = getSetter(f.id as FieldId);
      map[f.id] = val;
    });
    return map;
  }, [fields, getSetter, freteValor, freteCustos, lucroReceita, lucroCustos, combTotal, opTotal]);

  if (!open) return null;

  const handleSave = () => {
    appendCalculatorSnapshot({
      title: computed.title,
      tab,
      lines: computed.lines,
      total: computed.total,
      createdBy,
    });
    setHistory(loadCalculatorHistory());
    showToast('success', 'Cálculo salvo no histórico.', 'Calculadora Logta');
  };

  const handleShare = async () => {
    let url = shareUrl;
    if (!url) {
      const entry = appendCalculatorSnapshot({
        title: computed.title,
        tab,
        lines: computed.lines,
        total: computed.total,
        createdBy,
      });
      url = calculatorPublicUrl(entry.token);
      setShareUrl(url);
      setHistory(loadCalculatorHistory());
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('success', 'Link público copiado com sucesso!', 'Compartilhar');
    } catch {
      showToast('info', url, 'Link do cálculo');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer" aria-label="Fechar" onClick={onClose} />
      
      {/* Landscape Container: max-w-4xl for Landscape Orientation */}
      <div className="relative flex max-h-[95dvh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-neutral-800 bg-[#18191B] text-white shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Calculator size={20} className="text-primary" />
            <span className="text-sm font-black">Calculadora Logta (Modo Paisagem)</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Modular Category Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-neutral-800 px-6 py-3.5 bg-neutral-900/10">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase transition-all cursor-pointer ${
                  tab === t.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* 2-Column Landscape Content layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch scrollbar-hide">
          
          {/* Left Column: Keypad Panel */}
          <div className="flex flex-col justify-start">
            <LogtaCalcKeypad
              display={display}
              fields={fields}
              activeFieldId={activeField}
              onActiveFieldChange={(id) => setActiveField(id as FieldId)}
              onDisplayChange={setDisplay}
              onApply={applyDisplay}
              onSum={sumToField}
            />
          </div>

          {/* Right Column: Calculations, Summary & History */}
          <div className="flex flex-col justify-between gap-6">
            <div className="space-y-4">
              
              {/* Field values summary */}
              <div className="space-y-2 rounded-2xl border border-neutral-800 bg-neutral-900/35 p-4 text-left">
                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2">Valores Atuais dos Campos</p>
                <div className="space-y-2">
                  {fields.map((f) => (
                    <div key={f.id} className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500 font-bold">{f.label}</span>
                      <span className="font-extrabold tabular-nums text-white bg-neutral-950/80 px-3 py-1.5 rounded-xl border border-neutral-800/80">
                        R$ {parseNum(fieldValues[f.id] ?? '0').toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulation Result */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-left">
                <p className="text-[10px] font-black uppercase tracking-wider text-primary mb-3">Resumo Financeiro</p>
                {computed.lines.map((l) => (
                  <div key={l.label} className="mb-2.5 flex justify-between text-xs items-center">
                    <span className="text-neutral-400 font-medium">{l.label}</span>
                    <span className="font-bold text-white">R$ {l.value.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
                <div className="mt-4 flex justify-between border-t border-primary/20 pt-4 items-center">
                  <span className="text-[10px] font-black uppercase text-primary">Resultado Final</span>
                  <span className="text-xl font-black text-primary">R$ {computed.total.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>

            {/* Calculations History & Action Panel */}
            <div className="space-y-4 text-left">
              {history.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase text-neutral-500 tracking-wider">Histórico de Simulações</p>
                  <div className="max-h-24 space-y-2 overflow-y-auto scrollbar-hide">
                    {history.slice(0, 3).map((h) => (
                      <div key={h.id} className="rounded-xl border border-neutral-800/60 bg-neutral-900/35 px-4 py-2.5 text-[11px] flex justify-between items-center">
                        <div>
                          <p className="font-bold text-neutral-200">{h.title}</p>
                          <p className="text-[9px] text-neutral-500 font-medium">{new Date(((h as any).timestamp) || Date.now()).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <p className="font-extrabold text-primary">R$ {h.total.toLocaleString('pt-BR')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-neutral-800/60 pt-4 bg-transparent">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 rounded-2xl bg-neutral-800 py-3.5 text-xs font-black uppercase text-neutral-200 hover:bg-neutral-700/80 hover:text-white transition-all active:scale-[0.98] border border-neutral-700/50 cursor-pointer text-center"
                >
                  Salvar Cálculo
                </button>
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-xs font-black uppercase text-white hover:bg-primary/95 transition-all shadow-lg shadow-primary/10 active:scale-[0.98] cursor-pointer text-center"
                >
                  <Share2 size={13} strokeWidth={2.5} /> Compartilhar
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
