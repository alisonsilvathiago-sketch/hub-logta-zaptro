import {
  getSandboxOperationalBundle,
  resolveDemoCompanyId,
  shouldUseLogtaSandbox,
} from '../../../lib/seed';
import {
  listColaboradorProfilesForCompany,
  type ColaboradorRhProfile,
} from '../ponto/colaboradorRhStorage';
import { buildEquipeRouteId, resolveEquipeListRouteId } from './equipeRouteId';

type MotoristaLike = { id: string; nome?: string; status?: string };

export type RhColaboradorListItem = {
  id: string;
  /** ID numérico na URL — CPF ou matrícula (evita confusão entre homônimos). */
  equipeRouteId: string;
  full_name: string;
  email?: string;
  role?: string;
  department?: string;
  created_at: string;
  avatar_url?: string;
  rhProfileId?: string;
};

function profileToListItem(p: {
  id: string;
  full_name?: string;
  fullName?: string;
  email?: string;
  role?: string;
  department?: string;
  sector?: string;
  cargo?: string;
  created_at?: string;
  avatar_url?: string;
}): RhColaboradorListItem {
  const full_name = p.full_name || p.fullName || p.email || 'Colaborador';
  const equipeRouteId = resolveEquipeListRouteId({
    id: p.id,
    full_name,
    email: p.email,
  });
  return {
    id: equipeRouteId,
    equipeRouteId,
    full_name,
    email: p.email,
    role: p.role || p.cargo,
    department: p.department || p.sector,
    created_at: p.created_at || new Date().toISOString(),
    avatar_url: p.avatar_url,
  };
}

function rhProfileToListItem(p: ColaboradorRhProfile): RhColaboradorListItem {
  const equipeRouteId = buildEquipeRouteId(p);
  return {
    id: equipeRouteId,
    equipeRouteId,
    full_name: p.fullName,
    email: p.email,
    role: p.role,
    department: p.sector,
    created_at: p.admissionDate || p.updatedAt,
    rhProfileId: p.id,
  };
}

function finalizeListItem(item: RhColaboradorListItem): RhColaboradorListItem {
  const equipeRouteId = resolveEquipeListRouteId(item);
  return { ...item, id: equipeRouteId, equipeRouteId };
}

/** Une perfis Supabase, sandbox, motoristas, ponto e cadastros RH locais. */
export function mergeRhColaboradores(
  companyId: string | undefined,
  supabaseProfiles: RhColaboradorListItem[] = [],
  operationalProfiles: RhColaboradorListItem[] = [],
  motoristas: MotoristaLike[] = [],
): RhColaboradorListItem[] {
  const cid = resolveDemoCompanyId(companyId);
  const map = new Map<string, RhColaboradorListItem>();

  const add = (item: RhColaboradorListItem) => {
    const next = finalizeListItem(item);
    const key = next.equipeRouteId || next.email?.toLowerCase() || next.full_name;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, next);
      return;
    }
    const merged = finalizeListItem({
      ...existing,
      ...next,
      full_name: next.full_name || existing.full_name,
      rhProfileId: next.rhProfileId || existing.rhProfileId,
    });
    map.set(key, merged);
  };

  for (const p of supabaseProfiles) add(profileToListItem(p));
  for (const p of operationalProfiles) add(profileToListItem(p));

  const sandbox = getSandboxOperationalBundle(cid);
  if (shouldUseLogtaSandbox() || map.size < 3) {
    for (const p of sandbox.profiles) {
      add(
        profileToListItem({
          ...p,
          created_at: new Date().toISOString(),
        }),
      );
    }
    for (const rh of sandbox.colaboradorProfiles) {
      const item = rhProfileToListItem(rh);
      if (rh.linkedProfileId) {
        for (const [k, v] of map) {
          if (v.equipeRouteId === rh.linkedProfileId || v.id === rh.linkedProfileId) {
            map.delete(k);
          }
        }
      }
      add(item);
    }
  }

  for (const rh of listColaboradorProfilesForCompany(cid)) {
    const item = rhProfileToListItem(rh);
    if (rh.linkedProfileId) {
      for (const [k, v] of map) {
        if (v.equipeRouteId === rh.linkedProfileId || v.id === rh.linkedProfileId) {
          map.delete(k);
        }
      }
    }
    add(item);
  }

  for (const mot of motoristas) {
    const nome = mot.nome?.trim();
    if (!nome) continue;
    const motRoute = mot.id.replace(/\D/g, '').length >= 4 ? mot.id.replace(/\D/g, '') : mot.id;
    add({
      id: `mot-${mot.id}`,
      equipeRouteId: motRoute.length >= 6 ? motRoute : `mot-${mot.id}`,
      full_name: nome,
      role: 'Motorista',
      department: 'Frota',
      created_at: new Date().toISOString(),
    });
  }

  return Array.from(map.values()).sort((a, b) =>
    a.full_name.localeCompare(b.full_name, 'pt-BR'),
  );
}
