import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Search, Filter, Plus,
  Calendar as CalendarIcon, CheckCircle2, Clock, 
  Video, User, MoreHorizontal, X, Edit3, Trash2,
  Check, CalendarDays, CalendarRange, List, Sparkles, FileText
} from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, addDays, eachDayOfInterval, isToday,
  parseISO, startOfDay, endOfDay, getMonth, getYear
} from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError } from '@core/lib/toast';
import { googleCalendarApi } from '@core/lib/googleCalendarApi';
import LogtaModal from '@shared/components/Modal';

// Icons for integrations
const GoogleMeetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 12.5L20 17.5V6.5L15 11.5V6.5C15 5.39543 14.1046 4.5 13 4.5H4C2.89543 4.5 2 5.39543 2 6.5V17.5C2 18.6046 2.89543 19.5 4 19.5H13C14.1046 19.5 15 18.6046 15 17.5V12.5Z" fill="#00AC47"/>
  </svg>
);

type ViewMode = 'month' | 'week' | 'day' | 'year';

interface Event {
  id: string;
  title: string;
  type: 'reuniao' | 'tarefa' | 'crm' | 'rota';
  start_at: Date;
  end_at?: Date;
  status: 'pendente' | 'em_andamento' | 'concluido';
  responsible_id: string;
  responsible_name: string;
  responsible_avatar?: string;
  description?: string;
  color?: string;
}

const COLLABORATOR_COLORS = [
  '#6366F1', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#F43F5E'
];

const Agenda: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [activeCategories, setActiveCategories] = useState(['reuniao', 'tarefa', 'rota', 'crm']);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [externalCalendars, setExternalCalendars] = useState([
    { id: 'primary', label: 'Pessoal (Google)', color: '#4285F4', active: true },
    { id: 'work', label: 'Trabalho (Logta)', color: '#34A853', active: true },
    { id: 'holidays', label: 'Feriados BR', color: '#EA4335', active: false }
  ]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);

  // Mini Calendar Logic
  const miniCalDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // New activity form state
  const [newActivity, setNewActivity] = useState({
    title: '',
    type: 'tarefa' as any,
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    responsible_id: '',
    description: ''
  });

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const docs = await googleCalendarApi.getRecentDocs();
        setRecentDocs(Array.isArray(docs) ? docs : []);
      } catch (err) {
        console.error('Failed to load docs');
        setRecentDocs([]);
      }
    };
    
    fetchData();
    loadDocs();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Collaborators (Profiles)
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url');
      const collabWithColors = (profiles || []).map((p, i) => ({
        ...p,
        color: COLLABORATOR_COLORS[i % COLLABORATOR_COLORS.length]
      }));
      setCollaborators(collabWithColors);

      // 2. Fetch Meetings
      const { data: meetings } = await supabase.from('meetings').select('*');

      // 3. Fetch Tasks
      const { data: tasks } = await supabase.from('zaptro_crm_tasks').select('*');

      // Normalize Events
      const normalizedEvents: Event[] = [
        ...(meetings || []).map(m => {
          const startDate = m.scheduled_at ? parseISO(m.scheduled_at) : new Date();
          return {
            id: m.id,
            title: m.title || 'Reunião',
            type: 'reuniao' as const,
            start_at: isNaN(startDate.getTime()) ? new Date() : startDate,
            status: 'pendente' as const,
            responsible_id: 'system',
            responsible_name: 'Equipe Logta',
            description: m.meet_link,
            color: '#3B82F6',
            hasMeet: true
          };
        }),
        ...(tasks || []).map(t => {
          const collab = collabWithColors.find(c => c.id === t.created_by);
          const title = t.title || 'Tarefa sem título';
          const isCRM = title.toLowerCase().includes('follow') || title.toLowerCase().includes('cliente');
          const dueDate = t.due_at ? parseISO(t.due_at) : new Date();
          return {
            id: t.id,
            title: title,
            type: (isCRM ? 'crm' : 'tarefa') as any,
            start_at: isNaN(dueDate.getTime()) ? new Date() : dueDate,
            status: t.status as any,
            responsible_id: t.created_by || 'system',
            responsible_name: collab?.full_name || 'Equipe',
            responsible_avatar: collab?.avatar_url,
            description: t.notes,
            color: isCRM ? '#8B5CF6' : '#F59E0B',
          };
        })
      ];

      setEvents(normalizedEvents);
    } catch (err) {
      console.error('Error fetching agenda data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderYearView = () => {
    const months = Array.from({ length: 12 }).map((_, i) => new Date(currentDate.getFullYear(), i, 1));
    return (
      <div style={styles.yearGrid}>
        {months.map(month => {
          const monthEvents = filteredEvents.filter(e => isSameMonth(e.start_at, month));
          return (
            <div key={month.toString()} style={styles.yearMonthCard} onClick={() => { setCurrentDate(month); setViewMode('month'); }}>
              <h4 style={styles.yearMonthTitle}>{format(month, 'MMMM', { locale: ptBR })}</h4>
              <div style={styles.yearMonthContent}>
                <div style={styles.yearEventCount}>
                  <CalendarIcon size={14} />
                  <span>{monthEvents.length} atividades</span>
                </div>
                <div style={styles.yearCollabAvatars}>
                  {Array.from(new Set(monthEvents.map(e => e.color))).slice(0, 5).map((color, i) => (
                    <div key={i} style={{...styles.yearCollabDot, backgroundColor: color}} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const title = e.title || '';
      const respName = e.responsible_name || '';
      
      const matchSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          respName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCollab = selectedCollaborators.length === 0 || selectedCollaborators.includes(e.responsible_id);
      
      // Filtro de Categorias (Sidebar)
      const matchCategory = activeCategories.includes(e.type);

      return matchSearch && matchCollab && matchCategory;
    });
  }, [events, searchTerm, selectedCollaborators, activeCategories]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const scheduledAt = `${newActivity.date}T${newActivity.startTime}:00`;
      let finalMeetLink = '';
      
      if (newActivity.type === 'reuniao') {
        try {
          // Chamada Headless para o Robô do Google
          const googleEvent = await googleCalendarApi.createMeetMeeting({
            title: newActivity.title,
            description: newActivity.description,
            startTime: `${scheduledAt}Z`,
            endTime: `${newActivity.date}T${newActivity.endTime}:00Z`
          });
          finalMeetLink = googleEvent.meetLink;
          toastSuccess('Google Meet gerado automaticamente!');
        } catch (gErr) {
          console.error('Google Meet error:', gErr);
          toastError('Erro ao gerar Meet, mas agendando no Hub...');
        }

        const { error } = await supabase.from('meetings').insert([{
          title: newActivity.title,
          scheduled_at: scheduledAt,
          meet_link: finalMeetLink || 'https://meet.google.com/new'
        }]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('zaptro_crm_tasks').insert([{
          title: newActivity.title,
          due_at: scheduledAt,
          notes: newActivity.description,
          created_by: newActivity.responsible_id,
          status: 'open'
        }]);
        if (error) throw error;
      }

      toastSuccess('Atividade agendada com sucesso!');
      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      toastError('Erro ao agendar atividade');
    }
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const days = eachDayOfInterval({ start: startDate, end: addDays(startDate, 6) });

    return (
      <div style={styles.weekGrid}>
        {days.map(day => {
          const dayEvents = filteredEvents.filter(e => isSameDay(e.start_at, day));
          return (
            <div key={day.toString()} style={{...styles.weekColumn, backgroundColor: isToday(day) ? '#F8FAFC' : 'white'}}>
              <div style={styles.weekDayHeader}>
                <span style={styles.weekDayLabel}>{format(day, 'EEE', { locale: ptBR })}</span>
                <span style={{...styles.weekDayNum, backgroundColor: isToday(day) ? '#6366F1' : 'transparent', color: isToday(day) ? 'white' : '#1E293B'}}>
                  {format(day, 'd')}
                </span>
              </div>
              <div style={styles.weekEventList}>
                {dayEvents.map(e => (
                  <div 
                    key={e.id}
                    onClick={() => { setSelectedEvent(e); setIsDetailsOpen(true); }}
                    style={{...styles.cardEvent, borderLeft: `4px solid ${e.color}`, backgroundColor: `${e.color}08`}}
                  >
                    <div style={styles.cardEventTop}>
                      <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                        {e.type === 'reuniao' ? <Video size={12} color={e.color} /> : e.type === 'rota' ? <CalendarDays size={12} color={e.color} /> : <CheckCircle2 size={12} color={e.color} />}
                        {(e as any).hasMeet && <GoogleMeetIcon />}
                      </div>
                      <span style={styles.cardEventTime}>{format(e.start_at, 'HH:mm')}</span>
                    </div>
                    <h4 style={styles.cardEventTitle}>{e.title}</h4>
                    <div style={styles.cardEventFooter}>
                      <div style={{...styles.miniAvatar, backgroundColor: e.color}}>
                        {e.responsible_avatar ? <img src={e.responsible_avatar} style={styles.miniAvatarImg} /> : (e.responsible_name || 'U')[0]}
                      </div>
                      <span style={styles.cardEventUser}>{(e.responsible_name || 'Equipe').split(' ')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = filteredEvents.filter(e => isSameDay(e.start_at, currentDate));
    const hours = Array.from({ length: 24 }).map((_, i) => i);

    return (
      <div style={styles.dayViewWrapper}>
        <div style={styles.dayHeader}>
          <h3 style={styles.dayTitle}>{format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</h3>
        </div>
        <div style={styles.dayTimeline}>
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(e => e.start_at.getHours() === hour);
            return (
              <div key={hour} style={styles.timelineRow}>
                <div style={styles.timelineHour}>{hour.toString().padStart(2, '0')}:00</div>
                <div style={styles.timelineContent}>
                  {hourEvents.map(e => (
                    <div 
                      key={e.id}
                      onClick={() => { setSelectedEvent(e); setIsDetailsOpen(true); }}
                      style={{...styles.timelineEvent, borderLeft: `4px solid ${e.color}`, backgroundColor: `${e.color}10`}}
                    >
                      <div style={styles.timelineEventInfo}>
                        <strong>{e.title}</strong>
                        <span>{e.responsible_name}</span>
                      </div>
                      {e.type === 'reuniao' && <Video size={16} color={e.color} />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div style={styles.calendarGrid}>
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} style={styles.weekdayHeader}>{day}</div>
        ))}
        {days.map(day => {
          const dayEvents = filteredEvents.filter(e => isSameDay(e.start_at, day));
          return (
            <div 
              key={day.toString()} 
              onClick={() => {
                setNewActivity({...newActivity, date: format(day, 'yyyy-MM-dd')});
                setIsCreateOpen(true);
              }}
              style={{
                ...styles.dayCell,
                backgroundColor: isSameMonth(day, monthStart) ? 'white' : '#F8FAFC',
                opacity: isSameMonth(day, monthStart) ? 1 : 0.5,
                cursor: 'pointer'
              }}
            >
              <span style={{
                ...styles.dayNumber,
                color: isToday(day) ? '#6366F1' : '#1E293B',
                fontWeight: isToday(day) ? '800' : '600'
              }}>{format(day, 'd')}</span>
              
              <div style={styles.eventStack}>
                {dayEvents.slice(0, 3).map(e => (
                  <div 
                    key={e.id} 
                    onClick={(evt) => { evt.stopPropagation(); setSelectedEvent(e); setIsDetailsOpen(true); }}
                    style={{
                      ...styles.eventItem,
                      borderLeft: `3px solid ${e.color}`,
                      backgroundColor: `${e.color}10`
                    }}
                  >
                    <div style={styles.eventInfo}>
                      <span style={{...styles.eventIcon, color: e.color}}>
                        {e.type === 'reuniao' ? <Video size={10} /> : e.type === 'rota' ? <CalendarDays size={10} /> : <Check size={10} />}
                      </span>
                      <span style={styles.eventTitle}>{e.title}</span>
                      {(e as any).hasMeet && <GoogleMeetIcon />}
                    </div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div style={styles.moreEvents}>+{dayEvents.length - 3} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && collaborators.length === 0) {
    return <div style={styles.loading}>Sincronizando Agenda Hub...</div>;
  }

  return (
    <div style={styles.container}>
      {/* SIDEBAR ESQUERDA */}
      <aside style={styles.sidebar}>
        <div style={styles.miniCalendarCard}>
          <div style={styles.miniCalHeader}>
            <span style={styles.miniCalTitle}>{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</span>
            <div style={styles.miniCalNav}>
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={styles.miniNavBtn}><ChevronLeft size={14} /></button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={styles.miniNavBtn}><ChevronRight size={14} /></button>
            </div>
          </div>
          <div style={styles.miniCalGrid}>
            {['D','S','T','Q','Q','S','S'].map(d => <div key={d} style={styles.miniWeekday}>{d}</div>)}
            {miniCalDays.map(day => (
              <div 
                key={day.toString()} 
                onClick={() => setCurrentDate(day)}
                style={{
                  ...styles.miniDay,
                  color: isSameMonth(day, currentDate) ? '#1E293B' : '#CBD5E1',
                  backgroundColor: isSameDay(day, currentDate) ? '#6366F1' : 'transparent',
                  color: isSameDay(day, currentDate) ? 'white' : isSameMonth(day, currentDate) ? '#1E293B' : '#CBD5E1',
                  fontWeight: isSameDay(day, currentDate) ? '800' : '600'
                }}
              >
                {format(day, 'd')}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.categorySection}>
          <h4 style={styles.sectionTitle}>Minhas Agendas</h4>
          <div style={styles.categoryList}>
            {[
              { id: 'reuniao', label: 'Reuniões', color: '#3B82F6', icon: <Video size={14} /> },
              { id: 'rota', label: 'Rotas / Logística', color: '#10B981', icon: <CalendarDays size={14} /> },
              { id: 'tarefa', label: 'Tarefas Internas', color: '#F59E0B', icon: <CheckCircle2 size={14} /> },
              { id: 'crm', label: 'Follow-ups CRM', color: '#8B5CF6', icon: <User size={14} /> },
            ].map(cat => (
              <label key={cat.id} style={styles.categoryItem}>
                <input 
                  type="checkbox" 
                  checked={activeCategories.includes(cat.id)}
                  onChange={() => setActiveCategories(prev => 
                    prev.includes(cat.id) ? prev.filter(i => i !== cat.id) : [...prev, cat.id]
                  )}
                  style={{ accentColor: cat.color }}
                />
                <div style={{...styles.catIconBox, color: cat.color}}>{cat.icon}</div>
                <span style={styles.catLabel}>{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={styles.teamSection}>
          <h4 style={styles.sectionTitle}>Equipe</h4>
          <div style={styles.teamList}>
            {collaborators.slice(0, 5).map(c => (
              <div key={c.id} style={styles.teamItem}>
                <div style={{...styles.teamAvatar, backgroundColor: c.color}}>{(c.full_name || 'U')[0]}</div>
                <span style={styles.teamName}>{c.full_name}</span>
                <div style={{...styles.statusDot, backgroundColor: '#10B981'}} />
              </div>
            ))}
          </div>
        </div>

        <div style={styles.integrationSection}>
          <h4 style={styles.sectionTitle}>Documentos da Operação</h4>
          <div style={styles.integrationDocs}>
            {recentDocs.length > 0 ? recentDocs.map(doc => (
              <div 
                key={doc.id} 
                style={styles.docItem}
                onClick={() => window.open(doc.webViewLink, '_blank')}
              >
                <div style={styles.docIcon}>
                  <FileText size={14} color="#4285F4" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={styles.docName}>{doc.name}</span>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                    {doc.modifiedTime ? (
                      (() => {
                        const d = parseISO(doc.modifiedTime);
                        return isNaN(d.getTime()) ? '-' : format(d, 'd MMM', { locale: ptBR });
                      })()
                    ) : '-'}
                  </span>
                </div>
              </div>
            )) : (
              <p style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>Nenhum documento encontrado.</p>
            )}
          </div>
        </div>

        <div style={styles.integrationSection}>
          <h4 style={styles.sectionTitle}>Contas Vinculadas</h4>
          {!isGoogleConnected ? (
            <button onClick={() => setIsGoogleConnected(true)} style={styles.connectBtn}>
              <div style={styles.googleIconBox}>
                <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              </div>
              <span>Conectar Google Calendar</span>
            </button>
          ) : (
            <div style={styles.externalCalList}>
              {externalCalendars.map(cal => (
                <label key={cal.id} style={styles.categoryItem}>
                  <input 
                    type="checkbox" 
                    checked={cal.active}
                    onChange={() => setExternalCalendars(prev => 
                      prev.map(p => p.id === cal.id ? {...p, active: !p.active} : p)
                    )}
                    style={{ accentColor: cal.color }}
                  />
                  <div style={{...styles.catIconBox, color: cal.color}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19,4H18V2H16V4H8V2H6V4H5C3.89,4 3,4.9 3,6V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V6A2,2 0 0,0 19,4M19,20H5V10H19V20M19,8H5V6H19V8Z"/></svg>
                  </div>
                  <span style={styles.catLabel}>{cal.label}</span>
                </label>
              ))}
              <button onClick={() => setIsGoogleConnected(false)} style={styles.disconnectLink}>Desconectar conta</button>
            </div>
          )}
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div style={styles.mainContent}>
        {/* HEADER TITLES */}
        <div style={styles.headerTitleRow}>
          <h1 style={styles.pageTitle}>Agenda Hub</h1>
          <p style={styles.pageSub}>Gerencie compromissos, reuniões e tarefas da equipe</p>
        </div>

      {/* TOP NAVIGATION & FILTERS */}
      <div style={styles.topBar}>
        <div style={styles.navGroup}>
          <button style={styles.navBtn} onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft size={20} /></button>
          <h2 style={styles.currentMonth}>{format(currentDate, viewMode === 'day' ? "d 'de' MMMM" : 'MMMM yyyy', { locale: ptBR })}</h2>
          <button style={styles.navBtn} onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight size={20} /></button>
          <button style={styles.todayBtn} onClick={() => setCurrentDate(new Date())}>Hoje</button>
        </div>

        <div style={styles.filterGroup}>
          <div style={styles.searchBox}>
            <Search size={18} color="#94A3B8" />
            <input 
              placeholder="Pesquisar..." 
              style={styles.searchInput}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={styles.viewTabs}>
            {(['month', 'week', 'day', 'year'] as ViewMode[]).map(mode => (
              <button 
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{...styles.viewBtn, ...(viewMode === mode ? styles.viewBtnActive : {})}}
              >
                {mode === 'month' ? 'Mês' : mode === 'week' ? 'Semana' : mode === 'day' ? 'Dia' : 'Ano'}
              </button>
            ))}
          </div>

          <button style={styles.addBtn} onClick={() => setIsCreateOpen(true)}>
            <Plus size={18} /> Nova Atividade
          </button>
        </div>
      </div>

      {/* COLLABORATOR BAR */}
      <div style={styles.collabBar}>
        <span style={styles.collabLabel}>Responsáveis:</span>
        <div style={styles.collabList}>
          {collaborators.map(c => (
            <button 
              key={c.id}
              onClick={() => {
                setSelectedCollaborators(prev => 
                  prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                );
              }}
              style={{
                ...styles.collabChip,
                border: `1px solid ${selectedCollaborators.includes(c.id) ? c.color : '#E2E8F0'}`,
                backgroundColor: selectedCollaborators.includes(c.id) ? `${c.color}15` : 'white'
              }}
            >
              <div style={{...styles.collabDot, backgroundColor: c.color}} />
              {c.full_name}
            </button>
          ))}
        </div>
      </div>

      {/* CALENDAR CONTENT */}
      <div style={styles.calendarWrapper}>
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'year' && renderYearView()}
      </div>

      {/* MODAL: DETALHES DO EVENTO */}
      <LogtaModal 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)}
        size="md"
        title={selectedEvent?.type === 'reuniao' ? 'Detalhes da Reunião' : 'Detalhes da Tarefa'}
      >
        {selectedEvent && (
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{...styles.modalTypeIcon, backgroundColor: `${selectedEvent.color}20`, color: selectedEvent.color}}>
                {selectedEvent.type === 'reuniao' ? <Video size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <h3 style={styles.modalTitle}>{selectedEvent.title}</h3>
            </div>

            <div style={styles.modalInfoGrid}>
              <div style={styles.infoItem}>
                <Clock size={16} />
                <span>{format(selectedEvent.start_at, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              <div style={styles.infoItem}>
                <User size={16} />
                <span>Responsável: <strong>{selectedEvent.responsible_name}</strong></span>
              </div>
              <div style={styles.infoItem}>
                <List size={16} />
                <span>Status: <strong style={{color: '#6366F1'}}>{selectedEvent.status?.toUpperCase() || 'PENDENTE'}</strong></span>
              </div>
            </div>

            {selectedEvent.type === 'reuniao' && (
              <div style={styles.integrationBox}>
                <h4 style={styles.integrationTitle}>Integração Google Workspace</h4>
                <div style={styles.integrationRow}>
                  <div style={styles.integrationItem}>
                    <GoogleMeetIcon />
                    <span>Link do Meet: <b>meet.google.com/abc-defg-hij</b></span>
                  </div>
                  <button style={styles.joinBtn}>Entrar Agora</button>
                </div>
                <div style={styles.integrationDocs}>
                  <p style={{fontSize: '11px', color: '#94A3B8', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase'}}>Documentos Vinculados:</p>
                  <div style={styles.docItem}>
                    <div style={{...styles.docIcon, color: '#2563EB'}}><List size={14} /></div>
                    <span style={styles.docName}>Proposta Comercial.docs</span>
                  </div>
                  <div style={styles.docItem}>
                    <div style={{...styles.docIcon, color: '#16A34A'}}><List size={14} /></div>
                    <span style={styles.docName}>Planilha de Custos.sheets</span>
                  </div>
                </div>
              </div>
            )}

            {selectedEvent.description && (
              <div style={styles.modalDesc}>
                <h4 style={styles.descLabel}>Descrição:</h4>
                <p style={styles.descText}>{selectedEvent.description}</p>
              </div>
            )}

            <div style={styles.modalFooter}>
              <button style={styles.actionBtn}><Edit3 size={16} /> Editar</button>
              <button style={{...styles.actionBtn, color: '#EF4444'}}><Trash2 size={16} /> Excluir</button>
              <button style={styles.completeBtn}>Marcar como Concluído</button>
            </div>
          </div>
        )}
      </LogtaModal>

      {/* MODAL DE CRIAÇÃO (ESTILO GOOGLE CALENDAR PREMIUM) */}
      <LogtaModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)}
        size="md"
        title="Agendar Nova Atividade"
      >
        <div style={styles.createModalBody}>
          <input 
            style={styles.mainTitleInput}
            placeholder="Adicionar título e horário"
            value={newActivity.title}
            onChange={e => setNewActivity({...newActivity, title: e.target.value})}
            autoFocus
          />

          <div style={styles.typeTabs}>
            {[
              { id: 'reuniao', label: 'Evento', color: '#3B82F6' },
              { id: 'tarefa', label: 'Tarefa', color: '#F59E0B' },
              { id: 'rota', label: 'Rota', color: '#10B981' },
              { id: 'crm', label: 'CRM', color: '#8B5CF6' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setNewActivity({...newActivity, type: tab.id as any})}
                style={{
                  ...styles.tabBtn,
                  backgroundColor: newActivity.type === tab.id ? tab.color : 'transparent',
                  color: newActivity.type === tab.id ? 'white' : '#64748B',
                  borderColor: newActivity.type === tab.id ? tab.color : '#E2E8F0'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={styles.formRow}>
            <Clock size={18} color="#94A3B8" />
            <div style={styles.formInputGroup}>
              <span style={styles.formDateLabel}>
                {format(parseISO(newActivity.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </span>
              <div style={styles.timeInputs}>
                <input 
                  type="time" 
                  value={newActivity.startTime}
                  onChange={e => setNewActivity({...newActivity, startTime: e.target.value})}
                  style={styles.timeInput}
                />
                <span>–</span>
                <input 
                  type="time" 
                  value={newActivity.endTime}
                  onChange={e => setNewActivity({...newActivity, endTime: e.target.value})}
                  style={styles.timeInput}
                />
              </div>
            </div>
          </div>

          <div style={styles.formRow}>
            <User size={18} color="#94A3B8" />
            <select 
              style={styles.selectInput}
              value={newActivity.responsible_id}
              onChange={e => setNewActivity({...newActivity, responsible_id: e.target.value})}
            >
              <option value="">Adicionar convidados / Responsável</option>
              {collaborators.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          <div style={styles.formRow}>
            <div style={styles.meetIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <rect x="0" y="0" width="24" height="24" fill="none"/>
                <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8 S16.41,20,12,20z" fill="#00897B"/>
                <path d="M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5S14.76,7,12,7z M12,15c-1.65,0-3-1.35-3-3s1.35-3,3-3s3,1.35,3,3 S13.65,15,12,15z" fill="#00897B"/>
                <path d="M16.5,12l-4.5,3v-6L16.5,12z" fill="#00897B"/>
              </svg>
            </div>
            <div style={styles.meetPlaceholder}>
              <span style={{ color: '#1E293B', fontWeight: '700' }}>Adicionar videoconferência do Google Meet</span>
              <button style={styles.addMeetBtn}>Ativar Meet</button>
            </div>
          </div>

          <div style={styles.formRow}>
            <List size={18} color="#94A3B8" />
            <textarea 
              style={styles.descTextarea}
              placeholder="Adicionar descrição ou observações..."
              value={newActivity.description}
              onChange={e => setNewActivity({...newActivity, description: e.target.value})}
            />
          </div>

          <div style={styles.createFooter}>
            <button onClick={() => setIsCreateOpen(false)} style={styles.cancelBtn}>Cancelar</button>
            <button onClick={handleCreateActivity} style={styles.saveBtn}>Salvar</button>
          </div>
        </div>
      </LogtaModal>
    </div>
  </div>
);
};

const styles: Record<string, any> = {
  container: { display: 'flex', minHeight: 'calc(100vh - 100px)', padding: '20px 0' },
  headerTitleRow: { marginBottom: '32px' },
  pageTitle: { fontSize: '28px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-1px' },
  pageSub: { fontSize: '14px', color: '#94A3B8', fontWeight: '500', marginTop: '4px' },
  loading: { height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1', fontWeight: '800' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  navGroup: { display: 'flex', alignItems: 'center', gap: '16px' },
  navBtn: { width: '40px', height: '40px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', cursor: 'pointer' },
  currentMonth: { fontSize: '20px', fontWeight: '800', color: '#0F172A', minWidth: '200px', textTransform: 'capitalize' },
  todayBtn: { padding: '8px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },

  filterGroup: { display: 'flex', alignItems: 'center', gap: '16px' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '0 16px', height: '40px', borderRadius: '24px', border: '1px solid #E2E8F0' },
  searchInput: { border: 'none', outline: 'none', fontSize: '13px', fontWeight: '600', color: '#1E293B', width: '180px' },
  viewTabs: { display: 'flex', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '24px' },
  viewBtn: { border: 'none', background: 'none', padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#64748B', cursor: 'pointer' },
  viewBtnActive: { backgroundColor: 'white', color: '#0F172A', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', height: '40px', backgroundColor: '#6366F1', color: 'white', border: 'none', borderRadius: '24px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)' },

  collabBar: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' },
  collabLabel: { fontSize: '12px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  collabList: { display: 'flex', gap: '8px' },
  collabChip: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', color: '#1E293B', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' },
  collabDot: { width: '8px', height: '8px', borderRadius: '50%' },

  calendarWrapper: { flex: 1, backgroundColor: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex' },
  
  // Month View
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', height: '100%', width: '100%' },
  weekdayHeader: { padding: '12px', textAlign: 'center', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9', borderRight: '1px solid #F1F5F9' },
  dayCell: { borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', padding: '8px', minHeight: '120px', display: 'flex', flexDirection: 'column', gap: '8px' },
  dayNumber: { fontSize: '13px' },
  eventStack: { display: 'flex', flexDirection: 'column', gap: '4px' },
  eventItem: { padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'transform 0.1s' },
  eventInfo: { display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' },
  eventIcon: { display: 'flex', alignItems: 'center', color: '#64748B' },
  eventTitle: { fontSize: '11px', fontWeight: '700', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  moreEvents: { fontSize: '10px', fontWeight: '700', color: '#94A3B8', padding: '2px 8px' },

  // Week View
  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', height: '100%', width: '100%' },
  weekColumn: { borderRight: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column' },
  weekDayHeader: { padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', borderBottom: '1px solid #F1F5F9' },
  weekDayLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  weekDayNum: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800' },
  weekEventList: { padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' },
  cardEvent: { padding: '12px', borderRadius: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.2s', ':hover': { transform: 'scale(1.02)' } },
  cardEventTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardEventTime: { fontSize: '10px', fontWeight: '800', color: '#64748B' },
  cardEventTitle: { fontSize: '12px', fontWeight: '800', color: '#1E293B', margin: 0 },
  cardEventFooter: { display: 'flex', alignItems: 'center', gap: '6px' },
  cardEventUser: { fontSize: '10px', fontWeight: '700', color: '#64748B' },

  // Day View
  dayViewWrapper: { width: '100%', display: 'flex', flexDirection: 'column' },
  dayHeader: { padding: '24px 32px', borderBottom: '1px solid #F1F5F9' },
  dayTitle: { fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0, textTransform: 'capitalize' },
  dayTimeline: { flex: 1, overflowY: 'auto', padding: '0 32px' },
  timelineRow: { display: 'flex', minHeight: '80px', borderBottom: '1px solid #F1F5F9' },
  timelineHour: { width: '80px', padding: '16px 0', fontSize: '12px', fontWeight: '700', color: '#94A3B8' },
  timelineContent: { flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '8px' },
  timelineEvent: { padding: '12px 16px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  timelineEventInfo: { display: 'flex', flexDirection: 'column' },

  // Year View
  yearGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', padding: '24px', width: '100%', overflowY: 'auto' },
  yearMonthCard: { backgroundColor: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.2s', ':hover': { borderColor: '#6366F1', transform: 'translateY(-4px)' } },
  yearMonthTitle: { fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: '0 0 16px', textTransform: 'capitalize' },
  yearMonthContent: { display: 'flex', flexDirection: 'column', gap: '12px' },
  yearEventCount: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: '600' },
  yearCollabAvatars: { display: 'flex', gap: '4px' },
  yearCollabDot: { width: '6px', height: '6px', borderRadius: '50%' },

  miniAvatar: { width: '18px', height: '18px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '800', color: 'white', overflow: 'hidden' },
  miniAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },

  modalContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  modalHeader: { display: 'flex', alignItems: 'center', gap: '16px' },
  modalTypeIcon: { width: '56px', height: '56px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0 },
  modalInfoGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  infoItem: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#475569' },
  modalDesc: { backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '24px', border: '1px solid #E2E8F0' },
  descLabel: { fontSize: '12px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px', marginTop: 0 },
  descText: { fontSize: '14px', color: '#475569', margin: 0, lineHeight: '1.5' },
  modalFooter: { display: 'flex', gap: '12px', marginTop: '12px' },
  actionBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '24px', border: '1px solid #E2E8F0', backgroundColor: 'white', fontSize: '13px', fontWeight: '700', color: '#64748B', cursor: 'pointer' },
  completeBtn: { flex: 2, backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '24px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },

  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  row: { display: 'flex', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  input: { padding: '12px 16px', borderRadius: '24px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: '600', color: '#1E293B', backgroundColor: '#F8FAFC' },
  submitBtn: { padding: '14px', backgroundColor: '#6366F1', color: 'white', border: 'none', borderRadius: '22px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginTop: '8px', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.2)' },

  // New Sidebar & Grid Styles
  sidebar: { width: '320px', padding: '0 24px 0 0', display: 'flex', flexDirection: 'column', gap: '32px', borderRight: '1px solid #E2E8F0' },
  mainContent: { flex: 1, paddingLeft: '32px', display: 'flex', flexDirection: 'column' },
  
  miniCalendarCard: { backgroundColor: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '16px' },
  miniCalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  miniCalTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', textTransform: 'capitalize' },
  miniCalNav: { display: 'flex', gap: '4px' },
  miniNavBtn: { width: '24px', height: '24px', borderRadius: '8px', border: 'none', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  miniCalGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' },
  miniWeekday: { textAlign: 'center', fontSize: '10px', fontWeight: '800', color: '#94A3B8', padding: '4px 0' },
  miniDay: { height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' },
  
  categorySection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  sectionTitle: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', margin: 0 },
  categoryList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  categoryItem: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  catIconBox: { width: '24px', height: '24px', borderRadius: '8px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  
  teamSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  teamList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  teamItem: { display: 'flex', alignItems: 'center', gap: '10px' },
  teamAvatar: { width: '24px', height: '24px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: 'white' },
  teamName: { fontSize: '13px', fontWeight: '600', color: '#475569', flex: 1 },
  
  aiInsightBanner: { backgroundColor: '#1F2937', borderRadius: '24px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  aiIcon: { width: '40px', height: '40px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontSize: '13px', fontWeight: '800', color: 'white', margin: 0 },
  aiDescription: { fontSize: '12px', color: '#94A3B8', margin: '2px 0 0 0' },
  aiActionBtn: { padding: '8px 16px', borderRadius: '12px', border: '1px solid #374151', backgroundColor: 'transparent', color: 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },

  integrationBox: { backgroundColor: '#F8FAFC', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '20px' },
  integrationTitle: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '16px', margin: 0 },
  integrationRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  integrationItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1E293B' },
  joinBtn: { padding: '8px 16px', borderRadius: '12px', backgroundColor: '#00AC47', color: 'white', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
  integrationDocs: { display: 'flex', flexDirection: 'column', gap: '6px' },
  docItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '12px', backgroundColor: 'white', border: '1px solid #E2E8F0', cursor: 'pointer' },
  docIcon: { width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  docName: { fontSize: '12px', fontWeight: '600', color: '#475569' },

  // Create Modal Modern Design
  createModalBody: { display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px 0' },
  mainTitleInput: { fontSize: '24px', fontWeight: '800', color: '#0F172A', border: 'none', borderBottom: '2px solid #F1F5F9', outline: 'none', paddingBottom: '12px', width: '100%', marginBottom: '8px', transition: 'border-color 0.2s', ':focus': { borderColor: '#6366F1' } },
  typeTabs: { display: 'flex', gap: '8px' },
  tabBtn: { padding: '8px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
  formRow: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
  formInputGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  formDateLabel: { fontSize: '14px', fontWeight: '700', color: '#1E293B' },
  timeInputs: { display: 'flex', alignItems: 'center', gap: '12px', color: '#94A3B8', fontWeight: '700' },
  timeInput: { padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '13px', fontWeight: '700', color: '#475569', outline: 'none' },
  selectInput: { flex: 1, padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '13px', fontWeight: '600', color: '#475569', outline: 'none' },
  meetPlaceholder: { flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748B', fontWeight: '600' },
  addMeetBtn: { padding: '6px 14px', borderRadius: '10px', backgroundColor: '#EEF2FF', color: '#6366F1', border: 'none', fontWeight: '700', fontSize: '11px', cursor: 'pointer' },
  descTextarea: { flex: 1, padding: '12px 16px', borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '13px', fontWeight: '600', color: '#475569', minHeight: '100px', resize: 'none', outline: 'none' },
  createFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '24px', borderTop: '1px solid #F1F5F9' },
  cancelBtn: { padding: '12px 24px', borderRadius: '24px', border: 'none', backgroundColor: 'transparent', color: '#64748B', fontWeight: '800', fontSize: '14px', cursor: 'pointer' },
  saveBtn: { padding: '12px 32px', borderRadius: '24px', border: 'none', backgroundColor: '#6366F1', color: 'white', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.2)' },

  // Integration Section
  integrationSection: { display: 'flex', flexDirection: 'column', gap: '16px' },
  connectBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#475569', transition: 'all 0.2s', ':hover': { borderColor: '#4285F4', backgroundColor: '#F8FAFC' } },
  googleIconBox: { width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  externalCalList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  disconnectLink: { background: 'none', border: 'none', color: '#94A3B8', fontSize: '11px', fontWeight: '700', cursor: 'pointer', textAlign: 'left', marginTop: '8px', padding: 0 },

  // Meet Icon Wrapper
  meetIconWrapper: { width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

export default Agenda;
