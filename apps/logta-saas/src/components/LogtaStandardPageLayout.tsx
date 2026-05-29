import React from 'react';
import { LogtaExportExcelButton, LogtaExportPdfButton, LogtaExportToolbar } from './LogtaExportToolbar';
import { LogtaKpiStrip } from './LogtaKpiStrip';

export type KPICardProps = {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: any;
};

/** Nome/título principal de cada linha nas listas do layout padrão (14px). */
export const LOGTA_STANDARD_ROW_TITLE_CLASS =
  'truncate text-[14px] font-bold text-gray-900';

export type LogtaStandardPageLayoutProps = {
  title?: string;
  kpis?: KPICardProps[];
  mainContentTitle?: string;
  mainContentAction?: React.ReactNode;
  children: React.ReactNode;
  sidePanel?: React.ReactNode;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
};

export function LogtaStandardPageLayout({
  title,
  kpis = [],
  mainContentTitle,
  mainContentAction,
  children,
  sidePanel,
  onExportPdf,
  onExportExcel,
}: LogtaStandardPageLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Opcional: Cabeçalho com ações globais */}
      {(title || onExportPdf || onExportExcel) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          {title && <h2 className="text-[17px] font-black leading-snug text-gray-900">{title}</h2>}
          <LogtaExportToolbar>
            {onExportPdf ? <LogtaExportPdfButton onClick={onExportPdf} /> : null}
            {onExportExcel ? <LogtaExportExcelButton onClick={onExportExcel} /> : null}
          </LogtaExportToolbar>
        </div>
      )}

      {kpis.length > 0 ? (
        <LogtaKpiStrip
          items={kpis.map((kpi) => ({
            label: kpi.title,
            value: kpi.value,
            icon: kpi.icon,
            trend: kpi.trend,
            trendValue: kpi.trendValue,
          }))}
        />
      ) : null}

      {/* Área Principal + Painel Lateral */}
      <div className={`grid grid-cols-1 ${sidePanel ? 'lg:grid-cols-3' : ''} gap-8`}>
        
        {/* Main Content (Lista / Timeline / Tabela) */}
        <div className={`rounded-[32px] border border-gray-100 bg-white p-6 sm:p-8 shadow-sm ${sidePanel ? 'lg:col-span-2' : ''}`}>
          {(mainContentTitle || mainContentAction) && (
            <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
              <h3 className="!text-[15px] font-black text-gray-500 uppercase tracking-widest">{mainContentTitle || 'Registros'}</h3>
              {mainContentAction && <div>{mainContentAction}</div>}
            </div>
          )}
          <div className="space-y-4">
            {children}
          </div>
        </div>

        {/* Side Panel Inteligente (IA / Resumo) */}
        {sidePanel && (
          <div className="space-y-6">
            {sidePanel}
          </div>
        )}

      </div>
    </div>
  );
}
