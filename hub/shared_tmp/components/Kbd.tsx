import React from 'react';

interface KbdProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Kbd: React.FC<KbdProps> = ({ children, className = '', style }) => {
  return (
    <kbd style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '24px',
      height: '24px',
      padding: '0 6px',
      fontSize: '11px',
      fontWeight: '700',
      fontFamily: 'inherit',
      color: '#475569',
      backgroundColor: '#F8FAFC',
      border: '1px solid #E2E8F0',
      borderRadius: '6px',
      boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
      margin: '0 2px',
      ...style
    }} className={className}>
      {children}
    </kbd>
  );
};

export default Kbd;

