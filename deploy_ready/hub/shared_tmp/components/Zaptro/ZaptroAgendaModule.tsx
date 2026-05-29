import React from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  MapPin,
  Video
} from 'lucide-react';

type MeetingStatus = 'agendada' | 'concluida' | 'cancelada';
type ZaptroMeeting = {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description?: string;
  scheduledAt: string; // ISO
  durationMinutes: number;
  status: MeetingStatus;
  userId: string;
  createdAt: string;
};

interface ZaptroAgendaModuleProps {
  meetings: ZaptroMeeting[];
  onAdd: () => void;
  isDark: boolean;
  border: string;
  text: string;
  muted: string;
  LIME: string;
}

export const ZaptroAgendaModule: React.FC<ZaptroAgendaModuleProps> = ({
  meetings,
  onAdd,
  isDark,
  border,
  text,
  muted,
  LIME
}) => {
  // Simulação de calendário simplificado (lista ordenada por data)
  const sorted = [...meetings].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: text, letterSpacing: '-0.02em' }}>Minha Agenda</h3>
          <p style={{ margin: 0, fontSize: 13, color: muted }}>Gerencie suas reuniões e apresentações.</p>
        </div>
        <button
          onClick={onAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 14,
            backgroundColor: LIME,
            color: '#000',
            border: 'none',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(217, 255, 0, 0.3)'
          }}
        >
          <Plus size={16} strokeWidth={3} /> Nova Reunião
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {sorted.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: muted, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 24, border: `1px dashed ${border}` }}>
            <Calendar size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontWeight: 700, fontSize: 16 }}>Nenhuma reunião agendada.</p>
            <p style={{ fontSize: 13, opacity: 0.7 }}>Clique no botão acima para marcar o seu primeiro compromisso.</p>
          </div>
        ) : (
          sorted.map(m => {
            const date = new Date(m.scheduledAt);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  gap: 20,
                  padding: 20,
                  borderRadius: 24,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                  border: `1px solid ${isToday ? LIME : border}`,
                  boxShadow: isToday ? '0 8px 32px rgba(217, 255, 0, 0.08)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {isToday && (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', backgroundColor: LIME }} />
                )}

                {/* DATE BOX */}
                <div style={{ 
                  width: 64, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRight: `1px solid ${border}`,
                  paddingRight: 20
                }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: LIME, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: text }}>{date.getDate()}</span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: text }}>{m.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: muted, fontWeight: 600 }}>
                          <Users size={14} /> {m.clientName}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: muted, fontWeight: 600 }}>
                          <Clock size={14} /> {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({m.durationMinutes}min)
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ padding: '6px 12px', borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: text, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Editar
                      </button>
                    </div>
                  </div>

                  {m.description && (
                    <p style={{ margin: '12px 0 0', fontSize: 13, color: muted, lineHeight: 1.5 }}>
                      {m.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '6px 12px', borderRadius: 8 }}>
                      <Video size={14} /> Google Meet
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: muted, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', padding: '6px 12px', borderRadius: 8 }}>
                      <MapPin size={14} /> Presencial / Remoto
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
