import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Camera, 
  Signature, 
  AlertTriangle, 
  Navigation, 
  Clock, 
  Phone, 
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Package,
  ArrowLeft,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toastSuccess, toastError } from '../../lib/toast';

/** 
 * LOGTA DRIVER APP - Mobile Experience
 * Desenvolvido para máxima usabilidade em campo.
 */

const DriverMobileApp: React.FC = () => {
  const [online, setOnline] = useState(true);
  const [activeStep, setActiveStep] = useState<'JORNADA' | 'ROTA' | 'ENTREGA'>('JORNADA');
  const [loading, setLoading] = useState(false);

  // Mock de Rota Ativa
  const activeRoute = {
    id: 'RT-8829',
    destination: 'Centro de Distribuição Norte',
    stops: 8,
    completed: 3,
    nextStop: {
      client: 'Supermercado Premium',
      address: 'Av. das Nações, 1500 — Setor Industrial',
      distance: '2.4 km',
      eta: '12 min',
      volumes: 12,
      orderId: '#99281'
    }
  };

  const handleStartJornada = () => {
    setLoading(true);
    setTimeout(() => {
      setActiveStep('ROTA');
      setLoading(false);
      toastSuccess('Jornada iniciada! Boa rota.');
    }, 1200);
  };

  const handleConfirmArrival = () => {
    setActiveStep('ENTREGA');
    toastSuccess('Chegada confirmada no cliente.');
  };

  return (
    <div style={styles.container}>
      {/* Status Bar Mock */}
      <div style={styles.statusBar}>
        <div style={styles.time}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div style={styles.connectivity}>
          {online ? <Wifi size={16} color="#10b981" /> : <WifiOff size={16} color="#ef4444" />}
          <span style={{ fontSize: 12, fontWeight: 700, color: online ? '#10b981' : '#ef4444' }}>
            {online ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {activeStep === 'JORNADA' && (
        <div style={styles.screen} className="animate-fade-in">
          <div style={styles.hero}>
            <div style={styles.avatarBox}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Claudio" alt="Driver" style={styles.avatar} />
            </div>
            <h1 style={styles.welcome}>Olá, Claudio!</h1>
            <p style={styles.heroSub}>Sua escala de hoje está pronta.</p>
          </div>

          <div style={styles.jornadaCard}>
            <div style={styles.jornadaInfo}>
              <div style={styles.infoItem}>
                <Truck size={20} color="var(--primary)" />
                <div>
                  <span style={styles.infoLabel}>Veículo</span>
                  <strong style={styles.infoVal}>VOLVO FH-540 (ABC-1234)</strong>
                </div>
              </div>
              <div style={styles.infoItem}>
                <Clock size={20} color="var(--primary)" />
                <div>
                  <span style={styles.infoLabel}>Início Previsto</span>
                  <strong style={styles.infoVal}>08:00 AM</strong>
                </div>
              </div>
            </div>
            <button style={styles.primaryBtn} onClick={handleStartJornada} disabled={loading}>
              {loading ? 'Sincronizando...' : 'INICIAR JORNADA'}
            </button>
          </div>

          <div style={styles.alertBox}>
            <ShieldCheck size={20} color="#10b981" />
            <span>Checklist de segurança concluído via sistema.</span>
          </div>
        </div>
      )}

      {activeStep === 'ROTA' && (
        <div style={styles.screen} className="animate-fade-in">
          <div style={styles.header}>
            <button style={styles.iconBtn} onClick={() => setActiveStep('JORNADA')}><ArrowLeft size={20} /></button>
            <div style={styles.headerTitle}>ROTA ATIVA: {activeRoute.id}</div>
            <div style={styles.badge}>{activeRoute.completed}/{activeRoute.stops}</div>
          </div>

          <div style={styles.mapPreview}>
             <div style={styles.mapOverlay}>
                <div style={styles.etaBox}>
                   <Navigation size={18} color="white" />
                   <span>{activeRoute.nextStop.distance} · {activeRoute.nextStop.eta}</span>
                </div>
             </div>
          </div>

          <div style={styles.nextStopCard}>
            <div style={styles.stopHeader}>
               <span style={styles.stopLabel}>PRÓXIMA PARADA</span>
               <span style={styles.orderBadge}>{activeRoute.nextStop.orderId}</span>
            </div>
            <h2 style={styles.clientName}>{activeRoute.nextStop.client}</h2>
            <div style={styles.addressRow}>
              <MapPin size={16} color="#64748b" />
              <p style={styles.addressText}>{activeRoute.nextStop.address}</p>
            </div>

            <div style={styles.deliveryMeta}>
              <div style={styles.metaItem}>
                <Package size={18} />
                <span>{activeRoute.nextStop.volumes} volumes</span>
              </div>
              <div style={styles.metaItem}>
                <Clock size={18} />
                <span>Janela até 18:00</span>
              </div>
            </div>

            <div style={styles.actionGrid}>
              <button style={styles.secondaryBtn} onClick={() => window.open(`tel:0800`)}>
                <Phone size={20} /> Ligar
              </button>
              <button style={styles.secondaryBtn}>
                <MessageSquare size={20} /> SAC
              </button>
            </div>

            <button style={styles.arrivalBtn} onClick={handleConfirmArrival}>
              <CheckCircle2 size={22} /> CHEGUEI NO CLIENTE
            </button>
          </div>
        </div>
      )}

      {activeStep === 'ENTREGA' && (
        <div style={styles.screen} className="animate-fade-in">
          <div style={styles.header}>
            <button style={styles.iconBtn} onClick={() => setActiveStep('ROTA')}><ArrowLeft size={20} /></button>
            <div style={styles.headerTitle}>CONFIRMAR ENTREGA</div>
          </div>

          <div style={styles.deliverySteps}>
             <div style={styles.stepItem}>
                <div style={styles.stepCircle}>1</div>
                <div style={styles.stepContent}>
                   <h3 style={styles.stepTitle}>Conferência de Carga</h3>
                   <p style={styles.stepDesc}>Verifique se os 12 volumes estão corretos.</p>
                </div>
                <CheckCircle2 size={24} color="#10b981" />
             </div>

             <div style={styles.stepItemActive}>
                <div style={styles.stepCircleActive}>2</div>
                <div style={styles.stepContent}>
                   <h3 style={styles.stepTitle}>Foto do Comprovante</h3>
                   <p style={styles.stepDesc}>Tire uma foto nítida do canhoto assinado.</p>
                   <button style={styles.photoBtn} onClick={() => toastSuccess('Câmera aberta...')}>
                      <Camera size={20} /> TIRAR FOTO
                   </button>
                </div>
             </div>

             <div style={styles.stepItem}>
                <div style={styles.stepCircle}>3</div>
                <div style={styles.stepContent}>
                   <h3 style={styles.stepTitle}>Assinatura Digital</h3>
                   <p style={styles.stepDesc}>Coletar assinatura do recebedor na tela.</p>
                   <button style={styles.ghostBtn}><Signature size={20} /> ASSINAR AGORA</button>
                </div>
             </div>
          </div>

          <div style={styles.footerActions}>
            <button style={styles.reportBtn} onClick={() => toastError('Ocorrência aberta na torre.')}>
               <AlertTriangle size={20} /> INFORMAR PROBLEMA
            </button>
            <button style={styles.finishBtn} onClick={() => { setActiveStep('ROTA'); toastSuccess('Entrega finalizada com sucesso!'); }}>
               FINALIZAR ENTREGA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '480px',
    height: '100vh',
    backgroundColor: '#F8FAFC',
    margin: '0 auto',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  statusBar: {
    height: '44px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #E2E8F0',
  },
  time: { fontWeight: '800', fontSize: '14px', color: '#0F172A' },
  connectivity: { display: 'flex', alignItems: 'center', gap: '6px' },
  screen: { flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' },
  hero: { textAlign: 'center', margin: '40px 0' },
  avatarBox: { 
    width: '100px', 
    height: '100px', 
    borderRadius: '50%', 
    backgroundColor: 'white', 
    margin: '0 auto 20px',
    padding: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
  },
  avatar: { width: '100%', height: '100%' },
  welcome: { fontSize: '28px', fontWeight: '950', color: '#0F172A', margin: '0 0 8px 0' },
  heroSub: { fontSize: '16px', color: '#64748B', fontWeight: '500' },
  jornadaCard: { 
    backgroundColor: 'white', 
    borderRadius: '32px', 
    padding: '32px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
    border: '1px solid #F1F5F9'
  },
  jornadaInfo: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' },
  infoItem: { display: 'flex', alignItems: 'center', gap: '16px' },
  infoLabel: { display: 'block', fontSize: '12px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  infoVal: { fontSize: '15px', fontWeight: '700', color: '#0F172A' },
  primaryBtn: { 
    width: '100%', 
    height: '64px', 
    backgroundColor: '#7c3aed', 
    color: 'white', 
    border: 'none', 
    borderRadius: '20px', 
    fontWeight: '900', 
    fontSize: '16px',
    letterSpacing: '1px',
    boxShadow: '0 12px 24px rgba(124, 58, 237, 0.3)',
    cursor: 'pointer'
  },
  alertBox: {
    marginTop: '32px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    backgroundColor: '#ECFDF5',
    borderRadius: '20px',
    color: '#065F46',
    fontSize: '13px',
    fontWeight: '600'
  },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  iconBtn: { 
    width: '48px', 
    height: '48px', 
    borderRadius: '16px', 
    border: 'none', 
    backgroundColor: 'white', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  headerTitle: { fontSize: '15px', fontWeight: '900', color: '#0F172A', flex: 1, textAlign: 'center' },
  badge: { padding: '6px 12px', backgroundColor: '#0F172A', color: 'white', borderRadius: '10px', fontSize: '12px', fontWeight: '800' },
  mapPreview: { 
    height: '180px', 
    backgroundColor: '#E2E8F0', 
    borderRadius: '32px', 
    marginBottom: '24px',
    backgroundImage: 'url("https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-46.6333,-23.5505,13,0/400x200?access_token=mock")',
    backgroundSize: 'cover',
    position: 'relative'
  },
  mapOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.1)', borderRadius: '32px' },
  etaBox: { 
    position: 'absolute', 
    bottom: '16px', 
    left: '16px', 
    backgroundColor: '#7c3aed', 
    padding: '8px 16px', 
    borderRadius: '12px', 
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '800',
    boxShadow: '0 8px 16px rgba(124, 58, 237, 0.4)'
  },
  nextStopCard: { 
    backgroundColor: 'white', 
    borderRadius: '32px', 
    padding: '24px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    flex: 1
  },
  stopHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  stopLabel: { fontSize: '11px', fontWeight: '900', color: '#7c3aed', letterSpacing: '1px' },
  orderBadge: { fontSize: '11px', fontWeight: '800', color: '#64748B' },
  clientName: { fontSize: '22px', fontWeight: '950', color: '#0F172A', margin: '0 0 8px 0' },
  addressRow: { display: 'flex', gap: '8px', marginBottom: '20px' },
  addressText: { fontSize: '14px', color: '#64748B', margin: 0, lineHeight: 1.4, fontWeight: '500' },
  deliveryMeta: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '12px', 
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '20px'
  },
  metaItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#0F172A', fontWeight: '700' },
  actionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' },
  secondaryBtn: { 
    height: '52px', 
    border: '1px solid #E2E8F0', 
    borderRadius: '16px', 
    backgroundColor: 'white', 
    color: '#0F172A',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  arrivalBtn: { 
    width: '100%', 
    height: '64px', 
    backgroundColor: '#0F172A', 
    color: 'white', 
    border: 'none', 
    borderRadius: '20px', 
    fontWeight: '900', 
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    cursor: 'pointer'
  },
  deliverySteps: { display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 },
  stepItem: { display: 'flex', alignItems: 'center', gap: '20px', opacity: 0.6 },
  stepItemActive: { display: 'flex', alignItems: 'flex-start', gap: '20px' },
  stepCircle: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900' },
  stepCircleActive: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: '16px', fontWeight: '900', color: '#0F172A', margin: '0 0 4px 0' },
  stepDesc: { fontSize: '13px', color: '#64748B', margin: 0 },
  photoBtn: { marginTop: '12px', padding: '12px 20px', borderRadius: '14px', border: 'none', backgroundColor: '#7c3aed', color: 'white', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
  ghostBtn: { marginTop: '12px', padding: '12px 20px', borderRadius: '14px', border: '1px dashed #7c3aed', backgroundColor: 'transparent', color: '#7c3aed', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
  footerActions: { display: 'flex', flexDirection: 'column', gap: '12px' },
  reportBtn: { height: '52px', backgroundColor: 'transparent', color: '#ef4444', border: 'none', fontWeight: '800' },
  finishBtn: { height: '64px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '16px' }
};

export default DriverMobileApp;
