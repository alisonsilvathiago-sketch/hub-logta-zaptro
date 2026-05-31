import React from 'react';
import { ScanLine } from 'lucide-react';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';

type Props = {
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const LogstokaScanIconButton: React.FC<Props> = ({
  title = 'Scanner inteligente',
  onClick,
  disabled = false,
  className = '',
  ...rest
}) => (
  <LogstokaIconTooltip label={title}>
    <button
      type="button"
      className={`ls-scan-icon-btn${className ? ` ${className}` : ''}`}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      <ScanLine size={18} strokeWidth={2.2} aria-hidden />
    </button>
  </LogstokaIconTooltip>
);

export default LogstokaScanIconButton;
