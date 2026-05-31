import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useLogstokaXRay } from './LogstokaXRayContext';
import {
  runXRayAuditAsync,
  resolveDiagnosticItem,
  clearXRaySession,
  type XRayDiagnosticItem,
  type XRayAuditResult,
} from './xrayAuditor';
import { LOGSTOKA_AI_BRAND } from '../constants';
import {
  getXRayContextDefaultUrl,
  getXRayContextTitle,
  getXRayScanPhrases,
  XRAY_SCAN_PHRASE_MS,
  XRAY_SCAN_TOTAL_MS,
} from './xrayPageContext';
import './xrayScanner.css';

function scoreTone(score: number): 'good' | 'warn' | 'bad' {
  if (score >= 95) return 'good';
  if (score >= 80) return 'warn';
  return 'bad';
}

function scoreLabel(score: number): string {
  if (score >= 95) return 'Excelente · sem gargalos';
  if (score >= 80) return 'Bom · requer ajustes';
  return 'Crítico · risco operacional';
}

function itemTargetUrl(item: XRayDiagnosticItem, contextDefaultUrl: string): string | undefined {
  if (item.status === 'ok') return undefined;
  return item.targetUrl ?? contextDefaultUrl;
}

const LogstokaXRayDrawer: React.FC = () => {
  const { isOpen, activeContext, closeXRay, onResolve } = useLogstokaXRay();
  const { companyId } = useLogstokaTenant();
  const navigate = useNavigate();

  const phrases = useMemo(() => getXRayScanPhrases(activeContext), [activeContext]);
  const contextDefaultUrl = useMemo(() => getXRayContextDefaultUrl(activeContext), [activeContext]);

  const [scanning, setScanning] = useState(true);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [auditData, setAuditData] = useState<XRayAuditResult | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;

    clearXRaySession();
    setScanning(true);
    setPhraseIndex(0);
    setIgnoredIds(new Set());
    setAuditData(null);

    const phraseTimer = window.setInterval(() => {
      setPhraseIndex((prev) => Math.min(prev + 1, phrases.length - 1));
    }, XRAY_SCAN_PHRASE_MS);

    const finishTimer = window.setTimeout(() => {
      void runXRayAuditAsync(activeContext, companyId).then((data) => {
        setAuditData(data);
        window.setTimeout(() => setScanning(false), 320);
      });
    }, XRAY_SCAN_TOTAL_MS);

    return () => {
      window.clearInterval(phraseTimer);
      window.clearTimeout(finishTimer);
    };
  }, [isOpen, activeContext, phrases, companyId]);

  if (!isOpen) return null;

  const handleResolve = async (item: XRayDiagnosticItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (resolvingId) return;
    setResolvingId(item.id);

    try {
      const success = await resolveDiagnosticItem(item.id);
      if (success) {
        toast.success(`Correção aplicada: "${item.title}"`);
        const data = await runXRayAuditAsync(activeContext, companyId);
        setAuditData(data);
        onResolve();
      }
    } catch {
      toast.error('Não foi possível completar a correção automatizada.');
    } finally {
      setResolvingId(null);
    }
  };

  const handleIgnore = (itemId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIgnoredIds((prev) => new Set(prev).add(itemId));
    toast.success('Ocorrência ocultada temporariamente.');
  };

  const handleView = (item: XRayDiagnosticItem) => {
    const url = itemTargetUrl(item, contextDefaultUrl);
    if (!url) return;
    navigate(url);
    closeXRay();
  };

  const visibleItems = auditData?.items.filter((item) => !ignoredIds.has(item.id)) ?? [];
  const issueItems = visibleItems.filter((item) => item.status !== 'ok');
  const okItems = visibleItems.filter((item) => item.status === 'ok');
  const issueCountLabel = issueItems.length;
  const tone = auditData ? scoreTone(auditData.score) : 'warn';
  const pageTitle = getXRayContextTitle(activeContext);

  return createPortal(
    <div className="ls-xray-root" role="dialog" aria-modal="true" aria-label={`Raio-X · ${pageTitle}`}>
      {scanning ? (
        <div className="ls-xray-scan" aria-live="polite">
          <div className="ls-xray-scan__grid" aria-hidden />
          <div className="ls-xray-scan__beam" aria-hidden />
          <div className="ls-xray-scan__beam-glow" aria-hidden />
          <div className="ls-xray-scan__phrase-wrap">
            <p key={`${activeContext}-${phraseIndex}`} className="ls-xray-scan__phrase">
              {phrases[phraseIndex]}
            </p>
          </div>
        </div>
      ) : (
        <div className="ls-xray-results-backdrop" onClick={closeXRay}>
          <div className="ls-xray-results" onClick={(e) => e.stopPropagation()}>
            <header className="ls-xray-results__header">
              <div>
                <p className="ls-xray-results__eyebrow">Raio-X · diagnóstico</p>
                <h2 className="ls-xray-results__title">{pageTitle}</h2>
              </div>
              <button type="button" className="ls-xray-results__close" onClick={closeXRay} aria-label="Fechar">
                <X size={16} />
              </button>
            </header>

            <div className="ls-xray-results__layout">
              <aside className="ls-xray-results__aside">
                {auditData ? (
                  <>
                    <div className="ls-xray-results__score">
                      <div className={`ls-xray-results__score-ring ls-xray-results__score-ring--${tone}`}>
                        {auditData.score}%
                      </div>
                      <div>
                        <p className="ls-xray-results__score-label">Saúde da seção</p>
                        <p className="ls-xray-results__score-title">{scoreLabel(auditData.score)}</p>
                      </div>
                    </div>
                    <p className="ls-xray-results__summary">{auditData.summary}</p>
                  </>
                ) : null}
              </aside>

              <div className="ls-xray-results__main">
                <section className="ls-xray-results__section">
                  <p className="ls-xray-results__section-label ls-xray-results__section-label--issues">
                    Precisa arrumar{issueCountLabel > 0 ? ` (${issueCountLabel})` : ''}
                  </p>

                  {issueItems.length === 0 ? (
                    <div className="ls-xray-results__empty">
                      <div className="ls-xray-results__empty-icon">
                        <CheckCircle2 size={18} />
                      </div>
                      <p className="ls-xray-results__empty-title">Nada pendente</p>
                      <p className="ls-xray-results__empty-text">
                        Nenhum erro ou falha com evidência nesta página.
                      </p>
                    </div>
                  ) : (
                    <div className="ls-xray-results__cards">
                      {issueItems.map((item) => {
                        const url = itemTargetUrl(item, contextDefaultUrl);
                        return (
                          <div
                            key={item.id}
                            role={url ? 'button' : undefined}
                            tabIndex={url ? 0 : undefined}
                            className={`ls-xray-results__item ls-xray-results__item--clickable ${
                              item.status === 'error' ? 'ls-xray-results__item--error' : 'ls-xray-results__item--warning'
                            }`}
                            onClick={() => handleView(item)}
                            onKeyDown={(e) => {
                              if (url && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                handleView(item);
                              }
                            }}
                          >
                            <div className="ls-xray-results__item-head">
                              <h3 className="ls-xray-results__item-title">{item.title}</h3>
                              <span
                                className={`ls-xray-results__item-badge ${
                                  item.priority === 'high'
                                    ? 'ls-xray-results__item-badge--high'
                                    : 'ls-xray-results__item-badge--mid'
                                }`}
                              >
                                {item.status === 'error' ? 'Erro' : 'Atenção'}
                              </span>
                            </div>
                            <p className="ls-xray-results__item-message">{item.message}</p>
                            <span className="ls-xray-results__item-cta">
                              Ir corrigir
                              <ArrowRight size={12} />
                            </span>

                            <div className="ls-xray-results__item-actions">
                              <button
                                type="button"
                                className="ls-xray-results__action ls-xray-results__action--ghost"
                                onClick={(e) => handleIgnore(item.id, e)}
                              >
                                Ignorar
                              </button>
                              {item.canResolve ? (
                                <button
                                  type="button"
                                  disabled={resolvingId !== null}
                                  className="ls-xray-results__action ls-xray-results__action--primary"
                                  onClick={(e) => void handleResolve(item, e)}
                                >
                                  {resolvingId === item.id ? (
                                    <>
                                      <Loader2 size={10} className="inline animate-spin mr-1" />
                                      Ajustando…
                                    </>
                                  ) : (
                                    'Auto-ajuste'
                                  )}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {okItems.length > 0 ? (
                  <section className="ls-xray-results__section">
                    <p className="ls-xray-results__section-label ls-xray-results__section-label--ok">Está correto</p>
                    <div className="ls-xray-results__ok-list">
                      {okItems.map((item) => (
                        <div key={item.id} className="ls-xray-results__item ls-xray-results__item--ok-card">
                          <div className="ls-xray-results__item-head">
                            <h3 className="ls-xray-results__item-title">{item.title}</h3>
                            <span className="ls-xray-results__item-badge ls-xray-results__item-badge--ok">OK</span>
                          </div>
                          <p className="ls-xray-results__item-message">{item.message}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </div>

            <footer className="ls-xray-results__footer">
              <p className="ls-xray-results__footer-note">Auditoria {LOGSTOKA_AI_BRAND} · LogStoka WMS</p>
              <button type="button" className="ls-xray-results__footer-btn" onClick={closeXRay}>
                Fechar
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
};

export default LogstokaXRayDrawer;
