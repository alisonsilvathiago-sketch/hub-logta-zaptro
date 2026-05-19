import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useFinanceiroIntelligence } from '../context/FinanceiroIntelligenceContext';
import type { FinanceiroAlert, FinanceiroAlertPriority } from '../financeiroIntelligence';

const priorityBadge: Record<FinanceiroAlertPriority, string> = {
  critical: 'bg-red-50 text-red-700 border-red-100',
  high: 'bg-amber-50 text-amber-700 border-amber-100',
  medium: 'bg-blue-50 text-blue-700 border-blue-100',
  low: 'bg-gray-50 text-gray-600 border-gray-100',
};

function AlertCard({ alert }: { alert: FinanceiroAlert }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(alert.actionPath)}
      className="logta-panel-card w-full p-6 text-left transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${priorityBadge[alert.priority]}`}>
          {alert.priority}
        </span>
        <span className="text-[10px] font-bold uppercase text-gray-400">{alert.category}</span>
      </div>
      <h4 className="logta-card-heading mb-2">{alert.title}</h4>
      <p className="mb-4 text-xs font-medium leading-relaxed text-gray-500">{alert.message}</p>
      {alert.impacto ? (
        <p className="mb-3 text-xs font-bold text-primary">{alert.impacto}</p>
      ) : null}
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

export function FinanceiroCentralOperacional() {
  const {
    activeAlerts,
    alerts,
    insights,
    analytics,
    monitoring,
    dismissAlert,
    refreshIntelligence,
    lastScanAt,
  } = useFinanceiroIntelligence();

  const pendentes = activeAlerts.filter((a) => a.category === 'pagamento' || a.category === 'fornecedor');
  const recebimentos = activeAlerts.filter((a) => a.category === 'recebimento' || a.category === 'cliente');
  const operacional = activeAlerts.filter((a) => a.category === 'operacional' || a.category === 'fiscal');
  const iaAlerts = activeAlerts.filter((a) => a.category === 'ia' || a.category === 'fluxo');

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
              <span className="text-[10px] font-black uppercase tracking-normal text-primary">Monitoramento em tempo real</span>
            </div>
            <h2 className="logta-card-heading text-2xl text-gray-900 sm:text-3xl">Central Operacional Financeira</h2>
            <p className="mt-2 max-w-xl text-sm font-medium text-gray-600">
              IA monitora receitas, despesas, clientes, viagens e fluxo de caixa — e age com alertas automáticos.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Críticos', value: monitoring.critical, tone: 'text-red-400' },
              { label: 'Alta prioridade', value: monitoring.high, tone: 'text-amber-400' },
              { label: 'Total ativos', value: monitoring.total, tone: 'text-white' },
              { label: 'Saldo', value: `R$ ${(analytics.saldo / 1000).toFixed(0)}k`, tone: 'text-primary' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-primary/20 bg-white p-4 text-center">
                <p className="text-[9px] font-black uppercase text-gray-500">{s.label}</p>
                <p className={`mt-1 text-lg font-black ${s.tone === 'text-white' ? 'text-gray-900' : s.tone}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={refreshIntelligence} className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:opacity-90">
            Reanalisar agora
          </button>
          <Link to="/financeiro/assistente" className="rounded-xl border border-primary/30 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/10">
            Assistente IA
          </Link>
          {lastScanAt ? (
            <span className="flex items-center gap-1 self-center text-[10px] font-medium text-gray-500">
              <Clock size={12} /> Última varredura: {lastScanAt.toLocaleTimeString('pt-BR')}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="logta-stat-card">
          <p className="logta-stat-card__label logta-stat-card__label--spaced">Receita</p>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary logta-dashboard-stat-card__value--lg">
            R$ {analytics.receita.toLocaleString('pt-BR')}
          </p>
          <TrendingUp className="pointer-events-none absolute bottom-6 right-6 opacity-[0.04]" size={48} />
        </div>
        <div className="logta-stat-card">
          <p className="logta-stat-card__label logta-stat-card__label--spaced">Despesas</p>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary logta-dashboard-stat-card__value--lg">
            R$ {analytics.despesas.toLocaleString('pt-BR')}
          </p>
          <TrendingDown className="pointer-events-none absolute bottom-6 right-6 opacity-[0.04]" size={48} />
        </div>
        <div className="logta-stat-card">
          <p className="logta-stat-card__label logta-stat-card__label--spaced">Pendências pagar</p>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary logta-dashboard-stat-card__value--lg">
            {pendentes.length}
          </p>
          <Wallet className="pointer-events-none absolute bottom-6 right-6 opacity-[0.04]" size={48} />
        </div>
        <div className="logta-stat-card">
          <p className="logta-stat-card__label logta-stat-card__label--spaced">Risco IA</p>
          <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary logta-dashboard-stat-card__value--lg">
            {monitoring.nivel === 'critico' ? 'Alto' : monitoring.nivel === 'atencao' ? 'Médio' : 'Baixo'}
          </p>
          <Sparkles className="pointer-events-none absolute bottom-6 right-6 opacity-[0.04]" size={48} />
        </div>
      </div>

      <div className="logta-performance-section grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {activeAlerts.length === 0 ? (
            <div className="logta-panel-card flex flex-col items-center gap-4 p-12 text-center">
              <CheckCircle2 className="text-green-500" size={40} />
              <h3 className="logta-card-heading">Nenhum alerta ativo</h3>
              <p className="text-sm text-gray-500">O monitoramento continua em segundo plano.</p>
            </div>
          ) : (
            <>
              {pendentes.length > 0 && (
                <section>
                  <h3 className="logta-panel-section-title mb-4">Pagamentos & fornecedores</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {pendentes.map((a) => (
                      <AlertCard key={a.id} alert={a} />
                    ))}
                  </div>
                </section>
              )}
              {recebimentos.length > 0 && (
                <section>
                  <h3 className="logta-panel-section-title mb-4">Recebimentos & clientes</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {recebimentos.map((a) => (
                      <AlertCard key={a.id} alert={a} />
                    ))}
                  </div>
                </section>
              )}
              {operacional.length > 0 && (
                <section>
                  <h3 className="logta-panel-section-title mb-4">Operação logística</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {operacional.map((a) => (
                      <AlertCard key={a.id} alert={a} />
                    ))}
                  </div>
                </section>
              )}
              {iaAlerts.length > 0 && (
                <section>
                  <h3 className="logta-panel-section-title mb-4">IA & fluxo de caixa</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {iaAlerts.map((a) => (
                      <AlertCard key={a.id} alert={a} />
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
              <h3 className="logta-card-heading text-gray-900">Insights IA</h3>
            </div>
            <div className="space-y-4">
              {insights.map((ins) => (
                <div key={ins.id} className="rounded-2xl border border-primary/20 bg-white p-4">
                  <p className="text-xs font-bold text-gray-900">{ins.title}</p>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-gray-600">{ins.description}</p>
                  {ins.actions?.[0] ? (
                    <Link to={ins.actions[0].path} className="mt-3 inline-flex text-[10px] font-black uppercase text-primary hover:underline">
                      {ins.actions[0].label}
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="logta-panel-card p-6">
            <h3 className="logta-card-heading mb-4">Histórico de alertas</h3>
            <p className="mb-4 text-xs text-gray-500">{alerts.length} evento(s) detectado(s) nesta sessão.</p>
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {alerts.slice(0, 12).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 border-b border-gray-50 pb-2 text-xs">
                  <span className="truncate font-medium text-gray-700">{a.title}</span>
                  <button
                    type="button"
                    onClick={() => dismissAlert(a.id)}
                    className="shrink-0 text-[10px] font-bold uppercase text-gray-400 hover:text-primary"
                  >
                    Dispensar
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="logta-panel-card flex items-start gap-3 p-6">
            <AlertTriangle className="shrink-0 text-amber-500" size={22} />
            <p className="text-xs font-medium leading-relaxed text-gray-600">
              Alertas críticos abrem automaticamente ao entrar no Financeiro. Clique em qualquer card para ver impacto,
              recomendação e ação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
