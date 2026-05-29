import React, { useCallback, useRef, useState } from 'react';

type Props = {
  label: string;
  children: React.ReactNode;
};

/** Pop-up compacto ao passar o mouse nos ícones do menu lateral */
const SidebarTooltip: React.FC<Props> = ({ label, children }) => {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const show = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.top + rect.height / 2, left: rect.right + 12 });
    setVisible(true);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  return (
    <span
      ref={wrapRef}
      className="logstoka-sidebar-tooltip-wrap"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          className="logstoka-sidebar-tooltip logstoka-sidebar-tooltip--fixed"
          role="tooltip"
          style={{ top: coords.top, left: coords.left }}
        >
          {label}
        </span>
      )}
    </span>
  );
};

export default SidebarTooltip;
