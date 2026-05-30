import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { LOGSTOKA_ROW_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useTablePagination } from '@/hooks/useTablePagination';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import {
  DEMO_ALERTS,
  DEMO_MOVEMENTS,
  DEMO_TRANSFERS,
  movementTypeLabel,
} from '@/lib/logstokaDemoSeed';
import { supabase } from '@/lib/supabase';

type ActivityRow = {
  id: string;
  time: string;
  type: string;
  tone: string;
  description: string;
  reference: string;
  status: string;
  href?: string;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function demoActivities(): ActivityRow[] {
  const fromMovements: ActivityRow[] = DEMO_MOVEMENTS.map((m) => ({
    id: m.id,
    time: m.created_at,
    type: movementTypeLabel(m.movement_type),
    tone:
      m.movement_type === 'entry'
        ? 'bg-emerald-50 text-emerald-700'
        : m.movement_type === 'exit'
          ? 'bg-orange-50 text-orange-700'
          : m.movement_type === 'transfer'
            ? 'bg-orange-50 text-orange-700'
            : m.movement_type === 'return'
              ? 'bg-violet-50 text-violet-700'
              : 'bg-rose-50 text-rose-700',
    description: `${m.product_name ?? m.sku ?? '—'} · ${m.total_quantity} un`,
    reference: m.reference_code ?? '—',
    status: m.status === 'completed' ? 'Concluído' : m.status,
    href: `/app/movements/${m.id}`,
  }));

  const fromAlerts: ActivityRow[] = DEMO_ALERTS.map((a) => ({
    id: a.id,
    time: a.created_at,
    type: 'Alerta',
    tone:
      a.severity === 'critical'
        ? 'bg-rose-50 text-rose-700'
        : a.severity === 'warning'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-orange-50 text-orange-700',
    description: a.message ?? '—',
    reference: a.title ?? '—',
    status: a.is_read ? 'Lido' : 'Pendente',
    href: '/app/configuracoes/notificacoes?tab=alertas',
  }));

  const fromTransfers: ActivityRow[] = DEMO_TRANSFERS.map((t) => ({
    id: t.id,
    time: t.created_at,
    type: 'Transferência',
    tone: 'bg-orange-50 text-orange-700',
    description: `${t.origin_name} → ${t.destination_name}`,
    reference: t.notes ?? t.id.toUpperCase(),
    status: t.status === 'completed' ? 'Concluído' : t.status === 'in_transit' ? 'Em trânsito' : 'Pendente',
    href: `/app/transfers/${t.id}`,
  }));

  return [...fromMovements, ...fromAlerts, ...fromTransfers]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 20);
}

type Props = {
  companyId: string | null;
};

const DashboardActivityTable: React.FC<Props> = ({ companyId }) => {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { paginatedItems, footerProps } = useTablePagination(rows, 10, companyId);

  useEffect(() => {
    if (!companyId) {
      setRows([]);
      setLoading(false);
      return;
    }
    if (isLogstokaDemoCompany(companyId)) {
      setRows(demoActivities());
      setLoading(false);
      return;
    }

    setLoading(true);
    void Promise.all([
      supabase
        .from('ls_stock_movements')
        .select('id, movement_type, status, reference_code, total_quantity, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('ls_alerts')
        .select('id, title, message, severity, is_read, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(8),
    ])
      .then(([movRes, alertRes]) => {
        const movements: ActivityRow[] = (movRes.data ?? []).map((m) => ({
          id: m.id,
          time: m.created_at,
          type: movementTypeLabel(m.movement_type),
          tone: 'bg-gray-100 text-gray-700',
          description: `${m.total_quantity ?? 0} unidades movimentadas`,
          reference: m.reference_code ?? '—',
          status: m.status ?? '—',
          href: `/app/movements/${m.id}`,
        }));

        const alerts: ActivityRow[] = (alertRes.data ?? []).map((a) => ({
          id: a.id,
          time: a.created_at,
          type: 'Alerta',
          tone: 'bg-amber-50 text-amber-700',
          description: a.message ?? '—',
          reference: a.title ?? '—',
          status: a.is_read ? 'Lido' : 'Pendente',
          href: '/app/configuracoes/notificacoes?tab=alertas',
        }));

        setRows([...movements, ...alerts].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 20));
      })
      .finally(() => setLoading(false));
  }, [companyId]);

  const empty = !loading && rows.length === 0;

  return (
    <section className="ls-dashboard-panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-black uppercase tracking-widest text-gray-500">O que está acontecendo</h3>
          <p className="mt-0.5 text-xs text-gray-400">Movimentações, alertas e transferências em tempo real</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50/80 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <tr>
              <th className="px-4 py-3">Quando</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Referência</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Carregando…
                </td>
              </tr>
            ) : null}
            {empty ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma atividade recente.
                </td>
              </tr>
            ) : null}
            {!loading &&
              paginatedItems.map((row) => (
                <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{formatTime(row.time)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${row.tone}`}>{row.type}</span>
                  </td>
                  <td className="max-w-md px-4 py-3">
                    {row.href ? (
                      <Link to={row.href} className={`${LOGSTOKA_ROW_TITLE_CLASS} hover:text-orange-600`}>
                        {row.description}
                      </Link>
                    ) : (
                      <span className={LOGSTOKA_ROW_TITLE_CLASS}>{row.description}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-500">{row.reference}</td>
                  <td className="px-4 py-3 text-xs font-bold text-gray-600">{row.status}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <LogstokaTableFooter {...footerProps} loading={loading} hidden={empty} />
    </section>
  );
};

export default DashboardActivityTable;
