import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, LogOut, QrCode, RefreshCw, Smartphone } from 'lucide-react';
import { isZaptroLocalhost, zaptroAppOrigin } from '../../lib/appOrigin';
import { ZAPTRO_APP_ROUTES } from '../../app/zaptroAppRoutes';
import { useWaLink } from './useWaLink';
import { formatWaPhone, WA_LINK_ROUTES } from './waLinkConfig';
import './waLink.css';

type Props = {
  /** Dentro do painel Configuração — tema claro, sem página inteira. */
  embedded?: boolean;
};

export const WaLinkConnectPanel: React.FC<Props> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const {
    phase,
    qrDataUrl,
    phone,
    evoState,
    error,
    instanceName,
    companyId,
    edgeDegraded,
    useLocalProxy,
    guestMode,
    startLink,
    refreshOrGenerate,
    refreshStatus,
    disconnect,
    isBooting,
    authReady,
  } = useWaLink();

  const step1Done = phase !== 'disconnected' && phase !== 'boot' && phase !== 'error';
  const step2Done = phase === 'confirm_phone' || phase === 'connected';
  const step2Active = phase === 'scan_qr' || phase === 'confirm_phone';
  const step3Done = phase === 'connected';

  const statusLabel = (() => {
    switch (phase) {
      case 'boot':
        return 'A verificar ligação…';
      case 'disconnected':
        return 'Desligado — gere um QR para começar.';
      case 'loading_qr':
        return 'A pedir código QR à Evolution…';
      case 'scan_qr':
        return 'Abra o WhatsApp no telemóvel e leia o QR.';
      case 'confirm_phone':
        return 'QR lido — confirme a ligação no telemóvel.';
      case 'connected':
        return 'Ligado e pronto.';
      case 'error':
        return 'Ocorreu um problema.';
      default:
        return '';
    }
  })();

  const inboxPath = embedded ? ZAPTRO_APP_ROUTES.INBOX : WA_LINK_ROUTES.INBOX;
  const showLocalMeta = import.meta.env.DEV || isZaptroLocalhost();
  const localOrigin = zaptroAppOrigin();

  const rootClass = embedded ? 'wa-link-connect-embedded' : 'wa-link-page';

  return (
    <div className={rootClass}>
      <main className="wa-link-main">
        <section className="wa-link-steps" aria-label="Passos de ligação">
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: embedded ? 22 : 28,
              fontWeight: embedded ? 700 : 800,
              letterSpacing: '-0.03em',
              color: embedded ? '#0f172a' : undefined,
            }}
          >
            Ligar o WhatsApp
          </h2>
          <p
            style={{
              margin: '0 0 12px',
              color: embedded ? '#949494' : '#949494',
              lineHeight: 1.55,
              fontSize: 15,
            }}
          >
            Tudo acontece aqui — sem abrir painel externo. Gere o QR e leia no telemóvel (Evolution GO,
            igual ao WhatsApp Web).
          </p>
          <p className="wa-link-connect-banner">
            Conta ligada — só a sua empresa vê as conversas desta ligação WhatsApp.
            {showLocalMeta ? (
              <>
                {' '}
                <strong>Ambiente local:</strong>{' '}
                <a href={localOrigin} style={{ color: 'inherit' }}>
                  {localOrigin}
                </a>
              </>
            ) : null}
          </p>

          <div className={`wa-link-step ${step1Done ? 'done' : phase === 'loading_qr' ? 'active' : ''}`}>
            <div className="wa-link-step-num">{step1Done ? <Check size={18} /> : '1'}</div>
            <div>
              <h3>Gerar código QR</h3>
              <p>A instância Evolution recebe o pedido e mostra o QR neste ecrã.</p>
            </div>
          </div>

          <div className={`wa-link-step ${step2Done ? 'done' : step2Active ? 'active' : ''}`}>
            <div className="wa-link-step-num">{step2Done ? <Check size={18} /> : '2'}</div>
            <div>
              <h3>Escanear no telemóvel</h3>
              <p>
                WhatsApp → Dispositivos ligados → Ligar dispositivo → aponte a câmara para o código.
              </p>
            </div>
          </div>

          <div className={`wa-link-step ${step3Done ? 'done' : ''}`}>
            <div className="wa-link-step-num">{step3Done ? <Check size={18} /> : '3'}</div>
            <div>
              <h3>Confirmar no telemóvel</h3>
              <p>Toque em «Ligar» no telemóvel. Só então a linha fica activa no Zaptro.</p>
            </div>
          </div>
        </section>

        <section className="wa-link-panel" aria-label="Painel QR">
          {phase === 'connected' ? (
            <>
              <div className="wa-link-connected-badge">
                <Smartphone size={18} />
                WhatsApp ligado
              </div>
              <p className="wa-link-status">
                Número: <strong>{formatWaPhone(phone)}</strong>
              </p>
              <p className="wa-link-status" style={{ marginBottom: 12 }}>
                A linha está activa na caixa de conversas.
              </p>
              <div className="wa-link-actions">
                <button
                  type="button"
                  className="wa-link-btn wa-link-btn-primary"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('zaptro:open-company-drawer'));
                  }}
                >
                  Perfil comercial (WhatsApp)
                </button>
                <button
                  type="button"
                  className="wa-link-btn wa-link-btn-primary"
                  onClick={() => navigate(ZAPTRO_APP_ROUTES.CONTACTS)}
                >
                  Ver contactos WhatsApp
                </button>
                <button
                  type="button"
                  className="wa-link-btn wa-link-btn-primary"
                  onClick={() => navigate(inboxPath)}
                >
                  Ver conversas
                </button>
                <button
                  type="button"
                  className="wa-link-btn wa-link-btn-ghost"
                  onClick={() => void refreshStatus()}
                >
                  <RefreshCw size={16} />
                  Actualizar
                </button>
                <button
                  type="button"
                  className="wa-link-btn wa-link-btn-danger"
                  onClick={() => void disconnect()}
                >
                  <LogOut size={16} />
                  Desligar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="wa-link-qr-wrap">
                {isBooting || phase === 'loading_qr' ? (
                  <Loader2
                    size={40}
                    color="#0a0a0a"
                    className="wa-spin"
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="Código QR WhatsApp" />
                ) : (
                  <div className="wa-link-placeholder">
                    <QrCode size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
                    <br />
                    Toque em «Gerar QR» para começar
                  </div>
                )}
              </div>

              <p className="wa-link-status">{statusLabel}</p>

              <div className="wa-link-actions">
                <button
                  type="button"
                  className="wa-link-btn wa-link-btn-primary"
                  disabled={isBooting || phase === 'loading_qr'}
                  onClick={() => void startLink()}
                >
                  {phase === 'loading_qr' ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      A gerar…
                    </>
                  ) : (
                    <>
                      <QrCode size={16} />
                      {qrDataUrl ? 'Gerar novo QR' : 'Gerar QR'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="wa-link-btn wa-link-btn-ghost"
                  disabled={!authReady || phase === 'loading_qr'}
                  onClick={() => void refreshOrGenerate()}
                >
                  <RefreshCw size={16} />
                  {qrDataUrl ? 'Actualizar' : 'Actualizar / Gerar QR'}
                </button>
              </div>
            </>
          )}

          {error ? <div className="wa-link-error">{error}</div> : null}

          {edgeDegraded ? (
            <div className="wa-link-error wa-link-error--warn">
              Edge Supabase ainda sem secrets — QR via proxy local (<code>/evolution-api</code>).
              Reinicie o <code>npm run dev</code> após configurar secrets.
            </div>
          ) : null}

          {showLocalMeta ? (
            <div className="wa-link-meta">
              <div>
                Local: <code>{localOrigin}</code>
              </div>
              <div>
                Modo:{' '}
                <code>
                  {guestMode
                    ? 'sessão (conta)'
                    : useLocalProxy || edgeDegraded || isZaptroLocalhost()
                      ? 'localhost → proxy /evolution-api'
                      : 'sessão + Edge'}
                </code>
              </div>
              <div>
                Instância: <code>{instanceName}</code>
              </div>
              {companyId ? (
                <div>
                  Empresa: <code>{companyId.slice(0, 8)}…</code>
                </div>
              ) : null}
              <div>
                Estado API: <code>{evoState}</code>
              </div>
            </div>
          ) : null}
        </section>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default WaLinkConnectPanel;
