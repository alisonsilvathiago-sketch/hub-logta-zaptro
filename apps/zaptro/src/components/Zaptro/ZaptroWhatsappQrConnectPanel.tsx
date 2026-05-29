import React from 'react';
import { CheckCircle2, QrCode, Loader2 } from 'lucide-react';
import { useWhatsappConnect } from '../../hooks/useWhatsappConnect';

const FIELD_BORDER = '#e4e4e7';
const FIELD_BG = '#fafafa';
const TITLE = '#09090b';
const MUTED = '#71717a';
const LIME = 'rgba(217, 255, 0, 1)';

export type ZaptroWhatsappQrConnectPanelProps = {
  /** UUID da empresa (pós-registo). Antes disso, QR via Evolution directo se allowPreAuthQr. */
  companyId: string | null;
  autoStartWhenReady?: boolean;
  compact?: boolean;
  onConnected?: () => void;
  /** /registre: permite gerar QR antes do JWT (proxy Evolution no .env.local). */
  allowPreAuthQr?: boolean;
  awaitingAccount?: boolean;
};

/**
 * QR WhatsApp via Evolution API (directo no Zaptro, sem painel externo).
 */
export const ZaptroWhatsappQrConnectPanel: React.FC<ZaptroWhatsappQrConnectPanelProps> = ({
  companyId,
  autoStartWhenReady = false,
  compact = false,
  onConnected,
  allowPreAuthQr = false,
  awaitingAccount = false,
}) => {
  const {
    qrCode,
    loading,
    error,
    isConnected,
    generateQrCode,
    canGenerateQr,
  } = useWhatsappConnect({
    autoStart: autoStartWhenReady && (!!companyId || allowPreAuthQr),
    onConnected,
    fixedCompanyId: companyId,
    allowDirectEvolution: allowPreAuthQr,
  });

  if (isConnected) {
    return (
      <div
        className="zaptro-wa-qr-success-pop"
        style={{
          padding: compact ? '20px 16px' : '28px 20px',
          textAlign: 'center',
          border: `1px solid ${FIELD_BORDER}`,
          borderRadius: 20,
          backgroundColor: '#fff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div
            style={{
              width: compact ? 72 : 88,
              height: compact ? 72 : 88,
              borderRadius: 999,
              border: `2px solid ${LIME}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(217, 255, 0, 0.12)',
            }}
          >
            <CheckCircle2 size={compact ? 34 : 40} color="#15803d" strokeWidth={2.2} />
          </div>
        </div>
        <p style={{ margin: '0 0 8px 0', fontSize: compact ? 18 : 20, fontWeight: 700, color: TITLE, letterSpacing: '-0.02em' }}>
          WhatsApp conectado
        </p>
        <p style={{ margin: 0, fontSize: 13, color: MUTED, fontWeight: 600, lineHeight: 1.55 }}>
          A linha está ativa no Zaptro.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      {error ? (
        <div
          role="alert"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid #fecdd3',
            backgroundColor: '#fff1f2',
            color: '#be123c',
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.45,
            boxSizing: 'border-box',
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ width: '100%', maxWidth: compact ? 320 : 400, margin: '0 auto' }}>
        {qrCode ? (
          <div style={{ position: 'relative', lineHeight: 0 }} className="zaptro-wa-qr-pulse-reg">
            <div
              style={{
                position: 'relative',
                padding: compact ? 12 : 14,
                backgroundColor: '#fff',
                borderRadius: 16,
                border: `1px solid ${FIELD_BORDER}`,
              }}
            >
              <img
                src={qrCode}
                alt="Código QR WhatsApp"
                style={{
                  width: '100%',
                  maxWidth: compact ? 220 : 300,
                  height: 'auto',
                  aspectRatio: '1',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 12, color: MUTED, fontWeight: 600, textAlign: 'center', lineHeight: 1.5 }}>
              WhatsApp → Aparelhos ligados → Ligar um aparelho.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: compact ? 120 : 132,
                height: compact ? 120 : 132,
                borderRadius: 16,
                backgroundColor: FIELD_BG,
                border: `1px dashed ${FIELD_BORDER}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              {loading ? (
                <Loader2 size={40} color="#09090b" className="zaptro-reg-qr-spin" />
              ) : (
                <QrCode size={56} color="#a3a3a3" strokeWidth={1.5} />
              )}
            </div>
            <p style={{ margin: 0, fontSize: 14, color: TITLE, textAlign: 'center', padding: '0 8px', fontWeight: 700 }}>
              {loading ? 'A gerar código…' : 'Toque em «Gerar código QR»'}
            </p>
          </div>
        )}
      </div>

      {awaitingAccount && !companyId ? (
        <p style={{ margin: 0, fontSize: 12, color: MUTED, fontWeight: 600, textAlign: 'center', lineHeight: 1.5, maxWidth: 320 }}>
          Toque em <strong>Finalizar cadastro</strong> abaixo para criar a conta. O QR será gerado em seguida.
        </p>
      ) : null}

      {canGenerateQr && !qrCode && !isConnected && !loading ? (
        <button
          type="button"
          onClick={() => void generateQrCode()}
          style={{
            padding: '12px 20px',
            borderRadius: 14,
            border: '1px solid rgba(0,0,0,0.14)',
            background: '#000000',
            color: LIME,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <QrCode size={18} strokeWidth={2} color={LIME} />
          {error ? 'Tentar de novo' : 'Gerar código QR'}
        </button>
      ) : null}

      <style>{`
        @keyframes zaptroRegQrSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .zaptro-reg-qr-spin { animation: zaptroRegQrSpin 0.9s linear infinite; }
        @keyframes zaptroWaQrPulseReg {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .zaptro-wa-qr-pulse-reg { animation: zaptroWaQrPulseReg 3s infinite ease-in-out; }
        @keyframes zaptroWaSuccessPop {
          0% { transform: scale(0.92); opacity: 0; }
          55% { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .zaptro-wa-qr-success-pop {
          animation: zaptroWaSuccessPop 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </div>
  );
};

export default ZaptroWhatsappQrConnectPanel;
