import { jsPDF } from 'jspdf';

export type TabularExportMeta = {
  subtitle?: string;
  generatedAt?: string;
  generatedBy?: string;
  companyName?: string;
  filtersSummary?: string;
  exportScope?: 'filtered' | 'all';
};

export type TabularExport = {
  title: string;
  filenameBase: string;
  columns: string[];
  rows: (string | number)[][];
  meta?: TabularExportMeta;
};

export function sanitizeFilenameBase(s: string) {
  const base = s.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '');
  return base.slice(0, 72) || 'relatorio';
}

function defaultMeta(partial?: TabularExportMeta): TabularExportMeta {
  return {
    generatedAt: new Date().toLocaleString('pt-BR'),
    generatedBy: 'Usuário Logta',
    companyName: 'Logta',
    exportScope: 'filtered',
    ...partial,
  };
}

/** Planilha compatível com Excel (UTF-8 CSV). */
export function downloadExcelCsv(data: TabularExport) {
  const meta = defaultMeta(data.meta);
  const escape = (cell: string | number) => {
    const str = String(cell);
    if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const preamble: string[][] = [
    [data.title],
    meta.companyName ? [`Empresa: ${meta.companyName}`] : [],
    meta.generatedBy ? [`Responsável: ${meta.generatedBy}`] : [],
    meta.generatedAt ? [`Gerado em: ${meta.generatedAt}`] : [],
    meta.filtersSummary ? [`Filtros: ${meta.filtersSummary}`] : [],
    meta.exportScope ? [`Escopo: ${meta.exportScope === 'all' ? 'Todos os registros' : 'Dados filtrados'}`] : [],
    [],
  ].filter((row) => row.length > 0);

  const lines = [
    ...preamble.map((r) => r.map(escape).join(',')),
    data.columns.map(escape).join(','),
    ...data.rows.map((r) => r.map(escape).join(',')),
  ];

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilenameBase(data.filenameBase)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function drawLogtaPdfHeader(doc: jsPDF, margin: number, pageW: number, meta: TabularExportMeta, title: string) {
  let y = margin;

  doc.setFillColor(37, 99, 235);
  doc.rect(margin, y, 18, 18, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Logta', margin + 24, y + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const rightX = pageW - margin;
  if (meta.generatedAt) doc.text(meta.generatedAt, rightX, y + 4, { align: 'right' });
  if (meta.generatedBy) doc.text(meta.generatedBy, rightX, y + 14, { align: 'right' });

  y += 32;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  const titleParts = doc.splitTextToSize(title, pageW - margin * 2);
  doc.text(titleParts, margin, y);
  y += titleParts.length * 16 + 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  if (meta.companyName) {
    doc.text(`Empresa: ${meta.companyName}`, margin, y);
    y += 12;
  }
  if (meta.filtersSummary) {
    const filterLines = doc.splitTextToSize(`Filtros: ${meta.filtersSummary}`, pageW - margin * 2);
    doc.text(filterLines, margin, y);
    y += filterLines.length * 11 + 4;
  }
  if (meta.exportScope) {
    doc.text(
      `Escopo: ${meta.exportScope === 'all' ? 'Todos os registros' : 'Apenas dados filtrados'}`,
      margin,
      y,
    );
    y += 12;
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  return y + 14;
}

export function downloadPdfTable(data: TabularExport) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const meta = defaultMeta(data.meta);

  let y = drawLogtaPdfHeader(doc, margin, pageW, meta, data.title);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  const colCount = Math.max(1, data.columns.length);
  const usableW = pageW - margin * 2;
  const colW = Math.min(usableW / colCount, 140);

  doc.setFont('helvetica', 'bold');
  data.columns.forEach((h, i) => {
    const lines = doc.splitTextToSize(String(h), colW - 6);
    doc.text(lines, margin + i * colW, y);
  });
  y += 18;
  doc.setFont('helvetica', 'normal');

  for (const row of data.rows) {
    let rowHeight = 14;
    const cellBlocks = row.map((cell, i) => {
      const lines = doc.splitTextToSize(String(cell), colW - 6);
      rowHeight = Math.max(rowHeight, lines.length * 11 + 4);
      return { lines, i };
    });

    if (y + rowHeight > pageH - margin) {
      doc.addPage();
      y = margin;
    }

    cellBlocks.forEach(({ lines, i }) => {
      doc.text(lines, margin + i * colW, y);
    });
    y += rowHeight;
  }

  doc.save(`${sanitizeFilenameBase(data.filenameBase)}.pdf`);
}

export function printTabularArea(element: HTMLElement | null) {
  if (!element || typeof window === 'undefined') return;
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) return;

  const styles = `
    body { font-family: Inter, system-ui, sans-serif; padding: 24px; color: #111; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 12px; }
    th { background: #f9fafb; font-size: 10px; text-transform: uppercase; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    .meta { font-size: 11px; color: #6b7280; margin-bottom: 16px; }
  `;

  win.document.write(
    `<!DOCTYPE html><html><head><title>Impressão Logta</title><style>${styles}</style></head><body>${element.innerHTML}</body></html>`,
  );
  win.document.close();
  win.focus();
  win.print();
}
