import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Clock,
  FileCode,
  FileText,
  Globe,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useFiscalIntelligence } from '../context/FiscalIntelligenceContext';
import { FiscalAlertPopup } from '../components/FiscalAlertPopup';

export function FiscalCentralDashboard() {
  const {
    stats,
    activeAlerts,
    insights,
    monitoring,
    popupAlert,
    closePopup,
    dismissAlert,
    openPopup,
    refreshIntelligence,
  } = useFiscalIntelligence();

  const kpi = [
    { label: 'CT-e Emitidos (Mês)', value: stats.cteEmitidos.toString(), color: 'text-gray-900', icon: FileText },
    { label: 'MDF-e Ativos', value: stats.mdfeAtivos.toString(), color: 'text-blue-500', icon: Truck },
    { label: 'Pendentes SEFAZ', value: stats.pendentesSefaz.toString(), color: 'text-yellow-500', icon: Clock },
    { label: 'Rejeitados', value: stats.rejeitados.toString(), color: 'text-red-500', icon: AlertCircle },
  ];

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="logta-panel-card--dark p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-[10px] font-black uppercase text-primary">Central fiscal inteligente logística</span>
              </div>
              <h3 className="logta-card-heading text-lg text-white">Monitoramento SEFAZ e emissão ativos</h3>
              <p className="mt-1 text-sm font-medium text-gray-400">
                {monitoring.label} · {monitoring.total} alerta(s) · {monitoring.critical} crítico(s)
              </p>
            </div>
            <button type="button" onClick={refreshIntelligence} className="hub-premium-pill secondary shrink-0">
              <Activity size={16} /> Sincronizar SEFAZ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {kpi.map((stat, i) => (
            <div key={i} className="logta-stat-card group">
              <div className="relative z-10">
                <p className="logta-stat-card__label">{stat.label}</p>
                <p className={`logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary logta-dashboard-stat-card__value--lg ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <stat.icon
                size={60}
                className="pointer-events-none absolute bottom-8 right-7 text-gray-900 opacity-[0.02] transition-all group-hover:opacity-[0.05]"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="logta-panel-card lg:col-span-2 p-8">
            <h3 className="logta-card-heading mb-8">Volume de Faturamento Fiscal</h3>
            <div className="flex h-64 items-center justify-center text-sm font-bold text-gray-400">
              Gráfico inteligente — conecte emissões da API fiscal
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'NF-e / NFS-e', path: '/documentos/cte' },
                { label: 'Manifestos', path: '/documentos/mdfe' },
                { label: 'Fila SEFAZ', path: '/documentos/dashboard' },
                { label: 'Rejeições', path: '/documentos/rejeitados' },
              ].map((l) => (
                <Link
                  key={l.label}
                  to={l.path}
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-center text-xs font-bold text-gray-800 hover:border-primary/30"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="logta-panel-card--dark relative overflow-hidden p-8">
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  <h3 className="logta-card-heading text-white">IA fiscal</h3>
                </div>
                <div className="space-y-3">
                  {insights.map((ins) => (
                    <div key={ins.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs font-bold text-white">{ins.title}</p>
                      <p className="mt-1 text-[11px] text-gray-400">{ins.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <FileCode size={120} className="absolute -right-8 -bottom-8 opacity-5 text-white" />
            </div>

            <div className="logta-panel-card p-6">
              <h3 className="logta-card-heading mb-4">Alertas fiscais em tempo real</h3>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {activeAlerts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => openPopup(a)}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-left hover:border-primary/30"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                      <div>
                        <p className="text-xs font-bold text-gray-900">{a.title}</p>
                        <p className="line-clamp-2 text-[10px] text-gray-500">{a.message}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="logta-panel-card p-6">
              <h3 className="logta-card-heading mb-3">Integração operacional</h3>
              <ul className="space-y-2 text-xs font-medium text-gray-600">
                <li className="flex items-center gap-2">
                  <Globe size={14} className="text-primary" /> Fretes · motorista · rota
                </li>
                <li className="flex items-center gap-2">
                  <FileText size={14} className="text-primary" /> Timeline e memória fiscal
                </li>
                <li className="flex items-center gap-2">
                  <Truck size={14} className="text-primary" /> Frota e MDF-e vinculados
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {popupAlert ? (
        <FiscalAlertPopup alert={popupAlert} onClose={closePopup} onDismiss={() => dismissAlert(popupAlert.id)} />
      ) : null}
    </>
  );
}
