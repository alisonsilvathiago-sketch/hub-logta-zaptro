import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Truck, ArrowLeft, Activity, MapPin, Navigation, Clock, Shield, Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import SEOManager from '@/shared/components/SEOManager';

// Corrigindo ícones padrão do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const S: Record<string, React.CSSProperties> = {
  container: { height: '100vh', width: '100%', position: 'relative', overflow: 'hidden', background: 'var(--content-bg)' },
  header: { position: 'absolute', top: '24px', left: '24px', zIndex: 1000, display: 'flex', gap: '12px' },
  btnBack: { padding: '12px 24px', background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', color: '#1A2340', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', transition: '0.2s' },
  sidePanel: { position: 'absolute', top: '24px', right: '24px', width: '380px', zIndex: 1000, background: '#ffffff', borderRadius: '28px', border: '1px solid #E2E8F0', boxShadow: '0 30px 60px rgba(0,0,0,0.15)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' },
  infoCard: { background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '20px' },
  label: { fontSize: '10px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' },
  value: { fontSize: '16px', fontWeight: '900', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' },
  liveBadge: { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#0F172A', color: '#fff', padding: '14px 28px', borderRadius: '50px', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', letterSpacing: '0.5px' },
  dot: { width: '10px', height: '10px', borderRadius: '50%', background: '#22C55E', animation: 'pulse 1.5s infinite' }
};

export default function FullTrackingMap() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<[number, number][]>([]);

  const fetchAsset = async () => {
    const { data } = await supabase
      .from('global_tracking')
      .select('*, companies(name)')
      .eq('id', id)
      .single();

    if (data) {
      setAsset(data);
      setHistory(prev => {
        const last = prev[prev.length - 1];
        if (last && last[0] === data.lat && last[1] === data.lng) return prev;
        return [...prev, [data.lat, data.lng]].slice(-50);
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAsset();
    const interval = setInterval(fetchAsset, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--content-bg)' }}><Loader2 size={48} className="spin" color="#6366F1" /></div>;
  if (!asset) return <div style={{ padding: '40px', textAlign: 'center' }}>Ativo não encontrado.</div>;

  return (
    <div style={S.container}>
      <SEOManager title={`Radar Live | ${asset.asset_name}`} />

      <div style={S.header}>
        <button style={S.btnBack} onClick={() => navigate('/master/logistics')}>
          <ArrowLeft size={20} /> VOLTAR AO PAINEL
        </button>
      </div>

      <div style={S.sidePanel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '20px', background: asset.product_source === 'logta' ? '#F5F3FF' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: asset.product_source === 'logta' ? '#6366F1' : '#10B981' }}>
            <Truck size={32} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', marginBottom: '2px', letterSpacing: '-0.5px' }}>{asset.asset_name}</h2>
            <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <div style={S.dot} /> EM ROTA • {asset.companies?.name}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={S.infoCard}>
            <div style={S.label}>Velocidade</div>
            <div style={S.value}><Zap size={18} color="#F59E0B" /> {Math.floor(Math.random() * 20) + 40} km/h</div>
          </div>
          <div style={S.infoCard}>
            <div style={S.label}>Progresso</div>
            <div style={S.value}><Activity size={18} color="#6366F1" /> {Math.floor(asset.progress)}%</div>
          </div>
        </div>

        <div style={S.infoCard}>
          <div style={S.label}>Destino Estimado</div>
          <div style={S.value}><MapPin size={18} color="#EF4444" /> {asset.metadata?.destination || 'CD Norte - SP'}</div>
        </div>

        <div style={{ ...S.infoCard, background: '#1E293B', color: '#fff', border: 'none' }}>
          <div style={{ ...S.label, color: 'rgba(255,255,255,0.5)' }}>Ecossistema Ativo</div>
          <div style={{ ...S.value, color: '#fff', fontSize: '22px' }}><Shield size={22} color="#6366F1" /> {asset.product_source.toUpperCase()} MASTER</div>
        </div>
      </div>

      <div style={S.liveBadge}>
        <div style={S.dot} /> TRANSMISSÃO MASTER EM TEMPO REAL
      </div>

      <MapContainer center={[asset.lat, asset.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <Polyline positions={history} pathOptions={{ color: '#6366F1', weight: 4, opacity: 0.6, dashArray: '10, 10' }} />
        <Marker position={[asset.lat, asset.lng]}>
          <Popup>{asset.asset_name}</Popup>
        </Marker>
        <MapUpdater center={[asset.lat, asset.lng]} />
      </MapContainer>

      <style>{`
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.panTo(center); }, [center, map]);
  return null;
}
