import React, { useState } from 'react';
import { ShieldCheck, Info, CreditCard, ChevronDown } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'LogDock Standard';
  const [cycle, setCycle] = useState<'annual' | 'monthly'>('annual');

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Logo style={{ height: '32px' }} />
        <div style={styles.headerRight}>
          <span style={styles.headerLink}>Fale com Vendas</span>
          <ChevronDown size={16} />
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.checkoutCol}>
          <h1 style={styles.title}>Avaliação grátis - 30 dias</h1>
          <p style={styles.subtitle}>Ou <span style={styles.blueLink}>compre o {plan} agora</span></p>

          <div style={styles.alertBox}>
            <div style={styles.alertIcon}><Info size={18} /></div>
            <div style={styles.alertContent}>
              <strong>O seu LogDock está cheio</strong>, faça upgrade agora para manter os arquivos sincronizados com segurança.
            </div>
          </div>

          <div style={styles.benefitBox}>
            <div style={styles.benefitItem}><ShieldCheck size={18} color="#10B981" /> Sem cobrança até 30/05/2026</div>
            <div style={styles.benefitItem}><ShieldCheck size={18} color="#10B981" /> Total devido hoje: <strong>R$ 0,00</strong></div>
            <div style={styles.benefitItem}><ShieldCheck size={18} color="#10B981" /> Enviaremos um lembrete uma semana antes do fim da sua versão de avaliação. Cancele a qualquer momento.</div>
          </div>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Detalhes do pagamento</h3>
            <p style={styles.sectionSub}>Ciclo de faturamento (cobrança ao final da versão de avaliação)</p>
            
            <div style={styles.cycleGrid}>
                <div 
                    style={{...styles.cycleCard, ...(cycle === 'annual' ? styles.cycleActive : {})}}
                    onClick={() => setCycle('annual')}
                >
                    <div style={styles.cycleCheck}><div style={{...styles.cycleDot, opacity: cycle === 'annual' ? 1 : 0}} /></div>
                    <div>
                        <div style={styles.cycleLabel}>Faturado anualmente <span style={styles.greenTag}>2 meses grátis</span></div>
                        <div style={styles.cyclePrice}>R$ 790 <span style={styles.cycleUnit}>/ano</span></div>
                        <div style={styles.cycleSubPrice}>R$ 65,80 por mês</div>
                    </div>
                </div>
                <div 
                    style={{...styles.cycleCard, ...(cycle === 'monthly' ? styles.cycleActive : {})}}
                    onClick={() => setCycle('monthly')}
                >
                    <div style={styles.cycleCheck}><div style={{...styles.cycleDot, opacity: cycle === 'monthly' ? 1 : 0}} /></div>
                    <div>
                        <div style={styles.cycleLabel}>Faturado mensalmente</div>
                        <div style={styles.cyclePrice}>R$ 97 <span style={styles.cycleUnit}>/mês</span></div>
                    </div>
                </div>
            </div>

            <div style={styles.formGroup}>
                <label style={styles.label}>Número do cartão</label>
                <div style={styles.inputBox}>
                    <CreditCard size={18} color="#94A3B8" />
                    <input type="text" placeholder="0000 0000 0000 0000" style={styles.input} />
                </div>
                <div style={styles.inputRow}>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Data de validade</label>
                        <input type="text" placeholder="MM/AA" style={styles.input} />
                    </div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Código de segurança</label>
                        <input type="text" placeholder="CVC" style={styles.input} />
                    </div>
                </div>
            </div>

            <button style={styles.payBtn} onClick={() => navigate('/app/dashboard')}>Ativar versão de avaliação</button>
            <p style={styles.terms}>Ao clicar, você concorda com os Termos de Serviço do LogDock.</p>
          </section>
        </div>

        <div style={styles.summaryCol}>
          <div style={styles.summaryCard}>
            <h4 style={styles.summaryTitle}>Resumo</h4>
            <div style={styles.summaryPlan}>{plan}</div>
            <p style={styles.summaryText}>Usando 6.7 GB de <strong>1 TB (1.000 GB)</strong> compartilhado pela equipe</p>
            
            <ul style={styles.summaryList}>
                <li>1 TB de armazenamento para a equipe</li>
                <li>Conecte todos os dispositivos que precisar</li>
                <li>Envio de arquivos grandes de até 100 GB</li>
                <li>180 dias para restaurar arquivos excluídos</li>
            </ul>

            <div style={styles.summaryDivider} />
            
            <div style={styles.summaryRow}><span>Período de faturamento</span><span>{cycle === 'annual' ? 'Anualmente' : 'Mensalmente'}</span></div>
            <div style={styles.summaryRow}><span>Subtotal</span><span>R$ 0,00</span></div>
            
            <div style={styles.totalRow}>
                <span>Faturado agora</span>
                <span>R$ 0,00</span>
            </div>
            <p style={styles.trialEndText}>A versão de avaliação termina em 30 de maio de 2026</p>
          </div>
        </div>
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#FFF', fontFamily: "'Inter', sans-serif" },
  header: { height: '64px', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#1E1E1E', cursor: 'pointer' },
  headerLink: { border: '1px solid #EAEAEA', padding: '6px 12px', borderRadius: '8px' },
  main: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', minHeight: 'calc(100vh - 64px)' },
  checkoutCol: { padding: '64px 10% 64px 15%' },
  summaryCol: { backgroundColor: '#F9F9F7', padding: '64px 15% 64px 10%', borderLeft: '1px solid #F1F5F9' },
  title: { fontSize: '32px', fontWeight: '900', color: '#1E1E1E', marginBottom: '8px' },
  subtitle: { fontSize: '15px', color: '#1E1E1E', marginBottom: '32px' },
  blueLink: { color: '#0061FF', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' },
  alertBox: { backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', marginBottom: '32px' },
  alertIcon: { color: '#EF4444' },
  alertContent: { fontSize: '13px', color: '#991B1B', lineHeight: '1.5' },
  benefitBox: { backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '48px' },
  benefitItem: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#166534' },
  section: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sectionTitle: { fontSize: '18px', fontWeight: '800', color: '#1E1E1E' },
  sectionSub: { fontSize: '13px', color: '#666', marginBottom: '24px' },
  cycleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' },
  cycleCard: { padding: '20px', borderRadius: '16px', border: '2px solid #EAEAEA', cursor: 'pointer', display: 'flex', gap: '16px', transition: 'all 0.2s' },
  cycleActive: { border: '2px solid #0061FF', backgroundColor: '#F0F7FF' },
  cycleCheck: { width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #CBD5E1', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cycleDot: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0061FF' },
  cycleLabel: { fontSize: '13px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' },
  greenTag: { backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '100px', fontSize: '10px' },
  cyclePrice: { fontSize: '18px', fontWeight: '900' },
  cycleUnit: { fontSize: '13px', color: '#666', fontWeight: '600' },
  cycleSubPrice: { fontSize: '12px', color: '#666', marginTop: '4px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#1E1E1E' },
  inputBox: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: '1px solid #EAEAEA', borderRadius: '10px' },
  input: { border: '1px solid #EAEAEA', padding: '12px', borderRadius: '10px', width: '100%', outline: 'none', fontSize: '14px', fontWeight: '600' },
  inputRow: { display: 'flex', gap: '16px', marginTop: '8px' },
  payBtn: { backgroundColor: '#0061FF', color: '#FFF', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '800', cursor: 'pointer', marginBottom: '16px' },
  terms: { fontSize: '11px', color: '#94A3B8', textAlign: 'center' },
  summaryCard: { backgroundColor: '#FFF', padding: '32px', borderRadius: '24px', border: '1px solid #EAEAEA' },
  summaryTitle: { fontSize: '14px', fontWeight: '800', color: '#666', textTransform: 'uppercase', marginBottom: '16px' },
  summaryPlan: { fontSize: '24px', fontWeight: '900', color: '#1E1E1E', marginBottom: '12px' },
  summaryText: { fontSize: '13px', color: '#666', marginBottom: '24px' },
  summaryList: { listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' },
  summaryDivider: { height: '1px', backgroundColor: '#F1F5F9', margin: '24px 0' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '12px' },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', color: '#166534', marginTop: '24px' },
  trialEndText: { fontSize: '11px', color: '#94A3B8', marginTop: '16px' }
};

export default Checkout;
