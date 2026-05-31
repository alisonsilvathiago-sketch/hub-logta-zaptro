import React from 'react';

type Props = {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel: string;
  className?: string;
};

const LogstokaTableCheckbox: React.FC<Props> = ({
  checked,
  indeterminate,
  onChange,
  ariaLabel,
  className = '',
}) => (
  <input
    type="checkbox"
    className={`ls-table-checkbox${className ? ` ${className}` : ''}`}
    checked={checked}
    ref={(el) => {
      if (el) el.indeterminate = Boolean(indeterminate);
    }}
    aria-label={ariaLabel}
    onChange={(e) => {
      e.stopPropagation();
      onChange();
    }}
    onClick={(e) => e.stopPropagation()}
  />
);

export default LogstokaTableCheckbox;
