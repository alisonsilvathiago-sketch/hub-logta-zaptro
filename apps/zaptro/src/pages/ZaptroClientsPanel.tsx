import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  MessageSquare,
  Calendar,
  User,
  TrendingUp,
  Star,
  Loader2,
  Zap,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { useAuth } from '../context/AuthContext';
import { ZAPTRO_APP_ROUTES, zaptroAppOrLegacy } from '../app/zaptroAppRoutes';
import { zaptroClientProfilePath } from '../constants/zaptroRoutes';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import ZaptroKpiMetricCard from '../components/Zaptro/ZaptroKpiMetricCard';
import { exportToExcel } from '../lib/exportToExcel';
import { ZaptroLeadsTab } from './ZaptroLeadsTab';
import ZaptroListPagination from '../components/Zaptro/ZaptroListPagination';
import { importClientsCsvRows, parseClientsCsv } from '../lib/zaptroClientsImport';
import { downloadCsvTemplate } from '../lib/downloadCsvTemplate';
import { ZaptroListImportToolbar } from '../components/Zaptro/ZaptroListImportToolbar';
import {
  buildZaptroDemoClients,
  isZaptroClientsDemoEnabled,
  isZaptroDemoClientId,
  ZAPTRO_DEMO_COMPANY_ID,
} from '../constants/zaptroClientsDemo';
import { buildZaptroDemoTeamMembers, isZaptroTeamDemoEnabled } from '../constants/zaptroTeamDemo';
import LogtaModal from '../components/Modal';
import ZaptroClientEditModal from '../components/Zaptro/ZaptroClientEditModal';
import {
  deleteClientProfile,
  type ZaptroClientProfileMetadata,
} from '../lib/zaptroClientProfileEdits';
import { resolveMemberAvatarUrl } from '../utils/zaptroAvatar';
import { zaptroCollaboratorColor } from '../lib/zaptroAgendaCollaborators';
import '../app/zaptroAppClients.css';
import '../app/zaptroAppClientProfile.css';

function clientCompanyName(c: { metadata?: unknown }): string {
  const m = c.metadata;
  if (m && typeof m === 'object' && 'company_name' in m) {
    const name = (m as { company_name?: unknown }).company_name;
    if (typeof name === 'string' && name.trim()) return name.trim();
  }
  return '';
}

function clientMetadata(c: { metadata?: unknown }): ZaptroClientProfileMetadata {
  const m = c.metadata;
  if (m && typeof m === 'object' && !Array.isArray(m)) {
    return m as ZaptroClientProfileMetadata;
  }
  return { company_name: '' };
}

type AssigneeInfo = { id: string; name: string; avatar: string | null; color: string };

function normalizeClientPhone(phone: string): string {
  return String(phone || '').replace(/\D/g, '');
}

function resolveClientAssigneeId(client: {
  assigned_to?: string | null;
  metadata?: unknown;
}): string {
  const direct = typeof client.assigned_to === 'string' ? client.assigned_to.trim() : '';
  if (direct) return direct;
  const meta = client.metadata;
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const m = meta as Record<string, unknown>;
    for (const key of ['assigned_to', 'assignee_id', 'agent_id'] as const) {
      const v = m[key];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  }
  return '';
}

function ClientsPanelAssigneeChip({
  assignee,
  assigneeId,
  muted,
  onNavigate,
}: {
  assignee: AssigneeInfo;
  assigneeId: string;
  muted?: boolean;
  onNavigate: (path: string) => void;
}) {
  const initial = assignee.name.trim()[0]?.toUpperCase() || '?';
  const profilePath = ZAPTRO_APP_ROUTES.teamMemberProfile(assigneeId);

  return (
    <button
      type="button"
      className={[
        'zaptro-clients-panel__status-assignee-chip',
        muted ? 'zaptro-clients-panel__status-assignee-chip--muted' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      title={`Ver colaborador: ${assignee.name}`}
      onClick={(e) => {
        e.stopPropagation();
        onNavigate(profilePath);
      }}
    >
      <span
        className="zaptro-clients-panel__status-assignee-avatar"
        style={{ backgroundColor: assignee.avatar ? '#f1f5f9' : assignee.color }}
        aria-hidden
      >
        {assignee.avatar ? (
          <img src={assignee.avatar} alt="" />
        ) : (
          <span className="zaptro-clients-panel__status-assignee-initial">{initial}</span>
        )}
      </span>
      <span className="zaptro-clients-panel__status-assignee-name">{assignee.name}</span>
    </button>
  );
}

type Props = {
  /** Dentro do shell `/app/*` — abas sem navegar para rotas legadas. */
  embedded?: boolean;
  /** Mostrar aba de Leads/Oportunidades (CRM) dentro desta tela. */
  showLeadsTab?: boolean;
};

export const ZaptroClientsPanel: React.FC<Props> = ({ embedded = false, showLeadsTab = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'clients' | 'leads'>(
    location.pathname.includes('/leads') ? 'leads' : 'clients',
  );

  useEffect(() => {
    if (embedded) return;
    if (location.pathname.includes('/leads')) {
      setActiveTab('leads');
    } else {
      setActiveTab('clients');
    }
  }, [location.pathname, embedded]);

  useEffect(() => {
    if (!showLeadsTab && activeTab !== 'clients') setActiveTab('clients');
  }, [showLeadsTab, activeTab]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editClient, setEditClient] = useState<(typeof clients)[number] | null>(null);
  const [deleteClient, setDeleteClient] = useState<(typeof clients)[number] | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [assigneeMap, setAssigneeMap] = useState<Map<string, AssigneeInfo>>(new Map());

  useEffect(() => {
    if (!profile?.company_id) {
      setAssigneeMap(new Map());
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabaseZaptro
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('company_id', profile.company_id);
      if (cancelled) return;
      const map = new Map<string, AssigneeInfo>();
      for (const row of data ?? []) {
        const id = String(row.id);
        map.set(id, {
          id,
          name: String(row.full_name || row.email || 'Colaborador').trim(),
          avatar: resolveMemberAvatarUrl(
            { id, avatar_url: row.avatar_url },
            profile.id,
            profile,
          ),
          color: zaptroCollaboratorColor(id),
        });
      }
      if (isZaptroTeamDemoEnabled()) {
        for (const demo of buildZaptroDemoTeamMembers(profile.company_id)) {
          if (!map.has(demo.id)) {
            map.set(demo.id, {
              id: demo.id,
              name: demo.full_name,
              avatar: null,
              color: zaptroCollaboratorColor(demo.id),
            });
          }
        }
      }
      setAssigneeMap(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.company_id, profile?.id, profile]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const companyId = profile?.company_id || ZAPTRO_DEMO_COMPANY_ID;
    const demoEnabled = isZaptroClientsDemoEnabled();

    if (!profile?.company_id) {
      if (activeTab === 'clients' && demoEnabled) {
        setClients(buildZaptroDemoClients(companyId));
      } else {
        setClients([]);
      }
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabaseZaptro
        .from('whatsapp_conversations')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('crm_type', activeTab === 'clients' ? 'client' : 'lead')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      const rows = data || [];
      if (activeTab === 'clients' && demoEnabled) {
        const demos = buildZaptroDemoClients(profile.company_id);
        const demoByPhone = new Map(demos.map((d) => [normalizeClientPhone(d.sender_number), d]));
        if (rows.length === 0) {
          setClients(demos);
        } else {
          const merged = rows.map((row) => {
            const demo = demoByPhone.get(normalizeClientPhone(row.sender_number));
            if (demo?.assigned_to && !resolveClientAssigneeId(row)) {
              return { ...row, assigned_to: demo.assigned_to };
            }
            return row;
          });
          for (const d of demos) {
            if (!merged.some((r) => normalizeClientPhone(r.sender_number) === normalizeClientPhone(d.sender_number))) {
              merged.push(d);
            }
          }
          setClients(merged);
        }
      } else {
        setClients(rows);
      }
    } catch (err: unknown) {
      if (activeTab === 'clients' && demoEnabled) {
        setClients(buildZaptroDemoClients(profile.company_id));
      } else {
        setClients([]);
      }
      const message = err instanceof Error ? err.message : 'Não foi possível carregar os dados.';
      notifyZaptro('error', 'Erro ao buscar clientes', message);
    } finally {
      setLoading(false);
    }
  }, [profile?.company_id, activeTab]);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, activeTab]);

  const handleDownloadTemplate = () => {
    downloadCsvTemplate(
      'modelo_importacao_zaptro.csv',
      ['nome', 'whatsapp', 'email', 'empresa', 'cpf_ou_cnpj', 'notas'],
      [
        'Exemplo Cliente',
        '5511999999999',
        'cliente@exemplo.com',
        'Empresa Ltda',
        '12345678000199',
        'Primeiro contato',
      ],
      'Preencha o arquivo e use «Importar clientes» na barra abaixo.',
    );
  };

  const handleImportFile = async (file: File) => {
    if (!profile?.company_id) {
      notifyZaptro('error', 'Importação', 'Empresa não identificada.');
      return;
    }
    try {
      const text = await file.text();
      const rows = parseClientsCsv(text);
      if (!rows.length) {
        notifyZaptro('error', 'Importação', 'Nenhuma linha válida no arquivo CSV.');
        return;
      }
      notifyZaptro('info', 'Importação', `A importar ${rows.length} contacto(s)...`);
      const result = await importClientsCsvRows(profile.company_id, rows);
      await fetchClients();
      notifyZaptro(
        'success',
        'Importação concluída',
        `${result.imported} novos, ${result.updated} actualizados${result.failed ? `, ${result.failed} falharam` : ''}.`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao importar.';
      notifyZaptro('error', 'Importação', message);
    }
  };

  const filterClientRow = useCallback((c: (typeof clients)[number]) => {
    const q = searchTerm.toLowerCase();
    const empresa = clientCompanyName(c).toLowerCase();
    const matchesText =
      (c.sender_name?.toLowerCase() || '').includes(q) ||
      String(c.sender_number || '').includes(q) ||
      empresa.includes(q);
    const matchesStatus =
      statusFilter === 'all' ||
      c.status === statusFilter ||
      (statusFilter === 'open' && c.status === 'waiting');
    return matchesText && matchesStatus;
  }, [searchTerm, statusFilter]);

  const demoClients = useMemo(
    () =>
      isZaptroClientsDemoEnabled()
        ? buildZaptroDemoClients(profile?.company_id || ZAPTRO_DEMO_COMPANY_ID)
        : [],
    [profile?.company_id],
  );

  const filteredClients = clients.filter(filterClientRow);

  const showingDemoPreview =
    activeTab === 'clients' &&
    isZaptroClientsDemoEnabled() &&
    filteredClients.length === 0 &&
    demoClients.length > 0;

  const tableSource = showingDemoPreview ? demoClients.filter(filterClientRow) : filteredClients;
  const tableSourceFiltered = showingDemoPreview && tableSource.length === 0 ? demoClients : tableSource;

  const profilePathFor = (id: string) =>
    zaptroAppOrLegacy(
      location.pathname,
      ZAPTRO_APP_ROUTES.clientProfile(id),
      zaptroClientProfilePath(id),
    );

  const inboxPathFor = (phone: string) =>
    `${zaptroAppOrLegacy(location.pathname, ZAPTRO_APP_ROUTES.INBOX, '/whatsapp')}?c=${encodeURIComponent(phone)}`;

  const handleDeleteConfirm = async () => {
    if (!deleteClient || !profile?.company_id) return;
    setDeleteBusy(true);
    try {
      await deleteClientProfile(profile.company_id, String(deleteClient.id));
      notifyZaptro('success', 'Cliente', 'Contacto excluído da lista.');
      setDeleteClient(null);
      await fetchClients();
    } catch (err) {
      notifyZaptro('error', 'Cliente', err instanceof Error ? err.message : 'Não foi possível excluir.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const paginatedClients = tableSourceFiltered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleExportAllClients = () => {
    const source = tableSourceFiltered.length ? tableSourceFiltered : clients;
    const rows = source.map((c) => {
      const meta = c.metadata && typeof c.metadata === 'object' ? (c.metadata as Record<string, unknown>) : {};
      const email = typeof meta.email === 'string' ? meta.email : '';
      const statusLabel =
        c.status === 'open' || c.status === 'waiting'
          ? 'Em atendimento'
          : c.status === 'finished'
            ? 'Finalizado'
            : String(c.status || '');
      return {
        nome: c.sender_name || '',
        whatsapp: c.sender_number || '',
        email,
        empresa: clientCompanyName(c),
        status: statusLabel,
        ultimo_contacto: c.updated_at
          ? new Date(c.updated_at).toLocaleString('pt-BR')
          : '',
        interacoes:
          (c as { _demo_message_count?: number })._demo_message_count ??
          (Array.isArray(c.whatsapp_messages) ? c.whatsapp_messages.length : ''),
      };
    });
    if (!rows.length) {
      notifyZaptro('error', 'Exportação', 'Nenhum cliente para exportar.');
      return;
    }
    exportToExcel(rows, `clientes_zaptro_${new Date().toISOString().slice(0, 10)}`, {
      nome: 'Nome',
      whatsapp: 'WhatsApp',
      email: 'E-mail',
      empresa: 'Empresa',
      status: 'Status',
      ultimo_contacto: 'Último contacto',
      interacoes: 'Interacções',
    });
    notifyZaptro('success', 'Exportação', `${rows.length} cliente(s) exportados.`);
  };

  const kpiSource = clients.filter((c) => !isZaptroDemoClientId(String(c.id)) || isZaptroClientsDemoEnabled());
  const active24h = kpiSource.filter(
    (c) => new Date(c.updated_at) > new Date(Date.now() - 86400000),
  ).length;
  const inService = kpiSource.filter(
    (c) => c.status === 'open' || c.status === 'waiting',
  ).length;

  const kpis = [
    { label: 'Total Base', value: kpiSource.length, icon: Users },
    { label: 'Ativos 24h', value: active24h, icon: TrendingUp },
    { label: 'Em Atendimento', value: inService, icon: MessageSquare },
    {
      label: 'Taxa Retenção',
      value: kpiSource.length === 0 ? '—' : `${Math.min(100, Math.round((active24h / kpiSource.length) * 100))}%`,
      icon: Star,
    },
  ];

  const switchTab = (tab: 'clients' | 'leads') => {
    if (!showLeadsTab && tab === 'leads') return;
    setActiveTab(tab);
    if (embedded) return;
    navigate(tab === 'leads' ? '/clientes/leads' : ZAPTRO_ROUTES.CLIENTS);
  };

  return (
    <>
      <style>{`
        @keyframes zaptroClientsSpin { to { transform: rotate(360deg); } }
        .zaptro-clients-spin { animation: zaptroClientsSpin 0.9s linear infinite; }
        .hover-scale { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .hover-scale:hover { transform: scale(1.01) translateY(-2px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1) !important; }
      `}</style>
      <div className="zaptro-clients-panel" style={styles.container}>
        <header className="zaptro-clients-panel__header" style={styles.header}>
          <div style={styles.headerInfo}>
            <h1 style={styles.title}>Clientes</h1>
            <p className="zaptro-clients-panel__subtitle" style={styles.subtitle}>
              Gestão estratégica de todos os contatos atendidos pela sua central.
            </p>
          </div>
        </header>

        <div className="zaptro-clients-panel__kpi-grid" style={styles.kpiGrid}>
          {kpis.map((k) => (
            <ZaptroKpiMetricCard
              key={k.label}
              className="zaptro-clients-panel__kpi-card"
              icon={k.icon}
              title={k.label}
              value={k.value}
              valueSize="md"
            />
          ))}
        </div>

        {showLeadsTab ? (
          <div style={{ display: 'flex', gap: 8, marginBottom: 32, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => switchTab('clients')}
              className="hover-scale"
              style={{
                padding: '8px 18px',
                borderRadius: 14,
                backgroundColor: activeTab === 'clients' ? '#000' : 'transparent',
                color: activeTab === 'clients' ? '#D9FF00' : '#949494',
                fontWeight: 700,
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Clientes Base
            </button>
            <button
              type="button"
              onClick={() => switchTab('leads')}
              className="hover-scale"
              style={{
                padding: '8px 18px',
                borderRadius: 14,
                backgroundColor: activeTab === 'leads' ? '#000' : 'transparent',
                color: activeTab === 'leads' ? '#D9FF00' : '#949494',
                fontWeight: 700,
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Leads & Oportunidades
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 24, marginTop: 12 }} />
        )}

        {activeTab === 'clients' ? (
          <div style={styles.listSection}>
            <div className="zaptro-clients-panel__toolbar">
              <div className="zaptro-clients-panel__toolbar-filters">
                <div className="zaptro-clients-panel__search-box">
                  <Search size={18} color="#949494" />
                  <input
                    className="zaptro-clients-panel__field"
                    placeholder="Buscar por nome ou WhatsApp..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="zaptro-clients-panel__search-box zaptro-clients-panel__search-box--status">
                  <Filter size={18} color="#949494" />
                  <select
                    className="zaptro-clients-panel__field zaptro-clients-panel__select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Todos os Status</option>
                    <option value="open">Em Atendimento</option>
                    <option value="finished">Finalizados</option>
                  </select>
                </div>
                <ZaptroListImportToolbar
                  inputId="zaptro-clients-import-input"
                  exportLabel="Baixar clientes"
                  importLabel="Importar clientes"
                  templateLabel="Modelo"
                  onExport={handleExportAllClients}
                  onImport={handleImportFile}
                  onDownloadTemplate={handleDownloadTemplate}
                />
              </div>
            </div>

            {showingDemoPreview || (isZaptroClientsDemoEnabled() && activeTab === 'clients' && tableSourceFiltered.some((c) => isZaptroDemoClientId(String(c.id)))) ? (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(217, 255, 0, 0.12)',
                  border: '1px solid rgba(217, 255, 0, 0.35)',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                Pré-visualização — clientes activos demo (cadastro, status, interacções e histórico)
              </div>
            ) : null}

            {loading ? (
              <div style={styles.loadingArea}>
                <Loader2 className="zaptro-clients-spin" size={32} color="#000" />
              </div>
            ) : (
              <>
                <div style={styles.tableCard}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>CLIENTE</th>
                        <th style={styles.th}>STATUS</th>
                        <th style={styles.th}>ÚLTIMO CONTATO</th>
                        <th style={styles.th}>INTERAÇÕES</th>
                        <th style={styles.th}>AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!paginatedClients.length ? (
                        <tr>
                          <td
                            colSpan={5}
                            style={{
                              ...styles.td,
                              textAlign: 'center',
                              padding: 48,
                              color: '#949494',
                              fontWeight: 700,
                            }}
                          >
                            Nenhum contacto corresponde à busca. Limpa o filtro ou altera o termo.
                          </td>
                        </tr>
                      ) : (
                        paginatedClients.map((c) => {
                          const empresa = clientCompanyName(c);
                          const msgCount =
                            (c as { _demo_message_count?: number })._demo_message_count ??
                            c.whatsapp_messages?.length ??
                            0;
                          const lastEvent =
                            c.metadata &&
                            typeof c.metadata === 'object' &&
                            'last_event' in c.metadata &&
                            typeof (c.metadata as { last_event?: unknown }).last_event === 'string'
                              ? (c.metadata as { last_event: string }).last_event
                              : c.last_message || '—';
                          const statusLabel =
                            c.status === 'open' || c.status === 'waiting'
                              ? 'EM ATENDIMENTO'
                              : 'FINALIZADO';
                          const statusOpen = c.status === 'open' || c.status === 'waiting';
                          const assigneeId = resolveClientAssigneeId(c);
                          const assignee = assigneeId
                            ? (assigneeMap.get(assigneeId) ?? {
                                id: assigneeId,
                                name: 'Colaborador',
                                avatar: null,
                                color: zaptroCollaboratorColor(assigneeId),
                              })
                            : null;
                          const showAssignee = Boolean(assignee && assigneeId);
                          return (
                            <tr
                              key={c.id}
                              style={styles.tr}
                              className="hover-scale zaptro-clients-panel__row"
                              onClick={() => navigate(profilePathFor(String(c.id)))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  navigate(profilePathFor(String(c.id)));
                                }
                              }}
                              tabIndex={0}
                              role="link"
                              aria-label={`Ver perfil de ${c.sender_name || 'cliente'}`}
                            >
                              <td className="zaptro-clients-panel__td">
                                <div style={styles.clientCell}>
                                  <div className="zaptro-clients-panel__avatar-wrap">
                                    <div style={styles.avatar}>
                                      {c.customer_avatar ? (
                                        <img src={c.customer_avatar} alt="" className="zaptro-clients-panel__avatar-img" />
                                      ) : (
                                        c.sender_name?.[0] || <User size={14} />
                                      )}
                                    </div>
                                    {showAssignee ? (
                                      <span
                                        className="zaptro-clients-panel__assignee-badge"
                                        title={`Atendido por ${assignee!.name}`}
                                        style={{ borderColor: assignee!.color }}
                                      >
                                        {assignee!.avatar ? (
                                          <img src={assignee!.avatar} alt="" />
                                        ) : (
                                          assignee!.name[0]?.toUpperCase() || '?'
                                        )}
                                      </span>
                                    ) : null}
                                  </div>
                                  <div style={styles.clientInfo}>
                                    <span style={styles.clientName}>
                                      {c.sender_name || 'Cliente S/ Nome'}
                                    </span>
                                    {empresa ? (
                                      <span style={styles.clientCompany}>{empresa}</span>
                                    ) : null}
                                    <span style={styles.clientPhone}>{c.sender_number}</span>
                                    {showAssignee ? (
                                      <ClientsPanelAssigneeChip
                                        assignee={assignee!}
                                        assigneeId={assigneeId}
                                        onNavigate={(path) => navigate(path)}
                                      />
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className="zaptro-clients-panel__td">
                                <div className="zaptro-clients-panel__status-cell">
                                  <span
                                    style={{
                                      ...styles.statBadge,
                                      backgroundColor: statusOpen ? '#EEFCEF' : '#F1F5F9',
                                      color: statusOpen ? '#10B981' : '#949494',
                                    }}
                                  >
                                    {statusLabel}
                                  </span>
                                  {statusOpen ? (
                                    showAssignee ? (
                                      <ClientsPanelAssigneeChip
                                        assignee={assignee!}
                                        assigneeId={assigneeId}
                                        onNavigate={(path) => navigate(path)}
                                      />
                                    ) : (
                                      <span className="zaptro-clients-panel__status-assignee zaptro-clients-panel__status-assignee--none">
                                        Sem responsável
                                      </span>
                                    )
                                  ) : showAssignee ? (
                                    <ClientsPanelAssigneeChip
                                      assignee={assignee!}
                                      assigneeId={assigneeId}
                                      muted
                                      onNavigate={(path) => navigate(path)}
                                    />
                                  ) : null}
                                </div>
                              </td>
                              <td className="zaptro-clients-panel__td">
                                <div style={styles.dateCell}>
                                  <Calendar size={14} color="#949494" />
                                  <span>
                                    {c.updated_at
                                      ? new Date(c.updated_at).toLocaleDateString('pt-BR')
                                      : '—'}
                                  </span>
                                </div>
                              </td>
                              <td className="zaptro-clients-panel__td">
                                <div style={styles.interactionCell}>
                                  <MessageSquare size={14} color="#D9FF00" />
                                  <span>{msgCount} msgs</span>
                                </div>
                                <span className="zaptro-clients-panel__last-event">
                                  {lastEvent}
                                </span>
                              </td>
                              <td className="zaptro-clients-panel__td zaptro-clients-panel__td--actions">
                                <div
                                  className="zaptro-clients-panel__actions"
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                >
                                  <Link
                                    to={inboxPathFor(c.sender_number)}
                                    className="zaptro-client-profile__conversar-btn zaptro-clients-panel__action-conversar"
                                    title="Conversar no WhatsApp"
                                    aria-label="Conversar no WhatsApp"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Zap size={18} strokeWidth={1.9} aria-hidden />
                                  </Link>
                                  <button
                                    type="button"
                                    className="zaptro-client-profile__edit-btn"
                                    title="Editar cliente"
                                    aria-label="Editar cliente"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditClient(c);
                                    }}
                                  >
                                    <Pencil size={18} strokeWidth={2} />
                                  </button>
                                  <button
                                    type="button"
                                    className="zaptro-client-profile__delete-btn"
                                    title="Excluir cliente"
                                    aria-label="Excluir cliente"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteClient(c);
                                    }}
                                  >
                                    <Trash2 size={18} strokeWidth={2} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <ZaptroListPagination
                  currentPage={currentPage}
                  totalPages={Math.max(1, Math.ceil(tableSourceFiltered.length / rowsPerPage))}
                  totalItems={tableSourceFiltered.length}
                  itemsPerPage={rowsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(val) => {
                    setRowsPerPage(val);
                    setCurrentPage(1);
                  }}
                />
              </>
            )}
          </div>
        ) : (
          <ZaptroLeadsTab />
        )}
      </div>

      <ZaptroClientEditModal
        open={Boolean(editClient)}
        client={
          editClient
            ? {
                id: String(editClient.id),
                sender_name: editClient.sender_name || 'Cliente',
                sender_number: editClient.sender_number || '',
                customer_avatar: editClient.customer_avatar,
                metadata: clientMetadata(editClient),
              }
            : null
        }
        companyId={profile?.company_id || ZAPTRO_DEMO_COMPANY_ID}
        onClose={() => setEditClient(null)}
        onSaved={() => void fetchClients()}
      />

      <LogtaModal
        isOpen={Boolean(deleteClient)}
        onClose={() => !deleteBusy && setDeleteClient(null)}
        title="Excluir cliente"
        width="480px"
        variant="center"
        headerStyle={{ padding: '14px 20px' }}
        contentStyle={{ padding: '16px 20px 20px' }}
      >
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#475569' }}>
          Tem a certeza que deseja excluir <strong>{deleteClient?.sender_name || 'este cliente'}</strong>?
          O histórico deixa de aparecer na lista de clientes.
        </p>
        <div className="zaptro-client-profile__edit-foot" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="hub-premium-pill secondary"
            disabled={deleteBusy}
            onClick={() => setDeleteClient(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="hub-premium-pill dark"
            disabled={deleteBusy}
            onClick={() => void handleDeleteConfirm()}
          >
            {deleteBusy ? 'A excluir…' : 'Excluir cliente'}
          </button>
        </div>
      </LogtaModal>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    width: '100%',
    minWidth: 100,
    margin: '0 auto',
    marginTop: 0,
    boxSizing: 'border-box',
    padding: 0,
    minHeight: 894,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 24,
    height: 50,
    fontSize: 13,
    marginTop: 0,
    letterSpacing: 0,
  },
  headerInfo: { flex: 1, minWidth: 0 },
  title: { fontSize: '30px', fontWeight: '700', color: '#000', margin: 0, letterSpacing: '-0.02em' },
  subtitle: { margin: '4px 0 0 0' },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '24px',
    width: '100%',
  },
  listSection: { display: 'flex', flexDirection: 'column', gap: '24px' },
  tableCard: {
    backgroundColor: 'white',
    borderRadius: '24px',
    border: '1px solid #EBEBEC',
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#FBFBFC', borderBottom: '1px solid #EBEBEC' },
  th: {
    padding: '20px 24px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  tr: { borderBottom: '1px solid #EBEBEC' },
  td: { paddingTop: 15, paddingBottom: 15, paddingLeft: 0, paddingRight: 0, fontSize: '12px' },
  clientCell: { display: 'flex', alignItems: 'center', gap: '16px' },
  clientInfo: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: '#000',
    color: '#D9FF00',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
  },
  clientName: { display: 'block', fontSize: '14px', fontWeight: '700', color: '#000' },
  clientCompany: { display: 'block', fontSize: '12px', color: '#475569', fontWeight: '600' },
  clientPhone: { display: 'block', fontSize: '12px', color: '#949494', fontWeight: '600' },
  statBadge: {
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.02em',
  },
  dateCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
  },
  interactionCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
  },
  loadingArea: { padding: '100px', textAlign: 'center' },
};

export default ZaptroClientsPanel;
