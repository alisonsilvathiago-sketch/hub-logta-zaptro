import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Bell, MapPin, Navigation, Sparkles, Truck, X } from 'lucide-react';
import type { RoteirizacaoAlert } from '../types';

type Props = {
  alert: RoteirizacaoAlert;
  onClose: () => void;
  onDismiss: () => void;
  queueCount?: number;
};

const styles = {
  critical: { border: 'border-red-500/30', badge: 'bg-red-500/15 text-red-400', icon: 'text-red-500', glow: 'shadow-red-500/10' },
  high: { border: 'border-amber-500/30', badge: 'bg-amber-500/15 text-amber-400', icon: 'text-amber-500', glow: 'shadow-amber-500/10' },
  medium: { border: 'border-primary/30', badge: 'bg-primary/15 text-primary', icon: 'text-primary', glow: 'shadow-primary/10' },
  low: { border: 'border-neutral-700', badge: 'bg-neutral-800 text-neutral-400', icon: 'text-neutral-400', glow: 'shadow-black/20' },
};

const labels = { critical: 'Crítico', high: 'Alta', medium: 'Média', low: 'Baixa' };

export function RoteirizacaoAlertPopup({ alert, onClose, onDismiss, queueCount = 0 }: Props) {
  const navigate = useNavigate();
  const s = styles[alert.priority];

  const Icon =
    alert.category === 'rota' || alert.category === 'transito'
      ? MapPin
      : alert.category === 'motorista'
        ? Truck
        : alert.category === 'ia'
          ? Sparkles
          : alert.category === 'entrega'
            ? Navigation
            : AlertTriangle;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} aria-hidden />
      <div
        className={`relative w-full max-w-lg rounded-[32px] border bg-[#18191B] p-8 text-white shadow-2xl animate-in zoom-in duration-200 ${s.border} ${s.glow}`}
        role="alertdialog"
      >
        <button type="button" onClick={onClose} className="absolute right-6 top-6 rounded-xl p-2 text-neutral-500 hover:bg-neutral-800 hover:text-white" aria-label="Fechar">
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
                <Bell size={10} /> IA de Rotas
              </span>
            </div>
            <h3 className="text-lg font-bold leading-snug">{alert.title}</h3>
          </div>
        </div>

        <p className="mb-6 text-sm font-medium leading-relaxed text-neutral-300">{alert.message}</p>

        {(alert.impacto || alert.impactoFinanceiro || alert.recomendacao) && (
          <div className="mb-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            {alert.impacto ? (
              <div>
                <p className="text-[10px] font-black uppercase text-neutral-500">Impacto operacional</p>
                <p className="mt-1 text-sm font-bold">{alert.impacto}</p>
              </div>
            ) : null}
            {alert.impactoFinanceiro ? (
              <div>
                <p className="text-[10px] font-black uppercase text-amber-400">Impacto financeiro</p>
                <p className="mt-1 text-sm font-bold">{alert.impactoFinanceiro}</p>
              </div>
            ) : null}
            {alert.recomendacao ? (
              <div>
                <p className="text-[10px] font-black uppercase text-primary">Ação recomendada</p>
                <p className="mt-1 text-xs text-neutral-300">{alert.recomendacao}</p>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(alert.actionPath);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-4 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90"
          >
            {alert.actionLabel}
            <ArrowRight size={16} />
          </button>
          <button type="button" onClick={onDismiss} className="rounded-xl border border-neutral-700 px-6 py-4 text-xs font-bold text-neutral-400 hover:bg-neutral-800">
            Dispensar
          </button>
        </div>

        {queueCount > 1 ? (
          <p className="mt-4 text-center text-[10px] font-bold uppercase text-neutral-500">+{queueCount - 1} na fila</p>
        ) : null}
      </div>
    </div>
  );
}
