import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useZaptroTheme } from '../../context/ZaptroThemeContext';
import { zaptroCardSurfaceStyle, zaptroIconOrbStyle, ZAPTRO_ICON_ORB_FG } from '../../constants/zaptroCardSurface';
const DELTA_POSITIVE_GREEN = '#15803d';

export type ZaptroKpiMetricCardProps = {
  icon: LucideIcon;
  title: string;
  value: React.ReactNode;
  /** Ex.: «+25%» — opcional. */
  delta?: string;
  /** Cor do delta: marca lime, verde legível ou neutro. */
  deltaVariant?: 'lime' | 'positive' | 'muted';
  /** Texto auxiliar por baixo do valor (CRM, orçamentos). */
  subtitle?: React.ReactNode;
  /** Bordo esquerdo em lime (destaque do primeiro KPI). */
  accentBorder?: boolean;
  /** Título em maiúsculas com letter-spacing (CRM / listas densas). */
  titleCaps?: boolean;
  /** Mini gráfico ou decoração à direita (ex.: Recharts). */
  trailing?: React.ReactNode;
  /** Largura da coluna direita quando há `trailing` (predef.: 96). */
  trailingWidth?: number;
  /** Tamanho do valor principal. `hero` ≈ KPIs grandes (ex.: Rotas). */
  valueSize?: 'hero' | 'xl' | 'lg' | 'md';
  className?: string;
  style?: CSSProperties;
};

/**
 * Cartão KPI do modelo Início (pré-visualização logística): orbe preto + ícone lime,
 * rótulo, valor e opcionalmente delta, subtítulo e slot à direita.
 */
const ZaptroKpiMetricCard: React.FC<ZaptroKpiMetricCardProps> = ({
  icon: Icon,
  title,
  value,
  delta,
  deltaVariant = 'lime',
  subtitle,
  accentBorder = false,
  titleCaps = false,
  trailing,
  trailingWidth = 96,
  valueSize = 'xl',
  className,
  style,
}) => {
  const { palette } = useZaptroTheme();
  const isDark = palette.mode === 'dark';
  const lime = palette.lime;

  const deltaColor =
    deltaVariant === 'lime'
      ? lime
      : deltaVariant === 'positive'
        ? DELTA_POSITIVE_GREEN
        : palette.textMuted;

  const valueFontSize = valueSize === 'hero' ? 34 : valueSize === 'xl' ? 26 : valueSize === 'lg' ? 24 : 20;

  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: 10,
    fontWeight: 500,
    color: 'rgba(168, 168, 168, 1)',
    lineHeight: 1.45,
    ...(titleCaps
      ? { letterSpacing: '0.02em', textTransform: 'uppercase' }
      : { marginBottom: subtitle ? 2 : 4 }),
  };

  return (
    <div
      className={['zaptro-kpi-metric-card', className].filter(Boolean).join(' ')}
      style={{
        ...zaptroCardSurfaceStyle(isDark),
        ...(accentBorder ? { borderLeft: `3px solid ${lime}` } : {}),
        padding: trailing ? '18px 18px 14px' : '20px 22px',
        display: 'flex',
        gap: 14,
        alignItems: subtitle ? 'stretch' : 'center',
        minWidth: 0,
        ...style,
      }}
    >
      <div style={{ ...zaptroIconOrbStyle({ size: 48, rounded: 'circle' }), alignSelf: subtitle ? 'flex-start' : 'center' }}>
        <Icon size={22} strokeWidth={2.1} color={ZAPTRO_ICON_ORB_FG} />
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: subtitle ? 2 : 0,
        }}
      >
        <div className="zaptro-kpi-metric-card__title" style={titleStyle}>
          {title}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: titleCaps ? 10 : 0,
          }}
        >
          <span
            className="zaptro-kpi-metric-card__value"
            style={{
              fontSize: valueFontSize,
              fontWeight: 650,
              letterSpacing: '-0.04em',
              color: palette.text,
              lineHeight: 1.12,
              wordBreak: 'break-word',
            }}
          >
            {value}
          </span>
          {delta ? (
            <span style={{ fontSize: 13, fontWeight: 550, color: deltaColor }}>{delta}</span>
          ) : null}
        </div>
        {subtitle ? (
          <div
            style={{
              marginTop: 6,
              fontSize: titleCaps ? 12 : 13,
              fontWeight: 550,
              color: palette.textMuted,
              lineHeight: 1.35,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      {trailing ? (
        <div style={{ width: trailingWidth, flexShrink: 0, alignSelf: 'center', minHeight: 56 }}>{trailing}</div>
      ) : null}
    </div>
  );
};

export default ZaptroKpiMetricCard;
