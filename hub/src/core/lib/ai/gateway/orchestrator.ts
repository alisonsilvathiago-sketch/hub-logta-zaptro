/**
 * 🎛️ ENTERPRISE AI ORCHESTRATOR & GATEWAY ROUTER
 * 
 * Central controller coordinating multi-agent prompting, global shared memory,
 * and high-availability automated failover (VPS -> Local -> Clean Error).
 */

import { AISystemRequest, AIResponse, GatewayTelemetry } from '../types';
import { SYSTEM_PERSONALITIES } from '../personalities/systemPrompts';
import { formatMemoryContext } from '../memory/sharedVault';
import { generateText } from '../providers/ollamaProvider';
import { OLLAMA_CONFIG } from '../config/ollama.config';

// 🧠 Blazing-fast in-memory prompt cache to enable instant responses for repeated operational requests
const PROMPT_CACHE: Map<string, { response: string; provider: 'Ollama-VPS' | 'Ollama-Local' | 'Cache' }> = new Map();

// 📊 Telemetry and Usage Logs Tracker
export const GATEWAY_TELEMETRY: GatewayTelemetry = {
  totalCalls: 0,
  callsBySystem: {
    crm: 0,
    logistica: 0,
    financeiro: 0,
    atendimento: 0,
    whatsapp: 0,
    master: 0,
    logta: 0,
    zaptro: 0,
    logdock: 0,
    'ia-gateway': 0,
  },
  activeProvider: 'Ollama-VPS'
};

/**
 * Route and dispatch prompt request through the intelligent gateway with failover.
 */
export async function dispatchToAiGateway(
  req: AISystemRequest,
  ollamaUrl: string = '/api/ai',
  model: string = OLLAMA_CONFIG.model
): Promise<AIResponse> {
  const startTime = Date.now();
  const config = SYSTEM_PERSONALITIES[req.systemId] || SYSTEM_PERSONALITIES.master;

  // Check Intelligent Cache for instantaneous response
  const cacheKey = `${req.systemId}:${req.prompt.trim().toLowerCase()}`;
  if (PROMPT_CACHE.has(cacheKey)) {
    const cached = PROMPT_CACHE.get(cacheKey)!;
    const latencyMs = 2; // Blazing fast simulated cache retrieval latency
    return {
      success: true,
      systemId: req.systemId,
      agentName: `${config.agentName} (Cache)`,
      response: cached.response,
      latencyMs,
      tokensUsed: 0,
      timestamp: new Date().toLocaleTimeString(),
      provider: 'Cache'
    };
  }

  // 1. Compile Shared Memory Context
  const memoryContext = formatMemoryContext(config.activeMemoryKeys);

  // 2. Build Enriched Prompt
  const enrichedPrompt = `
SYSTEM BEHAVIOR INSTRUCTION:
${config.systemPrompt}

GLOBAL REPOSITORY SHARED MEMORY VAULT CONTEXT:
${memoryContext}

USER REQUEST:
${req.prompt}
`;

  let responseText = '';
  let providerUsed: 'Ollama-VPS' | 'Ollama-Local' = 'Ollama-VPS';

  // STEP 1: Try Primary Production VPS Gateway
  try {
    responseText = await generateText(ollamaUrl, enrichedPrompt, model);
    providerUsed = 'Ollama-VPS';
  } catch (vpsErr) {
    console.warn(`[AI Gateway]: VPS/Proxy failed at ${ollamaUrl}. Attempting local developer Mac fallback...`, vpsErr);
    
    // STEP 2: Try Local Developer Fallback (Ollama local on port 11434)
    try {
      responseText = await generateText(`${OLLAMA_CONFIG.local}/api/generate`, enrichedPrompt, model);
      providerUsed = 'Ollama-Local';
    } catch (localErr) {
      console.error("[AI Gateway Failover]: Both production VPS and local Ollama are offline.", localErr);
    }
  }

  const latencyMs = Date.now() - startTime;

  // STEP 3: Return Successful Response
  if (responseText) {
    const tokensUsed = Math.floor(responseText.length / 4) + 120; // Estimated

    // Record Telemetry
    GATEWAY_TELEMETRY.totalCalls += 1;
    GATEWAY_TELEMETRY.callsBySystem[req.systemId] = (GATEWAY_TELEMETRY.callsBySystem[req.systemId] || 0) + 1;
    GATEWAY_TELEMETRY.activeProvider = providerUsed;

    // Cache the result for subsequent repeated queries
    PROMPT_CACHE.set(cacheKey, { response: responseText, provider: providerUsed });

    return {
      success: true,
      systemId: req.systemId,
      agentName: `${config.agentName} (${providerUsed === 'Ollama-VPS' ? 'VPS' : 'Localhost'})`,
      response: responseText,
      latencyMs,
      tokensUsed,
      timestamp: new Date().toLocaleTimeString(),
      provider: providerUsed
    };
  }

  // STEP 4: Return Clean Network Failure
  return {
    success: false,
    systemId: req.systemId,
    agentName: config.agentName,
    response: "Erro ao conectar com a IA. Tanto a VPS de produção quanto o Ollama Local (localhost) estão offline.",
    latencyMs,
    tokensUsed: 0,
    timestamp: new Date().toLocaleTimeString(),
    provider: 'Mock'
  };
}
