import type { ShipmentNormalized } from '../modules/fretes/types';

export type FreteDetailRecord = {
  id: string;
  numero_frete: string;
  cliente_nome: string;
  origem: string;
  destino: string;
  status: string;
  valor_frete: number;
  tipo_carga: string;
  metadata?: Record<string, unknown>;
  motoristas?: { id?: string; nome?: string; telefone?: string; cnh?: string } | null;
  veiculos?: { placa?: string; modelo?: string } | null;
  vehicles?: { plate?: string; modelo?: string } | null;
  distancia_km?: number;
  cte?: string;
  mdfe?: string;
};

export function normalizeFreteDetail(
  raw: Record<string, unknown> | ShipmentNormalized | null | undefined,
  fallbackId?: string,
): FreteDetailRecord | null {
  if (!raw) return null;
  const meta = ((raw as Record<string, unknown>).metadata as Record<string, unknown>) || {};
  const vehicles = (raw as Record<string, unknown>).vehicles as { plate?: string; modelo?: string } | undefined;
  const veiculos = (raw as Record<string, unknown>).veiculos as { placa?: string } | undefined;

  return {
    ...(raw as FreteDetailRecord),
    id: String((raw as Record<string, unknown>).id || fallbackId || ''),
    numero_frete: String(
      meta.numero_frete ||
        (raw as Record<string, unknown>).numero_frete ||
        String((raw as Record<string, unknown>).id || '').slice(0, 8).toUpperCase(),
    ),
    cliente_nome: String(
      meta.cliente_nome || (raw as Record<string, unknown>).cliente_nome || 'Cliente',
    ),
    origem: String((raw as Record<string, unknown>).origin || (raw as Record<string, unknown>).origem || ''),
    destino: String(
      (raw as Record<string, unknown>).destination || (raw as Record<string, unknown>).destino || '',
    ),
    status: String((raw as Record<string, unknown>).status || 'pending'),
    valor_frete: Number(meta.valor_frete ?? (raw as Record<string, unknown>).valor_frete ?? 0),
    tipo_carga: String(meta.tipo_carga || (raw as Record<string, unknown>).tipo_carga || 'Normal'),
    metadata: meta,
    motoristas: ((raw as Record<string, unknown>).motoristas as FreteDetailRecord['motoristas']) || null,
    veiculos: veiculos || (vehicles ? { placa: vehicles.plate, modelo: vehicles.modelo } : null),
    vehicles: vehicles || null,
  };
}

export function findShipmentForDetail(shipments: ShipmentNormalized[], id?: string) {
  if (!id) return null;
  const needle = id.trim();
  const upper = needle.toUpperCase();
  return (
    shipments.find((s) => {
      if (s.id === needle || s.id === upper) return true;
      const nr = (s.numero_frete || '').toUpperCase();
      if (nr && nr === upper) return true;
      const metaNr = String((s.metadata as Record<string, unknown> | undefined)?.numero_frete || '').toUpperCase();
      if (metaNr && metaNr === upper) return true;
      if (upper.length >= 4 && nr.includes(upper)) return true;
      return false;
    }) ?? null
  );
}
