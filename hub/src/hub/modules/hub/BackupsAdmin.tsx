import React, { useState } from 'react';
import {
  Database, Activity, Search, Clock, AlertTriangle, CheckCircle2,
  Lock, HardDrive, Shield, CloudDownload, RefreshCw, Archive
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import { toastSuccess } from '@core/lib/toast';

const MOCK_CLIENTS = [
  { id: 1, name: 'Transportadora Falcão', size: '12.4 GB', frequency: 'Diário', last: 'Há 2h', status: 'ok', backup: true },
  { id: 2, name: 'Logística Express XPTO', size: '240.8 GB', frequency: '6h em 6h', last: 'Há 15 min', status: 'ok', backup: true },
  { id: 3, name: 'Cargas Rápidas BR', size: '2.1 GB', frequency: 'Semanal', last: 'Há 5 dias', status: 'warning', backup: false },
  { id: 4, name: 'Transcontinental S.A.', size: '1.2 TB', frequency: 'Tempo Real', last: 'Há 2 min', status: 'ok', backup: true },
];

const BackupsAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'politicas' | 'logs'>('dashboard');

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <Database size={32} color="#0061FF" />
          <div>
            <h1 style={s.title}>Sistema de Backups</h1>
            <p style={s.subtitle}>Gestão de Infraestrutura e Redundância de Dados</p>
          </div>
        </div>
        <button style={s.addBtn} onClick={() => toastSuccess('Verificação de integridade iniciada em todos os nodes.')}>
          <RefreshCw size={16} /> Verificar Integridade
        </button>
      </header>

      <div style={s.content}>
        <div style={s.tabs}>
          {[
            ['dashboard', Activity, 'Dashboard'],
            ['politicas', Shield, 'Políticas de Retenção'],
            ['logs', Archive, 'Snapshots & Logs'],
          ].map(([key, Icon, label]) => (
            <button key={key as string} style={{ ...s.tabBtn, ...(activeTab === key ? s.tabActive : {}) }} onClick={() => setActiveTab(key as any)}>
              <Icon size={16} /> {label as string}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Total Armazenado" value="2.8 TB" icon={HardDrive} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Backups Hoje" value="1,240" icon={CheckCircle2} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Falhas Detectadas" value="0" icon={AlertTriangle} accent="#EF4444" softBg="#FEF2F2" />
              <HubMetricCard label="Nodes Ativos" value="3 (AWS/GCP/Azure)" icon={Lock} accent="#8B5CF6" softBg="#F5F3FF" />
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Snapshots por Empresa</h3>
              <table style={s.table}>
                <thead><tr><th style={s.th}>Cliente</th><th style={s.th}>Espaço</th><th style={s.th}>Frequência</th><th style={s.th}>Último Backup</th><th style={s.th}>Status</th></tr></thead>
                <tbody>
                  {MOCK_CLIENTS.map(c => (
                    <tr key={c.id} style={s.tr}>
                      <td style={s.td}><span style={s.clientName}>{c.name}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.size}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.frequency}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.last}</span></td>
                      <td style={s.td}><span style={{ ...s.badge, color: c.status === 'ok' ? '#10B981' : '#F59E0B', backgroundColor: c.status === 'ok' ? '#F0FDF4' : '#FFFBEB' }}>{c.status === 'ok' ? 'Protegido' : 'Desatualizado'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', minHeight: '100vh', overflowY: 'auto' },
  header: { padding: '40px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  title: { margin: 0, fontSize: '24px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' },
  subtitle: { margin: 0, fontSize: '14px', color: '#64748B', fontWeight: '600' },
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #0061FF', backgroundColor: '#EFF6FF', color: '#0061FF', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: { display: 'flex', gap: '8px', padding: '8px 0', borderRadius: '24px', width: 'fit-content' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '16px', border: 'none', background: 'none', color: '#64748B', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  tabActive: { backgroundColor: '#EFF6FF', color: '#0061FF' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '18px 20px', verticalAlign: 'middle' },
  clientName: { fontSize: '15px', fontWeight: '800', color: '#1E293B' },
  stat: { fontSize: '14px', fontWeight: '700', color: '#475569' },
  badge: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' },
};

export default BackupsAdmin;
