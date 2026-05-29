import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Eye, Hourglass, MessagesSquare, Timer, Users2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useZaptroDashboardStats } from '../hooks/useZaptroDashboardStats';
import './zaptroAppDashboard.css';
import { ZAPTRO_APP_ROUTES } from './zaptroAppRoutes';

const ZaptroAppDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const stats = useZaptroDashboardStats(profile?.company_id);
  const name =
    profile?.full_name?.trim() ||
    profile?.email?.split('@')[0] ||
    'Utilizador';

  const [range, setRange] = useState<'semana' | 'mes'>('mes');

  const chartBars = range === 'semana' ? stats.weeklyChart : stats.monthlyChart;
  const chartMax = useMemo(
    () => Math.max(1, ...chartBars.map((b) => b.mensagens)),
    [chartBars],
  );

  const credits = useMemo(() => {
    const fromMeta = (profile as any)?.metadata?.credits;
    const n = typeof fromMeta === 'number' ? fromMeta : typeof fromMeta === 'string' ? Number(fromMeta) : NaN;
    return Number.isFinite(n) ? n : 1240;
  }, [profile]);

  return (
    <div className="zapdash">
      <div className="zapdash-wrap">
        <div className="zapdash-inner">
          <section className="zapdash-hero">
            <div className="zapdash-hero-left">
              <div className="zapdash-hero-title-row">
                <span className="zapdash-badge">BETA</span>
                <h1>
                  Olá, <strong>{name}</strong>
                  <span className="zapdash-emoji">🚀</span>
                </h1>
              </div>
            </div>
            <div className="zapdash-hero-right">
              <div className="zapdash-credit zapdash-credit--active">
                <span className="zapdash-credit-label">CRÉDITOS</span>
                <div className="zapdash-credit-value">
                  <strong>{credits.toLocaleString('pt-BR')}</strong>
                  <button type="button" className="zapdash-credit-eye" title="Ver detalhes" disabled>
                    <Eye size={18} strokeWidth={2.25} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="zapdash-row">
            <div className="zapdash-kpi">
              <div className="zapdash-kpi-top">
                <span className="zapdash-kpi-orb" aria-hidden>
                  <Hourglass size={18} strokeWidth={2.2} />
                </span>
                <span className="zapdash-kpi-label">Abertas</span>
                <span className="zapdash-kpi-pill">em espera</span>
              </div>
              <div className="zapdash-kpi-value">{stats.loading ? '…' : stats.openConversations}</div>
              <div className="zapdash-kpi-sub">Conversas aguardando</div>
            </div>

            <div className="zapdash-kpi">
              <div className="zapdash-kpi-top">
                <span className="zapdash-kpi-orb" aria-hidden>
                  <MessagesSquare size={18} strokeWidth={2.2} />
                </span>
                <span className="zapdash-kpi-label">Hoje</span>
                <span className="zapdash-kpi-pill">mensagens</span>
              </div>
              <div className="zapdash-kpi-value">{stats.loading ? '…' : stats.messagesToday}</div>
              <div className="zapdash-kpi-sub">Mensagens hoje</div>
            </div>

            <div className="zapdash-kpi">
              <div className="zapdash-kpi-top">
                <span className="zapdash-kpi-orb" aria-hidden>
                  <Users2 size={18} strokeWidth={2.2} />
                </span>
                <span className="zapdash-kpi-label">Base</span>
                <span className="zapdash-kpi-pill">clientes</span>
              </div>
              <div className="zapdash-kpi-value">{stats.loading ? '…' : stats.totalContacts}</div>
              <div className="zapdash-kpi-sub">Total de contatos</div>
            </div>

            <div className="zapdash-kpi">
              <div className="zapdash-kpi-top">
                <span className="zapdash-kpi-orb" aria-hidden>
                  <Timer size={18} strokeWidth={2.2} />
                </span>
                <span className="zapdash-kpi-label">SLA</span>
                <span className="zapdash-kpi-pill">tempo</span>
              </div>
              <div className="zapdash-kpi-value">{stats.loading ? '…' : stats.avgResponse}</div>
              <div className="zapdash-kpi-sub">Tempo médio de resposta</div>
            </div>
          </section>

          <section className="zapdash-grid">
            <div className="zapdash-card zapdash-card--chart">
              <div className="zapdash-card-head">
                <div>
                  <h3>Volume de mensagens</h3>
                  <p>Resumo de mensagens no período selecionado.</p>
                </div>
                <div className="zapdash-toggle">
                  <button
                    type="button"
                    className={range === 'semana' ? 'active' : ''}
                    onClick={() => setRange('semana')}
                  >
                    Semana
                  </button>
                  <button
                    type="button"
                    className={range === 'mes' ? 'active' : ''}
                    onClick={() => setRange('mes')}
                  >
                    Mês
                  </button>
                </div>
              </div>
              <div className="zapdash-chart">
                <div className="zapdash-chart-grid" />
                <div className="zapdash-chart-bars">
                  {chartBars.map((bar) => (
                    <div key={bar.name} className="zapdash-chart-bar-wrap" title={`${bar.mensagens} mensagens`}>
                      <div
                        className="zapdash-chart-bar"
                        style={{ height: `${Math.max(4, (bar.mensagens / chartMax) * 100)}%` }}
                      />
                      <span className="zapdash-chart-bar-label">{bar.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="zapdash-card zapdash-card--queue">
              <div className="zapdash-card-head">
                <div>
                  <h3>Fila de atendimento</h3>
                  <p>Quem fica por último quando o foco num contato parou.</p>
                </div>
                <BarChart3 size={18} strokeWidth={2} />
              </div>
              {stats.queue.length === 0 ? (
                <div className="zapdash-empty">
                  <strong>Sem conversas recentes na base.</strong>
                  <span>Abra o WhatsApp ou vá a Conversas para começar.</span>
                </div>
              ) : (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stats.queue.map((item) => (
                    <Link
                      key={item.id}
                      to={`${ZAPTRO_APP_ROUTES.INBOX}?c=${encodeURIComponent(item.id)}`}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 14,
                        background: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        textDecoration: 'none',
                      }}
                    >
                      <strong style={{ fontSize: 13, color: '#0f172a' }}>{item.name}</strong>
                      <span style={{ fontSize: 12, color: '#949494', fontWeight: 600 }}>{item.preview}</span>
                      <span style={{ fontSize: 11, color: '#949494', fontWeight: 600 }}>{item.time}</span>
                    </Link>
                  ))}
                </div>
              )}
              <div className="zapdash-actions">
                <Link to={ZAPTRO_APP_ROUTES.INBOX} className="zapdash-ghost-btn">
                  Histórico completo
                </Link>
              </div>
            </div>
          </section>

          <section className="zapdash-card zapdash-card--thin">
            <div className="zapdash-card-head">
              <div>
                <h3>Automação (resumo)</h3>
                <p>Ajustes de atendimento e follow-ups.</p>
              </div>
              <Link to={`${ZAPTRO_APP_ROUTES.SETTINGS}?tab=automation`} className="zapdash-ghost-btn">
                Abrir automações
              </Link>
            </div>
            <div className="zapdash-muted-row">
              <span>Agentes de atendimento no esquema: <strong>{stats.loading ? '…' : stats.agents}</strong></span>
              <span>Mensagens automatizadas: <strong>0</strong></span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ZaptroAppDashboardPage;
