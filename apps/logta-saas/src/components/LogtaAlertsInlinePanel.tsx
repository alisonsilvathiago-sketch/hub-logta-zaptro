import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, ArrowRight, Bell, ChevronLeft, ChevronRight, X } from 'lucide-react';

export type LogtaInlineAlertPriority = 'critical' | 'high' | 'medium' | 'low';

export type LogtaInlineAlert = {
  id: string;
  title: string;
  message: string;
  priority: LogtaInlineAlertPriority;
  actionPath: string;
  actionLabel: string;
  impacto?: string;
  recomendacao?: string;
};

const priorityStyles: Record<
  LogtaInlineAlertPriority,
  { border: string; bg: string; badge: string; icon: string }
> = {
  critical: {
    border: 'border-red-200',
    bg: 'bg-red-50/80',
    badge: 'bg-red-100 text-red-700',
    icon: 'text-red-600',
  },
  high: {
    border: 'border-amber-200',
    bg: 'bg-amber-50/80',
    badge: 'bg-amber-100 text-amber-800',
    icon: 'text-amber-600',
  },
  medium: {
    border: 'border-primary/25',
    bg: 'bg-primary/5',
    badge: 'bg-primary/10 text-primary',
    icon: 'text-primary',
  },
  low: {
    border: 'border-gray-200',
    bg: 'bg-gray-50/80',
    badge: 'bg-gray-100 text-gray-600',
    icon: 'text-gray-500',
  },
};

const priorityLabels: Record<LogtaInlineAlertPriority, string> = {
  critical: 'Crítico',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

type CardProps = {
  alert: LogtaInlineAlert;
  onDismiss: () => void;
  Icon?: LucideIcon;
};

function LogtaAlertInlineCard({ alert, onDismiss, Icon = AlertTriangle }: CardProps) {
  const navigate = useNavigate();
  const s = priorityStyles[alert.priority];

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 shadow-md ${s.border} ${s.bg}`}
      data-logta-operational-strip="active"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="rounded-lg bg-primary px-2 py-0.5 text-[9px] font-black uppercase text-white">IA ativa</span>
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        <span className={`rounded-lg px-2 py-0.5 text-[9px] font-black uppercase ${s.badge}`}>
          {priorityLabels[alert.priority]}
        </span>
        <span className="text-xs font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
          {alert.title} · <span className="font-medium text-gray-500">{alert.message}</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate(alert.actionPath)}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[9px] font-bold text-white hover:opacity-90 cursor-pointer"
        >
          <Icon size={12} />
          {alert.actionLabel}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <X size={12} />
          Dispensar
        </button>
      </div>
    </div>
  );
}

type PanelProps = {
  alerts: LogtaInlineAlert[];
  onDismiss: (id: string) => void;
  monitoringLabel?: string;
  iaLabel?: string;
  className?: string;
  getIcon?: (alert: LogtaInlineAlert) => LucideIcon;
};

/** ID do bloco de alertas no topo — use para scroll a partir de barras de monitoramento. */
export const LOGTA_PAGE_ALERTS_ID = 'logta-page-alerts';

function CarouselNavButton({
  direction,
  onClick,
  disabled,
  label,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:border-primary/30 hover:bg-gray-50 hover:text-primary disabled:pointer-events-none disabled:opacity-30"
    >
      <Icon size={20} strokeWidth={2.5} />
    </button>
  );
}

/** Alertas no topo da página — carrossel com setas (padrão Logta). */
export function LogtaAlertsInlinePanel({
  alerts,
  onDismiss,
  monitoringLabel,
  iaLabel = 'IA Logta',
  className = '',
  getIcon,
}: PanelProps) {
  const [index, setIndex] = useState(0);
  const alertIds = alerts.map((a) => a.id).join('|');

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, alerts.length - 1)));
  }, [alertIds, alerts.length]);

  if (alerts.length === 0) return null;

  const current = alerts[index] ?? alerts[0];
  const hasMultiple = alerts.length > 1;

  const goPrev = () => setIndex((i) => (i <= 0 ? alerts.length - 1 : i - 1));
  const goNext = () => setIndex((i) => (i >= alerts.length - 1 ? 0 : i + 1));

  const handleDismiss = (id: string) => {
    onDismiss(id);
    setIndex((i) => {
      const nextLen = alerts.length - 1;
      if (nextLen <= 0) return 0;
      return Math.min(i, nextLen - 1);
    });
  };

  return (
    <div id={LOGTA_PAGE_ALERTS_ID} className={`scroll-mt-4 space-y-3 py-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600" />
          <h3 className="logta-card-heading text-gray-900">Ações necessárias</h3>
          <span className="rounded-[14px] bg-primary px-3 py-1 text-[10px] font-black uppercase text-[#F5F5F5]">
            {alerts.length}
          </span>
          {iaLabel ? (
            <span className="text-[9px] font-bold uppercase text-gray-400">{iaLabel}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {hasMultiple ? (
            <span className="text-[10px] font-bold tabular-nums text-gray-500">
              {index + 1} / {alerts.length}
            </span>
          ) : null}
          {monitoringLabel ? (
            <p className="text-[10px] font-bold uppercase text-gray-400">{monitoringLabel}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-stretch gap-2 sm:gap-3">
        {hasMultiple ? (
          <CarouselNavButton direction="prev" onClick={goPrev} disabled={false} label="Aviso anterior" />
        ) : null}

        <div className="min-w-0 flex-1">
          <LogtaAlertInlineCard
            key={current.id}
            alert={current}
            onDismiss={() => handleDismiss(current.id)}
            Icon={getIcon?.(current)}
          />
        </div>

        {hasMultiple ? (
          <CarouselNavButton direction="next" onClick={goNext} disabled={false} label="Próximo aviso" />
        ) : null}
      </div>

      {hasMultiple ? (
        <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Indicadores de avisos">
          {alerts.map((alert, i) => (
            <button
              key={alert.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Aviso ${i + 1}: ${alert.title}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-primary' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
