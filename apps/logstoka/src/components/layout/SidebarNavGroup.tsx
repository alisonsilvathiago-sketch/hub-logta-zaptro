import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { LogstokaNavGroupItem } from './logstokaNavItems';
import SidebarTooltip from './SidebarTooltip';

type Props = {
  item: LogstokaNavGroupItem;
};

const SidebarNavGroup: React.FC<Props> = ({ item }) => {
  const { pathname, search, hash } = useLocation();
  const [open, setOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const Icon = item.icon;

  const currentPath = `${pathname}${search}${hash}`;

  const isChildActive = item.children.some((child) => {
    if (child.to.includes('#')) {
      const [base, fragment] = child.to.split('#');
      return currentPath === child.to || (pathname === base && hash === `#${fragment}`);
    }
    if (child.to.includes('?')) {
      return currentPath.startsWith(child.to.split('#')[0] ?? child.to);
    }
    return pathname === child.to || pathname.startsWith(`${child.to}/`);
  });

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const toggle = () => {
    const trigger = triggerRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setMenuTop(rect.top + rect.height / 2);
    }
    setOpen((value) => !value);
  };

  return (
    <div className="logstoka-sidebar-group" ref={ref}>
      <SidebarTooltip label={item.label}>
        <button
          ref={triggerRef}
          type="button"
          className={`logstoka-app-nav-item logstoka-sidebar-group__trigger${isChildActive || open ? ' active' : ''}`}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={toggle}
        >
          <Icon size={18} strokeWidth={1.65} />
        </button>
      </SidebarTooltip>

      {open ? (
        <div
          className="logstoka-sidebar-group__menu"
          role="menu"
          aria-label={item.label}
          style={{ top: menuTop, transform: 'translateY(-50%)' }}
        >
          <p className="logstoka-sidebar-group__title">{item.label}</p>
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end={child.end}
              role="menuitem"
              className={({ isActive }) => `logstoka-sidebar-group__item${isActive ? ' logstoka-sidebar-group__item--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <ChevronRight size={12} strokeWidth={2.5} aria-hidden />
              {child.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SidebarNavGroup;
