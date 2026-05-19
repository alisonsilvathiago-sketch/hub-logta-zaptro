import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Clock, FileCheck, Sparkles } from 'lucide-react';

type RhAlertasViewProps = {
  alertasCount: number;
  motoristas: { id: string; nome?: string; cnh_vencimento?: string; status?: string }[];
};

export function RhAlertasView({ alertasCount, motoristas }: RhAlertasViewProps) {
  const alerts = [
    ...(alertasCount > 0
      ? [
          {
            type: 'CNH',
            title: 'CNH próxima do vencimento',
            desc: `${alertasCount} motorista(s) com renovação pendente.`,
            tone: 'text-red-500',
            icon: FileCheck,
          },
        ]
      : []),
    {
      type: 'Jornada',
      title: 'Jornada excessiva (IA)',
      desc: 'Nenhuma infração detectada nas últimas 24h.',
      tone: 'text-green-500',
      icon: Clock,
    },
    {
      type: 'Exames',
      title: 'Exames toxicológicos',
      desc: 'Todos os exames obrigatórios em dia.',
      tone: 'text-primary',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-8 text-left">
      <div className="logta-panel-card p-6 sm:p-8">
        <h3 className="logta-card-heading mb-2">Central de Alertas RH</h3>
        <p className="text-sm font-medium text-gray-500">
          Alertas administrativos e operacionais unificados para transportadoras.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {alerts.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.type} className="logta-panel-card p-6">
              <Icon size={22} className={`mb-4 ${a.tone}`} />
              <p className={`text-[10px] font-black uppercase tracking-normal mb-1 ${a.tone}`}>{a.type}</p>
              <h4 className="logta-card-heading mb-2">{a.title}</h4>
              <p className="text-xs font-medium text-gray-500">{a.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="logta-panel-card--dark logta-panel-card--retention p-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-primary" size={20} />
          <h3 className="logta-card-heading text-white">Priorização IA</h3>
        </div>
        <p className="text-sm text-gray-300 mb-6">
          A IA Logta classifica alertas por impacto operacional: jornada, documentos e risco de atraso.
        </p>
        <div className="space-y-3">
          {motoristas.slice(0, 5).map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-xs font-bold text-white">{m.nome || 'Motorista'}</span>
              <span className="text-[10px] font-black uppercase text-gray-400">{m.status || 'ativo'}</span>
            </div>
          ))}
          {motoristas.length === 0 ? (
            <p className="text-xs text-gray-500">Cadastre motoristas para alertas personalizados.</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/rh/administrativo" className="hub-premium-pill secondary">
          RH Administrativo
        </Link>
        <Link to="/rh/operacional" className="hub-premium-pill secondary">
          RH Operacional
        </Link>
      </div>
    </div>
  );
}
