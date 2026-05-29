import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Download, MessageSquareText, ShieldAlert, ThumbsDown, ThumbsUp } from 'lucide-react';
import {
  QUOTE_STATUS_LABEL,
  applyPublicQuoteDecision,
  applyPublicQuoteObservation,
  findQuoteByToken,
  markQuoteVisualizado,
  quoteMonetaryValue,
  quoteProductLabel,
} from '../constants/zaptroQuotes';

function formatBrl(n: number) {
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  } catch {
    return `R$ ${String(n)}`;
  }
}

const ZaptroQuotePublic: React.FC = () => {
  const { token = '' } = useParams();
  const [obs, setObs] = useState('');
  const [justSubmittedObs, setJustSubmittedObs] = useState(false);
  const [deciding, setDeciding] = useState<'aprovar' | 'recusar' | null>(null);

  const found = useMemo(() => (token ? findQuoteByToken(token) : null), [token]);
  const quote = found?.quote || null;
  const localCompanyLogo = useMemo(() => {
    try {
      return localStorage.getItem('zaptro_company_logo_url')?.trim() || null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    try {
      markQuoteVisualizado(token);
    } catch {
      /* ignore */
    }
  }, [token]);

  const accent = quote?.issuerPdfBranded && quote?.issuerPrimaryColor ? quote.issuerPrimaryColor : '#2f2f7a';
  const issuerName = quote?.issuerCompanyName?.trim() || 'Zaptro';
  const clientName = quote?.clientNameSnapshot?.trim() || 'Cliente';
  const total = quote ? quoteMonetaryValue(quote) : 0;
  const statusLabel = quote ? QUOTE_STATUS_LABEL[quote.status] : '—';
  const primary = '#0f172a';
  const createdLabel = new Date(quote.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const buyerLabel = clientName;
  const zaptroLabel = 'Zaptro';

  if (!token || !quote) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: 24, boxSizing: 'border-box' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              aria-hidden
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.28)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#b91c1c',
              }}
            >
              <ShieldAlert size={20} />
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: primary }}>Link inválido</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(100,116,139,1)' }}>
                Este orçamento não foi encontrado (token inválido ou expirado).
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zaptro-public-quote">
      <style>{`
        .zaptro-public-quote{
          min-height: 100vh;
          background: #ffffff;
          padding: 24px 18px 110px;
          box-sizing: border-box;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          color: ${primary};
        }
        .zaptro-public-quote__wrap{
          max-width: 980px;
          margin: 0 auto;
          display: grid;
          gap: 14px;
        }
        .zaptro-public-quote__card{
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          overflow: hidden;
        }
        .zaptro-public-quote__brandbar{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 12px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(15,23,42,0.06);
          border-radius: 18px;
          backdrop-filter: blur(10px);
        }
        .zaptro-public-quote__brand{
          display:flex;
          align-items:center;
          gap: 10px;
          min-width: 0;
        }
        .zaptro-public-quote__brandmark{
          width: 34px;
          height: 34px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(10,10,10,1) 0%, rgba(0,0,0,1) 100%);
          color: #d9ff00;
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight: 1000;
          letter-spacing: -0.04em;
          box-shadow: 0 10px 26px rgba(0,0,0,0.14);
          flex: 0 0 auto;
        }
        .zaptro-public-quote__brandname{
          font-weight: 1000;
          font-size: 13px;
          letter-spacing: -0.02em;
          color: ${primary};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .zaptro-public-quote__badge{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: rgba(15,23,42,0.04);
          border: 1px solid rgba(15,23,42,0.08);
          color: rgba(71,85,105,1);
        }
        .zaptro-public-quote__actions{
          display:flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }
        .zaptro-public-quote__btn{
          height: 40px;
          padding: 0 14px;
          border-radius: 14px;
          border: 1px solid rgba(15,23,42,0.12);
          background: #fff;
          color: ${primary};
          font-weight: 900;
          font-size: 12px;
          cursor: pointer;
          display:inline-flex;
          align-items:center;
          gap: 8px;
        }
        .zaptro-public-quote__btn--primary{
          border: none;
          background: ${primary};
          color: #d9ff00;
        }
        .zaptro-public-quote__btn--danger{
          border: 1px solid rgba(239,68,68,0.30);
          background: rgba(239,68,68,0.06);
          color: #b91c1c;
        }
        .zaptro-public-quote__btn:disabled{
          opacity: .6;
          cursor: default;
        }
        .zaptro-public-quote__sheet{
          padding: 50px;
        }

        .zaptro-public-quote__inv-head{
          display:grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 18px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(15,23,42,0.08);
        }

        .zaptro-public-quote__inv-left{
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 12px;
          align-items: start;
        }

        .zaptro-public-quote__inv-company{
          display: grid;
          gap: 4px;
          min-width: 0;
        }

        .zaptro-public-quote__inv-company .name{
          font-size: 15px;
          font-weight: 1000;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: ${primary};
        }

        .zaptro-public-quote__inv-company .meta{
          font-size: 12px;
          font-weight: 650;
          color: rgba(100,116,139,1);
          line-height: 1.35;
        }

        .zaptro-public-quote__inv-chiprow{
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .zaptro-public-quote__chip{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: rgba(15,23,42,0.03);
          border: 1px solid rgba(15,23,42,0.08);
          color: rgba(71,85,105,1);
        }

        .zaptro-public-quote__inv-right{
          display:grid;
          gap: 10px;
          justify-items: end;
        }

        .zaptro-public-quote__inv-to{
          width: 100%;
          max-width: 360px;
          border: 1px solid rgba(15,23,42,0.10);
          border-radius: 18px;
          background: rgba(15,23,42,0.02);
          padding: 12px 14px;
          box-sizing: border-box;
        }

        .zaptro-public-quote__inv-label{
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(100,116,139,1);
        }
        .zaptro-public-quote__inv-value{
          font-size: 13px;
          font-weight: 950;
          margin-top: 6px;
          color: ${primary};
        }

        .zaptro-public-quote__sheet-footgrid{
          margin-top: 18px;
          display:grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .zaptro-public-quote__mini{
          border: 1px solid rgba(15,23,42,0.10);
          border-radius: 18px;
          background: rgba(15,23,42,0.02);
          padding: 12px 14px;
        }

        .zaptro-public-quote__thanks{
          margin-top: 14px;
          font-weight: 900;
          color: rgba(71,85,105,1);
        }

        .zaptro-public-quote__actionbar{
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 50;
          padding: 14px 12px;
          background: rgba(255,255,255,0.92);
          border-top: 1px solid rgba(15,23,42,0.10);
          backdrop-filter: blur(10px);
        }
        .zaptro-public-quote__actionbar-inner{
          max-width: 980px;
          margin: 0 auto;
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 12px;
        }
        .zaptro-public-quote__actionbar-left{
          display:flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .zaptro-public-quote__actionbar-title{
          font-size: 12px;
          font-weight: 1000;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .zaptro-public-quote__actionbar-sub{
          font-size: 11px;
          font-weight: 650;
          color: rgba(100,116,139,1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .zaptro-public-quote__actionbar-actions{
          display:flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content:flex-end;
        }
        .zaptro-public-quote__header{
          display:grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(15,23,42,0.08);
        }
        .zaptro-public-quote__issuer{
          display:flex;
          gap: 12px;
          align-items: flex-start;
        }
        .zaptro-public-quote__logo{
          width: 46px;
          height: 46px;
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.08);
          background: rgba(15,23,42,0.04);
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
        }
        .zaptro-public-quote__issuer-name{
          font-size: 14px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }
        .zaptro-public-quote__muted{
          font-size: 11px;
          font-weight: 600;
          color: rgba(100,116,139,1);
          line-height: 1.4;
        }
        .zaptro-public-quote__title{
          text-align:right;
        }
        .zaptro-public-quote__title h1{
          margin:0;
          font-size: 33px;
          font-weight: 1000;
          letter-spacing: 0.12em;
        }
        .zaptro-public-quote__title .date{
          margin-top:4px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(100,116,139,1);
        }
        .zaptro-public-quote__table{
          width: 100%;
          border-collapse: collapse;
          margin-top: 18px;
          overflow:hidden;
          border-radius: 18px;
          border: 1px solid rgba(15,23,42,0.10);
        }
        .zaptro-public-quote__table thead th{
          background: ${accent};
          color: #fff;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 900;
          padding: 12px 12px;
          text-align:left;
        }
        .zaptro-public-quote__table tbody td{
          padding: 12px 12px;
          border-top: 1px solid rgba(15,23,42,0.08);
          font-size: 13px;
          font-weight: 700;
          color: ${primary};
          vertical-align: top;
        }
        .zaptro-public-quote__totals{
          margin-top: 18px;
          display:grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
          align-items: start;
        }
        .zaptro-public-quote__note{
          border: 1px solid rgba(15,23,42,0.10);
          border-radius: 18px;
          background: rgba(15,23,42,0.02);
          padding: 12px 14px;
        }
        .zaptro-public-quote__totalbox{
          border: 1px solid rgba(15,23,42,0.12);
          border-radius: 18px;
          overflow:hidden;
          background: #fff;
        }
        .zaptro-public-quote__totalrow{
          display:flex;
          justify-content:space-between;
          gap: 12px;
          padding: 12px 14px;
          font-weight: 900;
          font-size: 12px;
          color: rgba(71,85,105,1);
          border-top: 1px solid rgba(15,23,42,0.08);
        }
        .zaptro-public-quote__totalrow.total{
          background: rgba(15,23,42,0.04);
          color: ${primary};
          font-size: 13px;
        }
        .zaptro-public-quote__footer{
          padding: 14px 22px 18px;
          border-top: 1px solid rgba(15,23,42,0.08);
          display:flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: space-between;
          align-items: center;
        }
        .zaptro-public-quote__obs{
          display:grid;
          gap: 10px;
          padding: 14px 50px;
          border: 1px solid rgba(15,23,42,0.10);
          border-radius: 18px;
          background: rgba(255,255,255,0.85);
        }
        .zaptro-public-quote__textarea{
          width: 100%;
          resize: vertical;
          min-height: 80px;
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.12);
          padding: 12px 12px;
          font-size: 13px;
          font-weight: 650;
          outline: none;
          font-family: inherit;
          background: #fff;
          color: ${primary};
        }
        @media (max-width: 860px){
          .zaptro-public-quote__inv-head{ grid-template-columns: 1fr; }
          .zaptro-public-quote__inv-right{ justify-items: start; }
          .zaptro-public-quote__totals{ grid-template-columns: 1fr; }
          .zaptro-public-quote__sheet-footgrid{ grid-template-columns: minmax(0,1fr); }
          .zaptro-public-quote__actionbar-inner{ flex-direction: column; align-items: stretch; }
          .zaptro-public-quote__actionbar-actions{ justify-content: stretch; }
        }
        @media print {
          .zaptro-public-quote{ background: #fff; padding: 0; }
          .zaptro-public-quote__brandbar, .zaptro-public-quote__obs, .zaptro-public-quote__actionbar{ display:none !important; }
          .zaptro-public-quote__wrap{ max-width: 100%; }
          .zaptro-public-quote__card{ border: none; border-radius: 0; }
          .zaptro-public-quote__sheet{ padding: 0; }
        }
      `}</style>

      <div className="zaptro-public-quote__wrap">
        <div className="zaptro-public-quote__brandbar">
          <div className="zaptro-public-quote__brand">
            <span className="zaptro-public-quote__brandmark" aria-hidden>
              Z
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="zaptro-public-quote__brandname">{zaptroLabel}</div>
              <div className="zaptro-public-quote__muted">Orçamento online • link público</div>
            </div>
          </div>
          <span className="zaptro-public-quote__badge">Status: {statusLabel}</span>
        </div>

        <div className="zaptro-public-quote__card">
          <div className="zaptro-public-quote__sheet">
            <div className="zaptro-public-quote__inv-head">
              <div className="zaptro-public-quote__issuer">
                <div className="zaptro-public-quote__inv-left">
                  <div className="zaptro-public-quote__logo" aria-hidden style={{ width: 56, height: 56, borderRadius: 18 }}>
                    {quote.issuerLogoUrl || localCompanyLogo ? (
                      <img
                        src={quote.issuerLogoUrl || localCompanyLogo || ''}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <CheckCircle2 size={24} color={accent} />
                    )}
                  </div>
                  <div className="zaptro-public-quote__inv-company">
                    <div className="name">{issuerName}</div>
                    <div className="meta">Orçamento online enviado via {zaptroLabel}.</div>
                    <div className="meta">Ref.: {quote.id}</div>
                    <div className="zaptro-public-quote__inv-chiprow">
                      <span className="zaptro-public-quote__chip">{quote.origin?.trim() || 'Origem —'}</span>
                      <span className="zaptro-public-quote__chip">→</span>
                      <span className="zaptro-public-quote__chip">{quote.destination?.trim() || 'Destino —'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="zaptro-public-quote__inv-right">
                <div className="zaptro-public-quote__title">
                  <h1>ORÇAMENTO</h1>
                  <div className="date">{createdLabel}</div>
                </div>
                <div className="zaptro-public-quote__inv-to">
                  <div className="zaptro-public-quote__inv-label">Para</div>
                  <div className="zaptro-public-quote__inv-value">{buyerLabel}</div>
                </div>
              </div>
            </div>

            <table className="zaptro-public-quote__table">
              <thead>
                <tr>
                  <th style={{ width: '55%' }}>Descrição</th>
                  <th style={{ width: '15%' }}>Qtd</th>
                  <th style={{ width: '15%' }}>Unitário</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ fontWeight: 900, marginBottom: 4 }}>{quoteProductLabel(quote)}</div>
                    <div className="zaptro-public-quote__muted">
                      {quote.origin?.trim() || '—'} → {quote.destination?.trim() || '—'}
                    </div>
                    {quote.notes?.trim() ? <div className="zaptro-public-quote__muted">Obs.: {quote.notes.trim()}</div> : null}
                  </td>
                  <td>1</td>
                  <td>{formatBrl(total)}</td>
                  <td style={{ textAlign: 'right' }}>{formatBrl(total)}</td>
                </tr>
              </tbody>
            </table>

            <div className="zaptro-public-quote__totals">
              <div className="zaptro-public-quote__note">
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(71,85,105,1)' }}>
                  Nota
                </div>
                <div className="zaptro-public-quote__muted" style={{ marginTop: 6 }}>
                  Você pode aceitar/recusar acima, ou enviar uma observação abaixo. Para baixar, clique em “Baixar / Imprimir”.
                </div>
              </div>
              <div className="zaptro-public-quote__totalbox">
                <div className="zaptro-public-quote__totalrow">
                  <span>Subtotal</span>
                  <span>{formatBrl(total)}</span>
                </div>
                <div className="zaptro-public-quote__totalrow">
                  <span>Impostos</span>
                  <span>{formatBrl(0)}</span>
                </div>
                <div className="zaptro-public-quote__totalrow total">
                  <span>Total</span>
                  <span>{formatBrl(total)}</span>
                </div>
              </div>
            </div>

            <div className="zaptro-public-quote__thanks">Obrigado pela preferência.</div>

            <div className="zaptro-public-quote__sheet-footgrid">
              <div className="zaptro-public-quote__mini">
                <div className="zaptro-public-quote__inv-label">Contato</div>
                <div className="zaptro-public-quote__muted" style={{ marginTop: 6 }}>
                  Em caso de dúvidas, responda este orçamento com uma observação.
                </div>
              </div>
              <div className="zaptro-public-quote__mini">
                <div className="zaptro-public-quote__inv-label">Pagamento</div>
                <div className="zaptro-public-quote__muted" style={{ marginTop: 6 }}>
                  Após a aprovação, nosso time confirma condições e prazos.
                </div>
              </div>
              <div className="zaptro-public-quote__mini">
                <div className="zaptro-public-quote__inv-label">Termos</div>
                <div className="zaptro-public-quote__muted" style={{ marginTop: 6 }}>
                  Valores e disponibilidade sujeitos a confirmação.
                </div>
              </div>
            </div>
          </div>

          <div className="zaptro-public-quote__footer">
            <div className="zaptro-public-quote__muted">
              Link público do orçamento · Zaptro
            </div>
            <div className="zaptro-public-quote__muted">Status atual: {statusLabel}</div>
          </div>
        </div>

        <div className="zaptro-public-quote__obs">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                aria-hidden
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 14,
                  background: 'rgba(15,23,42,0.05)',
                  border: '1px solid rgba(15,23,42,0.08)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: primary,
                }}
              >
                <MessageSquareText size={18} />
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900 }}>Observação</div>
                <div className="zaptro-public-quote__muted">Envie um comentário para o time comercial.</div>
              </div>
            </div>
            {justSubmittedObs ? (
              <span className="zaptro-public-quote__badge" style={{ background: 'rgba(34,197,94,0.10)', borderColor: 'rgba(34,197,94,0.25)', color: '#15803d' }}>
                Enviado
              </span>
            ) : null}
          </div>
          <textarea
            className="zaptro-public-quote__textarea"
            placeholder="Ex.: Podemos ajustar a data de entrega? Tem desconto para pagamento à vista?"
            value={obs}
            onChange={(e) => {
              setJustSubmittedObs(false);
              setObs(e.target.value);
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="zaptro-public-quote__btn"
              disabled={!obs.trim()}
              onClick={() => {
                const ok = applyPublicQuoteObservation(token, obs).ok;
                if (ok) {
                  setObs('');
                  setJustSubmittedObs(true);
                }
              }}
            >
              Enviar observação
            </button>
          </div>
        </div>
      </div>

      <div className="zaptro-public-quote__actionbar" role="region" aria-label="Ações do orçamento">
        <div className="zaptro-public-quote__actionbar-inner">
          <div className="zaptro-public-quote__actionbar-left">
            <div className="zaptro-public-quote__actionbar-title">{issuerName} • Orçamento</div>
            <div className="zaptro-public-quote__actionbar-sub">
              {buyerLabel} · {formatBrl(total)} · {statusLabel}
            </div>
          </div>
          <div className="zaptro-public-quote__actionbar-actions">
            <button type="button" className="zaptro-public-quote__btn" onClick={() => window.print()}>
              <Download size={16} /> Baixar / Imprimir
            </button>
            <button
              type="button"
              className="zaptro-public-quote__btn zaptro-public-quote__btn--danger"
              disabled={quote.status === 'recusado' || quote.status === 'aprovado' || deciding !== null}
              onClick={() => {
                setDeciding('recusar');
                try {
                  applyPublicQuoteDecision(token, 'recusar');
                } finally {
                  setDeciding(null);
                }
              }}
            >
              <ThumbsDown size={16} /> Recusar
            </button>
            <button
              type="button"
              className="zaptro-public-quote__btn zaptro-public-quote__btn--primary"
              disabled={quote.status === 'aprovado' || quote.status === 'recusado' || deciding !== null}
              onClick={() => {
                setDeciding('aprovar');
                try {
                  applyPublicQuoteDecision(token, 'aprovar');
                } finally {
                  setDeciding(null);
                }
              }}
            >
              <ThumbsUp size={16} /> Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZaptroQuotePublic;

