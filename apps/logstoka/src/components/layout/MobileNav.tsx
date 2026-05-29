import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, Menu, Package, Plug, ScanLine, Sparkles } from 'lucide-react';
import MobileMoreMenu from './MobileMoreMenu';

const quickItems = [
  { to: '/app', label: 'Início', icon: Sparkles, end: true },
  { to: '/app/products', label: 'Produtos', icon: Package },
  { to: '/app/conference', label: 'Conferir', icon: ScanLine },
  { to: '/app/integrations', label: 'Integrações', icon: Plug },
] as const;

const MobileNav: React.FC = () => {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();

  const moreActive = !quickItems.some(
    (item) => pathname === item.to || (item.to !== '/app' && pathname.startsWith(`${item.to}/`)),
  ) && pathname !== '/app' && pathname !== '/app/';

  return (
    <>
      <nav className="logstoka-mobile-nav logstoka-mobile-only" aria-label="Navegação mobile">
        <div className="logstoka-mobile-nav__grid">
          {quickItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  `logstoka-mobile-nav__item${isActive ? ' logstoka-mobile-nav__item--active' : ''}`
                }
              >
                <Icon size={20} strokeWidth={1.75} />
                {item.label}
              </NavLink>
            );
          })}
          <button
            type="button"
            className={`logstoka-mobile-nav__item${moreActive ? ' logstoka-mobile-nav__item--active' : ''}`}
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
          >
            <LayoutGrid size={20} strokeWidth={1.75} />
            Mais
          </button>
        </div>
      </nav>
      <MobileMoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
};

export default MobileNav;
