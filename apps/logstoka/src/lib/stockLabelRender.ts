import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import type { StockLabelData } from '@/lib/printStockLabel';

export type StockLabelRenderAssets = {
  eanSvg: string;
  qrDataUrl: string;
};

function renderEanSvg(ean13: string): string {
  if (typeof document === 'undefined') return '';

  const ean = ean13.replace(/\D/g, '').slice(0, 13);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  try {
    JsBarcode(svg, ean, {
      format: 'EAN13',
      width: 1.05,
      height: 34,
      displayValue: false,
      margin: 8,
      marginLeft: 8,
      marginRight: 8,
      flat: true,
    });
  } catch {
    JsBarcode(svg, ean, {
      format: 'CODE128',
      width: 1.1,
      height: 34,
      displayValue: false,
      margin: 0,
      flat: true,
    });
  }

  return new XMLSerializer().serializeToString(svg);
}

export async function renderStockLabelAssets(
  data: Pick<StockLabelData, 'barcode' | 'qrPayload'>,
): Promise<StockLabelRenderAssets> {
  const eanSvg = renderEanSvg(data.barcode);
  const qrDataUrl = await QRCode.toDataURL(data.qrPayload, {
    margin: 1,
    width: 80,
    errorCorrectionLevel: 'M',
  });
  return { eanSvg, qrDataUrl };
}
