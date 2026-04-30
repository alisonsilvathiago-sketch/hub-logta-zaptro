
import React from 'react';
import { ShieldAlert, CreditCard, Lock, ArrowRight } from 'lucide-react';

interface BlockedScreenProps {
  reason: string;
}

const BlockedScreen: React.FC<BlockedScreenProps> = ({ reason }) => {
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: '#0F172A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(20px)',
        borderRadius: '32px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '48px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px',
          border: '1px solid rgba(244, 63, 94, 0.2)'
        }}>
          <ShieldAlert size={40} color="#F43F5E" />
        </div>

        <h1 style={{
          color: '#F8FAFC',
          fontSize: '24px',
          fontWeight: '800',
          marginBottom: '16px',
          letterSpacing: '-0.5px'
        }}>
          Acesso Restrito
        </h1>

        <p style={{
          color: '#94A3B8',
          fontSize: '15px',
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          O acesso aos módulos operacionais do Logta foi temporariamente suspenso pela administração central.
          <br /><br />
          <strong style={{ color: '#F43F5E' }}>Motivo: {reason}</strong>
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button 
            style={{
              backgroundColor: '#6366F1',
              color: 'white',
              border: 'none',
              padding: '16px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onClick={() => window.location.reload()}
          >
            Tentar Novamente <ArrowRight size={18} />
          </button>
          
          <button 
            style={{
              backgroundColor: 'transparent',
              color: '#94A3B8',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              padding: '16px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onClick={() => window.open('https://ajuda.logta.com.br', '_blank')}
          >
            Falar com Suporte Financeiro
          </button>
        </div>

        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'center',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '11px', fontWeight: '600' }}>
            <Lock size={14} /> SEGURANÇA MASTER
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '11px', fontWeight: '600' }}>
            <CreditCard size={14} /> FATURAMENTO ATIVO
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockedScreen;
