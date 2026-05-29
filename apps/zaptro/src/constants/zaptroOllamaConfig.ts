/**
 * Ollama — VPS confirmada (VPS-15317843 · AlmaLinux 9.7).
 * Browser dev usa proxy Vite `/ollama-api` → OLLAMA_PROXY_TARGET.
 */

export const ZAPTRO_OLLAMA_VPS_HOST = '108.174.151.98';

export const ZAPTRO_OLLAMA_VPS_PORT = 11434;

export const ZAPTRO_OLLAMA_VPS_LABEL = 'VPS-15317843';

export const ZAPTRO_OLLAMA_DEFAULT_MODEL = 'llama3.2';

/** Modelo instalado na VPS (ollama list). */
export const ZAPTRO_OLLAMA_VPS_MODEL_TAG = 'llama3.2:latest';

export const ZAPTRO_OLLAMA_VPS_BASE_URL = `http://${ZAPTRO_OLLAMA_VPS_HOST}:${ZAPTRO_OLLAMA_VPS_PORT}`;

/** Proxy relativo no dev (Vite → VPS). */
export const ZAPTRO_OLLAMA_DEV_PROXY_PATH = '/ollama-api';

export const ZAPTRO_OLLAMA_TAGS_URL = `${ZAPTRO_OLLAMA_VPS_BASE_URL}/api/tags`;

export const ZAPTRO_OLLAMA_CHAT_URL = `${ZAPTRO_OLLAMA_VPS_BASE_URL}/api/chat`;
