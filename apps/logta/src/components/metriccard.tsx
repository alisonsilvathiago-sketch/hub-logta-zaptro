import React, { useLayoutEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';

const SPARK_H = 44;

/** Mede o contentor fixo (px) para o Recharts não esticar à largura total do cartão. */
const MetricSparkBars: React.FC<{ sparkData: number[] }> = ({ sparkData }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [[w, h], setWh] = useState<[number, number]>([0, SPARK_H]);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      const nw = Math.max(0, Math.floor(r.width));
      const nh = Math.max(SPARK_H, Math.floor(r.height));
      setWh((prev) => (prev[0] === nw && prev[1] === nh ? prev : [nw, nh]));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const chartData = sparkData.map((v, i) => ({ i: String(i), v }));
  /** Margem à esquerda empurra as barras para a direita, mais compactas. */
  const padL = Math.min(18, Math.max(6, Math.floor(w * 0.08)));

  return (
    <div ref={wrapRef} style={{ width: '100%', height: SPARK_H, minWidth: 0, position: 'relative' }}>
      {w > 2 ? (
        <BarChart
          width={w}
          height={h}
          data={chartData}
          margin={{ top: 2, right: 0, left: padL, bottom: 2 }}
          barCategoryGap="6%"
        >
          <XAxis type="category" dataKey="i" hide />
          <YAxis hide domain={[0, 'dataMax + 2']} />
          <Bar dataKey="v" name="spark" radius={[3, 3, 0, 0]} maxBarSize={10}>
            {sparkData.map((_, si) => (
              <Cell key={si} fill={si % 2 === 0 ? '#8b5cf6' : '#0f172a'} />
            ))}
          </Bar>
        </BarChart>
      ) : null}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  trend?: string;
  trendNeg?: boolean;
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
  sparkData?: number[];
  /** Largura fixa do mini-gráfico (px); cada cartão pode usar um valor para variar o visual. */
  sparkWidth?: number;
  /** Iniciais (1–2 caracteres) da equipa ligada à área do KPI. */
  avatars?: string[];
  /** Nome + função por bolinha (tooltip), alinhado a `avatars`. */
  avatarTitles?: string[];
  onMenuClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  subtitle,
  value,
  trend,
  trendNeg,
  icon: Icon,
  iconBg = '#f4f4f5',
  iconColor = '#5b21b6',
  sparkData,
  sparkWidth = 92,
  avatars,
  avatarTitles,
  onMenuClick
}) => {
  return (
    <div className="metric-card">
      <div style={styles.top}>
        <div 
          className="icon-box"
          style={{ ...styles.iconBox, backgroundColor: iconBg, color: iconColor }}
        >
          <Icon size={18} strokeWidth={2.25} aria-hidden />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={styles.title}>{title}</p>
          {subtitle && <p style={styles.sub}>{subtitle}</p>}
        </div>
        
        {avatars && avatars.length > 0 && (
          <div style={styles.avatarRow} role="group" aria-label="Equipa na área">
            {avatars.map((L, i) => (
              <span
                key={i}
                title={avatarTitles?.[i] ?? `Colaborador ${i + 1}`}
                style={{
                  ...styles.avatar,
                  marginLeft: i ? -7 : 0,
                  background: [
                    'linear-gradient(135deg,#7c3aed,#5b21b6)', 
                    'linear-gradient(135deg,#312e81,#0f172a)', 
                    'linear-gradient(135deg,#a78bfa,#7c3aed)'
                  ][i % 3],
                }}
              >
                {L}
              </span>
            ))}
          </div>
        )}

        <button 
          type="button" 
          style={styles.menuBtn} 
          aria-label="Mais opções"
          onClick={onMenuClick}
        >
          <MoreVertical size={18} color="#5b21b6" />
        </button>
      </div>

      <p style={styles.value}>{value}</p>

      <div style={styles.bottom}>
        <div style={styles.bottomTrend}>
          {trend && (
            <span
              style={{
                ...styles.trend,
                color: trendNeg ? '#EF4444' : '#0f172a',
              }}
            >
              {trend}
            </span>
          )}
        </div>

        {sparkData && sparkData.length > 0 && (
          <div style={{ ...styles.sparkWrap, width: sparkWidth }}>
            <MetricSparkBars sparkData={sparkData} />
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  top: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    marginBottom: '16px',
  },
  iconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: { margin: 0, fontSize: '14px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' },
  sub: { margin: '4px 0 0 0', fontSize: '12px', fontWeight: 600, color: '#94a3b8', lineHeight: 1.35 },
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    maxWidth: 89,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  avatar: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    border: '2px solid #fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px',
    fontWeight: 900,
    color: '#fff',
    boxSizing: 'border-box',
  },
  menuBtn: {
    marginLeft: 'auto',
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#f4f4f5',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  value: {
    margin: '0 0 12px 0',
    fontSize: '40px',
    fontWeight: 950,
    color: '#0f172a',
    letterSpacing: '-0.04em',
    lineHeight: 1,
  },
  bottom: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '8px',
    marginTop: 'auto',
  },
  bottomTrend: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingRight: '4px',
  },
  trend: { fontSize: '12px', fontWeight: 800, lineHeight: 1.25 },
  sparkWrap: {
    height: SPARK_H,
    flexShrink: 0,
    minWidth: 0,
    marginLeft: 'auto',
    alignSelf: 'flex-end',
  },
};

export default MetricCard;
