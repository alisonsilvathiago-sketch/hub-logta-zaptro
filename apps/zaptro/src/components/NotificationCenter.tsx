import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Info, AlertTriangle, Ship, DollarSign, MapPin, Zap } from 'lucide-react';
import { useRealtime } from '../hooks/useRealtime';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { isZaptroTenantAdminRole } from '../utils/zaptroPermissions';

interface Notification {
  id: string;
  company_id: string;
  type: 'SYSTEM' | 'FINANCIAL' | 'CRM' | 'LOGISTICS' | 'API';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  metadata?: any;
}

const LIME = '#D9FF00';

const NotificationCenter: React.FC<{ isDark?: boolean; pageBg?: string }> = ({ isDark = false, pageBg = '#FFFFFF' }) => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const isMaster = profile?.role?.toUpperCase().includes('MASTER') || profile?.role?.toUpperCase() === 'HUB';
  const isAdmin = isZaptroTenantAdminRole(profile?.role);

  // Monitorar NOVAS NOTIFICAÇÕES (Realtime Real)
  // Se for Master, ouve globalmente (ou de uma empresa específica se estiver nela)
  const listenId = isMaster ? undefined : profile?.company_id;

  useEffect(() => {
    const fetchNotifications = async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (!isMaster && profile?.company_id) {
        query = query.eq('company_id', profile.company_id);
      }
      
      const { data } = await query;
      if (data) {
        // Filtrar por permissão no lado do cliente (camada extra de segurança)
        const filtered = data.filter(n => {
          if (isMaster) return true;
          // Colaboradores não veem financeiro
          if (n.type === 'FINANCIAL' && !isAdmin) return false;
          return true;
        });
        setNotifications(filtered);
      }
    };

    fetchNotifications();
  }, [profile?.company_id, isMaster, isAdmin]);

  useRealtime('notifications' as any, listenId, (payload) => {
    if (payload.eventType === 'INSERT') {
      const newNotif = payload.new as Notification;
      
      // Regras de exibição imediata
      const shouldShow = isMaster || (newNotif.company_id === profile?.company_id && (newNotif.type !== 'FINANCIAL' || isAdmin));
      
      if (shouldShow) {
        setNotifications(prev => [newNotif, ...prev].slice(0, 30));
        // Opcional: Feedback sonoro para alta prioridade
        if (['HIGH', 'CRITICAL'].includes(newNotif.priority)) {
          // playAlertSound();
        }
      }
    }
  });

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.is_read).length);
  }, [notifications]);

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const getPriorityStyles = (p: string) => {
    switch(p) {
      case 'CRITICAL': return { color: '#ef4444', icon: <AlertTriangle size={16} color="#ef4444" /> };
      case 'HIGH': return { color: '#f59e0b', icon: <Info size={16} color="#f59e0b" /> };
      case 'MEDIUM': return { color: LIME, icon: <Zap size={16} color={LIME} fill={LIME} /> };
      default: return { color: '#94a3b8', icon: <Check size={16} color="#94a3b8" /> };
    }
  };

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'FINANCIAL': return <DollarSign size={18} />;
      case 'LOGISTICS': return <Ship size={18} />;
      case 'CRM': return <MapPin size={18} />;
      default: return <Zap size={18} />;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        style={{
          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.08)',
          width: 52,
          height: 52,
          borderRadius: 16,
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} color={isDark ? '#FFF' : '#0F172A'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 14,
            right: 14,
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: 9,
            fontWeight: 800,
            width: 16,
            height: 16,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${pageBg}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 999 }} 
            onClick={() => setIsOpen(false)} 
          />
          <div style={{
            position: 'absolute',
            top: 64,
            right: 0,
            width: 380,
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            borderRadius: 24,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            zIndex: 3000,
            animation: 'notifAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{ padding: '24px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: isDark ? '#FFF' : '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                  Notificações
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  {isMaster ? 'Visão Master' : isAdmin ? 'Administrador' : 'Colaborador'}
                </p>
              </div>
              <button 
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }} 
                onClick={() => setIsOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ maxHeight: 420, overflowY: 'auto', padding: 12 }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                   <Bell size={40} color={isDark ? '#333' : '#E2E8F0'} style={{ marginBottom: 16 }} />
                   <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>Nenhuma notificação por aqui.</p>
                </div>
              ) : (
                notifications.map(n => {
                  const pStyle = getPriorityStyles(n.priority);
                  return (
                    <div 
                      key={n.id} 
                      style={{ 
                        display: 'flex',
                        gap: 12,
                        padding: 16,
                        borderRadius: 18,
                        cursor: 'pointer',
                        marginBottom: 8,
                        backgroundColor: n.is_read ? 'transparent' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                        borderLeft: `4px solid ${pStyle.color}`,
                        transition: 'all 0.2s'
                      }} 
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.metadata?.path) window.location.href = n.metadata.path;
                      }}
                    >
                       <div style={{ 
                         width: 40, 
                         height: 40, 
                         borderRadius: 12, 
                         backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF',
                         display: 'flex', 
                         alignItems: 'center', 
                         justifyContent: 'center',
                         boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                         flexShrink: 0,
                         color: isDark ? '#FFF' : '#0F172A'
                       }}>
                          {getNotifIcon(n.type)}
                       </div>
                       <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                             <span style={{ fontSize: 10, fontWeight: 800, color: pStyle.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                               {n.type}
                             </span>
                             <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>
                               {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#FFF' : '#0F172A', margin: '0 0 4px 0', lineHeight: 1.2 }}>{n.title}</p>
                          <p style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#64748b', margin: 0, lineHeight: 1.4, fontWeight: 500 }}>{n.message}</p>
                       </div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ padding: '16px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, textAlign: 'center' }}>
               <button style={{ background: 'none', border: 'none', color: isDark ? LIME : '#0F172A', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                 Limpar todas
               </button>
            </div>
          </div>
          <style>{`
            @keyframes notifAppear {
              from { opacity: 0; transform: translateY(10px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
