import React, { useState } from 'react';
import {
  Image as ImageIcon,
  PenTool,
  Mic,
  ArrowUp,
  Plus,
  Globe,
  LayoutDashboard,
  Truck,
  Users,
  DollarSign,
} from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';

const Inicio = () => {
  const { config } = useTenant();
  const [inputValue, setInputValue] = useState('');

  const displayName =
    config.companyName === 'LOGTA' ? 'Logta' : config.companyName;

  const suggestions = [
    { icon: ImageIcon, label: 'Crie uma imagem', color: 'text-purple-500' },
    { icon: PenTool, label: 'Escreva ou edite', color: 'text-blue-500' },
    { icon: Globe, label: 'Consulte algo', color: 'text-green-500' },
  ];

  

  const handleSend = () => {
    const q = inputValue.trim();
    if (!q) return;
    (window as Window & { showToast?: (type: string, message: string, title?: string) => void }).showToast?.(
      'info',
      'Em breve o assistente responderá com dados da sua operação.',
      'Logta IA',
    );
    setInputValue('');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 px-6 animate-in fade-in duration-1000 w-full min-h-full bg-[linear-gradient(180deg,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_24%,rgba(10,31,74,1)_40%,rgba(29,78,216,1)_62%,rgba(59,130,246,1)_70%,rgba(147,197,253,1)_82%,rgba(249,250,251,1)_95%)]">
      <div className="w-full max-w-3xl space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-gray-500">
            <span className="px-[22px] py-[6px] bg-[var(--color-blue-600)] text-white rounded-full text-[10px] font-black tracking-wider uppercase shadow-sm">
              LOGTA IA
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500 font-bold">Assistente inteligente</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-[0px] leading-[1.05]">
            Central da{' '}
            <span className="text-white">{displayName}</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium max-w-xl mx-auto pt-2 w-[429px] h-[47px]">
            Pergunte sobre operação, frota ou financeiro — ou abra um módulo abaixo para ir direto ao trabalho.
          </p>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-[24px] blur opacity-5 group-focus-within:opacity-10 transition duration-1000 group-hover:duration-200" />
          <div className="relative bg-white border border-gray-100 rounded-[20px] py-3.5 px-5 shadow-md shadow-gray-50 transition-all focus-within:border-primary/20">
            <textarea
              placeholder="O que você deseja saber?"
              className="w-full bg-transparent border-none outline-none text-base text-gray-800 placeholder:text-gray-400 resize-none min-h-[64px] pr-12 scrollbar-hide"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-colors"
                  aria-label="Anexar"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-colors"
                  aria-label="Entrada por voz"
                >
                  <Mic size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  className={`p-2 rounded-xl transition-all shadow-md ${inputValue.trim() ? 'bg-primary text-white shadow-primary/20 scale-105' : 'bg-gray-100 text-gray-300 shadow-none'}`}
                  aria-label="Enviar"
                >
                  <ArrowUp size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {suggestions.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-100 rounded-full text-gray-500 font-semibold text-xs hover:bg-gray-50 hover:border-primary/20 hover:shadow-sm transition-all group"
            >
              <item.icon size={14} className={`${item.color} group-hover:scale-105 transition-transform`} />
              {item.label}
            </button>
          ))}
        </div>

        
      </div>
    </div>
  );
};

export default Inicio;
