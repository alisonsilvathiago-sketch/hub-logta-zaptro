import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Calendar,
  Award,
  Phone,
  Mail,
  MapPin,
  FileText,
  Smartphone,
  Battery,
  Route,
  Radio,
  Database,
  FileBadge,
  Pencil,
  Lock,
  Trash2,
  Download,
  ExternalLink,
  Truck,
  Link2,
  Clock,
} from 'lucide-react';
import { DetailHistorySection, detailHistoryRowTitle } from './DetailHistorySection';
import { toastSuccess } from '@core/lib/toast';
import LogtaModal from '@shared/components/Modal';

interface LogtaDriverDetailProps {
  driverId: string;
  onBack: () => void;
}

type DriverLogtaEvent = {
  id: string;
  at: string;
  title: string;
  subtitle: string;
  source: string;
  kind: 'route' | 'logdrive' | 'hub' | 'doc';
  routeId?: string;
  /** Empresa (tenant) Logta — obrigatório quando há rota, para `routeClient` na URL */
  routeTenant?: string;
};

function buildDriverLogtaHistory(driverId: string, company: string): DriverLogtaEvent[] {
  const core: DriverLogtaEvent[] = [
    {
      id: `${driverId}-iam`,
      at: 'Hoje, 06:00',
      title: 'Presença validada no ecossistema Logta',
      subtitle: `Motorista vinculado ao tenant ${company} no Hub Master`,
      source: 'Logta IAM · Supabase',
      kind: 'hub',
    },
    {
      id: `${driverId}-ld`,
      at: 'Ontem, 18:55',
      title: 'Pacote telemétrico LogDrive → Logta',
      subtitle: 'Odométrico, horímetro e jornada (resolução CONTRAN)',
      source: 'LogDrive ↔ Logta API',
      kind: 'logdrive',
    },
  ];

  const tail: DriverLogtaEvent[] = [
    {
      id: `${driverId}-doc`,
      at: 'Semana passada',
      title: 'Documentação sincronizada na pasta do motorista',
      subtitle: 'Retenção e auditoria conforme política Logta',
      source: 'Logta Docs',
      kind: 'doc',
    },
  ];

  const routesByDriver: Record<string, DriverLogtaEvent[]> = {
    '1': [
      {
        id: 'h-9021',
        at: 'Hoje, 14:02',
        title: 'Rota #RT-9021 — check-points',
        subtitle: 'São Paulo → Rio de Janeiro · Eletrônicos',
        source: 'Logta TMS + LogDrive',
        kind: 'route',
        routeId: 'RT-9021',
        routeTenant: 'Transportadora Falcão',
      },
      {
        id: 'h-9028',
        at: 'Ontem, 16:30',
        title: 'Rota #RT-9028 — deslocamento',
        subtitle: 'Guarulhos → Campinas',
        source: 'Logta TMS + LogDrive',
        kind: 'route',
        routeId: 'RT-9028',
        routeTenant: 'Transportadora Falcão',
      },
    ],
    'demo-11': [
      {
        id: 'h-8912',
        at: 'Hoje, 09:10',
        title: 'Rota #RT-8912 concluída',
        subtitle: 'Curitiba → Porto Alegre',
        source: 'Logta TMS + LogDrive',
        kind: 'route',
        routeId: 'RT-8912',
        routeTenant: 'Expresso Federal',
      },
    ],
    'demo-12': [
      {
        id: 'h-9055',
        at: 'Hoje, 11:00',
        title: 'Rota #RT-9055 — janela ativa',
        subtitle: 'Belo Horizonte → Brasília',
        source: 'Logta TMS + LogDrive',
        kind: 'route',
        routeId: 'RT-9055',
        routeTenant: 'Rápido Trans',
      },
    ],
    'demo-13': [
      {
        id: 'h-9101',
        at: 'Agenda Logta',
        title: 'Rota #RT-9101 programada',
        subtitle: 'Campinas → Salvador',
        source: 'Logta TMS + LogDrive',
        kind: 'route',
        routeId: 'RT-9101',
        routeTenant: 'TransNorte Cargo',
      },
    ],
  };

  const routes = routesByDriver[driverId] ?? [
    {
      id: `${driverId}-rt`,
      at: 'Hoje, 08:00',
      title: 'Viagem registrada no núcleo Logta',
      subtitle: `Operação sob ${company}`,
      source: 'Logta TMS',
      kind: 'hub',
    },
  ];

  return [...core, ...routes, ...tail];
}

function eventIcon(kind: DriverLogtaEvent['kind']) {
  switch (kind) {
    case 'route':
      return <Route size={14} />;
    case 'logdrive':
      return <Radio size={14} />;
    case 'hub':
      return <Database size={14} />;
    case 'doc':
      return <FileBadge size={14} />;
    default:
      return <MapPin size={14} />;
  }
}

function phoneToTelHref(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '#';
  if (digits.length <= 11) return `tel:+55${digits}`;
  return `tel:+${digits}`;
}

function getDriverBaseData(id: string) {
  const nameMap: Record<string, string> = {
    '1': 'Ricardo Silva',
    'demo-11': 'Ana Oliveira',
    'demo-12': 'Carlos Souza',
    'demo-13': 'Pedro Mendes',
  };

  const driverName = nameMap[id] || `Condutor Auxiliar ${id}`;

  const vehicleById: Record<string, string> = {
    '1': 'Scania R450 · Placa ABC1D23',
    'demo-11': 'Volvo FH 540 · Placa EFD9K21',
    'demo-12': 'Mercedes Actros · Placa RTP8L44',
    'demo-13': 'Iveco Hi-Way · Placa TNC3B77',
  };

  return {
    name: driverName,
    company: id === '1' ? 'Transportadora Falcão' : id === 'demo-11' ? 'Expresso Federal' : id === 'demo-12' ? 'Rápido Trans' : id === 'demo-13' ? 'TransNorte Cargo' : 'Expresso Logística Parcerias',
    license: id === '1' || id === 'demo-13' ? 'CNH Categoria E (Especializada)' : 'CNH Categoria D (Regional)',
    status: id === 'demo-12' ? 'Pendente' : 'Ativo',
    statusColor: id === 'demo-12' ? '#F59E0B' : '#0061FF',
    photoUrl:
      id === '1'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&q=80'
        : id === 'demo-11'
          ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&q=80'
          : id === 'demo-12'
            ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop&q=80',
    phone: '(11) 98812-3819',
    email: `${driverName.toLowerCase().replace(/\s+/g, '.')}@logta-driver.com`,
    rating: '4.95 / 5.0',
    trips: '142 viagens',
    km: '42.500 km rodados',
    admittedAt: '14 de Outubro de 2024',
    lastRoute: 'São Paulo, SP ➔ Rio de Janeiro, RJ',
    appVersion: 'v4.21.0 (LogDrive)',
    battery: '92%',
    vehicle: vehicleById[id] || 'Veículo não vinculado hoje',
    baseAddress: 'Rua Ipiranga, 450 — Guarulhos, SP (residência cadastrada)',
    hubProfileUrl: `https://hub.logta.com.br/motoristas/${encodeURIComponent(driverName.toLowerCase().replace(/\s+/g, '-'))}`,
  };
}

export const LogtaDriverDetail: React.FC<LogtaDriverDetailProps> = ({ driverId, onBack }) => {
  const [, setSearchParams] = useSearchParams();
  const [histDraft, setHistDraft] = useState('');
  const [histQuery, setHistQuery] = useState('');
  const [fieldOverrides, setFieldOverrides] = useState<Record<string, Partial<ReturnType<typeof getDriverBaseData>>>>({});
  const [blockedIds, setBlockedIds] = useState<Record<string, boolean>>({});
  const [editOpen, setEditOpen] = useState(false);
  const [fullActivityOpen, setFullActivityOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ReturnType<typeof getDriverBaseData>>>({});

  const baseDriver = useMemo(() => getDriverBaseData(driverId), [driverId]);

  const driver = useMemo(() => {
    const o = fieldOverrides[driverId] || {};
    const merged = { ...baseDriver, ...o };
    if (blockedIds[driverId]) {
      return { ...merged, status: 'Bloqueado', statusColor: '#EF4444' };
    }
    return merged;
  }, [driverId, baseDriver, fieldOverrides, blockedIds]);

  const openEdit = () => {
    setEditForm({ name: driver.name, company: driver.company, phone: driver.phone, email: driver.email, license: driver.license });
    setEditOpen(true);
  };

  const saveEdit = () => {
    setFieldOverrides(prev => ({
      ...prev,
      [driverId]: {
        name: editForm.name?.trim() || baseDriver.name,
        company: editForm.company?.trim() || baseDriver.company,
        phone: editForm.phone?.trim() || baseDriver.phone,
        email: editForm.email?.trim() || baseDriver.email,
        license: editForm.license?.trim() || baseDriver.license,
      },
    }));
    setEditOpen(false);
    toastSuccess('Cadastro do motorista atualizado no Hub Logta.');
  };

  const toggleBlock = () => {
    const next = !blockedIds[driverId];
    setBlockedIds(prev => ({ ...prev, [driverId]: next }));
    toastSuccess(next ? 'Motorista bloqueado no Hub Logta.' : 'Motorista liberado no Hub Logta.');
  };

  const confirmDelete = () => {
    if (!window.confirm('Remover este motorista do cadastro Logta? (demo)')) return;
    toastSuccess('Exclusão enviada para auditoria Logta.');
    onBack();
  };

  const fullHistory = useMemo(() => buildDriverLogtaHistory(driverId, driver.company), [driverId, driver.company]);

  const filteredHistory = useMemo(() => {
    const q = histQuery.trim().toLowerCase();
    if (!q) return fullHistory;
    return fullHistory.filter(
      h =>
        h.title.toLowerCase().includes(q) ||
        h.subtitle.toLowerCase().includes(q) ||
        h.source.toLowerCase().includes(q) ||
        h.at.toLowerCase().includes(q) ||
        (h.routeId && h.routeId.toLowerCase().includes(q)),
    );
  }, [fullHistory, histQuery]);

  const jornadaAuditRows = useMemo(
    () => [
      {
        quando: 'Hoje, 05:42',
        oQue: 'Abertura de jornada (LogDrive)',
        entrou: '05:42',
        saiu: '—',
        local: 'Residência · Guarulhos, SP',
        link: 'https://maps.google.com/?q=Guarulhos+SP',
      },
      {
        quando: 'Hoje, 07:08',
        oQue: 'Entrada geofence — CD Anhanguera',
        entrou: '07:08',
        saiu: '07:24',
        local: 'Rod. Anhanguera, km 23 — Cajamar, SP',
        link: 'https://maps.google.com/?q=Anhanguera+km+23',
      },
      {
        quando: 'Hoje, 09:55',
        oQue: 'Parada programada (descanso)',
        entrou: '09:55',
        saiu: '10:12',
        local: 'Posto Rede BR — Registro, SP',
        link: 'https://maps.google.com/?q=Registro+SP',
      },
      {
        quando: 'Ontem, 18:40',
        oQue: 'Encerramento de jornada',
        entrou: '18:35',
        saiu: '18:40',
        local: 'Pátio Falcão — Osasco, SP',
        link: 'https://maps.google.com/?q=Osasco+SP',
      },
    ],
    [],
  );

  const openRouteInLogtaHub = (routeId: string, tenant: string) => {
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.delete('driverId');
      n.set('tab', 'routes');
      n.set('routeId', routeId);
      n.set('routeClient', encodeURIComponent(tenant));
      return n;
    }, { replace: true });
  };

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <button type="button" style={s.backBtn} onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={s.title}>{driver.name}</h2>
              <span style={{ fontSize: '11px', fontWeight: '800', color: driver.statusColor, background: driver.statusColor + '15', padding: '4px 10px', borderRadius: '6px' }}>
                ● {driver.status}
              </span>
            </div>
            <p style={s.subtitle}>Motorista Profissional • Colaborador Logta</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button type="button" style={s.iconAction} onClick={openEdit} title="Editar">
            <Pencil size={18} />
          </button>
          <button type="button" style={{ ...s.iconAction, color: blockedIds[driverId] ? '#B91C1C' : '#64748B' }} onClick={toggleBlock} title="Bloquear">
            <Lock size={18} />
          </button>
          <button type="button" style={{ ...s.iconAction, color: '#B91C1C' }} onClick={confirmDelete} title="Excluir">
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <div style={s.content}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
          {/* LEFT: PROFILE & APP STATUS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setFullActivityOpen(true)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setFullActivityOpen(true);
                }
              }}
              style={{
                ...s.card,
                cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#BFDBFE';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid #F1F5F9' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    flexShrink: 0,
                    background: '#E2E8F0',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {driver.photoUrl ? (
                    <img src={driver.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: '32px',
                        fontWeight: '900',
                      }}
                    >
                      {driver.name.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>{driver.name}</h3>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', marginTop: '4px' }}>{driver.company}</span>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginTop: '10px', textAlign: 'center' }}>
                  Toque para ver jornada, endereços, veículo e histórico completo salvos no Logta
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                <div style={s.infoRow}>
                  <Phone size={14} color="#94A3B8" />
                  <a
                    href={phoneToTelHref(driver.phone)}
                    onClick={e => e.stopPropagation()}
                    style={{ ...s.infoVal, color: '#2563EB', fontWeight: 800, textDecoration: 'none' }}
                  >
                    {driver.phone}
                  </a>
                </div>
                <div style={s.infoRow}>
                  <Mail size={14} color="#94A3B8" />
                  <span style={s.infoVal}>{driver.email}</span>
                </div>
                <div style={s.infoRow}>
                  <Calendar size={14} color="#94A3B8" />
                  <span style={s.infoVal}>Admitido: {driver.admittedAt}</span>
                </div>
                <a
                  href={phoneToTelHref(driver.phone)}
                  onClick={e => e.stopPropagation()}
                  style={{
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #0061FF, #1D4ED8)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 97, 255, 0.35)',
                  }}
                >
                  <Phone size={18} strokeWidth={2.5} />
                  Ligar para o motorista
                </a>
              </div>
            </div>

            {/* SMARTPHONE CONNECTIVITY */}
            <div style={{ ...s.card, border: '1px solid #E0F2FE', background: '#F0F9FF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', background: '#FFFFFF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                  <Smartphone size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#0369A1' }}>App LogDrive Ativo</div>
                  <div style={{ fontSize: '11px', color: '#0EA5E9', fontWeight: '600' }}>Dispositivo Conectado</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '12px', border: '1px solid #E0F2FE' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Versão</div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0369A1', marginTop: '2px' }}>{driver.appVersion.split(' ')[0]}</div>
                </div>
                <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '12px', border: '1px solid #E0F2FE', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Battery size={16} color="#0061FF" />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Bateria</div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B', marginTop: '2px' }}>{driver.battery}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: CREDENTIALS & TRIP STATS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* METRIC CHIPS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div style={s.cardCompact}>
                <div style={s.iconBox}>
                  <Award size={20} color="#F59E0B" />
                </div>
                <div>
                  <div style={s.label}>Nota Média</div>
                  <div style={s.val}>{driver.rating}</div>
                </div>
              </div>
              <div style={s.cardCompact}>
                <div style={s.iconBox}>
                  <MapPin size={20} color="#3B82F6" />
                </div>
                <div>
                  <div style={s.label}>Total Viagens</div>
                  <div style={s.val}>{driver.trips}</div>
                </div>
              </div>
              <div style={s.cardCompact}>
                <div style={s.iconBox}>
                  <Shield size={20} color="#0061FF" />
                </div>
                <div>
                  <div style={s.label}>Km Cobertos</div>
                  <div style={s.val}>{driver.km}</div>
                </div>
              </div>
            </div>

            {/* DOCUMENTATION */}
            <div style={s.card}>
              <h3 style={s.sect}>Conformidade & Documentos Regulatórios</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                {[
                  { doc: 'Carteira Nacional de Habilitação', type: driver.license.split(' (')[0], valid: 'Validade: 12/2028', ok: true, slug: 'cnh' },
                  { doc: 'Exame toxicológico periódico', type: 'Obrigatório CLT', valid: 'Validade: 06/2026', ok: true, slug: 'toxicologico' },
                  { doc: 'Ficha ASO (atestado de saúde)', type: 'Exame clínico', valid: 'Vencido: há 2 dias', ok: driverId !== 'demo-12', slug: 'aso' },
                ].map((d, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1px solid #F1F5F9',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: d.ok ? '#EFF6FF' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: d.ok ? '#0061FF' : '#EF4444' }}>
                      <FileText size={18} />
                    </div>
                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{d.doc}</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{d.type}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', marginLeft: 'auto' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: d.ok ? '#0061FF' : '#EF4444' }}>{d.ok ? '✓ Regularizado' : '⚠ Atenção'}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{d.valid}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          title="Baixar PDF"
                          onClick={() => toastSuccess(`Download simulado: ${d.slug}.pdf`)}
                          style={s.docIconBtn}
                        >
                          <Download size={16} />
                        </button>
                        <button
                          type="button"
                          title="Abrir documento"
                          onClick={() => window.open(`https://docs.logta.com.br/arquivos/${d.slug}?motorista=${encodeURIComponent(driver.name)}`, '_blank', 'noopener,noreferrer')}
                          style={s.docIconBtn}
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DetailHistorySection
          heading="Histórico Logta (motorista)"
          hint="Linha do tempo integrada: LogDrive, TMS Logta, IAM e documentos. Em rotas, abrir no Hub mantém o tenant (routeClient) alinhado à transportadora."
          searchPlaceholder="Filtrar por rota, origem ou sistema…"
          searchDraft={histDraft}
          onSearchDraftChange={setHistDraft}
          onApplySearch={() => setHistQuery(histDraft)}
          exportStem={`logta-motorista-${driverId}-historico`}
          listMaxHeight={320}
        >
          {filteredHistory.map(ev => (
            <div
              key={ev.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#475569',
                      flexShrink: 0,
                    }}
                  >
                    {eventIcon(ev.kind)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{ev.title}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{ev.at}</div>
                  </div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', flexShrink: 0 }}>{ev.source}</span>
              </div>
              <p style={{ ...detailHistoryRowTitle, margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.45 }}>{ev.subtitle}</p>
              {ev.kind === 'route' && ev.routeId && ev.routeTenant && (
                <button
                  type="button"
                  onClick={() => openRouteInLogtaHub(ev.routeId!, ev.routeTenant!)}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: '4px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #BFDBFE',
                    background: '#EFF6FF',
                    color: '#1D4ED8',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Abrir rota no Hub Logta
                </button>
              )}
              {ev.kind !== 'route' && (
                <button
                  type="button"
                  onClick={() => toastSuccess('Registro auditável no núcleo Logta (somente leitura nesta demo).')}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: '4px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#64748B',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Ver trilha no Logta
                </button>
              )}
            </div>
          ))}
        </DetailHistorySection>
      </div>

      <LogtaModal
        isOpen={fullActivityOpen}
        onClose={() => setFullActivityOpen(false)}
        title="Registro completo do motorista"
        subtitle={`Jornada, endereços, veículo e tudo o que foi salvo no Logta · ${driver.name}`}
        size="full"
        padding="20px 24px 28px"
        icon={<Database size={22} />}
        secondaryAction={{ label: 'Fechar', onClick: () => setFullActivityOpen(false) }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Veículo hoje</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
                  <Truck size={22} />
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>{driver.vehicle}</div>
              </div>
            </div>
            <div style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Perfil no Hub (link)</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Link2 size={18} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
                <a href={driver.hubProfileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB', wordBreak: 'break-all' }}>
                  {driver.hubProfileUrl}
                </a>
              </div>
            </div>
          </div>

          <div style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Endereço base cadastrado</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <MapPin size={18} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155', lineHeight: 1.45 }}>{driver.baseAddress}</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Clock size={18} color="#475569" />
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>Horários de entrada e saída (LogDrive + geofence)</h4>
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ minWidth: '720px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(120px,1fr) minmax(160px,1.4fr) 72px 72px minmax(140px,1fr) 100px',
                  gap: '0',
                  padding: '10px 14px',
                  background: '#F1F5F9',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <span>Quando</span>
                <span>Evento</span>
                <span>Entrou</span>
                <span>Saiu</span>
                <span>Local</span>
                <span>Mapa</span>
              </div>
              {jornadaAuditRows.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(120px,1fr) minmax(160px,1.4fr) 72px 72px minmax(140px,1fr) 100px',
                    gap: '0',
                    padding: '12px 14px',
                    borderTop: '1px solid #F1F5F9',
                    fontSize: '12px',
                    alignItems: 'center',
                    background: i % 2 === 0 ? '#FFFFFF' : '#FAFBFC',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#475569' }}>{row.quando}</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{row.oQue}</span>
                  <span style={{ fontWeight: 800, color: '#0061FF' }}>{row.entrou}</span>
                  <span style={{ fontWeight: 800, color: '#B45309' }}>{row.saiu}</span>
                  <span style={{ color: '#64748B', lineHeight: 1.35 }}>{row.local}</span>
                  <a href={row.link} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color: '#2563EB', fontSize: '11px' }}>
                    Abrir
                  </a>
                </div>
              ))}
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>Histórico integrado (mesma linha do tempo da página)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fullHistory.map(ev => (
                <div
                  key={ev.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{ev.title}</div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8' }}>{ev.at}</span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748B', lineHeight: 1.45 }}>{ev.subtitle}</p>
                  <div style={{ marginTop: '6px', fontSize: '10px', fontWeight: 700, color: '#94A3B8' }}>{ev.source}</div>
                  {ev.kind === 'route' && ev.routeId && ev.routeTenant && (
                    <button
                      type="button"
                      onClick={() => {
                        setFullActivityOpen(false);
                        openRouteInLogtaHub(ev.routeId!, ev.routeTenant!);
                      }}
                      style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid #BFDBFE',
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Abrir rota no Hub Logta
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </LogtaModal>

      <LogtaModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar motorista (Logta)"
        subtitle="Dados do colaborador no Hub Master (demo local)."
        primaryAction={{ label: 'Salvar', onClick: saveEdit }}
        secondaryAction={{ label: 'Cancelar', onClick: () => setEditOpen(false) }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {(['name', 'company', 'phone', 'email', 'license'] as const).map(field => (
            <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                {field === 'name' ? 'Nome' : field === 'company' ? 'Empresa' : field === 'phone' ? 'Telefone' : field === 'email' ? 'E-mail' : 'CNH'}
              </span>
              <input
                value={(editForm[field] as string) ?? ''}
                onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                style={driverInputStyle}
              />
            </label>
          ))}
        </div>
      </LogtaModal>
    </div>
  );
};

const driverInputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #E2E8F0',
  fontSize: '14px',
  fontWeight: 600,
  outline: 'none',
};

const s: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flex: 1, flexDirection: 'column', backgroundColor: '#FFFFFF' },
  header: { padding: '60px 160px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  iconAction: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#475569',
  },
  backBtn: { width: '44px', height: '44px', borderRadius: '14px', border: '2px solid #E2E8F0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' },
  title: { margin: 0, fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' },
  subtitle: { margin: '4px 0 0 0', fontSize: '13px', color: '#64748B', fontWeight: '600' },
  content: { padding: '40px 160px 80px', display: 'flex', flexDirection: 'column', gap: '32px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E2E8F0' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  infoVal: { fontSize: '13px', fontWeight: '700', color: '#475569' },
  cardCompact: { backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' },
  iconBox: { width: '44px', height: '44px', borderRadius: '12px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  val: { fontSize: '15px', fontWeight: '900', color: '#0F172A', marginTop: '2px' },
  sect: { margin: 0, fontSize: '16px', fontWeight: '900', color: '#0F172A' },
  docIconBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#475569',
  },
};
