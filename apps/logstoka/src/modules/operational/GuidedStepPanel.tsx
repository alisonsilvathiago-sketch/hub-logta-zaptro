import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowUpFromLine, Check, CheckCircle2, MapPin, Package, XCircle } from 'lucide-react';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import {
  DIVERGENCE_REASON_LABELS,
  type DivergenceReason,
} from '@/lib/conferenceDivergences';
import type { GuidedOperationItem } from '@/lib/guidedOperationItem';

type Props = {
  items: GuidedOperationItem[];
  operatorMode?: boolean;
  operatorFocus?: boolean;
  pendingHref: string;
  doneTitle?: string;
  footnote?: string;
  onComplete?: () => void;
  onDivergence: (item: GuidedOperationItem, reason: DivergenceReason) => void;
  onConfirm?: (item: GuidedOperationItem) => void | Promise<void>;
  fetchHint?: (item: GuidedOperationItem) => Promise<string | null>;
  /** Após conferência operacional — saída direta sem ir à tela de movimentações */
  quickExit?: {
    enabled?: boolean;
    autoRegisterOnComplete?: boolean;
    operatorLabel?: string;
    onRegisterExits: (confirmedItems: GuidedOperationItem[]) => Promise<void>;
  };
};

const GuidedStepPanel: React.FC<Props> = ({
  items,
  operatorMode = false,
  operatorFocus = false,
  pendingHref,
  doneTitle = 'Lista concluída',
  footnote = 'Vá ao estoque, conte e confira. Só avance após interagir.',
  onComplete,
  onDivergence,
  onConfirm,
  fetchHint,
  quickExit,
}) => {
  const [index, setIndex] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [showReasons, setShowReasons] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmedItems, setConfirmedItems] = useState<GuidedOperationItem[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitBusy, setExitBusy] = useState(false);
  const autoExitStartedRef = React.useRef(false);

  const current = items[index];
  const progress = items.length ? Math.round(((index + (done ? 1 : 0)) / items.length) * 100) : 100;

  useEffect(() => {
    setIndex(0);
    setDone(false);
    setShowReasons(false);
    setHint(null);
    setConfirmedItems([]);
    setShowExitConfirm(false);
    autoExitStartedRef.current = false;
  }, [items]);

  useEffect(() => {
    if (!current || !fetchHint) return;
    let cancelled = false;
    setHint(null);
    void fetchHint(current).then((text) => {
      if (!cancelled && text) setHint(text);
    });
    return () => {
      cancelled = true;
    };
  }, [current?.id, fetchHint]);

  const advance = useCallback(() => {
    if (index >= items.length - 1) {
      setDone(true);
      toast.success('Conferência concluída');
      onComplete?.();
      return;
    }
    setShowReasons(false);
    setHint(null);
    setIndex((i) => i + 1);
  }, [index, items.length, onComplete]);

  const confirm = useCallback(async () => {
    if (!current || busy) return;
    setBusy(true);
    try {
      await onConfirm?.(current);
      setConfirmedItems((prev) => [...prev, current]);
      advance();
    } finally {
      setBusy(false);
    }
  }, [advance, busy, current, onConfirm]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !showReasons && current && !done && !busy) {
        e.preventDefault();
        void confirm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, confirm, current, done, showReasons]);

  const registerDivergence = (reason: DivergenceReason) => {
    if (!current) return;
    onDivergence(current, reason);
    toast.error('Divergência registrada — item enviado para pendências');
    setShowReasons(false);
    advance();
  };

  const runQuickExit = useCallback(async () => {
    if (!quickExit || exitBusy || confirmedItems.length === 0) return;
    setExitBusy(true);
    try {
      await quickExit.onRegisterExits(confirmedItems);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível registrar a saída');
    } finally {
      setExitBusy(false);
      setShowExitConfirm(false);
    }
  }, [confirmedItems, exitBusy, quickExit]);

  useEffect(() => {
    if (!done || !quickExit?.autoRegisterOnComplete || confirmedItems.length === 0) return;
    if (autoExitStartedRef.current) return;
    autoExitStartedRef.current = true;
    void runQuickExit();
  }, [confirmedItems.length, done, quickExit?.autoRegisterOnComplete, runQuickExit]);

  if (!items.length) {
    return <div className="ls-op-guided__empty">Nenhum item nesta fila.</div>;
  }

  if (done) {
    const exitEnabled = quickExit?.enabled !== false && quickExit && confirmedItems.length > 0;
    const totalUnits = confirmedItems.reduce((sum, item) => sum + item.quantity, 0);
    const autoRegister = quickExit?.autoRegisterOnComplete === true;

    if (autoRegister && exitBusy) {
      return (
        <div className="ls-op-guided__done">
          <CheckCircle2 size={40} className="text-green-600" />
          <p className="text-lg font-black text-gray-900">Atualizando estoque…</p>
          <p className="text-sm text-gray-500">
            {confirmedItems.length} item(ns) conferido(s) · baixa automática em andamento
          </p>
        </div>
      );
    }

    if (autoRegister && exitEnabled && !exitBusy) {
      return (
        <div className="ls-op-guided__done">
          <CheckCircle2 size={40} className="text-green-600" />
          <p className="text-lg font-black text-gray-900">{doneTitle}</p>
          <p className="text-sm text-gray-500">Estoque atualizado com sucesso.</p>
        </div>
      );
    }

    return (
      <div className="ls-op-guided__done">
        <CheckCircle2 size={40} className="text-green-600" />
        <p className="text-lg font-black text-gray-900">{doneTitle}</p>
        <p className="text-sm text-gray-500">
          {confirmedItems.length} item(ns) conferido(s)
          {confirmedItems.length !== items.length
            ? ` · ${items.length - confirmedItems.length} com divergência`
            : ''}
        </p>

        {showExitConfirm && exitEnabled ? (
          <div className="ls-op-guided__exit-confirm">
            <p className="ls-op-guided__exit-confirm-title">Confirmar saída de material</p>
            <p className="ls-op-guided__exit-confirm-text">
              Tem certeza que deseja dar saída em{' '}
              <strong>
                {confirmedItems.length} produto(s) · {totalUnits.toLocaleString('pt-BR')} un.
              </strong>{' '}
              que {quickExit.operatorLabel ? `${quickExit.operatorLabel} conferiu` : 'você conferiu'}?
              Os itens seguem para expedição / caminhão.
            </p>
            <ul className="ls-op-guided__exit-confirm-list">
              {confirmedItems.map((item) => (
                <li key={item.id}>
                  {item.productName} · {item.quantityLabel} · {item.subtitle}
                </li>
              ))}
            </ul>
            <div className="ls-op-guided__exit-confirm-actions">
              <button type="button" className="ls-btn-secondary text-sm" disabled={exitBusy} onClick={() => setShowExitConfirm(false)}>
                Não, voltar
              </button>
              <button type="button" className="ls-btn-primary text-sm inline-flex items-center gap-2" disabled={exitBusy} onClick={() => void runQuickExit()}>
                <ArrowUpFromLine size={16} />
                {exitBusy ? 'Registrando…' : 'Sim, dar saída'}
              </button>
            </div>
          </div>
        ) : (
          <div className="ls-op-guided__done-actions">
            {exitEnabled ? (
              <button type="button" className="ls-btn-primary inline-flex items-center gap-2 text-sm" onClick={() => setShowExitConfirm(true)}>
                <ArrowUpFromLine size={16} />
                Dar saída agora
              </button>
            ) : null}
            <Link to="/app/movements?tab=exit" className="ls-btn-secondary text-sm">
              Ver saídas
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (!current) return null;

  const rootClass = [
    'ls-op-guided',
    operatorMode ? ' ls-op-guided--operator' : '',
    operatorFocus ? ' ls-op-guided--focus' : '',
  ].join('');

  return (
    <div className={rootClass}>
      {!operatorFocus ? (
        <>
          <div className="ls-op-guided__progress" aria-hidden>
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="ls-op-guided__step">
            Item {index + 1} de {items.length}
          </p>
        </>
      ) : null}

      <div className="ls-op-guided__card">
        <div className="ls-op-guided__product">
          <Package size={operatorFocus ? 28 : 22} className="text-orange-600" aria-hidden />
          <div>
            <h4>{current.productName}</h4>
            <p>{current.subtitle}</p>
          </div>
          {current.marketplace ? (
            <MarketplaceLogo marketplace={current.marketplace} size={operatorFocus ? 32 : 28} />
          ) : null}
        </div>

        <dl className="ls-op-guided__facts">
          <div>
            <dt>{current.context === 'inventory' ? 'Contagem' : 'Quantidade'}</dt>
            <dd>{current.quantityLabel}</dd>
          </div>
          <div>
            <dt>Localização</dt>
            <dd>
              <MapPin size={14} aria-hidden />
              {current.locationLabel}
            </dd>
          </div>
        </dl>

        <p className="ls-op-guided__voice">{current.voiceText}</p>
        {hint ? <p className="ls-op-guided__hint">{hint}</p> : null}
      </div>

      {showReasons ? (
        <div className="ls-op-guided__reasons">
          <p className="text-xs font-bold uppercase text-gray-500">Motivo da divergência</p>
          <div className="ls-op-guided__reason-grid">
            {(Object.keys(DIVERGENCE_REASON_LABELS) as DivergenceReason[]).map((reason) => (
              <button
                key={reason}
                type="button"
                className="ls-op-guided__reason-btn"
                onClick={() => registerDivergence(reason)}
              >
                {DIVERGENCE_REASON_LABELS[reason]}
              </button>
            ))}
          </div>
          <button type="button" className="text-xs font-bold text-gray-500" onClick={() => setShowReasons(false)}>
            Voltar
          </button>
        </div>
      ) : (
        <div className="ls-op-guided__actions">
          <button
            type="button"
            className="ls-op-guided__btn ls-op-guided__btn--ok"
            onClick={() => void confirm()}
            disabled={busy}
          >
            <span className="ls-op-guided__btn-main">
              <Check size={18} strokeWidth={2.5} aria-hidden />
              Conferido
            </span>
            <kbd className="ls-op-guided__btn-kbd">Enter</kbd>
          </button>
          <button
            type="button"
            className="ls-op-guided__btn ls-op-guided__btn--bad"
            onClick={() => setShowReasons(true)}
            disabled={busy}
          >
            <span className="ls-op-guided__btn-main">
              <XCircle size={18} strokeWidth={2.5} aria-hidden />
              Divergência
            </span>
          </button>
        </div>
      )}

      {!operatorFocus ? (
        <p className="ls-op-guided__foot">
          {footnote}{' '}
          <Link to={pendingHref} className="font-bold text-orange-700 hover:underline">
            Pendências
          </Link>
        </p>
      ) : null}
    </div>
  );
};

export default GuidedStepPanel;
