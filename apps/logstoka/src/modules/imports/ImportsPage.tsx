import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileUp, ScanText, History } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_IMPORTS } from '@/lib/logstokaDemoSeed';
import { logstokaApi } from '@/lib/logstokaApi';
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

const ImportsPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const inputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  const loadImports = async () => {
    if (isLogstokaDemoCompany(companyId)) {
      setImports(DEMO_IMPORTS);
      return;
    }
    try {
      const res = await logstokaApi.getImports();
      setImports((res.data ?? []) as ImportRecord[]);
    } catch {
      /* API offline — lista vazia */
    }
  };

  useEffect(() => {
    void loadImports();
  }, [companyId]);

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
    if (isLogstokaDemoCompany(companyId)) {
      toast.success(`[Demo] ${file.name} importado — dados demo atualizados`);
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

      await loadImports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha na importação');
    } finally {
      setLoading(false);
    }
  };

  const handleOcrFile = async (file: File) => {
    if (isLogstokaDemoCompany(companyId)) {
      toast.success(`[Demo] OCR ${file.name} — 24 linhas extraídas`);
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
      await loadImports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha no OCR');
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="ls-movement-scan__page-header !border-0 !px-0 !pb-0">
        <h2 className="ls-movement-scan__page-title">
          <span className="ls-movement-scan__page-title-icon">
            <FileUp size={20} strokeWidth={2.25} aria-hidden />
          </span>
          Centro de Importação
        </h2>
      </div>

      <LogstokaKpiStrip
        items={[
          { label: 'Importações', value: kpis.total },
          { label: 'Concluídas', value: kpis.success },
          { label: 'Linhas processadas', value: kpis.rows.toLocaleString('pt-BR') },
          { label: 'Última importação', value: kpis.last },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="ls-card rounded-[24px] border border-slate-100">
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
            XML NF-e gera entrada automática. CSV/Excel/PDF com colunas sku, quantidade, marketplace e loja geram saídas.
          </p>
        </div>

        <div className="ls-card rounded-[24px] border border-slate-100">
          <div className="mb-3 flex items-center gap-2 font-black text-[#383838]">
            <ScanText size={18} className="text-orange-600" />
            OCR / imagem
          </div>
          <p className="text-sm text-[#525252]">
            Envie foto ou PDF escaneado. A API extrai linhas via Llama 3.2 (Ollama) e registra movimentações.
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

      <section className="ls-page-table">
        <div className="mb-4 flex items-center gap-2 px-1 font-black text-[#383838]">
          <History size={18} />
          Histórico de importações
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
    </div>
  );
};

export default ImportsPage;
