import React from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate, useParams } from 'react-router-dom';
import { 
  Truck, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  MapPin, 
  Clock, 
  DollarSign, 
  FileText, 
  AlertCircle,
  BarChart3,
  ChevronRight,
  User,
  Package,
  Activity,
  ArrowUpRight,
  Map as MapIcon,
  ArrowLeft,
  Phone,
  Shield,
  Download,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

const Fretes = () => {
  const location = useLocation();
  const isDetailPage = /^\/fretes\/lista\/.+/.test(location.pathname);
  
  const [isNovoFreteOpen, setIsNovoFreteOpen] = React.useState(false);
  const [novoFreteForm, setNovoFreteForm] = React.useState({
    client: '',
    origin: '',
    dest: '',
    driver: '',
    plate: '',
    value: '',
    type: 'Expresso'
  });

  const handleCreateFrete = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `FR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newFrete = {
      id: newId,
      client: novoFreteForm.client || 'Novo Cliente',
      clientId: 'transville', 
      origin: novoFreteForm.origin || 'Origem não definida',
      dest: novoFreteForm.dest || 'Destino não definido',
      driver: novoFreteForm.driver || 'Sem motorista',
      plate: novoFreteForm.plate || 'Sem placa',
      status: 'Coleta Agendada',
      value: novoFreteForm.value.startsWith('R$') ? novoFreteForm.value : `R$ ${novoFreteForm.value || '1.500,00'}`,
      type: novoFreteForm.type
    };

    const stored = localStorage.getItem('custom_fretes');
    const existing = stored ? JSON.parse(stored) : [];
    localStorage.setItem('custom_fretes', JSON.stringify([newFrete, ...existing]));

    setIsNovoFreteOpen(false);
    setNovoFreteForm({ client: '', origin: '', dest: '', driver: '', plate: '', value: '', type: 'Expresso' });

    window.dispatchEvent(new Event('storage'));

    if ((window as any).showToast) {
      (window as any).showToast('success', `Operação de frete ${newId} criada com sucesso!`, 'Frete Agendado');
    }
  };
  
  const tabs = [
    { id: 'lista', label: 'Lista de Fretes', icon: Truck, path: '/fretes/lista' },
    { id: 'kanban', label: 'Kanban Operacional', icon: Activity, path: '/fretes/kanban' },
    { id: 'rastreamento', label: 'Rastreamento (Live)', icon: MapIcon, path: '/fretes/rastreamento' },
    { id: 'financeiro', label: 'Financeiro do Frete', icon: DollarSign, path: '/fretes/financeiro' },
  ];

  if (isDetailPage) {
    return (
      <div className="px-16 py-10 w-full h-full animate-in fade-in duration-500 text-left overflow-y-auto scrollbar-hide">
        <Routes>
          <Route path="lista/:id" element={<FreteDetalheView />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="px-16 py-10 w-full h-full space-y-8 animate-in fade-in duration-700 text-left overflow-y-auto scrollbar-hide">
      {/* Metrics Section (Top) */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Fretes Hoje', value: '42', color: 'text-primary' },
          { label: 'Em Trânsito', value: '18', color: 'text-blue-500' },
          { label: 'Entregues', value: '22', color: 'text-green-500' },
          { label: 'Atrasados', value: '02', color: 'text-red-500' },
          { label: 'Receita Dia', value: 'R$ 15.4k', color: 'text-gray-900' },
          { label: 'Lucro Est.', value: 'R$ 4.2k', color: 'text-primary' },
        ].map((m, i) => (
          <div key={i} className="bg-white border border-gray-100 p-4 rounded-[24px] shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-1">{m.label}</p>
            <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Header Section */}
      <div className="flex justify-between items-end h-[87px]">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight h-[46px] mt-[74px]">Gestão de Fretes</h1>
          <p className="text-xs text-gray-400 font-medium mt-1">Controle total da jornada da carga, do pedido à entrega final.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              if ((window as any).showToast) {
                (window as any).showToast('success', 'Relatório operacional de fretes exportado com sucesso!', 'Relatório Exportado');
              } else {
                alert('Relatório de fretes exportado com sucesso!');
              }
            }}
            className="px-6 py-3.5 bg-white text-gray-700 rounded-xl text-sm font-bold border border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Download size={16} /> Exportar Relatório
          </button>
          <button 
            onClick={() => setIsNovoFreteOpen(true)}
            className="px-6 py-3.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Novo Frete
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Native Links) */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-[24px] w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path) || (location.pathname === '/fretes' && tab.id === 'lista');
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
          <Route index element={<Navigate to="/fretes/lista" replace />} />
          <Route path="lista" element={<FretesListaView />} />
          <Route path="lista/:id" element={<FreteDetalheView />} />
          <Route path="kanban" element={<FretesKanbanView />} />
          <Route path="rastreamento" element={<FretesRastreamentoView />} />
          <Route path="financeiro" element={<FretesFinanceiroView />} />
        </Routes>
      </div>
    </div>
  );
};

// --- Sub-View Components ---

const FretesListaView = () => {
  const navigate = useNavigate();

  const fretes = [
    { id: 'FR-8890', client: 'Transportes Transville', clientId: 'transville', origin: 'São Paulo, SP', dest: 'Curitiba, PR', driver: 'Roberto Silva', plate: 'BRA-2L22', status: 'Em Trânsito', value: 'R$ 4.500,00', type: 'Expresso' },
    { id: 'FR-8891', client: 'Varejo Global LTDA', clientId: 'global', origin: 'Rio de Janeiro, RJ', dest: 'Belo Horizonte, MG', driver: 'Ana Paula', plate: 'KJU-9011', status: 'Entregue', value: 'R$ 2.800,00', type: 'Normal' },
    { id: 'FR-8892', client: 'Indústria Metal SA', clientId: 'metalurgica', origin: 'Campinas, SP', dest: 'Vitória, ES', driver: 'Carlos Lima', plate: 'MNH-4455', status: 'Atrasado', value: 'R$ 8.200,00', type: 'Dedicado', warning: true },
    { id: 'FR-8893', client: 'AgroBrasil Log', clientId: 'agrobrasil', origin: 'Cuiabá, MT', dest: 'Santos, SP', driver: 'Marcos Reis', plate: 'PKO-0012', status: 'Coleta Agendada', value: 'R$ 12.000,00', type: 'Pesado' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por ID, Cliente, Motorista ou Placa..." 
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 outline-none focus:border-primary/50 transition-all shadow-sm"
          />
        </div>
        <button className="px-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:text-gray-900 transition-all flex items-center gap-2 shadow-sm font-bold">
          <Filter size={20} /> Filtros de Operação
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-[40px] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">ID / Cliente</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Origem → Destino</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Motorista / Veículo</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fretes.map((frete) => (
              <tr 
                key={frete.id} 
                onClick={() => navigate(`/fretes/lista/${frete.id}`)}
                className="hover:bg-gray-50 transition-colors group cursor-pointer"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{frete.id}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-normal">{frete.client}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{frete.origin}</span>
                    <ChevronRight size={12} className="text-gray-300 my-0.5" />
                    <span className="text-sm font-bold text-gray-900">{frete.dest}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">{frete.driver}</p>
                      <p className="text-[10px] text-gray-500 font-medium">Placa: {frete.plate}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-normal ${
                    frete.status === 'Entregue' ? 'bg-green-100 text-green-700' : 
                    frete.status === 'Atrasado' ? 'bg-red-100 text-red-700 animate-pulse' : 
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {frete.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <p className="text-sm font-black text-gray-900">{frete.value}</p>
                  <p className="text-[10px] text-gray-400 font-bold">{frete.type}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- FRETE DETALHE VIEW (HIGH FIDELITY FREIGHT WORKSPACE) ---

const FreteDetalheView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Custom rich data depending on freight ID
  const fretesData: Record<string, any> = {
    'FR-8890': {
      id: 'FR-8890',
      client: 'Transportes Transville',
      clientId: 'transville',
      origin: 'São Paulo, SP',
      dest: 'Curitiba, PR',
      driver: 'Roberto Silva',
      plate: 'BRA-2L22',
      status: 'Em Trânsito',
      value: 'R$ 4.500,00',
      type: 'Expresso',
      eta: '2h 15m',
      distance: '412 km',
      progress: 65,
      driverPhone: '(11) 98122-4455',
      driverCnh: '44591280-AA',
      cargoType: 'Carga Fracionada',
      weight: '14.200 kg',
      insurance: 'Porto Seguro S/A',
      policy: '#99812-AF',
      driverCost: 'R$ 2.800,00',
      tollCost: 'R$ 450,00',
      dieselCost: 'R$ 800,00',
      balance: 'R$ 1.250,00',
      cte: '12401',
      mdfe: '4450',
      logs: [
        { time: '05/05 10:30', status: 'Início do Trânsito', text: 'Veículo iniciou viagem do CD São Paulo.' },
        { time: '05/05 08:00', status: 'Coleta Concluída', text: 'Carga carregada com sucesso e lacrada.' }
      ]
    },
    'FR-8891': {
      id: 'FR-8891',
      client: 'Varejo Global LTDA',
      clientId: 'global',
      origin: 'Rio de Janeiro, RJ',
      dest: 'Belo Horizonte, MG',
      driver: 'Ana Paula',
      plate: 'KJU-9011',
      status: 'Entregue',
      value: 'R$ 2.800,00',
      type: 'Normal',
      eta: 'Entregue',
      distance: '434 km',
      progress: 100,
      driverPhone: '(21) 97711-3322',
      driverCnh: '90812344-BB',
      cargoType: 'E-commerce (Geral)',
      weight: '4.800 kg',
      insurance: 'Allianz Seguros',
      policy: '#100234-X',
      driverCost: 'R$ 1.800,00',
      tollCost: 'R$ 320,00',
      dieselCost: 'R$ 680,00',
      balance: 'R$ 0,00',
      cte: '12402',
      mdfe: '4451',
      logs: [
        { time: '05/05 15:45', status: 'Entregue', text: 'Mercadoria entregue no CD de destino em BH.' },
        { time: '05/05 07:15', status: 'Em Trânsito', text: 'Veículo em deslocamento na BR-040.' }
      ]
    },
    'FR-8892': {
      id: 'FR-8892',
      client: 'Indústria Metal SA',
      clientId: 'metalurgica',
      origin: 'Campinas, SP',
      dest: 'Vitória, ES',
      driver: 'Carlos Lima',
      plate: 'MNH-4455',
      status: 'Atrasado',
      value: 'R$ 8.200,00',
      type: 'Dedicado',
      eta: 'Atrasado (Congestionamento)',
      distance: '912 km',
      progress: 40,
      driverPhone: '(19) 98822-1144',
      driverCnh: '12435012-CC',
      cargoType: 'Bobinas de Aço',
      weight: '24.000 kg',
      insurance: 'Mapfre Seguros',
      policy: '#889102-Y',
      driverCost: 'R$ 4.500,00',
      tollCost: 'R$ 850,00',
      dieselCost: 'R$ 1.500,00',
      balance: 'R$ 1.350,00',
      cte: '12403',
      mdfe: '4452',
      logs: [
        { time: '05/05 12:00', status: 'Parado', text: 'Motorista relata tráfego congestionado na BR-101.' },
        { time: '04/05 18:00', status: 'Em Trânsito', text: 'Viagem iniciada de Campinas.' }
      ]
    },
    'FR-8893': {
      id: 'FR-8893',
      client: 'AgroBrasil Log',
      clientId: 'agrobrasil',
      origin: 'Cuiabá, MT',
      dest: 'Santos, SP',
      driver: 'Marcos Reis',
      plate: 'PKO-0012',
      status: 'Coleta Agendada',
      value: 'R$ 12.000,00',
      type: 'Pesado',
      eta: 'Coleta Agendada',
      distance: '1.620 km',
      progress: 5,
      driverPhone: '(65) 99211-5500',
      driverCnh: '88902120-DD',
      cargoType: 'Soja em Grãos',
      weight: '37.500 kg',
      insurance: 'Tokio Marine',
      policy: '#551203-Z',
      driverCost: 'R$ 8.200,00',
      tollCost: 'R$ 1.400,00',
      dieselCost: 'R$ 2.400,00',
      balance: 'R$ 0,00',
      cte: '12404',
      mdfe: '4453',
      logs: [
        { time: '05/05 14:00', status: 'Agendado', text: 'Ordem de coleta emitida ao motorista.' }
      ]
    }
  };

  const frete = fretesData[id || 'FR-8890'] || fretesData['FR-8890'];

  // State Management for Interactive Realtime Simulator
  const [progress, setProgress] = React.useState(frete.progress);
  const [eta, setEta] = React.useState(frete.eta);
  const [status, setStatus] = React.useState(frete.status);
  const [logs, setLogs] = React.useState<any[]>(frete.logs);
  const [isSimulating, setIsSimulating] = React.useState(false);

  // Fiscal simulation state variables
  const [cteNumber, setCteNumber] = React.useState(frete.cte);
  const [cteStatus, setCteStatus] = React.useState('Autorizado SEFAZ');
  const [mdfeNumber, setMdfeNumber] = React.useState(frete.mdfe);
  const [mdfeStatus, setMdfeStatus] = React.useState('Autorizado SEFAZ');
  const [isFiscalModalOpen, setIsFiscalModalOpen] = React.useState(false);
  const [fiscalModalStep, setFiscalModalStep] = React.useState('');

  const handleEmitirCte = () => {
    setIsFiscalModalOpen(true);
    setFiscalModalStep('Estabelecendo conexão segura com SEFAZ SP...');
    
    setTimeout(() => {
      setFiscalModalStep('Validando dados fiscais do frete e alíquotas de ICMS...');
    }, 1000);

    setTimeout(() => {
      setFiscalModalStep('Assinando digitalmente o XML com o Certificado Digital A1...');
    }, 2000);

    setTimeout(() => {
      setFiscalModalStep('Transmitindo lote de CT-e para o ambiente de produção da SEFAZ...');
    }, 3000);

    setTimeout(() => {
      setIsFiscalModalOpen(false);
      const nextNumber = String(Number(cteNumber) + 4);
      setCteNumber(nextNumber);
      setCteStatus('Autorizado SEFAZ');
      
      // Dynamic High-Fidelity Audio Feedback via native Web Audio API (success ping)
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {
        console.log(e);
      }

      if ((window as any).showToast) {
        (window as any).showToast('success', `CT-e #${nextNumber} autorizado com sucesso pela SEFAZ de São Paulo!`, 'SEFAZ Autorizado');
      }
    }, 4200);
  };

  const startSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setProgress(0);
    setStatus('Em Trânsito');
    setEta('4h 30m');
    setLogs([
      { time: 'Agora', status: 'Início do Trânsito', text: 'Motorista Roberto Silva iniciou a jornada.' }
    ]);

    if ((window as any).showToast) {
      (window as any).showToast('info', 'Motorista Roberto Silva iniciou a jornada.', 'Viagem Iniciada');
    }

    const timeline = [
      { 
        progress: 25, 
        eta: '3h 15m', 
        status: 'Em Trânsito', 
        log: { time: 'Agora + 2s', status: 'Em Rota', text: 'Caminhão BRA-2L22 entrou na Rodovia Régis Bittencourt.' },
        toast: { type: 'info', message: 'Caminhão BRA-2L22 entrou na Rodovia Régis Bittencourt.', title: 'Rodovia Régis' }
      },
      { 
        progress: 50, 
        eta: '2h 10m', 
        status: 'Em Trânsito', 
        log: { time: 'Agora + 4s', status: 'Pedágio Pago', text: 'Passou pelo pedágio de Registro/SP (Tag Sem Parar ativa).' },
        toast: { type: 'success', message: 'Passou pelo pedágio de Registro/SP (Tag Sem Parar ativa).', title: 'Pedágio Pago' }
      },
      { 
        progress: 75, 
        eta: '1h 05m', 
        status: 'Em Trânsito', 
        log: { time: 'Agora + 6s', status: 'Otimização AI', text: 'Trânsito leve detectado, rota recalculada pelo Logta AI.' },
        toast: { type: 'warning', message: 'Trânsito leve detectado, rota recalculada pelo Logta AI.', title: 'Otimização de Rota' }
      },
      { 
        progress: 100, 
        eta: 'Entregue', 
        status: 'Entregue', 
        log: { time: 'Agora + 8s', status: 'Concluído', text: 'Veículo chegou ao destino: Curitiba, PR!' },
        toast: { type: 'success', message: 'Veículo chegou ao destino: Curitiba, PR!', title: 'Entrega Concluída' }
      }
    ];

    timeline.forEach((step, index) => {
      setTimeout(() => {
        setProgress(step.progress);
        setEta(step.eta);
        setStatus(step.status);
        setLogs(prev => [step.log, ...prev]);
        if ((window as any).showToast) {
          (window as any).showToast(step.toast.type as any, step.toast.message, step.toast.title);
        }
        if (index === timeline.length - 1) {
          setIsSimulating(false);
        }
      }, (index + 1) * 2000);
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* Back Link */}
      <button 
        onClick={() => navigate('/fretes/lista')}
        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Voltar para Lista de Fretes
      </button>

      {/* Freight Header Card */}
      <div className="bg-transparent border-none p-0 shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center">
            <Package size={32} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">{frete.id}</h2>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-normal ${
                status === 'Entregue' ? 'bg-green-100 text-green-700' : 
                status === 'Atrasado' ? 'bg-red-100 text-red-700 animate-pulse' : 
                'bg-blue-100 text-blue-700'
              }`}>
                {status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-normal">Cliente:</span>
              <Link 
                to={`/crm/clientes/${frete.clientId}`}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 group"
              >
                {frete.client} <ExternalLink size={10} className="opacity-50 group-hover:opacity-100" />
              </Link>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-black text-sm uppercase tracking-normal transition-all cursor-pointer">Emitir Ocorrência</button>
          <button 
            onClick={startSimulation}
            disabled={isSimulating}
            className={`px-6 py-3.5 rounded-xl font-black text-sm uppercase tracking-normal transition-all shadow-lg cursor-pointer
              ${isSimulating 
                ? 'bg-primary text-white animate-pulse shadow-primary/20 cursor-wait' 
                : 'bg-gray-900 text-white hover:bg-black shadow-gray-950/20'}`}
          >
            {isSimulating ? 'Simulando Viagem...' : 'Iniciar Simulação'}
          </button>
        </div>
      </div>

      {/* Tracking and Progress Simulator */}
      <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-normal">Acompanhamento de Rota</h3>
            <p className="text-lg font-black text-gray-900">{frete.origin} → {frete.dest}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-bold uppercase">Previsão / ETA</p>
            <p className="text-lg font-black text-primary">{eta}</p>
          </div>
        </div>

        {/* Progress Bar with Truck Icon */}
        <div className="relative pt-6 pb-2">
          <div className="w-full h-2 bg-gray-100 rounded-full relative">
            <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
            <div 
              className="absolute top-1/2 -translate-y-1/2 -mt-3.5 bg-white border border-gray-200 shadow-lg w-10 h-10 rounded-full flex items-center justify-center text-primary transition-all duration-1000 ease-out"
              style={{ left: `calc(${progress}% - 20px)` }}
            >
              <Truck size={18} className="animate-pulse" />
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-normal mt-6">
            <span>{frete.origin}</span>
            <span>Distância Total: {frete.distance}</span>
            <span>{frete.dest}</span>
          </div>
        </div>
      </div>

      {/* Grid of Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT CARD: DRIVER & VEHICLE */}
        <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-gray-900 border-b border-gray-50 pb-4">Motorista & Veículo</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500">
              <User size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">{frete.driver}</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Placa: {frete.plate}</p>
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t border-gray-50 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase tracking-normal">Telefone:</span>
              <span className="font-bold text-gray-700">{frete.driverPhone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase tracking-normal">CNH Motorista:</span>
              <span className="font-bold text-gray-700">{frete.driverCnh}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase tracking-normal">Categoria Carga:</span>
              <span className="font-bold text-gray-700">{frete.cargoType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase tracking-normal">Peso Total:</span>
              <span className="font-bold text-gray-700">{frete.weight}</span>
            </div>
          </div>
        </div>

        {/* MIDDLE CARD: FINANCIAL BREAKDOWN */}
        <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-gray-900 border-b border-gray-50 pb-4">Custos & Financeiro</h3>
          <div className="space-y-4 text-xs font-medium">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-400 font-bold uppercase">Frete Motorista</span>
              <span className="font-bold text-gray-900">{frete.driverCost}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-400 font-bold uppercase">Pedágio Estimado</span>
              <span className="font-bold text-gray-900">{frete.tollCost}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-400 font-bold uppercase">Adiantamento Diesel</span>
              <span className="font-bold text-red-500">{frete.dieselCost}</span>
            </div>
            <div className="flex justify-between items-center py-2 text-sm font-black">
              <span className="text-gray-900 font-bold uppercase">Saldo de Viagem</span>
              <span className="text-primary">{frete.balance}</span>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: FISCAL & SAFETY */}
        <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-gray-900 border-b border-gray-50 pb-4">Documentação Fiscal</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-primary" />
                <div>
                  <p className="text-xs font-bold text-gray-900">CT-e #{cteNumber}</p>
                  <p className="text-[10px] text-green-600 font-black uppercase">{cteStatus}</p>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-primary transition-colors"><Download size={16} /></button>
            </div>

            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-primary" />
                <div>
                  <p className="text-xs font-bold text-gray-900">MDF-e #{mdfeNumber}</p>
                  <p className="text-[10px] text-green-600 font-black uppercase">{mdfeStatus}</p>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-primary transition-colors"><Download size={16} /></button>
            </div>

            <button 
              onClick={handleEmitirCte}
              className="w-full mt-2 py-3.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-black uppercase tracking-normal transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText size={14} /> Emitir Novo CT-e (SEFAZ)
            </button>
          </div>

          <div className="pt-4 border-t border-gray-50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-1">Apólice de Seguro</p>
            <p className="text-xs font-bold text-gray-700 leading-tight">{frete.insurance} ({frete.policy})</p>
          </div>
        </div>

      </div>

      {/* Realtime logs */}
      <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 mb-6">Logs e Ocorrências da Viagem</h3>
        <div className="space-y-6">
          {logs.map((log: any, idx: number) => (
            <div key={idx} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Clock size={14} />
              </div>
              <div>
                <span className="text-[9px] font-black text-gray-400 uppercase">{log.time} • {log.status}</span>
                <p className="text-xs text-gray-600 font-bold">{log.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isFiscalModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white border border-gray-100 rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={32} className="animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Conexão SEFAZ Ativa</h3>
            <div className="w-10 h-10 border-4 border-gray-100 border-t-primary rounded-full animate-spin mx-auto my-6" />
            <p className="text-xs text-gray-500 font-bold leading-relaxed transition-all min-h-[40px]">
              {fiscalModalStep}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const FretesKanbanView = () => {
  const columns = [
    { id: 'pedido', label: 'Pedido Recebido', color: 'bg-gray-400' },
    { id: 'agendado', label: 'Coleta Agendada', color: 'bg-purple-500' },
    { id: 'transito', label: 'Em Trânsito', color: 'bg-blue-500' },
    { id: 'entrega', label: 'Saiu para Entrega', color: 'bg-yellow-500' },
    { id: 'concluido', label: 'Entregue', color: 'bg-green-500' },
    { id: 'problema', label: 'Ocorrências', color: 'bg-red-500' },
  ];

  return (
    <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
      {columns.map((col) => (
        <div key={col.id} className="min-w-[320px] bg-gray-50/50 rounded-[32px] p-6 border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${col.color}`} />
              {col.label}
            </h3>
            <span className="text-[10px] font-black text-gray-400 bg-white px-2 py-1 rounded-lg shadow-sm">2</span>
          </div>
          
          <div className="space-y-4 flex-1">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-primary/30 transition-all cursor-pointer group">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg uppercase tracking-normal">ID: #889{i}</span>
                  <div className="flex gap-1">
                    <Activity size={12} className="text-gray-300" />
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">Logística Express SP</h4>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-4">
                  <span>São Paulo</span>
                  <ChevronRight size={10} />
                  <span>Curitiba</span>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-primary rounded-full" style={{ width: '60%' }} />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100" />
                    <span className="text-[10px] font-bold text-gray-600">João M.</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">ETA: 4h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const FretesRastreamentoView = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
    <div className="lg:col-span-2 bg-gray-100 rounded-[40px] relative overflow-hidden h-[600px] border border-gray-200 flex items-center justify-center">
      <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-46.6333,-23.5505,10/1200x600?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTAwMHozN282YXloZzcyM3IifQ.0E_68nTM90yYvOT5v65_Cw')] bg-cover opacity-50" />
      <div className="relative z-10 text-center space-y-4">
        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl mx-auto animate-bounce">
          <Truck className="text-primary" size={32} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Mapa de Rastreamento Live</h3>
          <p className="text-sm text-gray-500 font-medium">Visualizando 18 fretes ativos em rota agora.</p>
        </div>
      </div>
      
      {/* Map UI Overlay */}
      <div className="absolute bottom-8 left-8 right-8 flex gap-4">
        {[
          { label: 'Roberto Silva', status: 'Em Rota', eta: '1h 20m', id: '#8890' },
          { label: 'Ana Paula', status: 'Parada', eta: '3h 15m', id: '#8891' },
        ].map((v, i) => (
          <div key={i} className="flex-1 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900">{v.label} ({v.id})</p>
              <p className="text-[10px] text-gray-500 font-bold">{v.status} • {v.eta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Ocorrências Recentes</h3>
        <div className="space-y-4">
          {[
            { type: 'Atraso', desc: 'Congestionamento na BR-116', time: '10m ago', color: 'text-red-500' },
            { type: 'Avaria', desc: 'Caixa danificada no descarregamento', time: '2h ago', color: 'text-red-500' },
            { type: 'Endereço', desc: 'Número não localizado (Curitiba)', time: '4h ago', color: 'text-yellow-500' },
          ].map((oc, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-white transition-all border border-transparent hover:border-gray-100 cursor-pointer">
              <div className={`p-2 rounded-lg bg-white shadow-sm ${oc.color}`}>
                <AlertCircle size={16} />
              </div>
              <div>
                <p className={`text-xs font-black ${oc.color} uppercase tracking-normal mb-0.5`}>{oc.type}</p>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">{oc.desc}</p>
                <p className="text-[10px] text-gray-400 font-bold mt-1">{oc.time}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all">Ver Todas Ocorrências</button>
      </div>
    </div>
  </div>
);

const FretesFinanceiroView = () => (
  <div className="space-y-8 text-left">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white border border-gray-200 p-8 rounded-[40px] shadow-sm relative overflow-hidden">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">Receita Total Fretes</p>
        <h4 className="text-3xl font-black text-gray-900">R$ 482.500</h4>
        <p className="text-xs font-bold text-green-600 mt-2 flex items-center gap-1"><ArrowUpRight size={14} /> +12.5% este mês</p>
        <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-gray-900">
          <DollarSign size={120} />
        </div>
      </div>
      <div className="bg-white border border-gray-200 p-8 rounded-[40px] shadow-sm relative overflow-hidden">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">Custo Operacional</p>
        <h4 className="text-3xl font-black text-red-500">R$ 312.400</h4>
        <p className="text-xs font-bold text-gray-400 mt-2">64.7% da receita</p>
      </div>
      <div className="bg-white border border-gray-200 p-8 rounded-[40px] shadow-sm relative overflow-hidden">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">Margem de Lucro</p>
        <h4 className="text-3xl font-black text-primary">R$ 170.100</h4>
        <p className="text-xs font-bold text-primary mt-2">35.3% líquido</p>
      </div>
    </div>

    <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-8">Fluxo de Caixa por Viagem</h3>
      <div className="space-y-4">
        {[
          { id: '#8890', route: 'SP → PR', revenue: 'R$ 4.500', cost: 'R$ 2.800', profit: 'R$ 1.700', margin: 38 },
          { id: '#8891', route: 'RJ → MG', revenue: 'R$ 2.800', cost: 'R$ 1.100', profit: 'R$ 1.700', margin: 60 },
          { id: '#8892', route: 'SP → ES', revenue: 'R$ 8.200', cost: 'R$ 6.100', profit: 'R$ 2.100', margin: 25 },
        ].map((f, i) => (
          <div key={i} className="flex items-center justify-between p-6 rounded-[32px] bg-gray-50/50 border border-transparent hover:border-gray-100 hover:bg-white transition-all">
            <div className="flex items-center gap-6">
              <div className="text-center min-w-[60px]">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-0.5">{f.id}</p>
                <p className="text-xs font-bold text-gray-900">{f.route}</p>
              </div>
              <div className="h-8 w-[1px] bg-gray-200" />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase mb-0.5">Receita</p>
                <p className="text-sm font-bold text-gray-900">{f.revenue}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase mb-0.5">Custo</p>
                <p className="text-sm font-bold text-red-500">{f.cost}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-0.5">Margem</p>
              <p className="text-lg font-black text-primary">{f.margin}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Fretes;
