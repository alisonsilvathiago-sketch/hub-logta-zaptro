import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ZAPTRO_HERO_SPLIT_PANEL_CLASS, zaptroHeroSplitPanelCss } from '../utils/zaptroMarketingHeroBackground';
import ZaptroHeroParticleCanvas from '../components/Zaptro/ZaptroHeroParticleCanvas';
import SEOManager from '../components/SEOManager';

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    overflow: 'hidden',
    backgroundColor: '#ebebeb',
    fontFamily: 'Inter, sans-serif',
  },
  leftSide: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoTop: {
    position: 'absolute',
    top: '50px',
    left: '60px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    fontSize: '24px',
    fontWeight: 700,
    letterSpacing: '-1.5px',
    zIndex: 10,
  },
  centerBox: { zIndex: 10, textAlign: 'center' },
  mainPhrase: {
    fontSize: 'clamp(40px, 6vw, 84px)',
    fontWeight: 700,
    color: '#0a0a0a',
    lineHeight: 0.9,
    textTransform: 'uppercase',
    letterSpacing: '-4px',
  },
  rightSide: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mouseGlow: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(217, 255, 0, 0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
    transform: 'translate(-50%, -50%)',
  },
  heroContent: { position: 'relative', zIndex: 10, width: '90%', maxWidth: '550px', textAlign: 'center' },
  heroTitle: {
    fontSize: '56px',
    fontWeight: 700,
    color: '#000',
    letterSpacing: '-2px',
    lineHeight: 1,
    marginBottom: '24px',
  },
  heroSubtitle: { fontSize: '16px', color: '#949494', fontWeight: 600, lineHeight: 1.6, marginBottom: '48px' },
  heroActions: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: {
    padding: '18px 45px',
    backgroundColor: '#000',
    color: '#D9FF00',
    borderRadius: '18px',
    fontSize: '16px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  btnSecondary: {
    padding: '18px 45px',
    backgroundColor: '#fff',
    color: '#000',
    borderRadius: '18px',
    fontSize: '16px',
    fontWeight: 700,
    border: '2px solid #000',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
};

const ZapRay = ({ size = 24, color = '#D9FF00' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill={color} />
  </svg>
);

const Home: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: -2000, y: -2000 });

  return (
    <div style={styles.page}>
      <SEOManager
        title="Zaptro | WhatsApp em Máquina de Vendas"
        description="Controle total das conversas e automação inteligente."
        keywords="zaptro, whatsapp, vendas, automação"
      />

      <div style={styles.leftSide} className={`leftSide ${ZAPTRO_HERO_SPLIT_PANEL_CLASS}`}>
        <ZaptroHeroParticleCanvas grid={40} />
        <div style={styles.logoTop}>
          <ZapRay size={28} />
          <span style={{ color: '#0a0a0a' }}>ZAPTRO</span>
        </div>
        <div style={styles.centerBox}>
          <div style={styles.mainPhrase}>
            O FUTURO É <span style={{ color: '#D9FF00' }}>INTELIGENTE.</span>
          </div>
        </div>
      </div>

      <div
        className="rightSide"
        style={styles.rightSide}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
        }}
        onMouseLeave={() => setMousePos({ x: -2000, y: -2000 })}
      >
        <div style={{ ...styles.mouseGlow, left: mousePos.x, top: mousePos.y }} />

        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>WhatsApp em Máquina de Vendas.</h1>
          <p style={styles.heroSubtitle}>Controle total das conversas e automação inteligente.</p>

          <div style={styles.heroActions}>
            <button type="button" style={styles.btnPrimary}>
              PRIMEIROS PASSOS <ArrowRight size={20} />
            </button>
            <button type="button" style={styles.btnSecondary}>
              FALAR COM VENDAS <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        ${zaptroHeroSplitPanelCss()}
        @media (max-width: 1024px) {
          .leftSide { display: none !important; }
          .rightSide { width: 100% !important; flex: 1 !important; }
        }
      `}</style>
    </div>
  );
};

export default Home;
