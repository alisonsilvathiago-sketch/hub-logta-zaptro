import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';

export type LogstokaDetailPageLayoutProps = {
  backTo: string;
  backLabel?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** Oculta título/subtítulo/ações — conteúdo fica só no corpo (ex: hero do produto) */
  hideTitleRow?: boolean;
  children: React.ReactNode;
};

export function LogstokaDetailPageLayout({
  backTo,
  backLabel = 'Voltar',
  title,
  subtitle,
  actions,
  hideTitleRow = false,
  children,
}: LogstokaDetailPageLayoutProps) {
  const showTitleRow = !hideTitleRow && (title || subtitle || actions);

  return (
    <div className="space-y-6">
      <Link
        to={backTo}
        className="inline-flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 hover:text-orange-800"
      >
        <ArrowLeft size={16} />
        {backLabel}
      </Link>

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
