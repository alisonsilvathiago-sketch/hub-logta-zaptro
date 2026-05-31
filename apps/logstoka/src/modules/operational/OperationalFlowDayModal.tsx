import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock3, Package, Store } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { useStores } from '@/hooks/useCatalog';
import { buildFlowDayDetail, flowSyncModeLabel } from '@/lib/flowDayDetail';
import { logstokaApi } from '@/lib/logstokaApi';
import {
  buildWeeklyFlowPlan,
  type OperationalProfileConfig,
} from '@/lib/operationalProfile';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import type { Marketplace } from '@/types';

type ViewMode = number | 'week';

type Props = {
  open: boolean;
  view: ViewMode | null;
  profile: OperationalProfileConfig;
  onClose: () => void;
};

const OperationalFlowDayModal: React.FC<Props> = ({ open, view, profile, onClose }) => {
  const { stores } = useStores();
  const [aiHint, setAiHint] = useState<string | null>(null);

  const plans = useMemo(() => buildWeeklyFlowPlan(profile), [profile]);

  const dayDetail = useMemo(() => {
    if (view === null || view === 'week') return null;
    const rule = profile.flowRules.find((r) => r.weekday === view);
    const plan = plans.find((p) => p.weekday === view);
    if (!rule || !plan) return null;
    return buildFlowDayDetail(rule, plan, stores);
  }, [plans, profile.flowRules, stores, view]);

  const weekRows = useMemo(
    () =>
      profile.flowRules.map((rule) => {
        const plan = plans.find((p) => p.weekday === rule.weekday)!;
        return buildFlowDayDetail(rule, plan, stores);
      }),
    [plans, profile.flowRules, stores],
  );

  useEffect(() => {
    if (!open || view === null || view === 'week' || !dayDetail) {
      setAiHint(null);
      return;
    }
    let cancelled = false;
    setAiHint(null);
    void logstokaApi
      .aiChat({
        screen: 'operational_flow_day',
        message: [
          'Responda em 2 frases curtas em português, tom operacional.',
          `Dia ${dayDetail.weekdayLabel}: processar vendas de ${dayDetail.processSaleDays.join(', ')}.`,
          `Saída ${dayDetail.dailyCutoff}, pendências ${dayDetail.backlogCutoff}.`,
          `Lojas: ${dayDetail.allStores ? 'todas' : dayDetail.storeLabels.join(', ')}.`,
          `Produtos: ${dayDetail.allProducts ? 'mix geral' : dayDetail.productLabels.join(', ')}.`,
          'Dê uma dica prática para o estoquista neste dia.',
        ].join(' '),
      })
      .then((res) => {
        if (!cancelled && res.reply?.trim()) setAiHint(res.reply.trim().slice(0, 280));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open, view, dayDetail]);

  const isWeek = view === 'week';
  const title = isWeek ? 'Fluxo da semana' : dayDetail ? `Fluxo · ${dayDetail.weekdayLabel}` : 'Fluxo do dia';
  const subtitle = flowSyncModeLabel(profile.flowSyncMode ?? (profile.useCustomFlow ? 'manual' : 'manual'));

  return (
    <Modal
      open={open && view !== null}
      size="wide"
      paddingVariant="balanced"
      panelClassName="ls-op-flow-detail-modal"
      title={title}
      subtitle={subtitle}
      icon={<CalendarDays size={22} />}
      onClose={onClose}
      footer={
        <div className="ls-op-flow-detail-modal__footer">
          <button type="button" className="ls-btn-secondary text-sm" onClick={onClose}>
            Fechar
          </button>
          <Link to={LOGSTOKA_ROUTES.OPERATIONAL_FLOW} className="ls-btn-primary text-sm" onClick={onClose}>
            Editar fluxo
          </Link>
        </div>
      }
    >
      {isWeek ? (
        <div className="ls-op-flow-detail-modal__week">
          <p className="ls-op-flow-detail-modal__intro">
            Resumo do que você configurou para cada dia. Com API conectada (Bling, canais), o fluxo pode
            atualizar automaticamente conforme vendas e prazos — ou use só o modo manual abaixo.
          </p>
          <div className="ls-op-flow-detail-modal__week-grid">
            {weekRows.map((row) => (
              <article
                key={row.weekday}
                className={`ls-op-flow-detail-modal__week-card${row.isToday ? ' ls-op-flow-detail-modal__week-card--today' : ''}`}
              >
                <h4>{row.weekdayLabel}</h4>
                <p>
                  Vendas: <strong>{row.processSaleDays.join(' + ') || '—'}</strong>
                </p>
                <p>
                  Saída {row.dailyCutoff} · Pend. {row.backlogCutoff}
                </p>
                <p className="ls-op-flow-detail-modal__muted">
                  {row.allStores ? 'Todas as lojas' : row.storeLabels.join(' · ')}
                </p>
                <p className="ls-op-flow-detail-modal__muted">
                  {row.allProducts ? 'Todo o mix' : row.productLabels.join(' · ')}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : dayDetail ? (
        <div className="ls-op-flow-detail-modal__day">
          {dayDetail.isToday ? (
            <span className="ls-op-flow-detail-modal__badge">Dia de hoje</span>
          ) : null}

          <dl className="ls-op-flow-detail-modal__facts">
            <div>
              <dt>
                <Clock3 size={14} aria-hidden /> Processar vendas de
              </dt>
              <dd>{dayDetail.processSaleDays.join(' + ') || '—'}</dd>
            </div>
            <div>
              <dt>Saída até</dt>
              <dd>{dayDetail.dailyCutoff}</dd>
            </div>
            <div>
              <dt>Pendências até</dt>
              <dd>{dayDetail.backlogCutoff}</dd>
            </div>
            {dayDetail.deliveryWindow ? (
              <div>
                <dt>Entrega / coleta</dt>
                <dd>{dayDetail.deliveryWindow}</dd>
              </div>
            ) : null}
          </dl>

          <div className="ls-op-flow-detail-modal__block">
            <h4>
              <Store size={16} aria-hidden /> Lojas / empresas
            </h4>
            {dayDetail.allStores ? (
              <p>Todas as lojas ativas</p>
            ) : (
              <ul className="ls-op-flow-detail-modal__list">
                {dayDetail.storeLabels.map((name) => {
                  const store = stores.find((s) => s.name === name);
                  return (
                    <li key={name}>
                      {store ? (
                        <MarketplaceLogo marketplace={store.marketplace as Marketplace} size={16} />
                      ) : null}
                      {name}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="ls-op-flow-detail-modal__block">
            <h4>
              <Package size={16} aria-hidden /> Produtos do dia
            </h4>
            {dayDetail.allProducts ? (
              <p>Mix geral — sem filtro de SKU</p>
            ) : (
              <ul className="ls-op-flow-detail-modal__list">
                {dayDetail.productLabels.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            )}
          </div>

          {dayDetail.note ? (
            <p className="ls-op-flow-detail-modal__note">
              <strong>Observação:</strong> {dayDetail.note}
            </p>
          ) : null}

          {aiHint ? <p className="ls-op-flow-detail-modal__ai">{aiHint}</p> : null}

          <p className="ls-op-flow-detail-modal__api-note">
            Modo atual: <strong>{flowSyncModeLabel(profile.flowSyncMode ?? 'manual')}</strong>.
            Integrações via API ajustam filas e prazos automaticamente; o editor manual continua disponível
            para operações sem API.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Dia não encontrado no fluxo.</p>
      )}
    </Modal>
  );
};

export default OperationalFlowDayModal;
