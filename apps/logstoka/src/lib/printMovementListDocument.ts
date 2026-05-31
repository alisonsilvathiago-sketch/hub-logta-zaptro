import { marketplaceLabel, movementTypeLabel, type DemoMovementRow } from '@/lib/logstokaDemoSeed';
import { openPrintDocument } from '@/lib/openPrintDocument';

export type PrintMovementListOptions = {
  title: string;
  subtitle?: string;
  dateLabel: string;
  movements: DemoMovementRow[];
  totals: { movements: number; products: number; units: number };
  operatorName?: string;
  companyName?: string;
  scopeNote?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const fmtQty = (n: number) => n.toLocaleString('pt-BR');
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR');

function buildPrintListHtml(opts: PrintMovementListOptions): string {
  const companyName = opts.companyName ?? 'LogStoka WMS';
  const operatorName = opts.operatorName ?? 'Operador';
  const rows = opts.movements
    .map(
      (m) => `<tr>
        <td>${escapeHtml(m.sku ?? '—')}</td>
        <td>${escapeHtml(m.product_name ?? '—')}</td>
        <td class="num">${escapeHtml(fmtQty(m.total_quantity))}</td>
        <td>${escapeHtml(movementTypeLabel(m.movement_type))}</td>
        <td>${escapeHtml(m.warehouse_name ?? '—')}</td>
        <td>${escapeHtml(m.marketplace ? marketplaceLabel(m.marketplace) : '—')}</td>
        <td>${escapeHtml(m.reference_code ?? '—')}</td>
        <td>${escapeHtml(fmtDateTime(m.created_at))}</td>
        <td>${escapeHtml(m.status ?? '—')}</td>
      </tr>`,
    )
    .join('');

  const emptyRow =
    opts.movements.length === 0
      ? '<tr><td colspan="9" class="empty">Nenhum movimento neste recorte.</td></tr>'
      : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(opts.title)} — ${escapeHtml(opts.dateLabel)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #383838; background: #fff; }
    .doc { max-width: 100%; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
    .title { font-size: 22px; font-weight: 800; color: #ea580c; }
    .sub { margin-top: 4px; font-size: 12px; color: #737373; }
    .meta { text-align: right; font-size: 11px; font-weight: 600; color: #525252; line-height: 1.5; }
    .kpis { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
    .kpi { flex: 1; min-width: 120px; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa; }
    .kpi span { display: block; font-size: 9px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #a3a3a3; }
    .kpi strong { display: block; margin-top: 4px; font-size: 18px; font-weight: 900; color: #171717; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #525252; }
    td.num { font-weight: 800; color: #c2410c; text-align: right; }
    tr:nth-child(even) td { background: #fafafa; }
    .empty { text-align: center; padding: 24px; color: #737373; font-weight: 600; }
    .foot { margin-top: 14px; font-size: 10px; color: #9ca3af; }
    @media print { .doc { max-width: none; } }
  </style>
</head>
<body>
  <div class="doc">
    <div class="head">
      <div>
        <h1 class="title">${escapeHtml(opts.title)}</h1>
        ${opts.subtitle ? `<p class="sub">${escapeHtml(opts.subtitle)}</p>` : ''}
        ${opts.scopeNote ? `<p class="sub">${escapeHtml(opts.scopeNote)}</p>` : ''}
      </div>
      <div class="meta">
        <div><strong>${escapeHtml(companyName)}</strong></div>
        <div>Data: ${escapeHtml(opts.dateLabel)}</div>
        <div>Operador: ${escapeHtml(operatorName)}</div>
        <div>Impresso: ${escapeHtml(fmtDateTime(new Date().toISOString()))}</div>
      </div>
    </div>
    <div class="kpis">
      <div class="kpi"><span>SKUs</span><strong>${escapeHtml(String(opts.totals.products))}</strong></div>
      <div class="kpi"><span>Unidades</span><strong>${escapeHtml(fmtQty(opts.totals.units))}</strong></div>
      <div class="kpi"><span>Movimentos</span><strong>${escapeHtml(String(opts.totals.movements))}</strong></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>SKU</th>
          <th>Produto</th>
          <th>Qtd.</th>
          <th>Tipo</th>
          <th>Depósito</th>
          <th>Canal</th>
          <th>Referência</th>
          <th>Data / hora</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}${emptyRow}</tbody>
    </table>
    <p class="foot">LogStoka · Lista operacional · ${escapeHtml(String(opts.movements.length))} linha(s)</p>
  </div>
  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};}</script>
</body>
</html>`;
}

export function printMovementListDocument(opts: PrintMovementListOptions): void {
  const html = buildPrintListHtml(opts);
  const win = openPrintDocument(html);
  if (!win) {
    throw new Error('Permita pop-ups para imprimir a lista');
  }
}
