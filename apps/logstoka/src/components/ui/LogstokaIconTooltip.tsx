import React, { useCallback, useRef, useState } from 'react';

type Props = {
  label: string;
  children: React.ReactNode;
  placement?: 'bottom' | 'right';
};

/** Tooltip compacto ao passar o mouse nos ícones de navegação */
const LogstokaIconTooltip: React.FC<Props> = ({ label, children, placement = 'bottom' }) => {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const show = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (placement === 'right') {
      setCoords({ top: rect.top + rect.height / 2, left: rect.right + 12 });
    } else {
      setCoords({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    }
    setVisible(true);
  }, [placement]);

  const hide = useCallback(() => setVisible(false), []);

  return (
    <span
      ref={wrapRef}
      className="ls-icon-tooltip-wrap"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible ? (
        <span
          className={`ls-icon-tooltip ls-icon-tooltip--${placement}`}
          role="tooltip"
          style={{ top: coords.top, left: coords.left }}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
};

export default LogstokaIconTooltip;
