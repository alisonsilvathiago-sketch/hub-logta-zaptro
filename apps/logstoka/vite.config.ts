import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const appRelease =
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  `local-${new Date().toISOString().slice(0, 19)}`;

export default defineConfig({
  define: {
    __APP_RELEASE__: JSON.stringify(appRelease),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../shared'),
    },
  },
  server: {
    host: 'localhost',
    port: 5177,
    origin: 'http://localhost:5177',
    strictPort: true,
    open: 'http://localhost:5177/',
    proxy: {
      '/logstoka-api': {
        target: process.env.LOGSTOKA_API_PROXY || 'http://localhost:8788',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/logstoka-api/, ''),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom')) return 'react-dom';
          if (id.includes('node_modules/react/')) return 'react';
          if (id.includes('node_modules/react-router')) return 'react-router';
          if (id.includes('node_modules/recharts')) return 'recharts';
        },
      },
    },
  },
});
