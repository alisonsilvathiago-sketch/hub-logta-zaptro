import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../shared'),
    },
  },
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: true,
    origin: 'http://localhost:5173',
    /** Abre o navegador em http://localhost:5173 ao rodar npm run dev. */
    open: 'http://localhost:5173/login',
    hmr: {
      host: 'localhost',
      protocol: 'ws',
    },
  },
  preview: {
    port: 4173,
    host: 'localhost',
    strictPort: true,
    origin: 'http://localhost:4173',
    open: 'http://localhost:4173/',
  },
  define: {
    __APP_RELEASE__: JSON.stringify(`operacional-${Date.now()}`),
  },
});
