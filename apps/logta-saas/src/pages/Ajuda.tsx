import React, { useState } from 'react';
import { HelpCircle, ExternalLink, MessageSquare, Phone, BookOpen, DollarSign, ArrowLeft, Brain, X } from 'lucide-react';
import IAAssistant from '@shared/components/IAAssistant';

const Ajuda = () => {
  const [ticketModal, setTicketModal] = useState(false);
  const [pricingModal, setPricingModal] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [ticketStatus, setTicketStatus] = useState('');

  const openTicket = () => {
    setTicketModal(true);
    setTicketStatus('Processando dados do usuário e contexto da tela...');
    setTimeout(() => {
      setTicketStatus('Localizando operador de suporte nível 1 disponível...');
    }, 1200);
    setTimeout(() => {
      setTicketStatus('Sua sessão foi vinculada com sucesso ao Operador Thiago.');
    }, 2400);
    setTimeout(() => {
      setTicketModal(false);
      if ((window as any).showToast) {
        (window as any).showToast('success', 'Chamado #T-8891 aberto! Operador Thiago já está analisando seu caso.', 'Suporte Vinculado');
      }
    }, 3600);
  };

  if (showAI) {
    return (
      <div className="logta-page h-full w-full p-6 animate-in fade-in duration-500 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowAI(false)}
            className="flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
          >
            <ArrowLeft size={18} /> Voltar para Ajuda
          </button>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full">
            <Brain size={14} className="text-indigo-600" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">IA Operacional Logta</span>
          </div>
        </div>
        
        <div className="flex-1 min-h-0">
          <IAAssistant appContext="Logta" />
        </div>
      </div>
    );
  }

  return (
    <div className="logta-page flex h-full w-full flex-col items-center justify-center text-left animate-in fade-in duration-500">
      {/* Main Help Hub Card */}
      <div className="bg-white border border-gray-100 rounded-[40px] p-10 max-w-4xl w-full shadow-2xl relative overflow-hidden">
        
        {/* Header Block */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center font-bold text-xl">
            🚩
          </div>
          <div>
            <h1 className="logta-page-title">Canais de Ajuda</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-normal">Escolha como você quer ser atendido agora.</p>
          </div>
        </div>

        {/* Split Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">
          
          {/* LEFT PANEL: SYSTEM HELP */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <HelpCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 tracking-tight">Central de Ajuda Logta SaaS</h3>
                <p className="text-xs text-gray-400 font-bold mt-1 leading-relaxed">
                  Dúvidas sobre o sistema ERP, faturamento, rotas, financeiro, motoristas, CRM e muito mais.
                </p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Acessos Rápidos do Logta SaaS</p>
              
              <button 
                onClick={() => setShowAI(true)}
                className="w-full text-left text-xs font-black text-primary hover:underline flex items-center gap-2 py-1.5 transition-colors cursor-pointer"
              >
                🤖 Conversar com a IA Operacional (Logta AI) <ExternalLink size={12} className="opacity-70" />
              </button>

              <button 
                onClick={openTicket}
                className="w-full text-left text-xs font-black text-primary hover:underline flex items-center gap-2 py-1.5 transition-colors cursor-pointer"
              >
                📞 Falar com Suporte Humano (24h/7) <ExternalLink size={12} className="opacity-70" />
              </button>
            </div>
          </div>

          {/* Vertical Divider "ou" */}
          <div className="hidden md:flex absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex-col items-center justify-center">
            <div className="w-[1px] h-full bg-gray-100" />
            <span className="my-4 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase">ou</span>
            <div className="w-[1px] h-full bg-gray-100" />
          </div>

          {/* RIGHT PANEL: COMERCIAL & SALES */}
          <div className="space-y-6 md:pl-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                <BookOpen size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 tracking-tight">Canal de Vendas & Comercial</h3>
                <p className="text-xs text-gray-400 font-bold mt-1 leading-relaxed">
                  Dúvidas sobre planos, contratação de novos recursos, whitelabel e parcerias corporativas.
                </p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Acessos Rápidos do Comercial</p>
              
              <button 
                onClick={() => setPricingModal(true)}
                className="w-full text-left text-xs font-black text-primary hover:underline flex items-center gap-2 py-1.5 transition-colors cursor-pointer"
              >
                💰 Consultar Nossos Planos & Upgrades <ExternalLink size={12} className="opacity-70" />
              </button>

              <button 
                onClick={() => {
                  if ((window as any).showToast) {
                    (window as any).showToast('success', 'Solicitação comercial enviada! Um consultor entrará em contato em instantes.', 'Contato Comercial');
                  }
                }}
                className="w-full text-left text-xs font-black text-primary hover:underline flex items-center gap-2 py-1.5 transition-colors cursor-pointer"
              >
                🤝 Falar com Consultor de Negócios <ExternalLink size={12} className="opacity-70" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL: TICKET CREATION */}
      {ticketModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-[#18191B] border border-neutral-800 rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300 text-white">
            <div className="w-16 h-16 bg-blue-950/40 text-primary rounded-full flex items-center justify-center mx-auto mb-6 border border-neutral-850">
              <Phone size={32} className="animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Suporte Humano Ativo</h3>
            <div className="w-10 h-10 border-4 border-neutral-800 border-t-primary rounded-full animate-spin mx-auto my-6" />
            <p className="text-xs text-neutral-400 font-bold leading-relaxed transition-all min-h-[40px]">
              {ticketStatus}
            </p>
          </div>
        </div>
      )}

      {/* MODAL: PRICING PLANS */}
      {pricingModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-[#18191B] border border-neutral-800 rounded-[40px] p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300 relative text-left text-white">
            <button 
              onClick={() => setPricingModal(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center font-bold text-neutral-400 hover:text-white cursor-pointer transition-all border border-neutral-800"
            >
              ✕
            </button>
            
            <h3 className="logta-modal-title mb-2">Planos de Assinatura Logta</h3>
            <p className="text-xs text-neutral-400 font-bold mb-8 uppercase">Encontre o plano ideal para a sua transportadora.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-neutral-800 bg-neutral-900/40 rounded-[28px] p-6 space-y-4">
                <span className="px-3 py-1 bg-neutral-850 text-neutral-300 rounded-full text-[9px] font-black uppercase">Essencial</span>
                <h4 className="text-2xl font-black text-white mt-2">R$ 499<span className="text-xs font-bold text-neutral-500">/mês</span></h4>
                <p className="text-xs text-neutral-400 font-medium leading-relaxed">Até 5 veículos rastreados, emissão de CT-e de lote único e relatórios simplificados.</p>
              </div>

              <div className="border-2 border-primary bg-primary/5 rounded-[28px] p-6 space-y-4 relative">
                <span className="px-3 py-1 bg-primary text-white rounded-full text-[9px] font-black uppercase">Enterprise (Recomendado)</span>
                <h4 className="text-2xl font-black text-primary mt-2">R$ 1.299<span className="text-xs font-bold text-primary/70">/mês</span></h4>
                <p className="text-xs text-primary/90 font-bold leading-relaxed">Veículos ilimitados, IA operacional integrada (Logta AI), emissão SEFAZ multicliente e roteirização avançada.</p>
              </div>
            </div>

            <button 
              onClick={() => {
                setPricingModal(false);
                if ((window as any).showToast) {
                  (window as any).showToast('success', 'Solicitação comercial para o plano Enterprise enviada!', 'Plano Solicitado');
                }
              }}
              className="w-full mt-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-normal hover:opacity-90 transition-all text-center cursor-pointer"
            >
              Quero Contratar Enterprise
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ajuda;
