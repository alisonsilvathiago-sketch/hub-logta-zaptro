import React from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { 
  Users, 
  Truck, 
  Activity, 
  DollarSign, 
  Clock, 
  FileText, 
  AlertCircle, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  MoreVertical,
  Star,
  Calendar,
  Briefcase,
  Award,
  ShieldCheck,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

const RH = () => {
  const location = useLocation();
  const isDetailPage = /^\/rh\/equipe\/.+/.test(location.pathname);
  
  const tabs = [
    { id: 'dashboard', label: 'Painel RH', icon: Activity, path: '/rh/dashboard' },
    { id: 'equipe', label: 'Equipe & Colaboradores', icon: Users, path: '/rh/equipe' },
    { id: 'motoristas', label: 'Gestão de Motoristas', icon: Truck, path: '/rh/motoristas' },
    { id: 'desempenho', label: 'Performance & Ranking', icon: Award, path: '/rh/desempenho' },
  ];

  if (isDetailPage) {
    return (
      <div className="px-16 py-10 w-full h-full text-left animate-in fade-in duration-500 overflow-y-auto scrollbar-hide">
        <Routes>
          <Route path="equipe/:id" element={<ColaboradorPerfilView />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="px-16 py-10 w-full h-full space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex justify-between items-end h-[87px]">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight h-[46px] mt-[74px]">Recursos Humanos</h1>
          <p className="text-xs text-gray-400 font-medium mt-1">Gestão 360º de colaboradores, motoristas e performance operacional.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3.5 bg-white text-gray-700 rounded-xl text-sm font-bold border border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 cursor-pointer">
            <MessageSquare size={16} /> Comunicado Geral
          </button>
          <button className="px-6 py-3.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer">
            <Plus size={16} /> Novo Colaborador
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Native Links) */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-[24px] w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path) || (location.pathname === '/rh' && tab.id === 'dashboard');
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all
                ${isActive 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
            >
              <Icon size={18} className={isActive ? 'text-primary' : 'text-gray-400'} />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Sub-views via Routes */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Routes>
          <Route index element={<Navigate to="/rh/dashboard" replace />} />
          <Route path="dashboard" element={<RHDashboardView />} />
          <Route path="equipe" element={<EquipeManagementView />} />
          <Route path="equipe/:id" element={<ColaboradorPerfilView />} />
          <Route path="motoristas" element={<MotoristasManagementView />} />
          <Route path="desempenho" element={<PerformanceRankingView />} />
        </Routes>
      </div>
    </div>
  );
};

// --- Sub-View Components ---

const RHDashboardView = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[
        { label: 'Colaboradores', value: '154', color: 'text-gray-900', icon: Users },
        { label: 'Motoristas Ativos', value: '82', color: 'text-primary', icon: Truck },
        { label: 'Folha Mensal Est.', value: 'R$ 412k', color: 'text-gray-900', icon: DollarSign },
        { label: 'Alertas (Docs)', value: '08', color: 'text-red-500', icon: AlertCircle },
      ].map((stat, i) => (
        <div key={i} className="bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">{stat.label}</p>
            <h4 className={`text-3xl font-black ${stat.color}`}>{stat.value}</h4>
          </div>
          <stat.icon size={60} className="absolute -right-4 -bottom-4 text-gray-900 opacity-[0.02] group-hover:opacity-[0.05] transition-all" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-8">Eficiência da Equipe (Mês)</h3>
        <div className="space-y-6">
          {[
            { role: 'Motoristas Próprios', efficiency: 94, color: 'bg-primary' },
            { role: 'Motoristas Agregados', efficiency: 82, color: 'bg-blue-500' },
            { role: 'Equipe Logística', efficiency: 88, color: 'bg-gray-900' },
            { role: 'Administrativo', efficiency: 96, color: 'bg-green-500' },
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-gray-900">{item.role}</span>
                <span className="text-[10px] font-black text-gray-400">{item.efficiency}% de Eficiência</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${item.color}`} style={{ width: `${item.efficiency}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-[40px] p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-6">Alertas Críticos</h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-red-500 uppercase tracking-normal mb-0.5">CNH Vencendo</p>
                <p className="text-xs text-gray-400">Roberto Silva • Categoria E • 3 dias</p>
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
              <ShieldCheck size={18} className="text-yellow-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-yellow-500 uppercase tracking-normal mb-0.5">Exame Periódico (ASO)</p>
                <p className="text-xs text-gray-400">04 motoristas com exames pendentes.</p>
              </div>
            </div>
          </div>
        </div>
        <Users size={120} className="absolute -right-8 -bottom-8 opacity-5 text-white" />
      </div>
    </div>
  </div>
);

const EquipeManagementView = () => {
  const navigate = useNavigate();

  const members = [
    { id: 'roberto', name: 'Roberto Silva', role: 'Motorista de Pesados', type: 'CLT', date: '12/01/2022', salary: 'R$ 5.400,00', status: 'Ativo' },
    { id: 'ana', name: 'Ana Paula Lima', role: 'Gerente Logística', type: 'CLT', date: '05/03/2021', salary: 'R$ 8.200,00', status: 'Ativo' },
    { id: 'carlos', name: 'Carlos Reis', role: 'Motorista Agregado', type: 'PJ', date: '20/11/2023', salary: 'Variável', status: 'Férias' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, CPF ou cargo..." 
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 outline-none focus:border-primary/50 transition-all shadow-sm"
          />
        </div>
        <button className="px-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:text-gray-900 transition-all flex items-center gap-2 shadow-sm font-bold">
          <Filter size={20} /> Filtrar Equipe
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-[40px] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Colaborador / Cargo</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Contrato / Tipo</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Admissão</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal text-right">Salário / Base</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((member, i) => (
              <tr 
                key={member.id} 
                onClick={() => navigate(`/rh/equipe/${member.id}`)}
                className="hover:bg-gray-50 transition-colors group cursor-pointer"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white overflow-hidden shadow-sm">
                      <img src={`https://i.pravatar.cc/150?u=${i}`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{member.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-normal">{member.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-xs font-bold text-gray-600">{member.type}</span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-xs font-bold text-gray-600">{member.date}</span>
                </td>
                <td className="px-8 py-6 text-right font-black text-gray-900">
                  <p className="text-sm">{member.salary}</p>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-normal ${
                    member.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-center">
                  <button className="p-2 text-gray-400 hover:text-primary transition-all"><MoreVertical size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MotoristasManagementView = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { name: 'Roberto Silva', cnh: 'Cat. E (05/2024)', vehicle: 'Sprinter BRA-2L22', deliveries: 142, rating: 4.8 },
        { name: 'Ana Paula', cnh: 'Cat. D (12/2025)', vehicle: 'Caminhão KJU-9011', deliveries: 98, rating: 4.9 },
        { name: 'Carlos Lima', cnh: 'Cat. B (08/2024)', vehicle: 'Fiorino MNH-4455', deliveries: 156, rating: 4.5 },
      ].map((driver, i) => (
        <div key={i} className="bg-white border border-gray-200 p-8 rounded-[40px] shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 border-4 border-white overflow-hidden shadow-sm group-hover:scale-105 transition-all">
              <img src={`https://i.pravatar.cc/150?u=driver${i}`} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-xl">
              <Star size={14} fill="currentColor" />
              <span className="text-xs font-black">{driver.rating}</span>
            </div>
          </div>
          <div className="space-y-1 mb-6">
            <h4 className="text-xl font-bold text-gray-900 tracking-tight">{driver.name}</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-normal">{driver.cnh}</p>
          </div>
          <div className="space-y-3 pt-6 border-t border-gray-50">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-400">Veículo Atual</span>
              <span className="text-gray-900 font-bold">{driver.vehicle}</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-400">Entregas (Mês)</span>
              <span className="text-primary font-bold">{driver.deliveries}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-8">
            <button className="py-3 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-bold hover:bg-gray-100 transition-all">Perfil</button>
            <button className="py-3 bg-gray-900 text-white rounded-xl text-[10px] font-bold hover:bg-black transition-all">Documentos</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const PerformanceRankingView = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-8">Top Performance (Mês)</h3>
      <div className="space-y-4">
        {[
          { name: 'Roberto Silva', role: 'Motorista', score: 98, trend: '+4.2%' },
          { name: 'Ana Paula Lima', role: 'Gerente Log.', score: 95, trend: '+1.5%' },
          { name: 'Carlos Lima', role: 'Motorista', score: 92, trend: '-0.5%' },
        ].map((p, i) => (
          <div key={i} className="p-6 bg-gray-50/50 border border-transparent hover:border-gray-100 hover:bg-white rounded-[32px] transition-all flex items-center justify-between group">
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary font-black text-sm">
                #{i+1}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{p.name}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{p.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-12">
              <div className="text-right">
                <p className="text-sm font-black text-primary">{p.score} pts</p>
                <p className="text-[10px] text-green-500 font-bold">{p.trend}</p>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-6">
      <div className="bg-gray-900 rounded-[40px] p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-6">Métricas de Retenção</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-normal mb-2">Turnover Mês</p>
              <h4 className="text-3xl font-black">2.4%</h4>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingUp size={14} className="rotate-180" /> -0.8% saudável</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-normal mb-2">Tempo Médio Casa</p>
              <h4 className="text-3xl font-black">2.8 anos</h4>
              <p className="text-xs text-primary mt-1">+0.4 anos vs 2023</p>
            </div>
          </div>
        </div>
        <Award size={150} className="absolute -right-12 -bottom-12 opacity-5 text-white" />
      </div>

      <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-normal mb-6">Frequência e Jornada</h3>
        <div className="h-40 flex items-end gap-2">
          {[60, 80, 45, 90, 70, 85, 100].map((h, i) => (
            <div key={i} className="flex-1 bg-gray-100 rounded-t-lg relative group">
              <div className="absolute bottom-0 left-0 right-0 bg-primary/20 group-hover:bg-primary transition-all rounded-t-lg" style={{ height: `${h}%` }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3 text-[9px] font-black text-gray-400 uppercase tracking-normal">
          <span>Seg</span>
          <span>Dom</span>
        </div>
      </div>
    </div>
  </div>
);

const ColaboradorPerfilView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const collaboratorsData: Record<string, any> = {
    roberto: {
      name: 'Roberto Silva',
      role: 'Motorista de Pesados',
      type: 'CLT',
      date: '12/01/2022',
      salary: 'R$ 5.400,00',
      status: 'Ativo',
      email: 'roberto.silva@logtasf.com.br',
      phone: '(47) 99122-3344',
      cnh: 'Cat. E (Venc. 05/2026)',
      aso: 'Apto (Venc. 12/2026)',
      bank: 'Banco do Brasil - Ag: 1234 - CC: 56789-0',
      performance: 92,
      deliveries: 142,
    },
    ana: {
      name: 'Ana Paula Lima',
      role: 'Gerente Logística',
      type: 'CLT',
      date: '05/03/2021',
      salary: 'R$ 8.200,00',
      status: 'Ativo',
      email: 'ana.lima@logtasf.com.br',
      phone: '(47) 98877-6655',
      cnh: 'Cat. B (Venc. 10/2028)',
      aso: 'Apto (Venc. 03/2027)',
      bank: 'Itaú - Ag: 4321 - CC: 98765-4',
      performance: 95,
      deliveries: 0,
    },
    carlos: {
      name: 'Carlos Reis',
      role: 'Motorista Agregado',
      type: 'PJ',
      date: '20/11/2023',
      salary: 'Variável (R$ 6.120 Média)',
      status: 'Férias',
      email: 'carlos.reis@agregados.com.br',
      phone: '(47) 99655-4433',
      cnh: 'Cat. E (Venc. 08/2026)',
      aso: 'Apto (Venc. 11/2026)',
      bank: 'Bradesco - Ag: 9876 - CC: 12345-6',
      performance: 88,
      deliveries: 98,
    }
  };

  const collaborator = collaboratorsData[id || 'ana'] || collaboratorsData.ana;
  const [formData, setFormData] = React.useState({ ...collaborator });
  const [saved, setSaved] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    if ((window as any).showToast) {
      (window as any).showToast('success', `Registro de ${formData.name || 'colaborador'} salvo com sucesso!`, 'Cadastro Atualizado');
    }
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* Return Button */}
      <button 
        onClick={() => navigate('/rh/equipe')}
        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Voltar para Gestão de Equipe
      </button>

      {/* Main Profile Header */}
      <div className="bg-transparent border-none p-0 shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full overflow-hidden border-2 border-white shadow-sm">
            <img src={`https://i.pravatar.cc/150?u=${id === 'ana' ? 1 : id === 'roberto' ? 0 : 2}`} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">{formData.name}</h2>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-normal ${
                formData.status === 'Ativo' ? 'bg-green-100 text-green-700' : 
                formData.status === 'Férias' ? 'bg-blue-100 text-blue-700' : 
                'bg-gray-100 text-gray-500'
              }`}>
                {formData.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-normal">{formData.role} • Contrato {formData.type}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs transition-all flex items-center gap-2">
            <FileText size={15} /> Holerites
          </button>
          <button className="px-5 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all flex items-center gap-2 shadow-sm">
            <ShieldCheck size={15} /> Validar Docs
          </button>
        </div>
      </div>

      {/* Technical specs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Salário Base', value: formData.salary, sub: 'Vencimento Mensal' },
          { label: 'Data de Admissão', value: formData.date, sub: 'Tempo de Casa' },
          { label: 'Score de Performance', value: `${formData.performance} pts`, sub: 'Logta AI Score' },
          { label: 'Viagens Entregues', value: formData.deliveries, sub: 'Produtividade Ativa' },
        ].map((m, i) => (
          <div key={i} className="bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">{m.label}</p>
            <h4 className="text-2xl font-black text-gray-900">{m.value}</h4>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-normal mt-2">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Briefcase size={20} className="text-primary" /> Ficha de Registro Funcional
          </h3>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-gray-900 outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-1">Cargo / Função</label>
                <input 
                  type="text" 
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-gray-900 outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-1">E-mail Profissional</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-gray-900 outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-1">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-gray-900 outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-1">Dados Bancários para Crédito</label>
                <input 
                  type="text" 
                  value={formData.bank}
                  onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-gray-900 outline-none focus:border-primary/50 transition-all text-sm font-semibold col-span-1 md:col-span-2"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              {saved && (
                <p className="text-xs font-black text-green-600 flex items-center gap-1 bg-green-50 px-4 py-2 rounded-xl border border-green-100 animate-pulse">
                  ✓ Alterações salvas com sucesso!
                </p>
              )}
              <div />
              <button 
                type="submit"
                className="px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Status Column */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ShieldCheck size={20} className="text-green-500" /> Documentação & Saúde
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Exame Admissional / Periódico (ASO)', status: 'Válido', val: formData.aso, color: 'bg-green-50 text-green-700' },
                { label: 'Carteira de Habilitação (CNH)', status: 'Válida', val: formData.cnh, color: 'bg-green-50 text-green-700' },
                { label: 'Ficha de Registro de EPIs', status: 'Entregue', val: 'Assinada via Gov.br', color: 'bg-gray-100 text-gray-700' },
                { label: 'Termo de Confidencialidade (NDA)', status: 'Assinado', val: 'Válido por tempo indet.', color: 'bg-gray-100 text-gray-700' },
              ].map((doc, i) => (
                <div key={i} className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-gray-900">{doc.label}</p>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${doc.color}`}>{doc.status}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-semibold">{doc.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RH;
