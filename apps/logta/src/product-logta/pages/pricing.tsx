import React from 'react';
import { 
  Check, 
  Zap, 
  Rocket, 
  Building2, 
  ShieldCheck, 
  Globe, 
  BarChart3,
  Users,
  Smartphone
} from 'lucide-react';
import LogtaPageView from '../../components/LogtaPageView';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: 'R$ 299',
      period: '/mês',
      description: 'Ideal para pequenas transportadoras em crescimento.',
      features: [
        'Até 5 motoristas',
        'Relatórios básicos',
        'Gestão de frotas',
        'Suporte via e-mail',
        'App Motorista (Básico)'
      ],
      icon: <Rocket size={24} color="#64748b" />,
      color: '#64748b',
      btnText: 'Começar Agora',
      popular: false
    },
    {
      name: 'Pro',
      price: 'R$ 890',
      period: '/mês',
      description: 'A solução completa para operações de médio porte.',
      features: [
        'Até 30 motoristas',
        'Smart Insights (IA)',
        'Integração WhatsApp (Z-API)',
        'Rastreamento em tempo real',
        'Suporte prioritário 24/7',
        'Assinatura Digital ilimitada'
      ],
      icon: <Zap size={24} color="#7c3aed" />,
      color: '#7c3aed',
      btnText: 'Escolher Pro',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Sob consulta',
      period: '',
      description: 'Para grandes frotas com necessidades específicas.',
      features: [
        'Motoristas ilimitados',
        'API de integração aberta',
        'Onboarding personalizado',
        'Gerente de conta dedicado',
        'Backup redundante',
        'Infraestrutura dedicada'
      ],
      icon: <Building2 size={24} color="#0f172a" />,
      color: '#0f172a',
      btnText: 'Falar com Especialista',
      popular: false
    }
  ];

  return (
    <LogtaPageView style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Planos e Preços</h1>
        <p style={styles.subtitle}>Escolha o plano ideal para a escala da sua transportadora.</p>
      </header>

      <div style={styles.grid}>
        {plans.map((plan, idx) => (
          <div 
            key={idx} 
            style={{ 
              ...styles.card, 
              ...(plan.popular ? styles.popularCard : {}),
              borderColor: plan.popular ? '#7c3aed' : '#e2e8f0'
            }}
          >
            {plan.popular && <div style={styles.popularBadge}>MAIS VENDIDO</div>}
            
            <div style={styles.cardHeader}>
              <div style={{ ...styles.iconBox, backgroundColor: plan.popular ? '#f5f3ff' : '#f8fafc' }}>
                {plan.icon}
              </div>
              <h2 style={styles.planName}>{plan.name}</h2>
              <p style={styles.planDesc}>{plan.description}</p>
            </div>

            <div style={styles.priceRow}>
              <span style={styles.price}>{plan.price}</span>
              <span style={styles.period}>{plan.period}</span>
            </div>

            <div style={styles.featureList}>
              {plan.features.map((feature, fIdx) => (
                <div key={fIdx} style={styles.featureItem}>
                  <div style={styles.checkIcon}>
                    <Check size={14} color="#10b981" />
                  </div>
                  <span style={styles.featureText}>{feature}</span>
                </div>
              ))}
            </div>

            <button 
              style={{ 
                ...styles.ctaBtn, 
                backgroundColor: plan.popular ? '#7c3aed' : '#ffffff',
                color: plan.popular ? '#ffffff' : '#0f172a',
                border: plan.popular ? 'none' : '2px solid #e2e8f0'
              }}
            >
              {plan.btnText}
            </button>
          </div>
        ))}
      </div>

      <section style={styles.faqSection}>
        <h2 style={styles.faqTitle}>Dúvidas frequentes</h2>
        <div style={styles.faqGrid}>
           <div style={styles.faqItem}>
              <h3>Posso mudar de plano a qualquer momento?</h3>
              <p>Sim, você pode fazer upgrade ou downgrade diretamente pelo painel administrativo.</p>
           </div>
           <div style={styles.faqItem}>
              <h3>Como funciona a integração com WhatsApp?</h3>
              <p>O Logta utiliza a Z-API para enviar notificações em tempo real. O custo da instância já está incluso nos planos Pro e Enterprise.</p>
           </div>
        </div>
      </section>
    </LogtaPageView>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '48px 24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  header: {
    textAlign: 'center',
    marginBottom: '64px',
    maxWidth: '600px'
  },
  title: {
    fontSize: '48px',
    fontWeight: '950',
    color: '#0f172a',
    letterSpacing: '-0.04em',
    marginBottom: '16px'
  },
  subtitle: {
    fontSize: '18px',
    color: '#64748b',
    fontWeight: '500',
    lineHeight: '1.6'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '32px',
    width: '100%',
    maxWidth: '1200px',
    marginBottom: '80px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '32px',
    padding: '40px',
    border: '2px solid transparent',
    boxShadow: '0 20px 40px rgba(15,23,42,0.04)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    transition: 'transform 0.3s ease'
  },
  popularCard: {
    transform: 'scale(1.05)',
    boxShadow: '0 30px 60px rgba(124, 58, 237, 0.15)'
  },
  popularBadge: {
    position: 'absolute',
    top: '-16px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    padding: '8px 20px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '900',
    letterSpacing: '1px'
  },
  cardHeader: {
    marginBottom: '32px'
  },
  iconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px'
  },
  planName: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: '12px'
  },
  planDesc: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.5',
    fontWeight: '500'
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    marginBottom: '32px'
  },
  price: {
    fontSize: '40px',
    fontWeight: '950',
    color: '#0f172a',
    letterSpacing: '-0.03em'
  },
  period: {
    fontSize: '16px',
    color: '#64748b',
    fontWeight: '600'
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '40px',
    flex: 1
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  checkIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#ecfdf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  featureText: {
    fontSize: '15px',
    color: '#334155',
    fontWeight: '600'
  },
  ctaBtn: {
    width: '100%',
    height: '64px',
    borderRadius: '20px',
    fontSize: '16px',
    fontWeight: '900',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  faqSection: {
    width: '100%',
    maxWidth: '800px',
    textAlign: 'center'
  },
  faqTitle: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: '40px'
  },
  faqGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    textAlign: 'left'
  },
  faqItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }
};

export default Pricing;
