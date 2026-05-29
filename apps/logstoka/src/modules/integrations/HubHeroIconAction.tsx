import React from 'react';
import { Link } from 'react-router-dom';
import './marketplaceHub.css';

type IconButtonProps = {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'neutral' | 'accent';
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

type IconLinkProps = {
  to: string;
  title: string;
  variant?: 'neutral' | 'accent';
  children: React.ReactNode;
};

const variantClass = (variant: 'neutral' | 'accent') =>
  variant === 'accent' ? 'ls-hub-hero-icon-btn--accent' : 'ls-hub-hero-icon-btn--neutral';

export const HubHeroIconButton: React.FC<IconButtonProps> = ({
  title,
  onClick,
  disabled,
  variant = 'neutral',
  children,
  className = '',
  ...rest
}) => (
  <button
    type="button"
    className={`ls-hub-hero-icon-btn ${variantClass(variant)} ${className}`.trim()}
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    {...rest}
  >
    {children}
  </button>
);

export const HubHeroIconLink: React.FC<IconLinkProps> = ({ to, title, variant = 'neutral', children }) => (
  <Link
    to={to}
    className={`ls-hub-hero-icon-btn ${variantClass(variant)}`}
    title={title}
    aria-label={title}
  >
    {children}
  </Link>
);
