import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Check,
  ChevronRight,
  History,
  List,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { supabaseZaptro } from '../../lib/supabase-zaptro';
import { resolveWaLinkInboxCompanyId } from '../../lib/waLinkInboxActivate';
import { useAuth } from '../../context/AuthContext';
import { hasZaptroGranularPermission, isZaptroTenantAdminRole } from '../../utils/zaptroPermissions';
import { sendEvolutionText } from '../../services/evolution';
import { formatWaPhone, readWaLinkSession, waLinkSharedInstance } from './waLinkConfig';
import {
  BROADCAST_COMPLIANCE_LINES,
  BROADCAST_SEGMENT_KINDS,
  BROADCAST_TAGS,
  computeBroadcastDashboard,
  filterBroadcastContacts,
  generateBroadcastCampaignAi,
  newCampaignId,
  readBroadcastCampaigns,
  readBroadcastListMeta,
  runBroadcastSendQueue,
  upsertBroadcastCampaign,
  upsertBroadcastListMeta,
  type BroadcastCampaign,
  type BroadcastContactRow,
  type BroadcastListMeta,
  type BroadcastSegmentFilters,
  type BroadcastSegmentKind,
} from './waLinkBroadcastModule';
import './waLinkBroadcasts.css';

type Tab = 'dashboard' | 'lists' | 'campaigns' | 'history';

type DbList = { id: string; name: string; created_at: string };

const DEFAULT_META = (kind: BroadcastSegmentKind = 'clientes'): BroadcastListMeta => ({
  description: '',
  segmentKind: kind,
  segmentFilters: {},
  dynamic: false,
  tags: [],
});

export const WaLinkBroadcasts: React.FC = () => {
  const { user, profile } = useAuth();
  const waSession = readWaLinkSession();
  const companyId = resolveWaLinkInboxCompanyId(profile, waSession.companyId, user?.id);
  const instanceName = waSession.instance || waLinkSharedInstance();

  const canManage = hasZaptroGranularPermission(profile?.role, (profile as { permissions?: string[] } | null)?.permissions, 'broadcasts.manage');
  const canSend = hasZaptroGranularPermission(profile?.role, (profile as { permissions?: string[] } | null)?.permissions, 'broadcasts.send');
  const isAdmin = isZaptroTenantAdminRole(profile?.role);

  const [tab, setTab] = useState<Tab>('dashboard');
  const [lists, setLists] = useState<DbList[]>([]);
  const [listMeta, setListMeta] = useState<Record<string, BroadcastListMeta>>({});
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [contacts, setContacts] = useState<BroadcastContactRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedList, setSelectedList] = useState<DbList | null>(null);
  const [listContactIds, setListContactIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const [showListModal, setShowListModal] = useState(false);
  const [listForm, setListForm] = useState({ name: '', description: '', kind: 'clientes' as BroadcastSegmentKind, dynamic: false, tags: [] as string[] });
  const [listFilters, setListFilters] = useState<BroadcastSegmentFilters>({});

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    listId: '',
    body: '',
    schedule: 'immediate' as const,
    scheduledAt: '',
    messageType: 'text' as const,
  });
  const [aiBrief, setAiBrief] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [listsRes, convRes] = await Promise.all([
        supabaseZaptro.from('whatsapp_broadcast_lists').select('id,name,created_at').eq('company_id', companyId).order('created_at', { ascending: false }),
        supabaseZaptro
          .from('whatsapp_conversations')
          .select('id,sender_number,sender_name,updated_at,last_message_at,crm_type,metadata')
          .eq('company_id', companyId)
          .order('updated_at', { ascending: false }),
      ]);
      if (listsRes.error) throw listsRes.error;
      if (convRes.error) throw convRes.error;
      setLists(listsRes.data || []);
      setContacts((convRes.data || []) as BroadcastContactRow[]);
      setListMeta(readBroadcastListMeta(companyId));
      setCampaigns(readBroadcastCampaigns(companyId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const dashboard = useMemo(
    () => computeBroadcastDashboard(contacts, lists.length, campaigns),
    [contacts, lists.length, campaigns],
  );

  const loadListContacts = useCallback(async (listId: string) => {
    const { data } = await supabaseZaptro
      .from('whatsapp_broadcast_list_contacts')
      .select('conversation_id')
      .eq('list_id', listId);
    setListContactIds((data || []).map((d) => d.conversation_id));
  }, []);

  const metaFor = (listId: string): BroadcastListMeta => listMeta[listId] || DEFAULT_META();

  const matchingForList = useCallback(
    (list: DbList): BroadcastContactRow[] => {
      const meta = metaFor(list.id);
      return filterBroadcastContacts(contacts, meta.segmentKind, meta.segmentFilters);
    },
    [contacts, listMeta],
  );

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !canManage || !listForm.name.trim()) return;
    const { data, error: err } = await supabaseZaptro
      .from('whatsapp_broadcast_lists')
      .insert({ name: listForm.name.trim(), company_id: companyId })
      .select('id,name,created_at')
      .single();
    if (err || !data) {
      setError(err?.message || 'Não foi possível criar a lista.');
      return;
    }
    upsertBroadcastListMeta(companyId, data.id, {
      description: listForm.description.trim(),
      segmentKind: listForm.kind,
      segmentFilters: listFilters,
      dynamic: listForm.dynamic,
      tags: listForm.tags,
    });
    setShowListModal(false);
    setListForm({ name: '', description: '', kind: 'clientes', dynamic: false, tags: [] });
    setListFilters({});
    await reload();
  };

  const handleDeleteList = async (id: string) => {
    if (!canManage || !confirm('Eliminar esta lista?')) return;
    await supabaseZaptro.from('whatsapp_broadcast_lists').delete().eq('id', id);
    if (selectedList?.id === id) setSelectedList(null);
    await reload();
  };

  const syncDynamicList = async (list: DbList) => {
    if (!canManage) return;
    const meta = metaFor(list.id);
    if (!meta.dynamic) return;
    const matched = matchingForList(list);
    await supabaseZaptro.from('whatsapp_broadcast_list_contacts').delete().eq('list_id', list.id);
    if (matched.length) {
      await supabaseZaptro.from('whatsapp_broadcast_list_contacts').insert(
        matched.map((c) => ({ list_id: list.id, conversation_id: c.id })),
      );
    }
    await loadListContacts(list.id);
  };

  const toggleContact = async (convId: string) => {
    if (!selectedList || !canManage) return;
    const isAdded = listContactIds.includes(convId);
    if (isAdded) {
      await supabaseZaptro.from('whatsapp_broadcast_list_contacts').delete().eq('list_id', selectedList.id).eq('conversation_id', convId);
      setListContactIds((prev) => prev.filter((id) => id !== convId));
    } else {
      await supabaseZaptro.from('whatsapp_broadcast_list_contacts').insert({ list_id: selectedList.id, conversation_id: convId });
      setListContactIds((prev) => [...prev, convId]);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiBrief.trim()) return;
    setAiLoading(true);
    try {
      const text = await generateBroadcastCampaignAi(aiBrief.trim());
      setCampaignForm((f) => ({ ...f, body: text }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'IA indisponível.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !canSend || !campaignForm.listId || !campaignForm.body.trim()) return;
    const list = lists.find((l) => l.id === campaignForm.listId);
    if (!list) return;

    const { data: links } = await supabaseZaptro
      .from('whatsapp_broadcast_list_contacts')
      .select('conversation_id')
      .eq('list_id', list.id);
    const ids = (links || []).map((l) => l.conversation_id);
    const targets = contacts.filter((c) => ids.includes(c.id));
    if (targets.length === 0) {
      setError('A lista seleccionada não tem contactos.');
      return;
    }
    if (!confirm(`Enviar campanha para ${targets.length} contacto(s) com interacção prévia?`)) return;

    const campaign: BroadcastCampaign = {
      id: newCampaignId(),
      companyId,
      name: campaignForm.name.trim() || `Campanha ${new Date().toLocaleDateString('pt-BR')}`,
      description: campaignForm.description.trim(),
      listId: list.id,
      listName: list.name,
      messageType: campaignForm.messageType,
      body: campaignForm.body.trim(),
      schedule: campaignForm.schedule,
      scheduledAt: campaignForm.scheduledAt || undefined,
      status: 'sending',
      stats: { sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 },
      createdAt: new Date().toISOString(),
    };
    upsertBroadcastCampaign(companyId, campaign);
    setCampaigns(readBroadcastCampaigns(companyId));
    setSending(true);
    setSendProgress(`0 / ${targets.length}`);

    try {
      const stats = await runBroadcastSendQueue({
        targets,
        bodyTemplate: campaignForm.body.trim(),
        sendOne: (phone, text) => sendEvolutionText(instanceName, phone, text),
        onProgress: (done, total) => setSendProgress(`${done} / ${total}`),
      });
      campaign.stats = stats;
      campaign.status = stats.failed === targets.length ? 'failed' : 'done';
      campaign.completedAt = new Date().toISOString();
      upsertBroadcastCampaign(companyId, campaign);
      setCampaigns(readBroadcastCampaigns(companyId));
      setCampaignForm({ name: '', description: '', listId: '', body: '', schedule: 'immediate', scheduledAt: '', messageType: 'text' });
      setTab('history');
    } catch (e) {
      campaign.status = 'failed';
      upsertBroadcastCampaign(companyId, campaign);
      setError(e instanceof Error ? e.message : 'Falha no envio.');
    } finally {
      setSending(false);
      setSendProgress('');
    }
  };

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = contacts;
    if (selectedList) {
      const meta = metaFor(selectedList.id);
      base = filterBroadcastContacts(contacts, meta.segmentKind, meta.segmentFilters);
    }
    if (!q) return base;
    return base.filter(
      (c) =>
        (c.sender_name || '').toLowerCase().includes(q) ||
        c.sender_number.includes(q) ||
        formatWaPhone(c.sender_number).includes(q),
    );
  }, [contacts, search, selectedList, listMeta]);

  if (!companyId) {
    return (
      <div className="wa-broadcast">
        <div className="wa-broadcast-empty">Faça login com empresa vinculada para usar listas de transmissão.</div>
      </div>
    );
  }

  return (
    <div className="wa-broadcast">
      <header className="wa-broadcast-head">
        <div>
          <h1>Listas de Transmissão</h1>
          <p>Central inteligente de comunicação — segmentação, campanhas e conformidade Meta.</p>
        </div>
        <button type="button" className="wa-broadcast-btn wa-broadcast-btn--ghost" onClick={() => void reload()} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'wa-broadcast-spin' : undefined} />
          Actualizar
        </button>
      </header>

      <div className="wa-broadcast-compliance">
        <ShieldCheck size={18} />
        <div>
          <strong>Conformidade WhatsApp / Meta</strong>
          <span>{BROADCAST_COMPLIANCE_LINES.join(' · ')}</span>
        </div>
      </div>

      {error ? (
        <div className="wa-broadcast-alert">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="Fechar">
            <X size={14} />
          </button>
        </div>
      ) : null}

      <nav className="wa-broadcast-tabs">
        {(
          [
            ['dashboard', 'Dashboard', BarChart3],
            ['lists', 'Listas', List],
            ['campaigns', 'Campanhas', Megaphone],
            ['history', 'Histórico', History],
          ] as const
        ).map(([id, label, Icon]) => (
          <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="wa-broadcast-loading">
          <Loader2 size={22} className="wa-broadcast-spin" /> A carregar…
        </div>
      ) : null}

      {!loading && tab === 'dashboard' ? (
        <section className="wa-broadcast-panel">
          <div className="wa-broadcast-kpi-grid">
            {[
              ['Total contactos', dashboard.totalContacts],
              ['Contactos activos (24h)', dashboard.activeContacts],
              ['Com interacção', dashboard.interactedContacts],
              ['Listas criadas', dashboard.totalLists],
              ['Campanhas enviadas', dashboard.totalCampaigns],
              ['Taxa entrega', `${dashboard.deliveryRate}%`],
              ['Taxa resposta', `${dashboard.responseRate}%`],
            ].map(([label, value]) => (
              <div key={String(label)} className="wa-broadcast-kpi">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="wa-broadcast-tags-section">
            <h3><Tag size={16} /> Etiquetas sugeridas</h3>
            <div className="wa-broadcast-tag-row">
              {BROADCAST_TAGS.map((t) => (
                <span key={t} className="wa-broadcast-tag">{t}</span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!loading && tab === 'lists' && !selectedList ? (
        <section className="wa-broadcast-panel">
          <div className="wa-broadcast-panel-head">
            <h2>Grupos e segmentos</h2>
            {canManage ? (
              <button type="button" className="wa-broadcast-btn" onClick={() => setShowListModal(true)}>
                <Plus size={16} /> Nova lista
              </button>
            ) : null}
          </div>
          {lists.length === 0 ? (
            <div className="wa-broadcast-empty-card">
              <Users size={28} />
              <strong>Nenhuma lista criada</strong>
              <p>Crie grupos como Clientes Premium, Motoristas Activos ou Região Sul com filtros inteligentes.</p>
              {canManage ? (
                <button type="button" className="wa-broadcast-btn" onClick={() => setShowListModal(true)}>
                  <Plus size={16} /> Criar primeira lista
                </button>
              ) : null}
            </div>
          ) : (
            <div className="wa-broadcast-list-grid">
              {lists.map((list) => {
                const meta = metaFor(list.id);
                const count = meta.dynamic ? matchingForList(list).length : undefined;
                return (
                  <article key={list.id} className="wa-broadcast-list-card">
                    <div className="wa-broadcast-list-card-top">
                      <strong>{list.name}</strong>
                      {canManage ? (
                        <button type="button" className="wa-broadcast-icon-danger" onClick={() => void handleDeleteList(list.id)} title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                    <p>{meta.description || 'Sem descrição'}</p>
                    <div className="wa-broadcast-list-meta">
                      <span>{meta.segmentKind}</span>
                      {meta.dynamic ? <span className="wa-broadcast-pill">Dinâmica</span> : null}
                      {meta.tags.map((t) => (
                        <span key={t} className="wa-broadcast-pill">{t}</span>
                      ))}
                    </div>
                    <footer>
                      <span>{count != null ? `${count} contactos (dinâmico)` : 'Ver contactos'}</span>
                      <button
                        type="button"
                        className="wa-broadcast-link"
                        onClick={() => {
                          setSelectedList(list);
                          void loadListContacts(list.id);
                          if (meta.dynamic) void syncDynamicList(list);
                        }}
                      >
                        Abrir <ChevronRight size={14} />
                      </button>
                    </footer>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {!loading && tab === 'lists' && selectedList ? (
        <section className="wa-broadcast-panel wa-broadcast-panel--detail">
          <div className="wa-broadcast-panel-head">
            <button type="button" className="wa-broadcast-btn wa-broadcast-btn--ghost" onClick={() => setSelectedList(null)}>
              ← Voltar
            </button>
            <h2>{selectedList.name}</h2>
            <span>{listContactIds.length} na lista</span>
            {metaFor(selectedList.id).dynamic && canManage ? (
              <button type="button" className="wa-broadcast-btn wa-broadcast-btn--ghost" onClick={() => void syncDynamicList(selectedList)}>
                Sincronizar dinâmica
              </button>
            ) : null}
          </div>
          <div className="wa-broadcast-search">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar contactos com interacção…" />
          </div>
          <ul className="wa-broadcast-contact-list">
            {filteredContacts.map((c) => {
              const added = listContactIds.includes(c.id);
              return (
                <li key={c.id}>
                  <div>
                    <strong>{c.sender_name || formatWaPhone(c.sender_number)}</strong>
                    <span>{formatWaPhone(c.sender_number)}</span>
                  </div>
                  {canManage ? (
                    <button type="button" className={added ? 'wa-broadcast-btn wa-broadcast-btn--ok' : 'wa-broadcast-btn wa-broadcast-btn--ghost'} onClick={() => void toggleContact(c.id)}>
                      {added ? <Check size={14} /> : 'Adicionar'}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {!loading && tab === 'campaigns' ? (
        <section className="wa-broadcast-panel">
          <form className="wa-broadcast-form" onSubmit={(e) => void handleSendCampaign(e)}>
            <h2>Nova campanha</h2>
            <div className="wa-broadcast-form-grid">
              <label>
                Nome da campanha
                <input value={campaignForm.name} onChange={(e) => setCampaignForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Aviso de entrega" />
              </label>
              <label>
                Lista
                <select value={campaignForm.listId} onChange={(e) => setCampaignForm((f) => ({ ...f, listId: e.target.value }))} required>
                  <option value="">Seleccionar…</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </label>
              <label className="wa-broadcast-span2">
                Descrição
                <input value={campaignForm.description} onChange={(e) => setCampaignForm((f) => ({ ...f, description: e.target.value }))} />
              </label>
              <label>
                Tipo
                <select value={campaignForm.messageType} onChange={(e) => setCampaignForm((f) => ({ ...f, messageType: e.target.value as 'text' }))}>
                  <option value="text">Texto</option>
                  <option value="image">Imagem (em breve)</option>
                  <option value="pdf">PDF (em breve)</option>
                </select>
              </label>
              <label>
                Envio
                <select value={campaignForm.schedule} onChange={(e) => setCampaignForm((f) => ({ ...f, schedule: e.target.value as 'immediate' }))}>
                  <option value="immediate">Imediato</option>
                  <option value="scheduled">Agendado (em breve)</option>
                  <option value="recurring">Recorrente (em breve)</option>
                </select>
              </label>
            </div>

            <div className="wa-broadcast-ai-box">
              <Sparkles size={16} />
              <input value={aiBrief} onChange={(e) => setAiBrief(e.target.value)} placeholder="Pedir à Llama 3.2: campanha de cobrança, promoção, aviso de entrega…" />
              <button type="button" className="wa-broadcast-btn wa-broadcast-btn--ghost" disabled={aiLoading || !aiBrief.trim()} onClick={() => void handleAiGenerate()}>
                {aiLoading ? 'A gerar…' : 'Gerar texto'}
              </button>
            </div>

            <label className="wa-broadcast-span2">
              Mensagem (use {'{nome}'}, {'{empresa}'}, {'{telefone}'}, {'{cidade}'}, {'{status}'}, {'{vencimento}'})
              <textarea
                value={campaignForm.body}
                onChange={(e) => setCampaignForm((f) => ({ ...f, body: e.target.value }))}
                rows={8}
                required
                disabled={sending}
                placeholder={'Olá {nome},\n\nSua carga está em rota de entrega.'}
              />
            </label>

            {sendProgress ? <p className="wa-broadcast-progress">Fila de envio: {sendProgress}</p> : null}

            <button type="submit" className="wa-broadcast-btn" disabled={!canSend || sending || !campaignForm.listId || !campaignForm.body.trim()}>
              <Send size={16} />
              {sending ? 'A enviar na fila…' : 'Disparar campanha'}
            </button>
          </form>
        </section>
      ) : null}

      {!loading && tab === 'history' ? (
        <section className="wa-broadcast-panel">
          <h2>Histórico de campanhas</h2>
          {campaigns.length === 0 ? (
            <div className="wa-broadcast-empty-card">
              <History size={28} />
              <strong>Sem campanhas ainda</strong>
              <p>Os resultados (enviados, entregues, falhas) aparecem aqui após o primeiro disparo.</p>
            </div>
          ) : (
            <table className="wa-broadcast-table">
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Lista</th>
                  <th>Estado</th>
                  <th>Enviados</th>
                  <th>Entregues</th>
                  <th>Falhas</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong><br /><small>{c.description || '—'}</small></td>
                    <td>{c.listName}</td>
                    <td><span className={`wa-broadcast-status wa-broadcast-status--${c.status}`}>{c.status}</span></td>
                    <td>{c.stats.sent}</td>
                    <td>{c.stats.delivered}</td>
                    <td>{c.stats.failed}</td>
                    <td>{new Date(c.createdAt).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {showListModal ? (
        <div className="wa-broadcast-modal-backdrop" onMouseDown={() => setShowListModal(false)}>
          <div className="wa-broadcast-modal" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <h3>Nova lista inteligente</h3>
              <button type="button" onClick={() => setShowListModal(false)}><X size={18} /></button>
            </header>
            <form onSubmit={(e) => void handleCreateList(e)}>
              <label>
                Nome
                <input value={listForm.name} onChange={(e) => setListForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Ex: Clientes Premium" />
              </label>
              <label>
                Descrição
                <input value={listForm.description} onChange={(e) => setListForm((f) => ({ ...f, description: e.target.value }))} />
              </label>
              <label>
                Segmento
                <select value={listForm.kind} onChange={(e) => setListForm((f) => ({ ...f, kind: e.target.value as BroadcastSegmentKind }))}>
                  {BROADCAST_SEGMENT_KINDS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </label>
              <label className="wa-broadcast-check">
                <input type="checkbox" checked={listForm.dynamic} onChange={(e) => setListForm((f) => ({ ...f, dynamic: e.target.checked }))} />
                Lista dinâmica (actualiza automaticamente conforme filtros)
              </label>
              <fieldset>
                <legend>Filtros avançados</legend>
                <div className="wa-broadcast-form-grid">
                  <label>Cidade<input value={listFilters.city || ''} onChange={(e) => setListFilters((f) => ({ ...f, city: e.target.value }))} /></label>
                  <label>Estado<input value={listFilters.state || ''} onChange={(e) => setListFilters((f) => ({ ...f, state: e.target.value }))} /></label>
                  <label>Empresa<input value={listFilters.company || ''} onChange={(e) => setListFilters((f) => ({ ...f, company: e.target.value }))} /></label>
                  <label>Transportadora<input value={listFilters.carrier || ''} onChange={(e) => setListFilters((f) => ({ ...f, carrier: e.target.value }))} /></label>
                  <label className="wa-broadcast-check"><input type="checkbox" checked={!!listFilters.activeOnly} onChange={(e) => setListFilters((f) => ({ ...f, activeOnly: e.target.checked, inactiveOnly: false }))} /> Cliente activo (30d)</label>
                  <label className="wa-broadcast-check"><input type="checkbox" checked={!!listFilters.inactiveOnly} onChange={(e) => setListFilters((f) => ({ ...f, inactiveOnly: e.target.checked, activeOnly: false }))} /> Cliente inactivo</label>
                </div>
              </fieldset>
              <footer>
                <button type="button" className="wa-broadcast-btn wa-broadcast-btn--ghost" onClick={() => setShowListModal(false)}>Cancelar</button>
                <button type="submit" className="wa-broadcast-btn">Criar lista</button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}

      {!isAdmin ? (
        <p className="wa-broadcast-perm-hint">
          {canManage ? 'Pode gerir listas.' : 'Visualização — peça permissão broadcasts.manage ao administrador.'}
          {canSend ? ' Pode enviar campanhas.' : ' Envio requer broadcasts.send.'}
        </p>
      ) : null}
    </div>
  );
};
