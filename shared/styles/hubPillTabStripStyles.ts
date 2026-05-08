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
    backgroundColor: 'transparent',
    backgroundImage: 'none',
    border: 'none',
    borderStyle: 'none',
    borderWidth: 0,
    boxShadow: 'none',
    color: 'inherit',
  },
  button: {
    padding: '10px 24px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    border: 'none',
    borderStyle: 'none',
    backgroundColor: '#FFFFFF',
    backgroundImage: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
    flex: '0 0 auto',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
  },
  buttonActive: {
    backgroundColor: '#FFFFFF',
    backgroundImage: 'none',
    color: 'var(--accent)',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
  },
};
