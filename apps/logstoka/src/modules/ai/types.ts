export type AiChatTurn = { role: 'user' | 'assistant' | 'system'; content: string };

export type AiChatResponse = {
  reply: string;
  intents?: string[];
  agents?: string[];
  model?: string;
};

export type AiAttachmentLink = {
  label: string;
  path: string;
};

export type AiAttachmentAnalysisResponse = {
  reply: string;
  links: AiAttachmentLink[];
  agents?: string[];
  file_kind?: string;
};

export {
  AI_AGENT_LABELS,
  AI_INICIO_EXAMPLES,
  LOGSTOKA_AI_BRAND,
  LOGSTOKA_AI_MODEL,
  LOGSTOKA_AI_TAGLINE,
  aiAnalyzingLabel,
  aiEmptyReplyMessage,
  aiEngineStatusLabel,
  aiUnavailableShort,
  aiUnavailableWithDashboardHint,
  buildAiWelcomeMessage,
  buildInicioHeroSubtitle,
} from './constants';
