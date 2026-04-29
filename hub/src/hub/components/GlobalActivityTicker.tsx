import React, { useState, useEffect } from 'react';
import { supabase } from '@core/lib/supabase';
import { 
  Building2, DollarSign, Briefcase, 
  Trash2, PlusCircle, RefreshCw, 
  Zap, Bell
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'company' | 'payment' | 'plan';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  message: string;
  timestamp: Date;
}

const GlobalActivityTicker: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Listeners (kept the same)
    const companyChannel = supabase.channel('activity-companies')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, (payload) => {
        addActivity('company', payload.eventType as any, payload.new?.name || payload.old?.name);
      })
      .subscribe();

    const paymentChannel = supabase.channel('activity-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_payments' }, (payload) => {
        addActivity('payment', payload.eventType as any, `R$ ${payload.new?.amount || payload.old?.amount}`);
      })
      .subscribe();

    const planChannel = supabase.channel('activity-plans')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, (payload) => {
        addActivity('plan', payload.eventType as any, payload.new?.name || payload.old?.name);
      })
      .subscribe();

    const auditChannel = supabase.channel('activity-audit')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, (payload) => {
        const { action, resource, actor_email } = payload.new;
        addActivity('audit', 'INSERT', `${actor_email || 'Sistema'}: ${action} em ${resource}`);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(companyChannel);
      supabase.removeChannel(paymentChannel);
      supabase.removeChannel(planChannel);
      supabase.removeChannel(auditChannel);
    };
  }, []);

  const addActivity = (type: Activity['type'] | 'audit', action: Activity['action'], label: string) => {
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
      type: type === 'audit' ? 'company' : type,
      action,
      message,
      timestamp: new Date()
    };

    setActivities(prev => [newActivity, ...prev].slice(0, 3));
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setActivities(prev => prev.filter(a => a.id !== newActivity.id));
    }, 5000);
  };

  return (
    <div style={styles.toastStack}>
      {activities.map((activity) => (
        <div key={activity.id} style={styles.toastCard}>
          <div style={styles.toastHeader}>
            <div style={styles.livePulse} />
            <span style={styles.toastTitle}>ATIVIDADE EM TEMPO REAL</span>
            <span style={styles.toastTime}>{activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          
          <div style={styles.toastBody}>
            <div style={styles.iconBox}>
              {activity.type === 'company' && <Building2 size={16} color="#6366F1" />}
              {activity.type === 'payment' && <DollarSign size={16} color="#10B981" />}
              {activity.type === 'plan' && <Briefcase size={16} color="#F59E0B" />}
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
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
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
    backgroundColor: '#EF4444',
    boxShadow: '0 0 6px #EF4444'
  },
  toastTitle: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: '0.5px',
    flex: 1
  },
  toastTime: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#475569'
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  toastMessage: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: '1.4'
  }
};

export default GlobalActivityTicker;
