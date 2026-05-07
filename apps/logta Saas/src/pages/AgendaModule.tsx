import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Video, 
  Users, 
  Search,
  Settings,
  HelpCircle,
  Check,
  MoreVertical,
  Mail,
  FileText,
  Bell,
  Link as LinkIcon,
  CheckCircle2
} from 'lucide-react';

const Agenda = () => {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [view, setView] = useState<'Mês' | 'Semana' | 'Dia'>('Mês');

  // Dias da semana
  const weekDays = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÁB.'];
  
  // Grid de dias simulado (Mês atual)
  const days = Array.from({ length: 35 }, (_, i) => i + 1);

  const miniCalendarDays = Array.from({ length: 42 }, (_, i) => i - 4); // Simulating offset for mini calendar

  return (
    <div className="flex flex-1 bg-[#1e1e1e] text-gray-300 font-sans overflow-hidden rounded-[40px] shadow-2xl border border-gray-800">
      
      {/* Left Sidebar (Google Calendar Style) */}
      <div className="w-[280px] flex-shrink-0 border-r border-gray-800 flex flex-col">
        {/* Create Button */}
        <div className="p-4 pt-6">
          <button 
            onClick={() => setIsEventModalOpen(true)}
            className="flex items-center gap-3 px-5 py-3.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white rounded-full font-medium transition-all shadow-lg border border-gray-700"
          >
            <Plus size={22} className="text-white" />
            <span className="text-sm">Criar</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6">
          {/* Mini Calendar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-200">Maio de 2026</h3>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-gray-800 rounded-full"><ChevronLeft size={16} /></button>
                <button className="p-1 hover:bg-gray-800 rounded-full"><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-1 mb-1">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                <div key={d} className="text-[10px] text-center text-gray-500 font-medium">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {miniCalendarDays.map((day, i) => {
                const isCurrentMonth = day > 0 && day <= 31;
                const isToday = day === 5; // Highlight 5th
                return (
                  <div key={i} className="flex justify-center items-center">
                    <button className={`w-6 h-6 text-xs flex items-center justify-center rounded-full transition-all
                      ${!isCurrentMonth ? 'text-gray-600' : 'text-gray-300 hover:bg-gray-800'}
                      ${isToday ? 'bg-blue-300 text-blue-900 font-bold hover:bg-blue-400' : ''}
                    `}>
                      {isCurrentMonth ? day : (day <= 0 ? 30 + day : day - 31)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            {/* Search People */}
            <button className="w-full flex items-center gap-3 px-3 py-2 bg-[#2a2a2a] rounded-lg text-sm text-gray-400 hover:bg-[#333]">
              <Users size={16} /> Pesquisar pessoas
            </button>

            {/* Calendars List */}
            <div>
              <div className="flex items-center justify-between group cursor-pointer mb-2">
                <h3 className="text-sm font-medium text-gray-200">Minhas agendas</h3>
                <ChevronRight size={16} className="text-gray-500 rotate-90" />
              </div>
              <div className="space-y-2">
                {[
                  { name: 'Alison Thiago', color: 'bg-blue-400' },
                  { name: 'CRM & Vendas', color: 'bg-green-500' },
                  { name: 'Operacional / Fretes', color: 'bg-purple-500' },
                  { name: 'Lembretes Financeiros', color: 'bg-yellow-500' },
                ].map(cal => (
                  <label key={cal.name} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-[4px] border-2 border-transparent flex items-center justify-center ${cal.color}`}>
                      <Check size={12} className="text-gray-900" />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{cal.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between group cursor-pointer mb-2">
                <h3 className="text-sm font-medium text-gray-200">Outras agendas</h3>
                <Plus size={16} className="text-gray-500 hover:text-white" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-4 h-4 rounded-[4px] border-2 border-transparent flex items-center justify-center bg-green-700">
                    <Check size={12} className="text-gray-900" />
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Feriados no Brasil</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e]">
        {/* Top Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
          <div className="flex items-center gap-6">
            <button className="px-4 py-2 bg-transparent border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors">
              Hoje
            </button>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-800 rounded-full transition-colors"><ChevronLeft size={20} /></button>
              <button className="p-2 hover:bg-gray-800 rounded-full transition-colors"><ChevronRight size={20} /></button>
            </div>
            <h2 className="text-xl font-normal text-white">Maio de 2026</h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-800 rounded-full text-gray-300 transition-colors"><Search size={20} /></button>
            <button className="p-2 hover:bg-gray-800 rounded-full text-gray-300 transition-colors"><HelpCircle size={20} /></button>
            <button className="p-2 hover:bg-gray-800 rounded-full text-gray-300 transition-colors"><Settings size={20} /></button>
            
            <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-700 rounded-md hover:bg-gray-800 cursor-pointer transition-colors ml-4">
              <span className="text-sm font-medium text-gray-200">{view}</span>
              <ChevronRight size={14} className="text-gray-400 rotate-90" />
            </div>
            
            <div className="w-8 h-8 rounded-full bg-blue-500 border border-gray-700 flex items-center justify-center text-white text-sm font-bold ml-2">
              AT
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-800">
            {weekDays.map((day, i) => {
              const isToday = i === 2; // Mocking Tuesday as today
              return (
                <div key={day} className="py-3 flex flex-col items-center border-r border-gray-800 last:border-0">
                  <span className={`text-[11px] font-medium mb-1 ${isToday ? 'text-blue-400' : 'text-gray-500'}`}>{day}</span>
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full text-xl ${isToday ? 'bg-blue-500 text-white' : 'text-gray-300'}`}>
                    {26 + i > 31 ? i - 5 : 26 + i}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid Cells */}
          <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-[#1e1e1e]">
            {days.map((day, i) => {
              const isCurrentMonth = day > 0 && day <= 31;
              const displayDay = isCurrentMonth ? day : (day <= 0 ? 30 + day : day - 31);
              const isFirstOfMonth = displayDay === 1;
              
              // Mock Events
              const hasMeeting = day === 5;
              const hasHoliday = day === 1;
              const hasCRMEvent = day === 12;

              return (
                <div key={i} onClick={() => setIsEventModalOpen(true)} className="border-r border-b border-gray-800 p-1 flex flex-col hover:bg-[#2a2a2a] transition-colors cursor-pointer group">
                  <div className="flex justify-center mt-1 mb-1">
                    <span className={`text-sm font-bold ${!isCurrentMonth ? 'text-gray-600' : 'text-gray-300'}`}>
                      {isFirstOfMonth ? `1 ${day > 31 ? 'jun.' : 'mai.'}` : displayDay}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1.5 overflow-hidden">
                    {hasHoliday && (
                      <div className="px-3 py-2 bg-[#2c4c3b] text-[#81c995] rounded-[10px] text-base font-extrabold truncate">
                        Dia do Trabalho
                      </div>
                    )}
                    {hasMeeting && (
                      <div className="space-y-1.5">
                        <div className="px-3 py-2 bg-blue-500 text-white rounded-[10px] text-base font-extrabold truncate shadow-md flex flex-col gap-0.5">
                          <span className="text-[11px] font-black tracking-wider text-blue-100">10:00</span>
                          <span>Reunião Diretoria</span>
                        </div>
                        <div className="px-3 py-2 bg-[#2d2d2d] border border-blue-500/30 text-white rounded-[10px] text-base font-extrabold truncate flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                            <span className="text-[11px] text-blue-400 font-black tracking-wider">14:30</span>
                          </div>
                          <span>Call Cliente VIP</span>
                        </div>
                      </div>
                    )}
                    {hasCRMEvent && (
                      <div className="px-3 py-2 bg-[#1d3528] border border-green-500/30 text-white rounded-[10px] text-base font-extrabold truncate flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                          <span className="text-[11px] text-green-400 font-black tracking-wider">O Dia Todo</span>
                        </div>
                        <span>Fechamento de Contrato</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* EVENT CREATION MODAL (Logta SaaS Integration) */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsEventModalOpen(false)} />
          
          <div className="relative w-full max-w-3xl bg-[#18191B] rounded-3xl shadow-2xl border border-neutral-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden text-white">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/40">
              <span className="text-xs font-black text-primary uppercase tracking-normal flex items-center gap-2">
                <CalendarIcon size={14} /> Agendamento Integrado
              </span>
              <button onClick={() => setIsEventModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto max-h-[80vh]">
              <input 
                type="text" 
                placeholder="Adicionar título" 
                className="text-3xl font-normal text-white bg-transparent border-b-2 border-neutral-800 focus:border-primary outline-none placeholder:text-neutral-600 w-full pb-2 mb-8 transition-colors"
                autoFocus
              />

              <div className="space-y-6">
                {/* Date & Time */}
                <div className="flex items-center gap-4 text-neutral-300">
                  <CalendarIcon size={20} className="text-neutral-500" />
                  <div className="flex gap-4">
                    <input type="date" className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:border-primary outline-none text-white font-semibold" />
                    <input type="time" className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:border-primary outline-none text-white font-semibold" />
                    <span className="self-center text-sm text-neutral-400">até</span>
                    <input type="time" className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:border-primary outline-none text-white font-semibold" />
                  </div>
                </div>

                {/* Google Meet Integration */}
                <div className="flex items-center gap-4">
                  <Video size={20} className="text-neutral-500" />
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors cursor-pointer">
                    Adicionar videoconferência do Google Meet
                  </button>
                </div>

                {/* CRM Client Link */}
                <div className="flex items-center gap-4">
                  <Users size={20} className="text-neutral-500" />
                  <div className="flex-1">
                    <select className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:border-primary outline-none appearance-none text-white font-semibold">
                      <option className="bg-neutral-900" value="">Vincular a um cliente (CRM)...</option>
                      <option className="bg-neutral-900" value="1">Transportes Silva LTDA</option>
                      <option className="bg-neutral-900" value="2">Logística Brasil SA</option>
                    </select>
                  </div>
                </div>

                {/* Description & Attachments */}
                <div className="flex items-start gap-4">
                  <FileText size={20} className="text-neutral-500 mt-2" />
                  <textarea 
                    rows={3}
                    placeholder="Adicionar descrição ou anexos"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:border-primary outline-none resize-none text-white placeholder-neutral-500 font-semibold"
                  />
                </div>

                {/* Automations (WhatsApp / Email) */}
                <div className="flex items-start gap-4 pt-4 border-t border-neutral-800">
                  <Bell size={20} className="text-neutral-500" />
                  <div className="space-y-3 flex-1">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-primary focus:ring-primary rounded border-neutral-800 bg-neutral-900" />
                      <span className="text-sm text-neutral-300 font-medium">Enviar lembrete por WhatsApp 2h antes</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-primary focus:ring-primary rounded border-neutral-800 bg-neutral-900" />
                      <span className="text-sm text-neutral-300 font-medium">Criar evento na agenda do cliente (E-mail)</span>
                    </label>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-neutral-900/40 border-t border-neutral-800 flex justify-end gap-3">
              <button 
                onClick={() => setIsEventModalOpen(false)}
                className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-md text-sm font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button className="px-6 py-2 bg-primary text-white rounded-md text-sm font-bold hover:opacity-90 transition-colors shadow-sm cursor-pointer">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
