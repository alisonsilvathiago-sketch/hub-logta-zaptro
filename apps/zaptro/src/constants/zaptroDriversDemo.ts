import { isZaptroPreviewDataEnabled } from '../lib/zaptroPreviewMode';

/** Motoristas fictícios quando `whatsapp_drivers` está vazio (pré-visualização). */

const HIDDEN_KEY = 'zaptro_demo_drivers_hidden_v1';

export function isZaptroDriversDemoEnabled(): boolean {
  return isZaptroPreviewDataEnabled();
}

export function isZaptroDemoDriverId(id: string): boolean {
  return String(id).startsWith('zaptro-demo-driver-');
}

export function readHiddenZaptroDemoDriverIds(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function hideZaptroDemoDriverId(id: string): void {
  const prev = readHiddenZaptroDemoDriverIds();
  if (prev.includes(id)) return;
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...prev, id]));
  } catch {
    /* ignore */
  }
}

export function resetHiddenZaptroDemoDrivers(): void {
  try {
    localStorage.removeItem(HIDDEN_KEY);
  } catch {
    /* ignore */
  }
}

export const ZAPTRO_DEMO_DRIVERS: Array<{ id: string; name: string; phone: string; vehicle: string; status: string; photo_url?: string }> = [
  {
    id: 'zaptro-demo-driver-1',
    name: 'João Ferreira',
    phone: '5511987654321',
    vehicle: 'Mercedes Actros · ABC1D23',
    status: 'ativo',
    photo_url: 'https://i.pravatar.cc/150?u=joao',
  },
  {
    id: 'zaptro-demo-driver-2',
    name: 'Maria Santos',
    phone: '5511976543210',
    vehicle: 'Scania R450 · XYZ9W87',
    status: 'ativo',
    photo_url: 'https://i.pravatar.cc/150?u=maria',
  },
  {
    id: 'zaptro-demo-driver-3',
    name: 'Pedro Costa',
    phone: '5511965432109',
    vehicle: 'Volvo FH · QWE4R56',
    status: 'inativo',
    photo_url: 'https://i.pravatar.cc/150?u=pedro',
  },
  {
    id: 'zaptro-demo-driver-4',
    name: 'Ana Oliveira',
    phone: '5511954321098',
    vehicle: 'Iveco Hi-Way · KJH7L89',
    status: 'ativo',
    photo_url: 'https://i.pravatar.cc/150?u=ana',
  },
  {
    id: 'zaptro-demo-driver-5',
    name: 'Carlos Mendes',
    phone: '5511943210987',
    vehicle: 'Mercedes Actros · ABC1D23',
    status: 'ativo',
    photo_url: 'https://i.pravatar.cc/150?u=carlos',
  },
  {
    id: 'zaptro-demo-driver-6',
    name: 'Fernanda Lima',
    phone: '5511932109876',
    vehicle: 'Volkswagen Constellation · MNO3P45',
    status: 'bloqueado',
    photo_url: 'https://i.pravatar.cc/150?u=fernanda',
  },
];
