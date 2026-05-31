import type { LsProduct } from '@/types';
import { openPrintDocument } from '@/lib/openPrintDocument';

export type ProductPrintMode = 'with-image' | 'without-image';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtBrl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function printProductsReport(
  products: LsProduct[],
  opts: {
    withImage: boolean;
    categoryName: (id?: string | null) => string;
    companyName?: string;
  },
) {
  if (products.length === 0) {
    throw new Error('Nenhum produto para imprimir');
  }

  const rows = products
    .map((p) => {
      const imageCell =
        opts.withImage && p.main_image_url
          ? `<td><img src="${escapeHtml(p.main_image_url)}" alt="" class="thumb" /></td>`
          : opts.withImage
            ? '<td class="muted">—</td>'
            : '';
      return `<tr>
        ${imageCell}
        <td><strong>${escapeHtml(p.sku)}</strong></td>
        <td>${escapeHtml(p.barcode ?? '—')}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(opts.categoryName(p.category_id))}</td>
        <td>${escapeHtml(p.unit ?? 'UN')}</td>
        <td>${fmtBrl(Number(p.sale_price) || 0)}</td>
        <td>${p.status === 'active' ? 'Ativo' : 'Inativo'}</td>
      </tr>`;
    })
    .join('');

  const imageHeader = opts.withImage ? '<th>Foto</th>' : '';
  const colCount = opts.withImage ? 8 : 7;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório de produtos · LogStoka</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Inter, system-ui, sans-serif; color: #111827; margin: 24px; }
    h1 { margin: 0 0 4px; font-size: 20px; }
    .meta { margin: 0 0 20px; font-size: 12px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; vertical-align: middle; }
    th { background: #f9fafb; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; }
    .thumb { width: 42px; height: 42px; object-fit: contain; border-radius: 8px; background: #fff; }
    .muted { color: #9ca3af; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>Relatório de produtos</h1>
  <p class="meta">${escapeHtml(opts.companyName ?? 'LogStoka')} · ${products.length} produto(s) · ${opts.withImage ? 'Com imagem' : 'Sem imagem'} · ${new Date().toLocaleString('pt-BR')}</p>
  <table>
    <thead>
      <tr>
        ${imageHeader}
        <th>SKU</th>
        <th>EAN</th>
        <th>Produto</th>
        <th>Categoria</th>
        <th>Unidade</th>
        <th>Preço</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload = function(){ window.print(); };</script>
</body>
</html>`;

  const win = openPrintDocument(html);
  if (!win) {
    throw new Error('Permita pop-ups para abrir a impressão do sistema');
  }
}
