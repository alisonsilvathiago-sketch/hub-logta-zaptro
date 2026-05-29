export type WaLinkCrmContextPayload = {
  synced_at?: string;
  company_name?: string;
  products_label?: string;
  quotes?: Array<{
    label: string;
    status: string;
    origin?: string;
    destination?: string;
    value?: number;
  }>;
  routes?: Array<{
    label: string;
    status_label: string;
    origin?: string | null;
    dest?: string | null;
    track_token?: string;
  }>;
};

function readMetaString(metadata: unknown, key: string): string {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return '';
  const v = (metadata as Record<string, unknown>)[key];
  return typeof v === 'string' ? v.trim() : '';
}

export function readCrmContextFromMetadata(metadata: unknown): WaLinkCrmContextPayload | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const raw = (metadata as Record<string, unknown>).crm_context;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as WaLinkCrmContextPayload;
}

export function formatWaCrmContextForPrompt(
  metadata: unknown,
  crmContext?: WaLinkCrmContextPayload | null,
): string {
  const ctx = crmContext ?? readCrmContextFromMetadata(metadata);
  const lines: string[] = [];

  const company =
    ctx?.company_name?.trim() ||
    readMetaString(metadata, 'company_name') ||
    readMetaString(metadata, 'companyName');
  if (company) lines.push(`Empresa do cliente: ${company}.`);

  const cpf = readMetaString(metadata, 'cpf').replace(/\D/g, '');
  const cnpj = readMetaString(metadata, 'cnpj').replace(/\D/g, '');
  if (cnpj.length === 14) lines.push(`CNPJ: ${cnpj}.`);
  else if (cpf.length === 11) lines.push(`CPF: ${cpf}.`);

  const notes = readMetaString(metadata, 'notes');
  if (notes) lines.push(`Notas internas: ${notes.slice(0, 400)}.`);

  if (ctx?.routes?.length) {
    lines.push('Rotas activas / entregas:');
    for (const r of ctx.routes.slice(0, 3)) {
      const routeLine = [
        r.label,
        r.status_label,
        r.origin && r.dest ? `${r.origin} → ${r.dest}` : r.dest || r.origin,
      ]
        .filter(Boolean)
        .join(' · ');
      lines.push(`- ${routeLine}`);
    }
  }

  if (ctx?.quotes?.length) {
    lines.push('Orçamentos / comercial:');
    for (const q of ctx.quotes.slice(0, 4)) {
      const val = typeof q.value === 'number' && q.value > 0 ? ` · R$ ${q.value}` : '';
      const od = q.origin && q.destination ? ` · ${q.origin} → ${q.destination}` : '';
      lines.push(`- ${q.label} · ${q.status}${val}${od}`);
    }
  } else if (ctx?.products_label?.trim()) {
    lines.push(`Resumo operacional: ${ctx.products_label.trim()}.`);
  }

  if (!lines.length) return '';
  return ['Dados reais do cliente (use apenas o que está aqui — não invente):', ...lines].join('\n');
}
