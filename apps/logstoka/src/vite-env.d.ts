/// <reference types="vite/client" />

declare const __APP_RELEASE__: string;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_LOGSTOKA_API_URL: string;
  readonly VITE_LOGSTOKA_API_PUBLIC_URL: string;
  readonly VITE_HUB_APP_URL: string;
  readonly VITE_LOGSTOKA_APP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
