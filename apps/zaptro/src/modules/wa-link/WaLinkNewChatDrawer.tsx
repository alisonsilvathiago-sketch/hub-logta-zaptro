import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  LayoutGrid,
  Loader2,
  Search,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notifyZaptro } from '../../components/Zaptro/ZaptroNotificationSystem';
import { loadWhatsappMirrorContacts } from '../../lib/loadWhatsappMirrorContacts';
import { isWhatsappMirrorContactId, type WhatsappMirrorContact } from '../../lib/zaptroWhatsappMirrorContacts';
import type { WaLinkConversation } from './waLinkInboxDb';
import { formatWaPhoneLine } from './waLinkConfig';
import {
  mergeMirrorWithConversations,
  waUnifiedContactLabel,
} from './waLinkUnifiedContacts';
import {
  resolveContactRole,
  type WaLinkContactRoleIndex,
} from './waLinkContactRoles';
import {
  normalizeWaPhoneDigits,
  registerWaLinkClient,
  type WaLinkDocType,
} from './waLinkRegisterClient';
import { resolveWaLinkInboxCompanyId } from '../../lib/waLinkInboxActivate';
import { readWaLinkSession } from './waLinkConfig';

type Props = {
  open: boolean;
  conversations: WaLinkConversation[];
  listReady: boolean;
  listError: string | null;
  refreshingList: boolean;
  onRefresh: () => void;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
  onOpenMirrorChat?: (phone: string, name?: string | null) => void;
  onOpenBroadcasts: () => void;
  onCreateGroup?: () => void;
  roleIndex?: WaLinkContactRoleIndex;
  onClientRegistered?: (conversationId: string) => void;
};

type PanelView = 'list' | 'new-contact';
type SortMode = 'alpha' | 'recent';

function contactDisplayName(c: WaLinkConversation): string {
  return waUnifiedContactLabel(c);
}

function contactSubtitle(c: WaLinkConversation): string | null {
  const preview = c.last_message?.trim();
  if (preview) return preview;
  if (c.sender_number) return formatWaPhoneLine(c.sender_number);
  return null;
}

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

function contactRowKey(c: WaLinkConversation): string {
  return normalizePhoneDigits(c.sender_number) || c.id;
}

function sortKey(label: string): string {
  const t = label.trim();
  if (!t) return '#';
  const first = t[0]!.toUpperCase();
  if (/[0-9+]/.test(first)) return '#';
  if (/[A-ZÀ-ÖØ-öø-ÿ]/.test(first)) return first;
  return '#';
}

function groupContacts(
  items: WaLinkConversation[],
  sortMode: SortMode,
): { letter: string; items: WaLinkConversation[] }[] {
  const sorted =
    sortMode === 'recent'
      ? [...items].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )
      : [...items].sort((a, b) =>
          contactDisplayName(a).localeCompare(contactDisplayName(b), 'pt-BR', { sensitivity: 'base' }),
        );

  if (sortMode === 'recent') {
    return [{ letter: 'Recentes', items: sorted }];
  }

  const byLetter = new Map<string, WaLinkConversation[]>();
  for (const c of sorted) {
    const letter = sortKey(contactDisplayName(c));
    const list = byLetter.get(letter) ?? [];
    list.push(c);
    byLetter.set(letter, list);
  }
  const letters = Array.from(byLetter.keys()).sort((a, b) => {
    if (a === '#') return -1;
    if (b === '#') return 1;
    return a.localeCompare(b, 'pt-BR');
  });
  return letters.map((letter) => ({ letter, items: byLetter.get(letter)! }));
}

const WaLinkNewChatDrawer: React.FC<Props> = ({
  open,
  conversations,
  listReady,
  listError,
  refreshingList,
  onRefresh,
  onClose,
  onSelectConversation,
  onOpenMirrorChat,
  onOpenBroadcasts,
  onCreateGroup,
  roleIndex,
  onClientRegistered,
}) => {
  const emptyRoleIndex = useMemo(() => ({ byPhone: new Map() }), []);
  const roles = roleIndex ?? emptyRoleIndex;
  const { profile } = useAuth();
  const waSession = readWaLinkSession();
  const companyId = resolveWaLinkInboxCompanyId(profile, waSession.companyId, profile?.id);

  const [query, setQuery] = useState('');
  const [panelView, setPanelView] = useState<PanelView>('list');
  const [sortMode, setSortMode] = useState<SortMode>('alpha');
  const [mirrorRows, setMirrorRows] = useState<WhatsappMirrorContact[]>([]);
  const [mirrorLoading, setMirrorLoading] = useState(false);
  const [mirrorHint, setMirrorHint] = useState<string | null>(null);
  const mirrorLoadedRef = useRef(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [docType, setDocType] = useState<WaLinkDocType>('cnpj');
  const [newDocument, setNewDocument] = useState('');
  const [newContactHint, setNewContactHint] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  const contacts = useMemo(
    () => mergeMirrorWithConversations(mirrorRows, conversations),
    [mirrorRows, conversations],
  );

  const loadMirrorContacts = useCallback(async (opts?: { silent?: boolean }) => {
    if (!companyId) {
      return;
    }
    if (!opts?.silent) setMirrorLoading(true);
    try {
      const result = await loadWhatsappMirrorContacts({
        companyId,
        userId: profile?.id,
      });
      setMirrorRows(result.connected ? result.contacts : []);
      setMirrorHint(result.hint ?? null);
    } catch {
      setMirrorHint('Não foi possível carregar a agenda WhatsApp.');
    } finally {
      setMirrorLoading(false);
    }
  }, [companyId, profile?.id]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setPanelView('list');
      setNewName('');
      setNewPhone('');
      setNewCompany('');
      setNewDocument('');
      setDocType('cnpj');
      setNewContactHint(null);
      setRegistering(false);
      mirrorLoadedRef.current = false;
      return;
    }
    if (!mirrorLoadedRef.current) {
      mirrorLoadedRef.current = true;
      void loadMirrorContacts();
    }
  }, [open, loadMirrorContacts]);

  useEffect(() => {
    if (!open) return;
    const onSynced = () => void loadMirrorContacts({ silent: true });
    window.addEventListener('zaptro:wa-connected', onSynced);
    window.addEventListener('zaptro:wa-contacts-synced', onSynced);
    return () => {
      window.removeEventListener('zaptro:wa-connected', onSynced);
      window.removeEventListener('zaptro:wa-contacts-synced', onSynced);
    };
  }, [open, loadMirrorContacts]);

  const handlePickContact = (c: WaLinkConversation) => {
    if (isWhatsappMirrorContactId(c.id) && onOpenMirrorChat) {
      onOpenMirrorChat(c.sender_number, c.sender_name);
    } else {
      onSelectConversation(c.id);
    }
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (panelView === 'new-contact') {
          setPanelView('list');
          setNewContactHint(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, panelView]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const name = contactDisplayName(c).toLowerCase();
      const phone = (c.sender_number || '').toLowerCase();
      const msg = (c.last_message || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || msg.includes(q);
    });
  }, [contacts, query]);

  const groups = useMemo(() => groupContacts(filtered, sortMode), [filtered, sortMode]);

  const resetNewContactForm = () => {
    setNewName('');
    setNewPhone('');
    setNewCompany('');
    setNewDocument('');
    setDocType('cnpj');
    setNewContactHint(null);
  };

  const handleRegisterContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewContactHint(null);

    if (!companyId) {
      setNewContactHint('A sua conta não tem empresa vinculada. Contacte o administrador.');
      return;
    }

    const name = newName.trim();
    if (!name) {
      setNewContactHint('Informe o nome do contacto.');
      return;
    }

    const digits = normalizePhoneDigits(newPhone);
    if (digits.length < 10) {
      setNewContactHint('Informe um número válido com DDD (mín. 10 dígitos).');
      return;
    }

    setRegistering(true);
    try {
      const { id, created } = await registerWaLinkClient({
        companyId,
        name,
        phone: newPhone,
        companyName: newCompany,
        documentType: newDocument.trim() ? docType : undefined,
        document: newDocument,
      });

      notifyZaptro(
        'success',
        'Cliente cadastrado',
        created
          ? 'Contacto adicionado à base de clientes.'
          : 'Dados do contacto actualizados na base de clientes.',
      );

      onClientRegistered?.(id);
      onSelectConversation(id);
      resetNewContactForm();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível cadastrar o contacto.';
      setNewContactHint(message);
      notifyZaptro('error', 'Cadastro', message);
    } finally {
      setRegistering(false);
    }
  };

  const showInitialLoading =
    contacts.length === 0 && (mirrorLoading || (!listReady && refreshingList));

  if (!open) return null;

  const title = panelView === 'new-contact' ? 'Novo contato' : 'Nova conversa';

  return (
    <div className="wa-newchat-drawer-root" role="presentation">
      <aside className="wa-newchat-drawer" role="dialog" aria-label={title}>
        <header className="wa-newchat-drawer-head">
          <button
            type="button"
            className="wa-newchat-drawer-back"
            onClick={() => {
              if (panelView === 'new-contact') {
                setPanelView('list');
                setNewContactHint(null);
              } else {
                onClose();
              }
            }}
            aria-label="Voltar"
          >
            <ArrowLeft size={22} strokeWidth={2} />
          </button>
          <h2>{title}</h2>
          {panelView === 'list' ? (
            <button
              type="button"
              className={`wa-newchat-drawer-menu${sortMode === 'recent' ? ' is-active' : ''}`}
              title={sortMode === 'alpha' ? 'Ordenar por recentes' : 'Ordenar A–Z'}
              aria-label="Alternar ordenação"
              onClick={() => setSortMode((m) => (m === 'alpha' ? 'recent' : 'alpha'))}
            >
              <LayoutGrid size={20} strokeWidth={1.75} />
            </button>
          ) : (
            <span className="wa-newchat-drawer-menu-spacer" aria-hidden />
          )}
        </header>

        {panelView === 'list' ? (
          <>
            <div className="wa-newchat-drawer-search">
              <Search size={18} className="wa-newchat-drawer-search-icon" strokeWidth={2} />
              <input
                type="search"
                placeholder="Pesquisar nome ou número"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            <ul className="wa-newchat-drawer-actions">
              <li>
                <button
                  type="button"
                  className="wa-newchat-drawer-action"
                  onClick={() => {
                    if (onCreateGroup) {
                      onCreateGroup();
                    } else {
                      onOpenBroadcasts();
                      onClose();
                    }
                  }}
                >
                  <span className="wa-newchat-drawer-action-icon">
                    <Users size={20} strokeWidth={1.75} />
                  </span>
                  <span>Novo grupo WhatsApp</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="wa-newchat-drawer-action"
                  onClick={() => {
                    setPanelView('new-contact');
                    setNewContactHint(null);
                  }}
                >
                  <span className="wa-newchat-drawer-action-icon">
                    <UserPlus size={20} strokeWidth={1.75} />
                  </span>
                  <span>Novo contato</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="wa-newchat-drawer-action"
                  onClick={() => {
                    setNewContactHint(
                      'Comunidades WhatsApp estarão disponíveis numa próxima versão do Zaptro.',
                    );
                    setPanelView('list');
                  }}
                >
                  <span className="wa-newchat-drawer-action-icon">
                    <UsersRound size={20} strokeWidth={1.75} />
                  </span>
                  <span>Nova comunidade</span>
                </button>
              </li>
            </ul>

            {newContactHint && panelView === 'list' ? (
              <p className="wa-newchat-drawer-banner" role="status">
                {newContactHint}
              </p>
            ) : null}

            {mirrorHint && panelView === 'list' ? (
              <p className="wa-newchat-drawer-banner" role="status">
                {mirrorHint}
              </p>
            ) : null}

            <div className="wa-newchat-drawer-scroll">
              {showInitialLoading ? (
                <p className="wa-newchat-drawer-empty wa-newchat-drawer-empty--loading">
                  <Loader2 size={22} className="wa-newchat-spin" aria-hidden />
                  A carregar contactos…
                </p>
              ) : listError && contacts.length === 0 ? (
                <div className="wa-newchat-drawer-empty">
                  <p>{listError}</p>
                  <button type="button" className="wa-newchat-drawer-retry" onClick={() => { onRefresh(); void loadMirrorContacts(); }}>
                    Tentar novamente
                  </button>
                </div>
              ) : groups.length === 0 ? (
                <div className="wa-newchat-drawer-empty">
                  <p>
                    {contacts.length === 0
                      ? 'Quem enviar mensagem aparece aqui automaticamente. Também pode adicionar por número.'
                      : 'Nenhum contacto encontrado.'}
                  </p>
                  {contacts.length === 0 ? (
                    <button
                      type="button"
                      className="wa-newchat-drawer-retry"
                      onClick={() => setPanelView('new-contact')}
                    >
                      Adicionar por número
                    </button>
                  ) : null}
                </div>
              ) : (
                groups.map(({ letter, items }) => (
                  <section key={letter} className="wa-newchat-drawer-section">
                    <h3 className="wa-newchat-drawer-letter">{letter}</h3>
                    <ul className="wa-newchat-drawer-contacts">
                      {items.map((c) => {
                        const label = contactDisplayName(c);
                        const sub = contactSubtitle(c);
                        const phoneLine = formatWaPhoneLine(c.sender_number);
                        const initial = label[0]?.toUpperCase() || '?';
                        const rowKey = contactRowKey(c);
                        const roleInfo = resolveContactRole(c, roles);
                        return (
                          <li key={rowKey}>
                            <button
                              type="button"
                              className="wa-newchat-drawer-contact"
                              onClick={() => handlePickContact(c)}
                            >
                              <span className="wa-newchat-drawer-avatar">
                                {c.customer_avatar ? (
                                  <img src={c.customer_avatar} alt="" />
                                ) : (
                                  initial
                                )}
                              </span>
                              <span className="wa-newchat-drawer-contact-text">
                                <strong>
                                  {label}
                                  <em className="wa-newchat-drawer-role-badge">
                                    {roleInfo.label}
                                  </em>
                                </strong>
                                <em>{sub || phoneLine}</em>
                                {sub && phoneLine && sub !== phoneLine ? (
                                  <span className="wa-newchat-drawer-contact-phone">{phoneLine}</span>
                                ) : null}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))
              )}
            </div>
          </>
        ) : (
          <form className="wa-newchat-drawer-form" onSubmit={(e) => void handleRegisterContact(e)}>
            <label className="wa-newchat-drawer-field">
              <span>Nome</span>
              <input
                type="text"
                placeholder="Nome do contacto"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                required
              />
            </label>
            <label className="wa-newchat-drawer-field">
              <span>Telefone (com DDD)</span>
              <input
                type="tel"
                placeholder="11 99999-9999"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
              />
            </label>
            <label className="wa-newchat-drawer-field">
              <span>Empresa</span>
              <input
                type="text"
                placeholder="Razão social ou nome fantasia"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
              />
            </label>
            <div className="wa-newchat-drawer-field-row">
              <label className="wa-newchat-drawer-field wa-newchat-drawer-field--doc-type">
                <span>Documento</span>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as WaLinkDocType)}
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                </select>
              </label>
              <label className="wa-newchat-drawer-field wa-newchat-drawer-field--doc-value">
                <span>{docType === 'cpf' ? 'CPF' : 'CNPJ'}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={docType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                  value={newDocument}
                  onChange={(e) => setNewDocument(e.target.value)}
                />
              </label>
            </div>
            {newContactHint ? (
              <p className="wa-newchat-drawer-hint" role="status">
                {newContactHint}
              </p>
            ) : null}
            <button type="submit" className="wa-newchat-drawer-submit" disabled={registering}>
              {registering ? (
                <>
                  <Loader2 size={18} className="wa-spin" aria-hidden />
                  A cadastrar…
                </>
              ) : (
                'Cadastrar'
              )}
            </button>
            <p className="wa-newchat-drawer-form-note">
              O contacto entra na lista de clientes e fica disponível para conversa no inbox.
            </p>
          </form>
        )}
      </aside>
      <button type="button" className="wa-newchat-drawer-backdrop" aria-label="Fechar" onClick={onClose} />
    </div>
  );
};

export default WaLinkNewChatDrawer;
