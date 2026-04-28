import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Check, ArrowLeft, Shield, Zap, Crown, 
  CreditCard, Globe, Info, Lock, ArrowRight,
  Minus, Plus, Star, Box, ChevronRight
} from 'lucide-react';
import SEOManager from '../components/SEOManager';
import { hubSupabase } from '../lib/hubSupabase';

const Checkout: React.FC = () => {
  const { checkoutId } = useParams();
  const [currency] = useState<'BRL'>('BRL');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [email, setEmail] = useState('alisonnegoh@gmail.com');
  const [isLoaded, setIsLoaded] = useState(false);
  const [plan, setPlan] = useState<{name: string, price: number, features: string[], logo_url?: string, terms_url?: string, privacy_url?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Estados do Pagamento
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'BOLETO' | 'PIX'>('CREDIT_CARD');
  const [generatedData, setGeneratedData] = useState<{qrCode?: string, bankSlipUrl?: string} | null>(null);
  
  // Dados do Cliente (Asaas Ready)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCpfCnpj, setCustomerCpfCnpj] = useState('');

  // Estados do Cartão + Formatação
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [cardBrand, setCardBrand] = useState<string | null>(null);

  const getCardBrand = (number: string) => {
    const n = number.replace(/\s+/g, '');
    if (/^4/.test(n)) return 'visa';
    if (/^5[1-5]/.test(n) || /^222[1-9]/.test(n) || /^22[3-9]/.test(n) || /^2[3-6]/.test(n) || /^27[0-1]/.test(n) || /^2720/.test(n)) return 'mastercard';
    if (/^3[47]/.test(n)) return 'amex';
    if (/^(606282|504175|5067|5090|6362|6363)/.test(n)) return 'elo';
    if (/^(6011|622|64|65)/.test(n)) return 'discover';
    if (/^(3841|60)/.test(n)) return 'hipercard';
    return null;
  };

  const getBrandLogo = (brand: string | null) => {
    if (!brand) return null;
    const logos: Record<string, string> = {
      visa: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2021.svg',
      mastercard: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg',
      amex: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg',
      elo: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Elo_logo.svg',
      hipercard: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Hipercard-logo-2.svg'
    };
    return logos[brand] || null;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    setCardBrand(getCardBrand(v));
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) return parts.join(' ');
    return value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/[^0-9]/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  useEffect(() => {
    const fetchPlan = async () => {
      if (checkoutId) {
        const { data, error } = await hubSupabase
          .from('checkouts')
          .select('*')
          .eq('id', checkoutId)
          .single();

        if (data) {
          setPlan({
            name: data.product_name,
            price: parseFloat(data.amount),
            features: data.metadata?.features || ['Acesso vitalício', 'Suporte VIP'],
            logo_url: data.logo_url,
            terms_url: data.terms_url,
            privacy_url: data.privacy_url
          });
          setLoading(false);
          setIsLoaded(true);
          return;
        }
      }

      setPlan({
        name: 'Zaptro Pro',
        price: 197.00,
        features: ['Atendimento ilimitado', 'Automação inteligente', 'Relatórios'],
        logo_url: 'https://zaptro.com.br/assets/logo.png',
        terms_url: 'https://zaptro.com.br/termos',
        privacy_url: 'https://zaptro.com.br/privacidade'
      });
      setLoading(false);
      setIsLoaded(true);
    };

    fetchPlan();
  }, [checkoutId]);

  const getPrice = () => {
    if (!plan) return 0;
    return billingCycle === 'yearly' ? plan.price * 0.8 : plan.price;
  };

  const handleSubscribe = async () => {
    try {
      setProcessing(true);
      const response = await fetch('https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/zaptro-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: customerName,
          phone: customerPhone,
          cpfCnpj: customerCpfCnpj,
          paymentMethod: paymentMethod,
          card_info: paymentMethod === 'CREDIT_CARD' ? { number: cardNumber, expiry: cardExpiry, cvc: cardCVC } : null,
          plan_slug: checkoutId || 'pro',
          origin: 'zaptro'
        })
      });

      const result = await response.json();
      if (result.success) {
        if (paymentMethod === 'CREDIT_CARD') {
          window.location.href = `https://zaptro.com.br/registre?id=${result.company_id}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(customerName)}&phone=${encodeURIComponent(customerPhone)}`;
        } else {
          setGeneratedData({
            qrCode: result.pix_qr_code,
            bankSlipUrl: result.bank_slip_url
          });
          setProcessing(false);
        }
      } else {
        alert('Erro ao processar: ' + (result.error || 'Erro desconhecido'));
        setProcessing(false);
      }
    } catch (err) {
      alert('Erro na conexão.');
      setProcessing(false);
    }
  };

  const currentPrice = getPrice();
  const total = currentPrice;

  if (loading) return (
    <div style={{...styles.page, color: '#fff', display: 'flex', flexDirection: 'column', gap: '20px'}}>
      <div className="spinner" style={{width: 40, height: 40, border: '4px solid #333', borderTopColor: '#00e676', borderRadius: '50%', animation: 'spin 1s linear infinite'}} />
      <span>Sincronizando com Logta Play...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const handleNavigateBack = () => window.history.back();

  return (
    <div style={styles.page}>
      <SEOManager title="Checkout Seguro | Logta Play" description="Finalize sua assinatura Zaptro com segurança." />
      
      {/* Estilos Responsivos Injetados */}
      <style>{`
        @media (max-width: 768px) {
          .checkout-container {
            flex-direction: column !important;
            overflow-y: auto !important;
          }
          .left-panel {
            padding: 40px 20px !important;
            min-height: auto !important;
          }
          .right-panel {
            padding: 30px 20px !important;
            min-height: auto !important;
          }
          .main-price {
            font-size: 42px !important;
          }
          .payment-box {
            max-width: 100% !important;
            padding: 20px !important;
            box-shadow: none !important;
          }
          .field-group div {
            flex-direction: column !important;
          }
          .input-field {
            margin-bottom: 12px !important;
          }
        }
        @media (max-width: 480px) {
          .main-price {
            font-size: 36px !important;
          }
          .badge {
            font-size: 11px !important;
          }
        }
      `}</style>
      
      <div className="checkout-container" style={{...styles.container, opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'}}>
        
        {/* Lado Esquerdo: Detalhes Centrados */}
        <div className="left-panel" style={styles.leftPanel}>
          <div style={styles.leftContent}>
            <button onClick={handleNavigateBack} style={styles.backBtn}>
              <ArrowLeft size={18} />
              <div style={styles.logoCircle}>
                <img src={plan?.logo_url || 'https://zaptro.com.br/assets/logo.png'} style={{width: '24px'}} />
              </div>
            </button>

            <div style={styles.productInfo}>
              <span className="badge" style={styles.badge}>Assinar {plan?.name}</span>
              <div style={styles.priceContainer}>
                  <h1 className="main-price" style={styles.mainPrice}>
                    R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h1>
                  <span style={styles.pricePeriod}>por mês</span>
              </div>

              <div style={styles.planCard}>
                  <div style={styles.planHeader}>
                    <div style={styles.planIcon}>
                        <Box size={24} color="#fff" />
                    </div>
                    <div style={styles.planTitleBox}>
                        <h3 style={styles.planName}>{plan?.name}</h3>
                        <p style={styles.planFeatures}>{plan?.features?.join(', ')}</p>
                    </div>
                  </div>

                  <div style={styles.cycleToggle}>
                    <div 
                      style={{...styles.toggleBg, justifyContent: billingCycle === 'monthly' ? 'flex-start' : 'flex-end'}}
                      onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                    >
                        <div style={styles.toggleHandle} />
                    </div>
                    <span style={styles.toggleLabel}>Economize 20% no plano anual</span>
                  </div>
              </div>

              <div style={styles.summaryTable}>
                  <div style={styles.summaryRow}><span>Subtotal</span><span>R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                  <div style={styles.divider} />
                  <div style={{...styles.summaryRow, fontWeight: '700', fontSize: '18px', color: '#fff'}}>
                    <span>Total hoje</span>
                    <span>R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Formulário */}
        <div className="right-panel" style={styles.rightPanel}>
           <div className="payment-box" style={styles.paymentBox}>
              <div style={styles.linkHeader}>
                 <div style={styles.linkLogo}>
                    <img src={plan?.logo_url || 'https://zaptro.com.br/assets/logo.png'} style={{width: '24px', marginRight: '8px'}} />
                    Logta Play
                 </div>
              </div>

              <div style={styles.paymentMethodTabs}>
                 <button 
                   onClick={() => { setPaymentMethod('CREDIT_CARD'); setGeneratedData(null); }}
                   style={{...styles.methodTab, color: paymentMethod === 'CREDIT_CARD' ? '#000' : '#888'}}
                 >
                   <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                     <CreditCard size={18} /> Cartão
                   </div>
                   {paymentMethod === 'CREDIT_CARD' && <div style={styles.tabIndicator} />}
                 </button>
                 <button 
                   onClick={() => { setPaymentMethod('PIX'); setGeneratedData(null); }}
                   style={{...styles.methodTab, color: paymentMethod === 'PIX' ? '#000' : '#888'}}
                 >
                   <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                     <Zap size={18} /> Pix
                   </div>
                   {paymentMethod === 'PIX' && <div style={styles.tabIndicator} />}
                 </button>
                 <button 
                   onClick={() => { setPaymentMethod('BOLETO'); setGeneratedData(null); }}
                   style={{...styles.methodTab, color: paymentMethod === 'BOLETO' ? '#000' : '#888'}}
                 >
                   <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                     <Box size={18} /> Boleto
                   </div>
                   {paymentMethod === 'BOLETO' && <div style={styles.tabIndicator} />}
                 </button>
              </div>

              <div style={styles.fieldGroup}>
                 <div style={styles.inputLabel}>Dados do Cliente</div>
                 <input placeholder="Nome Completo" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{...styles.inputField, marginBottom: '12px'}} />
                 <input placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{...styles.inputField, marginBottom: '12px'}} />
                 <div style={{display: 'flex', gap: '12px'}}>
                    <input placeholder="WhatsApp (DDD)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={styles.inputField} />
                    <input placeholder="CPF ou CNPJ" value={customerCpfCnpj} onChange={(e) => setCustomerCpfCnpj(e.target.value)} style={styles.inputField} />
                 </div>
              </div>

              {paymentMethod === 'CREDIT_CARD' && (
                <div className="field-group" style={styles.fieldGroup}>
                   <div style={styles.inputLabel}>Informações do Cartão</div>
                   <div style={{position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '12px'}}>
                     <input 
                        placeholder="0000 0000 0000 0000" 
                        value={cardNumber} 
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        style={{...styles.inputField, paddingRight: '40px'}} 
                     />
                     {cardBrand && (
                       <img 
                         src={getBrandLogo(cardBrand)!} 
                         style={{position: 'absolute', right: '0', height: '20px', transition: 'all 0.2s'}} 
                         alt={cardBrand}
                       />
                     )}
                   </div>
                   <div style={{display: 'flex', gap: '12px'}}>
                      <input placeholder="MM/AA" value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} className="input-field" style={styles.inputField} />
                      <input placeholder="CVC" maxLength={4} value={cardCVC} onChange={(e) => setCardCVC(e.target.value.replace(/[^0-9]/g, ''))} className="input-field" style={styles.inputField} />
                   </div>
                </div>
              )}

              <button onClick={handleSubscribe} disabled={processing} style={styles.payBtn}>
                {processing ? 'Processando...' : paymentMethod === 'CREDIT_CARD' ? 'Assinar Agora' : 'Gerar Pagamento'}
              </button>

              {/* Área de Resultado Pix/Boleto */}
              {generatedData && (
                <div style={styles.generatedContainer}>
                  {generatedData.qrCode && (
                    <div style={{textAlign: 'center'}}>
                      <p style={{fontSize: '13px', color: '#64748b', marginBottom: '12px'}}>Escaneie o QR Code abaixo:</p>
                      <img src={generatedData.qrCode} style={{width: '200px', margin: '0 auto'}} />
                    </div>
                  )}
                  {generatedData.bankSlipUrl && (
                    <a href={generatedData.bankSlipUrl} target="_blank" style={styles.viewBoletoBtn}>Visualizar Boleto</a>
                  )}
                </div>
              )}

              <p style={styles.legalText}>
                 Ao clicar, você autoriza Logta Play a realizar a cobrança segura via Asaas.
              </p>

              <div style={styles.footer}>
                 <span>Logta Play</span>
                 <div style={styles.footerLinks}>
                    <a href={plan?.terms_url || '#'} target="_blank">Termos</a>
                    <a href={plan?.privacy_url || '#'} target="_blank">Privacidade</a>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  page: { 
    minHeight: '100vh', 
    backgroundColor: '#000', // Base
    display: 'flex', 
    alignItems: 'stretch', 
    justifyContent: 'center', 
    fontFamily: 'Inter, -apple-system, sans-serif',
    color: '#fff',
    overflow: 'hidden'
  },
  container: {
    width: '100%',
    display: 'flex',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  leftPanel: {
    flex: 1,
    padding: '60px 80px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    overflowY: 'auto',
    backgroundColor: '#000',
  },
  leftContent: {
    width: '100%',
    maxWidth: '500px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '60px',
    padding: 0,
    width: 'fit-content'
  },
  logoCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: '#1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #333',
  },
  productInfo: {
    maxWidth: '500px',
  },
  badge: {
    color: '#888',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '12px',
    display: 'block'
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    marginBottom: '32px'
  },
  mainPrice: {
    fontSize: '56px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-2px',
    margin: 0
  },
  pricePeriod: {
    fontSize: '18px',
    color: '#888',
    fontWeight: '500'
  },
  switchContainer: {
    display: 'flex',
    gap: '8px',
    padding: '4px',
    backgroundColor: '#111',
    borderRadius: '12px',
    width: 'fit-content',
    marginBottom: '20px',
    border: '1px solid #222'
  },
  switchBtn: {
    padding: '8px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  exchangeNote: {
    fontSize: '12px',
    color: '#555',
    marginBottom: '48px',
    lineHeight: '1.5'
  },
  planCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: '20px',
    border: '1px solid #222',
    padding: '24px',
    marginBottom: '48px'
  },
  planHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px'
  },
  planIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #333'
  },
  planTitleBox: {
    flex: 1
  },
  planName: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 4px 0'
  },
  planFeatures: {
    fontSize: '13px',
    color: '#888',
    margin: 0,
    lineHeight: '1.4'
  },
  planPrice: {
    fontSize: '16px',
    fontWeight: '600'
  },
  cycleToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  toggleBg: {
    width: '36px',
    height: '20px',
    backgroundColor: '#333',
    borderRadius: '20px',
    padding: '2px',
    display: 'flex',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  toggleHandle: {
    width: '16px',
    height: '16px',
    backgroundColor: '#fff',
    borderRadius: '50%'
  },
  toggleLabel: {
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: '#1a1a1a',
    padding: '4px 10px',
    borderRadius: '6px',
    color: '#fff'
  },
  yearlyPrice: {
    fontSize: '13px',
    color: '#888',
    marginLeft: 'auto'
  },
  summaryTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#888',
    fontWeight: '500'
  },
  divider: {
    height: '1px',
    backgroundColor: '#222',
    margin: '4px 0'
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px'
  },
  paymentBox: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '24px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
    color: '#000'
  },
  linkHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px'
  },
  linkLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '22px',
    fontWeight: '700',
    color: '#000'
  },
  moreBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '20px'
  },
  paymentMethodTabs: {
    display: 'flex',
    gap: '24px',
    marginBottom: '32px',
    borderBottom: '1px solid #f1f5f9'
  },
  methodTab: {
    padding: '12px 0',
    background: 'none',
    border: 'none',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    position: 'relative'
  },
  tabIndicator: {
    position: 'absolute',
    bottom: '-1px',
    left: 0,
    right: 0,
    height: '3px',
    backgroundColor: '#00e676',
    borderRadius: '3px 3px 0 0'
  },
  generatedContainer: {
    marginTop: '24px',
    padding: '24px',
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  viewBoletoBtn: {
    display: 'block',
    width: '100%',
    textAlign: 'center',
    padding: '12px',
    backgroundColor: '#000',
    color: '#fff',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600'
  },
  fieldGroup: {
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px'
  },
  inputLabel: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '8px'
  },
  inputField: {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '16px',
    fontWeight: '500',
    color: '#000',
    padding: 0
  },
  paymentSelector: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer'
  },
  cardInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '16px',
    fontWeight: '500'
  },
  cardLogo: {
    display: 'flex',
    alignItems: 'center'
  },
  cardLastDigits: {
    fontSize: '14px',
    color: '#64748b',
    marginLeft: 'auto',
    marginRight: '12px'
  },
  payBtn: {
    width: '100%',
    padding: '18px',
    backgroundColor: '#00e676',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '24px',
    transition: 'all 0.2s',
    boxShadow: '0 8px 16px rgba(0,230,118,0.2)'
  },
  legalText: {
    fontSize: '12px',
    color: '#64748b',
    lineHeight: '1.6',
    textAlign: 'center',
    marginBottom: '24px'
  },
  altPaymentBtn: {
    width: '100%',
    background: 'none',
    border: 'none',
    color: '#00e676',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '40px',
    textAlign: 'center'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: '#94a3b8'
  },
  footerLinks: {
    display: 'flex',
    gap: '16px'
  }
};

export default Checkout;
