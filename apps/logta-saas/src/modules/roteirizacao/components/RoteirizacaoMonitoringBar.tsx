import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Bell, Sparkles } from 'lucide-react';
import { LOGTA_PAGE_ALERTS_ID } from '../../../components/LogtaAlertsInlinePanel';
import { useRoteirizacaoIntelligence } from '../context/RoteirizacaoIntelligenceContext';

function scrollToPageAlerts() {
  document.getElementById(LOGTA_PAGE_ALERTS_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function RoteirizacaoMonitoringBar() {
  const { monitoring, lastScanAt } = useRoteirizacaoIntelligence();

  if (monitoring.total === 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-green-200 bg-green-50/80 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="text-[11px] font-bold text-green-800">Rotas monitoradas — operação estável</span>
        </div>
        <span className="flex items-center gap-1 text-[9px] font-black uppercase text-green-700">
          <Sparkles size={11} /> IA Rotas
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
    <div className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 ${nivelClass}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="text-[11px] font-bold text-gray-900">
          {monitoring.critical > 0
            ? `${monitoring.critical} crítico(s) · ${monitoring.total} alertas`
            : `${monitoring.total} alerta(s) de rota`}
        </span>
        {lastScanAt ? (
          <span className="text-[9px] font-medium text-gray-500">
            {lastScanAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : null}
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={scrollToPageAlerts}
          className="rounded-lg bg-primary px-2.5 py-1.5 text-[9px] font-bold text-white hover:opacity-90"
        >
          <Bell size={12} className="inline mr-1" />
          Ver alertas
        </button>
        <Link to="/roteirizacao/eficiencia" className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-gray-700 hover:bg-gray-50">
          <Activity size={12} className="inline mr-1" />
          KPIs
        </Link>
      </div>
    </div>
  );
}
