import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Route,
  ShieldBan,
  Trash2,
  Truck,
  User,
  UserPlus,
} from 'lucide-react';
import LogtaModal from '../components/Modal';
import {
  ZaptroHelperRegisterModal,
  helperToRegisterForm,
} from '../components/Zaptro/ZaptroHelperRegisterModal';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import {
  getZaptroDemoHelper,
  helperEmploymentLabel,
  hideZaptroDemoHelperId,
  saveDemoHelperEdit,
} from '../constants/zaptroHelpersDemo';
import {
  getDemoHelperOperations,
  getHelperExtended,
  getHelperLinkedDrivers,
  getHelperUsedVehicles,
  helperPrimaryIdTypeLabel,
  resolveHelperOperationalId,
} from '../lib/zaptroHelperProfileExtended';
import { ZAPTRO_APP_ROUTES } from './zaptroAppRoutes';
import {
  zaptroAgendaUrl,
  zaptroClientProfileUrl,
  zaptroInboxUrl,
} from '../lib/zaptroProfileLinks';
import { ZaptroPaginatedList } from '../components/Zaptro/ZaptroPaginatedList';
import './zaptroAppClientProfile.css';

type Tab = 'historico' | 'rotas' | 'vinculos';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return phone.trim() || '—';
}

function operationStatusLabel(s: 'concluida' | 'em_andamento' | 'cancelada'): string {
  if (s === 'em_andamento') return 'Em andamento';
  if (s === 'cancelada') return 'Cancelada';
  return 'Concluída';
}

const ZaptroAppHelperProfilePage: React.FC = () => {
  const { helperId = '' } = useParams();
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('historico');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const helper = useMemo(() => getZaptroDemoHelper(helperId), [helperId, version]);
  const extended = useMemo(() => (helper ? getHelperExtended(helper.id) : {}), [helper, version]);
  const operations = useMemo(() => (helper ? getDemoHelperOperations(helper.id) : []), [helper]);
  const linkedDrivers = useMemo(() => (helper ? getHelperLinkedDrivers(helper.id) : []), [helper]);
  const usedVehicles = useMemo(() => (helper ? getHelperUsedVehicles(helper.id) : []), [helper]);

  type VinculoRow =
    | { kind: 'driver'; id: string; driver: (typeof linkedDrivers)[number] }
    | { kind: 'vehicle'; id: string; vehicle: (typeof usedVehicles)[number] };

  const vinculoRows = useMemo<VinculoRow[]>(
    () => [
      ...linkedDrivers.map((d) => ({ kind: 'driver' as const, id: d.id, driver: d })),
      ...usedVehicles.map((v) => ({ kind: 'vehicle' as const, id: v.plate, vehicle: v })),
    ],
    [linkedDrivers, usedVehicles],
  );

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const editInitial = useMemo(
    () => (helper ? helperToRegisterForm(helper, extended) : undefined),
    [helper, extended],
  );
  const activeOp = useMemo(
    () => operations.find((o) => o.status === 'em_andamento'),
    [operations],
  );

  if (!helper) {
    return (
      <div className="zaptro-client-profile">
        <button type="button" className="zaptro-client-profile__back" onClick={() => navigate(ZAPTRO_APP_ROUTES.HELPERS)}>
          <ChevronLeft size={18} /> Voltar
        </button>
        <p>Ajudante não encontrado.</p>
      </div>
    );
  }

  const blocked = helper.status === 'bloqueado';
  const active = helper.status === 'ativo';
  const operationalId = resolveHelperOperationalId(helper);
  const idType = extended.primaryIdType ?? 'phone';

  const clientProfileHref = (op: { clientId?: string; clientName: string }) =>
    op.clientId ? zaptroClientProfileUrl(op.clientId) : null;

  const toggleBlock = () => {
    const next = blocked ? 'ativo' : 'bloqueado';
    saveDemoHelperEdit(helper.id, { status: next });
    reload();
    notifyZaptro(
      'success',
      next === 'bloqueado' ? 'Ajudante bloqueado' : 'Ajudante desbloqueado',
      next === 'bloqueado'
        ? 'Sem autorização para acompanhar rotas até ser reactivado.'
        : 'Pode voltar a ser vinculado a motoristas e rotas.',
    );
  };

  const handleDelete = () => {
    setDeleteBusy(true);
    try {
      hideZaptroDemoHelperId(helper.id);
      notifyZaptro('success', 'Removido', 'Ajudante ocultado da lista.');
      navigate(ZAPTRO_APP_ROUTES.HELPERS);
    } finally {
      setDeleteBusy(false);
      setDeleteOpen(false);
    }
  };

  const completedOps = operations.filter((o) => o.status === 'concluida').length;

  return (
    <div className="zaptro-client-profile">
      <button type="button" className="zaptro-client-profile__back" onClick={() => navigate(ZAPTRO_APP_ROUTES.HELPERS)}>
        <ChevronLeft size={18} /> Voltar para ajudantes
      </button>

      <div className="zaptro-client-profile__demo">Pré-visualização — ficha completa do ajudante de campo</div>

      <section className="zaptro-client-profile__hero">
        <div className="zaptro-client-profile__avatar">
          {helper.photo_url ? (
            <img src={helper.photo_url} alt="" className="zaptro-client-profile__avatar-img" />
          ) : (
            helper.name?.[0]?.toUpperCase() || <UserPlus size={28} color="#d9ff00" />
          )}
        </div>
        <div className="zaptro-client-profile__hero-main">
          <div className="zaptro-client-profile__name-row">
            <span
              className={`zaptro-client-profile__badge zaptro-client-profile__badge--name ${blocked ? 'zaptro-client-profile__badge--done' : active ? 'zaptro-client-profile__badge--open' : 'zaptro-client-profile__badge--done'}`}
            >
              {blocked ? 'BLOQUEADO' : active ? 'AJUDANTE ACTIVO' : 'INACTIVO'}
            </span>
            <h1 className="zaptro-client-profile__name">{helper.name}</h1>
          </div>
          <div className="zaptro-client-profile__meta">
            <span>{helperEmploymentLabel(helper.employment)}</span>
            <Link to={zaptroInboxUrl(helper.phone)} className="zaptro-client-profile__contact-value zaptro-client-profile__contact-value--link">
              {formatPhoneDisplay(helper.phone)}
            </Link>
            {helper.cpf ? <span>CPF {helper.cpf}</span> : null}
          </div>
          <div className="zaptro-client-profile__chip-row">
            <span className={`zaptro-client-profile__chip ${helper.employment === 'empresa' ? 'zaptro-client-profile__chip--lime' : 'zaptro-client-profile__chip--warn'}`}>
              {helper.employment === 'empresa' ? 'Empresa' : 'Agregado'}
            </span>
            <span className="zaptro-client-profile__chip">{completedOps} rotas concluídas</span>
            <span className="zaptro-client-profile__chip">{linkedDrivers.length} motorista(s)</span>
          </div>
        </div>
        <div className="zaptro-client-profile__hero-actions">
          <button
            type="button"
            className="zaptro-client-profile__edit-btn"
            title="Editar ajudante"
            aria-label="Editar ajudante"
            onClick={() => setEditOpen(true)}
          >
            <Pencil size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`zaptro-client-profile__block-btn ${blocked ? 'zaptro-client-profile__block-btn--active' : ''}`}
            title={blocked ? 'Desbloquear ajudante' : 'Bloquear ajudante'}
            aria-label={blocked ? 'Desbloquear ajudante' : 'Bloquear ajudante'}
            onClick={toggleBlock}
          >
            <ShieldBan size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="zaptro-client-profile__delete-btn"
            title="Excluir"
            aria-label="Excluir ajudante"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={18} strokeWidth={2} />
          </button>
        </div>
      </section>

      <div className="zaptro-client-profile__grid">
        <aside className="zaptro-client-profile__side">
          <div className="zaptro-client-profile__card">
            <h3>Identificação</h3>
            <div className="zaptro-client-profile__info">
              <span className="zaptro-client-profile__info-value">
                {helperPrimaryIdTypeLabel(idType)}: {operationalId}
              </span>
            </div>
            {blocked ? (
              <p className="zaptro-client-profile__muted-note zaptro-client-profile__muted-note--danger">
                Bloqueado — não pode acompanhar motoristas nem rotas.
              </p>
            ) : null}
          </div>

          <div className="zaptro-client-profile__card">
            <h3>Contacto</h3>
            <div className="zaptro-client-profile__info">
              <Phone size={16} color="#949494" />
              <Link to={zaptroInboxUrl(helper.phone)} className="zaptro-client-profile__contact-value zaptro-client-profile__contact-value--link">
                {formatPhoneDisplay(helper.phone)}
              </Link>
            </div>
            {extended.altPhone ? (
              <div className="zaptro-client-profile__info">
                <Phone size={16} color="#949494" />
                <Link
                  to={zaptroInboxUrl(extended.altPhone)}
                  className="zaptro-client-profile__contact-value zaptro-client-profile__contact-value--link"
                >
                  Alt. {formatPhoneDisplay(extended.altPhone)}
                </Link>
              </div>
            ) : null}
            {helper.email ? (
              <div className="zaptro-client-profile__info">
                <Mail size={16} color="#949494" />
                <a href={`mailto:${helper.email}`} className="zaptro-client-profile__contact-link">
                  {helper.email}
                </a>
              </div>
            ) : (
              <div className="zaptro-client-profile__info zaptro-client-profile__info--muted">
                <Mail size={16} color="#949494" />
                <span className="zaptro-client-profile__info-value">E-mail não cadastrado</span>
              </div>
            )}
            {helper.cpf ? (
              <div className="zaptro-client-profile__info">
                <User size={16} color="#949494" />
                <span className="zaptro-client-profile__info-value">CPF {helper.cpf}</span>
              </div>
            ) : null}
            {extended.address ? (
              <div className="zaptro-client-profile__info">
                <MapPin size={16} color="#949494" />
                <Link to={ZAPTRO_APP_ROUTES.ROUTES} className="zaptro-client-profile__info-value zaptro-client-profile__info-value--link">
                  {extended.address}
                </Link>
              </div>
            ) : null}
          </div>

          {activeOp ? (
            <div className="zaptro-client-profile__card">
              <h3>Entrega em curso</h3>
              {clientProfileHref(activeOp) ? (
                <Link
                  to={clientProfileHref(activeOp)!}
                  className="zaptro-client-profile__info zaptro-client-profile__info--link"
                >
                  <Building2 size={16} color="#949494" />
                  <span className="zaptro-client-profile__info-value">{activeOp.clientName}</span>
                </Link>
              ) : (
                <div className="zaptro-client-profile__info">
                  <Building2 size={16} color="#949494" />
                  <span className="zaptro-client-profile__info-value">{activeOp.clientName}</span>
                </div>
              )}
              <Link to={ZAPTRO_APP_ROUTES.ROUTES} className="zaptro-client-profile__info zaptro-client-profile__info--link">
                <Route size={16} color="#949494" />
                <span className="zaptro-client-profile__info-value">Ver rota no mapa</span>
              </Link>
            </div>
          ) : null}

          <div className="zaptro-client-profile__card">
            <h3>Vínculo</h3>
            <div className="zaptro-client-profile__info">
              <Building2 size={16} color="#949494" />
              <span className="zaptro-client-profile__info-value">{helperEmploymentLabel(helper.employment)}</span>
            </div>
            {helper.employment === 'agregado' && extended.aggregatorBase ? (
              <div className="zaptro-client-profile__info">
                <MapPin size={16} color="#949494" />
                <span className="zaptro-client-profile__info-value">{extended.aggregatorBase}</span>
              </div>
            ) : null}
            <div className="zaptro-client-profile__info">
              <Calendar size={16} color="#949494" />
              {helper.joinedAt ? (
                <Link
                  to={zaptroAgendaUrl({ date: helper.joinedAt, q: `Entrada ${helper.name}` })}
                  className="zaptro-client-profile__info-value zaptro-client-profile__info-value--link"
                >
                  Desde {formatDate(helper.joinedAt)}
                </Link>
              ) : (
                <span className="zaptro-client-profile__info-value">—</span>
              )}
            </div>
          </div>

          <div className="zaptro-client-profile__card">
            <h3>Segurança operacional</h3>
            <p className="zaptro-client-profile__muted-note">
              Ajudantes vinculados ao motorista reduzem risco de furto e facilitam rastreio em dupla. Confirme ID e vínculo antes
              de cada rota.
            </p>
            {extended.notes || helper.notes ? (
              <p className="zaptro-client-profile__muted-note" style={{ marginTop: 8 }}>
                {extended.notes || helper.notes}
              </p>
            ) : null}
          </div>
        </aside>

        <main>
          <div className="zaptro-client-profile__kpis">
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Estado</div>
              <div className="zaptro-client-profile__kpi-value">{active ? 'Activo' : blocked ? 'Bloqueado' : 'Inactivo'}</div>
            </div>
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Rotas</div>
              <div className="zaptro-client-profile__kpi-value">{operations.length}</div>
            </div>
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Motoristas</div>
              <div className="zaptro-client-profile__kpi-value">{linkedDrivers.length}</div>
            </div>
          </div>

          <div className="zaptro-client-profile__tabs">
            <button
              type="button"
              className={`zaptro-client-profile__tab ${activeTab === 'historico' ? 'zaptro-client-profile__tab--active' : ''}`}
              onClick={() => setActiveTab('historico')}
            >
              Histórico
            </button>
            <button
              type="button"
              className={`zaptro-client-profile__tab ${activeTab === 'rotas' ? 'zaptro-client-profile__tab--active' : ''}`}
              onClick={() => setActiveTab('rotas')}
            >
              Operações
            </button>
            <button
              type="button"
              className={`zaptro-client-profile__tab ${activeTab === 'vinculos' ? 'zaptro-client-profile__tab--active' : ''}`}
              onClick={() => setActiveTab('vinculos')}
            >
              Vínculos
            </button>
          </div>

          {activeTab === 'historico' ? (
            <ZaptroPaginatedList
              items={operations}
              resetKey="helper-historico"
              listClassName="zaptro-client-profile__list"
              empty={<div className="zaptro-client-profile__card">Sem operações registadas ainda.</div>}
              keyExtractor={(op) => op.id}
              renderItem={(op) => {
                const rowHref =
                  op.status === 'em_andamento'
                    ? ZAPTRO_APP_ROUTES.ROUTES
                    : zaptroAgendaUrl({ date: op.workDate, q: op.clientName, eventId: op.id });
                const clientHref = clientProfileHref(op);
                return (
                  <div
                    role="link"
                    tabIndex={0}
                    className="zaptro-client-profile__row zaptro-client-profile__row--clickable"
                    onClick={() => navigate(rowHref)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(rowHref);
                      }
                    }}
                  >
                    <div className="zaptro-client-profile__row-icon">
                      <Route size={18} color="#0f172a" />
                    </div>
                    <div className="zaptro-client-profile__row-main">
                      <p className="zaptro-client-profile__row-title">{op.routeLabel}</p>
                      <p className="zaptro-client-profile__row-body">
                        {formatDate(op.workDate)} ·{' '}
                        {clientHref ? (
                          <button
                            type="button"
                            className="zaptro-client-profile__contact-link"
                            style={{ display: 'inline', padding: 0, border: 'none', background: 'none', cursor: 'pointer', font: 'inherit' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(clientHref);
                            }}
                          >
                            {op.clientName}
                          </button>
                        ) : (
                          op.clientName
                        )}{' '}
                        · {operationStatusLabel(op.status)}
                      </p>
                      <p className="zaptro-client-profile__row-body">
                        Motorista {op.driverName} · {op.vehiclePlate} {op.vehicleModel}
                        {op.arrivedAt ? ` · chegada ${formatDateTime(op.arrivedAt)}` : ''}
                        {op.finishedAt ? ` · saída ${formatDateTime(op.finishedAt)}` : ''}
                      </p>
                    </div>
                    <div className="zaptro-client-profile__row-end">
                      <span className="zaptro-client-profile__row-date">{formatDateTime(op.at)}</span>
                    </div>
                  </div>
                );
              }}
            />
          ) : activeTab === 'rotas' ? (
            <div>
              <ZaptroPaginatedList
                items={operations}
                resetKey="helper-rotas"
                listClassName="zaptro-client-profile__list"
                empty={<div className="zaptro-client-profile__card">Nenhuma rota registada para este ajudante.</div>}
                keyExtractor={(op) => op.id}
                renderItem={(op) => {
                  const rowHref =
                    op.status === 'em_andamento'
                      ? ZAPTRO_APP_ROUTES.ROUTES
                      : zaptroAgendaUrl({ date: op.workDate, q: op.clientName, eventId: op.id });
                  const clientHref = clientProfileHref(op);
                  return (
                    <div
                      role="link"
                      tabIndex={0}
                      className="zaptro-client-profile__row zaptro-client-profile__row--clickable"
                      onClick={() => navigate(rowHref)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(rowHref);
                        }
                      }}
                    >
                      <div className="zaptro-client-profile__row-icon">
                        <Clock size={18} color="#0f172a" />
                      </div>
                      <div className="zaptro-client-profile__row-main">
                        {clientHref ? (
                          <button
                            type="button"
                            className="zaptro-client-profile__row-title"
                            style={{ textAlign: 'left', padding: 0, border: 'none', background: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(clientHref);
                            }}
                          >
                            {op.clientName}
                          </button>
                        ) : (
                          <p className="zaptro-client-profile__row-title">{op.clientName}</p>
                        )}
                        <p className="zaptro-client-profile__row-body">
                          Dia {formatDate(op.workDate)} · início {formatDateTime(op.at)}
                        </p>
                        <p className="zaptro-client-profile__row-body">
                          Com {op.driverName} · veículo {op.vehiclePlate} ({op.vehicleModel})
                        </p>
                      </div>
                      <span
                        className={`zaptro-client-profile__chip ${op.status === 'concluida' ? 'zaptro-client-profile__chip--lime' : op.status === 'em_andamento' ? '' : 'zaptro-client-profile__chip--warn'}`}
                        style={{ alignSelf: 'center' }}
                      >
                        {operationStatusLabel(op.status)}
                      </span>
                    </div>
                  );
                }}
              />
              <div className="zaptro-client-profile__list">
                <Link to={ZAPTRO_APP_ROUTES.ROUTES} className="zaptro-client-profile__row zaptro-client-profile__row--clickable">
                  <div className="zaptro-client-profile__row-icon">
                    <Route size={18} color="#0f172a" />
                  </div>
                  <div className="zaptro-client-profile__row-main">
                    <p className="zaptro-client-profile__row-title">Central Logística</p>
                    <p className="zaptro-client-profile__row-body">Ver rotas activas e vincular ajudante</p>
                  </div>
                  <ChevronRight size={16} className="zaptro-client-profile__row-chevron" />
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="zaptro-client-profile__card" style={{ marginBottom: 12 }}>
                <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: 13 }}>Resumo de vínculos</p>
                <p className="zaptro-client-profile__muted-note">
                  {helper.employment === 'agregado'
                    ? 'Ajudante do agregado — confirme base, documentos e motorista responsável em cada dia de trabalho.'
                    : 'Ajudante da empresa — pode rodar entre motoristas CLT conforme escala.'}
                </p>
              </div>
              <ZaptroPaginatedList
                items={vinculoRows}
                resetKey="helper-vinculos"
                listClassName="zaptro-client-profile__list"
                empty={null}
                keyExtractor={(row) => `${row.kind}-${row.id}`}
                renderItem={(row) =>
                  row.kind === 'driver' ? (
                    <Link
                      to={ZAPTRO_APP_ROUTES.driverProfile(row.driver.id)}
                      className="zaptro-client-profile__row zaptro-client-profile__row--clickable"
                    >
                      <div className="zaptro-client-profile__row-icon">
                        {row.driver.photo_url ? (
                          <img src={row.driver.photo_url} alt="" className="zaptro-client-profile__avatar-img" style={{ width: 36, height: 36, borderRadius: 10 }} />
                        ) : (
                          <User size={18} color="#0f172a" />
                        )}
                      </div>
                      <div className="zaptro-client-profile__row-main">
                        <p className="zaptro-client-profile__row-title">{row.driver.name}</p>
                        <p className="zaptro-client-profile__row-body">
                          {formatPhoneDisplay(row.driver.phone)} · {row.driver.vehicle || 'Sem veículo'}
                        </p>
                      </div>
                      <ChevronRight size={16} className="zaptro-client-profile__row-chevron" />
                    </Link>
                  ) : (
                    <div className="zaptro-client-profile__row">
                      <div className="zaptro-client-profile__row-icon">
                        <Truck size={18} color="#0f172a" />
                      </div>
                      <div className="zaptro-client-profile__row-main">
                        <p className="zaptro-client-profile__row-title">{row.vehicle.plate}</p>
                        <p className="zaptro-client-profile__row-body">
                          {row.vehicle.brand} {row.vehicle.model} · utilizado neste período
                        </p>
                      </div>
                    </div>
                  )
                }
              />
              {vinculoRows.length === 0 ? (
                <div className="zaptro-client-profile__card">
                  Sem motoristas vinculados. Configure em{' '}
                  <Link to={ZAPTRO_APP_ROUTES.DRIVERS} style={{ color: '#0f172a', fontWeight: 700 }}>
                    Motoristas da Operação
                  </Link>
                  .
                </div>
              ) : null}
            </div>
          )}
        </main>
      </div>

      <ZaptroHelperRegisterModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={reload}
        editHelperId={helper.id}
        initial={editInitial}
      />

      <LogtaModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Excluir ajudante" width="420px" variant="center">
        <p className="zaptro-client-profile__muted-note">Remover {helper.name} da lista? Esta acção oculta o registo demo.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" className="hub-premium-pill" onClick={() => setDeleteOpen(false)}>
            Cancelar
          </button>
          <button type="button" className="hub-premium-pill dark" disabled={deleteBusy} onClick={handleDelete}>
            Excluir
          </button>
        </div>
      </LogtaModal>
    </div>
  );
};

export default ZaptroAppHelperProfilePage;
