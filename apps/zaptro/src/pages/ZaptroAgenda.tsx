import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlignLeft, CalendarClock, ChevronLeft, ChevronRight, Clock, Download, Loader2, MapPin, Palette, Plus, Search, User, Users, Video } from 'lucide-react';
import LogtaModal from '../components/Modal';
import { GmailIcon, GoogleGIcon, GoogleMeetIcon } from '../components/Zaptro/GoogleBrandIcons';
import { useAuth } from '../context/AuthContext';
import { useGoogleCalendarConnection } from '../hooks/useGoogleCalendarConnection';
import { createGoogleCalendarEvent } from '../lib/zaptroGoogleApi';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import {
  appendZaptroActivityLog,
  deleteZaptroActivityLog,
  duplicateZaptroActivityLog,
  readZaptroActivityLog,
  updateZaptroActivityLog,
  zaptroActivityLogStorageKey,
  ZAPTRO_ACTIVITY_LOG_EVENT,
  type ZaptroActivityEntry,
  type ZaptroActivityLogType,
} from '../constants/zaptroActivityLogStore';
import {
  agendaEventDisplayColor,
  canUserSeeAgendaEntry,
  formatMentionsForDetails,
  isZaptroAgendaGlobalView,
  zaptroCollaboratorColor,
  ZAPTRO_AGENDA_COLLABORATOR_COLORS,
} from '../lib/zaptroAgendaCollaborators';
import { useZaptroAgendaTeam } from '../hooks/useZaptroAgendaTeam';
import { ZaptroAgendaEventPopover } from '../components/Zaptro/ZaptroAgendaEventPopover';
import {
  ZaptroAgendaContextMenu,
  type AgendaContextMenuState,
} from '../components/Zaptro/ZaptroAgendaContextMenu';
import { isZaptroTenantAdminRole } from '../utils/zaptroPermissions';
import '../app/zaptroAppAgenda.css';

const WEEKDAYS = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'] as const;
const MINI_WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;

function formatActivityTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function yyyyMmDd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function monthLabel(d: Date) {
  try {
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  } catch {
    return '—';
  }
}

function buildMonthGrid(viewMonth: Date) {
  const first = startOfMonth(viewMonth);
  const firstWeekday = first.getDay(); // 0=domingo
  const start = new Date(first);
  start.setDate(first.getDate() - firstWeekday);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function parseAttendeeEmails(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
}

const ZaptroAgenda: React.FC = () => {
  const { profile, isMaster } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tenantId = profile?.company_id?.trim() || 'local-demo';
  const userId = profile?.id ?? null;
  const actorName = profile?.full_name?.trim() || profile?.email?.trim() || 'Colaborador';
  const actorColor = userId ? zaptroCollaboratorColor(userId) : undefined;
  const isGlobalView = isZaptroAgendaGlobalView(profile?.role, isMaster) || isZaptroTenantAdminRole(profile?.role);
  const { members: teamMembers } = useZaptroAgendaTeam(profile?.company_id);
  const google = useGoogleCalendarConnection();

  const [, bump] = useState(0);
  const reload = useCallback(() => bump((n) => n + 1), []);
  const [savingGoogle, setSavingGoogle] = useState(false);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ZaptroActivityLogType | 'todos'>('todos');
  const [filterDate, setFilterDate] = useState<'todos' | 'hoje'>('todos');
  const [eventPopover, setEventPopover] = useState<{ item: ZaptroActivityEntry; x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<AgendaContextMenuState>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createMentionIds, setCreateMentionIds] = useState<string[]>([]);
  const [createColor, setCreateColor] = useState(() => actorColor || ZAPTRO_AGENDA_COLLABORATOR_COLORS[0]);

  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingWhen, setMeetingWhen] = useState(() => toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [meetingLead, setMeetingLead] = useState('');
  const [meetingPhone, setMeetingPhone] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [isNewLead, setIsNewLead] = useState(true);

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [createOpen, setCreateOpen] = useState(false);
  const [createTab, setCreateTab] = useState<'evento' | 'tarefa'>('evento');
  const [createTitle, setCreateTitle] = useState('');
  const [createWhenStart, setCreateWhenStart] = useState(() => toLocalInputValue(new Date()));
  const [createWhenEnd, setCreateWhenEnd] = useState(() => toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [createHasTime, setCreateHasTime] = useState(false);
  const [createGuests, setCreateGuests] = useState('');
  const [createLocation, setCreateLocation] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [addGoogleMeet, setAddGoogleMeet] = useState(true);
  const [meetingGuestEmail, setMeetingGuestEmail] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');

  const rawLog = useMemo(() => readZaptroActivityLog(tenantId), [tenantId, bump]);

  const visibleLog = useMemo(
    () => rawLog.filter((e) => canUserSeeAgendaEntry(e, userId, isGlobalView)),
    [rawLog, userId, isGlobalView],
  );

  useEffect(() => {
    const g = searchParams.get('google');
    if (g === 'connected') {
      notifyZaptro('success', 'Google conectado', 'A sua agenda está ligada. Pode criar eventos com Meet.');
      void google.refresh();
      searchParams.delete('google');
      searchParams.delete('reason');
      setSearchParams(searchParams, { replace: true });
    } else if (g === 'error') {
      const reason = searchParams.get('reason') || 'erro';
      notifyZaptro('error', 'Falha ao ligar Google', reason);
      searchParams.delete('google');
      searchParams.delete('reason');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, google]);

  useEffect(() => {
    const dateParam = searchParams.get('date');
    const qParam = searchParams.get('q');
    const eventParam = searchParams.get('event');
    if (qParam) setSearch(qParam);
    if (dateParam) {
      const d = new Date(`${dateParam.slice(0, 10)}T12:00:00`);
      if (!Number.isNaN(d.getTime())) setViewMonth(startOfMonth(d));
    }
    if (eventParam) {
      const item = rawLog.find((e) => e.id === eventParam);
      if (item) {
        const t = window.setTimeout(() => openEventPopover(item), 120);
        return () => window.clearTimeout(t);
      }
    }
  }, [searchParams, rawLog]);

  useEffect(() => {
    const onEvt = () => reload();
    window.addEventListener(ZAPTRO_ACTIVITY_LOG_EVENT, onEvt);
    return () => window.removeEventListener(ZAPTRO_ACTIVITY_LOG_EVENT, onEvt);
  }, [reload]);

  useEffect(() => {
    const k = zaptroActivityLogStorageKey(tenantId);
    const onStorage = (e: StorageEvent) => {
      if (e.key === k) reload();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [tenantId, reload]);

  const openEventPopover = (item: ZaptroActivityEntry, e?: React.MouseEvent) => {
    setEventPopover({
      item,
      x: e?.clientX ?? window.innerWidth / 2 - 190,
      y: e?.clientY ?? window.innerHeight / 2 - 120,
    });
  };

  const startEditEvent = (item: ZaptroActivityEntry) => {
    setEditingId(item.id);
    setCreateTitle(item.clientLabel);
    setCreateTab(item.action.includes('Tarefa') ? 'tarefa' : 'evento');
    setCreateHasTime(true);
    setCreateWhenStart(toLocalInputValue(new Date(item.at)));
    const end = item.endAt ? new Date(item.endAt) : new Date(new Date(item.at).getTime() + 60 * 60 * 1000);
    setCreateWhenEnd(toLocalInputValue(end));
    setCreateMentionIds(item.mentionedUserIds ?? []);
    setCreateColor(item.actorColor || (item.actorUserId ? zaptroCollaboratorColor(item.actorUserId) : actorColor || ZAPTRO_AGENDA_COLLABORATOR_COLORS[0]));
    setCreateDescription('');
    setCreateGuests('');
    setCreateLocation('');
    setEventPopover(null);
    setCreateOpen(true);
  };

  const handleDeleteEvent = (item: ZaptroActivityEntry) => {
    deleteZaptroActivityLog(tenantId, item.id);
    setEventPopover(null);
    reload();
    notifyZaptro('success', 'Removido', 'Evento excluído do calendário.');
  };

  const handleDuplicateEvent = (item: ZaptroActivityEntry) => {
    const copy = duplicateZaptroActivityLog(tenantId, item.id);
    setEventPopover(null);
    reload();
    if (copy) notifyZaptro('success', 'Duplicado', 'Cópia criada para o dia seguinte.');
  };

  const handleMarkDone = (item: ZaptroActivityEntry) => {
    const next = item.status === 'done' ? 'open' : 'done';
    updateZaptroActivityLog(tenantId, item.id, { status: next });
    setEventPopover(null);
    reload();
  };

  const filtered = useMemo(() => {
    let list = [...visibleLog];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const hay = [item.actorName, item.action, item.clientLabel, item.details, item.type]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (filterType !== 'todos') list = list.filter((item) => item.type === filterType);

    if (filterDate === 'hoje') {
      const today = new Date().toISOString().split('T')[0];
      list = list.filter((item) => item.at.split('T')[0] === today);
    }

    return list;
  }, [visibleLog, search, filterType, filterDate]);

  const exportLogs = () => {
    const data = readZaptroActivityLog(tenantId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zaptro-agenda-${tenantId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pushGoogleEvent = async (opts: {
    summary: string;
    startIso: string;
    endIso: string;
    description?: string;
    location?: string;
    attendees?: string[];
    withMeet?: boolean;
  }) => {
    const { data } = await supabaseZaptro.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('not_authenticated');
    return createGoogleCalendarEvent(token, {
      summary: opts.summary,
      description: opts.description,
      startDateTime: opts.startIso,
      endDateTime: opts.endIso,
      location: opts.location,
      attendees: opts.attendees,
      addGoogleMeet: opts.withMeet !== false,
      actorName,
      geocodeLocation: true,
    });
  };

  const scheduleMeeting = async () => {
    const lead = meetingLead.trim();
    if (!lead) return;
    const phone = meetingPhone.trim();
    const notes = meetingNotes.trim();
    const whenIso = new Date(meetingWhen).toISOString();
    const endIso = new Date(new Date(meetingWhen).getTime() + 60 * 60 * 1000).toISOString();
    const guests = parseAttendeeEmails(meetingGuestEmail);
    let meetLink: string | null = null;
    let mapsLocation = meetingLocation.trim();

    if (google.connected) {
      setSavingGoogle(true);
      try {
        const created = await pushGoogleEvent({
          summary: `Reunião — ${lead}`,
          startIso: whenIso,
          endIso,
          description: [notes, phone ? `Tel: ${phone}` : null, isNewLead ? 'Novo lead' : 'Lead existente']
            .filter(Boolean)
            .join('\n'),
          location: mapsLocation || undefined,
          attendees: guests,
          withMeet: true,
        });
        meetLink = created.meetLink ?? null;
        if (created.location) mapsLocation = created.location;
        notifyZaptro('success', 'Reunião no Google Calendar', meetLink ? 'Link do Meet gerado.' : 'Evento criado na sua agenda.');
      } catch (e: unknown) {
        notifyZaptro('error', 'Google Calendar', e instanceof Error ? e.message : 'Não foi possível criar o evento.');
      } finally {
        setSavingGoogle(false);
      }
    }

    appendZaptroActivityLog(tenantId, {
      type: 'atendimento',
      actorName,
      actorUserId: userId ?? undefined,
      actorColor,
      clientLabel: lead,
      action: 'Reunião marcada',
      at: whenIso,
      endAt: endIso,
      status: 'open',
      details: [
        isNewLead ? 'Novo lead (primeiro contacto)' : 'Lead existente',
        phone ? `Tel: ${phone}` : null,
        notes ? `Obs: ${notes}` : null,
        meetLink ? `Meet: ${meetLink}` : null,
        mapsLocation ? `Local: ${mapsLocation}` : null,
        guests.length ? `Convidados: ${guests.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    });

    setMeetingOpen(false);
    setMeetingNotes('');
    setMeetingGuestEmail('');
    setMeetingLocation('');
  };

  const eventsByDay = useMemo(() => {
    const m = new Map<string, ZaptroActivityEntry[]>();
    for (const item of filtered) {
      const key = item.at.split('T')[0];
      const prev = m.get(key);
      if (prev) prev.push(item);
      else m.set(key, [item]);
    }
    // newest first already; but keep stable order inside day
    for (const [k, list] of m) {
      list.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
      m.set(k, list);
    }
    return m;
  }, [filtered]);

  const openCreateForDay = (d: Date) => {
    const base = new Date(d);
    base.setHours(9, 0, 0, 0);
    const end = new Date(base);
    end.setHours(10, 0, 0, 0);
    setEditingId(null);
    setCreateTitle('');
    setCreateTab('evento');
    setCreateHasTime(false);
    setCreateWhenStart(toLocalInputValue(base));
    setCreateWhenEnd(toLocalInputValue(end));
    setCreateMentionIds([]);
    setCreateColor(actorColor || ZAPTRO_AGENDA_COLLABORATOR_COLORS[0]);
    setCreateGuests('');
    setCreateLocation('');
    setCreateDescription('');
    setCreateOpen(true);
  };

  const saveQuickEvent = async () => {
    const title = createTitle.trim();
    if (!title) return;

    const startIso = new Date(createWhenStart).toISOString();
    const endIso = new Date(createWhenEnd).toISOString();
    const label = title;
    const guests = parseAttendeeEmails(createGuests);
    let meetLink: string | null = null;
    let mapsLocation = createLocation.trim();

    if (google.connected && createTab === 'evento') {
      setSavingGoogle(true);
      try {
        const created = await pushGoogleEvent({
          summary: title,
          startIso,
          endIso,
          description: createDescription.trim() || undefined,
          location: mapsLocation || undefined,
          attendees: guests,
          withMeet: addGoogleMeet,
        });
        meetLink = created.meetLink ?? null;
        if (created.location) mapsLocation = created.location;
        notifyZaptro('success', 'Evento no Google Calendar', meetLink ? 'Meet incluído no evento.' : 'Evento criado.');
      } catch (e: unknown) {
        notifyZaptro('error', 'Google Calendar', e instanceof Error ? e.message : 'Falha ao sincronizar.');
      } finally {
        setSavingGoogle(false);
      }
    }

    const mentionNames = createMentionIds
      .map((id) => teamMembers.find((m) => m.id === id)?.name)
      .filter(Boolean) as string[];

    const details = [
      createHasTime ? `Início: ${formatActivityTime(startIso)} · Fim: ${formatActivityTime(endIso)}` : null,
      meetLink ? `Meet: ${meetLink}` : null,
      mapsLocation ? `Local: ${mapsLocation}` : null,
      guests.length ? `Convidados: ${guests.join(', ')}` : null,
      mentionNames.length ? formatMentionsForDetails(mentionNames) : null,
      createDescription.trim() ? createDescription.trim() : null,
    ]
      .filter(Boolean)
      .join(' · ');

    if (editingId) {
      updateZaptroActivityLog(tenantId, editingId, {
        clientLabel: label,
        action: createTab === 'tarefa' ? 'Tarefa criada' : 'Evento criado',
        at: startIso,
        endAt: endIso,
        details: details || undefined,
        mentionedUserIds: createMentionIds,
        mentionedNames: mentionNames,
        actorColor: createColor,
      });
      notifyZaptro('success', 'Atualizado', 'Evento guardado no calendário.');
      setEditingId(null);
    } else {
      appendZaptroActivityLog(tenantId, {
        type: 'atendimento',
        actorName,
        actorUserId: userId ?? undefined,
        actorColor: createColor,
        clientLabel: label,
        action: createTab === 'tarefa' ? 'Tarefa criada' : 'Evento criado',
        at: startIso,
        endAt: endIso,
        details: details || undefined,
        mentionedUserIds: createMentionIds.length ? createMentionIds : undefined,
        mentionedNames: mentionNames.length ? mentionNames : undefined,
        status: 'open',
      });
    }

    setCreateOpen(false);
    setCreateGuests('');
    setCreateLocation('');
    setCreateDescription('');
    setCreateMentionIds([]);
  };

  const todayKey = yyyyMmDd(new Date());
  const miniDays = buildMonthGrid(viewMonth);

  const goToDay = (d: Date) => {
    setViewMonth(startOfMonth(d));
  };

  return (
    <div className="zaptro-agenda">
      <aside className="zaptro-agenda__sidebar">
        <button type="button" className="zaptro-agenda__create" onClick={() => openCreateForDay(new Date())}>
          <Plus size={18} strokeWidth={2.5} /> Criar
        </button>

        <div className="zaptro-agenda__mini">
          <div className="zaptro-agenda__mini-head">
            <button
              type="button"
              className="zaptro-agenda__btn-icon"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span>{monthLabel(viewMonth)}</span>
            <button
              type="button"
              className="zaptro-agenda__btn-icon"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="zaptro-agenda__mini-grid">
            {MINI_WEEKDAYS.map((w, i) => (
              <span key={`mini-w-${i}`} className="zaptro-agenda__mini-w">
                {w}
              </span>
            ))}
            {miniDays.map((d) => {
              const key = yyyyMmDd(d);
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const isToday = key === todayKey;
              return (
                <button
                  key={`mini-${key}`}
                  type="button"
                  className={[
                    'zaptro-agenda__mini-day',
                    !inMonth ? 'zaptro-agenda__mini-day--muted' : '',
                    isToday ? 'zaptro-agenda__mini-day--today' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => goToDay(d)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="zaptro-agenda__google">
          <div className="zaptro-agenda__google-head">
            <GoogleGIcon size={18} />
            <span>Google Calendar</span>
          </div>
          {google.loading ? (
            <span style={{ fontSize: 11, color: '#949494', fontWeight: 600 }}>A verificar ligação…</span>
          ) : google.connected && google.googleEmail ? (
            <>
              <div className="zaptro-agenda__google-email">
                <GmailIcon size={18} />
                <span>{google.googleEmail}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#00832d', fontWeight: 600 }}>
                <GoogleMeetIcon size={16} />
                Meet activo nos eventos
              </div>
              <button type="button" className="zaptro-agenda__google-disconnect" onClick={() => void google.disconnect()} disabled={google.busy}>
                Desligar conta
              </button>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#949494', lineHeight: 1.45, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                Ligue a sua conta para criar eventos com <GoogleMeetIcon size={14} /> Meet e convites por e-mail.
              </p>
              <button
                type="button"
                className="zaptro-agenda__google-connect"
                onClick={() => void google.connect()}
                disabled={google.busy || !google.apiReady || !google.oauthConfigured}
              >
                <GoogleGIcon size={18} />
                Conectar com o Google
              </button>
              {!google.oauthConfigured ? (
                <span style={{ fontSize: 10, color: '#949494' }}>Configure OAuth no servidor (GOOGLE_OAUTH_*).</span>
              ) : null}
            </>
          )}
        </div>

        <div className="zaptro-agenda__filters">
          <p className="zaptro-agenda__filter-label">As minhas agendas</p>
          <label className="zaptro-agenda__filter-row">
            <span className="zaptro-agenda__filter-dot" style={{ background: '#039be5' }} />
            CRM / Reuniões
          </label>
          <label className="zaptro-agenda__filter-row">
            <span className="zaptro-agenda__filter-dot" style={{ background: '#0b8043' }} />
            Eventos
          </label>
          <label className="zaptro-agenda__filter-row">
            <span className="zaptro-agenda__filter-dot" style={{ background: '#7986cb' }} />
            Rotas
          </label>
          {isGlobalView && teamMembers.length > 0 ? (
            <div className="zaptro-agenda__team-legend">
              <p className="zaptro-agenda__filter-label">Colaboradores</p>
              {teamMembers.slice(0, 8).map((m) => (
                <div key={m.id} className="zaptro-agenda__team-row">
                  <span className="zaptro-agenda__team-dot" style={{ background: m.color }} />
                  <span>{m.name}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </aside>

      <div className="zaptro-agenda__main">
        <div className="zaptro-agenda__toolbar">
          <div className="zaptro-agenda__toolbar-left">
            <button type="button" className="zaptro-agenda__btn-ghost" onClick={() => goToDay(new Date())}>
              Hoje
            </button>
            <button
              type="button"
              className="zaptro-agenda__btn-icon"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="zaptro-agenda__btn-icon"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight size={20} />
            </button>
            <h2 className="zaptro-agenda__month-title">{monthLabel(viewMonth)}</h2>
            {isGlobalView ? <span className="zaptro-agenda__global-badge">Calendário global · toda a equipa</span> : null}
          </div>

          <div className="zaptro-agenda__toolbar-right">
            <select
              className="zaptro-agenda__select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ZaptroActivityLogType | 'todos')}
            >
              <option value="todos">Todos</option>
              <option value="atendimento">CRM</option>
              <option value="login">Login</option>
              <option value="rota">Rotas</option>
              <option value="motorista">Motoristas</option>
              <option value="config">Config</option>
              <option value="sistema">Sistema</option>
            </select>

            <div className="zaptro-agenda__search">
              <Search size={16} color="#949494" />
              <input
                placeholder="Pesquisar pessoas"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button type="button" className="zaptro-agenda__btn-ghost" onClick={() => setMeetingOpen(true)}>
              <span className="zaptro-agenda__btn-ghost-icon" aria-hidden>
                <CalendarClock size={16} strokeWidth={2} />
              </span>
              Reunião
            </button>
            <button type="button" className="zaptro-agenda__btn-ghost" onClick={exportLogs}>
              <span className="zaptro-agenda__btn-ghost-icon" aria-hidden>
                <Download size={16} strokeWidth={2} />
              </span>
              Exportar
            </button>
          </div>
        </div>

        <div className="zaptro-agenda__grid-wrap">
          <div className="zaptro-agenda__weekdays">
            {WEEKDAYS.map((w) => (
              <div key={w} className="zaptro-agenda__weekday">
                {w}
              </div>
            ))}
          </div>

          <div className="zaptro-agenda__month-grid">
            {buildMonthGrid(viewMonth).map((d) => {
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const key = yyyyMmDd(d);
              const items = eventsByDay.get(key) || [];
              const isToday = key === todayKey;
              return (
                <button
                  key={key}
                  type="button"
                  className="zaptro-agenda__day"
                  onClick={() => openCreateForDay(d)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({ kind: 'day', x: e.clientX, y: e.clientY, date: d });
                  }}
                >
                  <div className="zaptro-agenda__day-head">
                    <span
                      className={[
                        'zaptro-agenda__day-num',
                        !inMonth ? 'zaptro-agenda__day-num--muted' : '',
                        isToday ? 'zaptro-agenda__day-num--today' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {d.getDate()}
                    </span>
                  </div>

                  <div className="zaptro-agenda__events">
                    {items.slice(0, 3).map((it) => (
                      <span
                        key={it.id}
                        className={[
                          'zaptro-agenda__event',
                          'zaptro-agenda__event--custom',
                          it.status === 'done' ? 'is-done' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        style={{ backgroundColor: agendaEventDisplayColor(it) }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEventPopover(it, e);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setContextMenu({ kind: 'event', x: e.clientX, y: e.clientY, item: it });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                            openEventPopover(it);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        title={`${it.action} — ${it.clientLabel} (${it.actorName})`}
                      >
                        {isGlobalView ? `${it.actorName.split(' ')[0]}: ` : ''}
                        {it.clientLabel}
                      </span>
                    ))}
                    {items.length > 3 ? (
                      <span className="zaptro-agenda__more">+{items.length - 3} mais</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <LogtaModal
        isOpen={meetingOpen}
        onClose={() => setMeetingOpen(false)}
        title="Marcar reunião"
        width="560px"
        variant="center"
        headerStyle={{ padding: '14px 20px' }}
        contentStyle={{ padding: '16px 20px 20px' }}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={labelStyle}>
            Data e hora
            <input type="datetime-local" value={meetingWhen} onChange={(e) => setMeetingWhen(e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Lead (nome)
            <input value={meetingLead} onChange={(e) => setMeetingLead(e.target.value)} placeholder="Ex.: João - Transportes X" style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Telefone (opcional)
            <input value={meetingPhone} onChange={(e) => setMeetingPhone(e.target.value)} placeholder="(11) 9xxxx-xxxx" style={inputStyle} />
          </label>
          <label style={labelStyle}>
            E-mail do convidado (opcional)
            <input
              value={meetingGuestEmail}
              onChange={(e) => setMeetingGuestEmail(e.target.value)}
              placeholder="cliente@empresa.com"
              style={inputStyle}
              disabled={!google.connected}
            />
          </label>
          <label style={labelStyle}>
            Local (Google Maps)
            <input
              value={meetingLocation}
              onChange={(e) => setMeetingLocation(e.target.value)}
              placeholder="Av. Paulista, 1000 — São Paulo"
              style={inputStyle}
              disabled={!google.connected}
            />
          </label>
          <label style={labelStyle}>
            Observação (opcional)
            <input value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} placeholder="Assunto / resumo" style={inputStyle} />
          </label>
          {google.connected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#00832d' }}>
              <GoogleMeetIcon size={18} />
              Google Meet será gerado automaticamente
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 11, color: '#949494', fontWeight: 600 }}>
              Conecte o Google na barra lateral para Meet, Maps e convites.
            </p>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 900, color: '#0f172a' }}>
            <input type="checkbox" checked={isNewLead} onChange={(e) => setIsNewLead(e.target.checked)} />
            Primeiro contacto (novo lead)
          </label>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={() => setMeetingOpen(false)} style={btnGhost}>
              Cancelar
            </button>
            <button type="button" onClick={() => void scheduleMeeting()} style={btnPrimary} disabled={!meetingLead.trim() || savingGoogle}>
              {savingGoogle ? <Loader2 size={16} className="animate-spin" /> : null}
              Salvar reunião
            </button>
          </div>
        </div>
      </LogtaModal>

      <LogtaModal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditingId(null);
        }}
        title={editingId ? 'Editar evento' : 'Adicionar título e horário'}
        width="640px"
        variant="center"
        headerStyle={{ padding: '14px 20px', borderBottom: '1px solid rgba(15,23,42,0.08)' }}
        contentStyle={{ padding: 0 }}
      >
        <div className="zaptro-agenda-modal">
          <div className="zaptro-agenda-modal__body">
            <input
              className="zaptro-agenda-modal__title"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Adicionar título e horário"
            />

            <div className="zaptro-agenda-modal__tabs" role="tablist" aria-label="Tipo">
              <button
                type="button"
                className={`zaptro-agenda-modal__tab${createTab === 'evento' ? ' is-active' : ''}`}
                onClick={() => setCreateTab('evento')}
                role="tab"
                aria-selected={createTab === 'evento'}
              >
                Evento
              </button>
              <button
                type="button"
                className={`zaptro-agenda-modal__tab${createTab === 'tarefa' ? ' is-active' : ''}`}
                onClick={() => setCreateTab('tarefa')}
                role="tab"
                aria-selected={createTab === 'tarefa'}
              >
                Tarefa
              </button>
            </div>

            <div className="zaptro-agenda-modal__row">
              <span className="zaptro-agenda-modal__row-ico" aria-hidden>
                <Palette size={18} />
              </span>
              <div className="zaptro-agenda-modal__row-main">
                <span className="zaptro-agenda-modal__row-strong" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                  Cor do evento
                </span>
                <div className="zaptro-agenda-color-pick" role="listbox" aria-label="Cor do evento">
                  {ZAPTRO_AGENDA_COLLABORATOR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`zaptro-agenda-color-swatch${createColor === color ? ' is-active' : ''}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Cor ${color}`}
                      aria-selected={createColor === color}
                      onClick={() => setCreateColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="zaptro-agenda-modal__rows">
              <div className="zaptro-agenda-modal__row">
                <span className="zaptro-agenda-modal__row-ico" aria-hidden>
                  <Clock size={18} />
                </span>
                <div className="zaptro-agenda-modal__row-main">
                  <div className="zaptro-agenda-modal__row-line">
                    <span className="zaptro-agenda-modal__row-strong">
                      {new Date(createWhenStart).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </span>
                    <span className="zaptro-agenda-modal__row-sep" aria-hidden>
                      —
                    </span>
                    <span className="zaptro-agenda-modal__row-strong">
                      {new Date(createWhenEnd).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </span>
                    <button
                      type="button"
                      className="zaptro-agenda-modal__link"
                      onClick={() => setCreateHasTime((v) => !v)}
                    >
                      {createHasTime ? 'Remover horário' : 'Adicionar horário'}
                    </button>
                  </div>

                  {createHasTime ? (
                    <div className="zaptro-agenda-modal__time-grid">
                      <label className="zaptro-agenda-modal__label">
                        Início
                        <input
                          className="zaptro-agenda-modal__input"
                          type="datetime-local"
                          value={createWhenStart}
                          onChange={(e) => setCreateWhenStart(e.target.value)}
                        />
                      </label>
                      <label className="zaptro-agenda-modal__label">
                        Fim
                        <input
                          className="zaptro-agenda-modal__input"
                          type="datetime-local"
                          value={createWhenEnd}
                          onChange={(e) => setCreateWhenEnd(e.target.value)}
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              </div>

              {createTab === 'evento' && teamMembers.length > 0 ? (
                <div className="zaptro-agenda-modal__row">
                  <span className="zaptro-agenda-modal__row-ico" aria-hidden>
                    <Users size={18} />
                  </span>
                  <div className="zaptro-agenda-modal__row-main">
                    <span className="zaptro-agenda-modal__row-strong" style={{ fontSize: 12, marginBottom: 6 }}>
                      Mencionar colaboradores (@)
                    </span>
                    <div className="zaptro-agenda-mentions">
                      {teamMembers.map((m) => {
                        const on = createMentionIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            className={`zaptro-agenda-mentions__chip${on ? ' is-on' : ''}`}
                            onClick={() =>
                              setCreateMentionIds((prev) =>
                                on ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                              )
                            }
                          >
                            <span className="zaptro-agenda-mentions__dot" style={{ background: m.color }} />
                            @{m.name.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {createTab === 'evento' ? (
                <>
                  <div className="zaptro-agenda-modal__row">
                    <span className="zaptro-agenda-modal__row-ico" aria-hidden>
                      <Users size={18} />
                    </span>
                    <div className="zaptro-agenda-modal__row-main">
                      <input
                        className="zaptro-agenda-modal__input"
                        placeholder={google.connected ? 'emails@convidado.com, outro@mail.com' : 'Conecte o Google para convidados'}
                        value={createGuests}
                        onChange={(e) => setCreateGuests(e.target.value)}
                        disabled={!google.connected}
                      />
                    </div>
                  </div>

                  <div className="zaptro-agenda-modal__row">
                    <span className="zaptro-agenda-modal__row-ico" aria-hidden>
                      <Video size={18} />
                    </span>
                    <div className="zaptro-agenda-modal__row-main">
                      <button
                        type="button"
                        className={`zaptro-agenda-modal__meet-toggle${addGoogleMeet ? ' is-on' : ''}`}
                        onClick={() => setAddGoogleMeet((v) => !v)}
                        disabled={!google.connected}
                      >
                        <GoogleMeetIcon size={18} />
                        {addGoogleMeet ? 'Google Meet incluído' : 'Adicionar Google Meet'}
                      </button>
                    </div>
                  </div>
                </>
              ) : null}

              <div className="zaptro-agenda-modal__row">
                <span className="zaptro-agenda-modal__row-ico" aria-hidden>
                  <MapPin size={18} />
                </span>
                <div className="zaptro-agenda-modal__row-main">
                  <input
                    className="zaptro-agenda-modal__input"
                    placeholder={google.connected ? 'Endereço (Maps no evento)' : 'Conecte o Google para local'}
                    value={createLocation}
                    onChange={(e) => setCreateLocation(e.target.value)}
                    disabled={!google.connected}
                  />
                </div>
              </div>

              <div className="zaptro-agenda-modal__row">
                <span className="zaptro-agenda-modal__row-ico" aria-hidden>
                  <AlignLeft size={18} />
                </span>
                <div className="zaptro-agenda-modal__row-main">
                  <textarea
                    className="zaptro-agenda-modal__textarea"
                    placeholder="Descrição do evento"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                  />
                  <div className="zaptro-agenda-modal__row-line">
                    <button type="button" className="zaptro-agenda-modal__chip" disabled>
                      Anexar arquivo
                    </button>
                    <button type="button" className="zaptro-agenda-modal__chip" disabled>
                      Adicionar imagem
                    </button>
                  </div>
                </div>
              </div>

              <div className="zaptro-agenda-modal__row">
                <span className="zaptro-agenda-modal__row-ico" aria-hidden>
                  <CalendarClock size={18} />
                </span>
                <div className="zaptro-agenda-modal__row-main">
                  <button type="button" className="zaptro-agenda-modal__select" disabled>
                    Agenda principal
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="zaptro-agenda-modal__foot">
            <button type="button" className="zaptro-agenda-modal__btn zaptro-agenda-modal__btn--ghost" onClick={() => setCreateOpen(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="zaptro-agenda-modal__btn zaptro-agenda-modal__btn--primary"
              onClick={() => void saveQuickEvent()}
              disabled={!createTitle.trim() || savingGoogle}
            >
              {savingGoogle ? <Loader2 size={16} className="animate-spin" /> : null}
              Salvar
            </button>
          </div>
        </div>
      </LogtaModal>

      {eventPopover ? (
        <ZaptroAgendaEventPopover
          item={eventPopover.item}
          anchor={{ x: eventPopover.x, y: eventPopover.y }}
          teamMembers={teamMembers}
          onClose={() => setEventPopover(null)}
          onEdit={startEditEvent}
          onDelete={handleDeleteEvent}
          onDuplicate={handleDuplicateEvent}
          onMarkDone={handleMarkDone}
        />
      ) : null}

      <ZaptroAgendaContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onCreateEvent={(date) => openCreateForDay(date)}
        onCreateMeeting={(date) => {
          const base = new Date(date);
          base.setHours(10, 0, 0, 0);
          setMeetingWhen(toLocalInputValue(base));
          setMeetingOpen(true);
        }}
        onOpenEvent={(item) => {
          if (contextMenu?.kind === 'event') {
            setEventPopover({ item, x: contextMenu.x, y: contextMenu.y });
          } else {
            openEventPopover(item);
          }
        }}
        onEditEvent={startEditEvent}
        onDuplicateEvent={handleDuplicateEvent}
        onDeleteEvent={handleDeleteEvent}
      />
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 12,
  fontWeight: 900,
  color: '#949494',
};

const inputStyle: React.CSSProperties = {
  border: '1px solid rgba(15, 23, 42, 0.12)',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 14,
  fontWeight: 800,
  fontFamily: 'inherit',
  outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  border: 'none',
  borderRadius: 12,
  padding: '10px 14px',
  background: '#0f172a',
  color: '#d9ff00',
  fontWeight: 900,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnGhost: React.CSSProperties = {
  border: '1px solid rgba(15,23,42,0.12)',
  borderRadius: 12,
  padding: '10px 14px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 900,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

export default ZaptroAgenda;

const btnIconTiny: React.CSSProperties = {
  border: '1px solid rgba(15,23,42,0.12)',
  background: '#fff',
  width: 36,
  height: 36,
  borderRadius: 999,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const btnGhostTiny: React.CSSProperties = {
  border: '1px solid rgba(15,23,42,0.12)',
  background: '#fff',
  borderRadius: 999,
  padding: '8px 12px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 900,
  color: '#0f172a',
  fontFamily: 'inherit',
};

const btnPrimaryTiny: React.CSSProperties = {
  border: '1px solid rgba(15,23,42,0.12)',
  background: '#0f172a',
  color: '#d9ff00',
  borderRadius: 999,
  padding: '8px 12px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 900,
  fontFamily: 'inherit',
};

const tabIdle: React.CSSProperties = {
  border: '1px solid rgba(15,23,42,0.12)',
  background: '#fff',
  borderRadius: 12,
  padding: '8px 12px',
  cursor: 'pointer',
  fontWeight: 900,
  fontFamily: 'inherit',
  color: '#0f172a',
};

const tabActive: React.CSSProperties = {
  ...tabIdle,
  borderColor: '#0f172a',
  background: 'rgba(15,23,42,0.06)',
};

