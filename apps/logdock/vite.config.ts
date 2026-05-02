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
      '@core': path.resolve(__dirname, '../../hub/src/core'),
    },
  },
  /** `npm run dev` → http://localhost:5176 (LogDock App). */
  server: {
    host: 'localhost',
    port: 5176,
    origin: 'http://localhost:5176',
    hmr: {
      host: 'localhost',
      port: 5176,
    },
    open: '/',
    headers: {
      'Cache-Control': 'no-store',
    },
    strictPort: true,
  },

  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom')) return 'react-dom'
          if (id.includes('node_modules/react/') || id.includes('node_modules\\react\\')) return 'react'
          if (id.includes('node_modules/react-router')) return 'react-router'
          if (id.includes('node_modules/recharts')) return 'recharts'
        },
      },
    },
  },
})
// Force Vite server restart to clear resolution cache.
