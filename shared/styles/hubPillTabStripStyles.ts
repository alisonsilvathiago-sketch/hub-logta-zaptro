import type { CSSProperties } from 'react';

/** Barra de abas em pill — Hub Master (Billing, LMS, Integrações, etc.): bandeja neutra, sem “glow” azul. */
export const hubPillTabStripStyles: {
  container: CSSProperties;
  button: CSSProperties;
  buttonActive: CSSProperties;
} = {
  container: {
    display: 'flex',
    gap: '8px',
    marginBottom: '32px',
    padding: '6px',
    borderRadius: '18px',
    width: 'fit-content',
    maxWidth: '100%',
    flexWrap: 'wrap',
    boxSizing: 'border-box',
    background: 'none',
    backgroundColor: '#FFFFFF',
    backgroundImage: 'none',
    border: '1px solid #E2E8F0',
    boxShadow: 'none',
    color: 'inherit',
  },
  button: {
    minHeight: 40,
    padding: '0 18px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text-secondary, #64748B)',
    border: 'none',
    borderStyle: 'none',
    backgroundColor: 'transparent',
    backgroundImage: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
    flex: '0 0 auto',
    boxShadow: 'none',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  buttonActive: {
    backgroundColor: 'var(--accent-light, #EFF6FF)',
    backgroundImage: 'none',
    color: 'var(--accent)',
    fontWeight: 800,
    boxShadow: 'none',
  },
};
