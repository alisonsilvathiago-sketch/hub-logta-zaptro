import React from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
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
  Briefcase,
  Upload
} from 'lucide-react';
import { supabase } from '@shared/lib/supabase';
import { useHubEntitlements } from '../contexts/HubEntitlementsContext';
import { getHubLogDockDriveUrl } from '@/lib/hub';
import { LogtaEmptyState } from '../components/EmptyState';
import { LogtaWaveTabStrip } from '../components/LogtaWaveTabStrip';
import { LogtaModuleHeader } from '../components/LogtaModuleHeader';
import { LogtaModalHeader } from '../components/LogtaModalHeader';
import { LogtaLogDockUploadModal } from '../components/LogtaLogDockUploadModal';
import { showToast } from '../components/Toast';
import {
  FiscalIntelligenceProvider,
  FiscalAlertsInlinePanel,
  FiscalCentralDashboard,
  defaultFiscalStats,
} from '../modules/fiscal';
import { useTenant } from '../contexts/TenantContext';
import { getSandboxFiscalDocuments, resolveDemoCompanyId, shouldUseLogtaSandbox } from '../lib/seed';

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
  const navigate = useNavigate();
  const { config } = useTenant();
  const { entitlements } = useHubEntitlements();
  const fiscalSandbox = React.useMemo(() => {
    if (!shouldUseLogtaSandbox()) return null;
    return getSandboxFiscalDocuments(resolveDemoCompanyId(config?.id));
  }, [config?.id]);
  const [selectedCte, setSelectedCte] = React.useState<any>(null);
  const [selectedMdfe, setSelectedMdfe] = React.useState<any>(null);
  const [selectedRejection, setSelectedRejection] = React.useState<any>(null);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [isMdfeOpen, setIsMdfeOpen] = React.useState(false);
  const [isNovoDocOpen, setIsNovoDocOpen] = React.useState(false);

  if (entitlements && !entitlements.logdock.enabled) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <AlertCircle className="h-14 w-14 text-amber-500" />
        <h1 className="logta-page-title">LogDock Drive bloqueado</h1>
        <p className="max-w-md text-sm font-medium text-gray-600">
          O armazenamento fiscal está desativado para sua conta. O Hub Master controla limites e planos —
          assine ou solicite liberação ao seu consultor.
        </p>
        <a
          href={getHubLogDockDriveUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg"
        >
          Abrir LogDock Drive
        </a>
      </div>
    );
  }
  
  const tabs = [
    { id: 'dashboard', label: 'Painel', icon: Activity, path: '/documentos/dashboard' },
    { id: 'cte', label: 'CT-e', icon: FileText, path: '/documentos/cte' },
    { id: 'mdfe', label: 'MDF-e', icon: Truck, path: '/documentos/mdfe' },
    { id: 'rejeitados', label: 'Rejeições', icon: AlertCircle, path: '/documentos/rejeitados' },
  ];

  return (
    <FiscalIntelligenceProvider stats={fiscalSandbox?.fiscalStats ?? defaultFiscalStats} autoPopup={false}>
    <div className="logta-page w-full space-y-8 py-8 animate-in fade-in duration-700 sm:py-10 lg:py-[62px] h-full">
      <LogtaModuleHeader
        title="Documentos Fiscais"
        subtitle="Central fiscal inteligente — emissão, SEFAZ, auditoria e integração logística."
        tabs={<LogtaWaveTabStrip tabs={tabs} basePath="/documentos" defaultTabId="dashboard" />}
        tabQuickAddLabel="Novo documento"
        onTabQuickAdd={() => setIsNovoDocOpen(true)}
      />

      <FiscalAlertsInlinePanel className="mb-6" />

      <div className="animate-in fade-in duration-500">
        <Routes>
          <Route index element={<Navigate to="/documentos/dashboard" replace />} />
          <Route path="dashboard" element={<FiscalCentralDashboard />} />
          <Route path="cte" element={<CteManagementView cteList={fiscalSandbox?.cteList ?? []} onSelect={setSelectedCte} onUpload={() => setIsUploadOpen(true)} />} />
          <Route path="mdfe" element={<MdfeManagementView mdfeList={fiscalSandbox?.mdfeList ?? []} onSelect={setSelectedMdfe} onNewMdfe={() => setIsMdfeOpen(true)} onUpload={() => setIsUploadOpen(true)} />} />
          <Route path="rejeitados" element={<RejectedDocsView rejected={(fiscalSandbox?.cteList ?? []).filter((c) => c.status === 'Rejeitado')} onUpload={() => setIsUploadOpen(true)} onSelectRejection={setSelectedRejection} />} />
        </Routes>
      </div>

      {isNovoDocOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNovoDocOpen(false)} />
          <div className="relative w-full max-w-md rounded-[32px] border border-neutral-800 bg-[#18191B] p-8 text-white shadow-2xl animate-in zoom-in duration-200">
            <LogtaModalHeader icon={FileText} title="Novo documento fiscal" onClose={() => setIsNovoDocOpen(false)} />
            <p className="mt-2 text-sm text-neutral-400">Escolha o tipo para emissão via API integrada ao seu emissor.</p>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsNovoDocOpen(false);
                  navigate('/documentos/cte');
                  showToast('info', 'Abrindo emissão de CT-e. Conecte o frete e os dados do tomador.', 'Emissão fiscal');
                }}
                className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-4 text-left hover:border-primary/40"
              >
                <FileText size={22} className="text-primary" />
                <div>
                  <p className="text-sm font-bold">CT-e</p>
                  <p className="text-xs text-neutral-500">Conhecimento de transporte eletrônico</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsNovoDocOpen(false);
                  setIsMdfeOpen(true);
                  showToast('info', 'Gerar MDF-e vinculado aos CT-es autorizados da rota.', 'Emissão fiscal');
                }}
                className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-4 text-left hover:border-primary/40"
              >
                <Truck size={22} className="text-primary" />
                <div>
                  <p className="text-sm font-bold">MDF-e</p>
                  <p className="text-xs text-neutral-500">Manifesto eletrônico de documentos fiscais</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <LogtaLogDockUploadModal open={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

      {isMdfeOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMdfeOpen(false)} />
          <div className="relative w-full max-w-lg rounded-[32px] border border-neutral-800 bg-[#18191B] p-8 text-white shadow-2xl animate-in zoom-in duration-200">
            <LogtaModalHeader icon={Truck} title="Novo MDF-e" onClose={() => setIsMdfeOpen(false)} />
            <form
              className="mt-6 space-y-4 text-left"
              onSubmit={(e) => {
                e.preventDefault();
                showToast('success', 'MDF-e em preparação. Vincule os CT-es autorizados da rota.', 'Documentos');
                setIsMdfeOpen(false);
              }}
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-neutral-400">Placa do veículo</label>
                <input required placeholder="ABC-1D23" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-neutral-400">UF percurso</label>
                <input required placeholder="SP → MG → RJ" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-neutral-400">CT-es vinculados (chaves)</label>
                <textarea required rows={3} placeholder="Cole as chaves dos CT-es autorizados" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary resize-none" />
              </div>
              <button type="submit" className="w-full rounded-xl bg-primary py-4 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90">
                Gerar manifesto
              </button>
            </form>
          </div>
        </div>
      )}

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
                <h3 className="logta-modal-title leading-none tracking-tight">
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
                  setSelectedCte(null);
                  setIsUploadOpen(true);
                  showToast('info', 'Arraste ou selecione os arquivos para sincronizar com o LogDock Drive.', 'LogDock');
                }}
                className="px-6 py-3 bg-[#18191B] border border-primary/40 text-primary font-bold rounded-xl text-xs uppercase tracking-normal transition-all cursor-pointer hover:bg-primary/5"
              >
                Subir no LogDock
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
                <h3 className="logta-modal-title leading-none tracking-tight">
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

      {/* SEFAZ Rejection Detail Modal */}
      {selectedRejection && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#18191B] rounded-[40px] border border-neutral-800 shadow-2xl p-8 max-w-xl w-full text-left animate-in zoom-in-95 duration-300 text-white">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-neutral-800">
              <div>
                <span className="text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-normal block w-fit mb-2 bg-red-500/10 text-red-400">
                  REJEIÇÃO SEFAZ · CÓDIGO 225
                </span>
                <h3 className="logta-modal-title leading-none tracking-tight">
                  CT-e #{selectedRejection.nr} — {selectedRejection.client}
                </h3>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-normal mt-1.5">
                  Diagnóstico e Correção de Inconsistência
                </p>
              </div>
              <button 
                onClick={() => setSelectedRejection(null)}
                className="w-10 h-10 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl flex items-center justify-center transition-all cursor-pointer"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-5 bg-red-950/10 rounded-3xl border border-red-900/30 text-red-200 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-red-400">Erro Retornado pela SEFAZ</p>
                <p className="text-xs font-bold font-mono bg-black/40 p-3 rounded-xl border border-red-900/20 text-red-300 leading-normal">
                  Rejeição 225: Falha na validação do CFOP. O CFOP (5.352) é inválido para operações interestaduais.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-0.5">Origem</p>
                  <p className="text-xs font-bold text-white">{selectedRejection.origin}</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-0.5">Destino</p>
                  <p className="text-xs font-bold text-white">{selectedRejection.dest}</p>
                </div>
              </div>

              <div className="p-5 bg-neutral-900 rounded-3xl border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-primary px-2 py-0.5 text-[9px] font-black uppercase text-white">IA Fiscal</span>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-normal">Resolução Recomendada</p>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Identificamos que o endereço do remetente é do estado de origem e o destinatário é de outro estado. 
                  Para transações interestaduais, o CFOP deve iniciar com o dígito <strong>6</strong>.
                </p>
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-neutral-500 font-bold block text-[9px] uppercase mb-0.5">CFOP Atual</span>
                    <span className="text-red-400 font-black line-through">5.352</span>
                  </div>
                  <div className="text-neutral-500">→</div>
                  <div className="text-right">
                    <span className="text-primary font-bold block text-[9px] uppercase mb-0.5">CFOP Correto</span>
                    <span className="text-green-400 font-black">6.352</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedRejection(null)}
                className="px-6 py-3 bg-neutral-900 border border-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-normal transition-all cursor-pointer hover:bg-neutral-800"
              >
                Ignorar
              </button>
              <button 
                onClick={() => {
                  if ((window as any).showToast) {
                    (window as any).showToast('success', 'CFOP atualizado para 6.352 e CT-e transmitido com sucesso!', 'Emissão Concluída');
                  }
                  setSelectedRejection(null);
                }}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl text-xs uppercase tracking-normal transition-all cursor-pointer hover:opacity-95"
              >
                Corrigir e Transmitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </FiscalIntelligenceProvider>
  );
};

// --- Sub-View Components ---


const CteManagementView = ({
  cteList,
  onSelect,
  onUpload,
}: {
  cteList: any[];
  onSelect: (cte: any) => void;
  onUpload: () => void;
}) => {

  return (
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

    <div className="logta-panel-card overflow-hidden">
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
          {cteList.map((cte, i) => (
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
                    <Download size={18} />
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
                  <button 
                    title="Subir no LogDock" 
                    onClick={() => {
                      onUpload();
                      showToast('info', `Abrindo biblioteca para subir documento para o CT-e #${cte.nr}. Sincronização direta com o LogDock Drive ativa.`, 'LogDock');
                    }}
                    className="p-2 text-blue-500 hover:text-blue-600 transition-colors bg-blue-50 hover:bg-blue-100 rounded-lg shrink-0"
                  >
                    <Upload size={18} />
                  </button>
                  <button title="Enviar E-mail" className="p-2 text-gray-400 hover:text-primary transition-colors"><Mail size={18} /></button>
                </div>
              </td>
            </tr>
          ))}
          {cteList.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12">
                <LogtaEmptyState type="documentos" onAction={onUpload} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
  );
};

const MdfeManagementView = ({
  mdfeList,
  onSelect,
  onNewMdfe,
  onUpload,
}: {
  mdfeList: any[];
  onSelect: (mdfe: any) => void;
  onNewMdfe: () => void;
  onUpload: () => void;
}) => {

  return (
    <div className="space-y-6">
    <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/10 flex items-center justify-between">
      <div>
        <h3 className="text-xl font-bold text-primary mb-2">Manifesto de Documentos (MDF-e)</h3>
        <p className="text-sm text-gray-600 font-medium">Agrupe seus CT-es autorizados para liberar a viagem do veículo.</p>
      </div>
      <button
        type="button"
        onClick={onNewMdfe}
        className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2"
      >
        <Truck size={20} /> Novo MDF-e
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mdfeList.map((mdfe, i) => (
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
      {mdfeList.length === 0 && (
        <div className="col-span-full">
          <LogtaEmptyState type="documentos" onAction={onUpload} />
        </div>
      )}
    </div>
  </div>
  );
};

const RejectedDocsView = ({ 
  rejected, 
  onUpload,
  onSelectRejection
}: { 
  rejected: any[]; 
  onUpload: () => void;
  onSelectRejection: (cte: any) => void;
}) => (
  <div className="logta-panel-card p-8">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
        <AlertCircle size={24} />
      </div>
      <div>
        <h3 className="logta-card-heading">Rejeições & Inconsistências</h3>
        <p className="text-sm text-gray-500 font-medium">Analise os motivos de rejeição da SEFAZ e corrija os documentos.</p>
      </div>
    </div>

    {rejected.length === 0 ? (
      <div className="py-12">
        <LogtaEmptyState type="documentos" onAction={onUpload} />
      </div>
    ) : (
      <div className="space-y-3">
        {rejected.map((cte) => (
          <div 
            key={cte.nr} 
            onClick={() => onSelectRejection(cte)}
            className="rounded-2xl border border-red-100 bg-red-50/50 p-5 hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer text-left"
          >
            <p className="text-sm font-bold text-gray-900">CT-e {cte.nr} — {cte.client}</p>
            <p className="mt-1 text-xs text-gray-600">
              {cte.origin} → {cte.dest} · {cte.date}
            </p>
            <p className="mt-2 text-[10px] font-black uppercase text-red-600">Rejeição SEFAZ — CFOP inconsistente</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default Documentos;
