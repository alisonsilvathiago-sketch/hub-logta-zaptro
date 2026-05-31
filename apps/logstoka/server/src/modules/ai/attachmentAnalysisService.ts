import type { SupabaseClient } from '@supabase/supabase-js';
import type { LogstokaConfig } from '../../config.js';
import { isDemoCompany } from '../../lib/demoAuth.js';
import {
  buildDemoProductFacts,
  findDemoMovementByReference,
  getDemoProductBySku,
  searchDemoCatalog,
} from '../../lib/demoCatalog.js';
import { getProductLocationByKey } from '../../lib/productLocation.js';
import { parseExcelBuffer, parsePdfBuffer, ocrImageBase64 } from '../../services/ocrImportService.js';
import { parseReportCsv } from '../../services/importParser.js';
import { suggestProduct } from './productSuggestService.js';
import { buildLogstokaSystemPrompt } from './systemPrompt.js';
import { chatOllama, describeImageWithOllama, generateOllamaJson } from './ollamaService.js';

export type AiAttachmentLink = {
  label: string;
  path: string;
};

export type AttachmentAnalysisRequest = {
  file_name: string;
  mime_type: string;
  base64: string;
  message?: string;
  screen?: string;
  userName?: string;
  companyName?: string;
};

export type AttachmentAnalysisResponse = {
  reply: string;
  links: AiAttachmentLink[];
  agents: string[];
  file_kind: string;
};

type ParsedAttachment = {
  document_summary: string;
  kind: 'product_photo' | 'invoice' | 'spreadsheet' | 'label' | 'report' | 'unknown';
  search_terms: string[];
  reference_codes: string[];
};

type WmsProductFact = {
  id: string;
  sku: string;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  total_stock: number;
  min_stock: number;
  below_minimum: boolean;
  location: string;
  warehouses: Array<{ name: string; quantity: number }>;
  product_path: string;
};

const MAX_EXTRACT_CHARS = 14_000;

function detectKindFromMime(mime: string, fileName: string): string {
  const m = mime.toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.includes('pdf')) return 'pdf';
  if (m.includes('spreadsheet') || m.includes('excel') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return 'spreadsheet';
  }
  if (m.includes('csv') || fileName.endsWith('.csv')) return 'csv';
  if (m.includes('text') || fileName.endsWith('.txt') || fileName.endsWith('.xml')) return 'text';
  return 'unknown';
}

async function extractAttachmentText(
  cfg: LogstokaConfig,
  fileName: string,
  mimeType: string,
  base64: string,
): Promise<{ text: string; kind: string }> {
  const kind = detectKindFromMime(mimeType, fileName.toLowerCase());

  if (kind === 'image') {
    try {
      const vision = await describeImageWithOllama(
        cfg,
        base64,
        mimeType,
        `Descreva esta imagem para operação de armazém (WMS) em português do Brasil.
Identifique: tipo (produto, etiqueta, nota fiscal, planilha fotografada), nome comercial, marca, EAN/GTIN, SKU, quantidades visíveis e qualquer referência (NF, pedido).
Seja factual; se não conseguir ver, diga o que é incerto.`,
      );
      return { text: vision.slice(0, MAX_EXTRACT_CHARS), kind: 'image' };
    } catch {
      const rows = await ocrImageBase64(cfg, base64, mimeType);
      const fromOcr = rows.map((r) => `${r.sku} x${r.quantity}`).join('\n');
      return {
        text: (fromOcr || `Foto enviada: ${fileName}. Descreva o produto na mensagem se a leitura automática falhar.`).slice(
          0,
          MAX_EXTRACT_CHARS,
        ),
        kind: 'image',
      };
    }
  }

  const buffer = Buffer.from(base64, 'base64');

  if (kind === 'pdf') {
    const rows = await parsePdfBuffer(buffer);
    const pdfParse = (await import('pdf-parse')).default;
    const parsed = await pdfParse(buffer);
    const text = [parsed.text ?? '', rows.map((r) => `${r.sku};${r.quantity}`).join('\n')].filter(Boolean).join('\n');
    return { text: text.slice(0, MAX_EXTRACT_CHARS), kind: 'pdf' };
  }

  if (kind === 'spreadsheet') {
    const rows = await parseExcelBuffer(buffer);
    const text = rows.map((r) => JSON.stringify(r)).join('\n');
    return { text: text.slice(0, MAX_EXTRACT_CHARS), kind: 'spreadsheet' };
  }

  if (kind === 'csv') {
    const text = buffer.toString('utf8');
    const rows = parseReportCsv(text);
    return {
      text: (rows.length ? rows.map((r) => JSON.stringify(r)).join('\n') : text).slice(0, MAX_EXTRACT_CHARS),
      kind: 'csv',
    };
  }

  if (kind === 'text') {
    return { text: buffer.toString('utf8').slice(0, MAX_EXTRACT_CHARS), kind: 'text' };
  }

  return { text: `Arquivo: ${fileName}`, kind: 'unknown' };
}

async function parseAttachmentWithAi(
  cfg: LogstokaConfig,
  fileName: string,
  fileKind: string,
  extractedText: string,
): Promise<ParsedAttachment> {
  try {
    const parsed = await generateOllamaJson<ParsedAttachment>(
      cfg,
      `Você é o Aiato (inteligência LogStoka). Analise o conteúdo extraído de um anexo operacional.
Retorne APENAS JSON válido:
{
  "document_summary": "resumo em 2-4 frases do que o arquivo contém",
  "kind": "product_photo|invoice|spreadsheet|label|report|unknown",
  "search_terms": ["termos para buscar produto no WMS — nomes, SKUs, EANs, marcas"],
  "reference_codes": ["NF-123", "MOV-2", referências de pedido/nota se houver]
}

Arquivo: ${fileName}
Tipo detectado: ${fileKind}
Conteúdo:
"""${extractedText.slice(0, 6000)}"""`,
    );
    return {
      document_summary: parsed.document_summary?.trim() || 'Conteúdo analisado.',
      kind: parsed.kind ?? 'unknown',
      search_terms: Array.isArray(parsed.search_terms) ? parsed.search_terms.filter(Boolean).slice(0, 8) : [],
      reference_codes: Array.isArray(parsed.reference_codes) ? parsed.reference_codes.filter(Boolean).slice(0, 6) : [],
    };
  } catch {
    return {
      document_summary: extractedText.slice(0, 280) || 'Anexo recebido.',
      kind: 'unknown',
      search_terms: extractedText.split(/\s+/).filter((w) => w.length >= 4).slice(0, 5),
      reference_codes: [],
    };
  }
}

async function fetchProductFactsFromDb(
  admin: SupabaseClient,
  companyId: string,
  productId: string,
): Promise<WmsProductFact | null> {
  const { data: product, error } = await admin
    .from('ls_products')
    .select('id, sku, name, brand, barcode, min_stock')
    .eq('company_id', companyId)
    .eq('id', productId)
    .maybeSingle();

  if (error || !product) return null;

  const { data: stockRows } = await admin
    .from('ls_stock')
    .select('quantity, ls_warehouses(name)')
    .eq('company_id', companyId)
    .eq('product_id', productId);

  const warehouses = (stockRows ?? []).map((row) => {
    const w = row.ls_warehouses as { name?: string } | null;
    return { name: w?.name ?? 'Depósito', quantity: Number(row.quantity ?? 0) };
  });
  const total_stock = warehouses.reduce((sum, w) => sum + w.quantity, 0);
  const min_stock = Number(product.min_stock ?? 0);
  const location = getProductLocationByKey(String(product.sku));

  return {
    id: String(product.id),
    sku: String(product.sku),
    name: String(product.name),
    brand: product.brand as string | null,
    barcode: product.barcode as string | null,
    total_stock,
    min_stock,
    below_minimum: total_stock <= min_stock,
    location: location.label,
    warehouses,
    product_path: `/app/products/${product.id}`,
  };
}

async function resolveWmsMatches(
  cfg: LogstokaConfig,
  admin: SupabaseClient | null,
  companyId: string,
  parsed: ParsedAttachment,
  extractedText: string,
): Promise<{ products: WmsProductFact[]; movement_links: AiAttachmentLink[] }> {
  const productsById = new Map<string, WmsProductFact>();
  const movement_links: AiAttachmentLink[] = [];
  const terms = [...new Set([...parsed.search_terms, ...parsed.reference_codes])];

  const skuInText = extractedText.match(/\b[A-Z]{2,}[-][A-Z0-9-]{2,}\b/gi) ?? [];
  for (const sku of skuInText) terms.push(sku);

  if (isDemoCompany(companyId)) {
    for (const ref of parsed.reference_codes) {
      const mov = findDemoMovementByReference(ref);
      if (mov) {
        movement_links.push({
          label: `Movimentação ${mov.reference_code}`,
          path: `/app/movements/${mov.id}`,
        });
        const prod = getDemoProductBySku(mov.sku);
        if (prod) productsById.set(prod.id, buildDemoProductFacts(prod));
      }
    }
    for (const term of terms) {
      for (const hit of searchDemoCatalog(term, 4)) {
        if (!productsById.has(hit.id)) productsById.set(hit.id, buildDemoProductFacts(hit));
      }
    }
    return { products: [...productsById.values()].slice(0, 6), movement_links };
  }

  if (!admin) return { products: [], movement_links };

  for (const ref of parsed.reference_codes) {
    const { data: movements } = await admin
      .from('ls_stock_movements')
      .select('id, reference_code, sku')
      .eq('company_id', companyId)
      .ilike('reference_code', `%${ref}%`)
      .limit(3);

    for (const mov of movements ?? []) {
      movement_links.push({
        label: `Movimentação ${mov.reference_code ?? mov.id}`,
        path: `/app/movements/${mov.id}`,
      });
      if (mov.sku) {
        const suggestion = await suggestProduct(cfg, admin, companyId, String(mov.sku));
        for (const match of suggestion.local_matches.slice(0, 1)) {
          const facts = await fetchProductFactsFromDb(admin, companyId, match.id);
          if (facts) productsById.set(facts.id, facts);
        }
      }
    }
  }

  for (const term of terms) {
    if (term.trim().length < 2) continue;
    try {
      const suggestion = await suggestProduct(cfg, admin, companyId, term.slice(0, 120));
      for (const match of suggestion.local_matches) {
        const facts = await fetchProductFactsFromDb(admin, companyId, match.id);
        if (facts) productsById.set(facts.id, facts);
      }
      if (suggestion.ai_suggestion?.name) {
        const byName = await suggestProduct(cfg, admin, companyId, suggestion.ai_suggestion.name);
        for (const match of byName.local_matches.slice(0, 2)) {
          const facts = await fetchProductFactsFromDb(admin, companyId, match.id);
          if (facts) productsById.set(facts.id, facts);
        }
      }
    } catch {
      /* continua */
    }
  }

  return { products: [...productsById.values()].slice(0, 6), movement_links };
}

function buildLinksFromFacts(products: WmsProductFact[], movement_links: AiAttachmentLink[]): AiAttachmentLink[] {
  const links: AiAttachmentLink[] = [];
  const seen = new Set<string>();
  for (const m of movement_links) {
    if (!seen.has(m.path)) {
      seen.add(m.path);
      links.push(m);
    }
  }
  for (const p of products) {
    if (!seen.has(p.product_path)) {
      seen.add(p.product_path);
      links.push({ label: `${p.name} (${p.sku})`, path: p.product_path });
    }
  }
  return links;
}

const ATTACHMENT_REPLY_RULES = `
Regras para resposta de ANEXO:
- Use APENAS os dados do bloco WMS_MATCHES e DOCUMENTO; nunca invente SKU, quantidade ou localização.
- Responda em português do Brasil, com bullets curtos quando listar itens.
- Para cada produto encontrado informe: nome, SKU, estoque total, depósitos, se está abaixo do mínimo, localização WMS (corredor/prateleira/nível).
- Inclua links markdown internos: [texto](/app/caminho) usando EXATAMENTE os paths de WMS_MATCHES.
- Se nenhum produto corresponder, resuma o arquivo e oriente cadastro em [Novo produto](/app/produto/add) ou busca em [Produtos](/app/products).
- Não mencione Llama, Ollama ou nomes de modelos — você é o Aiato.
`;

export async function analyzeAttachment(
  cfg: LogstokaConfig,
  admin: SupabaseClient | null,
  companyId: string,
  params: AttachmentAnalysisRequest,
): Promise<AttachmentAnalysisResponse> {
  const fileName = params.file_name.trim() || 'anexo';
  const mimeType = params.mime_type.trim() || 'application/octet-stream';
  const { text: extractedText, kind: fileKind } = await extractAttachmentText(cfg, fileName, mimeType, params.base64);
  const parsed = await parseAttachmentWithAi(cfg, fileName, fileKind, extractedText);
  const { products, movement_links } = await resolveWmsMatches(cfg, admin, companyId, parsed, extractedText);
  const links = buildLinksFromFacts(products, movement_links);

  const ragContext = JSON.stringify(
    {
      attachment: {
        file_name: fileName,
        file_kind: fileKind,
        parsed_kind: parsed.kind,
        summary: parsed.document_summary,
      },
      wms_matches: products,
      movement_links,
      allowed_paths: links.map((l) => l.path),
    },
    null,
    2,
  );

  const systemPrompt =
    buildLogstokaSystemPrompt({
      companyName: params.companyName,
      userName: params.userName,
      screen: params.screen,
      ragContext,
    }) + ATTACHMENT_REPLY_RULES;

  const userMessage =
    params.message?.trim() ||
    `Analise o anexo "${fileName}" e diga o que é, resumo do conteúdo e onde está no WMS (com links).`;

  const reply = await chatOllama(cfg, {
    systemPrompt,
    userMessage,
  });

  return {
    reply,
    links,
    agents: products.length ? ['products', 'imports'] : ['imports'],
    file_kind: fileKind,
  };
}
