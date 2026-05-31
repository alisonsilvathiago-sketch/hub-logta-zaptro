import React from 'react';
import LogstokaMoneyPrivacyToggle from '@/components/privacy/LogstokaMoneyPrivacyToggle';
import LogstokaXRayTrigger from '@/modules/ai/auditor/LogstokaXRayTrigger';
import '@/components/privacy/moneyPrivacy.css';

type Props = {
  eyebrow?: string;
  icon?: React.ReactNode;
  leading?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Exibe olho para ocultar valores (R$) — use em páginas com muitos valores monetários */
  showMoneyPrivacy?: boolean;
  className?: string;
};

const LogstokaPageHeader: React.FC<Props> = ({
  eyebrow,
  icon,
  leading,
  title,
  subtitle,
  actions,
  showMoneyPrivacy = false,
  className = '',
}) => (
  <header className={`ls-page-header${className ? ` ${className}` : ''}`}>
    <div className="ls-page-header__main">
      {eyebrow ? <p className="ls-page-header__eyebrow">{eyebrow}</p> : null}
      <div className="ls-page-header__title-row">
        {leading ? <div className="ls-page-header__leading">{leading}</div> : null}
        {title ? (
          <h1 className="ls-page-header__title">
            {icon ? (
              <span className="ls-page-header__title-icon" aria-hidden>
                {icon}
              </span>
            ) : null}
            <span className="ls-page-header__title-text">{title}</span>
          </h1>
        ) : null}
      </div>
      {subtitle ? <div className="ls-page-header__subtitle">{subtitle}</div> : null}
    </div>

    <div className="ls-page-header__actions flex items-center gap-2">
      {showMoneyPrivacy ? <LogstokaMoneyPrivacyToggle size="sm" /> : null}
      <LogstokaXRayTrigger />
      {actions}
    </div>
  </header>
);

export default LogstokaPageHeader;
