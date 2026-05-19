export type EmpresaPublicProfile = {
  logoDataUrl: string | null;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  /** Cor de destaque na página pública (barra da tabela, total). */
  accentColor: string;
};

const STORAGE_PREFIX = 'logta-empresa-profile';

export const DEFAULT_EMPRESA_PROFILE: EmpresaPublicProfile = {
  logoDataUrl: null,
  razaoSocial: 'Logta Transportes LTDA',
  nomeFantasia: 'Logta Matriz',
  cnpj: '12.345.678/0001-99',
  endereco: 'Av. Paulista, 1000 - São Paulo, SP',
  accentColor: '#000000',
};

function storageKey(companyId: string) {
  return `${STORAGE_PREFIX}:${companyId}`;
}

export function loadEmpresaProfile(companyId: string): EmpresaPublicProfile {
  if (typeof window === 'undefined') return { ...DEFAULT_EMPRESA_PROFILE };
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return { ...DEFAULT_EMPRESA_PROFILE };
    return { ...DEFAULT_EMPRESA_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_EMPRESA_PROFILE };
  }
}

export function saveEmpresaProfile(companyId: string, profile: EmpresaPublicProfile) {
  localStorage.setItem(storageKey(companyId), JSON.stringify(profile));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
