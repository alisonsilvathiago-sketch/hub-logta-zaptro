import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { can } from '@/lib/permissions';
import { LOGSTOKA_NAV } from './logstokaNavItems';

const QUICK_PATHS = new Set(['/app', '/app/products', '/app/conference', '/app/integrations']);

type Props = {
  open: boolean;
  onClose: () => void;
};

const MobileMoreMenu: React.FC<Props> = ({ open, onClose }) => {
  const { profile } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const items = LOGSTOKA_NAV.filter((item) => {
    if (!item.to || QUICK_PATHS.has(item.to)) return false;
    if (item.perm && !can(item.perm, profile?.role)) return false;
    return true;
  });

  return (
    <div className="logstoka-mobile-more logstoka-mobile-only" role="dialog" aria-modal="true" aria-label="Menu completo">
      <button type="button" className="logstoka-mobile-more__backdrop" aria-label="Fechar menu" onClick={onClose} />
      <div className="logstoka-mobile-more__sheet">
        <div className="logstoka-mobile-more__head">
          <h2>Menu LogStoka</h2>
          <button type="button" className="logstoka-mobile-more__close" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="logstoka-mobile-more__grid">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.to ? pathname === item.to || pathname.startsWith(`${item.to}/`) : false;
            return (
              <NavLink
                key={`${item.label}-${item.to}`}
                to={item.to!}
                end={item.end}
                className={`logstoka-mobile-more__link${active ? ' logstoka-mobile-more__link--active' : ''}`}
                onClick={onClose}
              >
                <Icon size={20} strokeWidth={1.75} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileMoreMenu;
