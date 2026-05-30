export type AiChatTurn = { role: 'user' | 'assistant' | 'system'; content: string };

export type AiChatResponse = {
  reply: string;
  intents?: string[];
  agents?: string[];
  model?: string;
};

export {
  AI_AGENT_LABELS,
  AI_INICIO_EXAMPLES,
  AI_QUICK_PROMPTS,
  LOGSTOKA_AI_BRAND,
  LOGSTOKA_AI_MODEL,
  LOGSTOKA_AI_TAGLINE,
  aiEngineStatusLabel,
  buildAiWelcomeMessage,
  buildInicioHeroSubtitle,
} from './constants';
