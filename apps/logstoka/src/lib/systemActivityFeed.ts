import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import {
  DEMO_ALERTS,
  DEMO_IMPORTS,
  DEMO_INTEGRATION_LOGS,
  DEMO_INVENTORIES,
  DEMO_MOVEMENTS,
  DEMO_RETURNS,
  DEMO_TRANSFERS,
  movementTypeLabel,
} from '@/lib/logstokaDemoSeed';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { getDemoSalesDashboard } from '@/lib/salesDashboard';
import { supabase } from '@/lib/supabase';

export type ActivityCategory = 'operation' | 'sales' | 'integrations' | 'alerts';

export type SystemActivityRow = {
  id: string;
  time: string;
  type: string;
  category: ActivityCategory;
  tone: string;
  description: string;
  reference: string;
  status: string;
  href?: string;
};

export type ActivityFilter = 'all' | ActivityCategory;

export const ACTIVITY_FILTER_OPTIONS: { id: ActivityFilter; label: string }[] = [
  { id: 'all', label: 'Tudo' },
  { id: 'operation', label: 'Operação' },
  { id: 'sales', label: 'Vendas' },
  { id: 'integrations', label: 'Integrações' },
  { id: 'alerts', label: 'Alertas' },
];

const TONE = {
  brand: 'ls-activity-tone ls-activity-tone--brand',
  warn: 'ls-activity-tone ls-activity-tone--warn',
  danger: 'ls-activity-tone ls-activity-tone--danger',
  neutral: 'ls-activity-tone ls-activity-tone--neutral',
  muted: 'ls-activity-tone ls-activity-tone--muted',
} as const;

export function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function salesStatusLabel(status: string): string {
  if (status === 'fulfilled') return 'Atendido';
  if (status === 'cancelled') return 'Cancelado';
  if (status === 'open') return 'Em andamento';
  return status;
}

function buildDemoActivities(): SystemActivityRow[] {
  const fromMovements: SystemActivityRow[] = DEMO_MOVEMENTS.map((m) => ({
    id: m.id,
    time: m.created_at,
    type: movementTypeLabel(m.movement_type),
    category: 'operation',
    tone:
      m.movement_type === 'entry'
        ? TONE.brand
        : m.movement_type === 'exit'
          ? TONE.warn
          : m.movement_type === 'damage'
            ? TONE.danger
            : TONE.neutral,
    description: `${m.product_name ?? m.sku ?? '—'} · ${m.total_quantity} un`,
    reference: m.reference_code ?? '—',
    status: m.status === 'completed' ? 'Concluído' : m.status,
    href: `/app/movements/${m.id}`,
  }));

  const fromAlerts: SystemActivityRow[] = DEMO_ALERTS.map((a) => ({
    id: a.id,
    time: a.created_at,
    type: 'Alerta',
    category: 'alerts',
    tone: a.severity === 'critical' ? TONE.danger : a.severity === 'warning' ? TONE.warn : TONE.brand,
    description: a.message ?? '—',
    reference: a.title ?? '—',
    status: a.is_read ? 'Lido' : 'Pendente',
    href: `${LOGSTOKA_ROUTES.SETTINGS_NOTIFICATIONS}?tab=alertas`,
  }));

  const fromTransfers: SystemActivityRow[] = DEMO_TRANSFERS.map((t) => ({
    id: t.id,
    time: t.created_at,
    type: 'Transferência',
    category: 'operation',
    tone: TONE.neutral,
    description: `${t.origin_name} → ${t.destination_name}`,
    reference: t.notes ?? t.id.toUpperCase(),
    status: t.status === 'completed' ? 'Concluído' : t.status === 'in_transit' ? 'Em trânsito' : 'Pendente',
    href: `/app/transfers/${t.id}`,
  }));

  const fromReturns: SystemActivityRow[] = DEMO_RETURNS.map((r) => ({
    id: r.id,
    time: r.created_at,
    type: 'Devolução',
    category: 'operation',
    tone: TONE.muted,
    description: `${r.product_name} · ${r.quantity} un · ${r.store_name}`,
    reference: r.order_reference ?? r.sku,
    status:
      r.status === 'completed'
        ? 'Concluído'
        : r.status === 'approved'
          ? 'Aprovado'
          : r.status === 'rejected'
            ? 'Rejeitado'
            : r.status === 'received'
              ? 'Recebido'
              : 'Triagem',
    href: `/app/returns/${r.id}`,
  }));

  const fromInventories: SystemActivityRow[] = DEMO_INVENTORIES.map((inv) => {
    const diffCount = inv.ls_inventory_items.filter((item) => (item.difference ?? 0) !== 0).length;
    return {
      id: inv.id,
      time: inv.created_at,
      type: 'Inventário',
      category: 'operation',
      tone: TONE.neutral,
      description: `${inv.warehouse_name} · ${inv.ls_inventory_items.length} SKUs${diffCount ? ` · ${diffCount} divergência(s)` : ''}`,
      reference: inv.inventory_type === 'general' ? 'Geral' : 'Rotativo',
      status: inv.status === 'completed' ? 'Concluído' : inv.status === 'review' ? 'Em revisão' : 'Aberto',
      href: `/app/inventory/${inv.id}`,
    };
  });

  const fromImports: SystemActivityRow[] = DEMO_IMPORTS.map((imp) => ({
    id: imp.id,
    time: imp.created_at,
    type: 'Importação',
    category: 'operation',
    tone: imp.status === 'warning' ? TONE.warn : TONE.brand,
    description: `${imp.file_name} · ${imp.rows_processed} linhas processadas`,
    reference: imp.file_type.toUpperCase(),
    status: imp.status === 'completed' ? 'Concluído' : imp.status === 'warning' ? 'Atenção' : imp.status,
    href: '/app/imports',
  }));

  const fromIntegrations: SystemActivityRow[] = DEMO_INTEGRATION_LOGS.map((log) => ({
    id: log.id,
    time: log.created_at,
    type: 'Integração',
    category: 'integrations',
    tone: log.status === 'success' ? TONE.brand : log.status === 'warning' ? TONE.warn : TONE.danger,
    description: `${log.direction === 'inbound' ? 'Recebido' : 'Enviado'} · ${log.endpoint}`,
    reference: log.endpoint,
    status: log.status === 'success' ? 'Sucesso' : log.status === 'warning' ? 'Atenção' : 'Erro',
    href: LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL,
  }));

  const fromSales: SystemActivityRow[] = getDemoSalesDashboard(7).orders.slice(0, 12).map((order) => ({
    id: order.id,
    time: order.soldAt,
    type: 'Pedido',
    category: 'sales',
    tone:
      order.status === 'fulfilled' ? TONE.brand : order.status === 'cancelled' ? TONE.danger : TONE.warn,
    description: `${order.productName} · ${order.quantity} un · ${order.marketplaceLabel}`,
    reference: order.orderRef,
    status: salesStatusLabel(order.status),
    href: LOGSTOKA_ROUTES.SALES,
  }));

  return [
    ...fromMovements,
    ...fromAlerts,
    ...fromTransfers,
    ...fromReturns,
    ...fromInventories,
    ...fromImports,
    ...fromIntegrations,
    ...fromSales,
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export async function loadSystemActivities(companyId: string): Promise<SystemActivityRow[]> {
  if (isLogstokaDemoCompany(companyId)) {
    return buildDemoActivities();
  }

  const [movRes, alertRes, importRes, logRes] = await Promise.all([
    supabase
      .from('ls_stock_movements')
      .select('id, movement_type, status, reference_code, total_quantity, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('ls_alerts')
      .select('id, title, message, severity, is_read, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('ls_reports_imports')
      .select('id, file_name, file_type, status, rows_processed, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('ls_integration_logs')
      .select('id, direction, endpoint, status, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const movements: SystemActivityRow[] = (movRes.data ?? []).map((m) => ({
    id: m.id,
    time: m.created_at,
    type: movementTypeLabel(m.movement_type),
    category: 'operation',
    tone: TONE.neutral,
    description: `${m.total_quantity ?? 0} unidades movimentadas`,
    reference: m.reference_code ?? '—',
    status: m.status ?? '—',
    href: `/app/movements/${m.id}`,
  }));

  const alerts: SystemActivityRow[] = (alertRes.data ?? []).map((a) => ({
    id: a.id,
    time: a.created_at,
    type: 'Alerta',
    category: 'alerts',
    tone: TONE.warn,
    description: a.message ?? '—',
    reference: a.title ?? '—',
    status: a.is_read ? 'Lido' : 'Pendente',
    href: `${LOGSTOKA_ROUTES.SETTINGS_NOTIFICATIONS}?tab=alertas`,
  }));

  const imports: SystemActivityRow[] = (importRes.data ?? []).map((imp) => ({
    id: imp.id,
    time: imp.created_at,
    type: 'Importação',
    category: 'operation',
    tone: imp.status === 'failed' ? TONE.danger : TONE.brand,
    description: `${imp.file_name} · ${imp.rows_processed ?? 0} linhas`,
    reference: (imp.file_type ?? '—').toUpperCase(),
    status: imp.status ?? '—',
    href: '/app/imports',
  }));

  const integrations: SystemActivityRow[] = (logRes.data ?? []).map((log) => ({
    id: log.id,
    time: log.created_at,
    type: 'Integração',
    category: 'integrations',
    tone: log.status === 'success' ? TONE.brand : TONE.warn,
    description: `${log.direction === 'inbound' ? 'Recebido' : 'Enviado'} · ${log.endpoint ?? 'API'}`,
    reference: log.endpoint ?? '—',
    status: log.status ?? '—',
    href: LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL,
  }));

  return [...movements, ...alerts, ...imports, ...integrations].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );
}
