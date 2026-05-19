import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Users,
  Search,
  Settings,
  HelpCircle,
  Check,
  Bell,
  FileText,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { useOperationalData } from '../contexts/OperationalDataContext';
import { useLogtaProfile } from '../contexts/LogtaProfileContext';
import { resolveLogtaRole } from '../lib/logtaPermissions';
import {
  AGENDA_CALENDAR_SOURCES,
  aggregateAgendaEvents,
  buildMonthGrid,
  eventsForDate,
  filterAgendaEventsByPermission,
  formatEventTime,
  matchesAgendaFilter,
  AgendaIntelligencePopup,
  useAgendaIntelligence,
  addManualAgendaEvent,
  loadAgendaPrefs,
  saveAgendaPrefs,
} from '../modules/agenda';
import type { AgendaEvent, AgendaFilterId } from '../modules/agenda';
import { showToast } from '../components/Toast';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const weekDays = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÁB.'];
const miniDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const FILTER_CHIPS: { id: AgendaFilterId; label: string }[] = [
  { id: 'rh', label: 'RH' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'crm', label: 'CRM' },
  { id: 'frota', label: 'Frota' },
  { id: 'fretes', label: 'Fretes' },
  { id: 'operacional', label: 'Operacional' },
  { id: 'reuniao', label: 'Reuniões' },
  { id: 'alertas', label: 'Alertas' },
  { id: 'ia', label: 'IA' },
  { id: 'criticos', label: 'Críticos' },
];

function initials(name: string | null | undefined) {
  if (!name) return 'LG';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const Agenda = () => {
  const { config } = useTenant();
  const { profile } = useLogtaProfile();
  const { profiles, motoristas, transactions, shipments, vehicles, loading, refresh } = useOperationalData();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<'Mês' | 'Semana' | 'Dia'>('Mês');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [hiddenCalendars, setHiddenCalendars] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<AgendaFilterId[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');

  const companyId = config?.id ?? 'default';
  const isMaster = resolveLogtaRole(profile) === 'admin';

  useEffect(() => {
    setHiddenCalendars(loadAgendaPrefs(companyId).hiddenCalendars);
  }, [companyId]);

  useEffect(() => {
    const onSync = () => void refresh();
    window.addEventListener('logta-operational-sync', onSync);
    return () => window.removeEventListener('logta-operational-sync', onSync);
  }, [refresh]);

  const allEvents = useMemo(() => {
    return aggregateAgendaEvents({
      companyId,
      profiles,
      motoristas,
      transactions,
      shipments,
      vehicles,
    });
  }, [companyId, profiles, motoristas, transactions, shipments, vehicles]);

  const permittedEvents = useMemo(
    () => filterAgendaEventsByPermission(allEvents, profile),
    [allEvents, profile],
  );

  const visibleEvents = useMemo(() => {
    let list = permittedEvents.filter((e) => {
      const source = AGENDA_CALENDAR_SOURCES.find((s) =>
        (s.domains as readonly string[]).includes(e.domain),
      );
      if (!source) return true;
      return !hiddenCalendars.includes(source.id);
    });
    if (activeFilters.length) {
      list = list.filter((e) => activeFilters.some((f) => matchesAgendaFilter(e, f)));
    }
    if (view === 'Dia') {
      list = list.filter((e) => e.start.slice(0, 10) === currentDate.toISOString().slice(0, 10));
    }
    return list;
  }, [permittedEvents, hiddenCalendars, activeFilters, view, currentDate]);

  const { alerts, insights, popupOpen, setPopupOpen, dismissAlert } = useAgendaIntelligence(
    companyId,
    visibleEvents,
  );

  const monthGrid = useMemo(() => buildMonthGrid(currentDate), [currentDate]);
  const todayKey = new Date().toISOString().slice(0, 10);

  const todayEvents = useMemo(
    () => eventsForDate(visibleEvents, new Date()),
    [visibleEvents],
  );

  const stats = useMemo(() => {
    const critical = visibleEvents.filter((e) => e.priority === 'critical' || e.priority === 'high').length;
    const fin = visibleEvents.filter((e) => e.domain === 'financeiro' && e.status === 'pendente').length;
    const bdays = visibleEvents.filter((e) => e.category === 'aniversario' && e.start.slice(0, 10) === todayKey).length;
    return { critical, fin, bdays, today: todayEvents.length };
  }, [visibleEvents, todayEvents, todayKey]);

  const monthLabel = `${MONTHS_PT[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;

  const shiftMonth = (delta: number) => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  const toggleCalendar = (id: string) => {
    const next = hiddenCalendars.includes(id)
      ? hiddenCalendars.filter((c) => c !== id)
      : [...hiddenCalendars, id];
    setHiddenCalendars(next);
    saveAgendaPrefs(companyId, { hiddenCalendars: next, dismissedAlertIds: loadAgendaPrefs(companyId).dismissedAlertIds });
  };

  const toggleFilter = (id: AgendaFilterId) => {
    setActiveFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const openCreate = (date?: Date) => {
    setSelectedEvent(null);
    const d = date ?? new Date();
    setNewDate(d.toISOString().slice(0, 10));
    setNewTitle('');
    setIsEventModalOpen(true);
  };

  const openEvent = (event: AgendaEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const saveManualEvent = () => {
    if (!newTitle.trim()) {
      showToast('error', 'Informe um título para o evento.', 'Agenda');
      return;
    }
    const start = newTime ? `${newDate}T${newTime}:00` : newDate;
    const ev: AgendaEvent = {
      id: `manual-${Date.now()}`,
      title: newTitle.trim(),
      start,
      allDay: !newTime,
      domain: 'manual',
      category: 'evento',
      priority: 'medium',
      pillClass: 'bg-blue-500 text-white',
      dotClass: 'bg-blue-400',
      area: 'Agenda',
    };
    addManualAgendaEvent(companyId, ev);
    setIsEventModalOpen(false);
    showToast('success', 'Evento adicionado à memória da agenda.', 'Agenda');
    void refresh();
  };

  const cycleView = () => {
    setView((v) => (v === 'Mês' ? 'Semana' : v === 'Semana' ? 'Dia' : 'Mês'));
  };

  return (
    <div className="flex flex-1 bg-[#1e1e1e] text-gray-300 font-sans overflow-hidden rounded-[40px] shadow-2xl border border-gray-800 relative">
      {loading ? (
        <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-[#2d2d2d] px-3 py-1.5 text-[10px] font-bold text-gray-400">
          <Loader2 size={12} className="animate-spin text-primary" /> Sincronizando…
        </div>
      ) : null}

      {/* Left Sidebar (Google Calendar Style) */}
      <div className="w-[280px] flex-shrink-0 border-r border-gray-800 flex flex-col">
        <div className="p-4 pt-6">
          <button
            type="button"
            onClick={() => openCreate()}
            className="flex items-center gap-3 px-5 py-3.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white rounded-full font-medium transition-all shadow-lg border border-gray-700"
          >
            <Plus size={22} className="text-white" />
            <span className="text-sm">Criar</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6">
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1.5">
              <Sparkles size={12} className="text-primary" />
              <span className="text-[9px] font-black uppercase text-primary">IA Agenda ativa</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => toggleFilter(chip.id)}
                  className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase transition-colors ${
                    activeFilters.includes(chip.id)
                      ? 'bg-primary text-white'
                      : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-200">{monthLabel}</h3>
              <div className="flex gap-1">
                <button type="button" onClick={() => shiftMonth(-1)} className="p-1 hover:bg-gray-800 rounded-full">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={() => shiftMonth(1)} className="p-1 hover:bg-gray-800 rounded-full">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-1 mb-1">
              {miniDays.map((d) => (
                <div key={d} className="text-[10px] text-center text-gray-500 font-medium">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {monthGrid.map(({ date, inMonth }, i) => {
                const isToday = date.toISOString().slice(0, 10) === todayKey;
                const isSelected =
                  date.getMonth() === currentDate.getMonth() && date.getDate() === currentDate.getDate();
                const count = eventsForDate(visibleEvents, date).length;
                return (
                  <div key={i} className="flex justify-center items-center">
                    <button
                      type="button"
                      onClick={() => setCurrentDate(new Date(date))}
                      className={`w-6 h-6 text-xs flex items-center justify-center rounded-full transition-all relative
                      ${!inMonth ? 'text-gray-600' : 'text-gray-300 hover:bg-gray-800'}
                      ${isToday ? 'bg-blue-300 text-blue-900 font-bold hover:bg-blue-400' : ''}
                      ${isSelected && !isToday ? 'ring-1 ring-blue-400' : ''}
                    `}
                    >
                      {date.getDate()}
                      {count > 0 && inMonth ? (
                        <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary" />
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 bg-[#2a2a2a] rounded-lg text-sm text-gray-400 hover:bg-[#333]"
            >
              <Users size={16} /> Pesquisar pessoas
            </button>

            <div>
              <div className="flex items-center justify-between group cursor-pointer mb-2">
                <h3 className="text-sm font-medium text-gray-200">Minhas agendas</h3>
                <ChevronRight size={16} className="text-gray-500 rotate-90" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-blue-400">
                    <Check size={12} className="text-gray-900" />
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    {profile?.full_name || 'Minha agenda'}
                  </span>
                </label>
                {AGENDA_CALENDAR_SOURCES.map((cal) => {
                  const visible = !hiddenCalendars.includes(cal.id);
                  return (
                    <label key={cal.id} className="flex items-center gap-3 cursor-pointer group">
                      <button
                        type="button"
                        onClick={() => toggleCalendar(cal.id)}
                        className={`flex h-4 w-4 items-center justify-center rounded-[4px] border-2 border-transparent ${cal.color} ${!visible ? 'opacity-40' : ''}`}
                      >
                        {visible ? <Check size={12} className="text-gray-900" /> : null}
                      </button>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{cal.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {isMaster ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-[10px] font-black uppercase text-amber-400">Visão master</p>
                <p className="mt-1 text-xs font-medium text-gray-400">Todos os eventos do ecossistema Logta.</p>
              </div>
            ) : null}

            <div>
              <div className="flex items-center justify-between group cursor-pointer mb-2">
                <h3 className="text-sm font-medium text-gray-200">Outras agendas</h3>
                <Plus size={16} className="text-gray-500 hover:text-white" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-green-700">
                    <Check size={12} className="text-gray-900" />
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Feriados no Brasil</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={goToday}
              className="px-4 py-2 bg-transparent border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Hoje
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => shiftMonth(-1)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button type="button" onClick={() => shiftMonth(1)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            <h2 className="text-xl font-normal text-white">{monthLabel}</h2>
          </div>

          <div className="flex items-center gap-4">
            <button type="button" className="p-2 hover:bg-gray-800 rounded-full text-gray-300 transition-colors">
              <Search size={20} />
            </button>
            <button type="button" className="p-2 hover:bg-gray-800 rounded-full text-gray-300 transition-colors">
              <HelpCircle size={20} />
            </button>
            <button type="button" className="p-2 hover:bg-gray-800 rounded-full text-gray-300 transition-colors">
              <Settings size={20} />
            </button>

            <button
              type="button"
              onClick={cycleView}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-700 rounded-md hover:bg-gray-800 cursor-pointer transition-colors ml-4"
            >
              <span className="text-sm font-medium text-gray-200">{view}</span>
              <ChevronRight size={14} className="text-gray-400 rotate-90" />
            </button>

            <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-gray-700 bg-blue-500 text-sm font-bold text-white">
              {initials(profile?.full_name)}
            </div>
          </div>
        </div>

        {/* Dashboard strip — memória operacional do dia */}
        <div className="grid grid-cols-2 gap-2 border-b border-gray-800 bg-[#252525] px-4 py-2 sm:grid-cols-4 shrink-0">
          {[
            { label: 'Hoje', value: stats.today },
            { label: 'Críticos', value: stats.critical },
            { label: 'Financeiro', value: stats.fin },
            { label: 'Aniversários', value: stats.bdays },
          ].map((k) => (
            <div key={k.label} className="rounded-lg bg-[#2a2a2a] px-3 py-2 text-center">
              <p className="text-[9px] font-black uppercase text-gray-500">{k.label}</p>
              <p className="text-lg font-black text-white">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="grid grid-cols-7 border-b border-gray-800 shrink-0">
            {weekDays.map((day, i) => {
              const headerDate = new Date(currentDate);
              headerDate.setDate(1);
              const dow = headerDate.getDay();
              const dayNum = i - dow + 1;
              const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
              const isToday = cellDate.toISOString().slice(0, 10) === todayKey;
              return (
                <div key={day} className="py-3 flex flex-col items-center border-r border-gray-800 last:border-0">
                  <span className={`text-[11px] font-medium mb-1 ${isToday ? 'text-blue-400' : 'text-gray-500'}`}>{day}</span>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${isToday ? 'bg-blue-500 text-white' : 'text-gray-300'}`}
                  >
                    {cellDate.getMonth() === currentDate.getMonth() ? cellDate.getDate() : ''}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-[#1e1e1e] min-h-0">
            {monthGrid.map(({ date, inMonth }, i) => {
              const dayEvents = eventsForDate(visibleEvents, date).slice(0, 3);
              const more = eventsForDate(visibleEvents, date).length - dayEvents.length;
              const isFirstOfMonth = date.getDate() === 1;
              const monthShort = MONTHS_PT[date.getMonth()].slice(0, 3).toLowerCase();

              return (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => openCreate(date)}
                  onKeyDown={(e) => e.key === 'Enter' && openCreate(date)}
                  className="border-r border-b border-gray-800 p-1 flex flex-col hover:bg-[#2a2a2a] transition-colors cursor-pointer group min-h-0"
                >
                  <div className="flex justify-center mt-1 mb-1">
                    <span className={`text-sm font-bold ${!inMonth ? 'text-gray-600' : 'text-gray-300'}`}>
                      {isFirstOfMonth ? `1 ${monthShort}.` : date.getDate()}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={(e) => openEvent(ev, e)}
                        className={`w-full px-2 py-1.5 rounded-[10px] text-left text-[11px] font-extrabold truncate shadow-md flex flex-col gap-0.5 ${ev.pillClass}`}
                      >
                        {!ev.allDay ? (
                          <span className="text-[10px] font-black tracking-wider opacity-80">{formatEventTime(ev)}</span>
                        ) : (
                          <span className="text-[10px] font-black tracking-wider opacity-80">O dia todo</span>
                        )}
                        <span className="truncate">{ev.title}</span>
                      </button>
                    ))}
                    {more > 0 ? (
                      <span className="block px-2 text-[10px] font-bold text-gray-500">+{more} mais</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AgendaIntelligencePopup
        open={popupOpen}
        alerts={alerts}
        onClose={() => setPopupOpen(false)}
        onDismiss={dismissAlert}
      />

      {isEventModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsEventModalOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-3xl bg-[#18191B] rounded-3xl shadow-2xl border border-neutral-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden text-white max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/40">
              <span className="text-xs font-black text-primary uppercase tracking-normal flex items-center gap-2">
                <CalendarIcon size={14} />
                {selectedEvent ? 'Memória do sistema' : 'Agendamento integrado'}
              </span>
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto">
              {selectedEvent ? (
                <div className="space-y-6 text-left">
                  <div>
                    <p className="text-[10px] font-black uppercase text-primary mb-1">{selectedEvent.area || selectedEvent.domain}</p>
                    <h3 className="text-2xl font-bold text-white">{selectedEvent.title}</h3>
                    <p className="mt-2 text-sm text-gray-400">{selectedEvent.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                      <p className="text-[10px] font-bold uppercase text-neutral-500">Quando</p>
                      <p className="mt-1 font-semibold text-white">
                        {new Date(selectedEvent.start).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                      <p className="text-[10px] font-bold uppercase text-neutral-500">Prioridade</p>
                      <p className="mt-1 font-semibold capitalize text-white">{selectedEvent.priority}</p>
                    </div>
                    {selectedEvent.participantName ? (
                      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 col-span-2">
                        <p className="text-[10px] font-bold uppercase text-neutral-500">Participante</p>
                        <p className="mt-1 font-semibold text-white">{selectedEvent.participantName}</p>
                      </div>
                    ) : null}
                    {selectedEvent.amount != null ? (
                      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 col-span-2">
                        <p className="text-[10px] font-bold uppercase text-neutral-500">Valor</p>
                        <p className="mt-1 font-semibold text-white">
                          R$ {selectedEvent.amount.toLocaleString('pt-BR')}
                          {selectedEvent.status ? ` · ${selectedEvent.status}` : ''}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  {selectedEvent.actionPath ? (
                    <Link
                      to={selectedEvent.actionPath}
                      onClick={() => setIsEventModalOpen(false)}
                      className="inline-flex hub-premium-pill primary"
                    >
                      {selectedEvent.actionLabel || 'Abrir módulo relacionado'}
                    </Link>
                  ) : null}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
                    <p className="text-[10px] font-bold uppercase text-neutral-500 mb-2">IA — insights</p>
                    {insights.slice(0, 2).map((ins) => (
                      <p key={ins.id} className="text-xs text-gray-400 mb-1">
                        <strong className="text-gray-200">{ins.title}:</strong> {ins.detail}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Adicionar título"
                    className="text-3xl font-normal text-white bg-transparent border-b-2 border-neutral-800 focus:border-primary outline-none placeholder:text-neutral-600 w-full pb-2 mb-8 transition-colors"
                    autoFocus
                  />
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 text-neutral-300">
                      <CalendarIcon size={20} className="text-neutral-500" />
                      <div className="flex flex-wrap gap-4">
                        <input
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:border-primary outline-none text-white font-semibold"
                        />
                        <input
                          type="time"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:border-primary outline-none text-white font-semibold"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Video size={20} className="text-neutral-500" />
                      <button type="button" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors cursor-pointer">
                        Adicionar videoconferência do Google Meet
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <Users size={20} className="text-neutral-500" />
                      <select className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:border-primary outline-none text-white font-semibold">
                        <option value="">Vincular a um cliente (CRM)...</option>
                        {profiles.slice(0, 5).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-start gap-4">
                      <FileText size={20} className="text-neutral-500 mt-2" />
                      <textarea
                        rows={3}
                        placeholder="Adicionar descrição ou anexos"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:border-primary outline-none resize-none text-white placeholder-neutral-500 font-semibold"
                      />
                    </div>
                    <div className="flex items-start gap-4 pt-4 border-t border-neutral-800">
                      <Bell size={20} className="text-neutral-500" />
                      <div className="space-y-3 flex-1">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-primary focus:ring-primary rounded border-neutral-800 bg-neutral-900" />
                          <span className="text-sm text-neutral-300 font-medium">Enviar lembrete por WhatsApp 2h antes</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-primary focus:ring-primary rounded border-neutral-800 bg-neutral-900" />
                          <span className="text-sm text-neutral-300 font-medium">Sincronizar com memória central Logta</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-neutral-900/40 border-t border-neutral-800 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-md text-sm font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
              {!selectedEvent ? (
                <button
                  type="button"
                  onClick={saveManualEvent}
                  className="px-6 py-2 bg-primary text-white rounded-md text-sm font-bold hover:opacity-90 transition-colors shadow-sm cursor-pointer"
                >
                  Salvar
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
