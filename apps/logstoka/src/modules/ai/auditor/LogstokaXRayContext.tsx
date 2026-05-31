import React, { createContext, useContext, useState, useCallback } from 'react';

export type XRayPageContext = 
  | 'products'
  | 'stock'
  | 'movements'
  | 'integrations'
  | 'marketplace'
  | 'conference'
  | 'picking'
  | 'operational'
  | 'activities'
  | 'settings'
  | 'dashboard'
  | 'reports'
  | 'global';

type XRayContextType = {
  isOpen: boolean;
  activeContext: XRayPageContext;
  openXRay: (context: XRayPageContext, onResolveCallback?: () => void) => void;
  closeXRay: () => void;
  onResolve: () => void;
};

const LogstokaXRayContext = createContext<XRayContextType | undefined>(undefined);

export const LogstokaXRayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeContext, setActiveContext] = useState<XRayPageContext>('global');
  const [resolveCallback, setResolveCallback] = useState<(() => void) | undefined>(undefined);

  const openXRay = useCallback((context: XRayPageContext, onResolveCallback?: () => void) => {
    setActiveContext(context);
    setResolveCallback(() => onResolveCallback);
    setIsOpen(true);
  }, []);

  const closeXRay = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onResolve = useCallback(() => {
    if (resolveCallback) {
      resolveCallback();
    }
  }, [resolveCallback]);

  return (
    <LogstokaXRayContext.Provider value={{ isOpen, activeContext, openXRay, closeXRay, onResolve }}>
      {children}
    </LogstokaXRayContext.Provider>
  );
};

export const useLogstokaXRay = () => {
  const context = useContext(LogstokaXRayContext);
  if (!context) {
    throw new Error('useLogstokaXRay must be used within a LogstokaXRayProvider');
  }
  return context;
};
