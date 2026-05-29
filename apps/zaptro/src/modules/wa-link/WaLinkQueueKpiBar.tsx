import React from 'react';
import { Clock, Headphones, Sparkles, UserCheck } from 'lucide-react';
import type { WaLinkQueueKpis } from './waLinkQueueKpis';

type Props = {
  kpis: WaLinkQueueKpis;
};

const WaLinkQueueKpiBar: React.FC<Props> = ({ kpis }) => {
  return (
    <div className="wa-queue-kpis" role="region" aria-label="Indicadores da fila">
      <div className="wa-queue-kpis__item">
        <Clock size={15} />
        <span className="wa-queue-kpis__label">Na fila</span>
        <strong>{kpis.awaiting}</strong>
      </div>
      <div className="wa-queue-kpis__item">
        <UserCheck size={15} />
        <span className="wa-queue-kpis__label">Em atendimento</span>
        <strong>{kpis.inService}</strong>
      </div>
      <div className="wa-queue-kpis__item">
        <Headphones size={15} />
        <span className="wa-queue-kpis__label">Minhas</span>
        <strong>{kpis.mine}</strong>
      </div>
      {kpis.aiEscalated > 0 ? (
        <div className="wa-queue-kpis__item wa-queue-kpis__item--alert">
          <Sparkles size={15} />
          <span className="wa-queue-kpis__label">IA pediu humano</span>
          <strong>{kpis.aiEscalated}</strong>
        </div>
      ) : null}
      {kpis.avgWaitMinutes != null ? (
        <div className="wa-queue-kpis__item wa-queue-kpis__item--muted">
          <span className="wa-queue-kpis__label">Espera média</span>
          <strong>{kpis.avgWaitMinutes} min</strong>
        </div>
      ) : null}
    </div>
  );
};

export default WaLinkQueueKpiBar;
