import React from 'react';
import { 
  CreditCard, Calendar, Download, 
  ChevronRight, ArrowUpRight, Plus,
  ShieldCheck, Wallet, History
} from 'lucide-react';
import { useAuth } from '@shared/context/AuthContext';

const BillingPage: React.FC = () => {
  const { profile } = useAuth();

  const invoices = [
    { id: 'INV-001', date: '01/04/2026', amount: 'R$ 149,00', status: 'Pago' },
    { id: 'INV-002', date: '01/03/2026', amount: 'R$ 149,00', status: 'Pago' },
    { id: 'INV-003', date: '01/02/2026', amount: 'R$ 149,00', status: 'Pago' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTitleBox}>
            <h1 style={styles.title}>Faturamento e Pagamentos</h1>
            <p style={styles.subtitle}>Gerencie suas faturas, métodos de pagamento e plano atual.</p>
        </div>
        <button style={styles.addMethodBtn}><Plus size={18} /> Adicionar Método</button>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
            <div style={{...styles.iconBox, backgroundColor: '#EFF6FF'}}><Wallet size={20} color="#0061FF" /></div>
            <div style={styles.statInfo}>
                <label style={styles.statLabel}>Próxima Fatura</label>
                <span style={styles.statValue}>R$ 149,00</span>
                <span style={styles.statMeta}>Vencimento em 01/05</span>
            </div>
        </div>
        <div style={styles.statCard}>
            <div style={{...styles.iconBox, backgroundColor: '#ECFDF5'}}><ShieldCheck size={20} color="#10B981" /></div>
            <div style={styles.statInfo}>
                <label style={styles.statLabel}>Status da Conta</label>
                <span style={styles.statValue}>Regular</span>
                <span style={styles.statMeta}>Renovação Automática</span>
            </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}><CreditCard size={18} /> Método de Pagamento</h2>
        </div>
        <div style={styles.card}>
            <div style={styles.paymentMethod}>
                <div style={styles.cardIcon}>VISA</div>
                <div style={{ flex: 1 }}>
                    <div style={styles.cardName}>Visa terminando em 4452</div>
                    <div style={styles.cardMeta}>Expira em 12/2028 • Principal</div>
                </div>
                <button style={styles.editBtn}>Editar</button>
            </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}><History size={18} /> Histórico de Faturas</h2>
            <button style={styles.linkBtn}>Ver tudo</button>
        </div>
        <div style={styles.card}>
            {invoices.map((inv, i) => (
                <div key={inv.id} style={{...styles.invoiceRow, borderBottom: i === invoices.length - 1 ? 'none' : '1px solid #F1F5F9'}}>
                    <div style={styles.invInfo}>
                        <span style={styles.invId}>{inv.id}</span>
                        <span style={styles.invDate}>{inv.date}</span>
                    </div>
                    <span style={styles.invAmount}>{inv.amount}</span>
                    <div style={styles.invStatus}>
                        <span style={styles.statusDot} /> {inv.status}
                    </div>
                    <button style={styles.downloadBtn}><Download size={16} /></button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitleBox: { display: 'flex', flexDirection: 'column', gap: '8px' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  subtitle: { fontSize: '15px', color: '#64748B', fontWeight: '500' },
  addMethodBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', backgroundColor: '#0061FF', color: '#FFF', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,97,255,0.2)' },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  statCard: { padding: '24px', backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F5F9', display: 'flex', gap: '20px', alignItems: 'center' },
  iconBox: { width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  statLabel: { fontSize: '12px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  statValue: { fontSize: '20px', fontWeight: '900', color: '#1E1E1E' },
  statMeta: { fontSize: '12px', fontWeight: '600', color: '#10B981' },
  section: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: '16px', fontWeight: '800', color: '#1E1E1E', display: 'flex', alignItems: 'center', gap: '12px' },
  card: { backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F5F9', overflow: 'hidden' },
  paymentMethod: { padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' },
  cardIcon: { width: '60px', height: '40px', backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px' },
  cardName: { fontSize: '15px', fontWeight: '800', color: '#1E1E1E' },
  cardMeta: { fontSize: '13px', color: '#64748B', fontWeight: '500' },
  editBtn: { background: 'none', border: 'none', color: '#0061FF', fontSize: '13px', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' },
  invoiceRow: { padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '32px' },
  invInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  invId: { fontSize: '14px', fontWeight: '800', color: '#1E1E1E' },
  invDate: { fontSize: '12px', fontWeight: '600', color: '#94A3B8' },
  invAmount: { fontSize: '14px', fontWeight: '800', color: '#1E1E1E' },
  invStatus: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#10B981', minWidth: '100px' },
  statusDot: { width: '8px', height: '8px', backgroundColor: '#10B981', borderRadius: '50%' },
  downloadBtn: { width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #F1F5F9', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' },
  linkBtn: { background: 'none', border: 'none', color: '#0061FF', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }
};

export default BillingPage;
