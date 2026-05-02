import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Calendar, Clock, ChevronRight, Filter, Search, Plus } from 'lucide-react';
import { supabase } from '@shared/lib/supabase';
import { toast } from 'react-hot-toast';

interface Delivery {
  id: string;
  order_number: string;
  origin: string;
  destination: string;
  status: string;
  delivery_date: string;
  client_name?: string;
}

const DeliveriesPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = async () => {
    try {
      // Simulação enquanto as tabelas novas não são migradas no Supabase real
      const mockDeliveries: Delivery[] = [
        { id: '1', order_number: 'ENT-882', origin: 'São Paulo, SP', destination: 'Rio de Janeiro, RJ', status: 'EM_TRANSITO', delivery_date: '2026-05-01' },
        { id: '2', order_number: 'ENT-883', origin: 'Curitiba, PR', destination: 'Joinville, SC', status: 'PENDENTE', delivery_date: '2026-05-02' },
        { id: '3', order_number: 'ENT-881', origin: 'Belo Horizonte, MG', destination: 'Vitória, ES', status: 'ENTREGUE', delivery_date: '2026-04-30' },
      ];
      setDeliveries(mockDeliveries);
    } catch (error) {
      toast.error('Erro ao carregar entregas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ENTREGUE': return { backgroundColor: '#DCFCE7', color: '#166534' };
      case 'EM_TRANSITO': return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
      default: return { backgroundColor: '#FEF3C7', color: '#92400E' };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Monitoramento de Entregas</h2>
        <button style={styles.addBtn} onClick={() => toast.success('Módulo de nova entrega em breve')}>
          <Plus size={18} /> Nova Entrega
        </button>
      </div>

      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <input type="text" placeholder="Buscar por pedido ou destino..." style={styles.searchInput} />
        </div>
        <button style={styles.filterBtn}><Filter size={18} /> Filtros</button>
      </div>

      <div style={styles.deliveryGrid}>
        {deliveries.map(delivery => (
          <div key={delivery.id} style={styles.deliveryCard}>
            <div style={styles.cardHeader}>
              <div style={styles.orderBadge}>{delivery.order_number}</div>
              <div style={{ ...styles.statusBadge, ...getStatusStyle(delivery.status) }}>
                {delivery.status.replace('_', ' ')}
              </div>
            </div>
            
            <div style={styles.routeBox}>
              <div style={styles.routePoint}>
                <div style={styles.dotOrigin} />
                <span>{delivery.origin}</span>
              </div>
              <div style={styles.routeLine} />
              <div style={styles.routePoint}>
                <MapPin size={14} color="#EF4444" />
                <span>{delivery.destination}</span>
              </div>
            </div>

            <div style={styles.cardFooter}>
              <div style={styles.footerInfo}>
                <Calendar size={14} />
                <span>{new Date(delivery.delivery_date).toLocaleDateString()}</span>
              </div>
              <div style={styles.footerInfo}>
                <Clock size={14} />
                <span>Previsão: 16:00</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E', margin: 0, letterSpacing: '-0.5px' },
  addBtn: { backgroundColor: '#0061FF', color: '#FFF', border: 'none', borderRadius: '16px', padding: '14px 24px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(0,97,255,0.2)' },
  filterBar: { display: 'flex', gap: '20px' },
  searchBox: { flex: 1, backgroundColor: '#FFF', borderRadius: '20px', border: '1px solid #F1F5F9', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' },
  searchInput: { border: 'none', background: 'none', outline: 'none', padding: '16px 0', fontSize: '15px', fontWeight: '600', width: '100%', color: '#1E1E1E' },
  filterBtn: { backgroundColor: '#FFF', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '14px 24px', fontSize: '14px', fontWeight: '800', color: '#64748B', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  deliveryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '32px' },
  deliveryCard: { backgroundColor: '#FFF', borderRadius: '32px', padding: '32px', border: '1px solid #F1F5F9', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', transition: 'transform 0.2s ease' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' },
  orderBadge: { fontSize: '11px', fontWeight: '900', color: '#0061FF', backgroundColor: '#F0F7FF', padding: '6px 12px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statusBadge: { fontSize: '10px', fontWeight: '900', padding: '6px 12px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  routeBox: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' },
  routePoint: { display: 'flex', alignItems: 'center', gap: '16px', fontSize: '15px', fontWeight: '800', color: '#1E1E1E' },
  dotOrigin: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0061FF', boxShadow: '0 0 0 4px #F0F7FF' },
  routeLine: { width: '2px', height: '20px', backgroundColor: '#F1F5F9', marginLeft: '4px' },
  cardFooter: { display: 'flex', gap: '24px', borderTop: '1px solid #F8FAFC', paddingTop: '28px' },
  footerInfo: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '700', color: '#94A3B8' },
};

export default DeliveriesPage;
