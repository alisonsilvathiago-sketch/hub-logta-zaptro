import React from 'react';
import { Link } from 'react-router-dom';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';

type IconButtonProps = {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'neutral' | 'accent';
  active?: boolean;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

type IconLinkProps = {
  to: string;
  title: string;
  variant?: 'neutral' | 'accent';
  active?: boolean;
  children: React.ReactNode;
};

const itemClass = (variant: 'neutral' | 'accent', active?: boolean) =>
  [
    'ls-icon-nav__item',
    active ? 'ls-icon-nav__item--active' : '',
    variant === 'accent' ? 'ls-icon-nav__item--accent' : '',
  ]
    .filter(Boolean)
    .join(' ');

export const HubHeroIconButton: React.FC<IconButtonProps> = ({
  title,
  onClick,
  disabled,
  variant = 'neutral',
  active = false,
  children,
  className = '',
  ...rest
}) => (
  <LogstokaIconTooltip label={title}>
    <button
      type="button"
      className={`${itemClass(variant, active)}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
      {...rest}
    >
      {children}
    </button>
  </LogstokaIconTooltip>
);

export const HubHeroIconLink: React.FC<IconLinkProps> = ({
  to,
  title,
  variant = 'neutral',
  active = false,
  children,
}) => (
  <LogstokaIconTooltip label={title}>
    <Link to={to} className={itemClass(variant, active)} aria-label={title}>
      {children}
    </Link>
  </LogstokaIconTooltip>
);
