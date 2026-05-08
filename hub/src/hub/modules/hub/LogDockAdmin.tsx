import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, HardDrive, Users, Shield, TrendingUp, 
  Activity, Search,
  FileText, Film, Lock, AlertTriangle, CheckCircle2,
  Box, Clock, UserPlus, ExternalLink, Receipt, RotateCcw
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import LogtaModal from '@shared/components/Modal';
import Button from '@shared/components/Button';
import { toastSuccess } from '@core/lib/toast';

const MOCK_CLIENTS = [
  { id: 1, name: 'Transportadora Falcão', used: 12.5, total: 15, plan: 'Start', status: 'active', files: 1420 },
  { id: 2, name: 'Logística Express XPTO', used: 48.2, total: 50, plan: 'Pro', status: 'warning', files: 8900 },
  { id: 3, name: 'Cargas Rápidas BR', used: 8.1, total: 15, plan: 'Start', status: 'active', files: 310 },
  { id: 4, name: 'Transcontinental S.A.', used: 110.5, total: 150, plan: 'Enterprise', status: 'active', files: 45000 },
];

const MOCK_UPLOADS = [
  { id: 101, client: 'Transportadora Falcão', file: 'CTe_94812.pdf', size: '2.4 MB', time: 'Há 5 min', type: 'doc' },
  { id: 102, client: 'Logística Express XPTO', file: 'POD_Assinatura_Video.mp4', size: '45.1 MB', time: 'Há 12 min', type: 'media' },
  { id: 103, client: 'Cargas Rápidas BR', file: 'Relatorio_Frota_Maio.xlsx', size: '1.2 MB', time: 'Há 28 min', type: 'doc' },
  { id: 104, client: 'Transcontinental S.A.', file: 'Backup_Geral_Q1.zip', size: '1.2 GB', time: 'Há 2 horas', type: 'archive' },
];

const LogDockAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clientes' | 'uploads' | 'seguranca' | 'backups'>('dashboard');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);
  const [newPlanAmount, setNewPlanAmount] = useState('50');
  const [newClient, setNewClient] = useState({ name: '', email: '', password: '', plan: 'Start', storage: '15' });

  const handleOpenUpgrade = (client: any) => {
    setSelectedClient(client);
    setIsUpgradeModalOpen(true);
  };

  const handleOpenBilling = (client: any) => {
    setSelectedClient(client);
    setIsBillingOpen(true);
  };

  const handleUpgradeSpace = () => {
    toastSuccess(`Limite de armazenamento da ${selectedClient?.name} alterado para ${newPlanAmount}GB com sucesso.`);
    setIsUpgradeModalOpen(false);
    setSelectedClient(null);
  };

  const handleAddClient = () => {
    if (!newClient.email || !newClient.name) return;
    toastSuccess(`Cliente "${newClient.name}" criado! Acesso ao LogDock liberado para ${newClient.email}.`);
    setIsAddClientOpen(false);
    setNewClient({ name: '', email: '', password: '', plan: 'Start', storage: '15' });
  };

  const handleGenerateBilling = () => {
    toastSuccess(`Cobrança de LogDock gerada para ${selectedClient?.name} com sucesso!`);
    setIsBillingOpen(false);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerTitle}>
          <Database size={32} color="#0061FF" />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' }}>
              LogDock Control Center
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748B', fontWeight: '600' }}>
              Painel Master de Administração do Drive Central
            </p>
          </div>
        </div>
        <button
          style={styles.addClientBtn}
          onClick={() => setIsAddClientOpen(true)}
        >
          <UserPlus size={16} /> Adicionar Cliente
        </button>
      </header>

      <div style={styles.content}>
        <div style={styles.tabs}>
          <button 
            style={{...styles.tabBtn, ...(activeTab === 'dashboard' ? styles.tabBtnActive : {})}}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={18} /> Dashboard
          </button>
          <button 
            style={{...styles.tabBtn, ...(activeTab === 'clientes' ? styles.tabBtnActive : {})}}
            onClick={() => setActiveTab('clientes')}
          >
            <Users size={18} /> Gestão de Espaço
          </button>
          <button 
            style={{...styles.tabBtn, ...(activeTab === 'uploads' ? styles.tabBtnActive : {})}}
            onClick={() => setActiveTab('uploads')}
          >
            <TrendingUp size={18} /> Monitor de Uploads
          </button>
          <button 
            style={{...styles.tabBtn, ...(activeTab === 'seguranca' ? styles.tabBtnActive : {})}}
            onClick={() => setActiveTab('seguranca')}
          >
            <Shield size={18} /> Segurança & Logs
          </button>
          <button 
            style={{...styles.tabBtn, ...(activeTab === 'backups' ? styles.tabBtnActive : {})}}
            onClick={() => setActiveTab('backups')}
          >
            <RotateCcw size={18} /> Backups & Restore
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div style={styles.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Armazenamento Total (Rede)" value="1.2 TB" icon={HardDrive} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Arquivos Gerenciados" value="142.5k" icon={FileText} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Contas em Alerta (90%+)" value="3" icon={AlertTriangle} accent="#F59E0B" softBg="#FFF7ED" />
              <HubMetricCard label="Uploads Hoje" value="8,492" icon={TrendingUp} accent="#8B5CF6" softBg="#F5F3FF" />
            </div>

            {/* FILTRO DE PRODUTOS */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Uso por Produto — Clientes Ativos</h3>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
                {['Todos', 'Zaptro', 'Logta', 'LogDock', 'IA Créditos', 'Backups'].map(prod => (
                  <button
                    key={prod}
                    style={{ padding: '8px 18px', borderRadius: '999px', border: '2px solid', borderColor: prod === 'Todos' ? '#0061FF' : '#E2E8F0', backgroundColor: prod === 'Todos' ? '#EFF6FF' : 'white', color: prod === 'Todos' ? '#0061FF' : '#64748B', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    {prod}
                  </button>
                ))}
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Cliente</th>
                    <th style={styles.th}>Zaptro</th>
                    <th style={styles.th}>Logta</th>
                    <th style={styles.th}>LogDock</th>
                    <th style={styles.th}>IA Créditos</th>
                    <th style={styles.th}>Backups</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Transportadora Falcão', zaptro: true, logta: true, logdock: true, ia: false, backup: true },
                    { name: 'Logística Express XPTO', zaptro: true, logta: true, logdock: true, ia: true, backup: true },
                    { name: 'Cargas Rápidas BR', zaptro: true, logta: false, logdock: true, ia: false, backup: false },
                    { name: 'Transcontinental S.A.', zaptro: true, logta: true, logdock: true, ia: true, backup: true },
                  ].map((c, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}><span style={styles.clientName}>{c.name}</span></td>
                      {[c.zaptro, c.logta, c.logdock, c.ia, c.backup].map((active, j) => (
                        <td key={j} style={styles.td}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', backgroundColor: active ? '#F0FDF4' : '#F8FAFC', color: active ? '#10B981' : '#CBD5E1' }}>
                            {active ? '✓ Ativo' : '—'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.dashboardGrid}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Consumo por Tipo de Arquivo</h3>
                <div style={styles.chartMock}>
                  <div style={styles.barRow}>
                    <span style={styles.barLabel}>Comprovantes (POD) - Imagem</span>
                    <div style={styles.barTrack}><div style={{...styles.barFill, width: '45%', backgroundColor: '#10B981'}} /></div>
                    <span style={styles.barValue}>45%</span>
                  </div>
                  <div style={styles.barRow}>
                    <span style={styles.barLabel}>Documentos Fiscais (PDF)</span>
                    <div style={styles.barTrack}><div style={{...styles.barFill, width: '30%', backgroundColor: '#0061FF'}} /></div>
                    <span style={styles.barValue}>30%</span>
                  </div>
                  <div style={styles.barRow}>
                    <span style={styles.barLabel}>Vídeos de Ocorrência</span>
                    <div style={styles.barTrack}><div style={{...styles.barFill, width: '15%', backgroundColor: '#8B5CF6'}} /></div>
                    <span style={styles.barValue}>15%</span>
                  </div>
                  <div style={styles.barRow}>
                    <span style={styles.barLabel}>Outros (Áudios, Excel, Zip)</span>
                    <div style={styles.barTrack}><div style={{...styles.barFill, width: '10%', backgroundColor: '#94A3B8'}} /></div>
                    <span style={styles.barValue}>10%</span>
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Status de Infraestrutura</h3>
                <div style={styles.statusList}>
                  <div style={styles.statusItem}>
                    <CheckCircle2 size={20} color="#10B981" />
                    <div>
                      <h4 style={styles.statusTitle}>Sincronização Zaptro</h4>
                      <p style={styles.statusDesc}>Operando normalmente. 12ms ping.</p>
                    </div>
                  </div>
                  <div style={styles.statusItem}>
                    <CheckCircle2 size={20} color="#10B981" />
                    <div>
                      <h4 style={styles.statusTitle}>Backup Automático</h4>
                      <p style={styles.statusDesc}>Último snapshot há 2 horas.</p>
                    </div>
                  </div>
                  <div style={styles.statusItem}>
                    <CheckCircle2 size={20} color="#10B981" />
                    <div>
                      <h4 style={styles.statusTitle}>Criptografia Master</h4>
                      <p style={styles.statusDesc}>AES-256 ativa em todos os volumes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clientes' && (
          <div style={styles.tabContent}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Gestão de Espaço por Cliente</h3>
                <div style={styles.searchBox}>
                  <Search size={18} color="#94A3B8" />
                  <input type="text" placeholder="Buscar cliente..." style={styles.searchInput} />
                </div>
              </div>
              
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Cliente</th>
                    <th style={styles.th}>Plano</th>
                    <th style={styles.th}>Arquivos</th>
                    <th style={styles.th}>Uso de Espaço</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CLIENTS.map(client => {
                    const pct = (client.used / client.total) * 100;
                    return (
                      <tr
                        key={client.id}
                        style={{ ...styles.tr, cursor: 'pointer' }}
                        onClick={() => navigate(`/master/logdock-admin/${client.id}`)}
                      >
                        <td style={styles.td}>
                          <span style={{ ...styles.clientName, color: '#0061FF', textDecoration: 'underline dotted' }}>{client.name}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.badge}>{client.plan}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.statsText}>{client.files.toLocaleString()}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.progressCell}>
                            <div style={styles.progressInfo}>
                              <span style={styles.progressText}>{client.used} GB / {client.total} GB</span>
                              <span style={{...styles.progressPct, color: pct > 90 ? '#EF4444' : '#64748B'}}>{pct.toFixed(0)}%</span>
                            </div>
                            <div style={styles.progressBar}>
                              <div style={{...styles.progressFill, width: `${pct}%`, backgroundColor: pct > 90 ? '#EF4444' : '#0061FF'}} />
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button style={styles.actionBtnSm} onClick={() => handleOpenUpgrade(client)}>
                              <HardDrive size={14} /> Limite
                            </button>
                            <button style={styles.actionBtnSm} onClick={() => window.open('https://logdock.com.br', '_blank')}>
                              <ExternalLink size={14} /> LogDock
                            </button>
                            <button style={{...styles.actionBtnSm, backgroundColor: '#F0FDF4', color: '#10B981', borderColor: '#10B981'}} onClick={() => handleOpenBilling(client)}>
                              <Receipt size={14} /> Cobrança
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'uploads' && (
          <div style={styles.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Uploads Hoje" value="8,492" icon={TrendingUp} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Volume Transferido" value="142 GB" icon={HardDrive} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Arquivos Bloqueados" value="7" icon={AlertTriangle} accent="#EF4444" softBg="#FEF2F2" />
              <HubMetricCard label="Clientes Ativos Hoje" value="38" icon={Users} accent="#8B5CF6" softBg="#F5F3FF" />
            </div>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Monitor de Uploads em Tempo Real</h3>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#10B981', backgroundColor: '#F0FDF4', padding: '6px 14px', borderRadius: '20px' }}>● AO VIVO</span>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Arquivo</th>
                    <th style={styles.th}>Cliente Origem</th>
                    <th style={styles.th}>Tipo</th>
                    <th style={styles.th}>Tamanho</th>
                    <th style={styles.th}>Upload</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_UPLOADS.map(up => (
                    <tr key={up.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.fileCell}>
                          {up.type === 'doc' ? <FileText size={20} color="#EF4444" /> : up.type === 'media' ? <Film size={20} color="#0061FF" /> : <Box size={20} color="#94A3B8" />}
                          <span style={styles.fileName}>{up.file}</span>
                        </div>
                      </td>
                      <td style={styles.td}><span style={styles.statsText}>{up.client}</span></td>
                      <td style={styles.td}><span style={styles.badge}>{up.type.toUpperCase()}</span></td>
                      <td style={styles.td}><span style={styles.badgeLight}>{up.size}</span></td>
                      <td style={styles.td}><span style={styles.timeText}><Clock size={14} /> {up.time}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'backups' && (
          <div style={styles.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Snapshots Ativos" value="142" icon={HardDrive} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Último Backup" value="Hoje 12h" icon={CheckCircle2} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Volume Backupado" value="847 GB" icon={Database} accent="#8B5CF6" softBg="#F5F3FF" />
              <HubMetricCard label="Restaurações (30d)" value="3" icon={RotateCcw} accent="#F59E0B" softBg="#FFF7ED" />
            </div>

            <div style={styles.dashboardGrid}>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Histórico de Snapshots</h3>
                  <button style={{...styles.actionBtnSm, display:'flex', alignItems:'center', gap:'6px'}} onClick={() => toastSuccess('Backup manual iniciado para todos os clientes!')}>
                    <HardDrive size={14} /> Ativar Backup Geral
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { id: 1, client: 'Todos os clientes', date: 'Hoje 12:00', size: '847 GB', type: 'Automático', status: 'ok' },
                    { id: 2, client: 'Logística Express XPTO', date: 'Ontem 23:00', size: '48.2 GB', type: 'Automático', status: 'ok' },
                    { id: 3, client: 'Transportadora Falcão', date: 'Ontem 23:00', size: '12.5 GB', type: 'Automático', status: 'ok' },
                    { id: 4, client: 'Cargas Rápidas BR', date: '06/05 23:00', size: '8.1 GB', type: 'Manual', status: 'ok' },
                    { id: 5, client: 'Transcontinental S.A.', date: '05/05 12:00', size: '110.5 GB', type: 'Automático', status: 'ok' },
                  ].map((snap) => (
                    <div key={snap.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 0', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HardDrive size={18} color="#0061FF" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{snap.client}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>{snap.date} · {snap.size} · {snap.type}</p>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', backgroundColor: '#F0FDF4', color: '#10B981' }}>✓ OK</span>
                      <button
                        style={{...styles.actionBtnSm, display:'flex', alignItems:'center', gap:'6px'}}
                        onClick={() => { setSelectedSnapshot(snap); setIsRestoreOpen(true); }}
                      >
                        <RotateCcw size={13} /> Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={styles.card}>
                  <h3 style={{ ...styles.cardTitle, marginBottom: '20px' }}>Ativar Backup por Cliente</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {MOCK_CLIENTS.map(client => (
                      <div key={client.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F8FAFC' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>{client.name}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>{client.plan} · {client.used}GB usado</p>
                        </div>
                        <button
                          style={{...styles.actionBtnSm, fontSize:'11px', display:'flex', alignItems:'center', gap:'5px'}}
                          onClick={() => toastSuccess(`Backup manual de "${client.name}" iniciado!`)}
                        >
                          <HardDrive size={12} /> Backup
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'seguranca' && (
          <div style={styles.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Backup Automático" value="OK" icon={CheckCircle2} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Criptografia AES-256" value="Ativa" icon={Lock} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Tentativas Negadas" value="14" icon={AlertTriangle} accent="#EF4444" softBg="#FEF2F2" />
              <HubMetricCard label="Logs de Auditoria" value="3.2k" icon={Shield} accent="#8B5CF6" softBg="#F5F3FF" />
            </div>

            <div style={styles.dashboardGrid}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Trilha de Auditoria — Últimos Eventos</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {[
                    { action: 'Upload autorizado', detail: 'CTe_94812.pdf · Transportadora Falcão', time: '14:32', color: '#10B981', icon: '↑' },
                    { action: 'Acesso negado', detail: 'IP 203.45.12.99 tentou acessar volume restrito', time: '14:18', color: '#EF4444', icon: '✕' },
                    { action: 'Backup concluído', detail: 'Snapshot completo · 847 GB arquivados', time: '12:00', color: '#0061FF', icon: '✓' },
                    { action: 'Limite expandido', detail: 'Logística Express XPTO · 50GB → 100GB', time: '11:45', color: '#8B5CF6', icon: '↑' },
                    { action: 'Arquivo excluído (lixeira)', detail: 'POD_Antigo_2024.pdf · Cargas Rápidas BR', time: '10:30', color: '#F59E0B', icon: '⌫' },
                    { action: 'Criptografia reconfirmada', detail: 'Verificação AES-256 em todos os volumes', time: '08:00', color: '#10B981', icon: '🔒' },
                  ].map((ev, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: ev.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{ev.icon}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{ev.action}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>{ev.detail}</p>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#CBD5E1' }}>{ev.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={styles.card}>
                  <h3 style={{ ...styles.cardTitle, marginBottom: '20px' }}>Status de Backup</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { label: 'Último backup completo', value: 'Hoje 12:00', ok: true },
                      { label: 'Próximo snapshot', value: 'Em 6 horas', ok: true },
                      { label: 'Retenção configurada', value: '30 dias', ok: true },
                      { label: 'Volume total backupado', value: '847 GB', ok: true },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F8FAFC' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>{item.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: item.ok ? '#10B981' : '#EF4444' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.card}>
                  <h3 style={{ ...styles.cardTitle, marginBottom: '20px' }}>Permissões de Acesso</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { role: 'Master Admin', access: 'Total', color: '#0061FF' },
                      { role: 'Gestor Logta', access: 'Leitura + Upload', color: '#10B981' },
                      { role: 'Operador', access: 'Somente Leitura', color: '#F59E0B' },
                      { role: 'Cliente Final', access: 'Própria Conta', color: '#94A3B8' },
                    ].map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>{p.role}</span>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', backgroundColor: p.color + '15', color: p.color }}>{p.access}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL DE UPGRADE */}
      <LogtaModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Upgrade de Armazenamento LogDock"
        subtitle={`Ajustar limite de espaço para ${selectedClient?.name}`}
        icon={<HardDrive color="#0061FF" />}
        primaryAction={{
          label: 'Confirmar Novo Limite',
          onClick: handleUpgradeSpace,
        }}
        secondaryAction={{
          label: 'Cancelar',
          onClick: () => setIsUpgradeModalOpen(false)
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
          
          <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>Uso Atual</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>{selectedClient?.used} GB / {selectedClient?.total} GB</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(selectedClient?.used / selectedClient?.total) * 100}%`, backgroundColor: '#0061FF' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
              Novo Limite Total (em GB)
            </label>
            <input 
              type="number" 
              value={newPlanAmount}
              onChange={e => setNewPlanAmount(e.target.value)}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0', fontSize: '16px', fontWeight: '700', color: '#0F172A', outline: 'none' }}
            />
          </div>

        </div>
      </LogtaModal>

      {/* MODAL RESTAURAR BACKUP */}
      <LogtaModal
        isOpen={isRestoreOpen}
        onClose={() => setIsRestoreOpen(false)}
        title="Restaurar Backup"
        subtitle={`Restaurar snapshot de "${selectedSnapshot?.client}" — ${selectedSnapshot?.date}`}
        icon={<RotateCcw color="#F59E0B" />}
        primaryAction={{
          label: 'Confirmar Restauração',
          onClick: () => {
            toastSuccess(`Restauração iniciada! Os dados de "${selectedSnapshot?.client}" serão recuperados em breve.`);
            setIsRestoreOpen(false);
          },
        }}
        secondaryAction={{ label: 'Cancelar', onClick: () => setIsRestoreOpen(false) }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', padding: '16px', borderRadius: '14px' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#92400E' }}>
              ⚠️ Esta ação irá restaurar <strong>todos os arquivos e dados</strong> do cliente para o estado do snapshot selecionado.
            </p>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
            {[['Cliente', selectedSnapshot?.client], ['Data do Snapshot', selectedSnapshot?.date], ['Volume', selectedSnapshot?.size], ['Tipo', selectedSnapshot?.type]].map(([k, v]) => (
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
  header: { padding: '40px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { display: 'flex', alignItems: 'center', gap: '16px' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: { display: 'flex', gap: '8px', backgroundColor: '#FFFFFF', padding: '8px', borderRadius: '24px', width: 'fit-content', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '16px', border: 'none', background: 'none', color: '#64748B', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
  tabBtnActive: { backgroundColor: '#EFF6FF', color: '#0061FF' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.3s ease' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' },
  
  // Charts mock
  chartMock: { display: 'flex', flexDirection: 'column', gap: '20px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '16px' },
  barLabel: { width: '220px', fontSize: '13px', fontWeight: '700', color: '#475569' },
  barTrack: { flex: 1, height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '4px' },
  barValue: { width: '40px', textAlign: 'right', fontSize: '13px', fontWeight: '800', color: '#0F172A' },

  // Status
  statusList: { display: 'flex', flexDirection: 'column', gap: '24px' },
  statusItem: { display: 'flex', gap: '16px', alignItems: 'flex-start' },
  statusTitle: { margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  statusDesc: { margin: 0, fontSize: '13px', color: '#64748B' },

  // Table
  searchBox: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' },
  searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: '14px', fontWeight: '600', width: '200px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '20px', verticalAlign: 'middle' },
  clientName: { fontSize: '15px', fontWeight: '800', color: '#0F172A' },
  badge: { padding: '6px 12px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '8px', fontSize: '12px', fontWeight: '800' },
  badgeLight: { padding: '6px 12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', borderRadius: '8px', fontSize: '12px', fontWeight: '800' },
  statsText: { fontSize: '14px', fontWeight: '700', color: '#475569' },
  
  // Progress
  progressCell: { display: 'flex', flexDirection: 'column', gap: '8px', width: '250px' },
  progressInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: '13px', fontWeight: '700', color: '#475569' },
  progressPct: { fontSize: '12px', fontWeight: '800' },
  progressBar: { height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '4px' },

  // Files
  fileCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  fileName: { fontSize: '14px', fontWeight: '700', color: '#1E293B' },
  timeText: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#94A3B8' },

  // Compact action button
  actionBtnSm: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '999px', border: '2px solid #0061FF', backgroundColor: '#EFF6FF', color: '#0061FF', fontSize: '12px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' },

  // Header add client button
  addClientBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #0061FF', backgroundColor: '#EFF6FF', color: '#0061FF', fontSize: '14px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' },
};

export default LogDockAdmin;
