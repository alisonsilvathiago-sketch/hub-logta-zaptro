import { FileSpreadsheet, FileText, X } from 'lucide-react';
import { downloadExcelCsv, downloadPdfTable, type TabularExport } from '../lib/reportExport';
import { showToast } from './Toast';

export type ExportFormatModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  getTabularData: () => TabularExport;
};

export function ExportFormatModal({
  open,
  onClose,
  title = 'Exportar',
  description = 'Escolha o formato do arquivo para download.',
  getTabularData,
}: ExportFormatModalProps) {
  if (!open) return null;

  const run = (format: 'pdf' | 'excel') => {
    try {
      const data = getTabularData();
      if (format === 'excel') downloadExcelCsv(data);
      else downloadPdfTable(data);
      showToast(
        'success',
        format === 'excel'
          ? 'Planilha gerada (.csv compatível com Excel).'
          : 'Documento PDF gerado.',
        'Exportação concluída'
      );
      onClose();
    } catch {
      showToast('error', 'Não foi possível gerar o arquivo. Tente novamente.', 'Erro na exportação');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-200 items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        className="relative max-h-[min(92dvh,640px)] w-full max-w-md overflow-y-auto rounded-t-[28px] border border-neutral-800 bg-[#18191B] p-6 text-left shadow-2xl duration-200 animate-in zoom-in-95 sm:rounded-[40px] sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-format-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
        <h2 id="export-format-title" className="logta-modal-title pr-10">
          {title}
        </h2>
        <p className="mt-2 text-sm font-medium text-neutral-400">{description}</p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => run('pdf')}
            className="flex flex-col items-start gap-2 rounded-2xl border border-neutral-700 bg-neutral-900/60 p-5 text-left transition-all hover:border-neutral-500 hover:bg-neutral-900"
          >
            <FileText size={22} className="text-white" />
            <span className="text-sm font-black text-white">PDF</span>
            <span className="text-[11px] font-bold text-neutral-500">Documento para leitura e arquivo</span>
          </button>
          <button
            type="button"
            onClick={() => run('excel')}
            className="flex flex-col items-start gap-2 rounded-2xl border border-neutral-700 bg-neutral-900/60 p-5 text-left transition-all hover:border-primary/50 hover:bg-neutral-900"
          >
            <FileSpreadsheet size={22} className="text-primary" />
            <span className="text-sm font-black text-white">Excel</span>
            <span className="text-[11px] font-bold text-neutral-500">Arquivo .csv (abre no Excel)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl border border-neutral-700 py-3 text-sm font-bold text-neutral-300 transition-colors hover:bg-neutral-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
