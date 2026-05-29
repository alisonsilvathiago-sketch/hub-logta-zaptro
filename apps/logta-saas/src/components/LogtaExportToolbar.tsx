import React from 'react';
import { Download, FileText, Loader2, Printer } from 'lucide-react';

export const LOGTA_EXPORT_BTN_CLASS = 'logta-export-btn';

export type LogtaExportToolbarProps = {
  children: React.ReactNode;
  className?: string;
};

export function LogtaExportToolbar({ children, className = '' }: LogtaExportToolbarProps) {
  return (
    <div className={`flex shrink-0 flex-wrap items-center gap-2 ${className}`.trim()}>{children}</div>
  );
}

type ExportBtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function LogtaExportPdfButton({ loading, className, children = 'PDF', ...props }: ExportBtnProps) {
  return (
    <button
      type="button"
      title="Exportar PDF"
      aria-label="Exportar PDF"
      {...props}
      className={[LOGTA_EXPORT_BTN_CLASS, className].filter(Boolean).join(' ')}
    >
      {loading ? <Loader2 size={16} className="animate-spin shrink-0" /> : <FileText size={16} className="shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

export function LogtaExportExcelButton({ loading, className, children = 'Excel', ...props }: ExportBtnProps) {
  return (
    <button
      type="button"
      title="Exportar Excel"
      aria-label="Exportar Excel"
      {...props}
      className={[LOGTA_EXPORT_BTN_CLASS, className].filter(Boolean).join(' ')}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin shrink-0" />
      ) : (
        <Download size={16} className="shrink-0" />
      )}
      <span>{children}</span>
    </button>
  );
}

export function LogtaExportPrintButton({ className, children = 'Imprimir', ...props }: ExportBtnProps) {
  return (
    <button
      type="button"
      title="Imprimir"
      aria-label="Imprimir"
      {...props}
      className={[LOGTA_EXPORT_BTN_CLASS, className].filter(Boolean).join(' ')}
    >
      <Printer size={16} className="shrink-0" />
      <span>{children}</span>
    </button>
  );
}

export type LogtaDataTableExportActionsProps = {
  onPrint: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
  exporting: 'pdf' | 'excel' | null;
  /** Ex.: botão + novo colaborador após exportação */
  trailing?: React.ReactNode;
};

/** PDF + Excel + Imprimir no padrão pill (ícone + texto) para `LogtaDataTable.renderInlineActions`. */
export function LogtaDataTableExportActions({
  onPrint,
  onExportPdf,
  onExportExcel,
  exporting,
  trailing,
}: LogtaDataTableExportActionsProps) {
  return (
    <>
      <LogtaExportPrintButton onClick={onPrint} />
      <LogtaExportPdfButton
        onClick={onExportPdf}
        disabled={!!exporting}
        loading={exporting === 'pdf'}
      />
      <LogtaExportExcelButton
        onClick={onExportExcel}
        disabled={!!exporting}
        loading={exporting === 'excel'}
      />
      {trailing}
    </>
  );
}
