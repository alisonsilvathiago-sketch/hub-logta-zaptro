import type { CSSProperties } from 'react';

/**
 * Modelo de cartão premium Zaptro (alinhado ao painel Início · pré-visualização logística).
 * Usar em novos blocos e ir migrando páginas existentes para manter consistência.
 */
export const ZAPTRO_CARD_RADIUS_PX = 28;

export const ZAPTRO_CARD_SHADOW_LIGHT = '0 4px 24px rgba(15, 23, 42, 0.06)' as const;

/** Orbe de ícone KPI / destaque — neutro claro + ícone escuro (visual mais clean). */
export const ZAPTRO_ICON_ORB_BG = 'rgba(248, 250, 252, 1)' as const;
export const ZAPTRO_ICON_ORB_FG = 'rgba(107, 107, 107, 1)' as const;

/** Orbes do painel Resultados (ZaptroDashboardContent) — fundo creme + ícone cinza. */
export const ZAPTRO_DASH_ICON_ORB_BG = 'rgba(248, 251, 229, 1)' as const;
export const ZAPTRO_DASH_ICON_ORB_FG = 'rgba(121, 127, 139, 1)' as const;

/** Fundo painel escuro — identidade preto absoluto (não slate). */
export const ZAPTRO_CARD_BG_DARK = 'rgba(13, 13, 13, 1)' as const;

export function zaptroCardSurfaceStyle(isDark: boolean): CSSProperties {
  return {
    backgroundColor: isDark ? ZAPTRO_CARD_BG_DARK : '#FFFFFF',
    borderRadius: ZAPTRO_CARD_RADIUS_PX,
    /** Traço preto suave (claro) / branco suave (escuro) — modelo único do produto. */
    border: isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(0, 0, 0, 0.14)',
    boxShadow: isDark ? 'none' : ZAPTRO_CARD_SHADOW_LIGHT,
    boxSizing: 'border-box',
  };
}

/** Cartões aninhados (linhas de lista, células): mesma linguagem, sem sombra. */
export function zaptroCardRowStyle(isDark: boolean): CSSProperties {
  return {
    backgroundColor: isDark ? ZAPTRO_CARD_BG_DARK : '#FFFFFF',
    borderRadius: 14,
    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.12)',
    boxSizing: 'border-box',
  };
}

/** Círculo 48×48 (KPI) ou quadrado arredondado de ícone de secção — mesmo contraste. */
export function zaptroIconOrbStyle(options: { size?: number; rounded?: 'circle' | 'card' }): CSSProperties {
  const size = options.size ?? 48;
  const rounded = options.rounded ?? 'circle';
  return {
    width: size,
    height: size,
    borderRadius: rounded === 'circle' ? 999 : 14,
    background: ZAPTRO_ICON_ORB_BG,
    border: '1px solid rgba(15, 23, 42, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: ZAPTRO_ICON_ORB_FG,
    flexShrink: 0,
  };
}

/** KPIs do dashboard Resultados — 100×100, creme + cinza (inspeção do layout). */
export function zaptroDashboardIconOrbStyle(options?: { size?: number }): CSSProperties {
  const size = options?.size ?? 100;
  return {
    width: size,
    height: size,
    minHeight: size,
    borderRadius: 999,
    background: ZAPTRO_DASH_ICON_ORB_BG,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: ZAPTRO_DASH_ICON_ORB_FG,
    flexShrink: 0,
    boxSizing: 'border-box',
  };
}
