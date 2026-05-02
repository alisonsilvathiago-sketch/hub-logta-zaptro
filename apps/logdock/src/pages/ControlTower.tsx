import React, { useState, useEffect } from 'react';
import { MapPin, Truck, AlertTriangle, CheckCircle2, Navigation, RefreshCw, Layers, Shield, Search } from 'lucide-react';
import { useAuth } from '@shared/context/AuthContext';

export const ControlTowerPage: React.FC = () => {
  const { profile } = useAuth();
  const [selectedTruck, setSelectedTruck] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const [trucks, setTrucks] = useState([
    { id: 'TRK-100', plate: 'ABC-1234', driver: 'Carlos Lima', status: 'em_rota', lat: -23.55052, lng: -46.633308, route: 'São Paulo → Curitiba', progress: 45, speed: '80 km/h', type: 'Pesado', alert: null },
    { id: 'TRK-202', plate: 'XYZ-5678', driver: 'Ana Paula', status: 'atrasado', lat: -22.906847, lng: -43.172896, route: 'Rio de Janeiro → Belo Horizonte', progress: 62, speed: '0 km/h', type: 'Carreta', alert: 'Veículo parado há 2 horas' },
    { id: 'TRK-305', plate: 'KJH-9012', driver: 'Marcos Silva', status: 'concluido', lat: -19.916681, lng: -43.934493, route: 'Belo Horizonte → Vitória', progress: 100, speed: '0 km/h', type: 'VUC', alert: null },
    { id: 'TRK-412', plate: 'DEF-3456', driver: 'Roberto Dias', status: 'em_rota', lat: -25.4284, lng: -49.2733, route: 'Curitiba → Joinville', progress: 18, speed: '72 km/h', type: 'Toco', alert: null }
  ]);

  useEffect(() => {
    // Simulate real-time progress of trucks
    const interval = setInterval(() => {
      setTrucks(prevTrucks =>
        prevTrucks.map(t => {
          if (t.status === 'em_rota' && t.progress < 100) {
            const nextProgress = Math.min(t.progress + 2, 100);
            return {
              ...t,
              progress: nextProgress,
              status: nextProgress === 100 ? 'concluido' : t.status
            };
          }
          return t;
        })
      );
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const activeAlerts = trucks.filter(t => t.alert).length;

  return (
    <div style={styles.container}>
      {/* HEADER DA TORRE */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Torre de Controle Logística</h1>
          <p style={styles.subtitle}>Visão unificada em tempo real, rotas e alertas da sua frota.</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.alertBtn} onClick={() => setIsAlertModalOpen(true)}>
            <AlertTriangle size={18} /> Novo Alerta
          </button>
        </div>
      </header>

      {/* PAINEL DE RESUMO */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: '5px solid #0061FF' }}>
          <div style={styles.statHeader}>
            <Truck size={22} color="#0061FF" />
            <span style={styles.statLabel}>Em Trânsito</span>
          </div>
          <span style={styles.statValue}>{trucks.filter(t => t.status === 'em_rota').length}</span>
        </div>

        <div style={{ ...styles.statCard, borderLeft: '5px solid #EF4444' }}>
          <div style={styles.statHeader}>
            <AlertTriangle size={22} color="#EF4444" />
            <span style={styles.statLabel}>Atrasos / Alertas</span>
          </div>
          <span style={styles.statValue}>{trucks.filter(t => t.status === 'atrasado').length + activeAlerts}</span>
        </div>

        <div style={{ ...styles.statCard, borderLeft: '5px solid #10B981' }}>
          <div style={styles.statHeader}>
            <CheckCircle2 size={22} color="#10B981" />
            <span style={styles.statLabel}>Entregas Hoje</span>
          </div>
          <span style={styles.statValue}>{trucks.filter(t => t.status === 'concluido').length}</span>
        </div>
      </div>

      {/* MAPA E LISTA PRINCIPAL */}
      <div style={styles.mapWorkspace}>
        {/* MAPA SIMULADO INTERATIVO */}
        <div style={styles.mapArea}>
          <div style={styles.mapControls}>
            <button style={{ ...styles.mapControlBtn, background: filter === 'all' ? '#0061FF' : '#FFF', color: filter === 'all' ? '#FFF' : '#1E1E1E' }} onClick={() => setFilter('all')}>Tudo</button>
            <button style={{ ...styles.mapControlBtn, background: filter === 'atrasado' ? '#EF4444' : '#FFF', color: filter === 'atrasado' ? '#FFF' : '#1E1E1E' }} onClick={() => setFilter('atrasado')}>Alertas</button>
          </div>

          <div style={styles.simulatedMap}>
            <div style={styles.mapGridBackground}>
              {/* Truck Markers on Map */}
              {trucks.filter(t => filter === 'all' || t.status === filter).map(t => (
                <div 
                  key={t.id} 
                  style={{
                    ...styles.mapMarker,
                    top: `${40 + (t.lat % 5) * 10}%`,
                    left: `${45 + (t.lng % 5) * 8}%`,
                    borderColor: t.status === 'atrasado' ? '#EF4444' : t.status === 'concluido' ? '#10B981' : '#0061FF'
                  }}
                  onClick={() => setSelectedTruck(t)}
                >
                  <Truck size={14} color={t.status === 'atrasado' ? '#EF4444' : t.status === 'concluido' ? '#10B981' : '#0061FF'} />
                  <span style={styles.markerLabel}>{t.id}</span>
                </div>
              ))}
              <div style={styles.mapWatermark}>
                <Layers size={14} /> TORRE DE CONTROLE LOGDOCK • VISUALIZAÇÃO SATÉLITE SIMULADA
              </div>
            </div>
          </div>
        </div>

        {/* LISTAGEM DETALHADA DA FROTA */}
        <div style={styles.truckList}>
          <h3 style={styles.listTitle}>Status da Frota</h3>
          <div style={styles.listScroll}>
            {trucks.filter(t => filter === 'all' || t.status === filter).map(t => (
              <div 
                key={t.id} 
                style={{
                  ...styles.truckListItem,
                  borderColor: selectedTruck?.id === t.id ? '#0061FF' : '#F1F5F9',
                  backgroundColor: selectedTruck?.id === t.id ? '#F0F7FF' : '#FFF'
                }}
                onClick={() => setSelectedTruck(t)}
              >
                <div style={styles.truckListHeader}>
                  <div style={styles.truckIdentity}>
                    <span style={styles.truckId}>{t.id}</span>
                    <span style={styles.truckPlate}>{t.plate}</span>
                  </div>
                  <div style={{
                    ...styles.statusBadge,
                    backgroundColor: t.status === 'atrasado' ? '#FEE2E2' : t.status === 'concluido' ? '#D1FAE5' : '#DBEAFE',
                    color: t.status === 'atrasado' ? '#B91C1C' : t.status === 'concluido' ? '#047857' : '#1D4ED8'
                  }}>
                    {t.status === 'atrasado' ? 'Alerta' : t.status === 'concluido' ? 'Concluído' : 'Em Rota'}
                  </div>
                </div>
                
                <div style={styles.truckListMeta}>
                  <div><strong>Motorista:</strong> {t.driver}</div>
                  <div><strong>Rota:</strong> {t.route}</div>
                </div>

                {t.alert && (
                  <div style={styles.truckItemAlert}>
                    <AlertTriangle size={14} /> {t.alert}
                  </div>
                )}

                <div style={styles.progressSection}>
                  <div style={styles.progressMeta}>
                    <span>Progresso: {t.progress}%</span>
                    <span>{t.speed}</span>
                  </div>
                  <div style={styles.progressBarWrapper}>
                    <div style={{ ...styles.progressBar, width: `${t.progress}%`, backgroundColor: t.status === 'atrasado' ? '#EF4444' : '#0061FF' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETALHES DO VEÍCULO SELECIONADO */}
      {selectedTruck && (
        <div style={styles.detailsDrawer}>
          <div style={styles.drawerHeader}>
            <h3 style={styles.drawerTitle}>Detalhes: {selectedTruck.id}</h3>
            <button style={styles.closeDrawerBtn} onClick={() => setSelectedTruck(null)}>×</button>
          </div>
          <div style={styles.drawerBody}>
            <div style={styles.drawerInfoRow}>
              <strong>Placa:</strong> <span>{selectedTruck.plate}</span>
            </div>
            <div style={styles.drawerInfoRow}>
              <strong>Motorista:</strong> <span>{selectedTruck.driver}</span>
            </div>
            <div style={styles.drawerInfoRow}>
              <strong>Tipo de Veículo:</strong> <span>{selectedTruck.type}</span>
            </div>
            <div style={styles.drawerInfoRow}>
              <strong>Progresso da Rota:</strong> <span>{selectedTruck.progress}%</span>
            </div>
            <div style={styles.drawerInfoRow}>
              <strong>Status:</strong> <span style={{ color: selectedTruck.status === 'atrasado' ? '#EF4444' : '#0061FF', fontWeight: 'bold' }}>{selectedTruck.status.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px', height: '100%', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748B', marginTop: '6px' },
  headerActions: { display: 'flex', gap: '16px' },
  alertBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', backgroundColor: '#EF4444', color: '#FFF', fontSize: '14px', fontWeight: '800', cursor: 'pointer', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  statCard: { padding: '24px', backgroundColor: '#FFF', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' },
  statHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  statLabel: { fontSize: '13px', fontWeight: '700', color: '#64748B' },
  statValue: { fontSize: '32px', fontWeight: '900', color: '#1E1E1E' },
  mapWorkspace: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', height: '580px', flex: 1 },
  mapArea: { display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#F8FAFC', borderRadius: '24px', border: '1px solid #F1F5F9', padding: '24px', position: 'relative', overflow: 'hidden' },
  mapControls: { display: 'flex', gap: '12px', zIndex: 10 },
  mapControlBtn: { padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', border: '1px solid #E2E8F0', cursor: 'pointer', outline: 'none' },
  simulatedMap: { flex: 1, backgroundColor: '#E2E8F0', borderRadius: '16px', position: 'relative', overflow: 'hidden', border: '1px solid #CBD5E1' },
  mapGridBackground: { width: '100%', height: '100%', backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)', backgroundSize: '24px 24px', position: 'relative' },
  mapMarker: { position: 'absolute', padding: '8px', backgroundColor: '#FFF', borderRadius: '12px', border: '2px solid', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', transform: 'translate(-50%, -50%)', zIndex: 20 },
  markerLabel: { fontSize: '10px', fontWeight: '900', color: '#1E1E1E' },
  mapWatermark: { position: 'absolute', bottom: '16px', left: '16px', fontSize: '10px', fontWeight: 'bold', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' },
  truckList: { backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F5F9', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflow: 'hidden' },
  listTitle: { fontSize: '18px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  listScroll: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
  truckListItem: { padding: '16px', borderRadius: '16px', border: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' },
  truckListHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  truckIdentity: { display: 'flex', flexDirection: 'column' },
  truckId: { fontSize: '15px', fontWeight: '900', color: '#1E1E1E' },
  truckPlate: { fontSize: '12px', fontWeight: '600', color: '#94A3B8' },
  statusBadge: { padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' },
  truckListMeta: { fontSize: '12px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '2px' },
  truckItemAlert: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', backgroundColor: '#FEE2E2', color: '#B91C1C', fontSize: '11px', fontWeight: '700', borderRadius: '8px' },
  progressSection: { display: 'flex', flexDirection: 'column', gap: '6px' },
  progressMeta: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#64748B' },
  progressBarWrapper: { width: '100%', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: '3px', transition: 'width 0.4s' },
  detailsDrawer: { position: 'fixed', top: '12%', right: '2%', width: '320px', backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 1000 },
  drawerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' },
  drawerTitle: { fontSize: '16px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  closeDrawerBtn: { background: 'none', border: 'none', fontSize: '20px', color: '#94A3B8', cursor: 'pointer' },
  drawerBody: { display: 'flex', flexDirection: 'column', gap: '12px' },
  drawerInfoRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px' }
};

export default ControlTowerPage;
