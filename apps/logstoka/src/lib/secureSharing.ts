import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { buildPublicShareSnapshot, type PublicShareSnapshot } from '@/lib/security/shareSnapshot';
import { generateSecureShareToken } from '@/lib/security/shareToken';
import type { ShareLinkPermission } from '@/lib/security/shareSnapshot';

export type { ShareLinkPermission };

export interface LsShareLink {
  token: string;
  companyId: string;
  creatorName: string;
  createdAt: string;
  resourceType: 'product' | 'inventory' | 'movements' | 'general_table';
  resourceId: string;
  name: string;
  note?: string;
  expiresAt: string;
  revoked: boolean;
  /** Snapshot sanitizado — única fonte exibida em /shared/:token */
  snapshotData?: PublicShareSnapshot | null;
  permissions: ShareLinkPermission;
  visits: number;
  maxVisits: number;
  lastAccessedAt?: string;
  comments: Array<{ id: string; author: string; text: string; createdAt: string }>;
  approvalStatus?: 'approved' | 'rejected' | 'pending';
}

const STORAGE_KEY = 'logstoka_secure_sharing';
const MAX_VISITS_DEFAULT = 200;
const MAX_DURATION_HOURS = 168;

function getStorageShares(): LsShareLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LsShareLink[];
  } catch {
    return [];
  }
}

function saveStorageShares(shares: LsShareLink[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shares));
}

/** Demo: links de exemplo só no tenant demo — tokens não óbvios. */
export function ensureDemoShareLinks(companyId: string): void {
  if (!isLogstokaDemoCompany(companyId)) return;
  const existing = getStorageShares().filter((s) => s.companyId === companyId);
  if (existing.length > 0) return;

  const now = Date.now();
  const seeds: LsShareLink[] = [
    {
      token: generateSecureShareToken(),
      companyId,
      creatorName: 'Supervisor WMS (demo)',
      createdAt: new Date(now - 3600000).toISOString(),
      resourceType: 'product',
      resourceId: 'prod-1',
      name: 'Fralda Pluma P — amostra segura',
      note: 'Link demo com snapshot congelado. Não use em produção.',
      expiresAt: new Date(now + 6 * 3600000).toISOString(),
      revoked: false,
      permissions: 'view_comment',
      visits: 0,
      maxVisits: MAX_VISITS_DEFAULT,
      comments: [],
      approvalStatus: 'pending',
      snapshotData: buildPublicShareSnapshot(
        {
          name: 'Fralda Pluma Premium P 60un',
          sku: 'PLM-FRD-P',
          unit: 'UN',
          stockTotal: 840,
          stockAvailable: 800,
          stockReserved: 40,
        },
        'view_comment',
        'Fralda Pluma P',
      ),
    },
  ];
  saveStorageShares([...seeds, ...getStorageShares()]);
}

export const secureSharing = {
  createShareLink: (params: {
    companyId: string;
    creatorName: string;
    resourceType: LsShareLink['resourceType'];
    resourceId: string;
    name: string;
    note?: string;
    durationHours: number | 'custom';
    customExpiryDate?: Date;
    permissions: ShareLinkPermission;
    snapshotData?: unknown;
  }): LsShareLink => {
    if (!params.snapshotData) {
      throw new Error('Compartilhamento exige snapshot congelado — nada ao vivo na internet.');
    }

    const sanitized = buildPublicShareSnapshot(
      params.snapshotData,
      params.permissions,
      params.name,
    );
    if (!sanitized) {
      throw new Error('Não foi possível gerar snapshot seguro para este recurso.');
    }

    const shares = getStorageShares();
    const token = generateSecureShareToken();

    let expiresAt: Date;
    if (params.durationHours === 'custom' && params.customExpiryDate) {
      expiresAt = params.customExpiryDate;
    } else {
      const hours = Math.min(
        typeof params.durationHours === 'number' ? params.durationHours : 24,
        MAX_DURATION_HOURS,
      );
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hours);
    }

    if (expiresAt.getTime() <= Date.now()) {
      throw new Error('A expiração deve ser no futuro.');
    }

    const newShare: LsShareLink = {
      token,
      companyId: params.companyId,
      creatorName: params.creatorName,
      createdAt: new Date().toISOString(),
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      name: params.name,
      note: params.note,
      expiresAt: expiresAt.toISOString(),
      revoked: false,
      snapshotData: sanitized,
      permissions: params.permissions,
      visits: 0,
      maxVisits: MAX_VISITS_DEFAULT,
      comments: [],
      approvalStatus: 'pending',
    };

    shares.unshift(newShare);
    saveStorageShares(shares);
    return newShare;
  },

  getShareLinkByToken: (
    token: string,
  ): { share: LsShareLink | null; error: 'expired' | 'revoked' | 'not_found' | 'no_snapshot' | 'max_visits' | null } => {
    const shares = getStorageShares();
    const hit = shares.find((s) => s.token === token);

    if (!hit) {
      return { share: null, error: 'not_found' };
    }

    if (hit.revoked) {
      return { share: hit, error: 'revoked' };
    }

    if (!hit.snapshotData) {
      return { share: hit, error: 'no_snapshot' };
    }

    if (hit.visits >= hit.maxVisits) {
      return { share: hit, error: 'max_visits' };
    }

    if (new Date(hit.expiresAt).getTime() < Date.now()) {
      return { share: hit, error: 'expired' };
    }

    return { share: hit, error: null };
  },

  incrementVisits: (token: string) => {
    const shares = getStorageShares();
    const idx = shares.findIndex((s) => s.token === token);
    if (idx !== -1) {
      shares[idx].visits += 1;
      shares[idx].lastAccessedAt = new Date().toISOString();
      saveStorageShares(shares);
    }
  },

  revokeShareLink: (token: string, companyId: string): boolean => {
    const shares = getStorageShares();
    const idx = shares.findIndex((s) => s.token === token && s.companyId === companyId);
    if (idx !== -1) {
      shares[idx].revoked = true;
      saveStorageShares(shares);
      return true;
    }
    return false;
  },

  addCommentToShare: (token: string, author: string, text: string): LsShareLink | null => {
    const { error } = secureSharing.getShareLinkByToken(token);
    if (error) return null;

    const shares = getStorageShares();
    const idx = shares.findIndex((s) => s.token === token);
    if (idx === -1) return null;

    const comment = {
      id: `comment-${crypto.randomUUID?.() ?? Date.now()}`,
      author: author.slice(0, 80) || 'Visitante',
      text: text.slice(0, 2000),
      createdAt: new Date().toISOString(),
    };
    shares[idx].comments.push(comment);
    saveStorageShares(shares);
    return shares[idx];
  },

  updateShareApproval: (token: string, status: 'approved' | 'rejected'): LsShareLink | null => {
    const { share, error } = secureSharing.getShareLinkByToken(token);
    if (error || !share) return null;
    if (share.permissions !== 'view_approve' && share.permissions !== 'view_reprove') {
      return null;
    }

    const shares = getStorageShares();
    const idx = shares.findIndex((s) => s.token === token);
    if (idx === -1) return null;
    shares[idx].approvalStatus = status;
    saveStorageShares(shares);
    return shares[idx];
  },

  listSharesForResource: (
    companyId: string,
    resourceType: LsShareLink['resourceType'],
    resourceId: string,
  ): LsShareLink[] => {
    return getStorageShares().filter(
      (s) => s.companyId === companyId && s.resourceType === resourceType && s.resourceId === resourceId,
    );
  },
};
