import React from 'react';
import { Link, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Building2, Palette, Globe, DollarSign, FileText, Bell, Shield, Settings, 
  Upload, CreditCard, Lock, CheckCircle2, QrCode, Plus
} from 'lucide-react';

// --- Sub-Views ---

const EmpresaView = () => {
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    if ((window as any).showToast) {
      (window as any).showToast('success', 'Dados cadastrais da empresa salvos com sucesso!', 'Dados Salvos');
    } else {
      alert('Dados salvos com sucesso!');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm flex gap-10 items-start">
        <div className="flex-shrink-0 flex flex-col gap-4">
          <div className="w-40 h-40 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-all cursor-pointer group">
            <Upload size={32} className="mb-2 group-hover:-translate-y-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-normal text-center px-4">Upload do Logo (Empresa)</span>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Razão Social</label>
            <input type="text" defaultValue="Logta Transportes LTDA" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Nome Fantasia</label>
            <input type="text" defaultValue="Logta Matriz" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">CNPJ</label>
            <input type="text" defaultValue="12.345.678/0001-99" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Endereço Completo</label>
            <input type="text" defaultValue="Av. Paulista, 1000 - São Paulo, SP" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={handleSave} className="px-10 py-5 bg-gray-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-normal hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 cursor-pointer">Salvar Dados da Empresa</button>
      </div>
    </div>
  );
};

const WhiteLabelView = () => {
  const handleSaveBranding = (e: React.MouseEvent) => {
    e.preventDefault();
    if ((window as any).showToast) {
      (window as any).showToast('success', 'Configurações de marca e White Label aplicadas com sucesso!', 'Marca Atualizada');
    } else {
      alert('Configurações salvas!');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm space-y-8">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Cores & Tema</h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Cor Primária (Sistema)</label>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D7FF00] shadow-sm border border-gray-100" />
                <input type="text" defaultValue="#D7FF00" className="flex-1 px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Tema Padrão</label>
              <div className="flex gap-4">
                <button className="flex-1 py-4 bg-gray-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-normal">Dark Mode</button>
                <button className="flex-1 py-4 bg-gray-100 text-gray-500 hover:text-gray-900 rounded-[20px] text-[10px] font-black uppercase tracking-normal transition-colors">Light Mode</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm space-y-8">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Marca (White Label)</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Nome da Plataforma</label>
              <input type="text" defaultValue="Logta Carrier System" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-[24px]">
              <div>
                <p className="text-sm font-bold text-gray-900">Remover "Powered by Zaptro"</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-normal mt-1">Exclusivo plano Enterprise</p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-gray-900 rounded-full absolute right-1 top-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={handleSaveBranding} className="px-10 py-5 bg-primary text-gray-900 rounded-[24px] text-[11px] font-black uppercase tracking-normal hover:opacity-90 transition-all shadow-xl shadow-primary/20 cursor-pointer">Aplicar Branding</button>
      </div>
    </div>
  );
};

const DominioView = () => {
  const handleVerify = (e: React.MouseEvent) => {
    e.preventDefault();
    if ((window as any).showToast) {
      (window as any).showToast('success', 'Domínio verificado e certificado SSL validado com sucesso!', 'Domínio Ativo');
    } else {
      alert('Domínio verificado com sucesso!');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm max-w-3xl">
        <h3 className="text-xl font-bold text-gray-900 mb-8 tracking-tight">Domínio Personalizado</h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Domínio de Acesso (White Label)</label>
            <div className="flex gap-4">
              <input type="text" placeholder="app.suaempresa.com.br" defaultValue="app.logta.com.br" className="flex-1 px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
              <button onClick={handleVerify} className="px-6 py-4 bg-gray-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-normal cursor-pointer">Verificar</button>
            </div>
          </div>
          
          <div className="p-6 bg-green-50 border border-green-100 rounded-[28px] flex items-start gap-4">
            <CheckCircle2 className="text-green-500 flex-shrink-0 mt-1" size={24} />
            <div>
              <p className="text-sm font-bold text-green-900 mb-1">Domínio Ativo e Protegido</p>
              <p className="text-[10px] text-green-700 font-bold uppercase tracking-normal leading-relaxed">O certificado SSL (HTTPS) foi gerado e o domínio está apontando corretamente para nossos servidores.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">E-mail Remetente Padrão (SMTP)</label>
            <input type="email" defaultValue="no-reply@logta.com.br" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </div>
    </div>
  );
};

const FinanceiroView = ({ onAddClick }: any) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
    <div className="flex justify-between items-center bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm">
      <div>
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Métodos de Faturamento</h3>
        <p className="text-xs text-gray-400 font-medium mt-1">Configure suas contas bancárias e credenciais para receber pagamentos de clientes.</p>
      </div>
      <button 
        onClick={onAddClick}
        className="px-5 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer"
      >
        <Plus size={16} /> Adicionar Forma de Pagamento
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm space-y-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <QrCode size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Recebimento via PIX</h3>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Tipo de Chave</label>
            <select className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20">
              <option>CNPJ</option>
              <option>E-mail</option>
              <option>Chave Aleatória</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Chave PIX</label>
            <input type="text" defaultValue="12.345.678/0001-99" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm space-y-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <CreditCard size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Dados Bancários (Boletos/TED)</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Banco</label>
            <input type="text" defaultValue="341 - Itaú Unibanco" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Agência</label>
            <input type="text" defaultValue="0001" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Conta Corrente</label>
            <input type="text" defaultValue="12345-6" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FiscalView = () => {
  const handleSaveFiscal = (e: React.MouseEvent) => {
    e.preventDefault();
    if ((window as any).showToast) {
      (window as any).showToast('success', 'Configurações fiscais e Certificado Digital salvos com sucesso!', 'Faturamento Ativo');
    } else {
      alert('Configurações fiscais salvas com sucesso!');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">Emissão (CT-e / MDF-e)</h3>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Regime Tributário</label>
              <select className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20">
                <option>Lucro Presumido</option>
                <option>Simples Nacional</option>
                <option>Lucro Real</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Série CT-e</label>
                <input type="text" defaultValue="1" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Série MDF-e</label>
                <input type="text" defaultValue="1" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">Certificado Digital</h3>
            <div className="p-8 border-2 border-dashed border-primary/30 bg-primary/5 rounded-[32px] text-center cursor-pointer hover:bg-primary/10 transition-colors">
              <FileText size={32} className="mx-auto mb-4 text-primary" />
              <p className="text-sm font-bold text-gray-900">Upload Certificado A1 (.pfx)</p>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-normal mt-2">Válido até 12/2027</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button onClick={handleSaveFiscal} className="px-10 py-5 bg-gray-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-normal hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 cursor-pointer">Salvar Parâmetros Fiscais</button>
        </div>
      </div>
    </div>
  );
};

const NotificacoesView = () => (
  <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm max-w-3xl animate-in fade-in duration-500">
    <h3 className="text-xl font-bold text-gray-900 mb-8 tracking-tight">Canais de Alerta</h3>
    <div className="space-y-4">
      {[
        { title: 'Alertas de Frete (Novo CT-e)', desc: 'E-mail + WhatsApp para equipe base' },
        { title: 'Vencimento Financeiro', desc: 'Resumo diário por E-mail' },
        { title: 'Manutenção de Frota', desc: 'Alerta instantâneo no WhatsApp' },
      ].map((item, i) => (
        <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-[28px]">
          <div>
            <p className="text-sm font-bold text-gray-900">{item.title}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-normal mt-1">{item.desc}</p>
          </div>
          <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
            <div className="w-4 h-4 bg-gray-900 rounded-full absolute right-1 top-1" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SegurancaView = () => (
  <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm max-w-3xl animate-in fade-in duration-500">
    <h3 className="text-xl font-bold text-gray-900 mb-8 tracking-tight">Políticas de Segurança</h3>
    <div className="space-y-6">
      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[28px]">
        <div>
          <p className="text-sm font-bold text-gray-900">Autenticação em Dois Fatores (2FA)</p>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-normal mt-1">Obrigatório para todos os usuários</p>
        </div>
        <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer">
          <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Tempo de Sessão (Inatividade)</label>
        <select className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20">
          <option>4 horas</option>
          <option>8 horas</option>
          <option>12 horas</option>
          <option>Manter conectado</option>
        </select>
      </div>
    </div>
  </div>
);

const SistemaView = () => (
  <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm max-w-3xl animate-in fade-in duration-500">
    <h3 className="text-xl font-bold text-gray-900 mb-8 tracking-tight">Configuração Global</h3>
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Fuso Horário Padrão</label>
        <select className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20">
          <option>America/Sao_Paulo (UTC-3)</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Moeda Base</label>
        <input type="text" disabled defaultValue="BRL (R$)" className="w-full px-5 py-4 bg-gray-100 border-none rounded-[20px] text-sm font-bold text-gray-500 cursor-not-allowed" />
      </div>
    </div>
  </div>
);

// --- Main Page Component ---

const Configuracoes = () => {
  const location = useLocation();
  const path = location.pathname;
  const [isAddPaymentOpen, setIsAddPaymentOpen] = React.useState(false);
  const [addSuccess, setAddSuccess] = React.useState(false);

  const tabs = [
    { id: 'empresa', label: 'Empresa', Icon: Building2, path: '/admin-settings/empresa' },
    { id: 'whitelabel', label: 'White Label', Icon: Palette, path: '/admin-settings/whitelabel' },
    { id: 'dominio', label: 'Domínio & Acesso', Icon: Globe, path: '/admin-settings/dominio' },
    { id: 'financeiro', label: 'Financeiro', Icon: DollarSign, path: '/admin-settings/financeiro' },
    { id: 'fiscal', label: 'Fiscal & Operação', Icon: FileText, path: '/admin-settings/fiscal' },
    { id: 'notificacoes', label: 'Notificações', Icon: Bell, path: '/admin-settings/notificacoes' },
    { id: 'seguranca', label: 'Segurança', Icon: Shield, path: '/admin-settings/seguranca' },
    { id: 'sistema', label: 'Sistema', Icon: Settings, path: '/admin-settings/sistema' },
  ];

  return (
    <div className="px-16 py-10 w-full text-left animate-in fade-in duration-700 h-full flex flex-col">
      <div className="flex justify-between items-end mb-8 flex-shrink-0 h-[87px]">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight h-[46px] mt-[74px]">Admin Settings</h1>
        </div>
      </div>
      
      <div className="flex gap-2 p-1.5 bg-gray-100 rounded-[28px] w-fit mb-10 overflow-x-auto scrollbar-hide flex-shrink-0">
        {tabs.map(tab => {
          const TabIcon = tab.Icon;
          const isActive = path.includes(tab.path);
          return (
            <Link 
              key={tab.id}
              to={tab.path}
              className={`px-6 py-4 rounded-[22px] font-black flex items-center gap-2 transition-all uppercase text-[10px] tracking-normal whitespace-nowrap ${
                isActive ? 'bg-white text-gray-900 shadow-xl shadow-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              <TabIcon size={16} className={isActive ? 'text-primary' : 'text-gray-400'} /> {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        <Routes>
          <Route index element={<Navigate to="empresa" replace />} />
          <Route path="empresa" element={<EmpresaView />} />
          <Route path="whitelabel" element={<WhiteLabelView />} />
          <Route path="dominio" element={<DominioView />} />
          <Route path="financeiro" element={<FinanceiroView onAddClick={() => setIsAddPaymentOpen(true)} />} />
          <Route path="fiscal" element={<FiscalView />} />
          <Route path="notificacoes" element={<NotificacoesView />} />
          <Route path="seguranca" element={<SegurancaView />} />
          <Route path="sistema" element={<SistemaView />} />
        </Routes>
      </div>

      {/* Adicionar Forma de Pagamento Modal */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAddPaymentOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#18191B] rounded-[32px] shadow-2xl border border-neutral-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden text-white">
            <div className="px-8 py-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/40">
              <h3 className="text-xl font-bold text-white">Nova Forma de Pagamento</h3>
              <button onClick={() => setIsAddPaymentOpen(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            {addSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-green-950/40 text-green-400 rounded-full flex items-center justify-center border border-neutral-850 shadow-inner">
                  <CheckCircle2 size={36} className="animate-bounce" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Método Adicionado!</h4>
                  <p className="text-xs text-neutral-400 mt-1">O novo meio de pagamento foi integrado ao seu painel financeiro.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                setAddSuccess(true);
                setTimeout(() => {
                  setAddSuccess(false);
                  setIsAddPaymentOpen(false);
                }, 2000);
              }} className="p-8 space-y-5 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Nome do Método</label>
                  <input required placeholder="Ex: Cartão de Crédito ou Boleto Banco XYZ" className="w-full bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white placeholder-neutral-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Categoria</label>
                    <select className="w-full bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white">
                      <option className="bg-neutral-900" value="gateway">Gateway (Asaas/Stripe)</option>
                      <option className="bg-neutral-900" value="pix">PIX Manual</option>
                      <option className="bg-neutral-900" value="bank">Conta Bancária Direta</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Prazo de Recebimento</label>
                    <select className="w-full bg-[#18191B] border border-neutral-800 p-3.5 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white">
                      <option className="bg-neutral-900" value="immediate">Imediato (D+0)</option>
                      <option className="bg-neutral-900" value="next_day">Próximo Dia (D+1)</option>
                      <option className="bg-neutral-900" value="thirty_days">30 Dias (D+30)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Chave de API ou Dados de Integração</label>
                  <input required type="password" placeholder="••••••••••••••••••••••••" className="w-full bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white placeholder-neutral-500" />
                </div>
                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 cursor-pointer mt-2">
                  Ativar Forma de Pagamento
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracoes;
