import React, { useState, useEffect } from 'react';
import SEOManager from '@/shared/components/SEOManager';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@/shared/lib/supabase';
import { Truck, Navigation, Search, Filter, Package, Activity, MapPin, FileText, Loader2, Info } from 'lucide-react';

// Corrigindo ícones padrão do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const S: Record<string, React.CSSProperties> = {
  page: { padding: '32px 60px', background: 'var(--content-bg)', height: '100%', fontFamily: 'Inter, sans-serif', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0, padding: '0' },
  title: { fontSize: '24px', fontWeight: '900', letterSpacing: '-1px', color: '#0F172A' },
  subtitle: { color: '#64748B', fontSize: '13px' },
  layout: { display: 'flex', gap: '24px', flex: 1, minHeight: 0, padding: '0' },
  sidebar: { width: '340px', display: 'flex', flexDirection: 'column', gap: '20px', flexShrink: 0, overflowY: 'auto', paddingRight: '8px' },
  mapWrapper: { flex: 1, background: '#ffffff', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', position: 'relative' },
  card: { background: '#ffffff', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  inputGroup: { display: 'flex', alignItems: 'center', gap: '10px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px' },
  badge: (bg: string, color: string) => ({ padding: '4px 12px', borderRadius: '24px', fontSize: '10px', fontWeight: '900', display: 'inline-flex', alignItems: 'center', gap: '6px', background: bg, color: color }),
  listItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '16px', border: '1px solid #F1F5F9', background: '#ffffff', marginBottom: '10px', cursor: 'pointer', transition: 'all 0.2s' },
};

export default function GlobalLogistics() {
  const [trackingData, setTrackingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [activeProduto, setActiveProduto] = useState<'todos' | 'logta' | 'zaptro'>('todos');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const fetchTracking = async () => {
    const { data } = await supabase
      .from('global_tracking')
      .select('*, companies(name)')
      .order('last_update', { ascending: false });
    
    if (data) setTrackingData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 10000); 
    return () => clearInterval(interval);
  }, []);

  const filteredData = trackingData.filter(d => {
    const matchName = d.asset_name.toLowerCase().includes(filter.toLowerCase()) || 
                      (d.companies?.name?.toLowerCase().includes(filter.toLowerCase()));
    const matchProduto = activeProduto === 'todos' || d.product_source === activeProduto;
    return matchName && matchProduto;
  });

  return (
    <div style={S.page}>
      <SEOManager title="Hub Master | Logística Global" />

      <div style={S.header}>
        <div>
          <h1 style={S.title}>Centro de Comando Global</h1>
          <p style={S.subtitle}>Monitoramento de frota e logística unificada de toda a rede de clientes.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <div style={S.badge('#F0FDF4', '#16A34A')}><Activity size={12} /> RADAR ONLINE</div>
        </div>
      </div>

      <div style={S.layout}>
        <div style={S.sidebar}>
          
          <div style={S.card}>
            <div style={{ fontSize: '12px', fontWeight: '900', color: '#94A3B8', marginBottom: '16px', textTransform: 'uppercase' }}>Pesquisar Radar</div>
            <div style={S.inputGroup}>
              <Search size={18} color="#94A3B8" />
              <input 
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%', fontWeight: '600' }} 
                placeholder="Empresa, motorista ou placa..." 
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: '12px', fontWeight: '900', color: '#94A3B8', marginBottom: '16px', textTransform: 'uppercase' }}>Filtrar por Ecossistema</div>
            <div style={{ display: 'flex', gap: '8px', background: 'var(--content-bg)', padding: '6px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
               {['todos', 'logta', 'zaptro'].map(p => (
                 <button 
                  key={p} 
                  onClick={() => setActiveProduto(p as any)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: activeProduto === p ? 'linear-gradient(135deg, #6366F1 0%, #0F172A 100%)' : 'transparent', color: activeProduto === p ? '#fff' : '#64748B', fontWeight: '900', fontSize: '11px', cursor: 'pointer', boxShadow: activeProduto === p ? '0 4px 12px rgba(99,102,241,0.2)' : 'none', textTransform: 'uppercase' }}
                 >
                   {p}
                 </button>
               ))}
            </div>
          </div>

          <div style={{ ...S.card, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ fontWeight: '900', fontSize: '15px', color: '#1E293B', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
               <span>Ativos no Radar</span>
               <span style={{ color: '#6366F1' }}>{filteredData.length}</span>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 size={32} className="spin" color="#E2E8F0" /></div>
              ) : filteredData.map(d => (
                <div key={d.id} style={S.listItem} onClick={() => setSelectedAsset(d)}>
                  <div style={{ width: 44, height: 44, borderRadius: '12px', background: d.product_source === 'logta' ? '#F5F3FF' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: d.product_source === 'logta' ? '#6366F1' : '#10B981', flexShrink: 0 }}>
                    {d.asset_type === 'veiculo' ? <Truck size={20} /> : <Package size={20} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.asset_name}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700' }}>{d.companies?.name}</div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.status === 'em_rota' ? '#10B981' : '#F59E0B' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={S.mapWrapper}>
          <MapContainer center={[-23.5505, -46.6333]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            {filteredData.map(d => (
              <Marker key={d.id} position={[d.lat, d.lng]}>
                <Popup>
                  <div style={{ padding: '4px', minWidth: '150px' }}>
                    <div style={{ fontWeight: '900', fontSize: '14px', color: '#1E293B', marginBottom: '2px' }}>{d.asset_name}</div>
                    <div style={{ fontSize: '11px', color: '#6366F1', fontWeight: '800', marginBottom: '8px' }}>{d.companies?.name}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                       <div style={{ fontSize: '11px', color: '#64748B' }}><b>Status:</b> {d.status.toUpperCase()}</div>
                       <div style={{ fontSize: '11px', color: '#64748B' }}><b>Progresso:</b> {Math.floor(d.progress)}%</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          
          {selectedAsset && (
            <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, zIndex: 1000, background: '#fff', borderRadius: '24px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s ease-out', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '16px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}><Truck size={28} /></div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B', margin: 0 }}>{selectedAsset.asset_name}</h3>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Rastreando via <b>{selectedAsset.product_source.toUpperCase()}</b> • {selectedAsset.companies?.name}</p>
                  </div>
               </div>
               <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setSelectedAsset(null)} style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', fontWeight: '800', color: '#64748B', cursor: 'pointer' }}>Fechar</button>
                  <button style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#1E293B', color: '#fff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Navigation size={16} /> Ver Rota Completa</button>
               </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
