import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import type { FinanceiroAlert } from '../financeiroIntelligence';

type FinanceiroAlertPopupProps = {
  alert: FinanceiroAlert;
  onClose: () => void;
  onDismiss: () => void;
  queueCount?: number;
};

const priorityStyles = {
  critical: {
    border: 'border-red-500/30',
    badge: 'bg-red-500/15 text-red-400',
    icon: 'text-red-500',
    glow: 'shadow-red-500/10',
  },
  high: {
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/15 text-amber-400',
    icon: 'text-amber-500',
    glow: 'shadow-amber-500/10',
  },
  medium: {
    border: 'border-primary/30',
    badge: 'bg-primary/15 text-primary',
    icon: 'text-primary',
    glow: 'shadow-primary/10',
  },
  low: {
    border: 'border-neutral-700',
    badge: 'bg-neutral-800 text-neutral-400',
    icon: 'text-neutral-400',
    glow: 'shadow-black/20',
  },
};

const priorityLabel = {
  critical: 'Crítico',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export function FinanceiroAlertPopup({ alert, onClose, onDismiss, queueCount = 0 }: FinanceiroAlertPopupProps) {
  const navigate = useNavigate();
  const styles = priorityStyles[alert.priority];

  const handleAction = () => {
    onClose();
    navigate(alert.actionPath);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative w-full max-w-lg animate-in zoom-in duration-200 rounded-[32px] border bg-[#18191B] p-8 text-white shadow-2xl ${styles.border} ${styles.glow}`}
        role="alertdialog"
        aria-labelledby="financeiro-alert-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 rounded-xl p-2 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        <div className="mb-6 flex items-start gap-4 pr-8">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 ${styles.icon}`}>
            {alert.category === 'recebimento' ? (
              <TrendingUp size={26} />
            ) : alert.category === 'pagamento' || alert.category === 'fornecedor' ? (
              <TrendingDown size={26} />
            ) : alert.category === 'ia' ? (
              <Sparkles size={26} />
            ) : (
              <AlertTriangle size={26} />
            )}
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-normal ${styles.badge}`}>
                {priorityLabel[alert.priority]}
              </span>
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-neutral-500">
                <Bell size={10} /> Monitoramento IA
              </span>
            </div>
            <h3 id="financeiro-alert-title" className="text-lg font-bold leading-snug text-white">
              {alert.title}
            </h3>
          </div>
        </div>

        <p className="mb-6 text-sm font-medium leading-relaxed text-neutral-300">{alert.message}</p>

        {(alert.impacto || alert.recomendacao || alert.historico) && (
          <div className="mb-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            {alert.impacto ? (
              <div>
                <p className="text-[10px] font-black uppercase tracking-normal text-neutral-500">Impacto financeiro</p>
                <p className="mt-1 text-sm font-bold text-white">{alert.impacto}</p>
              </div>
            ) : null}
            {alert.recomendacao ? (
              <div>
                <p className="text-[10px] font-black uppercase tracking-normal text-primary">Ação recomendada</p>
                <p className="mt-1 text-xs font-medium text-neutral-300">{alert.recomendacao}</p>
              </div>
            ) : null}
            {alert.historico ? (
              <p className="text-[10px] font-medium text-neutral-500">{alert.historico}</p>
            ) : null}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleAction}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-4 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90"
          >
            {alert.actionLabel}
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl border border-neutral-700 px-6 py-4 text-xs font-bold text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            Dispensar
          </button>
        </div>

        {queueCount > 1 ? (
          <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-normal text-neutral-500">
            +{queueCount - 1} alerta(s) na fila · Central financeira
          </p>
        ) : null}
      </div>
    </div>
  );
}
