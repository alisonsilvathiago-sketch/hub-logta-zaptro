import React from 'react';
import { Plus } from 'lucide-react';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';

type Props = {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const LogstokaAddIconButton: React.FC<Props> = ({
  title,
  onClick,
  disabled = false,
  className = '',
  ...rest
}) => (
  <LogstokaIconTooltip label={title}>
    <button
      type="button"
      className={`ls-add-icon-btn${className ? ` ${className}` : ''}`}
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
