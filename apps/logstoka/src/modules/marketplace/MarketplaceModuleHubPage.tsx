import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Layers,
  Megaphone,
  Plug,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Store,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import IntegrationBrandLogo from '@/components/integrations/IntegrationBrandLogo';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { LogstokaStandardPageLayout } from '@/components/layout/LogstokaStandardPageLayout';
import { useMarketplaceModule } from '@/hooks/useMarketplaceModule';
import { INTEGRATED_MARKETPLACES, marketplaceHubPath } from '@/lib/marketplaceHub';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { MARKETPLACE_LABELS, type Marketplace } from '@/types';
import './marketplaceModuleHub.css';

type HubPlatform = {
  id: Marketplace | 'shein';
  label: string;
  to?: string;
  comingSoon?: boolean;
};

const HUB_PLATFORMS: HubPlatform[] = [
  ...INTEGRATED_MARKETPLACES.map((id) => ({
    id,
    label: MARKETPLACE_LABELS[id],
    to: marketplaceHubPath(id),
  })),
  { id: 'shein', label: 'Shein', comingSoon: true },
];

const QUICK_ACTIONS = [
  {
    label: 'Conectar lojas',
    hint: 'OAuth e credenciais multicanal',
    to: LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL,
    Icon: Plug,
  },
  {
    label: 'Publicar produtos',
    hint: 'Anúncios, variações e lotes',
    to: LOGSTOKA_ROUTES.PRODUCT_PUBLICATION,
    Icon: Megaphone,
  },
  {
    label: 'Sincronização',
    hint: 'Estoque e preços em tempo real',
    to: LOGSTOKA_ROUTES.PRODUCT_SYNC,
    Icon: RefreshCw,
  },
  {
    label: 'Grupos de lojas',
    hint: 'Publicação em lote por segmento',
    to: LOGSTOKA_ROUTES.PRODUCT_GROUPS,
    Icon: Layers,
  },
  {
    label: 'Pedidos de venda',
    hint: 'Consultar pedidos por canal',
    to: LOGSTOKA_ROUTES.SALES,
    Icon: Store,
  },
] as const;

const MarketplaceModuleHubPage: React.FC = () => {
  const { isActive, activate, activatedAt } = useMarketplaceModule();

  const handleActivate = () => {
    activate();
    toast.success('Módulo Marketplace ativado — funcionalidades liberadas.');
  };

  if (!isActive) {
    return (
      <LogstokaStandardPageLayout>
        <section className="ls-mp-hub ls-mp-hub__upsell-wrap">
          <div className="ls-mp-hub__upsell">
          <div className="ls-mp-hub__upsell-icon" aria-hidden>
            <ShoppingBag size={32} strokeWidth={2} />
          </div>
          <p className="ls-mp-hub__eyebrow">Central de Marketplaces</p>
          <h1 className="ls-mp-hub__title">Publique e sincronize nos principais canais</h1>
          <p className="ls-mp-hub__lead">
            Você ainda não possui o módulo Marketplace ativo. Enquanto isso, continue a operação de
            estoque normalmente — pedidos e movimentações permanecem visíveis.
          </p>
          <div className="ls-mp-hub__upsell-actions">
            <button type="button" className="ls-btn-primary" onClick={handleActivate}>
              Ativar Marketplace
            </button>
            <a
              href="https://logstoka.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="ls-btn-secondary"
            >
              Saiba mais
            </a>
          </div>
          <div className="ls-mp-hub__platform-preview">
            {HUB_PLATFORMS.map((platform) => (
              <div key={platform.id} className="ls-mp-hub__platform ls-mp-hub__platform--locked">
                {platform.id === 'shein' ? (
                  <IntegrationBrandLogo brandKey={platform.id} size={36} />
                ) : (
                  <MarketplaceLogo marketplace={platform.id as Marketplace} size={36} />
                )}
                <span>{platform.label}</span>
                {platform.comingSoon ? <em>Em breve</em> : null}
              </div>
            ))}
          </div>
          </div>
        </section>
      </LogstokaStandardPageLayout>
    );
  }

  return (
    <LogstokaStandardPageLayout>
      <div className="ls-mp-hub">
      <header className="ls-mp-hub__header">
        <div>
          <p className="ls-mp-hub__eyebrow">Central de Marketplaces</p>
          <h1 className="ls-mp-hub__title">Seus canais de venda num só lugar</h1>
          <p className="ls-mp-hub__lead">
            Publicação, sincronização e integrações — hub independente da operação de estoque.
            {activatedAt ? (
              <span className="ls-mp-hub__activated"> Ativado em {new Date(activatedAt).toLocaleDateString('pt-BR')}.</span>
            ) : null}
          </p>
        </div>
        <Link to={LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL} className="ls-btn-primary ls-mp-hub__header-cta">
          <Plug size={16} />
          Conectar lojas
        </Link>
      </header>

      <section className="ls-mp-hub__section">
        <div className="ls-mp-hub__section-head">
          <h2>Plataformas</h2>
          <p>Escolha o marketplace para gerir anúncios, estoque listado e pedidos.</p>
        </div>
        <div className="ls-mp-hub__platform-grid">
          {HUB_PLATFORMS.map((platform) =>
            platform.comingSoon || !platform.to ? (
              <div key={platform.id} className="ls-mp-hub__platform-card ls-mp-hub__platform-card--soon">
                {platform.id === 'shein' ? (
                  <IntegrationBrandLogo brandKey={platform.id} size={40} />
                ) : (
                  <MarketplaceLogo marketplace={platform.id as Marketplace} size={40} />
                )}
                <strong>{platform.label}</strong>
                <span className="ls-mp-hub__soon-badge">Em breve</span>
              </div>
            ) : (
              <Link key={platform.id} to={platform.to} className="ls-mp-hub__platform-card">
                {platform.id === 'shein' ? (
                  <IntegrationBrandLogo brandKey={platform.id} size={40} />
                ) : (
                  <MarketplaceLogo marketplace={platform.id as Marketplace} size={40} />
                )}
                <strong>{platform.label}</strong>
                <span className="ls-mp-hub__platform-link">
                  Abrir painel
                  <ArrowRight size={14} />
                </span>
              </Link>
            ),
          )}
        </div>
      </section>

      <section className="ls-mp-hub__section">
        <div className="ls-mp-hub__section-head">
          <h2>Ferramentas</h2>
          <p>Tudo o que precisa para publicar, sincronizar e acompanhar canais.</p>
        </div>
        <div className="ls-mp-hub__actions-grid">
          {QUICK_ACTIONS.map(({ label, hint, to, Icon }) => (
            <Link key={to} to={to} className="ls-mp-hub__action-card">
              <span className="ls-mp-hub__action-icon" aria-hidden>
                <Icon size={20} strokeWidth={2.2} />
              </span>
              <span>
                <strong>{label}</strong>
                <em>{hint}</em>
              </span>
              <ArrowRight size={16} className="ls-mp-hub__action-arrow" />
            </Link>
          ))}
        </div>
      </section>

      <section className="ls-mp-hub__tip">
        <Sparkles size={18} strokeWidth={2} aria-hidden />
        <p>
          Dica: use <strong>Grupos de lojas</strong> para publicar o mesmo catálogo em Shopee, Mercado Livre e
          Amazon com um clique.
        </p>
      </section>
      </div>
    </LogstokaStandardPageLayout>
  );
};

export default MarketplaceModuleHubPage;
