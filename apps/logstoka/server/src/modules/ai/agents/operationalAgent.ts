import type { SupabaseClient } from '@supabase/supabase-js';
import type { LogstokaConfig } from '../../../config.js';
import { buildRagContext } from '../dataContext.js';
import { detectIntents, extractSkuHint } from '../intentRouter.js';
import { chatOllama, type OllamaChatTurn } from '../ollamaService.js';
import { buildLogstokaSystemPrompt } from '../systemPrompt.js';

export type OperationalChatParams = {
  message: string;
  history?: OllamaChatTurn[];
  screen?: string;
  userName?: string;
  companyName?: string;
};

export async function runOperationalChat(
  cfg: LogstokaConfig,
  admin: SupabaseClient,
  companyId: string,
  params: OperationalChatParams,
) {
  const intents = detectIntents(params.message);
  const skuHint = extractSkuHint(params.message);
  const ragContext = await buildRagContext(admin, companyId, intents, skuHint);

  const systemPrompt = buildLogstokaSystemPrompt({
    companyName: params.companyName,
    userName: params.userName,
    screen: params.screen,
    ragContext,
  });

  const reply = await chatOllama(cfg, {
    systemPrompt,
    userMessage: params.message,
    history: params.history,
  });

  return {
    reply,
    intents,
    agents: intents,
    model: process.env.LOGSTOKA_OLLAMA_MODEL?.trim() || 'llama3.2',
  };
}

export async function generateDailyBriefing(
  cfg: LogstokaConfig,
  admin: SupabaseClient,
  companyId: string,
) {
  const ragContext = await buildRagContext(admin, companyId, ['daily_summary', 'stock', 'replenishment'], null);
  const systemPrompt = buildLogstokaSystemPrompt({ ragContext });
  const reply = await chatOllama(cfg, {
    systemPrompt,
    userMessage:
      'Gera um resumo operacional diário curto (3-5 frases) com entradas, saídas, devoluções, avarias, produto mais movimentado e alertas de estoque mínimo.',
  });
  return reply;
}
