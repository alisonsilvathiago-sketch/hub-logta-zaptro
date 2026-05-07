import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  FileText, 
  Truck, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Globe, 
  FileCode, 
  Mail, 
  Trash2,
  ChevronRight,
  MoreVertical,
  Activity,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { supabase } from '@shared/lib/supabase';

export const syncFileToLogDock = async (docName: string, category: 'xmls' | 'comprovantes' | 'contratos', size: number, type: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    const company_id = profile?.company_id || 'comp-default';

    await supabase.from('files').insert({
      name: docName,
      company_id,
      user_id: user.id,
      size,
      type,
      category,
      path: `uploads/${user.id}/${docName}`,
      metadata: { source: 'logta_saas', synced_at: new Date().toISOString() }
    });
    console.log('Sincronizado ao LogDock Central Drive:', docName);
  } catch (err: any) {
    console.warn('Erro no sync do LogDock:', err.message);
  }
};

const Documentos = () => {
  const location = useLocation();
  const [selectedCte, setSelectedCte] = React.useState<any>(null);
  const [selectedMdfe, setSelectedMdfe] = React.useState<any>(null);
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard Fiscal', icon: Activity, path: '/documentos/dashboard' },
    { id: 'cte', label: 'Gestão de CT-e', icon: FileText, path: '/documentos/cte' },
    { id: 'mdfe', label: 'Gestão de MDF-e', icon: Truck, path: '/documentos/mdfe' },
    { id: 'rejeitados', label: 'Rejeições & Erros', icon: AlertCircle, path: '/documentos/rejeitados' },
  ];

  return (
    <div className="px-16 py-10 w-full h-full space-y-8 animate-in fade-in duration-700">
      {/* Header & SEFAZ Status */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Documentos Fiscais</h1>
          <p className="text-xs text-gray-400 font-medium mt-1">Emissão, controle e auditoria de CT-e e MDF-e integrados à SEFAZ.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
            <Globe size={18} className="text-green-500" />
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-normal">Status SEFAZ</p>
              <p className="text-xs font-bold text-gray-900">Servidores Online</p>
            </div>
          </div>
          <button className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <Plus size={18} /> Emitir Documento
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Native Links) */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-[24px] w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path) || (location.pathname === '/documentos' && tab.id === 'dashboard');
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
          <Route index element={<Navigate to="/documentos/dashboard" replace />} />
          <Route path="dashboard" element={<FiscalDashboardView />} />
          <Route path="cte" element={<CteManagementView onSelect={setSelectedCte} />} />
          <Route path="mdfe" element={<MdfeManagementView onSelect={setSelectedMdfe} />} />
          <Route path="rejeitados" element={<RejectedDocsView />} />
        </Routes>
      </div>

      {/* Charcoal Detail Popup Modal for Selected CT-e */}
      {selectedCte && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#18191B] rounded-[40px] border border-neutral-800 shadow-2xl p-8 max-w-xl w-full text-left animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-neutral-800">
              <div>
                <span className={`text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-normal block w-fit mb-2 ${selectedCte.status === 'Autorizado' ? 'bg-green-500/10 text-green-400' : selectedCte.status === 'Rejeitado' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  Protocolo SEFAZ • {selectedCte.status}
                </span>
                <h3 className="text-2xl font-black text-white leading-none tracking-tight">
                  CT-e #{selectedCte.nr}
                </h3>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-normal mt-1.5">
                  Conhecimento de Transporte Eletrônico
                </p>
              </div>
              <button 
                onClick={() => setSelectedCte(null)}
                className="w-10 h-10 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl flex items-center justify-center transition-all cursor-pointer"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-6">
              <div className="p-5 bg-neutral-900 rounded-3xl border border-neutral-800 space-y-4">
                <div>
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-1">Chave de Acesso SEFAZ</p>
                  <p className="text-xs font-mono text-neutral-300 break-all bg-neutral-950 p-3 rounded-xl border border-neutral-800 leading-normal">
                    3526 0503 2219 0800 0144 5700 1000 0124 0110 {selectedCte.nr}60 9011
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-0.5">Tomador do Serviço</p>
                  <p className="text-xs font-bold text-white">{selectedCte.client}</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-0.5">Emissão</p>
                  <p className="text-xs font-bold text-white">{selectedCte.date}</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-0.5">Trajeto</p>
                  <p className="text-xs font-bold text-white">{selectedCte.origin} → {selectedCte.dest}</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-0.5">Base de Cálculo ICMS</p>
                  <p className="text-xs font-bold text-white">R$ 540,00 (12%)</p>
                </div>
              </div>

              <div className="p-5 bg-neutral-900 rounded-3xl border border-neutral-800 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal">Valor do Frete</p>
                  <p className="text-lg font-black text-primary">{selectedCte.value}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal">Seguradora</p>
                  <p className="text-xs font-bold text-white">Tokio Marine S/A</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedCte(null)}
                className="px-6 py-3 bg-neutral-900 border border-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-normal transition-all cursor-pointer hover:bg-neutral-800"
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  if ((window as any).showToast) {
                    (window as any).showToast('success', 'XML do documento baixado com sucesso!', 'XML Salvo');
                  }
                  setSelectedCte(null);
                }}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl text-xs uppercase tracking-normal transition-all cursor-pointer hover:opacity-95"
              >
                Baixar XML
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Charcoal Detail Popup Modal for Selected MDF-e */}
      {selectedMdfe && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#18191B] rounded-[40px] border border-neutral-800 shadow-2xl p-8 max-w-xl w-full text-left animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-neutral-800">
              <div>
                <span className={`text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-normal block w-fit mb-2 ${selectedMdfe.status === 'Autorizado' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  MANIFESTO SEFAZ • {selectedMdfe.status}
                </span>
                <h3 className="text-2xl font-black text-white leading-none tracking-tight">
                  MDF-e #{selectedMdfe.nr}
                </h3>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-normal mt-1.5">
                  Manifesto Eletrônico de Documentos Fiscais
                </p>
              </div>
              <button 
                onClick={() => setSelectedMdfe(null)}
                className="w-10 h-10 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl flex items-center justify-center transition-all cursor-pointer"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-0.5">Veículo / Placa</p>
                  <p className="text-xs font-bold text-white">{selectedMdfe.plate}</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-0.5">Motorista Responsável</p>
                  <p className="text-xs font-bold text-white">{selectedMdfe.driver}</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-0.5">Trajeto das Divisas</p>
                  <p className="text-xs font-bold text-white">{selectedMdfe.ufs}</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-0.5">CIOT Registrado</p>
                  <p className="text-xs font-bold text-white">889102-12 (Ativo)</p>
                </div>
              </div>

              <div className="p-5 bg-neutral-900 rounded-3xl border border-neutral-800 space-y-3">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-normal">Carga e Documentação</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">CT-es Vinculados</span>
                  <span className="text-primary font-bold">{selectedMdfe.docs} Documentos</span>
                </div>
                <div className="w-full h-[1px] bg-neutral-800" />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Peso Bruto da Carga</span>
                  <span className="text-white font-bold">24.500 kg</span>
                </div>
                <div className="w-full h-[1px] bg-neutral-800" />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Vale Pedágio (Sem Parar)</span>
                  <span className="text-white font-bold">R$ 840,00</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedMdfe(null)}
                className="px-6 py-3 bg-neutral-900 border border-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-normal transition-all cursor-pointer hover:bg-neutral-800"
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  if ((window as any).showToast) {
                    (window as any).showToast('success', 'MDF-e encerrado com sucesso na SEFAZ!', 'Manifesto Encerrado');
                  }
                  setSelectedMdfe(null);
                }}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl text-xs uppercase tracking-normal transition-all cursor-pointer hover:opacity-95"
              >
                Encerrar Manifesto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-View Components ---

const FiscalDashboardView = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[
        { label: 'CT-e Emitidos (Mês)', value: '1,240', color: 'text-gray-900', icon: FileText },
        { label: 'MDF-e Ativos', value: '42', color: 'text-blue-500', icon: Truck },
        { label: 'Pendentes SEFAZ', value: '03', color: 'text-yellow-500', icon: Clock },
        { label: 'Rejeitados', value: '01', color: 'text-red-500', icon: AlertCircle },
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
        <h3 className="text-xl font-bold text-gray-900 mb-8">Volume de Faturamento Fiscal</h3>
        <div className="h-64 flex items-end gap-3 px-4">
          {[40, 60, 45, 90, 65, 80, 100, 55, 75, 85, 45, 95].map((h, i) => (
            <div key={i} className="flex-1 bg-gray-50 rounded-t-xl relative group cursor-pointer hover:bg-primary/10 transition-all">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-primary/20 rounded-t-xl group-hover:bg-primary transition-all" 
                style={{ height: `${h}%` }} 
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-normal">
          <span>Jan</span>
          <span>Jun</span>
          <span>Dez</span>
        </div>
      </div>

      <div className="bg-gray-900 rounded-[40px] p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-6">Alertas Fiscais</h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs font-bold text-yellow-500 uppercase tracking-normal mb-1">Certificado Digital</p>
              <p className="text-sm font-medium text-gray-300">Expira em 12 dias. Favor renovar para evitar interrupções.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs font-bold text-red-500 uppercase tracking-normal mb-1">MDF-e não encerrado</p>
              <p className="text-sm font-medium text-gray-300">Placa BRA-2L22 possui manifesto em aberto há 48h.</p>
            </div>
          </div>
        </div>
        <FileCode size={120} className="absolute -right-8 -bottom-8 opacity-5 text-white" />
      </div>
    </div>
  </div>
);

const CteManagementView = ({ onSelect }: { onSelect: (cte: any) => void }) => (
  <div className="space-y-6">
    <div className="flex gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar CT-e por número, cliente ou chave..." 
          className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 outline-none focus:border-primary/50 transition-all shadow-sm"
        />
      </div>
      <button className="px-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:text-gray-900 transition-all flex items-center gap-2 shadow-sm font-bold">
        <Filter size={20} /> Filtros Avançados
      </button>
    </div>

    <div className="bg-white border border-gray-200 rounded-[40px] overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Número / Emissão</th>
            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Cliente / Tomador</th>
            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Origem → Destino</th>
            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal text-right">Valor Frete</th>
            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Status</th>
            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[
            { nr: '12401', date: '05/05 10:30', client: 'Transportes Transville', origin: 'SP', dest: 'PR', value: 'R$ 4.500,00', status: 'Autorizado' },
            { nr: '12402', date: '05/05 11:15', client: 'Varejo Global LTDA', origin: 'RJ', dest: 'MG', value: 'R$ 2.800,00', status: 'Pendente' },
            { nr: '12403', date: '05/05 12:00', client: 'Indústria Metal SA', origin: 'SP', dest: 'ES', value: 'R$ 8.200,00', status: 'Rejeitado', warning: true },
          ].map((cte, i) => (
            <tr 
              key={i} 
              onClick={() => onSelect(cte)}
              className="hover:bg-gray-50 transition-colors group cursor-pointer"
            >
              <td className="px-8 py-6">
                <div>
                  <p className="font-bold text-gray-900">CT-e {cte.nr}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{cte.date}</p>
                </div>
              </td>
              <td className="px-8 py-6">
                <p className="text-xs font-bold text-gray-900">{cte.client}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-normal">CNPJ: 00.000.000/0001-00</p>
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                  <span>{cte.origin}</span>
                  <ChevronRight size={12} className="text-gray-300" />
                  <span>{cte.dest}</span>
                </div>
              </td>
              <td className="px-8 py-6 text-right">
                <p className="text-sm font-black text-gray-900">{cte.value}</p>
              </td>
              <td className="px-8 py-6">
                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-normal ${
                  cte.status === 'Autorizado' ? 'bg-green-100 text-green-700' : 
                  cte.status === 'Rejeitado' ? 'bg-red-100 text-red-700' : 
                  'bg-blue-100 text-blue-700'
                }`}>
                  {cte.status}
                </span>
              </td>
              <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center gap-2">
                  <button 
                    title="Baixar PDF" 
                    onClick={() => {
                      syncFileToLogDock(`cte_${cte.nr}_comprovante.pdf`, 'comprovantes', 125000, 'application/pdf');
                      alert(`Download do PDF (CT-e #${cte.nr}) iniciado. Cópia arquivada automaticamente no LogDock.`);
                    }}
                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                  >
                    <FileText size={18} />
                  </button>
                  <button 
                    title="Baixar XML" 
                    onClick={() => {
                      syncFileToLogDock(`cte_${cte.nr}_nota.xml`, 'xmls', 45000, 'text/xml');
                      alert(`XML do CT-e #${cte.nr} baixado com sucesso. Cópia arquivada no LogDock.`);
                    }}
                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                  >
                    <FileCode size={18} />
                  </button>
                  <button title="Enviar E-mail" className="p-2 text-gray-400 hover:text-primary transition-colors"><Mail size={18} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const MdfeManagementView = ({ onSelect }: { onSelect: (mdfe: any) => void }) => (
  <div className="space-y-6">
    <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/10 flex items-center justify-between">
      <div>
        <h3 className="text-xl font-bold text-primary mb-2">Manifesto de Documentos (MDF-e)</h3>
        <p className="text-sm text-gray-600 font-medium">Agrupe seus CT-es autorizados para liberar a viagem do veículo.</p>
      </div>
      <button className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2">
        <Truck size={20} /> Novo MDF-e
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { nr: '4450', plate: 'BRA-2L22', driver: 'Roberto Silva', ufs: 'SP → PR', status: 'Autorizado', docs: 8 },
        { nr: '4451', plate: 'KJU-9011', driver: 'Ana Paula', ufs: 'RJ → MG', status: 'Aberto', docs: 3 },
      ].map((mdfe, i) => (
        <div key={i} className="bg-white border border-gray-200 p-6 rounded-[32px] shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
              <Truck size={24} />
            </div>
            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-normal ${
              mdfe.status === 'Autorizado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {mdfe.status}
            </span>
          </div>
          <div className="space-y-1 mb-6">
            <h4 className="text-lg font-bold text-gray-900 tracking-tight">MDF-e #{mdfe.nr}</h4>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-normal">{mdfe.ufs}</p>
          </div>
          <div className="space-y-3 pt-6 border-t border-gray-50">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-400">Veículo</span>
              <span className="text-gray-900 font-bold">{mdfe.plate}</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-400">Motorista</span>
              <span className="text-gray-900 font-bold">{mdfe.driver}</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-400">CT-es Vinculados</span>
              <span className="text-primary font-bold">{mdfe.docs} docs</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-8">
            <button onClick={() => onSelect(mdfe)} className="py-3 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-bold hover:bg-gray-100 transition-all">Visualizar</button>
            <button onClick={() => onSelect(mdfe)} className="py-3 bg-gray-900 text-white rounded-xl text-[10px] font-bold hover:bg-black transition-all">Encerrar</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RejectedDocsView = () => (
  <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
        <AlertCircle size={24} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900">Rejeições & Inconsistências</h3>
        <p className="text-sm text-gray-500 font-medium">Analise os motivos de rejeição da SEFAZ e corrija os documentos.</p>
      </div>
    </div>

    <div className="space-y-4">
      {[
        { id: 'CT-e 12403', code: '225', msg: 'Rejeição: Falha no Esquema XML do lote de CT-e.', severity: 'Alta', time: '12:05' },
        { id: 'CT-e 12405', code: '539', msg: 'Rejeição: Duplicidade de CT-e, com diferença na Chave de Acesso.', severity: 'Média', time: '11:45' },
      ].map((err, i) => (
        <div key={i} className="p-6 bg-red-50/50 border border-red-100 rounded-3xl flex items-start gap-6 hover:bg-red-50 transition-all cursor-pointer group">
          <div className="text-center min-w-[80px]">
            <p className="text-[10px] font-black text-red-600 uppercase mb-1">Cód. {err.code}</p>
            <p className="text-xs font-black text-gray-400 uppercase">{err.time}</p>
          </div>
          <div className="h-10 w-[1px] bg-red-100 mt-2" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900 mb-1">{err.id}</h4>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">{err.msg}</p>
          </div>
          <button className="px-4 py-2 bg-white text-red-600 rounded-xl text-[10px] font-black uppercase tracking-normal border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-all">Corrigir Agora</button>
        </div>
      ))}
    </div>
  </div>
);

export default Documentos;
