import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Key,
  Bell,
  Phone,
  MapPin,
  Briefcase,
  Camera,
  CheckCircle2,
  Lock,
  Smartphone,
  Laptop,
  Globe,
  Plus,
  Check,
  X,
  FileText,
  HardDrive,
  Loader2,
  Image as ImageIcon,
  Search,
  Upload,
  FolderOpen,
} from 'lucide-react';
import { useLogtaProfileAvatar } from '../hooks/useLogtaProfileAvatar';
import { useHubEntitlements } from '../contexts/HubEntitlementsContext';
import { syncAssetToLogDock } from '../lib/logDockSync';
import {
  fetchAccountLogDockFiles,
  getLogDockSignedUrl,
  registerLogDockLibraryEntry,
  type AccountFileRecord,
} from '../lib/logDockLibrary';
import { getHubLogDockDriveUrl } from '@/lib/hub';

function formatFileSize(bytes: number) {
  if (!bytes || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Foto de perfil: somente PNG e JPEG (MIME ou extensão, alinhado ao picker e ao storage). */
function isProfileAvatarLibraryFile(r: AccountFileRecord): boolean {
  const t = (r.type || '').toLowerCase().trim();
  if (t === 'image/png' || t === 'image/jpeg') return true;
  const name = r.name.toLowerCase();
  const extOk = name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg');
  if (!extOk) return false;
  return !t || t.startsWith('image/');
}

function isAllowedProfileAvatarUpload(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t === 'image/png' || t === 'image/jpeg') return true;
  const n = file.name.toLowerCase();
  return (
    (n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg')) && (!t || t.startsWith('image/'))
  );
}

const Perfil = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { avatarUrl, setAvatarUrl } = useLogtaProfileAvatar();
  const { entitlements } = useHubEntitlements();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryRows, setLibraryRows] = useState<AccountFileRecord[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryErr, setLibraryErr] = useState<string | null>(null);
  const [libraryVersion, setLibraryVersion] = useState(0);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryMainTab, setLibraryMainTab] = useState<'upload' | 'library'>('library');
  const [selectedLibraryFile, setSelectedLibraryFile] = useState<AccountFileRecord | null>(null);
  const [previewById, setPreviewById] = useState<Record<string, string | null>>({});
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pessoais');
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [successSave, setSuccessSave] = useState(false);
  
  const [userInfo, setUserInfo] = useState({
    nome: 'Alison Thiago',
    email: 'alison@logta.com',
    senha: '••••••••',
    cargo: 'Admin',
    filial: 'Matriz - São Paulo',
    status: 'Ativo'
  });

  const [permissions, setPermissions] = useState<any>({
    acessoGlobal: { acessarSistema: true, verDashboard: true, acessarNotif: true, acessarMapa: true },
    fretes: { verFretes: true, criarFretes: true, editarFretes: true, cancelarFretes: true, atribuirMotorista: true, alterarStatus: true },
    roteirizacao: { verMapa: true, criarRotas: true, editarRotas: true, reotimizarRotas: true, veiculosTempoReal: true },
    financeiro: { verFinanceiro: true, contasReceber: true, contasPagar: true, editarValores: true, lucroFrete: true, exportarRelatorios: true },
    fiscal: { emitirCte: true, cancelarCte: true, emitirMdfe: true, verDocsFiscais: true, reenviarSefaz: true },
    crm: { verClientes: true, criarClientes: true, editarClientes: true, historicoFretes: true, financeiroCliente: true, riscoCliente: true },
    rh: { verFuncionarios: true, criarColaboradores: true, editarFuncionarios: true, folhaPagamento: true, gerenciarMotoristas: true, verDesempenho: true },
    frota: { verVeiculos: true, criarVeiculos: true, editarVeiculos: true, verManutencao: true, gerenciarPneus: true, consumoCombustivel: true },
    pgr: { monitoramentoRisco: true, configurarPgr: true, verOcorrencias: true, gerenciarSeguros: true, acessarRastreadores: true },
    configuracoes: { configuracoesGerais: true, dadosEmpresa: true, configurarWhitelabel: true, configurarDominio: true, configurarIntegracoes: true, gerenciarUsuarios: true },
    notificacoes: { inboxLogistica: true, criarAutomacoes: true, editarAutomacoes: true, receberAlertas: true },
    relatorios: { relatoriosOperacionais: true, relatoriosFinanceiros: true, exportarRelatoriosTab: true, relatoriosClientes: true, relatoriosMotoristas: true },
    controleAvancado: { criarUsuarios: true, editarPermissoes: true, bloquearUsuarios: true, acessarLogs: true, resetarDados: true, configurarGlobal: true }
  });

  const applyPreset = (preset: 'admin' | 'operacional' | 'financeiro' | 'motorista' | 'rh') => {
    const updated = { ...permissions };
    Object.keys(updated).forEach((category) => {
      updated[category] = { ...updated[category] };
      Object.keys(updated[category]).forEach((key) => {
        if (preset === 'admin') {
          updated[category][key] = true;
        } else if (preset === 'operacional') {
          updated[category][key] = ['fretes', 'roteirizacao', 'acessoGlobal'].includes(category);
        } else if (preset === 'financeiro') {
          updated[category][key] = ['financeiro', 'relatorios', 'acessoGlobal'].includes(category);
        } else if (preset === 'motorista') {
          updated[category][key] = category === 'acessoGlobal' && key === 'acessarSistema';
        } else if (preset === 'rh') {
          updated[category][key] = ['rh', 'acessoGlobal'].includes(category);
        }
      });
    });
    setPermissions(updated);
    setUserInfo(prev => ({
      ...prev,
      cargo: preset.charAt(0).toUpperCase() + preset.slice(1)
    }));
  };

  const categoriesList = [
    { id: 'acessoGlobal', label: '1. Permissões gerais do sistema', fields: [
      { key: 'acessarSistema', label: 'Acessar sistema' },
      { key: 'verDashboard', label: 'Ver dashboard principal' },
      { key: 'acessarNotif', label: 'Acessar notificações' },
      { key: 'acessarMapa', label: 'Acessar mapa ao vivo' },
    ]},
    { id: 'fretes', label: '2. Módulo de Fretes', fields: [
      { key: 'verFretes', label: 'Ver fretes' },
      { key: 'criarFretes', label: 'Criar frete' },
      { key: 'editarFretes', label: 'Editar frete' },
      { key: 'cancelarFretes', label: 'Cancelar frete' },
      { key: 'atribuirMotorista', label: 'Atribuir motorista' },
      { key: 'alterarStatus', label: 'Alterar status de entrega' },
    ]},
    { id: 'roteirizacao', label: '3. Roteirização & Mapa', fields: [
      { key: 'verMapa', label: 'Ver mapa ao vivo' },
      { key: 'criarRotas', label: 'Criar rotas' },
      { key: 'editarRotas', label: 'Editar rotas' },
      { key: 'reotimizarRotas', label: 'Reotimizar rotas' },
      { key: 'veiculosTempoReal', label: 'Visualizar veículos em tempo real' },
    ]},
    { id: 'financeiro', label: '4. Financeiro', fields: [
      { key: 'verFinanceiro', label: 'Ver financeiro' },
      { key: 'contasReceber', label: 'Criar contas a receber' },
      { key: 'contasPagar', label: 'Criar contas a pagar' },
      { key: 'editarValores', label: 'Editar valores' },
      { key: 'lucroFrete', label: 'Ver lucro por frete' },
      { key: 'exportarRelatorios', label: 'Exportar relatórios financeiros' },
    ]},
    { id: 'fiscal', label: '5. Fiscal (CT-e / MDF-e)', fields: [
      { key: 'emitirCte', label: 'Emitir CT-e' },
      { key: 'cancelarCte', label: 'Cancelar CT-e' },
      { key: 'emitirMdfe', label: 'Emitir MDF-e' },
      { key: 'verDocsFiscais', label: 'Visualizar documentos fiscais' },
      { key: 'reenviarSefaz', label: 'Reenviar documentos SEFAZ' },
    ]},
    { id: 'crm', label: '6. CRM (Clientes)', fields: [
      { key: 'verClientes', label: 'Ver clientes' },
      { key: 'criarClientes', label: 'Criar clientes' },
      { key: 'editarClientes', label: 'Editar clientes' },
      { key: 'historicoFretes', label: 'Ver histórico de fretes' },
      { key: 'financeiroCliente', label: 'Ver financeiro do cliente' },
      { key: 'riscoCliente', label: 'Acessar risco do cliente' },
    ]},
    { id: 'rh', label: '7. RH (Funcionários)', fields: [
      { key: 'verFuncionarios', label: 'Ver funcionários' },
      { key: 'criarColaboradores', label: 'Criar colaboradores' },
      { key: 'editarFuncionarios', label: 'Editar dados de funcionários' },
      { key: 'folhaPagamento', label: 'Ver folha de pagamento' },
      { key: 'gerenciarMotoristas', label: 'Gerenciar motoristas' },
      { key: 'verDesempenho', label: 'Ver desempenho' },
    ]},
    { id: 'frota', label: '8. Gestão de frota', fields: [
      { key: 'verVeiculos', label: 'Ver veículos' },
      { key: 'criarVeiculos', label: 'Criar veículos' },
      { key: 'editarVeiculos', label: 'Editar veículos' },
      { key: 'verManutencao', label: 'Ver manutenção' },
      { key: 'gerenciarPneus', label: 'Gerenciar pneus' },
      { key: 'consumoCombustivel', label: 'Ver consumo de combustível' },
    ]},
    { id: 'pgr', label: '9. Risco & Segurança (PGR)', fields: [
      { key: 'monitoramentoRisco', label: 'Ver monitoramento de risco' },
      { key: 'configurarPgr', label: 'Configurar PGR' },
      { key: 'verOcorrencias', label: 'Ver ocorrências' },
      { key: 'gerenciarSeguros', label: 'Gerenciar seguros' },
      { key: 'acessarRastreadores', label: 'Acessar rastreadores' },
    ]},
    { id: 'configuracoes', label: '10. Configurações do sistema', fields: [
      { key: 'configuracoesGerais', label: 'Acessar configurações gerais' },
      { key: 'dadosEmpresa', label: 'Alterar dados da empresa' },
      { key: 'configurarWhitelabel', label: 'Configurar white label' },
      { key: 'configurarDominio', label: 'Configurar domínio' },
      { key: 'configurarIntegracoes', label: 'Configurar integrações' },
      { key: 'gerenciarUsuarios', label: 'Gerenciar usuários e permissões' },
    ]},
    { id: 'notificacoes', label: '11. Notificações & automações', fields: [
      { key: 'inboxLogistica', label: 'Ver inbox logística' },
      { key: 'criarAutomacoes', label: 'Criar automações' },
      { key: 'editarAutomacoes', label: 'Editar automações' },
      { key: 'receberAlertas', label: 'Receber alertas do sistema' },
    ]},
    { id: 'relatorios', label: '12. Relatórios', fields: [
      { key: 'relatoriosOperacionais', label: 'Ver relatórios operacionais' },
      { key: 'relatoriosFinanceiros', label: 'Ver relatórios financeiros' },
      { key: 'exportarRelatoriosTab', label: 'Exportar relatórios' },
      { key: 'relatoriosClientes', label: 'Ver relatórios de clientes' },
      { key: 'relatoriosMotoristas', label: 'Ver relatórios de motoristas' },
    ]},
    { id: 'controleAvancado', label: '13. Controle avançado (Admin total)', fields: [
      { key: 'criarUsuarios', label: 'Criar usuários' },
      { key: 'editarPermissoes', label: 'Editar permissões' },
      { key: 'bloquearUsuarios', label: 'Bloquear usuários' },
      { key: 'acessarLogs', label: 'Acessar logs do sistema' },
      { key: 'resetarDados', label: 'Resetar dados' },
      { key: 'configurarGlobal', label: 'Configurar sistema global' },
    ]}
  ];

  const logdockOn = entitlements?.logdock.enabled !== false;

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    setLibraryErr(null);
    const { rows, error } = await fetchAccountLogDockFiles();
    setLibraryLoading(false);
    setLibraryRows(rows);
    if (error) setLibraryErr(error);
  }, []);

  useEffect(() => {
    if (!libraryOpen) return;
    void loadLibrary();
  }, [libraryOpen, libraryVersion, loadLibrary]);

  useEffect(() => {
    const bump = () => setLibraryVersion((v) => v + 1);
    window.addEventListener('logta-logdock-library-changed', bump);
    return () => window.removeEventListener('logta-logdock-library-changed', bump);
  }, []);

  useEffect(() => {
    if (!libraryOpen) return;
    setLibrarySearch('');
    setLibraryMainTab('library');
    setSelectedLibraryFile(null);
    setPreviewById({});
    setSelectedPreviewUrl(null);
  }, [libraryOpen]);

  const profileLibraryRows = useMemo(
    () => libraryRows.filter(isProfileAvatarLibraryFile),
    [libraryRows]
  );

  const filteredProfileLibraryRows = useMemo(() => {
    const q = librarySearch.trim().toLowerCase();
    if (!q) return profileLibraryRows;
    return profileLibraryRows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.type || '').toLowerCase().includes(q)
    );
  }, [profileLibraryRows, librarySearch]);

  useEffect(() => {
    if (!selectedLibraryFile) return;
    if (!filteredProfileLibraryRows.some((r) => r.id === selectedLibraryFile.id)) {
      setSelectedLibraryFile(null);
    }
  }, [filteredProfileLibraryRows, selectedLibraryFile]);

  useEffect(() => {
    if (!libraryOpen || libraryLoading) return;
    let cancelled = false;
    const imgs = filteredProfileLibraryRows.filter((r) => !r.isDemo);
    void (async () => {
      const batch = imgs.slice(0, 36);
      const entries = await Promise.all(
        batch.map(async (r) => [r.id, await getLogDockSignedUrl(r.path)] as const)
      );
      if (cancelled) return;
      setPreviewById((prev) => {
        const next = { ...prev };
        for (const [id, url] of entries) next[id] = url;
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [libraryOpen, libraryLoading, filteredProfileLibraryRows, libraryVersion]);

  useEffect(() => {
    if (!selectedLibraryFile) {
      setSelectedPreviewUrl(null);
      return;
    }
    if (!isProfileAvatarLibraryFile(selectedLibraryFile)) {
      setSelectedPreviewUrl(null);
      return;
    }
    if (selectedLibraryFile.localPreviewUrl) {
      setSelectedPreviewUrl(selectedLibraryFile.localPreviewUrl);
      return;
    }
    if (selectedLibraryFile.isDemo) {
      setSelectedPreviewUrl(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      const url = await getLogDockSignedUrl(selectedLibraryFile.path);
      if (!cancelled) setSelectedPreviewUrl(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedLibraryFile]);

  const applyLibrarySelectionAsAvatar = useCallback(async () => {
    const row = selectedLibraryFile;
    const toast = (window as { showToast?: (t: string, m: string, title?: string) => void }).showToast;
    if (!row || !isProfileAvatarLibraryFile(row)) return;

    setPickingId(row.id);
    try {
      let url = await getLogDockSignedUrl(row.path);
      url = url || selectedPreviewUrl || previewById[row.id] || row.localPreviewUrl || null;

      if (url) {
        setAvatarUrl(url);
        setLibraryOpen(false);
        toast?.(
          'success',
          row.isDemo
            ? 'Imagem de exemplo aplicada ao perfil. Envie uma foto sua para substituir.'
            : 'Foto de perfil salva e atualizada.',
          'Perfil'
        );
      } else {
        toast?.(
          'info',
          'Não foi possível carregar esta imagem. Envie de novo pelo perfil ou sincronize pelo Hub · LogDock.',
          'Biblioteca'
        );
      }
    } finally {
      setPickingId(null);
    }
  }, [selectedLibraryFile, selectedPreviewUrl, previewById, setAvatarUrl]);

  const processNewAvatarFile = useCallback(
    (file: File) => {
      const toast = (window as { showToast?: (t: string, m: string, title?: string) => void }).showToast;
      if (!isAllowedProfileAvatarUpload(file)) {
        toast?.('info', 'A foto de perfil aceita apenas PNG ou JPEG.', 'Perfil');
        return;
      }
      const ext = (file.name.includes('.') ? file.name.split('.').pop() : '') || 'jpg';
      const safeExt = /^[a-z0-9]+$/i.test(ext) ? ext.toLowerCase() : 'jpg';
      const dockName = `perfil-avatar-${Date.now()}.${safeExt}`;

      const reader = new FileReader();
      reader.onload = () => {
        const r = reader.result;
        if (typeof r !== 'string') return;
        registerLogDockLibraryEntry({
          name: dockName,
          category: 'avatars',
          type: file.type,
          size: file.size,
          path: `device-uploads/${dockName}`,
          localPreviewUrl: r,
        });
        setAvatarUrl(r);

        void (async () => {
          const toast = (window as { showToast?: (t: string, m: string, title?: string) => void }).showToast;
          if (!logdockOn) {
            toast?.(
              'success',
              'Foto de perfil atualizada. Ative o LogDock Drive no Hub para arquivar cópias automaticamente.',
              'Perfil'
            );
            setLibraryVersion((v) => v + 1);
            return;
          }
          const synced = await syncAssetToLogDock(dockName, 'avatars', file.size, file.type, {
            kind: 'profile_avatar',
            app: 'logta_saas',
          });
          if (synced) {
            toast?.('success', 'Foto atualizada. Registro enviado ao LogDock Drive.', 'Perfil');
          } else {
            toast?.(
              'warning',
              `Foto salva localmente. LogDock indisponível ou sem sessão. Gerencie em ${getHubLogDockDriveUrl()}.`,
              'Perfil'
            );
          }
          setLibraryVersion((v) => v + 1);
        })();
      };
      reader.readAsDataURL(file);
    },
    [logdockOn, setAvatarUrl]
  );

  return (
    <div className="logta-page h-full w-full overflow-y-auto animate-in fade-in duration-500 scrollbar-hide">
      <div className="mb-8">
        <h1 className="logta-page-title">Meu Perfil</h1>
        <p className="text-xs text-gray-400 font-medium mt-1">Gerencie suas informações pessoais, segurança e notificações da plataforma.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Menu */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'pessoais', label: 'Dados Pessoais', icon: User },
            { id: 'seguranca', label: 'Segurança & Senha', icon: Shield },
            { id: 'notificacoes', label: 'Notificações', icon: Bell },
            { id: 'sessoes', label: 'Sessões Ativas', icon: Laptop },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all
                  ${isActive 
                    ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm min-h-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* --- TAB: DADOS PESSOAIS --- */}
            {activeTab === 'pessoais' && (
              <div className="space-y-10">
                <div className="flex items-center gap-8 pb-10 border-b border-gray-100">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      processNewAvatarFile(file);
                    }}
                  />
                  <div className="flex shrink-0 flex-col items-start gap-2">
                    <button
                      type="button"
                      aria-label="Abrir biblioteca de arquivos LogDock e foto do perfil"
                      className="relative group cursor-pointer rounded-[32px] border-0 bg-transparent p-0 text-left"
                      onClick={() => setLibraryOpen(true)}
                    >
                      <div className="w-28 h-28 overflow-hidden rounded-[32px] border-4 border-white bg-gradient-to-tr from-primary to-blue-600 shadow-xl">
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="pointer-events-none absolute left-0 right-0 bottom-0 top-[-1px] rounded-[32px] bg-black/50 opacity-0 transition-opacity flex items-center justify-center group-hover:opacity-100">
                        <Camera className="text-white" size={24} />
                      </div>
                    </button>
                    <p className="max-w-[13rem] text-[9px] font-semibold leading-snug text-gray-400">
                      Clique para abrir a biblioteca da sua conta (LogDock): arquivos já enviados e opção de nova foto.
                    </p>
                  </div>
                  <div className="flex-1 flex justify-between items-center text-left">
                    <div>
                      <h2 className="text-3xl font-black text-gray-900">{userInfo.nome}</h2>
                      <p className="text-primary font-bold mt-1 uppercase tracking-normal text-[10px]">Administrador Master • {userInfo.cargo}</p>
                      <p className="text-sm text-gray-500 font-medium mt-2">Membro desde Janeiro de 2024 • {userInfo.filial}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-1">Nome Completo</label>
                    <div className="relative">
                      <User size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" defaultValue="Alison Thiago" className="w-full pl-14 pr-5 py-4 bg-gray-50 border border-transparent hover:border-gray-200 rounded-[20px] text-sm font-bold text-gray-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-1">E-mail Profissional</label>
                    <div className="relative">
                      <Mail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" defaultValue="alison@logta.com" className="w-full pl-14 pr-5 py-4 bg-gray-50 border border-transparent hover:border-gray-200 rounded-[20px] text-sm font-bold text-gray-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-1">Telefone / WhatsApp</label>
                    <div className="relative">
                      <Phone size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" defaultValue="(11) 99999-9999" className="w-full pl-14 pr-5 py-4 bg-gray-50 border border-transparent hover:border-gray-200 rounded-[20px] text-sm font-bold text-gray-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-1">Cargo</label>
                    <div className="relative">
                      <Briefcase size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" defaultValue="CEO / Diretor Geral" className="w-full pl-14 pr-5 py-4 bg-gray-50 border border-transparent hover:border-gray-200 rounded-[20px] text-sm font-bold text-gray-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-normal hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                    <CheckCircle2 size={18} /> Salvar Dados Pessoais
                  </button>
                </div>
              </div>
            )}

            {/* --- TAB: SEGURANÇA --- */}
            {activeTab === 'seguranca' && (
              <div className="space-y-10">
                <div className="pb-8 border-b border-gray-100">
                  <h2 className="text-2xl font-black text-gray-900">Segurança & Senha</h2>
                  <p className="text-gray-500 font-medium mt-1">Mantenha sua conta protegida com uma senha forte.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-1">Senha Atual</label>
                      <div className="relative">
                        <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="password" placeholder="••••••••" className="w-full pl-14 pr-5 py-4 bg-gray-50 border border-transparent hover:border-gray-200 rounded-[20px] text-sm font-bold text-gray-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-1">Nova Senha</label>
                      <div className="relative">
                        <Key size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="password" placeholder="Mínimo de 8 caracteres" className="w-full pl-14 pr-5 py-4 bg-gray-50 border border-transparent hover:border-gray-200 rounded-[20px] text-sm font-bold text-gray-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                      </div>
                    </div>
                    <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-normal hover:bg-black transition-all">
                      Atualizar Senha
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                      <Smartphone size={24} />
                    </div>
                    <h3 className="text-lg font-black text-gray-900">Autenticação em 2 Fatores (2FA)</h3>
                    <p className="text-sm text-gray-500 mt-2 mb-6">Adicione uma camada extra de segurança na sua conta exigindo um código SMS ou Google Authenticator.</p>
                    <button className="px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-xl font-bold text-xs uppercase tracking-normal hover:border-primary transition-all">
                      Configurar 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB: NOTIFICAÇÕES --- */}
            {activeTab === 'notificacoes' && (
              <div className="space-y-10">
                <div className="pb-8 border-b border-gray-100">
                  <h2 className="text-2xl font-black text-gray-900">Preferências de Notificação</h2>
                  <p className="text-gray-500 font-medium mt-1">Escolha como você quer ser avisado sobre o que acontece na Logta.</p>
                </div>

                <div className="space-y-4">
                  {[
                    { title: 'Avisos Financeiros', desc: 'Recebimentos, faturas vencidas e alertas de fluxo de caixa.', email: true, app: true },
                    { title: 'Alertas Operacionais', desc: 'Atrasos de motoristas, ocorrências no PGR e desvios de rota.', email: false, app: true },
                    { title: 'Relatórios Semanais', desc: 'Resumo de performance de frota e fechamento de vendas (CRM).', email: true, app: false },
                    { title: 'Atualizações do Sistema', desc: 'Novas funcionalidades e manutenções programadas da Logta.', email: true, app: true },
                  ].map((notif, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="max-w-md">
                        <h4 className="text-sm font-bold text-gray-900">{notif.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{notif.desc}</p>
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked={notif.email} className="w-5 h-5 rounded-md border-gray-300 text-primary focus:ring-primary" />
                          <span className="text-xs font-bold text-gray-700">E-mail</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked={notif.app} className="w-5 h-5 rounded-md border-gray-300 text-primary focus:ring-primary" />
                          <span className="text-xs font-bold text-gray-700">App (Push)</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- TAB: SESSÕES --- */}
            {activeTab === 'sessoes' && (
              <div className="space-y-10">
                <div className="pb-8 border-b border-gray-100">
                  <h2 className="text-2xl font-black text-gray-900">Sessões Ativas</h2>
                  <p className="text-gray-500 font-medium mt-1">Dispositivos que estão conectados na sua conta neste momento.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-primary/5 border border-primary/20 rounded-3xl">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                        <Laptop size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">MacBook Pro - Safari</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Globe size={14} /> São Paulo, BR • <span className="text-primary font-bold">Sessão Atual</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-3xl">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                        <Smartphone size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">iPhone 14 Pro - App Logta</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Globe size={14} /> Rio de Janeiro, BR • Ativo há 2 horas
                        </div>
                      </div>
                    </div>
                    <button className="text-xs font-bold text-red-500 hover:underline">Desconectar</button>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <button className="text-sm font-bold text-gray-900 hover:text-red-500 transition-colors">
                    Desconectar de todos os outros dispositivos
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {libraryOpen ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:px-[14px] sm:py-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logdock-library-title"
        >
          <button
            type="button"
            aria-label="Fechar biblioteca"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setLibraryOpen(false)}
          />
          <div className="relative z-10 flex h-[min(88dvh,584px)] max-h-[min(88dvh,584px)] w-full max-w-[min(96vw,880px)] flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/40">
            <div className="flex shrink-0 flex-col gap-3 border-b border-neutral-800 px-[36px] py-[23px]">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                    <HardDrive size={20} />
                  </div>
                  <div className="min-w-0">
                    <h2 id="logdock-library-title" className="truncate text-base font-black text-white">
                      Biblioteca da conta
                    </h2>
                  </div>
                </div>
                <div
                  className="inline-flex w-fit shrink-0 gap-1 rounded-lg bg-black/55 px-[14px] py-[5px] ring-1 ring-neutral-800"
                  role="tablist"
                  aria-label="Origem da mídia"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={libraryMainTab === 'upload'}
                    onClick={() => setLibraryMainTab('upload')}
                    className={`rounded-md px-6 py-2 text-[10px] font-black uppercase tracking-normal transition-colors ${
                      libraryMainTab === 'upload'
                        ? 'bg-neutral-800 text-white shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Enviar arquivos
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={libraryMainTab === 'library'}
                    onClick={() => setLibraryMainTab('library')}
                    className={`rounded-md px-6 py-2 text-[10px] font-black uppercase tracking-normal transition-colors ${
                      libraryMainTab === 'library'
                        ? 'bg-neutral-800 text-white shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Biblioteca
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setLibraryOpen(false)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <div className="flex min-h-0 min-w-0 flex-1">
                  <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <div className="min-h-0 flex-1 overflow-y-auto px-[36px] py-0 scrollbar-hide">
                    {libraryMainTab === 'library' ? (
                    <div className="mb-4 w-full max-w-[458px] py-[30px]">
                      <div className="relative">
                        <Search
                          className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-neutral-500"
                          aria-hidden
                        />
                        <input
                          id="logdock-lib-search"
                          value={librarySearch}
                          onChange={(e) => setLibrarySearch(e.target.value)}
                          placeholder="Nome, tipo ou pasta…"
                          aria-label="Pesquisar mídia"
                          className="my-[7px] h-[31px] w-full rounded-lg border border-neutral-800 bg-black/50 py-0 pl-7 pr-2 text-[10px] leading-none text-white placeholder:text-neutral-600 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                    ) : null}
                    {libraryMainTab === 'upload' ? (
                    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-700 bg-black/25 px-4 py-8 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-neutral-500">
                        <Upload size={28} strokeWidth={1.75} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Enviar para a biblioteca da conta</p>
                        <p className="mt-1 max-w-sm text-[11px] font-medium text-neutral-500">
                          O arquivo entra no LogDock local e sincroniza com a nuvem quando o drive estiver ativo no Hub.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl border border-neutral-600 bg-neutral-900 px-4 py-2 text-[11px] font-black uppercase tracking-normal text-white transition-colors hover:border-primary/50 hover:text-primary"
                      >
                        Escolher arquivo
                      </button>
                      <a
                        href={getHubLogDockDriveUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary hover:underline"
                      >
                        <FolderOpen size={14} aria-hidden />
                        Abrir pasta completa no Hub · LogDock
                      </a>
                    </div>
                    ) : libraryLoading ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-neutral-500">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs font-semibold">Carregando arquivos…</p>
                    </div>
                    ) : libraryRows.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <FileText className="h-10 w-10 text-neutral-600" />
                      <p className="max-w-xs text-xs font-semibold text-neutral-400">
                        Nenhum arquivo na biblioteca. Envie uma imagem ou use o módulo Documentos.
                      </p>
                    </div>
                    ) : profileLibraryRows.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <ImageIcon className="h-10 w-10 text-neutral-600" />
                      <p className="max-w-xs text-xs font-semibold text-neutral-400">
                        Nenhuma imagem PNG ou JPEG na biblioteca para o perfil. Outros tipos ficam no Hub · LogDock
                        (Documentos).
                      </p>
                      <a
                        href={getHubLogDockDriveUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Abrir LogDock no Hub
                      </a>
                    </div>
                    ) : (
                      <>
                      {libraryErr ? (
                        <p className="mb-3 rounded-xl border border-amber-500/35 bg-amber-950/35 px-3 py-2 text-[11px] font-medium text-amber-100">
                          Nuvem: {libraryErr} — exibindo arquivos deste dispositivo e exemplos LogDock.
                        </p>
                      ) : null}
                      <p className="mb-3 text-[10px] font-semibold text-neutral-500">
                        {profileLibraryRows.filter((r) => !r.isDemo).length} imagem(ns) PNG/JPEG da conta
                        {profileLibraryRows.filter((r) => r.isDemo).length > 0
                          ? ` · ${profileLibraryRows.filter((r) => r.isDemo).length} exemplo(s)`
                          : ''}
                        {filteredProfileLibraryRows.length !== profileLibraryRows.length
                          ? ` · ${filteredProfileLibraryRows.length} na busca`
                          : ''}
                      </p>
                      <div className="my-[45px] grid grid-cols-3 items-center justify-start gap-x-2 gap-y-0 py-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                        {filteredProfileLibraryRows.map((row) => {
                          const thumb = previewById[row.id] || row.localPreviewUrl || null;
                          const selected = selectedLibraryFile?.id === row.id;
                          return (
                            <button
                              type="button"
                              key={row.id}
                              aria-pressed={selected}
                              onClick={() => setSelectedLibraryFile(row)}
                              className={`group relative h-[100px] w-[109px] shrink-0 overflow-hidden rounded-lg border bg-neutral-900/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                selected
                                  ? 'border-primary ring-2 ring-primary/40'
                                  : 'border-neutral-800 hover:border-neutral-600'
                              }`}
                            >
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-[100px] w-[109px] object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-neutral-500">
                                  <ImageIcon size={22} strokeWidth={1.5} />
                                  <span className="line-clamp-2 w-full px-0.5 text-center text-[8px] font-bold leading-tight text-neutral-400">
                                    {row.name}
                                  </span>
                                </div>
                              )}
                              {row.isDemo ? (
                                <span className="absolute left-1 top-1 rounded bg-black/70 px-1 py-px text-[7px] font-black uppercase text-amber-200">
                                  ex.
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                      </>
                    )}
                  </div>
                  </main>

                  <aside className="hidden min-h-0 w-[min(100%,240px)] shrink-0 flex-col border-l border-neutral-800 md:flex">
                  <p className="shrink-0 border-b border-neutral-800 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-neutral-400">
                    Pré-visualização
                  </p>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 py-[19px] scrollbar-hide">
                    {!selectedLibraryFile ? (
                      <p className="text-[11px] font-medium leading-relaxed text-neutral-500">
                        Selecione uma imagem na grade.
                      </p>
                    ) : (
                      (() => {
                        const thumb =
                          (isProfileAvatarLibraryFile(selectedLibraryFile) &&
                            (selectedPreviewUrl ??
                              previewById[selectedLibraryFile.id] ??
                              selectedLibraryFile.localPreviewUrl)) ||
                          null;
                        return (
                          <div className="flex flex-col gap-3">
                            <div className="aspect-square w-full overflow-hidden rounded-lg border border-neutral-800 bg-black">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-neutral-600">
                                  <ImageIcon size={36} strokeWidth={1.25} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 space-y-1.5 text-[11px]">
                              <p className="break-words font-bold leading-snug text-white">{selectedLibraryFile.name}</p>
                              <p className="font-semibold text-neutral-400">{formatFileSize(selectedLibraryFile.size)}</p>
                              {selectedLibraryFile.created_at ? (
                                <p className="font-medium text-neutral-500">
                                  {new Date(selectedLibraryFile.created_at).toLocaleString('pt-BR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })}
                                </p>
                              ) : (
                                <p className="font-medium text-neutral-600">—</p>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                  </aside>
                </div>

                <div className="relative z-10 flex w-full min-w-0 shrink-0 flex-wrap items-center justify-between gap-3 border-t border-neutral-800 bg-neutral-950 px-[36px] py-[30px]">
                    <p className="min-w-0 text-[10px] font-semibold text-neutral-300">
                      {libraryMainTab === 'library'
                        ? `${filteredProfileLibraryRows.length} imagem(ns) · LogDock`
                        : 'Upload vinculado à sua conta'}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLibraryOpen(false)}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 px-4 text-[11px] font-bold text-white transition-colors hover:bg-neutral-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={
                          libraryMainTab !== 'library' ||
                          !selectedLibraryFile ||
                          !isProfileAvatarLibraryFile(selectedLibraryFile) ||
                          Boolean(pickingId)
                        }
                        onClick={() => void applyLibrarySelectionAsAvatar()}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-[11px] font-black uppercase tracking-normal text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {pickingId ? '…' : 'Selecionar'}
                      </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Perfil;
