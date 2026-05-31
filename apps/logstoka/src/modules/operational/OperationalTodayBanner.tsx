import React from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLogstokaBranding } from '@/context/LogstokaBrandingContext';
import type { DayFlowPlan } from '@/lib/operationalProfile';
import { printOperationalDayBannerGuide } from '@/lib/printOperationalDayBannerGuide';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import './operationalTodayBanner.css';

type Props = {
  plan: DayFlowPlan;
};

const OperationalTodayBanner: React.FC<Props> = ({ plan }) => {
  const { branding } = useLogstokaBranding();

  const handlePrintGuide = () => {
    try {
      printOperationalDayBannerGuide({
        plan,
        companyName: branding.companyName ?? 'LogStoka WMS',
        logoUrl: branding.logoUrl,
      });
    } catch {
      toast.error('Permita pop-ups para imprimir o guia do dia');
    }
  };

  return (
    <div className="ls-op-today-banner" role="status" aria-live="polite">
        <Clock3 size={18} className="ls-op-today-banner__icon" aria-hidden />
        <div className="ls-op-today-banner__text">
          <strong>{plan.weekdayLabel}</strong>
          <span>— processar vendas de </span>
          <strong>{plan.processSaleDays.join(' + ') || '—'}</strong>
        </div>
        <span className="ls-op-today-banner__sep" aria-hidden>
          ·
        </span>
        <div className="ls-op-today-banner__chip">
          Saída até <strong>{plan.dailyCutoff}</strong>
        </div>
        <span className="ls-op-today-banner__sep" aria-hidden>
          ·
        </span>
        <div className="ls-op-today-banner__chip">
          Pendências até <strong>{plan.backlogCutoff}</strong>
        </div>
        <div className="ls-op-today-banner__actions">
          <Link to={LOGSTOKA_ROUTES.OPERATIONAL_FLOW} className="ls-op-today-banner__link">
            Fluxo
          </Link>
          <button type="button" className="ls-op-today-banner__print" onClick={handlePrintGuide}>
            <Printer size={14} aria-hidden />
            Guia
          </button>
        </div>
    </div>
  );
};

export default OperationalTodayBanner;
