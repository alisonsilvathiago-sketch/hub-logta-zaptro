import React, { useState, useEffect } from 'react';

export const GlobalLoader: React.FC = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleStop = () => setLoading(false);

    window.addEventListener('start-global-loading', handleStart);
    window.addEventListener('stop-global-loading', handleStop);

    return () => {
      window.removeEventListener('start-global-loading', handleStart);
      window.removeEventListener('stop-global-loading', handleStop);
    };
  }, []);

  if (!loading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '3px',
      zIndex: 999999,
      overflow: 'hidden',
      backgroundColor: 'rgba(99, 102, 241, 0.1)'
    }}>
      <div style={{
        height: '100%',
        width: '40%',
        backgroundColor: '#6366F1',
        boxShadow: '0 0 10px #6366F1',
        animation: 'loaderMove 1.5s infinite ease-in-out'
      }} />
      <style>{`
        @keyframes loaderMove {
          0% { transform: translateX(-100%); width: 20%; }
          50% { width: 50%; }
          100% { transform: translateX(300%); width: 20%; }
        }
      `}</style>
    </div>
  );
};

export default GlobalLoader;

