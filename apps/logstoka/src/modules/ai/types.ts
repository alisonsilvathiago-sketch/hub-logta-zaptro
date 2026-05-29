export type AiChatTurn = { role: 'user' | 'assistant' | 'system'; content: string };

export type AiChatResponse = {
  reply: string;
  intents?: string[];
  agents?: string[];
  model?: string;
};

export const AI_QUICK_PROMPTS = [
  'Quantas saídas tivemos hoje?',
  'Quais produtos estão abaixo do estoque mínimo?',
  'Resumo operacional de hoje',
  'Quais produtos estão parados há 90 dias?',
  'Existe divergência no inventário?',
  'Sugestões de reposição',
] as const;

export const AI_AGENT_LABELS: Record<string, string> = {
  stock: 'Estoque',
  movements: 'Movimentações',
  returns: 'Devoluções',
  inventory: 'Inventário',
  replenishment: 'Reposição',
  imports: 'Importação',
  analytics: 'Gestão',
  daily_summary: 'Resumo diário',
  general: 'Operacional',
};
