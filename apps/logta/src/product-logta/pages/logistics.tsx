import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layers3, Mail, Map, Phone, Satellite, Search, SlidersHorizontal, Truck } from 'lucide-react';
import LogtaPageView from '../../components/LogtaPageView';

type LoadStatus = 'upcoming' | 'in-transit' | 'delivered';
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
    id: '#4123910',
    customer: 'David Martinez',
    status: 'in-transit',
    carrier: 'Southwest',
    origin: '456 Oak Avenue, Houston, Texas, USA',
    destination: '789 Pine Street, Chicago, Illinois, USA',
    pickupAt: '15.08.2024 at 10:00 PM',
    sortingAt: '18.08.2024 at 01:40 AM',
    deliveredAt: '21.08.2024 at 20:00 AM',
    routeLine: 'M130 280 C230 160, 290 330, 410 210',
    points: [
      { id: 'a-1', label: '456 Oak Avenue, Houston, Texas, USA', x: 24, y: 32 },
      { id: 'a-2', label: 'Route checkpoint', x: 53, y: 51 },
      { id: 'a-3', label: '789 Pine Street, Chicago, Illinois, USA', x: 79, y: 63 },
    ],
  },
  {
    id: '#3568129',
    customer: 'Jessica Turner',
    status: 'delivered',
    carrier: 'Freightliner',
    origin: '123 Main Street, Dallas, TX 75201',
    destination: '789 Central Ave, Little Rock, AR 72201',
    pickupAt: '14.08.2024 at 09:40 PM',
    sortingAt: '16.08.2024 at 11:05 AM',
    deliveredAt: '20.08.2024 at 16:15 PM',
    routeLine: 'M130 260 C200 160, 300 250, 450 230',
    points: [
      { id: 'b-1', label: '123 Main Street, Dallas, TX', x: 19, y: 31 },
      { id: 'b-2', label: 'Route checkpoint', x: 46, y: 44 },
      { id: 'b-3', label: '789 Central Ave, Little Rock, AR', x: 71, y: 58 },
    ],
  },
  {
    id: '#1248075',
    customer: 'Ashley Roberts',
    status: 'upcoming',
    carrier: 'UPS',
    origin: 'Houston, TX',
    destination: 'Chicago, IL',
    pickupAt: 'Scheduled for 23.08.2024',
    sortingAt: 'Pending',
    deliveredAt: 'Pending',
    routeLine: 'M120 300 C220 240, 300 300, 420 270',
    points: [
      { id: 'c-1', label: 'Pickup pending', x: 23, y: 66 },
      { id: 'c-2', label: 'Planned route', x: 53, y: 61 },
      { id: 'c-3', label: 'Delivery target', x: 76, y: 52 },
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

const ROUTE_BY_FILTER: Record<LoadFilter, string> = {
  all: 'dashboard',
  'in-transit': 'in-transit',
  delivered: 'delivered',
  upcoming: 'upcoming',
};

const statusLabel: Record<LoadStatus, string> = {
  upcoming: 'Upcoming',
  'in-transit': 'In-transit',
  delivered: 'Delivered',
};

const Logistics: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(LOADS[0].id);

  const currentFilter = TAB_ALIAS[tab || 'dashboard'] ?? 'all';

  const filteredLoads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return LOADS.filter((load) => {
      if (currentFilter !== 'all' && load.status !== currentFilter) return false;
      if (!q) return true;
      return `${load.id} ${load.customer} ${load.origin} ${load.destination}`.toLowerCase().includes(q);
    });
  }, [currentFilter, search]);

  useEffect(() => {
    if (filteredLoads.length === 0) return;
    if (!filteredLoads.some((item) => item.id === selectedId)) {
      setSelectedId(filteredLoads[0].id);
    }
  }, [filteredLoads, selectedId]);

  const selectedLoad = filteredLoads.find((load) => load.id === selectedId) || filteredLoads[0] || LOADS[0];

  const counts = useMemo(
    () => ({
      all: LOADS.length,
      'in-transit': LOADS.filter((item) => item.status === 'in-transit').length,
      delivered: LOADS.filter((item) => item.status === 'delivered').length,
      upcoming: LOADS.filter((item) => item.status === 'upcoming').length,
    }),
    [],
  );

  const setFilter = (filter: LoadFilter) => {
    navigate(`/logistica/${ROUTE_BY_FILTER[filter]}`);
  };

  return (
    <LogtaPageView>
      <div className="logta-loads-shell animate-fade-in">
        <section className="logta-loads-list-panel">
          <div className="logta-loads-title-wrap">
            <h2>Tracking loads</h2>
          </div>

          <div className="logta-loads-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              aria-label="Search loads"
            />
          </div>

          <div className="logta-loads-filter-row">
            <button type="button" className={currentFilter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>
              All Loads
              <span>{counts.all}</span>
            </button>
            <button
              type="button"
              className={currentFilter === 'in-transit' ? 'is-active' : ''}
              onClick={() => setFilter('in-transit')}
            >
              In-transit
              <span>{counts['in-transit']}</span>
            </button>
            <button type="button" className={currentFilter === 'delivered' ? 'is-active' : ''} onClick={() => setFilter('delivered')}>
              Delivered
              <span>{counts.delivered}</span>
            </button>
            <button type="button" className={currentFilter === 'upcoming' ? 'is-active' : ''} onClick={() => setFilter('upcoming')}>
              Upcoming
              <span>{counts.upcoming}</span>
            </button>
            <button type="button" className="logta-filter-icon">
              <SlidersHorizontal size={14} />
            </button>
          </div>

          <div className="logta-loads-list">
            {filteredLoads.map((load) => (
              <button
                key={load.id}
                type="button"
                className={`logta-load-item ${selectedLoad.id === load.id ? 'is-selected' : ''}`}
                onClick={() => setSelectedId(load.id)}
              >
                <div className="logta-load-item-row">
                  <strong>{load.id}</strong>
                  <span className={`logta-load-status is-${load.status}`}>{statusLabel[load.status]}</span>
                </div>
                <div className="logta-load-item-route">
                  <span>{load.origin}</span>
                  <span>{load.destination}</span>
                </div>
                <div className="logta-load-item-user">
                  <img
                    alt={load.customer}
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(load.customer)}&background=1e1b4b&color=fff`}
                  />
                  <div>
                    <strong>{load.customer}</strong>
                    <small>Customer</small>
                  </div>
                  <div className="logta-load-actions">
                    <Mail size={13} />
                    <Phone size={13} />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button type="button" className="logta-primary-dark-btn">
            + Add load
          </button>
        </section>

        <section className="logta-loads-map-panel">
          <div className="logta-load-map-toolbar">
            <button type="button" className="is-active">
              <Map size={14} />
              Map
            </button>
            <button type="button">
              <Satellite size={14} />
              Satellite
            </button>
            <button type="button">
              <Layers3 size={14} />
              Layers
            </button>
          </div>

          <aside className="logta-load-detail-card">
            <div className="logta-load-detail-top">
              <strong>No: {selectedLoad.id}</strong>
            </div>
            <div className="logta-load-detail-tabs">
              <button type="button">Load info</button>
              <button type="button" className="is-active">
                Tracking
              </button>
              <button type="button">Docs</button>
            </div>
            <ul>
              <li>
                <span className="dot" />
                <div>
                  <strong>Pick up</strong>
                  <p>{selectedLoad.origin}</p>
                  <small>{selectedLoad.pickupAt}</small>
                </div>
              </li>
              <li>
                <span className="dot" />
                <div>
                  <strong>In sorting centre</strong>
                  <p>{selectedLoad.destination}</p>
                  <small>{selectedLoad.sortingAt}</small>
                </div>
              </li>
              <li>
                <span className="dot is-done" />
                <div>
                  <strong>Delivered</strong>
                  <p>{selectedLoad.destination}</p>
                  <small>{selectedLoad.deliveredAt}</small>
                </div>
              </li>
            </ul>
          </aside>

          <div className="logta-load-map-surface">
            <svg viewBox="0 0 520 360" preserveAspectRatio="none" aria-hidden>
              <path d={selectedLoad.routeLine} />
            </svg>
            {selectedLoad.points.map((point) => (
              <div key={point.id} className="logta-route-point" style={{ left: `${point.x}%`, top: `${point.y}%` }}>
                <span className="bubble">{point.label}</span>
                <span className="dot-marker">
                  <Truck size={10} />
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </LogtaPageView>
  );
};

export default Logistics;