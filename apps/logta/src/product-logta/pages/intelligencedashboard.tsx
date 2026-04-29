import React from 'react';
import { ArrowUpRight, CreditCard, DollarSign, Fuel, Package, Truck } from 'lucide-react';
import LogtaPageView from '../../components/LogtaPageView';
import { LOGTA_DASHBOARD_PAGE_PAD_TOP_PX } from '../../constants/logtaLayout';

type KpiRow = {
  label: string;
  value: string;
};

type MapPin = {
  id: string;
  x: number;
  y: number;
  label: string;
};

const fundsRows: KpiRow[] = [
  { label: 'Balance', value: '-$700.00' },
  { label: 'Line of credit', value: '$72 000.00' },
];

const rebateRows: KpiRow[] = [
  { label: 'Current month', value: '$61 097.08' },
  { label: 'Current period', value: '$320.00' },
];

const fuelPins: MapPin[] = [
  { id: 'f-1', x: 16, y: 31, label: '$3.21' },
  { id: 'f-2', x: 48, y: 19, label: '$3.07' },
  { id: 'f-3', x: 60, y: 48, label: '$3.52' },
  { id: 'f-4', x: 83, y: 23, label: '$3.07' },
  { id: 'f-5', x: 34, y: 59, label: '$3.10' },
];

const trackingPins: MapPin[] = [
  { id: 't-1', x: 20, y: 28, label: 'TR-12' },
  { id: 't-2', x: 71, y: 24, label: 'TR-08' },
  { id: 't-3', x: 32, y: 63, label: 'TR-03' },
  { id: 't-4', x: 56, y: 65, label: 'TR-11' },
  { id: 't-5', x: 74, y: 59, label: 'TR-18' },
];

const IntelligenceDashboard: React.FC = () => {
  return (
    <LogtaPageView style={{ padding: `${LOGTA_DASHBOARD_PAGE_PAD_TOP_PX}px 0 28px` }}>
      <div className="logta-dashboard-shell">
        <section className="logta-welcome-card">
          <h1>Welcome, Ismail Miles</h1>
          <p>Load Connex, the best platform for tracking and managing your freight transport.</p>
        </section>

        <section className="logta-dashboard-grid">
          <div className="logta-dashboard-stack">
            <KpiCard
              title="Funds"
              icon={<DollarSign size={15} />}
              cta="See details"
              rows={fundsRows}
              highlight="$71 300.00"
              highlightSuffix="available funds"
            />
            <KpiCard
              title="Rebates"
              icon={<Package size={15} />}
              cta="See details"
              rows={rebateRows}
              highlight="$48 321.43"
              highlightSuffix="lifetime rebates"
            />

            <div className="logta-dashboard-card">
              <div className="logta-dashboard-card-head">
                <div className="logta-dashboard-card-title">
                  <span className="logta-dashboard-icon">
                    <CreditCard size={15} />
                  </span>
                  <h3>Cards</h3>
                </div>
                <button type="button">
                  See details
                  <ArrowUpRight size={13} />
                </button>
              </div>
              <div className="logta-cards-list">
                {[
                  { n: '**** 7462', p: 'Jane Cooper', l: '329 gallons remaining' },
                  { n: '**** 5615', p: 'Leslie Alexander', l: '145 gallons remaining' },
                  { n: '**** 4149', p: 'Ronald Richards', l: '241 gallons remaining' },
                ].map((card) => (
                  <div key={card.n} className="logta-cards-row">
                    <span>{card.n}</span>
                    <strong>{card.p}</strong>
                    <small>{card.l}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="logta-dashboard-card">
              <div className="logta-dashboard-card-head">
                <div className="logta-dashboard-card-title">
                  <span className="logta-dashboard-icon">
                    <Truck size={15} />
                  </span>
                  <h3>Loads</h3>
                </div>
                <button type="button">
                  See more
                  <ArrowUpRight size={13} />
                </button>
              </div>
              <div className="logta-loads-mini-card">
                <strong>#3568130</strong>
                <div className="logta-loads-mini-route">
                  <span>Carrier: Southwest</span>
                  <span className="logta-chip-status">In-transit</span>
                </div>
                <p>Texas · 15.08.24 ⟶ Illinois · 21.08.24</p>
              </div>
            </div>
          </div>

          <div className="logta-dashboard-stack">
            <MapCard title="Fuel map" cta="View the map" pins={fuelPins} />
            <MapCard title="Tracking" cta="View fleet" pins={trackingPins} />
          </div>
        </section>
      </div>
    </LogtaPageView>
  );
};

const KpiCard = ({
  title,
  icon,
  cta,
  rows,
  highlight,
  highlightSuffix,
}: {
  title: string;
  icon: React.ReactNode;
  cta: string;
  rows: KpiRow[];
  highlight: string;
  highlightSuffix: string;
}) => (
  <article className="logta-dashboard-card">
    <div className="logta-dashboard-card-head">
      <div className="logta-dashboard-card-title">
        <span className="logta-dashboard-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      <button type="button">
        {cta}
        <ArrowUpRight size={13} />
      </button>
    </div>
    <div className="logta-kpi-rows">
      {rows.map((row) => (
        <div key={row.label}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
    <p className="logta-kpi-highlight">
      <strong>{highlight}</strong>
      <span>{highlightSuffix}</span>
    </p>
  </article>
);

const MapCard = ({ title, cta, pins }: { title: string; cta: string; pins: MapPin[] }) => (
  <article className="logta-dashboard-card logta-map-card">
    <div className="logta-dashboard-card-head">
      <div className="logta-dashboard-card-title">
        <span className="logta-dashboard-icon">
          <Fuel size={15} />
        </span>
        <h3>{title}</h3>
      </div>
      <button type="button">
        {cta}
        <ArrowUpRight size={13} />
      </button>
    </div>
    <div className="logta-map-card-surface">
      {pins.map((pin) => (
        <span key={pin.id} className="logta-map-pin" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
          <Truck size={11} />
          {pin.label}
        </span>
      ))}
      <div className="logta-map-controls">
        <button type="button">+</button>
        <button type="button">−</button>
      </div>
    </div>
  </article>
);

export default IntelligenceDashboard;