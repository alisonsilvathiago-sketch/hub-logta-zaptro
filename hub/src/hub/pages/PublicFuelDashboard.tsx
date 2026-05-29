import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Zap, ChevronDown, Menu, Globe } from 'lucide-react';
import { supabase } from '../../core/lib/supabase';

interface FuelPrice {
  id: string;
  type: string;
  price: number;
  last_updated: string;
  breakdown: any;
  fuel_history: any[];
}

const PublicFuelDashboard: React.FC = () => {
  const [selectedType, setSelectedType] = useState('Gasolina');
  const [allFuels, setAllFuels] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<'logta' | 'zaptro'>('logta');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const brandParam = params.get('brand');
    if (brandParam === 'zaptro') setBrand('zaptro');

    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('fuel_prices')
          .select('*, fuel_history(*)');
        
        if (data) {
          const formatted = data.map(f => ({
            ...f,
            fuel_history: f.fuel_history?.sort((a: any, b: any) => 
              new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
            ) || []
          }));
          setAllFuels(formatted);
          if (formatted.length > 0) {
            const firstFuel = formatted.find(f => f.type.toLowerCase().includes('gasolina')) || formatted[0];
            setSelectedType(firstFuel.type);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    document.title = `Como são formados os Preços | Inteligência de Combustível`;
  }, []);

  const currentFuel = allFuels.find(f => f.type.toLowerCase().includes(selectedType.toLowerCase())) || allFuels[0];

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#1E293B',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFF',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '5px solid #FFF',
          borderBottomColor: 'transparent',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'rotation 1s linear infinite',
        }} />
        <p style={{ fontWeight: '800', marginTop: '20px' }}>CARREGANDO DADOS DA PLATAFORMA...</p>
        <style>{`
          @keyframes rotation {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const priceValue = currentFuel ? Number(currentFuel.price) : 6.67;

  // Breakdown segments based on exact Petrobras proportions as seen in screenshot
  const breakdown = currentFuel?.breakdown || {
    distribution: 27.1,
    bio_share: 12.1,
    taxes_state: 23.5,
    taxes_federal: 10.2,
    refinery: 27.0
  };

  const labels = {
    distribution: 'Distribuição e Revenda',
    bio_share: selectedType.toLowerCase().includes('gasolina') ? 'Custo Etanol Anidro' : 'Custo Biocombustível',
    taxes_state: 'Imposto Estadual',
    taxes_federal: 'Impostos Federais',
    refinery: brand === 'zaptro' ? 'Parcela Zaptro' : 'Parcela Logta'
  };

  const segmentColors = {
    distribution: '#0D5F3A',  // Dark green
    bio_share: '#1D70B8',     // Blue
    taxes_state: '#D17319',   // Orange/brown
    taxes_federal: '#00A3A6', // Teal/cyan
    refinery: '#008C4A'       // Light green / main brand
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#E6B012', // Exact Petrobras Golden Yellow background
      color: '#000000',
            display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      paddingBottom: '80px'
    }}>
      {/* Top Navbar */}
      <nav style={{
        width: '100%',
        maxWidth: '1280px',
        height: '80px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        {/* Left: BR Petrobras Brand Logo Style */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            backgroundColor: '#008C4A',
            color: '#FFFFFF',
            padding: '6px 12px',
            borderRadius: '4px',
            fontWeight: '900',
            fontSize: '18px',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            BR <span style={{ color: '#E6B012' }}>PETROBRAS</span>
          </div>
        </div>

        {/* Center: Breadcrumb and Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
          <span style={{ color: '#333' }}>Como são formados os Preços</span>
          <span>&gt;</span>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#FFFFFF', border: '1px solid #000', padding: '4px 12px', borderRadius: '14px', cursor: 'pointer', alignItems: 'center' }}>
            <span>{selectedType.toUpperCase()}</span>
          </div>
          <span>&gt;</span>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#FFFFFF', border: '1px solid #000', padding: '4px 12px', borderRadius: '14px', cursor: 'pointer', alignItems: 'center' }}>
            <span>BR</span>
            <ChevronDown size={14} />
          </div>
        </div>

        {/* Right: Languages and Hamburger Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', fontWeight: '800' }}>
          <span>PT</span>
          <span style={{ opacity: 0.5 }}>EN</span>
          <Menu size={20} style={{ cursor: 'pointer' }} />
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{
        width: '100%',
        maxWidth: '960px',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Upper Title */}
        <span style={{ fontSize: '11px', fontWeight: '900', color: '#000', letterSpacing: '1.5px', textTransform: 'uppercase' }}>COMO SÃO FORMADOS OS PREÇOS</span>
        <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '8px 0', letterSpacing: '-2px', textTransform: 'uppercase' }}>{selectedType}</h1>
        <p style={{ fontSize: '15px', color: '#333', maxWidth: '720px', lineHeight: '1.5', margin: '0 0 40px 0', fontWeight: '500' }}>
          Como você pode ver, a Petrobras é responsável por uma parte do valor do seu combustível, mas outros fatores entram no cálculo do valor que chega até você.
        </p>

        {/* Fuel Selection Buttons in White Container (Zero Borders) */}
        <div style={{
          display: 'inline-flex',
          gap: '8px',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          padding: '4px',
          borderRadius: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          marginBottom: '40px'
        }}>
          {allFuels.length > 0 ? (
            allFuels.map(f => {
              const isActive = selectedType.toLowerCase() === f.type.toLowerCase();
              return (
                <button 
                  key={f.id} 
                  style={{
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 20px',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    transition: '0.2s',
                    backgroundColor: isActive ? '#F1F5F9' : 'transparent',
                    color: isActive ? '#0061FF' : '#64748B',
                    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
                  }}
                  onClick={() => setSelectedType(f.type)}
                >
                  {f.type.toUpperCase()}
                </button>
              );
            })
          ) : (
            ['Gasolina', 'Etanol', 'Diesel'].map(type => {
              const isActive = selectedType.toLowerCase() === type.toLowerCase();
              return (
                <button 
                  key={type} 
                  style={{
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 20px',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    transition: '0.2s',
                    backgroundColor: isActive ? '#F1F5F9' : 'transparent',
                    color: isActive ? '#0061FF' : '#64748B',
                    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
                  }}
                  onClick={() => setSelectedType(type)}
                >
                  {type.toUpperCase()}
                </button>
              );
            })
          )}
        </div>

        {/* --- HIGH-FIDELITY PETROBRAS PUMP DESIGN --- */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '40px',
          width: '100%',
          maxWidth: '720px',
          position: 'relative',
          margin: '20px 0 40px 0'
        }}>
          {/* Left Values and Connection Lines */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '280px',
            width: '180px',
            paddingTop: '60px',
            alignItems: 'flex-end',
            textAlign: 'right'
          }}>
            {Object.keys(labels).map((key) => {
              const val = (breakdown as any)[key] || 20;
              const pricePart = priceValue * (val / 100);
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '15px', fontWeight: '900', color: '#000000' }}>R${pricePart.toFixed(2).replace('.', ',')}</span>
                  <div style={{ width: '40px', height: '2px', backgroundColor: '#000000', opacity: 0.3 }} />
                </div>
              );
            })}
          </div>

          {/* Interactive Green Pump */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '240px'
          }}>
            {/* Pump Head with Display */}
            <div style={{
              width: '240px',
              height: '140px',
              backgroundColor: '#008C4A', // Petrobras green
              borderRadius: '24px 24px 10px 10px',
              padding: '16px',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                width: '100%',
                height: '100%',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #000'
              }}>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#64748B', marginBottom: '2px' }}>Preço médio &gt; BR</span>
                <span style={{ fontSize: '48px', fontWeight: '800', color: '#000000', fontFamily: 'monospace', letterSpacing: '1px' }}>
                  {priceValue.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Pump Body with color layers */}
            <div style={{
              width: '210px',
              height: '240px',
              backgroundColor: '#008C4A',
              border: '6px solid #008C4A',
              borderBottom: 'none',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
              <div style={{ height: `${breakdown.distribution}%`, backgroundColor: segmentColors.distribution, display: 'flex', alignItems: 'center', paddingLeft: '12px', color: '#FFFFFF', fontSize: '10px', fontWeight: '900', whiteSpace: 'nowrap' }}>
                {labels.distribution} ({breakdown.distribution}%)
              </div>
              <div style={{ height: `${breakdown.bio_share}%`, backgroundColor: segmentColors.bio_share, display: 'flex', alignItems: 'center', paddingLeft: '12px', color: '#FFFFFF', fontSize: '10px', fontWeight: '900', whiteSpace: 'nowrap' }}>
                {labels.bio_share} ({breakdown.bio_share}%)
              </div>
              <div style={{ height: `${breakdown.taxes_state}%`, backgroundColor: segmentColors.taxes_state, display: 'flex', alignItems: 'center', paddingLeft: '12px', color: '#FFFFFF', fontSize: '10px', fontWeight: '900', whiteSpace: 'nowrap' }}>
                {labels.taxes_state} ({breakdown.taxes_state}%)
              </div>
              <div style={{ height: `${breakdown.taxes_federal}%`, backgroundColor: segmentColors.taxes_federal, display: 'flex', alignItems: 'center', paddingLeft: '12px', color: '#FFFFFF', fontSize: '10px', fontWeight: '900', whiteSpace: 'nowrap' }}>
                {labels.taxes_federal} ({breakdown.taxes_federal}%)
              </div>
              <div style={{ height: `${breakdown.refinery}%`, backgroundColor: segmentColors.refinery, display: 'flex', alignItems: 'center', paddingLeft: '12px', color: '#FFFFFF', fontSize: '10px', fontWeight: '900', whiteSpace: 'nowrap' }}>
                {labels.refinery} ({breakdown.refinery}%)
              </div>
            </div>

            {/* Dark Base */}
            <div style={{
              width: '260px',
              height: '30px',
              backgroundColor: '#1E293B',
              borderRadius: '8px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
            }} />
          </div>

          {/* Right Nozzle Hose */}
          <div style={{
            position: 'absolute',
            right: '80px',
            top: '120px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* Nozzle Gun */}
            <div style={{
              width: '24px',
              height: '80px',
              backgroundColor: '#00A3A6',
              borderRadius: '6px',
              border: '2.5px solid #1E293B'
            }} />
            {/* Loop Hose */}
            <svg width="40" height="140" viewBox="0 0 40 140" fill="none" style={{ marginTop: '-10px' }}>
              <path d="M10 0V90C10 110 30 110 30 90V40" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Highlighted Brazil Average Price Box */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #000000',
          padding: '12px 32px',
          borderRadius: '4px',
          fontWeight: '900',
          fontSize: '18px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
        }}>
          Preço Médio do Brasil: R$ {priceValue.toFixed(2).replace('.', ',')}
        </div>

        {/* Detailed Explanation Note in Pink Style Box */}
        <div style={{
          backgroundColor: '#FAD2E1', // Pink style background
          border: '1px solid rgba(0,0,0,0.1)',
          padding: '16px 24px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '700',
          lineHeight: '1.6',
          textAlign: 'left',
          color: '#333',
          maxWidth: '720px',
          marginBottom: '24px'
        }}>
          5. Elaboração baseada a partir de dados da ANP e CEPEA/USP, calculados com base nos preços médios praticados (gasolina A) e nos preços médios ao consumidor final nos estados e no Distrito Federal, considerando a mistura obrigatória de cada biocombustível.
        </div>

        {/* Period of collection */}
        <div style={{
          fontSize: '12px',
          fontWeight: '800',
          color: '#333',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          paddingBottom: '24px',
          width: '100%',
          maxWidth: '720px',
          marginBottom: '32px'
        }}>
          6. Período de coleta: {new Date(currentFuel?.last_updated || Date.now()).toLocaleDateString('pt-BR')}
        </div>

        {/* State Dropdown Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '900' }}>Ver preço por estado*</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FFFFFF',
            border: '2px solid #000000',
            padding: '10px 24px',
            borderRadius: '24px',
            cursor: 'pointer',
            fontWeight: '900',
            fontSize: '14px'
          }}>
            <span>Média Brasil</span>
            <ChevronDown size={16} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicFuelDashboard;
