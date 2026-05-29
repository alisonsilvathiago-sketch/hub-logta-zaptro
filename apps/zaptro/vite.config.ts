import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

/** Evita ReferenceError em produção: `main.tsx` usa __APP_RELEASE__ no log de deploy. */
const appRelease =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
  process.env.VITE_APP_RELEASE ||
  'local'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  /** Onde o `npm run dev` encaminha `/ollama-api` — use IP da VPS se Ollama não estiver no Mac. */
  const ollamaProxyTarget =
    env.OLLAMA_PROXY_TARGET?.trim() ||
    env.VITE_OLLAMA_PROXY_TARGET?.trim() ||
    'http://127.0.0.1:11434'

  const evolutionProxyTarget = (() => {
    const raw = env.VITE_EVOLUTION_API_URL?.trim() || 'http://localhost:8080'
  /** VITE_EVOLUTION_API_URL é o VPS — nunca a URL da Edge Supabase (quebraria o proxy). */
    if (/supabase\.co\/functions\/v1/i.test(raw)) {
      return 'https://evolution.zaptro.com.br'
    }
    return raw
  })()

  const supabaseProxyTarget =
    env.VITE_SUPABASE_URL?.trim() || 'https://rrjnkmgkhbtapumgmhhr.supabase.co'

  return {
    define: {
      __APP_RELEASE__: JSON.stringify(appRelease),
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@evolution': path.resolve(__dirname, './evolution-api'),
        '@shared': path.resolve(__dirname, '../../shared'),
      },
    },
    server: {
      host: 'localhost',
      port: 5174,
      strictPort: true,
      allowedHosts: true,
      headers: {
        'Cache-Control': 'no-store',
      },
      proxy: {
        /** REST Supabase (opcional) — mesmo projeto que VITE_SUPABASE_URL */
        '/supabase-api': {
          target: supabaseProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/supabase-api/, ''),
        },
        /** API SendGrid (`server/`) — `VITE_ZAPTRO_MAIL_API_URL=/zaptro-mail-api` */
        '/zaptro-mail-api': {
          target: 'http://127.0.0.1:8787',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/zaptro-mail-api/, ''),
        },
        /**
         * Browser → /ollama-api → OLLAMA_PROXY_TARGET (VPS ou Mac).
         * Não use 127.0.0.1 no browser se Ollama estiver na VPS.
         */
        '/ollama-api': {
          target: ollamaProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ollama-api/, ''),
        },
        /** Evolution WhatsApp — browser usa /evolution-api; Vite → VITE_EVOLUTION_API_URL */
        '/evolution-api': {
          target: evolutionProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/evolution-api/, ''),
          configure: (proxy, _options) => {
            proxy.on('error', (err, req, res) => {
              const logMsg = `[${new Date().toISOString()}] Proxy Error: ${err.message}\nStack: ${err.stack}\nURL: ${req.url}\n\n`;
              try {
                fs.appendFileSync(path.resolve(__dirname, './proxy_error.log'), logMsg);
              } catch (e) {
                console.error('Failed to write proxy error log:', e);
              }
            });
          },
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return
            if (id.includes('recharts')) return 'vendor-recharts'
            if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-maps'
            if (id.includes('@supabase')) return 'vendor-supabase'
            if (id.includes('@tanstack')) return 'vendor-virtual'
            if (id.includes('react-router')) return 'vendor-react'
            if (id.includes('react-dom')) return 'vendor-react'
            if (id.includes('/react/') && id.includes('node_modules/react/')) return 'vendor-react'
          },
        },
      },
    },
  }
})
