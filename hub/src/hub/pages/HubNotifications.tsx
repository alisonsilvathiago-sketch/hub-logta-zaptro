import React, { useMemo, useState } from 'react';
import {
  Send,
  Users,
  Building2,
  Clock,
  Target,
  LayoutGrid,
  Trash2,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError } from '@core/lib/toast';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';
import { HUB_PAGE_SUBTITLE } from '@hub/styles/hubPageTypography';
import { useHubMasterNotifications } from '@hub/context/HubMasterNotificationsContext';
import {
  HUB_NOTIFICATION_CATEGORY_LABELS,
  HUB_NOTIFICATION_SOURCE_LABELS,
  categoryIcon,
  formatNotificationTime,
  type HubNotificationCategory,
  type HubNotificationSource,
} from '@hub/lib/hubMasterNotifications';

const NOTIF_GRAY = {
  surface: '#FAFAFA',
  surfaceUnread: '#F5F5F5',
  border: '#E8E8E8',
  borderUnread: '#D4D4D4',
  text: '#171717',
  muted: '#737373',
  subtle: '#A3A3A3',
  iconBg: '#EFEFEF',
  icon: '#525252',
};

type MasterNotificationsProps = {
  /** Dentro de Configurações — sem cabeçalho de página duplicado. */
  embedded?: boolean;
};

const MasterNotifications: React.FC<MasterNotificationsProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { items, unreadCount, refresh, openNotification, markAllAsRead, markAsRead } =
    useHubMasterNotifications();

  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [sending, setSending] = useState(false);
  const [filterSource, setFilterSource] = useState<HubNotificationSource | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<HubNotificationCategory | 'all'>('all');

  const [targetType, setTargetType] = useState<'GLOBAL' | 'COMPANY' | 'USER'>('GLOBAL');
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'LOW',
    type: 'MANUAL',
    company_id: '',
    user_id: '',
    path: '',
  });

  React.useEffect(() => {
    const fetchMeta = async () => {
      const { data: cos } = await supabase.from('companies').select('id, name').order('name');
      setCompanies(cos || []);
      setLoadingMeta(false);
    };
    void fetchMeta();
  }, []);

  const fetchUsers = async (companyId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('company_id', companyId)
      .order('full_name');
    setUsers(data || []);
  };

  const filteredHistory = useMemo(() => {
    return items.filter((n) => {
      if (filterSource !== 'all' && n.source !== filterSource) return false;
      if (filterCategory !== 'all' && n.category !== filterCategory) return false;
      return true;
    });
  }, [items, filterSource, filterCategory]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const payload: Record<string, unknown> = {
        title: formData.title,
        message: formData.message,
        priority: formData.priority,
        type: formData.type,
        metadata: formData.path ? { path: formData.path } : {},
      };

      if (targetType === 'COMPANY') payload.company_id = formData.company_id;
      if (targetType === 'USER') {
        payload.company_id = formData.company_id;
        payload.user_id = formData.user_id;
      }

      const { error: legacyErr } = await supabase.from('notifications').insert([payload]);

      await supabase.from('hub_notificacoes').insert([
        {
          mensagem: `${formData.title}: ${formData.message}`,
          sistema: 'HUB_MASTER',
          tipo: formData.priority.toLowerCase(),
        },
      ]);

      if (legacyErr && !legacyErr.message.includes('does not exist')) {
        throw legacyErr;
      }

      toastSuccess('Comunicado enviado com sucesso!');
      setFormData({ ...formData, title: '', message: '', path: '' });
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toastError('Erro ao enviar: ' + msg);
    } finally {
      setSending(false);
    }
  };

  const deleteNotif = async (id: string) => {
    if (!confirm('Excluir esta notificação?')) return;
    if (id.startsWith('hub_notif_')) {
      const uuid = id.replace('hub_notif_', '');
      await supabase.from('hub_notificacoes').delete().eq('id', uuid);
    } else if (id.startsWith('notif_')) {
      const uuid = id.replace('notif_', '');
      await supabase.from('notifications').delete().eq('id', uuid);
    }
    markAsRead(id);
    await refresh();
    toastSuccess('Notificação removida.');
  };

  if (loadingMeta) {
    return <div style={styles.loader}>Acessando Central de Inteligência...</div>;
  }

  const content = (
    <>
      {!embedded ? (
        <header style={styles.header}>
          <h1 style={styles.title}>Central de Notificações Global</h1>
          <p style={styles.subtitle}>
            Histórico unificado: Logta, Zaptro, LogDock, WhatsApp, faturamento, suporte, acessos e alertas.
          </p>
        </header>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
            Central de Notificações Global
          </h3>
          <p style={{ ...HUB_PAGE_SUBTITLE, margin: 0 }}>
            Histórico de todo o ecossistema. Clique em um item para ir à tela correspondente.
          </p>
        </div>
      )}

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Send size={18} color={NOTIF_GRAY.muted} />
            <h2 style={styles.cardTitle}>Novo Comunicado Master</h2>
          </div>

          <form style={styles.form} onSubmit={handleSend}>
            <div style={{ ...hubPillTabStripStyles.container, marginBottom: '16px', width: '100%' }}>
              {(['GLOBAL', 'COMPANY', 'USER'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTargetType(t)}
                  style={{
                    ...hubPillTabStripStyles.button,
                    ...(targetType === t ? hubPillTabStripStyles.buttonActive : {}),
                  }}
                >
                  {t === 'GLOBAL' ? (
                    <LayoutGrid size={15} color={targetType === t ? 'var(--accent)' : 'var(--text-secondary)'} />
                  ) : t === 'COMPANY' ? (
                    <Building2 size={15} color={targetType === t ? 'var(--accent)' : 'var(--text-secondary)'} />
                  ) : (
                    <Users size={15} color={targetType === t ? 'var(--accent)' : 'var(--text-secondary)'} />
                  )}{' '}
                  {t === 'GLOBAL' ? 'Global' : t === 'COMPANY' ? 'Empresa' : 'Usuário'}
                </button>
              ))}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Título do Alerta</label>
              <input
                required
                style={styles.input}
                placeholder="Ex: Manutenção, pagamento, suporte…"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Mensagem</label>
              <textarea
                required
                style={styles.textarea}
                placeholder="Descreva o comunicado…"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>Prioridade</label>
                <select
                  style={styles.select}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </select>
              </div>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>Link (path master)</label>
                <input
                  style={styles.input}
                  placeholder="/master/billing"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                />
              </div>
            </div>

            {(targetType === 'COMPANY' || targetType === 'USER') && (
              <div style={styles.field}>
                <label style={styles.label}>Empresa</label>
                <select
                  required
                  style={styles.select}
                  value={formData.company_id}
                  onChange={(e) => {
                    setFormData({ ...formData, company_id: e.target.value });
                    fetchUsers(e.target.value);
                  }}
                >
                  <option value="">Escolha…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === 'USER' && (
              <div style={styles.field}>
                <label style={styles.label}>Colaborador</label>
                <select
                  required
                  style={styles.select}
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                >
                  <option value="">Escolha…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" style={styles.submitBtn} disabled={sending}>
              {sending ? 'Disparando…' : 'Publicar Notificação'}
            </button>
          </form>
        </div>

        <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', minHeight: 520 }}>
          <div style={styles.cardHeader}>
            <Clock size={18} color={NOTIF_GRAY.muted} />
            <h2 style={styles.cardTitle}>Histórico completo</h2>
            <span style={styles.unreadPill}>{unreadCount} não lidas</span>
            {unreadCount > 0 ? (
              <button type="button" onClick={markAllAsRead} style={styles.markAllBtn} title="Marcar todas como lidas">
                <CheckCheck size={16} />
              </button>
            ) : null}
          </div>

          <div style={styles.filterRow}>
            <Filter size={14} color="#94A3B8" />
            <select
              style={styles.filterSelect}
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as HubNotificationSource | 'all')}
            >
              <option value="all">Todos os produtos</option>
              {(Object.keys(HUB_NOTIFICATION_SOURCE_LABELS) as HubNotificationSource[]).map((s) => (
                <option key={s} value={s}>
                  {HUB_NOTIFICATION_SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              style={styles.filterSelect}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as HubNotificationCategory | 'all')}
            >
              <option value="all">Todas categorias</option>
              {(Object.keys(HUB_NOTIFICATION_CATEGORY_LABELS) as HubNotificationCategory[]).map((c) => (
                <option key={c} value={c}>
                  {HUB_NOTIFICATION_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.historyList, flex: 1, overflowY: 'auto', maxHeight: embedded ? 640 : 520 }}>
            {filteredHistory.map((n) => {
              const Icon = categoryIcon(n.category);
              return (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  style={{
                    ...styles.historyItem,
                    background: n.read ? NOTIF_GRAY.surface : NOTIF_GRAY.surfaceUnread,
                    borderColor: n.read ? NOTIF_GRAY.border : NOTIF_GRAY.borderUnread,
                    cursor: 'pointer',
                  }}
                  onClick={() => openNotification(n)}
                  onKeyDown={(e) => e.key === 'Enter' && openNotification(n)}
                >
                  <div
                    style={{
                      ...styles.priorityDot,
                      backgroundColor: n.read ? NOTIF_GRAY.subtle : NOTIF_GRAY.muted,
                    }}
                  />
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: NOTIF_GRAY.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} color={NOTIF_GRAY.icon} />
                  </div>
                  <div style={styles.historyContent}>
                    <div style={styles.hTitleRow}>
                      <span style={{ ...styles.hTitle, fontWeight: n.read ? 600 : 800 }}>{n.title}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteNotif(n.id);
                        }}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p style={styles.hMsg}>{n.message}</p>
                    <div style={styles.hMeta}>
                      <span style={styles.hTarget}>
                        <Target size={10} /> {HUB_NOTIFICATION_SOURCE_LABELS[n.source]} ·{' '}
                        {HUB_NOTIFICATION_CATEGORY_LABELS[n.category]}
                      </span>
                      <span style={styles.hTime}>{formatNotificationTime(n.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredHistory.length === 0 && (
              <p style={styles.emptyHist}>Nenhuma notificação neste filtro.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return <div style={{ padding: 0 }}>{content}</div>;
  }

  return (
    <div style={styles.container} className="animate-fade-in">
      {content}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  header: { display: 'flex', flexDirection: 'column', gap: '12px' },
  title: { fontSize: '29px', fontWeight: '500', color: '#000000', margin: 0, letterSpacing: 0 },
  subtitle: { ...HUB_PAGE_SUBTITLE },
  grid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    height: 'fit-content',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0, flex: 1 },
  unreadPill: {
    fontSize: 11,
    fontWeight: 800,
    color: '#EF4444',
    background: '#FEF2F2',
    padding: '4px 10px',
    borderRadius: 999,
  },
  markAllBtn: {
    border: '1px solid #E2E8F0',
    background: '#FFF',
    borderRadius: 8,
    padding: 6,
    cursor: 'pointer',
    color: '#475569',
  },
  filterRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  filterSelect: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    fontSize: 12,
    fontWeight: 600,
    background: '#F5F5F5',
    color: '#525252',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: { display: 'flex', gap: '16px' },
  label: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  input: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#f8fafc',
  },
  textarea: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#f8fafc',
    minHeight: '96px',
    resize: 'none',
  },
  select: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#f8fafc',
  },
  submitBtn: {
    padding: '14px',
    backgroundColor: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '8px',
  },
  historyList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  historyItem: {
    display: 'flex',
    gap: '12px',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #E8E8E8',
    transition: 'all 0.15s',
    fontSize: 14,
  },
  priorityDot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, marginTop: '10px' },
  historyContent: { flex: 1, minWidth: 0 },
  hTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  hTitle: { fontSize: '14px', color: '#171717', lineHeight: 1.35 },
  hMsg: { fontSize: '12px', color: '#737373', lineHeight: '1.45', margin: '0 0 8px 0' },
  hMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  hTarget: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#A3A3A3',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textTransform: 'uppercase',
  },
  hTime: { fontSize: '11px', color: '#cbd5e1', fontWeight: '600' },
  deleteBtn: { padding: '4px', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' },
  emptyHist: { textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' },
  loader: { padding: '100px', textAlign: 'center', color: 'var(--primary)', fontWeight: '600' },
};

export default MasterNotifications;
