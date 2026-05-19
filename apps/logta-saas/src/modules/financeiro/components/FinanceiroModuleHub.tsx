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

  const basePath = category === 'operacional' ? '/financeiro/operacional' : '/financeiro/gestao';

  return (
    <div className="space-y-8 text-left">
      <div className="logta-panel-card p-6 sm:p-8">
        <h3 className="logta-card-heading mb-2">{title}</h3>
        <p className="text-sm font-medium text-gray-500">{subtitle}</p>
        <div className="relative mt-6 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar módulo financeiro..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-primary/50"
          />
        </div>
      </div>

      {sections.map((section) => {
        const sectionModules = filtered.filter((m) => m.sectionId === section.id);
        if (!sectionModules.length) return null;

        return (
          <section key={section.id}>
            <h3 className="logta-panel-section-title mb-4">{section.title}</h3>
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
