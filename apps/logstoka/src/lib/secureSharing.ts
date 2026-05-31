import type { LsProduct } from '@/types';

export interface LsShareLink {
  token: string;
  companyId: string;
  creatorName: string;
  createdAt: string;
  resourceType: 'product' | 'inventory' | 'movements' | 'general_table';
  resourceId: string; // Ex: ID do produto ou SKU
  name: string; // Nome do compartilhamento
  note?: string; // Observação
  expiresAt: string; // ISO String
  revoked: boolean;
  snapshotData?: any; // Cópia JSON congelada dos dados
  permissions: 'view_only' | 'view_comment' | 'view_approve' | 'view_reprove';
  visits: number;
  lastAccessedAt?: string;
  comments: Array<{ id: string; author: string; text: string; createdAt: string }>;
  approvalStatus?: 'approved' | 'rejected' | 'pending';
}

const STORAGE_KEY = 'logstoka_secure_sharing';

function getStorageShares(): LsShareLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return seedDefaultShares();
    }
    return JSON.parse(raw) as LsShareLink[];
  } catch {
    return seedDefaultShares();
  }
}

function saveStorageShares(shares: LsShareLink[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shares));
}

// Inicializa links de exemplo para demonstração interativa imediata
function seedDefaultShares(): LsShareLink[] {
  const now = new Date();
  
  // Link 1: Expirado há 2 horas
  const expiredTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  
  // Link 2: Revogado pelo WMS
  const revokedTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Link 3: Ativo e pronto com comentários
  const activeTime = new Date(now.getTime() + 6 * 60 * 60 * 1000); // Expira em 6 horas

  const seeds: LsShareLink[] = [
    {
      token: 'demo-share-expired',
      companyId: 'company-demo-id',
      creatorName: 'Carlos Silva (Logística)',
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      resourceType: 'product',
      resourceId: 'prod-1',
      name: 'Auditoria de Estoque - Lote Fraldas P',
      note: 'Link de demonstração expirado automaticamente após prazo.',
      expiresAt: expiredTime.toISOString(),
      revoked: false,
      visits: 4,
      permissions: 'view_comment',
      comments: [],
      approvalStatus: 'pending'
    },
    {
      token: 'demo-share-revoked',
      companyId: 'company-demo-id',
      creatorName: 'Mariana Souza (Diretoria)',
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      resourceType: 'inventory',
      resourceId: 'inv-1',
      name: 'Relatório Inventário Geral WMS',
      note: 'Este link foi revogado manualmente para fins de demonstração.',
      expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      revoked: true,
      visits: 12,
      permissions: 'view_approve',
      comments: [],
      approvalStatus: 'pending'
    },
    {
      token: 'demo-share-active',
      companyId: 'company-demo-id',
      creatorName: 'Thiago Mestre (Supervisor WMS)',
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      resourceType: 'product',
      resourceId: 'prod-1',
      name: 'Fralda Pluma P - Sincronização e Ajuste',
      note: 'Favor analisar se a contagem física confere com as lojas vinculadas.',
      expiresAt: activeTime.toISOString(),
      revoked: false,
      permissions: 'view_comment',
      visits: 8,
      lastAccessedAt: new Date().toISOString(),
      snapshotData: {
        id: 'prod-1',
        sku: 'PLM-FRD-P',
        name: 'Fralda Pluma Premium P 60un (Snapshot Inicial)',
        cost: 32.9,
        sale_price: 59.9,
        promo_price: 54.9,
        min_stock: 300,
        unit: 'UN',
        publication_status: 'published',
        main_image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=200&q=80',
        stockTotal: 840,
        stockAvailable: 800,
        stockReserved: 40,
        divergencesFound: true
      },
      comments: [
        {
          id: 'c1',
          author: 'Supervisor ML',
          text: 'Os anúncios da Shopee e ML já estão ativos e puxando as 840 unidades.',
          createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString()
        }
      ],
      approvalStatus: 'pending'
    }
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
  return seeds;
}

export const secureSharing = {
  /**
   * Cria um novo link de compartilhamento seguro
   */
  createShareLink: (params: {
    companyId: string;
    creatorName: string;
    resourceType: LsShareLink['resourceType'];
    resourceId: string;
    name: string;
    note?: string;
    durationHours: number | 'custom';
    customExpiryDate?: Date;
    permissions: LsShareLink['permissions'];
    snapshotData?: any;
  }): LsShareLink => {
    const shares = getStorageShares();
    const token = 'stk-share-' + Math.random().toString(36).substr(2, 9);
    
    let expiresAt: Date;
    if (params.durationHours === 'custom' && params.customExpiryDate) {
      expiresAt = params.customExpiryDate;
    } else {
      const hours = typeof params.durationHours === 'number' ? params.durationHours : 24;
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hours);
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
      snapshotData: params.snapshotData,
      permissions: params.permissions,
      visits: 0,
      comments: [],
      approvalStatus: 'pending'
    };

    shares.unshift(newShare);
    saveStorageShares(shares);
    return newShare;
  },

  /**
   * Recupera um compartilhamento pelo token público, validando expiração e revogação
   */
  getShareLinkByToken: (token: string): { share: LsShareLink | null; error: 'expired' | 'revoked' | 'not_found' | null } => {
    const shares = getStorageShares();
    const hit = shares.find((s) => s.token === token);
    
    if (!hit) {
      return { share: null, error: 'not_found' };
    }

    if (hit.revoked) {
      return { share: hit, error: 'revoked' };
    }

    const expiry = new Date(hit.expiresAt);
    if (expiry.getTime() < Date.now()) {
      return { share: hit, error: 'expired' };
    }

    return { share: hit, error: null };
  },

  /**
   * Incrementa contagem de visitas e atualiza último acesso
   */
  incrementVisits: (token: string) => {
    const shares = getStorageShares();
    const idx = shares.findIndex((s) => s.token === token);
    if (idx !== -1) {
      shares[idx].visits += 1;
      shares[idx].lastAccessedAt = new Date().toISOString();
      saveStorageShares(shares);
    }
  },

  /**
   * Revoga manualmente um compartilhamento ativo
   */
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

  /**
   * Adiciona um comentário a um link de compartilhamento
   */
  addCommentToShare: (token: string, author: string, text: string): LsShareLink | null => {
    const shares = getStorageShares();
    const idx = shares.findIndex((s) => s.token === token);
    if (idx !== -1) {
      const comment = {
        id: 'comment-' + Math.random().toString(36).substr(2, 5),
        author: author || 'Visitante Anônimo',
        text,
        createdAt: new Date().toISOString()
      };
      shares[idx].comments.push(comment);
      saveStorageShares(shares);
      return shares[idx];
    }
    return null;
  },

  /**
   * Registra uma aprovação ou reprovação no link
   */
  updateShareApproval: (token: string, status: 'approved' | 'rejected'): LsShareLink | null => {
    const shares = getStorageShares();
    const idx = shares.findIndex((s) => s.token === token);
    if (idx !== -1) {
      shares[idx].approvalStatus = status;
      saveStorageShares(shares);
      return shares[idx];
    }
    return null;
  },

  /**
   * Lista todos os compartilhamentos associados a um recurso específico de uma empresa
   */
  listSharesForResource: (companyId: string, resourceType: LsShareLink['resourceType'], resourceId: string): LsShareLink[] => {
    const shares = getStorageShares();
    return shares.filter((s) => s.companyId === companyId && s.resourceType === resourceType && s.resourceId === resourceId);
  }
};
