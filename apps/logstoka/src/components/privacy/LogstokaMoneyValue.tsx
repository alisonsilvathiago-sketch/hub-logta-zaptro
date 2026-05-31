import React from 'react';
import { looksLikeMoney } from '@/lib/moneyPrivacy';
import { useLogstokaMoneyPrivacy } from '@/context/LogstokaMoneyPrivacyContext';
import { useLogstokaSecurity } from '@/context/LogstokaSecurityProvider';
import './moneyPrivacy.css';

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Forçar tratamento como moeda mesmo sem prefixo R$ */
  isMoney?: boolean;
};

const LogstokaMoneyValue: React.FC<Props> = ({ children, className = '', isMoney }) => {
  const { hideMoney } = useLogstokaMoneyPrivacy();
  const { financialLocked } = useLogstokaSecurity();
  const text = String(children);
  const monetary = isMoney ?? looksLikeMoney(text);
  const masked = hideMoney || financialLocked;

  if (!monetary) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      className={`ls-money-value${masked ? ' ls-money-value--hidden' : ''}${className ? ` ${className}` : ''}`}
      data-money-value="true"
      aria-hidden={masked}
      title={financialLocked ? 'Valores restritos ao seu perfil' : undefined}
    >
      {children}
    </span>
  );
};

export default LogstokaMoneyValue;
