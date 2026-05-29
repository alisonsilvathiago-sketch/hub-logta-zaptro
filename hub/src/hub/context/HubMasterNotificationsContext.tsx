import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@core/lib/supabase';
import {
  buildSeedMasterNotifications,
  loadReadNotificationIds,
  mapAuditLogRow,
  mapHubNotificacaoRow,
  mapNotificationsTableRow,
  mergeAndSortNotifications,
  persistReadNotificationIds,
  type HubMasterNotification,
} from '@hub/lib/hubMasterNotifications';

type HubMasterNotificationsContextValue = {
  items: HubMasterNotification[];
  unreadCount: number;
  loading: boolean;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  openNotification: (n: HubMasterNotification) => void;
  incomingToasts: HubMasterNotification[];
  dismissToast: (id: string) => void;
};

const HubMasterNotificationsContext = createContext<HubMasterNotificationsContextValue | null>(null);

async function fetchAllNotifications(readIds: Set<string>): Promise<HubMasterNotification[]> {
  const buckets: HubMasterNotification[][] = [];

  const { data: hubRows } = await supabase
    .from('hub_notificacoes')
    .select('id, mensagem, sistema, tipo, lida, created_at')
    .order('created_at', { ascending: false })
    .limit(80);

  if (hubRows?.length) {
    buckets.push(hubRows.map((r) => mapHubNotificacaoRow(r, readIds)));
  }

  const { data: legacyRows } = await supabase
    .from('notifications')
    .select('id, title, message, priority, type, created_at, metadata')
    .order('created_at', { ascending: false })
    .limit(50);

  if (legacyRows?.length) {
    buckets.push(legacyRows.map((r) => mapNotificationsTableRow(r, readIds)));
  }

  const { data: auditRows } = await supabase
    .from('master_audit_logs')
    .select('id, action, details, created_at, target_type')
    .order('created_at', { ascending: false })
    .limit(30);

  if (auditRows?.length) {
    buckets.push(auditRows.map((r) => mapAuditLogRow(r, readIds)));
  }

  const merged = mergeAndSortNotifications(buckets);
  if (merged.length < 6) {
    const seeds = buildSeedMasterNotifications(readIds);
    return mergeAndSortNotifications([merged, seeds]);
  }
  return merged;
}

export const HubMasterNotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<HubMasterNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadNotificationIds());
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [incomingToasts, setIncomingToasts] = useState<HubMasterNotification[]>([]);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const bootstrappedRef = useRef(false);

  const pushIncomingToast = useCallback((n: HubMasterNotification) => {
    setIncomingToasts((prev) => {
      if (prev.some((t) => t.id === n.id)) return prev;
      return [n, ...prev].slice(0, 3);
    });
    window.setTimeout(() => {
      setIncomingToasts((prev) => prev.filter((t) => t.id !== n.id));
    }, 6000);
  }, []);

  const refresh = useCallback(async () => {
    const ids = loadReadNotificationIds();
    setReadIds(ids);
    const next = await fetchAllNotifications(ids);
    const withRead = next.map((n) => ({ ...n, read: n.read || ids.has(n.id) }));

    if (bootstrappedRef.current) {
      for (const n of withRead) {
        if (!knownIdsRef.current.has(n.id) && !n.read) {
          pushIncomingToast(n);
        }
      }
    } else {
      bootstrappedRef.current = true;
    }

    knownIdsRef.current = new Set(withRead.map((n) => n.id));
    setItems(withRead);
    setLoading(false);
  }, [pushIncomingToast]);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 45_000);
    return () => window.clearInterval(poll);
  }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel('hub-master-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hub_notificacoes' },
        () => void refresh(),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => void refresh(),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'master_audit_logs' },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      persistReadNotificationIds(next);
      return next;
    });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

    if (id.startsWith('hub_notif_')) {
      const uuid = id.replace('hub_notif_', '');
      void supabase.from('hub_notificacoes').update({ lida: true }).eq('id', uuid);
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    const allIds = new Set(items.map((n) => n.id));
    setReadIds(allIds);
    persistReadNotificationIds(allIds);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    void supabase.from('hub_notificacoes').update({ lida: true }).eq('lida', false);
  }, [items]);

  const openNotification = useCallback(
    (n: HubMasterNotification) => {
      markAsRead(n.id);
      setPanelOpen(false);
      navigate(n.path);
    },
    [markAsRead, navigate],
  );

  const dismissToast = useCallback((id: string) => {
    setIncomingToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      panelOpen,
      setPanelOpen,
      togglePanel: () => setPanelOpen((o) => !o),
      refresh,
      markAsRead,
      markAllAsRead,
      openNotification,
      incomingToasts,
      dismissToast,
    }),
    [
      items,
      unreadCount,
      loading,
      panelOpen,
      refresh,
      markAsRead,
      markAllAsRead,
      openNotification,
      incomingToasts,
      dismissToast,
    ],
  );

  return (
    <HubMasterNotificationsContext.Provider value={value}>
      {children}
    </HubMasterNotificationsContext.Provider>
  );
};

export function useHubMasterNotifications(): HubMasterNotificationsContextValue {
  const ctx = useContext(HubMasterNotificationsContext);
  if (!ctx) {
    throw new Error('useHubMasterNotifications must be used within HubMasterNotificationsProvider');
  }
  return ctx;
}
