import React, { useState } from 'react';
import { getPlatform } from '../lib/platform';
import Kbd from './Kbd';

interface ShortcutTooltipProps {
  children: React.ReactNode;
  shortcut: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const ShortcutTooltip: React.FC<ShortcutTooltipProps> = ({ 
  children, 
  shortcut, 
  ctrl, 
  shift, 
  alt, 
  position = 'bottom',
  delay = 300
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timer, setTimer] = useState<any>(null);
  const platform = getPlatform();

  const handleMouseEnter = () => {
    const t = setTimeout(() => setIsVisible(true), delay);
    setTimer(t);
  };

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    setIsVisible(false);
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top': return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' };
      case 'left': return { top: '50%', right: '100%', transform: 'translateY(-50%)', marginRight: '8px' };
      case 'right': return { top: '50%', left: '100%', transform: 'translateY(-50%)', marginLeft: '8px' };
      default: return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' };
    }
  };

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div style={{
          position: 'absolute',
          zIndex: 10000,
          backgroundColor: '#1E293B',
          color: 'white',
          padding: '6px 10px',
          borderRadius: '8px',
          fontSize: '11px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          ...getPositionStyles()
        }}>
          <span style={{ opacity: 0.8 }}>Atalho:</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {ctrl && <Kbd style={{ height: '18px', minWidth: '18px', fontSize: '9px', backgroundColor: '#334155', color: '#F1F5F9', border: '1px solid #475569' }}>{platform.cmd}</Kbd>}
            {shift && <Kbd style={{ height: '18px', minWidth: '18px', fontSize: '9px', backgroundColor: '#334155', color: '#F1F5F9', border: '1px solid #475569' }}>{platform.shift}</Kbd>}
            {alt && <Kbd style={{ height: '18px', minWidth: '18px', fontSize: '9px', backgroundColor: '#334155', color: '#F1F5F9', border: '1px solid #475569' }}>{platform.alt}</Kbd>}
            <Kbd style={{ height: '18px', minWidth: '18px', fontSize: '9px', backgroundColor: '#334155', color: '#F1F5F9', border: '1px solid #475569' }}>{shortcut.toUpperCase()}</Kbd>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortcutTooltip;
