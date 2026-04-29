import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Eye,
  Fuel,
  Plus,
  Search,
  SlidersHorizontal,
  Download,
  Pencil,
  Trash2,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import LogtaPageView from '../../components/LogtaPageView';

type FleetTab = 'veiculos' | 'manutencao' | 'consumo';

type TractorRow = {
  unitNo: string;
  plate: string;
  state: string;
  make: string;
  vin: string;
  model: string;
  year: string;
  available: boolean;
};

const TRACTORS: TractorRow[] = [
  { unitNo: 'TR-101', plate: 'ABC1234', state: 'CA', make: 'Freightliner', vin: '1FUJGLD54GLGV0001', model: 'Cascadia', year: '2018', available: true },
  { unitNo: 'TR-102', plate: 'XYZ5678', state: 'TX', make: 'Kenworth', vin: '4V4NC9EH2GN963789', model: 'T680', year: '2017', available: true },
  { unitNo: 'TR-103', plate: 'MNO9101', state: 'NY', make: 'Volvo', vin: '1FUJGLD54GLGV0002', model: 'VNL 760', year: '2019', available: true },
  { unitNo: 'TR-104', plate: 'QRS2345', state: 'FL', make: 'Peterbilt', vin: '5KJJAED15LP123456', model: '579', year: '2021', available: true },
  { unitNo: 'TR-105', plate: 'DEF3456', state: 'IL', make: 'International', vin: '1FUJGLD54GLGV0003', model: 'LT Series', year: '2020', available: true },
  { unitNo: 'TR-106', plate: 'GHI7890', state: 'PA', make: 'Freightliner', vin: '1FUJGLBG8GLGW0002', model: 'Anthem', year: '2016', available: true },
  { unitNo: 'TR-107', plate: 'JKL6789', state: 'OH', make: 'Mack', vin: '1FUJGLD54GLGV0004', model: '5700XE', year: '2022', available: true },
  { unitNo: 'TR-108', plate: 'TUV4321', state: 'NV', make: 'Western Star', vin: '3HSDJAPR5JN123457', model: 'Coronado', year: '2017', available: true },
  { unitNo: 'TR-109', plate: 'WXY9876', state: 'MI', make: 'Volvo', vin: '1FUJGLD54GLGV0005', model: '389', year: '2019', available: true },
  { unitNo: 'TR-110', plate: 'STU6543', state: 'MO', make: 'Peterbilt', vin: '1FUJGLD54GLGV0006', model: 'W900', year: '2019', available: true },
  { unitNo: 'TR-111', plate: 'ZXC6785', state: 'OR', make: 'Freightliner', vin: '1FUJGLD54GLGV0007', model: 'VNL 860', year: '2020', available: false },
  { unitNo: 'TR-112', plate: 'BNM2134', state: 'AZ', make: 'International', vin: '5KJJAEDIXFP123458', model: 'ProStar', year: '2022', available: false },
];

const Fleet: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();
  const [search, setSearch] = useState('');

  const currentTab: FleetTab = tab === 'manutencao' || tab === 'consumo' || tab === 'veiculos' ? tab : 'veiculos';

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TRACTORS;
    return TRACTORS.filter((item) =>
      `${item.unitNo} ${item.plate} ${item.make} ${item.model} ${item.vin}`.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <LogtaPageView>
      <div className="logta-tractors-shell animate-fade-in">
        <header className="logta-tractors-header">
          <div>
            <h2>{currentTab === 'veiculos' ? 'Tractors' : currentTab === 'manutencao' ? 'Maintenance' : 'Fuel analytics'}</h2>
            <span>{rows.length}</span>
          </div>
          <nav className="logta-tractors-tabs">
            <button type="button" className={currentTab === 'veiculos' ? 'is-active' : ''} onClick={() => navigate('/frota/veiculos')}>
              Tractors
            </button>
            <button type="button" className={currentTab === 'manutencao' ? 'is-active' : ''} onClick={() => navigate('/frota/manutencao')}>
              Maintenance
            </button>
            <button type="button" className={currentTab === 'consumo' ? 'is-active' : ''} onClick={() => navigate('/frota/consumo')}>
              Fuel
            </button>
          </nav>
        </header>

        <div className="logta-tractors-toolbar">
          <div className="logta-tractors-search">
            <Search size={15} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tractors" />
          </div>
          <button type="button">
            <SlidersHorizontal size={14} />
            Filters
          </button>
          <button type="button">
            <Download size={14} />
            Export
          </button>
          <button type="button" className="is-dark">
            <Plus size={14} />
            Add tractor
          </button>
        </div>

        {currentTab === 'veiculos' && (
          <>
            <div className="logta-tractors-filters">
              <input placeholder="Enter unit no." />
              <input placeholder="Enter VIN" />
              <input placeholder="Enter license plate no." />
              <select defaultValue="">
                <option value="">Available</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div className="logta-tractors-table-wrap">
              <table className="logta-tractors-table">
                <thead>
                  <tr>
                    <th>Unit no.</th>
                    <th>License plate no.</th>
                    <th>State</th>
                    <th>Make</th>
                    <th>VIN</th>
                    <th>Model</th>
                    <th>Year</th>
                    <th>GPS</th>
                    <th>Available</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.unitNo}-${row.vin}`}>
                      <td>
                        <span className="logta-table-unit">
                          <ShieldCheck size={13} />
                          {row.unitNo}
                        </span>
                      </td>
                      <td>{row.plate}</td>
                      <td>{row.state}</td>
                      <td>{row.make}</td>
                      <td>{row.vin}</td>
                      <td>{row.model}</td>
                      <td>{row.year}</td>
                      <td>
                        <button type="button" className="logta-mini-icon-btn">
                          <Eye size={13} />
                        </button>
                      </td>
                      <td>
                        <span className={`logta-pill ${row.available ? 'is-available' : 'is-unavailable'}`}>
                          {row.available ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td>
                        <div className="logta-row-actions">
                          <button type="button" className="logta-mini-icon-btn">
                            <Pencil size={13} />
                          </button>
                          <button type="button" className="logta-mini-icon-btn">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {currentTab === 'manutencao' && (
          <div className="logta-maintenance-grid">
            {[
              { id: 'MNT-2201', title: 'Brake inspection', tractor: 'TR-104', status: 'In progress', date: '2026-05-02' },
              { id: 'MNT-2202', title: 'Tire replacement', tractor: 'TR-110', status: 'Scheduled', date: '2026-05-03' },
              { id: 'MNT-2203', title: 'Engine diagnostics', tractor: 'TR-111', status: 'Urgent', date: '2026-04-30' },
            ].map((item) => (
              <article key={item.id}>
                <header>
                  <strong>{item.id}</strong>
                  <span>{item.status}</span>
                </header>
                <h3>{item.title}</h3>
                <p>Tractor {item.tractor}</p>
                <footer>
                  <Wrench size={14} />
                  <small>{item.date}</small>
                </footer>
              </article>
            ))}
          </div>
        )}

        {currentTab === 'consumo' && (
          <div className="logta-fuel-grid">
            {[
              { label: 'Average price', value: '$3.27 / gallon', delta: '+1.8%' },
              { label: 'Fuel spend this month', value: '$148,920', delta: '-4.3%' },
              { label: 'Average MPG', value: '6.4 MPG', delta: '+0.6%' },
            ].map((item) => (
              <article key={item.label}>
                <header>
                  <Fuel size={15} />
                  <span>{item.label}</span>
                </header>
                <strong>{item.value}</strong>
                <small>{item.delta} vs last month</small>
              </article>
            ))}
          </div>
        )}
      </div>
    </LogtaPageView>
  );
};

export default Fleet;