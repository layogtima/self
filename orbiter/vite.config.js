import { resolve } from 'path';
import { defineConfig } from 'vite';

// Multi-page: one gallery hub + one entry per ship variant. Add a ship by
// dropping ships/<name>/index.html + src/ and listing it here.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        hub: resolve(__dirname, 'index.html'),
        carrier: resolve(__dirname, 'ships/carrier/index.html'),
        monolith: resolve(__dirname, 'ships/monolith/index.html'),
      },
    },
  },
});
