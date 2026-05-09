import type { CSSProperties } from 'react';

/** Subtítulo padrão sob o H1 nas páginas Hub Master */
export const HUB_PAGE_SUBTITLE: CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: 'rgba(0, 0, 0, 0.46)',
  margin: 0,
  padding: '7px 0',
  maxWidth: 510,
  lineHeight: 1.5,
  letterSpacing: 0,
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
};

/** Texto de inputs / selects / textareas (espelha `hub-fields.css`) */
export const HUB_FIELD_TEXT: CSSProperties = {
  fontSize: '12px',
  fontWeight: 400,
  color: 'rgba(0, 0, 0, 0.8)',
};

/** Texto do rótulo em botões da navegação lateral (Configurações Master, etc.) */
export const HUB_SIDEBAR_NAV_LABEL: CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
};
