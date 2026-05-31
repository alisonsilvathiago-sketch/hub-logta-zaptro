import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  Boxes,
  Building2,
  Package,
  RefreshCw,
  ShoppingBag,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaIconNav, { LogstokaIconNavButton } from '@/components/ui/LogstokaIconNav';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_STOCK, DEMO_WAREHOUSES } from '@/lib/logstokaDemoSeed';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { MARKETPLACE_LABELS } from '@/types';
import type { LsWarehouse } from '@/types';
import './warehousesPage.css';

function warehouseTypeLabel(type: LsWarehouse['type']): string {
  if (type === 'physical') return 'CD físico';
  if (type === 'full_marketplace') return 'Full marketplace';
  return 'Trânsito';
}

function stockForWarehouse(warehouseId: string): { units: number; skus: number } {
  const rows = DEMO_STOCK.filter((row) => row.warehouse_id === warehouseId);
  const skus = new Set(rows.map((row) => row.product_id)).size;
  const units = rows.reduce((sum, row) => sum + row.quantity, 0);
  return { units, skus };
}

const WarehousesPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const demo = isLogstokaDemoCompany(companyId);
  const [warehouses, setWarehouses] = useState<LsWarehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) {
      setWarehouses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (demo) {
        setWarehouses(DEMO_WAREHOUSES);
        return;
      }
      const { data } = await supabase
        .from('ls_warehouses')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      setWarehouses((data ?? []) as LsWarehouse[]);
    } finally {
      setLoading(false);
    }
  }, [companyId, demo]);

  useEffect(() => {
    void load();
  }, [load]);

  const kpis = useMemo(() => {
    const active = warehouses.filter((w) => w.is_active).length;
    const physical = warehouses.filter((w) => w.type === 'physical').length;
    const full = warehouses.filter((w) => w.type === 'full_marketplace').length;
    const totalUnits = demo
      ? DEMO_STOCK.reduce((sum, row) => sum + row.quantity, 0)
      : '—';
    return [
      { label: 'Depósitos', value: loading ? '…' : warehouses.length, hint: `${active} ativos`, icon: <Building2 size={28} /> },
      { label: 'CDs físicos', value: physical, hint: 'operação própria', icon: <WarehouseIcon size={28} /> },
      { label: 'Full marketplace', value: full, hint: 'canais conectados', icon: <ShoppingBag size={28} /> },
      {
        label: 'Unidades em estoque',
        value: typeof totalUnits === 'number' ? totalUnits.toLocaleString('pt-BR') : totalUnits,
        hint: 'soma dos depósitos',
        icon: <Boxes size={28} />,
      },
    ];
  }, [warehouses, loading, demo]);

  const toggleActive = (warehouse: LsWarehouse) => {
    if (demo) {
      setWarehouses((prev) =>
        prev.map((w) => (w.id === warehouse.id ? { ...w, is_active: !w.is_active } : w)),
      );
      toast.success(warehouse.is_active ? `${warehouse.name} desativado` : `${warehouse.name} ativado`);
      return;
    }
    toast('Ative/desative depósitos em Configurações · Empresa');
  };

  return (
    <div className="ls-warehouses-page space-y-6">
      <LogstokaPageHeader
        icon={<WarehouseIcon size={20} strokeWidth={2.25} />}
        title="Depósitos"
        subtitle="CDs físicos e depósitos Full por marketplace — controle onde o estoque fica"
        actions={
          <LogstokaIconNavButton title="Recarregar depósitos" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={18} strokeWidth={2.2} className={loading ? 'animate-spin' : undefined} />
          </LogstokaIconNavButton>
        }
      />

      <LogstokaKpiStrip items={kpis} />

      <div className="ls-warehouses-page__toolbar">
        <LogstokaIconNav
          aria-label="Atalhos de depósitos"
          variant="inline"
          items={[
            {
              type: 'link',
              key: 'inventory',
              to: '/app/inventory',
              label: 'Inventário',
              icon: <Package size={18} strokeWidth={2.2} aria-hidden />,
            },
            {
              type: 'link',
              key: 'movements',
              to: '/app/movements',
              label: 'Movimentações',
              icon: <ArrowLeftRight size={18} strokeWidth={2.2} aria-hidden />,
            },
          ]}
        />
      </div>

      <div className="ls-warehouses-grid">
        {warehouses.map((w) => {
          const stock = demo ? stockForWarehouse(w.id) : null;
          return (
            <article
              key={w.id}
              className={`ls-warehouse-card${w.is_active ? '' : ' ls-warehouse-card--inactive'}`}
            >
              <div className="ls-warehouse-card__head">
                <span className="ls-warehouse-card__icon" aria-hidden>
                  <WarehouseIcon size={20} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="ls-warehouse-card__name">{w.name}</h3>
                  <p className="ls-warehouse-card__code">{w.code}</p>
                </div>
                <button
                  type="button"
                  className={`ls-warehouse-card__toggle${w.is_active ? ' ls-warehouse-card__toggle--on' : ''}`}
                  aria-pressed={w.is_active}
                  aria-label={w.is_active ? `Desativar ${w.name}` : `Ativar ${w.name}`}
                  onClick={() => toggleActive(w)}
                >
                  {w.is_active ? 'Ativo' : 'Inativo'}
                </button>
              </div>

              <div className="ls-warehouse-card__badges">
                <span className="ls-badge bg-slate-100 text-slate-700">{warehouseTypeLabel(w.type)}</span>
                {w.marketplace ? (
                  <span className="ls-badge bg-orange-50 text-orange-700">{MARKETPLACE_LABELS[w.marketplace]}</span>
                ) : null}
              </div>

              {stock ? (
                <dl className="ls-warehouse-card__stats">
                  <div>
                    <dt>SKUs</dt>
                    <dd>{stock.skus}</dd>
                  </div>
                  <div>
                    <dt>Unidades</dt>
                    <dd>{stock.units.toLocaleString('pt-BR')}</dd>
                  </div>
                </dl>
              ) : (
                <p className="ls-warehouse-card__hint">Estoque vinculado ao WMS</p>
              )}

              {w.is_active ? (
                <Link to={`/app/inventory?warehouse=${encodeURIComponent(w.id)}`} className="ls-warehouse-card__link">
                  Ver inventário deste depósito →
                </Link>
              ) : (
                <p className="ls-warehouse-card__muted">Ative para usar em movimentações e inventário</p>
              )}
            </article>
          );
        })}
      </div>

      {warehouses.length === 0 && !loading ? (
        <div className="ls-card text-sm text-slate-500">Nenhum depósito cadastrado.</div>
      ) : null}
    </div>
  );
};

export default WarehousesPage;
