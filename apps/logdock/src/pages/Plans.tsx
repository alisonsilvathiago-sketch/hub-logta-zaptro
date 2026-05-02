import React from 'react';
import { Check, ArrowRight, Zap, Shield, HardDrive, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const Plans: React.FC = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'LogDock Free',
      price: '0',
      storage: '2 GB',
      features: ['Acesso individual', 'Segurança básica', 'Visualização de PDF'],
      button: 'Plano Atual',
      active: false,
      color: '#94A3B8'
    },
    {
      name: 'LogDock Standard',
      price: '97',
      storage: '1 TB',
      features: ['Até 5 membros', 'Análise de IA Master', 'Suporte Prioritário', 'Backups Diários'],
      button: 'Começar Teste Grátis',
      active: true,
      color: '#0061FF'
    },
    {
      name: 'LogDock Enterprise',
      price: '197',
      storage: 'Ilimitado',
      features: ['Membros ilimitados', 'API Customizada', 'Auditoria Master', 'Guardião Dedicado'],
      button: 'Falar com Vendas',
      active: false,
      color: '#000'
    }
  ];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Logo style={{ height: '40px' }} />
        <button style={styles.backBtn} onClick={() => navigate('/app/dashboard')}>Voltar ao Dashboard</button>
      </header>

      <main style={styles.main}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Escolha o plano ideal para sua rampa</h1>
          <p style={styles.subtitle}>Proteja seus documentos e escale sua operação logística com segurança Master.</p>
        </div>

        <div style={styles.grid}>
          {plans.map((plan, index) => (
            <div key={index} style={{...styles.card, ...(plan.active ? styles.cardActive : {})}}>
              {plan.active && <div style={styles.popularBadge}>MAIS POPULAR</div>}
              <h3 style={styles.planName}>{plan.name}</h3>
              <div style={styles.priceBox}>
                <span style={styles.currency}>R$</span>
                <span style={styles.price}>{plan.price}</span>
                <span style={styles.period}>/mês</span>
              </div>
              <div style={styles.storageBox}>
                <HardDrive size={18} color={plan.color} />
                <span style={{fontWeight: '800', color: plan.color}}>{plan.storage}</span>
              </div>
              
              <ul style={styles.featureList}>
                {plan.features.map((f, i) => (
                  <li key={i} style={styles.featureItem}>
                    <Check size={16} color="#10B981" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button 
                style={{...styles.planBtn, backgroundColor: plan.active ? '#0061FF' : '#FFF', color: plan.active ? '#FFF' : '#1E1E1E'}}
                onClick={() => plan.price !== '0' && navigate(`/checkout?plan=${plan.name}`)}
              >
                {plan.button}
                {!plan.active && plan.price !== '0' && <ArrowRight size={16} />}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#F9F9F7', fontFamily: "'Inter', sans-serif" },
  header: { height: '80px', padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderBottom: '1px solid #EAEAEA' },
  backBtn: { background: 'none', border: 'none', fontSize: '14px', fontWeight: '700', color: '#666', cursor: 'pointer' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '80px 20px' },
  hero: { textAlign: 'center', marginBottom: '64px' },
  title: { fontSize: '48px', fontWeight: '900', color: '#1E1E1E', marginBottom: '16px', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' },
  card: { backgroundColor: '#FFF', padding: '40px', borderRadius: '32px', border: '1px solid #EAEAEA', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'transform 0.3s' },
  cardActive: { border: '2px solid #0061FF', boxShadow: '0 20px 40px rgba(0,97,255,0.1)', transform: 'scale(1.05)', zIndex: 1 },
  popularBadge: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0061FF', color: '#FFF', padding: '6px 16px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', letterSpacing: '0.1em' },
  planName: { fontSize: '14px', fontWeight: '800', color: '#666', textTransform: 'uppercase', marginBottom: '24px' },
  priceBox: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' },
  currency: { fontSize: '20px', fontWeight: '800', color: '#1E1E1E' },
  price: { fontSize: '56px', fontWeight: '900', color: '#1E1E1E' },
  period: { fontSize: '16px', color: '#666', fontWeight: '600' },
  storageBox: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F1F5F9', padding: '12px 16px', borderRadius: '12px', width: 'fit-content', marginBottom: '32px' },
  featureList: { listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '16px' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '600', color: '#1E1E1E' },
  planBtn: { width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #EAEAEA', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.2s' }
};

export default Plans;
