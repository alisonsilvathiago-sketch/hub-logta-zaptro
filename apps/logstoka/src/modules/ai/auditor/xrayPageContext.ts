import type { XRayPageContext } from './LogstokaXRayContext';

export function resolveXRayPageContext(pathname: string): XRayPageContext {
  if (pathname.includes('/products')) return 'products';
  if (pathname.includes('/inventory') || pathname.includes('/warehouses')) return 'stock';
  if (
    pathname.includes('/movements') ||
    pathname.includes('/transfers') ||
    pathname.includes('/imports') ||
    pathname.includes('/returns')
  ) {
    return 'movements';
  }
  if (pathname.includes('/marketplace') || resolveMarketplaceHubPath(pathname)) return 'marketplace';
  if (pathname.includes('/integrations')) return 'integrations';
  if (pathname.includes('/picking') || pathname.includes('/conference')) return 'conference';
  if (pathname.includes('/operacao')) return 'operational';
  if (pathname.includes('/atividades')) return 'activities';
  if (pathname.includes('/configuracoes')) return 'settings';
  if (pathname.includes('/reports')) return 'reports';
  if (pathname === '/app' || pathname === '/app/') return 'dashboard';
  return 'global';
}

function resolveMarketplaceHubPath(pathname: string): boolean {
  const hubSlugs = ['mercadolivre', 'shopee', 'amazon', 'tiktok', 'magalu'];
  const segment = pathname.replace(/^\/app\/?/, '').split('/')[0] ?? '';
  return hubSlugs.includes(segment);
}

export function getXRayContextTitle(context: XRayPageContext): string {
  switch (context) {
    case 'products':
      return 'Catálogo de Produtos';
    case 'stock':
      return 'Posições de Estoque WMS';
    case 'movements':
      return 'Fluxo de Movimentações';
    case 'marketplace':
      return 'Canais de Marketplace';
    case 'integrations':
      return 'Integrações Ativas';
    case 'conference':
      return 'Conferência Operacional';
    case 'picking':
      return 'Guias de Separadores';
    case 'operational':
      return 'Painel Operacional';
    case 'activities':
      return 'Central de Atividades';
    case 'settings':
      return 'Configurações';
    case 'dashboard':
      return 'Visão Geral';
    case 'reports':
      return 'Relatórios e Métricas';
    case 'global':
    default:
      return 'Auditoria Operacional Global';
  }
}

/** Áreas analisadas no painel lateral do Raio-X. */
export function getXRayContextFocusAreas(context: XRayPageContext): string {
  switch (context) {
    case 'products':
      return 'cadastro, publicação, estoque e atrasos de saída';
    case 'stock':
      return 'saldos, reservas, depósitos e inventário';
    case 'movements':
      return 'entradas, saídas, atrasos e conferência';
    case 'marketplace':
      return 'sync de canais, anúncios e estoque publicado';
    case 'integrations':
      return 'OAuth, webhooks e filas de sincronização';
    case 'conference':
    case 'picking':
      return 'conferência guiada, separação e divergências';
    case 'operational':
      return 'fluxo do dia, cortes e pendências operacionais';
    case 'activities':
      return 'atividades recentes, atrasos e alertas';
    case 'settings':
      return 'permissões, integrações e parâmetros WMS';
    case 'dashboard':
      return 'KPIs, alertas e visão consolidada';
    case 'reports':
      return 'métricas, exportações e consistência de dados';
    case 'global':
    default:
      return 'catálogo, estoque, movimentações e integrações';
  }
}

/** Três frases curtas — uma por vez, sem quebra de linha. */
export function getXRayScanPhrases(context: XRayPageContext): [string, string, string] {
  switch (context) {
    case 'products':
      return [
        'Cruzando catálogo e estoque…',
        'Conferindo atrasos, fluxo e publicação…',
        'Montando diagnóstico por SKU…',
      ];
    case 'stock':
      return ['Mapeando estoque…', 'Conferindo saldos…', 'Validando inventário…'];
    case 'movements':
      return ['Lendo movimentações…', 'Conferindo entradas…', 'Finalizando diagnóstico…'];
    case 'marketplace':
      return ['Varrendo canais…', 'Conferindo sync…', 'Finalizando leitura…'];
    case 'integrations':
      return ['Verificando integrações…', 'Conferindo webhooks…', 'Finalizando varredura…'];
    case 'conference':
    case 'picking':
      return ['Varrendo conferência…', 'Conferindo separação…', 'Finalizando leitura…'];
    case 'operational':
      return ['Lendo operação…', 'Conferindo pendências…', 'Finalizando varredura…'];
    case 'activities':
      return ['Varrendo atividades…', 'Conferindo alertas…', 'Finalizando leitura…'];
    case 'settings':
      return ['Verificando configurações…', 'Conferindo permissões…', 'Finalizando varredura…'];
    case 'dashboard':
      return ['Lendo visão geral…', 'Conferindo KPIs…', 'Finalizando diagnóstico…'];
    case 'reports':
      return ['Varrendo relatórios…', 'Conferindo métricas…', 'Finalizando leitura…'];
    case 'global':
    default:
      return ['Iniciando varredura…', 'Conferindo consistência…', 'Finalizando diagnóstico…'];
  }
}

export const XRAY_SCAN_PHRASE_MS = 2600;
export const XRAY_SCAN_TOTAL_MS = XRAY_SCAN_PHRASE_MS * 3 + 600;

/** Rota padrão para corrigir problemas desta seção ao clicar no card. */
export function getXRayContextDefaultUrl(context: XRayPageContext): string {
  switch (context) {
    case 'products':
      return '/app/products';
    case 'stock':
      return '/app/inventory';
    case 'movements':
      return '/app/movements';
    case 'marketplace':
      return '/app/marketplace';
    case 'integrations':
      return '/app/integrations';
    case 'conference':
      return '/app/conference';
    case 'picking':
      return '/app/picking';
    case 'operational':
      return '/app/operacao';
    case 'activities':
      return '/app/atividades';
    case 'settings':
      return '/app/configuracoes';
    case 'reports':
      return '/app/reports';
    case 'dashboard':
      return '/app';
    case 'global':
    default:
      return '/app';
  }
}
