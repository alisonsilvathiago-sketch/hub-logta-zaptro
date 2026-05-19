export type ManualRouteRecord = {
  id: string;
  nome: string;
  motorista: string;
  veiculo: string;
  origem: string;
  destino: string;
  status: string;
  progress: number;
  stops: number;
  createdAt: string;
};

const STORAGE_KEY = 'logta-manual-routes';

export function loadManualRoutes(): ManualRouteRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ManualRouteRecord[];
  } catch {
    return [];
  }
}

export function saveManualRoutes(routes: ManualRouteRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routes.slice(0, 50)));
}

export function appendManualRoute(
  input: Omit<ManualRouteRecord, 'id' | 'status' | 'progress' | 'stops' | 'createdAt'>,
): ManualRouteRecord {
  const entry: ManualRouteRecord = {
    ...input,
    id: `RT-M${Date.now().toString().slice(-6)}`,
    status: 'Em Rota',
    progress: 0,
    stops: 1,
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...loadManualRoutes()];
  saveManualRoutes(next);
  return entry;
}
