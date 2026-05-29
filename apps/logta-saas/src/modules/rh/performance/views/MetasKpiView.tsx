import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Calendar,
  User,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import { useTenant } from '../../../../contexts/TenantContext';
import { resolveDemoCompanyId } from '../../../../lib/seed';
import { resolveOkrTargetUrl } from '../metasKpiNavigation';
import type { RhModuleDef } from '../../types';

type MetasKpiViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

type OKRStatus = 'Em andamento' | 'Concluída' | 'Em risco';

interface OKRRecord {
  id: string;
  titulo: string;
  owner: string;
  ownerId: string;
  progresso: number;
  prazo: string;
  status: OKRStatus;
  categoria: string;
}

const mockOKRs: OKRRecord[] = [
  {
    id: 'okr-001',
    titulo: 'Aumentar NPS da equipe de suporte para 72',
    owner: 'Fernanda Rodrigues',
    ownerId: 'emp-001',
    progresso: 83,
    prazo: '2026-06-30',
    status: 'Em andamento',
    categoria: 'Satisfação',
  },
  {
    id: 'okr-002',
    titulo: 'Reduzir turnover voluntário para abaixo de 8%',
    owner: 'Carlos Mendes',
    ownerId: 'emp-002',
    progresso: 61,
    prazo: '2026-07-31',
    status: 'Em andamento',
    categoria: 'Retenção',
  },
  {
    id: 'okr-003',
    titulo: 'Concluir 100% das avaliações de desempenho Q2',
    owner: 'Ana Lima',
    ownerId: 'emp-003',
    progresso: 100,
    prazo: '2026-05-31',
    status: 'Concluída',
    categoria: 'Desempenho',
  },
  {
    id: 'okr-004',
    titulo: 'Implementar programa de mentoria para 20 colaboradores',
    owner: 'Rafael Costa',
    ownerId: 'emp-004',
    progresso: 35,
    prazo: '2026-05-25',
    status: 'Em risco',
    categoria: 'Desenvolvimento',
  },
  {
    id: 'okr-005',
    titulo: 'Atingir 95% de adesão ao treinamento de conformidade',
    owner: 'Patrícia Souza',
    ownerId: 'emp-005',
    progresso: 78,
    prazo: '2026-06-15',
    status: 'Em andamento',
    categoria: 'Compliance',
  },
];

const statusConfig: Record<OKRStatus, { color: string; bg: string; icon: React.ElementType }> = {
  'Em andamento': { color: 'text-blue-700', bg: 'bg-blue-50', icon: TrendingUp },
  Concluída: { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
  'Em risco': { color: 'text-red-700', bg: 'bg-red-50', icon: AlertCircle },
};

export function MetasKpiView({ module, hubPath, hubLabel }: MetasKpiViewProps) {
  const navigate = useNavigate();
  const { config } = useTenant();
  const companyId = resolveDemoCompanyId(config?.id);
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoResponsavel, setNovoResponsavel] = useState('');
  const [novoPrazo, setNovoPrazo] = useState('');
  const [novaMetaQuantitativa, setNovaMetaQuantitativa] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');

  const kpis = [
    {
      icon: Target,
      title: 'Metas Abertas',
      value: '24',
      trend: 'up' as const,
      trendValue: '+3 este mês',
    },
    {
      icon: CheckCircle2,
      title: 'Concluídas',
      value: '18',
      trend: 'up' as const,
      trendValue: '+5 vs. trimestre anterior',
    },
    {
      icon: AlertCircle,
      title: 'Em Risco',
      value: '6',
      trend: 'down' as const,
      trendValue: '+2 novos alertas',
    },
    {
      icon: TrendingUp,
      title: 'Taxa de Conclusão',
      value: '75%',
      trend: 'up' as const,
      trendValue: '+8% vs. Q1',
    },
  ];

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Nova Meta"
      aria-label="Nova Meta"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={20} strokeWidth={2.5} />
    </button>
  );

  const handleSalvarMeta = () => {
    if (!novoTitulo.trim() || !novoResponsavel) {
      showToast('error', 'Preencha título e responsável.', 'Campos obrigatórios');
      return;
    }
    showToast('success', `Meta "${novoTitulo}" criada com sucesso!`, 'Meta criada');
    setNovoTitulo('');
    setNovoResponsavel('');
    setNovoPrazo('');
    setNovaMetaQuantitativa('');
    setNovaDescricao('');
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
        mainContentTitle="OKRs e Metas Ativas"
        mainContentAction={mainContentAction}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-3">
          {mockOKRs.map((okr) => {
            const cfg = statusConfig[okr.status];
            const StatusIcon = cfg.icon;
            return (
              <button
                key={okr.id}
                type="button"
                onClick={() => navigate(resolveOkrTargetUrl({ companyId, okr }))}
                className="group w-full rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-left transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Target size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold leading-snug text-gray-900">
                        {okr.titulo}
                      </p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.color}`}
                      >
                        <StatusIcon size={11} />
                        {okr.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <User size={11} /> {okr.owner}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={11} /> {new Date(okr.prazo).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {okr.categoria}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            okr.status === 'Concluída'
                              ? 'bg-emerald-500'
                              : okr.status === 'Em risco'
                              ? 'bg-red-500'
                              : 'bg-primary'
                          }`}
                          style={{ width: `${okr.progresso}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-bold text-gray-700">
                        {okr.progresso}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="mt-1 shrink-0 text-gray-400 transition-colors group-hover:text-primary"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Metas e KPIs"
        getTabularData={() => ({
          title: 'Metas e KPIs',
          filenameBase: 'rh-metas-kpi',
          columns: ['Título', 'Owner', 'Progresso (%)', 'Prazo', 'Status', 'Categoria'],
          rows: mockOKRs.map((o) => [
            o.titulo,
            o.owner,
            String(o.progresso),
            new Date(o.prazo).toLocaleDateString('pt-BR'),
            o.status,
            o.categoria,
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
            className="relative max-h-[min(92dvh,680px)] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-neutral-800 bg-[#18191B] p-6 text-left shadow-2xl duration-200 animate-in zoom-in-95 sm:rounded-[40px] sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <LogtaModalHeader
              icon={Target}
              title="Nova Meta / OKR"
              onClose={() => setIsModalOpen(false)}
            />
            <div className="mt-8 space-y-4">
              <div>
                <label className={labelClass}>Título da Meta</label>
                <input
                  type="text"
                  placeholder="Ex.: Aumentar NPS para 80 pontos"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Responsável</label>
                <select
                  value={novoResponsavel}
                  onChange={(e) => setNovoResponsavel(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecionar responsável...</option>
                  <option value="emp-001">Fernanda Rodrigues</option>
                  <option value="emp-002">Carlos Mendes</option>
                  <option value="emp-003">Ana Lima</option>
                  <option value="emp-004">Rafael Costa</option>
                  <option value="emp-005">Patrícia Souza</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Prazo</label>
                <input
                  type="date"
                  value={novoPrazo}
                  onChange={(e) => setNovoPrazo(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Meta Quantitativa</label>
                <input
                  type="text"
                  placeholder="Ex.: NPS ≥ 80, Turnover ≤ 8%, 100% concluídas"
                  value={novaMetaQuantitativa}
                  onChange={(e) => setNovaMetaQuantitativa(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Descrição / Contexto</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o objetivo, iniciativas-chave e critérios de sucesso..."
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  className={`${inputClass} resize-none`}
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
                  onClick={handleSalvarMeta}
                  className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Criar Meta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
