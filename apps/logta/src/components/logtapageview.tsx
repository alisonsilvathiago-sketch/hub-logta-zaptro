import React from 'react';
import type { CSSProperties } from 'react';
import { LOGTA_PAGE_VIEW } from '../constants/logtaLayout';

type LogtaPageViewProps = {
  children: React.ReactNode;
  /** Sobrepõe estilos do invólucro (ex.: padding superior do dashboard). */
  style?: CSSProperties;
  className?: string;
};

/**
 * Vista de página única para todo o Logta SaaS — mesmo ritmo que `ModuleLayout`:
 * fundo `--bg-app`, padding `LOGTA_PAGE_ROOT_PADDING`, entrada `animate-fade-in`.
 */
const LogtaPageView: React.FC<LogtaPageViewProps> = ({ children, style, className }) => (
  <div
    className={['logta-page-view animate-fade-in', className].filter(Boolean).join(' ')}
    style={{ ...LOGTA_PAGE_VIEW, ...style }}
  >
    {children}
  </div>
);

export default LogtaPageView;
