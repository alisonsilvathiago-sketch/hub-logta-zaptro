import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
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
  Users,
  Zap,
} from 'lucide-react';
import LogtaModal from '../components/Modal';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import { useAuth } from '../context/AuthContext';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import {
  hideZaptroDemoDriverId,
  isZaptroDemoDriverId,
  ZAPTRO_DEMO_DRIVERS,
} from '../constants/zaptroDriversDemo';
import { ZAPTRO_DEMO_HELPERS, type ZaptroHelperDemo } from '../constants/zaptroHelpersDemo';
import {
  employmentTypeLabel,
  mergeDriverBase,
  operationalIdTypeLabel,
  readDriverExtendedProfile,
  resolveDriverOperationalId,
  saveDriverExtendedProfile,
  vehicleOwnershipLabel,
  type DriverEmploymentType,
  type VehicleOwnershipType,
  type ZaptroDriverFullProfile,
} from '../lib/zaptroDriverProfileExtended';
import { ZAPTRO_APP_ROUTES } from './zaptroAppRoutes';
import { zaptroAgendaUrl, zaptroInboxUrl } from '../lib/zaptroProfileLinks';
import { extractPlateFromVehicleText } from '../utils/zaptroDriverVehicle';
import { zaptroCompressImageToDataUrl } from '../utils/zaptroDriverSelfProfile';
import { getZaptroDemoVehicleProfile, ZAPTRO_DEMO_VEHICLES } from '../constants/zaptroVehiclesDemo';
import { ZaptroPaginatedList } from '../components/Zaptro/ZaptroPaginatedList';
import './zaptroAppClientProfile.css';

type Tab = 'historico' | 'rotas' | 'vinculos';

type TimelineItem = {
  id: string;
  at: string;
  title: string;
  body: string;
  href?: string;
};

const DEMO_DRIVER_EDITS_KEY = 'zaptro_demo_driver_edits_v1';

type DriverEditForm = {
  name: string;
  phone: string;
  altPhone: string;
  email: string;
  address: string;
  vehicle: string;
  status: string;
  employmentType: DriverEmploymentType;
  vehicleOwnership: VehicleOwnershipType;
  joinedAt: string;
  hasHelper: boolean;
  helperIds: string[];
  notes: string;
  avatarUrl: string | null;
};

function readDemoDriverEdits(): Record<string, Partial<ZaptroDriverFullProfile>> {
  try {
    const raw = localStorage.getItem(DEMO_DRIVER_EDITS_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, Partial<ZaptroDriverFullProfile>>;
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

function saveDemoDriverEdit(id: string, patch: Partial<ZaptroDriverFullProfile>): void {
  const map = readDemoDriverEdits();
  map[id] = { ...map[id], ...patch };
  localStorage.setItem(DEMO_DRIVER_EDITS_KEY, JSON.stringify(map));
}

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

function helperEmploymentLabel(h: ZaptroHelperDemo): string {
  return h.employment === 'empresa' ? 'Ajudante da empresa' : 'Ajudante agregado';
}

function demoTimeline(driver: ZaptroDriverFullProfile): TimelineItem[] {
  const plate = extractPlateFromVehicleText(driver.vehicle || '');
  const vehicle = ZAPTRO_DEMO_VEHICLES.find((v) => v.plate.replace(/\W/g, '') === plate?.replace(/\W/g, ''));
  return [
    {
      id: 't0',
      at: driver.extended.joinedAt || new Date().toISOString(),
      title: 'Entrada na operação',
      body: `${employmentTypeLabel(driver.extended.employmentType)} · desde ${formatDate(driver.extended.joinedAt || '')}`,
      href: zaptroAgendaUrl({
        date: driver.extended.joinedAt || undefined,
        q: `Entrada ${driver.name}`,
      }),
    },
    {
      id: 't1',
      at: new Date(Date.now() - 86400000 * 2).toISOString(),
      title: 'Rota concluída',
      body: 'Entrega finalizada · cliente confirmou recebimento',
      href: ZAPTRO_APP_ROUTES.ROUTES,
    },
    {
      id: 't2',
      at: new Date(Date.now() - 86400000 * 5).toISOString(),
      title: 'Veículo vinculado',
      body: driver.vehicle || 'Sem placa',
      href: vehicle ? ZAPTRO_APP_ROUTES.vehicleProfile(vehicle.id) : undefined,
    },
    {
      id: 't3',
      at: new Date(Date.now() - 86400000 * 12).toISOString(),
      title: 'Contacto operação',
      body: 'Mensagem via WhatsApp sobre rota SP → Santos',
      href: `${ZAPTRO_APP_ROUTES.INBOX}?c=${encodeURIComponent(driver.phone)}`,
    },
  ];
}

function driverToEditForm(driver: ZaptroDriverFullProfile): DriverEditForm {
  const ex = driver.extended;
  return {
    name: driver.name,
    phone: driver.phone,
    altPhone: ex.altPhone || '',
    email: ex.email || '',
    address: ex.address || '',
    vehicle: driver.vehicle || '',
    status: driver.status || 'ativo',
    employmentType: ex.employmentType,
    vehicleOwnership: ex.vehicleOwnership,
    joinedAt: ex.joinedAt || new Date().toISOString().slice(0, 10),
    hasHelper: ex.hasHelper,
    helperIds: [...ex.helperIds],
    notes: ex.notes || '',
    avatarUrl: driver.photo_url || null,
  };
}

const ZaptroAppDriverProfilePage: React.FC = () => {
  const { driverId = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<ZaptroDriverFullProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('historico');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [editForm, setEditForm] = useState<DriverEditForm | null>(null);
  const isDemo = isZaptroDemoDriverId(driverId);

  const load = useCallback(async () => {
    if (!driverId) {
      setDriver(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (isZaptroDemoDriverId(driverId)) {
      const d = ZAPTRO_DEMO_DRIVERS.find((x) => x.id === driverId);
      const patch = readDemoDriverEdits()[driverId];
      if (d) {
        const merged = mergeDriverBase({ ...d, ...patch, id: driverId });
        if (patch?.extended) {
          merged.extended = { ...merged.extended, ...patch.extended };
        }
        setDriver(merged);
      } else {
        setDriver(null);
      }
      setLoading(false);
      return;
    }
    if (!profile?.company_id) {
      setDriver(null);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabaseZaptro
        .from('whatsapp_drivers')
        .select('id,name,phone,vehicle,status')
        .eq('id', driverId)
        .eq('company_id', profile.company_id)
        .maybeSingle();
      if (error) throw error;
      setDriver(
        data
          ? mergeDriverBase({
              id: String(data.id),
              name: data.name,
              phone: data.phone,
              vehicle: data.vehicle,
              status: data.status,
            })
          : null,
      );
    } catch {
      setDriver(null);
    } finally {
      setLoading(false);
    }
  }, [driverId, profile?.company_id]);

  useEffect(() => {
    void load();
  }, [load]);

  const timeline = useMemo(() => (driver ? demoTimeline(driver) : []), [driver]);

  const linkedVehicle = useMemo(() => {
    if (!driver?.vehicle) return null;
    const plate = extractPlateFromVehicleText(driver.vehicle);
    const demo = ZAPTRO_DEMO_VEHICLES.find(
      (v) => v.plate.replace(/\W/g, '').toUpperCase() === plate?.replace(/\W/g, '').toUpperCase(),
    );
    if (demo) return getZaptroDemoVehicleProfile(demo.id);
    return null;
  }, [driver?.vehicle]);

  const linkedHelpers = useMemo((): ZaptroHelperDemo[] => {
    if (!driver?.extended.hasHelper) return [];
    return driver.extended.helperIds
      .map((id) => ZAPTRO_DEMO_HELPERS.find((h) => h.id === id))
      .filter((h): h is ZaptroHelperDemo => Boolean(h));
  }, [driver]);

  if (loading) {
    return (
      <div className="zaptro-client-profile">
        <p style={{ color: '#949494', fontWeight: 700 }}>A carregar motorista…</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="zaptro-client-profile">
        <button type="button" className="zaptro-client-profile__back" onClick={() => navigate(ZAPTRO_APP_ROUTES.DRIVERS)}>
          <ChevronLeft size={18} /> Voltar para motoristas
        </button>
        <p style={{ color: '#949494', fontWeight: 700 }}>Motorista não encontrado.</p>
      </div>
    );
  }

  const blocked = driver.status === 'bloqueado';
  const active = driver.status === 'ativo' && !blocked;
  const operationalId = resolveDriverOperationalId(driver);
  const ex = driver.extended;

  const openEdit = () => {
    setEditForm(driverToEditForm(driver));
    setEditOpen(true);
  };

  const toggleHelper = (helperId: string) => {
    if (!editForm) return;
    const has = editForm.helperIds.includes(helperId);
    setEditForm({
      ...editForm,
      helperIds: has ? editForm.helperIds.filter((id) => id !== helperId) : [...editForm.helperIds, helperId],
      hasHelper: has ? editForm.helperIds.length > 1 : true,
    });
  };

  const handleSaveEdit = async () => {
    if (!driver || !editForm) return;
    const name = editForm.name.trim();
    const phone = editForm.phone.replace(/\D/g, '');
    if (!name || phone.length < 10) {
      notifyZaptro('warning', 'Dados incompletos', 'Nome e WhatsApp válido são obrigatórios.');
      return;
    }
    setEditSaving(true);
    try {
      const extendedPatch = {
        email: editForm.email.trim(),
        altPhone: editForm.altPhone.trim(),
        address: editForm.address.trim(),
        employmentType: editForm.employmentType,
        vehicleOwnership: editForm.vehicleOwnership,
        joinedAt: editForm.joinedAt,
        hasHelper: editForm.hasHelper && editForm.helperIds.length > 0,
        helperIds: editForm.hasHelper ? editForm.helperIds : [],
        notes: editForm.notes.trim(),
      };
      const basePatch = {
        name,
        phone,
        vehicle: editForm.vehicle.trim() || null,
        status: editForm.status,
        photo_url: editForm.avatarUrl || undefined,
      };

      saveDriverExtendedProfile(driver.id, extendedPatch);

      if (isDemo) {
        saveDemoDriverEdit(driver.id, {
          ...basePatch,
          extended: { ...readDriverExtendedProfile(driver.id) },
        });
      } else if (profile?.company_id) {
        const { error } = await supabaseZaptro
          .from('whatsapp_drivers')
          .update({
            name: basePatch.name,
            phone: basePatch.phone,
            vehicle: basePatch.vehicle,
            status: basePatch.status,
          })
          .eq('id', driver.id)
          .eq('company_id', profile.company_id);
        if (error) throw error;
      }

      const d = ZAPTRO_DEMO_DRIVERS.find((x) => x.id === driver.id);
      const patch = isDemo && d ? readDemoDriverEdits()[driver.id] : {};
      const refreshed = isDemo && d
        ? mergeDriverBase({ ...d, ...patch, ...basePatch, id: driver.id })
        : mergeDriverBase({ ...driver, ...basePatch });
      setDriver(refreshed);
      setEditOpen(false);
      notifyZaptro('success', 'Motorista actualizado', 'Todos os dados foram guardados.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível guardar.';
      notifyZaptro('error', 'Erro ao guardar', message);
    } finally {
      setEditSaving(false);
    }
  };

  const toggleBlock = async () => {
    if (!driver) return;
    const next = blocked ? 'ativo' : 'bloqueado';
    if (isDemo) {
      saveDemoDriverEdit(driver.id, { status: next });
      setDriver({ ...driver, status: next });
      notifyZaptro(
        'success',
        next === 'bloqueado' ? 'Motorista bloqueado' : 'Motorista desbloqueado',
        next === 'bloqueado'
          ? 'Sem acesso a rotas, links ou GPS até ser reactivado.'
          : 'Acesso a links de rota restaurado.',
      );
      return;
    }
    if (!profile?.company_id) return;
    try {
      const { error } = await supabaseZaptro
        .from('whatsapp_drivers')
        .update({ status: next })
        .eq('id', driver.id)
        .eq('company_id', profile.company_id);
      if (error) throw error;
      setDriver({ ...driver, status: next });
      notifyZaptro('success', next === 'bloqueado' ? 'Bloqueado' : 'Desbloqueado', 'Estado operacional actualizado.');
    } catch (err: unknown) {
      notifyZaptro('error', 'Erro', err instanceof Error ? err.message : 'Não foi possível alterar o estado.');
    }
  };

  const handleDelete = async () => {
    if (!driver) return;
    setDeleteBusy(true);
    try {
      if (isDemo) {
        hideZaptroDemoDriverId(driver.id);
        notifyZaptro('success', 'Exemplo removido', 'O motorista de demonstração foi ocultado da lista.');
      } else if (profile?.company_id) {
        const { error } = await supabaseZaptro.from('whatsapp_drivers').delete().eq('id', driver.id);
        if (error) throw error;
        notifyZaptro('success', 'Motorista excluído', 'O registo foi removido da frota.');
      }
      setDeleteOpen(false);
      navigate(ZAPTRO_APP_ROUTES.DRIVERS);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível excluir.';
      notifyZaptro('error', 'Erro ao excluir', message);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="zaptro-client-profile">
      <button type="button" className="zaptro-client-profile__back" onClick={() => navigate(ZAPTRO_APP_ROUTES.DRIVERS)}>
        <ChevronLeft size={18} /> Voltar para motoristas
      </button>

      {isDemo ? (
        <div className="zaptro-client-profile__demo">Pré-visualização — perfil completo do motorista de campo</div>
      ) : null}

      <section className="zaptro-client-profile__hero">
        <div className="zaptro-client-profile__avatar">
          {driver.photo_url ? (
            <img src={driver.photo_url} alt="" className="zaptro-client-profile__avatar-img" />
          ) : (
            driver.name?.[0] || 'M'
          )}
        </div>
        <div className="zaptro-client-profile__hero-main">
          <div className="zaptro-client-profile__name-row">
            <span
              className={`zaptro-client-profile__badge zaptro-client-profile__badge--name ${blocked ? 'zaptro-client-profile__badge--done' : active ? 'zaptro-client-profile__badge--open' : 'zaptro-client-profile__badge--done'}`}
            >
              {blocked ? 'BLOQUEADO' : active ? 'MOTORISTA ACTIVO' : 'INACTIVO'}
            </span>
            <h1 className="zaptro-client-profile__name">{driver.name}</h1>
          </div>
          <div className="zaptro-client-profile__meta">
            <span>{employmentTypeLabel(ex.employmentType)}</span>
            <span>{driver.vehicle || 'Sem veículo vinculado'}</span>
            <Link to={zaptroInboxUrl(driver.phone)} className="zaptro-client-profile__contact-value zaptro-client-profile__contact-value--link">
              {formatPhoneDisplay(driver.phone)}
            </Link>
          </div>
          <div className="zaptro-client-profile__chip-row">
            <span className={`zaptro-client-profile__chip ${ex.employmentType === 'clt' ? 'zaptro-client-profile__chip--lime' : 'zaptro-client-profile__chip--warn'}`}>
              {ex.employmentType === 'clt' ? 'Empresa' : 'Agregado'}
            </span>
            <span className="zaptro-client-profile__chip">{vehicleOwnershipLabel(ex.vehicleOwnership)}</span>
            {ex.hasHelper && linkedHelpers.length > 0 ? (
              <span className="zaptro-client-profile__chip">
                <Users size={12} /> {linkedHelpers.length} ajudante(s)
              </span>
            ) : (
              <span className="zaptro-client-profile__chip">Sem ajudante</span>
            )}
          </div>
        </div>
        <div className="zaptro-client-profile__hero-actions">
          {!blocked ? (
            <Link
              to={`${ZAPTRO_APP_ROUTES.INBOX}?c=${encodeURIComponent(driver.phone)}`}
              className="zaptro-client-profile__conversar-btn"
              title="WhatsApp"
            >
              <Zap size={18} strokeWidth={1.9} aria-hidden />
              Conversar
            </Link>
          ) : null}
          <button
            type="button"
            className="zaptro-client-profile__edit-btn"
            title="Editar motorista"
            aria-label="Editar motorista"
            onClick={openEdit}
          >
            <Pencil size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`zaptro-client-profile__block-btn ${blocked ? 'zaptro-client-profile__block-btn--active' : ''}`}
            title={blocked ? 'Desbloquear motorista' : 'Bloquear motorista — sem acesso a rotas'}
            aria-label={blocked ? 'Desbloquear motorista' : 'Bloquear motorista'}
            onClick={() => void toggleBlock()}
          >
            <ShieldBan size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="zaptro-client-profile__delete-btn"
            title="Excluir motorista"
            aria-label="Excluir motorista"
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
                {operationalIdTypeLabel(ex.primaryIdType)}: {operationalId}
              </span>
            </div>
            {blocked ? (
              <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 600, color: '#ef4444' }}>
                Bloqueado — não acede a links de rota nem partilha GPS.
              </p>
            ) : null}
          </div>
          <div className="zaptro-client-profile__card">
            <h3>Contacto</h3>
            <div className="zaptro-client-profile__info">
              <Phone size={16} color="#949494" />
              <Link to={zaptroInboxUrl(driver.phone)} className="zaptro-client-profile__contact-value zaptro-client-profile__contact-value--link">
                {formatPhoneDisplay(driver.phone)}
              </Link>
            </div>
            {ex.altPhone ? (
              <div className="zaptro-client-profile__info">
                <Phone size={16} color="#949494" />
                <Link
                  to={zaptroInboxUrl(ex.altPhone)}
                  className="zaptro-client-profile__contact-value zaptro-client-profile__contact-value--link"
                >
                  Alt. {formatPhoneDisplay(ex.altPhone)}
                </Link>
              </div>
            ) : null}
            {ex.email ? (
              <div className="zaptro-client-profile__info">
                <Mail size={16} color="#949494" />
                <a href={`mailto:${ex.email}`} className="zaptro-client-profile__contact-link">
                  {ex.email}
                </a>
              </div>
            ) : (
              <div className="zaptro-client-profile__info zaptro-client-profile__info--muted">
                <Mail size={16} color="#949494" />
                <span className="zaptro-client-profile__info-value">E-mail não cadastrado</span>
              </div>
            )}
            {ex.address ? (
              <div className="zaptro-client-profile__info">
                <MapPin size={16} color="#949494" />
                <Link to={ZAPTRO_APP_ROUTES.ROUTES} className="zaptro-client-profile__info-value zaptro-client-profile__info-value--link">
                  {ex.address}
                </Link>
              </div>
            ) : null}
          </div>

          <div className="zaptro-client-profile__card">
            <h3>Vínculo e operação</h3>
            <div className="zaptro-client-profile__info">
              <User size={16} color="#949494" />
              <span className="zaptro-client-profile__info-value">{employmentTypeLabel(ex.employmentType)}</span>
            </div>
            <div className="zaptro-client-profile__info">
              <Calendar size={16} color="#949494" />
              {ex.joinedAt ? (
                <Link
                  to={zaptroAgendaUrl({ date: ex.joinedAt, q: `Entrada ${driver.name}` })}
                  className="zaptro-client-profile__info-value zaptro-client-profile__info-value--link"
                >
                  Na empresa desde {formatDate(ex.joinedAt)}
                </Link>
              ) : (
                <span className="zaptro-client-profile__info-value">—</span>
              )}
            </div>
            <div className="zaptro-client-profile__info">
              <Truck size={16} color="#949494" />
              <span className="zaptro-client-profile__info-value">{vehicleOwnershipLabel(ex.vehicleOwnership)}</span>
            </div>
          </div>

          {linkedVehicle ? (
            <div className="zaptro-client-profile__card">
              <h3>Veículo actual</h3>
              <Link
                to={ZAPTRO_APP_ROUTES.vehicleProfile(linkedVehicle.id)}
                className="zaptro-client-profile__info zaptro-client-profile__info--link"
              >
                <Truck size={16} color="#949494" />
                <span className="zaptro-client-profile__info-value">
                  {linkedVehicle.plate} · {linkedVehicle.brand} {linkedVehicle.model}
                </span>
              </Link>
            </div>
          ) : null}

          <div className="zaptro-client-profile__card">
            <h3>Ajudantes vinculados</h3>
            {ex.hasHelper && linkedHelpers.length > 0 ? (
              linkedHelpers.map((h) => (
                <div key={h.id} className="zaptro-client-profile__info">
                  <UserPlus size={16} color="#949494" />
                  <span className="zaptro-client-profile__info-value">
                    {h.name} · {helperEmploymentLabel(h)}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#949494' }}>
                Nenhum ajudante nesta rota. Edite o perfil para vincular.
              </p>
            )}
          </div>

          {ex.notes ? (
            <div className="zaptro-client-profile__card">
              <h3>Notas internas</h3>
              <p className="zaptro-client-profile__card-note">{ex.notes}</p>
            </div>
          ) : null}
        </aside>

        <main>
          <div className="zaptro-client-profile__kpis">
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Estado</div>
              <div className="zaptro-client-profile__kpi-value">{active ? 'Activo' : 'Inactivo'}</div>
            </div>
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Tipo</div>
              <div className="zaptro-client-profile__kpi-value">{ex.employmentType === 'clt' ? 'Empresa' : 'Agregado'}</div>
            </div>
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Ajudantes</div>
              <div className="zaptro-client-profile__kpi-value">{linkedHelpers.length}</div>
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
              className={`zaptro-client-profile__tab ${activeTab === 'vinculos' ? 'zaptro-client-profile__tab--active' : ''}`}
              onClick={() => setActiveTab('vinculos')}
            >
              Vínculos
            </button>
            <button
              type="button"
              className={`zaptro-client-profile__tab ${activeTab === 'rotas' ? 'zaptro-client-profile__tab--active' : ''}`}
              onClick={() => setActiveTab('rotas')}
            >
              Rotas
            </button>
          </div>

          {activeTab === 'historico' ? (
            <ZaptroPaginatedList
              items={timeline}
              resetKey="driver-historico"
              listClassName="zaptro-client-profile__list"
              empty={<div className="zaptro-client-profile__card">Sem eventos registados ainda.</div>}
              keyExtractor={(item) => item.id}
              renderItem={(item) => {
                const inner = (
                  <>
                    <div className="zaptro-client-profile__row-icon">
                      <User size={18} color="#0f172a" />
                    </div>
                    <div className="zaptro-client-profile__row-main">
                      <p className="zaptro-client-profile__row-title">{item.title}</p>
                      <p className="zaptro-client-profile__row-body">{item.body}</p>
                    </div>
                    <div className="zaptro-client-profile__row-end">
                      <span className="zaptro-client-profile__row-date">{formatDateTime(item.at)}</span>
                      {item.href ? <ChevronRight size={16} className="zaptro-client-profile__row-chevron" /> : null}
                    </div>
                  </>
                );
                if (item.href) {
                  return (
                    <Link to={item.href} className="zaptro-client-profile__row zaptro-client-profile__row--clickable">
                      {inner}
                    </Link>
                  );
                }
                return <div className="zaptro-client-profile__row">{inner}</div>;
              }}
            />
          ) : activeTab === 'vinculos' ? (
            <div>
              <div className="zaptro-client-profile__card" style={{ marginBottom: 12 }}>
                <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: 14 }}>Resumo inteligente</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#475569', lineHeight: 1.5 }}>
                  {ex.employmentType === 'agregado'
                    ? 'Motorista agregado — o veículo pode ser dele ou de terceiro. Confirme documentos e seguro antes de liberar rotas.'
                    : 'Motorista da empresa — frota e documentação sob responsabilidade da transportadora.'}
                  {ex.hasHelper
                    ? ` Trabalha com ${linkedHelpers.length} ajudante(s) neste período.`
                    : ' Opera sem ajudante neste vínculo.'}
                </p>
              </div>
              <ZaptroPaginatedList
                items={linkedHelpers}
                resetKey="driver-vinculos-helpers"
                listClassName="zaptro-client-profile__list"
                empty={null}
                keyExtractor={(h) => h.id}
                renderItem={(h) => (
                  <div className="zaptro-client-profile__row">
                    <div className="zaptro-client-profile__row-icon">
                      <UserPlus size={18} color="#0f172a" />
                    </div>
                    <div className="zaptro-client-profile__row-main">
                      <p className="zaptro-client-profile__row-title">{h.name}</p>
                      <p className="zaptro-client-profile__row-body">
                        {helperEmploymentLabel(h)} · {formatPhoneDisplay(h.phone)}
                      </p>
                    </div>
                  </div>
                )}
              />
              {linkedVehicle ? (
                <Link
                  to={ZAPTRO_APP_ROUTES.vehicleProfile(linkedVehicle.id)}
                  className="zaptro-client-profile__row zaptro-client-profile__row--clickable"
                >
                  <div className="zaptro-client-profile__row-icon">
                    <Truck size={18} color="#0f172a" />
                  </div>
                  <div className="zaptro-client-profile__row-main">
                    <p className="zaptro-client-profile__row-title">Frota · {linkedVehicle.plate}</p>
                    <p className="zaptro-client-profile__row-body">
                      {vehicleOwnershipLabel(ex.vehicleOwnership)} · {linkedVehicle.brand} {linkedVehicle.model}
                    </p>
                  </div>
                  <ChevronRight size={16} className="zaptro-client-profile__row-chevron" />
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="zaptro-client-profile__list">
              <Link to={ZAPTRO_APP_ROUTES.ROUTES} className="zaptro-client-profile__row zaptro-client-profile__row--clickable">
                <div className="zaptro-client-profile__row-icon">
                  <Route size={18} color="#0f172a" />
                </div>
                <div className="zaptro-client-profile__row-main">
                  <p className="zaptro-client-profile__row-title">Central Logística</p>
                  <p className="zaptro-client-profile__row-body">Ver rotas activas e vincular este motorista</p>
                </div>
                <ChevronRight size={16} className="zaptro-client-profile__row-chevron" />
              </Link>
            </div>
          )}
        </main>
      </div>

      <LogtaModal
        isOpen={editOpen && !!editForm}
        onClose={() => setEditOpen(false)}
        title="Editar motorista"
        width="640px"
        variant="center"
        headerStyle={{ padding: '14px 20px' }}
        contentStyle={{ padding: '16px 20px 20px' }}
      >
        {editForm ? (
          <div className="zaptro-client-profile__edit-modal">
            <div className="zaptro-client-profile__edit-photo">
              <div className="zaptro-client-profile__edit-photo-preview">
                {editForm.avatarUrl ? (
                  <img src={editForm.avatarUrl} alt="" />
                ) : (
                  editForm.name?.[0]?.toUpperCase() || 'M'
                )}
              </div>
              <div>
                <label className="zaptro-client-profile__edit-label">
                  Foto do motorista
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (!f) return;
                      const url = await zaptroCompressImageToDataUrl(f);
                      if (url) setEditForm({ ...editForm, avatarUrl: url });
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="zaptro-client-profile__edit-grid">
              <label className="zaptro-client-profile__edit-label zaptro-client-profile__edit-grid--full">
                Nome *
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </label>
              <label className="zaptro-client-profile__edit-label">
                Tipo de vínculo
                <select
                  value={editForm.employmentType}
                  onChange={(e) =>
                    setEditForm({ ...editForm, employmentType: e.target.value as DriverEmploymentType })
                  }
                >
                  <option value="clt">Motorista da empresa (CLT)</option>
                  <option value="agregado">Motorista agregado</option>
                </select>
              </label>
              <label className="zaptro-client-profile__edit-label">
                Propriedade do veículo
                <select
                  value={editForm.vehicleOwnership}
                  onChange={(e) =>
                    setEditForm({ ...editForm, vehicleOwnership: e.target.value as VehicleOwnershipType })
                  }
                >
                  <option value="empresa">Veículo da empresa</option>
                  <option value="agregado">Veículo do agregado</option>
                  <option value="terceiro">Veículo terceiro / parceiro</option>
                </select>
              </label>
              <label className="zaptro-client-profile__edit-label">
                WhatsApp *
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  inputMode="tel"
                />
              </label>
              <label className="zaptro-client-profile__edit-label">
                Telefone secundário
                <input
                  value={editForm.altPhone}
                  onChange={(e) => setEditForm({ ...editForm, altPhone: e.target.value })}
                  inputMode="tel"
                />
              </label>
              <label className="zaptro-client-profile__edit-label">
                E-mail
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </label>
              <label className="zaptro-client-profile__edit-label">
                Entrada na operação
                <input
                  type="date"
                  value={editForm.joinedAt}
                  onChange={(e) => setEditForm({ ...editForm, joinedAt: e.target.value })}
                />
              </label>
              <label className="zaptro-client-profile__edit-label zaptro-client-profile__edit-grid--full">
                Endereço
                <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </label>
              <label className="zaptro-client-profile__edit-label zaptro-client-profile__edit-grid--full">
                Veículo / placa
                <input value={editForm.vehicle} onChange={(e) => setEditForm({ ...editForm, vehicle: e.target.value })} />
              </label>
              <label className="zaptro-client-profile__edit-label">
                Estado operacional
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="ativo">Activo</option>
                  <option value="inativo">Inactivo</option>
                </select>
              </label>
              <label className="zaptro-client-profile__edit-label zaptro-client-profile__edit-grid--full">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={editForm.hasHelper}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        hasHelper: e.target.checked,
                        helperIds: e.target.checked ? editForm.helperIds : [],
                      })
                    }
                  />
                  Trabalha com ajudante(s)
                </span>
              </label>
              {editForm.hasHelper ? (
                <div className="zaptro-client-profile__edit-label zaptro-client-profile__edit-grid--full">
                  Ajudantes (podem mudar de motorista por dia)
                  <div className="zaptro-client-profile__helper-pick">
                    {ZAPTRO_DEMO_HELPERS.map((h) => (
                      <label key={h.id}>
                        <input
                          type="checkbox"
                          checked={editForm.helperIds.includes(h.id)}
                          onChange={() => toggleHelper(h.id)}
                        />
                        {h.name} · {helperEmploymentLabel(h)}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
              <label className="zaptro-client-profile__edit-label zaptro-client-profile__edit-grid--full">
                Notas internas
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </label>
            </div>

            <div className="zaptro-client-profile__edit-foot">
              <button type="button" className="hub-premium-pill secondary" onClick={() => setEditOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="hub-premium-pill dark"
                disabled={editSaving || !editForm.name.trim() || !editForm.phone.trim()}
                onClick={() => void handleSaveEdit()}
              >
                {editSaving ? 'A guardar…' : 'Guardar alterações'}
              </button>
            </div>
          </div>
        ) : null}
      </LogtaModal>

      <LogtaModal
        isOpen={deleteOpen}
        onClose={() => !deleteBusy && setDeleteOpen(false)}
        title={isDemo ? 'Remover exemplo?' : 'Excluir motorista?'}
        width="480px"
        variant="center"
      >
        <p style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 600, color: '#475569', lineHeight: 1.5 }}>
          {isDemo
            ? `O motorista de demonstração "${driver.name}" será ocultado deste browser.`
            : `Confirma a exclusão de "${driver.name}"? Esta acção remove o registo da frota.`}
        </p>
        <div className="zaptro-client-profile__edit-foot">
          <button type="button" className="hub-premium-pill secondary" disabled={deleteBusy} onClick={() => setDeleteOpen(false)}>
            Cancelar
          </button>
          <button
            type="button"
            className="hub-premium-pill dark"
            style={{ background: '#dc2626', borderColor: '#dc2626' }}
            disabled={deleteBusy}
            onClick={() => void handleDelete()}
          >
            {deleteBusy ? 'A excluir…' : 'Excluir motorista'}
          </button>
        </div>
      </LogtaModal>
    </div>
  );
};

export default ZaptroAppDriverProfilePage;
