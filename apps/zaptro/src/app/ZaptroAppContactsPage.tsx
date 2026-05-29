import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2, MessageSquare, RefreshCw, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loadWhatsappMirrorContacts } from '../lib/loadWhatsappMirrorContacts';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { formatWaPhoneLine, readWaLinkSession } from '../modules/wa-link/waLinkConfig';
import { fetchWaLinkConversations } from '../modules/wa-link/waLinkInboxDb';
import {
  mergeWaUnifiedContacts,
  waUnifiedContactRowKey,
  type WaUnifiedContact,
} from '../modules/wa-link/waLinkUnifiedContacts';
import { resolveWaLinkInboxCompanyId } from '../lib/waLinkInboxActivate';
import { ZAPTRO_APP_ROUTES, zaptroAppInboxThreadPath } from './zaptroAppRoutes';
import { useZaptroPaginatedList } from '../hooks/useZaptroPaginatedList';
import ZaptroListPagination from '../components/Zaptro/ZaptroListPagination';
import '../components/Zaptro/zaptroListPagination.css';
import './zaptroAppModulePage.css';

type ContactsEmptyKind = 'loading' | 'no-company' | 'disconnected' | 'empty' | 'search';

const ContactsEmptyState: React.FC<{
  kind: ContactsEmptyKind;
  hint?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}> = ({ kind, hint, onRefresh, refreshing }) => {
  if (kind === 'loading') {
    return (
      <div className="zaptro-app-contacts-empty zaptro-app-contacts-empty--card">
        <Loader2 size={22} className="zaptro-clients-spin" aria-hidden />
        <p className="zaptro-app-contacts-empty-title">A carregar contactos…</p>
      </div>
    );
  }

  if (kind === 'no-company') {
    return (
      <div className="zaptro-app-contacts-empty zaptro-app-contacts-empty--card">
        <User size={28} strokeWidth={2} aria-hidden />
        <p className="zaptro-app-contacts-empty-title">Empresa não vinculada</p>
        <p className="zaptro-app-contacts-empty-copy">
          {hint ||
            'A sua conta precisa estar ligada a uma empresa para espelhar a agenda do WhatsApp. Peça acesso ao administrador ou configure a empresa.'}
        </p>
        <div className="zaptro-app-contacts-empty-actions">
          <Link to={ZAPTRO_APP_ROUTES.COMPANY} className="zaptro-app-module-btn">
            Minha empresa
          </Link>
          <Link to={ZAPTRO_APP_ROUTES.SETTINGS} className="zaptro-app-module-btn zaptro-app-module-btn--ghost">
            Configurações
          </Link>
        </div>
      </div>
    );
  }

  if (kind === 'disconnected') {
    return (
      <div className="zaptro-app-contacts-empty zaptro-app-contacts-empty--card">
        <MessageSquare size={28} strokeWidth={2} aria-hidden />
        <p className="zaptro-app-contacts-empty-title">WhatsApp desligado</p>
        <p className="zaptro-app-contacts-empty-copy">
          {hint ||
            'Ligue o WhatsApp em Configurações (QR Code) para importar os contactos da agenda do telemóvel.'}
        </p>
        <div className="zaptro-app-contacts-empty-actions">
          <Link to={`${ZAPTRO_APP_ROUTES.SETTINGS}?tab=config`} className="zaptro-app-module-btn">
            Ligar WhatsApp
          </Link>
          <Link to={ZAPTRO_APP_ROUTES.INBOX} className="zaptro-app-module-btn zaptro-app-module-btn--ghost">
            Ir para conversas
          </Link>
        </div>
      </div>
    );
  }

  if (kind === 'search') {
    return (
      <div className="zaptro-app-contacts-empty zaptro-app-contacts-empty--card">
        <Search size={28} strokeWidth={2} aria-hidden />
        <p className="zaptro-app-contacts-empty-title">Nenhum resultado</p>
        <p className="zaptro-app-contacts-empty-copy">
          Nenhum contacto corresponde à pesquisa. Tente outro nome ou número.
        </p>
      </div>
    );
  }

  return (
    <div className="zaptro-app-contacts-empty zaptro-app-contacts-empty--card">
      <User size={28} strokeWidth={2} aria-hidden />
      <p className="zaptro-app-contacts-empty-title">Agenda vazia</p>
      <p className="zaptro-app-contacts-empty-copy">
        {hint ||
          'WhatsApp ligado, mas nenhum contacto devolvido. Confirme a agenda no telemóvel e actualize a lista.'}
      </p>
      {onRefresh ? (
        <div className="zaptro-app-contacts-empty-actions">
          <button
            type="button"
            className="zaptro-app-module-btn zaptro-app-module-btn--ghost"
            disabled={refreshing}
            onClick={onRefresh}
          >
            <RefreshCw size={16} className={refreshing ? 'zaptro-clients-spin' : undefined} />
            Actualizar
          </button>
        </div>
      ) : null}
    </div>
  );
};

const ZaptroAppContactsPage: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const waSession = readWaLinkSession();
  const companyId = resolveWaLinkInboxCompanyId(profile, waSession.companyId, profile?.id);

  const [rows, setRows] = useState<WaUnifiedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [inboxCount, setInboxCount] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const reload = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!companyId) {
        setRows([]);
        setConnected(false);
        setInboxCount(0);
        setHint(
          import.meta.env.DEV
            ? 'Perfil sem empresa no Supabase. Em dev, confirme VITE_WA_LINK_DEFAULT_COMPANY_ID ou vincule a empresa em Minha Empresa.'
            : 'Faça login com empresa vinculada.',
        );
        setLoading(false);
        return;
      }

      if (!opts?.silent) setLoading(true);
      else setRefreshing(true);

      try {
        const [mirrorResult, inboxRows] = await Promise.all([
          loadWhatsappMirrorContacts({ companyId, userId: profile?.id }),
          fetchWaLinkConversations(
            async (select, filterByCompany) => {
              let query = supabaseZaptro.from('whatsapp_conversations').select(select);
              if (filterByCompany) query = query.eq('company_id', companyId);
              return query
                .order('last_message_at', { ascending: false, nullsFirst: false })
                .order('updated_at', { ascending: false })
                .limit(300);
            },
            companyId,
          ),
        ]);

        setConnected(mirrorResult.connected);
        const merged = mergeWaUnifiedContacts(
          mirrorResult.connected ? mirrorResult.contacts : [],
          inboxRows,
        );
        setRows(merged);
        setInboxCount(inboxRows.length);
        setHint(mirrorResult.hint ?? null);
      } catch (e) {
        setConnected(false);
        setRows([]);
        setInboxCount(0);
        setHint(e instanceof Error ? e.message : 'Erro ao carregar contactos.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [companyId, profile?.id],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const poll = window.setInterval(() => void reload({ silent: true }), 20000);
    const onWa = () => void reload({ silent: true });
    window.addEventListener('zaptro:wa-connected', onWa);
    window.addEventListener('zaptro:wa-profile-synced', onWa);
    window.addEventListener('zaptro:wa-contacts-synced', onWa);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('zaptro:wa-connected', onWa);
      window.removeEventListener('zaptro:wa-profile-synced', onWa);
      window.removeEventListener('zaptro:wa-contacts-synced', onWa);
    };
  }, [reload]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = r.name.toLowerCase();
      const num = r.phone.toLowerCase();
      const formatted = formatWaPhoneLine(r.phone).toLowerCase();
      return name.includes(q) || num.includes(q) || formatted.includes(q);
    });
  }, [rows, search]);

  const contactsPag = useZaptroPaginatedList(filtered, 10, search);

  const inboxLink = (contact: WaUnifiedContact) => {
    const threadKey = contact.conversationId || contact.phone;
    return zaptroAppInboxThreadPath(location.pathname, threadKey, { clientName: contact.name });
  };

  const hasContacts = rows.length > 0;
  const showDisconnectedOnly = !connected && !hasContacts;

  return (
    <>
      <header className="zaptro-app-module-head">
        <div>
          <h1>Contatos</h1>
          <p>
            Leads e clientes das conversas aparecem automaticamente. A agenda do WhatsApp ligado complementa a lista
            quando o QR está activo.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="zaptro-app-module-btn zaptro-app-module-btn--ghost"
            disabled={refreshing || loading}
            onClick={() => void reload({ silent: true })}
          >
            <RefreshCw size={16} className={refreshing ? 'zaptro-clients-spin' : undefined} />
            Actualizar
          </button>
          <Link to={ZAPTRO_APP_ROUTES.INBOX} className="zaptro-app-module-btn">
            Abrir conversas
          </Link>
        </div>
      </header>

      <section className="zaptro-app-module-card">
        <div className="zaptro-app-contacts-toolbar">
          <label className="zaptro-app-contacts-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou número…"
              disabled={!hasContacts && !connected}
            />
          </label>
        </div>

        {loading ? (
          <ContactsEmptyState kind="loading" />
        ) : !companyId ? (
          <ContactsEmptyState kind="no-company" hint={hint} />
        ) : showDisconnectedOnly ? (
          <ContactsEmptyState kind="disconnected" hint={hint} />
        ) : filtered.length === 0 ? (
          <ContactsEmptyState
            kind={search.trim() ? 'search' : 'empty'}
            hint={search.trim() ? undefined : hint}
            onRefresh={search.trim() ? undefined : () => void reload({ silent: true })}
            refreshing={refreshing}
          />
        ) : (
          <>
            {hint ? <p className="zaptro-app-contacts-mirror-hint">{hint}</p> : null}
            <p className="zaptro-app-contacts-mirror-hint">
              {rows.length} contacto(s)
              {inboxCount > 0 ? ` · ${inboxCount} da inbox` : ''}
              {connected ? ' · WhatsApp ligado' : ''}
            </p>
            <table className="zaptro-app-contacts-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>WhatsApp</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {contactsPag.pageItems.map((r) => (
                  <tr key={waUnifiedContactRowKey(r)}>
                    <td>
                      <span className="zaptro-app-contacts-name-cell">
                        <span className="zaptro-app-contacts-avatar">
                          {r.profilePicUrl ? (
                            <img src={r.profilePicUrl} alt="" />
                          ) : (
                            <User size={16} />
                          )}
                        </span>
                        {r.name}
                        {r.crmType === 'client' ? (
                          <span className="zaptro-app-contacts-badge">Cliente</span>
                        ) : r.crmType === 'contact' ? (
                          <span className="zaptro-app-contacts-badge zaptro-app-contacts-badge--contact">
                            Contato
                          </span>
                        ) : r.fromInbox ? (
                          <span className="zaptro-app-contacts-badge zaptro-app-contacts-badge--lead">Lead</span>
                        ) : null}
                      </span>
                    </td>
                    <td>{formatWaPhoneLine(r.phone)}</td>
                    <td>
                      <Link
                        to={inboxLink(r)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#0f172a',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <MessageSquare size={14} /> Mensagem
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ZaptroListPagination
              gutterBleed={false}
              currentPage={contactsPag.currentPage}
              totalPages={contactsPag.totalPages}
              totalItems={contactsPag.totalItems}
              itemsPerPage={contactsPag.itemsPerPage}
              onPageChange={contactsPag.setCurrentPage}
              onItemsPerPageChange={contactsPag.setItemsPerPage}
            />
          </>
        )}
      </section>
    </>
  );
};

export default ZaptroAppContactsPage;
