import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: 'localhost',
    strictPort: true,
    proxy: {
      '/api/ai': {
        target: 'http://108.174.151.98:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai/, ''),
      }
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
