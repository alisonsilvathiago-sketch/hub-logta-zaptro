import type { CSSProperties } from 'react';

/** Título principal — estilo Usage/Supabase */
export const HUB_PAGE_TITLE: CSSProperties = {
  fontSize: '28px',
  fontWeight: 900,
  color: '#1a1d21',
  letterSpacing: '-0.02em',
  margin: 0,
  lineHeight: 1.3,
};

/** Descrição sob o título — corpo secundário legível */
export const HUB_PAGE_SUBTITLE: CSSProperties = {
  fontSize: '13px',
  fontWeight: 400,
  color: '#6b7280',
  margin: '6px 0 0',
  padding: 0,
  maxWidth: 640,
  lineHeight: 1.55,
};

/** Rótulo de seção (ex.: ÁREAS, MÓDULOS) */
export const HUB_SECTION_KICKER: CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#6b7280',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  margin: 0,
  lineHeight: 1.3,
};

/** Título de seções ou cards (H2/H3) */
export const HUB_SECTION_TITLE: CSSProperties = {
  fontSize: '20px',
  fontWeight: 900,
  color: '#0F172A',
  margin: 0,
};

/** Texto descritivo geral */
export const HUB_DESCRIPTION_TEXT: CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#64748B',
  lineHeight: 1.6,
};

/** Texto de inputs / selects / textareas (espelha `hub-fields.css`) */
export const HUB_FIELD_TEXT: CSSProperties = {
  fontSize: '12px',
  fontWeight: 400,
  color: 'rgba(0, 0, 0, 0.8)',
};

/** Texto do rótulo em botões da navegação lateral (Configurações Master, etc.) */
export const HUB_SIDEBAR_NAV_LABEL: CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
};
