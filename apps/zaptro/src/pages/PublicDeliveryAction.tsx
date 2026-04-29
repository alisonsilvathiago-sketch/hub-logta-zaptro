import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  CheckCircle2, Clock, Calendar, XCircle, 
  MapPin, Package, ChevronRight, AlertCircle,
  TrendingUp, Zap, ArrowRight, Smartphone
} from 'lucide-react';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '../lib/toast';

const PublicDeliveryAction: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [delivery, setDelivery] = useState<any>(null);
  const [step, setStep] = useState<'main' | 'reschedule' | 'success'>('main');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDelivery = async () => {
      if (!token) return;
      
      const { data, error } = await supabase
        .from('delivery_actions')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) {
        setError('Token de entrega inválido ou expirado.');
        setLoading(false);
        return;
      }

      setDelivery(data);
      setLoading(false);
    };

    fetchDelivery();
  }, [token]);

  const handleAction = async (action: 'confirmado' | 'cancelado', feedback?: string) => {
    const tid = toastLoading('Sincronizando com a torre de controle...');
    try {
      const { error } = await supabase
        .from('delivery_actions')
        .update({ 
          status: action, 
          responded_at: new Date().toISOString(),
          customer_feedback: feedback 
        })
        .eq('token', token);

      if (error) throw error;
      
      // Registrar no LOGTA Operacional
      await supabase.from('operational_audit_log').insert([{
        service: 'ZAPTRO',
        action: `CUSTOMER_${action.toUpperCase()}`,
        details: { order_id: delivery.order_id, token }
      }]);

      setStep('success');
      toastSuccess(action === 'confirmado' ? 'Entrega Confirmada!' : 'Entrega Cancelada.');
    } catch (err) {
      toastError('Erro ao processar ação.');
    } finally {
      toastDismiss(tid);
    }
  };

  const handleReschedule = async (date: string, faixa: string) => {
    const tid = toastLoading('Ajustando rotas autônomas...');
    try {
      const { error } = await supabase
        .from('delivery_actions')
        .update({ 
          status: 'reagendado', 
          rescheduled_date: date,
          rescheduled_faixa: faixa,
          responded_at: new Date().toISOString()
        })
        .eq('token', token);

      if (error) throw error;

      await supabase.from('operational_audit_log').insert([{
        service: 'ZAPTRO',
        action: 'CUSTOMER_RESCHEDULED',
        details: { order_id: delivery.order_id, date, faixa }
      }]);

      setStep('success');
      toastSuccess('Reagendamento solicitado com sucesso!');
    } catch (err) {
      toastError('Erro ao reagendar.');
    } finally {
      toastDismiss(tid);
    }
  };

  if (loading) return <div style={styles.loadingContainer}><Zap className="animate-pulse" size={48} color="#D9FF00" /></div>;
  if (error) return <div style={styles.errorContainer}><AlertCircle size={48} color="#EF4444" /><p>{error}</p></div>;

  const rescheduleOptions = [
    { label: 'Hoje - 18h às 22h', date: new Date().toISOString().split('T')[0], faixa: 'Noite', best: true },
    { label: 'Amanhã - 08h às 12h', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], faixa: 'Manhã', best: false },
    { label: 'Amanhã - 14h às 18h', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], faixa: 'Tarde', best: false },
    { label: 'Segunda - 08h às 12h', date: new Date(Date.now() + 259200000).toISOString().split('T')[0], faixa: 'Manhã', best: false },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <header style={styles.header}>
           <div style={styles.logo}>Z</div>
           <div style={styles.headerText}>
              <h1 style={styles.title}>Confirmação de Entrega</h1>
              <p style={styles.subtitle}>Pedido #{delivery?.order_id?.slice(-6) || '---'}</p>
           </div>
        </header>

        {step === 'main' && (
          <div className="animate-fade-in">
             <div style={styles.infoBox}>
                <div style={styles.infoItem}>
                   <MapPin size={18} color="#94A3B8" />
                   <span>Endereço de Entrega Cadastrado</span>
                </div>
                <div style={styles.infoItem}>
                   <Clock size={18} color="#94A3B8" />
                   <span>Previsão: Hoje, entre 14h e 18h</span>
                </div>
             </div>

             <p style={styles.instruction}>Sua entrega está programada. Para garantir a agilidade, por favor confirme sua disponibilidade ou reagende se necessário.</p>

             <div style={styles.actions}>
                <button style={styles.primaryBtn} onClick={() => handleAction('confirmado')}>
                   <CheckCircle2 size={20} /> Confirmar Entrega
                </button>
                <button style={styles.secondaryBtn} onClick={() => setStep('reschedule')}>
                   <Calendar size={20} /> Reagendar Horário
                </button>
                <button style={styles.cancelBtn} onClick={() => handleAction('cancelado')}>
                   <XCircle size={18} /> Cancelar Entrega
                </button>
             </div>
          </div>
        )}

        {step === 'reschedule' && (
          <div className="animate-fade-in">
             <h2 style={styles.sectionTitle}>Escolha um novo horário:</h2>
             <p style={styles.instruction}>O HUB calculou as melhores rotas para sua região. Selecione uma opção pronta:</p>
             
             <div style={styles.optionsList}>
                {rescheduleOptions.map((opt, i) => (
                  <button key={i} style={styles.optionBtn} onClick={() => handleReschedule(opt.date, opt.faixa)}>
                     <div style={styles.optionMain}>
                        <Clock size={18} />
                        <span>{opt.label}</span>
                     </div>
                     {opt.best && <div style={styles.bestBadge}>MAIS RÁPIDO</div>}
                     <ChevronRight size={18} color="#D9FF00" />
                  </button>
                ))}
             </div>

             <button style={styles.backBtn} onClick={() => setStep('main')}>Voltar</button>
          </div>
        )}

        {step === 'success' && (
          <div style={styles.successScreen} className="animate-fade-in">
             <div style={styles.successIcon}><CheckCircle2 size={64} color="#D9FF00" /></div>
             <h2 style={styles.title}>Tudo Pronto!</h2>
             <p style={styles.instruction}>Sua preferência foi enviada para nossa torre de controle. A rota será ajustada automaticamente.</p>
             <div style={styles.statsMini}>
                <TrendingUp size={16} color="#D9FF00" />
                <span>Impacto: -15% Emissão de Carbono</span>
             </div>
          </div>
        )}

        <footer style={styles.footer}>
           <Smartphone size={14} />
           <span>Sistema Autônomo Logta Intelligence</span>
        </footer>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { minHeight: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Inter, sans-serif' },
  card: { width: '100%', maxWidth: '440px', backgroundColor: '#111', borderRadius: '32px', padding: '32px', border: '1px solid #222', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  loadingContainer: { minHeight: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  errorContainer: { minHeight: '100vh', backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFF', gap: '16px' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' },
  logo: { width: '48px', height: '48px', backgroundColor: '#D9FF00', color: '#000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '24px' },
  headerText: { display: 'flex', flexDirection: 'column' },
  title: { color: '#FFF', fontSize: '22px', fontWeight: '800', margin: 0 },
  subtitle: { color: '#666', fontSize: '14px', fontWeight: '600', margin: 0 },
  infoBox: { backgroundColor: '#1A1A1A', borderRadius: '20px', padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' },
  infoItem: { display: 'flex', alignItems: 'center', gap: '12px', color: '#94A3B8', fontSize: '13px', fontWeight: '500' },
  instruction: { color: '#94A3B8', fontSize: '15px', lineHeight: '1.6', margin: '0 0 32px' },
  actions: { display: 'flex', flexDirection: 'column', gap: '12px' },
  primaryBtn: { backgroundColor: '#D9FF00', color: '#000', border: 'none', padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  secondaryBtn: { backgroundColor: '#222', color: '#FFF', border: 'none', padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  cancelBtn: { backgroundColor: 'transparent', color: '#EF4444', border: 'none', padding: '16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  sectionTitle: { color: '#FFF', fontSize: '18px', fontWeight: '700', marginBottom: '12px' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  optionBtn: { backgroundColor: '#1A1A1A', color: '#FFF', border: '1px solid #222', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' },
  optionMain: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '600' },
  bestBadge: { fontSize: '9px', fontWeight: '900', backgroundColor: '#D9FF00', color: '#000', padding: '2px 6px', borderRadius: '4px' },
  backBtn: { backgroundColor: 'transparent', color: '#666', border: 'none', marginTop: '24px', width: '100%', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  successScreen: { textAlign: 'center', padding: '20px 0' },
  successIcon: { marginBottom: '24px' },
  statsMini: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px', fontSize: '12px', fontWeight: '700', color: '#666' },
  footer: { marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #222', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#444', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }
};

export default PublicDeliveryAction;
