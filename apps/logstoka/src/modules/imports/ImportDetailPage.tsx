import React, { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileUp,
  RefreshCw,
  ScanLine,
  Sheet,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ImportVerifyOverlay from '@/components/imports/ImportVerifyOverlay';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import {
  appendDemoImportFromSpreadsheet,
  getDemoImportById,
  updateDemoImport,
} from '@/lib/demoImportStore';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import {
  downloadOfficialImportTemplate,
  openGoogleSheetsForEdit,
  parseSpreadsheetFile,
} from '@/lib/importSpreadsheetParser';
import { validateImportSpreadsheet, type ImportValidationResult } from '@/lib/importSpreadsheetValidator';
import { LOGSTOKA_AI_BRAND } from '@/modules/ai/constants';
import '@/components/operational/operationalDetailShared.css';
import './importDetailPage.css';

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    completed: 'Concluída',
    success: 'Concluída',
    failed: 'Com erros',
    validated: 'Validada',
    warning: 'Alerta',
    pending: 'Pendente',
  };
  return map[status] ?? status;
}

function statusBadgeClass(status: string): string {
  if (status === 'completed' || status === 'success') return 'bg-emerald-50 text-emerald-700';
  if (status === 'failed') return 'bg-rose-50 text-rose-700';
  if (status === 'warning' || status === 'validated') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

const ImportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companyId } = useLogstokaTenant();
  const demo = isLogstokaDemoCompany(companyId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [reuploadFile, setReuploadFile] = useState<File | null>(null);

  const row = id && demo && companyId ? getDemoImportById(companyId, id) : null;
  const validation = row?.validation;

  const runRevalidate = useCallback(async (): Promise<ImportValidationResult> => {
    if (reuploadFile) {
      const parsed = await parseSpreadsheetFile(reuploadFile);
      return validateImportSpreadsheet(parsed);
    }
    if (validation?.headers?.length) {
      return validateImportSpreadsheet({
        headers: validation.headers,
        rows: validation.raw_rows,
        fileName: row?.file_name ?? 'planilha',
      });
    }
    return {
      valid: false,
      score: 0,
      rows_total: 0,
      rows_ok: 0,
      column_issues: [],
      line_issues: [],
      lines: [],
      summary: 'Sem dados para revalidar — envie o arquivo corrigido.',
      column_map: {},
      headers: [],
      raw_rows: [],
    };
  }, [reuploadFile, validation, row?.file_name]);

  const handleApply = (result: ImportValidationResult) => {
    if (!companyId || !row || !result.valid) return;
    if (reuploadFile) {
      appendDemoImportFromSpreadsheet(companyId, reuploadFile, result, true);
    } else {
      updateDemoImport(companyId, row.id, {
        status: 'completed',
        rows_processed: result.rows_ok,
        movements_created: result.rows_ok,
        validation: {
          valid: true,
          score: result.score,
          rows_total: result.rows_total,
          rows_ok: result.rows_ok,
          summary: result.summary,
          column_issues: result.column_issues,
          line_issues: result.line_issues.map((i) => ({
            row_index: i.row_index,
            message: i.message,
            severity: i.severity,
          })),
          lines: result.lines,
          headers: result.headers,
          raw_rows: result.raw_rows,
        },
      });
    }
    setVerifyOpen(false);
    toast.success(`${result.rows_ok} saída(s) aplicadas no estoque`);
    navigate('/app/imports');
  };

  if (!row) {
    return (
      <LogstokaDetailPageLayout backTo="/app/imports" title="Importação" subtitle="Registro não encontrado">
        <div className="ls-card text-sm text-slate-500">Importação não encontrada.</div>
      </LogstokaDetailPageLayout>
    );
  }

  const isSpreadsheet = row.file_type === 'xlsx' || row.file_type === 'csv' || row.file_type === 'xls';
  const columnErrors = validation?.column_issues.filter((i) => i.severity === 'error') ?? [];
  const lineIssues = validation?.line_issues ?? [];

  return (
    <LogstokaDetailPageLayout backTo="/app/imports" backLabel="Voltar para importações" hideTitleRow>
      <div className="space-y-6">
        <section className="ls-op-detail-hero">
          <div className="ls-op-detail-hero__icon" aria-hidden>
            <FileSpreadsheet size={32} strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="ls-op-detail-hero__eyebrow">Importação · {row.id}</p>
            <h1 className="ls-op-detail-hero__title">{row.file_name}</h1>
            <div className="ls-op-detail-hero__meta">
              <span className={`ls-badge ${statusBadgeClass(row.status)}`}>{statusLabel(row.status)}</span>
              <span className="ls-badge bg-[#f5f5f5] text-[#565656]">{row.file_type.toUpperCase()}</span>
              {validation ? (
                <span className="ls-badge bg-orange-50 text-orange-700">Score {validation.score}%</span>
              ) : null}
            </div>
            <p className="ls-op-detail-hero__explain">
              {validation?.summary ??
                (row.file_type === 'xml'
                  ? 'NF-e convertida em entrada automática com itens endereçados no CD.'
                  : 'Relatório processado — movimentações geradas conforme o tipo de arquivo.')}
            </p>
            <p className="mt-2 text-xs font-semibold text-[#949494]">
              {new Date(row.created_at).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="ls-op-detail-hero__aside">
            <p className="ls-op-detail-hero__qty">{row.rows_processed}</p>
            <p className="ls-op-detail-hero__qty-label">linhas processadas</p>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="ls-op-detail-kpi">
            <p className="ls-op-detail-kpi__label">Linhas OK</p>
            <p className="ls-op-detail-kpi__value">{validation?.rows_ok ?? row.rows_processed}</p>
          </div>
          <div className="ls-op-detail-kpi">
            <p className="ls-op-detail-kpi__label">Erros coluna</p>
            <p className="ls-op-detail-kpi__value">{columnErrors.length}</p>
          </div>
          <div className="ls-op-detail-kpi">
            <p className="ls-op-detail-kpi__label">Saídas geradas</p>
            <p className="ls-op-detail-kpi__value">{row.movements_created ?? (row.status === 'completed' ? row.rows_processed : 0)}</p>
          </div>
          <div className="ls-op-detail-kpi">
            <p className="ls-op-detail-kpi__label">{LOGSTOKA_AI_BRAND}</p>
            <p className="ls-op-detail-kpi__value text-lg">{validation?.valid ? 'Validado' : 'Revisar'}</p>
          </div>
        </div>

        {isSpreadsheet ? (
          <section className="ls-op-detail-panel">
            <h3 className="ls-op-detail-panel__title">Corrigir e reenviar</h3>
            <p className="mb-4 text-sm font-semibold text-[#525252]">
              Baixe o modelo, edite no Google Sheets ou reenvie o arquivo corrigido. O sistema indica coluna por coluna o que está errado.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="ls-btn-secondary text-sm" onClick={() => downloadOfficialImportTemplate()}>
                <Download size={15} />
                Baixar modelo Excel
              </button>
              <button
                type="button"
                className="ls-btn-secondary text-sm"
                onClick={() => {
                  openGoogleSheetsForEdit(validation?.headers ?? [], validation?.raw_rows ?? []);
                  toast('Dados copiados — cole no Google Sheets (Ctrl+V)', { icon: '📋' });
                }}
              >
                <Sheet size={15} />
                Editar no Google Sheets
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setReuploadFile(f);
                    setVerifyOpen(true);
                  }
                  e.target.value = '';
                }}
              />
              <button type="button" className="ls-btn-secondary text-sm" onClick={() => inputRef.current?.click()}>
                <FileUp size={15} />
                Reenviar planilha corrigida
              </button>
              <button type="button" className="ls-btn-primary text-sm" onClick={() => setVerifyOpen(true)}>
                <ScanLine size={15} />
                Verificar documento
              </button>
            </div>
          </section>
        ) : null}

        {validation && columnErrors.length > 0 ? (
          <section className="ls-op-detail-panel ls-import-detail__issues">
            <h3 className="ls-op-detail-panel__title">
              <XCircle size={16} className="mr-1 inline text-rose-600" />
              Colunas a corrigir
            </h3>
            <div className="space-y-3">
              {columnErrors.map((issue) => (
                <div key={`${issue.column_index}-${issue.message}`} className="ls-import-detail__issue ls-import-detail__issue--error">
                  <p className="font-bold text-[#383838]">
                    Coluna {issue.column_index > 0 ? issue.column_index : '—'} · {issue.column_header}
                  </p>
                  <p className="text-sm font-semibold text-[#525252]">{issue.message}</p>
                  <p className="text-xs font-semibold text-[#737373]">Formato esperado: {issue.expected}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {validation && lineIssues.length > 0 ? (
          <section className="ls-op-detail-panel">
            <h3 className="ls-op-detail-panel__title">
              <AlertTriangle size={16} className="mr-1 inline text-amber-600" />
              Linhas e alertas
            </h3>
            <div className="space-y-2">
              {lineIssues.map((issue) => (
                <div
                  key={`${issue.row_index}-${issue.message}`}
                  className={`ls-import-detail__issue${issue.severity === 'error' ? ' ls-import-detail__issue--error' : ' ls-import-detail__issue--warn'}`}
                >
                  {issue.message}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {validation && validation.lines.length > 0 ? (
          <section className="ls-op-detail-panel">
            <h3 className="ls-op-detail-panel__title">Prévia das linhas mapeadas</h3>
            <div className="ls-table-wrap">
              <table className="ls-table text-sm">
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>SKU</th>
                    <th>Qtd</th>
                    <th>Marketplace</th>
                    <th>Loja</th>
                    <th>CD</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {validation.lines.slice(0, 20).map((line) => (
                    <tr key={line.row_index}>
                      <td>{line.row_index}</td>
                      <td className="font-bold">{line.sku || '—'}</td>
                      <td className="font-black text-orange-600">{line.quantity || '—'}</td>
                      <td>{line.marketplace || '—'}</td>
                      <td>{line.store || '—'}</td>
                      <td>{line.warehouse || '—'}</td>
                      <td>
                        {line.status === 'ok' ? (
                          <CheckCircle2 size={14} className="text-emerald-600" />
                        ) : (
                          <span className="text-xs font-bold text-amber-700">{line.message}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {row.status === 'completed' ? (
          <section className="ls-op-detail-panel">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-700">
              <CheckCircle2 size={18} />
              Importação aplicada — estoque e saídas atualizados.
            </p>
            <button type="button" className="ls-btn-secondary mt-3 text-sm" onClick={() => navigate('/app/movements?tab=exit')}>
              <ExternalLink size={14} />
              Ver saídas geradas
            </button>
          </section>
        ) : null}
      </div>

      <ImportVerifyOverlay
        open={verifyOpen}
        fileName={reuploadFile?.name ?? row.file_name}
        onClose={() => setVerifyOpen(false)}
        validate={runRevalidate}
        onApply={row.status !== 'completed' ? handleApply : undefined}
      />
    </LogstokaDetailPageLayout>
  );
};

export default ImportDetailPage;
