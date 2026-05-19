import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  Search,
} from 'lucide-react';
import {
  downloadExcelCsv,
  downloadPdfTable,
  printTabularArea,
  type TabularExport,
  type TabularExportMeta,
} from '../lib/reportExport';
import { showToast } from './Toast';

export type LogtaDataTableProps = {
  title: string;
  filenameBase: string;
  getExportData: (scope: 'filtered' | 'all') => TabularExport;
  children: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterSlot?: React.ReactNode;
  toolbarExtra?: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  empty?: React.ReactNode;
  className?: string;
  showSearch?: boolean;
  page?: number;
  totalPages?: number;
  totalItems?: number;
  filteredItems?: number;
  onPageChange?: (page: number) => void;
  selectedCount?: number;
  onClearSelection?: () => void;
  exportMeta?: Omit<TabularExportMeta, 'exportScope' | 'filtersSummary'>;
  filtersSummary?: string;
};

export function LogtaDataTable({
  title,
  filenameBase,
  getExportData,
  children,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar…',
  filterSlot,
  toolbarExtra,
  loading = false,
  loadingLabel = 'Carregando…',
  empty,
  className = '',
  showSearch = true,
  page,
  totalPages,
  totalItems,
  filteredItems,
  onPageChange,
  selectedCount = 0,
  onClearSelection,
  exportMeta,
  filtersSummary,
}: LogtaDataTableProps) {
  const [exporting, setExporting] = React.useState<'pdf' | 'excel' | null>(null);
  const printRef = React.useRef<HTMLDivElement>(null);

  const runExport = async (format: 'pdf' | 'excel', scope: 'filtered' | 'all') => {
    setExporting(format);
    try {
      const base = getExportData(scope);
      const data: TabularExport = {
        ...base,
        meta: {
          ...exportMeta,
          exportScope: scope,
          filtersSummary: filtersSummary ?? base.meta?.filtersSummary,
          generatedAt: base.meta?.generatedAt ?? new Date().toLocaleString('pt-BR'),
        },
      };
      if (format === 'excel') downloadExcelCsv(data);
      else downloadPdfTable(data);
      showToast(
        'success',
        format === 'excel'
          ? 'Planilha gerada (.csv compatível com Excel).'
          : 'Documento PDF gerado com identidade Logta.',
        'Exportação concluída',
      );
    } catch {
      showToast('error', 'Não foi possível gerar o arquivo.', 'Erro na exportação');
    } finally {
      setExporting(null);
    }
  };

  const handlePrint = () => {
    printTabularArea(printRef.current);
    showToast('info', 'Abrindo visualização de impressão.', 'Imprimir');
  };

  const showPagination =
    typeof page === 'number' && typeof totalPages === 'number' && totalPages > 1 && onPageChange;

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {showSearch && onSearchChange ? (
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 sm:left-4" />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-10 pr-3 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-primary/50 sm:py-4 sm:pl-12"
              />
            </div>
          ) : null}
          {filterSlot}
          {toolbarExtra}
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            disabled={!!exporting}
            onClick={() => void runExport('pdf', 'filtered')}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-normal text-gray-700 shadow-sm transition-all hover:border-primary/30 hover:text-primary disabled:opacity-60"
          >
            {exporting === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            Exportar PDF
          </button>
          <button
            type="button"
            disabled={!!exporting}
            onClick={() => void runExport('excel', 'filtered')}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-normal text-gray-700 shadow-sm transition-all hover:border-primary/30 hover:text-primary disabled:opacity-60"
          >
            {exporting === 'excel' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={16} />
            )}
            Exportar Excel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-normal text-gray-700 shadow-sm transition-all hover:border-primary/30 hover:text-primary"
          >
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>

      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 print:hidden">
          <p className="text-xs font-bold text-gray-800">
            <span className="font-black text-primary">{selectedCount}</span> registro(s) selecionado(s)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void runExport('pdf', 'filtered')}
              className="rounded-xl bg-primary px-3 py-2 text-[10px] font-black uppercase text-white"
            >
              Exportar seleção PDF
            </button>
            <button
              type="button"
              onClick={() => void runExport('excel', 'filtered')}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase text-gray-800"
            >
              Exportar seleção Excel
            </button>
            {onClearSelection ? (
              <button
                type="button"
                onClick={onClearSelection}
                className="rounded-xl px-3 py-2 text-[10px] font-bold text-gray-500 hover:text-gray-900"
              >
                Limpar
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        ref={printRef}
        className="logta-panel-card flex min-h-[280px] min-w-0 flex-col overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm sm:rounded-[40px]"
      >
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-xs font-bold uppercase tracking-normal text-gray-400">{loadingLabel}</p>
          </div>
        ) : empty ? (
          empty
        ) : (
          <div className="logta-table-wrap min-w-0 flex-1">{children}</div>
        )}
      </div>

      {showPagination ? (
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="text-xs font-semibold text-gray-500">
            {filteredItems ?? totalItems ?? 0} registro(s)
            {typeof totalItems === 'number' && filteredItems !== totalItems
              ? ` · ${totalItems} no total`
              : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-xl border border-gray-200 p-2 text-gray-600 disabled:opacity-40"
              aria-label="Página anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="min-w-[4rem] text-center text-xs font-black text-gray-800">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-xl border border-gray-200 p-2 text-gray-600 disabled:opacity-40"
              aria-label="Próxima página"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      ) : null}

      <p className="text-[10px] font-semibold text-gray-400 print:hidden">
        {title} · Exportação PDF/Excel com filtros, data e responsável · Logta
      </p>
    </div>
  );
}
