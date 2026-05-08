import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Database, TrendingUp, Shield, HardDrive,
  Clock, AlertTriangle, CheckCircle2, Lock, Edit3, Save, X,
  FileText, DollarSign, Activity, Users, Building2,
  Phone, Mail, UserCheck, Key, ChevronRight, CloudDownload, RefreshCw
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import { toastSuccess } from '@core/lib/toast';

const MOCK_CLIENTS: Record<string, any> = {
  '1': { 
    id: '1', 
    name: 'Transportadora Falcão', 
    email: 'contato@falcao.com.br', 
    plan: 'Enterprise', 
    status: 'active',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 98765-4321',
    address: 'Av. das Indústrias, 1200 - São Paulo, SP',
    responsible: 'Ricardo Falcão',
    storageUsed: '1.2 TB',
    nodes: 'AWS / GCP / Azure',
    collaborators: [
      { id: 1, name: 'João Silva', role: 'DevOps', lastLogin: 'Há 2h' },
    ],
    backups: [
      { id: 1, name: 'Full Backup - ERP Database', size: '250 GB', date: 'Hoje, 02:00', status: 'Success' },
      { id: 2, name: 'Incremental - Fileshare', size: '12 GB', date: 'Hoje, 08:00', status: 'Success' },
    ]
  },
};

const BackupsClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = MOCK_CLIENTS[id || '1'] || MOCK_CLIENTS['1'];

  const [activeTab, setActiveTab] = useState<'infra' | 'cadastro' | 'snapshots' | 'seguranca'>('infra');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div style={s.container}>
      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => navigate('/master/backups-admin')}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ ...s.avatar, backgroundColor: '#0061FF' }}>{client.name[0]}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={s.clientName}>{client.name}</h1>
              <span style={{ ...s.statusBadge, backgroundColor: '#F0FDF4', color: '#10B981' }}>✓ Ativo</span>
            </div>
            <p style={s.clientSub}>{client.email} · Backups {client.plan}</p>
          </div>
        </div>
        <div style={s.headerActions}>
           <button style={{ ...s.editBtn, borderColor: '#0061FF', color: '#0061FF', backgroundColor: '#EFF6FF' }} onClick={() => toastSuccess('Integridade Verificada!')}><RefreshCw size={16} /> Verificar Integridade</button>
        </div>
      </header>

      {/* TABS */}
      <div style={s.content}>
        <div style={s.tabs}>
          {([
            ['infra', Activity, 'Infraestrutura'],
            ['cadastro', Building2, 'Dados Cadastrais'],
            ['snapshots', CloudDownload, 'Snapshots & Logs'],
            ['seguranca', Shield, 'Segurança'],
          ] as const).map(([key, Icon, label]) => (
            <button key={key} style={{ ...s.tabBtn, ...(activeTab === key ? { backgroundColor: '#EFF6FF', color: '#0061FF' } : {}) }} onClick={() => setActiveTab(key)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* INFRAESTRUTURA */}
        {activeTab === 'infra' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Total Armazenado" value={client.storageUsed} icon={HardDrive} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Nodes Ativos" value="3" icon={Database} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Último Backup" value="Há 2h" icon={Clock} accent="#8B5CF6" softBg="#F5F3FF" />
              <HubMetricCard label="Saúde Global" value="100%" icon={CheckCircle2} accent="#10B981" softBg="#F0FDF4" />
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Redundância por Provedor</h3>
              <div style={s.providerGrid}>
                {['AWS (Virginia)', 'GCP (São Paulo)', 'Azure (West US)'].map(p => (
                  <div key={p} style={s.providerCard}>
                    <div style={s.providerIcon}><Database size={18} color="#0061FF" /></div>
                    <div style={{ flex: 1 }}>
                      <p style={s.snapTitle}>{p}</p>
                      <p style={s.snapSub}>Status: Operacional</p>
                    </div>
                    <span style={{ color: '#10B981', fontWeight: '800', fontSize: '12px' }}>ONLINE</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SNAPSHOTS */}
        {activeTab === 'snapshots' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Histórico de Snapshots</h3>
              {client.backups.map((b: any) => (
                <div key={b.id} style={s.auditRow}>
                  <div style={{ flex: 1 }}>
                    <p style={s.snapTitle}>{b.name} · {b.size}</p>
                    <p style={s.snapSub}>{b.date}</p>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#F0FDF4', color: '#10B981', padding: '4px 10px', borderRadius: '6px' }}>{b.status}</span>
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
  backBtn: { width: '44px', height: '44px', borderRadius: '14px', border: '2px solid #E2E8F0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' },
  avatar: { width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '900', color: 'white' },
  clientName: { margin: 0, fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' },
  statusBadge: { padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: '800' },
  clientSub: { margin: 0, fontSize: '13px', color: '#64748B', fontWeight: '600' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  editBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: { display: 'flex', gap: '8px', padding: '8px 0', borderRadius: '24px', width: 'fit-content' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '16px', border: 'none', background: 'none', color: '#64748B', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' },
  auditRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  snapTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  snapSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  providerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' },
  providerCard: { padding: '20px', borderRadius: '24px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '16px' },
  providerIcon: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

export default BackupsClientProfile;
