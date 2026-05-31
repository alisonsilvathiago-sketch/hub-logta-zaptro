import type { DemoInventoryRow } from '@/lib/logstokaDemoSeed';
import { openPrintDocument } from '@/lib/openPrintDocument';

export type InventorySnapshotRow = {
  id: string;
  sku?: string;
  name?: string;
  system_quantity: number;
  counted_quantity?: number | null;
  difference?: number | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildInventorySnapshot(
  items: DemoInventoryRow['ls_inventory_items'],
): InventorySnapshotRow[] {
  return items.map((item) => ({
    id: item.id,
    sku: item.ls_products?.sku,
    name: item.ls_products?.name,
    system_quantity: item.system_quantity,
    counted_quantity: item.counted_quantity,
    difference: item.difference,
  }));
}

export function resolveInventoryShareScope(
  allItems: DemoInventoryRow['ls_inventory_items'],
  selectedKeys: Set<string>,
): DemoInventoryRow['ls_inventory_items'] {
  if (selectedKeys.size === 0) return allItems;
  return allItems.filter((item) => selectedKeys.has(item.id));
}

export function exportInventoryCsv(
  items: DemoInventoryRow['ls_inventory_items'],
  filename: string,
): void {
  const headers = ['SKU', 'Produto', 'Sistema', 'Contado', 'Diferença', 'Colaborador'];
  const rows = items.map((item) => [
    item.ls_products?.sku ?? '',
    item.ls_products?.name ?? '',
    String(item.system_quantity),
    item.counted_quantity == null ? '' : String(item.counted_quantity),
    item.difference == null ? '' : String(item.difference),
    item.last_actor_name ?? '',
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

export function printInventoryList(opts: {
  title: string;
  warehouseName: string;
  items: DemoInventoryRow['ls_inventory_items'];
  operatorName?: string;
  scopeNote?: string;
}): void {
  const rows = opts.items
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.ls_products?.sku ?? '—')}</td>
        <td>${escapeHtml(item.ls_products?.name ?? '—')}</td>
        <td class="num">${escapeHtml(String(item.system_quantity))}</td>
        <td class="num">${escapeHtml(item.counted_quantity == null ? '—' : String(item.counted_quantity))}</td>
        <td class="num">${escapeHtml(item.difference == null ? '—' : String(item.difference))}</td>
        <td>${escapeHtml(item.last_actor_name ?? '—')}</td>
      </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(opts.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #383838; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    p { margin: 0 0 12px; color: #737373; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e5e5e5; padding: 8px; text-align: left; }
    th { background: #fafafa; font-size: 10px; text-transform: uppercase; }
    .num { text-align: right; }
  </style>
</head>
<body>
  <h1>${escapeHtml(opts.title)}</h1>
  <p>${escapeHtml(opts.warehouseName)}${opts.scopeNote ? ` · ${escapeHtml(opts.scopeNote)}` : ''}${opts.operatorName ? ` · ${escapeHtml(opts.operatorName)}` : ''}</p>
  <table>
    <thead><tr><th>SKU</th><th>Produto</th><th>Sistema</th><th>Contado</th><th>Diferença</th><th>Colaborador</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6">Nenhum item.</td></tr>'}</tbody>
  </table>
</body>
</html>`;

  openPrintDocument(html);
}
