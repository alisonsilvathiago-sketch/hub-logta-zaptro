import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Menu, Sparkles, Star, X } from 'lucide-react';
import Logo from '../components/Logo';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedFooter, setExpandedFooter] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFooter = (col: string) => {
    if (window.innerWidth < 768) setExpandedFooter(expandedFooter === col ? null : col);
  };

  const brands = useMemo(() => ['logta', 'zaptro', 'fast hub', 'zoom', 'meta', 'slack', 'amazon'], []);

  const blocks = useMemo(
    () => [
      {
        k: '01',
        eyebrow: 'Operação',
        title: 'Tudo em um lugar, sem ruído',
        desc: 'Organize documentos, rotinas e times em um fluxo simples — com visual leve e objetivo.',
        side: 'left' as const,
      },
      {
        k: '02',
        eyebrow: 'Produtividade',
        title: 'Automação que some do caminho',
        desc: 'Padronize nomes, pastas e validações para reduzir retrabalho e acelerar o dia a dia.',
        side: 'right' as const,
      },
      {
        k: '03',
        eyebrow: 'Resultados',
        title: 'Clareza para decidir mais rápido',
        desc: 'Entregas, relatórios e auditoria em um layout que você consegue “escanear” em segundos.',
        side: 'left' as const,
      },
    ],
    [],
  );

  const faqs = useMemo(
    () => [
      {
        q: 'Consigo usar o LogDock sem cartão de crédito?',
        a: 'Sim. Você pode começar e explorar a plataforma sem adicionar cartão. Quando decidir, você faz o upgrade com 1 clique.',
      },
      {
        q: 'A página de vendas é pública e o app é privado?',
        a: 'Sim. A landing fica em `/` e o sistema fica em `/app/*`, protegido por login. Assim você mantém marketing separado do painel.',
      },
      {
        q: 'Qual é o “azul do LogDock” usado no rodapé?',
        a: 'Estamos usando o mesmo tom base do produto: `#0061FF`, com um degradê leve para dar profundidade.',
      },
      {
        q: 'Dá para trocar textos depois?',
        a: 'Sim. Essa landing foi montada em blocos, então dá pra ajustar conteúdo/ordem rápido sem mexer nas rotas do sistema.',
      },
    ],
    [],
  );

  return (
    <div className="lp-container">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root {
          --primary: #0061FF; /* LogDock blue */
          --primary-2: #8B5CF6; /* accent */
          --text-main: #0F172A;
          --text-muted: #64748B;
          --bg: #ffffff;
          --bg-soft: #F6F7FB;
          --card: #ffffff;
          --border: rgba(15, 23, 42, 0.08);
          --shadow: 0 30px 80px rgba(2, 6, 23, 0.10);
          --font-main: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: var(--font-main);
          color: var(--text-main);
          overflow-x: hidden;
          background-color: var(--bg);
          line-height: 1.5;
        }

        .lp-container { width: 100%; }

        .header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 72px;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border);
          z-index: 1000;
          display: flex;
          align-items: center;
        }

        .header-content {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .nav-desktop { display: none; align-items: center; gap: 28px; }
        .header-actions { display: none; }

        .menu-toggle {
          display: block;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-main);
        }

        .mobile-menu {
          position: fixed;
          top: 72px;
          left: 0;
          width: 100%;
          height: calc(100vh - 72px);
          background: var(--bg);
          z-index: 999;
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transform: translateX(100%);
          transition: transform 0.28s ease;
        }

        .mobile-menu.open { transform: translateX(0); }

        .mobile-nav-link {
          font-size: 18px;
          font-weight: 900;
          color: var(--text-main);
          text-decoration: none;
          padding: 14px 14px;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: rgba(2, 6, 23, 0.02);
        }

        .mobile-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: auto;
        }

        .btn {
          border: none;
          cursor: pointer;
          border-radius: 14px;
          font-weight: 950;
          letter-spacing: -0.01em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
          white-space: nowrap;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary) 0%, #2B7BFF 40%, var(--primary-2) 100%);
          color: #fff;
          box-shadow: 0 18px 40px rgba(0, 97, 255, 0.25);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 22px 55px rgba(0, 97, 255, 0.30); }

        .btn-ghost {
          background: rgba(2, 6, 23, 0.04);
          color: var(--text-main);
          border: 1px solid var(--border);
        }
        .btn-ghost:hover { transform: translateY(-1px); }

        .hero {
          padding: 122px 20px 26px;
          position: relative;
          overflow: hidden;
          background: #ffffff;
        }

        .hero-content { max-width: 1200px; margin: 0 auto; }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(2, 6, 23, 0.08);
          background: rgba(2, 6, 23, 0.02);
          color: var(--text-main);
          font-size: 13px;
          font-weight: 950;
          width: fit-content;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 22px;
          align-items: center;
          margin-top: 22px;
        }

        .hero-title {
          font-size: clamp(32px, 6.2vw, 56px);
          font-weight: 950;
          line-height: 1.06;
          margin: 14px 0 14px;
          letter-spacing: -0.04em;
        }

        .hero-subtitle {
          font-size: clamp(16px, 3.4vw, 18px);
          color: var(--text-muted);
          max-width: 620px;
          margin-bottom: 22px;
          font-weight: 650;
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: stretch;
          margin-top: 18px;
        }

        .hero-actions .btn { padding: 16px 18px; font-size: 15px; }

        .hero-note {
          margin-top: 14px;
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .hero-visual {
          border-radius: 18px;
          border: 1px solid rgba(2, 6, 23, 0.10);
          background: #ffffff;
          box-shadow: 0 30px 70px rgba(2, 6, 23, 0.08);
          padding: 14px;
        }

        .mock-topbar {
          height: 42px;
          border-radius: 14px;
          background: rgba(2, 6, 23, 0.06);
          display: flex;
          align-items: center;
          padding: 0 14px;
          gap: 8px;
        }
        .dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(15, 23, 42, 0.25); }

        .mock-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 16px; }
        .mock-card {
          border-radius: 16px;
          border: 1px solid rgba(2, 6, 23, 0.08);
          background: rgba(255, 255, 255, 0.76);
          padding: 14px;
          min-height: 110px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .mock-chip {
          width: fit-content;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(0, 97, 255, 0.10);
          color: var(--primary);
          font-weight: 950;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .mock-bar {
          height: 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.07);
          overflow: hidden;
          position: relative;
        }
        .mock-bar > span {
          position: absolute;
          inset: 0;
          width: 62%;
          background: linear-gradient(90deg, var(--primary), var(--primary-2));
          border-radius: 999px;
        }

        .section { padding: 74px 20px; }
        .section-inner { max-width: 1200px; margin: 0 auto; }
        .section-header { max-width: 760px; margin: 0 auto 34px; text-align: center; }
        .section-title {
          font-size: clamp(28px, 4.8vw, 44px);
          font-weight: 950;
          letter-spacing: -0.03em;
          line-height: 1.05;
          margin-bottom: 14px;
        }
        .section-subtitle { color: var(--text-muted); font-size: 16px; font-weight: 650; line-height: 1.6; }

        .brand-row {
          margin-top: 34px;
          padding: 16px 0 18px;
          border-top: 1px solid rgba(2, 6, 23, 0.06);
          border-bottom: 1px solid rgba(2, 6, 23, 0.06);
          display: flex;
          align-items: center;
          gap: 18px;
          overflow: hidden;
        }

        .brand-row strong {
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(15, 23, 42, 0.45);
          font-weight: 950;
          flex: none;
        }

        .brand-list {
          display: flex;
          gap: 28px;
          align-items: center;
          flex-wrap: wrap;
        }

        .brand {
          font-weight: 950;
          letter-spacing: -0.02em;
          color: rgba(15, 23, 42, 0.35);
          text-transform: lowercase;
        }

        .step-wrap {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 56px;
        }

        .step {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          align-items: center;
        }

        .step-k {
          font-weight: 950;
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(15, 23, 42, 0.45);
        }

        .step-title {
          font-weight: 950;
          font-size: clamp(22px, 3.4vw, 34px);
          letter-spacing: -0.03em;
          margin-top: 10px;
        }

        .step-desc {
          color: var(--text-muted);
          font-weight: 650;
          line-height: 1.7;
          margin-top: 10px;
          max-width: 520px;
        }

        .step-media {
          border-radius: 18px;
          border: 1px solid rgba(2, 6, 23, 0.10);
          background:
            radial-gradient(420px 260px at 25% 30%, rgba(0, 97, 255, 0.22), transparent 60%),
            radial-gradient(420px 260px at 75% 20%, rgba(139, 92, 246, 0.22), transparent 60%),
            linear-gradient(135deg, rgba(2,6,23,0.06) 0%, rgba(2,6,23,0.00) 55%),
            #ffffff;
          box-shadow: 0 24px 70px rgba(2, 6, 23, 0.08);
          min-height: 220px;
        }

        .feature-split { display: grid; grid-template-columns: 1fr; gap: 18px; margin-top: 26px; }
        .feature-panel {
          border-radius: 22px;
          border: 1px solid var(--border);
          background: var(--card);
          box-shadow: 0 18px 50px rgba(2, 6, 23, 0.06);
          padding: 22px;
        }
        .feature-panel h3 { font-size: 20px; font-weight: 950; margin-bottom: 10px; letter-spacing: -0.02em; }
        .feature-panel p { color: var(--text-muted); font-size: 15px; font-weight: 650; line-height: 1.7; }
        .feature-kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
        .kpi { border-radius: 18px; border: 1px solid var(--border); background: rgba(2, 6, 23, 0.02); padding: 14px; display: flex; flex-direction: column; gap: 6px; }
        .kpi strong { font-weight: 950; font-size: 18px; }
        .kpi span { color: var(--text-muted); font-weight: 700; font-size: 12px; letter-spacing: -0.01em; }

        .dark {
          background:
            radial-gradient(900px 400px at 20% 10%, rgba(0, 97, 255, 0.35), transparent 60%),
            radial-gradient(900px 420px at 80% 10%, rgba(139, 92, 246, 0.35), transparent 60%),
            linear-gradient(180deg, #050A16 0%, #070B1D 100%);
          color: #fff;
        }
        .dark-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.08);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.12);
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 950;
          width: fit-content;
        }
        .dark-card {
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 40px 120px rgba(0,0,0,0.35);
          padding: 22px;
          backdrop-filter: blur(10px);
          margin-top: 26px;
        }
        .dark-list { margin-top: 0; display: grid; grid-template-columns: 1fr; gap: 12px; }
        .dark-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.10); background: rgba(0,0,0,0.22); }
        .dark-dot {
          width: 40px; height: 40px; border-radius: 14px;
          background: rgba(0, 97, 255, 0.18);
          display: flex; align-items: center; justify-content: center;
          color: #fff; border: 1px solid rgba(0, 97, 255, 0.25);
          flex: none;
        }

        .testimonials-grid { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 26px; }
        .testimonial {
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--card);
          box-shadow: 0 18px 55px rgba(2, 6, 23, 0.08);
          padding: 18px;
        }
        .testimonial p { color: rgba(15,23,42,0.85); font-weight: 700; line-height: 1.7; }
        .t-meta { margin-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--text-muted); font-weight: 800; font-size: 13px; }
        .stars { display: inline-flex; gap: 4px; color: #F59E0B; }

        .faq-wrap { margin-top: 26px; display: grid; grid-template-columns: 1fr; gap: 12px; }
        .faq { border-radius: 18px; border: 1px solid var(--border); background: var(--card); box-shadow: 0 14px 45px rgba(2, 6, 23, 0.06); overflow: hidden; }
        .faq-btn {
          width: 100%;
          background: transparent;
          border: none;
          text-align: left;
          padding: 16px 16px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: var(--text-main);
        }
        .faq-body { padding: 0 16px 16px; color: var(--text-muted); font-weight: 650; line-height: 1.7; font-size: 14px; }

        .cta {
          padding: 86px 20px;
          background:
            radial-gradient(900px 450px at 25% 10%, rgba(0, 97, 255, 0.18), transparent 55%),
            radial-gradient(900px 450px at 80% 0%, rgba(139, 92, 246, 0.18), transparent 55%),
            linear-gradient(180deg, rgba(2,6,23,0.03) 0%, rgba(2,6,23,0.02) 100%);
          border-top: 1px solid var(--border);
        }
        .cta-card {
          max-width: 1200px;
          margin: 0 auto;
          border-radius: 26px;
          border: 1px solid rgba(0, 97, 255, 0.18);
          background:
            linear-gradient(135deg, rgba(0, 97, 255, 0.18), rgba(139, 92, 246, 0.18)),
            #ffffff;
          box-shadow: 0 35px 95px rgba(0, 97, 255, 0.14);
          padding: 26px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          align-items: center;
        }
        .cta-card h2 { font-size: clamp(24px, 4vw, 38px); font-weight: 950; letter-spacing: -0.03em; line-height: 1.1; }
        .cta-card p { color: var(--text-muted); font-weight: 650; line-height: 1.7; margin-top: 10px; }
        .cta-actions { display: flex; flex-direction: column; gap: 12px; }

        .footer {
          background: #070B14;
          padding: 86px 20px 40px;
          border-top: 1px solid rgba(255,255,255,0.08);
          color: #fff;
        }
        .footer-grid { display: grid; grid-template-columns: 1fr; gap: 32px; max-width: 1200px; margin: 0 auto; }
        .footer-col-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          padding: 16px 0;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        .footer-col-title { font-size: 16px; font-weight: 950; }
        .footer-links { display: none; flex-direction: column; gap: 12px; padding: 16px 0; }
        .footer-links.open { display: flex; }
        .footer-link { color: rgba(255,255,255,0.82); text-decoration: none; font-size: 14px; font-weight: 650; transition: color 0.2s; }
        .footer-link:hover { color: #ffffff; }
        .footer-note { font-size: 14px; color: rgba(255,255,255,0.82); font-weight: 650; line-height: 1.65; }
        .footer-bottom {
          max-width: 1200px;
          margin: 44px auto 0;
          padding-top: 30px;
          border-top: 1px solid rgba(255,255,255,0.12);
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 18px;
        }

        @media (min-width: 768px) {
          .hero-actions { flex-direction: row; align-items: center; justify-content: flex-start; }
          .step { grid-template-columns: 1.1fr 0.9fr; gap: 28px; }
          .step.reverse { grid-template-columns: 0.9fr 1.1fr; }
          .footer-grid { grid-template-columns: repeat(4, 1fr); }
          .footer-col-header { cursor: default; border-bottom: none; padding: 0; margin-bottom: 24px; }
          .footer-col-header svg { display: none; }
          .footer-links { display: flex !important; }
        }

        @media (min-width: 1024px) {
          .header-content { padding: 0 40px; }
          .nav-desktop { display: flex; }
          .nav-link { text-decoration: none; color: var(--text-main); font-size: 15px; font-weight: 850; transition: color 0.2s; }
          .nav-link:hover { color: var(--primary); }
          .header-actions { display: flex; align-items: center; gap: 12px; }
          .menu-toggle { display: none; }
          .hero { padding: 150px 40px 26px; }
          .hero-grid { grid-template-columns: 1.1fr 0.9fr; gap: 34px; }
          .dark-list { grid-template-columns: 1fr 1fr; }
          .testimonials-grid { grid-template-columns: repeat(3, 1fr); }
          .cta-card { grid-template-columns: 1.2fr 0.8fr; padding: 34px; }
          .cta-actions { align-items: stretch; }
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade { animation: fadeIn 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `,
        }}
      />

      <header className="header">
        <div className="header-content">
          <Logo style={{ height: '32px', width: 'auto' }} />

          <nav className="nav-desktop">
            <a href="#works" className="nav-link">
              Modelos
            </a>
            <a href="#features" className="nav-link">
              Recursos
            </a>
            <a href="#ai" className="nav-link">
              IA
            </a>
            <a href="#faq" className="nav-link">
              FAQ
            </a>
          </nav>

          <div className="header-actions">
            <button className="btn btn-ghost" style={{ padding: '10px 14px', fontSize: '14px' }} onClick={() => navigate('/login')}>
              Entrar
            </button>
            <button className="btn btn-primary" style={{ padding: '10px 14px', fontSize: '14px' }} onClick={() => navigate('/login')}>
              Criar conta <ArrowRight size={18} />
            </button>
          </div>

          <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <a href="#works" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
          Modelos
        </a>
        <a href="#features" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
          Recursos
        </a>
        <a href="#ai" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
          IA
        </a>
        <a href="#faq" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
          FAQ
        </a>

        <div className="mobile-actions">
          <button className="btn btn-ghost" style={{ padding: '14px 16px', fontSize: '15px' }} onClick={() => navigate('/login')}>
            Entrar
          </button>
          <button className="btn btn-primary" style={{ padding: '14px 16px', fontSize: '15px' }} onClick={() => navigate('/login')}>
            Criar conta <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-grid">
            <div className="animate-fade">
              <div className="pill">
                <Sparkles size={16} /> LogDock Sales Page
              </div>
              <h1 className="hero-title">Tráfego, clareza e conversão em um layout clean</h1>
              <p className="hero-subtitle">
                Essa é a nova página no estilo do modelo que você enviou: branca, leve, seções alternadas e um bloco escuro forte no meio.
              </p>

              <div className="hero-actions">
                <button className="btn btn-primary" onClick={() => navigate('/login')}>
                  Começar agora <ArrowRight size={18} />
                </button>
                <button className="btn btn-ghost" onClick={() => document.getElementById('steps')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  Ver seções
                </button>
              </div>

              <div className="hero-note">
                <Check size={16} color="#10B981" /> Sem cartão de crédito para começar
              </div>
            </div>

            <div className="hero-visual animate-fade" style={{ animationDelay: '0.12s' }}>
              <div className="mock-topbar">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
                <div style={{ marginLeft: '10px', fontWeight: 950, color: 'rgba(15,23,42,0.7)', fontSize: '12px' }}>
                  logdock.app • preview
                </div>
              </div>

              <div className="mock-grid">
                <div className="mock-card">
                  <span className="mock-chip">UPLOAD</span>
                  <div className="mock-bar">
                    <span />
                  </div>
                  <div style={{ fontWeight: 950, color: 'rgba(15,23,42,0.75)', fontSize: '13px' }}>Arquivos organizados automaticamente</div>
                </div>
                <div className="mock-card">
                  <span className="mock-chip" style={{ background: 'rgba(139, 92, 246, 0.12)', color: 'var(--primary-2)' }}>
                    IA
                  </span>
                  <div className="mock-bar">
                    <span style={{ width: '78%', background: 'linear-gradient(90deg, var(--primary-2), var(--primary))' }} />
                  </div>
                  <div style={{ fontWeight: 950, color: 'rgba(15,23,42,0.75)', fontSize: '13px' }}>Resumo e classificação em segundos</div>
                </div>
                <div className="mock-card" style={{ gridColumn: '1 / -1' }}>
                  <span className="mock-chip">SEGURANÇA</span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="mock-bar" style={{ flex: 1 }}>
                      <span style={{ width: '66%' }} />
                    </div>
                    <div style={{ fontWeight: 950, color: 'rgba(15,23,42,0.75)' }}>AES-256</div>
                  </div>
                  <div style={{ fontWeight: 950, color: 'rgba(15,23,42,0.75)', fontSize: '13px' }}>Controle por equipe e auditoria</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="brand-row">
        <div className="hero-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap' }}>
          <strong>Trusted by</strong>
          <div className="brand-list">
            {brands.map((b) => (
              <span key={b} className="brand">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section id="steps" className="section">
        <div className="step-wrap">
          {blocks.map((b) => (
            <div key={b.k} className={`step ${b.side === 'right' ? 'reverse' : ''}`}>
              <div>
                <div className="step-k">
                  {b.k} • {b.eyebrow}
                </div>
                <div className="step-title">{b.title}</div>
                <div className="step-desc">{b.desc}</div>
                <div style={{ marginTop: '16px' }}>
                  <button className="btn btn-ghost" style={{ padding: '12px 14px', fontSize: '14px' }} onClick={() => navigate('/login')}>
                    Ver no app <ArrowRight size={18} />
                  </button>
                </div>
              </div>
              <div className="step-media" aria-hidden="true" />
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="section">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">Launch Your Website Fast &amp; Smart</h2>
            <p className="section-subtitle">
              Estrutura pronta pra venda: seções bem “escaneáveis”, cards consistentes e um visual premium com o azul do LogDock.
            </p>
          </div>

          <div className="feature-split">
            <div className="feature-panel">
              <h3>Conversão primeiro</h3>
              <p>Headline forte, prova social, FAQ e CTA repetido no final. Tudo alinhado para reduzir fricção e levar o usuário para o login/conta.</p>
              <div className="feature-kpis">
                <div className="kpi">
                  <strong>+3x</strong>
                  <span>clareza nas seções</span>
                </div>
                <div className="kpi">
                  <strong>1 clique</strong>
                  <span>para começar</span>
                </div>
                <div className="kpi">
                  <strong>Mobile</strong>
                  <span>perfeito</span>
                </div>
                <div className="kpi">
                  <strong>Brand</strong>
                  <span>azul LogDock</span>
                </div>
              </div>
            </div>

            <div
              className="feature-panel"
              style={{
                background:
                  'radial-gradient(520px 260px at 20% 20%, rgba(0, 97, 255, 0.18), transparent 60%), radial-gradient(520px 260px at 80% 10%, rgba(139, 92, 246, 0.18), transparent 60%), #fff',
              }}
            >
              <h3>Componentes “prontos”</h3>
              <p>Cards, tiles, FAQ e CTA. Você troca os textos e mantém o layout consistente. Sem depender de libs externas.</p>
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontWeight: 900, color: 'rgba(15,23,42,0.8)' }}>
                  <Check size={18} color="#10B981" /> Seções com âncoras
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontWeight: 900, color: 'rgba(15,23,42,0.8)' }}>
                  <Check size={18} color="#10B981" /> Grid responsivo
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontWeight: 900, color: 'rgba(15,23,42,0.8)' }}>
                  <Check size={18} color="#10B981" /> Rodapé azul LogDock
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="ai" className="section dark">
        <div className="section-inner">
          <div className="dark-badge">
            <Sparkles size={16} /> Tailored for AI Devices (estilo do print)
          </div>
          <h2 className="section-title" style={{ color: '#fff', marginTop: '16px' }}>
            Uma seção escura para destaque premium
          </h2>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '760px', marginTop: '10px' }}>
            Ótima para falar de IA, segurança, integrações ou diferenciais do produto. Mantém o contraste e dá ritmo visual na página.
          </p>

          <div className="dark-card">
            <div className="dark-list">
              {[
                { title: 'Classificação automática', desc: 'Padrões consistentes e zero bagunça.', accent: 'blue' as const },
                { title: 'Resumos instantâneos', desc: 'Menos leitura, mais decisão.', accent: 'violet' as const },
                { title: 'Auditoria e controle', desc: 'Confiável para times e operações.', accent: 'blue' as const },
                { title: 'Performance no mobile', desc: 'A landing funciona impecável no celular.', accent: 'violet' as const },
              ].map((it) => (
                <div key={it.title} className="dark-item">
                  <div
                    className="dark-dot"
                    style={
                      it.accent === 'violet'
                        ? { background: 'rgba(139,92,246,0.18)', borderColor: 'rgba(139,92,246,0.28)' }
                        : undefined
                    }
                  >
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 950 }}>{it.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 650, fontSize: '14px', marginTop: '2px' }}>{it.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">Turns out, founders seek websites that just work</h2>
            <p className="section-subtitle">Cards de depoimento no estilo do print (compactos, legíveis, com prova social).</p>
          </div>

          <div className="testimonials-grid">
            {[
              { text: '“A landing ficou com cara de produto grande. Bem mais fácil explicar a proposta em 30s.”', name: 'Operações' },
              { text: '“O rodapé azul no tom da marca fechou o visual. Ficou bem LogDock.”', name: 'Marketing' },
              { text: '“O layout é leve e direto. Em mobile ficou perfeito sem esforço.”', name: 'Produto' },
            ].map((t) => (
              <div key={t.name} className="testimonial">
                <div className="stars" aria-hidden="true">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <p style={{ marginTop: '12px' }}>{t.text}</p>
                <div className="t-meta">
                  <span>{t.name}</span>
                  <span style={{ color: 'rgba(15,23,42,0.55)' }}>2026</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="section works" style={{ borderBottom: 'none' }}>
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">Frequently asked questions</h2>
            <p className="section-subtitle">FAQ com acordeão (mobile-first) pra reduzir objeções.</p>
          </div>

          <div className="faq-wrap">
            {faqs.map((f, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={f.q} className="faq">
                  <button className="faq-btn" onClick={() => setOpenFaq(isOpen ? null : idx)}>
                    <span>{f.q}</span>
                    <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }} />
                  </button>
                  {isOpen && <div className="faq-body">{f.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-card">
          <div>
            <h2>Book Your Free Strategy Call Today</h2>
            <p>CTA final no mesmo espírito do layout. Aqui estamos mandando para `/login` (criar conta).</p>
          </div>
          <div className="cta-actions">
            <button className="btn btn-primary" style={{ padding: '16px 18px', fontSize: '15px' }} onClick={() => navigate('/login')}>
              Começar agora <ArrowRight size={18} />
            </button>
            <button className="btn btn-ghost" style={{ padding: '16px 18px', fontSize: '15px' }} onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              Ver recursos
            </button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-grid">
          <div>
            <Logo style={{ height: '28px', marginBottom: '24px' }} />
            <p className="footer-note">
              Página de vendas no estilo do modelo (layout clean + bloco escuro + footer dark), mantendo o azul do LogDock nos CTAs.
            </p>
          </div>

          <div>
            <div className="footer-col-header" onClick={() => toggleFooter('produto')}>
              <span className="footer-col-title">Produto</span>
              <ChevronDown size={18} className={expandedFooter === 'produto' ? 'rotate-180' : ''} />
            </div>
            <div className={`footer-links ${expandedFooter === 'produto' ? 'open' : ''}`}>
              <a href="#features" className="footer-link">
                Recursos
              </a>
              <a href="#ai" className="footer-link">
                IA
              </a>
              <a href="#works" className="footer-link">
                Modelos
              </a>
              <a href="#faq" className="footer-link">
                FAQ
              </a>
            </div>
          </div>

          <div>
            <div className="footer-col-header" onClick={() => toggleFooter('empresa')}>
              <span className="footer-col-title">Empresa</span>
              <ChevronDown size={18} className={expandedFooter === 'empresa' ? 'rotate-180' : ''} />
            </div>
            <div className={`footer-links ${expandedFooter === 'empresa' ? 'open' : ''}`}>
              <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                Entrar
              </a>
              <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                Criar conta
              </a>
              <a href="#steps" className="footer-link">Seções</a>
              <a href="#features" className="footer-link">
                Recursos
              </a>
            </div>
          </div>

          <div>
            <div className="footer-col-header" onClick={() => toggleFooter('suporte')}>
              <span className="footer-col-title">Suporte</span>
              <ChevronDown size={18} className={expandedFooter === 'suporte' ? 'rotate-180' : ''} />
            </div>
            <div className={`footer-links ${expandedFooter === 'suporte' ? 'open' : ''}`}>
              <a href="#faq" className="footer-link">
                Centro de ajuda
              </a>
              <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                Falar com a equipe
              </a>
              <a href="#" className="footer-link">
                Termos
              </a>
              <a href="#" className="footer-link">
                Privacidade
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: 650 }}>© 2026 LogDock. Todos os direitos reservados.</p>
          <div style={{ display: 'flex', gap: '18px' }}>
            <a href="#" className="footer-link" style={{ fontSize: '13px' }}>
              Termos de Serviço
            </a>
            <a href="#" className="footer-link" style={{ fontSize: '13px' }}>
              Política de Privacidade
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
