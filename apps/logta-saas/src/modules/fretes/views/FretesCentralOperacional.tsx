import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Sparkles, Truck } from 'lucide-react';
import { useFretesIntelligence } from '../context/FretesIntelligenceContext';
import type { FretesAlert, FretesAlertPriority } from '../types';

const badge: Record<FretesAlertPriority, string> = {
  critical: 'bg-red-50 text-red-700 border-red-100',
  high: 'bg-amber-50 text-amber-700 border-amber-100',
  medium: 'bg-blue-50 text-blue-700 border-blue-100',
  low: 'bg-gray-50 text-gray-600 border-gray-100',
};

function AlertCard({ alert, onOpen }: { alert: FretesAlert; onOpen: () => void }) {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={onOpen} className="logta-panel-card w-full p-6 text-left hover:border-primary/30 hover:shadow-md">
      <span className={`mb-3 inline-block rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${badge[alert.priority]}`}>
        {alert.priority}
      </span>
      <h4 className="logta-card-heading mb-2">{alert.title}</h4>
      <p className="mb-3 text-xs font-medium text-gray-500">{alert.message}</p>
      <span
        className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-primary"
        onClick={(e) => {
          e.stopPropagation();
          navigate(alert.actionPath);
        }}
      >
        {alert.actionLabel} <ArrowRight size={12} />
      </span>
    </button>
  );
}

export function FretesCentralOperacional() {
  const { activeAlerts, alerts, insights, analytics, monitoring, refreshIntelligence, lastScanAt } =
    useFretesIntelligence();
  const navigate = useNavigate();

  const grupos = {
    atraso: activeAlerts.filter((a) => a.category === 'atraso' || a.category === 'entrega'),
    motorista: activeAlerts.filter((a) => a.category === 'motorista'),
    custo: activeAlerts.filter((a) => a.category === 'custo'),
  };

  return (
    <div className="space-y-8 text-left">
      <div className="rounded-[32px] border-2 border-primary/30 bg-primary/5 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-[10px] font-black uppercase text-primary">Monitoramento em tempo real</span>
            </div>
            <h2 className="logta-card-heading text-2xl text-gray-900 sm:text-3xl">Central Operacional de Fretes</h2>
            <p className="mt-2 max-w-xl text-sm font-medium text-gray-600">
              IA monitora viagens, motoristas, veículos, custos, rotas e SLA.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: 'Críticos', v: monitoring.critical, c: 'text-red-400' },
              { l: 'Alta', v: monitoring.high, c: 'text-amber-400' },
              { l: 'Ativos', v: analytics.fretesAtivos, c: 'text-white' },
              { l: 'Atrasados', v: analytics.atrasados, c: 'text-primary' },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl border border-primary/20 bg-white p-4 text-center">
                <p className="text-[9px] font-black uppercase text-gray-500">{x.l}</p>
                <p className={`mt-1 text-lg font-black ${x.c === 'text-white' ? 'text-gray-900' : x.c}`}>{x.v}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={refreshIntelligence} className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:opacity-90">
            Reanalisar
          </button>
          <Link to="/fretes/mapa" className="rounded-xl border border-primary/30 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/10">
            Mapa live
          </Link>
          {lastScanAt ? (
            <span className="flex items-center gap-1 self-center text-[10px] text-gray-500">
              <Clock size={12} /> {lastScanAt.toLocaleTimeString('pt-BR')}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { l: 'Fretes ativos', v: analytics.fretesAtivos },
          { l: 'Em rota', v: analytics.emRota },
          { l: 'Entregas hoje', v: analytics.entreguesHoje },
          { l: 'Atrasados', v: analytics.atrasados },
          { l: 'Margem média', v: `${analytics.margemMedia.toFixed(0)}%` },
          { l: 'Veículos rota', v: analytics.veiculosEmRota },
        ].map((k) => (
          <div key={k.l} className="logta-stat-card">
            <p className="logta-stat-card__label logta-stat-card__label--spaced">{k.l}</p>
            <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary logta-dashboard-stat-card__value--lg">{k.v}</p>
          </div>
        ))}
      </div>

      <div className="logta-performance-section grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {activeAlerts.length === 0 ? (
            <div className="logta-panel-card flex flex-col items-center gap-4 p-12 text-center">
              <CheckCircle2 className="text-green-500" size={40} />
              <h3 className="logta-card-heading">Operação sem alertas críticos</h3>
            </div>
          ) : (
            <>
              {grupos.atraso.length > 0 && (
                <section>
                  <h3 className="logta-panel-section-title">Atrasos & entregas</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {grupos.atraso.map((a) => (
                      <AlertCard key={a.id} alert={a} onOpen={() => navigate(a.actionPath)} />
                    ))}
                  </div>
                </section>
              )}
              {grupos.motorista.length > 0 && (
                <section>
                  <h3 className="logta-panel-section-title">Motoristas & jornada</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {grupos.motorista.map((a) => (
                      <AlertCard key={a.id} alert={a} onOpen={() => navigate(a.actionPath)} />
                    ))}
                  </div>
                </section>
              )}
              {grupos.custo.length > 0 && (
                <section>
                  <h3 className="logta-panel-section-title">Custos & margem</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {grupos.custo.map((a) => (
                      <AlertCard key={a.id} alert={a} onOpen={() => navigate(a.actionPath)} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border-2 border-primary/30 bg-primary/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <h3 className="logta-card-heading text-gray-900">IA Operacional</h3>
            </div>
            <div className="space-y-4">
              {insights.map((ins) => (
                <div key={ins.id} className="rounded-2xl border border-primary/20 bg-white p-4">
                  <p className="text-xs font-bold text-gray-900">{ins.title}</p>
                  <p className="mt-2 text-xs text-gray-600">{ins.description}</p>
                  {ins.actions?.[0] ? (
                    <Link to={ins.actions[0].path} className="mt-2 inline-block text-[10px] font-black uppercase text-primary">
                      {ins.actions[0].label}
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="logta-panel-card p-6">
            <h3 className="logta-card-heading mb-4">Automações ativas</h3>
            <ul className="space-y-2 text-xs font-medium text-gray-600">
              {['Detectar atraso', 'Alertar parada', 'Sugerir faturamento', 'Monitorar jornada', 'Analisar custo/km'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Truck size={14} className="text-primary" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="logta-panel-card flex gap-3 p-6">
            <AlertTriangle className="shrink-0 text-amber-500" size={22} />
            <p className="text-xs leading-relaxed text-gray-600">{alerts.length} evento(s) detectados nesta sessão.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
