import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  FileText,
  Download,
  Calendar,
  BarChart,
  Clock,
  Zap,
  Filter,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import type { RhModuleDef } from '../../types';

type RelatoriosRhViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

const mockRelatorios = [
  {
    id: '1',
    titulo: 'Folha de Pagamento – Abril 2025',
    tipo: 'PDF',
    periodo: 'Abr/2025',
    geradoEm: '01/05/2025 08:15',
    tamanho: '2,4 MB',
    modulo: 'Payroll',
    status: 'Disponível',
  },
  {
    id: '2',
    titulo: 'Controle de Ponto – Semana 19',
    tipo: 'Excel',
    periodo: '05/05 – 11/05/2025',
    geradoEm: '12/05/2025 07:00',
    tamanho: '856 KB',
    modulo: 'Ponto',
    status: 'Disponível',
  },
  {
    id: '3',
    titulo: 'Relatório de Turnover – 1º Tri 2025',
    tipo: 'PDF',
    periodo: 'Jan–Mar 2025',
    geradoEm: '02/04/2025 09:30',
    tamanho: '1,1 MB',
    modulo: 'Admissões',
    status: 'Disponível',
  },
  {
    id: '4',
    titulo: 'Performance da Equipe – Maio 2025',
    tipo: 'PDF',
    periodo: 'Mai/2025',
    geradoEm: '15/05/2025 06:45',
    tamanho: '3,2 MB',
    modulo: 'Avaliações',
    status: 'Disponível',
  },
  {
    id: '5',
    titulo: 'Certificados Vencendo – Próximos 30 dias',
    tipo: 'CSV',
    periodo: 'Mai–Jun 2025',
    geradoEm: '20/05/2025 07:10',
    tamanho: '124 KB',
    modulo: 'Certificações',
    status: 'Disponível',
  },
  {
    id: '6',
    titulo: 'Banco de Horas Consolidado – Equipe Logística',
    tipo: 'Excel',
    periodo: 'Abr–Mai 2025',
    geradoEm: '19/05/2025 18:00',
    tamanho: '430 KB',
    modulo: 'Jornada',
    status: 'Disponível',
  },
];

const tipoBadgeClass: Record<string, string> = {
  PDF: 'bg-red-500/10 text-red-400 border border-red-500/20',
  Excel: 'bg-green-500/10 text-green-400 border border-green-500/20',
  CSV: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
};

export function RelatoriosRhView({ module, hubPath, hubLabel }: RelatoriosRhViewProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    tipoModulo: '',
    de: '',
    ate: '',
    formato: 'PDF',
    recorrencia: 'Sem recorrência',
  });

  const kpis = [
    {
      icon: FileText,
      title: 'Relatórios Gerados',
      value: '89',
      trend: 'up' as const,
      trendValue: '+11 este mês',
    },
    {
      icon: Calendar,
      title: 'Agendados',
      value: '12',
      trend: 'up' as const,
      trendValue: '+3 novos',
    },
    {
      icon: Download,
      title: 'Downloads',
      value: '234',
      trend: 'up' as const,
      trendValue: '+28 hoje',
    },
    {
      icon: Clock,
      title: 'Última Atualização',
      value: 'Hoje',
      trend: 'neutral' as const,
      trendValue: '21/05/2025 08:15',
    },
  ];

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Gerar Novo Relatório"
      aria-label="Gerar Novo Relatório"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={20} strokeWidth={2.5} />
    </button>
  );

  const sidePanel = (
    <>
      <div className="logta-panel-card--dark logta-panel-card--retention p-6">
        <div className="mb-4 flex items-center gap-2">
          <Zap size={18} className="text-yellow-400" />
          <span className="text-sm font-bold text-white">IA de Relatórios</span>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-neutral-400">
          Com base nos dados recentes, identifiquei padrões que merecem atenção estratégica.
        </p>
        <div className="space-y-3">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-yellow-400">📊 Relatório Sugerido</p>
            <p className="mt-1 text-xs text-neutral-300">
              "Absenteísmo por Setor – Mai/2025" pode revelar padrão crítico no setor de logística (+22% vs. mês anterior).
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-blue-400">📈 Tendência Detectada</p>
            <p className="mt-1 text-xs text-neutral-300">
              Horas extras cresceram 18% em abril. Recomendo relatório de banco de horas com filtro por cargo.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-green-400">🤖 Gerado Automaticamente</p>
            <p className="mt-1 text-xs text-neutral-300">
              Relatório de certificados vencendo foi gerado automaticamente e enviado para os responsáveis às 07h.
            </p>
          </div>
        </div>
      </div>

      <div className="logta-panel-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart size={18} className="text-primary" />
          <span className="text-sm font-bold text-gray-800 dark:text-white">Métricas de Uso</span>
        </div>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-neutral-400">Mais Acessados</p>
            <div className="space-y-1.5">
              {[
                { nome: 'Folha de Pagamento', pct: 92 },
                { nome: 'Controle de Ponto', pct: 78 },
                { nome: 'Turnover', pct: 54 },
              ].map((r) => (
                <div key={r.nome}>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-neutral-400">
                    <span>{r.nome}</span>
                    <span>{r.pct}%</span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full rounded-full bg-gray-200 dark:bg-neutral-700">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 dark:border-neutral-700">
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">Formatos Preferidos</p>
            <div className="flex gap-2">
              <span className="rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">PDF 58%</span>
              <span className="rounded-lg bg-green-100 px-2 py-1 text-xs font-bold text-green-600 dark:bg-green-500/10 dark:text-green-400">Excel 31%</span>
              <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">CSV 11%</span>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-neutral-400">Frequência média</span>
              <span className="text-sm font-bold text-primary">4,2x/semana</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-neutral-400">Agendados ativos</span>
              <span className="text-sm font-bold text-gray-700 dark:text-white">12 relatórios</span>
            </div>
          </div>
        </div>
      </div>
    </>
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
        mainContentTitle="Relatórios Disponíveis"
        mainContentAction={mainContentAction}
        sidePanel={sidePanel}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-3">
          {mockRelatorios.map((rel) => (
            <div
              key={rel.id}
              className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <FileText size={18} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{rel.titulo}</p>
                  <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${tipoBadgeClass[rel.tipo]}`}>
                    {rel.tipo}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {rel.periodo}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {rel.geradoEm}
                  </span>
                  <span>{rel.tamanho}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => showToast('success', `Download de "${rel.titulo}" iniciado`, 'Download')}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-primary dark:hover:bg-primary/10 dark:hover:text-primary"
                title="Baixar relatório"
              >
                <Download size={15} />
              </button>
            </div>
          ))}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Relatórios de RH"
        getTabularData={() => ({
          title: 'Relatórios de RH',
          filenameBase: 'rh-relatorios',
          columns: ['Título', 'Tipo', 'Período', 'Gerado em', 'Tamanho', 'Módulo'],
          rows: mockRelatorios.map((r) => [r.titulo, r.tipo, r.periodo, r.geradoEm, r.tamanho, r.modulo]),
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
            <LogtaModalHeader icon={FileText} title="Gerar Novo Relatório" onClose={() => setIsModalOpen(false)} />

            <div className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Módulo / Tipo</label>
                <select
                  value={form.tipoModulo}
                  onChange={(e) => setForm((f) => ({ ...f, tipoModulo: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Selecione o módulo...</option>
                  <option>Folha de Pagamento</option>
                  <option>Controle de Ponto</option>
                  <option>Turnover & Admissões</option>
                  <option>Performance & Avaliações</option>
                  <option>Certificações</option>
                  <option>Banco de Horas</option>
                  <option>Absenteísmo</option>
                  <option>Treinamentos</option>
                  <option>Auditoria de RH</option>
                  <option>Logs de Atividade</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-400">De</label>
                  <input
                    type="date"
                    value={form.de}
                    onChange={(e) => setForm((f) => ({ ...f, de: e.target.value }))}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Até</label>
                  <input
                    type="date"
                    value={form.ate}
                    onChange={(e) => setForm((f) => ({ ...f, ate: e.target.value }))}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Formato de Exportação</label>
                <select
                  value={form.formato}
                  onChange={(e) => setForm((f) => ({ ...f, formato: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option>PDF</option>
                  <option>Excel (.xlsx)</option>
                  <option>CSV</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Agendar Recorrência</label>
                <select
                  value={form.recorrencia}
                  onChange={(e) => setForm((f) => ({ ...f, recorrencia: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option>Sem recorrência</option>
                  <option>Diariamente</option>
                  <option>Semanalmente (toda segunda)</option>
                  <option>Quinzenalmente</option>
                  <option>Mensalmente (dia 1)</option>
                </select>
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
                    showToast('success', 'Relatório sendo gerado! Disponível em instantes.', 'Relatório');
                    setIsModalOpen(false);
                  }}
                  className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Gerar Relatório
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
