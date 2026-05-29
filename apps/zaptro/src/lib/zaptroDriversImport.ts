import { supabaseZaptro } from './supabase-zaptro';
import { saveDriverExtendedProfile } from './zaptroDriverProfileExtended';
import { csvDataLines, parseCsvHeaders, parseCsvLine } from './zaptroCsvParse';

export type DriverCsvRow = {
  nome: string;
  whatsapp: string;
  email?: string;
  cpf?: string;
  veiculo?: string;
  status?: string;
  endereco?: string;
  notas?: string;
};

export function parseDriversCsv(text: string): DriverCsvRow[] {
  const headerInfo = parseCsvHeaders(text);
  if (!headerInfo) return [];
  const { idx } = headerInfo;

  const iNome = idx('nome');
  const iWa = idx('whatsapp');
  if (iNome < 0 || iWa < 0) return [];

  const rows: DriverCsvRow[] = [];
  for (const line of csvDataLines(text)) {
    const cols = parseCsvLine(line);
    const nome = cols[iNome]?.trim();
    const whatsapp = cols[iWa]?.trim();
    if (!nome || !whatsapp || nome.toLowerCase().includes('exemplo')) continue;
    rows.push({
      nome,
      whatsapp,
      email: idx('email') >= 0 ? cols[idx('email')]?.trim() : undefined,
      cpf: idx('cpf') >= 0 ? cols[idx('cpf')]?.trim() : undefined,
      veiculo: idx('veiculo') >= 0 ? cols[idx('veiculo')]?.trim() : undefined,
      status: idx('status') >= 0 ? cols[idx('status')]?.trim() || 'ativo' : 'ativo',
      endereco: idx('endereco') >= 0 ? cols[idx('endereco')]?.trim() : undefined,
      notas: idx('notas') >= 0 ? cols[idx('notas')]?.trim() : undefined,
    });
  }
  return rows;
}

export async function importDriversCsvRows(
  companyId: string,
  rows: DriverCsvRow[],
): Promise<{ imported: number; failed: number }> {
  let imported = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const phone = row.whatsapp.replace(/\D/g, '');
      if (phone.length < 10) {
        failed += 1;
        continue;
      }
      const { data, error } = await supabaseZaptro
        .from('whatsapp_drivers')
        .insert([
          {
            company_id: companyId,
            name: row.nome,
            phone,
            vehicle: row.veiculo?.trim() || null,
            status: row.status || 'ativo',
          },
        ])
        .select('id')
        .single();
      if (error) throw error;
      if (data?.id) {
        saveDriverExtendedProfile(String(data.id), {
          email: row.email ?? '',
          address: row.endereco ?? '',
          cpf: row.cpf ?? '',
          notes: row.notas ?? '',
        });
      }
      imported += 1;
    } catch {
      failed += 1;
    }
  }

  return { imported, failed };
}

export const DRIVER_CSV_TEMPLATE_HEADERS = [
  'nome',
  'whatsapp',
  'email',
  'cpf',
  'veiculo',
  'status',
  'endereco',
  'notas',
];

export const DRIVER_CSV_TEMPLATE_EXAMPLE = [
  'João Ferreira',
  '5511987654321',
  'joao@exemplo.com',
  '12345678901',
  'ABC1D23 · Mercedes Actros',
  'ativo',
  'São Paulo, SP',
  'Motorista agregado',
];
