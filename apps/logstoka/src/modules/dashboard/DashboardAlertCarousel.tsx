import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LsAlert } from '@/types';

type Props = {
  alerts: LsAlert[];
};

function severityClass(severity: LsAlert['severity']): string {
  if (severity === 'critical') return 'border-l-rose-400 bg-rose-50/30';
  if (severity === 'warning') return 'border-l-amber-400 bg-amber-50/30';
  return 'border-l-orange-400 bg-orange-50/30';
}

const DashboardAlertCarousel: React.FC<Props> = ({ alerts }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [alerts.length]);

  if (alerts.length === 0) return null;

  const alert = alerts[index] ?? alerts[0];
  const hasMany = alerts.length > 1;

  const prev = () => setIndex((i) => (i <= 0 ? alerts.length - 1 : i - 1));
  const next = () => setIndex((i) => (i >= alerts.length - 1 ? 0 : i + 1));

  return (
    <div className="ls-dashboard-alert-carousel">
      {hasMany ? (
        <button type="button" className="ls-dashboard-alert-carousel__nav" onClick={prev} aria-label="Alerta anterior">
          <ChevronLeft size={16} strokeWidth={2.2} />
        </button>
      ) : null}

      <div className={`ls-dashboard-alert-carousel__card border border-gray-100/80 border-l-[3px] ${severityClass(alert.severity)}`}>
        <div className="ls-dashboard-alert-carousel__content">
          <span className="ls-dashboard-alert-carousel__title">{alert.title}</span>
          <span className="ls-dashboard-alert-carousel__sep" aria-hidden>
            ·
          </span>
          <span className="ls-dashboard-alert-carousel__message">{alert.message}</span>
        </div>
        {hasMany ? (
          <span className="ls-dashboard-alert-carousel__count">
            {index + 1}/{alerts.length}
          </span>
        ) : null}
      </div>

      {hasMany ? (
        <button type="button" className="ls-dashboard-alert-carousel__nav" onClick={next} aria-label="Próximo alerta">
          <ChevronRight size={16} strokeWidth={2.2} />
        </button>
      ) : null}
    </div>
  );
};

export default DashboardAlertCarousel;
