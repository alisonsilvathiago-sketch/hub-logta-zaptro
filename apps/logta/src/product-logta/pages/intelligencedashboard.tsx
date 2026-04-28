import React, { useId } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Clock,
  Map as MapIcon,
  Package,
  Route,
  ShieldCheck,
  Truck,
  TrendingUp,
  ChevronDown,
  MoreHorizontal,
  FileWarning,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
  PieChart,
  Pie,
} from 'recharts';
import LogtaPageView from '../../components/LogtaPageView';
import { LOGTA_DASHBOARD_PAGE_PAD_TOP_PX } from '../../constants/logtaLayout';

/** TMS / transportadora — superfície clara, azul institucional, pouco ruído visual */
const BG_PAGE = '#eef2f7';
const SURFACE = '#ffffff';
const SLATE = '#0f172a';
const SLATE_SOFT = '#334155';
const MUTED = '#64748b';
const BORDER = '#e2e8f0';
const ACCENT = '#1d4ed8';
const ACCENT_MUTED = '#3b82f6';
const ACCENT_FILL = '#dbeafe';
const SUCCESS = '#059669';
const RING_TRACK = '#f1f5f9';
const ORANGE_SEG = '#ea580c';
const VIOLET_SEG = '#7c3aed';

const VOLUME_DATA = [
  { day: 'Seg', v: 42 },
  { day: 'Ter', v: 50 },
  { day: 'Qua', v: 38 },
  { day: 'Qui', v: 45 },
  { day: 'Sex', v: 58 },
];

const PIE_DATA = [
  { name: 'Concluídas', value: 65, color: ACCENT },
  { name: 'Em trânsito', value: 25, color: SLATE },
  { name: 'Outros', value: 10, color: '#93c5fd' },
];

const WEEKLY_SUMMARY_DATA = [
  { day: 'Seg', completed: 40, risk: 15 },
  { day: 'Ter', completed: 55, risk: 0 },
  { day: 'Qua', completed: 15, risk: 30 },
  { day: 'Qui', completed: 45, risk: 8 },
  { day: 'Sex', completed: 48, risk: 20 },
];

const KPI_SPARKLINE_DATA = [
  { v: 30 }, { v: 45 }, { v: 35 }, { v: 55 }, { v: 40 }, { v: 60 }, { v: 50 },
];

const IntelligenceDashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <LogtaPageView
      style={{
        padding: `${LOGTA_DASHBOARD_PAGE_PAD_TOP_PX}px 0 48px`,
        background: `linear-gradient(180deg, ${BG_PAGE} 0%, #f8fafc 45%, ${BG_PAGE} 100%)`,
        minHeight: '100vh',
        color: SLATE,
      }}
    >
      <div style={styles.pageInner}>
        {/* Onboarding / UX Refinement — Prioridade 5 */}
        <section style={styles.onboardingBanner}>
          <div style={styles.onboardingText}>
            <h3 style={styles.onboardingTitle}>Bem-vindo ao Logta, Transportadora Exemplo! 🚀</h3>
            <p style={styles.onboardingSub}>Siga os passos abaixo para configurar sua operação e começar a vender mais.</p>
          </div>
          <div style={styles.onboardingSteps}>
            <div style={styles.stepChipActive}>1. Cadastrar Frota</div>
            <div style={styles.stepChip}>2. Conectar WhatsApp</div>
            <div style={styles.stepChip}>3. Criar Primeira Rota</div>
          </div>
        </section>

        {/* Smart Insights Section — Prioridade 1 */}
        <section style={styles.smartInsights}>
          <div style={styles.smartHeader}>
            <div style={styles.smartTitleRow}>
              <div style={styles.smartIconBox}>
                <Sparkles size={20} color="#7c3aed" fill="#7c3aed" />
              </div>
              <div>
                <h2 style={styles.smartTitle}>Logta Smart Insights</h2>
                <p style={styles.smartSub}>Análise preditiva e sugestões estratégicas baseadas em dados reais.</p>
              </div>
            </div>
            <div style={styles.smartBadge}>Beta AI v1.2</div>
          </div>
          
          <div style={styles.insightGrid}>
            <div style={styles.insightCard}>
              <div style={styles.insightIconRow}>
                <AlertTriangle size={18} color="#ef4444" />
                <span style={styles.insightTagDanger}>ALERTA CRÍTICO</span>
              </div>
              <p style={styles.insightText}>
                A rota <strong>RT-SUL-12</strong> está com 22min de atraso médio. 
                Isso pode comprometer o SLA de 3 clientes elite.
              </p>
              <button style={styles.insightActionBtn}>NOTIFICAR MOTORISTA</button>
            </div>

            <div style={styles.insightCard}>
              <div style={styles.insightIconRow}>
                <TrendingDown size={18} color="#f59e0b" />
                <span style={styles.insightTagWarning}>CUSTO OPERACIONAL</span>
              </div>
              <p style={styles.insightText}>
                O motorista <strong>Claudio Ferreira</strong> teve consumo 12% acima da média. 
                Sugestão: Reciclagem em direção econômica.
              </p>
              <button style={styles.insightActionBtn}>AGENDAR TREINAMENTO</button>
            </div>

            <div style={styles.insightCard}>
              <div style={styles.insightIconRow}>
                <Zap size={18} color="#10b981" />
                <span style={styles.insightTagSuccess}>OTIMIZAÇÃO</span>
              </div>
              <p style={styles.insightText}>
                Consolidar as cargas do <strong>Cliente X</strong> e <strong>Cliente Y</strong> na mesma rota 
                reduz o custo fixo em <strong>R$ 1.250,00/semana</strong>.
              </p>
              <button style={styles.insightActionBtn}>APLICAR OTIMIZAÇÃO</button>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <div style={styles.kpiRow}>
          <KPICardSimple
            title="Pontualidade & OTIF"
            sub="SLA operacional · janelas contratadas"
            value="94.2%"
            trend="▲ 2,4 pts vs. semana anterior"
            Icon={Clock}
            trendColor={SUCCESS}
          />
          <KPICardSimple
            title="Entregas concluídas"
            sub="Volume no período · frota própria & agregados"
            value="248"
            trend="▲ 3% vs. meta semanal"
            Icon={Truck}
            trendColor={SUCCESS}
          />
          <KPICardDetailed
            title="Incidentes & atrasos"
            sub="Ocorrências abertas que exigem ação"
            value="5"
            trend="▼ 2% vs. meta de falhas"
            Icon={AlertTriangle}
            trendColor="#dc2626"
            ringPercent={38}
            ringColors={[ORANGE_SEG, VIOLET_SEG]}
            sectionTitle="Filas de atendimento"
            rows={[
              {
                RowIcon: AlertTriangle,
                label: 'Atrasos na descarga',
                category: 'Operação em cliente',
                amount: '− 3',
                tone: 'negative',
              },
              {
                RowIcon: FileWarning,
                label: 'Doc. & compliance',
                category: 'Pendências abertas',
                amount: '− 2',
                tone: 'negative',
                highlight: true,
              },
            ]}
          />
        </div>

        {/* Gráficos — linha 1 */}
        <div style={styles.chartRow}>
          <div style={{ ...styles.card, ...styles.cardLift, flex: 2, minWidth: 320 }}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.cardTitle}>Volume operacional</h3>
                <div style={styles.cardMeta}>
                  <span style={{ color: SUCCESS, fontWeight: 800 }}>244</span>
                  <span style={{ color: MUTED }}> entregas · </span>
                  <span style={{ color: SUCCESS, fontWeight: 800 }}>+12%</span>
                  <span style={{ color: MUTED }}> vs. meta</span>
                </div>
                <p style={styles.cardSub}>Agregado semanal (Seg–Sex) · todas as bases</p>
              </div>
              <div style={styles.timeFilter}>
                <span style={styles.timeFilterIdle}>Dia</span>
                <span style={styles.timeFilterActive}>Semana</span>
                <span style={styles.timeFilterIdle}>Mês</span>
              </div>
            </div>
            <div style={{ height: 260, width: '100%', marginTop: 20 }}>
              <ResponsiveContainer>
                <AreaChart data={VOLUME_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${BORDER}`,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={ACCENT}
                    strokeWidth={2.5}
                    fill="url(#volGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ ...styles.card, ...styles.cardLift, flex: 1, minWidth: 280 }}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Status das entregas</h3>
              <button type="button" style={styles.monthChip}>
                Mês atual <ChevronDown size={14} />
              </button>
            </div>
            <div style={{ height: 220, position: 'relative' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={PIE_DATA}
                    innerRadius={62}
                    outerRadius={82}
                    paddingAngle={4}
                    dataKey="value"
                    stroke={SURFACE}
                    strokeWidth={2}
                  >
                    {PIE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={styles.legend}>
              {PIE_DATA.map((item) => (
                <div key={item.name} style={styles.legendItem}>
                  <div style={{ ...styles.dot, backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
            <button type="button" style={styles.mapBtn}>
              <MapIcon size={16} />
              Ver mapa & tracking
            </button>
          </div>
        </div>

        {/* Gráficos — linha 2 */}
        <div style={styles.chartRow}>
          <div style={{ ...styles.card, ...styles.cardLift, flex: 1.2, minWidth: 320 }}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Rotas em execução</h3>
              <button type="button" style={styles.iconGhost} aria-label="Mais opções">
                <MoreHorizontal size={18} color={MUTED} />
              </button>
            </div>
            <div style={styles.tableTabs}>
              <div style={styles.tableTabActive}>
                <TrendingUp size={14} /> Em destaque
              </div>
              <div style={styles.tableTab}>
                <ShieldCheck size={14} /> Com risco
              </div>
            </div>
            <div style={styles.table}>
              <div style={styles.tableHead}>
                <div style={{ flex: 0.5 }}>#</div>
                <div style={{ flex: 2 }}>Rota / motorista</div>
                <div style={{ flex: 1 }}>Estado</div>
                <div style={{ flex: 1 }}>Entregas</div>
              </div>
              <div style={styles.tableEmpty}>
                Sem rotas ativas neste momento. Crie uma rota ou sincronize o TMS.
              </div>
            </div>
          </div>

          <div style={{ ...styles.card, ...styles.cardLift, flex: 1, minWidth: 280 }}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Desempenho semanal</h3>
              <div style={styles.cardMeta}>
                <Calendar size={14} strokeWidth={2} /> Últimos 5 dias úteis
              </div>
            </div>
            <p style={styles.cardSub}>Volume cumprido vs. entregas em risco (por dia)</p>
            <div style={{ height: 240, width: '100%', marginTop: 16 }}>
              <ResponsiveContainer>
                <BarChart data={WEEKLY_SUMMARY_DATA} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: ACCENT_FILL }}
                    contentStyle={{ borderRadius: 12, border: `1px solid ${BORDER}`, fontSize: 12 }}
                  />
                  <Bar dataKey="completed" stackId="a" fill={ACCENT} radius={[4, 4, 0, 0]} barSize={22} />
                  <Bar dataKey="risk" stackId="a" fill={SLATE} radius={[4, 4, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={styles.legendSmall}>
              <div style={styles.legendItem}>
                <div style={{ ...styles.dot, backgroundColor: ACCENT }} />
                <span>Cumprido</span>
              </div>
              <div style={styles.legendItem}>
                <div style={{ ...styles.dot, backgroundColor: SLATE }} />
                <span>Em risco</span>
              </div>
              <div style={styles.metaChip}>Meta 45 / dia</div>
            </div>
          </div>
        </div>
      </div>
    </LogtaPageView>
  );
};

type KpiBreakdownRow = {
  RowIcon: LucideIcon;
  label: string;
  category: string;
  amount: string;
  tone?: 'positive' | 'negative' | 'neutral';
  highlight?: boolean;
};

/** Anel tipo “wallet card”: arco em gradiente + ícone centrado */
function KpiProgressRing({
  percent,
  gradientId,
  colors,
  icon: Icon,
}: {
  percent: number;
  gradientId: string;
  colors: [string, string];
  icon: LucideIcon;
}) {
  const size = 100;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = c - (clamped / 100) * c;

  return (
    <div style={styles.kpiRingWrap}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={RING_TRACK}
          strokeWidth={stroke}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div style={styles.kpiRingIcon}>
        <Icon size={22} color={SLATE} strokeWidth={2} />
      </div>
    </div>
  );
}

/** KPI compacto (dois primeiros cartões): ícone + valor + sparkline */
const KPICardSimple = ({
  title,
  sub,
  value,
  trend,
  Icon,
  trendColor,
}: {
  title: string;
  sub: string;
  value: string;
  trend: string;
  Icon: LucideIcon;
  trendColor?: string;
}) => (
  <div style={styles.kpiCardCompact}>
    <div style={styles.kpiCompactTop}>
      <div style={styles.kpiCompactIconWell}>
        <Icon size={20} color={ACCENT} strokeWidth={2} />
      </div>
      <div style={styles.kpiCompactLabels}>
        <div style={styles.kpiCompactTitle}>{title}</div>
        <div style={styles.kpiCompactSub}>{sub}</div>
      </div>
    </div>
    <div style={styles.kpiCompactBody}>
      <div style={styles.kpiCompactValue}>{value}</div>
      <div style={{ height: 44, width: 100 }}>
        <ResponsiveContainer>
          <BarChart data={KPI_SPARKLINE_DATA}>
            <Bar dataKey="v" fill={ACCENT_FILL} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div style={{ ...styles.kpiCompactTrend, color: trendColor || MUTED }}>{trend}</div>
  </div>
);

/** Um único cartão estilo “wallet” com anel + lista (incidentes) */
const KPICardDetailed = ({
  title,
  sub,
  value,
  trend,
  Icon,
  trendColor,
  ringPercent,
  ringColors,
  sectionTitle = 'Detalhes',
  rows,
}: {
  title: string;
  sub: string;
  value: string;
  trend: string;
  Icon: LucideIcon;
  trendColor?: string;
  ringPercent: number;
  ringColors: [string, string];
  sectionTitle?: string;
  rows: KpiBreakdownRow[];
}) => {
  const uid = useId().replace(/:/g, '');
  const gradId = `kpi-ring-${uid}`;

  return (
    <div style={styles.kpiFinanceCard}>
      <div style={styles.kpiHero}>
        <KpiProgressRing percent={ringPercent} gradientId={gradId} colors={ringColors} icon={Icon} />
        <div style={styles.kpiHeroName}>{title}</div>
        <div style={styles.kpiMegaValue}>{value}</div>
        <div style={styles.kpiHeroCaption}>{sub}</div>
      </div>
      <div style={{ ...styles.kpiTrendLine, color: trendColor || MUTED }}>{trend}</div>

      <div style={styles.kpiSectionBar}>
        <span style={styles.kpiSectionTitle}>{sectionTitle}</span>
        <button type="button" style={styles.kpiViewAll}>
          Ver tudo
        </button>
      </div>
      <div style={styles.kpiDateHint}>Últimos 7 dias · TMS</div>

      <div style={styles.kpiBreakdownList}>
        {rows.map((row, i) => {
          const Ri = row.RowIcon;
          const tone =
            row.tone === 'positive'
              ? SUCCESS
              : row.tone === 'negative'
                ? SLATE
                : SLATE;
          const amountColor =
            row.tone === 'positive' ? SUCCESS : row.tone === 'negative' ? '#dc2626' : SLATE;
          return (
            <div
              key={`${row.label}-${i}`}
              style={{
                ...styles.kpiBreakdownRow,
                ...(row.highlight ? styles.kpiBreakdownRowLift : {}),
              }}
            >
              <div style={styles.kpiRowIconBox}>
                <Ri size={18} color={tone} strokeWidth={2} />
              </div>
              <div style={styles.kpiRowCopy}>
                <div style={styles.kpiRowLabel}>{row.label}</div>
                <div style={styles.kpiRowCategory}>{row.category}</div>
              </div>
              <div style={{ ...styles.kpiRowAmount, color: amountColor }}>{row.amount}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageInner: {
    width: '100%',
    maxWidth: 1440,
    margin: '0 auto',
    paddingLeft: 24,
    paddingRight: 24,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  onboardingBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: '24px',
    padding: '24px 32px',
    border: '1px solid #dbeafe',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '24px'
  },
  onboardingText: { flex: 1, minWidth: '280px' },
  onboardingTitle: { fontSize: '18px', fontWeight: '900', color: '#1d4ed8', margin: 0 },
  onboardingSub: { fontSize: '14px', color: '#1e40af', margin: '4px 0 0', fontWeight: 500 },
  onboardingSteps: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  stepChip: {
    padding: '8px 16px',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #dbeafe',
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b'
  },
  stepChipActive: {
    padding: '8px 16px',
    borderRadius: '12px',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '800',
    boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)'
  },
  smartInsights: {
    backgroundColor: '#ffffff',
    borderRadius: '32px',
    padding: '32px',
    border: '1px solid var(--border)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.04)',
    background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)',
    position: 'relative',
    overflow: 'hidden'
  },
  smartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px'
  },
  smartTitleRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  smartIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    backgroundColor: '#ede9fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  smartTitle: {
    fontSize: '20px',
    fontWeight: '900',
    color: '#0f172a',
    margin: 0
  },
  smartSub: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0',
    fontWeight: 500
  },
  smartBadge: {
    padding: '6px 12px',
    borderRadius: '10px',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '0.5px'
  },
  insightGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px'
  },
  insightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '24px',
    border: '1px solid rgba(124, 58, 237, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'transform 0.2s'
  },
  insightIconRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  insightTagDanger: { fontSize: '11px', fontWeight: '800', color: '#ef4444' },
  insightTagWarning: { fontSize: '11px', fontWeight: '800', color: '#f59e0b' },
  insightTagSuccess: { fontSize: '11px', fontWeight: '800', color: '#10b981' },
  insightText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#334155',
    margin: 0,
    fontWeight: 500
  },
  insightActionBtn: {
    marginTop: 'auto',
    padding: '10px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#0f172a',
      color: '#ffffff'
    }
  },
  hero: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 24,
    paddingBottom: 4,
    borderBottom: `1px solid ${BORDER}`,
  },
  heroText: {
    flex: '1 1 280px',
    minWidth: 0,
  },
  heroEyebrow: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: ACCENT,
    marginBottom: 10,
  },
  heroTitle: {
    margin: 0,
    fontSize: 'clamp(1.5rem, 2.2vw, 2rem)',
    fontWeight: 950,
    letterSpacing: '-0.03em',
    color: SLATE,
    lineHeight: 1.15,
  },
  heroLead: {
    margin: '12px 0 0',
    fontSize: 14,
    lineHeight: 1.55,
    color: SLATE_SOFT,
    maxWidth: 520,
    fontWeight: 500,
  },
  heroAside: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 14,
    flexShrink: 0,
  },
  livePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    fontWeight: 800,
    color: SLATE_SOFT,
    backgroundColor: SURFACE,
    padding: '8px 14px',
    borderRadius: 999,
    border: `1px solid ${BORDER}`,
    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: SUCCESS,
    boxShadow: '0 0 0 3px rgba(5,150,105,0.25)',
  },
  iconNav: {
    display: 'flex',
    backgroundColor: SURFACE,
    padding: 5,
    borderRadius: 14,
    gap: 4,
    border: `1px solid ${BORDER}`,
    boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
  },
  iconBtnActive: {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_FILL,
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
  },
  iconGhost: {
    border: 'none',
    background: 'transparent',
    padding: 4,
    cursor: 'pointer',
    borderRadius: 8,
  },
  kpiRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
  },
  kpiCardCompact: {
    flex: '1 1 min(260px, 100%)',
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: '22px 24px',
    border: `1px solid ${BORDER}`,
    boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minWidth: 0,
  },
  kpiCompactTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
  },
  kpiCompactIconWell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ACCENT_FILL,
    border: `1px solid ${BORDER}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiCompactLabels: {
    minWidth: 0,
    flex: 1,
  },
  kpiCompactTitle: {
    fontSize: 14,
    fontWeight: 850,
    color: SLATE,
    letterSpacing: '-0.02em',
  },
  kpiCompactSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 4,
    lineHeight: 1.45,
    fontWeight: 500,
  },
  kpiCompactBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  kpiCompactValue: {
    fontSize: 34,
    fontWeight: 950,
    letterSpacing: '-0.04em',
    color: SLATE,
    lineHeight: 1,
  },
  kpiCompactTrend: {
    fontSize: 11,
    fontWeight: 750,
  },
  kpiFinanceCard: {
    flex: '1 1 min(280px, 100%)',
    backgroundColor: SURFACE,
    borderRadius: 28,
    padding: '24px 22px 20px',
    border: `1px solid ${BORDER}`,
    boxShadow: '0 8px 30px rgba(15,23,42,0.07)',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    minWidth: 0,
  },
  kpiHero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center' as const,
    paddingBottom: 14,
    borderBottom: `1px solid ${BORDER}`,
  },
  kpiRingWrap: {
    position: 'relative' as const,
    width: 100,
    height: 100,
    marginBottom: 14,
  },
  kpiRingIcon: {
    position: 'absolute' as const,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 52,
    height: 52,
    borderRadius: '50%',
    backgroundColor: '#fafafa',
    border: `1px solid ${BORDER}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.04)',
  },
  kpiHeroName: {
    fontSize: 13,
    fontWeight: 750,
    color: SLATE_SOFT,
    letterSpacing: '-0.02em',
    marginBottom: 6,
    lineHeight: 1.35,
    maxWidth: '100%',
    padding: '0 8px',
  },
  kpiMegaValue: {
    fontSize: 40,
    fontWeight: 950,
    letterSpacing: '-0.05em',
    color: SLATE,
    lineHeight: 1,
    marginBottom: 8,
  },
  kpiHeroCaption: {
    fontSize: 12,
    fontWeight: 500,
    color: MUTED,
    lineHeight: 1.45,
    padding: '0 12px',
    maxWidth: 280,
  },
  kpiTrendLine: {
    fontSize: 11,
    fontWeight: 750,
    padding: '12px 4px 14px',
    textAlign: 'center' as const,
    borderBottom: `1px solid ${BORDER}`,
  },
  kpiSectionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    paddingLeft: 2,
    paddingRight: 2,
  },
  kpiSectionTitle: {
    fontSize: 15,
    fontWeight: 850,
    color: SLATE,
    letterSpacing: '-0.02em',
  },
  kpiViewAll: {
    fontSize: 11,
    fontWeight: 800,
    color: SURFACE,
    backgroundColor: SLATE,
    border: 'none',
    borderRadius: 10,
    padding: '8px 14px',
    cursor: 'pointer',
  },
  kpiDateHint: {
    fontSize: 11,
    fontWeight: 650,
    color: MUTED,
    marginBottom: 10,
    paddingLeft: 2,
  },
  kpiBreakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  kpiBreakdownRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 12px',
    borderRadius: 16,
    backgroundColor: '#fafafa',
    border: `1px solid transparent`,
  },
  kpiBreakdownRowLift: {
    backgroundColor: SURFACE,
    border: `1px solid ${BORDER}`,
    boxShadow: '0 6px 18px rgba(15,23,42,0.08)',
  },
  kpiRowIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: SURFACE,
    border: `1px solid ${BORDER}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiRowCopy: {
    flex: 1,
    minWidth: 0,
  },
  kpiRowLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: SLATE,
    letterSpacing: '-0.02em',
  },
  kpiRowCategory: {
    fontSize: 11,
    fontWeight: 600,
    color: MUTED,
    marginTop: 2,
  },
  kpiRowAmount: {
    fontSize: 14,
    fontWeight: 850,
    letterSpacing: '-0.03em',
    flexShrink: 0,
  },
  chartRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 24,
    border: `1px solid ${BORDER}`,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  cardLift: {
    boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 850,
    margin: 0,
    color: SLATE,
    letterSpacing: '-0.02em',
  },
  cardMeta: {
    fontSize: 13,
    color: MUTED,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  cardSub: {
    fontSize: 12,
    color: MUTED,
    margin: '8px 0 0',
    fontWeight: 500,
    lineHeight: 1.45,
  },
  monthChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    color: SLATE_SOFT,
    backgroundColor: '#f8fafc',
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: '6px 12px',
    cursor: 'pointer',
  },
  timeFilter: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderRadius: 12,
    gap: 4,
    border: `1px solid ${BORDER}`,
  },
  timeFilterIdle: {
    padding: '6px 14px',
    fontSize: 11,
    fontWeight: 700,
    color: MUTED,
    borderRadius: 10,
  },
  timeFilterActive: {
    padding: '6px 14px',
    backgroundColor: SURFACE,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 800,
    color: ACCENT,
    boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    fontWeight: 700,
    color: SLATE_SOFT,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  mapBtn: {
    marginTop: 16,
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    border: `1px solid ${BORDER}`,
    fontSize: 12,
    fontWeight: 800,
    color: ACCENT,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tableTabs: {
    display: 'flex',
    gap: 24,
    borderBottom: `1px solid ${BORDER}`,
    marginTop: 16,
  },
  tableTabActive: {
    padding: '12px 0',
    borderBottom: `2px solid ${ACCENT}`,
    color: ACCENT,
    fontSize: 12,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  tableTab: {
    padding: '12px 0',
    color: MUTED,
    fontSize: 12,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  table: {
    marginTop: 0,
  },
  tableHead: {
    display: 'flex',
    padding: '14px 0',
    fontSize: 10,
    fontWeight: 800,
    color: MUTED,
    letterSpacing: '0.04em',
    borderBottom: `1px solid ${BORDER}`,
  },
  tableEmpty: {
    padding: '44px 16px',
    textAlign: 'center',
    fontSize: 13,
    color: MUTED,
    lineHeight: 1.5,
    fontWeight: 500,
  },
  legendSmall: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 14,
  },
  metaChip: {
    marginLeft: 'auto',
    fontSize: 11,
    fontWeight: 800,
    color: ACCENT_MUTED,
    backgroundColor: ACCENT_FILL,
    padding: '4px 10px',
    borderRadius: 8,
  },
};

export default IntelligenceDashboard;
