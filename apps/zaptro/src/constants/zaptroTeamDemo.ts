import { isZaptroPreviewDataEnabled } from '../lib/zaptroPreviewMode';
import { ZAPTRO_PAGE_PERMISSION_DEFS } from '../utils/zaptroPagePermissionMap';

export type ZaptroDemoTeamMember = {
  id: string;
  full_name: string;
  role: string;
  email: string;
  avatar_url?: string | null;
  metadata?: { email?: string } | null;
  permissions?: string[] | null;
};

const ALL_PAGE_IDS = ZAPTRO_PAGE_PERMISSION_DEFS.map((d) => d.id);

export function isZaptroTeamDemoEnabled(): boolean {
  return isZaptroPreviewDataEnabled();
}

export function buildZaptroDemoTeamMembers(_companyId?: string): ZaptroDemoTeamMember[] {
  return [
    {
      id: 'demo-team-1',
      full_name: 'Ana Ribeiro',
      role: 'comercial',
      email: 'ana.ribeiro@zaptro.demo',
      permissions: ['whatsapp', 'clientes', 'crm', 'orcamentos', 'inicio'],
    },
    {
      id: 'demo-team-2',
      full_name: 'Carlos Mendes',
      role: 'agent',
      email: 'carlos.mendes@zaptro.demo',
      permissions: ['whatsapp', 'clientes', 'historico'],
    },
    {
      id: 'demo-team-3',
      full_name: 'Fernanda Lima',
      role: 'financeiro',
      email: 'fernanda.lima@zaptro.demo',
      permissions: ['clientes', 'crm', 'orcamentos', 'faturamento'],
    },
    {
      id: 'demo-team-4',
      full_name: 'Ricardo Souza',
      role: 'gerente',
      email: 'ricardo.souza@zaptro.demo',
      permissions: ALL_PAGE_IDS,
    },
    {
      id: 'demo-team-5',
      full_name: 'Juliana Costa',
      role: 'atendimento',
      email: 'juliana.costa@zaptro.demo',
      permissions: ['whatsapp', 'clientes', 'inicio', 'historico'],
    },
    {
      id: 'demo-team-6',
      full_name: 'Marcos Oliveira',
      role: 'suporte',
      email: 'marcos.oliveira@zaptro.demo',
      permissions: ['whatsapp', 'cfg', 'rotas', 'motoristas'],
    },
  ];
}

export function isZaptroDemoTeamMemberId(id: string): boolean {
  return id.startsWith('demo-team-');
}
