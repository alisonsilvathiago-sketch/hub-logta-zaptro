import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, RefreshCw, Sparkles, X, DollarSign } from 'lucide-react';
import { useOperationalData } from '../contexts/OperationalDataContext';
import { buildGlobalOperationalAlerts, getGlobalMonitoringSummary } from '../lib/logtaGlobalIntelligence';

export function LogtaGlobalOperationalStrip() {
  const { loading, error, shipments, deliveries, motoristas, vehicles, transactions, lastSyncAt, refresh, hasBackend } =
    useOperationalData();

  // Estado para armazenar alertas que o usuário já visualizou/dispensou
  const [seenAlertIds, setSeenAlertIds] = React.useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('logta_seen_alert_ids') || '[]');
    } catch {
      return [];
    }
  });

  // Filtra os alertas removendo os já visualizados
  const alerts = useMemo(() => {
    const allAlerts = buildGlobalOperationalAlerts({ shipments, deliveries, motoristas, vehicles, transactions });
    return allAlerts.filter((a) => !seenAlertIds.includes(a.id));
  }, [shipments, deliveries, motoristas, vehicles, transactions, seenAlertIds]);

  const summary = useMemo(() => getGlobalMonitoringSummary(alerts), [alerts]);
  const top = alerts[0];

  // Função para marcar um alerta como visto e persistir no localStorage
  const handleMarkAsSeen = (alertId: string) => {
    const nextSeen = [...seenAlertIds, alertId];
    setSeenAlertIds(nextSeen);
    localStorage.setItem('logta_seen_alert_ids', JSON.stringify(nextSeen));
  };

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

  // Oculta completamente a barra caso não existam alertas ativos
  if (alerts.length === 0) {
    return null;
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
            onClick={() => handleMarkAsSeen(top.id)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[9px] font-bold text-white hover:opacity-90"
          >
            {top.module === 'financeiro' ? (
              <DollarSign size={12} className="text-white" />
            ) : (
              <AlertTriangle size={12} />
            )}
            {top.module}: {top.actionLabel}
          </Link>
        ) : null}
        <Link to="/fretes/central" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-gray-700 hover:bg-gray-50">
          <Activity size={12} /> Fretes
        </Link>
        <Link to="/financeiro/central" className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[9px] font-bold text-white hover:opacity-90">
          <DollarSign size={12} className="text-white" /> Financeiro
        </Link>
        <button
          type="button"
          onClick={() => refresh()}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={12} /> Sync
        </button>
        {top ? (
          <button
            type="button"
            onClick={() => handleMarkAsSeen(top.id)}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            title="Dispensar alerta"
          >
            <X size={12} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
