import {
  getDemoMovementStockSnapshot,
  getDemoTransferForMovement,
  marketplaceLabel,
  movementStatusLabel,
  movementSubTypeLabel,
  movementTypeLabel,
  type DemoMovementRow,
} from '@/lib/logstokaDemoSeed';

export type PrintMovementOptions = {
  companyName?: string;
  companyAddress?: string;
  companyContact?: string;
  operatorName?: string;
};

const fmtQty = (n: number) => n.toLocaleString('pt-BR');
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR');
const fmtBrl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildDescription(movement: DemoMovementRow): string {
  const transfer = getDemoTransferForMovement(movement);
  const parts = [
    `${movementTypeLabel(movement.movement_type)} · ${movementSubTypeLabel(movement.movement_type, movement.sub_type)}`,
    `Produto ${movement.product_name ?? '—'} (SKU ${movement.sku ?? '—'})`,
    `Depósito ${movement.warehouse_name ?? '—'}`,
  ];

  if (movement.marketplace) {
    parts.push(`Canal ${marketplaceLabel(movement.marketplace)}`);
  }

  if (transfer) {
    parts.push(`Transferência ${transfer.origin_name} → ${transfer.destination_name}`);
  }

  parts.push(`Referência ${movement.reference_code ?? '—'}`);
  return parts.join('. ') + '.';
}

function buildPrintHtml(movement: DemoMovementRow, opts: PrintMovementOptions): string {
  const snapshot = getDemoMovementStockSnapshot(movement);
  const product = snapshot?.product;
  const transfer = getDemoTransferForMovement(movement);
  const unitCost = product?.cost ?? 0;
  const lineAmount = unitCost * movement.total_quantity;
  const companyName = opts.companyName ?? 'LogStoka WMS';
  const companyAddress = opts.companyAddress ?? 'Operação multicanal · Brasil';
  const companyContact = opts.companyContact ?? 'suporte@logstoka.com.br · logstoka.com.br';
  const operatorName = opts.operatorName ?? 'Operador LogStoka';

  const category = movementTypeLabel(movement.movement_type);
  const description = movement.product_name ?? '—';
  const skuLine = movement.sku ? `SKU ${movement.sku}` : '—';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Comprovante ${escapeHtml(movement.reference_code ?? movement.id)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 14mm; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #383838;
      background: #fff;
      font-size: 12px;
      line-height: 1.45;
    }
    .doc { max-width: 210mm; margin: 0 auto; }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 28px;
    }
    .title-block {
      background: #ea580c;
      color: #fff;
      padding: 22px 34px;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .company {
      text-align: right;
      font-size: 11px;
      color: #565656;
      line-height: 1.6;
    }
    .company strong {
      display: block;
      font-size: 14px;
      color: #383838;
      margin-bottom: 4px;
    }
    .company-logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: rgba(234, 88, 12, 0.12);
      color: #ea580c;
      font-weight: 900;
      font-size: 16px;
      margin-bottom: 8px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 22px;
      align-items: flex-start;
    }
    .info-to h3 {
      color: #ea580c;
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .info-to p { font-size: 12px; color: #565656; line-height: 1.55; }
    .ref-table {
      border-collapse: collapse;
      min-width: 220px;
    }
    .ref-table th {
      background: #ea580c;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 8px 14px;
      text-align: left;
    }
    .ref-table td {
      border: 1px solid #e8e8e8;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 600;
      color: #383838;
    }
    .section-title {
      color: #ea580c;
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .description {
      margin-bottom: 22px;
      font-size: 12px;
      color: #565656;
      line-height: 1.65;
    }
    .items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
    }
    .items thead th {
      background: #ea580c;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 10px 12px;
      text-align: left;
    }
    .items thead th.num { text-align: right; }
    .items tbody td {
      border-bottom: 1px solid #e8e8e8;
      padding: 10px 12px;
      vertical-align: top;
      font-size: 12px;
    }
    .items tbody td.num {
      text-align: right;
      font-weight: 700;
      white-space: nowrap;
    }
    .items tbody td.cat {
      color: #ea580c;
      font-weight: 800;
      width: 18%;
    }
    .items tbody tr.group-end td { border-bottom: 2px solid #383838; }
    .bottom {
      display: flex;
      justify-content: space-between;
      gap: 32px;
      margin-top: 18px;
      align-items: flex-start;
    }
    .terms { flex: 1; max-width: 55%; }
    .terms h4 {
      color: #ea580c;
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .terms p { font-size: 11px; color: #565656; line-height: 1.6; }
    .totals { min-width: 240px; }
    .totals-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 7px 0;
      font-size: 12px;
      color: #565656;
    }
    .totals-row strong { color: #383838; }
    .grand {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      background: #ea580c;
      color: #fff;
      padding: 12px 16px;
      margin-top: 8px;
      font-size: 14px;
      font-weight: 800;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      gap: 40px;
      margin-top: 48px;
      padding-top: 8px;
    }
    .signatures div { flex: 1; }
    .signatures label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #565656;
      margin-bottom: 28px;
    }
    .signatures .line {
      border-top: 1px solid #383838;
      padding-top: 6px;
      font-size: 10px;
      color: #949494;
    }
    .footer-note {
      margin-top: 24px;
      text-align: center;
      font-size: 10px;
      color: #949494;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="doc">
    <div class="top">
      <div class="title-block">Comprovante<br/>de Movimentação</div>
      <div class="company">
        <div class="company-logo">LS</div>
        <strong>${escapeHtml(companyName)}</strong>
        ${escapeHtml(companyAddress)}<br/>
        ${escapeHtml(companyContact)}
      </div>
    </div>

    <div class="info-row">
      <div class="info-to">
        <h3>Operação registrada em:</h3>
        <p>
          <strong>${escapeHtml(movement.warehouse_name ?? 'Depósito')}</strong><br/>
          ${escapeHtml(movement.product_name ?? '—')}<br/>
          SKU ${escapeHtml(movement.sku ?? '—')}<br/>
          ${movement.marketplace ? `Canal: ${escapeHtml(marketplaceLabel(movement.marketplace))}<br/>` : ''}
          Operador: ${escapeHtml(operatorName)}
        </p>
      </div>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Movimentação #</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(movement.reference_code ?? movement.id)}</td>
            <td>${escapeHtml(fmtDate(movement.created_at))}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="section-title">Descrição da operação:</h3>
    <p class="description">${escapeHtml(buildDescription(movement))}</p>

    <table class="items">
      <thead>
        <tr>
          <th>Categoria</th>
          <th>Produto / SKU</th>
          <th class="num">Quantidade</th>
          <th class="num">Custo unit.</th>
          <th class="num">Valor</th>
        </tr>
      </thead>
      <tbody>
        <tr class="group-end">
          <td class="cat">${escapeHtml(category)}</td>
          <td>
            <strong>${escapeHtml(description)}</strong><br/>
            <span style="color:#949494">${escapeHtml(skuLine)} · ${escapeHtml(movement.warehouse_name ?? '—')}</span>
            ${transfer ? `<br/><span style="color:#949494">${escapeHtml(transfer.origin_name)} → ${escapeHtml(transfer.destination_name)}</span>` : ''}
          </td>
          <td class="num">${escapeHtml(fmtQty(movement.total_quantity))}</td>
          <td class="num">${product ? escapeHtml(fmtBrl(unitCost)) : '—'}</td>
          <td class="num">${product ? escapeHtml(fmtBrl(lineAmount)) : '—'}</td>
        </tr>
      </tbody>
    </table>

    <div class="bottom">
      <div class="terms">
        <h4>Termos e condições:</h4>
        <p>
          Comprovante gerado pelo LogStoka WMS em ${escapeHtml(fmtDateTime(movement.created_at))}.
          Status da operação: ${escapeHtml(movementStatusLabel(movement.status))}.
          Documento válido para conferência física, auditoria interna e arquivo fiscal operacional.
          ${transfer ? ` Transferência vinculada: ${escapeHtml(transfer.notes ?? '—')}.` : ''}
        </p>
      </div>
      <div class="totals">
        <div class="totals-row"><span>Subtotal (custo)</span><strong>${product ? escapeHtml(fmtBrl(lineAmount)) : '—'}</strong></div>
        <div class="totals-row"><span>Quantidade total</span><strong>${escapeHtml(fmtQty(movement.total_quantity))} un.</strong></div>
        <div class="totals-row"><span>Status</span><strong>${escapeHtml(movementStatusLabel(movement.status))}</strong></div>
        <div class="grand"><span>Total movimentado</span><span>${escapeHtml(fmtQty(movement.total_quantity))} un.</span></div>
      </div>
    </div>

    <div class="signatures">
      <div>
        <label>Assinatura do operador:</label>
        <div class="line">${escapeHtml(operatorName)}</div>
      </div>
      <div>
        <label>Data:</label>
        <div class="line">${escapeHtml(fmtDate(movement.created_at))}</div>
      </div>
    </div>

    <p class="footer-note">LogStoka · Comprovante ${escapeHtml(movement.id)} · Impresso em ${escapeHtml(fmtDateTime(new Date().toISOString()))}</p>
  </div>
  <script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; };</script>
</body>
</html>`;
}

export function printMovementDocument(movement: DemoMovementRow, opts: PrintMovementOptions = {}) {
  const html = buildPrintHtml(movement, opts);
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!win) {
    throw new Error('Permita pop-ups para imprimir o comprovante');
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
