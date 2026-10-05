import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cpSync } from 'node:fs';
import { resolve } from 'node:path';

// Build each standalone tool with shared material controls while preserving
// its public URL and locally served image/QR assets.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        homepage: resolve('index.html'),
        peel: resolve('nanobanana-peel/index.html'),
        purify: resolve('texpurify/index.html'),
        qrstamp: resolve('qrstamp/index.html'),
      },
    },
  },
  plugins: [react(), tailwindcss(), {
    name: 'existing-static-sites',
    closeBundle() {
      for (const entry of ['images', 'qrstamp/assets', 'qrstamp/vendor', 'publications.json', 'projects.json']) {
        cpSync(resolve(entry), resolve('dist', entry), { recursive: true });
      }
    },
  }],
  base: '/',
});
