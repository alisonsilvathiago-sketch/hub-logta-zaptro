import type { PickingLine } from '@/lib/pickingSession';
import { MARKETPLACE_LABELS, type Marketplace } from '@/types';

function marketplaceLabel(mp?: string | null): string {
  if (!mp) return '—';
  return MARKETPLACE_LABELS[mp as Marketplace] ?? mp;
}

export function pickingLinesToCsv(lines: PickingLine[]): string {
  const header = 'SKU;Produto;Quantidade;Canal;Loja';
  const rows = lines.map(
    (line) =>
      `${line.sku};"${line.name.replace(/"/g, '""')}";${line.quantity};${marketplaceLabel(line.marketplace)};${line.store ?? ''}`,
  );
  return [header, ...rows].join('\n');
}

export function downloadPickingLinesCsv(lines: PickingLine[], filenamePrefix = 'conferencia-dia'): void {
  const csv = pickingLinesToCsv(lines);
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function buildPickingShareText(lines: PickingLine[]): string {
  const units = lines.reduce((sum, line) => sum + line.quantity, 0);
  const head = `Conferência do dia · ${lines.length} SKU(s) · ${units} un.\n`;
  const body = lines
    .map((line) => `• ${line.sku} · ${line.name} · ${line.quantity} un. · ${marketplaceLabel(line.marketplace)}`)
    .join('\n');
  return head + body;
}

export async function sharePickingLines(lines: PickingLine[]): Promise<void> {
  const text = buildPickingShareText(lines);
  if (typeof navigator.share === 'function') {
    await navigator.share({ title: 'Conferência do dia — LogStoka', text });
    return;
  }
  await navigator.clipboard.writeText(text);
}

export function printPickingDayList(lines: PickingLine[], companyName = 'LogStoka WMS'): void {
  const units = lines.reduce((sum, line) => sum + line.quantity, 0);
  const today = new Date().toLocaleDateString('pt-BR');
  const rows = lines
    .map(
      (line, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${line.sku}</strong></td>
        <td>${line.name}</td>
        <td>${line.quantity}</td>
        <td>${marketplaceLabel(line.marketplace)}</td>
        <td>${line.store ?? '—'}</td>
      </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Conferência do dia</title>
  <style>
    body{font-family:system-ui,sans-serif;padding:24px;color:#111}
    h1{font-size:20px;margin:0 0 4px}
    p{color:#666;font-size:13px;margin:0 0 20px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th,td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left}
    th{background:#f9fafb;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  </style></head><body>
  <h1>Conferência do dia</h1>
  <p>${companyName} · ${today} · ${lines.length} SKU(s) · ${units} un.</p>
  <table><thead><tr><th>#</th><th>SKU</th><th>Produto</th><th>Qtd</th><th>Canal</th><th>Loja</th></tr></thead><tbody>${rows}</tbody></table>
  <script>window.onload=function(){window.print();}</script>
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) throw new Error('popup-blocked');
  win.document.write(html);
  win.document.close();
}
