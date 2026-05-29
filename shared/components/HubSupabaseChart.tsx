import React from 'react';

interface HubSupabaseChartProps {
  label: string;
  value: string;
  data: number[];
  color?: string;
  /** Altura fixa do card (KPI). Padrão: 185px */
  cardHeight?: string;
}

const LOGTA_CHART_ACCENT = '#0061FF';

const HubSupabaseChart: React.FC<HubSupabaseChartProps> = ({ label, value, data, color = LOGTA_CHART_ACCENT, cardHeight = '185px' }) => {
  const s: Record<string, React.CSSProperties> = {
    chartCard: {
      backgroundColor: 'var(--hub-card, #ffffff)',
      borderRadius: '16px',
      padding: '20px 27px',
      border: '1px solid var(--hub-border, #ececec)',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      rowGap: 0,
      height: cardHeight,
      minHeight: cardHeight,
      boxSizing: 'border-box',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02)',
      flex: '0 1 auto',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    chartLabel: {
      fontSize: '10px',
      fontWeight: '600',
      color: 'var(--hub-text-muted, #6b7280)',
      textTransform: 'uppercase',
      letterSpacing: '0',
      paddingTop: '7px',
      paddingBottom: '7px',
    },
    chartValue: {
      fontSize: '24px',
      fontWeight: '800',
      color: 'var(--hub-text-main, #111827)',
      margin: 0,
      letterSpacing: '-0.03em',
      lineHeight: 1.1,
      paddingTop: '10px',
      paddingBottom: '10px',
    },
    chartContainer: {
      flex: 1,
      width: '100%',
      marginTop: 0,
      minHeight: 0,
      display: 'flex',
      alignItems: 'flex-end',
      backgroundColor: 'var(--hub-card, #ffffff)',
      color: 'var(--hub-text-main, #111827)',
    },
  };

  const gradId = `gradient-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.abs(label.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0))}`;

  const width = 200;
  const height = 60;
  const chartSvgHeightPx = 31;
  const padding = 4;

  const safeData = data.length > 0 ? data : [0, 0];
  const maxVal = Math.max(...safeData, 1);
  const minVal = Math.min(...safeData, 0);
  const range = maxVal - minVal || 1;

  const points = safeData.map((val, i) => {
    const x = padding + (i / (safeData.length - 1)) * (width - padding * 2);
    const y = (height - padding) - ((val - minVal) / range) * (height - padding * 2);
    return { x, y };
  });

  const buildPath = () => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 2;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (next.x - curr.x) / 2;
      const cpY2 = next.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const linePath = buildPath();
  const fillPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
      : '';

  return (
    <div
      className="hub-chart-card"
      style={s.chartCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.03)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.02)';
      }}
    >
      <div style={s.chartLabel}>{label}</div>
      <div style={s.chartValue}>{value}</div>

      <div style={s.chartContainer}>
        <svg
          width="100%"
          height={chartSvgHeightPx}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.24" />
              <stop offset="100%" stopColor={color} stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {fillPath && <path d={fillPath} fill={`url(#${gradId})`} />}

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="3.5"
              fill={color}
              stroke="var(--hub-card, #ffffff)"
              strokeWidth="1.5"
            />
          )}
        </svg>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '4px',
          fontSize: '10px',
          color: 'var(--hub-text-subtle, #9ca3af)',
          fontWeight: '600',
          letterSpacing: '0.02em',
          flexShrink: 0,
        }}
      >
        <span>Atividade</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: color,
              display: 'inline-block',
              animation: 'pulse 2s infinite',
            }}
          />
          Live
        </span>
      </div>
    </div>
  );
};

export default HubSupabaseChart;
