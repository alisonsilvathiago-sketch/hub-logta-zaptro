import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  Award,
  Briefcase,
  Calendar,
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
        <h3 className="logta-panel-section-title">Centro operacional RH</h3>
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


    </div>
  );
}
