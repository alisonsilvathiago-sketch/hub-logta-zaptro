import type { CSSProperties } from 'react';

const hubCtaFont = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

/** Botão primário do header (ex.: NOVO PLANO, Exportar) — altura única no Hub */
export const HUB_TOP_CTA_PRIMARY: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  padding: '0 20px',
  height: 39,
  boxSizing: 'border-box',
  backgroundColor: 'var(--accent)',
  backgroundImage: 'none',
  color: '#ffffff',
  border: 'none',
  borderRadius: '16px',
  fontWeight: 800,
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontFamily: hubCtaFont,
};

/** Botão secundário do header (ex.: NOVA COBRANÇA, Sincronizar) */
export const HUB_TOP_CTA_SECONDARY: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  padding: '0 20px',
  height: 39,
  boxSizing: 'border-box',
  borderRadius: '16px',
  border: 'none',
  backgroundColor: '#ffffff',
  backgroundImage: 'none',
  color: 'var(--text-title, #0F172A)',
  fontWeight: 600,
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontFamily: hubCtaFont,
};
