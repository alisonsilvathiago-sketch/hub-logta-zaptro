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
  const isDocumentosHub = adminHubId === 'documentos-compliance';
  const isOperacionalHub = category === 'operational';
  const hideHubHeader = isJornadaPontoHub || isAdministrativoHub || isDocumentosHub || isOperacionalHub;

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 mt-2">
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
            
            {isAdministrativoHub && (
              <div className="flex max-h-[120px] shrink-0 flex-wrap items-center justify-end gap-2 overflow-y-auto pl-2 scrollbar-hide sm:max-w-[55%]">
                <Link title="Contratações" aria-label="Contratações" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all hover:bg-primary hover:text-white border border-primary/20 bg-primary/5 text-primary" to="/rh/administrativo/contratacoes">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line></svg>
                </Link>
                <Link title="Desligamentos" aria-label="Desligamentos" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all hover:bg-primary hover:text-white border border-primary/20 bg-primary/5 text-primary" to="/rh/administrativo/desligamentos">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-minus"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="22" x2="16" y1="11" y2="11"></line></svg>
                </Link>
                <Link title="Histórico do Funcionário" aria-label="Histórico do Funcionário" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all hover:bg-primary hover:text-white border border-primary/20 bg-primary/5 text-primary" to="/rh/administrativo/historico-funcionario">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path></svg>
                </Link>
                <Link title="Timeline do Funcionário" aria-label="Timeline do Funcionário" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all hover:bg-primary hover:text-white border border-primary/20 bg-primary/5 text-primary" to="/rh/equipe">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-git-branch"><line x1="6" x2="6" y1="3" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
                </Link>
                <Link title="Aprovação de Atestados" aria-label="Aprovação de Atestados" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all hover:bg-primary hover:text-white border border-primary/20 bg-primary/5 text-primary" to="/rh/administrativo/aprovacao-atestados">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-check"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="m9 14 2 2 4-4"></path></svg>
                </Link>
                <Link title="Aprovação de Férias" aria-label="Aprovação de Férias" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all hover:bg-primary hover:text-white border border-primary/20 bg-primary/5 text-primary" to="/rh/administrativo/aprovacao-ferias">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-check"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
                </Link>
                <Link title="Controle Salarial" aria-label="Controle Salarial" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all hover:bg-primary hover:text-white border border-primary/20 bg-primary/5 text-primary" to="/rh/administrativo/controle-salarial">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-banknote"><rect width="20" height="12" x="2" y="6" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
                </Link>
                <Link title="Benefícios" aria-label="Benefícios" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all hover:bg-primary hover:text-white border border-primary/20 bg-primary/5 text-primary" to="/rh/administrativo/beneficios">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path></svg>
                </Link>
              </div>
            )}

            {category === 'operational' && (
              <div className="flex max-h-[120px] shrink-0 flex-wrap items-center justify-end gap-2 overflow-y-auto pl-2 scrollbar-hide sm:max-w-[55%]">
                <Link title="Gestão de Motoristas" aria-label="Gestão de Motoristas" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all hover:bg-primary hover:text-white border border-primary/20 bg-primary/5 text-primary" to="/rh/motoristas">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck"><path d="M10 17h4V5H2v12h3"></path><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h2"></path><path d="M14 9h5"></path><circle cx="7.5" cy="17.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>
                </Link>
                <Link title="Gestão de Ajudantes" aria-label="Gestão de Ajudantes" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all hover:bg-primary hover:text-white border border-primary/20 bg-primary/5 text-primary" to="/rh/operacional/gestao-ajudantes">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </Link>
                <Link title="Motoristas Disponíveis" aria-label="Motoristas Disponíveis" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all hover:bg-primary hover:text-white border border-primary/20 bg-primary/5 text-primary" to="/rh/operacional/motoristas-disponiveis">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-check"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
                </Link>
                <Link title="Status em Rota" aria-label="Status em Rota" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all hover:bg-primary hover:text-white border border-primary/20 bg-primary/5 text-primary" to="/rh/operacional/status-rota">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-route"><circle cx="6" cy="19" r="3"></circle><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"></path><circle cx="18" cy="5" r="3"></circle></svg>
                </Link>
              </div>
            )}

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
              <h3 className="logta-panel-section-title">{section.title}</h3>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    <h4 className="logta-card-heading mb-2 !text-black group-hover:!text-black">{mod.title}</h4>
                    <p className="mb-4 flex-1 text-xs font-medium leading-relaxed text-black/70">{mod.description}</p>
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-normal text-black">
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
