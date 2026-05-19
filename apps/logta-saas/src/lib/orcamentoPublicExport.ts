import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { sanitizeFilenameBase } from './reportExport';

function cloneDocumentForExport(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print').forEach((node) => node.remove());
  return clone;
}

function copyDocumentStyles(targetWin: Window) {
  const head = targetWin.document.head;
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    head.appendChild(node.cloneNode(true));
  });
  const extra = targetWin.document.createElement('style');
  extra.textContent = `
    html, body { margin: 0; padding: 0; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { padding: 12px; box-sizing: border-box; }
    .no-print { display: none !important; }
    @page { size: A4 portrait; margin: 10mm; }
  `;
  head.appendChild(extra);
}

/** Imprime o documento exatamente como aparece na tela (sem botões/ações). */
export function printOrcamentoPublic(source: HTMLElement, title: string) {
  if (typeof window === 'undefined') return;

  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    window.print();
    return;
  }

  const clone = cloneDocumentForExport(source);
  win.document.open();
  win.document.write(
    `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${title}</title></head><body></body></html>`,
  );
  copyDocumentStyles(win);
  win.document.body.appendChild(clone);
  win.document.close();

  const trigger = () => {
    win.focus();
    win.print();
    win.addEventListener('afterprint', () => win.close());
  };

  if (win.document.readyState === 'complete') {
    setTimeout(trigger, 400);
  } else {
    win.addEventListener('load', () => setTimeout(trigger, 400));
  }
}

/** Gera PDF visualmente idêntico ao bloco exibido na página pública. */
export async function downloadOrcamentoPublicPdf(source: HTMLElement, filenameBase: string) {
  const canvas = await html2canvas(source, {
    scale: Math.min(2.5, Math.max(2, window.devicePixelRatio || 1)),
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (doc) => {
      doc.querySelectorAll('.no-print').forEach((node) => node.remove());
      const root = doc.getElementById('orcamento-public-document');
      if (root) {
        root.style.boxShadow = 'none';
        root.style.borderRadius = '0';
      }
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 28;
  const contentW = pageW - margin * 2;
  const imgH = (canvas.height * contentW) / canvas.width;
  const pageContentH = pageH - margin * 2;

  let offsetY = 0;
  let page = 0;

  while (offsetY < imgH) {
    if (page > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', margin, margin - offsetY, contentW, imgH);
    offsetY += pageContentH;
    page += 1;
  }

  pdf.save(`${sanitizeFilenameBase(filenameBase)}.pdf`);
}
