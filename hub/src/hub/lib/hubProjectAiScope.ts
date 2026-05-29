/**
 * Escopo do assistente IA por rota/projeto no Hub Master.
 * Cada produto tem personalidade e histórico de chat separados (sessionStorage).
 */

import type { AISystemId } from '@core/lib/ai/types';

export type HubProjectAiScopeId =
  | 'logta'
  | 'zaptro'
  | 'logdock'
  | 'logstoka'
  | 'whatsapp'
  | 'ia-gateway'
  | 'master';

export type HubProjectAiScope = {
  id: HubProjectAiScopeId;
  label: string;
  shortLabel: string;
  /** Personalidade no gateway Ollama */
  systemId: AISystemId;
  color: string;
  placeholder: string;
  ideas: string[];
  /** Rota padrão ao trocar produto no seletor do drawer */
  defaultPath: string;
};

const SCOPES: Record<HubProjectAiScopeId, HubProjectAiScope> = {
  logta: {
    id: 'logta',
    label: 'Logta — IA',
    shortLabel: 'Logta',
    systemId: 'logta',
    color: '#0061FF',
    defaultPath: '/master/logta',
    placeholder: 'Pergunte sobre Logta (ERP, frota, fretes, operações)…',
    ideas: [
      'Resumo da operação logística de hoje',
      'Como cadastrar um novo frete?',
      'Status da frota e veículos ativos',
      'Relatório de entregas em atraso',
      'Módulos financeiros do Logta',
    ],
  },
  zaptro: {
    id: 'zaptro',
    label: 'Zaptro — IA',
    shortLabel: 'Zaptro',
    systemId: 'zaptro',
    color: '#7C3AED',
    defaultPath: '/master/zaptro',
    placeholder: 'Pergunte sobre Zaptro (WhatsApp, CRM, motoristas, frota)…',
    ideas: [
      'Resumo do funil comercial de hoje',
      'Como abrir a inbox do WhatsApp?',
      'Atalhos para motoristas e frota',
      'Orçamentos e vendas no Zaptro',
      'Faturamento e assinaturas',
    ],
  },
  logdock: {
    id: 'logdock',
    label: 'LogDock — IA',
    shortLabel: 'LogDock',
    systemId: 'logdock',
    color: '#0061FF',
    defaultPath: '/master/logdock',
    placeholder: 'Pergunte sobre LogDock (storage, transferências, buckets)…',
    ideas: [
      'Resumo de consumo de storage hoje',
      'Como configurar um novo bucket?',
      'Status das transferências ativas',
      'Planos e billing LogDock',
      'Tenants com maior uso de disco',
    ],
  },
  logstoka: {
    id: 'logstoka',
    label: 'LogStoka — IA',
    shortLabel: 'LogStoka',
    systemId: 'master',
    color: '#059669',
    defaultPath: '/master/logstoka',
    placeholder: 'Pergunte sobre LogStoka (WMS, estoque, armazéns, picking)…',
    ideas: [
      'Resumo de movimentações de estoque hoje',
      'Como importar NF-e XML?',
      'Fluxo de devoluções e triagem',
      'Transferências entre armazéns',
      'Alertas de reposição',
    ],
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp — IA',
    shortLabel: 'WhatsApp',
    systemId: 'whatsapp',
    color: '#25D366',
    defaultPath: '/master/whatsapp',
    placeholder: 'Pergunte sobre WhatsApp (canais, QR, créditos, inbox)…',
    ideas: [
      'Status dos gateways WhatsApp',
      'Como gerar QR de conexão?',
      'Créditos e saldo por tenant',
      'Resumo de conversas nas últimas 24h',
      'Motor Evolution e instâncias',
    ],
  },
  'ia-gateway': {
    id: 'ia-gateway',
    label: 'IA Gateway — IA',
    shortLabel: 'IA Gateway',
    systemId: 'ia-gateway',
    color: '#8B5CF6',
    defaultPath: '/master/ia-gateway',
    placeholder: 'Pergunte sobre modelos, tokens e orquestração de IA…',
    ideas: [
      'Consumo de tokens por produto hoje',
      'Quais modelos estão ativos?',
      'Latência média do gateway',
      'Créditos IA por tenant',
      'Como adicionar um novo provedor LLM?',
    ],
  },
  master: {
    id: 'master',
    label: 'Hub Master — IA',
    shortLabel: 'Hub',
    systemId: 'master',
    color: '#1a1d21',
    defaultPath: '/master',
    placeholder: 'Pergunte sobre o painel master (visão geral)…',
    ideas: [
      'Resumo do ecossistema hoje',
      'Empresas ativas no Hub',
      'Atalhos para Logta, Zaptro e LogDock',
      'O que verificar no billing?',
      'Como abrir configurações globais?',
    ],
  },
};

/** Produtos do seletor "ALISON's projects" — cada um com chat isolado */
export const HUB_PRODUCT_AI_SCOPES: HubProjectAiScope[] = [
  SCOPES.logta,
  SCOPES.zaptro,
  SCOPES.logdock,
  SCOPES.logstoka,
  SCOPES.whatsapp,
  SCOPES['ia-gateway'],
];

export function resolveHubProjectAiScope(pathname: string): HubProjectAiScope {
  if (pathname.includes('/master/logta')) return SCOPES.logta;
  if (pathname.includes('/master/zaptro')) return SCOPES.zaptro;
  if (pathname.includes('/master/logdock')) return SCOPES.logdock;
  if (pathname.includes('/master/logstoka')) return SCOPES.logstoka;
  if (pathname.includes('/master/whatsapp')) return SCOPES.whatsapp;
  if (pathname.includes('/master/ia-gateway')) return SCOPES['ia-gateway'];
  return SCOPES.master;
}

export function hubProjectAiStorageKey(scopeId: HubProjectAiScopeId): string {
  return `hub_project_ai_chat_v1_${scopeId}`;
}
