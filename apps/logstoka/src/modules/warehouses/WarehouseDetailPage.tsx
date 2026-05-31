import React, { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  Download,
  FileText,
  Mail,
  MapPin,
  Package,
  Phone,
  Printer,
  Share2,
  UserRound,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaShareModal from '@/components/sharing/LogstokaShareModal';
import LogstokaTableIconToolbar, { type LogstokaToolbarAction } from '@/components/ui/LogstokaTableIconToolbar';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useLogstokaWarehouseScope } from '@/context/LogstokaWarehouseScopeContext';
import { getDemoWarehouseById } from '@/lib/demoWarehouseStore';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import {
  movementsForWarehouse,
  stockStatsForWarehouse,
  transfersForWarehouse,
  warehouseDayStats,
  warehouseLocationLabel,
} from '@/lib/warehouseUtils';
import { openPrintDocument } from '@/lib/openPrintDocument';
import { supabase } from '@/lib/supabase';
import { MARKETPLACE_LABELS } from '@/types';
import type { LsWarehouse } from '@/types';
import WarehouseProductsXRayPanel from '@/components/warehouses/WarehouseProductsXRayPanel';
import './warehouseDetailPage.css';

function warehouseTypeLabel(type: LsWarehouse['type']): string {
  if (type === 'physical') return 'CD físico';
  if (type === 'full_marketplace') return 'Full marketplace';
  return 'Trânsito';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const WarehouseDetailPage: React.FC = () => {
  const { warehouseId = '' } = useParams();
  const { companyId } = useLogstokaTenant();
  const { canAccessWarehouse, isGlobalView } = useLogstokaWarehouseScope();
  const demo = isLogstokaDemoCompany(companyId);
  const [movementsShareOpen, setMovementsShareOpen] = useState(false);

  const warehouse = useMemo(() => {
    if (!companyId || !warehouseId) return null;
    if (demo) return getDemoWarehouseById(companyId, warehouseId);
    return null;
  }, [companyId, warehouseId, demo]);

  React.useEffect(() => {
    if (demo || !companyId || !warehouseId) return;
    void supabase
      .from('ls_warehouses')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', warehouseId)
      .maybeSingle();
  }, [companyId, warehouseId, demo]);

  if (!warehouseId) return <Navigate to="/app/warehouses" replace />;
  if (warehouse && !canAccessWarehouse(warehouse.id)) {
    return <Navigate to="/app/warehouses" replace />;
  }
  if (!warehouse) {
    return (
      <div className="ls-card p-6 text-sm text-slate-500">
        CD não encontrado.{' '}
        <Link to="/app/warehouses" className="font-bold text-orange-700">
          Voltar aos depósitos
        </Link>
      </div>
    );
  }

  const stock = demo ? stockStatsForWarehouse(warehouse.id) : { units: 0, skus: 0, products: 0 };
  const day = demo ? warehouseDayStats(warehouse.id) : { entries: 0, exits: 0, transfers: 0, movementCount: 0 };
  const recentMovements = demo ? movementsForWarehouse(warehouse.id).slice(0, 8) : [];
  const transfers = demo ? transfersForWarehouse(warehouse.id).slice(0, 4) : [];

  const kpis = [
    { label: 'SKUs', value: stock.skus, hint: 'produtos com saldo', icon: <Package size={28} /> },
    { label: 'Unidades', value: stock.units.toLocaleString('pt-BR'), hint: 'estoque neste CD', icon: <WarehouseIcon size={28} /> },
    { label: 'Entradas hoje', value: day.entries, hint: 'movimentações', icon: <ArrowLeftRight size={28} /> },
    { label: 'Saídas hoje', value: day.exits, hint: 'movimentações', icon: <ArrowLeftRight size={28} /> },
  ];

  const movementsSnapshot = {
    warehouse: warehouse.name,
    generated_at: new Date().toISOString(),
    movements: recentMovements.map((m) => ({
      date: m.created_at,
      type: m.movement_type,
      reference: m.reference_code,
      product: m.product_name ?? m.sku,
      quantity: m.total_quantity,
    })),
  };

  const printMovements = () => {
    const rows = recentMovements
      .map(
        (m) => `<tr>
          <td>${escapeHtml(new Date(m.created_at).toLocaleString('pt-BR'))}</td>
          <td>${escapeHtml(m.movement_type)}</td>
          <td>${escapeHtml(m.reference_code ?? '—')}</td>
          <td>${escapeHtml(m.product_name ?? m.sku ?? '—')}</td>
          <td class="num">${escapeHtml(String(m.total_quantity))}</td>
        </tr>`,
      )
      .join('');
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" /><title>Movimentações · ${escapeHtml(warehouse.name)}</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;color:#383838;margin:24px}h1{font-size:18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #e5e5e5;padding:8px;text-align:left}th{background:#fafafa;font-size:10px;text-transform:uppercase}.num{text-align:right}</style>
      </head><body><h1>Últimas movimentações · ${escapeHtml(warehouse.name)}</h1>
      <table><thead><tr><th>Data</th><th>Tipo</th><th>Referência</th><th>Produto</th><th>Qtd</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">Sem movimentações.</td></tr>'}</tbody></table></body></html>`;
    openPrintDocument(html);
  };

  const exportMovementsCsv = () => {
    const headers = ['Data', 'Tipo', 'Referência', 'Produto', 'Quantidade'];
    const rows = recentMovements.map((m) => [
      new Date(m.created_at).toLocaleString('pt-BR'),
      m.movement_type,
      m.reference_code ?? '',
      m.product_name ?? m.sku ?? '',
      String(m.total_quantity),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `movimentacoes-${warehouse.name.replace(/\s+/g, '-').toLowerCase()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  };

  const movementsToolbarActions: LogstokaToolbarAction[] = [
    {
      key: 'print',
      label: 'Imprimir movimentações',
      icon: <Printer size={18} strokeWidth={2} />,
      onClick: printMovements,
      disabled: recentMovements.length === 0,
    },
    {
      key: 'csv',
      label: 'Exportar CSV',
      icon: <Download size={18} strokeWidth={2} />,
      onClick: exportMovementsCsv,
      disabled: recentMovements.length === 0,
    },
    {
      key: 'pdf',
      label: 'Baixar PDF',
      icon: <FileText size={18} strokeWidth={2} />,
      onClick: () => {
        printMovements();
        toast('Use “Salvar como PDF” na janela de impressão', { icon: '📄' });
      },
      disabled: recentMovements.length === 0,
    },
    {
      key: 'share',
      label: 'Compartilhar',
      icon: <Share2 size={18} strokeWidth={2} />,
      onClick: () => setMovementsShareOpen(true),
      disabled: recentMovements.length === 0,
    },
  ];

  return (
    <div className="ls-warehouse-detail space-y-6">
      <LogstokaPageHeader
        leading={
          <Link to="/app/warehouses" className="ls-page-header__back" aria-label="Voltar aos depósitos">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
        }
        icon={<Building2 size={20} strokeWidth={2.25} />}
        title={warehouse.name}
        subtitle={`${warehouse.code} · ${warehouseTypeLabel(warehouse.type)}${warehouse.marketplace ? ` · ${MARKETPLACE_LABELS[warehouse.marketplace]}` : ''}`}
        trailing={
          <span className={`ls-warehouse-detail__status${warehouse.is_active ? ' ls-warehouse-detail__status--on' : ''}`}>
            {warehouse.is_active ? 'Ativo' : 'Inativo'}
          </span>
        }
      />

      <section className="ls-card ls-warehouse-detail__contact">
        <div className="ls-warehouse-detail__contact-grid">
          <div className="ls-warehouse-detail__contact-block">
            <p className="ls-warehouse-detail__contact-label">
              <MapPin size={14} aria-hidden />
              Endereço e local
            </p>
            <p className="ls-warehouse-detail__contact-value">{warehouseLocationLabel(warehouse)}</p>
            {warehouse.address_line ? (
              <p className="ls-warehouse-detail__contact-sub">{warehouse.address_line}</p>
            ) : (
              <p className="ls-warehouse-detail__contact-sub ls-warehouse-detail__contact-sub--muted">
                Endereço não cadastrado
              </p>
            )}
          </div>

          <div className="ls-warehouse-detail__contact-block">
            <p className="ls-warehouse-detail__contact-label">
              <UserRound size={14} aria-hidden />
              Responsável
            </p>
            {warehouse.manager_name ? (
              <>
                <p className="ls-warehouse-detail__contact-value">{warehouse.manager_name}</p>
                <p className="ls-warehouse-detail__contact-sub">{warehouse.manager_role ?? 'Responsável pelo CD'}</p>
              </>
            ) : (
              <p className="ls-warehouse-detail__contact-sub ls-warehouse-detail__contact-sub--muted">
                Nenhum responsável cadastrado
              </p>
            )}
          </div>

          <div className="ls-warehouse-detail__contact-block">
            <p className="ls-warehouse-detail__contact-label">Contato</p>
            {warehouse.manager_phone ? (
              <p className="ls-warehouse-detail__contact-row">
                <Phone size={14} aria-hidden />
                <a href={`tel:${warehouse.manager_phone.replace(/\D/g, '')}`}>{warehouse.manager_phone}</a>
              </p>
            ) : null}
            {warehouse.manager_email ? (
              <p className="ls-warehouse-detail__contact-row">
                <Mail size={14} aria-hidden />
                <a href={`mailto:${warehouse.manager_email}`}>{warehouse.manager_email}</a>
              </p>
            ) : null}
            {!warehouse.manager_phone && !warehouse.manager_email ? (
              <p className="ls-warehouse-detail__contact-sub ls-warehouse-detail__contact-sub--muted">
                Telefone e e-mail não informados
              </p>
            ) : null}
          </div>
        </div>

        <div className="ls-warehouse-detail__actions">
          <Link to={`/app/inventory?warehouse=${encodeURIComponent(warehouse.id)}`} className="ls-btn-secondary">
            Ver inventário
          </Link>
          <Link to={`/app/movements?warehouse=${encodeURIComponent(warehouse.id)}`} className="ls-btn-secondary">
            Movimentações
          </Link>
          <Link to="/app/transfers" className="ls-btn-secondary">
            Transferências
          </Link>
        </div>
      </section>

      {!isGlobalView ? (
        <div className="ls-warehouse-detail__scope-note">
          Visão restrita ao seu CD — você só opera estoque e movimentações deste galpão.
        </div>
      ) : null}

      <LogstokaKpiStrip items={kpis} />

      {warehouse.type === 'physical' ? <WarehouseProductsXRayPanel warehouse={warehouse} /> : null}

      <div className="ls-warehouse-detail__grid">
        <section className="ls-card ls-warehouse-detail__panel">
          <h2 className="ls-warehouse-detail__panel-title">Resumo operacional · hoje</h2>
          <dl className="ls-warehouse-detail__meta">
            <div>
              <dt>Transferências hoje</dt>
              <dd>{day.transfers}</dd>
            </div>
            <div>
              <dt>Movimentações hoje</dt>
              <dd>{day.movementCount}</dd>
            </div>
            <div>
              <dt>Produtos com saldo</dt>
              <dd>{stock.skus}</dd>
            </div>
          </dl>
        </section>

        {transfers.length > 0 ? (
          <section className="ls-card ls-warehouse-detail__panel">
            <h2 className="ls-warehouse-detail__panel-title">Transferências envolvendo este CD</h2>
            <ul className="ls-warehouse-detail__transfer-list">
              {transfers.map((transfer) => (
                <li key={transfer.id}>
                  <span className="font-bold text-[#404040]">
                    {transfer.origin_name} → {transfer.destination_name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {transfer.status} · {new Date(transfer.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="ls-card ls-warehouse-detail__panel">
            <h2 className="ls-warehouse-detail__panel-title">Transferências</h2>
            <p className="text-sm text-slate-500">Nenhuma transferência recente envolvendo este CD.</p>
            <Link to="/app/transfers" className="ls-btn-secondary mt-3 inline-flex">
              Nova transferência
            </Link>
          </section>
        )}
      </div>

      <section className="ls-card ls-warehouse-detail__panel">
        <div className="ls-warehouse-detail__panel-head">
          <h2 className="ls-warehouse-detail__panel-title">Últimas movimentações</h2>
          <div className="flex flex-wrap items-center gap-2">
            <LogstokaTableIconToolbar actions={movementsToolbarActions} ariaLabel="Ações das movimentações" />
            <Link to={`/app/movements?warehouse=${encodeURIComponent(warehouse.id)}`} className="text-xs font-bold text-orange-700">
              Ver todas →
            </Link>
          </div>
        </div>
        {recentMovements.length === 0 ? (
          <p className="text-sm text-slate-500">Sem movimentações recentes neste CD.</p>
        ) : (
          <div className="ls-warehouse-detail__table-wrap">
            <table className="ls-warehouse-detail__table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Referência</th>
                  <th>Produto</th>
                  <th>Qtd</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{new Date(movement.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>{movement.movement_type}</td>
                    <td>{movement.reference_code ?? '—'}</td>
                    <td>{movement.product_name ?? movement.sku ?? '—'}</td>
                    <td>{movement.total_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <LogstokaShareModal
        open={movementsShareOpen}
        onClose={() => setMovementsShareOpen(false)}
        resourceType="general_table"
        resourceId={`warehouse-movements-${warehouse.id}`}
        resourceName={`Movimentações · ${warehouse.name}`}
        snapshotData={movementsSnapshot}
      />

      <p className="text-xs text-slate-400">
        Modelo multi-CD: produto único no catálogo (ex. LS000001), estoque separado por galpão. Total da empresa = soma de todos os CDs.
      </p>
    </div>
  );
};

export default WarehouseDetailPage;
