import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, Sparkles } from 'lucide-react';
import { getFinanceiroModulesByCategory, getFinanceiroSections } from '../financeiroModules';
import type { FinanceiroModuleCategory } from '../types';

type FinanceiroModuleHubProps = {
  category: FinanceiroModuleCategory;
  title: string;
  subtitle: string;
};

/** Ícones do print — ficam só nos cards, não na barra de atalhos. */
const OPERACIONAL_ATALHOS_EXCLUIDOS = new Set([
  'controle-comissoes',
  'controle-fretes',
  'controle-combustivel',
  'simulador-frete',
  'simulador-lucro',
  'simulador-operacional',
  'integracao-logistica',
  'integracao-frota',
  'integracao-rh',
]);

export function FinanceiroModuleHub({ category, title, subtitle }: FinanceiroModuleHubProps) {
  const [query, setQuery] = useState('');
  const sections = getFinanceiroSections(category);
  const modules = getFinanceiroModulesByCategory(category);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(
      (m) => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
    );
  }, [modules, query]);

  const shortcutModules = useMemo(() => {
    const sectionOrder = sections.map((s) => s.id);
    const list = modules.filter((m) => {
      if (category === 'operacional' && OPERACIONAL_ATALHOS_EXCLUIDOS.has(m.slug)) return false;
      return true;
    });
    return [...list].sort(
      (a, b) => sectionOrder.indexOf(a.sectionId) - sectionOrder.indexOf(b.sectionId),
    );
  }, [modules, sections, category]);

  const basePath = category === 'operacional' ? '/financeiro/operacional' : '/financeiro/gestao';

  return (
    <div className="space-y-8 text-left">
      <div className="logta-panel-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-8">
        <div className="relative min-w-0 w-full max-w-xl flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar módulo financeiro..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-primary/50"
          />
        </div>

        {shortcutModules.length > 0 ? (
          <div className="flex max-h-[120px] shrink-0 flex-wrap items-center justify-end gap-2 overflow-y-auto pl-2 scrollbar-hide sm:max-w-[55%]">
            {shortcutModules.map((mod) => {
              const Icon = mod.icon;
              const href = mod.externalPath ?? `${basePath}/${mod.slug}`;
              return (
                <Link
                  key={mod.slug}
                  to={href}
                  title={mod.title}
                  aria-label={mod.title}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all hover:bg-blue-600 hover:text-white ${
                    mod.iaEnabled
                      ? 'border border-blue-200 bg-blue-50 text-blue-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  <Icon size={18} strokeWidth={2} />
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>

      {sections.map((section) => {
        const sectionModules = filtered.filter((m) => m.sectionId === section.id);
        if (!sectionModules.length) return null;

        return (
          <section key={section.id}>
            <h3 className="logta-panel-section-title">{section.title}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                        <Icon size={22} strokeWidth={2} />
                      </div>
                      {mod.iaEnabled ? (
                        <span className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[9px] font-black uppercase tracking-normal text-blue-600">
                          <Sparkles size={10} /> IA
                        </span>
                      ) : null}
                    </div>
                    <h4 className="logta-card-heading mb-2 group-hover:text-blue-600">{mod.title}</h4>
                    <p className="mb-4 flex-1 text-xs font-medium leading-relaxed text-gray-500">{mod.description}</p>
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-normal text-blue-600">
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
