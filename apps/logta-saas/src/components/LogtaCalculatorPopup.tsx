import React, { useMemo, useState } from 'react';
import { Calculator, Fuel, Gauge, Route, Share2, TrendingUp, X } from 'lucide-react';
import { showToast } from './Toast';
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

function parseNum(v: string) {
  const n = parseFloat(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function LogtaCalculatorPopup({ open, onClose, createdBy }: Props) {
  const [tab, setTab] = useState<CalcTabId>('frete');
  const [history, setHistory] = useState<CalculatorSnapshot[]>(() => loadCalculatorHistory());
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const [freteValor, setFreteValor] = useState('12500');
  const [freteCustos, setFreteCustos] = useState('3300');
  const [lucroReceita, setLucroReceita] = useState('45000');
  const [lucroCustos, setLucroCustos] = useState('38200');
  const [combTotal, setCombTotal] = useState('8420');
  const [opTotal, setOpTotal] = useState('393600');

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
      showToast('success', 'Link público copiado. Quem tiver o link vê este cálculo (sem acesso ao sistema).', 'Compartilhar');
    } catch {
      showToast('info', url, 'Link do cálculo');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-sm" aria-label="Fechar" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-neutral-800 bg-[#18191B] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Calculator size={20} className="text-primary" />
            <span className="text-sm font-black">Calculadora Logta</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-800">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 border-b border-neutral-800 px-4 py-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold uppercase ${
                  tab === t.id ? 'bg-primary text-white' : 'bg-neutral-900 text-neutral-400'
                }`}
              >
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {tab === 'frete' && (
            <>
              <input value={freteValor} onChange={(e) => setFreteValor(e.target.value)} placeholder="Receita R$" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold" />
              <input value={freteCustos} onChange={(e) => setFreteCustos(e.target.value)} placeholder="Custos R$" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold" />
            </>
          )}
          {tab === 'lucro' && (
            <>
              <input value={lucroReceita} onChange={(e) => setLucroReceita(e.target.value)} placeholder="Receita R$" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold" />
              <input value={lucroCustos} onChange={(e) => setLucroCustos(e.target.value)} placeholder="Custos R$" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold" />
            </>
          )}
          {tab === 'combustivel' && (
            <input value={combTotal} onChange={(e) => setCombTotal(e.target.value)} placeholder="Total combustível R$" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold" />
          )}
          {tab === 'operacional' && (
            <input value={opTotal} onChange={(e) => setOpTotal(e.target.value)} placeholder="Custo operacional R$" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold" />
          )}
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
            {computed.lines.map((l) => (
              <div key={l.label} className="mb-2 flex justify-between text-xs">
                <span className="text-neutral-400">{l.label}</span>
                <span className="font-bold">R$ {l.value.toLocaleString('pt-BR')}</span>
              </div>
            ))}
            <div className="mt-3 flex justify-between border-t border-primary/20 pt-3">
              <span className="text-[10px] font-black uppercase text-primary">Total</span>
              <span className="text-lg font-black text-primary">R$ {computed.total.toLocaleString('pt-BR')}</span>
            </div>
          </div>
          {history.length > 0 ? (
            <div>
              <p className="mb-2 text-[10px] font-black uppercase text-neutral-500">Histórico</p>
              <div className="max-h-28 space-y-2 overflow-y-auto">
                {history.slice(0, 5).map((h) => (
                  <div key={h.id} className="rounded-xl bg-neutral-900 px-3 py-2 text-[10px]">
                    <p className="font-bold">{h.title}</p>
                    <p className="text-neutral-500">R$ {h.total.toLocaleString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex gap-2 border-t border-neutral-800 p-4">
          <button type="button" onClick={handleSave} className="flex-1 rounded-xl bg-neutral-800 py-3 text-xs font-bold">
            Salvar
          </button>
          <button type="button" onClick={() => void handleShare()} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary py-3 text-xs font-bold">
            <Share2 size={14} /> Compartilhar
          </button>
        </div>
      </div>
    </div>
  );
}