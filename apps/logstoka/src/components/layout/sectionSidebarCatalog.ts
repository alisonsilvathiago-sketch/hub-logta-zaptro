import { getMegaMenuForMode, INICIO_MEGA_MENU, type InicioMegaLink } from '@/components/layout/inicioNavCatalog';
import { loadOperationalProfile } from '@/lib/operationalProfile';
import { SETTINGS_NAV } from '@/modules/settings/settingsNav';
import type { AppSectionId } from './resolveAppSection';

export type SectionSidebarLink = {
  label: string;
  to: string;
  end?: boolean;
  badge?: 'new' | 'ai';
};

export type SectionSidebarGroup = {
  title: string;
  links: SectionSidebarLink[];
};

export type SectionSidebarDef = {
  id: AppSectionId;
  label: string;
  groups: SectionSidebarGroup[];
  footerLink?: { label: string; to: string };
};

function mapMegaLink(link: InicioMegaLink): SectionSidebarLink | null {
  if (link.action || !link.to) return null;
  const end =
    link.to === '/app/products' ||
    link.to === '/app' ||
    link.to === '/app/operacao' ||
    link.to.endsWith('/meu-perfil');
  return {
    label: link.label,
    to: link.to,
    end,
    badge: link.badge,
  };
}

function megaSectionToSidebar(sectionId: string, mode = loadOperationalProfile(null).mode): SectionSidebarDef | null {
  const menu = getMegaMenuForMode(mode);
  const section = menu.find((entry) => entry.id === sectionId);
  if (!section) return null;

  return {
    id: section.id as AppSectionId,
    label: section.label,
    groups: section.columns.map((column) => ({
      title: column.title,
      links: column.links
        .map(mapMegaLink)
        .filter((link): link is SectionSidebarLink => link !== null),
    })),
    footerLink: section.footerLink,
  };
}

const SETTINGS_SIDEBAR: SectionSidebarDef = {
  id: 'config',
  label: 'Conta',
  groups: [
    {
      title: 'Administração',
      links: SETTINGS_NAV.map((item) => ({
        label: item.label,
        to: item.to,
        end: item.end,
      })),
    },
  ],
  footerLink: { label: 'Voltar à operação', to: '/app/operacao' },
};

const SIDEBAR_BY_SECTION: Partial<Record<AppSectionId, SectionSidebarDef>> = {
  operacao: megaSectionToSidebar('operacao') ?? undefined,
  estoque: megaSectionToSidebar('estoque') ?? undefined,
  canais: megaSectionToSidebar('canais') ?? undefined,
  config: SETTINGS_SIDEBAR,
};

export function getSectionSidebar(sectionId: AppSectionId, companyId?: string | null): SectionSidebarDef | null {
  if (sectionId === 'home') return null;

  if (sectionId === 'operacao' || sectionId === 'estoque' || sectionId === 'canais') {
    const mode = loadOperationalProfile(companyId ?? null).mode;
    return megaSectionToSidebar(sectionId, mode);
  }

  return SIDEBAR_BY_SECTION[sectionId] ?? SIDEBAR_BY_SECTION.operacao ?? null;
}

/** @deprecated use getMegaMenuForMode */
export { INICIO_MEGA_MENU };
