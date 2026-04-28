import React from 'react';

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999,
    backgroundColor: '#020617',
    color: '#FFFFFF',
    fontFamily: 'Inter, sans-serif'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(56, 189, 248, 0.1)',
    borderTop: '4px solid #38BDF8',
    borderRadius: '50%',
    marginBottom: '24px'
  },
  text: {
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-1px',
    background: 'linear-gradient(to bottom, #FFFFFF 0%, #94A3B8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }
};

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = 'Carregando Ecossistema...' }) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.spinner} className="spin" />
      <p style={styles.text}>{message}</p>
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Loading;
