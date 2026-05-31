import { LOGSTOKA_AI_BRAND } from '@/modules/ai/constants';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileUp, History, Printer, RefreshCw, ScanText, Share2, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ImportExcelWizardModal from '@/components/imports/ImportExcelWizardModal';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaTableIconToolbar from '@/components/ui/LogstokaTableIconToolbar';
import LogstokaAddIconButton from '@/components/ui/LogstokaAddIconButton';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import {
  appendDemoImport,
  appendDemoImportFromSpreadsheet,
  estimateDemoImportFromFile,
  loadMergedDemoImports,
} from '@/lib/demoImportStore';
import type { ImportValidationResult } from '@/lib/importSpreadsheetValidator';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { logstokaApi } from '@/lib/logstokaApi';
import { pulseLogstokaSystem } from '@/lib/logstokaSystemPulse';
import { supabase } from '@/lib/supabase';
import ClickableTableRow from '@/components/ui/ClickableTableRow';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useTablePagination } from '@/hooks/useTablePagination';

interface ImportRecord {
  id: string;
  file_name: string;
  file_type: string;
  status: string;
  rows_processed: number;
  created_at: string;
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function preventDragDefaults(event: React.DragEvent) {
  event.preventDefault();
  event.stopPropagation();
}

const ImportsPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const demo = isLogstokaDemoCompany(companyId);
  const inputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [fileDropActive, setFileDropActive] = useState(false);
  const [ocrDropActive, setOcrDropActive] = useState(false);
  const [excelWizardOpen, setExcelWizardOpen] = useState(false);

  const loadImports = useCallback(async () => {
    if (!companyId) {
      setImports([]);
      return;
    }
    if (demo) {
      setImports(loadMergedDemoImports(companyId));
      return;
    }
    try {
      const res = await logstokaApi.getImports();
      setImports((res.data ?? []) as ImportRecord[]);
      return;
    } catch {
      /* fallback Supabase */
    }
    const { data } = await supabase
      .from('ls_reports_imports')
      .select('id, file_name, file_type, status, rows_processed, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50);
    setImports((data ?? []) as ImportRecord[]);
  }, [companyId, demo]);

  useEffect(() => {
    void loadImports();
  }, [loadImports]);

  useEffect(() => {
    const refresh = () => void loadImports();
    window.addEventListener('logstoka:system-pulse', refresh);
    window.addEventListener('logstoka:demo-imports-updated', refresh);
    return () => {
      window.removeEventListener('logstoka:system-pulse', refresh);
      window.removeEventListener('logstoka:demo-imports-updated', refresh);
    };
  }, [loadImports]);

  const registerDemoImport = useCallback(
    async (file: File) => {
      if (!companyId) return;
      const { fileType, rows, status } = await estimateDemoImportFromFile(file);
      appendDemoImport(companyId, {
        id: `imp-${Date.now()}`,
        file_name: file.name,
        file_type: fileType,
        status,
        rows_processed: rows,
        created_at: new Date().toISOString(),
      });
      pulseLogstokaSystem();
      await loadImports();
      toast.success(`[Demo] ${file.name} importado — ${rows} linha(s) processada(s)`);
    },
    [companyId, loadImports],
  );

  const handleSpreadsheetApply = useCallback(
    (file: File, result: ImportValidationResult) => {
      if (!companyId) return;
      appendDemoImportFromSpreadsheet(companyId, file, result, true);
      void loadImports();
    },
    [companyId, loadImports],
  );

  const { paginatedItems, footerProps } = useTablePagination(imports);

  const kpis = useMemo(() => {
    const success = imports.filter((row) => row.status === 'completed' || row.status === 'success').length;
    const rows = imports.reduce((sum, row) => sum + (row.rows_processed ?? 0), 0);
    const last = imports[0]?.created_at;
    return {
      total: imports.length,
      success,
      rows,
      last: last ? new Date(last).toLocaleDateString('pt-BR') : '—',
    };
  }, [imports]);

  const handleFile = async (file: File) => {
    if (demo) {
      setLoading(true);
      try {
        await registerDemoImport(file);
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

      if (ext === 'xml') {
        const text = await file.text();
        const result = await logstokaApi.importXml(text);
        toast.success(`NF-e importada — ${result.items} itens (NF ${result.invoiceNumber ?? '—'})`);
      } else if (ext === 'csv' || ext === 'txt') {
        const text = await file.text();
        const validation = await logstokaApi.aiValidateImport({ file_type: 'csv', content: text }).catch(() => null);
        if (validation && !validation.valid) {
          toast.error(`IA: ${validation.summary} (${validation.issues.length} alerta(s))`);
        }
        const result = await logstokaApi.importReport(text, file.name);
        toast.success(`Relatório importado — ${result.rowsProcessed} linhas, ${result.movements} saídas`);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const base64 = await fileToBase64(file);
        const validation = await logstokaApi.aiValidateImport({ file_type: 'xlsx', base64 }).catch(() => null);
        if (validation && !validation.valid) {
          toast.error(`IA: ${validation.summary}`);
        }
        const result = await logstokaApi.importExcel(base64, file.name);
        toast.success(`Excel importado — ${result.rowsProcessed} linhas, ${result.movements} saídas`);
      } else if (ext === 'pdf') {
        const base64 = await fileToBase64(file);
        const result = await logstokaApi.importPdf(base64, file.name);
        toast.success(`PDF importado — ${result.rowsProcessed} linhas, ${result.movements} saídas`);
      } else {
        toast.error('Formato não suportado. Use XML, CSV, XLSX ou PDF.');
        return;
      }

      pulseLogstokaSystem();
      await loadImports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha na importação');
    } finally {
      setLoading(false);
    }
  };

  const handleOcrFile = async (file: File) => {
    if (demo) {
      setOcrLoading(true);
      try {
        await registerDemoImport(file);
      } finally {
        setOcrLoading(false);
      }
      return;
    }
    setOcrLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await logstokaApi.importOcr({
        base64,
        mime_type: file.type || 'image/jpeg',
        file_name: file.name,
      });
      toast.success(`OCR concluído — ${result.rowsProcessed} linhas, ${result.movements} saídas`);
      pulseLogstokaSystem();
      await loadImports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha no OCR');
    } finally {
      setOcrLoading(false);
    }
  };

  const onFileDrop = (event: React.DragEvent) => {
    preventDragDefaults(event);
    setFileDropActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const onOcrDrop = (event: React.DragEvent) => {
    preventDragDefaults(event);
    setOcrDropActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleOcrFile(file);
  };

  return (
    <div className="space-y-6">
      <LogstokaPageHeader
        icon={<FileUp size={20} strokeWidth={2.25} />}
        title="Centro de Importação"
        subtitle="NF-e, planilhas, TXT, PDF e OCR — entradas e saídas em lote"
        actions={
          <LogstokaAddIconButton
            variant="dark"
            title="Importar vendas / relatório"
            onClick={() => setExcelWizardOpen(true)}
          />
        }
      />

      <LogstokaKpiStrip
        items={[
          { label: 'Importações', value: kpis.total },
          { label: 'Concluídas', value: kpis.success },
          { label: 'Linhas processadas', value: kpis.rows.toLocaleString('pt-BR') },
          { label: 'Última importação', value: kpis.last },
        ]}
      />

      <div className="ls-card rounded-[24px] border border-orange-100 bg-gradient-to-br from-[#fffaf5] to-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 font-black text-[#383838]">
              <Sparkles size={20} className="text-orange-600" />
              Vendas da semana — qualquer formato
            </div>
            <p className="max-w-2xl text-sm font-semibold text-[#525252]">
              Para estoquistas sem API de marketplace: envie Excel, CSV, TXT, PDF ou exportação de loja.
              O {LOGSTOKA_AI_BRAND} identifica o tipo de arquivo, mapeia colunas e valida sku, quantidade,
              marketplace e loja antes de gerar saídas no estoque.
            </p>
          </div>
          <LogstokaAddIconButton
            variant="dark"
            title="Importar vendas / relatório"
            onClick={() => setExcelWizardOpen(true)}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div
          className={`ls-card rounded-[24px] border transition-colors ${
            fileDropActive ? 'border-orange-400 bg-orange-50/40' : 'border-slate-100'
          }`}
          onDragEnter={(e) => {
            preventDragDefaults(e);
            setFileDropActive(true);
          }}
          onDragOver={preventDragDefaults}
          onDragLeave={(e) => {
            preventDragDefaults(e);
            setFileDropActive(false);
          }}
          onDrop={onFileDrop}
        >
          <div className="mb-3 flex items-center gap-2 font-black text-[#383838]">
            <FileUp size={18} className="text-orange-600" />
            Upload NF-e / Relatório
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xml,.csv,.txt,.xlsx,.xls,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = '';
            }}
          />
          <button type="button" className="ls-btn-primary" disabled={loading} onClick={() => inputRef.current?.click()}>
            {loading ? 'Processando…' : 'Selecionar arquivo'}
          </button>
          <p className="mt-3 text-xs text-[#828282]">
            XML NF-e gera entrada automática. CSV, Excel, TXT ou PDF com colunas sku, quantidade, marketplace e loja
            geram saídas — o {LOGSTOKA_AI_BRAND} detecta o formato.
            {demo ? ' Arraste o arquivo aqui ou use o botão.' : ' Arraste o arquivo para importar.'}
          </p>
        </div>

        <div
          className={`ls-card rounded-[24px] border transition-colors ${
            ocrDropActive ? 'border-orange-400 bg-orange-50/40' : 'border-slate-100'
          }`}
          onDragEnter={(e) => {
            preventDragDefaults(e);
            setOcrDropActive(true);
          }}
          onDragOver={preventDragDefaults}
          onDragLeave={(e) => {
            preventDragDefaults(e);
            setOcrDropActive(false);
          }}
          onDrop={onOcrDrop}
        >
          <div className="mb-3 flex items-center gap-2 font-black text-[#383838]">
            <ScanText size={18} className="text-orange-600" />
            OCR / imagem
          </div>
          <p className="text-sm text-[#525252]">
            Envie foto ou PDF escaneado. O {LOGSTOKA_AI_BRAND} extrai linhas automaticamente e registra movimentações.
          </p>
          <input
            ref={ocrInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleOcrFile(file);
              e.target.value = '';
            }}
          />
          <button type="button" className="ls-btn-secondary mt-4" disabled={ocrLoading} onClick={() => ocrInputRef.current?.click()}>
            {ocrLoading ? 'Processando OCR…' : 'Enviar imagem ou PDF'}
          </button>
        </div>
      </div>

      <section className="ls-entry-card ls-page-table">
        <div className="ls-entry-card__head">
          <div className="mb-0 flex items-center gap-2 font-black text-[#383838]">
            <History size={18} />
            Histórico de importações
          </div>
          <LogstokaTableIconToolbar
            ariaLabel="Ações do histórico"
            actions={[
              {
                key: 'refresh',
                label: 'Atualizar histórico',
                icon: <RefreshCw size={18} strokeWidth={2} className={loading ? 'animate-spin' : undefined} />,
                onClick: () => void loadImports(),
              },
              {
                key: 'upload',
                label: 'Nova importação inteligente',
                icon: <FileUp size={18} strokeWidth={2} />,
                onClick: () => setExcelWizardOpen(true),
                accent: true,
              },
              {
                key: 'print',
                label: 'Imprimir histórico',
                icon: <Printer size={18} strokeWidth={2} />,
                onClick: () => toast('Imprimir histórico de importações'),
                separatorBefore: true,
              },
              {
                key: 'export',
                label: 'Exportar CSV',
                icon: <Download size={18} strokeWidth={2} />,
                onClick: () => toast('Exportar histórico CSV'),
              },
              {
                key: 'share',
                label: 'Compartilhar',
                icon: <Share2 size={18} strokeWidth={2} />,
                onClick: () => toast('Lista copiada'),
              },
            ]}
          />
        </div>
        <div className="ls-table-wrap">
          <table className="ls-table">
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Linhas</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {imports.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    Nenhuma importação registrada.
                  </td>
                </tr>
              )}
              {paginatedItems.map((row) => (
                <ClickableTableRow key={row.id} to={`/app/imports/${row.id}`}>
                  <td>{row.file_name}</td>
                  <td>{row.file_type}</td>
                  <td>
                    <span className="ls-badge bg-slate-100 text-slate-700">{row.status}</span>
                  </td>
                  <td>{row.rows_processed ?? 0}</td>
                  <td>{new Date(row.created_at).toLocaleString('pt-BR')}</td>
                </ClickableTableRow>
              ))}
            </tbody>
          </table>
        </div>
        <LogstokaTableFooter {...footerProps} hidden={imports.length === 0} />
      </section>

      <ImportExcelWizardModal
        open={excelWizardOpen}
        onClose={() => setExcelWizardOpen(false)}
        onVerifiedApply={handleSpreadsheetApply}
      />
    </div>
  );
};

export default ImportsPage;
