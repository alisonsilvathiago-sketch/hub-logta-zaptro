import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, PackageSearch, TrendingUp, Shield, Truck,
  Clock, AlertTriangle, CheckCircle2, Lock, Edit3, Save, X,
  MapPin, FileText, DollarSign, Activity, Zap
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import LogtaModal from '@shared/components/Modal';
import { toastSuccess } from '@core/lib/toast';

const MOCK_CLIENTS: Record<string, any> = {
  '1': { id: '1', name: 'Transportadora Falcão', email: 'contato@falcao.com.br', plan: 'Start', routes: 84, vehicleLimit: 20, vehicles: 12, status: 'active' },
  '2': { id: '2', name: 'Logística Express XPTO', email: 'ti@expressxpto.com', plan: 'Pro', routes: 412, vehicleLimit: 100, vehicles: 78, status: 'active' },
  '3': { id: '3', name: 'Cargas Rápidas BR', email: 'admin@cargasrapidas.com.br', plan: 'Start', routes: 23, vehicleLimit: 20, vehicles: 5, status: 'active' },
  '4': { id: '4', name: 'Transcontinental S.A.', email: 'ti@transcontinental.com', plan: 'Enterprise', routes: 2840, vehicleLimit: 500, vehicles: 420, status: 'active' },
};

const LogtaClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = MOCK_CLIENTS[id || '1'] || MOCK_CLIENTS['1'];

  const [activeTab, setActiveTab] = useState<'operacoes' | 'financeiro' | 'frota' | 'seguranca'>('operacoes');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: client.name, email: client.email, plan: client.plan, limit: String(client.vehicleLimit) });

  const pct = (client.vehicles / Number(editForm.limit)) * 100;

  const handleSave = () => {
    toastSuccess(`Dados de "${editForm.name}" atualizados no Logta!`);
    setIsEditing(false);
  };

  return (
    <div style={s.container}>
      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => navigate('/master/logta-admin')}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ ...s.avatar, backgroundColor: '#10B981' }}>{client.name[0]}</div>
          <div>
            {isEditing ? (
              <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={s.editInput} />
            ) : (
              <h1 style={s.clientName}>{editForm.name}</h1>
            )}
            <p style={s.clientSub}>{editForm.email} · Logta {editForm.plan}</p>
          </div>
        </div>
        <div style={s.headerActions}>
          {isEditing ? (
            <>
              <button style={s.cancelBtn} onClick={() => setIsEditing(false)}><X size={16} /> Cancelar</button>
              <button style={{ ...s.saveBtn, backgroundColor: '#10B981' }} onClick={handleSave}><Save size={16} /> Salvar</button>
            </>
          ) : (
            <button style={{ ...s.editBtn, borderColor: '#10B981', color: '#10B981', backgroundColor: '#F0FDF4' }} onClick={() => setIsEditing(true)}><Edit3 size={16} /> Editar Cliente</button>
          )}
        </div>
      </header>

      {/* TABS */}
      <div style={s.content}>
        <div style={s.tabs}>
          {([
            ['operacoes', Activity, 'Operações'],
            ['financeiro', DollarSign, 'Financeiro/Fiscal'],
            ['frota', Truck, 'Frota & Limites'],
            ['seguranca', Shield, 'Segurança'],
          ] as const).map(([key, Icon, label]) => (
            <button key={key} style={{ ...s.tabBtn, ...(activeTab === key ? { backgroundColor: '#F0FDF4', color: '#10B981' } : {}) }} onClick={() => setActiveTab(key)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* OPERAÇÕES */}
        {activeTab === 'operacoes' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Rotas Ativas" value={client.routes.toLocaleString()} icon={MapPin} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Veículos em Trânsito" value={String(client.vehicles)} icon={Truck} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Entregas Concluídas" value="94%" icon={CheckCircle2} accent="#8B5CF6" softBg="#F5F3FF" />
              <HubMetricCard label="CT-es Emitidos" value="1.2k" icon={FileText} accent="#F59E0B" softBg="#FFF7ED" />
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Performance Operacional</h3>
              {[
                { label: 'Emissão de Documentos', val: '99.8%', desc: 'Estável' },
                { label: 'Rastreamento GPS', val: '100%', desc: 'Estável' },
                { label: 'Ocupação de Frota', val: '72%', desc: 'Moderado' },
              ].map(i => (
                <div key={i.label} style={s.auditRow}>
                  <div style={{ flex: 1 }}><p style={s.snapTitle}>{i.label}</p><p style={s.snapSub}>{i.desc}</p></div>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#10B981' }}>{i.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FROTA & LIMITES */}
        {activeTab === 'frota' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Gestão de Limites de Frota</h3>
              <div style={s.storageVisual}>
                <div style={s.storageBar}>
                  <div style={{ ...s.storageFill, width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 90 ? '#EF4444' : '#10B981' }} />
                </div>
                <div style={s.storageLegend}>
                  <span style={s.usedText}>{client.vehicles} veículos cadastrados</span>
                  <span style={s.totalText}>Limite do Plano: {editForm.limit}</span>
                </div>
              </div>

              {isEditing && (
                <div style={s.editSection}>
                  <label style={s.fieldLabel}>Novo Limite de Veículos</label>
                  <input type="number" value={editForm.limit} onChange={e => setEditForm(p => ({ ...p, limit: e.target.value }))} style={s.fieldInput} />
                  <label style={s.fieldLabel}>Plano Logta</label>
                  <select value={editForm.plan} onChange={e => setEditForm(p => ({ ...p, plan: e.target.value }))} style={s.fieldInput}>
                    {['Start', 'Pro', 'Enterprise'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', minHeight: '100vh', overflowY: 'auto' },
  header: { padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderBottom: '1px solid #E2E8F0' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: { width: '44px', height: '44px', borderRadius: '14px', border: '2px solid #E2E8F0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' },
  avatar: { width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '900', color: 'white' },
  clientName: { margin: 0, fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' },
  clientSub: { margin: 0, fontSize: '13px', color: '#64748B', fontWeight: '600' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  editBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  cancelBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  saveBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid', color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  editInput: { fontSize: '22px', fontWeight: '900', color: '#0F172A', border: '2px solid #10B981', borderRadius: '12px', padding: '8px 16px', outline: 'none' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: { display: 'flex', gap: '8px', backgroundColor: '#FFFFFF', padding: '8px', borderRadius: '24px', width: 'fit-content', border: '1px solid #E2E8F0' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '16px', border: 'none', background: 'none', color: '#64748B', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' },
  storageVisual: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' },
  storageBar: { height: '12px', backgroundColor: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' },
  storageFill: { height: '100%', borderRadius: '6px', transition: 'width 1s ease' },
  storageLegend: { display: 'flex', justifyContent: 'space-between' },
  usedText: { fontSize: '13px', fontWeight: '700', color: '#475569' },
  totalText: { fontSize: '13px', fontWeight: '700', color: '#94A3B8' },
  editSection: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' },
  fieldLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  fieldInput: { padding: '12px 16px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '15px', fontWeight: '700', outline: 'none' },
  snapTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  snapSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  auditRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
};

export default LogtaClientProfile;
