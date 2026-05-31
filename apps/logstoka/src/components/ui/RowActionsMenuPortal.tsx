import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
};

const RowActionsMenuPortal: React.FC<Props> = ({ open, onClose, triggerRef, children }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const menuEl = menuRef.current;
      const menuHeight = menuEl?.offsetHeight ?? 200;
      const menuWidth = menuEl?.offsetWidth ?? 168;
      const gap = 4;

      let top = rect.bottom + gap;
      if (top + menuHeight > window.innerHeight - 8 && rect.top - menuHeight - gap > 8) {
        top = rect.top - menuHeight - gap;
      }

      const left = Math.min(
        Math.max(8, rect.right - menuWidth),
        window.innerWidth - menuWidth - 8,
      );

      setStyle({
        position: 'fixed',
        top,
        left,
        zIndex: 10050,
      });
    };

    updatePosition();
    const raf = window.requestAnimationFrame(updatePosition);

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, triggerRef, children]);

  useEffect(() => {
    if (!open) return;

    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      onClose();
    };

    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="ls-row-actions__menu ls-row-actions__menu--floating"
      style={style}
      role="menu"
    >
      {children}
    </div>,
    document.body,
  );
};

export default RowActionsMenuPortal;
