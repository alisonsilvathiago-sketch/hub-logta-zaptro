import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Bell, Sparkles } from 'lucide-react';
import { useFretesIntelligence } from '../context/FretesIntelligenceContext';

export function FretesMonitoringBar() {
  const { monitoring, activeAlerts, lastScanAt, openPopup } = useFretesIntelligence();

  if (monitoring.total === 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-bold text-green-800">Monitoramento logístico ativo — operação estável</span>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-green-700">
          <Sparkles size={12} /> IA Logta
        </span>
      </div>
    );
  }

  const nivelClass =
    monitoring.nivel === 'critico'
      ? 'border-red-200 bg-red-50/90'
      : monitoring.nivel === 'atencao'
        ? 'border-amber-200 bg-amber-50/90'
        : 'border-primary/20 bg-primary/5';

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${nivelClass}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        <span className="text-xs font-bold text-gray-900">
          {monitoring.critical > 0
            ? `${monitoring.critical} alerta(s) crítico(s) · ${monitoring.total} ativos`
            : `${monitoring.total} alerta(s) logístico(s)`}
        </span>
        {lastScanAt ? (
          <span className="text-[10px] font-medium text-gray-500">
            {lastScanAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : null}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => activeAlerts[0] && openPopup(activeAlerts[0])}
          className="hub-premium-pill primary"
          style={{ padding: '8px 14px', fontSize: '10px' }}
        >
          <Bell size={14} /> Ver alerta
        </button>
        <Link to="/fretes/central" className="hub-premium-pill secondary" style={{ padding: '8px 14px', fontSize: '10px' }}>
          <Activity size={14} /> Central
        </Link>
      </div>
    </div>
  );
}
