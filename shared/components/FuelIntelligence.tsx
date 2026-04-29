import React from 'react';
import { Fuel, TrendingUp, TrendingDown, ChevronRight, MapPin, Zap } from 'lucide-react';

interface FuelData {
  id: string;
  type: string;
  price: number;
  variation_percentage: number;
  last_updated: string;
  breakdown?: {
    refinery: number;
    taxes_state: number;
    taxes_federal: number;
    distribution: number;
    bio_share: number;
  };
}

export const FuelPump: React.FC<{ data: FuelData }> = ({ data }) => {
  const breakdown = data.breakdown || {
    refinery: 35.5,
    taxes_state: 24.2,
    taxes_federal: 11.3,
    distribution: 16.0,
    bio_share: 13.0
  };

  const getFuelColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'gasolina': return '#6366F1';
      case 'diesel': return '#EF4444';
      case 'etanol': return '#10B981';
      default: return '#94A3B8';
    }
  };

  const color = getFuelColor(data.type);

  return (
    <div style={styles.pumpContainer}>
      <div style={styles.pumpHeader}>
        <div style={{ ...styles.pumpTypeBadge, backgroundColor: color }}>
          {data.type.toUpperCase()}
        </div>
        <div style={styles.pumpPrice}>
          <span style={styles.currency}>R$</span>
          <span style={styles.value}>{Number(data.price).toFixed(2)}</span>
        </div>
      </div>

      <div style={styles.pumpBody}>
        {/* Camadas da Bomba (Estilo Petrobras) */}
        <div style={styles.breakdownLabel}>Composição do Preço</div>
        <div style={styles.pumpSegments}>
          <div style={{ ...styles.segment, height: `${breakdown.refinery}%`, backgroundColor: color, opacity: 1 }}>
            <span style={styles.segmentText}>Refinaria ({breakdown.refinery}%)</span>
          </div>
          <div style={{ ...styles.segment, height: `${breakdown.taxes_state}%`, backgroundColor: color, opacity: 0.8 }}>
            <span style={styles.segmentText}>ICMS Est. ({breakdown.taxes_state}%)</span>
          </div>
          <div style={{ ...styles.segment, height: `${breakdown.taxes_federal}%`, backgroundColor: color, opacity: 0.6 }}>
            <span style={styles.segmentText}>Imp. Federais ({breakdown.taxes_federal}%)</span>
          </div>
          <div style={{ ...styles.segment, height: `${breakdown.distribution}%`, backgroundColor: color, opacity: 0.4 }}>
            <span style={styles.segmentText}>Distribuição ({breakdown.distribution}%)</span>
          </div>
          <div style={{ ...styles.segment, height: `${breakdown.bio_share}%`, backgroundColor: color, opacity: 0.2 }}>
            <span style={styles.segmentText}>Biocombustível ({breakdown.bio_share}%)</span>
          </div>
        </div>
      </div>

      <div style={styles.pumpFooter}>
        <div style={{ ...styles.variation, color: data.variation_percentage > 0 ? '#EF4444' : '#10B981' }}>
          {data.variation_percentage > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(data.variation_percentage).toFixed(1)}% variação diária
        </div>
        <div style={styles.updateInfo}>
          Atualizado hoje às {new Date(data.last_updated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export const FuelDashboardCard: React.FC<{ prices: FuelData[]; onClick?: () => void }> = ({ prices, onClick }) => {
  const gas = prices.find(p => p.type.toLowerCase().includes('gasolina'));
  const diesel = prices.find(p => p.type.toLowerCase().includes('diesel'));
  
  const handleCardClick = () => {
    if (onClick) onClick();
    else window.open('http://localhost:5175/fuel', '_blank');
  };

  return (
    <div style={styles.card} onClick={handleCardClick}>
      <div style={styles.cardHeader}>
        <div style={styles.cardIconBox}><Fuel size={18} color="#6366F1" /></div>
        <div style={styles.cardTitle}>Combustível Hoje</div>
        <ChevronRight size={16} color="#94A3B8" style={{ marginLeft: 'auto' }} />
      </div>

      <div style={styles.cardGrid}>
        <div style={styles.cardItem}>
          <div style={styles.cardItemLabel}>Gasolina (BR)</div>
          <div style={styles.cardItemValue}>
            R$ {gas ? Number(gas.price).toFixed(2) : '---'}
            <span style={{ ...styles.cardTrend, color: (gas?.variation_percentage || 0) > 0 ? '#EF4444' : '#10B981' }}>
              {(gas?.variation_percentage || 0) > 0 ? '↑' : '↓'}
              {Math.abs(gas?.variation_percentage || 0).toFixed(1)}%
            </span>
          </div>
        </div>
        <div style={styles.cardItem}>
          <div style={styles.cardItemLabel}>Diesel S10</div>
          <div style={styles.cardItemValue}>
            R$ {diesel ? Number(diesel.price).toFixed(2) : '---'}
            <span style={{ ...styles.cardTrend, color: (diesel?.variation_percentage || 0) > 0 ? '#EF4444' : '#10B981' }}>
              {(diesel?.variation_percentage || 0) > 0 ? '↑' : '↓'}
              {Math.abs(diesel?.variation_percentage || 0).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div style={styles.cardFooter}>
        <MapPin size={10} /> Média Nacional Consolidada
      </div>
    </div>
  );
};

const styles = {
  // Pump Styles
  pumpContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '24px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    minWidth: '280px'
  },
  pumpHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pumpTypeBadge: {
    padding: '6px 12px',
    borderRadius: '10px',
    color: '#FFF',
    fontSize: '11px',
    fontWeight: '900',
    letterSpacing: '1px'
  },
  pumpPrice: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px'
  },
  currency: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#94A3B8'
  },
  value: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: '-1px'
  },
  pumpBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  breakdownLabel: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  },
  pumpSegments: {
    height: '240px',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    border: '1px solid #F1F5F9'
  },
  segment: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '12px',
    transition: 'all 0.3s ease'
  },
  segmentText: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#FFF',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
  },
  pumpFooter: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },
  variation: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '700'
  },
  updateInfo: {
    fontSize: '10px',
    color: '#94A3B8',
    fontWeight: '500'
  },

  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #E5E7EB',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  cardIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#F5F3FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#1F2937'
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  cardItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },
  cardItemLabel: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase' as const
  },
  cardItemValue: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#1F2937',
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px'
  },
  cardTrend: {
    fontSize: '10px',
    fontWeight: '700'
  },
  cardFooter: {
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #F3F4F6',
    fontSize: '10px',
    color: '#94A3B8',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: '600'
  }
};
