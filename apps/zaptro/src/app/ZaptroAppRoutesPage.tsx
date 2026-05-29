import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ZaptroRoutesInner } from '../pages/ZaptroRoutes';
import ZaptroAppModuleShell from './ZaptroAppModuleShell';
import './zaptroAppModule.css';

const ZaptroAppRoutesPage: React.FC = () => {
  const { profile, isMaster } = useAuth();

  if (!profile?.company_id && !isMaster) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          gap: 20,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid #e2e8f0',
            borderTopColor: '#000',
            borderRadius: '50%',
            animation: 'zaptroAppRoutesSpin 1s linear infinite',
          }}
        />
        <p style={{ color: '#949494', fontSize: 14, fontWeight: 600 }}>A identificar a sua empresa…</p>
        <style>{`@keyframes zaptroAppRoutesSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <ZaptroAppModuleShell fullBleed>
      <ZaptroRoutesInner />
    </ZaptroAppModuleShell>
  );
};

export default ZaptroAppRoutesPage;
