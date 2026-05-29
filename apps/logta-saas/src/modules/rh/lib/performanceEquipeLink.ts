import { buildEquipeRouteId, equipeProfileUrl } from './equipeRouteId';
import { findColaboradorRhProfileByRouteId, listColaboradorProfilesForCompany } from '../ponto/colaboradorRhStorage';

function namesMatch(profileName: string, avalNome: string): boolean {
  const a = profileName.trim().toLowerCase();
  const b = avalNome.trim().toLowerCase();
  if (a === b) return true;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  const aFirst = a.split(/\s+/)[0];
  const bFirst = b.split(/\s+/)[0];
  return aFirst.length > 2 && aFirst === bFirst && a.includes(b.split(/\s+/).pop() ?? '');
}

/** URL do perfil 360° a partir de uma avaliação de performance. */
export function resolvePerformanceColaboradorEquipeUrl(
  companyId: string,
  aval: { colaboradorId: string; colaboradorNome: string },
): string {
  const byRoute = findColaboradorRhProfileByRouteId(companyId, aval.colaboradorId);
  if (byRoute) {
    return equipeProfileUrl(buildEquipeRouteId(byRoute));
  }

  const profiles = listColaboradorProfilesForCompany(companyId);
  const byName = profiles.find((p) => namesMatch(p.fullName, aval.colaboradorNome));
  if (byName) {
    return equipeProfileUrl(buildEquipeRouteId(byName));
  }

  return '/rh/equipe';
}
