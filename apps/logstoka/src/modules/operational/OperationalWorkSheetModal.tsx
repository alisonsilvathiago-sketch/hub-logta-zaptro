import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Maximize2, Minimize2, Play, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaBranding } from '@/context/LogstokaBrandingContext';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { recordPrintListActivity } from '@/lib/activityRecording';
import {
  filterOperationalOrders,
  OPERATIONAL_LIST_META,
  operationalStageLabel,
  type OperationalOrder,
  type OrderListFilter,
} from '@/lib/operationalFlow';
import type { DayFlowPlan } from '@/lib/operationalProfile';
import { printOperationalWorkSheet } from '@/lib/printOperationalWorkSheet';
import GuidedConferencePanel from './GuidedConferencePanel';
import OperatorModeOverlay from './OperatorModeOverlay';
import './operationalWorkSheet.css';

type SheetMode = 'list' | 'guided';

type Props = {
  open: boolean;
  filter: OrderListFilter | null;
  orders: OperationalOrder[];
  todayPlan: DayFlowPlan;
  onClose: () => void;
};

const OperationalWorkSheetModal: React.FC<Props> = ({ open, filter, orders, todayPlan, onClose }) => {
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const { branding } = useLogstokaBranding();
  const actorName = profile?.full_name?.trim() || 'Operador';
  const [mode, setMode] = useState<SheetMode>('list');
  const [operatorMode, setOperatorMode] = useState(false);

  const meta = filter ? OPERATIONAL_LIST_META[filter] : null;
  const sheetOrders = useMemo(() => {
    if (!filter) return [];
    return filterOperationalOrders(orders, todayPlan, filter);
  }, [filter, orders, todayPlan]);

  const totalUnits = sheetOrders.reduce((sum, order) => sum + order.quantity, 0);

  useEffect(() => {
    if (!open) return;
    setMode('list');
    setOperatorMode(false);
  }, [open, filter]);

  const handlePrint = () => {
    if (!filter) return;
    if (sheetOrders.length === 0) {
      toast.error('Nenhum pedido nesta fila para imprimir');
      return;
    }
    try {
      printOperationalWorkSheet(filter, sheetOrders, todayPlan, {
        companyName: branding.companyName ?? 'LogStoka WMS',
        companyAddress: branding.companyAddress ?? undefined,
        companyContact: branding.companyContact ?? undefined,
        logoUrl: branding.logoUrl,
        operatorName: actorName,
      });
      recordPrintListActivity(
        { companyId, actorName },
        meta!.title,
        sheetOrders.length,
        totalUnits,
      );
      toast.success('Lista aberta em nova aba — clique em Imprimir documento');
    } catch {
      toast.error('Permita pop-ups para abrir a lista de conferência');
    }
  };

  const handleClose = () => {
    setMode('list');
    setOperatorMode(false);
    onClose();
  };

  if (!filter || !meta) return null;

  const guidedPanel = (
    <GuidedConferencePanel
      orders={sheetOrders}
      operatorMode={operatorMode}
      operatorFocus={operatorMode}
      onQuickExitComplete={handleClose}
    />
  );

  const footer =
    mode === 'list' ? (
      <div className="ls-op-work-modal__footer-row">
        <div className="ls-op-work-modal__footer-group">
          <button type="button" className="ls-btn-secondary text-sm" onClick={handleClose}>
            Fechar
          </button>
          <button
            type="button"
            className="ls-btn-secondary inline-flex items-center gap-2 text-sm"
            onClick={handlePrint}
          >
            <Printer size={16} />
            Imprimir
          </button>
        </div>
        <button
          type="button"
          className="ls-btn-primary inline-flex items-center gap-2 text-sm"
          onClick={() => setMode('guided')}
          disabled={sheetOrders.length === 0}
        >
          <Play size={16} />
          Iniciar conferência
        </button>
      </div>
    ) : (
      <div className="ls-op-work-modal__footer-row">
        <div className="ls-op-work-modal__footer-group">
          <button type="button" className="ls-btn-secondary text-sm" onClick={handleClose}>
            Fechar
          </button>
          <button type="button" className="ls-btn-secondary text-sm" onClick={() => setMode('list')}>
            Ver lista
          </button>
        </div>
        <div className="ls-op-work-modal__footer-group">
          <button
            type="button"
            className="ls-btn-secondary inline-flex items-center gap-2 text-sm"
            onClick={() => setOperatorMode((v) => !v)}
          >
            {operatorMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {operatorMode ? 'Modo normal' : 'Modo operador'}
          </button>
          <Link to={meta.primaryActionPath} className="ls-btn-secondary text-sm" onClick={handleClose}>
            {meta.primaryActionLabel}
          </Link>
        </div>
      </div>
    );

  return (
    <>
      <Modal
        open={open && !operatorMode}
        size="wide"
        paddingVariant="balanced"
        panelClassName="ls-op-work-modal"
        title={meta.title}
        subtitle={`${sheetOrders.length} pedido(s) · ${totalUnits.toLocaleString('pt-BR')} unidade(s)`}
        icon={<ClipboardList size={22} />}
        onClose={handleClose}
        footer={footer}
      >
      <div className="ls-op-work-modal__tabs">
        <button
          type="button"
          className={`ls-op-work-modal__tab${mode === 'list' ? ' ls-op-work-modal__tab--active' : ''}`}
          onClick={() => setMode('list')}
        >
          Lista
        </button>
        <button
          type="button"
          className={`ls-op-work-modal__tab${mode === 'guided' ? ' ls-op-work-modal__tab--active' : ''}`}
          onClick={() => setMode('guided')}
        >
          Conferência guiada
        </button>
      </div>

      {mode === 'list' ? (
        <div className="ls-op-work-modal__list">
          <div className="ls-op-work-modal__doc-bar">
            <div>
              <p className="ls-op-work-modal__doc-kicker">{meta.docTitle}</p>
              <p className="ls-op-work-modal__doc-meta">
                {branding.companyName ?? 'LogStoka WMS'} · {todayPlan.weekdayLabel} · saída{' '}
                {todayPlan.dailyCutoff}
              </p>
            </div>
            <div className="ls-op-work-modal__doc-stats">
              <div>
                <span>Pedidos</span>
                <strong>{sheetOrders.length}</strong>
              </div>
              <div>
                <span>Unidades</span>
                <strong>{totalUnits.toLocaleString('pt-BR')}</strong>
              </div>
            </div>
          </div>

          {sheetOrders.length === 0 ? (
            <div className="ls-op-sheet__empty">Nada nesta fila.</div>
          ) : (
            <div className="ls-op-work-modal__scroll">
              <table className="ls-op-sheet__table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Pedido / Produto</th>
                    <th>Qtd</th>
                    <th>Canal</th>
                    <th>Expedir</th>
                    <th>Etapa</th>
                  </tr>
                </thead>
                <tbody>
                  {sheetOrders.map((order, index) => (
                    <tr key={order.id} className={order.isLate ? 'ls-op-sheet__row--late' : undefined}>
                      <td className="ls-op-sheet__num">{index + 1}</td>
                      <td className="ls-op-sheet__product">
                        <strong>{order.orderRef}</strong>
                        <span>{order.productName}</span>
                      </td>
                      <td className="ls-op-sheet__qty">{order.quantity}</td>
                      <td className="ls-op-sheet__channel">
                        <MarketplaceLogo marketplace={order.marketplace} size={20} />
                      </td>
                      <td className={order.isLate ? 'ls-op-sheet__due--late' : 'ls-op-sheet__due'}>
                        {order.dueDayLabel}
                      </td>
                      <td>
                        <span className="ls-op-sheet__stage">{operationalStageLabel(order.stage)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        ) : (
          guidedPanel
        )}
      </Modal>

      <OperatorModeOverlay
        open={open && operatorMode && mode === 'guided'}
        title={meta.title}
        stepLabel={`${sheetOrders.length} pedido(s) · conferência guiada`}
        onClose={() => setOperatorMode(false)}
      >
        {guidedPanel}
      </OperatorModeOverlay>
    </>
  );
};

export default OperationalWorkSheetModal;
