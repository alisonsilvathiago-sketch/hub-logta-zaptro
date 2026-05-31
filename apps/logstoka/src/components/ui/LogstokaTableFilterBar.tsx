import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';

export type LogstokaFilterPeriod = {
  tab: 'updated' | 'expiration';
  preset: string;
  startDate?: string;
  endDate?: string;
};

interface Props {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFilterPeriod?: (filter: LogstokaFilterPeriod | null) => void;
  initialSearch?: string;
  activeStatusTag?: string;
  onClearStatusTag?: () => void;
}

export const LogstokaTableFilterBar: React.FC<Props> = ({
  placeholder = 'Pesquisar por código, descrição ou GTIN',
  onSearch,
  onFilterPeriod,
  initialSearch = '',
  activeStatusTag = 'Últimos Incluídos',
  onClearStatusTag
}) => {
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'updated' | 'expiration'>('updated');
  const [selectedPreset, setSelectedPreset] = useState<string>('Hoje');
  const [activePeriod, setActivePeriod] = useState<LogstokaFilterPeriod | null>(null);
  
  // Calendário interativo para Maio de 2026 (data local do sistema)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(4); // Maio (0-indexed: 4)
  const [selectedDay, setSelectedDay] = useState<number>(30); // Dia 30 de Maio de 2026 destacado
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchValue(initialSearch);
  }, [initialSearch]);

  // Fecha o popover ao clicar fora
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const handleSearchClear = () => {
    setSearchValue('');
    onSearch('');
  };

  // Calendário helper: quantidade de dias no mês
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Dia da semana que inicia o mês
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const presets = [
    'Hoje',
    'Esta semana',
    'Semana passada',
    'Este mês',
    'Mês passado',
    'Selecionar mês',
    'Período customizado'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const applyPeriodFilter = () => {
    const dateStr = `${selectedDay.toString().padStart(2, '0')}/${(currentMonth + 1).toString().padStart(2, '0')}/${currentYear}`;
    const period: LogstokaFilterPeriod = {
      tab: activeTab,
      preset: selectedPreset,
      startDate: dateStr,
      endDate: dateStr
    };
    setActivePeriod(period);
    setCalendarOpen(false);
    if (onFilterPeriod) {
      onFilterPeriod(period);
    }
  };

  const clearPeriodFilter = () => {
    setActivePeriod(null);
    if (onFilterPeriod) {
      onFilterPeriod(null);
    }
  };

  const clearAllFilters = () => {
    setSearchValue('');
    onSearch('');
    clearPeriodFilter();
    if (onClearStatusTag) {
      onClearStatusTag();
    }
  };

  // Renderização da grade de dias do calendário
  const renderCalendarCells = () => {
    const cells = [];
    // Dias vazios antes do dia 1
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = day === selectedDay && currentYear === 2026 && currentMonth === 4;
      cells.push(
        <button
          key={`day-${day}`}
          type="button"
          onClick={() => setSelectedDay(day)}
          className={`h-8 w-8 text-xs font-bold rounded-full transition flex items-center justify-center ${
            isSelected
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-orange-50'
          }`}
        >
          {day}
        </button>
      );
    }
    return cells;
  };

  return (
    <div className="space-y-2 select-none" ref={containerRef}>
      {/* Barra de Pesquisa e Botões */}
      <div className="flex items-center gap-3 w-full">
        {/* Ícone de Filtros */}
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-orange-600 transition hover:bg-orange-50 active:scale-95"
          onClick={clearAllFilters}
          title="Redefinir todos os filtros"
        >
          <Filter size={18} />
        </button>

        {/* Input Central de Pesquisa */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-12 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          {searchValue ? (
            <button
              type="button"
              onClick={handleSearchClear}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          ) : null}
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-600 hover:text-orange-700"
          >
            <Search size={18} />
          </button>
        </form>

        {/* Botão de Calendário */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCalendarOpen(!calendarOpen)}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition active:scale-95 ${
              calendarOpen || activePeriod
                ? 'border-orange-500 bg-orange-50 text-orange-600'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            title="Filtrar por período"
          >
            <Calendar size={18} />
          </button>

          {/* Popover Customizado do Calendário (Estilo WMS Premium) */}
          {calendarOpen ? (
            <div className="absolute right-0 mt-3 z-50 flex w-[580px] rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl animate-fade-in-down">
              <div className="flex flex-col w-full">
                
                {/* Abas Superiores */}
                <div className="flex border-b border-slate-100 pb-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('updated')}
                    className={`pb-2 pr-4 text-sm font-extrabold transition relative ${
                      activeTab === 'updated'
                        ? 'text-orange-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Alterado em
                    {activeTab === 'updated' ? (
                      <span className="absolute bottom-0 left-0 right-4 h-0.5 bg-orange-600 rounded-full" />
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('expiration')}
                    className={`pb-2 px-4 text-sm font-extrabold transition relative ${
                      activeTab === 'expiration'
                        ? 'text-orange-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Data de validade
                    {activeTab === 'expiration' ? (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-orange-600 rounded-full" />
                    ) : null}
                  </button>
                </div>

                <div className="flex gap-6">
                  {/* Lado Esquerdo: Calendário */}
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 mb-2">Início do período</p>
                    
                    {/* Input do dia selecionado */}
                    <div className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 mb-3">
                      {selectedDay.toString().padStart(2, '0')}/{(currentMonth + 1).toString().padStart(2, '0')}/{currentYear}
                    </div>

                    {/* Controles de navegação do mês */}
                    <div className="flex items-center justify-between mb-2 px-1">
                      <button type="button" onClick={handlePrevMonth} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
                        {monthNames[currentMonth]} {currentYear}
                      </span>
                      <button type="button" onClick={handleNextMonth} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Dias da semana */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 mb-1">
                      <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span>
                    </div>

                    {/* Grade de dias */}
                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendarCells()}
                    </div>
                  </div>

                  {/* Lado Direito: Presets rápidos */}
                  <div className="w-[180px] shrink-0 flex flex-col gap-1 border-l border-slate-100 pl-6">
                    {presets.map((preset) => {
                      const isSelected = selectedPreset === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setSelectedPreset(preset);
                            if (preset === 'Hoje') {
                              setSelectedDay(30);
                              setCurrentMonth(4);
                              setCurrentYear(2026);
                            }
                          }}
                          className={`w-full rounded-xl py-2 px-3 text-left text-xs font-bold transition ${
                            isSelected
                              ? 'bg-orange-50 text-orange-600'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rodapé do Popover */}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setCalendarOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={applyPeriodFilter}
                    className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-700 transition"
                  >
                    Filtrar
                  </button>
                </div>

              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Tags de Filtros Ativos e Limpar */}
      {(activeStatusTag || activePeriod) ? (
        <div className="flex flex-wrap items-center gap-2 text-xs px-1 py-1">
          {activeStatusTag ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">
              Situação: {activeStatusTag}
              {onClearStatusTag ? (
                <button
                  type="button"
                  onClick={onClearStatusTag}
                  className="rounded-full p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              ) : null}
            </span>
          ) : null}

          {activePeriod ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 font-bold text-orange-700 border border-orange-100/50">
              {activePeriod.tab === 'updated' ? 'Alterado' : 'Validade'}: {activePeriod.preset} ({activePeriod.startDate})
              <button
                type="button"
                onClick={clearPeriodFilter}
                className="rounded-full p-0.5 hover:bg-orange-100 text-orange-400 hover:text-orange-600"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </span>
          ) : null}

          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs font-bold text-orange-600 hover:underline px-1 py-0.5 transition"
          >
            Limpar tudo
          </button>
        </div>
      ) : null}
    </div>
  );
};
export default LogstokaTableFilterBar;
