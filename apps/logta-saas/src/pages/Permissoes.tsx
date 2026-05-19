import React, { useState, useEffect } from 'react';
import {
  Shield,
  Check,
  Plus,
  Settings,
  Save,
  User,
  Lock,
  Mail,
  Building,
  Key,
  Trash2,
  Pencil,
  X,
} from 'lucide-react';

/** Permissões iniciais para novo colaborador (perfil operacional leve). */
function defaultPermissionsForNewCollaborator() {
  return {
    acessoGlobal: { acessarSistema: true, verDashboard: true, acessarNotif: false, acessarMapa: false },
    fretes: { verFretes: true, criarFretes: false, editarFretes: false, cancelarFretes: false, atribuirMotorista: false, alterarStatus: false },
    roteirizacao: { verMapa: false, criarRotas: false, editarRotas: false, reotimizarRotas: false, veiculosTempoReal: false },
    financeiro: { verFinanceiro: false, contasReceber: false, contasPagar: false, editarValores: false, lucroFrete: false, exportarRelatorios: false },
    fiscal: { emitirCte: false, cancelarCte: false, emitirMdfe: false, verDocsFiscais: false, reenviarSefaz: false },
    crm: { verClientes: false, criarClientes: false, editarClientes: false, historicoFretes: false, financeiroCliente: false, riscoCliente: false },
    rh: { verFuncionarios: false, criarColaboradores: false, editarFuncionarios: false, folhaPagamento: false, gerenciarMotoristas: false, verDesempenho: false },
    frota: { verVeiculos: false, criarVeiculos: false, editarVeiculos: false, verManutencao: false, gerenciarPneus: false, consumoCombustivel: false },
    pgr: { monitoramentoRisco: false, configurarPgr: false, verOcorrencias: false, gerenciarSeguros: false, acessarRastreadores: false },
    configuracoes: { configuracoesGerais: false, dadosEmpresa: false, configurarWhitelabel: false, configurarDominio: false, configurarIntegracoes: false, gerenciarUsuarios: false },
    notificacoes: { inboxLogistica: false, criarAutomacoes: false, editarAutomacoes: false, receberAlertas: false },
    relatorios: { relatoriosOperacionais: false, relatoriosFinanceiros: false, exportarRelatoriosTab: false, relatoriosClientes: false, relatoriosMotoristas: false },
    controleAvancado: { criarUsuarios: false, editarPermissoes: false, bloquearUsuarios: false, acessarLogs: false, resetarDados: false, configurarGlobal: false },
  };
}

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
  /** Modo leitura: campos e status só exibem dados; "Editar" habilita alterações. */
  const [isEditingCadastro, setIsEditingCadastro] = useState(false);

  const [novoColabOpen, setNovoColabOpen] = useState(false);
  const [novoColabDraft, setNovoColabDraft] = useState({
    nome: '',
    email: '',
    senha: '',
    cargo: 'Operacional',
    filial: 'Matriz - São Paulo',
    status: 'Ativo' as 'Ativo' | 'Bloqueado',
  });

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
    setIsEditingCadastro(false);
  }, [selectedUserId]);

  const cargoLabel = (cargo: string) => {
    const m: Record<string, string> = {
      Admin: 'Administrador',
      Operacional: 'Operacional',
      Financeiro: 'Financeiro',
      RH: 'Recursos Humanos',
      Motorista: 'Motorista',
      Suporte: 'Suporte Avançado',
    };
    return m[cargo] ?? cargo;
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

  const openNovoColaboradorModal = () => {
    setNovoColabDraft({
      nome: '',
      email: '',
      senha: '',
      cargo: 'Operacional',
      filial: 'Matriz - São Paulo',
      status: 'Ativo',
    });
    setNovoColabOpen(true);
  };

  const handleAddColaboradorFromModal = () => {
    if (!novoColabDraft.nome.trim() || !novoColabDraft.email.trim()) {
      alert('Preencha nome completo e e-mail.');
      return;
    }
    const newId = String(Date.now());
    const newUser = {
      id: newId,
      nome: novoColabDraft.nome.trim(),
      email: novoColabDraft.email.trim().toLowerCase(),
      senha: novoColabDraft.senha.trim() || '••••••••',
      cargo: novoColabDraft.cargo,
      filial: novoColabDraft.filial.trim() || 'Matriz - São Paulo',
      status: novoColabDraft.status,
      permissions: defaultPermissionsForNewCollaborator(),
    };
    const updatedList = [newUser, ...usersList];
    setUsersList(updatedList);
    localStorage.setItem('logta-registered-users', JSON.stringify(updatedList));
    setSelectedUserId(newId);
    setNovoColabOpen(false);
    if ((window as any).showToast) {
      (window as any).showToast('success', 'Colaborador adicionado. Ajuste as permissões ao lado.', 'Novo colaborador');
    }
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
            <h1 className="logta-page-title">Permissões de Colaboradores</h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-normal text-gray-400">
              Controle Baseado em Funções (RBAC) • Gestão Ativa de Acessos
            </p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="px-8 py-4 bg-primary hover:bg-primary/95 text-white font-black rounded-2xl text-xs uppercase tracking-normal transition-all shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer self-stretch md:self-auto justify-center"
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
      <div className="flex-1 flex overflow-hidden min-h-0 md:min-h-[560px]">
        {/* Left Column: Collaborators List — compacta */}
        <div className="flex w-60 shrink-0 flex-col space-y-3 overflow-y-auto border-r border-gray-100 bg-gray-50/40 p-3 scrollbar-hide sm:w-64">
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-[9px] font-black uppercase tracking-normal text-gray-400">
              Colab. ({usersList.length})
            </span>
            <button
              type="button"
              onClick={openNovoColaboradorModal}
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[9px] font-black uppercase tracking-normal text-white shadow-sm shadow-primary/15 transition-all hover:opacity-90"
            >
              <Plus size={11} strokeWidth={3} /> Novo
            </button>
          </div>

          <ul className="flex flex-col gap-1">
            {usersList.map((user) => {
              const isSelected = user.id === selectedUserId;
              return (
                <li key={user.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedUserId(user.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedUserId(user.id);
                      }
                    }}
                    className={`group relative cursor-pointer rounded-lg border px-2.5 py-2 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-white shadow-sm shadow-primary/10 ring-1 ring-primary/20'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="truncate text-[12px] font-black leading-tight text-gray-900">{user.nome}</h4>
                          <span
                            className={`flex shrink-0 flex-wrap items-end justify-start rounded px-2 py-[2px] text-[7px] font-black uppercase leading-none tracking-normal ${
                              user.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {user.status}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[9px] font-semibold text-gray-500">{user.email}</p>
                        <p className="mt-0.5 truncate text-[8px] font-bold uppercase tracking-normal text-gray-400">
                          {user.cargo}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (usersList.length === 1) {
                            alert('Você não pode excluir o único usuário registrado.');
                            return;
                          }
                          const filtered = usersList.filter((u) => u.id !== user.id);
                          setUsersList(filtered);
                          localStorage.setItem('logta-registered-users', JSON.stringify(filtered));
                          setSelectedUserId(filtered[0].id);
                          if ((window as any).showToast) {
                            (window as any).showToast('warning', `Colaborador ${user.nome} removido.`);
                          }
                        }}
                        className="shrink-0 rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 cursor-pointer"
                        title="Excluir colaborador"
                        aria-label="Excluir colaborador"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right Column: User Profile Form & Permissions Grid */}
        <div className="flex-1 overflow-y-auto bg-[#F9FAFB] p-5 space-y-6 scrollbar-hide sm:p-6">
          {/* User Profile Info Form */}
          <div className="rounded-2xl border border-white bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <User size={18} className="text-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-normal text-gray-900">
                Dados cadastrais do usuário selecionado
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
              {!isEditingCadastro ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Nome Completo</label>
                    <div className="flex items-start gap-3 pt-0.5 text-sm font-bold text-gray-900">
                      <User size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden />
                      <span className="min-w-0 leading-snug">{userInfo.nome}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">E-mail de Acesso</label>
                    <div className="flex items-start gap-3 pt-0.5 text-sm font-bold text-gray-900">
                      <Mail size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden />
                      <span className="min-w-0 break-all leading-snug">{userInfo.email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Senha de Acesso</label>
                    <div className="flex items-start gap-3 pt-0.5 text-sm font-bold text-gray-900">
                      <Lock size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden />
                      <span className="min-w-0 leading-snug tracking-widest">{userInfo.senha}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Cargo / Nível Operacional</label>
                    <div className="flex items-start gap-3 pt-0.5 text-sm font-bold text-gray-900">
                      <Settings size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden />
                      <span className="min-w-0 leading-snug">{cargoLabel(userInfo.cargo)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Filial Vinculada</label>
                    <div className="flex items-start gap-3 pt-0.5 text-sm font-bold text-gray-900">
                      <Building size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden />
                      <span className="min-w-0 leading-snug">{userInfo.filial}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Status da Conta</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-normal ${
                          userInfo.status === 'Ativo'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-rose-200 bg-rose-50 text-rose-800'
                        }`}
                      >
                        {userInfo.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingCadastro(true)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-normal text-gray-700 shadow-sm transition-all hover:border-primary/40 hover:bg-blue-50/50 sm:py-3 sm:text-xs"
                      >
                        <Pencil size={13} strokeWidth={2.5} className="shrink-0 opacity-90" />
                        Editar
                      </button>
                    </div>
                    <p className="text-[9px] font-semibold text-gray-400">
                      Visualização somente leitura. Use Editar para alterar dados e status.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Nome Completo</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={userInfo.nome}
                        onChange={(e) => {
                          const updated = { ...userInfo, nome: e.target.value };
                          setUserInfo(updated);
                          const updatedList = usersList.map((u) =>
                            u.id === selectedUserId ? { ...u, nome: e.target.value } : u,
                          );
                          setUsersList(updatedList);
                        }}
                        className="w-full rounded-[16px] border border-gray-200 bg-white py-3.5 pl-11 pr-5 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                      <User size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">E-mail de Acesso</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={userInfo.email}
                        onChange={(e) => {
                          const updated = { ...userInfo, email: e.target.value };
                          setUserInfo(updated);
                          const updatedList = usersList.map((u) =>
                            u.id === selectedUserId ? { ...u, email: e.target.value } : u,
                          );
                          setUsersList(updatedList);
                        }}
                        className="w-full rounded-[16px] border border-gray-200 bg-white py-3.5 pl-11 pr-5 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                      <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Senha de Acesso</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={userInfo.senha}
                        onChange={(e) => {
                          const updated = { ...userInfo, senha: e.target.value };
                          setUserInfo(updated);
                          const updatedList = usersList.map((u) =>
                            u.id === selectedUserId ? { ...u, senha: e.target.value } : u,
                          );
                          setUsersList(updatedList);
                        }}
                        className="w-full rounded-[16px] border border-gray-200 bg-white py-3.5 pl-11 pr-5 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                      <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Cargo / Nível Operacional</label>
                    <div className="relative">
                      <select
                        value={userInfo.cargo}
                        onChange={(e) => {
                          const updated = { ...userInfo, cargo: e.target.value };
                          setUserInfo(updated);
                          const updatedList = usersList.map((u) =>
                            u.id === selectedUserId ? { ...u, cargo: e.target.value } : u,
                          );
                          setUsersList(updatedList);
                        }}
                        className="w-full cursor-pointer appearance-none rounded-[16px] border border-gray-200 bg-white py-3.5 pl-11 pr-5 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                      >
                        <option value="Admin">Administrador</option>
                        <option value="Operacional">Operacional</option>
                        <option value="Financeiro">Financeiro</option>
                        <option value="RH">Recursos Humanos</option>
                        <option value="Motorista">Motorista</option>
                        <option value="Suporte">Suporte Avançado</option>
                      </select>
                      <Settings size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Filial Vinculada</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={userInfo.filial}
                        onChange={(e) => {
                          const updated = { ...userInfo, filial: e.target.value };
                          setUserInfo(updated);
                          const updatedList = usersList.map((u) =>
                            u.id === selectedUserId ? { ...u, filial: e.target.value } : u,
                          );
                          setUsersList(updatedList);
                        }}
                        className="w-full rounded-[16px] border border-gray-200 bg-white py-3.5 pl-11 pr-5 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                      <Building size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Status da Conta</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...userInfo, status: 'Ativo' };
                          setUserInfo(updated);
                          const updatedList = usersList.map((u) =>
                            u.id === selectedUserId ? { ...u, status: 'Ativo' } : u,
                          );
                          setUsersList(updatedList);
                          localStorage.setItem('logta-registered-users', JSON.stringify(updatedList));
                        }}
                        className={`min-w-0 flex-1 cursor-pointer rounded-xl border py-2.5 text-[10px] font-black uppercase tracking-normal transition-all sm:py-3 sm:text-xs ${
                          userInfo.status === 'Ativo'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-400'
                        }`}
                      >
                        Ativo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...userInfo, status: 'Bloqueado' };
                          setUserInfo(updated);
                          const updatedList = usersList.map((u) =>
                            u.id === selectedUserId ? { ...u, status: 'Bloqueado' } : u,
                          );
                          setUsersList(updatedList);
                          localStorage.setItem('logta-registered-users', JSON.stringify(updatedList));
                        }}
                        className={`min-w-0 flex-1 cursor-pointer rounded-xl border py-2.5 text-[10px] font-black uppercase tracking-normal transition-all sm:py-3 sm:text-xs ${
                          userInfo.status === 'Bloqueado'
                            ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-400'
                        }`}
                      >
                        Bloqueado
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('logta-registered-users', JSON.stringify(usersList));
                          setIsEditingCadastro(false);
                          if ((window as any).showToast) {
                            (window as any).showToast('success', 'Dados cadastrais atualizados.', 'Concluído');
                          }
                        }}
                        className="flex min-w-[5.5rem] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-primary bg-primary py-2.5 text-[10px] font-black uppercase tracking-normal text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/95 sm:min-w-0 sm:py-3 sm:text-xs"
                      >
                        <Pencil size={13} strokeWidth={2.5} className="shrink-0 opacity-90" />
                        Concluir
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-0.5">
              <Key size={18} className="text-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-normal text-gray-900">
                Matriz de permissões de acesso
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {categoriesList.map((cat) => (
                <div
                  key={cat.id}
                  className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
                >
                  <div>
                    <h4 className="mb-3 border-b border-gray-100 pb-2 text-[10px] font-black uppercase tracking-normal text-gray-900">
                      {cat.label}
                    </h4>
                    <div className="space-y-2.5">
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
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-0 transition-all ${
                                isChecked
                                  ? 'bg-primary text-white shadow-sm shadow-primary/25'
                                  : 'bg-white ring-1 ring-inset ring-gray-200 group-hover:bg-blue-50/60 group-hover:ring-primary/70'
                              }`}
                            >
                              {isChecked && <Check size={12} strokeWidth={4} />}
                            </div>
                            <span className="text-xs font-bold text-gray-600 transition-colors group-hover:text-primary">
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

      {novoColabOpen ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="novo-colab-title"
        >
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setNovoColabOpen(false)}
          />
          <div className="relative left-[-1px] z-10 w-full max-w-[464px] overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-neutral-800 px-[26px] py-[30px]">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <Plus size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 id="novo-colab-title" className="text-sm font-black text-white">
                    Novo colaborador
                  </h2>
                  <p className="text-[10px] font-semibold text-neutral-400">Preencha os dados para criar o acesso</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNovoColabOpen(false)}
                className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[min(70vh,520px)] space-y-3 overflow-y-auto px-[26px] py-[14px] scrollbar-hide">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-normal text-neutral-500">Nome completo</label>
                <input
                  type="text"
                  value={novoColabDraft.nome}
                  onChange={(e) => setNovoColabDraft((d) => ({ ...d, nome: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none placeholder:text-neutral-600 focus:border-primary focus:ring-2 focus:ring-primary/25"
                  placeholder="Nome do colaborador"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-normal text-neutral-500">E-mail de acesso</label>
                <input
                  type="email"
                  value={novoColabDraft.email}
                  onChange={(e) => setNovoColabDraft((d) => ({ ...d, email: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none placeholder:text-neutral-600 focus:border-primary focus:ring-2 focus:ring-primary/25"
                  placeholder="email@empresa.com"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-normal text-neutral-500">Senha provisória</label>
                <input
                  type="password"
                  value={novoColabDraft.senha}
                  onChange={(e) => setNovoColabDraft((d) => ({ ...d, senha: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none placeholder:text-neutral-600 focus:border-primary focus:ring-2 focus:ring-primary/25"
                  placeholder="Opcional"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-normal text-neutral-500">Cargo</label>
                <select
                  value={novoColabDraft.cargo}
                  onChange={(e) => setNovoColabDraft((d) => ({ ...d, cargo: e.target.value }))}
                  className="w-full cursor-pointer rounded-xl border border-neutral-700 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                >
                  <option value="Admin" className="bg-neutral-900 text-white">
                    Administrador
                  </option>
                  <option value="Operacional" className="bg-neutral-900 text-white">
                    Operacional
                  </option>
                  <option value="Financeiro" className="bg-neutral-900 text-white">
                    Financeiro
                  </option>
                  <option value="RH" className="bg-neutral-900 text-white">
                    Recursos Humanos
                  </option>
                  <option value="Motorista" className="bg-neutral-900 text-white">
                    Motorista
                  </option>
                  <option value="Suporte" className="bg-neutral-900 text-white">
                    Suporte Avançado
                  </option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-normal text-neutral-500">Filial</label>
                <input
                  type="text"
                  value={novoColabDraft.filial}
                  onChange={(e) => setNovoColabDraft((d) => ({ ...d, filial: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none placeholder:text-neutral-600 focus:border-primary focus:ring-2 focus:ring-primary/25"
                  placeholder="Matriz - São Paulo"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-normal text-neutral-500">Status inicial</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNovoColabDraft((d) => ({ ...d, status: 'Ativo' }))}
                    className={`flex-1 rounded-xl border py-2 text-[10px] font-black uppercase tracking-normal ${
                      novoColabDraft.status === 'Ativo'
                        ? 'border-emerald-500/60 bg-emerald-950/80 text-emerald-300'
                        : 'border-neutral-700 bg-neutral-900 text-neutral-500'
                    }`}
                  >
                    Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovoColabDraft((d) => ({ ...d, status: 'Bloqueado' }))}
                    className={`flex-1 rounded-xl border py-2 text-[10px] font-black uppercase tracking-normal ${
                      novoColabDraft.status === 'Bloqueado'
                        ? 'border-rose-500/60 bg-rose-950/80 text-rose-300'
                        : 'border-neutral-700 bg-neutral-900 text-neutral-500'
                    }`}
                  >
                    Bloqueado
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 border-t border-neutral-800 bg-black px-[26px] py-[30px]">
              <button
                type="button"
                onClick={() => setNovoColabOpen(false)}
                className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 py-2.5 text-[11px] font-black uppercase tracking-normal text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddColaboradorFromModal}
                className="flex-1 rounded-xl bg-primary py-2.5 text-[11px] font-black uppercase tracking-normal text-white shadow-md shadow-primary/30 transition-colors hover:bg-primary/95"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Permissoes;
