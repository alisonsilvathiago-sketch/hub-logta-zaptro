import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Edit2,
  FileText,
  Navigation,
  RefreshCw,
  Tag,
  Trash2,
  Truck,
  User,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import {
  getZaptroDemoVehicleProfile,
  hideZaptroDemoVehicleId,
  isZaptroDemoVehicleId,
  type ZaptroVehicleProfileDetail,
} from '../constants/zaptroVehiclesDemo';
import { ZAPTRO_APP_ROUTES } from './zaptroAppRoutes';
import { vehicleOwnershipLabel } from '../lib/zaptroDriverProfileExtended';
import LogtaModal from '../components/Modal';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import {
  vehicleToRegisterForm,
  ZaptroVehicleRegisterModal,
} from '../components/Zaptro/ZaptroVehicleRegisterModal';
import { ZaptroPaginatedList } from '../components/Zaptro/ZaptroPaginatedList';
import './zaptroAppClientProfile.css';

type Tab = 'resumo' | 'manutencao' | 'historico';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function statusLabel(s: ZaptroVehicleProfileDetail['status']): string {
  if (s === 'disponivel') return 'DISPONÍVEL';
  if (s === 'em_rota') return 'EM ROTA';
  if (s === 'manutencao') return 'MANUTENÇÃO';
  return 'INATIVO';
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function buildActionItems(v: ZaptroVehicleProfileDetail): { label: string; tone: 'ok' | 'warn' | 'danger' }[] {
  const items: { label: string; tone: 'ok' | 'warn' | 'danger' }[] = [];
  const lic = daysUntil(v.licenseDue);
  if (lic != null && lic < 0) items.push({ label: 'Licenciamento vencido — renovar documento', tone: 'danger' });
  else if (lic != null && lic <= 30) items.push({ label: `Licenciamento vence em ${lic} dias`, tone: 'warn' });
  else items.push({ label: 'Licenciamento em dia', tone: 'ok' });

  const ins = daysUntil(v.insuranceDue);
  if (ins != null && ins < 0) items.push({ label: 'Seguro vencido — regularizar', tone: 'danger' });
  else if (ins != null && ins <= 30) items.push({ label: `Seguro vence em ${ins} dias`, tone: 'warn' });

  if (v.financed) {
    items.push({
      label: v.financingOverdue ? 'Financiamento em atraso' : 'Financiamento em dia',
      tone: v.financingOverdue ? 'danger' : 'ok',
    });
  }

  if ((v.finesCount ?? 0) > 0) {
    items.push({
      label: `${v.finesCount} multa(s) · ${formatMoney(v.finesTotalBrl ?? 0)}`,
      tone: 'warn',
    });
  }

  if (!v.hasTollTag) items.push({ label: 'Sem tag de pedágio vinculada', tone: 'warn' });
  else items.push({ label: `Tag activa${v.tagProvider ? ` · ${v.tagProvider}` : ''}`, tone: 'ok' });

  const overdueMaint = v.maintenanceLog.some((m) => m.status === 'overdue');
  if (overdueMaint) items.push({ label: 'Manutenção em atraso', tone: 'danger' });

  return items;
}

const ZaptroAppVehicleProfilePage: React.FC = () => {
  const { vehicleId = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<ZaptroVehicleProfileDetail | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('resumo');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const isDemo = isZaptroDemoVehicleId(vehicleId);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      if (isZaptroDemoVehicleId(vehicleId)) {
        if (!cancelled) {
          setVehicle(getZaptroDemoVehicleProfile(vehicleId));
          setLoading(false);
        }
        return;
      }
      if (!profile?.company_id) {
        if (!cancelled) {
          setVehicle(null);
          setLoading(false);
        }
        return;
      }
      try {
        const { data, error } = await supabaseZaptro
          .from('veiculos')
          .select(`*, motorista:motoristas(id, nome)`)
          .eq('id', vehicleId)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          if (!cancelled) setVehicle(null);
          return;
        }
        const mot = data.motorista as { id?: string; nome?: string } | null;
        if (!cancelled) {
          setVehicle({
            id: String(data.id),
            plate: String(data.placa ?? '—'),
            type: String(data.tipo || 'Veículo'),
            model: String(data.modelo || '—'),
            brand: String(data.marca || '—'),
            year: String(data.ano || '—'),
            status: (data.status || 'disponivel') as ZaptroVehicleProfileDetail['status'],
            driver: mot?.nome ?? null,
            driverId: mot?.id ? String(mot.id) : null,
            driverHistory: mot?.nome
              ? [{ driverId: String(mot.id), driverName: mot.nome, from: new Date().toISOString(), to: null }]
              : [],
            maintenanceLog: [],
            hasTollTag: false,
            finesCount: 0,
            finesTotalBrl: 0,
            financed: false,
            financingOverdue: false,
          });
        }
      } catch {
        if (!cancelled) setVehicle(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [vehicleId, profile?.company_id, reloadKey]);

  const actions = useMemo(() => (vehicle ? buildActionItems(vehicle) : []), [vehicle]);
  const editInitial = useMemo(
    () => (vehicle ? vehicleToRegisterForm(vehicle) : undefined),
    [vehicle],
  );

  if (loading) {
    return (
      <div className="zaptro-client-profile">
        <p style={{ color: '#949494', fontWeight: 700 }}>A carregar veículo…</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="zaptro-client-profile">
        <button type="button" className="zaptro-client-profile__back" onClick={() => navigate(ZAPTRO_APP_ROUTES.FLEET)}>
          <ChevronLeft size={18} /> Voltar para frota
        </button>
        <p style={{ color: '#949494', fontWeight: 700 }}>Veículo não encontrado.</p>
      </div>
    );
  }

  const statusOpen = vehicle.status === 'disponivel' || vehicle.status === 'em_rota';

  const handleDelete = async () => {
    setDeleteBusy(true);
    try {
      if (isDemo) {
        hideZaptroDemoVehicleId(vehicle.id);
        notifyZaptro('success', 'Removido', 'Veículo ocultado da frota.');
        navigate(ZAPTRO_APP_ROUTES.FLEET);
        return;
      }
      const { error } = await supabaseZaptro.from('veiculos').delete().eq('id', vehicle.id);
      if (error) throw error;
      notifyZaptro('success', 'Removido', 'Veículo excluído da frota.');
      navigate(ZAPTRO_APP_ROUTES.FLEET);
    } catch (err: unknown) {
      notifyZaptro('error', 'Erro', err instanceof Error ? err.message : 'Não foi possível excluir.');
    } finally {
      setDeleteBusy(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="zaptro-client-profile">
      <button type="button" className="zaptro-client-profile__back" onClick={() => navigate(ZAPTRO_APP_ROUTES.FLEET)}>
        <ChevronLeft size={18} /> Voltar para frota
      </button>

      {isDemo ? (
        <div className="zaptro-client-profile__demo">Pré-visualização — ficha do veículo com resumo operacional</div>
      ) : null}

      <section className="zaptro-client-profile__hero">
        <div className="zaptro-client-profile__avatar">
          <Truck size={32} color="#d9ff00" strokeWidth={2.2} />
        </div>
        <div className="zaptro-client-profile__hero-main">
          <div className="zaptro-client-profile__name-row">
            <span
              className={`zaptro-client-profile__badge zaptro-client-profile__badge--name ${statusOpen ? 'zaptro-client-profile__badge--open' : 'zaptro-client-profile__badge--done'}`}
            >
              {statusLabel(vehicle.status)}
            </span>
            <h1 className="zaptro-client-profile__name">{vehicle.plate}</h1>
          </div>
          <div className="zaptro-client-profile__chip-row">
            {vehicle.vehicleOwnership ? (
              <span
                className={`zaptro-client-profile__chip ${vehicle.vehicleOwnership === 'empresa' ? 'zaptro-client-profile__chip--lime' : 'zaptro-client-profile__chip--warn'}`}
              >
                {vehicleOwnershipLabel(vehicle.vehicleOwnership)}
              </span>
            ) : null}
            <span className="zaptro-client-profile__chip">{vehicle.type}</span>
          </div>
          <div className="zaptro-client-profile__meta">
            <span>
              {vehicle.brand} {vehicle.model} · {vehicle.year}
            </span>
            <span>{vehicle.type}</span>
          </div>
        </div>
        <div className="zaptro-client-profile__hero-actions">
          <Link
            to={ZAPTRO_APP_ROUTES.ROUTES}
            className="zaptro-client-profile__icon-btn"
            title="Ver rota actual"
            aria-label="Ver rota actual"
          >
            <Navigation size={18} strokeWidth={2} />
          </Link>
          <button
            type="button"
            className="zaptro-client-profile__icon-btn"
            title="Trocar motorista"
            aria-label="Trocar motorista"
            onClick={() =>
              notifyZaptro('info', 'Trocar motorista', 'Vincule outro motorista em Motoristas da Operação ou edite o veículo.')
            }
          >
            <RefreshCw size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="zaptro-client-profile__edit-btn"
            title="Editar veículo"
            aria-label="Editar veículo"
            onClick={() => setEditOpen(true)}
          >
            <Edit2 size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="zaptro-client-profile__delete-btn"
            title="Excluir veículo"
            aria-label="Excluir veículo"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={18} strokeWidth={2} />
          </button>
        </div>
      </section>

      <div className="zaptro-client-profile__grid">
        <aside className="zaptro-client-profile__side">
          <div className="zaptro-client-profile__card">
            <h3>Motorista actual</h3>
            {vehicle.driver ? (
              <div className="zaptro-client-profile__info">
                <User size={16} color="#949494" />
                {vehicle.driverId ? (
                  <Link
                    to={ZAPTRO_APP_ROUTES.driverProfile(vehicle.driverId)}
                    className="zaptro-client-profile__contact-link"
                  >
                    {vehicle.driver}
                  </Link>
                ) : (
                  <span className="zaptro-client-profile__info-value">{vehicle.driver}</span>
                )}
              </div>
            ) : (
              <p className="zaptro-client-profile__muted-note">Sem motorista vinculado</p>
            )}
          </div>
          <div className="zaptro-client-profile__card">
            <h3>Pedágio & documentos</h3>
            <div className="zaptro-client-profile__info">
              <Tag size={16} color="#949494" />
              <span className="zaptro-client-profile__info-value">
                {vehicle.hasTollTag ? `Tag · ${vehicle.tagProvider || 'activa'}` : 'Sem tag'}
              </span>
            </div>
            <div className="zaptro-client-profile__info">
              <FileText size={16} color="#949494" />
              <span className="zaptro-client-profile__info-value">
                Licenciamento {vehicle.licenseDue ? formatDate(vehicle.licenseDue) : '—'}
              </span>
            </div>
            <div className="zaptro-client-profile__info">
              <FileText size={16} color="#949494" />
              <span className="zaptro-client-profile__info-value">
                Seguro {vehicle.insuranceDue ? formatDate(vehicle.insuranceDue) : '—'}
              </span>
            </div>
            <div className="zaptro-client-profile__info">
              <CreditCard size={16} color="#949494" />
              <span className="zaptro-client-profile__info-value">
                {vehicle.financed
                  ? vehicle.financingOverdue
                    ? 'Financiado · em atraso'
                    : 'Financiado · em dia'
                  : 'Sem financiamento'}
              </span>
            </div>
          </div>
        </aside>

        <main>
          <div className="zaptro-client-profile__kpis">
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Multas</div>
              <div className="zaptro-client-profile__kpi-value">{vehicle.finesCount ?? 0}</div>
            </div>
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Próx. manutenção</div>
              <div className="zaptro-client-profile__kpi-value">
                {vehicle.nextMaintenance && vehicle.nextMaintenance !== 'Vencida'
                  ? formatDate(vehicle.nextMaintenance)
                  : '—'}
              </div>
            </div>
            <div className="zaptro-client-profile__kpi">
              <div className="zaptro-client-profile__kpi-label">Quem usou</div>
              <div className="zaptro-client-profile__kpi-value">{vehicle.driverHistory.length}</div>
            </div>
          </div>

          <div className="zaptro-client-profile__tabs">
            <button
              type="button"
              className={`zaptro-client-profile__tab ${activeTab === 'resumo' ? 'zaptro-client-profile__tab--active' : ''}`}
              onClick={() => setActiveTab('resumo')}
            >
              O que fazer
            </button>
            <button
              type="button"
              className={`zaptro-client-profile__tab ${activeTab === 'manutencao' ? 'zaptro-client-profile__tab--active' : ''}`}
              onClick={() => setActiveTab('manutencao')}
            >
              Manutenção
            </button>
            <button
              type="button"
              className={`zaptro-client-profile__tab ${activeTab === 'historico' ? 'zaptro-client-profile__tab--active' : ''}`}
              onClick={() => setActiveTab('historico')}
            >
              Quem usou o carro
            </button>
          </div>

          {activeTab === 'resumo' ? (
            <ZaptroPaginatedList
              items={actions}
              resetKey="vehicle-resumo"
              listClassName="zaptro-client-profile__list"
              empty={null}
              keyExtractor={(_, i) => `action-${i}`}
              renderItem={(a) => (
                <div className="zaptro-client-profile__row">
                  <div className="zaptro-client-profile__row-icon">
                    <AlertTriangle
                      size={18}
                      color={a.tone === 'danger' ? '#dc2626' : a.tone === 'warn' ? '#d97706' : '#16a34a'}
                    />
                  </div>
                  <div className="zaptro-client-profile__row-main">
                    <p className="zaptro-client-profile__row-title">{a.label}</p>
                  </div>
                </div>
              )}
            />
          ) : null}

          {activeTab === 'manutencao' ? (
            <ZaptroPaginatedList
              items={vehicle.maintenanceLog}
              resetKey="vehicle-manutencao"
              listClassName="zaptro-client-profile__list"
              empty={<div className="zaptro-client-profile__card">Sem manutenções registadas.</div>}
              keyExtractor={(m) => m.id}
              renderItem={(m) => (
                <div className="zaptro-client-profile__row">
                  <div className="zaptro-client-profile__row-icon">
                    <Wrench size={18} color="#0f172a" />
                  </div>
                  <div className="zaptro-client-profile__row-main">
                    <p className="zaptro-client-profile__row-title">{m.title}</p>
                    <p className="zaptro-client-profile__row-body">
                      {formatDate(m.at)}
                      {m.note ? ` · ${m.note}` : ''}
                    </p>
                  </div>
                  <div className="zaptro-client-profile__row-end">
                    <span className="zaptro-client-profile__row-date">
                      {m.status === 'done' ? 'Feito' : m.status === 'overdue' ? 'Atrasado' : 'Agendado'}
                    </span>
                  </div>
                </div>
              )}
            />
          ) : null}

          {activeTab === 'historico' ? (
            <ZaptroPaginatedList
              items={vehicle.driverHistory}
              resetKey="vehicle-historico"
              listClassName="zaptro-client-profile__list"
              empty={<div className="zaptro-client-profile__card">Nenhum motorista registado neste veículo.</div>}
              keyExtractor={(h, idx) => `${h.driverId}-${idx}`}
              renderItem={(h) => (
                <Link
                  to={ZAPTRO_APP_ROUTES.driverProfile(h.driverId)}
                  className="zaptro-client-profile__row zaptro-client-profile__row--clickable"
                >
                  <div className="zaptro-client-profile__row-icon">
                    <User size={18} color="#0f172a" />
                  </div>
                  <div className="zaptro-client-profile__row-main">
                    <p className="zaptro-client-profile__row-title">{h.driverName}</p>
                    <p className="zaptro-client-profile__row-body">
                      {formatDate(h.from)}
                      {h.to ? ` → ${formatDate(h.to)}` : ' · actual'}
                    </p>
                  </div>
                  <ChevronRight size={16} className="zaptro-client-profile__row-chevron" />
                </Link>
              )}
            />
          ) : null}
        </main>
      </div>

      <ZaptroVehicleRegisterModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={reload}
        editVehicleId={vehicle.id}
        initial={editInitial}
      />

      <LogtaModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Excluir veículo" width="420px" variant="center">
        <p className="zaptro-client-profile__muted-note">
          Remover o veículo <strong>{vehicle.plate}</strong> da frota? Esta acção não pode ser desfeita no modo demo.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" className="hub-premium-pill" onClick={() => setDeleteOpen(false)}>
            Cancelar
          </button>
          <button type="button" className="hub-premium-pill dark" disabled={deleteBusy} onClick={() => void handleDelete()}>
            Excluir
          </button>
        </div>
      </LogtaModal>
    </div>
  );
};

export default ZaptroAppVehicleProfilePage;
