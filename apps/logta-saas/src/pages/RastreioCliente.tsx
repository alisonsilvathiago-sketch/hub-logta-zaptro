import React, { useState, useEffect } from 'react';
import { 
  Phone, MessageSquare, Clock, MapPin, ShieldAlert, Navigation, 
  Check, Play, Smartphone, AlertTriangle, ArrowRight, Save, Lock
} from 'lucide-react';

const RastreioCliente = () => {
  const [step, setStep] = useState<'whatsapp' | 'driver_permission' | 'client_tracking'>('whatsapp');
  const [gpsShared, setGpsShared] = useState(false);
  const [batteryPercent, setBatteryPercent] = useState(73);
  const [activeTab, setActiveTab] = useState<'hoje' | 'ontem'>('hoje');

  // Simulate telemetry events for Nádia
  const [telemetry] = useState([
    { label: 'Excesso de velocidade', icon: ShieldAlert, status: 'Sem ocorrências', color: 'text-red-500' },
    { label: 'Distração', icon: Smartphone, status: 'Não detectado', color: 'text-blue-500' },
    { label: 'Freada brusca', icon: AlertTriangle, status: 'Nenhum evento', color: 'text-orange-500' },
    { label: 'Acel. rápida', icon: Navigation, status: 'Normal', color: 'text-purple-500' }
  ]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-0 sm:p-4 font-sans select-none">
      {/* Mobile Device Frame wrapper for premium presentation */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[850px] sm:max-h-[900px] sm:rounded-[48px] sm:border-[12px] sm:border-gray-900 shadow-2xl relative overflow-hidden flex flex-col scrollbar-hide">
        
        {/* Step 1: WhatsApp Notification Flow */}
        {step === 'whatsapp' && (
          <div className="flex-1 bg-[#0b141a] p-6 text-white flex flex-col justify-between animate-in fade-in duration-300">
            <div className="space-y-6 mt-12">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#25d366] rounded-full flex items-center justify-center text-white">
                  <MessageSquare size={24} fill="currentColor" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">WhatsApp Business</h4>
                  <p className="text-xs text-gray-400">Logta Coletor Integrado</p>
                </div>
              </div>

              <div className="bg-[#202c33] p-5 rounded-2xl border border-gray-800 space-y-4">
                <p className="text-xs text-gray-300 font-bold uppercase tracking-wider text-left">Novo Chamado de Frete</p>
                <div className="space-y-2 text-left">
                  <p className="text-sm font-semibold">Olá, você recebeu uma nova rota! 🚚</p>
                  <p className="text-xs text-gray-400">Para iniciar o percurso e liberar a visualização do cliente, ative o sistema de rastreamento clicando no link abaixo.</p>
                </div>
                
                <button 
                  onClick={() => setStep('driver_permission')}
                  className="w-full mt-2 py-3 bg-[#00a884] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#008f72] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00a884]/20"
                >
                  <Navigation size={14} fill="currentColor" /> Abrir Link do Rastreio
                </button>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 text-center font-bold">LOGTA TRACKING • CONECTADO COM SEU ERP</p>
          </div>
        )}

        {/* Step 2: Driver GPS Authorization */}
        {step === 'driver_permission' && (
          <div className="flex-1 bg-gray-50 p-6 flex flex-col justify-between animate-in slide-in-from-bottom duration-300">
            <div className="space-y-6 mt-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                <Navigation size={32} className="animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-gray-900">Autorizar Localização</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">Para acompanhar sua jornada e habilitar a rota inteligente, ative a geolocalização do seu celular.</p>
              </div>

              <div className="bg-white p-5 border border-gray-100 rounded-[24px] shadow-sm space-y-4 text-left">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-green-50 text-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-gray-900">Atualização em tempo real</h5>
                    <p className="text-[11px] text-gray-400 mt-0.5">Informa a posição exata ao cliente sem ocupar espaço no celular.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-green-50 text-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-gray-900">Rota Protegida</h5>
                    <p className="text-[11px] text-gray-400 mt-0.5">Bloqueia o painel caso o motorista decida desativar o GPS.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  setGpsShared(true);
                  setStep('client_tracking');
                }}
                className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-primary/20"
              >
                Ativar e Compartilhar Localização
              </button>
              <button 
                onClick={() => setStep('whatsapp')}
                className="w-full py-3 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
              >
                Voltar ao WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* Step 3: High-Fidelity Client Tracking Screen (The "Nádia" View) */}
        {step === 'client_tracking' && (
          <div className="flex-1 bg-white flex flex-col animate-in fade-in duration-300 overflow-y-auto scrollbar-hide pb-20 relative text-left">
            
            {/* Top Interactive Banner to return/reset state for testing */}
            <div className="absolute top-4 left-4 z-50">
              <button 
                onClick={() => setStep('whatsapp')}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-lg hover:scale-105 transition-transform cursor-pointer border border-gray-100"
              >
                <ArrowRight size={18} className="rotate-180" />
              </button>
            </div>

            {/* Satellite/Map Graphic View */}
            <div className="h-64 bg-gray-300 relative w-full overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80" 
                alt="Map Background" 
                className="w-full h-full object-cover saturate-[0.8] contrast-[1.1]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              
              {/* Floating Live Indicator Badge */}
              <div className="absolute top-4 right-4 bg-red-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md animate-pulse">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                AO VIVO
              </div>

              {/* Glowing Driver Avatar on the Map */}
              <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-20">
                <div className="relative">
                  <div className="w-20 h-20 bg-white rounded-full p-1.5 shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                      alt="Nádia" 
                      className="rounded-full w-full h-full object-cover border border-gray-100"
                    />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow border-2 border-white">
                    AGORA
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Card Area */}
            <div className="px-6 pt-12 space-y-6">
              
              {/* Header Details with Battery */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Nádia</h2>
                  <div className="space-y-1 mt-1">
                    <p className="text-sm font-bold text-gray-900">Perto de Rua Vereador José Vieira, 109</p>
                    <p className="text-xs text-gray-400 font-bold">Barueri, SP • Desde às 13:06</p>
                  </div>
                </div>
                
                {/* Battery Pill */}
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full text-gray-700 font-black text-xs">
                  <span className="w-2 h-4 border-2 border-gray-700 rounded-sm relative flex items-center justify-start p-0.5">
                    <span className="h-full bg-green-500 rounded-sm" style={{ width: '55%' }} />
                  </span>
                  55%
                </div>
              </div>

              {/* Absence Alert Section */}
              <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100/60 flex gap-4 items-start">
                <div className="p-2.5 bg-white rounded-2xl text-gray-700 shadow-sm flex items-center justify-center mt-0.5">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-gray-900">Definir um Alerta de Ausência</h4>
                  <p className="text-xs text-gray-400 mt-1 font-medium leading-relaxed">Receba uma notificação se Nádia não estiver em um local até um horário definido.</p>
                </div>
              </div>

              {/* Weekly Performance Widgets */}
              <div className="bg-white border border-gray-200/80 rounded-[32px] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shadow-inner">
                    <Navigation size={22} className="text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">Confira os percursos desta semana</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Desde às seg., 4 de mai.</p>
                  </div>
                </div>

                {/* Telemetry events list */}
                <div className="space-y-3 pt-2">
                  {telemetry.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-white rounded-xl shadow-sm ${t.color}`}>
                          <t.icon size={16} />
                        </div>
                        <span className="text-xs font-extrabold text-gray-900">{t.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-bold">{t.status}</span>
                        <Lock size={12} className="text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map Routes Section */}
              <div className="bg-gray-50 rounded-[32px] border border-gray-100 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-900 uppercase">Percurso de Ontem</span>
                  <span className="text-[10px] bg-white border border-gray-100 text-gray-500 font-bold px-2 py-1 rounded-lg shadow-sm">3.7 km</span>
                </div>
                <div className="h-32 bg-gray-200 rounded-2xl overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=400&q=80" 
                    alt="Static Map route" 
                    className="w-full h-full object-cover saturate-50 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-xl text-[9px] font-black text-gray-900 shadow">
                    RUA DA PRATA ➔ AV. SARGENTO SIQUEIRA
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Floating Navigation Actions exactly like the screen */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 flex gap-3 max-w-md mx-auto z-40">
              <button className="flex-1 py-3.5 bg-gray-900 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-gray-900/15 cursor-pointer">
                <Phone size={14} fill="currentColor" /> Ligar
              </button>
              <button className="flex-1 py-3.5 bg-gray-100 text-gray-900 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all cursor-pointer">
                <MessageSquare size={14} /> Texto
              </button>
              <button className="flex-1 py-3.5 bg-gray-50 text-gray-500 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1 hover:text-gray-900 transition-all cursor-pointer border border-gray-100">
                <Clock size={14} /> Alertas
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default RastreioCliente;
