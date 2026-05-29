/**
 * Cores estáveis por colaborador + filtro calendário global vs individual.
 */

export type AgendaTeamMember = {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  color: string;
};

/** Paleta estilo Google Calendar */
export const ZAPTRO_AGENDA_COLLABORATOR_COLORS = [
  '#039be5',
  '#0b8043',
  '#7986cb',
  '#e67c73',
  '#f4511e',
  '#8e24aa',
  '#33b679',
  '#d50000',
  '#f6bf26',
  '#616161',
] as const;

export function zaptroCollaboratorColor(userId: string): string {
  const id = userId.trim() || 'anon';
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % ZAPTRO_AGENDA_COLLABORATOR_COLORS.length;
  return ZAPTRO_AGENDA_COLLABORATOR_COLORS[idx];
}

export function isZaptroAgendaGlobalView(role: string | null | undefined, isMaster?: boolean): boolean {
  if (isMaster) return true;
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'ADMIN' || r === 'MASTER' || r.startsWith('MASTER_') || r === 'HUB';
}

export function canUserSeeAgendaEntry(
  entry: { actorUserId?: string; mentionedUserIds?: string[] },
  userId: string | null | undefined,
  globalView: boolean,
): boolean {
  if (globalView) return true;
  if (!userId) return true;
  if (entry.actorUserId === userId) return true;
  if (entry.mentionedUserIds?.includes(userId)) return true;
  return false;
}

export function agendaEventDisplayColor(entry: {
  actorColor?: string;
  actorUserId?: string;
  type?: string;
}): string {
  if (entry.actorColor) return entry.actorColor;
  if (entry.actorUserId) return zaptroCollaboratorColor(entry.actorUserId);
  if (entry.type === 'rota') return '#7986cb';
  if (entry.type === 'atendimento') return '#039be5';
  return '#0b8043';
}

export function formatMentionsForDetails(names: string[]): string {
  if (!names.length) return '';
  return `Menções: ${names.map((n) => `@${n.replace(/^@/, '')}`).join(', ')}`;
}

export function parseMentionsFromDetails(details?: string): string[] {
  if (!details) return [];
  const m = details.match(/Menções:\s*([^·]+)/i);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => s.trim().replace(/^@/, ''))
    .filter(Boolean);
}
