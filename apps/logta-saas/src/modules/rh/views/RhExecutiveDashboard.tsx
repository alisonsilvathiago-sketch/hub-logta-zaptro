import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  Award,
  Briefcase,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from 'lucide-react';

type RhExecutiveDashboardProps = {
  stats: {
    total: number;
    motoristasAtivos: number;
    folhaEst: string;
    alertas: number;
  };
};

export function RhExecutiveDashboard({ stats }: RhExecutiveDashboardProps) {
  const hubs = [
    {
      title: 'RH Administrativo',
      desc: 'Pessoas, performance, comunicação e governança.',
      path: '/rh/administrativo',
      icon: Briefcase,
      count: '25 módulos',
    },
    {
      title: 'Jornada & Ponto',
      desc: 'Escalas, ponto, banco de horas, folgas, férias e GPS.',
      path: '/rh/jornada-ponto',
      icon: Clock,
      count: '6 módulos',
    },
    {
      title: 'Documentos & Compliance',
      desc: 'CNH, exames, vencimentos, assinatura e conformidade.',
      path: '/rh/documentos-compliance',
      icon: FileText,
      count: '6 módulos',
    },
    {
      title: 'RH Operacional',
      desc: 'Motoristas, jornada na estrada, KPIs, alertas e integrações.',
      path: '/rh/operacional',
      icon: Truck,
      count: '34 módulos',
    },
    {
      title: 'Central de Alertas',
      desc: 'CNH, exames, jornada excessiva e pendências críticas.',
      path: '/rh/alertas',
      icon: AlertCircle,
      count: `${stats.alertas} ativos`,
    },
    {
      title: 'Documentos RH',
      desc: 'CNH, exames e contratos via LogDock.',
      path: '/rh/documentos',
      icon: ShieldCheck,
      count: 'LogDock',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Colaboradores', value: stats.total, icon: Users },
          { label: 'Motoristas Ativos', value: stats.motoristasAtivos, icon: Truck },
          { label: 'Folha Mensal Est.', value: stats.folhaEst, icon: DollarSign },
          { label: 'Alertas (Docs)', value: stats.alertas, icon: AlertCircle },
        ].map((stat, i) => (
          <div key={i} className="logta-stat-card group">
            <p className="logta-stat-card__label logta-stat-card__label--spaced">{stat.label}</p>
            <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary logta-dashboard-stat-card__value--lg">
              {stat.value}
            </p>
            <stat.icon
              size={60}
              className="pointer-events-none absolute bottom-8 right-7 text-gray-900 opacity-[0.02] transition-all group-hover:opacity-[0.05]"
            />
          </div>
        ))}
      </div>

      <div>
        <h3 className="logta-panel-section-title mb-4">Centro operacional RH</h3>
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
          <h3 className="logta-card-heading mb-8">Eficiência da Equipe (Mês)</h3>
          <div className="space-y-6">
            {[
              { role: 'Motoristas Próprios', efficiency: 94, color: 'bg-primary' },
              { role: 'Motoristas Agregados', efficiency: 82, color: 'bg-blue-500' },
              { role: 'Equipe Logística', efficiency: 88, color: 'bg-gray-900' },
              { role: 'Administrativo', efficiency: 96, color: 'bg-green-500' },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-end justify-between">
                  <span className="text-xs font-bold text-gray-900">{item.role}</span>
                  <span className="text-[10px] font-black text-gray-400">{item.efficiency}% de Eficiência</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full ${item.color}`} style={{ width: `${item.efficiency}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="logta-panel-card--dark logta-panel-card--retention relative overflow-hidden p-8">
          <div className="relative z-10">
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="text-primary" size={18} />
              <h3 className="logta-card-heading text-white">IA Logta RH</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Activity size={18} className="shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-normal text-primary">Jornada</p>
                  <p className="text-xs text-gray-400">Monitoramento de excesso de jornada ativo.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Award size={18} className="shrink-0 text-yellow-400" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-normal text-yellow-400">Performance</p>
                  <p className="text-xs text-gray-400">Ranking e KPIs sincronizados com operações.</p>
                </div>
              </div>
              {stats.alertas > 0 ? (
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <AlertCircle size={18} className="shrink-0 text-red-500" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-normal text-red-500">Documentos</p>
                    <p className="text-xs text-gray-400">{stats.alertas} pendências críticas.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <ShieldCheck size={18} className="shrink-0 text-green-500" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-normal text-green-500">Conformidade</p>
                    <p className="text-xs text-gray-400">Documentação em dia na operação.</p>
                  </div>
                </div>
              )}
            </div>
            <Link
              to="/rh/alertas"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-white hover:opacity-90"
            >
              Ver central de alertas
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/rh/equipe" className="logta-panel-card flex items-center justify-between p-6 hover:border-primary/30">
          <span className="text-sm font-bold text-gray-900">Gestão de Equipe</span>
          <ChevronRight size={18} className="text-gray-300" />
        </Link>
        <Link to="/rh/motoristas" className="logta-panel-card flex items-center justify-between p-6 hover:border-primary/30">
          <span className="text-sm font-bold text-gray-900">Motoristas</span>
          <ChevronRight size={18} className="text-gray-300" />
        </Link>
        <Link to="/rh/desempenho" className="logta-panel-card flex items-center justify-between p-6 hover:border-primary/30">
          <span className="text-sm font-bold text-gray-900">Ranking</span>
          <ChevronRight size={18} className="text-gray-300" />
        </Link>
      </div>
    </div>
  );
}
