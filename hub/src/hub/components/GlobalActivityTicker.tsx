import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@core/lib/supabase';
import { 
  Building2, DollarSign, Briefcase, 
  Bell
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'company' | 'payment' | 'plan' | 'audit';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  message: string;
  timestamp: Date;
}

const GlobalActivityTicker: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const lastActivityKeyRef = useRef<string | null>(null);
  const lastActivityAtRef = useRef<number>(0);

  useEffect(() => {
    // Somente eventos reais (evita spam de UPDATEs constantes em tabelas operacionais)
    const auditChannel = supabase.channel('activity-audit')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, (payload) => {
        const action = (payload.new as any)?.action;
        const resource = (payload.new as any)?.resource;
        const actor_email = (payload.new as any)?.actor_email;

        // Exibir somente ações relevantes (login/entrada/ações do usuário)
        const actionUpper = String(action || '').toUpperCase();
        const allow = [
          'LOGIN',
          'SIGN_IN',
          'SESSION_START',
          'ACCESS_GRANTED',
          'IMPERSONATION',
          'PASSWORD_RESET',
          'USER_CREATED',
          'USER_UPDATED',
        ];
        const isAllowed = allow.some((k) => actionUpper.includes(k));
        if (!isAllowed) return;

        addActivity('audit', 'INSERT', `${actor_email || 'Usuário'}: ${action} ${resource ? `em ${resource}` : ''}`.trim());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(auditChannel);
    };
  }, []);

  const addActivity = (type: Activity['type'], action: Activity['action'], label: string) => {
    let message = '';
    
    if (type === 'audit') {
      message = label;
    } else {
      const actionVerb = action === 'INSERT' ? 'Adicionado' : action === 'UPDATE' ? 'Atualizado' : 'Excluído';
      const typeLabel = type === 'company' ? 'Empresa' : type === 'payment' ? 'Pagamento' : 'Plano';
      message = `${actionVerb} ${typeLabel}: ${label}`;
    }
    
    const newActivity: Activity = {
      id: Math.random().toString(36).substring(7),
      type,
      action,
      message,
      timestamp: new Date()
    };

    // Dedupe (mesma mensagem repetida em sequência / burst)
    const key = `${type}:${action}:${message}`;
    const now = Date.now();
    if (lastActivityKeyRef.current === key && now - lastActivityAtRef.current < 20_000) return;
    lastActivityKeyRef.current = key;
    lastActivityAtRef.current = now;

    setActivities(() => [newActivity]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setActivities(prev => prev.filter(a => a.id !== newActivity.id));
    }, 5000);
  };

  const handleActivityClick = (activity: Activity) => {
    switch (activity.type) {
      case 'company':
        navigate('/master/companies');
        break;
      case 'payment':
        navigate('/master/billing/faturamento');
        break;
      case 'plan':
        navigate('/master/billing/planos');
        break;
      case 'audit':
        navigate('/master/settings');
        break;
      default:
        navigate('/master/settings?tab=notificacoes');
    }
  };

  return (
    <div style={styles.toastStack}>
      {activities.map((activity) => (
        <div 
          key={activity.id} 
          style={{ ...styles.toastCard, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          onClick={() => handleActivityClick(activity)}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 25px 35px rgba(0,0,0,0.5)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.3)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          <div style={styles.toastHeader}>
            <div style={styles.livePulse} />
            <span style={styles.toastTitle}>ATIVIDADE EM TEMPO REAL</span>
            <span style={styles.toastTime}>{activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          
          <div style={styles.toastBody}>
            <div style={styles.iconBox}>
              {activity.type === 'company' && <Building2 size={16} color="#0061FF" />}
              {activity.type === 'payment' && <DollarSign size={16} color="#0061FF" />}
              {activity.type === 'plan' && <Briefcase size={16} color="#F59E0B" />}
              {activity.type === 'audit' && <Bell size={16} color="#F59E0B" />}
            </div>
            <span style={styles.toastMessage}>{activity.message}</span>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  toastStack: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 9999,
    width: '320px',
    pointerEvents: 'none'
  },
  toastCard: {
    backgroundColor: '#FFFFFF',
    backdropFilter: 'none',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(226, 232, 240, 1)',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
    animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    pointerEvents: 'auto'
  },
  toastHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px'
  },
  livePulse: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent)',
    boxShadow: '0 0 6px rgba(0, 97, 255, 0.35)'
  },
  toastTitle: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: '0.5px',
    flex: 1
  },
  toastTime: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#94A3B8'
  },
  toastBody: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  iconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  toastMessage: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: '1.4'
  }
};

export default GlobalActivityTicker;
