import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ChevronRight, MessageSquare, Route, User, X } from 'lucide-react';
import type { WaLinkConversation } from './waLinkInboxDb';
import type { WaLinkContactRoleInfo } from './waLinkContactRoles';
import type { WaLinkRoleIndexEntry } from './waLinkContactRoles';
import { formatWaPhoneLine } from './waLinkConfig';
import { ZAPTRO_APP_ROUTES } from '../../app/zaptroAppRoutes';

type Props = {
  open: boolean;
  conversation: WaLinkConversation | null;
  roleInfo: WaLinkContactRoleInfo | null;
  staffEntry: WaLinkRoleIndexEntry | null;
  assignedCount: number;
  onClose: () => void;
};

const WaLinkStaffDrawer: React.FC<Props> = ({
  open,
  conversation,
  roleInfo,
  staffEntry,
  assignedCount,
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

  const title = staffEntry?.name || conversation?.sender_name || 'Colaborador';
  const phone = conversation?.sender_number || staffEntry?.phone || '';
  const profilePath = staffEntry?.profilePath || roleInfo?.profilePath;

  const roleLabel = useMemo(() => {
    if (!roleInfo) return 'Equipe';
    return roleInfo.subLabel || roleInfo.label;
  }, [roleInfo]);

  if (!open || !conversation) return null;

  return (
    <>
      <button type="button" className="wa-staff-drawer-backdrop" aria-label="Fechar" onClick={onClose} />
      <aside className="wa-staff-drawer" role="dialog" aria-label={`Perfil ${title}`}>
        <header className="wa-staff-drawer__head">
          <button type="button" className="wa-staff-drawer__close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
          <div
            className="wa-staff-drawer__badge"
            style={{ backgroundColor: roleInfo?.color || '#8e24aa' }}
          >
            {roleInfo?.label || 'Equipe'}
          </div>
          <div className="wa-staff-drawer__avatar">
            {staffEntry?.avatarUrl || conversation.customer_avatar ? (
              <img src={(staffEntry?.avatarUrl || conversation.customer_avatar)!} alt="" />
            ) : (
              title[0]?.toUpperCase() || '?'
            )}
          </div>
          <h2>{title}</h2>
          <p>{roleLabel}</p>
        </header>

        <div className="wa-staff-drawer__body">
          <div className="wa-staff-drawer__card">
            <h3>Contacto</h3>
            <p className="wa-staff-drawer__row">
              <MessageSquare size={16} />
              {formatWaPhoneLine(phone)}
            </p>
            {profilePath ? (
              <Link to={profilePath} className="wa-staff-drawer__link">
                Ver ficha completa <ChevronRight size={14} />
              </Link>
            ) : null}
          </div>

          <div className="wa-staff-drawer__card">
            <h3>Operação</h3>
            <p className="wa-staff-drawer__row">
              <Briefcase size={16} />
              {assignedCount} conversa(s) atribuída(s) na inbox
            </p>
            <p className="wa-staff-drawer__row">
              <Route size={16} />
              Histórico de rotas e clientes no perfil operacional
            </p>
          </div>

          <div className="wa-staff-drawer__card">
            <h3>Funções no sistema</h3>
            <ul className="wa-staff-drawer__tags">
              <li style={{ borderColor: roleInfo?.color }}>{roleInfo?.label}</li>
              {roleInfo?.role === 'driver' ? <li>Motorista · Frota</li> : null}
              {roleInfo?.role === 'helper' ? <li>Ajudante de campo</li> : null}
              {roleInfo?.role === 'collaborator' ? <li>Membro da equipa</li> : null}
            </ul>
          </div>

          <Link
            to={`${ZAPTRO_APP_ROUTES.INBOX}?c=${encodeURIComponent(phone)}`}
            className="wa-staff-drawer__conversar"
            onClick={onClose}
          >
            <User size={18} />
            Conversar no WhatsApp
          </Link>
        </div>
      </aside>
    </>
  );
};

export default WaLinkStaffDrawer;
