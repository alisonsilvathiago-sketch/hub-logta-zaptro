import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Brain,
  Bot,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Zap,
  Shield,
  ChevronRight,
  User,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import type { RhModuleDef } from '../../types';

type IaPerformanceViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

type IaPrediction = 'Risco de Turnover' | 'Queda de Performance' | 'Alto Potencial' | 'Estável';
type RiskLevel = 'Alto' | 'Médio' | 'Baixo';

interface IaAnalysis {
  id: string;
  colaborador: string;
  cargo: string;
  scoreRisco: number;
  predicao: IaPrediction;
  confianca: number;
  nivelRisco: RiskLevel;
  ultimaAnalise: string;
}

const mockAnalises: IaAnalysis[] = [
  {
    id: 'ia-001',
    colaborador: 'Thiago Nascimento',
    cargo: 'Analista de Logística',
    scoreRisco: 87,
    predicao: 'Risco de Turnover',
    confianca: 92,
    nivelRisco: 'Alto',
    ultimaAnalise: '2026-05-20',
  },
  {
    id: 'ia-002',
    colaborador: 'Camila Barbosa',
    cargo: 'Gerente de Projetos',
    scoreRisco: 72,
    predicao: 'Queda de Performance',
    confianca: 85,
    nivelRisco: 'Alto',
    ultimaAnalise: '2026-05-20',
  },
  {
    id: 'ia-003',
    colaborador: 'Lucas Santana',
    cargo: 'Dev Full Stack',
    scoreRisco: 18,
    predicao: 'Alto Potencial',
    confianca: 96,
    nivelRisco: 'Baixo',
    ultimaAnalise: '2026-05-19',
  },
  {
    id: 'ia-004',
    colaborador: 'Renata Carvalho',
    cargo: 'Especialista de RH',
    scoreRisco: 55,
    predicao: 'Risco de Turnover',
    confianca: 78,
    nivelRisco: 'Médio',
    ultimaAnalise: '2026-05-18',
  },
  {
    id: 'ia-005',
    colaborador: 'Bruno Peixoto',
    cargo: 'Supervisor de Operações',
    scoreRisco: 31,
    predicao: 'Estável',
    confianca: 91,
    nivelRisco: 'Baixo',
    ultimaAnalise: '2026-05-18',
  },
  {
    id: 'ia-006',
    colaborador: 'Letícia Gomes',
    cargo: 'Coordenadora Comercial',
    scoreRisco: 68,
    predicao: 'Queda de Performance',
    confianca: 82,
    nivelRisco: 'Médio',
    ultimaAnalise: '2026-05-17',
  },
];

const predicaoConfig: Record<
  IaPrediction,
  { color: string; bg: string; border: string; icon: React.ElementType }
> = {
  'Risco de Turnover': {
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-100',
    icon: TrendingDown,
  },
  'Queda de Performance': {
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    icon: AlertTriangle,
  },
  'Alto Potencial': {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    icon: TrendingUp,
  },
  Estável: {
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    icon: Shield,
  },
};

const riskColor: Record<RiskLevel, string> = {
  Alto: 'bg-red-500',
  Médio: 'bg-amber-500',
  Baixo: 'bg-emerald-500',
};

export function IaPerformanceView({ module, hubPath, hubLabel }: IaPerformanceViewProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [alertColaborador, setAlertColaborador] = useState('');
  const [alertTipo, setAlertTipo] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('');
  const [alertNotificar, setAlertNotificar] = useState('');

  const kpis = [
    {
      icon: Brain,
      title: 'Colaboradores Monitorados',
      value: '87',
      trend: 'up' as const,
      trendValue: '+5 esta semana',
    },
    {
      icon: AlertTriangle,
      title: 'Em Risco de Turnover',
      value: '8',
      trend: 'down' as const,
      trendValue: 'Atenção requerida',
    },
    {
      icon: Sparkles,
      title: 'Predições Geradas',
      value: '342',
      trend: 'up' as const,
      trendValue: '+47 este mês',
    },
    {
      icon: Zap,
      title: 'Precisão do Modelo',
      value: '89%',
      trend: 'up' as const,
      trendValue: '+2% vs. mês anterior',
    },
  ];

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Configurar Alerta de IA"
      aria-label="Configurar Alerta de IA"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={20} strokeWidth={2.5} />
    </button>
  );

  const handleSalvarAlerta = () => {
    if (!alertColaborador || !alertTipo) {
      showToast('error', 'Selecione colaborador e tipo de alerta.', 'Campos obrigatórios');
      return;
    }
    showToast('success', 'Alerta de IA configurado com sucesso!', 'Alerta criado');
    setAlertColaborador('');
    setAlertTipo('');
    setAlertThreshold('');
    setAlertNotificar('');
    setIsModalOpen(false);
  };

  const inputClass =
    'w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors';
  const labelClass = 'mb-1.5 block text-xs font-bold text-neutral-400 uppercase tracking-wide';

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
        mainContentTitle="Análises Preditivas por Colaborador"
        mainContentAction={mainContentAction}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-3">
          {mockAnalises.map((analise) => {
            const cfg = predicaoConfig[analise.predicao];
            const PredIcon = cfg.icon;
            return (
              <div
                key={analise.id}
                className={`w-full rounded-2xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm ${cfg.border}`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Brain size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{analise.colaborador}</p>
                        <p className="text-xs text-gray-500">{analise.cargo}</p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.color}`}
                      >
                        <PredIcon size={11} />
                        {analise.predicao}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Score de Risco</span>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-1.5 rounded-full ${riskColor[analise.nivelRisco]}`}
                              style={{ width: `${analise.scoreRisco}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700">{analise.scoreRisco}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Zap size={11} className="text-primary" />
                        <span className="text-xs text-gray-500">
                          Confiança: <span className="font-bold text-gray-700">{analise.confianca}%</span>
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${riskColor[analise.nivelRisco]}`}
                      >
                        {analise.nivelRisco} Risco
                      </span>
                      <span className="text-xs text-gray-500">
                        Analisado em {new Date(analise.ultimaAnalise).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="mt-1 shrink-0 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Análises de IA"
        getTabularData={() => ({
          title: 'IA Performance',
          filenameBase: 'rh-ia-performance',
          columns: ['Colaborador', 'Cargo', 'Score de Risco', 'Predição', 'Confiança (%)', 'Nível de Risco', 'Última Análise'],
          rows: mockAnalises.map((a) => [
            a.colaborador,
            a.cargo,
            String(a.scoreRisco),
            a.predicao,
            `${a.confianca}%`,
            a.nivelRisco,
            new Date(a.ultimaAnalise).toLocaleDateString('pt-BR'),
          ]),
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
              icon={Bot}
              title="Configurar Alerta de IA"
              onClose={() => setIsModalOpen(false)}
            />
            <div className="mt-8 space-y-4">
              <div>
                <label className={labelClass}>Colaborador</label>
                <select
                  value={alertColaborador}
                  onChange={(e) => setAlertColaborador(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecionar colaborador...</option>
                  {mockAnalises.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.colaborador} — {a.cargo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Tipo de Alerta</label>
                <select
                  value={alertTipo}
                  onChange={(e) => setAlertTipo(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecionar tipo...</option>
                  <option value="turnover">Risco de Turnover</option>
                  <option value="performance">Queda de Performance</option>
                  <option value="burnout">Sinais de Burnout</option>
                  <option value="potencial">Alto Potencial identificado</option>
                  <option value="absenteismo">Padrão de Absenteísmo</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Threshold de Score (0–100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Ex.: 70 — alerta quando score superar este valor"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Notificar</label>
                <select
                  value={alertNotificar}
                  onChange={(e) => setAlertNotificar(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecionar destinatário...</option>
                  <option value="gestor-direto">Gestor Direto</option>
                  <option value="rh">Equipe de RH</option>
                  <option value="gestor-rh">Gestor + RH</option>
                  <option value="diretoria">Diretoria</option>
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
                  onClick={handleSalvarAlerta}
                  className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Ativar Alerta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
