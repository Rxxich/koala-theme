import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' - сайт можно положить в любую папку (GitHub Pages, свой хостинг, просто открыть dist)
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5178, strictPort: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 900 }
});
