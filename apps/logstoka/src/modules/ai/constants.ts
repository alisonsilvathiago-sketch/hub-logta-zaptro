export const LOGSTOKA_AI_BRAND = 'LogStoka IA';
export const LOGSTOKA_AI_MODEL = 'Llama 3.2';
export const LOGSTOKA_AI_TAGLINE = 'Motor principal de inteligência';

export const AI_QUICK_PROMPTS = [
  'Qual produto mais vendeu este mês?',
  'Quais produtos estão parados há mais de 90 dias?',
  'Qual loja vendeu mais?',
  'Quais produtos precisam de reposição?',
  'Existe divergência de estoque?',
  'Resumo operacional de hoje',
] as const;

export const AI_INICIO_EXAMPLES = [
  'Quantas saídas tivemos hoje?',
  'Quais produtos estão abaixo do estoque mínimo?',
  'Sugestões de reposição',
] as const;

export const AI_AGENT_LABELS: Record<string, string> = {
  stock: 'Estoque',
  movements: 'Movimentações',
  returns: 'Devoluções',
  inventory: 'Inventário',
  replenishment: 'Reposição',
  imports: 'Documentos',
  analytics: 'Análise & vendas',
  integrations: 'Integrações',
  products: 'Produtos & cadastro',
  daily_summary: 'Resumo diário',
  general: 'Operacional',
};

export function aiEngineStatusLabel(online: boolean | null): string {
  if (online === null) return 'conectando…';
  if (online) return 'motor activo';
  return 'reconectando…';
}

export function buildAiWelcomeMessage(firstName: string, online: boolean | null): string {
  const status =
    online === false
      ? ' Estou a reconectar ao motor Llama 3.2 — já pode perguntar; consulto os dados do sistema assim que a ligação estabilizar.'
      : '';

  return `Olá, ${firstName}! Sou o assistente global LogStoka — motor principal de inteligência (Llama 3.2).${status}

Consulto dados reais de estoque, movimentações, inventário, reposição, vendas, documentos e integrações multicanal. O que precisa?`;
}

export function buildInicioHeroSubtitle(displayName: string): string {
  return `Olá, ${displayName}. A Llama 3.2 é o motor principal de inteligência do LogStoka — pergunte sobre operações, cadastros, reposição, inventário, documentos ou integrações.`;
}
