import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { 
  User, MapPin, CheckCircle2, Navigation, Compass, 
  ShieldCheck, Star, Truck, Calendar, Download, Phone, 
  Clock, Package, FileText, Check, AlertTriangle, X, Printer 
} from 'lucide-react';
import MapGlobal, { Marker, Polyline, Popup, truckIcon, carIcon, problemIcon } from '@shared/components/MapGlobal';

const PublicRouteTracking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const [progress, setProgress] = useState(79);
  const [activeTab, setActiveTab] = useState('activity');
  
  // Interactive Modals state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const trackingCode = id || searchParams.get('id') || 'TRK-294A95C';
  const vehicleName = searchParams.get('veiculo') || 'Scania R450 Heavy';
  const driverName = searchParams.get('motorista') || 'Ricardo Santos';
  const origin = searchParams.get('origem') || 'CD São Paulo';
  const destination = searchParams.get('destino') || 'Base Curitiba';
  const status = searchParams.get('status') || 'Em trânsito';
  const company = searchParams.get('empresa') || 'Distribuidora Alfa';

  // Detailed street coordinates that follow the actual avenues & curves (São Paulo)
  const detailedStreetCoordinates: [number, number][] = [
    [-23.53800, -46.615000], // Start CD São Paulo
    [-23.53980, -46.617500],
    [-23.54120, -46.620100],
    [-23.54350, -46.621800],
    [-23.54580, -46.623500],
    [-23.54820, -46.626800],
    [-23.54950, -46.629500],
    [-23.55052, -46.633308]  // Active Truck Position
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: '#FFFFFF',
      color: '#0F172A',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Keyframes */}
      <style>{`
        @keyframes pulse-glow {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        .pulse-active {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .tab-btn {
          padding: 10px 16px;
          border: none;
          background: transparent;
          color: #64748B;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
          border-bottom: 2px solid transparent;
        }
        .tab-btn.active {
          color: #0061FF;
          border-bottom: 2px solid #0061FF;
        }
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 99px;
        }
        .hover-lift {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
        }

        /* Responsive styles */
        @media (max-width: 768px) {
          .floating-header {
            top: 12px !important;
            left: 12px !important;
            right: 12px !important;
            transform: none !important;
            gap: 8px !important;
            padding: 10px 16px !important;
            border-radius: 14px !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
            justifyContent: 'space-between' !important;
          }
          .floating-header .badge-title {
            font-size: 10px !important;
            padding: 4px 10px !important;
          }
          .sidebar-panel {
            top: auto !important;
            right: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 50vh !important;
            border-radius: 28px 28px 0 0 !important;
            box-shadow: none !important;
            border-left: none !important;
            border-right: none !important;
            border-bottom: none !important;
          }
          .sidebar-inner {
            padding: 20px !important;
            gap: 16px !important;
          }
        }

        /* Printable stylesheet block */
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* FULL-PAGE MAP (Standard Grayscale) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1
      }}>
        <MapGlobal center={[-23.55052, -46.633308]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: 0, border: 'none', boxShadow: 'none' }}>
          {/* Active Route Polyline Path (SOLID BLACK following actual streets) */}
          <Polyline 
            positions={detailedStreetCoordinates} 
            color="#000000" 
            weight={5} 
            opacity={0.9} 
          />

          {/* Active Vehicles & Popups */}
          {truckIcon && (
            <Marker position={[-23.55052, -46.633308]} icon={truckIcon} eventHandlers={{ click: () => setIsDriverModalOpen(true) }}>
              <Popup>
                <div style={{ padding: '4px', minWidth: '180px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 900, color: '#0F172A' }}>{vehicleName}</h4>
                  <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Motorista: {driverName}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 800, color: '#0061FF', borderTop: '1px solid #F1F5F9', paddingTop: '6px' }}>
                    <span style={{ color: '#10B981' }}>CLIQUE PARA FOTO</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
          {truckIcon && (
            <Marker position={[-23.53800, -46.615000]} icon={truckIcon}>
              <Popup>
                <div style={{ padding: '4px', minWidth: '160px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 900, color: '#0F172A' }}>Origem da Rota</h4>
                  <p style={{ margin: '0', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{origin}</p>
                </div>
              </Popup>
            </Marker>
          )}
          {carIcon && (
            <Marker position={[-23.56500, -46.650000]} icon={carIcon}>
              <Popup>
                <div style={{ padding: '4px', minWidth: '160px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 900, color: '#0F172A' }}>Destino Final</h4>
                  <p style={{ margin: '0', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{destination}</p>
                </div>
              </Popup>
            </Marker>
          )}
          {problemIcon && (
            <Marker position={[-23.55500, -46.638000]} icon={problemIcon}>
              <Popup>
                <div style={{ padding: '4px', minWidth: '180px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 900, color: '#EF4444' }}>Atenção / Alerta</h4>
                  <p style={{ margin: '0', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Ponto de lentidão no tráfego urbano.</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapGlobal>
      </div>

      {/* TOP MIDDLE FLOATING HEADER HUD */}
      <div className="floating-header" style={{
        position: 'absolute',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        backgroundColor: '#FFFFFF',
        padding: '12px 24px',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)'
      }}>
        <div className="badge-title" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '99px',
          backgroundColor: 'rgba(0, 97, 255, 0.08)',
          border: '1px solid rgba(0, 97, 255, 0.15)',
          color: '#0061FF',
          fontSize: '11px',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <ShieldCheck size={14} /> Acompanhamento Público Autônomo
        </div>
        <div className="gps-status-divider" style={{ height: '16px', width: '1px', backgroundColor: '#E2E8F0' }} />
        <div className="gps-status" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pulse-active" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', boxShadow: '0 0 10px #10B981' }} />
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#10B981', letterSpacing: '0.5px' }}>SINAL GPS ATIVO</span>
        </div>
      </div>

      {/* RIGHT SIDE FLOATING PANEL */}
      <div className="sidebar-panel custom-scroll" style={{
        position: 'absolute',
        top: '24px',
        right: '24px',
        bottom: '24px',
        width: '420px',
        backgroundColor: '#FFFFFF',
        borderRadius: '28px',
        border: '1px solid #E2E8F0',
        boxShadow: 'none',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        <div className="sidebar-inner" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Shipment Header info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>
                  Remessa
                </h1>
                <span style={{
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  padding: '3px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '800'
                }}>
                  {status}
                </span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0061FF', fontFamily: 'monospace' }}>
                {trackingCode}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setIsPrintModalOpen(true)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #E2E8F0',
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  transition: 'background-color 0.2s'
                }} 
                title="Download printable receipt history"
              >
                <Download size={16} />
              </button>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: '#F1F5F9' }} />

          {/* Details Box */}
          <div className="hover-lift" style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A', margin: 0 }}>Detalhes do Envio</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Partida</span>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} color="#64748B" /> 08.05 15:20
                </p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Previsão de Chegada</span>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} color="#0061FF" /> 09.05 19:34
                </p>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: '#E2E8F0' }} />

            {/* HIGH-FIDELITY CONCENTRIC ADDRESS TIMELINE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              {/* Sleek, thin solid connection line */}
              <div style={{ position: 'absolute', left: '9px', top: '16px', bottom: '16px', width: '2px', backgroundColor: '#CBD5E1', zIndex: 0 }} />
              
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                {/* Concentric Circle Node for Origin */}
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '50%', 
                  border: '2px solid #0061FF', 
                  backgroundColor: '#FFFFFF', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0061FF' }} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{origin}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                {/* Concentric Circle Node for Destination */}
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '50%', 
                  border: '2px solid #10B981', 
                  backgroundColor: '#FFFFFF', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{destination}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Box (With driver photo/avatar directly in the card) */}
          <div 
            className="hover-lift" 
            onClick={() => setIsDriverModalOpen(true)}
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Driver Photo/Avatar representation inside the card */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#0061FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  boxShadow: '0 2px 8px rgba(0,97,255,0.15)'
                }}>
                  RS
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Veículo & Motorista (Ver Foto)</span>
                  <p style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{driverName} • {vehicleName}</p>
                </div>
              </div>
            </div>

            {/* Capacity bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>
                  <span style={{ color: '#64748B' }}>Espaço Ocupado</span>
                  <span style={{ color: '#0061FF' }}>88%</span>
                </div>
                <div style={{ height: '5px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: '88%', height: '100%', backgroundColor: '#0061FF', borderRadius: '99px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>
                  <span style={{ color: '#64748B' }}>Peso Carregado</span>
                  <span style={{ color: '#0061FF' }}>74%</span>
                </div>
                <div style={{ height: '5px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: '74%', height: '100%', backgroundColor: '#0061FF', borderRadius: '99px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Supplier details info */}
          <div 
            onClick={() => setIsSupplierModalOpen(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '12px 16px', 
              backgroundColor: '#F8FAFC', 
              borderRadius: '16px', 
              border: '1px solid #E2E8F0',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0061FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>
                <span style={{ margin: 'auto' }}>{company[0]}</span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>Fornecedor (Clique para Contato)</span>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{company}</p>
              </div>
            </div>
            <button style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0061FF'
            }}>
              <Phone size={12} />
            </button>
          </div>

          <div style={{ height: '1px', backgroundColor: '#F1F5F9' }} />

          {/* Tabs Activity Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #F1F5F9', marginBottom: '8px' }}>
              <button className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
                Atividade
              </button>
              <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
                Documentos
              </button>
              <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
                Produtos
              </button>
            </div>

            {activeTab === 'activity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(0, 97, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0061FF', fontWeight: '800', fontSize: '11px' }}>
                    AJ
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', margin: '0 0 2px 0' }}>
                      Alice Jones <span style={{ color: '#D97706', backgroundColor: '#FEF3C7', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', marginLeft: '4px' }}>Consignee</span>
                    </p>
                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0, fontWeight: '500' }}>Cotações de frete postadas e aprovadas com segurança.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', fontWeight: '800', fontSize: '11px' }}>
                    JS
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', margin: '0 0 2px 0' }}>James Smith</p>
                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0, fontWeight: '500' }}>O envio parte do hub do CD de São Paulo.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={14} color="#0061FF" />
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A' }}>Manifesto_de_Carga.pdf</span>
                </div>
                <Download size={12} color="#64748B" style={{ cursor: 'pointer' }} />
              </div>
            )}

            {activeTab === 'products' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px', fontWeight: '800' }}>
                <span style={{ color: '#0F172A' }}>Equipamentos Industriais</span>
                <span style={{ color: '#0061FF' }}>5 unidades</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 📞 SUPPLIER MODAL */}
      {isSupplierModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #E2E8F0',
            padding: '28px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsSupplierModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: '#F1F5F9',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', margin: '0 0 16px 0' }}>Contato da Empresa</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>EMPRESA</span>
                <p style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0 0' }}>{company}</p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>TELEFONE / WHATSAPP</span>
                <p style={{ fontSize: '14px', fontWeight: '800', color: '#0061FF', margin: '2px 0 0 0' }}>+55 (11) 98765-4321</p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>EMAIL CORPORATIVO</span>
                <p style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0 0' }}>contato@alfa.com.br</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 👨‍✈️ DRIVER PROFILE MODAL */}
      {isDriverModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            border: '1px solid #E2E8F0',
            padding: '28px',
            width: '90%',
            maxWidth: '420px',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsDriverModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: '#F1F5F9',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', margin: '0 0 20px 0' }}>Perfil do Motorista</h3>
            
            {/* Professional Driver Card */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              {/* Professional Avatar representation */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#0061FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 'bold',
                fontSize: '24px',
                boxShadow: '0 4px 12px rgba(0,97,255,0.2)'
              }}>
                RS
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>{driverName}</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B', fontWeight: '600' }}>CNH Categoria E</p>
                <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                  <Star size={12} fill="#F59E0B" color="#F59E0B" />
                  <Star size={12} fill="#F59E0B" color="#F59E0B" />
                  <Star size={12} fill="#F59E0B" color="#F59E0B" />
                  <Star size={12} fill="#F59E0B" color="#F59E0B" />
                  <Star size={12} fill="#F59E0B" color="#F59E0B" />
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', marginLeft: '4px' }}>5.0</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>VEÍCULO</span>
                <p style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0 0' }}>{vehicleName}</p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>PLACA</span>
                <p style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0 0', fontFamily: 'monospace' }}>LGT-2026</p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>VELOCIDADE</span>
                <p style={{ fontSize: '13px', fontWeight: '800', color: '#10B981', margin: '2px 0 0 0' }}>62 km/h (Média)</p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>TEMPERATURA</span>
                <p style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0 0' }}>22 °C (Carga)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🖨️ PRINTABLE SUMMARY MODAL REPORT */}
      {isPrintModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            border: '1px solid #E2E8F0',
            padding: '32px',
            width: '90%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsPrintModalOpen(false)}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                backgroundColor: '#F1F5F9',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>

            {/* Print Area Selector */}
            <div id="print-area">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0F172A', paddingBottom: '16px', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: 0 }}>LOGTA MASTER CONTROL</h2>
                  <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', margin: '2px 0 0 0' }}>RELATÓRIO COMPLETO DE TRANSPORTE</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#0061FF', fontFamily: 'monospace' }}>{trackingCode}</span>
                  <p style={{ fontSize: '10px', color: '#64748B', margin: '2px 0 0 0' }}>Data: 08/05/2026</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>VEÍCULO</span>
                  <p style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0 0' }}>{vehicleName} (Placa: LGT-2026)</p>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>MOTORISTA</span>
                  <p style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0 0' }}>{driverName}</p>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>ORIGEM</span>
                  <p style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0 0' }}>{origin}</p>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>DESTINO</span>
                  <p style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0 0' }}>{destination}</p>
                </div>
              </div>

              <h4 style={{ fontSize: '13px', fontWeight: '900', color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '12px' }}>HISTÓRICO CRONOLÓGICO DE ROTA</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: '8px', borderBottom: '1px dashed #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>08.05.2026 - 15:20</span>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>Coleta realizada e notas fiscais emitidas no CD São Paulo.</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: '8px', borderBottom: '1px dashed #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>08.05.2026 - 15:45</span>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>Início de trânsito. Veículo em deslocamento pela via principal.</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: '8px', borderBottom: '1px dashed #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>08.05.2026 - 16:10</span>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>Sinal de telemetria e temperatura da carga estável em 22 °C.</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: '8px', borderBottom: '1px dashed #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>08.05.2026 - 16:32</span>
                  <span style={{ fontWeight: '800', color: '#10B981' }}>Posição em tempo real capturada via Satélite no KM 42 da Rodovia.</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>ASSINATURA DIGITAL DO SISTEMA</span>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#0F172A', fontFamily: 'monospace' }}>SECURE_LOGTA_VALID_HASH_2026</span>
              </div>
            </div>

            {/* Print trigger button */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button 
                onClick={handlePrint}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.15)'
                }}
              >
                <Printer size={16} /> Imprimir Relatório
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PublicRouteTracking;
