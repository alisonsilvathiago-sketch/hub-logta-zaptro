import React, { useState } from 'react';
import { PieChart, TrendingUp, BarChart2, Calendar, FileText, Download, Users, RefreshCw, Star } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState('month');

  return (
    <div style={styles.container}>
      {/* HEADER DE RELATÓRIOS */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Relatórios & BI Logístico</h1>
          <p style={styles.subtitle}>Visão financeira, ranking de motoristas, performance de entregas e exportação.</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.exportBtn} onClick={() => alert('Download do relatório em PDF iniciado!')}>
            <FileText size={18} /> Exportar PDF
          </button>
          <button style={{ ...styles.exportBtn, backgroundColor: '#10B981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }} onClick={() => alert('Download do relatório em Excel iniciado!')}>
            <Download size={18} /> Exportar Excel
          </button>
        </div>
      </header>

      {/* FILTROS DE TEMPO */}
      <div style={styles.filterBar}>
        <button style={{ ...styles.filterTab, borderBottom: timeFilter === 'week' ? '3px solid #0061FF' : 'none', color: timeFilter === 'week' ? '#0061FF' : '#64748B' }} onClick={() => setTimeFilter('week')}>Última Semana</button>
        <button style={{ ...styles.filterTab, borderBottom: timeFilter === 'month' ? '3px solid #0061FF' : 'none', color: timeFilter === 'month' ? '#0061FF' : '#64748B' }} onClick={() => setTimeFilter('month')}>Mês Atual</button>
        <button style={{ ...styles.filterTab, borderBottom: timeFilter === 'year' ? '3px solid #0061FF' : 'none', color: timeFilter === 'year' ? '#0061FF' : '#64748B' }} onClick={() => setTimeFilter('year')}>Ano Corrente</button>
      </div>

      {/* PAINEL DE CARDS DE INDICADORES (KPIs) */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <TrendingUp size={22} color="#0061FF" />
            <span style={styles.kpiLabel}>Custo por Operação (Médio)</span>
          </div>
          <span style={styles.kpiValue}>R$ 1.280,00</span>
          <span style={styles.kpiTrend}>↓ 4.5% em relação ao mês anterior</span>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <BarChart2 size={22} color="#10B981" />
            <span style={styles.kpiLabel}>Performance de Entregas</span>
          </div>
          <span style={styles.kpiValue}>96.8%</span>
          <span style={styles.kpiTrend}>↑ 2.1% Acima da meta</span>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <Users size={22} color="#8B5CF6" />
            <span style={styles.kpiLabel}>Ranking Médio Motoristas</span>
          </div>
          <span style={styles.kpiValue}>4.92 / 5.0</span>
          <span style={styles.kpiTrend}>Satisfação do cliente final</span>
        </div>
      </div>

      {/* ANALYTICS SECTIONS */}
      <div style={styles.analyticsWorkspace}>
        {/* FINANCIAL & LOGISTICS SUMMARY TABLE */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Desempenho Financeiro e Logístico</h3>
          <p style={styles.cardDesc}>Análise detalhada por transportadora e por frota.</p>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>TRANSPORTADORA</th>
                  <th style={styles.th}>ENTREGAS</th>
                  <th style={styles.th}>ON-TIME</th>
                  <th style={styles.th}>CUSTO TOTAL</th>
                  <th style={styles.th}>PRODUTIVIDADE</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'TransVelo S/A', runs: 124, onTime: '98%', cost: 'R$ 153.200', score: 'Alta' },
                  { name: 'Expresso Logística', runs: 85, onTime: '92%', cost: 'R$ 108.900', score: 'Média' },
                  { name: 'Rapido Cometa', runs: 62, onTime: '100%', cost: 'R$ 79.400', score: 'Excelente' }
                ].map((row, i) => (
                  <tr key={i} style={styles.tdRow}>
                    <td style={styles.td}><strong>{row.name}</strong></td>
                    <td style={styles.td}>{row.runs}</td>
                    <td style={styles.td} style={{ color: row.onTime === '100%' ? '#10B981' : '#1E1E1E', fontWeight: 'bold' }}>{row.onTime}</td>
                    <td style={styles.td}>{row.cost}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, backgroundColor: row.score === 'Excelente' ? '#D1FAE5' : row.score === 'Alta' ? '#DBEAFE' : '#FEF3C7', color: row.score === 'Excelente' ? '#065F46' : row.score === 'Alta' ? '#1D4ED8' : '#D97706' }}>
                        {row.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RANKING MOTORISTAS (TOP RATINGS) */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Ranking de Motoristas</h3>
          <p style={styles.cardDesc}>Satisfação do cliente e avaliação de comportamento de condução.</p>
          <div style={styles.rankList}>
            {[
              { name: 'Carlos Lima', rate: 4.98, trips: 45 },
              { name: 'Ana Paula', rate: 4.95, trips: 42 },
              { name: 'Roberto Dias', rate: 4.88, trips: 38 },
              { name: 'Marcos Silva', rate: 4.84, trips: 40 }
            ].map((driver, index) => (
              <div key={index} style={styles.rankItem}>
                <div style={styles.rankLeft}>
                  <span style={styles.rankPosition}>#{index + 1}</span>
                  <div style={styles.rankIdentity}>
                    <span style={styles.driverName}>{driver.name}</span>
                    <span style={styles.driverTrips}>{driver.trips} viagens</span>
                  </div>
                </div>
                <div style={styles.rankRating}>
                  <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  <span>{driver.rate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px', height: '100%', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748B', marginTop: '6px' },
  headerActions: { display: 'flex', gap: '16px' },
  exportBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', backgroundColor: '#0061FF', color: '#FFF', fontSize: '14px', fontWeight: '800', cursor: 'pointer', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0, 97, 255, 0.2)' },
  filterBar: { display: 'flex', gap: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '2px' },
  filterTab: { background: 'none', border: 'none', padding: '12px 16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', outline: 'none' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  kpiCard: { padding: '24px', backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' },
  kpiHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  kpiLabel: { fontSize: '13px', color: '#64748B', fontWeight: '700' },
  kpiValue: { fontSize: '32px', fontWeight: '900', color: '#1E1E1E' },
  kpiTrend: { fontSize: '11px', color: '#10B981', fontWeight: '700' },
  analyticsWorkspace: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
  card: { padding: '32px', backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '16px' },
  cardTitle: { fontSize: '18px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  cardDesc: { fontSize: '13px', color: '#64748B', margin: 0 },
  tableWrapper: { border: '1px solid #F1F5F9', borderRadius: '16px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' },
  th: { padding: '14px 20px', fontSize: '12px', fontWeight: '800', color: '#64748B' },
  tdRow: { borderBottom: '1px solid #FBFBFB' },
  td: { padding: '16px 20px', fontSize: '14px' },
  badge: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' },
  rankList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  rankItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#FBFBFB', borderRadius: '16px', border: '1px solid #F1F5F9' },
  rankLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  rankPosition: { fontSize: '16px', fontWeight: '900', color: '#0061FF' },
  rankIdentity: { display: 'flex', flexDirection: 'column', gap: '2px' },
  driverName: { fontSize: '14px', fontWeight: '800', color: '#1E1E1E' },
  driverTrips: { fontSize: '11px', color: '#64748B', fontWeight: '700' },
  rankRating: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '900', color: '#1E1E1E' }
};

export default ReportsPage;
