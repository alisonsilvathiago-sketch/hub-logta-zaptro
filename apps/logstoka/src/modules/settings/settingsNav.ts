import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Building2,
  Palette,
  ScrollText,
  Shield,
  User,
  Users,
  Webhook,
  Zap,
} from 'lucide-react';

export type SettingsNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

export const SETTINGS_BASE = '/app/configuracoes';

export const SETTINGS_NAV: SettingsNavItem[] = [
  { to: `${SETTINGS_BASE}/meu-perfil`, label: 'Meu Perfil', icon: User, end: true },
  { to: `${SETTINGS_BASE}/empresa`, label: 'Perfil da Empresa', icon: Building2 },
  { to: `${SETTINGS_BASE}/equipe`, label: 'Equipe e Permissões', icon: Users },
  { to: `${SETTINGS_BASE}/api-webhooks`, label: 'API e Webhooks', icon: Webhook },
  { to: '/app/integrations', label: 'Integrações', icon: Zap },
  { to: `${SETTINGS_BASE}/notificacoes`, label: 'Notificações', icon: Bell },
  { to: `${SETTINGS_BASE}/auditoria`, label: 'Auditoria e Logs', icon: ScrollText },
  { to: `${SETTINGS_BASE}/seguranca`, label: 'Segurança', icon: Shield },
  { to: `${SETTINGS_BASE}/white-label`, label: 'White Label', icon: Palette },
];

export function settingsSectionLabel(pathname: string): string {
  if (pathname.includes('/notificacoes/')) return 'Notificações · Alerta';
  if (pathname.includes('/notificacoes')) return 'Notificações';
  if (pathname.includes('/equipe/ranking')) return 'Equipe · Ranking';
  if (pathname.includes('/equipe/')) return 'Equipe · Detalhe';
  if (pathname.includes('/integracoes/') && !pathname.includes('/integracoes/marketplaces')) {
    if (pathname.split('/').length > 5) return 'Integrações · Loja';
    return 'Integrações · Marketplace';
  }
  if (pathname.includes('/integracoes/marketplaces')) return 'Integrações · Marketplaces';
  if (pathname.includes('/api-webhooks/logs/')) return 'API · Log de integração';
  const item = SETTINGS_NAV.find((n) => pathname === n.to || pathname.startsWith(`${n.to}/`));
  return item?.label ?? 'Configurações';
}
