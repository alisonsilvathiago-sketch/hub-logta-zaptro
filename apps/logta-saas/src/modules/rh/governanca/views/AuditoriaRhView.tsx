import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Search,
  Scale,
  History,
  Zap,
  FileText,
  Clock,
  User,
  TrendingUp,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import type { RhModuleDef } from '../../types';

type AuditoriaRhViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

const mockAuditoria = [
  {
    id: '1',
    categoria: 'Documentos',
    requisito: 'ASO em dia para todos os colaboradores',
    status: 'Conforme',
    responsavel: 'Fernanda Lima',
    evidencia: 'ASO_Atualizado_Mai2025.pdf',
    dataVerificacao: '15/05/2025',
  },
  {
    id: '2',
    categoria: 'Ponto',
    requisito: 'Registros de ponto sem inconsistências > 30 min',
    status: 'Não Conforme',
    responsavel: 'Carlos Mendes',
    evidencia: 'Relatório_Ponto_Abr.xlsx',
    dataVerificacao: '12/05/2025',
  },
  {
    id: '3',
    categoria: 'Salário',
    requisito: 'Folha de pagamento processada até dia 5',
    status: 'Conforme',
    responsavel: 'Ana Beatriz Costa',
    evidencia: 'Folha_Mai2025_Assinada.pdf',
    dataVerificacao: '01/05/2025',
  },
  {
    id: '4',
    categoria: 'Segurança',
    requisito: 'CNH válida para todos os motoristas',
    status: 'Em análise',
    responsavel: 'Marcos Prado',
    evidencia: 'Planilha_CNH_Status.xlsx',
    dataVerificacao: '18/05/2025',
  },
  {
    id: '5',
    categoria: 'Documentos',
    requisito: 'Contratos de trabalho assinados e digitalizados',
    status: 'Conforme',
    responsavel: 'Juliana Martins',
    evidencia: 'Contratos_Digitalizados_2025.zip',
    dataVerificacao: '10/05/2025',
  },
  {
    id: '6',
    categoria: 'Ponto',
    requisito: 'Banco de horas negativo zerado no trimestre',
    status: 'Não Conforme',
    responsavel: 'Rafael Torres',
    evidencia: 'BancoHoras_Mar2025.xlsx',
    dataVerificacao: '05/04/2025',
  },
];

const statusConfig: Record<string, { class: string; icon: React.ReactNode }> = {
  'Conforme': {
    class: 'bg-green-500/10 text-green-400 border border-green-500/20',
    icon: <CheckCircle2 size={12} />,
  },
  'Não Conforme': {
    class: 'bg-red-500/10 text-red-400 border border-red-500/20',
    icon: <AlertTriangle size={12} />,
  },
  'Em análise': {
    class: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    icon: <Clock size={12} />,
  },
};

const categoriaClass: Record<string, string> = {
  Documentos: 'bg-blue-500/10 text-blue-400',
  Ponto: 'bg-purple-500/10 text-purple-400',
  Salário: 'bg-green-500/10 text-green-400',
  Segurança: 'bg-red-500/10 text-red-400',
};

const responsaveis = ['Fernanda Lima', 'Carlos Mendes', 'Ana Beatriz Costa', 'Marcos Prado', 'Juliana Martins', 'Rafael Torres'];

export function AuditoriaRhView({ module, hubPath, hubLabel }: AuditoriaRhViewProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    categoria: '',
    requisito: '',
    descricao: '',
    responsavel: '',
    prazo: '',
  });

  const kpis = [
    {
      icon: TrendingUp,
      title: 'Conformidade Geral',
      value: '94%',
      trend: 'up' as const,
      trendValue: '+2% vs. último tri',
    },
    {
      icon: AlertTriangle,
      title: 'Não Conformidades',
      value: '7',
      trend: 'down' as const,
      trendValue: '-3 resolvidas',
    },
    {
      icon: FileText,
      title: 'Evidências Coletadas',
      value: '342',
      trend: 'up' as const,
      trendValue: '+28 este mês',
    },
    {
      icon: Clock,
      title: 'Próxima Auditoria',
      value: '15 dias',
      trend: 'neutral' as const,
      trendValue: '05/06/2025',
    },
  ];

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Registrar Não Conformidade"
      aria-label="Registrar Não Conformidade"
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
          <span className="text-sm font-bold text-white">IA de Conformidade</span>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-neutral-400">
          Análise preditiva de riscos regulatórios e conformidade trabalhista.
        </p>
        <div className="space-y-3">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-green-400">📈 Predição de Conformidade</p>
            <p className="mt-1 text-xs text-neutral-300">
              Se as 2 não conformidades de Ponto forem resolvidas até 01/06, conformidade atingirá 98% — melhor resultado histórico.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-red-400">⚠️ Risco Regulatório</p>
            <p className="mt-1 text-xs text-neutral-300">
              3 CNHs vencem em menos de 30 dias. Risco de autuação pela ANTT se não houver renovação ou substituição.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-blue-400">📎 Evidências Faltantes</p>
            <p className="mt-1 text-xs text-neutral-300">
              Requisito "Treinamento NR-7" sem evidência há 45 dias. Recomendo upload urgente antes da auditoria.
            </p>
          </div>
        </div>
      </div>

      <div className="logta-panel-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Scale size={18} className="text-primary" />
          <span className="text-sm font-bold text-gray-800 dark:text-white">Conformidade por Categoria</span>
        </div>
        <div className="space-y-3">
          <div className="space-y-2">
            {[
              { cat: 'Documentos', pct: 96 },
              { cat: 'Salário', pct: 100 },
              { cat: 'Segurança', pct: 88 },
              { cat: 'Ponto', pct: 82 },
            ].map((c) => (
              <div key={c.cat}>
                <div className="flex justify-between text-xs text-gray-600 dark:text-neutral-400">
                  <span>{c.cat}</span>
                  <span className={c.pct >= 90 ? 'font-bold text-green-500' : 'font-bold text-red-400'}>{c.pct}%</span>
                </div>
                <div className="mt-0.5 h-1.5 w-full rounded-full bg-gray-200 dark:bg-neutral-700">
                  <div
                    className={`h-1.5 rounded-full ${c.pct >= 90 ? 'bg-green-500' : 'bg-red-400'}`}
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 dark:border-neutral-700">
            <div className="mb-2 flex items-center gap-1">
              <History size={14} className="text-gray-500" />
              <p className="text-xs font-semibold text-gray-500 dark:text-neutral-400">Histórico de Auditorias</p>
            </div>
            <div className="space-y-1 text-xs text-gray-600 dark:text-neutral-400">
              <div className="flex justify-between"><span>Q1 2025</span><span className="font-bold text-green-500">92%</span></div>
              <div className="flex justify-between"><span>Q4 2024</span><span className="font-bold text-yellow-500">87%</span></div>
              <div className="flex justify-between"><span>Q3 2024</span><span className="font-bold text-red-400">79%</span></div>
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
        mainContentTitle="Itens de Auditoria"
        mainContentAction={mainContentAction}
        sidePanel={sidePanel}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-3">
          {mockAuditoria.map((item) => {
            const sc = statusConfig[item.status];
            return (
              <div
                key={item.id}
                className="group rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Shield size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{item.requisito}</p>
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${sc.class}`}>
                        {sc.icon} {item.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <span className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${categoriaClass[item.categoria] ?? 'bg-gray-100 text-gray-500'}`}>
                        {item.categoria}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <User size={11} /> {item.responsavel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Search size={11} /> {item.evidencia}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> Verificado: {item.dataVerificacao}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Auditoria de RH"
        getTabularData={() => ({
          title: 'Auditoria de RH',
          filenameBase: 'rh-auditoria',
          columns: ['Categoria', 'Requisito', 'Status', 'Responsável', 'Evidência', 'Data Verificação'],
          rows: mockAuditoria.map((i) => [i.categoria, i.requisito, i.status, i.responsavel, i.evidencia, i.dataVerificacao]),
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
            <LogtaModalHeader icon={AlertTriangle} title="Registrar Não Conformidade" onClose={() => setIsModalOpen(false)} />

            <div className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Categoria</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  <option>Documentos</option>
                  <option>Ponto</option>
                  <option>Salário</option>
                  <option>Segurança</option>
                  <option>Treinamentos</option>
                  <option>Compliance Legal</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Requisito Auditado</label>
                <input
                  type="text"
                  placeholder="Ex: ASO em dia para todos os colaboradores"
                  value={form.requisito}
                  onChange={(e) => setForm((f) => ({ ...f, requisito: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Descrição da Não Conformidade</label>
                <textarea
                  placeholder="Descreva detalhadamente o que foi encontrado em desconformidade..."
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Responsável pela Correção</label>
                <select
                  value={form.responsavel}
                  onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Selecione o responsável...</option>
                  {responsaveis.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Prazo para Correção</label>
                <input
                  type="date"
                  value={form.prazo}
                  onChange={(e) => setForm((f) => ({ ...f, prazo: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                />
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
                    showToast('success', 'Não conformidade registrada! Responsável notificado.', 'Auditoria');
                    setIsModalOpen(false);
                  }}
                  className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
