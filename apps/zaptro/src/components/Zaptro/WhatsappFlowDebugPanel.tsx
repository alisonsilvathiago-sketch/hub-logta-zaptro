import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getWaFlowSnapshot,
  isWaFlowDebugEnabled,
  resetWaFlowDiagnostic,
  subscribeWaFlow,
  type WaFlowSnapshot,
} from '../../lib/whatsappFlowDiagnostic';

/** Painel flutuante temporario — nao altera o layout da pagina. */
export function WhatsappFlowDebugPanel(): React.ReactPortal | null {
  const enabled = isWaFlowDebugEnabled();
  const [open, setOpen] = useState(true);
  const [snap, setSnap] = useState<WaFlowSnapshot>(() => getWaFlowSnapshot());

  useEffect(() => {
    if (!enabled) return;
    return subscribeWaFlow(() => setSnap(getWaFlowSnapshot()));
  }, [enabled]);

  if (!enabled || typeof document === 'undefined') return null;

  const panel = !open ? (
    <button
      type="button"
      onClick={() => setOpen(true)}
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        zIndex: 99999,
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid #6B6B6B',
        background: '#0f172a',
        color: '#949494',
        fontSize: 11,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      WA-FLOW debug
    </button>
  ) : (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        zIndex: 99999,
        width: 320,
        maxHeight: '70vh',
        overflow: 'auto',
        borderRadius: 10,
        border: '1px solid #6B6B6B',
        background: 'rgba(15, 23, 42, 0.96)',
        color: '#e2e8f0',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 11,
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 10px",
          borderBottom: "1px solid #6B6B6B",
          position: "sticky",
          top: 0,
          background: "#0f172a",
        }}
      >
        <strong style={{ color: '#38bdf8' }}>WA-FLOW debug</strong>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => resetWaFlowDiagnostic()} style={btnMini} title="Limpar eventos">
            limpar
          </button>
          <button type="button" onClick={() => setOpen(false)} style={btnMini}>
            -
          </button>
        </div>
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Row label="Estado UI" value={snap.status} highlight />
        <Row label="Ultimo evento" value={snap.lastEvent ?? '-'} />
        <Row label="Hora evento" value={snap.lastEventAt ? formatTime(snap.lastEventAt) : '-'} />
        <Row label="Ultimo erro" value={snap.lastError ?? '-'} error={Boolean(snap.lastError)} />
        <Row label="Instancia" value={snap.instance ?? '-'} />
        <Row label="Empresa" value={snap.companyId ? `${snap.companyId.slice(0, 8)}...` : '-'} />
        <Row
          label="Conexao"
          value={`${snap.connection.connected ? 'CONNECTED' : 'OFF'} / ${snap.connection.state}${snap.connection.phone ? ` / ${snap.connection.phone}` : ''}`}
        />
        <Row label="Webhook URL" value={snap.webhook.url ? truncate(snap.webhook.url, 36) : '-'} />
        <Row
          label="Webhook rx"
          value={
            snap.webhook.lastReceivedAt
              ? `${formatTime(snap.webhook.lastReceivedAt)} (${snap.webhook.processedHint})`
              : 'nunca'
          }
        />

        <p style={{ margin: '8px 0 4px', color: '#949494', fontSize: 10, fontWeight: 700 }}>
          EVENTOS (console: [WA-FLOW])
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {snap.events.length === 0 ? (
            <span style={{ color: '#949494' }}>Nenhum evento ainda</span>
          ) : (
            snap.events.slice(0, 12).map((ev) => (
              <div key={`${ev.step}-${ev.at}`}>
                <span style={{ color: stepColor(ev.step) }}>{ev.step}</span>
                <span style={{ color: '#949494', marginLeft: 6 }}>{formatTime(ev.at)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}

const btnMini: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: 4,
  border: '1px solid #475569',
  background: 'transparent',
  color: '#949494',
  fontSize: 10,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

function Row({
  label,
  value,
  highlight,
  error,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  error?: boolean;
}) {
  return (
    <div>
      <span style={{ color: '#949494', display: 'block', marginBottom: 2 }}>{label}</span>
      <span
        style={{
          color: error ? '#f87171' : highlight ? '#4ade80' : '#e2e8f0',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}...` : s;
}

function stepColor(step: string): string {
  if (step.includes('WEBHOOK')) return '#fbbf24';
  if (step.includes('CONNECTED') || step.includes('PERSISTED') || step.includes('UI')) return '#4ade80';
  if (step.includes('QR')) return '#38bdf8';
  if (step.includes('MESSAGE')) return '#a78bfa';
  return '#949494';
}
