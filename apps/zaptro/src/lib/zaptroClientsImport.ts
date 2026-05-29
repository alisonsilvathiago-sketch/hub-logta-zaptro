import { registerWaLinkClient } from '../modules/wa-link/waLinkRegisterClient';

export type ClientCsvRow = {
  nome: string;
  whatsapp: string;
  email?: string;
  empresa?: string;
  cpf_ou_cnpj?: string;
  notas?: string;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseClientsCsv(text: string): ClientCsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => headers.indexOf(name);

  const iNome = idx('nome');
  const iWa = idx('whatsapp');
  if (iNome < 0 || iWa < 0) return [];

  const iEmail = idx('email');
  const iEmpresa = idx('empresa');
  const iDoc = idx('cpf_ou_cnpj');
  const iNotas = idx('notas');

  const rows: ClientCsvRow[] = [];
  for (let n = 1; n < lines.length; n += 1) {
    const cols = parseCsvLine(lines[n]);
    const nome = cols[iNome]?.trim();
    const whatsapp = cols[iWa]?.trim();
    if (!nome || !whatsapp || nome.toLowerCase().includes('exemplo')) continue;
    rows.push({
      nome,
      whatsapp,
      email: iEmail >= 0 ? cols[iEmail]?.trim() : undefined,
      empresa: iEmpresa >= 0 ? cols[iEmpresa]?.trim() : undefined,
      cpf_ou_cnpj: iDoc >= 0 ? cols[iDoc]?.trim() : undefined,
      notas: iNotas >= 0 ? cols[iNotas]?.trim() : undefined,
    });
  }
  return rows;
}

export async function importClientsCsvRows(
  companyId: string,
  rows: ClientCsvRow[],
): Promise<{ imported: number; updated: number; failed: number }> {
  let imported = 0;
  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const docDigits = row.cpf_ou_cnpj?.replace(/\D/g, '') ?? '';
      const docType = docDigits.length === 14 ? ('cnpj' as const) : docDigits.length === 11 ? ('cpf' as const) : undefined;
      const result = await registerWaLinkClient({
        companyId,
        name: row.nome,
        phone: row.whatsapp,
        companyName: row.empresa,
        documentType: docType,
        document: row.cpf_ou_cnpj,
        email: row.email,
        notes: row.notas,
        source: 'clients_csv_import',
      });
      if (result.created) imported += 1;
      else updated += 1;
    } catch {
      failed += 1;
    }
  }

  return { imported, updated, failed };
}
