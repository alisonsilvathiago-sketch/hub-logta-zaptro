/// <reference types="vite/client" />

/** Substituído em build por `vite.config.ts` → `define` (commit / deployment Vercel). */
declare const __APP_RELEASE__: string;

interface ImportMetaEnv {
  readonly VITE_APP_URL?: string;
  readonly VITE_PORT?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_ZAPTRO_MAIL_API_URL?: string;
  readonly VITE_EVOLUTION_API_URL?: string;
  readonly VITE_EVOLUTION_BASE_URL?: string;
  readonly VITE_EVOLUTION_API_KEY?: string;
  readonly VITE_EVOLUTION_INSTANCE_API_KEY?: string;
  readonly VITE_EVOLUTION_INSTANCE?: string;
  readonly VITE_EVOLUTION_API_MODE?: string;
  readonly VITE_EVOLUTION_USE_EDGE?: string;
  readonly VITE_DEV_REGISTER_EMAIL?: string;
  readonly VITE_DEV_REGISTER_PASSWORD?: string;
  readonly VITE_DEV_REGISTER_FIRST_NAME?: string;
  readonly VITE_DEV_REGISTER_LAST_NAME?: string;
  readonly VITE_OLLAMA_ENABLED?: string;
  readonly VITE_OLLAMA_MODEL?: string;
  readonly VITE_OLLAMA_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
