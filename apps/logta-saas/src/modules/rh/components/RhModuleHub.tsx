import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock, Search, Sparkles } from 'lucide-react';
import {
  getRhAdminHubConfig,
  getRhModulesByCategory,
  getRhSectionById,
  getRhSections,
  RH_ADMINISTRATIVO_SECTION_NAV,
} from '../rhModules';
import { JornadaPontoLiveFeed } from '../ponto/components/JornadaPontoLiveFeed';
import type { RhAdminHubId } from '../rhModules';
import type { RhModuleCategory } from '../types';

type RhModuleHubProps = {
  category: RhModuleCategory;
  title: string;
  subtitle: string;
  colaboradoresCount?: number;
  /** Hub administrativo dedicado (administrativo | jornada-ponto | documentos-compliance). */
  adminHubId?: RhAdminHubId;
  /** Caminho base para links de módulo (sobrescreve hub admin). */
  basePath?: string;
  /** Filtra seções exibidas (ids de RH_*_SECTIONS). */
  sectionIds?: string[];
  /** Oculta seções listadas. */
  excludeSectionIds?: string[];
};

export function RhModuleHub({
  category,
  title,
  subtitle,
  adminHubId,
  basePath: basePathProp,
  sectionIds: sectionIdsProp,
  excludeSectionIds: excludeSectionIdsProp,
  colaboradoresCount = 0,
}: RhModuleHubProps) {
  const [query, setQuery] = useState('');
  const hubConfig = adminHubId ? getRhAdminHubConfig(adminHubId) : undefined;
  const sectionIds = sectionIdsProp ?? hubConfig?.sectionIds;
  const excludeSectionIds = excludeSectionIdsProp ?? hubConfig?.excludeSectionIds;

  const sections = useMemo(() => {
    const all = getRhSections(category);
    let list = all;
    if (sectionIds?.length) {
      list = list.filter((s) => sectionIds.includes(s.id));
    }
    if (excludeSectionIds?.length) {
      list = list.filter((s) => !excludeSectionIds.includes(s.id));
    }
    return list;
  }, [category, sectionIds, excludeSectionIds]);

  const modules = getRhModulesByCategory(category);
  const basePath =
    basePathProp ??
    hubConfig?.path ??
    (category === 'admin' ? '/rh/administrativo' : '/rh/operacional');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inSections = modules.filter((m) => sections.some((s) => s.id === m.sectionId));
    if (!q) return inSections;
    return inSections.filter(
      (m) => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
    );
  }, [modules, sections, query]);

  const singleSection = sections.length === 1;
  const isJornadaPontoHub = adminHubId === 'jornada-ponto';
  const isAdministrativoHub = adminHubId === 'administrativo';
  const hideHubHeader = isJornadaPontoHub || isAdministrativoHub;

  return (
    <div className="space-y-8 text-left">
      <div className="logta-panel-card p-6 sm:p-8">
        {!hideHubHeader ? (
          <>
            <h3 className="logta-card-heading mb-2">{title}</h3>
            <p className="text-sm font-medium text-gray-500">{subtitle}</p>
          </>
        ) : null}
        <div className={`flex flex-col gap-3 ${hideHubHeader ? '' : 'mt-6'}`}>
          {isAdministrativoHub ? (
            <div className="flex flex-wrap gap-2">
              {RH_ADMINISTRATIVO_SECTION_NAV.map((sectionId) => {
                const section = getRhSectionById(sectionId);
                if (!section) return null;
                const short =
                  sectionId === 'pessoas'
                    ? 'Pessoas'
                    : sectionId === 'performance'
                      ? 'Performance'
                      : sectionId === 'comunicacao'
                        ? 'Comunicação'
                        : 'Governança';
                return (
                  <Link
                    key={sectionId}
                    to={`${basePath}/${sectionId}`}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-800 shadow-sm transition-all hover:border-primary/40 hover:text-primary"
                  >
                    {short}
                  </Link>
                );
              })}
            </div>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isJornadaPontoHub
                    ? 'Buscar módulo de jornada…'
                    : isAdministrativoHub
                      ? 'Buscar módulo administrativo…'
                      : 'Buscar módulo RH...'
                }
                className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-primary/50"
              />
            </div>
            {isJornadaPontoHub ? (
              <Link
                to="/rh/jornada-ponto/controle-ponto"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-gray-900 shadow-md shadow-primary/25 transition-all hover:brightness-105"
              >
                <Clock size={18} strokeWidth={2.25} />
                Controle de Ponto
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {adminHubId === 'jornada-ponto' ? (
        <JornadaPontoLiveFeed colaboradoresCount={colaboradoresCount} />
      ) : null}

      {sections.map((section) => {
        const sectionModules = filtered.filter((m) => m.sectionId === section.id);
        if (!sectionModules.length) return null;

        return (
          <section key={section.id}>
            {!singleSection ? (
              <h3 className="logta-panel-section-title mb-4">{section.title}</h3>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sectionModules.map((mod) => {
                const Icon = mod.icon;
                const href = mod.externalPath ?? `${basePath}/${mod.slug}`;

                return (
                  <Link
                    key={mod.slug}
                    to={href}
                    className="logta-panel-card group flex flex-col p-6 transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                        <Icon size={22} strokeWidth={2} />
                      </div>
                      {mod.iaEnabled ? (
                        <span className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-1 text-[9px] font-black uppercase tracking-normal text-primary">
                          <Sparkles size={10} /> IA
                        </span>
                      ) : null}
                    </div>
                    <h4 className="logta-card-heading mb-2 group-hover:text-primary">{mod.title}</h4>
                    <p className="mb-4 flex-1 text-xs font-medium leading-relaxed text-gray-500">{mod.description}</p>
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-normal text-primary">
                      Abrir módulo <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
