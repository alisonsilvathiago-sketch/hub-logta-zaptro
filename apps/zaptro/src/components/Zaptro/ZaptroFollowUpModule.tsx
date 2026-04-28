import React from 'react';
import { 
  CalendarClock, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Plus,
  Filter,
  User,
  ExternalLink
} from 'lucide-react';

type FollowUpStatus = 'pendente' | 'concluido' | 'atrasado' | 'cancelado';
type FollowUpKind = 'lembrete' | 'whatsapp_auto';
type FollowUpChannel = 'whatsapp' | 'interno';

type ZaptroFollowUp = {
  id: string;
  clientId: string;
  clientName: string;
  clientType: 'lead' | 'cliente';
  kind: FollowUpKind;
  channel: FollowUpChannel;
  scheduledAt: string; // ISO
  message?: string;
  status: FollowUpStatus;
  userId: string;
  createdAt: string;
};

interface ZaptroFollowUpModuleProps {
  followups: ZaptroFollowUp[];
  onAdd: () => void;
  onStatusChange: (id: string, status: FollowUpStatus) => void;
  isDark: boolean;
  border: string;
  text: string;
  muted: string;
  LIME: string;
}

export const ZaptroFollowUpModule: React.FC<ZaptroFollowUpModuleProps> = ({
  followups,
  onAdd,
  onStatusChange,
  isDark,
  border,
  text,
  muted,
  LIME
}) => {
  const [filter, setFilter] = React.useState<'todos' | 'hoje' | 'atrasados' | 'proximos'>('todos');

  const filtered = followups.filter(fu => {
    if (filter === 'todos') return true;
    const date = new Date(fu.scheduledAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (filter === 'hoje') return isToday;
    if (filter === 'atrasados') return date < now && fu.status === 'pendente';
    if (filter === 'proximos') return date > now && fu.status === 'pendente';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['todos', 'hoje', 'atrasados', 'proximos'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                border: filter === f ? `1px solid ${LIME}` : `1px solid ${border}`,
                backgroundColor: filter === f ? 'rgba(217, 255, 0, 0.14)' : 'transparent',
                color: text,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {f}
            </button>
          ))}
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
          <Plus size={16} strokeWidth={3} /> Agendar Follow-up
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: muted, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 24, border: `1px dashed ${border}` }}>
            <CalendarClock size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontWeight: 600 }}>Nenhum follow-up encontrado para este filtro.</p>
          </div>
        ) : (
          filtered.map(fu => (
            <div
              key={fu.id}
              style={{
                padding: 20,
                borderRadius: 20,
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                border: `1px solid ${border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 14, 
                backgroundColor: fu.channel === 'whatsapp' ? 'rgba(37, 211, 102, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: fu.channel === 'whatsapp' ? '#25D366' : muted
              }}>
                {fu.channel === 'whatsapp' ? <MessageSquare size={24} /> : <CalendarClock size={24} />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: text }}>{fu.clientName}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9', color: muted, textTransform: 'uppercase' }}>
                    {fu.clientType}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: muted, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} /> {new Date(fu.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={14} /> {fu.kind === 'lembrete' ? 'Lembrete Interno' : 'WhatsApp Automático'}
                  </span>
                </div>
                {fu.message && (
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: text, fontStyle: 'italic', opacity: 0.8 }}>
                    "{fu.message}"
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {fu.status === 'pendente' && (
                  <>
                    <button
                      onClick={() => onStatusChange(fu.id, 'concluido')}
                      style={{ padding: '8px 12px', borderRadius: 10, border: 'none', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      <CheckCircle2 size={16} style={{ marginBottom: -3, marginRight: 4 }} /> Concluir
                    </button>
                    <button
                      onClick={() => onStatusChange(fu.id, 'cancelado')}
                      style={{ padding: '8px 12px', borderRadius: 10, border: 'none', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      <XCircle size={16} style={{ marginBottom: -3, marginRight: 4 }} /> Cancelar
                    </button>
                  </>
                )}
                {fu.status === 'concluido' && (
                  <span style={{ color: '#10b981', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CONCLUÍDO</span>
                )}
                {fu.status === 'cancelado' && (
                  <span style={{ color: muted, fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CANCELADO</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
