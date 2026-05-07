import React, { useState } from 'react';
import { User, Mail, Shield, Key, Bell, Phone, MapPin, Briefcase, Camera, CheckCircle2, Lock, Smartphone, Laptop, Globe, Plus, Check } from 'lucide-react';

const Perfil = () => {
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

  return (
    <div className="px-16 py-10 w-full animate-in fade-in duration-500 h-full overflow-y-auto scrollbar-hide">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Meu Perfil</h1>
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
                  <div className="relative group cursor-pointer">
                    <div className="w-28 h-28 bg-gradient-to-tr from-primary to-blue-600 rounded-[32px] border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl font-black">
                      AT
                    </div>
                    <div className="absolute inset-0 bg-black/50 rounded-[32px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <Camera className="text-white" size={24} />
                    </div>
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
    </div>
  );
};

export default Perfil;
