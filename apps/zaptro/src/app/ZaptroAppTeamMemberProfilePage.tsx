import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  MessageSquare,
  Pencil,
  Save,
  Shield,
  Star,
  User,
  Users,
} from 'lucide-react';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { ZAPTRO_APP_ROUTES } from './zaptroAppRoutes';
import { resolveMemberAvatarUrl } from '../utils/zaptroAvatar';
import { isZaptroTenantAdminRole } from '../utils/zaptroPermissions';
import {
  ZAPTRO_PAGE_PERMISSION_DEFS,
  sanitizeZaptroPagePermissions,
  type ZaptroPagePermissionId,
} from '../utils/zaptroPagePermissionMap';
import { isZaptroBrandingEntitledByPlan } from '../utils/zaptroBrandingEntitlement';
import { formatZaptroDbErrorForToast } from '../utils/zaptroSchemaErrors';
import {
  buildZaptroDemoTeamMembers,
  isZaptroDemoTeamMemberId,
  isZaptroTeamDemoEnabled,
} from '../constants/zaptroTeamDemo';
import { buildZaptroDemoClients, isZaptroClientsDemoEnabled } from '../constants/zaptroClientsDemo';
import { ZaptroPaginatedList } from '../components/Zaptro/ZaptroPaginatedList';
import ZaptroTeamMemberEditModal, { type TeamMemberEditForm } from '../components/Zaptro/ZaptroTeamMemberEditModal';
import './zaptroAppClientProfile.css';

type Tab = 'historico' | 'atendimentos' | 'permissoes' | 'conta';

type MemberRow = {
  id: string;
  full_name: string;
  role: string;
  email: string;
  avatar_url: string | null;
  permissions: string[];
  phone: string;
  notes: string;
  metadata: Record<string, unknown>;
};

type AttendanceRow = {
  id: string;
  sender_name: string;
  sender_number: string;
  status: string;
  updated_at: string;
  last_message: string | null;
  customer_avatar: string | null;
};

type HistoryItem = {
  id: string;
  at: string;
  title: string;
  body: string;
  kind: 'atendimento' | 'resolvido' | 'reclamacao' | 'nota';
  href?: string;
};

const ROLE_LABELS: Record<string, string> = {
  agent: 'Atendimento (WhatsApp)',
  atendimento: 'Atendimento',
  suporte: 'Suporte',
  financeiro: 'Financeiro',
  estrategia: 'Estratégia',
  gerente: 'Gerente',
  comercial: 'Comercial',
  ADMIN: 'Administrador da empresa',
};

function roleLabel(role: string): string {
  return ROLE_LABELS[role] || ROLE_LABELS[role.toLowerCase()] || role;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.toDateString() === n.toDateString();
}

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

function readMemberMeta(data: { metadata?: unknown }): { phone: string; notes: string; meta: Record<string, unknown> } {
  const meta =
    data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
      ? { ...(data.metadata as Record<string, unknown>) }
      : {};
  const phone = typeof meta.phone === 'string' ? meta.phone : '';
  const notes =
    typeof meta.team_notes === 'string'
      ? meta.team_notes
      : typeof meta.notes === 'string'
        ? meta.notes
        : '';
  return { phone, notes, meta };
}

function memberToEditForm(
  m: MemberRow,
  company: ReturnType<typeof useTenant>['company'],
): TeamMemberEditForm {
  return {
    full_name: m.full_name,
    email: m.email,
    role: m.role,
    phone: m.phone,
    notes: m.notes,
    avatarUrl: m.avatar_url,
    pagePerms: sanitizeZaptroPagePermissions(m.permissions).filter((id) =>
      assignablePageIds(company).includes(id),
    ),
    newPassword: '',
    confirmPassword: '',
function assignablePageIds(company: ReturnType<typeof useTenant>['company']): ZaptroPagePermissionId[] {
  return ZAPTRO_PAGE_PERMISSION_DEFS.filter(
    (d) => !d.requiresBrandingPlan || isZaptroBrandingEntitledByPlan(company),
  ).map((d) => d.id);
}

const ZaptroAppTeamMemberProfilePage: React.FC = () => {
  const { memberId = '' } = useParams();
  const navigate = useNavigate();
  const { profile, onlineUsers = [] } = useAuth();
  const { company } = useTenant();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<MemberRow | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('historico');
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    role: 'agent',
    pagePerms: [] as ZaptroPagePermissionId[],
    newPassword: '',
  });

  const isAdmin = isZaptroTenantAdminRole(profile?.role);
  const isDemo = isZaptroDemoTeamMemberId(memberId);
  const isOnline = memberId === profile?.id || onlineUsers.includes(memberId);

  const loadMember = useCallback(async (): Promise<MemberRow | null> => {
    if (isZaptroDemoTeamMemberId(memberId) && isZaptroTeamDemoEnabled()) {
      const demo = buildZaptroDemoTeamMembers(profile?.company_id).find((m) => m.id === memberId);
      if (!demo) return null;
      return {
        id: demo.id,
        full_name: demo.full_name,
        role: demo.role,
        email: demo.email,
        avatar_url: null,
        permissions: demo.permissions ?? [],
      };
    }
    if (!profile?.company_id) return null;
    const { data } = await supabaseZaptro
      .from('profiles')
      .select('id, full_name, role, email, avatar_url, metadata, permissions')
      .eq('id', memberId)
      .eq('company_id', profile.company_id)
      .maybeSingle();
    if (!data?.id) return null;
    const metaEmail =
      data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
        ? (data.metadata as { email?: string }).email
        : undefined;
    return {
      id: String(data.id),
      full_name: String(data.full_name || 'Colaborador'),
      role: String(data.role || 'agent'),
      email: String(data.email || metaEmail || ''),
      avatar_url: resolveMemberAvatarUrl(
        { id: String(data.id), avatar_url: data.avatar_url },
        profile.id,
        profile,
      ),
      permissions: Array.isArray(data.permissions) ? (data.permissions as string[]) : [],
    };
  }, [memberId, profile?.company_id, profile?.id, profile]);

  const loadAttendances = useCallback(async (): Promise<AttendanceRow[]> => {
    if (isZaptroDemoTeamMemberId(memberId) && isZaptroClientsDemoEnabled()) {
      return buildZaptroDemoClients(profile?.company_id || 'demo')
        .filter((c) => c.assigned_to === memberId)
        .map((c) => ({
          id: c.id,
          sender_name: c.sender_name,
          sender_number: c.sender_number,
          status: c.status,
          updated_at: c.updated_at,
          last_message: c.last_message ?? null,
          customer_avatar: c.customer_avatar ?? null,
        }));
    }
    if (!profile?.company_id) return [];
    const { data } = await supabaseZaptro
      .from('whatsapp_conversations')
      .select('id, sender_name, sender_number, status, updated_at, last_message, customer_avatar')
      .eq('company_id', profile.company_id)
      .eq('assigned_to', memberId)
      .order('updated_at', { ascending: false })
      .limit(120);
    return (data ?? []).map((r) => ({
      id: String(r.id),
      sender_name: String(r.sender_name || 'Cliente'),
      sender_number: String(r.sender_number || ''),
      status: String(r.status || 'open'),
      updated_at: String(r.updated_at || new Date().toISOString()),
      last_message: r.last_message ? String(r.last_message) : null,
      customer_avatar: typeof r.customer_avatar === 'string' ? r.customer_avatar : null,
    }));
  }, [memberId, profile?.company_id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [m, rows] = await Promise.all([loadMember(), loadAttendances()]);
      if (cancelled) return;
      setMember(m);
      setAttendances(rows);
      if (m) {
        setEditForm({
          full_name: m.full_name,
          email: m.email,
          role: m.role,
          pagePerms: sanitizeZaptroPagePermissions(m.permissions).filter((id) =>
            assignablePageIds(company).includes(id),
          ),
          newPassword: '',
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMember, loadAttendances, company]);

  const stats = useMemo(() => {
    const open = attendances.filter((a) => a.status === 'open' || a.status === 'waiting');
    const closed = attendances.filter((a) => a.status === 'finished');
    const today = attendances.filter((a) => isToday(a.updated_at));
    const month = attendances.filter((a) => isThisMonth(a.updated_at));
    return {
      activos: open.length,
      resolvidos: closed.length,
      hoje: today.length,
      mes: month.length,
      reclamacoes: isDemo ? 1 : 0,
    };
  }, [attendances, isDemo]);

  const historyItems = useMemo((): HistoryItem[] => {
    const items: HistoryItem[] = attendances.map((a) => {
      const open = a.status === 'open' || a.status === 'waiting';
      return {
        id: `att-${a.id}`,
        at: a.updated_at,
        title: open ? 'Atendimento em curso' : 'Atendimento encerrado',
        body: `${a.sender_name} · ${a.last_message || 'Sem mensagem recente'}`,
        kind: open ? 'atendimento' : 'resolvido',
        href: ZAPTRO_APP_ROUTES.clientProfile(a.id),
      };
    });
    if (isDemo && member) {
      items.push({
        id: 'demo-complaint',
        at: new Date(Date.now() - 86400000 * 2).toISOString(),
        title: 'Reclamação registada',
        body: 'Cliente reportou demora na resposta — resolvido com follow-up.',
        kind: 'reclamacao',
      });
      items.push({
        id: 'demo-note',
        at: new Date(Date.now() - 86400000 * 5).toISOString(),
        title: 'Nota interna',
        body: `${member.full_name} destacou-se no ranking de atendimentos da semana.`,
        kind: 'nota',
      });
    }
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [attendances, isDemo, member]);

  const avatarUrl = member
    ? member.avatar_url ||
      (profile?.id === member.id ? resolveMemberAvatarUrl({ id: member.id, avatar_url: null }, profile.id, profile) : null)
    : null;

  const handleSave = async () => {
    if (!member || !profile?.company_id || !isAdmin) return;
    if (isDemo) {
      notifyZaptro('info', 'Demo', 'Colaborador de demonstração — alterações não são gravadas no servidor.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabaseZaptro
        .from('profiles')
        .update({
          full_name: editForm.full_name.trim() || null,
          email: editForm.email.trim() || null,
          role: editForm.role,
          permissions: sanitizeZaptroPagePermissions(editForm.pagePerms),
          updated_at: new Date().toISOString(),
        })
        .eq('id', member.id)
        .eq('company_id', profile.company_id);
      if (error) throw error;
      if (editForm.newPassword.trim().length >= 6) {
        notifyZaptro(
          'info',
          'Senha',
          'Alteração de senha requer convite Auth ou função admin no Supabase — e-mail de login actualizado.',
        );
      }
      const refreshed = await loadMember();
      setMember(refreshed);
      notifyZaptro('success', 'Colaborador', 'Dados e permissões guardados.');
    } catch (e: unknown) {
      notifyZaptro(
        'error',
        'Erro ao guardar',
        formatZaptroDbErrorForToast(e, 'Verifique permissões RLS no Supabase.', profile?.role),
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePerm = (id: ZaptroPagePermissionId) => {
    setEditForm((f) => ({
      ...f,
      pagePerms: f.pagePerms.includes(id) ? f.pagePerms.filter((x) => x !== id) : [...f.pagePerms, id],
    }));
  };

  if (loading) {
    return (
      <div className="zaptro-client-profile">
        <p style={{ color: '#949494', fontWeight: 700 }}>A carregar perfil do colaborador…</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="zaptro-client-profile">
        <button type="button" className="zaptro-client-profile__back" onClick={() => navigate(ZAPTRO_APP_ROUTES.TEAM())}>
          <ChevronLeft size={18} /> Voltar para equipe
        </button>
        <p style={{ color: '#949494', fontWeight: 700 }}>Colaborador não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="zaptro-client-profile zaptro-team-member-profile">
      <button type="button" className="zaptro-client-profile__back" onClick={() => navigate(ZAPTRO_APP_ROUTES.TEAM())}>
        <ChevronLeft size={18} /> Voltar para equipe
      </button>

      {isDemo ? (
        <div className="zaptro-client-profile__demo">Pré-visualização — colaborador demo com histórico simulado</div>
      ) : null}

      <section className="zaptro-client-profile__hero">
        <div className="zaptro-client-profile__avatar-wrap">
          <div className="zaptro-client-profile__avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="zaptro-client-profile__avatar-img" />
            ) : (
              member.full_name[0]?.toUpperCase() || 'C'
            )}
          </div>
        </div>
        <div className="zaptro-client-profile__hero-main">
          <div className="zaptro-client-profile__name-row">
            <span
              className={`zaptro-client-profile__badge zaptro-client-profile__badge--name ${isOnline ? 'zaptro-client-profile__badge--open' : 'zaptro-client-profile__badge--done'}`}
            >
              {isOnline ? 'NO PAINEL' : 'AUSENTE'}
            </span>
            <h1 className="zaptro-client-profile__name">{member.full_name}</h1>
          </div>
          <div className="zaptro-client-profile__meta">
            <span>{roleLabel(member.role)}</span>
            <span>{member.email || 'Sem e-mail de login'}</span>
          </div>
        </div>
        <div className="zaptro-client-profile__hero-actions">
          <Link
            to={ZAPTRO_APP_ROUTES.INBOX}
            className="zaptro-client-profile__conversar-btn"
            title="Ver inbox de atendimentos"
          >
            <MessageSquare size={18} strokeWidth={2} aria-hidden />
            Inbox
          </Link>
          {isAdmin ? (
            <button
              type="button"
              className="zaptro-client-profile__edit-btn"
              title="Editar colaborador"
              onClick={() => setActiveTab('conta')}
            >
              <Pencil size={18} strokeWidth={2} />
            </button>
          ) : null}
        </div>
      </section>

      <div className="zaptro-client-profile__grid">
        <aside className="zaptro-client-profile__side">
          <div className="zaptro-client-profile__card">
            <h3>Contacto</h3>
            <div className="zaptro-client-profile__info">
              <Mail size={16} color="#949494" />
              <span className="zaptro-client-profile__info-value">{member.email || '—'}</span>
            </div>
            <div className="zaptro-client-profile__info">
              <User size={16} color="#949494" />
              <span className="zaptro-client-profile__info-value">Função: {roleLabel(member.role)}</span>
            </div>
            <div className="zaptro-client-profile__info">
              <Shield size={16} color="#949494" />
              <span className="zaptro-client-profile__info-value">
                {editForm.pagePerms.length} página(s) com acesso
              </span>
            </div>
          </div>
          <div className="zaptro-client-profile__card">
            <h3>Ranking rápido</h3>
            <div className="zaptro-client-profile__info">
              <Star size={16} color="#949494" />
              <span className="zaptro-client-profile__info-value">
                {stats.mes} atendimentos este mês
              </span>
            </div>
            <div className="zaptro-client-profile__info">
              <Clock size={16} color="#949494" />
              <span className="zaptro-client-profile__info-value">{stats.hoje} hoje</span>
            </div>
          </div>
        </aside>

        <main>
          <div className="zaptro-client-profile__kpis">
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Hoje</div>
              <div className="zaptro-client-profile__kpi-value">{stats.hoje}</div>
            </div>
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Este mês</div>
              <div className="zaptro-client-profile__kpi-value">{stats.mes}</div>
            </div>
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Activos</div>
              <div className="zaptro-client-profile__kpi-value">{stats.activos}</div>
            </div>
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Resolvidos</div>
              <div className="zaptro-client-profile__kpi-value">{stats.resolvidos}</div>
            </div>
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Reclamações</div>
              <div className="zaptro-client-profile__kpi-value">{stats.reclamacoes}</div>
            </div>
          </div>

          <div className="zaptro-client-profile__tabs">
            {(
              [
                { id: 'historico' as const, label: 'Histórico completo' },
                { id: 'atendimentos' as const, label: 'Atendimentos' },
                { id: 'permissoes' as const, label: 'Permissões' },
                { id: 'conta' as const, label: 'Conta & login' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`zaptro-client-profile__tab ${activeTab === id ? 'zaptro-client-profile__tab--active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'historico' ? (
            <ZaptroPaginatedList
              items={historyItems}
              resetKey="team-history"
              listClassName="zaptro-client-profile__list"
              empty={<div className="zaptro-client-profile__card">Sem histórico registado.</div>}
              keyExtractor={(item) => item.id}
              renderItem={(item) => {
                const Icon =
                  item.kind === 'reclamacao'
                    ? AlertTriangle
                    : item.kind === 'resolvido'
                      ? CheckCircle2
                      : MessageSquare;
                const rowClass = `zaptro-client-profile__row${item.href ? ' zaptro-client-profile__row--clickable' : ''}${activeRowId === item.id ? ' zaptro-client-profile__row--active' : ''}`;
                const inner = (
                  <>
                    <div className="zaptro-client-profile__row-icon">
                      <Icon size={18} color="#0f172a" />
                    </div>
                    <div className="zaptro-client-profile__row-main">
                      <p className="zaptro-client-profile__row-title">{item.title}</p>
                      <p className="zaptro-client-profile__row-body">{item.body}</p>
                    </div>
                    <div className="zaptro-client-profile__row-end">
                      <span className="zaptro-client-profile__row-date">{formatDateTime(item.at)}</span>
                      {item.href ? <ChevronRight size={16} className="zaptro-client-profile__row-chevron" /> : null}
                    </div>
                  </>
                );
                if (item.href) {
                  return (
                    <Link to={item.href} className={rowClass} onClick={() => setActiveRowId(item.id)}>
                      {inner}
                    </Link>
                  );
                }
                return (
                  <button type="button" className={rowClass} onClick={() => setActiveRowId(item.id)}>
                    {inner}
                  </button>
                );
              }}
            />
          ) : null}

          {activeTab === 'atendimentos' ? (
            <ZaptroPaginatedList
              items={attendances}
              resetKey="team-att"
              listClassName="zaptro-client-profile__list"
              empty={<div className="zaptro-client-profile__card">Nenhum atendimento atribuído.</div>}
              keyExtractor={(a) => a.id}
              renderItem={(a) => {
                const open = a.status === 'open' || a.status === 'waiting';
                return (
                  <Link
                    to={ZAPTRO_APP_ROUTES.clientProfile(a.id)}
                    className="zaptro-client-profile__row zaptro-client-profile__row--clickable"
                  >
                    <div className="zaptro-client-profile__row-icon">
                      <Users size={18} color="#0f172a" />
                    </div>
                    <div className="zaptro-client-profile__row-main">
                      <p className="zaptro-client-profile__row-title">{a.sender_name}</p>
                      <p className="zaptro-client-profile__row-body">
                        {a.last_message || a.sender_number} · {open ? 'Em atendimento' : 'Finalizado'}
                      </p>
                    </div>
                    <div className="zaptro-client-profile__row-end">
                      <span className="zaptro-client-profile__row-date">{formatDate(a.updated_at)}</span>
                      <ChevronRight size={16} className="zaptro-client-profile__row-chevron" />
                    </div>
                  </Link>
                );
              }}
            />
          ) : null}

          {activeTab === 'permissoes' ? (
            <div className="zaptro-client-profile__card zaptro-team-member-profile__perms">
              <h3>Páginas do painel</h3>
              <p className="zaptro-client-profile__card-note" style={{ marginBottom: 16 }}>
                {isAdmin
                  ? 'Marque o que este colaborador pode abrir no menu lateral do Zaptro.'
                  : 'Somente administradores podem alterar permissões.'}
              </p>
              <div className="zaptro-team-member-profile__perm-grid">
                {assignablePageIds(company).map((pid) => {
                  const def = ZAPTRO_PAGE_PERMISSION_DEFS.find((d) => d.id === pid);
                  const checked = editForm.pagePerms.includes(pid);
                  return (
                    <label key={pid} className="zaptro-team-member-profile__perm-item">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!isAdmin}
                        onChange={() => togglePerm(pid)}
                      />
                      <span>{def?.label ?? pid}</span>
                    </label>
                  );
                })}
              </div>
              {isAdmin ? (
                <button
                  type="button"
                  className="zaptro-team-member-profile__save-btn"
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  <Save size={16} />
                  Guardar permissões
                </button>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'conta' ? (
            <div className="zaptro-client-profile__card zaptro-team-member-profile__account">
              <h3>Dados & login</h3>
              {!isAdmin ? (
                <p className="zaptro-client-profile__card-note">Somente administradores podem editar a conta.</p>
              ) : (
                <div className="zaptro-team-member-profile__form">
                  <label className="zaptro-form-field">
                    <span className="zaptro-form-label">Nome completo</span>
                    <input
                      className="zaptro-form-control"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                    />
                  </label>
                  <label className="zaptro-form-field">
                    <span className="zaptro-form-label">E-mail de login</span>
                    <input
                      className="zaptro-form-control"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </label>
                  <label className="zaptro-form-field">
                    <span className="zaptro-form-label">Função</span>
                    <select
                      className="zaptro-form-control"
                      value={editForm.role}
                      onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="zaptro-form-field">
                    <span className="zaptro-form-label">Nova senha (opcional)</span>
                    <input
                      className="zaptro-form-control"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Mínimo 6 caracteres"
                      value={editForm.newPassword}
                      onChange={(e) => setEditForm((f) => ({ ...f, newPassword: e.target.value }))}
                    />
                  </label>
                  <button
                    type="button"
                    className="zaptro-team-member-profile__save-btn"
                    disabled={saving}
                    onClick={() => void handleSave()}
                  >
                    <Save size={16} />
                    Guardar dados
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default ZaptroAppTeamMemberProfilePage;
