import type { Profile } from '@/types';

/** Camada 1 — Empresa contratante (sede / razão social). Uma conta LogStoka = uma empresa. */
export const LOGSTOKA_ORG_LAYER_COMPANY = 'company' as const;

/** Camada 2 — Centros de Distribuição (galpões físicos ou Full marketplace). */
export const LOGSTOKA_ORG_LAYER_WAREHOUSE = 'warehouse' as const;

/** Camada 3 — Estoque por CD (produto único no catálogo, saldo separado por galpão). */
export const LOGSTOKA_ORG_LAYER_STOCK = 'stock' as const;

export const LOGSTOKA_ORG_HIERARCHY = [
  {
    layer: LOGSTOKA_ORG_LAYER_COMPANY,
    title: 'Empresa (Sede)',
    description:
      'Quem contratou o LogStoka. O Admin Sênior (titular da compra) é o dono da conta — plano, pagamento e visão global.',
    example: 'Logo Transporte Ltda',
  },
  {
    layer: LOGSTOKA_ORG_LAYER_WAREHOUSE,
    title: 'Centros de Distribuição (CDs)',
    description:
      'Cada galpão ou depósito Full é um CD. Osasco, Barueri, Cotia e Rio são CDs diferentes da mesma empresa.',
    example: 'CD Osasco · CD Cotia · Full Shopee',
  },
  {
    layer: LOGSTOKA_ORG_LAYER_STOCK,
    title: 'Estoque por CD',
    description:
      'O produto LS000001 existe uma vez no catálogo. O saldo fica em cada CD: Cotia 120 un., Osasco 35 un., etc.',
    example: 'LS000001 → 120 (Cotia) + 35 (Osasco) = 155 total empresa',
  },
] as const;

export const LOGSTOKA_ADMIN_HIERARCHY = [
  {
    code: 'owner',
    title: 'Admin Sênior',
    subtitle: 'Titular da conta (quem comprou)',
    powers: 'Visão de todos os CDs, equipe, integrações, relatórios e gestão de plano/pagamento.',
    limits: 'Nenhuma — autonomia total sobre a conta.',
  },
  {
    code: 'regional_admin',
    title: 'Administrador',
    subtitle: 'Pode administrar região / operação',
    powers: 'Mesmas funções operacionais do Admin Sênior: CDs, estoque, movimentações, equipe, integrações.',
    limits: 'Não altera pagamento, plano nem dados de cobrança da conta.',
  },
  {
    code: 'logistics_manager',
    title: 'Gestor de CD / Logística',
    subtitle: 'Supervisão de um ou mais galpões',
    powers: 'Aprova inventários, movimentações e transferências do(s) CD(s) autorizado(s).',
    limits: 'Sem acesso a configurações de conta, billing ou cadastro de novos CDs (conforme perfil).',
  },
  {
    code: 'operator',
    title: 'Operador / Estoquista',
    subtitle: 'Execução no chão de fábrica',
    powers: 'Entrada, saída, conferência e inventário no CD autorizado.',
    limits: 'Não vê estoque nem movimentações de outros galpões.',
  },
] as const;

export function profileOrgScopeLabel(profile: Profile | null | undefined): string {
  if (!profile) return 'Sem sessão';
  if (profile.is_account_owner) return 'Visão global · Titular da conta';
  if (profile.role === 'regional_admin' || profile.role === 'admin' || profile.role === 'master_admin') {
    return profile.warehouse_id ? 'Administrador · CD autorizado' : 'Visão global · Todos os CDs';
  }
  if (profile.warehouse_id) return 'Visão restrita · 1 CD';
  return 'Visão operacional';
}

export function demoCompanyLabel(companyId?: string | null): string {
  if (!companyId) return 'Empresa';
  if (companyId.includes('demo')) return 'Logo Transporte (demo)';
  return 'Sua empresa';
}
