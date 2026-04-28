import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Box, Shield, Truck } from 'lucide-react';
import SEOManager from '../components/SEOManager';

const styles: Record<string, any> = {
  page: { 
    width: '100vw', 
    minHeight: '100vh', 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#020617', 
    fontFamily: 'Inter, sans-serif',
    color: '#F8FAFC',
    padding: '40px 20px',
    textAlign: 'center'
  },
  container: {
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  tag: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    color: '#38BDF8',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    alignSelf: 'center'
  },
  title: {
    fontSize: 'clamp(32px, 8vw, 72px)',
    fontWeight: '900',
    letterSpacing: '-2px',
    lineHeight: 1,
    margin: 0,
    background: 'linear-gradient(to bottom, #FFFFFF 0%, #94A3B8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    fontSize: '18px',
    color: '#94A3B8',
    lineHeight: 1.6,
    maxWidth: '600px',
    margin: '0 auto'
  },
  actions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginTop: '16px'
  },
  btnPrimary: {
    padding: '16px 32px',
    backgroundColor: '#38BDF8',
    color: '#020617',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'transform 0.2s'
  },
  btnSecondary: {
    padding: '16px 32px',
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    border: '2px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }
};

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <SEOManager 
        title="Logta SaaS | Logística 360°" 
        description="Gestão de frotas, fretes e motoristas em uma única plataforma." 
      />
      
      <div style={styles.container}>
        <div style={styles.tag}>
          <Truck size={16} /> LOGTA ECOSSISTEMA 360°
        </div>

        <h1 style={styles.title}>
          Logística de Alta <br />
          Performance.
        </h1>

        <p style={styles.subtitle}>
          A plataforma SaaS completa para transportadoras. Controle sua operação, gerencie motoristas e escale seu negócio com tecnologia de ponta.
        </p>

        <div style={styles.actions}>
          <button style={styles.btnPrimary} onClick={() => navigate('/login')}>
            GERENCIAR OPERAÇÃO <ArrowRight size={20} />
          </button>
          <button style={styles.btnSecondary}>
            <Shield size={18} /> SEGURANÇA TOTAL
          </button>
        </div>
      </div>

      <div style={{ marginTop: '80px', display: 'flex', gap: '40px', opacity: 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Box size={20} /> Entregas Inteligentes</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={20} /> Frota Conectada</div>
      </div>
    </div>
  );
};

export default Home;
