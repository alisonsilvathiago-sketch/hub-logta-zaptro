import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Bell,
  AlertTriangle,
  Zap,
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingDown,
  Shield,
  Activity,
  Users,
  Target,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import type { RhModuleDef } from '../../types';

type IaAlertasOperacionaisViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

const mockAlertas = [
  {
    id: '1',
    tipo: 'Absenteísmo Crítico',
    afetado: 'Equipe de Logística – Turno A',
    severidade: 'Crítico',
    predicao: '87% de chance de impacto operacional amanhã',
    prazo: '22/05/2025',
    status: 'Ativo',
    geradoEm: '21/05/2025 06:00',
  },
  {
    id: '2',
    tipo: 'Vencimento de CNH',
    afetado: 'Paulo Ferreira – Motorista',
    severidade: 'Crítico',
    predicao: 'CNH vence em 3 dias – risco de irregularidade',
    prazo: '24/05/2025',
    status: 'Ativo',
    geradoEm: '19/05/2025 07:30',
  },
  {
    id: '3',
    tipo: 'Fadiga Detectada',
    afetado: 'Rodrigo Santana – Motorista',
    severidade: 'Crítico',
    predicao: 'Padrão de 62h/semana por 3 semanas consecutivas',
    prazo: '21/05/2025',
    status: 'Ativo',
    geradoEm: '21/05/2025 08:15',
  },
  {
    id: '4',
    tipo: 'Meta em Risco',
    afetado: 'Setor de Operações',
    severidade: 'Alto',
    predicao: 'Produtividade 23% abaixo da meta mensal projetada',
    prazo: '31/05/2025',
    status: 'Em análise',
    geradoEm: '20/05/2025 09:00',
  },
  {
    id: '5',
    tipo: 'Vencimento de ASO',
    afetado: '5 colaboradores da frota',
    severidade: 'Alto',
    predicao: 'Exames ocupacionais vencem em menos de 15 dias',
    prazo: '05/06/2025',
    status: 'Ativo',
    geradoEm: '18/05/2025 07:00',
  },
  {
    id: '6',
    tipo: 'Rotatividade Elevada',
    afetado: 'Departamento de Logística',
    severidade: 'Médio',
    predicao: 'Turnover 34% acima da média histórica do setor',
    prazo: '30/06/2025',
    status: 'Resolvido',
    geradoEm: '10/05/2025 10:00',
  },
];

const severidadeConfig: Record<string, { class: string; dot: string; icon: React.ReactNode }> = {
  Crítico: {
    class: 'bg-red-500/10 text-red-400 border border-red-500/20',
    dot: 'bg-red-500 animate-pulse',
    icon: <AlertTriangle size={12} />,
  },
  Alto: {
    class: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    dot: 'bg-orange-500',
    icon: <AlertTriangle size={12} />,
  },
  Médio: {
    class: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    dot: 'bg-yellow-500',
    icon: <Bell size={12} />,
  },
};

const statusConfig: Record<string, string> = {
  Ativo: 'bg-red-500/10 text-red-400 border border-red-500/20',
  'Em análise': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  Resolvido: 'bg-green-500/10 text-green-400 border border-green-500/20',
};

const setores = [
  'Equipe de Logística – Turno A',
  'Equipe de Logística – Turno B',
  'Setor de Operações',
  'Departamento de RH',
  'Administrativo',
  'Frota Geral',
];

export function IaAlertasOperacionaisView({ module, hubPath, hubLabel }: IaAlertasOperacionaisViewProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    tipo: '',
    setor: '',
    severidade: 'Médio',
    descricao: '',
    prazo: '',
  });

  const kpis = [
    {
      icon: Bell,
      title: 'Alertas Ativos',
      value: '28',
      trend: 'up' as const,
      trendValue: '+5 vs. ontem',
    },
    {
      icon: AlertTriangle,
      title: 'Críticos',
      value: '5',
      trend: 'up' as const,
      trendValue: 'requerem ação imediata',
    },
    {
      icon: CheckCircle2,
      title: 'Resolvidos Hoje',
      value: '14',
      trend: 'up' as const,
      trendValue: '+6 vs. média',
    },
    {
      icon: Target,
      title: 'Precisão das Predições',
      value: '91%',
      trend: 'up' as const,
      trendValue: '+3% este mês',
    },
  ];

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Criar Alerta Manual"
      aria-label="Criar Alerta Manual"
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
          <span className="text-sm font-bold text-white">Dashboard Executivo IA</span>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-neutral-400">
          Saúde operacional em tempo real com predições baseadas em machine learning.
        </p>
        <div className="space-y-3">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-red-400">🚨 Principais Riscos</p>
            <ul className="mt-1 space-y-1 text-xs text-neutral-300">
              <li>• Absenteísmo logística pode paralisar 2 rotas amanhã</li>
              <li>• 2 motoristas sem habilitação válida até sexta</li>
              <li>• Fadiga em 3 condutores na rota SP–RJ</li>
            </ul>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-blue-400">🤖 Ações Automáticas</p>
            <ul className="mt-1 space-y-1 text-xs text-neutral-300">
              <li>• E-mail de renovação enviado para Paulo Ferreira</li>
              <li>• Gestor de frota notificado sobre Rodrigo Santana</li>
              <li>• Agendamento de ASO criado para 5 colaboradores</li>
            </ul>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-green-400">✅ Saúde Geral</p>
            <p className="mt-1 text-xs text-neutral-300">
              Índice de saúde operacional: <span className="font-bold text-yellow-400">72/100</span>. Meta: acima de 85 até fim do mês.
            </p>
          </div>
        </div>
      </div>

      <div className="logta-panel-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          <span className="text-sm font-bold text-gray-800 dark:text-white">Métricas de Alertas</span>
        </div>
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">Alertas por Tipo</p>
            <div className="space-y-1.5">
              {[
                { tipo: 'Documentos', qtd: 9, pct: 32 },
                { tipo: 'Fadiga/Jornada', qtd: 7, pct: 25 },
                { tipo: 'Absenteísmo', qtd: 6, pct: 21 },
                { tipo: 'Metas', qtd: 6, pct: 21 },
              ].map((t) => (
                <div key={t.tipo}>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-neutral-400">
                    <span>{t.tipo}</span>
                    <span>{t.qtd}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full rounded-full bg-gray-200 dark:bg-neutral-700">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${t.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 dark:border-neutral-700">
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">Histórico de Resoluções</p>
            <div className="space-y-1 text-xs text-gray-600 dark:text-neutral-400">
              <div className="flex justify-between"><span>Esta semana</span><span className="font-bold text-green-500">14 resolvidos</span></div>
              <div className="flex justify-between"><span>Semana passada</span><span className="font-bold text-gray-800 dark:text-white">19 resolvidos</span></div>
              <div className="flex justify-between"><span>Maio (total)</span><span className="font-bold text-gray-800 dark:text-white">67 resolvidos</span></div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-neutral-400">Tempo médio de resposta</span>
              <span className="text-sm font-bold text-primary">2h 14min</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-neutral-400">SLA cumprido</span>
              <span className="text-sm font-bold text-green-500">86%</span>
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
        mainContentTitle="Alertas Operacionais Ativos"
        mainContentAction={mainContentAction}
        sidePanel={sidePanel}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-3">
          {mockAlertas.map((alerta) => {
            const sc = severidadeConfig[alerta.severidade];
            const stc = statusConfig[alerta.status];
            return (
              <div
                key={alerta.id}
                className={`group rounded-2xl border p-4 transition-shadow hover:shadow-md ${
                  alerta.severidade === 'Crítico'
                    ? 'border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5'
                    : 'border-gray-100 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                      alerta.severidade === 'Crítico' ? 'bg-red-100 dark:bg-red-500/10' : 'bg-primary/10'
                    }`}
                  >
                    <Bell
                      size={18}
                      className={alerta.severidade === 'Crítico' ? 'text-red-500' : 'text-primary'}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-gray-800 dark:text-white">{alerta.tipo}</p>
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${sc.class}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        {alerta.severidade}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${stc}`}>
                        {alerta.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 dark:text-neutral-300">{alerta.afetado}</p>
                    <p className="mt-1 text-xs italic text-gray-500 dark:text-neutral-400">🤖 {alerta.predicao}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> Prazo: {alerta.prazo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap size={11} /> Gerado: {alerta.geradoEm}
                      </span>
                    </div>
                  </div>
                  {alerta.status !== 'Resolvido' && (
                    <button
                      type="button"
                      onClick={() => showToast('success', `Alerta "${alerta.tipo}" marcado como resolvido!`, 'Alertas')}
                      className="flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:border-green-500 hover:bg-green-50 hover:text-green-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-green-500 dark:hover:text-green-400"
                    >
                      Resolver
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Alertas Operacionais"
        getTabularData={() => ({
          title: 'IA Alertas Operacionais',
          filenameBase: 'rh-ia-alertas-operacionais',
          columns: ['Tipo', 'Afetado', 'Severidade', 'Predição', 'Prazo', 'Status', 'Gerado em'],
          rows: mockAlertas.map((a) => [a.tipo, a.afetado, a.severidade, a.predicao, a.prazo, a.status, a.geradoEm]),
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
            <LogtaModalHeader icon={Bell} title="Criar Alerta Manual" onClose={() => setIsModalOpen(false)} />

            <div className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Tipo de Alerta</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Selecione o tipo...</option>
                  <option>Absenteísmo Crítico</option>
                  <option>Vencimento de Documentos</option>
                  <option>Fadiga / Jornada Excessiva</option>
                  <option>Meta em Risco</option>
                  <option>Conflito de Escala</option>
                  <option>Irregularidade de Ponto</option>
                  <option>Rotatividade Elevada</option>
                  <option>Outro</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Setor / Colaborador Afetado</label>
                <select
                  value={form.setor}
                  onChange={(e) => setForm((f) => ({ ...f, setor: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {setores.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Severidade</label>
                <select
                  value={form.severidade}
                  onChange={(e) => setForm((f) => ({ ...f, severidade: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option>Crítico</option>
                  <option>Alto</option>
                  <option>Médio</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Descrição do Alerta</label>
                <textarea
                  placeholder="Descreva o problema identificado e o impacto esperado..."
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Prazo para Resolução</label>
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
                    showToast('success', 'Alerta criado! Responsáveis notificados automaticamente.', 'Alertas Operacionais');
                    setIsModalOpen(false);
                  }}
                  className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Criar Alerta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
