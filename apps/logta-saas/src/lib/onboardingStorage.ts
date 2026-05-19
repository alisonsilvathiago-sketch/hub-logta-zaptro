export const ONBOARDING_STORAGE_KEY = 'logta-onboarding-profile';
export const ONBOARDING_COMPLETE_KEY = 'logta-onboarding-complete';
export const TRIAL_END_KEY = 'logta-trial-ends-at';

export const TRIAL_DAYS = 5;

export type OnboardingModuleId =
  | 'financeiro'
  | 'crm'
  | 'operacoes'
  | 'frota'
  | 'rastreamento'
  | 'oficina'
  | 'hubchat'
  | 'ia'
  | 'logdock'
  | 'relatorios';

export type OnboardingTeamSize = '1-5' | '5-20' | '20-50' | '50+';

export type OnboardingProfile = {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  document: string;
  teamSize: OnboardingTeamSize;
  vehiclesCount: string;
  workTypes: string[];
  mainChallenge: string;
  /** Endereço da sede — todos opcionais no cadastro. */
  addressCep: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  modules: OnboardingModuleId[];
  primaryColor: string;
  city: string;
  state: string;
  website: string;
  instagram: string;
  notes: string;
  logoDataUrl: string | null;
  companyPhotoDataUrl: string | null;
  completedAt: string;
  trialEndsAt: string;
};

export function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function saveOnboardingProfile(p: OnboardingProfile): void {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(p));
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, '1');
    localStorage.setItem(TRIAL_END_KEY, p.trialEndsAt);
  } catch {
    /* quota or private mode */
  }
}

export function loadOnboardingProfile(): OnboardingProfile | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<OnboardingProfile>;
    if (!p || typeof p !== 'object' || !p.companyName) return null;
    return {
      ...p,
      addressCep: p.addressCep ?? '',
      addressStreet: p.addressStreet ?? '',
      addressNumber: p.addressNumber ?? '',
      addressComplement: p.addressComplement ?? '',
    } as OnboardingProfile;
  } catch {
    return null;
  }
}

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === '1';
}

export function getTrialEndsAt(): string | null {
  return localStorage.getItem(TRIAL_END_KEY);
}

export function trialDaysRemaining(): number | null {
  const end = getTrialEndsAt();
  if (!end) return null;
  const t = new Date(end).getTime() - Date.now();
  if (t <= 0) return 0;
  return Math.ceil(t / (86400 * 1000));
}

/** Atalhos do painel inicial conforme módulos escolhidos no onboarding */
export const MODULE_ROUTE: Record<OnboardingModuleId, string> = {
  financeiro: '/financeiro',
  crm: '/crm',
  operacoes: '/fretes',
  frota: '/frota',
  rastreamento: '/mapa-ao-vivo',
  oficina: '/frota',
  hubchat: '/inicio',
  ia: '/automacoes',
  logdock: '/documentos',
  relatorios: '/relatorios',
};
