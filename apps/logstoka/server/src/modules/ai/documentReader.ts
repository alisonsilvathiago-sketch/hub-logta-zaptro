import type { LogstokaConfig } from '../../config.js';
import type { ReportRow } from '../../services/importParser.js';
import { generateOllamaJson } from './ollamaService.js';

export type ImportValidationResult = {
  valid: boolean;
  rows_total: number;
  issues: Array<{ row?: number; sku?: string; type: string; message: string }>;
  summary: string;
};

export async function validateImportRows(
  cfg: LogstokaConfig,
  rows: ReportRow[],
  fileType: string,
): Promise<ImportValidationResult> {
  const issues: ImportValidationResult['issues'] = [];
  const seen = new Set<string>();

  rows.forEach((row, idx) => {
    if (!row.sku?.trim()) {
      issues.push({ row: idx + 1, type: 'invalid_sku', message: 'SKU vazio' });
    }
    if (!Number.isFinite(row.quantity) || row.quantity <= 0) {
      issues.push({ row: idx + 1, sku: row.sku, type: 'invalid_qty', message: 'Quantidade inválida' });
    }
    const key = `${row.sku}-${row.marketplace ?? ''}-${row.store ?? ''}`;
    if (seen.has(key)) {
      issues.push({ row: idx + 1, sku: row.sku, type: 'duplicate', message: 'Linha duplicada' });
    }
    seen.add(key);
  });

  if (rows.length === 0) {
    return {
      valid: false,
      rows_total: 0,
      issues: [{ type: 'empty', message: 'Nenhuma linha válida encontrada' }],
      summary: 'Arquivo sem dados importáveis.',
    };
  }

  let aiSummary = '';
  try {
    const sample = rows.slice(0, 30);
    aiSummary = await generateOllamaJson<{ summary?: string; warnings?: string[] }>(
      cfg,
      `Valida importação LogStoka (${fileType}). Retorne JSON: {"summary":"...","warnings":["..."]}
Linhas: ${JSON.stringify(sample)}`,
    ).then((r: { summary?: string; warnings?: string[] }) => {
      const warnings = (r.warnings ?? []).map((w: string) => ({ type: 'ai_warning', message: w }));
      issues.push(...warnings);
      return r.summary ?? '';
    });
  } catch {
    aiSummary = issues.length ? 'Foram detectados problemas na validação local.' : 'Dados consistentes para importação.';
  }

  return {
    valid: issues.filter((i) => i.type !== 'ai_warning').length === 0,
    rows_total: rows.length,
    issues: issues.slice(0, 30),
    summary: aiSummary || (issues.length ? `${issues.length} alerta(s)` : 'Pronto para importar'),
  };
}
