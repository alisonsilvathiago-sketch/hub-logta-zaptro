import React, { createContext, useContext, useEffect } from 'react';
import { initKeyboardEngine, registerShortcut } from '@shared/lib/keyboardEngine';
import { useNavigate } from 'react-router-dom';

const KeyboardContext = createContext<any>(null);

export const KeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const cleanup = initKeyboardEngine();

    // Register Global Shortcuts
    registerShortcut({
      key: 'k',
      ctrl: true,
      description: 'Abrir Busca de Comandos',
      action: () => window.dispatchEvent(new CustomEvent('open-command-palette'))
    });

    registerShortcut({
      key: 'p',
      ctrl: true,
      description: 'Ir para Perfil',
      action: () => navigate('/master/configuracoes/perfil')
    });

    registerShortcut({
      key: 'l',
      ctrl: true,
      description: 'Ir para Logística',
      action: () => navigate('/master/logistica')
    });

    registerShortcut({
      key: 'c',
      ctrl: true,
      description: 'Ir para CRM',
      action: () => navigate('/master/crm')
    });

    registerShortcut({
      key: 'h',
      ctrl: true,
      description: 'Ir para Dashboard',
      action: () => navigate('/master')
    });

    registerShortcut({
      key: 'f',
      ctrl: true,
      description: 'Ir para Financeiro',
      action: () => navigate('/master/billing?tab=financeiro')
    });

    registerShortcut({
      key: 'b',
      ctrl: true,
      description: 'Ir para Backup',
      action: () => navigate('/master/infrastructure?tab=backup')
    });

    registerShortcut({
      key: 'p',
      ctrl: true,
      shift: true,
      description: 'Criar / Ver Planos',
      action: () => navigate('/master/plans')
    });

    registerShortcut({
      key: 'e',
      ctrl: true,
      description: 'Ir para Empresas',
      action: () => navigate('/master/companies')
    });

    registerShortcut({
      key: 's',
      ctrl: true,
      description: 'Salvar / Salvar Alterações',
      action: () => window.dispatchEvent(new CustomEvent('global-save'))
    });

    registerShortcut({
      key: 'n',
      ctrl: true,
      description: 'Novo Item / Criar',
      action: () => window.dispatchEvent(new CustomEvent('global-new'))
    });

    registerShortcut({
      key: 'Escape',
      description: 'Fechar Modais / Menus',
      action: () => {
        window.dispatchEvent(new CustomEvent('close-all-modals'));
      }
    });

    return () => cleanup();
  }, [navigate]);

  return (
    <KeyboardContext.Provider value={{}}>
      {children}
    </KeyboardContext.Provider>
  );
};

export const useKeyboard = () => useContext(KeyboardContext);
