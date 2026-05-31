import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { clearPickingLinesAfterConference, type PickingLine, pickingLinesToOperationalOrders } from '@/lib/pickingSession';
import GuidedConferencePanel from '@/modules/operational/GuidedConferencePanel';
import OperatorModeOverlay from '@/modules/operational/OperatorModeOverlay';
import '@/modules/operational/operationalWorkSheet.css';

type Props = {
  open: boolean;
  lines: PickingLine[];
  onClose: () => void;
  onChanged: () => void;
};

const PickingDailyConferenceModal: React.FC<Props> = ({ open, lines, onClose, onChanged }) => {
  const { companyId } = useLogstokaTenant();
  const { profile } = useAuth();
  const actorName = profile?.full_name?.trim() || 'Operador';
  const [operatorMode, setOperatorMode] = useState(false);

  const conferenceLines = lines;
  const orders = useMemo(() => pickingLinesToOperationalOrders(conferenceLines), [conferenceLines]);
  const totalUnits = conferenceLines.reduce((sum, line) => sum + line.quantity, 0);

  useEffect(() => {
    if (!open) setOperatorMode(false);
  }, [open]);

  const handleClose = () => {
    setOperatorMode(false);
    onClose();
  };

  const handleExitsRegistered = () => {
    if (!companyId) return;
    clearPickingLinesAfterConference(
      companyId,
      conferenceLines.map((line) => line.key),
    );
    onChanged();
    handleClose();
  };

  const guidedPanel = (
    <GuidedConferencePanel
      orders={orders}
      operatorMode={operatorMode}
      operatorFocus={operatorMode}
      autoRegisterExitsOnComplete
      navigateAfterExit={false}
      onQuickExitComplete={handleExitsRegistered}
      onComplete={() => {
        if (conferenceLines.length === 0) return;
        toast.success('Baixa concluída — itens removidos da fila e estoque atualizado');
      }}
    />
  );

  const footer = (
    <div className="ls-op-work-modal__footer-row">
      <div className="ls-op-work-modal__footer-group">
        <button type="button" className="ls-btn-secondary text-sm" onClick={handleClose}>
          Fechar
        </button>
      </div>
      <div className="ls-op-work-modal__footer-group">
        <button
          type="button"
          className="ls-btn-secondary inline-flex items-center gap-2 text-sm"
          onClick={() => setOperatorMode((v) => !v)}
          disabled={conferenceLines.length === 0}
        >
          {operatorMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          {operatorMode ? 'Modo normal' : 'Modo operador'}
        </button>
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
        title="Conferência do dia"
        subtitle={
          conferenceLines.length
            ? `${conferenceLines.length} item(ns) · ${totalUnits.toLocaleString('pt-BR')} un. · baixa automática no estoque · ${actorName}`
            : 'Selecione itens na fila antes de conferir'
        }
        icon={<ClipboardCheck size={22} />}
        onClose={handleClose}
        footer={footer}
      >
        {conferenceLines.length === 0 ? (
          <div className="ls-op-sheet__empty">
            Nenhum item separado aguardando conferência. Marque os produtos como separados na lista do dia.
          </div>
        ) : (
          guidedPanel
        )}
      </Modal>

      <OperatorModeOverlay
        open={open && operatorMode && conferenceLines.length > 0}
        title="Conferência diária"
        stepLabel={`${conferenceLines.length} item(ns) · ${totalUnits.toLocaleString('pt-BR')} un.`}
        onClose={() => setOperatorMode(false)}
      >
        {guidedPanel}
      </OperatorModeOverlay>
    </>
  );
};

export default PickingDailyConferenceModal;
