import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLogstokaMoneyPrivacy } from '@/context/LogstokaMoneyPrivacyContext';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';
import './moneyPrivacy.css';

type Props = {
  size?: 'sm' | 'md';
  className?: string;
};

const LogstokaMoneyPrivacyToggle: React.FC<Props> = ({ size = 'md', className = '' }) => {
  const { hideMoney, toggleHideMoney } = useLogstokaMoneyPrivacy();
  const iconSize = size === 'sm' ? 14 : 18;

  const button = (
    <button
      type="button"
      className={`ls-money-privacy-toggle${size === 'sm' ? ' ls-money-privacy-toggle--sm' : ''}${hideMoney ? ' ls-money-privacy-toggle--active' : ''}${className ? ` ${className}` : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleHideMoney();
      }}
      aria-label={hideMoney ? 'Mostrar valores em dinheiro' : 'Ocultar valores em dinheiro'}
      aria-pressed={hideMoney}
    >
      {hideMoney ? <EyeOff size={iconSize} strokeWidth={2.25} /> : <Eye size={iconSize} strokeWidth={2.25} />}
    </button>
  );

  if (size === 'sm') return button;

  return (
    <LogstokaIconTooltip label={hideMoney ? 'Mostrar valores (R$)' : 'Ocultar valores (R$)'}>
      {button}
    </LogstokaIconTooltip>
  );
};

export default LogstokaMoneyPrivacyToggle;
