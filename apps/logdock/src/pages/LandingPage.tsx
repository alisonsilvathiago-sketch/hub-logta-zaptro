import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/context/AuthContext';
import { 
  Shield, HardDrive, Zap, ChevronRight, 
  Search, Check, ArrowRight, Menu, X, 
  Globe, Clock, Layout, MessageSquare, 
  FileText, Briefcase, Truck, HardHat, Code2, Lock,
  ChevronDown, Mail, ShieldCheck
} from 'lucide-react';
import Logo from '../components/Logo';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('organizacao');
  const [expandedFooter, setExpandedFooter] = useState<string | null>(null);

  // Toggle footer accordion on mobile
  const toggleFooter = (col: string) => {
    if (window.innerWidth < 768) {
      setExpandedFooter(expandedFooter === col ? null : col);
    }
  };

  return (
    <div className="lp-container">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary: #0061FF;
          --primary-dark: #004ecc;
          --text-main: #1E1E1E;
          --text-muted: #64748B;
          --bg-light: #F8FAFC;
          --bg-white: #FFFFFF;
          --border: #E2E8F0;
          --font-main: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: var(--font-main);
          color: var(--text-main);
          overflow-x: hidden;
          background-color: var(--bg-white);
          line-height: 1.5;
        }

        .lp-container {
          width: 100%;
        }

        /* --- Header --- */
        .header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 72px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border);
          z-index: 1000;
          display: flex;
          align-items: center;
        }

        .header-content {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-desktop {
          display: none;
        }

        .header-actions {
          display: none;
        }

        .menu-toggle {
          display: block;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-main);
        }

        /* --- Mobile Menu --- */
        .mobile-menu {
          position: fixed;
          top: 72px;
          left: 0;
          width: 100%;
          height: calc(100vh - 72px);
          background: var(--bg-white);
          z-index: 999;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          transform: translateX(100%);
          transition: transform 0.3s ease;
        }

        .mobile-menu.open {
          transform: translateX(0);
        }

        .mobile-nav-link {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-main);
          text-decoration: none;
        }

        .mobile-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: auto;
        }

        /* --- Hero Section --- */
        .hero {
          padding: 120px 20px 60px;
          background-color: var(--bg-light);
          text-align: center;
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .hero-title {
          font-size: clamp(32px, 8vw, 64px);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -1px;
        }

        .hero-subtitle {
          font-size: clamp(16px, 4vw, 20px);
          color: var(--text-muted);
          margin-bottom: 40px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .cta-btn-large {
          background-color: var(--primary);
          color: white;
          padding: 18px 36px;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
          width: 100%;
          justify-content: center;
        }

        .cta-btn-large:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 97, 255, 0.2);
        }

        .hero-image-container {
          margin-top: 60px;
          position: relative;
        }

        .hero-image {
          width: 100%;
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
        }

        /* --- Trust Section --- */
        .trust-section {
          padding: 40px 0;
          border-bottom: 1px solid var(--border);
        }

        .trust-title {
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 32px;
        }

        .trust-logos-wrapper {
          overflow-x: auto;
          padding-bottom: 10px;
          -webkit-overflow-scrolling: touch;
        }

        .trust-logos {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 40px;
          padding: 0 20px;
          width: max-content;
          margin: 0 auto;
        }

        .trust-logo {
          font-size: 20px;
          font-weight: 900;
          color: #CBD5E1;
          letter-spacing: 2px;
        }

        /* --- Features Section --- */
        .features {
          padding: 80px 20px;
        }

        .section-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 60px;
        }

        .section-title {
          font-size: clamp(28px, 5vw, 42px);
          font-weight: 800;
          margin-bottom: 16px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
        }

        .feature-card {
          padding: 32px;
          border-radius: 20px;
          background: var(--bg-light);
          transition: all 0.3s;
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          background: white;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        /* --- Security Section (Dark) --- */
        .security {
          background-color: #0F172A;
          color: white;
          padding: 100px 20px;
        }

        .security-content {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 60px;
          align-items: center;
        }

        .security-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 97, 255, 0.1);
          color: var(--primary);
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 24px;
        }

        /* --- Footer --- */
        .footer {
          background: #f8fafc;
          padding: 80px 20px 40px;
          border-top: 1px solid var(--border);
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .footer-col-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          padding: 16px 0;
          border-bottom: 1px solid var(--border);
        }

        .footer-col-title {
          font-size: 16px;
          font-weight: 700;
        }

        .footer-links {
          display: none;
          flex-direction: column;
          gap: 12px;
          padding: 16px 0;
        }

        .footer-links.open {
          display: flex;
        }

        .footer-link {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        /* --- Desktop Adaptations --- */
        @media (min-width: 768px) {
          .cta-btn-large {
            width: auto;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .footer-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .footer-col-header {
            cursor: default;
            border-bottom: none;
            padding: 0;
            margin-bottom: 24px;
          }

          .footer-col-header svg {
            display: none;
          }

          .footer-links {
            display: flex !important;
          }
        }

        @media (min-width: 1024px) {
          .header-content {
            padding: 0 40px;
          }

          .nav-desktop {
            display: flex;
            gap: 32px;
          }

          .nav-link {
            text-decoration: none;
            color: var(--text-main);
            font-size: 15px;
            font-weight: 600;
            transition: color 0.2s;
          }

          .nav-link:hover {
            color: var(--primary);
          }

          .header-actions {
            display: flex;
            align-items: center;
            gap: 24px;
          }

          .menu-toggle {
            display: none;
          }

          .hero {
            padding: 160px 40px 100px;
            text-align: left;
          }

          .hero-content {
            display: flex;
            align-items: center;
            gap: 80px;
            max-width: 1280px;
          }

          .hero-text {
            flex: 1;
          }

          .hero-visual {
            flex: 1;
            margin-top: 0;
          }

          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .security-content {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <Logo style={{ height: '32px', width: 'auto' }} />
          
          <nav className="nav-desktop">
            <a href="#features" className="nav-link">Recursos</a>
            <a href="#security" className="nav-link">Segurança</a>
            <a href="#pricing" className="nav-link">Preços</a>
            <a href="#blog" className="nav-link">Blog</a>
          </nav>

          <div className="header-actions">
            <button className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => navigate('/login')}>Entrar</button>
            <button className="cta-btn-large" style={{ padding: '10px 24px', fontSize: '15px' }} onClick={() => navigate('/login')}>Começar agora</button>
          </div>

          <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <a href="#features" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Recursos</a>
        <a href="#security" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Segurança</a>
        <a href="#pricing" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Preços</a>
        <a href="#blog" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Blog</a>
        <div className="mobile-actions">
          <button className="cta-btn-large" style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--border)' }} onClick={() => navigate('/login')}>Entrar</button>
          <button className="cta-btn-large" onClick={() => navigate('/login')}>Começar agora</button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text animate-fade">
            <h1 className="hero-title">A base sólida para sua operação logística</h1>
            <p className="hero-subtitle">
              O LogDock centraliza seus documentos, frotas e operações em uma única plataforma inteligente. Organize, automatize e escale sem esforço.
            </p>
            <button className="cta-btn-large" onClick={() => navigate('/login')}>
              Experimentar Grátis <ArrowRight size={20} />
            </button>
            <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
              <Check size={14} color="#10B981" style={{ display: 'inline', marginRight: '6px' }} /> 
              Não é necessário cartão de crédito
            </p>
          </div>
          <div className="hero-visual animate-fade" style={{ animationDelay: '0.2s' }}>
            <img 
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80" 
              alt="Logistics Dashboard" 
              className="hero-image" 
            />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust-section">
        <p className="trust-title">Confiado pelas maiores operadoras do Brasil</p>
        <div className="trust-logos-wrapper">
          <div className="trust-logos">
            <span className="trust-logo">LOGTA</span>
            <span className="trust-logo">ZAPTRO</span>
            <span className="trust-logo">FAST-HUB</span>
            <span className="trust-logo">MASTERSHIP</span>
            <span className="trust-logo">CARGO_X</span>
            <span className="trust-logo">TRANS_GO</span>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="features" className="features">
        <div className="section-header">
          <h2 className="section-title">Construído para a velocidade da sua frota</h2>
          <p className="hero-subtitle">Ferramentas poderosas que eliminam a burocracia e dão clareza total ao seu negócio.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><HardDrive size={28} /></div>
            <h3 style={{ marginBottom: '12px', fontWeight: 800 }}>Gestão de Arquivos</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Armazenamento inteligente com indexação automática de comprovantes e documentos.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Zap size={28} /></div>
            <h3 style={{ marginBottom: '12px', fontWeight: 800 }}>Automação Inteligente</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Deixe que a IA classifique seus arquivos e renomeie pastas de acordo com sua operação.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Search size={28} /></div>
            <h3 style={{ marginBottom: '12px', fontWeight: 800 }}>Busca com OCR</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Encontre qualquer informação dentro de fotos de comprovantes em milissegundos.</p>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="security">
        <div className="security-content">
          <div>
            <div className="security-badge"><ShieldCheck size={16} /> Segurança de Nível Bancário</div>
            <h2 className="section-title" style={{ color: 'white' }}>Seus dados são o seu maior ativo. Nós os protegemos.</h2>
            <p style={{ color: '#94A3B8', fontSize: '18px', marginBottom: '32px' }}>
              Criptografia de ponta a ponta, autenticação em dois fatores e logs de auditoria completos para sua tranquilidade.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600 }}>
                <Check size={18} color="var(--primary)" /> ISO 27001 Compliant
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600 }}>
                <Check size={18} color="var(--primary)" /> LGPD Ready
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600 }}>
                <Check size={18} color="var(--primary)" /> 99.9% Uptime SLA
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600 }}>
                <Check size={18} color="var(--primary)" /> Backups Diários
              </div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <img 
              src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80" 
              alt="Security" 
              style={{ width: '100%', borderRadius: '24px', opacity: 0.6 }} 
            />
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'white', color: 'black', padding: '16px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Lock size={20} color="var(--primary)" />
              <span style={{ fontWeight: 800, fontSize: '14px' }}>Criptografia AES-256 Ativa</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <Logo style={{ height: '28px', marginBottom: '24px' }} />
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              A plataforma inteligente para gestão de frotas e documentos logísticos.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Globe size={20} color="var(--text-muted)" />
              <MessageSquare size={20} color="var(--text-muted)" />
              <Mail size={20} color="var(--text-muted)" />
            </div>
          </div>

          <div>
            <div className="footer-col-header" onClick={() => toggleFooter('produto')}>
              <span className="footer-col-title">Produto</span>
              <ChevronDown size={18} className={expandedFooter === 'produto' ? 'rotate-180' : ''} />
            </div>
            <div className={`footer-links ${expandedFooter === 'produto' ? 'open' : ''}`}>
              <a href="#" className="footer-link">Recursos</a>
              <a href="#" className="footer-link">Segurança</a>
              <a href="#" className="footer-link">Integrações</a>
              <a href="#" className="footer-link">Preços</a>
            </div>
          </div>

          <div>
            <div className="footer-col-header" onClick={() => toggleFooter('empresa')}>
              <span className="footer-col-title">Empresa</span>
              <ChevronDown size={18} className={expandedFooter === 'empresa' ? 'rotate-180' : ''} />
            </div>
            <div className={`footer-links ${expandedFooter === 'empresa' ? 'open' : ''}`}>
              <a href="#" className="footer-link">Sobre nós</a>
              <a href="#" className="footer-link">Blog</a>
              <a href="#" className="footer-link">Carreiras</a>
              <a href="#" className="footer-link">Contato</a>
            </div>
          </div>

          <div>
            <div className="footer-col-header" onClick={() => toggleFooter('suporte')}>
              <span className="footer-col-title">Suporte</span>
              <ChevronDown size={18} className={expandedFooter === 'suporte' ? 'rotate-180' : ''} />
            </div>
            <div className={`footer-links ${expandedFooter === 'suporte' ? 'open' : ''}`}>
              <a href="#" className="footer-link">Centro de Ajuda</a>
              <a href="#" className="footer-link">API Docs</a>
              <a href="#" className="footer-link">Status do Sistema</a>
              <a href="#" className="footer-link">Privacidade</a>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1280px', margin: '40px auto 0', paddingTop: '40px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>© 2026 LogDock. Todos os direitos reservados.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="#" className="footer-link" style={{ fontSize: '13px' }}>Termos de Serviço</a>
            <a href="#" className="footer-link" style={{ fontSize: '13px' }}>Política de Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
