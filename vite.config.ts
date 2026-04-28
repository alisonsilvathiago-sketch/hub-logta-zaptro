import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: 'localhost',
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@hub': path.resolve(__dirname, './src/hub'),
      '@apps': path.resolve(__dirname, './src/apps'),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
  }
});
