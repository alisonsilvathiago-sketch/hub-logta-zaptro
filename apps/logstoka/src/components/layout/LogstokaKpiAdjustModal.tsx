import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Pencil, XCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import './logstokaKpiAdjust.css';

type Props = {
  open: boolean;
  title: string;
  label: string;
  currentValue: string | number;
  subtitle?: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (value: number, status: 'correct' | 'wrong') => void;
};

const SYNC_PHRASES_OK = [
  'Atualizando conferência…',
  'Sincronizando estoque WMS…',
  'Conferência atualizada no sistema',
];

const SYNC_PHRASES_DIVERGENT = [
  'Registrando divergência…',
  'Sincronizando estoque WMS…',
  'Atualização concluída no sistema',
];

const SYNC_DURATION_MS = 4200;
const PHRASE_INTERVAL_MS = 1100;

function parseQuantity(value: string | number): number {
  const n = Number(String(value).replace(/\D/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

const LogstokaKpiAdjustModal: React.FC<Props> = ({
  open,
  title,
  label,
  currentValue,
  subtitle,
  saving = false,
  onClose,
  onSave,
}) => {
  const systemQuantity = useMemo(() => parseQuantity(currentValue), [currentValue]);

  const [quantity, setQuantity] = useState(systemQuantity);
  const [editUnlocked, setEditUnlocked] = useState(false);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncPhraseIndex, setSyncPhraseIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completedStatus, setCompletedStatus] = useState<'correct' | 'wrong'>('correct');
  const [completedValue, setCompletedValue] = useState(systemQuantity);
  const pendingSaveRef = useRef<{ value: number; status: 'correct' | 'wrong' } | null>(null);

  const resetState = useCallback(() => {
    setQuantity(systemQuantity);
    setEditUnlocked(false);
    setEditConfirmOpen(false);
    setSyncing(false);
    setSyncPhraseIndex(0);
    setCompleted(false);
    setCompletedStatus('correct');
    setCompletedValue(systemQuantity);
  }, [systemQuantity]);

  useEffect(() => {
    if (!open) return;
    resetState();
  }, [open, systemQuantity, resetState]);

  useEffect(() => {
    if (!syncing) return;

    setSyncPhraseIndex(0);
    const phraseTimer = window.setInterval(() => {
      setSyncPhraseIndex((prev) => prev + 1);
    }, PHRASE_INTERVAL_MS);

    const finishTimer = window.setTimeout(() => {
      if (pendingSaveRef.current) {
        onSave(pendingSaveRef.current.value, pendingSaveRef.current.status);
        pendingSaveRef.current = null;
      }
      setSyncing(false);
      setCompleted(true);
    }, SYNC_DURATION_MS);

    return () => {
      window.clearInterval(phraseTimer);
      window.clearTimeout(finishTimer);
    };
  }, [syncing, onSave]);

  const syncPhrases = completedStatus === 'wrong' ? SYNC_PHRASES_DIVERGENT : SYNC_PHRASES_OK;
  const activePhrase = syncPhrases[Math.min(syncPhraseIndex, syncPhrases.length - 1)];

  const runSave = (value: number, status: 'correct' | 'wrong') => {
    setCompletedValue(value);
    setCompletedStatus(status);
    pendingSaveRef.current = { value, status };
    setSyncing(true);
  };

  const handleClose = () => {
    if (syncing) return;
    resetState();
    onClose();
  };

  const handleConfirmEdit = () => {
    setEditUnlocked(true);
    setEditConfirmOpen(false);
  };

  const handleCancelEdit = () => {
    setEditUnlocked(false);
    setEditConfirmOpen(false);
    setQuantity(systemQuantity);
  };

  return (
    <>
      <Modal
        open={open}
        title={title}
        subtitle={
          completed
            ? 'Operação concluída com sucesso'
            : subtitle ?? 'Confira a quantidade do sistema antes de registrar'
        }
        icon={<Pencil size={20} strokeWidth={2.25} />}
        onClose={handleClose}
        footer={
          completed ? (
            <div className="flex justify-end">
              <button type="button" className="ls-btn-primary" onClick={handleClose}>
                Fechar
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="ls-btn-secondary" onClick={handleClose} disabled={saving || syncing}>
                Cancelar
              </button>
              <button
                type="button"
                className="ls-btn-secondary inline-flex items-center gap-1.5"
                disabled={saving || syncing}
                onClick={() => runSave(quantity, 'wrong')}
              >
                <XCircle size={16} />
                Divergente
              </button>
              <button
                type="button"
                className="ls-btn-primary inline-flex items-center gap-1.5"
                disabled={saving || syncing || quantity < 1}
                onClick={() => runSave(quantity, 'correct')}
              >
                <CheckCircle2 size={16} />
                {saving ? 'Salvando…' : 'Confirmar conferência'}
              </button>
            </div>
          )
        }
      >
        {completed ? (
          <div className="ls-kpi-adjust__success">
            <div className="ls-kpi-adjust__success-icon">
              <CheckCircle2 size={24} />
            </div>
            <p className="ls-kpi-adjust__success-title">
              {completedStatus === 'correct' ? 'Conferência confirmada' : 'Divergência registrada'}
            </p>
            <p className="ls-kpi-adjust__success-text">
              {label}: <strong>{completedValue}</strong> un. · Estoque WMS atualizado com sucesso.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="ls-kpi-adjust__context">
              {label}: quantidade no sistema <strong>{systemQuantity}</strong>
            </p>

            {!editUnlocked ? (
              <div className="ls-kpi-adjust__field">
                <span className="ls-label">Quantidade conferida</span>
                <div className="ls-kpi-adjust__locked-box">
                  <span className="ls-kpi-adjust__locked-value">{quantity}</span>
                  <span className="ls-kpi-adjust__locked-badge">Bloqueado</span>
                </div>

                {!editConfirmOpen ? (
                  <button
                    type="button"
                    className="ls-btn-secondary ls-kpi-adjust__edit-trigger"
                    onClick={() => setEditConfirmOpen(true)}
                  >
                    Alterar quantidade
                  </button>
                ) : (
                  <div className="ls-kpi-adjust__confirm-edit">
                    <p>
                      Tem certeza que deseja alterar a quantidade conferida? Isso impacta o estoque WMS e não pode ser
                      desfeito sem nova conferência.
                    </p>
                    <div className="ls-kpi-adjust__confirm-actions">
                      <button type="button" className="ls-btn-secondary" onClick={() => setEditConfirmOpen(false)}>
                        Não
                      </button>
                      <button type="button" className="ls-btn-primary" onClick={handleConfirmEdit}>
                        Sim, quero alterar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label className="ls-kpi-adjust__field">
                <span className="ls-label">Nova quantidade conferida</span>
                <input
                  type="number"
                  min={1}
                  className="ls-input mt-1 w-full"
                  value={quantity}
                  autoFocus
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                />
                <button type="button" className="ls-kpi-adjust__cancel-edit" onClick={handleCancelEdit}>
                  Cancelar alteração e voltar ao valor bloqueado
                </button>
              </label>
            )}
          </div>
        )}
      </Modal>

      {open && syncing
        ? createPortal(
            <div className="ls-kpi-adjust-sync" aria-live="polite" aria-label="Sincronizando conferência">
              <div className="ls-kpi-adjust-sync__grid" aria-hidden />
              <div className="ls-kpi-adjust-sync__beam" aria-hidden />
              <p key={`${completedStatus}-${syncPhraseIndex}`} className="ls-kpi-adjust-sync__phrase">
                {activePhrase}
              </p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default LogstokaKpiAdjustModal;
