import type { CSSProperties } from 'react';

/**
 * Shell Logta — paddings partilhados entre dashboard, header global e conteúdo.
 */
export const LOGTA_PAGE_PAD_X = 'clamp(16px, 2.4vw, 32px)';

/** Fundo único do miolo autenticado (header global + `LogtaPageView` / módulos). */
export const LOGTA_SHELL_BG = '#f3f0ff';

/**
 * Padding vertical típico do corpo dentro de `<main>`.
 * O inset horizontal uniforme vem de `App.tsx` (`LOGTA_PAGE_PAD_X`).
 */
export const LOGTA_PAGE_ROOT_PADDING = '14px 0 28px';

/**
 * Invólucro base de todas as vistas autenticadas (lista, configurações, módulos):
 * mesma largura, padding vertical e fundo — alinhado ao `ModuleLayout`.
 */
export const LOGTA_PAGE_VIEW: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  minHeight: '100%',
  padding: LOGTA_PAGE_ROOT_PADDING,
  backgroundColor: LOGTA_SHELL_BG,
  boxSizing: 'border-box',
};

/** Padding superior da página do IntelligenceDashboard. */
export const LOGTA_DASHBOARD_PAGE_PAD_TOP_PX = 8;

/** Espaçamento vertical único entre blocos dentro dos módulos (tabs, KPIs, secções). */
export const LOGTA_MODULE_STACK_GAP_PX = 24;

/**
 * Área de conteúdo padrão dos módulos (`ModuleLayout`): mesmo modelo que Logística dashboard
 * — coluna flex, gap 24px, animação `animate-fade-in` aplicada no layout.
 */
export const LOGTA_MODULE_CONTENT_SHELL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: LOGTA_MODULE_STACK_GAP_PX,
  padding: 24,
  marginTop: 19,
  background: 'transparent',
  borderRadius: 0,
  border: 'none',
  boxShadow: 'none',
  flex: 1,
  minWidth: 0,
  width: '100%',
  boxSizing: 'border-box',
};

/** Pilha de tab / vista interna — usar nos `styles.tabContent` dos módulos para manter ritmo igual. */
export const LOGTA_MODULE_TAB_STACK: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: LOGTA_MODULE_STACK_GAP_PX,
};
