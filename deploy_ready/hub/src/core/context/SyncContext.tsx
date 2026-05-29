import React, { createContext, useContext, useState, useCallback } from 'react';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface SyncContextType {
  status: SyncStatus;
  startSync: () => void;
  setSyncSuccess: () => void;
  setSyncError: () => void;
  triggerRefresh: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<SyncStatus>('idle');

  const startSync = useCallback(() => setStatus('syncing'), []);
  
  const setSyncSuccess = useCallback(() => {
    setStatus('success');
    setTimeout(() => setStatus('idle'), 2500);
  }, []);

  const setSyncError = useCallback(() => {
    setStatus('error');
    setTimeout(() => setStatus('idle'), 3500);
  }, []);

  const triggerRefresh = useCallback(() => {
    setStatus('syncing');
    // Simula uma pequena latência visual antes do reload
    setTimeout(() => {
      window.location.reload();
    }, 800);
  }, []);

  return (
    <SyncContext.Provider value={{ status, startSync, setSyncSuccess, setSyncError, triggerRefresh }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used within a SyncProvider');
  return context;
};
