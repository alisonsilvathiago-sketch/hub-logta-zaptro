import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Check, ArrowLeft, Shield, Zap, 
  CreditCard, Globe, Lock, ArrowRight,
  Minus, Plus, Star, Box, ChevronRight, Tag, Info, Gift, Phone, MessageSquare
} from 'lucide-react';
import SEOManager from '../components/SEOManager';
import { hubSupabase } from '../lib/hubSupabase';
import { supabase as localSupabase } from '../lib/supabase';

// Estilos Premium (Clean Light / Dark Mode conforme Logta)
const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: 'Inter, sans-serif', padding: '40px 20px' },
  container: { maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' },
  
  // Lado Esquerdo: Resumo do Plano (Cursor Style)
  summaryCard: { background: '#0F172A', borderRadius: '24px', padding: '32px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', position: 'sticky', top: '40px' },
  brand: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' },
  logoIcon: { width: '40px', height: '40px', background: '#6366F1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' },
  brandName: { fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' },
  
  planCard: { background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' },
  planHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  planTitle: { fontSize: '14px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' },
  planPrice: { fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', color: '#fff' },
  pricePeriod: { fontSize: '16px', color: '#94A3B8', fontWeight: '500', marginLeft: '8px' },
  
  toggleBox: { display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '14px', width: 'fit-content', marginBottom: '24px' },
  toggleBtn: { padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', border: 'none', cursor: 'pointer', transition: 'all 0.2s' },
  
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.1)' },
  totalLabel: { fontSize: '16px', fontWeight: '700', color: '#94A3B8' },
  totalValue: { fontSize: '24px', fontWeight: '900', color: '#6366F1' },
  
  // Lado Direito: Checkout Form
  formCard: { background: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' },
  sectionTitle: { fontSize: '18px', fontWeight: '900', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' },
  input: { width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #F1F5F9', fontSize: '15px', outline: 'none', background: '#F8FAFC', marginBottom: '16px', boxSizing: 'border-box' },
  label: { fontSize: '11px', fontWeight: '900', color: '#6366F1', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '0.8px' },
  
  payBtn: { width: '100%', padding: '20px', borderRadius: '18px', border: 'none', background: '#6366F1', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(99,102,241,0.25)', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  
  metadataGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '24px' },
  metaItem: { background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#CBD5E1' },
  
  featuresList: { marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#94A3B8' },
  
  couponBtn: { background: 'none', border: 'none', color: '#6366F1', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '0', marginTop: '12px' }
};

const Checkout: React.FC = () => {
  const { checkoutId } = useParams();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCpfCnpj, setCustomerCpfCnpj] = useState('');
  const [showCoupon, setShowCoupon] = useState(false);
  const [coupon, setCoupon] = useState('');

  useEffect(() => {
    const fetchPlan = async () => {
      if (!checkoutId) {
        setLoading(false);
        return;
      }

      try {
        console.log('Buscando plano Logta:', checkoutId);
        
        // 1. Tenta buscar no HUB MASTER (Tabela plans)
        let { data, error } = await hubSupabase
          .from('plans')
          .select('*')
          .eq('id', checkoutId)
          .maybeSingle();

        // 2. Se não encontrou, tenta no HUB MASTER (Tabela checkouts)
        if (!data) {
          const { data: cData } = await hubSupabase
            .from('checkouts')
            .select('*')
            .eq('id', checkoutId)
            .maybeSingle();
          if (cData) data = { ...cData, price: parseFloat(cData.amount), name: cData.product_name, features: cData.metadata?.features || [] };
        }

        // 3. Se não encontrou, tenta no BANCO LOCAL (Tabela plans)
        if (!data) {
          const { data: lData } = await localSupabase
            .from('plans')
            .select('*')
            .eq('id', checkoutId)
            .maybeSingle();
          if (lData) data = lData;
        }

        if (data) {
          let featuresArray = [];
          if (Array.isArray(data.features)) {
            featuresArray = data.features;
          } else if (typeof data.features === 'string') {
            featuresArray = data.features.split('\n').filter((f: string) => f.trim() !== '');
          }
          setPlan({ ...data, features: featuresArray });
        } else {
           console.error('Nenhum plano encontrado em nenhum banco.');
        }
      } catch (err) {
        console.error('Erro ao carregar plano:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [checkoutId]);

  const currentPrice = plan ? (billingCycle === 'yearly' ? plan.price * 0.8 : plan.price) : 0;

  const handleSubscribe = async () => {
    if (!customerName || !email) {
      alert('Preencha nome e e-mail');
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch('https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/hub-core/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: customerName,
          phone: customerPhone,
          plan: checkoutId,
          amount: currentPrice,
          origin: plan?.type?.toLowerCase() || 'logta',
          cpfCnpj: customerCpfCnpj,
          billing_cycle: billingCycle,
          coupon: coupon
        })
      });

      const result = await response.json();
      if (result.success) {
        window.location.href = `https://logta.com.br/welcome?id=${result.company_id}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(customerName)}`;
      } else {
        alert(result.error || 'Erro no processamento');
      }
    } catch (err) {
      alert('Erro de conexão');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Zap className="animate-spin" size={48} color="#6366F1" />
    </div>
  );

  if (!plan) return (
    <div style={{ ...S.page, textAlign: 'center', paddingTop: '100px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '900' }}>Plano não encontrado</h1>
      <p style={{ color: '#64748B' }}>O link que você acessou pode estar expirado ou o ID está incorreto.</p>
      <div style={{ marginTop: '20px', fontSize: '11px', color: '#94A3B8' }}>ID: {checkoutId}</div>
    </div>
  );

  return (
    <div style={S.page}>
      <SEOManager title={`Checkout | ${plan.name}`} description={`Finalize sua assinatura ${plan.name} com segurança.`} />
      
      <div style={S.container}>
        {/* LADO ESQUERDO: RESUMO */}
        <div style={S.summaryCard}>
          <div style={S.brand}>
            <div style={S.logoIcon}><Box size={20} fill="#fff" /></div>
            <span style={S.brandName}>{plan.type === 'ZAPTRO' ? 'Zaptro' : 'Logta'}</span>
          </div>

          <div style={S.planCard}>
            <div style={S.planHeader}>
              <span style={S.planTitle}>{plan.name}</span>
              <div style={{ color: '#6366F1' }}><Star size={18} fill="#6366F1" /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <h1 style={S.planPrice}>R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h1>
              <span style={S.pricePeriod}>/mês</span>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '14px', marginTop: '12px', lineHeight: '1.6' }}>
              {plan.description}
            </p>
          </div>

          <div style={S.toggleBox}>
            <button 
              onClick={() => setBillingCycle('monthly')}
              style={{ ...S.toggleBtn, background: billingCycle === 'monthly' ? '#fff' : 'transparent', color: billingCycle === 'monthly' ? '#000' : '#94A3B8' }}
            >
              MENSAL
            </button>
            <button 
              onClick={() => setBillingCycle('yearly')}
              style={{ ...S.toggleBtn, background: billingCycle === 'yearly' ? '#fff' : 'transparent', color: billingCycle === 'yearly' ? '#000' : '#94A3B8' }}
            >
              ANUAL <span style={{ color: '#22C55E', marginLeft: '4px' }}>-20%</span>
            </button>
          </div>

          <div style={S.metadataGrid}>
            <div style={S.metaItem}><Phone size={14} color="#6366F1" /> {plan.wa_credits} Créditos WA</div>
            <div style={S.metaItem}><Zap size={14} color="#6366F1" /> {plan.ai_credits} Créditos IA</div>
            <div style={S.metaItem}><Star size={14} color="#6366F1" /> {plan.trial_days} Dias Trial</div>
            <div style={S.metaItem}><Shield size={14} color="#6366F1" /> Seguro</div>
          </div>

          <div style={S.featuresList}>
            {plan.features?.map((f: string, i: number) => (
              <div key={i} style={S.featureItem}>
                <Check size={14} color="#22C55E" /> {f}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '40px' }}>
            <div style={S.totalRow}>
              <span style={S.totalLabel}>Subtotal</span>
              <span style={{ color: '#fff' }}>R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={S.totalRow}>
              <span style={S.totalLabel}>Imposto</span>
              <span style={{ color: '#fff' }}>R$ 0,00</span>
            </div>
            <div style={{ ...S.totalRow, borderTop: '2px solid rgba(255,255,255,0.1)', marginTop: '8px' }}>
              <span style={{ ...S.totalLabel, color: '#fff', fontSize: '18px' }}>Total devido hoje</span>
              <span style={S.totalValue}>R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: FORMULÁRIO */}
        <div style={S.formCard}>
          <div style={S.sectionTitle}>
            <div style={{ width: 32, height: 32, background: '#F1F5F9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} color="#6366F1" />
            </div>
            Finalizar Assinatura
          </div>

          <label style={S.label}>Nome Completo</label>
          <input style={S.input} placeholder="Seu nome" value={customerName} onChange={e => setCustomerName(e.target.value)} />

          <label style={S.label}>E-mail</label>
          <input style={S.input} placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={S.label}>WhatsApp</label>
              <input style={S.input} placeholder="(00) 00000-0000" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>CPF ou CNPJ</label>
              <input style={S.input} placeholder="000.000.000-00" value={customerCpfCnpj} onChange={e => setCustomerCpfCnpj(e.target.value)} />
            </div>
          </div>

          <button style={S.couponBtn} onClick={() => setShowCoupon(!showCoupon)}>
            <Tag size={14} /> Possui um cupom de desconto?
          </button>
          
          {showCoupon && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <input style={{ ...S.input, marginBottom: 0, flex: 1 }} placeholder="CÓDIGO" value={coupon} onChange={e => setCoupon(e.target.value)} />
              <button style={{ background: '#F1F5F9', border: 'none', padding: '0 20px', borderRadius: '16px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>APLICAR</button>
            </div>
          )}

          <div style={{ height: '1px', background: '#F1F5F9', margin: '32px 0' }} />

          <div style={{ marginBottom: '16px' }}>
            <label style={S.label}>Método de Pagamento</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ padding: '16px', borderRadius: '14px', border: '2px solid #6366F1', background: 'rgba(99,102,241,0.05)', textAlign: 'center' }}>
                <CreditCard size={20} color="#6366F1" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#6366F1' }}>CARTÃO</div>
              </div>
              <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid #F1F5F9', background: '#fff', textAlign: 'center', opacity: 0.6 }}>
                <Zap size={20} color="#94A3B8" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8' }}>PIX</div>
              </div>
              <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid #F1F5F9', background: '#fff', textAlign: 'center', opacity: 0.6 }}>
                <Box size={20} color="#94A3B8" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8' }}>BOLETO</div>
              </div>
            </div>
          </div>

          <button 
            style={S.payBtn} 
            onClick={handleSubscribe}
            disabled={processing}
          >
            {processing ? 'Processando...' : (
              <>
                ASSINAR AGORA <ArrowRight size={20} />
              </>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px', color: '#94A3B8', fontSize: '12px' }}>
            <Lock size={14} /> Pagamento 100% Seguro via Asaas
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
