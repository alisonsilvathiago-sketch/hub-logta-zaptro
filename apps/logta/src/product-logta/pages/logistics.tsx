import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Layers3, 
  Mail, 
  Map, 
  Phone, 
  Satellite, 
  Search, 
  SlidersHorizontal, 
  Truck, 
  Zap, 
  ShieldCheck, 
  Navigation2,
  Box,
  MoreVertical
} from 'lucide-react';
import LogtaPageView from '../../components/LogtaPageView';
import { supabase } from '../../lib/supabase';

type LoadStatus = 'upcoming' | 'in-transit' | 'delivered' | 'pending' | 'confirmado' | 'reagendado';
type LoadFilter = 'all' | LoadStatus;

type RoutePoint = {
  id: string;
  label: string;
  x: number;
  y: number;
};

type LoadItem = {
  id: string;
  customer: string;
  status: LoadStatus;
  carrier: string;
  origin: string;
  destination: string;
  pickupAt: string;
  sortingAt: string;
  deliveredAt: string;
  routeLine: string;
  points: RoutePoint[];
};

const LOADS: LoadItem[] = [
  {
    id: 'ORD-1001',
    customer: 'David Martinez',
    status: 'in-transit',
    carrier: 'Southwest Logistics',
    origin: 'Houston, Texas Centre',
    destination: 'Chicago, Illinois Hub',
    pickupAt: '29.04.2026 at 10:00 AM',
    sortingAt: '29.04.2026 at 01:40 PM',
    deliveredAt: 'Estimated 30.04.2026',
    routeLine: 'M130 280 C230 160, 290 330, 410 210',
    points: [
      { id: 'a-1', label: 'Houston, TX', x: 24, y: 32 },
      { id: 'a-2', label: 'In Transit - Austin', x: 53, y: 51 },
      { id: 'a-3', label: 'Chicago, IL', x: 79, y: 63 },
    ],
  },
  {
    id: 'ORD-1002',
    customer: 'Jessica Turner',
    status: 'delivered',
    carrier: 'Freightliner Express',
    origin: 'Dallas, TX Distribution',
    destination: 'Little Rock, AR Facility',
    pickupAt: '28.04.2026 at 09:40 AM',
    sortingAt: '28.04.2026 at 11:05 AM',
    deliveredAt: '28.04.2026 at 16:15 PM',
    routeLine: 'M130 260 C200 160, 300 250, 450 230',
    points: [
      { id: 'b-1', label: 'Dallas, TX', x: 19, y: 31 },
      { id: 'b-2', label: 'Memphis Checkpoint', x: 46, y: 44 },
      { id: 'b-3', label: 'Little Rock, AR', x: 71, y: 58 },
    ],
  },
];

const TAB_ALIAS: Record<string, LoadFilter> = {
  dashboard: 'all',
  'all-loads': 'all',
  'in-transit': 'in-transit',
  delivered: 'delivered',
  upcoming: 'upcoming',
  rotas: 'all',
  entregas: 'in-transit',
};

const statusLabel: Record<string, string> = {
  upcoming: 'Upcoming',
  'in-transit': 'In-transit',
  delivered: 'Delivered',
  pending: 'Pending',
  confirmado: 'Confirmed',
  reagendado: 'Rescheduled',
};

const Logistics: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();
  const [search, setSearch] = useState('');
  const [dbLoads, setDbLoads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>(LOADS[0].id);

  const currentFilter = TAB_ALIAS[tab || 'dashboard'] ?? 'all';

  useEffect(() => {
    async function fetchLoads() {
      try {
        const { data, error } = await supabase
          .from('delivery_actions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (data) {
          setDbLoads(data);
        }
      } catch (err) {
        console.error('Error fetching loads:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLoads();
  }, []);

  const allLoads = useMemo(() => {
    const dbMapped = dbLoads.map(db => ({
      id: db.order_id,
      customer: `Client ${db.token}`,
      status: db.status as LoadStatus,
      carrier: 'Auto-assigned',
      origin: 'System Origin',
      destination: 'System Dest',
      pickupAt: new Date(db.created_at).toLocaleString(),
      sortingAt: 'Pending',
      deliveredAt: db.responded_at ? new Date(db.responded_at).toLocaleString() : 'Pending',
      routeLine: 'M120 300 C220 240, 300 300, 420 270',
      points: [
        { id: `${db.id}-1`, label: 'Origin', x: 23, y: 66 },
        { id: `${db.id}-3`, label: 'Destination', x: 76, y: 52 },
      ],
    }));
    return [...LOADS, ...dbMapped];
  }, [dbLoads]);

  const filteredLoads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allLoads.filter((load) => {
      if (currentFilter !== 'all' && load.status !== currentFilter) return false;
      if (!q) return true;
      return `${load.id} ${load.customer} ${load.origin} ${load.destination}`.toLowerCase().includes(q);
    });
  }, [allLoads, currentFilter, search]);

  useEffect(() => {
    if (filteredLoads.length === 0) return;
    if (!filteredLoads.some((item) => item.id === selectedId)) {
      setSelectedId(filteredLoads[0].id);
    }
  }, [filteredLoads, selectedId]);

  const selectedLoad = filteredLoads.find((load) => load.id === selectedId) || filteredLoads[0] || allLoads[0];

  const counts = useMemo(
    () => ({
      all: allLoads.length,
      'in-transit': allLoads.filter((item) => item.status === 'in-transit').length,
      delivered: allLoads.filter((item) => item.status === 'delivered').length,
      upcoming: allLoads.filter((item) => item.status === 'upcoming').length,
    }),
    [allLoads],
  );

  const setFilter = (filter: LoadFilter) => {
    navigate(`/logistica/${filter === 'all' ? 'dashboard' : filter}`);
  };

  return (
    <LogtaPageView>
      <div className="logta-loads-shell animate-fade-in" style={{ 
        border: 'none', 
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'row',
        gap: '20px',
        padding: '0 2px'
      }}>
        {/* Sidebar Panel */}
        <section className="logta-loads-list-panel glass-card" style={{ 
          width: '400px', 
          flexShrink: 0, 
          borderRadius: '24px',
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 160px)',
          position: 'sticky',
          top: '0'
        }}>
          <div className="logta-loads-title-wrap" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#10b981', 
                boxShadow: '0 0 10px #10b981',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Tracking</span>
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-0.04em' }}>Logita Center</h2>
          </div>

          <div className="logta-loads-search" style={{ 
            backgroundColor: '#f8f7ff', 
            borderRadius: '16px', 
            padding: '4px 16px',
            marginBottom: '16px',
            border: '1px solid var(--border)'
          }}>
            <Search size={18} color="var(--primary)" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ID, client, route..."
              aria-label="Search loads"
              style={{ border: 'none', background: 'transparent', padding: '12px 8px', fontSize: '14px', fontWeight: '500' }}
            />
          </div>

          <div className="logta-loads-filter-row" style={{ 
            display: 'flex', 
            gap: '8px', 
            overflowX: 'auto', 
            paddingBottom: '8px',
            marginBottom: '16px'
          }}>
            <button 
              type="button" 
              className={currentFilter === 'all' ? 'is-active' : ''} 
              onClick={() => setFilter('all')}
              style={{ padding: '8px 16px', borderRadius: '12px', whiteSpace: 'nowrap' }}
            >
              All <span>{counts.all}</span>
            </button>
            <button
              type="button"
              className={currentFilter === 'in-transit' ? 'is-active' : ''}
              onClick={() => setFilter('in-transit')}
              style={{ padding: '8px 16px', borderRadius: '12px', whiteSpace: 'nowrap' }}
            >
              Transit <span>{counts['in-transit']}</span>
            </button>
            <button 
              type="button" 
              className={currentFilter === 'delivered' ? 'is-active' : ''} 
              onClick={() => setFilter('delivered')}
              style={{ padding: '8px 16px', borderRadius: '12px', whiteSpace: 'nowrap' }}
            >
              Done <span>{counts.delivered}</span>
            </button>
          </div>

          <div className="logta-loads-list" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredLoads.map((load) => (
              <div
                key={load.id}
                role="button"
                tabIndex={0}
                className={`logta-load-item ${selectedLoad.id === load.id ? 'is-selected' : ''}`}
                onClick={() => setSelectedId(load.id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedId(load.id)}
                style={{ 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease',
                  padding: '16px',
                  borderRadius: '20px',
                  border: selectedLoad.id === load.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: selectedLoad.id === load.id ? 'var(--primary-light)' : '#fff',
                  boxShadow: selectedLoad.id === load.id ? 'var(--shadow-md)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>ORDER ID</span>
                    <strong style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.02em' }}>{load.id}</strong>
                  </div>
                  <span className={`logta-load-status is-${load.status}`} style={{ fontSize: '10px', padding: '4px 12px' }}>
                    {statusLabel[load.status] || load.status}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <img
                    alt={load.customer}
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(load.customer)}&background=8b5cf6&color=fff&bold=true`}
                    style={{ width: '36px', height: '36px', borderRadius: '12px' }}
                  />
                  <div>
                    <strong style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{load.customer}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <Box size={10} />
                      <span>{load.carrier}</span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                     <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)' }}>ORIGIN</span>
                     <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-main)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{load.origin}</span>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center' }}>
                     <Navigation2 size={12} color="var(--primary)" style={{ transform: 'rotate(90deg)' }} />
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                     <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)' }}>DESTINATION</span>
                     <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-main)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{load.destination}</span>
                   </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="btn-primary" style={{ marginTop: '20px', width: '100%', padding: '16px' }}>
            <Zap size={18} />
            Dispatch New Order
          </button>
        </section>

        {/* Map and Detail Panel */}
        <section className="logta-loads-map-panel" style={{ 
          flex: 1, 
          borderRadius: '24px', 
          backgroundColor: '#f1f5f9',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 160px)',
          border: '1px solid var(--border)'
        }}>
          {/* Map Controls */}
          <div className="logta-load-map-toolbar" style={{ top: '24px', right: '24px' }}>
            <button type="button" className="is-active" style={{ boxShadow: 'var(--shadow-md)' }}>
              <Navigation2 size={14} /> Tracking
            </button>
            <button type="button" style={{ boxShadow: 'var(--shadow-md)' }}>
              <Satellite size={14} /> Satellite
            </button>
            <button type="button" style={{ boxShadow: 'var(--shadow-md)' }}>
              <ShieldCheck size={14} /> Security
            </button>
          </div>

          {/* Floating Detail Card */}
          <aside className="logta-load-detail-card glass-card" style={{ 
            top: '24px', 
            left: '24px', 
            width: '350px',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>CURRENT SHIPMENT</span>
                <h3 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>{selectedLoad.id}</h3>
              </div>
              <button style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)' }}>
                <MoreVertical size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button style={{ flex: 1, padding: '8px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', backgroundColor: 'var(--primary)', color: '#fff', border: 'none' }}>History</button>
              <button style={{ flex: 1, padding: '8px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', backgroundColor: '#f1f5f9', color: 'var(--text-main)', border: 'none' }}>Documents</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--primary)', border: '3px solid #fff', boxShadow: '0 0 0 1px var(--primary)', zIndex: 2 }} />
                  <div style={{ flex: 1, width: '2px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                </div>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block' }}>Departure</strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0' }}>{selectedLoad.origin}</p>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary)' }}>{selectedLoad.pickupAt}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: selectedLoad.status === 'delivered' ? 'var(--primary)' : '#cbd5e1', border: '3px solid #fff', boxShadow: `0 0 0 1px ${selectedLoad.status === 'delivered' ? 'var(--primary)' : '#cbd5e1'}`, zIndex: 2 }} />
                  <div style={{ flex: 1, width: '2px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                </div>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block' }}>Sorting Facility</strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0' }}>Central Logistics Hub</p>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{selectedLoad.sortingAt}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: selectedLoad.status === 'delivered' ? '#10b981' : '#cbd5e1', border: '3px solid #fff', boxShadow: `0 0 0 1px ${selectedLoad.status === 'delivered' ? '#10b981' : '#cbd5e1'}`, zIndex: 2 }} />
                </div>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block' }}>Delivery Target</strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0' }}>{selectedLoad.destination}</p>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: selectedLoad.status === 'delivered' ? '#10b981' : 'var(--text-muted)' }}>{selectedLoad.deliveredAt}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>DRIVER CONTACT</span>
                <Phone size={14} color="var(--primary)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Truck size={16} color="var(--text-secondary)" />
                 </div>
                 <strong style={{ fontSize: '13px' }}>Ricardo Silva</strong>
              </div>
            </div>
          </aside>

          {/* Map Surface */}
          <div className="logta-load-map-surface" style={{ flex: 1, backgroundColor: '#e2e8f0', background: 'radial-gradient(circle, #f8fafc 0%, #e2e8f0 100%)' }}>
            <svg viewBox="0 0 520 360" preserveAspectRatio="none" style={{ filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.2))' }}>
              <path 
                d={selectedLoad.routeLine} 
                stroke="var(--primary)" 
                strokeWidth="4" 
                strokeDasharray="8 4"
                fill="none"
              />
            </svg>
            {selectedLoad.points.map((point) => (
              <div key={point.id} className="logta-route-point" style={{ left: `${point.x}%`, top: `${point.y}%` }}>
                <div style={{ 
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    color: '#fff', 
                    padding: '4px 8px', 
                    borderRadius: '6px', 
                    fontSize: '10px', 
                    whiteSpace: 'nowrap',
                    marginBottom: '4px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    {point.label}
                  </div>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--primary)', 
                    border: '2px solid #fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(139, 92, 246, 0.4)'
                  }}>
                    <Truck size={12} color="#fff" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>
    </LogtaPageView>
  );
};

export default Logistics;