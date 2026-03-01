import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, 'src/renderer'),
  base: './',
  build: {
    outDir: path.join(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(__dirname, 'src/renderer/index.html'),
    },
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src/renderer'),
    },
  },
});
