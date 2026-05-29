import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Check,
  CheckCheck,
  MessageSquare,
  MessageSquarePlus,
  MoreHorizontal,
  MoreVertical,
  Search,
  Send,
  Star,
  Zap,
} from 'lucide-react';
import { supabaseZaptro } from '../../lib/supabase-zaptro';
import { useAuth } from '../../context/AuthContext';
import { isZaptroTenantAdminRole } from '../../utils/zaptroPermissions';
import WaLinkCustomerContextBar from './WaLinkCustomerContextBar';
import { useWaLinkCustomerContext } from './useWaLinkCustomerContext';
import { waLinkListPrimaryLabel, WA_LINK_ROUTES } from './waLinkConfig';
import { useWaLinkInbox, type WaLinkConversation } from './useWaLinkInbox';
import WaLinkContactDrawer from './WaLinkContactDrawer';
import WaLinkNewChatDrawer from './WaLinkNewChatDrawer';
import WaLinkInboxMoreMenu, { type WaLinkMoreMenuAction } from './WaLinkInboxMoreMenu';
import WaLinkAppLockOverlay from './WaLinkAppLockOverlay';
import {
  addWaLinkStarred,
  getWaLinkLockPin,
  isWaLinkAppLocked,
  readWaLinkStarredIds,
  setWaLinkAppLocked,
  setWaLinkLockPin,
  toggleWaLinkStarred,
} from './waLinkInboxPrefs';
import {
  addStarredMessages,
  hideMessages,
  markConversationArchived,
  markConversationCleared,
  readArchivedConversations,
  readClearedConversations,
  readHiddenMessageIds,
  readStarredMessageIds,
  unmarkConversationCleared,
} from './waLinkThreadPrefs';
import WaLinkMessageSelectBar from './WaLinkMessageSelectBar';
import WaLinkForwardDrawer from './WaLinkForwardDrawer';
import WaLinkComposeBar from './WaLinkComposeBar';
import WaLinkStaffDrawer from './WaLinkStaffDrawer';
import WaLinkCreateWaGroupModal from './WaLinkCreateWaGroupModal';
import { useWaLinkContactRoleIndex } from './useWaLinkContactRoleIndex';
import WaLinkMessageBody from './WaLinkMessageBody';
import { normalizePhoneKey, resolveContactRole, roleFilterMatches } from './waLinkContactRoles';
import { buildWaLinkMessageTimeline } from './waLinkMessageTimeline';
import type { WaLinkMessage } from './useWaLinkInbox';
import WaLinkThreadHead from './WaLinkThreadHead';
import WaLinkThreadSearchDrawer from './WaLinkThreadSearchDrawer';
import WaLinkQueueKpiBar from './WaLinkQueueKpiBar';
import WaLinkTransferDrawer from './WaLinkTransferDrawer';
import { computeWaLinkQueueKpis } from './waLinkQueueKpis';
import type { WaLinkThreadMenuAction } from './WaLinkThreadMoreMenu';
import { markWaLinkConversationRead } from './waLinkUnread';
import { blockConversation, readBlockedConversations, unblockConversation } from './waLinkBlockPrefs';
import { useWaLinkDevAuth } from './waLinkDevAuth';
import { listenWaLinkPaymentPromotions, ensureWaLinkLeadConversation } from './waLinkClientLifecycle';
import {
  archiveWaLinkConversations,
  archiveWaLinkOnWhatsapp,
  deleteWaLinkConversations,
  markWaLinkConversationsUnread,
} from './waLinkConversationActions';
import { saveWaLinkAsContact } from './waLinkSaveContact';
import { notifyZaptro } from '../../components/Zaptro/ZaptroNotificationSystem';
import './waLink.css';

const PRIMARY_FILTERS = ['Tudo', 'Minhas', 'Não lidas'] as const;
const MORE_FILTERS = ['Clientes', 'Leads', 'Equipe', 'Contatos', 'Favoritas', 'Grupos'] as const;

type InboxFilter = (typeof PRIMARY_FILTERS)[number] | (typeof MORE_FILTERS)[number];

const WaLinkInboxPage: React.FC = () => {
  useWaLinkDevAuth();
  const navigate = useNavigate();
  const { profile, isMaster } = useAuth();
  const isAdmin = Boolean(isMaster || isZaptroTenantAdminRole(profile?.role));
  const [searchParams] = useSearchParams();
  const deepLinkConvId = searchParams.get('c')?.trim() || null;
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const skipAutoScrollRef = useRef(false);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InboxFilter>('Tudo');
  const [filterMoreOpen, setFilterMoreOpen] = useState(false);
  const filterMoreRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactDrawerOpen, setContactDrawerOpen] = useState(false);
  const [newChatDrawerOpen, setNewChatDrawerOpen] = useState(false);
  const [threadSearchOpen, setThreadSearchOpen] = useState(false);
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);
  const [msgSelectMode, setMsgSelectMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(() => new Set());
  const [highlightMsgId, setHighlightMsgId] = useState<string | null>(null);
  const [clearedConvIds, setClearedConvIds] = useState(() => readClearedConversations());
  const [archivedConvIds, setArchivedConvIds] = useState(() => readArchivedConversations());
  const [hiddenMsgTick, setHiddenMsgTick] = useState(0);
  const [forwardDrawerOpen, setForwardDrawerOpen] = useState(false);
  const [starredMsgIds, setStarredMsgIds] = useState(() => readStarredMessageIds());
  const [starredIds, setStarredIds] = useState<Set<string>>(() => readWaLinkStarredIds());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(() => readBlockedConversations());
  const [selectMode, setSelectMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(() => new Set());
  const [appLocked, setAppLocked] = useState(() => isWaLinkAppLocked());
  const [pinModal, setPinModal] = useState<'create' | 'confirm' | null>(null);
  const [pinDraft, setPinDraft] = useState('');
  const [pinFirst, setPinFirst] = useState('');
  const [transferDrawerOpen, setTransferDrawerOpen] = useState(false);
  const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);

  const {
    conversations,
    selected,
    selectedId,
    setSelectedId,
    messages,
    sending,
    listError,
    loadConversations,
    sendReply,
    sendTextToConversation,
    sendAudioToConversation,
    sendFileToConversation,
    sendStickerToConversation,
    listReady,
    refreshingList,
    authReady,
    markAllAsRead,
    openMirrorChat,
    claiming,
    claimAttendance,
    releaseAttendance,
    transferToDepartment,
    transferring,
    canReplyToConversation,
    companyId,
    instanceName,
  } = useWaLinkInbox();

  const { index: roleIndex } = useWaLinkContactRoleIndex(companyId);

  useEffect(() => {
    return listenWaLinkPaymentPromotions(companyId, () => {
      void loadConversations({ manual: true });
    });
  }, [companyId, loadConversations]);

  const moreFilterActive = (MORE_FILTERS as readonly string[]).includes(filter);

  useEffect(() => {
    if (!filterMoreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (filterMoreRef.current?.contains(e.target as Node)) return;
      setFilterMoreOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [filterMoreOpen]);

  const queueKpis = useMemo(
    () => computeWaLinkQueueKpis(conversations, profile?.id ?? null),
    [conversations, profile?.id],
  );

  const { snapshot: customerSnapshot, assignee } = useWaLinkCustomerContext(selected, companyId);

  const selectedRole = useMemo(
    () => (selected ? resolveContactRole(selected, roleIndex) : null),
    [selected, roleIndex],
  );

  const selectedStaffEntry = useMemo(() => {
    if (!selected) return null;
    const key = normalizePhoneKey(selected.sender_number);
    return key ? roleIndex.byPhone.get(key) ?? null : null;
  }, [selected, roleIndex]);

  const staffAssignedCount = useMemo(() => {
    if (!selectedStaffEntry) return 0;
    return conversations.filter((c) => c.assigned_to === selectedStaffEntry.entityId).length;
  }, [conversations, selectedStaffEntry]);

  const openContactPanel = useCallback(() => {
    if (selectedRole?.isStaff) setStaffDrawerOpen(true);
    else setContactDrawerOpen(true);
  }, [selectedRole?.isStaff]);

  const canReplySelected = selected ? canReplyToConversation(selected) : false;
  const replyBlockedReason =
    selected?.assigned_to && !canReplySelected
      ? 'Atendimento em curso com outro colaborador'
      : blockedIds.has(selected?.id || '')
        ? 'Contato bloqueado'
        : undefined;

  useEffect(() => {
    if (!deepLinkConvId || !listReady) return;
    if (conversations.some((c) => c.id === deepLinkConvId)) {
      setSelectedId(deepLinkConvId);
      return;
    }
    // Suporta deep link por telefone (ex.: /app/conversas?c=5511999999999)
    const digits = deepLinkConvId.replace(/\D/g, '');
    if (digits.length >= 8) {
      const byPhone = conversations.find((c) => String(c.sender_number || '').replace(/\D/g, '') === digits);
      if (byPhone) {
        setSelectedId(byPhone.id);
        return;
      }
      const name = searchParams.get('n')?.trim() || null;
      openMirrorChat(digits, name);
    }
  }, [deepLinkConvId, listReady, conversations, openMirrorChat, searchParams, setSelectedId]);

  useEffect(() => {
    setContactDrawerOpen(false);
    setThreadSearchOpen(false);
    setThreadMenuOpen(false);
    setMsgSelectMode(false);
    setSelectedMsgIds(new Set());
    setHighlightMsgId(null);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !messages.length) return;
    const last = messages[messages.length - 1];
    if (last?.direction === 'in' && clearedConvIds.has(selectedId)) {
      setClearedConvIds(unmarkConversationCleared(selectedId));
    }
  }, [messages, selectedId, clearedConvIds]);

  const visibleMessages = useMemo(() => {
    if (!selectedId || clearedConvIds.has(selectedId)) return [];
    const hidden = readHiddenMessageIds(selectedId);
    return messages.filter((m) => !hidden.has(m.id));
    // hiddenMsgTick força re-render após ocultar mensagens
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick intencional
  }, [messages, selectedId, clearedConvIds, hiddenMsgTick]);

  const messageTimeline = useMemo(
    () => buildWaLinkMessageTimeline(visibleMessages),
    [visibleMessages],
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  useEffect(() => {
    if (!selectedId || msgSelectMode || highlightMsgId || skipAutoScrollRef.current) return;
    const id = window.requestAnimationFrame(() => scrollToBottom('auto'));
    return () => window.cancelAnimationFrame(id);
  }, [selectedId, messageTimeline.length, messages.length, sending, msgSelectMode, highlightMsgId, scrollToBottom]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (archivedConvIds.has(c.id)) return false;
      const roleInfo = resolveContactRole(c, roleIndex);
      if (!roleFilterMatches(filter, c, roleInfo)) return false;
      if (filter === 'Não lidas' && !(c.unread_count && c.unread_count > 0)) return false;
      if (filter === 'Favoritas' && !starredIds.has(c.id)) return false;
      if (filter === 'Minhas' && c.assigned_to !== profile?.id) return false;
      if (!q) return true;
      const name = (c.sender_name || c.sender_number || '').toLowerCase();
      const msg = (c.last_message || '').toLowerCase();
      const role = roleInfo.label.toLowerCase();
      return name.includes(q) || msg.includes(q) || role.includes(q);
    });
  }, [conversations, filter, search, starredIds, archivedConvIds, profile?.id, roleIndex]);

  const handleThreadMenuAction = (action: WaLinkThreadMenuAction) => {
    if (!selected) return;
    switch (action) {
      case 'contact':
        setContactDrawerOpen(true);
        break;
      case 'search':
        setThreadSearchOpen(true);
        break;
      case 'select-messages':
        setMsgSelectMode(true);
        setSelectedMsgIds(new Set());
        break;
      case 'favorite':
        setStarredIds(toggleWaLinkStarred(selected.id));
        break;
      case 'block':
        setBlockedIds((prev) => {
          const isBlocked = prev.has(selected.id);
          const next = isBlocked ? unblockConversation(selected.id) : blockConversation(selected.id);
          return next;
        });
        break;
      case 'add-list':
        navigate(WA_LINK_ROUTES.BROADCASTS);
        break;
      case 'transfer':
        setTransferDrawerOpen(true);
        break;
      case 'save-contact':
        if (companyId && selected) {
          void saveWaLinkAsContact(companyId, selected.id, selected.sender_name || undefined)
            .then(() => notifyZaptro('success', 'Contato', 'Salvo em Contatos.'))
            .catch((e) =>
              notifyZaptro('error', 'Contato', e instanceof Error ? e.message : 'Não foi possível salvar.'),
            );
        }
        break;
      case 'save-lead':
        if (companyId && selected) {
          void ensureWaLinkLeadConversation(companyId, selected.id)
            .then(() => notifyZaptro('success', 'Lead', 'Cadastrado como lead no CRM.'))
            .catch((e) =>
              notifyZaptro('error', 'Lead', e instanceof Error ? e.message : 'Não foi possível cadastrar.'),
            );
        }
        break;
      case 'mark-unread':
        if (selected) {
          void markWaLinkConversationsUnread([selected.id]).then(() => {
            void loadConversations({ manual: true });
            notifyZaptro('success', 'Inbox', 'Marcada como não lida.');
          });
        }
        break;
      case 'archive':
        if (selected) {
          void (async () => {
            await archiveWaLinkOnWhatsapp(conversations, [selected.id], instanceName);
            await archiveWaLinkConversations([selected.id], setArchivedConvIds);
            setSelectedId(null);
            notifyZaptro('success', 'Inbox', 'Conversa arquivada.');
          })();
        }
        break;
      case 'close':
        setSelectedId(null);
        break;
      case 'clear':
        if (confirm('Limpar mensagens desta conversa no ecrã?')) {
          setClearedConvIds(markConversationCleared(selected.id));
          setMsgSelectMode(false);
        }
        break;
      case 'delete':
        if (
          selected &&
          confirm(
            'Apagar esta conversa? Remove do inbox e tenta apagar no WhatsApp. Esta acção não pode ser desfeita.',
          )
        ) {
          void (async () => {
            try {
              const { waErrors } = await deleteWaLinkConversations({
                ids: [selected.id],
                conversations,
                instanceName,
                companyId,
              });
              setSelectedId(null);
              await loadConversations({ manual: true });
              notifyZaptro(
                'success',
                'Inbox',
                waErrors ? 'Apagada aqui. WhatsApp pode não ter respondido — confira no telefone.' : 'Conversa apagada.',
              );
            } catch (e) {
              notifyZaptro('error', 'Inbox', e instanceof Error ? e.message : 'Falha ao apagar.');
            }
          })();
        }
        break;
      default:
        break;
    }
  };

  const jumpToMessage = (messageId: string) => {
    skipAutoScrollRef.current = true;
    setHighlightMsgId(messageId);
    requestAnimationFrame(() => {
      document.getElementById(`wa-msg-${messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    window.setTimeout(() => {
      setHighlightMsgId(null);
      skipAutoScrollRef.current = false;
    }, 2400);
  };

  const renderMessageRow = (m: WaLinkMessage) => {
    const out = String(m.direction).toLowerCase() === 'out';
    const checked = selectedMsgIds.has(m.id);
    const timeLabel = new Date(m.created_at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div
        key={m.id}
        id={`wa-msg-${m.id}`}
        role={msgSelectMode ? 'button' : undefined}
        tabIndex={msgSelectMode ? 0 : undefined}
        className={`wa-conversas-bubble-row${out ? ' wa-conversas-bubble-row--out' : ''}${msgSelectMode ? ' wa-conversas-bubble-row--select' : ''}${checked ? ' wa-conversas-bubble-row--checked' : ''}${highlightMsgId === m.id ? ' wa-conversas-bubble-row--highlight' : ''}`}
        onClick={msgSelectMode ? () => toggleMsgSelection(m.id) : undefined}
        onKeyDown={
          msgSelectMode
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleMsgSelection(m.id);
                }
              }
            : undefined
        }
      >
        {msgSelectMode ? (
          <span className={`wa-conversas-msg-check${checked ? ' is-on' : ''}`} aria-hidden>
            {checked ? <Check size={14} strokeWidth={3} /> : null}
          </span>
        ) : null}
        <div className={`wa-conversas-bubble ${out ? 'out' : 'in'}`}>
          {starredMsgIds.has(m.id) ? (
            <Star size={12} className="wa-conversas-bubble-star" fill="currentColor" aria-hidden />
          ) : null}
          <WaLinkMessageBody message={m} />
          <span className="wa-conversas-bubble-foot">
            <time>{timeLabel}</time>
            {out ? <CheckCheck size={14} strokeWidth={2.2} className="wa-conversas-bubble-ticks" aria-hidden /> : null}
          </span>
        </div>
      </div>
    );
  };

  const toggleMsgSelection = (id: string) => {
    setSelectedMsgIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitMsgSelectMode = () => {
    setMsgSelectMode(false);
    setSelectedMsgIds(new Set());
  };

  const selectedMessages = useMemo(() => {
    return messages
      .filter((m) => selectedMsgIds.has(m.id))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, selectedMsgIds]);

  const deleteSelectedMessages = () => {
    if (!selected || selectedMsgIds.size === 0) return;
    hideMessages(selected.id, [...selectedMsgIds]);
    setHiddenMsgTick((n) => n + 1);
    exitMsgSelectMode();
  };

  const starSelectedMessages = () => {
    if (selectedMsgIds.size === 0) return;
    setStarredMsgIds(addStarredMessages([...selectedMsgIds]));
    exitMsgSelectMode();
  };

  const copySelectedMessages = () => {
    const text = selectedMessages
      .map((m) => m.content?.trim())
      .filter(Boolean)
      .join('\n\n');
    if (!text) return;
    void navigator.clipboard.writeText(text).then(() => exitMsgSelectMode());
  };

  const forwardToConversation = async (targetId: string) => {
    const target = conversations.find((c) => c.id === targetId);
    if (!target || !selected || selectedMessages.length === 0) return;
    const body = selectedMessages
      .map((m) => m.content?.trim())
      .filter(Boolean)
      .join('\n\n');
    if (!body) return;
    const from = waLinkListPrimaryLabel(selected.sender_name, selected.sender_number);
    const text = `↪ Encaminhado de ${from}:\n\n${body}`;
    try {
      await sendTextToConversation(target, text);
      setSelectedId(targetId);
      exitMsgSelectMode();
      setForwardDrawerOpen(false);
    } catch (err) {
      alert('Erro ao encaminhar:\n' + String(err));
    }
  };

  const handleMoreMenuAction = (action: WaLinkMoreMenuAction) => {
    switch (action) {
      case 'broadcasts':
        navigate(WA_LINK_ROUTES.BROADCASTS);
        break;
      case 'starred':
        setFilter('Favoritas');
        setSearch('');
        break;
      case 'select':
        setSelectMode(true);
        setBulkSelected(new Set());
        break;
      case 'mark-all-read':
        markAllAsRead();
        break;
      case 'app-lock': {
        const existing = getWaLinkLockPin();
        if (!existing) {
          setPinDraft('');
          setPinFirst('');
          setPinModal('create');
        } else {
          setWaLinkAppLocked(true);
          setAppLocked(true);
        }
        break;
      }
      case 'disconnect':
        void supabaseZaptro.auth.signOut().then(() => {
          navigate(WA_LINK_ROUTES.LOGIN);
        });
        break;
      default:
        break;
    }
  };

  const submitPinSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinDraft.length !== 4) return;
    if (pinModal === 'create') {
      setPinFirst(pinDraft);
      setPinDraft('');
      setPinModal('confirm');
      return;
    }
    if (pinDraft !== pinFirst) {
      alert('Os PINs não coincidem. Tente novamente.');
      setPinDraft('');
      setPinFirst('');
      setPinModal('create');
      return;
    }
    setWaLinkLockPin(pinDraft);
    setPinModal(null);
    setWaLinkAppLocked(true);
    setAppLocked(true);
    setPinDraft('');
    setPinFirst('');
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setBulkSelected(new Set());
  };

  const toggleBulkItem = (id: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkMarkRead = () => {
    for (const id of bulkSelected) markWaLinkConversationRead(id);
    void loadConversations({ manual: true });
    exitSelectMode();
  };

  const bulkMarkUnread = () => {
    const ids = [...bulkSelected];
    void markWaLinkConversationsUnread(ids).then(() => {
      void loadConversations({ manual: true });
      exitSelectMode();
      notifyZaptro('success', 'Inbox', `${ids.length} marcada(s) como não lida(s).`);
    });
  };

  const bulkFavorite = () => {
    const next = addWaLinkStarred([...bulkSelected]);
    setStarredIds(next);
    exitSelectMode();
  };

  const bulkArchive = () => {
    const ids = [...bulkSelected];
    void (async () => {
      await archiveWaLinkOnWhatsapp(conversations, ids, instanceName);
      await archiveWaLinkConversations(ids, setArchivedConvIds);
      if (selectedId && ids.includes(selectedId)) setSelectedId(null);
      exitSelectMode();
      notifyZaptro('success', 'Inbox', `${ids.length} conversa(s) arquivada(s).`);
    })();
  };

  const bulkDelete = () => {
    if (bulkSelected.size === 0) return;
    if (
      !confirm(
        `Apagar ${bulkSelected.size} conversa(s)? Remove do inbox e tenta apagar no WhatsApp. Esta acção não pode ser desfeita.`,
      )
    ) {
      return;
    }
    const ids = [...bulkSelected];
    void (async () => {
      try {
        const { waErrors } = await deleteWaLinkConversations({
          ids,
          conversations,
          instanceName,
          companyId,
        });
        if (selectedId && ids.includes(selectedId)) setSelectedId(null);
        await loadConversations({ manual: true });
        exitSelectMode();
        notifyZaptro(
          'success',
          'Inbox',
          waErrors
            ? 'Apagadas aqui. Algumas podem permanecer no WhatsApp — confira no telefone.'
            : `${ids.length} conversa(s) apagada(s).`,
        );
      } catch (e) {
        notifyZaptro('error', 'Inbox', e instanceof Error ? e.message : 'Falha ao apagar.');
      }
    })();
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    void sendReply(text)
      .then(() => {
        setDraft('');
        window.requestAnimationFrame(() => scrollToBottom('smooth'));
      })
      .catch((err) => {
        alert('Erro ao enviar mensagem:\\n' + String(err));
      });
  };

  const handleSendAudio = useCallback(
    async (blob: Blob) => {
      if (!selected) return;
      await sendAudioToConversation(selected, blob);
      window.requestAnimationFrame(() => scrollToBottom('smooth'));
    },
    [selected, sendAudioToConversation, scrollToBottom],
  );

  const handleSendFile = useCallback(
    async (file: File) => {
      if (!selected) return;
      await sendFileToConversation(selected, file);
      window.requestAnimationFrame(() => scrollToBottom('smooth'));
    },
    [selected, sendFileToConversation, scrollToBottom],
  );

  const handleSendSticker = useCallback(
    async (file: File) => {
      if (!selected) return;
      await sendStickerToConversation(selected, file);
      window.requestAnimationFrame(() => scrollToBottom('smooth'));
    },
    [selected, sendStickerToConversation, scrollToBottom],
  );

  const showEmptyList = listReady && filtered.length === 0 && !listError;

  return (
    <div className="wa-conversas">
      {appLocked ? (
        <WaLinkAppLockOverlay onUnlocked={() => setAppLocked(false)} />
      ) : null}
      {pinModal ? (
        <div className="wa-pin-modal-root" role="presentation">
          <button
            type="button"
            className="wa-pin-modal-backdrop"
            aria-label="Fechar"
            onClick={() => {
              setPinModal(null);
              setPinDraft('');
              setPinFirst('');
            }}
          />
          <form className="wa-pin-modal" onSubmit={submitPinSetup}>
            <h3>{pinModal === 'create' ? 'Definir PIN' : 'Confirmar PIN'}</h3>
            <p>
              {pinModal === 'create'
                ? 'Crie um PIN de 4 dígitos para bloquear o inbox.'
                : 'Digite o mesmo PIN novamente.'}
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinDraft}
              onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
              autoFocus
            />
            <button type="submit" disabled={pinDraft.length !== 4}>
              {pinModal === 'create' ? 'Continuar' : 'Activar bloqueio'}
            </button>
          </form>
        </div>
      ) : null}
      <WaLinkNewChatDrawer
        open={newChatDrawerOpen}
        conversations={conversations}
        listReady={listReady}
        listError={listError}
        refreshingList={refreshingList}
        onRefresh={() => void loadConversations({ manual: true })}
        onClose={() => setNewChatDrawerOpen(false)}
        onSelectConversation={setSelectedId}
        onOpenMirrorChat={openMirrorChat}
        onOpenBroadcasts={() => navigate(WA_LINK_ROUTES.BROADCASTS)}
        onCreateGroup={() => {
          setNewChatDrawerOpen(false);
          setGroupModalOpen(true);
        }}
        roleIndex={roleIndex}
        onClientRegistered={() => void loadConversations({ manual: true })}
      />

      {companyId ? (
        <WaLinkCreateWaGroupModal
          open={groupModalOpen}
          companyId={companyId}
          instanceName={instanceName}
          roleIndex={roleIndex}
          onClose={() => setGroupModalOpen(false)}
          onCreated={() => void loadConversations({ manual: true })}
        />
      ) : null}

      <div className="wa-conversas-layout">
        <aside className="wa-conversas-list-panel">
          <div className="wa-conversas-list-head">
            <button
              type="button"
              className="wa-conversas-list-title-btn"
              onClick={() => setNewChatDrawerOpen(true)}
              title="Nova conversa"
            >
              <strong>Mensagens</strong>
              <span className="wa-conversas-live">
                <span className="wa-conversas-live-dot" />
                LIVE
              </span>
            </button>
            <div className="wa-conversas-list-head-actions">
              <button
                type="button"
                className="wa-conversas-icon-btn"
                title="Nova conversa"
                onClick={() => setNewChatDrawerOpen(true)}
              >
                <MessageSquarePlus size={20} strokeWidth={1.75} />
              </button>
              <div className="wa-conversas-more-wrap">
                <button
                  ref={moreBtnRef}
                  type="button"
                  className="wa-conversas-icon-btn"
                  title="Mais opções"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <MoreVertical size={20} strokeWidth={1.75} />
                </button>
                <WaLinkInboxMoreMenu
                  open={menuOpen}
                  onClose={() => setMenuOpen(false)}
                  onAction={handleMoreMenuAction}
                  anchorRef={moreBtnRef}
                />
              </div>
            </div>
          </div>

          <div className="wa-conversas-search">
            <Search size={18} className="wa-conversas-search-icon" strokeWidth={2} />
            <input
              type="search"
              placeholder="Pesquisar conversas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="wa-conversas-filters">
            <div className="wa-conversas-filters-row">
              {PRIMARY_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`wa-conversas-chip ${filter === f ? 'active' : ''}`}
                  onClick={() => {
                    setFilter(f);
                    setFilterMoreOpen(false);
                  }}
                >
                  {f}
                </button>
              ))}
              <div className="wa-conversas-filters-more-wrap" ref={filterMoreRef}>
                <button
                  type="button"
                  className={`wa-conversas-chip wa-conversas-chip--more ${filterMoreOpen || moreFilterActive ? 'active' : ''}`}
                  title={moreFilterActive ? `Filtro: ${filter}` : 'Mais filtros'}
                  aria-label="Mais filtros"
                  aria-expanded={filterMoreOpen}
                  onClick={() => setFilterMoreOpen((open) => !open)}
                >
                  <MoreHorizontal size={16} strokeWidth={2.2} aria-hidden />
                </button>
                {filterMoreOpen ? (
                  <div className="wa-conversas-filters-popover" role="menu">
                    {MORE_FILTERS.map((f) => (
                      <button
                        key={f}
                        type="button"
                        role="menuitem"
                        className={`wa-conversas-filters-popover-item${filter === f ? ' is-active' : ''}`}
                        onClick={() => {
                          setFilter(f);
                          setFilterMoreOpen(false);
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <WaLinkQueueKpiBar kpis={queueKpis} />

          <div className="wa-conversas-list-divider" aria-hidden />

          <div className="wa-conversas-list-scroll">
            {listError && filtered.length === 0 ? (
              <div className="wa-conversas-empty">
                <p className="wa-conversas-error">{listError}</p>
                <small>
                  {authReady
                    ? 'Webhook: evolution-webhook no Supabase. Envie msg de outro telefone e actualize.'
                    : 'Aguarde login automático (dev) ou entre com a conta do .env.local.'}
                </small>
              </div>
            ) : showEmptyList ? (
              <div className="wa-conversas-empty wa-conversas-empty--inbox">
                <span className="wa-conversas-empty-icon" aria-hidden>
                  <MessageSquare size={28} strokeWidth={1.5} />
                </span>
                <p className="wa-conversas-empty-title">Nenhuma conversa ativa</p>
                <p className="wa-conversas-empty-sub">
                  O seu inbox está limpo. Novas mensagens aparecerão aqui em tempo real.
                </p>
                {filter === 'Favoritas' ? (
                  <p className="wa-conversas-empty-hint">
                    Favorite conversas pelo menu «Selecionar conversas» ou na lista.
                  </p>
                ) : filter === 'Grupos' ? (
                  <p className="wa-conversas-empty-hint">
                    Crie um grupo da equipa em «Nova conversa» → «Novo grupo».
                  </p>
                ) : filter === 'Equipe' ? (
                  <p className="wa-conversas-empty-hint">
                    Cadastre motoristas e ajudantes com telefone para conversar como equipe.
                  </p>
                ) : null}
              </div>
            ) : (
              <ul className="wa-conversas-items">
                {filtered.map((c) => {
                  const unread = Math.max(0, c.unread_count ?? 0);
                  const hasUnread = unread > 0;
                  const roleInfo = resolveContactRole(c, roleIndex);
                  const timeLabel = c.updated_at
                    ? new Date(c.updated_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '';

                  const isBulkChecked = bulkSelected.has(c.id);
                  const isStarred = starredIds.has(c.id);

                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`wa-conversas-item ${selectedId === c.id && !selectMode ? 'active' : ''}${hasUnread ? ' wa-conversas-item--unread' : ''}${selectMode ? ' wa-conversas-item--select' : ''}${isBulkChecked ? ' wa-conversas-item--checked' : ''}`}
                        onClick={() => {
                          if (selectMode) toggleBulkItem(c.id);
                          else setSelectedId(c.id);
                        }}
                      >
                        {selectMode ? (
                          <span className={`wa-conversas-select-check${isBulkChecked ? ' is-on' : ''}`} aria-hidden>
                            {isBulkChecked ? <Check size={14} strokeWidth={3} /> : null}
                          </span>
                        ) : null}
                        <div className="wa-conversas-avatar">
                          {c.customer_avatar ? (
                            <img src={c.customer_avatar} alt="" />
                          ) : (
                            (waLinkListPrimaryLabel(c.sender_name, c.sender_number) || '?')[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="wa-conversas-item-body">
                          <div className="wa-conversas-item-row">
                            <span className="name">
                              <span className="wa-conversas-name-text">
                                {waLinkListPrimaryLabel(c.sender_name, c.sender_number)}
                              </span>
                              <span className="wa-conversas-role-badge">{roleInfo.label}</span>
                              {isStarred && !selectMode ? (
                                <Star size={12} className="wa-conversas-star" fill="currentColor" aria-hidden />
                              ) : null}
                            </span>
                            {timeLabel ? (
                              <span className={`time${hasUnread ? ' time--alert' : ''}`}>{timeLabel}</span>
                            ) : null}
                          </div>
                          <div className="wa-conversas-item-row wa-conversas-item-row--foot">
                            <p className="preview">
                              <CheckCheck size={16} strokeWidth={2.2} className="wa-conversas-tick" aria-hidden />
                              <span>{c.last_message || 'Nova conversa'}</span>
                            </p>
                            {hasUnread ? (
                              <span className="wa-conversas-unread" aria-label={`${unread} não lidas`}>
                                {unread > 99 ? '99+' : unread}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {selectMode ? (
            <div className="wa-conversas-select-bar">
              <span>{bulkSelected.size} selecionada(s)</span>
              <div className="wa-conversas-select-bar-actions">
                <button type="button" onClick={bulkArchive} disabled={bulkSelected.size === 0}>
                  Arquivar
                </button>
                <button type="button" onClick={bulkFavorite} disabled={bulkSelected.size === 0}>
                  Favoritar
                </button>
                <button type="button" onClick={bulkMarkRead} disabled={bulkSelected.size === 0}>
                  Marcar lidas
                </button>
                <button type="button" onClick={bulkMarkUnread} disabled={bulkSelected.size === 0}>
                  Não lidas
                </button>
                <button
                  type="button"
                  className="wa-conversas-select-danger"
                  onClick={bulkDelete}
                  disabled={bulkSelected.size === 0}
                >
                  Apagar
                </button>
                <button type="button" className="wa-conversas-select-cancel" onClick={exitSelectMode}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}
        </aside>

        <section className="wa-conversas-main">
          {selected ? (
            <>
              <WaLinkThreadHead
                conversation={selected}
                assignee={assignee}
                isStarred={starredIds.has(selected.id)}
                isBlocked={blockedIds.has(selected.id)}
                threadMenuOpen={threadMenuOpen}
                onOpenContact={openContactPanel}
                onOpenSearch={() => setThreadSearchOpen(true)}
                onThreadMenuOpenChange={setThreadMenuOpen}
                onThreadMenuAction={handleThreadMenuAction}
              />
              <WaLinkStaffDrawer
                open={staffDrawerOpen}
                conversation={selected}
                roleInfo={selectedRole}
                staffEntry={selectedStaffEntry}
                assignedCount={staffAssignedCount}
                onClose={() => setStaffDrawerOpen(false)}
              />
              <WaLinkContactDrawer
                open={contactDrawerOpen}
                conversation={selected}
                companyId={companyId}
                snapshot={customerSnapshot}
                assignee={assignee}
                messages={messages}
                onClose={() => setContactDrawerOpen(false)}
              />
              <WaLinkThreadSearchDrawer
                open={threadSearchOpen}
                messages={messages}
                contactLabel={waLinkListPrimaryLabel(selected.sender_name, selected.sender_number)}
                onClose={() => setThreadSearchOpen(false)}
                onJumpToMessage={jumpToMessage}
              />
              <div className={`wa-conversas-messages${msgSelectMode ? ' wa-conversas-messages--select' : ''}`}>
                <WaLinkCustomerContextBar
                  conversation={selected}
                  snapshot={customerSnapshot}
                  assignee={assignee}
                  currentUserId={profile?.id ?? null}
                  isAdmin={isAdmin}
                  claiming={claiming}
                  transferring={transferring}
                  onClaim={() => void claimAttendance(selected.id)}
                  onRelease={() => void releaseAttendance(selected.id)}
                  onTransfer={() => setTransferDrawerOpen(true)}
                />
                {visibleMessages.length === 0 ? (
                  <p className="wa-conversas-hint">
                    {clearedConvIds.has(selected.id)
                      ? 'Conversa limpa. Novas mensagens aparecerão aqui.'
                      : 'Sem mensagens nesta conversa.'}
                  </p>
                ) : (
                  messageTimeline.map((item) =>
                    item.kind === 'date' ? (
                      <div key={item.key} className="wa-conversas-date-separator" role="separator">
                        {item.label}
                      </div>
                    ) : (
                      renderMessageRow(item.message)
                    ),
                  )
                )}
                <div ref={messagesEndRef} className="wa-conversas-messages-anchor" aria-hidden />
              </div>
              <WaLinkTransferDrawer
                open={transferDrawerOpen}
                conversationLabel={waLinkListPrimaryLabel(selected.sender_name, selected.sender_number)}
                onClose={() => setTransferDrawerOpen(false)}
                onTransfer={(dept) => transferToDepartment(selected.id, dept)}
              />
              <WaLinkForwardDrawer
                open={forwardDrawerOpen}
                conversations={conversations}
                excludeConversationId={selected.id}
                onClose={() => setForwardDrawerOpen(false)}
                onSelect={(id) => void forwardToConversation(id)}
              />
              {msgSelectMode ? (
                <WaLinkMessageSelectBar
                  count={selectedMsgIds.size}
                  disabled={selectedMsgIds.size === 0 || sending}
                  onClose={exitMsgSelectMode}
                  onStar={starSelectedMessages}
                  onDelete={deleteSelectedMessages}
                  onForward={() => setForwardDrawerOpen(true)}
                  onCopy={copySelectedMessages}
                />
              ) : (
              <WaLinkComposeBar
                value={draft}
                sending={sending}
                onChange={setDraft}
                onSubmit={handleSend}
                onSendAudio={handleSendAudio}
                onSendFile={handleSendFile}
                onSendSticker={handleSendSticker}
                disabled={Boolean(replyBlockedReason) || blockedIds.has(selected.id)}
                disabledReason={replyBlockedReason}
              />
              )}
            </>
          ) : (
            <div className="wa-conversas-welcome">
              <div className="wa-conversas-welcome-icon">
                <Zap size={56} color="#D9FF00" fill="#D9FF00" />
              </div>
              <h2>Zaptro Premium Chat</h2>
              <p>Selecione uma conversa para começar a gerir os atendimentos em tempo real.</p>
            </div>
                    )}
            </section>
      </div>
    </div>
  );
};

export default WaLinkInboxPage;
