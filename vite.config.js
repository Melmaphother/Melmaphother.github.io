import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cpSync } from 'node:fs';
import { resolve } from 'node:path';

// Preserve the existing standalone tools and image URLs in the static export.
export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'existing-static-sites',
    closeBundle() {
      for (const entry of ['images', 'nanobanana-peel', 'texpurify', 'qrstamp', 'publications.json', 'projects.json']) {
        cpSync(resolve(entry), resolve('dist', entry), { recursive: true });
      }
    },
  }],
  base: '/',
});
