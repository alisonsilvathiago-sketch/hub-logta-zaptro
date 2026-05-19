import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Map, 
  Settings, 
  FileText, 
  DollarSign, 
  Briefcase, 
  BarChart3,
  Bell,
  HelpCircle,
  ChevronRight,
  LogOut,
  User,
  Sparkles,
  Activity,
  Wrench,
  ShieldCheck,
  Shield,
  Database,
  Palette,
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Key,
  Cpu,
  CreditCard,
  MessageSquare,
  Smartphone,
  Mail,
  MapPin,
  LifeBuoy,
  Calendar,
  Calculator,
  Check
} from 'lucide-react';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import { LogtaProfileProvider, useLogtaProfile } from './contexts/LogtaProfileContext';
import { LogtaUserAvatar } from './components/LogtaUserAvatar';
import { HubEntitlementsProvider } from './contexts/HubEntitlementsContext';
import { LogtaModuleActivationProvider } from './contexts/LogtaModuleActivationContext';
import Dashboard from './pages/Dashboard';
import CRM from './pages/CRM';
import Inicio from './pages/Inicio';
import Fretes from './pages/Fretes';
import Roteirizacao from './pages/Roteirizacao';
import Documentos from './pages/Documentos';
import Financeiro from './pages/Financeiro';
import RH from './pages/RH';
import Relatorios from './pages/Relatorios';
import MapaAoVivo from './pages/MapaAoVivo';
import Frota from './pages/Frota';
import PGR from './pages/PGR';
import Perfil from './pages/Perfil';
import Automacoes from './pages/Automacoes';
import Ajuda from './pages/Ajuda';
import Configuracoes from './pages/Configuracoes';
import Agenda from './pages/AgendaModule';
import Login from './pages/LoginModule';
import Vendas from './pages/Vendas';
import { PontoPublicView } from './modules/rh/ponto/views/PontoPublicView';
import { OrcamentoPublicView } from './modules/orcamento';
import { MotoristaRotaPublicView } from './modules/motorista';
import Permissoes from './pages/Permissoes';
import { LogtaAuthGate, isLogtaPublicPath } from './components/LogtaAuthGate';
import { LogtaCalculatorPopup } from './components/LogtaCalculatorPopup';
import { LogtaCalculatorPublicView } from './views/LogtaCalculatorPublicView';
import { LogtaNotificationPanel, LogtaToastStack } from './components/LogtaToast';
import { OperationalDataProvider } from './contexts/OperationalDataContext';
import { LogtaIaProvider, useLogtaIa } from './contexts/LogtaIaContext';
import { LogtaGlobalOperationalStrip } from './components/LogtaGlobalOperationalStrip';
import { LogtaSandboxBootstrap } from './components/LogtaSandboxBootstrap';
import { LogtaIaDrawer } from './components/LogtaIaDrawer';
import { getHubMasterUrl } from './lib/hub';
// --- Global Context / Inline Components ---


// --- App Component ---

const SIDEBAR_DEFAULT_PATHS: Record<string, string> = {
  '/crm': '/crm/clientes',
  '/fretes': '/fretes/operacional',
  '/roteirizacao': '/roteirizacao/planejamento',
  '/frota': '/frota/dashboard',
  '/pgr': '/pgr/dashboard',
  '/documentos': '/documentos/dashboard',
  '/financeiro': '/financeiro/dashboard',
  '/rh': '/rh/dashboard',
};

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { icon: Sparkles, label: 'Início', path: '/inicio' },
    { icon: LayoutDashboard, label: 'Controle', path: '/dashboard' },
    { icon: Users, label: 'CRM / Clientes', path: '/crm' },
    { icon: Truck, label: 'Operação / Fretes', path: '/fretes' },
    { icon: Map, label: 'Roteirização', path: '/roteirizacao' },
    { icon: Wrench, label: 'Gestão de Frota', path: '/frota' },
    { icon: ShieldCheck, label: 'PGR & Seguros', path: '/pgr' },
    { icon: FileText, label: 'Docs Fiscais', path: '/documentos' },
    { icon: DollarSign, label: 'Financeiro', path: '/financeiro' },
    { icon: Briefcase, label: 'RH / Colaboradores', path: '/rh' },
  ];

  return (
    <aside 
      className="h-[calc(100vh-32px)] m-4 bg-white border border-gray-100 flex flex-col sticky top-4 transition-all duration-300 ease-in-out z-20 rounded-[24px] shadow-xl shadow-gray-200/50 w-24 shrink-0"
    >
      <div className="mt-6 mb-6 flex flex-col items-center transition-all px-4">
        <div className="relative transition-all duration-300 w-10 h-10">
          <LogtaUserAvatar variant="header" className="h-full w-full border-gray-50" />
          <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        </div>
      </div>
      
      <nav className="flex flex-1 flex-col items-center space-y-2 px-2">
        {menuItems.map((item) => {
          const target = SIDEBAR_DEFAULT_PATHS[item.path] ?? item.path;
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.label}
              to={target}
              aria-label={item.label}
              title={item.label}
              className={`logta-sidebar-nav-item flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all group relative
                ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <item.icon
                size={18}
                className={`flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-primary'} transition-colors`}
              />

              {/* Premium Floating Tooltip */}
              <div className="pointer-events-none absolute left-full ml-4 px-3 py-1.5 bg-gray-950 text-white text-[10px] font-black uppercase tracking-normal rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-x-1 translate-x-0 transition-all duration-200 whitespace-nowrap z-50 shadow-xl shadow-gray-950/20">
                {item.label}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-950 rotate-45" />
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="flex justify-center border-t border-gray-50 p-4">
        <button
          type="button"
          className="logta-sidebar-nav-item flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-gray-400 transition-all group relative cursor-pointer hover:bg-red-50 hover:text-red-500"
        >
          <LogOut size={18} className="flex-shrink-0" />
          
          {/* Premium Logout Tooltip */}
          <div className="pointer-events-none absolute left-full ml-4 px-3 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-normal rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-x-1 translate-x-0 transition-all duration-200 whitespace-nowrap z-50 shadow-xl shadow-red-600/10">
            Sair do Sistema
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-red-600 rotate-45" />
          </div>
        </button>
      </div>
    </aside>
  );
};

const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [successSave, setSuccessSave] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const { config } = useTenant();
  const { profile } = useLogtaProfile();
  const { isOpen: isIaOpen, open: openIa, close: closeIa } = useLogtaIa();
  const displayName = profile?.full_name?.trim() || 'Alison Thiago';
  const displayRole = profile?.role === 'admin' ? 'Administrador' : (profile?.role || 'Administrador');

  const [toasts, setToasts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem('logta-notifications');
    return saved ? JSON.parse(saved) : [
      { id: '1', type: 'success', title: 'Sistema Inicializado', message: 'Módulos SaaS carregados com sucesso.', time: '15:45', read: false },
      { id: '2', type: 'info', title: 'Boas-vindas ao Logta', message: 'Você tem acesso total de administrador.', time: '15:40', read: false },
      { id: '3', type: 'warning', title: 'Segurança Operacional', message: 'Configurações de RBAC atualizadas.', time: '15:30', read: true }
    ];
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const { type, message, title } = (e as CustomEvent).detail;
      const id = String(Date.now());
      setToasts(prev => [{ id, type, message, title: title || (type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : type === 'warning' ? 'Alerta' : 'Informação') }, ...prev]);
      
      const newNotif = {
        id,
        type,
        title: title || (type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : type === 'warning' ? 'Alerta' : 'Informação'),
        message,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        read: false
      };
      setNotifications(prev => {
        const updated = [newNotif, ...prev];
        localStorage.setItem('logta-notifications', JSON.stringify(updated));
        return updated;
      });

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    const handleToggle = () => {
      setIsNotificationsOpen(prev => !prev);
    };

    window.addEventListener('show-toast', handleToast);
    window.addEventListener('toggle-notifications', handleToggle);
    
    // Register global window helper
    (window as any).showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type, message, title } }));
    };
    (window as any).toggleNotifications = () => {
      window.dispatchEvent(new CustomEvent('toggle-notifications'));
    };

    return () => {
      window.removeEventListener('show-toast', handleToast);
      window.removeEventListener('toggle-notifications', handleToggle);
    };
  }, []);

  useEffect(() => {
    const openCalc = () => setCalcOpen(true);
    window.addEventListener('logta-open-calculator', openCalc);
    return () => window.removeEventListener('logta-open-calculator', openCalc);
  }, []);

  const [usersList, setUsersList] = useState<any[]>(() => {
    const saved = localStorage.getItem('logta-registered-users');
    if (saved) return JSON.parse(saved);
    const initial = [
      {
        id: '1',
        nome: 'Alison Thiago',
        email: 'alison@logta.com',
        senha: '••••••••',
        cargo: 'Admin',
        filial: 'Matriz - São Paulo',
        status: 'Ativo',
        permissions: {
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
        }
      },
      {
        id: '2',
        nome: 'Marcos Souza',
        email: 'marcos.souza@logta.com',
        senha: '••••••••',
        cargo: 'Operacional',
        filial: 'Filial - Rio de Janeiro',
        status: 'Ativo',
        permissions: {
          acessoGlobal: { acessarSistema: true, verDashboard: true, acessarNotif: true, acessarMapa: true },
          fretes: { verFretes: true, criarFretes: true, editarFretes: true, cancelarFretes: false, atribuirMotorista: true, alterarStatus: true },
          roteirizacao: { verMapa: true, criarRotas: true, editarRotas: true, reotimizarRotas: false, veiculosTempoReal: true },
          financeiro: { verFinanceiro: false, contasReceber: false, contasPagar: false, editarValores: false, lucroFrete: false, exportarRelatorios: false },
          fiscal: { emitirCte: true, cancelarCte: false, emitirMdfe: true, verDocsFiscais: true, reenviarSefaz: false },
          crm: { verClientes: true, criarClientes: false, editarClientes: false, historicoFretes: true, financeiroCliente: false, riscoCliente: false },
          rh: { verFuncionarios: false, criarColaboradores: false, editarFuncionarios: false, folhaPagamento: false, gerenciarMotoristas: true, verDesempenho: false },
          frota: { verVeiculos: true, criarVeiculos: false, editarVeiculos: false, verManutencao: true, gerenciarPneus: false, consumoCombustivel: false },
          pgr: { monitoramentoRisco: true, configurarPgr: false, verOcorrencias: true, gerenciarSeguros: false, acessarRastreadores: false },
          configuracoes: { configuracoesGerais: false, dadosEmpresa: false, configurarWhitelabel: false, configurarDominio: false, configurarIntegracoes: false, gerenciarUsuarios: false },
          notificacoes: { inboxLogistica: true, criarAutomacoes: false, editarAutomacoes: false, receberAlertas: true },
          relatorios: { relatoriosOperacionais: true, relatoriosFinanceiros: false, exportarRelatoriosTab: false, relatoriosClientes: false, relatoriosMotoristas: false },
          controleAvancado: { criarUsuarios: false, editarPermissoes: false, bloquearUsuarios: false, acessarLogs: false, resetarDados: false, configurarGlobal: false }
        }
      },
      {
        id: '3',
        nome: 'Beatriz Costa',
        email: 'beatriz.costa@logta.com',
        senha: '••••••••',
        cargo: 'Financeiro',
        filial: 'Matriz - São Paulo',
        status: 'Ativo',
        permissions: {
          acessoGlobal: { acessarSistema: true, verDashboard: true, acessarNotif: true, acessarMapa: false },
          fretes: { verFretes: true, criarFretes: false, editarFretes: false, cancelarFretes: false, atribuirMotorista: false, alterarStatus: false },
          roteirizacao: { verMapa: false, criarRotas: false, editarRotas: false, reotimizarRotas: false, veiculosTempoReal: false },
          financeiro: { verFinanceiro: true, contasReceber: true, contasPagar: true, editarValores: true, lucroFrete: true, exportarRelatorios: true },
          fiscal: { emitirCte: false, cancelarCte: false, emitirMdfe: false, verDocsFiscais: true, reenviarSefaz: false },
          crm: { verClientes: true, criarClientes: false, editarClientes: false, historicoFretes: false, financeiroCliente: true, riscoCliente: false },
          rh: { verFuncionarios: false, criarColaboradores: false, editarFuncionarios: false, folhaPagamento: true, gerenciarMotoristas: false, verDesempenho: false },
          frota: { verVeiculos: false, criarVeiculos: false, editarVeiculos: false, verManutencao: false, gerenciarPneus: false, consumoCombustivel: true },
          pgr: { monitoramentoRisco: false, configurarPgr: false, verOcorrencias: false, gerenciarSeguros: true, acessarRastreadores: false },
          configuracoes: { configuracoesGerais: false, dadosEmpresa: false, configurarWhitelabel: false, configurarDominio: false, configurarIntegracoes: false, gerenciarUsuarios: false },
          notificacoes: { inboxLogistica: false, criarAutomacoes: false, editarAutomacoes: false, receberAlertas: false },
          relatorios: { relatoriosOperacionais: false, relatoriosFinanceiros: true, exportarRelatoriosTab: true, relatoriosClientes: true, relatoriosMotoristas: false },
          controleAvancado: { criarUsuarios: false, editarPermissoes: false, bloquearUsuarios: false, acessarLogs: false, resetarDados: false, configurarGlobal: false }
        }
      }
    ];
    localStorage.setItem('logta-registered-users', JSON.stringify(initial));
    return initial;
  });

  const [selectedUserId, setSelectedUserId] = useState<string>('1');

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

  useEffect(() => {
    const user = usersList.find(u => u.id === selectedUserId);
    if (user) {
      setUserInfo({
        nome: user.nome,
        email: user.email,
        senha: user.senha,
        cargo: user.cargo,
        filial: user.filial,
        status: user.status
      });
      setPermissions(user.permissions);
    }
  }, [selectedUserId]);

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

  return (
    <header className="h-20 bg-transparent flex items-center justify-between px-8 z-50">
      <div className="flex items-center gap-4">
        {config.logoUrl ? (
          <img src={config.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
        ) : (
          <div className="flex items-center gap-3">
            <svg className="w-10 h-10 flex-shrink-0 text-primary" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 10 V90 H90 V60 H40 V10 Z" fill="currentColor"></path>
              <rect x="50" y="10" width="40" height="40" fill="currentColor"></rect>
            </svg>
            <div className="flex items-start text-[28px] font-black text-gray-900 tracking-[-0.04em] leading-none">
              {config.companyName === 'LOGTA' ? 'Logta' : config.companyName}
              {config.companyName === 'LOGTA' && <sup className="text-[10px] ml-1 mt-1 font-black">®</sup>}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-6">
        {/* Quick Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setCalcOpen(true)}
            title="Calculadora Logta"
            aria-label="Calculadora Logta"
            className="relative flex cursor-pointer items-center justify-center rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-primary transition-all hover:border-primary/40 hover:bg-primary/10"
          >
            <Calculator size={20} />
          </button>
          <Link to="/agenda" title="Agenda & CRM" className="relative cursor-pointer bg-black text-white hover:opacity-90 transition-all p-2.5 rounded-xl shadow-md flex items-center justify-center">
            <Calendar size={20} className="text-white" />
          </Link>
          <Link to="/relatorios" title="Relatórios & BI" className="relative cursor-pointer text-gray-400 hover:text-primary transition-colors p-2 hover:bg-white rounded-xl">
            <BarChart3 size={24} />
          </Link>
          <Link to="/mapa-ao-vivo" title="Mapa ao Vivo" className="relative cursor-pointer text-gray-400 hover:text-primary transition-colors p-2 hover:bg-white rounded-xl">
            <Map size={24} />
          </Link>
          <div 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative cursor-pointer text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-white rounded-xl"
            title="Alertas & Notificações"
          >
            <Bell size={24} />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (isIaOpen) closeIa();
                else {
                  setIsHelpOpen(false);
                  openIa();
                }
              }}
              className={`relative cursor-pointer rounded-xl p-2 transition-all ${
                isIaOpen
                  ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                  : 'text-[#C3C8D0] hover:bg-white hover:text-gray-900'
              }`}
              title="IA Operacional Logta"
              aria-label="Abrir assistente IA"
              aria-pressed={isIaOpen}
            >
              <Sparkles size={19} strokeWidth={2} />
            </button>
          </div>

          <div className="relative">
            <div
              onClick={() => {
                setIsHelpOpen(!isHelpOpen);
                if (!isHelpOpen) closeIa();
              }}
              className="relative cursor-pointer rounded-xl p-2 text-[#C3C8D0] transition-colors hover:bg-white hover:text-gray-900"
              title="Canais de Ajuda"
            >
              <HelpCircle size={19} strokeWidth={2} />
            </div>

            {isHelpOpen && (
              <div className="absolute top-full right-0 mt-3 bg-[#18191B] rounded-[32px] border border-neutral-800 shadow-2xl p-8 z-[100] w-[580px] text-left animate-in fade-in slide-in-from-top-4 duration-200">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-800">
                  <div>
                    <h3 className="text-lg font-black text-white leading-none tracking-tight">Canais de Ajuda</h3>
                    <p className="text-[11px] text-neutral-400 font-semibold tracking-normal mt-1.5">Escolha como você quer ser atendido agora.</p>
                  </div>
                </div>

                {/* Columns */}
                <div className="grid grid-cols-2 gap-8 relative">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-950/40 text-blue-400 rounded-lg flex items-center justify-center shrink-0">
                        <HelpCircle size={16} />
                      </div>
                      <h4 className="text-xs font-bold text-white">Central de Ajuda Logta</h4>
                    </div>
                    <p className="text-[11px] text-neutral-300 font-normal leading-relaxed">
                      Dúvidas sobre o sistema ERP, faturamento, rotas, financeiro, motoristas e CRM.
                    </p>
                    <div className="pt-2 space-y-1">
                      <button 
                        onClick={() => {
                          setIsHelpOpen(false);
                          openIa();
                        }}
                        className="w-full text-left text-xs font-semibold text-primary hover:text-white transition-colors block cursor-pointer py-1"
                      >
                        Conversar com a IA Operacional
                      </button>
                      <button 
                        onClick={() => {
                          setIsHelpOpen(false);
                          (window as any).showToast?.('success', 'Chamado #T-8891 aberto com suporte humano!', 'Suporte Ativo');
                        }}
                        className="w-full text-left text-xs font-semibold text-primary hover:text-white transition-colors block cursor-pointer py-1"
                      >
                        Acessar Suporte (24h/7)
                      </button>
                    </div>
                  </div>

                  {/* Splitter Line */}
                  <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[1px] bg-neutral-800 flex items-center justify-center">
                    <span className="bg-[#18191B] border border-neutral-800 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-neutral-400 uppercase">ou</span>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4 pl-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-950/40 text-green-400 rounded-lg flex items-center justify-center shrink-0">
                        <DollarSign size={16} />
                      </div>
                      <h4 className="text-xs font-bold text-white">Canal de Vendas</h4>
                    </div>
                    <p className="text-[11px] text-neutral-300 font-normal leading-relaxed">
                      Planos, upgrades de recursos, contratação e whitelabel para transportadoras.
                    </p>
                    <div className="pt-2 space-y-1">
                      <button 
                        onClick={() => {
                          setIsHelpOpen(false);
                          (window as any).showToast?.('success', 'Planos de assinatura carregados!', 'Comercial');
                        }}
                        className="w-full text-left text-xs font-semibold text-primary hover:text-white transition-colors block cursor-pointer py-1"
                      >
                        Consultar Nossos Planos
                      </button>
                      <button 
                        onClick={() => {
                          setIsHelpOpen(false);
                          (window as any).showToast?.('success', 'Contato comercial enviado para consultor!', 'Contato Enviado');
                        }}
                        className="w-full text-left text-xs font-semibold text-primary hover:text-white transition-colors block cursor-pointer py-1"
                      >
                        Falar com Canal de Vendas
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="h-8 w-[1px] bg-gray-200" />

        <div className="relative">
          <div 
            className="flex items-center gap-4 cursor-pointer hover:bg-white/50 p-2 rounded-2xl transition-all"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase">{displayRole}</p>
            </div>
            <LogtaUserAvatar variant="header" />
          </div>

        {isProfileOpen && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-[#18191B] rounded-3xl shadow-xl shadow-gray-950/50 border border-neutral-800 p-2 z-[100] animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="p-3 mb-2 bg-neutral-900 rounded-2xl border border-neutral-800 text-left">
              <p className="text-sm font-bold text-white">Alison Thiago</p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-normal mt-0.5">alison@logta.com</p>
            </div>
            <div className="space-y-1">
              <Link to="/perfil" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-[14px] transition-all">
                <User size={16} />
                Perfil
              </Link>
              <a 
                href={getHubMasterUrl()}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 rounded-[14px] transition-all"
              >
                <LayoutDashboard size={16} />
                Painel Master (Hub)
              </a>
              <Link 
                to="/permissoes" 
                onClick={() => setIsProfileOpen(false)} 
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-[14px] transition-all"
              >
                <Shield size={16} />
                Permissões de Acesso
              </Link>
              <Link to="/admin-settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-[14px] transition-all">
                <Settings size={16} />
                Configurações
              </Link>
              <Link to="/automacoes" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-[14px] transition-all">
                <Cpu size={16} />
                Automações
              </Link>
              <Link to="/ajuda" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-[14px] transition-all">
                <HelpCircle size={16} />
                Ajuda
              </Link>
            </div>
            <div className="h-px bg-neutral-800 my-2 mx-2" />
            <button 
              onClick={() => { window.location.href = '/'; }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-[14px] transition-all text-left cursor-pointer"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </div>
      </div>

      <LogtaToastStack
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
      <LogtaNotificationPanel
        open={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onOpenSettings={() => {
          setIsNotificationsOpen(false);
          window.location.href = '/admin-settings';
        }}
      />
      <LogtaCalculatorPopup
        open={calcOpen}
        onClose={() => setCalcOpen(false)}
        createdBy={displayName}
      />
    </header>
  );
};

const ChatEquipe = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'grupo' | 'individual'>('grupo');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(3);
  
  const [groupMessages, setGroupMessages] = useState<any[]>([
    { sender: 'Thiago (Comercial)', text: 'Boa tarde equipe! O frete FR-8890 já foi liberado?', time: '15:40', isUser: false },
    { sender: 'Roberto Silva (Motorista)', text: 'Sim Thiago, caminhão BRA-2L22 carregado e em trânsito pela Régis Bittencourt!', time: '15:42', isUser: false },
    { sender: 'Ana (Financeiro)', text: 'Ótimo, adiantamento de combustível de R$ 800,00 já foi depositado para o Roberto.', time: '15:45', isUser: false }
  ]);

  const [contactMessages, setContactMessages] = useState<Record<string, any[]>>({
    'Roberto Silva (Motorista)': [
      { sender: 'Roberto Silva (Motorista)', text: 'Alison, já estou chegando no posto de pedágio em Registro/SP.', time: '15:30', isUser: false }
    ],
    'Thiago (Comercial)': [
      { sender: 'Thiago (Comercial)', text: 'Alison, fechei a cotação de frete de Curitiba com o cliente Transportes Transville!', time: '15:35', isUser: false }
    ],
    'Ana (Financeiro)': [
      { sender: 'Ana (Financeiro)', text: 'Alison, o relatório fiscal do MDF-e e as guias estão prontas para assinatura.', time: '15:38', isUser: false }
    ]
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const timeString = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (activeTab === 'grupo') {
      const userMsg = {
        sender: 'Alison Thiago (Você)',
        text: input,
        time: timeString,
        isUser: true
      };
      setGroupMessages(prev => [...prev, userMsg]);
      setInput('');

      setTimeout(() => {
        const responses = [
          { sender: 'Roberto Silva (Motorista)', text: 'Recebido Alison! Acompanhando o painel geral aqui na rodovia.' },
          { sender: 'Thiago (Comercial)', text: 'Combinado! Qualquer novidade com o cliente aviso aqui no chat.' },
          { sender: 'Ana (Financeiro)', text: 'Perfeito, faturamento e CT-e emitidos com sucesso também!' }
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const teamMsg = {
          sender: randomResponse.sender,
          text: randomResponse.text,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          isUser: false
        };
        setGroupMessages(prev => [...prev, teamMsg]);
        playNotificationSound();
      }, 1500);

    } else if (activeTab === 'individual' && selectedContact) {
      const userMsg = {
        sender: 'Alison Thiago (Você)',
        text: input,
        time: timeString,
        isUser: true
      };
      setContactMessages(prev => ({
        ...prev,
        [selectedContact]: [...(prev[selectedContact] || []), userMsg]
      }));
      setInput('');

      setTimeout(() => {
        let textReply = "Recebido chefe! Estou operando aqui de acordo.";
        if (selectedContact.includes('Roberto')) {
          textReply = "Entendido Alison! Parando no próximo posto de apoio para descanso regulamentar.";
        } else if (selectedContact.includes('Thiago')) {
          textReply = "Combinado Alison! Iniciando prospecção para as novas cargas de retorno.";
        } else if (selectedContact.includes('Ana')) {
          textReply = "Tudo certo Alison! Já encaminhando as faturas para aprovação financeira.";
        }

        const teamMsg = {
          sender: selectedContact,
          text: textReply,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          isUser: false
        };
        setContactMessages(prev => ({
          ...prev,
          [selectedContact]: [...(prev[selectedContact] || []), teamMsg]
        }));
        playNotificationSound();
      }, 1500);
    }
  };

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}

    if (!isOpen && (window as any).showToast) {
      (window as any).showToast('info', `Nova mensagem no Chat da Equipe.`, 'Chat Equipe');
      setUnreadCount(prev => prev + 1);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="w-80 h-[640px] max-h-[78vh] bg-white border border-gray-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-6 duration-300">
          {/* Header (modelo concorrente, com nossas cores) */}
          <div className="bg-[#18191B] text-white px-4 pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center relative shrink-0">
                {activeTab === 'grupo' ? <Users size={18} className="text-white" /> : <User size={18} className="text-white" />}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-gray-900 rounded-full" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-black tracking-tight truncate">
                    {activeTab === 'grupo'
                      ? 'Chat da Equipe'
                      : (selectedContact ? selectedContact : 'Conversas Privadas')}
                  </h4>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      aria-label="Opções"
                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 transition-colors grid place-items-center cursor-pointer"
                    >
                      <span className="text-lg leading-none">⋯</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      aria-label="Fechar"
                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 transition-colors grid place-items-center cursor-pointer"
                    >
                      <span className="text-base font-black leading-none">✕</span>
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-green-400 font-bold uppercase tracking-normal mt-0.5">
                  6 colaboradores ativos
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Header Tabs */}
          <div className="bg-gray-50 border-b border-gray-100 p-1.5 flex gap-1 rounded-xl mx-3 mt-3 shadow-sm">
            <button 
              onClick={() => { setActiveTab('grupo'); setSelectedContact(null); }}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-normal transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'grupo' ? 'bg-[#18191B] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              <Users size={12} /> Grupo (Todos)
            </button>
            <button 
              onClick={() => setActiveTab('individual')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-normal transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'individual' ? 'bg-[#18191B] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              <User size={12} /> Individual (Direto)
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto bg-white scrollbar-hide flex flex-col text-left">
            {activeTab === 'grupo' ? (
              /* Group Messages */
              <div className="p-4 space-y-3 flex-1">
                <div className="flex justify-center">
                  <span className="text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">
                    Hoje
                  </span>
                </div>
                {groupMessages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[86%] ${m.isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {!m.isUser && (
                        <span className="text-[10px] font-black text-gray-400 px-1">
                          {m.sender}
                        </span>
                      )}
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-xs font-bold leading-relaxed shadow-sm border
                        ${m.isUser
                          ? 'bg-primary text-white border-primary/20 rounded-br-md'
                          : 'bg-gray-50 text-gray-800 border-gray-100 rounded-bl-md'}`}
                      >
                        {m.text}
                      </div>
                      <span className={`text-[10px] font-bold text-gray-400 px-1 ${m.isUser ? 'text-right' : 'text-left'}`}>
                        {m.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Individual Direct Messages */
              selectedContact ? (
                <div className="p-4 space-y-3 flex-1">
                  <button 
                    onClick={() => setSelectedContact(null)}
                    className="mb-2 py-1 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-[9px] rounded-full uppercase flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    ◀ Voltar para lista
                  </button>
                  {(contactMessages[selectedContact] || []).map((m, idx) => (
                    <div key={idx} className={`flex ${m.isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[86%] ${m.isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        {!m.isUser && (
                          <span className="text-[10px] font-black text-gray-400 px-1">
                            {m.sender}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-xs font-bold leading-relaxed shadow-sm border
                          ${m.isUser
                            ? 'bg-primary text-white border-primary/20 rounded-br-md'
                            : 'bg-gray-50 text-gray-800 border-gray-100 rounded-bl-md'}`}
                        >
                          {m.text}
                        </div>
                        <span className={`text-[10px] font-bold text-gray-400 px-1 ${m.isUser ? 'text-right' : 'text-left'}`}>
                          {m.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Contact Selection List */
                <div className="p-3 space-y-1 flex-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-normal mb-2 px-2">Selecione um colaborador:</p>
                  
                  <div 
                    onClick={() => setSelectedContact('Roberto Silva (Motorista)')}
                    className="p-3 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl flex items-center gap-3 cursor-pointer transition-all"
                  >
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">🚚</div>
                    <div className="text-left">
                      <h4 className="text-xs font-black text-gray-900 leading-tight">Roberto Silva</h4>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Motorista • Online</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedContact('Thiago (Comercial)')}
                    className="p-3 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl flex items-center gap-3 cursor-pointer transition-all"
                  >
                    <div className="w-8 h-8 bg-green-50 text-green-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">💼</div>
                    <div className="text-left">
                      <h4 className="text-xs font-black text-gray-900 leading-tight">Thiago</h4>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Comercial • Online</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedContact('Ana (Financeiro)')}
                    className="p-3 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl flex items-center gap-3 cursor-pointer transition-all"
                  >
                    <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">💰</div>
                    <div className="text-left">
                      <h4 className="text-xs font-black text-gray-900 leading-tight">Ana</h4>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Financeiro • Online</p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Input Panel */}
          {(!isOpen || activeTab === 'grupo' || selectedContact) && (
            <div className="p-3 border-t border-gray-100 bg-white flex gap-2 items-center">
              <button
                type="button"
                aria-label="Anexar"
                className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:border-gray-200 transition-colors grid place-items-center text-gray-600 cursor-pointer shrink-0"
              >
                <span className="text-lg leading-none">📎</span>
              </button>
              <input 
                type="text"
                placeholder={activeTab === 'grupo' ? "Digite sua mensagem para a equipe..." : `Digite sua mensagem privada...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <button 
                onClick={handleSend}
                className="w-10 h-10 bg-primary hover:bg-primary/95 text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 font-black"
              >
                <span className="text-lg leading-none">➔</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Toggle Bubble */}
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          setUnreadCount(0);
        }}
        className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/30 hover:bg-primary/95 transition-all transform hover:scale-110 active:scale-95 duration-200 cursor-pointer relative"
      >
        <MessageSquare size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5.5 h-5.5 bg-red-500 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

function App() {
  const location = useLocation();
  const isStandalonePage = isLogtaPublicPath(location.pathname);

  if (isStandalonePage) {
    return (
      <Routes>
        <Route path="/" element={<Vendas />} />
        <Route path="/login" element={<Login />} />
        <Route path="/ponto/:companySlug/:unitToken" element={<PontoPublicView />} />
        <Route path="/orcamento/publico/:token" element={<OrcamentoPublicView />} />
        <Route path="/motorista/rota/:token" element={<MotoristaRotaPublicView />} />
        <Route path="/calc/:token" element={<LogtaCalculatorPublicView />} />
      </Routes>
    );
  }

  return (
    <LogtaAuthGate>
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden text-gray-900 font-sans selection:bg-primary/30 selection:text-gray-900">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen min-w-0">
        <Header />
        <div className="flex min-h-0 flex-1 flex-col px-8 pb-8 pt-4">
          <LogtaGlobalOperationalStrip />
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-sm">
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
            <Routes>
              <Route path="/inicio" element={<Inicio />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/crm/*" element={<CRM />} />
              <Route path="/fretes/*" element={<Fretes />} />
              <Route path="/roteirizacao/*" element={<Roteirizacao />} />
              <Route path="/mapa-ao-vivo" element={<MapaAoVivo />} />
              <Route path="/frota/*" element={<Frota />} />
              <Route path="/pgr/*" element={<PGR />} />
              <Route path="/documentos/*" element={<Documentos />} />
              <Route path="/financeiro/*" element={<Financeiro />} />
              <Route path="/rh/*" element={<RH />} />
              <Route path="/relatorios/*" element={<Relatorios />} />
              <Route path="/admin-settings/*" element={<Configuracoes />} />
              
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/permissoes" element={<Permissoes />} />
              <Route path="/automacoes" element={<Automacoes />} />
              <Route path="/ajuda" element={<Ajuda />} />
              <Route path="*" element={<Navigate to="/inicio" replace />} />
            </Routes>
            </div>
          </div>
        </div>
      </main>
      <ChatEquipe />
      <LogtaIaDrawer />
    </div>
    </LogtaAuthGate>
  );
}

const AppWrapper = () => (
  <TenantProvider>
    <LogtaSandboxBootstrap />
    <OperationalDataProvider>
      <LogtaIaProvider>
        <LogtaProfileProvider>
          <HubEntitlementsProvider>
            <LogtaModuleActivationProvider>
              <App />
            </LogtaModuleActivationProvider>
          </HubEntitlementsProvider>
        </LogtaProfileProvider>
      </LogtaIaProvider>
    </OperationalDataProvider>
  </TenantProvider>
);

export default AppWrapper;
