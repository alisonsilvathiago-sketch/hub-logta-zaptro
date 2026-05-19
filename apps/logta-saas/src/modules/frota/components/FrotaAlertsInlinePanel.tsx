import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Bell, Fuel, FileText, Sparkles, Truck, Wrench, X } from 'lucide-react';
import { useFrotaIntelligence } from '../context/FrotaIntelligenceContext';
import type { FrotaAlert } from '../types';

const priorityStyles = {
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

const priorityLabels = { critical: 'Crítico', high: 'Alta', medium: 'Média', low: 'Baixa' };

function alertIcon(alert: FrotaAlert) {
  if (alert.category === 'combustivel') return Fuel;
  if (alert.category === 'manutencao') return Wrench;
  if (alert.category === 'ia') return Sparkles;
  if (alert.category === 'documento' || alert.category === 'ipva' || alert.category === 'licenciamento') {
    return FileText;
  }
  return Truck;
}

function FrotaAlertInlineCard({
  alert,
  onDismiss,
}: {
  alert: FrotaAlert;
  onDismiss: () => void;
}) {
  const navigate = useNavigate();
  const s = priorityStyles[alert.priority];
  const Icon = alertIcon(alert);

  return (
    <div className={`rounded-2xl border p-4 ${s.border} ${s.bg}`}>
      <div className="flex gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${s.icon}`}>
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-lg px-2 py-0.5 text-[9px] font-black uppercase ${s.badge}`}>
              {priorityLabels[alert.priority]}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-gray-400">
              <Bell size={10} /> IA Frota
            </span>
            {alert.vehiclePlate ? (
              <span className="text-[9px] font-bold uppercase text-gray-500">{alert.vehiclePlate}</span>
            ) : null}
          </div>
          <h4 className="text-sm font-bold text-gray-900">{alert.title}</h4>
          <p className="mt-1 text-xs font-medium leading-relaxed text-gray-600">{alert.message}</p>
          {alert.impacto ? (
            <p className="mt-2 text-[11px] font-medium text-gray-500">
              <strong className="text-gray-700">Impacto:</strong> {alert.impacto}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(alert.actionPath)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[10px] font-bold uppercase text-white hover:opacity-90"
            >
              {alert.actionLabel} <ArrowRight size={12} />
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[10px] font-bold uppercase text-gray-600 hover:bg-gray-50"
            >
              Dispensar
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700"
          aria-label="Dispensar alerta"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/** Alertas da frota dentro da página — sem popup centralizado. */
export function FrotaAlertsInlinePanel({ className = '' }: { className?: string }) {
  const { activeAlerts, dismissAlert, monitoring } = useFrotaIntelligence();

  if (activeAlerts.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600" />
          <h3 className="logta-card-heading text-gray-900">Ações necessárias</h3>
          <span className="rounded-[14px] bg-primary px-3 py-1 text-[10px] font-black uppercase text-[#F5F5F5]">
            {activeAlerts.length}
          </span>
        </div>
        <p className="text-[10px] font-bold uppercase text-gray-400">{monitoring.label}</p>
      </div>
      <div className="space-y-3">
        {activeAlerts.map((alert) => (
          <FrotaAlertInlineCard key={alert.id} alert={alert} onDismiss={() => dismissAlert(alert.id)} />
        ))}
      </div>
    </div>
  );
}
