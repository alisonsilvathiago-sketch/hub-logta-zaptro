import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isZaptroTenantAdminRole } from '../../utils/zaptroPermissions';
import { supabaseZaptro } from '../../lib/supabase-zaptro';
import {
  activateWaLinkInboxDirect,
  resolveWaLinkInboxCompanyId,
  resolveWaLinkInboxCompanyIds,
} from '../../lib/waLinkInboxActivate';
import { sendMedia as sendEdgeMedia, sendMessage as sendEdgeMessage, sendSticker as sendEdgeSticker } from '../../services/evolution.service';
import { fetchContactProfilePic, sendEvolutionText } from '../../services/evolution';
import {
  enrichWaLinkConversationPreviews,
  fetchWaLinkConversations,
  formatWaLinkInboxError,
  type WaLinkConversation,
} from './waLinkInboxDb';
import {
  markWaLinkSessionConnected,
  readWaLinkSession,
  waLinkSharedInstance,
  waLinkShouldUseEdge,
} from './waLinkConfig';
import { useWaLinkConnectionStatus } from './useWaLinkConnectionStatus';
import {
  applyWaLinkUnreadCounts,
  fetchWaLinkUnreadByConversation,
  markAllWaLinkConversationsRead,
  markWaLinkConversationRead,
  readWaLinkReadAtMap,
} from './waLinkUnread';
import {
  ensureWaLinkLeadConversation,
  promoteWaLinkToClient,
  shouldAutoPromoteWaLinkPayment,
} from './waLinkClientLifecycle';
import { appendZaptroActivityLog } from '../../constants/zaptroActivityLogStore';
import { zaptroCollaboratorColor } from '../../lib/zaptroAgendaCollaborators';
import { zaptroNormWaPhone } from '../../lib/zaptroCrmWhatsappInboxSync';
import { isWhatsappMirrorContactId } from '../../lib/zaptroWhatsappMirrorContacts';
import {
  playWaIncomingMessageSound,
  showWaDesktopNotificationIfAllowed,
} from '../../lib/zaptroWaMessageNotifications';

function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Falha ao ler ficheiro.'));
    reader.readAsDataURL(file);
  });
}

function mediaTypeFromFile(file: File): 'image' | 'video' | 'document' {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  return 'document';
}

export type { WaLinkConversation } from './waLinkInboxDb';

function readEscalationAt(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const v = (metadata as Record<string, unknown>).ai_escalated_at;
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function profileDepartment(profile: { department?: string | null; metadata?: unknown } | null): string | null {
  if (!profile) return null;
  if (profile.department?.trim()) return profile.department.trim();
  const meta = profile.metadata;
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const d = (meta as Record<string, unknown>).department;
    if (typeof d === 'string' && d.trim()) return d.trim();
  }
  return null;
}

export type WaLinkMessage = {
  id: string;
  conversation_id: string;
  content: string | null;
  message_type?: string | null;
  media_url?: string | null;
  mime_type?: string | null;
  media_mime_type?: string | null;
  file_name?: string | null;
  media_file_name?: string | null;
  direction: string;
  created_at: string;
  from_number?: string | null;
  to_number?: string | null;
  is_edited?: boolean | null;
  is_deleted?: boolean | null;
  reaction?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  contact_vcard?: string | null;
};

/** Inbox wa-link — conversas via Supabase (webhook Evolution). */
export function useWaLinkInbox() {
  const { profile, user, isLoading: authLoading, isMaster } = useAuth();
  const session = readWaLinkSession();
  const { connected: waConnected } = useWaLinkConnectionStatus();

  const [conversations, setConversations] = useState<WaLinkConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WaLinkMessage[]>([]);
  const [listReady, setListReady] = useState(false);
  const [refreshingList, setRefreshingList] = useState(false);
  const [sending, setSending] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [ephemeralChat, setEphemeralChat] = useState<WaLinkConversation | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const escalationSeenRef = useRef<Set<string>>(new Set());
  const messagesForIdRef = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;
  const loadTimerRef = useRef<number | null>(null);
  const lastLoadAtRef = useRef<number>(0);
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  const companyId = resolveWaLinkInboxCompanyId(profile, session.companyId, user?.id);
  const inboxCompanyIds = resolveWaLinkInboxCompanyIds(profile, session.companyId, user?.id);
  const instanceName = session.instance || waLinkSharedInstance();

  const selected = useMemo(() => {
    if (ephemeralChat && selectedId === ephemeralChat.id) return ephemeralChat;
    return conversations.find((c) => c.id === selectedId) ?? null;
  }, [conversations, selectedId, ephemeralChat]);

  const isAttendanceAdmin = Boolean(isMaster || isZaptroTenantAdminRole(profile?.role));

  const canReplyToConversation = useCallback(
    (conversation: WaLinkConversation | null): boolean => {
      if (!conversation || !profile?.id) return false;
      const owner = conversation.assigned_to?.trim();
      if (!owner) return true;
      if (owner === profile.id) return true;
      return isAttendanceAdmin;
    },
    [profile?.id, isAttendanceAdmin],
  );

  const patchConversationLocal = useCallback((id: string, patch: Partial<WaLinkConversation>) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setEphemeralChat((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  }, []);

  const claimAttendance = useCallback(
    async (conversationId: string) => {
      if (!profile?.id || isWhatsappMirrorContactId(conversationId)) return;
      const conv =
        conversations.find((c) => c.id === conversationId) ??
        (ephemeralChat?.id === conversationId ? ephemeralChat : null);
      setClaiming(true);
      const now = new Date().toISOString();
      try {
        const dept = profileDepartment(profile);
        const { error } = await supabaseZaptro
          .from('whatsapp_conversations')
          .update({
            assigned_to: profile.id,
            attendance_status: 'in_service',
            assigned_at: now,
            ...(dept ? { department: dept } : {}),
          })
          .eq('id', conversationId);
        if (error) throw error;
        patchConversationLocal(conversationId, {
          assigned_to: profile.id,
          attendance_status: 'in_service',
          assigned_at: now,
          ...(dept ? { department: dept } : {}),
        });
        try {
          appendZaptroActivityLog(companyId || 'local-demo', {
            type: 'atendimento',
            actorName: profile.full_name?.trim() || profile.email?.trim() || 'Colaborador',
            actorUserId: profile.id,
            actorColor: zaptroCollaboratorColor(profile.id),
            clientLabel: conv?.sender_name || conv?.sender_number || conversationId,
            action: 'Atendimento aceite',
            details: 'Conversa assumida na fila WhatsApp',
          });
        } catch {
          /* ignore */
        }
      } finally {
        setClaiming(false);
      }
    },
    [profile, companyId, patchConversationLocal, conversations, ephemeralChat],
  );

  const transferToDepartment = useCallback(
    async (conversationId: string, departmentName: string) => {
      if (!departmentName.trim() || isWhatsappMirrorContactId(conversationId)) return;
      setTransferring(true);
      const dept = departmentName.trim();
      const now = new Date().toISOString();
      try {
        const { error } = await supabaseZaptro
          .from('whatsapp_conversations')
          .update({
            department: dept,
            assigned_to: null,
            attendance_status: 'awaiting',
            assigned_at: null,
            updated_at: now,
          })
          .eq('id', conversationId);
        if (error) throw error;
        patchConversationLocal(conversationId, {
          department: dept,
          assigned_to: null,
          attendance_status: 'awaiting',
          assigned_at: null,
          updated_at: now,
        });
      } finally {
        setTransferring(false);
      }
    },
    [patchConversationLocal],
  );

  const releaseAttendance = useCallback(
    async (conversationId: string) => {
      if (isWhatsappMirrorContactId(conversationId)) return;
      setClaiming(true);
      try {
        const { error } = await supabaseZaptro
          .from('whatsapp_conversations')
          .update({
            assigned_to: null,
            attendance_status: 'awaiting',
            assigned_at: null,
          })
          .eq('id', conversationId);
        if (error) throw error;
        patchConversationLocal(conversationId, {
          assigned_to: null,
          attendance_status: 'awaiting',
          assigned_at: null,
        });
      } finally {
        setClaiming(false);
      }
    },
    [patchConversationLocal],
  );

  const fetchMessagePreviews = useCallback(async (conversationIds: string[]) => {
    const map = new Map<string, string>();
    if (conversationIds.length === 0) return map;
    const { data, error } = await supabaseZaptro
      .from('whatsapp_messages')
      .select('conversation_id,content,created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
      .limit(conversationIds.length * 3);
    if (error || !data) return map;
    for (const row of data as { conversation_id: string; content: string | null }[]) {
      if (!map.has(row.conversation_id) && row.content?.trim()) {
        map.set(row.conversation_id, row.content.trim());
      }
    }
    return map;
  }, []);

  const loadConversations = useCallback(
    async (opts?: { manual?: boolean }) => {
      if (authLoading) return;
      if (!user) return;

      const manual = opts?.manual ?? false;
      if (manual) setRefreshingList(true);

      if (!companyId) {
        setListReady(true);
        setConversations([]);
        setListError('A sua conta não tem empresa vinculada. Peça ao administrador para associar company_id no perfil.');
        if (manual) setRefreshingList(false);
        return;
      }

      try {
        let rows = await fetchWaLinkConversations(
          async (select, filterByCompany) => {
            let query = supabaseZaptro.from('whatsapp_conversations').select(select);
            if (filterByCompany && inboxCompanyIds.length > 0) {
              query =
                inboxCompanyIds.length === 1
                  ? query.eq('company_id', inboxCompanyIds[0]!)
                  : query.in('company_id', inboxCompanyIds);
            }
            return query
              .order('last_message_at', {
                ascending: false,
                nullsFirst: false,
              })
              .order('updated_at', { ascending: false })
              .limit(200);
          },
          companyId,
        );

        rows = await enrichWaLinkConversationPreviews(rows, fetchMessagePreviews);

        const readMap = readWaLinkReadAtMap();
        const unreadMap = await fetchWaLinkUnreadByConversation(
          rows.map((r) => r.id),
          readMap,
        );
        applyWaLinkUnreadCounts(rows, unreadMap, selectedIdRef.current);

        setConversations((prev) => {
          // Evita re-render/piscar quando a lista não mudou materialmente.
          if (prev.length === rows.length && prev.every((p, i) => p.id === rows[i]?.id && p.updated_at === rows[i]?.updated_at && p.last_message === rows[i]?.last_message && (p.unread_count ?? 0) === (rows[i]?.unread_count ?? 0))) {
            return prev;
          }
          return rows;
        });
        setListError(null);
        setSelectedId((prev) => (prev && rows.some((r) => r.id === prev) ? prev : null));
      } catch (e) {
        const msg = formatWaLinkInboxError(e);
        if (manual || conversations.length === 0) {
          setListError(msg);
          if (conversations.length === 0) setConversations([]);
        } else {
          console.warn('[wa-link-inbox] refresh silencioso:', msg);
        }
      } finally {
        setListReady(true);
        if (manual) setRefreshingList(false);
      }
    },
    [authLoading, companyId, conversations.length, fetchMessagePreviews, inboxCompanyIds, user],
  );

  const scheduleLoadConversations = useCallback(
    (opts?: { manual?: boolean; reason?: string }) => {
      const manual = opts?.manual ?? false;
      const now = Date.now();
      const minGap = manual ? 0 : 900;
      const elapsed = now - lastLoadAtRef.current;
      if (loadTimerRef.current) window.clearTimeout(loadTimerRef.current);
      loadTimerRef.current = window.setTimeout(() => {
        lastLoadAtRef.current = Date.now();
        void loadConversations({ manual });
      }, Math.max(0, minGap - elapsed));
    },
    [loadConversations],
  );

  const loadMessages = useCallback(async (conversationId: string) => {
    messagesForIdRef.current = conversationId;
    if (isWhatsappMirrorContactId(conversationId)) {
      setMessages([]);
      return;
    }
    try {
      const { data, error } = await supabaseZaptro
        .from('whatsapp_messages')
        .select(
          'id,conversation_id,content,message_type,media_url,media_mime_type,media_file_name,direction,created_at,from_number,to_number,is_edited,is_deleted,reaction,location_lat,location_lng,contact_vcard',
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(500);
      if (error) throw error;
      if (messagesForIdRef.current !== conversationId) return;
      const loaded = (data as WaLinkMessage[]) || [];
      setMessages(loaded);

      const lastInbound = [...loaded].reverse().find((m) => String(m.direction).toLowerCase() === 'in');
      const markAt = lastInbound?.created_at ?? loaded[loaded.length - 1]?.created_at;
      if (markAt) {
        markWaLinkConversationRead(conversationId, markAt);
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c)),
        );
      }

      const curr =
        conversations.find((c) => c.id === conversationId) ||
        (ephemeralChat?.id === conversationId ? ephemeralChat : null);
      if (curr && !curr.customer_avatar && !isWhatsappMirrorContactId(conversationId)) {
        fetchContactProfilePic(instanceName, curr.sender_number).then(async (url) => {
          if (url) {
            await supabaseZaptro.from('whatsapp_conversations').update({ customer_avatar: url }).eq('id', conversationId);
            setConversations((prev) =>
              prev.map((c) => (c.id === conversationId ? { ...c, customer_avatar: url } : c)),
            );
          }
        });
      }
    } catch (err) {
      console.warn('[wa-link] load messages error:', err);
    }
  }, [conversations, ephemeralChat, instanceName]);

  useEffect(() => {
    if (waConnected) return;
    setEphemeralChat(null);
    setSelectedId((prev) => (prev && isWhatsappMirrorContactId(prev) ? null : prev));
  }, [waConnected]);

  useEffect(() => {
    if (companyId && instanceName) {
      markWaLinkSessionConnected(instanceName, session.phone, companyId);
    }
  }, [companyId, instanceName, session.phone]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    void loadConversations();
    void activateWaLinkInboxDirect(instanceName, companyId)
      .then((res) => {
        console.log('[wa-link] Webhook activated:', res);
      })
      .catch((e) => {
        console.warn('[wa-link] activate webhook error:', e);
      });
  }, [loadConversations, instanceName, companyId]);

  useEffect(() => {
    if (!selectedId) {
      messagesForIdRef.current = null;
      setMessages([]);
      return;
    }
    void loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    // Removido if (!user) return; para permitir real-time no guest mode

    const channel = supabaseZaptro
      .channel(`wa-link-inbox-${companyId || instanceName || 'guest'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, (payload) => {
        scheduleLoadConversations({ reason: 'conversations change' });
        if (payload.eventType === 'UPDATE' && payload.new && typeof payload.new === 'object') {
          const row = payload.new as WaLinkConversation & { metadata?: unknown; company_id?: string };
          if (companyId && row.company_id === companyId && shouldAutoPromoteWaLinkPayment(row)) {
            void promoteWaLinkToClient({
              companyId,
              conversationId: row.id,
              phone: row.sender_number,
              name: row.sender_name ?? undefined,
              source: 'wa_payment',
            });
          }
          const escalatedAt = readEscalationAt(row.metadata);
          if (escalatedAt && !escalationSeenRef.current.has(`${row.id}:${escalatedAt}`)) {
            escalationSeenRef.current.add(`${row.id}:${escalatedAt}`);
            playWaIncomingMessageSound();
            const label = row.sender_name?.trim() || row.sender_number || 'Cliente';
            showWaDesktopNotificationIfAllowed({
              title: 'IA pediu atendimento humano',
              body: `${label} — conversa na fila${row.department ? ` · ${row.department}` : ''}`,
              tag: `wa-escalation-${row.id}`,
              senderName: label,
            });
          }
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' }, (payload) => {
        const row = payload.new as WaLinkMessage;
        
        // Play notification if it's an inbound message
        if (row.direction === 'in') {
          playWaIncomingMessageSound();
          if (row.conversation_id && companyId) {
            void ensureWaLinkLeadConversation(companyId, row.conversation_id);
          }
          try {
            const conv = conversationsRef.current.find((c) => c.id === row.conversation_id);
            const label = conv?.sender_name?.trim() || conv?.sender_number || 'Cliente';
            const at = row.created_at || new Date().toISOString();
            appendZaptroActivityLog(companyId || 'local-demo', {
              type: 'atendimento',
              actorName: label,
              clientLabel: label,
              action: 'Cliente contactou',
              at,
              actorColor: '#33b679',
              details: [
                `Horário: ${new Date(at).toLocaleString('pt-BR')}`,
                row.content?.trim() ? row.content.trim().slice(0, 120) : null,
              ]
                .filter(Boolean)
                .join(' · '),
            });
          } catch {
            /* ignore */
          }
          if (document.hidden || row.conversation_id !== selectedId) {
            showWaDesktopNotificationIfAllowed({
              title: 'Nova mensagem no WhatsApp',
              body: String(row.content || 'Mensagem recebida'),
              tag: `wa-msg-${row.id}`,
            });
          }
          if (row.conversation_id !== selectedId) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === row.conversation_id
                  ? { ...c, unread_count: (c.unread_count ?? 0) + 1 }
                  : c,
              ),
            );
          }
        }

        if (row.conversation_id === selectedId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            // Remove "optimistic" placeholder if this looks like the same outbound message.
            const next =
              row.direction === 'out' && row.content
                ? prev.filter((m) => {
                    if (!m.id.startsWith('optimistic-')) return true;
                    if (m.conversation_id !== row.conversation_id) return true;
                    if (m.direction !== 'out') return true;
                    if (!m.content) return true;
                    const sameText = m.content.trim() === row.content?.trim();
                    const dt = Math.abs(new Date(m.created_at).getTime() - new Date(row.created_at).getTime());
                    return !(sameText && dt < 45_000);
                  })
                : prev;
            return [...next, row];
          });
        }
        // Atualiza a lista localmente (sem recarregar tudo) para evitar flicker.
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === row.conversation_id);
          const preview =
            (typeof row.content === 'string' && row.content.trim()) ||
            (row.message_type ? `[${row.message_type}]` : null) ||
            null;
          const nextUpdated = row.created_at || new Date().toISOString();
          if (idx === -1) return prev;
          const updated = {
            ...prev[idx]!,
            last_message: preview ?? prev[idx]!.last_message,
            updated_at: nextUpdated,
          };
          const next = [updated, ...prev.filter((_, i) => i !== idx)];
          return next;
        });

        // Recarrega em background com throttle, para garantir consistência.
        scheduleLoadConversations({ reason: 'message insert' });
      })
      .subscribe();

    const poll = window.setInterval(() => {
      scheduleLoadConversations({ reason: 'poll' });
    }, 18000);

    return () => {
      window.clearInterval(poll);
      if (loadTimerRef.current) window.clearTimeout(loadTimerRef.current);
      void supabaseZaptro.removeChannel(channel);
    };
  }, [companyId, instanceName, scheduleLoadConversations, selectedId, user]);

  const openMirrorChat = useCallback((phone: string, name?: string | null) => {
    const digits = phone.replace(/\D/g, '');
    if (!digits) return;
    const row: WaLinkConversation = {
      id: `wa-mirror-${digits}`,
      sender_number: digits,
      sender_name: name?.trim() || null,
      last_message: null,
      updated_at: new Date().toISOString(),
    };
    setEphemeralChat(row);
    setSelectedId(row.id);
  }, []);

  const selectConversation = useCallback((conversationId: string | null) => {
    if (conversationId && !isWhatsappMirrorContactId(conversationId)) {
      setEphemeralChat(null);
    }
    setSelectedId(conversationId);
    if (!conversationId) return;
    markWaLinkConversationRead(conversationId);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setConversations((prev) => {
      const ids = prev.map((c) => c.id);
      markAllWaLinkConversationsRead(ids);
      return prev.map((c) => ({ ...c, unread_count: 0 }));
    });
  }, []);

  const sendTextToConversation = useCallback(
    async (conversation: WaLinkConversation, text: string) => {
      if (!conversation.sender_number || !text.trim()) return;
      if (!canReplyToConversation(conversation)) {
        throw new Error('Esta conversa está a ser atendida por outro colaborador.');
      }
      if (!conversation.assigned_to?.trim() && profile?.id && !isWhatsappMirrorContactId(conversation.id)) {
        await claimAttendance(conversation.id);
      }
      setSending(true);
      const nowIso = new Date().toISOString();
      const optimisticId = `optimistic-${crypto.randomUUID()}`;
      const optimistic: WaLinkMessage = {
        id: optimisticId,
        conversation_id: conversation.id,
        content: text.trim(),
        direction: 'out',
        created_at: nowIso,
        from_number: null,
        to_number: conversation.sender_number,
        message_type: 'text',
      };
      if (selectedIdRef.current === conversation.id) {
        setMessages((prev) => (prev.some((m) => m.id === optimisticId) ? prev : [...prev, optimistic]));
      }
      // Atualiza preview imediatamente (sem reload).
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversation.id);
        if (idx === -1) return prev;
        const updated = { ...prev[idx]!, last_message: text.trim(), updated_at: nowIso };
        return [updated, ...prev.filter((_, i) => i !== idx)];
      });
      try {
        const { data: auth } = await supabaseZaptro.auth.getSession();
        const hasJwt = Boolean(auth.session?.access_token);
        
        let sent = false;
        let lastErr: any = null;

        // 1) Se a preferência for usar a Edge Function (Supabase Cloud)
        if (hasJwt && waLinkShouldUseEdge(hasJwt)) {
          try {
            await sendEdgeMessage(conversation.sender_number, text.trim(), instanceName);
            sent = true;
          } catch (e) {
            console.warn('[wa-link] Edge send failed, trying direct local proxy fallback:', e);
            lastErr = e;
          }
        }

        // 2) Se não foi enviado (ou a preferência era o envio direto)
        if (!sent) {
          try {
            await sendEvolutionText(instanceName, conversation.sender_number, text.trim());
            sent = true;
          } catch (e) {
            console.warn('[wa-link] Direct local proxy send failed:', e);
            lastErr = e;
            
            // 3) Se tentou direto primeiro e falhou (ex: erro 502 do proxy do Vite), faz o fallback para o Edge
            if (hasJwt && !waLinkShouldUseEdge(hasJwt)) {
              try {
                console.log('[wa-link] Initiating automatic fallback to Supabase Edge Function...');
                await sendEdgeMessage(conversation.sender_number, text.trim(), instanceName);
                sent = true;
              } catch (edgeErr) {
                console.error('[wa-link] Both send methods failed:', edgeErr);
                lastErr = edgeErr;
              }
            }
          }
        }

        if (!sent) {
          throw lastErr || new Error('Não foi possível enviar a mensagem.');
        }
        // A persistência real deve vir do webhook Evolution → Supabase.
        // Mantemos o item otimista para UI imediata e deixamos o realtime substituir.
        scheduleLoadConversations({ reason: 'send text' });

        // CRM: ao primeiro atendimento (primeiro out), mover lead WhatsApp para "atendimento" e atribuir ao colaborador.
        try {
          const crmId = companyId || 'local-demo';
          const key = `zaptro_crm_kanban_v3_${crmId}`;
          const raw = localStorage.getItem(key);
          const arr = raw ? (JSON.parse(raw) as any[]) : [];
          const phone = zaptroNormWaPhone(conversation.sender_number || '');
          if (phone) {
            const uid = profile?.id || null;
            const uname = profile?.full_name?.trim() || profile?.email?.trim() || 'Colaborador';
            const lead = arr.find((l) => String(l.id || '').startsWith('wa-') && zaptroNormWaPhone(String(l.phone || '')) === phone);
            if (lead && lead.stage === 'novos') {
              lead.stage = 'atendimento';
              lead.assigneeId = uid;
              lead.assigneeName = uname;
              localStorage.setItem(key, JSON.stringify(arr));
            }
          }
        } catch {
          /* ignore */
        }

        // Log de atividades (Agenda)
        try {
          appendZaptroActivityLog(companyId || 'local-demo', {
            type: 'atendimento',
            actorName: profile?.full_name?.trim() || profile?.email?.trim() || 'Atendente',
            actorUserId: profile?.id,
            actorColor: profile?.id ? zaptroCollaboratorColor(profile.id) : undefined,
            clientLabel: conversation.sender_name || conversation.sender_number,
            action: 'Mensagem enviada',
            at: nowIso,
            details: text.trim().slice(0, 140),
          });
        } catch {
          /* ignore */
        }
      } finally {
        setSending(false);
      }
    },
    [canReplyToConversation, claimAttendance, companyId, instanceName, profile?.email, profile?.full_name, profile?.id, scheduleLoadConversations],
  );

  const sendAudioToConversation = useCallback(
    async (conversation: WaLinkConversation, blob: Blob) => {
      if (!conversation.sender_number) return;
      if (!canReplyToConversation(conversation)) {
        throw new Error('Esta conversa está a ser atendida por outro colaborador.');
      }
      if (!conversation.assigned_to?.trim() && profile?.id && !isWhatsappMirrorContactId(conversation.id)) {
        await claimAttendance(conversation.id);
      }
      setSending(true);
      const nowIso = new Date().toISOString();
      const optimisticId = `optimistic-${crypto.randomUUID()}`;
      const objectUrl = URL.createObjectURL(blob);
      const optimistic: WaLinkMessage = {
        id: optimisticId,
        conversation_id: conversation.id,
        content: null,
        direction: 'out',
        created_at: nowIso,
        from_number: null,
        to_number: conversation.sender_number,
        message_type: 'audio',
        media_url: objectUrl,
        mime_type: blob.type || 'audio/webm',
        file_name: `audio-${Date.now()}.webm`,
      };
      if (selectedIdRef.current === conversation.id) {
        setMessages((prev) => (prev.some((m) => m.id === optimisticId) ? prev : [...prev, optimistic]));
      }
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversation.id);
        if (idx === -1) return prev;
        const updated = { ...prev[idx]!, last_message: '[Áudio]', updated_at: nowIso };
        return [updated, ...prev.filter((_, i) => i !== idx)];
      });

      try {
        const dataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => reject(new Error('Falha ao ler áudio.'));
          reader.readAsDataURL(blob);
        });

        const { data: auth } = await supabaseZaptro.auth.getSession();
        const hasJwt = Boolean(auth.session?.access_token);
        if (!hasJwt) throw new Error('Faça login para enviar áudio.');
        await sendEdgeMedia({
          number: conversation.sender_number,
          mediatype: 'audio',
          mimetype: blob.type || 'audio/webm',
          media: dataUri,
          fileName: optimistic.file_name || undefined,
          instance: instanceName,
        });
        scheduleLoadConversations({ reason: 'send audio' });

        try {
          appendZaptroActivityLog(companyId || 'local-demo', {
            type: 'atendimento',
            actorName: profile?.full_name?.trim() || profile?.email?.trim() || 'Atendente',
            clientLabel: conversation.sender_name || conversation.sender_number,
            action: 'Áudio enviado',
            details: 'Mensagem de voz',
          });
        } catch {
          /* ignore */
        }
      } finally {
        setSending(false);
        // objectUrl vai ser substituído pelo realtime; manter por ora para playback imediato.
      }
    },
    [canReplyToConversation, claimAttendance, companyId, instanceName, profile?.email, profile?.full_name, profile?.id, scheduleLoadConversations],
  );

  const sendFileToConversation = useCallback(
    async (conversation: WaLinkConversation, file: File) => {
      if (!conversation.sender_number) return;
      if (!canReplyToConversation(conversation)) {
        throw new Error('Esta conversa está a ser atendida por outro colaborador.');
      }
      if (!conversation.assigned_to?.trim() && profile?.id && !isWhatsappMirrorContactId(conversation.id)) {
        await claimAttendance(conversation.id);
      }
      setSending(true);
      const nowIso = new Date().toISOString();
      const mediatype = mediaTypeFromFile(file);
      const preview =
        mediatype === 'image' ? '[Imagem]' : mediatype === 'video' ? '[Vídeo]' : `[Documento] ${file.name}`;
      try {
        const dataUri = await readFileAsDataUrl(file);
        const { data: auth } = await supabaseZaptro.auth.getSession();
        if (!auth.session?.access_token) throw new Error('Faça login para enviar ficheiros.');
        await sendEdgeMedia({
          number: conversation.sender_number,
          mediatype,
          mimetype: file.type || 'application/octet-stream',
          media: dataUri,
          fileName: file.name,
          instance: instanceName,
        });
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === conversation.id);
          if (idx === -1) return prev;
          const updated = { ...prev[idx]!, last_message: preview, updated_at: nowIso };
          return [updated, ...prev.filter((_, i) => i !== idx)];
        });
        scheduleLoadConversations({ reason: 'file sent' });
      } finally {
        setSending(false);
      }
    },
    [canReplyToConversation, claimAttendance, instanceName, profile?.id, scheduleLoadConversations],
  );

  const sendStickerToConversation = useCallback(
    async (conversation: WaLinkConversation, file: File) => {
      if (!conversation.sender_number) return;
      if (!canReplyToConversation(conversation)) {
        throw new Error('Esta conversa está a ser atendida por outro colaborador.');
      }
      setSending(true);
      const nowIso = new Date().toISOString();
      try {
        const dataUri = await readFileAsDataUrl(file);
        const { data: auth } = await supabaseZaptro.auth.getSession();
        if (!auth.session?.access_token) throw new Error('Faça login para enviar figurinhas.');
        await sendEdgeSticker({
          number: conversation.sender_number,
          sticker: dataUri,
          instance: instanceName,
        });
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === conversation.id);
          if (idx === -1) return prev;
          const updated = { ...prev[idx]!, last_message: '[Figurinha]', updated_at: nowIso };
          return [updated, ...prev.filter((_, i) => i !== idx)];
        });
        scheduleLoadConversations({ reason: 'sticker sent' });
      } finally {
        setSending(false);
      }
    },
    [canReplyToConversation, instanceName, scheduleLoadConversations],
  );

  const sendReply = useCallback(
    async (text: string) => {
      if (!selected) return;
      await sendTextToConversation(selected, text);
    },
    [selected, sendTextToConversation],
  );

  return {
    conversations,
    selected,
    selectedId,
    setSelectedId: selectConversation,
    messages,
    listReady,
    refreshingList,
    sending,
    listError,
    instanceName,
    waConnected,
    companyId,
    authReady: !authLoading && Boolean(user),
    loadConversations,
    scheduleLoadConversations,
    sendReply,
    sendTextToConversation,
    sendAudioToConversation,
    sendFileToConversation,
    sendStickerToConversation,
    markAllAsRead,
    openMirrorChat,
    setEphemeralChat,
    claiming,
    claimAttendance,
    releaseAttendance,
    transferToDepartment,
    transferring,
    canReplyToConversation,
    isAttendanceAdmin,
  };
}
