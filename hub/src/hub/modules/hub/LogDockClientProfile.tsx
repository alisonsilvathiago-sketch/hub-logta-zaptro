import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, HardDrive, TrendingUp, Shield, RotateCcw,
  FileText, Film, Box, Clock, AlertTriangle, CheckCircle2,
  Lock, Edit3, Save, X
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import LogtaModal from '@shared/components/Modal';
import { toastSuccess } from '@core/lib/toast';

const MOCK_CLIENTS: Record<string, any> = {
  '1': { id: '1', name: 'Transportadora Falcão', email: 'contato@falcao.com.br', plan: 'Start', used: 12.5, total: 15, files: 1420, zaptro: true, logta: true, logdock: true, ia: false, backup: true, status: 'active' },
  '2': { id: '2', name: 'Logística Express XPTO', email: 'ti@expressxpto.com', plan: 'Pro', used: 48.2, total: 50, files: 8900, zaptro: true, logta: true, logdock: true, ia: true, backup: true, status: 'warning' },
  '3': { id: '3', name: 'Cargas Rápidas BR', email: 'admin@cargasrapidas.com.br', plan: 'Start', used: 8.1, total: 15, files: 310, zaptro: true, logta: false, logdock: true, ia: false, backup: false, status: 'active' },
  '4': { id: '4', name: 'Transcontinental S.A.', email: 'ti@transcontinental.com', plan: 'Enterprise', used: 110.5, total: 150, files: 45000, zaptro: true, logta: true, logdock: true, ia: true, backup: true, status: 'active' },
};

const MOCK_UPLOADS = [
  { id: 101, file: 'CTe_94812.pdf', size: '2.4 MB', time: 'Há 5 min', type: 'doc' },
  { id: 102, file: 'POD_Assinatura.mp4', size: '45.1 MB', time: 'Há 12 min', type: 'media' },
  { id: 103, file: 'Relatorio_Frota.xlsx', size: '1.2 MB', time: 'Há 28 min', type: 'doc' },
];

const MOCK_SNAPSHOTS = [
  { id: 1, date: 'Hoje 12:00', size: '12.5 GB', type: 'Automático' },
  { id: 2, date: 'Ontem 23:00', size: '12.1 GB', type: 'Automático' },
  { id: 3, date: '06/05 12:00', size: '11.8 GB', type: 'Manual' },
];

const LogDockClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = MOCK_CLIENTS[id || '1'] || MOCK_CLIENTS['1'];

  const [activeTab, setActiveTab] = useState<'espaco' | 'uploads' | 'seguranca' | 'backups'>('espaco');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: client.name, email: client.email, plan: client.plan, total: String(client.total) });
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedSnap, setSelectedSnap] = useState<any>(null);

  const pct = (client.used / Number(editForm.total)) * 100;

  const handleSave = () => {
    toastSuccess(`Dados de "${editForm.name}" atualizados com sucesso!`);
    setIsEditing(false);
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate('/master/logdock-admin')}>
            <ArrowLeft size={20} />
          </button>
          <div style={styles.avatar}>{client.name[0]}</div>
          <div>
            {isEditing ? (
              <input
                value={editForm.name}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                style={styles.editInput}
              />
            ) : (
              <h1 style={styles.clientName}>{editForm.name}</h1>
            )}
            <p style={styles.clientSub}>{editForm.email} · Plano {editForm.plan}</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          {isEditing ? (
            <>
              <button style={styles.cancelBtn} onClick={() => setIsEditing(false)}><X size={16} /> Cancelar</button>
              <button style={styles.saveBtn} onClick={handleSave}><Save size={16} /> Salvar</button>
            </>
          ) : (
            <button style={styles.editBtn} onClick={() => setIsEditing(true)}><Edit3 size={16} /> Editar Cliente</button>
          )}
        </div>
      </header>

      {/* TABS */}
      <div style={styles.content}>
        <div style={styles.tabs}>
          {([
            ['espaco', HardDrive, 'Gestão de Espaço'],
            ['uploads', TrendingUp, 'Monitor de Uploads'],
            ['seguranca', Shield, 'Segurança & Logs'],
            ['backups', RotateCcw, 'Backups & Restore'],
          ] as const).map(([key, Icon, label]) => (
            <button
              key={key}
              style={{ ...styles.tabBtn, ...(activeTab === key ? styles.tabBtnActive : {}) }}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* GESTÃO DE ESPAÇO */}
        {activeTab === 'espaco' && (
          <div style={styles.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Armazenamento Usado" value={`${client.used} GB`} icon={HardDrive} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Limite Atual" value={`${editForm.total} GB`} icon={HardDrive} accent="#8B5CF6" softBg="#F5F3FF" />
              <HubMetricCard label="Arquivos Armazenados" value={client.files.toLocaleString()} icon={FileText} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Uso %" value={`${pct.toFixed(0)}%`} icon={AlertTriangle} accent={pct > 90 ? '#EF4444' : '#F59E0B'} softBg={pct > 90 ? '#FEF2F2' : '#FFF7ED'} />
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Configuração de Armazenamento</h3>

              <div style={styles.storageVisual}>
                <div style={styles.storageBar}>
                  <div style={{ ...styles.storageFill, width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 90 ? '#EF4444' : '#0061FF' }} />
                </div>
                <div style={styles.storageLegend}>
                  <span style={styles.usedText}>{client.used} GB usados</span>
                  <span style={styles.totalText}>Limite: {editForm.total} GB</span>
                </div>
              </div>

              {isEditing && (
                <div style={styles.editSection}>
                  <label style={styles.fieldLabel}>Novo Limite de Armazenamento (GB)</label>
                  <input
                    type="number"
                    value={editForm.total}
                    onChange={e => setEditForm(p => ({ ...p, total: e.target.value }))}
                    style={styles.fieldInput}
                  />
                  <label style={styles.fieldLabel}>Plano</label>
                  <select
                    value={editForm.plan}
                    onChange={e => setEditForm(p => ({ ...p, plan: e.target.value }))}
                    style={styles.fieldInput}
                  >
                    {['Start', 'Pro', 'Enterprise'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              )}

              <div style={styles.productsGrid}>
                {[
                  { label: 'Zaptro', active: client.zaptro, color: '#0061FF' },
                  { label: 'Logta', active: client.logta, color: '#10B981' },
                  { label: 'LogDock', active: client.logdock, color: '#8B5CF6' },
                  { label: 'IA Créditos', active: client.ia, color: '#F59E0B' },
                  { label: 'Backups', active: client.backup, color: '#EF4444' },
                ].map(p => (
                  <div key={p.label} style={styles.productTag}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.active ? p.color : '#CBD5E1', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: p.active ? '#1E293B' : '#CBD5E1' }}>{p.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '800', color: p.active ? p.color : '#CBD5E1' }}>{p.active ? 'Ativo' : 'Inativo'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MONITOR DE UPLOADS */}
        {activeTab === 'uploads' && (
          <div style={styles.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Uploads Hoje" value="124" icon={TrendingUp} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Volume Hoje" value="3.2 GB" icon={HardDrive} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Arquivos Total" value={client.files.toLocaleString()} icon={FileText} accent="#8B5CF6" softBg="#F5F3FF" />
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Histórico de Uploads Recentes</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Arquivo</th>
                    <th style={styles.th}>Tipo</th>
                    <th style={styles.th}>Tamanho</th>
                    <th style={styles.th}>Enviado</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_UPLOADS.map(up => (
                    <tr key={up.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.fileCell}>
                          {up.type === 'doc' ? <FileText size={18} color="#EF4444" /> : <Film size={18} color="#0061FF" />}
                          <span style={styles.fileName}>{up.file}</span>
                        </div>
                      </td>
                      <td style={styles.td}><span style={styles.badge}>{up.type.toUpperCase()}</span></td>
                      <td style={styles.td}><span style={styles.badgeLight}>{up.size}</span></td>
                      <td style={styles.td}><span style={styles.timeText}><Clock size={13} /> {up.time}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEGURANÇA & LOGS */}
        {activeTab === 'seguranca' && (
          <div style={styles.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Criptografia" value="AES-256" icon={Lock} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Acessos Negados" value="2" icon={AlertTriangle} accent="#EF4444" softBg="#FEF2F2" />
              <HubMetricCard label="Logs de Auditoria" value="492" icon={Shield} accent="#8B5CF6" softBg="#F5F3FF" />
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Trilha de Auditoria</h3>
              {[
                { action: 'Upload autorizado', detail: 'CTe_94812.pdf', time: '14:32', color: '#10B981', icon: '↑' },
                { action: 'Login realizado', detail: 'IP: 189.40.12.3 · Chrome / macOS', time: '13:15', color: '#0061FF', icon: '→' },
                { action: 'Arquivo excluído (lixeira)', detail: 'POD_Antigo_2024.pdf', time: '11:20', color: '#F59E0B', icon: '⌫' },
                { action: 'Acesso negado', detail: 'IP não autorizado: 203.45.12.99', time: '09:05', color: '#EF4444', icon: '✕' },
              ].map((ev, i) => (
                <div key={i} style={styles.auditRow}>
                  <div style={{ ...styles.auditIcon, backgroundColor: ev.color + '15' }}>{ev.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={styles.auditTitle}>{ev.action}</p>
                    <p style={styles.auditDetail}>{ev.detail}</p>
                  </div>
                  <span style={styles.auditTime}>{ev.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BACKUPS & RESTORE */}
        {activeTab === 'backups' && (
          <div style={styles.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Snapshots" value={String(MOCK_SNAPSHOTS.length)} icon={HardDrive} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Último Backup" value="Hoje 12h" icon={CheckCircle2} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Volume Backupado" value={`${client.used} GB`} icon={RotateCcw} accent="#8B5CF6" softBg="#F5F3FF" />
            </div>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Snapshots Disponíveis</h3>
                <button style={styles.actionBtnSm} onClick={() => toastSuccess(`Backup manual de "${client.name}" iniciado!`)}>
                  <HardDrive size={14} /> Ativar Backup Agora
                </button>
              </div>
              {MOCK_SNAPSHOTS.map(snap => (
                <div key={snap.id} style={styles.snapRow}>
                  <div style={styles.snapIcon}><HardDrive size={18} color="#0061FF" /></div>
                  <div style={{ flex: 1 }}>
                    <p style={styles.snapTitle}>{snap.date}</p>
                    <p style={styles.snapSub}>{snap.size} · {snap.type}</p>
                  </div>
                  <span style={styles.snapOk}>✓ OK</span>
                  <button style={styles.actionBtnSm} onClick={() => { setSelectedSnap(snap); setIsRestoreOpen(true); }}>
                    <RotateCcw size={13} /> Restaurar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL RESTAURAR */}
      <LogtaModal
        isOpen={isRestoreOpen}
        onClose={() => setIsRestoreOpen(false)}
        title="Restaurar Backup"
        subtitle={`Restaurar snapshot de ${selectedSnap?.date} para "${client.name}"`}
        icon={<RotateCcw color="#F59E0B" />}
        primaryAction={{
          label: 'Confirmar Restauração',
          onClick: () => {
            toastSuccess(`Restauração de "${client.name}" iniciada! Os dados serão recuperados em breve.`);
            setIsRestoreOpen(false);
          },
        }}
        secondaryAction={{ label: 'Cancelar', onClick: () => setIsRestoreOpen(false) }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', padding: '16px', borderRadius: '14px' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#92400E' }}>
              ⚠️ Esta ação irá restaurar <strong>todos os arquivos e dados</strong> de "{client.name}" para o estado do snapshot selecionado.
            </p>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
            {[['Cliente', client.name], ['Data do Snapshot', selectedSnap?.date], ['Volume', selectedSnap?.size], ['Tipo', selectedSnap?.type]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>{k}</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </LogtaModal>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', minHeight: '100vh', overflowY: 'auto' },
  header: { padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderBottom: '1px solid #E2E8F0' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: { width: '44px', height: '44px', borderRadius: '14px', border: '2px solid #E2E8F0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' },
  avatar: { width: '52px', height: '52px', borderRadius: '16px', backgroundColor: '#0061FF', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '900' },
  clientName: { margin: 0, fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' },
  clientSub: { margin: 0, fontSize: '13px', color: '#64748B', fontWeight: '600' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  editBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #0061FF', backgroundColor: '#EFF6FF', color: '#0061FF', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  cancelBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  saveBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #0061FF', backgroundColor: '#0061FF', color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  editInput: { fontSize: '22px', fontWeight: '900', color: '#0F172A', border: '2px solid #0061FF', borderRadius: '12px', padding: '8px 16px', outline: 'none' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: { display: 'flex', gap: '8px', backgroundColor: '#FFFFFF', padding: '8px', borderRadius: '24px', width: 'fit-content', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '16px', border: 'none', background: 'none', color: '#64748B', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
  tabBtnActive: { backgroundColor: '#EFF6FF', color: '#0061FF' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' },
  storageVisual: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' },
  storageBar: { height: '12px', backgroundColor: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' },
  storageFill: { height: '100%', borderRadius: '6px', transition: 'width 1s ease' },
  storageLegend: { display: 'flex', justifyContent: 'space-between' },
  usedText: { fontSize: '13px', fontWeight: '700', color: '#475569' },
  totalText: { fontSize: '13px', fontWeight: '700', color: '#94A3B8' },
  editSection: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' },
  fieldLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  fieldInput: { padding: '12px 16px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '15px', fontWeight: '700', color: '#0F172A', outline: 'none' },
  productsGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  productTag: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '16px', border: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '18px 20px', verticalAlign: 'middle' },
  fileCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  fileName: { fontSize: '14px', fontWeight: '700', color: '#1E293B' },
  badge: { padding: '4px 10px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '6px', fontSize: '11px', fontWeight: '800' },
  badgeLight: { padding: '4px 10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', borderRadius: '6px', fontSize: '11px', fontWeight: '800' },
  timeText: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#94A3B8' },
  auditRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  auditIcon: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 },
  auditTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  auditDetail: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  auditTime: { fontSize: '12px', fontWeight: '700', color: '#CBD5E1' },
  snapRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  snapIcon: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  snapTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  snapSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  snapOk: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', backgroundColor: '#F0FDF4', color: '#10B981' },
  actionBtnSm: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '999px', border: '2px solid #0061FF', backgroundColor: '#EFF6FF', color: '#0061FF', fontSize: '12px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' },
};

export default LogDockClientProfile;
