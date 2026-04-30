import React from 'react'

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 24,
        height: 24,
        padding: '0 8px',
        borderRadius: 6,
        border: '1px solid #d1d5db',
        background: '#f8fafc',
        color: '#0f172a',
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {children}
    </kbd>
  )
}
