import React from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '../../../contexts/TenantContext';
import { useLogtaProfile } from '../../../contexts/LogtaProfileContext';
import { resolveDemoCompanyId } from '../../../lib/seed';
import { OrcamentosRecebiveisCard } from '../../orcamento/components/OrcamentosRecebiveisCard';
import { useFinanceiroIntelligence } from '../context/FinanceiroIntelligenceContext';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  DollarSign,
  TrendingDown,
  TrendingUp,
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
            <p
              className={`logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg ${
                stat.label === 'Receita'
                  ? '!text-[24px] !text-gray-900'
                  : 'logta-dashboard-stat-card__value--primary'
              }`}
            >
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
                'logta-movement-row flex min-h-[60px] items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-gray-50/80';
              const inner = (
                <>
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`logta-movement-row__icon flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl ${isReceita ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}
                    >
                      {isReceita ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className="logta-movement-row__title truncate font-bold text-gray-900">
                        {t.descricao ?? t.description}
                      </p>
                      <p className="text-[10px] font-bold uppercase text-gray-400">{t.categoria ?? t.category}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p
                      className={`logta-movement-row__amount font-black ${isReceita ? 'text-green-600' : 'text-gray-900'}`}
                    >
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


    </div>
  );
}
