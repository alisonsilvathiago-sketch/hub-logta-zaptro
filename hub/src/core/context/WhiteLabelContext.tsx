import React, { createContext, useContext, useState, useEffect } from 'react';

type WhiteLabelSettings = {
  name: string;
  slogan: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string | null;
};

type WhiteLabelState = {
  logta: WhiteLabelSettings;
  zaptro: WhiteLabelSettings;
  logdock: WhiteLabelSettings;
};

type WhiteLabelContextType = {
  settings: WhiteLabelState;
  updateSettings: (project: keyof WhiteLabelState, newSettings: Partial<WhiteLabelSettings>) => void;
};

const defaultSettings: WhiteLabelState = {
  logta: {
    name: 'Logta ERP Master',
    slogan: 'Gestão logística e faturamento de alta performance.',
    primaryColor: '#0061FF',
    secondaryColor: '#0061FF',
    logo: null,
  },
  zaptro: {
    name: 'Zaptro Master Dashboard',
    slogan: 'Automação multicanal e engajamento em escala.',
    primaryColor: '#7C3AED',
    secondaryColor: '#0061FF',
    logo: null,
  },
  logdock: {
    name: 'LogDock Cloud Storage',
    slogan: 'Infraestrutura de armazenamento e cluster de dados.',
    primaryColor: '#0061FF',
    secondaryColor: '#0061FF',
    logo: null,
  },
};

const WhiteLabelContext = createContext<WhiteLabelContextType | undefined>(undefined);

export const WhiteLabelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WhiteLabelState>(() => {
    const saved = localStorage.getItem('hub-white-label-settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('hub-white-label-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (project: keyof WhiteLabelState, newSettings: Partial<WhiteLabelSettings>) => {
    setSettings(prev => ({
      ...prev,
      [project]: { ...prev[project], ...newSettings },
    }));
  };

  return (
    <WhiteLabelContext.Provider value={{ settings, updateSettings }}>
      {children}
    </WhiteLabelContext.Provider>
  );
};

export const useWhiteLabel = () => {
  const context = useContext(WhiteLabelContext);
  if (!context) {
    throw new Error('useWhiteLabel must be used within a WhiteLabelProvider');
  }
  return context;
};
