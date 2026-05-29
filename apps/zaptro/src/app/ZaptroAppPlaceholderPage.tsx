import React from 'react';
import { useLocation } from 'react-router-dom';

const PLACEHOLDERS: Record<string, { title: string; subtitle: string }> = {
  '/app/contatos': {
    title: 'Contatos',
    subtitle: 'Gerencie a sua base de contactos WhatsApp.',
  },
  '/app/logistica': {
    title: 'Logística',
    subtitle: 'Rastreamento e entregas integradas ao chat.',
  },
  '/app/arquivos': {
    title: 'Arquivos',
    subtitle: 'Mídias e documentos das conversas.',
  },
  '/app/configuracoes': {
    title: 'Configurações',
    subtitle: 'Preferências da sua conta Zaptro.',
  },
  '/app/perfil': {
    title: 'Meu perfil',
    subtitle: 'Dados da conta e empresa vinculada ao seu utilizador.',
  },
};

const ZaptroAppPlaceholderPage: React.FC = () => {
  const { pathname } = useLocation();
  const meta = PLACEHOLDERS[pathname] ?? { title: 'Em breve', subtitle: 'Este módulo será activado na sua conta em breve.' };
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        background: '#f8fafc',
        color: '#0f172a',
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'rgba(217,255,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          fontWeight: 800,
          marginBottom: 20,
        }}
      >
        Z
      </div>
      <h1 style={{ margin: '0 0 8px', fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: '#000' }}>
        {meta.title}
      </h1>
      <p style={{ margin: 0, maxWidth: 420, color: '#949494', lineHeight: 1.55 }}>
        {meta.subtitle}
      </p>
    </div>
  );
};

export default ZaptroAppPlaceholderPage;
