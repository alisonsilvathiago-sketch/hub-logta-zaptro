import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Bell,
  Building2,
  CreditCard,
  LifeBuoy,
  LogIn,
  MessageSquare,
  Package,
  ShieldAlert,
  Truck,
  Wrench,
} from 'lucide-react';

export type HubNotificationCategory =
  | 'support'
  | 'billing'
  | 'security'
  | 'maintenance'
  | 'login'
  | 'purchase'
  | 'alert'
  | 'message'
  | 'system';

export type HubNotificationSource = 'hub' | 'logta' | 'zaptro' | 'logdock' | 'whatsapp';

export type HubMasterNotification = {
  id: string;
  title: string;
  message: string;
  category: HubNotificationCategory;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: HubNotificationSource;
  createdAt: string;
  path: string;
  read: boolean;
};

export const HUB_NOTIFICATIONS_READ_KEY = 'hub_master_notifications_read_v1';

export const HUB_NOTIFICATION_CATEGORY_LABELS: Record<HubNotificationCategory, string> = {
  support: 'Suporte',
  billing: 'Faturamento',
  security: 'Segurança',
  maintenance: 'Manutenção',
  login: 'Acesso',
  purchase: 'Compras',
  alert: 'Alerta',
  message: 'Mensagem',
  system: 'Sistema',
};

export const HUB_NOTIFICATION_SOURCE_LABELS: Record<HubNotificationSource, string> = {
  hub: 'Hub Master',
  logta: 'Logta',
  zaptro: 'Zaptro',
  logdock: 'LogDock',
  whatsapp: 'WhatsApp',
};

const SOURCE_COLORS: Record<HubNotificationSource, string> = {
  hub: '#0061FF',
  logta: '#10B981',
  zaptro: '#7C3AED',
  logdock: '#0EA5E9',
  whatsapp: '#22C55E',
};

export function hubNotificationSourceColor(source: HubNotificationSource): string {
  return SOURCE_COLORS[source] ?? '#64748B';
}

export function loadReadNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(HUB_NOTIFICATIONS_READ_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function persistReadNotificationIds(ids: Set<string>): void {
  try {
    localStorage.setItem(HUB_NOTIFICATIONS_READ_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function resolveNotificationPath(
  rawPath: string | undefined,
  category: HubNotificationCategory,
  source: HubNotificationSource,
): string {
  const p = (rawPath || '').trim();
  if (p.startsWith('/master')) return p;
  if (p.startsWith('/')) return `/master${p}`;
  if (p) return p;

  switch (category) {
    case 'billing':
    case 'purchase':
      return '/master/billing';
    case 'support':
      return '/master/hubchat';
    case 'security':
    case 'login':
      return '/master/settings?tab=seguranca';
    case 'maintenance':
      return '/master/settings?tab=notificacoes';
    default:
      break;
  }

  switch (source) {
    case 'logta':
      return '/master/logta';
    case 'zaptro':
      return '/master/zaptro';
    case 'logdock':
      return '/master/logdock';
    case 'whatsapp':
      return '/master/whatsapp';
    default:
      return '/master/settings?tab=notificacoes';
  }
}

export function categoryIcon(category: HubNotificationCategory): LucideIcon {
  const map: Record<HubNotificationCategory, LucideIcon> = {
    support: LifeBuoy,
    billing: CreditCard,
    security: ShieldAlert,
    maintenance: Wrench,
    login: LogIn,
    purchase: Package,
    alert: AlertTriangle,
    message: MessageSquare,
    system: Bell,
  };
  return map[category] ?? Bell;
}

function inferCategoryFromTipo(tipo: string, sistema: string): HubNotificationCategory {
  const t = `${tipo} ${sistema}`.toLowerCase();
  if (t.includes('suport') || t.includes('ticket')) return 'support';
  if (t.includes('fatur') || t.includes('pag') || t.includes('billing')) return 'billing';
  if (t.includes('compra') || t.includes('checkout') || t.includes('assin')) return 'purchase';
  if (t.includes('login') || t.includes('acesso') || t.includes('auth')) return 'login';
  if (t.includes('segur') || t.includes('2fa')) return 'security';
  if (t.includes('manut')) return 'maintenance';
  if (t.includes('alert') || t.includes('crit')) return 'alert';
  if (t.includes('msg') || t.includes('whats')) return 'message';
  return 'system';
}

function inferSourceFromSistema(sistema: string): HubNotificationSource {
  const s = sistema.toLowerCase();
  if (s.includes('logta')) return 'logta';
  if (s.includes('zaptro') || s.includes('zap')) return 'zaptro';
  if (s.includes('logdock') || s.includes('dock')) return 'logdock';
  if (s.includes('whats')) return 'whatsapp';
  return 'hub';
}

function inferPriority(tipo: string): HubMasterNotification['priority'] {
  const t = tipo.toLowerCase();
  if (t.includes('crit') || t.includes('error') || t.includes('falha')) return 'CRITICAL';
  if (t.includes('warn') || t.includes('alta')) return 'HIGH';
  if (t.includes('med')) return 'MEDIUM';
  return 'LOW';
}

export function mapHubNotificacaoRow(
  row: { id: string; mensagem: string; sistema?: string | null; tipo?: string | null; created_at: string; lida?: boolean | null },
  readIds: Set<string>,
): HubMasterNotification {
  const sistema = row.sistema || 'HUB';
  const tipo = row.tipo || 'info';
  const category = inferCategoryFromTipo(tipo, sistema);
  const source = inferSourceFromSistema(sistema);
  const title = row.mensagem.split(/[.:]/)[0]?.slice(0, 72) || 'Notificação do sistema';
  return {
    id: `hub_notif_${row.id}`,
    title,
    message: row.mensagem,
    category,
    priority: inferPriority(tipo),
    source,
    createdAt: row.created_at,
    path: resolveNotificationPath(undefined, category, source),
    read: Boolean(row.lida) || readIds.has(`hub_notif_${row.id}`),
  };
}

export function mapNotificationsTableRow(
  row: {
    id: string;
    title?: string | null;
    message?: string | null;
    priority?: string | null;
    type?: string | null;
    created_at: string;
    metadata?: { path?: string } | null;
  },
  readIds: Set<string>,
): HubMasterNotification {
  const category = inferCategoryFromTipo(row.type || '', row.type || '');
  const source: HubNotificationSource = 'hub';
  return {
    id: `notif_${row.id}`,
    title: row.title || 'Comunicado Master',
    message: row.message || '',
    category,
    priority: (row.priority as HubMasterNotification['priority']) || 'MEDIUM',
    source,
    createdAt: row.created_at,
    path: resolveNotificationPath(row.metadata?.path, category, source),
    read: readIds.has(`notif_${row.id}`),
  };
}

export function mapAuditLogRow(
  row: { id: string; action?: string | null; details?: string | null; created_at: string; target_type?: string | null },
  readIds: Set<string>,
): HubMasterNotification {
  const action = row.action || 'EVENT';
  const details = row.details || 'Evento registrado no ecossistema';
  const isLogin = /login|sign_in|session|access/i.test(action);
  return {
    id: `audit_${row.id}`,
    title: isLogin ? 'Novo acesso detectado' : `Auditoria: ${action}`,
    message: details,
    category: isLogin ? 'login' : 'system',
    priority: isLogin ? 'MEDIUM' : 'LOW',
    source: 'hub',
    createdAt: row.created_at,
    path: isLogin ? '/master/settings?tab=seguranca' : '/master/settings?tab=notificacoes',
    read: readIds.has(`audit_${row.id}`),
  };
}

/** Feed inicial rico quando o banco ainda não tem histórico suficiente. */
export function buildSeedMasterNotifications(readIds: Set<string>): HubMasterNotification[] {
  const now = Date.now();
  const mins = (m: number) => new Date(now - m * 60_000).toISOString();

  const seeds: Omit<HubMasterNotification, 'read'>[] = [
    {
      id: 'seed_zaptro_whatsapp',
      title: 'Zaptro — instância WhatsApp desconectada',
      message: 'Transportadora Falcão perdeu conexão com o gateway. Reconectar em Motores WhatsApp.',
      category: 'alert',
      priority: 'HIGH',
      source: 'zaptro',
      createdAt: mins(3),
      path: '/master/settings/evolution',
    },
    {
      id: 'seed_logta_route',
      title: 'Logta — rota com atraso crítico',
      message: 'CT-e #8842 (São Paulo → Curitiba) ultrapassou SLA em 47 minutos.',
      category: 'alert',
      priority: 'CRITICAL',
      source: 'logta',
      createdAt: mins(8),
      path: '/master/logta',
    },
    {
      id: 'seed_billing',
      title: 'Faturamento — pagamento confirmado',
      message: 'Assinatura Pro renovada: Expresso Federal · R$ 2.400,00',
      category: 'purchase',
      priority: 'MEDIUM',
      source: 'hub',
      createdAt: mins(15),
      path: '/master/billing?tab=financeiro',
    },
    {
      id: 'seed_support',
      title: 'Suporte — ticket prioritário aberto',
      message: 'Cliente relatou dificuldade no login do portal Logta (empresa Alfa Transportes).',
      category: 'support',
      priority: 'HIGH',
      source: 'logta',
      createdAt: mins(22),
      path: '/master/hubchat',
    },
    {
      id: 'seed_logdock',
      title: 'LogDock — POD pendente de validação',
      message: '12 comprovantes aguardando conferência na pasta TransNorte Cargo.',
      category: 'message',
      priority: 'MEDIUM',
      source: 'logdock',
      createdAt: mins(35),
      path: '/master/logdock',
    },
    {
      id: 'seed_login',
      title: 'Acesso — novo login master',
      message: 'Sessão iniciada no Hub Master a partir de São Paulo, BR.',
      category: 'login',
      priority: 'LOW',
      source: 'hub',
      createdAt: mins(48),
      path: '/master/settings?tab=seguranca',
    },
    {
      id: 'seed_whatsapp',
      title: 'WhatsApp — pico de mensagens',
      message: 'Gateway registrou +18% de volume na última hora (campanha comercial Zaptro).',
      category: 'message',
      priority: 'MEDIUM',
      source: 'whatsapp',
      createdAt: mins(62),
      path: '/master/whatsapp',
    },
    {
      id: 'seed_company',
      title: 'Empresas — novo tenant em onboarding',
      message: 'Rápido Trans concluiu cadastro e aguarda ativação de módulos.',
      category: 'system',
      priority: 'LOW',
      source: 'hub',
      createdAt: mins(90),
      path: '/master/companies',
    },
    {
      id: 'seed_maintenance',
      title: 'Manutenção programada',
      message: 'Janela de atualização do cluster prevista para domingo, 03h–04h (BRT).',
      category: 'maintenance',
      priority: 'MEDIUM',
      source: 'hub',
      createdAt: mins(120),
      path: '/master/settings?tab=notificacoes',
    },
    {
      id: 'seed_zaptro_driver',
      title: 'Zaptro — motorista com dificuldade no app',
      message: 'João Silva (MAP-1004) reportou erro ao finalizar entrega no app motorista.',
      category: 'support',
      priority: 'HIGH',
      source: 'zaptro',
      createdAt: mins(140),
      path: '/master/zaptro',
    },
  ];

  return seeds.map((n) => ({
    ...n,
    read: readIds.has(n.id),
  }));
}

export function mergeAndSortNotifications(lists: HubMasterNotification[][]): HubMasterNotification[] {
  const byId = new Map<string, HubMasterNotification>();
  for (const list of lists) {
    for (const n of list) {
      if (!byId.has(n.id)) byId.set(n.id, n);
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function formatNotificationTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'agora';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function priorityColor(priority: HubMasterNotification['priority']): string {
  if (priority === 'CRITICAL') return '#EF4444';
  if (priority === 'HIGH') return '#F59E0B';
  if (priority === 'MEDIUM') return '#0061FF';
  return '#94A3B8';
}

/** Ícone contextual extra por fonte (badge no card). */
export function sourceBadgeIcon(source: HubNotificationSource): LucideIcon {
  if (source === 'logta') return Truck;
  if (source === 'zaptro') return MessageSquare;
  if (source === 'logdock') return Package;
  if (source === 'whatsapp') return MessageSquare;
  return Building2;
}
