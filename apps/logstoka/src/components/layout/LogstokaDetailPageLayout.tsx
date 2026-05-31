import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaXRayTrigger from '@/modules/ai/auditor/LogstokaXRayTrigger';

export type LogstokaDetailPageLayoutProps = {
  backTo: string;
  backLabel?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** Oculta título/subtítulo/ações — conteúdo fica só no corpo (ex: hero do produto) */
  hideTitleRow?: boolean;
  children: React.ReactNode;
  topRightActions?: React.ReactNode;
};

export function LogstokaDetailPageLayout({
  backTo,
  backLabel = 'Voltar',
  title,
  subtitle,
  actions,
  hideTitleRow = false,
  children,
  topRightActions,
}: LogstokaDetailPageLayoutProps) {
  const showTitleRow = !hideTitleRow && (title || subtitle || actions);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 w-full">
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 rounded-[14px] px-3.5 py-2 text-xs font-bold text-orange-700 transition bg-orange-50/50 border border-orange-100/30 hover:bg-orange-50 hover:text-orange-800 active:scale-95 shadow-sm"
        >
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
        {topRightActions ? (
          <div className="flex items-center gap-2">{topRightActions}</div>
        ) : (
          <LogstokaXRayTrigger />
        )}
      </div>

      {showTitleRow ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {title ? <h2 className={LOGSTOKA_PAGE_TITLE_CLASS}>{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}

      {children}
    </div>
  );
}
