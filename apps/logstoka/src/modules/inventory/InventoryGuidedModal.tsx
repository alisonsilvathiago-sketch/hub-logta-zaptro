import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Maximize2, Minimize2, Play, Printer } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useLogstokaBranding } from '@/context/LogstokaBrandingContext';
import type { DemoInventoryRow } from '@/lib/logstokaDemoSeed';
import { printGuidedOperationsGuide } from '@/lib/printGuidedOperationsGuide';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import GuidedInventoryPanel from './GuidedInventoryPanel';
import OperatorModeOverlay from '@/modules/operational/OperatorModeOverlay';
import '@/modules/operational/operationalWorkSheet.css';

type SheetMode = 'list' | 'guided';

type Props = {
  open: boolean;
  inventory: DemoInventoryRow | null;
  onClose: () => void;
  onConfirmCount: (item: DemoInventoryRow['ls_inventory_items'][number], quantity: number) => void | Promise<void>;
};

const InventoryGuidedModal: React.FC<Props> = ({ open, inventory, onClose, onConfirmCount }) => {
  const { branding } = useLogstokaBranding();
  const [mode, setMode] = useState<SheetMode>('list');
  const [operatorMode, setOperatorMode] = useState(false);

  const items = inventory?.ls_inventory_items ?? [];
  const pendingCount = items.filter((i) => i.counted_quantity == null).length;

  useEffect(() => {
    if (!open) return;
    setMode('list');
    setOperatorMode(false);
  }, [open, inventory?.id]);

  const handleClose = () => {
    setMode('list');
    setOperatorMode(false);
    onClose();
  };

  const handlePrintGuide = () => {
    try {
      printGuidedOperationsGuide({ companyName: branding.companyName ?? 'LogStoka WMS', logoUrl: branding.logoUrl });
    } catch {
      /* popup blocked */
    }
  };

  if (!inventory) return null;

  const footer =
    mode === 'list' ? (
      <div className="ls-op-work-modal__footer-row">
        <div className="ls-op-work-modal__footer-group">
          <button type="button" className="ls-btn-secondary text-sm" onClick={handleClose}>
            Fechar
          </button>
          <button type="button" className="ls-btn-secondary inline-flex items-center gap-2 text-sm" onClick={handlePrintGuide}>
            <Printer size={16} />
            Guia
          </button>
        </div>
        <button
          type="button"
          className="ls-btn-primary inline-flex items-center gap-2 text-sm"
          onClick={() => setMode('guided')}
          disabled={items.length === 0}
        >
          <Play size={16} />
          Iniciar contagem guiada
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
          <Link to={LOGSTOKA_ROUTES.CONFERENCE_PENDING} className="ls-btn-secondary text-sm" onClick={handleClose}>
            Pendências
          </Link>
        </div>
      </div>
    );

  const guidedPanel = (
    <GuidedInventoryPanel
      inventoryId={inventory.id}
      items={items}
      operatorMode={operatorMode}
      operatorFocus={operatorMode}
      onConfirmCount={onConfirmCount}
    />
  );

  return (
    <>
      <Modal
        open={open && !operatorMode}
        size="wide"
        paddingVariant="balanced"
        panelClassName="ls-op-work-modal"
        title="Contagem guiada · Inventário"
        subtitle={`${inventory.warehouse_name} · ${items.length} SKU(s)${pendingCount ? ` · ${pendingCount} pendente(s)` : ''}`}
        icon={<Boxes size={22} />}
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
            Contagem guiada
          </button>
        </div>

        {mode === 'list' ? (
          <div className="ls-op-work-modal__list">
            <div className="ls-op-work-modal__doc-bar">
              <div>
                <p className="ls-op-work-modal__doc-kicker">Lista de contagem física</p>
                <p className="ls-op-work-modal__doc-meta">
                  {branding.companyName ?? 'LogStoka WMS'} · {inventory.inventory_type} · {inventory.status}
                </p>
              </div>
              <div className="ls-op-work-modal__doc-stats">
                <div>
                  <span>SKUs</span>
                  <strong>{items.length}</strong>
                </div>
                <div>
                  <span>Pendentes</span>
                  <strong>{pendingCount}</strong>
                </div>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="ls-op-sheet__empty">Nenhum item neste inventário.</div>
            ) : (
              <div className="ls-op-work-modal__scroll">
                <table className="ls-op-sheet__table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>SKU / Produto</th>
                      <th>Sistema</th>
                      <th>Contado</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="ls-op-sheet__num">{index + 1}</td>
                        <td className="ls-op-sheet__product">
                          <strong>{item.ls_products?.sku}</strong>
                          <span>{item.ls_products?.name}</span>
                        </td>
                        <td className="ls-op-sheet__qty">{item.system_quantity}</td>
                        <td>{item.counted_quantity ?? '—'}</td>
                        <td>
                          <span className="ls-op-sheet__stage">
                            {item.counted_quantity == null ? 'Pendente' : Number(item.difference) !== 0 ? 'Divergência' : 'OK'}
                          </span>
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
        title={inventory.warehouse_name}
        stepLabel={`Inventário · contagem guiada`}
        onClose={() => setOperatorMode(false)}
      >
        {guidedPanel}
      </OperatorModeOverlay>
    </>
  );
};

export default InventoryGuidedModal;
