/**
 * 🏥 IA HEALTH CHECK & NODE DIAGNOSTICS
 * 
 * Tests and reports connection status for all active AI engine locations.
 */

import { pingOllama } from '../providers/ollamaProvider';
import { OLLAMA_CONFIG } from '../config/ollama.config';

export interface DiagnosticsReport {
  vps: 'online' | 'offline';
  local: 'online' | 'offline';
  timestamp: string;
}

/**
 * Perform a full diagnostic check on the AI Gateway nodes.
 */
export async function runDiagnostics(vpsUrl: string = '/api/ai'): Promise<DiagnosticsReport> {
  const [vpsOk, localOk] = await Promise.all([
    pingOllama(vpsUrl),
    pingOllama(OLLAMA_CONFIG.local)
  ]);

  return {
    vps: vpsOk ? 'online' : 'offline',
    local: localOk ? 'online' : 'offline',
    timestamp: new Date().toLocaleTimeString()
  };
}
