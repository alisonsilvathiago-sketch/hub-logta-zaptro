import { supabaseZaptro } from './supabase-zaptro';
import { saveDemoVehicleEdit, type ZaptroVehicleDemo } from '../constants/zaptroVehiclesDemo';
import { csvDataLines, parseCsvHeaders, parseCsvLine } from './zaptroCsvParse';

export type VehicleCsvRow = {
  placa: string;
  tipo: string;
  marca: string;
  modelo: string;
  ano: string;
  status: ZaptroVehicleDemo['status'];
  motorista?: string;
  combustivel?: string;
  capacidade_carga?: string;
};

const VALID_STATUS = new Set<ZaptroVehicleDemo['status']>(['disponivel', 'em_rota', 'manutencao', 'inativo']);

function normalizeStatus(raw?: string): ZaptroVehicleDemo['status'] {
  const s = (raw ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (VALID_STATUS.has(s as ZaptroVehicleDemo['status'])) return s as ZaptroVehicleDemo['status'];
  if (s === 'disponível') return 'disponivel';
  if (s === 'em rota') return 'em_rota';
  if (s === 'manutenção') return 'manutencao';
  return 'disponivel';
}

export function parseVehiclesCsv(text: string): VehicleCsvRow[] {
  const headerInfo = parseCsvHeaders(text);
  if (!headerInfo) return [];
  const { idx } = headerInfo;

  const iPlaca = idx('placa');
  if (iPlaca < 0) return [];

  const rows: VehicleCsvRow[] = [];
  for (const line of csvDataLines(text)) {
    const cols = parseCsvLine(line);
    const placa = cols[iPlaca]?.trim();
    if (!placa || placa.toLowerCase().includes('exemplo')) continue;
    rows.push({
      placa,
      tipo: idx('tipo') >= 0 ? cols[idx('tipo')]?.trim() || 'Caminhão' : 'Caminhão',
      marca: idx('marca') >= 0 ? cols[idx('marca')]?.trim() || '—' : '—',
      modelo: idx('modelo') >= 0 ? cols[idx('modelo')]?.trim() || '—' : '—',
      ano: idx('ano') >= 0 ? cols[idx('ano')]?.trim() || '—' : '—',
      status: normalizeStatus(idx('status') >= 0 ? cols[idx('status')] : undefined),
      motorista: idx('motorista') >= 0 ? cols[idx('motorista')]?.trim() : undefined,
      combustivel: idx('combustivel') >= 0 ? cols[idx('combustivel')]?.trim() : undefined,
      capacidade_carga: idx('capacidade_carga') >= 0 ? cols[idx('capacidade_carga')]?.trim() : undefined,
    });
  }
  return rows;
}

export async function importVehiclesCsvRows(
  rows: VehicleCsvRow[],
  opts?: { demo?: boolean },
): Promise<{ imported: number; failed: number }> {
  let imported = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      if (opts?.demo) {
        const id = `import-v-${Date.now()}-${imported}`;
        saveDemoVehicleEdit(id, {
          id,
          plate: row.placa,
          type: row.tipo,
          brand: row.marca,
          model: row.modelo,
          year: row.ano,
          status: row.status,
          driver: row.motorista ?? null,
          fuelType: row.combustivel,
          loadCapacity: row.capacidade_carga,
        });
        imported += 1;
        continue;
      }

      const { error } = await supabaseZaptro.from('veiculos').insert({
        placa: row.placa,
        tipo: row.tipo,
        marca: row.marca,
        modelo: row.modelo,
        ano: row.ano,
        status: row.status,
      });
      if (error) throw error;
      imported += 1;
    } catch {
      failed += 1;
    }
  }

  return { imported, failed };
}

export const VEHICLE_CSV_TEMPLATE_HEADERS = [
  'placa',
  'tipo',
  'marca',
  'modelo',
  'ano',
  'status',
  'motorista',
  'combustivel',
  'capacidade_carga',
];

export const VEHICLE_CSV_TEMPLATE_EXAMPLE = [
  'ABC1D23',
  'Caminhão',
  'Mercedes',
  'Actros',
  '2022',
  'disponivel',
  'João Ferreira',
  'Diesel',
  '12 ton',
];
