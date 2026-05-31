import React from 'react';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';

export type LogstokaToolbarAction = {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  accent?: boolean;
  separatorBefore?: boolean;
  hidden?: boolean;
};

type Props = {
  actions: LogstokaToolbarAction[];
  ariaLabel: string;
  className?: string;
};

const LogstokaTableIconToolbar: React.FC<Props> = ({ actions, ariaLabel, className = '' }) => (
  <div className={`ls-products-icon-toolbar ls-table-icon-toolbar${className ? ` ${className}` : ''}`} aria-label={ariaLabel}>
    {actions.filter((a) => !a.hidden).map((action) => (
      <React.Fragment key={action.key}>
        {action.separatorBefore ? <span className="ls-products-icon-toolbar__sep" aria-hidden /> : null}
        <LogstokaIconTooltip label={action.label}>
          <button
            type="button"
            className={`ls-products-icon-action${action.accent ? ' ls-products-icon-action--accent' : ''}`}
            disabled={action.disabled}
            aria-label={action.label}
            onClick={action.onClick}
          >
            {action.icon}
          </button>
        </LogstokaIconTooltip>
      </React.Fragment>
    ))}
  </div>
);

export default LogstokaTableIconToolbar;
