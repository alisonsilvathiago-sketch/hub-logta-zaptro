/**
 * Gerenciador de Subdomínios Logta (Versão ERP)
 */

export const LOGTA_DOMAINS = {
  MARKETING: 'www.logta.com.br',
  APP: 'app.logta.com.br',
  MASTER: 'adm.logta.com.br',
  API: 'api.logta.com.br',
};

export const getContext = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  if (hostname.includes('play.')) return 'CHECKOUT';
  return 'APP';
};

export const enforceDomain = () => {
  return;
};
