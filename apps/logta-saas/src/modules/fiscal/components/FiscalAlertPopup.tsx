import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Bell, FileCode, FileText, Globe, Sparkles, Truck, X } from 'lucide-react';
import type { FiscalAlert } from '../types';

type Props = {
  alert: FiscalAlert;
  onClose: () => void;
  onDismiss: () => void;
};

const styles = {
  critical: { border: 'border-red-500/30', badge: 'bg-red-500/15 text-red-400', icon: 'text-red-500' },
  high: { border: 'border-amber-500/30', badge: 'bg-amber-500/15 text-amber-400', icon: 'text-amber-500' },
  medium: { border: 'border-primary/30', badge: 'bg-primary/15 text-primary', icon: 'text-primary' },
  low: { border: 'border-neutral-700', badge: 'bg-neutral-800 text-neutral-400', icon: 'text-neutral-400' },
};

const labels = { critical: 'Crítico', high: 'Alta', medium: 'Média', low: 'Baixa' };

export function FiscalAlertPopup({ alert, onClose, onDismiss }: Props) {
  const navigate = useNavigate();
  const s = styles[alert.priority];
  const Icon =
    alert.category === 'sefaz'
      ? Globe
      : alert.category === 'mdfe' || alert.category === 'manifesto'
        ? Truck
        : alert.category === 'ia'
          ? Sparkles
          : alert.category === 'certificado'
            ? FileCode
            : alert.category === 'cte'
              ? FileText
              : AlertTriangle;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} aria-hidden />
      <div
        className={`relative w-full max-w-lg rounded-[32px] border bg-[#18191B] p-8 text-white shadow-2xl animate-in zoom-in duration-200 ${s.border}`}
        role="alertdialog"
      >
        <button type="button" onClick={onClose} className="absolute right-6 top-6 rounded-xl p-2 text-neutral-500 hover:bg-neutral-800 hover:text-white">
          <X size={18} />
        </button>
        <div className="mb-6 flex items-start gap-4 pr-8">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 ${s.icon}`}>
            <Icon size={26} />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${s.badge}`}>{labels[alert.priority]}</span>
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-neutral-500">
                <Bell size={10} /> IA Fiscal
              </span>
            </div>
            <h3 className="text-lg font-bold leading-snug">{alert.title}</h3>
          </div>
        </div>
        <p className="mb-6 text-sm font-medium leading-relaxed text-neutral-300">{alert.message}</p>
        {alert.prazo ? <p className="mb-4 text-xs font-bold text-amber-400">Prazo: {alert.prazo}</p> : null}
        {alert.impacto ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-neutral-400">
            <strong className="text-white">Impacto operacional:</strong> {alert.impacto}
          </div>
        ) : null}
        {alert.impactoFinanceiro ? (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-neutral-400">
            <strong className="text-white">Impacto financeiro:</strong> {alert.impactoFinanceiro}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              navigate(alert.actionPath);
              onClose();
            }}
            className="hub-premium-pill primary flex-1 justify-center"
          >
            {alert.actionLabel} <ArrowRight size={14} />
          </button>
          <button type="button" onClick={onDismiss} className="hub-premium-pill secondary">
            Dispensar
          </button>
        </div>
      </div>
    </div>
  );
}
