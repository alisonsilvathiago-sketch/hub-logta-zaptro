/** URLs de marca, fotos e mocks operacionais — alinhados a LogtaClientProfile / LogtaDriverDetail / LogtaAdmin. */

export const LOGTA_COMPANY_LOGO_BY_ID: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=256&h=256&fit=crop&q=80',
  'demo-11': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=256&h=256&fit=crop&q=80',
  'demo-12': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=256&h=256&fit=crop&q=80',
  'demo-13': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=256&h=256&fit=crop&q=80',
  'demo-20': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=256&h=256&fit=crop&q=80',
  'demo-21': 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=256&h=256&fit=crop&q=80',
  'demo-23': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=256&h=256&fit=crop&q=80',
};

export const LOGTA_DRIVER_PHOTO_BY_ID: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&q=80',
  'demo-11': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&q=80',
  'demo-12': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&q=80',
  'demo-13': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop&q=80',
};

export const LOGTA_COLLAB_PHOTO_BY_ID: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop&q=80',
  '2': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&q=80',
  '3': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&q=80',
};

export type LogtaHubDriverRow = {
  driverId: string;
  clientId: string;
  name: string;
  license: string;
  status: string;
  routeId?: string;
  routeLabel?: string;
  vehicle?: string;
  mapPosition?: [number, number];
};

/** Motoristas canônicos do Hub — IDs iguais a LogtaAdmin / LogtaDriverDetail. */
export const LOGTA_HUB_DRIVERS: LogtaHubDriverRow[] = [
  {
    driverId: '1',
    clientId: '1',
    name: 'Ricardo Silva',
    license: 'CNH E - Especializada',
    status: 'Em Rota',
    routeId: 'RT-9021',
    routeLabel: 'São Paulo → Rio de Janeiro',
    vehicle: 'Scania R450',
    mapPosition: [-23.55052, -46.633308],
  },
  {
    driverId: 'demo-11',
    clientId: 'demo-11',
    name: 'Ana Oliveira',
    license: 'CNH D - Regional',
    status: 'Em Rota',
    routeId: 'RT-8912',
    routeLabel: 'Curitiba → Porto Alegre',
    vehicle: 'Volvo FH 540',
    mapPosition: [-23.542, -46.625],
  },
  {
    driverId: 'demo-12',
    clientId: 'demo-12',
    name: 'Carlos Souza',
    license: 'CNH D - Urbano',
    status: 'Disponível',
    routeId: 'RT-9055',
    routeLabel: 'Belo Horizonte → Brasília',
    vehicle: 'Mercedes Actros',
    mapPosition: [-23.538, -46.615],
  },
  {
    driverId: 'demo-13',
    clientId: 'demo-13',
    name: 'Pedro Mendes',
    license: 'CNH E - Carga Perigosa',
    status: 'Em Rota',
    routeId: 'RT-9101',
    routeLabel: 'Campinas → Salvador',
    vehicle: 'Iveco Hi-Way',
    mapPosition: [-23.555, -46.638],
  },
];

const DEFAULT_CLIENT_DRIVERS: LogtaHubDriverRow[] = [
  LOGTA_HUB_DRIVERS[0],
  {
    driverId: '1',
    clientId: '_default',
    name: 'Ricardo Silva',
    license: 'CNH E - Especializada',
    status: 'Em Rota',
    routeId: 'RT-9021',
    routeLabel: 'São Paulo → Rio de Janeiro',
    vehicle: 'Scania R450',
    mapPosition: [-23.55052, -46.633308],
  },
  {
    driverId: 'demo-11',
    clientId: '_default',
    name: 'Ana Oliveira',
    license: 'CNH D - Regional',
    status: 'Em Rota',
    routeId: 'RT-8912',
    routeLabel: 'Curitiba → Porto Alegre',
    vehicle: 'Volvo FH 540',
    mapPosition: [-23.542, -46.625],
  },
  {
    driverId: 'demo-12',
    clientId: '_default',
    name: 'Carlos Souza',
    license: 'CNH D - Urbano',
    status: 'Disponível',
    routeId: 'RT-9055',
    routeLabel: 'Belo Horizonte → Brasília',
    vehicle: 'Mercedes Actros',
    mapPosition: [-23.538, -46.615],
  },
];

export function driversForClient(clientId: string): LogtaHubDriverRow[] {
  const scoped = LOGTA_HUB_DRIVERS.filter(d => d.clientId === clientId);
  if (scoped.length > 0) return scoped;
  if (clientId === '1' || clientId.startsWith('demo-')) {
    return [LOGTA_HUB_DRIVERS[0]];
  }
  return DEFAULT_CLIENT_DRIVERS;
}

export function initialsFromName(name?: string, max = 2): string {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, max).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export function resolveCompanyLogo(
  company: {
    id?: string;
    logoUrl?: string | null;
    logo_url?: string | null;
    name?: string;
  },
  options?: { includeMock?: boolean },
): string | null {
  const real = (company.logoUrl || company.logo_url || '').trim();
  if (real) return real;
  if (options?.includeMock === false) return null;
  return (company.id ? LOGTA_COMPANY_LOGO_BY_ID[company.id] : null) || null;
}

export function resolveDriverPhoto(
  driverId?: string,
  photoUrl?: string | null,
): string | null {
  if (photoUrl) return photoUrl;
  if (!driverId) return null;
  return LOGTA_DRIVER_PHOTO_BY_ID[driverId] || null;
}

export function resolveCollabPhoto(collabId?: string | number): string | null {
  if (collabId == null) return null;
  return LOGTA_COLLAB_PHOTO_BY_ID[String(collabId)] || null;
}
