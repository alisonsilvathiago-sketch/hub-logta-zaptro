import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Package, Pencil, User, XCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ProductThumb from '@/components/products/ProductThumb';
import { getDemoProductBySku } from '@/lib/logstokaDemoSeed';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import '@/components/layout/logstokaKpiAdjust.css';
import './inventoryItemConference.css';

export type InventoryConferenceItem = {
  itemId: string;
  sku: string;
  productName: string;
  productId?: string;
  warehouseName: string;
  inventoryId: string;
  systemQuantity: number;
  countedQuantity: number | null;
  lastActorName?: string | null;
  lastCountedAt?: string | null;
};

type Props = {
  open: boolean;
  item: InventoryConferenceItem | null;
  actorName: string;
  recentAudit?: Array<{ time: string; actorName: string; description: string; result?: string }>;
  saving?: boolean;
  onClose: () => void;
  onSave: (value: number, status: 'correct' | 'wrong', justification?: string) => void;
};

const SYNC_PHRASES_OK = [
  'Registrando contagem física…',
  'Sincronizando inventário WMS…',
  'Estoque atualizado no sistema',
];

const SYNC_PHRASES_DIVERGENT = [
  'Registrando divergência…',
  'Gravando responsável e justificativa…',
  'Trilha de auditoria salva',
];

const SYNC_DURATION_MS = 4200;
const PHRASE_INTERVAL_MS = 1100;

function formatWhen(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const InventoryItemConferenceModal: React.FC<Props> = ({
  open,
  item,
  actorName,
  recentAudit = [],
  saving = false,
  onClose,
  onSave,
}) => {
  const systemQuantity = item?.systemQuantity ?? 0;
  const initialCounted = item?.countedQuantity ?? systemQuantity;

  const [quantity, setQuantity] = useState(initialCounted);
  const [editUnlocked, setEditUnlocked] = useState(false);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [showJustification, setShowJustification] = useState(false);
  const [justification, setJustification] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncPhraseIndex, setSyncPhraseIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completedStatus, setCompletedStatus] = useState<'correct' | 'wrong'>('correct');
  const [completedValue, setCompletedValue] = useState(initialCounted);
  const pendingSaveRef = useRef<{ value: number; status: 'correct' | 'wrong'; justification?: string } | null>(null);

  const product = useMemo(() => (item ? getDemoProductBySku(item.sku) : null), [item]);
  const productHref = product?.id ? `/app/products/${product.id}` : `/app/products?search=${encodeURIComponent(item?.sku ?? '')}`;
  const previewDiff = quantity - systemQuantity;
  const matchesSystem = previewDiff === 0;

  const resetState = useCallback(() => {
    setQuantity(initialCounted);
    setEditUnlocked(false);
    setEditConfirmOpen(false);
    setShowJustification(false);
    setJustification('');
    setSyncing(false);
    setSyncPhraseIndex(0);
    setCompleted(false);
    setCompletedStatus('correct');
    setCompletedValue(initialCounted);
  }, [initialCounted]);

  useEffect(() => {
    if (!open) return;
    resetState();
  }, [open, item?.itemId, initialCounted, resetState]);

  useEffect(() => {
    if (!syncing) return;
    setSyncPhraseIndex(0);
    const phraseTimer = window.setInterval(() => setSyncPhraseIndex((prev) => prev + 1), PHRASE_INTERVAL_MS);
    const finishTimer = window.setTimeout(() => {
      if (pendingSaveRef.current) {
        onSave(
          pendingSaveRef.current.value,
          pendingSaveRef.current.status,
          pendingSaveRef.current.justification,
        );
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

  const runSave = (value: number, status: 'correct' | 'wrong', note?: string) => {
    setCompletedValue(value);
    setCompletedStatus(status);
    pendingSaveRef.current = { value, status, justification: note?.trim() || undefined };
    setSyncing(true);
  };

  const handleClose = () => {
    if (syncing) return;
    resetState();
    onClose();
  };

  const handleConfirm = () => {
    runSave(quantity, matchesSystem ? 'correct' : 'wrong');
  };

  const handleDivergence = () => {
    if (!showJustification) {
      setShowJustification(true);
      return;
    }
    if (justification.trim().length < 8) return;
    runSave(quantity, 'wrong', justification);
  };

  if (!item) return null;

  return (
    <>
      <Modal
        open={open}
        title="Conferir inventário"
        subtitle={
          completed
            ? 'Contagem registrada na trilha de auditoria'
            : `${item.warehouseName} · informe a quantidade física contada`
        }
        icon={<Package size={20} strokeWidth={2.25} />}
        onClose={handleClose}
        footer={
          completed ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Link to={LOGSTOKA_ROUTES.ACTIVITY_CENTER} className="ls-btn-secondary text-sm">
                Ver na Central de Atividades
              </Link>
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
                onClick={handleDivergence}
              >
                <XCircle size={16} />
                {showJustification ? 'Confirmar divergência' : 'Registrar divergência'}
              </button>
              <button
                type="button"
                className="ls-btn-primary inline-flex items-center gap-1.5"
                disabled={saving || syncing || quantity < 0 || (showJustification && justification.trim().length < 8)}
                onClick={handleConfirm}
              >
                <CheckCircle2 size={16} />
                {matchesSystem ? 'Confirmar · bateu certinho' : 'Confirmar contagem'}
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
              {completedStatus === 'correct' && completedValue === systemQuantity
                ? 'Inventário correto · bateu certinho'
                : completedStatus === 'correct'
                  ? 'Contagem registrada'
                  : 'Divergência registrada'}
            </p>
            <p className="ls-kpi-adjust__success-text">
              {item.productName} · contado <strong>{completedValue}</strong> un. · sistema{' '}
              <strong>{systemQuantity}</strong> un.
              {completedValue !== systemQuantity ? (
                <>
                  {' '}
                  · diferença <strong>{completedValue - systemQuantity > 0 ? '+' : ''}{completedValue - systemQuantity}</strong>
                </>
              ) : null}
              <br />
              Responsável: <strong>{actorName}</strong> · registrado na Central de Atividades.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="ls-inv-conference__product">
              <ProductThumb src={product?.main_image_url} name={item.productName} size={52} />
              <div className="ls-inv-conference__product-main">
                <p className="ls-inv-conference__sku">{item.sku}</p>
                <p className="ls-inv-conference__name">{item.productName}</p>
                <p className="ls-inv-conference__meta">
                  Depósito · {item.warehouseName}
                  {product?.brand ? ` · ${product.brand}` : ''}
                </p>
                <Link to={productHref} className="ls-inv-conference__product-link">
                  Abrir ficha do produto
                  <ExternalLink size={12} aria-hidden />
                </Link>
              </div>
            </div>

            <div className="ls-inv-conference__grid">
              <div className="ls-inv-conference__metric">
                <span className="ls-inv-conference__metric-label">Sistema WMS</span>
                <span className="ls-inv-conference__metric-value">{systemQuantity}</span>
              </div>
              <div className={`ls-inv-conference__metric${matchesSystem ? ' ls-inv-conference__metric--ok' : previewDiff !== 0 ? ' ls-inv-conference__metric--warn' : ''}`}>
                <span className="ls-inv-conference__metric-label">Contagem física</span>
                <span className="ls-inv-conference__metric-value">{quantity}</span>
              </div>
              <div className={`ls-inv-conference__metric${previewDiff === 0 ? ' ls-inv-conference__metric--ok' : ' ls-inv-conference__metric--warn'}`}>
                <span className="ls-inv-conference__metric-label">Diferença</span>
                <span className="ls-inv-conference__metric-value">
                  {previewDiff === 0 ? '0' : `${previewDiff > 0 ? '+' : ''}${previewDiff}`}
                </span>
              </div>
            </div>

            <p className="ls-inv-conference__actor">
              <User size={14} className="inline mr-1 -mt-0.5" aria-hidden />
              Conferindo como <strong>{actorName}</strong>
              {item.lastActorName ? (
                <>
                  {' '}
                  · última conferência por <strong>{item.lastActorName}</strong> em {formatWhen(item.lastCountedAt)}
                </>
              ) : null}
            </p>

            {!editUnlocked ? (
              <div className="ls-kpi-adjust__field">
                <span className="ls-label">Quantidade contada agora</span>
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
                    <Pencil size={14} className="inline mr-1" aria-hidden />
                    Alterar quantidade contada
                  </button>
                ) : (
                  <div className="ls-kpi-adjust__confirm-edit">
                    <p>
                      Tem certeza que deseja alterar a quantidade contada? A alteração fica registrada com seu nome na
                      trilha de auditoria e na Central de Atividades.
                    </p>
                    <div className="ls-kpi-adjust__confirm-actions">
                      <button type="button" className="ls-btn-secondary" onClick={() => setEditConfirmOpen(false)}>
                        Não
                      </button>
                      <button type="button" className="ls-btn-primary" onClick={() => { setEditUnlocked(true); setEditConfirmOpen(false); }}>
                        Sim, quero alterar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label className="ls-kpi-adjust__field">
                <span className="ls-label">Nova quantidade contada</span>
                <input
                  type="number"
                  min={0}
                  className="ls-input mt-1 w-full"
                  value={quantity}
                  autoFocus
                  onChange={(e) => setQuantity(Math.max(0, Number(e.target.value) || 0))}
                />
                <button
                  type="button"
                  className="ls-kpi-adjust__cancel-edit"
                  onClick={() => {
                    setEditUnlocked(false);
                    setQuantity(initialCounted);
                  }}
                >
                  Cancelar alteração
                </button>
              </label>
            )}

            {showJustification ? (
              <label className="ls-inv-conference__justification">
                <span className="ls-label">Justificativa da divergência (obrigatória)</span>
                <textarea
                  className="ls-input min-h-[80px] resize-y"
                  placeholder="Ex.: contagem física 124 un. — caixas extras no corredor B identificadas pelo colaborador."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                />
                <span className="text-xs text-[#828282]">Mínimo 8 caracteres · fica no histórico para cobrança e revisão.</span>
              </label>
            ) : null}

            {recentAudit.length > 0 ? (
              <div className="ls-inv-conference__history">
                <p className="ls-inv-conference__history-title">Últimos registros deste SKU</p>
                <div className="ls-inv-conference__history-list">
                  {recentAudit.slice(0, 4).map((row) => (
                    <p key={`${row.time}-${row.description}`} className="ls-inv-conference__history-item">
                      <strong>{row.actorName}</strong> · {formatWhen(row.time)} · {row.description}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      {open && syncing
        ? createPortal(
            <div className="ls-kpi-adjust-sync" aria-live="polite" aria-label="Sincronizando inventário">
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

export default InventoryItemConferenceModal;
