import React from 'react';
import { NavLink } from 'react-router-dom';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';

export type LogstokaIconNavLinkItem = {
  type: 'link';
  key: string;
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  active?: boolean;
};

export type LogstokaIconNavButtonItem = {
  type: 'button';
  key: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  accent?: boolean;
  onClick: () => void;
  'aria-pressed'?: boolean;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'menu';
};

export type LogstokaIconNavItem = LogstokaIconNavLinkItem | LogstokaIconNavButtonItem;

type LogstokaIconNavProps = {
  'aria-label': string;
  items: LogstokaIconNavItem[];
  variant?: 'section' | 'inline' | 'action';
  className?: string;
};

function itemClassName(active: boolean, accent?: boolean) {
  return [
    'ls-icon-nav__item',
    active ? 'ls-icon-nav__item--active' : '',
    accent ? 'ls-icon-nav__item--accent' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function LogstokaIconNav({
  'aria-label': ariaLabel,
  items,
  variant = 'section',
  className = '',
}: LogstokaIconNavProps) {
  return (
    <nav
      className={`ls-icon-nav ls-icon-nav--${variant}${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
    >
      <div className="ls-icon-nav__group">
        {items.map((item) => {
          if (item.type === 'link') {
            return (
              <LogstokaIconTooltip key={item.key} label={item.label}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  aria-label={item.label}
                  className={({ isActive }) => itemClassName(item.active ?? isActive)}
                >
                  {item.icon}
                </NavLink>
              </LogstokaIconTooltip>
            );
          }

          return (
            <LogstokaIconTooltip key={item.key} label={item.label}>
              <button
                type="button"
                aria-label={item.label}
                aria-pressed={item['aria-pressed'] ?? item.active}
                aria-expanded={item['aria-expanded']}
                aria-haspopup={item['aria-haspopup']}
                disabled={item.disabled}
                className={itemClassName(Boolean(item.active), item.accent)}
                onClick={item.onClick}
              >
                {item.icon}
              </button>
            </LogstokaIconTooltip>
          );
        })}
      </div>
    </nav>
  );
}

type IconActionProps = {
  title: string;
  children: React.ReactNode;
  active?: boolean;
  accent?: boolean;
  disabled?: boolean;
  className?: string;
};

export function LogstokaIconNavButton({
  title,
  children,
  active = false,
  accent = false,
  disabled = false,
  className = '',
  ...rest
}: IconActionProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <LogstokaIconTooltip label={title}>
      <button
        type="button"
        className={`${itemClassName(active, accent)}${className ? ` ${className}` : ''}`}
        aria-label={title}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
    </LogstokaIconTooltip>
  );
}

type IconLinkProps = {
  to: string;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  accent?: boolean;
  className?: string;
};

export function LogstokaIconNavLink({
  to,
  title,
  children,
  active = false,
  accent = false,
  className = '',
}: IconLinkProps) {
  return (
    <LogstokaIconTooltip label={title}>
      <NavLink
        to={to}
        className={`${itemClassName(active, accent)}${className ? ` ${className}` : ''}`}
        aria-label={title}
      >
        {children}
      </NavLink>
    </LogstokaIconTooltip>
  );
}

export default LogstokaIconNav;
