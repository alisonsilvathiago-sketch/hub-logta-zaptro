import {
  OPERATIONAL_LIST_META,
  operationalStageLabel,
  type OperationalOrder,
  type OrderListFilter,
} from '@/lib/operationalFlow';
import type { DayFlowPlan } from '@/lib/operationalProfile';
import { getIntegrationBrand, getIntegrationBrandLabel } from '@/lib/integrationBrandAssets';
import { openPrintDocument, resolvePrintBrandAssetUrl, resolvePrintLogoUrl } from '@/lib/openPrintDocument';

export type PrintOperationalWorkSheetOptions = {
  companyName?: string;
  companyAddress?: string;
  companyContact?: string;
  logoUrl?: string | null;
  operatorName?: string;
  referenceDate?: Date;
};

const fmtDateTime = (d: Date) =>
  d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function marketplaceCellHtml(marketplace: string): string {
  const brand = getIntegrationBrand(marketplace);
  const label = getIntegrationBrandLabel(marketplace);
  if (brand) {
    const src = resolvePrintBrandAssetUrl(brand.svg);
    return `<span class="channel-cell"><img src="${escapeHtml(src)}" alt="${escapeHtml(label)}" class="mp-logo" /><span class="mp-label">${escapeHtml(label)}</span></span>`;
  }
  return `<span class="channel-cell"><span class="mp-label">${escapeHtml(label)}</span></span>`;
}

function buildRows(orders: OperationalOrder[]): string {
  if (!orders.length) {
    return `<tr><td colspan="6" class="empty">Nenhum pedido nesta fila.</td></tr>`;
  }

  return orders
    .map((order, index) => {
      return `
    <tr class="${order.isLate ? 'late' : ''}">
      <td class="num">${index + 1}</td>
      <td class="order-product">
        <strong>${escapeHtml(order.orderRef)}</strong>
        <span>${escapeHtml(order.productName)}</span>
      </td>
      <td class="qty">${order.quantity.toLocaleString('pt-BR')}</td>
      <td class="channel">${marketplaceCellHtml(order.marketplace)}</td>
      <td class="due${order.isLate ? ' due--late' : ''}">${escapeHtml(order.dueDayLabel)}</td>
      <td class="stage">${escapeHtml(operationalStageLabel(order.stage))}</td>
    </tr>`;
    })
    .join('');
}

function buildPrintHtml(
  filter: OrderListFilter,
  orders: OperationalOrder[],
  todayPlan: DayFlowPlan,
  opts: PrintOperationalWorkSheetOptions,
): string {
  const meta = OPERATIONAL_LIST_META[filter];
  const companyName = opts.companyName ?? 'LogStoka WMS';
  const companyAddress = opts.companyAddress ?? 'Endereço da empresa · configure em Configurações → White Label';
  const companyContact = opts.companyContact ?? 'Contato da empresa';
  const operatorName = opts.operatorName ?? 'Operador';
  const printedAt = fmtDateTime(opts.referenceDate ?? new Date());
  const totalUnits = orders.reduce((sum, o) => sum + o.quantity, 0);
  const logoSrc = resolvePrintLogoUrl(opts.logoUrl);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(meta.docTitle)} · ${escapeHtml(companyName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #111;
      background: #f3f4f6;
      font-size: 11px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .doc {
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 12px;
      background: #fff;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
      padding: 12px 14px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .toolbar p { font-size: 13px; font-weight: 800; color: #111827; }
    .toolbar span { display: block; margin-top: 2px; font-size: 11px; font-weight: 600; color: #6b7280; }
    .toolbar button {
      padding: 10px 18px;
      border: 1px solid #111;
      border-radius: 8px;
      background: #111;
      color: #fff;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
    }
    .toolbar button:hover { background: #374151; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none !important; }
      .doc { padding: 0; min-height: auto; box-shadow: none; }
    }
    .brand {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 2px solid #111;
    }
    .brand__logo {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .brand__logo img {
      display: block;
      max-height: 48px;
      max-width: 140px;
      object-fit: contain;
    }
    .brand__name { font-size: 16px; font-weight: 900; color: #111; }
    .brand__title {
      margin-top: 4px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #444;
    }
    .brand__meta {
      text-align: right;
      font-size: 9px;
      font-weight: 600;
      color: #444;
      line-height: 1.55;
    }
    .doc-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
      padding: 10px 12px;
      border: 1px solid #bbb;
      background: #f7f7f7;
    }
    .doc-bar__kicker {
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .doc-bar__meta { margin-top: 3px; font-size: 9px; color: #444; }
    .doc-bar__stats { display: flex; gap: 16px; }
    .doc-bar__stats span {
      display: block;
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      color: #666;
    }
    .doc-bar__stats strong { font-size: 16px; font-weight: 900; }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 9px;
    }
    th, td {
      padding: 8px 6px;
      border: 1px solid #bbb;
      vertical-align: middle;
      text-align: left;
    }
    th {
      background: #e8e8e8;
      font-size: 7px;
      font-weight: 900;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #222;
    }
    th:nth-child(1), td.num { width: 24px; text-align: center; }
    th:nth-child(3), td.qty { width: 40px; text-align: center; font-weight: 900; font-size: 11px; }
    th:nth-child(4), td.channel { width: 72px; text-align: center; }
    th:nth-child(5), td.due { width: 64px; text-align: center; font-size: 8px; }
    th:nth-child(6), td.stage { width: 72px; text-align: center; font-size: 8px; }
    td.order-product strong {
      display: block;
      font-size: 9px;
      font-weight: 900;
      color: #111;
    }
    td.order-product span {
      display: block;
      margin-top: 2px;
      font-size: 8px;
      line-height: 1.35;
      color: #444;
      word-wrap: break-word;
    }
    .channel-cell {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }
    .mp-logo {
      display: block;
      width: 22px;
      height: 22px;
      object-fit: contain;
    }
    .mp-label {
      font-size: 7px;
      font-weight: 700;
      color: #555;
      line-height: 1.2;
    }
    tr.late { background: #fff7ed; }
    td.due--late { font-weight: 900; color: #c2410c; text-decoration: underline; }
    td.stage { font-weight: 700; color: #333; }
    td.empty { padding: 20px; text-align: center; color: #666; }
    .doc-footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-top: 18px;
      padding-top: 12px;
      border-top: 2px solid #111;
    }
    .doc-footer__brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .doc-footer__brand img {
      max-height: 36px;
      max-width: 100px;
      object-fit: contain;
    }
    .doc-footer__brand strong {
      display: block;
      font-size: 11px;
      font-weight: 900;
      color: #111;
    }
    .doc-footer__brand p {
      margin-top: 2px;
      font-size: 9px;
      font-weight: 600;
      color: #444;
      line-height: 1.45;
    }
    .doc-footer__note {
      flex-shrink: 0;
      max-width: 180px;
      font-size: 8px;
      font-weight: 600;
      color: #6b7280;
      text-align: right;
      line-height: 1.45;
    }
    @media print {
      thead { display: table-header-group; }
      tr { break-inside: avoid; }
      .doc-bar, .doc-footer { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="doc">
    <div class="toolbar">
      <div>
        <p>Pré-visualização · lista operacional · A4</p>
        <span>${escapeHtml(meta.title)} · ${orders.length} pedido(s) · ${totalUnits.toLocaleString('pt-BR')} un.</span>
      </div>
      <button type="button" onclick="window.print()">Imprimir documento</button>
    </div>

    <header class="brand">
      <div class="brand__logo">
        <img src="${escapeHtml(logoSrc)}" alt="" />
        <div>
          <div class="brand__name">${escapeHtml(companyName)}</div>
          <div class="brand__title">${escapeHtml(meta.docTitle)}</div>
        </div>
      </div>
      <div class="brand__meta">
        ${escapeHtml(todayPlan.weekdayLabel)} · saída ${escapeHtml(todayPlan.dailyCutoff)}<br/>
        Impresso em ${printedAt}<br/>
        Operador: ${escapeHtml(operatorName)}
      </div>
    </header>

    <div class="doc-bar">
      <div>
        <p class="doc-bar__kicker">${escapeHtml(meta.title)}</p>
        <p class="doc-bar__meta">${escapeHtml(meta.subtitle)}</p>
      </div>
      <div class="doc-bar__stats">
        <div><span>Pedidos</span><strong>${orders.length}</strong></div>
        <div><span>Unidades</span><strong>${totalUnits.toLocaleString('pt-BR')}</strong></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Pedido / Produto</th>
          <th>Qtd</th>
          <th>Canal</th>
          <th>Expedir</th>
          <th>Etapa</th>
        </tr>
      </thead>
      <tbody>
        ${buildRows(orders)}
      </tbody>
    </table>

    <footer class="doc-footer">
      <div class="doc-footer__brand">
        <img src="${escapeHtml(logoSrc)}" alt="" />
        <div>
          <strong>${escapeHtml(companyName)}</strong>
          <p>${escapeHtml(companyAddress)}</p>
          <p>${escapeHtml(companyContact)}</p>
        </div>
      </div>
      <p class="doc-footer__note">
        Documento interno operacional · não fiscal<br/>
        LogStoka WMS · ${escapeHtml(meta.docKind)}
      </p>
    </footer>
  </div>
</body>
</html>`;
}

export function printOperationalWorkSheet(
  filter: OrderListFilter,
  orders: OperationalOrder[],
  todayPlan: DayFlowPlan,
  opts: PrintOperationalWorkSheetOptions = {},
) {
  const html = buildPrintHtml(filter, orders, todayPlan, opts);
  const win = openPrintDocument(html);
  if (!win) {
    throw new Error('popup_blocked');
  }
}
