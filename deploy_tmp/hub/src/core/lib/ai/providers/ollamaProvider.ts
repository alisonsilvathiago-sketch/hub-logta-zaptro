/**
 * 🔌 OLLAMA PROVIDER INTEGRATION
 * 
 * Handles physical API calls to the Ollama endpoints (production or local).
 * Includes standalone health checks to verify availability.
 */

import { OLLAMA_CONFIG } from '../config/ollama.config';

export interface OllamaPayload {
  model: string;
  prompt: string;
  stream: boolean;
}

export interface OllamaResult {
  success: boolean;
  response: string;
  source: 'Ollama-VPS' | 'Ollama-Local';
}

/**
 * Send generating prompt to a target Ollama base URL.
 */
export async function generateText(baseUrl: string, prompt: string, model: string = OLLAMA_CONFIG.model): Promise<string> {
  const target = baseUrl.includes('108.174.151.98') ? `${baseUrl}/api/generate` : baseUrl;
  
  const response = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.response;
}

/**
 * Ping an Ollama endpoint to verify if it is online.
 */
export async function pingOllama(baseUrl: string, model: string = OLLAMA_CONFIG.model): Promise<boolean> {
  try {
    const target = baseUrl.includes('108.174.151.98') ? `${baseUrl}/api/generate` : baseUrl;
    const response = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: 'ping', stream: false }),
      signal: AbortSignal.timeout(3000) // 3 seconds timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}
