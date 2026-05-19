import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { useOperationalData } from '../contexts/OperationalDataContext';
import { buildGlobalOperationalAlerts, getGlobalMonitoringSummary } from '../lib/logtaGlobalIntelligence';

export function LogtaGlobalOperationalStrip() {
  const { loading, error, shipments, deliveries, motoristas, vehicles, transactions, lastSyncAt, refresh, hasBackend } =
    useOperationalData();

  const alerts = useMemo(
    () => buildGlobalOperationalAlerts({ shipments, deliveries, motoristas, vehicles, transactions }),
    [shipments, deliveries, motoristas, vehicles, transactions],
  );
  const summary = useMemo(() => getGlobalMonitoringSummary(alerts), [alerts]);
  const top = alerts[0];

  if (!hasBackend) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5">
        <span className="text-[11px] font-bold text-amber-800">
          Configure VITE_SUPABASE_URL e chave no .env para dados reais em tempo real.
        </span>
      </div>
    );
  }

  if (loading && shipments.length === 0) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2.5">
        <RefreshCw size={14} className="animate-spin text-primary" />
        <span className="text-[11px] font-bold text-gray-600">Sincronizando ecossistema operacional…</span>
      </div>
    );
  }

  const nivelClass =
    summary.nivel === 'critico'
      ? 'border-red-200 bg-red-50/90'
      : summary.nivel === 'atencao'
        ? 'border-amber-200 bg-amber-50/90'
        : 'border-green-200 bg-green-50/80';

  return (
    <div
      className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 shadow-md ${nivelClass}`}
      data-logta-operational-strip="active"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="rounded-lg bg-primary px-2 py-0.5 text-[9px] font-black uppercase text-white">IA ativa</span>
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        <span className="text-xs font-bold text-gray-900">
          {summary.total === 0
            ? 'Ecossistema operacional sincronizado — sem alertas críticos'
            : summary.critical > 0
              ? `${summary.critical} crítico(s) · ${summary.total} alertas ativos`
              : `${summary.total} alerta(s) no ecossistema`}
        </span>
        {lastSyncAt ? (
          <span className="text-[9px] font-medium text-gray-500">
            {lastSyncAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : null}
        {error ? <span className="text-[9px] font-bold text-red-600">{error}</span> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {top ? (
          <Link
            to={top.actionPath}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[9px] font-bold text-white hover:opacity-90"
          >
            <AlertTriangle size={12} />
            {top.module}: {top.actionLabel}
          </Link>
        ) : null}
        <Link to="/fretes/central" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-gray-700 hover:bg-gray-50">
          <Activity size={12} /> Fretes
        </Link>
        <Link to="/financeiro/central" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-gray-700 hover:bg-gray-50">
          <Sparkles size={12} /> Financeiro
        </Link>
        <button
          type="button"
          onClick={() => refresh()}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={12} /> Sync
        </button>
      </div>
    </div>
  );
}
