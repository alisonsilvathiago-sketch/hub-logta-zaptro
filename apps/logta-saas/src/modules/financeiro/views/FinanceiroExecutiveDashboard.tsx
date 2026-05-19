import React from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '../../../contexts/TenantContext';
import { useLogtaProfile } from '../../../contexts/LogtaProfileContext';
import { resolveDemoCompanyId } from '../../../lib/seed';
import { OrcamentosRecebiveisCard } from '../../orcamento/components/OrcamentosRecebiveisCard';
import { useFinanceiroIntelligence } from '../context/FinanceiroIntelligenceContext';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Calculator,
  ChevronRight,
  DollarSign,
  PieChart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
} from 'lucide-react';
import type { TransactionRow } from '../financeiroAnalytics';
import { useFinanceiroTransactionNavigation } from '../hooks/useFinanceiroTransactionNavigation';

type FinanceiroExecutiveDashboardProps = {
  transactions: TransactionRow[];
  loading?: boolean;
};

export function FinanceiroExecutiveDashboard({ transactions: _transactions, loading }: FinanceiroExecutiveDashboardProps) {
  const { config } = useTenant();
  const { profile } = useLogtaProfile();
  const companyId = resolveDemoCompanyId(config?.id);
  const { analytics, activeAlerts } = useFinanceiroIntelligence();
  const { getRoute } = useFinanceiroTransactionNavigation();

  const hubs = [
    {
      title: 'Financeiro Operacional',
      desc: 'Viagem, fretes, custos por veículo/motorista e simuladores.',
      path: '/financeiro/operacional',
      icon: Truck,
      count: '19 módulos',
    },
    {
      title: 'Gestão Financeira',
      desc: 'Fluxo, faturamento, bancário, DRE, KPI e governança.',
      path: '/financeiro/gestao',
      icon: Briefcase,
      count: '38 módulos',
    },
    {
      title: 'Central Inteligente',
      desc: 'Frete, lucro, combustível, margem e projeção com IA.',
      path: '/financeiro/assistente',
      icon: Calculator,
      count: 'Assistente IA',
    },
    {
      title: 'Central Financeira',
      desc: 'Alertas em tempo real, IA e monitoramento automático.',
      path: '/financeiro/central',
      icon: AlertCircle,
      count: `${activeAlerts.length} ativo(s)`,
    },
  ];

  const maxFluxo = Math.max(...analytics.fluxoMensal.map((m) => Math.max(m.in, m.out)), 1);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Receita', value: `R$ ${analytics.receita.toLocaleString('pt-BR')}`, icon: TrendingUp },
          { label: 'Despesas', value: `R$ ${analytics.despesas.toLocaleString('pt-BR')}`, icon: TrendingDown },
          { label: 'Saldo de Caixa', value: `R$ ${analytics.saldo.toLocaleString('pt-BR')}`, icon: DollarSign },
          { label: 'Lucro Operacional', value: `R$ ${analytics.lucroOperacional.toLocaleString('pt-BR')}`, icon: Activity },
        ].map((stat, i) => (
          <div key={i} className="logta-stat-card group relative">
            {loading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[20px] bg-white/60 backdrop-blur-[1px]" />
            ) : null}
            <p className="logta-stat-card__label logta-stat-card__label--spaced">{stat.label}</p>
            <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary logta-dashboard-stat-card__value--lg">
              {stat.value}
            </p>
            <stat.icon
              size={56}
              className="pointer-events-none absolute bottom-8 right-7 text-gray-900 opacity-[0.02] transition-all group-hover:opacity-[0.05]"
            />
          </div>
        ))}
      </div>

      <OrcamentosRecebiveisCard companyId={companyId} receivedByName={profile?.full_name ?? 'Financeiro'} />

      <div>
        <h3 className="logta-panel-section-title mb-4">Centro financeiro Logta</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hubs.map((hub) => {
            const Icon = hub.icon;
            return (
              <Link
                key={hub.path}
                to={hub.path}
                className="logta-panel-card group flex flex-col p-6 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white">
                  <Icon size={22} />
                </div>
                <h4 className="logta-card-heading mb-2 group-hover:text-primary">{hub.title}</h4>
                <p className="mb-4 flex-1 text-xs font-medium text-gray-500">{hub.desc}</p>
                <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-normal text-primary">
                  {hub.count}
                  <ChevronRight size={14} />
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="logta-performance-section grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="logta-panel-card lg:col-span-2 p-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="logta-card-heading">Fluxo de caixa mensal</h3>
              <p className="mt-1 text-xs font-medium text-gray-500">Entradas vs saídas por mês (dados reais do Supabase)</p>
            </div>
            <Link to="/financeiro/fluxo" className="text-[10px] font-black uppercase tracking-normal text-primary hover:underline">
              Ver fluxo completo
            </Link>
          </div>
          {analytics.fluxoMensal.length === 0 ? (
            <p className="text-sm text-gray-400">Cadastre lançamentos para visualizar o gráfico.</p>
          ) : (
            <div className="flex items-end justify-between gap-3 h-48">
              {analytics.fluxoMensal.map((m) => (
                <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full max-w-[48px] flex-col gap-1 h-36 justify-end">
                    <div
                      className="w-full rounded-t-md bg-primary/80 transition-all"
                      style={{ height: `${Math.max(8, (m.in / maxFluxo) * 100)}%` }}
                      title={`Entrada: R$ ${m.in.toLocaleString('pt-BR')}`}
                    />
                    <div
                      className="w-full rounded-t-md bg-red-400/70 transition-all"
                      style={{ height: `${Math.max(8, (m.out / maxFluxo) * 100)}%` }}
                      title={`Saída: R$ ${m.out.toLocaleString('pt-BR')}`}
                    />
                  </div>
                  <span className="text-[9px] font-black uppercase text-gray-400">{m.label}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-normal text-gray-500">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" /> Receita
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-400" /> Despesa
            </span>
          </div>
        </div>

        <div className="logta-panel-card--operational logta-panel-card--retention p-8">
          <div className="mb-6 flex items-center gap-2">
            <Sparkles className="text-primary" size={18} />
            <h3 className="logta-card-heading text-gray-900">IA Financeira</h3>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-primary">Previsão de caixa</p>
              <p className="mt-1 text-xs text-gray-600">
                Saldo projetado: <strong className="text-gray-900">R$ {analytics.saldo.toLocaleString('pt-BR')}</strong>
              </p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-amber-600">Risco</p>
              <p className="mt-1 text-xs text-gray-600">
                Inadimplência estimada: <strong className="text-gray-900">{analytics.inadimplenciaEst}%</strong>
              </p>
            </div>
            {analytics.alertasVencimento > 0 ? (
              <div className="rounded-2xl border border-primary/20 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-normal text-red-600">Vencimentos</p>
                <p className="mt-1 text-xs text-gray-600">{analytics.alertasVencimento} despesa(s) vencem em 7 dias.</p>
              </div>
            ) : null}
          </div>
          <Link
            to="/financeiro/central"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-white hover:opacity-90"
          >
            <Calculator size={16} /> Central Operacional
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="logta-panel-card p-8">
          <h3 className="logta-card-heading mb-6">Receita vs Despesa</h3>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-xs font-bold">
                <span className="text-gray-600">Receita</span>
                <span className="text-primary">R$ {analytics.receita.toLocaleString('pt-BR')}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${analytics.receita + analytics.despesas > 0 ? (analytics.receita / (analytics.receita + analytics.despesas)) * 100 : 50}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs font-bold">
                <span className="text-gray-600">Despesas</span>
                <span className="text-red-500">R$ {analytics.despesas.toLocaleString('pt-BR')}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-red-400"
                  style={{
                    width: `${analytics.receita + analytics.despesas > 0 ? (analytics.despesas / (analytics.receita + analytics.despesas)) * 100 : 50}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <p className="mt-6 text-xs font-medium text-gray-500">
            Margem operacional:{' '}
            <strong className={analytics.lucroOperacional >= 0 ? 'text-green-600' : 'text-red-500'}>
              R$ {analytics.lucroOperacional.toLocaleString('pt-BR')}
            </strong>
          </p>
        </div>

        <div className="logta-panel-card p-8">
          <h3 className="logta-card-heading mb-6">Maiores custos (categoria)</h3>
          {analytics.topCustos.length === 0 ? (
            <p className="text-sm text-gray-400">Sem despesas categorizadas ainda.</p>
          ) : (
            <div className="space-y-4">
              {analytics.topCustos.map((c, i) => {
                const pct = analytics.despesas > 0 ? Math.round((c.total / analytics.despesas) * 100) : 0;
                return (
                  <div key={c.name}>
                    <div className="mb-2 flex justify-between text-xs font-bold">
                      <span className="text-gray-900">{c.name}</span>
                      <span className="text-gray-500">R$ {c.total.toLocaleString('pt-BR')} ({pct}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full bg-gray-900" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="logta-panel-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <h3 className="logta-card-heading">Movimentações recentes</h3>
          <span className="text-[10px] font-black uppercase text-gray-400">{analytics.transacoes} transações</span>
        </div>
        {analytics.recentes.length === 0 ? (
          <p className="p-8 text-sm text-gray-400">Nenhuma movimentação registrada.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {analytics.recentes.map((t: TransactionRow) => {
              const rawType = (t.tipo ?? t.type ?? '').toLowerCase();
              const isReceita = rawType === 'receita' || rawType === 'income';
              const v = Number(t.valor ?? t.amount ?? 0);
              const path = getRoute(t);
              const rowClass =
                'flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-gray-50/80';
              const inner = (
                <>
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isReceita ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}
                    >
                      {isReceita ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-900">{t.descricao ?? t.description}</p>
                      <p className="text-[10px] font-bold uppercase text-gray-400">{t.categoria ?? t.category}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className={`text-xs font-black ${isReceita ? 'text-green-600' : 'text-gray-900'}`}>
                      {isReceita ? '+' : '−'} R$ {v.toLocaleString('pt-BR')}
                    </p>
                    {path ? <ChevronRight size={16} className="text-gray-300" /> : null}
                  </div>
                </>
              );
              return path ? (
                <Link
                  key={t.id}
                  to={path}
                  className={`${rowClass} cursor-pointer`}
                  title="Abrir registro relacionado"
                >
                  {inner}
                </Link>
              ) : (
                <div key={t.id} className={rowClass}>
                  {inner}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/financeiro/receber" className="logta-panel-card flex items-center justify-between p-6 hover:border-primary/30">
          <span className="text-sm font-bold text-gray-900">Contas a receber</span>
          <ChevronRight size={18} className="text-gray-300" />
        </Link>
        <Link to="/financeiro/pagar" className="logta-panel-card flex items-center justify-between p-6 hover:border-primary/30">
          <span className="text-sm font-bold text-gray-900">Contas a pagar</span>
          <ChevronRight size={18} className="text-gray-300" />
        </Link>
        <Link to="/financeiro/fluxo" className="logta-panel-card flex items-center justify-between p-6 hover:border-primary/30">
          <span className="text-sm font-bold text-gray-900">Fluxo de caixa</span>
          <PieChart size={18} className="text-gray-300" />
        </Link>
      </div>
    </div>
  );
}
