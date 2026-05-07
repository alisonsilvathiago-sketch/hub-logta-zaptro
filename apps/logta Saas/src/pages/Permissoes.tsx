import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Check, 
  Plus, 
  Users, 
  Settings, 
  Save, 
  User, 
  Lock, 
  Mail, 
  Building,
  Key,
  Trash2,
  ShieldAlert
} from 'lucide-react';

const Permissoes = () => {
  const [successSave, setSuccessSave] = useState(false);

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

    // Update the list too
    const updatedList = usersList.map(u => u.id === selectedUserId ? { 
      ...u, 
      cargo: preset.charAt(0).toUpperCase() + preset.slice(1),
      permissions: updated 
    } : u);
    setUsersList(updatedList);
    localStorage.setItem('logta-registered-users', JSON.stringify(updatedList));
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

  const handleSave = () => {
    localStorage.setItem('logta-user-info', JSON.stringify(userInfo));
    // Save current selected user permissions in the list too
    const updatedList = usersList.map(u => u.id === selectedUserId ? { 
      ...u, 
      nome: userInfo.nome,
      email: userInfo.email,
      cargo: userInfo.cargo,
      filial: userInfo.filial,
      status: userInfo.status,
      permissions: permissions 
    } : u);
    setUsersList(updatedList);
    localStorage.setItem('logta-registered-users', JSON.stringify(updatedList));

    setSuccessSave(true);
    if ((window as any).showToast) {
      (window as any).showToast('success', `Permissões de ${userInfo.nome} salvas com sucesso!`, 'Salvo com Sucesso');
    }
    setTimeout(() => {
      setSuccessSave(false);
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-transparent min-h-0 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-transparent border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">
              Permissões de Colaboradores
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">
              Controle Baseado em Funções (RBAC) • Gestão Ativa de Acessos
            </p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="px-8 py-4 bg-primary hover:bg-primary/95 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer self-stretch md:self-auto justify-center"
        >
          {successSave ? (
            <>
              <Check size={16} strokeWidth={3} className="animate-bounce" />
              Salvo com Sucesso!
            </>
          ) : (
            <>
              <Save size={16} strokeWidth={2.5} />
              Salvar Alterações
            </>
          )}
        </button>
      </div>

      {/* Page Body - Split Screen Layout */}
      <div className="flex-1 flex overflow-hidden min-h-[700px]">
        {/* Left Column: Collaborators List */}
        <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/40 p-6 space-y-6 shrink-0 overflow-y-auto scrollbar-hide">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">👥 Colaboradores ({usersList.length})</span>
            <button 
              onClick={() => {
                const newId = String(Date.now());
                const newUser = {
                  id: newId,
                  nome: 'Novo Colaborador',
                  email: 'novo@logta.com',
                  senha: '••••••••',
                  cargo: 'Operacional',
                  filial: 'Matriz - São Paulo',
                  status: 'Ativo',
                  permissions: {
                    acessoGlobal: { acessarSistema: true, verDashboard: true, acessarNotif: false, acessarMapa: false },
                    fretes: { verFretes: true, criarFretes: false, editarFretes: false, cancelarFretes: false, atribuirMotorista: false, alterarStatus: false },
                    roteirizacao: { verMapa: false, criarRotas: false, editarRotas: false, reotimizarRotas: false, veiculosTempoReal: false },
                    financeiro: { verFinanceiro: false, contasReceber: false, contasPagar: false, editarValores: false, lucroFrete: false, exportarRelatorios: false },
                    fiscal: { emitirCte: false, cancelarCte: false, emitirMdfe: false, verDocsFiscais: false, reenviarSefaz: false },
                    crm: { verClientes: false, criarClientes: false, editarClientes: false, historicoFretes: false, financeiroCliente: false, riscoCliente: false },
                    rh: { verFuncionarios: false, criarColaboradores: false, editarFuncionarios: false, folhaPagamento: false, gerenciarMotoristas: false, verDesempenho: false },
                    frota: { verVeiculos: false, criarVeiculos: false, editarVeiculos: false, verManutencao: false, gerenciarPneus: false, consumoCombustivel: false },
                    pgr: { monitoramentoRisco: false, configuringPgr: false, verOcorrencias: false, gerenciarSeguros: false, acessarRastreadores: false },
                    configuracoes: { configuracoesGerais: false, dadosEmpresa: false, configurarWhitelabel: false, configurarDominio: false, configurarIntegracoes: false, gerenciarUsuarios: false },
                    notificacoes: { inboxLogistica: false, criarAutomacoes: false, editarAutomacoes: false, receberAlertas: false },
                    relatorios: { relatoriosOperacionais: false, relatoriosFinanceiros: false, exportarRelatoriosTab: false, relatoriosClientes: false, relatoriosMotoristas: false },
                    controleAvancado: { criarUsuarios: false, editarPermissoes: false, bloquearUsuarios: false, acessarLogs: false, resetarDados: false, configurarGlobal: false }
                  }
                };
                const updatedList = [newUser, ...usersList];
                setUsersList(updatedList);
                localStorage.setItem('logta-registered-users', JSON.stringify(updatedList));
                setSelectedUserId(newId);
                if ((window as any).showToast) {
                  (window as any).showToast('info', 'Novo colaborador adicionado. Configure as permissões!');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:opacity-90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-primary/10"
            >
              <Plus size={12} strokeWidth={3} /> Novo
            </button>
          </div>

          <div className="space-y-3">
            {usersList.map((user) => {
              const isSelected = user.id === selectedUserId;
              return (
                <div 
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group text-left ${isSelected ? 'bg-white border-primary shadow-lg shadow-gray-200/40 scale-[1.01]' : 'bg-white border-gray-150 hover:border-gray-300'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-black text-gray-900">{user.nome}</h4>
                      <p className="text-[10px] text-gray-500 font-bold mt-0.5">{user.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md tracking-wider ${user.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.status}
                    </span>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-normal">💼 {user.cargo}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (usersList.length === 1) {
                          alert("Você não pode excluir o único usuário registrado.");
                          return;
                        }
                        const filtered = usersList.filter(u => u.id !== user.id);
                        setUsersList(filtered);
                        localStorage.setItem('logta-registered-users', JSON.stringify(filtered));
                        setSelectedUserId(filtered[0].id);
                        if ((window as any).showToast) {
                          (window as any).showToast('warning', `Colaborador ${user.nome} removido.`);
                        }
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Excluir Colaborador"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: User Profile Form & Permissions Grid */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
          
          {/* Profile Shortcut Presets */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2.5 h-2.5 bg-primary rounded-full" />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                🚀 Atalhos de Perfis Predefinidos (RBAC Rápido)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { id: 'admin', label: '👑 Administrador', desc: 'Acesso total irrestrito' },
                { id: 'operacional', label: '🚚 Operacional', desc: 'Fretes, Roteirização, Mapas' },
                { id: 'financeiro', label: '💰 Financeiro', desc: 'Contas, faturamento e BI' },
                { id: 'motorista', label: '👨‍✈️ Motorista', desc: 'Acesso app e status básico' },
                { id: 'rh', label: '👥 Recursos Humanos', desc: 'Colaboradores e folha' }
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id as any)}
                  className="p-5 bg-gray-50 hover:bg-gray-100 hover:scale-[1.01] border border-gray-200 hover:border-primary rounded-[22px] text-left transition-all cursor-pointer group flex flex-col justify-between min-h-[100px]"
                >
                  <h4 className="text-xs font-black text-gray-900 group-hover:text-primary transition-colors">
                    {preset.label}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-bold mt-2 leading-relaxed">
                    {preset.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* User Profile Info Form */}
          <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-150">
            <div className="flex items-center gap-2 mb-6">
              <User size={18} className="text-primary" />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                👤 Dados Cadastrais do Usuário Selecionado
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nome Completo</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={userInfo.nome}
                    onChange={(e) => {
                      const updated = { ...userInfo, nome: e.target.value };
                      setUserInfo(updated);
                      const updatedList = usersList.map(u => u.id === selectedUserId ? { ...u, nome: e.target.value } : u);
                      setUsersList(updatedList);
                    }}
                    className="w-full pl-11 pr-5 py-3.5 bg-white border border-gray-200 rounded-[16px] text-sm font-bold text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">E-mail de Acesso</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={userInfo.email}
                    onChange={(e) => {
                      const updated = { ...userInfo, email: e.target.value };
                      setUserInfo(updated);
                      const updatedList = usersList.map(u => u.id === selectedUserId ? { ...u, email: e.target.value } : u);
                      setUsersList(updatedList);
                    }}
                    className="w-full pl-11 pr-5 py-3.5 bg-white border border-gray-200 rounded-[16px] text-sm font-bold text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Senha de Acesso</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={userInfo.senha}
                    onChange={(e) => {
                      const updated = { ...userInfo, senha: e.target.value };
                      setUserInfo(updated);
                      const updatedList = usersList.map(u => u.id === selectedUserId ? { ...u, senha: e.target.value } : u);
                      setUsersList(updatedList);
                    }}
                    className="w-full pl-11 pr-5 py-3.5 bg-white border border-gray-200 rounded-[16px] text-sm font-bold text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cargo / Nível Operacional</label>
                <div className="relative">
                  <select 
                    value={userInfo.cargo}
                    onChange={(e) => {
                      const updated = { ...userInfo, cargo: e.target.value };
                      setUserInfo(updated);
                      const updatedList = usersList.map(u => u.id === selectedUserId ? { ...u, cargo: e.target.value } : u);
                      setUsersList(updatedList);
                    }}
                    className="w-full pl-11 pr-5 py-3.5 bg-white border border-gray-200 rounded-[16px] text-sm font-bold text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer appearance-none animate-none"
                  >
                    <option value="Admin">Administrador</option>
                    <option value="Operacional">Operacional</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="RH">Recursos Humanos</option>
                    <option value="Motorista">Motorista</option>
                    <option value="Suporte">Suporte Avançado</option>
                  </select>
                  <Settings size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Filial Vinculada</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={userInfo.filial}
                    onChange={(e) => {
                      const updated = { ...userInfo, filial: e.target.value };
                      setUserInfo(updated);
                      const updatedList = usersList.map(u => u.id === selectedUserId ? { ...u, filial: e.target.value } : u);
                      setUsersList(updatedList);
                    }}
                    className="w-full pl-11 pr-5 py-3.5 bg-white border border-gray-200 rounded-[16px] text-sm font-bold text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                  <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status da Conta</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      const updated = { ...userInfo, status: 'Ativo' };
                      setUserInfo(updated);
                      const updatedList = usersList.map(u => u.id === selectedUserId ? { ...u, status: 'Ativo' } : u);
                      setUsersList(updatedList);
                    }}
                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer border ${userInfo.status === 'Ativo' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' : 'bg-white border-gray-200 text-gray-400'}`}
                  >
                    Ativo
                  </button>
                  <button 
                    onClick={() => {
                      const updated = { ...userInfo, status: 'Bloqueado' };
                      setUserInfo(updated);
                      const updatedList = usersList.map(u => u.id === selectedUserId ? { ...u, status: 'Bloqueado' } : u);
                      setUsersList(updatedList);
                    }}
                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer border ${userInfo.status === 'Bloqueado' ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm' : 'bg-white border-gray-200 text-gray-400'}`}
                  >
                    Bloqueado
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Key size={18} className="text-primary" />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                🔐 Matriz Completa de Permissões de Acesso
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoriesList.map((cat) => (
                <div 
                  key={cat.id} 
                  className="bg-white border border-gray-200 rounded-[28px] p-6 hover:border-gray-900 hover:shadow-xl hover:shadow-gray-900/5 transition-all text-left flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100 mb-4">
                      {cat.label}
                    </h4>
                    <div className="space-y-3.5">
                      {cat.fields.map((field) => {
                        const isChecked = permissions[cat.id]?.[field.key];
                        return (
                          <label key={field.key} className="flex items-center gap-3 cursor-pointer group select-none">
                            <input 
                              type="checkbox" 
                              checked={!!isChecked} 
                              onChange={(e) => {
                                const updatedPerms = { ...permissions };
                                updatedPerms[cat.id] = { ...updatedPerms[cat.id], [field.key]: e.target.checked };
                                setPermissions(updatedPerms);
                                
                                const updatedList = usersList.map(u => u.id === selectedUserId ? { ...u, permissions: updatedPerms } : u);
                                setUsersList(updatedList);
                                localStorage.setItem('logta-registered-users', JSON.stringify(updatedList));
                              }}
                              className="hidden"
                            />
                            <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all ${isChecked ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 group-hover:border-gray-900 bg-white'}`}>
                              {isChecked && <Check size={12} strokeWidth={4} />}
                            </div>
                            <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                              {field.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Permissoes;
