import { openPrintDocument } from '@/lib/openPrintDocument';
import type { WarehouseProductLine } from '@/lib/productStockByCd';
import type { LsWarehouse } from '@/types';
import { warehouseLocationLabel } from '@/lib/warehouseUtils';

export type WarehouseXraySnapshot = {
  warehouse: {
    id: string;
    name: string;
    code: string;
    location: string;
    address_line: string | null;
    manager_name: string | null;
    manager_role: string | null;
    manager_phone: string | null;
    manager_email: string | null;
  };
  lines: Array<{
    product_id: string;
    code: string;
    sku: string;
    name: string;
    quantity: number;
    available: number;
  }>;
  generated_at: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function productLineCode(line: WarehouseProductLine): string {
  return line.internal_code?.trim() || line.sku;
}

export function buildWarehouseXraySnapshot(
  warehouse: LsWarehouse,
  lines: WarehouseProductLine[],
): WarehouseXraySnapshot {
  return {
    warehouse: {
      id: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      location: warehouseLocationLabel(warehouse),
      address_line: warehouse.address_line ?? null,
      manager_name: warehouse.manager_name ?? null,
      manager_role: warehouse.manager_role ?? null,
      manager_phone: warehouse.manager_phone ?? null,
      manager_email: warehouse.manager_email ?? null,
    },
    lines: lines.map((line) => ({
      product_id: line.product_id,
      code: productLineCode(line),
      sku: line.sku,
      name: line.name,
      quantity: line.quantity,
      available: line.available,
    })),
    generated_at: new Date().toISOString(),
  };
}

export function exportWarehouseXrayCsv(
  warehouse: LsWarehouse,
  lines: WarehouseProductLine[],
  filename: string,
): void {
  const headers = ['Código', 'SKU ref.', 'Produto', 'Quantidade', 'Disponível'];
  const rows = lines.map((line) => [
    productLineCode(line),
    line.sku,
    line.name,
    String(line.quantity),
    String(line.available),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function warehouseMetaHtml(warehouse: LsWarehouse): string {
  const parts = [
    `<strong>${escapeHtml(warehouse.name)}</strong> · ${escapeHtml(warehouse.code)}`,
    escapeHtml(warehouseLocationLabel(warehouse)),
  ];
  if (warehouse.address_line) parts.push(escapeHtml(warehouse.address_line));
  const contact: string[] = [];
  if (warehouse.manager_name) {
    contact.push(
      `${escapeHtml(warehouse.manager_name)}${warehouse.manager_role ? ` (${escapeHtml(warehouse.manager_role)})` : ''}`,
    );
  }
  if (warehouse.manager_phone) contact.push(escapeHtml(warehouse.manager_phone));
  if (warehouse.manager_email) contact.push(escapeHtml(warehouse.manager_email));
  if (contact.length) parts.push(contact.join(' · '));
  return parts.map((p) => `<p class="meta-line">${p}</p>`).join('');
}

function buildWarehouseXrayHtml(warehouse: LsWarehouse, lines: WarehouseProductLine[], title: string): string {
  const rows = lines
    .map(
      (line) => `<tr>
        <td>${escapeHtml(line.name)}</td>
        <td>${escapeHtml(productLineCode(line))}</td>
        <td class="num">${escapeHtml(String(line.quantity))}</td>
        <td class="num">${escapeHtml(String(line.available))}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #383838; margin: 24px; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    .meta-line { margin: 0 0 4px; color: #737373; font-size: 11px; }
    .date { margin: 0 0 16px; font-size: 11px; color: #a3a3a3; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e5e5e5; padding: 8px; text-align: left; }
    th { background: #fafafa; font-size: 10px; text-transform: uppercase; }
    .num { text-align: right; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${warehouseMetaHtml(warehouse)}
  <p class="date">${lines.length} produto(s) · ${new Date().toLocaleString('pt-BR')}</p>
  <table>
    <thead><tr><th>Produto</th><th>Código</th><th>Qtd</th><th>Disp.</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4">Nenhum produto com saldo.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

export function printWarehouseXrayList(warehouse: LsWarehouse, lines: WarehouseProductLine[]): void {
  const title = `Raio-X · ${warehouse.name}`;
  openPrintDocument(buildWarehouseXrayHtml(warehouse, lines, title));
}

/** Abre documento pronto para salvar como PDF (Ctrl+P → Salvar como PDF). */
export function downloadWarehouseXrayPdf(warehouse: LsWarehouse, lines: WarehouseProductLine[]): void {
  const title = `Raio-X · ${warehouse.name} · PDF`;
  openPrintDocument(buildWarehouseXrayHtml(warehouse, lines, title));
}
