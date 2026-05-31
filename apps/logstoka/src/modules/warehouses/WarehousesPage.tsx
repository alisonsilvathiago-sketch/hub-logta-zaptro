import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  Boxes,
  Building2,
  Filter,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  UserRound,
  Warehouse as WarehouseIcon,
  X,
} from 'lucide-react';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaIconNav, { LogstokaIconNavButton } from '@/components/ui/LogstokaIconNav';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaWarehouseScope } from '@/context/LogstokaWarehouseScopeContext';
import {
  loadMergedDemoWarehouses,
  patchDemoWarehouse,
  upsertDemoWarehouse,
} from '@/lib/demoWarehouseStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_STOCK } from '@/lib/logstokaDemoSeed';
import { filterWarehouses, stockStatsForWarehouse, warehouseLocationLabel } from '@/lib/warehouseUtils';
import { MARKETPLACE_LABELS } from '@/types';
import type { LsWarehouse } from '@/types';
import LogstokaOrgHierarchyBanner from '@/components/org/LogstokaOrgHierarchyBanner';
import { canRegisterWarehouses, isAccountOwner } from '@/lib/permissions';
import WarehouseRegisterModal from './WarehouseRegisterModal';
import './warehousesPage.css';

function warehouseTypeLabel(type: LsWarehouse['type']): string {
  if (type === 'physical') return 'CD físico';
  if (type === 'full_marketplace') return 'Full marketplace';
  return 'Trânsito';
}

const WarehousesPage: React.FC = () => {
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const { visibleWarehouses, isGlobalView, reload: reloadScope } = useLogstokaWarehouseScope();
  const canRegister = canRegisterWarehouses(profile);
  const demo = isLogstokaDemoCompany(companyId);
  const [warehouses, setWarehouses] = useState<LsWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | LsWarehouse['type']>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) {
      setWarehouses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (demo) {
        setWarehouses(loadMergedDemoWarehouses(companyId));
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

  useEffect(() => {
    const onUpdate = () => void load();
    window.addEventListener('logstoka:demo-warehouses-updated', onUpdate);
    window.addEventListener('logstoka:system-pulse', onUpdate);
    return () => {
      window.removeEventListener('logstoka:demo-warehouses-updated', onUpdate);
      window.removeEventListener('logstoka:system-pulse', onUpdate);
    };
  }, [load]);

  const scopedList = useMemo(() => {
    const ids = new Set(visibleWarehouses.map((warehouse) => warehouse.id));
    return warehouses.filter((warehouse) => ids.has(warehouse.id));
  }, [warehouses, visibleWarehouses]);

  const filteredWarehouses = useMemo(
    () => filterWarehouses(scopedList, appliedSearch, typeFilter),
    [scopedList, appliedSearch, typeFilter],
  );

  const kpis = useMemo(() => {
    const active = scopedList.filter((w) => w.is_active).length;
    const physical = scopedList.filter((w) => w.type === 'physical').length;
    const full = scopedList.filter((w) => w.type === 'full_marketplace').length;
    const totalUnits = demo
      ? DEMO_STOCK.reduce((sum, row) => sum + row.quantity, 0)
      : '—';
    return [
      { label: 'Depósitos', value: loading ? '…' : scopedList.length, hint: `${active} ativos`, icon: <Building2 size={28} /> },
      { label: 'CDs físicos', value: physical, hint: 'galpões da empresa', icon: <WarehouseIcon size={28} /> },
      { label: 'Full marketplace', value: full, hint: 'canais conectados', icon: <ShoppingBag size={28} /> },
      {
        label: 'Unidades em estoque',
        value: typeof totalUnits === 'number' ? totalUnits.toLocaleString('pt-BR') : totalUnits,
        hint: 'soma de todos os CDs',
        icon: <Boxes size={28} />,
      },
    ];
  }, [scopedList, loading, demo]);

  const refreshAll = async () => {
    await load();
    await reloadScope();
    toast.success('Lista de depósitos atualizada');
  };

  const toggleActive = (warehouse: LsWarehouse) => {
    if (demo && companyId) {
      patchDemoWarehouse(companyId, warehouse.id, { is_active: !warehouse.is_active });
      void load();
      toast.success(warehouse.is_active ? `${warehouse.name} desativado` : `${warehouse.name} ativado`);
      return;
    }
    toast('Ative/desative depósitos em Configurações · Empresa');
  };

  const handleRegister = (draft: Parameters<typeof upsertDemoWarehouse>[1]) => {
    if (!companyId || !demo) {
      toast('Cadastro de CD disponível em modo demo — em produção use Configurações · Empresa');
      return;
    }
    const created = upsertDemoWarehouse(companyId, draft);
    setRegisterOpen(false);
    void load();
    toast.success(`${created.name} cadastrado`);
  };

  const applySearch = () => setAppliedSearch(searchQuery.trim());

  return (
    <div className="ls-warehouses-page space-y-6">
      <LogstokaPageHeader
        icon={<WarehouseIcon size={20} strokeWidth={2.25} />}
        title="Centros de Distribuição"
        subtitle="Multi-CD — sede (empresa) · galpões (CDs) · estoque por CD. Admin Sênior vê tudo; operador vê só o galpão autorizado."
        actions={
          <>
            {canRegister ? (
              <button type="button" className="ls-btn-primary" onClick={() => setRegisterOpen(true)}>
                <Plus size={16} strokeWidth={2.4} aria-hidden />
                Cadastrar CD
              </button>
            ) : null}
            <LogstokaIconNavButton title="Atualizar depósitos" onClick={() => void refreshAll()} disabled={loading}>
              <RefreshCw size={18} strokeWidth={2.2} className={loading ? 'animate-spin' : undefined} />
            </LogstokaIconNavButton>
          </>
        }
      />

      <LogstokaOrgHierarchyBanner compact />

      {!isGlobalView ? (
        <div className="ls-warehouses-page__scope-note">
          Visão restrita ao seu CD — movimentações e estoque de outros galpões não aparecem aqui.
        </div>
      ) : isAccountOwner(profile) ? (
        <p className="ls-warehouses-page__owner-note">
          Você é o <strong>Admin Sênior (titular)</strong> — visão de todos os CDs, equipe e cobrança. Pode nomear
          outros administradores regionais com as mesmas funções operacionais, sem acesso a pagamento.
        </p>
      ) : null}

      <LogstokaKpiStrip items={kpis} />

      <div className="ls-warehouses-page__toolbar">
        <form
          className="ls-warehouses-page__search"
          onSubmit={(event) => {
            event.preventDefault();
            applySearch();
          }}
        >
          <Search size={16} strokeWidth={2.2} aria-hidden className="ls-warehouses-page__search-icon" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Filtrar por nome, código, cidade ou responsável…"
            aria-label="Filtrar depósitos"
          />
          {searchQuery ? (
            <button
              type="button"
              className="ls-warehouses-page__search-clear"
              aria-label="Limpar busca"
              onClick={() => {
                setSearchQuery('');
                setAppliedSearch('');
              }}
            >
              <X size={14} />
            </button>
          ) : null}
          <button type="submit" className="ls-warehouses-page__search-btn">
            Buscar
          </button>
        </form>

        <div className="ls-warehouses-page__toolbar-right">
          <div className="ls-warehouses-page__filter-wrap">
            <button
              type="button"
              className={`ls-warehouses-page__filter-btn${filterOpen ? ' ls-warehouses-page__filter-btn--open' : ''}`}
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((open) => !open)}
            >
              <Filter size={16} strokeWidth={2.2} aria-hidden />
              Filtrar
            </button>
            {filterOpen ? (
              <div className="ls-warehouses-page__filter-popover">
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#737373]">Tipo</span>
                  <select
                    className="ls-input w-full"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
                  >
                    <option value="all">Todos</option>
                    <option value="physical">CD físico</option>
                    <option value="full_marketplace">Full marketplace</option>
                    <option value="transit">Trânsito</option>
                  </select>
                </label>
              </div>
            ) : null}
          </div>

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
      </div>

      <p className="ls-warehouses-page__result-count">
        {loading ? 'Carregando…' : `${filteredWarehouses.length} depósito(s) encontrado(s)`}
        {appliedSearch ? ` · busca: “${appliedSearch}”` : ''}
      </p>

      <div className="ls-warehouses-grid">
        {filteredWarehouses.map((w) => {
          const stock = demo ? stockStatsForWarehouse(w.id) : null;
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
                  {w.type === 'physical' && (w.city || w.manager_name) ? (
                    <p className="ls-warehouse-card__location">
                      {w.city ? (
                        <>
                          <MapPin size={12} aria-hidden />
                          {warehouseLocationLabel(w)}
                        </>
                      ) : null}
                      {w.manager_name ? (
                        <>
                          <UserRound size={12} aria-hidden />
                          {w.manager_name}
                        </>
                      ) : null}
                    </p>
                  ) : null}
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
                <div className="ls-warehouse-card__links">
                  <Link to={`/app/warehouses/${encodeURIComponent(w.id)}`} className="ls-warehouse-card__link">
                    Ver perfil do CD →
                  </Link>
                  <Link to={`/app/inventory?warehouse=${encodeURIComponent(w.id)}`} className="ls-warehouse-card__link ls-warehouse-card__link--muted">
                    Inventário deste depósito →
                  </Link>
                </div>
              ) : (
                <p className="ls-warehouse-card__muted">Ative para usar em movimentações e inventário</p>
              )}
            </article>
          );
        })}
      </div>

      {filteredWarehouses.length === 0 && !loading ? (
        <div className="ls-card text-sm text-slate-500">
          Nenhum depósito encontrado com os filtros atuais.
        </div>
      ) : null}

      <WarehouseRegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} onSave={handleRegister} />
    </div>
  );
};

export default WarehousesPage;
