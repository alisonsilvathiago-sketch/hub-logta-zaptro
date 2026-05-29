import { normalizeWaPhoneDigits } from './waLinkRegisterClient';
import type { WaLinkConversation } from './waLinkInboxDb';
import { zaptroCollaboratorColor } from '../../lib/zaptroAgendaCollaborators';
import { ZAPTRO_APP_ROUTES } from '../../app/zaptroAppRoutes';

export type WaLinkContactRole =
  | 'group'
  | 'driver'
  | 'helper'
  | 'collaborator'
  | 'client'
  | 'lead'
  | 'contact';

export type WaLinkStaffKind = 'driver' | 'helper' | 'collaborator';

export type WaLinkRoleIndexEntry = {
  role: WaLinkStaffKind | 'client' | 'lead';
  entityId: string;
  name: string;
  phone: string;
  subLabel?: string;
  avatarUrl?: string | null;
  profilePath?: string;
};

export type WaLinkContactRoleIndex = {
  byPhone: Map<string, WaLinkRoleIndexEntry>;
};

export type WaLinkContactRoleInfo = {
  role: WaLinkContactRole;
  label: string;
  subLabel?: string;
  entityId?: string;
  profilePath?: string;
  color: string;
  isStaff: boolean;
};

const ROLE_COLORS: Record<WaLinkContactRole, string> = {
  group: '#7986cb',
  driver: '#039be5',
  helper: '#33b679',
  collaborator: '#8e24aa',
  client: '#0b8043',
  lead: '#f6bf26',
  contact: '#616161',
};

const ROLE_LABELS: Record<WaLinkContactRole, string> = {
  group: 'Grupo',
  driver: 'Motorista',
  helper: 'Ajudante',
  collaborator: 'Colaborador',
  client: 'Cliente',
  lead: 'Lead',
  contact: 'Contato',
};

export function isWaGroupConversation(c: Pick<WaLinkConversation, 'sender_number' | 'metadata'>): boolean {
  const num = c.sender_number || '';
  if (num.includes('@g.us')) return true;
  const meta = c.metadata;
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    if ((meta as Record<string, unknown>).is_group === true) return true;
  }
  return false;
}

export function resolveContactRole(
  conversation: WaLinkConversation,
  index: WaLinkContactRoleIndex,
): WaLinkContactRoleInfo {
  if (isWaGroupConversation(conversation)) {
    return {
      role: 'group',
      label: ROLE_LABELS.group,
      subLabel: conversation.sender_name || 'Grupo WhatsApp',
      color: ROLE_COLORS.group,
      isStaff: false,
    };
  }

  const phone = normalizePhoneKey(conversation.sender_number);
  const indexed = phone ? index.byPhone.get(phone) : undefined;

  if (indexed) {
    const role = indexed.role as WaLinkContactRole;
    return {
      role,
      label: ROLE_LABELS[role] || ROLE_LABELS.contact,
      subLabel: indexed.subLabel || indexed.name,
      entityId: indexed.entityId,
      profilePath: indexed.profilePath,
      color: ROLE_COLORS[role] || ROLE_COLORS.contact,
      isStaff: role === 'driver' || role === 'helper' || role === 'collaborator',
    };
  }

  const crm = (conversation.crm_type || '').toLowerCase();
  if (crm === 'client') {
    return {
      role: 'client',
      label: ROLE_LABELS.client,
      color: ROLE_COLORS.client,
      isStaff: false,
    };
  }
  if (crm === 'lead') {
    return {
      role: 'lead',
      label: ROLE_LABELS.lead,
      color: ROLE_COLORS.lead,
      isStaff: false,
    };
  }

  return {
    role: 'contact',
    label: ROLE_LABELS.contact,
    color: ROLE_COLORS.contact,
    isStaff: false,
  };
}

export function normalizePhoneKey(phone: string): string {
  return normalizeWaPhoneDigits(phone);
}

export function emptyRoleIndex(): WaLinkContactRoleIndex {
  return { byPhone: new Map() };
}

export function buildRoleIndexEntry(
  role: WaLinkRoleIndexEntry['role'],
  entityId: string,
  name: string,
  phone: string,
  opts?: { subLabel?: string; avatarUrl?: string | null; profilePath?: string },
): [string, WaLinkRoleIndexEntry] | null {
  const key = normalizePhoneKey(phone);
  if (!key) return null;
  return [
    key,
    {
      role,
      entityId,
      name: name.trim() || phone,
      phone,
      subLabel: opts?.subLabel,
      avatarUrl: opts?.avatarUrl,
      profilePath: opts?.profilePath,
    },
  ];
}

export function mergeRoleIndex(...maps: WaLinkContactRoleIndex[]): WaLinkContactRoleIndex {
  const byPhone = new Map<string, WaLinkRoleIndexEntry>();
  for (const m of maps) {
    for (const [k, v] of m.byPhone) {
      if (!byPhone.has(k)) byPhone.set(k, v);
    }
  }
  return { byPhone };
}

export function staffProfilePath(role: WaLinkStaffKind, entityId: string): string {
  if (role === 'driver') return `/app/motoristas/perfil/${encodeURIComponent(entityId)}`;
  if (role === 'helper') return `/app/motoristas/ajudantes/perfil/${encodeURIComponent(entityId)}`;
  return ZAPTRO_APP_ROUTES.TEAM;
}

export function roleFilterMatches(
  filter: string,
  conversation: WaLinkConversation,
  roleInfo: WaLinkContactRoleInfo,
): boolean {
  switch (filter) {
    case 'Clientes':
      return roleInfo.role === 'client';
    case 'Leads':
      return roleInfo.role === 'lead';
    case 'Equipe':
      return roleInfo.isStaff;
    case 'Contatos':
      return roleInfo.role === 'contact';
    case 'Grupos':
      return roleInfo.role === 'group';
    default:
      return true;
  }
}

export function collaboratorColorForUserId(userId: string): string {
  return zaptroCollaboratorColor(userId);
}
