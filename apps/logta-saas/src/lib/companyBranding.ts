import { loadEmpresaProfile } from './empresaProfileStorage';

/** Logo e nome da empresa para páginas públicas (motorista, orçamento). */
export function resolveCompanyBranding(companyId: string) {
  const profile = loadEmpresaProfile(companyId);
  return {
    logoUrl: profile.logoDataUrl,
    companyName: profile.nomeFantasia || profile.razaoSocial || 'Logta',
  };
}
