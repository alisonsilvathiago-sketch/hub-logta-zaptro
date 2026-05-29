import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Bell,
  ChevronRight,
  ClipboardList,
  MessageSquare,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  getRhModulesByCategory,
  getRhSectionById,
  type RhAdministrativoSectionId,
} from '../rhModules';

const SECTION_META: Record<
  RhAdministrativoSectionId,
  { icon: LucideIcon; summary: string; kpis: { label: string; value: string }[] }
> = {
  pessoas: {
    icon: Users,
    summary: 'Ciclo de vida do colaborador: admissões, desligamentos, benefícios e aprovações.',
    kpis: [
      { label: 'Colaboradores ativos', value: '—' },
      { label: 'Admissões em andamento', value: '3' },
      { label: 'Atestados pendentes', value: '2' },
      { label: 'Férias aguardando', value: '5' },
    ],
  },
  performance: {
    icon: TrendingUp,
    summary: 'Metas, avaliações, treinamentos e certificações da equipe.',
    kpis: [
      { label: 'Avaliações abertas', value: '8' },
      { label: 'Metas no prazo', value: '92%' },
      { label: 'Treinamentos ativos', value: '4' },
      { label: 'Certificados válidos', value: '97%' },
    ],
  },
  comunicacao: {
    icon: MessageSquare,
    summary: 'Mural interno, comunicados, solicitações e suporte ao colaborador.',
    kpis: [
      { label: 'Comunicados ativos', value: '6' },
      { label: 'Solicitações abertas', value: '11' },
      { label: 'Leituras pendentes', value: '24' },
      { label: 'Tickets suporte', value: '3' },
    ],
  },
  governanca: {
    icon: Activity,
    summary: 'Alertas, relatórios, permissões, auditoria e integrações do RH.',
    kpis: [
      { label: 'Alertas críticos', value: '2' },
      { label: 'Logs (24h)', value: '148' },
      { label: 'Integrações ativas', value: '3' },
      { label: 'Relatórios (mês)', value: '12' },
    ],
  },
};

type Props = {
  sectionId: RhAdministrativoSectionId;
  colaboradoresCount?: number;
  motoristasCount?: number;
};

export function RhAdminSectionDashboard({
  sectionId,
  colaboradoresCount = 0,
  motoristasCount = 0,
}: Props) {
  const [search, setSearch] = useState('');
  const section = getRhSectionById(sectionId);
  const meta = SECTION_META[sectionId];
  const Icon = meta?.icon || Users;
  const basePath = '/rh/administrativo';

  const modules = useMemo(() => {
    return getRhModulesByCategory('admin').filter((m) => m.sectionId === sectionId);
  }, [sectionId]);

  const filteredModules = useMemo(() => {
    if (!search.trim()) return modules;
    const q = search.toLowerCase();
    return modules.filter((m) => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
  }, [modules, search]);

  const kpis = useMemo(() => {
    if (!meta) return [];
    const list = [...meta.kpis];
    if (sectionId === 'pessoas' && colaboradoresCount > 0) {
      list[0] = { ...list[0], value: String(colaboradoresCount) };
    }
    if (sectionId === 'governanca' && motoristasCount > 0) {
      list[2] = { ...list[2], value: String(Math.min(3, 2 + (motoristasCount > 0 ? 1 : 0))) };
    }
    return list;
  }, [meta, sectionId, colaboradoresCount, motoristasCount]);

  if (!section || !meta) return null;

  return (
    <div className="space-y-8 text-left">
      <Link
        to={basePath}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para RH Administrativo
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon size={26} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="logta-page-title text-2xl sm:text-3xl">{section.title}</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium text-gray-500">{meta.summary}</p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-normal text-primary">
          <Sparkles size={12} /> Dashboard da área
        </span>
      </div>

      <div className="logta-panel-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-8">
        <div className="relative min-w-0 w-full max-w-xl flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            placeholder="Buscar módulo..." 
            className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-primary/50" 
            type="search" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex max-h-[120px] shrink-0 flex-wrap items-center justify-end gap-2 overflow-y-auto pl-2 scrollbar-hide sm:max-w-[55%]">
          {filteredModules.map((mod) => {
            const ModIcon = mod.icon;
            const href = mod.externalPath ?? `${basePath}/${mod.slug}`;
            return (
              <Link 
                key={mod.slug}
                to={href}
                title={mod.title}
                aria-label={mod.title}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all hover:bg-primary hover:text-white border border-primary/20 bg-primary/5 text-primary"
              >
                <ModIcon size={18} />
              </Link>
            );
          })}
          {filteredModules.length === 0 && (
            <span className="text-xs text-gray-500">Nenhum módulo encontrado.</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="logta-stat-card group">
            <p className="logta-stat-card__label logta-stat-card__label--spaced">{kpi.label}</p>
            <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary logta-dashboard-stat-card__value--lg">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="logta-panel-card p-6 sm:p-8">
        <h3 className="logta-card-heading mb-2">Destaques da área</h3>
        <p className="text-sm font-medium text-gray-500">
          Indicadores consolidados para decisão rápida. Os módulos abaixo abrem o workspace completo de cada
          funcionalidade.
        </p>
        <ul className="mt-4 space-y-2 text-sm font-medium text-gray-700">
          {sectionId === 'pessoas' ? (
            <>
              <li className="flex items-center gap-2">
                <UserPlus size={16} className="text-primary" /> Pipeline de contratações com onboarding
              </li>
              <li className="flex items-center gap-2">
                <ClipboardList size={16} className="text-primary" /> Aprovações de atestados e férias centralizadas
              </li>
            </>
          ) : sectionId === 'performance' ? (
            <>
              <li className="flex items-center gap-2">
                <Target size={16} className="text-primary" /> OKRs e metas por unidade
              </li>
              <li className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" /> IA de performance e risco de turnover
              </li>
            </>
          ) : sectionId === 'comunicacao' ? (
            <>
              <li className="flex items-center gap-2">
                <Bell size={16} className="text-primary" /> Comunicados com confirmação de leitura
              </li>
              <li className="flex items-center gap-2">
                <MessageSquare size={16} className="text-primary" /> Canal direto colaborador ↔ RH
              </li>
            </>
          ) : (
            <>
              <li className="flex items-center gap-2">
                <Activity size={16} className="text-primary" /> Painel executivo e relatórios exportáveis
              </li>
              <li className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" /> Alertas preditivos de jornada e operação
              </li>
            </>
          )}
        </ul>
      </div>

    </div>
  );
}
