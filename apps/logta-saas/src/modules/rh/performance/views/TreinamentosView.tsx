import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Plus, GraduationCap, Users, Clock, Banknote, ChevronRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import type { RhModuleDef } from '../../types';

type TreinamentosViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

const mockTreinamentos = [
  { id: 'usr-1', colaborador: 'Carlos Henrique', instrutor: 'João Silva (Segurança)', local: 'Matriz - Sala 2', treinamento: 'Direção Defensiva Anual', data: '18/05/2026', status: 'Concluído' },
  { id: 'usr-3', colaborador: 'Roberto Silva', instrutor: 'SENAT Online', local: 'Plataforma EAD', treinamento: 'Cargas Perigosas (MOPP)', data: '22/05/2026', status: 'Pendente' },
  { id: 'usr-4', colaborador: 'Mariana Costa', instrutor: 'Ana Paula (Operações)', local: 'Filial Sul', treinamento: 'Novo Sistema WMS', data: '10/05/2026', status: 'Concluído' },
];

export function TreinamentosView({
  module,
  hubPath,
  hubLabel,
}: TreinamentosViewProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const kpis = [
    { title: 'Treinamentos Ativos', value: '12', trend: 'up' as const, trendValue: '+2', icon: GraduationCap },
    { title: 'Colab. Treinados', value: '84', trend: 'up' as const, trendValue: '+15%', icon: Users },
    { title: 'Horas (Mês)', value: '320h', trend: 'neutral' as const, icon: Clock },
    { title: 'Investimento', value: 'R$ 14.5K', trend: 'up' as const, trendValue: '+5%', icon: Banknote },
  ];

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Agendar Treinamento"
      aria-label="Agendar Treinamento"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={20} strokeWidth={2.5} />
    </button>
  );

  return (
    <div className="space-y-8 text-left">
      <Link
        to={hubPath}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para {hubLabel}
      </Link>

      <LogtaStandardPageLayout
        title={module.title}
        kpis={kpis}
        mainContentTitle="Agenda e Histórico de Treinamentos"
        mainContentAction={mainContentAction}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-3">
          {mockTreinamentos.map((t, i) => (
            <div 
              key={i} 
              onClick={() => navigate(`/rh/equipe/${t.id}`)}
              className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-primary/20 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 font-black text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{t.treinamento}</h4>
                  <p className="text-[11px] font-bold text-gray-500">Para: <span className="text-gray-900">{t.colaborador}</span></p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:gap-10 sm:justify-end">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-gray-400">Instrutor / Local</p>
                  <p className="text-sm font-bold text-gray-700">{t.instrutor}</p>
                  <p className="text-[10px] font-bold text-gray-400">{t.local}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400">Data Prevista</p>
                  <p className="text-sm font-black text-primary">{t.data}</p>
                </div>
                <div className="w-24 text-right">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
                    t.status === 'Concluído' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {t.status === 'Concluído' ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
                    {t.status}
                  </span>
                </div>
                <ChevronRight size={18} className="text-gray-300 hidden md:block group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Treinamentos"
        getTabularData={() => ({
          title: 'Treinamentos',
          filenameBase: 'rh-treinamentos',
          columns: ['Colaborador', 'Treinamento', 'Instrutor', 'Local', 'Data', 'Status'],
          rows: mockTreinamentos.map(t => [t.colaborador, t.treinamento, t.instrutor, t.local, t.data, t.status]),
        })}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-200 items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Fechar"
            onClick={() => setIsModalOpen(false)}
          />
          <div
            className="relative max-h-[min(92dvh,640px)] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-neutral-800 bg-[#18191B] p-6 text-left shadow-2xl duration-200 animate-in zoom-in-95 sm:rounded-[40px] sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <LogtaModalHeader
              icon={GraduationCap}
              title="Agendar Treinamento"
              onClose={() => setIsModalOpen(false)}
            />
            
            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 flex flex-col gap-4">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Nome do Treinamento</label>
                   <input type="text" className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-medium text-white placeholder-neutral-600 focus:border-primary/50 outline-none" placeholder="Ex: NR-35 Trabalho em Altura" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Instrutor</label>
                    <input type="text" className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-medium text-white placeholder-neutral-600 focus:border-primary/50 outline-none" placeholder="Nome ou Empresa" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Local</label>
                    <input type="text" className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-medium text-white placeholder-neutral-600 focus:border-primary/50 outline-none" placeholder="Online / Matriz" />
                  </div>
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Colaborador (Opcional)</label>
                   <select className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-medium text-white outline-none focus:border-primary/50">
                     <option>Selecionar colaborador...</option>
                     <option>Carlos Henrique</option>
                     <option>Ana Paula</option>
                     <option>Roberto Silva</option>
                     <option>Mariana Costa</option>
                   </select>
                   <p className="text-[10px] text-neutral-500 mt-1">Se não selecionado, será um treinamento de turma aberta.</p>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-2xl border border-neutral-700 py-3.5 text-sm font-bold text-neutral-300 transition-colors hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('success', 'Treinamento agendado.', 'Sucesso');
                    setIsModalOpen(false);
                  }}
                  className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Agendar Treinamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
