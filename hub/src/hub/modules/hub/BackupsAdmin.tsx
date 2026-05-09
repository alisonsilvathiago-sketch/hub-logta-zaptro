import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database, Activity, Search, Clock, AlertTriangle, CheckCircle2,
  Lock, HardDrive, Shield, CloudDownload, RefreshCw, Archive
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import { toastSuccess } from '@core/lib/toast';
import { HUB_PAGE_SUBTITLE } from '@hub/styles/hubPageTypography';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';

const MOCK_CLIENTS = [
  { id: 1, name: 'Transportadora Falcão', size: '12.4 GB', frequency: 'Diário', last: 'Há 2h', status: 'ok', backup: true },
  { id: 2, name: 'Logística Express XPTO', size: '240.8 GB', frequency: '6h em 6h', last: 'Há 15 min', status: 'ok', backup: true },
  { id: 3, name: 'Cargas Rápidas BR', size: '2.1 GB', frequency: 'Semanal', last: 'Há 5 dias', status: 'warning', backup: false },
  { id: 4, name: 'Transcontinental S.A.', size: '1.2 TB', frequency: 'Tempo Real', last: 'Há 2 min', status: 'ok', backup: true },
];

const BackupsAdmin: React.FC = () => {
  const navigate = useNavigate();
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

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Total Armazenado" value="2.8 TB" icon={HardDrive} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Backups Hoje" value="1,240" icon={CheckCircle2} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Falhas Detectadas" value="0" icon={AlertTriangle} accent="#EF4444" softBg="#FEF2F2" />
              <HubMetricCard label="Nodes Ativos" value="3 (AWS/GCP/Azure)" icon={Lock} accent="#8B5CF6" softBg="#F5F3FF" />
            </div>

            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Infraestrutura de Snapshots</h3>
                <div style={s.searchBox}><Search size={16} color="#94A3B8" /><input type="text" placeholder="Buscar cliente..." style={s.searchInput} /></div>
              </div>
              <table style={s.table}>
                <thead><tr><th style={s.th}>Cliente</th><th style={s.th}>Espaço</th><th style={s.th}>Frequência</th><th style={s.th}>Último Backup</th><th style={s.th}>Status</th><th style={s.th}>Ações</th></tr></thead>
                <tbody>
                  {MOCK_CLIENTS.map(c => (
                    <tr key={c.id} style={{ ...s.tr, cursor: 'pointer' }} onClick={() => navigate(`/master/backups/${c.id}`)}>
                      <td style={s.td}><span style={s.clientName}>{c.name}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.size}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.frequency}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.last}</span></td>
                      <td style={s.td}><span style={{ ...s.badge, color: c.status === 'ok' ? '#10B981' : '#F59E0B', backgroundColor: c.status === 'ok' ? '#F0FDF4' : '#FFFBEB' }}>{c.status === 'ok' ? 'Protegido' : 'Desatualizado'}</span></td>
                      <td style={s.td} onClick={e => e.stopPropagation()}>
                        <button style={s.actionBtn} onClick={() => navigate(`/master/backups/${c.id}`)}>Ver Detalhes</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* POLÍTICAS DE RETENÇÃO */}
        {activeTab === 'politicas' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Políticas Globais de Redundância</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Retenção Standard', desc: 'Snapshots diários em 3 regiões diferentes por 30 dias.', color: '#0061FF' },
                  { label: 'Retenção High-Frequency', desc: 'Snapshots a cada 1 hora em 2 regiões por 15 dias.', color: '#8B5CF6' },
                  { label: 'Cold Storage Archive', desc: 'Backups históricos movidos para Glacier após 1 ano.', color: '#64748B' },
                ].map((p, i) => (
                  <div key={i} style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1E293B' }}>{p.label}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>{p.desc}</p>
                    </div>
                    <button style={{ ...s.addBtn, padding: '8px 16px', fontSize: '12px' }}>Configurar</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SNAPSHOTS & LOGS */}
        {activeTab === 'logs' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Histórico de Snapshots & Verificações</h3>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#10B981', backgroundColor: '#F0FDF4', padding: '6px 14px', borderRadius: '20px' }}>● AO VIVO</span>
              </div>
              {[
                { event: 'Snapshot Diferencial Concluído', client: 'Transcontinental S.A.', time: '15:10', size: '1.2 GB', status: 'Success' },
                { event: 'Integrity Check: OK', client: 'Transportadora Falcão', time: '14:55', size: '—', status: 'Success' },
                { event: 'Full Backup Created', client: 'Logística Express XPTO', time: '12:00', size: '42.8 GB', status: 'Success' },
                { event: 'Cleanup: Snapshots Antigos Removidos', client: 'Sistema Master', time: '04:00', size: '-120 GB', status: 'Success' },
              ].map((log, i) => (
                <div key={i} style={s.auditRow}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Archive size={18} color="#0061FF" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={s.snapTitle}>{log.event} · <span style={{ color: '#64748B' }}>{log.client}</span></p>
                    <p style={s.snapSub}>{log.time} · Volume: {log.size}</p>
                  </div>
                  <CheckCircle2 size={16} color="#10B981" />
                </div>
              ))}
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
  title: { margin: 0, fontSize: '29px', fontWeight: '900', color: '#000000', letterSpacing: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
  subtitle: { ...HUB_PAGE_SUBTITLE },
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #0061FF', backgroundColor: '#EFF6FF', color: '#0061FF', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: hubPillTabStripStyles.container,
  tabBtn: hubPillTabStripStyles.button,
  tabActive: hubPillTabStripStyles.buttonActive,
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
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' },
  searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: '14px', fontWeight: '600', width: '180px' },
  actionBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '999px', border: '2px solid #0061FF', backgroundColor: '#EFF6FF', color: '#0061FF', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  auditRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  snapTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  snapSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
};

export default BackupsAdmin;
