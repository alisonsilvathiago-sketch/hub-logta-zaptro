import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  DollarSign,
  FileText,
  Fuel,
  Loader2,
  MapPin,
  Sparkles,
  Truck,
  Wrench,
} from 'lucide-react';
import { useFrotaIntelligence } from '../context/FrotaIntelligenceContext';
import type { FrotaVehicleRow } from '../types';

type Props = {
  veiculos: FrotaVehicleRow[];
  loading?: boolean;
};

export function FrotaCentralDashboard({ veiculos, loading }: Props) {
  const navigate = useNavigate();
  const {
    activeAlerts,
    insights,
    monitoring,
    refreshIntelligence,
  } = useFrotaIntelligence();

  const emRota = veiculos.filter((v) => v.status === 'em_rota' || v.status === 'in_transit').length;
  const manut = veiculos.filter((v) => v.status === 'manutencao' || v.status === 'maintenance').length;

  const stats = [
    { label: 'Frota Total', value: veiculos.length.toString(), desc: 'Unidades Ativas', Icon: Truck, color: 'text-gray-900' },
    { label: 'Em Rota', value: emRota.toString(), desc: 'Operação Ativa', Icon: MapPin, color: 'text-primary' },
    { label: 'Em Oficina', value: manut.toString(), desc: 'Indisponíveis', Icon: Wrench, color: 'text-red-500' },
    { label: 'Custo Mês', value: `R$ ${(veiculos.length * 1250).toLocaleString('pt-BR')}`, desc: 'Estimativa IA', Icon: DollarSign, color: 'text-gray-400' },
  ];

  return (
  <>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      <div className="logta-panel-card--operational p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-normal text-primary">
                Central inteligente de frota
              </span>
            </div>
            <h2 className="logta-card-heading text-2xl text-gray-900 sm:text-3xl">Monitoramento automático ativo</h2>
            <p className="mt-2 text-sm font-medium text-gray-600">
              {monitoring.label} · {monitoring.total} alerta(s) · {monitoring.critical} crítico(s)
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: 'Críticos', value: monitoring.critical, tone: 'text-red-500' },
              { label: 'Alertas', value: monitoring.total, tone: 'text-gray-900' },
              { label: 'Em rota', value: emRota, tone: 'text-primary' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-primary/20 bg-white px-4 py-3 text-center">
                <p className="text-[9px] font-black uppercase text-gray-500">{s.label}</p>
                <p className={`mt-1 text-lg font-black ${s.tone}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refreshIntelligence}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:opacity-90"
          >
            <Activity size={16} /> Reanalisar frota
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const StatIcon = stat.Icon;
          return (
            <div key={i} className="bg-gray-50/50 border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-xl p-8 rounded-[40px] relative overflow-hidden group transition-all text-left cursor-default">
              {loading ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                  <Loader2 className="animate-spin text-primary" />
                </div>
              ) : null}
              <div className="relative z-10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">{stat.label}</p>
                <p className={`logta-dashboard-stat-card__value ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-gray-500 mt-3 font-bold uppercase tracking-tight">{stat.desc}</p>
              </div>
              <StatIcon
                size={80}
                className="pointer-events-none absolute bottom-8 right-7 text-gray-900 opacity-[0.02] transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.05]"
              />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm">
          <h3 className="logta-card-heading mb-8 text-gray-900">Status da Frota em Tempo Real</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              {[
                { status: 'Ativos em Rota', key: 'em_rota', color: 'bg-primary', alt: ['in_transit'] },
                { status: 'Disponíveis', key: 'disponivel', color: 'bg-green-500', alt: ['available'] },
                { status: 'Manutenção', key: 'manutencao', color: 'bg-red-500', alt: ['maintenance'] },
              ].map((item) => {
                const count = veiculos.filter(
                  (v) => v.status === item.key || item.alt.includes(v.status || ''),
                ).length;
                return (
                  <div key={item.status} className="space-y-3">
                    <div className="flex justify-between text-[11px] font-black text-gray-900 uppercase tracking-normal">
                      <span>{item.status}</span>
                      <span>{count}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} transition-all duration-1000`}
                        style={{ width: `${veiculos.length > 0 ? (count / veiculos.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-gray-400">Acesso rápido</p>
              {[
                { label: 'Veículos', path: '/frota/veiculos', icon: Truck },
                { label: 'Manutenção', path: '/frota/manutencao', icon: Wrench },
                { label: 'Combustível', path: '/frota/combustivel', icon: Fuel },
              ].map((l) => (
                <Link
                  key={l.path}
                  to={l.path}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800 hover:border-primary/30"
                >
                  <l.icon size={18} className="text-primary" /> {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="logta-panel-card--operational p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <h3 className="logta-card-heading text-gray-900">IA operacional</h3>
            </div>
            <div className="space-y-3">
              {insights.map((ins) => (
                <div key={ins.id} className="rounded-xl border border-primary/20 bg-white p-3">
                  <p className="text-xs font-bold text-gray-900">{ins.title}</p>
                  <p className="mt-1 text-[11px] font-medium text-gray-600">{ins.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="logta-panel-card p-6">
            <h3 className="logta-card-heading mb-4 text-gray-900">Alertas críticos</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeAlerts.slice(0, 6).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => navigate(a.actionPath)}
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-left hover:border-primary/30"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">{a.title}</p>
                      <p className="text-[10px] text-gray-500 line-clamp-2">{a.message}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="logta-panel-card p-6">
            <h3 className="logta-card-heading mb-3 text-gray-900">Gestão documental</h3>
            <ul className="space-y-2 text-xs font-medium text-gray-600">
              <li className="flex items-center gap-2"><FileText size={14} className="text-primary" /> IPVA e licenciamento</li>
              <li className="flex items-center gap-2"><FileText size={14} className="text-primary" /> Seguro e CRLV</li>
              <li className="flex items-center gap-2"><FileText size={14} className="text-primary" /> Multas e financiamentos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

  </>
  );
}
