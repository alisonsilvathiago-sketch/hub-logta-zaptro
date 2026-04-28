import React, { useState, useEffect } from 'react';
import { X, Zap, CheckCircle2 } from 'lucide-react';
import { ZaptroWhatsappQrConnectPanel } from './ZaptroWhatsappQrConnectPanel';

export type WhatsAppActivationModalProps = {
  companyId: string;
  onClose: () => void;
};

/**
 * Modal de Ativação Premium (Light Version)
 * Background: #F4F4F4
 * Overlay: Transparente/Sutil
 */
export const WhatsAppActivationModal: React.FC<WhatsAppActivationModalProps> = ({
  companyId,
  onClose,
}) => {
  const [step, setStep] = useState<'intro' | 'loading' | 'connecting' | 'success'>('intro');
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const startConnection = () => {
    setStep('loading');
    // Simula uma preparação de ambiente para ficar mais "Premium"
    setTimeout(() => {
      setStep('connecting');
    }, 2000);
  };

  const handleConnected = () => {
    setStep('success');
    // Auto-close after success animation
    setTimeout(handleClose, 4000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Overlay transparente para ver o sistema atrás (conforme pedido)
        backgroundColor: 'rgba(0, 0, 0, 0.12)',
        backdropFilter: 'blur(3px)',
        opacity: isClosing ? 0 : 1,
        transition: 'opacity 0.4s ease',
        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      }}
    >
      <div
        className="wa-activation-card"
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: '#F4F4F4', // Tonalidade exata solicitada (F4F4F4)
          borderRadius: 28,
          padding: 32,
          position: 'relative',
          boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,1)',
          transform: isClosing ? 'scale(0.95) translateY(10px)' : 'scale(1) translateY(0)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(0,0,0,0.04)',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#0F172A',
            zIndex: 10,
          }}
        >
          <X size={18} />
        </button>

        {step === 'intro' && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                backgroundColor: '#0F172A',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
              }}
            >
              <Zap size={32} fill="#D9FF00" color="#D9FF00" />
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Conecte seu WhatsApp
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: '0 0 32px', fontWeight: 600 }}>
              Você ainda não conectou seu WhatsApp. Sem isso, várias funções importantes de logística e automação não vão funcionar.
            </p>

            <button
              onClick={startConnection}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#D9FF00',
                color: '#0F172A',
                border: 'none',
                borderRadius: 16,
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(217, 255, 0, 0.3)',
                transition: 'transform 0.2s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              👉 Conectar WhatsApp agora
            </button>

            <button
              onClick={handleClose}
              style={{
                marginTop: 20,
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Fazer depois
            </button>
          </div>
        )}

        {step === 'loading' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="zaptro-loader-premium" style={{ marginBottom: 24 }}>
               <div className="zaptro-loader-inner" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Escaneando ambiente...
            </h3>
            <p style={{ fontSize: 14, color: '#64748B', fontWeight: 600 }}>
              Iniciando conexão segura com seu WhatsApp.
            </p>
          </div>
        )}

        {step === 'connecting' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 20, letterSpacing: '-0.5px' }}>
              Escaneie o código QR
            </h3>
            <div style={{ 
              backgroundColor: '#FFF', 
              padding: 20, 
              borderRadius: 20, 
              border: '1.5px solid #E2E8F0',
              marginBottom: 16
            }}>
              <ZaptroWhatsappQrConnectPanel 
                companyId={companyId} 
                autoStartWhenReady={true}
                compact={true}
                onConnected={handleConnected}
              />
            </div>
            <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
              Aguardando conexão real com sua instância...
            </p>
          </div>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 32px' }}>
              {/* Animação de Raios (Zaptro Style) */}
              <div className="success-rays">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className="ray" 
                    style={{ 
                      transform: `rotate(${i * 45}deg) translateY(-50px)`,
                      animationDelay: `${i * 0.1}s`
                    }} 
                  />
                ))}
              </div>
              <div
                style={{
                  position: 'relative',
                  width: 100,
                  height: 100,
                  backgroundColor: '#D9FF00',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(217, 255, 0, 0.6)',
                  zIndex: 2,
                }}
              >
                <Zap size={48} fill="#0F172A" color="#0F172A" />
              </div>
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-1px' }}>
              🎉 Parabéns!
            </h2>
            <p style={{ fontSize: 16, color: '#0F172A', fontWeight: 700, marginBottom: 4 }}>
              Seu WhatsApp foi conectado com sucesso.
            </p>
            <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
              O sistema está sendo atualizado...
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes zaptroRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .zaptro-loader-premium {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justifyContent: center;
        }
        .zaptro-loader-inner {
          width: 100%;
          height: 100%;
          border: 4px solid rgba(15, 23, 42, 0.05);
          border-top-color: #D9FF00;
          border-radius: 50%;
          animation: zaptroRotate 1s cubic-bezier(0.55, 0.055, 0.675, 0.19) infinite;
        }
        .zaptro-loader-premium::after {
          content: '';
          position: absolute;
          width: 60%;
          height: 60%;
          border: 4px solid rgba(217, 255, 0, 0.1);
          border-bottom-color: #0F172A;
          border-radius: 50%;
          animation: zaptroRotate 1.5s reverse linear infinite;
        }
        @keyframes successRay {
          0%, 100% { height: 0; opacity: 0; }
          50% { height: 35px; opacity: 1; }
        }
        .success-rays {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justifyContent: center;
          animation: rotateRays 8s linear infinite;
        }
        @keyframes rotateRays {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .ray {
          position: absolute;
          width: 5px;
          background: #D9FF00;
          border-radius: 3px;
          animation: successRay 1s ease-in-out infinite;
          transform-origin: center;
        }
        .wa-activation-card {
          animation: modalAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalAppear {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
