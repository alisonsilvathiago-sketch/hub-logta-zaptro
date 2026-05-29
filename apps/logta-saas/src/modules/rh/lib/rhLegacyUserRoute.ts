import { buildEquipeRouteId, equipeProfileUrl } from './equipeRouteId';
import {
  findColaboradorRhProfileByRouteId,
  listColaboradorProfilesForCompany,
} from '../ponto/colaboradorRhStorage';

/** IDs legados em mocks (`usr-*`) → colaborador RH no sandbox. */
export const RH_LEGACY_USR_TO_COLAB_ID: Record<string, string> = {
  'usr-1': 'colab-45678912345',
  'usr-2': 'colab-98765432100',
  'usr-3': 'colab-12345678901',
};

/** Nome exibido nos mocks quando não há colab no sandbox. */
export const RH_LEGACY_USR_DISPLAY_NAME: Record<string, string> = {
  'usr-1': 'Carlos Henrique',
  'usr-2': 'Ana Paula Mendes',
  'usr-3': 'Roberto Silva',
  'usr-4': 'Mariana Costa',
  'usr-5': 'Fernando Souza',
  'usr-6': 'Juliana Pereira',
};

export function isLegacyUsrRouteId(id: string): boolean {
  return /^usr-\d+$/.test(id.trim());
}

export function resolveLegacyUsrColabId(usrId: string): string | null {
  return RH_LEGACY_USR_TO_COLAB_ID[usrId] ?? null;
}

function namesLooselyMatch(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (x === y) return true;
  if (x.startsWith(y) || y.startsWith(x)) return true;
  const xFirst = x.split(/\s+/)[0];
  const yFirst = y.split(/\s+/)[0];
  return xFirst.length > 2 && xFirst === yFirst;
}

/** URL canónica do perfil 360° a partir de `usr-*`, `colab-*` ou CPF. */
export function resolveRhPersonEquipeUrl(
  companyId: string,
  person: { id: string; nome?: string },
  tab?: string,
): string {
  const profile =
    findColaboradorRhProfileByRouteId(companyId, person.id) ??
    (person.nome
      ? listColaboradorProfilesForCompany(companyId).find((p) =>
          namesLooselyMatch(p.fullName, person.nome!),
        ) ?? null
      : null);

  if (profile) {
    const base = equipeProfileUrl(buildEquipeRouteId(profile));
    return tab ? `${base}/${tab}` : base;
  }

  return tab ? `/rh/equipe/${encodeURIComponent(person.id)}/${tab}` : `/rh/equipe/${encodeURIComponent(person.id)}`;
}
