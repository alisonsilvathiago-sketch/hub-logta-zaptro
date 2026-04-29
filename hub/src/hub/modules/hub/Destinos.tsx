import React from 'react';
import { MapPin, ArrowRight, Box, Navigation } from 'lucide-react';

const Destinos: React.FC = () => {
  const destinos = [
    { id: 1, name: 'Sede Central - SP', status: 'Ativo', shipments: 45, efficiency: '98%' },
    { id: 2, name: 'Filial Sul - RS', status: 'Ativo', shipments: 22, efficiency: '95%' },
    { id: 3, name: 'Centro de Distribuição - RJ', status: 'Em Manutenção', shipments: 0, efficiency: '0%' },
    { id: 4, name: 'Hub Nordeste - PE', status: 'Ativo', shipments: 18, efficiency: '92%' },
  ];

  return (
    <div style={styles.container} className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 className="h1-style" style={{ margin: 0 }}>Destinos de Operação</h1>
          <p className="text-subtitle">Gerenciamento de pontos de entrega e centros de distribuição</p>
        </div>
        <button style={styles.addBtn}>Novo Destino +</button>
      </header>

      <div style={styles.grid}>
        {destinos.map(destino => (
          <div key={destino.id} style={styles.card}>
            <div style={styles.cardIcon}>
              <MapPin size={24} color="#6366F1" />
            </div>
            <div style={styles.cardInfo}>
              <h3 style={styles.cardTitle}>{destino.name}</h3>
              <div style={styles.stats}>
                <div style={styles.stat}>
                  <Box size={14} />
                  <span>{destino.shipments} Envios</span>
                </div>
                <div style={styles.stat}>
                  <Navigation size={14} />
                  <span>{destino.efficiency} Eficiência</span>
                </div>
              </div>
            </div>
            <div style={{
              ...styles.status,
              background: destino.status === 'Ativo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              color: destino.status === 'Ativo' ? '#10b981' : '#f43f5e'
            }}>
              {destino.status}
            </div>
            <button style={styles.goBtn}>
              <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  title: { fontSize: '26px', fontWeight: '600', color: 'var(--text-title)', margin: 0, letterSpacing: '-0.5px' },
  subtitle: { color: 'var(--text-subtitle)', fontSize: '14px', fontWeight: '400', margin: '4px 0 0 0' },
  addBtn: { padding: '12px 24px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.2)', letterSpacing: '-0.3px' },
  grid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { background: '#fff', padding: '24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'all 0.2s' },
  cardIcon: { width: '56px', height: '56px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: '16px', fontWeight: '600', color: 'var(--text-title)', margin: '0 0 8px 0', letterSpacing: '-0.2px' },
  stats: { display: 'flex', gap: '20px' },
  stat: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-subtitle)', fontWeight: '500' },
  status: { padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' },
  goBtn: { width: '44px', height: '44px', borderRadius: '14px', border: '1px solid #f1f5f9', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }
};

export default Destinos;
