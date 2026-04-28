import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit2, Trash2, UserPlus, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { supabase } from '../../lib/supabase';
import LogtaModal from '../../components/Modal';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '../../lib/toast';
import type { Profile, UserRole } from '../../types';
import { hasGlobalCompanyAccess, getLogtaHomePath, isMasterRole } from '../../utils/logtaRbac';
import LogtaPageView from '../../components/LogtaPageView';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'GERENTE', label: 'Gerente' },
  { value: 'LOGISTICA', label: 'Logística' },
  { value: 'CRM', label: 'CRM' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'RH', label: 'RH' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'ESTOQUE', label: 'Estoque' },
  { value: 'FROTA', label: 'Frota' },
  { value: 'MOTORISTA', label: 'Motorista' },
  { value: 'TREINAMENTOS', label: 'Treinamentos' },
  { value: 'ATENDIMENTO', label: 'Atendimento' },
];

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { profile: adminProfile } = useAuth();
  const { company } = useTenant();

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    role: 'LOGISTICA' as UserRole,
  });

  useEffect(() => {
    if (!adminProfile?.role) return;
    if (!hasGlobalCompanyAccess(adminProfile.role)) {
      navigate(getLogtaHomePath(adminProfile.role), { replace: true });
    }
  }, [adminProfile?.role, navigate]);

  const fetchUsers = useCallback(async () => {
    if (!adminProfile?.company_id) return;
    setLoading(true);
    try {
      const isMaster = isMasterRole(adminProfile.role);
      let q = supabase.from('profiles').select('*');
      if (!isMaster) q = q.eq('company_id', adminProfile.company_id);
      const { data, error } = await q.order('full_name', { ascending: true });
      if (error) throw error;
      setUsers((data as Profile[]) || []);
    } catch (e: any) {
      toastError(e.message || 'Erro ao carregar equipa');
    } finally {
      setLoading(false);
    }
  }, [adminProfile?.company_id, adminProfile?.role]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const openEdit = (user: Profile | null) => {
    setSelectedUser(user);
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        role: (user.role as UserRole) || 'LOGISTICA',
      });
    } else {
      setFormData({ full_name: '', role: 'LOGISTICA' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile?.company_id || !selectedUser) return;
    setSaving(true);
    const tid = toastLoading('A guardar…');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          role: formData.role,
        })
        .eq('id', selectedUser.id)
        .eq('company_id', adminProfile.company_id);

      if (error) throw error;
      toastDismiss(tid);
      toastSuccess('Colaborador atualizado.');
      setIsModalOpen(false);
      void fetchUsers();
    } catch (err: any) {
      toastDismiss(tid);
      toastError(err.message || 'Falha ao guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== 'EXCLUIR' || !selectedUser || !adminProfile?.company_id) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', selectedUser.id).eq('company_id', adminProfile.company_id);
      if (error) throw error;
      toastSuccess('Perfil removido da empresa.');
      setIsDeleteModalOpen(false);
      setDeleteConfirmation('');
      void fetchUsers();
    } catch {
      toastError('Não foi possível remover.');
    }
  };

  const filtered = users.filter((u) => (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <LogtaPageView>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Equipa e permissões</h1>
          <p style={styles.subtitle}>
            Papéis definidos em <strong>profiles.role</strong> — controlam menu e URLs ({company?.name || 'empresa'}).
          </p>
        </div>
        <button type="button" style={styles.primaryBtn} onClick={() => toastError('Convide utilizadores no Supabase Auth; depois atualize o perfil aqui.')}>
          <UserPlus size={18} /> Novo colaborador
        </button>
      </header>

      <div style={styles.tableCard}>
        <div style={styles.cardToolbar}>
          <div style={styles.search}>
            <Search size={18} color="#94A3B8" />
            <input
              placeholder="Buscar por nome…"
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ padding: 32, color: '#64748b' }}>A carregar…</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>COLABORADOR</th>
                <th style={styles.th}>FUNÇÃO (ROLE)</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>{user.full_name || '—'}</strong>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{user.email || user.metadata?.email || user.id.slice(0, 8)}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.roleTag}>{user.role}</span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <button type="button" style={styles.iconBtn} onClick={() => openEdit(user)} title="Editar papel">
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      style={{ ...styles.iconBtn, color: '#EF4444' }}
                      onClick={() => {
                        setSelectedUser(user);
                        setIsDeleteModalOpen(true);
                      }}
                      title="Remover perfil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <LogtaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} width="520px">
        <form onSubmit={handleSave} style={styles.form}>
          <h2 style={{ marginTop: 0 }}>Editar colaborador</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>O acesso à app segue o valor de <code>role</code> na base de dados.</p>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nome</label>
            <input
              style={styles.input}
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Função (role)</label>
            <select
              style={styles.input}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" style={styles.saveBtn} disabled={saving}>
            {saving ? 'A guardar…' : 'Guardar'}
          </button>
        </form>
      </LogtaModal>

      <LogtaModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Remover colaborador" width="440px">
        <div style={styles.deleteArea}>
          <div style={styles.deleteIcon}>
            <AlertCircle size={40} color="#EF4444" />
          </div>
          <p>
            Remover <strong>{selectedUser?.full_name}</strong> da tabela <code>profiles</code> desta empresa. Confirme escrevendo <strong>EXCLUIR</strong>.
          </p>
          <input
            style={styles.confirmInput}
            placeholder="EXCLUIR"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
          />
          <div style={styles.modalActions}>
            <button type="button" style={styles.cancelBtn} onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </button>
            <button
              type="button"
              style={styles.deleteBtn}
              disabled={deleteConfirmation !== 'EXCLUIR'}
              onClick={handleDelete}
            >
              Remover
            </button>
          </div>
        </div>
      </LogtaModal>
    </LogtaPageView>
  );
};

const styles: Record<string, any> = {
  header: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 32 },
  title: { fontSize: '32px', fontWeight: '950', color: 'var(--text-main)', margin: '0 0 8px 0', letterSpacing: '-1px' },
  subtitle: { fontSize: '15px', color: 'var(--text-muted)', margin: 0, maxWidth: 600, fontWeight: 500 },
  primaryBtn: {
    backgroundColor: 'var(--primary)',
    color: 'white',
    border: 'none',
    padding: '14px 24px',
    borderRadius: '16px',
    fontWeight: '900',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 8px 20px rgba(124, 58, 237, 0.25)',
    transition: 'all 0.2s ease',
  },
  tableCard: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' },
  cardToolbar: { padding: '24px 32px', borderBottom: '1px solid var(--border)', backgroundColor: '#fff' },
  search: { display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#f8fafc', padding: '14px 20px', borderRadius: '14px', border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' },
  th: { padding: '18px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s' },
  td: { padding: '20px 32px', verticalAlign: 'middle' as const },
  roleTag: { padding: '6px 14px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '10px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' },
  iconBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#f1f5f9',
    marginLeft: 10,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    transition: 'all 0.2s',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 20, padding: '10px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: '12px', fontWeight: '850', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' },
  input: { height: '52px', padding: '0 16px', borderRadius: '14px', border: '1px solid var(--border)', fontSize: '14px', fontWeight: '600', outline: 'none', transition: 'border-color 0.2s' },
  saveBtn: { marginTop: 12, height: '54px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(124, 58, 237, 0.2)' },
  deleteArea: { textAlign: 'center' as const, padding: '12px 0' },
  deleteIcon: { marginBottom: 20, display: 'flex', justifyContent: 'center' },
  confirmInput: { width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', border: '1px solid #fecaca', marginTop: 16, textAlign: 'center' as const, fontWeight: '900', fontSize: '16px', color: '#ef4444' },
  modalActions: { display: 'flex', gap: 12, marginTop: 28 },
  cancelBtn: { flex: 1, height: '52px', borderRadius: '14px', border: '1px solid var(--border)', background: '#fff', color: 'var(--text-muted)', fontWeight: '800', cursor: 'pointer' },
  deleteBtn: { flex: 1, height: '52px', borderRadius: '14px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' },
};

export default UserManagement;
