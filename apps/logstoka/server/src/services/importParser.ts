export interface NfeItem {
  sku: string;
  barcode?: string;
  name: string;
  quantity: number;
  unit?: string;
}

export interface ParsedNfe {
  invoiceNumber?: string;
  supplierName?: string;
  supplierDocument?: string;
  issueDate?: string;
  items: NfeItem[];
}

function extractTag(block: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
  const match = block.match(re);
  return match?.[1]?.trim() || undefined;
}

function parseNumber(value?: string): number {
  if (!value) return 0;
  const normalized = value.replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function parseNfeXml(xml: string): ParsedNfe {
  const cleaned = xml.replace(/<\?xml[^?]*\?>/gi, '').trim();
  if (!cleaned.includes('<NFe') && !cleaned.includes('<nfeProc')) {
    throw new Error('XML inválido — esperado NF-e');
  }

  const invoiceNumber = extractTag(cleaned, 'nNF');
  const supplierName = extractTag(cleaned, 'xNome');
  const supplierDocument = extractTag(cleaned, 'CNPJ') || extractTag(cleaned, 'CPF');
  const issueDate = extractTag(cleaned, 'dhEmi') || extractTag(cleaned, 'dEmi');

  const detBlocks = cleaned.match(/<det[\s\S]*?<\/det>/gi) ?? [];
  const items: NfeItem[] = [];

  for (const block of detBlocks) {
    const sku = extractTag(block, 'cProd');
    const name = extractTag(block, 'xProd');
    const quantity = parseNumber(extractTag(block, 'qCom'));
    const barcode = extractTag(block, 'cEAN') || extractTag(block, 'cBarra');
    const unit = extractTag(block, 'uCom');

    if (!sku || !name || quantity <= 0) continue;
    items.push({ sku, barcode, name, quantity, unit });
  }

  if (items.length === 0) {
    throw new Error('Nenhum item encontrado no XML da NF-e');
  }

  return {
    invoiceNumber,
    supplierName,
    supplierDocument,
    issueDate,
    items,
  };
}

export interface ReportRow {
  sku: string;
  quantity: number;
  marketplace?: string;
  store?: string;
  productName?: string;
}

export function parseReportCsv(content: string): ReportRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const header = lines[0].toLowerCase().split(delimiter).map((h) => h.trim());
  const hasHeader = header.some((h) => h.includes('sku') || h.includes('produto'));

  const rows: ReportRow[] = [];
  const start = hasHeader ? 1 : 0;

  for (let i = start; i < lines.length; i += 1) {
    const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 2) continue;

    if (hasHeader) {
      const idx = (name: string) => header.findIndex((h) => h.includes(name));
      const skuIdx = idx('sku') >= 0 ? idx('sku') : idx('codigo');
      const qtyIdx = idx('quant') >= 0 ? idx('quant') : idx('qtd');
      const mpIdx = idx('market');
      const storeIdx = idx('loja');
      const nameIdx = idx('produto');

      rows.push({
        sku: cols[skuIdx >= 0 ? skuIdx : 0] ?? '',
        quantity: parseNumber(cols[qtyIdx >= 0 ? qtyIdx : 1]),
        marketplace: mpIdx >= 0 ? cols[mpIdx] : undefined,
        store: storeIdx >= 0 ? cols[storeIdx] : undefined,
        productName: nameIdx >= 0 ? cols[nameIdx] : undefined,
      });
    } else {
      rows.push({
        sku: cols[0],
        quantity: parseNumber(cols[1]),
        marketplace: cols[2],
        store: cols[3],
      });
    }
  }

  return rows.filter((r) => r.sku && r.quantity > 0);
}
