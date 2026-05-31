import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, X } from 'lucide-react';
import { LOGSTOKA_AI_BRAND } from '@/modules/ai/constants';
import type { ImportValidationResult } from '@/lib/importSpreadsheetValidator';
import { IMPORT_VERIFY_PHRASES } from '@/lib/importSpreadsheetValidator';
import '@/modules/ai/auditor/xrayScanner.css';

const PHRASE_MS = 2200;
const SCAN_MS = 4800;

type Props = {
  open: boolean;
  fileName: string;
  onClose: () => void;
  onApply?: (result: ImportValidationResult) => void;
  validate: () => Promise<ImportValidationResult>;
};

function scoreTone(score: number): 'good' | 'warn' | 'bad' {
  if (score >= 90) return 'good';
  if (score >= 60) return 'warn';
  return 'bad';
}

const ImportVerifyOverlay: React.FC<Props> = ({ open, fileName, onClose, onApply, validate }) => {
  const [phase, setPhase] = useState<'scan' | 'results'>('scan');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [result, setResult] = useState<ImportValidationResult | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPhase('scan');
    setPhraseIndex(0);
    setResult(null);
    setApplying(false);

    const phraseTimer = window.setInterval(() => {
      setPhraseIndex((i) => (i + 1) % IMPORT_VERIFY_PHRASES.length);
    }, PHRASE_MS);

    let cancelled = false;
    const validationPromise = validate();

    const scanTimer = window.setTimeout(() => {
      void validationPromise.then((data) => {
        if (cancelled) return;
        setResult(data);
        setPhase('results');
      });
    }, SCAN_MS);

    return () => {
      cancelled = true;
      window.clearInterval(phraseTimer);
      window.clearTimeout(scanTimer);
    };
  }, [open, validate]);

  if (!open) return null;

  const tone = result ? scoreTone(result.score) : 'warn';
  const columnErrors = result?.column_issues.filter((i) => i.severity === 'error') ?? [];
  const lineErrors = result?.line_issues.filter((i) => i.severity === 'error') ?? [];
  const warnings = result?.line_issues.filter((i) => i.severity === 'warning') ?? [];

  const handleApply = async () => {
    if (!result || !onApply) return;
    setApplying(true);
    try {
      onApply(result);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="ls-xray-root" role="dialog" aria-modal="true" aria-label="Verificação de importação">
      {phase === 'scan' ? (
        <div className="ls-xray-scan" aria-live="polite">
          <div className="ls-xray-scan__grid" aria-hidden />
          <div className="ls-xray-scan__beam" aria-hidden />
          <div className="ls-xray-scan__beam-glow" aria-hidden />
          <div className="ls-xray-scan__phrase-wrap">
            <p key={phraseIndex} className="ls-xray-scan__phrase">
              {IMPORT_VERIFY_PHRASES[phraseIndex]}
            </p>
            <p className="mt-3 text-xs font-semibold text-white/50">{fileName}</p>
          </div>
        </div>
      ) : result ? (
        <div className="ls-xray-results-backdrop" onClick={onClose}>
          <div className="ls-xray-results" onClick={(e) => e.stopPropagation()}>
            <header className="ls-xray-results__header">
              <div>
                <p className="ls-xray-results__eyebrow">Importação · verificação</p>
                <h2 className="ls-xray-results__title">{fileName}</h2>
              </div>
              <button type="button" className="ls-xray-results__close" onClick={onClose} aria-label="Fechar">
                <X size={20} />
              </button>
            </header>

            <div className="ls-xray-results__layout">
              <aside className="ls-xray-results__aside">
                <div className="ls-xray-results__aside-hero">
                  <div className="ls-xray-results__score-hero" aria-hidden>
                    <span className="ls-xray-results__score-value">{result.score}%</span>
                  </div>
                  <p className="ls-xray-results__score-label">Documento compatível</p>
                  <p className={`ls-xray-results__status-pill ls-xray-results__status-pill--${tone}`}>
                    {result.valid ? 'Pronta para aplicar' : 'Precisa corrigir'}
                  </p>
                </div>
                <dl className="ls-xray-results__stats">
                  <div className="ls-xray-results__stat ls-xray-results__stat--ok">
                    <dt>Linhas OK</dt>
                    <dd>{result.rows_ok}</dd>
                  </div>
                  <div className="ls-xray-results__stat ls-xray-results__stat--error">
                    <dt>Erros coluna</dt>
                    <dd>{columnErrors.length}</dd>
                  </div>
                  <div className="ls-xray-results__stat ls-xray-results__stat--warn">
                    <dt>Alertas</dt>
                    <dd>{warnings.length}</dd>
                  </div>
                </dl>
                <div className="ls-xray-results__insight">
                  <p className="ls-xray-results__insight-brand">{LOGSTOKA_AI_BRAND}</p>
                  <p className="ls-xray-results__insight-text">{result.summary}</p>
                </div>
              </aside>

              <div className="ls-xray-results__main">
                {columnErrors.length > 0 ? (
                  <section className="ls-xray-results__section">
                    <p className="ls-xray-results__section-label ls-xray-results__section-label--issues">
                      Colunas a corrigir
                    </p>
                    <div className="ls-xray-results__cards">
                      {columnErrors.map((issue) => (
                        <div key={`${issue.column_index}-${issue.message}`} className="ls-xray-results__item ls-xray-results__item--error">
                          <div className="ls-xray-results__item-head">
                            <h3 className="ls-xray-results__item-title">
                              Coluna {issue.column_index > 0 ? issue.column_index : '—'} · {issue.column_header}
                            </h3>
                            <span className="ls-xray-results__item-badge ls-xray-results__item-badge--high">Erro</span>
                          </div>
                          <p className="ls-xray-results__item-message">{issue.message}</p>
                          <p className="ls-xray-results__item-message text-[#737373]">
                            Esperado: <strong>{issue.expected}</strong>
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {lineErrors.length > 0 ? (
                  <section className="ls-xray-results__section">
                    <p className="ls-xray-results__section-label ls-xray-results__section-label--issues">
                      Linhas com erro
                    </p>
                    <div className="ls-xray-results__cards">
                      {lineErrors.slice(0, 8).map((issue) => (
                        <div key={`${issue.row_index}-${issue.message}`} className="ls-xray-results__item ls-xray-results__item--warning">
                          <p className="ls-xray-results__item-message">{issue.message}</p>
                        </div>
                      ))}
                      {lineErrors.length > 8 ? (
                        <p className="text-xs font-semibold text-[#737373]">+ {lineErrors.length - 8} erro(s) adicionais</p>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                {result.valid || warnings.length > 0 ? (
                  <section className="ls-xray-results__section">
                    <p className="ls-xray-results__section-label ls-xray-results__section-label--ok">
                      {result.valid ? 'Tudo certo' : 'Parcialmente válido'}
                    </p>
                    <div className="ls-xray-results__ok-list">
                      <div className="ls-xray-results__item ls-xray-results__item--ok-card">
                        <div className="ls-xray-results__item-head">
                          <h3 className="ls-xray-results__item-title">
                            <FileSpreadsheet size={14} className="mr-1 inline" />
                            {result.rows_ok} linha(s) mapeadas
                          </h3>
                          <span className="ls-xray-results__item-badge ls-xray-results__item-badge--ok">OK</span>
                        </div>
                        <p className="ls-xray-results__item-message">
                          Saídas serão geradas por SKU, quantidade, marketplace e loja.
                        </p>
                      </div>
                    </div>
                  </section>
                ) : null}

                {!result.valid && columnErrors.length === 0 && lineErrors.length === 0 ? (
                  <div className="ls-xray-results__empty">
                    <AlertTriangle size={24} className="text-amber-500" />
                    <p className="ls-xray-results__empty-title">Nenhuma linha de dados</p>
                    <p className="ls-xray-results__empty-text">Adicione linhas abaixo do cabeçalho no modelo oficial.</p>
                  </div>
                ) : null}
              </div>
            </div>

            <footer className="ls-xray-results__footer">
              <p className="ls-xray-results__footer-note">
                {result.valid
                  ? 'Ao aplicar, o sistema atualiza saídas e estoque conforme a planilha.'
                  : 'Corrija as colunas indicadas, baixe o modelo oficial ou edite no Google Sheets.'}
              </p>
              <button type="button" className="ls-xray-results__footer-btn" onClick={onClose}>
                Fechar
              </button>
              {result.valid && onApply ? (
                <button
                  type="button"
                  className="ls-xray-results__footer-btn ls-xray-results__footer-btn--primary"
                  disabled={applying}
                  onClick={() => void handleApply()}
                >
                  <CheckCircle2 size={16} className="mr-1 inline" />
                  {applying ? 'Aplicando…' : 'Aplicar no sistema'}
                </button>
              ) : null}
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ImportVerifyOverlay;
