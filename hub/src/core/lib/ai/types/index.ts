/**
 * 🏷️ ENTERPRISE AI GATEWAY - TYPES & SCHEMAS
 * 
 * Standardized interfaces for multi-provider, multi-agent AI operations.
 */

export type AISystemId =
  | 'crm'
  | 'logistica'
  | 'financeiro'
  | 'atendimento'
  | 'whatsapp'
  | 'master'
  | 'logta'
  | 'zaptro'
  | 'logdock'
  | 'ia-gateway';

export interface AISystemRequest {
  systemId: AISystemId;
  prompt: string;
  userId?: string;
  variables?: Record<string, string>;
}

export interface AIResponse {
  success: boolean;
  systemId: AISystemId;
  agentName: string;
  response: string;
  latencyMs: number;
  tokensUsed: number;
  timestamp: string;
  provider: 'Ollama-VPS' | 'Ollama-Local' | 'Mock' | string;
}

export interface AISystemConfig {
  id: AISystemId;
  name: string;
  agentName: string;
  icon: string;
  color: string;
  systemPrompt: string;
  activeMemoryKeys: string[];
}

export interface GatewayTelemetry {
  totalCalls: number;
  callsBySystem: Record<string, number>;
  activeProvider: string;
}
