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
    padding: '6px',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    width: 'fit-content',
    maxWidth: '100%',
    flexWrap: 'wrap',
    boxSizing: 'border-box',
    marginBottom: '12px',
    border: '1px solid #ECEEF1',
    boxShadow: 'none',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 800,
    backgroundColor: 'transparent',
    color: '#949494', // #949494
    transition: 'all 0.2s ease',
    boxShadow: 'none',
  },
  buttonActive: {
    backgroundColor: '#FFFFFF',
    color: '#0061FF', // rgb(0, 97, 255)
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', // rgba(0, 0, 0, 0.05) 0px 4px 12px
  },
};
