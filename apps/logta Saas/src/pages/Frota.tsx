import React from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate, useParams } from 'react-router-dom';
import { 
  Truck, 
  Activity, 
  Fuel, 
  Disc, 
  AlertCircle, 
  Plus, 
  TrendingUp, 
  Calendar,
  Zap,
  Wrench,
  DollarSign,
  Settings,
  ArrowLeft,
  User,
  ShieldCheck,
  FileText,
  Clock,
  ExternalLink,
  MapPin
} from 'lucide-react';

// --- Sub-View Components ---

const FrotaDashboardView = () => {
  const stats = [
    { label: 'Frota Total', value: '32', desc: '24 Cavalos / 8 Carretas', Icon: Truck, color: 'text-gray-900' },
    { label: 'Em Manutenção', value: '08', desc: '01 Urgente / 07 Preventiva', Icon: Wrench, color: 'text-yellow-600' },
    { label: 'Custo Mês', value: 'R$ 84.5k', desc: 'Combustível + Manut.', Icon: DollarSign, color: 'text-red-500' },
    { label: 'Consumo Médio', value: '2.8 km/l', desc: 'Média da frota pesada', Icon: Fuel, color: 'text-primary' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const StatIcon = stat.Icon;
          return (
            <div key={i} className="bg-gray-50/50 border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-xl p-8 rounded-[40px] relative overflow-hidden group transition-all text-left cursor-default">
              <div className="relative z-10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">{stat.label}</p>
                <h4 className={`text-4xl font-black tracking-tight ${stat.color}`}>{stat.value}</h4>
                <p className="text-[10px] text-gray-500 mt-3 font-bold uppercase tracking-tight">{stat.desc}</p>
              </div>
              <StatIcon size={80} className="absolute -right-6 -bottom-6 text-gray-900 opacity-[0.02] group-hover:opacity-[0.05] group-hover:scale-110 transition-all duration-500" />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-8 tracking-tight">Status da Frota em Tempo Real</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              {[
                { status: 'Ativos em Rota', count: 18, color: 'bg-primary' },
                { status: 'Disponíveis (Pátio)', count: 6, color: 'bg-green-500' },
                { status: 'Oficina / Manutenção', count: 3, color: 'bg-yellow-500' },
                { status: 'Parados (Sem Motorista)', count: 5, color: 'bg-gray-300' },
              ].map((item, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between text-[11px] font-black text-gray-900 uppercase tracking-normal">
                    <span>{item.status}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${(item.count/32)*100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-[32px] p-8 flex flex-col justify-between border border-gray-100 hover:shadow-xl transition-all">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-6">Alertas de Documentação</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs font-bold text-red-500 bg-red-50 p-4 rounded-2xl">
                    <AlertCircle size={18} /> IPVA Vencendo (02 veículos)
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-yellow-600 bg-yellow-50 p-4 rounded-2xl">
                    <AlertCircle size={18} /> ANTT Próximo Venc. (05)
                  </div>
                </div>
              </div>
              <button className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all mt-6 shadow-md cursor-pointer">Regularizar Docs</button>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-[40px] p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-gray-900/20 group">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-8 text-white tracking-tight">Inteligência de Frota</h3>
            <div className="space-y-4">
              <div className="p-5 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                <p className="text-[9px] font-black text-primary uppercase tracking-normal mb-2 flex items-center gap-2"><TrendingUp size={12}/> Destaque Eficiência</p>
                <p className="text-xs font-bold text-gray-300">Veículo <span className="text-white">BRA-2L22</span> está com 3.2 km/l (acima da média).</p>
              </div>
              <div className="p-5 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                <p className="text-[9px] font-black text-red-400 uppercase tracking-normal mb-2 flex items-center gap-2"><AlertCircle size={12}/> Atenção Manutenção</p>
                <p className="text-xs font-bold text-gray-300">Custo de corretivas subiu <span className="text-white">12%</span> este mês.</p>
              </div>
            </div>
          </div>
          <div className="mt-8 p-5 bg-primary text-gray-900 rounded-[24px] flex items-start gap-4 relative z-10 hover:scale-[1.02] transition-transform cursor-pointer shadow-xl shadow-primary/20">
            <div className="bg-gray-900 p-2 rounded-xl text-primary"><Zap size={20} fill="currentColor" /></div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-normal text-gray-900 mb-1">Sugestão Logta AI</p>
              <p className="text-[11px] font-bold leading-relaxed text-gray-800">Trocar pneus do Eixo 03 do caminhão KJU-9011 agora.</p>
            </div>
          </div>
          <Activity size={200} className="absolute -right-20 -bottom-20 text-white opacity-[0.03] group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>
    </div>
  );
};

const VeiculosManagementView = () => {
  const navigate = useNavigate();

  const cavalos = [
    { plate: 'BRA-2L22', model: 'Scania R450', driver: 'Roberto Silva', status: 'Em Rota' },
    { plate: 'KJU-9011', model: 'Volvo FH 540', driver: 'Ana Paula', status: 'Disponível' },
    { plate: 'MNH-4455', model: 'MB Actros', driver: 'Carlos Lima', status: 'Oficina' },
  ];

  const carretas = [
    { plate: 'ABC-1234', type: 'Sider (Baú)', cap: '32 Paletes', status: 'Engatada' },
    { plate: 'XYZ-5678', type: 'Grade Baixa', cap: '27 Ton', status: 'Pátio' },
  ];

  return (
    <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Cavalos (Caminhões)</h3>
            <span className="text-[10px] font-black text-gray-900 bg-[#D7FF00] px-4 py-2 rounded-[14px] uppercase tracking-normal shadow-sm">24 Unidades</span>
          </div>
          <div className="space-y-4">
            {cavalos.map((v) => (
              <div 
                key={v.plate} 
                onClick={() => navigate(`/frota/veiculos/${v.plate}`)}
                className="p-5 bg-gray-50/50 rounded-[28px] flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-gray-100 cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shadow-sm">
                    <Truck size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 mb-1">{v.plate}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-normal">{v.model} • {v.driver}</p>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-normal ${
                  v.status === 'Em Rota' ? 'bg-blue-50 text-blue-700' : 
                  v.status === 'Oficina' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>{v.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Carretas & Reboques</h3>
            <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-4 py-2 rounded-[14px] uppercase tracking-normal">08 Unidades</span>
          </div>
          <div className="space-y-4">
            {carretas.map((v) => (
              <div 
                key={v.plate} 
                onClick={() => navigate(`/frota/veiculos/${v.plate}`)}
                className="p-5 bg-gray-50/50 rounded-[28px] flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-gray-100 cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-gray-900 transition-colors shadow-sm">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 mb-1">{v.plate}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-normal">{v.type} • {v.cap}</p>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-normal ${
                  v.status === 'Engatada' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>{v.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- VEICULO DETALHE VIEW (HIGH FIDELITY VEHICLE WORKSPACE) ---

const VeiculoDetalheView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Custom rich data depending on vehicle plate
  const veiculosData: Record<string, any> = {
    'BRA-2L22': {
      plate: 'BRA-2L22',
      model: 'Scania R450',
      type: 'Trator Cabine Leito (6x2)',
      driver: 'Roberto Silva',
      status: 'Em Rota',
      freightId: 'FR-8890',
      chassi: '9BW-ZZZ99-AA012345',
      year: '2022 / 2022',
      km: '142.500 km',
      averageConsumption: '3.2 km/l',
      fuelScore: '95%',
      lastSupply: '05/05 (Posto Graal SP)',
      nextPreventive: '145.000 km (Troca de Óleo)',
      activeTyres: [
        { id: 'PN-8820', axis: 'Eixo 1 (Dianteiro Esq.)', wear: '12%', status: 'Crítico' },
        { id: 'PN-8821', axis: 'Eixo 1 (Dianteiro Dir.)', wear: '85%', status: 'Excelente' },
        { id: 'PN-8822', axis: 'Eixo 2 (Traseiro Esq.)', wear: '75%', status: 'Bom' },
        { id: 'PN-8823', axis: 'Eixo 2 (Traseiro Dir.)', wear: '70%', status: 'Bom' }
      ],
      maintenanceHistory: [
        { os: 'OS-440', date: '04/05/2026', service: 'Troca de Óleo + Filtros', tech: 'Oficina Central', cost: 'R$ 1.850,00', status: 'Finalizado' },
        { os: 'OS-412', date: '10/03/2026', service: 'Alinhamento e Balanceamento', tech: 'Truck Center SP', cost: 'R$ 600,00', status: 'Finalizado' }
      ]
    },
    'KJU-9011': {
      plate: 'KJU-9011',
      model: 'Volvo FH 540',
      type: 'Trator Globetrotter (6x4)',
      driver: 'Ana Paula',
      status: 'Disponível',
      freightId: 'FR-8891',
      chassi: '9BW-ZZZ88-BB901122',
      year: '2023 / 2023',
      km: '88.100 km',
      averageConsumption: '2.8 km/l',
      fuelScore: '88%',
      lastSupply: '04/05 (Posto BR Rio)',
      nextPreventive: '90.000 km (Revisão Geral)',
      activeTyres: [
        { id: 'PN-9011', axis: 'Eixo 1 (Dianteiro Esq.)', wear: '92%', status: 'Excelente' },
        { id: 'PN-9012', axis: 'Eixo 1 (Dianteiro Dir.)', wear: '90%', status: 'Excelente' }
      ],
      maintenanceHistory: [
        { os: 'OS-435', date: '15/04/2026', service: 'Revisão dos 80k km', tech: 'Concessionária Volvo', cost: 'R$ 4.500,00', status: 'Finalizado' }
      ]
    },
    'MNH-4455': {
      plate: 'MNH-4455',
      model: 'MB Actros 2651',
      type: 'Trator Cabine Megaspace (6x4)',
      driver: 'Carlos Lima',
      status: 'Oficina',
      freightId: 'FR-8892',
      chassi: '9BW-ZZZ77-CC445511',
      year: '2021 / 2021',
      km: '210.400 km',
      averageConsumption: '2.4 km/l',
      fuelScore: '72%',
      lastSupply: '28/04 (Posto Shell Campinas)',
      nextPreventive: '215.000 km (Filtros de Combustível)',
      activeTyres: [
        { id: 'PN-4451', axis: 'Eixo 1 (Dianteiro Esq.)', wear: '60%', status: 'Regular' },
        { id: 'PN-4452', axis: 'Eixo 1 (Dianteiro Dir.)', wear: '58%', status: 'Regular' }
      ],
      maintenanceHistory: [
        { os: 'OS-442', date: '05/05/2026', service: 'Sistema de Freios (Corretiva)', tech: 'Truck Master', cost: 'R$ 4.200,00', status: 'Em Oficina' }
      ]
    },
    'ABC-1234': {
      plate: 'ABC-1234',
      model: 'Sider Randon (3 Eixos)',
      type: 'Carreta Sider (Baú)',
      driver: 'Roberto Silva',
      status: 'Engatada',
      freightId: 'FR-8890',
      chassi: '9BW-REB99-XX123456',
      year: '2020 / 2020',
      km: '180.000 km',
      averageConsumption: 'N/A',
      fuelScore: 'N/A',
      lastSupply: '-',
      nextPreventive: 'Preventiva de Lonas (Jun/26)',
      activeTyres: [
        { id: 'PN-1234', axis: 'Eixo 1 (Esquerdo)', wear: '80%', status: 'Bom' }
      ],
      maintenanceHistory: [
        { os: 'OS-390', date: '10/02/2026', service: 'Lubrificação das Lonas', tech: 'Oficina Central', cost: 'R$ 350,00', status: 'Finalizado' }
      ]
    },
    'XYZ-5678': {
      plate: 'XYZ-5678',
      model: 'Randon Grade Baixa',
      type: 'Carreta Grade Baixa',
      driver: 'Nenhum',
      status: 'Pátio',
      freightId: 'Nenhum',
      chassi: '9BW-REB88-YY567890',
      year: '2019 / 2019',
      km: '240.000 km',
      averageConsumption: 'N/A',
      fuelScore: 'N/A',
      lastSupply: '-',
      nextPreventive: 'Preventiva Geral (Ago/26)',
      activeTyres: [],
      maintenanceHistory: []
    }
  };

  const veiculo = veiculosData[id || 'BRA-2L22'] || veiculosData['BRA-2L22'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* Return Button */}
      <button 
        onClick={() => navigate('/frota/veiculos')}
        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Voltar para Gestão de Veículos
      </button>

      {/* Profile Header Card */}
      <div className="bg-transparent border-none p-0 shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center">
            <Truck size={32} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">{veiculo.plate}</h2>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-normal ${
                veiculo.status === 'Disponível' ? 'bg-green-100 text-green-700' : 
                veiculo.status === 'Oficina' ? 'bg-red-100 text-red-700 animate-pulse' : 
                'bg-blue-100 text-blue-700'
              }`}>
                {veiculo.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-normal">{veiculo.model} • {veiculo.type}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer">
            <Wrench size={16} /> Agendar OS
          </button>
          <button className="px-6 py-3.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2 shadow-sm cursor-pointer">
            <MapPin size={16} /> Rastrear Live
          </button>
        </div>
      </div>

      {/* Technical & Operational specs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Quilometragem', value: veiculo.km, sub: 'Hodômetro Ativo' },
          { label: 'Consumo Médio', value: veiculo.averageConsumption, sub: 'Média de Diesel por KM' },
          { label: 'Score Eficiência', value: veiculo.fuelScore, sub: 'Logta AI Driving Score' },
          { label: 'Próxima Revisão', value: veiculo.nextPreventive, sub: 'Manutenção Preventiva' },
        ].map((m, i) => (
          <div key={i} className="bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">{m.label}</p>
            <h4 className="text-2xl font-black text-gray-900">{m.value}</h4>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-normal mt-2">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: ACTIVE TYRES & MAINTENANCE */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Tyres Grid */}
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-6">Pneus Instalados & Desgaste</h3>
            {veiculo.activeTyres.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {veiculo.activeTyres.map((p: any, idx: number) => (
                  <div key={idx} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-white transition-all">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{p.id} • {p.axis}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Vida Útil: {p.wear}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-normal ${
                      p.status === 'Excelente' ? 'bg-green-100 text-green-700' : 
                      p.status === 'Crítico' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-3xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase">Nenhum monitoramento ativo para carretas avulsas</p>
              </div>
            )}
          </div>

          {/* Maintenance OS History */}
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-6">Histórico de Ordens de Serviço (OS)</h3>
            {veiculo.maintenanceHistory.length > 0 ? (
              <div className="space-y-4">
                {veiculo.maintenanceHistory.map((h: any, idx: number) => (
                  <div key={idx} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                        <Wrench size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{h.os} • {h.service}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{h.date} • Oficina: {h.tech}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div>
                        <p className="text-xs font-black text-gray-900">{h.cost}</p>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${h.status === 'Finalizado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{h.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-3xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase">Nenhuma ordem de serviço registrada</p>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: GENERAL DETAILS & DRIVER / ACTIVE FREIGHT */}
        <div className="space-y-8">
          
          {/* Driver & Journey callout */}
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-gray-900 border-b border-gray-50 pb-4">Status de Operação</h3>
            <div className="space-y-4 text-xs font-medium">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-normal mb-1">Chassi do Veículo</p>
                <p className="text-gray-900 font-bold text-sm">{veiculo.chassi}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-normal mb-1">Ano / Modelo</p>
                <p className="text-gray-900 font-bold text-sm">{veiculo.year}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-normal mb-1">Motorista Alocado</p>
                <p className="text-gray-900 font-bold text-sm flex items-center gap-1.5">
                  <User size={14} className="text-gray-400" /> {veiculo.driver}
                </p>
              </div>
              {veiculo.freightId !== 'Nenhum' && (
                <div className="pt-4 border-t border-gray-50">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-normal mb-2">Carga Ativa Associada</p>
                  <Link 
                    to={`/fretes/lista/${veiculo.freightId}`}
                    className="p-4 bg-primary/5 hover:bg-primary/10 rounded-2xl border border-primary/10 flex items-center justify-between text-primary font-bold group transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Truck size={16} />
                      <span className="text-xs text-gray-900 font-black">{veiculo.freightId}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-normal flex items-center gap-1">Ver Viagem <ExternalLink size={10} /></span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Supply history */}
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-gray-900 border-b border-gray-50 pb-4">Último Abastecimento</h3>
            <div className="space-y-4 text-xs">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                  <Fuel size={14} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase">Localização & Posto</p>
                  <p className="text-xs text-gray-900 font-bold leading-tight">{veiculo.lastSupply}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

const ManutencaoView = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gray-50/50 border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-xl p-10 rounded-[40px] relative overflow-hidden group transition-all cursor-pointer">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">Próximas Preventivas</p>
        <h4 className="text-4xl font-black text-gray-900 tracking-tight">07</h4>
        <p className="text-[10px] text-gray-500 mt-4 font-bold uppercase tracking-normal bg-gray-100 inline-block px-3 py-1.5 rounded-lg">Vencendo nos próximos 15 dias</p>
        <Wrench size={100} className="absolute -right-6 -bottom-6 text-gray-900 opacity-[0.02] group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div className="bg-gray-50/50 border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-xl p-10 rounded-[40px] relative overflow-hidden group transition-all cursor-pointer">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">Custo Médio/Veículo</p>
        <h4 className="text-4xl font-black text-red-500 tracking-tight">R$ 4.2k</h4>
        <p className="text-[10px] text-red-500 mt-4 font-bold uppercase tracking-normal bg-red-50 inline-block px-3 py-1.5 rounded-lg">+5% vs Mês Anterior</p>
      </div>
      <div className="bg-gray-50/50 border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-xl p-10 rounded-[40px] relative overflow-hidden group transition-all cursor-pointer">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">Uptime da Frota</p>
        <h4 className="text-4xl font-black text-primary tracking-tight">94.2%</h4>
        <p className="text-[10px] text-gray-900 mt-4 font-bold uppercase tracking-normal bg-primary/20 inline-block px-3 py-1.5 rounded-lg">Meta: 95%</p>
      </div>
    </div>

    <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-8 tracking-tight">Ordens de Serviço em Aberto</h3>
      <div className="space-y-4">
        {[
          { os: 'OS-440', vehicle: 'BRA-2L22', service: 'Troca de Óleo + Filtros', tech: 'Oficina Central', cost: 'R$ 1.850', priority: 'Média' },
          { os: 'OS-442', vehicle: 'MNH-4455', service: 'Sistema de Freios (Corretiva)', tech: 'Truck Master', cost: 'R$ 4.200', priority: 'Urgente' },
        ].map((item, i) => (
          <div key={i} className="p-6 bg-gray-50/50 rounded-[32px] border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-xl transition-all flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-8">
              <div className="text-center min-w-[80px] bg-white p-3 rounded-2xl shadow-sm">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{item.os}</p>
                <p className="text-sm font-black text-gray-900">{item.vehicle}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">{item.service}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-normal">{item.tech}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-lg font-black text-gray-900 mb-1">{item.cost}</p>
                <span className={`text-[9px] font-black uppercase tracking-normal px-3 py-1 rounded-lg ${item.priority === 'Urgente' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>{item.priority}</span>
              </div>
              <button className="px-6 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100 shadow-md cursor-pointer">Ver OS</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PneusView = () => (
  <div className="space-y-8 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="bg-gray-900 rounded-[40px] p-12 text-white relative overflow-hidden flex flex-col justify-between min-h-[340px] shadow-2xl shadow-gray-900/20 group">
      <div className="relative z-10 max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <Disc size={24} className="text-primary" />
          <h3 className="text-2xl font-black tracking-tight">Monitoramento de Pneus</h3>
        </div>
        <p className="text-gray-400 text-sm font-medium leading-relaxed mb-10">Controle de sulcos, vida útil e alocação de eixos por veículo. Reduza o custo por KM com inteligência e planejamento.</p>
        
        <div className="grid grid-cols-3 gap-8 p-6 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-md">
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-normal mb-2">Total em Uso</p>
            <h4 className="text-3xl font-black text-white">182</h4>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-normal mb-2">Custo/KM Médio</p>
            <h4 className="text-3xl font-black text-primary">R$ 0,14</h4>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-normal mb-2">Venc. Recapagem</p>
            <h4 className="text-3xl font-black text-yellow-500">12</h4>
          </div>
        </div>
      </div>
      <Disc size={340} className="absolute -right-20 -bottom-20 text-white opacity-[0.03] group-hover:rotate-45 transition-transform duration-[2s] ease-in-out" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-8 tracking-tight">Alertas de Sulco Crítico</h3>
        <div className="space-y-4">
          {[
            { id: 'PN-8820', vehicle: 'BRA-2L22', axis: 'Eixo 02 (Traseiro Esq.)', life: 12, status: 'Crítico' },
            { id: 'PN-8825', vehicle: 'KJU-9011', axis: 'Eixo 01 (Dianteiro Dir.)', life: 25, status: 'Atenção' },
          ].map((p, i) => (
            <div key={i} className="p-5 bg-gray-50/50 rounded-[28px] flex items-center justify-between border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-xl transition-all cursor-pointer">
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">{p.vehicle} • {p.id}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-normal">{p.axis}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className={`text-sm font-black mb-1 ${p.status === 'Crítico' ? 'text-red-500' : 'text-yellow-600'}`}>{p.life}% de Vida</p>
                  <p className={`text-[9px] font-black uppercase tracking-normal px-2 py-0.5 rounded-md inline-block ${p.status === 'Crítico' ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'}`}>{p.status}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-primary shadow-sm">
                  <Disc size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-8 tracking-tight">Histórico de Recapagem</h3>
        <div className="space-y-4">
          {[
            { date: '02/05', pneu: 'PN-7712', brand: 'Michelin', provider: 'Recape Center SP', cost: 'R$ 850' },
            { date: '28/04', pneu: 'PN-7715', brand: 'Bridgestone', provider: 'Recape Center SP', cost: 'R$ 850' },
          ].map((h, i) => (
            <div key={i} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[28px] hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 transition-all cursor-pointer">
              <div className="flex items-center gap-5">
                <div className="text-center min-w-[50px] bg-white px-3 py-2 rounded-xl shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase">{h.date}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-1">{h.pneu} <span className="text-gray-400 font-medium">({h.brand})</span></p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-normal">{h.provider}</p>
                </div>
              </div>
              <p className="text-sm font-black text-gray-900 bg-white px-4 py-2 rounded-xl shadow-sm">{h.cost}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const CombustivelView = () => {
  const fuelCards = [
    { label: 'Gasto Médio/Km', value: 'R$ 4,82', Icon: DollarSign, color: 'text-gray-900' },
    { label: 'Volume Total (Mês)', value: '18,420 L', Icon: Fuel, color: 'text-primary' },
    { label: 'Melhor Autonomia', value: '3.4 km/l', Icon: TrendingUp, color: 'text-green-500' },
    { label: 'Abastecimentos', value: '142', Icon: Activity, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-8 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {fuelCards.map((card, i) => {
          const CardIcon = card.Icon;
          return (
            <div key={i} className="bg-gray-50/50 border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-xl p-8 rounded-[40px] transition-all group cursor-pointer text-left">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-white rounded-2xl text-gray-400 group-hover:text-primary transition-colors shadow-sm"><CardIcon size={24} /></div>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">{card.label}</p>
              <h4 className={`text-3xl font-black tracking-tight ${card.color}`}>{card.value}</h4>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-8 tracking-tight">Ranking de Consumo por Veículo</h3>
        <div className="space-y-8">
          {[
            { vehicle: 'Scania R450 (BRA-2L22)', kml: 3.2, cost: 'R$ 3.82/km', efficiency: 95 },
            { vehicle: 'Volvo FH 540 (KJU-9011)', kml: 2.8, cost: 'R$ 4.25/km', efficiency: 88 },
            { vehicle: 'MB Actros (MNH-4455)', kml: 2.4, cost: 'R$ 5.12/km', efficiency: 72 },
          ].map((v, i) => (
            <div key={i} className="space-y-3 group cursor-pointer">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">{v.vehicle}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-normal">{v.cost} • {v.kml} km/l</p>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-normal px-3 py-1 rounded-lg ${v.efficiency > 90 ? 'bg-green-50 text-green-500' : v.efficiency > 80 ? 'bg-[#D7FF00]/20 text-gray-900' : 'bg-red-50 text-red-500'}`}>{v.efficiency}% Eficiência</span>
              </div>
              <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                <div className={`h-full transition-all duration-1000 ${v.efficiency > 90 ? 'bg-green-500' : v.efficiency > 80 ? 'bg-primary' : 'bg-red-500'}`} style={{ width: `${v.efficiency}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Frota = () => {
  const location = useLocation();
  const path = location.pathname;
  const isDetailPage = /^\/frota\/veiculos\/.+/.test(location.pathname);
  
  const tabs = [
    { id: 'dashboard', label: 'Painel da Frota', icon: Activity, path: '/frota/dashboard' },
    { id: 'veiculos', label: 'Veículos & Ativos', icon: Truck, path: '/frota/veiculos' },
    { id: 'manutencao', label: 'Manutenção', icon: Wrench, path: '/frota/manutencao' },
    { id: 'pneus', label: 'Gestão de Pneus', icon: Disc, path: '/frota/pneus' },
    { id: 'combustivel', label: 'Combustível', icon: Fuel, path: '/frota/combustivel' },
  ];

  if (isDetailPage) {
    return (
      <div className="px-16 py-10 w-full h-full text-left animate-in fade-in duration-500 overflow-y-auto scrollbar-hide">
        <Routes>
          <Route path="veiculos/:id" element={<VeiculoDetalheView />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="px-16 py-10 w-full h-full text-left animate-in fade-in duration-700 overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-end mb-8 h-[87px]">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight h-[46px] mt-[74px]">Frota</h1>
          <p className="text-xs text-gray-400 font-medium mt-1">Gestão 360º de veículos, pneus, motoristas e manutenção.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3.5 bg-white text-gray-700 rounded-xl text-sm font-bold border border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 cursor-pointer">
            <Calendar size={16} /> Agendar Revisão
          </button>
          <button className="px-6 py-3.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 cursor-pointer">
            <Plus size={16} /> Novo Veículo
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 bg-gray-100 rounded-[28px] w-fit mb-10 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = path.startsWith(tab.path) || (path === '/frota' && tab.id === 'dashboard');
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2.5 transition-all text-xs tracking-normal whitespace-nowrap
                ${isActive 
                  ? 'bg-white text-gray-900 shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon size={18} className={isActive ? 'text-primary' : 'text-gray-400'} />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Routes>
          <Route index element={<Navigate to="/frota/dashboard" replace />} />
          <Route path="dashboard" element={<FrotaDashboardView />} />
          <Route path="veiculos" element={<VeiculosManagementView />} />
          <Route path="veiculos/:id" element={<VeiculoDetalheView />} />
          <Route path="manutencao" element={<ManutencaoView />} />
          <Route path="pneus" element={<PneusView />} />
          <Route path="combustivel" element={<CombustivelView />} />
        </Routes>
      </div>
    </div>
  );
};

export default Frota;
