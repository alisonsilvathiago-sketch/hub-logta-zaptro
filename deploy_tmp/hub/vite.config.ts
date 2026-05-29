import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  /** `npm run dev` → http://localhost:5175 */
  server: {
    port: 5175,
    host: 'localhost',
    origin: 'http://localhost:5175',
    hmr: {
      host: 'localhost',
      port: 5175,
    },
    strictPort: true,
    proxy: {
      '/api/ai': {
        target: 'http://108.174.151.98:11434/api/generate',
        changeOrigin: true,
        rewrite: (path) => '',
      },
      /** API SendGrid (`apps/zaptro/server/`) — em `.env.local`: `VITE_ZAPTRO_MAIL_API_URL=/zaptro-mail-api` */
      '/zaptro-mail-api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zaptro-mail-api/, ''),
      },
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
      '@core': path.resolve(__dirname, './src/core'),
      '@hub': path.resolve(__dirname, './src/hub'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    chunkSizeWarningLimit: 2000,
  }
});
