import React, { useEffect, useRef, useState } from 'react';
import { FileUp, ScanText, History } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { logstokaApi } from '@/lib/logstokaApi';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  const loadImports = async () => {
    try {
      const res = await logstokaApi.getImports();
      setImports((res.data ?? []) as ImportRecord[]);
    } catch {
      /* API offline — lista vazia */
    }
  };

  useEffect(() => {
    void loadImports();
  }, []);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

      if (ext === 'xml') {
        const text = await file.text();
        const result = await logstokaApi.importXml(text);
        toast.success(`NF-e importada — ${result.items} itens (NF ${result.invoiceNumber ?? '—'})`);
      } else if (ext === 'csv' || ext === 'txt') {
        const text = await file.text();
        const result = await logstokaApi.importReport(text, file.name);
        toast.success(`Relatório importado — ${result.rowsProcessed} linhas, ${result.movements} saídas`);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const base64 = await fileToBase64(file);
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
      <div>
        <h2 className="text-2xl font-black">Centro de Importação</h2>
        <p className="text-sm text-slate-500">NF-e XML, relatórios CSV/Excel/PDF e OCR via Llama 3.2</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="ls-card">
          <div className="mb-3 flex items-center gap-2 font-black">
            <FileUp size={18} className="text-emerald-600" />
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
          <button
            type="button"
            className="ls-btn-primary"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            {loading ? 'Processando…' : 'Selecionar arquivo'}
          </button>
          <p className="mt-3 text-xs text-slate-500">
            XML NF-e gera entrada automática. CSV/Excel/PDF com colunas sku, quantidade, marketplace e loja geram saídas.
          </p>
        </div>

        <div className="ls-card">
          <div className="mb-3 flex items-center gap-2 font-black">
            <ScanText size={18} className="text-emerald-600" />
            OCR / imagem
          </div>
          <p className="text-sm text-slate-600">
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
          <button
            type="button"
            className="ls-btn-secondary mt-4"
            disabled={ocrLoading}
            onClick={() => ocrInputRef.current?.click()}
          >
            {ocrLoading ? 'Processando OCR…' : 'Enviar imagem ou PDF'}
          </button>
        </div>
      </div>

      <div className="ls-card">
        <div className="mb-4 flex items-center gap-2 font-black">
          <History size={18} />
          Histórico de importações
        </div>
        <div className="ls-table-wrap border-0">
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
              {imports.map((row) => (
                <tr key={row.id}>
                  <td>{row.file_name}</td>
                  <td>{row.file_type}</td>
                  <td>
                    <span className="ls-badge bg-slate-100 text-slate-700">{row.status}</span>
                  </td>
                  <td>{row.rows_processed ?? 0}</td>
                  <td>{new Date(row.created_at).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ImportsPage;
