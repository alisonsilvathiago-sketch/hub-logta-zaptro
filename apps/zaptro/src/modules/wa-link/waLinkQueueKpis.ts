import type { WaLinkConversation } from './waLinkInboxDb';

export type WaLinkQueueKpis = {
  awaiting: number;
  inService: number;
  mine: number;
  aiEscalated: number;
  avgWaitMinutes: number | null;
};

function isAwaiting(conv: WaLinkConversation): boolean {
  const status = conv.attendance_status;
  if (status === 'in_service' || status === 'finished') return false;
  return !conv.assigned_to?.trim() || status === 'awaiting' || status == null;
}

function escalationFlag(conv: WaLinkConversation): boolean {
  const meta = conv.metadata;
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return false;
  return Boolean((meta as Record<string, unknown>).ai_escalated_at);
}

export function computeWaLinkQueueKpis(
  conversations: WaLinkConversation[],
  currentUserId: string | null,
): WaLinkQueueKpis {
  let awaiting = 0;
  let inService = 0;
  let mine = 0;
  let aiEscalated = 0;
  const waitSamples: number[] = [];

  const now = Date.now();

  for (const c of conversations) {
    if (escalationFlag(c)) aiEscalated += 1;
    if (c.attendance_status === 'in_service' && c.assigned_to?.trim()) {
      inService += 1;
      if (currentUserId && c.assigned_to === currentUserId) mine += 1;
    } else if (isAwaiting(c)) {
      awaiting += 1;
      const anchor = c.updated_at;
      if (anchor) {
        const ms = now - new Date(anchor).getTime();
        if (Number.isFinite(ms) && ms >= 0) waitSamples.push(ms);
      }
    }
  }

  const avgWaitMinutes =
    waitSamples.length > 0
      ? Math.round(waitSamples.reduce((a, b) => a + b, 0) / waitSamples.length / 60_000)
      : null;

  return { awaiting, inService, mine, aiEscalated, avgWaitMinutes };
}
