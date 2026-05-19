import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, DollarSign, Sparkles, TrendingDown } from 'lucide-react';
import { useFretesIntelligence } from '../context/FretesIntelligenceContext';

export function FretesFinanceiroInteligente() {
  const { shipments, analytics } = useFretesIntelligence();

  const viagens = useMemo(() => {
    return shipments
      .filter((s) => (s.valor_frete || 0) > 0)
      .slice(0, 12)
      .map((s) => {
        const receita = s.valor_frete || 0;
        const diesel = receita * 0.35;
        const pedagio = receita * 0.08;
        const diaria = receita * 0.12;
        const manut = receita * 0.05;
        const custo = diesel + pedagio + diaria + manut;
        const lucro = receita - custo;
        const margem = receita > 0 ? Math.round((lucro / receita) * 100) : 0;
        return {
          shipmentId: s.id,
          id: s.numero_frete,
          route: `${s.origin} → ${s.destination}`,
          receita,
          custo,
          lucro,
          margem,
          diesel,
          pedagio,
          diaria,
        };
      });
  }, [shipments]);

  return (
    <div className="space-y-8 text-left">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="logta-finance-stat-card">
          <p className="logta-finance-stat-card__label">Receita operacional</p>
          <p className="logta-finance-stat-card__value">R$ {analytics.receita.toLocaleString('pt-BR')}</p>
          <p className="mt-2 flex items-center gap-1 text-xs font-bold text-green-600">
            <ArrowUpRight size={14} /> Fretes ativos: {analytics.fretesAtivos}
          </p>
        </div>
        <div className="logta-finance-stat-card">
          <p className="logta-finance-stat-card__label">Custo operacional</p>
          <p className="logta-finance-stat-card__value text-red-500">R$ {analytics.custoOperacional.toLocaleString('pt-BR')}</p>
          <p className="mt-2 text-xs font-bold text-gray-400">Diesel · pedágio · diárias</p>
        </div>
        <div className="logta-finance-stat-card">
          <p className="logta-finance-stat-card__label">Lucro / margem</p>
          <p className="logta-finance-stat-card__value text-primary">R$ {analytics.lucroOperacional.toLocaleString('pt-BR')}</p>
          <p className="mt-2 text-xs font-bold text-primary">{analytics.margemMedia.toFixed(1)}% margem média</p>
        </div>
      </div>

      <div className="logta-panel-card p-6 sm:p-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="logta-card-heading">Financeiro por viagem</h3>
            <p className="mt-1 text-xs text-gray-500">Diesel, pedágio, diária, manutenção e margem estimada por frete.</p>
          </div>
          <Link to="/financeiro/operacional/custos-por-viagem" className="hub-premium-pill secondary">
            <DollarSign size={16} /> Financeiro Logta
          </Link>
        </div>

        {viagens.length === 0 ? (
          <p className="text-sm text-gray-400">Cadastre fretes com valor para ver o breakdown financeiro.</p>
        ) : (
          <div className="space-y-4">
            {viagens.map((f) => (
              <Link
                key={f.id}
                to={`/fretes/operacional/${f.shipmentId}`}
                className="logta-panel-card flex flex-wrap items-center justify-between gap-4 p-6 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">{f.id}</p>
                  <p className="text-xs font-bold text-gray-900">{f.route}</p>
                  <p className="mt-2 text-[10px] text-gray-500">
                    Diesel R$ {f.diesel.toLocaleString('pt-BR')} · Pedágio R$ {f.pedagio.toLocaleString('pt-BR')} · Diária R${' '}
                    {f.diaria.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-gray-400">Margem</p>
                  <p className={`text-lg font-black ${f.margem >= 15 ? 'text-primary' : 'text-red-500'}`}>{f.margem}%</p>
                  <p className="text-xs font-bold text-gray-600">Lucro R$ {f.lucro.toLocaleString('pt-BR')}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="logta-panel-card--dark logta-panel-card--retention flex items-start gap-4 p-6">
        <Sparkles className="shrink-0 text-primary" size={22} />
        <div>
          <h3 className="logta-card-heading text-white">IA Financeira do Frete</h3>
          <p className="mt-2 text-sm text-gray-400">
            Detecta custo acima da média, combustível elevado e risco de prejuízo por viagem. Integrado ao Financeiro e RH.
          </p>
          <Link to="/fretes/central" className="mt-4 inline-flex text-xs font-bold uppercase text-primary hover:underline">
            Ver central de alertas
          </Link>
        </div>
      </div>
    </div>
  );
}
