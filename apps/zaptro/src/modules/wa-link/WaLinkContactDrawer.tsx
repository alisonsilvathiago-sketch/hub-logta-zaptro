import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  FolderOpen,
  Hash,
  Lock,
  MapPin,
  Package,
  Route,
  Shield,
  Star,
  Timer,
  X,
} from 'lucide-react';
import type { WaLinkConversation } from './waLinkInboxDb';
import type { WaLinkMessage } from './useWaLinkInbox';
import type { WaLinkAssigneeProfile } from './useWaLinkCustomerContext';
import type { WaLinkCustomerContextSnapshot } from './waLinkCustomerContext';
import { buildWaLinkContactProfile } from './waLinkContactProfile';

type Props = {
  open: boolean;
  conversation: WaLinkConversation | null;
  companyId: string | null;
  snapshot: WaLinkCustomerContextSnapshot | null;
  assignee: WaLinkAssigneeProfile | null;
  messages: WaLinkMessage[];
  onClose: () => void;
};

function WaLinkRouteMiniMap({
  lat,
  lng,
  label,
  trackPath,
}: {
  lat: number;
  lng: number;
  label?: string;
  trackPath: string;
}) {
  const pad = 0.018;
  const bbox = `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="wa-contact-drawer-map">
      <iframe title={label || 'Local da entrega'} src={src} loading="lazy" />
      <Link to={trackPath} className="wa-contact-drawer-map-link">
        <MapPin size={14} />
        {label || 'Ver rota completa'}
      </Link>
    </div>
  );
}

const WaLinkContactDrawer: React.FC<Props> = ({
  open,
  conversation,
  companyId,
  snapshot,
  assignee,
  messages,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const profile = useMemo(() => {
    if (!conversation) return null;
    return buildWaLinkContactProfile({
      conversation,
      companyId: companyId || conversation.company_id || 'local-demo',
      snapshot,
      messages,
    });
  }, [conversation, companyId, snapshot, messages]);

  if (!open || !conversation || !profile) return null;

  const assigneeName = assignee?.full_name?.trim() || 'Colaborador';
  const inService =
    Boolean(conversation.assigned_to?.trim()) && conversation.attendance_status === 'in_service';

  return (
    <div className="wa-contact-drawer-root" role="presentation">
      <button type="button" className="wa-contact-drawer-backdrop" aria-label="Fechar" onClick={onClose} />
      <aside className="wa-contact-drawer" role="dialog" aria-label="Dados do contato">
        <header className="wa-contact-drawer-head">
          <button type="button" className="wa-contact-drawer-close" onClick={onClose} aria-label="Fechar">
            <X size={22} strokeWidth={2} />
          </button>
          <h2>Dados do contato</h2>
        </header>

        <div className="wa-contact-drawer-scroll">
          <div className="wa-contact-drawer-profile">
            <div className="wa-contact-drawer-avatar-wrap">
              <div className="wa-contact-drawer-avatar-lg">
                {conversation.customer_avatar ? (
                  <img src={conversation.customer_avatar} alt="" />
                ) : (
                  profile.avatarInitial
                )}
              </div>
              {inService && assignee ? (
                <span
                  className="wa-contact-drawer-assignee-badge"
                  title={`Atendido por ${assigneeName}`}
                >
                  {assignee.avatar_url ? (
                    <img src={assignee.avatar_url} alt="" />
                  ) : (
                    waLinkAssigneeInitial(assigneeName)
                  )}
                </span>
              ) : null}
            </div>
            <h3>{profile.displayName}</h3>
            <p>{profile.phone}</p>
            {inService ? (
              <p className="wa-contact-drawer-assignee-line">Atendido por {assigneeName}</p>
            ) : null}
          </div>

          <section className="wa-contact-drawer-section wa-contact-drawer-section--ops">
            <span className="wa-contact-drawer-label">Cliente</span>
            <div className="wa-contact-drawer-id-row">
              <Hash size={16} />
              <span>ID {profile.clientId}</span>
            </div>
            {profile.documentLabel ? (
              <p className="wa-contact-drawer-meta-line">{profile.documentLabel}</p>
            ) : null}
            {profile.companyName ? (
              <p className="wa-contact-drawer-meta-line wa-contact-drawer-meta-line--company">
                <Building2 size={14} />
                {profile.companyName}
              </p>
            ) : null}
          </section>

          <section className="wa-contact-drawer-section wa-contact-drawer-section--ops">
            <span className="wa-contact-drawer-label">
              {profile.operationalMode === 'route'
                ? 'Entrega / rota'
                : profile.operationalMode === 'quotes'
                  ? 'Comercial / financeiro'
                  : 'Resumo do atendimento'}
            </span>
            <p className="wa-contact-drawer-ops-summary">{profile.operationalSummary}</p>
            {profile.primaryRoute &&
            typeof profile.primaryRoute.mapLat === 'number' &&
            typeof profile.primaryRoute.mapLng === 'number' ? (
              <WaLinkRouteMiniMap
                lat={profile.primaryRoute.mapLat}
                lng={profile.primaryRoute.mapLng}
                label={profile.primaryRoute.mapLabel || profile.primaryRoute.dest || undefined}
                trackPath={profile.primaryRoute.trackPath}
              />
            ) : profile.operationalMode === 'quotes' && snapshot?.quotes?.length ? (
              <ul className="wa-contact-drawer-quote-list">
                {snapshot.quotes.slice(0, 3).map((q) => (
                  <li key={q.id}>
                    <Package size={14} />
                    <span>
                      {q.label} · {q.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : snapshot?.routes?.length ? (
              <Link to={snapshot.routes[0].trackPath} className="wa-contact-drawer-map-link">
                <Route size={14} />
                {snapshot.routes[0].label} · {snapshot.routes[0].statusLabel}
              </Link>
            ) : null}
          </section>

          <section className="wa-contact-drawer-section">
            <span className="wa-contact-drawer-label">Recado</span>
            <p className="wa-contact-drawer-recado">{profile.recado}</p>
          </section>

          <button type="button" className="wa-contact-drawer-row wa-contact-drawer-row--media" disabled>
            <FolderOpen size={20} strokeWidth={1.75} />
            <span className="wa-contact-drawer-row-text">
              <strong>Mídia, links e docs</strong>
              {profile.messageCount > 0 ? (
                <em>{profile.messageCount} mensagen{profile.messageCount === 1 ? '' : 's'} na conversa</em>
              ) : null}
            </span>
            <span className="wa-contact-drawer-row-meta">{profile.mediaCount}</span>
            <ChevronRight size={18} className="wa-contact-drawer-chevron" />
          </button>

          <ul className="wa-contact-drawer-list">
            <li>
              <button type="button" className="wa-contact-drawer-row" disabled>
                <Star size={20} strokeWidth={1.75} />
                <span className="wa-contact-drawer-row-text">
                  <strong>Mensagens favoritas</strong>
                </span>
                <ChevronRight size={18} className="wa-contact-drawer-chevron" />
              </button>
            </li>
            <li>
              <button type="button" className="wa-contact-drawer-row" disabled>
                <Timer size={20} strokeWidth={1.75} />
                <span className="wa-contact-drawer-row-text">
                  <strong>Mensagens temporárias</strong>
                  <em>Desativadas</em>
                </span>
                <ChevronRight size={18} className="wa-contact-drawer-chevron" />
              </button>
            </li>
            <li>
              <button type="button" className="wa-contact-drawer-row" disabled>
                <Shield size={20} strokeWidth={1.75} />
                <span className="wa-contact-drawer-row-text">
                  <strong>Privacidade avançada da conversa</strong>
                  <em>Desativada</em>
                </span>
                <ChevronRight size={18} className="wa-contact-drawer-chevron" />
              </button>
            </li>
            <li>
              <button type="button" className="wa-contact-drawer-row" disabled>
                <Lock size={20} strokeWidth={1.75} />
                <span className="wa-contact-drawer-row-text">
                  <strong>Criptografia</strong>
                  <em>As mensagens são protegidas de ponta a ponta.</em>
                </span>
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

function waLinkAssigneeInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.trim()[0]?.toUpperCase() || '?';
}

export default WaLinkContactDrawer;
