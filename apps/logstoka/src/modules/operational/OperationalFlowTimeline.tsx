import React, { useMemo, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { useStores } from '@/hooks/useCatalog';
import { DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';
import {
  buildWeeklyFlowPlan,
  saleDayLabel,
  WEEKDAY_SHORT,
  type FlowDayRule,
  type OperationalProfileConfig,
} from '@/lib/operationalProfile';
import type { Marketplace } from '@/types';
import OperationalFlowDayModal from './OperationalFlowDayModal';
import './operationalFlowTimeline.css';

type DetailView = number | 'week';

type Props = {
  profile: OperationalProfileConfig;
  onSelectDay?: (weekday: number) => void;
  selectedDay?: number | null;
};

const OperationalFlowTimeline: React.FC<Props> = ({ profile, onSelectDay, selectedDay }) => {
  const [detailView, setDetailView] = useState<DetailView | null>(null);
  const plans = useMemo(() => buildWeeklyFlowPlan(profile), [profile]);

  const openDay = (weekday: number) => {
    onSelectDay?.(weekday);
    setDetailView(weekday);
  };

  return (
    <>
      <section className="ls-op-flow-timeline" aria-label="Fluxo semanal de saídas">
        <div className="ls-op-flow-timeline__head">
          <div>
            <h3>Seu fluxo de saída</h3>
            <p>Cada dia processa vendas de dias específicos — clique no dia para ver o detalhe.</p>
          </div>
          <button
            type="button"
            className="ls-op-flow-timeline__week-btn"
            onClick={() => setDetailView('week')}
          >
            <CalendarRange size={16} />
            Ver semana
          </button>
        </div>

        <div className="ls-op-flow-timeline__grid">
          {plans.map((plan) => {
            const isActive = selectedDay != null ? selectedDay === plan.weekday : plan.isToday;
            const rule = profile.flowRules.find((r) => r.weekday === plan.weekday);
            const focusBits: string[] = [];
            if (rule?.storeIds?.length) focusBits.push(`${rule.storeIds.length} loja(s)`);
            if (rule?.productSkus?.length) focusBits.push(`${rule.productSkus.length} produto(s)`);
            else if (rule?.productFocus) focusBits.push(rule.productFocus.slice(0, 40));

            return (
              <button
                key={plan.weekday}
                type="button"
                className={`ls-op-flow-day${plan.isToday ? ' ls-op-flow-day--today' : ''}${isActive ? ' ls-op-flow-day--active' : ''}`}
                onClick={() => openDay(plan.weekday)}
                aria-label={`Ver fluxo de ${plan.weekdayLabel}`}
              >
                <span className="ls-op-flow-day__label">{plan.weekdayShort}</span>
                {plan.isToday ? <span className="ls-op-flow-day__badge">Hoje</span> : null}
                <span className="ls-op-flow-day__process">
                  {plan.processSaleDays.length
                    ? plan.processSaleDays.map((d) => d.slice(0, 3)).join(' · ')
                    : '—'}
                </span>
                <span className="ls-op-flow-day__cutoff">Saída {plan.dailyCutoff}</span>
                <span className="ls-op-flow-day__backlog">Pend. {plan.backlogCutoff}</span>
                {focusBits.length ? (
                  <span className="ls-op-flow-day__focus">{focusBits.join(' · ')}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <OperationalFlowDayModal
        open={detailView !== null}
        view={detailView}
        profile={profile}
        onClose={() => setDetailView(null)}
      />
    </>
  );
};

export default OperationalFlowTimeline;

type EditorProps = {
  profile: OperationalProfileConfig;
  onChange: (profile: OperationalProfileConfig) => void;
  onSave: () => void;
};

export function OperationalFlowEditor({ profile, onChange, onSave }: EditorProps) {
  const { stores } = useStores();
  const activeStores = useMemo(() => stores.filter((s) => s.is_active), [stores]);
  const activeProducts = useMemo(
    () => DEMO_PRODUCTS.filter((p) => p.status === 'active').slice(0, 24),
    [],
  );

  const updateRule = (weekday: number, patch: Partial<FlowDayRule>) => {
    onChange({
      ...profile,
      flowRules: profile.flowRules.map((rule) =>
        rule.weekday === weekday ? { ...rule, ...patch } : rule,
      ),
    });
  };

  const toggleSaleDay = (weekday: number, saleDay: number) => {
    const rule = profile.flowRules.find((r) => r.weekday === weekday);
    if (!rule) return;
    const set = new Set(rule.processSaleDays);
    if (set.has(saleDay)) set.delete(saleDay);
    else set.add(saleDay);
    updateRule(weekday, { processSaleDays: [...set].sort((a, b) => a - b) });
  };

  const toggleStore = (weekday: number, storeId: string) => {
    const rule = profile.flowRules.find((r) => r.weekday === weekday);
    if (!rule) return;
    const set = new Set(rule.storeIds ?? []);
    if (set.has(storeId)) set.delete(storeId);
    else set.add(storeId);
    updateRule(weekday, { storeIds: [...set] });
  };

  const setAllStores = (weekday: number) => {
    updateRule(weekday, { storeIds: [] });
  };

  const productNamesFromSkus = (skus: string[]) =>
    skus
      .map((sku) => activeProducts.find((p) => p.sku === sku)?.name ?? sku)
      .join(', ');

  const toggleProduct = (weekday: number, sku: string) => {
    const rule = profile.flowRules.find((r) => r.weekday === weekday);
    if (!rule) return;
    const set = new Set(rule.productSkus ?? []);
    if (set.has(sku)) set.delete(sku);
    else set.add(sku);
    const productSkus = [...set];
    updateRule(weekday, {
      productSkus,
      productFocus: productSkus.length ? productNamesFromSkus(productSkus) : rule.productFocus ?? '',
    });
  };

  const clearProducts = (weekday: number) => {
    updateRule(weekday, { productSkus: [], productFocus: '' });
  };

  return (
    <section className="ls-op-flow-editor">
      <div className="ls-op-flow-editor__head">
        <div>
          <h3>Personalizar fluxo</h3>
          <p>Defina vendas do dia, horários, lojas/empresas e produtos prioritários.</p>
        </div>
        <button type="button" className="ls-btn-primary" onClick={onSave}>
          Salvar fluxo
        </button>
      </div>

      <div className="ls-op-flow-editor__list">
        {profile.flowRules.map((rule) => {
          const allStores = !rule.storeIds?.length;
          const productQuery = (rule.productFocus ?? '').trim().toLowerCase();
          const filteredProducts = productQuery
            ? activeProducts.filter(
                (p) =>
                  p.name.toLowerCase().includes(productQuery) ||
                  p.sku.toLowerCase().includes(productQuery),
              )
            : activeProducts;

          return (
            <article key={rule.weekday} className="ls-op-flow-editor__row">
              <div className="ls-op-flow-editor__row-top">
                <div className="ls-op-flow-editor__day">{WEEKDAY_SHORT[rule.weekday]}</div>

                <div className="ls-op-flow-editor__sale-days">
                  {WEEKDAY_SHORT.map((label, saleDay) => (
                    <button
                      key={`${rule.weekday}-${saleDay}`}
                      type="button"
                      className={`ls-op-flow-editor__chip${rule.processSaleDays.includes(saleDay) ? ' ls-op-flow-editor__chip--on' : ''}`}
                      onClick={() => toggleSaleDay(rule.weekday, saleDay)}
                      title={saleDayLabel(saleDay)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <label className="ls-op-flow-editor__time">
                  <span>Saída</span>
                  <input
                    type="time"
                    className="ls-input"
                    value={rule.dailyCutoff}
                    onChange={(e) => updateRule(rule.weekday, { dailyCutoff: e.target.value })}
                  />
                </label>

                <label className="ls-op-flow-editor__time">
                  <span>Pend.</span>
                  <input
                    type="time"
                    className="ls-input"
                    value={rule.backlogCutoff}
                    onChange={(e) => updateRule(rule.weekday, { backlogCutoff: e.target.value })}
                  />
                </label>

                <label className="ls-op-flow-editor__time">
                  <span>Entrega</span>
                  <input
                    type="time"
                    className="ls-input"
                    value={rule.deliveryWindow ?? ''}
                    onChange={(e) => updateRule(rule.weekday, { deliveryWindow: e.target.value })}
                  />
                </label>
              </div>

              <div className="ls-op-flow-editor__targets">
                <div className="ls-op-flow-editor__target-block">
                  <span className="ls-op-flow-editor__target-label">Lojas / empresas</span>
                  <div className="ls-op-flow-editor__target-chips">
                    <button
                      type="button"
                      className={`ls-op-flow-editor__chip${allStores ? ' ls-op-flow-editor__chip--on' : ''}`}
                      onClick={() => setAllStores(rule.weekday)}
                    >
                      Todas
                    </button>
                    {activeStores.map((store) => (
                      <button
                        key={`${rule.weekday}-${store.id}`}
                        type="button"
                        className={`ls-op-flow-editor__chip ls-op-flow-editor__chip--store${
                          !allStores && rule.storeIds?.includes(store.id)
                            ? ' ls-op-flow-editor__chip--on'
                            : ''
                        }`}
                        onClick={() => toggleStore(rule.weekday, store.id)}
                        title={store.name}
                      >
                        <MarketplaceLogo marketplace={store.marketplace as Marketplace} size={14} />
                        {store.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ls-op-flow-editor__target-block">
                  <span className="ls-op-flow-editor__target-label">Produtos do dia</span>
                  <div className="ls-op-flow-editor__product-search">
                    <input
                      type="text"
                      className="ls-input"
                      placeholder="Buscar ou digitar — ex.: Fralda P, Mamadeira 300ml"
                      value={rule.productFocus ?? ''}
                      onChange={(e) => updateRule(rule.weekday, { productFocus: e.target.value })}
                    />
                    {(rule.productSkus?.length ?? 0) > 0 ? (
                      <button
                        type="button"
                        className="ls-op-flow-editor__clear"
                        onClick={() => clearProducts(rule.weekday)}
                      >
                        Limpar
                      </button>
                    ) : null}
                  </div>
                  <div className="ls-op-flow-editor__target-chips">
                    {filteredProducts.map((product) => (
                      <button
                        key={`${rule.weekday}-${product.sku}`}
                        type="button"
                        className={`ls-op-flow-editor__chip ls-op-flow-editor__chip--product${
                          rule.productSkus?.includes(product.sku ?? '') ? ' ls-op-flow-editor__chip--on' : ''
                        }`}
                        onClick={() => product.sku && toggleProduct(rule.weekday, product.sku)}
                        title={product.sku ?? undefined}
                      >
                        {product.name}
                      </button>
                    ))}
                  </div>
                  <p className="ls-op-flow-editor__target-hint">
                    Marque lojas específicas e/ou produtos. Vazio = vale para todas as lojas e todo o mix.
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
