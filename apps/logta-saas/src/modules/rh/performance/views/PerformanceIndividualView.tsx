import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Target, TrendingUp, ChevronRight, Award, MessageSquare } from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import { useTenant } from '../../../../contexts/TenantContext';
import { loadAvaliacoes, appendAvaliacao, type PerformanceAvaliacao } from '../performanceStorage';
import { resolvePerformanceColaboradorEquipeUrl } from '../../lib/performanceEquipeLink';
import { listColaboradorProfilesForCompany } from '../../ponto/colaboradorRhStorage';
import type { RhModuleDef } from '../../types';

type PerformanceIndividualViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

// Dados carregados do storage — sem mock hardcoded

export function PerformanceIndividualView({
  module,
  hubPath,
  hubLabel,
}: PerformanceIndividualViewProps) {
  const { config } = useTenant();
  const companyId = config.id || 'demo';
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<PerformanceAvaliacao[]>([]);
  const [formAvaliado, setFormAvaliado] = useState('');
  const [formNota, setFormNota] = useState('');
  const [formFeedback, setFormFeedback] = useState('');
  const navigate = useNavigate();

  const colaboradoresRh = listColaboradorProfilesForCompany(companyId);

  useEffect(() => {
    setAvaliacoes(loadAvaliacoes(companyId));
  }, [companyId]);

  const openColaboradorPerfil = (aval: PerformanceAvaliacao) => {
    const url = resolvePerformanceColaboradorEquipeUrl(companyId, aval);
    if (url === '/rh/equipe') {
      showToast('error', 'Colaborador não encontrado no dossiê RH.', 'Performance');
      return;
    }
    navigate(url);
  };

  const media = avaliacoes.length > 0
    ? (avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length).toFixed(1)
    : '0.0';
  const kpis = [
    { title: 'Média da Equipe', value: media, trend: 'up' as const, trendValue: '+0.3', icon: TrendingUp },
    { title: 'Avaliações (Mês)', value: String(avaliacoes.length), trend: 'up' as const, trendValue: '+5%', icon: Target },
    { title: 'Abaixo do Esperado', value: String(avaliacoes.filter(a => a.nota < 3.5).length), trend: 'down' as const, trendValue: '-1', icon: MessageSquare },
    { title: 'Superando', value: String(avaliacoes.filter(a => a.nota >= 4.5).length), trend: 'up' as const, trendValue: '+2', icon: Award },
  ];

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Nova Avaliação"
      aria-label="Nova Avaliação"
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
        mainContentTitle="Performance por Colaborador"
        mainContentAction={mainContentAction}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-3">
          {avaliacoes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
              <p className="text-sm font-bold text-gray-400">Nenhuma avaliação registrada.</p>
              <p className="text-xs text-gray-400 mt-1">Clique em + para adicionar a primeira avaliação.</p>
            </div>
          )}
          {avaliacoes.map((colab) => (
            <div 
              key={colab.id} 
              onClick={() => openColaboradorPerfil(colab)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openColaboradorPerfil(colab);
                }
              }}
              role="button"
              tabIndex={0}
              className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-primary/20 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 font-black text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {colab.colaboradorNome.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{colab.colaboradorNome}</h4>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{colab.cargo}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:gap-10 sm:justify-end">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-gray-400">Última Avaliação</p>
                  <p className="text-sm font-bold text-gray-700">{colab.data}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400">Nota (0-5)</p>
                  <p className="text-sm font-black text-primary">{colab.nota.toFixed(1)}</p>
                </div>
                <div className="w-28 text-right">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ${
                    colab.nota >= 4.5 ? 'bg-green-100 text-green-700' :
                    colab.nota >= 3.5 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {colab.perfil}
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
        title="Exportar Performance"
        getTabularData={() => ({
          title: 'Performance Individual',
          filenameBase: 'rh-performance',
          columns: ['Nome', 'Cargo', 'Nota', 'Última Avaliação', 'Perfil'],
          rows: avaliacoes.map(c => [c.colaboradorNome, c.cargo, c.nota.toFixed(1), c.data, c.perfil]),
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
              icon={Target}
              title="Nova Avaliação 1:1"
              onClose={() => setIsModalOpen(false)}
            />
            
            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 flex flex-col gap-4">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Avaliador (Gestor)</label>
                   <input type="text" className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm font-medium text-neutral-400 outline-none" value="João Silva (Você)" disabled />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Avaliado (Colaborador)</label>
                   <select
                     value={formAvaliado}
                     onChange={e => setFormAvaliado(e.target.value)}
                     className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-medium text-white outline-none focus:border-primary/50"
                   >
                     <option value="">Selecionar colaborador...</option>
                     {colaboradoresRh.map((p) => (
                       <option key={p.id} value={p.id}>
                         {p.fullName} — {p.role || p.sector || 'Colaborador'}
                       </option>
                     ))}
                   </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Nota Geral (0 a 5)</label>
                    <input
                      type="number" step="0.1" min="0" max="5"
                      value={formNota}
                      onChange={e => setFormNota(e.target.value)}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-medium text-white outline-none focus:border-primary/50"
                      placeholder="Ex: 4.5"
                    />
                </div>
                <div className="space-y-1 mt-2">
                   <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Feedback Qualitativo</label>
                   <textarea
                     value={formFeedback}
                     onChange={e => setFormFeedback(e.target.value)}
                     className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-medium text-white placeholder-neutral-600 focus:border-primary/50 outline-none resize-none"
                     rows={3}
                     placeholder="Pontos fortes, oportunidades de melhoria..."
                   />
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
                    if (!formAvaliado || !formNota) {
                      showToast('error', 'Preencha colaborador e nota.', 'Atenção');
                      return;
                    }
                    const rhProfile = colaboradoresRh.find((p) => p.id === formAvaliado);
                    if (!rhProfile) {
                      showToast('error', 'Selecione um colaborador do dossiê RH.', 'Atenção');
                      return;
                    }
                    const nota = parseFloat(formNota);
                    if (isNaN(nota) || nota < 0 || nota > 5) {
                      showToast('error', 'Nota deve ser entre 0 e 5.', 'Atenção');
                      return;
                    }
                    const perfil: PerformanceAvaliacao['perfil'] =
                      nota >= 4.8 ? 'Excepcional' :
                      nota >= 4.0 ? 'Alto Potencial' :
                      nota >= 3.5 ? 'Sólido' :
                      nota >= 2.5 ? 'Atenção' : 'Risco';
                    const nova: PerformanceAvaliacao = {
                      id: `aval-${Date.now()}`,
                      colaboradorId: rhProfile.id,
                      colaboradorNome: rhProfile.fullName,
                      cargo: rhProfile.role || rhProfile.sector || 'Colaborador',
                      avaliador: 'João Silva',
                      nota,
                      feedback: formFeedback,
                      perfil,
                      data: new Date().toLocaleDateString('pt-BR'),
                      createdAt: new Date().toISOString(),
                    };
                    appendAvaliacao(companyId, nova);
                    setAvaliacoes(loadAvaliacoes(companyId));
                    setFormAvaliado('');
                    setFormNota('');
                    setFormFeedback('');
                    showToast('success', 'Avaliação registrada e salva com sucesso.', 'Salvo');
                    setIsModalOpen(false);
                  }}
                  className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Salvar Avaliação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
