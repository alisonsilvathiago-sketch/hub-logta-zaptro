import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Clock,
  AlertTriangle,
  TrendingDown,
  Shield,
  User,
  Zap,
  Sparkles,
  Brain,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import type { RhModuleDef } from '../../types';

type IaJornadaExcessivaViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

const mockColaboradores = [
  {
    id: '1',
    nome: 'Rodrigo Santana',
    cargo: 'Motorista de Longa Distância',
    horasSemanais: 62,
    excedente: '+18h',
    risco: 'Alto',
    ultimaIntervencao: '08/05/2025',
    dept: 'Logística',
  },
  {
    id: '2',
    nome: 'Paulo Ferreira',
    cargo: 'Motorista de Distribuição',
    horasSemanais: 58,
    excedente: '+14h',
    risco: 'Alto',
    ultimaIntervencao: '—',
    dept: 'Logística',
  },
  {
    id: '3',
    nome: 'Marcos Oliveira',
    cargo: 'Coordenador de Frota',
    horasSemanais: 52,
    excedente: '+8h',
    risco: 'Médio',
    ultimaIntervencao: '15/04/2025',
    dept: 'Operações',
  },
  {
    id: '4',
    nome: 'Lucas Carvalho',
    cargo: 'Motorista Agregado',
    horasSemanais: 56,
    excedente: '+12h',
    risco: 'Alto',
    ultimaIntervencao: '—',
    dept: 'Logística',
  },
  {
    id: '5',
    nome: 'Thiago Melo',
    cargo: 'Analista de Operações',
    horasSemanais: 50,
    excedente: '+6h',
    risco: 'Médio',
    ultimaIntervencao: '20/04/2025',
    dept: 'Operações',
  },
  {
    id: '6',
    nome: 'Fernanda Souza',
    cargo: 'Supervisora de Rota',
    horasSemanais: 48,
    excedente: '+4h',
    risco: 'Baixo',
    ultimaIntervencao: '01/05/2025',
    dept: 'Logística',
  },
];

const riscoConfig: Record<string, { class: string; dot: string }> = {
  Alto: {
    class: 'bg-red-500/10 text-red-400 border border-red-500/20',
    dot: 'bg-red-500',
  },
  Médio: {
    class: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    dot: 'bg-yellow-500',
  },
  Baixo: {
    class: 'bg-green-500/10 text-green-400 border border-green-500/20',
    dot: 'bg-green-500',
  },
};

const colaboradoresSelect = mockColaboradores.map((c) => c.nome);

export function IaJornadaExcessivaView({ module, hubPath, hubLabel }: IaJornadaExcessivaViewProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    colaborador: '',
    tipoIntervencao: '',
    justificativa: '',
  });

  const kpis = [
    {
      icon: AlertTriangle,
      title: 'Em Alerta',
      value: '12',
      trend: 'up' as const,
      trendValue: '+3 esta semana',
    },
    {
      icon: Clock,
      title: 'Horas Excedentes',
      value: '485h',
      trend: 'up' as const,
      trendValue: '+62h vs. semana ant.',
    },
    {
      icon: Shield,
      title: 'Risco Alto',
      value: '3',
      trend: 'up' as const,
      trendValue: 'requer intervenção',
    },
    {
      icon: CheckCircle2,
      title: 'Intervenções',
      value: '8',
      trend: 'up' as const,
      trendValue: '+2 este mês',
    },
  ];

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Registrar Intervenção"
      aria-label="Registrar Intervenção"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={20} strokeWidth={2.5} />
    </button>
  );

  const sidePanel = (
    <>
      <div className="logta-panel-card--dark logta-panel-card--retention p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-yellow-400" />
          <span className="text-sm font-bold text-white">IA – Jornada & Fadiga</span>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-neutral-400">
          Análise preditiva de fadiga operacional com base em padrões de horas trabalhadas, rotas e histórico.
        </p>
        <div className="space-y-3">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-red-400">🚨 Risco de Fadiga Crítica</p>
            <p className="mt-1 text-xs text-neutral-300">
              Rodrigo Santana está na 3ª semana consecutiva com mais de 60h. Probabilidade de acidente: 78%. Intervenção imediata recomendada.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-yellow-400">🔄 Redistribuição Sugerida</p>
            <p className="mt-1 text-xs text-neutral-300">
              A rota SP–BH pode ser redistribuída entre Lucas Carvalho e Fernanda Souza, reduzindo a jornada de ambos em ≈6h semanais.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-blue-400">🛡️ Impacto Operacional</p>
            <p className="mt-1 text-xs text-neutral-300">
              Histórico indica que jornadas acima de 55h aumentam índice de sinistros em 2,4x. 4 colaboradores estão nessa faixa.
            </p>
          </div>
        </div>
      </div>

      <div className="logta-panel-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          <span className="text-sm font-bold text-gray-800 dark:text-white">Horas & Compliance</span>
        </div>
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">Horas por Departamento</p>
            <div className="space-y-1.5">
              {[
                { dept: 'Logística', horas: 312, pct: 85 },
                { dept: 'Operações', horas: 124, pct: 62 },
                { dept: 'Administrativo', horas: 49, pct: 32 },
              ].map((d) => (
                <div key={d.dept}>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-neutral-400">
                    <span>{d.dept}</span>
                    <span>{d.horas}h</span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full rounded-full bg-gray-200 dark:bg-neutral-700">
                    <div
                      className={`h-1.5 rounded-full ${d.pct > 70 ? 'bg-red-400' : d.pct > 50 ? 'bg-yellow-400' : 'bg-primary'}`}
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 dark:border-neutral-700">
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">Comparativo CLT</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-neutral-400">
                <span>Limite legal (CLT)</span>
                <span className="font-bold text-gray-800 dark:text-white">44h/semana</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-neutral-400">
                <span>Média atual (equipe)</span>
                <span className="font-bold text-yellow-500">51h/semana</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-neutral-400">
                <span>Excedente médio</span>
                <span className="font-bold text-red-400">+7h/semana</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 dark:border-neutral-700">
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">Evolução Semanal (excedente)</p>
            <div className="space-y-1 text-xs text-gray-600 dark:text-neutral-400">
              <div className="flex justify-between"><span>Semana 17</span><span className="font-bold text-red-400">+423h</span></div>
              <div className="flex justify-between"><span>Semana 18</span><span className="font-bold text-red-400">+451h</span></div>
              <div className="flex justify-between"><span>Semana 19</span><span className="font-bold text-red-400">+485h</span></div>
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
        mainContentTitle="Colaboradores em Alerta de Jornada"
        mainContentAction={mainContentAction}
        sidePanel={sidePanel}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-3">
          {mockColaboradores.map((col) => {
            const rc = riscoConfig[col.risco];
            return (
              <div
                key={col.id}
                className="group rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <User size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{col.nome}</p>
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${rc.class}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${rc.dot}`} />
                        Risco {col.risco}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-neutral-400">{col.cargo} · {col.dept}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {col.horasSemanais}h/semana
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-red-400">
                        <TrendingDown size={11} /> Excedente: {col.excedente}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={11} /> Intervenção: {col.ultimaIntervencao}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, colaborador: col.nome }));
                      setIsModalOpen(true);
                    }}
                    className="flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-primary dark:hover:text-primary"
                  >
                    Intervir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Jornada Excessiva"
        getTabularData={() => ({
          title: 'IA Jornada Excessiva',
          filenameBase: 'rh-ia-jornada-excessiva',
          columns: ['Colaborador', 'Cargo', 'Departamento', 'Horas Semanais', 'Excedente', 'Risco', 'Última Intervenção'],
          rows: mockColaboradores.map((c) => [c.nome, c.cargo, c.dept, `${c.horasSemanais}h`, c.excedente, c.risco, c.ultimaIntervencao]),
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
            <LogtaModalHeader icon={Sparkles} title="Registrar Intervenção" onClose={() => setIsModalOpen(false)} />

            <div className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Colaborador</label>
                <select
                  value={form.colaborador}
                  onChange={(e) => setForm((f) => ({ ...f, colaborador: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Selecione o colaborador...</option>
                  {colaboradoresSelect.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Tipo de Intervenção</label>
                <select
                  value={form.tipoIntervencao}
                  onChange={(e) => setForm((f) => ({ ...f, tipoIntervencao: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Selecione o tipo...</option>
                  <option>Redução de Jornada</option>
                  <option>Folga Compensatória</option>
                  <option>Alerta Formal ao Colaborador</option>
                  <option>Afastamento Preventivo</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Justificativa</label>
                <textarea
                  placeholder="Descreva os motivos da intervenção e as medidas tomadas..."
                  value={form.justificativa}
                  onChange={(e) => setForm((f) => ({ ...f, justificativa: e.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
                <p className="text-xs font-semibold text-yellow-400">⚠️ Atenção Legal</p>
                <p className="mt-1 text-xs text-neutral-400">
                  Esta intervenção será registrada no histórico do colaborador e pode impactar cálculos de hora extra e banco de horas.
                </p>
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
                    showToast('success', 'Intervenção registrada e colaborador notificado!', 'Jornada');
                    setIsModalOpen(false);
                  }}
                  className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Confirmar Intervenção
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
