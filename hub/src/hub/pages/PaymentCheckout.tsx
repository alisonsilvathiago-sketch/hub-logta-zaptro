import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Check, ArrowLeft, Shield, Zap, 
  CreditCard, Globe, Lock, ArrowRight,
  ShieldCheck, Building2, Download, AlertCircle
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError } from '@core/lib/toast';
import { createAsaasPayment, getPixQrCode } from '@core/services/asaasService';

const PaymentCheckout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX' | 'BOLETO'>('PIX');
  const [pixData, setPixData] = useState<any>(null);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, company:companies(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (err: any) {
      toastError('Fatura não encontrada');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayment = async () => {
    if (!order) return;
    setProcessing(true);
    try {
      // 1. Integrar com Asaas (Exemplo de fluxo que o usuário disse que já existia)
      // Aqui chamaríamos a Edge Function ou o Service direto
      const payment = await createAsaasPayment({
        customer: order.asaas_customer_id || 'cus_placeholder',
        billingType: paymentMethod,
        value: order.amount,
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        description: `Mensalidade Logta Hub - ${order.company?.name}`,
        externalReference: order.id
      });

      if (paymentMethod === 'PIX') {
        const qr = await getPixQrCode(payment.id);
        setPixData(qr);
      } else if (paymentMethod === 'BOLETO') {
        window.open(payment.bankSlipUrl, '_blank');
      }

      toastSuccess('Pagamento gerado com sucesso via Asaas!');
    } catch (err: any) {
      toastError('Erro Asaas: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={styles.loader}><Zap className="animate-spin" /></div>;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <ArrowLeft size={20} /> Voltar
        </button>
        <div style={styles.brand}>
          <div style={styles.logoIcon}><ShieldCheck size={20} color="white" /></div>
          <span style={styles.brandName}>Logta Hub Checkout</span>
        </div>
      </header>

      <div style={styles.container}>
        <div style={styles.left}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Resumo da Fatura</h2>
            <div style={styles.orderInfo}>
              <div style={styles.row}>
                <span>Empresa</span>
                <strong>{order?.company?.name}</strong>
              </div>
              <div style={styles.row}>
                <span>Plano</span>
                <strong>{order?.company?.plan || 'MASTER'}</strong>
              </div>
              <div style={styles.divider} />
              <div style={styles.totalRow}>
                <span>Total a Pagar</span>
                <span style={styles.totalValue}>R$ {order?.amount?.toFixed(2)}</span>
              </div>
            </div>
            <div style={styles.security}>
               <Lock size={14} /> Pagamento processado com segurança via Asaas API
            </div>
          </div>
        </div>

        <div style={styles.right}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Forma de Pagamento</h2>
            <div style={styles.methods}>
              <button 
                style={{...styles.methodBtn, ...(paymentMethod === 'PIX' ? styles.methodActive : {})}}
                onClick={() => setPaymentMethod('PIX')}
              >
                <Zap size={20} /> PIX
              </button>
              <button 
                style={{...styles.methodBtn, ...(paymentMethod === 'BOLETO' ? styles.methodActive : {})}}
                onClick={() => setPaymentMethod('BOLETO')}
              >
                <Download size={20} /> Boleto
              </button>
              <button 
                style={{...styles.methodBtn, ...(paymentMethod === 'CREDIT_CARD' ? styles.methodActive : {})}}
                onClick={() => setPaymentMethod('CREDIT_CARD')}
              >
                <CreditCard size={20} /> Cartão
              </button>
            </div>

            {pixData ? (
              <div style={styles.pixResult}>
                <img src={`data:image/png;base64,${pixData.encodedImage}`} alt="QR Code" style={styles.qr} />
                <p style={styles.pixText}>Escaneie o código acima ou copie o payload:</p>
                <code style={styles.code}>{pixData.payload}</code>
              </div>
            ) : (
              <button 
                style={styles.payBtn} 
                onClick={handleGeneratePayment}
                disabled={processing}
              >
                {processing ? 'Conectando ao Asaas...' : 'Gerar Pagamento Agora'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  page: { minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '40px' },
  header: { maxWidth: '1000px', margin: '0 auto 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: '600', cursor: 'pointer' },
  brand: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoIcon: { width: '32px', height: '32px', backgroundColor: '#6366F1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontWeight: '800', color: '#0F172A', fontSize: '18px' },
  
  container: { maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' },
  card: { backgroundColor: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  cardTitle: { fontSize: '18px', fontWeight: '800', marginBottom: '24px', color: '#0F172A' },
  
  orderInfo: { display: 'flex', flexDirection: 'column', gap: '16px' },
  row: { display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '14px' },
  divider: { height: '1px', backgroundColor: '#E2E8F0', margin: '8px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  totalValue: { fontSize: '24px', fontWeight: '800', color: '#6366F1' },
  
  methods: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '32px' },
  methodBtn: { padding: '16px', borderRadius: '16px', border: '1.5px solid #E2E8F0', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', color: '#64748B', transition: 'all 0.2s' },
  methodActive: { borderColor: '#6366F1', backgroundColor: '#EEF2FF', color: '#6366F1' },
  
  payBtn: { width: '100%', padding: '18px', backgroundColor: '#6366F1', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '700', fontSize: '16px', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' },
  security: { marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94A3B8', justifyContent: 'center' },
  
  pixResult: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
  qr: { width: '200px', height: '200px', border: '1px solid #E2E8F0', borderRadius: '12px' },
  pixText: { fontSize: '13px', color: '#64748B', textAlign: 'center' },
  code: { width: '100%', padding: '12px', backgroundColor: '#F1F5F9', borderRadius: '8px', fontSize: '11px', wordBreak: 'break-all', fontFamily: 'monospace' },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }
};

export default PaymentCheckout;
