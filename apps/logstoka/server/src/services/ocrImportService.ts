import type { LogstokaConfig } from '../config.js';
import { parseReportCsv, type ReportRow } from './importParser.js';
import { generateOllamaJson } from '../modules/ai/ollamaService.js';

export async function parseExcelBuffer(buffer: Buffer): Promise<ReportRow[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]!];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const mapped: ReportRow[] = [];
  for (const row of rows) {
    const keys = Object.keys(row).reduce<Record<string, string>>((acc, k) => {
      acc[k.toLowerCase()] = k;
      return acc;
    }, {});
    const skuKey = keys.sku || keys.codigo || keys['código'] || keys.produto;
    const qtyKey = keys.quantidade || keys.qtd || keys.qty;
    const mpKey = keys.marketplace || keys.canal;
    const storeKey = keys.loja || keys.store;
    if (!skuKey || !qtyKey) continue;
    const sku = String(row[skuKey] ?? '').trim();
    const quantity = Number(String(row[qtyKey]).replace(',', '.'));
    if (!sku || !Number.isFinite(quantity) || quantity <= 0) continue;
    mapped.push({
      sku,
      quantity,
      marketplace: mpKey ? String(row[mpKey]) : undefined,
      store: storeKey ? String(row[storeKey]) : undefined,
      productName: keys.produto ? String(row[keys.produto]) : undefined,
    });
  }
  if (mapped.length > 0) return mapped;
  const csv = XLSX.utils.sheet_to_csv(sheet);
  return parseReportCsv(csv);
}

export async function parsePdfBuffer(buffer: Buffer): Promise<ReportRow[]> {
  const pdfParse = (await import('pdf-parse')).default;
  const parsed = await pdfParse(buffer);
  const text = parsed.text ?? '';
  const lines = text.split(/\r?\n/).filter(Boolean);
  const rows: ReportRow[] = [];
  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    const sku = parts[0]?.replace(/[^\w-]/g, '');
    const qty = Number(parts[parts.length - 1]?.replace(',', '.'));
    if (sku && qty > 0) rows.push({ sku, quantity: qty });
  }
  if (rows.length > 0) return rows;
  return parseReportCsv(text);
}

export async function extractRowsWithOllama(
  cfg: LogstokaConfig,
  rawText: string,
): Promise<ReportRow[]> {
  const prompt = `Extraia linhas de relatório de estoque/marketplace do texto abaixo.
Retorne APENAS JSON array: [{"sku":"...","quantity":number,"marketplace":"...","store":"..."}]
Texto:
${rawText.slice(0, 12000)}`;

  const parsed = await generateOllamaJson<ReportRow[]>(cfg, prompt);
  return (Array.isArray(parsed) ? parsed : []).filter((r) => r.sku && r.quantity > 0);
}

export async function ocrImageBase64(cfg: LogstokaConfig, base64: string, mimeType: string): Promise<ReportRow[]> {
  if (mimeType.includes('pdf')) {
    return parsePdfBuffer(Buffer.from(base64, 'base64'));
  }
  const rawHint = Buffer.from(base64, 'base64').toString('utf8');
  if (rawHint.includes('sku') || rawHint.includes(',')) {
    return parseReportCsv(rawHint);
  }
  return extractRowsWithOllama(
    cfg,
    `Relatório operacional (imagem ${mimeType}). Extraia SKU, quantidade, marketplace e loja se possível.`,
  );
}
