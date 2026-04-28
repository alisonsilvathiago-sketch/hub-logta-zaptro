import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, MapPin, 
  Clock, Video, User, CheckCircle2, Calendar as CalIcon,
  Search, Filter, MoreHorizontal, Globe, Users, Lock, Save,
  Phone, MessageSquare, Briefcase, Zap, AlertTriangle, AlertCircle, TrendingUp, TrendingDown,
  ChevronDown, X, Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '../lib/toast';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  type: 'ligacao' | 'reuniao' | 'visita' | 'followup' | string;
  is_public: boolean;
  is_shared: boolean;
  user_id: string;
  company_id: string;
  created_at: string;
}

const LogtaCalendar: React.FC = () => {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'reuniao',
    is_public: false,
    is_shared: false,
    assignees: [] as string[]
  });
  const [filter, setFilter] = useState<'all' | 'shared'>('all');
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [teamMembers] = useState([
    { id: 1, name: 'Alison Thiago', color: '#4f46e5', initial: 'AT' },
    { id: 2, name: 'Lucas Silva', color: '#10b981', initial: 'LS' },
    { id: 3, name: 'Marina Fontes', color: '#f59e0b', initial: 'MF' },
  ]);
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([1]);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [profile, filter]);

  const fetchEvents = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('company_id', profile.company_id);

      if (filter === 'shared') query = query.eq('is_shared', true);

      const { data, error } = await query.order('start_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Erro ao carregar agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!profile?.company_id || !newEvent.title) return;
    const toastId = toastLoading('Agendando atividade...');
    try {
      const start_date = new Date(`${newEvent.date}T${newEvent.time}`).toISOString();
      const { error } = await supabase.from('calendar_events').insert([{
        title: newEvent.title,
        description: newEvent.description,
        start_date,
        type: newEvent.type,
        is_public: newEvent.is_public,
        is_shared: newEvent.is_shared,
        user_id: profile.id,
        company_id: profile.company_id
      }]);

      if (error) throw error;
      toastDismiss(toastId);
      toastSuccess('Atividade agendada com sucesso!');
      setIsTaskModalOpen(false);
      setNewEvent({
        title: '', description: '', date: new Date().toISOString().split('T')[0],
        time: '09:00', type: 'reuniao', is_public: false, is_shared: false, assignees: []
      });
      fetchEvents();
    } catch (err: any) {
      toastDismiss(toastId);
      toastError(`Erro ao agendar: ${err.message}`);
    }
  };

   const navigateCalendar = (offset: number) => {
     const nextDate = new Date(currentDate);
     if (viewMode === 'today') {
       nextDate.setDate(currentDate.getDate() + offset);
     } else if (viewMode === 'week') {
       nextDate.setDate(currentDate.getDate() + (offset * 7));
     } else if (viewMode === 'year') {
       nextDate.setFullYear(currentDate.getFullYear() + offset);
     } else {
       nextDate.setMonth(currentDate.getMonth() + offset);
     }
     setCurrentDate(nextDate);
   };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={styles.dayBox} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isToday = date.toDateString() === new Date().toDateString();
      const dayEvents = filteredEvents.filter(e => new Date(e.start_date).toDateString() === date.toDateString());

      days.push(
        <div 
          key={d} 
          style={{...styles.dayBox, ...(isToday ? styles.todayBox : {}), cursor: 'pointer'}}
          onClick={() => {
            setNewEvent({...newEvent, date: date.toISOString().split('T')[0]});
            setIsTaskModalOpen(true);
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
             <span style={{...styles.dayLabel, ...(isToday ? styles.todayLabel : {})}}>{d}</span>
             {dayEvents.length > 0 && <div style={styles.dotIndicator} />}
          </div>
          <div style={styles.eventList}>
             {dayEvents.slice(0, 3).map((t, idx) => (
                <div key={idx} 
                  onClick={(e) => { e.stopPropagation(); setSelectedEvent(t); }}
                  style={{
                    ...styles.eventItem, 
                    cursor: 'pointer',
                    backgroundColor: t.type === 'reuniao' ? '#8b5cf6' : t.type === 'visita' ? '#10b981' : t.type === 'followup' ? '#f59e0b' : '#6366f1'
                  }}>
                   <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>{t.title}</span>
                </div>
             ))}
             {dayEvents.length > 3 && <span style={styles.moreLabel}>+ {dayEvents.length - 3} mais</span>}
          </div>
        </div>
      );
    }
    return days;
  };

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div style={styles.container}>
      <div style={{display: 'flex', gap: '32px', flex: 1}}>
          {/* Main Content - Calendar Area */}
          <div style={{...styles.calendarSection, flex: 1}}>
              <div style={styles.calNav}>
                 <div style={styles.navLeft}>
                    <div style={styles.dateBadge}>
                       <span style={styles.dateMonth}>{currentDate.toLocaleString('pt-BR', {month: 'short'}).toUpperCase()}</span>
                       <span style={styles.dateYear}>{currentDate.getFullYear()}</span>
                    </div>
                    <div>
                       <h2 style={styles.monthTitle}>{currentDate.toLocaleString('pt-BR', {month: 'long'})}</h2>
                       <div style={styles.arrows}>
                          <button style={styles.arrowBtn} onClick={() => navigateCalendar(-1)}><ChevronLeft size={16} /></button>
                          <button style={styles.arrowBtn} onClick={() => navigateCalendar(1)}><ChevronRight size={16} /></button>
                          <button style={styles.todayBtn} onClick={() => { setCurrentDate(new Date()); setViewMode('month'); }}>Hoje</button>
                       </div>
                    </div>
                 </div>
              </div>

               <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: '#f8fafc', padding: '12px 24px', borderRadius: '20px', border: '1px solid #f1f5f9'}}>
                  <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                     <div style={styles.filterTabs}>
                        {[
                          {id: 'today', label: 'Hoje'},
                          {id: 'week', label: 'Semana'},
                          {id: 'month', label: 'Mês'},
                          {id: 'year', label: 'Ano'}
                        ].map(v => (
                          <button 
                            key={v.id}
                            style={{...styles.filterTab, ...(viewMode === v.id ? styles.filterTabActive : {})}} 
                            onClick={() => setViewMode(v.id as any)}
                          >
                            {v.label}
                          </button>
                        ))}
                     </div>
                     <div style={{...styles.filterTabs, marginLeft: '12px'}}>
                        <button style={{...styles.filterTab, ...(filter === 'all' ? styles.filterTabActive : {})}} onClick={() => setFilter('all')}>Tudo</button>
                        <button style={{...styles.filterTab, ...(filter === 'shared' ? styles.filterTabActive : {})}} onClick={() => setFilter('shared')}>Time</button>
                     </div>
                  </div>
                  
                  <button style={styles.addBtn} onClick={() => setIsTaskModalOpen(true)}>
                     <Plus size={18} /> Novo Agendamento
                  </button>
               </div>

              <div style={styles.calendarGrid}>
                 {viewMode === 'month' && (
                   <>
                     {daysOfWeek.map(d => <div key={d} style={styles.weekdayHeading}>{d}</div>)}
                     {renderDays()}
                   </>
                 )}
                 {viewMode === 'today' && (
                    <div style={{gridColumn: '1 / -1', padding: '12px 24px'}}>
                       <h3 style={{fontSize: '18px', fontWeight: '900', color: '#1e293b', marginBottom: '24px'}}>Compromissos para {currentDate.toLocaleDateString('pt-BR')}</h3>
                       <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                          {filteredEvents.filter(e => new Date(e.start_date).toDateString() === currentDate.toDateString()).length > 0 ? (
                            filteredEvents.filter(e => new Date(e.start_date).toDateString() === currentDate.toDateString()).map(e => (
                              <div key={e.id} onClick={() => setSelectedEvent(e)} style={{...styles.taskCard, marginTop: 0, padding: '24px', cursor: 'pointer', borderLeft: '4px solid var(--primary)'}}>
                                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <div>
                                       <span style={{fontSize: '12px', fontWeight: '900', color: 'var(--primary)'}}>{new Date(e.start_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
                                       <h4 style={{fontSize: '18px', fontWeight: '900', marginTop: '4px'}}>{e.title}</h4>
                                       <p style={{fontSize: '13px', color: '#64748b', marginTop: '4px'}}>{e.description}</p>
                                    </div>
                                    <ChevronRight size={20} color="#cbd5e1" />
                                 </div>
                              </div>
                            ))
                          ) : (
                            <div style={{padding: '60px', textAlign: 'center', border: '2px dashed #f1f5f9', borderRadius: '32px'}}>
                               <CalIcon size={48} color="#cbd5e1" style={{marginBottom: '16px'}} />
                               <p style={{fontSize: '15px', color: '#94a3b8', fontWeight: '700'}}>Nada agendado para hoje. Aproveite para prospectar!</p>
                            </div>
                          )}
                       </div>
                    </div>
                 )}
                 {viewMode === 'week' && (
                    <>
                       {daysOfWeek.map(d => <div key={d} style={styles.weekdayHeading}>{d}</div>)}
                       {(() => {
                          const startOfWeek = new Date(currentDate);
                          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                          
                          const weekDays = [];
                          for (let i = 0; i < 7; i++) {
                             const date = new Date(startOfWeek);
                             date.setDate(startOfWeek.getDate() + i);
                             const isToday = date.toDateString() === new Date().toDateString();
                             const dayEvents = filteredEvents.filter(e => new Date(e.start_date).toDateString() === date.toDateString());
                             weekDays.push(
                                <div 
                                  key={i} 
                                  style={{...styles.dayBox, height: '400px', cursor: 'pointer', ...(isToday ? styles.todayBox : {})}}
                                  onClick={() => {
                                    setNewEvent({...newEvent, date: date.toISOString().split('T')[0]});
                                    setIsTaskModalOpen(true);
                                  }}
                                >
                                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                                      <span style={{...styles.dayLabel, ...(isToday ? styles.todayLabel : {})}}>{date.getDate()}</span>
                                      {dayEvents.length > 0 && <div style={styles.dotIndicator} />}
                                   </div>
                                   <div style={styles.eventList}>
                                      {dayEvents.map((t, idx) => (
                                         <div key={idx} onClick={(e) => { e.stopPropagation(); setSelectedEvent(t); }} style={{...styles.eventItem, cursor: 'pointer', backgroundColor: t.type === 'reuniao' ? '#8b5cf6' : t.type === 'visita' ? '#10b981' : t.type === 'followup' ? '#f59e0b' : '#6366f1'}}>
                                            <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>{t.title}</span>
                                         </div>
                                      ))}
                                   </div>
                                </div>
                             );
                          }
                          return weekDays;
                       })()}
                    </>
                 )}
                 {viewMode === 'year' && (
                    <div style={{gridColumn: '1 / -1', padding: '32px'}}>
                       <h3 style={{fontSize: '18px', fontWeight: '900', color: '#1e293b', marginBottom: '24px'}}>Agenda Anual {currentDate.getFullYear()}</h3>
                       <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px'}}>
                          {Array.from({length: 12}).map((_, i) => (
                             <div key={i} style={{padding: '20px', borderRadius: '20px', border: '1px solid #f1f5f9', backgroundColor: i === new Date().getMonth() ? '#f5f3ff' : 'white'}}>
                                <h4 style={{fontSize: '14px', fontWeight: '900', color: i === new Date().getMonth() ? 'var(--primary)' : '#1e293b', marginBottom: '8px', textTransform: 'capitalize'}}>{new Date(0, i).toLocaleString('pt-BR', {month: 'long'})}</h4>
                                <p style={{fontSize: '11px', color: '#94a3b8', fontWeight: '700'}}>{filteredEvents.filter(e => new Date(e.start_date).getMonth() === i).length} Compromissos</p>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
          </div>

          {/* Sidebar Area */}
          <div style={styles.sidebar}>
             <div style={styles.sidebarCard}>
                <h3 style={styles.sidebarTitle}><Clock size={16} color="var(--primary)" /> Próximas Visitas</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px'}}>
                   {events.slice(0, 4).map(e => (
                      <div key={e.id} style={styles.taskCard}>
                         <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                            <span style={styles.taskTime}>{new Date(e.start_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
                            <div style={{...styles.typeBadge, backgroundColor: e.type === 'visita' ? '#f0fdf4' : '#f1f5f9', color: e.type === 'visita' ? '#10b981' : '#64748b'}}>
                               {e.type.toUpperCase()}
                            </div>
                         </div>
                         <h4 style={styles.taskTitle}>{e.title}</h4>
                         <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '11px', color: '#94a3b8'}}>
                            <MapPin size={12} /> Cliente Estratégico
                         </div>
                      </div>
                   ))}
                   {events.length === 0 && (
                      <div style={{padding: '40px 20px', textAlign: 'center', border: '2px dashed #f1f5f9', borderRadius: '24px'}}>
                         <CalIcon size={32} color="#cbd5e1" style={{marginBottom: '12px'}} />
                         <p style={{fontSize: '13px', color: '#94a3b8', fontWeight: '700'}}>Seu dia está livre hoje.</p>
                      </div>
                   )}
                </div>
             </div>

             <div style={{...styles.sidebarCard, backgroundColor: 'var(--primary)', color: 'white', marginTop: '32px'}}>
                <h3 style={{...styles.sidebarTitle, color: 'white'}}><Zap size={16} fill="white" /> Meta Comercial</h3>
                <p style={{fontSize: '13px', opacity: 0.9, marginTop: '12px'}}>Você atingiu <strong>75%</strong> da meta de visitas semanais. Faltam apenas 3 para o bônus!</p>
                <div style={{height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginTop: '20px'}}>
                   <div style={{height: '100%', width: '75%', backgroundColor: 'white', borderRadius: '4px'}} />
                </div>
             </div>

             <div style={{...styles.sidebarCard, border: '1px solid #fecdd3', backgroundColor: '#fff1f2', padding: '24px', marginTop: '32px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
                    <AlertTriangle size={18} color="#e11d48" />
                    <h4 style={{fontSize: '14px', fontWeight: '900', color: '#9f1239', margin: 0}}>Atividades em Atraso</h4>
                </div>
                <p style={{fontSize: '12px', color: '#9f1239', margin: 0, fontWeight: '600'}}>Existem <strong>2 follow-ups</strong> vencidos. Não deixe o cliente esfriar!</p>
             </div>
          </div>
      </div>

      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Novo Agendamento Estratégico" width="600px">
        <div style={styles.modalForm}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Título da Atividade</label>
              <input 
                style={styles.field} 
                required 
                placeholder="Ex: Reunião de Fechamento - Logta Soft" 
                value={newEvent.title}
                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
              />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Data</label>
                <input 
                  type="date" 
                  style={styles.field} 
                  required 
                  value={newEvent.date}
                  onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Horário</label>
                <input 
                  type="time" 
                  style={styles.field} 
                  required 
                  value={newEvent.time}
                  onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
               <label style={styles.label}>Responsáveis pela Estratégia</label>
               <div style={{display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap'}}>
                  {teamMembers.map(member => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        if (selectedAssignees.includes(member.id)) {
                          setSelectedAssignees(selectedAssignees.filter(id => id !== member.id));
                        } else {
                          setSelectedAssignees([...selectedAssignees, member.id]);
                        }
                      }}
                      style={{
                        ...styles.bigAvatar,
                        backgroundColor: member.color,
                        border: selectedAssignees.includes(member.id) ? '2px solid #1e293b' : 'none',
                        opacity: selectedAssignees.includes(member.id) ? 1 : 0.4,
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      title={member.name}
                    >
                      {member.initial}
                    </button>
                  ))}
                  <button style={{...styles.bigAvatar, backgroundColor: '#f1f5f9', border: '1px dashed #cbd5e1', color: '#64748b'}} type="button"><Plus size={16} /></button>
               </div>
             </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Tipo de Interação</label>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                {[
                  {id: 'ligacao', label: '📞 Ligação', color: '#6366f1'},
                  {id: 'reuniao', label: '🤝 Reunião', color: '#8b5cf6'},
                  {id: 'visita', label: '🚗 Visita', color: '#10b981'},
                  {id: 'followup', label: '💬 Follow-up', color: '#f59e0b'}
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setNewEvent({...newEvent, type: t.id})}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: '2px solid',
                      borderColor: newEvent.type === t.id ? t.color : '#e2e8f0',
                      backgroundColor: newEvent.type === t.id ? `${t.color}10` : 'transparent',
                      color: newEvent.type === t.id ? t.color : '#64748b',
                      fontSize: '12px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Observações Estratégicas</label>
              <textarea 
                style={{...styles.field, height: '100px', padding: '16px', resize: 'none'}} 
                placeholder="Detalhes importantes para o contato..."
                value={newEvent.description}
                onChange={e => setNewEvent({...newEvent, description: e.target.value})}
              />
            </div>

            <button style={styles.saveBtn} onClick={handleSaveEvent} disabled={loading || !newEvent.title}>
               <CheckCircle2 size={18} /> Agendar Compromisso
            </button>
        </div>
      </Modal>

      {/* DETAILS MODAL */}
      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Check-list de Atividade Comercial" width="650px">
        {selectedEvent && (
          <div style={{padding: '24px'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px'}}>
                 <div>
                    <span style={{...styles.typeBadge, backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '900'}}>{selectedEvent.type.toUpperCase()}</span>
                    <h2 style={{fontSize: '24px', fontWeight: '950', marginTop: '12px', color: 'var(--text-main)'}}>{selectedEvent.title}</h2>
                    <p style={{color: '#64748b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px'}}>
                       <Clock size={14} /> {new Date(selectedEvent.start_date).toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})}
                    </p>
                 </div>
                 <div style={{display: 'flex', gap: '-8px', alignItems: 'center'}}>
                    <div style={{...styles.bigAvatar, backgroundColor: '#4f46e5', border: '3px solid white'}}>A</div>
                    <div style={{...styles.bigAvatar, backgroundColor: '#1e1b4b', border: '3px solid white', marginLeft: '-12px'}}>B</div>
                 </div>
             </div>

             <div style={{backgroundColor: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9', marginBottom: '32px'}}>
                <h4 style={{fontSize: '13px', fontWeight: '900', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                   <Zap size={16} color="var(--primary)" /> Estratégia de Atendimento
                </h4>
                <p style={{fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0}}>
                   {selectedEvent.description || 'Nenhuma estratégia detalhada para este contato comercial.'}
                </p>
             </div>

             <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <h4 style={{fontSize: '13px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Check-list de Sucesso</h4>
                {[
                  'Verificar histórico de pedidos no CRM',
                  'Confirmar SLA de entrega atual',
                  'Apresentar nova tabela de fretes regional',
                  'Coletar feedback sobre a última ocorrência'
                ].map((item, i) => (
                  <div key={i} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '16px'}}>
                     <div style={{width: '20px', height: '20px', borderRadius: '6px', border: '2px solid #e2e8f0'}} />
                     <span style={{fontSize: '14px', fontWeight: '700', color: '#1e293b'}}>{item}</span>
                  </div>
                ))}
             </div>

             <div style={{display: 'flex', gap: '12px', marginTop: '32px'}}>
                <button style={{...styles.saveBtn, flex: 1, backgroundColor: '#10b981'}} onClick={() => toastSuccess('Atividade concluída!')}><CheckCircle2 size={18} /> Concluir Atividade</button>
                <button style={{...styles.saveBtn, flex: 1, backgroundColor: 'white', color: '#1e293b', border: '1px solid #e2e8f0'}} onClick={() => setSelectedEvent(null)}>Fechar</button>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '32px', backgroundColor: '#fcfcfc', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '32px' },
  calendarSection: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' },
  calNav: { padding: '32px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '24px' },
  dateBadge: { padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column' },
  dateMonth: { fontSize: '11px', fontWeight: '900', letterSpacing: '1px' },
  dateYear: { fontSize: '18px', fontWeight: '950' },
  monthTitle: { fontSize: '28px', fontWeight: '950', color: '#0f172a', textTransform: 'capitalize', margin: 0 },
  arrows: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' },
  arrowBtn: { width: '32px', height: '32px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  todayBtn: { padding: '0 16px', height: '32px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  
  navRight: { display: 'flex', alignItems: 'center', gap: '24px' },
  filterTabs: { display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '14px', gap: '4px' },
  filterTab: { padding: '10px 20px', border: 'none', background: 'none', fontSize: '12px', fontWeight: '800', color: '#64748b', cursor: 'pointer', borderRadius: '10px', transition: 'all 0.2s' },
  filterTabActive: { backgroundColor: 'white', color: 'var(--primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  addBtn: { height: '48px', padding: '0 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(99,102,241,0.2)' },
  
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid #f1f5f9' },
  weekdayHeading: { padding: '16px', textAlign: 'center', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', borderRight: '1px solid #f8fafc' },
  dayBox: { minHeight: '140px', padding: '16px', borderRight: '1px solid #f8fafc', borderBottom: '1px solid #f8fafc', position: 'relative' as const },
  dayLabel: { fontSize: '14px', fontWeight: '900', color: '#64748b' },
  todayBox: { backgroundColor: '#fcfdfe' },
  todayLabel: { width: '28px', height: '28px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dotIndicator: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b', boxShadow: '0 0 10px rgba(245,158,11,0.3)' },
  
  eventList: { display: 'flex', flexDirection: 'column' as const, gap: '6px', marginTop: '12px' },
  eventItem: { padding: '6px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  moreLabel: { fontSize: '10px', fontWeight: '900', color: '#94a3b8', display: 'block', marginTop: '4px' },
  
  sidebar: { width: '320px', display: 'flex', flexDirection: 'column' as const, gap: '32px' },
  sidebarCard: { padding: '32px', backgroundColor: 'white', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  sidebarTitle: { fontSize: '16px', fontWeight: '950', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' },
  taskCard: { padding: '16px', borderRadius: '20px', border: '1px solid #f8fafc', backgroundColor: '#fcfcfe', marginTop: '16px' },
  taskTime: { fontSize: '11px', fontWeight: '900', color: 'var(--primary)' },
  taskTitle: { fontSize: '14px', fontWeight: '800', color: '#1e293b', margin: '4px 0 0 0' },
  typeBadge: { padding: '2px 8px', borderRadius: '8px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' },
  miniAvatarGroup: { display: 'flex', alignItems: 'center' },
  miniAvatar: { width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '900', color: 'white', border: '1px solid white' },
  bigAvatar: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', color: 'white' },
  
  modalForm: { display: 'flex', flexDirection: 'column' as const, gap: '20px', padding: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  label: { fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' },
  field: { height: '48px', padding: '0 16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '14px', outline: 'none', fontWeight: '700' },
  saveBtn: { height: '56px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', marginTop: '12px' }
};

export default LogtaCalendar;
