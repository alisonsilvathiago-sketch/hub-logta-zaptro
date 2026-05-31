import React from 'react';
import { Plus } from 'lucide-react';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';

type Props = {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'dark';
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const LogstokaAddIconButton: React.FC<Props> = ({
  title,
  onClick,
  disabled = false,
  className = '',
  variant = 'default',
  ...rest
}) => (
  <LogstokaIconTooltip label={title}>
    <button
      type="button"
      className={`ls-add-icon-btn${variant === 'dark' ? ' ls-add-icon-btn--dark' : ''}${className ? ` ${className}` : ''}`}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      <Plus size={18} strokeWidth={2.2} aria-hidden />
    </button>
  </LogstokaIconTooltip>
);

export default LogstokaAddIconButton;
