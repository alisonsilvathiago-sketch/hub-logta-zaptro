import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  Phone,
  Route,
  ShieldBan,
  StickyNote,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import LogtaModal from '../components/Modal';
import type { ZaptroDemoOperation } from '../constants/zaptroClientsDemo';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import { useAuth } from '../context/AuthContext';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import {
  applyDemoClientOverride,
  clientToEditForm,
  deleteClientProfile,
  fetchContactAvatarByPhone,
  isClientBlocked,
  isDemoClientHidden,
  saveClientProfileEdit,
  setClientBlocked,
  type ZaptroClientProfileEditForm,
} from '../lib/zaptroClientProfileEdits';
import {
  getZaptroDemoClientById,
  isZaptroDemoClientId,
  type ZaptroDemoClientRow,
  type ZaptroDemoTimelineItem,
} from '../constants/zaptroClientsDemo';
import { ZAPTRO_APP_ROUTES } from './zaptroAppRoutes';
import { zaptroInboxUrl } from '../lib/zaptroProfileLinks';
import { zaptroTeamMemberProfilePath } from '../constants/zaptroRoutes';
import { resolveMemberAvatarUrl } from '../utils/zaptroAvatar';
import { zaptroCollaboratorColor } from '../lib/zaptroAgendaCollaborators';
import { buildZaptroDemoTeamMembers, isZaptroTeamDemoEnabled } from '../constants/zaptroTeamDemo';
import { ZaptroPaginatedList } from '../components/Zaptro/ZaptroPaginatedList';
import './zaptroAppClientProfile.css';

type Tab = 'timeline' | 'operations';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timelineIcon(kind: ZaptroDemoTimelineItem['kind']) {
  switch (kind) {
    case 'message':
      return MessageSquare;
    case 'quote':
      return DollarSign;
    case 'route':
      return Route;
    case 'payment':
      return DollarSign;
    default:
      return StickyNote;
  }
}

function timelineHref(
  item: ZaptroDemoTimelineItem,
  client: ZaptroDemoClientRow,
): string | null {
  switch (item.kind) {
    case 'message':
      return `${ZAPTRO_APP_ROUTES.INBOX}?c=${encodeURIComponent(client.sender_number)}`;
    case 'route':
      return ZAPTRO_APP_ROUTES.ROUTES;
    case 'quote':
    case 'payment':
      return ZAPTRO_APP_ROUTES.QUOTES;
    default:
      return null;
  }
}

function operationHref(op: ZaptroDemoOperation): string {
  if (op.status === 'em_rota') return ZAPTRO_APP_ROUTES.ROUTES;
  if (op.status === 'aprovado') return ZAPTRO_APP_ROUTES.QUOTES;
  return ZAPTRO_APP_ROUTES.ROUTES;
}

function timelineActionLabel(kind: ZaptroDemoTimelineItem['kind']): string {
  switch (kind) {
    case 'message':
      return 'Abrir conversa';
    case 'route':
      return 'Ver rota';
    case 'quote':
      return 'Ver orçamento';
    case 'payment':
      return 'Ver pagamento';
    default:
      return 'Ver detalhe';
  }
}

function operationActionLabel(op: ZaptroDemoOperation): string {
  if (op.status === 'em_rota') return 'Acompanhar rota';
  if (op.status === 'aprovado') return 'Ver orçamento';
  if (op.status === 'entregue') return 'Ver entrega';
  return 'Ver operação';
}

const ZaptroAppClientProfilePage: React.FC = () => {
  const { clientId = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ZaptroDemoClientRow | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('timeline');
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<ZaptroClientProfileEditForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [assignee, setAssignee] = useState<{
    id: string;
    name: string;
    avatar: string | null;
    color: string;
  } | null>(null);
  const isDemo = isZaptroDemoClientId(clientId);

  const loadClient = useCallback(async () => {
    if (isZaptroDemoClientId(clientId)) {
      if (isDemoClientHidden(clientId)) return null;
      const demo = getZaptroDemoClientById(clientId, profile?.company_id);
      return demo ? applyDemoClientOverride(demo) : null;
    }
    if (!profile?.company_id) return null;
    const { data } = await supabaseZaptro
      .from('whatsapp_conversations')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('id', clientId)
      .maybeSingle();
    if (!data) return null;
    const meta =
      data.metadata && typeof data.metadata === 'object'
        ? (data.metadata as ZaptroDemoClientRow['metadata'])
        : { company_name: '' };
    return {
      id: String(data.id),
      company_id: data.company_id,
      crm_type: 'client' as const,
      sender_name: data.sender_name || 'Cliente',
      sender_number: data.sender_number || '',
      customer_avatar: typeof data.customer_avatar === 'string' ? data.customer_avatar : null,
      assigned_to: typeof data.assigned_to === 'string' ? data.assigned_to : null,
      status: data.status === 'finished' ? 'finished' : data.status === 'waiting' ? 'waiting' : 'open',
      created_at: data.created_at,
      updated_at: data.updated_at,
      last_message: data.last_message,
      _demo_message_count: 0,
      metadata: meta,
      timeline: data.last_message
        ? [
            {
              id: 'live-1',
              at: data.updated_at,
              kind: 'message' as const,
              title: 'Última mensagem',
              body: data.last_message,
            },
          ]
        : [],
      operations: [],
      total_spent: 0,
    };
  }, [clientId, profile?.company_id]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const row = await loadClient();
      if (!cancelled) {
        setClient(row);
        setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [loadClient]);

  useEffect(() => {
    const assignedId = client?.assigned_to?.trim();
    if (!assignedId || !profile?.company_id) {
      setAssignee(null);
      return;
    }
    let cancelled = false;

    const applyAssignee = (id: string, name: string, avatar: string | null) => {
      if (cancelled) return;
      setAssignee({
        id,
        name,
        avatar,
        color: zaptroCollaboratorColor(id),
      });
    };

    if (isZaptroTeamDemoEnabled()) {
      const demoMember = buildZaptroDemoTeamMembers(profile.company_id).find((m) => m.id === assignedId);
      if (demoMember) {
        applyAssignee(demoMember.id, demoMember.full_name, null);
        return () => {
          cancelled = true;
        };
      }
    }

    void supabaseZaptro
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('id', assignedId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.id) {
          applyAssignee(
            String(data.id),
            String(data.full_name || data.email || 'Colaborador').trim(),
            resolveMemberAvatarUrl(
              { id: String(data.id), avatar_url: data.avatar_url },
              profile.id,
              profile,
            ),
          );
        } else {
          applyAssignee(assignedId, 'Colaborador', null);
        }
      })
      .catch(() => {
        if (!cancelled) applyAssignee(assignedId, 'Colaborador', null);
      });

    return () => {
      cancelled = true;
    };
  }, [client?.assigned_to, profile?.company_id, profile?.id, profile]);

  const openEdit = () => {
    if (!client) return;
    void (async () => {
      const base = clientToEditForm(client);
      if (!base.avatarUrl && profile?.company_id && !isDemo) {
        const fromWa = await fetchContactAvatarByPhone(profile.company_id, client.sender_number);
        if (fromWa) base.avatarUrl = fromWa;
      }
      setEditForm(base);
      setEditOpen(true);
    })();
  };

  const handlePhotoFile = (file: File | undefined) => {
    if (!file || !editForm) return;
    if (!file.type.startsWith('image/')) {
      notifyZaptro('error', 'Foto', 'Escolha um ficheiro de imagem (JPG ou PNG).');
      return;
    }
    if (file.size > 1_500_000) {
      notifyZaptro('error', 'Foto', 'Imagem demasiado grande (máx. 1,5 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : null;
      setEditForm((f) => (f ? { ...f, avatarUrl: url } : f));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async () => {
    if (!client || !editForm) return;
    const companyId = profile?.company_id || client.company_id;
    if (!companyId) return;
    setEditSaving(true);
    try {
      await saveClientProfileEdit(companyId, client.id, editForm, client.metadata);
      const refreshed = await loadClient();
      setClient(refreshed);
      setEditOpen(false);
      notifyZaptro('success', 'Cliente actualizado', 'Os dados foram guardados.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível guardar.';
      notifyZaptro('error', 'Erro ao guardar', message);
    } finally {
      setEditSaving(false);
    }
  };

  const blocked = client ? isClientBlocked(client) : false;
  const statusOpen = !blocked && (client?.status === 'open' || client?.status === 'waiting');

  const toggleBlock = async () => {
    if (!client || !profile?.company_id) return;
    setBlockBusy(true);
    try {
      const next = !blocked;
      await setClientBlocked(profile.company_id, client.id, next, client.metadata);
      const refreshed = await loadClient();
      setClient(refreshed);
      notifyZaptro(
        'success',
        next ? 'Cliente bloqueado' : 'Cliente desbloqueado',
        next
          ? 'O contacto deixa de receber novas propostas automáticas até ser reactivado.'
          : 'O cliente voltou a ficar activo na lista.',
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível actualizar.';
      notifyZaptro('error', 'Bloqueio', message);
    } finally {
      setBlockBusy(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!client || !profile?.company_id) return;
    setDeleteBusy(true);
    try {
      await deleteClientProfile(profile.company_id, client.id);
      notifyZaptro('success', 'Cliente removido', 'O registo foi excluído da lista de clientes.');
      navigate(ZAPTRO_APP_ROUTES.CLIENTS);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível excluir.';
      notifyZaptro('error', 'Excluir cliente', message);
    } finally {
      setDeleteBusy(false);
      setDeleteOpen(false);
    }
  };

  const sortedTimeline = useMemo(
    () => [...(client?.timeline || [])].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [client?.timeline],
  );

  if (loading) {
    return (
      <div className="zaptro-client-profile">
        <p style={{ color: '#949494', fontWeight: 700 }}>A carregar perfil do cliente…</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="zaptro-client-profile">
        <button type="button" className="zaptro-client-profile__back" onClick={() => navigate(ZAPTRO_APP_ROUTES.CLIENTS)}>
          <ChevronLeft size={18} /> Voltar para clientes
        </button>
        <p style={{ color: '#949494', fontWeight: 700 }}>Cliente não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="zaptro-client-profile">
      <button type="button" className="zaptro-client-profile__back" onClick={() => navigate(ZAPTRO_APP_ROUTES.CLIENTS)}>
        <ChevronLeft size={18} /> Voltar para clientes
      </button>

      {isDemo ? (
        <div className="zaptro-client-profile__demo">Pré-visualização — cadastro demo com histórico e operações</div>
      ) : null}

      <section className="zaptro-client-profile__hero">
        <div className="zaptro-client-profile__avatar-wrap">
          <div className="zaptro-client-profile__avatar">
            {client.customer_avatar ? (
              <img src={client.customer_avatar} alt="" className="zaptro-client-profile__avatar-img" />
            ) : (
              client.sender_name?.[0] || 'C'
            )}
          </div>
          {assignee ? (
            <span
              className="zaptro-client-profile__assignee-badge"
              title={`Responsável: ${assignee.name}`}
              style={{ borderColor: assignee.color }}
            >
              {assignee.avatar ? (
                <img src={assignee.avatar} alt="" />
              ) : (
                assignee.name[0]?.toUpperCase() || '?'
              )}
            </span>
          ) : null}
        </div>
        <div className="zaptro-client-profile__hero-main">
          <div className="zaptro-client-profile__name-row">
            <span
              className={`zaptro-client-profile__badge zaptro-client-profile__badge--name ${blocked ? 'zaptro-client-profile__badge--done' : statusOpen ? 'zaptro-client-profile__badge--open' : 'zaptro-client-profile__badge--done'}`}
            >
              {blocked ? 'BLOQUEADO' : statusOpen ? 'CLIENTE ACTIVO' : 'FINALIZADO'}
            </span>
            <h1 className="zaptro-client-profile__name">{client.sender_name}</h1>
          </div>
          <div className="zaptro-client-profile__meta">
            <span>{client.metadata.company_name || '—'}</span>
            <span>Cliente desde {formatDate(client.created_at)}</span>
          </div>
          {assignee ? (
            <button
              type="button"
              className="zaptro-client-profile__assignee-line"
              title="Ver perfil do colaborador"
              onClick={() => navigate(zaptroTeamMemberProfilePath(assignee.id))}
            >
              <span
                className="zaptro-client-profile__assignee-line-avatar"
                style={{ backgroundColor: assignee.avatar ? '#f1f5f9' : assignee.color }}
              >
                {assignee.avatar ? (
                  <img src={assignee.avatar} alt="" />
                ) : (
                  assignee.name[0]?.toUpperCase() || '?'
                )}
              </span>
              <span className="zaptro-client-profile__assignee-line-text">
                Responsável: <strong>{assignee.name}</strong>
              </span>
            </button>
          ) : statusOpen ? (
            <p className="zaptro-client-profile__assignee-line zaptro-client-profile__assignee-line--none">
              Sem responsável — assuma a conversa na inbox
            </p>
          ) : null}
        </div>
        <div className="zaptro-client-profile__hero-actions">
          <Link
            to={`${ZAPTRO_APP_ROUTES.INBOX}?c=${encodeURIComponent(client.sender_number)}`}
            className="zaptro-client-profile__conversar-btn"
            title="Abrir conversa no WhatsApp"
          >
            <Zap size={18} strokeWidth={1.9} aria-hidden />
            Conversar
          </Link>
          <button
            type="button"
            className="zaptro-client-profile__edit-btn"
            title="Editar cliente"
            aria-label="Editar cliente"
            onClick={openEdit}
          >
            <Pencil size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`zaptro-client-profile__block-btn ${blocked ? 'zaptro-client-profile__block-btn--active' : ''}`}
            title={blocked ? 'Desbloquear cliente' : 'Bloquear cliente'}
            aria-label={blocked ? 'Desbloquear cliente' : 'Bloquear cliente'}
            disabled={blockBusy}
            onClick={() => void toggleBlock()}
          >
            <ShieldBan size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="zaptro-client-profile__delete-btn"
            title="Excluir cliente"
            aria-label="Excluir cliente"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={18} strokeWidth={2} />
          </button>
        </div>
      </section>

      <div className="zaptro-client-profile__grid">
        <aside className="zaptro-client-profile__side">
          <div className="zaptro-client-profile__card">
            <h3>Contacto</h3>
            <div className="zaptro-client-profile__info">
              <Phone size={16} color="#949494" />
              <Link to={zaptroInboxUrl(client.sender_number)} className="zaptro-client-profile__contact-value zaptro-client-profile__contact-value--link">
                {client.sender_number}
              </Link>
            </div>
            {client.metadata.email ? (
              <div className="zaptro-client-profile__info">
                <Mail size={16} color="#949494" />
                <a href={`mailto:${client.metadata.email}`} className="zaptro-client-profile__contact-link">
                  {client.metadata.email}
                </a>
              </div>
            ) : null}
            {client.metadata.cpf || client.metadata.cnpj ? (
              <div className="zaptro-client-profile__info">
                <User size={16} color="#949494" />
                <span className="zaptro-client-profile__info-value">
                  {client.metadata.document_type === 'cnpj' ? 'CNPJ' : 'CPF'}:{' '}
                  {client.metadata.cnpj || client.metadata.cpf}
                </span>
              </div>
            ) : null}
            {client.metadata.address ? (
              <div className="zaptro-client-profile__info">
                <MapPin size={16} color="#949494" />
                <span className="zaptro-client-profile__info-value">{client.metadata.address}</span>
              </div>
            ) : null}
            <div className="zaptro-client-profile__info">
              <Calendar size={16} color="#949494" />
              <span className="zaptro-client-profile__info-value">
                Último contacto {formatDate(client.updated_at)}
              </span>
            </div>
            {assignee ? (
              <div className="zaptro-client-profile__info">
                <User size={16} color="#949494" />
                <button
                  type="button"
                  className="zaptro-client-profile__assignee-side"
                  onClick={() => navigate(zaptroTeamMemberProfilePath(assignee.id))}
                >
                  <span
                    className="zaptro-client-profile__assignee-side-avatar"
                    style={{ backgroundColor: assignee.avatar ? '#f1f5f9' : assignee.color }}
                  >
                    {assignee.avatar ? (
                      <img src={assignee.avatar} alt="" />
                    ) : (
                      assignee.name[0]?.toUpperCase() || '?'
                    )}
                  </span>
                  <span className="zaptro-client-profile__info-value">
                    Atendido por <strong>{assignee.name}</strong>
                  </span>
                </button>
              </div>
            ) : null}
          </div>
          {client.metadata.notes ? (
            <div className="zaptro-client-profile__card">
              <h3>Notas internas</h3>
              <p className="zaptro-client-profile__card-note">{client.metadata.notes}</p>
            </div>
          ) : null}
        </aside>

        <main>
          <div className="zaptro-client-profile__kpis">
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Volume total</div>
              <div className="zaptro-client-profile__kpi-value">{formatMoney(client.total_spent)}</div>
            </div>
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Interacções</div>
              <div className="zaptro-client-profile__kpi-value">{client._demo_message_count || '—'}</div>
            </div>
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Operações</div>
              <div className="zaptro-client-profile__kpi-value">{client.operations.length}</div>
            </div>
          </div>

          <div className="zaptro-client-profile__tabs">
            <button
              type="button"
              className={`zaptro-client-profile__tab ${activeTab === 'timeline' ? 'zaptro-client-profile__tab--active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              Histórico completo
            </button>
            <button
              type="button"
              className={`zaptro-client-profile__tab ${activeTab === 'operations' ? 'zaptro-client-profile__tab--active' : ''}`}
              onClick={() => setActiveTab('operations')}
            >
              Compras / operações
            </button>
          </div>

          {activeTab === 'timeline' ? (
            <ZaptroPaginatedList
              items={sortedTimeline}
              resetKey="timeline"
              listClassName="zaptro-client-profile__list"
              empty={<div className="zaptro-client-profile__card">Sem eventos registados ainda.</div>}
              keyExtractor={(item) => item.id}
              renderItem={(item) => {
                const Icon = timelineIcon(item.kind);
                const href = timelineHref(item, client);
                const isActive = activeRowId === item.id;
                const rowClass = `zaptro-client-profile__row${href ? ' zaptro-client-profile__row--clickable' : ''}${isActive ? ' zaptro-client-profile__row--active' : ''}`;
                const inner = (
                  <>
                    <div className="zaptro-client-profile__row-icon">
                      <Icon size={18} color="#0f172a" />
                    </div>
                    <div className="zaptro-client-profile__row-main">
                      <p className="zaptro-client-profile__row-title">{item.title}</p>
                      <p className="zaptro-client-profile__row-body">
                        {item.body}
                        {item.amount != null ? ` · ${formatMoney(item.amount)}` : ''}
                      </p>
                      {href ? (
                        <span className="zaptro-client-profile__row-action">{timelineActionLabel(item.kind)}</span>
                      ) : null}
                    </div>
                    <div className="zaptro-client-profile__row-end">
                      <span className="zaptro-client-profile__row-date">{formatDateTime(item.at)}</span>
                      {href ? <ChevronRight size={16} className="zaptro-client-profile__row-chevron" /> : null}
                    </div>
                  </>
                );
                if (href) {
                  return (
                    <Link to={href} className={rowClass} onClick={() => setActiveRowId(item.id)}>
                      {inner}
                    </Link>
                  );
                }
                return (
                  <button
                    type="button"
                    className={rowClass}
                    onClick={() => {
                      setActiveRowId(item.id);
                      notifyZaptro('info', item.title, item.body);
                    }}
                  >
                    {inner}
                  </button>
                );
              }}
            />
          ) : (
            <ZaptroPaginatedList
              items={client.operations}
              resetKey="operations"
              listClassName="zaptro-client-profile__list"
              empty={<div className="zaptro-client-profile__card">Sem operações registadas.</div>}
              keyExtractor={(op) => op.id}
              renderItem={(op) => {
                const href = operationHref(op);
                const isActive = activeRowId === op.id;
                return (
                  <Link
                    to={href}
                    className={`zaptro-client-profile__row zaptro-client-profile__row--clickable${isActive ? ' zaptro-client-profile__row--active' : ''}`}
                    onClick={() => setActiveRowId(op.id)}
                  >
                    <div className="zaptro-client-profile__row-icon">
                      <Package size={18} color="#0f172a" />
                    </div>
                    <div className="zaptro-client-profile__row-main">
                      <p className="zaptro-client-profile__row-title">{op.label}</p>
                      <p className="zaptro-client-profile__row-body">{formatMoney(op.value)}</p>
                      <span className="zaptro-client-profile__row-action">{operationActionLabel(op)}</span>
                    </div>
                    <div className="zaptro-client-profile__row-end">
                      <span className={`zaptro-client-profile__status zaptro-client-profile__status--${op.status}`}>
                        {op.status.replace('_', ' ')}
                      </span>
                      <span className="zaptro-client-profile__row-date">{formatDate(op.date)}</span>
                      <ChevronRight size={16} className="zaptro-client-profile__row-chevron" />
                    </div>
                  </Link>
                );
              }}
            />
          )}
        </main>
      </div>

      <LogtaModal
        isOpen={editOpen && !!editForm}
        onClose={() => setEditOpen(false)}
        title="Editar cliente"
        width="640px"
        variant="center"
        headerStyle={{ padding: '14px 20px' }}
        contentStyle={{ padding: '16px 20px 20px' }}
      >
        {editForm ? (
          <div className="zaptro-client-profile__edit-modal">
            <div className="zaptro-client-profile__edit-photo">
              <div className="zaptro-client-profile__edit-photo-preview">
                {editForm.avatarUrl ? (
                  <img src={editForm.avatarUrl} alt="" />
                ) : (
                  editForm.responsibleName?.[0]?.toUpperCase() || '?'
                )}
              </div>
              <div>
                <label className="zaptro-client-profile__edit-label">
                  Foto do cliente
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      handlePhotoFile(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
                {editForm.avatarUrl ? (
                  <button
                    type="button"
                    className="zaptro-client-profile__btn-link"
                    onClick={() => setEditForm({ ...editForm, avatarUrl: null })}
                  >
                    Remover foto
                  </button>
                ) : null}
              </div>
            </div>

            <div className="zaptro-client-profile__edit-grid">
              <label className="zaptro-client-profile__edit-label zaptro-client-profile__edit-grid--full">
                Nome do responsável *
                <input
                  value={editForm.responsibleName}
                  onChange={(e) => setEditForm({ ...editForm, responsibleName: e.target.value })}
                  placeholder="Nome completo"
                />
              </label>
              <label className="zaptro-client-profile__edit-label zaptro-client-profile__edit-grid--full">
                Nome da empresa
                <input
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                  placeholder="Razão social ou nome fantasia"
                />
              </label>
              <label className="zaptro-client-profile__edit-label">
                Telefone / WhatsApp *
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  inputMode="tel"
                  placeholder="5511999999999"
                />
              </label>
              <label className="zaptro-client-profile__edit-label">
                E-mail
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="email@empresa.com.br"
                />
              </label>
              <label className="zaptro-client-profile__edit-label">
                Tipo de documento
                <select
                  value={editForm.documentType}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      documentType: e.target.value as ZaptroClientProfileEditForm['documentType'],
                    })
                  }
                >
                  <option value="">—</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                </select>
              </label>
              <label className="zaptro-client-profile__edit-label">
                CPF / CNPJ
                <input
                  value={editForm.document}
                  onChange={(e) => setEditForm({ ...editForm, document: e.target.value })}
                  placeholder="Somente números"
                />
              </label>
              <label className="zaptro-client-profile__edit-label zaptro-client-profile__edit-grid--full">
                Endereço
                <input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Rua, número, cidade, CEP"
                />
              </label>
              <label className="zaptro-client-profile__edit-label zaptro-client-profile__edit-grid--full">
                Notas internas
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Observações da equipa"
                  rows={3}
                />
              </label>
            </div>

            <div className="zaptro-client-profile__edit-foot">
              <button type="button" className="hub-premium-pill secondary" onClick={() => setEditOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="hub-premium-pill dark"
                disabled={editSaving || !editForm.responsibleName.trim()}
                onClick={() => void handleSaveEdit()}
              >
                {editSaving ? 'A guardar…' : 'Guardar alterações'}
              </button>
            </div>
          </div>
        ) : null}
      </LogtaModal>

      <LogtaModal
        isOpen={deleteOpen}
        onClose={() => !deleteBusy && setDeleteOpen(false)}
        title="Excluir cliente"
        width="440px"
        variant="center"
      >
        <p style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 600, color: '#64748b', lineHeight: 1.5 }}>
          Tem a certeza que deseja excluir <strong>{client.sender_name}</strong>? O histórico deixa de aparecer na lista de
          clientes. Esta acção não pode ser desfeita.
        </p>
        <div className="zaptro-client-profile__edit-foot">
          <button type="button" className="hub-premium-pill secondary" disabled={deleteBusy} onClick={() => setDeleteOpen(false)}>
            Cancelar
          </button>
          <button type="button" className="hub-premium-pill dark" disabled={deleteBusy} onClick={() => void handleDeleteClient()}>
            {deleteBusy ? 'A excluir…' : 'Excluir cliente'}
          </button>
        </div>
      </LogtaModal>
    </div>
  );
};

export default ZaptroAppClientProfilePage;
