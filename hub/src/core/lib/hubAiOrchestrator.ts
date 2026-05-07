/**
 * 🧠 HUB MASTER - AI INTEGRAL ORCHESTRATOR & GATEWAY ENTRYPOINT
 * 
 * Aggregates and exports all enterprise-grade modular services under a single,
 * backward-compatible interface.
 */

// 1. Export Types
export * from './ai/types';

// 2. Export Shared Memory Vault
export { SHARED_MEMORY_VAULT, updateSharedMemory, formatMemoryContext } from './ai/memory/sharedVault';

// 3. Export System Personalities & Behavior Prompts
export { SYSTEM_PERSONALITIES } from './ai/personalities/systemPrompts';

// 4. Export Ollama Provider Logic
export { generateText, pingOllama } from './ai/providers/ollamaProvider';

// 5. Export Diagnostics & Health Checks
export { runDiagnostics } from './ai/health/healthCheck';

// 6. Export Central Gateway & Telemetry Control
export { dispatchToAiGateway, GATEWAY_TELEMETRY } from './ai/gateway/orchestrator';

// 7. Export Environmental Constants
export { OLLAMA_CONFIG } from './ai/config/ollama.config';

// 8. Export Playbooks & Deploy Scripts
export { INSTALLATION_PLAYBOOK } from './ai/utils/scripts';
