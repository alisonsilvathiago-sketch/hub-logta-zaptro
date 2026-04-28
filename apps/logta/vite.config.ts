import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const appRelease =
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  `local-${new Date().toISOString().slice(0, 19)}`

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_RELEASE__: JSON.stringify(appRelease),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../shared'),
    },
  },
  /** `npm run dev` → http://localhost:5173 (Logta SaaS). */
  server: {
    host: 'localhost',
    port: 5173,
    /** URLs absolutas do dev server e recursos gerados apontam para localhost. */
    origin: 'http://localhost:5173',
    hmr: {
      host: 'localhost',
      port: 5173,
    },
    open: '/',
    /** Evita o browser servir bundle antigo em HMR (atualizações “não aparecem”). */
    headers: {
      'Cache-Control': 'no-store',
    },
    strictPort: true,
    proxy: {
      '/supabase-api': {
        target: 'https://zvqsqcxtowqoyqxjapoq.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase-api/, ''),
      }
    }
  },

  preview: {
    host: 'localhost',
    port: 4173,
    origin: 'http://localhost:4173',
    strictPort: false,
  },

  build: {
    /** Main bundle still holds most pages; vendor split above keeps shared deps smaller. */
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom')) return 'react-dom'
          if (id.includes('node_modules/react/') || id.includes('node_modules\\react\\')) return 'react'
          if (id.includes('node_modules/react-router')) return 'react-router'
          if (id.includes('node_modules/recharts')) return 'recharts'
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) return 'maps'
        },
      },
    },
  },
})
