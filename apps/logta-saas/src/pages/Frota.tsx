import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Truck, Activity, Fuel, Wrench, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import { showToast } from '../components/Toast';
import { LogtaEmptyState } from '../components/EmptyState';
import { LogtaWaveTabStrip } from '../components/LogtaWaveTabStrip';
import { LogtaModuleHeader } from '../components/LogtaModuleHeader';
import { CombustivelView } from './FrotaCombustivelView';
import {
  FrotaIntelligenceProvider,
  FrotaCentralDashboard,
  FrotaManutencaoView,
  FrotaManutencaoVeiculoDetailView,
  VeiculoDetailView,
  FrotaAlertsInlinePanel,
} from '../modules/frota';
import type { FrotaVehicleRow } from '../modules/frota';
import {
  getSandboxOperationalBundle,
  mergeOperationalWithSandbox,
  resolveDemoCompanyId,
} from '../lib/seed';



const VeiculosManagementView = ({ veiculos, loading, setIsNovoVeiculoOpen }: any) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h3 className="logta-card-heading">Inventário de Veículos</h3>
          <span className="rounded-[14px] bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-normal text-[#F5F5F5] shadow-none">
            {veiculos.length} Unidades
          </span>
        </div>
        
        {loading ? (
          <div className="p-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-xs font-bold text-gray-400 uppercase">Acessando banco de dados...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {veiculos.map((v: any) => (
              <div 
                key={v.id} 
                onClick={() => navigate(`/frota/veiculos/${encodeURIComponent(v.placa)}`)}
                className="flex cursor-pointer items-center justify-between overflow-hidden rounded-[28px] border border-transparent bg-gray-50/50 p-5 transition-all hover:border-gray-100 hover:bg-white hover:shadow-xl group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shadow-sm">
                    <Truck size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 mb-1">{v.placa}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-normal">{v.modelo} • {v.tipo_veiculo}</p>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-normal ${
                  v.status === 'em_rota' ? 'bg-blue-50 text-blue-700' : 
                  v.status === 'manutencao' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>{v.status.replace('_', ' ')}</span>
              </div>
            ))}
            {veiculos.length === 0 && (
              <div className="col-span-2 py-20">
                 <LogtaEmptyState 
                   type="frota" 
                   onAction={() => setIsNovoVeiculoOpen(true)}
                   iaSuggestion={{
                     text: "Posso ajudar a cadastrar sua frota automaticamente via integração com o Detran?",
                     actionLabel: "Consultar IA Frota",
                     onAction: () => showToast('info', 'IA está pronta para ler suas placas e preencher os dados técnicos.', 'IA Logta')
                   }}
                 />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Frota = () => {
  const location = useLocation();
  const { config } = useTenant();
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNovoVeiculoOpen, setIsNovoVeiculoOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchVeiculos = async () => {
    const companyId = resolveDemoCompanyId(config?.id);
    setLoading(true);
    try {
      const mapRow = (v: any) => ({
        ...v,
        placa: v.plate || v.placa,
        modelo: v.model || v.modelo || v.brand,
        tipo_veiculo: v.type,
        ano_fabricacao: v.year,
      });

      let dbRows: any[] = [];
      if (config?.id) {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('company_id', config.id)
          .order('created_at', { ascending: false });
        if (!error && data) dbRows = data.map(mapRow);
      }

      const sandboxRows = getSandboxOperationalBundle(companyId).vehicles.map((v) =>
        mapRow({
          id: v.id,
          plate: v.plate,
          status: v.status,
          model: v.modelo,
          brand: v.modelo,
          year: 2022,
          type: 'cavalo',
          company_id: companyId,
        }),
      );

      setVeiculos(mergeOperationalWithSandbox(dbRows, sandboxRows, 2));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVeiculos();
  }, []);

  const handleCreateVeiculo = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      plate: formData.get('placa'),
      model: formData.get('modelo'),
      type: formData.get('tipo'),
      year: parseInt(formData.get('ano') as string),
      status: 'available',
      company_id: config.id
    };

    const { error } = await supabase.from('vehicles').insert([payload]);
    if (!error) {
      setSuccess(true);
      fetchVeiculos();
      if ((window as any).showToast) (window as any).showToast('success', 'Veículo cadastrado no banco!', 'Sucesso');
      setTimeout(() => {
        setSuccess(false);
        setIsNovoVeiculoOpen(false);
      }, 2000);
    }
  };

  const path = location.pathname;
  const tabs = [
    { id: 'dashboard', label: 'Painel', shortLabel: 'Painel', icon: Activity, path: '/frota/dashboard' },
    { id: 'veiculos', label: 'Veículos', shortLabel: 'Veículos', icon: Truck, path: '/frota/veiculos' },
    { id: 'manutencao', label: 'Manutenção', shortLabel: 'Manut.', icon: Wrench, path: '/frota/manutencao' },
    { id: 'combustivel', label: 'Combustível', shortLabel: 'Comb.', icon: Fuel, path: '/frota/combustivel' },
  ];

  return (
    <div className="logta-page h-full w-full max-w-full overflow-x-hidden overflow-y-auto text-left animate-in fade-in duration-700 scrollbar-hide">
      <LogtaModuleHeader
        title="Frota"
        subtitle="Gestão 360º de veículos, manutenção (óleo, pneus, filtros) e combustível."
        tabs={<LogtaWaveTabStrip tabs={tabs} basePath="/frota" defaultTabId="dashboard" />}
        tabQuickAddLabel="Novo veículo"
        onTabQuickAdd={() => setIsNovoVeiculoOpen(true)}
      />

      <FrotaIntelligenceProvider vehicles={veiculos as FrotaVehicleRow[]} autoPopup={false}>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <FrotaAlertsInlinePanel className="mb-6" />
        <Routes>
          <Route index element={<Navigate to="/frota/dashboard" replace />} />
          <Route path="dashboard" element={<FrotaCentralDashboard veiculos={veiculos as FrotaVehicleRow[]} loading={loading} />} />
          <Route path="veiculos/:placa" element={<VeiculoDetailView />} />
          <Route path="veiculos" element={<VeiculosManagementView veiculos={veiculos} loading={loading} setIsNovoVeiculoOpen={setIsNovoVeiculoOpen} />} />
          <Route path="manutencao/:placa" element={<FrotaManutencaoVeiculoDetailView veiculos={veiculos} />} />
          <Route path="manutencao" element={<FrotaManutencaoView veiculos={veiculos} loading={loading} />} />
          <Route path="pneus" element={<Navigate to="/frota/manutencao" replace />} />
          <Route path="combustivel" element={<CombustivelView veiculos={veiculos} />} />
        </Routes>
      </div>
      </FrotaIntelligenceProvider>

      {isNovoVeiculoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNovoVeiculoOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#18191B] rounded-[32px] shadow-2xl border border-neutral-800 p-8 text-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="logta-modal-title">Cadastrar Novo Veículo</h3>
              <button onClick={() => setIsNovoVeiculoOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            
            {success ? (
              <div className="py-10 text-center space-y-4">
                <CheckCircle2 size={48} className="mx-auto text-green-400" />
                <p className="font-bold">Veículo adicionado com sucesso!</p>
              </div>
            ) : (
              <form onSubmit={handleCreateVeiculo} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Placa</label>
                    <input name="placa" required placeholder="ABC-1234" className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Ano</label>
                    <input name="ano" required placeholder="2024" className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Modelo</label>
                  <input name="modelo" required placeholder="Scania R450" className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Tipo</label>
                  <select name="tipo" className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-primary text-sm">
                    <option value="cavalo">Cavalo (Caminhão)</option>
                    <option value="carreta">Carreta</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:opacity-90 shadow-lg shadow-primary/20">Salvar no Supabase</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Frota;
