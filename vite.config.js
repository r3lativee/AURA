import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // allow specific ngrok host (or use a wildcard)
    allowedHosts: [
      '5e19-2409-40e6-8-c999-a040-feae-db25-ec67.ngrok-free.app',
      // alternatively, to allow all ngrok-free.app subdomains:
      '.ngrok-free.app'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
});
