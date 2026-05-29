import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import type { PublishFlowError } from '@/lib/publishProductFlow';
import './publishOverlay.css';

export type PublishOverlayPhase = 'loading' | 'success' | 'error';

type PublishOverlayProps = {
  phase: PublishOverlayPhase;
  error?: PublishFlowError | null;
  onComplete: () => void;
};

const SUCCESS_VISIBLE_MS = 1800;

const PublishOverlay: React.FC<PublishOverlayProps> = ({ phase, error, onComplete }) => {
  const navigate = useNavigate();
  const [exiting, setExiting] = useState(false);
  const [loadingText, setLoadingText] = useState('Aguarde, publicando…');

  useEffect(() => {
    if (phase !== 'loading') return;
    setLoadingText('Aguarde, publicando…');
    const steps = ['Aguarde…', 'Aguarde, publicando…', 'Publicando…'];
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % steps.length;
      setLoadingText(steps[i]);
    }, 900);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'success') return;
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onComplete, 450);
    }, SUCCESS_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  const dismiss = () => {
    setExiting(true);
    setTimeout(onComplete, 450);
  };

  const goFix = () => {
    if (!error) return;
    setExiting(true);
    setTimeout(() => {
      navigate(error.fixPath);
      onComplete();
    }, 300);
  };

  return createPortal(
    <div
      className={`ls-publish-overlay${exiting ? ' ls-publish-overlay--out' : ''}`}
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
    >
      <div className="ls-publish-overlay__content">
        {phase === 'loading' && (
          <p className="ls-publish-overlay__text">{loadingText}</p>
        )}

        {phase === 'success' && (
          <>
            <p className="ls-publish-overlay__text ls-publish-overlay__text--success ls-publish-overlay__text--static">
              Publicado com sucesso
            </p>
            <p className="ls-publish-overlay__sub">Seus produtos já estão nas lojas selecionadas</p>
          </>
        )}

        {phase === 'error' && error && (
          <>
            <div className="ls-publish-overlay__icon-error">
              <AlertTriangle size={28} />
            </div>
            <p className="ls-publish-overlay__error-title">{error.title}</p>
            <p className="ls-publish-overlay__error-msg">{error.message}</p>
            <div className="ls-publish-overlay__actions">
              <button type="button" className="ls-publish-overlay__btn-fix" onClick={goFix}>
                {error.fixLabel}
              </button>
              <button type="button" className="ls-publish-overlay__btn-dismiss" onClick={dismiss}>
                Voltar
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default PublishOverlay;
