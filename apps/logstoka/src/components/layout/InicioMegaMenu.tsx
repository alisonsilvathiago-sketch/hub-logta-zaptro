import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ShoppingBag, Sparkles } from 'lucide-react';
import { getMegaMenuForMode, type InicioMegaLink } from '@/components/layout/inicioNavCatalog';
import { resolveMegaMenuSectionId } from '@/components/layout/resolveAppSection';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { loadOperationalProfile } from '@/lib/operationalProfile';

type Props = {
  onOpenAi?: () => void;
};

function MegaLinkItem({
  link,
  onActivate,
}: {
  link: InicioMegaLink;
  onActivate: (link: InicioMegaLink) => void;
}) {
  if (link.action === 'open-ai') {
    return (
      <button type="button" className="ls-mega-nav__link" onClick={() => onActivate(link)}>
        <span className="ls-mega-nav__link-label">{link.label}</span>
        {link.badge === 'ai' ? (
          <span className="ls-mega-nav__badge ls-mega-nav__badge--ai">
            <Sparkles size={10} strokeWidth={2.5} />
            IA
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <Link to={link.to ?? '#'} className="ls-mega-nav__link" role="menuitem" onClick={() => onActivate(link)}>
      <span className="ls-mega-nav__link-label">{link.label}</span>
      {link.badge === 'new' ? <span className="ls-mega-nav__badge ls-mega-nav__badge--new">Novo</span> : null}
      {link.badge === 'ai' ? (
        <span className="ls-mega-nav__badge ls-mega-nav__badge--ai">
          <Sparkles size={10} strokeWidth={2.5} />
          IA
        </span>
      ) : null}
    </Link>
  );
}

const InicioMegaMenu: React.FC<Props> = ({ onOpenAi }) => {
  const { pathname } = useLocation();
  const { companyId } = useLogstokaTenant();
  const profile = loadOperationalProfile(companyId);
  const menuSections = getMegaMenuForMode(profile.mode);
  const activeSectionId = resolveMegaMenuSectionId(pathname);
  const isMarketplaceHub = pathname.startsWith('/app/marketplace');
  const [openId, setOpenId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!openId || !wrapRef.current) return;
      if (event.target instanceof Node && !wrapRef.current.contains(event.target)) {
        setOpenId(null);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [openId]);

  const close = () => setOpenId(null);

  const handleLink = (link: InicioMegaLink) => {
    if (link.action === 'open-ai') {
      close();
      onOpenAi?.();
      return;
    }
    close();
  };

  const marketplaceLink = (
    <Link
      to={LOGSTOKA_ROUTES.MARKETPLACE_HUB}
      className={`ls-mega-nav__marketplace-link${isMarketplaceHub ? ' ls-mega-nav__marketplace-link--active' : ''}`}
      aria-current={isMarketplaceHub ? 'page' : undefined}
      onClick={close}
    >
      <ShoppingBag size={14} strokeWidth={2.2} aria-hidden />
      Marketplace
    </Link>
  );

  const renderSection = (section: (typeof menuSections)[number]) => {
    const isOpen = openId === section.id;
    const columnCount = section.columns.length;

    return (
      <div key={section.id} className={`ls-mega-nav__item${isOpen ? ' ls-mega-nav__item--open' : ''}`}>
        <button
          type="button"
          className={`ls-mega-nav__trigger${activeSectionId === section.id ? ' ls-mega-nav__trigger--active' : ''}`}
          aria-expanded={isOpen}
          onClick={() => setOpenId((current) => (current === section.id ? null : section.id))}
        >
          {section.label}
          <ChevronDown size={14} strokeWidth={2.25} className="ls-mega-nav__chevron" />
        </button>

        {isOpen ? (
          <div
            className={`ls-mega-nav__panel ls-mega-nav__panel--cols-${Math.min(columnCount, 3)}`}
            role="menu"
          >
            <div className="ls-mega-nav__columns">
              {section.columns.map((column, columnIndex) => (
                <div key={column.title} className="ls-mega-nav__column">
                  <h3 className="ls-mega-nav__column-title">{column.title}</h3>
                  <ul className="ls-mega-nav__list">
                    {column.links.map((link) => (
                      <li key={link.label + (link.to ?? link.action ?? '')}>
                        <MegaLinkItem link={link} onActivate={handleLink} />
                      </li>
                    ))}
                    {columnIndex === 0 && section.footerLink ? (
                      <li className="ls-mega-nav__list-footer">
                        <Link to={section.footerLink.to} className="ls-mega-nav__footer" onClick={close}>
                          {section.footerLink.label}
                        </Link>
                      </li>
                    ) : null}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const primarySections = menuSections.filter((section) => section.id !== 'config');
  const accountSection = menuSections.find((section) => section.id === 'config');

  return (
    <nav className="ls-mega-nav" aria-label="Menu principal" ref={wrapRef}>
      {primarySections.map(renderSection)}
      {marketplaceLink}
      {accountSection ? renderSection(accountSection) : null}
    </nav>
  );
};

export default InicioMegaMenu;
