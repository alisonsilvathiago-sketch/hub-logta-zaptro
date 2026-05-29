import React from 'react';
import type { LucideIcon } from 'lucide-react';
import './HubMetricCard.css';

export type HubMetricIconVariant = 'soft' | 'solid';

/** Grid padrão para fileiras de KPI no Hub Master (alinhado ao CRM). */
export const HUB_METRIC_GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '20px',
  marginBottom: '32px',
};

const cardBase: React.CSSProperties = {
  background: '#FFFFFF',
  boxSizing: 'border-box',
  padding: '0 14px',
  minHeight: '108px',
  borderRadius: '28px',
  border: 'none',
  boxShadow: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '19px',
  transition: 'all 0.2s ease',
};

const iconShell: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const metaRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
};

const valueStyle: React.CSSProperties = {
  fontSize: '23px',
  fontWeight: 800,
  marginTop: '4px',
  lineHeight: 1.1,
  letterSpacing: 0,
  textShadow: 'none',
};

function softIconBackground(accent: string, explicit?: string): string {
  if (explicit) return explicit;
  if (/^#[0-9A-Fa-f]{6}$/i.test(accent)) return `${accent}15`;
  return 'rgba(0, 97, 255, 0.082)';
}

export interface HubMetricCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  iconVariant?: HubMetricIconVariant;
  /** Cor de destaque do ícone (variante soft: ícone + fundo derivado; solid: fundo + ícone branco). */
  accent?: string;
  /** Fundo do ícone na variante soft (opcional). */
  softBg?: string;
  iconSize?: number;
  /** Texto ou chip no canto superior direito da área de texto (tendência, status, meta). */
  topRight?: React.ReactNode;
  /** Barra de progresso, nota de rodapé, etc. */
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
}

export function HubMetricCard({
  label,
  value,
  icon: Icon,
  iconVariant = 'soft',
  accent = '#0061FF',
  softBg,
  iconSize = 18,
  topRight,
  footer,
  className = 'hub-metric-card premium-card hover-scale',
  style,
  hover = true,
}: HubMetricCardProps) {
  const wrapBg =
    iconVariant === 'solid' ? accent : softIconBackground(accent, softBg);
  const iconColor = iconVariant === 'solid' ? '#FFFFFF' : accent;

  return (
    <div
      className={className}
      style={{ ...cardBase, ...style }}
      onMouseEnter={(e) => {
        if (!hover) return;
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onMouseLeave={(e) => {
        if (!hover) return;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ ...iconShell, background: wrapBg }}>
        <Icon size={iconSize} color={iconColor} strokeWidth={2} aria-hidden />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={metaRow}>
          <span className="hub-metric-card__label">{label}</span>
          {topRight != null ? (
            <span
              className="hub-metric-card__topRight"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 800,
                textShadow: 'none',
              }}
            >
              {topRight}
            </span>
          ) : null}
        </div>
        <div className="hub-metric-card__value" style={valueStyle}>
          {value}
        </div>
        {footer}
      </div>
    </div>
  );
}

export default HubMetricCard;
